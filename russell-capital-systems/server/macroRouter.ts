/**
 * macroRouter — Global Macro Intelligence endpoints.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * PORT TO THE TRUNK: copies unchanged. Register as `macro: macroRouter` in
 * the trunk's `server/routers.ts`; the trunk's `getDb` and `drizzle/schema`
 * paths are the same relative imports used here; `isOwnerEmailAddress`
 * arrives with the Brain Hub port (`server/ownerGuard.ts`). Full step list in
 * `shared/macro/index.ts`.
 *
 * Reads are public within the portal (they are model outputs on public data);
 * anything that writes (refresh, statement outcomes) is owner-only. Every
 * response carries `asOf` and `sourceIds` so the page can print the ledger.
 *
 * Observations: the engines run on the latest row per indicator from
 * `macro_observations`, layered over the dated seed snapshot. No database
 * means the seed alone — the page shows which.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { isOwnerSession } from "./ownerGuard";
import {
  MACRO_SOURCES,
  SOURCE_MINIMUMS,
  ALL_INDICATORS,
  INDICATOR_PANELS,
  SEED_OBSERVATIONS,
  TREASURY_HOLDINGS,
  TREASURY_MARKET,
  JAPAN_POSITION,
  CHINA_POSITION,
  OIL_SETTLEMENT,
  DEBT_TABLE,
  MACRO_LAYER_VERSION,
  EXPANSION_BUILD_ORDER,
  assessLiquidation,
  simulateLiquidation,
  forecastLiquidation,
  settlementBreakdown,
  historicalSeries,
  forecastPetrodollar,
  CORRIDORS,
  assessAll,
  assessSovereign,
  contagion,
  debtOverview,
  assessTaiwan,
  simulateTaiwanImpact,
  followThroughReport,
  STATEMENT_LEDGER,
  detectPatterns,
  illustrativeSeries,
  macroAdjustments,
  type Observation,
  type Series,
  type Statement,
} from "@shared/macro";
import { runAllConnectors, plausibleTic, CONNECTORS, type StatementDraft } from "./macroConnectors";
import { EXPANSION_CONNECTORS, expansionConnectorInventory } from "./macroConnectorsExpansion";
import { LEDGER_CONNECTORS, requireStatementCitation, requireOutcomeCitation } from "./macroLedger";
import { runHistoryRefresh, backtestAllFactors, loadSeriesMeta, factorSeries, historyManifest } from "./macroHistory";
import { storeVerdicts, loadFactorScores, logFactorForecasts, scoreMaturedForecasts } from "./macroScoring";
import { buildMacroBrief, setBriefExtras, type BriefExtras } from "./macroContext";
import { dryUpFromStore, archaeologyFromStore, globalFromStore, poolSnapshot, TREASURY_STATIC } from "./macroTreasury";
import { TREASURY_POOL_SERIES, LIQUIDITY_PLAYBOOK, liquidityDryUp, predictionGrid, COUNTRIES, FLOW_INDICATORS, COUNTRY_FLOW_EPISODES, globalStorageManifest, treasuryStorageManifest } from "@shared/macro";
import { MACRO_FACTORS, HOUSEHOLD_FACTORS, ALL_FACTORS, FACTOR_BY_ID, accuracyLine, factorSignal, applyFactorVerdicts, HOUSEHOLD_SIGNALS, HOUSEHOLD_IDEAS, collegeCostProjection, relativeWealth, type FactorVerdict } from "@shared/macro";
import { projectionHorizon, projectionReport, NO_EVIDENCE, type ProjectionEvidence } from "@shared/macro";

/** Core (six) plus the twenty-five-domain free tier plus the ledger offices (W8). */
export const ALL_CONNECTORS = [...CONNECTORS, ...EXPANSION_CONNECTORS, ...LEDGER_CONNECTORS];

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Latest observation per indicator: database rows over the seed. Returns the
 * merged list plus a flag saying whether anything live was found.
 */
export async function currentObservations(): Promise<{ observations: Observation[]; live: number; seed: number; latestFetch: string | null }> {
  const byId = new Map<string, Observation>();
  for (const o of SEED_OBSERVATIONS) byId.set(o.indicatorId, o);
  let live = 0;
  let latestFetch: string | null = null;
  const previous = new Map<string, Observation>();
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (db) {
      const { macroObservations } = await import("../drizzle/schema");
      const { desc, ne } = await import("drizzle-orm");
      // History rows are month-end back-fill; the "latest" read excludes them so a 1985 point never masks today's.
      const rows = await db.select().from(macroObservations).where(ne(macroObservations.origin, "history")).orderBy(desc(macroObservations.asOf), desc(macroObservations.id)).limit(4000);
      const seen = new Set<string>();
      for (const r of rows) {
        const o: Observation = { indicatorId: r.indicatorId, asOf: r.asOf, value: Number(r.value), sourceId: r.sourceId, note: r.note ?? undefined };
        if (seen.has(r.indicatorId)) {
          if (!previous.has(r.indicatorId) && r.asOf !== byId.get(r.indicatorId)?.asOf) previous.set(r.indicatorId, o);
          continue;
        }
        seen.add(r.indicatorId);
        byId.set(r.indicatorId, o);
        live++;
        const f = r.fetchedAt instanceof Date ? r.fetchedAt.toISOString() : String(r.fetchedAt);
        if (!latestFetch || f > latestFetch) latestFetch = f;
      }
      try {
        setBriefExtras(await buildBriefExtras(db, byId, previous));
      } catch (e) {
        console.warn("[macro] brief extras failed:", (e as Error).message);
      }
    }
  } catch (e) {
    console.warn("[macro] observation read failed; using seed:", (e as Error).message);
  }
  return { observations: Array.from(byId.values()), live, seed: SEED_OBSERVATIONS.length, latestFetch };
}

/**
 * The since-yesterday inputs for the brief (W8): movers, new statements,
 * dark sources, the accuracy line, per-factor state, recent ledger rows.
 * Read-only; cached in macroContext so the Thomas router's static call sees it.
 */
async function buildBriefExtras(db: NonNullable<Awaited<ReturnType<typeof import("./db").getDb>>>, latest: Map<string, Observation>, previous: Map<string, Observation>): Promise<BriefExtras> {
  const { macroStatements, macroSourceHealth } = await import("../drizzle/schema");
  const { desc, gte } = await import("drizzle-orm");
  const asOf = today();
  const threshold = (await import("@shared/macro")).A("brief.moverThresholdPct");
  const movers: BriefExtras["movers"] = [];
  for (const [id, cur] of Array.from(latest.entries())) {
    const prev = previous.get(id);
    if (!prev || prev.value === 0) continue;
    const changePct = Math.round(((cur.value - prev.value) / Math.abs(prev.value)) * 1000) / 10;
    if (Math.abs(changePct) < threshold) continue;
    const ind = (await import("@shared/macro")).INDICATOR_BY_ID.get(id);
    movers.push({ indicatorId: id, name: ind?.name ?? id, previous: prev.value, latest: cur.value, changePct, asOf: cur.asOf, unit: ind?.unit ?? "" });
  }
  movers.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const since = new Date(Date.now() - 36 * 3600 * 1000);
  const recentRows = await db.select().from(macroStatements).orderBy(desc(macroStatements.id)).limit(200);
  const newStatements = recentRows.filter(r => r.createdAt >= since).map(r => ({ speaker: r.speaker, office: r.office, claim: r.claim, date: r.statementDate, sourceUrl: r.sourceUrl, category: r.category }));
  const recentStatements = recentRows.map(r => ({ id: `db-${r.id}`, date: r.statementDate, speaker: r.speaker, office: r.office, claim: r.claim, outcome: r.outcome, sourceUrl: r.sourceUrl, outcomeSourceUrl: r.outcomeSourceUrl, category: r.category }));
  const health = await db.select().from(macroSourceHealth).where(gte(macroSourceHealth.failStreak, 3));
  const darkSources = health.map(h => ({ sourceId: h.sourceId, failStreak: h.failStreak, lastSuccessAt: h.lastSuccessAt ? new Date(h.lastSuccessAt).toISOString() : null, lastDetail: h.lastDetail }));
  const scores = await loadFactorScores(db);
  const meta = new Map((await loadSeriesMeta(db)).map(m => [m.indicatorId, m]));
  const factors: BriefExtras["factors"] = [];
  for (const f of MACRO_FACTORS) {
    const s = scores.find(x => x.indicatorId === f.id);
    const baseId = f.factor!.transform === "level" ? f.id : `${f.id}:base`;
    const m = meta.get(baseId);
    let latestValue: number | null = null;
    let latestAsOf: string | null = null;
    let signal: number | null = null;
    if (m && m.points > 0) {
      const pts = await factorSeries(db, f);
      const last = pts[pts.length - 1];
      if (last) {
        latestValue = last.value;
        latestAsOf = last.asOf;
        signal = factorSignal(last.value, f.factor!, f.direction);
      }
    }
    factors.push({ id: f.id, verdict: s?.verdict ?? "pending", leadR: s?.leadR ?? null, hitRate: s?.hitRate ?? null, coverageYears: m?.coverageYears ?? 0, earliestAsOf: m?.earliestAsOf ?? null, status: m?.status ?? "unavailable", latestValue, latestAsOf, signal, meanBrier: s?.meanBrier ?? null, liveN: s?.running.n ?? 0 });
  }
  return { asOf, movers, newStatements, darkSources, accuracy: accuracyLine(scores.map(s => s.running)), factors, recentStatements };
}

/** Monthly history per indicator for the pattern detector, from the database when it has depth. */
async function observationSeries(minMonths = 12): Promise<{ series: Series[]; illustrative: boolean }> {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (db) {
      const { macroObservations } = await import("../drizzle/schema");
      const rows = await db.select().from(macroObservations).limit(50_000);
      const by = new Map<string, Series>();
      for (const r of rows) {
        const s = by.get(r.indicatorId) ?? { indicatorId: r.indicatorId, points: [] };
        s.points.push({ asOf: r.asOf, value: Number(r.value) });
        by.set(r.indicatorId, s);
      }
      const deep = Array.from(by.values()).filter(s => new Set(s.points.map(p => p.asOf.slice(0, 7))).size >= minMonths);
      if (deep.length >= 6) return { series: deep, illustrative: false };
    }
  } catch (e) {
    console.warn("[macro] series read failed:", (e as Error).message);
  }
  return { series: illustrativeSeries(ALL_INDICATORS.slice(0, 40), 36), illustrative: true };
}

async function requireOwner(ctx: { user: { email?: string | null; openId?: string | null } | null }) {
  if (!isOwnerSession(ctx.user)) throw new TRPCError({ code: "FORBIDDEN", message: "Owner only." });
}

async function persistRefresh(observations: Observation[], results: Array<{ sourceId: string; ok: boolean; detail: string; observations: Observation[] }>, statements: StatementDraft[] = []) {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return { persisted: 0, statementsAdded: 0, note: "no database; results not stored" };
  const { macroObservations, macroSourceHealth, macroStatements } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");
  let persisted = 0;
  for (const o of observations) {
    await db.insert(macroObservations).values({ indicatorId: o.indicatorId, sourceId: o.sourceId, asOf: o.asOf, value: String(o.value), note: o.note?.slice(0, 500), origin: "live" });
    persisted++;
  }
  // Statements land as "pending" for the 36-hour review; a feed item already
  // in the ledger (same source, same link or same date+claim) is not re-added.
  let statementsAdded = 0;
  for (const s of statements) {
    // No statement without a citation (W8): a draft that lost its URL is dropped, not stored.
    if (!s.sourceUrl) continue;
    const dup = s.sourceUrl
      ? await db.select({ id: macroStatements.id }).from(macroStatements).where(and(eq(macroStatements.sourceId, s.sourceId), eq(macroStatements.sourceUrl, s.sourceUrl.slice(0, 1000)))).limit(1)
      : await db.select({ id: macroStatements.id }).from(macroStatements).where(and(eq(macroStatements.sourceId, s.sourceId), eq(macroStatements.statementDate, s.statementDate), eq(macroStatements.claim, s.claim))).limit(1);
    if (dup.length) continue;
    await db.insert(macroStatements).values({
      statementDate: s.statementDate,
      speaker: s.speaker.slice(0, 200),
      channel: s.channel.slice(0, 200),
      category: s.category.slice(0, 40),
      severity: s.severity,
      environment: s.environment.slice(0, 40),
      claim: s.claim,
      sourceId: s.sourceId.slice(0, 80),
      sourceUrl: s.sourceUrl.slice(0, 1000),
      office: s.office?.slice(0, 200) ?? null,
      speakerQid: s.speakerQid?.slice(0, 20) ?? null,
      outcome: "pending",
    });
    statementsAdded++;
  }
  for (const r of results) {
    const [existing] = await db.select().from(macroSourceHealth).where(eq(macroSourceHealth.sourceId, r.sourceId)).limit(1);
    const now = new Date();
    const streak = r.ok ? 0 : (existing?.failStreak ?? 0) + 1;
    if (existing) {
      await db.update(macroSourceHealth).set({ lastAttemptAt: now, lastSuccessAt: r.ok ? now : existing.lastSuccessAt, lastOk: r.ok, lastDetail: r.detail.slice(0, 500), failStreak: streak, rowsLastRun: r.observations.length }).where(eq(macroSourceHealth.sourceId, r.sourceId));
    } else {
      await db.insert(macroSourceHealth).values({ sourceId: r.sourceId, lastAttemptAt: now, lastSuccessAt: r.ok ? now : null, lastOk: r.ok, lastDetail: r.detail.slice(0, 500), failStreak: streak, rowsLastRun: r.observations.length });
    }
  }
  return { persisted, statementsAdded, note: `${persisted} observation(s) stored; ${statementsAdded} statement(s) added to the ledger` };
}

async function logForecasts(observations: Observation[], asOf: string) {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  const { macroForecastLog } = await import("../drizzle/schema");
  const jp = assessLiquidation("JP", observations, asOf);
  const cn = assessLiquidation("CN", observations, asOf);
  const tw = assessTaiwan(observations, asOf);
  const entries = [
    { modelId: "liquidation-JP", band: jp.stress.band, payload: jp },
    { modelId: "liquidation-CN", band: cn.stress.band, payload: cn },
    { modelId: "taiwan", band: { probability: tw.blockadeOrWorse24m, low: null, high: null, confidence: tw.confidence, grade: tw.grade }, payload: tw },
  ];
  for (const e of entries) {
    await db.insert(macroForecastLog).values({
      modelId: e.modelId,
      asOf,
      probability: String(e.band.probability),
      low: e.band.low === null ? null : String(e.band.low),
      high: e.band.high === null ? null : String(e.band.high),
      confidence: e.band.confidence,
      grade: e.band.grade,
      payloadJson: JSON.stringify(e.payload).slice(0, 60_000),
    });
  }
}

/** Shared by the tRPC mutation and the cron endpoint. */
export async function runMacroRefresh(opts: { only?: string[] } = {}) {
  const run = await runAllConnectors({ only: opts.only, connectors: ALL_CONNECTORS });
  const tic = run.results.find(r => r.sourceId === "us-tic-mfh");
  let dropped = 0;
  let observations = run.observations;
  if (tic?.ok && !plausibleTic(tic.observations)) {
    observations = observations.filter(o => !tic.observations.includes(o));
    dropped = tic.observations.length;
    tic.ok = false;
    tic.detail = "parsed values implausible vs snapshot; dropped";
  }
  const stored = await persistRefresh(observations, run.results, run.statements);
  // W8: full-history pull, backtest, factor forecasts and scoring. Each step is
  // its own try/catch so a dead history host never blocks the daily forecasts.
  const w8: { history?: unknown; verdicts?: FactorVerdict[]; forecasts?: number; scoring?: { scored: number; pending: number }; errors: string[] } = { errors: [] };
  const wantsHistory = !opts.only || opts.only.some(id => id === "history" || historyManifest().some(m => m.series === id || m.indicatorId === id));
  if (wantsHistory) {
    try {
      const h = await runHistoryRefresh({ only: opts.only?.filter(id => id !== "history") });
      w8.history = { live: h.live, unavailable: h.unavailable, inserted: h.inserted, pulls: h.pulls };
    } catch (e) {
      w8.errors.push(`history: ${(e as Error).message}`);
    }
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) {
        const verdicts = await backtestAllFactors(db, run.today);
        await storeVerdicts(db, verdicts);
        w8.verdicts = verdicts;
        w8.forecasts = (await logFactorForecasts(db, run.today)).filter(f => f.signal !== null).length;
        w8.scoring = await scoreMaturedForecasts(db, run.today);
      }
    } catch (e) {
      w8.errors.push(`backtest/scoring: ${(e as Error).message}`);
    }
  }
  try {
    const { observations: merged } = await currentObservations();
    await logForecasts(merged, run.today);
  } catch (e) {
    console.warn("[macro] forecast log failed:", (e as Error).message);
  }
  const out = {
    today: run.today,
    okCount: run.results.filter(r => r.ok).length,
    failCount: run.results.filter(r => !r.ok).length,
    dropped,
    statements: run.statements.length,
    stored,
    results: run.results.map(r => ({ sourceId: r.sourceId, ok: r.ok, rows: r.observations.length, statements: r.statements.length, detail: r.detail, ms: r.ms })),
    factors: w8.verdicts ? { signal: w8.verdicts.filter(v => v.verdict === "signal").length, context: w8.verdicts.filter(v => v.verdict === "context").length, pending: w8.verdicts.filter(v => v.verdict === "pending").length } : null,
    history: w8.history ?? null,
    forecastsLogged: w8.forecasts ?? 0,
    scoring: w8.scoring ?? null,
    w8Errors: w8.errors,
  };
  // New history or verdicts: the projection's evidence is recounted on the next ask (A22).
  projectionEvidenceCache = null;
  return out;
}

/**
 * What the projection engine may claim: counted from the stored backtests,
 * the archaeology and the pool; nothing measured → `NO_EVIDENCE`, and the
 * projection says so.
 */
/**
 * Production port (A22): the portal-wide PredictiveProvider asks for the
 * projection on every page, and the evidence only changes when the daily cron
 * stores new history, so it is memoised for `PROJECTION_EVIDENCE_TTL_MS`.
 */
const PROJECTION_EVIDENCE_TTL_MS = 10 * 60_000;
let projectionEvidenceCache: { at: number; value: Promise<ProjectionEvidence> } | null = null;
function projectionEvidenceFromStore(): Promise<ProjectionEvidence> {
  const now = Date.now();
  if (projectionEvidenceCache && now - projectionEvidenceCache.at < PROJECTION_EVIDENCE_TTL_MS) return projectionEvidenceCache.value;
  const value = computeProjectionEvidence();
  projectionEvidenceCache = { at: now, value };
  return value;
}

async function computeProjectionEvidence(): Promise<ProjectionEvidence> {
  const ev: ProjectionEvidence = { ...NO_EVIDENCE, pendingFactors: ALL_FACTORS.length };
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return ev;
    const scores = await loadFactorScores(db);
    const signal = scores.filter(s => s.verdict === "signal");
    ev.signalFactors = signal.length;
    ev.contextFactors = scores.filter(s => s.verdict === "context").length;
    ev.pendingFactors = Math.max(0, ALL_FACTORS.length - ev.signalFactors - ev.contextFactors);
    ev.longestSignalHorizonMonths = signal.reduce((m, s) => Math.max(m, FACTOR_BY_ID.get(s.indicatorId)?.factor?.horizonMonths ?? 0), 0);
    const meta = await loadSeriesMeta(db);
    ev.storedCoverageYears = meta.reduce((m, x) => Math.max(m, x.points > 0 ? x.coverageYears : 0), 0);
    const dry = await dryUpFromStore(db, today());
    ev.dryUpRegime = dry.result.coverage > 0 ? dry.result.regime : null;
    if (dry.result.coverage > 0) {
      const arch = await archaeologyFromStore(db, today());
      ev.measuredLeads = arch.patterns?.leads?.length ?? 0;
    }
  } catch {
    /* no db or no history: the projection runs on NO_EVIDENCE */
  }
  return ev;
}

const togglesSchema = z.object({
  treasuryLiquidation: z.object({ holder: z.enum(["JP", "CN", "BOTH"]), fraction: z.number().min(0).max(1), months: z.number().int().min(1).max(60) }).nullable().optional(),
  petrodollarErosion: z.object({ targetNonUsdShare: z.number().min(0).max(100), years: z.number().int().min(1).max(30) }).nullable().optional(),
  sovereignStress: z.object({ countries: z.array(z.string().length(3)).max(20) }).nullable().optional(),
  taiwan: z.object({ scenario: z.enum(["gray-zone", "quarantine", "blockade", "war"]), probability: z.number().min(0).max(1).optional() }).nullable().optional(),
});

export const macroRouter = router({
  /** Layer status: version, source counts, observation provenance. */
  status: publicProcedure.query(async () => {
    const cur = await currentObservations();
    let health: Array<{ sourceId: string; lastOk: boolean | null; lastSuccessAt: string | null; failStreak: number; lastDetail: string | null }> = [];
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) {
        const { macroSourceHealth } = await import("../drizzle/schema");
        const rows = await db.select().from(macroSourceHealth);
        health = rows.map(r => ({ sourceId: r.sourceId, lastOk: r.lastOk, lastSuccessAt: r.lastSuccessAt ? new Date(r.lastSuccessAt).toISOString() : null, failStreak: r.failStreak, lastDetail: r.lastDetail }));
      }
    } catch {
      /* no db */
    }
    const domains = new Set<string>();
    for (const s of MACRO_SOURCES) for (const d of s.domains) domains.add(d);
    const inventory = expansionConnectorInventory();
    return {
      version: MACRO_LAYER_VERSION,
      today: today(),
      sources: MACRO_SOURCES.length,
      paidSources: MACRO_SOURCES.filter(s => s.access === "paid-api").length,
      domains: domains.size,
      connectors: {
        total: ALL_CONNECTORS.length,
        core: CONNECTORS.length,
        expansionNumber: inventory.filter(i => i.kind === "number").length,
        expansionStatement: inventory.filter(i => i.kind === "statement").length,
        ledgerOffices: LEDGER_CONNECTORS.length,
        historySeries: historyManifest().length,
      },
      factors: ALL_FACTORS.length,
      householdSignals: HOUSEHOLD_SIGNALS.length,
      buildOrder: EXPANSION_BUILD_ORDER,
      minimums: SOURCE_MINIMUMS,
      indicators: ALL_INDICATORS.length,
      panels: Object.fromEntries(Object.entries(INDICATOR_PANELS).map(([k, v]) => [k, v.length])),
      observations: { live: cur.live, seed: cur.seed, latestFetch: cur.latestFetch },
      keys: {
        FRED_API_KEY: Boolean(process.env.FRED_API_KEY),
        EIA_API_KEY: Boolean(process.env.EIA_API_KEY),
        // COMTRADEDEVELOPER_API_KEY is the name the owner gave it on Railway.
        COMTRADE_API_KEY: Boolean(process.env.COMTRADE_API_KEY || process.env.COMTRADEDEVELOPER_API_KEY),
        CRON_SECRET: Boolean(process.env.CRON_SECRET),
      },
      health,
    };
  }),

  sources: publicProcedure.query(() => ({ asOf: today(), sources: MACRO_SOURCES })),

  indicators: publicProcedure
    .input(z.object({ panel: z.enum(["JAPAN_LIQUIDATION", "CHINA_LIQUIDATION", "PETRODOLLAR_RIPPLE", "TAIWAN_STRIKE", "GLOBAL_POLICY", "MACRO_FACTORS"]).optional() }).optional())
    .query(async ({ input }) => {
      const cur = await currentObservations();
      const latest = new Map(cur.observations.map(o => [o.indicatorId, o]));
      const list = input?.panel ? INDICATOR_PANELS[input.panel] : ALL_INDICATORS;
      return {
        asOf: today(),
        indicators: list.map(i => ({ ...i, latest: latest.get(i.id) ?? null })),
      };
    }),

  /** The daily headline: Japan and China liquidation confidence with the 24-month amount distribution. */
  liquidationConfidence: publicProcedure.query(async () => {
    const cur = await currentObservations();
    const d = today();
    return {
      asOf: d,
      provenance: { live: cur.live, seed: cur.seed, latestFetch: cur.latestFetch },
      japan: assessLiquidation("JP", cur.observations, d),
      china: assessLiquidation("CN", cur.observations, d),
      snapshot: { holdings: TREASURY_HOLDINGS, market: TREASURY_MARKET, japan: JAPAN_POSITION, china: CHINA_POSITION },
    };
  }),

  /** "If they sold X % over N months" — the scenario engine. */
  liquidationScenario: publicProcedure
    .input(z.object({
      holder: z.enum(["JP", "CN", "BOTH"]),
      fraction: z.number().min(0).max(1),
      months: z.number().int().min(1).max(60),
      runs: z.number().int().min(100).max(10_000).optional(),
      impactBpPer100bn: z.object({ low: z.number(), mode: z.number(), high: z.number() }).optional(),
      fedResponseProbability: z.number().min(0).max(1).optional(),
      fedThresholdBp: z.number().min(0).max(1000).optional(),
      fedDamping: z.number().min(0).max(1).optional(),
      recoveryHalfLifeMonths: z.number().min(1).max(60).optional(),
    }))
    .query(({ input }) => simulateLiquidation(input)),

  liquidationForecast: publicProcedure
    .input(z.object({ holder: z.enum(["JP", "CN"]), stressProbability: z.number().min(0).max(1).optional(), runs: z.number().int().min(100).max(10_000).optional() }))
    .query(async ({ input }) => {
      const cur = await currentObservations();
      const p = input.stressProbability ?? assessLiquidation(input.holder, cur.observations, today()).stress.band.probability;
      return forecastLiquidation({ holder: input.holder, stressProbability: p, runs: input.runs, today: today() });
    }),

  petrodollar: publicProcedure
    .input(z.object({ rollup: z.enum(["monthly", "quarterly", "semiannual", "annual"]).default("quarterly"), forecastYears: z.number().int().min(1).max(30).default(10) }).optional())
    .query(({ input }) => ({
      asOf: OIL_SETTLEMENT.asOf,
      breakdown: settlementBreakdown(),
      corridors: CORRIDORS,
      history: historicalSeries(input?.rollup ?? "quarterly"),
      forecast: forecastPetrodollar({ years: input?.forecastYears ?? 10 }),
      snapshot: OIL_SETTLEMENT,
    })),

  debt: publicProcedure.query(() => ({ overview: debtOverview(), table: DEBT_TABLE, risks: assessAll() })),

  debtCountry: publicProcedure.input(z.object({ iso3: z.string().length(3) })).query(({ input }) => {
    const row = DEBT_TABLE.find(r => r.iso3 === input.iso3.toUpperCase());
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: `No debt row for ${input.iso3}` });
    return assessSovereign(row);
  }),

  contagion: publicProcedure.input(z.object({ countries: z.array(z.string().length(3)).min(1).max(20) })).query(({ input }) => contagion({ countries: input.countries.map(c => c.toUpperCase()) })),

  taiwan: publicProcedure.query(async () => {
    const cur = await currentObservations();
    return assessTaiwan(cur.observations, today());
  }),

  taiwanImpact: publicProcedure
    .input(z.object({ scenario: z.enum(["gray-zone", "quarantine", "blockade", "war"]), country: z.string().max(5).optional(), runs: z.number().int().min(100).max(10_000).optional() }))
    .query(({ input }) => simulateTaiwanImpact(input)),

  statements: publicProcedure.query(async () => {
    let extra: Statement[] = [];
    let citations: Array<{ id: string; dbId: number; office: string | null; speakerQid: string | null; sourceUrl: string | null; outcomeSourceUrl: string | null; resolvedAt: string | null }> = [];
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) {
        const { macroStatements } = await import("../drizzle/schema");
        const rows = await db.select().from(macroStatements).limit(2000);
        extra = rows.map(r => ({
          id: `db-${r.id}`,
          date: r.statementDate,
          speaker: r.speaker,
          channel: r.channel,
          category: r.category as Statement["category"],
          severity: r.severity as Statement["severity"],
          environment: r.environment as Statement["environment"],
          claim: r.claim,
          outcome: r.outcome as Statement["outcome"],
          outcomeNote: r.outcomeNote ?? undefined,
          sourceId: r.sourceId,
        }));
        citations = rows.map(r => ({ id: `db-${r.id}`, dbId: r.id, office: r.office, speakerQid: r.speakerQid, sourceUrl: r.sourceUrl, outcomeSourceUrl: r.outcomeSourceUrl, resolvedAt: r.resolvedAt }));
      }
    } catch {
      /* no db */
    }
    const ledger = [...STATEMENT_LEDGER, ...extra];
    return { asOf: today(), ledger, citations, report: followThroughReport(ledger, today()) };
  }),

  /** W8: the factor panel with verdicts, coverage and running scores. Public. */
  factors: publicProcedure.query(async () => {
    let scores: Awaited<ReturnType<typeof loadFactorScores>> = [];
    let meta: Awaited<ReturnType<typeof loadSeriesMeta>> = [];
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) {
        scores = await loadFactorScores(db);
        meta = await loadSeriesMeta(db);
      }
    } catch {
      /* no db: every factor pending */
    }
    const verdicts: FactorVerdict[] = scores.map(s => ({ indicatorId: s.indicatorId, verdict: s.verdict, leadR: s.leadR, hitRate: s.hitRate, r0: s.r0, n: s.backtestN, horizonMonths: FACTOR_BY_ID.get(s.indicatorId)?.factor?.horizonMonths ?? 0, reason: s.reason, asOf: s.backtestAsOf }));
    const effective = applyFactorVerdicts(ALL_FACTORS, verdicts);
    const metaById = new Map(meta.map(m => [m.indicatorId, m]));
    const householdIds = new Set(HOUSEHOLD_FACTORS.map(f => f.id));
    return {
      asOf: today(),
      counts: { signal: verdicts.filter(v => v.verdict === "signal").length, context: verdicts.filter(v => v.verdict === "context").length, pending: ALL_FACTORS.length - verdicts.filter(v => v.verdict !== "pending").length, macro: MACRO_FACTORS.length, household: HOUSEHOLD_FACTORS.length },
      factors: ALL_FACTORS.map(f => {
        const baseId = f.factor!.transform === "level" ? f.id : `${f.id}:base`;
        return { ...f, panel: householdIds.has(f.id) ? ("household" as const) : ("macro" as const), effectiveWeight: effective.find(e => e.id === f.id)?.weight ?? 0, verdict: verdicts.find(v => v.indicatorId === f.id) ?? null, score: scores.find(s => s.indicatorId === f.id) ?? null, meta: metaById.get(baseId) ?? null };
      }),
      manifest: historyManifest(),
    };
  }),

  /** Household layer: the fifty signals with their latest stored reading, and the twenty-five ideas. Public. */
  household: publicProcedure.query(async () => {
    const cur = await currentObservations();
    const latest = new Map(cur.observations.map(o => [o.indicatorId, o]));
    let meta: Awaited<ReturnType<typeof loadSeriesMeta>> = [];
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) meta = await loadSeriesMeta(db);
    } catch {
      /* no db */
    }
    const metaById = new Map(meta.map(m => [m.indicatorId, m]));
    return {
      asOf: today(),
      signals: HOUSEHOLD_SIGNALS.map(s => {
        const f = s.factorId ? FACTOR_BY_ID.get(s.factorId) : undefined;
        const baseId = f ? (f.factor!.transform === "level" ? f.id : `${f.id}:base`) : null;
        return { ...s, latest: s.factorId ? latest.get(s.factorId) ?? null : null, meta: baseId ? metaById.get(baseId) ?? null : null };
      }),
      ideas: HOUSEHOLD_IDEAS,
      counts: { signals: HOUSEHOLD_SIGNALS.length, keyless: HOUSEHOLD_SIGNALS.filter(s => s.access !== "page").length, backtested: HOUSEHOLD_SIGNALS.filter(s => s.factorId).length, ideas: HOUSEHOLD_IDEAS.length },
    };
  }),

  /** The Treasury pool: the daily watch, the dry-up indicator, the archaeology over stored history, the prediction grid. Public. */
  treasuryPool: publicProcedure.input(z.object({ archaeology: z.boolean().default(true) }).optional()).query(async ({ input }) => {
    const asOf = today();
    let db: Awaited<ReturnType<typeof import("./db").getDb>> = null;
    try {
      db = await (await import("./db")).getDb();
    } catch {
      db = null;
    }
    if (!db) {
      const empty = liquidityDryUp({ foreignHoldings3mPct: null, fedTreasuries3mPct: null, reverseRepoUsdBn: null, termPremium3mPp: null, tenYear3mBp: null, dollar3mPct: null, bidToCoverDeviation: null, deficit3mPct: null }, asOf);
      return {
        asOf,
        series: TREASURY_POOL_SERIES.map(s => ({ ...s, latest: null, change3m: null, meta: null, points: 0 })),
        dryUp: empty,
        archaeology: null,
        grid: predictionGrid([], new Map()),
        hypotheses: TREASURY_STATIC.hypotheses,
        episodes: TREASURY_STATIC.episodes,
        playbook: LIQUIDITY_PLAYBOOK,
        manifest: treasuryStorageManifest().length,
        note: "No database in this process: the pool is shown from its definitions; every reading, verdict and grid cell is pending the first stored history.",
      };
    }
    const [series, dry, arch] = await Promise.all([poolSnapshot(db), dryUpFromStore(db, asOf), input?.archaeology === false ? Promise.resolve(null) : archaeologyFromStore(db, asOf)]);
    return { asOf, series, dryUp: dry.result, dryUpReading: dry.reading, archaeology: arch, grid: arch?.grid ?? predictionGrid([], new Map()), hypotheses: TREASURY_STATIC.hypotheses, episodes: TREASURY_STATIC.episodes, playbook: LIQUIDITY_PLAYBOOK, manifest: treasuryStorageManifest().length, note: null };
  }),

  /** The twenty-five countries: readings, the flow calculus, the episodes. Public. */
  globalTreasuries: publicProcedure.query(async () => {
    const asOf = today();
    let db: Awaited<ReturnType<typeof import("./db").getDb>> = null;
    try {
      db = await (await import("./db")).getDb();
    } catch {
      db = null;
    }
    if (!db) return { asOf, countries: COUNTRIES.map(c => ({ iso3: c.iso3, name: c.name, why: c.why, readings: null, result: null, stored: null })), indicators: FLOW_INDICATORS, episodes: COUNTRY_FLOW_EPISODES, manifest: globalStorageManifest().length, method: ["No database in this process: countries are listed from their definitions; readings and the calculus are pending the first stored history."] };
    const g = await globalFromStore(db, asOf);
    return { ...g, countries: g.countries.map(c => ({ ...c, why: COUNTRIES.find(x => x.iso3 === c.iso3)?.why ?? "" })), manifest: globalStorageManifest().length };
  }),

  /** The total college package for a child, with the loan and the opportunity cost. Public: it is arithmetic on published baselines. */
  collegeCost: publicProcedure
    .input(z.object({
      childAge: z.number().min(0).max(30),
      startAge: z.number().min(14).max(40).optional(),
      years: z.number().int().min(1).max(8).optional(),
      school: z.enum(["public-in-state", "public-out-of-state", "private-nonprofit"]),
      includeRoomBoard: z.boolean().optional(),
      includeBooks: z.boolean().optional(),
      includeOther: z.boolean().optional(),
      borrowShare: z.number().min(0).max(1).optional(),
      tuitionGrowthPct: z.number().min(0).max(15).optional(),
      roomBoardGrowthPct: z.number().min(0).max(15).optional(),
      opportunityRatePct: z.number().min(0).max(20).optional(),
      loanRatePct: z.number().min(0).max(20).optional(),
      parentPlus: z.boolean().optional(),
    }))
    .query(({ input }) => collegeCostProjection(input, today())),

  /** A client's net worth against every American of the same age and against a profession peer. Public: no client data is stored; the inputs are the request. */
  relativeWealth: publicProcedure
    .input(z.object({
      age: z.number().min(18).max(110),
      netWorth: z.number().min(-1e9).max(1e11),
      income: z.number().min(0).max(1e9).optional(),
      profession: z.string().max(120).optional(),
      yearsInProfession: z.number().min(0).max(80).optional(),
      peerMedianIncome: z.number().min(0).max(1e8).optional(),
    }))
    .query(({ input }) => relativeWealth(input, today())),

  patterns: publicProcedure
    .input(z.object({ minAbsR: z.number().min(0.3).max(0.95).default(0.6), maxLag: z.number().int().min(1).max(12).default(6) }).optional())
    .query(async ({ input }) => {
      const { series, illustrative } = await observationSeries();
      return { illustrative, report: detectPatterns(series, { minAbsR: input?.minAbsR, maxLag: input?.maxLag, today: today() }) };
    }),

  /** What the toggles do to a calculator's assumptions. Public: calculators call it on every toggle change. */
  adjustments: publicProcedure
    .input(z.object({ toggles: togglesSchema, full: z.boolean().default(false) }))
    .query(({ input }) => macroAdjustments(input.toggles, { runs: input.full ? 10_000 : 2000 })),

  /**
   * The projection horizon: how far the platform projects the toggled
   * scenario into a calculator with confidence, year by year. Public:
   * every calculator calls it when its toggle is on (and once, neutral, to
   * show how far the measured state reaches).
   */
  projection: publicProcedure
    .input(z.object({ toggles: togglesSchema.default({}), years: z.number().int().min(1).max(60).default(30), full: z.boolean().default(false) }))
    .query(async ({ input }) => {
      const adj = macroAdjustments(input.toggles, { runs: input.full ? 10_000 : 2000 });
      const ev = await projectionEvidenceFromStore();
      return projectionHorizon(adj, ev, input.years, today());
    }),

  /** The projection report for a calculator: the confidence table, the reasoning and the references, as markdown. Public. */
  projectionReport: publicProcedure
    .input(z.object({ toggles: togglesSchema.default({}), years: z.number().int().min(1).max(60).default(30), calculator: z.string().max(120).optional(), baseAssumptions: z.record(z.string(), z.union([z.number(), z.string()])).optional() }))
    .query(async ({ input }) => {
      const adj = macroAdjustments(input.toggles, { runs: 10_000 });
      const ev = await projectionEvidenceFromStore();
      const h = projectionHorizon(adj, ev, input.years, today());
      return { horizon: h, markdown: projectionReport(h, { calculator: input.calculator, baseAssumptions: input.baseAssumptions }) };
    }),

  /** The brief Thomas reads, for display on the page. */
  brief: publicProcedure.query(async () => {
    const cur = await currentObservations();
    return buildMacroBrief(cur.observations, today());
  }),

  /** Owner-only: pull every connector now. */
  refresh: protectedProcedure.input(z.object({ only: z.array(z.string()).optional() }).optional()).mutation(async ({ ctx, input }) => {
    await requireOwner(ctx as any);
    return runMacroRefresh({ only: input?.only });
  }),

  /** Owner-only: attach an outcome to a statement in the database ledger. */
  setStatementOutcome: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      outcome: z.enum(["followed", "partial", "not-followed", "reversed", "pending"]),
      outcomeNote: z.string().max(2000).optional(),
      /** Required for any outcome other than pending (W8: no outcome without a citation). */
      outcomeSourceUrl: z.string().url().max(1000).optional(),
      resolvedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx as any);
      try {
        requireOutcomeCitation(input.outcome, input.outcomeSourceUrl);
      } catch (e) {
        throw new TRPCError({ code: "BAD_REQUEST", message: (e as Error).message });
      }
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No database." });
      const { macroStatements } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(macroStatements).set({
        outcome: input.outcome,
        outcomeNote: input.outcomeNote,
        outcomeSetBy: (ctx as any).user?.email ?? null,
        outcomeSourceUrl: input.outcome === "pending" ? null : input.outcomeSourceUrl,
        resolvedAt: input.outcome === "pending" ? null : input.resolvedAt ?? today(),
      }).where(eq(macroStatements.id, input.id));
      return { ok: true };
    }),

  /** Owner-only: log a statement by hand (what Thomas or Sam read today). A URL is required. */
  addStatement: protectedProcedure
    .input(z.object({
      statementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      speaker: z.string().min(1).max(200),
      office: z.string().max(200).optional(),
      channel: z.string().min(1).max(200),
      category: z.string().min(1).max(40),
      severity: z.enum(["routine", "warning", "threat", "ultimatum"]),
      environment: z.string().min(1).max(40),
      claim: z.string().min(1).max(4000),
      sourceId: z.string().min(1).max(80),
      sourceUrl: z.string().url().max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireOwner(ctx as any);
      try {
        requireStatementCitation(input);
      } catch (e) {
        throw new TRPCError({ code: "BAD_REQUEST", message: (e as Error).message });
      }
      if (!MACRO_SOURCES.some(s => s.id === input.sourceId)) throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown source id ${input.sourceId}` });
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No database." });
      const { macroStatements } = await import("../drizzle/schema");
      await db.insert(macroStatements).values({ ...input, outcome: "pending" });
      return { ok: true };
    }),
});
