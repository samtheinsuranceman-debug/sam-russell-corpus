/**
 * GET /api/site/room-videos — the HeyGen tiles that exist.
 *
 * ROOM_VIDEO_URLS on the host is a JSON map of room key → https URL; the
 * optional ROOM_VIDEO_POSTERS is the same shape for still frames. Unknown
 * keys and non-https values are dropped. No secrets, no client data.
 */
import type { Express, Request, Response } from "express";
import { ROOM_VIDEO_KEYS } from "../../shared/roomVideos";

export const ROOM_VIDEOS_PATH = "/api/site/room-videos";

export function parseRoomVideoMap(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if ((ROOM_VIDEO_KEYS as string[]).includes(k) && typeof v === "string" && /^https:\/\//.test(v) && v.length < 2000) out[k] = v;
    }
    return out;
  } catch { return {}; }
}

export function roomVideosPayload(env: NodeJS.ProcessEnv = process.env) {
  return { urls: parseRoomVideoMap(env.ROOM_VIDEO_URLS), posters: parseRoomVideoMap(env.ROOM_VIDEO_POSTERS) };
}

export function registerRoomVideoRoutes(app: Express) {
  app.get(ROOM_VIDEOS_PATH, (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(roomVideosPayload());
  });
}
