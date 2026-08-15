/** Fewest characters a new account's password may have. */
export const MIN_PASSWORD_LENGTH = 8;

/** Requirement text shown next to the password field while registering. */
export const PASSWORD_REQUIREMENTS_HINT =
  "At least 8 characters, with uppercase and lowercase letters, a number, and a special character.";

/**
 * Checks a new account's password against the app's minimum complexity
 * rules: length plus a balanced mix of character classes, matching common
 * international password policy baselines.
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasLower && hasUpper && hasDigit && hasSpecial;
}
