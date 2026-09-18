// ─── Rules-table adapters ───────────────────────────────────────────────────
// Presents the existing rules tables through the RulesTable<T> contract.
//
// Deliberately an adapter layer and not a rewrite. `thresholds.ts` and
// `divorceStateRules.ts` are both good at what they do and both are consumed
// directly by engines that depend on their exact shapes. Nothing here changes
// either file; each simply gains a uniform front door so that a scan, the
// scorecard and the status page can read every rules table the same way.
//
// Adding a third table — security-deposit statutes, AG 49-A caps — means
// writing one adapter here, and it is immediately visible to everything that
// reads the registry.

import { registerRulesTable, type RulesTable, type RuleSource, type EvidenceScore } from "./rulesTable";
import { THRESHOLDS, type Threshold } from "./thresholds";
import { STATE_DIVORCE_RULES, RULES_VERSION, type StateDivorceRule } from "./divorceStateRules";
import { AG49_PRODUCTS, AG49_VERSION, type Ag49Product } from "./ag49Products";

/* ═══ Thresholds ═══════════════════════════════════════════════════════════
 * Already carries a source and a 1–10 evidence score per standard and per
 * variant. The adapter reports the STANDARD's source, because that is the
 * figure a household meets without shopping; variants are reachable through
 * the row itself. */

export const thresholdsTable: RulesTable<Threshold> = registerRulesTable<Threshold>({
  id: "thresholds",
  label: "Mechanism thresholds — every gate, its standard, and the documented ways it moves",
  version: "2026.09.1",
  asOf: "2026-09-18",
  rows: THRESHOLDS,
  neverPrinted: [
    "That a variant is available to a given household. A variant is a documented exception, not an entitlement.",
    "A rate, fee or contact for any named provider. Those publish only when read from the provider's own page.",
    "That an immovable threshold can be negotiated. Where `fixed` is set, the authority is stated and it binds.",
    "That the best variant is the likely outcome. It is the best documented case, which is not the same thing.",
  ],
  idOf: (t) => t.id,
  sourceFor(id) {
    for (let i = 0; i < THRESHOLDS.length; i++) {
      if (THRESHOLDS[i].id !== id) continue;
      const t = THRESHOLDS[i];
      // The standard's own source. Evidence is taken from the strongest variant
      // that cites the same URL, else the statute default where `fixed` names an
      // authority, else a conservative secondary.
      let evidence: EvidenceScore = t.fixed ? 10 : 6;
      for (let j = 0; j < t.variants.length; j++) {
        if (t.variants[j].source === t.standardSource) {
          const e = Math.max(1, Math.min(10, Math.round(t.variants[j].evidence))) as EvidenceScore;
          if (e > evidence) evidence = e;
        }
      }
      return { url: t.fixed ? t.fixed.source : t.standardSource, evidence, readOn: "2026-09-18" };
    }
    return null;
  },
});

/* ═══ Divorce state rules ══════════════════════════════════════════════════
 * Every row is statute, so evidence is 10 throughout. The table's own
 * RULES_VERSION already carries the never-print list; it is reused verbatim
 * rather than restated, so the two can never drift. */

export const divorceRulesTable: RulesTable<StateDivorceRule> = registerRulesTable<StateDivorceRule>({
  id: "divorce-state-rules",
  label: "Marital property regime by jurisdiction",
  version: RULES_VERSION.version,
  asOf: RULES_VERSION.compiledOn,
  rows: STATE_DIVORCE_RULES,
  neverPrinted: RULES_VERSION.neverPrinted,
  idOf: (r) => r.code,
  sourceFor(code) {
    for (let i = 0; i < STATE_DIVORCE_RULES.length; i++) {
      const r = STATE_DIVORCE_RULES[i];
      if (r.code !== code) continue;
      const cite = (r as unknown as { statute?: { source?: string; value?: string } }).statute;
      const url = cite && typeof cite.source === "string" ? cite.source : "";
      return url ? { url, evidence: 10 as EvidenceScore, readOn: RULES_VERSION.compiledOn } : null;
    }
    return null;
  },
});

/* ═══ AG 49-A product caps ═════════════════════════════════════════════════ */

export const ag49Table: RulesTable<Ag49Product> = registerRulesTable<Ag49Product>({
  id: "ag49-products",
  label: "AG 49-A maximum illustrated rate, per product",
  version: AG49_VERSION.version,
  asOf: AG49_VERSION.compiledOn,
  rows: AG49_PRODUCTS,
  neverPrinted: AG49_VERSION.neverPrinted,
  idOf: (p) => p.id,
  sourceFor(id) {
    for (let i = 0; i < AG49_PRODUCTS.length; i++) {
      const p = AG49_PRODUCTS[i];
      if (p.id !== id) continue;
      return p.disclosureUrl ? { url: p.disclosureUrl, evidence: 9 as EvidenceScore, readOn: p.readOn } : null;
    }
    return null;
  },
});

/** Importing this module registers every table. Call it where registration must be guaranteed. */
export function ensureRulesTablesRegistered(): number {
  return [thresholdsTable, divorceRulesTable, ag49Table].length;
}
