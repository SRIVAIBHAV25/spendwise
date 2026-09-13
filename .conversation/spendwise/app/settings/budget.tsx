import { Input, Label, Switch, Text, TextField } from 'heroui-native';
import { BellRing, Wallet } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SelectionCard } from '@/components/SelectionCard';
import { SettingsCard, SettingsRow } from '@/components/SettingsRow';
import { useDbQuery } from '@/hooks/useDbQuery';
import { repository } from '@/lib/db';
import {
  formatCurrency,
  formatPercent,
  monthLabel,
  monthRange,
  percentOf,
  RUPEE,
} from '@/lib/format';
import { useSettingsStore } from '@/lib/stores/settings';
import { useAppColors } from '@/lib/theme';
import type { BudgetThreshold } from '@/lib/types';

const QUICK_BUDGETS = [5000, 10000, 15000, 25000];
const THRESHOLDS: BudgetThreshold[] = [75, 90, 100];

export default function BudgetSettingsScreen() {
  const colors = useAppColors();
  const budgetEnabled = useSettingsStore((state) => state.budgetEnabled);
  const setBudgetEnabled = useSettingsStore((state) => state.setBudgetEnabled);
  const budgetAmount = useSettingsStore((state) => state.budgetAmount);
  const setBudgetAmount = useSettingsStore((state) => state.setBudgetAmount);
  const thresholds = useSettingsStore((state) => state.thresholds);
  const toggleThreshold = useSettingsStore((state) => state.toggleThreshold);

  const [text, setText] = useState(budgetAmount > 0 ? `${budgetAmount}` : '');

  const load = useCallback(() => repository.summary(monthRange(new Date())), []);
  const { data: summary } = useDbQuery(load, { total: 0, count: 0 });

  const commitAmount = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parsed = Number.parseFloat(cleaned);
    setBudgetAmount(Number.isFinite(parsed) ? Math.round(parsed) : 0);
  };

  const usedPercent = percentOf(summary.total, budgetAmount);
  const remaining = Math.max(0, budgetAmount - summary.total);
  const progressColor =
    usedPercent >= 100 ? colors.danger : usedPercent >= 75 ? colors.warning : colors.accent;

  return (
    <KeyboardAvoidingView
      className="bg-background pt-safe flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Monthly budget"
        subtitle="Completely optional"
        backFallback="/(tabs)/settings"
      />

      <ScrollView
        contentContainerClassName="px-5 pb-10 gap-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SettingsCard>
          <SettingsRow
            icon={Wallet}
            label="Monthly Budget"
            description="Track a spending limit for each month"
            right={
              <Switch isSelected={budgetEnabled} onSelectedChange={setBudgetEnabled}>
                <Switch.Thumb />
              </Switch>
            }
          />
        </SettingsCard>

        {budgetEnabled ? (
          <>
            <View className="border-border bg-surface gap-3 rounded-3xl border p-4">
              <SectionHeader title="Budget amount" caption="Applies to every month" />
              <TextField>
                <Label>{`Amount (${RUPEE})`}</Label>
                <Input
                  value={text}
                  onChangeText={setText}
                  onBlur={() => commitAmount(text)}
                  onSubmitEditing={() => commitAmount(text)}
                  placeholder="15000"
                  keyboardType="numeric"
                  returnKeyType="done"
                  accessibilityLabel="Monthly budget amount"
                />
              </TextField>
              <View className="flex-row gap-2">
                {QUICK_BUDGETS.map((amount) => (
                  <SelectionCard
                    key={amount}
                    label={formatCurrency(amount)}
                    variant="chip"
                    className="flex-1"
                    selected={budgetAmount === amount}
                    onPress={() => {
                      setText(`${amount}`);
                      setBudgetAmount(amount);
                    }}
                  />
                ))}
              </View>
            </View>

            <View className="border-border bg-surface gap-3 rounded-3xl border p-4">
              <SectionHeader
                title={monthLabel(new Date())}
                caption={`${summary.count} transactions so far`}
              />
              <View className="flex-row items-end justify-between">
                <View>
                  <Text type="body-xs" color="muted">
                    Spent
                  </Text>
                  <Text type="h5" weight="semibold">
                    {formatCurrency(summary.total)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text type="body-xs" color="muted">
                    {budgetAmount >= summary.total ? 'Remaining' : 'Over budget'}
                  </Text>
                  <Text type="h5" weight="semibold" style={{ color: progressColor }}>
                    {formatCurrency(
                      budgetAmount >= summary.total ? remaining : summary.total - budgetAmount,
                    )}
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={budgetAmount > 0 ? summary.total / budgetAmount : 0}
                color={progressColor}
                accessibilityLabel={`${formatPercent(usedPercent)} of budget used`}
              />
              <Text type="body-xs" color="muted">
                {`Budget ${formatCurrency(budgetAmount)} · ${formatPercent(usedPercent)} used`}
              </Text>
            </View>

            <View className="border-border bg-surface gap-3 rounded-3xl border p-4">
              <SectionHeader
                title="Alert thresholds"
                caption="Warn me when spending passes these points"
              />
              <View className="flex-row gap-2">
                {THRESHOLDS.map((threshold) => (
                  <SelectionCard
                    key={threshold}
                    label={`${threshold}%`}
                    variant="chip"
                    icon={BellRing}
                    className="flex-1"
                    selected={thresholds.includes(threshold)}
                    onPress={() => toggleThreshold(threshold)}
                  />
                ))}
              </View>
            </View>
          </>
        ) : (
          <Text type="body-sm" color="muted" className="px-1">
            The app works exactly the same without a budget. Switch it on any time — turning it off
            later never deletes your expenses.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
