import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns';

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Safely parse a date value into a Date object.
 * Returns `null` if the value is falsy or unparseable.
 */
export function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format a date in a given pattern (defaults to 'MMM d, yyyy').
 */
export function formatDateString(date: string | Date | null | undefined, pattern = 'MMM d, yyyy'): string {
  const d = safeParseDate(date);
  if (!d) return '';
  return format(d, pattern);
}

/**
 * Format a date with time (e.g. "Jan 15, 2025 3:30 PM").
 */
export function formatDateTimeString(date: string | Date | null | undefined): string {
  return formatDateString(date, 'MMM d, yyyy h:mm a');
}

/**
 * Format a time only (e.g. "3:30 PM").
 */
export function formatTimeString(date: string | Date | null | undefined): string {
  return formatDateString(date, 'h:mm a');
}

/**
 * Return a human-readable relative string like "5 minutes ago".
 */
export function timeAgo(date: string | Date | null | undefined): string {
  const d = safeParseDate(date);
  if (!d) return '';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Return a smart date label:
 * - "Today" / "Yesterday" for recent dates
 * - "Mon", "Tue" etc. for this week
 * - Otherwise the standard formatted date
 */
export function smartDateLabel(date: string | Date | null | undefined): string {
  const d = safeParseDate(date);
  if (!d) return '';

  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d)) return format(d, 'EEEE'); // e.g. "Monday"
  if (isThisYear(d)) return format(d, 'MMM d'); // e.g. "Jan 15"
  return format(d, 'MMM d, yyyy');
}

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

export { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
export { addDays, subDays };

/**
 * Return the start-of-day and end-of-day for a given date (useful for DB queries).
 */
export function dayRange(date: Date): { start: Date; end: Date } {
  return { start: startOfDay(date), end: endOfDay(date) };
}

/**
 * Return the start-of-week and end-of-week for a given date.
 */
export function weekRange(date: Date): { start: Date; end: Date } {
  return { start: startOfWeek(date), end: endOfWeek(date) };
}

/**
 * Return the start-of-month and end-of-month for a given date.
 */
export function monthRange(date: Date): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

// ---------------------------------------------------------------------------
// Comparison / query helpers
// ---------------------------------------------------------------------------

export { isToday, isYesterday, isThisWeek, isThisMonth, isThisYear };
export { isBefore, isAfter, isSameDay };
export { differenceInDays, differenceInHours, differenceInMinutes };

/**
 * Check whether a date has passed (is in the past).
 */
export function isPast(date: string | Date | null | undefined): boolean {
  const d = safeParseDate(date);
  if (!d) return false;
  return isBefore(d, new Date());
}

/**
 * Check whether a date is in the future.
 */
export function isFuture(date: string | Date | null | undefined): boolean {
  const d = safeParseDate(date);
  if (!d) return false;
  return isAfter(d, new Date());
}

/**
 * Get the number of days between two dates (absolute value).
 */
export function daysBetween(a: string | Date, b: string | Date): number {
  const da = safeParseDate(a);
  const db = safeParseDate(b);
  if (!da || !db) return 0;
  return Math.abs(differenceInDays(da, db));
}
