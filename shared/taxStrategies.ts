// ============================================================
// THE STRATEGY CATALOGUE — the families behind the site's hundred named
// combinations, each tied to the statute it rests on and to the 2026
// parameters as verified on 2026-09-06 from primary sources (IRS revenue
// procedures and notices, the enacted One Big Beautiful Bill Act, Treasury
// regulations, the Code on LII). Every number carries its citation. Where a
// figure could not be verified from a primary source it is marked and the
// engine will not size a step on it.
//
// A family says: what it does to the return (kind), how it is sized, what
// it needs first, how often it can be used, what can go wrong, and how much
// authority stands behind it (the panel in server/taxSources.ts). The
// scheduler (shared/taxSchedule.ts) composes families into a year-by-year
// plan for one client; the site's named combinations (client/src/data/
// strategies.json) map onto these families by keyword.
// ============================================================

export type Kind =
  | "ordinary_deduction"     // reduces ordinary taxable income this year
  | "above_the_line"          // reduces AGI
  | "deferral"                // pushes income or gain to a later year
  | "exclusion"               // removes gain or income from tax
  | "conversion"              // moves money from pre-tax to tax-free (raises income now)
  | "credit"                  // reduces tax directly
  | "rate_arbitrage"          // shifts income to a lower-rate taxpayer or character
  | "transfer"                // moves assets out of the estate
  | "shelter"                 // tax-free growth vehicle funded with after-tax dollars
  | "structure";              // entity or election that changes how other items are taxed

export type Repeat = "annual" | "once" | "episodic";

export type Param = { value: number | string; unit?: string; source: string; verified: boolean };

export type StrategyFamily = {
  id: string; name: string; kind: Kind; repeat: Repeat;
  statute: string;                 // the IRC sections
  summary: string;                 // one paragraph, plain words
  params: Record<string, Param>;   // the 2026 numbers with citations
  requires: string[];              // facts the profile must have for this to be sizeable
  goals: string[];                 // which client goals it serves
  risks: string[];                 // what can go wrong, in words
  authorityWeight: number;         // 0..1: how settled the law is (statute + regs = 1; regulatory and contested < 1)
  siteKeywords: string[];          // words in the site's combination titles that map to this family
  citations: string[];
};

const RP2532 = "IRS Rev. Proc. 2025-32 (2026 inflation adjustments), irs.gov/pub/irs-drop/rp-25-32.pdf";
const N2567 = "IRS Notice 2025-67 (2026 retirement plan limits), irs.gov/pub/irs-drop/n-25-67.pdf";
const OBBBA = "One Big Beautiful Bill Act, Pub. L. 119-21 (July 4, 2025), congress.gov/bill/119th-congress/house-bill/1/text";
const CRS = "CRS R48550, Tax Provisions in H.R. 1 (One Big Beautiful Bill Act)";
const LII = (s: string) => `26 U.S.C. §${s} (law.cornell.edu/uscode/text/26/${s.split("(")[0]})`;

export const FAMILIES: StrategyFamily[] = [
  {
    id: "retirement_max", name: "Retirement plan maximisation (401(k), 403(b), profit sharing)", kind: "above_the_line", repeat: "annual",
    statute: "IRC §§402(g), 415(c), 414(v), 401(a)(17)",
    summary: "Fill every pre-tax deferral the plan allows. The first dollar of headroom goes here because it needs no structure, carries no audit risk and compounds untaxed.",
    params: {
      deferral: { value: 24_500, unit: "$", source: N2567, verified: true },
      catchUp50: { value: 8_000, unit: "$", source: N2567, verified: true },
      catchUp60to63: { value: 11_250, unit: "$", source: N2567, verified: true },
      annualAdditions: { value: 72_000, unit: "$", source: N2567, verified: true },
      compensationLimit: { value: 360_000, unit: "$", source: N2567, verified: true },
      simple: { value: 17_000, unit: "$", source: N2567, verified: true },
      ira: { value: 7_500, unit: "$", source: "IRS, 401(k) limit increases to $24,500 for 2026; IRA limit $7,500", verified: true },
    },
    requires: ["earned income", "plan access or a practice that can sponsor one"], goals: ["lower this year's tax", "tax-deferred growth", "retirement"],
    risks: ["Employer plan terms cap what an employee can defer; a solo or practice plan is needed to reach the §415(c) ceiling"], authorityWeight: 1,
    siteKeywords: ["401(k)", "profit sharing"], citations: [N2567],
  },
  {
    id: "cash_balance", name: "Cash balance / defined benefit plan", kind: "above_the_line", repeat: "annual",
    statute: "IRC §§415(b), 404(a), 412; ERISA",
    summary: "A practice-sponsored defined benefit plan funds an actuarially determined benefit up to the §415(b) limit, often six figures a year of deduction for an owner in their fifties, on top of the 401(k).",
    params: { maxAnnualBenefit: { value: 290_000, unit: "$ a year at retirement", source: N2567, verified: true }, compensationLimit: { value: 360_000, unit: "$", source: N2567, verified: true } },
    requires: ["practice or business ownership", "stable cash flow for the funding commitment"], goals: ["lower this year's tax", "retirement", "tax-deferred growth"],
    risks: ["Funding is a multi-year commitment; employees must be covered under nondiscrimination rules; an actuary sets the amount, not the client"], authorityWeight: 1,
    siteKeywords: ["Defined Benefit", "DB"], citations: [N2567, LII("415")],
  },
  {
    id: "hsa", name: "Health savings account", kind: "above_the_line", repeat: "annual",
    statute: "IRC §223",
    summary: "Deductible in, tax-free growth, tax-free out for medical costs: the only triple-exempt account. Pay medical costs from cash and let the account compound.",
    params: { selfOnly: { value: 4_400, unit: "$", source: "IRS Rev. Proc. 2025-19, irs.gov/pub/irs-drop/rp-25-19.pdf", verified: true }, family: { value: 8_750, unit: "$", source: "IRS Rev. Proc. 2025-19", verified: true }, catchUp55: { value: 1_000, unit: "$", source: "IRC §223(b)(3)", verified: true }, hdhpMinDeductibleSelf: { value: 1_700, unit: "$", source: "IRS Rev. Proc. 2025-19", verified: true }, hdhpMinDeductibleFamily: { value: 3_400, unit: "$", source: "IRS Rev. Proc. 2025-19", verified: true } },
    requires: ["high-deductible health plan"], goals: ["lower this year's tax", "tax-free growth", "medical costs in retirement"], risks: ["Only with a qualifying HDHP; no other disqualifying coverage"], authorityWeight: 1,
    siteKeywords: ["HSA"], citations: ["IRS Rev. Proc. 2025-19"],
  },
  {
    id: "oil_gas_idc", name: "Oil and gas working interest: intangible drilling costs and depletion", kind: "ordinary_deduction", repeat: "annual",
    statute: "IRC §§263(c), 469(c)(3), 613A, 57(a)(2)",
    summary: "A direct working interest lets the investor expense intangible drilling costs in the year drilled under the §263(c) election, and the §469(c)(3) exception keeps the loss out of the passive basket so it offsets W-2 and practice income. Percentage depletion at 15% then shelters part of the production income. The size flexes every year to the headroom left after the plan contributions.",
    params: {
      idcElection: { value: "expense in year paid or incurred", source: LII("263"), verified: true },
      idcShareOfInvestment: { value: "70–85% typical, not a safe harbor; the actual invoice controls", source: "Industry underwriting range; not an IRS figure", verified: false },
      passiveException: { value: "working interest held directly or through an entity that does not limit liability", source: LII("469"), verified: true },
      depletionRate: { value: 15, unit: "% of gross income from the property", source: LII("613A"), verified: true },
      depletionTaxableIncomeLimit: { value: 65, unit: "% of taxable income", source: LII("613A"), verified: true },
      depletionPropertyLimit: { value: 100, unit: "% of net income from the property", source: LII("613A"), verified: true },
      amt: { value: "excess IDC is an AMT preference under §57(a)(2), with the 40%-of-AMTI exception", source: LII("57"), verified: true },
    },
    requires: ["risk capacity for a drilling program", "willingness to hold an unlimited-liability working interest (general partner form)"], goals: ["lower this year's tax", "zero federal tax this year", "income shelter"],
    risks: ["Dry holes and price risk are real; the deduction is only as good as the program; unlimited liability in the working-interest form; AMT preference; §461(l) excess business loss cap applies to the net loss"], authorityWeight: 0.95,
    siteKeywords: ["Oil", "Gas", "drilling", "depletion"], citations: [LII("263"), LII("469"), LII("613A")],
  },
  {
    id: "bonus_depreciation", name: "100% bonus depreciation and §179 on business and real property (cost segregation)", kind: "ordinary_deduction", repeat: "episodic",
    statute: "IRC §§168(k), 179, 469",
    summary: "OBBBA restored 100% first-year depreciation for property acquired after January 19, 2025 and made it permanent; a cost segregation study reclassifies parts of a building into 5-, 7- and 15-year property that qualifies. For rental real estate the loss is passive unless the owner qualifies as a real estate professional or the short-term-rental exception applies.",
    params: {
      bonusRate: { value: 100, unit: "%", source: `${OBBBA} §70301, amending IRC §168(k)`, verified: true },
      bonusAcquiredAfter: { value: "2025-01-19", source: `${OBBBA} §70301`, verified: true },
      s179Limit: { value: 2_560_000, unit: "$", source: RP2532, verified: true },
      s179PhaseOutStart: { value: 4_090_000, unit: "$", source: RP2532, verified: true },
      s179Suv: { value: 32_000, unit: "$", source: RP2532, verified: true },
    },
    requires: ["a purchase of qualifying property or a building to segregate"], goals: ["lower this year's tax", "real estate"],
    risks: ["Depreciation recapture on sale; passive-loss rules unless material participation or REPS; §461(l) cap; state decoupling"], authorityWeight: 1,
    siteKeywords: ["Cost Segregation", "Depreciation", "Short-Term Rental"], citations: [`${OBBBA} §70301`, RP2532],
  },
  {
    id: "str_loophole", name: "Short-term rental with material participation", kind: "ordinary_deduction", repeat: "episodic",
    statute: "Treas. Reg. §1.469-1T(e)(3)(ii)(A); IRC §469",
    summary: "A rental with an average stay of seven days or less is not a 'rental activity' under the §469 regulations, so with material participation (for example the 100-hour-and-more-than-anyone test) its depreciation loss, including cost segregation and bonus, offsets ordinary income without real-estate-professional status.",
    params: { averageStay: { value: 7, unit: "days or less", source: "Treas. Reg. §1.469-1T(e)(3)(ii)(A)", verified: true }, materialParticipation: { value: "one of the seven tests in Treas. Reg. §1.469-5T(a); commonly 100 hours and more than any other individual", source: "Treas. Reg. §1.469-5T(a)", verified: true } },
    requires: ["a property that can be run as a short-term rental", "hours the client will actually log"], goals: ["lower this year's tax", "real estate"],
    risks: ["Hours must be contemporaneously documented; personal use days; local ordinances; recapture on sale"], authorityWeight: 0.85,
    siteKeywords: ["Short-Term Rental"], citations: ["Treas. Reg. §1.469-1T(e)(3)", "Treas. Reg. §1.469-5T"],
  },
  {
    id: "roth_conversion", name: "Roth conversion (including backdoor and mega-backdoor)", kind: "conversion", repeat: "annual",
    statute: "IRC §§408A, 402A, 408(d)",
    summary: "Move pre-tax retirement money to Roth in a year with room below a chosen bracket, paying tax now so the growth is never taxed again. It goes last in the year's order because every deduction above it lowers its cost, and it is sized to the top of the target bracket.",
    params: {
      bracket24Single: { value: 201_775, unit: "$ taxable income", source: RP2532, verified: true },
      bracket24Joint: { value: 403_550, unit: "$ taxable income", source: RP2532, verified: true },
      bracket32Single: { value: 256_225, unit: "$", source: RP2532, verified: true },
      bracket32Joint: { value: 512_450, unit: "$", source: RP2532, verified: true },
      bracket35Single: { value: 640_600, unit: "$", source: RP2532, verified: true },
      bracket35Joint: { value: 768_700, unit: "$", source: RP2532, verified: true },
      irmaaSingleFirstTier: { value: 109_000, unit: "$ MAGI (2024 income for 2026 premiums)", source: "SSA, 2026 Medicare premiums, ssa.gov/benefits/medicare/medicare-premiums.html", verified: true },
      irmaaJointFirstTier: { value: 218_000, unit: "$ MAGI", source: "SSA, 2026 Medicare premiums", verified: true },
    },
    requires: ["pre-tax retirement balances"], goals: ["tax-free retirement", "lower lifetime tax", "estate"],
    risks: ["Tax is due now; IRMAA two years later; the pro-rata rule for backdoor conversions when other IRA money exists"], authorityWeight: 1,
    siteKeywords: ["Roth"], citations: [RP2532, "SSA 2026 IRMAA tables"],
  },
  {
    id: "qsbs", name: "Qualified small business stock exclusion", kind: "exclusion", repeat: "once",
    statute: "IRC §1202 as amended by OBBBA §70431",
    summary: "Stock in a C corporation issued after July 4, 2025 and held three, four or five years excludes 50%, 75% or 100% of gain, up to the greater of $15 million (indexed) or ten times basis; the issuer's gross assets must be $75 million or less at issuance.",
    params: {
      tiers: { value: "50% at 3 years, 75% at 4, 100% at 5 (stock issued after July 4, 2025)", source: `${OBBBA} §70431`, verified: true },
      perIssuerCap: { value: 15_000_000, unit: "$ (indexed)", source: `${OBBBA} §70431`, verified: true },
      grossAssetsTest: { value: 75_000_000, unit: "$", source: `${OBBBA} §70431`, verified: true },
      tenTimesBasis: { value: "greater of the cap or 10× basis", source: LII("1202"), verified: true },
    },
    requires: ["a C corporation that meets the active-business test", "original issuance"], goals: ["exit", "capital gains"], risks: ["Service businesses (health, law, consulting) are excluded businesses under §1202(e)(3); redemptions and entity conversions can taint the stock"], authorityWeight: 1,
    siteKeywords: ["QSBS", "1202"], citations: [`${OBBBA} §70431`, LII("1202")],
  },
  {
    id: "like_kind", name: "1031 exchange (including Delaware statutory trusts)", kind: "deferral", repeat: "episodic",
    statute: "IRC §1031; Treas. Reg. §1.1031(k)-1",
    summary: "Defer the gain on investment real estate by exchanging into replacement real property: identify within 45 days, close within 180. A DST interest counts as real property, which lets a landlord exchange into passive institutional real estate.",
    params: { identification: { value: 45, unit: "days", source: "Treas. Reg. §1.1031(k)-1", verified: true }, completion: { value: 180, unit: "days (or the return due date)", source: "Treas. Reg. §1.1031(k)-1", verified: true }, scope: { value: "real property held for business or investment only", source: LII("1031"), verified: true } },
    requires: ["appreciated investment real estate being sold"], goals: ["capital gains", "real estate", "estate (basis step-up at death)"], risks: ["Boot is taxed; the qualified intermediary must hold the proceeds; DST illiquidity and sponsor fees"], authorityWeight: 1,
    siteKeywords: ["1031", "DST"], citations: [LII("1031"), "Treas. Reg. §1.1031(k)-1"],
  },
  {
    id: "opportunity_zone", name: "Qualified Opportunity Zone fund", kind: "deferral", repeat: "episodic",
    statute: "IRC §§1400Z-1, 1400Z-2 as made permanent by OBBBA §111102 (the Act's placement)",
    summary: "Roll a capital gain into a qualified opportunity fund within 180 days: the gain is deferred, the basis steps up 10% after five years (30% for a qualified rural opportunity fund), and appreciation on the fund interest is excluded after ten years. New ten-year zone designations begin in 2027; the original designations end December 31, 2026.",
    params: { deferralWindow: { value: 180, unit: "days from the gain", source: LII("1400Z-2"), verified: true }, fiveYearStepUp: { value: 10, unit: "%", source: `${CRS}; ${OBBBA}`, verified: true }, ruralStepUp: { value: 30, unit: "%", source: `${CRS}; ${OBBBA}`, verified: true }, tenYearExclusion: { value: "appreciation excluded after 10 years", source: `${CRS}`, verified: true }, newDesignations: { value: "10-year designations from January 1, 2027; deferral for post-2026 investments ends December 31, 2033 at the latest", source: `${CRS}`, verified: true }, originalDesignationsEnd: { value: "2026-12-31", source: `${CRS}`, verified: true } },
    requires: ["a realised capital gain"], goals: ["capital gains", "exit"], risks: ["Fund quality; ten-year lock-up; a 2026 investment sits under the original rules, not the new rural step-up"], authorityWeight: 1,
    siteKeywords: ["Opportunity Zone", "OZ"], citations: [CRS, OBBBA],
  },
  {
    id: "daf_bunching", name: "Donor-advised fund bunching", kind: "ordinary_deduction", repeat: "episodic",
    statute: "IRC §170 as amended by OBBBA §§70425–70427, §70112 (new §68)",
    summary: "Give several years of charity in one high-income year, ideally appreciated stock, through a donor-advised fund, and clear the new 0.5%-of-AGI floor once instead of every year. For a 37%-bracket taxpayer the deduction is worth 35 cents on the dollar under the new §68.",
    params: { floor: { value: 0.5, unit: "% of contribution base", source: `${OBBBA} §70425, IRC §170(b)(1)(I); ${CRS}`, verified: true }, cashLimit: { value: 60, unit: "% of AGI", source: `${OBBBA} §70426`, verified: true }, appreciatedPropertyLimit: { value: 30, unit: "% of AGI", source: LII("170"), verified: true }, topBracketValue: { value: 35, unit: "cents per dollar for 37%-bracket taxpayers", source: `${OBBBA} §70112, new IRC §68; ${CRS}`, verified: true }, nonItemizer: { value: "1,000 single / 2,000 joint", unit: "$", source: `${OBBBA} §70427, IRC §170(p)`, verified: true } },
    requires: ["charitable intent"], goals: ["charity", "lower this year's tax"], risks: ["Irrevocable; the floor and the §68 haircut reduce the value; appreciated-property limit 30% of AGI"], authorityWeight: 1,
    siteKeywords: ["Charitable", "DAF"], citations: [CRS, OBBBA],
  },
  {
    id: "crt", name: "Charitable remainder trust (CRUT / NIMCRUT)", kind: "deferral", repeat: "once",
    statute: "IRC §664; Treas. Reg. §1.664-3",
    summary: "Contribute an appreciated asset before sale: the trust sells it untaxed, pays the donor an income stream for life or a term, and the remainder goes to charity. The donor gets a deduction for the remainder's present value (at least 10% of the contribution) and spreads the gain over the payout years. A NIMCRUT defers the payout until the trust has income.",
    params: { remainderMinimum: { value: 10, unit: "% of the initial value", source: LII("664"), verified: true }, payoutRange: { value: "5% to 50% of trust value a year", source: LII("664"), verified: true }, section7520: { value: "the month's §7520 rate sets the deduction", source: LII("7520"), verified: true } },
    requires: ["an appreciated asset to sell", "charitable intent"], goals: ["capital gains", "charity", "income"], risks: ["Irrevocable; the remainder really goes to charity; payout taxed under the four-tier rule"], authorityWeight: 1,
    siteKeywords: ["NIMCRUT", "CRUT", "Charitable Remainder"], citations: [LII("664")],
  },
  {
    id: "clat", name: "Charitable lead annuity trust", kind: "transfer", repeat: "once",
    statute: "IRC §§170(f)(2)(B), 2522, 2055, 7520",
    summary: "The trust pays charity an annuity for a term and the remainder passes to heirs; at a low §7520 rate the remainder can pass with little or no gift tax. A grantor CLAT gives an up-front income tax deduction with the trust's income taxed to the grantor.",
    params: { section7520: { value: "monthly IRS rate", source: LII("7520"), verified: true } },
    requires: ["charitable intent", "assets to move to heirs"], goals: ["estate", "charity"], risks: ["Grantor CLAT income is taxed back to the grantor; the annuity must be paid whatever the trust earns"], authorityWeight: 1,
    siteKeywords: ["Charitable Lead", "CLAT"], citations: [LII("2522")],
  },
  {
    id: "qcd", name: "Qualified charitable distribution", kind: "exclusion", repeat: "annual",
    statute: "IRC §408(d)(8)",
    summary: "From age 70½, give straight from the IRA to charity: the amount never enters income, satisfies the required minimum distribution, and sidesteps the 0.5% floor and the §68 haircut.",
    params: { limit: { value: "indexed annual limit; 2026 figure to be confirmed against the IRS publication", source: LII("408"), verified: false }, age: { value: 70.5, unit: "years", source: LII("408"), verified: true } },
    requires: ["age 70½", "IRA balance"], goals: ["charity", "retirement"], risks: ["Direct transfer only"], authorityWeight: 1, siteKeywords: ["QCD"], citations: [LII("408")],
  },
  {
    id: "captive_831b", name: "Micro-captive insurance company (§831(b))", kind: "ordinary_deduction", repeat: "once",
    statute: "IRC §831(b); Treas. Reg. §§1.6011-10, 1.6011-11 (T.D. 10029, Jan. 14, 2025)",
    summary: "The operating business insures real risks with its own licensed insurance company, deducting premiums up to the §831(b) ceiling while the captive is taxed only on investment income. Since January 2025 the arrangement is a listed transaction if its loss ratio is below 30% over ten years with related-party financing, and a transaction of interest below 60%: it must be run as insurance, not as a deduction.",
    params: { premiumLimit2026: { value: 2_900_000, unit: "$", source: RP2532, verified: true }, listedLossRatio: { value: 30, unit: "% (with the financing factor)", source: "T.D. 10029; IRS IRB 2025-09", verified: true }, transactionOfInterestLossRatio: { value: 60, unit: "%", source: "T.D. 10029; IRS IRB 2025-09", verified: true } },
    requires: ["an operating business with insurable risks", "premiums that an actuary can justify"], goals: ["risk management", "lower this year's tax"], risks: ["Listed-transaction disclosure and audit; the IRS has won the recent Tax Court cases on captives that were not insurance; formation and annual costs"], authorityWeight: 0.6,
    siteKeywords: ["Captive"], citations: [RP2532, "T.D. 10029"],
  },
  {
    id: "iul_recycling", name: "Cash-value life insurance funded from home equity (mortgage recycling with IUL)", kind: "shelter", repeat: "annual",
    statute: "IRC §§7702, 7702A, 72(e), 101(a), 163(h)(3)",
    summary: "Borrow against home equity to fund a non-MEC indexed universal life policy inside the §7702 limits; growth is tax-deferred, basis comes out first and policy loans are not income while the policy stays in force, and the death benefit is tax-free. Since OBBBA the interest on home-equity debt is permanently non-deductible unless the proceeds buy, build or improve the home, so the arbitrage is between the loan rate and the policy's net crediting rate, not a tax deduction.",
    params: { mecTest: { value: "7-pay test under §7702A", source: LII("7702A"), verified: true }, distributions: { value: "basis first for a non-MEC; loans not income while in force", source: LII("72"), verified: true }, homeEquityInterest: { value: "not deductible (permanent; acquisition debt limit $750,000)", source: `${OBBBA} §70403, IRC §163(h)(3)(F); ${CRS}`, verified: true }, deathBenefit: { value: "excluded from income", source: LII("101"), verified: true } },
    requires: ["home equity and a lender", "insurability", "a policy illustrated at conservative rates"], goals: ["tax-free growth", "estate", "protection"], risks: ["Policy costs and caps; a lapse makes loans taxable; the HELOC rate can exceed the crediting rate; the interest is not deductible; MEC if overfunded"], authorityWeight: 0.8,
    siteKeywords: ["IUL", "HELOC", "Mortgage", "Infinite", "Premium Financing", "Arbitrage", "Velocity"], citations: [LII("7702"), LII("72"), CRS],
  },
  {
    id: "exec_bonus_162", name: "Section 162 executive bonus plan", kind: "rate_arbitrage", repeat: "annual",
    statute: "IRC §§162(a), 61; Treas. Reg. §1.162-7; Rev. Rul. 58-90",
    summary: "The practice pays a bonus that funds a permanent life policy the owner-employee owns; the practice deducts reasonable compensation under §162, the employee reports the bonus as income, and the policy's growth and death benefit follow §§7702 and 101. A 'double bonus' grosses up the tax. Simple, no ERISA plan, selective.",
    params: { deduction: { value: "ordinary and necessary compensation, reasonable in amount", source: LII("162"), verified: true }, income: { value: "taxable to the employee when paid", source: LII("61"), verified: true } },
    requires: ["a practice entity that pays the owner as an employee", "insurability"], goals: ["tax-free growth", "protection", "retention"], risks: ["The bonus is taxed to the employee now; policy costs; reasonable-compensation limits for owner-employees"], authorityWeight: 0.9,
    siteKeywords: ["Section 162", "Executive Bonus", "162 Bonus"], citations: [LII("162")],
  },
  {
    id: "ppli", name: "Private placement life insurance and annuities", kind: "shelter", repeat: "once",
    statute: "IRC §§7702, 817(h), 72(e)",
    summary: "Institutional-cost variable life or annuity contracts holding diversified investment accounts; growth is tax-deferred (tax-free at death) if the contract meets §7702 and the §817(h) diversification and investor-control rules.",
    params: { diversification: { value: "no more than 55/70/80/90% in one to four investments", source: LII("817"), verified: true } },
    requires: ["accredited-investor status and typically $1 million or more of premium"], goals: ["tax-free growth", "estate"], risks: ["Investor-control doctrine; carrier and fund costs; illiquidity"], authorityWeight: 0.8,
    siteKeywords: ["PPLI"], citations: [LII("817")],
  },
  {
    id: "slat", name: "Spousal lifetime access trust", kind: "transfer", repeat: "once",
    statute: "IRC §§2010, 2503, 2523, 671–677",
    summary: "One spouse gifts assets to an irrevocable trust for the other spouse and descendants, using exemption now while keeping indirect access; growth is outside both estates.",
    params: { basicExclusion2026: { value: 15_000_000, unit: "$ per person (indexed)", source: "IRS, What's new — estate and gift tax; IRB 2026-29", verified: true }, annualExclusion2026: { value: 19_000, unit: "$ per donee", source: "IRS, IRB 2026-29", verified: true }, gst2026: { value: 15_000_000, unit: "$", source: "IRS, IRB 2026-29", verified: true } },
    requires: ["assets beyond lifetime needs", "a stable marriage"], goals: ["estate"], risks: ["Divorce or death of the beneficiary spouse removes access; reciprocal-trust doctrine if both spouses do it identically"], authorityWeight: 1,
    siteKeywords: ["SLAT", "BLAT", "PLAT", "Dynasty", "ILIT", "Multi-Gen"], citations: ["IRS IRB 2026-29"],
  },
  {
    id: "idgt", name: "Intentionally defective grantor trust sale", kind: "transfer", repeat: "once",
    statute: "IRC §§671–677, 2036, 7872; Rev. Rul. 85-13",
    summary: "Sell appreciating assets to a grantor trust for a note at the applicable federal rate; no gain on the sale, the grantor pays the trust's income tax (a further tax-free gift), and growth above the note rate leaves the estate.",
    params: { afr: { value: "monthly applicable federal rate", source: LII("7872"), verified: true } },
    requires: ["appreciating assets", "seed gift of about 10% of the sale"], goals: ["estate"], risks: ["Valuation; the note must be real; §2036 if the grantor keeps control"], authorityWeight: 0.9,
    siteKeywords: ["IDGT"], citations: ["Rev. Rul. 85-13", LII("7872")],
  },
  {
    id: "esop_1042", name: "ESOP sale with §1042 rollover", kind: "deferral", repeat: "once",
    statute: "IRC §1042",
    summary: "Sell C-corporation stock to an employee stock ownership plan owning at least 30% afterwards and reinvest in qualified replacement property within the window; the gain is deferred, and stepped up at death.",
    params: { esopOwnership: { value: 30, unit: "% after the sale", source: LII("1042"), verified: true }, replacementWindow: { value: "3 months before to 12 months after the sale", source: LII("1042"), verified: true } },
    requires: ["a C corporation (or one that can convert)", "a business large enough to carry an ESOP"], goals: ["exit", "capital gains", "succession"], risks: ["ESOP costs and fiduciary duties; the replacement securities are locked to keep the deferral"], authorityWeight: 1,
    siteKeywords: ["ESOP", "1042"], citations: [LII("1042")],
  },
  {
    id: "qbi_199a", name: "Qualified business income deduction optimisation", kind: "ordinary_deduction", repeat: "annual",
    statute: "IRC §199A as made permanent by OBBBA",
    summary: "The 20% deduction phases out for specified service businesses (medicine included) above the threshold; entity choice, retirement contributions and cost segregation that pull taxable income under the threshold restore it.",
    params: { rate: { value: 20, unit: "%", source: `${OBBBA}; ${RP2532}`, verified: true }, thresholdSingle: { value: 201_775, unit: "$ taxable income", source: RP2532, verified: true }, thresholdJoint: { value: 403_500, unit: "$", source: RP2532, verified: true }, phaseInSingle: { value: 75_000, unit: "$", source: RP2532, verified: true }, phaseInJoint: { value: 150_000, unit: "$", source: RP2532, verified: true }, minimum: { value: 400, unit: "$ with at least $1,000 of QBI", source: RP2532, verified: true } },
    requires: ["pass-through business income"], goals: ["lower this year's tax"], risks: ["SSTB status; wage and property limits above the threshold"], authorityWeight: 1,
    siteKeywords: ["199A", "QBI"], citations: [RP2532],
  },
  {
    id: "ptet", name: "Pass-through entity tax election (SALT workaround)", kind: "ordinary_deduction", repeat: "annual",
    statute: "IRC §164(b)(6); state PTET statutes; IRS Notice 2020-75",
    summary: "The practice entity elects to pay state income tax at the entity level and deducts it in full, so the owner is not held to the individual SALT cap. The 2026 cap is $40,400 and phases down 30% of MAGI above $505,000 to a $10,000 floor, so high earners lose the cap anyway and PTET is what remains.",
    params: { saltCap2026: { value: 40_400, unit: "$", source: "IRS 2026 inflation adjustments (as recorded in shared/taxRules.ts TAX_RULES_2026)", verified: true }, phaseDownStart: { value: 505_000, unit: "$ MAGI", source: "IRS 2026 inflation adjustments", verified: true }, phaseDownRate: { value: 30, unit: "% of MAGI above the start", source: OBBBA, verified: true }, floor: { value: 10_000, unit: "$", source: OBBBA, verified: true }, entityDeduction: { value: "deductible at the entity level (Notice 2020-75); not repealed by OBBBA", source: "IRS Notice 2020-75", verified: true } },
    requires: ["a partnership or S corporation in a PTET state"], goals: ["lower this year's tax"], risks: ["State election deadlines; state credit mechanics; West Virginia enacted a PTET in 2023 (confirm current terms)"], authorityWeight: 0.9,
    siteKeywords: ["PTET", "SALT"], citations: ["IRS Notice 2020-75", OBBBA],
  },
  {
    id: "augusta", name: "The Augusta rule (14-day home rental to the practice)", kind: "exclusion", repeat: "annual",
    statute: "IRC §280A(g)",
    summary: "Rent the home to the practice for up to fourteen days a year for real meetings at a documented market rate: the business deducts the rent and the owner excludes it.",
    params: { days: { value: 14, unit: "days or fewer", source: LII("280A"), verified: true } },
    requires: ["a business that can hold meetings", "market-rate documentation"], goals: ["lower this year's tax"], risks: ["Substance: real meetings, real rate, invoices; the IRS has denied inflated arrangements"], authorityWeight: 0.85,
    siteKeywords: ["Augusta", "280A"], citations: [LII("280A")],
  },
  {
    id: "employ_children", name: "Employing the children", kind: "rate_arbitrage", repeat: "annual",
    statute: "IRC §§3121(b)(3), 3306(c)(5), 63(c)",
    summary: "Real work at a real wage from the parents' sole proprietorship or spousal partnership: no FICA under 18, no FUTA under 21, deductible to the practice, and tax-free to the child up to the standard deduction, which then funds a Roth IRA.",
    params: { ficaExempt: { value: "under 18, parent's sole proprietorship or partnership of parents only", source: LII("3121"), verified: true }, futaExempt: { value: "under 21", source: LII("3306"), verified: true }, standardDeductionSingle2026: { value: 16_100, unit: "$", source: "IRS, 2026 inflation adjustments news release", verified: true } },
    requires: ["children", "a non-corporate employer (or an S corporation paying through a family management company)"], goals: ["lower this year's tax", "family"], risks: ["The work and the wage must be real and documented; state child-labor law"], authorityWeight: 1,
    siteKeywords: ["Children", "Family"], citations: [LII("3121")],
  },
  {
    id: "research_174a", name: "Domestic research expensing (§174A)", kind: "ordinary_deduction", repeat: "annual",
    statute: "IRC §174A added by OBBBA §70302",
    summary: "Domestic research costs are deductible again from tax years beginning after December 31, 2024; a small business (gross receipts of $31 million or less) can elect to apply it back to 2022–2024 and deduct the unamortised balance over one or two years.",
    params: { effective: { value: "tax years beginning after 2024-12-31", source: `${OBBBA} §70302; ${CRS}`, verified: true }, smallBusinessReceipts: { value: 31_000_000, unit: "$ average annual gross receipts", source: CRS, verified: true }, catchUp: { value: "unamortised 2022–2024 amounts over one or two years", source: CRS, verified: true } },
    requires: ["qualifying research activity in the business"], goals: ["lower this year's tax"], risks: ["Foreign research still amortised over 15 years"], authorityWeight: 1, siteKeywords: ["174", "R&D"], citations: [CRS],
  },
  {
    id: "excess_business_loss", name: "Excess business loss limit (a ceiling, not a strategy)", kind: "structure", repeat: "annual",
    statute: "IRC §461(l), made permanent by OBBBA",
    summary: "Net business losses above the threshold cannot offset wages this year; the excess becomes a net operating loss for next year. This is the ceiling on how far oil and gas, cost segregation and short-term-rental losses can reach.",
    params: { single2026: { value: 256_000, unit: "$", source: RP2532, verified: true }, joint2026: { value: 512_000, unit: "$", source: RP2532, verified: true } },
    requires: [], goals: [], risks: [], authorityWeight: 1, siteKeywords: [], citations: [RP2532],
  },
  {
    id: "niit_planning", name: "Net investment income tax and additional Medicare tax", kind: "structure", repeat: "annual",
    statute: "IRC §§1411, 3101(b)(2)",
    summary: "3.8% on net investment income above $200,000 single / $250,000 joint (not indexed) and 0.9% on wages above the same thresholds: another reason to hold growth in Roth, HSA and life insurance rather than taxable accounts.",
    params: { niitSingle: { value: 200_000, unit: "$ MAGI", source: LII("1411"), verified: true }, niitJoint: { value: 250_000, unit: "$", source: LII("1411"), verified: true }, rate: { value: 3.8, unit: "%", source: LII("1411"), verified: true } },
    requires: [], goals: [], risks: [], authorityWeight: 1, siteKeywords: [], citations: [LII("1411")],
  },
  {
    id: "energy_179d_45l", name: "Commercial building energy deduction and new-home credit (ending)", kind: "ordinary_deduction", repeat: "episodic",
    statute: "IRC §§179D, 45L as terminated by OBBBA",
    summary: "Both end for construction beginning (179D) or homes acquired (45L) after June 30, 2026; only projects already under way qualify.",
    params: { termination179D: { value: "construction beginning after 2026-06-30", source: CRS, verified: true }, termination45L: { value: "homes acquired after 2026-06-30", source: CRS, verified: true } },
    requires: ["a qualifying project begun before July 2026"], goals: ["real estate"], risks: ["Sunset"], authorityWeight: 1, siteKeywords: ["179D", "Solar", "45L"], citations: [CRS],
  },
  {
    id: "obbba_deductions", name: "OBBBA personal deductions 2025–2028 (tips, overtime, seniors) and Trump accounts", kind: "ordinary_deduction", repeat: "annual",
    statute: "OBBBA §§70201–70203; IRC §530A",
    summary: "Mostly out of reach for a high earner (the tips and overtime deductions phase out above $150,000 / $300,000 MAGI; the $6,000 senior deduction above $75,000 / $150,000), but the $5,000-a-year Trump account for each child, with the $1,000 federal pilot for children born 2025–2028, is available to any family.",
    params: { tips: { value: 25_000, unit: "$ max; phase-out from $150,000 / $300,000 MAGI at $100 per $1,000", source: OBBBA, verified: true }, overtime: { value: "12,500 / 25,000", unit: "$ max", source: OBBBA, verified: true }, senior: { value: 6_000, unit: "$; phase-out 6% of MAGI above $75,000 / $150,000", source: OBBBA, verified: true }, trumpAccountAnnual: { value: 5_000, unit: "$ per child", source: `${OBBBA}; IRC §530A`, verified: true }, trumpAccountPilot: { value: 1_000, unit: "$ for children born 2025–2028", source: OBBBA, verified: true }, years: { value: "2025–2028", source: OBBBA, verified: true } },
    requires: ["children (Trump accounts)"], goals: ["family"], risks: ["Phase-outs exclude high earners from the tips, overtime and senior deductions"], authorityWeight: 1, siteKeywords: [], citations: [OBBBA, CRS],
  },
];

export const FAMILY_BY_ID: Record<string, StrategyFamily> = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));

/** Which families a site combination title draws on, by keyword. */
export function familiesForTitle(title: string): StrategyFamily[] {
  const t = title.toLowerCase();
  const out = FAMILIES.filter((f) => f.siteKeywords.some((k) => t.includes(k.toLowerCase())));
  if (/annuity|fia|myga/.test(t) && !out.some((f) => f.id === "ppli")) out.push(FAMILY_BY_ID.ppli!);
  return out;
}

/** The authorities the tax panel weights (server/taxSources.ts registers them); listed here so the client can print them. */
export const AUTHORITY_TIERS = [
  { tier: "Statute, Treasury regulations, controlling court decisions", weight: 1.0 },
  { tier: "IRS revenue rulings, revenue procedures, notices", weight: 0.9 },
  { tier: "Joint Committee on Taxation and Congressional Research Service explanations", weight: 0.75 },
  { tier: "Practitioner standards: AICPA, Bloomberg Tax portfolios, Thomson Reuters Checkpoint", weight: 0.6 },
  { tier: "Analytical commentary: Kitces, Tax Foundation", weight: 0.5 },
  { tier: "Sponsor and carrier material", weight: 0.3 },
];
