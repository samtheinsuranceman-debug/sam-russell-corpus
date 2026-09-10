/**
 * The HeyGen tile for the room the visitor is in.
 *
 * Renders only when the host has a URL for this room (ROOM_VIDEO_URLS).
 * The face never autoplays: the visitor taps "Listen". Captions are on the
 * file itself. Not on quiet pages; shared/roomVideos.ts decides placement.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ROOM_VIDEOS, SITE_VIDEO_SLOTS, roomVideoFor, type SiteVideoSlot } from "@shared/roomVideos";
import { useRoom } from "./RoomTheme";

type Payload = { urls: Record<string, string>; posters: Record<string, string> };
let cache: Promise<Payload> | null = null;
function load(): Promise<Payload> {
  if (!cache) cache = fetch("/api/site/room-videos", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : { urls: {}, posters: {} })).catch(() => ({ urls: {}, posters: {} }));
  return cache;
}

export function RoomVideoTile() {
  const room = useRoom();
  const [location] = useLocation();
  const key = roomVideoFor(room, location);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { load().then(setPayload); }, []);
  useEffect(() => { setPlaying(false); }, [key]);
  if (!key || !payload?.urls[key]) return null;
  const meta = ROOM_VIDEOS.find((v) => v.key === key)!;
  const listen = () => { const v = ref.current; if (!v) return; v.muted = false; v.play().then(() => setPlaying(true)).catch(() => undefined); };
  return (
    <aside className="rc-room-video" aria-label={`${meta.title} video`}>
      <video ref={ref} src={payload.urls[key]} poster={payload.posters[key]} muted playsInline preload="metadata" controls={playing} onEnded={() => setPlaying(false)} />
      {!playing && (
        <button type="button" className="rc-room-video-listen" onClick={listen}>Listen — {meta.duration.split(" ")[0]}</button>
      )}
      <p className="rc-room-video-caption">{meta.title}</p>
    </aside>
  );
}

/** A page-specific slot (the HELOC before-and-after pair). Renders only once the host has the URL. */
export function SiteVideo({ slot }: { slot: SiteVideoSlot }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { load().then(setPayload); }, []);
  if (!payload?.urls[slot]) return null;
  const meta = SITE_VIDEO_SLOTS.find((s) => s.key === slot)!;
  const listen = () => { const v = ref.current; if (!v) return; v.muted = false; v.play().then(() => setPlaying(true)).catch(() => undefined); };
  return (
    <aside className="rc-room-video rc-site-video" aria-label={meta.label}>
      <video ref={ref} src={payload.urls[slot]} poster={payload.posters[slot]} muted playsInline preload="metadata" controls={playing} onEnded={() => setPlaying(false)} />
      {!playing && <button type="button" className="rc-room-video-listen" onClick={listen}>Play</button>}
      <p className="rc-room-video-caption">{meta.label}</p>
    </aside>
  );
}

/** The before-and-after pair, side by side when both exist. */
export function HelocBeforeAfter() {
  return (
    <div className="rc-site-video-pair">
      <SiteVideo slot="heloc-before" />
      <SiteVideo slot="heloc-after" />
    </div>
  );
}
