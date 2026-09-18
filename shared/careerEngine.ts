// ============================================================
// THE CAREER LEDGER — what it costs to become a physician, surgeon,
// psychiatrist, dentist, dental specialist, veterinarian or lawyer; what the
// years of training forgo; what the loan really costs; what the hour is
// worth after everything is paid; and where a person stands beside their
// peers. Pure and deterministic. Every length below is the accreditor's or
// the AMA's published figure with its page; every rate is the statute's; the
// tuition and wage records are read from NCES and BLS files by the server
// and never typed here. What no authority publishes is an input the person
// types, labelled as theirs.
// ============================================================

export type Cite = { label: string; url: string; note?: string };

export const SOURCES = {
  amaResidency: { label: "AMA, Medical specialty choice: should residency training length matter (19 Nov 2020)", url: "https://www.ama-assn.org/medical-students/preparing-residency/medical-specialty-choice-should-residency-training-length" },
  acgmeCards: { label: "ACGME Program Requirements, Cardiovascular Disease, 4.1 Length of Program: 36 months", url: "https://www.acgme.org/globalassets/pfassets/programrequirements/2026-prs/141_cardiovasculardisease_2026.pdf" },
  acgmeGi: { label: "ACGME Program Requirements, Gastroenterology, 4.1 Length of Program: 36 months", url: "https://www.acgme.org/globalassets/pfassets/programrequirements/2026-prs/144_gastroenterology_2026.pdf" },
  codaPrograms: { label: "Commission on Dental Accreditation, Find a Program (program lengths by specialty)", url: "https://coda.ada.org/find-a-program" },
  codaEndo: { label: "CODA Accreditation Standards for Endodontics Programs, Standard 4-1: minimum 24 months", url: "https://coda.ada.org/-/media/project/ada-organization/ada/coda/files/endo.pdf" },
  codaOrtho: { label: "CODA Accreditation Standards for Orthodontics and Dentofacial Orthopedics Programs", url: "https://coda.ada.org/-/media/project/ada-organization/ada/coda/files/ortho.pdf" },
  lcme: { label: "Liaison Committee on Medical Education (four-year MD programme)", url: "https://lcme.org/" },
  codaPredoc: { label: "CODA predoctoral dental education (four-year DDS/DMD)", url: "https://coda.ada.org/" },
  avma: { label: "AVMA Council on Education (four-year DVM)", url: "https://www.avma.org/education/center-for-veterinary-accreditation" },
  abaStandards: { label: "ABA Standards for Approval of Law Schools, Standard 311 (three academic years)", url: "https://www.americanbar.org/groups/legal_education/resources/standards/" },
  studentAid: { label: "Federal Student Aid, Interest Rates and Fees for Federal Student Loans", url: "https://studentaid.gov/understand-aid/types/loans/interest-rates" },
  rateHistory: { label: "Savingforcollege.com, Historical Federal Student Loan Interest Rates and Fees (Kantrowitz, 8 Jun 2026)", url: "https://www.savingforcollege.com/article/historical-federal-student-interest-rates-and-fees" },
  nces33010: { label: "NCES Digest of Education Statistics, Table 330.10 (tuition, fees, room and board, 1963-64 to 2022-23)", url: "https://nces.ed.gov/programs/digest/d23/tables/dt23_330.10.asp" },
  nces33020: { label: "NCES Digest of Education Statistics, Table 330.20 (by state, 2021-22 and 2022-23)", url: "https://nces.ed.gov/programs/digest/d23/tables/dt23_330.20.asp" },
  blsOews: { label: "BLS Occupational Employment and Wage Statistics (OEWS), national and state tables", url: "https://www.bls.gov/oes/tables.htm" },
  aamcTuition: { label: "AAMC Tuition and Student Fees Reports (1996-97 to present, by school)", url: "https://www.aamc.org/data-reports/reporting-tools/report/tuition-and-student-fees-reports" },
  aamcStipends: { label: "AAMC Survey of Resident/Fellow Stipends and Benefits", url: "https://www.aamc.org/data-reports/students-residents/report/aamc-survey-resident/fellow-stipends-and-benefits" },
  amaLiability: { label: "AMA Policy Research Perspectives: medical liability premiums (Medical Liability Monitor rate surveys, 2016-2025)", url: "https://www.ama-assn.org/about/ama-research/policy-research-perspectives-medical-liability-premiums" },
  amaClaims: { label: "AMA Policy Research Perspectives: medical liability claim frequency (28.7% of physicians sued in their career, 2024)", url: "https://www.ama-assn.org/about/ama-research/medical-liability-market-research" },
  npdb: { label: "National Practitioner Data Bank Public Use Data File (payments since 1 Sept 1990; download after a data-use agreement)", url: "https://www.npdb.hrsa.gov/resources/publicData.jsp" },
  aba509: { label: "ABA Required Disclosures (509 reports; tuition by law school)", url: "https://www.americanbar.org/groups/legal_education/accreditation/statistics/archives/" },
  codaTuition: { label: "CODA Survey of Dental Education, Report 2: tuition, admission and attrition (by school)", url: "https://coda.ada.org/-/media/project/ada-organization/ada/ada-org/files/resources/research/hpi/sde2_2025-26.xlsx" },
} as const satisfies Record<string, Cite>;

export type Family = "physician" | "surgeon" | "psychiatry" | "dentist" | "dental-specialist" | "veterinarian" | "attorney";

export type CareerPath = {
  slug: string;
  title: string;            // "Cardiologist"
  plural: string;           // "cardiologists"
  family: Family;
  degree: { name: string; years: number; source: Cite };
  /** Post-degree training required before independent practice: residency (and the fellowship the title implies). */
  residency: { years: number; maxYears?: number; source: Cite; note?: string };
  fellowship?: { years: number; source: Cite; note?: string };
  /** BLS OEWS occupation: the 2018 SOC code (May 2019 onward) and, where different, the 2010 code the earlier files used. */
  soc: { code: string; title: string; legacy?: { code: string; title: string } };
};

const MD = { name: "MD or DO", years: 4, source: SOURCES.lcme };
const DDS = { name: "DDS or DMD", years: 4, source: SOURCES.codaPredoc };
const AMA = SOURCES.amaResidency;
const physSoc = { code: "29-1229", title: "Physicians, All Other", legacy: { code: "29-1069", title: "Physicians and Surgeons, All Other" } };
const surgSoc = { code: "29-1249", title: "Surgeons, All Other", legacy: { code: "29-1067", title: "Surgeons" } };
const dentSpecSoc = { code: "29-1029", title: "Dentists, All Other Specialists" };

export const CAREER_PATHS: CareerPath[] = [
  // Primary and medical specialties
  { slug: "family-medicine", title: "Family medicine physician", plural: "family physicians", family: "physician", degree: MD, residency: { years: 3, maxYears: 4, source: AMA }, soc: { code: "29-1215", title: "Family Medicine Physicians", legacy: { code: "29-1062", title: "Family and General Practitioners" } } },
  { slug: "internal-medicine", title: "Internist", plural: "internists", family: "physician", degree: MD, residency: { years: 3, source: AMA }, soc: { code: "29-1216", title: "General Internal Medicine Physicians", legacy: { code: "29-1063", title: "Internists, General" } } },
  { slug: "pediatrics", title: "Pediatrician", plural: "pediatricians", family: "physician", degree: MD, residency: { years: 3, source: AMA }, soc: { code: "29-1221", title: "Pediatricians, General", legacy: { code: "29-1065", title: "Pediatricians, General" } } },
  { slug: "emergency-medicine", title: "Emergency medicine physician", plural: "emergency physicians", family: "physician", degree: MD, residency: { years: 3, maxYears: 4, source: AMA }, soc: { code: "29-1214", title: "Emergency Medicine Physicians", legacy: { code: "29-1069", title: "Physicians and Surgeons, All Other" } } },
  { slug: "anesthesiology", title: "Anesthesiologist", plural: "anesthesiologists", family: "physician", degree: MD, residency: { years: 4, source: AMA }, soc: { code: "29-1211", title: "Anesthesiologists", legacy: { code: "29-1061", title: "Anesthesiologists" } } },
  { slug: "dermatology", title: "Dermatologist", plural: "dermatologists", family: "physician", degree: MD, residency: { years: 4, source: AMA }, soc: { code: "29-1213", title: "Dermatologists", legacy: { code: "29-1069", title: "Physicians and Surgeons, All Other" } } },
  { slug: "neurology", title: "Neurologist", plural: "neurologists", family: "physician", degree: MD, residency: { years: 3, maxYears: 4, source: AMA }, soc: { code: "29-1217", title: "Neurologists", legacy: { code: "29-1069", title: "Physicians and Surgeons, All Other" } } },
  { slug: "obstetrics-gynecology", title: "Obstetrician-gynecologist", plural: "OB-GYNs", family: "physician", degree: MD, residency: { years: 4, source: AMA }, soc: { code: "29-1218", title: "Obstetricians and Gynecologists", legacy: { code: "29-1064", title: "Obstetricians and Gynecologists" } } },
  { slug: "radiology", title: "Diagnostic radiologist", plural: "radiologists", family: "physician", degree: MD, residency: { years: 5, source: AMA }, soc: { code: "29-1224", title: "Radiologists", legacy: { code: "29-1069", title: "Physicians and Surgeons, All Other" } } },
  { slug: "interventional-radiology", title: "Interventional radiologist", plural: "interventional radiologists", family: "physician", degree: MD, residency: { years: 6, maxYears: 7, source: AMA }, soc: { code: "29-1224", title: "Radiologists", legacy: { code: "29-1069", title: "Physicians and Surgeons, All Other" } } },
  { slug: "radiation-oncology", title: "Radiation oncologist", plural: "radiation oncologists", family: "physician", degree: MD, residency: { years: 5, source: AMA }, soc: physSoc },
  { slug: "pathology", title: "Pathologist", plural: "pathologists", family: "physician", degree: MD, residency: { years: 3, maxYears: 4, source: AMA }, soc: { code: "29-1222", title: "Physicians, Pathologists", legacy: { code: "29-1069", title: "Physicians and Surgeons, All Other" } } },
  { slug: "nuclear-medicine", title: "Nuclear medicine physician", plural: "nuclear medicine physicians", family: "physician", degree: MD, residency: { years: 4, source: AMA }, soc: physSoc },
  { slug: "preventive-medicine", title: "Preventive medicine physician", plural: "preventive medicine physicians", family: "physician", degree: MD, residency: { years: 3, source: AMA }, soc: physSoc },
  { slug: "cardiology", title: "Cardiologist", plural: "cardiologists", family: "physician", degree: MD, residency: { years: 3, source: AMA, note: "internal medicine" }, fellowship: { years: 3, source: SOURCES.acgmeCards }, soc: { code: "29-1212", title: "Cardiologists", legacy: { code: "29-1063", title: "Internists, General" } } },
  { slug: "gastroenterology", title: "Gastroenterologist", plural: "gastroenterologists", family: "physician", degree: MD, residency: { years: 3, source: AMA, note: "internal medicine" }, fellowship: { years: 3, source: SOURCES.acgmeGi }, soc: { code: "29-1229", title: "Physicians, All Other", legacy: { code: "29-1063", title: "Internists, General" } } },
  // Psychiatry
  { slug: "psychiatry", title: "Psychiatrist", plural: "psychiatrists", family: "psychiatry", degree: MD, residency: { years: 4, source: AMA }, soc: { code: "29-1223", title: "Psychiatrists", legacy: { code: "29-1066", title: "Psychiatrists" } } },
  { slug: "child-psychiatry", title: "Child and adolescent psychiatrist", plural: "child psychiatrists", family: "psychiatry", degree: MD, residency: { years: 4, source: AMA, note: "general psychiatry; the child fellowship is entered from it" }, soc: { code: "29-1223", title: "Psychiatrists", legacy: { code: "29-1066", title: "Psychiatrists" } } },
  { slug: "child-neurology", title: "Child neurologist", plural: "child neurologists", family: "physician", degree: MD, residency: { years: 5, source: AMA }, soc: { code: "29-1217", title: "Neurologists", legacy: { code: "29-1069", title: "Physicians and Surgeons, All Other" } } },
  // Surgeons
  { slug: "general-surgery", title: "General surgeon", plural: "general surgeons", family: "surgeon", degree: MD, residency: { years: 5, source: AMA }, soc: surgSoc },
  { slug: "orthopedic-surgery", title: "Orthopedic surgeon", plural: "orthopedic surgeons", family: "surgeon", degree: MD, residency: { years: 5, source: AMA }, soc: { code: "29-1242", title: "Orthopedic Surgeons, Except Pediatric", legacy: { code: "29-1067", title: "Surgeons" } } },
  { slug: "neurosurgery", title: "Neurosurgeon", plural: "neurosurgeons", family: "surgeon", degree: MD, residency: { years: 7, source: AMA }, soc: surgSoc },
  { slug: "plastic-surgery", title: "Plastic surgeon", plural: "plastic surgeons", family: "surgeon", degree: MD, residency: { years: 6, source: AMA, note: "integrated" }, soc: surgSoc },
  { slug: "thoracic-surgery", title: "Thoracic surgeon", plural: "thoracic surgeons", family: "surgeon", degree: MD, residency: { years: 6, maxYears: 7, source: AMA }, soc: surgSoc },
  { slug: "vascular-surgery", title: "Vascular surgeon", plural: "vascular surgeons", family: "surgeon", degree: MD, residency: { years: 5, source: AMA }, soc: surgSoc },
  { slug: "urology", title: "Urologist", plural: "urologists", family: "surgeon", degree: MD, residency: { years: 5, source: AMA }, soc: surgSoc },
  { slug: "otolaryngology", title: "Otolaryngologist (ENT surgeon)", plural: "ENT surgeons", family: "surgeon", degree: MD, residency: { years: 5, source: AMA }, soc: surgSoc },
  { slug: "ophthalmology", title: "Ophthalmologist", plural: "ophthalmologists", family: "surgeon", degree: MD, residency: { years: 4, source: AMA }, soc: { code: "29-1241", title: "Ophthalmologists, Except Pediatric", legacy: { code: "29-1067", title: "Surgeons" } } },
  { slug: "pediatric-surgery", title: "Pediatric surgeon", plural: "pediatric surgeons", family: "surgeon", degree: MD, residency: { years: 5, source: AMA, note: "general surgery; the pediatric fellowship follows" }, soc: { code: "29-1243", title: "Pediatric Surgeons", legacy: { code: "29-1067", title: "Surgeons" } } },
  // Dentistry
  { slug: "general-dentistry", title: "General dentist", plural: "general dentists", family: "dentist", degree: DDS, residency: { years: 0, source: SOURCES.codaPrograms, note: "no residency is required to practise; optional one-year GPR or AEGD" }, soc: { code: "29-1021", title: "Dentists, General" } },
  { slug: "oral-maxillofacial-surgery", title: "Oral and maxillofacial surgeon", plural: "oral surgeons", family: "dental-specialist", degree: DDS, residency: { years: 4, maxYears: 6, source: SOURCES.codaPrograms, note: "minimum four years; two to four more with an MD or PhD" }, soc: { code: "29-1022", title: "Oral and Maxillofacial Surgeons" } },
  { slug: "orthodontics", title: "Orthodontist", plural: "orthodontists", family: "dental-specialist", degree: DDS, residency: { years: 2, maxYears: 3, source: SOURCES.codaOrtho, note: "the minimum is set in Standard 4 of the CODA orthodontics standards (not transcribed here); programmes are commonly two to three years, confirm on the standard" }, soc: { code: "29-1023", title: "Orthodontists" } },
  { slug: "periodontics", title: "Periodontist", plural: "periodontists", family: "dental-specialist", degree: DDS, residency: { years: 3, source: SOURCES.codaPrograms, note: "three consecutive academic years, minimum 30 months" }, soc: dentSpecSoc },
  { slug: "endodontics", title: "Endodontist", plural: "endodontists", family: "dental-specialist", degree: DDS, residency: { years: 2, source: SOURCES.codaEndo, note: "minimum 24 months" }, soc: dentSpecSoc },
  { slug: "prosthodontics", title: "Prosthodontist", plural: "prosthodontists", family: "dental-specialist", degree: DDS, residency: { years: 3, source: SOURCES.codaPrograms, note: "minimum 33 months" }, soc: { code: "29-1024", title: "Prosthodontists" } },
  { slug: "pediatric-dentistry", title: "Pediatric dentist", plural: "pediatric dentists", family: "dental-specialist", degree: DDS, residency: { years: 2, source: SOURCES.codaPrograms, note: "minimum 24 months" }, soc: dentSpecSoc },
  // Other doctorates
  { slug: "veterinary-medicine", title: "Veterinarian", plural: "veterinarians", family: "veterinarian", degree: { name: "DVM", years: 4, source: SOURCES.avma }, residency: { years: 0, source: SOURCES.avma, note: "no residency is required to practise; specialty residencies are optional" }, soc: { code: "29-1131", title: "Veterinarians" } },
  { slug: "law", title: "Attorney", plural: "attorneys", family: "attorney", degree: { name: "JD", years: 3, source: SOURCES.abaStandards }, residency: { years: 0, source: SOURCES.abaStandards, note: "bar admission; no residency" }, soc: { code: "23-1011", title: "Lawyers" } },
];

export function careerPath(slug: string): CareerPath | undefined { return CAREER_PATHS.find((p) => p.slug === slug); }
export const FAMILY_LABEL: Record<Family, string> = { physician: "Physicians", surgeon: "Surgeons", psychiatry: "Psychiatry", dentist: "Dentists", "dental-specialist": "Dental specialists", veterinarian: "Veterinarians", attorney: "Attorneys" };

/** Years from the first day of the degree to the first day of independent practice. */
export function trainingYears(p: CareerPath): number { return p.degree.years + p.residency.years + (p.fellowship?.years ?? 0); }

// ─── Federal loan rates by academic year (fixed rates began 2006-07) ────────
/** Direct Unsubsidized (graduate/professional) and Direct PLUS fixed rates, percent, by the academic year of first disbursement. 2006-07 to 2012-13 were set in statute; from 2013-14 each is the May 10-year Treasury high yield plus a statutory margin (graduate +3.60, PLUS +4.60; undergraduate +2.05). Pre-2006 loans were variable and are not modelled: type the rate on the note. */
export const FEDERAL_LOAN_RATES: Array<{ year: number; gradUnsub: number; plus: number; note?: string }> = [
  { year: 2006, gradUnsub: 6.80, plus: 7.90 }, { year: 2007, gradUnsub: 6.80, plus: 7.90 }, { year: 2008, gradUnsub: 6.80, plus: 7.90 }, { year: 2009, gradUnsub: 6.80, plus: 7.90 },
  { year: 2010, gradUnsub: 6.80, plus: 7.90 }, { year: 2011, gradUnsub: 6.80, plus: 7.90 }, { year: 2012, gradUnsub: 6.80, plus: 7.90 },
  { year: 2013, gradUnsub: 5.41, plus: 6.41, note: "undergraduate 3.86 plus the statutory margins" }, { year: 2014, gradUnsub: 6.21, plus: 7.21, note: "undergraduate 4.66 plus the statutory margins" },
  { year: 2015, gradUnsub: 5.84, plus: 6.84, note: "undergraduate 4.29 plus the statutory margins" }, { year: 2016, gradUnsub: 5.31, plus: 6.31, note: "undergraduate 3.76 plus the statutory margins" },
  { year: 2017, gradUnsub: 6.00, plus: 7.00, note: "undergraduate 4.45 plus the statutory margins" }, { year: 2018, gradUnsub: 6.60, plus: 7.60 }, { year: 2019, gradUnsub: 6.08, plus: 7.08 },
  { year: 2020, gradUnsub: 4.30, plus: 5.30 }, { year: 2021, gradUnsub: 5.28, plus: 6.28 }, { year: 2022, gradUnsub: 6.54, plus: 7.54, note: "undergraduate 4.99 plus the statutory margins" }, { year: 2023, gradUnsub: 7.05, plus: 8.05 },
  { year: 2024, gradUnsub: 8.08, plus: 9.08 }, { year: 2025, gradUnsub: 7.94, plus: 8.94 }, { year: 2026, gradUnsub: 8.07, plus: 9.07, note: "Grad PLUS closed to new borrowers from 1 July 2026 (One Big Beautiful Bill Act); the PLUS rate applies to parents" },
];
export const LOAN_RATE_SOURCES: Cite[] = [SOURCES.studentAid, SOURCES.rateHistory];
/** Origination fees, percent of the amount borrowed, on or after 1 Oct 2020: Direct Unsubsidized 1.057, PLUS 4.228 (studentaid.gov). */
export const LOAN_FEES = { gradUnsub: 1.057, plus: 4.228 } as const;

export function loanRateFor(academicYear: number, kind: "gradUnsub" | "plus" = "gradUnsub"): number | null {
  const r = FEDERAL_LOAN_RATES.find((x) => x.year === academicYear);
  return r ? r[kind] : null;
}

// ─── Arithmetic ─────────────────────────────────────────────────────────────
export type TrainingCostInput = {
  startYear: number;         // academic year the degree begins
  degreeYears: number;
  tuitionPerYear: number;    // tuition and fees, first year, from the record or typed
  livingPerYear: number;     // room, board, books, transport, phone, insurance: the person's own figure or the record's
  costGrowthPct: number;     // per year
  borrowedShare: number;     // 0..1 of each year's cost that is borrowed
  ratePct?: number | null;   // override; else the federal graduate rate for each year
  feePct?: number;           // origination fee
};
export type TrainingCostYear = { year: number; tuition: number; living: number; cost: number; borrowed: number; ratePct: number; interestAccrued: number; balance: number };
export type TrainingCost = { years: TrainingCostYear[]; totalCost: number; totalBorrowed: number; totalInterestInSchool: number; balanceAtGraduation: number; weightedRatePct: number };

/** Cost of the degree year by year, and the loan balance at graduation with in-school interest capitalised each year (unsubsidised loans accrue from disbursement). */
export function trainingCost(x: TrainingCostInput): TrainingCost {
  const years: TrainingCostYear[] = [];
  let balance = 0, totalCost = 0, totalBorrowed = 0, totalInterest = 0, rateWeight = 0;
  for (let i = 0; i < x.degreeYears; i++) {
    const year = x.startYear + i;
    const g = Math.pow(1 + x.costGrowthPct / 100, i);
    const tuition = x.tuitionPerYear * g, living = x.livingPerYear * g, cost = tuition + living;
    const borrowed = cost * Math.min(1, Math.max(0, x.borrowedShare));
    const ratePct = x.ratePct ?? loanRateFor(year) ?? loanRateFor(FEDERAL_LOAN_RATES[FEDERAL_LOAN_RATES.length - 1]!.year)!;
    const fee = borrowed * ((x.feePct ?? LOAN_FEES.gradUnsub) / 100);
    balance += borrowed + fee;
    const interest = balance * (ratePct / 100);
    balance += interest;
    totalCost += cost; totalBorrowed += borrowed; totalInterest += interest; rateWeight += ratePct * borrowed;
    years.push({ year, tuition, living, cost, borrowed, ratePct, interestAccrued: interest, balance });
  }
  return { years, totalCost, totalBorrowed, totalInterestInSchool: totalInterest, balanceAtGraduation: balance, weightedRatePct: totalBorrowed > 0 ? rateWeight / totalBorrowed : 0 };
}

export type OpportunityInput = {
  trainingYears: number;      // residency + fellowship years
  stipendPerYear: number;     // what a resident is paid (AAMC survey figure or typed)
  attendingSalary: number;    // what the finished specialist earns (BLS record or typed)
  alternativeSalary: number;  // what the same person could have earned instead (a bachelor's-level job, typed or BLS)
  investReturnPct: number;    // what forgone dollars would have earned if invested
  loanBalance?: number;       // carried through training, accruing
  loanRatePct?: number;
};
export type Opportunity = { years: Array<{ year: number; stipend: number; alternative: number; forgone: number; forgoneCompounded: number; loanInterest: number; loanBalance: number }>; forgoneTotal: number; forgoneCompounded: number; loanInterestDuringTraining: number; loanBalanceAfter: number; yearsToRecoverAtAttendingPremium: number | null };

/** What the training years forgo against the alternative, compounded at the stated return, and the loan's growth meanwhile. Years to recover = the compounded gap divided by the attending premium over the alternative. */
export function opportunityCost(x: OpportunityInput): Opportunity {
  const years: Opportunity["years"] = [];
  let compounded = 0, forgoneTotal = 0, bal = x.loanBalance ?? 0, loanInterest = 0;
  for (let y = 1; y <= x.trainingYears; y++) {
    const forgone = Math.max(0, x.alternativeSalary - x.stipendPerYear);
    compounded = compounded * (1 + x.investReturnPct / 100) + forgone;
    forgoneTotal += forgone;
    const li = bal * ((x.loanRatePct ?? 0) / 100);
    bal += li; loanInterest += li;
    years.push({ year: y, stipend: x.stipendPerYear, alternative: x.alternativeSalary, forgone, forgoneCompounded: compounded, loanInterest: li, loanBalance: bal });
  }
  const premium = x.attendingSalary - x.alternativeSalary;
  return { years, forgoneTotal, forgoneCompounded: compounded, loanInterestDuringTraining: loanInterest, loanBalanceAfter: bal, yearsToRecoverAtAttendingPremium: premium > 0 ? compounded / premium : null };
}

/** Level payment on a loan and the total interest over its term. */
export function repayment(balance: number, ratePct: number, termYears: number): { monthly: number; totalInterest: number; totalPaid: number } {
  if (balance <= 0 || termYears <= 0) return { monthly: 0, totalInterest: 0, totalPaid: 0 };
  const r = ratePct / 100 / 12, n = termYears * 12;
  const monthly = r === 0 ? balance / n : (balance * r) / (1 - Math.pow(1 + r, -n));
  return { monthly, totalInterest: monthly * n - balance, totalPaid: monthly * n };
}

export type HourlyInput = {
  grossIncome: number;
  incomeTaxes: number;         // federal, state, payroll: the person's own figure or the Ultra Calculator's
  loanPayments: number;        // per year
  practiceExpenses: number;    // malpractice, licences, CME, dues: per year
  vehicleCosts: number;        // per year
  commuteHoursPerWeek: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  travelDaysPerYear: number;   // work travel; counted at 8 hours a day
};
export type Hourly = { net: number; hoursWorked: number; hoursCommittedIncludingTravel: number; grossHourly: number; netHourly: number; netHourlyAllIn: number; lines: string[] };

/** The hour's true worth: gross per hour worked, net per hour worked, and net per hour committed (work plus commute plus travel). */
export function trueHourly(x: HourlyInput): Hourly {
  const hoursWorked = x.hoursPerWeek * x.weeksPerYear;
  const committed = hoursWorked + x.commuteHoursPerWeek * x.weeksPerYear + x.travelDaysPerYear * 8;
  const net = x.grossIncome - x.incomeTaxes - x.loanPayments - x.practiceExpenses - x.vehicleCosts;
  const grossHourly = hoursWorked > 0 ? x.grossIncome / hoursWorked : 0;
  const netHourly = hoursWorked > 0 ? net / hoursWorked : 0;
  const netHourlyAllIn = committed > 0 ? net / committed : 0;
  return { net, hoursWorked, hoursCommittedIncludingTravel: committed, grossHourly, netHourly, netHourlyAllIn, lines: [
    `Hours worked: ${x.hoursPerWeek} × ${x.weeksPerYear} = ${Math.round(hoursWorked).toLocaleString("en-US")}.`,
    `Hours committed with commute and travel: ${Math.round(committed).toLocaleString("en-US")}.`,
    `Net after taxes, loans, practice costs and vehicles: ${Math.round(net).toLocaleString("en-US")}.`,
  ] };
}

// ─── Percentiles against a published distribution ───────────────────────────
export type Pcts = { p10: number | null; p25: number | null; p50: number | null; p75: number | null; p90: number | null };
/** Where a value sits in a published 10/25/50/75/90 distribution, interpolated between the points; clamped to 5 and 95 outside them. BLS suppresses a point above its top code; null points are skipped. */
export function percentileOf(value: number, d: Pcts): number | null {
  const pts = ([[10, d.p10], [25, d.p25], [50, d.p50], [75, d.p75], [90, d.p90]] as Array<[number, number | null]>).filter((p): p is [number, number] => p[1] != null && Number.isFinite(p[1]));
  if (pts.length < 2) return null;
  if (value <= pts[0]![1]) return Math.max(5, pts[0]![0] - 5 * (1 - value / pts[0]![1]));
  const last = pts[pts.length - 1]!;
  if (value >= last[1]) return Math.min(95, last[0] + 5 * Math.min(1, (value - last[1]) / last[1]));
  for (let i = 1; i < pts.length; i++) {
    const [pa, va] = pts[i - 1]!, [pb, vb] = pts[i]!;
    if (value <= vb) return pa + ((value - va) / (vb - va)) * (pb - pa);
  }
  return null;
}

// ─── The peer form and the vision questions ─────────────────────────────────
export type PeerField = { key: string; label: string; kind: "money" | "number" | "pct" | "scale" | "text"; hint?: string };
/** What a specialist enters to be compared with peers. Every figure is theirs; the comparison is arithmetic on what peers entered plus the BLS distribution for income. */
export const PEER_FIELDS: PeerField[] = [
  { key: "grossIncome", label: "Gross income this year", kind: "money" },
  { key: "incomeTaxes", label: "Income and payroll taxes paid", kind: "money" },
  { key: "studentDebt", label: "Student debt remaining", kind: "money" },
  { key: "loanPayments", label: "Loan payments per year", kind: "money" },
  { key: "practiceExpenses", label: "Malpractice, licences, CME, dues per year", kind: "money" },
  { key: "otherDebt", label: "Other debt (mortgage, practice, cars)", kind: "money" },
  { key: "savingsTaxable", label: "Savings in taxable accounts", kind: "money" },
  { key: "savingsTaxDeferred", label: "Savings tax-deferred (401k, 403b, IRA)", kind: "money" },
  { key: "savingsTaxFree", label: "Savings tax-free (Roth, HSA, cash-value life)", kind: "money" },
  { key: "realEstateEquity", label: "Real estate equity", kind: "money" },
  { key: "appreciationPct", label: "Your property's appreciation, % per year (the Zip Engine tells you)", kind: "pct" },
  { key: "vehicleValue", label: "Vehicles you drive, total value", kind: "money" },
  { key: "vehicleCosts", label: "Vehicle costs per year (payments, insurance, fuel)", kind: "money" },
  { key: "hoursPerWeek", label: "Hours worked per week", kind: "number" },
  { key: "weeksPerYear", label: "Weeks worked per year", kind: "number" },
  { key: "commuteHoursPerWeek", label: "Commute hours per week", kind: "number" },
  { key: "travelDaysPerYear", label: "Work travel days per year", kind: "number" },
  { key: "kids", label: "Children", kind: "number" },
  { key: "familyHealth", label: "Family health, 1 (poor) to 10 (excellent)", kind: "scale" },
  { key: "ownHealth", label: "Your health, 1 to 10", kind: "scale" },
  { key: "satisfaction", label: "Life satisfaction, 1 to 10", kind: "scale" },
];

export type VisionQuestion = { key: string; prompt: string; kind: "text" | "scale" };
export const VISION_HORIZONS = [5, 10, 15, 20, 30, 40] as const;
/** The questions the page and the mic ask before a plan is built: the perfect life at each horizon, who has reached it, and the odds. */
export const VISION_QUESTIONS: VisionQuestion[] = [
  ...VISION_HORIZONS.map((h) => ({ key: `perfect${h}`, prompt: `If everything went your way, what does your life look like ${h} years from now?`, kind: "text" as const })),
  { key: "knowAnyone", prompt: "Do you know anyone who has reached this, or is it a pipe dream? Who came close?", kind: "text" },
  { key: "howMany", prompt: "How often does it happen, and to how many people you know?", kind: "text" },
  { key: "rarity", prompt: "How rare is it, 1 (common) to 10 (almost never)?", kind: "scale" },
  { key: "likelihoodNow", prompt: "On the path you are on now, how likely are you to get there, 1 to 10?", kind: "scale" },
  { key: "likelihoodAfter", prompt: "After today's consultation, if everything we laid out goes as described, how likely are you to get there, 1 to 10?", kind: "scale" },
];
export const EXIT_QUESTION = "Before you go: with what you learned today, how likely are you to reach your goals, 1 to 10?";

/** The peer comparison for one field: the person's figure against the peers' median, with the count behind it. Fewer than five peers is reported, not compared. */
export function peerCompare(value: number, peerValues: number[], minPeers = 5): { median: number | null; percentile: number | null; n: number } {
  const v = peerValues.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length < minPeers) return { median: null, percentile: null, n: v.length };
  const median = v.length % 2 ? v[(v.length - 1) / 2]! : (v[v.length / 2 - 1]! + v[v.length / 2]!) / 2;
  const below = v.filter((x) => x < value).length, equal = v.filter((x) => x === value).length;
  return { median, percentile: Math.round(((below + equal / 2) / v.length) * 100), n: v.length };
}
