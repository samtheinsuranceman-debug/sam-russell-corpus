/**
 * Tests for the 100-item intake scorer.
 *
 * The scorer is the reason the intake works before login: it needs no database
 * and no model. These tests pin the properties that make its output safe to
 * show a clinician — coverage honesty, safety precedence, and determinism.
 */
import { describe, it, expect } from "vitest";
import {
  DSM5_QUESTIONS,
  SAFETY_CRITICAL_IDS,
  getSkippedIds,
  visibleQuestions,
} from "../shared/intake/questions";
import {
  answerSeverity,
  scoreDomains,
  assessSafety,
  scoreIntake,
  NOTABLE_THRESHOLD,
} from "../shared/intake/scoring";

/**
 * The most severe answer for a question.
 *
 * Note the yes/no case: the options are ["Yes", "No"], so the *first* option is
 * the severe one. Indexing by position rather than meaning silently inverts
 * every screening item.
 */
function severeAnswer(q: (typeof DSM5_QUESTIONS)[number]): string {
  return q.type === "yesno" ? "Yes" : q.options[q.options.length - 1];
}

/** The least severe answer for a question. */
function mildAnswer(q: (typeof DSM5_QUESTIONS)[number]): string {
  return q.type === "yesno" ? "No" : q.options[0];
}

/** Answer every question in a domain severely. */
function answerDomainSevere(domain: string): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of DSM5_QUESTIONS) {
    if (q.domain !== domain) continue;
    answers[q.id.toString()] = severeAnswer(q);
  }
  return answers;
}

/**
 * Answer everything at the lowest severity.
 *
 * Because every gate question is a yes/no, this answers "No" to all of them and
 * so closes nearly every branch — which is correct screening behaviour, and why
 * the in-play count drops well below 100 here.
 */
function answerAllMinimal(): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of DSM5_QUESTIONS) answers[q.id.toString()] = mildAnswer(q);
  return answers;
}

/**
 * Answer everything mildly but hold every branch gate open, so coverage and
 * in-play counts can be reasoned about against the full instrument.
 */
function answerAllMinimalGatesOpen(): Record<string, string> {
  const GATES = [22, 29, 39, 40, 47, 49, 56, 57, 64, 72, 80, 89];
  const answers = answerAllMinimal();
  for (const id of GATES) answers[id.toString()] = "Yes";
  return answers;
}

describe("question bank", () => {
  it("has exactly 100 items with unique ids", () => {
    expect(DSM5_QUESTIONS).toHaveLength(100);
    expect(new Set(DSM5_QUESTIONS.map(q => q.id)).size).toBe(100);
  });

  it("gives every item at least two options", () => {
    for (const q of DSM5_QUESTIONS) {
      expect(q.options.length, `Q${q.id} has too few options`).toBeGreaterThanOrEqual(2);
    }
  });

  it("skips branch follow-ups only when the gate is answered negatively", () => {
    // PTSD gate Q29: no trauma exposure closes out 30-38.
    expect(getSkippedIds({}).size).toBe(0);
    const skipped = getSkippedIds({ "29": "No" });
    for (const id of [30, 31, 32, 33, 34, 35, 36, 37, 38]) {
      expect(skipped.has(id), `Q${id} should be skipped`).toBe(true);
    }
    expect(getSkippedIds({ "29": "Yes" }).has(30)).toBe(false);
  });

  it("requires BOTH bipolar stems to be negative before skipping follow-ups", () => {
    // One negative stem is not enough — a manic episode can be endorsed on either.
    expect(getSkippedIds({ "39": "No" }).has(41)).toBe(false);
    expect(getSkippedIds({ "40": "No" }).has(41)).toBe(false);
    expect(getSkippedIds({ "39": "No", "40": "No" }).has(41)).toBe(true);
  });

  it("shrinks the in-play set as gates close", () => {
    expect(visibleQuestions({})).toHaveLength(100);
    expect(visibleQuestions({ "29": "No" }).length).toBe(91);
  });
});

describe("answerSeverity", () => {
  const freq = DSM5_QUESTIONS.find(q => q.type === "frequency")!;
  const yesno = DSM5_QUESTIONS.find(q => q.type === "yesno")!;

  it("maps a 4-point frequency scale onto 0..1", () => {
    expect(answerSeverity(freq, "Not at all")).toBe(0);
    expect(answerSeverity(freq, "Nearly every day")).toBe(1);
    expect(answerSeverity(freq, "Several days")).toBeCloseTo(1 / 3, 5);
  });

  it("treats Yes as full endorsement and No as none", () => {
    expect(answerSeverity(yesno, "Yes")).toBe(1);
    expect(answerSeverity(yesno, "No")).toBe(0);
  });

  it("returns null for an unanswered or unrecognized item", () => {
    expect(answerSeverity(freq, undefined)).toBeNull();
    expect(answerSeverity(freq, "")).toBeNull();
    expect(answerSeverity(freq, "Maybe")).toBeNull();
  });

  it("excludes duration from severity", () => {
    const dur = DSM5_QUESTIONS.find(q => q.type === "duration");
    if (!dur) return;
    // A long duration describes course, not intensity. Counting it as severity
    // would make a long-standing mild problem read as a severe one.
    expect(answerSeverity(dur, dur.options[dur.options.length - 1])).toBeNull();
  });
});

describe("domain scoring", () => {
  it("scores an all-minimal intake near zero", () => {
    const result = scoreIntake(answerAllMinimal());
    for (const c of result.candidates) {
      expect(c.severity, `${c.domain} should be minimal`).toBeLessThan(NOTABLE_THRESHOLD);
    }
    expect(result.safety.flagged).toBe(false);
  });

  it("raises the answered domain and leaves the others alone", () => {
    const answers = { ...answerAllMinimal(), ...answerDomainSevere("Depression") };
    const result = scoreIntake(answers);
    const dep = result.candidates.find(c => c.domain === "Depression")!;
    const anx = result.candidates.find(c => c.domain === "Anxiety")!;

    expect(dep.severity).toBeGreaterThan(NOTABLE_THRESHOLD);
    expect(anx.severity).toBeLessThan(NOTABLE_THRESHOLD);
    expect(result.candidates[0].domain).toBe("Depression");
  });

  it("reports coverage rather than treating unanswered as negative", () => {
    // Answer only two depression items, both at maximum.
    const answers: Record<string, string> = { "1": "Nearly every day", "2": "Nearly every day" };
    const domains = scoreDomains(answers);
    const dep = domains.find(d => d.domain === "Depression")!;

    expect(dep.scored).toBe(2);
    expect(dep.inPlay).toBe(14);
    expect(dep.coverage).toBeCloseTo(2 / 14, 2);
    // Severity is high on what was asked...
    expect(dep.severity).toBe(100);
    // ...but confidence must reflect that twelve items are missing.
    expect(dep.confidence).toBeLessThan(0.5);
  });

  it("does not let a thinly-covered domain outrank a fully-answered one", () => {
    const answers: Record<string, string> = {
      // Anxiety: fully answered, severe.
      ...answerDomainSevere("Anxiety"),
      // Depression: two items, maxed. Raw severity ties, coverage does not.
      "1": "Nearly every day",
      "2": "Nearly every day",
    };
    const result = scoreIntake(answers);
    const rank = result.candidates.map(c => c.domain);
    expect(rank.indexOf("Anxiety")).toBeLessThan(rank.indexOf("Depression"));

    const dep = result.candidates.find(c => c.domain === "Depression")!;
    expect(dep.provisional).toBe(true);
  });
});

describe("safety precedence", () => {
  it("flags passive ideation on Q9 even when every other answer is minimal", () => {
    const answers = { ...answerAllMinimal(), "9": "Several days" };
    const result = scoreIntake(answers);

    expect(result.safety.flagged).toBe(true);
    expect(result.safety.urgency).toBe("same_day");
    expect(result.clinicalNote).toContain("SAFETY");
    // The rest of the instrument reading as healthy must not suppress it.
    expect(result.candidates.every(c => c.severity < NOTABLE_THRESHOLD)).toBe(true);
  });

  it("escalates recurrent suicidal behaviour to immediate", () => {
    // Q84 sits behind the Q80 personality gate, so open it.
    const answers = { ...answerAllMinimal(), "80": "Yes", "84": "Yes" };
    const result = scoreIntake(answers);
    expect(result.safety.flagged).toBe(true);
    expect(result.safety.urgency).toBe("immediate");
  });

  it("escalates daily ideation to immediate", () => {
    const answers = { ...answerAllMinimal(), "9": "Nearly every day" };
    expect(assessSafety(answers).urgency).toBe("immediate");
  });

  it("stays silent when no safety item is endorsed", () => {
    const safety = assessSafety(answerAllMinimal());
    expect(safety.flagged).toBe(false);
    expect(safety.urgency).toBe("none");
    expect(safety.endorsements).toEqual([]);
  });

  it("names the endorsed items so the call can be audited", () => {
    const answers = { "9": "Nearly every day" };
    const safety = assessSafety(answers);
    expect(safety.endorsements[0].id).toBe(9);
    expect(safety.endorsements[0].answer).toBe("Nearly every day");
    expect(safety.endorsements[0].text.length).toBeGreaterThan(0);
  });

  it("covers every declared safety-critical id", () => {
    for (const id of SAFETY_CRITICAL_IDS) {
      expect(DSM5_QUESTIONS.some(q => q.id === id), `Q${id} missing from bank`).toBe(true);
    }
  });
});

describe("completeness", () => {
  it("marks a partial intake insufficient and says so", () => {
    const result = scoreIntake({ "1": "Nearly every day" });
    expect(result.sufficient).toBe(false);
    expect(result.clinicalNote).toContain("incomplete");
  });

  it("marks a fully answered intake sufficient", () => {
    expect(scoreIntake(answerAllMinimal()).completeness).toBe(1);
    expect(scoreIntake(answerAllMinimal()).sufficient).toBe(true);
    // Also true when every gate is held open and all 100 are answered.
    const full = scoreIntake(answerAllMinimalGatesOpen());
    expect(full.inPlay).toBe(100);
    expect(full.completeness).toBe(1);
  });

  it("counts completeness against in-play items, not all 100", () => {
    // Hold every gate open except PTSD, then answer everything still in play.
    const answers = answerAllMinimalGatesOpen();
    answers["29"] = "No";
    for (const id of [30, 31, 32, 33, 34, 35, 36, 37, 38]) delete answers[id.toString()];

    const result = scoreIntake(answers);
    expect(result.inPlay).toBe(91);
    expect(result.completeness).toBe(1);
  });
});

describe("determinism", () => {
  it("returns an identical result for identical answers", () => {
    const answers = { ...answerAllMinimal(), ...answerDomainSevere("Anxiety") };
    expect(scoreIntake(answers)).toEqual(scoreIntake(answers));
  });

  it("never claims to be a diagnosis", () => {
    const note = scoreIntake(answerAllMinimal()).clinicalNote;
    expect(note).toContain("Not a diagnosis");
  });
});
