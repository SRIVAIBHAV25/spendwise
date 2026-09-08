import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Circle, Svg } from '@/components/ui/primitives/Svg';
import { useAppColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface DonutSlice {
  key: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  /** Rendered centred inside the ring. */
  children?: ReactNode;
  className?: string;
  accessibilityLabel?: string;
}

/** Lightweight SVG donut: one stroked circle per slice, no chart dependency. */
export function DonutChart({
  data,
  size = 168,
  thickness = 22,
  children,
  className,
  accessibilityLabel,
}: DonutChartProps) {
  const colors = useAppColors();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const slices = data.filter((slice) => slice.value > 0);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  let offset = 0;

  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceTertiary}
          strokeWidth={thickness}
          fill="none"
        />
        {total > 0
          ? slices.map((slice) => {
              const length = (slice.value / total) * circumference;
              // Shift by a quarter turn so the first slice starts at 12 o'clock.
              const dashOffset = circumference / 4 - offset;
              offset += length;
              return (
                <Circle
                  key={slice.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${length} ${Math.max(0, circumference - length)}`}
                  strokeDashoffset={dashOffset}
                  fill="none"
                />
              );
            })
          : null}
      </Svg>

      {children ? <View className="absolute items-center justify-center">{children}</View> : null}
    </View>
  );
}
