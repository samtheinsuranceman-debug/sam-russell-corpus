// ============================================================
// The Brain Hub's Railway key test, extended to the media and data
// services, and Portkey as a brain. Network mocked; no key is real.
// ============================================================
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEDIA_SERVICES, mediaFromEnvironment, testMediaKeys } from "./mediaKeys";
import { INTEGRATIONS } from "./integrations";
import { getProvider, isBannedModel } from "@shared/aiProviders";
import { callProvider } from "./aiProviderAdapters";
import { environmentKeyNames } from "./providerRegistry";

type Call = { url: string; method: string; headers: Record<string, string>; body: string };
let calls: Call[] = [];

function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, method: init.method ?? "GET", headers: (init.headers ?? {}) as Record<string, string>, body: typeof init.body === "string" ? init.body : "" });
    return handler(url, init);
  }));
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => { calls = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("media keys on the host", () => {
  it("lists only the keyed services, by the variable that keyed them (official names first)", () => {
    const env = { CARTESIA_API_KEY: "a", RUNWAY_API_KEY: "b", LUMAAI_API_KEY: "c", LUMA_API_KEY: "d" } as NodeJS.ProcessEnv;
    expect(mediaFromEnvironment(env)).toEqual([
      { id: "cartesia", name: "Cartesia (text to speech)", envName: "CARTESIA_API_KEY" },
      { id: "runway", name: "Runway (video)", envName: "RUNWAY_API_KEY" },
      { id: "luma", name: "Luma AI (video)", envName: "LUMAAI_API_KEY" },
    ]);
  });

  it("makes one cheap call per keyed service and reports accepted, refused and unreachable without the key", async () => {
    stubFetch((url) => {
      if (url.includes("deepgram")) return json({ err_code: "INVALID_AUTH" }, 401);
      if (url.includes("pinecone")) throw new Error("getaddrinfo ENOTFOUND");
      return json({ ok: true });
    });
    const env = { CARTESIA_API_KEY: "secret-cartesia", DEEPGRAM_API_KEY: "secret-dg", PINECONE_API_KEY: "secret-pc", VOYAGE_API_KEY: "secret-vo" } as NodeJS.ProcessEnv;
    const r = await testMediaKeys(env);
    expect(r.map((x) => [x.providerId, x.ok])).toEqual([["cartesia", true], ["deepgram", false], ["voyage", true], ["pinecone", false]]);
    expect(r.find((x) => x.providerId === "deepgram")!.message).toMatch(/Refused the key \(HTTP 401\)/);
    expect(r.find((x) => x.providerId === "pinecone")!.message).toMatch(/Could not reach/);
    expect(JSON.stringify(r)).not.toMatch(/secret-/);
    expect(calls.find((c) => c.url.includes("deepgram"))!.headers.authorization).toBe("Token secret-dg");
    expect(calls.find((c) => c.url.includes("voyageai"))!.method).toBe("POST");
    expect(await testMediaKeys({} as NodeJS.ProcessEnv)).toEqual([]);
  });

  it("every service is on the integrations status list", () => {
    const ids = new Set(INTEGRATIONS.map((i) => i.id));
    for (const s of MEDIA_SERVICES) expect(ids.has(s.id), s.id).toBe(true);
    expect(ids.has("portkey")).toBe(true);
  });
});

describe("Portkey as a brain", () => {
  it("is catalogued with its Railway name and non-China defaults", () => {
    const p = getProvider("portkey")!;
    expect(p.baseUrl).toBe("https://api.portkey.ai");
    expect(environmentKeyNames("portkey")).toContain("PORTKEY_API_KEY");
    for (const m of p.suggestedModels) expect(isBannedModel(m), m).toBe(false);
  });

  it("sends the key in x-portkey-api-key and no bearer token", async () => {
    stubFetch(() => json({ model: "gpt-5", choices: [{ message: { content: "connected" } }], usage: { prompt_tokens: 3, completion_tokens: 1 } }));
    const r = await callProvider({ provider: getProvider("portkey")!, apiKey: "test-portkey-key", model: "@openai/gpt-5", messages: [{ role: "user", content: "ping" }] });
    expect(r.text).toBe("connected");
    const c = calls[0]!;
    expect(c.url).toBe("https://api.portkey.ai/v1/chat/completions");
    expect(c.headers["x-portkey-api-key"]).toBe("test-portkey-key");
    expect(c.headers.authorization).toBeUndefined();
    expect(JSON.parse(c.body).model).toBe("@openai/gpt-5");
  });

  it("other providers still get a bearer token", async () => {
    stubFetch(() => json({ model: "sonar-pro", choices: [{ message: { content: "ok" } }] }));
    await callProvider({ provider: getProvider("perplexity")!, apiKey: "test-pplx", model: "sonar-pro", messages: [{ role: "user", content: "ping" }] });
    expect(calls[0]!.headers.authorization).toBe("Bearer test-pplx");
  });
});
