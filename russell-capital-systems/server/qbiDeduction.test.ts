// § 199A is a statute, so these tests are worked examples against the statute's
// own arithmetic rather than against whatever the code happens to do. Where a
// figure appears it is the published one, and the test names say which rule is
// being exercised.
import { describe, it, expect } from "vitest";
import {
  QBI_THRESHOLDS_2026, QBI_SOURCE, MINIMUM_DEDUCTION_2026, MINIMUM_QBI_FOR_MINIMUM_DEDUCTION_2026,
  thresholdsFor, phaseInFraction, wageLimitFor, computeQbiDeduction, distanceToThreshold,
  type Business, type QbiInput,
} from "@shared/qbiDeduction";

const practice = (over: Partial<Business> = {}): Business =>
  ({ name: "Practice", qbi: 500_000, w2Wages: 200_000, ubia: 0, isSSTB: true, ...over });

const base = (over: Partial<QbiInput> = {}): QbiInput => ({
  filingStatus: "mfj", taxableIncomeBeforeQbi: 350_000, netCapitalGain: 0,
  businesses: [practice()], ...over,
});

describe("the published 2026 figures", () => {
  it("carries Rev. Proc. 2025-32 § 3.26 verbatim", () => {
    expect(QBI_THRESHOLDS_2026.mfj).toEqual({ threshold: 403_500, phaseInTop: 553_500 });
    expect(QBI_THRESHOLDS_2026.mfs).toEqual({ threshold: 201_775, phaseInTop: 276_775 });
    expect(QBI_THRESHOLDS_2026.single).toEqual({ threshold: 201_750, phaseInTop: 276_750 });
  });

  it("treats head of household as 'All Other Returns', which is what the table says", () => {
    expect(thresholdsFor("hoh")).toEqual(thresholdsFor("single"));
  });

  it("keeps the statutory band widths: $150,000 joint, $75,000 otherwise", () => {
    expect(QBI_THRESHOLDS_2026.mfj.phaseInTop - QBI_THRESHOLDS_2026.mfj.threshold).toBe(150_000);
    expect(QBI_THRESHOLDS_2026.single.phaseInTop - QBI_THRESHOLDS_2026.single.threshold).toBe(75_000);
    expect(QBI_THRESHOLDS_2026.mfs.phaseInTop - QBI_THRESHOLDS_2026.mfs.threshold).toBe(75_000);
  });

  it("cites the source it came from, so a reader can check it", () => {
    expect(QBI_SOURCE.taxYear).toBe(2026);
    expect(QBI_SOURCE.thresholds).toMatch(/Rev\. Proc\. 2025-32/);
    expect(QBI_SOURCE.statute).toBe("26 U.S.C. § 199A");
    expect(QBI_SOURCE.minimumDeduction).toMatch(/OBBBA/);
  });

  it("carries the OBBBA minimum and its qualifying floor", () => {
    expect(MINIMUM_DEDUCTION_2026).toBe(400);
    expect(MINIMUM_QBI_FOR_MINIMUM_DEDUCTION_2026).toBe(1_000);
  });
});

describe("where in the band — § 199A(b)(3)", () => {
  it("is zero at and below the threshold", () => {
    expect(phaseInFraction(403_500, "mfj")).toBe(0);
    expect(phaseInFraction(100_000, "mfj")).toBe(0);
  });

  it("is one at and above the top", () => {
    expect(phaseInFraction(553_500, "mfj")).toBe(1);
    expect(phaseInFraction(900_000, "mfj")).toBe(1);
  });

  it("is proportional in between", () => {
    expect(phaseInFraction(478_500, "mfj")).toBeCloseTo(0.5, 10);
    expect(phaseInFraction(239_250, "single")).toBeCloseTo(0.5, 10);
  });
});

describe("the wage limit — § 199A(b)(2)(B)", () => {
  it("takes the greater of the two prongs, not the first", () => {
    // 50% of 200k = 100k; 25% of 200k + 2.5% of 0 = 50k. Half wins.
    expect(wageLimitFor(200_000, 0)).toEqual({ limit: 100_000, prong: "50% of wages" });
  });

  it("lets the property prong win when there is enough qualified property", () => {
    // 50% of 100k = 50k; 25% of 100k + 2.5% of 4m = 25k + 100k = 125k.
    expect(wageLimitFor(100_000, 4_000_000)).toEqual({ limit: 125_000, prong: "25% of wages + 2.5% of property" });
  });

  it("is zero with no wages and no property, which is the trap for a sole proprietor above the band", () => {
    expect(wageLimitFor(0, 0).limit).toBe(0);
  });
});

describe("below the threshold — § 199A(b)(3)(A)", () => {
  it("gives the full 20% to a medical practice, wage limit and SSTB status irrelevant", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 350_000, businesses: [practice({ qbi: 300_000, w2Wages: 0, ubia: 0 })] }));
    expect(r.band).toBe("below");
    expect(r.businesses[0]!.binding).toBe("below threshold — no limit");
    // 20% of 300k = 60k, and the overall cap is 20% of 350k = 70k, so QBI binds.
    expect(r.deduction).toBe(60_000);
    expect(r.boundBy).toBe("combined QBI amount");
  });

  it("still applies the § 199A(a)(2) overall cap when taxable income is the smaller number", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 200_000, businesses: [practice({ qbi: 400_000, isSSTB: false })] }));
    // 20% of 400k = 80k, but 20% of 200k taxable income = 40k.
    expect(r.deduction).toBe(40_000);
    expect(r.boundBy).toBe("20% of taxable income less capital gain");
  });

  it("removes net capital gain before the overall cap", () => {
    const withGain = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 400_000, netCapitalGain: 200_000, businesses: [practice({ qbi: 400_000 })] }));
    expect(withGain.overallCap).toBe(40_000); // 20% of (400k - 200k)
    expect(withGain.deduction).toBe(40_000);
    expect(withGain.notes.join(" ")).toMatch(/net capital gain/i);
  });
});

describe("above the phase-in top — the cliff that catches physicians", () => {
  it("phases a specified service business out to nothing", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000, businesses: [practice({ qbi: 500_000, w2Wages: 400_000 })] }));
    expect(r.band).toBe("above");
    expect(r.businesses[0]!.binding).toBe("SSTB fully phased out");
    expect(r.businesses[0]!.sstbApplicablePercentage).toBe(0);
    expect(r.businesses[0]!.amount).toBe(0);
    expect(r.combinedQbiAmount).toBe(0);
    expect(r.deductionBeforeMinimum).toBe(0);
  });

  it("but still pays the OBBBA $400 floor — a fully phased-out physician is no longer at zero", () => {
    // § 199A(i) as amended by OBBBA § 70105 is not conditioned on the wage
    // limit or on SSTB status. It asks only for $1,000 of QBI. So from tax
    // year 2026 the answer for a phased-out practice changed from nothing to
    // $400, and the page should say so rather than repeating the old rule.
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000, businesses: [practice({ qbi: 500_000, w2Wages: 400_000 })] }));
    expect(r.minimumApplied).toBe(true);
    expect(r.deduction).toBe(400);
    expect(r.boundBy).toBe("\u00a7 199A(i) minimum");
  });

  it("says plainly that a medical or dental practice is an SSTB", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000 }));
    expect(r.notes.join(" ")).toMatch(/medical or dental practice/i);
  });

  it("applies the wage limit in full to a NON-service business at the same income", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000, businesses: [practice({ qbi: 500_000, w2Wages: 120_000, isSSTB: false })] }));
    // 20% of 500k = 100k tentative; wage limit = 50% of 120k = 60k.
    expect(r.businesses[0]!.binding).toBe("wage limit");
    expect(r.businesses[0]!.amount).toBe(60_000);
    expect(r.deduction).toBe(60_000);
  });

  it("lets qualified property rescue a capital-heavy business with thin payroll", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000, businesses: [practice({ qbi: 500_000, w2Wages: 100_000, ubia: 4_000_000, isSSTB: false })] }));
    expect(r.businesses[0]!.wageLimitProng).toBe("25% of wages + 2.5% of property");
    expect(r.businesses[0]!.wageLimit).toBe(125_000);
    // tentative 100k is now under the 125k limit, so the full 20% survives.
    expect(r.businesses[0]!.amount).toBe(100_000);
  });

  it("wage-limits a sole proprietor with no wages and no property down to the statutory floor", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000, businesses: [practice({ qbi: 300_000, w2Wages: 0, ubia: 0, isSSTB: false })] }));
    expect(r.businesses[0]!.binding).toBe("wage limit");
    expect(r.businesses[0]!.amount).toBe(0);
    expect(r.deductionBeforeMinimum).toBe(0);
    // Same OBBBA floor as above: $300,000 of QBI clears the $1,000 test.
    expect(r.deduction).toBe(400);
  });
});

describe("inside the band — § 199A(b)(3)(B) and (d)(3)(A) together", () => {
  it("reduces the excess over the wage limit proportionally, not all at once", () => {
    // Halfway through the joint band, non-SSTB so only the wage limit moves.
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 478_500, businesses: [practice({ qbi: 500_000, w2Wages: 120_000, isSSTB: false })] }));
    // tentative 100k, wage limit 60k, excess 40k, half applied = 20k off.
    expect(r.phaseInFraction).toBeCloseTo(0.5, 10);
    expect(r.businesses[0]!.binding).toBe("phase-in reduction");
    expect(r.businesses[0]!.amount).toBeCloseTo(80_000, 6);
  });

  it("haircuts an SSTB's QBI, wages and property by the same fraction", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 478_500, businesses: [practice({ qbi: 500_000, w2Wages: 200_000, ubia: 100_000 })] }));
    const b = r.businesses[0]!;
    expect(b.sstbApplicablePercentage).toBeCloseTo(0.5, 10);
    expect(b.appliedQbi).toBeCloseTo(250_000, 6);
    expect(b.appliedWages).toBeCloseTo(100_000, 6);
    expect(b.appliedUbia).toBeCloseTo(50_000, 6);
  });

  it("does not reduce anything when wages already cover the full 20%", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 478_500, businesses: [practice({ qbi: 200_000, w2Wages: 400_000, isSSTB: false })] }));
    // tentative 40k, wage limit 200k — nothing to phase in.
    expect(r.businesses[0]!.amount).toBe(40_000);
    expect(r.businesses[0]!.binding).toBe("below threshold — no limit");
  });
});

describe("several businesses and other income", () => {
  it("nets a loss business against a profitable one", () => {
    const r = computeQbiDeduction(base({
      taxableIncomeBeforeQbi: 300_000,
      businesses: [practice({ name: "A", qbi: 300_000, isSSTB: false }), practice({ name: "B", qbi: -100_000, isSSTB: false })],
    }));
    // 20% of 300k = 60k, minus 20% of 100k = 20k → 40k.
    expect(r.combinedQbiAmount).toBe(40_000);
  });

  it("never lets the combined amount go negative", () => {
    const r = computeQbiDeduction(base({ businesses: [practice({ qbi: -500_000, isSSTB: false })] }));
    expect(r.combinedQbiAmount).toBe(0);
    expect(r.deduction).toBeGreaterThanOrEqual(0);
  });

  it("adds 20% of REIT and PTP income without any wage limit, even above the top", () => {
    const r = computeQbiDeduction(base({
      taxableIncomeBeforeQbi: 700_000,
      businesses: [practice({ qbi: 400_000 })],       // SSTB, fully phased out
      qualifiedReitAndPtpIncome: 50_000,
    }));
    expect(r.businesses[0]!.amount).toBe(0);
    expect(r.combinedQbiAmount).toBe(10_000);          // 20% of 50k survives
    expect(r.deduction).toBe(10_000);
  });
});

describe("the OBBBA minimum — § 199A(i)", () => {
  it("floors the deduction at $400 when there is at least $1,000 of QBI", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000, businesses: [practice({ qbi: 5_000, w2Wages: 0, isSSTB: false })] }));
    expect(r.deductionBeforeMinimum).toBe(0);
    expect(r.minimumApplied).toBe(true);
    expect(r.deduction).toBe(400);
    expect(r.boundBy).toBe("§ 199A(i) minimum");
  });

  it("does not apply below $1,000 of QBI", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000, businesses: [practice({ qbi: 500, w2Wages: 0, isSSTB: false })] }));
    expect(r.minimumApplied).toBe(false);
    expect(r.deduction).toBe(0);
  });

  it("does not reduce a larger deduction", () => {
    const r = computeQbiDeduction(base({ taxableIncomeBeforeQbi: 350_000 }));
    expect(r.minimumApplied).toBe(false);
    expect(r.deduction).toBeGreaterThan(400);
  });
});

describe("the finding that pays for the visit", () => {
  it("prices what getting back to the threshold is worth", () => {
    const input = base({ taxableIncomeBeforeQbi: 478_500, businesses: [practice({ qbi: 400_000, w2Wages: 150_000 })] });
    const d = distanceToThreshold(input);
    expect(d.toThreshold).toBe(75_000);
    expect(d.deductionAtThreshold).toBeGreaterThan(d.deductionNow);
    expect(d.gainFromReaching).toBeCloseTo(d.deductionAtThreshold - d.deductionNow, 6);
  });

  it("reports no distance when already under the threshold", () => {
    const d = distanceToThreshold(base({ taxableIncomeBeforeQbi: 300_000 }));
    expect(d.toThreshold).toBe(0);
    expect(d.gainFromReaching).toBe(0);
  });

  it("expresses the deduction in tax only when a rate was supplied", () => {
    expect(computeQbiDeduction(base()).estimatedTaxSaved).toBeNull();
    expect(computeQbiDeduction(base({ marginalRate: 0.35 })).estimatedTaxSaved).toBeCloseTo(computeQbiDeduction(base()).deduction * 0.35, 6);
  });
});

describe("what it refuses to pretend", () => {
  it("says on every result that a CPA confirms it", () => {
    const r = computeQbiDeduction(base());
    expect(r.notes.join(" ")).toMatch(/CPA confirms/i);
    expect(r.notes.join(" ")).toMatch(/not a filing position/i);
  });

  it("names the rule that actually bound each business, rather than only the number", () => {
    for (const r of [
      computeQbiDeduction(base({ taxableIncomeBeforeQbi: 300_000 })),
      computeQbiDeduction(base({ taxableIncomeBeforeQbi: 478_500 })),
      computeQbiDeduction(base({ taxableIncomeBeforeQbi: 700_000 })),
    ]) {
      for (const b of r.businesses) {
        expect(b.binding).toBeTruthy();
        expect(b.lever.length).toBeGreaterThan(30);
      }
    }
  });
});
