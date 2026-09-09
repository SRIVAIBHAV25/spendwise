import { addMonths, isSameMonth, subMonths } from 'date-fns';
import { Text } from 'heroui-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { monthLabel } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { useAppColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface MonthSwitcherProps {
  month: Date;
  onChange: (next: Date) => void;
  caption?: string;
  className?: string;
}

/** Previous / next month control with a "This month" shortcut. */
export function MonthSwitcher({ month, onChange, caption, className }: MonthSwitcherProps) {
  const colors = useAppColors();
  const isCurrent = isSameMonth(month, new Date());

  return (
    <View
      className={cn(
        'border-border bg-surface flex-row items-center gap-2 rounded-2xl border p-1.5',
        className,
      )}
    >
      <Pressable
        onPress={() => {
          tapFeedback();
          onChange(subMonths(month, 1));
        }}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        hitSlop={6}
        className="active:bg-surface-secondary h-10 w-10 items-center justify-center rounded-xl"
      >
        <ChevronLeft color={colors.foreground} size={20} />
      </Pressable>

      <Pressable
        onPress={() => {
          if (isCurrent) return;
          tapFeedback();
          onChange(new Date());
        }}
        disabled={isCurrent}
        accessibilityRole="button"
        accessibilityLabel={
          isCurrent ? monthLabel(month) : `${monthLabel(month)}, go to this month`
        }
        className="flex-1 items-center justify-center py-1"
      >
        <Text type="body" weight="semibold" numberOfLines={1}>
          {monthLabel(month)}
        </Text>
        <Text type="body-xs" color="muted" numberOfLines={1}>
          {caption ?? (isCurrent ? 'This month' : 'Tap to return to this month')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          tapFeedback();
          onChange(addMonths(month, 1));
        }}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        hitSlop={6}
        className="active:bg-surface-secondary h-10 w-10 items-center justify-center rounded-xl"
      >
        <ChevronRight color={colors.foreground} size={20} />
      </Pressable>
    </View>
  );
}
