import { format } from 'date-fns';

/**
 * Returns the current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Formats a date string to YYYY-MM-DD
 * @param date The date to format
 */
export function formatDateToYYYYMMDD(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Formats a date string from YYYYMMDD to YYYY-MM-DD
 * @param dateStr The date string in YYYYMMDD format
 */
export function formatYYYYMMDDToDateString(dateStr: string): string {
  if (dateStr.length !== 8) return dateStr;
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}

/**
 * Checks if a date is in the future
 * @param date The date to check
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj > today;
}

/**
 * Checks if a date is valid
 * @param date The date to check
 */
export function isValidDate(date: Date | string): boolean {
  if (typeof date === 'string') {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }
  return !isNaN(date.getTime());
}

/**
 * Converts a date string to a consistent format for storage
 * Ensures the date is stored in local timezone without time component
 * @param dateStr Date string in YYYY-MM-DD format
 */
export function normalizeDateForStorage(dateStr: string): string {
  if (!dateStr) return dateStr;

  // Parse the date in local timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  // Format back to YYYY-MM-DD to ensure consistent format
  return format(date, 'yyyy-MM-dd');
}
