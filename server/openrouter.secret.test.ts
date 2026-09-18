import { describe, expect, it } from "vitest";

const liveProviderDescribe = process.env.RUN_LIVE_PROVIDER_TESTS === "1" ? describe : describe.skip;

liveProviderDescribe("OPENROUTER_API_KEY", () => {
  it(
    "authenticates with an OpenRouter chat completion",
    async () => {
      const key = process.env.OPENROUTER_API_KEY;
      expect(key, "OPENROUTER_API_KEY must be configured").toBeTruthy();

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-small-3.2-24b-instruct",
          messages: [{ role: "user", content: "Reply with READY only." }],
          max_tokens: 8,
        }),
      });

      const body = await response.text();
      expect(
        response.ok,
        `OpenRouter rejected the configured credential with HTTP ${response.status}: ${body.slice(0, 240)}`,
      ).toBe(true);
    },
    30_000,
  );
});
