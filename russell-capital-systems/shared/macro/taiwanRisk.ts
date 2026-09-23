/**
 * Taiwan Strike-Risk Model — probability by scenario, and what each does to
 * the world.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Four scenarios, priced separately because they are different events with
 * different base rates and different economics:
 *
 *   gray-zone   — intensified coercion short of force (the modal path)
 *   quarantine  — CCG-led inspection regime / partial interdiction
 *   blockade    — PLA naval and air blockade; trade stops
 *   war         — kinetic conflict, U.S. involvement assumed
 *
 * The probabilities come from the confidence engine over the fifty-indicator
 * panel with a prior per scenario. The economics come from published model
 * outputs (Bloomberg Economics Feb 2026; Rhodium; CSIS) — carried as ranges,
 * never as point forecasts, because that is how their authors present them.
 */
import type { ConfidenceAssessment, Evidence, IsoDate } from "./types";
import { assess, signalFrom } from "./confidence";
import { TAIWAN_STRIKE } from "./indicators";
import { SOURCE_BY_ID } from "./sources";
import { mulberry32, triangular, coin, summarise, MACRO_SIMULATION_RUNS, MACRO_DEFAULT_SEED, type Summary } from "./random";
import type { Observation } from "./types";
import { A, citeAssumptions } from "./assumptions";

export type TaiwanScenario = "gray-zone" | "quarantine" | "blockade" | "war";

/** Twelve-month priors (rules table `tw.prior.*`: ODNI ATA 2026 plus the public 10–20 % major-operation range). */
export const TAIWAN_PRIORS: Record<TaiwanScenario, number> = {
  "gray-zone": A("tw.prior.gray-zone"),
  quarantine: A("tw.prior.quarantine"),
  blockade: A("tw.prior.blockade"),
  war: A("tw.prior.war"),
};

/**
 * Published first-year global impact by scenario. Ranges, % of global GDP,
 * with the sources. War figure is Bloomberg Economics' $10.6 tn / 9.6 %;
 * blockade 5.3 %; quarantine is our interpolation from Rhodium's >$2 tn
 * exposure (≈ 1.8 % of a $110 tn world) scaled for partial interdiction.
 */
export const TAIWAN_IMPACT: Record<TaiwanScenario, { low: number; mode: number; high: number; sourceIds: string[]; note: string }> = {
  "gray-zone": { low: 0.0, mode: 0.1, high: 0.3, sourceIds: ["csis-china-power"], note: "Insurance and freight costs; no supply stop." },
  quarantine: { low: 0.5, mode: 1.2, high: 2.5, sourceIds: ["rhodium-taiwan", "csis-china-power"], note: "Partial interdiction; Rhodium >$2 tn activity exposed at the start of a blockade." },
  blockade: { low: 3.0, mode: 5.3, high: 7.0, sourceIds: ["bloomberg-economics-taiwan", "rhodium-taiwan"], note: "Bloomberg Economics Feb 2026: −5.3 % world GDP year one; $1.6 tn chip-dependent revenue at risk." },
  war: { low: 7.0, mode: 9.6, high: 12.0, sourceIds: ["bloomberg-economics-taiwan"], note: "Bloomberg Economics: $10.6 tn, −9.6 % world GDP year one; worse than the pandemic and the 2008 crisis." },
};

/** Country GDP hit as a multiple of the global figure (rules table `tw.mult.*`: Bloomberg Economics country breakdown, Jan 2024). */
export const COUNTRY_MULTIPLIER: Record<string, number> = {
  TWN: A("tw.mult.TWN"),
  CHN: A("tw.mult.CHN"),
  KOR: A("tw.mult.KOR"),
  JPN: A("tw.mult.JPN"),
  USA: A("tw.mult.USA"),
  DEU: A("tw.mult.DEU"),
  GBR: A("tw.mult.GBR"),
  IND: A("tw.mult.IND"),
  MEX: A("tw.mult.MEX"),
  WORLD: 1.0,
};

export type TaiwanAssessment = {
  asOf: IsoDate;
  scenarios: Array<{
    scenario: TaiwanScenario;
    assessment: ConfidenceAssessment;
    twelveMonthProbability: number;
    twentyFourMonthProbability: number;
    firstYearWorldGdpPct: { low: number; mode: number; high: number };
    sourceIds: string[];
    note: string;
  }>;
  /** The single composite Thomas quotes: probability of blockade-or-worse within 24 months. */
  blockadeOrWorse24m: number;
  confidence: number;
  grade: ConfidenceAssessment["band"]["grade"];
  topDrivers: ConfidenceAssessment["drivers"];
  latentDrivers: ConfidenceAssessment["drivers"];
  sourceIds: string[];
};

/**
 * Turn raw observations into normalised evidence for the Taiwan panel. Each
 * indicator's neutral point and span are set here; the refresh job supplies
 * the values.
 */
export function taiwanEvidence(observations: Observation[]): Evidence[] {
  const norm: Record<string, { neutral: number; span: number }> = {
    "tw-pla-aircraft-30d": { neutral: 300, span: 200 },
    "tw-pla-ships-30d": { neutral: 150, span: 100 },
    "tw-median-line-crossings": { neutral: 80, span: 80 },
    "tw-large-exercise": { neutral: 0, span: 1 },
    "tw-exercise-duration-trend": { neutral: 2, span: 3 },
    "tw-kinmen-cga-incursions": { neutral: 4, span: 6 },
    "tw-miyako-transits": { neutral: 2, span: 3 },
    "tw-cable-cuts": { neutral: 1, span: 3 },
    "tw-odni-assessment": { neutral: 0.5, span: 0.5 }, // 1 = "no timeline"; direction risk-down
    "tw-lloyds-listing": { neutral: 0, span: 1 },
    "tw-prediction-market": { neutral: 10, span: 15 },
    "tw-cn-gold-purchases": { neutral: 10, span: 15 },
    "tw-cn-ust-reduction": { neutral: 15, span: 30 },
    "tw-us-cn-mil-mil-channel": { neutral: 0.5, span: 0.5 },
    "tw-strait-transits": { neutral: 240, span: 60 },
    "tw-cn-us-trade-truce": { neutral: 0.5, span: 0.5 },
    "tw-war-risk-premium": { neutral: 0.05, span: 0.3 },
    "tw-twd-reserves": { neutral: 0, span: 15 },
  };
  const byId = new Map(TAIWAN_STRIKE.map(i => [i.id, i]));
  return observations
    .filter(o => byId.has(o.indicatorId))
    .map(o => {
      const n = norm[o.indicatorId] ?? { neutral: 0, span: 1 };
      const src = SOURCE_BY_ID.get(o.sourceId);
      return {
        indicatorId: o.indicatorId,
        signal: signalFrom(o.value, n.neutral, n.span),
        weight: byId.get(o.indicatorId)!.weight,
        tier: src?.tier ?? "secondary",
        asOf: o.asOf,
        corroboration: 1,
        note: o.sourceId,
      } satisfies Evidence;
    });
}

export function assessTaiwan(observations: Observation[], today: IsoDate): TaiwanAssessment {
  const evidence = taiwanEvidence(observations);
  const scenarios = (Object.keys(TAIWAN_PRIORS) as TaiwanScenario[]).map(scenario => {
    // Escalation scenarios respond to the same panel with a smaller scale
    // (rules table `tw.scale.*`): the evidence that moves gray-zone from 45 %
    // to ~70 % moves war from 2 % to ~4 %.
    const scale = A(`tw.scale.${scenario}`);
    const a = assess({ modelId: `taiwan-${scenario}`, prior: TAIWAN_PRIORS[scenario], indicators: TAIWAN_STRIKE, evidence, today, scale });
    const p12 = a.band.probability;
    // Hazard roughly constant: P(24m) = 1 − (1 − p12)².
    const p24 = 1 - Math.pow(1 - p12, 2);
    const impact = TAIWAN_IMPACT[scenario];
    return {
      scenario,
      assessment: a,
      twelveMonthProbability: round4(p12),
      twentyFourMonthProbability: round4(p24),
      firstYearWorldGdpPct: { low: impact.low, mode: impact.mode, high: impact.high },
      sourceIds: impact.sourceIds,
      note: impact.note,
    };
  });
  const blockade = scenarios.find(s => s.scenario === "blockade")!;
  const war = scenarios.find(s => s.scenario === "war")!;
  const composite = 1 - (1 - blockade.twentyFourMonthProbability) * (1 - war.twentyFourMonthProbability);
  const ref = scenarios[0].assessment;
  return {
    asOf: today,
    scenarios,
    blockadeOrWorse24m: round4(composite),
    confidence: ref.band.confidence,
    grade: ref.band.grade,
    topDrivers: ref.drivers.slice(0, 8),
    latentDrivers: ref.drivers.filter(d => d.awareness === "latent").slice(0, 8),
    sourceIds: Array.from(new Set([...ref.sourceIds, ...scenarios.flatMap(s => s.sourceIds)])),
  };
}

export type TaiwanImpactInput = {
  scenario: TaiwanScenario;
  /** Country ISO3 or WORLD. */
  country?: string;
  /** Months the disruption lasts before normalisation begins. Default by scenario. */
  durationMonths?: number;
  runs?: number;
  seed?: number;
};

export type TaiwanImpactResult = {
  scenario: TaiwanScenario;
  country: string;
  firstYearGdpPct: Summary;
  /** Peak-to-trough on a global equity index, %. */
  equityDrawdownPct: Summary;
  /** Change in 10-year Treasury yield, bp (flight to safety, negative, unless the U.S. is the trigger set). */
  tenYearDeltaBp: Summary;
  goldPct: Summary;
  oilPct: Summary;
  /** Chip supply shock index: 0 = none, 1 = all Taiwan output offline. */
  chipSupplyLoss: number;
  recessionProbability: number;
  assumptions: string[];
  sourceIds: string[];
};

export function simulateTaiwanImpact(input: TaiwanImpactInput): TaiwanImpactResult {
  const runs = input.runs ?? MACRO_SIMULATION_RUNS;
  const rng = mulberry32(input.seed ?? MACRO_DEFAULT_SEED + 3);
  const impact = TAIWAN_IMPACT[input.scenario];
  const country = input.country ?? "WORLD";
  const mult = COUNTRY_MULTIPLIER[country] ?? 1.0;
  const chip = A(`tw.chipLoss.${input.scenario}`);
  // Every coefficient below is a row in assumptions.ts (`tw.sim.*`).
  const eqPerPt = A("tw.sim.equityPctPerGdpPt");
  const fear = { low: A("tw.sim.fearPremium.low"), mode: A("tw.sim.fearPremium.mode"), high: A("tw.sim.fearPremium.high") };
  const flightPerPt = A("tw.sim.flightBpPerGdpPt");
  const chinaSellsP = chip > 0.5 ? A("tw.sim.chinaSellsProbability.blockade") : A("tw.sim.chinaSellsProbability.other");
  const chinaSale = { low: A("tw.sim.chinaSale.low"), mode: A("tw.sim.chinaSale.mode"), high: A("tw.sim.chinaSale.high") };
  const goldPerPt = A("tw.sim.goldPctPerGdpPt");
  const recessionThreshold = A("tw.sim.recessionGdpThreshold");
  const recessionWhenChipsStop = A("tw.sim.recessionProbabilityWhenChipsStop");
  const gdp: number[] = [];
  const eq: number[] = [];
  const y10: number[] = [];
  const gold: number[] = [];
  const oil: number[] = [];
  let recessions = 0;
  for (let i = 0; i < runs; i++) {
    const g = triangular(rng, impact.low, impact.mode, impact.high) * mult * (0.8 + 0.4 * rng());
    gdp.push(-g);
    // Equities: drawdown per point of world GDP lost, plus a fear premium when chips stop; capped at −60.
    eq.push(-Math.min(60, g * -eqPerPt + (chip > 0.5 ? triangular(rng, fear.low, fear.mode, fear.high) : 0)));
    // Treasuries: flight to safety per GDP point, offset when a sanctions-driven China sale is drawn.
    const chinaSells = coin(rng, chinaSellsP);
    y10.push(g * flightPerPt + (chinaSells ? triangular(rng, chinaSale.low, chinaSale.mode, chinaSale.high) : 0));
    gold.push(g * goldPerPt + triangular(rng, 3, 8, 15));
    // Oil: demand destruction dominates in war (−), shipping risk dominates in quarantine (+).
    oil.push(input.scenario === "war" ? triangular(rng, -25, -10, 10) : triangular(rng, 0, 8, 25));
    if (g > recessionThreshold || (chip >= 0.9 && rng() < recessionWhenChipsStop)) recessions++;
  }
  return {
    scenario: input.scenario,
    country,
    firstYearGdpPct: summarise(gdp),
    equityDrawdownPct: summarise(eq),
    tenYearDeltaBp: summarise(y10),
    goldPct: summarise(gold),
    oilPct: summarise(oil),
    chipSupplyLoss: chip,
    recessionProbability: round4(recessions / runs),
    assumptions: [
      `World GDP impact triangular ${impact.low}/${impact.mode}/${impact.high} % (${impact.sourceIds.join(", ")}); ${country} multiplier ${mult} [tw.mult.${country}].`,
      `Chip supply loss ${chip} (Taiwan ≈ 60 % of semiconductors, 90 % of leading-edge) [tw.chipLoss.${input.scenario}].`,
      `Equities ${eqPerPt} % per GDP point plus a ${fear.low}–${fear.high} % fear premium when chips stop [tw.sim.equityPctPerGdpPt, tw.sim.fearPremium.*].`,
      `Treasuries ${flightPerPt} bp per GDP point flight-to-safety, offset by a ${Math.round(chinaSellsP * 100)} % chance of Chinese sales under sanctions [tw.sim.flightBpPerGdpPt, tw.sim.chinaSells*].`,
      `${runs.toLocaleString()} paths.`,
      ...citeAssumptions("tw.sim"),
    ],
    sourceIds: [...impact.sourceIds, "tw-tsmc", "csis-china-power"],
  };
}

function round4(x: number) {
  return Math.round(x * 10_000) / 10_000;
}
