// ============================================================
// Generative video: the Runway and Luma clients and the owner router's
// guard. Network mocked; no key is real.
// ============================================================
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHINA_POLICY_MESSAGE } from "@shared/aiProviders";
import { RUNWAY_VERSION, createVideo, lumaBody, lumaCreate, lumaJob, runwayBody, runwayCreate, runwayJob, videoGenConfigured } from "./videoGen";
import { videoGenRouter } from "./videoGenRouter";
import { ownerOpenId } from "./_core/ownerLogin";

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

const RW = { RUNWAYML_API_SECRET: "test-runway-key" } as NodeJS.ProcessEnv;
const LU = { LUMAAI_API_KEY: "test-luma-key" } as NodeJS.ProcessEnv;

beforeEach(() => { calls = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("Runway", () => {
  it("text to video: POST /v1/text_to_video with the bearer key and the pinned version", async () => {
    stubFetch(() => json({ id: "task-1", estimatedCost: { credits: 50 } }));
    const job = await runwayCreate({ prompt: "A calm harbour at dawn" }, RW);
    expect(job).toEqual({ provider: "runway", id: "task-1", status: "queued", videoUrl: null, error: null });
    const c = calls[0]!;
    expect(c.url).toBe("https://api.dev.runwayml.com/v1/text_to_video");
    expect(c.headers.authorization).toBe("Bearer test-runway-key");
    expect(c.headers["x-runway-version"]).toBe(RUNWAY_VERSION);
    expect(JSON.parse(c.body)).toEqual({ model: "gen4.5", promptText: "A calm harbour at dawn", ratio: "1280:720", duration: 5 });
  });

  it("image to video: POST /v1/image_to_video with promptImage; RUNWAY_API_KEY also works", async () => {
    stubFetch(() => json({ id: "task-2" }));
    await runwayCreate({ prompt: "Slow push in", imageUrl: "https://example.com/still.jpg", model: "gen4_turbo", aspect: "portrait", durationSec: 10 }, { RUNWAY_API_KEY: "alt-key" } as NodeJS.ProcessEnv);
    expect(calls[0]!.url).toBe("https://api.dev.runwayml.com/v1/image_to_video");
    expect(calls[0]!.headers.authorization).toBe("Bearer alt-key");
    expect(JSON.parse(calls[0]!.body)).toEqual({ model: "gen4_turbo", promptText: "Slow push in", ratio: "720:1280", duration: 10, promptImage: "https://example.com/still.jpg" });
  });

  it("keeps each model inside its duration rules", () => {
    expect(runwayBody({ prompt: "x", durationSec: 30 }, "gen4.5").duration).toBe(10);
    expect(runwayBody({ prompt: "x", durationSec: 5 }, "veo3.1").duration).toBe(8);
    expect(runwayBody({ prompt: "x", durationSec: 6 }, "veo3.1_fast").duration).toBe(6);
  });

  it("refuses China-linked and unlisted models before calling out", async () => {
    stubFetch(() => json({ id: "never" }));
    await expect(runwayCreate({ prompt: "x", model: "hailuo3" }, RW)).rejects.toThrow(CHINA_POLICY_MESSAGE);
    await expect(runwayCreate({ prompt: "x", model: "seedance2" }, RW)).rejects.toThrow(CHINA_POLICY_MESSAGE);
    await expect(runwayCreate({ prompt: "x", model: "wan3" }, RW)).rejects.toThrow(CHINA_POLICY_MESSAGE);
    await expect(runwayCreate({ prompt: "x", model: "some_new_model" }, RW)).rejects.toThrow(/not offered here/);
    expect(calls).toHaveLength(0);
  });

  it("reads a task: SUCCEEDED gives the first output URL; FAILED gives the reason", async () => {
    stubFetch((url) => (url.endsWith("/ok") ? json({ id: "ok", status: "SUCCEEDED", output: ["https://cdn.example.com/v.mp4"] }) : json({ id: "bad", status: "FAILED", failure: "Content moderation" })));
    expect(await runwayJob("ok", RW)).toMatchObject({ status: "succeeded", videoUrl: "https://cdn.example.com/v.mp4" });
    expect(await runwayJob("bad", RW)).toMatchObject({ status: "failed", error: "Content moderation" });
    expect(calls[0]!.url).toBe("https://api.dev.runwayml.com/v1/tasks/ok");
  });

  it("reports an HTTP failure with its status and message", async () => {
    stubFetch(() => json({ error: "Not enough credits" }, 400));
    await expect(runwayCreate({ prompt: "x" }, RW)).rejects.toThrow(/Runway failed \(HTTP 400\): Not enough credits/);
  });

  it("says plainly when the key is missing", async () => {
    stubFetch(() => json({}));
    await expect(runwayCreate({ prompt: "x" }, {} as NodeJS.ProcessEnv)).rejects.toThrow(/Runway is not configured: set RUNWAYML_API_SECRET/);
    expect(calls).toHaveLength(0);
  });
});

describe("Luma", () => {
  it("creates on /generations/video with ray-2, and an image as keyframe frame0", async () => {
    stubFetch(() => json({ id: "gen-1", state: "queued" }));
    const job = await lumaCreate({ prompt: "Sunrise over farmland", imageUrl: "https://example.com/a.jpg", durationSec: 9 }, LU);
    expect(job).toEqual({ provider: "luma", id: "gen-1", status: "queued", videoUrl: null, error: null });
    expect(calls[0]!.url).toBe("https://api.lumalabs.ai/dream-machine/v1/generations/video");
    expect(calls[0]!.headers.authorization).toBe("Bearer test-luma-key");
    expect(JSON.parse(calls[0]!.body)).toEqual({ model: "ray-2", prompt: "Sunrise over farmland", aspect_ratio: "16:9", duration: "9s", resolution: "720p", keyframes: { frame0: { type: "image", url: "https://example.com/a.jpg" } } });
    expect(lumaBody({ prompt: "x", aspect: "portrait" }, "ray-flash-2")).toMatchObject({ aspect_ratio: "9:16", duration: "5s" });
  });

  it("reads a generation: completed gives the video asset; failed gives the reason", async () => {
    stubFetch((url) => (url.endsWith("/g1") ? json({ id: "g1", state: "completed", assets: { video: "https://storage.example.com/g1.mp4" } }) : json({ id: "g2", state: "failed", failure_reason: "prompt rejected" })));
    expect(await lumaJob("g1", LU)).toMatchObject({ status: "succeeded", videoUrl: "https://storage.example.com/g1.mp4" });
    expect(await lumaJob("g2", LU)).toMatchObject({ status: "failed", error: "prompt rejected" });
  });

  it("reports an HTTP failure, refuses unlisted models, and says plainly when the key is missing (LUMA_API_KEY also works)", async () => {
    stubFetch(() => json({ detail: "Insufficient credits" }, 402));
    await expect(lumaCreate({ prompt: "x" }, { LUMA_API_KEY: "alt" } as NodeJS.ProcessEnv)).rejects.toThrow(/Luma failed \(HTTP 402\): Insufficient credits/);
    await expect(lumaCreate({ prompt: "x", model: "kling-v2.1" }, LU)).rejects.toThrow(CHINA_POLICY_MESSAGE);
    await expect(createVideo("luma", { prompt: "x" }, {} as NodeJS.ProcessEnv)).rejects.toThrow(/Luma is not configured: set LUMAAI_API_KEY/);
    expect(videoGenConfigured({ LUMA_API_KEY: "a", RUNWAYML_API_SECRET: "b" } as NodeJS.ProcessEnv)).toEqual({ runway: true, luma: true });
  });
});

describe("the videoGen router", () => {
  const caller = (user: { role?: string; email?: string | null; openId?: string }) =>
    videoGenRouter.createCaller({ user: { id: 1, openId: "o", name: "U", role: "user", email: null, ...user }, req: {} as never, res: {} as never } as never);

  it("is closed to anyone but the owner's own session: every job is billed", async () => {
    vi.stubEnv("OWNER_EMAIL", "owner@example.com");
    try {
      await expect(caller({ role: "user", email: "someone@example.com" }).status()).rejects.toThrow(/for the site owner/);
      // an admin is not the owner, and the owner's email without the owner's session proves nothing
      await expect(caller({ role: "admin", email: "admin@example.com" }).status()).rejects.toThrow(/for the site owner/);
      await expect(caller({ role: "admin", email: "owner@example.com", openId: "someone-else" }).status()).rejects.toThrow(/for the site owner/);
      const s = await caller({ role: "admin", email: "owner@example.com", openId: ownerOpenId() }).status();
      expect(s.models.runway.text).toContain("gen4.5");
      expect(s.models.luma).toContain("ray-2");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
