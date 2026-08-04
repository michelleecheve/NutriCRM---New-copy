
/**
 * Parses a fixed-offset timezone string in the app's own format ("UTC-06:00",
 * "UTC+05:30", "UTC±00:00") into a signed offset in minutes.
 * NOTE: this is NOT an IANA timezone name — Intl.DateTimeFormat rejects this
 * format, so it must be parsed manually. Returns 0 for missing/invalid input.
 */
export function parseUtcOffsetMinutes(timezone?: string): number {
  if (!timezone) return 0;
  if (timezone === 'UTC' || timezone === 'UTC±00:00') return 0;
  const match = timezone.match(/^UTC([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes);
}

/**
 * Returns the current {year, month (1-12), day} in the given fixed-offset
 * timezone ("UTC±HH:MM"). Falls back to the browser's local date if no
 * timezone is provided.
 */
export function getZonedDateParts(timezone?: string): { year: number; month: number; day: number } {
  if (!timezone) {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  const offsetMinutes = parseUtcOffsetMinutes(timezone);
  const shifted = new Date(Date.now() + offsetMinutes * 60_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

/**
 * Returns the current date in YYYY-MM-DD format based on the user's
 * configured timezone (fixed offset, e.g. "UTC-06:00"). If no timezone is
 * provided, it uses the browser's local time.
 */
export function getTodayStr(timezone?: string): string {
  const { year, month, day } = getZonedDateParts(timezone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatDateToLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Formats (year, month 1-based, day) as "YYYY-MM-DD". */
export function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Number of days in (year, month), month is 1-based. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Shifts (year, month) by `delta` months (can be negative), normalizing overflow. Month is 1-based. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 };
}
