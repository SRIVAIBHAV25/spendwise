import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Text } from 'heroui-native';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { formatCompactCurrency, formatCurrency, formatDate, toDayKey } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { useAppColors, withAlpha } from '@/lib/theme';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarGridProps {
  month: Date;
  /** Day key (`yyyy-MM-dd`) to total spent that day. */
  totals: Record<string, number>;
  maxTotal: number;
  selectedDayKey?: string | null;
  onSelectDay: (dayKey: string) => void;
  className?: string;
}

/** Month grid where each day carries its spend, shaded by relative intensity. */
export function CalendarGrid({
  month,
  totals,
  maxTotal,
  selectedDayKey,
  onSelectDay,
  className,
}: CalendarGridProps) {
  const colors = useAppColors();

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  return (
    <View className={cn('border-border bg-surface rounded-3xl border p-2', className)}>
      <View className="flex-row pb-1">
        {WEEKDAYS.map((weekday) => (
          <View key={weekday} style={{ width: `${100 / 7}%` }} className="items-center py-1">
            <Text type="body-xs" color="muted">
              {weekday.slice(0, 1)}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const dayKey = toDayKey(day);
          const total = totals[dayKey] ?? 0;
          const inMonth = isSameMonth(day, month);
          const selected = selectedDayKey === dayKey;
          const today = isToday(day);
          const intensity = maxTotal > 0 && total > 0 ? Math.min(1, total / maxTotal) : 0;
          /**
           * Stepped shading keeps day text readable: the three lower steps stay
           * light enough for normal text, the top step is solid enough that the
           * label flips to the inverse color.
           */
          const level = intensity === 0 ? 0 : intensity <= 0.25 ? 1 : intensity <= 0.55 ? 2 : 3;
          const strong = level === 3;
          const shadeAlpha = level === 1 ? 0.12 : level === 2 ? 0.26 : 0.88;
          const contentColor =
            selected || strong
              ? colors.accentForeground
              : inMonth
                ? colors.foreground
                : colors.muted;

          return (
            <View key={dayKey} style={{ width: `${100 / 7}%` }} className="p-0.5">
              <Pressable
                onPress={() => {
                  tapFeedback();
                  onSelectDay(dayKey);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${formatDate(day.getTime())}, ${
                  total > 0 ? `spent ${formatCurrency(total)}` : 'no spending'
                }`}
                className={cn(
                  'min-h-[54px] items-center justify-center rounded-xl border px-0.5 py-1',
                  today && !selected ? 'border-accent' : 'border-transparent',
                )}
                style={{
                  backgroundColor: selected
                    ? colors.accent
                    : level > 0
                      ? withAlpha(colors.accent, shadeAlpha)
                      : 'transparent',
                  opacity: inMonth ? 1 : 0.4,
                }}
              >
                <Text
                  type="body-sm"
                  weight={today || selected || strong ? 'semibold' : 'medium'}
                  style={{ color: contentColor }}
                >
                  {day.getDate()}
                </Text>
                {total > 0 ? (
                  <Text
                    type="body-xs"
                    numberOfLines={1}
                    weight="semibold"
                    style={{ fontSize: 10, color: contentColor }}
                  >
                    {formatCompactCurrency(total)}
                  </Text>
                ) : (
                  <Text type="body-xs" color="muted" style={{ fontSize: 10 }}>
                    {'\u2013'}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
