/**
 * Search + filter state for the transaction history screen. Kept in a store so
 * the filter modal and the list stay in sync across navigation.
 */
import { create } from 'zustand';

import type { TransactionFilters } from '@/lib/db';
import type { PaymentType, UpiType } from '@/lib/types';

export interface HistoryFilters {
  categories: string[];
  paymentTypes: PaymentType[];
  upiTypes: UpiType[];
  from: number | null;
  to: number | null;
  minAmount: number | null;
  maxAmount: number | null;
}

export const EMPTY_FILTERS: HistoryFilters = {
  categories: [],
  paymentTypes: [],
  upiTypes: [],
  from: null,
  to: null,
  minAmount: null,
  maxAmount: null,
};

interface FiltersState {
  search: string;
  filters: HistoryFilters;
  setSearch: (search: string) => void;
  applyFilters: (filters: HistoryFilters) => void;
  clearFilters: () => void;
  resetAll: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  search: '',
  filters: EMPTY_FILTERS,
  setSearch: (search) => set({ search }),
  applyFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: EMPTY_FILTERS }),
  resetAll: () => set({ search: '', filters: EMPTY_FILTERS }),
}));

/** Number of filter groups currently narrowing the list (search excluded). */
export function countActiveFilters(filters: HistoryFilters): number {
  let count = 0;
  if (filters.categories.length) count += 1;
  if (filters.paymentTypes.length) count += 1;
  if (filters.upiTypes.length) count += 1;
  if (filters.from != null || filters.to != null) count += 1;
  if (filters.minAmount != null) count += 1;
  if (filters.maxAmount != null) count += 1;
  return count;
}

export function toRepositoryFilters(search: string, filters: HistoryFilters): TransactionFilters {
  return {
    search: search.trim() || undefined,
    categories: filters.categories.length ? filters.categories : undefined,
    paymentTypes: filters.paymentTypes.length ? filters.paymentTypes : undefined,
    upiTypes: filters.upiTypes.length ? filters.upiTypes : undefined,
    from: filters.from,
    to: filters.to,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
  };
}

/** Guards against ranges that can never match, e.g. min above max. */
export function validateFilters(filters: HistoryFilters): string | null {
  if (filters.from != null && filters.to != null && filters.from > filters.to) {
    return 'The start date must come before the end date.';
  }
  if (
    filters.minAmount != null &&
    filters.maxAmount != null &&
    filters.minAmount > filters.maxAmount
  ) {
    return 'The minimum amount must be lower than the maximum.';
  }
  return null;
}
