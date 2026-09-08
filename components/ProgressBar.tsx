import { useEffect } from 'react';
import { View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { useAppColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0 to 1; values above 1 are clamped so an over-budget bar stays full. */
  progress: number;
  color?: string;
  height?: number;
  className?: string;
  accessibilityLabel?: string;
}

export function ProgressBar({
  progress,
  color,
  height = 10,
  className,
  accessibilityLabel,
}: ProgressBarProps) {
  const colors = useAppColors();
  const target = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(target, { duration: 420 });
  }, [target, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${value.value * 100}%`,
  }));

  return (
    <View
      className={cn('w-full overflow-hidden rounded-full bg-surface-tertiary', className)}
      style={{ height }}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
    >
      <AnimatedView
        className="h-full rounded-full"
        style={[animatedStyle, { backgroundColor: color ?? colors.accent }]}
      />
    </View>
  );
}
