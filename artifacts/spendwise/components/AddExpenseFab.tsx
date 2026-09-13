import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { tapFeedback } from '@/lib/haptics';
import { useAppColors, withAlpha } from '@/lib/theme';

/** How far the circle rises above the tab bar. */
const LIFT = 22;

/**
 * The single entry point for recording an expense: a large circular button that
 * sits in the middle of the tab bar, between Calendar and Reports.
 */
export function AddExpenseFab() {
  const colors = useAppColors();
  const { width } = useWindowDimensions();
  const size = width < 360 ? 56 : 62;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <View
      className="flex-1 items-center justify-start"
      style={{ minWidth: size + 8, overflow: 'visible' }}
    >
      <Pressable
        onPress={() => {
          tapFeedback();
          router.push('/expense/new');
        }}
        onPressIn={() => {
          scale.set(withTiming(0.92, { duration: 90 }));
        }}
        onPressOut={() => {
          scale.set(withTiming(1, { duration: 160 }));
        }}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        hitSlop={10}
        style={{ marginTop: -LIFT }}
      >
        <AnimatedView
          className="items-center justify-center"
          style={[
            animatedStyle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.accent,
              borderWidth: 4,
              borderColor: colors.surface,
              shadowColor: withAlpha(colors.foreground, 0.45),
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: Platform.OS === 'ios' ? 0.22 : 0,
              shadowRadius: 12,
              elevation: 12,
            },
          ]}
        >
          <Plus color={colors.accentForeground} size={size < 60 ? 26 : 30} strokeWidth={2.5} />
        </AnimatedView>
      </Pressable>
    </View>
  );
}
