/** Turns unknown thrown values into short, human-readable copy for the UI. */
export function toUserMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof Error && error.message) {
    // Avoid leaking SQL/native details into the interface.
    if (/sqlite|sql|database|no such/i.test(error.message)) {
      return 'We could not reach your saved expenses. Please try again.';
    }
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}
