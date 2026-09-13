import { Text } from 'heroui-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { formatCurrency, formatPercent, percentOf } from '@/lib/format';
import { withAlpha } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface BreakdownItem {
  key: string;
  label: string;
  value: number;
  count?: number;
  color: string;
  icon?: LucideIcon;
}

interface BreakdownListProps {
  items: BreakdownItem[];
  total: number;
  className?: string;
}

/** Amount + share rows used for category, payment and UPI breakdowns. */
export function BreakdownList({ items, total, className }: BreakdownListProps) {
  return (
    <View className={cn('gap-3.5', className)}>
      {items.map((item) => {
        const share = percentOf(item.value, total);
        const Icon = item.icon;

        return (
          <View
            key={item.key}
            accessible
            accessibilityLabel={`${item.label}, ${formatCurrency(item.value)}, ${formatPercent(
              share,
            )} of total${item.count ? `, ${item.count} transactions` : ''}`}
          >
            <View className="flex-row items-center gap-2.5">
              {Icon ? (
                <View
                  className="h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: withAlpha(item.color, 0.16) }}
                >
                  <Icon color={item.color} size={15} />
                </View>
              ) : (
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}

              <Text type="body-sm" weight="medium" className="flex-1" numberOfLines={1}>
                {item.label}
              </Text>

              <Text type="body-sm" weight="semibold">
                {formatCurrency(item.value)}
              </Text>
              <Text type="body-xs" color="muted" className="w-12 text-right">
                {formatPercent(share)}
              </Text>
            </View>

            <ProgressBar
              progress={total > 0 ? item.value / total : 0}
              color={item.color}
              height={6}
              className="mt-2"
            />
          </View>
        );
      })}
    </View>
  );
}
