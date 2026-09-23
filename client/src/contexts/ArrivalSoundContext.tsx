// ============================================================
// ARRIVAL SOUND CONTEXT — one sound engine for the whole signed-in app.
//
// Nothing happens here until the arrival field calls start() from the household's
// own click ("Enter with sound" / "Sound on"). After that:
//   - every page change crossfades to that page's soundscape (shared/soundscapes.ts);
//   - silent pages (sign-in, consent/intake, voice, money decisions) and any
//     component that calls useSoundSilence(true) pause the sound until they end;
//   - a small sound menu stays on screen on every page while the engine exists:
//     Mute / Resume and the optional beat texture (Off, Headphones, Speakers);
//   - one mute everywhere: muting here also switches off the site's other sound
//     (the app shell's audio toggle and the Sound of Capital); switching either of
//     those off mutes this; starting this sound switches the others off, so only
//     one sound source plays at a time.
// The arrival field is behind a default-off flag, so with the flag off this
// provider never starts and renders nothing.
// ============================================================
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  ArrivalSoundEngine,
  isDesktopAudio,
  readSoundPref,
  readTexturePref,
  writeSoundPref,
  writeTexturePref,
  type ArrivalSoundState,
  type SoundPref,
} from "@/lib/arrivalSound";
import type { ArrivalSession } from "@/lib/arrivalSession";
import { useEntrainment } from "@/contexts/EntrainmentEngine";
import { capitalAmbience } from "@/lib/capitalAmbience";
import { useCapitalAmbience } from "@/hooks/useCapitalAmbience";
import { clampSignatureLength, sessionSoundPlan } from "@shared/sonicSignature";
import { normalizeRoute, silenceReasonFor, soundscapeFor, type BeatTextureMode, type SilenceReason } from "@shared/soundscapes";

/** Optional build setting: how many cues form the signature (10..25, default 12). */
const SIGNATURE_CUES = clampSignatureLength(Number(import.meta.env.VITE_ARRIVAL_SIGNATURE_CUES ?? Number.NaN));
const HEARD_KEY = "rcs-arrival-heard";

interface ArrivalSoundApi {
  state: ArrivalSoundState;
  pref: SoundPref;
  texture: BeatTextureMode;
  /** Why the current page is quiet, if it is. */
  quietBecause: SilenceReason | "intake" | null;
  start: (arrival: ArrivalSession, homeRoute: string) => Promise<boolean>;
  mute: () => void;
  resume: () => Promise<boolean>;
  setTexture: (m: BeatTextureMode) => void;
  /** Register a temporary silence (the spoken intake, an answer read aloud). Returns the release. */
  hold: () => () => void;
}

const Ctx = createContext<ArrivalSoundApi | null>(null);

export function useArrivalSound(): ArrivalSoundApi | null {
  return useContext(Ctx);
}

/** Keep the arrival sound quiet while `active` is true (for example, while the spoken intake is open). */
export function useSoundSilence(active: boolean): void {
  // `hold` is stable for the provider's life, so this effect runs only when `active` changes.
  const hold = useContext(Ctx)?.hold;
  useEffect(() => {
    if (!active || !hold) return;
    return hold();
  }, [active, hold]);
}

function readHeard(sessionNumber: number): number {
  try {
    const v = JSON.parse(sessionStorage.getItem(HEARD_KEY) ?? "null") as { sessionNumber: number; heard: number } | null;
    return v && v.sessionNumber === sessionNumber ? Math.max(0, v.heard) : 0;
  } catch {
    return 0;
  }
}

function writeHeard(sessionNumber: number, heard: number): void {
  try { sessionStorage.setItem(HEARD_KEY, JSON.stringify({ sessionNumber, heard })); } catch { /* private mode */ }
}

export function ArrivalSoundProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const engineRef = useRef<ArrivalSoundEngine | null>(null);
  const homeRef = useRef<{ route: string; arrival: ArrivalSession } | null>(null);
  const holds = useRef(new Set<symbol>());
  const [holdCount, setHoldCount] = useState(0);
  const [state, setState] = useState<ArrivalSoundState>("idle");
  const [pref, setPref] = useState<SoundPref>(() => readSoundPref());
  const [texture, setTextureState] = useState<BeatTextureMode>(() => readTexturePref());

  const site = useEntrainment();
  const ambience = useCapitalAmbience();
  const siteAudioOn = site.audioEnabled;
  const ambienceOn = ambience.enabled;
  const prevOther = useRef({ siteAudioOn, ambienceOn });

  const routeReason = silenceReasonFor(location);
  const quietBecause: ArrivalSoundApi["quietBecause"] = routeReason ?? (holdCount > 0 ? "intake" : null);

  const scapeFor = useCallback((path: string) => {
    const home = homeRef.current;
    if (!home) return null;
    const same = normalizeRoute(path) === normalizeRoute(home.route);
    return soundscapeFor(path, home.arrival.signatureSeed, same ? { voicing: home.arrival.skin.voicing } : {});
  }, []);

  // Page changes: crossfade to the page's soundscape.
  useEffect(() => {
    const s = scapeFor(location);
    if (s) engineRef.current?.setSoundscape(s);
  }, [location, scapeFor]);

  // Silent pages and held silences.
  useEffect(() => {
    engineRef.current?.setSilenced(quietBecause !== null);
  }, [quietBecause]);

  // One mute everywhere: another site sound switched off while ours plays → mute ours too.
  useEffect(() => {
    const prev = prevOther.current;
    prevOther.current = { siteAudioOn, ambienceOn };
    const turnedOff = (prev.siteAudioOn && !siteAudioOn) || (prev.ambienceOn && !ambienceOn);
    if (turnedOff && engineRef.current?.getState() === "playing") {
      engineRef.current.mute();
      writeSoundPref("off");
      setPref("off");
    }
  }, [siteAudioOn, ambienceOn]);

  /** Switch the site's other sound sources off (they are not level-matched to this one). */
  const quietOthers = useCallback(() => {
    if (site.audioEnabled) site.toggleAudio();
    if (capitalAmbience?.getSnapshot().enabled) capitalAmbience.disable();
    prevOther.current = { siteAudioOn: false, ambienceOn: false };
  }, [site]);

  // Release the audio device when the app unmounts.
  useEffect(() => () => { engineRef.current?.stop(); engineRef.current = null; }, []);

  const start = useCallback(async (arrival: ArrivalSession, homeRoute: string) => {
    let engine = engineRef.current;
    if (!engine || engine.getState() === "stopped") {
      homeRef.current = { route: homeRoute, arrival };
      const plan = sessionSoundPlan({
        seed: arrival.signatureSeed,
        sessionNumber: arrival.sessionNumber,
        signatureLength: SIGNATURE_CUES,
        houseVoicing: arrival.houseVoicing,
        skinVoicing: arrival.skin.voicing,
        desktop: isDesktopAudio(),
      });
      engine = new ArrivalSoundEngine(plan, {
        soundscape: soundscapeFor(homeRoute, arrival.signatureSeed, { voicing: arrival.skin.voicing }),
        texture: readTexturePref(),
        desktop: isDesktopAudio(),
        startIndex: readHeard(arrival.sessionNumber),
        onCue: (heard) => writeHeard(arrival.sessionNumber, heard),
      });
      engine.subscribe(setState);
      engineRef.current = engine;
      const here = scapeFor(window.location.pathname);
      if (here) engine.setSoundscape(here);
    }
    engine.setSilenced(silenceReasonFor(window.location.pathname) !== null || holds.current.size > 0);
    quietOthers();
    const ok = await engine.start();
    if (ok) { writeSoundPref("on"); setPref("on"); }
    return ok;
  }, [scapeFor, quietOthers]);

  const mute = useCallback(() => {
    engineRef.current?.mute();
    quietOthers();
    writeSoundPref("off");
    setPref("off");
  }, [quietOthers]);

  const resume = useCallback(async () => {
    quietOthers();
    const ok = (await engineRef.current?.start()) ?? false;
    if (ok) { writeSoundPref("on"); setPref("on"); }
    return ok;
  }, [quietOthers]);

  const setTexture = useCallback((m: BeatTextureMode) => {
    writeTexturePref(m);
    setTextureState(m);
    engineRef.current?.setTexture(m);
  }, []);

  const hold = useCallback(() => {
    const token = Symbol("hold");
    holds.current.add(token);
    setHoldCount(holds.current.size);
    return () => { holds.current.delete(token); setHoldCount(holds.current.size); };
  }, []);

  const api = useMemo<ArrivalSoundApi>(() => ({ state, pref, texture, quietBecause, start, mute, resume, setTexture, hold }), [state, pref, texture, quietBecause, start, mute, resume, setTexture, hold]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <SoundMenu />
    </Ctx.Provider>
  );
}

const QUIET_COPY: Record<NonNullable<ArrivalSoundApi["quietBecause"]>, string> = {
  "sign-in": "Quiet while you sign in.",
  "consent-intake": "Quiet on consent and intake pages.",
  voice: "Quiet while the advisor speaks.",
  "money-decision": "Quiet on money-decision pages.",
  intake: "Quiet while you talk.",
};

const TEXTURES: Array<{ id: BeatTextureMode; label: string }> = [
  { id: "off", label: "Off" },
  { id: "headphones", label: "Headphones" },
  { id: "speakers", label: "Speakers" },
];

/** The sound menu: on every page while the household's sound session exists. */
function SoundMenu() {
  const api = useContext(Ctx);
  const [open, setOpen] = useState(false);
  if (!api || api.state === "idle" || api.state === "stopped") return null;
  const playing = api.state === "playing";
  const chip = "rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300";
  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)] rounded-2xl border border-emerald-300/25 bg-[#03110f]/90 p-2 text-white shadow-xl backdrop-blur-md" role="region" aria-label="Sound" data-testid="arrival-sound-menu">
      <div className="flex flex-wrap items-center gap-2">
        {playing ? (
          <button type="button" onClick={api.mute} className={`${chip} bg-emerald-500 text-white hover:bg-emerald-400`} aria-label="Mute sound" data-testid="sound-menu-mute">Mute</button>
        ) : api.quietBecause ? (
          <span className="px-2 text-xs text-emerald-100/75" data-testid="sound-menu-quiet">{QUIET_COPY[api.quietBecause]}</span>
        ) : (
          <button type="button" onClick={() => void api.resume()} className={`${chip} border border-emerald-300/40 text-emerald-100 hover:bg-emerald-500/20`} data-testid="sound-menu-resume">Sound on</button>
        )}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${chip} text-emerald-100/75 hover:text-white`} data-testid="sound-menu-more">Sound texture</button>
      </div>
      {open && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <p className="px-1 text-[11px] text-emerald-100/65" id="beat-texture-label">Beat texture: two steady tones a few hertz apart. Headphones puts one in each ear; Speakers mixes them, quieter.</p>
          <div className="mt-1.5 flex gap-1" role="radiogroup" aria-labelledby="beat-texture-label">
            {TEXTURES.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={api.texture === t.id} onClick={() => api.setTexture(t.id)} className={`${chip} ${api.texture === t.id ? "bg-emerald-500 text-white" : "border border-white/15 text-emerald-100/80 hover:bg-white/5"}`} data-testid={`beat-texture-${t.id}`}>{t.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
