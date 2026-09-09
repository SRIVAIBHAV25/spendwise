import { useLocalSearchParams } from 'expo-router';
import { Spinner, Text } from 'heroui-native';
import { Receipt } from 'lucide-react-native';
import { useCallback } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useDbQuery } from '@/hooks/useDbQuery';
import { repository } from '@/lib/db';
import { formatDayLabel } from '@/lib/format';
import type { Transaction } from '@/lib/types';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const load = useCallback(() => repository.findById(id), [id]);
  const { data, isLoading, error } = useDbQuery<Transaction | null>(load, null);

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader
        title="Edit expense"
        subtitle={data ? formatDayLabel(data.transactionDate) : undefined}
        backFallback="/"
        backIcon="close"
      />

      {error ? (
        <EmptyState
          icon={Receipt}
          title="Could not open this expense"
          description={error}
          tone="danger"
        />
      ) : data ? (
        <ExpenseForm transaction={data} />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Spinner />
          <Text type="body-sm" color="muted">
            Loading expense…
          </Text>
        </View>
      ) : (
        <EmptyState
          icon={Receipt}
          title="Expense not found"
          description="It may have been deleted already."
        />
      )}
    </View>
  );
}
