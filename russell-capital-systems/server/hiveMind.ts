// ============================================================
// HIVE MIND ORCHESTRATOR — the one place a question becomes an answer.
//
// Members are discovered, never chosen by the caller: every provider whose
// key resolves (the trunk's ultraAI env registry today; the Brain Hub vault
// registry plugs in through `registerHiveMemberSource` when it lands) and
// every MCP server a source reports. Ten, twenty or forty members, the page
// that asked never learns which one spoke unless it reads `answeredBy`.
//
// Grounding: the context block is built from the visitor's fact finder and
// the working memory (page visits, calculator results, verification
// outcomes). Engine outputs are pinned; the system prompt tells members to
// cite them and never restate a figure from memory. The council router
// (shared/council/aiCouncil.ts) names the domain; the domain picks how many
// members answer and who reconciles.
// ============================================================
import { classifyIntent, routeUtterance } from "@shared/council/aiCouncil";
import { advisorSystemFor, configuredProviders, leadModel, type Provider } from "./ultraAI";
import { factFinderSummary } from "@shared/clientFactFinder";
import { getFactFinderForUser } from "./factFinderDb";
import { buildHiveContext, domainForRoute, type HiveContext } from "@shared/hiveContext";
import { ADVISOR_NAME } from "@shared/advisorIdentity";
import type { HiveAnswer, HiveAskInput, HiveRoster } from "@shared/hiveMind";
import { legacyActivityEvents, recentHiveEvents, recordHiveEvent } from "./hiveMemoryDb";
import { registeredModules } from "@shared/aiMemoryBank";

/** A hive member: anything that can turn (system, user) into text. */
export interface HiveMember {
  providerId: string;
  label: string;
  via: "env" | "vault" | "gateway";
  model?: string;
  complete: (system: string, user: string) => Promise<string>;
}

/** A source of members: the env registry, the vault registry, an MCP registry. */
export interface HiveMemberSource {
  id: string;
  members: () => Promise<HiveMember[]>;
  mcpServers?: () => Promise<{ label: string; tools: number }[]>;
}

const sources: HiveMemberSource[] = [];

/** The trunk's own registry, wrapped: every provider whose env key exists. */
export const envMemberSource: HiveMemberSource = {
  id: "env",
  async members() {
    return configuredProviders().map((p: Provider): HiveMember => ({
      providerId: p.id,
      label: p.label,
      via: p.id === "manus" ? "gateway" : "env",
      complete: (system, user) => p.call(process.env[p.envKey] ?? "", system, user),
    }));
  },
};

sources.push(envMemberSource);

/** The Brain Hub vault (or any other registry) registers itself here once. Idempotent by id. */
export function registerHiveMemberSource(src: HiveMemberSource): void {
  const i = sources.findIndex(s => s.id === src.id);
  if (i >= 0) sources[i] = src; else sources.push(src);
}

/** Tests: replace every source. */
export function _setHiveSourcesForTests(list: HiveMemberSource[] | null): void {
  sources.splice(0, sources.length, ...(list ?? [envMemberSource]));
}

export async function hiveMembers(): Promise<HiveMember[]> {
  const all = await Promise.all(sources.map(s => s.members().catch(() => [] as HiveMember[])));
  const seen = new Set<string>();
  const out: HiveMember[] = [];
  for (const m of all.flat()) {
    if (seen.has(m.providerId)) continue; // a vault key for the same provider overrides env: sources are ordered vault-first when registered later? No: first wins, so register the vault before env if it should win.
    seen.add(m.providerId);
    out.push(m);
  }
  return out;
}

/** Verification engines the hive reads outcomes from (names, for the roster). */
export const HIVE_VERIFIERS = [
  "ag49Validator", "patentStatus", "routeManifest", "databaseSchemaFile", "sp500SeriesAudit",
  "timeMachineCompliance", "integrationScorecard", "brandGuard",
] as const;

export async function hiveRoster(): Promise<HiveRoster> {
  const members = await hiveMembers();
  const mcp = (await Promise.all(sources.map(s => (s.mcpServers ? s.mcpServers().catch(() => []) : Promise.resolve([]))))).flat();
  return {
    address: "hive.ask",
    informAddress: "hive.inform",
    members: members.map(m => ({ providerId: m.providerId, via: m.via })),
    mcpServers: mcp,
    verifiers: [...HIVE_VERIFIERS],
  };
}

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
  members?: () => Promise<HiveMember[]>;
  lead?: (system: string, user: string) => Promise<{ text: string; via: string } | null>;
  factFinder?: (userId: number) => Promise<string>;
  memory?: (userId: number, limit?: number) => Promise<Awaited<ReturnType<typeof recentHiveEvents>>>;
  record?: typeof recordHiveEvent;
  titles?: Record<string, string>;
  now?: () => Date;
}

const defaultDeps: Required<Omit<HiveDeps, "titles">> & { titles?: Record<string, string> } = {
  members: hiveMembers,
  lead: leadModel,
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

/** Build the grounded context for a user. Exposed for the router's `hive.memory`. */
export async function hiveContextFor(userId: number, routePath?: string, deps: HiveDeps = {}): Promise<HiveContext> {
  const d = { ...defaultDeps, ...deps };
  const events = await d.memory(userId, 50);
  return buildHiveContext(events, { routePath, titles: d.titles });
}

/** Ask the hive. One address, every member behind it. */
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

  const { n, reconcile } = fanOutFor(input.depth);
  const members = await d.members();
  const chosen = members.slice(0, Math.max(1, n));
  const answeredBy: HiveAnswer["answeredBy"] = [];
  const drafts: { member: HiveMember; text: string }[] = [];

  await Promise.all(chosen.map(async (m) => {
    try {
      const text = (await m.complete(system, question)).trim();
      if (text) drafts.push({ member: m, text });
    } catch (e) {
      console.warn(`[hive] ${m.providerId} failed:`, String(e).slice(0, 120));
    }
  }));

  let text = "";
  let fallback = false;
  if (drafts.length === 0) {
    const lead = await d.lead(system, question);
    if (lead) { text = lead.text; answeredBy.push({ providerId: lead.via, role: "primary" }); fallback = lead.via === "builtin"; }
    else { text = `${ADVISOR_NAME} has no member able to answer right now: no provider key resolved and the gateway did not respond. The question was recorded.`; fallback = true; }
  } else if (drafts.length === 1 || !reconcile) {
    text = drafts[0].text;
    drafts.forEach((dr, i) => answeredBy.push({ providerId: dr.member.providerId, model: dr.member.model, role: i === 0 ? "primary" : "second" }));
  } else {
    drafts.forEach((dr, i) => answeredBy.push({ providerId: dr.member.providerId, model: dr.member.model, role: i === 0 ? "primary" : "second" }));
    const reconcileUser = [
      `Question: ${question}`,
      "",
      "Independent drafts from hive members (do not name them):",
      ...drafts.map((dr, i) => `--- draft ${i + 1} ---\n${dr.text}`),
      "",
      "Reconcile into one answer. Keep every cited figure with its source. Where drafts disagree, show the disagreement and say which is better supported by the working memory.",
    ].join("\n");
    const rec = await d.lead(system, reconcileUser);
    if (rec) { text = rec.text; answeredBy.push({ providerId: rec.via, role: "reconciler" }); fallback = rec.via === "builtin"; }
    else { text = drafts[0].text; }
  }

  const citations = ctx.pinned.slice(0, 12).map(p => ({ ref: p.routePath ?? p.engine, source: p.source, asOf: p.asOf }));

  await d.record(userId, { kind: "note", routePath: input.routePath, engine: "hive", payload: { answeredBy: answeredBy.map(a => a.providerId), domain, chars: text.length } });

  return { text, answeredBy, citations, domain, memoryEventsUsed: ctx.eventsUsed, fallback };
}
