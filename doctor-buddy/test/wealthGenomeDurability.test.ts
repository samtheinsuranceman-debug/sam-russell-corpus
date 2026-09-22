/**
 * The Wealth Genome, tested where it would do harm if it were wrong.
 *
 * Three things matter more than the arithmetic here:
 *
 *   1. It must not treat "we don't know" as "average". A person nobody has
 *      asked about drawdowns is unassessed, not moderate, and the difference
 *      is a strategy sold on a fit finding that was never made.
 *   2. Self-report must not reach the confidence of observed behaviour, no
 *      matter how much of it there is.
 *   3. A strained verdict must name the mechanism and the money, not just
 *      disapprove.
 */

import { describe, it, expect } from 'vitest';
import {
  AXES,
  EVIDENCE_WEIGHT,
  MIN_CONFIDENCE,
  STRATEGIES,
  META_PROGRAM_LINKS,
  AXIS_QUESTIONS,
  readAxis,
  buildGenome,
  assessFit,
  wealthGenomeReport,
  nextBestQuestion,
  signalFromMetaProgram,
  signalsFromFinancialGenome,
  type Signal,
} from '@shared/engines/wealthGenomeDurability';

const sig = (
  axis: Signal['axis'],
  direction: number,
  kind: Signal['kind'],
  note = 'test',
  asOfYear = 2025
): Signal => ({ axis, direction, kind, note, asOfYear });

describe('evidence ranking', () => {
  it('ranks observed behaviour above every kind of report', () => {
    expect(EVIDENCE_WEIGHT.observed).toBeGreaterThan(EVIDENCE_WEIGHT.corroborated);
    expect(EVIDENCE_WEIGHT.corroborated).toBeGreaterThan(EVIDENCE_WEIGHT.volunteered);
    expect(EVIDENCE_WEIGHT.volunteered).toBeGreaterThan(EVIDENCE_WEIGHT.stated);
    expect(EVIDENCE_WEIGHT.stated).toBeGreaterThan(EVIDENCE_WEIGHT.inferred);
  });

  it('one observation outweighs one self-report at the same strength', () => {
    const observed = readAxis('emotional', [sig('emotional', 2, 'observed')]);
    const stated = readAxis('emotional', [sig('emotional', 2, 'stated')]);
    expect(observed.confidence).toBeGreaterThan(stated.confidence);
    // The direction agrees; only how much it is worth differs.
    expect(observed.score).toBeCloseTo(stated.score, 2);
  });

  it('a pile of self-report never reaches one observation', () => {
    const lots = readAxis(
      'emotional',
      Array.from({ length: 8 }, () => sig('emotional', 2, 'stated'))
    );
    const one = readAxis('emotional', [sig('emotional', 2, 'observed')]);
    expect(lots.confidence).toBeLessThan(one.confidence);
  });

  it('ages evidence — fifteen years ago counts for less than last year', () => {
    const recent = readAxis('emotional', [sig('emotional', 2, 'observed', 'x', 2025)], 2026);
    const old = readAxis('emotional', [sig('emotional', 2, 'observed', 'x', 2010)], 2026);
    expect(recent.confidence).toBeGreaterThan(old.confidence);
  });
});

describe('unknown is not average — the failure that would do real harm', () => {
  it('reports an axis with no signals as insufficient, not neutral', () => {
    const r = readAxis('emotional', []);
    expect(r.insufficient).toBe(true);
    expect(r.signalCount).toBe(0);
    expect(r.confidence).toBe(0);
    expect(r.basis).toMatch(/not a neutral reading/);
  });

  it('says so in the basis rather than leaving a zero to be misread', () => {
    const r = readAxis('income', []);
    // The score is 0, which is exactly why the flag has to be checked.
    expect(r.score).toBe(0);
    expect(r.insufficient).toBe(true);
  });

  it('marks a single weak signal as insufficient rather than conclusive', () => {
    const r = readAxis('cognitive', [sig('cognitive', -2, 'inferred')]);
    expect(r.confidence).toBeLessThan(MIN_CONFIDENCE);
    expect(r.insufficient).toBe(true);
  });

  it('an empty genome is fully unassessed, and coverage says so', () => {
    const g = buildGenome([]);
    expect(g.unassessed).toHaveLength(4);
    expect(g.coverage).toBe(0);
    expect(g.note).toMatch(/4 of 4 axes are unassessed/);
  });

  it('a strategy leaning on unknown axes returns unassessed, never supported', () => {
    const g = buildGenome([]);
    const iul = STRATEGIES.find((s) => s.id === 'iul-max-funded')!;
    const fit = assessFit(iul, g);
    expect(fit.verdict).toBe('unassessed');
    expect(fit.verdict).not.toBe('supported');
    for (const u of fit.unmet) expect(u.unassessed).toBe(true);
  });

  it('tells you to establish the axis rather than offering a mitigation for a gap it cannot see', () => {
    const fit = assessFit(STRATEGIES[0], buildGenome([]));
    expect(fit.whatWouldMakeItWork.every((s) => /Establish/.test(s))).toBe(true);
  });
});

describe('reading an axis', () => {
  it('a durable person on observed evidence reads positive and confident', () => {
    const r = readAxis('emotional', [
      sig('emotional', 2, 'observed', 'held through 2008'),
      sig('emotional', 1, 'corroborated', 'spouse confirms'),
      sig('emotional', 2, 'observed', 'held through 2020'),
    ]);
    expect(r.score).toBeGreaterThan(1);
    expect(r.confidence).toBeGreaterThan(MIN_CONFIDENCE);
    expect(r.insufficient).toBe(false);
    expect(r.strongestEvidence).toBe('observed');
  });

  it('a fragile person on observed evidence reads negative', () => {
    const r = readAxis('emotional', [
      sig('emotional', -2, 'observed', 'liquidated in March 2020'),
      sig('emotional', -2, 'observed', 'liquidated in 2022'),
      sig('emotional', -1, 'corroborated', 'spouse describes sleeplessness'),
    ]);
    expect(r.score).toBeLessThan(-1);
    expect(r.insufficient).toBe(false);
  });

  it('flags a reading built only on words', () => {
    const r = readAxis('emotional', [
      sig('emotional', 2, 'stated'),
      sig('emotional', 2, 'stated'),
      sig('emotional', 2, 'stated'),
      sig('emotional', 2, 'stated'),
    ]);
    expect(r.basis).toMatch(/what was said rather than what will be done/);
  });

  it('conflicting evidence pulls toward the middle instead of picking a side', () => {
    const r = readAxis('emotional', [
      sig('emotional', 2, 'observed', 'held 2008'),
      sig('emotional', -2, 'observed', 'sold 2020'),
    ]);
    expect(Math.abs(r.score)).toBeLessThan(0.5);
  });

  it('confidence comes from evidence, not from how extreme the score is', () => {
    const extreme = readAxis('income', [sig('income', 2, 'stated')]);
    const mild = readAxis('income', [sig('income', 0, 'stated')]);
    expect(extreme.confidence).toBeCloseTo(mild.confidence, 2);
  });
});

describe('fit finds the mechanism, not a mood', () => {
  const fragile = buildGenome([
    sig('emotional', -2, 'observed', 'liquidated at the 2020 bottom'),
    sig('emotional', -2, 'observed', 'liquidated again in 2022'),
    sig('emotional', -1, 'corroborated', 'spouse confirms'),
    sig('income', 2, 'observed', 'salaried, unbroken 20 years'),
    sig('income', 1, 'corroborated', 'employer confirms tenure'),
    sig('income', 2, 'observed', 'no interruption through 2020'),
    sig('cognitive', 1, 'observed', 'held a structure he could not re-derive'),
    sig('cognitive', 1, 'corroborated', 'accountant confirms'),
    sig('cognitive', 2, 'observed', 'reads the mechanics himself'),
    sig('relational', 2, 'observed', 'both spouses at every meeting'),
    sig('relational', 1, 'corroborated', 'joint decisions historically'),
    sig('relational', 2, 'observed', 'joint account decisions'),
  ]);

  it('strains a floor-bearing strategy for somebody who sells at the bottom', () => {
    const iul = STRATEGIES.find((s) => s.id === 'iul-max-funded')!;
    const fit = assessFit(iul, fragile);
    expect(fit.verdict).toBe('strained');
    const emotional = fit.unmet.find((u) => u.axis === 'emotional')!;
    expect(emotional).toBeDefined();
    expect(emotional.unassessed).toBe(false);
    expect(emotional.shortfall).toBeGreaterThan(0);
  });

  it('names the contractual feature and the money, not an adjective', () => {
    const fit = assessFit(STRATEGIES.find((s) => s.id === 'iul-max-funded')!, fragile);
    const emotional = fit.unmet.find((u) => u.axis === 'emotional')!;
    expect(emotional.mechanism).toMatch(/0%|spread|floor/);
    expect(emotional.failureMode).toMatch(/surrender|charge/i);
  });

  it('still reports what the person DOES meet, so it is not only a warning', () => {
    const fit = assessFit(STRATEGIES.find((s) => s.id === 'iul-max-funded')!, fragile);
    expect(fit.met.length).toBeGreaterThan(0);
    expect(fit.met.some((d) => d.axis === 'income' || d.axis === 'relational')).toBe(true);
  });

  it('strains direct equity for the same person, for the same reason', () => {
    const eq = STRATEGIES.find((s) => s.id === 'equity-accumulation')!;
    expect(assessFit(eq, fragile).verdict).toBe('strained');
  });

  it('supports mortgage elimination for them — durable income, legible arithmetic', () => {
    const m = STRATEGIES.find((s) => s.id === 'mortgage-elimination')!;
    const fit = assessFit(m, fragile);
    expect(fit.verdict).toBe('supported');
    expect(fit.unmet).toHaveLength(0);
  });

  it('never phrases a finding as the person being unsuitable', () => {
    for (const s of STRATEGIES) {
      const fit = assessFit(s, fragile);
      expect(fit.caveat).toMatch(/never a reason to decline to serve/);
      for (const w of fit.whatWouldMakeItWork) {
        expect(w).not.toMatch(/unsuitable|not a fit for this client|find a different/i);
      }
    }
  });

  it('a zero-severity demand is met without needing durability', () => {
    const m = STRATEGIES.find((s) => s.id === 'mortgage-elimination')!;
    const fit = assessFit(m, buildGenome([sig('income', 2, 'observed'), sig('income', 2, 'observed'), sig('income', 1, 'corroborated')]));
    expect(fit.met.some((d) => d.severity === 0)).toBe(true);
  });
});

describe('the report', () => {
  const durable = buildGenome(
    AXES.flatMap((axis) => [
      sig(axis, 2, 'observed'),
      sig(axis, 2, 'observed'),
      sig(axis, 1, 'corroborated'),
    ])
  );

  it('orders so the conversation starts where it can', () => {
    const r = wealthGenomeReport(
      AXES.flatMap((axis) => [sig(axis, -2, 'observed'), sig(axis, -2, 'observed'), sig(axis, -1, 'corroborated')])
    );
    const ranks = r.ordered.map((f) => f.verdict);
    const worstFirst = ranks.indexOf('strained');
    const bestLast = ranks.lastIndexOf('supported');
    if (worstFirst !== -1 && bestLast !== -1) expect(bestLast).toBeLessThan(worstFirst);
  });

  it('supports the demanding strategies for a durable person', () => {
    const r = wealthGenomeReport([], 2026, STRATEGIES);
    expect(r.genome.coverage).toBe(0);
    const durableReport = { ...r, genome: durable };
    const iul = assessFit(STRATEGIES[0], durableReport.genome);
    expect(iul.verdict).toBe('supported');
  });

  it('carries the disclaimer about what the framework is and is not', () => {
    const r = wealthGenomeReport([sig('emotional', 1, 'observed')]);
    expect(r.disclaimer).toMatch(/not a validated psychometric/);
    expect(r.disclaimer).toMatch(/does not diagnose/);
    expect(r.disclaimer).toMatch(/Sourcebook of Magic/);
  });
});

describe('the next best question', () => {
  it('asks about the axis carrying the most severity', () => {
    // Everything known except emotional, which carries the most weight.
    const g = buildGenome(
      (['income', 'cognitive', 'relational'] as const).flatMap((axis) => [
        sig(axis, 1, 'observed'),
        sig(axis, 1, 'observed'),
        sig(axis, 1, 'corroborated'),
      ])
    );
    expect(nextBestQuestion(g)).toBe(AXIS_QUESTIONS.emotional);
  });

  it('returns null once every axis is known', () => {
    const g = buildGenome(
      AXES.flatMap((axis) => [sig(axis, 1, 'observed'), sig(axis, 1, 'observed'), sig(axis, 1, 'corroborated')])
    );
    expect(nextBestQuestion(g)).toBeNull();
  });

  it('every question asks for an event, not a self-assessment', () => {
    // "How do you feel about risk" produces a sentence. "What did you do in
    // 2020" produces evidence. All four must be of the second kind.
    for (const q of Object.values(AXIS_QUESTIONS)) {
      expect(q).toMatch(/did you|has your|happens|what happened|Think of/i);
    }
    expect(AXIS_QUESTIONS.emotional).toMatch(/Not what you thought/);
  });
});

describe('the meta-program layer is labelled as a framework', () => {
  it('cites the reference numbering, including #8 Durability', () => {
    const durability = META_PROGRAM_LINKS.find((l) => l.id === 8)!;
    expect(durability.name).toBe('Durability');
    expect(durability.poles).toEqual(['Permeable', 'Impermeable']);
    expect(durability.axis).toBe('emotional');
  });

  it('enters as the WEAKEST evidence kind, because that is what it is', () => {
    const link = META_PROGRAM_LINKS.find((l) => l.id === 8)!;
    const s = signalFromMetaProgram(link, 0, 'from the intake conversation');
    expect(s.kind).toBe('inferred');
    expect(EVIDENCE_WEIGHT[s.kind]).toBe(Math.min(...Object.values(EVIDENCE_WEIGHT)));
  });

  it('says in the signal itself that it is a reading, not a measurement', () => {
    const link = META_PROGRAM_LINKS.find((l) => l.id === 7)!;
    expect(signalFromMetaProgram(link, 0, 'x').note).toMatch(/not a measurement/);
  });

  it('flips direction with the pole', () => {
    const link = META_PROGRAM_LINKS.find((l) => l.id === 8)!;
    expect(signalFromMetaProgram(link, 0, 'x').direction).toBe(-1);
    expect(signalFromMetaProgram(link, 1, 'x').direction).toBe(1);
  });

  it('allows a meta-program where neither pole is more durable', () => {
    // Motivation direction changes WHICH strategy survives, not how well.
    const motivation = META_PROGRAM_LINKS.find((l) => l.id === 20)!;
    expect(motivation.firstPoleDirection).toBe(0);
    expect(motivation.whyItMatters).toMatch(/Neither pole is more durable/);
  });

  it('cannot on its own make an axis assessed', () => {
    // Four framework readings are still not evidence about behaviour.
    const link = META_PROGRAM_LINKS.find((l) => l.id === 8)!;
    const g = buildGenome(Array.from({ length: 4 }, () => signalFromMetaProgram(link, 0, 'x', 2025)));
    expect(g.readings.emotional.insufficient).toBe(true);
  });
});

describe('the strategy catalogue', () => {
  it('every demand names a mechanism, a failure mode and a mitigation', () => {
    for (const s of STRATEGIES) {
      expect(s.demands.length).toBeGreaterThan(0);
      expect(s.source).toBeTruthy();
      for (const d of s.demands) {
        expect(d.mechanism.length).toBeGreaterThan(20);
        expect(d.failureMode.length).toBeGreaterThan(20);
        expect(d.mitigation.length).toBeGreaterThan(3);
        expect(AXES).toContain(d.axis);
      }
    }
  });

  it('cites the engines the mechanism claims come from', () => {
    const iul = STRATEGIES.find((s) => s.id === 'iul-max-funded')!;
    expect(iul.source).toMatch(/policyMechanics|balancedIndexedAccount|policyLoanMechanics/);
  });

  it('carries the lapse-with-a-loan failure, which is the worst case on the platform', () => {
    const iul = STRATEGIES.find((s) => s.id === 'iul-max-funded')!;
    const income = iul.demands.find((d) => d.axis === 'income')!;
    expect(income.failureMode).toMatch(/ordinary income/);
    expect(income.failureMode).toMatch(/no cash/);
  });

  it('uses the real measured index falls rather than round numbers', () => {
    const eq = STRATEGIES.find((s) => s.id === 'equity-accumulation')!;
    const emotional = eq.demands.find((d) => d.axis === 'emotional')!;
    expect(emotional.mechanism).toMatch(/38\.3/);
    expect(emotional.mechanism).toMatch(/19\.5/);
  });
});

describe('the bridge from the eight-dimension financial genome', () => {
  const dims = [
    { key: 'income', name: 'Income Stability', score: 90 },
    { key: 'risk', name: 'Risk Mitigation', score: 20 },
    { key: 'diversification', name: 'Investment Diversification', score: 60 },
    { key: 'debt', name: 'Debt Management', score: 75 },
    { key: 'tax', name: 'Tax Efficiency', score: 95 },
    { key: 'estate', name: 'Estate Planning', score: 10 },
  ];

  it('maps only the dimensions that bear on durability', () => {
    const out = signalsFromFinancialGenome(dims, 2025);
    // Tax efficiency and estate planning say nothing about whether somebody
    // can hold a position, so they are left out rather than stretched.
    expect(out).toHaveLength(4);
    expect(out.map((s) => s.axis).sort()).toEqual(['cognitive', 'emotional', 'income', 'income']);
  });

  it('carries the direction of the score', () => {
    const out = signalsFromFinancialGenome(dims, 2025);
    const income = out.find((s) => s.note.includes('Income Stability'))!;
    const risk = out.find((s) => s.note.includes('Risk Mitigation'))!;
    expect(income.direction).toBeGreaterThan(0);
    expect(risk.direction).toBeLessThan(0);
  });

  it('enters as inferred — the weakest rank — every time', () => {
    for (const s of signalsFromFinancialGenome(dims, 2025)) {
      expect(s.kind).toBe('inferred');
      expect(s.note).toMatch(/not an observation of the person/);
    }
  });

  it('CANNOT on its own make an axis assessed, which is the point', () => {
    // A plan can score well on all eight dimensions and still be held by
    // somebody who sells at the bottom. The bridge points at where to look;
    // it does not stand in for having looked.
    const g = buildGenome(signalsFromFinancialGenome(dims, 2025), 2026);
    expect(g.readings.income.insufficient).toBe(true);
    expect(g.readings.emotional.insufficient).toBe(true);
    expect(g.unassessed.length).toBe(4);
  });

  it('one real observation outweighs the whole financial genome', () => {
    const bridged = buildGenome(signalsFromFinancialGenome(dims, 2025), 2026);
    const withReal = buildGenome(
      [...signalsFromFinancialGenome(dims, 2025), sig('emotional', -2, 'observed', 'sold at the 2020 bottom')],
      2026
    );
    expect(withReal.readings.emotional.confidence).toBeGreaterThan(
      bridged.readings.emotional.confidence
    );
    expect(withReal.readings.emotional.strongestEvidence).toBe('observed');
  });

  it('a mid score reads as neutral rather than a weak opinion', () => {
    const [s] = signalsFromFinancialGenome([{ key: 'income', name: 'Income Stability', score: 50 }]);
    expect(s.direction).toBe(0);
  });

  it('ignores a dimension key it does not recognise', () => {
    expect(signalsFromFinancialGenome([{ key: 'nonsense', name: 'X', score: 90 }])).toHaveLength(0);
  });
});
