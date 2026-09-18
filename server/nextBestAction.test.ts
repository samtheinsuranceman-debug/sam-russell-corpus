import { describe, it, expect } from 'vitest';
import {
  derive, hydrate, PROVENANCE_RANK,
  type ClientFacts, type Fact, type Asset, type Liability,
} from '@shared/factFinder';
import {
  greenButton, rankStrategies, transferRisk, sequence, scoreThroughLenses,
  LENSES, LENS_WEIGHTS,
  type Strategy, type RiskAppetite,
} from '@shared/nextBestAction';

const f = (value: number, provenance: Fact['provenance'] = 'documented'): Fact => ({
  value, provenance, source: 'statement', asOf: '2026-09-01',
});

const cash: Asset = {
  id: 'a-cash', kind: 'cash', label: 'Checking & savings',
  balance: f(400_000), liquidityFactor: 1, taxOnAccess: 'ordinary',
};
const home: Asset = {
  id: 'a-home', kind: 'real-estate-primary', label: 'Residence',
  balance: f(900_000), liquidityFactor: 0, taxOnAccess: 'capital-gain',
};
const policy: Asset = {
  id: 'a-iul', kind: 'cash-value-life', label: 'IUL',
  balance: f(250_000), liquidityFactor: 0.9, taxOnAccess: 'tax-free',
};
const mortgage: Liability = {
  id: 'l-mtg', kind: 'mortgage-primary', label: 'Primary mortgage',
  balance: f(400_000), rate: f(0.065), monthlyPayment: f(2_800),
  remainingMonths: 240, securedByAssetId: 'a-home',
};

const facts: ClientFacts = {
  clientId: 'c1', currentAge: 52, state: 'NC', filingStatus: 'married-joint',
  marginalTaxRate: f(0.32),
  assets: [cash, home, policy],
  liabilities: [mortgage],
  income: [{ id: 'i1', label: 'Practice income', annualGross: f(450_000), kind: 'self-employment', durability: 'employment-dependent' }],
  expenses: [
    { id: 'e1', label: 'Household essential', annual: f(180_000), essential: true },
    { id: 'e2', label: 'Discretionary', annual: f(60_000), essential: false },
  ],
};

describe('factFinder — derivation', () => {
  it('computes net worth, liquidity and surplus', () => {
    const d = derive(facts);
    expect(d.totalAssets).toBe(1_550_000);
    expect(d.totalLiabilities).toBe(400_000);
    expect(d.netWorth).toBe(1_150_000);
    expect(d.liquidAssets).toBe(400_000 + 225_000); // home is illiquid, policy at 0.9
    expect(d.annualSurplus).toBe(210_000);
  });

  it('holds back a six-month essential reserve before calling capital deployable', () => {
    const d = derive(facts);
    const reserve = (180_000 / 12) * 6;
    expect(d.deployableCapital).toBe(Math.round(625_000 - reserve));
  });

  it('warns when the reserve is not met and reports zero deployable', () => {
    const broke = { ...facts, assets: [{ ...cash, balance: f(20_000) }] };
    const d = derive(broke);
    expect(d.emergencyMonths).toBeLessThan(6);
    expect(d.deployableCapital).toBe(0);
    expect(d.warnings.join(' ')).toMatch(/six-month reserve|below the/i);
  });

  it('warns above a 43% debt-to-income', () => {
    const levered = {
      ...facts,
      liabilities: [{ ...mortgage, monthlyPayment: f(20_000) }],
    };
    expect(derive(levered).warnings.join(' ')).toMatch(/43%/);
  });

  it('warns on a spending deficit', () => {
    const deficit = {
      ...facts,
      expenses: [{ id: 'e1', label: 'All-in', annual: f(600_000), essential: true }],
    };
    expect(derive(deficit).warnings.join(' ')).toMatch(/Expenses exceed income/);
  });
});

describe('factFinder — provenance propagates', () => {
  it('reports the weakest provenance anywhere in the inputs', () => {
    expect(derive(facts).weakestProvenance).toBe('documented');
    const guessy = { ...facts, marginalTaxRate: f(0.32, 'estimated') };
    expect(derive(guessy).weakestProvenance).toBe('estimated');
  });

  it('warns loudly when anything is estimated', () => {
    const guessy = { ...facts, marginalTaxRate: f(0.32, 'estimated') };
    expect(derive(guessy).warnings.join(' ')).toMatch(/should not be presented as documented/);
  });

  it('ranks provenance so documented outranks stated outranks estimated', () => {
    expect(PROVENANCE_RANK.documented).toBeGreaterThan(PROVENANCE_RANK.stated);
    expect(PROVENANCE_RANK.stated).toBeGreaterThan(PROVENANCE_RANK.estimated);
  });
});

describe('factFinder — hydration', () => {
  it('fills every calculator from the one record', () => {
    const prefills = hydrate(facts);
    const names = prefills.map((p) => p.calculator);
    expect(names).toContain('mortgageKiller');
    expect(names).toContain('realEstateMogul');
    expect(names).toContain('timeMachine30');
    expect(names).toContain('helocLenders');
    expect(names).toContain('smallBusinessLending');
  });

  it('carries the real balances into mortgage killer', () => {
    const mk = hydrate(facts).find((p) => p.calculator === 'mortgageKiller')!;
    expect(mk.values.mortgageBalance).toBe(400_000);
    expect(mk.values.policyCashValue).toBe(250_000);
    expect(mk.missing).toHaveLength(0);
  });

  it('computes HELOC equity as value less liens', () => {
    const h = hydrate(facts).find((p) => p.calculator === 'helocLenders')!;
    expect(h.values.availableEquity).toBe(500_000);
  });

  it('names what is missing instead of defaulting to zero silently', () => {
    const noPolicy = { ...facts, assets: [cash, home] };
    const mk = hydrate(noPolicy).find((p) => p.calculator === 'mortgageKiller')!;
    expect(mk.missing).toContain('at least one cash value policy');
  });

  it('degrades a calculator to the provenance of its weakest input', () => {
    const guessy = { ...facts, liabilities: [{ ...mortgage, balance: f(400_000, 'estimated') }] };
    const mk = hydrate(guessy).find((p) => p.calculator === 'mortgageKiller')!;
    expect(mk.provenance).toBe('estimated');
  });

  it('never routes reserve capital into the lending calculator', () => {
    const sbl = hydrate(facts).find((p) => p.calculator === 'smallBusinessLending')!;
    expect(sbl.values.deployableCapital).toBe(derive(facts).deployableCapital);
    expect(sbl.values.deployableCapital).toBeLessThan(derive(facts).liquidAssets);
  });
});

const iul: Strategy = {
  id: 'iul', name: 'New IUL', calculator: 'timeMachine30', minimumCapital: 100_000,
  liquidityFactor: 0.6, yearsToBenefit: 2, taxTreatment: 'tax-free', unwindCostYearOne: 0.35,
  hasFloor: true, createsDeathBenefit: true, usesLeverage: false, complexity: 3,
  bestMonths: [], prerequisites: [], regulatoryLoad: 2, expectedReturn: 0.06,
  repeatEveryYears: 2, plainDescription: 'Fund a new indexed policy.',
};
const lending: Strategy = {
  id: 'sbl', name: 'Small Business Lending Book', calculator: 'smallBusinessLending',
  minimumCapital: 150_000, liquidityFactor: 0.2, yearsToBenefit: 1, taxTreatment: 'ordinary',
  unwindCostYearOne: 0.05, hasFloor: false, createsDeathBenefit: false, usesLeverage: false,
  complexity: 8, bestMonths: [2, 3], prerequisites: [], regulatoryLoad: 7, expectedReturn: 0.28,
  plainDescription: 'Season-timed advances to trades.',
};
const policyLoan: Strategy = {
  id: 'loan', name: 'Policy Loan to Principal', calculator: 'mortgageKiller',
  minimumCapital: 50_000, liquidityFactor: 0.9, yearsToBenefit: 1, taxTreatment: 'tax-free',
  unwindCostYearOne: 0.01, hasFloor: true, createsDeathBenefit: false, usesLeverage: true,
  complexity: 4, bestMonths: [], prerequisites: ['iul'], regulatoryLoad: 2, expectedReturn: 0.065,
  plainDescription: 'Borrow against the policy to attack principal.',
};
const ALL = [iul, lending, policyLoan];

describe('nextBestAction — the twelve lenses', () => {
  it('runs exactly twelve lenses', () => {
    expect(LENSES).toHaveLength(12);
    expect(scoreThroughLenses(iul, facts, derive(facts))).toHaveLength(12);
  });

  it('keeps compliance and leverage-safety weighted equally at every appetite', () => {
    const appetites: RiskAppetite[] = ['conservative', 'moderate', 'aggressive'];
    const compliance = appetites.map((a) => LENS_WEIGHTS[a].compliance);
    const leverage = appetites.map((a) => LENS_WEIGHTS[a]['leverage-safety']);
    expect(new Set(compliance).size).toBe(1);
    expect(new Set(leverage).size).toBe(1);
  });

  it('lets appetite move the growth and liquidity trade', () => {
    expect(LENS_WEIGHTS.aggressive.growth).toBeGreaterThan(LENS_WEIGHTS.conservative.growth);
    expect(LENS_WEIGHTS.conservative.liquidity).toBeGreaterThan(LENS_WEIGHTS.aggressive.liquidity);
  });

  it('ranks the floored, tax-free strategy above the lending book for a conservative client', () => {
    const r = rankStrategies(ALL, facts, 'conservative');
    const iulRank = r.find((x) => x.strategyId === 'iul')!.rank;
    const sblRank = r.find((x) => x.strategyId === 'sbl')!.rank;
    expect(iulRank).toBeLessThan(sblRank);
  });

  it('moves the lending book up for an aggressive client', () => {
    const cons = rankStrategies(ALL, facts, 'conservative').find((x) => x.strategyId === 'sbl')!;
    const agg = rankStrategies(ALL, facts, 'aggressive').find((x) => x.strategyId === 'sbl')!;
    expect(agg.weightedScore).toBeGreaterThan(cons.weightedScore);
  });

  it('surfaces the loudest objection so it can be answered in the meeting', () => {
    const sbl = rankStrategies(ALL, facts, 'conservative').find((x) => x.strategyId === 'sbl')!;
    expect(sbl.loudestObjection.reason).toBeTruthy();
    expect(LENSES).toContain(sbl.loudestObjection.lens);
  });

  it('blocks a strategy whose prerequisite is not in place', () => {
    const loan = rankStrategies(ALL, facts, 'moderate').find((x) => x.strategyId === 'loan')!;
    expect(loan.blockedBy.join(' ')).toMatch(/Requires "New IUL" first/);
  });

  it('blocks everything when the emergency reserve is missing', () => {
    const broke = { ...facts, assets: [{ ...cash, balance: f(10_000) }] };
    for (const r of rankStrategies(ALL, broke, 'moderate')) {
      expect(r.blockedBy.join(' ')).toMatch(/six-month cash reserve/);
    }
  });

  it('marks a strategy unaffordable against deployable capital, not gross liquidity', () => {
    const thin = { ...facts, assets: [{ ...cash, balance: f(120_000) }] };
    const sbl = rankStrategies(ALL, thin, 'aggressive').find((x) => x.strategyId === 'sbl')!;
    expect(sbl.affordable).toBe(false);
  });
});

describe('nextBestAction — transfer risk', () => {
  it('itemizes protections lost rather than netting them into the spread', () => {
    const t = transferRisk(iul, lending, 200_000, facts);
    const lost = t.protectionsLost.join(' ');
    expect(lost).toMatch(/floor/i);
    expect(lost).toMatch(/death benefit/i);
    expect(lost).toMatch(/[Tt]ax-free access/);
    expect(lost).toMatch(/[Ll]iquidity/);
  });

  it('flags the regulatory and complexity step-up as acquired risk', () => {
    const t = transferRisk(iul, lending, 200_000, facts);
    const acquired = t.risksAcquired.join(' ');
    expect(acquired).toMatch(/Regulatory exposure/);
    expect(acquired).toMatch(/complexity/i);
  });

  it('computes the spread after tax, not before', () => {
    const t = transferRisk(iul, lending, 200_000, facts);
    // Gross spread favors lending; the plain text must show the after-tax number too.
    expect(t.netAnnualSpread).toBeGreaterThan(0);
    expect(t.plain).toMatch(/after/);
  });

  it('calls a move dilutive when the destination earns less', () => {
    const t = transferRisk(lending, iul, 100_000, facts);
    expect(t.verdict).toBe('dilutive');
    expect(t.yearsToRecoverExitCost).toBe(Infinity);
  });

  it('charges the exit cost of the source position', () => {
    const t = transferRisk(iul, lending, 100_000, facts);
    expect(t.exitCost).toBe(35_000); // 35% year-one unwind
  });

  it('refuses a non-positive transfer', () => {
    expect(() => transferRisk(iul, lending, 0, facts)).toThrow(RangeError);
  });
});

describe('nextBestAction — sequencing', () => {
  it('lays the repeating IUL down every two years across the horizon', () => {
    const ranked = rankStrategies(ALL, facts, 'moderate');
    const plan = sequence(ranked, ALL, facts, 20);
    const iulSteps = plan.filter((s) => s.strategyId === 'iul');
    expect(iulSteps.length).toBeGreaterThan(5);
    const months = iulSteps.map((s) => s.startMonth).sort((a, b) => a - b);
    expect(months[1] - months[0]).toBe(24);
  });

  it('explains why the cycle repeats', () => {
    const ranked = rankStrategies(ALL, facts, 'moderate');
    const plan = sequence(ranked, ALL, facts, 20);
    const repeat = plan.find((s) => s.repeats && s.name.includes('cycle'))!;
    expect(repeat.rationale).toMatch(/own surrender schedule on its own clock/);
  });

  it('never schedules a policy loan before the policy is seasoned', () => {
    const ranked = rankStrategies(ALL, facts, 'moderate');
    const plan = sequence(ranked, ALL, facts, 20);
    const firstIul = plan.filter((s) => s.strategyId === 'iul')[0];
    const loan = plan.find((s) => s.strategyId === 'loan');
    if (loan) expect(loan.startMonth).toBeGreaterThanOrEqual(firstIul.startMonth + 24);
  });

  it('returns steps in calendar order', () => {
    const ranked = rankStrategies(ALL, facts, 'moderate');
    const plan = sequence(ranked, ALL, facts, 20);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].startMonth).toBeGreaterThanOrEqual(plan[i - 1].startMonth);
    }
  });

  it('schedules nothing when the reserve is missing', () => {
    const broke = { ...facts, assets: [{ ...cash, balance: f(10_000) }] };
    const ranked = rankStrategies(ALL, broke, 'moderate');
    expect(sequence(ranked, ALL, broke, 20)).toHaveLength(0);
  });
});

describe('nextBestAction — the green button', () => {
  it('returns a headline, a ranking and a dated plan in one call', () => {
    const r = greenButton(facts, ALL, 'moderate');
    expect(r.headline).toBeTruthy();
    expect(r.ranked.length).toBe(3);
    expect(r.plan.length).toBeGreaterThan(0);
    expect(r.position.netWorth).toBe(1_150_000);
  });

  it('carries provenance onto the recommendation itself', () => {
    const guessy = { ...facts, marginalTaxRate: f(0.32, 'estimated') };
    expect(greenButton(guessy, ALL, 'moderate').provenance).toBe('estimated');
  });

  it('says plainly when nothing is available yet', () => {
    const broke = { ...facts, assets: [{ ...cash, balance: f(10_000) }] };
    expect(greenButton(broke, ALL, 'moderate').headline).toMatch(/Nothing is available yet/);
  });

  it('gives a different first step to a conservative and an aggressive client', () => {
    const c = greenButton(facts, ALL, 'conservative').ranked[0];
    const a = greenButton(facts, ALL, 'aggressive').ranked[0];
    expect(c.weightedScore).not.toBe(a.weightedScore);
  });
});
