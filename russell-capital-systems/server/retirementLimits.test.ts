// These are published figures. The tests assert them against the notice, so a
// typo cannot survive, and assert the staleness behaviour, so next year's
// figures cannot be quietly used as this year's.
import { describe, it, expect } from "vitest";
import {
  LIMITS_SOURCE, RETIREMENT_LIMITS_2026, IRA_DEDUCTION_PHASEOUT_2026,
  limit, amount, changedThisYear, isStale, staleNote, maxDefinedContribution,
} from "@shared/retirementLimits";

describe("IRS Notice 2025-67, quoted", () => {
  it("cites the notice, the release and the effective date", () => {
    expect(LIMITS_SOURCE.notice).toBe("IRS Notice 2025-67 (13 November 2025)");
    expect(LIMITS_SOURCE.release).toBe("IR-2025-111");
    expect(LIMITS_SOURCE.taxYear).toBe(2026);
    expect(LIMITS_SOURCE.effective).toBe("1 January 2026");
  });

  it("carries the § 415 limits and their prior amounts", () => {
    expect(limit("db-annual-benefit")).toMatchObject({ amount: 290_000, prior: 280_000, code: "§ 415(b)(1)(A)" });
    expect(limit("dc-annual-additions")).toMatchObject({ amount: 72_000, prior: 70_000, code: "§ 415(c)(1)(A)" });
  });

  it("carries the deferral and catch-up amounts", () => {
    expect(amount("elective-deferral")).toBe(24_500);
    expect(amount("govt-457-deferral")).toBe(24_500);
    expect(amount("catchup-50")).toBe(8_000);
    expect(amount("catchup-60-63")).toBe(11_250);
  });

  it("carries the IRA amounts", () => {
    expect(amount("ira")).toBe(7_500);
    expect(amount("ira-catchup")).toBe(1_100);
  });

  it("records the 60-to-63 catch-up as unchanged, which the notice states explicitly", () => {
    const l = limit("catchup-60-63")!;
    expect(l.amount).toBe(l.prior);
    expect(changedThisYear().map((x) => x.id)).not.toContain("catchup-60-63");
  });

  it("lists exactly the limits that moved", () => {
    expect(changedThisYear().map((l) => l.id).sort()).toEqual(
      ["catchup-50", "db-annual-benefit", "dc-annual-additions", "elective-deferral", "govt-457-deferral", "ira", "ira-catchup"].sort(),
    );
  });

  it("gives every limit a Code section and a plain-language explanation", () => {
    for (const l of RETIREMENT_LIMITS_2026) {
      expect(l.code.length, l.id).toBeGreaterThan(2);
      expect(l.what.length, l.id).toBeGreaterThan(40);
    }
  });

  it("carries the single-filer IRA deduction phase-out that sends a high earner to the back door", () => {
    expect(IRA_DEDUCTION_PHASEOUT_2026.singleCoveredByPlan).toMatchObject({ start: 81_000, end: 91_000 });
  });
});

describe("refusing to invent a limit", () => {
  it("throws rather than returning zero for an unknown id", () => {
    expect(() => amount("made-up")).toThrow(/Unknown retirement limit/);
  });
});

describe("staleness", () => {
  it("is not stale during the year it covers", () => {
    expect(isStale(new Date("2026-12-31T00:00:00Z"))).toBe(false);
    expect(staleNote(new Date("2026-06-01T00:00:00Z"))).toBeNull();
  });

  it("goes stale the moment the calendar turns", () => {
    expect(isStale(new Date("2027-01-01T00:00:00Z"))).toBe(true);
    expect(staleNote(new Date("2027-03-01T00:00:00Z"))).toMatch(/has not been updated/);
  });
});

describe("catch-ups sit outside the annual additions limit", () => {
  it("adds nothing below 50", () => {
    expect(maxDefinedContribution(42)).toEqual({ base: 72_000, catchUp: 0, total: 72_000, which: "no catch-up below 50" });
  });

  it("adds the age-50 catch-up on top of § 415(c), per 26 CFR 1.415(c)-1(b)(2)(i)(B)", () => {
    expect(maxDefinedContribution(55)).toMatchObject({ catchUp: 8_000, total: 80_000 });
  });

  it("uses the enhanced catch-up inside the 60-to-63 window", () => {
    expect(maxDefinedContribution(61)).toMatchObject({ catchUp: 11_250, total: 83_250 });
  });

  it("drops back to the ordinary catch-up at 64 — the window closes", () => {
    expect(maxDefinedContribution(64)).toMatchObject({ catchUp: 8_000, total: 80_000 });
  });
});
