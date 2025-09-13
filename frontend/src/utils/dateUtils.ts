// dateUtils.ts
// Shared date formatting and parsing helpers for MM/DD/YYYY

/**
 * Format a JS Date object as MM/DD/YYYY for display.
 * Returns empty string if invalid date.
 */
export function formatDateMMDDYYYY(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Parse MM/DD/YYYY string to JS Date object.
 * Returns null if invalid.
 */
export function parseDateInput(str: string): Date | null {
  if (!str || !/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null;
  const [mm, dd, yyyy] = str.split('/').map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1000) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return d;
}
