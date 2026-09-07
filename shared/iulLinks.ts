// ============================================================
// THE IUL ENGINE'S LINKS — how an indexed universal life policy's crediting
// reads against the other engines. Four joins:
//   1. The tax engine: what a taxable account would have to earn to net the
//      credited rate at the client's marginal rate (tax-equivalent yield).
//   2. The inflation engine: the CPI's year-over-year change beside the
//      backtester's credited rate for the same year, with the correlation
//      and the mean credited rate in high- and low-inflation years. Shown
//      as the record shows it; the page states no causal claim.
//   3. The fiat engine: the same pairing against M2 growth.
//   4. Liquidity: what a policy loan is beside the other ways of reaching
//      money, each with its statute where a statute governs it.
// Plus the note on how the account value is credited when a loan is out,
// in the policy form's own terms, without a "high-water mark" claim.
// ============================================================

/** A taxable account must earn this to net `rate` after tax at the combined marginal rate. */
export function taxEquivalentYield(rate: number, marginalRate: number, stateRate = 0, niitRate = 0): number {
  const t = Math.min(0.95, Math.max(0, marginalRate + stateRate + niitRate));
  return rate / (1 - t);
}

export type YearPair = { year: number; credited: number; cpi: number | null; m2: number | null };

/** Pearson correlation over the pairs where both sides exist; null when fewer than eight years. */
export function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 8) return null;
  const mx = xs.reduce((s, v) => s + v, 0) / n, my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i]! - mx, dy = ys[i]! - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

export type SplitStat = { key: "cpi" | "m2"; median: number; high: { n: number; meanCredited: number; years: number[] }; low: { n: number; meanCredited: number; years: number[] }; correlation: number | null };

/** The credited rate in years when the series was above its median, and when it was below. Arithmetic on the record, no forecast. */
export function splitByMedian(pairs: YearPair[], key: "cpi" | "m2"): SplitStat | null {
  const rows = pairs.filter((p) => p[key] != null) as Array<YearPair & { cpi: number; m2: number }>;
  if (rows.length < 8) return null;
  const sorted = rows.map((r) => r[key]).sort((a, b) => a - b);
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2]! : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2;
  const high = rows.filter((r) => r[key] > median), low = rows.filter((r) => r[key] <= median);
  const mean = (xs: typeof rows) => (xs.length ? xs.reduce((s, r) => s + r.credited, 0) / xs.length : 0);
  return { key, median, high: { n: high.length, meanCredited: mean(high), years: high.map((r) => r.year) }, low: { n: low.length, meanCredited: mean(low), years: low.map((r) => r.year) }, correlation: pearson(rows.map((r) => r[key]), rows.map((r) => r.credited)) };
}

/** December-over-December change per year from monthly observations ("YYYY-MM-DD" → level). */
export function decemberOverDecember(obs: Array<{ date: string; value: number }>): Record<number, number> {
  const dec = new Map<number, number>();
  for (const o of obs) if (/-12-01$/.test(o.date) && Number.isFinite(o.value)) dec.set(Number(o.date.slice(0, 4)), o.value);
  const out: Record<number, number> = {};
  dec.forEach((v, y) => { const prev = dec.get(y - 1); if (prev != null && prev > 0) out[y] = v / prev - 1; });
  return out;
}

export function pairYears(credited: Array<{ year: number; creditedRate: number }>, cpi: Record<number, number>, m2: Record<number, number>): YearPair[] {
  return credited.map((c) => ({ year: c.year, credited: c.creditedRate / 100, cpi: cpi[c.year] ?? null, m2: m2[c.year] ?? null }));
}

/** Liquidity: a policy loan beside the other ways of reaching money. Statutes only where a statute governs; institutional terms are named as such. */
export const LIQUIDITY_CONTRAST: Array<{ vehicle: string; howYouReachIt: string; taxOnReaching: string; authority: { label: string; url: string } | null }> = [
  { vehicle: "Indexed universal life (a policy loan)", howYouReachIt: "Borrow against the cash value on request; no sale, no credit check, no repayment schedule beyond the policy's loan interest.", taxOnReaching: "A loan is not income while the policy stays in force; a lapse with a loan outstanding makes the gain taxable.", authority: { label: "26 U.S.C. §72(e) and §7702", url: "https://www.law.cornell.edu/uscode/text/26/72" } },
  { vehicle: "Traditional IRA before age 59½", howYouReachIt: "Withdraw; the custodian pays out.", taxOnReaching: "Ordinary income plus the 10% additional tax, with the listed exceptions.", authority: { label: "26 U.S.C. §72(t)", url: "https://www.law.cornell.edu/uscode/text/26/72" } },
  { vehicle: "401(k) plan loan", howYouReachIt: "Borrow from the plan if the plan allows it; repay by payroll within five years (longer for a home).", taxOnReaching: "Not income if the loan stays within the lesser of $50,000 or half the vested balance and is repaid on schedule; a default is a distribution.", authority: { label: "26 U.S.C. §72(p)", url: "https://www.law.cornell.edu/uscode/text/26/72" } },
  { vehicle: "Taxable brokerage account", howYouReachIt: "Sell, or borrow on margin at the broker's rate and terms.", taxOnReaching: "A sale realises the gain; margin is the broker's contract, callable.", authority: null },
  { vehicle: "Home equity", howYouReachIt: "Refinance or open a line of credit; the lender underwrites income and credit each time.", taxOnReaching: "Borrowing is not income; the interest is deductible only within the rules for acquisition debt.", authority: null },
  { vehicle: "Certificate of deposit", howYouReachIt: "Break it early.", taxOnReaching: "The bank's early-withdrawal penalty, per the account agreement.", authority: null },
];

/** How the account value is credited when a loan is outstanding: the policy form's own distinction, stated without a promise. */
export const ACCOUNT_VALUE_CREDITING = {
  title: "Crediting on the full account value while a loan is out",
  lines: [
    "Two kinds of policy loan exist, and the policy form says which one a contract carries. Under a direct-recognition loan, the borrowed part of the account value is credited at the loan's own fixed rate rather than the index. Under a non-direct-recognition (participating or 'indexed') loan, the carrier keeps crediting the whole account value, borrowed portion included, at the index account's rate, while the loan accrues its own interest separately.",
    "That second kind is what makes the trust loop work: the money paid out to the trustee keeps earning the index credit inside the policy. The spread between the credit and the loan interest can be positive or negative in a given year; the backtester shows both.",
    "No policy credits interest on money that has left the contract by withdrawal. A withdrawal reduces the account value; a loan does not. The page uses the word loan for that reason.",
  ],
  caveat: "Which loan type applies, its rate, and whether the rate is fixed or variable are on the policy form and the current rate sheet; the carrier registry's reading protocol lists them.",
  source: { label: "26 U.S.C. §72(e)(5) and §7702 (loans and the life-insurance contract definition)", url: "https://www.law.cornell.edu/uscode/text/26/7702" },
};

export const IUL_LINK_SOURCES = [
  { label: "FRED CPIAUCSL, Consumer Price Index for All Urban Consumers, monthly; December-over-December change used here", url: "https://fred.stlouisfed.org/series/CPIAUCSL" },
  { label: "FRED M2SL, M2 money stock, monthly; December-over-December change used here", url: "https://fred.stlouisfed.org/series/M2SL" },
  { label: "The backtester's index history 1994–2025 and each account's cap, floor and participation (shared/indexCreditingData.ts)", url: "/portal/iul-historical" },
  { label: "26 U.S.C. §72 (annuities and loans; §72(e), §72(p), §72(t))", url: "https://www.law.cornell.edu/uscode/text/26/72" },
  { label: "26 U.S.C. §7702 (life insurance contract defined)", url: "https://www.law.cornell.edu/uscode/text/26/7702" },
];

/** The sentence the page prints above every correlation, so the record is never read as a forecast. */
export const CORRELATION_CAVEAT = "A correlation across thirty-odd years is a description of the record, not a mechanism. Caps, participation rates and floors are set by the carrier each year and moved with interest rates and option prices; the index moved with everything else. The table shows what the credited rate did in high-inflation and low-inflation years; it does not say that inflation will raise credits.";
