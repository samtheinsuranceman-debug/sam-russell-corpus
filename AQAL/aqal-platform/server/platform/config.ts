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
