import { Button, Text } from 'heroui-native';
import { Fingerprint, Lock, ScanFace } from 'lucide-react-native';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Numpad } from '@/components/Numpad';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import {
  authenticateWithBiometrics,
  getBiometricSupport,
  hasPin,
  PIN_LENGTH,
  verifyPin,
} from '@/lib/security';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAppColors } from '@/lib/theme';

interface LockScreenProps {
  onUnlock: () => void;
}

/** Stable keys for the PIN placeholder dots. */
const PIN_SLOTS = Array.from({ length: PIN_LENGTH }, (_, index) => `pin-slot-${index}`);

function LockScreen({ onUnlock }: LockScreenProps) {
  const colors = useAppColors();
  const biometricEnabled = useSettingsStore((state) => state.biometricEnabled);

  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const [isFaceId, setIsFaceId] = useState(false);

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  const runBiometrics = useCallback(async () => {
    const support = await getBiometricSupport();
    if (!support.enrolled) return;
    const result = await authenticateWithBiometrics('Unlock Daily Expense Tracker');
    if (result.success) {
      successFeedback();
      onUnlock();
      return;
    }
    setError(result.message ?? null);
  }, [onUnlock]);

  // No PIN stored (or biometrics allowed): try the device prompt straight away.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [stored, support] = await Promise.all([hasPin(), getBiometricSupport()]);
      if (cancelled) return;
      if (support.enrolled && biometricEnabled) {
        setBiometricLabel(support.label);
        setIsFaceId(support.label.toLowerCase().includes('face'));
      }
      if (!stored) {
        onUnlock();
        return;
      }
      if (support.enrolled && biometricEnabled) void runBiometrics();
    })();
    return () => {
      cancelled = true;
    };
  }, [biometricEnabled, onUnlock, runBiometrics]);

  const reject = useCallback(
    (message: string) => {
      errorFeedback();
      setError(message);
      setDigits('');
      shake.set(
        withSequence(
          withTiming(-10, { duration: 55 }),
          withTiming(10, { duration: 55 }),
          withTiming(-6, { duration: 55 }),
          withTiming(0, { duration: 55 }),
        ),
      );
    },
    [shake],
  );

  const submit = useCallback(
    async (pin: string) => {
      setChecking(true);
      try {
        const valid = await verifyPin(pin);
        if (valid) {
          successFeedback();
          onUnlock();
          return;
        }
        reject('That PIN is not right. Try again.');
      } catch {
        reject('Could not check your PIN. Try again.');
      } finally {
        setChecking(false);
      }
    },
    [onUnlock, reject],
  );

  const handleKey = useCallback(
    (key: string) => {
      if (checking) return;
      setError(null);
      if (key === 'backspace') {
        setDigits((current) => current.slice(0, -1));
        return;
      }
      if (!/^\d$/.test(key)) return;
      setDigits((current) => {
        if (current.length >= PIN_LENGTH) return current;
        const next = current + key;
        if (next.length === PIN_LENGTH) void submit(next);
        return next;
      });
    },
    [checking, submit],
  );

  const BiometricIcon = isFaceId ? ScanFace : Fingerprint;

  return (
    <View className="bg-background pb-safe-offset-4 pt-safe-offset-6 flex-1 px-6">
      <View className="flex-1 items-center justify-center">
        <View className="bg-surface-secondary h-16 w-16 items-center justify-center rounded-3xl">
          <Lock color={colors.accent} size={28} />
        </View>
        <Text type="h4" weight="semibold" className="mt-5">
          Enter your PIN
        </Text>
        <Text type="body-sm" color="muted" align="center" className="mt-1">
          Your expenses stay locked on this device.
        </Text>

        <AnimatedView className="mt-8 flex-row gap-4" style={shakeStyle}>
          {PIN_SLOTS.map((slot, index) => {
            const filled = index < digits.length;
            return (
              <View
                key={slot}
                className="h-4 w-4 rounded-full border-2"
                style={{
                  borderColor: filled ? colors.accent : colors.border,
                  backgroundColor: filled ? colors.accent : 'transparent',
                }}
              />
            );
          })}
        </AnimatedView>

        <View className="h-10 justify-center">
          {error ? (
            <Text type="body-sm" align="center" style={{ color: colors.danger }}>
              {error}
            </Text>
          ) : null}
        </View>
      </View>

      <Numpad showDecimal={false} onKeyPress={handleKey} onClear={() => setDigits('')} />

      {biometricLabel ? (
        <Button variant="ghost" className="mt-3" onPress={() => void runBiometrics()}>
          <BiometricIcon color={colors.accent} size={18} />
          <Button.Label>{`Unlock with ${biometricLabel}`}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}

/**
 * Wraps the app in the optional PIN/biometric lock. The navigator stays mounted
 * behind an opaque overlay so navigation state survives a lock.
 */
export function LockGate({ children }: { children: ReactNode }) {
  const hydrated = useSettingsStore((state) => state.hydrated);
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  // Derived during render: lock exactly once, the first time settings finish
  // hydrating, instead of reacting to it inside an effect.
  const [wasHydrated, setWasHydrated] = useState(false);
  const [locked, setLocked] = useState(false);
  if (hydrated && !wasHydrated) {
    setWasHydrated(true);
    if (appLockEnabled) setLocked(true);
  }
  const wasBackgrounded = useRef(false);

  // Re-lock when the app returns from the background.
  useEffect(() => {
    const handleChange = (status: AppStateStatus) => {
      if (status === 'active') {
        if (wasBackgrounded.current && useSettingsStore.getState().appLockEnabled) setLocked(true);
        wasBackgrounded.current = false;
        return;
      }
      if (status === 'background') wasBackgrounded.current = true;
    };
    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, []);

  return (
    <View className="flex-1" style={{ flex: 1 }}>
      {children}
      {locked ? (
        <View className="absolute inset-0">
          <LockScreen onUnlock={() => setLocked(false)} />
        </View>
      ) : null}
    </View>
  );
}
