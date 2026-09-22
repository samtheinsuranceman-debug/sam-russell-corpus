import { describe, it, expect, beforeAll } from "vitest";

// ─── Replicate the core Digital Twin scoring functions for testing ─────────────
// (These are extracted from routers.ts for isolated unit testing)

const TWIN_DOMAINS = [
  { id: "moodRegulation", name: "Mood Regulation", criticalThreshold: 20, deteriorationThreshold: 15 },
  { id: "anxietyManagement", name: "Anxiety Management", criticalThreshold: 20, deteriorationThreshold: 15 },
  { id: "psychoticSymptoms", name: "Psychotic Symptoms", criticalThreshold: 25, deteriorationThreshold: 10 },
  { id: "cognitiveFunction", name: "Cognitive Function", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "sleepQuality", name: "Sleep Quality", criticalThreshold: 20, deteriorationThreshold: 15 },
  { id: "socialEngagement", name: "Social Engagement", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "traumaResponse", name: "Trauma Response", criticalThreshold: 20, deteriorationThreshold: 15 },
  { id: "substanceUse", name: "Substance Use", criticalThreshold: 25, deteriorationThreshold: 10 },
  { id: "eatingBehavior", name: "Eating Behavior", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "personalityStability", name: "Personality Stability", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "somaticConcerns", name: "Somatic Concerns", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "crisisSafety", name: "Crisis & Safety", criticalThreshold: 30, deteriorationThreshold: 10 },
] as const;

function computeCompositeScore(domainScores: Record<string, number>): number {
  const scores = TWIN_DOMAINS.map(d => domainScores[d.id] ?? 50);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const crisisScore = domainScores["crisisSafety"] ?? 50;
  if (crisisScore < 30) return Math.min(avg, 50);
  return Math.round(avg * 10) / 10;
}

function classifyState(
  composite: number,
  domainScores: Record<string, number>,
  prevComposite?: number
): "stable" | "improving" | "deteriorating" | "critical" {
  const crisisScore = domainScores["crisisSafety"] ?? 50;
  if (crisisScore < 30 || composite < 30) return "critical";
  if (prevComposite !== undefined) {
    if (composite - prevComposite >= 10) return "improving";
    if (prevComposite - composite >= 10) return "deteriorating";
  }
  const anyDomainCritical = TWIN_DOMAINS.some(d => (domainScores[d.id] ?? 50) < d.criticalThreshold);
  if (anyDomainCritical) return "critical";
  return "stable";
}

function mapAssessmentToDomainScores(answers: Record<string, number>): Record<string, number> {
  const domainQuestions: Record<string, number[]> = {
    moodRegulation: [1, 2, 3, 4, 5, 6, 7, 8],
    anxietyManagement: [9, 10, 11, 12, 13, 14, 15, 16],
    psychoticSymptoms: [17, 18, 19, 20, 21, 22],
    cognitiveFunction: [23, 24, 25, 26, 27, 28],
    sleepQuality: [29, 30, 31, 32, 33],
    socialEngagement: [34, 35, 36, 37, 38, 39],
    traumaResponse: [40, 41, 42, 43, 44, 45, 46],
    substanceUse: [47, 48, 49, 50, 51, 52],
    eatingBehavior: [53, 54, 55, 56, 57],
    personalityStability: [58, 59, 60, 61, 62, 63, 64, 65],
    somaticConcerns: [66, 67, 68, 69, 70, 71],
    crisisSafety: [72, 73, 74, 75, 76, 77, 78, 79, 80],
  };
  const scores: Record<string, number> = {};
  for (const [domain, qNums] of Object.entries(domainQuestions)) {
    const domainAnswers = qNums.map(n => answers[String(n)] ?? 2);
    const avgSeverity = domainAnswers.reduce((a, b) => a + b, 0) / domainAnswers.length;
    scores[domain] = Math.round(((4 - avgSeverity) / 3) * 100);
  }
  return scores;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Digital Twin — computeCompositeScore", () => {
  it("returns 50 for all-neutral scores", () => {
    const scores: Record<string, number> = {};
    for (const d of TWIN_DOMAINS) scores[d.id] = 50;
    expect(computeCompositeScore(scores)).toBe(50);
  });

  it("returns 100 for all-perfect scores", () => {
    const scores: Record<string, number> = {};
    for (const d of TWIN_DOMAINS) scores[d.id] = 100;
    expect(computeCompositeScore(scores)).toBe(100);
  });

  it("caps composite at 50 when crisisSafety is below 30", () => {
    const scores: Record<string, number> = {};
    for (const d of TWIN_DOMAINS) scores[d.id] = 90; // all high
    scores["crisisSafety"] = 20; // crisis below threshold
    const composite = computeCompositeScore(scores);
    expect(composite).toBeLessThanOrEqual(50);
  });

  it("does NOT cap composite when crisisSafety is exactly 30", () => {
    const scores: Record<string, number> = {};
    for (const d of TWIN_DOMAINS) scores[d.id] = 80;
    scores["crisisSafety"] = 30;
    const composite = computeCompositeScore(scores);
    expect(composite).toBeGreaterThan(50);
  });

  it("uses default 50 for missing domain scores", () => {
    const composite = computeCompositeScore({});
    expect(composite).toBe(50);
  });
});

describe("Digital Twin — classifyState", () => {
  const healthyScores: Record<string, number> = {};
  beforeAll(() => { for (const d of TWIN_DOMAINS) healthyScores[d.id] = 80; });

  it("returns 'critical' when crisisSafety is below 30", () => {
    const scores = { ...healthyScores, crisisSafety: 25 };
    expect(classifyState(70, scores)).toBe("critical");
  });

  it("returns 'critical' when composite is below 30", () => {
    expect(classifyState(25, healthyScores)).toBe("critical");
  });

  it("returns 'improving' when composite rises by 10+ points", () => {
    expect(classifyState(70, healthyScores, 55)).toBe("improving");
  });

  it("returns 'deteriorating' when composite drops by 10+ points", () => {
    expect(classifyState(55, healthyScores, 70)).toBe("deteriorating");
  });

  it("returns 'stable' for healthy scores with no significant change", () => {
    expect(classifyState(75, healthyScores, 73)).toBe("stable");
  });

  it("returns 'critical' when any domain is below its critical threshold", () => {
    const scores = { ...healthyScores, psychoticSymptoms: 20 }; // criticalThreshold is 25
    expect(classifyState(70, scores)).toBe("critical");
  });
});

describe("Digital Twin — mapAssessmentToDomainScores", () => {
  it("produces 12 domain scores", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) answers[String(i)] = 2;
    const scores = mapAssessmentToDomainScores(answers);
    expect(Object.keys(scores)).toHaveLength(12);
  });

  it("scores all domains at 67 when all answers are 2 (mild)", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) answers[String(i)] = 2;
    const scores = mapAssessmentToDomainScores(answers);
    for (const domain of Object.keys(scores)) {
      // (4-2)/3 * 100 = 66.67, rounded = 67
      expect(scores[domain]).toBe(67);
    }
  });

  it("scores all domains at 0 when all answers are 4 (severe)", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) answers[String(i)] = 4;
    const scores = mapAssessmentToDomainScores(answers);
    for (const domain of Object.keys(scores)) {
      expect(scores[domain]).toBe(0);
    }
  });

  it("scores all domains at 100 when all answers are 1 (none)", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) answers[String(i)] = 1;
    const scores = mapAssessmentToDomainScores(answers);
    for (const domain of Object.keys(scores)) {
      expect(scores[domain]).toBe(100);
    }
  });

  it("uses default answer of 2 for missing questions", () => {
    const scores = mapAssessmentToDomainScores({});
    for (const domain of Object.keys(scores)) {
      expect(scores[domain]).toBe(67);
    }
  });

  it("all domain scores are in range 0-100", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) answers[String(i)] = Math.ceil(Math.random() * 4);
    const scores = mapAssessmentToDomainScores(answers);
    for (const score of Object.values(scores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

// ─── Integration-style: full assessment → twin state pipeline ─────────────────
describe("Digital Twin — full pipeline", () => {
  it("produces a valid state from a complete assessment", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) answers[String(i)] = 3; // moderate symptoms
    const domainScores = mapAssessmentToDomainScores(answers);
    const composite = computeCompositeScore(domainScores);
    const state = classifyState(composite, domainScores);
    expect(["stable", "improving", "deteriorating", "critical"]).toContain(state);
    expect(composite).toBeGreaterThanOrEqual(0);
    expect(composite).toBeLessThanOrEqual(100);
  });

  it("crisis-level answers produce critical state", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) answers[String(i)] = 4; // all severe
    const domainScores = mapAssessmentToDomainScores(answers);
    const composite = computeCompositeScore(domainScores);
    const state = classifyState(composite, domainScores);
    expect(state).toBe("critical");
    expect(composite).toBe(0);
  });

  it("healthy answers produce stable/improving state", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 100; i++) answers[String(i)] = 1; // all healthy
    const domainScores = mapAssessmentToDomainScores(answers);
    const composite = computeCompositeScore(domainScores);
    const state = classifyState(composite, domainScores);
    expect(["stable", "improving"]).toContain(state);
    expect(composite).toBe(100);
  });
});
