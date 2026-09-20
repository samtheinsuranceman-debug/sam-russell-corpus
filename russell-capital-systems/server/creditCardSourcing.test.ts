import { describe, expect, it } from 'vitest';
import {
  CARD_SOURCES,
  NEVER_PRINTED,
  SOURCING_STATUS,
  type ApplicantProfile,
  LIMIT_BAND_WEIGHT,
  freeToApplyNow,
  rankCards,
  scoreCard,
  sequencingAdvice,
  unrankable,
} from '../shared/creditCardSourcing';

/** The profile this page was built for: 640 FICO, three EINs, a decline and a pending approval. */
const OWNER: ApplicantProfile = {
  fico: 640,
  einCount: 3,
  oldestEntityYears: 12,
  recentHardInquiries: 1,
  approvalPending: true,
  recentDeclines: 1,
  annualRevenueUsd: 250000,
};

describe('every row carries its source', () => {
  it('has a source URL on every card', () => {
    expect(CARD_SOURCES.length).toBeGreaterThan(0);
    for (const c of CARD_SOURCES) {
      expect(c.sourceUrl, c.id).toMatch(/^https:\/\//);
      expect(c.issuer.length, c.id).toBeGreaterThan(0);
    }
  });

  it('covers the EIN trade-credit tier, which is the route at a 640 score', () => {
    const trade = CARD_SOURCES.filter((c) => c.underwriting === 'ein-trade-credit');
    expect(trade.length).toBeGreaterThanOrEqual(6);
    for (const c of trade) expect(c.reportsToBusinessBureaus, c.id).toBe(true);
  });

  it('excludes every card requiring a deposit, as requested', () => {
    for (const c of CARD_SOURCES) {
      expect(c.requiresDeposit, `${c.id} requires a deposit`).toBe(false);
    }
  });

  it('names no large national bank, as requested', () => {
    const banned = ['chase', 'capital one', 'american express', 'amex', 'wells fargo', 'bank of america', 'citi'];
    for (const c of CARD_SOURCES) {
      const hay = `${c.issuer} ${c.product}`.toLowerCase();
      for (const b of banned) {
        expect(hay.indexOf(b), `${c.id} names ${b}`).toBe(-1);
      }
    }
  });
});

describe('an unverified row cannot be ranked', () => {
  it('refuses to rank anything whose terms were never pulled', () => {
    const named = CARD_SOURCES.filter((c) => c.evidence === 'named-only');
    expect(named.length).toBeGreaterThan(0);
    for (const c of named) {
      const s = scoreCard(c, OWNER);
      expect(s.rankable, c.id).toBe(false);
      expect(s.approvalScore).toBe(0);
      expect(s.blockedReason).toMatch(/never made|not been pulled/);
    }
  });

  it('the ranked list contains only verified rows', () => {
    const ids: Record<string, boolean> = {};
    for (const c of CARD_SOURCES) if (c.evidence !== 'named-only') ids[c.id] = true;
    for (const s of rankCards(OWNER)) expect(ids[s.id], s.id).toBe(true);
  });

  it('surfaces the unrankable rows rather than dropping them', () => {
    const pending = unrankable(OWNER);
    expect(pending.length).toBeGreaterThan(0);
    for (const s of pending) expect(s.blockedReason!.length).toBeGreaterThan(20);
  });
});

describe('ranking is approval x limit, and nothing else', () => {
  it('puts an EIN-underwritten card first at 640', () => {
    const ranked = rankCards(OWNER);
    const top = CARD_SOURCES.filter((c) => c.id === ranked[0].id)[0];
    expect(top.underwriting).toBe('business-cashflow');
  });

  it('says why: personal FICO is not an input', () => {
    const ranked = rankCards(OWNER);
    expect(ranked[0].reasons.join(' ')).toMatch(/personal FICO is not an input/i);
  });

  it('ignores the intro APR entirely — a 0% card does not outrank a bigger line', () => {
    const ranked = rankCards(OWNER);
    const withIntro = ranked.filter((s) => {
      const c = CARD_SOURCES.filter((x) => x.id === s.id)[0];
      return c.introAprMonths !== null && c.introAprMonths >= 12;
    });
    expect(withIntro.length).toBeGreaterThan(0);
    // The top row has no intro offer at all, which is exactly the point.
    const top = CARD_SOURCES.filter((c) => c.id === ranked[0].id)[0];
    expect(top.introAprMonths).toBeNull();
    for (const s of withIntro) expect(s.lendingScore).toBeLessThan(ranked[0].lendingScore);
  });

  it('weights a larger limit band above a smaller one at equal approval odds', () => {
    expect(LIMIT_BAND_WEIGHT.large).toBeGreaterThan(LIMIT_BAND_WEIGHT.mid);
    expect(LIMIT_BAND_WEIGHT.mid).toBeGreaterThan(LIMIT_BAND_WEIGHT.small);
    expect(LIMIT_BAND_WEIGHT.small).toBeGreaterThan(LIMIT_BAND_WEIGHT.micro);
  });

  it('sorts by lending score, descending', () => {
    const ranked = rankCards(OWNER);
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1].lendingScore).toBeGreaterThanOrEqual(ranked[i].lendingScore);
    }
  });

  it('flags which rows cost a personal inquiry', () => {
    const free = freeToApplyNow(OWNER);
    expect(free.length).toBeGreaterThan(5);
    for (const s of free) expect(s.costsAnInquiry).toBe(false);
    const ranked = rankCards(OWNER);
    expect(ranked.filter((s) => s.costsAnInquiry).length).toBeGreaterThan(0);
  });

  it('penalises a cash-flow line whose revenue floor the profile misses', () => {
    const thin = { ...OWNER, annualRevenueUsd: 5000 };
    const withFloor = CARD_SOURCES.filter((c) => c.minAnnualRevenueUsd !== null)[0];
    expect(scoreCard(withFloor, thin).approvalScore).toBeLessThan(
      scoreCard(withFloor, OWNER).approvalScore,
    );
  });

  it('a card whose floor sits above the profile is penalised', () => {
    const above = CARD_SOURCES.filter(
      (c) => c.minFicoReported !== null && c.minFicoReported > OWNER.fico,
    );
    expect(above.length).toBeGreaterThan(0);
    for (const c of above) {
      const s = scoreCard(c, OWNER);
      expect(s.reasons.join(' '), c.id).toMatch(/below the reported/);
    }
  });

  it('inquiries count against personal cards and not against cash-flow cards', () => {
    const heavy: ApplicantProfile = { ...OWNER, recentHardInquiries: 5 };
    const fico = CARD_SOURCES.filter((c) => c.underwriting === 'personal-fico')[0];
    const cash = CARD_SOURCES.filter((c) => c.underwriting === 'business-cashflow')[0];
    expect(scoreCard(fico, heavy).approvalScore).toBeLessThan(scoreCard(fico, OWNER).approvalScore);
    expect(scoreCard(cash, heavy).approvalScore).toBe(scoreCard(cash, OWNER).approvalScore);
  });
});

describe('sequencing is scored, not just cards', () => {
  it('says no to a broad round while an approval is pending', () => {
    const v = sequencingAdvice(OWNER);
    expect(v.safeToApplyNow).toBe(false);
    expect(v.reasoning.join(' ')).toMatch(/re-pull before funding/);
    expect(v.headline).toMatch(/reduce total available credit/);
  });

  it('blocks on a heavy inquiry load even with nothing pending', () => {
    const v = sequencingAdvice({ ...OWNER, approvalPending: false, recentHardInquiries: 4 });
    expect(v.safeToApplyNow).toBe(false);
    expect(v.reasoning.join(' ')).toMatch(/auto-declining/);
  });

  it('allows a measured round on a clean profile', () => {
    const v = sequencingAdvice({
      ...OWNER,
      approvalPending: false,
      recentHardInquiries: 0,
      recentDeclines: 0,
    });
    expect(v.safeToApplyNow).toBe(true);
  });

  it('always puts the no-personal-pull cards first in the order', () => {
    const v = sequencingAdvice(OWNER);
    expect(v.recommendedOrder[0]).toMatch(/EIN-only/);
    expect(v.recommendedOrder.join(' ')).toMatch(/Net-30 vendor accounts/);
    expect(v.recommendedOrder.join(' ')).toMatch(/before any personal-credit application/);
  });
});

describe('the page is honest about how much was verified', () => {
  it('reports verified against requested rather than padding to the target', () => {
    expect(SOURCING_STATUS.verified).toBe(CARD_SOURCES.length);
    expect(SOURCING_STATUS.requested).toBe(100);
    expect(SOURCING_STATUS.verified).toBeLessThan(SOURCING_STATUS.requested);
    expect(SOURCING_STATUS.gap).toMatch(/fabricated terms|invented/i);
  });

  it('bans a stated approval probability and terms for unverified rows', () => {
    const banned = NEVER_PRINTED.join(' ');
    expect(banned).toMatch(/approval probability stated as a percentage/i);
    expect(banned).toMatch(/`named-only`/);
    expect(banned).toMatch(/personal-credit cards in one sitting/i);
  });

  it('bans calling a net-30 vendor account a credit card', () => {
    expect(NEVER_PRINTED.join(' ')).toMatch(/net-30 vendor account described as a credit card/i);
  });

  it('states that interest carries no weight in the ranking', () => {
    expect(SOURCING_STATUS.rankedOn).toMatch(/Interest rate is recorded but carries no weight/i);
  });

  it('records what a fair-credit limit cannot do', () => {
    expect(NEVER_PRINTED.join(' ')).toMatch(/cannot fund a premium-financing strategy|can fund a premium/i);
  });
});
