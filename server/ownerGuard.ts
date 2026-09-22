/**
 * Owner guard — the one place that decides "is this the owner?"
 *
 * The vault, the AI Connector and the Brain Hub all key off this. It reads the
 * owner emails already declared in shared/accessControl.ts and, when the
 * hosting environment sets OWNER_EMAIL (Railway does), that address too — so a
 * deployment can name its owner without a code change.
 */
import { isOwnerBypassEmail } from "@shared/accessControl";

export function normalizeEmail(email: string): string {
  return (email ?? "").trim().toLowerCase();
}

export function isOwnerEmailAddress(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email ?? "");
  if (!normalized) return false;
  if (isOwnerBypassEmail(normalized)) return true;
  const fromEnv = normalizeEmail(process.env.OWNER_EMAIL ?? "");
  return Boolean(fromEnv) && fromEnv === normalized;
}
