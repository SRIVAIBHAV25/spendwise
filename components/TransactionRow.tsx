import { Text } from 'heroui-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { useCategoryMeta } from '@/hooks/useCategoryMeta';
import { formatCurrency, formatDayLabel, formatTime } from '@/lib/format';
import { withAlpha } from '@/lib/theme';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  /** Adds the day label next to the time, for search and filtered lists. */
  showDate?: boolean;
  className?: string;
}

function TransactionRowComponent({
  transaction,
  onPress,
  showDate = false,
  className,
}: TransactionRowProps) {
  const resolveCategory = useCategoryMeta();
  const meta = resolveCategory(transaction.category);
  const Icon = meta.icon;

  const method =
    transaction.paymentType === 'UPI' && transaction.upiType
      ? `UPI \u00B7 ${transaction.upiType}`
      : transaction.paymentType;
  const when = showDate
    ? `${formatDayLabel(transaction.transactionDate)} \u00B7 ${formatTime(transaction.transactionDate)}`
    : formatTime(transaction.transactionDate);

  const amount = formatCurrency(transaction.amount);

  return (
    <Pressable
      onPress={onPress ? () => onPress(transaction) : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[
        transaction.category,
        transaction.note,
        method,
        when,
        amount,
      ]
        .filter(Boolean)
        .join(', ')}
      className={cn(
        'flex-row items-center gap-3 rounded-2xl px-3 py-3 active:bg-surface-secondary',
        className,
      )}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: withAlpha(meta.color, 0.16) }}
      >
        <Icon color={meta.color} size={20} />
      </View>

      <View className="flex-1">
        <Text type="body" weight="medium" numberOfLines={1}>
          {transaction.category}
        </Text>
        {transaction.note ? (
          <Text type="body-sm" color="muted" numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : null}
        <Text type="body-xs" color="muted" numberOfLines={1} className="mt-0.5">
          {`${method} \u00B7 ${when}`}
        </Text>
      </View>

      <Text type="body" weight="semibold">
        {amount}
      </Text>
    </Pressable>
  );
}

export const TransactionRow = memo(TransactionRowComponent);
