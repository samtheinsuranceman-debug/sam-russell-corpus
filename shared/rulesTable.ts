// ─── The rules-table contract ───────────────────────────────────────────────
// One shape for every table that holds law, product terms or lender gates.
//
// ## Why this exists
//
// Two excellent rules tables already exist and they have different shapes.
// `thresholds.ts` holds every gate a mechanism must clear, each with its
// standard value, its documented variants, an evidence score and a source URL.
// `divorceStateRules.ts` holds the property regime for all fifty-one
// jurisdictions with a version stamp and a never-print list. Both are right
// about what a rules table needs; neither can be read by code that does not
// know which one it is holding.
//
// That costs three things. Every consumer writes bespoke access code. No scan
// can verify "every statutory constant reaches a rules table", because there is
// no single thing to reach. And the third table — security-deposit statutes,
// AG 49-A caps, whatever comes next — has no shape to copy, so it invents a
// fourth one.
//
// This file is the shape. It is deliberately thin: an adapter over a table, not
// a rewrite of it. Neither existing table changes; each gains a function that
// presents it through this interface.
//
// ## What every rules table owes its reader
//
//  · A VERSION, so an illustration can pin the law it was computed against.
//  · An AS-OF date, because "current" is not a date.
//  · A SOURCE per row, because a rule with no citation is a claim.
//  · An EVIDENCE score per source, because a statute and a market report are
//    not the same authority and flattening them is a quiet lie.
//  · A NEVER-PRINTED list, because the most dangerous use of a rules table is
//    the conclusion it looks like it supports but does not.
//
// The last one is the reason this interface exists at all. A table that says
// what it cannot be used for is a table that survives contact with a compliance
// reviewer.

/** How far a source can be trusted. The scale is stated so it cannot drift. */
export type EvidenceScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const EVIDENCE_SCALE: Readonly<Record<string, EvidenceScore>> = {
  /** Statute, regulation, or the contract itself. */
  statute: 10,
  /** A regulator or standards body publishing in its own name. */
  regulator: 9,
  /** The counterparty's own published page or rate sheet. */
  primaryParty: 8,
  /** A trade body or a filing that quotes the primary. */
  secondary: 6,
  /** A market report or comparison site. */
  marketReport: 5,
  /** Inference from adjacent facts. Never publishable on its own. */
  inference: 2,
};

export interface RuleSource {
  /** Where the figure was read. */
  readonly url: string;
  /** How far it can be trusted, on EVIDENCE_SCALE. */
  readonly evidence: EvidenceScore;
  /** When it was read. Not when it was published — when we looked. */
  readonly readOn: string;
}

/**
 * A rules table, presented uniformly.
 *
 * `T` is the table's own row type. This interface never reshapes rows; a
 * consumer that needs the detail reaches through `rows` and keeps its types.
 * What it standardises is the metadata that decides whether a row may be shown.
 */
export interface RulesTable<T> {
  /** Stable identifier, used by scans and by the scorecard. */
  readonly id: string;
  /** Human name for the table. */
  readonly label: string;
  /** Version stamp an illustration pins so it can be reproduced later. */
  readonly version: string;
  /** When this version was compiled. */
  readonly asOf: string;
  /** The rows, in the table's own shape. */
  readonly rows: readonly T[];
  /** What a reader must not conclude from this table. */
  readonly neverPrinted: readonly string[];
  /** The source behind one row, by that row's identifier. Null where none is on file. */
  sourceFor(rowId: string): RuleSource | null;
  /** The row identifier a caller passes to `sourceFor`. */
  idOf(row: T): string;
}

/** Registered tables, so a scan can enumerate them without importing each one. */
const REGISTRY: Array<RulesTable<unknown>> = [];

export function registerRulesTable<T>(table: RulesTable<T>): RulesTable<T> {
  for (let i = 0; i < REGISTRY.length; i++) {
    if (REGISTRY[i].id === table.id) {
      REGISTRY[i] = table as RulesTable<unknown>;
      return table;
    }
  }
  REGISTRY.push(table as RulesTable<unknown>);
  return table;
}

export function allRulesTables(): ReadonlyArray<RulesTable<unknown>> {
  return REGISTRY.slice();
}

export function rulesTable(id: string): RulesTable<unknown> | null {
  for (let i = 0; i < REGISTRY.length; i++) if (REGISTRY[i].id === id) return REGISTRY[i];
  return null;
}

/**
 * Rows whose source is missing, or weaker than the bar a caller sets.
 *
 * This is the function that turns "are we sourced?" from an opinion into a
 * number. Run it at a bar of 8 and what comes back is the publish-blocking
 * list: every row that currently rests on a market report or an inference.
 */
export function rowsBelowEvidence<T>(table: RulesTable<T>, bar: EvidenceScore): Array<{ id: string; evidence: EvidenceScore | null }> {
  const out: Array<{ id: string; evidence: EvidenceScore | null }> = [];
  for (let i = 0; i < table.rows.length; i++) {
    const id = table.idOf(table.rows[i]);
    const src = table.sourceFor(id);
    if (!src) out.push({ id, evidence: null });
    else if (src.evidence < bar) out.push({ id, evidence: src.evidence });
  }
  return out;
}

/** Every never-print line across every registered table, deduplicated. */
export function allNeverPrinted(): string[] {
  const seen: Record<string, true> = {};
  const out: string[] = [];
  const tables = allRulesTables();
  for (let i = 0; i < tables.length; i++) {
    const lines = tables[i].neverPrinted;
    for (let j = 0; j < lines.length; j++) {
      if (!seen[lines[j]]) { seen[lines[j]] = true; out.push(lines[j]); }
    }
  }
  return out;
}

/** A one-line coverage summary per table, for the scorecard and the status page. */
export function evidenceCoverage(bar: EvidenceScore = 8): Array<{ id: string; label: string; rows: number; below: number; version: string; asOf: string }> {
  const tables = allRulesTables();
  const out: Array<{ id: string; label: string; rows: number; below: number; version: string; asOf: string }> = [];
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i];
    out.push({ id: t.id, label: t.label, rows: t.rows.length, below: rowsBelowEvidence(t, bar).length, version: t.version, asOf: t.asOf });
  }
  return out;
}
