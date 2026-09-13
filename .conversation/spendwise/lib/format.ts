/**
 * Indian-locale money formatting plus the date helpers used across screens.
 * Grouping is implemented manually so it is identical on Hermes (iOS/Android)
 * and on web, without depending on full ICU data.
 */
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isToday,
  isYesterday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export const RUPEE = '\u20B9';

/** 1234567 -> "12,34,567" (Indian digit grouping). */
export function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

export function formatAmount(amount: number, forceDecimals = false): string {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const hasFraction = Math.round(safe * 100) % 100 !== 0;
  const fixed = safe.toFixed(hasFraction || forceDecimals ? 2 : 0);
  const [intPart, fraction] = fixed.split('.');
  const grouped = groupIndian(intPart ?? '0');
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function formatCurrency(amount: number, forceDecimals = false): string {
  return `${RUPEE}${formatAmount(amount, forceDecimals)}`;
}

/** Compact money for dense surfaces such as calendar cells: ₹1.2k, ₹1.5L. */
export function formatCompactCurrency(amount: number): string {
  const safe = Math.abs(amount);
  if (safe >= 10000000) return `${RUPEE}${(safe / 10000000).toFixed(1)}Cr`;
  if (safe >= 100000) return `${RUPEE}${(safe / 100000).toFixed(1)}L`;
  if (safe >= 1000) return `${RUPEE}${(safe / 1000).toFixed(safe >= 10000 ? 0 : 1)}k`;
  return `${RUPEE}${formatAmount(safe)}`;
}

/**
 * Formats the raw numpad buffer for display, preserving what the user typed
 * (a trailing dot or a trailing zero) while grouping the integer digits.
 */
export function formatAmountInput(raw: string): string {
  if (!raw) return '0';
  const [intPart = '', fraction] = raw.split('.');
  const grouped = groupIndian(intPart.replace(/^0+(?=\d)/, '') || '0');
  if (raw.includes('.')) return `${grouped}.${fraction ?? ''}`;
  return grouped;
}

export function parseAmountInput(raw: string): number {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100) / 100;
}

export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function formatPercent(value: number): string {
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}%`;
}

export function formatTime(ts: number): string {
  return format(ts, 'h:mm a');
}

export function formatDate(ts: number): string {
  return format(ts, 'd MMM yyyy');
}

export function formatDateTime(ts: number): string {
  return `${format(ts, 'd MMM yyyy')} \u00B7 ${format(ts, 'h:mm a')}`;
}

/** "Today" / "Yesterday" / "Mon, 8 Sep". */
export function formatDayLabel(ts: number): string {
  if (isToday(ts)) return 'Today';
  if (isYesterday(ts)) return 'Yesterday';
  return format(ts, 'EEE, d MMM');
}

export function monthLabel(date: Date | number): string {
  return format(date, 'MMMM yyyy');
}

export function shortMonthLabel(date: Date | number): string {
  return format(date, 'MMM yyyy');
}

export function toDayKey(date: Date | number): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export interface Range {
  from: number;
  to: number;
}

export function dayRange(date: Date | number): Range {
  return { from: startOfDay(date).getTime(), to: endOfDay(date).getTime() };
}

export function weekRange(date: Date | number): Range {
  return {
    from: startOfWeek(date, { weekStartsOn: 1 }).getTime(),
    to: endOfWeek(date, { weekStartsOn: 1 }).getTime(),
  };
}

export function monthRange(date: Date | number): Range {
  return { from: startOfMonth(date).getTime(), to: endOfMonth(date).getTime() };
}

/**
 * Days used to average spending: elapsed days for the running month, the full
 * month once it is over.
 */
export function daysForAverage(month: Date): number {
  const now = new Date();
  const isCurrentMonth =
    month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  if (isCurrentMonth) return now.getDate();
  return endOfMonth(month).getDate();
}

export function initials(text: string): string {
  return text.trim().slice(0, 1).toUpperCase() || '?';
}
