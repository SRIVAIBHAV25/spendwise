/**
 * Aggregate read layer. Screens call these loaders through `useDbQuery` so all
 * numbers are computed by storage, never cached or hand-maintained.
 */
import { differenceInCalendarDays, startOfWeek } from 'date-fns';

import { type DailyTotal, type GroupTotal, repository, type TransactionFilters } from '@/lib/db';
import { dayRange, daysForAverage, fromDayKey, monthRange, weekRange } from '@/lib/format';
import type { Transaction } from '@/lib/types';

export interface HomeData {
  monthTotal: number;
  monthCount: number;
  todayTotal: number;
  todayCount: number;
  weekTotal: number;
  weekAveragePerDay: number;
  recent: Transaction[];
  totalCount: number;
}

export async function loadHomeData(recentLimit = 6): Promise<HomeData> {
  const now = new Date();
  const month = monthRange(now);
  const today = dayRange(now);
  const week = weekRange(now);

  const [monthSummary, todaySummary, weekSummary, recent, totalCount] = await Promise.all([
    repository.summary(month),
    repository.summary(today),
    repository.summary(week),
    repository.query({ limit: recentLimit, sort: 'date_desc' }),
    repository.count(),
  ]);

  const daysIntoWeek = differenceInCalendarDays(now, startOfWeek(now, { weekStartsOn: 1 })) + 1;

  return {
    monthTotal: monthSummary.total,
    monthCount: monthSummary.count,
    todayTotal: todaySummary.total,
    todayCount: todaySummary.count,
    weekTotal: weekSummary.total,
    weekAveragePerDay: weekSummary.total / Math.max(1, daysIntoWeek),
    recent,
    totalCount,
  };
}

export interface MonthReport {
  total: number;
  count: number;
  averagePerDay: number;
  weekTotal: number;
  highestDay: DailyTotal | null;
  largest: Transaction | null;
  categories: GroupTotal[];
  payments: GroupTotal[];
  upiTypes: GroupTotal[];
  daily: DailyTotal[];
}

export async function loadMonthReport(month: Date): Promise<MonthReport> {
  const range = monthRange(month);
  const [summary, categories, payments, upiTypes, daily, largestRows] = await Promise.all([
    repository.summary(range),
    repository.groupTotals('category', range),
    repository.groupTotals('paymentType', range),
    repository.groupTotals('upiType', range),
    repository.dailyTotals(range),
    repository.query({ filters: range, sort: 'amount_desc', limit: 1 }),
  ]);

  const highestDay = daily.reduce<DailyTotal | null>(
    (best, day) => (!best || day.total > best.total ? day : best),
    null,
  );

  const now = new Date();
  const inCurrentMonth =
    now.getTime() >= range.from && now.getTime() <= range.to
      ? weekRange(now)
      : { from: range.from, to: range.to };
  const weekSummary = await repository.summary(inCurrentMonth);

  return {
    total: summary.total,
    count: summary.count,
    averagePerDay: summary.total / Math.max(1, daysForAverage(month)),
    weekTotal: weekSummary.total,
    highestDay,
    largest: largestRows[0] ?? null,
    categories,
    payments,
    upiTypes,
    daily,
  };
}

export interface CalendarMonthData {
  byDay: Record<string, DailyTotal>;
  total: number;
  count: number;
  maxDayTotal: number;
  activeDays: number;
}

export async function loadCalendarMonth(month: Date): Promise<CalendarMonthData> {
  const range = monthRange(month);
  const [daily, summary] = await Promise.all([
    repository.dailyTotals(range),
    repository.summary(range),
  ]);

  const byDay: Record<string, DailyTotal> = {};
  let maxDayTotal = 0;
  for (const day of daily) {
    byDay[day.dayKey] = day;
    if (day.total > maxDayTotal) maxDayTotal = day.total;
  }

  return {
    byDay,
    total: summary.total,
    count: summary.count,
    maxDayTotal,
    activeDays: daily.length,
  };
}

export interface DayData {
  transactions: Transaction[];
  total: number;
  count: number;
}

export async function loadDay(dayKey: string): Promise<DayData> {
  const range = dayRange(fromDayKey(dayKey));
  const [transactions, summary] = await Promise.all([
    repository.query({ filters: range, sort: 'date_desc' }),
    repository.summary(range),
  ]);
  return { transactions, total: summary.total, count: summary.count };
}

export async function loadTransactions(
  filters: TransactionFilters,
  limit: number,
): Promise<{ rows: Transaction[]; total: number; matched: number }> {
  const [rows, matched, summary] = await Promise.all([
    repository.query({ filters, sort: 'date_desc', limit }),
    repository.count(filters),
    repository.summary(filters),
  ]);
  return { rows, total: summary.total, matched };
}
