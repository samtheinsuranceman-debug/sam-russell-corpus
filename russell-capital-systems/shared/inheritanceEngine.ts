// ============================================================
// THE INHERITANCE ENGINE — what the client expects to receive, item by item:
// what kind of asset it is and how the Code taxes it on arrival, when it is
// expected, what it will buy then (the CPI ladder), what the tax on it is
// likely to be by then (the erosion trajectory's odds), and, only if the
// client wants it, the gentle questions about a benefactor's remarriage and
// step-family, with the moves that test the waters and the moves that
// cannot be undone. Every rule below links the section it rests on.
// ============================================================
import { LADDER_YEARS, burdenAt, purchasingPower, type CategoryRates, type TrajectoryPoint } from "./erosion";

const LII = (s: string) => `https://www.law.cornell.edu/uscode/text/26/${s}`;

// ─── Asset classes and how each arrives ─────────────────────────────────────
export type Taxability = "tax_free" | "ordinary" | "step_up" | "gain_ordinary" | "trust";
export type AssetClass = {
  id: string; label: string; taxability: Taxability;
  /** One sentence the page prints beside the class. */
  summary: string;
  /** When the tax, if any, is due. */
  timing: "none" | "within_ten_years" | "on_sale" | "as_received" | "year_of_death";
  authority: { label: string; url: string };
  notes: string[];
};

export const ASSET_CLASSES: AssetClass[] = [
  { id: "cash", label: "Cash, bank and CDs", taxability: "tax_free", timing: "none", summary: "Cash arrives with no income tax; interest earned after it arrives is yours to report.", authority: { label: "IRC §102(a): gifts and inheritances excluded from gross income", url: LII("102") }, notes: [] },
  { id: "brokerage", label: "Taxable brokerage (stocks, funds, bonds)", taxability: "step_up", timing: "on_sale", summary: "Basis resets to the date-of-death value, so the gain earned during the benefactor's life is never taxed; only what it earns after arrival is.", authority: { label: "IRC §1014(a): basis of property acquired from a decedent is its fair market value at death", url: LII("1014") }, notes: ["A joint account with a surviving spouse steps up only the decedent's share in most states; community-property states step up both halves."] },
  { id: "traditional_ira", label: "Traditional IRA, 401(k), 403(b), SEP (pre-tax)", taxability: "ordinary", timing: "within_ten_years", summary: "Every dollar is ordinary income to you when withdrawn, and a non-spouse beneficiary must empty the account within ten years of the death.", authority: { label: "IRC §401(a)(9)(H): the ten-year rule for designated beneficiaries; §691: income in respect of a decedent", url: LII("401") }, notes: ["Spreading the withdrawals across the ten years keeps more of it in lower brackets; taking it in one year stacks it on top of your own income.", "No step-up: §1014(c) excludes income in respect of a decedent."] },
  { id: "roth_ira", label: "Roth IRA / Roth 401(k)", taxability: "tax_free", timing: "within_ten_years", summary: "Qualified distributions are tax-free to you; the account still has to be emptied within ten years, but the growth inside stays tax-free until then.", authority: { label: "IRC §408A(d): qualified distributions from a Roth IRA; §401(a)(9)(H): ten-year rule", url: LII("408A") }, notes: ["The five-year clock runs from the benefactor's first Roth contribution, not from your receipt."] },
  { id: "life_insurance", label: "Life insurance death benefit", taxability: "tax_free", timing: "none", summary: "Paid by reason of death, the proceeds are excluded from your gross income.", authority: { label: "IRC §101(a)(1): proceeds of life insurance contracts payable by reason of death", url: LII("101") }, notes: ["If the policy was sold or transferred for value during the insured's life, part of the proceeds can become taxable (§101(a)(2)).", "Interest paid on proceeds left with the carrier is taxable."] },
  { id: "annuity", label: "Non-qualified annuity", taxability: "gain_ordinary", timing: "as_received", summary: "The gain above what the benefactor paid in is ordinary income to you as it comes out; there is no step-up.", authority: { label: "IRC §72(e) and §72(s): amounts received under annuity contracts; distributions required after the holder's death", url: LII("72") }, notes: ["Enter the gain share from the carrier's statement; without it the engine cannot size the tax and says so."] },
  { id: "real_estate", label: "Real estate", taxability: "step_up", timing: "on_sale", summary: "Basis resets to the date-of-death value; a sale soon after usually carries little or no gain.", authority: { label: "IRC §1014(a)", url: LII("1014") }, notes: ["Property-tax reassessment on transfer is a state rule; some states reassess, some exempt a parent-to-child transfer within limits.", "Rental income after arrival is yours to report."] },
  { id: "business", label: "Business or partnership interest", taxability: "step_up", timing: "on_sale", summary: "Basis resets to the appraised value at death; the appraisal is the number everything after depends on.", authority: { label: "IRC §1014(a); §1014(f): basis must be consistent with the estate tax return", url: LII("1014") }, notes: ["Buy-sell agreements and operating agreements can override who may hold the interest."] },
  { id: "collectibles", label: "Collectibles, art, precious metals", taxability: "step_up", timing: "on_sale", summary: "Basis resets at death; a later gain on collectibles is taxed at the collectibles rate rather than the lower capital-gains rate.", authority: { label: "IRC §1014(a); §1(h)(4): collectibles gain", url: LII("1") }, notes: [] },
  { id: "hsa", label: "Health savings account", taxability: "ordinary", timing: "year_of_death", summary: "A non-spouse beneficiary includes the whole balance in income in the year of death; a spouse can keep it as an HSA.", authority: { label: "IRC §223(f)(8): treatment on the account beneficiary's death", url: LII("223") }, notes: [] },
  { id: "plan529", label: "529 education account", taxability: "tax_free", timing: "none", summary: "Passes to a successor owner; withdrawals for qualified education stay tax-free.", authority: { label: "IRC §529(c)(3): distributions", url: LII("529") }, notes: ["A non-qualified withdrawal is taxed on the earnings plus a 10% addition."] },
  { id: "trust", label: "Distributions from a trust", taxability: "trust", timing: "as_received", summary: "Income the trust distributes is taxed to you in the character it had inside the trust; principal is not.", authority: { label: "IRC §652 and §662: inclusion of amounts distributed by a trust in the beneficiary's income", url: LII("662") }, notes: ["The trustee's annual K-1 says which part is income and which is principal."] },
];
export const assetClass = (id: string) => ASSET_CLASSES.find((c) => c.id === id) ?? null;

/** The federal estate-tax filing threshold by year of death, as the IRS prints it. */
export const FEDERAL_ESTATE_EXCLUSION: Array<{ year: number; amount: number }> = [
  { year: 2011, amount: 5_000_000 }, { year: 2012, amount: 5_120_000 }, { year: 2013, amount: 5_250_000 }, { year: 2014, amount: 5_340_000 }, { year: 2015, amount: 5_430_000 }, { year: 2016, amount: 5_450_000 }, { year: 2017, amount: 5_490_000 },
  { year: 2018, amount: 11_180_000 }, { year: 2019, amount: 11_400_000 }, { year: 2020, amount: 11_580_000 }, { year: 2021, amount: 11_700_000 }, { year: 2022, amount: 12_060_000 }, { year: 2023, amount: 12_920_000 }, { year: 2024, amount: 13_610_000 }, { year: 2025, amount: 13_990_000 }, { year: 2026, amount: 15_000_000 },
];
export const FEDERAL_ESTATE_SOURCE = { label: "IRS, Estate tax: filing threshold for year of death (read 7 September 2026)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/estate-tax" };
export function exclusionFor(year: number): { amount: number; year: number; extrapolated: boolean } {
  const last = FEDERAL_ESTATE_EXCLUSION[FEDERAL_ESTATE_EXCLUSION.length - 1]!;
  if (year >= last.year) return { amount: last.amount, year: last.year, extrapolated: year > last.year };
  const hit = FEDERAL_ESTATE_EXCLUSION.find((e) => e.year === year) ?? FEDERAL_ESTATE_EXCLUSION[0]!;
  return { amount: hit.amount, year: hit.year, extrapolated: false };
}

// ─── The items ──────────────────────────────────────────────────────────────
export type InheritanceItem = {
  id: string; label: string; assetClass: string; amount: number; expectedYear: number;
  from: string;
  /** 1 (unlikely) … 5 (certain), the client's own reading. */
  likelihood: number;
  /** For annuities: the gain share of the value, from the statement. */
  taxableSharePct?: number | null;
  notes?: string;
};

export type ReportContext = {
  thisYear: number;
  /** The client's marginal federal rate today, as a fraction. */
  marginalRate: number;
  /** State income tax rate on ordinary income, fraction, typed. */
  stateRate: number;
  /** CPI-U ladder from the inflation engine (id "all"), or null when the host has no reading. */
  cpi: CategoryRates | null;
  /** The erosion trajectory; empty when the host has none. */
  trajectory: TrajectoryPoint[];
  /** The benefactor's whole estate, if the client knows it, for the exclusion check. */
  benefactorEstate?: number | null;
};

export type ItemReport = {
  item: InheritanceItem; cls: AssetClass | null; yearsOut: number;
  taxableShare: number; taxNow: number; burden: number; pHigher: number | null; taxThen: number; afterTaxThen: number;
  cpiRate: number | null; power: number | null; realAfterTax: number | null;
  weighted: number | null;
  flags: string[];
};
export type InheritanceReport = {
  items: ItemReport[];
  totals: { nominal: number; taxNow: number; taxThen: number; afterTaxThen: number; realAfterTax: number | null; weighted: number | null };
  estateCheck: { estate: number; exclusion: number; exclusionYear: number; extrapolated: boolean; over: boolean } | null;
  assumptions: string[];
};

const nearestLadder = (years: number): (typeof LADDER_YEARS)[number] => { for (const n of LADDER_YEARS) if (years <= n) return n; return LADDER_YEARS[LADDER_YEARS.length - 1]!; };
const r0 = (n: number) => Math.round(n);

/** The share of the item that is ordinary income on arrival, by class; the annuity's share is the typed gain share. */
export function taxableShareOf(item: InheritanceItem, cls: AssetClass | null): { share: number; flag: string | null } {
  if (!cls) return { share: 0, flag: "unknown asset class; treated as tax-free until chosen" };
  switch (cls.taxability) {
    case "ordinary": return { share: 1, flag: null };
    case "gain_ordinary": return item.taxableSharePct == null ? { share: 0, flag: "gain share not entered; the tax on this annuity is not sized" } : { share: Math.max(0, Math.min(1, item.taxableSharePct / 100)), flag: null };
    case "trust": return item.taxableSharePct == null ? { share: 0, flag: "income share not entered (the K-1 says it); treated as principal" } : { share: Math.max(0, Math.min(1, item.taxableSharePct / 100)), flag: null };
    default: return { share: 0, flag: null };
  }
}

export function inheritanceReport(items: InheritanceItem[], ctx: ReportContext): InheritanceReport {
  const assumptions: string[] = [];
  assumptions.push(`Tax on ordinary-income items at your marginal federal rate ${(ctx.marginalRate * 100).toFixed(0)}% plus state ${(ctx.stateRate * 100).toFixed(1)}%, applied to the whole amount; spreading an inherited IRA across ten years usually lowers it.`);
  assumptions.push(ctx.trajectory.length ? "The year-of-receipt tax multiplies today's rate by the erosion trajectory's burden multiplier for that horizon; the odds beside it are the trajectory's probability that the top rate is higher then." : "No erosion trajectory on this host; the year-of-receipt tax equals today's.");
  assumptions.push(ctx.cpi && Object.keys(ctx.cpi.rates).length ? `Today's dollars use the CPI-U ladder as of ${ctx.cpi.asOf}: the annualised rate over the nearest horizon at or above the years until receipt.` : "No CPI reading on this host; today's-dollar column is blank.");
  const out: ItemReport[] = items.map((item) => {
    const cls = assetClass(item.assetClass);
    const yearsOut = Math.max(0, item.expectedYear - ctx.thisYear);
    const { share, flag } = taxableShareOf(item, cls);
    const flags: string[] = flag ? [flag] : [];
    const rate = ctx.marginalRate + ctx.stateRate;
    const taxNow = item.amount * share * rate;
    const burden = ctx.trajectory.length ? burdenAt(ctx.trajectory, yearsOut) : 1;
    const pt = ctx.trajectory.length ? ctx.trajectory.find((p) => p.horizonYears >= yearsOut) ?? ctx.trajectory[ctx.trajectory.length - 1]! : null;
    const pHigher = pt && yearsOut > 0 ? pt.pHigher : null;
    const taxThen = Math.min(item.amount * share, taxNow * burden);
    const afterTaxThen = item.amount - taxThen;
    const n = nearestLadder(yearsOut);
    const cpiRate = ctx.cpi?.rates[n] ?? null;
    const power = cpiRate == null ? null : yearsOut === 0 ? 1 : purchasingPower(cpiRate, yearsOut);
    const realAfterTax = power == null ? null : afterTaxThen * power;
    const lk = Math.max(1, Math.min(5, item.likelihood || 3));
    const weighted = realAfterTax == null ? null : realAfterTax * ((lk - 1) / 4);
    if (cls?.timing === "within_ten_years" && cls.taxability === "ordinary") flags.push("must be withdrawn within ten years of the death");
    if (cls?.taxability === "step_up") flags.push("no tax on arrival; basis resets to the date-of-death value");
    return { item, cls, yearsOut, taxableShare: share, taxNow: r0(taxNow), burden, pHigher, taxThen: r0(taxThen), afterTaxThen: r0(afterTaxThen), cpiRate, power, realAfterTax: realAfterTax == null ? null : r0(realAfterTax), weighted: weighted == null ? null : r0(weighted), flags };
  });
  const sum = (f: (r: ItemReport) => number | null) => { let s = 0, any = false; for (const r of out) { const v = f(r); if (v != null) { s += v; any = true; } } return any ? r0(s) : null; };
  const totals = { nominal: r0(out.reduce((s, r) => s + r.item.amount, 0)), taxNow: r0(out.reduce((s, r) => s + r.taxNow, 0)), taxThen: r0(out.reduce((s, r) => s + r.taxThen, 0)), afterTaxThen: r0(out.reduce((s, r) => s + r.afterTaxThen, 0)), realAfterTax: sum((r) => r.realAfterTax), weighted: sum((r) => r.weighted) };
  let estateCheck: InheritanceReport["estateCheck"] = null;
  if (ctx.benefactorEstate && ctx.benefactorEstate > 0) {
    const y = items.length ? Math.min(...items.map((i) => i.expectedYear)) : ctx.thisYear;
    const ex = exclusionFor(y);
    estateCheck = { estate: ctx.benefactorEstate, exclusion: ex.amount, exclusionYear: ex.year, extrapolated: ex.extrapolated, over: ctx.benefactorEstate > ex.amount };
    if (ex.extrapolated) assumptions.push(`The exclusion is indexed after ${ex.year}; the ${ex.year} figure is used for ${y} until the IRS publishes that year's.`);
  }
  return { items: out, totals, estateCheck, assumptions };
}

// ─── The gentle follow-up, only if the client asks for it ───────────────────
export const FOLLOW_UP = {
  invitation: "Would you like to think through what could change this? Three short questions, nothing you have to answer.",
  questions: [
    "Is the person you expect this from married to someone other than your parent, or might they marry again?",
    "Are there step-children, or a spouse's children, who could be in the picture?",
    "Do you know whether the plan is written down: a will, a trust, or beneficiary forms on the accounts?",
  ],
  testTheWaters: [
    { title: "Ask to see the plan", text: "A simple, warm question: \"Is there a will or a trust, and would you be comfortable showing me where things stand?\" The answer, or the silence, tells you what you need to know." },
    { title: "Ask about the beneficiary forms", text: "Retirement accounts and life policies pass by the form on file, not by the will. Ask whether the forms were updated after the marriage." },
    { title: "Offer the meeting", text: "Offer to pay for one sitting with their estate attorney, with everyone in the room. It reads as care, and it is." },
  ],
  reclaim: [
    { title: "An irrevocable trust funded now", text: "Ask the benefactor to move the intended share into an irrevocable trust that names you. Once funded it is outside a later spouse's elective share and outside the will.", authority: { label: "ACTEC: find an estate and trust attorney in your state", url: "https://www.actec.org/find-a-lawyer/" } },
    { title: "Named directly on the accounts", text: "Being named as beneficiary on an IRA or a life policy moves that asset outside probate. A 401(k) is different: a spouse has rights under federal law unless they waive them in writing.", authority: { label: "IRC §401(a)(11): survivor annuity requirements and spousal consent", url: LII("401") } },
    { title: "A lifetime gift, or a policy you own", text: "A gift now within the annual exclusion, or a life policy on the benefactor that you own and pay for, cannot be redirected later. Both need the benefactor's consent and, for the policy, insurable interest.", authority: { label: "IRC §2503(b): the annual gift-tax exclusion (indexed; the IRS publishes each year's amount)", url: LII("2503") } },
  ],
  tone: "Every line above is offered once and never repeated by the advisor unless the client raises it again.",
};

// ─── Partner pre-planning ───────────────────────────────────────────────────
export const PARTNER_COPY = {
  heading: "Before it lands: pre-planning an inherited IRA or a capital-gains event",
  intro: "Two firms we work beside do the year-before planning: which accounts to draw, in which years, so an inherited IRA's ten years and a sale's gain fall into the lowest brackets available.",
  partners: [
    { name: "Elite Tax Strategists", url: "https://elitetaxstrategists.com", contact: "Ralph Ryanberg" },
    { name: "My Taxes Made EZ", url: "https://mytaxesmadeez.com", contact: "Ralph Ryanberg" },
  ],
  /** Shown only when the owner has approved the partner's own figure as the partner's quote. */
  quote: { text: "In our experience, pre-planning an inherited IRA or a capital-gains event before it lands has saved clients thirty to fifty percent of the tax that would otherwise have been due.", attributedTo: "Ralph Ryanberg", approved: false },
  disclaimer: "Any figure quoted is the partner's own statement about past cases; no result is guaranteed, and your outcome depends on your brackets, your state and the years available.",
};

export const INHERITANCE_SOURCES = [
  FEDERAL_ESTATE_SOURCE,
  { label: "IRC §1014, basis of property acquired from a decedent", url: LII("1014") },
  { label: "IRC §101, certain death benefits", url: LII("101") },
  { label: "IRC §401(a)(9), required distributions and the ten-year rule", url: LII("401") },
  { label: "IRC §691, income in respect of decedents", url: LII("691") },
  { label: "IRC §72, annuities", url: LII("72") },
  { label: "IRC §223, health savings accounts", url: LII("223") },
  { label: "IRC §2503, taxable gifts and the annual exclusion", url: LII("2503") },
];
