// ============================================================
// Rental-market evidence + the Mortgage Killer with evidence: the router that turns
// stored series into the paths the pure engines consume, and returns an evidence
// ledger beside every result so a figure is never separated from its source.
// ============================================================
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { rentalStatus, rentalSweep, seriesFor, RENTAL_SOURCES } from "./rentalData";
import { reportFor } from "./zipData";
import { fetchFredObservationsSince } from "./_core/fred";
import { runMortgageKillerAnalysis, type MortgageKillerInput } from "@shared/mortgageKiller";
import {
  BEDROOM_CONFIGS, NO_BATHROOM_SOURCE, configurationMatrix, rentByConfiguration, propertyTaxRatePath,
  evictionRisk, monetaryOverlay, appreciationPaths, worstRollingCagr, cagr,
  type AnnualSeries, type Bedrooms, type RentSeriesSet, type EvictionSet,
} from "@shared/rentalMarketEngine";

const Bed = z.enum(["0", "1", "2", "3", "4", "5+"]);

async function rentSetFor(zip: string, county?: string): Promise<RentSeriesSet> {
  const set: RentSeriesSet = { fmr: {}, safmr: {}, acs: {}, sources: {} };
  for (const b of BEDROOM_CONFIGS) {
    const sa = await seriesFor(zip, "safmr", b); if (sa) { set.safmr![b] = sa.data; set.sources.safmr = { url: sa.source, asOf: sa.asOf }; }
    const ac = await seriesFor(zip, "acs_rent", b); if (ac) { set.acs![b] = ac.data; set.sources.acs = { url: ac.source, asOf: ac.asOf }; }
    if (county) { const fm = await seriesFor(county, "fmr", b); if (fm) { set.fmr![b] = fm.data; set.sources.fmr = { url: fm.source, asOf: fm.asOf }; } }
  }
  return set;
}
async function evictionSetFor(county?: string): Promise<EvictionSet | null> {
  if (!county) return null;
  const f = await seriesFor(county, "evict_filings"), j = await seriesFor(county, "evict_judgments"), fr = await seriesFor(county, "evict_filing_rate"), er = await seriesFor(county, "evict_rate"), rh = await seriesFor(county, "renter_hh");
  if (!f && !fr) return null;
  const any = (f ?? fr)!;
  return { filings: f?.data, judgments: j?.data, filingRate: fr?.data, evictionRate: er?.data, renterHouseholds: rh?.data, lowFlag: Boolean((any.meta as { lowFlag?: boolean } | null)?.lowFlag), source: { url: any.source, asOf: any.asOf } };
}

export const rentalRouter = router({
  /** What is loaded, per series, with the earliest year and the latest as-of — so a client can see the record's own window before trusting a figure. */
  status: publicProcedure.query(async () => ({ ...(await rentalStatus()), sources: RENTAL_SOURCES, notModelled: { bathrooms: NO_BATHROOM_SOURCE, securityDeposits: "No public time series exists; deposits are governed by state statute (caps, interest, return deadlines) — a rules table, not a history." } })),

  /** Rents for every bedroom count × the requested bathroom counts. Bathrooms are echoed and answered with null, by design. */
  configurations: protectedProcedure.input(z.object({ zip: z.string().regex(/^\d{5}$/), county: z.string().regex(/^\d{5}$/).optional(), year: z.number().int().min(1983).max(2100).optional(), bathrooms: z.array(z.number().int().min(1).max(6)).default([1, 2, 3, 4, 5]) }))
    .query(async ({ input }) => {
      const set = await rentSetFor(input.zip, input.county); const year = input.year ?? new Date().getFullYear() - 1;
      return { year, rows: configurationMatrix(set, year, input.bathrooms), history: Object.fromEntries(BEDROOM_CONFIGS.map((b) => { const s = set.safmr?.[b] ?? set.acs?.[b] ?? set.fmr?.[b] ?? null; return [b, s ? { series: s, cagr: cagr(s), worstDecade: worstRollingCagr(s, 10) } : null]; })) };
    }),

  /** One configuration, one year. */
  rent: protectedProcedure.input(z.object({ zip: z.string().regex(/^\d{5}$/), county: z.string().regex(/^\d{5}$/).optional(), bedrooms: Bed, bathrooms: z.number().int().min(1).max(6).nullable().default(null), year: z.number().int().optional() }))
    .query(async ({ input }) => rentByConfiguration(await rentSetFor(input.zip, input.county), input.bedrooms as Bedrooms, input.bathrooms, input.year ?? new Date().getFullYear() - 1)),

  /** Eviction exposure for the county: share of renter households sued and removed, with the record's window and undercount flag. */
  evictions: protectedProcedure.input(z.object({ county: z.string().regex(/^\d{5}$/) })).query(async ({ input }) => evictionRisk(await evictionSetFor(input.county))),

  /** Owner-only: read the public files now. */
  refresh: protectedProcedure.mutation(async ({ ctx }) => { if (ctx.user.role !== "admin") throw new Error("owner only"); return rentalSweep(); }),
});

/** The toggles a client sees on the Mortgage Killer page. Each one is off by default; off means the engine's own flat constants, exactly as before. */
export const EvidenceToggles = z.object({
  useZipAppreciation: z.boolean().default(false),   // appreciationPath from zip_series (FHFA/Zillow), median of 10,000 block-bootstrap paths
  realDollars: z.boolean().default(false),          // deflate by CPI rent-of-primary-residence (monetary-inflation lens)
  propertyTax: z.boolean().default(false),          // ACS effective tax rate carried forward with its drift
  helocFromPrime: z.boolean().default(false),       // HELOC rate path = prime-rate benchmark + margin (default 1.0%)
  helocMargin: z.number().min(0).max(0.1).default(0.01),
  pessimistic: z.boolean().default(false),          // use the 10th-percentile appreciation path instead of the median
});

export const mortgageEvidenceRouter = router({
  /** Run the Mortgage Killer with evidence paths built from the stored record, returning the result AND the ledger that says where each path came from. */
  withEvidence: protectedProcedure.input(z.object({ input: z.custom<MortgageKillerInput>((v) => typeof v === "object" && v !== null && typeof (v as MortgageKillerInput).mortgageBalance === "number" && typeof (v as MortgageKillerInput).homeMarketValue === "number"), zip: z.string().regex(/^\d{5}$/), county: z.string().regex(/^\d{5}$/).optional(), toggles: EvidenceToggles }))
    .mutation(async ({ input: { input, zip, county, toggles } }) => {
      const ledger: Array<{ path: string; source: string; asOf: string; window: unknown; method: string; applied: boolean; reason?: string }> = [];
      const mk: MortgageKillerInput = { ...input };
      if (toggles.useZipAppreciation) {
        const rep = await reportFor(zip, { startYear: 1975, threshold: 0, yearsAhead: 30 }).catch(() => null);
        const levels: AnnualSeries | null = rep?.report.levels ?? null;
        const ap = appreciationPaths(levels, 30);
        const path = toggles.pessimistic ? ap.p10 : ap.median;
        if (path) { mk.appreciationMode = toggles.realDollars ? "zip-history-real" : "zip-history"; mk.appreciationPath = path; }
        ledger.push({ path: "appreciationPath", ...ap.evidence, applied: !!path, reason: ap.reason });
        if (toggles.realDollars) {
          const cpi = await seriesFor("US", "cpi_rent"); const m2 = await seriesFor("US", "m2");
          const ov = monetaryOverlay(cpi?.data ?? null, m2?.data ?? null, 30);
          if (ov.cpiPath.value) mk.inflationPath = ov.cpiPath.value;
          ledger.push({ path: "inflationPath (CPI rent)", ...ov.cpiPath.evidence, applied: !!ov.cpiPath.value, reason: ov.cpiPath.reason });
          ledger.push({ path: "m2Path (money supply, shown beside CPI, not blended)", ...ov.m2Path.evidence, applied: false, reason: ov.m2Path.reason ?? "informational" });
        }
      }
      if (toggles.propertyTax) {
        const tax = await seriesFor(zip, "acs_tax"), val = await seriesFor(zip, "acs_value");
        const pt = propertyTaxRatePath(tax?.data ?? null, val?.data ?? null, 30);
        if (pt.value) mk.propertyTaxRatePath = pt.value;
        ledger.push({ path: "propertyTaxRatePath", ...pt.evidence, applied: !!pt.value, reason: pt.reason });
      }
      if (toggles.helocFromPrime) {
        const obs = await fetchFredObservationsSince("DPRIME", "1955-08-04").catch(() => []);
        const last = obs.length ? obs[obs.length - 1] : null;
        if (last) { mk.helocRatePath = Array.from({ length: 30 }, () => last.value / 100 + toggles.helocMargin); }
        ledger.push({ path: "helocRatePath", source: "FRED DPRIME — bank prime loan rate, 1955→", asOf: last?.date ?? "", window: null, method: `prime ${last ? last.value : "n/a"}% + ${(toggles.helocMargin * 100).toFixed(2)}% margin, held flat`, applied: !!last, reason: last ? undefined : "prime rate not reachable" });
      }
      const result = runMortgageKillerAnalysis(mk);
      const ev = await evictionSetFor(county);
      return { result, ledger, toggles, evictionContext: evictionRisk(ev), disclosure: "Projection, not prediction. Every path above names its source and as-of date; a path marked applied:false fell back to the engine's flat assumption and says why." };
    }),
});
