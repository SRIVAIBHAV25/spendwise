import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label, Text, TextField } from 'heroui-native';
import { CalendarClock, Check, Delete, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { z } from 'zod';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DateTimeDialog } from '@/components/DateTimeDialog';
import { Numpad } from '@/components/Numpad';
import { SectionHeader } from '@/components/SectionHeader';
import { SelectionCard } from '@/components/SelectionCard';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { applyAmountKey, amountToRaw } from '@/lib/amount';
import { getCategoryIcon, PAYMENT_META, UPI_META } from '@/lib/catalog';
import { toUserMessage } from '@/lib/errors';
import { formatAmountInput, formatDateTime, parseAmountInput, RUPEE } from '@/lib/format';
import { errorFeedback, successFeedback, tapFeedback } from '@/lib/haptics';
import { goBackOrReplace } from '@/lib/navigation';
import { useSettingsStore } from '@/lib/stores/settings';
import { showToast } from '@/lib/stores/toast';
import { useTransactionsStore } from '@/lib/stores/transactions';
import { useAppColors, withAlpha } from '@/lib/theme';
import {
  PAYMENT_TYPES,
  type PaymentType,
  type Transaction,
  UPI_TYPES,
  type UpiType,
} from '@/lib/types';

const MAX_AMOUNT = 99_999_999;

const schema = z
  .object({
    amountRaw: z.string(),
    category: z.string().min(1, 'Choose a category'),
    paymentType: z.enum(PAYMENT_TYPES),
    upiType: z.enum(UPI_TYPES).nullable(),
    note: z.string().max(120, 'Keep the note under 120 characters'),
    transactionDate: z.number(),
  })
  .superRefine((values, ctx) => {
    const amount = parseAmountInput(values.amountRaw);
    if (amount <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['amountRaw'],
        message: `Enter an amount above ${RUPEE}0`,
      });
    } else if (amount > MAX_AMOUNT) {
      ctx.addIssue({ code: 'custom', path: ['amountRaw'], message: 'That amount is too large' });
    }
    if (values.paymentType === 'UPI' && !values.upiType) {
      ctx.addIssue({ code: 'custom', path: ['upiType'], message: 'Choose the UPI app you used' });
    }
  });

type ExpenseFormValues = z.infer<typeof schema>;

interface ExpenseFormProps {
  /** Present when editing an existing record. */
  transaction?: Transaction;
}

/**
 * The add/edit expense flow: amount on a custom numpad first, then category,
 * payment type, the conditional UPI section, and the optional note and time.
 */
export function ExpenseForm({ transaction }: ExpenseFormProps) {
  const colors = useAppColors();
  const categories = useSettingsStore((state) => state.categories);
  const addTransaction = useTransactionsStore((state) => state.addTransaction);
  const editTransaction = useTransactionsStore((state) => state.editTransaction);
  const deleteTransaction = useTransactionsStore((state) => state.deleteTransaction);

  const isEditing = Boolean(transaction);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  /** The keypad stays hidden until the amount is tapped. */
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  /** Captured once so re-renders never move a new expense's timestamp. */
  const [defaultDate] = useState(() => transaction?.transactionDate ?? Date.now());
  const { width } = useWindowDimensions();
  /** Wider phones and tablets fit a fourth column of category tiles. */
  const categoryColumnWidth = width >= 480 ? '25%' : '33.3333%';
  const paymentColumnWidth = width >= 480 ? '33.3333%' : '50%';

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: {
      amountRaw: transaction ? amountToRaw(transaction.amount) : '',
      category: transaction?.category ?? '',
      paymentType: transaction?.paymentType ?? 'UPI',
      upiType: transaction?.upiType ?? null,
      note: transaction?.note ?? '',
      transactionDate: defaultDate,
    },
  });

  const amountRaw = useWatch({ control, name: 'amountRaw' });
  const paymentType = useWatch({ control, name: 'paymentType' });
  const upiType = useWatch({ control, name: 'upiType' });
  const selectedCategory = useWatch({ control, name: 'category' });
  const transactionDate = useWatch({ control, name: 'transactionDate' });

  const onKeyPress = useCallback(
    (key: string) => {
      setValue('amountRaw', applyAmountKey(amountRaw, key), { shouldValidate: false });
    },
    [setValue, amountRaw],
  );

  const onSubmit = handleSubmit(
    async (values) => {
      setSaveError(null);
      const input = {
        amount: parseAmountInput(values.amountRaw),
        category: values.category,
        paymentType: values.paymentType,
        upiType: values.paymentType === 'UPI' ? values.upiType : null,
        note: values.note.trim() ? values.note.trim() : null,
        transactionDate: values.transactionDate,
      };

      try {
        if (transaction) await editTransaction(transaction.id, input);
        else await addTransaction(input);
        successFeedback();
        showToast(isEditing ? 'Expense updated' : 'Expense saved');
        goBackOrReplace('/');
      } catch (cause) {
        errorFeedback();
        setSaveError(toUserMessage(cause, 'Could not save this expense. Please try again.'));
      }
    },
    () => {
      errorFeedback();
    },
  );

  const onDelete = async () => {
    if (!transaction) return;
    try {
      await deleteTransaction(transaction.id);
      successFeedback();
      showToast('Expense deleted');
      goBackOrReplace('/');
    } catch (cause) {
      errorFeedback();
      setSaveError(toUserMessage(cause, 'Could not delete this expense. Please try again.'));
    }
  };

  const openNumpad = useCallback(() => {
    Keyboard.dismiss();
    setIsNumpadOpen(true);
    tapFeedback();
  }, []);

  const amountError = errors.amountRaw?.message;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="px-5 gap-5"
        contentContainerStyle={{ paddingBottom: isNumpadOpen ? 340 : 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          onPress={openNumpad}
          accessibilityRole="button"
          accessibilityLabel={`Amount ${RUPEE}${formatAmountInput(amountRaw)}. Tap to open the keypad.`}
          className="border-border bg-surface active:bg-surface-secondary items-center rounded-3xl border px-4 py-5"
          style={{ borderColor: isNumpadOpen ? colors.accent : colors.border }}
        >
          <Text type="body-xs" color="muted">
            Amount
          </Text>
          <View className="mt-1 flex-row items-baseline">
            <Text type="h3" weight="semibold" style={{ color: colors.muted }}>
              {RUPEE}
            </Text>
            <Text
              type="h1"
              weight="bold"
              numberOfLines={1}
              adjustsFontSizeToFit
              className="ml-1"
              style={{ color: amountRaw ? colors.foreground : colors.muted }}
            >
              {formatAmountInput(amountRaw)}
            </Text>
          </View>
          {amountError ? (
            <Text type="body-xs" className="mt-1.5" style={{ color: colors.danger }}>
              {amountError}
            </Text>
          ) : (
            <Text type="body-xs" className="mt-1.5" style={{ color: colors.accent }}>
              {isNumpadOpen ? 'Use the keypad below' : 'Tap to enter the amount'}
            </Text>
          )}
        </Pressable>

        <View>
          <SectionHeader title="Category" className="px-0 pb-2" />
          {errors.category?.message ? (
            <Text type="body-xs" className="mb-2" style={{ color: colors.danger }}>
              {errors.category.message}
            </Text>
          ) : null}
          <View className="-mx-1 flex-row flex-wrap">
            {categories.map((category) => (
              <View key={category.id} style={{ width: categoryColumnWidth }} className="p-1">
                <SelectionCard
                  label={category.name}
                  icon={getCategoryIcon(category.icon)}
                  color={category.color}
                  selected={selectedCategory === category.name}
                  onPress={() => setValue('category', category.name, { shouldValidate: false })}
                />
              </View>
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="Payment type" className="px-0 pb-2" />
          <View className="-mx-1 flex-row flex-wrap">
            {PAYMENT_TYPES.map((type: PaymentType) => (
              <View key={type} style={{ width: paymentColumnWidth }} className="p-1">
                <SelectionCard
                  label={type}
                  variant="chip"
                  icon={PAYMENT_META[type].icon}
                  color={PAYMENT_META[type].color}
                  selected={paymentType === type}
                  onPress={() => {
                    setValue('paymentType', type, { shouldValidate: false });
                    if (type !== 'UPI') setValue('upiType', null, { shouldValidate: false });
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {paymentType === 'UPI' ? (
          <AnimatedView entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(160)}>
            <SectionHeader title="UPI app" className="px-0 pb-2" />
            {errors.upiType?.message ? (
              <Text type="body-xs" className="mb-2" style={{ color: colors.danger }}>
                {errors.upiType.message}
              </Text>
            ) : null}
            <View className="-mx-1 flex-row flex-wrap">
              {UPI_TYPES.map((type: UpiType) => (
                <View key={type} style={{ width: '33.3333%' }} className="p-1">
                  <SelectionCard
                    label={type}
                    variant="chip"
                    color={UPI_META[type].color}
                    selected={upiType === type}
                    onPress={() => setValue('upiType', type, { shouldValidate: false })}
                  />
                </View>
              ))}
            </View>
          </AnimatedView>
        ) : null}

        <Pressable
          onPress={() => setIsDateOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Date and time: ${formatDateTime(transactionDate)}. Tap to change.`}
          className="border-border bg-surface active:bg-surface-secondary flex-row items-center gap-3 rounded-2xl border p-4"
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: withAlpha(colors.accent, 0.14) }}
          >
            <CalendarClock color={colors.accent} size={20} />
          </View>
          <View className="flex-1">
            <Text type="body-xs" color="muted">
              Date & time
            </Text>
            <Text type="body" weight="medium">
              {formatDateTime(transactionDate)}
            </Text>
          </View>
          <Text type="body-sm" style={{ color: colors.accent }}>
            Change
          </Text>
        </Pressable>

        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <TextField isInvalid={Boolean(errors.note)}>
              <Label>Note (optional)</Label>
              <Input
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onFocus={() => setIsNumpadOpen(false)}
                placeholder="Breakfast, bus fare, stationery…"
                returnKeyType="done"
                maxLength={120}
                accessibilityLabel="Note"
              />
              {errors.note?.message ? (
                <Text type="body-xs" style={{ color: colors.danger }}>
                  {errors.note.message}
                </Text>
              ) : null}
            </TextField>
          )}
        />

        {saveError ? (
          <View
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: withAlpha(colors.danger, 0.12) }}
          >
            <Text type="body-sm" style={{ color: colors.danger }}>
              {saveError}
            </Text>
          </View>
        ) : null}

        {isEditing ? (
          <Button
            variant="danger-soft"
            className="h-12"
            onPress={() => setIsDeleteOpen(true)}
            accessibilityLabel="Delete expense"
          >
            <Trash2 color={colors.danger} size={18} />
            <Button.Label>Delete expense</Button.Label>
          </Button>
        ) : null}
      </ScrollView>

      <View
        className="border-border pb-safe-offset-3 border-t px-5 pt-3"
        style={{ backgroundColor: colors.surface }}
      >
        <Button
          size="lg"
          className="h-14 rounded-2xl"
          isDisabled={isSubmitting}
          onPress={() => {
            void onSubmit();
          }}
          accessibilityLabel={isEditing ? 'Update expense' : 'Save expense'}
        >
          <Check color={colors.accentForeground} size={20} />
          <Button.Label>{isEditing ? 'Update expense' : 'Save expense'}</Button.Label>
        </Button>
      </View>

      {isNumpadOpen ? (
        <>
          <AnimatedView
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(140)}
            className="absolute inset-0"
            style={{ backgroundColor: withAlpha(colors.foreground, 0.18) }}
          >
            <Pressable
              className="flex-1"
              accessibilityRole="button"
              accessibilityLabel="Close keypad"
              onPress={() => setIsNumpadOpen(false)}
            />
          </AnimatedView>

          <AnimatedView
            entering={SlideInDown.duration(240)}
            exiting={SlideOutDown.duration(180)}
            className="border-border pb-safe-offset-3 absolute inset-x-0 bottom-0 rounded-t-3xl border-t px-4 pt-3"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="mb-2 flex-row items-center justify-between px-1">
              <View className="flex-row items-baseline">
                <Text type="body-sm" weight="medium" style={{ color: colors.muted }}>
                  {RUPEE}
                </Text>
                <Text type="h4" weight="bold" className="ml-1" numberOfLines={1}>
                  {formatAmountInput(amountRaw)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => {
                    tapFeedback();
                    setValue('amountRaw', '', { shouldValidate: false });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear amount"
                  hitSlop={8}
                  className="border-border active:bg-surface-secondary min-h-9 flex-row items-center gap-1.5 rounded-full border px-3"
                >
                  <Delete color={colors.muted} size={15} />
                  <Text type="body-sm" weight="medium" style={{ color: colors.muted }}>
                    Clear
                  </Text>
                </Pressable>
                <Button
                  size="sm"
                  className="h-9 rounded-full"
                  onPress={() => setIsNumpadOpen(false)}
                >
                  <Button.Label>Done</Button.Label>
                </Button>
              </View>
            </View>

            <Numpad
              onKeyPress={onKeyPress}
              onClear={() => setValue('amountRaw', '', { shouldValidate: false })}
            />
          </AnimatedView>
        </>
      ) : null}

      <DateTimeDialog
        isOpen={isDateOpen}
        value={transactionDate}
        onChange={(next) => setValue('transactionDate', next, { shouldValidate: false })}
        onOpenChange={setIsDateOpen}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete this transaction?"
        description="This removes it from your history, reports and calendar."
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          void onDelete();
        }}
      />
    </KeyboardAvoidingView>
  );
}
