/**
 * The credit union registry, tested where getting it wrong costs a client.
 *
 * Two failures would do real damage:
 *
 *   1. Treating a rate-sheet figure as a decline threshold. SchoolsFirst
 *      prices at 740 and says in bold that it is not a requirement. An advisor
 *      who reads that as a minimum tells a 690 client not to apply, and a
 *      client told not to apply does not come back.
 *   2. Comparing a 97% rate assumption against a 75% requirement in one
 *      column, which makes the strictest lender on the list look like the most
 *      generous.
 */

import { describe, it, expect } from 'vitest';
import {
  CREDIT_UNIONS,
  RECHECK_AFTER_DAYS,
  stale,
  requirementsOnly,
  reachableFor,
  excludesInvestmentProperty,
  registryGaps,
} from '../shared/creditUnionLenders';

describe('the registry is built from what was actually read', () => {
  it('holds ten institutions', () => {
    expect(CREDIT_UNIONS).toHaveLength(10);
  });

  it('every entry carries a source URL and the date it was read', () => {
    for (const cu of CREDIT_UNIONS) {
      expect(cu.sourceUrl).toMatch(/^https:\/\//);
      expect(cu.readOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('every published figure quotes what the page said', () => {
    for (const cu of CREDIT_UNIONS) {
      for (const f of [cu.maxCltvPct, cu.minCreditScore, cu.maxDtiPct, cu.minLoanUsd, cu.maxLoanUsd]) {
        if (!f) continue;
        expect(f.asPublished.length).toBeGreaterThan(10);
        expect(['requirement', 'rateAssumption']).toContain(f.kind);
      }
    }
  });

  it('names what it could not find rather than leaving a silent null', () => {
    for (const cu of CREDIT_UNIONS) {
      const missing = !cu.maxCltvPct || !cu.minCreditScore || !cu.maxDtiPct;
      if (missing) expect(cu.notPublished.length).toBeGreaterThan(0);
    }
  });

  it('unique ids', () => {
    expect(new Set(CREDIT_UNIONS.map((c) => c.id)).size).toBe(CREDIT_UNIONS.length);
  });
});

describe('a rate assumption is not an underwriting requirement', () => {
  it('grades the SchoolsFirst 740 as a rate assumption, because the page says so', () => {
    const sf = CREDIT_UNIONS.find((c) => c.id === 'schoolsfirst')!;
    expect(sf.minCreditScore!.value).toBe(740);
    expect(sf.minCreditScore!.kind).toBe('rateAssumption');
    expect(sf.minCreditScore!.asPublished).toMatch(/not requirements to apply/);
  });

  it('grades its 97% LTV the same way', () => {
    const sf = CREDIT_UNIONS.find((c) => c.id === 'schoolsfirst')!;
    expect(sf.maxCltvPct!.kind).toBe('rateAssumption');
  });

  it('keeps both out of the requirements view entirely', () => {
    // The whole point: an advisor reading requirementsOnly cannot see a 740
    // and mistake it for a floor.
    const r = requirementsOnly(CREDIT_UNIONS.find((c) => c.id === 'schoolsfirst')!);
    expect(r.minCreditScore).toBeNull();
    expect(r.maxCltvPct).toBeNull();
  });

  it('does keep a figure the institution states as a condition', () => {
    const socal = CREDIT_UNIONS.find((c) => c.id === 'cu-socal')!;
    expect(socal.minCreditScore!.kind).toBe('requirement');
    expect(requirementsOnly(socal).minCreditScore).toBe(660);
    expect(requirementsOnly(socal).maxCltvPct).toBe(80);
  });

  it('grades the USALLIANCE 90% as an assumption, per its own disclaimer', () => {
    const ua = CREDIT_UNIONS.find((c) => c.id === 'usalliance')!;
    expect(ua.maxCltvPct!.kind).toBe('rateAssumption');
    expect(ua.maxCltvPct!.asPublished).toMatch(/Not all applicants will qualify/);
  });

  it('the strictest requirement is not beaten by any looser assumption in the same view', () => {
    // Monterra's 75% is a real limit; SchoolsFirst's 97% and Members 1st's
    // 100% are not. A naive max() over the raw fields would rank Monterra
    // last. Over requirements it is correctly the tightest real one.
    const reqs = CREDIT_UNIONS.map((cu) => ({ id: cu.id, ...requirementsOnly(cu) })).filter(
      (r) => r.maxCltvPct !== null
    );
    const loosest = Math.max(...reqs.map((r) => r.maxCltvPct!));
    expect(loosest).toBe(80);
    expect(reqs.find((r) => r.id === 'monterra')!.maxCltvPct).toBe(75);
    // Neither of the two headline numbers reaches the requirements view.
    expect(reqs.some((r) => r.maxCltvPct === 97 || r.maxCltvPct === 100)).toBe(false);
  });

  it('grades the one DTI figure as an assumption, since it came from an article', () => {
    const ucu = CREDIT_UNIONS.find((c) => c.id === 'university-cu')!;
    expect(ucu.maxDtiPct!.value).toBe(43);
    expect(ucu.maxDtiPct!.kind).toBe('rateAssumption');
    expect(ucu.maxDtiPct!.asPublished).toMatch(/not stated as this institution/i);
  });
});

describe('membership is the first gate, and it is absolute', () => {
  it('rules Navy Federal out for a civilian regardless of credit', () => {
    const r = reachableFor({ military: false }).find((x) => x.id === 'navy-federal')!;
    expect(r.reachable).toBe(false);
    expect(r.reason).toMatch(/No general-public path/);
  });

  it('lets a service member through', () => {
    expect(reachableFor({ military: true }).find((x) => x.id === 'navy-federal')!.reachable).toBe(true);
  });

  it('keeps the open-to-anyone institutions reachable for everybody', () => {
    const none = reachableFor({});
    for (const cu of CREDIT_UNIONS.filter((c) => c.openToAnyone)) {
      expect(none.find((r) => r.id === cu.id)!.reachable).toBe(true);
    }
  });

  it('holds Members 1st to its three states', () => {
    expect(reachableFor({ state: 'PA' }).find((x) => x.id === 'members-1st')!.reachable).toBe(true);
    expect(reachableFor({ state: 'DE' }).find((x) => x.id === 'members-1st')!.reachable).toBe(false);
  });

  it('leaves a client with no affiliations exactly three institutions', () => {
    const open = reachableFor({}).filter((r) => r.reachable);
    expect(open).toHaveLength(3);
    expect(open.map((r) => r.id).sort()).toEqual(['alliant', 'cu-socal', 'penfed']);
  });

  it('does not claim a public path for an institution whose eligibility was never read', () => {
    // USALLIANCE's lending page was read; its membership page was not.
    // Inferring "open to anyone" from the shape of the institution is the
    // kind of plausible guess this registry exists to keep out.
    const ua = CREDIT_UNIONS.find((c) => c.id === 'usalliance')!;
    expect(ua.openToAnyone).toBe(false);
    expect(ua.membership).toMatch(/NOT RETRIEVED/);
    expect(ua.notPublished.join(' ')).toMatch(/reachability here is unknown/);
  });

  it('always gives a reason, reachable or not', () => {
    for (const r of reachableFor({})) expect(r.reason.length).toBeGreaterThan(5);
  });
});

describe('investment property, which ends a strategy before it starts', () => {
  it('finds the two that exclude it outright', () => {
    const ex = excludesInvestmentProperty();
    expect(ex.map((c) => c.id).sort()).toEqual(['members-1st', 'monterra']);
  });

  it('never reads silence as a yes', () => {
    // A page that does not mention investment property is null, not true.
    for (const cu of CREDIT_UNIONS) {
      if (cu.investmentPropertyEligible === null) {
        expect(cu.investmentPropertyNote).toMatch(/[Nn]ot addressed|[Nn]ot retrieved/);
      }
    }
    expect(CREDIT_UNIONS.some((c) => c.investmentPropertyEligible === true)).toBe(false);
  });
});

describe('staleness', () => {
  it('treats a fresh read as current', () => {
    const cu = CREDIT_UNIONS[0];
    expect(stale(cu, new Date('2026-09-20T00:00:00Z'))).toBe(false);
  });

  it('treats a read past the recheck window as stale', () => {
    const cu = CREDIT_UNIONS[0];
    const later = new Date('2026-09-17T00:00:00Z');
    later.setDate(later.getDate() + RECHECK_AFTER_DAYS + 1);
    expect(stale(cu, later)).toBe(true);
  });
});

describe('the gaps are reported, not papered over', () => {
  it('names the institutions whose lending terms were never retrieved', () => {
    const g = registryGaps(new Date('2026-09-20T00:00:00Z'));
    expect(g.withNoLendingTermsRetrieved).toContain('PenFed Credit Union');
    expect(g.withNoLendingTermsRetrieved).toContain('Alliant Credit Union');
  });

  it('distinguishes "not published" from "not retrieved" for those two', () => {
    for (const id of ['penfed', 'alliant']) {
      const cu = CREDIT_UNIONS.find((c) => c.id === id)!;
      expect(cu.notPublished.join(' ')).toMatch(/absent rather than absent-from-publication/);
    }
  });

  it('reports how few institutions state a real requirement', () => {
    const g = registryGaps(new Date('2026-09-20T00:00:00Z'));
    expect(g.totalInstitutions).toBe(10);
    expect(g.withAnyRequirement).toBeLessThan(g.totalInstitutions);
    expect(g.withAnyRequirement).toBeGreaterThan(0);
  });

  it('says plainly that DTI caps are internal credit policy', () => {
    const g = registryGaps();
    expect(g.note).toMatch(/internal credit policy/);
    expect(g.note).toMatch(/has to ask the institution/);
  });

  it('only one institution has any DTI figure at all', () => {
    expect(registryGaps().dtiPublishedBy).toEqual(['University Credit Union']);
  });
});
