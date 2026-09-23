// Configuration for server/liveResearch.ts — harvested from AQAL's platform/config.ts,
// reduced to the values that module actually reads. Nothing here is invented: every
// value comes from the environment or is the provider's documented default.
const env = (k: string): string => process.env[k] ?? "";

export const PERPLEXITY_API_KEY = env("PERPLEXITY_API_KEY");
export const PERPLEXITY_BASE_URL = env("PERPLEXITY_BASE_URL") || "https://api.perplexity.ai";
export const PERPLEXITY_MODEL = env("PERPLEXITY_MODEL") || "sonar-pro";

/** Which service performs citation discovery. "mock" means no key is set and nothing is fetched. */
export function verificationProvider(): "perplexity" | "mock" {
  return PERPLEXITY_API_KEY ? "perplexity" : "mock";
}

/** True when the platform LLM (server/_core/llm.ts) has a key to run the adversarial reviewer pass. */
export function llmConfigured(): boolean {
  return Boolean(env("OPENAI_API_KEY") || env("ANTHROPIC_API_KEY") || env("LLM_API_KEY"));
}
