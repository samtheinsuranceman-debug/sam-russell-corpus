// ============================================================
// The forgiveness engine: the record and its events, the political
// correlation, the 2026 payment formulas (poverty guideline, IBR, RAP,
// standard), the simulation, the PSLF and IDR paths for a physician profile,
// the service programs, the investment side, and the panel seeds.
// ============================================================
import { describe, expect, it } from "vitest";
import { EVENTS, PROGRAMS, DEFAULT_BASE_HAZARD, forgivenessOutlook, futureValue, idrPath, investmentAlternative, monthlyPayment, politicalCorrelation, povertyGuideline2026, programSurvival, pslfPath, simulate, standardPayment, type BorrowerProfile } from "@shared/forgiveness";
import { FORGIVENESS_CLAIM_SEEDS, FORGIVENESS_SOURCES } from "./forgivenessSources";

const md: BorrowerProfile = { balance: 205_000, annualRate: 0.08, loans: "direct", employer: "nonprofit_501c3", qualifyingPaymentsMade: 0, residencyMonthsLeft: 36, residencyStipend: 65_100, attendingIncome: 170_000, incomeGrowth: 0.03, householdSize: 1, dependents: 0, filing: "single", plan: "ibr", disciplined: true };

describe("the record", () => {
  it("carries every program with an authority, a window and citations, and stamps every event with who held the levers", () => {
    expect(PROGRAMS.length).toBeGreaterThanOrEqual(15);
    for (const p of PROGRAMS) { expect(p.authority.length).toBeGreaterThan(10); expect(p.open).toMatch(/^\d{4}-\d{2}-\d{2}$/); expect(p.citations.length).toBeGreaterThan(0); }
    expect(PROGRAMS.find((p) => p.id === "pslf")).toMatchObject({ enacted: "2007-09-27", open: "2007-10-01", status: "open" });
    expect(PROGRAMS.find((p) => p.id === "save")).toMatchObject({ status: "ended" });
    expect(PROGRAMS.find((p) => p.id === "rap")!.award).toMatch(/360|30 years/);
    const pslf2007 = EVENTS.find((e) => e.programId === "pslf" && e.year === 2007)!;
    expect(pslf2007).toMatchObject({ president: "R", senate: "D", house: "D", trifecta: null, leverShare: 0.5 });
    expect(EVENTS.find((e) => e.programId === "rap")).toMatchObject({ direction: -1, trifecta: "R", leverShare: 0 });
    expect(EVENTS.find((e) => e.programId === "arpa-108f5" && e.direction > 0)).toMatchObject({ trifecta: "D", leverShare: 1 });
  });
  it("computes the political correlation from the events rather than asserting it", () => {
    const c = politicalCorrelation();
    expect(c.n).toBe(EVENTS.length);
    expect(c.expansions + c.contractions).toBe(c.n);
    expect(c.r).toBeGreaterThan(-1); expect(c.r).toBeLessThan(1);
    expect(c.byBucket.left.expansions + c.byBucket.divided.expansions + c.byBucket.right.expansions).toBe(c.expansions);
    // every contraction by the elected branches sits in a right-held year; the court rulings are counted separately
    expect(c.courtEvents).toBe(EVENTS.filter((e) => e.enactedBy === "court").length);
    expect(c.byBucket.right.contractions).toBe(c.contractions - EVENTS.filter((e) => e.enactedBy === "court" && e.direction < 0 && e.leverShare > 1 / 3).length);
    expect(c.meanShareExpansions!).toBeGreaterThan(c.meanShareContractions!);
    expect(c.rElected).toBeGreaterThan(-1); expect(c.rElected).toBeLessThan(1);
    expect(c.reading).toMatch(/not a law/);
  });
});

describe("payment formulas, 2026", () => {
  it("uses the HHS 2026 guideline and the statutory plan terms", () => {
    expect(povertyGuideline2026(1)).toBe(15_960); expect(povertyGuideline2026(4)).toBe(33_000); expect(povertyGuideline2026(9)).toBe(55_720 + 5_680);
    const std = standardPayment(205_000, 0.08);
    expect(std).toBeCloseTo(2_487.2, 0); // 205k at 8% over 120 months
    expect(monthlyPayment("ibr", 65_100, 1, 0, std)).toBeCloseTo((0.10 * (65_100 - 23_940)) / 12, 2); // 10% of AGI above 150% FPL
    expect(monthlyPayment("ibr_old", 65_100, 1, 0, std)).toBeCloseTo((0.15 * (65_100 - 23_940)) / 12, 2);
    expect(monthlyPayment("ibr", 900_000, 1, 0, std)).toBe(std); // capped at the standard payment
    expect(monthlyPayment("rap", 9_000, 1, 0, std)).toBe(10);
    expect(monthlyPayment("rap", 15_000, 1, 0, std)).toBeCloseTo((0.01 * 15_000) / 12, 2);
    expect(monthlyPayment("rap", 65_100, 1, 0, std)).toBeCloseTo((0.06 * 65_100) / 12, 2);   // more than $60,000 and not more than $70,000 → 6%
    expect(monthlyPayment("rap", 170_000, 1, 2, std)).toBeCloseTo((0.10 * 170_000) / 12 - 100, 2); // 10% above $100k, less $50 per dependent
    expect(monthlyPayment("rap", 12_000, 1, 3, std)).toBe(10); // floor
    expect(monthlyPayment("standard", 1, 1, 0, std)).toBe(std);
  });
  it("simulates payments through training and practice; RAP never grows the balance, IBR accrues unpaid interest", () => {
    const ibr = simulate(md, "ibr", 36);
    expect(ibr.endBalance).toBeGreaterThan(md.balance); // residency payments below interest: balance grows
    const rap = simulate(md, "rap", 36);
    expect(rap.endBalance).toBeLessThanOrEqual(md.balance); // unpaid interest not charged, principal matched
    const std = simulate({ ...md, residencyMonthsLeft: 0 }, "standard", 120);
    expect(std.endBalance).toBe(0);
    expect(std.totalPaid).toBeCloseTo(standardPayment(md.balance, md.annualRate) * 120, -2);
  });
});

describe("the paths", () => {
  const prob = { expectedLeverShare: 0.5 };
  it("PSLF for a physician: 120 payments, tax-free forgiveness of principal and accrued interest, odds = survival × execution", () => {
    const p = pslfPath(md, prob, new Date("2026-09-01"));
    expect(p.eligible).toBe(true);
    expect(p.monthsToForgiveness).toBe(120);
    expect(p.forgivenessDate).toBe("2036-09-01");
    expect(p.forgivenAmount).toBeGreaterThan(150_000); // the AAMC scenario at these inputs forgives ~$243k
    expect(p.forgivenAmount).toBeLessThan(320_000);
    expect(p.taxOnForgiveness).toBe(0);
    expect(p.probabilityParts!.programSurvives).toBeCloseTo(programSurvival(10, prob), 3);
    expect(p.probabilityParts!.staysEligible).toBeCloseTo(0.97 ** 10, 3);
    expect(p.probability).toBeCloseTo(p.probabilityParts!.programSurvives * p.probabilityParts!.staysEligible! * 0.9, 2);
    expect(p.citations).toContain("26 U.S.C. §108(f)(1)");
    const forProfit = pslfPath({ ...md, employer: "for_profit" }, prob);
    expect(forProfit.eligible).toBe(false); expect(forProfit.probability).toBe(0);
    const priv = pslfPath({ ...md, loans: "private" }, prob);
    expect(priv.eligible).toBe(false);
    const late = pslfPath({ ...md, qualifyingPaymentsMade: 84 }, prob);
    expect(late.monthsToForgiveness).toBe(36);
    expect(pslfPath({ ...md, disciplined: false }, prob).probabilityParts!.borrowerExecutes).toBe(0.6);
  });
  it("survival tilts with who is expected to hold the levers, from a clean 19-year record (Jeffreys base, regulatory term)", () => {
    expect(DEFAULT_BASE_HAZARD).toBeCloseTo(0.5 / 20, 4);
    const left = programSurvival(10, { expectedLeverShare: 1 }), mid = programSurvival(10, { expectedLeverShare: 0.5 }), right = programSurvival(10, { expectedLeverShare: 0 });
    expect(left).toBeGreaterThan(mid); expect(mid).toBeGreaterThan(right);
    expect(mid).toBeCloseTo(((1 - 0.025) * (1 - 0.05)) ** 10, 3);
    expect(programSurvival(0, { expectedLeverShare: 0.5 })).toBe(1);
  });
  it("IDR forgiveness is later, taxable after 2025, and often zero at attending income", () => {
    const p = idrPath(md, prob, new Date("2026-09-01"));
    expect(p.programId).toBe("ibr");
    expect(p.monthsToForgiveness).toBe(240);
    if (p.forgivenAmount > 0) { expect(p.taxOnForgiveness).toBeGreaterThan(0); expect(p.netBenefit).toBeLessThan(p.forgivenAmount); } else { expect(p.notes.some((n) => /repaid in full/.test(n))).toBe(true); }
    const rap = idrPath({ ...md, plan: "rap" }, prob);
    expect(rap.monthsToForgiveness).toBe(360);
    expect(rap.probabilityParts!.programSurvives).toBeLessThan(p.probabilityParts!.programSurvives); // longer wait
  });
  it("service programs pay their published maxima, capped at the balance, tax-free, and only when the borrower would serve", () => {
    const out = forgivenessOutlook({ ...md, primaryCare: true, willingHPSA: true, willingVA: true }, prob, new Date("2026-09-01"));
    const nhsc = out.paths.find((p) => p.programId === "nhsc-lrp")!, va = out.paths.find((p) => p.programId === "va-edrp")!, ihs = out.paths.find((p) => p.programId === "ihs-lrp")!;
    expect(nhsc).toMatchObject({ eligible: true, forgivenAmount: 75_000, taxOnForgiveness: 0, monthsToForgiveness: 24 });
    expect(va).toMatchObject({ eligible: true, forgivenAmount: 200_000, monthsToForgiveness: 60 });
    expect(ihs.eligible).toBe(false);
    expect(forgivenessOutlook({ ...md, balance: 30_000, willingHPSA: true }, prob).paths.find((p) => p.programId === "nhsc-lrp")!.forgivenAmount).toBe(30_000);
    expect(out.best!.programId).toBe("va-edrp"); // $200,000 tax-free at high odds outranks PSLF's net × odds when the borrower would work at the VA — and a VA physician can pursue both
    expect(forgivenessOutlook(md, prob, new Date("2026-09-01")).best!.programId).toBe("pslf");
  });
  it("turns the freed payment into an account: contributions, taxable and tax-free values at 20 and 30 years", () => {
    expect(futureValue(Array(120).fill(100), 10, 0)).toBe(12_000);
    expect(futureValue(Array(12).fill(100), 1, 0.12)).toBeCloseTo(100 * ((1.01 ** 12 - 1) / 0.01), 0);
    const p = pslfPath(md, prob, new Date("2026-09-01"));
    const alt = investmentAlternative(md, p, 0.07, 0.25, 0.01);
    expect(alt.monthlyFreed).toBeGreaterThan(2_000); // standard ≈ $2,487 minus the residency IBR payment ≈ $343
    expect(alt.taxable.contributed30).toBeGreaterThan(alt.taxable.contributed20);
    expect(alt.taxFree.value30).toBeGreaterThan(alt.taxable.value30); // 6% net beats 5.25% net
    expect(alt.taxFree.annualReturnUsed).toBeCloseTo(0.06, 6); expect(alt.taxable.annualReturnUsed).toBeCloseTo(0.0525, 6);
    expect(alt.assumptions.some((a) => /not a recommendation/.test(a))).toBe(true);
  });
});

describe("the forgiveness panel", () => {
  it("has 5–12 authorities and only cited, dated seeds that name a known source", () => {
    expect(FORGIVENESS_SOURCES.length).toBeGreaterThanOrEqual(5); expect(FORGIVENESS_SOURCES.length).toBeLessThanOrEqual(12);
    const ids = new Set(FORGIVENESS_SOURCES.map((s) => s.id));
    for (const c of FORGIVENESS_CLAIM_SEEDS) { expect(ids.has(c.sourceId), c.sourceId).toBe(true); expect(c.citation!.length).toBeGreaterThan(20); expect(c.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
    expect(FORGIVENESS_CLAIM_SEEDS.find((c) => c.metric === "median_education_debt_indebted_usd")!.value).toBe("205000");
    expect(FORGIVENESS_CLAIM_SEEDS.find((c) => c.metric === "pslf_borrowers_forgiven_cumulative" && c.horizonYear === 2024)!.value).toBe("1062870");
  });
});
