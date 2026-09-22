/**
 * Provider Registry — loads credentials from the vault and routes calls.
 *
 * Every AI call on the platform goes through `completeChat` here. It walks the
 * enabled providers in priority order and returns the first successful answer.
 *
 * ─── WHY A CHAIN RATHER THAN ONE PROVIDER ───────────────────────────────────
 *
 * Providers go down, rate limit, and run out of credit, usually at the least
 * convenient moment. An advisor that stops working because one vendor is
 * having an afternoon is not usable in front of a client. The chain fails over
 * silently and records which provider actually answered, so a degraded answer
 * is at least a traceable one.
 *
 * It does NOT fail over on an auth error. A rejected key is a configuration
 * problem, and quietly routing around it means nobody discovers the key is
 * dead until the bill arrives from whatever picked up the slack.
 */
import { and, asc, eq } from "drizzle-orm";
import { customProviders, providerCredentials } from "../drizzle/schema";
import { decryptSecret, isVaultConfigured } from "./_core/secretVault";
import { buildCustomProvider, getProvider, isCustomProviderId, PROVIDERS, type ProviderDefinition } from "@shared/aiProviders";
import {
  ProviderError,
  callProvider,
  type ChatMessage,
  type ProviderCallResult,
} from "./aiProviderAdapters";

/**
 * Decrypted keys, cached in memory so every call does not hit the database
 * and the KDF. Cleared whenever a credential changes.
 */
type CachedCredential = {
  providerId: string;
  apiKey: string;
  model: string;
  baseUrlOverride: string | null;
  priority: number;
};

let cache: CachedCredential[] | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000;

/** Custom endpoint definitions, cached alongside the credentials. */
let customCache: Map<string, ProviderDefinition> = new Map();

/**
 * Resolve a provider id to a definition, whether it came from the built-in
 * catalogue or was added by the owner as a custom endpoint.
 */
export function resolveProvider(id: string): ProviderDefinition | undefined {
  return isCustomProviderId(id) ? customCache.get(id) : getProvider(id);
}

/** Load owner-defined endpoints so resolveProvider can see them. */
async function loadCustomProviders(): Promise<Map<string, ProviderDefinition>> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return new Map();
  const rows = await db.select().from(customProviders);
  return new Map(rows.map(r => [r.slug, buildCustomProvider(r)]));
}

/** Drop the cache. Called after any credential change. */
export function invalidateProviderCache() {
  cache = null;
  cacheLoadedAt = 0;
}

async function loadCredentials(): Promise<CachedCredential[]> {
  if (cache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) return cache;

  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db || !isVaultConfigured()) {
    cache = [];
    cacheLoadedAt = Date.now();
    return cache;
  }

  customCache = await loadCustomProviders();

  const rows = await db
    .select()
    .from(providerCredentials)
    .where(eq(providerCredentials.enabled, true))
    .orderBy(asc(providerCredentials.priority));

  const loaded: CachedCredential[] = [];
  for (const row of rows) {
    const provider = resolveProvider(row.providerId);
    if (!provider) continue;
    try {
      loaded.push({
        providerId: row.providerId,
        apiKey: decryptSecret(row.encryptedKey, row.providerId),
        model: row.modelOverride || provider.defaultModel,
        baseUrlOverride: row.baseUrlOverride,
        priority: row.priority,
      });
    } catch (e) {
      // A key that will not decrypt is almost always a changed RCS_VAULT_KEY.
      // Skip it rather than failing the whole chain, and say so loudly.
      console.error(
        `[Providers] Could not decrypt the ${row.providerId} key. It was stored under a different RCS_VAULT_KEY — re-enter it in the AI Connector.`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  cache = loaded;
  cacheLoadedAt = Date.now();
  return loaded;
}

/**
 * Keys that are already in the hosting environment.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Several provider keys were set as Railway environment variables long before
 * the vault existed. Ignoring them would mean re-typing keys the platform is
 * already holding, and — worse — leaving the advisor on a single model when
 * three are paid for and sitting right there.
 *
 * So the registry reads the conventional environment variable for each
 * provider and treats it as a configured credential. Two deliberate choices:
 *
 *   • A vault entry ALWAYS wins. If a key was typed into the AI Connector, it
 *     is the one the owner meant, and an ambient environment variable does not
 *     get to silently override it.
 *   • These sit BELOW every vault key in the chain and above the gateway, so
 *     they are a floor, not a ceiling.
 *
 * The model is the provider's default unless <ID>_MODEL is set — so switching
 * Claude to a different model is an environment change, not a code change.
 */
/**
 * Conventional names first (these are what the live Railway service already
 * holds), then the Brain Hub's own uniform name for every provider:
 *
 *     RCS_BRAIN_<PROVIDER_ID>_API_KEY      e.g. RCS_BRAIN_GOOGLE_VERTEX_API_KEY
 *     RCS_BRAIN_<PROVIDER_ID>_MODEL        optional model override
 *     RCS_BRAIN_<PROVIDER_ID>_BASE_URL     optional base URL override
 *
 * The uniform name means the Railway "Variables" panel is a complete second
 * pathway: every one of the forty brains can be keyed there without the UI.
 */
const CONVENTIONAL_ENV_NAMES: Record<string, string[]> = {
  anthropic: ["ANTHROPIC_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  google: ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
  xai: ["XAI_API_KEY"],
  perplexity: ["PERPLEXITY_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  mistral: ["MISTRAL_API_KEY"],
  groq: ["GROQ_API_KEY"],
  cohere: ["COHERE_API_KEY"],
  together: ["TOGETHER_API_KEY"],
  fireworks: ["FIREWORKS_API_KEY"],
  cerebras: ["CEREBRAS_API_KEY"],
  deepinfra: ["DEEPINFRA_API_KEY"],
  nvidia: ["NVIDIA_API_KEY"],
  moonshot: ["MOONSHOT_API_KEY"],
  qwen: ["QWEN_API_KEY", "DASHSCOPE_API_KEY"],
  zhipu: ["ZHIPU_API_KEY"],
  huggingface: ["HUGGINGFACE_API_KEY", "HF_TOKEN"],
  "meta-llama": ["LLAMA_API_KEY"],
  ai21: ["AI21_API_KEY"],
  writer: ["WRITER_API_KEY"],
  reka: ["REKA_API_KEY"],
  "vercel-gateway": ["AI_GATEWAY_API_KEY"],
  "azure-openai": ["AZURE_OPENAI_API_KEY"],
  "amazon-bedrock": ["AWS_BEARER_TOKEN_BEDROCK"],
  "google-vertex": ["VERTEX_API_KEY"],
  cloudflare: ["CLOUDFLARE_AI_API_TOKEN"],
  litellm: ["LITELLM_API_KEY"],
  sambanova: ["SAMBANOVA_API_KEY"],
  baseten: ["BASETEN_API_KEY"],
  lambda: ["LAMBDA_API_KEY"],
  novita: ["NOVITA_API_KEY"],
  hyperbolic: ["HYPERBOLIC_API_KEY"],
  nebius: ["NEBIUS_API_KEY"],
  scaleway: ["SCALEWAY_API_KEY"],
  friendli: ["FRIENDLI_TOKEN"],
  ollama: ["OLLAMA_API_KEY"],
  minimax: ["MINIMAX_API_KEY"],
  qianfan: ["QIANFAN_API_KEY"],
  upstage: ["UPSTAGE_API_KEY"],
};

function envSlug(providerId: string): string {
  return providerId.toUpperCase().replace(/-/g, "_");
}

/** Every environment variable name that can key a given provider, in precedence order. */
export function environmentKeyNames(providerId: string): string[] {
  return [`RCS_BRAIN_${envSlug(providerId)}_API_KEY`, ...(CONVENTIONAL_ENV_NAMES[providerId] ?? [])];
}

export function environmentCredentials(): CachedCredential[] {
  const found: CachedCredential[] = [];
  let priority = 5000;

  for (const provider of PROVIDERS) {
    if (provider.id === "forge") continue;
    const providerId = provider.id;
    const envName = environmentKeyNames(providerId).find(name => process.env[name]?.trim());
    const key = envName ? process.env[envName]?.trim() : undefined;
    if (!key) continue;

    const modelOverride =
      process.env[`RCS_BRAIN_${envSlug(providerId)}_MODEL`]?.trim() ||
      process.env[`${envSlug(providerId)}_MODEL`]?.trim();
    const baseUrlOverride =
      process.env[`RCS_BRAIN_${envSlug(providerId)}_BASE_URL`]?.trim() ||
      process.env[`${envSlug(providerId)}_BASE_URL`]?.trim();

    // A provider that needs an account-scoped base URL is not callable without one.
    if (provider.requiresBaseUrl && !baseUrlOverride) continue;

    found.push({
      providerId,
      apiKey: key,
      model: modelOverride || provider.defaultModel,
      baseUrlOverride: baseUrlOverride || null,
      priority: priority++,
    });
  }

  return found;
}

/** Which providers came from the environment — for the connector's status view. */
export function environmentProviderIds(): string[] {
  return environmentCredentials().map(c => c.providerId);
}

/**
 * The built-in gateway, kept as a last resort. It reads its credentials from
 * the environment rather than the vault, since the hosting platform supplies
 * them and they are not Sam's to rotate.
 */
function gatewayFallback(): CachedCredential | null {
  const key = process.env.BUILT_IN_FORGE_API_KEY?.trim();
  const url = process.env.BUILT_IN_FORGE_API_URL?.trim();
  if (!key) return null;
  return {
    providerId: "forge",
    apiKey: key,
    model: process.env.FORGE_MODEL?.trim() || "gemini-2.5-flash",
    baseUrlOverride: url || "https://forge.manus.im",
    priority: 9999,
  };
}

export type CompletionRequest = {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  thinkingBudget?: number;
  /** Force a specific provider instead of walking the chain. */
  preferProvider?: string;
  /** Skip these — used to get a genuinely independent second opinion. */
  exclude?: string[];
};

export type CompletionResult = ProviderCallResult & {
  /** Providers tried and failed before this one answered. */
  attempted: Array<{ providerId: string; error: string }>;
};

export class NoProviderAvailableError extends Error {
  readonly attempted: Array<{ providerId: string; error: string }>;
  constructor(attempted: Array<{ providerId: string; error: string }>) {
    super(
      attempted.length === 0
        ? "No AI provider is configured. Add a key in the AI Connector."
        : `Every configured provider failed. ${attempted.map(a => `${a.providerId}: ${a.error}`).join(" | ")}`,
    );
    this.name = "NoProviderAvailableError";
    this.attempted = attempted;
  }
}

/**
 * Run a completion against the first provider that answers.
 */
export async function completeChat(req: CompletionRequest): Promise<CompletionResult> {
  const credentials = await loadCredentials();
  const fallback = gatewayFallback();

  let chain = [...credentials];

  // Environment keys fill the gaps the vault has not covered. A vault entry for
  // the same provider always wins — it was typed deliberately.
  for (const envCred of environmentCredentials()) {
    if (!chain.some(c => c.providerId === envCred.providerId)) chain.push(envCred);
  }

  if (fallback && !chain.some(c => c.providerId === "forge")) chain.push(fallback);

  if (req.preferProvider) {
    const preferred = chain.find(c => c.providerId === req.preferProvider);
    if (!preferred) {
      throw new NoProviderAvailableError([
        { providerId: req.preferProvider, error: "not configured or not enabled" },
      ]);
    }
    chain = [preferred];
  }

  if (req.exclude?.length) {
    chain = chain.filter(c => !req.exclude!.includes(c.providerId));
  }

  const attempted: Array<{ providerId: string; error: string }> = [];

  for (const credential of chain) {
    const provider = resolveProvider(credential.providerId);
    if (!provider) continue;

    try {
      const result = await callProvider({
        provider,
        apiKey: credential.apiKey,
        model: credential.model,
        messages: req.messages,
        maxTokens: req.maxTokens,
        temperature: req.temperature,
        thinkingBudget: req.thinkingBudget,
        baseUrlOverride: credential.baseUrlOverride,
      });

      void recordUse(credential.providerId);
      return { ...result, attempted };
    } catch (e) {
      const message = e instanceof ProviderError ? e.userMessage : e instanceof Error ? e.message : "Unknown error";
      attempted.push({ providerId: credential.providerId, error: message });

      // A rejected key is a configuration fault. Failing over hides it, and
      // the next provider silently absorbs the cost until someone notices.
      if (e instanceof ProviderError && e.kind === "auth") {
        console.error(`[Providers] ${credential.providerId} rejected its key — not failing over. Fix it in the AI Connector.`);
        throw new NoProviderAvailableError(attempted);
      }

      console.warn(`[Providers] ${credential.providerId} failed (${message}); trying the next provider.`);
    }
  }

  throw new NoProviderAvailableError(attempted);
}

/** Fire-and-forget usage counter. Never allowed to fail a completion. */
async function recordUse(providerId: string) {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return;
    const rows = await db.select().from(providerCredentials).where(eq(providerCredentials.providerId, providerId)).limit(1);
    if (!rows[0]) return;
    await db
      .update(providerCredentials)
      .set({ lastUsedAt: new Date(), useCount: rows[0].useCount + 1 })
      .where(eq(providerCredentials.id, rows[0].id));
  } catch {
    /* telemetry only */
  }
}

/**
 * Ask two independent providers the same question and return both.
 *
 * Used where a recommendation should not rest on one model's opinion. Two
 * models agreeing is weak evidence; two models disagreeing is strong evidence
 * that the question is harder than it looks, which is the more useful signal.
 */
export async function secondOpinion(req: CompletionRequest): Promise<{
  primary: CompletionResult;
  secondary: CompletionResult | null;
  agreed: boolean | null;
}> {
  const primary = await completeChat(req);
  try {
    const secondary = await completeChat({ ...req, exclude: [...(req.exclude ?? []), primary.providerId] });
    return { primary, secondary, agreed: null };
  } catch {
    // Only one provider configured — say so rather than pretending.
    return { primary, secondary: null, agreed: null };
  }
}

/** What is configured right now, without decrypting anything. */
export async function providerStatus(): Promise<
  Array<{
    providerId: string;
    name: string;
    configured: boolean;
    enabled: boolean;
    model: string | null;
    maskedKey: string | null;
    priority: number;
    lastTestedAt: Date | null;
    lastTestOk: boolean | null;
    lastTestDetail: string | null;
    lastUsedAt: Date | null;
    useCount: number;
  }>
> {
  const { getDb } = await import("./db");
  const db = await getDb();
  const rows = db ? await db.select().from(providerCredentials) : [];
  const byId = new Map(rows.map(r => [r.providerId, r]));

  const customRows = db ? await db.select().from(customProviders) : [];
  const allProviders = [
    ...PROVIDERS.filter(p => p.id !== "forge"),
    ...customRows.map(buildCustomProvider),
  ];

  return allProviders.map(p => {
    const row = byId.get(p.id);
    return {
      providerId: p.id,
      name: p.name,
      configured: Boolean(row),
      enabled: row?.enabled ?? false,
      model: row?.modelOverride || (row ? p.defaultModel : null),
      maskedKey: row?.maskedKey ?? null,
      priority: row?.priority ?? 100,
      lastTestedAt: row?.lastTestedAt ?? null,
      lastTestOk: row?.lastTestOk ?? null,
      lastTestDetail: row?.lastTestDetail ?? null,
      lastUsedAt: row?.lastUsedAt ?? null,
      useCount: row?.useCount ?? 0,
    };
  });
}

/** Provider ids that have a working, enabled key. Feeds the AI Stack panel. */
export async function liveProviderIds(): Promise<string[]> {
  const credentials = await loadCredentials();
  const ids = credentials.map(c => c.providerId);
  for (const envCred of environmentCredentials()) if (!ids.includes(envCred.providerId)) ids.push(envCred.providerId);
  return ids;
}

/**
 * The one call every advisor surface should make.
 *
 * Walks the Brain Hub chain (vault keys → Railway environment keys → built-in
 * gateway). If the chain is empty or every brain fails for a non-auth reason,
 * falls back to the platform's original invokeLLM so the advisor still
 * answers. Returns the same shape invokeLLM does, so a call site swaps one
 * import and nothing else.
 */
export async function brainComplete(params: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  preferProvider?: string;
}): Promise<{ text: string; providerId: string; model: string; attempted: Array<{ providerId: string; error: string }> }> {
  try {
    const result = await completeChat({
      messages: params.messages,
      maxTokens: params.maxTokens,
      temperature: params.temperature,
      preferProvider: params.preferProvider,
    });
    return { text: result.text, providerId: result.providerId, model: result.model, attempted: result.attempted };
  } catch (e) {
    if (e instanceof NoProviderAvailableError && e.attempted.some(a => /reject|auth|401|403/i.test(a.error))) {
      // A rejected key is a configuration fault; do not paper over it.
      throw e;
    }
    const attempted = e instanceof NoProviderAvailableError ? e.attempted : [];
    const { invokeLLM } = await import("./_core/llm");
    const res = await invokeLLM({
      messages: params.messages.map(m => ({ role: m.role, content: m.content })),
      maxTokens: params.maxTokens,
    });
    const content = res.choices[0]?.message?.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map(part => (typeof part === "string" ? part : "text" in part ? part.text : "")).join("")
          : "";
    return { text, providerId: "forge", model: "gateway", attempted };
  }
}
