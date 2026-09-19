import { describe, expect, it } from 'vitest';
import {
  APPROVED_DISCLOSURE,
  APPROVED_DISCLOSURE_PARAGRAPHS,
  BANNED_CLAIMS,
  EVIDENCE_TALLY,
  PERMITTED_USES,
  checkClaim,
} from '../shared/calibrationDisclosure';
import { BGA2_ACCOUNT_2_SEGMENTS } from '../shared/securianBGA2Statement';

describe('the tally matches the statements it came from', () => {
  it('counts the best-evidenced account exactly as its module records it', () => {
    expect(EVIDENCE_TALLY.bestEvidencedAccount.segments).toBe(BGA2_ACCOUNT_2_SEGMENTS.length);
  });

  it('the best-evidenced account runs AGAINST the stronger claim', () => {
    expect(EVIDENCE_TALLY.bestEvidencedAccount.direction).toMatch(/overstated/);
    // Re-derived here rather than trusted: the published 105%/-2.50% description
    // pays more than the account did, on every segment.
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      const published = row.indexGrowthRatePct * 1.05 - 2.5;
      expect(published, `segment ${row.segmentStart}`).toBeGreaterThan(row.segmentCreditingRatePct);
    }
  });

  it('does not claim a net direction it does not have', () => {
    expect(EVIDENCE_TALLY.netDirection).toMatch(/no net direction/i);
    expect(EVIDENCE_TALLY.segmentsWherePrintedExceededObserved).toBeGreaterThan(
      EVIDENCE_TALLY.segmentsWhereObservedExceededPrinted,
    );
  });

  it('states the real number of statements reviewed', () => {
    expect(EVIDENCE_TALLY.statementsReviewed).toBe(2);
    expect(EVIDENCE_TALLY.accountsNeverObserved).toBeGreaterThan(0);
  });
});

describe('the approved disclosure claims only what is supported', () => {
  it('says the difference runs both ways', () => {
    expect(APPROVED_DISCLOSURE).toMatch(/both directions/);
    expect(APPROVED_DISCLOSURE).toMatch(/higher than what the account paid/);
  });

  it('asserts nothing about the size or direction of returns', () => {
    expect(APPROVED_DISCLOSURE).not.toMatch(/higher returns|better returns|outperform|superior/i);
    expect(APPROVED_DISCLOSURE).not.toMatch(/many times/i);
  });

  it('names no carrier and characterises nobody else\'s documents', () => {
    for (const name of ['securian', 'minnesota life', 'pacific life']) {
      expect(APPROVED_DISCLOSURE.toLowerCase()).not.toContain(name);
    }
    expect(APPROVED_DISCLOSURE).not.toMatch(/incorrect|false|misleading/i);
  });

  it('disclaims illustration status and points at AG 49-A', () => {
    expect(APPROVED_DISCLOSURE).toMatch(/not a sales illustration/i);
    expect(APPROVED_DISCLOSURE).toMatch(/49-A/);
    expect(APPROVED_DISCLOSURE).toMatch(/your contract/i);
  });

  it('passes its own screen', () => {
    expect(checkClaim(APPROVED_DISCLOSURE).allowed).toBe(true);
  });

  it('carries no hard line breaks inside a paragraph, so phrases stay whole', () => {
    for (const p of APPROVED_DISCLOSURE_PARAGRAPHS) {
      expect(p, p.slice(0, 40)).not.toContain('\n');
      expect(p.length).toBeGreaterThan(80);
    }
  });
});

describe('the screen blocks the claims that were actually proposed', () => {
  const proposed = [
    'The actual returns are much higher than the brochures claim.',
    'Returns many times higher than what the brochure states.',
    'Built from many client statements reviewed over years and years.',
    'We found their brochures are incorrect after reviewing client statements.',
  ];

  it('blocks every one of them', () => {
    for (const text of proposed) {
      const v = checkClaim(text);
      expect(v.allowed, `allowed: "${text}"`).toBe(false);
    }
  });

  it('explains why and offers the supported version instead', () => {
    for (const text of proposed) {
      const v = checkClaim(text);
      if (v.allowed) continue;
      expect(v.reason.length).toBeGreaterThan(40);
      expect(v.instead.length).toBeGreaterThan(20);
    }
  });

  it('lets ordinary accurate copy through', () => {
    const fine = [
      'Our crediting model is calibrated to in-force policy statements.',
      'The printed participation rate did not determine the credit on the accounts we examined.',
      'This is not a sales illustration.',
    ];
    for (const text of fine) expect(checkClaim(text).allowed, text).toBe(true);
  });

  it('every banned claim carries a reason and a replacement', () => {
    expect(BANNED_CLAIMS.length).toBe(4);
    for (const b of BANNED_CLAIMS) {
      expect(b.why.length).toBeGreaterThan(50);
      expect(b.instead.length).toBeGreaterThan(20);
    }
  });
});

describe('permitted use turns on whether the conversation is a sale', () => {
  it('allows the in-force review and the engine, and bans the illustration', () => {
    expect(PERMITTED_USES.yes.join(' ')).toMatch(/in-force review/i);
    expect(PERMITTED_USES.no.join(' ')).toMatch(/illustration or projection/i);
    expect(PERMITTED_USES.no.join(' ')).toMatch(/49-A/);
  });

  it('flags that this disclosure is itself advertising needing review', () => {
    expect(PERMITTED_USES.reviewBeforeUse).toMatch(/advertising review/i);
    expect(PERMITTED_USES.reviewBeforeUse).toMatch(/has not been through it/i);
  });
});
