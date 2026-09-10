/**
 * The twelve HeyGen rooms (HEYGEN_SHOT_LISTS_12_ROOMS.md) and where each tile sits.
 *
 * The videos do not exist yet. When they do, the owner sets ROOM_VIDEO_URLS on
 * the host as a JSON map of room key → mp4 or share URL (and optionally
 * ROOM_VIDEO_POSTERS the same way); the tile appears on the pages named here
 * and nowhere else. Never on login, billing, compliance, vault or the 404.
 * The voice never autoplays; the line and the glow do.
 */
import type { Room } from "./themes";

export type RoomVideoKey = "cover" | "public" | "tax" | "prediction" | "engines" | "intake" | "journey" | "estate" | "observatory" | "ivory" | "cockpit" | "relief";

export type RoomVideo = {
  key: RoomVideoKey;
  room: number;
  title: string;
  placement: string;
  duration: string;
  /** The one sentence that must land as the line finishes drawing. */
  integralCue: string;
  file: string;
};

export const ROOM_VIDEOS: RoomVideo[] = [
  { key: "cover", room: 1, title: "Cover — Surgical Midnight", placement: "Homepage hero, right or lower third", duration: "3:00", integralCue: "That is the thing you have not been given elsewhere.", file: "rcs-heygen-cover-3m-v1.mp4" },
  { key: "public", room: 2, title: "Public house — Private Banking Navy", placement: "Below the fold or /pricing", duration: "3:00 (cut at 1:30)", integralCue: "Retail software will keep optimizing one box. That is a fine business. It is not this one.", file: "rcs-heygen-public-3m-v1.mp4" },
  { key: "tax", room: 3, title: "Tax Sanctuary — parchment", placement: "Top of every tax route", duration: "3:00", integralCue: "The gap is the sentence that holds both. That gap is this room.", file: "rcs-heygen-tax-3m-v1.mp4" },
  { key: "prediction", room: 4, title: "Prediction — Calculus", placement: "Time machine, Ibbotson and inflation cluster", duration: "3:00", integralCue: "This wing is not a forecast dressed as confidence.", file: "rcs-heygen-prediction-3m-v1.mp4" },
  { key: "engines", room: 5, title: "Engines — Carbon", placement: "Every portal calculator; the needle colour changes", duration: "3:00", integralCue: "The illustration is an input. It is not the answer.", file: "rcs-heygen-engines-3m-v1.mp4" },
  { key: "intake", room: 6, title: "Intake — Quiet Luxury", placement: "Welcome, snapshot, onboarding", duration: "3:00", integralCue: "", file: "rcs-heygen-intake-3m-v1.mp4" },
  { key: "journey", room: 7, title: "Journey — Horizon", placement: "Welcome, arrival, map, field, legacy", duration: "3:00", integralCue: "", file: "rcs-heygen-journey-3m-v1.mp4" },
  { key: "estate", room: 8, title: "Estate — Oxblood", placement: "Trusts, will, succession, the legacy", duration: "3:00", integralCue: "", file: "rcs-heygen-estate-3m-v1.mp4" },
  { key: "observatory", room: 9, title: "Observatory — Indigo", placement: "Mirror, twins, AI advisor, patent showcase", duration: "3:00 (cut at 1:30)", integralCue: "", file: "rcs-heygen-observatory-3m-v1.mp4" },
  { key: "ivory", room: 10, title: "Ivory document", placement: "Shared link, before a PDF download; optional 90s email header", duration: "1:30", integralCue: "", file: "rcs-heygen-ivory-90s-v1.mp4" },
  { key: "cockpit", room: 11, title: "Cockpit — Command", placement: "/portal/dashboard and command-center only", duration: "1:30 preferred", integralCue: "When a tile is stale, that is the only alarm I want you to feel.", file: "rcs-heygen-cockpit-90s-v1.mp4" },
  { key: "relief", room: 12, title: "Recovery and relief", placement: "The relief door on the cover and the journey start", duration: "3:00", integralCue: "", file: "rcs-heygen-relief-3m-v1.mp4" },
];

const COCKPIT_PATHS = new Set(["/portal/dashboard", "/portal/command-center"]);
const INTAKE_PATHS = new Set(["/portal/client-snapshot", "/portal/onboarding", "/portal/onboarding-v2", "/portal/client-onboarding", "/portal/client-intake", "/onboarding"]);

/** Which tile a page carries, if any. Quiet pages carry none. */
export function roomVideoFor(room: Room, path: string): RoomVideoKey | null {
  if (room.quiet) return null;
  const p = path.split("?")[0];
  if (p === "/portal/welcome") return "relief";
  if (room.theme === "theme5") return "tax";
  if (room.theme === "theme6") return "prediction";
  if (room.theme === "theme9") return "engines";
  if (room.theme === "theme8") return "journey";
  if (room.theme === "theme7") return "estate";
  if (room.theme === "theme11") return "observatory";
  if (room.theme === "theme10") return "ivory";
  if (room.theme === "theme3" && INTAKE_PATHS.has(p)) return "intake";
  if (room.theme === "theme2" && COCKPIT_PATHS.has(p)) return "cockpit";
  if (room.theme === "theme2" && p === "/pricing") return "public";
  return null;
}

export const ROOM_VIDEO_KEYS = ROOM_VIDEOS.map((v) => v.key);
