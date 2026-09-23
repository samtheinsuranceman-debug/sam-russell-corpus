/**
 * Statement Follow-Through Scorer — did they do what they said?
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every declared position from an official channel is logged with a category,
 * a severity and an environment. Later, an outcome is attached: followed
 * through, partially, not at all, or reversed. Over forty years that ledger
 * gives a base rate per category and per environment — which is exactly the
 * number the confidence engine needs to weight a new threat.
 *
 * It is deliberately conservative: an outcome is "followed" only when the
 * stated action occurred in the stated form. The refresh job appends new
 * statements daily; outcomes are attached by hand or by Thomas with a
 * citation, never inferred. No statement is taken from a Chinese government,
 * Party or state-media channel (owner's order, 23 Sep 2026).
 */
import type { IsoDate } from "./types";

/**
 * Categories are speaker-agnostic. The first ten are the Beijing ledger; the
 * rest arrived with the twenty-five-domain expansion
 * (`docs/synthesis/12_MACRO_DOMAIN_EXPANSION.md`). A new domain adds a
 * category here and nothing else changes: `followThroughReport()` and
 * `statementCredibility()` group by whatever values they see.
 */
export type StatementCategory =
  | "taiwan-military"
  | "taiwan-political"
  | "trade-retaliation"
  | "financial-retaliation"
  | "sanctions-countermeasure"
  | "territorial-scs"
  | "currency-policy"
  | "reserve-management"
  | "domestic-economic"
  | "diplomatic-warning"
  // ── expansion ──
  | "rate-guidance"          // central banks: forward guidance, dots, "transitory"
  | "balance-sheet-policy"   // QE / QT / facilities announced
  | "fiscal-forecast"        // CBO, OBR, Commission, Trustees: a projection with a date attached
  | "fiscal-commitment"      // budgets, deficit targets, debt-ceiling promises
  | "summit-commitment"      // G7 / G20 / BRICS / NATO communiqué line items
  | "programme-condition"    // IMF / ESM conditionality
  | "quota-decision"         // OPEC+ production decisions
  | "sanctions-designation"  // designations, packages, price caps
  | "trade-measure"          // tariffs, export controls, Section 301
  | "growth-target"          // China Work Report targets and the like
  | "regulatory-rule"        // Basel, FSB, NAIC filings, rate approvals
  | "security-commitment"    // defence spending pledges, alliance commitments
  | "export-restriction"     // food and fertilizer bans
  | "consensus-forecast";    // WEF, chief economists, SPF: what the consensus expected

export type Severity = "routine" | "warning" | "threat" | "ultimatum";

export type Environment =
  | "calm"
  | "trade-dispute"
  | "sanctions-escalation"
  | "taiwan-election"
  | "us-official-visit"
  | "military-incident"
  | "domestic-stress"
  | "leadership-transition"
  // ── expansion ──
  | "inflation-surge"
  | "recession"
  | "financial-crisis"
  | "election-year"
  | "war"
  | "pandemic"
  | "energy-shock";

export type Outcome = "followed" | "partial" | "not-followed" | "reversed" | "pending";

export type Statement = {
  id: string;
  date: IsoDate;
  speaker: string;
  channel: string;
  category: StatementCategory;
  severity: Severity;
  environment: Environment;
  /** What was said, paraphrased tightly. */
  claim: string;
  outcome: Outcome;
  /** What actually happened, with the date. */
  outcomeNote?: string;
  sourceId: string;
};

/**
 * The seed ledger. The 1979–2026 Beijing ledger (36 statements coded from
 * Xinhua, MFA, MOFCOM, NPC, State Council, PBOC, MND, TAO, People's Daily and
 * Global Times releases) was removed on 23 Sep 2026 under the owner's order
 * that nothing is read from a Chinese government, Party or state-media site.
 * Statements now arrive only through the refresh job's non-Chinese feeds and
 * hand entries with a U.S. or allied citation.
 */
export const STATEMENT_LEDGER: Statement[] = [];

export type FollowThroughRate = {
  n: number;
  followed: number;
  partial: number;
  notFollowed: number;
  reversed: number;
  pending: number;
  /** (followed + 0.5 × partial) / decided. */
  rate: number;
  /** Wilson 80 % interval on the rate. */
  low: number;
  high: number;
};

function rateOf(rows: Statement[]): FollowThroughRate {
  const c = { followed: 0, partial: 0, notFollowed: 0, reversed: 0, pending: 0 };
  for (const r of rows) {
    if (r.outcome === "followed") c.followed++;
    else if (r.outcome === "partial") c.partial++;
    else if (r.outcome === "not-followed") c.notFollowed++;
    else if (r.outcome === "reversed") c.reversed++;
    else c.pending++;
  }
  const decided = rows.length - c.pending;
  const p = decided ? (c.followed + 0.5 * c.partial) / decided : 0;
  const z = 1.2816; // 80 %
  const n = Math.max(decided, 1);
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return {
    n: rows.length,
    ...c,
    rate: round4(p),
    low: round4(Math.max(0, centre - half)),
    high: round4(Math.min(1, centre + half)),
  };
}

export type FollowThroughReport = {
  asOf: IsoDate;
  overall: FollowThroughRate;
  byCategory: Array<{ category: StatementCategory; rate: FollowThroughRate }>;
  bySeverity: Array<{ severity: Severity; rate: FollowThroughRate }>;
  byEnvironment: Array<{ environment: Environment; rate: FollowThroughRate }>;
  byChannel: Array<{ channel: string; rate: FollowThroughRate }>;
  /** The pattern worth knowing: the categories where words and deeds diverge most. */
  findings: string[];
  sourceIds: string[];
};

export function followThroughReport(ledger: Statement[] = STATEMENT_LEDGER, asOf: IsoDate = "2026-09-22"): FollowThroughReport {
  const group = <K extends string>(key: (s: Statement) => K) => {
    const m = new Map<K, Statement[]>();
    for (const s of ledger) m.set(key(s), [...(m.get(key(s)) ?? []), s]);
    return Array.from(m.entries()).map(([k, rows]) => [k, rateOf(rows)] as const);
  };
  const byCategory = group(s => s.category).map(([category, rate]) => ({ category, rate }));
  const bySeverity = group(s => s.severity).map(([severity, rate]) => ({ severity, rate }));
  const byEnvironment = group(s => s.environment).map(([environment, rate]) => ({ environment, rate }));
  const byChannel = group(s => (s.channel === "State media" ? "State media" : s.speaker.includes("Theater") || s.speaker === "MND" ? "Military" : s.speaker.includes("MOFCOM") ? "MOFCOM" : s.speaker.includes("NPC") || s.speaker.includes("State Council") ? "Law / State Council" : "MFA / other")).map(([channel, rate]) => ({ channel, rate }));

  const findings: string[] = [];
  const fin = byCategory.find(c => c.category === "financial-retaliation")?.rate;
  const trade = byCategory.find(c => c.category === "trade-retaliation")?.rate;
  const mil = byCategory.find(c => c.category === "taiwan-military")?.rate;
  const media = byChannel.find(c => c.channel === "State media")?.rate;
  const law = byChannel.find(c => c.channel === "Law / State Council")?.rate;
  if (fin && trade) findings.push(`Financial threats are followed through at ${pct(fin.rate)} (n=${fin.n}); trade threats at ${pct(trade.rate)} (n=${trade.n}). The 'dump Treasuries' threat has never been executed as stated.`);
  if (mil) findings.push(`Announced Taiwan military exercises are executed ${pct(mil.rate)} of the time (n=${mil.n}): when the Eastern Theater Command names an exercise, it happens.`);
  if (media && law) findings.push(`State-media threats follow through at ${pct(media.rate)}; anything put into law or a State Council decision at ${pct(law.rate)}. Weight the channel, not the volume.`);
  const visit = byEnvironment.find(e => e.environment === "us-official-visit")?.rate;
  if (visit) findings.push(`In the 'U.S. official visit' environment the follow-through rate is ${pct(visit.rate)} — responses to visits are the most reliable threats in the ledger.`);
  const cur = byCategory.find(c => c.category === "currency-policy")?.rate;
  if (cur) findings.push(`Currency-policy statements are the least reliable category (${pct(cur.rate)}): August 2015's 'one-off' became an 18-month, $500 bn Treasury sale.`);

  return {
    asOf,
    overall: rateOf(ledger),
    byCategory,
    bySeverity,
    byEnvironment,
    byChannel,
    findings,
    sourceIds: Array.from(new Set(ledger.map(s => s.sourceId))),
  };
}

/**
 * Weight a new statement for the confidence engine: the base rate for its
 * category × environment, shrunk toward the overall rate when the cell is
 * thin. Returns a signal multiplier in [0.2, 1.0]; 0.5 when the ledger holds
 * no decided statement yet.
 */
export function statementCredibility(category: StatementCategory, environment: Environment, ledger: Statement[] = STATEMENT_LEDGER): number {
  const all = rateOf(ledger);
  // With no decided statement on record there is no base rate: an uninformed 0.5, not a penalty.
  if (all.n - all.pending === 0) return 0.5;
  const overall = all.rate;
  const cell = ledger.filter(s => s.category === category && s.environment === environment);
  const cat = ledger.filter(s => s.category === category);
  const cellRate = cell.length ? rateOf(cell) : null;
  const catRate = cat.length ? rateOf(cat) : null;
  // Shrinkage: n/(n+k) weight on the cell, k = 4.
  const k = 4;
  let est = overall;
  if (catRate) est = (catRate.n / (catRate.n + k)) * catRate.rate + (k / (catRate.n + k)) * overall;
  if (cellRate) est = (cellRate.n / (cellRate.n + k)) * cellRate.rate + (k / (cellRate.n + k)) * est;
  return round4(Math.max(0.2, Math.min(1, est)));
}

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}
function round4(x: number) {
  return Math.round(x * 10_000) / 10_000;
}
