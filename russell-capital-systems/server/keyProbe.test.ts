import { afterEach, describe, expect, it } from "vitest";
import { _resetProbeCacheForTests, _setFetchForTests, probeKeys } from "./keyProbe";
import { _setFetchForTests as _setFredFetch } from "./_core/fred";

afterEach(() => { _setFetchForTests(null); _setFredFetch(null); _resetProbeCacheForTests(); });

const fredOk = () => Promise.resolve({ ok: true, status: 200, json: async () => ({ observations: [{ date: "2026-07-01", value: "320.1" }] }), text: async () => "" });

describe("the key probe", () => {
  it("reports missing, accepted and rejected keys by provider without ever returning a key", async () => {
    _setFetchForTests(async (url, init) => {
      const auth = init.headers.authorization ?? init.headers["x-api-key"] ?? "";
      if (url.includes("anthropic")) return { ok: auth.includes("good"), status: auth.includes("good") ? 200 : 401 };
      if (url.includes("openai")) return { ok: false, status: 401, text: async () => JSON.stringify({ error: { type: "invalid_api_key", message: "Incorrect API key provided: bad-key. You can find your key at platform." } }) };
      return { ok: true, status: 200 };
    });
    _setFredFetch(fredOk);
    const env = { ANTHROPIC_API_KEY: "good-key", OPENAI_API_KEY: "bad-key", RESEND_API_KEY: "r", FRED_API_KEY: "f" } as NodeJS.ProcessEnv;
    const { results } = await probeKeys(env, 1_000);
    const by = Object.fromEntries(results.map((r) => [r.id, r]));
    expect(by.anthropic).toMatchObject({ configured: true, status: "ok", httpStatus: 200 });
    expect(by.openai).toMatchObject({ configured: true, status: "rejected", httpStatus: 401 });
    expect(by.openai!.note).toMatch(/The provider said: invalid_api_key: Incorrect API key provided: \[key\]/);
    expect(by.heygen).toMatchObject({ configured: false, status: "missing" });
    expect(by.resend).toMatchObject({ status: "ok" });
    expect(by.fred).toMatchObject({ configured: true, status: "ok" });
    expect(JSON.stringify(results)).not.toMatch(/good-key|bad-key/);
  });
  it("uses keyless CSV mode for FRED when no key is set, and caches for ten minutes", async () => {
    let calls = 0;
    _setFetchForTests(async () => { calls++; return { ok: true, status: 200 }; });
    _setFredFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => "observation_date,CPIAUCSL\n2026-07-01,320.1\n" }));
    const env = { ANTHROPIC_API_KEY: "k" } as NodeJS.ProcessEnv;
    const a = await probeKeys(env, 1_000);
    expect(a.results.find((r) => r.id === "fred")).toMatchObject({ configured: false, status: "ok" });
    expect(a.results.find((r) => r.id === "fred")!.note).toMatch(/Keyless CSV mode/);
    await probeKeys(env, 2_000);
    expect(calls).toBe(1);
    await probeKeys(env, 1_000 + 11 * 60_000);
    expect(calls).toBe(2);
  });
});
