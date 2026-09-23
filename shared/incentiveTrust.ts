// ============================================================
// INCENTIVE TRUST PROJECTION — /portal/incentive-trust
//
// Why: the "50-Year Beneficiary Outcome Projection" was a fixed six-point
// array (100,000 → 350,000) that no input touched; the radar chart scored the
// categories 80/70/90/85/75 and the pie split them 30/25/20/15/10 from
// nothing. The provision fields were free text that fed no number.
//
// What this computes: a trust funded today, growing at the client's assumed
// net return, paying a trustee fee on the balance each year, and making the
// distributions the provisions call for:
//   • each incentive provision pays a fixed annual amount (optionally rising
//     with the client's assumed inflation) between a start and an end year;
//   • the matching-distribution program pays a percentage of the
//     beneficiary's earned income, a common incentive-trust design;
//   • a distribution is never more than the balance; when the trust runs out
//     the year is reported.
//
// Every rate here is the user's assumption. Trust income tax is NOT modelled:
// compressed trust brackets depend on how much income is distributed (DNI),
// which this projection does not track. The result says so.
//
// PORT STEPS: pure module, no imports. Test: server/a25Calculators.test.ts.
// ============================================================

export interface IncentiveProvision {
  id: string;
  category: string;
  annualAmount: number;
  startYear: number;
  endYear: number;
}

export interface IncentiveTrustInput {
  funding: number;
  /** Net annual return, decimal (client assumption). */
  assumedReturn: number;
  /** Trustee fee as a share of the balance, decimal. */
  trusteeFeeRate: number;
  /** Annual increase in provision amounts, decimal (client assumption). */
  inflation: number;
  years: number;
  provisions: IncentiveProvision[];
  /** Matching program: share of earned income the trust matches, decimal. */
  matchingRate: number;
  beneficiaryEarnedIncome: number;
  /** Years in which the matching program runs, inclusive. */
  matchingStartYear: number;
  matchingEndYear: number;
}

export interface IncentiveTrustYear {
  year: number;
  startBalance: number;
  growth: number;
  fee: number;
  distributions: Record<string, number>;
  totalDistributed: number;
  endBalance: number;
}

export interface IncentiveTrustResult {
  years: IncentiveTrustYear[];
  totalsByCategory: { category: string; total: number }[];
  totalDistributed: number;
  totalFees: number;
  endingBalance: number;
  /** First year a scheduled distribution could not be paid in full, or null. */
  depletedInYear: number | null;
  notes: string[];
}

const r0 = (n: number) => Math.round(n);

export function projectIncentiveTrust(input: IncentiveTrustInput): IncentiveTrustResult {
  const years = Math.max(0, Math.min(50, Math.round(input.years)));
  let balance = Math.max(0, input.funding);
  const out: IncentiveTrustYear[] = [];
  const totals = new Map<string, number>();
  let totalFees = 0;
  let depletedInYear: number | null = null;

  for (let y = 1; y <= years; y++) {
    const start = balance;
    const growth = start * input.assumedReturn;
    const fee = Math.max(0, start * Math.max(0, input.trusteeFeeRate));
    balance = start + growth - fee;
    totalFees += fee;

    const scheduled: [string, number][] = [];
    for (const p of input.provisions) {
      if (y >= p.startYear && y <= p.endYear && p.annualAmount > 0) {
        scheduled.push([p.category, p.annualAmount * Math.pow(1 + input.inflation, y - 1)]);
      }
    }
    if (input.matchingRate > 0 && y >= input.matchingStartYear && y <= input.matchingEndYear) {
      scheduled.push(["Matching", Math.max(0, input.beneficiaryEarnedIncome) * input.matchingRate * Math.pow(1 + input.inflation, y - 1)]);
    }
    const want = scheduled.reduce((s, [, a]) => s + a, 0);
    const available = Math.max(0, balance);
    const scale = want > available ? (want > 0 ? available / want : 0) : 1;
    if (scale < 1 && depletedInYear === null) depletedInYear = y;

    const distributions: Record<string, number> = {};
    let paid = 0;
    for (const [cat, amt] of scheduled) {
      const a = amt * scale;
      distributions[cat] = r0((distributions[cat] ?? 0) + a);
      totals.set(cat, (totals.get(cat) ?? 0) + a);
      paid += a;
    }
    balance -= paid;
    out.push({ year: y, startBalance: r0(start), growth: r0(growth), fee: r0(fee), distributions, totalDistributed: r0(paid), endBalance: r0(balance) });
  }

  const totalsByCategory = Array.from(totals.entries()).map(([category, total]) => ({ category, total: r0(total) }));
  const notes = [
    "Return, fee, inflation and income figures are the client's own assumptions, not forecasts.",
    "Trust income tax is not modelled: compressed trust brackets apply to income the trust retains, which depends on distributions (DNI).",
    "Whether a condition is met is the trustee's determination; the projection assumes every scheduled distribution is earned.",
  ];
  if (depletedInYear !== null) notes.unshift(`The trust cannot pay every scheduled distribution from year ${depletedInYear}; payments are scaled down to the balance.`);
  return {
    years: out,
    totalsByCategory,
    totalDistributed: r0(totalsByCategory.reduce((s, c) => s + c.total, 0)),
    totalFees: r0(totalFees),
    endingBalance: r0(balance),
    depletedInYear,
    notes,
  };
}

export const INCENTIVE_TRUST_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "All rates are client assumptions entered on the page; this projection carries no published figure." },
  { label: "Uniform Trust Code §§411, 502, 814 (modification, spendthrift provisions, trustee discretion) — legal framework only, no numbers", asOf: "cited 2026-09-23; adoption varies by state" },
];
