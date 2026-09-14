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

describe('index segments', () => {
  it('returns every segment in the window with its term and its per-year figure', async () => {
    const r = await fetch(`${base}/index-segments?account=bia-2yr&from=2019&to=2025`, auth);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.account.term_years).toBe(2);
    expect(b.segments).toHaveLength(6);
    for (const sg of b.segments) {
      expect(sg).toHaveProperty('credited_pct');
      expect(sg).toHaveProperty('annualized_pct');
      expect(sg).toHaveProperty('term_years');
    }
  });

  it('never ships a segment credit without the annualized figure beside it', async () => {
    const r = await fetch(`${base}/index-segments?account=bia-2yr&from=2019&to=2025`, auth);
    const b = await r.json();
    const big = b.segments.find((s: any) => s.credited_pct > 40);
    expect(big).toBeTruthy();
    expect(big.annualized_pct).toBeLessThan(big.credited_pct / 1.8);
    expect(String(b.basis)).toMatch(/2-year segment/);
    expect(String(b.reading_note)).toMatch(/not a year/);
  });

  it('counts segments, not years, against the threshold', async () => {
    // Four of the six two-year segments over 2019-2025 credited 40% or more;
    // not one of the six YEARS reached it. Same window, same data, and the
    // unit is the whole difference.
    const b = await (await fetch(`${base}/index-segments?from=2019&to=2025&threshold=40`, auth)).json();
    expect(b.segments).toHaveLength(6);
    expect(b.segments_at_or_above_threshold).toBe(4);
    expect(b.segments.filter((s: any) => s.annualized_pct >= 40)).toHaveLength(0);
  });

  it('keeps the two segments that credited nothing in the same window', async () => {
    const b = await (await fetch(`${base}/index-segments?from=2019&to=2025&threshold=40`, auth)).json();
    expect(b.floor_saved_count).toBe(2);
    expect(b.segments.filter((s: any) => s.credited_pct === 0)).toHaveLength(2);
  });

  it('reports the series as verified against the carrier\'s published claims', async () => {
    const b = await (await fetch(`${base}/index-segments`, auth)).json();
    expect(b.series_verified).toBe(true);
    expect(b.series_warning).toBeNull();
  });

  it('says when an account\'s terms came from nobody', async () => {
    const b = await (await fetch(`${base}/index-segments?account=par110-annual`, auth)).json();
    expect(b.account.sourced).toBe(false);
    expect(String(b.account.source)).toMatch(/[Nn]ot a carrier quote/);
  });

  it('marks the two-year balanced account as sourced to its document', async () => {
    const b = await (await fetch(`${base}/index-segments?account=bia-2yr`, auth)).json();
    expect(b.account.sourced).toBe(true);
    expect(b.account.participation_pct).toBe(105);
    expect(b.account.spread_pct).toBe(2.5);
  });

  it('404s an account it does not hold, and says which it does', async () => {
    const r = await fetch(`${base}/index-segments?account=not-an-account`, auth);
    expect(r.status).toBe(404);
    const b = await r.json();
    expect(Array.isArray(b.available)).toBe(true);
  });

  it('clamps a window outside the series rather than inventing years', async () => {
    const b = await (await fetch(`${base}/index-segments?from=1800&to=2999`, auth)).json();
    expect(b.window.from).toBeGreaterThanOrEqual(b.series_range.from);
    expect(b.window.to).toBeLessThanOrEqual(b.series_range.to);
  });

  it('requires a key like every other partner route', async () => {
    const r = await fetch(`${base}/index-segments`);
    expect(r.status).toBe(401);
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

  it('offers the named windows, including two that begin at a market top', async () => {
    const b = await fetch(`${base}/crediting`, auth).then((x) => x.json());
    const ids = b.windows.map((w: { id: string }) => w.id);
    for (const id of ['full', 'ag49', 'thirty', 'dotcom', 'crisis', 'covid']) {
      expect(ids, id).toContain(id);
    }
    // A menu of only rising windows is a sales tool. Two must start at a peak.
    expect(b.windows.filter((w: { startsAtPeak: boolean }) => w.startsAtPeak).length).toBeGreaterThanOrEqual(2);
  });

  it('never shows a chosen window without the whole record beside it', async () => {
    // This is the Time Machine rule applied to the index strategy. Since Covid
    // is six years off the bottom of a crash: a true figure and a misleading
    // answer on its own. It must arrive with the long number attached.
    const b = await fetch(`${base}/crediting?window=covid&cap=9.5`, auth).then((x) => x.json());
    expect(b.selected.years).toBe(2025 - 2020 + 1);
    expect(b.againstFullHistory.years).toBeGreaterThan(90);
    expect(b.againstFullHistory.ratePct).toBeGreaterThan(0);
    // And the gap is stated rather than left for the reader to subtract.
    expect(b.againstFullHistory.differencePct).toBe(
      Number((b.selected.ratePct - b.againstFullHistory.ratePct).toFixed(2))
    );
    expect(b.selected.ratePct).toBeGreaterThan(b.againstFullHistory.ratePct);
  });

  it('warns that the shortest window is short, rather than quietly refusing it', async () => {
    const b = await fetch(`${base}/crediting?window=covid`, auth).then((x) => x.json());
    expect(b.crediting.warnings.join(' ')).toContain('AG 49-A asks for at least ten');
    expect(b.crediting.warnings.join(' ')).toContain('beside the full history');
  });

  it('a window starting at a peak credits less than one starting after it', async () => {
    const [peak, recent] = await Promise.all([
      fetch(`${base}/crediting?window=dotcom&cap=9.5`, auth).then((x) => x.json()),
      fetch(`${base}/crediting?window=covid&cap=9.5`, auth).then((x) => x.json()),
    ]);
    expect(peak.selected.ratePct).toBeLessThan(recent.selected.ratePct);
    // Both report the same long number, because the strategy is the same.
    expect(peak.againstFullHistory.ratePct).toBe(recent.againstFullHistory.ratePct);
  });

  it('an explicit start year still overrides a named window', async () => {
    const b = await fetch(`${base}/crediting?window=covid&indexStartYear=1995`, auth).then((x) => x.json());
    expect(b.crediting.startYear).toBe(1995);
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

  it('honours a short window and warns about it, rather than clamping it', async () => {
    const chosen = await fetch(`${base}/crediting?indexStartYear=1995`, auth).then((x) => x.json());
    expect(chosen.crediting.startYear).toBe(1995);

    // An earlier version of this test asserted a hard ten-year floor, silently
    // widening any shorter request. That was wrong for this exhibit: the whole
    // purpose is letting a reader shift the period, and a window that quietly
    // becomes a different window is worse than a short one. AG 49-A's ten-year
    // expectation is now carried as a warning beside the figure, and the full
    // history is returned alongside, which is the real protection.
    const short = await fetch(`${base}/crediting?indexStartYear=2000&indexEndYear=2003`, auth).then((x) => x.json());
    expect(short.crediting.startYear).toBe(2000);
    expect(short.crediting.endYear).toBe(2003);
    expect(short.crediting.years).toBe(4);
    expect(short.crediting.warnings.join(' ')).toContain('AG 49-A asks for at least ten');
    expect(short.againstFullHistory.years).toBeGreaterThan(90);
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

  it('the mortgage illustration carries both panels too, not just the crediting route', async () => {
    // A partner rendering only the mortgage tool must still see the chosen
    // window beside the whole record, or the toggle becomes a way to pick a
    // flattering number without the context that makes it honest.
    const b = await fetch(`${base}/mortgage?${MORTGAGE}&window=covid`, auth).then((x) => x.json());
    expect(b.selected.years).toBe(6);
    expect(b.againstFullHistory.years).toBeGreaterThan(90);
    expect(b.crediting.startYear).toBe(2020);
  });

  it('shifting the window barely moves the rate, because the cap is doing the work', async () => {
    // Worth pinning, because it is the opposite of what a toggle implies. A
    // 7.5% cap truncates every good year, so a window full of strong years
    // cannot run away — it just hits the cap more often. Across 97 years down
    // to 6, the spread is a third of a point. If the number needs to be
    // higher, the cap is the lever, not the period.
    const rates = await Promise.all(
      ['full', 'thirty', 'dotcom', 'crisis', 'covid'].map((w) =>
        fetch(`${base}/crediting?window=${w}&cap=7.5`, auth).then((x) => x.json()).then((b) => b.selected.ratePct)
      )
    );
    const spread = Math.max(...rates) - Math.min(...rates);
    expect(spread).toBeLessThan(1);

    // Raising the cap moves it far more than any window choice does.
    const higherCap = await fetch(`${base}/crediting?window=full&cap=12`, auth).then((x) => x.json());
    expect(higherCap.selected.ratePct - Math.max(...rates)).toBeGreaterThan(spread);
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

describe('the policy history exhibit', () => {
  const TM = 'premium=100000&fundingYears=5&age=45&years=30';

  it('lists every strategy held, with the terms that explain the difference', async () => {
    const b = await fetch(`${base}/time-machine?${TM}`, auth).then((x) => x.json());
    expect(b.strategies.length).toBeGreaterThan(5);
    for (const st of b.strategies) {
      expect(typeof st.id).toBe('string');
      expect(typeof st.participationPct).toBe('number');
      // cap is null for an uncapped strategy, which is a real design.
      expect(st.capPct === null || typeof st.capPct === 'number').toBe(true);
    }
    expect(b.strategies.some((s: { capPct: number | null }) => s.capPct === null)).toBe(true);
  });

  it('refuses the strategies whose reconstruction would overstate the credit', async () => {
    // Two families in the held data cannot be modelled faithfully: the
    // "Monthly Avg" designs run on annual point-to-point returns, and the
    // multi-index ones weight each component by what it actually returned that
    // year. Both inflate, and together they produce 12.93% compound — above
    // anything a carrier could illustrate under AG 49-A.
    const all = await fetch(`${base}/time-machine?${TM}`, auth).then((x) => x.json());
    const flagged = all.strategies.filter((s: { selectable: boolean }) => !s.selectable);
    expect(flagged.length).toBeGreaterThan(0);

    for (const st of flagged) {
      expect(st.modelCaveat.length).toBeGreaterThan(60);
      const r = await fetch(`${base}/time-machine?${TM}&option=${st.id}`, auth);
      expect(r.status, st.id).toBe(422);
      const b = await r.json();
      expect(b.error).toBe('strategy_not_modelled_faithfully');
      expect(b.remedy).toContain('single-index');
    }

    // They are still listed. A reader seeing a product they were shown
    // elsewhere deserves the reason it is absent, not silence.
    expect(all.strategies.length).toBeGreaterThan(flagged.length);
  });

  it('credits a named strategy on its own terms, not the first one on the list', async () => {
    // Asking for the S&P 500 used to return whichever strategy was listed
    // first. Two designs on the same index must now give different histories.
    const all = await fetch(`${base}/time-machine?${TM}`, auth).then((x) => x.json());
    const sel = all.strategies.filter((s: { selectable: boolean }) => s.selectable);
    const capped = sel.find((s: { capPct: number | null }) => s.capPct !== null);
    const uncapped = sel.find((s: { capPct: number | null }) => s.capPct === null);

    const [a, b] = await Promise.all([
      fetch(`${base}/time-machine?${TM}&option=${capped.id}`, auth).then((x) => x.json()),
      fetch(`${base}/time-machine?${TM}&option=${uncapped.id}`, auth).then((x) => x.json()),
    ]);
    expect(a.index.id).toBe(capped.id);
    expect(b.index.id).toBe(uncapped.id);
    expect(b.index.capPct).toBeNull();
    expect(JSON.stringify(a.creditHistory)).not.toBe(JSON.stringify(b.creditHistory));
  });

  it('shows the credit year by year against the index change that produced it', async () => {
    const b = await fetch(`${base}/time-machine?${TM}`, auth).then((x) => x.json());
    expect(b.creditHistory.length).toBeGreaterThan(25);

    // 2008 fell hard. The floor must have held it, and the credit must not be
    // negative in any year — that is what the floor is.
    const y2008 = b.creditHistory.find((y: { year: number }) => y.year === 2008);
    expect(y2008.indexChangePct).toBeLessThan(0);
    expect(y2008.floorHeld).toBe(true);
    for (const y of b.creditHistory) expect(y.creditedRatePct, String(y.year)).toBeGreaterThanOrEqual(0);
  });

  it('never credits more than the strategy allows in a strong year', async () => {
    const all = await fetch(`${base}/time-machine?${TM}`, auth).then((x) => x.json());
    const capped = all.strategies
      .filter((s: { selectable: boolean }) => s.selectable)
      .find((s: { capPct: number | null }) => s.capPct !== null);
    const b = await fetch(`${base}/time-machine?${TM}&option=${capped.id}`, auth).then((x) => x.json());
    for (const y of b.creditHistory) {
      expect(y.creditedRatePct, String(y.year)).toBeLessThanOrEqual(b.index.capPct + 0.01);
    }
    // And the cap actually bit in at least one year, or the exhibit is not
    // showing what a cap does.
    expect(b.creditHistory.some((y: { capLimited: boolean }) => y.capLimited)).toBe(true);
  });

  it('a bigger policy scales, and the crediting does not change with it', async () => {
    // Cash value is the premium's job. The credited rate is the strategy's,
    // and must not move because somebody funded more.
    const [small, large] = await Promise.all([
      fetch(`${base}/time-machine?premium=25000&fundingYears=5&age=45&years=30`, auth).then((x) => x.json()),
      fetch(`${base}/time-machine?premium=250000&fundingYears=5&age=45&years=30`, auth).then((x) => x.json()),
    ]);
    expect(JSON.stringify(small.creditHistory)).toBe(JSON.stringify(large.creditHistory));
    const lastSmall = small.historical[small.historical.length - 1];
    const lastLarge = large.historical[large.historical.length - 1];
    expect(lastLarge.accountValue).toBeGreaterThan(lastSmall.accountValue * 5);
  });

  it('reads the history from a later start year when asked', async () => {
    const b = await fetch(`${base}/time-machine?${TM}&startYear=2010`, auth).then((x) => x.json());
    expect(b.creditHistory[0].year).toBe(2010);
  });

  it('keeps both panels, and still withholds the averages', async () => {
    const r = await fetch(`${base}/time-machine?${TM}`, auth);
    const raw = await r.text();
    const b = JSON.parse(raw);
    expect(b.boring.length).toBeGreaterThan(0);
    expect(b.historical.length).toBeGreaterThan(0);
    // AG 49-A: no aggregate credited rate crosses this boundary.
    expect(raw).not.toContain('histAvgRate');
    expect(raw).not.toContain('boringAvgRate');
    expect(b.notice).toContain('not indicative of future returns');
  });
});

describe('accumulation across an allocation', () => {
  const A = 'premium=50000&years=30&startYear=1996';

  it('splits the premium across the chosen strategies and shows each one', async () => {
    const b = await fetch(`${base}/accumulation?${A}&allocate=am-sp500-ptp:60,am-sp500-uncapped:40`, auth)
      .then((x) => x.json());
    expect(b.years.length).toBe(30);
    const y = b.years[0];
    expect(y.byStrategy.length).toBe(2);
    expect(y.byStrategy.map((s: { allocationPct: number }) => s.allocationPct).sort()).toEqual([40, 60]);
    expect(b.summary.finalAccountValue).toBeGreaterThan(0);
  });

  it('refuses an allocation that does not total 100 rather than normalising it', async () => {
    // Silently scaling 60/30 up to 100 gives an answer for a policy nobody
    // described. Better to say the total is wrong.
    const r = await fetch(`${base}/accumulation?${A}&allocate=am-sp500-ptp:60,am-sp500-uncapped:30`, auth);
    expect(r.status).toBe(400);
    const b = await r.json();
    expect(b.error).toBe('allocation_must_total_100');
    expect(b.detail).toContain('90%');
  });

  it('refuses an unknown strategy and lists the ones it holds', async () => {
    const r = await fetch(`${base}/accumulation?${A}&allocate=not-a-strategy:100`, auth);
    expect(r.status).toBe(400);
    const b = await r.json();
    expect(b.error).toBe('unknown_strategy');
    expect(b.available).toContain('am-sp500-ptp');
  });

  it('refuses an allocation into a strategy it will not model faithfully', async () => {
    const r = await fetch(`${base}/accumulation?${A}&allocate=am-multi-index:100`, auth);
    expect(r.status).toBe(422);
    const b = await r.json();
    expect(b.error).toBe('strategy_not_modelled_faithfully');
    expect(b.strategies[0].detail.length).toBeGreaterThan(60);
  });

  it('shows surrender value below account value when a schedule is given', async () => {
    const [bare, withCharges] = await Promise.all([
      fetch(`${base}/accumulation?${A}&allocate=am-sp500-ptp:100`, auth).then((x) => x.json()),
      fetch(`${base}/accumulation?${A}&allocate=am-sp500-ptp:100&surrender=10,9,8,7,6,5,4,3,2,1`, auth).then((x) => x.json()),
    ]);
    expect(bare.summary.surrenderScheduleSupplied).toBe(false);
    expect(bare.years[0].surrenderValue).toBe(bare.years[0].accountValue);
    expect(bare.basis).toContain('the true figure is lower');

    expect(withCharges.summary.surrenderScheduleSupplied).toBe(true);
    expect(withCharges.years[0].surrenderValue).toBeLessThan(withCharges.years[0].accountValue);
    // Past the schedule, the two converge again.
    expect(withCharges.years[20].surrenderValue).toBe(withCharges.years[20].accountValue);
  });

  it('counts the years the floor held and the years the cap bit', async () => {
    const b = await fetch(`${base}/accumulation?${A}&allocate=am-sp500-ptp:100`, auth).then((x) => x.json());
    expect(b.summary.floorProtectedYears).toBeGreaterThan(0);
    expect(b.summary.capLimitedYears).toBeGreaterThan(0);
  });

  it('a richer allocation accumulates more, and the per-year rate shows why', async () => {
    const [capped, blended] = await Promise.all([
      fetch(`${base}/accumulation?${A}&allocate=am-sp500-ptp:100`, auth).then((x) => x.json()),
      fetch(`${base}/accumulation?${A}&allocate=am-sp500-uncapped:100`, auth).then((x) => x.json()),
    ]);
    expect(blended.summary.finalAccountValue).toBeGreaterThan(capped.summary.finalAccountValue);
    expect(blended.summary.annualizedReturnPct).toBeGreaterThan(capped.summary.annualizedReturnPct);
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
