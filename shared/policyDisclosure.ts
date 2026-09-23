/**
 * Policy disclosure — one line naming the product an engine's mechanics run on.
 *
 * The engines are mechanics, not illustrations: they show an account value
 * compounding at a rate the visitor sets and the share of it deployed to the
 * next phase. NAIC AG 49-A governs illustrations and does not cap them. The
 * state advertising rules do reach them: most states have adopted the NAIC
 * Advertisements of Life Insurance and Annuities Model Regulation (Model 570),
 * which asks that material promoting a policy name it as life insurance (or
 * an annuity) rather than only as an account. So every engine that runs on a
 * policy carries this one line, from here, the same on every page. The
 * animation, the rates and the deployment math are untouched.
 *
 * Owner's decision, 23 Sep 2026: drop the "AG 49 max 7.5%" label, call the
 * rate an assumed crediting rate, and add this line.
 */

export type PolicyKind = "life" | "annuity";

export const ASSUMED_RATE_LABEL = "Assumed crediting rate";

export const POLICY_DISCLOSURE: Record<PolicyKind, string> = {
  life:
    "This engine models the cash value of a permanent life insurance policy. The crediting rate is an assumption you set, not a guarantee.",
  annuity:
    "This engine models an annuity contract issued by an insurance company. Rates shown are assumptions, not guarantees.",
};

/** Routes whose mechanics run on a permanent life insurance policy. */
export const LIFE_POLICY_PATHS: readonly string[] = [
  "/portal/iul-engine",
  "/portal/iul-projection",
  "/portal/iul-historical",
  "/portal/iul-vs-roth",
  "/portal/policy-cost-lab",
  "/portal/policy-review",
  "/portal/policy-loans",
  "/portal/premium-financing",
  "/portal/index-strategies",
  "/portal/mortgage-killer",
  "/portal/mortgage-killer-v3",
  "/portal/household-wealth",
  "/portal/infinite-banking",
  "/portal/mechanism/policy-loan",
  "/portal/divorce-ilit",
  "/portal/roth-conversion",
  "/portal/competitive",
  "/portal/time-machine",
  "/portal/time-machine-ag49",
  "/portal/time-machine-calculator",
  "/portal/time-machine-method",
];

/** Routes whose mechanics run on an annuity contract. */
export const ANNUITY_PATHS: readonly string[] = [
  "/portal/fia-collateral",
  "/portal/fia-top10",
  "/portal/myga-fixed-rate",
  "/portal/myga-waterfall",
  "/portal/annuity-explorer",
  "/portal/income-annuity",
];

/** The policy kind behind a route, or null when the page runs on no policy. */
export function policyKindForPath(path: string): PolicyKind | null {
  const clean = path.split("?")[0]!.replace(/\/+$/, "") || "/";
  if (LIFE_POLICY_PATHS.includes(clean)) return "life";
  if (ANNUITY_PATHS.includes(clean)) return "annuity";
  return null;
}
