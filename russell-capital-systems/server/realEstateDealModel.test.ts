import { describe, it, expect } from "vitest";
import {
  analyzeCapitalStack,
  amortizeLayer,
  debtConstant,
  goingInCapRate,
  irr,
  npv,
  pmt,
  runWaterfall,
  STANDARD_WATERFALL,
} from "../shared/realEstateDealModel";
import type {
  CapitalStackInput,
  DebtLayer,
} from "../shared/realEstateCapitalTypes";

/* ── Reference deal: $10M multifamily, 65% LTC senior, 8% pref / 20% promote ── */
const seniorLoan: DebtLayer = {
  id: "senior",
  kind: "senior_debt",
  principal: 6_500_000,
  rate: 0.065,
  rateType: "fixed",
  amortization: "io_then_amortizing",
  amortYears: 30,
  ioYears: 2,
  termYears: 10,
  originationFeePct: 0.01,
  dscrCovenant: 1.25,
  prepaymentPenaltyPct: 0.01,
};

const baseDeal: CapitalStackInput = {
  property: {
    purchasePrice: 10_000_000,
    closingCostsPct: 0.02,
    capexBudget: 500_000,
    year1NOI: 700_000,
    noiGrowthRate: 0.03,
    capexReservePctOfNOI: 0.05,
    exitCapRate: 0.055,
    saleCostPct: 0.02,
    holdYears: 5,
  },
  debt: [seniorLoan],
  // Equity must fund the origination fee too, or the stack is short by exactly
  // that amount: 10.0M price + 0.2M closing + 0.5M capex + 65k fee = 10.765M,
  // less 6.5M of senior debt.
  commonEquity: { lpContribution: 3_838_500, gpContribution: 426_500 },
  waterfall: STANDARD_WATERFALL,
};

describe("financial primitives", () => {
  it("pmt matches the standard mortgage payment", () => {
    // $100k, 6% nominal, 30 years monthly → $599.55
    expect(pmt(0.06 / 12, 360, 100_000)).toBeCloseTo(599.55, 2);
    // Zero-rate loan is straight-line
    expect(pmt(0, 120, 120_000)).toBeCloseTo(1000, 6);
  });

  it("npv discounts correctly", () => {
    expect(npv(0.1, [-100, 110])).toBeCloseTo(0, 9);
    expect(npv(0, [-100, 50, 50])).toBeCloseTo(0, 9);
  });

  it("irr solves known vectors", () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 8);
    expect(irr([-1000, 500, 500, 500])).toBeCloseTo(0.2337, 3);
    // Doubling over 5 years ≈ 14.87%
    expect(irr([-1000, 0, 0, 0, 0, 2000])).toBeCloseTo(0.1487, 3);
  });

  it("irr reports total loss and undefined cases honestly", () => {
    expect(irr([-1000, 0, 0])).toBe(-1);
    expect(irr([100, 100])).toBeNaN(); // no capital at risk
  });
});

describe("amortization", () => {
  it("fully amortizes a 30-year loan to zero", () => {
    const layer: DebtLayer = {
      ...seniorLoan,
      amortization: "amortizing",
      ioYears: 0,
      termYears: 30,
      principal: 1_000_000,
      rate: 0.06,
    };
    const rows = amortizeLayer(layer, 30);
    expect(rows).toHaveLength(30);
    expect(rows[29].endingBalance).toBeLessThan(1);
    // Principal repaid must equal the loan.
    const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);
    expect(totalPrincipal).toBeCloseTo(1_000_000, -1);
  });

  it("pays no principal during the interest-only runway", () => {
    const rows = amortizeLayer(seniorLoan, 5);
    expect(rows[0].principal).toBe(0);
    expect(rows[1].principal).toBe(0);
    expect(rows[1].endingBalance).toBeCloseTo(seniorLoan.principal, 2);
    // Amortization begins in year 3.
    expect(rows[2].principal).toBeGreaterThan(0);
  });

  it("charges interest monthly, not annually", () => {
    const io: DebtLayer = { ...seniorLoan, amortization: "interest_only" };
    const rows = amortizeLayer(io, 1);
    // Monthly compounding on a 6.5% coupon yields slightly more than 6.5% flat
    // only if balance grows; on level IO it is exactly principal × rate.
    expect(rows[0].interest).toBeCloseTo(6_500_000 * 0.065, 0);
    expect(rows[0].principal).toBe(0);
  });

  it("flags years past stated maturity", () => {
    const short: DebtLayer = { ...seniorLoan, termYears: 3 };
    const rows = amortizeLayer(short, 5);
    expect(rows[2].matured).toBe(false); // year 3 is still within term
    expect(rows[3].matured).toBe(true);
  });
});

describe("waterfall", () => {
  it("routes everything to capital until the pref is cleared", () => {
    const { capitalSide, promote } = runWaterfall(1000, [0, 1080], STANDARD_WATERFALL);
    expect(capitalSide[1]).toBeCloseTo(1080, 6);
    expect(promote[1]).toBeCloseTo(0, 6);
  });

  it("walks all three tiers of the standard waterfall", () => {
    const { capitalSide, promote, tierDetail } = runWaterfall(
      1000,
      [0, 1180],
      STANDARD_WATERFALL,
    );
    // Tier 1 (8% pref): needs 1080, takes 1080, no promote.
    expect(tierDetail[0].lpAllocated).toBeCloseTo(1080, 6);
    expect(tierDetail[0].gpAllocated).toBeCloseTo(0, 6);
    // Tier 2 (to 15%): capital still needs 70, which at an 80/20 split
    // consumes 87.50 of cash and pays the GP 17.50.
    expect(tierDetail[1].lpAllocated).toBeCloseTo(70, 6);
    expect(tierDetail[1].gpAllocated).toBeCloseTo(17.5, 6);
    // Tier 3 (residual): the last 12.50 splits 70/30.
    expect(tierDetail[2].lpAllocated).toBeCloseTo(8.75, 6);
    expect(tierDetail[2].gpAllocated).toBeCloseTo(3.75, 6);

    expect(capitalSide[1]).toBeCloseTo(1158.75, 6);
    expect(promote[1]).toBeCloseTo(21.25, 6);
    expect(capitalSide[1] + promote[1]).toBeCloseTo(1180, 6);
  });

  it("detects an underfunded stack", () => {
    const short = analyzeCapitalStack({
      ...baseDeal,
      // Strip the origination fee back out of equity.
      commonEquity: { lpContribution: 3_780_000, gpContribution: 420_000 },
    });
    expect(short.sourcesAndUses.balanced).toBe(false);
    expect(short.sourcesAndUses.surplus).toBeCloseTo(-65_000, 0);
  });

  it("delivers exactly the hurdle IRR to the capital pool at each tier", () => {
    // Enough cash to clear the 8% pref precisely over 3 years.
    const { capitalSide } = runWaterfall(1000, [0, 80, 80, 1080], STANDARD_WATERFALL);
    const flows = [-1000, capitalSide[1], capitalSide[2], capitalSide[3]];
    expect(irr(flows)).toBeCloseTo(0.08, 6);
  });

  it("never distributes more than it was given", () => {
    const dist = [0, 500, 900, 4000];
    const { capitalSide, promote } = runWaterfall(1000, dist, STANDARD_WATERFALL);
    for (let i = 1; i < dist.length; i++) {
      expect(capitalSide[i] + promote[i]).toBeLessThanOrEqual(dist[i] + 1e-6);
    }
  });

  it("engages the 70/30 residual tier only above the 15% hurdle", () => {
    const { tierDetail } = runWaterfall(1000, [0, 3000], STANDARD_WATERFALL);
    const [pref, promoteTier, residual] = tierDetail;
    expect(pref.gpAllocated).toBe(0);
    expect(promoteTier.gpAllocated).toBeGreaterThan(0);
    expect(residual.gpAllocated).toBeGreaterThan(0);
    // Capital's IRR through the first two tiers is exactly 15%.
    const throughHurdle = pref.lpAllocated + promoteTier.lpAllocated;
    expect(irr([-1000, throughHurdle])).toBeCloseTo(0.15, 6);
  });
});

describe("analyzeCapitalStack", () => {
  const result = analyzeCapitalStack(baseDeal);

  it("balances sources and uses", () => {
    expect(result.sourcesAndUses.balanced).toBe(true);
    expect(result.sourcesAndUses.totalSources).toBeCloseTo(
      result.sourcesAndUses.totalUses,
      0,
    );
  });

  it("produces one row per hold year", () => {
    expect(result.schedule).toHaveLength(5);
    expect(result.schedule[0].year).toBe(1);
    expect(result.schedule[4].year).toBe(5);
  });

  it("grows NOI at the stated rate", () => {
    expect(result.schedule[0].noi).toBeCloseTo(700_000, 0);
    expect(result.schedule[1].noi).toBeCloseTo(700_000 * 1.03, 0);
    expect(result.schedule[4].noi).toBeCloseTo(700_000 * Math.pow(1.03, 4), 0);
  });

  it("computes DSCR net of the capital reserve", () => {
    const y1 = result.schedule[0];
    const expected = (y1.noi - y1.capexReserve) / y1.debtService;
    expect(y1.dscr).toBeCloseTo(expected, 3);
    // Gross-NOI DSCR would be higher — confirm we are the conservative one.
    expect(y1.dscr).toBeLessThan(y1.noi / y1.debtService);
  });

  it("capitalizes forward NOI at exit", () => {
    const forwardNOI = 700_000 * Math.pow(1.03, 5);
    expect(result.exit.grossSalePrice).toBeCloseTo(forwardNOI / 0.055, 0);
  });

  it("reconciles exit proceeds", () => {
    const e = result.exit;
    const reconciled =
      e.grossSalePrice - e.saleCosts - e.debtPayoff - e.prepaymentPenalties - e.preferredRedemption;
    expect(e.netProceedsToCommon).toBeCloseTo(reconciled, 0);
  });

  it("returns a plausible levered IRR above the unlevered IRR", () => {
    // Positive leverage: the deal's cap rate exceeds its debt constant.
    expect(result.returns.leveredIrr).toBeGreaterThan(result.returns.unleveredIrr);
    expect(result.returns.leveredIrr).toBeGreaterThan(0);
    expect(result.returns.leveredIrr).toBeLessThan(1);
  });

  it("splits the waterfall without creating or destroying cash", () => {
    const totalDistributed = result.commonEquityCashFlows
      .slice(1)
      .reduce((s, c) => s + c, 0);
    const split = result.waterfall.lpDistributions + result.waterfall.gpDistributions;
    expect(split).toBeCloseTo(totalDistributed, 0);
  });

  it("gives the GP a promote above its pro-rata capital share", () => {
    // GP funded 10% of common equity but should earn more than 10% of profit.
    expect(result.waterfall.gpProfitShare).toBeGreaterThan(0.1);
    expect(result.waterfall.gpIrr).toBeGreaterThan(result.waterfall.lpIrr);
  });

  it("does not require a refinance when the term outlasts the hold", () => {
    expect(result.refinanceRequired).toBe(false);
    expect(result.refinanceYear).toBeNull();
  });

  it("flags a refinance when the loan matures inside the hold", () => {
    const short = analyzeCapitalStack({
      ...baseDeal,
      debt: [{ ...seniorLoan, termYears: 3 }],
    });
    expect(short.refinanceRequired).toBe(true);
    expect(short.refinanceYear).toBe(3);
  });
});

describe("preferred equity", () => {
  it("is redeemed ahead of common at exit", () => {
    const withPref = analyzeCapitalStack({
      ...baseDeal,
      debt: [{ ...seniorLoan, principal: 5_000_000 }],
      preferredEquity: {
        id: "pref",
        kind: "preferred_equity",
        contribution: 1_500_000,
        rate: 0.12,
        compounding: true,
        currentPayRate: 0.06,
      },
      // 10.0M + 0.2M + 0.5M + 50k fee = 10.75M, less 5.0M debt and 1.5M pref.
      commonEquity: { lpContribution: 3_825_000, gpContribution: 425_000 },
    });
    expect(withPref.exit.preferredRedemption).toBeGreaterThan(1_500_000);
    // Current pay reduces what reaches common.
    expect(withPref.schedule[0].preferredCurrentPay).toBeGreaterThan(0);
    expect(withPref.schedule[0].distributableToCommon).toBeLessThan(
      withPref.schedule[0].cashFlowAfterDebtService,
    );
  });
});

describe("leverage diagnostics", () => {
  it("computes the debt constant above the coupon for amortizing debt", () => {
    const amortizing: DebtLayer = { ...seniorLoan, amortization: "amortizing", ioYears: 0 };
    expect(debtConstant([amortizing])).toBeGreaterThan(amortizing.rate);
  });

  it("equates the debt constant to the coupon for interest-only debt", () => {
    const io: DebtLayer = { ...seniorLoan, amortization: "interest_only" };
    expect(debtConstant([io])).toBeCloseTo(io.rate, 6);
  });

  it("computes the going-in cap rate on total capitalization", () => {
    expect(goingInCapRate(baseDeal)).toBeCloseTo(700_000 / (10_200_000 + 500_000), 6);
  });
});
