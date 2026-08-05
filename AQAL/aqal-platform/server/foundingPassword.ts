// ============================================================
// Founding-access passwords — member-chosen, any string accepted
// ============================================================
// The founding claim takes email + ANY password. The first claim locks that
// password in (scrypt, per-user salt); returning sign-ins must match. This is
// the minimum credential that keeps "type any email" from opening someone
// else's account while still requiring no invite code.

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;

export function hashFoundingPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyFoundingPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const candidate = scryptSync(password, salt, KEYLEN);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}
