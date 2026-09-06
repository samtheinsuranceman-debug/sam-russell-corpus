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
// added as the sources publish, by hand or by the fetch + council path.
// ============================================================
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { forecastClaims, forecastSources, type ForecastClaimRow, type ForecastSourceRow } from "../drizzle/schema";
import type { Direction, WeightedClaim } from "@shared/erosion";
import { configuredProviders, leadModel } from "./ultraAI";

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

export async function listSources(): Promise<SourceView[]> {
  const db = await getDb();
  const rows: ForecastSourceRow[] = db ? await db.select().from(forecastSources) : [];
  return SOURCES.map((s) => {
    const r = rows.find((x) => x.id === s.id);
    const evidence = num(r?.evidence) ?? num(r?.aiEvidence) ?? s.defaults.evidence;
    const trackRecord = num(r?.trackRecord) ?? s.defaults.trackRecord;
    const consistency = num(r?.consistency) ?? s.defaults.consistency;
    const enabled = r?.enabled ?? true;
    return { ...s, enabled, evidence, trackRecord, consistency, aiEvidence: num(r?.aiEvidence), aiRationale: r?.aiRationale ?? null, reviewedAt: r?.reviewedAt ?? null, weight: enabled ? sourceWeight(evidence, trackRecord, consistency) : 0, overridden: Boolean(r && (r.evidence != null || r.consistency != null || r.trackRecord != null)) };
  });
}

export async function updateSource(id: string, patch: { enabled?: boolean; evidence?: number | null; trackRecord?: number | null; consistency?: number | null; aiEvidence?: number | null; aiRationale?: string | null; reviewedAt?: Date | null }): Promise<boolean> {
  const db = await getDb();
  if (!db || !SOURCES.some((s) => s.id === id)) return false;
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

/** Seeds the verified claims on first use; never duplicates. */
export async function listClaims(): Promise<ClaimView[]> {
  const db = await getDb();
  if (!db) return CLAIM_SEEDS.map((s, i) => claimView({ id: -(i + 1), createdAt: new Date(), actualValue: null, actualAsOf: null, ...s } as ForecastClaimRow));
  let rows = await db.select().from(forecastClaims);
  if (!rows.length) {
    // Two requests can race here; the unique index makes the second a no-op.
    for (const seed of CLAIM_SEEDS) { try { await db.insert(forecastClaims).values(seed); } catch (e) { if (!String((e as { code?: string })?.code ?? e).includes("ER_DUP_ENTRY")) throw e; } }
    rows = await db.select().from(forecastClaims);
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
export async function weightedClaims(): Promise<{ claims: WeightedClaim[]; totalPanelWeight: number; allPanelWeight: number; sources: SourceView[] }> {
  const [sources, claims] = await Promise.all([listSources(), listClaims()]);
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

/** Pull the source's page as plain text (first ~12k chars) — the evidence the council reads. */
export async function fetchSourceText(source: SourceDef): Promise<string> {
  const res = await _fetch(source.url, { headers: { accept: "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${source.id} → HTTP ${res.status}`);
  const html = await res.text();
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 12_000);
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
