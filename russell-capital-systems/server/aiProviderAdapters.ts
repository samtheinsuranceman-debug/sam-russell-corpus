/**
 * Provider Adapters — one function per wire format.
 *
 * Every provider is reached through `callProvider`, which normalises the
 * request and the response so the rest of the platform does not care which
 * model answered. Four formats cover the whole list: the OpenAI
 * chat-completions shape (which most providers now speak), Anthropic's
 * messages API, Google's generateContent, and IBM watsonx.ai's text/chat
 * (OpenAI-like, behind an IAM token exchange and a project id).
 *
 * Errors are classified rather than passed through raw, because the difference
 * between "your key is wrong", "you are out of credit" and "their service is
 * down" is the difference between a fix that takes ten seconds and one that
 * takes an afternoon. Provider error bodies frequently contain the request
 * payload, so they are never surfaced verbatim to the browser.
 */
import { createHash } from "node:crypto";
import {
  CHINA_POLICY_MESSAGE,
  getProvider,
  isBannedModel,
  isBannedProvider,
  providerPolicyViolation,
  type ProviderDefinition,
} from "@shared/aiProviders";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ProviderCallOptions = {
  provider: ProviderDefinition;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Reasoning budget, where the provider supports one. */
  thinkingBudget?: number;
  baseUrlOverride?: string | null;
  /** Abort if the provider has not responded in this long. */
  timeoutMs?: number;
};

export type ProviderCallResult = {
  text: string;
  model: string;
  providerId: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  /** Citations, where the provider returns them. Perplexity does. */
  citations?: string[];
  latencyMs: number;
};

export type ProviderErrorKind =
  | "auth"          // key rejected — wrong, revoked, or for a different account
  | "quota"         // out of credit, or rate limited
  | "bad_request"   // model name wrong, payload rejected
  | "timeout"
  | "network"
  | "server"        // the provider's fault
  | "unknown";

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly providerId: string;
  readonly status?: number;
  /** Safe to show a human. Never contains the request body or the key. */
  readonly userMessage: string;

  constructor(opts: {
    kind: ProviderErrorKind;
    providerId: string;
    status?: number;
    message: string;
    userMessage: string;
  }) {
    super(opts.message);
    this.name = "ProviderError";
    this.kind = opts.kind;
    this.providerId = opts.providerId;
    this.status = opts.status;
    this.userMessage = opts.userMessage;
  }
}

function classify(status: number, providerId: string, name: string, body: string): ProviderError {
  const lower = body.toLowerCase();

  // Google returns HTTP 400 with API_KEY_INVALID for a bad key rather than a
  // 401, so status alone would report "check your model name" when the real
  // problem is the key. Verified against the live endpoint.
  const looksLikeBadKey =
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("unauthenticated");

  if (status === 401 || status === 403 || looksLikeBadKey) {
    return new ProviderError({
      kind: "auth",
      providerId,
      status,
      message: `${providerId} auth failed: ${status}`,
      userMessage: `${name} rejected the API key. Check it was copied whole, has not been revoked, and belongs to an account with API access enabled.`,
    });
  }

  if (status === 429) {
    const isQuota = lower.includes("quota") || lower.includes("credit") || lower.includes("billing") || lower.includes("insufficient");
    return new ProviderError({
      kind: "quota",
      providerId,
      status,
      message: `${providerId} rate limited or out of quota`,
      userMessage: isQuota
        ? `${name} reports the account is out of credit. Top up the balance in their console.`
        : `${name} is rate limiting. The key works — there are just too many requests right now.`,
    });
  }

  if (status === 402) {
    return new ProviderError({
      kind: "quota",
      providerId,
      status,
      message: `${providerId} payment required`,
      userMessage: `${name} requires payment on this account before the API will respond.`,
    });
  }

  if (status === 404 || status === 400) {
    const modelIssue = lower.includes("model");
    return new ProviderError({
      kind: "bad_request",
      providerId,
      status,
      message: `${providerId} rejected the request: ${status}`,
      userMessage: modelIssue
        ? `${name} does not recognise that model name, or the account does not have access to it. Check the model id against their current list.`
        : `${name} rejected the request as malformed. This is usually a model name that does not exist on this account.`,
    });
  }

  if (status >= 500) {
    return new ProviderError({
      kind: "server",
      providerId,
      status,
      message: `${providerId} server error ${status}`,
      userMessage: `${name} is returning a server error. Their end, not yours — try again shortly.`,
    });
  }

  return new ProviderError({
    kind: "unknown",
    providerId,
    status,
    message: `${providerId} returned ${status}`,
    userMessage: `${name} returned an unexpected response (HTTP ${status}).`,
  });
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number, providerId: string, name: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new ProviderError({
        kind: "timeout",
        providerId,
        message: `${providerId} timed out after ${timeoutMs}ms`,
        userMessage: `${name} did not respond within ${Math.round(timeoutMs / 1000)} seconds.`,
      });
    }
    throw new ProviderError({
      kind: "network",
      providerId,
      message: `${providerId} network error: ${e?.message}`,
      userMessage: `Could not reach ${name}. Check the base URL and that outbound requests are permitted from this host.`,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Normalise a response body that may be a string or an array of content parts. */
function partsToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(p => (typeof p === "string" ? p : p?.type === "text" ? p.text ?? "" : ""))
      .filter(Boolean)
      .join("");
  }
  return "";
}

// ─── OpenAI-compatible ───────────────────────────────────────────────────────

async function callOpenAiCompatible(o: ProviderCallOptions): Promise<ProviderCallResult> {
  const { provider, apiKey, model, messages } = o;
  const base = (o.baseUrlOverride || provider.baseUrl).replace(/\/$/, "");
  const url = `${base}${provider.chatPath}`;
  const started = Date.now();

  const body: Record<string, unknown> = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  };
  if (o.maxTokens) body.max_tokens = o.maxTokens;
  if (typeof o.temperature === "number") body.temperature = o.temperature;

  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
    // Some gateways (Public AI among them) refuse a request with no
    // User-Agent as bot traffic; the rest ignore it.
    "user-agent": "RussellCapitalSystems/1.0 (+https://russellcapitalsystems.com)",
  };
  // OpenRouter asks callers to identify themselves; it affects rate limits.
  if (provider.id === "openrouter") {
    headers["HTTP-Referer"] = "https://russellcapitalsystems.com";
    headers["X-Title"] = "Russell Capital Solutions";
  }

  const res = await fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(body) }, o.timeoutMs ?? 120_000, provider.id, provider.name);

  if (!res.ok) throw classify(res.status, provider.id, provider.name, await res.text().catch(() => ""));

  const json: any = await res.json();
  const choice = json?.choices?.[0];

  return {
    text: partsToText(choice?.message?.content),
    model: json?.model ?? model,
    providerId: provider.id,
    usage: {
      promptTokens: json?.usage?.prompt_tokens,
      completionTokens: json?.usage?.completion_tokens,
      totalTokens: json?.usage?.total_tokens,
    },
    // Perplexity returns these; harmless to look for everywhere.
    citations: Array.isArray(json?.citations) ? json.citations : undefined,
    latencyMs: Date.now() - started,
  };
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

async function callAnthropic(o: ProviderCallOptions): Promise<ProviderCallResult> {
  const { provider, apiKey, model, messages } = o;
  const base = (o.baseUrlOverride || provider.baseUrl).replace(/\/$/, "");
  const started = Date.now();

  // Anthropic takes the system prompt as a top-level field, not as a message.
  const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const turns = messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model,
    max_tokens: o.maxTokens ?? 8192,
    messages: turns.length ? turns : [{ role: "user", content: "." }],
  };
  if (system) body.system = system;
  if (typeof o.temperature === "number") body.temperature = o.temperature;
  // Extended thinking, where a budget was asked for. Anthropic requires the
  // budget to be below max_tokens.
  if (o.thinkingBudget && o.thinkingBudget > 1024) {
    body.thinking = { type: "enabled", budget_tokens: Math.min(o.thinkingBudget, (o.maxTokens ?? 8192) - 1) };
  }

  const res = await fetchWithTimeout(
    `${base}${provider.chatPath}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    },
    o.timeoutMs ?? 120_000,
    provider.id,
    provider.name,
  );

  if (!res.ok) throw classify(res.status, provider.id, provider.name, await res.text().catch(() => ""));

  const json: any = await res.json();
  // Content is an array of blocks; thinking blocks are skipped, text kept.
  const text = Array.isArray(json?.content)
    ? json.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("")
    : "";

  return {
    text,
    model: json?.model ?? model,
    providerId: provider.id,
    usage: {
      promptTokens: json?.usage?.input_tokens,
      completionTokens: json?.usage?.output_tokens,
      totalTokens: (json?.usage?.input_tokens ?? 0) + (json?.usage?.output_tokens ?? 0),
    },
    latencyMs: Date.now() - started,
  };
}

// ─── Google Generative Language ──────────────────────────────────────────────

async function callGoogle(o: ProviderCallOptions): Promise<ProviderCallResult> {
  const { provider, apiKey, model, messages } = o;
  const base = (o.baseUrlOverride || provider.baseUrl).replace(/\/$/, "");
  const started = Date.now();

  const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const contents = messages
    .filter(m => m.role !== "system")
    // Google calls the assistant role "model".
    .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const body: Record<string, unknown> = {
    contents: contents.length ? contents : [{ role: "user", parts: [{ text: "." }] }],
    generationConfig: {
      ...(o.maxTokens ? { maxOutputTokens: o.maxTokens } : {}),
      ...(typeof o.temperature === "number" ? { temperature: o.temperature } : {}),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetchWithTimeout(
    // The key goes in a header rather than the query string, so it does not
    // end up in access logs or proxy records.
    `${base}${provider.chatPath}/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    },
    o.timeoutMs ?? 120_000,
    provider.id,
    provider.name,
  );

  if (!res.ok) throw classify(res.status, provider.id, provider.name, await res.text().catch(() => ""));

  const json: any = await res.json();
  const text = (json?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text ?? "")
    .join("");

  return {
    text,
    model,
    providerId: provider.id,
    usage: {
      promptTokens: json?.usageMetadata?.promptTokenCount,
      completionTokens: json?.usageMetadata?.candidatesTokenCount,
      totalTokens: json?.usageMetadata?.totalTokenCount,
    },
    latencyMs: Date.now() - started,
  };
}

// ─── IBM watsonx.ai ──────────────────────────────────────────────────────────

/** IBM Cloud's token service. The API key is traded here for an hour-long bearer token. */
export const IBM_IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token";

/** Bearer tokens by a hash of the API key, reused until a minute before they expire. */
const watsonxTokens = new Map<string, { token: string; expiresAt: number }>();
const WATSONX_TOKEN_MARGIN_MS = 60_000;

/** Forget cached IAM tokens (a key changed, or a test wants a clean slate). */
export function clearWatsonxTokenCache() {
  watsonxTokens.clear();
}

/**
 * The key field may carry the project as `<api key>:<project id>`, so a key
 * typed into the Brain Hub is complete on its own; otherwise the project comes
 * from WATSONX_PROJECT_ID. An IBM Cloud API key never contains a colon.
 */
export function splitWatsonxKey(stored: string, env: Record<string, string | undefined> = process.env): { apiKey: string; projectId: string | null } {
  const i = stored.indexOf(":");
  if (i > 0) return { apiKey: stored.slice(0, i).trim(), projectId: stored.slice(i + 1).trim() || null };
  return { apiKey: stored.trim(), projectId: env.WATSONX_PROJECT_ID?.trim() || null };
}

async function watsonxToken(apiKey: string, provider: ProviderDefinition, timeoutMs: number): Promise<string> {
  const slot = createHash("sha256").update(apiKey).digest("hex");
  const cached = watsonxTokens.get(slot);
  if (cached && cached.expiresAt - WATSONX_TOKEN_MARGIN_MS > Date.now()) return cached.token;

  const res = await fetchWithTimeout(
    IBM_IAM_TOKEN_URL,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({ grant_type: "urn:ibm:params:oauth:grant-type:apikey", apikey: apiKey }).toString(),
    },
    Math.min(timeoutMs, 30_000),
    provider.id,
    provider.name,
  );
  // IAM answers an unknown or revoked key with HTTP 400, not 401.
  if (!res.ok) throw classify(res.status === 400 ? 401 : res.status, provider.id, provider.name, await res.text().catch(() => ""));

  const json: any = await res.json();
  const token = typeof json?.access_token === "string" ? json.access_token : "";
  if (!token) {
    throw new ProviderError({ kind: "auth", providerId: provider.id, message: "watsonx IAM returned no access_token", userMessage: `${provider.name}: IBM Cloud did not issue a token for this API key.` });
  }
  const expiresAt =
    typeof json.expiration === "number" ? json.expiration * 1000 : Date.now() + (typeof json.expires_in === "number" ? json.expires_in : 3600) * 1000;
  watsonxTokens.set(slot, { token, expiresAt });
  return token;
}

async function callWatsonx(o: ProviderCallOptions): Promise<ProviderCallResult> {
  const { provider, model, messages } = o;
  const { apiKey, projectId } = splitWatsonxKey(o.apiKey);
  if (!projectId) {
    throw new ProviderError({
      kind: "bad_request",
      providerId: provider.id,
      message: "watsonx project id missing",
      userMessage: `${provider.name} needs a project id: set WATSONX_PROJECT_ID, or save the key as <api key>:<project id>.`,
    });
  }
  const timeoutMs = o.timeoutMs ?? 120_000;
  // WATSONX_URL picks the region for a key typed into the Brain Hub as well as one on Railway.
  const regionUrl = process.env.WATSONX_URL?.trim() || null;
  if (!o.baseUrlOverride && isBannedProvider(regionUrl)) throw policyError(provider.id, `base URL: "${regionUrl}"`);
  const base = (o.baseUrlOverride || regionUrl || provider.baseUrl).replace(/\/$/, "");
  const started = Date.now();
  const token = await watsonxToken(apiKey, provider, timeoutMs);

  const body: Record<string, unknown> = {
    model_id: model,
    project_id: projectId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  };
  if (o.maxTokens) body.max_tokens = o.maxTokens;
  if (typeof o.temperature === "number") body.temperature = o.temperature;

  const res = await fetchWithTimeout(
    `${base}${provider.chatPath}`,
    {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    },
    timeoutMs,
    provider.id,
    provider.name,
  );

  if (!res.ok) {
    // A token IBM has stopped honouring is not reused on the next call.
    if (res.status === 401) watsonxTokens.delete(createHash("sha256").update(apiKey).digest("hex"));
    throw classify(res.status, provider.id, provider.name, await res.text().catch(() => ""));
  }

  const json: any = await res.json();
  return {
    text: partsToText(json?.choices?.[0]?.message?.content),
    model: json?.model_id ?? json?.model ?? model,
    providerId: provider.id,
    usage: {
      promptTokens: json?.usage?.prompt_tokens,
      completionTokens: json?.usage?.completion_tokens,
      totalTokens: json?.usage?.total_tokens,
    },
    latencyMs: Date.now() - started,
  };
}

// ─── Entry point ─────────────────────────────────────────────────────────────

/**
 * The owner's rule, enforced at the one place every request leaves from: no
 * China-linked provider, base URL or model id is ever sent, whatever the
 * catalogue, the vault, an environment variable or a caller asked for.
 * Returns the offending value, or null when the call is clean.
 */
export function chinaPolicyViolation(o: Pick<ProviderCallOptions, "provider" | "model" | "baseUrlOverride">): string | null {
  const onProvider = providerPolicyViolation({ ...o.provider, defaultModel: "", suggestedModels: [] });
  if (onProvider) return onProvider;
  if (isBannedProvider(o.baseUrlOverride)) return `base URL: "${o.baseUrlOverride}"`;
  if (isBannedModel(o.model)) return `model: "${o.model}"`;
  return null;
}

function policyError(providerId: string, violation: string): ProviderError {
  return new ProviderError({
    kind: "bad_request",
    providerId,
    message: `${CHINA_POLICY_MESSAGE} (${violation})`,
    userMessage: `${CHINA_POLICY_MESSAGE}. ${violation} is refused on this platform.`,
  });
}

export async function callProvider(o: ProviderCallOptions): Promise<ProviderCallResult> {
  const violation = chinaPolicyViolation(o);
  if (violation) throw policyError(o.provider.id, violation);
  const result = await dispatch(o);
  // An aggregator can answer with a different model than the one asked for
  // (a fallback, an alias, a router). If what answered is China-linked, the
  // answer is discarded rather than shown.
  if (isBannedModel(result.model)) {
    throw policyError(o.provider.id, `answering model: "${result.model}"`);
  }
  return result;
}

async function dispatch(o: ProviderCallOptions): Promise<ProviderCallResult> {
  const format = o.provider.wireFormat;
  switch (format) {
    case "anthropic": return callAnthropic(o);
    case "google-generative": return callGoogle(o);
    case "openai-compatible": return callOpenAiCompatible(o);
    case "ibm-watsonx": return callWatsonx(o);
    default: {
      // A new WireFormat without a case here fails the type check.
      const unhandled: never = format;
      throw new ProviderError({
        kind: "bad_request",
        providerId: o.provider.id,
        message: `No adapter for wire format ${String(unhandled)}`,
        userMessage: "This provider has no adapter configured.",
      });
    }
  }
}

/**
 * Cheapest possible call that proves a key works end to end.
 *
 * Deliberately a real completion rather than a models-list call: a key can
 * list models and still be unable to run one, and "is it actually working" is
 * the only question this button exists to answer.
 */
export async function testProviderKey(opts: {
  providerId: string;
  apiKey: string;
  model?: string;
  baseUrlOverride?: string | null;
}): Promise<{ ok: true; model: string; latencyMs: number; reply: string } | { ok: false; kind: ProviderErrorKind; message: string }> {
  const provider = getProvider(opts.providerId);
  if (!provider) return { ok: false, kind: "bad_request", message: "Unknown provider." };

  try {
    const result = await callProvider({
      provider,
      apiKey: opts.apiKey,
      model: opts.model || provider.defaultModel,
      messages: [{ role: "user", content: "Reply with the single word: connected" }],
      maxTokens: 16,
      temperature: 0,
      timeoutMs: 30_000,
    });
    return {
      ok: true,
      model: result.model,
      latencyMs: result.latencyMs,
      reply: result.text.trim().slice(0, 80),
    };
  } catch (e) {
    if (e instanceof ProviderError) return { ok: false, kind: e.kind, message: e.userMessage };
    return { ok: false, kind: "unknown", message: e instanceof Error ? e.message : "Test failed." };
  }
}
