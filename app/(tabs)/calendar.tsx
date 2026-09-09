import { isSameMonth } from 'date-fns';
import { router } from 'expo-router';
import { Text } from 'heroui-native';
import { CalendarDays } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { CalendarGrid } from '@/components/CalendarGrid';
import { EmptyState } from '@/components/EmptyState';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatCard } from '@/components/StatCard';
import { useDbQuery } from '@/hooks/useDbQuery';
import { formatCurrency, toDayKey } from '@/lib/format';
import { type CalendarMonthData, loadCalendarMonth } from '@/lib/queries';
import { useAppColors, withAlpha } from '@/lib/theme';

const INITIAL: CalendarMonthData = {
  byDay: {},
  total: 0,
  count: 0,
  maxDayTotal: 0,
  activeDays: 0,
};

export default function CalendarScreen() {
  const colors = useAppColors();
  const [month, setMonth] = useState(() => new Date());

  const load = useCallback(() => loadCalendarMonth(month), [month]);
  const { data, isLoading, error } = useDbQuery(load, INITIAL);

  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [dayKey, day] of Object.entries(data.byDay)) result[dayKey] = day.total;
    return result;
  }, [data.byDay]);

  const openDay = useCallback((dayKey: string) => {
    router.push({ pathname: '/day/[dayKey]', params: { dayKey } });
  }, []);

  const selectedDayKey = isSameMonth(month, new Date()) ? toDayKey(new Date()) : null;
  const averagePerActiveDay = data.activeDays > 0 ? data.total / data.activeDays : 0;

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader title="Calendar" subtitle="Tap a day to see its expenses" />

      <ScrollView contentContainerClassName="px-5 pb-10 gap-4" showsVerticalScrollIndicator={false}>
        <MonthSwitcher
          month={month}
          onChange={setMonth}
          caption={isLoading ? 'Loading…' : `${data.count} transactions`}
        />

        <View className="flex-row gap-3">
          <StatCard label="Month total" value={formatCurrency(data.total)} />
          <StatCard
            label="Days with spending"
            value={`${data.activeDays}`}
            caption={
              data.activeDays > 0 ? `${formatCurrency(averagePerActiveDay)} avg` : 'No spending yet'
            }
          />
        </View>

        {error ? (
          <EmptyState
            icon={CalendarDays}
            title="Could not load this month"
            description={error}
            tone="danger"
          />
        ) : (
          <>
            <CalendarGrid
              month={month}
              totals={totals}
              maxTotal={data.maxDayTotal}
              selectedDayKey={selectedDayKey}
              onSelectDay={openDay}
            />

            <View className="flex-row items-center gap-2 px-1">
              <Text type="body-xs" color="muted">
                Less
              </Text>
              {[0.12, 0.24, 0.36, 0.48].map((alpha) => (
                <View
                  key={alpha}
                  className="h-3 w-6 rounded-full"
                  style={{ backgroundColor: withAlpha(colors.accent, alpha) }}
                />
              ))}
              <Text type="body-xs" color="muted">
                More
              </Text>
            </View>

            {data.count === 0 && !isLoading ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing recorded this month"
                description="Add an expense or switch to another month to see your spending."
                actionLabel="Add Expense"
                onAction={() => router.push('/expense/new')}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
