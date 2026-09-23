// ============================================================
// FIRST-LOGIN COLD START (LOGIN_COLD_START) — the first twenty seconds
// after the Door, as data and pure functions.
//
// Spec: RCS-FIRST-LOGIN-MANAGER.json v1.0.0 (first_twenty_seconds,
// motion_curves, vection, variable_reward VR03 and VR05) and the motion
// controls 10–18, 22 and 27 of RCS-INTRO-75-CONTROLS.json, as amended by
// the perception review (P4-B) and the regulatory review (see below).
//
// Everything the overlay does is decided here, so the tests can prove the
// order, the readable-face window, the plate hold, the recycle rule and
// the reduced-motion fallback without a browser. The React component in
// client/src/components/firstLogin/ only samples these functions.
//
// Rules that shape every curve in this file:
//   • Forward expand only. Every scale keyframe list rises strictly and
//     the sampled scale never falls, so nothing grows and shrinks back.
//     Alternating expand and contract makes people sick (spec: vection).
//   • Gentle speed. The approach is a constant-velocity segment with short
//     soft ramps, not a strong ease-in/ease-out: speed changes also raise
//     sickness (perception review P4-B).
//   • Faces are read, then glassed. At the peak a still is fully opaque for
//     one shared readable hold (1.0 s, all stills), then it goes to glass
//     as it passes through. (P4-B replaced the spec's 0.88 peak opacity:
//     a see-through face is harder to read.)
//   • The ask is made once. Missed or shut, it is not re-asked; a quiet
//     "Start here" link stays instead.
//   • A still that has no image is skipped, never replaced. There is no
//     stock, generated or placeholder face anywhere in this flow.
// ============================================================

export const COLD_START_ID = "LOGIN_COLD_START" as const;

/**
 * House colours for the C-major field. Neutral names only: nothing here is
 * named after a hormone. The spec's mint (#B8FFCE) measures about 1.0:1
 * against the cream field — invisible — so on cream the filaments are sage
 * and the edge pulse is a deep mint; the light mint is kept for dark fields.
 */
export const HOUSE_COLORS = {
  field: "#F4EFE6",
  ink: "#1C1A17",
  filament: "#7C9A82",
  accentPulse: "#2F7D55",
  accentOnDark: "#B8FFCE",
} as const;

export type StillId = "STILL_MOUNTAIN" | "STILL_DINNER" | "STILL_WEDDING" | "STILL_BEACH";
export type AssetId = StillId | "PLATE_START_HERE";
export const STILL_IDS: readonly StillId[] = ["STILL_MOUNTAIN", "STILL_DINNER", "STILL_WEDDING", "STILL_BEACH"];

export type MotionName = "ghost_through" | "ask_through";
export type MotionCurve = {
  approachS: number;
  /** Time held at the peak. For ask_through this is the opaque hold. */
  holdS: number;
  exitS: number;
  /** [start, peak, end] — strictly rising: forward expand only. */
  scale: readonly [number, number, number];
  opacity: readonly [number, number, number];
};

export const MOTION_CURVES: Readonly<Record<MotionName, MotionCurve>> = {
  ghost_through: { approachS: 1.8, holdS: 1.0, exitS: 0.7, scale: [0.18, 0.72, 1.05], opacity: [0.0, 1.0, 0.0] },
  ask_through: { approachS: 1.6, holdS: 1.4, exitS: 0.8, scale: [0.22, 1.15, 1.35], opacity: [0.0, 1.0, 0.0] },
};

/** One readable hold for every still, fully opaque (synthesis review: at least 1.0 s). */
export const STILL_READABLE_HOLD_S = 1.0;

/** prefers-reduced-motion: stills crossfade 800 ms, no scale-through, plate static centre, filaments off. */
export const REDUCED_MOTION_CROSSFADE_S = 0.8;

/**
 * The ask plate's lines. Real text, so it works with no plate art. Six words
 * at most so it can be read in the 1.4 s hold (regulatory review); the
 * spec's third line — "We keep the map. We destroy the answers." — moved to
 * the consent screen, where the fuller retention promise is written out.
 */
export const PLATE_LINES = ["START HERE", "Your Wealth Genome", "Optional"] as const;
export const PLATE_MAX_WORDS = 6;

/** Default spoken greeting. The owner overrides it with FIRST_LOGIN_GREETING; no client name ever lives in code. */
export const DEFAULT_GREETING = "Hi. Welcome home.";
export const HOUSEHOLD_LINE = "This is the household.";

/** Where a click on the plate goes: the consent screen of the genome intake. Never an engine. */
export const PLATE_CLICK_TARGET = "/portal/genome-intake";

export type StillBeat = {
  atS: number;
  asset: StillId;
  motion: "ghost_through";
  readableFacesMinS: number;
  peakScale: number;
  peakOpacity: number;
  endOpacity: number;
  require?: "mutual_gaze_not_lens";
};
export type PlateBeat = {
  atS: number;
  asset: "PLATE_START_HERE";
  motion: "ask_through";
  peakScale: number;
  holdOpaqueS: number;
};

/** The spec's beats after the two greeting lines, in order. */
export const STILL_BEATS: readonly StillBeat[] = [
  { atS: 4.0, asset: "STILL_MOUNTAIN", motion: "ghost_through", readableFacesMinS: STILL_READABLE_HOLD_S, peakScale: 0.72, peakOpacity: 1, endOpacity: 0 },
  { atS: 8.0, asset: "STILL_DINNER", motion: "ghost_through", readableFacesMinS: STILL_READABLE_HOLD_S, peakScale: 0.7, peakOpacity: 1, endOpacity: 0 },
  // The wedding still must show a mutual gaze, not a look into the lens: an art-direction rule for whoever supplies the image.
  { atS: 12.0, asset: "STILL_WEDDING", motion: "ghost_through", readableFacesMinS: STILL_READABLE_HOLD_S, peakScale: 0.74, peakOpacity: 1, endOpacity: 0, require: "mutual_gaze_not_lens" },
];
export const PLATE_BEAT: PlateBeat = { atS: 16.0, asset: "PLATE_START_HERE", motion: "ask_through", peakScale: 1.15, holdOpaqueS: 1.4 };

/** Vection limits (spec: vection.params, variable_reward). */
export const VECTION = {
  peripheralFilamentSpeedPxS: 28,
  maxObjectsOnScreen: 2,
  restAfterS: 45,
  restS: 3,
  maxAsksPerMinute: 2,
  maxGhostsPerMinute: 4,
} as const;

export type EntrySide = "left" | "right" | "center";

/** One object's pass through the field. Times in seconds from the start of the cold start. */
export type ObjectPass = {
  kind: "object";
  asset: AssetId;
  motion: MotionName;
  atS: number;
  approachS: number;
  holdS: number;
  exitS: number;
  scale: readonly [number, number, number];
  opacity: readonly [number, number, number];
  entrySide: EntrySide;
  /** Seconds the object must stay readable before it goes to glass (stills). */
  readableMinS: number;
};
export type LineEvent = { kind: "line"; atS: number; text: string };
export type TimelineEvent = ObjectPass | LineEvent;

export const passEnd = (p: ObjectPass): number => p.atS + p.approachS + p.holdS + p.exitS;

/** Coin flip for which side a still enters from (VR05). Plates always come down the centre. */
export type CoinFlip = () => boolean;

function stillPass(beat: StillBeat, reduced: boolean, side: EntrySide): ObjectPass {
  const c = MOTION_CURVES.ghost_through;
  const holdS = Math.max(c.holdS, beat.readableFacesMinS);
  if (reduced) {
    // Crossfade only: fixed size, no travel, 800 ms in and out.
    return {
      kind: "object", asset: beat.asset, motion: "ghost_through", atS: beat.atS,
      approachS: REDUCED_MOTION_CROSSFADE_S, holdS, exitS: REDUCED_MOTION_CROSSFADE_S,
      scale: [beat.peakScale, beat.peakScale, beat.peakScale],
      opacity: [0, beat.peakOpacity, beat.endOpacity],
      entrySide: "center", readableMinS: beat.readableFacesMinS,
    };
  }
  return {
    kind: "object", asset: beat.asset, motion: "ghost_through", atS: beat.atS,
    approachS: c.approachS, holdS, exitS: c.exitS,
    scale: [c.scale[0], beat.peakScale, c.scale[2]],
    opacity: [c.opacity[0], beat.peakOpacity, beat.endOpacity],
    entrySide: side, readableMinS: beat.readableFacesMinS,
  };
}

export function platePass(atS: number, reduced: boolean): ObjectPass {
  const c = MOTION_CURVES.ask_through;
  if (reduced) {
    // Static centre: the plate appears and waits, no scale-through.
    return {
      kind: "object", asset: "PLATE_START_HERE", motion: "ask_through", atS,
      approachS: REDUCED_MOTION_CROSSFADE_S, holdS: PLATE_BEAT.holdOpaqueS, exitS: REDUCED_MOTION_CROSSFADE_S,
      scale: [PLATE_BEAT.peakScale, PLATE_BEAT.peakScale, PLATE_BEAT.peakScale],
      opacity: [0, 1, 0], entrySide: "center", readableMinS: PLATE_BEAT.holdOpaqueS,
    };
  }
  return {
    kind: "object", asset: "PLATE_START_HERE", motion: "ask_through", atS,
    approachS: c.approachS, holdS: PLATE_BEAT.holdOpaqueS, exitS: c.exitS,
    scale: [c.scale[0], PLATE_BEAT.peakScale, c.scale[2]],
    opacity: [c.opacity[0], c.opacity[1], c.opacity[2]],
    entrySide: "center", readableMinS: PLATE_BEAT.holdOpaqueS,
  };
}

export type TimelineOptions = {
  /** Stills that have an image. A still missing here is skipped, never substituted. */
  available: ReadonlySet<StillId>;
  reducedMotion: boolean;
  greeting?: string;
  coin?: CoinFlip;
};

/** The first pass: two lines, the stills that exist in spec order, then the plate at 16 s. */
export function buildColdStartTimeline(opts: TimelineOptions): TimelineEvent[] {
  const greeting = (opts.greeting ?? "").trim() || DEFAULT_GREETING;
  const coin = opts.coin ?? (() => true);
  const out: TimelineEvent[] = [
    { kind: "line", atS: 0.2, text: greeting },
    { kind: "line", atS: 0.4, text: HOUSEHOLD_LINE },
  ];
  for (const beat of STILL_BEATS) {
    if (!opts.available.has(beat.asset)) continue;
    out.push(stillPass(beat, opts.reducedMotion, opts.reducedMotion ? "center" : coin() ? "left" : "right"));
  }
  out.push(platePass(PLATE_BEAT.atS, opts.reducedMotion));
  return out;
}

export type Phase = "waiting" | "approach" | "hold" | "exit" | "done";
export type Sample = { phase: Phase; scale: number; opacity: number; /** -1 … 1 of the entry offset still to travel. */ travel: number };

/** Share of the approach spent ramping up (and again ramping down). The rest is constant velocity. */
export const APPROACH_RAMP = 0.15;

/**
 * Progress along a trapezoidal velocity profile: a short soft ramp up, a
 * constant-velocity middle, a short soft ramp down. Monotone on [0, 1], and
 * gentler on the vestibular system than easeInOutCubic (P4-B).
 */
export function gentleProgress(x: number, ramp = APPROACH_RAMP): number {
  const t = Math.min(1, Math.max(0, x));
  const v = 1 / (1 - ramp); // cruise velocity, so the area under the profile is 1
  if (t < ramp) return (v / (2 * ramp)) * t * t;
  if (t <= 1 - ramp) return (v * ramp) / 2 + v * (t - ramp);
  const u = 1 - t;
  return 1 - (v / (2 * ramp)) * u * u;
}

/** Peak speed ÷ cruise speed on the approach: 1 means no acceleration spike at all. */
export function approachSpeedRange(ramp = APPROACH_RAMP): { min: number; max: number } {
  return { min: 0, max: 1 / (1 - ramp) };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Where an object is at time `tS`. Scale only ever rises through the pass. */
export function samplePass(p: ObjectPass, tS: number): Sample {
  const local = tS - p.atS;
  if (local < 0) return { phase: "waiting", scale: p.scale[0], opacity: 0, travel: 1 };
  if (local < p.approachS) {
    const e = gentleProgress(local / p.approachS);
    return { phase: "approach", scale: lerp(p.scale[0], p.scale[1], e), opacity: lerp(p.opacity[0], p.opacity[1], e), travel: 1 - e };
  }
  if (local < p.approachS + p.holdS) return { phase: "hold", scale: p.scale[1], opacity: p.opacity[1], travel: 0 };
  const exitLocal = local - p.approachS - p.holdS;
  if (exitLocal < p.exitS) {
    // Constant velocity through the glass: no deceleration on the way out.
    const e = exitLocal / p.exitS;
    return { phase: "exit", scale: lerp(p.scale[1], p.scale[2], e), opacity: lerp(p.opacity[1], p.opacity[2], e), travel: 0 };
  }
  return { phase: "done", scale: p.scale[2], opacity: p.opacity[2], travel: 0 };
}

/** The window in which a face is readable: held at its peak, before it goes to glass. */
export function readableWindow(p: ObjectPass): { startS: number; endS: number; seconds: number } {
  const startS = p.atS + p.approachS;
  const endS = startS + p.holdS;
  return { startS, endS, seconds: endS - startS };
}

/** Objects on screen at `tS` (visible means started and not finished). */
export function objectsOnScreen(passes: readonly ObjectPass[], tS: number): ObjectPass[] {
  return passes.filter((p) => tS >= p.atS && tS < passEnd(p));
}

export const isObject = (e: TimelineEvent): e is ObjectPass => e.kind === "object";

// ─── The ask, asked once ──────────────────────────────────────────────────
//
// The plate passes once per login session. If it is missed or shut, it is
// NOT brought back automatically: a small, still "Start here" link stays on
// screen instead, for as long as the visitor wants it (START_HERE_LINK).
//
// This supersedes the spec's recycle rule A (VR01 "skip one arrival, return
// on the second", VR02 "one more try after a floor change") and the later
// "return once" rule. The regulatory review found that repeated re-asks read
// as nagging and can undermine consent; the perception review found an
// uncertain return is a slot-machine schedule. VR03 (shut it for the
// session) and VR05 (never two asks at once) stand.

export const START_HERE_LINK = { label: "Start here", sublabel: "Wealth Genome · optional", href: "/portal/genome-intake" } as const;

export type RecycleState = {
  /** The plate passed without a click. */
  missed: boolean;
  /** VR03: the visitor shut the invitation for this session. */
  dismissed: boolean;
  accepted: boolean;
  /** When each ask was shown, ms since epoch. */
  askTimesMs: number[];
};

export const initialRecycleState = (): RecycleState => ({ missed: false, dismissed: false, accepted: false, askTimesMs: [] });

export type RecycleEvent =
  | { type: "plate_shown"; atMs: number }
  | { type: "plate_missed" }
  | { type: "plate_clicked" }
  | { type: "dismiss" };

export function recycleReducer(s: RecycleState, e: RecycleEvent): RecycleState {
  switch (e.type) {
    case "plate_shown":
      return { ...s, askTimesMs: [...s.askTimesMs, e.atMs].slice(-8) };
    case "plate_clicked":
      return { ...s, accepted: true };
    case "dismiss":
      return { ...s, dismissed: true };
    case "plate_missed":
      return { ...s, missed: true };
  }
}

/** No more than two asks in any rolling minute (spec). With one ask per session it can never bind; kept as a guard. */
export function canAsk(askTimesMs: readonly number[], nowMs: number): boolean {
  return askTimesMs.filter((t) => nowMs - t < 60_000).length < VECTION.maxAsksPerMinute;
}

/** The plate is finished for this session the moment it is taken, shut or missed. */
export function plateRetired(s: RecycleState): boolean {
  return s.accepted || s.dismissed || s.missed;
}

export type NextArrival = { kind: "ghost" } | { kind: "plate" };

/** What flies after a miss: nothing. The plate never comes back on its own. */
export function arrivalsAfterMiss(_s: RecycleState): NextArrival[] {
  return [];
}

/** Show the quiet "Start here" link: the ask was missed or shut, not taken. */
export function showStartHereLink(s: RecycleState): boolean {
  return !s.accepted && (s.missed || s.dismissed);
}

/** Continuous flow is capped at 45 s (then a 3 s rest). The whole cold start ends well inside it. */
export function timelineEndS(events: readonly TimelineEvent[]): number {
  return Math.max(0, ...events.filter(isObject).map(passEnd));
}

// ─── Viewer preferences (per browser) ─────────────────────────────────────

export const PREF_KEYS = {
  /** Master mute, persisted across visits and floors. */
  mute: "rcs.firstLogin.mute.v1",
  /** Halt travel: remembered, so later visits stay still. */
  halt: "rcs.firstLogin.halt.v1",
  /** Per-login session state: played, dismissed, misses. */
  session: "rcs.firstLogin.session.v1",
} as const;

export type ColdStartSession = { userId: number; played: boolean; recycle: RecycleState };

/** Pages where the cold start never plays: the Door itself and the room it leads to. */
export const NO_COLD_START_PATHS: readonly string[] = [
  "/login", "/register", "/forgot-password", "/reset-password", "/invite", "/trial",
  "/administrator", "/executive", "/onboarding", PLATE_CLICK_TARGET,
];

export function coldStartAllowedOn(path: string): boolean {
  return !NO_COLD_START_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}
