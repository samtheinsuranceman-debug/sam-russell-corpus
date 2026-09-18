// ============================================================
// ZOOM — the eyes and ears of the AI Whisperer.
//
// Three things, all read from the environment:
//   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
//       a Server-to-Server OAuth app (Zoom Marketplace → Develop → Build
//       App → Server-to-Server OAuth) with scopes:
//         cloud_recording:read:list_user_recordings:admin (recordings + transcripts)
//         meeting:read:meeting:admin, user:read:user:admin
//         rtms:read:rtms_started:admin, rtms:read:rtms_stopped:admin (live media)
//   ZOOM_WEBHOOK_SECRET_TOKEN
//       the app's Event Subscription secret; the endpoint is
//       POST /api/zoom/webhook. Subscribe to meeting.rtms_started and
//       meeting.rtms_stopped (Realtime Media Streams must be enabled on
//       the app; the advisor turns RTMS on in the meeting).
//
// Past calls: the cloud recordings of the advisor's user, with the VTT
// transcript files, so the coach knows what was said last time.
//
// Live calls: when the meeting starts streaming, Zoom sends
// meeting.rtms_started with the signaling server; this module connects,
// completes the two handshakes, and hands transcript lines and one video
// frame per second to the whisperer, which turns them into turns and
// body-language signals.
// ============================================================
import { createHmac, timingSafeEqual } from "crypto";
import WebSocket from "ws";

export type ZoomEnv = {
  ZOOM_ACCOUNT_ID?: string;
  ZOOM_CLIENT_ID?: string;
  ZOOM_CLIENT_SECRET?: string;
  ZOOM_WEBHOOK_SECRET_TOKEN?: string;
};

export function zoomConfigured(env: ZoomEnv = process.env as ZoomEnv): { api: boolean; webhook: boolean } {
  return { api: Boolean(env.ZOOM_ACCOUNT_ID && env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET), webhook: Boolean(env.ZOOM_WEBHOOK_SECRET_TOKEN) };
}

// ─── OAuth ────────────────────────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function zoomAccessToken(env: ZoomEnv = process.env as ZoomEnv): Promise<string> {
  if (!zoomConfigured(env).api) throw new Error("Zoom API not configured (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)");
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const basic = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(env.ZOOM_ACCOUNT_ID!)}`, {
    method: "POST", headers: { authorization: `Basic ${basic}` }, signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Zoom token request failed (${res.status})`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function zoomGet<T>(path: string, env?: ZoomEnv): Promise<T> {
  const token = await zoomAccessToken(env);
  const res = await fetch(`https://api.zoom.us/v2${path}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Zoom API ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

// ─── recordings and transcripts ───────────────────────────────────────────

export type ZoomRecording = {
  uuid: string; id: number; topic: string; start_time: string; duration: number;
  recording_files: Array<{ id: string; file_type: string; file_extension?: string; download_url: string; recording_type?: string; status?: string }>;
};

/** Cloud recordings for a Zoom user (email or "me"), newest first, within the window. */
export async function listRecordings(user: string, fromDays = 180, env?: ZoomEnv): Promise<ZoomRecording[]> {
  const to = new Date();
  const from = new Date(Date.now() - fromDays * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const out: ZoomRecording[] = [];
  let next = "";
  for (let page = 0; page < 5; page++) {
    const data = await zoomGet<{ meetings: ZoomRecording[]; next_page_token?: string }>(`/users/${encodeURIComponent(user)}/recordings?from=${fmt(from)}&to=${fmt(to)}&page_size=100${next ? `&next_page_token=${encodeURIComponent(next)}` : ""}`, env);
    out.push(...(data.meetings ?? []));
    next = data.next_page_token ?? "";
    if (!next) break;
  }
  return out.sort((a, b) => (a.start_time < b.start_time ? 1 : -1));
}

/** Download the VTT transcript of a recording, if Zoom produced one. */
export async function fetchTranscript(rec: ZoomRecording, env?: ZoomEnv): Promise<string | null> {
  const file = rec.recording_files.find((f) => f.file_type === "TRANSCRIPT" || f.recording_type === "audio_transcript");
  if (!file) return null;
  const token = await zoomAccessToken(env);
  const res = await fetch(file.download_url, { headers: { authorization: `Bearer ${token}` }, redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) return null;
  return res.text();
}

/** Recordings whose topic or participants mention the client's name. */
export function recordingsForClient(recs: ZoomRecording[], clientName: string): ZoomRecording[] {
  const parts = clientName.toLowerCase().split(/\s+/).filter((p) => p.length > 2 && !/^(dr|mr|mrs|ms|md)\.?$/.test(p));
  return recs.filter((r) => { const t = (r.topic ?? "").toLowerCase(); return parts.some((p) => t.includes(p)); });
}

// ─── webhook ──────────────────────────────────────────────────────────────

/** Zoom's URL validation challenge and the signed-request check. */
export function verifyZoomWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string, env: ZoomEnv = process.env as ZoomEnv): boolean {
  const secret = env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret) return false;
  const ts = String(headers["x-zm-request-timestamp"] ?? "");
  const sig = String(headers["x-zm-signature"] ?? "");
  if (!ts || !sig) return false;
  const expected = `v0=${createHmac("sha256", secret).update(`v0:${ts}:${rawBody}`).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function zoomValidationResponse(plainToken: string, env: ZoomEnv = process.env as ZoomEnv): { plainToken: string; encryptedToken: string } {
  return { plainToken, encryptedToken: createHmac("sha256", env.ZOOM_WEBHOOK_SECRET_TOKEN ?? "").update(plainToken).digest("hex") };
}

// ─── Realtime Media Streams ───────────────────────────────────────────────

// Message types from Zoom's RTMS protocol.
const MSG = {
  SIGNALING_HANDSHAKE_REQ: 1, SIGNALING_HANDSHAKE_RESP: 2,
  DATA_HANDSHAKE_REQ: 3, DATA_HANDSHAKE_RESP: 4,
  EVENT_SUBSCRIPTION: 5, EVENT_UPDATE: 6, CLIENT_READY_ACK: 7, STREAM_STATE_UPDATE: 8,
  SESSION_STATE_UPDATE: 9, SESSION_STATE_REQ: 10, SESSION_STATE_RESP: 11,
  KEEP_ALIVE_REQ: 12, KEEP_ALIVE_RESP: 13,
  MEDIA_DATA_AUDIO: 14, MEDIA_DATA_VIDEO: 15, MEDIA_DATA_SHARE: 16, MEDIA_DATA_TRANSCRIPT: 17, MEDIA_DATA_CHAT: 18,
} as const;

const MEDIA_TYPE = { AUDIO: 1, VIDEO: 2, TRANSCRIPT: 32 } as const;

export type RtmsStart = { meeting_uuid: string; rtms_stream_id: string; server_urls: string; meeting_id?: string | number };

export type RtmsHandlers = {
  onTranscript: (line: { userName: string; userId?: string | number; text: string; timestampMs: number }) => void;
  onVideoFrame?: (frame: { userName?: string; userId?: string | number; jpegBase64: string; timestampMs: number }) => void;
  onAudioLevel?: (level: { userId?: string | number; timestampMs: number; rms: number }) => void;
  onState?: (state: string) => void;
  onError?: (err: Error) => void;
};

export type RtmsConnection = { stop: () => void; startedAt: number };

export function rtmsSignature(meetingUuid: string, streamId: string, env: ZoomEnv = process.env as ZoomEnv): string {
  return createHmac("sha256", env.ZOOM_CLIENT_SECRET ?? "").update(`${env.ZOOM_CLIENT_ID ?? ""},${meetingUuid},${streamId}`).digest("hex");
}

/** Root-mean-square of 16-bit little-endian PCM, 0..1: a cheap energy read for the tone signal. */
export function pcmRms(buf: Buffer): number {
  const n = Math.floor(buf.length / 2);
  if (!n) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) { const v = buf.readInt16LE(i * 2) / 32768; sum += v * v; }
  return Math.sqrt(sum / n);
}

/**
 * Connect to a meeting's realtime stream. Transcript lines arrive as they
 * are spoken; video arrives as JPEG frames of the active speaker, one per
 * second; audio arrives as PCM and is reduced to an energy level here.
 */
export function connectRtms(start: RtmsStart, handlers: RtmsHandlers, env: ZoomEnv = process.env as ZoomEnv): RtmsConnection {
  const startedAt = Date.now();
  let signaling: WebSocket | null = null;
  let media: WebSocket | null = null;
  let stopped = false;
  const signature = rtmsSignature(start.meeting_uuid, start.rtms_stream_id, env);
  const fail = (e: unknown) => handlers.onError?.(e instanceof Error ? e : new Error(String(e)));
  const send = (ws: WebSocket | null, msg: unknown) => { try { ws?.send(JSON.stringify(msg)); } catch (e) { fail(e); } };

  const openMedia = (url: string) => {
    media = new WebSocket(url, { rejectUnauthorized: false });
    media.on("open", () => {
      send(media, {
        msg_type: MSG.DATA_HANDSHAKE_REQ, protocol_version: 1, meeting_uuid: start.meeting_uuid, rtms_stream_id: start.rtms_stream_id, signature,
        media_type: MEDIA_TYPE.AUDIO | MEDIA_TYPE.VIDEO | MEDIA_TYPE.TRANSCRIPT,
        payload_encryption: false,
        media_params: {
          audio: { content_type: 1, sample_rate: 1, channel: 1, codec: 1, data_opt: 1, send_rate: 100 },
          video: { content_type: 3, codec: 5, resolution: 2, data_opt: 3, fps: 1 },
          transcript: { content_type: 5 },
        },
      });
    });
    media.on("message", (raw) => {
      let msg: any;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      switch (msg.msg_type) {
        case MSG.DATA_HANDSHAKE_RESP:
          if (msg.status_code === 0) { send(signaling, { msg_type: MSG.CLIENT_READY_ACK, rtms_stream_id: start.rtms_stream_id }); handlers.onState?.("media-ready"); }
          else fail(new Error(`RTMS media handshake rejected (${msg.status_code}: ${msg.reason ?? ""})`));
          break;
        case MSG.KEEP_ALIVE_REQ:
          send(media, { msg_type: MSG.KEEP_ALIVE_RESP, timestamp: msg.timestamp });
          break;
        case MSG.MEDIA_DATA_TRANSCRIPT: {
          const c = msg.content ?? {};
          if (c.data) handlers.onTranscript({ userName: String(c.user_name ?? ""), userId: c.user_id, text: String(c.data), timestampMs: Number(c.timestamp ?? Date.now()) });
          break;
        }
        case MSG.MEDIA_DATA_VIDEO: {
          const c = msg.content ?? {};
          if (c.data && handlers.onVideoFrame) handlers.onVideoFrame({ userName: c.user_name, userId: c.user_id, jpegBase64: String(c.data), timestampMs: Number(c.timestamp ?? Date.now()) });
          break;
        }
        case MSG.MEDIA_DATA_AUDIO: {
          const c = msg.content ?? {};
          if (c.data && handlers.onAudioLevel) {
            try { handlers.onAudioLevel({ userId: c.user_id, timestampMs: Number(c.timestamp ?? Date.now()), rms: pcmRms(Buffer.from(String(c.data), "base64")) }); } catch { /* not PCM */ }
          }
          break;
        }
        default:
          break;
      }
    });
    media.on("error", fail);
    media.on("close", () => { handlers.onState?.("media-closed"); });
  };

  try {
    signaling = new WebSocket(start.server_urls, { rejectUnauthorized: false });
  } catch (e) { fail(e); return { stop: () => undefined, startedAt }; }
  signaling.on("open", () => {
    handlers.onState?.("signaling-open");
    send(signaling, { msg_type: MSG.SIGNALING_HANDSHAKE_REQ, protocol_version: 1, meeting_uuid: start.meeting_uuid, rtms_stream_id: start.rtms_stream_id, sequence: Math.floor(Math.random() * 1e9), signature });
  });
  signaling.on("message", (raw) => {
    let msg: any;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    switch (msg.msg_type) {
      case MSG.SIGNALING_HANDSHAKE_RESP: {
        if (msg.status_code === 0) {
          const url = msg.media_server?.server_urls?.all ?? msg.media_server?.server_urls?.transcript ?? msg.media_server?.server_urls?.audio;
          if (url) openMedia(url); else fail(new Error("RTMS signaling gave no media server"));
        } else fail(new Error(`RTMS signaling handshake rejected (${msg.status_code}: ${msg.reason ?? ""})`));
        break;
      }
      case MSG.KEEP_ALIVE_REQ:
        send(signaling, { msg_type: MSG.KEEP_ALIVE_RESP, timestamp: msg.timestamp });
        break;
      case MSG.STREAM_STATE_UPDATE:
      case MSG.SESSION_STATE_UPDATE:
        handlers.onState?.(`state:${msg.state ?? msg.stream_state ?? "?"}`);
        if (msg.state === 4 || msg.stream_state === 4) stop();
        break;
      default:
        break;
    }
  });
  signaling.on("error", fail);
  signaling.on("close", () => { handlers.onState?.("signaling-closed"); });

  function stop() {
    if (stopped) return;
    stopped = true;
    try { media?.close(); } catch { /* closed */ }
    try { signaling?.close(); } catch { /* closed */ }
    handlers.onState?.("stopped");
  }
  return { stop, startedAt };
}
