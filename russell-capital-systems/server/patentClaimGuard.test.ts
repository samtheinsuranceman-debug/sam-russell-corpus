/**
 * The guard that reads the source.
 *
 * shared/patentStatus.ts has exported FORBIDDEN_WHEN_UNFILED since it was
 * written, with a comment saying a test asserts no surface hardcodes "patent
 * pending". No such test existed. In the meantime PatentShowcase.tsx carried
 * eight "Patent Pending" badges and a filing date of 2024 for applications
 * drafted in April 2026, and the suite stayed green the whole time.
 *
 * So this reads every client page, component and shared data file and fails on
 * the phrases themselves. False marking under 35 U.S.C. § 292 is a live civil
 * exposure once a competitor is injured by it, and the cure — filing a
 * provisional — is a day's work. There is no version of this worth carrying.
 *
 * When a provisional is filed: add the record to APPLICATIONS in
 * patentStatus.ts. mayClaimPatentPending() flips, this test stops enforcing,
 * and the surfaces may use the words again.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, extname } from 'path';
import {
  FORBIDDEN_WHEN_UNFILED,
  FORBIDDEN_PATTERNS_WHEN_UNFILED,
  FILED_APPLICATION_NUMBERS,
  mayClaimPatentPending,
  techStatusLabel,
  techStatusLabelFor,
  patentClaimHits,
} from '../shared/patentStatus';

const root = resolve(__dirname, '..');

/**
 * Surfaces a visitor can read: the React app, the shared data it renders,
 * and live/, which builds the static homepage served before the app boots.
 * A guard that covers only the app leaves the page most visitors see first.
 */
const ROOTS = ['client/src', 'shared', 'live'];
const EXTS = new Set(['.ts', '.tsx', '.json', '.md', '.html']);
const EXEMPT = new Set([
  // The definition of the rule necessarily contains the words it forbids.
  'shared/patentStatus.ts',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = resolve(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTS.has(extname(name))) out.push(full);
  }
  return out;
}

const claimHits = patentClaimHits;

function offences(): string[] {
  const found: string[] = [];
  for (const r of ROOTS) {
    for (const file of walk(resolve(root, r))) {
      const rel = file.slice(root.length + 1);
      if (EXEMPT.has(rel)) continue;
      for (const hit of claimHits(readFileSync(file, 'utf-8'))) found.push(`${rel}: ${hit}`);
    }
  }
  return found.sort();
}

describe('no surface claims a filing that does not exist', () => {
  it('is enforcing, because nothing is on file', () => {
    expect(mayClaimPatentPending()).toBe(false);
  });

  it('finds no forbidden phrase in any client page, component or shared datum', () => {
    // A failure here names the file and the phrase. The fix is to say what is
    // true — "proprietary", "claims drafted", statusSentence() — not to add
    // the file to EXEMPT.
    expect(offences()).toEqual([]);
  });

  it('actually reads a meaningful number of files, so a green result means something', () => {
    // Guards that silently stop scanning are worse than no guard. If the
    // directory layout moves, this fails rather than passing vacuously.
    const scanned = ROOTS.flatMap((r) => walk(resolve(root, r)));
    expect(scanned.length).toBeGreaterThan(100);
  });

  it('would catch a violation if one were introduced', () => {
    // Proves the matcher works, without writing a bad file to disk.
    const sample = 'Our engines are Patent Pending and awaiting review.';
    expect(claimHits(sample).join(' ')).toContain('patent pending');
  });

  it('catches the two forms that shipped past the old matcher', () => {
    // Both were live on origin/master 279ca5f.
    expect(claimHits('<p className="rc-plaque-eyebrow">Technology {ref} <span aria-hidden="true">·</span> Pending <span aria-hidden="true">·</span> Only at RCS</p>').length).toBeGreaterThan(0);
    expect(claimHits('<div className="text-2xl">8 Patents</div>\n<div className="text-xs">Filed with USPTO</div>').length).toBeGreaterThan(0);
    expect(claimHits('Technology 07 · Pending · Only at RCS').length).toBeGreaterThan(0);
  });

  it('does not fire on honest negations or unrelated uses of "pending"', () => {
    expect(claimHits('No patent application is on file with the USPTO yet.')).toEqual([]);
    expect(claimHits('Your loan application is pending review.')).toEqual([]);
    expect(claimHits('Claims pending with the insurer are paid in order.')).toEqual([]);
  });

  it('keeps every forbidden phrase in lower case, so the list can never silently stop matching', () => {
    for (const phrase of FORBIDDEN_WHEN_UNFILED) expect(phrase, phrase).toBe(phrase.toLowerCase());
  });

  it('switches wording only from the filed-numbers list', () => {
    // The single switch: FILED_APPLICATION_NUMBERS, derived from APPLICATIONS in patentStatus.ts.
    expect(FILED_APPLICATION_NUMBERS).toEqual([]);
    expect(techStatusLabel('01')).toBe('Proprietary method');
  });

  it('marks only the technology an application names, and stops when a provisional lapses', () => {
    const prov = { ref: 'PAT-005', title: 't', applicationNumber: '63/000,001', filedOn: '2026-10-01', kind: 'provisional' as const, claimRef: '05' };
    const during = new Date('2027-03-01');
    expect(techStatusLabelFor('05', [prov], during)).toBe('Patent pending (Application No. 63/000,001)');
    // One filing never marks the others (35 U.S.C. § 292).
    expect(techStatusLabelFor('01', [prov], during)).toBe('Proprietary method');
    expect(techStatusLabelFor('105', [prov], during)).toBe('Proprietary method');
    // Unconverted provisional after 12 months: no longer pending.
    expect(techStatusLabelFor('05', [prov], new Date('2027-10-02'))).toBe('Proprietary method');
    expect(techStatusLabelFor('05', [{ ...prov, status: 'abandoned' as const }], during)).toBe('Proprietary method');
  });
});
