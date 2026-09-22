/**
 * The catalogue must describe code that exists.
 *
 * This is the test that keeps shared/patentCatalog.ts from becoming a
 * brochure. Every engine and page path is resolved against the filesystem; a
 * module that is renamed or deleted fails the build rather than leaving a
 * marketing site advertising a tool that 404s.
 *
 * That check runs one way. It asks whether every engine the catalogue NAMES
 * exists, and it never asked the converse — whether an engine that exists is
 * named. Thirty-five modules in shared/ declare a claim number in their own
 * header; the catalogue cited none of them, and four rows carried notes saying
 * work does not exist while the file doing that work sat in the same directory.
 * Every assertion below the fold passed throughout, because none of them looked
 * in that direction. The final describe block closes it: an engine that declares
 * a claim is either cited by a row or recorded in engineClaimRegistry.ts with
 * the reason it is not, and silence fails.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { ENGINE_REGISTRY } from '../shared/engineClaimRegistry';
import {
  CLAIMS,
  builtClaims,
  claimByRef,
  claimCounts,
  draftedButUnbuilt,
  missingApplicationDraft,
  withApplicationDraft,
} from '../shared/patentCatalog';
import { mayClaimPatentPending } from '../shared/patentStatus';
import {
  APPLICATION_REVIEW_DOC,
  HARDWARE_DISCREPANCIES,
  PORTFOLIO_DEFECTS,
  refsWithDiscrepancy,
} from './patentReview';

const root = resolve(__dirname, '..');

describe('the 68 claims', () => {
  it('has exactly 68 entries', () => {
    expect(CLAIMS.length).toBe(68);
  });

  it('has 15 PAT and 53 SI, with no duplicate refs', () => {
    const pats = CLAIMS.filter((c) => c.ref.startsWith('PAT-'));
    const sis = CLAIMS.filter((c) => c.ref.startsWith('SI-'));
    expect(pats.length).toBe(15);
    expect(sis.length).toBe(53);
    expect(new Set(CLAIMS.map((c) => c.ref)).size).toBe(68);
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

  it('reports counts that add to 68', () => {
    const n = claimCounts();
    expect(n.built + n.partial + n.dropped + n.none).toBe(68);
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

  it('the drafted set is still exactly the 57 from the sheet', () => {
    // This assertion used to read: all 57 have a draft, and
    // missingApplicationDraft() is empty. That was true, and it stopped being
    // true when eleven engines that implement inventions the sheet never listed
    // were given rows. Weakening it to a smaller number would have thrown away
    // the fact worth keeping, so it is split instead: the drafted set is
    // unchanged, and the queue is now non-empty and has a known size.
    expect(withApplicationDraft().length).toBe(57);
  });

  it('the filing queue is exactly the eleven built-but-unclaimed engines', () => {
    const queue = missingApplicationDraft();
    expect(queue.length).toBe(11);
    // Every one of them is a row added from the engine side, so every one must
    // name an engine. A queued claim with no spec AND no code would be an idea,
    // and an idea does not belong on this sheet at all.
    for (const c of queue) {
      expect(c.engine, `${c.ref} is queued for drafting but names no engine`).toBeTruthy();
      expect(existsSync(resolve(root, c.engine!)), c.engine!).toBe(true);
      expect(c.status, `${c.ref} cannot be built while unsourced`).toBe('partial');
      expect((c.note ?? '').length, `${c.ref} must say what it is`).toBeGreaterThan(80);
    }
    // And they are the tail of the sheet, SI-043 onward — so the original 57
    // keep their numbers and nothing was renumbered to make room.
    for (const c of queue) {
      expect(Number(c.ref.slice(3))).toBeGreaterThanOrEqual(43);
    }
  });

  it('each draft is filed under its own ref, so no two claims share a document', () => {
    for (const c of withApplicationDraft()) {
      expect(c.applicationDraft!).toContain(`/${c.ref}_`);
    }
    expect(new Set(withApplicationDraft().map((c) => c.applicationDraft)).size).toBe(57);
  });

  it('a complete set of drafts is still not a single filing', () => {
    // The 57 from the sheet all have specifications. That changes nothing about
    // what may be said publicly: patentStatus.ts reads receipts, and there are
    // none. This is the assertion that stops "57 applications" from becoming
    // "57 patents pending" somewhere downstream — and it now also stops "68
    // claims" from becoming "68 applications", which is the newer and easier
    // mistake to make: eleven of the sixty-eight have no specification at all.
    expect(withApplicationDraft().length).toBe(57);
    expect(withApplicationDraft().length).toBeLessThan(CLAIMS.length);
    expect(mayClaimPatentPending()).toBe(false);
  });

  it('the portfolio-wide defects are recorded, not left to memory', () => {
    expect(PORTFOLIO_DEFECTS.length).toBeGreaterThanOrEqual(5);
    const all = PORTFOLIO_DEFECTS.join(' ');
    for (const marker of ['Field-Programmable Gate Array', 'five diagrams', 'Enhanced Score', 'copyright symbol', 'filed by']) {
      expect(all).toContain(marker);
    }
    // Every one is a statement about all 57, so each must say so.
    for (const d of PORTFOLIO_DEFECTS) expect(d).toContain('All 57');
  });

  it('keeps the review off the client, where a role check would not hold it', () => {
    // shared/patentCatalog.ts is bundled into the browser by PatentShowcase.
    // If a finding ever lands back in it, it ships to every signed-in visitor
    // including guests, and hiding it in the component changes nothing.
    const shared = readFileSync(resolve(root, 'shared/patentCatalog.ts'), 'utf-8');
    for (const marker of ['FPGA', 'Field-Programmable', 'Enhanced Score', 'biometric']) {
      expect(shared, marker).not.toContain(marker);
    }
    for (const c of CLAIMS) {
      expect(c.note ?? '', c.ref).not.toMatch(/FPGA|Field-Programmable/i);
    }
  });

  it('names the four claims whose drafts recite mechanisms that do not exist', () => {
    expect(refsWithDiscrepancy()).toEqual(['PAT-001', 'PAT-002', 'PAT-003', 'PAT-004']);
    for (const ref of refsWithDiscrepancy()) {
      // Each must point at the real module, so the discrepancy is checkable
      // rather than an assertion about a system nobody can find.
      const claim = claimByRef(ref)!;
      const text = HARDWARE_DISCREPANCIES[ref]!;
      expect(text.length).toBeGreaterThan(60);
      const engineFile = claim.engine!.split('/').pop()!;
      expect(text, ref).toContain(engineFile);
    }
  });

  it('the pre-filing review exists and names the defects it found', () => {
    const path = resolve(root, APPLICATION_REVIEW_DOC);
    expect(existsSync(path)).toBe(true);
    const text = readFileSync(path, 'utf-8');
    for (const marker of ['FPGA', '1.83', 'Enhanced Score', 'filed by', '1.56', '35 U.S.C.']) {
      expect(text).toContain(marker);
    }
  });

  it('every revived claim records why it changed shape', () => {
    for (const ref of ['SI-001', 'SI-021', 'SI-023', 'SI-026']) {
      expect((claimByRef(ref)!.note ?? '').length).toBeGreaterThan(60);
    }
  });
});

/**
 * The converse direction. Everything above asks whether what the catalogue
 * names exists; nothing above asks whether what exists is named.
 */
describe('no engine declares a claim and goes unaccounted for', () => {
  /** Every shared module that names a claim number in its own header. */
  const declaring = readdirSync(resolve(root, 'shared'))
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => {
      const header = readFileSync(resolve(root, 'shared', f), 'utf-8').slice(0, 4000);
      const m = /SISTER INVENTION ((?:SI|PAT)-\d{3})/.exec(header);
      return m ? { file: `shared/${f}`, declares: m[1] } : null;
    })
    .filter((x): x is { file: string; declares: string } => x !== null);

  const citedByCatalog = new Set(CLAIMS.map((c) => c.engine).filter(Boolean) as string[]);
  const inRegistry = new Set(ENGINE_REGISTRY.map((e) => e.file));

  it('finds the declaring engines at all, so an empty scan cannot pass vacuously', () => {
    expect(declaring.length).toBeGreaterThanOrEqual(30);
  });

  it('accounts for every declaring engine — cited by a row, or registered with a reason', () => {
    const unaccounted = declaring
      .filter((e) => !citedByCatalog.has(e.file) && !inRegistry.has(e.file))
      .map((e) => `${e.file} (declares ${e.declares}) — cite it in patentCatalog.ts or add it to ENGINE_REGISTRY`);
    expect(unaccounted).toEqual([]);
  });

  it('registers nothing that is already cited, so the two lists cannot both own a module', () => {
    const both = ENGINE_REGISTRY.filter((e) => citedByCatalog.has(e.file)).map((e) => e.file);
    expect(both).toEqual([]);
  });

  it('every registered path resolves, on the same terms the catalogue is held to', () => {
    const missing = ENGINE_REGISTRY.filter((e) => !existsSync(resolve(root, e.file))).map((e) => e.file);
    expect(missing).toEqual([]);
  });

  it('every registry entry says why, not just that', () => {
    const thin = ENGINE_REGISTRY.filter((e) => e.note.length < 80).map((e) => e.file);
    expect(thin).toEqual([]);
  });

  it('a second implementation names the module the row points at instead', () => {
    const vague = ENGINE_REGISTRY.filter(
      (e) => e.disposition === 'second-implementation' && !e.rowNames
    ).map((e) => e.file);
    expect(vague).toEqual([]);
    for (const e of ENGINE_REGISTRY) {
      if (e.rowNames) expect(existsSync(resolve(root, e.rowNames)), e.rowNames).toBe(true);
    }
  });

  it('a registered engine declares the number the registry says it declares', () => {
    const lying = ENGINE_REGISTRY.filter((e) => {
      const header = readFileSync(resolve(root, e.file), 'utf-8').slice(0, 4000);
      return !header.includes(`SISTER INVENTION ${e.declares}`);
    }).map((e) => `${e.file} does not declare ${e.declares}`);
    expect(lying).toEqual([]);
  });

  it('an unfinished row that names an engine accounts for that engine in its note', () => {
    // The specific failure this block exists to catch: a note written before the
    // engine landed and left in place after it did, so the row simultaneously
    // cites a module and denies the work is done.
    //
    // The first attempt at this test scanned the note for "does not" and failed
    // SI-042, whose note is correct — estateTaxEngine.ts really has no GRAT,
    // IDGT or § 7520 anywhere, so the freeze-technique selector really is
    // missing. That is the lesson: a partial note MUST say what is absent, so
    // matching on absence-language can only ever produce false positives.
    //
    // What is checkable is narrower and actually true. If a row is unfinished
    // and names an engine, the note has to engage with that engine — name the
    // file, or say in words that it exists. A note that cites a module and then
    // describes the territory as empty without mentioning it is the stale case,
    // and it cannot satisfy this.
    const unreconciled = CLAIMS.filter((c) => c.engine && c.status !== 'built')
      .filter((c) => {
        const note = c.note ?? '';
        const basename = c.engine!.split('/').pop()!.replace(/\.ts$/, '');
        const namesTheModule = note.includes(basename);
        const assertsItExists = /\bexists?\b|\bit does\b|was located|was recorded as|remains the/i.test(note);
        return !(namesTheModule || assertsItExists);
      })
      .map((c) => `${c.ref} is ${c.status} and names ${c.engine}, but its note never accounts for that module`);
    expect(unreconciled).toEqual([]);
  });
});
