// ============================================================
// Platform seam — provider configuration
// ============================================================
// This is the single place that decides which external provider backs each
// capability (LLM, speech-to-text, storage, auth). Every capability sits behind
// one swappable interface and degrades to a safe local mock when unconfigured,
// so the app boots and the core loop runs with zero platform credentials.
//
// Defaults (set the matching env vars to activate a real provider):
//   LLM   → OpenAI        (OPENAI_API_KEY)          | fallback: Forge, then mock
//   STT   → OpenAI Whisper (OPENAI_API_KEY)         | fallback: Forge, then mock
//   STORE → S3 / R2       (S3_BUCKET + creds)       | fallback: Forge, then local mock
//   AUTH  → OAuth (existing) — Clerk/Auth.js is the documented swap in auth.ts
// ============================================================

const env = (k: string) => (process.env[k] ?? "").trim();

// ---- LLM ----------------------------------------------------
export const OPENAI_API_KEY = env("OPENAI_API_KEY");
export const OPENAI_BASE_URL = env("OPENAI_BASE_URL") || "https://api.openai.com";
export const OPENAI_MODEL = env("OPENAI_MODEL") || "gpt-4o";
export const OPENAI_TRANSCRIBE_MODEL = env("OPENAI_TRANSCRIBE_MODEL") || "whisper-1";

// Forge (the previous Manus-hosted, OpenAI-compatible gateway) is kept as a
// fallback so existing deployments keep working during migration.
export const FORGE_API_URL = env("BUILT_IN_FORGE_API_URL");
export const FORGE_API_KEY = env("BUILT_IN_FORGE_API_KEY");

// ---- Multi-AI consensus panel (high-confidence tier) --------
// Each panel member is one AI from a DIFFERENT developer, called via an
// OpenAI-compatible chat endpoint. A member joins the panel only when its key is
// set. The free tier uses a single model (OPENAI above); the paid/high-confidence
// tier fans out to every configured member and takes the consensus.
export type PanelMember = {
  id: string;
  name: string;      // display name, e.g. "Claude"
  developer: string; // e.g. "Anthropic"
  base: string;      // OpenAI-compatible base URL
  key: string;       // API key (empty = member disabled)
  model: string;
};

export const PANEL_MEMBERS: PanelMember[] = [
  { id: "openai", name: "GPT", developer: "OpenAI",
    base: OPENAI_BASE_URL, key: OPENAI_API_KEY, model: OPENAI_MODEL },
  { id: "anthropic", name: "Claude", developer: "Anthropic",
    base: env("ANTHROPIC_BASE_URL") || "https://api.anthropic.com/v1",
    key: env("ANTHROPIC_API_KEY"), model: env("ANTHROPIC_MODEL") || "claude-3-5-sonnet-latest" },
  { id: "google", name: "Gemini", developer: "Google",
    base: env("GOOGLE_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta/openai",
    key: env("GOOGLE_API_KEY"), model: env("GOOGLE_MODEL") || "gemini-1.5-pro" },
  { id: "xai", name: "Grok", developer: "xAI",
    base: env("XAI_BASE_URL") || "https://api.x.ai/v1",
    key: env("XAI_API_KEY"), model: env("XAI_MODEL") || "grok-2-latest" },
  { id: "llama", name: "Llama", developer: "Meta",
    base: env("GROQ_BASE_URL") || "https://api.groq.com/openai/v1",
    key: env("GROQ_API_KEY"), model: env("GROQ_MODEL") || "llama-3.3-70b-versatile" },
  // Mistral (Le Chat) — an independent European lab. A different training lineage
  // = genuinely uncorrelated error, which strengthens the consensus. OpenAI-compatible.
  { id: "mistral", name: "Mistral", developer: "Mistral AI (France)",
    base: env("MISTRAL_BASE_URL") || "https://api.mistral.ai/v1",
    key: env("MISTRAL_API_KEY"), model: env("MISTRAL_MODEL") || "mistral-large-latest" },
  // Cohere Command (Canada) — non-American, Western, no foreign-jurisdiction data
  // concern. Routed through OpenRouter by default so it speaks the OpenAI dialect.
  { id: "cohere", name: "Command", developer: "Cohere (Canada)",
    base: env("COHERE_BASE_URL") || "https://openrouter.ai/api/v1",
    key: env("COHERE_API_KEY") || env("OPENROUTER_API_KEY"),
    model: env("COHERE_MODEL") || "cohere/command-r-plus" },
  // AI21 Jamba (Israel) — a hybrid SSM-transformer, i.e. a genuinely DIFFERENT
  // architecture from every other panel member, so it errs in different ways.
  { id: "ai21", name: "Jamba", developer: "AI21 Labs (Israel)",
    base: env("AI21_BASE_URL") || "https://openrouter.ai/api/v1",
    key: env("AI21_API_KEY") || env("OPENROUTER_API_KEY"),
    model: env("AI21_MODEL") || "ai21/jamba-1.5-large" },
];

export function enabledPanel(): PanelMember[] {
  return PANEL_MEMBERS.filter((m) => m.key.length > 0);
}

// Should the multi-AI consensus panel also score the FREE, voice-only assessment
// (not just the paid tier)? Default ON: if 2+ panel models are configured, every
// assessment — free voice included — is scored by the whole panel and averaged.
// The result stays honestly labeled "voice-only" (confidence is driven by
// evidence, not model count); more models just makes the SCORE steadier.
// Set VOICE_CONSENSUS=false to save cost and reserve the panel for paid tiers.
export function voiceConsensus(): boolean {
  return (env("VOICE_CONSENSUS") || "true").toLowerCase() !== "false";
}

// ---- Perplexity (evidence verification, high-confidence tier) ----
// Live web search + citations, used ONLY to verify uploaded evidence claims.
// Empty = mock (no real verification).
export const PERPLEXITY_API_KEY = env("PERPLEXITY_API_KEY");
export const PERPLEXITY_BASE_URL = env("PERPLEXITY_BASE_URL") || "https://api.perplexity.ai";
export const PERPLEXITY_MODEL = env("PERPLEXITY_MODEL") || "sonar-pro";
export function verificationProvider(): "perplexity" | "mock" {
  return PERPLEXITY_API_KEY ? "perplexity" : "mock";
}

export type LlmProvider = "openai" | "forge" | "mock";
export function llmProvider(): LlmProvider {
  if (OPENAI_API_KEY) return "openai";
  if (FORGE_API_URL && FORGE_API_KEY) return "forge";
  return "mock";
}

export type SttProvider = "openai" | "forge" | "mock";
export function sttProvider(): SttProvider {
  if (OPENAI_API_KEY) return "openai";
  if (FORGE_API_URL && FORGE_API_KEY) return "forge";
  return "mock";
}

// ---- Storage (S3 / Cloudflare R2) ---------------------------
// R2 is S3-compatible: point S3_ENDPOINT at the R2 endpoint and it just works.
export const S3_BUCKET = env("S3_BUCKET");
export const S3_REGION = env("S3_REGION") || "auto";
export const S3_ENDPOINT = env("S3_ENDPOINT"); // set for R2/MinIO; empty = AWS
export const S3_ACCESS_KEY_ID = env("S3_ACCESS_KEY_ID") || env("AWS_ACCESS_KEY_ID");
export const S3_SECRET_ACCESS_KEY = env("S3_SECRET_ACCESS_KEY") || env("AWS_SECRET_ACCESS_KEY");
export const S3_PUBLIC_BASE_URL = env("S3_PUBLIC_BASE_URL"); // optional CDN/base for public reads

export type StorageProvider = "s3" | "forge" | "local";
export function storageProvider(): StorageProvider {
  if (S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY) return "s3";
  if (FORGE_API_URL && FORGE_API_KEY) return "forge";
  return "local";
}

// ---- Beta access (free-for-first-N passcode) ----------------
// When BETA_ACCESS_CODE is set, users who enter it skip payment and are granted
// membership — capped at BETA_MAX_REDEMPTIONS (default 50). Empty = disabled.
export const BETA_ACCESS_CODE = env("BETA_ACCESS_CODE");
export const BETA_MAX_REDEMPTIONS = parseInt(env("BETA_MAX_REDEMPTIONS") || "50", 10) || 50;

// ---- Free access (universal passcode) -----------------------
// A single shared passcode that lets ANYONE sign up free with just their email —
// no card, no cap, unlimited redemptions. They take the assessment and get their
// low-confidence (voice-only) result, which is emailed to that address.
export const FREE_ACCESS_CODE = env("FREE_ACCESS_CODE") || "Welcome1";

// ---- Email (optional) ---------------------------------------
// Resend (https://resend.com) by default — set RESEND_API_KEY to send for real.
// Empty = mock (logs to server console), so the app runs without an email vendor.
export const RESEND_API_KEY = env("RESEND_API_KEY");
export const EMAIL_FROM = env("EMAIL_FROM") || "AQAL Intelligence <onboarding@resend.dev>";
export function emailProvider(): "resend" | "mock" {
  return RESEND_API_KEY ? "resend" : "mock";
}

// ---- Auth ---------------------------------------------------
// Kept behind the existing OAuth implementation; Clerk/Auth.js is the documented
// swap (see platform/auth.ts). ctx.user shape must not change when swapped.
export const OAUTH_SERVER_URL = env("OAUTH_SERVER_URL");
export type AuthProvider = "oauth" | "clerk";
export function authProvider(): AuthProvider {
  return env("CLERK_SECRET_KEY") ? "clerk" : "oauth";
}

// ---- Status (surface on /health and Admin) ------------------
export function platformStatus() {
  return {
    llm: llmProvider(),
    stt: sttProvider(),
    storage: storageProvider(),
    auth: authProvider(),
    // `true` means a real provider is wired; `false` means running on the mock.
    live: {
      llm: llmProvider() !== "mock",
      stt: sttProvider() !== "mock",
      storage: storageProvider() !== "local",
    },
  };
}
