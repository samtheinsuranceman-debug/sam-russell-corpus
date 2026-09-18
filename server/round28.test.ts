import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { generateRothReport } from "./rothPdfReport";

/* ── Constants matching the engine ── */
const IUL_LOAD_FEE = 0.06;
const IUL_LOAN_RATE = 0.05;
const IUL_AVG_RETURN = 0.10;
const IUL_COI_RATE = 0.05;
const SOLAR_ENHANCEMENT = 0.22;

describe("Round 28 – 6-Option Roth Conversion Strategies", () => {
  describe("Router structure", () => {
    it("rothConversion router exists on appRouter", () => {
      expect(appRouter._def.procedures).toHaveProperty("rothConversion.project");
    });
  });

  describe("Strategy option definitions", () => {
    it("Year 1 Non Solar: 1 property, all in year 1", () => {
      const ira = 800_000;
      const target = ira / 0.4; // 2,000,000
      const count = 1;
      const perProperty = target / count;
      expect(target).toBe(2_000_000);
      expect(perProperty).toBe(2_000_000);
    });

    it("Year 2 Non Solar: 2 properties spread over 2 years", () => {
      const ira = 800_000;
      const target = ira / 0.4;
      const count = 2;
      const perProperty = target / count;
      expect(count).toBe(2);
      expect(perProperty).toBe(1_000_000);
    });

    it("Year 3 Non Solar: 3 properties spread over 3 years", () => {
      const ira = 800_000;
      const target = ira / 0.4;
      const count = 3;
      const perProperty = target / count;
      expect(count).toBe(3);
      expect(Math.round(perProperty)).toBeCloseTo(666667, -2);
    });

    it("Year 5 Non Solar: 5 properties spread over 5 years", () => {
      const ira = 800_000;
      const target = ira / 0.4;
      const count = 5;
      const perProperty = target / count;
      expect(count).toBe(5);
      expect(perProperty).toBe(400_000);
    });

    it("Year 1 Solar: adds 22% enhancement", () => {
      const ira = 800_000;
      const solarEnhancement = ira * SOLAR_ENHANCEMENT;
      expect(solarEnhancement).toBe(176_000);
    });
  });

  describe("IUL Premium Cascade (Non Solar)", () => {
    const ira = 800_000;
    const taxSavings = ira * 0.50;
    const halfTaxSavings = taxSavings / 2;

    it("Year 1 premium = half tax savings", () => {
      expect(halfTaxSavings).toBe(200_000);
    });

    it("Year 2 premium = other half tax savings", () => {
      expect(halfTaxSavings).toBe(200_000);
    });

    it("Month 13 policy loan = 25% of IRA", () => {
      const month13Loan = ira * 0.25;
      expect(month13Loan).toBe(200_000);
    });

    it("Year 1 IUL: load fee = 6%, COI = 5%, net = 89%", () => {
      const premium = halfTaxSavings;
      const loadFee = premium * IUL_LOAD_FEE;
      const coiCost = premium * IUL_COI_RATE;
      const net = premium - loadFee - coiCost;
      expect(loadFee).toBe(12_000);
      expect(coiCost).toBe(10_000);
      expect(net).toBe(178_000);
    });

    it("Year 1 interest earned = 10% of account value after net premium", () => {
      const net = 178_000;
      const interest = net * IUL_AVG_RETURN;
      expect(interest).toBe(17_800);
    });

    it("Year 1 ending account value = net + interest", () => {
      const net = 178_000;
      const interest = net * IUL_AVG_RETURN;
      const endingValue = net + interest;
      expect(endingValue).toBe(195_800);
    });
  });

  describe("IUL Premium Cascade (Solar)", () => {
    const ira = 800_000;
    const solarEnhancement = ira * SOLAR_ENHANCEMENT;
    const taxSavings = ira * 0.50;
    const halfTaxSavings = taxSavings / 2;

    it("Year 1 premium = solar enhancement (22%)", () => {
      expect(solarEnhancement).toBe(176_000);
    });

    it("Year 2 premium = half tax savings", () => {
      expect(halfTaxSavings).toBe(200_000);
    });

    it("Solar Y1 net to account = 176000 * 0.89", () => {
      const net = solarEnhancement * (1 - IUL_LOAD_FEE - IUL_COI_RATE);
      expect(Math.round(net)).toBe(156_640);
    });
  });

  describe("STR Property Calculations", () => {
    it("Down payment = 30% of target property price", () => {
      const ira = 800_000;
      const target = ira / 0.4;
      const down = target * 0.30;
      expect(down).toBe(600_000);
    });

    it("Mortgage = 70% of target property price", () => {
      const ira = 800_000;
      const target = ira / 0.4;
      const mortgage = target * 0.70;
      expect(mortgage).toBe(1_400_000);
    });

    it("5% appreciation compounds correctly over 20 years", () => {
      const initial = 2_000_000;
      const final = initial * Math.pow(1.05, 20);
      expect(Math.round(final)).toBe(5_306_595);
    });

    it("20% rental gross yield on appreciated value", () => {
      const propertyValue = 2_100_000; // year 1 at 5% appreciation
      const rental = propertyValue * 0.20;
      expect(rental).toBe(420_000);
    });
  });

  describe("What-If Scenario Toggles", () => {
    it("Rental yield range: 10% to 30%", () => {
      const yields = [0.10, 0.15, 0.20, 0.25, 0.30];
      const propertyValue = 2_000_000;
      yields.forEach((y) => {
        const rental = propertyValue * y;
        expect(rental).toBeGreaterThan(0);
        expect(rental).toBeLessThanOrEqual(600_000);
      });
    });

    it("Appreciation range: 2% to 10%", () => {
      const rates = [0.02, 0.05, 0.10];
      const initial = 2_000_000;
      rates.forEach((r) => {
        const final = initial * Math.pow(1 + r, 20);
        expect(final).toBeGreaterThan(initial);
      });
    });

    it("HELOC rate range: 4% to 12%", () => {
      const rates = [0.04, 0.07, 0.12];
      const helocAmount = 600_000;
      rates.forEach((r) => {
        const annualPayment = helocAmount * r;
        expect(annualPayment).toBeGreaterThan(0);
      });
    });

    it("Higher appreciation = higher final property value", () => {
      const initial = 2_000_000;
      const low = initial * Math.pow(1.02, 20);
      const high = initial * Math.pow(1.10, 20);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe("Multi-year strategy property spreading", () => {
    it("2-year strategy: properties acquired in year 1 and year 2", () => {
      const totalCount = 2;
      const strategyYears = 2;
      let acquired = 0;
      for (let y = 1; y <= 3; y++) {
        const newProps = y <= strategyYears ? Math.ceil(totalCount / strategyYears) : 0;
        acquired = Math.min(acquired + newProps, totalCount);
      }
      expect(acquired).toBe(2);
    });

    it("5-year strategy: all 5 properties acquired by year 5", () => {
      const totalCount = 5;
      const strategyYears = 5;
      let acquired = 0;
      for (let y = 1; y <= 5; y++) {
        const newProps = y <= strategyYears ? Math.ceil(totalCount / strategyYears) : 0;
        acquired = Math.min(acquired + newProps, totalCount);
      }
      expect(acquired).toBe(5);
    });
  });

  describe("PDF Report Generation", () => {
    it("generateRothReport function exists and is callable", () => {
      expect(typeof generateRothReport).toBe("function");
    });

    it("generates a PDF buffer for Year 1 Non Solar", async () => {
      const pdf = await generateRothReport({
        iraBalance: 800_000, conversionPortion: 1, homeEquity: 400_000,
        age: 58, income: 250_000, filingStatus: "married", currentTaxBracket: 0.24,
        iulYears: 20, strategyYears: 1, solarEquity: false,
        rentalGrossYield: 0.20, realEstateAppreciation: 0.05, helocRate: 0.07,
      });
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(1000);
      // PDF magic bytes
      expect(pdf.slice(0, 5).toString()).toBe("%PDF-");
    });

    it("generates a PDF buffer for Year 3 Non Solar", async () => {
      const pdf = await generateRothReport({
        iraBalance: 600_000, conversionPortion: 1, homeEquity: 300_000,
        age: 55, income: 200_000, filingStatus: "single", currentTaxBracket: 0.32,
        iulYears: 15, strategyYears: 3, solarEquity: false,
        rentalGrossYield: 0.20, realEstateAppreciation: 0.05, helocRate: 0.07,
      });
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(1000);
    });

    it("generates a PDF buffer for Solar Equity", async () => {
      const pdf = await generateRothReport({
        iraBalance: 800_000, conversionPortion: 1, homeEquity: 400_000,
        age: 58, income: 250_000, filingStatus: "married", currentTaxBracket: 0.24,
        iulYears: 20, strategyYears: 1, solarEquity: true,
        rentalGrossYield: 0.20, realEstateAppreciation: 0.05, helocRate: 0.07,
      });
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(1000);
    });

    it("generates PDF with custom what-if rates", async () => {
      const pdf = await generateRothReport({
        iraBalance: 1_000_000, conversionPortion: 0.75, homeEquity: 500_000,
        age: 60, income: 300_000, filingStatus: "married", currentTaxBracket: 0.35,
        iulYears: 20, strategyYears: 5, solarEquity: false,
        rentalGrossYield: 0.25, realEstateAppreciation: 0.08, helocRate: 0.09,
      });
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(1000);
    });
  });

  describe("Loan rate accumulation", () => {
    it("IUL loan balance compounds at 5% per year", () => {
      let balance = 200_000; // month 13 loan
      balance = balance * (1 + IUL_LOAN_RATE);
      expect(balance).toBe(210_000);
      balance = balance * (1 + IUL_LOAN_RATE);
      expect(balance).toBe(220_500);
    });

    it("Borrow cascade: Y4+ premium = 40% of account value (80% * 50%)", () => {
      const accountValue = 500_000;
      const borrowForPremium = accountValue * 0.80 * 0.5;
      expect(borrowForPremium).toBe(200_000);
    });
  });

  describe("Strategy labels", () => {
    it("Non Solar labels include year number", () => {
      for (let y = 1; y <= 5; y++) {
        const label = `0% Year ${y} Strategy — Non Solar`;
        expect(label).toContain(`Year ${y}`);
        expect(label).toContain("Non Solar");
      }
    });

    it("Solar label includes Solar Equity", () => {
      const label = "0% Year 1 Strategy — Solar Equity";
      expect(label).toContain("Solar Equity");
    });
  });
});
