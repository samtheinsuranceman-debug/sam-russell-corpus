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
