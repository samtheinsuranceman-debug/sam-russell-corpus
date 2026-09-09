/**
 * Stamps the current room on <html> so the stylesheet can dress the page.
 *
 * `routeToTheme()` in shared/themes.ts decides the room from the path; this
 * component only writes `data-room`, `data-needle`, `data-quiet`, `data-light`
 * and `data-cast` and cleans them up. Everything visual lives in index.css
 * under `html[data-room=…]`, so no page has to know which room it is in.
 */
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { CAST, ROOM_ATTRIBUTE_NAMES, THEMES, routeToTheme, roomAttributes, type Cast, type Room } from "@shared/themes";

export function useRoom(): Room {
  const [location] = useLocation();
  return useMemo(() => routeToTheme(location), [location]);
}

export function RoomSync() {
  const [location] = useLocation();
  useEffect(() => {
    const el = document.documentElement;
    const attrs = roomAttributes(location);
    for (const name of ROOM_ATTRIBUTE_NAMES) {
      if (attrs[name]) el.setAttribute(name, attrs[name]);
      else el.removeAttribute(name);
    }
    return () => {
      for (const name of ROOM_ATTRIBUTE_NAMES) el.removeAttribute(name);
    };
  }, [location]);
  return null;
}

/** The specialist badge — 20px pip + word. Reused as an eyebrow, never as the homepage tile. */
export function CastBadge({ cast, className = "" }: { cast: Cast; className?: string }) {
  const c = CAST[cast];
  return (
    <span className={`rc-cast-badge ${className}`} data-cast={cast}>
      <span className="rc-cast-pip" style={{ background: c.pip }} aria-hidden="true" />
      {c.word}
    </span>
  );
}

/** Room name for headings, breadcrumbs and the handoff doc. */
export function roomName(room: Room): string {
  return THEMES[room.theme].name;
}
