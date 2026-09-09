import { endOfDay, startOfDay } from 'date-fns';
import { Button, Spinner, Text } from 'heroui-native';
import { CalendarRange, FileSpreadsheet, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { DateTimeDialog } from '@/components/DateTimeDialog';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SelectionCard } from '@/components/SelectionCard';
import { toUserMessage } from '@/lib/errors';
import { exportTransactions } from '@/lib/export';
import { formatDate } from '@/lib/format';
import { errorFeedback, successFeedback } from '@/lib/haptics';
import { showToast } from '@/lib/stores/toast';
import { useAppColors, withAlpha } from '@/lib/theme';
import type { ExportRangeKind } from '@/lib/types';

const RANGE_OPTIONS: { kind: ExportRangeKind; label: string; caption: string }[] = [
  { kind: 'month', label: 'Selected month', caption: 'One month of expenses' },
  { kind: 'range', label: 'Date range', caption: 'Pick a start and end date' },
  { kind: 'all', label: 'Everything', caption: 'All expenses ever recorded' },
];

const COLUMNS = ['Date', 'Time', 'Category', 'Amount', 'Payment Type', 'UPI Type', 'Note'];

export default function ExportSettingsScreen() {
  const colors = useAppColors();
  const [kind, setKind] = useState<ExportRangeKind>('month');
  const [month, setMonth] = useState(() => new Date());
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);
  const [editing, setEditing] = useState<'from' | 'to' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Lazy initializer runs once on mount, keeping the fallback stable across renders.
  const [fallbackNow] = useState(() => Date.now());

  const runExport = async () => {
    setError(null);
    if (kind === 'range' && (from == null || to == null)) {
      setError('Choose both a start and an end date.');
      return;
    }
    if (kind === 'range' && from != null && to != null && from > to) {
      setError('The start date must come before the end date.');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportTransactions({
        kind,
        month,
        from: from != null ? startOfDay(from).getTime() : null,
        to: to != null ? endOfDay(to).getTime() : null,
      });
      successFeedback();
      showToast(
        result.shared
          ? `Exported ${result.rowCount} expenses`
          : `Saved ${result.fileName} (${result.rowCount} expenses)`,
      );
    } catch (cause) {
      errorFeedback();
      setError(toUserMessage(cause, 'Could not create the Excel file. Please try again.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader
        title="Export to Excel"
        subtitle="Real .xlsx file, shared with your device"
        backFallback="/(tabs)/settings"
      />

      <ScrollView contentContainerClassName="px-5 pb-10 gap-5" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <SectionHeader title="What to export" />
          {RANGE_OPTIONS.map((option) => (
            <SelectionCard
              key={option.kind}
              label={`${option.label} · ${option.caption}`}
              variant="chip"
              selected={kind === option.kind}
              onPress={() => {
                setKind(option.kind);
                setError(null);
              }}
            />
          ))}
        </View>

        {kind === 'month' ? <MonthSwitcher month={month} onChange={setMonth} /> : null}

        {kind === 'range' ? (
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setEditing('from')}
              accessibilityRole="button"
              accessibilityLabel={from != null ? `From ${formatDate(from)}` : 'Set start date'}
              className="border-border bg-surface active:bg-surface-secondary flex-1 rounded-2xl border p-3"
            >
              <Text type="body-xs" color="muted">
                From
              </Text>
              <Text type="body-sm" weight="medium">
                {from != null ? formatDate(from) : 'Choose date'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setEditing('to')}
              accessibilityRole="button"
              accessibilityLabel={to != null ? `To ${formatDate(to)}` : 'Set end date'}
              className="border-border bg-surface active:bg-surface-secondary flex-1 rounded-2xl border p-3"
            >
              <Text type="body-xs" color="muted">
                To
              </Text>
              <Text type="body-sm" weight="medium">
                {to != null ? formatDate(to) : 'Choose date'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View className="border-border bg-surface gap-3 rounded-3xl border p-4">
          <View className="flex-row items-center gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: withAlpha(colors.accent, 0.14) }}
            >
              <FileSpreadsheet color={colors.accent} size={20} />
            </View>
            <View className="flex-1">
              <Text type="body" weight="medium">
                Sheet columns
              </Text>
              <Text type="body-xs" color="muted">
                {COLUMNS.join(' · ')}
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <View
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: withAlpha(colors.danger, 0.12) }}
          >
            <Text type="body-sm" style={{ color: colors.danger }}>
              {error}
            </Text>
          </View>
        ) : null}

        <Button
          size="lg"
          className="h-14 rounded-2xl"
          isDisabled={isExporting}
          onPress={() => {
            void runExport();
          }}
          accessibilityLabel="Export to Excel"
        >
          {isExporting ? (
            <Spinner size="sm" />
          ) : (
            <Share2 color={colors.accentForeground} size={20} />
          )}
          <Button.Label>{isExporting ? 'Preparing file…' : 'Export to Excel'}</Button.Label>
        </Button>

        <View className="flex-row items-center gap-2 px-1">
          <CalendarRange color={colors.muted} size={14} />
          <Text type="body-xs" color="muted" className="flex-1">
            Amounts are exported as numbers so you can total them in any spreadsheet app.
          </Text>
        </View>
      </ScrollView>

      <DateTimeDialog
        isOpen={editing !== null}
        value={editing === 'to' ? (to ?? fallbackNow) : (from ?? fallbackNow)}
        onChange={(next) => {
          if (editing === 'from') setFrom(next);
          else if (editing === 'to') setTo(next);
          setError(null);
        }}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </View>
  );
}
