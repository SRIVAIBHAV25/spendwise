import { addMonths, isSameMonth, subMonths } from 'date-fns';
import { Text } from 'heroui-native';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { MonthPickerDialog } from '@/components/MonthPickerDialog';
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

/**
 * Previous / next month control. Tapping the label opens a full calendar picker
 * so any month of any year can be reached in one step.
 */
export function MonthSwitcher({ month, onChange, caption, className }: MonthSwitcherProps) {
  const colors = useAppColors();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const isCurrent = isSameMonth(month, new Date());

  return (
    <>
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
            tapFeedback();
            setIsPickerOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${monthLabel(month)}, open calendar to choose a month`}
          className="active:bg-surface-secondary flex-1 items-center justify-center rounded-xl py-1"
        >
          <View className="flex-row items-center gap-1.5">
            <CalendarDays color={colors.muted} size={14} />
            <Text type="body" weight="semibold" numberOfLines={1}>
              {monthLabel(month)}
            </Text>
          </View>
          <Text type="body-xs" color="muted" numberOfLines={1}>
            {caption ?? (isCurrent ? 'This month' : 'Tap to choose a month')}
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

      <MonthPickerDialog
        isOpen={isPickerOpen}
        value={month}
        onChange={onChange}
        onOpenChange={setIsPickerOpen}
      />
    </>
  );
}
