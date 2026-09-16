// ============================================================
// THE ZIP ENGINE — tRPC. What the record says about the client's own zip
// codes for the window they chose, the cohort of zips like theirs, and the
// true cost of the loan year by year. Sources and as-of dates ride along
// with every answer.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getFactFinderForUser } from "./factFinderDb";
import { COHORT_THRESHOLDS, DEFAULT_THRESHOLD, ZIP_SOURCES, annualAppreciation, backcastLevels, firstYear, interestSheet, lastYear, windowRate } from "@shared/zipEngine";
import { cohortFor, pmms, reportFor, seriesFor, yearRange, zipStatus, zipSweep } from "./zipData";
import { STR_PROTOCOL, STR_SOURCES, configuredStrApis } from "@shared/strSources";
import { readStrPage, suggestStr } from "./strSources";

const isOwner = (ctx: { user: { openId: string; role: string } }) => ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
const zipList = z.array(z.string().regex(/^\d{5}$/)).min(1).max(12);

/** The client's own zips from the Fact Finder: the primary home and every additional property that carries one. */
export function zipsFromFactFinder(ff: { sections: Record<string, Record<string, unknown>>; lists: Record<string, Array<Record<string, unknown>>> } | null | undefined): Array<{ zip: string; label: string }> {
  if (!ff) return [];
  const out: Array<{ zip: string; label: string }> = [];
  const five = (v: unknown) => { const s = String(v ?? "").trim(); return /^\d{5}$/.test(s) ? s : null; };
  const home = five(ff.sections?.realEstate?.primaryHomeZip);
  if (home) out.push({ zip: home, label: "Primary home" });
  (ff.lists?.properties ?? []).forEach((p, i) => { const zp = five(p.zip); if (zp) out.push({ zip: zp, label: `${String(p.type ?? "Property")} ${i + 1}` }); });
  return out;
}

export const zipRouter = router({
  /** Which files have been read, how many zips each covers, and their as-of dates. Public: no client data. */
  status: publicProcedure.query(async () => ({ ...(await zipStatus()), range: await yearRange(), thresholds: COHORT_THRESHOLDS, defaultThreshold: DEFAULT_THRESHOLD, sources: ZIP_SOURCES })),

  /** The signed-in client's zips from their Fact Finder, so the page opens on their own record. */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const ff = await getFactFinderForUser(ctx.user.id).catch(() => null);
    return { zips: zipsFromFactFinder(ff?.data as Parameters<typeof zipsFromFactFinder>[0]) };
  }),

  /** One report per zip for the chosen window and threshold, the cohort beside them, and the loan sheet at each year's rate. */
  report: protectedProcedure.input(z.object({ zips: zipList, startYear: z.number().int().min(1975).max(2100), threshold: z.number().min(0).max(50_000_000).default(DEFAULT_THRESHOLD), yearsAhead: z.number().int().min(1).max(40).default(10), downPct: z.number().min(0).max(100).default(20) })).query(async ({ input }) => {
    const rate = await pmms();
    const answers = await Promise.all(input.zips.map(async (zip) => {
      const a = await reportFor(zip, { startYear: input.startYear, threshold: input.threshold, yearsAhead: input.yearsAhead });
      const sheet = a.report.levels && rate ? interestSheet(a.report.levels, rate.data, { fromYear: input.startYear, downPct: input.downPct, backcastThrough: a.report.backcastThrough }) : [];
      return { ...a, sheet };
    }));
    const cohort = await cohortFor(input.threshold, input.startYear);
    return { answers, cohort, pmms: rate ? { asOf: rate.asOf, url: ZIP_SOURCES.find((s) => s.id === "pmms")!.url } : null, window: { from: input.startYear }, method: { backcast: "Dollar levels before Zillow's first year are the FHFA index scaled to Zillow's first-year value: level(y) = level(anchor) × HPI(y) ÷ HPI(anchor).", annual: "A year's home value or rent is the last month Zillow published in that year; a year's mortgage rate is the average of Freddie Mac's weekly readings." } };
  }),

  /**
   * The year-by-year record for one ZIP over any window the client picks:
   * home-value appreciation each year (FHFA index back-cast behind Zillow's
   * levels, from the 1970s–1990s depending on the ZIP) and rent growth each
   * year (Zillow ZORI, 2015 onward — the record does not reach 36 years and
   * says so). Compound window rates feed the calculator chain.
   */
  history: publicProcedure.input(z.object({ zip: z.string().regex(/^\d{5}$/), fromYear: z.number().int().min(1970).max(2100), toYear: z.number().int().min(1970).max(2100).optional() })).query(async ({ input }) => {
    const [z, h, r] = await Promise.all([seriesFor(input.zip, "zhvi"), seriesFor(input.zip, "hpi"), seriesFor(input.zip, "zori")]);
    const bc = backcastLevels(z?.data ?? null, h?.data ?? null);
    const levels = bc?.levels ?? h?.data ?? null;
    const rent = r?.data ?? null;
    const to = input.toYear ?? (levels ? lastYear(levels) ?? input.fromYear : input.fromYear);
    const inWindow = (rows: Array<{ year: number; pct: number }>) => rows.filter((a) => a.year > input.fromYear && a.year <= to);
    const appreciation = levels ? inWindow(annualAppreciation(levels)) : [];
    const rentGrowth = rent ? inWindow(annualAppreciation(rent)) : [];
    const rentFrom = rent ? Math.max(input.fromYear, firstYear(rent) ?? input.fromYear) : null;
    // A window that starts before the record begins measures from the first recorded year (and says so via coverage).
    const levelsFrom = levels ? Math.max(input.fromYear, firstYear(levels) ?? input.fromYear) : input.fromYear;
    const wa = windowRate(levels, levelsFrom, to);
    const wr = rent && rentFrom != null ? windowRate(rent, rentFrom, to) : null;
    return {
      zip: input.zip,
      window: { from: input.fromYear, to },
      appreciation: appreciation.map((a) => ({ year: a.year, pct: Math.round(a.pct * 10000) / 100 })),
      rentGrowth: rentGrowth.map((a) => ({ year: a.year, pct: Math.round(a.pct * 10000) / 100 })),
      windowAppreciationPct: wa ? Math.round(wa.rate * 10000) / 100 : null,
      windowRentGrowthPct: wr ? Math.round(wr.rate * 10000) / 100 : null,
      coverage: {
        levelsFrom: levels ? firstYear(levels) : null, levelsTo: levels ? lastYear(levels) : null, backcastThrough: bc?.backcastThrough ?? null,
        rentFrom: rent ? firstYear(rent) : null, rentTo: rent ? lastYear(rent) : null,
        yearsOfAppreciation: appreciation.length, yearsOfRent: rentGrowth.length,
      },
      sources: { zhvi: z ? { asOf: z.asOf, url: z.source } : null, hpi: h ? { asOf: h.asOf, url: h.source } : null, zori: r ? { asOf: r.asOf, url: r.source } : null },
      note: rent ? `Rent record covers ${firstYear(rent)}–${lastYear(rent)}; years before that are blank, not estimated.` : "No rent record for this ZIP.",
    };
  }),

  /** Owner: read every source now. */
  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isOwner(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
    return zipSweep();
  }),

  // ─── Short-term rental sources: the registry, the suggestion, the read ───
  /** The registry the AI works from, and which of its APIs have a key on this host (names only). Public: no client data. */
  strSources: publicProcedure.query(() => ({ sources: STR_SOURCES, apisConfigured: configuredStrApis(process.env), protocol: STR_PROTOCOL })),

  /** Places from the client's own words (Fact Finder goals, relocation plans, and anything just said), the cash-limited price, and every registry site's link for each place. */
  strSuggest: protectedProcedure.input(z.object({ notes: z.string().max(4_000).default(""), downPct: z.number().min(0).max(100).default(20), closingPct: z.number().min(0).max(15).default(3) })).query(async ({ ctx, input }) => {
    const ff = await getFactFinderForUser(ctx.user.id).catch(() => null);
    const data = ff?.data as Parameters<typeof zipsFromFactFinder>[0];
    return suggestStr(data, { notes: input.notes, zips: zipsFromFactFinder(data), downPct: input.downPct, closingPct: input.closingPct });
  }),

  /** The AI opens one registry site's page for the place and reports only quote-verified figures, dated. Nothing is stored. */
  strReadPage: protectedProcedure.input(z.object({ sourceId: z.string().max(40), place: z.string().max(120).optional(), zip: z.string().regex(/^\d{5}$/).optional(), address: z.string().max(200).optional() })).mutation(async ({ input }) => readStrPage(input)),
});
