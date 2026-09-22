// Tests for shared/sourcing.ts.
//
// The point of this file is not coverage for its own sake. Each test names a
// specific way a bad figure could reach a reader, and asserts the guard stops
// it. If a test here is ever deleted to make something pass, that is the tell.

import { describe as suite, it, expect } from "vitest";
import {
  assertAllSourced,
  assertQuoted,
  assertSourced,
  ageInDays,
  assumed,
  derive,
  describe as describeFigure,
  fromVerified,
  isSourced,
  isStale,
  ruled,
  sampleSizeOf,
  sourceDefect,
  sourced,
  tooThin,
  UnsourcedFindingError,
  UnsourcedQuoteError,
} from "../shared/sourcing";

const GOOD = sourced(0.0425, "Freddie Mac PMMS weekly survey", "2026-09-18", { url: "https://www.freddiemac.com/pmms", n: 52 });

suite("what counts as sourced", () => {
  it("accepts a figure with a named source and an ISO date", () => {
    expect(isSourced(GOOD)).toBe(true);
    expect(sourceDefect(GOOD)).toBeNull();
    expect(assertSourced("mortgageRate", GOOD)).toBe(0.0425);
  });

  it("accepts a figure that comes from law", () => {
    expect(isSourced(ruled(7702, "IRC 7702(f)(7)(B)", "2026-01-01"))).toBe(true);
  });

  it("rejects a missing value entirely", () => {
    expect(() => assertSourced("rate", null)).toThrow(UnsourcedFindingError);
    expect(() => assertSourced("rate", undefined)).toThrow(/no value was supplied/);
  });

  it("rejects an empty source", () => {
    expect(() => assertSourced("rate", sourced(1, "   ", "2026-01-01"))).toThrow(/no source was named/);
  });

  it("rejects source strings that name no document", () => {
    // These are the exact words that appear when someone needed to satisfy a
    // type. Each must fail, or the guard is decorative.
    for (const word of ["internal", "estimate", "TBD", "industry standard", "general knowledge", "Placeholder"]) {
      expect(() => assertSourced("rate", sourced(1, word, "2026-01-01"))).toThrow(/names no document/);
    }
  });

  it("rejects a missing or malformed as-of date", () => {
    expect(() => assertSourced("rate", sourced(1, "PMMS", ""))).toThrow(/a figure without a date is a rumour/);
    expect(() => assertSourced("rate", sourced(1, "PMMS", "Sept 2026"))).toThrow(/is not an ISO date/);
    expect(() => assertSourced("rate", sourced(1, "PMMS", "2026-9-1"))).toThrow(/is not an ISO date/);
  });

  it("rejects NaN and Infinity, which type-check as numbers but are not figures", () => {
    expect(() => assertSourced("rate", sourced(NaN, "PMMS", "2026-01-01"))).toThrow(/not a figure/);
    expect(() => assertSourced("rate", sourced(Infinity, "PMMS", "2026-01-01"))).toThrow(/not a figure/);
  });

  it("rejects a null value even when the source is impeccable", () => {
    expect(() => assertSourced("rate", sourced(null, "PMMS", "2026-01-01"))).toThrow(/value is missing/);
  });
});

suite("assumptions are legal but cannot pass as fact", () => {
  const guess = assumed(0.06, "No carrier publishes a forward rate; 6% is the midpoint of the illustrated band.");

  it("does not count as sourced", () => {
    expect(isSourced(guess)).toBe(false);
  });

  it("throws with a reason that names it as an assumption", () => {
    expect(() => assertSourced("creditedRate", guess)).toThrow(/it is an assumption/);
  });

  it("still describes itself rather than vanishing", () => {
    expect(describeFigure("creditedRate", guess)).toMatch(/we cannot show this/);
  });

  it("carries the error kind so a caller can branch on it", () => {
    try {
      assertSourced("creditedRate", guess);
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(UnsourcedFindingError);
      expect((e as UnsourcedFindingError).kind).toBe("assumption");
      expect((e as UnsourcedFindingError).field).toBe("creditedRate");
    }
  });
});

suite("instanceof survives the prototype chain", () => {
  // Guards the Object.setPrototypeOf line. Without it this passes in ESM and
  // fails when compiled down, which is the worst kind of bug: environment
  // dependent and silent.
  it("is catchable as its own class, not just as Error", () => {
    const e = new UnsourcedFindingError("x", "y");
    expect(e instanceof UnsourcedFindingError).toBe(true);
    expect(e instanceof Error).toBe(true);
    expect(new UnsourcedQuoteError("q", "r") instanceof UnsourcedQuoteError).toBe(true);
  });
});

suite("assertAllSourced", () => {
  it("unwraps a whole record when every field is sourced", () => {
    const out = assertAllSourced({
      rate: GOOD,
      cap: sourced(0.095, "Carrier rate sheet, Sept 2026", "2026-09-01"),
    });
    expect(out.rate).toBe(0.0425);
    expect(out.cap).toBe(0.095);
  });

  it("throws naming the offending field, not a generic failure", () => {
    expect(() =>
      assertAllSourced({ rate: GOOD, cap: assumed(0.095, "picked") }),
    ).toThrow(/Unsourced finding for "cap"/);
  });
});

suite("sample size travels with the figure", () => {
  it("reads n when present", () => {
    expect(sampleSizeOf(GOOD)).toBe(52);
  });

  it("returns null rather than 0 when n is absent, because unknown is not zero", () => {
    expect(sampleSizeOf(sourced(1, "PMMS", "2026-01-01"))).toBeNull();
  });

  it("treats a thin base rate as too thin at the house threshold of 15", () => {
    expect(tooThin(sourced(0.68, "tax history panel", "2026-01-01", { n: 14 }))).toBe(true);
    expect(tooThin(sourced(0.68, "tax history panel", "2026-01-01", { n: 15 }))).toBe(false);
    // A figure with no n at all is too thin by definition: we cannot say it is not.
    expect(tooThin(sourced(0.68, "tax history panel", "2026-01-01"))).toBe(true);
  });
});

suite("freshness is reported, never thrown", () => {
  const now = new Date("2026-09-22T00:00:00Z");

  it("measures age in whole days", () => {
    expect(ageInDays(sourced(1, "PMMS", "2026-09-12"), now)).toBe(10);
  });

  it("flags anything past the 90-day sweep window", () => {
    expect(isStale(sourced(1, "PMMS", "2026-09-12"), 90, now)).toBe(false);
    expect(isStale(sourced(1, "PMMS", "2026-01-01"), 90, now)).toBe(true);
  });

  it("still counts an old sourced figure as sourced — age is not a defect", () => {
    const old = sourced(1, "FHFA HPI 1999 release", "1999-03-01");
    expect(isSourced(old)).toBe(true);
    expect(isStale(old, 90, now)).toBe(true);
  });
});

suite("derive inherits the weakest link", () => {
  const a = sourced(100, "Zillow ZHVI", "2026-08-01");
  const b = sourced(4, "Freddie Mac PMMS", "2026-09-18");

  it("stays derived when every input is sourced", () => {
    const d = derive("annualCost", [a, b], () => 400);
    expect(d.kind).toBe("derived");
    expect(d.value).toBe(400);
    expect(isSourced(d)).toBe(true);
  });

  it("takes the OLDEST input date, so a derived figure is never fresher than its inputs", () => {
    expect(derive("annualCost", [a, b], () => 400).asOf).toBe("2026-08-01");
  });

  it("credits every distinct source", () => {
    expect(derive("annualCost", [a, b], () => 400).source).toBe("Zillow ZHVI + Freddie Mac PMMS");
  });

  it("degrades to an assumption if ANY input was assumed — arithmetic cannot launder a guess", () => {
    const d = derive("annualCost", [a, assumed(4, "picked")], () => 400);
    expect(d.kind).toBe("assumption");
    expect(isSourced(d)).toBe(false);
    expect(d.note).toMatch(/Rests on an assumption/);
  });

  it("refuses to derive from nothing", () => {
    expect(() => derive("x", [], () => 1)).toThrow(/at least one sourced input/);
  });
});

suite("fromVerified bridges the existing Verified<T> records", () => {
  it("carries a verified record through as sourced", () => {
    const lifted = fromVerified({ value: 0.04, verified: true, source: "Carrier rate sheet", asOf: "2026-09-01" });
    expect(isSourced(lifted)).toBe(true);
  });

  it("demotes an unverified record to an assumption rather than trusting it", () => {
    const lifted = fromVerified({ value: 0.04, verified: false, source: "", asOf: "", note: "not found" });
    expect(lifted.kind).toBe("assumption");
    expect(isSourced(lifted)).toBe(false);
  });
});

suite("quotes must appear verbatim", () => {
  const contract = `Loan Interest Payment Type: Borrow.  A 12 month lockout period begins.
    Changes from a fixed interest rate loan to an indexed loan, or to a variable
    interest rate loan  will not be allowed.`;

  it("accepts an exact quote, ignoring only whitespace differences", () => {
    expect(assertQuoted("a 12 month lockout period begins", contract)).toBeTruthy();
    expect(assertQuoted("Changes from a fixed interest rate loan to an indexed loan", contract)).toBeTruthy();
  });

  it("rejects a paraphrase, because rewording contract language can invert it", () => {
    expect(() => assertQuoted("you may switch loan types once a year", contract)).toThrow(UnsourcedQuoteError);
  });

  it("rejects an empty quote", () => {
    expect(() => assertQuoted("   ", contract)).toThrow(/the quote is empty/);
  });
});

suite("describe never throws, so a refusal can be rendered as content", () => {
  it("renders a sourced figure with its source, date and sample size", () => {
    expect(describeFigure("30-year rate", GOOD)).toBe(
      "30-year rate: 0.0425 — Freddie Mac PMMS weekly survey, as of 2026-09-18, n = 52.",
    );
  });

  it("renders a defect as a sentence instead of blowing up the page", () => {
    expect(describeFigure("cap", null)).toBe("cap: we cannot show this — no value was supplied.");
    expect(() => describeFigure("cap", undefined)).not.toThrow();
  });
});
