// ============================================================
// FORECAST ROUTER — `forecast.current`: the current forecast of the predictive
// engine for a domain, with provenance, for the optional toggle on any
// calculator. Sources are the trunk's own modules; nothing is invented:
//   rates      → FRED benchmark (DGS10 / MORTGAGE30US / FEDFUNDS), live → cached → unavailable
//   inflation  → FRED CPI annual rate
//   equities,
//   housing,
//   wages      → block-bootstrap of a history the caller supplies (the page's own
//                sourced series, e.g. the audited index returns or a ZIP series);
//                without a history the answer is `unavailable` + reason.
// Every answer carries {source, asOf, method}; the page shows them on the badge.
// ============================================================
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getBenchmark, getCpiFromFred, type Benchmark, type FredSeries } from "./_core/fred";
import { blockBootstrapPaths, percentilePath } from "@shared/rentalMarketEngine";
import { flatForecast, unavailableForecast, type CurrentForecast, type ForecastDomain, type ForecastHorizon } from "@shared/forecastOverlay";

const horizonSchema = z.union([z.literal(20), z.literal(30), z.literal(40)]);
const domainSchema = z.enum(["equities", "rates", "inflation", "housing", "wages"]);

const RATE_SERIES: Record<"rates", FredSeries> = { rates: "DGS10" };

export interface ForecastDeps {
  benchmark?: (series: FredSeries) => Promise<Benchmark>;
  cpi?: () => Promise<{ annualRate: number; asOf: string } | null>;
  now?: () => Date;
}

/** Bootstrap a supplied annual-rate history into a p10/p50/p90 forecast. Deterministic (seed 42). */
export function bootstrapForecast(domain: ForecastDomain, history: number[], horizon: ForecastHorizon, source: string, asOf: string): CurrentForecast {
  const clean = history.filter(x => Number.isFinite(x));
  if (clean.length < 10) return unavailableForecast(domain, horizon, `history too short (${clean.length} years; need 10)`);
  const paths = blockBootstrapPaths(clean, horizon, 10_000, 42, 5);
  const p50 = percentilePath(paths, 0.5);
  const p10 = percentilePath(paths, 0.1);
  const p90 = percentilePath(paths, 0.9);
  const points = p50.map((rate, i) => ({ year: i + 1, rate, p10: p10[i], p90: p90[i] }));
  return { domain, horizonYears: horizon, points, source, asOf, method: `10,000-path block bootstrap (5-year blocks, seed 42) of ${clean.length} years` };
}

/** The current forecast for a domain. Never throws; unavailable is an answer. */
export async function currentForecast(
  input: { domain: ForecastDomain; horizon: ForecastHorizon; history?: number[]; historySource?: string; historyAsOf?: string; series?: FredSeries },
  deps: ForecastDeps = {},
): Promise<CurrentForecast> {
  const benchmark = deps.benchmark ?? ((s: FredSeries) => getBenchmark(s));
  const cpi = deps.cpi ?? (() => getCpiFromFred());
  const { domain, horizon } = input;

  if (domain === "rates") {
    const series = input.series ?? RATE_SERIES.rates;
    const b = await benchmark(series);
    if (b.source === "unavailable" || !Number.isFinite(b.value)) return unavailableForecast(domain, horizon, `FRED ${series} unavailable`);
    return flatForecast(domain, b.value / 100, horizon, { source: `FRED ${series} (${b.name})`, asOf: b.asOf, method: `latest observation held flat (${b.source})` });
  }
  if (domain === "inflation") {
    const c = await cpi();
    if (!c || !Number.isFinite(c.annualRate)) return unavailableForecast(domain, horizon, "FRED CPIAUCSL unavailable");
    return flatForecast(domain, c.annualRate, horizon, { source: "FRED CPIAUCSL", asOf: c.asOf, method: "trailing 12-month CPI held flat" });
  }
  if (input.history && input.history.length) {
    return bootstrapForecast(domain, input.history, horizon, input.historySource ?? "caller-supplied series", input.historyAsOf ?? "");
  }
  return unavailableForecast(domain, horizon, `no sourced history supplied for ${domain}; the page must pass its own series`);
}

export const forecastRouter = router({
  current: publicProcedure
    .input(z.object({
      domain: domainSchema,
      horizon: horizonSchema.default(30),
      series: z.enum(["DGS3MO", "DGS2", "DGS5", "DGS10", "DGS30", "MORTGAGE30US", "FEDFUNDS", "CPIAUCSL", "CPILFESL"]).optional(),
      history: z.array(z.number()).max(200).optional(),
      historySource: z.string().max(200).optional(),
      historyAsOf: z.string().max(40).optional(),
    }))
    .query(({ input }) => currentForecast(input)),
});
