import { describe, expect, it } from "vitest";
import { annualAverageOf, buildEnterprise, capacityFromFactFinder, normaliseCounty, parseNriCounties, type PlanRequest, type RateContext } from "./rentalEnterprise";
import { ALL_INDEX_OPTIONS } from "@shared/indexCreditingData";

const NRI_CSV = [
  "OID_,NRI_ID,STATE,STATEABBRV,STATEFIPS,COUNTY,COUNTYTYPE,COUNTYFIPS,STCOFIPS,POPULATION,BUILDVALUE,RISK_VALUE,RISK_SCORE,RISK_RATNG,EAL_VALT,EAL_VALB,HAIL_RISKR,WFIR_RISKR,RFLD_RISKR,CFLD_RISKR,HRCN_RISKR,TRND_RISKR",
  "1,C37129,North Carolina,NC,37,New Hanover,County,129,37129,225702,60000000000,1234.5,98.1,Very High,50000000,31234567.89,Relatively Low,Relatively Moderate,Relatively High,Very High,Very High,Relatively Moderate",
  "2,C08013,Colorado,CO,8,Boulder,County,13,08013,330758,90000000000,800.2,90.5,Relatively High,40000000,22000000,Relatively High,Very High,Relatively Moderate,Not Applicable,Not Applicable,Relatively Low",
  "3,C99999,Nowhere,,99,,County,999,99999,0,0,0,0,,0,0,,,,,,",
].join("\r\n");

describe("FEMA's county file", () => {
  it("reads the county, the overall rating, the building loss and each hazard's rating by header name; Not Applicable becomes null", () => {
    const rows = parseNriCounties(NRI_CSV);
    expect(rows).toHaveLength(2);
    const nh = rows[0]!;
    expect(nh).toMatchObject({ fips: "37129", stateAbbr: "NC", county: "New Hanover", rating: "Very High", ealBuilding: 31234568 });
    expect(nh.hazards.coastalFlood).toBe("Very High");
    expect(nh.hazards.hurricane).toBe("Very High");
    expect(nh.hazards.hail).toBe("Relatively Low");
    expect(nh.hazards.earthquake).toBeNull(); // column absent from this fixture
    const bo = rows[1]!;
    expect(bo.fips).toBe("08013");
    expect(bo.hazards.coastalFlood).toBeNull();
    expect(bo.hazards.wildfire).toBe("Very High");
  });
  it("refuses a file without the county columns", () => {
    expect(() => parseNriCounties("A,B\n1,2")).toThrow(/STATEABBRV/);
  });
  it("matches Zillow's 'New Hanover County' to FEMA's 'New Hanover'", () => {
    expect(normaliseCounty("New Hanover County")).toBe(normaliseCounty("New Hanover"));
    expect(normaliseCounty("Orleans Parish")).toBe(normaliseCounty("Orleans"));
    expect(normaliseCounty("Juneau City and Borough")).toBe(normaliseCounty("Juneau"));
    expect(normaliseCounty("St. Louis County")).toBe("stlouis");
  });
});

describe("the rates of the day", () => {
  it("folds monthly FEDFUNDS readings to one average per year", () => {
    const s = annualAverageOf([{ date: "2024-01-01", value: 5.33 }, { date: "2024-07-01", value: 5.33 }, { date: "2025-01-01", value: 4.33 }, { date: "2025-06-01", value: 4.33 }, { date: "2025-12-01", value: 3.64 }]);
    expect(s).toEqual({ startYear: 2024, values: [5.33, 4.1] });
    expect(annualAverageOf([])).toBeNull();
  });
});

const rates: RateContext = { mortgage: { ratePct: 6.5, year: 2025, asOf: "2025-12-26", source: "fred" }, fedFunds: null, cpi: { annualRatePct: 2.9, asOf: "2025-12-01", source: "fred" } };

describe("capacity from the Fact Finder", () => {
  it("adds the income lines and cash, takes the mortgage and student-loan payments as debts, the credit score, and Fannie Mae's DTI cap", () => {
    const ff = { sections: { income: { w2Income: "250,000", bonusIncome: 50000 }, cash: { checking: 40000, savings: "120,000", moneyMarketCds: 40000 }, debts: { studentLoanPayment: 900, creditScore: "780" }, realEstate: { primaryMonthlyPayment: 2600 } } };
    const { capacity, readFrom } = capacityFromFactFinder(ff, rates);
    expect(capacity).toMatchObject({ annualIncome: 300000, cashAvailable: 200000, monthlyDebts: 3500, creditScore: 780, maxDti: 0.45, ratePct: 6.5, termYears: 30, minDownPct: 20 });
    expect(readFrom).toEqual(["income lines", "cash on hand", "mortgage and student-loan payments", "credit score"]);
    const over = capacityFromFactFinder(ff, rates, { minDownPct: 25, ratePct: 7.1 }).capacity;
    expect(over.minDownPct).toBe(25); expect(over.ratePct).toBe(7.1);
    expect(capacityFromFactFinder(null, { mortgage: null, fedFunds: null, cpi: null }).capacity.ratePct).toBe(7);
  });
});

const req: PlanRequest = {
  capacity: { annualIncome: 300000, cashAvailable: 200000, monthlyDebts: 3500, creditScore: 780, maxDti: 0.45, minDownPct: 20, closingPct: 3, reservesMonths: 6, ratePct: 6.5, termYears: 30 },
  picks: [{ zip: "28401", price: 400000, label: "Wilmington 28401", monthlyRent: 2400, appreciationPct: 5, rentGrowthPct: 3 }, { zip: "28403", price: 380000, monthlyRent: 2300, appreciationPct: 4.5, rentGrowthPct: 3 }, { zip: "28405", price: 420000, monthlyRent: 2500, appreciationPct: 4, rentGrowthPct: 2.5 }],
  startYear: 2027, startMonth: 9, staggerMonths: 6, horizonYears: 30, termYears: 30, interestOnlyYears: 2, investorSpreadPct: 0.5, rateShiftPct: 0, furnishing: 20000,
  income: { kind: "ltr", source: "Zillow ZORI", asOf: "2025" },
  costs: { propertyTaxPct: 0.9, insurancePerYear: 2500, hoaPerYear: 0, maintenancePct: 1, managementPct: 8, utilitiesPerYear: 0, platformFeePct: 0, cleaningPerYear: 0 },
  tax: { buildingSharePct: 80, costSegSharePct: 25, bonusPct: 100, marginalRatePct: 37, depreciationYears: 27.5 },
  growth: { expenseGrowthPct: null, appreciationPct: null, rentGrowthPct: null },
  iul: { optionId: ALL_INDEX_OPTIONS[0]!.id, startYear: 1994, premiumLoadPct: 8, annualChargePctOfValue: 1.5, loanRatePct: 5, firstLoanYear: 2, maxLoanPctOfValue: 90, newPolicyThreshold: 250000 },
  assignAfterTaxCashPct: 0,
};

describe("the plan", () => {
  it("staggers the purchases by month, writes each loan at the record's rate plus the add-on, grows costs at the CPI reading, and runs the loop on the backtester's crediting", () => {
    const a = buildEnterprise(req, rates);
    expect(a.letters.map((l) => l.purchase)).toEqual(["2027-09-01", "2028-03-01", "2028-09-01"]);
    expect(a.letters[0]).toMatchObject({ principal: 320000, ratePct: 7, termYears: 30, interestOnlyYears: 2 });
    expect(a.letters[0]!.interestOnlyMonthly).toBeCloseTo(320000 * 0.07 / 12, 6);
    expect(a.letters[0]!.interestOnlyShareOfIncome).toBeCloseTo((320000 * 0.07 / 12) / 25000, 6);
    expect(a.letters[0]!.lines.join(" ")).toContain("7.00%");
    expect(a.assumptions[1]).toContain("2.90%");
    expect(a.assumptions[1]).toContain("CPI-U");
    expect(a.enterprise.perProperty[0]!.plan.expenseGrowthPct).toBe(2.9);
    expect(a.enterprise.perProperty[0]!.plan.income).toMatchObject({ kind: "ltr", monthlyRent: 2400 });
    expect(a.enterprise.perProperty[0]!.plan.furnishing).toBe(0); // long-term rent: no furnishing line
    expect(a.crediting?.optionId).toBe(ALL_INDEX_OPTIONS[0]!.id);
    expect(a.crediting?.years.length).toBeGreaterThan(20);
    expect(a.enterprise.loop).not.toBeNull();
    expect(a.enterprise.totals.interestSaved).toBeGreaterThan(0);
    expect(a.enterprise.years).toHaveLength(30);
  });
  it("without a policy, or with an unknown index account, the plan runs and the loop is off", () => {
    const off = buildEnterprise({ ...req, iul: null }, rates);
    expect(off.crediting).toBeNull(); expect(off.enterprise.loop).toBeNull();
    const bad = buildEnterprise({ ...req, iul: { ...req.iul!, optionId: "no-such-option" } }, rates);
    expect(bad.crediting).toBeNull(); expect(bad.enterprise.loop).toBeNull();
  });
  it("a short-term plan takes the nightly figures and the furnishing; a rate shift moves every loan", () => {
    const str = buildEnterprise({ ...req, income: { kind: "str", nightlyRate: 320, occupancyPct: 60, source: "typed", asOf: "2026-09-07" }, rateShiftPct: 1, growth: { expenseGrowthPct: 3, appreciationPct: 3, rentGrowthPct: 2 } }, rates);
    expect(str.letters[0]!.ratePct).toBe(8);
    expect(str.enterprise.perProperty[0]!.plan.furnishing).toBe(20000);
    expect(str.enterprise.perProperty[0]!.plan.appreciationPct).toBe(3);
    expect(str.assumptions[0]).toContain("scenario shift 1.00%");
  });
});
