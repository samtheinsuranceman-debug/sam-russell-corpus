// ============================================================
// OWNER VAULT ROUTER — the hidden owner panel behind the tabs.
//   ownerVault.status    admin   configured? unlocked? slot counts (no secrets)
//   ownerVault.unlock    admin   passphrase (33+ chars or 16+ words) → 15-minute session
//   ownerVault.lock      admin
//   ownerVault.slots     admin+unlocked   the 80 slots, secrets masked
//   ownerVault.setSlot   admin+unlocked   seal and store a key or an MCP URL
//   ownerVault.clearSlot admin+unlocked
//   ownerVault.setEnabled admin+unlocked
//   ownerVault.test      admin+unlocked   round-trip one api slot through its provider
//
// UNLOCK POLICY. If OWNER_PANEL_PASSPHRASE_HASH is set (scrypt, from
// scripts/owner_panel_passphrase_hash.mjs) the passphrase is checked against it.
// Otherwise the trunk's owner password (OWNER_PASSWORD_HASH, bcrypt) is accepted,
// plus the authenticator code when OWNER_TOTP_SECRET is set. Five attempts per
// 15 minutes per user, then a cool-off, using the trunk's own rate limiter.
// The unlock never returns a token to the browser: it is server-side state keyed
// by user id, so a stolen page cannot replay it.
//
// HIVE. On import this module registers the vault as a hive member source, so
// every key entered here becomes a brain for every page with no code change.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { checkRateLimit, clearRateLimit, ownerTotpEnabled, verifyOwnerCredentials } from "./_core/ownerLogin";
import { verifyTotp } from "./_core/totp";
import { passphraseMeetsPolicy, vaultKeyConfigured, verifyPassphrase } from "./ownerVaultCrypto";
import { clearSlot, listSlotsMasked, loadSlotsDecrypted, setSlotEnabled, upsertSlot } from "./ownerVaultDb";
import { registerHiveMemberSource } from "./hiveMind";
import { vaultMemberSource, VAULT_API_SLOTS, VAULT_MCP_SLOTS } from "./vaultMemberSource";
import { providerById } from "./ultraAI";

export const UNLOCK_TTL_MS = 15 * 60 * 1000;
const unlocked = new Map<number, number>(); // userId → expiresAt

export function isUnlocked(userId: number, now = Date.now()): boolean {
  const exp = unlocked.get(userId);
  if (!exp) return false;
  if (exp <= now) { unlocked.delete(userId); return false; }
  return true;
}
export function _resetOwnerVaultSessionsForTests(): void { unlocked.clear(); }

function requireUnlocked(userId: number): void {
  if (!isUnlocked(userId)) throw new TRPCError({ code: "FORBIDDEN", message: "Owner panel is locked; enter the passphrase" });
}

export function passphraseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.OWNER_PANEL_PASSPHRASE_HASH);
}

/** Exported for tests: the unlock decision without tRPC around it. */
export async function checkUnlock(input: { passphrase: string; totp?: string }, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  if (passphraseConfigured(env)) return verifyPassphrase(input.passphrase, env.OWNER_PANEL_PASSPHRASE_HASH);
  const ok = await verifyOwnerCredentials(ENV.ownerEmail, input.passphrase);
  if (!ok) return false;
  if (ownerTotpEnabled()) return Boolean(input.totp) && verifyTotp(ENV.ownerTotpSecret, input.totp!);
  return true;
}

// ── Hive registration: the vault is a member source from the moment the server boots. ──
registerHiveMemberSource(vaultMemberSource({
  load: loadSlotsDecrypted,
  resolveCaller: (id) => providerById(id)?.call,
}));

const kind = z.enum(["api", "mcp"]);

export const ownerVaultRouter = router({
  status: adminProcedure.query(async ({ ctx }) => {
    const slots = await listSlotsMasked();
    return {
      vaultKeyConfigured: vaultKeyConfigured(),
      passphraseConfigured: passphraseConfigured(),
      fallbackToOwnerPassword: !passphraseConfigured(),
      totpRequired: !passphraseConfigured() && ownerTotpEnabled(),
      unlocked: isUnlocked(ctx.user.id),
      capacity: { api: VAULT_API_SLOTS, mcp: VAULT_MCP_SLOTS },
      used: { api: slots.filter((s) => s.kind === "api").length, mcp: slots.filter((s) => s.kind === "mcp").length },
      enabled: { api: slots.filter((s) => s.kind === "api" && s.enabled).length, mcp: slots.filter((s) => s.kind === "mcp" && s.enabled).length },
    };
  }),

  unlock: adminProcedure.input(z.object({ passphrase: z.string().min(1).max(512), totp: z.string().max(10).optional() })).mutation(async ({ ctx, input }) => {
    const key = `owner-panel:${ctx.user.id}`;
    const wait = checkRateLimit(key);
    if (wait > 0) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Too many attempts; try again in ${Math.ceil(wait / 60000)} min` });
    if (passphraseConfigured() && !passphraseMeetsPolicy(input.passphrase)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Passphrase must be at least 33 characters or 16 words" });
    }
    const ok = await checkUnlock(input);
    if (!ok) throw new TRPCError({ code: "FORBIDDEN", message: "Passphrase not accepted" });
    clearRateLimit(key);
    unlocked.set(ctx.user.id, Date.now() + UNLOCK_TTL_MS);
    return { unlocked: true, expiresAt: new Date(Date.now() + UNLOCK_TTL_MS).toISOString() };
  }),

  lock: adminProcedure.mutation(async ({ ctx }) => { unlocked.delete(ctx.user.id); return { unlocked: false }; }),

  slots: adminProcedure.query(async ({ ctx }) => { requireUnlocked(ctx.user.id); return listSlotsMasked(); }),

  setSlot: adminProcedure.input(z.object({
    kind, slot: z.number().int().min(1).max(40),
    providerId: z.string().min(1).max(64), label: z.string().max(120).default(""),
    secret: z.string().min(1).max(4000), model: z.string().max(120).optional(), enabled: z.boolean().optional(),
    domains: z.array(z.string().min(1).max(40)).max(16).optional(),
  })).mutation(async ({ ctx, input }) => {
    requireUnlocked(ctx.user.id);
    if (input.kind === "api" && !providerById(input.providerId)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown provider id "${input.providerId}"; the roster only lists providers the trunk can call` });
    }
    if (input.kind === "mcp" && !/^https?:\/\//.test(input.secret.trim())) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "An MCP slot holds a server URL (http or https)" });
    }
    try { return await upsertSlot(input, ctx.user.id); }
    catch (e) { throw new TRPCError({ code: "PRECONDITION_FAILED", message: (e as Error).message }); }
  }),

  clearSlot: adminProcedure.input(z.object({ kind, slot: z.number().int().min(1).max(40) })).mutation(async ({ ctx, input }) => {
    requireUnlocked(ctx.user.id);
    return { cleared: await clearSlot(input.kind, input.slot) };
  }),

  setEnabled: adminProcedure.input(z.object({ kind, slot: z.number().int().min(1).max(40), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    requireUnlocked(ctx.user.id);
    await setSlotEnabled(input.kind, input.slot, input.enabled);
    return { ok: true };
  }),

  /** Round-trip one api slot through its provider with a one-word prompt; the answer text is not returned, only whether it came back. */
  test: adminProcedure.input(z.object({ slot: z.number().int().min(1).max(40) })).mutation(async ({ ctx, input }) => {
    requireUnlocked(ctx.user.id);
    const s = (await loadSlotsDecrypted()).find((x) => x.kind === "api" && x.slot === input.slot);
    if (!s) throw new TRPCError({ code: "NOT_FOUND", message: `api slot ${input.slot} is empty` });
    const p = providerById(s.providerId);
    if (!p) throw new TRPCError({ code: "BAD_REQUEST", message: `no caller for ${s.providerId}` });
    const started = Date.now();
    try {
      const text = await p.call(s.secret, "Reply with the single word OK.", "ping");
      return { ok: text.trim().length > 0, ms: Date.now() - started, providerId: s.providerId };
    } catch (e) {
      return { ok: false, ms: Date.now() - started, providerId: s.providerId, error: (e as Error).message.slice(0, 200) };
    }
  }),

  /** Provider ids the trunk can call, for the panel's dropdown. */
  providers: adminProcedure.query(() => ["claude", "chatgpt", "grok", "perplexity", "openrouter", "mistral", "groq", "cohere", "together", "gemini", "manus"].filter((id) => providerById(id)).map((id) => ({ id, label: providerById(id)!.label }))),
});
