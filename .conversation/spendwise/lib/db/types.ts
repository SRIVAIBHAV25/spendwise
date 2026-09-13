import type { PaymentType, Transaction, TransactionInput, UpiType } from '@/lib/types';

export interface TransactionFilters {
  /** Free text matched against category, note, payment type and UPI type. */
  search?: string;
  categories?: string[];
  paymentTypes?: PaymentType[];
  upiTypes?: UpiType[];
  /** Inclusive epoch-ms bounds on `transactionDate`. */
  from?: number | null;
  to?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
}

export type TransactionSort = 'date_desc' | 'date_asc' | 'amount_desc';

export interface TransactionQuery {
  filters?: TransactionFilters;
  sort?: TransactionSort;
  limit?: number;
  offset?: number;
}

export interface RangeSummary {
  total: number;
  count: number;
}

export interface DailyTotal {
  dayKey: string;
  total: number;
  count: number;
}

export interface GroupTotal {
  label: string;
  total: number;
  count: number;
}

export type GroupKey = 'category' | 'paymentType' | 'upiType';

/**
 * Storage contract. The native implementation is SQLite; web falls back to a
 * persisted JSON store with the same semantics so the app runs in a browser
 * preview. A future cloud sync layer can wrap this same interface.
 */
export interface TransactionRepository {
  init(): Promise<void>;
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, input: TransactionInput): Promise<Transaction>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  query(query?: TransactionQuery): Promise<Transaction[]>;
  count(filters?: TransactionFilters): Promise<number>;
  summary(filters?: TransactionFilters): Promise<RangeSummary>;
  dailyTotals(filters?: TransactionFilters): Promise<DailyTotal[]>;
  groupTotals(key: GroupKey, filters?: TransactionFilters): Promise<GroupTotal[]>;
  clearAll(): Promise<void>;
}
