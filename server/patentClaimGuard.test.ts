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
import { FORBIDDEN_WHEN_UNFILED, mayClaimPatentPending } from '../shared/patentStatus';

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

function offences(): string[] {
  const found: string[] = [];
  for (const r of ROOTS) {
    for (const file of walk(resolve(root, r))) {
      const rel = file.slice(root.length + 1);
      if (EXEMPT.has(rel)) continue;
      const text = readFileSync(file, 'utf-8').toLowerCase();
      for (const phrase of FORBIDDEN_WHEN_UNFILED) {
        if (text.includes(phrase)) found.push(`${rel}: "${phrase}"`);
      }
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
    const hit = FORBIDDEN_WHEN_UNFILED.filter((p) => sample.toLowerCase().includes(p));
    expect(hit).toContain('patent pending');
  });
});
