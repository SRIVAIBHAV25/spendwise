import { Text } from 'heroui-native';
import { View } from 'react-native';

import { formatCompactCurrency } from '@/lib/format';
import { useAppColors, withAlpha } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface DailyBar {
  key: string;
  label: string;
  value: number;
}

interface DailyBarsProps {
  data: DailyBar[];
  height?: number;
  color?: string;
  /** Every nth label is shown to keep dense months readable. */
  labelEvery?: number;
  className?: string;
}

/** Day-by-day spending bars for the month overview. */
export function DailyBars({
  data,
  height = 120,
  color,
  labelEvery = 5,
  className,
}: DailyBarsProps) {
  const colors = useAppColors();
  const tint = color ?? colors.accent;
  const max = data.reduce((peak, bar) => Math.max(peak, bar.value), 0);
  const peakIndex = data.findIndex((bar) => bar.value === max && max > 0);

  return (
    <View className={cn('w-full', className)}>
      <View className="flex-row items-end justify-between" style={{ height }}>
        {data.map((bar, index) => {
          const ratio = max > 0 ? bar.value / max : 0;
          const barHeight = bar.value > 0 ? Math.max(4, ratio * height) : 2;
          const isPeak = index === peakIndex;

          return (
            <View
              key={bar.key}
              className="flex-1 items-center justify-end px-px"
              accessible
              accessibilityLabel={`${bar.label}: ${formatCompactCurrency(bar.value)}`}
            >
              <View
                className="w-full rounded-full"
                style={{
                  height: barHeight,
                  backgroundColor: bar.value > 0 ? (isPeak ? tint : withAlpha(tint, 0.45)) : colors.surfaceTertiary,
                }}
              />
            </View>
          );
        })}
      </View>

      <View className="mt-1.5 flex-row justify-between">
        {data.map((bar, index) => (
          <View key={`label-${bar.key}`} className="flex-1 items-center">
            {index === 0 || (index + 1) % labelEvery === 0 ? (
              <Text type="body-xs" color="muted" style={{ fontSize: 9 }}>
                {bar.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
