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
 * The seed ledger below is the historical record from 1979 to 2026, coded
 * from the public account (Xinhua / MFA / State Council releases and the
 * subsequent record). It is deliberately conservative: an outcome is
 * "followed" only when the stated action occurred in the stated form. The
 * refresh job appends new statements daily; outcomes are attached by hand or
 * by Thomas with a citation, never inferred.
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

export const STATEMENT_LEDGER: Statement[] = [
  { id: "1979-01-tw", date: "1979-01-01", speaker: "NPC Standing Committee", channel: "Message to Compatriots in Taiwan", category: "taiwan-political", severity: "routine", environment: "calm", claim: "Peaceful reunification; end of Kinmen shelling", outcome: "followed", outcomeNote: "Shelling ended 1 Jan 1979", sourceId: "cn-npc" },
  { id: "1995-07-tw", date: "1995-07-18", speaker: "Xinhua", channel: "Announcement", category: "taiwan-military", severity: "threat", environment: "us-official-visit", claim: "Missile tests near Taiwan after Lee Teng-hui's Cornell visit", outcome: "followed", outcomeNote: "DF-15 launches July 1995 and March 1996", sourceId: "cn-xinhua" },
  { id: "1996-03-tw", date: "1996-03-05", speaker: "Xinhua", channel: "Announcement", category: "taiwan-military", severity: "threat", environment: "taiwan-election", claim: "Live-fire exercises before Taiwan's first direct election", outcome: "followed", outcomeNote: "Exercises held; U.S. carriers deployed", sourceId: "cn-xinhua" },
  { id: "1999-05-emb", date: "1999-05-09", speaker: "MFA", channel: "Statement", category: "diplomatic-warning", severity: "threat", environment: "military-incident", claim: "Suspend military contacts after Belgrade embassy bombing", outcome: "followed", outcomeNote: "Contacts suspended for months", sourceId: "cn-mofa" },
  { id: "2000-02-wp", date: "2000-02-21", speaker: "State Council", channel: "White Paper", category: "taiwan-political", severity: "ultimatum", environment: "taiwan-election", claim: "Indefinite refusal to negotiate justifies force", outcome: "not-followed", outcomeNote: "No force used; codified in 2005 law instead", sourceId: "cn-gov-state-council" },
  { id: "2005-03-asl", date: "2005-03-14", speaker: "NPC", channel: "Anti-Secession Law", category: "taiwan-political", severity: "ultimatum", environment: "calm", claim: "Non-peaceful means if secession occurs", outcome: "pending", outcomeNote: "Never triggered; remains the legal basis", sourceId: "cn-npc" },
  { id: "2010-01-arms", date: "2010-01-30", speaker: "MFA", channel: "Statement", category: "trade-retaliation", severity: "threat", environment: "us-official-visit", claim: "Sanctions on U.S. firms selling arms to Taiwan", outcome: "not-followed", outcomeNote: "No sanctions imposed in 2010", sourceId: "cn-mofa" },
  { id: "2010-09-re", date: "2010-09-22", speaker: "MOFCOM (via Xinhua)", channel: "Reported", category: "trade-retaliation", severity: "threat", environment: "military-incident", claim: "Rare-earth restrictions on Japan after Senkaku collision", outcome: "followed", outcomeNote: "Exports halted ~2 months; WTO ruled against China 2014", sourceId: "cn-mofcom" },
  { id: "2012-09-jp", date: "2012-09-11", speaker: "MFA", channel: "Statement", category: "territorial-scs", severity: "threat", environment: "military-incident", claim: "Countermeasures after Japan nationalises Senkakus", outcome: "followed", outcomeNote: "Coast-guard patrols began and continue", sourceId: "cn-mofa" },
  { id: "2013-11-adiz", date: "2013-11-23", speaker: "MND", channel: "Announcement", category: "territorial-scs", severity: "warning", environment: "calm", claim: "East China Sea ADIZ; 'defensive emergency measures' against non-compliance", outcome: "partial", outcomeNote: "ADIZ declared; enforcement never applied to U.S. flights", sourceId: "cn-mod" },
  { id: "2015-08-fx", date: "2015-08-11", speaker: "PBOC", channel: "Statement", category: "currency-policy", severity: "routine", environment: "domestic-stress", claim: "One-off fixing adjustment; no basis for sustained depreciation", outcome: "reversed", outcomeNote: "Yuan fell ~10 % over 18 months; ~$500 bn of Treasuries sold to defend it", sourceId: "cn-pboc-mpc" },
  { id: "2016-07-scs", date: "2016-07-12", speaker: "MFA", channel: "Statement", category: "territorial-scs", severity: "ultimatum", environment: "calm", claim: "Arbitration award 'null and void'; will not accept", outcome: "followed", outcomeNote: "Award ignored; island building continued", sourceId: "cn-mofa" },
  { id: "2017-03-kr", date: "2017-03-03", speaker: "MFA / MOFCOM", channel: "Statement", category: "trade-retaliation", severity: "threat", environment: "military-incident", claim: "Consequences for Korea over THAAD", outcome: "followed", outcomeNote: "Lotte stores closed; tour groups banned; ~$7 bn cost to Korea", sourceId: "cn-mofcom" },
  { id: "2018-04-soy", date: "2018-04-04", speaker: "MOFCOM", channel: "Announcement", category: "trade-retaliation", severity: "threat", environment: "trade-dispute", claim: "25 % tariff on U.S. soybeans, aircraft, autos", outcome: "followed", outcomeNote: "Imposed 6 July 2018", sourceId: "cn-mofcom" },
  { id: "2019-05-ust", date: "2019-05-13", speaker: "Global Times editorial", channel: "State media", category: "financial-retaliation", severity: "threat", environment: "trade-dispute", claim: "China could dump U.S. Treasuries as a 'nuclear option'", outcome: "not-followed", outcomeNote: "Holdings drifted lower, no dump", sourceId: "cn-global-times" },
  { id: "2019-05-uel", date: "2019-05-31", speaker: "MOFCOM", channel: "Announcement", category: "sanctions-countermeasure", severity: "threat", environment: "trade-dispute", claim: "Unreliable Entity List to be established", outcome: "partial", outcomeNote: "Rules issued Sept 2020; first listings Feb 2023", sourceId: "cn-mofcom" },
  { id: "2019-06-re", date: "2019-05-29", speaker: "NDRC (via People's Daily)", channel: "State media", category: "trade-retaliation", severity: "warning", environment: "trade-dispute", claim: "'Don't say we didn't warn you' on rare earths", outcome: "not-followed", outcomeNote: "No 2019 restriction; controls came 2023–25", sourceId: "cn-peoples-daily" },
  { id: "2020-05-hk", date: "2020-05-22", speaker: "NPC", channel: "Decision", category: "domestic-economic", severity: "ultimatum", environment: "domestic-stress", claim: "National security law for Hong Kong", outcome: "followed", outcomeNote: "Enacted 30 June 2020", sourceId: "cn-npc" },
  { id: "2020-06-in", date: "2020-06-17", speaker: "MFA", channel: "Statement", category: "territorial-scs", severity: "warning", environment: "military-incident", claim: "India responsible for Galwan; China will defend sovereignty", outcome: "followed", outcomeNote: "Positions held; disengagement talks to 2024", sourceId: "cn-mofa" },
  { id: "2020-12-au", date: "2020-12-01", speaker: "MOFCOM", channel: "Announcement", category: "trade-retaliation", severity: "threat", environment: "trade-dispute", claim: "Anti-dumping duties on Australian wine, barley; coal restrictions", outcome: "followed", outcomeNote: "Imposed; most lifted 2023–24", sourceId: "cn-mofcom" },
  { id: "2021-06-afsl", date: "2021-06-10", speaker: "NPC", channel: "Anti-Foreign Sanctions Law", category: "sanctions-countermeasure", severity: "ultimatum", environment: "sanctions-escalation", claim: "Countermeasures against foreign sanctions", outcome: "partial", outcomeNote: "Used sparingly against individuals and firms", sourceId: "cn-npc" },
  { id: "2022-08-pelosi", date: "2022-08-02", speaker: "MFA / MND", channel: "Statement", category: "taiwan-military", severity: "threat", environment: "us-official-visit", claim: "Resolute countermeasures if Pelosi visits", outcome: "followed", outcomeNote: "Largest exercises since 1996; missiles over Taiwan; sanctions on Pelosi", sourceId: "cn-mofa" },
  { id: "2022-08-tw-trade", date: "2022-08-03", speaker: "MOFCOM / GACC", channel: "Announcement", category: "trade-retaliation", severity: "threat", environment: "us-official-visit", claim: "Ban Taiwanese citrus, fish; halt sand exports", outcome: "followed", outcomeNote: "Imposed 3 Aug 2022", sourceId: "cn-mofcom" },
  { id: "2023-04-js", date: "2023-04-08", speaker: "Eastern Theater Command", channel: "Announcement", category: "taiwan-military", severity: "threat", environment: "us-official-visit", claim: "Joint Sword exercises after Tsai–McCarthy meeting", outcome: "followed", outcomeNote: "Three days of exercises", sourceId: "cn-mod" },
  { id: "2023-07-ga", date: "2023-07-03", speaker: "MOFCOM", channel: "Announcement", category: "trade-retaliation", severity: "threat", environment: "sanctions-escalation", claim: "Export controls on gallium and germanium from 1 Aug", outcome: "followed", outcomeNote: "In force 1 Aug 2023", sourceId: "cn-mofcom" },
  { id: "2023-10-graphite", date: "2023-10-20", speaker: "MOFCOM", channel: "Announcement", category: "trade-retaliation", severity: "threat", environment: "sanctions-escalation", claim: "Export controls on graphite from 1 Dec", outcome: "followed", outcomeNote: "In force 1 Dec 2023", sourceId: "cn-mofcom" },
  { id: "2024-05-js2024a", date: "2024-05-23", speaker: "Eastern Theater Command", channel: "Announcement", category: "taiwan-military", severity: "threat", environment: "taiwan-election", claim: "Joint Sword-2024A 'punishment' after Lai inauguration", outcome: "followed", outcomeNote: "Two days of exercises", sourceId: "cn-mod" },
  { id: "2024-10-js2024b", date: "2024-10-14", speaker: "Eastern Theater Command", channel: "Announcement", category: "taiwan-military", severity: "threat", environment: "calm", claim: "Joint Sword-2024B after National Day speech", outcome: "followed", outcomeNote: "One-day encirclement; record 153 aircraft", sourceId: "cn-mod" },
  { id: "2024-12-uel", date: "2024-12-05", speaker: "MOFCOM", channel: "Announcement", category: "sanctions-countermeasure", severity: "threat", environment: "sanctions-escalation", claim: "Ban gallium, germanium, antimony exports to the U.S.", outcome: "followed", outcomeNote: "In force 3 Dec 2024", sourceId: "cn-mofcom" },
  { id: "2025-04-re", date: "2025-04-04", speaker: "MOFCOM", channel: "Announcement", category: "trade-retaliation", severity: "threat", environment: "trade-dispute", claim: "Export controls on seven rare-earth elements", outcome: "followed", outcomeNote: "Licences required from 4 Apr 2025; eased under the truce", sourceId: "cn-mofcom" },
  { id: "2025-04-tariff", date: "2025-04-11", speaker: "State Council Tariff Commission", channel: "Announcement", category: "trade-retaliation", severity: "threat", environment: "trade-dispute", claim: "125 % tariff on U.S. goods", outcome: "followed", outcomeNote: "Imposed; cut to 10 % under the May 2025 Geneva truce", sourceId: "cn-gov-state-council" },
  { id: "2025-04-st", date: "2025-04-01", speaker: "Eastern Theater Command", channel: "Announcement", category: "taiwan-military", severity: "threat", environment: "calm", claim: "Strait Thunder-2025A exercises", outcome: "followed", outcomeNote: "Two days; blockade rehearsal", sourceId: "cn-mod" },
  { id: "2025-12-jm", date: "2025-12-01", speaker: "Eastern Theater Command", channel: "Announcement", category: "taiwan-military", severity: "threat", environment: "calm", claim: "Justice Mission 2025 — port isolation and seizure rehearsal", outcome: "followed", outcomeNote: "Full maritime blockade rehearsed", sourceId: "cn-mod" },
  { id: "2026-03-ust", date: "2026-03-10", speaker: "Global Times", channel: "State media", category: "financial-retaliation", severity: "warning", environment: "sanctions-escalation", claim: "Treasury holdings are a 'card' China can play", outcome: "not-followed", outcomeNote: "Holdings fell $33 bn over Apr–Jul, consistent with the multi-year drift, not a dump", sourceId: "cn-global-times" },
  { id: "2026-06-gold", date: "2026-06-07", speaker: "PBOC (via SAFE)", channel: "Data release", category: "reserve-management", severity: "routine", environment: "calm", claim: "Continued reserve diversification", outcome: "followed", outcomeNote: "22nd straight month of gold buying, Aug 2026", sourceId: "cn-pboc-gold" },
  { id: "2026-07-tw", date: "2026-07-15", speaker: "Taiwan Affairs Office", channel: "Press conference", category: "taiwan-political", severity: "warning", environment: "calm", claim: "'Taiwan independence forces' will be punished", outcome: "partial", outcomeNote: "Record 244 ships in July; no named exercise", sourceId: "cn-taiwan-affairs-office" },
];

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
 * thin. Returns a signal multiplier in [0.2, 1.0].
 */
export function statementCredibility(category: StatementCategory, environment: Environment, ledger: Statement[] = STATEMENT_LEDGER): number {
  const overall = rateOf(ledger).rate;
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
