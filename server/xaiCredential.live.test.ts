import { describe, expect, it } from "vitest";

const runLive = process.env.RUN_XAI_CREDENTIAL_TEST === "1";

describe.runIf(runLive)("xAI credential", () => {
  it("authenticates and exposes at least one Grok model", async () => {
    const apiKey = process.env.XAI_API_KEY;
    expect(apiKey, "XAI_API_KEY must be configured through managed secrets").toBeTruthy();

    const response = await fetch("https://api.x.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });

    expect(response.status).toBe(200);
    const payload = await response.json() as { data?: Array<{ id?: string }> };
    const modelIds = (payload.data ?? []).map(model => model.id ?? "");
    expect(modelIds.some(id => id.toLowerCase().includes("grok"))).toBe(true);
  }, 20_000);
});
