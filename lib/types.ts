/**
 * Core domain types for the expense tracker.
 *
 * Everything is local-first: a transaction row is the single source of truth
 * and every total in the app is derived from these records.
 */

export const PAYMENT_TYPES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const UPI_TYPES = ['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Other'] as const;
export type UpiType = (typeof UPI_TYPES)[number];

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  paymentType: PaymentType;
  upiType: UpiType | null;
  note: string | null;
  /** Epoch milliseconds of when the expense happened (user editable). */
  transactionDate: number;
  /** Local calendar day of `transactionDate`, `yyyy-MM-dd`. */
  dayKey: string;
  createdAt: number;
  updatedAt: number;
}

export type TransactionInput = Pick<
  Transaction,
  'amount' | 'category' | 'paymentType' | 'upiType' | 'note' | 'transactionDate'
>;

export interface Category {
  id: string;
  name: string;
  /** Key into the icon registry in `lib/catalog.ts`. */
  icon: string;
  /** Hex color used for icon chips and charts. */
  color: string;
  /** Built-in categories cannot be renamed away from their seed identity. */
  isDefault?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type BudgetThreshold = 75 | 90 | 100;

export type ExportRangeKind = 'month' | 'range' | 'all';
