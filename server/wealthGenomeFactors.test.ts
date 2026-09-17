/**
 * The twenty-one factors, the weighting, and the shape.
 *
 * What would do harm if it were wrong:
 *
 *   - A genome built on three answers looking like a finished one. Unknown
 *     must be visibly unknown in the geometry, not quietly averaged away.
 *   - Weights that are the same for everybody, which would make every client's
 *     shape a scaled copy of every other client's.
 *   - A volatile factor drawn as a crisp point, which asserts precision the
 *     thing itself does not have.
 */

import { describe, it, expect } from 'vitest';
import {
  FACTORS,
  FACTOR_COUNT,
  VOLATILITY_BAND,
  REASK_AFTER_MONTHS,
  BASE_RADIUS,
  personalWeights,
  factorStates,
  factorDirections,
  genomeShape,
  interviewOrder,
  type FactorReading,
} from '../shared/wealthGenomeFactors';
import { AXES } from '../shared/wealthGenomeDurability';

const r = (factorId: string, score: number, confidence = 0.8, ageMonths = 0): FactorReading => ({
  factorId,
  score,
  confidence,
  ageMonths,
});

const allKnown = (score = 0, confidence = 0.8): FactorReading[] =>
  FACTORS.map((f) => r(f.id, score, confidence));

describe('the twenty-one factors', () => {
  it('is four durability axes plus seventeen more', () => {
    expect(FACTOR_COUNT).toBe(21);
    expect(FACTORS.filter((f) => f.group === 'durability')).toHaveLength(4);
    expect(FACTORS.filter((f) => f.group !== 'durability')).toHaveLength(17);
  });

  it('covers every durability axis exactly once in the durability group', () => {
    const fed = FACTORS.filter((f) => f.group === 'durability').map((f) => f.feedsAxis);
    expect([...fed].sort()).toEqual([...AXES].sort());
  });

  it('unique ids', () => {
    expect(new Set(FACTORS.map((f) => f.id)).size).toBe(FACTOR_COUNT);
  });

  it('every factor says what high and low mean, so the sign is never ambiguous', () => {
    for (const f of FACTORS) {
      expect(f.highMeans.length).toBeGreaterThan(10);
      expect(f.lowMeans.length).toBeGreaterThan(10);
      expect(f.highMeans).not.toBe(f.lowMeans);
    }
  });

  it('every factor carries a question and a reason for that question', () => {
    for (const f of FACTORS) {
      expect(f.question.length).toBeGreaterThan(20);
      expect(f.questionNote.length).toBeGreaterThan(20);
    }
  });

  it('asks for facts and events, never for a self-rating on a scale', () => {
    for (const f of FACTORS) {
      expect(f.question).not.toMatch(/on a scale|rate your|how important is .* to you\?$/i);
      expect(f.question).toMatch(/\?/);
    }
  });

  it('classifies volatility, and uses all three classes', () => {
    const classes = new Set(FACTORS.map((f) => f.volatility));
    expect(classes).toEqual(new Set(['stable', 'drifting', 'episodic']));
  });

  it('puts the things that change in an afternoon in the episodic class', () => {
    const episodic = FACTORS.filter((f) => f.volatility === 'episodic').map((f) => f.id);
    expect(episodic).toContain('insurability');
    expect(episodic).toContain('liquidity-need');
    expect(episodic).toContain('care-obligation');
    // Numeracy is a trait; it does not change over lunch.
    expect(episodic).not.toContain('numeracy');
  });

  it('re-asks an episodic factor far sooner than a stable one', () => {
    expect(REASK_AFTER_MONTHS.episodic).toBeLessThan(REASK_AFTER_MONTHS.drifting);
    expect(REASK_AFTER_MONTHS.drifting).toBeLessThan(REASK_AFTER_MONTHS.stable);
  });
});

describe('weights are the person\'s, not the model\'s', () => {
  it('fragile income makes liquidity and elasticity matter more', () => {
    const base = personalWeights([]);
    const fragile = personalWeights([r('income-durability', -2)]);
    expect(fragile['liquidity-need']).toBeGreaterThan(base['liquidity-need']);
    expect(fragile['spending-elasticity']).toBeGreaterThan(base['spending-elasticity']);
  });

  it('a short horizon demotes tax posture and promotes liquidity', () => {
    const base = personalWeights([]);
    const short = personalWeights([r('time-horizon', -2)]);
    expect(short['tax-posture']).toBeLessThan(base['tax-posture']);
    expect(short['liquidity-need']).toBeGreaterThan(base['liquidity-need']);
  });

  it('a long horizon does the reverse', () => {
    const long = personalWeights([r('time-horizon', 2)]);
    const short = personalWeights([r('time-horizon', -2)]);
    expect(long['tax-posture']).toBeGreaterThan(short['tax-posture']);
    expect(long['inflation-exposure']).toBeGreaterThan(short['inflation-exposure']);
  });

  it('concentration and leverage compound only when both are present', () => {
    const base = personalWeights([]);
    const one = personalWeights([r('concentration', -2)]);
    const both = personalWeights([r('concentration', -2), r('leverage', -2)]);
    expect(one['concentration']).toBe(base['concentration']);
    expect(both['concentration']).toBeGreaterThan(base['concentration']);
  });

  it('ignores a reading it is not confident in', () => {
    // A guess must not reorder the interview.
    const weak = personalWeights([r('time-horizon', -2, 0.1)]);
    expect(weak['tax-posture']).toBe(personalWeights([])['tax-posture']);
  });

  it('never lets a weight exceed one', () => {
    const w = personalWeights([
      r('income-durability', -2),
      r('time-horizon', -2),
      r('dependents', -2),
      r('concentration', -2),
      r('leverage', -2),
      r('attention-budget', -2),
      r('care-obligation', -2),
    ]);
    for (const v of Object.values(w)) expect(v).toBeLessThanOrEqual(1);
  });

  it('two different people get different weight vectors', () => {
    const a = personalWeights([r('time-horizon', 2), r('income-durability', 2)]);
    const b = personalWeights([r('time-horizon', -2), r('income-durability', -2)]);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

describe('the geometry', () => {
  it('spaces twenty-one directions evenly on the unit sphere', () => {
    const dirs = factorDirections();
    expect(dirs).toHaveLength(21);
    for (const [x, y, z] of dirs) {
      expect(Math.sqrt(x * x + y * y + z * z)).toBeCloseTo(1, 2);
    }
  });

  it('gives every direction a distinct neighbour — no two factors stacked', () => {
    const dirs = factorDirections();
    for (let i = 0; i < dirs.length; i++) {
      for (let j = i + 1; j < dirs.length; j++) {
        const d = Math.hypot(dirs[i][0] - dirs[j][0], dirs[i][1] - dirs[j][1], dirs[i][2] - dirs[j][2]);
        expect(d).toBeGreaterThan(0.1);
      }
    }
  });

  it('a neutral person is close to a sphere', () => {
    const s = genomeShape(allKnown(0));
    expect(s.meanRadius).toBeCloseTo(BASE_RADIUS, 2);
    expect(s.asymmetry).toBeLessThan(0.05);
  });

  it('strengths push out and exposures pull in', () => {
    const strong = genomeShape(allKnown(2));
    const weak = genomeShape(allKnown(-2));
    expect(strong.meanRadius).toBeGreaterThan(BASE_RADIUS);
    expect(weak.meanRadius).toBeLessThan(BASE_RADIUS);
  });

  it('a lopsided configuration is measurably more asymmetric than an even one', () => {
    const even = genomeShape(allKnown(1));
    const lopsided = genomeShape(
      FACTORS.map((f, i) => r(f.id, i % 2 === 0 ? 2 : -2))
    );
    expect(lopsided.asymmetry).toBeGreaterThan(even.asymmetry);
  });

  it('weights the deformation — a heavier factor moves the surface further', () => {
    // Same score on every factor; the surface still varies, because weight
    // decides how far each one is allowed to push.
    const s = genomeShape(allKnown(2));
    const radii = s.vertices.map((v) => v.radius);
    expect(new Set(radii).size).toBeGreaterThan(1);
  });
});

describe('unknown and variable are visible in the shape, not averaged away', () => {
  it('an unasked factor is nearly transparent', () => {
    const s = genomeShape([]);
    for (const v of s.vertices) expect(v.confidence).toBe(0);
    expect(s.unknownShare).toBe(1);
  });

  it('a genome built on three answers reports itself as mostly unknown', () => {
    const s = genomeShape([r('time-horizon', 1), r('liquidity-need', -1), r('numeracy', 2)]);
    expect(s.unknownShare).toBeGreaterThan(0.8);
  });

  it('an episodic factor is drawn as a thicker band than a stable one', () => {
    const s = genomeShape(allKnown(0, 1));
    const insurability = s.vertices.find((v) => v.factorId === 'insurability')!;
    const numeracy = s.vertices.find((v) => v.factorId === 'numeracy')!;
    const thickness = (v: typeof insurability) => v.outer - v.inner;
    expect(thickness(insurability)).toBeGreaterThan(thickness(numeracy));
    expect(VOLATILITY_BAND.episodic).toBeGreaterThan(VOLATILITY_BAND.stable);
  });

  it('low confidence widens the band too — both mean "not a point"', () => {
    const sure = genomeShape(allKnown(0, 1));
    const unsure = genomeShape(allKnown(0, 0.35));
    const width = (s: typeof sure) => {
      const v = s.vertices.find((x) => x.factorId === 'numeracy')!;
      return v.outer - v.inner;
    };
    expect(width(unsure)).toBeGreaterThan(width(sure));
  });

  it('marks a stale episodic answer without touching a fresh stable one', () => {
    const states = factorStates([
      r('insurability', 1, 0.9, 12),
      r('numeracy', 1, 0.9, 12),
    ]);
    expect(states.find((s) => s.factorId === 'insurability')!.stale).toBe(true);
    expect(states.find((s) => s.factorId === 'numeracy')!.stale).toBe(false);
  });
});

describe('the signature identifies a shape, not a person', () => {
  it('is deterministic', () => {
    const a = genomeShape(allKnown(1));
    const b = genomeShape(allKnown(1));
    expect(a.signature).toBe(b.signature);
  });

  it('separates two genuinely different configurations', () => {
    const a = genomeShape(allKnown(2)).signature;
    const b = genomeShape(allKnown(-2)).signature;
    expect(a).not.toBe(b);
  });

  it('is short and carries nothing identifying', () => {
    const s = genomeShape(allKnown(1)).signature;
    expect(s).toHaveLength(7);
    expect(s).toMatch(/^[0-9A-Z]+$/);
  });

  it('separates configurations that differ in one factor', () => {
    const base = allKnown(1);
    const moved = base.map((x) =>
      x.factorId === 'insurability' ? r('insurability', -2) : x
    );
    expect(genomeShape(base).signature).not.toBe(genomeShape(moved).signature);
  });
});

describe('the interview asks the most valuable question first', () => {
  it('opens on a heavily-weighted factor when nothing is known', () => {
    const q = interviewOrder([]);
    expect(q.length).toBe(FACTOR_COUNT);
    // Time horizon and the two 0.95 durability axes carry the most weight.
    expect(['time-horizon', 'emotional-durability', 'income-durability']).toContain(q[0].factorId);
  });

  it('drops a factor once it is well established', () => {
    const known = interviewOrder([r('time-horizon', 1, 0.95)]);
    const first = known.findIndex((q) => q.factorId === 'time-horizon');
    const cold = interviewOrder([]).findIndex((q) => q.factorId === 'time-horizon');
    expect(first).toBeGreaterThan(cold);
  });

  it('puts a stale episodic answer back near the front', () => {
    const stale = interviewOrder([r('insurability', 1, 0.95, 24)]);
    const fresh = interviewOrder([r('insurability', 1, 0.95, 1)]);
    const pos = (qs: typeof stale) => qs.findIndex((q) => q.factorId === 'insurability');
    expect(pos(stale)).toBeLessThan(pos(fresh));
  });

  it('reorders itself around what it has already learned', () => {
    // Fragile income should pull liquidity up the queue.
    const cold = interviewOrder([]).findIndex((q) => q.factorId === 'liquidity-need');
    const warm = interviewOrder([r('income-durability', -2, 0.9)]).findIndex(
      (q) => q.factorId === 'liquidity-need'
    );
    expect(warm).toBeLessThanOrEqual(cold);
  });

  it('carries the reason for each question, not just the question', () => {
    for (const q of interviewOrder([], 5)) {
      expect(q.why.length).toBeGreaterThan(20);
      expect(q.volatility).toBeTruthy();
    }
  });

  it('empties out once everything is known and fresh', () => {
    expect(interviewOrder(allKnown(1, 1))).toHaveLength(0);
  });
});
