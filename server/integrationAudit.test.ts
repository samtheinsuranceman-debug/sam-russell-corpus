// The audit reads the code. These tests make sure it reads the right things
// — that a dimension flips when the code changes the way the audit says it
// does — and that the hand ratings cannot orphan themselves.
import { describe, it, expect } from "vitest";
import { auditCatalogue, auditSummary, auditPage, DIMENSION_WEIGHT, type DimensionId } from "./integrationAudit";
import { CALCULATORS, calculator } from "@shared/calculatorCatalog";
import { PAGE_RATINGS, RATED_COUNT, rating } from "@shared/pageRatings";

const audits = auditCatalogue();
const byPath = new Map(audits.map((a) => [a.path, a]));

describe("the audit covers the catalogue", () => {
  it("scores every catalogue page exactly once", () => {
    expect(audits.length).toBe(CALCULATORS.length);
    expect(new Set(audits.map((a) => a.path)).size).toBe(CALCULATORS.length);
  });

  it("weights sum to ten, so a full score means ten", () => {
    const total = (Object.values(DIMENSION_WEIGHT) as number[]).reduce((n, w) => n + w, 0);
    expect(total).toBe(10);
    for (const a of audits) { expect(a.score).toBeGreaterThanOrEqual(0); expect(a.score).toBeLessThanOrEqual(10); }
  });

  it("names a file or a path in every missing item, so each one is a task", () => {
    for (const a of audits) for (const m of a.missing) {
      expect(/shared\/|client\/|server\/|App\.tsx|\/portal\/|\/ultra-calculator/.test(m), `${a.path}: "${m}"`).toBe(true);
    }
  });

  it("gives every true dimension a piece of evidence", () => {
    for (const a of audits) for (const d of Object.keys(a.dims) as DimensionId[]) {
      if (a.dims[d] && d !== "crossLinked") expect(a.evidence[d], `${a.path} ${d}`).toBeTruthy();
    }
  });
});

describe("the dimensions read what they claim to read", () => {
  it("marks every catalogue page routed — the catalogue test already enforces it, this checks the audit agrees", () => {
    expect(audits.filter((a) => !a.dims.routed).map((a) => a.path)).toEqual([]);
  });

  it("sees the sequence planner as engine-declared, brain-wired and tested", () => {
    const a = byPath.get("/portal/sequence-planner")!;
    expect(a.dims.engine).toBe(true);
    expect(a.dims.brain).toBe(true);
    expect(a.dims.tested).toBe(true);
    expect(a.dims.pageImports).toBe(true);
  });

  it("sees the mortgage ledger as provenance-traced and genome-linked", () => {
    const a = byPath.get("/portal/mortgage-ledger")!;
    expect(a.dims.provenance).toBe(true);
    expect(a.dims.genome).toBe(true);
  });

  it("sees a live-data page as live and a static one as not", () => {
    expect(byPath.get("/portal/zip-engine")!.dims.liveData).toBe(true);
    expect(byPath.get("/portal/mechanisms")!.dims.liveData).toBe(false);
  });

  it("does not count taxBracketEngine boilerplate as a real engine import", () => {
    // Dozens of pages import taxBracketEngine for a formatter. A page whose ONLY
    // shared import is that one is not wired to an engine, and the audit must
    // not be fooled. Find one such page and check.
    const boilerplate = audits.find((a) => a.evidence.pageImports === undefined && !a.dims.pageImports && a.dims.routed);
    expect(boilerplate).toBeTruthy();
  });

  it("scores the mechanism pages above the median, because they were built wired", () => {
    const scores = audits.map((a) => a.score).sort((a, b) => a - b);
    const median = scores[Math.floor(scores.length / 2)];
    for (const id of ["policy-loan", "velocity-heloc", "brrrr-dscr", "equity-share", "seller-wrap"]) {
      expect(byPath.get(`/portal/mechanism/${id}`)!.score, id).toBeGreaterThanOrEqual(median);
    }
  });
});

describe("the summary", () => {
  it("counts gaps per dimension and they never exceed the page count", () => {
    const s = auditSummary(audits);
    for (const d of Object.keys(s.gaps) as DimensionId[]) {
      expect(s.gaps[d]).toBeGreaterThanOrEqual(0);
      expect(s.gaps[d]).toBeLessThanOrEqual(s.pages);
    }
    expect(s.mean).toBeGreaterThan(0);
  });

  it("finds the data routers that actually fetch external sources", () => {
    const s = auditSummary(audits);
    for (const r of ["zip", "erosion", "outsideForces", "career"]) expect(s.dataRouters, r).toContain(r);
  });
});

describe("the hand ratings", () => {
  it("rate around fifty pages, every one of them in the catalogue", () => {
    expect(RATED_COUNT).toBeGreaterThanOrEqual(50);
    const orphans = PAGE_RATINGS.filter((r) => !calculator(r.path));
    expect(orphans.map((r) => r.path), "ratings for paths not in the catalogue").toEqual([]);
  });

  it("keep value and frequency in range and separate", () => {
    for (const r of PAGE_RATINGS) {
      expect(r.value).toBeGreaterThanOrEqual(1); expect(r.value).toBeLessThanOrEqual(10);
      expect(r.frequency).toBeGreaterThanOrEqual(1); expect(r.frequency).toBeLessThanOrEqual(10);
    }
    expect(PAGE_RATINGS.some((r) => r.value !== r.frequency)).toBe(true);
  });

  it("give every rated page a condition and at least one named connection", () => {
    for (const r of PAGE_RATINGS) {
      expect(r.conditions.length, r.path).toBeGreaterThan(20);
      expect(r.connectTo.length, r.path).toBeGreaterThanOrEqual(1);
    }
  });

  it("rate every featured page, because those are the ones a visitor sees first", () => {
    const unrated = CALCULATORS.filter((c) => c.featured && !rating(c.path)).map((c) => c.path);
    expect(unrated).toEqual([]);
  });

  it("do not duplicate a path", () => {
    expect(new Set(PAGE_RATINGS.map((r) => r.path)).size).toBe(PAGE_RATINGS.length);
  });
});
