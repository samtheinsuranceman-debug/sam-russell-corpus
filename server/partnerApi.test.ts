/**
 * The partner API, tested at the boundary that matters.
 *
 * The interesting assertions here are not "does it return data". They are
 * "does it refuse", and "does the thing we must not publish stay on this side
 * of the wire". A renderer that behaves well is good; a boundary that cannot
 * hand out the forbidden number is better, because the next front end will not
 * be written by us.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { registerPartnerApi } from './partnerApi';
import { DRAFTED_COUNT, statusBadge, statusSentence } from '../shared/patentStatus';

const KEY = 'test-partner-key-not-real';
let server: Server;
let base = '';

beforeAll(async () => {
  process.env.PARTNER_API_KEY = KEY;
  const app = express();
  registerPartnerApi(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  base = `http://127.0.0.1:${port}/api/partner`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const auth = { headers: { Authorization: `Bearer ${KEY}` } };

describe('the bearer gate', () => {
  it('refuses a request with no key', async () => {
    const r = await fetch(`${base}/index-history?index=SP500`);
    expect(r.status).toBe(401);
    expect(r.headers.get('www-authenticate')).toContain('Bearer');
  });

  it('refuses a wrong key', async () => {
    const r = await fetch(`${base}/index-history?index=SP500`, {
      headers: { Authorization: 'Bearer wrong' },
    });
    expect(r.status).toBe(401);
  });

  it('refuses a key that is a prefix of the real one, and one that extends it', async () => {
    // The compare hashes both sides before timingSafeEqual, so length no
    // longer participates in the decision. Both of these would pass a careless
    // `startsWith` and both must fail a correct compare.
    for (const wrong of [KEY.slice(0, KEY.length - 1), KEY + 'x', KEY.toUpperCase()]) {
      const r = await fetch(`${base}/catalog`, { headers: { Authorization: `Bearer ${wrong}` } });
      expect(r.status, JSON.stringify(wrong)).toBe(401);
    }
  });

  it('tolerates whitespace around the key, on purpose', async () => {
    // Both sides are trimmed: the header token by the gate, the expected value
    // when it is read from the environment. That is deliberate — a key pasted
    // into a Railway variable or a WordPress settings field routinely picks up
    // a trailing space, and failing that request produces a 401 nobody can
    // debug from the outside. The first version of the test above expected
    // these to be rejected; the code was right and the expectation was wrong,
    // so the behaviour is pinned here rather than quietly changed.
    for (const padded of [' ' + KEY, KEY + ' ', '  ' + KEY + '  ']) {
      const r = await fetch(`${base}/catalog`, { headers: { Authorization: `Bearer ${padded}` } });
      expect(r.status, JSON.stringify(padded)).toBe(200);
    }
  });

  it('accepts the exact key, so the gate is not simply refusing everything', async () => {
    // Without this, every assertion above would pass on a broken compare.
    const r = await fetch(`${base}/catalog`, auth);
    expect(r.status).toBe(200);
  });

  it('lets health through unauthenticated, so misconfigured can be told from unauthorised', async () => {
    const r = await fetch(`${base}/health`);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.ok).toBe(true);
    expect(b.configured).toBe(true);
    // Health must reveal no figures.
    expect(JSON.stringify(b)).not.toMatch(/accountValue|creditedRate/);
  });
});

describe('index history', () => {
  it('returns a dated series with its own age', async () => {
    const r = await fetch(`${base}/index-history?index=SP500&years=30`, auth);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.index).toBe('SP500');
    expect(b.index_age_years).toBeGreaterThanOrEqual(25);
    expect(Array.isArray(b.years)).toBe(true);
    expect(b.years.length).toBeGreaterThanOrEqual(10);
    expect(b.years[0]).toHaveProperty('year');
    expect(b.years[0]).toHaveProperty('change');
  });

  it('names what the series is anchored to rather than leaving a caller to guess', async () => {
    const r = await fetch(`${base}/index-history?index=SP500`, auth);
    const b = await r.json();
    expect(b.basis).toBeTruthy();
    expect(String(b.basis)).toMatch(/anchor/i);
  });

  it('404s an index it does not hold, and says which it does', async () => {
    const r = await fetch(`${base}/index-history?index=NOT_A_REAL_INDEX`, auth);
    expect(r.status).toBe(404);
    const b = await r.json();
    expect(Array.isArray(b.available)).toBe(true);
  });

  it('never returns fewer than ten years even when asked for fewer', async () => {
    const r = await fetch(`${base}/index-history?index=SP500&years=2`, auth);
    const b = await r.json();
    expect(b.years.length).toBeGreaterThanOrEqual(10);
  });
});

describe('the time machine returns both panels, and withholds the average', () => {
  it('returns the illustration and its historical disclosure together', async () => {
    const r = await fetch(`${base}/time-machine?premium=25000&fundingYears=5&years=30`, auth);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(Array.isArray(b.boring)).toBe(true);
    expect(Array.isArray(b.historical)).toBe(true);
    expect(b.boring.length).toBeGreaterThan(0);
    expect(b.historical.length).toBeGreaterThan(0);
  });

  it('does not let any aggregate crediting rate cross the boundary', async () => {
    const r = await fetch(`${base}/time-machine?premium=25000&years=30`, auth);
    const text = await r.text();
    // These exist on the engine result and must not be in the payload.
    expect(text).not.toContain('historicalAvgRate');
    expect(text).not.toContain('boringAvgRate');
    expect(text).not.toContain('avDifferencePct');
    expect(text.toLowerCase()).not.toContain('geometric');
  });

  it('withholds the loan arbitrage figures too', async () => {
    const r = await fetch(`${base}/time-machine?premium=25000`, auth);
    const text = await r.text();
    expect(text).not.toContain('loanCostOverstatement');
    expect(text).not.toContain('statedLoanInterest');
  });

  it('carries the mandated notice verbatim', async () => {
    const r = await fetch(`${base}/time-machine?premium=25000`, auth);
    const b = await r.json();
    expect(b.notice).toBe(
      'Historical index changes shown in this illustration are not indicative of future returns.'
    );
  });

  it('caps the illustrated rate at 6.5% however high the caller asks', async () => {
    const r = await fetch(`${base}/time-machine?premium=25000&ag49Rate=14`, auth);
    const b = await r.json();
    expect(b.ag49Rate).toBeLessThanOrEqual(6.5);
  });

  it('returns crediting as a percentage, not the engine decimal', async () => {
    const r = await fetch(`${base}/time-machine?premium=25000`, auth);
    const b = await r.json();
    const rates = b.historical.map((x: { creditedRate: number }) => x.creditedRate);
    // A decimal convention would put every value under 1.
    expect(Math.max(...rates)).toBeGreaterThan(1);
    expect(Math.max(...rates)).toBeLessThanOrEqual(100);
  });

  it('reports floor-protected years, which is the point of the exhibit', async () => {
    const r = await fetch(`${base}/time-machine?premium=25000&years=30`, auth);
    const b = await r.json();
    expect(typeof b.floorProtectedYears).toBe('number');
    expect(b.floorProtectedYears).toBeGreaterThan(0);
  });
});

describe('the catalogue tells a partner the legal status, and nothing privileged', () => {
  it('carries the IP sentence so a partner never composes its own', async () => {
    const r = await fetch(`${base}/catalog`, auth);
    const b = await r.json();
    expect(b.ip.statusSentence).toBe(statusSentence());
    expect(b.ip.badge).toBe(statusBadge());
    expect(b.ip.applicationsFiled).toBe(0);
    expect(b.ip.applicationsDrafted).toBe(DRAFTED_COUNT);
    // The sentence must deny the claim, not make it.
    expect(b.ip.badge).not.toBe('Patent Pending');
  });

  it('never sends the catalogue notes or the application file paths', async () => {
    // The notes now carry the pre-filing review's findings — which drafted
    // claims recite hardware that does not exist. That is work product and it
    // does not belong on a partner's marketing page. The paths point at
    // confidential PDFs. Neither is projected, and this is the assertion that
    // keeps a future `...c` spread from quietly including both.
    const r = await fetch(`${base}/catalog?include=roadmap`, auth);
    const raw = await r.text();
    expect(raw).not.toContain('applicationDraft');
    expect(raw).not.toContain('docs/patents');
    expect(raw).not.toContain('.pdf');
    expect(raw).not.toContain('FPGA');
    for (const item of JSON.parse(raw).offered) {
      expect(Object.keys(item).sort()).toEqual(['ref', 'title']);
    }
  });

  it('offers only what is built, and says how many it held back', async () => {
    const r = await fetch(`${base}/catalog`, auth);
    const b = await r.json();
    expect(b.offered.length).toBe(b.counts.built);
    expect(b.offered.length).toBeLessThan(b.ip.claims);
  });
});

describe('the calculators', () => {
  it('runs a Monte Carlo and returns bands, not raw paths', async () => {
    const r = await fetch(`${base}/monte-carlo?initial=500000&years=30&return=7&volatility=15`, auth);
    const b = await r.json();
    expect(r.status).toBe(200);
    expect(b.summary.probabilityOfSuccess).toBeGreaterThanOrEqual(0);
    expect(b.summary.probabilityOfSuccess).toBeLessThanOrEqual(100);
    expect(b.bands.length).toBeGreaterThan(0);
    // Twenty full paths is a payload a chart does not need.
    expect(b.samplePaths).toBeUndefined();
    expect(b.basis).toContain('not a forecast');
  });

  it('clamps the simulation count, so it cannot be used as a load generator', async () => {
    const r = await fetch(`${base}/monte-carlo?simulations=5000000&years=500`, auth);
    expect(r.status).toBe(200);
    const b = await r.json();
    // years clamps to 50, and the bands follow the clamped horizon.
    expect(b.bands.length).toBeLessThanOrEqual(51);
  });

  it('taxes a joint household as joint, however the partner spells it', async () => {
    const [joint, married] = await Promise.all([
      fetch(`${base}/tax?income=400000&filing=joint&state=TX`, auth).then((x) => x.json()),
      fetch(`${base}/tax?income=400000&filing=married&state=TX`, auth).then((x) => x.json()),
    ]);
    expect(married.federalTax).toBe(joint.federalTax);
    // And a single filer on the same income pays more, so the mapping is not
    // quietly collapsing everything to one status.
    const single = await fetch(`${base}/tax?income=400000&filing=single&state=TX`, auth).then((x) => x.json());
    expect(single.federalTax).toBeGreaterThan(joint.federalTax);
  });

  it('refuses a state it holds no rate for, and names the ones it has', async () => {
    const r = await fetch(`${base}/tax?income=100000&state=ZZ`, auth);
    expect(r.status).toBe(400);
    const b = await r.json();
    expect(b.error).toBe('unknown_state');
    expect(b.available).toContain('TX');
  });

  it('computes an estate tax that rises with the estate', async () => {
    const small = await fetch(`${base}/estate-tax?estate=5000000&filing=married`, auth).then((x) => x.json());
    const large = await fetch(`${base}/estate-tax?estate=60000000&filing=married`, auth).then((x) => x.json());
    expect(large.federalEstateTax).toBeGreaterThan(small.federalEstateTax);
    expect(large.netToHeirs).toBeLessThan(large.grossEstate);
    // State estate tax is a real bill in several states and this does not
    // model it. Saying so is the difference between an estimate and a claim.
    expect(large.basis).toContain('State estate');
  });

  it('every calculator states the basis of its own answer', async () => {
    for (const path of ['monte-carlo', 'tax?income=100000', 'estate-tax?estate=1000000']) {
      const b = await fetch(`${base}/${path}`, auth).then((x) => x.json());
      expect(typeof b.basis, path).toBe('string');
      expect(b.basis.length, path).toBeGreaterThan(40);
    }
  });

  it('keeps the calculators behind the same bearer gate as everything else', async () => {
    for (const path of ['monte-carlo', 'tax', 'estate-tax']) {
      const r = await fetch(`${base}/${path}`);
      expect(r.status, path).toBe(401);
    }
  });

  const MORTGAGE = 'balance=650000&rate=6.75&termMonths=360&payment=4216&homeValue=900000&income=450000&age=45';

  it('runs the mortgage analysis from seven values', async () => {
    const r = await fetch(`${base}/mortgage?${MORTGAGE}`, auth);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.current.totalInterest).toBeGreaterThan(0);
    expect(b.accelerated.payoffMonths).toBeLessThan(b.current.payoffMonths);
    expect(b.saved.interest).toBeGreaterThan(0);
    expect(b.byYear.length).toBeGreaterThan(0);
  });

  it('asks for the two values it cannot default, and names the rest', async () => {
    const r = await fetch(`${base}/mortgage?rate=6.75`, auth);
    expect(r.status).toBe(400);
    const b = await r.json();
    expect(b.error).toBe('missing_inputs');
    expect(b.required).toContain('balance');
    expect(b.required).toContain('homeValue');
  });

  it('derives the crediting rate from the strategy, and will not take one', async () => {
    // The rate is no longer a number anyone supplies. Asking for an absurd one
    // must change nothing, because the parameter is not read at all.
    const [plain, asked] = await Promise.all([
      fetch(`${base}/mortgage?${MORTGAGE}`, auth).then((x) => x.json()),
      fetch(`${base}/mortgage?${MORTGAGE}&creditRate=25`, auth).then((x) => x.json()),
    ]);
    expect(asked.policy.finalCashValue).toBe(plain.policy.finalCashValue);
    expect(plain.crediting.ratePct).toBeGreaterThan(0);
    expect(plain.crediting.startYear).toBe(1929);
    expect(plain.crediting.endYear).toBe(2025);
  });

  it('a richer index strategy credits more, and the illustration follows', async () => {
    const [capped, uncapped] = await Promise.all([
      fetch(`${base}/mortgage?${MORTGAGE}&cap=7.5`, auth).then((x) => x.json()),
      fetch(`${base}/mortgage?${MORTGAGE}&cap=none`, auth).then((x) => x.json()),
    ]);
    expect(uncapped.crediting.uncapped).toBe(true);
    expect(uncapped.crediting.capPct).toBeNull();
    expect(uncapped.crediting.ratePct).toBeGreaterThan(capped.crediting.ratePct);
    expect(uncapped.policy.finalCashValue).toBeGreaterThan(capped.policy.finalCashValue);
  });

  it('states the compound rate, never the average of annual credits', async () => {
    // The arithmetic mean of credits overstates what the account reaches: 0%
    // then 10% averages 5% but compounds to 4.88%. With a cap truncating the
    // good years and a floor holding the bad ones, the gap is always in the
    // flattering direction, so the compound figure must be the lower one.
    const b = await fetch(`${base}/crediting?cap=7.5&floor=0&participation=100`, auth).then((x) => x.json());
    const arithmetic =
      b.years.reduce((t: number, y: { creditedRatePct: number }) => t + y.creditedRatePct, 0) / b.years.length;
    expect(b.crediting.ratePct).toBeLessThan(arithmetic);
  });

  it('shows the strategy year by year, with the floor and cap years counted', async () => {
    const b = await fetch(`${base}/crediting?cap=7.5&indexStartYear=1995`, auth).then((x) => x.json());
    expect(b.years[0].year).toBe(1995);
    expect(b.years.length).toBe(b.crediting.years);
    // 2008 fell hard; the floor must have held it at 0, not passed the loss on.
    const y2008 = b.years.find((y: { year: number }) => y.year === 2008);
    expect(y2008.indexReturnPct).toBeLessThan(0);
    expect(y2008.creditedRatePct).toBe(0);
    expect(b.floorHeldYears).toBeGreaterThan(0);
    expect(b.capLimitedYears).toBeGreaterThan(0);
  });

  it('flags an uncapped strategy at full participation as describing no real policy', async () => {
    // 1929-2025 uncapped at 100% participation compounds to 14.39%. Carriers
    // that drop the cap pay for it with participation well under 100%, so the
    // combination is arithmetic about a product nobody sells.
    const b = await fetch(`${base}/crediting?cap=none&participation=100`, auth).then((x) => x.json());
    expect(b.crediting.warnings.length).toBeGreaterThan(0);
    expect(b.crediting.warnings.join(' ')).toContain('no policy that can be');
    expect(b.crediting.warnings.join(' ')).toContain('AG 49-A');

    // A real uncapped design — cap off, participation reduced — is not flagged.
    const real = await fetch(`${base}/crediting?cap=none&participation=60`, auth).then((x) => x.json());
    expect(real.crediting.warnings).toEqual([]);
    expect(real.crediting.ratePct).toBeLessThan(b.crediting.ratePct);
  });

  it('a normal capped strategy carries no warnings', async () => {
    const b = await fetch(`${base}/crediting?cap=9.5&participation=100`, auth).then((x) => x.json());
    expect(b.crediting.warnings).toEqual([]);
  });

  it('says where the series comes from and where it actually starts', async () => {
    // "Ibbotson" invites the reader to assume 1926. The held table begins in
    // 1929, and the response says so rather than letting the name imply it.
    const b = await fetch(`${base}/crediting`, auth).then((x) => x.json());
    expect(b.source).toContain('Ibbotson');
    expect(b.source).toContain('1926');
    expect(b.source).toContain('1929');
    expect(b.notice).toContain('not indicative of future returns');
  });

  it('lets a caller pick another window, and refuses one too short to mean anything', async () => {
    const chosen = await fetch(`${base}/crediting?indexStartYear=1995`, auth).then((x) => x.json());
    expect(chosen.crediting.startYear).toBe(1995);
    // AG 49-A wants at least ten years of index history behind a table. An end
    // year inside that window is clamped rather than honoured.
    const tooShort = await fetch(`${base}/crediting?indexStartYear=2000&indexEndYear=2003`, auth).then((x) => x.json());
    expect(tooShort.crediting.years).toBeGreaterThanOrEqual(10);
  });

  it('carries the AG 49 language with every mortgage answer', async () => {
    const b = await fetch(`${base}/mortgage?${MORTGAGE}`, auth).then((x) => x.json());
    for (const phrase of ['Nothing about it is guaranteed', 'not indicative of future returns', 'reduces its cash value', 'taxable event', 'AG 49-A maximum', 'Ibbotson']) {
      expect(b.basis, phrase).toContain(phrase);
    }
  });

  it('accepts the optional inputs a visitor chooses to answer', async () => {
    // The point of the short form is that more detail is allowed, not required.
    const [bare, detailed] = await Promise.all([
      fetch(`${base}/mortgage?${MORTGAGE}`, auth).then((x) => x.json()),
      fetch(`${base}/mortgage?${MORTGAGE}&allocationPct=30&helocRate=7&ira=500000`, auth).then((x) => x.json()),
    ]);
    expect(detailed.policy.annualPremium).toBeGreaterThan(bare.policy.annualPremium);
  });

  it('returns the yearly table, never the 360-row monthly schedules', async () => {
    const b = await fetch(`${base}/mortgage?${MORTGAGE}`, auth).then((x) => x.json());
    expect(b.byYear.length).toBeLessThanOrEqual(40);
    expect(b.current.schedule).toBeUndefined();
    expect(b.accelerated.schedule).toBeUndefined();
  });

  it('still does not expose the lifetime-income engine', async () => {
    // Its defaults name a specific carrier product and assume 22-28% extra
    // growth. A public page projecting that is a performance claim, not a
    // calculation, and the assumptions need rebuilding before it goes out.
    for (const path of ['lifetime-income', 'roth-conversion']) {
      const r = await fetch(`${base}/${path}`, auth);
      expect(r.status, path).toBe(404);
    }
  });
});

describe('closed by default', () => {
  it('answers 503 and explains when no key is configured', async () => {
    const saved = process.env.PARTNER_API_KEY;
    delete process.env.PARTNER_API_KEY;
    const r = await fetch(`${base}/index-history?index=SP500`, auth);
    expect(r.status).toBe(503);
    const b = await r.json();
    expect(b.error).toBe('partner_api_not_configured');
    expect(b.detail).toContain('PARTNER_API_KEY');
    process.env.PARTNER_API_KEY = saved;
  });
});
