// ============================================================
// SHORT-TERM RENTAL SOURCES — server side of the protocol. The AI opens a
// registry site's page for the client's place, reads it as text, and reports
// only figures whose sentence is really on the page (the same verbatim-quote
// guard the forecaster harvest uses). Nothing read here is stored as the
// record: it comes back to the page as "<figure>, read on <date> from <url>"
// and the client decides whether to type it in.
// ============================================================
import { STR_SOURCES, affordabilityFromFactFinder, configuredStrApis, placesFromText, strLookupUrl, strSource, type StrSource } from "@shared/strSources";
import { fetchSourceText, quoteVerified } from "./forecastSources";
import { configuredProviders, leadModel } from "./ultraAI";

export const STR_READ_METRICS = ["nightly_rate", "occupancy_pct", "monthly_revenue", "annual_revenue", "revpar", "listings_count", "median_price"] as const;
export type StrReadMetric = (typeof STR_READ_METRICS)[number];

export const STR_READ_SYSTEM = `You read the text of a short-term-rental data site's page for a financial-planning platform. Report only figures that appear in the text. Reply with JSON only: {"figures":[{"metric": string, "value": number, "unit": string, "place": string or null, "quote": string}]}. metric must be one of: ${STR_READ_METRICS.join(", ")}. unit is the unit as written (USD, USD/night, %, listings). place is the city, zip or address the figure is for if the text says, else null. quote is the exact sentence from the text that contains the figure, copied verbatim; a figure without a verbatim quote is discarded. Never invent, round, convert, or infer figures. If the text has no such figures, reply {"figures":[]}.`;

export type StrFigure = { metric: StrReadMetric; value: number; unit: string; place: string | null; quote: string };

export function parseStrReadReply(text: string): StrFigure[] {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return [];
  try {
    const j = JSON.parse(m[0]) as { figures?: unknown };
    if (!Array.isArray(j.figures)) return [];
    return j.figures.flatMap((raw) => {
      const c = raw as Record<string, unknown>;
      const metric = String(c.metric ?? ""), quote = String(c.quote ?? ""), value = Number(c.value);
      if (!(STR_READ_METRICS as readonly string[]).includes(metric) || !quote || !Number.isFinite(value)) return [];
      return [{ metric: metric as StrReadMetric, value, unit: String(c.unit ?? "").slice(0, 20), place: c.place == null ? null : String(c.place).slice(0, 80), quote: quote.slice(0, 600) }];
    });
  } catch { return []; }
}

/** A figure is admissible only if its sentence is really on the page and the number really is in that sentence. */
export function strFigureVerified(pageText: string, f: StrFigure): boolean {
  return quoteVerified(pageText, { metric: f.metric, horizonYear: 2000, value: f.value, unit: f.unit, baseValue: null, asOf: null, quote: f.quote });
}

export type StrReadResult =
  | { ok: true; sourceId: string; source: string; url: string; readAt: string; pageChars: number; via: string | null; reported: number; figures: StrFigure[]; note: string }
  | { ok: false; sourceId: string; source: string; url: string; readAt: string; reason: string };

type Ask = (system: string, user: string) => Promise<{ text: string; via: string } | null>;

/** Open the registry site's page for the place, read it, keep the quote-verified figures. Only registry sources: the server never fetches an arbitrary URL. */
export async function readStrPage(input: { sourceId: string; place?: string; zip?: string; address?: string }, opts: { fetchText?: (url: string) => Promise<string>; ask?: Ask; today?: string } = {}): Promise<StrReadResult> {
  const readAt = opts.today ?? new Date().toISOString().slice(0, 10);
  const src = strSource(input.sourceId);
  if (!src) return { ok: false, sourceId: input.sourceId, source: input.sourceId, url: "", readAt, reason: "Not a registry source" };
  const url = strLookupUrl(src, input);
  const fetchText = opts.fetchText ?? ((u: string) => fetchSourceText({ id: src.id, url: u }, 40_000));
  let text: string;
  try { text = await fetchText(url); } catch (e) { return { ok: false, sourceId: src.id, source: src.name, url, readAt, reason: `Could not read ${url}: ${String(e).slice(0, 120)}` }; }
  if (!text || text.length < 200) return { ok: false, sourceId: src.id, source: src.name, url, readAt, reason: src.serverReadable ? `Nothing readable at ${url}` : `${src.name} renders its figures in the browser, not in the page text; open it with the button and type the figure in.` };
  const ask = opts.ask ?? (configuredProviders().length ? leadModel : null);
  if (!ask) return { ok: false, sourceId: src.id, source: src.name, url, readAt, reason: "No AI provider is configured on the host; open the page with the button." };
  const placeLine = [input.address, input.place, input.zip].filter(Boolean).join(" · ");
  const reply = await ask(STR_READ_SYSTEM, `Source: ${src.name}, ${url}\nPublishes: ${src.publishes}\nThe client's place: ${placeLine || "not stated"}\n\nText of the page:\n${text.slice(0, 14_000)}\n\nReport every short-term-rental figure in the text.`);
  if (!reply) return { ok: false, sourceId: src.id, source: src.name, url, readAt, reason: "The AI did not answer; try again in a moment." };
  const cands = parseStrReadReply(reply.text);
  const figures = cands.filter((f) => strFigureVerified(text, f));
  return { ok: true, sourceId: src.id, source: src.name, url, readAt, pageChars: text.length, via: reply.via, reported: cands.length, figures, note: figures.length ? `Each figure below is quoted from the page as read on ${readAt}; it is ${src.name}'s estimate, not the platform's, and is not stored.` : `The page was read (${text.length} characters) but no figure with a verbatim sentence was found${src.serverReadable ? "" : "; this site draws its numbers in the browser, so open it with the button"}.` };
}

// ─── Suggestion: places, affordability and the buttons, from the client's own words ──
export type StrSuggestion = {
  places: string[];
  zips: Array<{ zip: string; label: string }>;
  affordability: ReturnType<typeof affordabilityFromFactFinder>;
  readFrom: string[];
  sources: Array<{ id: string; name: string; kind: StrSource["kind"]; apiStatus: StrSource["api"]["status"]; apiConfigured: boolean; serverReadable: boolean; links: Array<{ place: string; url: string }> }>;
  apisConfigured: Array<{ id: string; name: string; envKey: string }>;
};

export function suggestStr(ff: { sections?: Record<string, Record<string, unknown>>; lists?: Record<string, Array<Record<string, unknown>>> } | null | undefined, opts: { notes?: string; zips?: Array<{ zip: string; label: string }>; downPct?: number; closingPct?: number; env?: Record<string, string | undefined> } = {}): StrSuggestion {
  const goals = ff?.sections?.goals ?? {}, retire = ff?.sections?.retirement ?? {};
  const readFrom: string[] = [];
  const parts: string[] = [];
  for (const [k, label] of [["topGoals", "top goals"], ["fiveYearGoals", "5-year goals"], ["tenYearGoals", "10-year goals"], ["moreMoneyScenario", "more-money scenario"]] as const) {
    const v = String(goals[k] ?? "").trim();
    if (v) { parts.push(v); readFrom.push(`Fact Finder ${label}`); }
  }
  const relo = String(retire.relocationPlans ?? "").trim();
  if (relo) { parts.push(relo); readFrom.push("Fact Finder relocation plans"); }
  if (opts.notes?.trim()) { parts.push(opts.notes.trim()); readFrom.push("what you just said"); }
  const found = placesFromText(parts.join(". "));
  const zips = [...(opts.zips ?? [])];
  found.zips.forEach((z) => { if (!zips.some((x) => x.zip === z)) zips.push({ zip: z, label: "Mentioned" }); });
  const env = opts.env ?? process.env;
  const apisConfigured = configuredStrApis(env);
  const targets = found.places.length ? found.places : zips.map((z) => z.zip);
  const sources = STR_SOURCES.map((s) => ({
    id: s.id, name: s.name, kind: s.kind, apiStatus: s.api.status, apiConfigured: apisConfigured.some((a) => a.id === s.id), serverReadable: s.serverReadable,
    links: (targets.length ? targets : [""]).map((p) => ({ place: p, url: strLookupUrl(s, /^\d{5}$/.test(p) ? { zip: p, place: p } : { place: p }) })),
  }));
  return { places: found.places, zips, affordability: affordabilityFromFactFinder(ff, { downPct: opts.downPct, closingPct: opts.closingPct }), readFrom, sources, apisConfigured };
}
