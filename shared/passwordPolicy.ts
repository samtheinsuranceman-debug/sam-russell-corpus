// ============================================================
// PASSWORD POLICY — one rule for every password the platform accepts
// (registration, reset, and the owner hash script): at least 10 characters
// with letters and a number, and none of the passwords everyone guesses first.
// ============================================================
export const PASSWORD_MIN = 10;
export const PASSWORD_RULE = "Use at least 10 characters, including a letter and a number.";

const COMMON = new Set(["password", "password1", "passw0rd", "qwerty", "12345678", "123456789", "1234567890", "iloveyou", "letmein", "welcome1", "admin123", "abc12345", "changeme"]);

export function isStrongPassword(pw: string): boolean {
  if (typeof pw !== "string" || pw.length < PASSWORD_MIN || pw.length > 1024) return false;
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return false;
  const flat = pw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (COMMON.has(flat) || COMMON.has(flat.replace(/\d+$/, ""))) return false;
  if (/^(.)\1+$/.test(pw)) return false;
  return true;
}

/** Plain-language report for a form: which rules the candidate meets. */
export function passwordChecks(pw: string) {
  return { length: pw.length >= PASSWORD_MIN, letter: /[A-Za-z]/.test(pw), number: /[0-9]/.test(pw), upper: /[A-Z]/.test(pw), lower: /[a-z]/.test(pw), common: !COMMON.has(pw.toLowerCase().replace(/[^a-z0-9]/g, "")) && !COMMON.has(pw.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/\d+$/, "")) };
}
