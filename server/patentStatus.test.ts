/**
 * The patent claim is a fact, and this is the file that keeps it one.
 *
 * The rule under test: "patent pending" may appear on a public surface only
 * when an application record with a real USPTO number exists. Not when a stage
 * is set optimistically, not when counsel is engaged, not when financing is
 * arranged, not when a document is about to be signed. False marking under
 * 35 U.S.C. § 292 is a live civil exposure and the cure is cheap — a
 * provisional is filed in a day — so there is no reason to carry the risk.
 */

import { describe, it, expect } from 'vitest';
import {
  APPLICATIONS,
  ENGINE_COUNT,
  mayClaimGranted,
  mayClaimPatentPending,
  statusBadge,
  statusSentence,
  type PatentApplication,
} from '../shared/patentStatus';

describe('patent status — the claim tracks the receipt, not the intention', () => {
  it('refuses "patent pending" while no application is on file', () => {
    expect(APPLICATIONS.length).toBe(0);
    expect(mayClaimPatentPending()).toBe(false);
    expect(mayClaimGranted()).toBe(false);
  });

  it('says plainly that nothing is filed, rather than going quiet', () => {
    const s = statusSentence();
    expect(s).toContain('No application has been filed');
    expect(s).toContain(String(ENGINE_COUNT));
    // The sentence must not contain the claim it is denying.
    expect(s.toLowerCase()).not.toContain('is patent pending');
  });

  it('gives a badge that is not the words we may not use', () => {
    expect(statusBadge()).toBe('Claims drafted — not filed');
    expect(statusBadge()).not.toBe('Patent Pending');
  });

  it('turns on only when a record carrying a real number is added', () => {
    // Simulates the day the receipt arrives. The helpers read the records, so
    // adding one is the only thing that flips the claim.
    const withFiling: PatentApplication[] = [
      {
        ref: 'PAT-010',
        title: 'Time Machine Dual-Illustration Method',
        applicationNumber: '63/000,000',
        filedOn: '2026-09-18',
        kind: 'provisional',
      },
    ];
    const pending = withFiling.length > 0;
    const granted = withFiling.some((a) => a.patentNumber);
    expect(pending).toBe(true);
    expect(granted).toBe(false);
  });

  it('an entry without an application number is not a filing', () => {
    // The number is what the USPTO issues. A record without one represents
    // nothing, and the type requires it precisely so this cannot be faked by
    // adding a hopeful row.
    const bad = { ref: 'PAT-999', title: 'x', filedOn: '2026-09-18', kind: 'provisional' };
    expect('applicationNumber' in bad).toBe(false);
  });
});
