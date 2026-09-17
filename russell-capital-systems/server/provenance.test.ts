// The point of these tests is that the page cannot lie.
//
// Each trace claims a headline figure and narrates how it was produced. The
// tests recompute that figure through the real engine and assert it matches.
// If an engine changes and the narrative no longer holds, this fails — which
// is the only thing that stops an explainer page rotting into fiction.
import { describe, it, expect } from "vitest";
import {
  FIGURE_TRACES, PROVENANCE_PROMISE, STEP_KIND_LABELS, STEP_KIND_MEANING,
  trace, stepMix, type StepKind,
} from "@shared/provenance";

const KINDS: StepKind[] = ["input", "sourced", "rule", "arithmetic", "assumption"];

describe("every trace reproduces its own headline figure", () => {
  for (const t of FIGURE_TRACES) {
    it(`${t.id}: the displayed figure is what the engine actually returns`, () => {
      expect(t.verify(), `${t.id} has drifted from ${t.engine}`).toBe(t.figure);
    });
  }

  it("covers more than one engine, so the page is not a demonstration of one file", () => {
    expect(new Set(FIGURE_TRACES.map((t) => t.engine)).size).toBeGreaterThanOrEqual(3);
  });
});

describe("the traces' shape", () => {
  it("has unique ids and a headline that reads as a sentence someone would say", () => {
    expect(new Set(FIGURE_TRACES.map((t) => t.id)).size).toBe(FIGURE_TRACES.length);
    for (const t of FIGURE_TRACES) {
      expect(t.headline.length, t.id).toBeGreaterThan(30);
      expect(t.question.endsWith("?"), `${t.id} question must be a question`).toBe(true);
    }
  });

  it("numbers every step from one, with no gaps", () => {
    for (const t of FIGURE_TRACES) {
      expect(t.steps.map((s) => s.n), t.id).toEqual(Array.from({ length: t.steps.length }, (_, i) => i + 1));
    }
  });

  it("names the page and the engine, so a reader can go and look", () => {
    for (const t of FIGURE_TRACES) {
      expect(t.pagePath, t.id).toMatch(/^\/portal\//);
      expect(t.engine, t.id).toMatch(/^shared\/.*\.ts$/);
    }
  });

  it("gives every step a kind we actually define", () => {
    for (const t of FIGURE_TRACES) {
      for (const s of t.steps) expect(KINDS, `${t.id} step ${s.n}`).toContain(s.kind);
    }
  });

  it("says what breaks if each step is wrong — a step nobody can be wrong about is not a step", () => {
    for (const t of FIGURE_TRACES) {
      for (const s of t.steps) {
        expect(s.ifWrong.length, `${t.id} step ${s.n} (${s.label}) has no failure note`).toBeGreaterThan(30);
      }
    }
  });

  it("writes out the working on every arithmetic step, so it can be redone by hand", () => {
    for (const t of FIGURE_TRACES) {
      for (const s of t.steps.filter((x) => x.kind === "arithmetic")) {
        expect(s.working, `${t.id} step ${s.n} shows no working`).toBeTruthy();
        expect(s.working!.length).toBeGreaterThan(15);
      }
    }
  });

  it("dates or cites every sourced step, and links it where a link exists", () => {
    for (const t of FIGURE_TRACES) {
      for (const s of t.steps.filter((x) => x.kind === "sourced" || x.kind === "rule")) {
        expect(s.from.length, `${t.id} step ${s.n} must name its source`).toBeGreaterThan(25);
        if (s.url) expect(s.url).toMatch(/^https:\/\//);
      }
    }
  });

  it("carries a caveat on every trace, never an unqualified claim", () => {
    for (const t of FIGURE_TRACES) expect(t.caveat.length, t.id).toBeGreaterThan(80);
  });
});

describe("the traces earn their place", () => {
  it("starts with one that has no assumptions at all, so the format is learned on the easy case", () => {
    const first = FIGURE_TRACES[0]!;
    expect(stepMix(first).assumption).toBe(0);
    expect(first.caveat).toMatch(/nothing in it we chose/i);
  });

  it("includes a trace where the law, not the firm, decides the answer", () => {
    const withRules = FIGURE_TRACES.filter((t) => stepMix(t).rule >= 3);
    expect(withRules.length).toBeGreaterThan(0);
    expect(withRules.some((t) => t.steps.some((s) => s.from.includes("§")))).toBe(true);
  });

  it("includes a trace that links out to the document it transcribed", () => {
    expect(FIGURE_TRACES.some((t) => t.steps.some((s) => Boolean(s.url)))).toBe(true);
  });

  it("every trace mixes at least three kinds of step — a chain of one kind explains nothing", () => {
    for (const t of FIGURE_TRACES) {
      const used = KINDS.filter((k) => stepMix(t)[k] > 0);
      expect(used.length, `${t.id} only uses ${used.join(", ")}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("the segment trace makes the point that halving a two-year credit is wrong", () => {
    const seg = trace("segment-credit")!;
    const step = seg.steps.find((s) => s.label.includes("annual rate"))!;
    expect(step.from).toMatch(/NOT the credit divided by two/i);
    expect(step.working).toMatch(/if you simply halved it/i);
  });

  it("the mortgage trace names the convention rather than assuming the reader knows it", () => {
    const m = trace("mortgage-interest-share")!;
    expect(m.steps.some((s) => s.kind === "rule" && s.value.includes("÷ 12"))).toBe(true);
  });
});

describe("the promise the page makes", () => {
  it("distinguishes what you typed, what was sourced, what the law set and what we assumed", () => {
    const text = PROVENANCE_PROMISE.join(" ");
    expect(text).toMatch(/something you typed/i);
    expect(text).toMatch(/names the document and the date/i);
    expect(text).toMatch(/marked as the law's/i);
    expect(text).toMatch(/marked as an assumption/i);
  });

  it("invites the reader to find the mistake", () => {
    expect(PROVENANCE_PROMISE.join(" ")).toMatch(/find our mistake/i);
  });

  it("labels and explains every step kind for a reader who has never seen one", () => {
    for (const k of KINDS) {
      expect(STEP_KIND_LABELS[k]).toBeTruthy();
      expect(STEP_KIND_MEANING[k].length, k).toBeGreaterThan(60);
    }
  });

  it("is explicit that an input is not checked for the client", () => {
    expect(STEP_KIND_MEANING.input).toMatch(/did not check it/i);
  });

  it("is explicit that an assumption is a choice, not a fact", () => {
    expect(STEP_KIND_MEANING.assumption).toMatch(/Nobody knows this/i);
  });
});

describe("lookup", () => {
  it("finds a trace by id and returns undefined for an unknown one", () => {
    expect(trace("qbi-deduction")?.page).toBe("QBI / Section 199A Optimizer");
    expect(trace("nope")).toBeUndefined();
  });
});

describe("the Fact Finder points at the half it does not ask about", () => {
  it("links Ecological Drivers, and says why", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(import.meta.dirname, "..", "client/src/pages/portal/FinancialAssessment.tsx"), "utf8");
    expect(src, "the Fact Finder must link Ecological Drivers").toContain('href="/portal/ecological-drivers"');
    expect(src).toMatch(/This page only asks about money/i);
    expect(src).toMatch(/Health, purpose, relationships and where you live/i);
  });

  it("the provenance page is reachable and catalogued", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = join(import.meta.dirname, "..");
    expect(readFileSync(join(root, "client/src/App.tsx"), "utf8")).toContain('path="/portal/how-a-figure-is-made"');
    expect(readFileSync(join(root, "shared/calculatorCatalog.ts"), "utf8")).toContain('/portal/how-a-figure-is-made');
  });
});
