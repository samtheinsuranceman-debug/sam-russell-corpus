// ============================================================
// THE FORGIVENESS ENGINE — federal and service-based student-loan
// forgiveness and repayment for the heavily indebted professional (the
// physician with six figures of Direct Loans), on the record and with a
// probability, a wait, a dollar figure and its references for every path.
//
// Three parts:
//   1. The record: every program that has forgiven or repaid federal
//      education debt since the 1980s — who it was for, what it paid, what
//      it asked, how long its window was open, what it produced — each with
//      the statute or rule it rests on and the figures it published. Every
//      enactment and contraction is an event stamped with who held the
//      federal levers that year (shared/powerHistory.ts), so the political
//      correlation is computed, never asserted.
//   2. The paths for one borrower: PSLF, income-driven forgiveness (IBR, RAP),
//      and the service programs (NHSC, IHS, VA, NIH), each with eligibility,
//      the month forgiveness arrives, the amount forgiven and what it costs
//      in tax, the odds it happens (program survival × borrower execution),
//      and the confidence behind the number.
//   3. The other side of the ledger: what the payment difference becomes if
//      it is invested for 20–30 years, in a taxable account and in a
//      tax-free wrapper with an explicit cost, so the debt is read as an
//      asset it could fund. Illustration, not advice.
// Sources are cited inline. Nothing here is estimated where a published
// figure exists; assumptions are named as assumptions.
// ============================================================
import { controlAt, demLeverShare, type Party } from "./powerHistory";
import { computeTaxPicture, currentRules, type FilingKey } from "./taxRules";

// ─── 1. The record ──────────────────────────────────────────────────────────
export type ProgramKind = "forgiveness" | "idr_plan" | "service_repayment" | "waiver" | "tax_rule" | "limit";
export type Program = {
  id: string; name: string; kind: ProgramKind;
  authority: string;             // statute, public law, regulation
  enacted: string;               // YYYY-MM-DD the authority was enacted or the rule published
  open: string;                  // when borrowers could first use it
  closed: string | null;         // when it closed or sunsets; null = ongoing
  status: "open" | "closed" | "sunsetting" | "enjoined" | "ended";
  who: string;                   // eligible borrowers and employers
  degrees: string;               // degree or discipline scope
  institutions: string;          // employer or site types
  loans: string;                 // eligible loan types
  award: string;                 // what it pays or forgives
  obligation: string;            // what the borrower must do, and for how long
  cadence: string;               // how often the borrower acts (annual certification, application cycles)
  tax: string;                   // tax treatment, with the code section
  outcomes: Array<{ metric: string; value: string; asOf: string; citation: string }>;
  citations: string[];
};

export const PROGRAMS: Program[] = [
  {
    id: "pslf", name: "Public Service Loan Forgiveness (PSLF)", kind: "forgiveness",
    authority: "College Cost Reduction and Access Act of 2007, Pub. L. 110-84, title IV §401 (Sept. 27, 2007); 20 U.S.C. §1087e(m)",
    enacted: "2007-09-27", open: "2007-10-01", closed: null, status: "open",
    who: "Direct Loan borrowers employed full time (≥30 hours a week) by a U.S. federal, state, local or tribal government, a 501(c)(3) organization, or another not-for-profit devoting most of its staff to qualifying public services; the statute names public health and health care practitioner and support occupations",
    degrees: "Any; the test is the employer, not the degree",
    institutions: "Government employers at every level; 501(c)(3) hospitals and health systems; other qualifying not-for-profits. For-profit employers, unions and partisan political organizations do not qualify",
    loans: "Direct Loans only (Direct Subsidized, Unsubsidized, Grad PLUS, Direct Consolidation). FFEL and Perkins loans qualify only after consolidation into a Direct Loan; consolidations on or after Sept. 1, 2024 carry a weighted average of prior counts",
    award: "The entire remaining balance, principal and interest, after 120 qualifying monthly payments made after Oct. 1, 2007 (payments need not be consecutive)",
    obligation: "120 qualifying payments under an income-driven plan (RAP, IBR, ICR, PAYE) or the 10-year Standard plan, each made while employed full time by a qualifying employer; employed by a qualifying employer at the time of forgiveness. The Tiered Standard plan does not count",
    cadence: "Submit the PSLF form (employment certification) annually or at each change of employer; final PSLF form after the 120th payment",
    tax: "Excluded from federal gross income under 26 U.S.C. §108(f)(1)",
    outcomes: [
      { metric: "borrowers forgiven, cumulative", value: "55 as of April 2018", asOf: "2018-04-30", citation: "GAO-18-547 (Sept. 2018): 890,000+ had certified employment; 55 had received forgiveness" },
      { metric: "borrowers forgiven, cumulative", value: "1,062,870 borrowers, $78 billion", asOf: "2024-12-26", citation: "U.S. Department of Education data as reported Dec. 26, 2024 (Forbes/Minsky); ED press release Oct. 17, 2024 announced the millionth recipient and $4.5 billion for ~60,000 borrowers" },
      { metric: "approvals before October 2021", value: "about 7,000 borrowers", asOf: "2021-10-01", citation: "ED, Oct. 2021 PSLF fact sheet; ED Jan. 16, 2025 release (as summarised: $78.5 billion for 1 million+ under the 2021–25 fixes)" },
    ],
    citations: ["congress.gov H.R.2669 (110th) — Public Law 110-84, Sept. 27, 2007", "20 U.S.C. §1087e(m) (LII)", "studentaid.gov, Public Service Loan Forgiveness (accessed Sept. 6, 2026)", "GAO-18-547", "studentaid.gov PSLF data centre"],
  },
  {
    id: "tepslf", name: "Temporary Expanded PSLF (TEPSLF)", kind: "forgiveness",
    authority: "Consolidated Appropriations Act, 2018 (Pub. L. 115-141), first-come-first-served appropriation",
    enacted: "2018-03-23", open: "2018-05-23", closed: null, status: "open",
    who: "Borrowers otherwise meeting PSLF whose payments were made under Graduated, Extended, Consolidation Standard or Consolidation Graduated plans",
    degrees: "Any", institutions: "Same as PSLF", loans: "Direct Loans only; not Parent PLUS, not defaulted loans",
    award: "The remaining balance", obligation: "120 qualifying payments and 10 years of certified full-time qualifying employment; the last payment and the payment 12 months before applying at least what an IDR plan would have required",
    cadence: "One PSLF form covers both PSLF and TEPSLF", tax: "Excluded under 26 U.S.C. §108(f)(1)",
    outcomes: [], citations: ["studentaid.gov, Temporary Expanded Public Service Loan Forgiveness (accessed Sept. 6, 2026)"],
  },
  {
    id: "pslf-waiver", name: "Limited PSLF Waiver", kind: "waiver",
    authority: "U.S. Department of Education administrative action announced Oct. 6, 2021 (HEROES Act authority)",
    enacted: "2021-10-06", open: "2021-10-06", closed: "2022-10-31", status: "closed",
    who: "Public-service borrowers with payments after Oct. 1, 2007 on any federal loan under any plan, late or partial; FFEL and Perkins borrowers who consolidated by Oct. 31, 2022",
    degrees: "Any", institutions: "Same as PSLF", loans: "Any federal loan, if consolidated into Direct by the deadline",
    award: "Retroactive PSLF credit for previously non-qualifying months", obligation: "PSLF form (and consolidation where needed) by Oct. 31, 2022", cadence: "One-time window of about 13 months", tax: "As PSLF",
    outcomes: [{ metric: "borrowers approved under the waiver", value: "over 236,000 by the time of ED's 2022 fact sheet", asOf: "2022-10-31", citation: "ED, Charting the Path Forward for PSLF fact sheet" }],
    citations: ["ED fact sheet, PSLF program overhaul, Oct. 6, 2021", "ED, Future of PSLF fact sheet (2022)"],
  },
  {
    id: "idr-adjustment", name: "One-time IDR Account Adjustment", kind: "waiver",
    authority: "U.S. Department of Education administrative action (announced April 2022; final counts Jan. 16, 2025)",
    enacted: "2022-04-19", open: "2022-04-19", closed: "2025-01-16", status: "closed",
    who: "Borrowers with Direct or ED-held FFEL loans; commercial FFEL, Perkins and HEAL only if consolidated by June 30, 2024",
    degrees: "Any", institutions: "Any", loans: "Direct and ED-held FFEL",
    award: "Retroactive credit toward the 20/25-year IDR thresholds and PSLF for months in repayment, long forbearances and certain deferments", obligation: "None beyond holding eligible loans (consolidation for some)", cadence: "One-time", tax: "As the plan under which forgiveness occurs",
    outcomes: [{ metric: "forgiven through the adjustment", value: "$57.1 billion for more than 1.45 million borrowers", asOf: "2025-01-16", citation: "ED, Jan. 16, 2025 (Biden administration final release, as summarised)" }],
    citations: ["Student Borrower Protection Center, Jan. 16, 2025 release", "ED release, Jan. 16, 2025"],
  },
  {
    id: "icr", name: "Income-Contingent Repayment (ICR)", kind: "idr_plan",
    authority: "Student Loan Reform Act of 1993 (Omnibus Budget Reconciliation Act of 1993, Pub. L. 103-66); 59 Fed. Reg. 61664 (Dec. 1, 1994)",
    enacted: "1993-08-10", open: "1994-07-01", closed: "2028-07-01", status: "sunsetting",
    who: "Direct Loan borrowers", degrees: "Any", institutions: "Any", loans: "Direct Loans (including consolidations with Parent PLUS)",
    award: "Remaining balance forgiven after 25 years of payments", obligation: "20% of discretionary income (or a 12-year amortised amount if lower); annual recertification", cadence: "Annual", tax: "Taxable unless a §108(f) exclusion applies (the 2021–2025 exclusion was not extended)",
    outcomes: [], citations: ["8th Cir. No. 24-2332 (Feb. 18, 2025) history of ICR", "studentaid.gov, Income-Driven Repayment Plans; OBBBA ends ICR no later than July 1, 2028"],
  },
  {
    id: "ibr", name: "Income-Based Repayment (IBR)", kind: "idr_plan",
    authority: "College Cost Reduction and Access Act of 2007 (Pub. L. 110-84), 20 U.S.C. §1098e; terms for new borrowers after July 1, 2014 set by the Health Care and Education Reconciliation Act of 2010 (Pub. L. 111-152)",
    enacted: "2007-09-27", open: "2009-07-01", closed: null, status: "open",
    who: "Direct and FFEL borrowers with a partial financial hardship (payment below the 10-year standard amount)", degrees: "Any", institutions: "Any", loans: "Direct and FFEL (not Parent PLUS)",
    award: "Remaining balance forgiven after 25 years (borrowed before July 1, 2014) or 20 years (first borrowed after July 1, 2014 and before July 1, 2026)", obligation: "15% (older) or 10% (newer) of discretionary income (AGI above 150% of the poverty guideline), capped at the 10-year standard payment; annual recertification", cadence: "Annual", tax: "Taxable at the federal level for forgiveness effective after Dec. 31, 2025 unless Congress acts; excluded for 2021–2025 under ARPA §9675",
    outcomes: [], citations: ["studentaid.gov, Income-Driven Repayment Plans (accessed Sept. 6, 2026)", "8th Cir. No. 24-2332 (Feb. 18, 2025)"],
  },
  {
    id: "paye", name: "Pay As You Earn (PAYE)", kind: "idr_plan",
    authority: "Regulation under the 1993 ICR authority, 77 Fed. Reg. 66088 (Nov. 1, 2012)",
    enacted: "2012-11-01", open: "2012-12-21", closed: "2028-07-01", status: "sunsetting",
    who: "New borrowers as of Oct. 1, 2007 with a Direct Loan disbursed on or after Oct. 1, 2011 and a partial financial hardship", degrees: "Any", institutions: "Any", loans: "Direct Loans",
    award: "Remaining balance forgiven after 20 years", obligation: "10% of discretionary income, capped at the 10-year standard payment; annual recertification", cadence: "Annual", tax: "Taxable after 2025 unless a §108(f) exclusion applies",
    outcomes: [], citations: ["8th Cir. No. 24-2332 (Feb. 18, 2025)", "studentaid.gov: OBBBA eliminates PAYE no later than July 1, 2028"],
  },
  {
    id: "repaye", name: "Revised Pay As You Earn (REPAYE)", kind: "idr_plan",
    authority: "Regulation, 80 Fed. Reg. 67204 (Oct. 30, 2015)",
    enacted: "2015-10-30", open: "2015-12-17", closed: "2023-07-10", status: "ended",
    who: "Any Direct Loan borrower", degrees: "Any", institutions: "Any", loans: "Direct Loans",
    award: "Remaining balance forgiven after 20 years (undergraduate only) or 25 years (any graduate debt); half of unpaid interest subsidised", obligation: "10% of discretionary income, uncapped; annual recertification", cadence: "Annual", tax: "Taxable unless excluded",
    outcomes: [], citations: ["8th Cir. No. 24-2332 (Feb. 18, 2025); the court also enjoined forgiveness under REPAYE's terms"],
  },
  {
    id: "save", name: "Saving on a Valuable Education (SAVE)", kind: "idr_plan",
    authority: "Regulation, 88 Fed. Reg. 43820 (July 10, 2023), amending REPAYE; enjoined by the 8th Circuit (Aug. 9, 2024; Feb. 18, 2025); settlement entered as final judgment March 9, 2026",
    enacted: "2023-07-10", open: "2023-08-22", closed: "2024-07-18", status: "ended",
    who: "Direct Loan borrowers", degrees: "Any", institutions: "Any", loans: "Direct Loans",
    award: "Forgiveness after 10–25 years depending on original balance; no accrual of unpaid interest", obligation: "5% (undergraduate) to 10% (graduate) of income above 225% of the poverty guideline", cadence: "Annual", tax: "Taxable after 2025 unless excluded",
    outcomes: [
      { metric: "enrolled", value: "7.5 million borrowers, 4.3 million paying $0 a month (Feb. 2024)", asOf: "2024-02-21", citation: "ED press release Feb. 21, 2024, as quoted by the 8th Circuit" },
      { metric: "forgiven under SAVE", value: "$5.5 billion for 414,000 borrowers", asOf: "2025-01-16", citation: "ED, Jan. 16, 2025 (as summarised)" },
      { metric: "estimated 10-year cost", value: "$475 billion", asOf: "2023-07-17", citation: "Penn Wharton Budget Model, SAVE budgetary cost estimate update (July 17, 2023), as cited by the 8th Circuit" },
    ],
    citations: ["8th Cir. order Aug. 9, 2024 and opinion Feb. 18, 2025 (No. 24-2332)", "AFT v. U.S. Department of Education settlement (D.D.C., Oct. 2025) restarting IBR/ICR/PAYE forgiveness"],
  },
  {
    id: "rap", name: "Repayment Assistance Plan (RAP)", kind: "idr_plan",
    authority: "One Big Beautiful Bill Act, Pub. L. 119-21, title VIII §82001 (July 4, 2025); 20 U.S.C. §1087e(q)",
    enacted: "2025-07-04", open: "2026-07-01", closed: null, status: "open",
    who: "Direct Loan borrowers (required plan for loans made on or after July 1, 2026 alongside a new tiered standard plan); not Parent PLUS or consolidations containing Parent PLUS", degrees: "Any", institutions: "Any", loans: "Direct Loans",
    award: "Remaining balance cancelled after 360 qualifying monthly payments (30 years)", obligation: "Monthly payment = 1% to 10% of AGI ÷ 12 by $10,000 bands ($10 minimum at AGI ≤ $10,000; 10% above $100,000), less $50 per dependent; unpaid interest for the month is not charged; principal matched up to $50 a month when the payment does not reduce principal by that much; annual recertification", cadence: "Annual", tax: "Taxable at the federal level under current law (the 2021–2025 exclusion was not extended)",
    outcomes: [], citations: ["20 U.S.C. §1087e(q) (LII)", "studentaid.gov, Income-Driven Repayment Plans (RAP row)"],
  },
  {
    id: "obbba-limits", name: "OBBBA graduate and professional borrowing caps; end of Grad PLUS", kind: "limit",
    authority: "One Big Beautiful Bill Act, Pub. L. 119-21 (July 4, 2025); ED negotiated rulemaking concluded Nov. 6, 2025; NPRM Jan. 29, 2026",
    enacted: "2025-07-04", open: "2026-07-01", closed: null, status: "open",
    who: "New borrowers from July 1, 2026", degrees: "Graduate: $20,500 a year, $100,000 aggregate. Professional (medicine and other designated programs): $50,000 a year, $200,000 aggregate", institutions: "All Title IV institutions", loans: "Direct Unsubsidized; Grad PLUS eliminated for new borrowers",
    award: "None — a limit. It caps the federal debt a future physician can carry into any forgiveness path at $200,000 and pushes the remainder to private loans, which no federal program forgives", obligation: "—", cadence: "—", tax: "—",
    outcomes: [], citations: ["ED press release, Nov. 6, 2025 (negotiated rulemaking)", "ED press release, Jan. 29, 2026 (NPRM)"],
  },
  {
    id: "arpa-108f5", name: "Tax exclusion for discharged student loans, 2021–2025", kind: "tax_rule",
    authority: "American Rescue Plan Act of 2021, Pub. L. 117-2 §9675, adding 26 U.S.C. §108(f)(5); amended by Pub. L. 119-21 (2025)",
    enacted: "2021-03-11", open: "2021-01-01", closed: "2025-12-31", status: "ended",
    who: "Any borrower whose federal or private student loan was discharged in 2021–2025", degrees: "Any", institutions: "Any", loans: "Federal, state and most private education loans",
    award: "Discharged amounts excluded from federal gross income", obligation: "None", cadence: "—", tax: "The exclusion itself; PSLF (§108(f)(1)), NHSC and state loan-repayment awards (§108(f)(4)) and death/disability discharges remain excluded on their own footing",
    outcomes: [], citations: ["26 U.S.C. §108(f) with amendment notes (LII): 2021 Pub. L. 117-2 added par. (5); 2025 Pub. L. 119-21 amended par. (5) generally"],
  },
  {
    id: "nhsc-lrp", name: "National Health Service Corps Loan Repayment Program", kind: "service_repayment",
    authority: "Public Health Service Act §338B (42 U.S.C. §254l-1), enacted 1987; NHSC created by the Emergency Health Personnel Act of 1970",
    enacted: "1987-11-04", open: "1987-11-04", closed: null, status: "open",
    who: "Licensed primary care, dental and behavioral health clinicians (physicians, NPs, CNMs, PAs, dentists and others) who are U.S. citizens or nationals", degrees: "MD/DO and other eligible disciplines", institutions: "NHSC-approved sites in Health Professional Shortage Areas; IHS, tribal and urban Indian health programs have dedicated funding",
    loans: "Qualifying educational loans (federal and private) for the degree",
    award: "2026 cycle: up to $75,000 for a full-time two-year commitment in a primary care HPSA (up to $37,500 half time); up to $50,000 for other disciplines; a one-time $5,000 Spanish-proficiency enhancement; continuation contracts thereafter", obligation: "At least two years of service at the approved site; the obligation stands regardless of award size", cadence: "Annual application cycle; award notice by Sept. 30; continuation contracts annually", tax: "Excluded from gross income under 26 U.S.C. §108(f)(4)",
    outcomes: [], citations: ["nhsc.hrsa.gov, NHSC Loan Repayment Program (accessed Sept. 6, 2026)", "26 U.S.C. §108(f)(4)"],
  },
  {
    id: "ihs-lrp", name: "Indian Health Service Loan Repayment Program", kind: "service_repayment",
    authority: "Indian Health Care Improvement Act §108 (25 U.S.C. §1616a)",
    enacted: "1988-11-23", open: "1988-11-23", closed: null, status: "open",
    who: "Health professionals in disciplines IHS needs", degrees: "MD/DO and others", institutions: "IHS, tribal and urban Indian health facilities", loans: "Eligible health-profession education loans",
    award: "Up to $50,000 for an initial two-year commitment; extendable annually until the qualified debt is paid", obligation: "Two years, then annual extensions", cadence: "Monthly award cycles during the season (deadline the 15th)", tax: "Excluded under §108(f)(4) where the program qualifies; IHS also makes tax payments on awards — confirm with the program",
    outcomes: [], citations: ["ihs.gov/loanrepayment (accessed Sept. 6, 2026)"],
  },
  {
    id: "va-edrp", name: "VA Education Debt Reduction Program (EDRP)", kind: "service_repayment",
    authority: "38 U.S.C. §7681 et seq.; annual and aggregate limits raised in 2018 (VA MISSION Act, Pub. L. 115-182)",
    enacted: "1999-11-30", open: "1999-11-30", closed: null, status: "open",
    who: "Veterans Health Administration employees in hard-to-fill direct patient care positions, including physicians", degrees: "MD/DO, RN, LPN, psychology, social work and others", institutions: "VA medical centers and clinics", loans: "Education loans for the qualifying degree",
    award: "Up to $40,000 a year, $200,000 over five years, as reimbursement of loan payments (before 2018: $24,000 a year, $120,000)", obligation: "Five years of VA employment for the full award; no repayment if the employee leaves in good standing (pro-rated)", cadence: "Annual reimbursement against payments made", tax: "Tax-free per VA",
    outcomes: [{ metric: "participants", value: "more than 20,000 VHA employees (2020)", asOf: "2020-11-13", citation: "VA News, Nov. 13, 2020" }],
    citations: ["VA Careers, EDRP flyer (2024)", "VA News, Nov. 13, 2020"],
  },
  {
    id: "wv-slrp", name: "West Virginia State Loan Repayment Program (HRSA-matched)", kind: "service_repayment",
    authority: "Public Health Service Act §338I (42 U.S.C. §254q-1) state loan repayment grants; administered by the West Virginia Department of Health, State Office of Rural Health",
    enacted: "1987-11-04", open: "1987-11-04", closed: null, status: "open",
    who: "Physicians and other primary care clinicians practising full time at an eligible site in a West Virginia Health Professional Shortage Area", degrees: "MD/DO and other primary care disciplines", institutions: "Inpatient and outpatient HPSA sites including federally qualified health centers and look-alikes", loans: "Qualifying educational loans",
    award: "$40,000 for the initial two-year commitment, then up to $25,000 a year for two further years — $90,000 maximum", obligation: "Two years full time, extendable two more", cadence: "Annual application; renewal each added year", tax: "Excluded from gross income under 26 U.S.C. §108(f)(4) (state programs under PHSA §338I)",
    outcomes: [], citations: ["HRSA, State Loan Repayment Program contacts (West Virginia entry), nhsc.hrsa.gov/loan-repayment/state-loan-repayment-program/contacts", "HRSA, State Loan Repayment Program, nhsc.hrsa.gov/loan-repayment/state-loan-repayment-program"],
  },
  {
    id: "wv-mslp", name: "West Virginia Medical Student Loan Program and Health Sciences Service Program", kind: "forgiveness",
    authority: "West Virginia Higher Education Policy Commission (Health Sciences Program Administrator); state program document at bbh.wv.gov",
    enacted: "1995-01-01", open: "1995-01-01", closed: null, status: "open",
    who: "West Virginia medical students and residents who practise in a qualifying medically underserved area of the state", degrees: "Family medicine, general obstetrics and gynecology, general internal medicine, general pediatrics, adult or child psychiatry (MSLP); primary care or emergency medicine residency in West Virginia (HSSP)", institutions: "Underserved areas of West Virginia; outpatient settings (primary care) or hospital emergency rooms (emergency medicine)", loans: "Medical education loans",
    award: "MSLP: up to $10,000 a year of forgiveness for up to four years ($40,000). HSSP: $30,000 toward loan repayment", obligation: "MSLP: one year of practice in a qualifying underserved area for each year forgiven. HSSP: two years full time or four years half time", cadence: "Annual", tax: "State programs under PHSA §338I or otherwise meeting §108(f)(4) are excluded; confirm the program's status with the Commission",
    outcomes: [], citations: ["West Virginia program document, bbh.wv.gov/media/22576/download"],
  },
  {
    id: "nih-lrp", name: "NIH Loan Repayment Programs", kind: "service_repayment",
    authority: "Public Health Service Act §487A–487F (42 U.S.C. §288 et seq.)",
    enacted: "1988-11-04", open: "1988-11-04", closed: null, status: "open",
    who: "Health professionals with doctoral degrees committing to NIH-mission-relevant research (extramural) or employed by NIH (intramural)", degrees: "MD, DO, PhD, PharmD and other doctoral degrees", institutions: "Universities, research institutions, NIH", loans: "Qualified educational debt",
    award: "Up to $50,000 a year of qualified educational debt", obligation: "Two-year research commitment (renewable)", cadence: "Annual application windows (extramural: Sept.–Nov.; intramural: Jan.–March)", tax: "NIH pays federal tax offsets on repayments; confirm current terms with the program",
    outcomes: [], citations: ["NIH Grants & Funding, Loan Repayment Programs (accessed Sept. 6, 2026)"],
  },
];

/** Every enactment or contraction as an event, stamped with who held the federal levers that year. */
export type ForgivenessEvent = { year: number; date: string; programId: string; label: string; direction: 1 | -1; enactedBy: "statute" | "regulation" | "administrative" | "court"; president: Party; senate: Party; house: Party; trifecta: Party | null; leverShare: number };
const EVENT_SEEDS: Array<[string, string, string, 1 | -1, ForgivenessEvent["enactedBy"]]> = [
  ["1987-11-04", "nhsc-lrp", "NHSC Loan Repayment Program created (PHSA §338B)", 1, "statute"],
  ["1988-11-04", "nih-lrp", "NIH Loan Repayment Programs created", 1, "statute"],
  ["1993-08-10", "icr", "Income-contingent repayment with 25-year forgiveness (Student Loan Reform Act)", 1, "statute"],
  ["1999-11-30", "va-edrp", "VA Education Debt Reduction Program created", 1, "statute"],
  ["2007-09-27", "pslf", "PSLF and IBR created (College Cost Reduction and Access Act)", 1, "statute"],
  ["2010-03-30", "ibr", "IBR improved to 10% / 20 years for new borrowers after July 2014 (HCERA)", 1, "statute"],
  ["2012-11-01", "paye", "PAYE: 10% / 20 years by regulation", 1, "regulation"],
  ["2015-10-30", "repaye", "REPAYE opens IDR terms to all Direct borrowers by regulation", 1, "regulation"],
  ["2018-03-23", "tepslf", "TEPSLF appropriated for borrowers on the wrong plans", 1, "statute"],
  ["2018-06-06", "va-edrp", "VA EDRP raised to $40,000 a year, $200,000 over five years (VA MISSION Act)", 1, "statute"],
  ["2021-03-11", "arpa-108f5", "Forgiven student loans excluded from federal income for 2021–2025 (ARPA §9675)", 1, "statute"],
  ["2021-10-06", "pslf-waiver", "Limited PSLF Waiver: retroactive credit under any plan or loan type", 1, "administrative"],
  ["2022-04-19", "idr-adjustment", "One-time IDR account adjustment announced", 1, "administrative"],
  ["2022-11-01", "pslf", "PSLF regulations broaden qualifying payments (effective July 1, 2023)", 1, "regulation"],
  ["2023-07-10", "save", "SAVE plan: lower payments, no unpaid interest, faster forgiveness", 1, "regulation"],
  ["2024-08-09", "save", "8th Circuit enjoins SAVE (and, in Feb. 2025, forgiveness under REPAYE's terms)", -1, "court"],
  ["2025-07-04", "rap", "OBBBA: RAP with 30-year forgiveness; ICR and PAYE end by July 2028; Grad PLUS ends and professional borrowing capped at $200,000", -1, "statute"],
  ["2025-12-31", "arpa-108f5", "The 2021–2025 tax exclusion for forgiven loans expires without extension", -1, "statute"],
  ["2026-03-09", "save", "SAVE permanently ended by settlement entered as final judgment", -1, "court"],
];
export const EVENTS: ForgivenessEvent[] = EVENT_SEEDS.map(([date, programId, label, direction, enactedBy]) => {
  const year = Number(date.slice(0, 4));
  const c = controlAt(year)!;
  return { year, date, programId, label, direction, enactedBy, president: c.president, senate: c.senate, house: c.house, trifecta: c.trifecta, leverShare: demLeverShare(year) ?? 0.5 };
});

/** The political correlation, computed from the events: mean lever share behind expansions vs contractions, the split by bucket, and a point-biserial r with its n — on all events, and on the elected branches' acts alone (courts hold no lever). */
export function politicalCorrelation(events: ForgivenessEvent[] = EVENTS) {
  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const bucket = (s: number) => (s >= 2 / 3 ? "left" : s <= 1 / 3 ? "right" : "divided");
  const corr = (ev: ForgivenessEvent[]) => {
    const xs = ev.map((e) => e.leverShare), ys = ev.map((e) => e.direction as number);
    if (ev.length < 3) return 0;
    const mx = mean(xs)!, my = mean(ys)!;
    const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i]! - my), 0);
    const vx = xs.reduce((s, x) => s + (x - mx) ** 2, 0), vy = ys.reduce((s, y) => s + (y - my) ** 2, 0);
    return vx > 0 && vy > 0 ? Math.round((cov / Math.sqrt(vx * vy)) * 1000) / 1000 : 0;
  };
  const exp = events.filter((e) => e.direction > 0), con = events.filter((e) => e.direction < 0);
  const elected = events.filter((e) => e.enactedBy !== "court"), courts = events.filter((e) => e.enactedBy === "court");
  const byBucket = { left: { expansions: 0, contractions: 0 }, divided: { expansions: 0, contractions: 0 }, right: { expansions: 0, contractions: 0 } };
  for (const e of events) byBucket[bucket(e.leverShare)][e.direction > 0 ? "expansions" : "contractions"] += 1;
  const electedCon = elected.filter((e) => e.direction < 0);
  const electedConRight = electedCon.filter((e) => bucket(e.leverShare) === "right").length;
  const statExpRight = elected.filter((e) => e.direction > 0 && bucket(e.leverShare) === "right").length;
  const statExpLeft = elected.filter((e) => e.direction > 0 && bucket(e.leverShare) === "left").length;
  const reading = `${exp.length} expansions and ${con.length} contractions since 1987; ${courts.length} of the events are court rulings, which no elected lever controls. Among the elected branches' own acts, expansions came under left-held years ${statExpLeft} times and right-held years ${statExpRight} times, and ${electedConRight} of ${electedCon.length} contractions came under right-held years. r is a tendency computed on ${events.length} events (${elected.length} elected), not a law.`;
  return {
    n: events.length, expansions: exp.length, contractions: con.length, courtEvents: courts.length,
    meanShareExpansions: mean(exp.map((e) => e.leverShare)), meanShareContractions: mean(con.map((e) => e.leverShare)),
    byBucket, r: corr(events), rElected: corr(elected), reading,
  };
}

// ─── 2. Payment formulas (2026 rules) ────────────────────────────────────────
/** HHS 2026 poverty guideline, 48 states and D.C.: $15,960 for one, +$5,680 per additional person (aspe.hhs.gov). */
export function povertyGuideline2026(householdSize: number): number { return 15_960 + Math.max(0, householdSize - 1) * 5_680; }

export type PlanId = "ibr" | "ibr_old" | "paye" | "rap" | "standard";

/** The 10-year standard payment for a balance at a rate. */
export function standardPayment(balance: number, annualRate: number, years = 10): number {
  const r = annualRate / 12, n = years * 12;
  if (balance <= 0) return 0;
  if (r === 0) return balance / n;
  return (balance * r) / (1 - (1 + r) ** -n);
}

/** Monthly payment under each plan for a year's AGI, household size and dependents. 2026 statute and rules. */
export function monthlyPayment(plan: PlanId, agi: number, householdSize: number, dependents: number, standard10: number): number {
  switch (plan) {
    case "standard": return standard10;
    case "ibr": case "paye": { const disc = Math.max(0, agi - 1.5 * povertyGuideline2026(householdSize)); return Math.min(standard10, (0.10 * disc) / 12); }
    case "ibr_old": { const disc = Math.max(0, agi - 1.5 * povertyGuideline2026(householdSize)); return Math.min(standard10, (0.15 * disc) / 12); }
    case "rap": {
      // 20 U.S.C. §1087e(q)(4): $10 at AGI ≤ $10,000; 1% for >$10,000–$20,000 … 10% above $100,000; less $50 per dependent; floor $10.
      const band = agi <= 10_000 ? null : Math.min(10, Math.ceil((agi - 10_000) / 10_000));
      const base = band == null ? 10 : (band / 100) * agi / 12;
      return Math.max(10, base - 50 * Math.max(0, dependents));
    }
  }
}

// ─── 3. One borrower's paths ────────────────────────────────────────────────
export type Employer = "government" | "nonprofit_501c3" | "other_nonprofit" | "for_profit" | "unknown";
export type LoanMix = "direct" | "ffel_unconsolidated" | "private" | "mixed";

export type BorrowerProfile = {
  balance: number; annualRate: number; loans: LoanMix; firstLoanBefore2014?: boolean; anyLoanAfterJuly2026?: boolean;
  employer: Employer; qualifyingPaymentsMade: number;
  /** months of residency or fellowship still ahead, at the stipend */
  residencyMonthsLeft: number; residencyStipend: number;
  /** attending AGI after training, and its growth */
  attendingIncome: number; incomeGrowth: number;
  householdSize: number; dependents: number; filing: FilingKey;
  plan: PlanId;
  /** flags for the service programs */
  primaryCare?: boolean; willingHPSA?: boolean; willingIHS?: boolean; willingVA?: boolean; research?: boolean;
  /** two-letter state of practice; state programs switch on where verified (WV) */
  state?: string;
  /** compliance: certifies annually, keeps Direct Loans and an eligible plan, has an advisor watching it */
  disciplined?: boolean;
};

export type PathOutcome = {
  programId: string; eligible: boolean; reasons: string[];
  monthsToForgiveness: number | null; forgivenessDate: string | null;
  totalPaidBefore: number; forgivenAmount: number; forgivenPrincipal: number; forgivenInterest: number;
  taxOnForgiveness: number; netBenefit: number;
  probability: number | null; confidence: number; probabilityParts: { programSurvives: number; borrowerExecutes: number; staysEligible?: number; award?: number } | null;
  citations: string[]; notes: string[];
  schedule: Array<{ month: number; payment: number; balance: number }>;
};

export type ProbabilityInputs = {
  /** expected Democratic lever share over the pursuit period (from the power layer); 0.5 when unknown */
  expectedLeverShare: number;
  /** override of the statutory base hazard (see DEFAULT_BASE_HAZARD) */
  baseHazard?: number;
  /** annual probability the borrower stays in qualifying employment (physicians at nonprofit systems: assumption 0.97) */
  persistence?: number;
};
export const PSLF_YEARS_ON_RECORD = 2026 - 2007;
/**
 * Statutory hazard: the Jeffreys estimate for a zero-event record, 0.5 ÷ (n + 1) with n = 19 years of PSLF
 * and no statutory change removing forgiveness from existing borrowers (≈ 2.5 % a year). Chosen over the
 * Laplace 1 ÷ (n + 2) on the council's review (Gemini 2.5 Pro, Sept. 6, 2026): less informative and
 * invariant to reparameterisation. An assumption, stated.
 */
export const DEFAULT_BASE_HAZARD = 0.5 / (PSLF_YEARS_ON_RECORD + 1);
/** Regulatory hazard: rule changes that cost existing borrowers credit or eligibility. No such change has stuck since the 2007 statute (the 2025 employer rule is under a court order); Jeffreys on the same record, scaled ×2 because rules move faster than statutes. Assumption. */
export const DEFAULT_REGULATORY_HAZARD = 2 * 0.5 / (PSLF_YEARS_ON_RECORD + 1);
export const DEFAULT_PERSISTENCE = 0.97;

/** Political tilt of the statutory hazard by the expected lever share: ×0.5 fully left, ×1.5 fully right. On the record the elected branches' contractions of forgiveness (2025) came under a right-held government and none under a left-held one; the magnitude is an assumption, stated. */
export function politicalTilt(expectedLeverShare: number): number { return 1.5 - Math.max(0, Math.min(1, expectedLeverShare)); }

/** The odds a program's forgiveness survives `years` more: statutory survival × regulatory survival. `hazardScale` raises both for plans whose terms are partly regulatory. */
export function programSurvival(years: number, inputs: ProbabilityInputs, hazardScale = 1): number {
  const hs = Math.min(0.5, Math.max(0, (inputs.baseHazard ?? DEFAULT_BASE_HAZARD) * hazardScale * politicalTilt(inputs.expectedLeverShare)));
  const hr = Math.min(0.5, Math.max(0, DEFAULT_REGULATORY_HAZARD * hazardScale));
  return Math.round(((1 - hs) * (1 - hr)) ** Math.max(0, years) * 1000) / 1000;
}

/** The odds the borrower is still in qualifying employment after `years` (per-year persistence compounded). */
export function persistenceOver(years: number, inputs: ProbabilityInputs): number {
  return Math.round((inputs.persistence ?? DEFAULT_PERSISTENCE) ** Math.max(0, years) * 1000) / 1000;
}

function addMonths(from: Date, months: number): string { const d = new Date(from.getFullYear(), from.getMonth() + months, 1); return d.toISOString().slice(0, 10); }

/** Simulate monthly payments under the plan through training and practice; returns the schedule and totals up to `months`. */
export function simulate(p: BorrowerProfile, plan: PlanId, months: number, opts: { capitaliseAtTrainingEnd?: boolean } = {}): { schedule: Array<{ month: number; payment: number; balance: number }>; totalPaid: number; endBalance: number; principalLeft: number; interestLeft: number } {
  let principal = p.balance, unpaidInterest = 0, totalPaid = 0;
  const std = standardPayment(p.balance, p.annualRate);
  const schedule: Array<{ month: number; payment: number; balance: number }> = [];
  for (let m = 1; m <= months; m += 1) {
    const inTraining = m <= p.residencyMonthsLeft;
    const yearsOut = inTraining ? 0 : Math.floor((m - p.residencyMonthsLeft - 1) / 12);
    const agi = inTraining ? p.residencyStipend : p.attendingIncome * (1 + p.incomeGrowth) ** yearsOut;
    const pay = monthlyPayment(plan, agi, p.householdSize, p.dependents, std);
    const interest = (principal * p.annualRate) / 12;
    let applied = pay;
    if (plan === "rap") {
      // §1087e(q)(2): unpaid interest for the month is not charged; principal matched up to $50 when the payment reduces principal by less.
      const toInterest = Math.min(applied, interest);
      let toPrincipal = applied - toInterest;
      if (toPrincipal < 50) { principal -= Math.min(50 - toPrincipal, principal); }
      principal -= toPrincipal;
    } else {
      // IBR/PAYE/standard: interest accrues; unpaid interest sits as accrued interest (capitalisation events ignored except the optional one at training end).
      const toInterest = Math.min(applied, interest + unpaidInterest);
      unpaidInterest = unpaidInterest + interest - toInterest;
      applied -= toInterest;
      principal -= Math.min(applied, principal);
      if (opts.capitaliseAtTrainingEnd && m === p.residencyMonthsLeft) { principal += unpaidInterest; unpaidInterest = 0; }
    }
    totalPaid += pay;
    if (principal <= 0.005 && unpaidInterest <= 0.005) { principal = 0; unpaidInterest = 0; schedule.push({ month: m, payment: pay, balance: 0 }); break; }
    if (m % 12 === 0 || m === months) schedule.push({ month: m, payment: Math.round(pay), balance: Math.round(principal + unpaidInterest) });
  }
  return { schedule, totalPaid: Math.round(totalPaid), endBalance: Math.round(principal + unpaidInterest), principalLeft: Math.round(principal), interestLeft: Math.round(unpaidInterest) };
}

/** Federal tax on a forgiven amount added to that year's income (2026 rule set, no state tax). */
export function taxOnDischarge(income: number, forgiven: number, filing: FilingKey): number {
  const rules = currentRules();
  const a = computeTaxPicture({ filing, agi: income }, rules).federalTax;
  const b = computeTaxPicture({ filing, agi: income + forgiven }, rules).federalTax;
  return Math.max(0, Math.round(b - a));
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function pslfPath(p: BorrowerProfile, prob: ProbabilityInputs, now = new Date()): PathOutcome {
  const reasons: string[] = [], notes: string[] = [];
  let eligible = true;
  if (p.loans === "private") { eligible = false; reasons.push("Private loans are not federal Direct Loans; no federal program forgives them"); }
  if (p.loans === "ffel_unconsolidated") { reasons.push("FFEL loans qualify only after consolidation into a Direct Consolidation Loan; consolidations since Sept. 1, 2024 carry a weighted average of prior counts"); }
  if (p.employer === "for_profit") { eligible = false; reasons.push("For-profit employers do not qualify (20 U.S.C. §1087e(m)(3)(B)); most physician-owned groups and many staffing companies are for-profit even when they staff a nonprofit hospital"); }
  if (p.employer === "unknown") reasons.push("Employer type unknown: check the employer's EIN in the PSLF Employer Search on StudentAid.gov");
  if (p.plan === "standard") notes.push("Payments under the 10-year Standard plan count, but they retire the loan in 120 payments, leaving nothing to forgive; an IDR plan is what makes PSLF worth anything");
  if (p.anyLoanAfterJuly2026) notes.push("Loans disbursed on or after July 1, 2026 must be in RAP for PSLF; only full, on-time payments count");
  const plan: PlanId = p.plan === "standard" ? "standard" : p.plan;
  const monthsLeft = Math.max(0, 120 - p.qualifyingPaymentsMade);
  const sim = simulate(p, plan, monthsLeft);
  const forgiven = eligible ? sim.endBalance : 0;
  const years = monthsLeft / 12;
  const survives = programSurvival(years, prob, 1);
  const stays = persistenceOver(years, prob);
  const executes = p.disciplined ? 0.9 : 0.6;
  notes.push("Odds = P(the statute and the rules still forgive existing borrowers when you arrive) × P(you are still in qualifying employment) × P(you execute: Direct Loans, an eligible plan, full-time qualifying employment certified every year). Before the 2021 fixes, GAO found 99% of early applications denied, almost all for the wrong loans or plans (GAO-18-547); after the 2022 rules and StudentAid.gov management, execution risk is a matter of discipline, which is why an advisor's annual check changes the number.");
  notes.push(`Survival: no statutory change has removed PSLF from existing borrowers in ${PSLF_YEARS_ON_RECORD} years; two presidential budgets (FY2018, FY2019) proposed ending it for new borrowers only and Congress did not enact them; the 2025 law kept PSLF and named health care practitioners in the statute. The statutory hazard is the Jeffreys estimate 0.5/(${PSLF_YEARS_ON_RECORD}+1) a year (about 2.5%), tilted by who is expected to hold the levers (×0.5 fully left, ×1.5 fully right); a separate regulatory hazard of twice that covers rule changes that cost existing borrowers credit (none has stuck; the 2025 employer rule is under a court order). Staying in qualifying employment is taken as ${Math.round((prob.persistence ?? DEFAULT_PERSISTENCE) * 100)}% a year. All three are assumptions, stated; the council's review (Sept. 2026) shaped the separation of statutory, regulatory and persistence risk.`);
  return {
    programId: "pslf", eligible, reasons, monthsToForgiveness: eligible ? monthsLeft : null, forgivenessDate: eligible ? addMonths(now, monthsLeft) : null,
    totalPaidBefore: sim.totalPaid, forgivenAmount: forgiven, forgivenPrincipal: eligible ? sim.principalLeft : 0, forgivenInterest: eligible ? sim.interestLeft : 0,
    taxOnForgiveness: 0, netBenefit: forgiven,
    probability: eligible ? r3(survives * stays * executes) : 0, confidence: eligible ? r3(0.7 * (p.disciplined ? 1 : 0.85)) : 1,
    probabilityParts: eligible ? { programSurvives: survives, staysEligible: stays, borrowerExecutes: executes } : null,
    citations: ["20 U.S.C. §1087e(m)", "26 U.S.C. §108(f)(1)", "studentaid.gov PSLF (accessed Sept. 6, 2026)", "GAO-18-547"], notes, schedule: sim.schedule,
  };
}

export function idrPath(p: BorrowerProfile, prob: ProbabilityInputs, now = new Date()): PathOutcome {
  const reasons: string[] = [], notes: string[] = [];
  let eligible = true;
  if (p.loans === "private") { eligible = false; reasons.push("Private loans have no income-driven forgiveness"); }
  const plan: PlanId = p.plan === "standard" ? "ibr" : p.plan;
  const years = plan === "rap" ? 30 : plan === "ibr_old" ? 25 : 20;
  const monthsLeft = Math.max(0, years * 12 - Math.min(p.qualifyingPaymentsMade, years * 12));
  const sim = simulate(p, plan, monthsLeft);
  const forgiven = eligible ? sim.endBalance : 0;
  const incomeThen = p.attendingIncome * (1 + p.incomeGrowth) ** Math.max(0, (monthsLeft - p.residencyMonthsLeft) / 12);
  const tax = forgiven > 0 ? taxOnDischarge(incomeThen, forgiven, p.filing) : 0;
  const survives = programSurvival(monthsLeft / 12, prob, 1.5);
  const executes = p.disciplined ? 0.85 : 0.6;
  if (forgiven === 0 && eligible) notes.push("At this income the loan is repaid in full before the forgiveness date; there is nothing left to forgive");
  notes.push(`Forgiveness after ${years} years under ${plan.toUpperCase().replace("_OLD", " (pre-2014 terms)")}. Taxable at the federal level under current law: the 2021–2025 exclusion in 26 U.S.C. §108(f)(5) was not extended (Pub. L. 119-21 amended the paragraph). The tax shown uses the 2026 federal rule set on that year's income; state tax not modelled.`);
  notes.push("Survival hazard is 1.5× PSLF's: the plan terms are partly regulatory and were rewritten in 2012, 2015, 2023 and 2025, and the 8th Circuit's 2025 reading of the ICR statute narrowed regulatory forgiveness; IBR and RAP forgiveness are statutory.");
  return {
    programId: plan, eligible, reasons, monthsToForgiveness: eligible ? monthsLeft : null, forgivenessDate: eligible ? addMonths(now, monthsLeft) : null,
    totalPaidBefore: sim.totalPaid, forgivenAmount: forgiven, forgivenPrincipal: eligible ? sim.principalLeft : 0, forgivenInterest: eligible ? sim.interestLeft : 0,
    taxOnForgiveness: tax, netBenefit: Math.max(0, forgiven - tax),
    probability: eligible ? r3(survives * executes) : 0, confidence: eligible ? 0.55 : 1,
    probabilityParts: eligible ? { programSurvives: survives, borrowerExecutes: executes } : null,
    citations: ["20 U.S.C. §1098e (IBR)", "20 U.S.C. §1087e(q) (RAP)", "26 U.S.C. §108(f)(5) as amended 2025", "studentaid.gov Income-Driven Repayment Plans"], notes, schedule: sim.schedule,
  };
}

export function servicePaths(p: BorrowerProfile, now = new Date()): PathOutcome[] {
  const out: PathOutcome[] = [];
  const mk = (programId: string, eligible: boolean, reasons: string[], award: number, months: number, tax: number, awardOdds: number, notes: string[], citations: string[]): PathOutcome => {
    const forgiven = eligible ? Math.min(award, p.balance) : 0;
    return { programId, eligible, reasons, monthsToForgiveness: eligible ? months : null, forgivenessDate: eligible ? addMonths(now, months) : null, totalPaidBefore: 0, forgivenAmount: forgiven, forgivenPrincipal: forgiven, forgivenInterest: 0, taxOnForgiveness: tax, netBenefit: Math.max(0, forgiven - tax), probability: eligible ? r3(awardOdds) : 0, confidence: eligible ? 0.5 : 1, probabilityParts: eligible ? { programSurvives: 0.97, borrowerExecutes: 0.95, award: awardOdds } : null, citations, notes, schedule: [] };
  };
  // NHSC: award odds are not published as a rate here; shown conditional on an award (odds 1) with low confidence, flagged.
  out.push(mk("nhsc-lrp", Boolean(p.willingHPSA), p.willingHPSA ? [] : ["Requires two years at an NHSC-approved site in a Health Professional Shortage Area"], p.primaryCare ? 75_000 : 50_000, 24, 0, 0.92,
    ["2026 award: up to $75,000 for full-time primary care in a primary care HPSA, $50,000 otherwise, for a two-year commitment; continuation contracts can retire most or all of the debt over further years. Excluded from income under §108(f)(4). The odds shown are conditional on receiving an award; NHSC funds by site score and does not publish an approval rate here, so the figure is the odds of completing the two years once awarded, not the odds of being selected."], ["nhsc.hrsa.gov (2026 cycle)", "26 U.S.C. §108(f)(4)"]));
  out.push(mk("ihs-lrp", Boolean(p.willingIHS), p.willingIHS ? [] : ["Requires two years at an IHS, tribal or urban Indian health facility"], 50_000, 24, 0, 0.92, ["Up to $50,000 for an initial two-year commitment, extendable annually until the debt is paid."], ["ihs.gov/loanrepayment"]));
  out.push(mk("va-edrp", Boolean(p.willingVA), p.willingVA ? [] : ["Requires VA employment in an EDRP-eligible position"], 200_000, 60, 0, 0.9, ["Up to $40,000 a year, $200,000 over five years, reimbursing loan payments; tax-free per VA; no clawback if you leave in good standing."], ["VA Careers EDRP flyer (2024)", "VA News (2020)"]));
  out.push(mk("wv-slrp", Boolean(p.willingHPSA && p.state === "WV"), p.willingHPSA && p.state === "WV" ? [] : ["Requires full-time practice at a West Virginia HPSA site"], 90_000, 48, 0, 0.9, ["$40,000 for the first two years, then up to $25,000 a year for two more — $90,000 over four years; tax-free under §108(f)(4) as a PHSA §338I state program. Stackable with PSLF when the site is a qualifying employer."], ["HRSA State Loan Repayment Program contacts (West Virginia)"]));
  out.push(mk("nih-lrp", Boolean(p.research), p.research ? [] : ["Requires a two-year commitment to NIH-mission research"], 100_000, 24, 0, 0.85, ["Up to $50,000 a year for two years, renewable; competitive award."], ["NIH Grants & Funding, Loan Repayment Programs"]));
  return out;
}

// ─── The other side: what the payment difference becomes ───────────────────
export type InvestmentInput = { years: number; nominalReturn: number; taxDrag: number; wrapperCost: number; monthlyContributions: number[] };
/** Future value of a stream of monthly contributions at an annual return, with a tax drag or a wrapper cost taken off the return. */
export function futureValue(contrib: number[], years: number, annualReturn: number): number {
  const r = annualReturn / 12, n = years * 12;
  let v = 0;
  for (let m = 1; m <= n; m += 1) { v = v * (1 + r) + (contrib[m - 1] ?? 0); }
  return Math.round(v);
}

export type Alternative = { label: string; annualReturnUsed: number; value20: number; value30: number; contributed20: number; contributed30: number };
/** The payment the borrower would have made under the 10-year standard plan minus what the path requires, invested; after forgiveness the whole standard payment is invested. */
export function investmentAlternative(p: BorrowerProfile, path: PathOutcome, nominalReturn = 0.07, taxDrag = 0.25, wrapperCost = 0.01): { taxable: Alternative; taxFree: Alternative; monthlyFreed: number; assumptions: string[] } {
  const std = standardPayment(p.balance, p.annualRate);
  const contrib: number[] = [];
  const horizon = 30 * 12;
  const schedByMonth = new Map(path.schedule.map((s) => [s.month, s.payment]));
  let lastPay = path.schedule[0]?.payment ?? std;
  for (let m = 1; m <= horizon; m += 1) {
    if (path.monthsToForgiveness != null && m > path.monthsToForgiveness) { contrib.push(std); continue; }
    if (schedByMonth.has(m)) lastPay = schedByMonth.get(m)!;
    contrib.push(Math.max(0, std - lastPay));
  }
  const sum = (n: number) => Math.round(contrib.slice(0, n * 12).reduce((s, x) => s + x, 0));
  const taxable: Alternative = { label: "Taxable account", annualReturnUsed: nominalReturn * (1 - taxDrag), value20: futureValue(contrib, 20, nominalReturn * (1 - taxDrag)), value30: futureValue(contrib, 30, nominalReturn * (1 - taxDrag)), contributed20: sum(20), contributed30: sum(30) };
  const taxFree: Alternative = { label: "Tax-free wrapper (Roth or a properly funded cash-value policy such as IUL), net of its cost", annualReturnUsed: nominalReturn - wrapperCost, value20: futureValue(contrib, 20, nominalReturn - wrapperCost), value30: futureValue(contrib, 30, nominalReturn - wrapperCost), contributed20: sum(20), contributed30: sum(30) };
  return { taxable, taxFree, monthlyFreed: Math.round(contrib[0] ?? 0), assumptions: [
    `Monthly amount freed = 10-year standard payment on the balance (${Math.round(std).toLocaleString("en-US")}) minus the path's payment that month; after forgiveness the whole standard payment is invested.`,
    `Nominal return ${(nominalReturn * 100).toFixed(1)}% a year; the taxable account loses ${(taxDrag * 100).toFixed(0)}% of its growth to tax each year; the tax-free wrapper is charged ${(wrapperCost * 100).toFixed(1)}% a year for its costs — enter the real policy's costs, they vary widely and can be far higher in early years.`,
    "Contribution limits, policy underwriting, MEC rules, surrender charges and the tax treatment of policy loans are not modelled; this is an illustration of what the freed payment could become, not a recommendation of any product.",
  ] };
}

export type ForgivenessOutlook = { profile: BorrowerProfile; paths: PathOutcome[]; best: PathOutcome | null; alternative: ReturnType<typeof investmentAlternative> | null; correlation: ReturnType<typeof politicalCorrelation>; standardPayment: number; standardTotal: number; asOf: string };

export function forgivenessOutlook(p: BorrowerProfile, prob: ProbabilityInputs, now = new Date(), invest: { nominalReturn?: number; taxDrag?: number; wrapperCost?: number } = {}): ForgivenessOutlook {
  const paths = [pslfPath(p, prob, now), idrPath(p, prob, now), ...servicePaths(p, now)];
  const eligible = paths.filter((x) => x.eligible && x.netBenefit > 0);
  const best = eligible.sort((a, b) => (b.netBenefit * (b.probability ?? 0)) - (a.netBenefit * (a.probability ?? 0)))[0] ?? null;
  const std = standardPayment(p.balance, p.annualRate);
  return { profile: p, paths, best, alternative: best ? investmentAlternative(p, best, invest.nominalReturn, invest.taxDrag, invest.wrapperCost) : null, correlation: politicalCorrelation(), standardPayment: Math.round(std), standardTotal: Math.round(std * 120), asOf: now.toISOString().slice(0, 10) };
}
