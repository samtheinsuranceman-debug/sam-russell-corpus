// ============================================================
// HIVE MIND — the one address for the whole advisor brain.
//
// Pages, engines and verification checks never talk to a provider. They call
// `hive.ask` (questions) or `hive.inform` (facts) and the hive decides which of
// its members answer: every provider whose key resolves (environment or vault)
// and every MCP server whose handshake passed — 10, 20 or 40 of them, the caller
// never picks one and never learns a vendor name unless it asks the hive for
// its roster. This file is bundled to the browser: types and constants only.
// ============================================================

/** The tRPC path every surface uses. If it ever changes, change it here only. */
export const HIVE_MIND_ADDRESS = "hive.ask" as const;
export const HIVE_MIND_INFORM_ADDRESS = "hive.inform" as const;

/** What can be written into the advisor's working memory. */
export type HiveMemoryKind =
  | "page_visit"      // the visitor opened a page (from the map or the nav)
  | "page_close"      // they closed it (back arrow or X) — the map turns the entry green
  | "calc_result"     // a calculator published a result (inputs, outputs, toggles)
  | "forecast_toggle" // the forecast overlay was switched on/off for a calculator
  | "verification"    // a verification engine reported an outcome
  | "decision"        // the visitor chose something (a scenario, a strategy)
  | "question"        // they asked the hive something
  | "nudge"           // the advisor spoke to them, and what they replied
  | "note";           // free text an advisor pinned

export interface HiveMemoryEvent {
  kind: HiveMemoryKind;
  /** Route the event belongs to, when it has one. */
  routePath?: string;
  /** Engine or module that produced the fact (e.g. "mortgageKiller", "ag49Validator"). */
  engine?: string;
  /** Small, structured payload; never a whole page. */
  payload?: Record<string, unknown>;
  /** Evidence-ledger fields for anything numeric. */
  source?: string;
  asOf?: string;
  /** Verification outcome, when kind === "verification". */
  outcome?: "pass" | "fail" | "unverified";
}

export interface HiveAskInput {
  question: string;
  /** Route the visitor is on, so the hive can weight the right domain. */
  routePath?: string;
  /** Direct = one member; Deeper = the domain's preferred members; Integrated = council with reconciliation. */
  depth?: "direct" | "deeper" | "integrated";
  /** Client id when an advisor asks on a client's behalf. */
  clientId?: number;
}

export interface HiveCitation {
  /** Page or engine the figure came from. */
  ref: string;
  /** Ledger row, when the figure has one. */
  source?: string;
  asOf?: string;
}

export interface HiveAnswer {
  text: string;
  /** Which members contributed. Vendor names are here and only here. */
  answeredBy: { providerId: string; model?: string; role: "primary" | "second" | "reconciler" }[];
  citations: HiveCitation[];
  /** The council domain the question was routed to. */
  domain: string;
  /** How much working memory was used, for the audit trail. */
  memoryEventsUsed: number;
  /** True when no member could answer and the built-in gateway spoke instead. */
  fallback: boolean;
}

export interface HiveRoster {
  address: typeof HIVE_MIND_ADDRESS;
  informAddress: typeof HIVE_MIND_INFORM_ADDRESS;
  /** Providers whose key resolved right now. */
  members: { providerId: string; via: "env" | "vault" | "gateway" }[];
  /** MCP servers whose handshake passed. */
  mcpServers: { label: string; tools: number }[];
  /** Verification engines the hive reads outcomes from. */
  verifiers: string[];
}

/** How many page opens before the advisor speaks. The operator asked for one or two. */
export const NUDGE_AFTER_PAGE_OPENS = 2;

/** Visited entries on the site map turn this colour and stay that way for the user. */
export const VISITED_NEON_FOREST_GREEN = "#1BFF7A" as const;
export const VISITED_NEON_FOREST_GREEN_ON_LIGHT = "#0FBF56" as const;
