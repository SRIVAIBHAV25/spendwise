import { Button, Switch, Text } from 'heroui-native';
import { Fingerprint, KeyRound, Lock, ScanFace, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Numpad } from '@/components/Numpad';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsCard, SettingsRow } from '@/components/SettingsRow';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import {
  type BiometricSupport,
  clearPin,
  getBiometricSupport,
  hasPin,
  PIN_LENGTH,
  savePin,
} from '@/lib/security';
import { useSettingsStore } from '@/lib/stores/settings';
import { showToast } from '@/lib/stores/toast';
import { useAppColors } from '@/lib/theme';

type PinStep = 'create' | 'confirm';

/** Stable keys for the PIN placeholder dots. */
const PIN_SLOTS = Array.from({ length: PIN_LENGTH }, (_, index) => `pin-slot-${index}`);

export default function SecuritySettingsScreen() {
  const colors = useAppColors();
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  const setAppLockEnabled = useSettingsStore((state) => state.setAppLockEnabled);
  const biometricEnabled = useSettingsStore((state) => state.biometricEnabled);
  const setBiometricEnabled = useSettingsStore((state) => state.setBiometricEnabled);

  const [pinSet, setPinSet] = useState<boolean | null>(null);
  const [support, setSupport] = useState<BiometricSupport | null>(null);
  const [step, setStep] = useState<PinStep | null>(null);
  const [digits, setDigits] = useState('');
  const [firstEntry, setFirstEntry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  /** Set when the PIN flow was started by switching App Lock on. */
  const [enableAfterSetup, setEnableAfterSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [stored, biometrics] = await Promise.all([hasPin(), getBiometricSupport()]);
      if (cancelled) return;
      setPinSet(stored);
      setSupport(biometrics);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCreate = (thenEnable: boolean) => {
    setEnableAfterSetup(thenEnable);
    setStep('create');
    setDigits('');
    setFirstEntry('');
    setError(null);
  };

  const finish = useCallback(
    async (pin: string) => {
      try {
        await savePin(pin);
        setPinSet(true);
        setStep(null);
        setDigits('');
        setFirstEntry('');
        successFeedback();
        showToast('PIN saved');
        if (enableAfterSetup) setAppLockEnabled(true);
      } catch {
        errorFeedback();
        setError('Could not save your PIN. Please try again.');
      }
    },
    [enableAfterSetup, setAppLockEnabled],
  );

  const handleKey = useCallback(
    (key: string) => {
      setError(null);
      if (key === 'backspace') {
        setDigits((current) => current.slice(0, -1));
        return;
      }
      if (!/^\d$/.test(key)) return;
      setDigits((current) => {
        if (current.length >= PIN_LENGTH) return current;
        const next = current + key;
        if (next.length === PIN_LENGTH) {
          if (step === 'create') {
            setFirstEntry(next);
            setStep('confirm');
            return '';
          }
          if (next === firstEntry) {
            void finish(next);
            return next;
          }
          errorFeedback();
          setError('Those PINs did not match. Start again.');
          setFirstEntry('');
          setStep('create');
          return '';
        }
        return next;
      });
    },
    [finish, firstEntry, step],
  );

  const onRemovePin = async () => {
    try {
      await clearPin();
      setPinSet(false);
      setAppLockEnabled(false);
      setBiometricEnabled(false);
      showToast('PIN removed');
    } catch {
      showToast('Could not remove your PIN. Please try again.', 'error');
    }
  };

  const biometricLabel = support?.label ?? 'Biometrics';
  const BiometricIcon = biometricLabel.toLowerCase().includes('face') ? ScanFace : Fingerprint;
  const biometricReady = Boolean(support?.enrolled);

  if (step) {
    const isConfirm = step === 'confirm';
    return (
      <View className="bg-background pt-safe flex-1">
        <ScreenHeader
          title={isConfirm ? 'Confirm your PIN' : 'Create a PIN'}
          subtitle={`${PIN_LENGTH} digits, stored securely on this device`}
          backIcon="close"
          backFallback="/(tabs)/settings"
        />

        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-surface-secondary h-16 w-16 items-center justify-center rounded-3xl">
            <KeyRound color={colors.accent} size={28} />
          </View>
          <View className="mt-8 flex-row gap-4">
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
          </View>
          <View className="h-10 justify-center">
            {error ? (
              <Text type="body-sm" align="center" style={{ color: colors.danger }}>
                {error}
              </Text>
            ) : (
              <Text type="body-sm" color="muted" align="center">
                {isConfirm ? 'Enter the same PIN again' : 'Pick something you will remember'}
              </Text>
            )}
          </View>
        </View>

        <View className="pb-safe-offset-4 px-5">
          <Numpad showDecimal={false} onKeyPress={handleKey} onClear={() => setDigits('')} />
          <Button
            variant="ghost"
            className="mt-3"
            onPress={() => {
              setStep(null);
              setDigits('');
              setFirstEntry('');
              setError(null);
            }}
            accessibilityLabel="Cancel PIN setup"
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader
        title="Security"
        subtitle="Lock the app with a PIN or biometrics"
        backFallback="/(tabs)/settings"
      />

      <ScrollView contentContainerClassName="px-5 pb-10 gap-5" showsVerticalScrollIndicator={false}>
        <SettingsCard title="App lock">
          <SettingsRow
            icon={Lock}
            label="App Lock"
            description={
              pinSet === false
                ? 'Create a PIN to switch this on'
                : 'Ask for a PIN when the app opens'
            }
            right={
              <Switch
                isSelected={appLockEnabled}
                onSelectedChange={(next) => {
                  if (next && !pinSet) {
                    startCreate(true);
                    return;
                  }
                  setAppLockEnabled(next);
                }}
              >
                <Switch.Thumb />
              </Switch>
            }
          />
          <View className="bg-border h-px" />
          <SettingsRow
            icon={KeyRound}
            label={pinSet ? 'Change PIN' : 'Create PIN'}
            description={`${PIN_LENGTH} digits, never stored as plain text`}
            onPress={() => startCreate(false)}
          />
        </SettingsCard>

        <SettingsCard title="Biometrics">
          <SettingsRow
            icon={BiometricIcon}
            label={`Unlock with ${biometricLabel}`}
            description={
              biometricReady
                ? 'Use your device biometrics first, PIN as backup'
                : 'No biometrics enrolled on this device'
            }
            right={
              <Switch
                isSelected={biometricEnabled && biometricReady}
                isDisabled={!biometricReady || !pinSet}
                onSelectedChange={setBiometricEnabled}
              >
                <Switch.Thumb />
              </Switch>
            }
          />
        </SettingsCard>

        {pinSet ? (
          <SettingsCard>
            <SettingsRow
              icon={Trash2}
              label="Remove PIN"
              description="Turns off app lock and biometrics"
              tone="danger"
              onPress={() => setIsRemoveOpen(true)}
            />
          </SettingsCard>
        ) : null}

        <Text type="body-xs" color="muted" className="px-1">
          Your PIN is saved as a salted hash in the device keychain. Expenses are never uploaded
          anywhere.
        </Text>
      </ScrollView>

      <ConfirmDialog
        isOpen={isRemoveOpen}
        title="Remove your PIN?"
        description="App lock and biometric unlock will be switched off. Your expenses are not affected."
        confirmLabel="Remove"
        onOpenChange={setIsRemoveOpen}
        onConfirm={() => {
          void onRemovePin();
        }}
      />
    </View>
  );
}
