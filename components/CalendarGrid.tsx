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
                  selected ? 'border-transparent' : today ? 'border-accent' : 'border-transparent',
                )}
                style={{
                  backgroundColor: selected
                    ? colors.accent
                    : intensity > 0
                      ? withAlpha(colors.accent, 0.1 + intensity * 0.32)
                      : 'transparent',
                  opacity: inMonth ? 1 : 0.35,
                }}
              >
                <Text
                  type="body-sm"
                  weight={today || selected ? 'semibold' : 'normal'}
                  style={selected ? { color: colors.accentForeground } : undefined}
                  className={!selected && !inMonth ? 'text-muted' : undefined}
                >
                  {day.getDate()}
                </Text>
                {total > 0 ? (
                  <Text
                    type="body-xs"
                    numberOfLines={1}
                    weight="medium"
                    style={{
                      fontSize: 10,
                      color: selected ? colors.accentForeground : colors.accent,
                    }}
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
