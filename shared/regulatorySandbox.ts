/**
 * SI-026 — the regulatory sandbox.
 *
 * The portfolio review said this had no code behind it. That was true when it
 * was written and is not quite true now: `taxRules.ts` versions every rule set
 * by year with its revenue procedure, `diffRuleSets()` reports what changed
 * between two, and `recomputeUnderRules()` re-runs a household under another
 * year's law and returns the delta. The mechanism existed. What was missing
 * was the ability to ask a question the calendar has not answered yet.
 *
 * A year-to-year comparison only tells you about changes that already
 * happened. The question an advisor is actually asked is "what if the top rate
 * goes back to 39.6", or "what if the estate exclusion halves", and neither
 * has a published rule set to switch to. So this builds one: take a real rule
 * set, apply named edits, and get a synthetic rule set that flows through the
 * existing machinery unchanged.
 *
 * ## Why the synthetic set is labelled loudly
 *
 * A sandbox result is not a forecast and is not law. The version string of any
 * edited set begins with `sandbox:` and carries the edits in its source field,
 * so a figure computed under it cannot be mistaken later for one computed
 * under a real revenue procedure. Anything that flows downstream — a PDF, a
 * ledger entry, a saved scenario — carries that marker with it.
 */

import {
  TAX_RULE_VERSIONS,
  diffRuleSets,
  recomputeUnderRules,
  rulesForYear,
  type FilingKey,
  type Recompute,
  type TaxFacts,
  type TaxRuleSet,
} from './taxRules';

/** Marks a rule set that no legislature ever passed. */
export const SANDBOX_PREFIX = 'sandbox:';

export function isSandbox(rules: TaxRuleSet): boolean {
  return rules.version.startsWith(SANDBOX_PREFIX);
}

/**
 * The edits a reviewer can make. Deliberately a closed set rather than a free
 * path-and-value pair: an arbitrary deep-set into the rule tree can produce a
 * structurally valid set that is nonsense (negative brackets, a standard
 * deduction above the top bracket), and nothing downstream would catch it.
 */
export type SandboxEdit =
  | { readonly kind: 'topMarginalRate'; readonly to: number }
  | { readonly kind: 'standardDeduction'; readonly filing: FilingKey; readonly to: number }
  | { readonly kind: 'estateBasicExclusion'; readonly to: number }
  | { readonly kind: 'saltCap'; readonly to: number }
  | { readonly kind: 'niitRate'; readonly to: number }
  | { readonly kind: 'deferral401k'; readonly to: number };

export interface EditProblem {
  readonly edit: SandboxEdit;
  readonly detail: string;
}

/** Reject an edit that would produce a rule set nobody could legislate. */
export function validateEdit(edit: SandboxEdit): EditProblem | null {
  const bad = (detail: string): EditProblem => ({ edit, detail });
  switch (edit.kind) {
    case 'topMarginalRate':
      if (edit.to <= 0 || edit.to >= 1) return bad('A marginal rate is a fraction between 0 and 1, e.g. 0.396 for 39.6%.');
      return null;
    case 'niitRate':
      if (edit.to < 0 || edit.to >= 1) return bad('A rate is a fraction between 0 and 1.');
      return null;
    case 'standardDeduction':
    case 'estateBasicExclusion':
    case 'saltCap':
    case 'deferral401k':
      if (!Number.isFinite(edit.to) || edit.to < 0) return bad('Must be a non-negative amount.');
      return null;
  }
}

function applyOne(rules: TaxRuleSet, edit: SandboxEdit): TaxRuleSet {
  switch (edit.kind) {
    case 'topMarginalRate': {
      const brackets = Object.fromEntries(
        Object.entries(rules.brackets).map(([k, list]) => [
          k,
          list.map((b, i) => (i === list.length - 1 ? { ...b, rate: edit.to } : b)),
        ])
      ) as TaxRuleSet['brackets'];
      return { ...rules, brackets };
    }
    case 'standardDeduction':
      return { ...rules, standardDeduction: { ...rules.standardDeduction, [edit.filing]: edit.to } };
    case 'estateBasicExclusion':
      return { ...rules, estateBasicExclusion: edit.to };
    case 'saltCap':
      return { ...rules, salt: { ...rules.salt, cap: edit.to } };
    case 'niitRate':
      return { ...rules, niit: { ...rules.niit, rate: edit.to } };
    case 'deferral401k':
      return { ...rules, retirement: { ...rules.retirement, deferral401k: edit.to } };
  }
}

function describe(edit: SandboxEdit): string {
  switch (edit.kind) {
    case 'topMarginalRate': return `top marginal rate → ${(edit.to * 100).toFixed(1)}%`;
    case 'standardDeduction': return `${edit.filing} standard deduction → ${edit.to.toLocaleString()}`;
    case 'estateBasicExclusion': return `estate basic exclusion → ${edit.to.toLocaleString()}`;
    case 'saltCap': return `SALT cap → ${edit.to.toLocaleString()}`;
    case 'niitRate': return `NIIT rate → ${(edit.to * 100).toFixed(2)}%`;
    case 'deferral401k': return `401(k) deferral limit → ${edit.to.toLocaleString()}`;
  }
}

export interface SandboxBuild {
  readonly rules: TaxRuleSet;
  readonly applied: readonly SandboxEdit[];
  readonly rejected: readonly EditProblem[];
}

/**
 * Build a synthetic rule set. Invalid edits are rejected and reported rather
 * than silently dropped or clamped — a reviewer who typed 39.6 instead of
 * 0.396 needs to be told, not quietly given a 3,960% rate or a corrected one
 * they did not ask for.
 */
export function buildSandbox(base: TaxRuleSet, edits: readonly SandboxEdit[]): SandboxBuild {
  const rejected: EditProblem[] = [];
  const applied: SandboxEdit[] = [];
  let rules = base;

  for (const e of edits) {
    const problem = validateEdit(e);
    if (problem) { rejected.push(problem); continue; }
    rules = applyOne(rules, e);
    applied.push(e);
  }

  if (applied.length === 0) return { rules: base, applied, rejected };

  const label = applied.map(describe).join('; ');
  return {
    rules: {
      ...rules,
      version: `${SANDBOX_PREFIX}${base.version}`,
      source: `Hypothetical. Derived from ${base.source} with: ${label}. No legislature has enacted this.`,
    },
    applied,
    rejected,
  };
}

export interface SandboxRun {
  readonly build: SandboxBuild;
  readonly recompute: Recompute;
  /** Plain sentence for a reviewer's notes. */
  readonly headline: string;
}

/**
 * Run a household through a hypothetical. Reuses recomputeUnderRules() so the
 * sandbox and the real year-to-year comparison cannot disagree about how tax
 * is computed — only about which rules are in force.
 */
export function runSandbox(
  facts: TaxFacts,
  edits: readonly SandboxEdit[],
  baseYear?: number
): SandboxRun {
  const base = baseYear ? rulesForYear(baseYear) : TAX_RULE_VERSIONS[TAX_RULE_VERSIONS.length - 1]!;
  const build = buildSandbox(base, edits);
  const recompute = recomputeUnderRules(facts, base, build.rules);

  const d = recompute.federalTaxDelta;
  const headline =
    build.applied.length === 0
      ? 'No valid edits were applied, so nothing changed.'
      : d === 0
        ? 'Under this hypothetical, this household\'s federal tax is unchanged.'
        : `Under this hypothetical, this household's federal tax ${d > 0 ? 'rises' : 'falls'} by ${Math.abs(Math.round(d)).toLocaleString()}.`;

  return { build, recompute, headline };
}

/** What the edits changed, field by field, for display beside the result. */
export function sandboxChanges(build: SandboxBuild) {
  return diffRuleSets(
    build.applied.length ? { ...build.rules, version: build.rules.version.replace(SANDBOX_PREFIX, '') } : build.rules,
    build.rules
  );
}
