// ============================================================
// THE CAREER LEDGER — tRPC. What the record says about a specialty (training
// length with its accreditor, the federal loan rates, BLS wages nationally
// and by state, NCES tuition), the arithmetic of becoming one, the peer
// comparison from what specialists entered, the vision answers, and the
// exit rating. Public, because the specialist pages are landing pages.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { exitRatings, peerSubmissions } from "../drizzle/schema";
import { CAREER_PATHS, EXIT_QUESTION, FEDERAL_LOAN_RATES, LOAN_FEES, LOAN_RATE_SOURCES, PEER_FIELDS, SOURCES, VISION_QUESTIONS, careerPath, peerCompare, percentileOf, trainingYears, trueHourly } from "@shared/careerEngine";
import { US_STATES, careerStatus, careerSweep, latestByArea, seriesFor, statsFor, topEarners } from "./careerData";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
const slug = z.string().regex(/^[a-z0-9-]{2,48}$/);
const state = z.string().regex(/^[A-Z]{2}$/).optional();
const values = z.record(z.string().max(40), z.number().finite()).refine((v) => Object.keys(v).length <= 40);

/** The BLS row the comparison uses: the state's latest year when it has one, else the nation's. */
async function incomeDistribution(occCode: string, st?: string) {
  const rows = st ? await latestByArea(occCode) : [];
  const mine = rows.find((r) => r.area === st);
  if (mine && mine.p50 != null) return mine;
  const us = await statsFor([occCode], "US");
  return us[us.length - 1] ?? null;
}

export const careerRouter = router({
  /** Which files have been read and how far they reach. Public: no client data. */
  status: publicProcedure.query(async () => ({ ...(await careerStatus()), paths: CAREER_PATHS.length, states: Object.keys(US_STATES).length })),

  /** The registry, for the index page. */
  paths: publicProcedure.query(() => CAREER_PATHS.map((p) => ({ slug: p.slug, title: p.title, plural: p.plural, family: p.family, years: trainingYears(p) }))),

  /** Everything the specialty page shows: the path with its citations, the loan rates, the BLS record nationally and in the chosen state with history, the state table, NCES tuition, the top earners beside them. */
  specialty: publicProcedure.input(z.object({ slug, state })).query(async ({ input }) => {
    const p = careerPath(input.slug);
    if (!p) throw new TRPCError({ code: "NOT_FOUND" });
    const codes = [p.soc.code, ...(p.soc.legacy ? [p.soc.legacy.code] : [])];
    const [us, st, byState, natSeries, stSeries, top] = await Promise.all([
      statsFor(codes, "US"), input.state ? statsFor(codes, input.state) : Promise.resolve([]), latestByArea(p.soc.code), seriesFor("US"), input.state ? seriesFor(input.state) : Promise.resolve([]), topEarners(input.state ?? "US"),
    ]);
    return {
      path: p, trainingYears: trainingYears(p), loanRates: FEDERAL_LOAN_RATES, loanFees: LOAN_FEES, loanRateSources: LOAN_RATE_SOURCES,
      bls: { us, state: st, byState: byState.sort((a, b) => (b.annualMean ?? 0) - (a.annualMean ?? 0)), source: SOURCES.blsOews },
      nces: { national: natSeries, state: stSeries, sources: [SOURCES.nces33010, SOURCES.nces33020] },
      topEarners: top,
      states: US_STATES,
      more: [SOURCES.aamcTuition, SOURCES.aamcStipends, SOURCES.codaTuition, SOURCES.aba509, SOURCES.amaLiability, SOURCES.amaClaims, SOURCES.npdb],
      peerFields: PEER_FIELDS, visionQuestions: VISION_QUESTIONS,
    };
  }),

  /** Where the person stands: income against the BLS distribution for their specialty and state, every entered field against peers who entered it (five or more), and the hour's true worth. Nothing is stored here. */
  compare: publicProcedure.input(z.object({ slug, state, values })).query(async ({ input }) => {
    const p = careerPath(input.slug);
    if (!p) throw new TRPCError({ code: "NOT_FOUND" });
    const v = input.values;
    const dist = await incomeDistribution(p.soc.code, input.state);
    const incomePercentile = dist && v.grossIncome != null ? percentileOf(v.grossIncome, dist) : null;
    const db = await getDb();
    let peers: Array<{ state: string | null; fields: Record<string, number>; computed: Record<string, number | null> | null }> = [];
    if (db) {
      const rows = await db.select().from(peerSubmissions).where(eq(peerSubmissions.specialty, p.slug));
      peers = rows.map((r) => ({ state: r.state, fields: (typeof r.fields === "string" ? JSON.parse(r.fields) : r.fields) as Record<string, number>, computed: (typeof r.computed === "string" ? JSON.parse(r.computed) : r.computed) as Record<string, number | null> | null }));
    }
    const inState = input.state ? peers.filter((x) => x.state === input.state) : [];
    const pool = inState.length >= 5 ? inState : peers;
    const poolLabel = inState.length >= 5 ? `${p.plural} in ${input.state}` : `${p.plural} nationally`;
    const hourly = v.grossIncome != null ? trueHourly({ grossIncome: v.grossIncome, incomeTaxes: v.incomeTaxes ?? 0, loanPayments: v.loanPayments ?? 0, practiceExpenses: v.practiceExpenses ?? 0, vehicleCosts: v.vehicleCosts ?? 0, commuteHoursPerWeek: v.commuteHoursPerWeek ?? 0, hoursPerWeek: v.hoursPerWeek ?? 50, weeksPerYear: v.weeksPerYear ?? 48, travelDaysPerYear: v.travelDaysPerYear ?? 0 }) : null;
    const fields = PEER_FIELDS.filter((f) => v[f.key] != null).map((f) => ({ key: f.key, label: f.label, value: v[f.key]!, ...peerCompare(v[f.key]!, pool.map((x) => x.fields[f.key]).filter((x): x is number => typeof x === "number")) }));
    const hourlyPeers = pool.map((x) => x.computed?.netHourlyAllIn).filter((x): x is number => typeof x === "number");
    return {
      income: dist ? { percentile: incomePercentile, area: dist.area, areaTitle: dist.areaTitle, year: dist.year, occTitle: dist.occTitle, p10: dist.p10, p25: dist.p25, p50: dist.p50, p75: dist.p75, p90: dist.p90, topCoded: dist.topCoded, source: dist.source } : null,
      peers: { pool: poolLabel, n: pool.length, fields, hourly: hourly ? { ...hourly, ...peerCompare(hourly.netHourlyAllIn, hourlyPeers) } : null },
      note: pool.length < 5 ? "Fewer than five peers have entered figures for this specialty yet; the income comparison above is against the BLS record and the rest waits for peers." : `Compared with ${pool.length} ${poolLabel} who entered their own figures on this page.`,
    };
  }),

  /** Keep what a specialist entered, anonymously unless signed in, so the next one has peers. Vision answers ride with it. */
  submit: publicProcedure.input(z.object({ slug, state, values, vision: z.record(z.string().max(40), z.union([z.string().max(2_000), z.number()])).optional() })).mutation(async ({ input, ctx }) => {
    const p = careerPath(input.slug);
    if (!p) throw new TRPCError({ code: "NOT_FOUND" });
    const v = input.values;
    const hourly = v.grossIncome != null ? trueHourly({ grossIncome: v.grossIncome, incomeTaxes: v.incomeTaxes ?? 0, loanPayments: v.loanPayments ?? 0, practiceExpenses: v.practiceExpenses ?? 0, vehicleCosts: v.vehicleCosts ?? 0, commuteHoursPerWeek: v.commuteHoursPerWeek ?? 0, hoursPerWeek: v.hoursPerWeek ?? 50, weeksPerYear: v.weeksPerYear ?? 48, travelDaysPerYear: v.travelDaysPerYear ?? 0 }) : null;
    const db = await getDb();
    if (!db) return { stored: false as const, reason: "No database on this host" };
    const [res] = await db.insert(peerSubmissions).values({ specialty: p.slug, state: input.state ?? null, fields: v, computed: hourly ? { net: hourly.net, netHourly: hourly.netHourly, netHourlyAllIn: hourly.netHourlyAllIn, grossHourly: hourly.grossHourly } : null, vision: input.vision ?? null, userId: ctx.user?.id ?? null });
    return { stored: true as const, id: Number((res as { insertId?: number }).insertId ?? 0) };
  }),

  /** The exit question, answered 1 to 10 as the visitor leaves. */
  exitRating: publicProcedure.input(z.object({ path: z.string().max(200), score: z.number().int().min(1).max(10), before: z.number().int().min(1).max(10).optional(), note: z.string().max(1_000).optional() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return { stored: false as const };
    await db.insert(exitRatings).values({ path: input.path, score: input.score, before: input.before ?? null, note: input.note ?? null, userId: ctx.user?.id ?? null });
    return { stored: true as const };
  }),

  /** Owner: how visitors rated their odds, by page. */
  exitSummary: protectedProcedure.query(async ({ ctx }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { question: EXIT_QUESTION, rows: [] as Array<{ path: string; n: number; mean: number; meanBefore: number | null }> };
    const rows = await db.select().from(exitRatings);
    const byPath = new Map<string, { n: number; sum: number; nb: number; sumB: number }>();
    for (const r of rows) { const b = byPath.get(r.path) ?? { n: 0, sum: 0, nb: 0, sumB: 0 }; b.n += 1; b.sum += r.score; if (r.before != null) { b.nb += 1; b.sumB += r.before; } byPath.set(r.path, b); }
    return { question: EXIT_QUESTION, rows: Array.from(byPath.entries()).map(([path, b]) => ({ path, n: b.n, mean: Math.round((b.sum / b.n) * 10) / 10, meanBefore: b.nb ? Math.round((b.sumB / b.nb) * 10) / 10 : null })).sort((a, b) => b.n - a.n) };
  }),

  /** Owner: read every file now. */
  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return careerSweep();
  }),
});
