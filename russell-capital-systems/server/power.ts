// ============================================================
// THE PULSE — who holds the levers today, and the odds they change hands.
// Every reading is a dated snapshot in power_snapshots, so movement is a
// query. Keyless feeds:
//   - Congress: the unitedstates/congress-legislators current-members file
//     (public, maintained on GitHub) → Senate and House seats by party.
//   - Judiciary: the Federal Judicial Center's judges.csv (fjc.gov) → share
//     of sitting Article III judges appointed by Democratic presidents.
//   - Markets: Polymarket (Gamma API) and Kalshi (public market API) prices
//     for control of the presidency, Senate and House at the next election
//     → the market-implied chance of Democratic control, with the market's
//     own question stored beside the number.
//   - Governors, state legislatures, mayors: read by the AI council through
//     the harvest path with the verbatim-quote guard (server/forecastSources)
//     and approved by the owner; not machine feeds.
// A feed that does not answer leaves its lever at the last stored reading
// with that reading's date; nothing is filled in.
// ============================================================
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { powerSnapshots, type PowerSnapshotRow } from "../drizzle/schema";
import { CONTROL, LEVER_WEIGHTS, controlAt, type Party } from "@shared/powerHistory";
import { fetchFredObservationsSince } from "./_core/fred";

export type Lever = "president" | "senate" | "house" | "judiciary" | "governors" | "legislatures" | "mayors";
export type Reading = { lever: Lever; measure: string; value: number; asOf: string; source: string; detail?: string | null };

type Fetcher = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<unknown> }>;
const realFetch: Fetcher = (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20_000), headers: { accept: "application/json, text/csv, */*", "user-agent": "RussellCapitalSystems/1.0 (erosion engine)", ...(init?.headers ?? {}) } });
let _fetch: Fetcher = realFetch;
export function _setPowerFetchForTests(f: Fetcher | null) { _fetch = f ?? realFetch; }

const today = () => new Date().toISOString().slice(0, 10);
const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

// ─── Congress ───────────────────────────────────────────────────────────────
export const LEGISLATORS_URL = "https://unitedstates.github.io/congress-legislators/legislators-current.json";
type Legislator = { terms?: Array<{ type?: string; party?: string; start?: string; end?: string }> };

/** Pure: seat counts by party for each chamber from the current-members file. Independents are counted separately. */
export function parseLegislators(data: unknown): { senate: { D: number; R: number; I: number }; house: { D: number; R: number; I: number } } {
  const out = { senate: { D: 0, R: 0, I: 0 }, house: { D: 0, R: 0, I: 0 } };
  if (!Array.isArray(data)) return out;
  for (const raw of data as Legislator[]) {
    const term = raw.terms?.[raw.terms.length - 1];
    if (!term) continue;
    const chamber = term.type === "sen" ? "senate" : term.type === "rep" ? "house" : null;
    if (!chamber) continue;
    const p = (term.party ?? "").toLowerCase();
    const key = p.startsWith("democrat") ? "D" : p.startsWith("republican") ? "R" : "I";
    out[chamber][key] += 1;
  }
  return out;
}

export async function readCongress(): Promise<Reading[]> {
  const res = await _fetch(LEGISLATORS_URL);
  if (!res.ok) throw new Error(`legislators ${res.status}`);
  const counts = parseLegislators(await res.json());
  const d = today();
  const rows: Reading[] = [];
  for (const chamber of ["senate", "house"] as const) {
    const c = counts[chamber];
    const seated = c.D + c.R + c.I;
    if (!seated) continue;
    const detail = `${c.D} D, ${c.R} R, ${c.I} independent of ${seated} seated`;
    rows.push({ lever: chamber, measure: "dem_seats", value: c.D, asOf: d, source: "congress-legislators", detail });
    rows.push({ lever: chamber, measure: "rep_seats", value: c.R, asOf: d, source: "congress-legislators", detail });
    rows.push({ lever: chamber, measure: "dem_share", value: r4(c.D / seated), asOf: d, source: "congress-legislators", detail });
  }
  return rows;
}

// ─── Judiciary ──────────────────────────────────────────────────────────────
export const FJC_JUDGES_URL = "https://www.fjc.gov/sites/default/files/history/judges.csv";

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i += 1; row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

export type JudiciaryCounts = Record<"supreme" | "appeals" | "district" | "all", { D: number; R: number; other: number }>;

/** Pure: sitting Article III judges by the party of their appointing president, from the FJC export (any appointment sequence without a termination date). */
export function parseJudges(csv: string): JudiciaryCounts {
  const rows = parseCsv(csv);
  const header = rows[0] ?? [];
  const idx = (re: RegExp) => header.map((h, i) => (re.test(h.trim()) ? i : -1)).filter((i) => i >= 0);
  const seqs = idx(/^Court Type \(\d+\)$/i).map((ci) => {
    const n = header[ci]!.match(/\((\d+)\)/)![1];
    const find = (label: string) => header.findIndex((h) => h.trim().toLowerCase() === `${label} (${n})`.toLowerCase());
    return { court: ci, party: find("Party of Appointing President"), term: find("Termination Date"), commission: find("Commission Date") };
  }).filter((s) => s.party >= 0 && s.term >= 0);
  const out: JudiciaryCounts = { supreme: { D: 0, R: 0, other: 0 }, appeals: { D: 0, R: 0, other: 0 }, district: { D: 0, R: 0, other: 0 }, all: { D: 0, R: 0, other: 0 } };
  for (const r of rows.slice(1)) {
    for (const s of seqs) {
      const court = (r[s.court] ?? "").toLowerCase();
      if (!court || (r[s.term] ?? "").trim() || (s.commission >= 0 && !(r[s.commission] ?? "").trim())) continue;
      const level = court.includes("supreme") ? "supreme" : court.includes("appeals") ? "appeals" : court.includes("district") ? "district" : null;
      if (!level) continue;
      const p = (r[s.party] ?? "").toLowerCase();
      const key = p.startsWith("democrat") ? "D" : p.startsWith("republican") ? "R" : "other";
      out[level][key] += 1; out.all[key] += 1;
      break; // one sitting seat per person
    }
  }
  return out;
}

export async function readJudiciary(): Promise<Reading[]> {
  const res = await _fetch(FJC_JUDGES_URL);
  if (!res.ok) throw new Error(`fjc ${res.status}`);
  const c = parseJudges(await res.text());
  const d = today();
  const rows: Reading[] = [];
  for (const level of ["supreme", "appeals", "district", "all"] as const) {
    const x = c[level], n = x.D + x.R + x.other;
    if (!n) continue;
    rows.push({ lever: "judiciary", measure: `dem_share_${level}`, value: r4(x.D / n), asOf: d, source: "fjc-judges", detail: `${x.D} appointed by Democratic presidents, ${x.R} by Republican, ${x.other} other, of ${n} sitting (${level})` });
  }
  return rows;
}

// ─── Governors (Wikidata, keyless) ──────────────────────────────────────────
export const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
/** Current head of government (P6) of each U.S. state (P31 = Q35657) with the person's party (P102). Best-rank statements only. */
export const GOVERNORS_QUERY = `SELECT ?state ?stateLabel ?governor ?governorLabel ?party ?partyLabel WHERE { ?state wdt:P31 wd:Q35657 ; wdt:P6 ?governor . OPTIONAL { ?governor wdt:P102 ?party . } SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . } }`;
const DEM_PARTY = "http://www.wikidata.org/entity/Q29552", REP_PARTY = "http://www.wikidata.org/entity/Q29468";

/** Pure: governors by party from a SPARQL JSON result; one row per state (first party listed wins; independents and unknowns counted as other). */
export function parseGovernors(data: unknown): { D: number; R: number; other: number; states: number; byState: Array<{ state: string; governor: string; party: "D" | "R" | "other" }> } {
  const rows = ((data as { results?: { bindings?: Array<Record<string, { value?: string }>> } })?.results?.bindings ?? []);
  const seen = new Map<string, { state: string; governor: string; party: "D" | "R" | "other" }>();
  for (const b of rows) {
    const key = b.state?.value ?? ""; if (!key || seen.has(key)) continue;
    const p = b.party?.value ?? "", label = (b.partyLabel?.value ?? "").toLowerCase();
    const party: "D" | "R" | "other" = p === DEM_PARTY || label === "democratic party" ? "D" : p === REP_PARTY || label === "republican party" ? "R" : "other";
    seen.set(key, { state: b.stateLabel?.value ?? key, governor: b.governorLabel?.value ?? "", party });
  }
  const byState = Array.from(seen.values()).sort((a, b) => a.state.localeCompare(b.state));
  return { D: byState.filter((x) => x.party === "D").length, R: byState.filter((x) => x.party === "R").length, other: byState.filter((x) => x.party === "other").length, states: byState.length, byState };
}

export async function readGovernors(): Promise<Reading[]> {
  const res = await _fetch(`${WIKIDATA_SPARQL}?format=json&query=${encodeURIComponent(GOVERNORS_QUERY)}`, { headers: { accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`wikidata ${res.status}`);
  const g = parseGovernors(await res.json());
  if (g.states < 45) throw new Error(`wikidata returned ${g.states} states`);
  const d = today();
  const detail = `${g.D} Democratic, ${g.R} Republican, ${g.other} other of ${g.states} states (Wikidata P6/P102, best rank)`;
  return [
    { lever: "governors", measure: "dem_count", value: g.D, asOf: d, source: "wikidata", detail },
    { lever: "governors", measure: "rep_count", value: g.R, asOf: d, source: "wikidata", detail },
    { lever: "governors", measure: "dem_share", value: r4(g.D / Math.max(1, g.states)), asOf: d, source: "wikidata", detail: `${detail}; ${g.byState.map((x) => `${x.state}: ${x.party}`).join(", ")}`.slice(0, 500) },
  ];
}

// ─── Markets ────────────────────────────────────────────────────────────────
export type MarketRead = { venue: "polymarket" | "kalshi"; question: string; pDem: number; asOf: string; url?: string };
const CONTROL_QUERIES: Array<{ lever: Lever; terms: string[] }> = [
  { lever: "president", terms: ["presidential election winner party", "democrat win presidency"] },
  { lever: "senate", terms: ["senate control", "democrats win senate"] },
  { lever: "house", terms: ["house control", "democrats win house"] },
];
const mentions = (s: string, lever: Lever) => { const t = s.toLowerCase(); return lever === "president" ? /presiden/.test(t) : lever === "senate" ? /senate/.test(t) : /\bhouse\b/.test(t); };
const demSide = (s: string) => /democrat/i.test(s);
const repSide = (s: string) => /republican/i.test(s);

/** Pure: pick the market-implied chance of Democratic control from Polymarket's Gamma payload (search or markets list). */
export function parsePolymarket(data: unknown, lever: Lever): MarketRead | null {
  const events = Array.isArray(data) ? [] : ((data as { events?: unknown[] })?.events ?? []);
  const markets: Array<Record<string, unknown>> = [];
  if (Array.isArray(data)) markets.push(...(data as Array<Record<string, unknown>>));
  for (const e of events as Array<Record<string, unknown>>) { for (const m of (e.markets as Array<Record<string, unknown>> | undefined) ?? []) markets.push({ ...m, eventTitle: e.title, eventSlug: e.slug }); }
  for (const m of markets) {
    if (m.closed === true || m.active === false) continue;
    const q = String(m.question ?? m.eventTitle ?? "");
    if (!mentions(q, lever) || !/control|win|winner|party/i.test(q)) continue;
    const outcomes = (typeof m.outcomes === "string" ? JSON.parse(m.outcomes) : m.outcomes) as string[] | undefined;
    const prices = (typeof m.outcomePrices === "string" ? JSON.parse(m.outcomePrices) : m.outcomePrices) as Array<string | number> | undefined;
    if (!outcomes?.length || !prices?.length) continue;
    let i = outcomes.findIndex(demSide);
    let flip = false;
    if (i < 0 && demSide(q)) i = outcomes.findIndex((o) => /^yes$/i.test(o));
    else if (i < 0 && repSide(q)) { i = outcomes.findIndex((o) => /^yes$/i.test(o)); flip = true; }
    if (i < 0) continue;
    const p = Number(prices[i]);
    if (!Number.isFinite(p)) continue;
    const asOf = String(m.updatedAt ?? m.endDate ?? "").slice(0, 10) || today();
    return { venue: "polymarket", question: q, pDem: r4(flip ? 1 - p : p), asOf, url: m.eventSlug ? `https://polymarket.com/event/${m.eventSlug}` : undefined };
  }
  return null;
}

/** Pure: the same from Kalshi's markets list (prices in cents). */
export function parseKalshi(data: unknown, lever: Lever): MarketRead | null {
  const markets = ((data as { markets?: Array<Record<string, unknown>> })?.markets ?? []);
  for (const m of markets) {
    if (m.status && String(m.status) !== "open" && String(m.status) !== "active") continue;
    const title = String(m.title ?? m.subtitle ?? "");
    if (!mentions(title, lever) || !/control|win|winner|party/i.test(title)) continue;
    const yes = String(m.yes_sub_title ?? m.subtitle ?? "");
    const raw = m.last_price ?? m.yes_bid ?? m.yes_ask;
    const cents = Number(raw);
    if (!Number.isFinite(cents)) continue;
    const pYes = cents > 1 ? cents / 100 : cents;
    let pDem: number | null = null;
    if (demSide(yes) || (demSide(title) && !repSide(title))) pDem = pYes;
    else if (repSide(yes) || repSide(title)) pDem = 1 - pYes;
    if (pDem == null) continue;
    const asOf = String(m.updated_time ?? m.last_updated ?? "").slice(0, 10) || today();
    return { venue: "kalshi", question: `${title}${yes ? ` — ${yes}` : ""}`, pDem: r4(pDem), asOf, url: m.ticker ? `https://kalshi.com/markets/${String(m.ticker).toLowerCase()}` : undefined };
  }
  return null;
}

/** Known Polymarket event slugs for the control markets (verified Sept. 2026); the search terms are the fallback for the next cycle. */
export const POLYMARKET_SLUGS: Record<"president" | "senate" | "house", string[]> = {
  president: ["which-party-wins-2028-us-presidential-election"],
  senate: ["which-party-will-win-the-senate-in-2026"],
  house: ["which-party-will-win-the-house-in-2026"],
};

/** Kalshi: discover the control series by title from the public series list, then read its markets. No tickers are hard-coded. */
export async function kalshiControlMarkets(lever: Lever): Promise<MarketRead | null> {
  const res = await _fetch("https://api.elections.kalshi.com/trade-api/v2/series?category=Politics&limit=200");
  if (!res.ok) throw new Error(`kalshi series ${res.status}`);
  const data = (await res.json()) as { series?: Array<{ ticker?: string; title?: string; category?: string }> };
  const candidates = (data.series ?? []).filter((s) => s.ticker && s.title && mentions(s.title, lever) && /control|win|winner|party/i.test(s.title));
  for (const s of candidates.slice(0, 4)) {
    const r = await _fetch(`https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=${encodeURIComponent(s.ticker!)}&status=open&limit=50`);
    if (!r.ok) continue;
    const m = parseKalshi(await r.json(), lever);
    if (m) return m;
  }
  return null;
}

export async function readMarkets(): Promise<Reading[]> {
  const rows: Reading[] = [];
  for (const q of CONTROL_QUERIES) {
    let got = false;
    // Polymarket: the known event slug first, then the search terms.
    for (const slug of POLYMARKET_SLUGS[q.lever as "president" | "senate" | "house"] ?? []) {
      try {
        const res = await _fetch(`https://gamma-api.polymarket.com/events?slug=${encodeURIComponent(slug)}`);
        if (res.ok) { const data = await res.json(); const m = parsePolymarket({ events: Array.isArray(data) ? data : [data] }, q.lever); if (m) { rows.push({ lever: q.lever, measure: "p_dem_next", value: m.pDem, asOf: m.asOf, source: "polymarket", detail: `${m.question}${m.url ? ` — ${m.url}` : ""}`.slice(0, 500) }); got = true; break; } }
      } catch (e) { console.warn("[power] polymarket slug", slug, String(e).slice(0, 100)); }
    }
    if (!got) for (const term of q.terms) {
      try {
        const res = await _fetch(`https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(term)}&limit_per_type=10`);
        if (res.ok) { const m = parsePolymarket(await res.json(), q.lever); if (m) { rows.push({ lever: q.lever, measure: "p_dem_next", value: m.pDem, asOf: m.asOf, source: "polymarket", detail: `${m.question}${m.url ? ` — ${m.url}` : ""}`.slice(0, 500) }); break; } }
      } catch (e) { console.warn("[power] polymarket", q.lever, String(e).slice(0, 100)); }
    }
    try {
      const m = await kalshiControlMarkets(q.lever);
      if (m) rows.push({ lever: q.lever, measure: "p_dem_next", value: m.pDem, asOf: m.asOf, source: "kalshi", detail: `${m.question}${m.url ? ` — ${m.url}` : ""}`.slice(0, 500) });
    } catch (e) { console.warn("[power] kalshi", q.lever, String(e).slice(0, 100)); }
  }
  return rows;
}

// ─── Snapshots ──────────────────────────────────────────────────────────────
export async function storeReadings(readings: Reading[]): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  let n = 0;
  // A reading that cannot be stored is logged and skipped; it must never cost the other levers their reading.
  const clean = (s: string | null | undefined) => (s == null ? null : s.replace(/[\uD800-\uDFFF]/g, "").replace(/\s+/g, " ").trim().slice(0, 480) || null);
  for (const r of readings) {
    const row = { lever: r.lever, measure: r.measure, value: String(Math.round(r.value * 10_000) / 10_000), asOf: r.asOf, source: r.source.slice(0, 120), detail: clean(r.detail) };
    try { await db.insert(powerSnapshots).values(row); n += 1; }
    catch (e) {
      const err = e as { code?: string; sqlMessage?: string; cause?: { code?: string; sqlMessage?: string } };
      const code = err.code ?? err.cause?.code ?? "";
      if (String(code).includes("ER_DUP_ENTRY") || /Duplicate entry/i.test(err.sqlMessage ?? err.cause?.sqlMessage ?? String(e))) {
        try { await db.update(powerSnapshots).set({ value: row.value, detail: row.detail, fetchedAt: new Date() }).where(and(eq(powerSnapshots.lever, r.lever), eq(powerSnapshots.measure, r.measure), eq(powerSnapshots.asOf, r.asOf), eq(powerSnapshots.source, row.source))); }
        catch (e2) { console.warn("[power] update failed", r.lever, r.measure, String((e2 as { cause?: { sqlMessage?: string } })?.cause?.sqlMessage ?? e2).slice(0, 200)); }
      } else {
        console.warn("[power] store failed", r.lever, r.measure, code, String(err.sqlMessage ?? err.cause?.sqlMessage ?? e).slice(0, 200));
      }
    }
  }
  return n;
}

export type SnapshotView = { id: number; lever: Lever; measure: string; value: number; asOf: string; source: string; detail: string | null; fetchedAt: Date };
const view = (r: PowerSnapshotRow): SnapshotView => ({ id: r.id, lever: r.lever as Lever, measure: r.measure, value: Number(r.value), asOf: r.asOf, source: r.source, detail: r.detail, fetchedAt: r.fetchedAt });

export async function listSnapshots(opts: { levers?: Lever[]; limit?: number } = {}): Promise<SnapshotView[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = opts.levers?.length ? await db.select().from(powerSnapshots).where(inArray(powerSnapshots.lever, opts.levers)).orderBy(desc(powerSnapshots.asOf)).limit(opts.limit ?? 2000) : await db.select().from(powerSnapshots).orderBy(desc(powerSnapshots.asOf)).limit(opts.limit ?? 2000);
  return rows.map(view);
}

/** The latest reading per lever × measure (any source; markets averaged across venues on the latest date). */
export async function latestReadings(): Promise<Record<string, { value: number; asOf: string; sources: string[]; detail: string | null }>> {
  const all = await listSnapshots();
  const out: Record<string, { value: number; asOf: string; sources: string[]; detail: string | null; n: number }> = {};
  for (const s of all) {
    const k = `${s.lever}.${s.measure}`;
    const cur = out[k];
    if (!cur) { out[k] = { value: s.value, asOf: s.asOf, sources: [s.source], detail: s.detail, n: 1 }; continue; }
    if (s.asOf === cur.asOf && !cur.sources.includes(s.source)) { cur.value = (cur.value * cur.n + s.value) / (cur.n + 1); cur.n += 1; cur.sources.push(s.source); cur.detail = [cur.detail, s.detail].filter(Boolean).join(" | "); }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { value: r4(v.value), asOf: v.asOf, sources: v.sources, detail: v.detail }]));
}

// ─── The pulse ──────────────────────────────────────────────────────────────
export type PowerNow = {
  asOf: string;
  today: { president: Party; senate: Party; house: Party; trifecta: Party | null; leverShare: number; source: string };
  seats: { senate?: { dem: number; rep: number; asOf: string }; house?: { dem: number; rep: number; asOf: string } };
  judiciary?: { all: number; supreme?: number; appeals?: number; district?: number; asOf: string };
  governors?: { dem: number; rep: number; share: number; asOf: string; detail: string | null };
  markets: Partial<Record<"president" | "senate" | "house", { pDem: number; asOf: string; sources: string[]; detail: string | null }>>;
  /** Expected Democratic lever share after the next elections, from the markets where they have spoken and today's holder elsewhere. */
  expectedShareNext: number;
  marketsSpoke: number;
};

export async function powerNow(): Promise<PowerNow> {
  const year = new Date().getFullYear();
  const rec = controlAt(year) ?? controlAt(CONTROL[CONTROL.length - 1]!.year)!;
  const latest = await latestReadings();
  const seatDem = (ch: "senate" | "house") => latest[`${ch}.dem_seats`], seatRep = (ch: "senate" | "house") => latest[`${ch}.rep_seats`];
  // Today's chambers: the live seat count where it exists, else the record.
  const chamber = (ch: "senate" | "house"): Party => { const d = seatDem(ch), r = seatRep(ch); return d && r ? (d.value > r.value ? "D" : d.value < r.value ? "R" : rec[ch]) : rec[ch]; };
  const t = { president: rec.president, senate: chamber("senate"), house: chamber("house") };
  const trifecta = t.president === t.senate && t.senate === t.house ? t.president : null;
  const leverShare = r4((t.president === "D" ? LEVER_WEIGHTS.president : 0) + (t.senate === "D" ? LEVER_WEIGHTS.senate : 0) + (t.house === "D" ? LEVER_WEIGHTS.house : 0));
  const markets: PowerNow["markets"] = {};
  let expected = 0, spoke = 0;
  for (const lever of ["president", "senate", "house"] as const) {
    const m = latest[`${lever}.p_dem_next`];
    if (m) { markets[lever] = { pDem: m.value, asOf: m.asOf, sources: m.sources, detail: m.detail }; expected += LEVER_WEIGHTS[lever] * m.value; spoke += 1; }
    else expected += t[lever] === "D" ? LEVER_WEIGHTS[lever] : 0;
  }
  const seats: PowerNow["seats"] = {};
  for (const ch of ["senate", "house"] as const) { const d = seatDem(ch), r = seatRep(ch); if (d && r) seats[ch] = { dem: d.value, rep: r.value, asOf: d.asOf }; }
  const j = latest["judiciary.dem_share_all"];
  const judiciary = j ? { all: j.value, supreme: latest["judiciary.dem_share_supreme"]?.value, appeals: latest["judiciary.dem_share_appeals"]?.value, district: latest["judiciary.dem_share_district"]?.value, asOf: j.asOf } : undefined;
  const gd = latest["governors.dem_count"], gr = latest["governors.rep_count"], gs = latest["governors.dem_share"];
  const governors = gd && gr && gs ? { dem: gd.value, rep: gr.value, share: gs.value, asOf: gs.asOf, detail: gs.detail } : undefined;
  const dates = Object.values(latest).map((x) => x.asOf).sort();
  return { asOf: dates[dates.length - 1] ?? `${year}-01-01`, today: { ...t, trifecta, leverShare, source: seats.senate || seats.house ? "live seat counts + the record" : "the record (powerHistory.ts)" }, seats, judiciary, governors, markets, expectedShareNext: r4(expected), marketsSpoke: spoke };
}

export type SweepResult = { congress: number | string; judiciary: number | string; governors: number | string; markets: number | string; stored: number };
/** Read every machine feed and store the readings. Each feed fails alone. */
export async function powerSweep(): Promise<SweepResult> {
  const all: Reading[] = [];
  const out: SweepResult = { congress: 0, judiciary: 0, governors: 0, markets: 0, stored: 0 };
  for (const [key, fn] of [["congress", readCongress], ["judiciary", readJudiciary], ["governors", readGovernors], ["markets", readMarkets]] as const) {
    try { const rows = await fn(); all.push(...rows); out[key] = rows.length; }
    catch (e) { out[key] = `failed: ${String(e).slice(0, 80)}`; }
  }
  out.stored = await storeReadings(all);
  return out;
}

// ─── Inflation under each configuration (history, not a forecast) ───────────
export type InflationByControl = { from: number; to: number; source: string; byBucket: Record<"left" | "divided" | "right", { years: number; meanInflation: number }>; byTrifecta: Record<"D" | "R" | "none", { years: number; meanInflation: number }>; caveat: string };
/** Average December-to-December CPI inflation under each control configuration since 1946, from FRED's CPI series. */
export async function inflationByControl(fetchSeries: (id: string, start: string) => Promise<Array<{ date: string; value: number }>> = (id, start) => fetchFredObservationsSince(id, start)): Promise<InflationByControl | null> {
  const obs = await fetchSeries("CPIAUCSL", "1946-01-01").catch(() => [] as Array<{ date: string; value: number }>);
  const dec = new Map<number, number>();
  for (const o of obs) if (o.date.endsWith("-12-01")) dec.set(Number(o.date.slice(0, 4)), o.value);
  const acc = { left: [] as number[], divided: [] as number[], right: [] as number[] }, tri = { D: [] as number[], R: [] as number[], none: [] as number[] };
  let from = Infinity, to = -Infinity;
  for (const c of CONTROL) {
    const a = dec.get(c.year - 1), b = dec.get(c.year);
    if (a == null || b == null || c.year < 1947) continue;
    const infl = b / a - 1;
    const share = (c.president === "D" ? 0.5 : 0) + (c.senate === "D" ? 0.25 : 0) + (c.house === "D" ? 0.25 : 0);
    acc[share >= 2 / 3 ? "left" : share <= 1 / 3 ? "right" : "divided"].push(infl);
    tri[c.president === c.senate && c.senate === c.house ? c.president : "none"].push(infl);
    from = Math.min(from, c.year); to = Math.max(to, c.year);
  }
  if (!Number.isFinite(from)) return null;
  const mean = (xs: number[]) => ({ years: xs.length, meanInflation: xs.length ? r4(xs.reduce((s, x) => s + x, 0) / xs.length) : 0 });
  return { from, to, source: "BLS CPI-U (CPIAUCSL) via FRED, December over December; control per powerHistory.ts", byBucket: { left: mean(acc.left), divided: mean(acc.divided), right: mean(acc.right) }, byTrifecta: { D: mean(tri.D), R: mean(tri.R), none: mean(tri.none) }, caveat: "History, not a forecast: the Federal Reserve, oil, wars and supply shocks have moved prices far more than which party held Congress. Shown so the client can see the record; it does not feed the ladder." };
}

let pulseTimer: NodeJS.Timeout | null = null;
/** The pulse is free (no AI): weekly by default, first reading half a minute after boot when none exists for today. POWER_PULSE_DAYS=0 turns it off. */
export function startPulseSchedule(env: NodeJS.ProcessEnv = process.env): boolean {
  const days = env.POWER_PULSE_DAYS === undefined ? 7 : Number(env.POWER_PULSE_DAYS);
  if (!Number.isFinite(days) || days <= 0 || pulseTimer) return false;
  const run = () => powerSweep().then((r) => console.log("[power] pulse:", JSON.stringify(r))).catch((e) => console.warn("[power] pulse failed", String(e).slice(0, 160)));
  // At boot: read again unless every lever already has a reading from today (a new feed or market added since the last pulse gets read at once).
  const LEVER_KEYS = ["senate.dem_seats", "house.dem_seats", "judiciary.dem_share_all", "governors.dem_share", "president.p_dem_next", "senate.p_dem_next", "house.p_dem_next"];
  setTimeout(async () => { try { const latest = await latestReadings(); const fresh = LEVER_KEYS.every((k) => latest[k]?.asOf === today()); if (!fresh) await run(); } catch { await run(); } }, 30_000).unref?.();
  pulseTimer = setInterval(run, days * 86_400_000);
  pulseTimer.unref?.();
  return true;
}
