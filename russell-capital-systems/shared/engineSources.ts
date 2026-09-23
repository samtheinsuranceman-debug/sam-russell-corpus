/**
 * Engine sources — where each engine's numbers come from, in one shape.
 *
 * WHY THIS EXISTS. Engines across `shared/` already name their sources, but
 * each in its own way: `LONGEVITY_SOURCES` is a list of {label, url, asOf},
 * `SOURCES` in careerEngine is a record of them, `POWER_HISTORY_SOURCES` is
 * plain strings, the macro layer has {id, name, entity, url}. A page could
 * only print a source list if its author knew the engine's shape, which is
 * why 100 of 120 engine-importing pages print none.
 *
 * This module gives the app shell one door: `engineForPath(route)` names the
 * engine behind a catalogue page, `loadEngineSources(engine)` returns its
 * sources as `SourceRef[]`, lazily, so no engine is bundled into the shell.
 * An engine with no registered loader returns `null`, and the footer says so
 * in plain words rather than hiding it — the provenance census counts those,
 * and the list is meant to shrink to nothing.
 *
 * Adding an engine: export a `*_SOURCE` or `*_SOURCES` constant from it and
 * add one loader line below. The census test checks the loader resolves.
 */
import { CALCULATORS } from "./calculatorCatalog";

export type SourceRef = {
  label: string;
  url?: string;
  /** When the figure was read or which edition it is. */
  asOf?: string;
  note?: string;
};

type Loader = () => Promise<unknown>;

/**
 * One loader per engine that exports its sources. The value is whatever the
 * engine exports; `normalizeSources` turns it into `SourceRef[]`.
 */
export const ENGINE_SOURCE_LOADERS: Record<string, Loader> = {
  "shared/accessControl.ts": () => import("./accessControl").then(m => m.ACCESS_CONTROL_SOURCES),
  "shared/advisorModes.ts": () => import("./advisorModes").then(m => m.ADVISOR_MODES_SOURCES),
  "shared/altCredit/simulator.ts": () => import("./altCredit/simulator").then(m => m.ALT_CREDIT_SIMULATOR_SOURCES),
  "shared/balancedIndexedAccount.ts": () => import("./balancedIndexedAccount").then(m => m.BALANCED_INDEXED_ACCOUNT_SOURCES),
  "shared/careerEngine.ts": () => import("./careerEngine").then(m => m.SOURCES),
  "shared/carrierRatings.ts": () => import("./carrierRatings").then(m => m.CARRIER_RATINGS_SOURCES),
  "shared/clientFactFinder.ts": () => import("./clientFactFinder").then(m => m.CLIENT_FACT_FINDER_SOURCES),
  "shared/compositeMind.ts": () => import("./compositeMind").then(m => m.COMPOSITE_MIND_SOURCES),
  "shared/creditCardSourcing.ts": () => import("./creditCardSourcing").then(m => m.CARD_SOURCES),
  "shared/cryptoCycleEngine.ts": () => import("./cryptoCycleEngine").then(m => m.CRYPTO_CYCLE_SOURCES),
  "shared/cycleEngine.ts": () => import("./cycleEngine").then(m => m.CYCLE_ENGINE_SOURCES),
  "shared/erosion.ts": () => import("./erosion").then(m => m.EROSION_SOURCES),
  "shared/firewall.ts": () => import("./firewall").then(m => m.FIREWALL_SOURCES),
  "shared/forgiveness.ts": () => import("./forgiveness").then(m => m.FORGIVENESS_ENGINE_SOURCES),
  "shared/genomeStrategyFit.ts": () => import("./genomeStrategyFit").then(m => m.GENOME_STRATEGY_FIT_SOURCES),
  "shared/historicalShocks.ts": () => import("./historicalShocks").then(m => m.HISTORICAL_SHOCKS_SOURCES),
  "shared/householdGenome.ts": () => import("./householdGenome").then(m => m.HOUSEHOLD_GENOME_SOURCES),
  "shared/householdWealth.ts": () => import("./householdWealth").then(m => m.HOUSEHOLD_WEALTH_SOURCES),
  "shared/incomeForLife.ts": () => import("./incomeForLife").then(m => m.INCOME_SOURCES),
  "shared/indexCreditingData.ts": () => import("./indexCreditingData").then(m => m.INDEX_RETURN_SOURCES),
  "shared/inheritanceEngine.ts": () => import("./inheritanceEngine").then(m => m.INHERITANCE_SOURCES),
  "shared/irmaa.ts": () => import("./irmaa").then(m => m.IRMAA_SOURCES),
  "shared/iulLinks.ts": () => import("./iulLinks").then(m => m.IUL_LINK_SOURCES),
  "shared/liquidityRoutes.ts": () => import("./liquidityRoutes").then(m => m.LIQUIDITY_ROUTES_SOURCES),
  "shared/longevityEngine.ts": () => import("./longevityEngine").then(m => m.LONGEVITY_SOURCES),
  "shared/ltcEngine.ts": () => import("./ltcEngine").then(m => m.LTC_SOURCES),
  "shared/macroEngine.ts": () => import("./macroEngine").then(m => m.MACRO_SOURCES),
  "shared/mechanismDossiers.ts": () => import("./mechanismDossiers").then(m => m.MECHANISM_DOSSIERS_SOURCES),
  "shared/monteCarloEngine.ts": () => import("./monteCarloEngine").then(m => m.MONTE_CARLO_SOURCES),
  "shared/mortgageKiller.ts": () => import("./mortgageKiller").then(m => m.MORTGAGE_KILLER_SOURCES),
  "shared/mortgageLedger.ts": () => import("./mortgageLedger").then(m => m.MORTGAGE_LEDGER_SOURCES),
  "shared/multiPropertyMyga.ts": () => import("./multiPropertyMyga").then(m => m.MULTI_PROPERTY_MYGA_SOURCES),
  "shared/mygaWaterfall.ts": () => import("./mygaWaterfall").then(m => m.MYGA_WATERFALL_SOURCES),
  "shared/nlpBrain.ts": () => import("./nlpBrain").then(m => m.NLP_BRAIN_SOURCES),
  "shared/pageRatings.ts": () => import("./pageRatings").then(m => m.PAGE_RATINGS_SOURCES),
  "shared/policyMechanics.ts": () => import("./policyMechanics").then(m => m.POLICY_MECHANICS_SOURCES),
  "shared/policyLoanMechanics.ts": () => import("./policyLoanMechanics").then(m => m.POLICY_LOAN_SOURCES),
  "shared/powerHistory.ts": () => import("./powerHistory").then(m => m.POWER_HISTORY_SOURCES),
  "shared/premiumFinancing.ts": () => import("./premiumFinancing").then(m => m.PREMIUM_FINANCING_SOURCES),
  "shared/provenance.ts": () => import("./provenance").then(m => m.PROVENANCE_SOURCES),
  "shared/qbiDeduction.ts": () => import("./qbiDeduction").then(m => m.QBI_SOURCE),
  "shared/realEstateCapacityEngine.ts": () => import("./realEstateCapacityEngine").then(m => m.RECIN_SOURCES),
  "shared/regulatorySandbox.ts": () => import("./regulatorySandbox").then(m => m.REGULATORY_SANDBOX_SOURCES),
  "shared/rentalEnterprise.ts": () => import("./rentalEnterprise").then(m => m.PARTICIPATION_SOURCES),
  "shared/retirementDNA.ts": () => import("./retirementDNA").then(m => m.RETIREMENT_DNA_SOURCES),
  "shared/retirementLimits.ts": () => import("./retirementLimits").then(m => m.LIMITS_SOURCE),
  "shared/reverseHeloc.ts": () => import("./reverseHeloc").then(m => m.REVERSE_HELOC_SOURCES),
  "shared/sequencePlanner.ts": () => import("./sequencePlanner").then(m => m.SEQUENCE_PLANNER_SOURCES),
  "shared/strEngine.ts": () => import("./strEngine").then(m => m.STR_INPUT_SOURCES),
  "shared/strSources.ts": () => import("./strSources").then(m => m.STR_SOURCES),
  "shared/taxBracketEngine.ts": () => import("./taxBracketEngine").then(m => m.TAX_BRACKET_SOURCES),
  "shared/taxHistory.ts": () => import("./taxHistory").then(m => m.TAX_HISTORY_SOURCES),
  "shared/taxSchedule.ts": () => import("./taxSchedule").then(m => m.TAX_SCHEDULE_SOURCES),
  "shared/thresholds.ts": () => import("./thresholds").then(m => m.THRESHOLDS_SOURCES),
  "shared/ultraEngine.ts": () => import("./ultraEngine").then(m => m.ULTRA_ENGINE_SOURCES),
  "shared/wealthGenomeFactors.ts": () => import("./wealthGenomeFactors").then(m => m.WEALTH_GENOME_FACTORS_SOURCES),
  "shared/zipEngine.ts": () => import("./zipEngine").then(m => m.ZIP_SOURCES),
  // Server engine: its figures come live from FRED; the shell-safe source list lives in shared.
  "server/outsideForces.ts": () => import("./outsideForcesSources").then(m => m.OUTSIDE_FORCES_SOURCES),
  "shared/macro/index.ts": () => import("./macro/sources").then(m => m.CORE_SOURCES),
  "shared/macro/sources.ts": () => import("./macro/sources").then(m => m.CORE_SOURCES),
};

/** The engines whose sources the shell can show. Exported for the census. */
export const ENGINES_WITH_SOURCE_LOADERS: readonly string[] = Object.keys(ENGINE_SOURCE_LOADERS).sort();

/** The engine behind a route, from the catalogue. Query strings and trailing slashes are ignored. */
export function engineForPath(path: string): string | null {
  const clean = path.split("?")[0]!.replace(/\/+$/, "") || "/";
  const entry = CALCULATORS.find(c => c.path === clean);
  return entry?.engine ?? null;
}

/** The catalogue entry behind a route, when there is one. */
export function catalogueEntryForPath(path: string) {
  const clean = path.split("?")[0]!.replace(/\/+$/, "") || "/";
  return CALCULATORS.find(c => c.path === clean) ?? null;
}

function isRef(v: unknown): v is { label?: unknown; name?: unknown; url?: unknown; asOf?: unknown; note?: unknown; entity?: unknown; verifiedOn?: unknown } {
  return typeof v === "object" && v !== null && ("label" in v || "name" in v || "url" in v);
}

/**
 * Turn whatever an engine exports into a flat list of `SourceRef`.
 *
 * Accepts a string, a {label|name, url?, asOf?, note?, entity?} object, an
 * array of either, or a record whose values are either (nested one level).
 * Unknown shapes contribute nothing, never a throw: the footer must render
 * on every page.
 */
export function normalizeSources(value: unknown, depth = 0): SourceRef[] {
  if (value == null || depth > 2) return [];
  if (typeof value === "string") return value.trim() ? [{ label: value.trim() }] : [];
  if (Array.isArray(value)) return value.flatMap(v => normalizeSources(v, depth + 1));
  if (isRef(value)) {
    let label = typeof value.label === "string" ? value.label : typeof value.name === "string" ? value.name : "";
    if (!label) {
      // A descriptor with a url and no label (QBI_SOURCE: thresholds, statute, url):
      // the other string fields are the citation.
      const rest = value as Record<string, unknown>;
      label = Object.entries(rest)
        .filter(([k, v]) => k !== "url" && (typeof v === "string" || typeof v === "number") && String(v).trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");
    }
    if (!label) return [];
    const entity = typeof value.entity === "string" ? ` (${value.entity})` : "";
    const ref: SourceRef = { label: `${label}${entity}` };
    if (typeof value.url === "string" && value.url) ref.url = value.url;
    if (typeof value.asOf === "string" && value.asOf) ref.asOf = value.asOf;
    else if (typeof value.verifiedOn === "string" && value.verifiedOn) ref.asOf = `verified ${value.verifiedOn}`;
    if (typeof value.note === "string" && value.note) ref.note = value.note;
    return [ref];
  }
  if (typeof value === "object") {
    // A record of sources, or an object like INDEX_RETURN_SOURCES {basis, verifiedOn, perIndex}.
    const obj = value as Record<string, unknown>;
    const out: SourceRef[] = [];
    const scalarBits: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string") scalarBits.push(`${k}: ${v}`);
      else if (typeof v === "number") scalarBits.push(`${k}: ${v}`);
      else out.push(...normalizeSources(v, depth + 1));
    }
    if (out.length === 0 && scalarBits.length) out.push({ label: scalarBits.join("; ") });
    return out;
  }
  return [];
}

/** Load and normalise an engine's sources; `null` when no loader is registered. */
export async function loadEngineSources(engine: string): Promise<SourceRef[] | null> {
  const loader = ENGINE_SOURCE_LOADERS[engine];
  if (!loader) return null;
  try {
    return normalizeSources(await loader());
  } catch {
    return [];
  }
}

/** De-duplicate by label, keeping the first url/asOf seen. */
export function uniqueSources(refs: readonly SourceRef[]): SourceRef[] {
  const seen = new Map<string, SourceRef>();
  for (const r of refs) if (!seen.has(r.label)) seen.set(r.label, r);
  return Array.from(seen.values());
}
