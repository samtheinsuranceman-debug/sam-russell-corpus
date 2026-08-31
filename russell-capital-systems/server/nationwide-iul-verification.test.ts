/**
 * A Mutual Life Accumulator III Rate Verification Test
 * 
 * Tests the full Roth + IUL + STR strategy pipeline with realistic client numbers
 * to verify the A Mutual Life Accumulator III rates (from sample illustration)
 * produce expected cash values at 12% annual growth.
 */

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): { ctx: TrpcContext } {
  const user = {
    id: 1, openId: "test-advisor", email: "advisor@russellcapital.com",
    name: "Test Advisor", loginMethod: "manus" as const, role: "admin" as const,
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: { origin: "https://test.russellcapital.com" } } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

describe("A Mutual Life Accumulator III — IUL Rate Verification", () => {

  describe("Standalone IUL Projection (strategy.iulProjection)", () => {
    it("produces correct 20-year projection at $100K/year premium, 12% growth", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.strategy.iulProjection({
        annualPremium: 100000, years: 20, creditRate: 0.12,
      });

      expect(result.rows).toHaveLength(20);
      expect(result.terminalCashValue).toBeGreaterThan(0);

      // Year 1: 8% load
      expect(result.rows[0].premiumLoad).toBe(8000);
      // Year 2-5: 6% load
      expect(result.rows[1].premiumLoad).toBe(6000);
      expect(result.rows[4].premiumLoad).toBe(6000);
      // Year 6+: no premium
      expect(result.rows[5].premium).toBe(0);
      expect(result.rows[5].premiumLoad).toBe(0);

      // Cash value growth
      expect(result.rows[14].cashValue).toBeGreaterThan(result.rows[9].cashValue);
      expect(result.rows[19].cashValue).toBeGreaterThan(result.rows[14].cashValue);
      expect(result.terminalCashValue).toBeGreaterThan(500000);

      // Conditional credit from year 11
      expect(result.rows[9].conditionalCredit).toBe(0);
      expect(result.rows[10].conditionalCredit).toBeGreaterThan(0);

      // Per-unit cost stops after year 10
      expect(result.rows[9].perUnitCost).toBeGreaterThan(0);
      expect(result.rows[10].perUnitCost).toBe(0);

      // Surrender charges gone by year 11
      expect(result.rows[0].surrenderCharge).toBeGreaterThan(0);
      expect(result.rows[10].surrenderCharge).toBe(0);

      console.log("\n=== Standalone IUL Projection (20yr, $100K/yr, 12% growth) ===");
      console.log(`Total Premiums Paid: $${(100000 * 5).toLocaleString()}`);
      for (const y of [4, 9, 14, 19]) {
        console.log(`Year ${y+1} Cash Value: $${result.rows[y].cashValue.toLocaleString()}`);
      }
      console.log(`Terminal Cash Value: $${result.terminalCashValue.toLocaleString()}`);
    });

    it("charge structure matches A Mutual Life Accumulator III architecture", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.strategy.iulProjection({
        annualPremium: 50000, years: 15, creditRate: 0.12,
      });

      // Tiered premium loads
      expect(result.rows[0].premiumLoad).toBe(4000);
      expect(result.rows[1].premiumLoad).toBe(3000);
      expect(result.rows[4].premiumLoad).toBe(3000);

      // Surrender charges: 37.6% of $50K = $18,800
      expect(result.rows[0].surrenderCharge).toBe(18800);  // Y1: flat 37.6%
      expect(result.rows[2].surrenderCharge).toBe(18800);  // Y3: flat 37.6%
      // Y4: linear decline starts → (7/7)*18800 = 18800 (still full)
      // Y5: (6/7)*18800 = ~16114
      expect(result.rows[4].surrenderCharge).toBeLessThan(18800); // Y5 starts declining
      expect(result.rows[4].surrenderCharge).toBeGreaterThan(0);
      expect(result.rows[10].surrenderCharge).toBe(0);  // Y11: zero

      console.log("\n=== Charge Structure ($50K/yr, 15yr) ===");
      for (let i = 0; i < 12; i++) {
        const r = result.rows[i];
        console.log(`Y${r.year}: Load=$${r.premiumLoad} | COI=$${r.coiCharge} | PerUnit=$${r.perUnitCost} | SurrChg=$${r.surrenderCharge} | CondCredit=$${r.conditionalCredit} | CV=$${r.cashValue.toLocaleString()} | SV=$${r.surrenderValue.toLocaleString()}`);
      }
    });
  });

  describe("Full Roth + IUL + STR Strategy (rothConversion.project)", () => {
    it("produces complete strategy for $800K IRA, 1-year non-solar", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rothConversion.project({
        iraBalance: 800000, conversionPortion: 1.0, homeEquity: 400000,
        age: 52, income: 350000, filingStatus: "married", currentTaxBracket: 0.24,
        rentalGrossYield: 0.20, realEstateAppreciation: 0.05, helocRate: 0.07,
        iulYears: 20, mortgageRate: 0.065, strategyYears: 1, solarEquity: false,
      });

      expect(result.strategyLabel).toContain("Non Solar");
      expect(result.strategy.conversionAmount).toBe(800000);
      expect(result.strategy.taxSavings).toBe(400000);
      expect(result.strategy.halfTaxSavings).toBe(200000);
      expect(result.strategy.targetPropertyPrice).toBe(2000000);
      expect(result.strategy.totalPropertyCount).toBe(1);
      expect(result.strategy.downPayment).toBe(600000);
      expect(result.strategy.mortgageAmount).toBe(1400000);
      expect(result.strategy.year1Premium).toBe(200000);
      expect(result.strategy.year2Premium).toBe(200000);
      expect(result.strategy.month13PolicyLoan).toBe(200000);

      expect(result.iulParams.loadFee).toBe(0.08);
      expect(result.iulParams.loanRate).toBe(0.05);
      expect(result.iulParams.avgReturn).toBe(0.12);
      expect(result.iulParams.coiRate).toBe(0.008);

      expect(result.iulProjection).toHaveLength(20);
      expect(result.iulProjection[0].premium).toBe(200000);
      expect(result.iulProjection[0].premiumSource).toContain("Half of Tax Savings");
      expect(result.iulProjection[1].policyLoanTaken).toBe(200000);
      expect(result.iulProjection[2].policyLoanTaken).toBeGreaterThan(0);

      expect(result.iulProjection[9].endingAccountValue).toBeGreaterThan(result.iulProjection[4].endingAccountValue);
      expect(result.iulProjection[19].endingAccountValue).toBeGreaterThan(result.iulProjection[14].endingAccountValue);

      expect(result.strProjection).toHaveLength(20);
      expect(result.strProjection[0].propertiesOwned).toBe(1);
      expect(result.strProjection[19].propertyValue).toBeGreaterThan(2000000);

      expect(result.rothProjection).toHaveLength(20);
      expect(result.rothProjection[0].balance).toBeGreaterThan(800000);

      expect(result.summary.finalAccountValue).toBeGreaterThan(0);
      expect(result.summary.totalRentalIncome).toBeGreaterThan(0);
      expect(result.summary.finalPropertyValue).toBeGreaterThan(2000000);
      expect(result.summary.finalRothBalance).toBeGreaterThan(800000);

      // Print detailed report
      console.log("\n" + "=".repeat(120));
      console.log("FULL ROTH + IUL + STR — $800K IRA, Age 52, Married, 1-Year Non-Solar");
      console.log("A Mutual Life Indexed UL Accumulator III @ 12% Annual Growth");
      console.log("=".repeat(120));
      console.log(`\nStrategy: ${result.strategyLabel}`);
      console.log(`IRA Conversion: $${result.strategy.conversionAmount.toLocaleString()}`);
      console.log(`Tax Savings: $${result.strategy.taxSavings.toLocaleString()}`);
      console.log(`STR Property: $${result.strategy.targetPropertyPrice.toLocaleString()}`);
      console.log(`Down Payment: $${result.strategy.downPayment.toLocaleString()}`);
      console.log(`Mortgage: $${result.strategy.mortgageAmount.toLocaleString()}`);
      console.log(`IUL Y1/Y2 Premium: $${result.strategy.year1Premium.toLocaleString()} / $${result.strategy.year2Premium.toLocaleString()}`);
      console.log(`Month 13 Policy Loan: $${result.strategy.month13PolicyLoan.toLocaleString()}`);

      console.log("\n--- IUL Projection (20 Years) ---");
      console.log("Year | Premium    | Load     | COI      | Interest   | Loan Taken | Loan Bal   | Acct Value   | Net Cash");
      for (const r of result.iulProjection) {
        console.log(`Y${String(r.year).padStart(2)}  | $${String(r.premium).padStart(8)} | $${String(r.loadFee).padStart(6)} | $${String(r.coiCost).padStart(6)} | $${String(r.interestEarned).padStart(8)} | $${String(r.policyLoanTaken).padStart(8)} | $${String(r.cumulativeLoanBalance).padStart(8)} | $${String(r.endingAccountValue).padStart(10)} | $${String(r.netCashValue).padStart(10)}`);
      }

      console.log("\n--- STR Property Projection (20 Years) ---");
      console.log("Year | Props | Prop Value     | Rental Inc   | I/O Payment  | Net CF       | Equity");
      for (const r of result.strProjection) {
        console.log(`Y${String(r.year).padStart(2)}  | ${r.propertiesOwned}     | $${String(r.propertyValue).padStart(12)} | $${String(r.rentalIncome).padStart(10)} | $${String(r.interestOnlyPayment).padStart(10)} | $${String(r.netCashFlow).padStart(10)} | $${String(r.propertyEquity).padStart(10)}`);
      }

      console.log("\n--- Roth Projection (20 Years @ 5%) ---");
      for (const r of result.rothProjection) {
        console.log(`Y${String(r.year).padStart(2)}: $${r.balance.toLocaleString()}`);
      }

      console.log("\n--- 20-Year Summary ---");
      console.log(`Final IUL Account Value: $${result.summary.finalAccountValue.toLocaleString()}`);
      console.log(`Final IUL Net Cash Value: $${result.summary.finalNetCashValue.toLocaleString()}`);
      console.log(`Final IUL Loan Balance: $${result.summary.finalLoanBalance.toLocaleString()}`);
      console.log(`Total Premiums Paid: $${result.summary.totalPremiumsPaid.toLocaleString()}`);
      console.log(`STR Principal Payments: $${result.summary.strPrincipalPayments.toLocaleString()}`);
      console.log(`Total Rental Income: $${result.summary.totalRentalIncome.toLocaleString()}`);
      console.log(`Final Property Value: $${result.summary.finalPropertyValue.toLocaleString()}`);
      console.log(`Final Property Equity: $${result.summary.finalPropertyEquity.toLocaleString()}`);
      console.log(`Final Roth Balance: $${result.summary.finalRothBalance.toLocaleString()}`);

      const totalWealth = result.summary.finalNetCashValue + result.summary.finalPropertyEquity + result.summary.finalRothBalance;
      console.log(`\n*** TOTAL WEALTH AT YEAR 20: $${totalWealth.toLocaleString()} ***`);
      console.log(`*** INITIAL INVESTMENT: $800,000 IRA + $400,000 Home Equity ***`);
      console.log(`*** WEALTH MULTIPLIER: ${(totalWealth / 1200000).toFixed(2)}x ***`);
    });

    it("produces correct strategy for 3-year multi-property plan", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rothConversion.project({
        iraBalance: 1200000, conversionPortion: 1.0, homeEquity: 600000,
        age: 48, income: 500000, filingStatus: "married", currentTaxBracket: 0.32,
        rentalGrossYield: 0.20, realEstateAppreciation: 0.05, helocRate: 0.07,
        iulYears: 20, mortgageRate: 0.065, strategyYears: 3, solarEquity: false,
      });

      expect(result.strategy.totalPropertyCount).toBe(3);
      expect(result.strategy.targetPropertyPrice).toBe(3000000);
      expect(result.strategy.perPropertyPrice).toBe(1000000);
      expect(result.strProjection[0].propertiesOwned).toBe(1);
      expect(result.strProjection[1].propertiesOwned).toBe(2);
      expect(result.strProjection[2].propertiesOwned).toBe(3);
      expect(result.strProjection[3].newPropertyAcquired).toBe(false);

      console.log("\n=== 3-YEAR MULTI-PROPERTY — $1.2M IRA, Age 48 ===");
      console.log(`Properties: ${result.strategy.totalPropertyCount} @ $${result.strategy.perPropertyPrice.toLocaleString()}`);
      console.log(`Final IUL AV: $${result.summary.finalAccountValue.toLocaleString()}`);
      console.log(`Final Property Value: $${result.summary.finalPropertyValue.toLocaleString()}`);
      console.log(`Final Roth: $${result.summary.finalRothBalance.toLocaleString()}`);
      const tw = result.summary.finalNetCashValue + result.summary.finalPropertyEquity + result.summary.finalRothBalance;
      console.log(`Total Wealth at Year 20: $${tw.toLocaleString()}`);
    });

    it("produces correct strategy with solar equity enhancement", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rothConversion.project({
        iraBalance: 600000, conversionPortion: 1.0, homeEquity: 300000,
        age: 55, income: 280000, filingStatus: "married", currentTaxBracket: 0.24,
        rentalGrossYield: 0.20, realEstateAppreciation: 0.05, helocRate: 0.07,
        iulYears: 20, mortgageRate: 0.065, strategyYears: 1, solarEquity: true,
      });

      expect(result.strategyLabel).toContain("Solar");
      expect(result.strategy.solarEnhancement).toBe(132000);
      expect(result.strategy.year1Premium).toBe(132000);
      expect(result.iulProjection[0].premiumSource).toContain("Solar");

      console.log("\n=== SOLAR EQUITY — $600K IRA, Age 55 ===");
      console.log(`Solar Enhancement: $${result.strategy.solarEnhancement.toLocaleString()}`);
      console.log(`Final IUL AV: $${result.summary.finalAccountValue.toLocaleString()}`);
      console.log(`Final Roth: $${result.summary.finalRothBalance.toLocaleString()}`);
    });

    it("carrier overrides correctly replace A Mutual Life defaults", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const pacificResult = await caller.rothConversion.project({
        iraBalance: 800000, conversionPortion: 1.0, homeEquity: 400000,
        age: 52, income: 350000, filingStatus: "married", currentTaxBracket: 0.24,
        iulYears: 20, strategyYears: 1, solarEquity: false,
        carrierId: "aaa-plus-mutual", carrierLoadFee: 0.055, carrierCoiRate: 0.04,
        carrierLoanRate: 0.05, carrierAvgReturn: 0.08,
      });

      expect(pacificResult.iulParams.loadFee).toBe(0.055);
      expect(pacificResult.iulParams.avgReturn).toBe(0.08);

      const aMutualResult = await caller.rothConversion.project({
        iraBalance: 800000, conversionPortion: 1.0, homeEquity: 400000,
        age: 52, income: 350000, filingStatus: "married", currentTaxBracket: 0.24,
        iulYears: 20, strategyYears: 1, solarEquity: false,
      });

      expect(aMutualResult.summary.finalAccountValue).toBeGreaterThan(pacificResult.summary.finalAccountValue);

      console.log("\n=== CARRIER COMPARISON — A Mutual Life 12% vs AAA+ Mutual 8% ===");
      console.log(`A Mutual Life Final IUL AV: $${aMutualResult.summary.finalAccountValue.toLocaleString()}`);
      console.log(`AAA+ Mutual Final IUL AV: $${pacificResult.summary.finalAccountValue.toLocaleString()}`);
      console.log(`Difference: $${(aMutualResult.summary.finalAccountValue - pacificResult.summary.finalAccountValue).toLocaleString()}`);
    });
  });

  describe("Rate Sanity Checks", () => {
    it("$600K annual premium for 5 years at 12% produces expected growth multiple", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.strategy.iulProjection({
        annualPremium: 600000, years: 30, creditRate: 0.12,
      });

      const totalPremiums = result.rows.reduce((s, r) => s + r.premium, 0);
      expect(totalPremiums).toBe(3000000);
      expect(result.terminalCashValue).toBeGreaterThan(totalPremiums * 3);
      expect(result.rows[0].premiumLoad).toBe(48000);
      expect(result.rows[1].premiumLoad).toBe(36000);

      console.log("\n=== $600K/yr PREMIUM (30yr @ 12%) ===");
      console.log(`Total Premiums: $${totalPremiums.toLocaleString()}`);
      for (const y of [9, 19, 29]) {
        console.log(`Year ${y+1} CV: $${result.rows[y].cashValue.toLocaleString()}`);
      }
      console.log(`Terminal CV: $${result.terminalCashValue.toLocaleString()}`);
      console.log(`Growth Multiple: ${(result.terminalCashValue / totalPremiums).toFixed(2)}x`);
    });

    it("interest earned is consistently 12% of after-charges value", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.strategy.iulProjection({
        annualPremium: 100000, years: 10, creditRate: 0.12,
      });

      console.log("\n--- Interest Rate Verification ---");
      for (const r of result.rows) {
        const afterCharges = r.cashValue - r.interestEarned;
        const impliedRate = afterCharges > 0 ? r.interestEarned / afterCharges : 0;
        console.log(`Y${r.year}: Interest=$${r.interestEarned.toLocaleString()} | CV=$${r.cashValue.toLocaleString()} | Implied Rate=${(impliedRate * 100).toFixed(2)}%`);
        if (afterCharges > 1000) {
          expect(impliedRate).toBeGreaterThan(0.119);
          expect(impliedRate).toBeLessThan(0.121);
        }
      }
    });
  });
});
