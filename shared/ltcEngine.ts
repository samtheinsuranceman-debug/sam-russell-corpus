// ============================================================
// THE LONG-TERM CARE ENGINE — what care costs where the client lives, how
// much of it people actually need, what a life policy's chronic-illness
// benefit pays toward it, and how that stands beside a standalone policy
// whose premium the client has been quoted. Every figure is either the
// survey's national median (cited, dated), the client's own typed figure
// for their state or their quote, or arithmetic on those.
// ============================================================

export type CareSettingId = "in_home_aide" | "in_home_nurse" | "adult_day" | "assisted_living" | "nursing_semi" | "nursing_private";
export type CareSetting = {
  id: CareSettingId; label: string;
  /** National median, CareScout Cost of Care Survey, July–November 2025. */
  monthly2025: number; annual2025: number; unit: string; basis: string; yoy: number | null;
  /** What the setting is, in the survey's own words. */
  what: string;
  /** What the person keeps and what they give up, stated as attributes rather than a score. */
  keeps: string[]; givesUp: string[];
};
export const COST_OF_CARE_SOURCE = { label: "CareScout (Genworth) Cost of Care Survey, July–November 2025, national medians", url: "https://www.carescout.com/cost-of-care", asOf: "2025", note: "State and metro medians are on the survey's own calculator; the client types their state's figure from it, dated." };

export const CARE_SETTINGS: CareSetting[] = [
  { id: "in_home_aide", label: "Non-medical caregiver at home", monthly2025: 6_673, annual2025: 80_080, unit: "$35 an hour", basis: "44 hours a week, 52 weeks", yoy: 0.03, what: "A home health aide helping with bathing, dressing, transferring and toileting; homemaker and aide services are reported together since 2025.", keeps: ["own home and neighbours", "own schedule and food", "pets", "privacy"], givesUp: ["round-the-clock skilled care", "built-in company", "the house's upkeep is still theirs"] },
  { id: "in_home_nurse", label: "Skilled nurse at home", monthly2025: 390, annual2025: 4_680, unit: "$90 an hour", basis: "1 hour a week as the survey reports it; scale the hours to the need", yoy: null, what: "Licensed nursing in the home for medical tasks beyond an aide's scope.", keeps: ["own home", "medical care without a move"], givesUp: ["cost rises steeply with hours"] },
  { id: "adult_day", label: "Adult day health care", monthly2025: 2_058, annual2025: 24_700, unit: "$95 a day", basis: "annual rate divided by twelve", yoy: -0.05, what: "A community centre by day for adults who need assistance or supervision but not round-the-clock care; health, therapeutic and social services.", keeps: ["home at night", "daily company", "a caregiver's break"], givesUp: ["no evening or overnight cover"] },
  { id: "assisted_living", label: "Assisted living community", monthly2025: 6_200, annual2025: 74_400, unit: "$6,200 a month", basis: "private one-bedroom, monthly fee", yoy: 0.05, what: "A residence with personal care and health services for people who need help with activities of daily living; less than a nursing home provides.", keeps: ["own apartment", "community, dining, activities", "help on call"], givesUp: ["the family home", "some independence of schedule"] },
  { id: "nursing_semi", label: "Nursing home, semi-private room", monthly2025: 9_581, annual2025: 114_975, unit: "$315 a day", basis: "365 days", yoy: 0.02, what: "Twenty-four-hour skilled nursing with personal care, room and board, medication, therapies and rehabilitation.", keeps: ["skilled care at every hour"], givesUp: ["a shared room", "the home", "most privacy"] },
  { id: "nursing_private", label: "Nursing home, private room", monthly2025: 10_798, annual2025: 129_575, unit: "$355 a day", basis: "365 days", yoy: 0.01, what: "The same care with a private room.", keeps: ["skilled care at every hour", "a room of one's own"], givesUp: ["the home", "the highest cost of the six"] },
];
export function careSetting(id: string): CareSetting | null { return CARE_SETTINGS.find((s) => s.id === id) ?? null; }

/** How much care people need, as the federal LongTermCare.gov page states it. */
export const NEED_SOURCE = { label: "LongTermCare.gov (Administration for Community Living): How Much Care Will You Need?", url: "https://acl.gov/ltc/basic-needs/how-much-care-will-you-need" };
export const NEED_STATS = {
  chanceAt65: 0.70, yearsWomen: 3.7, yearsMen: 2.2, shareOverFiveYears: 0.20, shareNever: 1 / 3,
  byType: [
    { type: "Any services", years: 3, share: 0.69 }, { type: "Unpaid care at home only", years: 1, share: 0.59 }, { type: "Paid care at home", years: 0.5, share: 0.42 },
    { type: "Any care at home", years: 2, share: 0.65 }, { type: "Nursing facility", years: 1, share: 0.35 }, { type: "Assisted living", years: 0.5, share: 0.13 },
  ],
};

/** The Code's gate for a chronic-illness benefit and for a qualified long-term care contract. */
export const LTC_LAW = [
  { label: "26 U.S.C. §7702B(c)(2): chronically ill means unable to perform at least two of six activities of daily living (eating, toileting, transferring, bathing, dressing, continence) for at least 90 days, or needing substantial supervision for severe cognitive impairment, certified by a licensed practitioner", url: "https://www.law.cornell.edu/uscode/text/26/7702B" },
  { label: "26 U.S.C. §7702B(d): per-diem benefits are excluded from income up to $175 a day indexed from 1997 (§7702B(d)(4)–(5)); the IRS publishes the year's figure", url: "https://www.law.cornell.edu/uscode/text/26/7702B" },
  { label: "26 U.S.C. §101(g): amounts received under a life insurance contract on the life of a terminally or chronically ill insured are treated as paid by reason of death (accelerated death benefits)", url: "https://www.law.cornell.edu/uscode/text/26/101" },
  { label: "NAIC Long-Term Care Insurance Multistate Rate Review Framework (adopted 2022): the states' common approach to reviewing standalone LTC premium increases", url: "https://content.naic.org/cipr-topics/long-term-care-insurance" },
];

// ─── The rider, from the policy form ────────────────────────────────────────
export type RiderTerms = { deathBenefit: number; monthlyPctOfDeathBenefit: number; maxMonths: number | null; eliminationDays: number; riderChargePerYear: number | null; formName: string; asOf: string };
export type RiderBenefit = { monthly: number; monthsAvailable: number | null; total: number };
/** What the rider pays: the form's monthly percentage of the death benefit, for as many months as the form allows (or until the death benefit is used up). */
export function riderBenefit(r: RiderTerms): RiderBenefit {
  const monthly = r.deathBenefit * (r.monthlyPctOfDeathBenefit / 100);
  if (monthly <= 0) return { monthly: 0, monthsAvailable: 0, total: 0 };
  const byBenefit = Math.floor(r.deathBenefit / monthly);
  const months = r.maxMonths == null ? byBenefit : Math.min(r.maxMonths, byBenefit);
  return { monthly, monthsAvailable: months, total: monthly * months };
}

/** A setting's cost escalated by a yearly rate (the survey's own year-over-year, or the CPI medical-care ladder) to a future year. */
export function escalate(monthly: number, ratePerYear: number, years: number): number { return monthly * Math.pow(1 + ratePerYear, Math.max(0, years)); }

export type CoverageLine = { setting: CareSetting; monthlyCostNow: number; monthlyCostThen: number; yearsOfNeed: number; totalCost: number; riderMonthly: number; riderMonths: number | null; riderTotal: number; covered: number; shortfall: number; monthsCoveredAtCost: number | null; stateFigureUsed: boolean };
export type PersonPlan = { label: string; sex: "female" | "male" | "unspecified"; yearsUntilCare: number; yearsOfNeed: number | null; rider: RiderTerms | null; stateMonthly: Partial<Record<CareSettingId, number>> };

/** For one person: each setting's cost over the years of need (escalated to when care starts), the rider's benefit against it, the shortfall. Years of need default to the federal page's figure by sex. */
export function coverageFor(p: PersonPlan, escalationRate: number): CoverageLine[] {
  const yearsOfNeed = p.yearsOfNeed ?? (p.sex === "female" ? NEED_STATS.yearsWomen : p.sex === "male" ? NEED_STATS.yearsMen : 3);
  const rb = p.rider ? riderBenefit(p.rider) : { monthly: 0, monthsAvailable: 0, total: 0 };
  return CARE_SETTINGS.map((s) => {
    const stateFigure = p.stateMonthly[s.id];
    const monthlyCostNow = stateFigure ?? s.monthly2025;
    const monthlyCostThen = escalate(monthlyCostNow, escalationRate, p.yearsUntilCare);
    const months = Math.round(yearsOfNeed * 12);
    const totalCost = monthlyCostThen * months;
    const riderMonths = rb.monthsAvailable == null ? null : Math.min(rb.monthsAvailable, months);
    const covered = Math.min(totalCost, rb.monthly * (riderMonths ?? months));
    return { setting: s, monthlyCostNow, monthlyCostThen, yearsOfNeed, totalCost, riderMonthly: rb.monthly, riderMonths: rb.monthsAvailable, riderTotal: rb.total, covered, shortfall: Math.max(0, totalCost - covered), monthsCoveredAtCost: monthlyCostThen > 0 ? Math.floor(rb.total / monthlyCostThen) : null, stateFigureUsed: stateFigure != null };
  });
}

/** Standalone policy beside the rider: both figures typed from the quote and the illustration; the page prints the ratio and nothing else. */
export type PremiumCompare = { standalonePremiumPerYear: number | null; standaloneBenefitMonthly: number | null; standaloneBenefitMonths: number | null; riderChargePerYear: number | null; riderMonthly: number; riderMonths: number | null };
export function premiumCompare(c: PremiumCompare): { ratio: number | null; standaloneTotalBenefit: number | null; riderTotalBenefit: number | null; note: string } {
  const ratio = c.standalonePremiumPerYear && c.riderChargePerYear != null && c.standalonePremiumPerYear > 0 ? c.riderChargePerYear / c.standalonePremiumPerYear : null;
  const st = c.standaloneBenefitMonthly != null && c.standaloneBenefitMonths != null ? c.standaloneBenefitMonthly * c.standaloneBenefitMonths : null;
  const rt = c.riderMonths != null ? c.riderMonthly * c.riderMonths : null;
  return { ratio, standaloneTotalBenefit: st, riderTotalBenefit: rt, note: "Both premiums are the figures you were quoted; the ratio is arithmetic on them. A rider's benefit reduces the death benefit dollar for dollar as it is paid; a standalone policy's premium can be raised with state approval, and the standalone benefit is usually indexed while a rider's is a share of a level death benefit. Neither is 'cheaper' until both quotes are on the table." };
}

/** Where the client types their state's figures from. */
export const STATE_FIGURE_PROTOCOL = [
  "Open the survey's calculator, choose the state (or metro), and read the monthly median for each setting.",
  "Type each figure on the plan with the survey year. The page uses it in place of the national median and marks the row.",
  "For the home-care line, set the weekly hours the family expects; the survey's median assumes 44.",
  "Open the policy's chronic-illness or accelerated-benefit rider form and copy the monthly percentage of the death benefit, the maximum months, the elimination period and the rider's annual charge.",
  "If a standalone long-term care quote exists, type its annual premium, monthly benefit and benefit period; the page prints both side by side.",
];

export const LTC_SOURCES = [COST_OF_CARE_SOURCE, NEED_SOURCE, ...LTC_LAW];
