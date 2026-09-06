// ============================================================
// INFLATION LADDER — annualised price change by category over 1–40 years,
// straight from the Bureau of Labor Statistics CPI series on FRED. Nothing
// is typed in by hand: without FRED_API_KEY the ladder reports
// "unavailable" and the page says so. Computed rates are snapshotted in
// market_data_points (series "<id>:<n>Y") so a restart keeps the last-good
// ladder with its as-of date.
// ============================================================
import { fetchFredObservationsSince, fredConfigured, type Observation } from "./_core/fred";
import { getMarketPoints, upsertMarketPoint } from "./messagingDb";
import { LADDER_YEARS, annualised, type CategoryRates } from "@shared/erosion";

export type Category = { id: string; label: string; series: string; group: "all" | "shelter" | "health" | "education" | "food" | "energy" | "other" | "money" };

// BLS CPI-U series on FRED (SA where published; NSA otherwise) plus M2.
export const CATEGORIES: Category[] = [
  { id: "all", label: "All items (CPI-U)", series: "CPIAUCSL", group: "all" },
  { id: "shelter", label: "Shelter", series: "CUSR0000SAH1", group: "shelter" },
  { id: "rent", label: "Rent of primary residence", series: "CUSR0000SEHA", group: "shelter" },
  { id: "medical", label: "Medical care", series: "CPIMEDSL", group: "health" },
  { id: "tuition", label: "College tuition and fees", series: "CUUR0000SEEB01", group: "education" },
  { id: "childcare", label: "Day care and preschool", series: "CUUR0000SEEB03", group: "education" },
  { id: "food_home", label: "Food at home", series: "CUSR0000SAF11", group: "food" },
  { id: "meats", label: "Meats, poultry, fish and eggs", series: "CUSR0000SAF112", group: "food" },
  { id: "gasoline", label: "Gasoline (all types)", series: "CUSR0000SETB01", group: "energy" },
  { id: "energy", label: "Energy", series: "CPIENGSL", group: "energy" },
  { id: "electricity", label: "Electricity", series: "CUSR0000SEHF01", group: "energy" },
  { id: "auto_insurance", label: "Motor vehicle insurance", series: "CUUR0000SETE", group: "other" },
  { id: "tobacco", label: "Tobacco and smoking products", series: "CUUR0000SEGA", group: "other" },
  { id: "m2", label: "Money supply (M2)", series: "M2SL", group: "money" },
];

const memo: Record<string, { at: number; obs: Observation[] }> = {};
const TTL = 12 * 60 * 60 * 1000;

export function _clearInflationMemoForTests() { for (const k of Object.keys(memo)) delete memo[k]; }

function sameMonthYearsAgo(obs: Observation[], latest: Observation, years: number): Observation | null {
  const [y, m] = latest.date.split("-").map(Number);
  const want = `${y! - years}-${String(m).padStart(2, "0")}`;
  return obs.find((o) => o.date.startsWith(want)) ?? null;
}

/** Ladder for one series from its observations: rate over each horizon that the data covers. */
export function ladderFrom(obs: Observation[]): { asOf: string; rates: CategoryRates["rates"] } | null {
  const latest = obs[obs.length - 1];
  if (!latest) return null;
  const rates: CategoryRates["rates"] = {};
  for (const n of LADDER_YEARS) {
    const then = sameMonthYearsAgo(obs, latest, n);
    if (then) rates[n] = annualised(then.value, latest.value, n);
  }
  return { asOf: latest.date, rates };
}

export async function categoryLadder(cat: Category, env: NodeJS.ProcessEnv = process.env): Promise<CategoryRates & { source: "live" | "cached" | "unavailable" }> {
  const now = Date.now();
  const m = memo[cat.series];
  if (m && now - m.at < TTL) { const l = ladderFrom(m.obs); if (l) return { id: cat.id, label: cat.label, ...l, source: "cached" }; }
  if (fredConfigured(env)) {
    try {
      const start = `${new Date().getFullYear() - 41}-01-01`;
      const obs = await fetchFredObservationsSince(cat.series, start, env);
      const l = ladderFrom(obs);
      if (l) {
        memo[cat.series] = { at: now, obs };
        for (const [n, r] of Object.entries(l.rates)) await upsertMarketPoint({ series: `${cat.series}:${n}Y`, value: Number((r * 100).toFixed(4)), asOf: l.asOf, source: "fred" }).catch(() => undefined);
        return { id: cat.id, label: cat.label, ...l, source: "live" };
      }
    } catch (e) { console.warn("[inflation]", cat.series, String(e).slice(0, 120)); }
  }
  // last-good snapshot
  const keys = LADDER_YEARS.map((n) => `${cat.series}:${n}Y`);
  const stored = await getMarketPoints(keys).catch(() => []);
  if (stored.length) {
    const rates: CategoryRates["rates"] = {};
    for (const p of stored) { const n = Number(p.series.split(":")[1]?.replace("Y", "")) as (typeof LADDER_YEARS)[number]; rates[n] = p.value / 100; }
    return { id: cat.id, label: cat.label, asOf: stored[0]!.asOf, rates, source: "cached" };
  }
  return { id: cat.id, label: cat.label, asOf: "", rates: {}, source: "unavailable" };
}

export async function inflationLadder(env: NodeJS.ProcessEnv = process.env): Promise<Array<CategoryRates & { source: "live" | "cached" | "unavailable"; group: Category["group"]; series: string }>> {
  const out = await Promise.all(CATEGORIES.map(async (c) => ({ ...(await categoryLadder(c, env)), group: c.group, series: c.series })));
  return out;
}
