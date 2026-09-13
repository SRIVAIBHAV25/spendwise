import { Text } from 'heroui-native';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { useEffect } from 'react';
import { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { useToastStore } from '@/lib/stores/toast';
import { useAppColors } from '@/lib/theme';

const VISIBLE_MS = 2400;

/** Renders the active toast above every screen. Mounted once in the root layout. */
export function ToastHost() {
  const colors = useAppColors();
  const message = useToastStore((state) => state.message);
  const tone = useToastStore((state) => state.tone);
  const token = useToastStore((state) => state.token);
  const hide = useToastStore((state) => state.hide);

  useEffect(() => {
    if (!message) return undefined;
    const shownToken = token;
    const timer = setTimeout(() => {
      // Only hide the message this timer was started for.
      if (useToastStore.getState().token === shownToken) hide();
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, token, hide]);

  if (!message) return null;

  const tint = tone === 'error' ? colors.danger : colors.success;
  const Icon = tone === 'error' ? CircleAlert : CircleCheck;

  return (
    <AnimatedView
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={message}
      className="top-safe-offset-3 absolute inset-x-4 z-50 flex-row items-center gap-2.5 rounded-2xl px-4 py-3"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <Icon color={tint} size={20} />
      <Text type="body-sm" weight="medium" className="flex-1">
        {message}
      </Text>
    </AnimatedView>
  );
}
