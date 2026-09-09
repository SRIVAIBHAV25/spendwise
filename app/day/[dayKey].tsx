import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'heroui-native';
import { Plus, Receipt } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionRow } from '@/components/TransactionRow';
import { useDbQuery } from '@/hooks/useDbQuery';
import { formatCurrency, formatDate, formatDayLabel, fromDayKey } from '@/lib/format';
import { type DayData, loadDay } from '@/lib/queries';
import { useAppColors, withAlpha } from '@/lib/theme';
import type { Transaction } from '@/lib/types';

const INITIAL: DayData = { transactions: [], total: 0, count: 0 };

export default function DayScreen() {
  const colors = useAppColors();
  const { dayKey } = useLocalSearchParams<{ dayKey: string }>();
  const timestamp = fromDayKey(dayKey).getTime();

  const load = useCallback(() => loadDay(dayKey), [dayKey]);
  const { data, isLoading, error } = useDbQuery(load, INITIAL);

  const openTransaction = useCallback((transaction: Transaction) => {
    router.push({ pathname: '/expense/[id]', params: { id: transaction.id } });
  }, []);

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader
        title={formatDayLabel(timestamp)}
        subtitle={formatDate(timestamp)}
        backFallback="/(tabs)/calendar"
        right={
          <Pressable
            onPress={() => router.push('/expense/new')}
            accessibilityRole="button"
            accessibilityLabel="Add expense"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: withAlpha(colors.accent, 0.14) }}
          >
            <Plus color={colors.accent} size={22} />
          </Pressable>
        }
      />

      <View className="mx-5 mb-3 rounded-3xl p-4" style={{ backgroundColor: colors.accent }}>
        <Text type="body-xs" style={{ color: withAlpha(colors.accentForeground, 0.85) }}>
          Spent on this day
        </Text>
        <Text
          type="h2"
          weight="bold"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color: colors.accentForeground }}
        >
          {formatCurrency(data.total)}
        </Text>
        <Text type="body-xs" style={{ color: withAlpha(colors.accentForeground, 0.85) }}>
          {`${data.count} ${data.count === 1 ? 'transaction' : 'transactions'}`}
        </Text>
      </View>

      <FlatList
        data={data.transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionRow transaction={item} onPress={openTransaction} className="mx-3" />
        )}
        contentContainerClassName="px-2 pb-10"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          error ? (
            <EmptyState
              icon={Receipt}
              title="Could not load this day"
              description={error}
              tone="danger"
            />
          ) : isLoading ? null : (
            <EmptyState
              icon={Receipt}
              title="No expenses on this day"
              description="Add one now and it will show up here straight away."
              actionLabel="Add Expense"
              onAction={() => router.push('/expense/new')}
            />
          )
        }
      />
    </View>
  );
}
