import { endOfDay, startOfDay, subDays } from 'date-fns';
import { Button, Input, Label, Text, TextField } from 'heroui-native';
import { CalendarRange } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { DateTimeDialog } from '@/components/DateTimeDialog';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SelectionCard } from '@/components/SelectionCard';
import { getCategoryIcon, PAYMENT_META, UPI_META } from '@/lib/catalog';
import { formatDate, monthRange, RUPEE, weekRange } from '@/lib/format';
import { goBackOrReplace } from '@/lib/navigation';
import {
  countActiveFilters,
  EMPTY_FILTERS,
  type HistoryFilters,
  useFiltersStore,
  validateFilters,
} from '@/lib/stores/filters';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAppColors } from '@/lib/theme';
import { PAYMENT_TYPES, type PaymentType, UPI_TYPES, type UpiType } from '@/lib/types';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export default function FiltersScreen() {
  const colors = useAppColors();
  const categories = useSettingsStore((state) => state.categories);
  const stored = useFiltersStore((state) => state.filters);
  const applyFilters = useFiltersStore((state) => state.applyFilters);
  const clearFilters = useFiltersStore((state) => state.clearFilters);

  const [draft, setDraft] = useState<HistoryFilters>(stored);
  const [minText, setMinText] = useState(stored.minAmount != null ? `${stored.minAmount}` : '');
  const [maxText, setMaxText] = useState(stored.maxAmount != null ? `${stored.maxAmount}` : '');
  const [editing, setEditing] = useState<'from' | 'to' | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Lazy initializer runs once on mount, keeping the fallback stable across renders.
  const [fallbackNow] = useState(() => Date.now());

  const patch = (next: Partial<HistoryFilters>) => {
    setDraft((current) => ({ ...current, ...next }));
    setError(null);
  };

  const applyQuickRange = (kind: 'all' | 'week' | 'month' | 'last30') => {
    if (kind === 'all') return patch({ from: null, to: null });
    if (kind === 'week') {
      const range = weekRange(new Date());
      return patch({ from: range.from, to: range.to });
    }
    if (kind === 'month') {
      const range = monthRange(new Date());
      return patch({ from: range.from, to: range.to });
    }
    return patch({
      from: startOfDay(subDays(new Date(), 29)).getTime(),
      to: endOfDay(new Date()).getTime(),
    });
  };

  const rangeMatches = (kind: 'all' | 'week' | 'month' | 'last30'): boolean => {
    if (kind === 'all') return draft.from == null && draft.to == null;
    if (draft.from == null || draft.to == null) return false;
    const target =
      kind === 'week'
        ? weekRange(new Date())
        : kind === 'month'
          ? monthRange(new Date())
          : {
              from: startOfDay(subDays(new Date(), 29)).getTime(),
              to: endOfDay(new Date()).getTime(),
            };
    return draft.from === target.from && draft.to === target.to;
  };

  const onApply = () => {
    const next: HistoryFilters = {
      ...draft,
      minAmount: parseAmount(minText),
      maxAmount: parseAmount(maxText),
    };
    const problem = validateFilters(next);
    if (problem) {
      setError(problem);
      return;
    }
    applyFilters(next);
    goBackOrReplace('/history');
  };

  const activeCount = countActiveFilters({
    ...draft,
    minAmount: parseAmount(minText),
    maxAmount: parseAmount(maxText),
  });

  return (
    <KeyboardAvoidingView
      className="bg-background pt-safe flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Filters"
        subtitle={activeCount > 0 ? `${activeCount} active` : 'Narrow down your history'}
        backFallback="/history"
        backIcon="close"
      />

      <ScrollView
        contentContainerClassName="px-5 pb-6 gap-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <SectionHeader title="Category" caption="Pick any number of categories" />
          <View className="-mx-1 mt-2 flex-row flex-wrap">
            {categories.map((category) => (
              <View key={category.id} className="p-1">
                <SelectionCard
                  label={category.name}
                  variant="chip"
                  icon={getCategoryIcon(category.icon)}
                  color={category.color}
                  selected={draft.categories.includes(category.name)}
                  onPress={() => patch({ categories: toggle(draft.categories, category.name) })}
                />
              </View>
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="Payment type" />
          <View className="-mx-1 mt-2 flex-row flex-wrap">
            {PAYMENT_TYPES.map((type: PaymentType) => (
              <View key={type} className="p-1">
                <SelectionCard
                  label={type}
                  variant="chip"
                  icon={PAYMENT_META[type].icon}
                  color={PAYMENT_META[type].color}
                  selected={draft.paymentTypes.includes(type)}
                  onPress={() => patch({ paymentTypes: toggle(draft.paymentTypes, type) })}
                />
              </View>
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="UPI app" caption="Applies to UPI payments" />
          <View className="-mx-1 mt-2 flex-row flex-wrap">
            {UPI_TYPES.map((type: UpiType) => (
              <View key={type} className="p-1">
                <SelectionCard
                  label={type}
                  variant="chip"
                  color={UPI_META[type].color}
                  selected={draft.upiTypes.includes(type)}
                  onPress={() => patch({ upiTypes: toggle(draft.upiTypes, type) })}
                />
              </View>
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="Date range" />
          <View className="-mx-1 mt-2 flex-row flex-wrap">
            {(
              [
                ['All time', 'all'],
                ['This week', 'week'],
                ['This month', 'month'],
                ['Last 30 days', 'last30'],
              ] as const
            ).map(([label, kind]) => (
              <View key={kind} className="p-1">
                <SelectionCard
                  label={label}
                  variant="chip"
                  selected={rangeMatches(kind)}
                  onPress={() => applyQuickRange(kind)}
                />
              </View>
            ))}
          </View>

          <View className="mt-2 flex-row gap-3">
            <Pressable
              onPress={() => setEditing('from')}
              accessibilityRole="button"
              accessibilityLabel={
                draft.from != null ? `From ${formatDate(draft.from)}` : 'Set start date'
              }
              className="border-border bg-surface active:bg-surface-secondary flex-1 rounded-2xl border p-3"
            >
              <Text type="body-xs" color="muted">
                From
              </Text>
              <Text type="body-sm" weight="medium">
                {draft.from != null ? formatDate(draft.from) : 'Any date'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setEditing('to')}
              accessibilityRole="button"
              accessibilityLabel={draft.to != null ? `To ${formatDate(draft.to)}` : 'Set end date'}
              className="border-border bg-surface active:bg-surface-secondary flex-1 rounded-2xl border p-3"
            >
              <Text type="body-xs" color="muted">
                To
              </Text>
              <Text type="body-sm" weight="medium">
                {draft.to != null ? formatDate(draft.to) : 'Any date'}
              </Text>
            </Pressable>
          </View>

          {draft.from != null || draft.to != null ? (
            <Pressable
              onPress={() => patch({ from: null, to: null })}
              accessibilityRole="button"
              accessibilityLabel="Clear date range"
              hitSlop={8}
              className="mt-2 min-h-9 flex-row items-center gap-1.5"
            >
              <CalendarRange color={colors.accent} size={16} />
              <Text type="body-sm" className="text-accent">
                Clear date range
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View>
          <SectionHeader title="Amount range" />
          <View className="mt-2 flex-row gap-3">
            <TextField className="flex-1">
              <Label>{`Minimum (${RUPEE})`}</Label>
              <Input
                value={minText}
                onChangeText={setMinText}
                placeholder="0"
                keyboardType="numeric"
                accessibilityLabel="Minimum amount"
              />
            </TextField>
            <TextField className="flex-1">
              <Label>{`Maximum (${RUPEE})`}</Label>
              <Input
                value={maxText}
                onChangeText={setMaxText}
                placeholder="Any"
                keyboardType="numeric"
                accessibilityLabel="Maximum amount"
              />
            </TextField>
          </View>
        </View>

        {error ? (
          <Text type="body-sm" style={{ color: colors.danger }}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View
        className="border-border pb-safe-offset-3 flex-row gap-3 border-t px-5 pt-3"
        style={{ backgroundColor: colors.surface }}
      >
        <Button
          variant="secondary"
          className="h-12 flex-1"
          onPress={() => {
            setDraft(EMPTY_FILTERS);
            setMinText('');
            setMaxText('');
            setError(null);
            clearFilters();
          }}
          accessibilityLabel="Clear filters"
        >
          <Button.Label>Clear Filters</Button.Label>
        </Button>
        <Button className="h-12 flex-1" onPress={onApply} accessibilityLabel="Apply filters">
          <Button.Label>Apply Filters</Button.Label>
        </Button>
      </View>

      <DateTimeDialog
        isOpen={editing !== null}
        value={
          editing === 'to'
            ? (draft.to ?? fallbackNow)
            : (draft.from ?? startOfDay(new Date()).getTime())
        }
        onChange={(next) => {
          if (editing === 'from') patch({ from: startOfDay(next).getTime() });
          else if (editing === 'to') patch({ to: endOfDay(next).getTime() });
        }}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}
