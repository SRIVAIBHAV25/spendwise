import { isSameMonth, setMonth as setMonthOfYear, setYear, startOfMonth } from 'date-fns';
import { Button, Dialog, Text } from 'heroui-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { monthLabel } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { useAppColors } from '@/lib/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthPickerDialogProps {
  isOpen: boolean;
  /** Month currently shown by the caller. */
  value: Date;
  onChange: (next: Date) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full calendar picker for a month: browse any year, then tap a month. Used
 * wherever a month drives the data on screen (Reports, Calendar).
 */
export function MonthPickerDialog({
  isOpen,
  value,
  onChange,
  onOpenChange,
}: MonthPickerDialogProps) {
  const colors = useAppColors();
  const [draft, setDraft] = useState(() => startOfMonth(value));
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setDraft(startOfMonth(value));
  }

  const today = new Date();
  const year = draft.getFullYear();

  const shiftYear = (delta: number) => {
    tapFeedback();
    setDraft((current) => setYear(current, current.getFullYear() + delta));
  };

  const commit = (next: Date) => {
    onChange(startOfMonth(next));
    onOpenChange(false);
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay isCloseOnPress />
        <Dialog.Content className="w-full max-w-[420px]">
          <Dialog.Title>Choose a month</Dialog.Title>
          <Dialog.Description>{monthLabel(draft)}</Dialog.Description>

          <View className="border-border bg-surface mt-3 rounded-2xl border p-2">
            <View className="flex-row items-center justify-between px-1 pb-2">
              <Pressable
                onPress={() => shiftYear(-1)}
                accessibilityRole="button"
                accessibilityLabel="Previous year"
                hitSlop={8}
                className="active:bg-surface-secondary h-9 w-9 items-center justify-center rounded-full"
              >
                <ChevronLeft color={colors.foreground} size={20} />
              </Pressable>
              <Text type="body" weight="semibold">
                {`${year}`}
              </Text>
              <Pressable
                onPress={() => shiftYear(1)}
                accessibilityRole="button"
                accessibilityLabel="Next year"
                hitSlop={8}
                className="active:bg-surface-secondary h-9 w-9 items-center justify-center rounded-full"
              >
                <ChevronRight color={colors.foreground} size={20} />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap">
              {MONTHS.map((label, index) => {
                const month = setMonthOfYear(draft, index);
                const selected = draft.getMonth() === index;
                const current = isSameMonth(month, today);
                return (
                  <View key={label} style={{ width: `${100 / 3}%` }} className="p-1">
                    <Pressable
                      onPress={() => {
                        tapFeedback();
                        setDraft(startOfMonth(month));
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${label} ${year}`}
                      className="h-11 items-center justify-center rounded-xl border"
                      style={{
                        backgroundColor: selected ? colors.accent : colors.surfaceSecondary,
                        borderColor: !selected && current ? colors.accent : 'transparent',
                      }}
                    >
                      <Text
                        type="body-sm"
                        weight={selected || current ? 'semibold' : 'normal'}
                        style={{
                          color: selected ? colors.accentForeground : colors.foreground,
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={() => {
              tapFeedback();
              commit(today);
            }}
            accessibilityRole="button"
            accessibilityLabel="Jump to this month"
            className="active:bg-surface-secondary mt-3 items-center rounded-2xl py-2"
          >
            <Text type="body-sm" weight="medium" style={{ color: colors.foreground }}>
              Jump to this month
            </Text>
          </Pressable>

          <View className="mt-3 flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => onOpenChange(false)}
              accessibilityLabel="Cancel"
            >
              <Button.Label>Cancel</Button.Label>
            </Button>
            <Button
              className="flex-1"
              onPress={() => commit(draft)}
              accessibilityLabel="Show this month"
            >
              <Button.Label>Show month</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
