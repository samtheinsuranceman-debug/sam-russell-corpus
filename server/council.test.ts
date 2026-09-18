import { describe, it, expect } from 'vitest';
import {
  detectModality, styleMessage, applyTechnique, PREDICATES, NLP_RULES, MIN_PREDICATES,
} from '@shared/council/nlpEngine';
import {
  COUNCIL, routeUtterance, classifyIntent, convene, recordOutcome, emptyMemory,
  explain, parseVoiceCommand, UnsourcedFindingError, COUNCIL_RULES, type Finding,
} from '@shared/council/aiCouncil';
import {
  gradeEvidence, buildBriefing, findContradictions, assertNotAdvice, validateRecord,
  MedicalAdviceError, UncitedEvidenceError, DESIGN_RANK, HEALTH_RULES,
  type EvidenceRecord,
} from '@shared/health/evidenceRetrieval';

describe('NLP — detection refuses to overclaim', () => {
  it('returns unknown below the predicate floor', () => {
    const r = detectModality('I see it.');
    expect(r.primary).toBe('unknown');
    expect(r.plain).toMatch(new RegExp(`${MIN_PREDICATES} are needed`));
  });

  it('returns unknown when two channels are within the noise margin', () => {
    const r = detectModality('I see and hear and look and listen and view and sound');
    expect(r.primary).toBe('unknown');
    expect(r.plain).toMatch(/No clear leader/);
  });

  it('detects a clear visual lean', () => {
    const r = detectModality(
      'I see what you show me and the picture looks clear. I can visualise the outlook, ' +
      'the perspective appears bright and I can imagine how it looks.',
    );
    expect(r.primary).toBe('visual');
    expect(r.confidence).toBeGreaterThan(0);
  });

  it('detects the digital channel most professionals actually use', () => {
    const r = detectModality(
      'I need to understand the logic and evaluate the criteria. The framework should ' +
      'determine the parameters so I can analyse the data and decide by a rational method.',
    );
    expect(r.primary).toBe('digital');
  });

  it('never reports confidence above 0.75 — it is a style signal, not a diagnosis', () => {
    const heavy = Array(60).fill('see look picture clear bright vivid').join(' ');
    expect(detectModality(heavy).confidence).toBeLessThanOrEqual(0.75);
  });

  it('keeps the four predicate banks disjoint', () => {
    const seen = new Set<string>();
    for (const words of Object.values(PREDICATES)) {
      for (const w of words) {
        expect(seen.has(w)).toBe(false);
        seen.add(w);
      }
    }
  });
});

describe('NLP — styling and techniques', () => {
  it('leaves the message plain when the channel is unknown', () => {
    const r = styleMessage('The charge is 1.5%.', detectModality('hi'));
    expect(r.text).toBe('The charge is 1.5%.');
    expect(r.note).toMatch(/Plain language is the default/);
  });

  it('casts the message in the detected channel', () => {
    const reading = detectModality(
      'I see what you show me and the picture looks clear. I can visualise the outlook, ' +
      'the perspective appears bright and I can imagine how it looks.',
    );
    const r = styleMessage('The breakeven is 16%.', reading);
    expect(r.modality).toBe('visual');
    expect(r.text).toMatch(/look|see|picture|show/i);
  });

  it('future-pacing moves the frame to the outcome, not the sale', () => {
    const r = applyTechnique('future-pace', 'the policy carries the mortgage.', { horizonYears: 25 });
    expect(r.output).toMatch(/25 years from now/);
    expect(r.output).toMatch(/not whether this sounds good now/);
    expect(r.informative).toBe(true);
  });

  it('reframing keeps the objection visible rather than dissolving it', () => {
    const r = applyTechnique('reframe', 'the charge buys a floor.', { objection: 'the fees are too high' });
    expect(r.output).toMatch(/the fees are too high/);
    expect(r.output).toMatch(/Both are real/);
  });

  it('forbids using technique to manufacture agreement', () => {
    expect(NLP_RULES.neverDone.join(' ')).toMatch(/manufacture agreement/);
  });

  it('forbids presenting this as validated science', () => {
    expect(NLP_RULES.neverDone.join(' ')).toMatch(/validated science|failed replication/);
  });
});

describe('council — routing', () => {
  it('has exactly twelve members with distinct domains', () => {
    expect(COUNCIL).toHaveLength(12);
    expect(new Set(COUNCIL.map((m) => m.domain)).size).toBe(12);
  });

  it('routes a policy question to the mechanic', () => {
    const r = routeUtterance('should I take the multiplier on my IUL cap');
    expect(r[0].member.id).toBe('mechanic');
  });

  it('routes a lending question to the underwriter', () => {
    const r = routeUtterance('what APR should I charge on a business advance');
    expect(r.map((x) => x.member.id)).toContain('underwriter');
  });

  it('always convenes compliance and data-integrity even with no trigger match', () => {
    const ids = routeUtterance('what about the thing we discussed').map((r) => r.member.id);
    expect(ids).toContain('registrar');
    expect(ids).toContain('auditor');
  });

  it('classifies intent from phrasing', () => {
    expect(classifyIntent('how much would this cost')).toBe('compute');
    expect(classifyIntent('should I do this')).toBe('decide');
    expect(classifyIntent('why does that happen')).toBe('explain');
    expect(classifyIntent('where did that number come from')).toBe('verify');
    expect(classifyIntent('open the time machine')).toBe('navigate');
  });

  it('every member declares sources it can actually reach', () => {
    for (const m of COUNCIL) expect(m.sources.length).toBeGreaterThan(0);
  });

  it('compliance and data-integrity defer to nobody', () => {
    expect(COUNCIL.find((m) => m.domain === 'compliance')!.defersTo).toHaveLength(0);
    expect(COUNCIL.find((m) => m.domain === 'data-integrity')!.defersTo).toHaveLength(0);
  });
});

describe('council — convening', () => {
  const sourced = (memberId: string, claim: string, confidence = 0.8, dissent = false): Finding =>
    ({ memberId, claim, source: 'multiplierDecision.ts', confidence, dissent });

  it('refuses a finding with no source', () => {
    expect(() =>
      convene('test', [{ memberId: 'mechanic', claim: 'x', source: '', confidence: 1 }]),
    ).toThrow(UnsourcedFindingError);
  });

  it('surfaces disagreement instead of averaging it', () => {
    const a = convene('should I take the multiplier', [
      sourced('mechanic', 'The multiplier improves credit in strong years.'),
      sourced('treasurer', 'The multiplier should not be taken; it never earns back its charge.'),
    ]);
    expect(a.disagreements.length).toBeGreaterThan(0);
    expect(a.synthesis).toMatch(/council is split/);
    expect(a.synthesis).toMatch(/not an error to be resolved by averaging/);
  });

  it('lets the registrar veto a claim out of the synthesis entirely', () => {
    const a = convene('can I show this projection', [
      sourced('mechanic', 'The projection shows 8% annually.'),
      sourced('registrar', 'That rate exceeds the maximum illustrated rate and cannot be shown.', 0.95, true),
    ]);
    expect(a.vetoed.length).toBe(1);
    expect(a.findings.map((f) => f.memberId)).not.toContain('registrar');
    expect(a.synthesis).toMatch(/Held back by registrar/);
  });

  it('lets the auditor veto an unsourced figure', () => {
    const a = convene('what is the default rate', [
      sourced('underwriter', 'Default rate is 4%.'),
      sourced('auditor', 'That figure is not sourced and cannot be published.', 0.9, true),
    ]);
    expect(a.vetoed).toHaveLength(1);
  });

  it('collects the distinct sources behind the answer', () => {
    const a = convene('explain the cap', [
      { memberId: 'mechanic', claim: 'Cap is 10.25%.', source: 'indexCreditingData.ts', confidence: 0.9 },
      { memberId: 'archivist', claim: 'It was cleared 12 times.', source: 'multiplierDecision.ts', confidence: 0.8 },
    ]);
    expect(a.sources).toHaveLength(2);
  });
});

describe('council — learning', () => {
  it('raises weight for members whose answers get used', () => {
    let mem = emptyMemory();
    for (let i = 0; i < 5; i++) mem = recordOutcome(mem, 'decide', ['mechanic'], true);
    expect(mem.weights['decide::mechanic']).toBeGreaterThan(0);
    expect(mem.observations).toBe(5);
  });

  it('lowers weight for members that keep getting dismissed', () => {
    let mem = emptyMemory();
    for (let i = 0; i < 5; i++) mem = recordOutcome(mem, 'decide', ['steward'], false);
    expect(mem.weights['decide::steward']).toBeLessThan(0);
  });

  it('bounds the adjustment so it cannot become a mirror', () => {
    let mem = emptyMemory();
    for (let i = 0; i < 500; i++) mem = recordOutcome(mem, 'decide', ['mechanic'], true);
    expect(mem.weights['decide::mechanic']).toBeLessThanOrEqual(0.4);
  });

  it('learning actually changes the ranking', () => {
    let mem = emptyMemory();
    const before = routeUtterance('should I restructure', mem).map((r) => r.member.id);
    for (let i = 0; i < 10; i++) mem = recordOutcome(mem, 'decide', ['steward'], true);
    const after = routeUtterance('should I restructure', mem).map((r) => r.member.id);
    expect(after).not.toEqual(before);
  });

  it('explains its state in readable numbers', () => {
    let mem = emptyMemory();
    mem = recordOutcome(mem, 'decide', ['mechanic'], true);
    expect(explain(mem)).toMatch(/decide::mechanic/);
    expect(explain(emptyMemory())).toMatch(/No learning yet/);
  });
});

describe('council — voice', () => {
  it('parses a navigation command and names the target', () => {
    const v = parseVoiceCommand('open the time machine');
    expect(v.intent).toBe('navigate');
    expect(v.target).toBeTruthy();
    expect(v.spokenReply).toMatch(/Opening/);
  });

  it('names the lead member in a spoken reply', () => {
    const v = parseVoiceCommand('should I take the multiplier on this policy');
    expect(v.spokenReply).toMatch(/Mechanic/);
  });

  it('spoken replies carry no tables or figure strings', () => {
    const v = parseVoiceCommand('how much cash value do I have');
    expect(v.spokenReply).not.toMatch(/\|/);
    expect(v.spokenReply).not.toMatch(/\d+\.\d{2}%/);
  });

  it('says so plainly when nothing owns the question', () => {
    expect(parseVoiceCommand('zzzz qqqq').spokenReply).toMatch(/Nobody on the council owns that/);
  });

  it('forbids averaging away disagreement', () => {
    expect(COUNCIL_RULES.neverDone.join(' ')).toMatch(/Averaging away a disagreement/);
  });
});

const rct: EvidenceRecord = {
  pmid: '12345678', title: 'A trial', journal: 'NEJM', year: 2023,
  design: 'randomised-controlled-trial', sampleSize: 800, population: 'adults 40-70 with condition X',
  intervention: 'intervention A', comparator: 'placebo', outcome: 'pain score',
  effect: 'significant improvement in pain score versus placebo',
  statedLimitations: ['single centre'], conflictOfInterest: null,
  url: 'https://pubmed.ncbi.nlm.nih.gov/12345678/',
};

describe('health evidence — citation contract', () => {
  it('refuses a record with no PMID', () => {
    expect(() => validateRecord({ ...rct, pmid: '' })).toThrow(UncitedEvidenceError);
  });

  it('refuses a malformed PMID', () => {
    expect(() => validateRecord({ ...rct, pmid: 'abc' })).toThrow(UncitedEvidenceError);
  });

  it('refuses a record with no reported effect', () => {
    expect(() => validateRecord({ ...rct, effect: '' })).toThrow(UncitedEvidenceError);
  });
});

describe('health evidence — grading', () => {
  it('ranks a meta-analysis above a case report', () => {
    expect(DESIGN_RANK['meta-analysis']).toBeGreaterThan(DESIGN_RANK['case-report']);
  });

  it('grades a large RCT as strong', () => {
    expect(gradeEvidence(rct).strength).toBe('strong');
  });

  it('downgrades a strong design at a tiny sample', () => {
    const g = gradeEvidence({ ...rct, sampleSize: 12 });
    expect(g.strength).not.toBe('strong');
    expect(g.caveats.join(' ')).toMatch(/12 participants/);
  });

  it('flags animal work as not a human study', () => {
    const g = gradeEvidence({ ...rct, design: 'animal', sampleSize: null });
    expect(g.strength).toBe('preliminary');
    expect(g.caveats.join(' ')).toMatch(/Not a human study/);
  });

  it('flags an old study against a moving standard of care', () => {
    const g = gradeEvidence({ ...rct, year: 2000 }, new Date('2026-01-01'));
    expect(g.caveats.join(' ')).toMatch(/Standard of care may have moved/);
  });

  it('carries the authors own limitations into the caveats', () => {
    expect(gradeEvidence(rct).caveats.join(' ')).toMatch(/single centre/);
  });
});

describe('health evidence — contradictions are surfaced', () => {
  it('finds studies of the same thing reporting opposite results', () => {
    const a = gradeEvidence(rct);
    const b = gradeEvidence({
      ...rct, pmid: '87654321', effect: 'no significant difference versus placebo', year: 2024,
    });
    const c = findContradictions([a, b]);
    expect(c).toHaveLength(1);
    expect(c[0].detail).toMatch(/Neither is the answer on its own/);
  });

  it('says plainly that no contradiction is not the same as agreement', () => {
    const b = buildBriefing('condition X', [rct]);
    expect(b.summary).toMatch(/not the same as agreement/);
  });
});

describe('health evidence — the advice gate', () => {
  it('blocks recommending language', () => {
    expect(() => assertNotAdvice('You should take intervention A.')).toThrow(MedicalAdviceError);
    expect(() => assertNotAdvice('I recommend starting this.')).toThrow(MedicalAdviceError);
    expect(() => assertNotAdvice('This is the best treatment for you.')).toThrow(MedicalAdviceError);
  });

  it('explains why a disclaimer does not fix it', () => {
    try {
      assertNotAdvice('I recommend this.');
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as Error).message).toMatch(/disclaimer/i);
      expect((e as Error).message).toMatch(/relocates blame|moves blame|does not/i);
    }
  });

  it('allows neutral retrieval language', () => {
    expect(() => assertNotAdvice('Three trials reported improvement; one reported no effect.')).not.toThrow();
  });

  it('a briefing passes its own gate and carries the boundary', () => {
    const b = buildBriefing('condition X', [rct]);
    expect(b.boundary).toMatch(/not a substitute/);
    expect(b.summary).toMatch(/clinical question/);
    expect(() => assertNotAdvice(b.summary)).not.toThrow();
  });

  it('names the strongest study as a fact about design, not a recommendation', () => {
    const b = buildBriefing('condition X', [rct]);
    expect(b.strongest!.pmid).toBe('12345678');
    expect(b.summary).toMatch(/strongest by design/);
  });

  it('forbids relying on a disclaimer', () => {
    expect(HEALTH_RULES.neverDone.join(' ')).toMatch(/disclaimer moves blame, not risk/);
  });
});
