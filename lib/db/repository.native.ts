/**
 * SQLite storage for iOS/Android.
 *
 * All reads are aggregate SQL queries so screens never have to load the whole
 * table to show a total, and indexes cover the columns the app filters on.
 */
import * as SQLite from 'expo-sqlite';

import { toDayKey } from '@/lib/format';
import { newId } from '@/lib/id';
import type { PaymentType, Transaction, TransactionInput, UpiType } from '@/lib/types';

import type {
  DailyTotal,
  GroupKey,
  GroupTotal,
  RangeSummary,
  TransactionFilters,
  TransactionQuery,
  TransactionRepository,
} from './types';

const DB_NAME = 'expenses.db';
const SCHEMA_VERSION = 1;

type BindValue = string | number | null;

interface Row {
  id: string;
  amount: number;
  category: string;
  paymentType: string;
  upiType: string | null;
  note: string | null;
  transactionDate: number;
  dayKey: string;
  createdAt: number;
  updatedAt: number;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS "transactions" (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      paymentType TEXT NOT NULL,
      upiType TEXT,
      note TEXT,
      transactionDate INTEGER NOT NULL,
      dayKey TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tx_date ON "transactions" (transactionDate DESC);
    CREATE INDEX IF NOT EXISTS idx_tx_day ON "transactions" (dayKey);
    CREATE INDEX IF NOT EXISTS idx_tx_category ON "transactions" (category);
    CREATE INDEX IF NOT EXISTS idx_tx_payment ON "transactions" (paymentType);
    CREATE INDEX IF NOT EXISTS idx_tx_upi ON "transactions" (upiType);
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((versionRow?.user_version ?? 0) < SCHEMA_VERSION) {
    // Future migrations append here, guarded by the stored version number.
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await migrate(db);
    return db;
  })();
  return dbPromise;
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

function buildWhere(filters: TransactionFilters = {}): { clause: string; args: BindValue[] } {
  const parts: string[] = [];
  const args: BindValue[] = [];

  if (filters.from != null) {
    parts.push('transactionDate >= ?');
    args.push(filters.from);
  }
  if (filters.to != null) {
    parts.push('transactionDate <= ?');
    args.push(filters.to);
  }
  if (filters.categories?.length) {
    parts.push(`category IN (${placeholders(filters.categories.length)})`);
    args.push(...filters.categories);
  }
  if (filters.paymentTypes?.length) {
    parts.push(`paymentType IN (${placeholders(filters.paymentTypes.length)})`);
    args.push(...filters.paymentTypes);
  }
  if (filters.upiTypes?.length) {
    parts.push(`upiType IN (${placeholders(filters.upiTypes.length)})`);
    args.push(...filters.upiTypes);
  }
  if (filters.minAmount != null) {
    parts.push('amount >= ?');
    args.push(filters.minAmount);
  }
  if (filters.maxAmount != null) {
    parts.push('amount <= ?');
    args.push(filters.maxAmount);
  }
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    parts.push(
      "(lower(category) LIKE ? OR lower(ifnull(note, '')) LIKE ? OR lower(paymentType) LIKE ? OR lower(ifnull(upiType, '')) LIKE ?)",
    );
    const like = `%${search}%`;
    args.push(like, like, like, like);
  }

  return { clause: parts.length ? `WHERE ${parts.join(' AND ')}` : '', args };
}

function orderBy(sort: TransactionQuery['sort']): string {
  switch (sort) {
    case 'date_asc':
      return 'ORDER BY transactionDate ASC, createdAt ASC';
    case 'amount_desc':
      return 'ORDER BY amount DESC, transactionDate DESC';
    default:
      return 'ORDER BY transactionDate DESC, createdAt DESC';
  }
}

function toTransaction(row: Row): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    category: row.category,
    paymentType: row.paymentType as PaymentType,
    upiType: (row.upiType as UpiType | null) ?? null,
    note: row.note,
    transactionDate: row.transactionDate,
    dayKey: row.dayKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
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

export const repository: TransactionRepository = {
  async init() {
    await getDb();
  },

  async create(input) {
    const db = await getDb();
    const now = Date.now();
    const values = normalize(input);
    const row: Row = { id: newId(), ...values, createdAt: now, updatedAt: now };
    await db.runAsync(
      `INSERT INTO "transactions"
        (id, amount, category, paymentType, upiType, note, transactionDate, dayKey, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.amount,
        row.category,
        row.paymentType,
        row.upiType,
        row.note,
        row.transactionDate,
        row.dayKey,
        row.createdAt,
        row.updatedAt,
      ],
    );
    return toTransaction(row);
  },

  async update(id, input) {
    const db = await getDb();
    const existing = await db.getFirstAsync<Row>('SELECT * FROM "transactions" WHERE id = ?', [id]);
    if (!existing) throw new Error('That expense could no longer be found.');
    const values = normalize(input);
    const updatedAt = Date.now();
    await db.runAsync(
      `UPDATE "transactions"
         SET amount = ?, category = ?, paymentType = ?, upiType = ?, note = ?,
             transactionDate = ?, dayKey = ?, updatedAt = ?
       WHERE id = ?`,
      [
        values.amount,
        values.category,
        values.paymentType,
        values.upiType,
        values.note,
        values.transactionDate,
        values.dayKey,
        updatedAt,
        id,
      ],
    );
    return toTransaction({ ...existing, ...values, updatedAt });
  },

  async remove(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM "transactions" WHERE id = ?', [id]);
  },

  async findById(id) {
    const db = await getDb();
    const row = await db.getFirstAsync<Row>('SELECT * FROM "transactions" WHERE id = ?', [id]);
    return row ? toTransaction(row) : null;
  },

  async query(query = {}) {
    const db = await getDb();
    const { clause, args } = buildWhere(query.filters);
    const limit = query.limit != null ? ` LIMIT ${Math.max(0, Math.floor(query.limit))}` : '';
    const offset =
      query.limit != null && query.offset ? ` OFFSET ${Math.max(0, Math.floor(query.offset))}` : '';
    const rows = await db.getAllAsync<Row>(
      `SELECT * FROM "transactions" ${clause} ${orderBy(query.sort)}${limit}${offset}`,
      args,
    );
    return rows.map(toTransaction);
  },

  async count(filters) {
    const db = await getDb();
    const { clause, args } = buildWhere(filters);
    const row = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM "transactions" ${clause}`,
      args,
    );
    return row?.total ?? 0;
  },

  async summary(filters): Promise<RangeSummary> {
    const db = await getDb();
    const { clause, args } = buildWhere(filters);
    const row = await db.getFirstAsync<{ total: number | null; count: number }>(
      `SELECT SUM(amount) as total, COUNT(*) as count FROM "transactions" ${clause}`,
      args,
    );
    return { total: row?.total ?? 0, count: row?.count ?? 0 };
  },

  async dailyTotals(filters): Promise<DailyTotal[]> {
    const db = await getDb();
    const { clause, args } = buildWhere(filters);
    return db.getAllAsync<DailyTotal>(
      `SELECT dayKey, SUM(amount) as total, COUNT(*) as count
         FROM "transactions" ${clause}
        GROUP BY dayKey
        ORDER BY dayKey ASC`,
      args,
    );
  },

  async groupTotals(key: GroupKey, filters): Promise<GroupTotal[]> {
    const db = await getDb();
    const base = buildWhere(filters);
    const clause =
      key === 'upiType'
        ? base.clause
          ? `${base.clause} AND upiType IS NOT NULL`
          : 'WHERE upiType IS NOT NULL'
        : base.clause;
    return db.getAllAsync<GroupTotal>(
      `SELECT ${key} as label, SUM(amount) as total, COUNT(*) as count
         FROM "transactions" ${clause}
        GROUP BY ${key}
        ORDER BY total DESC`,
      base.args,
    );
  },

  async clearAll() {
    const db = await getDb();
    await db.execAsync('DELETE FROM "transactions"');
  },
};
