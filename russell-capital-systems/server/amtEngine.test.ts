/**
 * Alternative minimum tax — engine and published figures.
 *
 * Two kinds of test here, deliberately separated:
 *
 *   1. The *figures* against Rev. Proc. 2025-32. These are transcription
 *      checks. They protect against a typo in a number nobody can eyeball.
 *   2. The *engine* against hand-computed cases. These protect the arithmetic.
 *
 * The transcription checks are worth more than they look. The revenue
 * procedure publishes the complete-phaseout point as well as the exemption,
 * threshold and rate — four numbers constrained by one equation. That makes
 * each one a check on the other three, and a mistyped digit in any of them
 * fails the first test below rather than quietly changing what clients are
 * told.
 */
import { describe, expect, it } from "vitest";
import { TAX_RULES_2025, TAX_RULES_2026, AMT_KEYS, type AmtKey } from "@shared/taxRules";
import { calculateAmt, maxIsoExerciseBeforeAmt, AMT_IS_AN_ESTIMATE } from "@shared/amtEngine";

const R = TAX_RULES_2026;
const amt = R.amt!;

describe("published AMT figures — Rev. Proc. 2025-32", () => {
  it("the four published figures are mutually consistent for every filing status", () => {
    // exemption ÷ phaseOutRate + phaseOutStart === completePhaseOut.
    // The revenue procedure publishes all four; this is the free check.
    for (const k of AMT_KEYS) {
      const derived = amt.phaseOutStart[k] + amt.exemption[k] / amt.phaseOutRate;
      expect(derived, `${k}: exemption/rate + start must equal the published complete phaseout`)
        .toBe(amt.completePhaseOut[k]);
    }
  });

  it("carries the exemption amounts under §55(d)(1)", () => {
    expect(amt.exemption.joint).toBe(140_200);
    expect(amt.exemption.single).toBe(90_100);
    expect(amt.exemption.separate).toBe(70_100);
    expect(amt.exemption.estatesTrusts).toBe(31_400);
  });

  it("treats a head of household as unmarried, because the statute does", () => {
    // §55(d)(1)(B) says "Unmarried Individuals (other than Surviving Spouses)".
    // A head of household is unmarried, so it is not its own AMT line.
    expect(amt.exemption.hoh).toBe(amt.exemption.single);
    expect(amt.phaseOutStart.hoh).toBe(amt.phaseOutStart.single);
    expect(amt.completePhaseOut.hoh).toBe(amt.completePhaseOut.single);
  });

  it("carries the OBBBA phaseout rate of 50%, not the prior 25%", () => {
    // The single change most likely to be wrong, because every pre-July-2025
    // reference says 25%.
    expect(amt.phaseOutRate).toBe(0.50);
  });

  it("carries the 28% thresholds under §55(b)(1)", () => {
    expect(amt.rate28Threshold.separate).toBe(122_250);
    expect(amt.rate28Threshold.other).toBe(244_500);
    expect(amt.rates).toEqual({ low: 0.26, high: 0.28 });
  });

  it("does not claim AMT figures for 2025, which were not transcribed", () => {
    // The file's own doctrine: unpublished here means null, never guessed.
    expect(TAX_RULES_2025.amt).toBeNull();
  });

  it("refuses to compute against a rule set with no AMT figures", () => {
    expect(() =>
      calculateAmt({ filingStatus: "single", regularTaxableIncome: 500_000, regularTax: 100_000 }, TAX_RULES_2025),
    ).toThrow(/publishes no AMT figures/);
  });
});

describe("the exemption phaseout", () => {
  const at = (amti: number, filingStatus: AmtKey = "single") =>
    calculateAmt({ filingStatus, regularTaxableIncome: amti, regularTax: 0 });

  it("gives the full exemption below the threshold", () => {
    const r = at(400_000);
    expect(r.exemption).toBe(90_100);
    expect(r.exemptionLostToPhaseOut).toBe(0);
    expect(r.inPhaseOut).toBe(false);
  });

  it("loses fifty cents of exemption per dollar above the threshold", () => {
    const r = at(600_000); // $100,000 over
    expect(r.exemptionLostToPhaseOut).toBe(50_000);
    expect(r.exemption).toBe(40_100);
    expect(r.inPhaseOut).toBe(true);
  });

  it("extinguishes the exemption exactly at the published point, and not before", () => {
    expect(at(680_199).exemption).toBeGreaterThan(0);
    expect(at(680_200).exemption).toBe(0);
    expect(at(1_000_000).exemption).toBe(0);
  });

  it("never returns a negative exemption", () => {
    for (const amti of [680_200, 700_000, 5_000_000]) expect(at(amti).exemption).toBe(0);
  });

  it("stops reporting phaseout once the exemption is gone", () => {
    // Past full phaseout the extra dollar no longer erodes anything, so the
    // marginal rate drops back to the statutory rate. This is the far edge of
    // the bubble and the reason the bubble exists at all.
    const past = at(900_000);
    expect(past.inPhaseOut).toBe(false);
    expect(past.amtMarginalRate).toBe(0.28);
  });
});

describe("the AMT bubble", () => {
  it("puts the marginal rate at 42% inside the phaseout", () => {
    // $1 more AMTI costs $1 of base plus $0.50 of lost exemption = $1.50
    // taxed at 28%.
    const r = calculateAmt({ filingStatus: "single", regularTaxableIncome: 600_000, regularTax: 0 });
    expect(r.amtMarginalRate).toBe(0.42);
    expect(r.caveats.some((c) => c.includes("42%"))).toBe(true);
  });

  it("is higher than the top regular bracket, which is the point", () => {
    const bubble = calculateAmt({ filingStatus: "single", regularTaxableIncome: 600_000, regularTax: 0 });
    expect(bubble.amtMarginalRate).toBeGreaterThan(0.37);
  });

  it("is measurable as a real jump in tax across one dollar", () => {
    const a = calculateAmt({ filingStatus: "single", regularTaxableIncome: 600_000, regularTax: 0 });
    const b = calculateAmt({ filingStatus: "single", regularTaxableIncome: 600_001, regularTax: 0 });
    expect(round2(b.tentativeMinimumTax - a.tentativeMinimumTax)).toBe(0.42);
  });
});

describe("tentative minimum tax", () => {
  it("applies 26% below the threshold and 28% above it", () => {
    const r = calculateAmt({ filingStatus: "single", regularTaxableIncome: 244_500 + 90_100, regularTax: 0 });
    // AMTI is below the phaseout start, so the full exemption applies and the
    // base lands exactly on the 28% threshold.
    expect(r.amtBase).toBe(244_500);
    expect(r.tentativeMinimumTax).toBe(round2(244_500 * 0.26));
  });

  it("taxes only the excess at 28%", () => {
    const amti = 400_000;
    const r = calculateAmt({ filingStatus: "single", regularTaxableIncome: amti, regularTax: 0 });
    const base = amti - 90_100;
    const expected = 244_500 * 0.26 + (base - 244_500) * 0.28;
    expect(r.amtBase).toBe(base);
    expect(r.tentativeMinimumTax).toBe(round2(expected));
  });

  it("uses the halved threshold for married filing separately", () => {
    const r = calculateAmt({ filingStatus: "separate", regularTaxableIncome: 300_000, regularTax: 0 });
    const base = 300_000 - 70_100;
    const expected = 122_250 * 0.26 + (base - 122_250) * 0.28;
    expect(r.tentativeMinimumTax).toBe(round2(expected));
  });
});

describe("AMT owed — the comparison against regular tax", () => {
  it("owes nothing when regular tax already exceeds the tentative minimum", () => {
    // The ordinary case for a high earner with no preferences: the regular
    // system already takes more, so AMT adds nothing. Worth pinning, because
    // it is counter-intuitive that very high income often escapes AMT.
    const r = calculateAmt({ filingStatus: "single", regularTaxableIncome: 900_000, regularTax: 283_000 });
    expect(r.tentativeMinimumTax).toBeLessThan(283_000);
    expect(r.amtOwed).toBe(0);
    expect(r.owesAmt).toBe(false);
  });

  it("owes the difference when the tentative minimum is higher", () => {
    const r = calculateAmt({
      filingStatus: "joint",
      regularTaxableIncome: 500_000,
      regularTax: 100_000,
      privateActivityBondInterest: 300_000,
    });
    expect(r.amti).toBe(800_000);
    expect(r.owesAmt).toBe(true);
    expect(r.amtOwed).toBe(round2(r.tentativeMinimumTax - 100_000));
  });

  it("never reports negative AMT", () => {
    const r = calculateAmt({ filingStatus: "single", regularTaxableIncome: 100_000, regularTax: 500_000 });
    expect(r.amtOwed).toBe(0);
  });
});

describe("add-backs", () => {
  const base = { filingStatus: "single" as const, regularTaxableIncome: 300_000, regularTax: 70_000 };

  it("adds the disallowed deduction back into AMT income", () => {
    expect(calculateAmt({ ...base, disallowedDeduction: 16_100 }).amti).toBe(316_100);
  });

  it("adds the ISO bargain element, and says the credit is not modelled", () => {
    const r = calculateAmt({ ...base, isoBargainElement: 200_000 });
    expect(r.amti).toBe(500_000);
    expect(r.caveats.some((c) => c.includes("§53 minimum tax credit"))).toBe(true);
  });

  it("adds private activity bond interest", () => {
    expect(calculateAmt({ ...base, privateActivityBondInterest: 25_000 }).amti).toBe(325_000);
  });

  it("always warns that capital gains keep their preferential rate", () => {
    expect(calculateAmt(base).caveats.some((c) => c.includes("preferential rates"))).toBe(true);
  });

  it("floors AMT income at zero", () => {
    expect(calculateAmt({ filingStatus: "single", regularTaxableIncome: -50_000, regularTax: 0 }).amti).toBe(0);
  });
});

describe("the ISO exercise ceiling", () => {
  const base = { filingStatus: "single" as const, regularTaxableIncome: 300_000, regularTax: 70_000 };

  it("finds a ceiling at which no AMT is due", () => {
    const max = maxIsoExerciseBeforeAmt(base);
    expect(max).toBeGreaterThan(0);
    expect(calculateAmt({ ...base, isoBargainElement: max }).owesAmt).toBe(false);
  });

  it("is a real boundary — one dollar more triggers AMT", () => {
    const max = maxIsoExerciseBeforeAmt(base);
    expect(calculateAmt({ ...base, isoBargainElement: max + 1 }).owesAmt).toBe(true);
  });

  it("reports no room when the client is already in AMT", () => {
    const already = { filingStatus: "single" as const, regularTaxableIncome: 600_000, regularTax: 10_000 };
    expect(calculateAmt({ ...already, isoBargainElement: 0 }).owesAmt).toBe(true);
    expect(maxIsoExerciseBeforeAmt(already)).toBe(0);
  });

  it("gives a larger ceiling to a joint filer on the same facts", () => {
    const joint = maxIsoExerciseBeforeAmt({ ...base, filingStatus: "joint" });
    expect(joint).toBeGreaterThan(maxIsoExerciseBeforeAmt(base));
  });
});

describe("provenance", () => {
  it("is flagged as an estimate so no page can present it as a filing figure", () => {
    expect(AMT_IS_AN_ESTIMATE).toBe(true);
  });

  it("names its source on the rule set", () => {
    expect(R.source).toContain("Rev. Proc. 2025-32");
    expect(R.taxYear).toBe(2026);
  });

  it("returns caveats on every result, never an unqualified number", () => {
    expect(calculateAmt({ filingStatus: "single", regularTaxableIncome: 1, regularTax: 0 }).caveats.length)
      .toBeGreaterThan(0);
  });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
