/**
 * Readiness evidence adapters — the seam between what an edition is allowed
 * to know about a person and the psychometric-financial bridge.
 *
 * The bridge itself (psychFinancialBridge.ts) is edition-blind: it reads a
 * ClinicalSnapshot and returns guardrails. This module builds that snapshot
 * from whichever sources an edition may use, and rewrites the profile's
 * wording for the public wellness edition, where nothing may read as a
 * clinical instrument, a risk score, or a diagnosis.
 *
 *   Clinical edition  digital-twin history, medication adherence, mental
 *                     credit score, the DSM-oriented intake (server side,
 *                     authenticated, finance.readiness).
 *   Public edition    the person's own 1-5 wellness check-ins, kept in their
 *                     browser, plus a pause they chose themselves. No clinical
 *                     procedure is called and no clinical field is shown.
 *
 * Everything here is pure and shared by the browser and the server so the two
 * can never disagree about what a check-in means.
 */

import {
  mergeSnapshots,
  volatilityFromHistory,
  type ClinicalSnapshot,
  type FinancialReadinessProfile,
} from "./psychFinancialBridge";
import type { VitalSignVector } from "./vitalSigns";

// ─── Clinical edition: digital-twin history ──────────────────────────────────

export interface TwinSnapshotLike {
  timestamp: string | Date;
  domainScores?: Record<string, number> | null;
  compositeScore?: number | null;
}

/**
 * Read a domain score under either naming scheme the twin has used. The
 * server writes `moodRegulation` / `anxietyManagement` / `sleepQuality` /
 * `socialEngagement`; an earlier client read `mood` / `anxiety` / `sleep` /
 * `socialFunction` and silently fell back to defaults every time. Reading
 * both closes that gap. Every twin domain is "higher is better".
 */
/** Milliseconds for a timestamp that is a string, a number or a Date; NaN otherwise. */
export function whenMs(v: unknown): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string" || typeof v === "number") return new Date(v).getTime();
  return Number.NaN;
}

function domain(d: Record<string, number>, keys: string[], fallback: number): number {
  for (const k of keys) {
    const v = d[k];
    if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.min(100, v));
  }
  return fallback;
}

/** Turn twin history into the bridge's own vector shape, oldest first. */
export function vectorsFromTwin(history: TwinSnapshotLike[], adherencePct: number | null): VitalSignVector[] {
  const out: VitalSignVector[] = [];
  if (!Array.isArray(history)) return out;
  const sorted = [...history]
    .filter(s => s && typeof s === "object" && s.domainScores && typeof s.domainScores === "object" && Number.isFinite(whenMs(s.timestamp)))
    .sort((a, b) => whenMs(a.timestamp) - whenMs(b.timestamp));
  for (const snap of sorted) {
    const d = snap.domainScores as Record<string, number>;
    out.push({
      moodStability: domain(d, ["moodRegulation", "mood"], 60),
      anxietyBurden: 100 - domain(d, ["anxietyManagement", "anxiety"], 60),
      socialEngagement: domain(d, ["socialEngagement", "socialFunction"], 60),
      circadianIntegrity: domain(d, ["sleepQuality", "sleep"], 60),
      treatmentEngagement: adherencePct ?? 70,
    });
  }
  return out;
}

/** Medication adherence from the log, as a percentage, or null with no log. */
export function adherenceFromLogs(logs: Array<{ skipped?: boolean | null }> | null | undefined): number | null {
  if (!Array.isArray(logs) || logs.length === 0) return null;
  const taken = logs.filter(l => !l?.skipped).length;
  return Math.round((taken / logs.length) * 100);
}

/** Snapshot from twin history and adherence; null when there is nothing to read. */
export function snapshotFromTwinHistory(history: TwinSnapshotLike[], rawAdherence: number | null): ClinicalSnapshot | null {
  const adherencePct = typeof rawAdherence === "number" && Number.isFinite(rawAdherence) ? Math.max(0, Math.min(100, rawAdherence)) : null;
  const vectors = vectorsFromTwin(history, adherencePct);
  if (vectors.length === 0) {
    if (adherencePct === null) return null;
    return { sources: ["medication-log"], observed: ["adherence"], adherence: adherencePct / 100 };
  }
  const latest = vectors[vectors.length - 1];
  const snap: ClinicalSnapshot = {
    sources: ["digital-twin"],
    observed: ["anxiety", "moodStability"],
    anxiety: Math.max(0, Math.min(100, latest.anxietyBurden)),
    moodStability: latest.moodStability,
  };
  if (adherencePct !== null) {
    snap.adherence = adherencePct / 100;
    snap.observed.push("adherence");
    snap.sources.push("medication-log");
  }
  const vol = volatilityFromHistory(vectors);
  if (vol !== null) {
    snap.volatility = vol;
    snap.observed.push("volatility");
  }
  return snap;
}

// ─── Public edition: the person's own wellness check-ins ─────────────────────

/** One saved check-in from /progress in the public edition (newest first in storage). */
export interface WellnessCheckin {
  id?: string;
  createdAt: string;
  /** 1-5 for mood, energy, sleep, connection, focus. */
  scores: Record<string, number>;
  average?: number;
}

const CHECKIN_KEYS = ["mood", "energy", "sleep", "connection", "focus"] as const;

function rating(scores: Record<string, number> | null | undefined, key: string): number | null {
  const v = scores?.[key];
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(1, Math.min(5, v));
}

/** 1-5 → 0-100. */
const pct = (v: number) => ((v - 1) / 4) * 100;

function isCheckin(c: unknown): c is WellnessCheckin {
  if (!c || typeof c !== "object") return false;
  const s = (c as WellnessCheckin).scores;
  return !!s && typeof s === "object" && CHECKIN_KEYS.some(k => typeof (s as Record<string, unknown>)[k] === "number");
}

/**
 * Wellness-safe proxies. Steadiness comes from mood, energy and connection;
 * load from rest and focus; change from how much the averages have moved
 * across the trailing check-ins. Nothing here is a clinical scale, and no
 * safety level is ever inferred from a 1-5 rating.
 */
export function snapshotFromWellnessCheckins(raw: unknown, now: number = Date.now()): ClinicalSnapshot | null {
  if (!Array.isArray(raw)) return null;
  const cutoff = now - 90 * 24 * 60 * 60 * 1000;
  const recent = raw
    .filter(isCheckin)
    .filter(c => {
      const t = whenMs(c.createdAt);
      return Number.isFinite(t) && t >= cutoff && t <= now + 60_000;
    })
    .sort((a, b) => whenMs(b.createdAt) - whenMs(a.createdAt));
  if (recent.length === 0) return null;

  const latest = recent[0];
  const mood = rating(latest.scores, "mood");
  const energy = rating(latest.scores, "energy");
  const sleep = rating(latest.scores, "sleep");
  const connection = rating(latest.scores, "connection");
  const focus = rating(latest.scores, "focus");

  const snap: ClinicalSnapshot = { sources: ["wellness-check-in"], observed: [] };
  const steadyParts = [mood, energy, connection].filter((v): v is number => v !== null);
  if (steadyParts.length) {
    snap.moodStability = Math.round(pct(steadyParts.reduce((a, b) => a + b, 0) / steadyParts.length));
    snap.observed.push("moodStability");
  }
  const loadParts = [sleep, focus].filter((v): v is number => v !== null);
  if (loadParts.length) {
    snap.anxiety = Math.round(100 - pct(loadParts.reduce((a, b) => a + b, 0) / loadParts.length));
    snap.observed.push("anxiety");
  }
  if (focus !== null) {
    snap.cognitiveLoad = Math.round(100 - pct(focus));
    snap.observed.push("cognitiveLoad");
  }
  if (recent.length >= 3) {
    const averages = recent.slice(0, 12).map(c => {
      const vals = CHECKIN_KEYS.map(k => rating(c.scores, k)).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }).filter((v): v is number => v !== null);
    if (averages.length >= 3) {
      const mean = averages.reduce((a, b) => a + b, 0) / averages.length;
      const sd = Math.sqrt(averages.reduce((a, b) => a + (b - mean) ** 2, 0) / averages.length);
      // A 1-5 series with sd 2 has swung across the whole scale.
      snap.volatility = Math.round(Math.max(0, Math.min(100, (sd / 2) * 100)));
      snap.observed.push("volatility");
    }
  }
  return snap;
}

// ─── A pause the person chose ────────────────────────────────────────────────

/** A cooling-off period the person set for themselves. Reversible by them alone. */
export interface SelfPause {
  startedAt: number;
  days: number;
}

export const MAX_PAUSE_DAYS = 90;

export function pauseActive(pause: SelfPause | null | undefined, now: number = Date.now()): boolean {
  if (!pause) return false;
  if (!Number.isFinite(pause.startedAt) || !Number.isFinite(pause.days) || pause.days <= 0) return false;
  return now < pause.startedAt + Math.min(pause.days, MAX_PAUSE_DAYS) * 24 * 60 * 60 * 1000;
}

export function pauseDaysLeft(pause: SelfPause | null | undefined, now: number = Date.now()): number {
  if (!pauseActive(pause, now)) return 0;
  const end = (pause as SelfPause).startedAt + Math.min((pause as SelfPause).days, MAX_PAUSE_DAYS) * 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
}

/**
 * Apply a self-chosen pause to a profile. Rule 2 of the bridge holds here
 * too: a pause can only tighten. It never raises capacity, never shortens a
 * cooling-off period, never unlocks anything.
 */
export function applyPause(profile: FinancialReadinessProfile, pause: SelfPause | null | undefined, now: number = Date.now()): FinancialReadinessProfile {
  if (!pauseActive(pause, now)) return profile;
  const left = pauseDaysLeft(pause, now);
  return {
    ...profile,
    guardrails: {
      ...profile.guardrails,
      irreversibleLocked: true,
      coolingOffDays: Math.max(profile.guardrails.coolingOffDays, left),
    },
    explanation: [
      `You paused every irreversible step for ${left} more day${left === 1 ? "" : "s"}. Education and protection planning continue; nothing that cannot be undone is initiated. You can lift the pause at any time.`,
      ...profile.explanation,
    ],
  };
}

// ─── Public wording ──────────────────────────────────────────────────────────

const PUBLIC_REWRITES: Array<[RegExp, string]> = [
  [/C-SSRS\s*[≥>=]+\s*\d(?:\s*or\s*escalation\s*[≥>=]*\s*\d)?/gi, "a safety note"],
  [/C-SSRS\s*\d\s*-\s*\d(?:\s*or\s*escalation\s*\d)?/gi, "a safety note"],
  [/C-SSRS/gi, "safety"],
  [/active safety signal/gi, "a safety note you raised"],
  [/elevated safety signal/gi, "a safety note you raised"],
  [/safety signal/gi, "safety note"],
  [/advisor and (your|the) clinician/gi, "advisor and someone you trust"],
  [/advisor–clinician/gi, "advisor and trusted-person"],
  [/treating clinician/gi, "someone you trust"],
  [/clinician/gi, "someone you trust"],
  [/clinical picture/gi, "your own check-ins"],
  [/clinical data/gi, "check-in data"],
  [/clinical (source|sources)/gi, "check-in $1"],
  [/psychiatr\w*/gi, "wellness"],
  [/diagnos\w*/gi, "check-in"],
  [/patient/gi, "person"],
];

function publicText(s: string): string {
  let out = s;
  for (const [re, rep] of PUBLIC_REWRITES) out = out.replace(re, rep);
  return out;
}

/** Words that must never reach a public-edition screen. Tested, and fuzzed. */
export const PUBLIC_FORBIDDEN = /c-ssrs|clinic|psychiatr|diagnos|patient|escalation level|risk score/i;

/**
 * Rewrite every human-readable string in a profile for the public wellness
 * edition. The numbers do not change; only the words do. The clinical note,
 * written for an advisor and a clinician, is dropped entirely.
 */
export function publicSafeProfile(profile: FinancialReadinessProfile): FinancialReadinessProfile {
  return {
    ...profile,
    cappedBy: profile.cappedBy ? publicText(profile.cappedBy) : null,
    clinicalNote: "",
    explanation: profile.explanation.map(publicText),
    strategies: profile.strategies.map(s => ({ ...s, reasons: s.reasons.map(publicText) })),
    calculators: profile.calculators.map(c => ({ ...c, reason: publicText(c.reason) })),
    assumptions: profile.assumptions.map(publicText),
    sources: profile.sources.map(publicText),
  };
}

/** Every string in a profile, for the public-wording invariant. */
export function profileStrings(profile: FinancialReadinessProfile): string[] {
  return [
    profile.cappedBy ?? "",
    profile.clinicalNote,
    ...profile.explanation,
    ...profile.strategies.flatMap(s => [s.title, ...s.reasons]),
    ...profile.calculators.flatMap(c => [c.name, c.reason]),
    ...profile.assumptions,
    ...profile.sources,
  ];
}

/** Merge whatever parts exist, or nothing. */
export function mergeParts(parts: Array<ClinicalSnapshot | null | undefined>): ClinicalSnapshot {
  const real = parts.filter((p): p is ClinicalSnapshot => !!p);
  return real.length ? mergeSnapshots(...real) : { sources: [], observed: [] };
}
