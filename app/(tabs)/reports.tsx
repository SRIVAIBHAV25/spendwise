import { format } from 'date-fns';
import { router } from 'expo-router';
import { Text } from 'heroui-native';
import { Award, CalendarRange, ChartPie, Receipt, TrendingUp } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { type BreakdownItem, BreakdownList } from '@/components/BreakdownList';
import { CalendarGrid } from '@/components/CalendarGrid';
import { DailyBars } from '@/components/charts/DailyBars';
import { DonutChart } from '@/components/charts/DonutChart';
import { EmptyState } from '@/components/EmptyState';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { useCategoryMeta } from '@/hooks/useCategoryMeta';
import { useDbQuery } from '@/hooks/useDbQuery';
import { PAYMENT_META, UPI_META } from '@/lib/catalog';
import { formatCurrency, formatDate, formatPercent, fromDayKey, percentOf } from '@/lib/format';
import { loadMonthReport, type MonthReport } from '@/lib/queries';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAppColors } from '@/lib/theme';
import { PAYMENT_TYPES, type PaymentType, UPI_TYPES, type UpiType } from '@/lib/types';

const INITIAL: MonthReport = {
  total: 0,
  count: 0,
  averagePerDay: 0,
  weekTotal: 0,
  highestDay: null,
  largest: null,
  categories: [],
  payments: [],
  upiTypes: [],
  daily: [],
};

interface InsightRowProps {
  label: string;
  value: string;
  caption?: string;
}

function InsightRow({ label, value, caption }: InsightRowProps) {
  return (
    <View
      className="flex-row items-center justify-between gap-3 py-2"
      accessible
      accessibilityLabel={`${label}: ${value}${caption ? `, ${caption}` : ''}`}
    >
      <Text type="body-sm" color="muted" className="flex-1">
        {label}
      </Text>
      <View className="items-end">
        <Text type="body-sm" weight="semibold">
          {value}
        </Text>
        {caption ? (
          <Text type="body-xs" color="muted">
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const colors = useAppColors();
  const [month, setMonth] = useState(() => new Date());
  const resolveCategory = useCategoryMeta();
  const showEmptyUpiTypes = useSettingsStore((state) => state.showEmptyUpiTypes);

  const load = useCallback(() => loadMonthReport(month), [month]);
  const { data, isLoading, error } = useDbQuery(load, INITIAL);

  const categoryItems: BreakdownItem[] = useMemo(
    () =>
      data.categories.map((group) => {
        const meta = resolveCategory(group.label);
        return {
          key: group.label,
          label: group.label,
          value: group.total,
          count: group.count,
          color: meta.color,
          icon: meta.icon,
        };
      }),
    [data.categories, resolveCategory],
  );

  const paymentItems: BreakdownItem[] = useMemo(() => {
    const byLabel = new Map(data.payments.map((group) => [group.label, group]));
    return PAYMENT_TYPES.filter((type: PaymentType) => byLabel.has(type)).map(
      (type: PaymentType) => {
        const group = byLabel.get(type);
        return {
          key: type,
          label: type,
          value: group?.total ?? 0,
          count: group?.count ?? 0,
          color: PAYMENT_META[type].color,
          icon: PAYMENT_META[type].icon,
        };
      },
    );
  }, [data.payments]);

  const upiItems: BreakdownItem[] = useMemo(() => {
    const byLabel = new Map(data.upiTypes.map((group) => [group.label, group]));
    return UPI_TYPES.filter((type: UpiType) => showEmptyUpiTypes || byLabel.has(type)).map(
      (type: UpiType) => {
        const group = byLabel.get(type);
        return {
          key: type,
          label: type,
          value: group?.total ?? 0,
          count: group?.count ?? 0,
          color: UPI_META[type].color,
        };
      },
    );
  }, [data.upiTypes, showEmptyUpiTypes]);

  const upiTotal = useMemo(
    () => data.upiTypes.reduce((sum, group) => sum + group.total, 0),
    [data.upiTypes],
  );

  const dailyBars = useMemo(() => {
    const map = new Map(data.daily.map((day) => [day.dayKey, day.total]));
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
      const dayKey = format(date, 'yyyy-MM-dd');
      return { key: dayKey, label: `${index + 1}`, value: map.get(dayKey) ?? 0 };
    });
  }, [data.daily, month]);

  const dailyTotals = useMemo(() => {
    const result: Record<string, number> = {};
    for (const day of data.daily) result[day.dayKey] = day.total;
    return result;
  }, [data.daily]);

  const maxDayTotal = useMemo(
    () => data.daily.reduce((max, day) => Math.max(max, day.total), 0),
    [data.daily],
  );

  const openDay = useCallback((dayKey: string) => {
    router.push({ pathname: '/day/[dayKey]', params: { dayKey } });
  }, []);

  const topCategory = data.categories[0] ?? null;
  const topPayment = useMemo(
    () =>
      data.payments.reduce<{ label: string; count: number } | null>(
        (best, group) => (!best || group.count > best.count ? group : best),
        null,
      ),
    [data.payments],
  );

  const hasData = data.count > 0;

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader title="Reports" subtitle="Where your money went" />

      <ScrollView contentContainerClassName="px-5 pb-10 gap-4" showsVerticalScrollIndicator={false}>
        <MonthSwitcher
          month={month}
          onChange={setMonth}
          caption={isLoading ? 'Loading…' : `${data.count} transactions`}
        />

        {error ? (
          <EmptyState
            icon={ChartPie}
            title="Could not build this report"
            description={error}
            tone="danger"
          />
        ) : !hasData && !isLoading ? (
          <EmptyState
            icon={ChartPie}
            title="No data for this month"
            description="Add an expense or pick another month to see your breakdowns."
            actionLabel="Add Expense"
            onAction={() => router.push('/expense/new')}
          />
        ) : (
          <>
            <View className="flex-row gap-3">
              <StatCard
                label="Total spent"
                value={formatCurrency(data.total)}
                icon={TrendingUp}
                iconColor={colors.accent}
              />
              <StatCard
                label="Average / day"
                value={formatCurrency(data.averagePerDay)}
                icon={CalendarRange}
                iconColor={colors.success}
              />
            </View>

            <View className="flex-row gap-3">
              <StatCard
                label="Transactions"
                value={`${data.count}`}
                icon={Receipt}
                iconColor={colors.warning}
              />
              <StatCard label="This week" value={formatCurrency(data.weekTotal)} icon={Award} />
            </View>

            <View className="border-border bg-surface rounded-3xl border p-4">
              <SectionHeader title="Daily spending" caption="Every day of the selected month" />
              <DailyBars data={dailyBars} className="mt-4" />
            </View>

            <View className="gap-2">
              <SectionHeader
                title="Month calendar"
                caption="Tap any day to open its expenses"
                className="px-1"
              />
              <CalendarGrid
                month={month}
                totals={dailyTotals}
                maxTotal={maxDayTotal}
                onSelectDay={openDay}
              />
            </View>

            <View className="border-border bg-surface rounded-3xl border p-4">
              <SectionHeader title="Category breakdown" caption="Share of the month's spending" />
              {categoryItems.length > 0 ? (
                <>
                  <View className="items-center py-4">
                    <DonutChart
                      data={categoryItems.map((item) => ({
                        key: item.key,
                        value: item.value,
                        color: item.color,
                      }))}
                      accessibilityLabel={`Category chart. Largest: ${
                        topCategory
                          ? `${topCategory.label} ${formatCurrency(topCategory.total)}`
                          : 'none'
                      }`}
                    >
                      <Text type="body-xs" color="muted">
                        Total
                      </Text>
                      <Text type="h5" weight="bold">
                        {formatCurrency(data.total)}
                      </Text>
                    </DonutChart>
                  </View>
                  <BreakdownList items={categoryItems} total={data.total} />
                </>
              ) : (
                <Text type="body-sm" color="muted" className="py-4">
                  No categories to show yet.
                </Text>
              )}
            </View>

            <View className="border-border bg-surface rounded-3xl border p-4">
              <SectionHeader title="Payment breakdown" caption="How you paid" />
              {paymentItems.length > 0 ? (
                <>
                  <View className="items-center py-4">
                    <DonutChart
                      size={150}
                      thickness={20}
                      data={paymentItems.map((item) => ({
                        key: item.key,
                        value: item.value,
                        color: item.color,
                      }))}
                      accessibilityLabel="Payment method chart"
                    >
                      <Text type="body-xs" color="muted">
                        Methods
                      </Text>
                      <Text type="h5" weight="bold">
                        {`${paymentItems.length}`}
                      </Text>
                    </DonutChart>
                  </View>
                  <BreakdownList items={paymentItems} total={data.total} />
                </>
              ) : (
                <Text type="body-sm" color="muted" className="py-4">
                  No payments recorded this month.
                </Text>
              )}
            </View>

            {upiItems.length > 0 ? (
              <View className="border-border bg-surface rounded-3xl border p-4">
                <SectionHeader
                  title="UPI breakdown"
                  caption={`${formatCurrency(upiTotal)} paid through UPI apps`}
                />
                <BreakdownList className="mt-4" items={upiItems} total={upiTotal} />
              </View>
            ) : null}

            <View className="border-border bg-surface rounded-3xl border p-4">
              <SectionHeader title="Spending insights" />
              <View className="mt-1">
                <InsightRow
                  label="Highest spending day"
                  value={
                    data.highestDay ? formatCurrency(data.highestDay.total) : formatCurrency(0)
                  }
                  caption={
                    data.highestDay
                      ? formatDate(fromDayKey(data.highestDay.dayKey).getTime())
                      : 'No spending yet'
                  }
                />
                <InsightRow
                  label="Largest transaction"
                  value={data.largest ? formatCurrency(data.largest.amount) : formatCurrency(0)}
                  caption={
                    data.largest
                      ? `${data.largest.category} · ${formatDate(data.largest.transactionDate)}`
                      : undefined
                  }
                />
                <InsightRow
                  label="Most expensive category"
                  value={topCategory ? topCategory.label : '—'}
                  caption={
                    topCategory
                      ? `${formatCurrency(topCategory.total)} · ${formatPercent(
                          percentOf(topCategory.total, data.total),
                        )}`
                      : undefined
                  }
                />
                <InsightRow
                  label="Most-used payment type"
                  value={topPayment ? topPayment.label : '—'}
                  caption={
                    topPayment
                      ? `${topPayment.count} ${topPayment.count === 1 ? 'transaction' : 'transactions'}`
                      : undefined
                  }
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
