/**
 * The catalogue must describe code that exists.
 *
 * This is the test that keeps shared/patentCatalog.ts from becoming a
 * brochure. Every engine and page path is resolved against the filesystem; a
 * module that is renamed or deleted fails the build rather than leaving a
 * marketing site advertising a tool that 404s.
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { CLAIMS, builtClaims, claimByRef, claimCounts } from '../shared/patentCatalog';

const root = resolve(__dirname, '..');

describe('the 57 claims', () => {
  it('has exactly 57 entries', () => {
    expect(CLAIMS.length).toBe(57);
  });

  it('has 15 PAT and 42 SI, with no duplicate refs', () => {
    const pats = CLAIMS.filter((c) => c.ref.startsWith('PAT-'));
    const sis = CLAIMS.filter((c) => c.ref.startsWith('SI-'));
    expect(pats.length).toBe(15);
    expect(sis.length).toBe(42);
    expect(new Set(CLAIMS.map((c) => c.ref)).size).toBe(57);
  });

  it('every engine path named actually exists in this repo', () => {
    const missing = CLAIMS
      .filter((c) => c.engine)
      .filter((c) => !existsSync(resolve(root, c.engine!)))
      .map((c) => `${c.ref} -> ${c.engine}`);
    expect(missing).toEqual([]);
  });

  it('every page path named actually exists in this repo', () => {
    const missing = CLAIMS
      .filter((c) => c.page)
      .filter((c) => !existsSync(resolve(root, c.page!)))
      .map((c) => `${c.ref} -> ${c.page}`);
    expect(missing).toEqual([]);
  });

  it('a built claim points at something; it cannot be built and empty', () => {
    const hollow = builtClaims()
      .filter((c) => !c.engine && !c.page)
      .map((c) => c.ref);
    expect(hollow).toEqual([]);
  });

  it('a dropped or unbuilt claim explains itself rather than going quiet', () => {
    const silent = CLAIMS
      .filter((c) => c.status === 'dropped' || c.status === 'none')
      .filter((c) => !c.note || c.note.trim().length < 20)
      .map((c) => c.ref);
    expect(silent).toEqual([]);
  });

  it('a partial claim says what is missing, not just that it is partial', () => {
    const vague = CLAIMS
      .filter((c) => c.status === 'partial')
      .filter((c) => !c.note)
      .map((c) => c.ref);
    expect(vague).toEqual([]);
  });

  it('reports counts that add to 57', () => {
    const n = claimCounts();
    expect(n.built + n.partial + n.dropped + n.none).toBe(57);
    // Sanity: the majority should be built, or the mapping work is not done.
    expect(n.built).toBeGreaterThan(28);
  });

  it('finds a claim by ref, case-insensitively', () => {
    expect(claimByRef('pat-010')?.title).toContain('Time Machine');
    expect(claimByRef('SI-028')?.engine).toBe('shared/forgiveness.ts');
    expect(claimByRef('PAT-999')).toBeUndefined();
  });

  it('SI-001 is built as a validator, not as the version that was dropped', () => {
    const si1 = claimByRef('SI-001')!;
    expect(si1.status).toBe('built');
    expect(si1.engine).toBe('shared/ag49Validator.ts');
    // The record must say why it changed shape, so nobody reinstates the old aim.
    expect(si1.note).toContain('maximize persuasive impact');
    expect(si1.note).toContain('validator');
  });

  it('the four revived claims each say what remains, rather than being quietly promoted', () => {
    for (const ref of ['SI-021', 'SI-023', 'SI-026']) {
      const c = claimByRef(ref)!;
      expect(c.status).toBe('partial');
      expect((c.note ?? '').length).toBeGreaterThan(60);
    }
  });
});
