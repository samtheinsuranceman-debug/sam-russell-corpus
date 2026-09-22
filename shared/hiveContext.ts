// ============================================================
// HIVE CONTEXT — folds the advisor's working memory into the context block the
// hive members read before answering. Pure: takes stored events, returns text
// and a manifest of what was pinned. Engine outputs are PINNED (they cannot be
// paraphrased or dropped by summarisation); page visits are SUMMARISED; the
// most recent question wins ties. This is what lets Samuel Goldman say "I
// noticed you opened Mortgage Killer twice and ran it with the forecast on".
// ============================================================
import type { HiveMemoryEvent, HiveMemoryKind } from "./hiveMind";

export interface StoredHiveEvent extends HiveMemoryEvent {
  id: number;
  createdAt: string; // ISO
}

export interface HiveContextOptions {
  /** Newest events considered. Default 50. */
  limit?: number;
  /** Titles by route, so the summary reads "Mortgage Killer" not "/portal/mortgage-killer". */
  titles?: Record<string, string>;
  /** Route the visitor is on now; its events are weighted first. */
  routePath?: string;
}

export interface PinnedFact {
  engine: string;
  routePath?: string;
  payload: Record<string, unknown>;
  source?: string;
  asOf?: string;
  at: string;
}

export interface HiveContext {
  /** The text block handed to every member as grounded context. */
  text: string;
  /** Engine outputs that must survive summarisation unchanged. */
  pinned: PinnedFact[];
  /** Verification outcomes, most recent per engine. */
  verifications: { engine: string; outcome: "pass" | "fail" | "unverified"; at: string }[];
  /** Pages opened, most-opened first. */
  visits: { routePath: string; title: string; opens: number; closes: number; last: string }[];
  /** Council domain hint derived from where the visitor has been. */
  domainHint?: string;
  eventsUsed: number;
}

const DOMAIN_BY_PREFIX: [RegExp, string][] = [
  [/mortgage|heloc|refi|property|rental|real-estate|zip/i, "real-estate"],
  [/tax|amt|roth|irmaa|199a|bracket/i, "tax"],
  [/iul|policy|annuity|carrier|premium|insurance|ltc|disability/i, "insurance"],
  [/estate|trust|legacy|dynasty|ilit|slat|grat|qprt|inherit/i, "estate-legacy"],
  [/retire|income|social-security|pension|withdrawal/i, "retirement-income"],
  [/divorce|disab|life-event|forgiveness|pslf/i, "life-events"],
  [/crypto|market|index|regime|erosion|macro/i, "markets"],
  [/business|succession|buy-sell|key-person|captive/i, "business"],
  [/genome|assess|calibrat|diagnos|fact-finder|health/i, "diagnostics"],
  [/lead|pipeline|seminar|commission|practice|client/i, "practice"],
];

export function domainForRoute(routePath?: string): string | undefined {
  if (!routePath) return undefined;
  for (const [re, domain] of DOMAIN_BY_PREFIX) if (re.test(routePath)) return domain;
  return undefined;
}

function titleFor(routePath: string, titles?: Record<string, string>): string {
  if (titles?.[routePath]) return titles[routePath];
  const slug = routePath.split("/").filter(Boolean).pop() ?? routePath;
  return slug.split("-").map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

function short(v: unknown): string {
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === "string") return v.length > 60 ? v.slice(0, 57) + "…" : v;
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (Array.isArray(v)) return `[${v.length} items]`;
  if (v && typeof v === "object") return `{${Object.keys(v as object).length} fields}`;
  return String(v);
}

function payloadLine(p: Record<string, unknown> | undefined): string {
  if (!p) return "";
  const keys = Object.keys(p).slice(0, 8);
  return keys.map(k => `${k}=${short((p as Record<string, unknown>)[k])}`).join(", ");
}

/** Build the context. Deterministic for a given event list. */
export function buildHiveContext(events: StoredHiveEvent[], options: HiveContextOptions = {}): HiveContext {
  const limit = options.limit ?? 50;
  const recent = [...events]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id))
    .slice(0, limit);

  // Visits: opens and closes per route.
  const visitMap = new Map<string, { opens: number; closes: number; last: string }>();
  const pinned: PinnedFact[] = [];
  const verMap = new Map<string, { outcome: "pass" | "fail" | "unverified"; at: string }>();
  const questions: string[] = [];
  const decisions: string[] = [];
  const toggles: string[] = [];

  for (const e of recent) {
    const kind: HiveMemoryKind = e.kind;
    if ((kind === "page_visit" || kind === "page_close") && e.routePath) {
      const v = visitMap.get(e.routePath) ?? { opens: 0, closes: 0, last: e.createdAt };
      if (kind === "page_visit") v.opens += 1; else v.closes += 1;
      if (e.createdAt > v.last) v.last = e.createdAt;
      visitMap.set(e.routePath, v);
    } else if (kind === "calc_result" && e.engine) {
      pinned.push({ engine: e.engine, routePath: e.routePath, payload: e.payload ?? {}, source: e.source, asOf: e.asOf, at: e.createdAt });
    } else if (kind === "verification" && e.engine) {
      if (!verMap.has(e.engine)) verMap.set(e.engine, { outcome: e.outcome ?? "unverified", at: e.createdAt });
    } else if (kind === "question" && typeof e.payload?.question === "string") {
      questions.push(e.payload.question);
    } else if (kind === "decision") {
      decisions.push(payloadLine(e.payload));
    } else if (kind === "forecast_toggle") {
      toggles.push(`${titleFor(e.routePath ?? "", options.titles)}: forecast ${e.payload?.on ? "ON" : "off"}${e.payload?.horizon ? ` (${short(e.payload.horizon)}y)` : ""}`);
    }
  }

  const visits = Array.from(visitMap.entries())
    .map(([routePath, v]) => ({ routePath, title: titleFor(routePath, options.titles), ...v }))
    .sort((a, b) => b.opens - a.opens || (a.last < b.last ? 1 : -1));

  const verifications = Array.from(verMap.entries()).map(([engine, v]) => ({ engine, ...v }));

  const lines: string[] = [];
  lines.push("WORKING MEMORY (grounded; figures below are engine outputs and must be cited, never restated from memory):");
  if (visits.length) {
    lines.push("Pages opened: " + visits.slice(0, 8).map(v => `${v.title} ×${v.opens}${v.closes ? ` (closed ${v.closes})` : ""}`).join("; "));
  }
  if (toggles.length) lines.push("Forecast toggles: " + toggles.slice(0, 6).join("; "));
  for (const f of pinned.slice(0, 12)) {
    const ledger = f.source ? ` [source: ${f.source}${f.asOf ? `, as of ${f.asOf}` : ""}]` : " [no source on file]";
    lines.push(`PINNED ${f.engine}${f.routePath ? ` @ ${titleFor(f.routePath, options.titles)}` : ""}: ${payloadLine(f.payload)}${ledger}`);
  }
  if (verifications.length) {
    lines.push("Verification: " + verifications.map(v => `${v.engine}=${v.outcome}`).join(", "));
  }
  if (decisions.length) lines.push("Decisions: " + decisions.slice(0, 5).join("; "));
  if (questions.length) lines.push("Recent questions: " + questions.slice(0, 3).map(q => `"${q}"`).join("; "));
  if (options.routePath) lines.push(`Now on: ${titleFor(options.routePath, options.titles)}`);

  const domainHint = domainForRoute(options.routePath) ?? domainForRoute(visits[0]?.routePath);

  return { text: lines.join("\n"), pinned, verifications, visits, domainHint, eventsUsed: recent.length };
}

/** Count of page opens in the current session window (for the nudge). */
export function pageOpensSince(events: StoredHiveEvent[], sinceIso: string): number {
  return events.filter(e => e.kind === "page_visit" && e.createdAt >= sinceIso).length;
}
