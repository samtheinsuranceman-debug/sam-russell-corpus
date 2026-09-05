import { describe, it, expect } from "vitest";
import {
  funnelMetrics, percentile, pipelineHealth, cac, retention, goNoGo,
  type FunnelEvent,
} from "./metrics";

const ev = (type: string, extra: Partial<FunnelEvent> = {}): FunnelEvent => ({
  type, createdAt: 0, ...extra,
});

describe("analytics — funnel conversion", () => {
  it("counts stages and computes conversion ratios", () => {
    const events = [
      ...Array(100).fill(0).map(() => ev("landing_view")),
      ...Array(40).fill(0).map(() => ev("assessment_start")),
      ...Array(20).fill(0).map(() => ev("assessment_complete")),
      ...Array(4).fill(0).map(() => ev("subscription_created")),
    ];
    const m = funnelMetrics(events);
    expect(m.counts.landing_view).toBe(100);
    expect(m.counts.assessment_start).toBe(40);
    expect(m.conversion.startToComplete).toBeCloseTo(0.5, 6);   // 20/40
    expect(m.conversion.completeToPaid).toBeCloseTo(0.2, 6);    // 4/20
    expect(m.conversion.landingToPaid).toBeCloseTo(0.04, 6);    // 4/100
  });

  it("returns null ratios when a denominator is zero", () => {
    const m = funnelMetrics([]);
    expect(m.conversion.startToComplete).toBeNull();
    expect(m.conversion.completeToPaid).toBeNull();
  });
});

describe("analytics — percentiles & pipeline health", () => {
  it("percentile uses nearest-rank", () => {
    const v = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(percentile(v, 0.5)).toBe(50);
    expect(percentile(v, 0.95)).toBe(100);
    expect(percentile([], 0.5)).toBeNull();
  });

  it("pipeline health reports error rate and latency percentiles", () => {
    const events = [
      ev("score_llm", { numericValue: 100, ok: true }),
      ev("score_llm", { numericValue: 200, ok: true }),
      ev("score_llm", { numericValue: 300, ok: false }),
      ev("score_llm", { numericValue: 400, ok: true }),
    ];
    const h = pipelineHealth(events, "score_llm");
    expect(h.count).toBe(4);
    expect(h.errorRate).toBeCloseTo(0.25, 6);
    expect(h.p50Ms).toBe(200);
    expect(h.p95Ms).toBe(400);
  });

  it("pipeline health is empty-safe", () => {
    expect(pipelineHealth([], "score_stt")).toEqual({ count: 0, errorRate: null, p50Ms: null, p95Ms: null });
  });
});

describe("analytics — CAC", () => {
  it("divides spend by new subscribers", () => {
    expect(cac(30000, 10)).toBe(3000); // $300 / 10 = $30 (3000 cents)
    expect(cac(30000, 0)).toBeNull();
  });
});

describe("analytics — month-2 retention", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = 100 * DAY;

  it("counts a cancel inside the window as churn and ignores too-recent signups", () => {
    const r = retention({
      now,
      windowDays: 60,
      created: [
        { userId: 1, at: 0 },        // eligible (age 100d), no cancel → retained
        { userId: 2, at: 10 * DAY }, // eligible, cancels at day 40 (<60 of signup) → churned
        { userId: 3, at: 90 * DAY }, // too recent (age 10d) → not eligible
      ],
      canceled: [{ userId: 2, at: 40 * DAY }],
    });
    expect(r.eligible).toBe(2);
    expect(r.churned).toBe(1);
    expect(r.retained).toBe(1);
    expect(r.churnRate).toBeCloseTo(0.5, 6);
    expect(r.retainedRate).toBeCloseTo(0.5, 6);
  });

  it("a cancel AFTER the window does not count as month-2 churn", () => {
    const r = retention({
      now,
      windowDays: 60,
      created: [{ userId: 1, at: 0 }],
      canceled: [{ userId: 1, at: 70 * DAY }], // canceled after 60d window
    });
    expect(r.churned).toBe(0);
    expect(r.retained).toBe(1);
  });
});

describe("analytics — go/no-go", () => {
  it("passes/fails each threshold and marks null when data is missing", () => {
    const rows = goNoGo({ completeToPaid: 0.08, cacCents: 12000, month2ChurnRate: 0.4 });
    const byMetric = Object.fromEntries(rows.map((r) => [r.metric, r]));
    expect(byMetric["assessment→paid conversion"].pass).toBe(true);  // 0.08 ≥ 0.05
    expect(byMetric["CAC (cents)"].pass).toBe(true);                 // 12000 ≤ 15000
    expect(byMetric["month-2 churn"].pass).toBe(false);             // 0.4 ≤ 0.30 ? no
    const missing = goNoGo({ completeToPaid: null, cacCents: null, month2ChurnRate: null });
    expect(missing.every((r) => r.pass === null)).toBe(true);
  });
});
