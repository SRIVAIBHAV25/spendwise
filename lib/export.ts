/**
 * Excel export. Rows always come from the transaction records themselves, so a
 * sheet can never disagree with the app's own totals.
 *
 * Native writes the workbook into the cache directory and hands it to the OS
 * share sheet; web triggers a normal browser download.
 */
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';

import { repository, type TransactionFilters } from '@/lib/db';
import { formatDate, formatTime, monthRange } from '@/lib/format';
import type { ExportRangeKind, Transaction } from '@/lib/types';

export interface ExportRequest {
  kind: ExportRangeKind;
  /** Used when `kind` is `month`. */
  month?: Date;
  /** Used when `kind` is `range`. */
  from?: number | null;
  to?: number | null;
}

export interface ExportResult {
  fileName: string;
  rowCount: number;
  /** True when the file was handed to the native share sheet. */
  shared: boolean;
}

const SHEET_HEADERS = [
  'Date',
  'Time',
  'Category',
  'Amount',
  'Payment Type',
  'UPI Type',
  'Note',
] as const;

function toFilters(request: ExportRequest): TransactionFilters {
  if (request.kind === 'month') return monthRange(request.month ?? new Date());
  if (request.kind === 'range') return { from: request.from ?? null, to: request.to ?? null };
  return {};
}

function buildFileName(request: ExportRequest): string {
  const stamp = new Date().toISOString().slice(0, 10);
  if (request.kind === 'month') {
    const month = request.month ?? new Date();
    return `expenses-${month.getFullYear()}-${`${month.getMonth() + 1}`.padStart(2, '0')}.xlsx`;
  }
  if (request.kind === 'range') return `expenses-range-${stamp}.xlsx`;
  return `expenses-all-${stamp}.xlsx`;
}

function toSheetRows(transactions: Transaction[]): (string | number)[][] {
  return transactions.map((transaction) => [
    formatDate(transaction.transactionDate),
    formatTime(transaction.transactionDate),
    transaction.category,
    transaction.amount,
    transaction.paymentType,
    transaction.upiType ?? '',
    transaction.note ?? '',
  ]);
}

function buildWorkbook(transactions: Transaction[]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet([[...SHEET_HEADERS], ...toSheetRows(transactions)]);
  sheet['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 32 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Expenses');
  const output: unknown = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  if (!(output instanceof ArrayBuffer)) {
    throw new Error('Could not generate the Excel workbook.');
  }
  return output;
}

function downloadOnWeb(buffer: ArrayBuffer, fileName: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Builds the workbook and hands it to the platform's share or download flow. */
export async function exportTransactions(request: ExportRequest): Promise<ExportResult> {
  const transactions = await repository.query({ filters: toFilters(request), sort: 'date_asc' });
  if (transactions.length === 0) {
    throw new Error('There are no expenses in that range to export.');
  }

  const fileName = buildFileName(request);
  const buffer = buildWorkbook(transactions);

  if (Platform.OS === 'web') {
    downloadOnWeb(buffer, fileName);
    return { fileName, rowCount: transactions.length, shared: false };
  }

  const directory = new Directory(Paths.cache, 'exports');
  if (!directory.exists) directory.create({ intermediates: true });

  const file = new File(directory, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(new Uint8Array(buffer));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return { fileName, rowCount: transactions.length, shared: false };

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Share your expense sheet',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });

  return { fileName, rowCount: transactions.length, shared: true };
}
