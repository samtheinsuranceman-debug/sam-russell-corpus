/**
 * TAKEN APART — the pure engines, 10,000 adversarial runs.
 *
 * Every engine is called on its own with inputs no form would ever send:
 * NaN, ±Infinity, 1e308, negative counts, empty and 65 KB strings, unicode,
 * prototype-pollution keys, wrong types, missing fields. The invariants:
 *
 *   1. never throws (except the two documented "needs at least one point"
 *      preconditions, which must throw a plain Error and nothing else);
 *   2. never emits a non-finite number anywhere in its result;
 *   3. deterministic: the same input gives the same output;
 *   4. safety is monotone: adding a disclosure of intent can only raise a
 *      crisis level, never lower it; a safety signal can only cap financial
 *      capacity, never raise it; worse ratings never loosen a guardrail;
 *   5. no clinical word reaches a public-edition finance profile.
 *
 * Replay any failure with CHAOS_SEED=<seed> printed in the message.
 */
import { describe, expect, it } from "vitest";
import { Rng, Tally, anyValue, nonFinitePaths, numberIn, objectOf, rootSeed, weirdNumber, weirdString, WEIRD_STRINGS, PROTO_KEYS } from "./rng";
import { assessCSSRS, assessCrisisRisk, fuseRiskScore, deriveBaseline, escalationFor, type DailyTelemetry } from "@shared/engines/crisisDetection";
import { scoreIntake } from "@shared/intake/scoring";
import { DSM5_QUESTIONS } from "@shared/intake/questions";
import { deriveRiskFeatures } from "@shared/intake/riskFeatures";
import { assessRisk, FEATURE_KEYS, type RiskFeatures } from "@shared/engines/riskScoring";
import { computeMCS, zoneFor } from "@shared/engines/mentalCreditScore";
import { computeVitalSigns, monitorVitalSigns, interpretVitalSign, STREAM_KEYS, type PsychiatricDataPoint } from "@shared/engines/vitalSigns";
import { initializeSession, selectNextItem, applyResponse, generateDifferential, ITEM_BANK, TRAIT_DIMENSIONS } from "@shared/engines/adaptiveAssessment";
import { assessFinancialReadiness, tierFor, type ClinicalSnapshot } from "@shared/engines/psychFinancialBridge";
import { PUBLIC_FORBIDDEN, applyPause, profileStrings, publicSafeProfile, snapshotFromWellnessCheckins, snapshotFromTwinHistory } from "@shared/engines/readinessEvidence";
import { ALL_CALCS, runCalc, coerceValues } from "@shared/finance/calc";

const SEED = rootSeed();
const TIMEOUT = 300_000;

function stable(v: unknown): string {
  return JSON.stringify(v, (_k, x) => (typeof x === "number" && !Number.isFinite(x) ? `#${String(x)}` : x));
}

/** Assert nothing non-finite, naming the first offending path. */
function finite(value: unknown, label: string) {
  expect(nonFinitePaths(value).join(", "), `${label}: non-finite at`).toBe("");
}

function guard(t: Tally, label: string, seed: number, fn: () => void) {
  t.runs += 1;
  try {
    fn();
  } catch (e) {
    t.fail(`${label} seed=${seed}: ${(e as Error).message?.slice(0, 200)}`);
  }
}

const SNAPSHOT_KEYS = ["anxiety", "moodStability", "impulsivity", "volatility", "cognitiveLoad", "adherence", "cssrsLevel", "escalationLevel", "substanceUseDays"] as const;

describe("engines apart: 10,000 adversarial runs", () => {
  const root = new Rng(SEED);

  it("C-SSRS text screen: never throws, level 0-5, deterministic, monotone in disclosure (1,500 runs)", () => {
    const r = root.child("cssrs");
    const t = new Tally();
    for (let i = 0; i < 1500; i++) {
      const seed = i;
      const text = r.bool(0.5) ? weirdString(r, r.bool(0.05) ? 60_000 : 300) : `${r.pick(WEIRD_STRINGS)} ${weirdString(r, 40)}`;
      guard(t, "assessCSSRS", seed, () => {
        const a = assessCSSRS(text);
        expect(Number.isInteger(a.level) && a.level >= 0 && a.level <= 5).toBe(true);
        expect(Array.isArray(a.triggers)).toBe(true);
        finite(a, "value");
        expect(stable(assessCSSRS(text))).toBe(stable(a));
        const escalated = assessCSSRS(`${text} I have a plan and I'm going to end my life tonight.`);
        expect(escalated.level).toBeGreaterThanOrEqual(a.level);
        expect(escalated.level).toBeGreaterThanOrEqual(4);
        t.hit(`level${a.level}`);
      });
    }
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(1500);
  });

  it("DSM-5 intake scoring and risk features: never throw, no NaN, proto keys ignored (1,500 runs)", () => {
    const r = root.child("intake");
    const t = new Tally();
    for (let i = 0; i < 1500; i++) {
      const answers: Record<string, string> = {};
      const n = r.int(0, 120);
      for (let k = 0; k < n; k++) {
        const q = r.pick(DSM5_QUESTIONS);
        const key = r.bool(0.05) ? r.pick(PROTO_KEYS) : r.bool(0.1) ? weirdString(r, 8) : String(q.id);
        answers[key] = r.bool(0.2) ? weirdString(r, 30) : r.pick(q.options);
      }
      if (r.bool(0.1)) (answers as Record<string, unknown>)[r.int(0, 200)] = anyValue(r);
      guard(t, "scoreIntake", i, () => {
        const result = scoreIntake(answers);
        finite(result, "value");
        expect(Array.isArray(result.domains)).toBe(true);
        expect(typeof result.safety.flagged).toBe("boolean");
        const derived = deriveRiskFeatures(answers);
        finite(derived, "value");
        expect(derived.features.cssrsLevel).toBeGreaterThanOrEqual(0);
        expect(derived.features.cssrsLevel).toBeLessThanOrEqual(5);
        expect(stable(scoreIntake(answers))).toBe(stable(result));
        t.hit(result.safety.flagged ? "flagged" : "clear");
      });
    }
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(1500);
  });

  it("risk scoring with conformal intervals: garbage features never throw or produce NaN (1,000 runs)", () => {
    const r = root.child("risk");
    const t = new Tally();
    for (let i = 0; i < 1000; i++) {
      const features = objectOf(r, FEATURE_KEYS, k => (k === "adherence" ? numberIn(r, 0, 1) : k === "cssrsLevel" ? r.int(0, 5) : numberIn(r, 0, 100)), 0.25) as unknown as RiskFeatures;
      const calibration = Array.from({ length: r.int(0, 8) }, () => ({ features: objectOf(r, FEATURE_KEYS, () => numberIn(r, 0, 100), 0.1) as unknown as RiskFeatures, outcome: weirdNumber(r) }));
      guard(t, "assessRisk", i, () => {
        const a = assessRisk(features, calibration as never, { coverage: r.bool(0.2) ? weirdNumber(r) : 0.9 });
        finite(a, "value");
        expect(stable(assessRisk(features, calibration as never, { coverage: 0.9 }))).toBe(stable(assessRisk(features, calibration as never, { coverage: 0.9 })));
        t.hit(`band:${String(a.band)}`);
      });
    }
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(1000);
  });

  it("mental credit score: any observation shape, no NaN, valid zone, crisis caps hold (1,000 runs)", () => {
    const r = root.child("mcs");
    const t = new Tally();
    const date = () => (r.bool(0.15) ? weirdString(r, 12) : new Date(Date.now() - r.int(0, 200) * 86_400_000).toISOString());
    for (let i = 0; i < 1000; i++) {
      const obs = {
        checkins: r.bool(0.8) ? Array.from({ length: r.int(0, 20) }, () => ({ overallScore: r.bool(0.1) ? null : numberIn(r, 0, 100), checkinDate: date() })) : anyValue(r),
        journal: r.bool(0.8) ? Array.from({ length: r.int(0, 20) }, () => ({ moodScore: r.bool(0.1) ? null : numberIn(r, 0, 10), riskFlagged: r.bool(0.1), createdAt: date() })) : anyValue(r),
        medicationLogs: r.bool(0.8) ? Array.from({ length: r.int(0, 30) }, () => ({ skipped: r.bool(0.3), takenAt: date() })) : anyValue(r),
        twinComposite: r.bool(0.2) ? null : numberIn(r, 0, 100),
        crisisEvents: r.bool(0.7) ? Array.from({ length: r.int(0, 4) }, () => ({ tier: r.pick(["tier1_emergency", "tier2_high_risk", "tier3_elevated", null, weirdString(r, 8)]), createdAt: date() })) : anyValue(r),
        prsScore: r.bool(0.3) ? null : numberIn(r, 0, 1000),
      };
      guard(t, "computeMCS", i, () => {
        const result = computeMCS(obs as never);
        finite(result, "value");
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1000);
        expect(["critical", "elevated", "guarded", "resilient", "optimal"]).toContain(result.riskZone);
        expect(zoneFor(result.score)).toBe(result.riskZone);
        t.hit(result.riskZone);
      });
    }
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(1000);
  });

  it("vital signs: garbage streams never throw with ≥1 point, no NaN, interpretation valid (1,000 runs)", () => {
    const r = root.child("vitals");
    const t = new Tally();
    const point = (): PsychiatricDataPoint => objectOf(r, ["date", ...STREAM_KEYS], k => (k === "date" ? new Date(Date.now() - r.int(0, 90) * 86_400_000).toISOString() : k === "adherence" ? numberIn(r, 0, 1) : k === "moodRating" ? numberIn(r, -5, 5) : numberIn(r, 0, 12)), 0.2) as unknown as PsychiatricDataPoint;
    for (let i = 0; i < 1000; i++) {
      const series = Array.from({ length: r.int(0, 40) }, point);
      guard(t, "vitalSigns", i, () => {
        if (series.length === 0) {
          expect(() => monitorVitalSigns(series)).toThrow(/at least one/);
          t.hit("empty-precondition");
          return;
        }
        const one = computeVitalSigns(series[0]);
        finite(one, "value");
        const report = monitorVitalSigns(series);
        finite(report, "value");
        for (const v of Object.values(report.current)) expect(["critical", "impaired", "borderline", "normal", "optimal"]).toContain(interpretVitalSign(v as number));
        expect(stable(monitorVitalSigns(series))).toBe(stable(report));
        t.hit("ok");
      });
    }
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(1000);
  });

  it("crisis fusion and forecast: garbage telemetry never throws with ≥1 day, disclosure dominates (1,000 runs)", () => {
    const r = root.child("crisis");
    const t = new Tally();
    const day = (): DailyTelemetry => objectOf(r, ["date", "nightUsageMinutes", "sleepHours", "socialInteractions", "activityLevel", "text"], k => (k === "date" ? new Date(Date.now() - r.int(0, 30) * 86_400_000).toISOString() : k === "text" ? (r.bool(0.5) ? weirdString(r, 80) : undefined) : numberIn(r, 0, 12_000)), 0.2) as unknown as DailyTelemetry;
    for (let i = 0; i < 1000; i++) {
      const telemetry = Array.from({ length: r.int(0, 21) }, day);
      guard(t, "assessCrisisRisk", i, () => {
        if (telemetry.length === 0) {
          expect(() => assessCrisisRisk(telemetry)).toThrow(/at least one/);
          t.hit("empty-precondition");
          return;
        }
        const a = assessCrisisRisk(telemetry);
        finite(a, "value");
        expect(a.escalation.level).toBeGreaterThanOrEqual(0);
        expect(a.escalation.level).toBeLessThanOrEqual(4);
        // Disclosure dominates: a stated plan on the last day must push the
        // fused score above the crisis threshold whatever the behaviour looks like.
        const disclosed = [...telemetry];
        disclosed[disclosed.length - 1] = { ...disclosed[disclosed.length - 1], text: "I have a plan and I'm going to end my life tonight." };
        const b = assessCrisisRisk(disclosed);
        expect(b.current.score).toBeGreaterThanOrEqual(65);
        expect(b.escalation.level).toBeGreaterThanOrEqual(3);
        expect(b.current.score).toBeGreaterThanOrEqual(a.current.score);
        const base = deriveBaseline(telemetry);
        finite(base, "value");
        finite(fuseRiskScore(telemetry[0], base), "value");
        finite(escalationFor(weirdNumber(r), r.int(0, 5) as 0, null), "value");
        t.hit(`esc${a.escalation.level}`);
      });
    }
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(1000);
  });

  it("adaptive assessment: random and invalid responses never corrupt a trait estimate (500 runs)", () => {
    const r = root.child("adaptive");
    const t = new Tally();
    for (let i = 0; i < 500; i++) {
      guard(t, "adaptive", i, () => {
        let session = initializeSession();
        const steps = r.int(0, ITEM_BANK.length + 3);
        for (let s = 0; s < steps; s++) {
          const item = selectNextItem(session);
          if (!item) break;
          const value = r.bool(0.15) ? (weirdNumber(r) as 0) : (r.int(0, 3) as 0);
          session = applyResponse(session, item, value);
          for (const dim of TRAIT_DIMENSIONS) {
            const est = session.traits[dim];
            expect(Number.isFinite(est.theta), `theta ${dim} after ${String(value)}`).toBe(true);
            expect(Number.isFinite(est.sd) && est.sd > 0, `sd ${dim} after ${String(value)}`).toBe(true);
          }
        }
        const result = generateDifferential(session);
        finite(result, "value");
        t.hit(`items${session.administered.length}`);
      });
    }
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(500);
  });

  it("psych-financial bridge and evidence seam: no NaN, capacity 0-100, safety only caps, public text clean (1,500 runs)", () => {
    const r = root.child("bridge");
    const t = new Tally();
    for (let i = 0; i < 1500; i++) {
      const snapshot = { ...objectOf(r, SNAPSHOT_KEYS, k => (k === "adherence" ? numberIn(r, 0, 1) : k === "cssrsLevel" ? r.int(0, 5) : k === "escalationLevel" ? r.int(0, 4) : k === "substanceUseDays" ? r.int(0, 30) : numberIn(r, 0, 100)), 0.25), sources: r.bool(0.1) ? (anyValue(r) as string[]) : ["fuzz"], observed: r.bool(0.1) ? (anyValue(r) as string[]) : [] } as unknown as ClinicalSnapshot;
      const context = objectOf(r, ["monthlyExpenses", "liquidAssets", "annualIncome", "totalDebt", "homeEquity"], () => numberIn(r, 0, 5_000_000), 0.25);
      guard(t, "bridge", i, () => {
        const p = assessFinancialReadiness(snapshot, context as never);
        finite(p, "value");
        expect(p.decisionCapacity).toBeGreaterThanOrEqual(0);
        expect(p.decisionCapacity).toBeLessThanOrEqual(100);
        expect(tierFor(p.decisionCapacity)).toBe(p.tier);
        expect(p.guardrails.coolingOffDays).toBeGreaterThanOrEqual(0);
        expect(p.guardrails.liquidityFloorMonths).toBeGreaterThanOrEqual(0);
        expect(p.guardrails.leverageMultiplier).toBeGreaterThanOrEqual(0);
        expect(p.guardrails.leverageMultiplier).toBeLessThanOrEqual(1);
        // Safety only ever caps.
        const withSafety = assessFinancialReadiness({ ...snapshot, cssrsLevel: 5, escalationLevel: 4 }, context as never);
        expect(withSafety.decisionCapacity).toBeLessThanOrEqual(p.decisionCapacity);
        expect(withSafety.decisionCapacity).toBeLessThanOrEqual(15);
        expect(withSafety.guardrails.irreversibleLocked).toBe(true);
        expect(withSafety.guardrails.leverageMultiplier).toBeLessThanOrEqual(p.guardrails.leverageMultiplier);
        // Deterministic.
        expect(stable(assessFinancialReadiness(snapshot, context as never))).toBe(stable(p));
        // Public wording.
        for (const s of profileStrings(publicSafeProfile(withSafety))) expect(s, s).not.toMatch(PUBLIC_FORBIDDEN);
        // The evidence seam swallows anything.
        const checkins = snapshotFromWellnessCheckins(r.bool(0.5) ? anyValue(r) : Array.from({ length: r.int(0, 6) }, () => objectOf(r, ["createdAt", "scores"], k => (k === "createdAt" ? new Date(Date.now() - r.int(0, 100) * 86_400_000).toISOString() : objectOf(r, ["mood", "energy", "sleep", "connection", "focus"], () => r.int(1, 5), 0.2)), 0.2)));
        if (checkins) {
          finite(checkins, "value");
          const q = assessFinancialReadiness(checkins, context as never);
          finite(q, "value");
          expect(checkins.cssrsLevel).toBeUndefined();
        }
        finite(snapshotFromTwinHistory(anyValue(r) as never[], r.bool() ? null : weirdNumber(r)) ?? {}, "value");
        const paused = applyPause(p, { startedAt: weirdNumber(r), days: weirdNumber(r) } as never);
        finite(paused, "value");
        expect(paused.decisionCapacity).toBe(p.decisionCapacity);
        expect(paused.guardrails.coolingOffDays).toBeGreaterThanOrEqual(p.guardrails.coolingOffDays);
        t.hit(p.tier);
      });
    }
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(1500);
  });

  it("56 financial calculators through the guarded door: never throw, nothing non-finite (2,000 runs)", () => {
    const r = root.child("calcs");
    const t = new Tally();
    const rawNonFinite = new Map<string, number>();
    for (let i = 0; i < 2000; i++) {
      const def = r.pick(ALL_CALCS);
      const raw = r.bool(0.1) ? anyValue(r) : objectOf(r, def.fields.map(f => f.key), key => {
        const f = def.fields.find(x => x.key === key)!;
        if (f.type === "toggle") return r.bool();
        if (f.type === "select") return r.pick(f.options ?? [{ value: String(f.default) }]).value;
        const lo = f.min ?? 0; const hi = f.max ?? (typeof f.default === "number" ? Math.max(1, f.default * 5) : 100);
        return r.bool(0.1) ? String(numberIn(r, lo, hi)) : numberIn(r, lo, hi, 0.2);
      }, 0.3);
      guard(t, `calc ${def.id}`, i, () => {
        const result = runCalc(def, raw);
        expect(result.outputs.length).toBeGreaterThan(0);
        for (const o of result.outputs) expect(o.value, `${def.id}: ${o.label}`).not.toMatch(/NaN|Infinity|undefined|null/);
        finite(result.chart?.data ?? [], "value");
        finite(result.table?.rows ?? [], "value");
        // Coerced values are always in range, always the right type.
        const coerced = coerceValues(def, raw);
        for (const f of def.fields) {
          const v = coerced[f.key];
          if (f.type === "toggle") expect(typeof v).toBe("boolean");
          else if (f.type === "select") expect((f.options ?? []).some(o => o.value === v) || v === String(f.default)).toBe(true);
          else { expect(Number.isFinite(v as number)).toBe(true); if (f.min !== undefined) expect(v as number).toBeGreaterThanOrEqual(f.min); if (f.max !== undefined) expect(v as number).toBeLessThanOrEqual(f.max); }
        }
        // Count how often the raw compute needed the sanitizer, for the record.
        try {
          const rawResult = def.compute(coerced);
          const dirty = rawResult.outputs.some(o => /NaN|Infinity/.test(o.value)) || nonFinitePaths(rawResult.chart?.data ?? []).length > 0 || nonFinitePaths(rawResult.table?.rows ?? []).length > 0;
          if (dirty) rawNonFinite.set(def.id, (rawNonFinite.get(def.id) ?? 0) + 1);
        } catch { rawNonFinite.set(def.id, (rawNonFinite.get(def.id) ?? 0) + 1); }
        t.hit(result.failed ? "guarded-failure" : "ok");
      });
    }
    if (rawNonFinite.size) console.log("[chaos] calculators whose raw compute needed the sanitizer:", [...rawNonFinite.entries()].map(([k, v]) => `${k}=${v}`).join(", "));
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(2000);
    expect(t.counts.get("guarded-failure") ?? 0, "a calculator threw on in-range coerced inputs").toBe(0);
  });
}, TIMEOUT);
