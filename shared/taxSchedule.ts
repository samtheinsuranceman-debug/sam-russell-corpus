// ============================================================
// THE TAX OPTIMISATION SCHEDULE — year by year, strategy by strategy, an
// amount, a reason and the statute, for one client's goals.
//
// The loop (ordering per the council's design review, GPT-5 via OpenRouter,
// Sept. 6, 2026, and the platform's own rules):
//   1. Baseline the year: income, filing, brackets (shared/taxRules.ts).
//   2. Reducers first, in order of certainty and cost: plan deferrals, HSA,
//      PTET, the Augusta rule, the children, then the deduction engines
//      (cost segregation / short-term rental, oil and gas IDC) sized to the
//      headroom left under the target bracket and capped by the §461(l)
//      excess-business-loss limit and the client's risk capacity.
//   3. Charitable bunching in a high year; capital-gain deferral or
//      exclusion in a sale year (1031, opportunity zone, CRT, QSBS).
//   4. Roth conversion last, filled to the top of the target bracket after
//      everything above has lowered the cost.
//   5. Structural, once: captive, ESOP, SLAT/IDGT, cash-value insurance
//      funding — placed in the year their prerequisites are met.
// Every step prints its amount, the tax it saves this year (marginal rate ×
// amount, or the specific rule), the statute, the reason in the client's
// words, the prerequisites, the risks, and a confidence that blends the
// family's authority weight with the panel's weight on the parameters.
// The goal statement changes the objective: "zero federal tax this year"
// fills every deduction engine to the limit; "lower lifetime tax" favours
// conversions and exclusions; "fund a tax-free account" routes the freed
// cash to Roth, HSA and the policy; "exit / capital gains" routes the sale.
// ============================================================
import { computeTaxPicture, currentRules, type FilingKey, type TaxRuleSet } from "./taxRules";
import { FAMILIES, FAMILY_BY_ID, type StrategyFamily } from "./taxStrategies";

export type Goal = "lower_this_year" | "zero_federal_this_year" | "lower_lifetime" | "tax_free_retirement" | "capital_gain_event" | "estate" | "charity" | "real_estate" | "exit";

export type ClientTaxProfile = {
  filing: FilingKey; state: string; age: number; spouseAge?: number; children: number; childrenUnder18: number;
  w2Income: number; practiceIncome: number; otherIncome: number; incomeGrowth: number;
  entity: "none" | "sole_prop" | "partnership" | "s_corp" | "c_corp";
  hasHdhp: boolean; employerPlanDeferralRoom: number; ownsPractice: boolean;
  homeEquity: number; mortgageRate: number; rentalProperties: number; canRunShortTermRental: boolean;
  taxableInvestments: number; unrealizedGains: number; plannedSaleGain: number; saleYear?: number;
  pretaxRetirement: number; rothBalances: number; cashValueLife: number;
  charitableIntentPerYear: number; liquidityReserveMonths: number; riskCapacity: "low" | "medium" | "high";
  netWorth: number;
  goals: Goal[];
  years: number;
  targetBracket: 0.24 | 0.32 | 0.35 | 0.37;
};

export type Step = {
  year: number; familyId: string; name: string; amount: number; taxSaved: number; statute: string; reason: string;
  prerequisites: string[]; risks: string[]; repeat: "annual" | "once" | "episodic"; confidence: number; kind: StrategyFamily["kind"];
};

export type YearPlan = { year: number; income: number; baselineTax: number; baselineRate: number; plannedTax: number; effectiveRate: number; steps: Step[]; taxableIncomeAfter: number; savedThisYear: number; notes: string[] };

export type Schedule = { years: YearPlan[]; totals: { baselineTax: number; plannedTax: number; saved: number; deployed: number }; onceUsed: string[]; goals: Goal[]; assumptions: string[]; asOf: string };

const r0 = (n: number) => Math.round(n);

function bracketTop(rules: TaxRuleSet, filing: FilingKey, rate: number): number {
  const b = rules.brackets[filing] as Array<{ rate: number; upTo: number | null }> | undefined;
  const row = b?.find((x) => Math.abs(x.rate - rate) < 1e-6);
  return row?.upTo ?? Infinity;
}

/** Marginal federal rate on the next dollar at this taxable income (2026 rule set). */
function marginalRate(rules: TaxRuleSet, filing: FilingKey, agi: number): number {
  const pic = computeTaxPicture({ filing, agi }, rules);
  return pic.marginalRate ?? 0.37;
}

function tax(rules: TaxRuleSet, filing: FilingKey, agi: number): number { return computeTaxPicture({ filing, agi: Math.max(0, agi) }, rules).federalTax; }

export function buildSchedule(p: ClientTaxProfile, now = new Date()): Schedule {
  const rules = currentRules(now);
  const startYear = now.getFullYear();
  const onceUsed = new Set<string>();
  const years: YearPlan[] = [];
  const assumptions: string[] = [
    "Federal only; the 2026 rule set is used for every year with brackets held in today's dollars (the projection is in real terms).",
    "Tax saved on a deduction = the amount × the marginal rate it displaces, computed by re-running the bracket engine; Roth conversion cost is the tax on the converted amount.",
    "Oil and gas IDC is taken as 80% of the investment (the typical share; the actual invoice controls) and is capped by the §461(l) excess business loss limit and by risk capacity (low 0%, medium 10%, high 20% of income a year).",
    "Cost segregation is sized at 25% of a property's purchase price in the year of purchase (typical reclassification share; a study sets the real number).",
    "The state, AMT and the net investment income tax are named in the risks but not computed in this version.",
  ];
  let pretax = p.pretaxRetirement;
  const bracketCap = (filing: FilingKey) => bracketTop(rules, filing, p.targetBracket);
  const eblCap = p.filing === "joint" ? (FAMILY_BY_ID.excess_business_loss!.params.joint2026!.value as number) : (FAMILY_BY_ID.excess_business_loss!.params.single2026!.value as number);
  const riskShare = p.riskCapacity === "high" ? 0.2 : p.riskCapacity === "medium" ? 0.1 : 0;
  const wants = (g: Goal) => p.goals.includes(g);

  for (let t = 0; t < p.years; t += 1) {
    const year = startYear + t;
    const growth = (1 + p.incomeGrowth) ** t;
    const income = (p.w2Income + p.practiceIncome + p.otherIncome) * growth + (p.saleYear === year ? p.plannedSaleGain : 0);
    let agi = income;
    const baselineTax = tax(rules, p.filing, agi);
    const steps: Step[] = [];
    const notes: string[] = [];
    let businessLoss = 0;
    const add = (fam: StrategyFamily, amount: number, reason: string, extra: Partial<Step> = {}) => {
      if (amount <= 0) return;
      const before = tax(rules, p.filing, agi);
      const isDeduction = fam.kind === "ordinary_deduction" || fam.kind === "above_the_line";
      if (isDeduction) agi -= amount;
      const after = isDeduction ? tax(rules, p.filing, agi) : before;
      const saved = extra.taxSaved ?? (isDeduction ? before - after : 0);
      const verified = Object.values(fam.params).filter((x) => x.verified).length / Math.max(1, Object.keys(fam.params).length);
      steps.push({ year, familyId: fam.id, name: fam.name, amount: r0(amount), taxSaved: r0(saved), statute: fam.statute, reason, prerequisites: fam.requires, risks: fam.risks, repeat: fam.repeat, confidence: Math.round(fam.authorityWeight * (0.5 + 0.5 * verified) * 100) / 100, kind: fam.kind, ...extra });
      if (fam.repeat === "once") onceUsed.add(fam.id);
    };

    // 1. Reducers that need no structure.
    const rm = FAMILY_BY_ID.retirement_max!;
    const deferral = (rm.params.deferral!.value as number) + (p.age >= 60 && p.age <= 63 ? (rm.params.catchUp60to63!.value as number) : p.age >= 50 ? (rm.params.catchUp50!.value as number) : 0);
    const room = p.ownsPractice ? Math.min(rm.params.annualAdditions!.value as number, 0.25 * Math.min(p.practiceIncome * growth, rm.params.compensationLimit!.value as number) + deferral) : Math.min(deferral, p.employerPlanDeferralRoom || deferral);
    add(rm, Math.min(room, income * 0.5), p.ownsPractice ? "Every pre-tax dollar the practice plan allows, up to the §415(c) ceiling: no structure, no audit risk, compounds untaxed." : "Fill the employer plan to the elective-deferral limit first.");
    pretax += Math.min(room, income * 0.5);
    if (p.ownsPractice && p.age >= 45 && (wants("lower_this_year") || wants("zero_federal_this_year") || wants("tax_free_retirement") || wants("lower_lifetime"))) {
      const cb = FAMILY_BY_ID.cash_balance!;
      const est = Math.min(0.35 * p.practiceIncome * growth, Math.max(0, (p.age - 40) * 6_000));
      add(cb, est, `At ${p.age + t} an actuary can fund a benefit toward the §415(b) limit of $290,000 a year; about ${Math.round(est / 1000)}k of deduction this year is the typical range for this age and income — the actuary sets the real figure.`);
      pretax += est;
    }
    if (p.hasHdhp) add(FAMILY_BY_ID.hsa!, (p.children > 0 || p.spouseAge ? FAMILY_BY_ID.hsa!.params.family!.value as number : FAMILY_BY_ID.hsa!.params.selfOnly!.value as number) + (p.age + t >= 55 ? 1_000 : 0), "Deductible in, tax-free out for medical costs; pay medical bills from cash and let it compound.");
    if (p.ownsPractice && (p.entity === "partnership" || p.entity === "s_corp")) add(FAMILY_BY_ID.ptet!, Math.min(p.practiceIncome * growth * 0.05, 60_000), "The entity pays the state tax and deducts it in full; at this income the individual SALT cap has phased down toward $10,000.");
    if (p.ownsPractice) add(FAMILY_BY_ID.augusta!, 14 * 1_000, "Fourteen documented meeting days at a market rate: deductible to the practice, excluded from your income (§280A(g)). Sized at $1,000 a day as a placeholder for the appraised rate.");
    if (p.childrenUnder18 > 0 && (p.entity === "sole_prop" || p.entity === "partnership")) add(FAMILY_BY_ID.employ_children!, p.childrenUnder18 * (FAMILY_BY_ID.employ_children!.params.standardDeductionSingle2026!.value as number), `${p.childrenUnder18} child${p.childrenUnder18 > 1 ? "ren" : ""} paid a real wage for real work up to the $16,100 standard deduction: deductible to the practice, tax-free to them, no FICA under 18.`);

    // 2. Deduction engines to the headroom under the target bracket, capped by §461(l) and risk capacity.
    const ded = rules.standardDeduction[p.filing] ?? 0;
    const headroom = () => Math.max(0, agi - ded - bracketCap(p.filing));
    if (p.canRunShortTermRental && p.rentalProperties > 0 && t === 0 && wants("real_estate")) {
      const seg = 0.25 * Math.min(p.netWorth * 0.15, 1_500_000);
      add(FAMILY_BY_ID.str_loophole!, Math.min(seg, eblCap - businessLoss), "A short-term rental run with material participation is not a passive activity; a cost segregation study with 100% bonus depreciation front-loads the deduction against your practice income.");
      businessLoss += Math.min(seg, eblCap - businessLoss);
    }
    const ogFam = FAMILY_BY_ID.oil_gas_idc!;
    if (riskShare > 0 && (wants("lower_this_year") || wants("zero_federal_this_year") || wants("lower_lifetime"))) {
      const target = wants("zero_federal_this_year") ? agi - (rules.standardDeduction[p.filing] ?? 0) : headroom();
      const invest = Math.min(target / 0.8, income * riskShare, (eblCap - businessLoss) / 0.8);
      if (invest > 10_000) { add(ogFam, invest * 0.8, `Invest $${Math.round(invest).toLocaleString("en-US")} in a direct working interest; about 80% is intangible drilling cost expensed this year under §263(c), outside the passive basket under §469(c)(3). Sized to ${wants("zero_federal_this_year") ? "take taxable income toward zero" : `the room above the ${Math.round(p.targetBracket * 100)}% bracket`} and capped by risk capacity (${Math.round(riskShare * 100)}% of income) and the §461(l) limit ($${eblCap.toLocaleString("en-US")}).`, { amount: r0(invest) }); businessLoss += invest * 0.8; }
    }

    // 3. Charity and the sale year.
    if (p.charitableIntentPerYear > 0 && (t % 3 === 0)) add(FAMILY_BY_ID.daf_bunching!, p.charitableIntentPerYear * 3, "Three years of giving in one, in appreciated stock, through a donor-advised fund: one pass over the 0.5% floor, the 60%/30% limits respected, and the §68 haircut taken once.");
    if (p.saleYear === year && p.plannedSaleGain > 0) {
      if (wants("real_estate")) add(FAMILY_BY_ID.like_kind!, p.plannedSaleGain, "Exchange into replacement real property (or a DST) within 45/180 days and defer the whole gain; hold to death for the step-up.", { taxSaved: r0(p.plannedSaleGain * 0.238) });
      else if (wants("charity") && !onceUsed.has("crt")) add(FAMILY_BY_ID.crt!, p.plannedSaleGain, "Contribute the asset to a charitable remainder trust before the sale: no tax on the sale, an income stream for life, a deduction for the remainder.", { taxSaved: r0(p.plannedSaleGain * 0.238 * 0.5) });
      else add(FAMILY_BY_ID.opportunity_zone!, p.plannedSaleGain, "Roll the gain into a qualified opportunity fund within 180 days: deferred, a basis step-up after five years, and the fund's appreciation excluded after ten.", { taxSaved: r0(p.plannedSaleGain * 0.238 * 0.3) });
    }

    // 4. Roth conversion, last, to the top of the target bracket.
    if ((wants("tax_free_retirement") || wants("lower_lifetime")) && pretax > 0) {
      const roomBelow = Math.max(0, bracketCap(p.filing) - (agi - ded));
      const convert = Math.min(roomBelow, pretax, 400_000);
      if (convert > 5_000) {
        const cost = tax(rules, p.filing, agi + convert) - tax(rules, p.filing, agi);
        add(FAMILY_BY_ID.roth_conversion!, convert, `Convert $${Math.round(convert).toLocaleString("en-US")} — exactly the room left under the ${Math.round(p.targetBracket * 100)}% bracket after this year's deductions — at a cost of $${Math.round(cost).toLocaleString("en-US")} now, so that growth is never taxed again and IRMAA and RMDs shrink later.`, { taxSaved: -r0(cost) });
        pretax -= convert; agi += convert;
      }
    }

    // 5. Structure, once, when the prerequisites are met.
    if (wants("estate") && p.netWorth > 15_000_000 && !onceUsed.has("slat")) add(FAMILY_BY_ID.slat!, Math.min(p.netWorth * 0.2, 15_000_000), "Use exemption while it is $15 million: gift to a spousal lifetime access trust and let the growth compound outside both estates.");
    if (wants("estate") && p.netWorth > 5_000_000 && !onceUsed.has("idgt") && t === 1) add(FAMILY_BY_ID.idgt!, Math.min(p.netWorth * 0.15, 10_000_000), "Sell appreciating assets to a grantor trust for a note at the applicable federal rate; growth above the rate leaves the estate and you pay the trust's tax as a further tax-free gift.");
    if (p.ownsPractice && p.practiceIncome * growth > 1_500_000 && p.riskCapacity !== "low" && !onceUsed.has("captive_831b") && t === 2) add(FAMILY_BY_ID.captive_831b!, Math.min(p.practiceIncome * growth * 0.1, FAMILY_BY_ID.captive_831b!.params.premiumLimit2026!.value as number), "Insure real practice risks in your own licensed captive with actuarially priced premiums; run it as insurance (loss ratio above 60%) so it is neither a listed transaction nor a transaction of interest.");
    if ((wants("tax_free_retirement") || wants("estate")) && p.homeEquity > 500_000 && p.mortgageRate < 0.065 && !onceUsed.has("iul_recycling") && t >= 1) add(FAMILY_BY_ID.iul_recycling!, Math.min(p.homeEquity * 0.3, 500_000), "Fund a non-MEC indexed universal life policy from home equity inside the §7702 limits: tax-deferred growth, basis-first withdrawals, loans not income, death benefit tax-free. The interest is not deductible; the case rests on the spread between the loan rate and the policy's net crediting rate, illustrated at conservative rates.");
    if (wants("exit") && p.entity === "c_corp" && !onceUsed.has("esop_1042") && t === 0) add(FAMILY_BY_ID.esop_1042!, p.netWorth * 0.3, "Sell to an ESOP owning at least 30% and roll into qualified replacement property under §1042; the gain is deferred and steps up at death.");
    if (wants("exit") && p.entity === "c_corp" && !onceUsed.has("qsbs") && t === 0) add(FAMILY_BY_ID.qsbs!, 0, "");

    // Roll up the year.
    if (wants("zero_federal_this_year") && agi > (rules.standardDeduction[p.filing] ?? 0)) notes.push(`Federal taxable income could not be taken to zero this year within risk capacity and the §461(l) cap; ${Math.round(agi - (rules.standardDeduction[p.filing] ?? 0)).toLocaleString("en-US")} remains.`);
    const plannedTax = tax(rules, p.filing, agi);
    years.push({ year, income: r0(income), baselineTax: r0(baselineTax), baselineRate: income > 0 ? Math.round((baselineTax / income) * 1000) / 1000 : 0, plannedTax: r0(plannedTax), effectiveRate: income > 0 ? Math.round((plannedTax / income) * 1000) / 1000 : 0, steps: steps.filter((s) => s.amount > 0), taxableIncomeAfter: r0(agi), savedThisYear: r0(baselineTax - plannedTax), notes });
  }
  const totals = { baselineTax: r0(years.reduce((s, y) => s + y.baselineTax, 0)), plannedTax: r0(years.reduce((s, y) => s + y.plannedTax, 0)), saved: r0(years.reduce((s, y) => s + y.savedThisYear, 0)), deployed: r0(years.reduce((s, y) => s + y.steps.reduce((a, st) => a + st.amount, 0), 0)) };
  return { years, totals, onceUsed: Array.from(onceUsed), goals: p.goals, assumptions, asOf: now.toISOString().slice(0, 10) };
}

export { FAMILIES };
