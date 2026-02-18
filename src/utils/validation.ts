// ---------------------------------------------------------------------------
// Validation utility helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a string is a valid email address.
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  // Standard RFC-5322-ish pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Check whether a string is a valid Philippine mobile number.
 * Accepted formats:
 *  - +639XXXXXXXXX  (13 chars)
 *  - 639XXXXXXXXX   (12 digits)
 *  - 09XXXXXXXXX    (11 digits)
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');

  // +639XXXXXXXXX => digits = 639XXXXXXXXX (12 digits)
  if (digits.length === 12 && digits.startsWith('639')) return true;

  // 09XXXXXXXXX => 11 digits starting with 09
  if (digits.length === 11 && digits.startsWith('09')) return true;

  return false;
}

/**
 * Check if a string is non-empty after trimming.
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return (value ?? '').trim().length > 0;
}

/**
 * Check minimum length.
 */
export function hasMinLength(value: string | null | undefined, min: number): boolean {
  return (value ?? '').length >= min;
}

/**
 * Check maximum length.
 */
export function hasMaxLength(value: string | null | undefined, max: number): boolean {
  return (value ?? '').length <= max;
}

/**
 * Check if a password meets minimum complexity requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one digit
 */
export function isStrongPassword(password: string | null | undefined): boolean {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasUpper && hasLower && hasDigit;
}

/**
 * Return a validation error message for a password, or null if it passes.
 */
export function getPasswordError(password: string | null | undefined): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  return null;
}

/**
 * Check if two values match (e.g. password confirmation).
 */
export function doValuesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? '') === (b ?? '');
}
