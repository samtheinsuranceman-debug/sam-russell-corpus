import { describe, it, expect } from "vitest";
import {
  allInSubordinateCost,
  classifyCarveouts,
  compareSubordinateCapital,
  scoreCmbsFlexibility,
  scoreControlAsymmetry,
  subordinateTaxFlags,
  type CmbsTerms,
  type SubordinateCapitalTerms,
} from "../shared/realEstateStructuredFinanceEngine";

const baseCmbs: CmbsTerms = {
  lockoutMonths: 24,
  prepayment: { kind: "defeasance" },
  termMonths: 120,
  expectedHoldMonths: 120,
  requiresSpe: true,
  requiresIndependentManager: false,
  cashManagement: "springing",
  transferRestrictions: "consent_required",
  additionalDebtPermitted: false,
  reserveRequirements: ["taxes", "insurance", "replacement"],
  nonrecourseCarveouts: ["fraud", "waste", "bankruptcy filing"],
  assumable: true,
};

describe("CMBS flexibility cost", () => {
  it("scores inside 0..1", () => {
    const s = scoreCmbsFlexibility(baseCmbs);
    expect(s.flexibilityCost).toBeGreaterThanOrEqual(0);
    expect(s.flexibilityCost).toBeLessThanOrEqual(1);
  });

  it("punishes a hold that ends inside the lockout", () => {
    const matched = scoreCmbsFlexibility(baseCmbs);
    const early = scoreCmbsFlexibility({ ...baseCmbs, expectedHoldMonths: 18 });
    expect(early.flexibilityCost).toBeGreaterThan(matched.flexibilityCost);
    expect(early.drivers.join(" ")).toMatch(/lockout/i);
  });

  it("prices defeasance above a step-down", () => {
    const defeasance = scoreCmbsFlexibility(baseCmbs);
    const stepDown = scoreCmbsFlexibility({
      ...baseCmbs,
      prepayment: { kind: "step_down", stepDownPctByYear: [0.05, 0.04] },
    });
    expect(defeasance.flexibilityCost).toBeGreaterThan(stepDown.flexibilityCost);
  });

  it("penalises hard cash management and prohibited transfers", () => {
    const harsh = scoreCmbsFlexibility({
      ...baseCmbs,
      cashManagement: "hard",
      transferRestrictions: "prohibited",
    });
    expect(harsh.flexibilityCost).toBeGreaterThan(scoreCmbsFlexibility(baseCmbs).flexibilityCost);
    expect(harsh.drivers.join(" ")).toMatch(/swept|prohibited/i);
  });

  it("flags tenant concentration and rollover", () => {
    const risky = scoreCmbsFlexibility({
      ...baseCmbs,
      tenantConcentrationPct: 0.55,
      leaseRolloverPctDuringTerm: 0.6,
    });
    expect(risky.drivers.join(" ")).toMatch(/concentration/i);
    expect(risky.drivers.join(" ")).toMatch(/roll/i);
  });

  it("gives a clean, flexible loan a low cost", () => {
    const easy = scoreCmbsFlexibility({
      ...baseCmbs,
      lockoutMonths: 0,
      prepayment: { kind: "none" },
      cashManagement: "none",
      transferRestrictions: "none",
      additionalDebtPermitted: true,
      requiresSpe: false,
      reserveRequirements: [],
      expectedHoldMonths: 120,
    });
    expect(easy.flexibilityCost).toBeLessThan(0.15);
  });

  it("carries its drivers so the score can be explained", () => {
    expect(scoreCmbsFlexibility(baseCmbs).drivers.length).toBeGreaterThan(0);
  });
});

describe("nonrecourse carveouts", () => {
  it("separates springing recourse from standard carveouts", () => {
    const c = classifyCarveouts([
      "fraud or intentional misrepresentation",
      "physical waste of the property",
      "voluntary bankruptcy petition",
      "prohibited transfer of the property",
      "failure to maintain SPE covenants",
      "something entirely bespoke",
    ]);
    // Springing carveouts convert the WHOLE loan to recourse — a bigger risk.
    expect(c.springingRecourse.length).toBe(3);
    expect(c.standard.length).toBe(2);
    expect(c.unusual).toEqual(["something entirely bespoke"]);
  });

  it("handles an empty list", () => {
    const c = classifyCarveouts([]);
    expect(c.standard).toHaveLength(0);
    expect(c.springingRecourse).toHaveLength(0);
  });
});

/* ═══ Mezzanine vs preferred equity ════════════════════════════════════════ */

const mezz: SubordinateCapitalTerms = {
  instrument: "mezzanine",
  amount: 2_000_000,
  rate: 0.12,
  accrualKind: "current_pay",
  termMonths: 36,
  originationFeePct: 0.02,
  exitFeePct: 0.01,
  uccEquityPledge: true,
  intercreditorCureRights: true,
  standstillMonths: 6,
  consentRightsOver: ["sale", "refinance"],
};

const pref: SubordinateCapitalTerms = {
  instrument: "preferred_equity",
  amount: 2_000_000,
  rate: 0.13,
  accrualKind: "accrual",
  termMonths: 36,
  canRemoveManager: true,
  canForceSale: true,
  forcedRedemptionMonths: 36,
  upsideParticipationPct: 0.15,
  consentRightsOver: ["sale", "refinance", "budget", "capex"],
};

describe("control asymmetry", () => {
  it("flags the UCC pledge as the defining mezzanine risk", () => {
    const c = scoreControlAsymmetry(mezz);
    expect(c.instrument).toBe("mezzanine");
    expect(c.triggers.join(" ")).toMatch(/UCC/);
    expect(c.triggers.join(" ")).toMatch(/foreclose on the EQUITY/i);
  });

  it("scores a preferred holder with removal and forced-sale rights higher", () => {
    expect(scoreControlAsymmetry(pref).controlAsymmetryScore).toBeGreaterThan(
      scoreControlAsymmetry(mezz).controlAsymmetryScore,
    );
  });

  it("reports the specific control levers, not just a number", () => {
    const c = scoreControlAsymmetry(pref);
    expect(c.canBlockSale).toBe(true);
    expect(c.canBlockRefinance).toBe(true);
    expect(c.canReplaceManagement).toBe(true);
    expect(c.canForceRedemption).toBe(true);
  });

  it("stays inside 0..1 even when every lever is present", () => {
    const worst = scoreControlAsymmetry({
      ...pref,
      consentRightsOver: ["sale", "refinance", "budget", "capex", "leasing", "distributions"],
      upsideParticipationPct: 0.5,
    });
    expect(worst.controlAsymmetryScore).toBeLessThanOrEqual(1);
  });

  it("penalises a short standstill on mezzanine", () => {
    const short = scoreControlAsymmetry({ ...mezz, standstillMonths: 1 });
    expect(short.controlAsymmetryScore).toBeGreaterThan(
      scoreControlAsymmetry(mezz).controlAsymmetryScore,
    );
  });
});

describe("all-in subordinate cost", () => {
  it("prices current-pay interest linearly", () => {
    const c = allInSubordinateCost(mezz, 36);
    // 12% on 2M for 3 years = 720k interest, + 40k origination + 20k exit
    const interest = c.components.find((x) => x.label === "Interest")!;
    expect(interest.amount).toBeCloseTo(720_000, 0);
    expect(c.totalCost).toBeCloseTo(780_000, 0);
  });

  it("compounds an accruing balance above simple interest", () => {
    const accruing = allInSubordinateCost({ ...mezz, accrualKind: "accrual" }, 36);
    const current = allInSubordinateCost(mezz, 36);
    const a = accruing.components.find((x) => x.label === "Interest")!;
    const b = current.components.find((x) => x.label === "Interest")!;
    expect(a.amount).toBeGreaterThan(b.amount);
  });

  it("shows the quoted rate understates the true cost", () => {
    const c = allInSubordinateCost(mezz, 36);
    // Quoted 12%; fees push the real annualized cost above it.
    expect(c.annualizedRate).toBeGreaterThan(mezz.rate);
  });

  it("includes the equity kicker when there is profit to share", () => {
    const withProfit = allInSubordinateCost(pref, 36, 1_000_000);
    const kicker = withProfit.components.find((x) => x.label === "Upside participation");
    expect(kicker?.amount).toBeCloseTo(150_000, 0);
  });

  it("omits the kicker when there is no profit", () => {
    const noProfit = allInSubordinateCost(pref, 36, 0);
    expect(noProfit.components.find((x) => x.label === "Upside participation")).toBeUndefined();
  });
});

describe("subordinate tax flags", () => {
  it("never asserts mezzanine interest is deductible", () => {
    const flags = subordinateTaxFlags(mezz);
    expect(flags.every((f) => f.requiresCpaReview)).toBe(true);
    expect(flags.some((f) => f.code === "BUSINESS_INTEREST_LIMITATION_MAY_APPLY")).toBe(true);
    // Deductibility is conditioned, never asserted.
    expect(flags.map((f) => f.message).join(" ")).toMatch(/Neither is automatic/i);
    expect(flags.map((f) => f.message).join(" ")).toMatch(/recharacterized as equity/i);
  });

  it("states preferred distributions are generally not deductible", () => {
    const flags = subordinateTaxFlags(pref);
    expect(flags.some((f) => f.code === "PREFERRED_DISTRIBUTIONS_NOT_DEDUCTIBLE")).toBe(true);
    expect(flags.map((f) => f.message).join(" ")).toMatch(/NOT deductible/);
  });
});

describe("comparing subordinate capital", () => {
  it("reports cost and control separately rather than picking a winner", () => {
    const out = compareSubordinateCapital([mezz, pref], 36, 1_000_000);
    expect(out).toHaveLength(2);
    expect(out.some((o) => o.cheapest)).toBe(true);
    expect(out.some((o) => o.leastControlCeded)).toBe(true);
    // Every row carries both dimensions.
    for (const o of out) {
      expect(o.annualizedCost).toBeGreaterThan(0);
      expect(o.controlAsymmetryScore).toBeGreaterThanOrEqual(0);
      expect(o.note.length).toBeGreaterThan(0);
    }
  });

  it("calls out when the cheapest is not the least control ceded", () => {
    const out = compareSubordinateCapital([mezz, pref], 36, 1_000_000);
    const cheapest = out.find((o) => o.cheapest)!;
    if (!cheapest.leastControlCeded) {
      expect(cheapest.note).toMatch(/not the least control/i);
    }
  });

  it("handles an empty list", () => {
    expect(compareSubordinateCapital([], 36)).toEqual([]);
  });
});
