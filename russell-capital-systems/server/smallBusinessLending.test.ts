import { describe, it, expect } from 'vitest';
import {
  INDUSTRY_PROFILES,
  scoreIndustry,
  rankIndustries,
  tradesNeedingCapital,
  loadSbaChargeOffRates,
  UnsourcedRateError,
  StaleRateError,
  type SourcedRate,
  type ScoringTerms,
  type Month,
} from '@shared/smallBusinessLending/industryRisk';
import {
  priceAdvance,
  trueApr,
  buildDisclosure,
  breakEvenSeedMultiple,
  ConsumerDwellingSecuredError,
  ConsumerPurposeError,
  DisclosureIncompleteError,
  type AdvanceTerms,
} from '@shared/smallBusinessLending/loanPricing';
import {
  scoreProspect,
  buildEmailCampaign,
  buildSmsCampaign,
  monthlyTargetList,
  MissingConsentError,
  CanSpamError,
  AvatarDisclosureError,
  type Prospect,
  type CampaignConfig,
  type ConsentRecord,
} from '@shared/smallBusinessLending/prospecting';

const NOW = new Date('2026-09-17T00:00:00Z');

const goodRate: SourcedRate = {
  value: 0.04,
  source: 'SBA 7(a) FOIA extract',
  asOf: '2026-06-30',
  sampleSize: 12_400,
  basis: 'sba-7a-charge-off',
};

const baseTerms: ScoringTerms = {
  principal: 100_000,
  totalRepayment: 122_000,
  termMonths: 6,
  fundingMonth: 3,
  remittance: 'weekly',
};

const landscaping = INDUSTRY_PROFILES.find((p) => p.naics === '561730')!;
const trucking = INDUSTRY_PROFILES.find((p) => p.naics === '484121')!;
const restaurant = INDUSTRY_PROFILES.find((p) => p.naics === '722511')!;

describe('industryRisk — sourcing contract', () => {
  it('refuses to score without a source', () => {
    expect(() => scoreIndustry(landscaping, undefined, baseTerms, NOW)).toThrow(UnsourcedRateError);
  });

  it('refuses a rate with a blank source string', () => {
    const bad = { ...goodRate, source: '   ' };
    expect(() => scoreIndustry(landscaping, bad, baseTerms, NOW)).toThrow(UnsourcedRateError);
  });

  it('refuses a stale rate', () => {
    const stale = { ...goodRate, asOf: '2023-01-01' };
    expect(() => scoreIndustry(landscaping, stale, baseTerms, NOW)).toThrow(StaleRateError);
  });
});

describe('industryRisk — seasonality is the edge', () => {
  it('penalizes funding outside the capital window', () => {
    const inSeason = scoreIndustry(landscaping, goodRate, { ...baseTerms, fundingMonth: 3 }, NOW);
    const outSeason = scoreIndustry(landscaping, goodRate, { ...baseTerms, fundingMonth: 8 }, NOW);

    expect(inSeason.inSeason).toBe(true);
    expect(outSeason.inSeason).toBe(false);
    expect(outSeason.expectedLossRate).toBeGreaterThan(inSeason.expectedLossRate);
    expect(outSeason.score).toBeLessThan(inSeason.score);
  });

  it('knows which trades need capital in March', () => {
    const march = tradesNeedingCapital(3);
    expect(march.map((t) => t.naics)).toContain('561730'); // landscaping
    expect(march.map((t) => t.naics)).toContain('238160'); // roofing
  });

  it('knows tax prep needs money in December, not April', () => {
    expect(tradesNeedingCapital(12).map((t) => t.naics)).toContain('541213');
    expect(tradesNeedingCapital(4).map((t) => t.naics)).not.toContain('541213');
  });

  it('puts the fitness cohort in the pre-January window', () => {
    expect(tradesNeedingCapital(11).map((t) => t.naics)).toContain('713940');
  });
});

describe('industryRisk — cadence must match the collection cycle', () => {
  it('flags a daily remittance against a 60-day collection lag', () => {
    const electrical = INDUSTRY_PROFILES.find((p) => p.naics === '238210')!;
    const r = scoreIndustry(electrical, goodRate, { ...baseTerms, remittance: 'daily' }, NOW);
    expect(r.cadenceMismatch).toBe(true);
    expect(r.flags.join(' ')).toMatch(/cannot service a daily remittance/);
  });

  it('accepts a daily remittance where cash arrives at the counter', () => {
    const auto = INDUSTRY_PROFILES.find((p) => p.naics === '811111')!;
    const r = scoreIndustry(auto, goodRate, { ...baseTerms, remittance: 'daily', fundingMonth: 3 }, NOW);
    expect(r.cadenceMismatch).toBe(false);
  });
});

describe('industryRisk — thin margins cannot carry priced money', () => {
  it('penalizes a sub-1.5x seed multiple', () => {
    const r = scoreIndustry(trucking, goodRate, { ...baseTerms, fundingMonth: 3 }, NOW);
    expect(r.flags.join(' ')).toMatch(/Seed multiple/);
  });

  it('ranks a strong seasonal trade above a thin-margin one at identical loss rates', () => {
    const rates = new Map<string, SourcedRate>([
      ['561730', goodRate],
      ['484121', goodRate],
    ]);
    const ranked = rankIndustries(rates, { ...baseTerms, fundingMonth: 3 }, NOW);
    const land = ranked.find((r) => r.naics === '561730')!;
    const truck = ranked.find((r) => r.naics === '484121')!;
    expect(land.score).toBeGreaterThan(truck.score);
  });

  it('omits trades with no sourced rate rather than guessing', () => {
    const rates = new Map<string, SourcedRate>([['561730', goodRate]]);
    const ranked = rankIndustries(rates, baseTerms, NOW);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].naics).toBe('561730');
  });

  it('carries the restaurant profile as the weakest seed multiple in the table', () => {
    const multiples = INDUSTRY_PROFILES.map((p) => p.seedMultiple);
    expect(restaurant.seedMultiple).toBe(Math.min(...multiples));
  });
});

describe('loadSbaChargeOffRates', () => {
  it('computes dollar-weighted rates and attaches the source', () => {
    const rows = [
      { naics: '561730', grossApproval: 1_000_000, loanStatus: 'CHGOFF', grossChargeOffAmount: 100_000, approvalFiscalYear: 2020 },
      { naics: '561730', grossApproval: 1_000_000, loanStatus: 'PIF', grossChargeOffAmount: 0, approvalFiscalYear: 2020 },
    ];
    const many = Array.from({ length: 30 }, () => rows).flat();
    const out = loadSbaChargeOffRates(many, { sourceLabel: 'SBA FOIA', asOf: '2026-06-30', minLoans: 10 });
    const rate = out.get('561730')!;
    expect(rate.value).toBeCloseTo(0.05, 5);
    expect(rate.source).toBe('SBA FOIA');
    expect(rate.sampleSize).toBe(60);
  });

  it('drops cohorts below the minimum loan count rather than publishing noise', () => {
    const rows = [
      { naics: '722511', grossApproval: 100_000, loanStatus: 'CHGOFF', grossChargeOffAmount: 100_000, approvalFiscalYear: 2021 },
    ];
    const out = loadSbaChargeOffRates(rows, { sourceLabel: 'SBA FOIA', asOf: '2026-06-30', minLoans: 50 });
    expect(out.has('722511')).toBe(false);
  });

  it('refuses to load without a source label', () => {
    expect(() => loadSbaChargeOffRates([], { sourceLabel: '', asOf: '2026-06-30' })).toThrow();
  });
});

describe('loanPricing — the factor rate lies and the APR does not', () => {
  const terms: AdvanceTerms = {
    amountFunded: 100_000,
    factorRate: 1.22,
    termMonths: 6,
    remittance: 'daily',
    purpose: 'business',
  };

  it('computes a true APR far above the naive factor reading', () => {
    const r = priceAdvance(terms);
    // Naive reading: 22% over half a year reads like 44%.
    // Real APR on a daily-amortizing stream is far higher.
    expect(r.estimatedApr).toBeGreaterThan(0.70);
    expect(r.factorRateUnderstatement).toBeGreaterThan(0.25);
  });

  it('produces a lower APR for the same factor over a longer term', () => {
    const short = trueApr({ ...terms, termMonths: 6 });
    const long = trueApr({ ...terms, termMonths: 12 });
    expect(long).toBeLessThan(short);
  });

  it('raises the APR when fees are withheld at funding', () => {
    const clean = trueApr(terms);
    const withFees = trueApr({ ...terms, upfrontFees: 5_000 });
    expect(withFees).toBeGreaterThan(clean);
  });

  it('accepts totalRepayment in place of a factor rate', () => {
    const a = priceAdvance(terms);
    const b = priceAdvance({ ...terms, factorRate: undefined, totalRepayment: 122_000 });
    expect(b.estimatedApr).toBeCloseTo(a.estimatedApr, 6);
  });

  it('refuses when repayment does not exceed principal', () => {
    expect(() => priceAdvance({ ...terms, factorRate: 0.99 })).toThrow(RangeError);
  });
});

describe('loanPricing — the hard line', () => {
  it('refuses any advance secured by a principal dwelling', () => {
    expect(() =>
      priceAdvance({
        amountFunded: 50_000,
        factorRate: 2.0,
        termMonths: 12,
        remittance: 'monthly',
        purpose: 'business',
        securedByPrincipalDwelling: true,
      }),
    ).toThrow(ConsumerDwellingSecuredError);
  });

  it('names the lawful alternative in the refusal', () => {
    try {
      priceAdvance({
        amountFunded: 50_000,
        factorRate: 2.0,
        termMonths: 12,
        remittance: 'monthly',
        purpose: 'business',
        securedByPrincipalDwelling: true,
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as Error).message).toMatch(/tax lien certificate/);
    }
  });

  it('refuses consumer-purpose credit outright', () => {
    expect(() =>
      priceAdvance({
        amountFunded: 50_000,
        factorRate: 1.3,
        termMonths: 12,
        remittance: 'monthly',
        purpose: 'consumer',
      }),
    ).toThrow(ConsumerPurposeError);
  });
});

describe('loanPricing — disclosure', () => {
  const pricing = priceAdvance({
    amountFunded: 100_000,
    factorRate: 1.22,
    termMonths: 6,
    remittance: 'daily',
    purpose: 'business',
  });

  it('refuses to assemble with a field missing', () => {
    expect(() =>
      buildDisclosure({
        pricing,
        providerLegalName: 'Russell Capital Lending LLC',
        providerLicenseOrRegistration: '',
        prepaymentPolicy: 'No penalty.',
        collateralDescription: '',
        personalGuarantee: true,
        stateOfBorrower: 'NC',
      }),
    ).toThrow(DisclosureIncompleteError);
  });

  it('prints the APR and flags CFDL states', () => {
    const d = buildDisclosure({
      pricing,
      providerLegalName: 'Russell Capital Lending LLC',
      providerLicenseOrRegistration: 'NC-0001',
      prepaymentPolicy: 'No penalty.',
      collateralDescription: 'Blanket UCC-1.',
      personalGuarantee: true,
      stateOfBorrower: 'CA',
    });
    expect(d.requiresStateSpecificForm).toBe(true);
    expect(d.text).toMatch(/ESTIMATED ANNUAL PERCENTAGE RATE/);
    expect(d.text).toMatch(/TOTAL REPAYMENT AMOUNT/);
  });

  it('states plainly when no collateral is taken', () => {
    const d = buildDisclosure({
      pricing,
      providerLegalName: 'Russell Capital Lending LLC',
      providerLicenseOrRegistration: 'NC-0001',
      prepaymentPolicy: 'No penalty.',
      collateralDescription: '',
      personalGuarantee: false,
      stateOfBorrower: 'NC',
    });
    expect(d.text).toMatch(/COLLATERAL: None taken\./);
    expect(d.requiresStateSpecificForm).toBe(false);
  });
});

describe('breakEvenSeedMultiple', () => {
  it('shows a thin-margin borrower cannot carry an expensive advance', () => {
    const pricing = priceAdvance({
      amountFunded: 100_000,
      factorRate: 1.22,
      termMonths: 6,
      remittance: 'daily',
      purpose: 'business',
    });
    const thin = breakEvenSeedMultiple(pricing, restaurant.grossMarginPct);
    const fat = breakEvenSeedMultiple(pricing, landscaping.grossMarginPct);
    expect(thin.requiredRevenueMultiple).toBeGreaterThan(fat.requiredRevenueMultiple);
    expect(thin.requiredRevenueMultiple).toBeGreaterThan(restaurant.seedMultiple);
    expect(thin.plain).toMatch(/Re-price or decline/);
  });
});

describe('prospecting — intent and credit concern are scored separately', () => {
  const stacked: Prospect = {
    id: 'p1',
    businessName: 'Stacked Roofing',
    naics: '238160',
    state: 'NC',
    ownerEmail: 'a@example.com',
    signals: ['ucc-stacking', 'tax-lien-filed'],
  };
  const clean: Prospect = {
    id: 'p2',
    businessName: 'Seasonal Landscaping',
    naics: '561730',
    state: 'NC',
    ownerEmail: 'b@example.com',
    signals: ['ucc-filing-existing'],
  };

  it('does not treat desperation as a buying signal alone', () => {
    const s = scoreProspect(stacked, 3);
    expect(s.intentScore).toBeGreaterThan(8);
    expect(s.concernScore).toBeGreaterThan(8);
    expect(s.tier).toBe('underwrite-hard');
  });

  it('puts a seasonal, lightly-levered prospect at the top', () => {
    const s = scoreProspect(clean, 3);
    expect(s.tier).toBe('call-first');
  });

  it('adds the seasonal signal automatically inside the window', () => {
    const inWindow = scoreProspect(clean, 3);
    const outWindow = scoreProspect(clean, 8);
    expect(inWindow.intentScore).toBeGreaterThan(outWindow.intentScore);
  });

  it('cites a lawful public source for every signal used', () => {
    const s = scoreProspect(stacked, 3);
    for (const r of s.reasons) expect(r).toMatch(/Public|calendar|registry|docket|boards|platforms/);
  });

  it('builds a month-driven target list', () => {
    const list = monthlyTargetList([stacked, clean], 3);
    expect(list.inWindow.length).toBeGreaterThan(0);
    expect(list.plain).toMatch(/Roofing|Landscaping/);
  });
});

describe('prospecting — channel law', () => {
  const config: CampaignConfig = {
    channel: 'email',
    scripts: [
      { id: 's1', subject: 'Spring materials', body: 'Capital before your season.' },
      { id: 's2', subject: 'Second touch', body: 'Still here when you need materials.' },
    ],
    cadenceDays: 3,
    maxTouches: 3,
    physicalPostalAddress: '123 Main St, Castle Hayne, NC 28429',
    optOutInstruction: 'Reply UNSUBSCRIBE to stop.',
    referralDiscountPct: 10,
  };

  const p: Prospect = {
    id: 'p1', businessName: 'Roofer', naics: '238160', state: 'NC',
    ownerEmail: 'r@example.com', ownerMobile: '+19105551212', signals: [],
  };

  it('builds an email campaign with rotating scripts', () => {
    const touches = buildEmailCampaign([p], config);
    expect(touches).toHaveLength(3);
    expect(touches.map((t) => t.scriptId)).toEqual(['s1', 's2', 's1']);
    expect(touches.map((t) => t.dayOffset)).toEqual([0, 3, 6]);
  });

  it('puts the postal address and opt-out in every message', () => {
    for (const t of buildEmailCampaign([p], config)) {
      expect(t.body).toMatch(/Castle Hayne/);
      expect(t.body).toMatch(/UNSUBSCRIBE/);
    }
  });

  it('refuses an email campaign with no postal address', () => {
    expect(() => buildEmailCampaign([p], { ...config, physicalPostalAddress: '' })).toThrow(CanSpamError);
  });

  it('honors the suppression list', () => {
    expect(buildEmailCampaign([p], config, new Set(['p1']))).toHaveLength(0);
  });

  it('refuses an SMS campaign with no consent record', () => {
    expect(() => buildSmsCampaign([p], { ...config, channel: 'sms' }, [])).toThrow(MissingConsentError);
  });

  it('refuses SMS when the consent is for a different number', () => {
    const consent: ConsentRecord = {
      prospectId: 'p1', method: 'web form', capturedAt: '2026-01-01T00:00:00Z',
      disclosureShown: 'Msg and data rates apply.', number: '+19105559999',
    };
    expect(() => buildSmsCampaign([p], { ...config, channel: 'sms' }, [consent])).toThrow(MissingConsentError);
  });

  it('refuses SMS when consent was revoked', () => {
    const consent: ConsentRecord = {
      prospectId: 'p1', method: 'web form', capturedAt: '2026-01-01T00:00:00Z',
      disclosureShown: 'Msg and data rates apply.', number: '+19105551212',
      revokedAt: '2026-02-01T00:00:00Z',
    };
    expect(() => buildSmsCampaign([p], { ...config, channel: 'sms' }, [consent])).toThrow(MissingConsentError);
  });

  it('sends SMS with valid matching consent and appends STOP', () => {
    const consent: ConsentRecord = {
      prospectId: 'p1', method: 'web form', capturedAt: '2026-01-01T00:00:00Z',
      disclosureShown: 'Msg and data rates apply.', number: '+19105551212',
    };
    const touches = buildSmsCampaign([p], { ...config, channel: 'sms' }, [consent]);
    expect(touches).toHaveLength(3);
    for (const t of touches) expect(t.body).toMatch(/Reply STOP/);
  });

  it('refuses an undisclosed synthetic avatar script', () => {
    const bad: CampaignConfig = {
      ...config,
      scripts: [{ id: 'v1', body: 'Hi, it is Sam here with an offer.', avatarPersona: 'Sam' }],
    };
    expect(() => buildEmailCampaign([p], bad)).toThrow(AvatarDisclosureError);
  });

  it('accepts a disclosed synthetic avatar script', () => {
    const ok: CampaignConfig = {
      ...config,
      scripts: [{ id: 'v1', body: 'This is an AI-generated video message from Russell Capital.', avatarPersona: 'Sam' }],
    };
    expect(buildEmailCampaign([p], ok)).toHaveLength(3);
  });
});
