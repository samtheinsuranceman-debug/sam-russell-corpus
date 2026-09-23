/**
 * Which calculators are predictive, and which forecast domain each one lives in.
 *
 * The owner's rule (23 Sep 2026): a predictive engine and an optional toggle
 * on every calculator. "Every" is read off the catalogue by category, minus
 * the pages that look things up rather than project (ratings, quotes, readers,
 * document generators, desks and how-it-works pages). The app shell mounts the
 * predictive footer on every path this module returns a domain for, so a new
 * catalogue row is predictive by default and a lookup page opts out here.
 */
import { CALCULATORS, type CalculatorCategory } from "./calculatorCatalog";
import type { ForecastDomain } from "./forecastOverlay";

/** The forecast domain a category's projections move with. Absent: not predictive. */
export const PREDICTIVE_DOMAIN_BY_CATEGORY: Partial<Record<CalculatorCategory, ForecastDomain>> = {
  "retirement-income": "equities",
  tax: "inflation",
  insurance: "equities",
  "real-estate": "housing",
  "estate-legacy": "equities",
  business: "wages",
  "life-events": "equities",
  markets: "equities",
};

/** Pages inside a predictive category that look up, read or explain rather than project. */
export const NON_PREDICTIVE_PATHS: ReadonlySet<string> = new Set([
  "/portal/carrier-ratings",
  "/portal/carrier-comparison",
  "/portal/quick-quote",
  "/portal/policy-review",
  "/portal/tax-return-upload",
  "/portal/tax-brackets",
  "/portal/tax-schedule",
  "/portal/estate-document-gen",
  "/portal/real-estate",
  "/portal/mechanisms",
  "/portal/market-pulse",
  "/portal/crypto-corner",
  "/portal/career-path",
]);

/** Per-page overrides where the category's domain is the wrong one. */
const DOMAIN_OVERRIDES: Record<string, ForecastDomain> = {
  "/portal/inflation": "inflation",
  "/portal/erosion": "inflation",
  "/portal/myga-fixed-rate": "rates",
  "/portal/myga-waterfall": "rates",
  "/portal/policy-loans": "rates",
  "/portal/premium-financing": "rates",
  "/portal/fia-collateral": "rates",
  "/portal/alt-credit": "rates",
  "/portal/liquidity-routes": "rates",
  "/portal/reverse-heloc": "rates",
  "/portal/mortgage-ledger": "rates",
  "/portal/income-annuity": "rates",
  "/portal/lifetime-income": "rates",
  "/portal/social-security": "inflation",
  "/portal/medicare-irmaa": "inflation",
  "/portal/long-term-care": "inflation",
  "/portal/physicians-edge": "wages",
  "/portal/business-owner": "wages",
  "/portal/succession-planning": "equities",
};

/** The forecast domain for a route, or null when the page is not predictive. */
export function predictiveDomainFor(path: string): ForecastDomain | null {
  const clean = path.split("?")[0]!.replace(/\/$/, "") || "/";
  if (NON_PREDICTIVE_PATHS.has(clean) || clean.startsWith("/portal/mechanism/")) return null;
  const override = DOMAIN_OVERRIDES[clean];
  if (override) return override;
  const entry = CALCULATORS.find(c => c.path === clean);
  if (!entry) return null;
  return PREDICTIVE_DOMAIN_BY_CATEGORY[entry.category] ?? null;
}

/** Every catalogue path that carries the predictive footer. */
export const PREDICTIVE_CALCULATOR_PATHS: readonly string[] = CALCULATORS
  .map(c => c.path)
  .filter(p => predictiveDomainFor(p) !== null);
