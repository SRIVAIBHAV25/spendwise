/**
 * Web fallback storage (browser preview). expo-sqlite requires a WASM asset
 * that is not part of this bundle, so the web build keeps the same repository
 * contract on top of a persisted JSON document. Native uses
 * `repository.native.ts` (real SQLite) and is the production path.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { toDayKey } from '@/lib/format';
import { newId } from '@/lib/id';
import type { Transaction, TransactionInput } from '@/lib/types';

import type {
  DailyTotal,
  GroupKey,
  GroupTotal,
  RangeSummary,
  TransactionFilters,
  TransactionQuery,
  TransactionRepository,
} from './types';

const STORAGE_KEY = 'expense-tracker/transactions/v1';

let cache: Transaction[] | null = null;

/** Guards the persisted JSON so a corrupt entry cannot poison the cache. */
function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== 'object' || value === null) return false;
  const read = (key: string): unknown => Reflect.get(value, key);
  return (
    typeof read('id') === 'string' &&
    typeof read('amount') === 'number' &&
    typeof read('category') === 'string' &&
    typeof read('paymentType') === 'string' &&
    typeof read('transactionDate') === 'number' &&
    typeof read('dayKey') === 'string'
  );
}

async function load(): Promise<Transaction[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter(isTransaction) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function persist(rows: Transaction[]): Promise<void> {
  cache = rows;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function normalize(input: TransactionInput) {
  const note = input.note?.trim() ?? '';
  return {
    amount: Math.round(input.amount * 100) / 100,
    category: input.category,
    paymentType: input.paymentType,
    upiType: input.paymentType === 'UPI' ? input.upiType : null,
    note: note.length ? note : null,
    transactionDate: input.transactionDate,
    dayKey: toDayKey(input.transactionDate),
  };
}

function matches(txn: Transaction, filters: TransactionFilters = {}): boolean {
  if (filters.from != null && txn.transactionDate < filters.from) return false;
  if (filters.to != null && txn.transactionDate > filters.to) return false;
  if (filters.categories?.length && !filters.categories.includes(txn.category)) return false;
  if (filters.paymentTypes?.length && !filters.paymentTypes.includes(txn.paymentType)) return false;
  if (filters.upiTypes?.length && !(txn.upiType && filters.upiTypes.includes(txn.upiType))) {
    return false;
  }
  if (filters.minAmount != null && txn.amount < filters.minAmount) return false;
  if (filters.maxAmount != null && txn.amount > filters.maxAmount) return false;
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const haystack = [txn.category, txn.note ?? '', txn.paymentType, txn.upiType ?? '']
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  return true;
}

function sortRows(rows: Transaction[], sort: TransactionQuery['sort']): Transaction[] {
  const copy = [...rows];
  switch (sort) {
    case 'date_asc':
      return copy.sort(
        (a, b) => a.transactionDate - b.transactionDate || a.createdAt - b.createdAt,
      );
    case 'amount_desc':
      return copy.sort((a, b) => b.amount - a.amount || b.transactionDate - a.transactionDate);
    default:
      return copy.sort(
        (a, b) => b.transactionDate - a.transactionDate || b.createdAt - a.createdAt,
      );
  }
}

async function filtered(filters?: TransactionFilters): Promise<Transaction[]> {
  const rows = await load();
  return rows.filter((row) => matches(row, filters));
}

export const repository: TransactionRepository = {
  async init() {
    await load();
  },

  async create(input) {
    const rows = await load();
    const now = Date.now();
    const txn: Transaction = { id: newId(), ...normalize(input), createdAt: now, updatedAt: now };
    await persist([txn, ...rows]);
    return txn;
  },

  async update(id, input) {
    const rows = await load();
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) throw new Error('That expense could no longer be found.');
    const existing = rows[index];
    if (!existing) throw new Error('That expense could no longer be found.');
    const updated: Transaction = { ...existing, ...normalize(input), updatedAt: Date.now() };
    const next = [...rows];
    next[index] = updated;
    await persist(next);
    return updated;
  },

  async remove(id) {
    const rows = await load();
    await persist(rows.filter((row) => row.id !== id));
  },

  async findById(id) {
    const rows = await load();
    return rows.find((row) => row.id === id) ?? null;
  },

  async query(query = {}) {
    const rows = sortRows(await filtered(query.filters), query.sort);
    if (query.limit == null) return rows;
    const start = query.offset ?? 0;
    return rows.slice(start, start + query.limit);
  },

  async count(filters) {
    return (await filtered(filters)).length;
  },

  async summary(filters): Promise<RangeSummary> {
    const rows = await filtered(filters);
    return {
      total: rows.reduce((sum, row) => sum + row.amount, 0),
      count: rows.length,
    };
  },

  async dailyTotals(filters): Promise<DailyTotal[]> {
    const rows = await filtered(filters);
    const map = new Map<string, DailyTotal>();
    for (const row of rows) {
      const entry = map.get(row.dayKey) ?? { dayKey: row.dayKey, total: 0, count: 0 };
      entry.total += row.amount;
      entry.count += 1;
      map.set(row.dayKey, entry);
    }
    return [...map.values()].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  },

  async groupTotals(key: GroupKey, filters): Promise<GroupTotal[]> {
    const rows = await filtered(filters);
    const map = new Map<string, GroupTotal>();
    for (const row of rows) {
      const label = row[key];
      if (!label) continue;
      const entry = map.get(label) ?? { label, total: 0, count: 0 };
      entry.total += row.amount;
      entry.count += 1;
      map.set(label, entry);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  },

  async clearAll() {
    await persist([]);
  },
};
