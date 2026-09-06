// ============================================================
// THE EROSION ENGINE — tRPC. The forecaster panel and its claims, the
// historical record, the tax trajectory, the inflation ladder, and the two
// projections for the signed-in client (sealed on the ledger as a scenario).
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { recordEvent } from "./ledger";
import { getFactFinderForUser } from "./factFinderDb";
import { HORIZONS, LADDER_YEARS, basketRate, erosionSummary, hurdleRate, purchasingPower, taxTrajectory, type BasketItem } from "@shared/erosion";
import { ESTATE_EXCLUSION, MAX_LTCG_RATE, TAX_HISTORY_SOURCES, TOP_CORPORATE_RATE, TOP_MARGINAL_RATE, changeEvents, windowStats } from "@shared/taxHistory";
import { filingKeyFromLabel } from "@shared/taxRules";
import { CATEGORIES, inflationLadder } from "./inflation";
import { fredMode } from "./_core/fred";
import { ACTUAL_SERIES, SOURCES, addClaim, councilReview, fetchSourceText, harvestAll, harvestSource, listClaims, listHarvests, listSources, recordActual, reviewHarvest, scorePanel, updateSource, weightedClaims } from "./forecastSources";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";

export const erosionRouter = router({
  /** The published record: statutory series, the change events, and the base rates by horizon. */
  history: publicProcedure.query(() => ({
    sources: TAX_HISTORY_SOURCES,
    topMarginal: TOP_MARGINAL_RATE, corporate: TOP_CORPORATE_RATE, ltcg: MAX_LTCG_RATE, estateExclusion: ESTATE_EXCLUSION,
    events: changeEvents(TOP_MARGINAL_RATE, 1946),
    windows: HORIZONS.map((h) => windowStats(TOP_MARGINAL_RATE, h, 1946)),
  })),

  panel: protectedProcedure.query(async () => {
    const [sources, claims] = await Promise.all([listSources(), listClaims()]);
    return { sources, claims, totalPanelWeight: sources.reduce((s, x) => s + x.weight, 0) };
  }),

  updateSource: protectedProcedure.input(z.object({ id: z.string().max(40), enabled: z.boolean().optional(), evidence: z.number().min(0).max(1).nullable().optional(), trackRecord: z.number().min(0).max(1).nullable().optional(), consistency: z.number().min(0).max(1).nullable().optional() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return { ok: await updateSource(input.id, input) };
  }),

  /** Ask every configured AI voice to grade a source's evidence; stores the council's grade. */
  reviewSource: protectedProcedure.input(z.object({ id: z.string().max(40), fetchPage: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const src = SOURCES.find((s) => s.id === input.id);
    if (!src) throw new TRPCError({ code: "NOT_FOUND" });
    let excerpt: string | null = null;
    if (input.fetchPage) { try { excerpt = await fetchSourceText(src); } catch (e) { excerpt = null; console.warn("[erosion] fetch failed", String(e).slice(0, 100)); } }
    const r = await councilReview(src, excerpt);
    if (!r) return { reviewed: false as const, reason: "No AI provider is configured on the host" };
    await updateSource(src.id, { aiEvidence: r.evidence, aiRationale: r.rationale, reviewedAt: new Date() });
    return { reviewed: true as const, evidence: r.evidence, rationale: r.rationale, voices: r.voices, pageRead: Boolean(excerpt) };
  }),

  addClaim: protectedProcedure.input(z.object({ sourceId: z.string().max(40), metric: z.string().min(1).max(80), horizonYear: z.number().int().min(2025).max(2125), value: z.number().nullable(), unit: z.string().max(20).nullable(), baseValue: z.number().nullable(), direction: z.union([z.literal(1), z.literal(0), z.literal(-1)]), burdenMultiplier: z.number().positive().nullable(), asOf: z.string().max(10), citation: z.string().max(500), note: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    if (!SOURCES.some((s) => s.id === input.sourceId)) throw new TRPCError({ code: "NOT_FOUND", message: "unknown source" });
    const id = await addClaim({ ...input, value: input.value == null ? null : String(input.value), baseValue: input.baseValue == null ? null : String(input.baseValue), burdenMultiplier: input.burdenMultiplier == null ? null : String(input.burdenMultiplier), note: input.note ?? null });
    return { id };
  }),

  recordActual: protectedProcedure.input(z.object({ claimId: z.number().int().positive(), actualValue: z.number(), actualAsOf: z.string().max(10) })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const r = await recordActual(input.claimId, input.actualValue, input.actualAsOf);
    if (!r) throw new TRPCError({ code: "NOT_FOUND" });
    return r;
  }),

  /** The expected tax path: history blended with the weighted panel, by five-year horizon. */
  trajectory: protectedProcedure.query(async () => {
    const { claims, totalPanelWeight, allPanelWeight, sources } = await weightedClaims();
    const startYear = new Date().getFullYear();
    return { startYear, points: taxTrajectory({ startYear, claims, totalPanelWeight, allPanelWeight }), panel: sources.filter((s) => s.weight > 0).map((s) => ({ id: s.id, name: s.name, weight: s.weight })), claimsUsed: claims.length };
  }),

  /** Read one source's page with the AI council; verified figures queue for review. Owner only. */
  harvestSource: protectedProcedure.input(z.object({ id: z.string().max(40), url: z.string().url().max(500).optional() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const src = SOURCES.find((s) => s.id === input.id);
    if (!src) throw new TRPCError({ code: "NOT_FOUND" });
    return harvestSource(src, { url: input.url });
  }),
  harvestAll: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return harvestAll();
  }),
  harvests: protectedProcedure.input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional()).query(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return listHarvests(input?.status);
  }),
  reviewHarvest: protectedProcedure.input(z.object({ id: z.number().int().positive(), approve: z.boolean() })).mutation(async ({ ctx, input }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const r = await reviewHarvest(input.id, input.approve);
    if (!r) throw new TRPCError({ code: "NOT_FOUND" });
    return r;
  }),

  /** Record published outcomes against every closed-year claim and regrade consistency. Owner only; keyless. */
  scorePanel: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return { ...(await scorePanel()), outcomeSeries: Object.entries(ACTUAL_SERIES).map(([metric, d]) => ({ metric, series: d.series, label: d.label })) };
  }),

  inflation: protectedProcedure.query(async () => ({ configured: true, mode: fredMode(), ladderYears: LADDER_YEARS, categories: await inflationLadder() })),

  /** Public, no client data: which FRED transport is in use and whether the headline CPI ladder is live. */
  inflationStatus: publicProcedure.query(async () => {
    const all = (await inflationLadder()).find((c) => c.id === "all");
    return { mode: fredMode(), source: all?.source ?? "unavailable", asOf: all?.asOf ?? "", rate20y: all?.rates[20] ?? null };
  }),

  /** Both projections for the signed-in client, in today's dollars, plus the hurdle rate; sealed as a scenario. */
  projection: protectedProcedure.input(z.object({
    income: z.number().nonnegative().optional(), filing: z.enum(["single", "joint", "hoh", "separate"]).optional(),
    incomeGrowth: z.number().min(-0.2).max(0.3).default(0.03), savingsRate: z.number().min(0).max(1).default(0.2), savings: z.number().nonnegative().default(0),
    nominalReturn: z.number().min(-0.5).max(0.5).default(0.07), taxOnGrowth: z.number().min(0).max(0.9).default(0.25),
    inflation: z.number().min(-0.1).max(0.5).optional(), basket: z.array(z.object({ categoryId: z.string().max(40), weight: z.number().min(0).max(100) })).max(20).optional(),
    realTarget: z.number().min(0).max(0.2).default(0.03), years: z.number().int().min(5).max(40).default(40), seal: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const stored = await getFactFinderForUser(ctx.user.id);
    const t = stored?.data?.sections?.taxes ?? {}, inc = stored?.data?.sections?.income ?? {};
    const n = (v: unknown) => (typeof v === "number" ? v : 0);
    const income = input.income ?? (n(t.adjustedGrossIncome) || n(inc.w2Income) + n(inc.bonusIncome) + n(inc.contractorIncome) + n(inc.practiceDistributions) + n(inc.spouseIncome));
    if (!income) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Enter income (or complete the Income and Taxes sections of the assessment) first" });
    const filing = input.filing ?? filingKeyFromLabel(t.filingStatus);
    const [{ claims, totalPanelWeight, allPanelWeight }, ladder] = await Promise.all([weightedClaims(), inflationLadder()]);
    const startYear = new Date().getFullYear();
    const trajectory = taxTrajectory({ startYear, claims, totalPanelWeight, allPanelWeight });
    let inflation = input.inflation ?? null;
    let basket: { rate: number | null; covered: number } | null = null;
    if (inflation == null && input.basket?.length) { basket = basketRate(input.basket as BasketItem[], ladder, 20); inflation = basket.rate; }
    if (inflation == null) { const all = ladder.find((c) => c.id === "all"); inflation = all?.rates[20] ?? all?.rates[10] ?? null; }
    if (inflation == null) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No inflation rate: set FRED_API_KEY for the ladder, or enter a rate" });
    const summary = erosionSummary({ startYear, years: input.years, income, incomeGrowth: input.incomeGrowth, filing, savingsRate: input.savingsRate, savings: input.savings, nominalReturn: input.nominalReturn, taxOnGrowth: input.taxOnGrowth, inflation, trajectory }, input.realTarget);
    const at = (h: number) => ({ baselineRealWealth: summary.baseline.at[h]?.realWealth ?? null, alternateRealWealth: summary.alternate.at[h]?.realWealth ?? null, gap: summary.realWealthGap[h] ?? null, pHigher: trajectory.find((p) => p.horizonYears === h)?.pHigher ?? null, confidence: trajectory.find((p) => p.horizonYears === h)?.confidence ?? null });
    if (input.seal) {
      const fmt = (v: number) => Math.abs(v).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
      const g30 = summary.realWealthGap[30] ?? 0;
      await recordEvent({ kind: "scenario", source: "client", key: "erosion.projection", label: "Purchasing-power projection", value: { inputs: { income, filing, incomeGrowth: input.incomeGrowth, savingsRate: input.savingsRate, savings: input.savings, nominalReturn: input.nominalReturn, taxOnGrowth: input.taxOnGrowth, inflation, realTarget: input.realTarget }, horizons: Object.fromEntries(HORIZONS.map((h) => [h, at(h)])), hurdle: summary.hurdle, cumulativeExtraTax: summary.cumulativeExtraTax },
        summary: `Erosion projection: at 30 years the expected tax path leaves ${g30 <= 0 ? fmt(g30) + " less" : fmt(g30) + " more"} real wealth than current law (P(higher taxes) ${Math.round((at(30).pHigher ?? 0) * 100)}%, confidence ${Math.round((at(30).confidence ?? 0) * 100)}%); inflation ${(inflation * 100).toFixed(1)}%; hurdle ${(summary.hurdle.nominalNeeded * 100).toFixed(1)}% nominal to grow ${(input.realTarget * 100).toFixed(0)}% real after tax`,
        actorName: ctx.user.name ?? null, userId: ctx.user.id });
    }
    return { income, filing, inflation, basket, trajectory, summary, horizons: Object.fromEntries(HORIZONS.map((h) => [h, at(h)])), purchasingPower: Object.fromEntries(LADDER_YEARS.map((y) => [y, purchasingPower(inflation, y)])), hurdleTable: [0.02, 0.03, 0.05, 0.07].map((i) => ({ inflation: i, nominalNeeded: hurdleRate(input.realTarget, i, input.taxOnGrowth) })) };
  }),

  categories: publicProcedure.query(() => CATEGORIES.map((c) => ({ id: c.id, label: c.label, series: c.series, group: c.group }))),
});
