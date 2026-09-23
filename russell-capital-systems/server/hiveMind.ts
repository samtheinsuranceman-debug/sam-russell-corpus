// ============================================================
// HIVE MIND ORCHESTRATOR — the one place a question becomes an answer.
//
// One AI address (board decision D24, 22 Sep 2026): every model call in this
// file goes through `brainComplete()` from the Brain Hub registry. The hive
// owns no provider transport of its own; a test reads this file and fails if
// one appears. The chain — vault keys, then Railway environment keys — is the
// Brain Hub's, so the hive and the advisor page
// answer through the same brains with the same fallback rule and the same
// `answeredBy`.
//
// What the hive adds on top of the Brain Hub: grounded context (the visitor's
// fact finder and working memory: page visits, calculator results,
// verification outcomes, pinned engine outputs the members must cite), the
// council's domain routing, depth (one member, two, or three reconciled), and
// the event bus that pages, engines and verifiers write to through
// `hive.inform`.
//
// "Members" are the providers whose key resolves right now
// (`liveProviderIds()`), reported for the roster; a page that asks never learns
// which one spoke unless it reads `answeredBy`.
// ============================================================
import { classifyIntent, routeUtterance } from "@shared/council/aiCouncil";
import { advisorSystemFor } from "./ultraAI";
import { factFinderSummary } from "@shared/clientFactFinder";
import { getFactFinderForUser } from "./factFinderDb";
import { buildHiveContext, domainForRoute, type HiveContext } from "@shared/hiveContext";
import { ADVISOR_NAME } from "@shared/aiAdvisor";
import type { HiveAnswer, HiveAskInput, HiveRoster } from "@shared/hiveMind";
import { legacyActivityEvents, recentHiveEvents, recordHiveEvent } from "./hiveMemoryDb";
import { registeredModules } from "@shared/aiMemoryBank";
import { brainComplete, environmentCredentials, liveProviderIds } from "./providerRegistry";
import { loadEnabledServers } from "./mcpRegistry";

/** Every provider whose key resolves right now, tagged by where the key lives. */
export async function hiveMembers(): Promise<HiveRoster["members"]> {
  const ids = await liveProviderIds();
  const envIds = new Set(environmentCredentials().map(c => c.providerId));
  return ids.map(providerId => ({ providerId, via: envIds.has(providerId) ? "env" : "vault" }));
}

/** Connected MCP servers with at least one discovered tool. */
export async function hiveMcpServers(): Promise<HiveRoster["mcpServers"]> {
  const servers = await loadEnabledServers();
  return servers.filter(s => s.tools.length > 0).map(s => ({ label: s.label, tools: s.tools.length }));
}

/** Verification engines the hive reads outcomes from (names, for the roster). */
export const HIVE_VERIFIERS = [
  "ag49Validator", "patentStatus", "routeManifest", "databaseSchemaFile", "sp500SeriesAudit",
  "timeMachineCompliance", "integrationScorecard", "brandGuard",
] as const;

/** Council domain → how many members answer by depth, and whether a reconciler runs. */
function fanOutFor(depth: HiveAskInput["depth"]): { n: number; reconcile: boolean } {
  switch (depth) {
    case "integrated": return { n: 3, reconcile: true };
    case "deeper": return { n: 2, reconcile: true };
    default: return { n: 1, reconcile: false };
  }
}

const HIVE_PREAMBLE = [
  `You are ${ADVISOR_NAME}, the master advisor of Russell Capital Systems, speaking for the whole hive.`,
  "You answer from the WORKING MEMORY block and the instruments you are given. A figure you cannot trace to a pinned engine output or a named page is a figure you do not give.",
  "Cite the page or engine for every number, in square brackets. If something is unverified, say so.",
  "Never name which AI vendor you are; you are the hive.",
].join(" ");

export interface HiveDeps {
  /** The one model call. Defaults to the Brain Hub's brainComplete. Tests inject a fake. */
  complete?: typeof brainComplete;
  members?: () => Promise<HiveRoster["members"]>;
  mcpServers?: () => Promise<HiveRoster["mcpServers"]>;
  factFinder?: (userId: number) => Promise<string>;
  memory?: (userId: number, limit?: number) => Promise<Awaited<ReturnType<typeof recentHiveEvents>>>;
  record?: typeof recordHiveEvent;
  titles?: Record<string, string>;
  now?: () => Date;
}

const defaultDeps: Required<Omit<HiveDeps, "titles">> & { titles?: Record<string, string> } = {
  complete: brainComplete,
  members: hiveMembers,
  mcpServers: hiveMcpServers,
  factFinder: async (userId) => {
    const stored = await getFactFinderForUser(userId);
    return stored ? factFinderSummary(stored.data) : "";
  },
  memory: async (userId, limit = 50) => {
    // New hive events plus the site's existing activity and calculation logs.
    const [fresh, legacy] = await Promise.all([recentHiveEvents(userId, limit), legacyActivityEvents(userId, limit)]);
    return [...fresh, ...legacy];
  },
  record: recordHiveEvent,
  now: () => new Date(),
};

export async function hiveRoster(deps: HiveDeps = {}): Promise<HiveRoster> {
  const d = { ...defaultDeps, ...deps };
  const [members, mcpServers] = await Promise.all([
    d.members().catch(() => [] as HiveRoster["members"]),
    d.mcpServers().catch(() => [] as HiveRoster["mcpServers"]),
  ]);
  return {
    address: "hive.ask",
    informAddress: "hive.inform",
    members,
    mcpServers,
    verifiers: [...HIVE_VERIFIERS],
  };
}

/** Build the grounded context for a user. Exposed for the router's `hive.memory`. */
export async function hiveContextFor(userId: number, routePath?: string, deps: HiveDeps = {}): Promise<HiveContext> {
  const d = { ...defaultDeps, ...deps };
  const events = await d.memory(userId, 50);
  return buildHiveContext(events, { routePath, titles: d.titles });
}

type Draft = { providerId: string; model: string; text: string };

/** Ask the hive. One address, every member behind it, every call through brainComplete. */
export async function askHive(userId: number, input: HiveAskInput, deps: HiveDeps = {}): Promise<HiveAnswer> {
  const d = { ...defaultDeps, ...deps };
  const question = input.question.trim();
  const ctx = await hiveContextFor(userId, input.routePath, deps);
  const profile = await d.factFinder(userId).catch(() => "");

  // Domain: the council's routing first, the route-derived hint second.
  const routed = routeUtterance(question, undefined, { maxMembers: 3 });
  const domain = routed[0]?.member?.domain ?? ctx.domainHint ?? domainForRoute(input.routePath) ?? "general";
  const intent = classifyIntent(question);

  const system = [
    HIVE_PREAMBLE,
    advisorSystemFor(question, profile),
    ctx.text,
    `Council domain: ${domain}. Intent: ${intent}. Known modules: ${registeredModules().length}.`,
  ].join("\n\n");

  await d.record(userId, { kind: "question", routePath: input.routePath, payload: { question: question.slice(0, 500), domain, depth: input.depth ?? "direct" } });

  // Fan-out: prefer the first n live members, one brainComplete call each.
  // With no live member the chain itself decides (and throws when it is empty).
  const { n, reconcile } = fanOutFor(input.depth);
  const members = await d.members().catch(() => [] as HiveRoster["members"]);
  const preferred: (string | undefined)[] = members.slice(0, Math.max(1, n)).map(m => m.providerId);
  if (preferred.length === 0) preferred.push(undefined);
  const maxTokens = input.depth === "integrated" ? 16_000 : 8_000;

  const drafts: Draft[] = [];
  await Promise.all(preferred.map(async (preferProvider) => {
    try {
      const r = await d.complete({
        messages: [{ role: "system", content: system }, { role: "user", content: question }],
        maxTokens,
        preferProvider,
      });
      const text = r.text.trim();
      if (text) drafts.push({ providerId: r.providerId, model: r.model, text });
    } catch (e) {
      console.warn(`[hive] brainComplete (prefer ${preferProvider ?? "chain"}) failed:`, String(e).slice(0, 160));
    }
  }));

  // The chain may answer two preferences with the same brain; count it once, first answer wins.
  const seen = new Set<string>();
  const unique = drafts.filter(dr => (seen.has(dr.providerId) ? false : (seen.add(dr.providerId), true)));

  const answeredBy: HiveAnswer["answeredBy"] = [];
  let text = "";
  let fallback = false;

  if (unique.length === 0) {
    text = `${ADVISOR_NAME} has no member able to answer right now: no brain in the chain responded. The question was recorded.`;
    fallback = true;
  } else if (unique.length === 1 || !reconcile) {
    text = unique[0].text;
    unique.forEach((dr, i) => answeredBy.push({ providerId: dr.providerId, model: dr.model, role: i === 0 ? "primary" : "second" }));
  } else {
    unique.forEach((dr, i) => answeredBy.push({ providerId: dr.providerId, model: dr.model, role: i === 0 ? "primary" : "second" }));
    const reconcileUser = [
      `Question: ${question}`,
      "",
      "Independent drafts from hive members (do not name them):",
      ...unique.map((dr, i) => `--- draft ${i + 1} ---\n${dr.text}`),
      "",
      "Reconcile into one answer. Keep every cited figure with its source. Where drafts disagree, show the disagreement and say which is better supported by the working memory.",
    ].join("\n");
    try {
      const rec = await d.complete({ messages: [{ role: "system", content: system }, { role: "user", content: reconcileUser }], maxTokens });
      if (rec.text.trim()) {
        text = rec.text.trim();
        answeredBy.push({ providerId: rec.providerId, model: rec.model, role: "reconciler" });
      } else {
        text = unique[0].text;
      }
    } catch (e) {
      console.warn("[hive] reconciliation failed, returning the primary draft:", String(e).slice(0, 160));
      text = unique[0].text;
    }
  }

  const citations = ctx.pinned.slice(0, 12).map(p => ({ ref: p.routePath ?? p.engine, source: p.source, asOf: p.asOf }));

  await d.record(userId, { kind: "note", routePath: input.routePath, engine: "hive", payload: { answeredBy: answeredBy.map(a => a.providerId), domain, chars: text.length, fallback } });

  return { text, answeredBy, citations, domain, memoryEventsUsed: ctx.eventsUsed, fallback };
}
