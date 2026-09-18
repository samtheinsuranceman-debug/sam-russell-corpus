/**
 * Tests for Mortgage Killer PDF Export Service & Scenario Comparison Mode
 * Covers: PDF generation, scenario comparison calculations, frontend wiring
 */
import { describe, it, expect } from "vitest";
import {
  runMortgageKillerAnalysis,
  buildStandardAmortization,
  type MortgageKillerInput,
  type MortgageKillerResult,
} from "../shared/mortgageKiller";
import fs from "fs";
import path from "path";

// ─── Shared test input ──────────────────────────────────────────────────────
const BASE_INPUT: MortgageKillerInput = {
  mortgageBalance: 350000,
  mortgageRate: 0.065,
  mortgageTermMonths: 360,
  monthlyMortgagePayment: 2212,
  monthlyInterestOnlyPayment: 1896,
  totalInterestPayments: 446247,
  homeEquityValue: 150000,
  homeMarketValue: 500000,
  iraValue: 75000,
  cashValue: 25000,
  investments: 50000,
  annuities: 0,
  otherInvestments: 15000,
  cryptocurrency: 10000,
  annualIncome: 120000,
  incomeAllocationPct: 0.20,
  iulCreditRate: 0.12,
  premiumYears: 10,
  helocRate: 0.085,
  helocLtvPct: 0.60,
  policyLoanPct: 0.80,
  interestReinvestRate: 0.07,
  interestReinvestYears: 20,
  clientAge: 45,
};

// ─── PDF Service Tests ──────────────────────────────────────────────────────
describe("Mortgage Killer PDF Service", () => {
  it("mortgageKillerPdf module should be importable", async () => {
    const mod = await import("./mortgageKillerPdf");
    expect(mod).toBeDefined();
    expect(typeof mod.generateMortgageKillerPdf).toBe("function");
  });

  it("should generate a valid PDF buffer", async () => {
    const { generateMortgageKillerPdf } = await import("./mortgageKillerPdf");
    const result = runMortgageKillerAnalysis(BASE_INPUT);
    const pdf = await generateMortgageKillerPdf({
      result,
      clientName: "Test Client",
      advisorName: "Test Advisor",
      firmName: "Russell Capital Systems",
      mortgageRate: BASE_INPUT.mortgageRate,
      annualIncome: BASE_INPUT.annualIncome,
      mortgageBalance: BASE_INPUT.mortgageBalance,
      homeMarketValue: BASE_INPUT.homeMarketValue,
      homeEquityValue: BASE_INPUT.homeEquityValue,
      incomeAllocationPct: 0.20,
    });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(1000); // Should be a substantial PDF
    // PDF magic bytes: %PDF
    expect(pdf.slice(0, 4).toString()).toBe("%PDF");
  });

  it("should generate PDF with substantial content for different clients", async () => {
    const { generateMortgageKillerPdf } = await import("./mortgageKillerPdf");
    const result = runMortgageKillerAnalysis(BASE_INPUT);
    const pdf = await generateMortgageKillerPdf({
      result,
      clientName: "John Smith",
      advisorName: "Sam Russell",
      firmName: "Russell Capital Systems",
      mortgageRate: BASE_INPUT.mortgageRate,
      annualIncome: BASE_INPUT.annualIncome,
      mortgageBalance: BASE_INPUT.mortgageBalance,
      homeMarketValue: BASE_INPUT.homeMarketValue,
      homeEquityValue: BASE_INPUT.homeEquityValue,
      incomeAllocationPct: 0.20,
    });
    // Should be a substantial PDF (at least 10KB for a multi-page report)
    expect(pdf.length).toBeGreaterThan(10000);
    // PDF should start with magic bytes
    expect(pdf.slice(0, 4).toString()).toBe("%PDF");
    // PDF should end with %%EOF
    const tail = pdf.slice(-20).toString("latin1");
    expect(tail).toContain("%%EOF");
  });

  it("should generate multi-page PDF", async () => {
    const { generateMortgageKillerPdf } = await import("./mortgageKillerPdf");
    const result = runMortgageKillerAnalysis(BASE_INPUT);
    const pdf = await generateMortgageKillerPdf({
      result,
      clientName: "Test Client",
      advisorName: "Test Advisor",
      mortgageRate: BASE_INPUT.mortgageRate,
      annualIncome: BASE_INPUT.annualIncome,
      mortgageBalance: BASE_INPUT.mortgageBalance,
      homeMarketValue: BASE_INPUT.homeMarketValue,
      homeEquityValue: BASE_INPUT.homeEquityValue,
      incomeAllocationPct: 0.20,
    });
    // Count page references in PDF
    const pdfStr = pdf.toString("latin1");
    const pageMatches = pdfStr.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).toBeTruthy();
    // Should have at least 7 pages (cover, fact finder, current, recommended, IUL, HELOC, savings, exec summary, disclaimers)
    expect(pageMatches!.length).toBeGreaterThanOrEqual(7);
  });

  it("should handle different allocation percentages", async () => {
    const { generateMortgageKillerPdf } = await import("./mortgageKillerPdf");
    const input15 = { ...BASE_INPUT, incomeAllocationPct: 0.15 };
    const input30 = { ...BASE_INPUT, incomeAllocationPct: 0.30 };
    const result15 = runMortgageKillerAnalysis(input15);
    const result30 = runMortgageKillerAnalysis(input30);

    const pdf15 = await generateMortgageKillerPdf({
      result: result15,
      clientName: "Client 15%",
      advisorName: "Advisor",
      mortgageRate: input15.mortgageRate,
      annualIncome: input15.annualIncome,
      mortgageBalance: input15.mortgageBalance,
      homeMarketValue: input15.homeMarketValue,
      homeEquityValue: input15.homeEquityValue,
      incomeAllocationPct: 0.15,
    });

    const pdf30 = await generateMortgageKillerPdf({
      result: result30,
      clientName: "Client 30%",
      advisorName: "Advisor",
      mortgageRate: input30.mortgageRate,
      annualIncome: input30.annualIncome,
      mortgageBalance: input30.mortgageBalance,
      homeMarketValue: input30.homeMarketValue,
      homeEquityValue: input30.homeEquityValue,
      incomeAllocationPct: 0.30,
    });

    expect(pdf15).toBeInstanceOf(Buffer);
    expect(pdf30).toBeInstanceOf(Buffer);
    // Both should be valid PDFs
    expect(pdf15.slice(0, 4).toString()).toBe("%PDF");
    expect(pdf30.slice(0, 4).toString()).toBe("%PDF");
  });
});

// ─── Scenario Comparison Tests ──────────────────────────────────────────────
describe("Scenario Comparison Mode", () => {
  const SCENARIOS = [
    { label: "Conservative (15%)", allocationPct: 0.15, helocRate: 0.09 },
    { label: "Moderate (20%)", allocationPct: 0.20, helocRate: 0.085 },
    { label: "Aggressive (25%)", allocationPct: 0.25, helocRate: 0.08 },
    { label: "Max Acceleration (30%)", allocationPct: 0.30, helocRate: 0.075 },
  ];

  const scenarioResults = SCENARIOS.map((s) => {
    const input = { ...BASE_INPUT, incomeAllocationPct: s.allocationPct, helocRate: s.helocRate };
    return { ...s, result: runMortgageKillerAnalysis(input) };
  });

  it("all four scenarios should produce valid results", () => {
    scenarioResults.forEach((s) => {
      expect(s.result).toBeDefined();
      expect(s.result.currentPlan).toBeDefined();
      expect(s.result.recommendedPlan).toBeDefined();
      expect(s.result.summary).toBeDefined();
      expect(s.result.iulPolicy).toBeDefined();
      expect(s.result.helocSchedule).toBeDefined();
      expect(s.result.interestSavings).toBeDefined();
    });
  });

  it("higher allocation should save more interest", () => {
    for (let i = 1; i < scenarioResults.length; i++) {
      expect(scenarioResults[i].result.summary.totalInterestSaved)
        .toBeGreaterThanOrEqual(scenarioResults[i - 1].result.summary.totalInterestSaved);
    }
  });

  it("higher allocation should pay off mortgage faster", () => {
    for (let i = 1; i < scenarioResults.length; i++) {
      expect(scenarioResults[i].result.recommendedPlan.payoffMonths)
        .toBeLessThanOrEqual(scenarioResults[i - 1].result.recommendedPlan.payoffMonths);
    }
  });

  it("higher allocation should have higher annual premium", () => {
    for (let i = 1; i < scenarioResults.length; i++) {
      expect(scenarioResults[i].result.summary.annualIulPremium)
        .toBeGreaterThan(scenarioResults[i - 1].result.summary.annualIulPremium);
    }
  });

  it("all scenarios should have same current plan", () => {
    const baseline = scenarioResults[0].result.currentPlan;
    for (let i = 1; i < scenarioResults.length; i++) {
      expect(scenarioResults[i].result.currentPlan.totalInterest).toBeCloseTo(baseline.totalInterest, 0);
      expect(scenarioResults[i].result.currentPlan.payoffMonths).toBe(baseline.payoffMonths);
    }
  });

  it("15% allocation should save at least some years", () => {
    const conservative = scenarioResults[0].result;
    expect(conservative.summary.yearsSaved).toBeGreaterThanOrEqual(1);
    expect(conservative.summary.totalInterestSaved).toBeGreaterThan(0);
  });

  it("30% allocation should save the most years", () => {
    const maxAccel = scenarioResults[3].result;
    const conservative = scenarioResults[0].result;
    expect(maxAccel.summary.yearsSaved).toBeGreaterThanOrEqual(conservative.summary.yearsSaved);
  });

  it("each scenario should have correct annual premium based on allocation", () => {
    scenarioResults.forEach((s) => {
      const expectedPremium = BASE_INPUT.annualIncome * s.allocationPct;
      expect(s.result.summary.annualIulPremium).toBeCloseTo(expectedPremium, 0);
    });
  });

  it("total wealth created should increase with higher allocation", () => {
    for (let i = 1; i < scenarioResults.length; i++) {
      expect(scenarioResults[i].result.summary.totalWealthCreated)
        .toBeGreaterThanOrEqual(scenarioResults[i - 1].result.summary.totalWealthCreated);
    }
  });

  it("compounded interest savings should be positive for all scenarios", () => {
    scenarioResults.forEach((s) => {
      expect(s.result.interestSavings.compoundedValue20yr).toBeGreaterThan(0);
    });
  });

  it("all scenarios should have valid mortgage-free dates", () => {
    scenarioResults.forEach((s) => {
      expect(s.result.summary.mortgageFreeDate).toBeTruthy();
      expect(s.result.summary.originalPayoffDate).toBeTruthy();
    });
  });

  it("all scenarios should have IUL policy loans", () => {
    scenarioResults.forEach((s) => {
      expect(s.result.summary.totalPolicyLoans).toBeGreaterThan(0);
    });
  });

  it("all scenarios should have HELOC draws", () => {
    scenarioResults.forEach((s) => {
      expect(s.result.summary.totalHelocDrawn).toBeGreaterThan(0);
    });
  });
});

// ─── Frontend Wiring Tests ──────────────────────────────────────────────────
describe("Mortgage Killer Frontend — PDF & Scenario UI", () => {
  it("MortgageKiller page should contain Export PDF button", async () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/portal/MortgageKiller.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Export PDF");
    expect(content).toContain("exportPdfMut.mutateAsync");
  });

  it("MortgageKiller page should contain Email PDF dialog", async () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/portal/MortgageKiller.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Email PDF");
    expect(content).toContain("emailPdfMut.mutateAsync");
    expect(content).toContain("clientEmail");
    expect(content).toContain("DialogContent");
  });

  it("MortgageKiller page should contain scenario comparison button", async () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/portal/MortgageKiller.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Compare Scenarios");
    expect(content).toContain("SCENARIO_PRESETS");
    expect(content).toContain("scenarioResults");
  });

  it("MortgageKiller page should have Scenarios tab", async () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/portal/MortgageKiller.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain('value="scenarios"');
    expect(content).toContain("Scenarios");
  });

  it("MortgageKiller page should have 4 scenario presets (15/20/25/30%)", async () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/portal/MortgageKiller.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Conservative (15%)");
    expect(content).toContain("Moderate (20%)");
    expect(content).toContain("Aggressive (25%)");
    expect(content).toContain("Max Acceleration (30%)");
  });

  it("MortgageKiller page should have radar chart for scenario comparison", async () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/portal/MortgageKiller.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("RadarChart");
    expect(content).toContain("PolarGrid");
    expect(content).toContain("scenarioRadarData");
  });

  it("MortgageKiller page should have side-by-side comparison table", async () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/portal/MortgageKiller.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Side-by-Side Scenario Detail");
    expect(content).toContain("annualIulPremium");
    expect(content).toContain("totalPolicyLoans");
    expect(content).toContain("totalWealthCreated");
  });

  it("server should have protected Mortgage Killer PDF procedure", async () => {
    const serverPath = path.resolve(__dirname, "./routers.ts");
    const content = fs.readFileSync(serverPath, "utf-8");
    expect(content).toContain("exportPdf:");
    expect(content).toContain("protectedProcedure");
    expect(content).toContain("generateMortgageKillerPdf");
  });

  it("server should have protected Mortgage Killer email procedure", async () => {
    const serverPath = path.resolve(__dirname, "./routers.ts");
    const content = fs.readFileSync(serverPath, "utf-8");
    expect(content).toContain("emailPdf:");
    expect(content).toContain("PRECONDITION_FAILED");
    expect(content).toContain("sendClientReportEmail");
  });
});

// ─── Edge Case Tests ────────────────────────────────────────────────────────
describe("Mortgage Killer Edge Cases", () => {
  it("should handle very low mortgage balance", () => {
    const input = { ...BASE_INPUT, mortgageBalance: 50000, mortgageTermMonths: 120 };
    const result = runMortgageKillerAnalysis(input);
    expect(result.currentPlan.schedule.length).toBeGreaterThan(0);
    expect(result.recommendedPlan.schedule.length).toBeGreaterThan(0);
    expect(result.summary.totalInterestSaved).toBeGreaterThanOrEqual(0);
  });

  it("should handle high income allocation (40%)", () => {
    const input = { ...BASE_INPUT, incomeAllocationPct: 0.40 };
    const result = runMortgageKillerAnalysis(input);
    expect(result.summary.annualIulPremium).toBeCloseTo(48000, 0);
    expect(result.summary.yearsSaved).toBeGreaterThan(0);
  });

  it("should handle minimum allocation (5%)", () => {
    const input = { ...BASE_INPUT, incomeAllocationPct: 0.05 };
    const result = runMortgageKillerAnalysis(input);
    expect(result.summary.annualIulPremium).toBeCloseTo(6000, 0);
    expect(result.currentPlan.totalInterest).toBeGreaterThan(result.recommendedPlan.totalInterest);
  });

  it("should handle high mortgage rate (8%)", () => {
    const input = { ...BASE_INPUT, mortgageRate: 0.08 };
    const result = runMortgageKillerAnalysis(input);
    expect(result.currentPlan.totalInterest).toBeGreaterThan(0);
    expect(result.summary.totalInterestSaved).toBeGreaterThan(0);
  });

  it("should handle short remaining term (10 years)", () => {
    const input = { ...BASE_INPUT, mortgageTermMonths: 120 };
    const result = runMortgageKillerAnalysis(input);
    expect(result.currentPlan.payoffMonths).toBeLessThanOrEqual(120);
  });

  it("interest savings year-by-year should be monotonically increasing in cumulative", () => {
    const result = runMortgageKillerAnalysis(BASE_INPUT);
    const yearByYear = result.interestSavings.yearByYear;
    for (let i = 1; i < yearByYear.length; i++) {
      expect(yearByYear[i].cumulativeSaved).toBeGreaterThanOrEqual(yearByYear[i - 1].cumulativeSaved);
    }
  });

  it("compounded value should grow over time", () => {
    const result = runMortgageKillerAnalysis(BASE_INPUT);
    const yearByYear = result.interestSavings.yearByYear;
    for (let i = 1; i < yearByYear.length; i++) {
      expect(yearByYear[i].compoundedValue).toBeGreaterThanOrEqual(yearByYear[i - 1].compoundedValue);
    }
  });
});
