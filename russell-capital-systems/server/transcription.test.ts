// ============================================================
// Speech to text: Deepgram, AssemblyAI, and the fallback between them.
// Network mocked; no key is real.
// ============================================================
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ASSEMBLYAI_MODELS, DEEPGRAM_MODEL, assemblyaiTranscribe, deepgramTranscribe, sttConfigured, sttOrder, transcribe } from "./transcription";

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };
let calls: Call[] = [];

function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, method: init.method ?? "GET", headers: (init.headers ?? {}) as Record<string, string>, body: init.body });
    return handler(url, init);
  }));
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const AUDIO = Buffer.from([1, 2, 3, 4]);
const DG = { DEEPGRAM_API_KEY: "test-dg-key" } as NodeJS.ProcessEnv;
const AAI = { ASSEMBLYAI_API_KEY: "test-aai-key" } as NodeJS.ProcessEnv;
const deepgramOk = (text: string) => json({ metadata: { duration: 3.2 }, results: { channels: [{ detected_language: "en", alternatives: [{ transcript: text, confidence: 0.98 }] }] } });

beforeEach(() => { calls = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("Deepgram", () => {
  it("posts the raw audio to /v1/listen on nova-3 with a Token header and reads the first alternative", async () => {
    stubFetch(() => deepgramOk("I have a Roth and a 401(k)."));
    const r = await deepgramTranscribe(AUDIO, { env: DG, mimeType: "audio/webm" });
    expect(r).toMatchObject({ text: "I have a Roth and a 401(k).", provider: "deepgram", language: "en", durationSec: 3.2 });
    const c = calls[0]!;
    const u = new URL(c.url);
    expect(u.origin + u.pathname).toBe("https://api.deepgram.com/v1/listen");
    expect(u.searchParams.get("model")).toBe(DEEPGRAM_MODEL);
    expect(u.searchParams.get("smart_format")).toBe("true");
    expect(u.searchParams.get("detect_language")).toBe("true");
    expect(c.method).toBe("POST");
    expect(c.headers.authorization).toBe("Token test-dg-key");
    expect(c.headers["content-type"]).toBe("audio/webm");
  });

  it("passes a language hint instead of detecting", async () => {
    stubFetch(() => deepgramOk("hola"));
    await deepgramTranscribe(AUDIO, { env: DG, language: "es" });
    const u = new URL(calls[0]!.url);
    expect(u.searchParams.get("language")).toBe("es");
    expect(u.searchParams.has("detect_language")).toBe(false);
  });

  it("reports an HTTP failure with its status", async () => {
    stubFetch(() => json({ err_msg: "bad" }, 400));
    await expect(deepgramTranscribe(AUDIO, { env: DG })).rejects.toThrow(/Deepgram transcription failed \(HTTP 400\)/);
  });

  it("says plainly when the key is missing, without calling out", async () => {
    stubFetch(() => deepgramOk("x"));
    await expect(deepgramTranscribe(AUDIO, { env: {} as NodeJS.ProcessEnv })).rejects.toThrow(/Deepgram is not configured: DEEPGRAM_API_KEY is not set/);
    expect(calls).toHaveLength(0);
  });
});

describe("AssemblyAI", () => {
  it("uploads, queues a transcript on the Universal models, and polls until it completes", async () => {
    let polls = 0;
    stubFetch((url) => {
      if (url.endsWith("/v2/upload")) return json({ upload_url: "https://cdn.assemblyai.com/upload/abc" });
      if (url.endsWith("/v2/transcript")) return json({ id: "t-1", status: "queued" });
      polls++;
      return json(polls < 2 ? { id: "t-1", status: "processing" } : { id: "t-1", status: "completed", text: "Hello Thomas.", language_code: "en", audio_duration: 4 });
    });
    const r = await assemblyaiTranscribe(AUDIO, { env: AAI, pollMs: 1 });
    expect(r).toMatchObject({ text: "Hello Thomas.", provider: "assemblyai", language: "en", durationSec: 4 });
    expect(calls.map((c) => `${c.method} ${new URL(c.url).pathname}`)).toEqual(["POST /v2/upload", "POST /v2/transcript", "GET /v2/transcript/t-1", "GET /v2/transcript/t-1"]);
    for (const c of calls) expect(c.headers.authorization).toBe("test-aai-key");
    const job = JSON.parse(String(calls[1]!.body));
    expect(job).toEqual({ audio_url: "https://cdn.assemblyai.com/upload/abc", speech_models: [...ASSEMBLYAI_MODELS], language_detection: true });
  });

  it("surfaces a transcript that ends in error", async () => {
    stubFetch((url) => (url.endsWith("/v2/upload") ? json({ upload_url: "u" }) : url.endsWith("/v2/transcript") ? json({ id: "t-2" }) : json({ status: "error", error: "Audio file is empty" })));
    await expect(assemblyaiTranscribe(AUDIO, { env: AAI, pollMs: 1 })).rejects.toThrow(/AssemblyAI transcription failed: Audio file is empty/);
  });

  it("reports an HTTP failure with its status", async () => {
    stubFetch(() => json({ error: "Authentication error, API token missing/invalid" }, 401));
    await expect(assemblyaiTranscribe(AUDIO, { env: AAI })).rejects.toThrow(/AssemblyAI upload failed \(HTTP 401\)/);
  });

  it("says plainly when the key is missing, without calling out", async () => {
    stubFetch(() => json({}));
    await expect(assemblyaiTranscribe(AUDIO, { env: {} as NodeJS.ProcessEnv })).rejects.toThrow(/AssemblyAI is not configured: ASSEMBLYAI_API_KEY is not set/);
    expect(calls).toHaveLength(0);
  });
});

describe("transcribe()", () => {
  it("orders providers: Deepgram first unless TRANSCRIPTION_PROVIDER=assemblyai, only the keyed ones", () => {
    expect(sttOrder({ ...DG, ...AAI })).toEqual(["deepgram", "assemblyai"]);
    expect(sttOrder({ ...DG, ...AAI, TRANSCRIPTION_PROVIDER: "assemblyai" })).toEqual(["assemblyai", "deepgram"]);
    expect(sttOrder(AAI)).toEqual(["assemblyai"]);
    expect(sttConfigured({} as NodeJS.ProcessEnv)).toEqual({ deepgram: false, assemblyai: false, any: false });
  });

  it("falls back to AssemblyAI when Deepgram fails, and says so", async () => {
    stubFetch((url) => {
      if (url.includes("deepgram.com")) return json({}, 500);
      if (url.endsWith("/v2/upload")) return json({ upload_url: "u" });
      if (url.endsWith("/v2/transcript")) return json({ id: "t-3" });
      return json({ status: "completed", text: "Fallback worked." });
    });
    const r = await transcribe(AUDIO, { env: { ...DG, ...AAI }, pollMs: 1 });
    expect(r.provider).toBe("assemblyai");
    expect(r.text).toBe("Fallback worked.");
    expect(r.fallback).toMatch(/Deepgram transcription failed \(HTTP 500\)/);
  });

  it("refuses clearly when neither key is set", async () => {
    await expect(transcribe(AUDIO, { env: {} as NodeJS.ProcessEnv })).rejects.toThrow(/Transcription is not configured: set DEEPGRAM_API_KEY or ASSEMBLYAI_API_KEY/);
  });
});
