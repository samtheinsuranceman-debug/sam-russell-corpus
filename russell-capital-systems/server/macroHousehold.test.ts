/**
 * Household layer — the fifty signals, the twenty-five household factors, the
 * college-cost and relative-wealth engines, the generated document. Offline.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HOUSEHOLD_SIGNALS,
  HOUSEHOLD_FACTORS,
  HOUSEHOLD_IDEAS,
  MACRO_FACTORS,
  ALL_FACTORS,
  FACTOR_BY_ID,
  SOURCE_BY_ID,
  MACRO_ASSUMPTIONS,
  A,
  assumption,
  householdCatalogueCheck,
  collegeCostProjection,
  relativeWealth,
  ageBracket,
} from "@shared/macro";
import { historyManifest, seriesSpec } from "./macroHistory";
import { renderHouseholdMarkdown, renderFactorsMarkdown } from "./macroFactorsDoc";
import { checkUrl } from "./macroConnectors";

const TODAY = "2026-09-22";

describe("the fifty household signals", () => {
  it("are fifty, unique, sourced, dated, and each says what it signals and why", () => {
    expect(HOUSEHOLD_SIGNALS).toHaveLength(50);
    expect(new Set(HOUSEHOLD_SIGNALS.map(s => s.id)).size).toBe(50);
    for (const s of HOUSEHOLD_SIGNALS) {
      expect(SOURCE_BY_ID.has(s.sourceId), `${s.id} → ${s.sourceId}`).toBe(true);
      expect(s.publishedFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.signals.length).toBeGreaterThan(8);
      expect(s.reasoning.length).toBeGreaterThan(20);
      expect(s.series || s.url, s.id).toBeTruthy();
      if (s.series) expect(seriesSpec(s.series), `${s.id} series ${s.series}`).not.toBeNull();
      if (s.url) expect(checkUrl(s.url).ok, `${s.id} url ${s.url}`).toBe(true);
    }
  });

  it("covers the owner's asks by name: car sales, house purchases daily, mortgage cost, car cost, tuition + books + living, loan rates, fast food, low-end grocers, saving rate, net worth by age and profession", () => {
    const names = HOUSEHOLD_SIGNALS.map(s => `${s.name} ${s.signals} ${s.reasoning}`.toLowerCase()).join(" | ");
    for (const ask of ["car sales", "house purchases", "daily", "cost of the average mortgage", "cost of a car", "tuition", "books", "loan rates", "fast-food", "dollar stores", "saving and not spending", "net worth by age", "profession"]) {
      expect(names, ask).toContain(ask);
    }
  });

  it("every factor-linked signal names a real household factor and every household factor is on the list", () => {
    expect(householdCatalogueCheck()).toEqual({ missingFactors: [], unknownFactorIds: [] });
    expect(HOUSEHOLD_SIGNALS.filter(s => s.factorId).length).toBe(HOUSEHOLD_FACTORS.length);
  });

  it("forty years: at least thirty of the fifty publish from 1990 or earlier, and at least thirty are keyless", () => {
    expect(HOUSEHOLD_SIGNALS.filter(s => s.publishedFrom <= "1990-12-31").length).toBeGreaterThanOrEqual(30);
    expect(HOUSEHOLD_SIGNALS.filter(s => s.access !== "page").length).toBeGreaterThanOrEqual(30);
  });

  it("the twenty-five ideas each carry reasoning, sources and an effort", () => {
    expect(HOUSEHOLD_IDEAS).toHaveLength(25);
    expect(HOUSEHOLD_IDEAS.map(i => i.n)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    for (const i of HOUSEHOLD_IDEAS) {
      expect(i.reasoning.length).toBeGreaterThan(30);
      expect(i.sources.length).toBeGreaterThan(0);
      for (const s of i.sources) expect(s === "platform" || SOURCE_BY_ID.has(s), `${i.n} → ${s}`).toBe(true);
    }
  });
});

describe("the twenty-five household factors", () => {
  it("are on the same contract as the macro factors: keyless series, rules-table rows, registered targets", () => {
    expect(HOUSEHOLD_FACTORS).toHaveLength(25);
    expect(MACRO_FACTORS).toHaveLength(25);
    expect(ALL_FACTORS).toHaveLength(50);
    expect(new Set(ALL_FACTORS.map(f => f.id)).size).toBe(50);
    const targets = new Set([...ALL_FACTORS.map(f => f.id), "f-recession", "f-unrate", "ust10y", "tic:japan", "tic:china"]);
    for (const f of HOUSEHOLD_FACTORS) {
      expect(f.factor).toBeDefined();
      expect(seriesSpec(f.factor!.series)!.url).toMatch(/^https:\/\/fred\.stlouisfed\.org\/graph\/fredgraph\.csv\?id=/);
      expect(targets.has(f.factor!.target), `${f.id} → ${f.factor!.target}`).toBe(true);
      for (const k of ["neutral", "span", "min", "max"]) expect(MACRO_ASSUMPTIONS.has(`factor.${f.id}.${k}`), `factor.${f.id}.${k}`).toBe(true);
      expect(f.factor!.neutral).toBe(A(`factor.${f.id}.neutral`));
      expect(FACTOR_BY_ID.get(f.id)).toBe(f);
    }
    // Measured: 21 of 25 publish from 1990 or earlier (the four retail-sales series begin in 1992).
    expect(HOUSEHOLD_FACTORS.filter(f => f.factor!.publishedFrom <= "1990-12-31").length).toBeGreaterThanOrEqual(21);
  });

  it("the history manifest now carries both panels' series once each", () => {
    const keys = historyManifest().map(r => r.series);
    expect(new Set(keys).size).toBe(keys.length);
    for (const f of ALL_FACTORS) expect(keys).toContain(f.factor!.series);
    expect(keys).toContain("fred:RSFSDPN");
    expect(keys.length).toBeGreaterThanOrEqual(55);
  });
});

describe("college cost projection", () => {
  it("grows the package to the start year, prices the loan, and reports both opportunity costs", () => {
    const r = collegeCostProjection({ childAge: 8, school: "public-in-state", borrowShare: 0.5 }, TODAY);
    expect(r.yearsUntilStart).toBe(10);
    expect(r.years).toHaveLength(4);
    expect(r.todayPackage).toBeCloseTo((A("college.publicInState.tuitionFees") + A("college.publicInState.roomBoard") + A("college.booksSupplies") + A("college.otherExpenses")) * 4, 0);
    expect(r.years[0].tuitionFees).toBeCloseTo(A("college.publicInState.tuitionFees") * Math.pow(1 + A("college.growth.tuition") / 100, 10), 0);
    expect(r.years[3].total).toBeGreaterThan(r.years[0].total);
    expect(r.projectedPackage).toBeGreaterThan(r.todayPackage);
    expect(r.loan.principal).toBeCloseTo(r.projectedPackage / 2, 0);
    expect(r.loan.monthlyPayment).toBeGreaterThan(0);
    expect(r.loan.totalInterest).toBeGreaterThan(0);
    expect(r.loan.totalRepaid).toBeCloseTo(r.loan.monthlyPayment * 120, -1);
    expect(r.opportunityCostOfPayments).toBeGreaterThan(0);
    expect(r.opportunityCostOfPackage).toBeCloseTo(r.projectedPackage * (Math.pow(1.06, 10) - 1), 0);
    expect(r.totalEconomicCost).toBeCloseTo(r.projectedPackage + r.loan.totalInterest + r.loan.originationFee + r.opportunityCostOfPayments, 0);
    // W10 (2026-09-22): every college baseline was re-entered from Trends in College Pricing and Student Aid 2025
    // (Table CP-1, Figure CP-1) and the Federal Student Aid rates page, so the flag is off and the ledger says so.
    expect(r.unverified).toHaveLength(0);
    expect(r.assumptions.some(a => /VERIFY/.test(a))).toBe(false);
    expect(r.assumptions).toContain("All baseline rows verified");
  });

  it("no loan means no interest and no payment opportunity cost; private costs more than public; Parent PLUS costs more than Direct", () => {
    const none = collegeCostProjection({ childAge: 17, school: "public-in-state", borrowShare: 0 }, TODAY);
    expect(none.loan.principal).toBe(0);
    expect(none.loan.totalInterest).toBe(0);
    expect(none.opportunityCostOfPayments).toBe(0);
    const priv = collegeCostProjection({ childAge: 17, school: "private-nonprofit" }, TODAY);
    expect(priv.projectedPackage).toBeGreaterThan(none.projectedPackage);
    const plus = collegeCostProjection({ childAge: 17, school: "public-in-state", parentPlus: true }, TODAY);
    expect(plus.loan.ratePct).toBeGreaterThan(collegeCostProjection({ childAge: 17, school: "public-in-state" }, TODAY).loan.ratePct);
    const zeroRate = collegeCostProjection({ childAge: 17, school: "public-in-state", loanRatePct: 0, opportunityRatePct: 0 }, TODAY);
    expect(zeroRate.loan.totalInterest).toBe(0);
    expect(zeroRate.opportunityCostOfPayments).toBe(0);
  });

  it("the 529 planner's 5.8 % default and the rules-table growth rate describe the same forty-year record", () => {
    expect(Math.abs(A("college.growth.tuition") - 5.8)).toBeLessThan(0.5);
    expect(assumption("college.growth.tuition").source).toBe("fred");
  });
});

describe("relative wealth", () => {
  it("brackets ages and places the SCF median at the 50th percentile of its own bracket", () => {
    expect(ageBracket(29)).toBe("u35");
    expect(ageBracket(35)).toBe("35-44");
    expect(ageBracket(64)).toBe("55-64");
    expect(ageBracket(80)).toBe("75plus");
    const r = relativeWealth({ age: 48, netWorth: A("scf.netWorth.median.45-54") }, TODAY);
    expect(r.bracket).toBe("45-54");
    expect(r.vsAge.percentile).toBeCloseTo(0.5, 2);
    expect(r.vsAge.ratioToMedian).toBe(1);
    expect(r.vsAge.deciles).toHaveLength(9);
    expect(r.vsAge.deciles[4]).toBeCloseTo(A("scf.netWorth.median.45-54"), -2);
    expect(r.nextDecile!.percentile).toBe(0.6);
    // W10 (2026-09-22): the SCF rows were re-entered from the Fed's October 2023 bulletin (Tables 1 and 2) and the
    // Census row from Income in the United States: 2025 (P60-289), so nothing in the reference table is flagged.
    expect(r.unverified).toHaveLength(0);
    expect(r.method.some(m => /log-normal/.test(m))).toBe(true);
  });

  it("higher net worth ranks higher, zero or negative lands in the bottom decile, and the peer comparison scales with experience", () => {
    const low = relativeWealth({ age: 40, netWorth: 20_000 }, TODAY);
    const high = relativeWealth({ age: 40, netWorth: 2_000_000 }, TODAY);
    expect(high.vsAge.percentile).toBeGreaterThan(low.vsAge.percentile);
    expect(high.vsAge.percentile).toBeGreaterThan(0.85);
    expect(relativeWealth({ age: 40, netWorth: -5_000 }, TODAY).vsAge.percentile).toBeLessThan(0.1);
    const doc = relativeWealth({ age: 42, netWorth: 350_000, profession: "Physician", yearsInProfession: 12, peerMedianIncome: 240_000 }, TODAY);
    expect(doc.vsPeer).not.toBeNull();
    expect(doc.vsPeer!.experienceScale).toBeCloseTo(0.6, 2);
    expect(doc.vsPeer!.expectedPeerNetWorth).toBeCloseTo(240_000 * (A("scf.netWorth.median.35-44") / A("scf.income.median.35-44")) * 0.6, -2);
    expect(doc.vsPeer!.readout).toMatch(/Physician/);
    const senior = relativeWealth({ age: 42, netWorth: 350_000, yearsInProfession: 40, peerMedianIncome: 240_000 }, TODAY);
    expect(senior.vsPeer!.experienceScale).toBe(1.5);
    expect(relativeWealth({ age: 42, netWorth: 350_000 }, TODAY).vsPeer).toBeNull();
  });
});

describe("docs/macro/HOUSEHOLD_SIGNALS.md is generated from the catalogue", () => {
  it("matches the renderer's pending-state output and FACTORS.md is unchanged by the household panel", () => {
    const rendered = renderHouseholdMarkdown({}, TODAY);
    const committed = readFileSync(join(__dirname, "..", "docs", "macro", "HOUSEHOLD_SIGNALS.md"), "utf8");
    expect(committed).toBe(rendered);
    expect(rendered.match(/^\| \d+ \| /gm)!.length).toBe(50 + 25);
    expect(rendered).toMatch(/25 further ideas/);
    const factorsDoc = renderFactorsMarkdown({}, TODAY);
    expect(factorsDoc).toMatch(/25 factors/);
    expect(factorsDoc).not.toMatch(/h-vehicle-sales/);
  });
});
