import { describe, expect, it } from "vitest";

const liveProviderDescribe = process.env.RUN_LIVE_PROVIDER_TESTS === "1" ? describe : describe.skip;

liveProviderDescribe("XAI_API_KEY", () => {
  it(
    "authenticates with a funded xAI Grok chat completion",
    async () => {
      const key = process.env.XAI_API_KEY;
      expect(key, "XAI_API_KEY must be configured").toBeTruthy();

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-4",
          messages: [{ role: "user", content: "Reply with READY only." }],
          max_tokens: 8,
        }),
      });

      const body = await response.text();
      expect(
        response.ok,
        `xAI rejected the configured credential with HTTP ${response.status}: ${body.slice(0, 240)}`,
      ).toBe(true);
    },
    30_000,
  );
});
