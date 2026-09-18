/**
 * HeyGen API Service — Video Proposal Generation
 * 
 * Uses the HeyGen Studio Video API (v2) to generate multi-scene
 * avatar videos with personalized financial strategy scripts.
 */

const HEYGEN_BASE = "https://api.heygen.com";

function getApiKey(): string {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY not configured. Set it in Settings → Secrets.");
  return key;
}

async function heygenFetch(path: string, options: RequestInit = {}) {
  const key = getApiKey();
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...options,
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": key,
      ...(options.headers || {}),
    },
  });
  
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HeyGen API error ${res.status}: ${body}`);
  }
  
  return res.json();
}

// ─── Avatars ─────────────────────────────────────────────────────────────────

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
}

export async function listAvatars(): Promise<HeyGenAvatar[]> {
  const data = await heygenFetch("/v2/avatars");
  return data?.data?.avatars || [];
}

// ─── Voices ──────────────────────────────────────────────────────────────────

export interface HeyGenVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: string;
  preview_audio?: string;
  support_pause?: boolean;
}

export async function listVoices(): Promise<HeyGenVoice[]> {
  const data = await heygenFetch("/v2/voices");
  return data?.data?.voices || [];
}

// ─── Remaining Quota ─────────────────────────────────────────────────────────

export interface HeyGenQuota {
  remaining_quota: number;
  used_quota?: number;
  details?: { generative_credit: number; plan_credit: number };
}

export async function getRemainingQuota(): Promise<HeyGenQuota> {
  const data = await heygenFetch("/v2/user/remaining_quota");
  const quota = data?.data || { remaining_quota: 0 };
  // v2 API returns remaining_quota=0 but has details with actual credits
  if (quota.remaining_quota === 0 && quota.details) {
    quota.remaining_quota = (quota.details.generative_credit || 0) + (quota.details.plan_credit || 0);
  }
  return quota;
}

// ─── Video Generation (Studio API v2 — Multi-Scene) ─────────────────────────

export interface VideoScene {
  script: string;
  avatarId: string;
  voiceId: string;
  backgroundType?: "color" | "image" | "video";
  backgroundColor?: string;
  backgroundUrl?: string;
}

export interface GenerateVideoOptions {
  title: string;
  scenes: VideoScene[];
  resolution?: "1080p" | "720p";
  caption?: boolean;
  callbackUrl?: string;
}

export async function generateStudioVideo(options: GenerateVideoOptions): Promise<{ videoId: string }> {
  const videoInputs = options.scenes.map(scene => ({
    character: {
      type: "avatar",
      avatar_id: scene.avatarId,
      avatar_style: "normal",
    },
    voice: {
      type: "text",
      input_text: scene.script,
      voice_id: scene.voiceId,
      speed: 1.0,
      pitch: 0,
    },
    background: scene.backgroundType === "image" && scene.backgroundUrl
      ? { type: "image", url: scene.backgroundUrl }
      : { type: "color", value: scene.backgroundColor || "#1a1a2e" },
  }));

  const body: Record<string, unknown> = {
    video_inputs: videoInputs,
    title: options.title,
    dimension: {
      width: options.resolution === "720p" ? 1280 : 1920,
      height: options.resolution === "720p" ? 720 : 1080,
    },
    caption: options.caption ?? true,
  };

  if (options.callbackUrl) {
    body.callback_url = options.callbackUrl;
  }

  const data = await heygenFetch("/v2/video/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const videoId = data?.data?.video_id;
  if (!videoId) throw new Error("HeyGen did not return a video_id");
  return { videoId };
}

// ─── Simple Video Generation (Avatar IV — Single Scene) ─────────────────────

export async function generateSimpleVideo(options: {
  avatarId: string;
  voiceId: string;
  script: string;
  title: string;
  resolution?: "1080p" | "720p";
}): Promise<{ videoId: string }> {
  const data = await heygenFetch("/v2/videos", {
    method: "POST",
    body: JSON.stringify({
      avatar_id: options.avatarId,
      voice_id: options.voiceId,
      script: options.script,
      title: options.title,
      resolution: options.resolution || "1080p",
      aspect_ratio: "16:9",
      expressiveness: "medium",
      caption: true,
      background: { type: "color", value: "#1a1a2e" },
      voice_settings: { speed: 1.0, pitch: 0 },
    }),
  });

  const videoId = data?.data?.video_id;
  if (!videoId) throw new Error("HeyGen did not return a video_id");
  return { videoId };
}

// ─── Video Status ────────────────────────────────────────────────────────────

export interface VideoStatus {
  status: "pending" | "waiting" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
}

export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const data = await heygenFetch(`/v1/video_status.get?video_id=${videoId}`);
  return {
    status: data?.data?.status || "pending",
    video_url: data?.data?.video_url,
    thumbnail_url: data?.data?.thumbnail_url,
    duration: data?.data?.duration,
    error: data?.data?.error,
  };
}

// ─── Shareable URL ───────────────────────────────────────────────────────────

export async function getShareableUrl(videoId: string): Promise<string | null> {
  try {
    const data = await heygenFetch("/v1/video.sharable_link", {
      method: "POST",
      body: JSON.stringify({ video_id: videoId }),
    });
    return data?.data?.url || null;
  } catch {
    return null;
  }
}
