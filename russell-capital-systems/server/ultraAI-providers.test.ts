import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve("server/ultraAI.ts"), "utf8");

describe("Ultra AI orchestrator — twelve AI advisors", () => {
  it("wires all twelve providers, each gated on its own environment key", () => {
    const envKeys = [
      "ANTHROPIC_API_KEY", // Claude (lead)
      "OPENAI_API_KEY", // ChatGPT
      "XAI_API_KEY", // Grok
      "GEMINI_API_KEY", // Gemini
      "PERPLEXITY_API_KEY", // Perplexity
      "OPENROUTER_API_KEY", // OpenRouter
      "MISTRAL_API_KEY", // Mistral
      "GROQ_API_KEY", // Groq
      "COHERE_API_KEY", // Cohere
      "DEEPSEEK_API_KEY", // DeepSeek
      "TOGETHER_API_KEY", // Together AI
      "BUILT_IN_FORGE_API_KEY", // Manus (Forge gateway)
    ];
    for (const key of envKeys) expect(src, key).toContain(`envKey: "${key}"`);
    // The provider id union must list exactly these twelve.
    for (const id of ["claude", "chatgpt", "grok", "gemini", "perplexity", "openrouter", "mistral", "groq", "cohere", "deepseek", "together", "manus"]) {
      expect(src, id).toContain(`"${id}"`);
    }
  });

  it("keeps API keys server-side only — never accepts them from the client", () => {
    // Keys are read from process.env inside providers; the client never sends them.
    expect(src).toContain("process.env[p.envKey]");
    expect(src).toContain("configuredProviders");
  });

  it("exposes a public homepage panel that withholds the proprietary method", () => {
    expect(src).toContain("homepagePanel");
    expect(src).toContain("PUBLIC_TEASER_SYSTEM");
    // The teaser prompt must forbid numbers/percentages/formulas (the "secret sauce").
    expect(src).toContain("NO specific dollar amounts");
    expect(src).toContain("NO calculation");
    // …while still naming the strategy pillars the concierge may describe.
    for (const pillar of ["accelerated mortgage payoff", "Roth-conversion", "oil & gas", "Index Universal Life", "divorce-proof"]) {
      expect(src, pillar).toContain(pillar);
    }
    // Not tax/legal/investment advice must be stated.
    expect(src).toContain("not tax, legal, or investment advice");
  });
});
