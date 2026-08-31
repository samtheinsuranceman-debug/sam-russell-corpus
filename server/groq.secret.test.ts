import { describe, expect, it } from "vitest";

const liveProviderDescribe = process.env.RUN_LIVE_PROVIDER_TESTS === "1" ? describe : describe.skip;

liveProviderDescribe("GROQ_API_KEY", () => {
  it(
    "authenticates with a GroqCloud chat completion",
    async () => {
      const key = process.env.GROQ_API_KEY;
      expect(key, "GROQ_API_KEY must be configured").toBeTruthy();

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [{ role: "user", content: "Reply with READY only." }],
          max_tokens: 8,
        }),
      });

      const body = await response.text();
      expect(
        response.ok,
        `GroqCloud rejected the configured credential with HTTP ${response.status}: ${body.slice(0, 240)}`,
      ).toBe(true);
    },
    30_000,
  );
});
