import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import { Button, Dialog, Text } from 'heroui-native';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { SelectionCard } from '@/components/SelectionCard';
import { formatDateTime, monthLabel, toDayKey } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { useAppColors } from '@/lib/theme';

const WEEKDAY_COLUMNS = [
  { key: 'monday', initial: 'M' },
  { key: 'tuesday', initial: 'T' },
  { key: 'wednesday', initial: 'W' },
  { key: 'thursday', initial: 'T' },
  { key: 'friday', initial: 'F' },
  { key: 'saturday', initial: 'S' },
  { key: 'sunday', initial: 'S' },
];

interface DateTimeDialogProps {
  isOpen: boolean;
  /** Epoch milliseconds currently selected. */
  value: number;
  onChange: (value: number) => void;
  onOpenChange: (open: boolean) => void;
}

interface StepperProps {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: StepperProps) {
  const colors = useAppColors();

  return (
    <View className="border-border bg-surface flex-1 items-center rounded-2xl border py-2.5">
      <Text type="body-xs" color="muted">
        {label}
      </Text>
      <View className="mt-1 flex-row items-center gap-3">
        <Pressable
          onPress={() => {
            tapFeedback();
            onDecrease();
          }}
          accessibilityRole="button"
          accessibilityLabel={decreaseLabel}
          hitSlop={8}
          className="bg-surface-secondary h-9 w-9 items-center justify-center rounded-full active:opacity-70"
        >
          <Minus color={colors.foreground} size={16} />
        </Pressable>
        <Text type="h5" weight="semibold" className="min-w-10 text-center">
          {value}
        </Text>
        <Pressable
          onPress={() => {
            tapFeedback();
            onIncrease();
          }}
          accessibilityRole="button"
          accessibilityLabel={increaseLabel}
          hitSlop={8}
          className="bg-surface-secondary h-9 w-9 items-center justify-center rounded-full active:opacity-70"
        >
          <Plus color={colors.foreground} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * In-app date and time picker. Kept custom so the experience — and the
 * keyboard-free number entry — is identical on iOS, Android and web.
 */
export function DateTimeDialog({ isOpen, value, onChange, onOpenChange }: DateTimeDialogProps) {
  const colors = useAppColors();
  const [draft, setDraft] = useState(value);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(value));
  // Track the dialog's own open/closed transition so the draft resets exactly
  // once per open — derived during render instead of inside an effect.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setDraft(value);
      setVisibleMonth(startOfMonth(value));
    }
  }

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 }),
      }),
    [visibleMonth],
  );

  const draftDate = new Date(draft);
  const hours24 = draftDate.getHours();
  const minutes = draftDate.getMinutes();
  const isPm = hours24 >= 12;
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const setTime = (nextHours: number, nextMinutes: number) => {
    setDraft(
      setMinutes(setHours(draftDate, (nextHours + 24) % 24), (nextMinutes + 60) % 60).getTime(),
    );
  };

  const pickDay = (day: Date) => {
    tapFeedback();
    const next = new Date(day);
    next.setHours(hours24, minutes, 0, 0);
    setDraft(next.getTime());
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay isCloseOnPress />
        <Dialog.Content className="max-h-[92%] w-full max-w-[420px]">
          <Dialog.Title>Date & time</Dialog.Title>
          <Dialog.Description>{formatDateTime(draft)}</Dialog.Description>

          <ScrollView
            className="mt-3"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-3 pb-1"
          >
            <View className="flex-row gap-2">
              <SelectionCard
                label="Today"
                variant="chip"
                className="flex-1"
                selected={isSameDay(draft, new Date())}
                onPress={() => pickDay(new Date())}
              />
              <SelectionCard
                label="Yesterday"
                variant="chip"
                className="flex-1"
                selected={isSameDay(draft, subDays(new Date(), 1))}
                onPress={() => pickDay(subDays(new Date(), 1))}
              />
            </View>

            <View className="border-border bg-surface rounded-2xl border p-2">
              <View className="flex-row items-center justify-between px-1 pb-1">
                <Pressable
                  onPress={() => setVisibleMonth((month) => addMonths(month, -1))}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  hitSlop={8}
                  className="active:bg-surface-secondary h-9 w-9 items-center justify-center rounded-full"
                >
                  <ChevronLeft color={colors.foreground} size={20} />
                </Pressable>
                <Text type="body-sm" weight="semibold">
                  {monthLabel(visibleMonth)}
                </Text>
                <Pressable
                  onPress={() => setVisibleMonth((month) => addMonths(month, 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  hitSlop={8}
                  className="active:bg-surface-secondary h-9 w-9 items-center justify-center rounded-full"
                >
                  <ChevronRight color={colors.foreground} size={20} />
                </Pressable>
              </View>

              <View className="flex-row">
                {WEEKDAY_COLUMNS.map((day) => (
                  <View
                    key={day.key}
                    style={{ width: `${100 / 7}%` }}
                    className="items-center py-1"
                  >
                    <Text type="body-xs" color="muted">
                      {day.initial}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row flex-wrap">
                {days.map((day) => {
                  const selected = isSameDay(day, draft);
                  const inMonth = isSameMonth(day, visibleMonth);
                  return (
                    <View key={toDayKey(day)} style={{ width: `${100 / 7}%` }} className="p-0.5">
                      <Pressable
                        onPress={() => pickDay(day)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={toDayKey(day)}
                        className="h-10 items-center justify-center rounded-xl border"
                        style={{
                          backgroundColor: selected ? colors.accent : 'transparent',
                          borderColor: !selected && isToday(day) ? colors.accent : 'transparent',
                          opacity: inMonth ? 1 : 0.35,
                        }}
                      >
                        <Text
                          type="body-sm"
                          weight={selected ? 'semibold' : 'normal'}
                          style={selected ? { color: colors.accentForeground } : undefined}
                        >
                          {day.getDate()}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="flex-row gap-2">
              <Stepper
                label="Hour"
                value={`${hour12}`}
                decreaseLabel="Previous hour"
                increaseLabel="Next hour"
                onDecrease={() => setTime(hours24 - 1, minutes)}
                onIncrease={() => setTime(hours24 + 1, minutes)}
              />
              <Stepper
                label="Minute"
                value={`${minutes}`.padStart(2, '0')}
                decreaseLabel="Five minutes earlier"
                increaseLabel="Five minutes later"
                onDecrease={() => setTime(hours24, minutes - 5)}
                onIncrease={() => setTime(hours24, minutes + 5)}
              />
            </View>

            <View className="flex-row gap-2">
              <SelectionCard
                label="AM"
                variant="chip"
                className="flex-1"
                selected={!isPm}
                onPress={() => setTime(isPm ? hours24 - 12 : hours24, minutes)}
              />
              <SelectionCard
                label="PM"
                variant="chip"
                className="flex-1"
                selected={isPm}
                onPress={() => setTime(isPm ? hours24 : hours24 + 12, minutes)}
              />
            </View>
          </ScrollView>

          <View className="mt-4 flex-row gap-3">
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
              onPress={() => {
                onChange(draft);
                onOpenChange(false);
              }}
              accessibilityLabel="Use this date and time"
            >
              <Button.Label>Done</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
