import { router } from 'expo-router';
import { Input, Text } from 'heroui-native';
import { ListFilter, Search, SearchX, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionRow } from '@/components/TransactionRow';
import { useDbQuery } from '@/hooks/useDbQuery';
import { formatCurrency } from '@/lib/format';
import { loadTransactions } from '@/lib/queries';
import { countActiveFilters, toRepositoryFilters, useFiltersStore } from '@/lib/stores/filters';
import { useAppColors, withAlpha } from '@/lib/theme';
import type { Transaction } from '@/lib/types';

const PAGE_SIZE = 40;
const INITIAL = { rows: [] as Transaction[], total: 0, matched: 0 };

export default function HistoryScreen() {
  const colors = useAppColors();
  const search = useFiltersStore((state) => state.search);
  const setSearch = useFiltersStore((state) => state.setSearch);
  const filters = useFiltersStore((state) => state.filters);
  const clearFilters = useFiltersStore((state) => state.clearFilters);

  const [text, setText] = useState(search);
  const repositoryFilters = useMemo(() => toRepositoryFilters(search, filters), [search, filters]);
  // Reset pagination during render (not in an effect) whenever the active
  // filters change, so switching filters never shows a stale page size.
  const [page, setPage] = useState(() => ({ filters: repositoryFilters, limit: PAGE_SIZE }));
  if (page.filters !== repositoryFilters) {
    setPage({ filters: repositoryFilters, limit: PAGE_SIZE });
  }
  const limit = page.limit;

  // Debounced so typing does not fire a query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(text), 250);
    return () => clearTimeout(timer);
  }, [text, setSearch]);

  const load = useCallback(
    () => loadTransactions(repositoryFilters, limit),
    [repositoryFilters, limit],
  );
  const { data, isLoading, error } = useDbQuery(load, INITIAL);

  const activeCount = countActiveFilters(filters);
  const hasQuery = Boolean(search.trim()) || activeCount > 0;

  const openTransaction = useCallback((transaction: Transaction) => {
    router.push({ pathname: '/expense/[id]', params: { id: transaction.id } });
  }, []);

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader title="Transactions" subtitle="Newest first" backFallback="/" />

      <View className="gap-3 px-5 pb-3">
        <View className="flex-row items-center gap-2">
          <View className="border-border bg-surface flex-1 flex-row items-center gap-2 rounded-2xl border px-3">
            <Search color={colors.muted} size={18} />
            <Input
              value={text}
              onChangeText={setText}
              placeholder="Search category, note or payment"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search transactions"
              containerClassName="flex-1"
              className="border-0 bg-transparent px-0"
            />
            {text ? (
              <Pressable
                onPress={() => setText('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
                className="active:bg-surface-secondary h-8 w-8 items-center justify-center rounded-full"
              >
                <X color={colors.muted} size={16} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={() => router.push('/history/filters')}
            accessibilityRole="button"
            accessibilityLabel={activeCount > 0 ? `Filters, ${activeCount} active` : 'Open filters'}
            className="border-border h-12 w-12 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: activeCount > 0 ? withAlpha(colors.accent, 0.14) : colors.surface,
              borderColor: activeCount > 0 ? colors.accent : colors.border,
            }}
          >
            <ListFilter color={activeCount > 0 ? colors.accent : colors.foreground} size={20} />
            {activeCount > 0 ? (
              <View
                className="absolute -top-1 -right-1 h-5 min-w-5 items-center justify-center rounded-full px-1"
                style={{ backgroundColor: colors.accent }}
              >
                <Text
                  type="body-xs"
                  weight="bold"
                  style={{ color: colors.accentForeground, fontSize: 10 }}
                >
                  {`${activeCount}`}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between">
          <Text type="body-sm" color="muted">
            {isLoading
              ? 'Loading…'
              : `${data.matched} ${data.matched === 1 ? 'result' : 'results'} · ${formatCurrency(
                  data.total,
                )}`}
          </Text>
          {activeCount > 0 ? (
            <Pressable
              onPress={clearFilters}
              accessibilityRole="button"
              accessibilityLabel="Clear filters"
              hitSlop={8}
              className="min-h-9 justify-center"
            >
              <Text type="body-sm" weight="medium" className="text-accent">
                Clear filters
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={data.rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionRow transaction={item} onPress={openTransaction} showDate className="mx-3" />
        )}
        contentContainerClassName="px-2 pb-10"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={9}
        removeClippedSubviews
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (data.rows.length >= limit && limit < data.matched) {
            setPage((current) => ({ ...current, limit: current.limit + PAGE_SIZE }));
          }
        }}
        ListFooterComponent={
          data.rows.length > 0 && data.rows.length < data.matched ? (
            <Text type="body-xs" color="muted" align="center" className="py-4">
              Loading more…
            </Text>
          ) : null
        }
        ListEmptyComponent={
          error ? (
            <EmptyState
              icon={SearchX}
              title="Could not load transactions"
              description={error}
              tone="danger"
            />
          ) : isLoading ? null : hasQuery ? (
            <EmptyState
              icon={SearchX}
              title="No matching expenses"
              description="Try a different search or remove some filters."
              actionLabel={activeCount > 0 ? 'Clear filters' : undefined}
              onAction={activeCount > 0 ? clearFilters : undefined}
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title="No expenses yet"
              description="Your saved expenses will appear here."
              actionLabel="Add Expense"
              onAction={() => router.push('/expense/new')}
            />
          )
        }
      />
    </View>
  );
}
