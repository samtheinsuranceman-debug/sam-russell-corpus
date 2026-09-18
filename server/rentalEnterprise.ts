// ============================================================
// THE RENTAL ENTERPRISE — server side. Three things the shared engine cannot
// do on its own: read every zip the Zip Engine stores and rank them; read
// the county's hazard record from FEMA's National Risk Index file; and read
// the rates of the day (Freddie Mac's mortgage average, the federal funds
// rate, the CPI) so the plan's growth and cost lines come from the record.
// The plan itself (`buildEnterprise`) is pure arithmetic on those inputs and
// on the backtester's crediting history for the chosen index account.
// ============================================================
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { countyHazards, vettedAttorneys, type CountyHazardRow, type VettedAttorneyRow } from "../drizzle/schema";
import { allLevels, allMeta, allRents, pmms, splitCsvLine, unzipEntries } from "./zipData";
import { fetchFredObservationsSince, getCpiFromFred, type Observation } from "./_core/fred";
import { DAY_MS, longInterval } from "./_core/schedule";
import { lastYear, valueAt, worstDrawdown, type AnnualSeries } from "@shared/zipEngine";
import { candidateFromSeries, pickPlans, purchasingPower, runEnterprise, scoreCandidates, type Capacity, type Enterprise, type IulAssumption, type PropertyPlan, type Scored, type ZipCandidate } from "@shared/rentalEnterprise";
import { ALL_INDEX_OPTIONS, getCreditingHistory, MAX_YEAR, MIN_YEAR } from "@shared/indexCreditingData";

// ─── FEMA National Risk Index, county table ─────────────────────────────────
export const NRI = {
  name: "FEMA National Risk Index — county table",
  version: "v1.20 (December 2025)",
  url: "https://www.fema.gov/about/reports-and-data/openfema/nri/v120/NRI_Table_Counties.zip",
  home: "https://hazards.fema.gov/nri/",
  note: "Ratings as FEMA publishes them (Very High, Relatively High, Relatively Moderate, Relatively Low, Very Low) for the county overall and for each of eighteen hazards, and the expected annual loss to buildings in dollars. Column names are read from the file's own header.",
};
/** FEMA's hazard prefixes and the plain names the page shows. */
export const NRI_HAZARDS: Record<string, string> = {
  HAIL: "hail", WFIR: "wildfire", RFLD: "riverineFlood", CFLD: "coastalFlood", HRCN: "hurricane", TRND: "tornado", SWND: "strongWind", WNTW: "winterWeather", ISTM: "iceStorm", LTNG: "lightning",
  ERQK: "earthquake", DRGT: "drought", HWAV: "heatWave", CWAV: "coldWave", LNDS: "landslide", AVLN: "avalanche", TSUN: "tsunami", VLCN: "volcanicActivity",
};
export type CountyHazard = { fips: string; stateAbbr: string; county: string; rating: string | null; ealBuilding: number | null; hazards: Record<string, string | null> };

/** The county CSV → one record per county. Columns are found by header name; a missing column yields null, never a guess. */
export function parseNriCounties(csv: string): CountyHazard[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]!).map((h) => h.replace(/^﻿/, "").trim().toUpperCase());
  const col = (name: string) => header.indexOf(name);
  const iState = col("STATEABBRV"), iCounty = col("COUNTY"), iFips = col("STCOFIPS"), iRating = col("RISK_RATNG"), iEal = col("EAL_VALB");
  if (iState < 0 || iCounty < 0 || iFips < 0) throw new Error("NRI county file: expected STATEABBRV, COUNTY and STCOFIPS columns");
  const hz = Object.entries(NRI_HAZARDS).map(([code, name]) => ({ name, i: col(`${code}_RISKR`) }));
  const out: CountyHazard[] = [];
  for (let k = 1; k < lines.length; k++) {
    const c = splitCsvLine(lines[k]!);
    const stateAbbr = (c[iState] ?? "").trim().toUpperCase(), county = (c[iCounty] ?? "").trim(), fips = (c[iFips] ?? "").trim().padStart(5, "0");
    if (!/^[A-Z]{2}$/.test(stateAbbr) || !county || !/^\d{5}$/.test(fips)) continue;
    const eal = iEal >= 0 ? Number(c[iEal]) : NaN;
    const hazards: Record<string, string | null> = {};
    for (const h of hz) { const v = h.i >= 0 ? (c[h.i] ?? "").trim() : ""; hazards[h.name] = v && v !== "Not Applicable" && v !== "Insufficient Data" && v !== "No Rating" ? v : null; }
    out.push({ fips, stateAbbr, county, rating: iRating >= 0 && c[iRating]?.trim() ? c[iRating]!.trim() : null, ealBuilding: Number.isFinite(eal) ? Math.round(eal) : null, hazards });
  }
  return out;
}

type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; arrayBuffer: () => Promise<ArrayBuffer> }>;
const realFetch: Fetcher = (url) => fetch(url, { headers: { "user-agent": "RussellCapitalSystems/1.0 (public data reader)" } });
let _fetch: Fetcher = realFetch;
export function _setHazardFetchForTests(f: Fetcher | null) { _fetch = f ?? realFetch; }

export async function readNri(): Promise<CountyHazard[]> {
  const res = await _fetch(NRI.url);
  if (!res.ok) throw new Error(`FEMA NRI responded ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const entries = unzipEntries(buf, (n) => /NRI_Table_Counties\.csv$/i.test(n));
  const csv = entries.values().next().value as Buffer | undefined;
  if (!csv) throw new Error("FEMA NRI zip: NRI_Table_Counties.csv not found in the container");
  return parseNriCounties(csv.toString("utf8"));
}

export async function storeHazards(rows: CountyHazard[]): Promise<number> {
  const db = await getDb();
  if (!db || !rows.length) return 0;
  let n = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((r) => ({ fips: r.fips, stateAbbr: r.stateAbbr, county: r.county.slice(0, 80), rating: r.rating, ealBuilding: r.ealBuilding, hazards: r.hazards, source: NRI.url, asOf: NRI.version.slice(0, 20), fetchedAt: new Date() }));
    try {
      await db.insert(countyHazards).values(chunk).onDuplicateKeyUpdate({ set: { stateAbbr: sql`VALUES(stateAbbr)`, county: sql`VALUES(county)`, rating: sql`VALUES(rating)`, ealBuilding: sql`VALUES(ealBuilding)`, hazards: sql`VALUES(hazards)`, source: sql`VALUES(source)`, asOf: sql`VALUES(asOf)`, fetchedAt: new Date() } });
      n += chunk.length;
    } catch (e) { console.warn("[hazards] store failed at", i, String((e as { cause?: { sqlMessage?: string } })?.cause?.sqlMessage ?? e).slice(0, 200)); }
  }
  hazardMemo = null;
  return n;
}

let sweeping: Promise<{ counties: number | string; stored: number; ms: number }> | null = null;
export function hazardSweep(): Promise<{ counties: number | string; stored: number; ms: number }> {
  if (sweeping) return sweeping;
  sweeping = (async () => {
    const t0 = Date.now();
    try { const rows = await readNri(); const stored = await storeHazards(rows); return { counties: rows.length, stored, ms: Date.now() - t0 }; }
    catch (e) { console.warn("[hazards]", String(e).slice(0, 160)); return { counties: String(e).slice(0, 160), stored: 0, ms: Date.now() - t0 }; }
  })().finally(() => { sweeping = null; });
  return sweeping;
}
/** Opt-in: HAZARD_DATA_DAYS=180 re-reads FEMA's file twice a year (first pass three minutes after boot). Off unless set. */
export function startHazardSchedule(env: NodeJS.ProcessEnv = process.env): boolean {
  const days = Number(env.HAZARD_DATA_DAYS ?? 0);
  if (!Number.isFinite(days) || days <= 0) return false;
  setTimeout(() => { hazardSweep().catch(() => undefined); }, 180_000).unref();
  longInterval(() => { hazardSweep().catch(() => undefined); }, days * DAY_MS);
  return true;
}

/** "New Hanover County" and FEMA's "New Hanover" meet here. */
export function normaliseCounty(name: string): string {
  return name.toLowerCase().replace(/\b(county|parish|borough|census area|municipality|city and borough|municipio)\b/g, "").replace(/[^a-z]/g, "");
}
let hazardMemo: { at: number; byKey: Map<string, CountyHazardRow>; count: number } | null = null;
async function hazardIndex(): Promise<{ byKey: Map<string, CountyHazardRow>; count: number }> {
  if (hazardMemo && Date.now() - hazardMemo.at < 6 * 60 * 60 * 1000) return hazardMemo;
  const db = await getDb();
  const byKey = new Map<string, CountyHazardRow>();
  if (db) for (const r of await db.select().from(countyHazards)) byKey.set(`${r.stateAbbr}|${normaliseCounty(r.county)}`, r);
  hazardMemo = { at: Date.now(), byKey, count: byKey.size };
  return hazardMemo;
}
export async function hazardFor(stateAbbr: string | undefined, county: string | undefined): Promise<ZipCandidate["hazard"]> {
  if (!stateAbbr || !county) return null;
  const { byKey } = await hazardIndex();
  const r = byKey.get(`${stateAbbr.toUpperCase()}|${normaliseCounty(county)}`);
  if (!r) return null;
  const h = r.hazards ?? {};
  return { rating: r.rating ?? "", expectedAnnualLossBuilding: r.ealBuilding ?? null, hail: h.hail ?? null, wildfire: h.wildfire ?? null, riverineFlood: h.riverineFlood ?? null, coastalFlood: h.coastalFlood ?? null, hurricane: h.hurricane ?? null, tornado: h.tornado ?? null, source: r.source, asOf: r.asOf };
}
export async function hazardStatus(): Promise<{ counties: number; asOf: string | null; source: string }> {
  const { count, byKey } = await hazardIndex();
  const first = byKey.values().next().value as CountyHazardRow | undefined;
  return { counties: count, asOf: first?.asOf ?? null, source: NRI.url };
}

// ─── The rates of the day ───────────────────────────────────────────────────
export type RateContext = {
  mortgage: { ratePct: number; year: number; asOf: string; source: string } | null;
  fedFunds: { latestPct: number; asOf: string; annual: AnnualSeries; source: string } | null;
  cpi: { annualRatePct: number; asOf: string; source: string } | null;
};
const FRED_FEDFUNDS = "https://fred.stlouisfed.org/series/FEDFUNDS", FRED_CPI = "https://fred.stlouisfed.org/series/CPIAUCSL", FRED_PMMS = "https://fred.stlouisfed.org/series/MORTGAGE30US";
export function annualAverageOf(obs: Observation[]): AnnualSeries | null {
  if (!obs.length) return null;
  const sums = new Map<number, { s: number; n: number }>();
  for (const o of obs) { const y = Number(o.date.slice(0, 4)); if (!Number.isFinite(y) || !Number.isFinite(o.value)) continue; const a = sums.get(y) ?? { s: 0, n: 0 }; a.s += o.value; a.n++; sums.set(y, a); }
  const years = Array.from(sums.keys()).sort((a, b) => a - b);
  if (!years.length) return null;
  const startYear = years[0]!, end = years[years.length - 1]!;
  const values: Array<number | null> = [];
  for (let y = startYear; y <= end; y++) { const a = sums.get(y); values.push(a ? Math.round((a.s / a.n) * 100) / 100 : null); }
  return { startYear, values };
}
let rateMemo: { at: number; value: RateContext } | null = null;
export async function rateContext(env: NodeJS.ProcessEnv = process.env): Promise<RateContext> {
  if (rateMemo && Date.now() - rateMemo.at < 6 * 60 * 60 * 1000) return rateMemo.value;
  const out: RateContext = { mortgage: null, fedFunds: null, cpi: null };
  try { const p = await pmms(); if (p) { const y = lastYear(p.data); const v = y != null ? valueAt(p.data, y) : null; if (y != null && v != null) out.mortgage = { ratePct: v, year: y, asOf: p.asOf, source: FRED_PMMS }; } } catch { /* absent */ }
  try { const obs = await fetchFredObservationsSince("FEDFUNDS", "1990-01-01", env); const annual = annualAverageOf(obs); const last = obs[obs.length - 1]; if (annual && last) out.fedFunds = { latestPct: last.value, asOf: last.date, annual, source: FRED_FEDFUNDS }; } catch { /* absent */ }
  try { const c = await getCpiFromFred(env); if (c) out.cpi = { annualRatePct: c.annualRate, asOf: c.asOf, source: FRED_CPI }; } catch { /* absent */ }
  rateMemo = { at: Date.now(), value: out };
  return out;
}
export function _clearEnterpriseMemoForTests() { rateMemo = null; hazardMemo = null; }

// ─── Candidates from the Zip Engine's store ─────────────────────────────────
export type CandidateQuery = { states?: string[]; zips?: string[]; metros?: string[]; windowYears: number; limit?: number; minValue?: number; maxValue?: number };
export async function enterpriseCandidates(q: CandidateQuery): Promise<{ candidates: Scored[]; considered: number; hazardsKnown: number; windowYears: number }> {
  const [levels, rents, meta] = await Promise.all([allLevels(), allRents(), allMeta()]);
  const states = new Set((q.states ?? []).map((s) => s.toUpperCase()));
  const zips = new Set(q.zips ?? []);
  const metros = (q.metros ?? []).map((m) => m.toLowerCase());
  const raw: ZipCandidate[] = [];
  let hazardsKnown = 0;
  const entries = Array.from(levels.entries());
  for (const [zip, series] of entries) {
    const m = meta.get(zip);
    if (zips.size && !zips.has(zip)) continue;
    if (!zips.size && states.size && !(m?.state && states.has(m.state.toUpperCase()))) continue;
    if (!zips.size && metros.length && !(m?.metro && metros.some((x) => m.metro!.toLowerCase().includes(x)))) continue;
    const c = candidateFromSeries(zip, { levels: series, rent: rents.get(zip) ?? null, meta: m ?? null, worstDrawdown: worstDrawdown(series)?.drawdown ?? null }, q.windowYears);
    if (!c) continue;
    if (q.minValue != null && c.value < q.minValue) continue;
    if (q.maxValue != null && c.value > q.maxValue) continue;
    raw.push(c);
  }
  // Hazards only for the rows that can be ranked; the index is one memoised map, so this is cheap.
  for (const c of raw) { const h = await hazardFor(c.state, c.county); if (h) { c.hazard = h; hazardsKnown++; } }
  const scored = scoreCandidates(raw);
  return { candidates: scored.slice(0, q.limit ?? 40), considered: raw.length, hazardsKnown, windowYears: q.windowYears };
}

// ─── Capacity from the Fact Finder ──────────────────────────────────────────
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };
export type CapacityOverrides = Partial<Pick<Capacity, "annualIncome" | "cashAvailable" | "monthlyDebts" | "creditScore" | "maxDti" | "minDownPct" | "closingPct" | "reservesMonths" | "ratePct" | "termYears">>;
/** Lender rules the page cites: Fannie Mae's Eligibility Matrix (investment purchase, one unit, 85% LTV; two to four units 75%) and Desktop Underwriter's 45% debt-to-income cap. */
export const LENDER_RULES = {
  source: "https://singlefamily.fanniemae.com/media/20786/display",
  label: "Fannie Mae Eligibility Matrix (investment property purchase: 1 unit max 85% LTV, 2–4 units 75%; DU maximum DTI 45%, manual underwriting 36%/45%)",
  minDownPctOneUnit: 15, minDownPctMultiUnit: 25, maxDti: 0.45, reservesMonths: 6,
};
export function capacityFromFactFinder(ff: { sections?: Record<string, Record<string, unknown>> } | null | undefined, rates: RateContext, over: CapacityOverrides = {}): { capacity: Capacity; readFrom: string[] } {
  const inc = ff?.sections?.income ?? {}, cash = ff?.sections?.cash ?? {}, debts = ff?.sections?.debts ?? {}, re = ff?.sections?.realEstate ?? {};
  const incomeKeys = ["w2Income", "bonusIncome", "contractorIncome", "practiceDistributions", "rsuOrEquityComp", "spouseIncome", "rentalIncome"];
  const cashKeys = ["checking", "savings", "moneyMarketCds"];
  const readFrom: string[] = [];
  const annualIncome = incomeKeys.reduce((s, k) => s + num(inc[k]), 0); if (annualIncome) readFrom.push("income lines");
  const cashAvailable = cashKeys.reduce((s, k) => s + num(cash[k]), 0); if (cashAvailable) readFrom.push("cash on hand");
  const monthlyDebts = num(re.primaryMonthlyPayment) + num(debts.studentLoanPayment); if (monthlyDebts) readFrom.push("mortgage and student-loan payments");
  const creditScore = num(debts.creditScore) || null; if (creditScore) readFrom.push("credit score");
  const capacity: Capacity = {
    annualIncome: over.annualIncome ?? annualIncome, cashAvailable: over.cashAvailable ?? cashAvailable, monthlyDebts: over.monthlyDebts ?? monthlyDebts, creditScore: over.creditScore ?? creditScore,
    maxDti: over.maxDti ?? LENDER_RULES.maxDti, minDownPct: over.minDownPct ?? 20, closingPct: over.closingPct ?? 3, reservesMonths: over.reservesMonths ?? LENDER_RULES.reservesMonths,
    ratePct: over.ratePct ?? (rates.mortgage?.ratePct ?? 7), termYears: over.termYears ?? 30,
  };
  return { capacity, readFrom };
}

// ─── The plan ───────────────────────────────────────────────────────────────
export type PlanPick = { zip: string; price: number; label?: string; monthlyRent?: number | null; appreciationPct?: number | null; rentGrowthPct?: number | null };
export type PlanRequest = {
  capacity: Capacity;
  picks: PlanPick[];
  startYear: number; startMonth: number; staggerMonths: number;
  horizonYears: 20 | 30; termYears: 20 | 30; interestOnlyYears: number; investorSpreadPct: number; rateShiftPct: number;
  furnishing: number;
  income: { kind: "ltr" | "str"; nightlyRate?: number; occupancyPct?: number; source: string; asOf: string };
  costs: PropertyPlan["costs"];
  tax: PropertyPlan["tax"];
  growth: { expenseGrowthPct: number | null; appreciationPct: number | null; rentGrowthPct: number | null };
  iul: { optionId: string; startYear: number; premiumLoadPct: number; annualChargePctOfValue: number; loanRatePct: number; firstLoanYear: number; maxLoanPctOfValue: number; newPolicyThreshold: number } | null;
  assignAfterTaxCashPct: number;
};
export type LoanLetter = { label: string; zip: string; purchase: string; price: number; down: number; principal: number; ratePct: number; termYears: number; interestOnlyYears: number; interestOnlyMonthly: number; amortisingMonthly: number; totalInterest: number; paidOffYear: number | null; interestOnlyShareOfIncome: number | null; lines: string[] };
export type PlanAnswer = { enterprise: Enterprise; letters: LoanLetter[]; crediting: { optionId: string; name: string; carrierKey: string; startYear: number; years: Array<{ year: number; creditedRate: number }> } | null; assumptions: string[] };

/** The plan is arithmetic on the request and the crediting history; nothing is read live here so the same request always gives the same answer. */
export function buildEnterprise(req: PlanRequest, rates: RateContext): PlanAnswer {
  const baseRate = req.capacity.ratePct + req.investorSpreadPct + req.rateShiftPct;
  const expenseGrowth = req.growth.expenseGrowthPct ?? rates.cpi?.annualRatePct ?? 3;
  const assumptions: string[] = [];
  assumptions.push(`Loan rate ${baseRate.toFixed(2)}%: ${rates.mortgage ? `Freddie Mac's ${rates.mortgage.year} average ${rates.mortgage.ratePct.toFixed(2)}%` : "the rate typed on the page"} + investor add-on ${req.investorSpreadPct.toFixed(2)}%${req.rateShiftPct ? ` + scenario shift ${req.rateShiftPct.toFixed(2)}%` : ""}.`);
  assumptions.push(`Costs grow ${expenseGrowth.toFixed(2)}% a year: ${req.growth.expenseGrowthPct != null ? "typed" : rates.cpi ? `CPI-U twelve-month change as of ${rates.cpi.asOf}` : "default 3%, no CPI reading on this host"}.`);
  const properties: PropertyPlan[] = req.picks.map((p, i) => {
    const monthIndex = req.startMonth - 1 + i * req.staggerMonths;
    const purchaseYear = req.startYear + Math.floor(monthIndex / 12), purchaseMonth = (monthIndex % 12) + 1;
    const principal = p.price * (1 - req.capacity.minDownPct / 100);
    const appreciationPct = req.growth.appreciationPct ?? p.appreciationPct ?? 0;
    const rentGrowthPct = req.growth.rentGrowthPct ?? p.rentGrowthPct ?? expenseGrowth;
    return {
      zip: p.zip, label: p.label ?? p.zip, price: p.price, purchaseYear, purchaseMonth,
      downPct: req.capacity.minDownPct, closingPct: req.capacity.closingPct, furnishing: req.income.kind === "str" ? req.furnishing : 0,
      loan: { principal, ratePct: baseRate, termYears: req.termYears, interestOnlyYears: req.interestOnlyYears, startYear: purchaseYear, startMonth: purchaseMonth },
      income: req.income.kind === "str" ? { kind: "str", nightlyRate: req.income.nightlyRate ?? 0, occupancyPct: req.income.occupancyPct ?? 0, source: req.income.source, asOf: req.income.asOf } : { kind: "ltr", monthlyRent: p.monthlyRent ?? 0, source: p.monthlyRent != null ? "Zillow ZORI, latest year for the zip" : req.income.source, asOf: req.income.asOf },
      rentGrowthPct, appreciationPct, expenseGrowthPct: expenseGrowth,
      costs: req.costs, tax: req.tax,
    };
  });
  let iul: IulAssumption | null = null;
  let crediting: PlanAnswer["crediting"] = null;
  if (req.iul) {
    const opt = ALL_INDEX_OPTIONS.find((o) => o.id === req.iul!.optionId);
    if (opt) {
      const from = Math.max(MIN_YEAR, Math.max(opt.availableFrom, req.iul.startYear)), hist = getCreditingHistory(opt, from, MAX_YEAR);
      const series = hist.map((h) => h.creditedRate / 100);
      if (series.length) {
        iul = { creditedByYear: (py) => series[(py - 1) % series.length]!, premiumLoadPct: req.iul.premiumLoadPct, annualChargePctOfValue: req.iul.annualChargePctOfValue, loanRatePct: req.iul.loanRatePct, firstLoanYear: req.iul.firstLoanYear, maxLoanPctOfValue: req.iul.maxLoanPctOfValue, newPolicyThreshold: req.iul.newPolicyThreshold };
        crediting = { optionId: opt.id, name: opt.name, carrierKey: opt.carrier, startYear: from, years: hist.map((h) => ({ year: h.year, creditedRate: h.creditedRate })) };
        assumptions.push(`Policy crediting: ${opt.name}'s backtested history ${from}–${MAX_YEAR} applied to policy years 1 onward and repeated after year ${series.length}; loads and charges as typed; loans from policy year ${req.iul.firstLoanYear} at ${req.iul.loanRatePct}% up to ${req.iul.maxLoanPctOfValue}% of cash value. A backtest is arithmetic on the index's past, not a return any policy received.`);
      }
    }
  }
  const enterprise = runEnterprise({ properties, horizonYears: req.horizonYears, startYear: req.startYear, iul, assignAfterTaxCashPct: req.assignAfterTaxCashPct });
  const monthlyIncome = req.capacity.annualIncome / 12;
  const letters: LoanLetter[] = enterprise.perProperty.map(({ plan, result }) => {
    const first = result.loan.years[0];
    const ioMonthly = plan.loan.principal * (plan.loan.ratePct / 100) / 12;
    const purchase = `${plan.purchaseYear}-${String(plan.purchaseMonth).padStart(2, "0")}-01`;
    return {
      label: plan.label, zip: plan.zip, purchase, price: plan.price, down: plan.price * (plan.downPct / 100), principal: plan.loan.principal, ratePct: plan.loan.ratePct, termYears: plan.loan.termYears, interestOnlyYears: plan.loan.interestOnlyYears,
      interestOnlyMonthly: ioMonthly, amortisingMonthly: result.loan.monthlyPaymentAmortising, totalInterest: result.loan.totalInterest, paidOffYear: result.loan.paidOffYear,
      interestOnlyShareOfIncome: monthlyIncome > 0 ? ioMonthly / monthlyIncome : null,
      lines: [
        `Purchase ${purchase} at ${Math.round(plan.price).toLocaleString("en-US")}; ${plan.downPct}% down (${Math.round(plan.price * plan.downPct / 100).toLocaleString("en-US")}) plus ${plan.closingPct}% closing.`,
        `Loan ${Math.round(plan.loan.principal).toLocaleString("en-US")} at ${plan.loan.ratePct.toFixed(2)}% for ${plan.loan.termYears} years${plan.loan.interestOnlyYears ? `, interest-only for the first ${plan.loan.interestOnlyYears}` : ""}.`,
        `Interest-only payment ${Math.round(ioMonthly).toLocaleString("en-US")} a month${monthlyIncome > 0 ? ` (${(100 * ioMonthly / monthlyIncome).toFixed(1)}% of monthly income)` : ""}; amortising payment ${Math.round(result.loan.monthlyPaymentAmortising).toLocaleString("en-US")} a month.`,
        `Total interest over the plan ${Math.round(result.loan.totalInterest).toLocaleString("en-US")}${result.loan.paidOffYear ? `; paid off in ${result.loan.paidOffYear}` : ""}; first year's interest ${Math.round(first?.interest ?? 0).toLocaleString("en-US")}.`,
      ],
    };
  });
  return { enterprise, letters, crediting, assumptions };
}

/** Plan A and Plan B from one purchasing power: the one property, or the several. */
export function proposePlans(scored: Scored[], budget: number, count: number): ReturnType<typeof pickPlans> { return pickPlans(scored, budget, { count }); }
export { purchasingPower };

// ─── Attorneys: the owner's vetted list, and where to look when it is empty ─
export const ATTORNEY_SOURCES = [
  { label: "ACTEC — Find a Fellow (search by state, city, zip, radius and practice area, including Asset Protection)", url: "https://www.actec.org/find-a-lawyer/", verifiedAt: "2026-09-07" },
];
export async function listAttorneys(stateAbbr?: string): Promise<VettedAttorneyRow[]> {
  const db = await getDb(); if (!db) return [];
  return stateAbbr ? db.select().from(vettedAttorneys).where(eq(vettedAttorneys.stateAbbr, stateAbbr.toUpperCase())) : db.select().from(vettedAttorneys);
}
export async function addAttorney(row: { name: string; firm?: string; city?: string; stateAbbr: string; credentials?: string; website?: string; phone?: string; email?: string; note?: string; addedBy: number }): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("no database");
  const r = await db.insert(vettedAttorneys).values({ ...row, stateAbbr: row.stateAbbr.toUpperCase() });
  return Number((r as unknown as [{ insertId: number }])[0]?.insertId ?? 0);
}
export async function removeAttorney(id: number): Promise<void> { const db = await getDb(); if (!db) return; await db.delete(vettedAttorneys).where(eq(vettedAttorneys.id, id)); }

/** What the trust does and does not do, each line with the authority the page links. */
export const TRUST_NOTES = [
  { text: "An irrevocable trust that owns the policies and the rental entities keeps them out of the grantor's estate and, once the transfer is old enough under the state's fraudulent-transfer statute, out of a later creditor's reach. Transfers made to hinder a known creditor are voidable.", source: { label: "Uniform Law Commission (find the Uniform Voidable Transactions Act, formerly the UFTA, in its acts list; each state's version is its own statute)", url: "https://www.uniformlaws.org/" } },
  { text: "Divorce: property held in an irrevocable trust funded before the marriage, or with separate property, is generally outside the marital estate, but the rule is each state's, and a court can look through a trust the grantor still controls. The attorney confirms the state's rule before anything is transferred.", source: { label: "ACTEC — Find a Fellow", url: "https://www.actec.org/find-a-lawyer/" } },
  { text: "Policy loans are not income while the policy stays in force; a lapse with a loan outstanding makes the gain taxable. The loop keeps loans under the cap for that reason.", source: { label: "IRC §7702 and §72(e) — Legal Information Institute", url: "https://www.law.cornell.edu/uscode/text/26/7702" } },
  { text: "The hundred hours: the trust or its entity does not participate; the client does. Keep the log in the client's own name.", source: { label: "Treas. Reg. §1.469-5T(a)", url: "https://www.law.cornell.edu/cfr/text/26/1.469-5T" } },
];
