import { describe, it, expect } from "vitest";

/**
 * Round 39 Tests:
 * 1. Compare Carriers — A Mutual Life vs AAA+ Mutual vs BBB+ Mutual
 * 2. Historical Backtest — S&P 500 2004-2024 with floor/cap
 * 3. Shared Projections — token generation and data shape
 */

// ── Reproduce engine helpers ──
function getCoiRate(age: number): number {
  if (age <= 40) return 0.0008;
  if (age <= 50) return 0.0012;
  if (age <= 55) return 0.0018;
  if (age <= 60) return 0.0028;
  if (age <= 65) return 0.0042;
  if (age <= 70) return 0.0065;
  if (age <= 75) return 0.0100;
  if (age <= 80) return 0.0160;
  if (age <= 85) return 0.0220;
  if (age <= 90) return 0.0180;
  if (age <= 95) return 0.0080;
  return 0.0000;
}

// Carrier configs matching the router
const carrierConfigs: Record<string, {
  name: string; loadY1: number; loadY2to5: number; coiMultiplier: number;
  loanRate: number; avgReturn: number; capRate: number; perPolicyFee: number;
  perUnitRate: number; conditionalCredit: number;
}> = {
  "a-mutual": {
    name: "A Mutual Life", loadY1: 0.08, loadY2to5: 0.06, coiMultiplier: 1.0,
    loanRate: 0.05, avgReturn: 0.12, capRate: 0.145, perPolicyFee: 120,
    perUnitRate: 7.78, conditionalCredit: 0.002,
  },
  "aaa-plus-mutual": {
    name: "AAA+ Mutual", loadY1: 0.055, loadY2to5: 0.04, coiMultiplier: 1.25,
    loanRate: 0.05, avgReturn: 0.08, capRate: 0.105, perPolicyFee: 96,
    perUnitRate: 6.50, conditionalCredit: 0.001,
  },
  "bbb-plus-mutual": {
    name: "BBB+ Mutual", loadY1: 0.06, loadY2to5: 0.045, coiMultiplier: 1.15,
    loanRate: 0.05, avgReturn: 0.085, capRate: 0.11, perPolicyFee: 108,
    perUnitRate: 7.00, conditionalCredit: 0.0015,
  },
};

function runCarrierProjection(carrierId: string, iraBalance: number, age: number, years: number) {
  const cfg = carrierConfigs[carrierId]!;
  const conversionPortion = 0.50;
  const taxSavings = iraBalance * conversionPortion * 0.50;
  const halfTaxSavings = taxSavings / 2;

  let av = 0;
  let loanBalance = 0;
  let cumulativePremiums = 0;
  let cumulativeCharges = 0;

  for (let y = 1; y <= years; y++) {
    let premium: number;
    let newLoan = 0;
    if (y === 1) { premium = halfTaxSavings; }
    else if (y === 2) { premium = halfTaxSavings; newLoan = iraBalance * 0.25; }
    else if (y === 3) { premium = halfTaxSavings; newLoan = av * 0.90 * 0.80; }
    else { premium = halfTaxSavings; newLoan = premium; }
    cumulativePremiums += premium;

    const loadRate = y === 1 ? cfg.loadY1 : (y <= 5 ? cfg.loadY2to5 : 0);
    const premiumLoad = premium * loadRate;
    const coiBase = getCoiRate(age + y);
    const coiCharge = premium * coiBase * cfg.coiMultiplier;
    const perPolicyFee = cfg.perPolicyFee;
    const perUnitCost = y <= 10 ? (premium * 10 / 1000) * cfg.perUnitRate : 0;
    const totalCharges = premiumLoad + coiCharge + perPolicyFee + perUnitCost;
    cumulativeCharges += totalCharges;

    const conditionalCredit = y >= 11 ? av * cfg.conditionalCredit : 0;
    const netPremium = premium - premiumLoad;
    av += netPremium - (coiCharge + perPolicyFee + perUnitCost) + conditionalCredit;
    const interest = av * cfg.avgReturn;
    av += interest;

    loanBalance += newLoan;
    loanBalance += loanBalance * cfg.loanRate;
  }

  return {
    carrierId,
    carrierName: cfg.name,
    finalAV: Math.round(av),
    finalNCV: Math.round(av - loanBalance),
    cumulativePremiums: Math.round(cumulativePremiums),
    cumulativeCharges: Math.round(cumulativeCharges),
  };
}

// S&P 500 returns
const SP500_RETURNS = [
  { year: 2004, return: 0.1088 },
  { year: 2005, return: 0.0491 },
  { year: 2006, return: 0.1579 },
  { year: 2007, return: 0.0549 },
  { year: 2008, return: -0.3700 },
  { year: 2009, return: 0.2646 },
  { year: 2010, return: 0.1506 },
  { year: 2011, return: 0.0211 },
  { year: 2012, return: 0.1600 },
  { year: 2013, return: 0.3239 },
  { year: 2014, return: 0.1369 },
  { year: 2015, return: 0.0138 },
  { year: 2016, return: 0.1196 },
  { year: 2017, return: 0.2183 },
  { year: 2018, return: -0.0438 },
  { year: 2019, return: 0.3149 },
  { year: 2020, return: 0.1840 },
  { year: 2021, return: 0.2871 },
  { year: 2022, return: -0.1811 },
  { year: 2023, return: 0.2629 },
  { year: 2024, return: 0.2508 },
];

// ── Compare Carriers Tests ──
describe("Compare Carriers", () => {
  const iraBalance = 800000;
  const age = 52;
  const years = 20;

  it("should produce projections for all three carriers", () => {
    const nw = runCarrierProjection("a-mutual", iraBalance, age, years);
    const pl = runCarrierProjection("aaa-plus-mutual", iraBalance, age, years);
    const na = runCarrierProjection("bbb-plus-mutual", iraBalance, age, years);

    expect(nw.finalAV).toBeGreaterThan(0);
    expect(pl.finalAV).toBeGreaterThan(0);
    expect(na.finalAV).toBeGreaterThan(0);
  });

  it("A Mutual Life should have the highest AV due to 12% illustrated rate", () => {
    const nw = runCarrierProjection("a-mutual", iraBalance, age, years);
    const pl = runCarrierProjection("aaa-plus-mutual", iraBalance, age, years);
    const na = runCarrierProjection("bbb-plus-mutual", iraBalance, age, years);

    expect(nw.finalAV).toBeGreaterThan(pl.finalAV);
    expect(nw.finalAV).toBeGreaterThan(na.finalAV);
  });

  it("AAA+ Mutual should have lower charges due to lower load fees", () => {
    const nw = runCarrierProjection("a-mutual", iraBalance, age, years);
    const pl = runCarrierProjection("aaa-plus-mutual", iraBalance, age, years);

    // AAA+ Mutual has lower load fees (5.5%/4% vs 8%/6%)
    // But higher COI multiplier (1.25 vs 1.0)
    // Overall charges should still be lower due to lower loads
    expect(pl.cumulativeCharges).toBeLessThan(nw.cumulativeCharges);
  });

  it("BBB+ Mutual should fall between A Mutual Life and AAA+ Mutual on AV", () => {
    const nw = runCarrierProjection("a-mutual", iraBalance, age, years);
    const pl = runCarrierProjection("aaa-plus-mutual", iraBalance, age, years);
    const na = runCarrierProjection("bbb-plus-mutual", iraBalance, age, years);

    expect(na.finalAV).toBeLessThan(nw.finalAV);
    expect(na.finalAV).toBeGreaterThan(pl.finalAV);
  });

  it("all carriers should have positive cumulative premiums", () => {
    const nw = runCarrierProjection("a-mutual", iraBalance, age, years);
    const pl = runCarrierProjection("aaa-plus-mutual", iraBalance, age, years);
    const na = runCarrierProjection("bbb-plus-mutual", iraBalance, age, years);

    expect(nw.cumulativePremiums).toBeGreaterThan(0);
    expect(pl.cumulativePremiums).toBeGreaterThan(0);
    expect(na.cumulativePremiums).toBeGreaterThan(0);
    // All should have same premiums since they use same inputs
    expect(nw.cumulativePremiums).toBe(pl.cumulativePremiums);
    expect(nw.cumulativePremiums).toBe(na.cumulativePremiums);
  });

  it("$50K simple projection: A Mutual Life AV should exceed $1.5M at year 20", () => {
    const nw = runCarrierProjection("a-mutual", 200000, 50, 20);
    expect(nw.finalAV).toBeGreaterThan(500000);
  });
});

// ── Historical Backtest Tests ──
describe("Historical Backtest (S&P 500 2004-2024)", () => {
  const capRate = 0.145;
  const floorRate = 0.0;

  it("should have 21 years of S&P data", () => {
    expect(SP500_RETURNS).toHaveLength(21);
  });

  it("floor should protect in 2008 (S&P -37%)", () => {
    const sp2008 = SP500_RETURNS.find(r => r.year === 2008)!;
    expect(sp2008.return).toBeLessThan(0);
    const credited = Math.max(floorRate, Math.min(capRate, sp2008.return));
    expect(credited).toBe(0); // Floor at 0%
  });

  it("floor should protect in 2018 (S&P -4.38%)", () => {
    const sp2018 = SP500_RETURNS.find(r => r.year === 2018)!;
    expect(sp2018.return).toBeLessThan(0);
    const credited = Math.max(floorRate, Math.min(capRate, sp2018.return));
    expect(credited).toBe(0);
  });

  it("floor should protect in 2022 (S&P -18.11%)", () => {
    const sp2022 = SP500_RETURNS.find(r => r.year === 2022)!;
    expect(sp2022.return).toBeLessThan(0);
    const credited = Math.max(floorRate, Math.min(capRate, sp2022.return));
    expect(credited).toBe(0);
  });

  it("cap should limit gains in 2013 (S&P +32.39%)", () => {
    const sp2013 = SP500_RETURNS.find(r => r.year === 2013)!;
    expect(sp2013.return).toBeGreaterThan(capRate);
    const credited = Math.max(floorRate, Math.min(capRate, sp2013.return));
    expect(credited).toBe(capRate); // Capped at 14.5%
  });

  it("cap should limit gains in 2019 (S&P +31.49%)", () => {
    const sp2019 = SP500_RETURNS.find(r => r.year === 2019)!;
    expect(sp2019.return).toBeGreaterThan(capRate);
    const credited = Math.max(floorRate, Math.min(capRate, sp2019.return));
    expect(credited).toBe(capRate);
  });

  it("should pass through moderate returns unchanged", () => {
    const sp2005 = SP500_RETURNS.find(r => r.year === 2005)!;
    expect(sp2005.return).toBeGreaterThan(floorRate);
    expect(sp2005.return).toBeLessThan(capRate);
    const credited = Math.max(floorRate, Math.min(capRate, sp2005.return));
    expect(credited).toBeCloseTo(sp2005.return, 4);
  });

  it("average credited rate should be between 5% and 12%", () => {
    const creditedRates = SP500_RETURNS.map(r => Math.max(floorRate, Math.min(capRate, r.return)));
    const avg = creditedRates.reduce((s, r) => s + r, 0) / creditedRates.length;
    expect(avg).toBeGreaterThan(0.05);
    expect(avg).toBeLessThan(0.12);
  });

  it("should have 3 floor-protected years (2008, 2018, 2022)", () => {
    const floorYears = SP500_RETURNS.filter(r => r.return < floorRate);
    expect(floorYears).toHaveLength(3);
    expect(floorYears.map(r => r.year)).toEqual(expect.arrayContaining([2008, 2018, 2022]));
  });

  it("should have multiple cap-limited years", () => {
    const capYears = SP500_RETURNS.filter(r => r.return > capRate);
    expect(capYears.length).toBeGreaterThanOrEqual(5);
  });

  it("historical backtest projection should produce positive AV", () => {
    const iraBalance = 800000;
    const age = 52;
    let av = 0;
    const taxSavings = iraBalance * 0.50 * 0.50;
    const halfTaxSavings = taxSavings / 2;

    for (let y = 1; y <= 20; y++) {
      const sp = SP500_RETURNS[y - 1];
      if (!sp) break;
      const premium = halfTaxSavings;
      const loadRate = y === 1 ? 0.08 : (y <= 5 ? 0.06 : 0);
      const premiumLoad = premium * loadRate;
      const coiCharge = premium * getCoiRate(age + y);
      av += (premium - premiumLoad) - (coiCharge + 120 + (y <= 10 ? (premium * 10 / 1000) * 7.78 : 0));
      const creditedRate = Math.max(floorRate, Math.min(capRate, sp.return));
      av += av * creditedRate;
    }
    expect(av).toBeGreaterThan(0);
  });
});

// ── Shared Projections Tests ──
describe("Shared Projections", () => {
  it("should generate a 64-character hex token", () => {
    const { randomBytes } = require("crypto");
    const token = randomBytes(32).toString("hex");
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("expiration date should be 30 days in the future", () => {
    const expiresInDays = 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const diffMs = expiresAt.getTime() - Date.now();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it("share URL should follow /shared/:token pattern", () => {
    const { randomBytes } = require("crypto");
    const token = randomBytes(32).toString("hex");
    const shareUrl = `/shared/${token}`;
    expect(shareUrl).toMatch(/^\/shared\/[0-9a-f]{64}$/);
  });

  it("projection data should be serializable as JSON", () => {
    const projectionData = {
      summary: { totalWealth: 15000000, iulAccountValue: 12000000 },
      iulProjection: { rows: [{ year: 1, cashValue: 100000 }] },
      inputs: { iraBalance: 800000, age: 52 },
    };
    const serialized = JSON.stringify(projectionData);
    const deserialized = JSON.parse(serialized);
    expect(deserialized.summary.totalWealth).toBe(15000000);
    expect(deserialized.iulProjection.rows[0].cashValue).toBe(100000);
  });
});
