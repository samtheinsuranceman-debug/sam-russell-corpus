// ============================================================
// TAX-FREE INCOME FOR LIFE — the sequence Sam runs and the arithmetic for it:
//   1. Never illustrate a lifetime-income plan on taxable money. The
//      pre-tax account is converted first (the Roth conversion engine's
//      pass), so the income that follows is tax-free.
//   2. The income plan's payout, from the carrier's published rate sheet
//      (an owner-entered registry; each row carries the sheet's URL and date).
//   3. The Longevity Engine sizes how many years the payments are likely to
//      run for one life or two, and the expected total.
//   4. The studies on guaranteed income and wellbeing, fetched and cited,
//      shown before the numbers, with what each actually found.
//   5. The flow-through policy Sam described, stated as the questions the
//      attorney and the carrier must answer before it is illustrated.
// ============================================================
import { expectedLifetimePayments, type Person } from "./longevityEngine";

/** What the fetched studies found, in their own terms. Kind tells the reader what weight to give each. */
export const WELLBEING_STUDIES: Array<{ title: string; authors: string; year: number; kind: "peer-reviewed" | "working paper" | "book chapter" | "industry survey" | "company page"; url: string; finding: string; caveat?: string }> = [
  { title: "Annuities and Retirement Satisfaction", authors: "Constantijn Panis (RAND)", year: 2003, kind: "working paper", url: "https://www.rand.org/pubs/drafts/DRU3021.html", finding: "Using the Health and Retirement Study, retirees who financed more of their consumption from lifelong guaranteed pension income were more likely to be very satisfied in retirement, at every income level, and reported fewer symptoms of depression; having a defined-benefit pension raised satisfaction by about as much as moving up one income category. Reliance on Social Security alone showed no such effect.", caveat: "An association in survey data, controlling for income, wealth and health; not a controlled experiment." },
  { title: "Annuities and Retirement Well-Being", authors: "Constantijn Panis, in Pension Design and Structure (Pension Research Council)", year: 2004, kind: "book chapter", url: "https://pensionresearchcouncil.wharton.upenn.edu/publications/papers-2018/annuities-and-retirement-well-being/", finding: "Those with greater annuitization were more satisfied in retirement and maintained their satisfaction over the years, while retirees without lifelong annuities became somewhat less satisfied; the guaranteed benefits may reduce anxiety about outliving savings.", caveat: "Same data and author as the working paper." },
  { title: "Sustaining Retirement during Lockdown: Annuitized Income and Older Americans' Financial Well-Being before and during the COVID-19 Pandemic", authors: "Journal of Risk and Financial Management", year: 2023, kind: "peer-reviewed", url: "https://www.mdpi.com/1911-8074/16/10/432", finding: "Using the Health and Retirement Study across the pandemic, receiving annuitized income was associated with holding liquid assets above the median household income, but with lower subjective financial well-being on both measures the authors used.", caveat: "A mixed result. It is here because a client deserves to see the study that cuts the other way." },
  { title: "2026 Lifetime Income Report (survey of more than 1,100 retirees)", authors: "October Three", year: 2025, kind: "industry survey", url: "https://www.octoberthree.com/articles/survey-retirees-with-guaranteed-lifetime-income-30-more-likely-to-report/", finding: "Retirees with guaranteed monthly lifetime income from a pension or annuity were reported as 30% more likely to say they feel a high level of financial security than those managing withdrawals themselves; the report also covers lifestyle, health and emotional wellbeing.", caveat: "A consulting firm's survey, not peer-reviewed; the full report is behind a form." },
];
export const STUDIES_FRAMING = "What the research supports, stated as it stands: retirees with guaranteed lifetime income report more satisfaction and fewer depressive symptoms in the RAND work, and more financial security in the industry survey; one peer-reviewed study of the pandemic years found the opposite on subjective measures. None of the studies read here measured longer life. The page shows them before any number because a client should know what the evidence is and what it is not.";

/** The rule Sam set, and how the page enforces it. */
export const INCOME_PLAN_RULES = {
  taxableFirst: "A lifetime-income plan is never illustrated on taxable money here. The pre-tax account goes through the Roth conversion pass first; the income plan runs on the Roth. The page refuses to show an income figure for an unconverted account and says why.",
  principalNote: "Whether the account value keeps growing while income is paid, and by what crediting, is a feature of the specific contract; the page prints it only as the contract states it, typed with the contract's form number.",
  exitProvision: "One contract family the firm places allows the owner to leave after the fourth contract year without a surrender charge for any reason, where most lifetime-income contracts carry surrender charges for seven to ten years. The page describes the provision without naming the company; the schedule is typed from the contract's own surrender-charge table.",
  neverPrinted: ["a payout rate not on a dated rate sheet", "a bonus not on that sheet", "a company name beside the exit provision", "a claim that income raises longevity"],
};

/** A rate-sheet row the owner enters: the carrier's published payout for an age band, with the sheet's URL and date. */
export type PayoutRow = { id?: number; carrier: string; product: string; ageFrom: number; ageTo: number; single: boolean; payoutPct: number; bonusPct: number | null; deferralYears: number; principalContinuesToGrow: boolean | null; exitAfterYears: number | null; surrenderYears: number | null; rateSheetUrl: string; asOf: string };

export type IncomePlanInput = {
  balance: number;                 // the account to be converted (or already Roth)
  accountKind: "pretax" | "roth" | "taxable";
  conversionTaxPct: number;        // the tax paid on conversion under the plan (0 when the conversion engine's pass zeroes it; otherwise typed)
  payoutPct: number;               // from the rate sheet row, percent of the (bonused) account paid per year
  bonusPct: number;                // from the rate sheet row
  startAge: number; sex: "male" | "female"; spouse: Person | null;
  marginalRatePct: number;         // what the same income would be taxed at if it were not Roth
  deferralYears: number;
};
export type IncomePlanResult = {
  refused: string | null;
  afterConversion: number; withBonus: number; annualIncome: number; monthlyIncome: number;
  expectedYears: number; expectedTotal: number;
  ifTaxable: { annualAfterTax: number; expectedTotalAfterTax: number; taxOverLife: number };
  lines: string[];
};

/** The plan: convert (tax as stated), apply the sheet's bonus and payout, size the years with the Longevity Engine, and show what the same income would lose to tax if it were not Roth. */
export function incomePlan(x: IncomePlanInput): IncomePlanResult {
  const first: Person = { age: x.startAge + x.deferralYears, sex: x.sex };
  const spouse = x.spouse ? { age: x.spouse.age + x.deferralYears, sex: x.spouse.sex } : null;
  if (x.accountKind === "taxable") {
    return { refused: "This account is taxable money. The firm does not illustrate a lifetime-income plan on it; the conversion pass comes first.", afterConversion: 0, withBonus: 0, annualIncome: 0, monthlyIncome: 0, expectedYears: 0, expectedTotal: 0, ifTaxable: { annualAfterTax: 0, expectedTotalAfterTax: 0, taxOverLife: 0 }, lines: [] };
  }
  const afterConversion = x.accountKind === "pretax" ? x.balance * (1 - x.conversionTaxPct / 100) : x.balance;
  const withBonus = afterConversion * (1 + x.bonusPct / 100);
  const annualIncome = withBonus * (x.payoutPct / 100);
  const { expectedTotal, expectedYears } = expectedLifetimePayments(annualIncome, first, spouse);
  const annualAfterTax = annualIncome * (1 - x.marginalRatePct / 100);
  const lines = [
    x.accountKind === "pretax" ? `Conversion: ${Math.round(x.balance).toLocaleString("en-US")} pre-tax becomes ${Math.round(afterConversion).toLocaleString("en-US")} Roth after ${x.conversionTaxPct}% conversion tax${x.conversionTaxPct === 0 ? " (the conversion pass zeroed it; its arithmetic is on that page)" : ""}.` : `Already Roth: ${Math.round(x.balance).toLocaleString("en-US")}.`,
    `Bonus ${x.bonusPct}% from the rate sheet: ${Math.round(withBonus).toLocaleString("en-US")} income base.`,
    `Payout ${x.payoutPct}% a year from age ${first.age}${x.deferralYears ? ` after ${x.deferralYears} years of deferral` : ""}: ${Math.round(annualIncome).toLocaleString("en-US")} a year, ${Math.round(annualIncome / 12).toLocaleString("en-US")} a month, tax-free.`,
    `The Longevity Engine expects payments for ${expectedYears.toFixed(1)} years while ${spouse ? "at least one of you" : "you"} live${spouse ? "" : "s"}: ${Math.round(expectedTotal).toLocaleString("en-US")} expected in total.`,
    `If the same income were taxable at ${x.marginalRatePct}%, ${Math.round(annualAfterTax).toLocaleString("en-US")} a year would arrive and ${Math.round(expectedTotal - annualAfterTax * expectedYears).toLocaleString("en-US")} would go to tax over the expected years.`,
  ];
  return { refused: null, afterConversion, withBonus, annualIncome, monthlyIncome: annualIncome / 12, expectedYears, expectedTotal, ifTaxable: { annualAfterTax, expectedTotalAfterTax: annualAfterTax * expectedYears, taxOverLife: expectedTotal - annualAfterTax * expectedYears }, lines };
}

/** The flow-through policy: stated as the questions that decide whether it works, because the answers live in the policy form, §7702A and the trust instrument. */
export const FLOW_THROUGH = {
  title: "Income paid into the trust's policy, then back to you",
  description: "The lifetime income is paid to a trust that owns an indexed universal life policy. The premium builds the policy's account value and death benefit; within one to three days the trustee returns the money to you, and you spend or reinvest it. The second asset grows beside the income stream.",
  questions: [
    { q: "Is the money coming back a withdrawal or a loan?", why: "A withdrawal of premium within days is a return of basis under §72(e) and may carry the policy's surrender charge in the early years; a loan leaves the account value in place and accrues interest. The policy form says which is available and when.", authority: { label: "26 U.S.C. §72(e)", url: "https://www.law.cornell.edu/uscode/text/26/72" } },
    { q: "Does the premium pattern make the policy a modified endowment contract?", why: "Premiums above the seven-pay limit in the first seven years make loans and withdrawals taxable and subject to the 10% additional tax before 59½. The carrier's illustration prints the seven-pay limit.", authority: { label: "26 U.S.C. §7702A", url: "https://www.law.cornell.edu/uscode/text/26/7702A" } },
    { q: "How long must the money sit for the trust to be respected?", why: "Sam's dictation says one day, possibly three; the trust instrument and the state's trust law set it, and the attorney confirms it in writing before the first payment.", authority: { label: "The trust instrument; state trust code", url: "" } },
    { q: "Is the trust revocable or irrevocable?", why: "The dictation says revocable. A revocable trust gives no creditor or estate-tax protection and its income is the grantor's; the design question is which purpose the trust serves.", authority: { label: "26 U.S.C. §676 (grantor trusts)", url: "https://www.law.cornell.edu/uscode/text/26/676" } },
  ],
  whatThePageWillDo: "Once the carrier's illustration and the attorney's letter answer these, the Rental Enterprise's trust loop runs the policy year by year with the premium pattern typed from the illustration. Until then the page shows the questions, not a multiplier.",
};

export const INCOME_SOURCES = [
  { label: "26 U.S.C. §408A (Roth IRAs; conversions under §408A(d)(3))", url: "https://www.law.cornell.edu/uscode/text/26/408A" },
  { label: "26 U.S.C. §72 (annuities: the exclusion ratio, §72(q) 10% additional tax on early annuity distributions, §72(e) withdrawals)", url: "https://www.law.cornell.edu/uscode/text/26/72" },
  { label: "26 U.S.C. §7702A (modified endowment contract)", url: "https://www.law.cornell.edu/uscode/text/26/7702A" },
];
