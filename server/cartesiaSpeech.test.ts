// ============================================================
// Cartesia text to speech: the client, the Voice Studio's provider list,
// and the fallback when the active voice fails. Network mocked; no key is
// real.
// ============================================================
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./voiceSettings", async (orig) => {
  const actual = await orig<typeof import("./voiceSettings")>();
  return { ...actual, activeVoice: vi.fn() };
});

import { activeVoice, environmentVoice, providerKeySet } from "./voiceSettings";
import { CARTESIA_DEFAULT_MODEL, CARTESIA_VERSION, _resetCartesiaVoiceCache, cartesiaFallbackVoice, cartesiaSpeak, listCartesiaVoices, synthesize } from "./speech";

type Call = { url: string; method: string; headers: Record<string, string>; body: string };
let calls: Call[] = [];

function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, method: init.method ?? "GET", headers: (init.headers ?? {}) as Record<string, string>, body: typeof init.body === "string" ? init.body : "" });
    return handler(url, init);
  }));
}

const audio = () => new Response(new Uint8Array([0x49, 0x44, 0x33, 1, 2, 3]), { status: 200, headers: { "content-type": "audio/mpeg" } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const ENV = { CARTESIA_API_KEY: "test-cartesia-key" } as NodeJS.ProcessEnv;

beforeEach(() => { calls = []; _resetCartesiaVoiceCache(); vi.mocked(activeVoice).mockReset(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("cartesiaSpeak", () => {
  it("posts the transcript to /tts/bytes with the bearer key, the pinned version and an mp3 format", async () => {
    stubFetch(() => audio());
    const buf = await cartesiaSpeak("voice-123", "Hello, Doctor.", ENV);
    expect(buf.length).toBe(6);
    expect(calls).toHaveLength(1);
    const c = calls[0]!;
    expect(c.url).toBe("https://api.cartesia.ai/tts/bytes");
    expect(c.method).toBe("POST");
    expect(c.headers.authorization).toBe("Bearer test-cartesia-key");
    expect(c.headers["cartesia-version"]).toBe(CARTESIA_VERSION);
    const body = JSON.parse(c.body);
    expect(body).toMatchObject({ model_id: CARTESIA_DEFAULT_MODEL, transcript: "Hello, Doctor.", voice: "voice-123", output_format: { container: "mp3", bit_rate: 128000 } });
  });

  it("honours CARTESIA_MODEL", async () => {
    stubFetch(() => audio());
    await cartesiaSpeak("v", "Hi", { ...ENV, CARTESIA_MODEL: "sonic-3" });
    expect(JSON.parse(calls[0]!.body).model_id).toBe("sonic-3");
  });

  it("reports an HTTP failure with its status", async () => {
    stubFetch(() => json({ error: "bad voice" }, 400));
    await expect(cartesiaSpeak("v", "Hi", ENV)).rejects.toThrow(/Cartesia speech failed \(HTTP 400\)/);
  });

  it("says plainly when the key is missing, without calling out", async () => {
    stubFetch(() => audio());
    await expect(cartesiaSpeak("v", "Hi", {} as NodeJS.ProcessEnv)).rejects.toThrow(/Cartesia is not configured: CARTESIA_API_KEY is not set/);
    await expect(listCartesiaVoices({}, {} as NodeJS.ProcessEnv)).rejects.toThrow(/not configured/);
    expect(calls).toHaveLength(0);
  });
});

describe("Cartesia voices", () => {
  it("lists the workspace's own voices with is_owner", async () => {
    stubFetch(() => json({ data: [{ id: "own-1", name: "Sam", language: "en", is_owner: true }], has_more: false }));
    const v = await listCartesiaVoices({ owned: true, limit: 10 }, ENV);
    expect(v.map((x) => x.id)).toEqual(["own-1"]);
    expect(calls[0]!.url).toBe("https://api.cartesia.ai/voices?limit=10&is_owner=true");
  });

  it("the fallback voice is CARTESIA_VOICE_ID, else an owned voice, else an English stock voice", async () => {
    expect(await cartesiaFallbackVoice({ ...ENV, CARTESIA_VOICE_ID: "set-id" })).toEqual({ provider: "cartesia", voiceId: "set-id" });
    stubFetch((url) => (url.includes("is_owner") ? json({ data: [] }) : json({ data: [{ id: "fr-1", name: "Amélie", language: "fr" }, { id: "en-1", name: "Skylar", language: "en" }] })));
    expect(await cartesiaFallbackVoice(ENV)).toEqual({ provider: "cartesia", voiceId: "en-1", name: "Skylar" });
    expect(await cartesiaFallbackVoice({} as NodeJS.ProcessEnv)).toBeNull();
  });
});

describe("the site's voice", () => {
  it("VOICE_PROVIDER=cartesia selects Cartesia; without it Cartesia is used only when nothing else is keyed", async () => {
    expect(await environmentVoice({ ...ENV, VOICE_PROVIDER: "cartesia", CARTESIA_VOICE_ID: "c1", ELEVENLABS_API_KEY: "e", ELEVENLABS_VOICE_ID: "e1" })).toEqual({ provider: "cartesia", voiceId: "c1" });
    expect(await environmentVoice({ ...ENV, CARTESIA_VOICE_ID: "c1", ELEVENLABS_API_KEY: "e", ELEVENLABS_VOICE_ID: "e1" })).toEqual({ provider: "elevenlabs", voiceId: "e1" });
    expect(await environmentVoice({ ...ENV, CARTESIA_VOICE_ID: "c1" })).toEqual({ provider: "cartesia", voiceId: "c1" });
    expect(providerKeySet("cartesia", ENV)).toBe(true);
    expect(providerKeySet("cartesia", {} as NodeJS.ProcessEnv)).toBe(false);
  });

  it("when ElevenLabs fails, Cartesia speaks the line and the result says why", async () => {
    vi.mocked(activeVoice).mockResolvedValue({ provider: "elevenlabs", voiceId: "e1" });
    stubFetch((url) => (url.includes("elevenlabs.io") ? new Response("quota", { status: 401 }) : audio()));
    const r = await synthesize("Good morning.", { ...ENV, ELEVENLABS_API_KEY: "e", ELEVENLABS_VOICE_ID: "e1", CARTESIA_VOICE_ID: "c1" });
    expect(r?.via).toBe("cartesia");
    expect(r?.voiceId).toBe("c1");
    expect(r?.fallback).toMatch(/ElevenLabs speech failed \(HTTP 401\)/);
  });

  it("when HeyGen fails, ElevenLabs is tried before Cartesia", async () => {
    vi.mocked(activeVoice).mockResolvedValue({ provider: "heygen", voiceId: "h1" });
    stubFetch((url) => (url.includes("heygen.com") ? json({ error: "nope" }, 500) : audio()));
    const r = await synthesize("Hello.", { ...ENV, HEYGEN_API_KEY: "h", ELEVENLABS_API_KEY: "e", ELEVENLABS_VOICE_ID: "e1", CARTESIA_VOICE_ID: "c1" });
    expect(r?.via).toBe("elevenlabs");
  });

  it("when every provider fails, the original error is thrown", async () => {
    vi.mocked(activeVoice).mockResolvedValue({ provider: "elevenlabs", voiceId: "e1" });
    stubFetch(() => new Response("down", { status: 503 }));
    await expect(synthesize("Hello.", { ...ENV, ELEVENLABS_API_KEY: "e", ELEVENLABS_VOICE_ID: "e1", CARTESIA_VOICE_ID: "c1" })).rejects.toThrow(/ElevenLabs speech failed \(HTTP 503\)/);
  });
});
