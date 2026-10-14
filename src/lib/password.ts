export const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

/** Client-side mirror of the server's password rules (the server also checks a common-password list). */
export function validatePassword(password: string, email: string): string | null {
  const length = [...password].length;
  if (length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (/^(.)\1+$/u.test(password)) return "That password is too easy to guess.";
  const mail = email.trim().toLowerCase();
  const local = mail.split("@")[0] ?? "";
  const lower = password.toLowerCase();
  if (lower === mail || (local.length >= 6 && lower.includes(local))) return "Do not use your email in your password.";
  return null;
}
