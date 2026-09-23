// ============================================================
// ARRIVAL FIELD — the signed-in home's arrival band, wearing this session's skin
// (shared/arrivalSkins.ts) and, only if the household chooses it, the sonic
// signature and page soundscapes (ArrivalSoundContext).
//
// Behind a default-off flag: RoleDashboard mounts it only when VITE_ARRIVAL_SKINS=on
// or the owner has switched the preview on. Silent by default; sound starts only
// from "Enter with sound" or "Sound on", never at login.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { acceptServerArrival, cachedArrival, localArrival, type ArrivalSession } from "@/lib/arrivalSession";
import { audioSupported } from "@/lib/arrivalSound";
import { useArrivalSound } from "@/contexts/ArrivalSoundContext";

function useArrivalSession(userId: number | null): ArrivalSession | null {
  const begin = trpc.arrival.begin.useMutation();
  const [arrival, setArrival] = useState<ArrivalSession | null>(() => (userId === null ? null : cachedArrival(userId)));
  const started = useRef(false);
  useEffect(() => {
    if (userId === null || arrival || started.current) return;
    started.current = true;
    begin
      .mutateAsync()
      .then((r) => setArrival(acceptServerArrival(userId, r)))
      .catch(() => setArrival(localArrival(userId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, arrival]);
  return arrival;
}

/** How long the filaments drift before they stop by themselves (WCAG 2.2.2: at most 5 s unless the viewer resumes). */
export const FILAMENT_MOTION_S = 5;

/** Three filaments drifting one way at a steady speed (never expand-contract); still under reduced motion or when paused. */
function Filaments({ colour, moving }: { colour: string; moving: boolean }) {
  const paths = [
    "M0 70 C 200 40, 400 100, 600 70 S 1000 40, 1200 70",
    "M0 140 C 180 110, 420 170, 640 140 S 1020 110, 1200 140",
    "M0 200 C 220 180, 380 225, 620 200 S 980 180, 1200 200",
  ];
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={d} d={d} className="rc-arrival-filament" style={{ animationDuration: `${28 + i * 9}s`, animationPlayState: moving ? "running" : "paused" }} fill="none" stroke={colour} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="140 70" opacity={0.85 - i * 0.2} />
      ))}
    </svg>
  );
}

export function ArrivalField({ userId, name, ownerCaption = false }: { userId: number | null; name?: string; ownerCaption?: boolean }) {
  const arrival = useArrivalSession(userId);
  const sound = useArrivalSound();
  const [location] = useLocation();
  const supported = useMemo(() => audioSupported(), []);
  const reducedMotion = useMemo(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const [moving, setMoving] = useState(!reducedMotion);
  const [resumedByViewer, setResumedByViewer] = useState(false);
  // The drift stops by itself after 5 s; if the viewer presses Play it runs until they press Pause.
  useEffect(() => {
    if (!moving || resumedByViewer) return;
    const t = setTimeout(() => setMoving(false), FILAMENT_MOTION_S * 1000);
    return () => clearTimeout(t);
  }, [moving, resumedByViewer]);

  if (!arrival) return <div className="h-40 rounded-3xl border border-white/10 bg-white/[0.03]" aria-hidden="true" data-testid="arrival-field-loading" />;
  const { skin } = arrival;
  const btn = "rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 disabled:opacity-50";
  const still = skin.stills[0];

  const enter = () => { if (sound) void sound.start(arrival, location); };

  let control: React.ReactNode = null;
  if (supported && sound) {
    if (sound.state === "playing") {
      control = <button type="button" onClick={sound.mute} className={btn} style={{ borderColor: skin.ink, color: skin.ink, background: `${skin.field}CC` }} aria-label="Mute sound" data-testid="arrival-mute">Mute</button>;
    } else if (sound.quietBecause) {
      control = <p className="text-xs" style={{ color: skin.ink }} data-testid="arrival-silenced">Sound is paused while you talk.</p>;
    } else if (sound.state === "paused" || sound.pref === "off") {
      control = <button type="button" onClick={enter} className={btn} style={{ borderColor: skin.ink, color: skin.ink }} data-testid="arrival-sound-on">Sound on</button>;
    } else {
      control = <button type="button" onClick={enter} className={btn} style={{ borderColor: skin.ink, color: skin.field, background: skin.ink }} data-testid="arrival-enter-sound">Enter with sound</button>;
    }
  }

  return (
    <section
      className="relative isolate overflow-hidden rounded-3xl border"
      style={{ background: `radial-gradient(120% 140% at 50% 0%, ${skin.field} 0%, ${skin.field} 55%, ${skin.filament}22 100%)`, borderColor: `${skin.filament}66`, color: skin.ink }}
      aria-label="Arrival"
      data-testid="arrival-field"
      data-skin={skin.id}
    >
      {still && <img src={still.url} alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20" loading="eager" decoding="async" />}
      <Filaments colour={skin.filament} moving={moving} />
      <div className="relative flex min-h-[10rem] flex-wrap items-end justify-between gap-4 px-6 py-6 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: skin.ink }}>Welcome back</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{name ? `Good to see you, ${name}.` : "Good to see you."}</p>
          {ownerCaption && <p className="mt-2 text-xs" style={{ color: skin.ink }} data-testid="arrival-owner-caption">Preview · {skin.name} · voicing {skin.voicing.join(" ")} · history kept in {arrival.stored}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!reducedMotion && (
            <button type="button" onClick={() => { setResumedByViewer(!moving); setMoving(!moving); }} aria-pressed={!moving} className={btn} style={{ borderColor: skin.ink, color: skin.ink }} data-testid="arrival-motion">
              {moving ? "Pause motion" : "Play motion"}
            </button>
          )}
          {control && <div className="flex items-center gap-2" role="group" aria-label="Sound">{control}</div>}
        </div>
      </div>
    </section>
  );
}
