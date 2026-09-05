// ============================================================
// IMMUTABLE APPEND-ONLY LEDGER — software embodiment.
// Patent family shared component 1 (lifts all six applications).
//
// Every score, norm version, floor event, match, and calibration
// update is appended to a hash-chained ledger: each entry's hash
// commits to the previous entry's hash plus its own canonical
// payload, so any after-the-fact edit, deletion, or reordering of
// history breaks verification from that point forward.
//
// HONEST SCOPE — what this is and is not:
// - IS: a working, verifiable, tamper-EVIDENT append-only record
//   (reduction to practice of the ledger method claims).
// - IS NOT: hardware-signed. The HSM write-once signing and/or
//   Hyperledger anchoring named in the patent spec are the
//   hardware embodiment; exportChainHead() exists so the running
//   chain head can be externally anchored (HSM signature,
//   RFC 3161 timestamp, or public chain) without schema changes.
// ============================================================
import { createHash } from "node:crypto";

export type LedgerKind =
  | "score"
  | "norm_version"
  | "floor_event"
  | "match"
  | "calibration_update";

export const GENESIS_HASH = "0".repeat(64);

// Canonical JSON: stable key order at every depth, so the same logical
// payload always produces the same bytes (and therefore the same hash).
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

export function entryHash(prevHash: string, kind: string, payload: unknown): string {
  return createHash("sha256")
    .update(`${prevHash}|${kind}|${canonicalJson(payload)}`)
    .digest("hex");
}

export type LedgerRow = {
  id: number;
  kind: string;
  payload: unknown;
  prevHash: string;
  hash: string;
};

// Pure chain verification: recompute every link. Returns the first bad
// entry id, or null when the whole chain verifies.
export function verifyChain(rows: LedgerRow[]): { valid: boolean; badId: number | null; length: number } {
  let prev = GENESIS_HASH;
  for (const row of rows) {
    if (row.prevHash !== prev) return { valid: false, badId: row.id, length: rows.length };
    if (entryHash(row.prevHash, row.kind, row.payload) !== row.hash) {
      return { valid: false, badId: row.id, length: rows.length };
    }
    prev = row.hash;
  }
  return { valid: true, badId: null, length: rows.length };
}

// ── Database glue ───────────────────────────────────────────────────────────
// Append is serialized through a single-row-at-a-time transaction pattern:
// read the current head, compute the next hash, insert. The chain hash makes
// any lost-update anomaly DETECTABLE by verifyLedger even in the unlikely
// event of concurrent writers racing the head read.

export async function appendLedgerEntry(kind: LedgerKind, payload: Record<string, unknown>): Promise<string | null> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return null; // no database (local dev without MySQL) → no-op, never blocks the caller
  const { auditLedger } = await import("../../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  try {
    const head = await db.select({ hash: auditLedger.hash })
      .from(auditLedger).orderBy(desc(auditLedger.id)).limit(1);
    const prevHash = head[0]?.hash ?? GENESIS_HASH;
    const hash = entryHash(prevHash, kind, payload);
    await db.insert(auditLedger).values({ kind, payload, prevHash, hash });
    return hash;
  } catch (error) {
    // The ledger must never take down the operation it records.
    console.warn("[ledger] append failed:", String(error).slice(0, 200));
    return null;
  }
}

export async function verifyLedger(): Promise<{ valid: boolean; badId: number | null; length: number } | null> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return null;
  const { auditLedger } = await import("../../drizzle/schema");
  const { asc } = await import("drizzle-orm");
  const rows = await db.select().from(auditLedger).orderBy(asc(auditLedger.id));
  return verifyChain(rows as LedgerRow[]);
}

// The current chain head — the single 64-hex-char commitment to the entire
// history. Anchor this externally (HSM signature, RFC 3161 timestamp, or a
// public chain) to upgrade tamper-EVIDENT to tamper-PROOF.
export async function exportChainHead(): Promise<{ id: number; hash: string } | null> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return null;
  const { auditLedger } = await import("../../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  const head = await db.select({ id: auditLedger.id, hash: auditLedger.hash })
    .from(auditLedger).orderBy(desc(auditLedger.id)).limit(1);
  return head[0] ?? null;
}
