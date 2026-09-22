/**
 * The tiering is only worth anything if it is enforced. A contractual item that
 * quietly carries an assumption, or a projected one with none stated, puts the
 * whole separation back where it started.
 */

import { describe, it, expect } from 'vitest';
import {
  MN_BGA3_EVIDENCE,
  TIERS_VERSION,
  TIER_RULES,
  byTier,
  contractualOnly,
  incompleteItems,
  leadLine,
} from '../shared/illustrationEvidenceTiers';

describe('evidence tiers', () => {
  it('has no incomplete item: every published figure dated, every projection assumed', () => {
    expect(incompleteItems()).toEqual([]);
  });

  it('keeps assumptions and as-of dates off contractual items entirely', () => {
    // The discipline that makes tier one worth leading with: if a figure needs
    // a date or an assumption, it is not a policy term and belongs elsewhere.
    for (const item of byTier('contractual')) {
      expect(item.asOf, item.label).toBeUndefined();
      expect(item.assumption, item.label).toBeUndefined();
      expect(item.source.length, item.label).toBeGreaterThan(8);
    }
  });

  it('puts the death benefit and the floor in tier one, where they need no assumption', () => {
    const labels = contractualOnly().map((i) => i.label);
    expect(labels).toContain('Death benefit in force');
    expect(labels).toContain('Floor on every indexed account');
    expect(contractualOnly().length).toBeGreaterThanOrEqual(5);
  });

  it('keeps the current cap and participation rate OUT of tier one', () => {
    // The trap. They are printed on the illustration and feel guaranteed, but a
    // carrier can re-rate them, and a re-rated cap moves every projected figure
    // underneath it.
    const params = MN_BGA3_EVIDENCE.find((i) => i.label === 'Indexed Account A parameters')!;
    expect(params.tier).toBe('published');
    expect(params.asOf).toBeTruthy();
    expect(params.note).toMatch(/floor is contractual/i);
  });

  it('splits the variable loan correctly: the cap on the charge is a term, the charge is not', () => {
    const fixed = MN_BGA3_EVIDENCE.find((i) => i.label === 'Fixed loan charge')!;
    const variable = MN_BGA3_EVIDENCE.find((i) => i.label === 'Variable loan charge, current')!;
    expect(fixed.tier).toBe('contractual');
    expect(variable.tier).toBe('published');
    expect(variable.note).toMatch(/cap on the charge is contractual/i);
  });

  it('treats the carrier historical range as published, not projected', () => {
    const range = MN_BGA3_EVIDENCE.find((i) => i.label.includes('25-year rolling range'))!;
    expect(range.tier).toBe('published');
    expect(range.value).toContain('4.16%');
    expect(range.value).toContain('8.21%');
    // It is history the carrier printed, so it needs a date but not an assumption.
    expect(range.asOf).toBeTruthy();
    expect(range.assumption).toBeUndefined();
  });

  it('puts every ledger figure in tier three, including the bold ones', () => {
    const projected = byTier('projected');
    expect(projected.length).toBeGreaterThanOrEqual(3);
    for (const p of projected) expect(p.assumption!.length).toBeGreaterThan(20);
    expect(projected.map((p) => p.label)).toContain('Cash value at any future year');
  });

  it('names both stacked assumptions on the net-position row rather than one', () => {
    const net = MN_BGA3_EVIDENCE.find((i) => i.label === 'Net position after loans')!;
    expect(net.assumption).toMatch(/AND/);
    expect(net.note).toMatch(/cannot be counted in both/i);
  });

  it('only tier one may be stated flatly', () => {
    expect(TIER_RULES.contractual.mayStateFlatly).toBe(true);
    expect(TIER_RULES.published.mayStateFlatly).toBe(false);
    expect(TIER_RULES.projected.mayStateFlatly).toBe(false);
    expect(TIER_RULES.published.requires.join(' ')).toMatch(/date/);
    expect(TIER_RULES.projected.requires.join(' ')).toMatch(/not guaranteed/);
  });

  it('leads with the contractual count, not a rate', () => {
    const line = leadLine();
    expect(line).toMatch(/^\d+ figures? here (is|are) contractual/);
    expect(line).toMatch(/require no assumption/);
    // A rate in the lead line would defeat the purpose.
    expect(line).not.toMatch(/\d+\.\d+%/);
  });

  it('forbids a lapse warning on a policy carrying overloan protection', () => {
    // Recorded because that warning was written into a client letter and was
    // wrong: the agreement exists to remove that outcome, and understating a
    // contractual protection the client is paying for is its own inaccuracy.
    expect(TIERS_VERSION.neverPrinted.join(' ')).toMatch(/Overloan Protection/);
    const overloan = MN_BGA3_EVIDENCE.find((i) => i.label === 'Overloan Protection Agreement')!;
    expect(overloan.tier).toBe('contractual');
    expect(overloan.value).toMatch(/No charge until exercised/i);
  });

  it('forbids counting the same dollar as growth and as spendable', () => {
    expect(TIERS_VERSION.neverPrinted.join(' ')).toMatch(/counted as two separate gains/);
  });

  it('works on a supplied list, not only the built-in one', () => {
    const mine = [
      { tier: 'projected' as const, label: 'X', value: '1', source: 'ledger' },
      { tier: 'published' as const, label: 'Y', value: '2', source: 'carrier page' },
    ];
    const bad = incompleteItems(mine);
    expect(bad).toContain('X: projected with no stated assumption');
    expect(bad).toContain('Y: published with no as-of date');
  });
});
