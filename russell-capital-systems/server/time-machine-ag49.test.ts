import { describe, it, expect } from "vitest";

/**
 * Time Machine AG49 Calculator — Unit Tests
 *
 * These tests validate the core mathematical engine that powers the
 * Time Machine AG49 page. The engine is a pure client-side function,
 * so we replicate the formulas here to verify correctness.
 */

// ─── REPLICATE THE CORE ENGINE ─────────────────────────────────────────────
// Exact copy of the formulas from TimeMachineAG49.tsx

interface YearRow {
  year: number;
  age: number;
  premiumPaid: number;
  cumulativePremium: number;
  beginningValue: number;
  interestCredit: number;
  endingValue: number;
  effectiveReturnOnPremium: number;
  generationLabel: string;
}

interface BenchmarkResult {
  target: number;
  yearReached: number | null;
  accountValueAtTarget: number;
  interestCreditAtTarget: number;
}

function runSimulation(
  annualPremium: number,
  fundingYears: number,
  creditingRate: number, // decimal
  currentAge: number,
  maxYears: number,
  generationTransfers: { year: number; label: string; newAge: number }[] = [],
) {
  const totalPremiumsPaid = annualPremium * fundingYears;
  const rows: YearRow[] = [];
  let accountValue = 0;
  let cumulativePremium = 0;

  const transfers = [...generationTransfers].sort((a, b) => a.year - b.year);
  const targets = [28, 50, 80];
  const benchmarks: BenchmarkResult[] = targets.map(t => ({
    target: t,
    yearReached: null,
    accountValueAtTarget: 0,
    interestCreditAtTarget: 0,
  }));

  for (let y = 1; y <= maxYears; y++) {
    const premiumThisYear = y <= fundingYears ? annualPremium : 0;
    cumulativePremium += premiumThisYear;

    const beginningValue = accountValue + premiumThisYear;
    const interestCredit = beginningValue * creditingRate;
    const endingValue = beginningValue + interestCredit;

    const effectiveReturn = totalPremiumsPaid > 0
      ? (interestCredit / totalPremiumsPaid) * 100
      : 0;

    let displayAge: number;
    const activeTransfer = transfers.filter(t => t.year <= y).pop();
    if (activeTransfer) {
      displayAge = activeTransfer.newAge + (y - activeTransfer.year);
    } else {
      displayAge = currentAge + y;
    }

    rows.push({
      year: y,
      age: displayAge,
      premiumPaid: premiumThisYear,
      cumulativePremium,
      beginningValue,
      interestCredit,
      endingValue,
      effectiveReturnOnPremium: effectiveReturn,
      generationLabel: activeTransfer?.label || "Original Owner",
    });

    for (const bm of benchmarks) {
      if (bm.yearReached === null && effectiveReturn >= bm.target) {
        bm.yearReached = y;
        bm.accountValueAtTarget = endingValue;
        bm.interestCreditAtTarget = interestCredit;
      }
    }

    accountValue = endingValue;
  }

  return { rows, benchmarks, totalPremiumsPaid };
}

function buildRateComparisonTable(
  annualPremium: number,
  fundingYears: number,
  targets: number[],
  maxYears: number,
) {
  const rates = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5];
  const totalPremiums = annualPremium * fundingYears;

  return rates.map(rPct => {
    const r = rPct / 100;
    let av = 0;
    const results: (number | null)[] = targets.map(() => null);

    for (let y = 1; y <= maxYears; y++) {
      const prem = y <= fundingYears ? annualPremium : 0;
      const bv = av + prem;
      const credit = bv * r;
      av = bv + credit;
      const effReturn = totalPremiums > 0 ? (credit / totalPremiums) * 100 : 0;

      for (let t = 0; t < targets.length; t++) {
        if (results[t] === null && effReturn >= targets[t]) {
          results[t] = y;
        }
      }
    }
    return { rate: rPct, benchmarks: results };
  });
}

// ─── TESTS ─────────────────────────────────────────────────────────────────

describe("Time Machine AG49 — Core Engine", () => {
  describe("Basic simulation with $400K/yr x 5 years at 6.5%", () => {
    const sim = runSimulation(400000, 5, 0.065, 40, 100);

    it("should calculate total premiums correctly", () => {
      expect(sim.totalPremiumsPaid).toBe(2000000);
    });

    it("should have 100 rows", () => {
      expect(sim.rows.length).toBe(100);
    });

    it("should pay premium only in years 1-5", () => {
      for (let i = 0; i < 5; i++) {
        expect(sim.rows[i].premiumPaid).toBe(400000);
      }
      for (let i = 5; i < 100; i++) {
        expect(sim.rows[i].premiumPaid).toBe(0);
      }
    });

    it("should compute year 1 correctly", () => {
      // Year 1: AV starts at 0, add $400K premium, earn 6.5%
      const r1 = sim.rows[0];
      expect(r1.beginningValue).toBe(400000);
      expect(r1.interestCredit).toBe(400000 * 0.065);
      expect(r1.endingValue).toBe(400000 * 1.065);
      expect(r1.effectiveReturnOnPremium).toBeCloseTo((400000 * 0.065) / 2000000 * 100, 4);
    });

    it("should compound correctly through year 2", () => {
      const r1 = sim.rows[0];
      const r2 = sim.rows[1];
      // Year 2: start with year 1 ending + $400K premium
      expect(r2.beginningValue).toBeCloseTo(r1.endingValue + 400000, 2);
      expect(r2.interestCredit).toBeCloseTo(r2.beginningValue * 0.065, 2);
      expect(r2.endingValue).toBeCloseTo(r2.beginningValue * 1.065, 2);
    });

    it("should stop adding premium after funding years", () => {
      const r5 = sim.rows[4]; // Year 5 (last funding year)
      const r6 = sim.rows[5]; // Year 6 (first growth-only year)
      expect(r6.beginningValue).toBeCloseTo(r5.endingValue, 2);
      expect(r6.premiumPaid).toBe(0);
    });

    it("should reach 28% effective return", () => {
      const bm28 = sim.benchmarks.find(b => b.target === 28);
      expect(bm28).toBeDefined();
      expect(bm28!.yearReached).not.toBeNull();
      expect(bm28!.yearReached).toBe(27);
    });

    it("should reach 50% effective return", () => {
      const bm50 = sim.benchmarks.find(b => b.target === 50);
      expect(bm50).toBeDefined();
      expect(bm50!.yearReached).not.toBeNull();
      expect(bm50!.yearReached).toBe(36);
    });

    it("should reach 80% effective return", () => {
      const bm80 = sim.benchmarks.find(b => b.target === 80);
      expect(bm80).toBeDefined();
      expect(bm80!.yearReached).not.toBeNull();
      expect(bm80!.yearReached).toBe(43);
    });

    it("should have interest credit at 28% benchmark equal to ~28% of total premiums", () => {
      const bm28 = sim.benchmarks.find(b => b.target === 28)!;
      const creditPct = (bm28.interestCreditAtTarget / sim.totalPremiumsPaid) * 100;
      expect(creditPct).toBeGreaterThanOrEqual(28);
    });

    it("should have interest credit at 80% benchmark equal to ~80% of total premiums", () => {
      const bm80 = sim.benchmarks.find(b => b.target === 80)!;
      const creditPct = (bm80.interestCreditAtTarget / sim.totalPremiumsPaid) * 100;
      expect(creditPct).toBeGreaterThanOrEqual(80);
    });

    it("should show monotonically increasing effective returns after funding phase", () => {
      for (let i = 6; i < 99; i++) {
        expect(sim.rows[i + 1].effectiveReturnOnPremium).toBeGreaterThan(
          sim.rows[i].effectiveReturnOnPremium
        );
      }
    });

    it("should show monotonically increasing account values", () => {
      for (let i = 0; i < 99; i++) {
        expect(sim.rows[i + 1].endingValue).toBeGreaterThan(sim.rows[i].endingValue);
      }
    });
  });

  describe("Age tracking", () => {
    it("should track age correctly for original owner", () => {
      const sim = runSimulation(100000, 3, 0.05, 35, 10);
      expect(sim.rows[0].age).toBe(36); // age 35 + 1
      expect(sim.rows[9].age).toBe(45); // age 35 + 10
    });
  });

  describe("Generational transfers", () => {
    const sim = runSimulation(400000, 5, 0.065, 40, 100, [
      { year: 35, label: "Surviving Spouse", newAge: 38 },
      { year: 60, label: "Child (Gen 2)", newAge: 30 },
      { year: 85, label: "Grandchild (Gen 3)", newAge: 25 },
    ]);

    it("should label original owner for years 1-34", () => {
      expect(sim.rows[0].generationLabel).toBe("Original Owner");
      expect(sim.rows[33].generationLabel).toBe("Original Owner");
    });

    it("should label surviving spouse for years 35-59", () => {
      expect(sim.rows[34].generationLabel).toBe("Surviving Spouse");
      expect(sim.rows[58].generationLabel).toBe("Surviving Spouse");
    });

    it("should label child for years 60-84", () => {
      expect(sim.rows[59].generationLabel).toBe("Child (Gen 2)");
      expect(sim.rows[83].generationLabel).toBe("Child (Gen 2)");
    });

    it("should label grandchild for years 85-100", () => {
      expect(sim.rows[84].generationLabel).toBe("Grandchild (Gen 3)");
      expect(sim.rows[99].generationLabel).toBe("Grandchild (Gen 3)");
    });

    it("should NOT reset account value at generation transfers", () => {
      // The whole point: account value continues growing, never resets
      expect(sim.rows[34].beginningValue).toBeGreaterThan(sim.rows[33].endingValue * 0.99);
      expect(sim.rows[59].beginningValue).toBeGreaterThan(sim.rows[58].endingValue * 0.99);
      expect(sim.rows[84].beginningValue).toBeGreaterThan(sim.rows[83].endingValue * 0.99);
    });

    it("should update age at generation transfer", () => {
      // Year 35: spouse age 38
      expect(sim.rows[34].age).toBe(38);
      // Year 36: spouse age 39
      expect(sim.rows[35].age).toBe(39);
      // Year 60: child age 30
      expect(sim.rows[59].age).toBe(30);
      // Year 85: grandchild age 25
      expect(sim.rows[84].age).toBe(25);
    });
  });

  describe("Edge cases", () => {
    it("should handle single premium payment", () => {
      const sim = runSimulation(2000000, 1, 0.065, 50, 50);
      expect(sim.totalPremiumsPaid).toBe(2000000);
      expect(sim.rows[0].premiumPaid).toBe(2000000);
      expect(sim.rows[1].premiumPaid).toBe(0);
    });

    it("should handle very low crediting rate (0.1%)", () => {
      const sim = runSimulation(400000, 5, 0.001, 40, 100);
      // At 0.1%, growth is very slow
      expect(sim.rows[99].effectiveReturnOnPremium).toBeLessThan(1);
    });

    it("should handle maximum crediting rate (7.5%)", () => {
      const sim = runSimulation(400000, 5, 0.075, 40, 100);
      // At 7.5%, benchmarks should be reached faster
      const bm28 = sim.benchmarks.find(b => b.target === 28)!;
      expect(bm28.yearReached).toBeLessThan(27); // faster than 6.5%
    });
  });

  describe("Rate comparison table", () => {
    const table = buildRateComparisonTable(400000, 5, [28, 50, 80], 100);

    it("should have 16 rate entries", () => {
      expect(table.length).toBe(16);
    });

    it("should have rates from 0.1% to 7.5%", () => {
      expect(table[0].rate).toBe(0.1);
      expect(table[table.length - 1].rate).toBe(7.5);
    });

    it("should show higher rates reaching targets faster", () => {
      // 7.5% should reach 28% faster than 6.5%
      const r65 = table.find(r => r.rate === 6.5)!;
      const r75 = table.find(r => r.rate === 7.5)!;
      if (r65.benchmarks[0] !== null && r75.benchmarks[0] !== null) {
        expect(r75.benchmarks[0]).toBeLessThan(r65.benchmarks[0]);
      }
    });

    it("should show 80% target takes longer than 50% which takes longer than 28%", () => {
      const r65 = table.find(r => r.rate === 6.5)!;
      if (r65.benchmarks[0] !== null && r65.benchmarks[1] !== null && r65.benchmarks[2] !== null) {
        expect(r65.benchmarks[0]).toBeLessThan(r65.benchmarks[1]);
        expect(r65.benchmarks[1]).toBeLessThan(r65.benchmarks[2]);
      }
    });

    it("should return null for targets not reachable within maxYears at low rates", () => {
      const r01 = table.find(r => r.rate === 0.1)!;
      // At 0.1% over 100 years, 28% effective return is very unlikely
      expect(r01.benchmarks[0]).toBeNull();
    });

    it("should match simulation results for 6.5%", () => {
      const r65 = table.find(r => r.rate === 6.5)!;
      const sim = runSimulation(400000, 5, 0.065, 40, 100);
      const bm28 = sim.benchmarks.find(b => b.target === 28)!;
      expect(r65.benchmarks[0]).toBe(bm28.yearReached);
    });
  });

  describe("Formula verification", () => {
    it("should satisfy: effectiveReturn = (AV * R) / totalPremiums * 100 for every row", () => {
      const sim = runSimulation(400000, 5, 0.065, 40, 50);
      for (const row of sim.rows) {
        const expected = (row.interestCredit / sim.totalPremiumsPaid) * 100;
        expect(row.effectiveReturnOnPremium).toBeCloseTo(expected, 8);
      }
    });

    it("should satisfy: interestCredit = beginningValue * rate for every row", () => {
      const sim = runSimulation(400000, 5, 0.065, 40, 50);
      for (const row of sim.rows) {
        expect(row.interestCredit).toBeCloseTo(row.beginningValue * 0.065, 2);
      }
    });

    it("should satisfy: endingValue = beginningValue + interestCredit for every row", () => {
      const sim = runSimulation(400000, 5, 0.065, 40, 50);
      for (const row of sim.rows) {
        expect(row.endingValue).toBeCloseTo(row.beginningValue + row.interestCredit, 2);
      }
    });

    it("Rule of 72 approximation: account should roughly double every 72/rate years after funding", () => {
      const rate = 6.5;
      const doublingYears = 72 / rate; // ~11.08 years
      const sim = runSimulation(400000, 5, rate / 100, 40, 50);
      // Compare year 6 (first growth year) to year 6 + doublingYears
      const y6 = sim.rows[5].endingValue;
      const yDouble = sim.rows[5 + Math.round(doublingYears)]?.endingValue;
      if (yDouble) {
        const ratio = yDouble / y6;
        // Should be approximately 2x (within 10% tolerance)
        expect(ratio).toBeGreaterThan(1.8);
        expect(ratio).toBeLessThan(2.2);
      }
    });
  });
});
