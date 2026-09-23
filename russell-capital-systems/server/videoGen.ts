// ============================================================
// GENERATIVE VIDEO — Runway and Luma, one shape for both.
//
// HeyGen (heygenService.ts) makes the avatar videos; these two make
// footage from a prompt, or from a still image and a prompt, for the
// owner's own use. Both are asynchronous: create returns a job id, and
// the job is polled until it has a video URL (Runway's expire in 24–48
// hours, so the caller downloads what it keeps).
//
//   runway  RUNWAYML_API_SECRET (the official SDK's name) or RUNWAY_API_KEY
//           https://api.dev.runwayml.com, X-Runway-Version 2024-11-06
//           POST /v1/text_to_video, POST /v1/image_to_video, GET /v1/tasks/{id}
//   luma    LUMAAI_API_KEY (the official SDK's name) or LUMA_API_KEY
//           https://api.lumalabs.ai/dream-machine/v1
//           POST /generations/video, GET /generations/{id}
//
// Both hosts resell other labs' models, some of them Chinese (MiniMax
// Hailuo, ByteDance Seedance, Alibaba Wan on Runway). Only the models
// listed here can be asked for, and each id also passes isBannedModel.
// ============================================================
import { assertModelAllowed } from "@shared/aiProviders";

export type VideoProvider = "runway" | "luma";
export type VideoJobStatus = "queued" | "running" | "succeeded" | "failed";
export type VideoJob = { provider: VideoProvider; id: string; status: VideoJobStatus; videoUrl: string | null; error: string | null };
export type VideoRequest = { prompt: string; imageUrl?: string; model?: string; aspect?: "landscape" | "portrait"; durationSec?: number };

const RUNWAY = "https://api.dev.runwayml.com";
export const RUNWAY_VERSION = "2024-11-06";
const LUMA = "https://api.lumalabs.ai/dream-machine/v1";

/** Runway's own models and Google's Veo, as the API names them. */
export const RUNWAY_TEXT_MODELS = ["gen4.5", "veo3.1", "veo3.1_fast"] as const;
export const RUNWAY_IMAGE_MODELS = ["gen4.5", "gen4_turbo", "veo3.1", "veo3.1_fast"] as const;
export const LUMA_MODELS = ["ray-2", "ray-flash-2"] as const;

export function runwayKey(env: NodeJS.ProcessEnv = process.env): string | null {
  return env.RUNWAYML_API_SECRET?.trim() || env.RUNWAY_API_KEY?.trim() || null;
}

export function lumaKey(env: NodeJS.ProcessEnv = process.env): string | null {
  return env.LUMAAI_API_KEY?.trim() || env.LUMA_API_KEY?.trim() || null;
}

export function videoGenConfigured(env: NodeJS.ProcessEnv = process.env): Record<VideoProvider, boolean> {
  return { runway: Boolean(runwayKey(env)), luma: Boolean(lumaKey(env)) };
}

function pickModel(requested: string | undefined, allowed: readonly string[], fallback: string, where: string): string {
  const model = (requested ?? "").trim() || fallback;
  assertModelAllowed(model, where);
  if (!allowed.includes(model)) throw new Error(`${where}: "${model}" is not offered here (choose one of ${allowed.join(", ")})`);
  return model;
}

async function failure(res: Response, who: string): Promise<Error> {
  let detail = "";
  try {
    const j = (await res.json()) as { error?: string | { message?: string }; detail?: string; message?: string };
    detail = typeof j.error === "string" ? j.error : j.error?.message ?? j.detail ?? j.message ?? "";
  } catch { /* not JSON */ }
  return new Error(`${who} failed (HTTP ${res.status})${detail ? `: ${String(detail).slice(0, 160)}` : ""}`);
}

// ─── Runway ───────────────────────────────────────────────────────────────

function runwayHeaders(env: NodeJS.ProcessEnv): Record<string, string> {
  const key = runwayKey(env);
  if (!key) throw new Error("Runway is not configured: set RUNWAYML_API_SECRET (or RUNWAY_API_KEY)");
  return { authorization: `Bearer ${key}`, "x-runway-version": RUNWAY_VERSION, "content-type": "application/json" };
}

/** Runway's ratio and duration rules differ per model; this keeps a request inside them. */
export function runwayBody(req: VideoRequest, model: string): Record<string, unknown> {
  const veo = model.startsWith("veo");
  const ratio = req.aspect === "portrait" ? "720:1280" : "1280:720";
  const body: Record<string, unknown> = { model, promptText: req.prompt.slice(0, 1000), ratio };
  if (veo) body.duration = [4, 6, 8].includes(req.durationSec ?? 0) ? req.durationSec : 8;
  else if (model === "gen4_turbo") body.duration = req.durationSec === 10 ? 10 : 5;
  else body.duration = Math.min(10, Math.max(2, Math.round(req.durationSec ?? 5)));
  if (req.imageUrl) body.promptImage = req.imageUrl;
  return body;
}

export async function runwayCreate(req: VideoRequest, env: NodeJS.ProcessEnv = process.env): Promise<VideoJob> {
  const headers = runwayHeaders(env);
  const model = req.imageUrl
    ? pickModel(req.model, RUNWAY_IMAGE_MODELS, "gen4.5", "Runway image-to-video")
    : pickModel(req.model, RUNWAY_TEXT_MODELS, "gen4.5", "Runway text-to-video");
  const path = req.imageUrl ? "/v1/image_to_video" : "/v1/text_to_video";
  const res = await fetch(`${RUNWAY}${path}`, { method: "POST", headers, body: JSON.stringify(runwayBody(req, model)), signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw await failure(res, "Runway");
  const { id } = (await res.json()) as { id?: string };
  if (!id) throw new Error("Runway returned no task id");
  return { provider: "runway", id, status: "queued", videoUrl: null, error: null };
}

export async function runwayJob(id: string, env: NodeJS.ProcessEnv = process.env): Promise<VideoJob> {
  const res = await fetch(`${RUNWAY}/v1/tasks/${encodeURIComponent(id)}`, { headers: runwayHeaders(env), signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw await failure(res, "Runway task lookup");
  const t = (await res.json()) as { status?: string; output?: string[]; failure?: string };
  const status: VideoJobStatus =
    t.status === "SUCCEEDED" ? "succeeded" : t.status === "FAILED" || t.status === "CANCELLED" ? "failed" : t.status === "RUNNING" ? "running" : "queued";
  return { provider: "runway", id, status, videoUrl: t.output?.[0] ?? null, error: status === "failed" ? (t.failure ?? t.status ?? "failed").slice(0, 200) : null };
}

// ─── Luma ─────────────────────────────────────────────────────────────────

function lumaHeaders(env: NodeJS.ProcessEnv): Record<string, string> {
  const key = lumaKey(env);
  if (!key) throw new Error("Luma is not configured: set LUMAAI_API_KEY (or LUMA_API_KEY)");
  return { authorization: `Bearer ${key}`, "content-type": "application/json" };
}

export function lumaBody(req: VideoRequest, model: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    prompt: req.prompt.slice(0, 2000),
    aspect_ratio: req.aspect === "portrait" ? "9:16" : "16:9",
    duration: (req.durationSec ?? 5) > 5 ? "9s" : "5s",
    resolution: "720p",
  };
  if (req.imageUrl) body.keyframes = { frame0: { type: "image", url: req.imageUrl } };
  return body;
}

export async function lumaCreate(req: VideoRequest, env: NodeJS.ProcessEnv = process.env): Promise<VideoJob> {
  const headers = lumaHeaders(env);
  const model = pickModel(req.model, LUMA_MODELS, "ray-2", "Luma video");
  const res = await fetch(`${LUMA}/generations/video`, { method: "POST", headers, body: JSON.stringify(lumaBody(req, model)), signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw await failure(res, "Luma");
  return lumaJobFrom((await res.json()) as LumaGeneration);
}

type LumaGeneration = { id?: string; state?: string; failure_reason?: string | null; assets?: { video?: string | null } | null };

function lumaJobFrom(g: LumaGeneration): VideoJob {
  if (!g.id) throw new Error("Luma returned no generation id");
  const status: VideoJobStatus = g.state === "completed" ? "succeeded" : g.state === "failed" ? "failed" : g.state === "dreaming" ? "running" : "queued";
  return { provider: "luma", id: g.id, status, videoUrl: g.assets?.video ?? null, error: status === "failed" ? (g.failure_reason ?? "failed").slice(0, 200) : null };
}

export async function lumaJob(id: string, env: NodeJS.ProcessEnv = process.env): Promise<VideoJob> {
  const res = await fetch(`${LUMA}/generations/${encodeURIComponent(id)}`, { headers: lumaHeaders(env), signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw await failure(res, "Luma generation lookup");
  return lumaJobFrom((await res.json()) as LumaGeneration);
}

// ─── either ───────────────────────────────────────────────────────────────

export function createVideo(provider: VideoProvider, req: VideoRequest, env: NodeJS.ProcessEnv = process.env): Promise<VideoJob> {
  return provider === "runway" ? runwayCreate(req, env) : lumaCreate(req, env);
}

export function videoJob(provider: VideoProvider, id: string, env: NodeJS.ProcessEnv = process.env): Promise<VideoJob> {
  return provider === "runway" ? runwayJob(id, env) : lumaJob(id, env);
}
