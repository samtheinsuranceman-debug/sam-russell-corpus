/**
 * Packet W8 — factors as data, keyless history connectors with recorded
 * fixtures, transport rules, backtest, scoring, ledger citations, the brief.
 * No network: every fetch is a fixture.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MACRO_FACTORS,
  FACTOR_TARGETS,
  FACTOR_TARGET_SERIES,
  FACTOR_BY_ID,
  ALL_INDICATORS,
  SOURCE_BY_ID,
  MACRO_ASSUMPTIONS,
  A,
  TRACKED_OFFICES,
  yoyPct,
  sahmRule,
  ratioPct,
  monthEndPoints,
  factorSignal,
  backtestFactor,
  applyFactorVerdicts,
  coverageYears,
  brier,
  addMonths,
  resolveFactorForecast,
  updateRunning,
  meanBrier,
  skill,
  accuracyLine,
  type MonthlyPoint,
  type RunningScore,
} from "@shared/macro";
import { getText, checkUrl, isPrivateHost, allowedHosts, runAllConnectors, CONNECTORS, type FetchLike } from "./macroConnectors";
import { EXPANSION_CONNECTORS, expansionConnectorInventory } from "./macroConnectorsExpansion";
import { seriesSpec, parseAcmCsv, parseSomaSummary, parseFiscalAvgRates, parseWorldBankSeries, parseTicHistory, plausibleSeries, downsampleForStorage, historyManifest, pullHistory, runHistoryRefresh } from "./macroHistory";
import { parseGdeltArtlist, draftsFromArticles, parseWikidataSearch, parseWikidataHolder, resolveOfficeHolder, ledgerConnector, LEDGER_CONNECTORS, requireStatementCitation, requireOutcomeCitation, gdeltArtlistUrl } from "./macroLedger";
import { forecastFromSignal } from "./macroScoring";
import { buildMacroBrief, parseMacroLookup, executeMacroLookup, describeMacroLookup, setBriefExtras, type BriefExtras } from "./macroContext";
import { renderFactorsMarkdown } from "./macroFactorsDoc";

const ok = (text: string, headers: Record<string, string> = {}) => ({ ok: true, status: 200, text: async () => text, headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } });
const TODAY = "2026-09-22";

// ─── Registry ─────────────────────────────────────────────────────────────────

describe("factor panel — data rows, rules table, sources", () => {
  it("has exactly twenty-five factors, each with a factor spec, a registered keyless source and a registered target", () => {
    expect(MACRO_FACTORS).toHaveLength(25);
    const targetIds = new Set([...FACTOR_TARGETS.map(t => t.id), ...MACRO_FACTORS.map(f => f.id)]);
    for (const f of MACRO_FACTORS) {
      expect(f.factor, f.id).toBeDefined();
      const src = SOURCE_BY_ID.get(f.sourceIds[0]);
      expect(src, `${f.id} source`).toBeDefined();
      // FRED is registered keyed (its JSON API); the factor path is the keyless CSV, so the URL must carry no key.
      expect(["open-api", "keyed-api"]).toContain(src!.access);
      expect(seriesSpec(f.factor!.series)!.url).not.toMatch(/api_key|\{KEY\}/);
      expect(targetIds.has(f.factor!.target) || FACTOR_TARGET_SERIES.some(t => t.indicatorId === f.factor!.target), `${f.id} target ${f.factor!.target}`).toBe(true);
      expect(f.factor!.horizonMonths).toBeGreaterThanOrEqual(3);
      expect(f.factor!.publishedFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(seriesSpec(f.factor!.series), `${f.id} series ${f.factor!.series}`).not.toBeNull();
      if (f.factor!.denominator) expect(seriesSpec(f.factor!.denominator)).not.toBeNull();
    }
    expect(new Set(ALL_INDICATORS.map(i => i.id)).size).toBe(ALL_INDICATORS.length);
  });

  it("every factor's neutral, span, min and max are rows in the rules table with source and date (the assumptions test enforces the rest)", () => {
    for (const f of MACRO_FACTORS) {
      for (const k of ["neutral", "span", "min", "max"]) {
        const row = MACRO_ASSUMPTIONS.get(`${f.factor!.assumptionPrefix}.${k}`);
        expect(row, `${f.id}.${k}`).toBeDefined();
        expect(row!.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(SOURCE_BY_ID.has(row!.source)).toBe(true);
      }
      expect(f.factor!.neutral).toBe(A(`${f.factor!.assumptionPrefix}.neutral`));
      expect(f.factor!.min).toBeLessThan(f.factor!.max);
    }
    expect(MACRO_ASSUMPTIONS.size).toBeGreaterThan(200);
  });

  it("the history manifest covers every factor base series, denominator and target once", () => {
    const m = historyManifest();
    const keys = m.map(r => r.series);
    expect(new Set(keys).size).toBe(keys.length);
    for (const f of MACRO_FACTORS) {
      expect(keys).toContain(f.factor!.series);
      if (f.factor!.denominator) expect(keys).toContain(f.factor!.denominator);
    }
    for (const t of FACTOR_TARGET_SERIES) expect(keys).toContain(t.series);
    for (const r of m) expect(SOURCE_BY_ID.has(r.sourceId), r.sourceId).toBe(true);
  });

  it("thirty-six to forty years: at least twenty factors publish from 1990 or earlier", () => {
    const old = MACRO_FACTORS.filter(f => f.factor!.publishedFrom <= "1990-12-31");
    expect(old.length).toBeGreaterThanOrEqual(20);
  });
});

// ─── Transport rules ──────────────────────────────────────────────────────────

describe("transport rules (allow-list, private addresses, redirects, size)", () => {
  it("every connector URL in the layer is on the allow-list", () => {
    const urls = [...expansionConnectorInventory().map(i => i.url).filter(u => u.startsWith("http")), ...historyManifest().map(r => seriesSpec(r.series)!.url), gdeltArtlistUrl("x")];
    for (const u of urls) {
      const c = checkUrl(u);
      expect(c.ok, `${u}: ${c.ok ? "" : c.reason}`).toBe(true);
    }
    expect(allowedHosts().size).toBeGreaterThan(50);
  });

  it("refuses private, loopback, link-local, metadata and bare-IP hosts before any fetch", async () => {
    for (const h of ["127.0.0.1", "10.0.0.5", "172.16.3.4", "192.168.1.1", "169.254.169.254", "localhost", "db.internal", "8.8.8.8", "[::1]"]) expect(isPrivateHost(h), h).toBe(true);
    expect(isPrivateHost("fred.stlouisfed.org")).toBe(false);
    let called = 0;
    const fetchImpl: FetchLike = async () => {
      called++;
      return ok("x");
    };
    await expect(getText(fetchImpl, "http://169.254.169.254/latest/meta-data/")).rejects.toThrow(/private or literal/);
    await expect(getText(fetchImpl, "https://evil.example.com/feed")).rejects.toThrow(/allow-list/);
    await expect(getText(fetchImpl, "ftp://fred.stlouisfed.org/x")).rejects.toThrow(/scheme/);
    expect(called).toBe(0);
  });

  it("follows a redirect onto the allow-list once and refuses one off it", async () => {
    const seen: string[] = [];
    const fetchImpl: FetchLike = async url => {
      seen.push(url);
      if (url.includes("/old")) return { ok: false, status: 302, text: async () => "", headers: { get: (k: string) => (k.toLowerCase() === "location" ? "https://api.stlouisfed.org/new" : null) } };
      if (url.includes("/bad")) return { ok: false, status: 301, text: async () => "", headers: { get: (k: string) => (k.toLowerCase() === "location" ? "https://attacker.example.net/" : null) } };
      return ok("payload");
    };
    expect(await getText(fetchImpl, "https://fred.stlouisfed.org/old")).toBe("payload");
    expect(seen).toEqual(["https://fred.stlouisfed.org/old", "https://api.stlouisfed.org/new"]);
    await expect(getText(fetchImpl, "https://fred.stlouisfed.org/bad")).rejects.toThrow(/redirect refused/);
  });

  it("caps a response at the rules-table byte limit, by header and by body", async () => {
    const big: FetchLike = async () => ok("", { "content-length": String(A("history.maxBytes") + 1) });
    await expect(getText(big, "https://fred.stlouisfed.org/x")).rejects.toThrow(/too large/);
    const bigBody: FetchLike = async () => ok("x".repeat(A("history.maxBytes") + 1));
    await expect(getText(bigBody, "https://fred.stlouisfed.org/x")).rejects.toThrow(/too large/);
    expect(A("history.timeoutMs")).toBe(15_000);
  });
});

// ─── Parsers against recorded fixtures ───────────────────────────────────────

const FRED_CSV = "observation_date,T10Y3M\n1982-01-04,2.32\n1982-01-05,.\n1982-01-29,2.10\n1982-02-26,1.95\n2026-09-19,0.41\n";
const ACM_CSV = 'DATE,ACMTP01,ACMTP10,ACMY10\n"06/14/1961",0.12,1.21,3.8\n"06/30/1961",0.13,1.19,3.85\n"09/19/2026",-0.05,0.62,4.1\n';
const SOMA_JSON = JSON.stringify({ soma: { summary: [{ asOfDate: "2026-09-17", mbs: "2100000000000", cmbs: "0", tips: "400000000000", frn: "20000000000", bills: "195000000000", notesbonds: "3600000000000", total: "6400000000000" }, { asOfDate: "2003-07-23", bills: "240000000000", notesbonds: "400000000000", tips: "0", frn: "0" }] } });
const FISCAL_JSON = JSON.stringify({ data: [{ record_date: "2001-01-31", security_desc: "Total Marketable", avg_interest_rate_amt: "6.187" }, { record_date: "2001-01-31", security_desc: "Treasury Bills", avg_interest_rate_amt: "5.9" }, { record_date: "2026-08-31", security_desc: "Total Marketable", avg_interest_rate_amt: "3.41" }] });
const WB_JSON = JSON.stringify([{ page: 1 }, [{ date: "2024", value: 2.7 }, { date: "2023", value: 2.8 }, { date: "1961", value: 4.3 }, { date: "2025", value: null }]]);
const TIC_HIST = [
  "MAJOR FOREIGN HOLDERS OF TREASURY SECURITIES — HISTORICAL",
  "                    Jul 2026  Jun 2026  May 2026  Apr 2026",
  "Japan                 1103.9    1116.7    1128.4    1136.0",
  "China, Mainland        618.0     633.4     659.3     651.1",
  "",
  "                    Mar 2026  Feb 2026  Jan 2026  Dec 2025",
  "Japan                 1131.2    1125.0    1120.3    1118.8",
  "China, Mainland        660.2     662.1     668.0     670.5",
].join("\n");

describe("history parsers", () => {
  it("FRED CSV history keeps every dated reading and skips '.'", () => {
    const p = seriesSpec("fred:T10Y3M")!.parse(FRED_CSV);
    expect(p).toHaveLength(4);
    expect(p[0]).toEqual({ asOf: "1982-01-04", value: 2.32 });
  });
  it("NY Fed ACM CSV: takes the 10-year term premium column and converts US dates", () => {
    const p = parseAcmCsv(ACM_CSV);
    expect(p).toEqual([{ asOf: "1961-06-14", value: 1.21 }, { asOf: "1961-06-30", value: 1.19 }, { asOf: "2026-09-19", value: 0.62 }]);
  });
  it("SOMA summary: sums the Treasury lines into USD bn and sorts by date", () => {
    const p = parseSomaSummary(SOMA_JSON);
    expect(p).toEqual([{ asOf: "2003-07-23", value: 640 }, { asOf: "2026-09-17", value: 4215 }]);
  });
  it("Fiscal Data average interest rates: Total Marketable only", () => {
    expect(parseFiscalAvgRates(FISCAL_JSON)).toEqual([{ asOf: "2001-01-31", value: 6.187 }, { asOf: "2026-08-31", value: 3.41 }]);
  });
  it("World Bank annual series: year-end dates, nulls dropped", () => {
    expect(parseWorldBankSeries(WB_JSON)).toEqual([{ asOf: "1961-12-31", value: 4.3 }, { asOf: "2023-12-31", value: 2.8 }, { asOf: "2024-12-31", value: 2.7 }]);
  });
  it("TIC history: reads every month block for the named holder, dated to month-end", () => {
    const jp = parseTicHistory(TIC_HIST, "Japan");
    expect(jp).toHaveLength(8);
    expect(jp[0]).toEqual({ asOf: "2025-12-31", value: 1118.8 });
    expect(jp[7]).toEqual({ asOf: "2026-07-31", value: 1103.9 });
    expect(parseTicHistory(TIC_HIST, "China, Mainland").find(p => p.asOf === "2026-07-31")!.value).toBe(618);
  });
  it("plausibility drops out-of-range readings and counts them; downsampling keeps one point per month", () => {
    const { kept, dropped } = plausibleSeries([{ asOf: "2020-01-31", value: 1 }, { asOf: "2020-02-29", value: 999 }, { asOf: "2020-03-31", value: -1 }], 0, 10);
    expect(kept).toHaveLength(1);
    expect(dropped).toBe(2);
    const d = downsampleForStorage([{ asOf: "2020-01-02", value: 1 }, { asOf: "2020-01-15", value: 9 }, { asOf: "2020-01-31", value: 2 }, { asOf: "2020-02-03", value: 3 }]);
    expect(d).toEqual([{ asOf: "2020-01-02", value: 1 }, { asOf: "2020-01-31", value: 2 }, { asOf: "2020-02-03", value: 3 }]);
  });
});

// ─── Pull, degrade, coverage ─────────────────────────────────────────────────

describe("pullHistory and runHistoryRefresh (offline)", () => {
  it("a live pull reports earliestAsOf and coverageYears; a format change is refused with a reason; a dead host is unavailable with the error", async () => {
    const row = { indicatorId: "f-curve-10y3m", series: "fred:T10Y3M", min: -5, max: 6 };
    const live = await pullHistory(async () => ok(FRED_CSV), row);
    expect(live.status).toBe("live");
    expect(live.earliestAsOf).toBe("1982-01-04");
    expect(live.coverageYears).toBeCloseTo(44.7, 0);
    expect(live.points.length).toBe(4); // first reading + one per month (Jan 29, Feb 26, Sep 2026)
    const garbage = await pullHistory(async () => ok("observation_date,T10Y3M\n2026-01-01,999\n2026-02-01,998\n2026-03-01,1\n"), row);
    expect(garbage.status).toBe("unavailable");
    expect(garbage.reason).toMatch(/format change suspected/);
    expect(garbage.points).toEqual([]);
    const dead = await pullHistory(async () => { throw new Error("ECONNRESET"); }, row);
    expect(dead.status).toBe("unavailable");
    expect(dead.reason).toBe("ECONNRESET");
    const unknown = await pullHistory(async () => ok("x"), { indicatorId: "x", series: "nope:x", min: 0, max: 1 });
    expect(unknown.reason).toMatch(/unknown series key/);
  });

  it("runHistoryRefresh without a database pulls every manifest row and never throws", async () => {
    const fetchImpl: FetchLike = async url => {
      if (url.includes("fredgraph")) return ok(FRED_CSV.replace("T10Y3M", "X"));
      if (url.includes("ACMTermPremium")) return ok(ACM_CSV);
      if (url.includes("soma/summary")) return ok(SOMA_JSON);
      if (url.includes("avg_interest_rates")) return ok(FISCAL_JSON);
      if (url.includes("worldbank")) return ok(WB_JSON);
      if (url.includes("mfhhis01")) return ok(TIC_HIST);
      throw new Error("no fixture for " + url);
    };
    const r = await runHistoryRefresh({ fetchImpl, db: null });
    expect(r.pulls.length).toBe(historyManifest().length);
    expect(r.inserted).toBe(0);
    // FRED fixture values (0.4–2.3) sit inside most bounds; USREC (0–1) and the y/y bases with high floors are refused — each with a reason, never a throw.
    for (const p of r.pulls) expect(p.status === "live" || (p.status === "unavailable" && p.reason)).toBeTruthy();
    expect(r.pulls.find(p => p.series === "nyfed:acm")!.status).toBe("live");
    expect(r.pulls.find(p => p.series === "tic:history:Japan")!.coverageYears).toBeCloseTo(0.6, 1);
  });
});

// ─── Factor arithmetic and backtest ─────────────────────────────────────────

function monthly(start: string, values: number[]): MonthlyPoint[] {
  const [y, m] = start.split("-").map(Number);
  return values.map((v, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i + 1, 0));
    return { asOf: d.toISOString().slice(0, 10), value: v };
  });
}

describe("factor arithmetic", () => {
  it("year on year, Sahm rule and ratio", () => {
    const base = monthly("2020-01", Array.from({ length: 24 }, (_, i) => 100 + i));
    const yoy = yoyPct(base);
    expect(yoy).toHaveLength(12);
    expect(yoy[0].value).toBeCloseTo(12, 5);
    const un = monthly("2020-01", [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.6, 3.8, 4.1, 4.3]);
    const s = sahmRule(un);
    expect(s[s.length - 1].value).toBeCloseTo(4.0667 - 3.5, 2);
    expect(s[0].value).toBe(0);
    const r = ratioPct(monthly("2020-01", [30, 33]), monthly("2020-01", [100, 110]));
    expect(r.map(p => p.value)).toEqual([30, 30]);
    expect(monthEndPoints([{ asOf: "2020-01-15", value: 1 }, { asOf: "2020-01-03", value: 0 }])).toEqual([{ asOf: "2020-01-15", value: 1 }]);
  });

  it("factorSignal normalises against neutral and span and flips for risk-down rows", () => {
    expect(factorSignal(2.5, { neutral: 1, span: 1.5 }, "risk-up")).toBe(1);
    expect(factorSignal(-0.5, { neutral: 1, span: 1.5 }, "risk-down")).toBe(1); // inverted curve → recession up
    expect(factorSignal(1, { neutral: 1, span: 1.5 }, "risk-up")).toBe(0);
    expect(factorSignal(5, { neutral: 0, span: 0 }, "risk-up")).toBe(0);
  });
});

describe("backtestFactor — signal, context, pending", () => {
  const n = 120;
  // A factor that leads a level target by exactly six months, by construction.
  const driver = Array.from({ length: n + 6 }, (_, i) => Math.sin(i / 5) * 2);
  const factor = monthly("2010-01", driver.slice(0, n));
  const targetLevel = monthly("2010-01", driver.slice(0, n + 6).map((_, i, a) => a.slice(0, i + 1).reduce((s, v) => s + v, 0))); // cumulative: change over 6 months ≈ sum of upcoming driver values
  it("calls a constructed lead a signal, noise context, and a short sample pending", () => {
    const v = backtestFactor("f", factor, targetLevel, { horizonMonths: 6, direction: "risk-up", neutral: 0, span: 1, targetKind: "level", minN: 60 });
    expect(v.verdict).toBe("signal");
    expect(Math.abs(v.leadR!)).toBeGreaterThan(0.5);
    expect(v.hitRate!).toBeGreaterThan(0.7);
    expect(v.n).toBeGreaterThanOrEqual(100);
    let s = 7;
    const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647) * 2 - 1;
    const noise = monthly("2010-01", Array.from({ length: n }, () => rnd()));
    const c = backtestFactor("g", noise, targetLevel, { horizonMonths: 6, direction: "risk-up", neutral: 0, span: 1, targetKind: "level", minN: 60 });
    expect(c.verdict).toBe("context");
    expect(c.reason).toMatch(/weight 0/);
    const short = backtestFactor("h", factor.slice(0, 20), targetLevel, { horizonMonths: 6, direction: "risk-up", neutral: 0, span: 1, targetKind: "level", minN: 60 });
    expect(short.verdict).toBe("pending");
  });

  it("binary targets: a factor that precedes every recession window scores as a signal", () => {
    const rec = Array.from({ length: n }, (_, i) => ((i >= 30 && i < 36) || (i >= 80 && i < 90) ? 1 : 0));
    const lead = Array.from({ length: n }, (_, i) => ((i >= 24 && i < 33) || (i >= 74 && i < 86) ? -1.5 : 1.2)); // inverts ahead of each recession
    const v = backtestFactor("curve", monthly("2010-01", lead), monthly("2010-01", rec), { horizonMonths: 12, direction: "risk-down", neutral: 1, span: 1.5, targetKind: "binary", minN: 60 });
    expect(v.verdict).toBe("signal");
    expect(v.leadR).toBeGreaterThan(0.3);
  });

  it("applyFactorVerdicts zeroes the weight of anything that is not a signal", () => {
    const out = applyFactorVerdicts(MACRO_FACTORS, [{ indicatorId: "f-curve-10y3m", verdict: "signal", leadR: 0.4, hitRate: 0.7, r0: 0.1, n: 200, horizonMonths: 12, reason: "", asOf: TODAY }]);
    expect(out.find(f => f.id === "f-curve-10y3m")!.weight).toBe(0.9);
    expect(out.find(f => f.id === "f-vix")!.weight).toBe(0);
    expect(out.find(f => f.id === "f-vix")!.rationale).toMatch(/pending: context, weight 0/);
    expect(coverageYears("1986-01-02", "2026-09-19")).toBeCloseTo(40.7, 1);
  });
});

// ─── Scoring ─────────────────────────────────────────────────────────────────

describe("scoring — Brier, resolution, running score", () => {
  it("Brier and month arithmetic", () => {
    expect(brier(0.9, 1)).toBeCloseTo(0.01, 6);
    expect(brier(0.9, 0)).toBeCloseTo(0.81, 6);
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-09-22", 12)).toBe("2027-09-22");
  });

  it("a level forecast resolves only after maturity and against the target's move; neutral forecasts are never scored", () => {
    const fc = forecastFromSignal("f-cpi-yoy", 0.8, "2026-01-15", { target: "ust10y", targetKind: "level", horizonMonths: 6 }, 4.0);
    expect(fc.direction).toBe(1);
    expect(fc.probability).toBeGreaterThan(0.8);
    const target = [{ asOf: "2026-01-15", value: 4.0 }, { asOf: "2026-07-31", value: 4.6 }];
    expect(resolveFactorForecast(fc, target, "2026-03-01")).toMatchObject({ resolved: false });
    const r = resolveFactorForecast(fc, target, "2026-08-01");
    expect(r).toMatchObject({ resolved: true, outcome: 1, hit: true, resolvedAt: "2026-07-31" });
    const neutral = forecastFromSignal("f-vix", 0.02, "2026-01-15", { target: "f-recession", targetKind: "binary", horizonMonths: 3 }, null);
    expect(neutral.direction).toBe(0);
    expect(neutral.probability).toBe(0.5);
    expect(resolveFactorForecast(neutral, [{ asOf: "2026-03-31", value: 0 }], "2026-12-01")).toMatchObject({ resolved: false, reason: /neutral/ });
  });

  it("binary forecasts and the running score", () => {
    const fc = forecastFromSignal("f-curve-10y3m", -0.9, "2026-01-15", { target: "f-recession", targetKind: "binary", horizonMonths: 3 }, null);
    const r = resolveFactorForecast(fc, [{ asOf: "2026-02-28", value: 0 }, { asOf: "2026-04-15", value: 0 }], "2026-05-01");
    expect(r).toMatchObject({ resolved: true, outcome: 1 }); // said "no recession", none came
    let s: RunningScore = { indicatorId: "f-curve-10y3m", n: 0, brierSum: 0, hits: 0, lastScoredAsOf: null };
    s = updateRunning(s, r as Extract<typeof r, { resolved: true }>);
    expect(s.n).toBe(1);
    expect(meanBrier(s)).toBeLessThan(0.05);
    expect(skill(s)).toBeGreaterThan(0.8);
    expect(accuracyLine([s])).toMatch(/1 matured factor forecasts, mean Brier 0\.0\d\d/);
    expect(accuracyLine([])).toMatch(/no factor forecast has matured/);
  });
});

// ─── Ledger ───────────────────────────────────────────────────────────────────

const GDELT_ARTLIST = JSON.stringify({ articles: [
  { url: "https://www.reuters.com/markets/fed-chair-says-2026-09-21/", title: "Fed chair says rate path depends on inflation data", seendate: "20260921T143000Z", domain: "reuters.com", language: "English", sourcecountry: "United States" },
  { url: "https://www.reuters.com/markets/fed-chair-says-2026-09-21/", title: "duplicate url", seendate: "20260921T150000Z", domain: "reuters.com", language: "English" },
  { url: "https://example.org/fr", title: "Le président de la Fed", seendate: "20260921T160000Z", domain: "example.org", language: "French" },
  { url: "https://apnews.com/x", title: "Fed chair warns of tariff-driven price pressure", seendate: "20260922T010000Z", domain: "apnews.com", language: "English" },
] });
const WD_SEARCH = JSON.stringify({ search: [{ id: "Q12345", label: "Chair of the Federal Reserve" }] });
const WD_HOLDER = JSON.stringify({ results: { bindings: [{ holder: { value: "http://www.wikidata.org/entity/Q99999" }, holderLabel: { value: "Example Person" }, start: { value: "2026-05-15T00:00:00Z" } }] } });

describe("ledger — people and institutions, with citations", () => {
  it("tracks two dozen offices with a query, a category and a registered source", () => {
    expect(TRACKED_OFFICES.length).toBeGreaterThanOrEqual(20);
    for (const o of TRACKED_OFFICES) {
      expect(SOURCE_BY_ID.has(o.sourceId)).toBe(true);
      expect(o.gdeltQuery.length).toBeGreaterThan(5);
    }
    expect(LEDGER_CONNECTORS).toHaveLength(TRACKED_OFFICES.length);
  });

  it("GDELT articles become drafts: one per URL, English only, every draft cited, severity from the headline", () => {
    const office = TRACKED_OFFICES.find(o => o.id === "fed-chair")!;
    const drafts = draftsFromArticles(office, parseGdeltArtlist(GDELT_ARTLIST), TODAY, "Example Person");
    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({ statementDate: "2026-09-21", speaker: "Example Person (Chair of the Federal Reserve)", office: "Chair of the Federal Reserve", category: "rate-guidance", severity: "routine", sourceId: "gdelt-doc-api", sourceUrl: "https://www.reuters.com/markets/fed-chair-says-2026-09-21/" });
    expect(drafts[1].severity).toBe("warning");
    for (const d of drafts) expect(() => requireStatementCitation(d)).not.toThrow();
  });

  it("Wikidata: office search then current holder; unresolved on any failure, never a name from memory", async () => {
    expect(parseWikidataSearch(WD_SEARCH)).toEqual({ qid: "Q12345", label: "Chair of the Federal Reserve" });
    expect(parseWikidataHolder(WD_HOLDER)).toEqual({ qid: "Q99999", name: "Example Person", since: "2026-05-15" });
    expect(parseWikidataHolder(JSON.stringify({ results: { bindings: [] } }))).toBeNull();
    const office = TRACKED_OFFICES.find(o => o.id === "fed-chair")!;
    const fetchImpl: FetchLike = async url => (url.includes("wbsearchentities") ? ok(WD_SEARCH) : ok(WD_HOLDER));
    expect(await resolveOfficeHolder(fetchImpl, office)).toEqual({ officeQid: "Q12345", holderQid: "Q99999", name: "Example Person", since: "2026-05-15" });
    expect(await resolveOfficeHolder(async () => { throw new Error("down"); }, office)).toBeNull();
  });

  it("a ledger connector through the runner yields cited statements and one count observation; the holder note says when Wikidata did not answer", async () => {
    const office = TRACKED_OFFICES.find(o => o.id === "fed-chair")!;
    const fetchImpl: FetchLike = async url => {
      if (url.includes("gdeltproject")) return ok(GDELT_ARTLIST);
      if (url.includes("wbsearchentities")) return ok(WD_SEARCH);
      return ok(WD_HOLDER);
    };
    const run = await runAllConnectors({ fetchImpl, env: {}, today: TODAY, connectors: [ledgerConnector(office)] });
    expect(run.results[0].ok).toBe(true);
    expect(run.statements).toHaveLength(2);
    expect(run.statements.every(s => s.sourceUrl && s.office && s.speakerQid === "Q99999")).toBe(true);
    expect(run.observations[0]).toMatchObject({ indicatorId: "ledger:fed-chair", value: 2, sourceId: "gdelt-doc-api" });
    const dark = await runAllConnectors({ fetchImpl: async url => (url.includes("gdeltproject") ? ok(GDELT_ARTLIST) : (() => { throw new Error("wikidata down"); })()), env: {}, today: TODAY, connectors: [ledgerConnector(office)] });
    expect(dark.statements[0].speaker).toBe("Chair of the Federal Reserve");
    expect(dark.observations[0].note).toMatch(/holder unresolved/);
  });

  it("citation rules: no statement without a URL, no outcome without a URL", () => {
    expect(() => requireStatementCitation({ sourceUrl: undefined })).toThrow(/No statement without a citation/);
    expect(() => requireStatementCitation({ sourceUrl: "notaurl" })).toThrow();
    expect(() => requireOutcomeCitation("followed", undefined)).toThrow(/No outcome without a citation/);
    expect(() => requireOutcomeCitation("pending", undefined)).not.toThrow();
    expect(() => requireOutcomeCitation("reversed", "https://example.org/proof")).not.toThrow();
  });
});

// ─── The brief ────────────────────────────────────────────────────────────────

describe("the brief — since yesterday, budget, lookups", () => {
  const extras: BriefExtras = {
    asOf: TODAY,
    movers: [{ indicatorId: "ust10y", name: "10-year Treasury yield", previous: 4.5, latest: 4.9, changePct: 8.9, asOf: TODAY, unit: "%" }],
    newStatements: [{ speaker: "Example Person (Chair of the Federal Reserve)", office: "Chair of the Federal Reserve", claim: "Rate path depends on the data", date: "2026-09-21", sourceUrl: "https://www.reuters.com/x", category: "rate-guidance" }],
    darkSources: [{ sourceId: "us-tic-mfh", failStreak: 4, lastSuccessAt: "2026-09-17T00:00:00Z", lastDetail: "HTTP 503" }],
    accuracy: accuracyLine([]),
    factors: MACRO_FACTORS.map((f, i) => ({ id: f.id, verdict: i === 0 ? "signal" as const : "pending" as const, leadR: i === 0 ? 0.41 : null, hitRate: i === 0 ? 0.68 : null, coverageYears: i === 0 ? 44.7 : 0, earliestAsOf: i === 0 ? "1982-01-04" : null, status: i === 0 ? "live" : "unavailable", latestValue: i === 0 ? 0.41 : null, latestAsOf: i === 0 ? "2026-09-19" : null, signal: i === 0 ? 0.39 : null, meanBrier: null, liveN: 0 })),
    recentStatements: [{ id: "db-1", date: "2026-09-21", speaker: "Example Person (Chair of the Federal Reserve)", office: "Chair of the Federal Reserve", claim: "Rate path depends on the data", outcome: "pending", sourceUrl: "https://www.reuters.com/x", outcomeSourceUrl: null, category: "rate-guidance" }],
  };

  it("carries the since-yesterday block, the accuracy line, the factor counts and the coverage, within budget", () => {
    const b = buildMacroBrief(undefined, TODAY, extras);
    expect(b.text).toMatch(/SINCE YESTERDAY \(2026-09-22\)/);
    expect(b.text).toMatch(/Movers: 10-year Treasury yield 4\.5 → 4\.9 %/);
    expect(b.text).toMatch(/New statements \(1\)/);
    expect(b.text).toMatch(/Sources dark \(1\): us-tic-mfh ×4/);
    expect(b.text).toMatch(/ACCURACY: no factor forecast has matured yet/);
    expect(b.text).toMatch(/FACTORS: 1 signal \(measured lead\), 0 context .*, 24 pending backtest/);
    expect(b.text).toMatch(/f-curve-10y3m 44\.7y from 1982-01-04/);
    expect(b.chars).toBeLessThanOrEqual(A("brief.maxChars"));
    expect(b.trimmed).toBe(false);
    expect(b.text).toMatch(/"kind":"factor"/);
  });

  it("trims the since-yesterday block first when the budget is tight, never the model lines", () => {
    // The movers and statements lines are capped by count, so the accuracy line (uncapped, one line) is what overflows here.
    const loud = { ...extras, accuracy: "ACCURACY: " + "x".repeat(A("brief.maxChars")), newStatements: Array.from({ length: 40 }, (_, i) => ({ speaker: `Speaker ${i}`, claim: "x".repeat(200), date: TODAY, sourceUrl: "https://example.org/" + i, category: "rate-guidance" })) };
    const b = buildMacroBrief(undefined, TODAY, loud);
    expect(b.chars).toBeLessThanOrEqual(A("brief.maxChars"));
    expect(b.trimmed).toBe(true);
    expect(b.text).toMatch(/JAPAN LIQUIDATION/);
    expect(b.text).toMatch(/RULES:/);
    expect(b.text).toMatch(/trimmed to budget/);
  });

  it("without extras the brief says the first refresh is pending", () => {
    setBriefExtras(null);
    expect(buildMacroBrief(undefined, TODAY).text).toMatch(/SINCE YESTERDAY: no stored history read yet/);
  });

  it("factor and statement lookups parse, describe and execute in-process", () => {
    const f = parseMacroLookup('… MACRO_LOOKUP: {"kind":"factor","id":"f-curve-10y3m"} …')!;
    expect(f).toEqual({ kind: "factor", id: "f-curve-10y3m" });
    expect(describeMacroLookup(f)).toBe("factor f-curve-10y3m");
    const out = executeMacroLookup(f, extras);
    expect(out).toMatch(/factor f-curve-10y3m: 10-year minus 3-month Treasury spread \(FRED/);
    expect(out).toMatch(/Verdict: signal \(measured lead\); lead r 0\.41, hit rate 68%; coverage 44\.7 years from 1982-01-04/);
    expect(executeMacroLookup({ kind: "factor", id: "f-vix" }, extras)).toMatch(/Verdict: pending \(backtest pending/);
    expect(executeMacroLookup({ kind: "factor", id: "nope" }, extras)).toMatch(/no factor "nope"/);
    const s = parseMacroLookup('MACRO_LOOKUP: {"kind":"statement","query":"Federal Reserve"}')!;
    expect(s).toEqual({ kind: "statement", query: "Federal Reserve" });
    const so = executeMacroLookup(s, extras);
    expect(so).toMatch(/2026-09-21 Example Person \(Chair of the Federal Reserve\).*outcome pending <https:\/\/www\.reuters\.com\/x>/);
    // The Beijing seed ledger is gone (23 Sep 2026): a state-media query finds nothing.
    expect(executeMacroLookup({ kind: "statement", query: "Global Times" }, extras)).toMatch(/no ledger statement matches/);
    expect(executeMacroLookup({ kind: "statement", query: "zzzz-nothing" }, extras)).toMatch(/no ledger statement matches/);
    expect(parseMacroLookup('MACRO_LOOKUP: {"kind":"statement","query":""}')).toBeNull();
  });
});

// ─── The document ─────────────────────────────────────────────────────────────

describe("docs/macro/FACTORS.md is generated from the panel", () => {
  it("matches the renderer's pending-state output row for row", () => {
    const rendered = renderFactorsMarkdown({}, "2026-09-22");
    const committed = readFileSync(join(__dirname, "..", "docs", "macro", "FACTORS.md"), "utf8");
    expect(committed).toBe(rendered);
    expect(rendered.match(/^\| f-[a-z0-9-]+ \| .* \| (level|yoy|sahm|ratio-pct) \| /gm)!.length).toBe(25);
    expect(rendered).toMatch(/verdicts: 0 signal, 0 context, 25 pending/);
    const withVerdict = renderFactorsMarkdown({ "f-curve-10y3m": { verdict: { indicatorId: "f-curve-10y3m", verdict: "signal", leadR: 0.4, hitRate: 0.7, r0: 0.1, n: 400, horizonMonths: 12, reason: "", asOf: TODAY }, meta: { indicatorId: "f-curve-10y3m", sourceId: "fred", earliestAsOf: "1982-01-04", latestAsOf: TODAY, coverageYears: 44.7, points: 537, status: "live" } } }, TODAY);
    expect(withVerdict).toMatch(/\*\*signal\*\* \(r 0\.4, hit 70%, n 400\)/);
    expect(withVerdict).toMatch(/44\.7 \(stored from 1982-01-04\)/);
  });
});

// Keep the core runner honest with the new transport: the six core connectors still run against fixtures.
describe("core connectors still run under the transport rules", () => {
  it("every core and expansion connector answers (ok or a reasoned failure) through the hardened getText", async () => {
    const run = await runAllConnectors({ fetchImpl: async () => ok("{}"), env: {}, today: TODAY, connectors: [...CONNECTORS, ...EXPANSION_CONNECTORS] });
    expect(run.results.length).toBeGreaterThan(30);
    for (const r of run.results) expect(r.detail.length).toBeGreaterThan(0);
    expect(run.results.some(r => /allow-list/.test(r.detail))).toBe(false);
  });
  it("FACTOR_BY_ID resolves every factor", () => {
    for (const f of MACRO_FACTORS) expect(FACTOR_BY_ID.get(f.id)).toBe(f);
  });
});
