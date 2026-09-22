// ============================================================
// OWNER VAULT DB — the 80 slots, sealed at rest, buffered in memory when
// there is no database (so the panel and the hive work on a fresh container).
// ============================================================
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { ownerVaultSlots, type OwnerVaultSlotRow } from "../drizzle/schema";
import { maskSecret, openSecret, sealSecret, vaultKeyConfigured } from "./ownerVaultCrypto";
import { VAULT_API_SLOTS, VAULT_MCP_SLOTS, type VaultSlot } from "./vaultMemberSource";

export type VaultKind = "api" | "mcp";

/** What the panel sees: never the secret. */
export interface MaskedSlot {
  kind: VaultKind;
  slot: number;
  providerId: string;
  label: string;
  masked: string;
  model?: string;
  domains: string[];
  enabled: boolean;
  updatedAt: string;
}

const memory = new Map<string, OwnerVaultSlotRow>();
const k = (kind: VaultKind, slot: number) => `${kind}:${slot}`;

export function slotCap(kind: VaultKind): number { return kind === "api" ? VAULT_API_SLOTS : VAULT_MCP_SLOTS; }

export function assertSlot(kind: VaultKind, slot: number): void {
  if (!Number.isInteger(slot) || slot < 1 || slot > slotCap(kind)) throw new Error(`${kind} slot must be 1..${slotCap(kind)}`);
}

async function allRows(): Promise<OwnerVaultSlotRow[]> {
  const db = await getDb();
  if (!db) return Array.from(memory.values());
  return db.select().from(ownerVaultSlots);
}

export async function listSlotsMasked(): Promise<MaskedSlot[]> {
  const rows = await allRows();
  return rows
    .map((r) => {
      let masked = "(sealed under a different key)";
      try { masked = maskSecret(openSecret(r.sealed)); } catch { /* keep the honest label */ }
      return { kind: r.kind, slot: r.slot, providerId: r.providerId, label: r.label, masked, model: r.model ?? undefined, domains: r.domains ?? [], enabled: r.enabled, updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt) };
    })
    .sort((a, b) => (a.kind === b.kind ? a.slot - b.slot : a.kind < b.kind ? -1 : 1));
}

/** Server-side only: the decrypted slots for the hive source. Rows sealed under another key are skipped, not guessed. */
export async function loadSlotsDecrypted(): Promise<VaultSlot[]> {
  if (!vaultKeyConfigured()) return [];
  const out: VaultSlot[] = [];
  for (const r of await allRows()) {
    try { out.push({ kind: r.kind, slot: r.slot, providerId: r.providerId, label: r.label, secret: openSecret(r.sealed), model: r.model ?? undefined, enabled: r.enabled, domains: r.domains ?? undefined }); } catch { /* skip */ }
  }
  return out;
}

export async function upsertSlot(input: { kind: VaultKind; slot: number; providerId: string; label: string; secret: string; model?: string; enabled?: boolean; domains?: string[] }, updatedBy: number): Promise<MaskedSlot> {
  assertSlot(input.kind, input.slot);
  if (!vaultKeyConfigured()) throw new Error("OWNER_VAULT_KEY is not configured; nothing can be stored");
  if (!input.secret.trim()) throw new Error("secret is empty");
  const sealed = sealSecret(input.secret.trim());
  const domains = Array.from(new Set((input.domains ?? []).map((d) => d.trim()).filter(Boolean)));
  const row = { kind: input.kind, slot: input.slot, providerId: input.providerId.trim(), label: input.label.trim() || input.providerId.trim(), sealed, model: input.model?.trim() || null, domains, enabled: input.enabled ?? true, updatedBy };
  const db = await getDb();
  if (!db) {
    const prev = memory.get(k(input.kind, input.slot));
    memory.set(k(input.kind, input.slot), { id: prev?.id ?? memory.size + 1, ...row, updatedAt: new Date() });
  } else {
    const [existing] = await db.select().from(ownerVaultSlots).where(and(eq(ownerVaultSlots.kind, input.kind), eq(ownerVaultSlots.slot, input.slot))).limit(1);
    if (existing) await db.update(ownerVaultSlots).set(row).where(eq(ownerVaultSlots.id, existing.id));
    else await db.insert(ownerVaultSlots).values(row);
  }
  return { kind: input.kind, slot: input.slot, providerId: row.providerId, label: row.label, masked: maskSecret(input.secret.trim()), model: row.model ?? undefined, domains, enabled: row.enabled, updatedAt: new Date().toISOString() };
}

export async function clearSlot(kind: VaultKind, slot: number): Promise<boolean> {
  assertSlot(kind, slot);
  const db = await getDb();
  if (!db) return memory.delete(k(kind, slot));
  await db.delete(ownerVaultSlots).where(and(eq(ownerVaultSlots.kind, kind), eq(ownerVaultSlots.slot, slot)));
  return true;
}

export async function setSlotEnabled(kind: VaultKind, slot: number, enabled: boolean): Promise<void> {
  assertSlot(kind, slot);
  const db = await getDb();
  if (!db) { const r = memory.get(k(kind, slot)); if (r) memory.set(k(kind, slot), { ...r, enabled }); return; }
  await db.update(ownerVaultSlots).set({ enabled }).where(and(eq(ownerVaultSlots.kind, kind), eq(ownerVaultSlots.slot, slot)));
}

export function _resetOwnerVaultForTests(): void { memory.clear(); }
