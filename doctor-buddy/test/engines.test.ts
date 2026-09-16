import { describe, it, expect } from "vitest";
import {
  ITEM_BANK,
  TRAIT_DIMENSIONS,
  DEFAULT_CONFIG,
  CLINICAL_THRESHOLD,
  initializeSession,
  probabilityCorrect,
  fisherInformation,
  differentialEntropy,
  vectorEntropy,
  expectedInformationGain,
  selectNextItem,
  applyResponse,
  generateDifferential,
  validateItemBank,
  type AssessmentItem,

} from "@shared/engines/adaptiveAssessment";
import {
  assessCSSRS,
  fuseRiskScore,
  forecastTrajectory,
  identifyCrisisWindow,
  escalationFor,
  assessCrisisRisk,
  deriveBaseline,
  CRISIS_THRESHOLD,
  CRISIS_LIFELINE,
  type DailyTelemetry,
} from "@shared/engines/crisisDetection";
import {
  predictEnsemble,
  conformalInterval,
  detectDrift,
  assessRisk,
  daysToRiskScore,
  DRIFT_THRESHOLD,
  FEATURE_KEYS,
  REFERENCE_MODELS,
  type RiskFeatures,
  type CalibrationExample,
} from "@shared/engines/riskScoring";
import {
  computeVitalSigns,
  monitorVitalSigns,
  interpretVitalSign,
  dynamicThreshold,
  reconstructionError,
  baselineReconstructor,
  VITAL_SIGN_NAMES,
  SCALE_CENTER,
  NORMATIVE_ANCHORS,
  type PsychiatricDataPoint,
} from "@shared/engines/vitalSigns";

// ─── Patent 06: Adaptive DSM-5 Assessment ─────────────────────────────────────
describe("Patent 06 · Adaptive DSM-5 Assessment (3PL IRT)", () => {
  const item = ITEM_BANK[0];

  it("respects the 3PL pseudo-guessing floor and ceiling", () => {
    // Far below difficulty, probability approaches c — never zero.
    expect(probabilityCorrect(item, -10)).toBeCloseTo(item.pseudoGuessing, 3);
    // Far above, approaches 1.
    expect(probabilityCorrect(item, 10)).toBeCloseTo(1, 3);
    // Monotonically increasing in theta.
    expect(probabilityCorrect(item, 1)).toBeGreaterThan(probabilityCorrect(item, 0));
  });

  it("peaks Fisher information near item difficulty", () => {
    const atDifficulty = fisherInformation(item, item.difficulty);
    expect(atDifficulty).toBeGreaterThan(fisherInformation(item, item.difficulty + 3));
    expect(atDifficulty).toBeGreaterThan(fisherInformation(item, item.difficulty - 3));
  });

  it("computes Gaussian differential entropy, decreasing as sd shrinks", () => {
    expect(differentialEntropy(1)).toBeCloseTo(0.5 * Math.log(2 * Math.PI * Math.E), 6);
    expect(differentialEntropy(0.5)).toBeLessThan(differentialEntropy(1.0));
  });

  it("starts at the population prior across every dimension", () => {
    const s = initializeSession();
    for (const d of TRAIT_DIMENSIONS) {
      expect(s.traits[d].theta).toBe(0);
      expect(s.traits[d].sd).toBe(DEFAULT_CONFIG.priorSd);
    }
    expect(s.complete).toBe(false);
  });

  it("reduces posterior uncertainty with each response", () => {
    let s = initializeSession();
    const before = s.traits[item.dimension].sd;
    s = applyResponse(s, item, 2);
    expect(s.traits[item.dimension].sd).toBeLessThan(before);
    expect(vectorEntropy(s.traits)).toBeLessThan(vectorEntropy(initializeSession().traits));
  });

  it("moves the estimate toward the observation", () => {
    const high = applyResponse(initializeSession(), item, 3);
    const low = applyResponse(initializeSession(), item, 0);
    expect(high.traits[item.dimension].theta).toBeGreaterThan(low.traits[item.dimension].theta);
  });

  it("selects the item with the highest expected information gain", () => {
    const s = initializeSession();
    const chosen = selectNextItem(s)!;
    const gains = ITEM_BANK.map(i => expectedInformationGain(i, s));
    expect(expectedInformationGain(chosen, s)).toBeCloseTo(Math.max(...gains), 6);
  });

  it("does not pre-empt selection with the safety item at the prior", () => {
    // At session start there is no evidence of elevation, so the gate must not
    // fire — otherwise every patient gets the suicide item first and adaptive
    // selection is disabled.
    const s = initializeSession();
    expect(s.traits.depression.theta).toBe(0);
    expect(selectNextItem(s)!.id).not.toBe("dep-05");
  });

  it("never defers a safety-critical item once its dimension is elevated", () => {
    let s = initializeSession();
    // Push depression up with non-safety items.
    for (const id of ["dep-01", "dep-02", "dep-03"]) {
      s = applyResponse(s, ITEM_BANK.find(i => i.id === id)!, 3);
    }
    expect(s.traits.depression.theta).toBeGreaterThan(-0.5);
    // The suicide item must now be next, regardless of information gain.
    expect(selectNextItem(s)!.id).toBe("dep-05");
  });

  it("never selects an already-administered item, and exhausts cleanly", () => {
    let s = initializeSession({ ...DEFAULT_CONFIG, maxItems: 500, minItems: 500 });
    const seen = new Set<string>();
    for (let i = 0; i < ITEM_BANK.length; i += 1) {
      const next = selectNextItem(s)!;
      expect(seen.has(next.id)).toBe(false);
      seen.add(next.id);
      s = applyResponse(s, next, 1);
    }
    expect(selectNextItem(s)).toBeNull();
  });

  it("terminates on the entropy threshold once the minimum is met", () => {
    let s = initializeSession({ ...DEFAULT_CONFIG, entropyStoppingThreshold: 99, minItems: 3, maxItems: 20 });
    for (let i = 0; i < 3; i += 1) s = applyResponse(s, selectNextItem(s)!, 2);
    expect(s.complete).toBe(true);
    expect(s.terminationReason).toBe("entropy_threshold");
  });

  it("terminates at the item cap when entropy never clears", () => {
    let s = initializeSession({ ...DEFAULT_CONFIG, entropyStoppingThreshold: -999, maxItems: 5, minItems: 1 });
    for (let i = 0; i < 5; i += 1) s = applyResponse(s, selectNextItem(s)!, 1);
    expect(s.complete).toBe(true);
    expect(s.terminationReason).toBe("max_items");
  });

  it("ranks the differential by confidence, not raw severity", () => {
    let s = initializeSession();
    for (const id of ["anx-01", "anx-02", "anx-03"]) {
      s = applyResponse(s, ITEM_BANK.find(i => i.id === id)!, 3);
    }
    const result = generateDifferential(s);
    const confidences = result.differential.map(d => d.confidence);
    expect([...confidences].sort((a, b) => b - a)).toEqual(confidences);
    expect(result.differential[0].dimension).toBe("anxiety");
    expect(result.differential[0].dsmCriteria.length).toBeGreaterThan(0);
  });

  it("raises a safety flag when the suicide item is endorsed at any level", () => {
    const suicide = ITEM_BANK.find(i => i.id === "dep-05")!;
    const flagged = generateDifferential(applyResponse(initializeSession(), suicide, 1));
    expect(flagged.safetyFlag).toBe(true);
    expect(flagged.safetyItems).toContain("dep-05");
    expect(flagged.clinicalNote).toMatch(/suicide risk assessment/i);

    const notFlagged = generateDifferential(applyResponse(initializeSession(), suicide, 0));
    expect(notFlagged.safetyFlag).toBe(false);
  });

  it("declines to over-claim when nothing is confidently elevated", () => {
    const result = generateDifferential(initializeSession());
    expect(result.differential.every(d => d.confidence < 0.6)).toBe(true);
    expect(result.clinicalNote).toMatch(/screen, not a rule-out/i);
  });

  it("validates a swapped-in item bank against fitted-parameter bounds", () => {
    expect(validateItemBank(ITEM_BANK)).toEqual([]);
    const bad: AssessmentItem[] = [
      { ...ITEM_BANK[0], id: "x", discrimination: 99 },
      { ...ITEM_BANK[1], id: "x", pseudoGuessing: 0.9 },
    ];
    const problems = validateItemBank(bad);
    expect(problems.join(" ")).toMatch(/Duplicate item id/);
    expect(problems.join(" ")).toMatch(/discrimination/);
    expect(problems.join(" ")).toMatch(/pseudo-guessing/);
  });

  it("keeps the clinical threshold meaningful on the theta scale", () => {
    expect(CLINICAL_THRESHOLD).toBeGreaterThan(0);
    expect(CLINICAL_THRESHOLD).toBeLessThan(2);
  });
});

// ─── Patent 09: Crisis Detection ──────────────────────────────────────────────
describe("Patent 09 · Crisis Detection and Escalation", () => {
  const day = (over: Partial<DailyTelemetry> = {}): DailyTelemetry => ({
    date: "2026-03-15",
    nightUsageMinutes: 10,
    sleepHours: 7.5,
    socialInteractions: 10,
    activityLevel: 6000,
    ...over,
  });
  const baseline = { meanSleepHours: 7.5, meanSocialInteractions: 10, meanActivityLevel: 6000 };

  describe("automated C-SSRS", () => {
    it("returns level 0 with no ideation language", () => {
      const r = assessCSSRS("Work was busy today. Went for a run and slept fine.");
      expect(r.level).toBe(0);
      expect(r.requiresClinicianReview).toBe(false);
    });

    it("detects each severity level", () => {
      expect(assessCSSRS("Everyone would be better off without me.").level).toBe(1);
      expect(assessCSSRS("I want to die.").level).toBe(2);
      expect(assessCSSRS("I've been thinking about ways to die.").level).toBe(3);
      expect(assessCSSRS("I intend to kill myself.").level).toBe(4);
      expect(assessCSSRS("I have a plan and I'm going to end my life tonight.").level).toBe(5);
    });

    it("takes the HIGHEST level, never an average", () => {
      const r = assessCSSRS("Mostly I'm fine and grateful. But I have a plan.");
      expect(r.level).toBe(5);
    });

    it("surfaces the triggering phrase so a clinician can audit it", () => {
      const r = assessCSSRS("I want to die.");
      expect(r.triggers.length).toBeGreaterThan(0);
      expect(r.triggers[0].phrase.toLowerCase()).toContain("want to die");
    });

    it("records protective factors without cancelling the level", () => {
      const r = assessCSSRS("I want to die but my kids need me.");
      expect(r.level).toBe(2);
      expect(r.protectiveFactors.length).toBeGreaterThan(0);
      expect(r.requiresClinicianReview).toBe(true);
    });

    it("requires clinician review at every non-zero level", () => {
      for (const t of ["better off dead", "I want to die", "I have a plan"]) {
        expect(assessCSSRS(t).requiresClinicianReview).toBe(true);
      }
    });
  });

  describe("risk fusion", () => {
    it("scores a stable day low", () => {
      expect(fuseRiskScore(day(), baseline).score).toBeLessThan(10);
    });

    it("raises the score on sleep disturbance, withdrawal and inactivity", () => {
      const disturbed = fuseRiskScore(
        day({ nightUsageMinutes: 180, sleepHours: 3, socialInteractions: 1, activityLevel: 500 }),
        baseline,
      );
      expect(disturbed.score).toBeGreaterThan(20);
      expect(disturbed.components.sleepDisturbance).toBeGreaterThan(0);
      expect(disturbed.components.socialWithdrawal).toBeGreaterThan(0);
      expect(disturbed.components.activityChange).toBeGreaterThan(0);
    });

    it("lets disclosure dominate even when behavior looks healthy", () => {
      // Perfect sleep, normal social contact, good activity — but a stated plan.
      const disclosed = fuseRiskScore(day({ text: "I have a plan." }), baseline);
      expect(disclosed.cssrsLevel).toBe(5);
      expect(disclosed.score).toBeGreaterThanOrEqual(CRISIS_THRESHOLD);
    });

    it("SAFETY: no behavioral profile can drag a level 4-5 disclosure below crisis", () => {
      // The healthiest possible behavioral day paired with intent, then a plan.
      const pristine = day({ nightUsageMinutes: 0, sleepHours: 9, socialInteractions: 40, activityLevel: 20000 });
      for (const text of ["I intend to kill myself.", "I have a plan.", "I'm going to end my life tonight."]) {
        const r = fuseRiskScore({ ...pristine, text }, baseline);
        expect(r.cssrsLevel).toBeGreaterThanOrEqual(4);
        expect(r.score).toBeGreaterThanOrEqual(CRISIS_THRESHOLD);
        // And the cascade must reach its top level.
        expect(escalationFor(r.score, r.cssrsLevel, null).level).toBe(4);
      }
    });

    it("caps the fused score at 100", () => {
      const worst = fuseRiskScore(
        day({ nightUsageMinutes: 300, sleepHours: 0, socialInteractions: 0, activityLevel: 0, text: "I have a plan and I'm going to end my life tonight." }),
        baseline,
      );
      expect(worst.score).toBeLessThanOrEqual(100);
    });
  });

  describe("trajectory forecasting", () => {
    const series = (scores: number[]) =>
      scores.map((s, i) => ({
        date: `2026-03-${String(i + 1).padStart(2, "0")}`,
        score: s,
        components: { cssrs: 0, sleepDisturbance: 0, socialWithdrawal: 0, activityChange: 0 },
        cssrsLevel: 0 as const,
      }));

    it("projects a rising trend upward", () => {
      const f = forecastTrajectory(series([20, 30, 40, 50, 60]));
      expect(f).toHaveLength(7);
      expect(f[6].predictedScore).toBeGreaterThan(f[0].predictedScore);
    });

    it("widens the band with horizon", () => {
      const f = forecastTrajectory(series([20, 35, 30, 45, 40]));
      expect(f[6].upper - f[6].lower).toBeGreaterThan(f[0].upper - f[0].lower);
    });

    it("keeps predictions inside the 0-100 scale", () => {
      const f = forecastTrajectory(series([70, 80, 90, 95, 99]));
      for (const p of f) {
        expect(p.predictedScore).toBeGreaterThanOrEqual(0);
        expect(p.predictedScore).toBeLessThanOrEqual(100);
        expect(p.lower).toBeGreaterThanOrEqual(0);
        expect(p.upper).toBeLessThanOrEqual(100);
      }
    });

    it("handles a single observation without crashing", () => {
      expect(forecastTrajectory(series([50]))).toHaveLength(7);
      expect(forecastTrajectory([])).toEqual([]);
    });

    it("identifies a contiguous crisis window on a climbing trajectory", () => {
      const w = identifyCrisisWindow(forecastTrajectory(series([30, 40, 50, 60, 70])));
      expect(w).not.toBeNull();
      expect(w!.startsInDays).toBeGreaterThanOrEqual(1);
      expect(w!.endsInDays).toBeGreaterThanOrEqual(w!.startsInDays);
      expect(w!.peakScore).toBeGreaterThanOrEqual(CRISIS_THRESHOLD);
      expect(w!.confidence).toBeGreaterThan(0);
      expect(w!.confidence).toBeLessThanOrEqual(0.95);
    });

    it("reports no window when the trajectory stays low", () => {
      expect(identifyCrisisWindow(forecastTrajectory(series([10, 12, 11, 9, 10])))).toBeNull();
    });
  });

  describe("escalation cascade", () => {
    it("provides five graduated levels — claim 1 requires at least four", () => {
      const levels = new Set([
        escalationFor(5, 0, null).level,
        escalationFor(30, 0, null).level,
        escalationFor(50, 0, null).level,
        escalationFor(70, 0, null).level,
        escalationFor(90, 0, null).level,
      ]);
      expect(levels.size).toBe(5);
      expect([...levels].sort()).toEqual([0, 1, 2, 3, 4]);
    });

    it("jumps to level 4 on C-SSRS 4-5 regardless of composite score", () => {
      expect(escalationFor(0, 4, null).level).toBe(4);
      expect(escalationFor(0, 5, null).level).toBe(4);
    });

    it("surfaces the 988 lifeline at every acute level", () => {
      for (const score of [70, 90]) {
        expect(escalationFor(score, 0, null).lifeline).toEqual(CRISIS_LIFELINE);
      }
      expect(escalationFor(5, 0, null).lifeline).toBeNull();
    });

    it("NEVER auto-dispatches: the top levels require human confirmation", () => {
      const imminent = escalationFor(95, 5, null);
      expect(imminent.level).toBe(4);
      expect(imminent.requiresHumanConfirmation).toBe(true);
      expect(escalationFor(70, 3, null).requiresHumanConfirmation).toBe(true);
      // No automated action may claim to dispatch emergency services itself.
      expect(imminent.automatedActions.join(" ")).not.toMatch(/dispatch (police|911|emergency services)/i);
      expect(imminent.clinicianActions.join(" ")).toMatch(/emergency services|level of care/i);
    });

    it("escalates monotonically with score", () => {
      const levels = [5, 30, 50, 70, 90].map(s => escalationFor(s, 0, null).level);
      for (let i = 1; i < levels.length; i += 1) {
        expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
      }
    });

    it("escalates passive ideation paired with marked deterioration", () => {
      // Neither term clears the bar alone...
      expect(escalationFor(40, 0, null).level).toBe(1);
      expect(escalationFor(10, 1, null).level).toBe(1);
      // ...but ideation plus real behavioral collapse needs a clinician inside 24h.
      expect(escalationFor(40, 1, null).level).toBe(2);
    });

    it("escalates on an imminent predicted window even at a modest current score", () => {
      const w = { startsInDays: 2, endsInDays: 4, peakScore: 80, confidence: 0.7 };
      expect(escalationFor(30, 0, w).level).toBeGreaterThanOrEqual(2);
    });
  });

  describe("end-to-end", () => {
    it("assembles history, forecast, window, escalation and a summary", () => {
      const telemetry: DailyTelemetry[] = [
        day({ date: "2026-03-10" }),
        day({ date: "2026-03-11", sleepHours: 6, socialInteractions: 7 }),
        day({ date: "2026-03-12", sleepHours: 5, socialInteractions: 4, nightUsageMinutes: 60 }),
        day({ date: "2026-03-13", sleepHours: 4, socialInteractions: 2, nightUsageMinutes: 110 }),
        day({ date: "2026-03-14", sleepHours: 3, socialInteractions: 1, nightUsageMinutes: 160, text: "I don't want to be here anymore." }),
      ];
      const r = assessCrisisRisk(telemetry);
      expect(r.history).toHaveLength(5);
      expect(r.forecast).toHaveLength(7);
      expect(r.cssrs!.level).toBeGreaterThanOrEqual(1);
      expect(r.escalation.level).toBeGreaterThanOrEqual(1);
      expect(r.summary).toMatch(/crisis risk/i);
    });

    it("derives the baseline from the patient's own history", () => {
      const b = deriveBaseline([day({ sleepHours: 6 }), day({ sleepHours: 8 })]);
      expect(b.meanSleepHours).toBe(7);
    });

    it("rejects an empty telemetry history", () => {
      expect(() => assessCrisisRisk([])).toThrow(/at least one day/i);
    });
  });
});

// ─── Patent 04: Risk Scoring with Conformal Prediction ────────────────────────
describe("Patent 04 · Risk Scoring with Conformal Prediction", () => {
  const features = (over: Partial<RiskFeatures> = {}): RiskFeatures => ({
    daysSinceContact: 14,
    sleepDelta: 0,
    socialRatio: 1,
    adherence: 0.9,
    priorHospitalizations: 0,
    cssrsLevel: 0,
    substanceUseDays: 0,
    symptomSeverity: 30,
    ...over,
  });

  it("maps time-to-event to risk monotonically", () => {
    expect(daysToRiskScore(0)).toBeGreaterThan(daysToRiskScore(30));
    expect(daysToRiskScore(30)).toBeGreaterThan(daysToRiskScore(120));
    expect(daysToRiskScore(0)).toBeCloseTo(100, 5);
  });

  it("aggregates the ensemble and exposes per-model disagreement", () => {
    const p = predictEnsemble(features());
    expect(p.perModel).toHaveLength(REFERENCE_MODELS.length);
    expect(p.ensembleSd).toBeGreaterThanOrEqual(0);
    expect(p.riskScore).toBeGreaterThanOrEqual(0);
    expect(p.riskScore).toBeLessThanOrEqual(100);
  });

  it("shortens predicted time-to-event as clinical severity rises", () => {
    const well = predictEnsemble(features());
    const unwell = predictEnsemble(features({ cssrsLevel: 4, adherence: 0.2, symptomSeverity: 90, sleepDelta: -3 }));
    expect(unwell.daysToEvent).toBeLessThan(well.daysToEvent);
    expect(unwell.riskScore).toBeGreaterThan(well.riskScore);
  });

  it("produces a conformal interval that brackets the point estimate", () => {
    const calibration: CalibrationExample[] = Array.from({ length: 50 }, (_, i) => ({
      features: features({ symptomSeverity: 20 + i }),
      observedDaysToEvent: 80 - i,
    }));
    const ci = conformalInterval(features(), calibration, 0.9);
    expect(ci.lowerDays).toBeLessThanOrEqual(ci.daysToEvent);
    expect(ci.upperDays).toBeGreaterThanOrEqual(ci.daysToEvent);
    expect(ci.riskLower).toBeLessThanOrEqual(ci.riskUpper);
    expect(ci.calibrationSize).toBe(50);
  });

  it("achieves its promised empirical coverage on held-out data", () => {
    // The conformal guarantee holds under EXCHANGEABILITY: calibration and test
    // must be draws from the same distribution. So draw one pool from a single
    // seeded process and split it, rather than generating the two sets from
    // different formulas.
    let seed = 12345;
    const rand = () => {
      // Deterministic LCG, so this test never flakes.
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    const pool: CalibrationExample[] = Array.from({ length: 400 }, () => {
      const severity = 20 + rand() * 70;
      const adherence = 0.3 + rand() * 0.7;
      const noise = (rand() - 0.5) * 20;
      return {
        features: features({ symptomSeverity: severity, adherence }),
        observedDaysToEvent: 90 - severity * 0.6 + noise,
      };
    });

    const calibration = pool.slice(0, 200);
    const heldOut = pool.slice(200);

    const covered = heldOut.filter(ex => {
      const ci = conformalInterval(ex.features, calibration, 0.9);
      return ex.observedDaysToEvent >= ci.lowerDays && ex.observedDaysToEvent <= ci.upperDays;
    }).length;

    // Distribution-free guarantee: coverage at or above the requested level.
    expect(covered / heldOut.length).toBeGreaterThanOrEqual(0.9);
  });

  it("widens the interval as requested coverage rises", () => {
    const calibration: CalibrationExample[] = Array.from({ length: 60 }, (_, i) => ({
      features: features({ symptomSeverity: 20 + i }),
      observedDaysToEvent: 90 - i + ((i * 3) % 7),
    }));
    const at80 = conformalInterval(features(), calibration, 0.8);
    const at99 = conformalInterval(features(), calibration, 0.99);
    expect(at99.quantile).toBeGreaterThanOrEqual(at80.quantile);
  });

  it("refuses to fake precision with no calibration data", () => {
    const ci = conformalInterval(features(), [], 0.9);
    expect(ci.calibrationSize).toBe(0);
    expect(ci.quantile).toBeGreaterThanOrEqual(20);
    expect(assessRisk(features(), []).clinicalNote).toMatch(/not a coverage guarantee/i);
  });

  it("falls back to the documented 90% coverage when asked for an impossible one", () => {
    for (const bad of [0, 1, -0.5, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(conformalInterval(features(), [], bad).coverage).toBe(0.9);
    }
  });

  it.skip("rejects invalid coverage (superseded: the engine now degrades instead of throwing)", () => {
    expect(() => conformalInterval(features(), [], 0)).toThrow(/between 0 and 1/i);
    expect(() => conformalInterval(features(), [], 1)).toThrow(/between 0 and 1/i);
  });

  it("detects covariate drift with CUSUM and triggers retraining", () => {
    const mean = features();
    const sd = features({ daysSinceContact: 7, sleepDelta: 1, socialRatio: 0.3, adherence: 0.2, priorHospitalizations: 1, cssrsLevel: 1, substanceUseDays: 5, symptomSeverity: 15 });

    const stable = Array.from({ length: 30 }, () => features());
    expect(detectDrift(stable, mean, sd).retrainingTriggered).toBe(false);

    // A population steadily drifting sicker.
    const drifting = Array.from({ length: 30 }, () => features({ symptomSeverity: 90 }));
    const result = detectDrift(drifting, mean, sd);
    expect(result.retrainingTriggered).toBe(true);
    expect(result.covariateShift).toBeGreaterThan(DRIFT_THRESHOLD);
    expect(result.driftedFeatures).toContain("symptomSeverity");
    expect(result.message).toMatch(/retraining protocol triggered/i);
  });

  it("covers every feature in the drift report", () => {
    const mean = features();
    const sd = features({ daysSinceContact: 7, sleepDelta: 1, socialRatio: 0.3, adherence: 0.2, priorHospitalizations: 1, cssrsLevel: 1, substanceUseDays: 5, symptomSeverity: 15 });
    expect(detectDrift([features()], mean, sd).perFeature).toHaveLength(FEATURE_KEYS.length);
  });

  it("attributes the score to its drivers", () => {
    const r = assessRisk(features({ cssrsLevel: 4, adherence: 0.2 }), []);
    expect(r.drivers.length).toBeGreaterThan(0);
    expect(r.drivers[0].contribution).toBeGreaterThan(0);
    expect(["raises", "lowers"]).toContain(r.drivers[0].direction);
    expect(["low", "moderate", "high", "severe"]).toContain(r.band);
  });

  it("says plainly when the interval is too wide to act on", () => {
    const r = assessRisk(features(), []);
    if (r.interval.tooUncertainToAct) {
      expect(r.clinicalNote).toMatch(/rely on clinical assessment/i);
    }
    expect(typeof r.interval.tooUncertainToAct).toBe("boolean");
  });

  it("rejects an empty ensemble", () => {
    expect(() => predictEnsemble(features(), [])).toThrow(/at least one model/i);
  });
});

// ─── Patent 10: Mental Health Vital Signs ─────────────────────────────────────
describe("Patent 10 · Mental Health Vital Signs", () => {
  const point = (over: Partial<PsychiatricDataPoint> = {}): PsychiatricDataPoint => ({
    date: "2026-03-15",
    moodRating: NORMATIVE_ANCHORS.moodRating.mean,
    anxietyRating: NORMATIVE_ANCHORS.anxietyRating.mean,
    sleepHours: NORMATIVE_ANCHORS.sleepHours.mean,
    sleepVariability: NORMATIVE_ANCHORS.sleepVariability.mean,
    socialInteractions: NORMATIVE_ANCHORS.socialInteractions.mean,
    activityLevel: NORMATIVE_ANCHORS.activityLevel.mean,
    adherence: NORMATIVE_ANCHORS.adherence.mean,
    rumination: NORMATIVE_ANCHORS.rumination.mean,
    ...over,
  });

  it("anchors the population mean to the scale centre", () => {
    const v = computeVitalSigns(point());
    for (const name of VITAL_SIGN_NAMES) {
      expect(v[name]).toBeCloseTo(SCALE_CENTER, 4);
    }
  });

  it("produces the mood stability and anxiety burden indices claim 1 names", () => {
    const v = computeVitalSigns(point());
    expect(v.moodStability).toBeDefined();
    expect(v.anxietyBurden).toBeDefined();
  });

  it("orients every index so higher means healthier", () => {
    const healthy = computeVitalSigns(point({ moodRating: 4, anxietyRating: 1, rumination: 1, sleepHours: 8, sleepVariability: 0.3, socialInteractions: 15, activityLevel: 9000, adherence: 1 }));
    const unwell = computeVitalSigns(point({ moodRating: -4, anxietyRating: 9, rumination: 9, sleepHours: 4, sleepVariability: 3, socialInteractions: 1, activityLevel: 800, adherence: 0.2 }));
    for (const name of VITAL_SIGN_NAMES) {
      expect(healthy[name]).toBeGreaterThan(unwell[name]);
    }
  });

  it("keeps indices inside the 0-100 scale at extremes", () => {
    const extreme = computeVitalSigns(point({ moodRating: -99, anxietyRating: 99, rumination: 99, sleepHours: 0, sleepVariability: 99, socialInteractions: 0, activityLevel: 0, adherence: 0 }));
    for (const name of VITAL_SIGN_NAMES) {
      expect(extreme[name]).toBeGreaterThanOrEqual(0);
      expect(extreme[name]).toBeLessThanOrEqual(100);
    }
  });

  it("bands values the way a standardized clinical score reads", () => {
    expect(interpretVitalSign(10)).toBe("critical");
    expect(interpretVitalSign(30)).toBe("impaired");
    expect(interpretVitalSign(40)).toBe("borderline");
    expect(interpretVitalSign(50)).toBe("normal");
    expect(interpretVitalSign(80)).toBe("optimal");
  });

  it("reconstructs a stable series with low error", () => {
    const stable = Array.from({ length: 10 }, () => point());
    const history = stable.map(computeVitalSigns);
    expect(reconstructionError(history, baselineReconstructor).error).toBeLessThan(5);
  });

  it("produces high reconstruction error on a sudden break", () => {
    const series = [
      ...Array.from({ length: 8 }, () => point()),
      point({ moodRating: -5, anxietyRating: 10, rumination: 10, sleepHours: 2, socialInteractions: 0 }),
    ];
    const history = series.map(computeVitalSigns);
    const stableHistory = Array.from({ length: 9 }, () => point()).map(computeVitalSigns);
    expect(reconstructionError(history).error).toBeGreaterThan(reconstructionError(stableHistory).error);
  });

  it("scales the dynamic threshold to the patient's own volatility", () => {
    const calm = dynamicThreshold([1, 1.2, 0.9, 1.1, 1.0]);
    const volatile = dynamicThreshold([1, 9, 2, 12, 3]);
    expect(volatile).toBeGreaterThan(calm);
    // Falls back conservatively while the baseline is still being learned.
    expect(dynamicThreshold([1, 2])).toBe(12);
  });

  it("flags an anomaly when a stable patient breaks pattern", () => {
    const series = [
      ...Array.from({ length: 12 }, () => point()),
      point({ moodRating: -5, anxietyRating: 10, rumination: 10, sleepHours: 2, sleepVariability: 4, socialInteractions: 0, activityLevel: 200, adherence: 0.1 }),
    ];
    const r = monitorVitalSigns(series);
    expect(r.anomaly.anomalyDetected).toBe(true);
    expect(r.anomaly.reconstructionError).toBeGreaterThan(r.anomaly.threshold);
    expect(r.clinicalNote).toMatch(/departs from this patient's own baseline/i);
  });

  it("does not alarm on a patient who is simply stable", () => {
    const r = monitorVitalSigns(Array.from({ length: 14 }, () => point()));
    expect(r.anomaly.anomalyDetected).toBe(false);
    expect(r.concerning).toEqual([]);
  });

  it("reports trend and concerning bands", () => {
    const r = monitorVitalSigns([
      point(),
      point({ moodRating: -4, anxietyRating: 9, rumination: 9, sleepHours: 3, socialInteractions: 1, activityLevel: 500, adherence: 0.3 }),
    ]);
    expect(r.interpretation).toHaveLength(VITAL_SIGN_NAMES.length);
    expect(r.interpretation.some(i => i.trend < 0)).toBe(true);
    expect(r.concerning.length).toBeGreaterThan(0);
  });

  it("says when the baseline is still being established", () => {
    expect(monitorVitalSigns([point(), point()]).clinicalNote).toMatch(/baseline is still being established/i);
  });

  it("rejects empty input", () => {
    expect(() => monitorVitalSigns([])).toThrow(/at least one data point/i);
  });
});
