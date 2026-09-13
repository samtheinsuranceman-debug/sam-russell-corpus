/**
 * The catalogue must describe code that exists.
 *
 * This is the test that keeps shared/patentCatalog.ts from becoming a
 * brochure. Every engine and page path is resolved against the filesystem; a
 * module that is renamed or deleted fails the build rather than leaving a
 * marketing site advertising a tool that 404s.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import {
  APPLICATION_REVIEW_DOC,
  CLAIMS,
  PORTFOLIO_DEFECTS,
  builtClaims,
  claimByRef,
  claimCounts,
  draftedButUnbuilt,
  missingApplicationDraft,
  withApplicationDraft,
} from '../shared/patentCatalog';
import { mayClaimPatentPending } from '../shared/patentStatus';

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

  it('SI-021 and SI-026 are built on their own engines, not borrowed ones', () => {
    expect(claimByRef('SI-021')!.status).toBe('built');
    expect(claimByRef('SI-021')!.engine).toBe('shared/historicalShocks.ts');
    expect(claimByRef('SI-026')!.status).toBe('built');
    expect(claimByRef('SI-026')!.engine).toBe('shared/regulatorySandbox.ts');
  });

  it('SI-023 stays unbuilt, and says it is blocked on data rather than code', () => {
    const c = claimByRef('SI-023')!;
    expect(c.status).toBe('partial');
    expect(c.note).toContain('Blocked on data');
  });

  it('every application draft named actually exists on disk', () => {
    const missing = withApplicationDraft()
      .filter((c) => !existsSync(resolve(root, c.applicationDraft!)))
      .map((c) => `${c.ref} -> ${c.applicationDraft}`);
    expect(missing).toEqual([]);
  });

  it('all 57 now have a drafted application, and none is left behind', () => {
    expect(withApplicationDraft().length).toBe(57);
    expect(missingApplicationDraft()).toEqual([]);
  });

  it('each draft is filed under its own ref, so no two claims share a document', () => {
    for (const c of CLAIMS) {
      expect(c.applicationDraft!).toContain(`/${c.ref}_`);
    }
    expect(new Set(CLAIMS.map((c) => c.applicationDraft)).size).toBe(57);
  });

  it('a complete set of drafts is still not a single filing', () => {
    // The whole portfolio now has specifications. That changes nothing about
    // what may be said publicly: patentStatus.ts reads receipts, and there are
    // none. This is the assertion that stops "57 applications" from becoming
    // "57 patents pending" somewhere downstream.
    expect(withApplicationDraft().length).toBe(CLAIMS.length);
    expect(mayClaimPatentPending()).toBe(false);
  });

  it('the portfolio-wide defects are recorded, not left to memory', () => {
    expect(PORTFOLIO_DEFECTS.length).toBeGreaterThanOrEqual(5);
    const all = PORTFOLIO_DEFECTS.join(' ');
    for (const marker of ['Field-Programmable Gate Array', 'five diagrams', 'Enhanced Score', 'copyright symbol', 'filed by']) {
      expect(all).toContain(marker);
    }
    // Every one of them is a statement about all 57, so each must say so.
    for (const d of PORTFOLIO_DEFECTS) expect(d).toContain('All 57');
  });

  it('the pre-filing review exists and names the defects it found', () => {
    const path = resolve(root, APPLICATION_REVIEW_DOC);
    expect(existsSync(path)).toBe(true);
    const text = readFileSync(path, 'utf-8');
    for (const marker of ['FPGA', '1.83', 'Enhanced Score', 'filed by', '1.56', '35 U.S.C.']) {
      expect(text).toContain(marker);
    }
  });

  it('the four claims whose drafts name absent hardware say which hardware', () => {
    const specifics: Record<string, string> = {
      'PAT-001': 'FPGA',
      'PAT-002': 'lender feed',
      'PAT-003': 'biometric',
      'PAT-004': 'fixed weights',
    };
    for (const [ref, marker] of Object.entries(specifics)) {
      expect(claimByRef(ref)!.note ?? '').toContain(marker);
    }
  });

  it('every revived claim records why it changed shape', () => {
    for (const ref of ['SI-001', 'SI-021', 'SI-023', 'SI-026']) {
      expect((claimByRef(ref)!.note ?? '').length).toBeGreaterThan(60);
    }
  });
});
