// ============================================================
// PAGE VIDEO — the site-wide video slot. Mounted on every
// detail-page family; reads the current path from the router and
// looks it up in PAGE_VIDEOS. Configured page → full 16:9 player
// (lazy iframe or native video). Unconfigured page → a slim
// "film briefing in production" strip, so every page advertises
// the video program before its film lands. Adding a video is one
// line in client/src/lib/pageVideos.ts.
// ============================================================
import { useLocation } from "wouter";
import { PAGE_VIDEOS } from "@/lib/pageVideos";
import { toEmbed } from "@/lib/lineVideos";

const INK2 = "#1C1710";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function PageVideo({ label }: { label?: string }) {
  const [location] = useLocation();
  const path = location === "" ? "/" : location;
  const embed = toEmbed(PAGE_VIDEOS[path] ?? "");

  if (embed) {
    return (
      <div className="rounded-2xl overflow-hidden mb-8" style={{ border: `1px solid ${CHAMPAGNE}33`, aspectRatio: "16 / 9", background: "#000" }}>
        {embed.kind === "video"
          ? <video src={embed.src} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : <iframe src={embed.src} title={label ?? "Film briefing"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ width: "100%", height: "100%", border: 0 }} loading="lazy" />}
      </div>
    );
  }
  return (
    <div className="rounded-xl flex items-center gap-3 px-4 py-3 mb-8"
      style={{ border: `1px dashed ${LINE_C}`, background: INK2 }}>
      <div style={{ width: "34px", height: "34px", borderRadius: "999px", border: `1px solid ${CHAMPAGNE}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: CHAMPAGNE, fontSize: "12px", marginLeft: "2px" }}>▶</span>
      </div>
      <div>
        <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: CHAMPAGNE, margin: 0 }}>
          Film briefing · in production
        </p>
        <p style={{ ...mono, fontSize: "9px", color: MUTED, margin: "3px 0 0" }}>
          {label ?? "this page"}, on camera — coming here
        </p>
      </div>
    </div>
  );
}
