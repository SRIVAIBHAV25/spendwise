import { router } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { CalendarClock, Plus, Receipt, Search, TrendingUp, Wallet } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { TransactionRow } from '@/components/TransactionRow';
import { useDbQuery } from '@/hooks/useDbQuery';
import { formatCurrency, formatPercent, monthLabel, percentOf } from '@/lib/format';
import { loadHomeData, type HomeData } from '@/lib/queries';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAppColors, withAlpha } from '@/lib/theme';
import type { Transaction } from '@/lib/types';

const INITIAL: HomeData = {
  monthTotal: 0,
  monthCount: 0,
  todayTotal: 0,
  todayCount: 0,
  weekTotal: 0,
  weekAveragePerDay: 0,
  recent: [],
  totalCount: 0,
};

export default function HomeScreen() {
  const colors = useAppColors();
  const budgetEnabled = useSettingsStore((state) => state.budgetEnabled);
  const budgetAmount = useSettingsStore((state) => state.budgetAmount);
  const thresholds = useSettingsStore((state) => state.thresholds);

  const load = useCallback(() => loadHomeData(6), []);
  const { data, isLoading, error } = useDbQuery(load, INITIAL);

  const openTransaction = useCallback((transaction: Transaction) => {
    router.push({ pathname: '/expense/[id]', params: { id: transaction.id } });
  }, []);

  const budgetProgress = budgetEnabled && budgetAmount > 0 ? data.monthTotal / budgetAmount : 0;
  const budgetPercent = percentOf(data.monthTotal, budgetAmount);
  const remaining = Math.max(0, budgetAmount - data.monthTotal);
  const crossed = thresholds.filter((threshold) => budgetPercent >= threshold);
  const highestCrossed = crossed.length > 0 ? Math.max(...crossed) : null;
  const budgetColor =
    budgetPercent >= 100 ? colors.danger : budgetPercent >= 75 ? colors.warning : colors.accent;

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader
        title="Daily Expense"
        subtitle={monthLabel(new Date())}
        right={
          <Pressable
            onPress={() => router.push('/history')}
            accessibilityRole="button"
            accessibilityLabel="Search transactions"
            hitSlop={8}
            className="active:bg-surface-secondary h-11 w-11 items-center justify-center rounded-full"
          >
            <Search color={colors.foreground} size={22} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerClassName="px-5 pb-10 gap-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="rounded-3xl border p-5"
          style={{ backgroundColor: colors.hero, borderColor: colors.heroBorder }}
          accessible
          accessibilityLabel={`Total spent in ${monthLabel(new Date())}: ${formatCurrency(data.monthTotal)}`}
        >
          <Text type="body-sm" style={{ color: withAlpha(colors.heroForeground, 0.72) }}>
            Total spent this month
          </Text>
          <Text
            type="h1"
            weight="bold"
            className="mt-1"
            style={{ color: colors.heroForeground }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(data.monthTotal)}
          </Text>

          <View className="mt-4 flex-row gap-3">
            <View
              className="flex-1 rounded-2xl px-3 py-2.5"
              style={{ backgroundColor: withAlpha(colors.heroForeground, 0.12) }}
            >
              <Text type="body-xs" style={{ color: withAlpha(colors.heroForeground, 0.78) }}>
                Today
              </Text>
              <Text
                type="body"
                weight="semibold"
                style={{ color: colors.heroForeground }}
                numberOfLines={1}
              >
                {formatCurrency(data.todayTotal)}
              </Text>
            </View>
            <View
              className="flex-1 rounded-2xl px-3 py-2.5"
              style={{ backgroundColor: withAlpha(colors.heroForeground, 0.12) }}
            >
              <Text type="body-xs" style={{ color: withAlpha(colors.heroForeground, 0.78) }}>
                Transactions
              </Text>
              <Text
                type="body"
                weight="semibold"
                style={{ color: colors.heroForeground }}
                numberOfLines={1}
              >
                {`${data.monthCount}`}
              </Text>
            </View>
          </View>
        </View>

        <Button
          size="lg"
          className="h-14 rounded-2xl"
          onPress={() => router.push('/expense/new')}
          accessibilityLabel="Add expense"
        >
          <Plus color={colors.accentForeground} size={20} />
          <Button.Label>Add Expense</Button.Label>
        </Button>

        <View className="flex-row gap-3">
          <StatCard
            label="Today"
            value={formatCurrency(data.todayTotal)}
            caption={`${data.todayCount} ${data.todayCount === 1 ? 'transaction' : 'transactions'}`}
            icon={Wallet}
            iconColor={colors.accent}
          />
          <StatCard
            label="This week"
            value={formatCurrency(data.weekTotal)}
            caption={`${formatCurrency(data.weekAveragePerDay)} avg/day`}
            icon={TrendingUp}
            iconColor={colors.success}
          />
        </View>

        {budgetEnabled && budgetAmount > 0 ? (
          <Pressable
            onPress={() => router.push('/settings/budget')}
            accessibilityRole="button"
            accessibilityLabel={`Monthly budget ${formatCurrency(budgetAmount)}, ${formatPercent(budgetPercent)} used`}
            className="border-border bg-surface active:bg-surface-secondary rounded-3xl border p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text type="body" weight="semibold">
                Monthly budget
              </Text>
              <Text type="body-sm" color="muted">
                {`${formatPercent(budgetPercent)} used`}
              </Text>
            </View>
            <ProgressBar
              progress={budgetProgress}
              color={budgetColor}
              className="mt-3"
              accessibilityLabel={`${formatPercent(budgetPercent)} of budget used`}
            />
            <View className="mt-3 flex-row justify-between">
              <Text type="body-xs" color="muted">
                {`Spent ${formatCurrency(data.monthTotal)}`}
              </Text>
              <Text type="body-xs" color="muted">
                {budgetAmount > data.monthTotal
                  ? `Remaining ${formatCurrency(remaining)}`
                  : `Over by ${formatCurrency(data.monthTotal - budgetAmount)}`}
              </Text>
            </View>
            {highestCrossed ? (
              <Text type="body-xs" className="mt-2" style={{ color: budgetColor }}>
                {highestCrossed >= 100
                  ? 'You have used your full budget for this month.'
                  : `You have passed ${highestCrossed}% of your budget.`}
              </Text>
            ) : null}
          </Pressable>
        ) : null}

        <View className="border-border bg-surface rounded-3xl border p-2 pt-4">
          <SectionHeader
            title="Recent transactions"
            caption={isLoading ? 'Loading…' : `${data.totalCount} recorded in total`}
            actionLabel={data.recent.length > 0 ? 'See all' : undefined}
            onAction={data.recent.length > 0 ? () => router.push('/history') : undefined}
            className="px-3 pb-1"
          />

          {error ? (
            <EmptyState
              icon={Receipt}
              title="Could not load expenses"
              description={error}
              tone="danger"
            />
          ) : data.recent.length === 0 && !isLoading ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Start tracking your spending by adding your first expense."
              actionLabel="Add Expense"
              onAction={() => router.push('/expense/new')}
            />
          ) : (
            <View className="pt-1">
              {data.recent.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onPress={openTransaction}
                />
              ))}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/calendar')}
          accessibilityRole="button"
          accessibilityLabel="Open spending calendar"
          className="border-border bg-surface active:bg-surface-secondary flex-row items-center gap-3 rounded-3xl border p-4"
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: withAlpha(colors.accent, 0.14) }}
          >
            <CalendarClock color={colors.accent} size={20} />
          </View>
          <View className="flex-1">
            <Text type="body" weight="medium">
              Spending calendar
            </Text>
            <Text type="body-xs" color="muted">
              See day by day totals for any month
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
