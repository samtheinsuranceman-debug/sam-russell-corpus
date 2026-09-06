// ============================================================
// THE FORECASTER PANEL — the published long-horizon fiscal and tax
// projections the tax trajectory is built from. Each source has a fixed
// definition (who, what they publish, how, how far out), an evidence grade
// (platform default, owner-edited, or graded by the AI council), a track
// record that accrues as actual outcomes are recorded against its claims,
// and a consistency grade. weight = evidence × (½ + ½·track) × (½ + ½·consistency).
//
// Claims are the figures they actually published, with the as-of date and a
// citation, plus the platform's reading of what each implies for a client's
// future tax burden (direction and, where the metric allows, a multiplier).
// The seed set below is what was verified on 2026-09-06; new claims are
// added as the sources publish: by hand (addClaim), or harvested — the AI
// council reads the source's own page and reports figures with the verbatim
// sentence each came from; the sentence is checked against the fetched text
// before anything is stored, and the owner approves each one into the panel.
// ============================================================
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { forecastClaims, forecastHarvests, forecastSources, type ForecastClaimRow, type ForecastHarvestRow, type ForecastSourceRow } from "../drizzle/schema";
import { jsonColumn } from "./_core/jsonColumn";
import type { Direction, WeightedClaim } from "@shared/erosion";
import { configuredProviders, leadModel } from "./ultraAI";
import { fetchFredObservationsSince, type Observation } from "./_core/fred";

export type SourceDef = {
  id: string; name: string; org: string; url: string; horizonYears: number;
  publishes: string; method: string;
  defaults: { evidence: number; trackRecord: number; consistency: number };
};

export const SOURCES: SourceDef[] = [
  { id: "cbo", name: "Long-Term Budget Outlook", org: "Congressional Budget Office", url: "https://www.cbo.gov/publication/61187", horizonYears: 30, publishes: "Revenues, outlays, deficits, debt and interest as % of GDP through 2055; trust-fund exhaustion years", method: "Extended current-law baseline; nonpartisan agency; full economic and demographic model", defaults: { evidence: 0.9, trackRecord: 0.5, consistency: 0.7 } },
  { id: "treasury-fr", name: "Financial Report of the U.S. Government", org: "U.S. Treasury / OMB", url: "https://fiscal.treasury.gov/accounting/us-financial-report/", horizonYears: 75, publishes: "75-year present-value fiscal gap; receipts and non-interest spending as % of GDP", method: "Statement of Long-Term Fiscal Projections; audited by GAO", defaults: { evidence: 0.85, trackRecord: 0.5, consistency: 0.7 } },
  { id: "ssa-trustees", name: "Social Security Trustees Report", org: "Social Security Administration", url: "https://www.ssa.gov/oact/TR/", horizonYears: 75, publishes: "75-year actuarial deficit; trust-fund depletion year; payroll-tax and benefit paths", method: "Actuarial projection under intermediate assumptions; annual", defaults: { evidence: 0.9, trackRecord: 0.5, consistency: 0.7 } },
  { id: "cms-trustees", name: "Medicare Trustees Report", org: "Centers for Medicare & Medicaid Services", url: "https://www.cms.gov/oact/tr", horizonYears: 75, publishes: "HI trust-fund depletion year; Medicare spending as % of GDP", method: "Actuarial projection; annual", defaults: { evidence: 0.85, trackRecord: 0.5, consistency: 0.6 } },
  { id: "jct", name: "Joint Committee on Taxation", org: "U.S. Congress", url: "https://www.jct.gov/", horizonYears: 10, publishes: "Revenue estimates and macroeconomic effects of tax legislation", method: "Official congressional scorekeeper; conventional and dynamic estimates", defaults: { evidence: 0.85, trackRecord: 0.5, consistency: 0.7 } },
  { id: "pwbm", name: "Penn Wharton Budget Model", org: "University of Pennsylvania", url: "https://budgetmodel.wharton.upenn.edu/", horizonYears: 30, publishes: "10- and 30-year debt, GDP and wage effects of legislation; long-run fiscal projections", method: "Dynamic overlapping-generations model; published assumptions", defaults: { evidence: 0.8, trackRecord: 0.5, consistency: 0.6 } },
  { id: "tpc", name: "Tax Policy Center", org: "Urban Institute & Brookings", url: "https://taxpolicycenter.org/", horizonYears: 10, publishes: "Distributional and revenue analysis of tax law; effective-rate tables", method: "Microsimulation model of the tax system", defaults: { evidence: 0.75, trackRecord: 0.5, consistency: 0.6 } },
  { id: "taxfoundation", name: "Tax Foundation", org: "Tax Foundation", url: "https://taxfoundation.org/", horizonYears: 30, publishes: "Revenue, GDP and distribution effects; historical rate tables", method: "Taxes and Growth model; published assumptions", defaults: { evidence: 0.7, trackRecord: 0.5, consistency: 0.6 } },
  { id: "crfb", name: "Committee for a Responsible Federal Budget", org: "CRFB", url: "https://www.crfb.org/", horizonYears: 30, publishes: "Analyses and alternative scenarios built on CBO baselines", method: "Secondary analysis of official projections", defaults: { evidence: 0.65, trackRecord: 0.5, consistency: 0.6 } },
  { id: "gao", name: "Fiscal Outlook", org: "Government Accountability Office", url: "https://www.gao.gov/americas-fiscal-future", horizonYears: 30, publishes: "Long-term fiscal simulations; debt paths under alternative assumptions", method: "Simulation model reconciled to CBO and Trustees", defaults: { evidence: 0.8, trackRecord: 0.5, consistency: 0.6 } },
  { id: "yale-budget-lab", name: "The Budget Lab", org: "Yale University", url: "https://budgetlab.yale.edu/", horizonYears: 30, publishes: "Revenue and distributional analysis of tax and tariff policy", method: "Microsimulation and macro modelling; published methodology", defaults: { evidence: 0.7, trackRecord: 0.5, consistency: 0.5 } },
];

export type ClaimSeed = Omit<typeof forecastClaims.$inferInsert, "id" | "createdAt">;

const CBO = "CBO, The Long-Term Budget Outlook: 2025 to 2055 (March 27, 2025), cbo.gov/publication/61187";
const PRE_OBBBA = "Current-law baseline dated before the One Big Beautiful Bill Act (July 2025), which made the 2017 rate cuts permanent; revenues under current law are now lower than this path.";
const PRESSURE = "Platform reading: sustained deficits and rising debt raise the odds that future taxes are higher; no figure for rates is implied.";

export const CLAIM_SEEDS: ClaimSeed[] = [
  { sourceId: "cbo", metric: "revenue_pct_gdp", horizonYear: 2035, value: "18.3", unit: "% GDP", baseValue: "17.1", direction: 1, burdenMultiplier: "1.0702", asOf: "2025-03-27", citation: CBO, note: PRE_OBBBA },
  { sourceId: "cbo", metric: "revenue_pct_gdp", horizonYear: 2045, value: "18.9", unit: "% GDP", baseValue: "17.1", direction: 1, burdenMultiplier: "1.1053", asOf: "2025-03-27", citation: CBO, note: PRE_OBBBA },
  { sourceId: "cbo", metric: "revenue_pct_gdp", horizonYear: 2055, value: "19.3", unit: "% GDP", baseValue: "17.1", direction: 1, burdenMultiplier: "1.1287", asOf: "2025-03-27", citation: CBO, note: PRE_OBBBA },
  { sourceId: "cbo", metric: "outlays_pct_gdp", horizonYear: 2055, value: "26.6", unit: "% GDP", baseValue: "23.3", direction: 1, burdenMultiplier: null, asOf: "2025-03-27", citation: CBO, note: PRESSURE },
  { sourceId: "cbo", metric: "deficit_pct_gdp", horizonYear: 2055, value: "7.3", unit: "% GDP", baseValue: "6.2", direction: 1, burdenMultiplier: null, asOf: "2025-03-27", citation: CBO, note: PRESSURE },
  { sourceId: "cbo", metric: "debt_pct_gdp", horizonYear: 2055, value: "156", unit: "% GDP", baseValue: "100", direction: 1, burdenMultiplier: null, asOf: "2025-03-27", citation: CBO, note: PRESSURE },
  { sourceId: "cbo", metric: "net_interest_pct_gdp", horizonYear: 2055, value: "5.4", unit: "% GDP", baseValue: "3.2", direction: 1, burdenMultiplier: null, asOf: "2025-03-27", citation: CBO, note: PRESSURE },
  { sourceId: "cbo", metric: "ss_oasi_depletion_year", horizonYear: 2033, value: "2033", unit: "year", baseValue: null, direction: 1, burdenMultiplier: null, asOf: "2025-03-27", citation: CBO, note: "OASI trust fund exhausted; combined OASDI 2034; Medicare HI 2052. Platform reading: benefit cuts or payroll-tax increases become likely near these dates." },
  { sourceId: "cbo", metric: "hist_avg_revenue_pct_gdp", horizonYear: 2024, value: "17.3", unit: "% GDP", baseValue: null, direction: 0, burdenMultiplier: null, asOf: "2025-03-27", citation: CBO, note: "50-year historical average; spending averaged 21.1% and debt 50% of GDP." },
  { sourceId: "pwbm", metric: "debt_change_pct_30y", horizonYear: 2055, value: "24.3", unit: "% change", baseValue: null, direction: 1, burdenMultiplier: null, asOf: "2025-05-20", citation: "Penn Wharton Budget Model, House Reconciliation Bill (OBBBA): Illustrative Calculations with Permanence (May 20, 2025)", note: "If the bill's changes are permanent, debt +11.1% in 10 years, +24.3% in 30 years; wages −0.5%. " + PRESSURE },
  { sourceId: "pwbm", metric: "gdp_effect_pct_30y", horizonYear: 2055, value: "0.7", unit: "%", baseValue: null, direction: 0, burdenMultiplier: null, asOf: "2025-05-23", citation: "Penn Wharton Budget Model, House reconciliation bill: budget, economic and distributional effects (May 23, 2025)", note: "GDP +0.7% after 30 years; capital stock +1.5%." },
  { sourceId: "crfb", metric: "deficit_pct_gdp", horizonYear: 2055, value: "11", unit: "% GDP", baseValue: "6.2", direction: 1, burdenMultiplier: null, asOf: "2025-03-27", citation: "CRFB, Analysis of CBO's March 2025 Long-Term Budget Outlook", note: "Rough estimate with the 2017 tax cuts extended; debt above 200% of GDP. " + PRESSURE },
  { sourceId: "jct", metric: "gdp_effect_pct_10y", horizonYear: 2035, value: "0.4", unit: "%", baseValue: null, direction: 0, burdenMultiplier: null, asOf: "2025-06-10", citation: "JCT, JCX-25-25 macroeconomic analysis of OBBBA (as cited by TPC, June 10, 2025)", note: "GDP +0.4% over 10 years; investment slightly lower." },
  { sourceId: "taxfoundation", metric: "gdp_effect_pct_30y", horizonYear: 2055, value: "0.8", unit: "%", baseValue: null, direction: 0, burdenMultiplier: null, asOf: "2025-06-10", citation: "Tax Foundation, One Big Beautiful Bill analysis (as cited by TPC, June 10, 2025)", note: "GDP +0.8% after 30 years; capital stock +0.2%." },
];

export type SourceView = SourceDef & { enabled: boolean; evidence: number; trackRecord: number; consistency: number; aiEvidence: number | null; aiRationale: string | null; reviewedAt: Date | null; weight: number; overridden: boolean };

const num = (v: string | number | null | undefined): number | null => (v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);

export function sourceWeight(evidence: number, trackRecord: number, consistency: number): number {
  return Math.round(evidence * (0.5 + 0.5 * trackRecord) * (0.5 + 0.5 * consistency) * 1000) / 1000;
}

export async function listSources(defs: SourceDef[] = SOURCES): Promise<SourceView[]> {
  const db = await getDb();
  const rows: ForecastSourceRow[] = db ? await db.select().from(forecastSources) : [];
  return defs.map((s) => {
    const r = rows.find((x) => x.id === s.id);
    const evidence = num(r?.evidence) ?? num(r?.aiEvidence) ?? s.defaults.evidence;
    const trackRecord = num(r?.trackRecord) ?? s.defaults.trackRecord;
    const consistency = num(r?.consistency) ?? s.defaults.consistency;
    const enabled = r?.enabled ?? true;
    return { ...s, enabled, evidence, trackRecord, consistency, aiEvidence: num(r?.aiEvidence), aiRationale: r?.aiRationale ?? null, reviewedAt: r?.reviewedAt ?? null, weight: enabled ? sourceWeight(evidence, trackRecord, consistency) : 0, overridden: Boolean(r && (r.evidence != null || r.consistency != null || r.trackRecord != null)) };
  });
}

/** Every source definition the platform knows, across panels (tax forecasters and, when registered, other panels). */
const PANELS: SourceDef[][] = [SOURCES];
export function registerPanel(defs: SourceDef[]) { if (!PANELS.includes(defs)) PANELS.push(defs); }
export function findSource(id: string): SourceDef | undefined { for (const p of PANELS) { const s = p.find((x) => x.id === id); if (s) return s; } return undefined; }

export async function updateSource(id: string, patch: { enabled?: boolean; evidence?: number | null; trackRecord?: number | null; consistency?: number | null; aiEvidence?: number | null; aiRationale?: string | null; reviewedAt?: Date | null }): Promise<boolean> {
  const db = await getDb();
  if (!db || !findSource(id)) return false;
  const [existing] = await db.select().from(forecastSources).where(eq(forecastSources.id, id)).limit(1);
  const dec = (v: number | null | undefined) => (v == null ? null : String(Math.max(0, Math.min(1, v))));
  const values = { enabled: patch.enabled ?? existing?.enabled ?? true, evidence: patch.evidence !== undefined ? dec(patch.evidence) : existing?.evidence ?? null, trackRecord: patch.trackRecord !== undefined ? dec(patch.trackRecord) : existing?.trackRecord ?? null, consistency: patch.consistency !== undefined ? dec(patch.consistency) : existing?.consistency ?? null, aiEvidence: patch.aiEvidence !== undefined ? dec(patch.aiEvidence) : existing?.aiEvidence ?? null, aiRationale: patch.aiRationale !== undefined ? patch.aiRationale : existing?.aiRationale ?? null, reviewedAt: patch.reviewedAt !== undefined ? patch.reviewedAt : existing?.reviewedAt ?? null, updatedAt: new Date() };
  if (existing) await db.update(forecastSources).set(values).where(eq(forecastSources.id, id));
  else await db.insert(forecastSources).values({ id, ...values });
  return true;
}

export type ClaimView = { id: number; sourceId: string; metric: string; horizonYear: number; value: number | null; unit: string | null; baseValue: number | null; direction: Direction; burdenMultiplier: number | null; asOf: string; citation: string | null; note: string | null; actualValue: number | null; actualAsOf: string | null };

function claimView(r: ForecastClaimRow): ClaimView {
  return { id: r.id, sourceId: r.sourceId, metric: r.metric, horizonYear: r.horizonYear, value: num(r.value), unit: r.unit, baseValue: num(r.baseValue), direction: (Math.sign(r.direction) as Direction), burdenMultiplier: num(r.burdenMultiplier), asOf: r.asOf, citation: r.citation, note: r.note, actualValue: num(r.actualValue), actualAsOf: r.actualAsOf };
}

/** Seeds the verified claims on first use; never duplicates. Scoped to a panel's sources. */
export async function listClaims(defs: SourceDef[] = SOURCES, seeds: ClaimSeed[] = CLAIM_SEEDS): Promise<ClaimView[]> {
  const ids = new Set(defs.map((s) => s.id));
  const db = await getDb();
  if (!db) return seeds.map((s, i) => claimView({ id: -(i + 1), createdAt: new Date(), actualValue: null, actualAsOf: null, ...s } as ForecastClaimRow));
  let rows = (await db.select().from(forecastClaims)).filter((r) => ids.has(r.sourceId));
  if (!rows.length && seeds.length) {
    // Two requests can race here; the unique index makes the second a no-op.
    for (const seed of seeds) { try { await db.insert(forecastClaims).values(seed); } catch (e) { if (!String((e as { code?: string })?.code ?? e).includes("ER_DUP_ENTRY")) throw e; } }
    rows = (await db.select().from(forecastClaims)).filter((r) => ids.has(r.sourceId));
  }
  return rows.map(claimView);
}

export async function addClaim(seed: ClaimSeed): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.insert(forecastClaims).values(seed).$returningId();
  return r?.id ?? null;
}

/** Record what actually happened for a claim; the source's track record is recomputed from every scored claim. */
export async function recordActual(claimId: number, actualValue: number, actualAsOf: string): Promise<{ sourceId: string; trackRecord: number } | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(forecastClaims).where(eq(forecastClaims.id, claimId)).limit(1);
  if (!row) return null;
  await db.update(forecastClaims).set({ actualValue: String(actualValue), actualAsOf }).where(eq(forecastClaims.id, claimId));
  const scored = (await db.select().from(forecastClaims).where(and(eq(forecastClaims.sourceId, row.sourceId)))).filter((c) => c.actualValue != null && c.value != null);
  const errors = scored.map((c) => Math.abs((Number(c.value) - Number(c.actualValue)) / (Math.abs(Number(c.actualValue)) || 1)));
  const mape = errors.length ? errors.reduce((s, e) => s + e, 0) / errors.length : null;
  const trackRecord = mape == null ? 0.5 : Math.round((1 / (1 + mape)) * 1000) / 1000;
  await updateSource(row.sourceId, { trackRecord });
  return { sourceId: row.sourceId, trackRecord };
}

/** Claims weighted by their source, ready for the trajectory model. */
export async function weightedClaims(defs: SourceDef[] = SOURCES, seeds: ClaimSeed[] = CLAIM_SEEDS): Promise<{ claims: WeightedClaim[]; totalPanelWeight: number; allPanelWeight: number; sources: SourceView[] }> {
  const [sources, claims] = await Promise.all([listSources(defs), listClaims(defs, seeds)]);
  const w = new Map(sources.map((s) => [s.id, s.weight]));
  const usable = claims.filter((c) => c.direction !== 0 || c.burdenMultiplier != null);
  // Coverage is measured against the sources that have published something
  // usable ("the speaking panel"); sources with no claims yet do not dilute it.
  const speaking = new Set(usable.map((c) => c.sourceId));
  const totalPanelWeight = sources.filter((s) => speaking.has(s.id)).reduce((s, x) => s + x.weight, 0);
  const allPanelWeight = sources.reduce((s, x) => s + x.weight, 0);
  return { sources, totalPanelWeight, allPanelWeight, claims: usable.map((c) => ({ sourceId: c.sourceId, metric: c.metric, horizonYear: c.horizonYear, direction: c.direction, burdenMultiplier: c.burdenMultiplier, weight: w.get(c.sourceId) ?? 0 })) };
}

// ─── Reading the sources: fetch + the AI council ────────────────────────────
type Fetcher = typeof fetch;
let _fetch: Fetcher = (...a) => fetch(...a);
export function _setFetchForTests(f: Fetcher | null) { _fetch = f ?? ((...a) => fetch(...a)); }

type PdfExtractor = (bytes: Uint8Array) => Promise<string>;
const defaultPdf: PdfExtractor = async (bytes) => { const { extractText } = await import("unpdf"); const r = await extractText(bytes, { mergePages: true }); return Array.isArray(r.text) ? r.text.join(" ") : String(r.text); };
let _pdf: PdfExtractor = defaultPdf;
export function _setPdfExtractorForTests(f: PdfExtractor | null) { _pdf = f ?? defaultPdf; }

/** Pull the source's page — HTML or PDF — as plain text: the evidence the council reads and the text every quote is checked against. */
export async function fetchSourceText(source: Pick<SourceDef, "id" | "url">, maxChars = 40_000): Promise<string> {
  const res = await _fetch(source.url, { headers: { accept: "text/html,application/xhtml+xml,application/pdf" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${source.id} → HTTP ${res.status}`);
  const type = (res.headers?.get?.("content-type") ?? "").toLowerCase();
  const isPdf = type.includes("application/pdf") || /\.pdf($|[?#])/i.test(source.url);
  const raw = isPdf ? await _pdf(new Uint8Array(await res.arrayBuffer())) : (await res.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  return raw.replace(/\s+/g, " ").trim().slice(0, maxChars);
}

export const COUNCIL_SYSTEM = "You grade the evidence quality of a public fiscal or tax forecaster for a financial-planning platform. Judge only methodology transparency, data quality, independence, and horizon discipline. Reply with JSON only: {\"evidence\": 0..1, \"rationale\": \"two sentences\"}. Never invent figures.";

/** Ask every configured AI voice to grade a source; the lead model reconciles. Returns null when no AI is configured. */
export async function councilReview(source: SourceDef, excerpt: string | null): Promise<{ evidence: number; rationale: string; voices: string[] } | null> {
  const team = configuredProviders();
  if (!team.length) return null;
  const user = `Source: ${source.name} (${source.org}), ${source.url}\nPublishes: ${source.publishes}\nMethod: ${source.method}\nHorizon: ${source.horizonYears} years\n${excerpt ? `Excerpt of their current page:\n${excerpt.slice(0, 6000)}` : "No page excerpt available."}\n\nGrade the evidence quality.`;
  const results = await Promise.all(team.map(async (p) => { try { return { label: p.label, text: await p.call(process.env[p.envKey]!, COUNCIL_SYSTEM, user) }; } catch { return null; } }));
  const ok = results.filter((r): r is { label: string; text: string } => Boolean(r));
  const parsed = ok.map((r) => { const m = r.text.match(/\{[\s\S]*\}/); try { const j = m ? (JSON.parse(m[0]) as { evidence?: number; rationale?: string }) : null; return j && typeof j.evidence === "number" ? { label: r.label, evidence: Math.max(0, Math.min(1, j.evidence)), rationale: String(j.rationale ?? "") } : null; } catch { return null; } }).filter((x): x is { label: string; evidence: number; rationale: string } => Boolean(x));
  if (!parsed.length) return null;
  const evidence = Math.round((parsed.reduce((s, x) => s + x.evidence, 0) / parsed.length) * 1000) / 1000;
  let rationale = parsed.map((x) => `${x.label}: ${x.rationale}`).join(" ");
  if (parsed.length > 1) {
    const lead = await leadModel(COUNCIL_SYSTEM.replace("Reply with JSON only: {\"evidence\": 0..1, \"rationale\": \"two sentences\"}", "Reply with two plain sentences."), `${parsed.length} graders reviewed ${source.name}:\n${rationale}\nReconcile them in two sentences.`);
    if (lead?.text) rationale = lead.text.slice(0, 1000);
  }
  return { evidence, rationale, voices: parsed.map((x) => x.label) };
}

// ─── Harvest: the council reads the sources' own pages ──────────────────────
/** Metrics the platform knows how to read. Anything else the council reports is discarded. */
export const HARVEST_METRICS = ["revenue_pct_gdp", "outlays_pct_gdp", "deficit_pct_gdp", "debt_pct_gdp", "net_interest_pct_gdp", "ss_oasi_depletion_year", "ss_oasdi_depletion_year", "medicare_hi_depletion_year", "ss_actuarial_deficit_pct_payroll", "top_rate_pct", "gdp_effect_pct_10y", "gdp_effect_pct_30y", "debt_change_pct_10y", "debt_change_pct_30y", "fiscal_gap_pct_gdp"] as const;
export type HarvestMetric = (typeof HARVEST_METRICS)[number];

/** The platform's deterministic reading of a metric: what it implies for a client's future tax burden. The council never sets direction. */
export function readingFor(metric: string, value: number | null, baseValue: number | null): { direction: Direction; burdenMultiplier: number | null } | null {
  if (!(HARVEST_METRICS as readonly string[]).includes(metric)) return null;
  const vs = (v: number | null): Direction => (v == null || baseValue == null ? 0 : v > baseValue ? 1 : v < baseValue ? -1 : 0);
  switch (metric as HarvestMetric) {
    case "revenue_pct_gdp":
    case "top_rate_pct": {
      const mult = value != null && baseValue != null && baseValue > 0 ? Math.round((value / baseValue) * 10_000) / 10_000 : null;
      return { direction: vs(value), burdenMultiplier: mult };
    }
    case "outlays_pct_gdp": case "deficit_pct_gdp": case "debt_pct_gdp": case "net_interest_pct_gdp": case "fiscal_gap_pct_gdp":
      // Rising spending, deficits, debt or interest are pressure toward higher taxes; no rate figure is implied.
      return { direction: vs(value), burdenMultiplier: null };
    case "ss_oasi_depletion_year": case "ss_oasdi_depletion_year": case "medicare_hi_depletion_year": case "ss_actuarial_deficit_pct_payroll":
      return { direction: 1, burdenMultiplier: null };
    case "debt_change_pct_10y": case "debt_change_pct_30y":
      return { direction: value != null && value > 0 ? 1 : value != null && value < 0 ? -1 : 0, burdenMultiplier: null };
    case "gdp_effect_pct_10y": case "gdp_effect_pct_30y":
      return { direction: 0, burdenMultiplier: null };
  }
}

export const HARVEST_SYSTEM = `You extract published long-horizon fiscal and tax projections from the text of a forecaster's own web page, for a financial-planning platform. Report only figures that appear in the text. Reply with JSON only: {"claims":[{"metric": string, "horizonYear": integer, "value": number, "unit": string, "baseValue": number or null, "asOf": "YYYY-MM-DD" or null, "quote": string}]}. metric must be one of: ${HARVEST_METRICS.join(", ")}. horizonYear is the year the figure refers to. baseValue is the same metric's current or starting value if the text states it, else null. asOf is the publication date if the text states it, else null. quote is the exact sentence from the text that contains the figure, copied verbatim — a claim without a verbatim quote is discarded. Never invent, round, convert, or infer figures. If the text has no such projections, reply {"claims":[]}.`;

export type HarvestCandidate = { metric: string; horizonYear: number; value: number | null; unit: string | null; baseValue: number | null; asOf: string | null; quote: string };
const norm = (t: string) => t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\u2212/g, "-").replace(/\s+/g, " ").trim().toLowerCase();

/** A figure is admissible only if its sentence is really in the page and the number really is in that sentence. */
export function quoteVerified(pageText: string, c: HarvestCandidate): boolean {
  const page = norm(pageText), q = norm(c.quote);
  if (q.length < 12 || !page.includes(q)) return false;
  if (c.value == null) return true;
  const forms = new Set<string>();
  const v = c.value;
  forms.add(String(v)); forms.add(v.toFixed(1)); forms.add(v.toFixed(0)); forms.add(v.toLocaleString("en-US")); forms.add(v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  if (Number.isInteger(v)) forms.add(`${v}`);
  return Array.from(forms).some((f) => q.includes(f.toLowerCase()));
}

export function parseHarvestReply(text: string): HarvestCandidate[] {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return [];
  try {
    const j = JSON.parse(m[0]) as { claims?: unknown };
    if (!Array.isArray(j.claims)) return [];
    return j.claims.flatMap((raw) => {
      const c = raw as Record<string, unknown>;
      const metric = String(c.metric ?? ""), horizonYear = Number(c.horizonYear), quote = String(c.quote ?? "");
      if (!metric || !Number.isInteger(horizonYear) || horizonYear < 2000 || horizonYear > 2125 || !quote) return [];
      const value = c.value == null ? null : Number(c.value), baseValue = c.baseValue == null ? null : Number(c.baseValue);
      const asOf = typeof c.asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.asOf) ? c.asOf : null;
      return [{ metric, horizonYear, value: value != null && Number.isFinite(value) ? value : null, unit: c.unit == null ? null : String(c.unit).slice(0, 20), baseValue: baseValue != null && Number.isFinite(baseValue) ? baseValue : null, asOf, quote: quote.slice(0, 600) }];
    });
  } catch { return []; }
}

export type Ask = (voice: { label: string }, system: string, user: string) => Promise<string>;
const defaultAsk: Ask = async (voice, system, user) => {
  const p = configuredProviders().find((x) => x.label === voice.label);
  if (!p) throw new Error("voice not configured");
  return p.call(process.env[p.envKey]!, system, user);
};

export type HarvestResult = { harvested: true; url: string; pageChars: number; voices: string[]; reported: number; verified: number; stored: number; duplicates: number } | { harvested: false; reason: string };

/** Fetch the page, have every configured voice read it, keep only quote-verified figures the platform can read, and queue them for the owner. */
export async function harvestSource(source: SourceDef, opts: { url?: string; text?: string; voices?: Array<{ label: string }>; ask?: Ask; today?: string } = {}): Promise<HarvestResult> {
  const voices = opts.voices ?? configuredProviders().map((p) => ({ label: p.label }));
  if (!voices.length) return { harvested: false, reason: "No AI provider is configured on the host" };
  const url = opts.url ?? source.url;
  let text = opts.text ?? null;
  if (text == null) { try { text = await fetchSourceText({ ...source, url }); } catch (e) { return { harvested: false, reason: `Could not read ${url}: ${String(e).slice(0, 120)}` }; } }
  if (!text || text.length < 200) return { harvested: false, reason: `Nothing readable at ${url}` };
  const ask = opts.ask ?? defaultAsk;
  const user = `Source: ${source.name} (${source.org}), ${url}\nPublishes: ${source.publishes}\n\nText of the page:\n${text.slice(0, 14_000)}\n\nExtract every long-horizon projection in the text.`;
  const replies = await Promise.all(voices.map(async (v) => { try { return { label: v.label, cands: parseHarvestReply(await ask(v, HARVEST_SYSTEM, user)) }; } catch { return { label: v.label, cands: [] as HarvestCandidate[] }; } }));
  const reported = replies.reduce((s, r) => s + r.cands.length, 0);
  // Verify, read, and corroborate across voices (same metric + year, values within 1%).
  type Kept = HarvestCandidate & { direction: Direction; burdenMultiplier: number | null; voices: string[] };
  const kept: Kept[] = [];
  let verified = 0;
  for (const r of replies) for (const c of r.cands) {
    if (!quoteVerified(text, c)) continue;
    const reading = readingFor(c.metric, c.value, c.baseValue);
    if (!reading) continue;
    verified += 1;
    const same = kept.find((k) => k.metric === c.metric && k.horizonYear === c.horizonYear && ((k.value == null && c.value == null) || (k.value != null && c.value != null && Math.abs(k.value - c.value) <= Math.abs(k.value) * 0.01)));
    if (same) { if (!same.voices.includes(r.label)) same.voices.push(r.label); if (same.baseValue == null && c.baseValue != null) { same.baseValue = c.baseValue; const rr = readingFor(c.metric, same.value, c.baseValue); if (rr) { same.direction = rr.direction; same.burdenMultiplier = rr.burdenMultiplier; } } continue; }
    kept.push({ ...c, ...reading, voices: [r.label] });
  }
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const db = await getDb();
  let stored = 0, duplicates = 0;
  if (db) for (const k of kept) {
    try {
      await db.insert(forecastHarvests).values({ sourceId: source.id, url: url.slice(0, 500), metric: k.metric, horizonYear: k.horizonYear, value: k.value == null ? null : String(k.value), unit: k.unit, baseValue: k.baseValue == null ? null : String(k.baseValue), direction: k.direction, burdenMultiplier: k.burdenMultiplier == null ? null : String(k.burdenMultiplier), asOf: k.asOf ?? today, quote: k.quote, voices: k.voices, corroborated: k.voices.length });
      stored += 1;
    } catch (e) { if (String((e as { code?: string })?.code ?? e).includes("ER_DUP_ENTRY")) duplicates += 1; else throw e; }
  }
  return { harvested: true, url, pageChars: text.length, voices: voices.map((v) => v.label), reported, verified, stored: db ? stored : kept.length, duplicates };
}

export type HarvestView = { id: number; sourceId: string; url: string; metric: string; horizonYear: number; value: number | null; unit: string | null; baseValue: number | null; direction: Direction; burdenMultiplier: number | null; asOf: string; quote: string; voices: string[]; corroborated: number; status: "pending" | "approved" | "rejected"; claimId: number | null; reviewedAt: Date | null; createdAt: Date };
const harvestView = (r: ForecastHarvestRow): HarvestView => ({ id: r.id, sourceId: r.sourceId, url: r.url, metric: r.metric, horizonYear: r.horizonYear, value: num(r.value), unit: r.unit, baseValue: num(r.baseValue), direction: Math.sign(r.direction) as Direction, burdenMultiplier: num(r.burdenMultiplier), asOf: r.asOf, quote: r.quote, voices: jsonColumn<string[]>(r.voices, []), corroborated: r.corroborated, status: r.status, claimId: r.claimId, reviewedAt: r.reviewedAt, createdAt: r.createdAt });

export async function listHarvests(status?: "pending" | "approved" | "rejected"): Promise<HarvestView[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = status ? await db.select().from(forecastHarvests).where(eq(forecastHarvests.status, status)) : await db.select().from(forecastHarvests);
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(harvestView);
}

/** Approve a harvested figure into the panel (with its quote as the note) or reject it. */
export async function reviewHarvest(id: number, approve: boolean): Promise<HarvestView | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(forecastHarvests).where(eq(forecastHarvests.id, id)).limit(1);
  if (!row || row.status !== "pending") return row ? harvestView(row) : null;
  let claimId: number | null = null;
  if (approve) {
    const src = findSource(row.sourceId);
    const citation = `${src?.name ?? row.sourceId}${src ? ` (${src.org})` : ""}, ${row.url} — harvested ${row.createdAt.toISOString().slice(0, 10)}, read by ${jsonColumn<string[]>(row.voices, []).join(", ")}`.slice(0, 500);
    try {
      claimId = await addClaim({ sourceId: row.sourceId, metric: row.metric, horizonYear: row.horizonYear, value: row.value, unit: row.unit, baseValue: row.baseValue, direction: row.direction, burdenMultiplier: row.burdenMultiplier, asOf: row.asOf, citation, note: `“${row.quote}”`.slice(0, 500) });
    } catch (e) { if (!String((e as { code?: string })?.code ?? e).includes("ER_DUP_ENTRY")) throw e; }
  }
  await db.update(forecastHarvests).set({ status: approve ? "approved" : "rejected", claimId, reviewedAt: new Date() }).where(eq(forecastHarvests.id, id));
  if (approve) { const c = consistencyFor(row.sourceId, await listClaims(PANELS.flat(), CLAIM_SEEDS)); if (c) await updateSource(row.sourceId, { consistency: c.consistency }); }
  const [after] = await db.select().from(forecastHarvests).where(eq(forecastHarvests.id, id)).limit(1);
  return after ? harvestView(after) : null;
}

/** Sweep every enabled source, one at a time. */
export async function harvestAll(defs: SourceDef[] = PANELS.flat()): Promise<Array<{ sourceId: string } & HarvestResult>> {
  const sources = await listSources(defs);
  const out: Array<{ sourceId: string } & HarvestResult> = [];
  for (const s of sources.filter((x) => x.enabled)) out.push({ sourceId: s.id, ...(await harvestSource(s)) });
  return out;
}

let sweepTimer: NodeJS.Timeout | null = null;
/** Opt-in scheduled sweep: EROSION_HARVEST_DAYS=7 reads every source weekly (first pass a minute after boot). */
export function startHarvestSchedule(env: NodeJS.ProcessEnv = process.env): boolean {
  const days = Number(env.EROSION_HARVEST_DAYS ?? 0);
  if (!Number.isFinite(days) || days <= 0 || sweepTimer) return false;
  const run = () => import("./power").then(({ powerSweep }) => powerSweep()).then((p) => console.log("[erosion] pulse:", JSON.stringify(p))).then(() => harvestAll()).then((r) => console.log("[erosion] harvest sweep:", r.map((x) => `${x.sourceId}:${x.harvested ? `${x.stored} stored` : "skipped"}`).join(" "))).then(() => scorePanel()).then((sc) => console.log("[erosion] scored", sc.scored.length, "claims; consistency regraded for", Object.keys(sc.consistency).length, "sources")).catch((e) => console.warn("[erosion] sweep failed", String(e).slice(0, 160)));
  setTimeout(run, 60_000).unref?.();
  sweepTimer = setInterval(run, days * 86_400_000);
  sweepTimer.unref?.();
  return true;
}

// ─── Scoring: what actually happened, from the published record ─────────────
// Each metric the panel forecasts maps to the series that records the outcome
// (OMB/Treasury figures as published on FRED, fiscal-year basis). Once a
// claim's year has closed and the figure is published, the actual is recorded
// against the claim and the source's track record recomputes. Nothing is
// typed in; a series that does not answer leaves the claim unscored.
export const ACTUAL_SERIES: Record<string, { series: string; label: string; sign?: 1 | -1; frequency: "annual" | "quarterly" }> = {
  revenue_pct_gdp:      { series: "FYFRGDA188S", label: "Federal receipts as percent of GDP (OMB, fiscal year)", frequency: "annual" },
  outlays_pct_gdp:      { series: "FYONGDA188S", label: "Federal net outlays as percent of GDP (OMB, fiscal year)", frequency: "annual" },
  deficit_pct_gdp:      { series: "FYFSGDA188S", label: "Federal surplus or deficit as percent of GDP (OMB, fiscal year; sign flipped so a deficit is positive)", sign: -1, frequency: "annual" },
  net_interest_pct_gdp: { series: "FYOIGDA188S", label: "Federal outlays: interest as percent of GDP (OMB, fiscal year)", frequency: "annual" },
  debt_pct_gdp:         { series: "FYGFGDQ188S", label: "Federal debt held by the public as percent of GDP (Treasury/OMB, quarterly; last quarter of the year)", frequency: "quarterly" },
};

export type SeriesFetcher = (seriesId: string, start: string) => Promise<Observation[]>;
export type ActualMatch = { claimId: number; sourceId: string; metric: string; horizonYear: number; claimed: number | null; actualValue: number; actualAsOf: string; series: string };

/** Pure: pair every unscored, closed-year claim with the published outcome for its year. */
export async function matchActuals(claims: ClaimView[], fetchSeries: SeriesFetcher, today = new Date()): Promise<{ matched: ActualMatch[]; skipped: Array<{ claimId: number; reason: string }> }> {
  // A fiscal year's figures are published the following autumn; score only years fully behind us.
  const lastClosed = today.getFullYear() - 1;
  const matched: ActualMatch[] = [], skipped: Array<{ claimId: number; reason: string }> = [];
  const cache = new Map<string, Observation[] | null>();
  for (const c of claims) {
    if (c.actualValue != null) continue;
    const def = ACTUAL_SERIES[c.metric];
    if (!def) { skipped.push({ claimId: c.id, reason: `no outcome series for ${c.metric}` }); continue; }
    if (c.horizonYear > lastClosed) { skipped.push({ claimId: c.id, reason: `${c.horizonYear} has not closed` }); continue; }
    if (!cache.has(def.series)) { try { cache.set(def.series, await fetchSeries(def.series, `${c.horizonYear - 1}-01-01`)); } catch { cache.set(def.series, null); } }
    const obs = cache.get(def.series);
    if (!obs) { skipped.push({ claimId: c.id, reason: `${def.series} unavailable` }); continue; }
    const inYear = obs.filter((o) => o.date.startsWith(`${c.horizonYear}-`));
    const pick = inYear.length ? inYear[inYear.length - 1]! : null;
    if (!pick) { skipped.push({ claimId: c.id, reason: `${def.series} has no ${c.horizonYear} observation yet` }); continue; }
    matched.push({ claimId: c.id, sourceId: c.sourceId, metric: c.metric, horizonYear: c.horizonYear, claimed: c.value, actualValue: Math.round(pick.value * (def.sign ?? 1) * 10_000) / 10_000, actualAsOf: pick.date, series: def.series });
  }
  return { matched, skipped };
}

/**
 * Pure: how stable a source's successive projections are. For every metric +
 * year it has published more than once (different as-of dates), the relative
 * spread (max − min) ÷ mean; consistency = 1 ÷ (1 + 4 × mean spread), so no
 * movement scores 1, a 12.5 % swing 0.67, a 25 % swing 0.5. Null when the
 * source has never repeated a projection.
 */
export function consistencyFor(sourceId: string, claims: ClaimView[]): { consistency: number; groups: number } | null {
  const groups = new Map<string, Map<string, number>>();
  for (const c of claims) {
    if (c.sourceId !== sourceId || c.value == null) continue;
    const k = `${c.metric}:${c.horizonYear}`;
    if (!groups.has(k)) groups.set(k, new Map());
    groups.get(k)!.set(c.asOf, c.value);
  }
  const spreads: number[] = [];
  for (const g of Array.from(groups.values())) {
    if (g.size < 2) continue;
    const vals: number[] = Array.from(g.values());
    const mean = vals.reduce((s, v) => s + Math.abs(v), 0) / vals.length;
    if (mean <= 0) continue;
    spreads.push((Math.max(...vals) - Math.min(...vals)) / mean);
  }
  if (!spreads.length) return null;
  const spread = spreads.reduce((s, v) => s + v, 0) / spreads.length;
  return { consistency: Math.round((1 / (1 + 4 * spread)) * 1000) / 1000, groups: spreads.length };
}

/** Score every claim whose year has closed, then regrade every source's consistency. Keyless (FRED CSV). */
export async function scorePanel(opts: { fetchSeries?: SeriesFetcher; today?: Date } = {}): Promise<{ scored: ActualMatch[]; skipped: number; trackRecords: Record<string, number>; consistency: Record<string, number> }> {
  const fetchSeries = opts.fetchSeries ?? ((id, start) => fetchFredObservationsSince(id, start));
  const claims = await listClaims(PANELS.flat(), CLAIM_SEEDS);
  const { matched, skipped } = await matchActuals(claims, fetchSeries, opts.today);
  const trackRecords: Record<string, number> = {};
  for (const m of matched) { const r = await recordActual(m.claimId, m.actualValue, m.actualAsOf); if (r) trackRecords[r.sourceId] = r.trackRecord; }
  const consistency: Record<string, number> = {};
  const fresh = matched.length ? await listClaims(PANELS.flat(), CLAIM_SEEDS) : claims;
  for (const s of PANELS.flat()) { const c = consistencyFor(s.id, fresh); if (c) { consistency[s.id] = c.consistency; await updateSource(s.id, { consistency: c.consistency }); } }
  return { scored: matched, skipped: skipped.length, trackRecords, consistency };
}
