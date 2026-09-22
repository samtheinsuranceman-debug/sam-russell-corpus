import { describe, expect, it } from "vitest";
import { isManusForge, maxTokensFor, resolveModel } from "./_core/llm";

describe("LLM endpoint configuration", () => {
  it("uses the operator's model when set, otherwise a sensible default per endpoint", () => {
    expect(resolveModel("https://api.openai.com/v1/chat/completions", { BUILT_IN_FORGE_MODEL: "gpt-4.1" })).toBe("gpt-4.1");
    expect(resolveModel("https://api.openai.com/v1/chat/completions", {})).toBe("gpt-4o-mini");
    expect(resolveModel("https://forge.manus.im/v1/chat/completions", {})).toBe("gemini-2.5-flash");
    expect(resolveModel("https://example.test/v1/chat/completions", { BUILT_IN_FORGE_MODEL: "  " })).toBe("gpt-4o-mini");
  });
  it("only sends forge-specific fields to the forge", () => {
    expect(isManusForge("https://forge.manus.im/v1/chat/completions")).toBe(true);
    expect(isManusForge("https://api.openai.com/v1/chat/completions")).toBe(false);
    expect(maxTokensFor(true, {})).toBe(32768);
    expect(maxTokensFor(false, {})).toBe(4096);
    expect(maxTokensFor(false, { BUILT_IN_FORGE_MAX_TOKENS: "2048" })).toBe(2048);
    expect(maxTokensFor(false, { BUILT_IN_FORGE_MAX_TOKENS: "nope" })).toBe(4096);
  });
});
