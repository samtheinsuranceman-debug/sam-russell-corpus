import { describe, it, expect } from "vitest";
import {
  ADJUSTED_WITH_RIDER, UNADJUSTED_EXAMPLE, chargeAtYear, compareEarlyCashValue,
  getDefaultEcvInput, riderHelps, scheduleFor, ECV_DISCLOSURE,
} from "../shared/earlyCashValue";

describe("which schedule governs — the carrier's rule, not ours", () => {
  it("puts loans and partial surrenders on the unadjusted schedule", () => {
    expect(scheduleFor("loan")).toBe("unadjusted");
    expect(scheduleFor("partial")).toBe("unadjusted");
  });

  it("puts a full surrender on the adjusted schedule", () => {
    expect(scheduleFor("full_surrender")).toBe("adjusted");
  });

  it("puts a 1035 exchange back on the UNADJUSTED side", () => {
    // The carve-out people miss: exchanging out is a full surrender in plain
    // English, and the illustration still applies the unadjusted charge.
    expect(scheduleFor("exchange_1035")).toBe("unadjusted");
    expect(riderHelps("exchange_1035")).toBe(false);
  });

  it("says plainly that the rider helps only one of the four", () => {
    const helped = (["loan", "partial", "full_surrender", "exchange_1035"] as const).filter(riderHelps);
    expect(helped).toEqual(["full_surrender"]);
  });
});

describe("the transcribed schedules", () => {
  it("holds the unadjusted charge flat for three years", () => {
    expect(chargeAtYear(UNADJUSTED_EXAMPLE, 1)).toBeCloseTo(50991.13, 2);
    expect(chargeAtYear(UNADJUSTED_EXAMPLE, 3)).toBeCloseTo(50991.13, 2);
  });

  it("declines to zero by year 11", () => {
    expect(chargeAtYear(UNADJUSTED_EXAMPLE, 4)).toBeCloseTo(44617.24, 2);
    expect(chargeAtYear(UNADJUSTED_EXAMPLE, 10)).toBeCloseTo(6373.89, 2);
    expect(chargeAtYear(UNADJUSTED_EXAMPLE, 11)).toBe(0);
    expect(chargeAtYear(UNADJUSTED_EXAMPLE, 25)).toBe(0);
  });

  it("declines by an even step from year 4 to year 11", () => {
    // Nine equal steps of ~$6,374. Checked because a transcription typo would
    // break the evenness before it broke anything else.
    for (let y = 4; y <= 10; y++) {
      const step = chargeAtYear(UNADJUSTED_EXAMPLE, y) - chargeAtYear(UNADJUSTED_EXAMPLE, y + 1);
      expect(step).toBeCloseTo(6373.89, 1);
    }
  });

  it("zeroes the adjusted schedule from year one", () => {
    expect(ADJUSTED_WITH_RIDER.byYear.every((v) => v === 0)).toBe(true);
  });

  it("carries a source and an as-of date on both", () => {
    for (const s of [UNADJUSTED_EXAMPLE, ADJUSTED_WITH_RIDER]) {
      expect(s.source).toContain("Nationwide");
      expect(s.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("a loan plan starting at month 16", () => {
  const input = { ...getDefaultEcvInput(), distributionType: "loan" as const };
  const r = compareEarlyCashValue(input);

  it("takes nothing in policy year 1 and starts in year 2", () => {
    expect(r.withoutRider[0].distributionTaken).toBe(0);
    expect(r.withoutRider[1].distributionTaken).toBeGreaterThan(0);
  });

  it("gets no accessible-value benefit from the rider — ever", () => {
    // The whole finding, as an assertion: same schedule both ways, so the
    // rider can only ever be behind by its own cost.
    expect(r.crossoverYear).toBeNull();
    expect(r.accessibleDelta.every((d) => d <= 0)).toBe(true);
  });

  it("is strictly worse with the rider, every single year", () => {
    r.withRider.forEach((row, i) => {
      expect(row.accountValue).toBeLessThan(r.withoutRider[i].accountValue);
    });
  });

  it("costs real money for nothing this plan uses", () => {
    expect(r.totalRiderCost).toBeGreaterThan(0);
    expect(r.endingValueGivenUp).toBeGreaterThan(0);
    expect(r.riderHelpsThisPlan).toBe(false);
  });

  it("says so in a verdict a page can render verbatim", () => {
    expect(r.verdict).toContain("UNADJUSTED");
    expect(r.verdict).toContain("cannot be revoked");
  });

  it("still carries the unadjusted charge against early access", () => {
    // Month 16 lands in year 2, where the charge is at its maximum. The plan
    // reaches for money in the most expensive year there is.
    expect(r.withoutRider[1].surrenderCharge).toBeCloseTo(50991.13, 2);
  });
});

describe("a full-surrender plan — the buyer the rider was built for", () => {
  const r = compareEarlyCashValue({ ...getDefaultEcvInput(), distributionType: "full_surrender" });

  it("is ahead on accessible value in year one", () => {
    expect(r.crossoverYear).toBe(1);
    expect(r.accessibleDelta[0]).toBeGreaterThan(0);
  });

  it("reports that the rider does its job", () => {
    expect(r.riderHelpsThisPlan).toBe(true);
    expect(r.verdict).toContain("ADJUSTED");
  });

  it("loses its edge once the underlying charge reaches zero", () => {
    // From year 11 the unadjusted charge is zero too, so the rider is buying
    // nothing and its cost is pure drag from there on.
    expect(r.accessibleDelta[14]).toBeLessThan(0);
  });
});

describe("honesty about what is not known", () => {
  it("never claims the rider cost is verified", () => {
    expect(compareEarlyCashValue(getDefaultEcvInput()).riderCostVerified).toBe(false);
  });

  it("says in the disclosure that the rate is a placeholder", () => {
    expect(ECV_DISCLOSURE).toContain("placeholder");
    expect(ECV_DISCLOSURE).toContain("ICC18-NWLA-538");
  });
});
