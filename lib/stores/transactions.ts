/**
 * Transaction store. It intentionally holds no cached totals: every screen
 * reads aggregates straight from storage and `revision` is bumped after each
 * write so all live queries recalculate.
 */
import { create } from 'zustand';

import { repository } from '@/lib/db';
import { toUserMessage } from '@/lib/errors';
import type { Transaction, TransactionInput } from '@/lib/types';

export type StoreStatus = 'idle' | 'loading' | 'ready' | 'error';

interface TransactionsState {
  status: StoreStatus;
  error: string | null;
  /** Increments on every mutation; live queries depend on it. */
  revision: number;
  init: () => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<Transaction>;
  editTransaction: (id: string, input: TransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  status: 'idle',
  error: null,
  revision: 0,

  init: async () => {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading', error: null });
    try {
      await repository.init();
      set({ status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: toUserMessage(error, 'Could not open your expense storage.') });
    }
  },

  addTransaction: async (input) => {
    const created = await repository.create(input);
    set((state) => ({ revision: state.revision + 1 }));
    return created;
  },

  editTransaction: async (id, input) => {
    const updated = await repository.update(id, input);
    set((state) => ({ revision: state.revision + 1 }));
    return updated;
  },

  deleteTransaction: async (id) => {
    await repository.remove(id);
    set((state) => ({ revision: state.revision + 1 }));
  },

  clearAllTransactions: async () => {
    await repository.clearAll();
    set((state) => ({ revision: state.revision + 1 }));
  },
}));
