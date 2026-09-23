/**
 * IBM watsonx.ai — the IAM token exchange, the token cache, the project id
 * and the text/chat request shape. Network mocked; no key is real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProvider } from "@shared/aiProviders";
import { IBM_IAM_TOKEN_URL, callProvider, clearWatsonxTokenCache, splitWatsonxKey } from "./aiProviderAdapters";

const watsonx = getProvider("watsonx")!;
const messages = [
  { role: "system" as const, content: "Be brief." },
  { role: "user" as const, content: "hi" },
];

type Call = { url: string; init: RequestInit };
let calls: Call[];
let saved: NodeJS.ProcessEnv;

function stubFetch(chat: () => Response = () => okChat()) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    if (String(url) === IBM_IAM_TOKEN_URL) {
      return new Response(JSON.stringify({ access_token: "iam-token-1", token_type: "Bearer", expires_in: 3600, expiration: Math.floor(Date.now() / 1000) + 3600 }), { status: 200 });
    }
    return chat();
  }));
}

function okChat() {
  return new Response(JSON.stringify({
    model_id: "ibm/granite-4-h-small",
    choices: [{ index: 0, message: { role: "assistant", content: "connected" }, finish_reason: "stop" }],
    usage: { prompt_tokens: 12, completion_tokens: 1, total_tokens: 13 },
  }), { status: 200 });
}

beforeEach(() => {
  calls = [];
  saved = { ...process.env };
  delete process.env.WATSONX_URL;
  process.env.WATSONX_PROJECT_ID = "11111111-2222-3333-4444-555555555555";
  clearWatsonxTokenCache();
});
afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
});

describe("IBM watsonx.ai adapter", () => {
  it("trades the API key for an IAM token, then posts text/chat with the project id", async () => {
    stubFetch();
    const r = await callProvider({ provider: watsonx, apiKey: "k".repeat(44), model: watsonx.defaultModel, messages, maxTokens: 16, temperature: 0 });

    expect(calls[0].url).toBe("https://iam.cloud.ibm.com/identity/token");
    const form = new URLSearchParams(String(calls[0].init.body));
    expect(form.get("grant_type")).toBe("urn:ibm:params:oauth:grant-type:apikey");
    expect(form.get("apikey")).toBe("k".repeat(44));

    expect(calls[1].url).toBe("https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2024-10-08");
    expect((calls[1].init.headers as Record<string, string>).authorization).toBe("Bearer iam-token-1");
    expect(JSON.parse(String(calls[1].init.body))).toEqual({
      model_id: "ibm/granite-4-h-small",
      project_id: "11111111-2222-3333-4444-555555555555",
      messages: [{ role: "system", content: "Be brief." }, { role: "user", content: "hi" }],
      max_tokens: 16,
      temperature: 0,
    });
    expect(r).toMatchObject({ text: "connected", model: "ibm/granite-4-h-small", providerId: "watsonx", usage: { totalTokens: 13 } });
  });

  it("reuses the token until shortly before it expires", async () => {
    stubFetch();
    const o = { provider: watsonx, apiKey: "k".repeat(44), model: watsonx.defaultModel, messages };
    await callProvider(o);
    await callProvider(o);
    expect(calls.filter(c => c.url === IBM_IAM_TOKEN_URL)).toHaveLength(1);
    expect(calls).toHaveLength(3);
  });

  it("drops a token the chat endpoint refuses, and reports the key as the problem", async () => {
    stubFetch(() => new Response("{}", { status: 401 }));
    const o = { provider: watsonx, apiKey: "k".repeat(44), model: watsonx.defaultModel, messages };
    await expect(callProvider(o)).rejects.toMatchObject({ kind: "auth" });
    await expect(callProvider(o)).rejects.toMatchObject({ kind: "auth" });
    expect(calls.filter(c => c.url === IBM_IAM_TOKEN_URL)).toHaveLength(2);
  });

  it("reads an IAM 400 (unknown key) as an auth failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ errorCode: "BXNIM0415E" }), { status: 400 })));
    await expect(callProvider({ provider: watsonx, apiKey: "bad".repeat(15), model: watsonx.defaultModel, messages })).rejects.toMatchObject({ kind: "auth" });
  });

  it("takes the project from <key>:<project id>, and says so when there is none", async () => {
    expect(splitWatsonxKey("abc:proj-1", {})).toEqual({ apiKey: "abc", projectId: "proj-1" });
    expect(splitWatsonxKey("abc", { WATSONX_PROJECT_ID: "proj-2" })).toEqual({ apiKey: "abc", projectId: "proj-2" });
    delete process.env.WATSONX_PROJECT_ID;
    stubFetch();
    await expect(callProvider({ provider: watsonx, apiKey: "k".repeat(44), model: watsonx.defaultModel, messages })).rejects.toMatchObject({
      kind: "bad_request",
      userMessage: expect.stringContaining("WATSONX_PROJECT_ID"),
    });
    expect(calls).toEqual([]);
  });

  it("uses WATSONX_URL for the region", async () => {
    process.env.WATSONX_URL = "https://eu-de.ml.cloud.ibm.com/";
    stubFetch();
    await callProvider({ provider: watsonx, apiKey: `${"k".repeat(44)}:proj-9`, model: "meta-llama/llama-3-3-70b-instruct", messages });
    expect(calls[1].url).toBe("https://eu-de.ml.cloud.ibm.com/ml/v1/text/chat?version=2024-10-08");
    expect(JSON.parse(String(calls[1].init.body)).project_id).toBe("proj-9");
  });
});

describe("watsonx from the environment", () => {
  it("is keyed by WATSONX_API_KEY, IBM_CLOUD_API_KEY or WATSONX_APIKEY, with WATSONX_URL as its base", async () => {
    const { environmentCredentials } = await import("./providerRegistry");
    for (const name of ["WATSONX_API_KEY", "IBM_CLOUD_API_KEY", "WATSONX_APIKEY"]) {
      delete process.env.RCS_BRAIN_WATSONX_API_KEY;
      delete process.env.WATSONX_API_KEY;
      delete process.env.IBM_CLOUD_API_KEY;
      delete process.env.WATSONX_APIKEY;
      process.env[name] = "k".repeat(44);
      process.env.WATSONX_URL = "https://eu-gb.ml.cloud.ibm.com";
      const c = environmentCredentials().find(x => x.providerId === "watsonx");
      expect(c, name).toMatchObject({ model: "ibm/granite-4-h-small", baseUrlOverride: "https://eu-gb.ml.cloud.ibm.com" });
    }
  });

  it("will not load a China-linked region URL", async () => {
    const { environmentCredentials } = await import("./providerRegistry");
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.env.WATSONX_API_KEY = "k".repeat(44);
    process.env.WATSONX_URL = "https://ml.example.cn";
    expect(environmentCredentials().map(c => c.providerId)).not.toContain("watsonx");
    spy.mockRestore();
  });
});
