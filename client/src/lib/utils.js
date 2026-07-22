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
