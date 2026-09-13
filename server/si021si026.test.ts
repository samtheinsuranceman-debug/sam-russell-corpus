/**
 * SI-021 and SI-026 — the two claims promoted from "dropped" to real code.
 *
 * The assertions worth having here are the refusals: a shock window outside
 * the series we hold must say so rather than return an empty table, and a
 * nonsense rule edit must be rejected rather than clamped into something the
 * reviewer did not ask for.
 */

import { describe, it, expect } from 'vitest';
import {
  SHOCKS,
  coverage,
  creditFor,
  isAvailable,
  runAllShocks,
  runShock,
  type PolicyTerms,
} from '../shared/historicalShocks';
import {
  SANDBOX_PREFIX,
  buildSandbox,
  isSandbox,
  runSandbox,
  validateEdit,
} from '../shared/regulatorySandbox';
import { TAX_RULES_2026, type TaxFacts } from '../shared/taxRules';

const TERMS: PolicyTerms = { cap: 9.5, floor: 0, participation: 100 };

// ── SI-021 ────────────────────────────────────────────────────────────────
describe('SI-021 — named shocks against the policy floor and cap', () => {
  it('applies participation, then the cap, then the floor', () => {
    // 20% at 50% participation is 10%, capped to 9.5.
    expect(creditFor(20, { cap: 9.5, floor: 0, participation: 50 })).toBe(9.5);
    // Capping before participation would wrongly give 4.75 here.
    expect(creditFor(12, { cap: 9.5, floor: 0, participation: 50 })).toBe(6);
    // A loss is floored, not participated into a smaller loss.
    expect(creditFor(-38, TERMS)).toBe(0);
  });

  it('holds the floor through 2008 and reports what it saved', () => {
    const r = runShock(SHOCKS.find((s) => s.id === 'gfc-2008')!, TERMS);
    expect(isAvailable(r)).toBe(true);
    if (!isAvailable(r)) return;
    expect(r.years).toHaveLength(1);
    expect(r.years[0]!.indexChange).toBeLessThan(0);
    expect(r.years[0]!.creditedRate).toBe(0);
    expect(r.years[0]!.floorHeld).toBe(true);
    // The whole point of the exhibit: the floor absorbed the fall.
    expect(r.protectedBy).toBeGreaterThan(0);
  });

  it('runs a multi-year window and compounds it', () => {
    const r = runShock(SHOCKS.find((s) => s.id === 'dotcom-2000')!, TERMS);
    expect(isAvailable(r)).toBe(true);
    if (!isAvailable(r)) return;
    expect(r.years).toHaveLength(3);
    // Three consecutive losing years, so the index compound is deeply
    // negative and the credited compound is flat at the floor.
    expect(r.indexCumulative).toBeLessThan(-20);
    expect(r.creditedCumulative).toBe(0);
  });

  it('refuses a window the held series does not cover, and says why', () => {
    const r = runShock(SHOCKS.find((s) => s.id === 'oil-1973')!, TERMS);
    expect(isAvailable(r)).toBe(false);
    if (isAvailable(r)) return;
    expect(r.reason).toContain('1973');
    expect(r.reason).toContain('from memory');
  });

  it('reports the coverage of the series rather than assuming it', () => {
    const c = coverage('SP500')!;
    expect(c.from).toBeLessThanOrEqual(1994);
    expect(c.to).toBeGreaterThanOrEqual(2022);
    expect(coverage('NOT_REAL')).toBeNull();
  });

  it('returns every shock, available or not, so none is silently omitted', () => {
    const all = runAllShocks(TERMS);
    expect(all).toHaveLength(SHOCKS.length);
    expect(all.filter(isAvailable).length).toBeGreaterThanOrEqual(4);
    expect(all.filter((r) => !isAvailable(r)).length).toBeGreaterThanOrEqual(1);
  });
});

// ── SI-026 ────────────────────────────────────────────────────────────────
const FACTS: TaxFacts = { filing: 'joint', agi: 400_000, saltPaid: 20_000, age: 55 };

describe('SI-026 — the regulatory sandbox', () => {
  it('marks a synthetic rule set so it cannot be mistaken for law', () => {
    const b = buildSandbox(TAX_RULES_2026, [{ kind: 'topMarginalRate', to: 0.396 }]);
    expect(b.rules.version.startsWith(SANDBOX_PREFIX)).toBe(true);
    expect(isSandbox(b.rules)).toBe(true);
    expect(b.rules.source).toContain('No legislature has enacted this');
    expect(b.rules.source).toContain('39.6%');
    expect(isSandbox(TAX_RULES_2026)).toBe(false);
  });

  it('raises the top rate and the tax follows — for a household that reaches it', () => {
    // The top joint bracket begins north of $750k, so this has to be a
    // household actually in it. The first version of this test used the
    // $400k household below and asserted a rise; the engine correctly
    // returned zero, because changing the top rate does nothing to income
    // that never reaches the top bracket. The engine was right.
    const topBracketHousehold: TaxFacts = { filing: 'joint', agi: 1_200_000, saltPaid: 20_000, age: 55 };
    const run = runSandbox(topBracketHousehold, [{ kind: 'topMarginalRate', to: 0.45 }]);
    expect(run.build.applied).toHaveLength(1);
    expect(run.build.rejected).toHaveLength(0);
    expect(run.recompute.federalTaxDelta).toBeGreaterThan(0);
    expect(run.headline).toContain('rises');
  });

  it('leaves a household below the top bracket untouched by a top-rate change', () => {
    // The other half of the same fact, pinned so nobody "fixes" it later.
    const run = runSandbox(FACTS, [{ kind: 'topMarginalRate', to: 0.45 }]);
    expect(run.build.applied).toHaveLength(1);
    expect(run.recompute.federalTaxDelta).toBe(0);
    expect(run.headline).toContain('unchanged');
  });

  it('a bigger standard deduction lowers the tax', () => {
    const run = runSandbox(FACTS, [{ kind: 'standardDeduction', filing: 'joint', to: 60_000 }]);
    expect(run.recompute.federalTaxDelta).toBeLessThanOrEqual(0);
  });

  it('rejects the classic slip — 39.6 typed where 0.396 was meant', () => {
    const p = validateEdit({ kind: 'topMarginalRate', to: 39.6 });
    expect(p).not.toBeNull();
    expect(p!.detail).toContain('0.396');
    // And it is reported, not clamped to something the reviewer did not ask for.
    const b = buildSandbox(TAX_RULES_2026, [{ kind: 'topMarginalRate', to: 39.6 }]);
    expect(b.applied).toHaveLength(0);
    expect(b.rejected).toHaveLength(1);
    expect(isSandbox(b.rules)).toBe(false);
  });

  it('rejects a negative amount', () => {
    expect(validateEdit({ kind: 'estateBasicExclusion', to: -1 })).not.toBeNull();
  });

  it('applies several edits together and names them all', () => {
    const b = buildSandbox(TAX_RULES_2026, [
      { kind: 'topMarginalRate', to: 0.42 },
      { kind: 'saltCap', to: 5_000 },
      { kind: 'niitRate', to: 0.05 },
    ]);
    expect(b.applied).toHaveLength(3);
    expect(b.rules.source).toContain('SALT cap');
    expect(b.rules.source).toContain('NIIT rate');
  });

  it('with no valid edits, nothing is changed and nothing is marked', () => {
    const run = runSandbox(FACTS, [{ kind: 'niitRate', to: 5 }]);
    expect(run.build.applied).toHaveLength(0);
    expect(run.build.rejected).toHaveLength(1);
    expect(isSandbox(run.build.rules)).toBe(false);
    expect(run.headline).toContain('No valid edits');
  });
});
