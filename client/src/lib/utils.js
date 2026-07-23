/**
 * Tiny shared utilities. Anything here must be used by 2+ features —
 * single-use helpers belong next to their caller.
 */

/** Join class names, skipping falsy values: cn('a', cond && 'b') → 'a b'. */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Extract the server's human-readable message from a failed Axios call.
 * Our API always returns { success:false, message } — this reads it safely,
 * falling back for network-level failures where no response exists.
 */
export function apiMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message ?? fallback;
}

/** Display format: "23 Jul 2026". Em-dash for missing values. */
export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** ISO date → the "YYYY-MM-DD" format <input type="date"> requires. */
export function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

/** Whole days from now until a date; negative = already past. */
export function daysUntil(value) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

/** Format a number as SAR currency: 1234.5 → "SAR 1,234.50". */
export function formatMoney(value) {
  return `SAR ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
