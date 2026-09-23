/**
 * vaultRouter — the AI Connector's API.
 *
 * Every procedure here requires an owner-tier verified session. The ones that
 * touch credentials additionally require the vault to be unlocked.
 *
 * A plaintext key enters through `setKey` and never comes back out. There is
 * deliberately no `getKey`: if the owner needs to know what a key is, they
 * look it up in the provider's own console. A read endpoint is a read
 * endpoint, and the first thing anyone who gets a session does is call it.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { providerCredentials } from "../drizzle/schema";
import {
  BRAIN_PROVIDERS,
  CHINA_POLICY_MESSAGE,
  CUSTOM_PREFIX,
  MAX_BRAINS,
  MAX_MCP_SERVERS,
  PROVIDERS,
  buildCustomProvider,
  isBannedModel,
  isBannedProvider,
  looksLikeValidKey,
  validateCustomEndpoint,
} from "@shared/aiProviders";
import { MCP_PRESETS, getMcpPreset } from "@shared/mcpPresets";
import { formatVaultKeyForDisplay } from "@shared/vaultKey";
import {
  encryptSecret,
  isVaultConfigured,
  maskSecret,
  selfTest,
  vaultUnavailableReason,
} from "./_core/secretVault";
import { testProviderKey } from "./aiProviderAdapters";
import { environmentKeyNames, environmentProviderIds, invalidateProviderCache, providerStatus, resolveProvider } from "./providerRegistry";
import {
  KEY_WORD_COUNT,
  MIN_PASSPHRASE_LENGTH,
  UNLOCK_TTL_MS,
  VaultAccessError,
  audit,
  generateKey,
  getUnlockState,
  lock,
  recentAudit,
  requireUnlocked,
  setPassphrase,
  unlock,
} from "./vaultAccess";
import { isOwnerEmailAddress } from "./ownerGuard";
import { customProviders, mcpServers } from "../drizzle/schema";
import { handshake, slugify, validateMcpUrl, McpError } from "./mcpClient";
import { mcpStatus, refreshTools } from "./mcpRegistry";

function clientIp(req: any): string {
  const fwd = (req?.headers?.["x-forwarded-for"] as string) || "";
  return (fwd.split(",")[0]?.trim() || req?.socket?.remoteAddress || "").replace(/^::ffff:/, "");
}
function userAgent(req: any): string {
  return (req?.headers?.["user-agent"] as string) || "";
}

function toTrpc(e: unknown): never {
  if (e instanceof VaultAccessError) {
    const code =
      e.code === "FORBIDDEN" ? "FORBIDDEN"
      : e.code === "LOCKED" || e.code === "LOCKED_OUT" ? "FORBIDDEN"
      : e.code === "DB_UNAVAILABLE" ? "INTERNAL_SERVER_ERROR"
      : "BAD_REQUEST";
    throw new TRPCError({ code: code as any, message: e.message, cause: e.code });
  }
  console.error("[vaultRouter]", e);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong." });
}

/** Forty brains: a replacement of an existing key never needs a new slot. */
async function assertBrainSlotAvailable(providerId: string) {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(providerCredentials);
  if (rows.some(r => r.providerId === providerId)) return;
  if (rows.length >= MAX_BRAINS) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `All ${MAX_BRAINS} brain slots are in use. Remove one before adding another.` });
  }
}

/** Forty MCP servers, same rule. */
async function assertMcpSlotAvailable(slug: string) {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(mcpServers);
  if (rows.some(r => r.slug === slug)) return;
  if (rows.length >= MAX_MCP_SERVERS) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `All ${MAX_MCP_SERVERS} MCP slots are in use. Remove one before adding another.` });
  }
}

/**
 * The Railway pathway for MCP servers. Numbered slots, forty of them:
 *
 *     RCS_MCP_1_URL     https://mcp.example.com/mcp
 *     RCS_MCP_1_LABEL   Example            (optional; a preset slug also works)
 *     RCS_MCP_1_TOKEN   bearer token       (optional)
 *     RCS_MCP_1_HEADERS {"X-Api-Key":"…"} (optional JSON)
 *
 * Or name a preset directly: RCS_MCP_GITHUB_TOKEN keys the GitHub preset at
 * its published URL. Read on demand, never at boot — a bad URL in the
 * environment must not stop the app from starting.
 */
export function environmentMcpSlots(): Array<{ slug: string; label: string; url: string; token: string | null; headers: string | null; source: string }> {
  const slots: Array<{ slug: string; label: string; url: string; token: string | null; headers: string | null; source: string }> = [];
  for (let i = 1; i <= MAX_MCP_SERVERS; i++) {
    const url = process.env[`RCS_MCP_${i}_URL`]?.trim();
    if (!url) continue;
    const label = process.env[`RCS_MCP_${i}_LABEL`]?.trim() || `MCP slot ${i}`;
    const preset = getMcpPreset(slugify(label));
    slots.push({
      slug: preset?.slug ?? slugify(label),
      label: preset?.label ?? label,
      url,
      token: process.env[`RCS_MCP_${i}_TOKEN`]?.trim() || null,
      headers: process.env[`RCS_MCP_${i}_HEADERS`]?.trim() || null,
      source: `RCS_MCP_${i}_URL`,
    });
  }
  for (const preset of MCP_PRESETS) {
    const envSlug = preset.slug.toUpperCase().replace(/-/g, "_");
    const token = process.env[`RCS_MCP_${envSlug}_TOKEN`]?.trim();
    const url = process.env[`RCS_MCP_${envSlug}_URL`]?.trim() || preset.url;
    if (!token && !process.env[`RCS_MCP_${envSlug}_URL`]) continue;
    if (!url) continue;
    if (slots.some(s => s.slug === preset.slug)) continue;
    slots.push({ slug: preset.slug, label: preset.label, url, token: token || null, headers: null, source: `RCS_MCP_${envSlug}_*` });
  }
  return slots.slice(0, MAX_MCP_SERVERS);
}

/** Owner-tier verified session. The outer door. */
const ownerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const email = ctx.user?.email ?? "";
  if (!isOwnerEmailAddress(email)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner access required." });
  }
  return next();
});

/** Owner session AND an unlocked vault. The inner door. */
const vaultProcedure = ownerProcedure.use(async ({ ctx, next }) => {
  try {
    requireUnlocked(ctx.user.openId);
  } catch (e) {
    toTrpc(e);
  }
  return next();
});

export const vaultRouter = router({
  /**
   * Is the signed-in user the owner? The only thing a non-owner can learn
   * from this router. Drives whether the hidden hub control renders at all.
   */
  whoami: protectedProcedure.query(({ ctx }) => ({
    owner: isOwnerEmailAddress(ctx.user.email ?? ""),
  })),

  /**
   * Everything the Brain Hub needs to render: vault health, lock state,
   * and per-provider status. Never includes a key.
   */
  overview: ownerProcedure.query(async ({ ctx }) => {
    const unlockState = await getUnlockState(ctx.user.openId);
    const vaultReady = isVaultConfigured();

    return {
      vault: {
        ready: vaultReady,
        reason: vaultUnavailableReason(),
        selfTest: vaultReady ? selfTest() : { ok: false, error: vaultUnavailableReason() ?? undefined },
      },
      access: {
        ...unlockState,
        minPassphraseLength: MIN_PASSPHRASE_LENGTH,
        keyWordCount: KEY_WORD_COUNT,
        unlockTtlMs: UNLOCK_TTL_MS,
      },
      /** Slot accounting: forty brains, forty MCP servers. */
      limits: await (async () => {
        const { getDb } = await import("./db");
        const db = await getDb();
        const keyed = db ? (await db.select().from(providerCredentials)).length : 0;
        const mcp = db ? (await db.select().from(mcpServers)).length : 0;
        return {
          maxBrains: MAX_BRAINS,
          brainsKeyed: keyed,
          brainsFromEnvironment: environmentProviderIds().length,
          maxMcp: MAX_MCP_SERVERS,
          mcpConfigured: mcp,
        };
      })(),
      /** Every environment variable name the Railway pathway honours, per brain. */
      environmentNames: Object.fromEntries(BRAIN_PROVIDERS.map(p => [p.id, environmentKeyNames(p.id)])),
      mcpPresets: MCP_PRESETS,
      providers: await providerStatus(),
      // Providers already live from a hosting environment variable. These work
      // without the vault being unlocked at all, so the page must say so —
      // otherwise the connector reads "nothing configured" while three models
      // are answering.
      fromEnvironment: environmentProviderIds(),
      mcp: await mcpStatus(),
      custom: await (async () => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];
        return (await db.select().from(customProviders)).map(c => ({
          slug: c.slug,
          name: c.name,
          baseUrl: c.baseUrl,
          chatPath: c.chatPath,
          wireFormat: c.wireFormat,
          defaultModel: c.defaultModel,
          note: c.note,
        }));
      })(),
      // Definitions the UI needs: endpoints, model lists, where to get a key.
      catalog: PROVIDERS.map(p => ({
        id: p.id,
        name: p.name,
        country: p.country,
        defaultModel: p.defaultModel,
        suggestedModels: p.suggestedModels,
        keyHint: p.keyHint,
        consoleUrl: p.consoleUrl,
        role: p.role,
        caution: p.caution ?? null,
        requiresBaseUrl: Boolean(p.requiresBaseUrl),
      })),
    };
  }),

  // ─── Access ──────────────────────────────────────────────────────────────

  /**
   * Mint a fresh sixteen-word key. It is returned once and stored nowhere;
   * the owner then sets it with setPassphrase (or the hub does both in one
   * step through initializeKey). Owner session required; the vault need not
   * be unlocked — this is how the first key is made.
   */
  generateKey: ownerProcedure.mutation(() => {
    const key = generateKey();
    return { key, rows: formatVaultKeyForDisplay(key), wordCount: KEY_WORD_COUNT };
  }),

  /**
   * First-time setup in one step: generate the key, store its hash, return
   * the words once. Refuses if a key already exists — changing it goes
   * through setPassphrase with the current key.
   */
  initializeKey: ownerProcedure.mutation(async ({ ctx }) => {
    const state = await getUnlockState(ctx.user.openId);
    if (state.configured) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A vault key already exists. Change it with the current key, not by minting a new one." });
    }
    const key = generateKey();
    try {
      await setPassphrase({
        openId: ctx.user.openId,
        email: ctx.user.email ?? "",
        newPassphrase: key,
        ipAddress: clientIp(ctx.req),
        userAgent: userAgent(ctx.req),
      });
    } catch (e) {
      toTrpc(e);
    }
    return { key, rows: formatVaultKeyForDisplay(key), wordCount: KEY_WORD_COUNT };
  }),

  setPassphrase: ownerProcedure
    .input(
      z.object({
        newPassphrase: z.string().min(16).max(400),
        currentPassphrase: z.string().max(400).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await setPassphrase({
          openId: ctx.user.openId,
          email: ctx.user.email ?? "",
          newPassphrase: input.newPassphrase,
          currentPassphrase: input.currentPassphrase,
          ipAddress: clientIp(ctx.req),
          userAgent: userAgent(ctx.req),
        });
      } catch (e) {
        toTrpc(e);
      }
    }),

  unlock: ownerProcedure
    .input(z.object({ passphrase: z.string().min(1).max(400) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await unlock({
          openId: ctx.user.openId,
          email: ctx.user.email ?? "",
          passphrase: input.passphrase,
          ipAddress: clientIp(ctx.req),
          userAgent: userAgent(ctx.req),
        });
      } catch (e) {
        toTrpc(e);
      }
    }),

  lock: ownerProcedure.mutation(({ ctx }) => {
    lock(ctx.user.openId);
    return { success: true as const };
  }),

  // ─── Credentials ─────────────────────────────────────────────────────────

  /**
   * Store or replace a provider key.
   *
   * The key is encrypted before it touches the database and is not returned.
   * An optional live test runs before saving, so a bad key can be rejected at
   * the point of entry rather than discovered later by a client.
   */
  setKey: vaultProcedure
    .input(
      z.object({
        providerId: z.string().min(1).max(64),
        apiKey: z.string().min(8).max(500),
        model: z.string().max(200).optional(),
        baseUrl: z.string().max(500).optional(),
        priority: z.number().int().min(1).max(999).optional(),
        /** Test before saving. On by default — saving an untested key is how a demo breaks. */
        testFirst: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const provider = resolveProvider(input.providerId);
      if (!provider) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown provider." });
      if (isBannedModel(input.model) || isBannedProvider(input.baseUrl)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${CHINA_POLICY_MESSAGE}. That model or endpoint cannot be saved.` });
      }
      if (provider.requiresBaseUrl && !input.baseUrl?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${provider.name} needs a Base URL for your own account before it can be called. ${provider.caution ?? ""}`.trim() });
      }
      await assertBrainSlotAvailable(input.providerId);

      const apiKey = input.apiKey.trim();
      const shape = looksLikeValidKey(input.providerId, apiKey);
      if (!shape.ok) throw new TRPCError({ code: "BAD_REQUEST", message: shape.warning ?? "That does not look like an API key." });

      const model = input.model?.trim() || provider.defaultModel;
      const baseUrl = input.baseUrl?.trim() || null;

      let testResult: Awaited<ReturnType<typeof testProviderKey>> | null = null;
      if (input.testFirst) {
        testResult = await testProviderKey({ providerId: input.providerId, apiKey, model, baseUrlOverride: baseUrl });
        if (!testResult.ok) {
          await audit({
            action: "key_tested",
            providerId: input.providerId,
            actorEmail: ctx.user.email ?? undefined,
            detail: `rejected at entry: ${testResult.kind}`,
            ipAddress: clientIp(ctx.req),
            userAgent: userAgent(ctx.req),
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${testResult.message} The key was not saved. Uncheck "test before saving" to store it anyway.`,
          });
        }
      }

      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      let encrypted: string;
      try {
        encrypted = encryptSecret(apiKey, input.providerId);
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: e instanceof Error ? e.message : "Could not encrypt the key.",
        });
      }

      const existing = (await db.select().from(providerCredentials).where(eq(providerCredentials.providerId, input.providerId)).limit(1))[0];

      const values = {
        providerId: input.providerId,
        encryptedKey: encrypted,
        maskedKey: maskSecret(apiKey),
        modelOverride: model,
        baseUrlOverride: baseUrl,
        enabled: true,
        priority: input.priority ?? existing?.priority ?? 100,
        lastTestedAt: testResult ? new Date() : null,
        lastTestOk: testResult ? testResult.ok : null,
        lastTestDetail: testResult?.ok
          ? `Answered in ${testResult.latencyMs}ms as ${testResult.model}`
          : null,
        updatedByEmail: ctx.user.email ?? null,
      };

      if (existing) {
        await db.update(providerCredentials).set(values).where(eq(providerCredentials.id, existing.id));
      } else {
        await db.insert(providerCredentials).values(values);
      }

      invalidateProviderCache();

      await audit({
        action: existing ? "key_rotated" : "key_set",
        providerId: input.providerId,
        actorEmail: ctx.user.email ?? undefined,
        detail: `model ${model}${testResult?.ok ? `, verified in ${testResult.latencyMs}ms` : ", not tested"}`,
        ipAddress: clientIp(ctx.req),
        userAgent: userAgent(ctx.req),
      });

      return {
        success: true as const,
        maskedKey: values.maskedKey,
        tested: Boolean(testResult?.ok),
        latencyMs: testResult?.ok ? testResult.latencyMs : null,
        warning: shape.warning ?? null,
      };
    }),

  /** Run a live call against a stored key. */
  testKey: vaultProcedure
    .input(z.object({ providerId: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const provider = resolveProvider(input.providerId);
      if (!provider) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown provider." });

      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const row = (await db.select().from(providerCredentials).where(eq(providerCredentials.providerId, input.providerId)).limit(1))[0];
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No key stored for that provider." });

      const { decryptSecret } = await import("./_core/secretVault");
      let apiKey: string;
      try {
        apiKey = decryptSecret(row.encryptedKey, row.providerId);
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: e instanceof Error ? e.message : "Could not decrypt the stored key.",
        });
      }

      const result = await testProviderKey({
        providerId: input.providerId,
        apiKey,
        model: row.modelOverride || provider.defaultModel,
        baseUrlOverride: row.baseUrlOverride,
      });

      await db
        .update(providerCredentials)
        .set({
          lastTestedAt: new Date(),
          lastTestOk: result.ok,
          lastTestDetail: result.ok ? `Answered in ${result.latencyMs}ms as ${result.model}` : result.message.slice(0, 500),
        })
        .where(eq(providerCredentials.id, row.id));

      await audit({
        action: "key_tested",
        providerId: input.providerId,
        actorEmail: ctx.user.email ?? undefined,
        detail: result.ok ? `ok in ${result.latencyMs}ms` : `failed: ${result.kind}`,
        ipAddress: clientIp(ctx.req),
      });

      return result;
    }),

  /** Enable, disable, reprioritise, or change the model for a stored provider. */
  updateProvider: vaultProcedure
    .input(
      z.object({
        providerId: z.string().min(1).max(64),
        enabled: z.boolean().optional(),
        model: z.string().max(200).optional(),
        priority: z.number().int().min(1).max(999).optional(),
        baseUrl: z.string().max(500).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const row = (await db.select().from(providerCredentials).where(eq(providerCredentials.providerId, input.providerId)).limit(1))[0];
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No key stored for that provider." });
      if (isBannedModel(input.model) || isBannedProvider(input.baseUrl)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${CHINA_POLICY_MESSAGE}. That model or endpoint cannot be saved.` });
      }

      const patch: Record<string, unknown> = { updatedByEmail: ctx.user.email ?? null };
      if (input.enabled !== undefined) patch.enabled = input.enabled;
      if (input.model !== undefined) patch.modelOverride = input.model.trim() || null;
      if (input.priority !== undefined) patch.priority = input.priority;
      if (input.baseUrl !== undefined) patch.baseUrlOverride = input.baseUrl?.trim() || null;

      await db.update(providerCredentials).set(patch).where(eq(providerCredentials.id, row.id));
      invalidateProviderCache();

      await audit({
        action: "settings_changed",
        providerId: input.providerId,
        actorEmail: ctx.user.email ?? undefined,
        detail: Object.keys(patch).filter(k => k !== "updatedByEmail").join(", "),
        ipAddress: clientIp(ctx.req),
      });

      return { success: true as const };
    }),

  /** Remove a key entirely. */
  deleteKey: vaultProcedure
    .input(z.object({ providerId: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      await db.delete(providerCredentials).where(eq(providerCredentials.providerId, input.providerId));
      invalidateProviderCache();

      await audit({
        action: "key_deleted",
        providerId: input.providerId,
        actorEmail: ctx.user.email ?? undefined,
        ipAddress: clientIp(ctx.req),
      });

      return { success: true as const };
    }),

  /**
   * Test every key the hosting environment (Railway) holds, one real call
   * each. Owner door only: these keys never enter the vault, so the vault
   * does not need to be set up or unlocked to learn whether they are alive.
   * Returns variable names and outcomes; never a key.
   */
  testEnvironment: ownerProcedure.mutation(async ({ ctx }) => {
    const { testEnvironmentKeys } = await import("./providerRegistry");
    const results = await testEnvironmentKeys();
    await audit({
      action: "key_tested",
      actorEmail: ctx.user.email ?? undefined,
      detail: `tested environment keys: ${results.filter(r => r.ok).length}/${results.length} ok`,
      ipAddress: clientIp(ctx.req),
    });
    return results;
  }),

  /** Test every stored key at once. */
  testAll: vaultProcedure.mutation(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

    const rows = await db.select().from(providerCredentials);
    const { decryptSecret } = await import("./_core/secretVault");

    const results = await Promise.all(
      rows.map(async row => {
        const provider = resolveProvider(row.providerId);
        if (!provider) return { providerId: row.providerId, ok: false, message: "Unknown provider." };
        try {
          const apiKey = decryptSecret(row.encryptedKey, row.providerId);
          const result = await testProviderKey({
            providerId: row.providerId,
            apiKey,
            model: row.modelOverride || provider.defaultModel,
            baseUrlOverride: row.baseUrlOverride,
          });
          await db
            .update(providerCredentials)
            .set({
              lastTestedAt: new Date(),
              lastTestOk: result.ok,
              lastTestDetail: result.ok ? `Answered in ${result.latencyMs}ms as ${result.model}` : result.message.slice(0, 500),
            })
            .where(eq(providerCredentials.id, row.id));
          return result.ok
            ? { providerId: row.providerId, ok: true as const, message: `Answered in ${result.latencyMs}ms`, latencyMs: result.latencyMs }
            : { providerId: row.providerId, ok: false as const, message: result.message };
        } catch (e) {
          return {
            providerId: row.providerId,
            ok: false as const,
            message: e instanceof Error ? e.message : "Test failed.",
          };
        }
      }),
    );

    await audit({
      action: "key_tested",
      actorEmail: ctx.user.email ?? undefined,
      detail: `tested all: ${results.filter(r => r.ok).length}/${results.length} ok`,
      ipAddress: clientIp(ctx.req),
    });

    return results;
  }),

  // ─── Custom API endpoints ────────────────────────────────────────────────

  /**
   * Add any AI platform that has an HTTP API but is not in the catalogue.
   *
   * The built-in list covers the platforms worth pre-configuring, but it will
   * always be behind — new services launch constantly, and some are internal
   * or regional and will never be on anyone's list. Most expose an
   * OpenAI-compatible endpoint, so a base URL, a key and a model name reach
   * them through the adapters already written.
   */
  addCustomProvider: vaultProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        baseUrl: z.string().min(1).max(500),
        chatPath: z.string().min(1).max(200).default("/v1/chat/completions"),
        wireFormat: z.enum(["openai-compatible", "anthropic", "google-generative"]).default("openai-compatible"),
        model: z.string().min(1).max(200),
        apiKey: z.string().min(1).max(500),
        note: z.string().max(500).optional(),
        priority: z.number().int().min(1).max(999).default(200),
        testFirst: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const endpointCheck = validateCustomEndpoint(input.baseUrl.trim(), input.chatPath.trim());
      if (!endpointCheck.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: endpointCheck.reason ?? "Invalid endpoint." });
      }
      if (isBannedProvider(input.name) || isBannedModel(input.model)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${CHINA_POLICY_MESSAGE}. That provider or model cannot be added.` });
      }

      const slug = `${CUSTOM_PREFIX}${slugify(input.name)}`;
      await assertBrainSlotAvailable(slug);
      const definition = buildCustomProvider({
        slug,
        name: input.name.trim(),
        baseUrl: input.baseUrl.trim(),
        chatPath: input.chatPath.trim(),
        wireFormat: input.wireFormat,
        defaultModel: input.model.trim(),
        note: input.note,
      });

      // Prove it works before storing it. A custom endpoint is exactly where a
      // typo in the path or the wrong wire format hides, and discovering that
      // mid-conversation is the wrong time.
      let testResult: Awaited<ReturnType<typeof testProviderKey>> | null = null;
      if (input.testFirst) {
        const { callProvider } = await import("./aiProviderAdapters");
        try {
          const started = Date.now();
          const probe = await callProvider({
            provider: definition,
            apiKey: input.apiKey.trim(),
            model: input.model.trim(),
            messages: [{ role: "user", content: "Reply with the single word: connected" }],
            maxTokens: 16,
            temperature: 0,
            timeoutMs: 30_000,
          });
          testResult = { ok: true, model: probe.model, latencyMs: Date.now() - started, reply: probe.text.slice(0, 80) };
        } catch (e) {
          const { ProviderError } = await import("./aiProviderAdapters");
          const message = e instanceof ProviderError ? e.userMessage : e instanceof Error ? e.message : "Test failed.";
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${message} Nothing was saved. Check the base URL, the completion path, the model name, and whether this service speaks the wire format you chose.`,
          });
        }
      }

      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const existingDefinition = (await db.select().from(customProviders).where(eq(customProviders.slug, slug)).limit(1))[0];
      const defValues = {
        slug,
        name: input.name.trim(),
        baseUrl: input.baseUrl.trim(),
        chatPath: input.chatPath.trim(),
        wireFormat: input.wireFormat,
        defaultModel: input.model.trim(),
        note: input.note?.trim() || null,
      };
      if (existingDefinition) {
        await db.update(customProviders).set(defValues).where(eq(customProviders.id, existingDefinition.id));
      } else {
        await db.insert(customProviders).values(defValues);
      }

      const apiKey = input.apiKey.trim();
      const credValues = {
        providerId: slug,
        encryptedKey: encryptSecret(apiKey, slug),
        maskedKey: maskSecret(apiKey),
        modelOverride: input.model.trim(),
        baseUrlOverride: null,
        enabled: true,
        priority: input.priority,
        lastTestedAt: testResult ? new Date() : null,
        lastTestOk: testResult ? true : null,
        lastTestDetail: testResult ? `Answered in ${testResult.latencyMs}ms as ${testResult.model}` : null,
        updatedByEmail: ctx.user.email ?? null,
      };

      const existingCred = (await db.select().from(providerCredentials).where(eq(providerCredentials.providerId, slug)).limit(1))[0];
      if (existingCred) {
        await db.update(providerCredentials).set(credValues).where(eq(providerCredentials.id, existingCred.id));
      } else {
        await db.insert(providerCredentials).values(credValues);
      }

      invalidateProviderCache();

      await audit({
        action: existingCred ? "key_rotated" : "key_set",
        providerId: slug,
        actorEmail: ctx.user.email ?? undefined,
        detail: `custom endpoint ${input.baseUrl.trim()}${input.chatPath.trim()}, model ${input.model.trim()}, ${input.wireFormat}`,
        ipAddress: clientIp(ctx.req),
      });

      return {
        success: true as const,
        slug,
        tested: Boolean(testResult),
        latencyMs: testResult?.latencyMs ?? null,
        warning: endpointCheck.reason ?? null,
      };
    }),

  /** Remove a custom endpoint and its key together. */
  deleteCustomProvider: vaultProcedure
    .input(z.object({ slug: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      await db.delete(providerCredentials).where(eq(providerCredentials.providerId, input.slug));
      await db.delete(customProviders).where(eq(customProviders.slug, input.slug));
      invalidateProviderCache();

      await audit({
        action: "key_deleted",
        providerId: input.slug,
        actorEmail: ctx.user.email ?? undefined,
        detail: "custom endpoint removed",
        ipAddress: clientIp(ctx.req),
      });
      return { success: true as const };
    }),

  // ─── MCP servers ─────────────────────────────────────────────────────────

  /**
   * Add or replace an MCP server.
   *
   * The URL is tested with a real handshake before it is stored, and the tool
   * list discovered there is saved — so the advisor is only ever told about
   * tools that actually exist.
   */
  setMcpServer: vaultProcedure
    .input(
      z.object({
        label: z.string().min(1).max(200),
        url: z.string().min(1).max(1000),
        token: z.string().max(2000).optional(),
        /** JSON object of extra headers, for servers not using Bearer auth. */
        headers: z.string().max(4000).optional(),
        /** Let the advisor call these tools without asking. Off by default. */
        autoInvoke: z.boolean().default(false),
        /** Replace an existing server rather than adding a new one. */
        slug: z.string().max(64).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const urlCheck = validateMcpUrl(input.url.trim());
      if (!urlCheck.ok) throw new TRPCError({ code: "BAD_REQUEST", message: urlCheck.reason ?? "Invalid URL." });
      if (isBannedProvider(input.url) || isBannedProvider(input.label)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${CHINA_POLICY_MESSAGE}. That MCP server cannot be added.` });
      }
      await assertMcpSlotAvailable(input.slug || slugify(input.label));

      if (input.headers) {
        try {
          const parsed = JSON.parse(input.headers);
          if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
        } catch {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Extra headers must be a JSON object, e.g. {\"X-Api-Key\": \"...\"}." });
        }
      }

      const slug = input.slug || slugify(input.label);
      const token = input.token?.trim() || null;

      // Handshake before storing. A URL that does not speak MCP should be
      // rejected at the point of entry, not discovered later mid-conversation.
      let discovered;
      try {
        discovered = await handshake({
          url: input.url.trim(),
          token,
          extraHeaders: input.headers ? JSON.parse(input.headers) : {},
        });
      } catch (e) {
        const message = e instanceof McpError ? e.userMessage : e instanceof Error ? e.message : "Connection failed.";
        await audit({
          action: "settings_changed",
          providerId: slug,
          actorEmail: ctx.user.email ?? undefined,
          detail: `MCP handshake failed: ${message}`.slice(0, 500),
          ipAddress: clientIp(ctx.req),
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: `${message} Nothing was saved.` });
      }

      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const values: Record<string, unknown> = {
        slug,
        label: input.label.trim(),
        url: input.url.trim(),
        headersJson: input.headers || null,
        enabled: true,
        autoInvoke: input.autoInvoke,
        toolsJson: JSON.stringify(discovered.tools),
        toolCount: discovered.tools.length,
        lastTestedAt: new Date(),
        lastTestOk: true,
        lastTestDetail: `${discovered.serverName} ${discovered.serverVersion} — ${discovered.tools.length} tool${discovered.tools.length === 1 ? "" : "s"}`,
        updatedByEmail: ctx.user.email ?? null,
      };

      if (token) {
        values.encryptedToken = encryptSecret(token, slug);
        values.maskedToken = maskSecret(token);
      }

      const existing = (await db.select().from(mcpServers).where(eq(mcpServers.slug, slug)).limit(1))[0];
      if (existing) {
        await db.update(mcpServers).set(values).where(eq(mcpServers.id, existing.id));
      } else {
        await db.insert(mcpServers).values(values as any);
      }

      await audit({
        action: existing ? "settings_changed" : "key_set",
        providerId: slug,
        actorEmail: ctx.user.email ?? undefined,
        detail: `MCP ${existing ? "updated" : "added"}: ${discovered.serverName}, ${discovered.tools.length} tools, autoInvoke=${input.autoInvoke}`,
        ipAddress: clientIp(ctx.req),
      });

      return {
        success: true as const,
        slug,
        serverName: discovered.serverName,
        toolCount: discovered.tools.length,
        tools: discovered.tools.map(t => ({ name: t.name, description: t.description ?? null })),
        warning: urlCheck.reason ?? null,
      };
    }),

  /** Re-handshake and refresh the stored tool list. */
  testMcpServer: vaultProcedure
    .input(z.object({ slug: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const result = await refreshTools(input.slug);
      await audit({
        action: "key_tested",
        providerId: input.slug,
        actorEmail: ctx.user.email ?? undefined,
        detail: result.ok ? `MCP ok, ${result.tools.length} tools` : `MCP failed: ${result.message}`,
        ipAddress: clientIp(ctx.req),
      });
      return result;
    }),

  updateMcpServer: vaultProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(64),
        enabled: z.boolean().optional(),
        autoInvoke: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const patch: Record<string, unknown> = { updatedByEmail: ctx.user.email ?? null };
      if (input.enabled !== undefined) patch.enabled = input.enabled;
      if (input.autoInvoke !== undefined) patch.autoInvoke = input.autoInvoke;

      await db.update(mcpServers).set(patch).where(eq(mcpServers.slug, input.slug));
      await audit({
        action: "settings_changed",
        providerId: input.slug,
        actorEmail: ctx.user.email ?? undefined,
        detail: `MCP ${Object.keys(patch).filter(k => k !== "updatedByEmail").join(", ")}`,
        ipAddress: clientIp(ctx.req),
      });
      return { success: true as const };
    }),

  deleteMcpServer: vaultProcedure
    .input(z.object({ slug: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.delete(mcpServers).where(eq(mcpServers.slug, input.slug));
      await audit({
        action: "key_deleted",
        providerId: input.slug,
        actorEmail: ctx.user.email ?? undefined,
        detail: "MCP server removed",
        ipAddress: clientIp(ctx.req),
      });
      return { success: true as const };
    }),

  /**
   * Pull the Railway MCP slots (RCS_MCP_n_*) into the vault. Each is
   * handshaken first; a slot that does not answer is reported, not stored.
   * Provider keys need no import — the registry reads them from the
   * environment directly (see environmentNames in overview).
   */
  importMcpFromEnvironment: vaultProcedure.mutation(async ({ ctx }) => {
    const slots = environmentMcpSlots();
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

    const results: Array<{ slug: string; ok: boolean; message: string }> = [];
    for (const slot of slots) {
      try {
        await assertMcpSlotAvailable(slot.slug);
        const discovered = await handshake({
          url: slot.url,
          token: slot.token,
          extraHeaders: slot.headers ? JSON.parse(slot.headers) : {},
        });
        const values: Record<string, unknown> = {
          slug: slot.slug,
          label: slot.label,
          url: slot.url,
          headersJson: slot.headers,
          enabled: true,
          toolsJson: JSON.stringify(discovered.tools),
          toolCount: discovered.tools.length,
          lastTestedAt: new Date(),
          lastTestOk: true,
          lastTestDetail: `${discovered.serverName} ${discovered.serverVersion} — ${discovered.tools.length} tools (from ${slot.source})`,
          updatedByEmail: ctx.user.email ?? null,
        };
        if (slot.token) {
          values.encryptedToken = encryptSecret(slot.token, slot.slug);
          values.maskedToken = maskSecret(slot.token);
        }
        const existing = (await db.select().from(mcpServers).where(eq(mcpServers.slug, slot.slug)).limit(1))[0];
        if (existing) await db.update(mcpServers).set(values).where(eq(mcpServers.id, existing.id));
        else await db.insert(mcpServers).values(values as any);
        results.push({ slug: slot.slug, ok: true, message: `${discovered.tools.length} tools` });
      } catch (e) {
        const message = e instanceof McpError ? e.userMessage : e instanceof TRPCError ? e.message : e instanceof Error ? e.message : "failed";
        results.push({ slug: slot.slug, ok: false, message });
      }
    }
    await audit({
      action: "settings_changed",
      actorEmail: ctx.user.email ?? undefined,
      detail: `imported MCP from environment: ${results.filter(r => r.ok).length}/${results.length} ok`,
      ipAddress: clientIp(ctx.req),
    });
    return { slots: slots.length, results };
  }),

  /** The audit trail. Readable without unlocking — it contains no secrets. */
  auditLog: ownerProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => recentAudit(input?.limit ?? 100)),

  // ─── Image generation ────────────────────────────────────────────────────

  /**
   * Which image providers are keyed on the host (Replicate, fal, Stability,
   * OpenAI), in the order they are tried, with their models. Never a key.
   */
  imageProviders: ownerProcedure.query(async () => {
    const { imageProviderStatus, ASPECT_RATIOS } = await import("./imageGenerator");
    const { isStorageConfigured } = await import("./storage");
    return { providers: imageProviderStatus(), aspectRatios: ASPECT_RATIOS, storageConfigured: isStorageConfigured() };
  }),

  /**
   * Generate one image and store it in the firm's bucket; returns its /files/
   * URL. Owner door only: every call is billed. Keys come from the host
   * environment, so the vault need not be unlocked. A China-linked model id
   * is refused before anything is sent.
   */
  generateImage: ownerProcedure
    .input(
      z.object({
        prompt: z.string().trim().min(1).max(4000),
        aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"]).default("1:1"),
        provider: z.enum(["replicate", "fal", "stability", "openai"]).optional(),
        model: z.string().trim().min(1).max(200).optional(),
      }).refine(v => !v.model || v.provider, { message: "Name the provider when naming a model.", path: ["model"] }),
    )
    .mutation(async ({ ctx, input }) => {
      const { generateImage, imageErrorMessage, ImageGenerationError } = await import("./imageGenerator");
      if (input.model && isBannedModel(input.model)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${CHINA_POLICY_MESSAGE}. "${input.model}" is refused on this platform.` });
      }
      try {
        const image = await generateImage({ ...input, keyPrefix: `owner/${ctx.user.id}` });
        await audit({
          action: "image_generated",
          providerId: image.provider,
          actorEmail: ctx.user.email ?? undefined,
          detail: `${image.model} → ${image.key}`.slice(0, 500),
          ipAddress: clientIp(ctx.req),
        });
        return image;
      } catch (e) {
        const notConfigured = e instanceof ImageGenerationError && e.kind === "not_configured";
        throw new TRPCError({ code: notConfigured ? "PRECONDITION_FAILED" : "BAD_REQUEST", message: imageErrorMessage(e) });
      }
    }),
});
