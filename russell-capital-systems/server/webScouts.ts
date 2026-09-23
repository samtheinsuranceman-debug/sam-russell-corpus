// ============================================================
// WEB SCOUTS — the two search keys on the Railway service that no code read.
//
// YOU_API_KEY (You.com Search) and NIMBLE_API_KEY (Nimble SERP) are not chat
// brains, so they do not belong in the Brain Hub chain. They are scouts: they
// fetch live web results that a brain can then read and cite. Keys are read
// from the environment on every call and never logged or returned.
//
// Endpoints (overridable, because both vendors have moved them before):
//   You.com  GET  https://api.you.com/v1/search?query=…   (Bearer + X-API-Key)
//            falls back to https://ydc-index.io/v1/search
//            override: YOU_SEARCH_URL
//   Nimble   POST https://api.webit.live/api/v1/realtime/serp   (Basic)
//            override: NIMBLE_SERP_URL
// ============================================================

export type ScoutId = "you" | "nimble";

export type ScoutResult = { title: string; url: string; snippet: string };

export type ScoutAnswer = {
  scoutId: ScoutId;
  ok: boolean;
  results: ScoutResult[];
  latencyMs: number;
  error?: string;
};

type FetchLike = typeof fetch;

const YOU_URLS = ["https://api.you.com/v1/search", "https://ydc-index.io/v1/search"];
const NIMBLE_URL = "https://api.webit.live/api/v1/realtime/serp";

const envKey = (names: string[]): string | null => {
  for (const n of names) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  return null;
};

export const youKey = () => envKey(["YOU_API_KEY", "YDC_API_KEY"]);
export const nimbleKey = () => envKey(["NIMBLE_API_KEY"]);

/** Which scouts have a key right now (names only). */
export function liveScoutIds(): ScoutId[] {
  const ids: ScoutId[] = [];
  if (youKey()) ids.push("you");
  if (nimbleKey()) ids.push("nimble");
  return ids;
}

const clean = (s: unknown): string => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "");

/** You.com: results.web[] with url, title, description, snippets[]. Older shape: hits[]. */
export function parseYou(json: any): ScoutResult[] {
  const web: any[] = json?.results?.web ?? json?.hits ?? [];
  return web
    .map(r => ({
      title: clean(r?.title),
      url: clean(r?.url),
      snippet: clean(Array.isArray(r?.snippets) && r.snippets.length ? r.snippets.join(" ") : r?.description ?? r?.snippet),
    }))
    .filter(r => r.url);
}

/**
 * Nimble's parsed SERP shape varies by engine, so walk the JSON and keep every
 * object that carries a link and a title. Deduplicated by URL, order kept.
 */
export function parseNimble(json: any): ScoutResult[] {
  const out: ScoutResult[] = [];
  const seen = new Set<string>();
  const visit = (node: any, depth: number) => {
    if (!node || depth > 8) return;
    if (Array.isArray(node)) {
      for (const n of node) visit(n, depth + 1);
      return;
    }
    if (typeof node !== "object") return;
    const url = clean(node.url ?? node.link ?? node.href);
    const title = clean(node.title ?? node.name);
    if (url && /^https?:\/\//.test(url) && title && !seen.has(url)) {
      seen.add(url);
      out.push({ title, url, snippet: clean(node.snippet ?? node.description ?? node.text) });
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === "html_content") continue;
      if (v && typeof v === "object") visit(v, depth + 1);
    }
  };
  visit(json?.parsing ?? json, 0);
  return out;
}

async function timed(scoutId: ScoutId, run: () => Promise<ScoutResult[]>): Promise<ScoutAnswer> {
  const t0 = Date.now();
  try {
    const results = await run();
    return { scoutId, ok: true, results, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { scoutId, ok: false, results: [], latencyMs: Date.now() - t0, error: e instanceof Error ? e.message : "failed" };
  }
}

const withTimeout = (ms: number) => AbortSignal.timeout(ms);

export async function youSearch(query: string, count = 8, f: FetchLike = fetch): Promise<ScoutAnswer> {
  return timed("you", async () => {
    const key = youKey();
    if (!key) throw new Error("YOU_API_KEY is not set");
    const override = process.env.YOU_SEARCH_URL?.trim();
    const urls = override ? [override] : YOU_URLS;
    let last = "no endpoint answered";
    for (const base of urls) {
      const u = new URL(base);
      u.searchParams.set("query", query);
      u.searchParams.set("count", String(count));
      const res = await f(u.toString(), {
        headers: { authorization: `Bearer ${key}`, "x-api-key": key, accept: "application/json" },
        signal: withTimeout(20_000),
      });
      if (res.ok) return parseYou(await res.json()).slice(0, count);
      last = `You.com ${res.status}`;
      // A rejected key is a configuration fault on every host; stop early.
      if (res.status === 401 || res.status === 403) break;
    }
    throw new Error(last);
  });
}

/** Nimble issues a base64 credential; a raw "user:pass" pair is encoded here. */
export const nimbleBasic = (key: string): string =>
  key.includes(":") ? Buffer.from(key, "utf8").toString("base64") : key;

export async function nimbleSearch(query: string, count = 8, f: FetchLike = fetch): Promise<ScoutAnswer> {
  return timed("nimble", async () => {
    const key = nimbleKey();
    if (!key) throw new Error("NIMBLE_API_KEY is not set");
    const res = await f(process.env.NIMBLE_SERP_URL?.trim() || NIMBLE_URL, {
      method: "POST",
      headers: { authorization: `Basic ${nimbleBasic(key)}`, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, search_engine: "google_search", parse: true, num_results: count }),
      signal: withTimeout(45_000),
    });
    if (!res.ok) throw new Error(`Nimble ${res.status}`);
    return parseNimble(await res.json()).slice(0, count);
  });
}

/** Ask every keyed scout at once. A scout without a key is simply absent. */
export async function scoutSearch(query: string, count = 8, f: FetchLike = fetch): Promise<ScoutAnswer[]> {
  const jobs: Promise<ScoutAnswer>[] = [];
  if (youKey()) jobs.push(youSearch(query, count, f));
  if (nimbleKey()) jobs.push(nimbleSearch(query, count, f));
  return Promise.all(jobs);
}

/** Render scout results as a citable block a brain can be handed. */
export function scoutContext(answers: ScoutAnswer[], max = 10): string {
  const rows = answers.flatMap(a => a.results.map(r => ({ ...r, via: a.scoutId }))).slice(0, max);
  if (!rows.length) return "";
  return ["LIVE WEB RESULTS (cite by URL):", ...rows.map((r, i) => `[${i + 1}] ${r.title} — ${r.url}\n    ${r.snippet}`)].join("\n");
}
