import { Text } from 'heroui-native';
import { Check, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { tapFeedback } from '@/lib/haptics';
import { useAppColors, withAlpha } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface SelectionCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
  /** Accent used when selected; defaults to the theme accent. */
  color?: string;
  /** `card` stacks the icon above the label, `chip` keeps a single row. */
  variant?: 'card' | 'chip';
  showCheck?: boolean;
  className?: string;
}

const DURATION = 180;

/**
 * Tap-to-select tile used for categories, payment types and UPI providers.
 * Replaces radio buttons with a large touch target and an animated fill.
 */
export function SelectionCard({
  label,
  selected,
  onPress,
  icon: Icon,
  color,
  variant = 'card',
  showCheck = false,
  className,
}: SelectionCardProps) {
  const colors = useAppColors();
  const tint = color ?? colors.accent;
  const selectedSurface = withAlpha(tint, 0.16);
  const surfaceColor = colors.surface;
  const borderColor = colors.border;

  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.set(withTiming(selected ? 1 : 0, { duration: DURATION }));
  }, [selected, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [surfaceColor, selectedSurface],
    ),
    borderColor: interpolateColor(progress.get(), [0, 1], [borderColor, tint]),
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      onPressIn={() => {
        scale.set(withTiming(0.96, { duration: 90 }));
      }}
      onPressOut={() => {
        scale.set(withTiming(1, { duration: 140 }));
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      className={className}
    >
      <AnimatedView
        className={cn(
          'border',
          variant === 'card'
            ? 'min-h-[86px] items-center justify-center gap-1.5 rounded-2xl px-2 py-3'
            : 'min-h-12 flex-row items-center justify-center gap-2 rounded-full px-4 py-3',
        )}
        style={animatedStyle}
      >
        {Icon ? (
          <Icon color={selected ? tint : colors.muted} size={variant === 'card' ? 22 : 18} />
        ) : null}
        <Text
          type={variant === 'card' ? 'body-xs' : 'body-sm'}
          weight={selected ? 'semibold' : 'medium'}
          numberOfLines={1}
          className={selected ? '' : 'text-muted'}
          style={selected ? { color: tint } : undefined}
        >
          {label}
        </Text>
        {showCheck && selected ? (
          <View className="absolute top-1.5 right-1.5">
            <Check color={tint} size={14} />
          </View>
        ) : null}
      </AnimatedView>
    </Pressable>
  );
}
