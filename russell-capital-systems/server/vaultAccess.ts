/**
 * Vault Access — the second factor on the key store.
 *
 * Reaching the AI Connector needs two independent things:
 *
 *   1. A signed-in owner session (server/ownerGuard.ts decides who the owner is).
 *   2. The vault passphrase, which is separate and known only to Sam.
 *
 * Unlocking grants a SHORT-LIVED elevated session — not a permanent flag. An
 * open laptop should stop being an open vault after twenty minutes, and a
 * stolen session cookie should not be a stolen key store.
 *
 * ─── WHAT THE PASSPHRASE IS AND IS NOT ──────────────────────────────────────
 *
 * It is a second factor protecting an already-authenticated owner. It is not
 * the thing standing between the internet and the keys — the verified session
 * is. That matters because it means a long passphrase is genuinely sufficient
 * here: an attacker has to defeat email verification first, and only then
 * faces a rate-limited, locking passphrase check.
 *
 * The key is sixteen words (see shared/vaultKey.ts), or a passphrase of at
 * least 32 characters. Stored as a bcrypt hash; the key itself is never
 * written anywhere, including the audit log.
 */
import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { vaultAuditLog, vaultPassphrase } from "../drizzle/schema";
import { isOwnerEmailAddress, normalizeEmail } from "./ownerGuard";
import { randomBytes } from "crypto";
import {
  VAULT_KEY_WORD_COUNT,
  VAULT_PASSPHRASE_MIN_LENGTH,
  generateVaultKey,
  isSixteenWordKey,
  normalizeVaultKey,
} from "@shared/vaultKey";

/**
 * Two accepted shapes: the sixteen-word key the hub generates (preferred), or
 * a free-text passphrase of at least 32 characters. Both are normalised —
 * case, spacing and punctuation between words do not matter — before hashing.
 */
export const MIN_PASSPHRASE_LENGTH = VAULT_PASSPHRASE_MIN_LENGTH;
export const KEY_WORD_COUNT = VAULT_KEY_WORD_COUNT;

/** A fresh sixteen-word key. Shown once, never stored in plaintext. */
export function generateKey(): string {
  return generateVaultKey(n => new Uint8Array(randomBytes(n)));
}

/** The exact form that is hashed and compared. */
export function canonicalPassphrase(raw: string): string {
  return normalizeVaultKey(raw);
}

/** How long an unlock lasts before it has to be re-entered. */
export const UNLOCK_TTL_MS = 20 * 60 * 1000;

/** Wrong attempts before the vault locks. */
export const MAX_FAILED_ATTEMPTS = 5;

/** How long the lockout lasts. */
export const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * Live elevated sessions, keyed by the session's openId.
 *
 * Deliberately in memory rather than in the database: a process restart should
 * re-lock the vault. There is no situation where "the server rebooted but the
 * key store stayed open" is the behaviour anyone wanted.
 */
const unlocked = new Map<string, { expiresAt: number; email: string }>();

/** Drop expired grants. Cheap, and keeps the map from growing unbounded. */
function sweep() {
  const now = Date.now();
  // Collect first, then delete — mutating a Map mid-iteration is the kind of
  // thing that works until it does not. Array.from keeps this compatible with
  // the project's compile target.
  const expired = Array.from(unlocked.keys()).filter(key => (unlocked.get(key)?.expiresAt ?? 0) <= now);
  expired.forEach(key => unlocked.delete(key));
}

export type UnlockState = {
  /** Has a passphrase ever been set? */
  configured: boolean;
  unlocked: boolean;
  /** Milliseconds remaining on the current grant. */
  expiresInMs: number;
  lockedOut: boolean;
  lockedUntil: Date | null;
  attemptsRemaining: number;
};

export async function getUnlockState(openId: string): Promise<UnlockState> {
  sweep();
  const { getDb } = await import("./db");
  const db = await getDb();

  const rows = db ? await db.select().from(vaultPassphrase).limit(1) : [];
  const record = rows[0];
  const grant = unlocked.get(openId);
  const lockedUntil = record?.lockedUntil ?? null;
  const lockedOut = Boolean(lockedUntil && lockedUntil.getTime() > Date.now());

  return {
    configured: Boolean(record),
    unlocked: Boolean(grant && grant.expiresAt > Date.now()),
    expiresInMs: grant ? Math.max(0, grant.expiresAt - Date.now()) : 0,
    lockedOut,
    lockedUntil,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - (record?.failedAttempts ?? 0)),
  };
}

/** Is this session currently allowed to touch credentials? */
export function isUnlocked(openId: string): boolean {
  sweep();
  const grant = unlocked.get(openId);
  return Boolean(grant && grant.expiresAt > Date.now());
}

export class VaultAccessError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "VaultAccessError";
  }
}

/**
 * Set the passphrase for the first time, or change it.
 *
 * Changing it requires the current one, so an unattended unlocked session
 * cannot be used to lock the real owner out of his own vault.
 */
export async function setPassphrase(opts: {
  openId: string;
  email: string;
  newPassphrase: string;
  currentPassphrase?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: true }> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new VaultAccessError("DB_UNAVAILABLE", "The vault is temporarily unavailable.");

  if (!isOwnerEmailAddress(opts.email)) {
    throw new VaultAccessError("FORBIDDEN", "Only the owner can set the vault passphrase.");
  }

  const passphrase = canonicalPassphrase(opts.newPassphrase);
  const isWordKey = isSixteenWordKey(passphrase);
  if (!isWordKey && passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new VaultAccessError(
      "TOO_SHORT",
      `Use the ${KEY_WORD_COUNT}-word key the hub generated, or a passphrase of at least ${MIN_PASSPHRASE_LENGTH} characters. Yours is ${passphrase.length}.`,
    );
  }
  // Length is the defence here, but 32 repetitions of one character is 32
  // characters of nothing.
  if (!isWordKey && new Set(passphrase).size < 8) {
    throw new VaultAccessError(
      "TOO_SIMPLE",
      "That passphrase repeats too few distinct characters. Use a phrase rather than a pattern.",
    );
  }

  const existing = (await db.select().from(vaultPassphrase).limit(1))[0];

  if (existing) {
    if (!opts.currentPassphrase) {
      throw new VaultAccessError("CURRENT_REQUIRED", "Enter the current passphrase to change it.");
    }
    const valid = await bcrypt.compare(canonicalPassphrase(opts.currentPassphrase), existing.passhash);
    if (!valid) {
      await audit({ action: "unlock_failed", actorEmail: opts.email, detail: "wrong current passphrase during change", ipAddress: opts.ipAddress, userAgent: opts.userAgent });
      throw new VaultAccessError("WRONG_CURRENT", "The current passphrase is not correct.");
    }
    await db
      .update(vaultPassphrase)
      .set({ passhash: await bcrypt.hash(passphrase, 12), failedAttempts: 0, lockedUntil: null })
      .where(eq(vaultPassphrase.id, existing.id));
  } else {
    await db.insert(vaultPassphrase).values({
      passhash: await bcrypt.hash(passphrase, 12),
      ownerEmail: normalizeEmail(opts.email),
    });
  }

  // Changing the passphrase invalidates every open grant, including this one.
  unlocked.clear();

  await audit({
    action: "settings_changed",
    actorEmail: opts.email,
    detail: existing ? "vault passphrase changed" : "vault passphrase set",
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
  });

  return { success: true };
}

/** Unlock the vault for this session. */
export async function unlock(opts: {
  openId: string;
  email: string;
  passphrase: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: true; expiresInMs: number }> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new VaultAccessError("DB_UNAVAILABLE", "The vault is temporarily unavailable.");

  if (!isOwnerEmailAddress(opts.email)) {
    await audit({ action: "unlock_failed", actorEmail: opts.email, detail: "non-owner attempted unlock", ipAddress: opts.ipAddress, userAgent: opts.userAgent });
    throw new VaultAccessError("FORBIDDEN", "Only the owner can unlock the vault.");
  }

  const record = (await db.select().from(vaultPassphrase).limit(1))[0];
  if (!record) {
    throw new VaultAccessError("NOT_CONFIGURED", "No vault passphrase has been set yet.");
  }

  if (record.lockedUntil && record.lockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 60000);
    throw new VaultAccessError(
      "LOCKED_OUT",
      `The vault is locked after too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }

  const valid = await bcrypt.compare(canonicalPassphrase(opts.passphrase), record.passhash);

  if (!valid) {
    const failures = record.failedAttempts + 1;
    const shouldLock = failures >= MAX_FAILED_ATTEMPTS;
    await db
      .update(vaultPassphrase)
      .set({
        failedAttempts: shouldLock ? 0 : failures,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
      })
      .where(eq(vaultPassphrase.id, record.id));

    await audit({ action: "unlock_failed", actorEmail: opts.email, detail: `attempt ${failures}`, ipAddress: opts.ipAddress, userAgent: opts.userAgent });

    if (shouldLock) {
      throw new VaultAccessError(
        "LOCKED_OUT",
        `Too many failed attempts. The vault is locked for ${Math.round(LOCKOUT_MS / 60000)} minutes.`,
      );
    }
    const left = MAX_FAILED_ATTEMPTS - failures;
    throw new VaultAccessError("WRONG_PASSPHRASE", `Incorrect passphrase. ${left} attempt${left === 1 ? "" : "s"} remaining.`);
  }

  await db
    .update(vaultPassphrase)
    .set({ failedAttempts: 0, lockedUntil: null, lastUnlockedAt: new Date() })
    .where(eq(vaultPassphrase.id, record.id));

  unlocked.set(opts.openId, { expiresAt: Date.now() + UNLOCK_TTL_MS, email: normalizeEmail(opts.email) });

  await audit({ action: "unlock", actorEmail: opts.email, ipAddress: opts.ipAddress, userAgent: opts.userAgent });

  return { success: true, expiresInMs: UNLOCK_TTL_MS };
}

/** Re-lock immediately. */
export function lock(openId: string) {
  unlocked.delete(openId);
}

/** Guard for every credential-touching procedure. */
export function requireUnlocked(openId: string): void {
  if (!isUnlocked(openId)) {
    throw new VaultAccessError("LOCKED", "The vault is locked. Enter the passphrase to continue.");
  }
}

/** Append to the audit trail. Never records a secret value. */
export async function audit(entry: {
  action: string;
  providerId?: string;
  actorEmail?: string;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return;
    await db.insert(vaultAuditLog).values({
      action: entry.action,
      providerId: entry.providerId ?? null,
      actorEmail: entry.actorEmail ? normalizeEmail(entry.actorEmail) : null,
      detail: entry.detail?.slice(0, 500) ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (e) {
    console.error("[Vault] audit write failed:", e);
  }
}

export async function recentAudit(limit = 100) {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vaultAuditLog).orderBy(desc(vaultAuditLog.createdAt)).limit(limit);
}
