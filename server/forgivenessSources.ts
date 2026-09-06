// ============================================================
// THE FORGIVENESS PANEL — the authorities the forgiveness engine reads:
// the statute and the agency that runs the programs, the scorekeepers who
// cost them, the auditors who found the failures, the associations that
// measure the debt, and the analysts who model what comes next. Same
// machinery as the tax panel (server/forecastSources.ts): weight = evidence
// × track record × consistency; claims are published figures with dates and
// citations; the council can harvest new ones with the verbatim-quote guard;
// the owner approves. Seeds below were verified on 2026-09-06.
//   Direction on a claim: +1 = forgiveness for existing borrowers becomes
//   more available or more valuable; −1 = less; 0 = a measurement.
// ============================================================
import { type ClaimSeed, type SourceDef, registerPanel } from "./forecastSources";

export const FORGIVENESS_SOURCES: SourceDef[] = [
  { id: "slf-fsa", name: "Federal Student Aid (PSLF and IDR data)", org: "U.S. Department of Education", url: "https://studentaid.gov/data-center/student/loan-forgiveness/pslf-data", horizonYears: 1, publishes: "PSLF and IDR approval counts and dollars; program rules as administered", method: "Administrative records; the authority that runs the programs", defaults: { evidence: 0.95, trackRecord: 0.5, consistency: 0.7 } },
  { id: "slf-cbo", name: "Income-Driven Repayment: Budgetary Costs and Policy Options", org: "Congressional Budget Office", url: "https://www.cbo.gov/publication/56277", horizonYears: 10, publishes: "Subsidy rates and projected forgiveness by plan and borrower type; cost of policy options", method: "Microsimulation on NSLDS data; nonpartisan scorekeeper", defaults: { evidence: 0.9, trackRecord: 0.5, consistency: 0.7 } },
  { id: "slf-gao", name: "Public Service Loan Forgiveness reports", org: "Government Accountability Office", url: "https://www.gao.gov/products/gao-18-547", horizonYears: 1, publishes: "Approval and denial counts, reasons, servicer failures", method: "Audit of servicer and Department records", defaults: { evidence: 0.9, trackRecord: 0.5, consistency: 0.7 } },
  { id: "slf-aamc", name: "Medical Student Education: Debt, Costs, and Loan Repayment", org: "Association of American Medical Colleges", url: "https://students-residents.aamc.org/media/12846/download", horizonYears: 1, publishes: "Median and mean education debt of graduating physicians, share indebted, repayment scenarios", method: "Graduation Questionnaire and tuition surveys of every U.S. medical school", defaults: { evidence: 0.85, trackRecord: 0.5, consistency: 0.7 } },
  { id: "slf-hrsa", name: "National Health Service Corps Loan Repayment Program", org: "Health Resources and Services Administration", url: "https://nhsc.hrsa.gov/loan-repayment/nhsc-loan-repayment-program", horizonYears: 1, publishes: "Award amounts, disciplines, service terms, cycles", method: "The agency that makes the awards", defaults: { evidence: 0.9, trackRecord: 0.5, consistency: 0.6 } },
  { id: "slf-courts", name: "Eighth Circuit rulings on SAVE and ICR forgiveness", org: "U.S. Court of Appeals for the Eighth Circuit", url: "https://ecf.ca8.uscourts.gov/opndir/25/02/242332P.pdf", horizonYears: 1, publishes: "What the statute permits: injunctions and the reading of the ICR authority", method: "Judicial opinion", defaults: { evidence: 0.95, trackRecord: 0.5, consistency: 0.7 } },
  { id: "slf-pwbm", name: "Student loan cost estimates", org: "Penn Wharton Budget Model", url: "https://budgetmodel.wharton.upenn.edu/", horizonYears: 10, publishes: "Budgetary cost of forgiveness and repayment plans", method: "Dynamic model; published assumptions", defaults: { evidence: 0.75, trackRecord: 0.5, consistency: 0.6 } },
  { id: "slf-urban", name: "Student loan research", org: "Urban Institute", url: "https://www.urban.org/", horizonYears: 5, publishes: "Who benefits from IDR and forgiveness; distributional analysis", method: "Microdata analysis", defaults: { evidence: 0.7, trackRecord: 0.5, consistency: 0.6 } },
  { id: "slf-brookings", name: "Student loan research", org: "Brookings Institution", url: "https://www.brookings.edu/", horizonYears: 5, publishes: "Forgiveness cost and incidence; graduate borrowing", method: "Policy analysis", defaults: { evidence: 0.7, trackRecord: 0.5, consistency: 0.6 } },
  { id: "slf-sbpc", name: "Student loan advocacy and data releases", org: "Student Borrower Protection Center", url: "https://protectborrowers.org/", horizonYears: 1, publishes: "Summaries of Department releases; litigation tracking", method: "Advocacy organisation; cites primary releases", defaults: { evidence: 0.55, trackRecord: 0.5, consistency: 0.5 } },
  { id: "slf-fed", name: "Survey of Consumer Finances and household debt data", org: "Federal Reserve", url: "https://www.federalreserve.gov/", horizonYears: 3, publishes: "Student debt balances and distribution", method: "Survey and administrative data", defaults: { evidence: 0.85, trackRecord: 0.5, consistency: 0.7 } },
];
registerPanel(FORGIVENESS_SOURCES);

const AAMC = "AAMC, Medical Student Education: Debt, Costs, and Loan Repayment Fact Card for the Class of 2024 (Oct. 2024), FIRST analysis of the 2024 Graduation Questionnaire";
export const FORGIVENESS_CLAIM_SEEDS: ClaimSeed[] = [
  { sourceId: "slf-fsa", metric: "pslf_borrowers_forgiven_cumulative", horizonYear: 2024, value: "1062870", unit: "borrowers", baseValue: "7000", direction: 1, burdenMultiplier: null, asOf: "2024-12-26", citation: "U.S. Department of Education PSLF data as reported Dec. 26, 2024; ~7,000 approved before Oct. 2021 (ED)", note: "Cumulative PSLF approvals; $78 billion. Platform reading: the program delivers at scale once the rules count real payments." },
  { sourceId: "slf-fsa", metric: "pslf_dollars_forgiven_cumulative_bn", horizonYear: 2024, value: "78", unit: "$ billion", baseValue: null, direction: 1, burdenMultiplier: null, asOf: "2024-12-26", citation: "U.S. Department of Education PSLF data as reported Dec. 26, 2024", note: null },
  { sourceId: "slf-fsa", metric: "idr_adjustment_dollars_bn", horizonYear: 2025, value: "57.1", unit: "$ billion", baseValue: null, direction: 1, burdenMultiplier: null, asOf: "2025-01-16", citation: "ED release, Jan. 16, 2025: $57.1 billion for more than 1.45 million borrowers through the IDR account adjustment", note: null },
  { sourceId: "slf-fsa", metric: "save_dollars_forgiven_bn", horizonYear: 2025, value: "5.5", unit: "$ billion", baseValue: null, direction: 1, burdenMultiplier: null, asOf: "2025-01-16", citation: "ED release, Jan. 16, 2025: $5.5 billion for 414,000 SAVE borrowers", note: "SAVE was later enjoined and ended (8th Cir.; settlement March 9, 2026)." },
  { sourceId: "slf-gao", metric: "pslf_borrowers_forgiven_cumulative", horizonYear: 2018, value: "55", unit: "borrowers", baseValue: null, direction: -1, burdenMultiplier: null, asOf: "2018-04-30", citation: "GAO-18-547 (Sept. 2018): 55 borrowers forgiven; over 890,000 had certified employment", note: "Denials were overwhelmingly for the wrong loans or plans. Platform reading: execution risk, not program risk." },
  { sourceId: "slf-cbo", metric: "idr_subsidy_rate_pct", horizonYear: 2029, value: "16.9", unit: "% of dollars", baseValue: "-12.8", direction: 1, burdenMultiplier: null, asOf: "2020-02-12", citation: "CBO, Income-Driven Repayment Plans for Student Loans: Budgetary Costs and Policy Options (Feb. 2020)", note: "Loans in IDR cost the government 16.9 cents per dollar over 2020–29 versus −12.8 for fixed plans; graduate borrowers hold 61% of IDR volume and account for 81% of forgiveness." },
  { sourceId: "slf-cbo", metric: "graduate_share_of_forgiveness_pct", horizonYear: 2029, value: "81", unit: "%", baseValue: null, direction: 1, burdenMultiplier: null, asOf: "2020-02-12", citation: "CBO, Feb. 2020, Chapter 3", note: "Platform reading: forgiveness is concentrated in exactly the profile of a physician borrower, which is why it draws political fire." },
  { sourceId: "slf-aamc", metric: "median_education_debt_indebted_usd", horizonYear: 2024, value: "205000", unit: "$", baseValue: null, direction: 0, burdenMultiplier: null, asOf: "2024-10-01", citation: AAMC, note: "All schools; public $200,000, private $230,000. 71% of graduates carry education debt; 23% owe $300,000 or more; 63% plan to enter a forgiveness or repayment program." },
  { sourceId: "slf-aamc", metric: "share_graduates_with_debt_pct", horizonYear: 2024, value: "71", unit: "%", baseValue: null, direction: 0, burdenMultiplier: null, asOf: "2024-10-01", citation: AAMC, note: null },
  { sourceId: "slf-aamc", metric: "share_planning_forgiveness_pct", horizonYear: 2024, value: "63", unit: "%", baseValue: null, direction: 0, burdenMultiplier: null, asOf: "2024-10-01", citation: AAMC, note: null },
  { sourceId: "slf-aamc", metric: "pslf_scenario_forgiven_usd", horizonYear: 2035, value: "243000", unit: "$", baseValue: "205000", direction: 1, burdenMultiplier: null, asOf: "2024-10-01", citation: AAMC + ", sample repayment: $205,000 in Direct Loans, IBR through a 3-year residency then $170,000 starting salary with PSLF", note: "Pays about $133,000 over 10 years; about $243,000 forgiven (principal and accrued interest)." },
  { sourceId: "slf-hrsa", metric: "nhsc_lrp_max_award_primary_care_usd", horizonYear: 2026, value: "75000", unit: "$", baseValue: "50000", direction: 1, burdenMultiplier: null, asOf: "2026-01-01", citation: "HRSA, NHSC Loan Repayment Program, 2026 cycle", note: "Full-time two-year commitment in a primary care HPSA; $50,000 for other disciplines; $5,000 Spanish-proficiency enhancement." },
  { sourceId: "slf-pwbm", metric: "save_cost_estimate_bn", horizonYear: 2033, value: "475", unit: "$ billion", baseValue: null, direction: -1, burdenMultiplier: null, asOf: "2023-07-17", citation: "Penn Wharton Budget Model, SAVE budgetary cost estimate update (July 17, 2023), as cited by the 8th Circuit (Aug. 9, 2024)", note: "Platform reading: a cost of this size is what invited the challenge that ended the plan." },
  { sourceId: "slf-courts", metric: "regulatory_forgiveness_enjoined", horizonYear: 2025, value: "1", unit: "ruling", baseValue: null, direction: -1, burdenMultiplier: null, asOf: "2025-02-18", citation: "Missouri v. Trump, No. 24-2332 (8th Cir. Feb. 18, 2025): the ICR statute does not authorise a plan where loans are largely forgiven rather than repaid; forgiveness under SAVE and REPAYE's terms enjoined", note: "Platform reading: forgiveness created by regulation is fragile; forgiveness written in statute (PSLF, IBR, RAP) is not touched by this reasoning." },
];

/** What a claim implies for a borrower's forgiveness outlook: the platform's fixed reading. */
export const FORGIVENESS_METRIC_READING: Record<string, string> = {
  pslf_borrowers_forgiven_cumulative: "delivery at scale",
  pslf_dollars_forgiven_cumulative_bn: "delivery at scale",
  idr_adjustment_dollars_bn: "administrative expansion",
  save_dollars_forgiven_bn: "regulatory expansion, later reversed",
  idr_subsidy_rate_pct: "fiscal pressure on IDR forgiveness",
  graduate_share_of_forgiveness_pct: "political exposure of graduate forgiveness",
  median_education_debt_indebted_usd: "the size of the problem",
  share_graduates_with_debt_pct: "the size of the problem",
  share_planning_forgiveness_pct: "reliance on the programs",
  pslf_scenario_forgiven_usd: "what PSLF is worth to a physician",
  nhsc_lrp_max_award_primary_care_usd: "service-program generosity",
  save_cost_estimate_bn: "cost that invites challenge",
  regulatory_forgiveness_enjoined: "regulatory forgiveness is fragile",
};
