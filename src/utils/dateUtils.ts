
/**
 * Returns the current date in YYYY-MM-DD format based on a specific timezone.
 * If no timezone is provided, it uses the browser's local time.
 */
export function getTodayStr(timezone?: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone
    };
    
    // Using 'en-CA' locale because it naturally formats as YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(new Date());
  } catch (e) {
    // Fallback to local browser time if timezone is invalid
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatDateToLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
