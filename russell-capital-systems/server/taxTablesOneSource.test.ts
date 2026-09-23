import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TAX_RULES_2025, TAX_RULES_2026 } from "../shared/taxRules";
import {
  federalBrackets,
  federalStandardDeduction,
  federalTaxOnTaxable,
  federalMarginalRateOnTaxable,
  filingStatusFrom,
  FEDERAL_TAX_YEAR,
} from "../shared/taxBracketEngine";

// One source of truth for the federal tables: shared/taxRules.ts. Pages and
// engines read it through shared/taxBracketEngine.ts; none keeps its own copy.

const ROOT = path.resolve(import.meta.dirname, "..");

/** Past joint threshold sequences that must not reappear as a typed copy. */
const STALE_JOINT_SEQUENCES: Record<string, number[]> = {
  "2024 joint": [23_200, 94_300, 201_050, 383_900, 487_450, 731_200],
  "2025 joint": TAX_RULES_2025.brackets.joint.slice(0, 6).map((b) => b.upTo!),
};

/** The only file that may carry a past year's table: the versioned rule sets. */
const ALLOWED = new Set(["shared/taxRules.ts"]);
/**
 * A file that deliberately keeps a past year's table (a back-test, a "2024
 * example") opts out by saying so: its path names history or a back-test, or
 * it carries the marker comment "tax-history:" with the reason.
 */
const isHistoryLabelled = (rel: string, src: string) =>
  /history|backtest|back-test/i.test(rel) || src.includes("tax-history:");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name) && !/\.(test|spec)\.[jt]sx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Whole numbers in a source, with 1,234 / 1_234 separators removed. */
function numbersIn(src: string): Set<number> {
  const found = new Set<number>();
  for (const m of src.matchAll(/(?<![\d.])\d+(?:[,_]\d{3}(?!\d))*/g)) {
    found.add(Number(m[0].replace(/[,_]/g, "")));
  }
  return found;
}

describe("federal tax tables have one source", () => {
  it("no non-test file under client/src or shared carries the 2024 or 2025 joint thresholds", () => {
    const offenders: string[] = [];
    for (const base of ["client/src", "shared"]) {
      for (const file of sourceFiles(path.join(ROOT, base))) {
        const rel = path.relative(ROOT, file).split(path.sep).join("/");
        if (ALLOWED.has(rel)) continue;
        const src = fs.readFileSync(file, "utf8");
        if (isHistoryLabelled(rel, src)) continue;
        const nums = numbersIn(src);
        for (const [label, seq] of Object.entries(STALE_JOINT_SEQUENCES)) {
          // Three or more of the six thresholds in one file is a typed table (or part of one).
          const hits = seq.filter((n) => nums.has(n));
          if (hits.length >= 3) offenders.push(`${rel}: ${label} thresholds ${hits.join(", ")}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the guard itself catches a typed table in any separator style", () => {
    const seq = STALE_JOINT_SEQUENCES["2024 joint"]!;
    for (const text of [
      "{ min: 23200, max: 94300 }, { min: 94300, max: 201050 }",
      "[23_200, 94_300, 201_050]",
      '"$23,200 / $94,300 / $201,050"',
    ]) {
      const nums = numbersIn(text);
      expect(seq.filter((n) => nums.has(n)).length).toBe(3);
    }
  });

  it("the engine's tables are the current rule set", () => {
    expect(FEDERAL_TAX_YEAR).toBe(TAX_RULES_2026.taxYear);
    for (const [label, key] of [["single", "single"], ["joint", "joint"], ["hoh", "hoh"]] as const) {
      const rows = federalBrackets(label);
      expect(rows.map((r) => (r.max === Infinity ? null : r.max))).toEqual(TAX_RULES_2026.brackets[key].map((b) => b.upTo));
      expect(rows.map((r) => r.rate)).toEqual(TAX_RULES_2026.brackets[key].map((b) => b.rate));
      expect(rows[0]!.min).toBe(0);
      for (let i = 1; i < rows.length; i++) expect(rows[i]!.min).toBe(rows[i - 1]!.max);
      expect(federalStandardDeduction(label)).toBe(TAX_RULES_2026.standardDeduction[key]);
    }
  });

  it("reads each page's own filing wording", () => {
    expect(filingStatusFrom("married")).toBe("joint");
    expect(filingStatusFrom("married_filing_jointly")).toBe("joint");
    expect(filingStatusFrom("Married Filing Jointly")).toBe("joint");
    expect(filingStatusFrom("headOfHousehold")).toBe("hoh");
    expect(filingStatusFrom("head_of_household")).toBe("hoh");
    expect(filingStatusFrom("married_filing_separately")).toBe("single");
    expect(filingStatusFrom("single")).toBe("single");
  });

  it("tax and marginal rate on taxable income follow the 2026 joint table", () => {
    // 24,800 x 10% + 76,000 x 12% + 99,200 x 22% (to 200,000) = 2,480 + 9,120 + 21,824
    expect(federalTaxOnTaxable(200_000, "joint")).toBeCloseTo(33_424, 6);
    expect(federalMarginalRateOnTaxable(200_000, "joint")).toBe(0.22);
    expect(federalMarginalRateOnTaxable(211_401, "joint")).toBe(0.24);
    expect(federalMarginalRateOnTaxable(0, "joint")).toBe(0.10);
    expect(federalTaxOnTaxable(0, "single")).toBe(0);
  });

  it("returns a fresh copy, so a page cannot edit the shared table", () => {
    const a = federalBrackets("joint");
    a[0]!.max = 1;
    expect(federalBrackets("joint")[0]!.max).toBe(TAX_RULES_2026.brackets.joint[0]!.upTo);
  });
});
