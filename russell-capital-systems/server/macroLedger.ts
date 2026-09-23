/**
 * Macro Ledger — statements by people and institutions, with citations (W8).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The follow-through ledger began as Beijing's official channels. This file
 * extends population to any tracked office (`shared/macro/people.ts`):
 *
 *   • GDELT DOC API (keyless): the last 24 hours of articles matching the
 *     office's query become ledger drafts. Every draft carries the article
 *     URL as its citation — a statement without a URL cannot be built here.
 *   • Wikidata (keyless): the office item's current holder (P1308) names the
 *     speaker, so the ledger never carries a name typed from memory. When
 *     Wikidata does not answer, the draft names the office alone.
 *
 * Outcomes are never inferred here. They are attached on the 36-hour review
 * through the router, which refuses an outcome without an outcome URL.
 *
 * PORT TO THE TRUNK: copies unchanged with `macroConnectors.ts`.
 */
import { TRACKED_OFFICES, type TrackedOffice } from "@shared/macro";
import { getText, type Connector, type FetchLike, type StatementDraft } from "./macroConnectors";

export type GdeltArticle = { url: string; title: string; seendate: string; domain: string; sourcecountry?: string; language?: string };

/** GDELT DOC API artlist JSON: { articles: [ { url, title, seendate: "20260922T120000Z", domain, … } ] }. */
export function parseGdeltArtlist(json: string): GdeltArticle[] {
  const data = JSON.parse(json) as { articles?: Array<Record<string, string>> };
  return (data.articles ?? [])
    .map(a => ({ url: String(a.url ?? ""), title: String(a.title ?? "").trim(), seendate: String(a.seendate ?? ""), domain: String(a.domain ?? ""), sourcecountry: a.sourcecountry, language: a.language }))
    .filter(a => /^https?:\/\//.test(a.url) && a.title.length > 0);
}

export function gdeltDateToIso(seendate: string): string {
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

export function gdeltArtlistUrl(query: string, timespan = "24h", maxrecords = 25): string {
  return `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&format=json&maxrecords=${maxrecords}&timespan=${timespan}&sort=datedesc`;
}

/** Ledger drafts from articles: one per distinct URL, English titles only, cited by the article URL. */
export function draftsFromArticles(office: TrackedOffice, articles: GdeltArticle[], today: string, holder?: string | null): StatementDraft[] {
  const seen = new Set<string>();
  const out: StatementDraft[] = [];
  for (const a of articles) {
    if (seen.has(a.url)) continue;
    if (a.language && !/^english$/i.test(a.language)) continue;
    seen.add(a.url);
    out.push({
      statementDate: gdeltDateToIso(a.seendate) || today,
      speaker: holder ? `${holder} (${office.office})` : office.office,
      office: office.office,
      channel: `Press report (${a.domain || "GDELT"})`,
      category: office.category,
      severity: /warn|threat|ultimat|retaliat/i.test(a.title) ? "warning" : "routine",
      environment: "calm",
      claim: a.title.slice(0, 500),
      sourceId: office.sourceId,
      sourceUrl: a.url.slice(0, 1000),
    });
  }
  return out;
}

// ─── Wikidata ─────────────────────────────────────────────────────────────────

export function wikidataSearchUrl(label: string): string {
  return `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(label)}&language=en&type=item&limit=1&format=json`;
}

export function wikidataHolderUrl(officeQid: string): string {
  const q = `SELECT ?holder ?holderLabel ?start WHERE { wd:${officeQid} p:P1308 ?st . ?st ps:P1308 ?holder . OPTIONAL { ?st pq:P580 ?start } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } ORDER BY DESC(?start) LIMIT 1`;
  return `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`;
}

/** wbsearchentities: { search: [ { id: "Q…", label } ] } → the first id, or null. */
export function parseWikidataSearch(json: string): { qid: string; label: string } | null {
  const data = JSON.parse(json) as { search?: Array<{ id: string; label?: string }> };
  const first = data.search?.[0];
  return first && /^Q\d+$/.test(first.id) ? { qid: first.id, label: first.label ?? "" } : null;
}

/** SPARQL JSON: { results: { bindings: [ { holder: { value: ".../Q…" }, holderLabel: { value }, start: { value } } ] } }. */
export function parseWikidataHolder(json: string): { qid: string; name: string; since: string | null } | null {
  const data = JSON.parse(json) as { results?: { bindings?: Array<Record<string, { value: string }>> } };
  const b = data.results?.bindings?.[0];
  if (!b?.holder?.value) return null;
  const qid = b.holder.value.split("/").pop() ?? "";
  if (!/^Q\d+$/.test(qid)) return null;
  const name = b.holderLabel?.value ?? "";
  if (!name || name === qid) return null;
  return { qid, name, since: b.start?.value ? b.start.value.slice(0, 10) : null };
}

/** Resolve an office title to its current holder through Wikidata. Null on any failure; never throws. */
export async function resolveOfficeHolder(fetchImpl: FetchLike, office: TrackedOffice): Promise<{ officeQid: string; holderQid: string; name: string; since: string | null } | null> {
  try {
    const hit = parseWikidataSearch(await getText(fetchImpl, wikidataSearchUrl(office.office), { Accept: "application/json" }));
    if (!hit) return null;
    const holder = parseWikidataHolder(await getText(fetchImpl, wikidataHolderUrl(hit.qid), { Accept: "application/sparql-results+json" }));
    if (!holder) return null;
    return { officeQid: hit.qid, holderQid: holder.qid, name: holder.name, since: holder.since };
  } catch {
    return null;
  }
}

// ─── Connectors ───────────────────────────────────────────────────────────────

/** One connector per tracked office: GDELT drafts (cited) plus a daily count observation; Wikidata names the holder when it answers. */
export function ledgerConnector(office: TrackedOffice, opts: { resolveHolder?: boolean } = {}): Connector {
  return {
    sourceId: office.sourceId,
    indicatorIds: [`ledger:${office.id}`],
    async run(fetchImpl, _env, today) {
      const holder = opts.resolveHolder === false ? null : await resolveOfficeHolder(fetchImpl, office);
      const articles = parseGdeltArtlist(await getText(fetchImpl, gdeltArtlistUrl(office.gdeltQuery)));
      const statements = draftsFromArticles(office, articles, today, holder?.name ?? null).map(s => (holder ? { ...s, speakerQid: holder.holderQid } : s));
      return {
        observations: [{ indicatorId: `ledger:${office.id}`, asOf: today, value: statements.length, sourceId: office.sourceId, note: holder ? `holder ${holder.name} (${holder.holderQid}) since ${holder.since ?? "n/a"}` : "holder unresolved (Wikidata did not answer)" }],
        statements,
      };
    },
  };
}

export const LEDGER_CONNECTORS: Connector[] = TRACKED_OFFICES.map(o => ledgerConnector(o));

// ─── Citation rules ───────────────────────────────────────────────────────────

/** A statement without a source URL is not a ledger entry. */
export function requireStatementCitation(s: { sourceUrl?: string | null }): void {
  if (!s.sourceUrl || !/^https?:\/\//.test(s.sourceUrl)) throw new Error("No statement without a citation: sourceUrl is required.");
}

/** An outcome other than pending needs its own URL. */
export function requireOutcomeCitation(outcome: string, outcomeSourceUrl?: string | null): void {
  if (outcome === "pending") return;
  if (!outcomeSourceUrl || !/^https?:\/\//.test(outcomeSourceUrl)) throw new Error("No outcome without a citation: outcomeSourceUrl is required.");
}
