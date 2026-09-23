/**
 * Daily Liquidation Confidence — Japan and China, scored every day from the
 * panel, with the 24-month amount distribution attached.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `assessLiquidation` is what the daily refresh runs and what Thomas quotes.
 * It joins three things: the indicator panel (indicators.ts), the latest
 * observations (refresh or seed), and the statement-credibility multiplier
 * for anything that is words rather than data.
 */
import type { ConfidenceAssessment, Evidence, IsoDate, Observation } from "./types";
import { assess, narrate, signalFrom } from "./confidence";
import { JAPAN_LIQUIDATION, CHINA_LIQUIDATION } from "./indicators";
import { SOURCE_BY_ID } from "./sources";
import { statementCredibility } from "./statementFollowThrough";
import { forecastLiquidation, type LiquidationForecast } from "./treasuryLiquidation";
import { A } from "./assumptions";

/** Neutral point and span per indicator: what "no signal" looks like and what a full signal is. */
const NORMALISATION: Record<string, { neutral: number; span: number }> = {
  // Japan — values are USD bn unless noted
  "jp-tic-mom": { neutral: 0, span: 60 },
  "jp-reserves-foreign-securities": { neutral: 0, span: 80 },
  "jp-intervention-yen": { neutral: 0, span: 15 }, // JPY tn over 3 months
  "jp-usdjpy-vs-line": { neutral: 5, span: -5 }, // closer than 5 yen → positive; span negative flips the sign
  "jp-jgb10y": { neutral: 1.5, span: 1.5 },
  "jp-hedged-ust-carry": { neutral: 0, span: 1.5 }, // pp; direction risk-down so negative carry → risk up
  "jp-lifers-foreign-bond-flow": { neutral: 0, span: -300 }, // JPY bn; selling (negative) is risk-up
  "jp-banks-foreign-bond-flow": { neutral: 0, span: -300 },
  "jp-boj-policy-rate-path": { neutral: 0.75, span: 1.0 },
  "jp-gpif-foreign-bond-weight": { neutral: 0, span: 3 },
  "jp-fima-usage": { neutral: 0, span: 50 },
  "jp-us-coordination": { neutral: 0, span: 1 },
  "jp-fed-custody-japan-proxy": { neutral: 0, span: -40 },
  "jp-diet-reserve-debate": { neutral: 0, span: 4 },
  "jp-law-mandate": { neutral: 0, span: 1 },
  // China
  "cn-tic-mom": { neutral: -10, span: -60 }, // the drift is −10/3mo; a full signal is −70
  "cn-tic-plus-belgium-hk": { neutral: -15, span: -80 },
  "cn-pboc-gold-streak": { neutral: 6, span: 18 },
  "cn-safe-reserves-change": { neutral: 0, span: -60 },
  "cn-agency-mbs-holdings": { neutral: 0, span: -30 },
  "cn-cips-volume-growth": { neutral: 15, span: 30 },
  "cn-us-sanction-escalation": { neutral: 0, span: 4 },
  "cn-mofcom-countermeasures": { neutral: 1, span: 5 },
  "cn-mfa-dollar-rhetoric": { neutral: 1, span: 6 },
  "cn-state-media-threat": { neutral: 2, span: 8 },
  "cn-cny-pressure": { neutral: 50, span: 300 },
  "cn-capital-outflow-proxy": { neutral: -20, span: -100 },
  "cn-npc-law-financial-security": { neutral: 0, span: 1 },
  "cn-taiwan-tension-link": { neutral: 0.08, span: 0.15 },
  "cn-ust-share-of-reserves": { neutral: 20, span: 10 },
};

/** Which indicators are words rather than data, and how to credit them. */
const STATEMENT_INDICATORS: Record<string, Parameters<typeof statementCredibility>> = {
  "cn-mfa-dollar-rhetoric": ["financial-retaliation", "sanctions-escalation"],
  "cn-state-media-threat": ["financial-retaliation", "sanctions-escalation"],
  "jp-diet-reserve-debate": ["reserve-management", "calm"],
};

export function liquidationEvidence(holder: "JP" | "CN", observations: Observation[]): Evidence[] {
  const panel = holder === "JP" ? JAPAN_LIQUIDATION : CHINA_LIQUIDATION;
  const byId = new Map(panel.map(i => [i.id, i]));
  // Count corroboration: distinct sources reporting the same indicator in the last reading month.
  const sourcesPer = new Map<string, Set<string>>();
  for (const o of observations) {
    if (!byId.has(o.indicatorId)) continue;
    sourcesPer.set(o.indicatorId, (sourcesPer.get(o.indicatorId) ?? new Set()).add(o.sourceId));
  }
  return observations
    .filter(o => byId.has(o.indicatorId))
    .map(o => {
      const n = NORMALISATION[o.indicatorId] ?? { neutral: 0, span: 1 };
      let signal = signalFrom(o.value, n.neutral, Math.abs(n.span));
      if (n.span < 0) signal = -signal;
      const stmt = STATEMENT_INDICATORS[o.indicatorId];
      if (stmt) signal *= statementCredibility(stmt[0], stmt[1]);
      const src = SOURCE_BY_ID.get(o.sourceId);
      return {
        indicatorId: o.indicatorId,
        signal,
        weight: byId.get(o.indicatorId)!.weight,
        tier: src?.tier ?? "secondary",
        asOf: o.asOf,
        corroboration: sourcesPer.get(o.indicatorId)?.size ?? 1,
        note: o.sourceId,
      } satisfies Evidence;
    });
}

export type LiquidationConfidence = {
  holder: "JP" | "CN";
  asOf: IsoDate;
  /** Probability of a stress-selling regime (≥ 10 % of holdings within 24 months). */
  stress: ConfidenceAssessment;
  narrative: string;
  forecast: LiquidationForecast;
  /** Which indicators were words, and the credibility multiplier applied. */
  statementWeights: Array<{ indicatorId: string; multiplier: number }>;
};

/**
 * Priors: over any 24-month window since 2000, Japan has cut Treasury holdings
 * by ≥ 10 % in roughly 15 % of windows (2022–23, 2024–25 (partial)); China in
 * roughly 25 % (2015–16, 2022–23, 2024–26 drift). Base rates are set from TIC.
 */
export const LIQUIDATION_PRIORS = { JP: A("liq.prior.JP"), CN: A("liq.prior.CN") } as const;

export function assessLiquidation(holder: "JP" | "CN", observations: Observation[], today: IsoDate): LiquidationConfidence {
  const evidence = liquidationEvidence(holder, observations);
  const panel = holder === "JP" ? JAPAN_LIQUIDATION : CHINA_LIQUIDATION;
  const stress = assess({
    modelId: `liquidation-${holder}`,
    prior: LIQUIDATION_PRIORS[holder],
    indicators: panel,
    evidence,
    today,
    scale: A("liq.scale"),
  });
  const forecast = forecastLiquidation({ holder, stressProbability: stress.band.probability, today });
  const statementWeights = Object.entries(STATEMENT_INDICATORS)
    .filter(([id]) => panel.some(i => i.id === id))
    .map(([id, args]) => ({ indicatorId: id, multiplier: statementCredibility(args[0], args[1]) }));
  const label = holder === "JP" ? "Japan sells ≥ 10 % of its Treasuries within 24 months" : "China sells ≥ 10 % of its Treasuries within 24 months";
  return {
    holder,
    asOf: today,
    stress,
    narrative: narrate(stress, label),
    forecast,
    statementWeights,
  };
}
