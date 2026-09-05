import { describe, it, expect, beforeAll } from "vitest";
import {
  buildIndex, searchCorpus, getCorpusStats, isCorpusReady,
  logEvaluation, getEvaluationReport,
  type CorpusChunk,
} from "./corpus";

describe("corpus search", () => {
  const testChunks: CorpusChunk[] = [
    { id: "1", source: "journal/001.md", text: "The jagged frontier describes where AI excels and where it fails. Some tasks are inside the frontier and others are outside.", lineStart: 1, lineEnd: 5 },
    { id: "2", source: "journal/002.md", text: "Buying signals in sales calls include verbal cues like asking about pricing, timeline questions, and implementation details.", lineStart: 1, lineEnd: 5 },
    { id: "3", source: "journal/003.md", text: "The AQAL framework maps four quadrants: interior individual, exterior individual, interior collective, exterior collective.", lineStart: 1, lineEnd: 5 },
    { id: "4", source: "journal/004.md", text: "Prediction machines make prediction cheap. When prediction becomes cheap, judgment becomes more valuable.", lineStart: 1, lineEnd: 5 },
    { id: "5", source: "journal/005.md", text: "The alignment problem asks how we ensure AI systems pursue goals that humans actually endorse rather than proxy objectives.", lineStart: 1, lineEnd: 5 },
    { id: "6", source: "calibration/session_1.md", text: "Sam prefers direct communication. He values honesty over comfort. His primary rep system is kinesthetic with visual secondary.", lineStart: 1, lineEnd: 5 },
    { id: "7", source: "coaching/letter_1.md", text: "Your strength in interpersonal intelligence combined with strategic thinking creates a rare pattern for leadership coaching.", lineStart: 1, lineEnd: 5 },
  ];

  beforeAll(() => {
    buildIndex(testChunks);
  });

  it("should report corpus as ready after building index", () => {
    expect(isCorpusReady()).toBe(true);
  });

  it("should return correct stats", () => {
    const stats = getCorpusStats();
    expect(stats.totalChunks).toBe(7);
    expect(stats.vocabularySize).toBeGreaterThan(0);
    expect(stats.ready).toBe(true);
  });

  it("should find relevant results for 'sales buying signals'", () => {
    const results = searchCorpus("sales buying signals", 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe("journal/002.md");
  });

  it("should find relevant results for 'AQAL quadrants'", () => {
    const results = searchCorpus("AQAL quadrants framework", 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe("journal/003.md");
  });

  it("should find relevant results for 'alignment AI goals'", () => {
    const results = searchCorpus("alignment AI goals humans", 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe("journal/005.md");
  });

  it("should return empty results when corpus is queried with gibberish", () => {
    const results = searchCorpus("xyzzy foobar baz qux", 3);
    // May return 0 or low-score results
    if (results.length > 0) {
      expect(results[0].score).toBeLessThan(0.3);
    }
  });

  it("should respect topK parameter", () => {
    const results = searchCorpus("intelligence", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe("evaluation cadence", () => {
  it("should log an evaluation entry", () => {
    logEvaluation({
      sessionId: "test-session-1",
      timestamp: Date.now() - 3 * 86400000,
      metrics: {
        signalDetection: 8,
        calibrationAccuracy: 9,
        frontierAwareness: 7,
        relationshipDepth: 9,
        integrationScore: 8,
      },
      notes: "Good session, missed one signal",
      overallScore: 8.2,
    });

    logEvaluation({
      sessionId: "test-session-2",
      timestamp: Date.now() - 2 * 86400000,
      metrics: {
        signalDetection: 7,
        calibrationAccuracy: 8,
        frontierAwareness: 8,
        relationshipDepth: 9,
        integrationScore: 8,
      },
      notes: "Signal detection still weak",
      overallScore: 8.0,
    });

    logEvaluation({
      sessionId: "test-session-3",
      timestamp: Date.now(),
      metrics: {
        signalDetection: 6,
        calibrationAccuracy: 8,
        frontierAwareness: 8,
        relationshipDepth: 9,
        integrationScore: 8,
      },
      notes: "Signal detection declining",
      overallScore: 7.8,
    });

    const report = getEvaluationReport();
    expect(report.entries.length).toBe(3);
    expect(report.entries[0].sessionId).toBe("test-session-3"); // most recent first
  });

  it("should detect drift when metrics decline over 3 sessions", () => {
    const report = getEvaluationReport();
    // signalDetection went 8 → 7 → 6, which is a decline
    expect(report.driftAlerts.length).toBeGreaterThan(0);
    expect(report.driftAlerts[0]).toContain("signalDetection");
  });

  it("should report trend directions", () => {
    const report = getEvaluationReport();
    expect(report.trend.length).toBe(5);
    const signalTrend = report.trend.find(t => t.metric === "signalDetection");
    expect(signalTrend?.direction).toBe("declining");
  });
});
