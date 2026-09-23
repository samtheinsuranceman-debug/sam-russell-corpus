// ============================================================
// FIRST-LOGIN COLD START — the first twenty seconds after the Door.
//
// Cream field, idle filaments, the greeting as captions, the stills that
// exist passing through (ghost_through), then the START HERE plate
// (ask_through). Every timing and curve comes from
// shared/firstLoginColdStart.ts; this component only samples it.
//
// Who sees it: signed-in visitors the server says are eligible — every
// consumer once GENOME_INTAKE_LIVE is on; until then the owner only, with
// a "Preview — counsel review pending" badge. Once per login session
// (per tab), never on the Door pages.
//
// Always on screen while it plays: Halt travel (freezes the flow, and is
// remembered), Mute (saved to the account, the browser as fallback; this
// build has no sound, so every line is a caption), Not now (shuts the invitation for the session), Continue to
// the site, Book a review. The plate is asked once; missed or shut, a
// quiet "Start here" link stays in the corner instead of a re-ask.
// No points, streaks or rewards anywhere.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useSiteMap } from "@/contexts/SiteMapContext";
import Filaments from "./Filaments";
import {
  HOUSE_COLORS,
  PLATE_CLICK_TARGET,
  PLATE_LINES,
  PREF_KEYS,
  START_HERE_LINK,
  STILL_IDS,
  buildColdStartTimeline,
  coldStartAllowedOn,
  initialRecycleState,
  isObject,
  recycleReducer,
  samplePass,
  showStartHereLink,
  timelineEndS,
  type ColdStartSession,
  type ObjectPass,
  type RecycleEvent,
  type StillId,
} from "@shared/firstLoginColdStart";
import { PREVIEW_BADGE } from "@shared/genomeIntake";

function readBool(key: string): boolean {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
}
function writeBool(key: string, v: boolean): void {
  try { localStorage.setItem(key, v ? "1" : "0"); } catch { /* storage blocked */ }
}
function readSession(userId: number): ColdStartSession | null {
  try {
    const raw = sessionStorage.getItem(PREF_KEYS.session);
    const s = raw ? (JSON.parse(raw) as ColdStartSession) : null;
    return s && s.userId === userId ? { ...s, recycle: { ...initialRecycleState(), ...s.recycle } } : null;
  } catch { return null; }
}
function writeSession(s: ColdStartSession): void {
  try { sessionStorage.setItem(PREF_KEYS.session, JSON.stringify(s)); } catch { /* storage blocked */ }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  });
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try { mq = window.matchMedia("(prefers-reduced-motion: reduce)"); } catch { return; }
    const on = () => setReduced(Boolean(mq?.matches));
    mq.addEventListener?.("change", on);
    return () => mq?.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

const BTN = "rounded-full border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2";
/** Stills and the plate share one base box, so their scales compare directly: the plate peaks at 1.15, the stills at 0.70–0.74. */
const BASE_BOX = "w-[min(80vw,680px)]";

export default function ColdStartOverlay() {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const siteMap = useSiteMap();
  const cfg = trpc.genomeIntake.coldStartConfig.useQuery(undefined, { enabled: isAuthenticated, staleTime: 5 * 60_000, retry: false, refetchOnWindowFocus: false });
  const status = trpc.genomeIntake.status.useQuery(undefined, { enabled: Boolean(cfg.data?.eligible), staleTime: 60_000, retry: false, refetchOnWindowFocus: false });
  const prefersReduced = usePrefersReducedMotion();
  // Mute follows the account when signed in; the browser copy covers the first frame and a missing database.
  const soundPref = trpc.genomeIntake.soundPref.useQuery(undefined, { enabled: isAuthenticated, staleTime: 5 * 60_000, retry: false, refetchOnWindowFocus: false });
  const saveSound = trpc.genomeIntake.setSoundPref.useMutation();

  const [session, setSession] = useState<ColdStartSession | null>(null);
  const [playing, setPlaying] = useState(false);
  const [halted, setHalted] = useState(() => readBool(PREF_KEYS.halt));
  const [muted, setMuted] = useState(() => readBool(PREF_KEYS.mute));
  const [t, setT] = useState(0);
  const [loaded, setLoaded] = useState<Set<StillId>>(new Set());
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const m = soundPref.data?.muted;
    if (typeof m === "boolean") { setMuted(m); writeBool(PREF_KEYS.mute, m); }
  }, [soundPref.data?.muted]);

  const stills = cfg.data?.stills ?? {};
  const eligible = Boolean(cfg.data?.eligible);
  const hasMap = Boolean(status.data?.hasMap);
  const reduced = prefersReduced || halted;

  // Load the session record for this user once we know who they are.
  useEffect(() => {
    if (user) setSession(readSession(user.id) ?? { userId: user.id, played: false, recycle: initialRecycleState() });
  }, [user]);

  const update = useCallback((e: RecycleEvent) => {
    setSession((s) => {
      if (!s) return s;
      const next = { ...s, recycle: recycleReducer(s.recycle, e) };
      writeSession(next);
      return next;
    });
  }, []);

  // The Door includes the compliance acknowledgement form; wait until it is off screen.
  const [doorClear, setDoorClear] = useState(false);
  useEffect(() => {
    if (!eligible || session?.played) return;
    const check = () => setDoorClear(!document.getElementById("esign-section"));
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, [eligible, session?.played, location]);

  // Start once per login session, after the Door, where allowed.
  useEffect(() => {
    if (!eligible || !doorClear || !session || session.played || playing || status.isLoading) return;
    if (!coldStartAllowedOn(location)) return;
    const next = { ...session, played: true };
    writeSession(next);
    setSession(next);
    setPlaying(true);
  }, [eligible, doorClear, session, playing, location, status.isLoading]);

  // Preload the stills that exist. One that fails to load is simply skipped.
  useEffect(() => {
    for (const id of STILL_IDS) {
      const url = stills[id];
      if (!url) continue;
      const img = new Image();
      img.onload = () => setLoaded((prev) => new Set(prev).add(id));
      img.src = url;
    }
  }, [stills.STILL_MOUNTAIN, stills.STILL_DINNER, stills.STILL_WEDDING, stills.STILL_BEACH]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeline = useMemo(() => {
    const available = new Set(STILL_IDS.filter((id) => Boolean(stills[id])));
    const events = buildColdStartTimeline({
      available,
      reducedMotion: reduced,
      greeting: cfg.data?.greeting ?? undefined,
      coin: () => Math.random() < 0.5, // decorative: which side a still enters from (VR05)
    });
    // Someone who already has a map is not asked again.
    return hasMap ? events.filter((e) => !(isObject(e) && e.asset === "PLATE_START_HERE")) : events;
  }, [reduced, cfg.data?.greeting, hasMap, stills.STILL_MOUNTAIN, stills.STILL_DINNER, stills.STILL_WEDDING]); // eslint-disable-line react-hooks/exhaustive-deps

  const plate = timeline.find((e): e is ObjectPass => isObject(e) && e.asset === "PLATE_START_HERE") ?? null;
  const endS = timelineEndS(timeline);

  const finish = useCallback((missedPlate: boolean) => {
    setPlaying(false);
    startRef.current = null;
    if (missedPlate) update({ type: "plate_missed" });
  }, [update]);

  // The clock. Halted: time stops and the plate waits, static, in the centre.
  useEffect(() => {
    if (!playing || halted) return;
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now - t * 1000;
      const secs = (now - startRef.current) / 1000;
      setT(secs);
      if (secs >= endS + 0.2) {
        finish(Boolean(plate));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, halted, endS]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (playing && plate && t >= plate.atS && session && session.recycle.askTimesMs.length === 0) update({ type: "plate_shown", atMs: Date.now() });
  }, [playing, plate, t, session, update]);

  const openConsent = () => {
    update({ type: "plate_clicked" });
    setPlaying(false);
    if (siteMap.mode === "map") siteMap.openPage(PLATE_CLICK_TARGET);
    else navigate(PLATE_CLICK_TARGET);
  };
  const notNow = () => { update({ type: "dismiss" }); setPlaying(false); };
  const halt = () => { setHalted(true); writeBool(PREF_KEYS.halt, true); startRef.current = null; };
  const resumeMotion = () => { setHalted(false); writeBool(PREF_KEYS.halt, false); };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    writeBool(PREF_KEYS.mute, next);
    if (isAuthenticated) saveSound.mutate({ muted: next });
  };

  const onDoorPage = !coldStartAllowedOn(location);
  const showLink = eligible && !hasMap && !playing && !onDoorPage && session !== null && showStartHereLink(session.recycle);

  if (!playing) {
    if (!showLink) return null;
    return (
      <a href={START_HERE_LINK.href}
        onClick={(e) => {
          if (e.button !== 0 || e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          if (siteMap.mode === "map") siteMap.openPage(START_HERE_LINK.href);
          else navigate(START_HERE_LINK.href);
        }}
        className="fixed bottom-4 left-4 z-[95] rounded-xl border px-3 py-2 text-left shadow-sm focus:outline-none focus-visible:ring-2"
        style={{ background: HOUSE_COLORS.field, color: HOUSE_COLORS.ink, borderColor: HOUSE_COLORS.accentPulse }}
        data-testid="start-here-link">
        <span className="block text-xs font-semibold tracking-[0.18em]">{START_HERE_LINK.label.toUpperCase()}</span>
        <span className="block text-[11px] opacity-70">{START_HERE_LINK.sublabel}</span>
      </a>
    );
  }

  const lines = timeline.filter((e) => e.kind === "line");
  const objects = timeline.filter(isObject);

  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome" data-testid="cold-start"
      className="fixed inset-0 z-[100] overflow-hidden" style={{ background: HOUSE_COLORS.field, color: HOUSE_COLORS.ink }}>
      <Filaments running={!reduced} />

      {/* Captions: every spoken line is on screen as text. */}
      <div className="pointer-events-none absolute inset-x-0 top-[12%] flex flex-col items-center gap-2 px-6 text-center" aria-live="polite">
        {lines.map((l) => (
          <p key={l.text} className="text-2xl font-light tracking-tight transition-opacity duration-700 sm:text-3xl"
            style={{ opacity: halted || t >= l.atS ? 1 : 0 }}>{l.text}</p>
        ))}
      </div>

      {/* Objects: one through the centre at a time. Halted, only the plate stays, still. */}
      <div className="absolute inset-0 grid place-items-center">
        {objects.map((o) => {
          if (o.asset === "PLATE_START_HERE") {
            const smp = halted ? { phase: "hold" as const, scale: o.scale[1], opacity: 1, travel: 0 } : samplePass(o, t);
            const live = halted || (smp.phase !== "waiting" && smp.phase !== "done");
            if (!live) return null;
            return (
              <button key="plate" type="button" onClick={openConsent} data-testid="start-here-plate"
                className={`absolute flex ${BASE_BOX} flex-col items-center gap-1 rounded-2xl border-2 px-8 py-10 text-center focus:outline-none focus-visible:ring-4`}
                style={{
                  transform: `scale(${smp.scale})`, opacity: smp.opacity, background: HOUSE_COLORS.field,
                  borderColor: HOUSE_COLORS.ink, boxShadow: `0 0 0 3px ${HOUSE_COLORS.accentPulse}33`, zIndex: 2,
                  backgroundImage: cfg.data?.plateArtUrl ? `url(${cfg.data.plateArtUrl})` : undefined, backgroundSize: "cover",
                }}>
                <span className="text-3xl font-semibold tracking-[0.2em]">{PLATE_LINES[0]}</span>
                <span className="text-xl">{PLATE_LINES[1]}</span>
                <span className="text-sm opacity-80">{PLATE_LINES[2]}</span>
              </button>
            );
          }
          if (halted) return null;
          const url = stills[o.asset as StillId];
          if (!url || !loaded.has(o.asset as StillId)) return null; // never a stand-in face
          const smp = samplePass(o, t);
          if (smp.phase === "waiting" || smp.phase === "done") return null;
          const dx = o.entrySide === "left" ? -18 : o.entrySide === "right" ? 18 : 0;
          return (
            <img key={o.asset} src={url} alt="" aria-hidden draggable={false}
              className={`absolute max-h-[70vh] ${BASE_BOX} rounded-2xl object-cover`}
              style={{ transform: `translateX(${dx * smp.travel}vw) scale(${smp.scale})`, opacity: smp.opacity, zIndex: 1 }} />
          );
        })}
      </div>

      {/* Controls: always visible while the cold start is on screen. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 px-4 pb-5">
        {cfg.data?.preview && (
          <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: HOUSE_COLORS.ink }} data-testid="preview-badge">{PREVIEW_BADGE}</span>
        )}
        {halted ? (
          <button type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} onClick={resumeMotion}>Resume travel</button>
        ) : (
          <button type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} onClick={halt} data-testid="halt-travel">Halt travel</button>
        )}
        <button type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} onClick={toggleMute} aria-pressed={muted} data-testid="mute">
          {muted ? "Unmute" : "Mute"}
        </button>
        {plate && <button type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} onClick={notNow}>Not now</button>}
        <button type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} onClick={() => finish(Boolean(plate))}>Continue to the site</button>
        <a className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} href={cfg.data?.bookingUrl ?? "/support"} target={cfg.data?.bookingUrl?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">Book a review</a>
      </div>
    </div>
  );
}
