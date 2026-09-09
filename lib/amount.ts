/**
 * Amount buffer helpers for the custom numpad.
 *
 * The raw buffer is what the user typed (e.g. `"1250."`, `"99.5"`), so display
 * can keep a trailing dot while the numeric value stays clean.
 */

export const MAX_INTEGER_DIGITS = 8;
export const MAX_FRACTION_DIGITS = 2;

/** Applies one keypad press to the raw amount buffer. */
export function applyAmountKey(raw: string, key: string): string {
  if (key === 'backspace') return raw.slice(0, -1);

  if (key === '.') {
    if (raw.includes('.')) return raw;
    return raw === '' ? '0.' : `${raw}.`;
  }

  if (!/^\d$/.test(key)) return raw;

  if (raw.includes('.')) {
    const fraction = raw.split('.')[1] ?? '';
    if (fraction.length >= MAX_FRACTION_DIGITS) return raw;
    return `${raw}${key}`;
  }

  if (raw === '' || raw === '0') return key === '0' ? '0' : key;
  if (raw.length >= MAX_INTEGER_DIGITS) return raw;
  return `${raw}${key}`;
}

/** Turns a stored amount back into an editable buffer. */
export function amountToRaw(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  return hasFraction ? amount.toFixed(2) : `${Math.trunc(amount)}`;
}
