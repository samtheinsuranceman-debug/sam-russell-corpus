import { describe, expect, it } from "vitest";

describe("MISTRAL_API_KEY", () => {
  it(
    "authenticates with a Mistral chat completion",
    async () => {
      const key = process.env.MISTRAL_API_KEY;
      expect(key, "MISTRAL_API_KEY must be configured").toBeTruthy();

      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [{ role: "user", content: "Reply with READY only." }],
          max_tokens: 8,
        }),
      });

      const body = await response.text();
      expect(
        response.ok,
        `Mistral rejected the configured credential with HTTP ${response.status}: ${body.slice(0, 240)}`,
      ).toBe(true);
    },
    30_000,
  );
});
