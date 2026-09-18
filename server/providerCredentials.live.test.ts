import { describe, expect, it } from "vitest";

const runLive = process.env.RUN_PROVIDER_CREDENTIAL_TESTS === "1";

async function expectOk(response: Response, provider: string) {
  expect(response.status, `${provider} credential check returned HTTP ${response.status}`).toBe(200);
}

describe.runIf(runLive)("provider credentials", () => {
  it("validates xAI and exposes a Grok model", async () => {
    const apiKey = process.env.XAI_API_KEY;
    expect(apiKey, "XAI_API_KEY must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://api.x.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "xAI");
    const payload = await response.json() as { data?: Array<{ id?: string }> };
    expect((payload.data ?? []).some(model => model.id?.toLowerCase().includes("grok"))).toBe(true);
  }, 20_000);

  it("validates Anthropic and exposes a Claude model", async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    expect(apiKey, "ANTHROPIC_API_KEY must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://api.anthropic.com/v1/models?limit=20", {
      headers: {
        "x-api-key": String(apiKey),
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "Anthropic");
    const payload = await response.json() as { data?: Array<{ id?: string }> };
    expect((payload.data ?? []).some(model => model.id?.toLowerCase().includes("claude"))).toBe(true);
  }, 20_000);

  it("validates Perplexity with a minimal Sonar completion", async () => {
    const apiKey = process.env.SONAR_API_KEY;
    expect(apiKey, "SONAR_API_KEY must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: "Reply with exactly: connected" }],
        max_tokens: 8,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    await expectOk(response, "Perplexity");
    const payload = await response.json() as { choices?: unknown[] };
    expect((payload.choices ?? []).length).toBeGreaterThan(0);
  }, 35_000);

  it("validates Gemini and exposes a Gemini model", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey, "GEMINI_API_KEY must be configured through managed secrets").toBeTruthy();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(String(apiKey))}&pageSize=20`, {
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "Gemini");
    const payload = await response.json() as { models?: Array<{ name?: string }> };
    expect((payload.models ?? []).some(model => model.name?.toLowerCase().includes("gemini"))).toBe(true);
  }, 20_000);

  it("validates OpenRouter account-key access", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    expect(apiKey, "OPENROUTER_API_KEY must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "OpenRouter");
    const payload = await response.json() as { data?: Record<string, unknown> };
    expect(payload.data).toBeTruthy();
  }, 20_000);

  it("validates OpenAI and exposes an OpenAI model", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey, "OPENAI_API_KEY must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "OpenAI");
    const payload = await response.json() as { data?: Array<{ id?: string }> };
    expect((payload.data ?? []).length).toBeGreaterThan(0);
  }, 20_000);

  it("validates Cohere and exposes a model", async () => {
    const apiKey = process.env.COHERE_API_KEY;
    expect(apiKey, "COHERE_API_KEY must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://api.cohere.com/v2/models?page_size=20", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "Cohere");
    const payload = await response.json() as { models?: unknown[] };
    expect((payload.models ?? []).length).toBeGreaterThan(0);
  }, 20_000);

  it("validates Mistral/Le Chat and exposes a model", async () => {
    const apiKey = process.env.MISTRAL_API_KEY;
    expect(apiKey, "MISTRAL_API_KEY must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "Mistral");
    const payload = await response.json() as { data?: unknown[] };
    expect((payload.data ?? []).length).toBeGreaterThan(0);
  }, 20_000);

  it("validates the Cloudflare API token read-only", async () => {
    const apiKey = process.env.CLOUDFLARE_API_TOKEN;
    expect(apiKey, "CLOUDFLARE_API_TOKEN must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "Cloudflare");
    const payload = await response.json() as { success?: boolean; result?: { status?: string } };
    expect(payload.success).toBe(true);
    expect(payload.result?.status).toBe("active");
  }, 20_000);

  it("validates the GitHub token read-only", async () => {
    const apiKey = process.env.GITHUB_TOKEN;
    expect(apiKey, "GITHUB_TOKEN must be configured through managed secrets").toBeTruthy();
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "russell-capital-credential-check",
      },
      signal: AbortSignal.timeout(15_000),
    });
    await expectOk(response, "GitHub");
    const payload = await response.json() as { login?: string };
    expect(payload.login).toBeTruthy();
  }, 20_000);
});
