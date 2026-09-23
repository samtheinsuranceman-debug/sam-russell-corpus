/**
 * The Council — the platform's own multi-model consensus engine.
 * (Not shared/council/aiCouncil.ts, which routes a question to twelve
 * deterministic domain members; this one puts three named models on a panel.)
 *
 * Why our own and not a router: a router ("auto", "openrouter/…", fusion)
 * picks the model after the request leaves us, and every one of them can land
 * on a China-linked model. The owner's rule forbids that, so the council names
 * every model it calls, and every id is checked with isBannedModel before the
 * request is built and again on the model that answered.
 *
 * One run:
 *
 *   1. Decision. A room that must convene (tax packet, worst-case packet,
 *      "Einstein" open questions, a Goldman answer with numbers about a
 *      household's taxes, loans or policy values) skips the gate. Anything else
 *      goes through a cheap first pass on the default Brain Hub model, which
 *      says whether one model is enough. It usually is; the council is skipped
 *      unless the gate or the room says otherwise.
 *   2. Facts (optional). Perplexity, through the Brain Hub's own Perplexity
 *      credential, returns web facts with citations. Every panelist gets the
 *      same facts.
 *   3. Panel. Three pinned providers by default (Anthropic, OpenAI, Google
 *      Gemini) on the model each is configured with in the registry. Same
 *      prompt, in parallel, each with its own timeout. A panelist that fails is
 *      recorded, not fatal; two answers are the minimum.
 *   4. Judge. A fourth call (Anthropic by default) that does not vote. It
 *      returns strict JSON, validated with zod; one repair attempt, then the
 *      run degrades. A consensus that no source supports is still flagged.
 *   5. The caller's text. Written here, deterministically, from the judge's
 *      JSON — with the compliance preamble and the facts used named.
 *   6. Log. Every run is stored: a SHA-256 of the question (never its text),
 *      the workspace id, which models spoke, latencies, tokens, judge JSON.
 *
 * Cost guard: COUNCIL_MAX_RUNS_PER_DAY (default 50) convened runs per UTC day,
 * and COUNCIL_MAX_TOKENS_PER_RUN (default 60,000) estimated before the run and
 * checked again before the judge is called.
 */
import { createHash } from "node:crypto";
import { and, desc, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { CHINA_POLICY_MESSAGE, getProvider, isBannedModel, isBannedProvider, providerPolicyViolation } from "@shared/aiProviders";
import { councilRuns, type CouncilJudgeLogJson, type CouncilPanelLogJson } from "../drizzle/schema";
import type { ChatMessage, ProviderCallResult } from "./aiProviderAdapters";
import { ProviderError } from "./aiProviderAdapters";
import { brainComplete, completeChat, configuredModelFor, NoProviderAvailableError } from "./providerRegistry";

// ─── Rooms and the decision gate ─────────────────────────────────────────────

export const COUNCIL_ROOMS = ["tax_packet", "worst_case_packet", "einstein", "goldman", "advisor"] as const;
export type CouncilRoom = (typeof COUNCIL_ROOMS)[number];

/** The only rooms whose `force: true` is honoured. Everything else goes through the gate. */
export const FORCING_ROOMS: ReadonlySet<CouncilRoom> = new Set<CouncilRoom>(["tax_packet", "worst_case_packet", "einstein", "goldman"]);

const MONEY_NUMBER = /(?:\$\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m|million|thousand)?\b|\b\d+(?:\.\d+)?\s?%|\b\d{1,3}(?:,\d{3})+\b|\b\d{4,}\b)/i;
const HOUSEHOLD_MONEY_TOPIC =
  /\b(tax(?:es|able|ed)?|irs|deduct\w*|bracket|agi|magi|roth|withholding|refund|loan|mortgage|heloc|debt|amorti[sz]\w*|interest rate|apr|refinanc\w*|policy|cash value|death benefit|premium|surrender|iul|annuit\w*|face amount)\b/i;

/**
 * True when a Goldman answer carries numbers about a household's taxes, loans
 * or policy values: a dollar figure, percentage or large number on the same
 * line as one of those topics. That answer is "expensive" and must convene.
 */
export function goldmanNeedsCouncil(answer: string): boolean {
  return answer.split(/\n+/).some(line => MONEY_NUMBER.test(line) && HOUSEHOLD_MONEY_TOPIC.test(line));
}

export type CouncilDecision = { convene: boolean; forced: boolean; reason: string; gateProviderId?: string; gateModel?: string };

const GATE_SYSTEM =
  "You triage questions for a financial-planning platform. Decide whether ONE careful AI model is enough to answer, " +
  "or whether the question needs a COUNCIL of independent models cross-checking each other. Choose COUNCIL only when " +
  "a wrong answer would be costly and is easy to get wrong: specific tax figures or law, loan or insurance-policy numbers, " +
  "multi-step strategies whose errors compound, or genuinely open questions where models are known to disagree. " +
  "Reply with exactly one word: ONE or COUNCIL.";

/** Step 1. Forced rooms convene; everything else asks the default Brain Hub model, cheaply. Never throws. */
export async function decideCouncil(input: { question: string; room: CouncilRoom; force?: boolean }): Promise<CouncilDecision> {
  if (input.force && FORCING_ROOMS.has(input.room)) {
    return { convene: true, forced: true, reason: `Forced by the ${input.room} room.` };
  }
  try {
    const res = await brainComplete({
      messages: [
        { role: "system", content: GATE_SYSTEM },
        { role: "user", content: input.question.slice(0, 4_000) },
      ],
      maxTokens: 16,
      temperature: 0,
    });
    const says = res.text.trim().toUpperCase();
    const convene = /\bCOUNCIL\b/.test(says) && !/^\s*ONE\b/.test(says);
    return {
      convene,
      forced: false,
      reason: convene ? "The first pass judged one model not enough." : "The first pass judged one model enough.",
      gateProviderId: res.providerId,
      gateModel: res.model,
    };
  } catch (e) {
    return { convene: false, forced: false, reason: `The first pass was unavailable (${e instanceof Error ? e.message.slice(0, 120) : "error"}); one model answers.` };
  }
}

// ─── Limits ──────────────────────────────────────────────────────────────────

export type CouncilLimits = {
  maxRunsPerDay: number;
  maxTokensPerRun: number;
  panelistMaxTokens: number;
  judgeMaxTokens: number;
  panelistTimeoutMs: number;
  judgeTimeoutMs: number;
};

const intEnv = (env: Record<string, string | undefined>, name: string, fallback: number, min = 1): number => {
  const n = Number.parseInt(env[name]?.trim() ?? "", 10);
  return Number.isFinite(n) && n >= min ? n : fallback;
};

export function councilLimits(env: Record<string, string | undefined> = process.env): CouncilLimits {
  return {
    maxRunsPerDay: intEnv(env, "COUNCIL_MAX_RUNS_PER_DAY", 50, 0),
    maxTokensPerRun: intEnv(env, "COUNCIL_MAX_TOKENS_PER_RUN", 60_000),
    panelistMaxTokens: intEnv(env, "COUNCIL_PANELIST_MAX_TOKENS", 1_500),
    judgeMaxTokens: intEnv(env, "COUNCIL_JUDGE_MAX_TOKENS", 2_000),
    panelistTimeoutMs: intEnv(env, "COUNCIL_PANELIST_TIMEOUT_MS", 60_000),
    judgeTimeoutMs: intEnv(env, "COUNCIL_JUDGE_TIMEOUT_MS", 90_000),
  };
}

/** Rough token count for a budget check: four characters a token. */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// ─── Panel ───────────────────────────────────────────────────────────────────

/** Pinned by default: three allowed, working US labs. Never a router. */
export const DEFAULT_PANEL = ["anthropic", "openai", "google"] as const;
export const DEFAULT_JUDGE = "anthropic";
export const FACTS_PROVIDER = "perplexity";

export type PanelSpec = { providerId: string; model?: string };

export type PanelistOutcome = {
  providerId: string;
  model: string;
  /** "Model A", "Model B"… — how the caller's text refers to it. */
  label: string;
  ok: boolean;
  answer?: string;
  sources: string[];
  latencyMs: number;
  usage?: ProviderCallResult["usage"];
  error?: string;
};

export class CouncilPolicyError extends Error {
  constructor(detail: string) {
    super(`${CHINA_POLICY_MESSAGE} (${detail}).`);
    this.name = "CouncilPolicyError";
  }
}

/**
 * The panel, with every model named. A provider or model on the ban list (or
 * a router id) refuses the whole run; a provider with no key is kept as a
 * recorded failure so the log says who was missing.
 */
export async function resolvePanel(specs: readonly PanelSpec[] = DEFAULT_PANEL.map(providerId => ({ providerId }))): Promise<Array<{ providerId: string; model: string | null }>> {
  const out: Array<{ providerId: string; model: string | null }> = [];
  for (const spec of specs) {
    if (isBannedProvider(spec.providerId)) throw new CouncilPolicyError(`provider "${spec.providerId}"`);
    const def = getProvider(spec.providerId);
    if (!def) throw new Error(`Unknown council provider "${spec.providerId}". The council only seats built-in Brain Hub providers.`);
    const violation = providerPolicyViolation({ ...def, defaultModel: "", suggestedModels: [] });
    if (violation) throw new CouncilPolicyError(`provider ${spec.providerId} ${violation}`);
    if (spec.model !== undefined && isBannedModel(spec.model)) throw new CouncilPolicyError(`model "${spec.model}"`);
    const model = spec.model?.trim() || (await configuredModelFor(spec.providerId));
    if (model && isBannedModel(model)) throw new CouncilPolicyError(`model "${model}"`);
    out.push({ providerId: spec.providerId, model });
  }
  return out;
}

const SOURCES_HEADER = /^\s*(?:\*\*)?\s*sources?\s*(?:\*\*)?\s*:\s*(.*)$/i;

/** Split a panelist's reply into its answer and the sources listed after "SOURCES:". */
export function splitSources(text: string): { answer: string; sources: string[] } {
  const lines = text.split("\n");
  const at = lines.findIndex(l => SOURCES_HEADER.test(l));
  if (at < 0) return { answer: text.trim(), sources: [] };
  const inline = lines[at].match(SOURCES_HEADER)?.[1]?.trim() ?? "";
  const raw = [...(inline ? inline.split(/;\s*/) : []), ...lines.slice(at + 1)];
  const sources = raw
    .map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(l => l && !/^(?:none|n\/a|no sources?\.?)$/i.test(l));
  return { answer: lines.slice(0, at).join("\n").trim(), sources: Array.from(new Set(sources)).slice(0, 20) };
}

const PANEL_SYSTEM =
  "You are one member of an independent review panel for Russell Capital Systems, a financial-planning platform. " +
  "Answer the question on your own; you will not see the other members' answers. This is hypothetical, educational " +
  "analysis, not tax, legal or investment advice. Be concrete. Never invent a figure, a statute or a source: where you " +
  "rely on something, name it; where you are unsure, say so. End with a line that reads exactly `SOURCES:` followed by " +
  "one source per line (a URL, a code section such as IRC §408A, an IRS publication, or `WEB FACT [n]` for a fact " +
  "supplied below). If nothing supports a claim, write `SOURCES: none`.";

const SINGLE_SYSTEM =
  "You answer questions for Russell Capital Systems, a financial-planning platform. This is hypothetical, educational " +
  "analysis, not tax, legal or investment advice. Be concrete, never invent a figure, a statute or a source, and name " +
  "the source for every figure you give.";

export type CouncilFacts = { providerId: string; model: string; text: string; sources: string[] };

function panelUserMessage(question: string, context: string | undefined, facts: CouncilFacts | null, maxWords: number): string {
  return [
    `QUESTION:\n${question}`,
    context?.trim() ? `CONTEXT (from the platform; treat as fact):\n${context.trim()}` : "",
    facts
      ? `WEB FACTS (retrieved via ${facts.providerId}; cite as WEB FACT [n]):\n${facts.text}\n${facts.sources.map((s, i) => `[${i + 1}] ${s}`).join("\n")}`
      : "",
    `Answer in under ${maxWords} words, then the SOURCES line.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function callPanelist(
  seat: { providerId: string; model: string | null },
  label: string,
  messages: ChatMessage[],
  limits: CouncilLimits,
): Promise<PanelistOutcome> {
  const started = Date.now();
  if (!seat.model) {
    return { providerId: seat.providerId, model: "", label, ok: false, sources: [], latencyMs: 0, error: "not configured (no key in the Brain Hub or the environment)" };
  }
  try {
    const res = await completeChat({
      preferProvider: seat.providerId,
      modelOverride: seat.model,
      messages,
      maxTokens: limits.panelistMaxTokens,
      temperature: 0.2,
      timeoutMs: limits.panelistTimeoutMs,
    });
    if (isBannedModel(res.model)) throw new CouncilPolicyError(`answering model "${res.model}"`);
    const { answer, sources } = splitSources(res.text);
    if (!answer) throw new Error("empty answer");
    const citations = (res.citations ?? []).filter(c => typeof c === "string");
    return {
      providerId: seat.providerId,
      model: res.model,
      label,
      ok: true,
      answer,
      sources: Array.from(new Set([...sources, ...citations])),
      latencyMs: res.latencyMs ?? Date.now() - started,
      usage: res.usage,
    };
  } catch (e) {
    const error =
      e instanceof ProviderError
        ? e.userMessage
        : e instanceof NoProviderAvailableError
          ? e.attempted[0]?.error ?? e.message
          : e instanceof Error
            ? e.message
            : "failed";
    return { providerId: seat.providerId, model: seat.model, label, ok: false, sources: [], latencyMs: Date.now() - started, error: error.slice(0, 300) };
  }
}

/** Step 2. Web facts from Perplexity, through the Brain Hub's Perplexity key. Null when it is not keyed or fails. */
export async function fetchWebFacts(question: string, limits: CouncilLimits): Promise<{ facts: CouncilFacts | null; tokens: number; error?: string }> {
  const model = await configuredModelFor(FACTS_PROVIDER);
  if (!model) return { facts: null, tokens: 0, error: "Perplexity is not keyed" };
  if (isBannedModel(model)) return { facts: null, tokens: 0, error: `${CHINA_POLICY_MESSAGE} (model "${model}")` };
  try {
    const res = await completeChat({
      preferProvider: FACTS_PROVIDER,
      modelOverride: model,
      messages: [
        { role: "system", content: "Return the current, citable facts a financial planner needs to answer the question: figures, limits, dates, statutory text. Terse numbered bullets. No advice." },
        { role: "user", content: question.slice(0, 4_000) },
      ],
      maxTokens: 800,
      temperature: 0,
      timeoutMs: limits.panelistTimeoutMs,
    });
    if (isBannedModel(res.model)) return { facts: null, tokens: 0, error: `${CHINA_POLICY_MESSAGE} (answering model "${res.model}")` };
    const tokens = res.usage?.totalTokens ?? estimateTokens(res.text);
    const text = res.text.trim();
    if (!text) return { facts: null, tokens, error: "empty" };
    return { facts: { providerId: FACTS_PROVIDER, model: res.model, text, sources: (res.citations ?? []).slice(0, 12) }, tokens };
  } catch (e) {
    return { facts: null, tokens: 0, error: e instanceof ProviderError ? e.userMessage : e instanceof Error ? e.message : "failed" };
  }
}

// ─── Judge ───────────────────────────────────────────────────────────────────

export const judgeSchema = z.object({
  consensus: z.array(z.string()),
  contradictions: z.array(
    z.object({
      claim: z.string(),
      positions: z.array(z.object({ model: z.string(), stance: z.string() })),
    }),
  ),
  partial_coverage: z.array(z.string()),
  unique_insights: z.array(z.object({ model: z.string(), insight: z.string() })),
  blind_spots: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
});
export type JudgeVerdict = z.infer<typeof judgeSchema>;

const JUDGE_SYSTEM = `You are the judge of an AI review panel. You do NOT vote and you do NOT add your own answer. You compare the panel's answers and report, as ONE JSON object and nothing else:

{
  "consensus": string[],            // claims at least two panelists make
  "contradictions": [{ "claim": string, "positions": [{ "model": string, "stance": string }] }],
  "partial_coverage": string[],     // points only some panelists addressed
  "unique_insights": [{ "model": string, "insight": string }],
  "blind_spots": string[],          // what nobody addressed, and every unsupported claim
  "confidence": "high" | "medium" | "low"
}

Refer to panelists by their label ("Model A", "Model B", ...). A claim does not become true because several models agree: if no panelist cites a source for a consensus claim (a URL, a statute, an IRS publication or a WEB FACT), ALSO list it in blind_spots as "UNSUPPORTED: <claim>". Use "high" only when the consensus is sourced and nothing material is contradicted. No markdown fences, no commentary, JSON only.`;

/** Pull the first JSON object out of a reply that may have fences or chatter around it. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const body = fenced ?? text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in the reply");
  return JSON.parse(body.slice(start, end + 1));
}

export function parseJudge(text: string): { ok: true; verdict: JudgeVerdict } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "not JSON" };
  }
  const parsed = judgeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.slice(0, 6).map(i => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ") };
  }
  return { ok: true, verdict: parsed.data };
}

/**
 * A consensus nobody sourced is still flagged. When no panelist and no web
 * fact cited anything, every consensus claim is marked unsupported and the
 * confidence cannot be above low — agreement between models trained on the
 * same text is one opinion echoed, not a confirmation.
 */
export function enforceSourcing(verdict: JudgeVerdict, panel: PanelistOutcome[], facts: CouncilFacts | null): JudgeVerdict {
  const sourceCount = panel.reduce((n, p) => n + (p.ok ? p.sources.length : 0), 0) + (facts?.sources.length ?? 0);
  if (sourceCount > 0 || verdict.consensus.length === 0) return verdict;
  const flagged = new Set(verdict.blind_spots.map(b => b.toLowerCase()));
  const extra = verdict.consensus
    .filter(c => !Array.from(flagged).some(b => b.includes(c.toLowerCase().slice(0, 40))))
    .map(c => `UNSUPPORTED: ${c} (no panelist or web fact cited a source)`);
  return { ...verdict, blind_spots: [...verdict.blind_spots, ...extra], confidence: "low" };
}

function judgeUserMessage(question: string, panel: PanelistOutcome[], facts: CouncilFacts | null): string {
  return [
    `QUESTION:\n${question}`,
    facts ? `WEB FACTS GIVEN TO THE PANEL:\n${facts.text}\n${facts.sources.map((s, i) => `[${i + 1}] ${s}`).join("\n")}` : "No web facts were given to the panel.",
    ...panel
      .filter(p => p.ok)
      .map(p => `--- ${p.label} ---\n${p.answer}\nSOURCES CITED: ${p.sources.length ? p.sources.join(" | ") : "none"}`),
  ].join("\n\n");
}

async function resolveJudge(): Promise<{ providerId: string; model: string } | null> {
  const preferred = process.env.COUNCIL_JUDGE_PROVIDER?.trim() || DEFAULT_JUDGE;
  for (const id of [preferred, ...DEFAULT_PANEL.filter(p => p !== preferred)]) {
    if (isBannedProvider(id) || !getProvider(id)) continue;
    const model = await configuredModelFor(id);
    if (model && !isBannedModel(model)) return { providerId: id, model };
  }
  return null;
}

type JudgeRun = { verdict: JudgeVerdict | null; repaired: boolean; providerId?: string; model?: string; tokens: number; error?: string };

/** Step 4. One call, one repair on invalid JSON, then give up and let the run degrade. */
async function runJudge(question: string, panel: PanelistOutcome[], facts: CouncilFacts | null, limits: CouncilLimits): Promise<JudgeRun> {
  const judge = await resolveJudge();
  if (!judge) return { verdict: null, repaired: false, tokens: 0, error: "No judge is keyed (Anthropic, OpenAI or Gemini)." };
  const messages: ChatMessage[] = [
    { role: "system", content: JUDGE_SYSTEM },
    { role: "user", content: judgeUserMessage(question, panel, facts) },
  ];
  let tokens = 0;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    let text: string;
    try {
      const res = await completeChat({
        preferProvider: judge.providerId,
        modelOverride: judge.model,
        messages,
        maxTokens: limits.judgeMaxTokens,
        temperature: 0,
        timeoutMs: limits.judgeTimeoutMs,
      });
      if (isBannedModel(res.model)) throw new CouncilPolicyError(`answering model "${res.model}"`);
      tokens += res.usage?.totalTokens ?? estimateTokens(res.text);
      text = res.text;
    } catch (e) {
      const error = e instanceof ProviderError ? e.userMessage : e instanceof Error ? e.message : "judge failed";
      return { verdict: null, repaired: attempt > 0, ...judge, tokens, error: error.slice(0, 300) };
    }
    const parsed = parseJudge(text);
    if (parsed.ok) return { verdict: enforceSourcing(parsed.verdict, panel, facts), repaired: attempt > 0, ...judge, tokens };
    lastError = parsed.error;
    messages.push(
      { role: "assistant", content: text.slice(0, 8_000) },
      { role: "user", content: `That was not valid: ${parsed.error}. Reply again with ONLY the JSON object, exactly in the schema given. No prose, no fences.` },
    );
  }
  return { verdict: null, repaired: true, ...judge, tokens, error: `Judge JSON invalid after one repair: ${lastError}`.slice(0, 300) };
}

// ─── The caller's text ───────────────────────────────────────────────────────

export const COUNCIL_PREAMBLE =
  "**Hypothetical illustration — not tax, legal or investment advice.** A licensed professional confirms every specific before anything is acted on.";

function factsLine(contextLabels: string[], facts: CouncilFacts | null): string {
  const used = [...contextLabels];
  if (facts) {
    const hosts = Array.from(new Set(facts.sources.map(s => { try { return new URL(s).hostname.replace(/^www\./, ""); } catch { return s.slice(0, 60); } }))).slice(0, 6);
    used.push(`${facts.sources.length} web fact source${facts.sources.length === 1 ? "" : "s"} retrieved via Perplexity${hosts.length ? ` (${hosts.join(", ")})` : ""}`);
  }
  return used.length ? `Facts used: ${used.join("; ")}.` : "Facts used: none beyond the question itself — the panel answered from what was asked.";
}

const bullets = (items: string[]) => items.map(i => `- ${i}`).join("\n");

/**
 * Step 5. The only text a household sees, written from the judge's JSON.
 * Models are referred to by their panel label, never by vendor.
 */
export function composeFinalText(verdict: JudgeVerdict, opts: { panelSize: number; contextLabels?: string[]; facts: CouncilFacts | null }): string {
  const parts: string[] = [
    COUNCIL_PREAMBLE,
    factsLine(opts.contextLabels ?? [], opts.facts),
    `Cross-checked by ${opts.panelSize} independent AI models. Confidence: **${verdict.confidence}**.`,
  ];
  if (verdict.consensus.length) parts.push(`**Where the models agree**\n${bullets(verdict.consensus)}`);
  if (verdict.contradictions.length) {
    parts.push(
      `**Where they disagree — resolve before relying on it**\n${bullets(
        verdict.contradictions.map(c => `${c.claim} — ${c.positions.map(p => `${p.model}: ${p.stance}`).join("; ")}`),
      )}`,
    );
  }
  if (verdict.partial_coverage.length) parts.push(`**Covered only in part**\n${bullets(verdict.partial_coverage)}`);
  if (verdict.unique_insights.length) parts.push(`**Worth a closer look**\n${bullets(verdict.unique_insights.map(u => `${u.insight} (${u.model})`))}`);
  if (verdict.blind_spots.length) parts.push(`**Blind spots and unsupported claims**\n${bullets(verdict.blind_spots)}`);
  return parts.join("\n\n");
}

// ─── Log ─────────────────────────────────────────────────────────────────────

export type CouncilOutcome = "council" | "single" | "degraded" | "refused";

export type CouncilRunLog = {
  id: number;
  createdAt: string;
  workspaceId: number | null;
  room: CouncilRoom;
  questionHash: string;
  outcome: CouncilOutcome;
  forced: boolean;
  decisionReason: string | null;
  panel: CouncilPanelLogJson;
  judgeProviderId: string | null;
  judgeModel: string | null;
  judge: CouncilJudgeLogJson | null;
  judgeRepaired: boolean;
  confidence: "high" | "medium" | "low" | null;
  factsProviderId: string | null;
  factCount: number;
  totalTokens: number;
  latencyMs: number;
};

export const hashQuestion = (q: string): string => createHash("sha256").update(q.trim()).digest("hex");

const LOG_BUFFER_LIMIT = 500;
const logBuffer: CouncilRunLog[] = [];
let bufferSeq = 0;

/** Test hook: forget the in-process log. */
export function clearCouncilLogBuffer(): void {
  logBuffer.length = 0;
  bufferSeq = 0;
}

async function db() {
  try {
    const { getDb } = await import("./db");
    return await getDb();
  } catch {
    return null;
  }
}

/** Store one run. Database when there is one, an in-process buffer otherwise. Never throws. */
export async function recordCouncilRun(row: Omit<CouncilRunLog, "id" | "createdAt">): Promise<CouncilRunLog> {
  const now = new Date();
  const d = await db();
  if (d) {
    try {
      const res = await d.insert(councilRuns).values({
        workspaceId: row.workspaceId,
        room: row.room,
        questionHash: row.questionHash,
        outcome: row.outcome,
        forced: row.forced,
        decisionReason: row.decisionReason?.slice(0, 300) ?? null,
        panel: row.panel,
        judgeProviderId: row.judgeProviderId,
        judgeModel: row.judgeModel,
        judge: row.judge,
        judgeRepaired: row.judgeRepaired,
        confidence: row.confidence,
        factsProviderId: row.factsProviderId,
        factCount: row.factCount,
        totalTokens: row.totalTokens,
        latencyMs: row.latencyMs,
      });
      const insertId = (res as unknown as Array<{ insertId?: number }>)[0]?.insertId;
      return { ...row, id: typeof insertId === "number" ? insertId : 0, createdAt: now.toISOString() };
    } catch (e) {
      console.warn("[council] audit insert failed, buffering:", String(e).slice(0, 120));
    }
  }
  bufferSeq += 1;
  const stored: CouncilRunLog = { ...row, id: -bufferSeq, createdAt: now.toISOString() };
  logBuffer.push(stored);
  if (logBuffer.length > LOG_BUFFER_LIMIT) logBuffer.splice(0, logBuffer.length - LOG_BUFFER_LIMIT);
  return stored;
}

/** Newest first. `workspaceIds` narrows the list (an advisor); omitted means every run (the owner). */
export async function listCouncilRuns(opts: { workspaceIds?: number[]; limit?: number } = {}): Promise<CouncilRunLog[]> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  if (opts.workspaceIds && opts.workspaceIds.length === 0) return [];
  const d = await db();
  if (d) {
    try {
      const rows = await d
        .select()
        .from(councilRuns)
        .where(opts.workspaceIds ? inArray(councilRuns.workspaceId, opts.workspaceIds) : undefined)
        .orderBy(desc(councilRuns.createdAt), desc(councilRuns.id))
        .limit(limit);
      return rows.map(r => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        workspaceId: r.workspaceId ?? null,
        room: (COUNCIL_ROOMS as readonly string[]).includes(r.room) ? (r.room as CouncilRoom) : "advisor",
        questionHash: r.questionHash,
        outcome: r.outcome,
        forced: r.forced,
        decisionReason: r.decisionReason ?? null,
        panel: (typeof r.panel === "string" ? JSON.parse(r.panel) : r.panel) ?? [],
        judgeProviderId: r.judgeProviderId ?? null,
        judgeModel: r.judgeModel ?? null,
        judge: (typeof r.judge === "string" ? JSON.parse(r.judge) : r.judge) ?? null,
        judgeRepaired: r.judgeRepaired,
        confidence: r.confidence ?? null,
        factsProviderId: r.factsProviderId ?? null,
        factCount: r.factCount,
        totalTokens: r.totalTokens,
        latencyMs: r.latencyMs,
      }));
    } catch (e) {
      console.warn("[council] audit select failed, using buffer:", String(e).slice(0, 120));
    }
  }
  const scoped = opts.workspaceIds ? logBuffer.filter(r => r.workspaceId !== null && opts.workspaceIds!.includes(r.workspaceId)) : logBuffer;
  return [...scoped].reverse().slice(0, limit);
}

const startOfUtcDay = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

/** Convened runs (council or degraded) since midnight UTC — what the daily cap counts. */
export async function councilRunsToday(now: Date = new Date()): Promise<number> {
  const since = startOfUtcDay(now);
  const d = await db();
  if (d) {
    try {
      const rows = await d
        .select({ n: sql<number>`count(*)` })
        .from(councilRuns)
        .where(and(gte(councilRuns.createdAt, since), inArray(councilRuns.outcome, ["council", "degraded"])));
      return Number(rows[0]?.n ?? 0);
    } catch (e) {
      console.warn("[council] audit count failed, using buffer:", String(e).slice(0, 120));
    }
  }
  return logBuffer.filter(r => (r.outcome === "council" || r.outcome === "degraded") && new Date(r.createdAt) >= since).length;
}

// ─── The run ─────────────────────────────────────────────────────────────────

export type CouncilInput = {
  question: string;
  /** Platform facts every panelist is given (client record, working memory). Never logged. */
  context?: string;
  /** Names of what `context` holds, for the "Facts used" line (e.g. "the client record"). */
  contextLabels?: string[];
  room?: CouncilRoom;
  /** Honoured only for FORCING_ROOMS. */
  force?: boolean;
  /** Override the three pinned seats. Every id is checked against the ban. */
  forcedPanel?: PanelSpec[];
  /** Fetch web facts from Perplexity for the panel. */
  facts?: boolean;
  /** The only household link stored in the log. */
  workspaceId?: number | null;
  /** When the gate skips the council, answer with one model (default true). */
  answerWhenSkipped?: boolean;
  limits?: CouncilLimits;
};

export type CouncilResult = {
  outcome: CouncilOutcome;
  /** What the caller shows: the council's text, the single model's answer, or a polite refusal. */
  finalText: string;
  decision: CouncilDecision;
  panel: PanelistOutcome[];
  judge: JudgeVerdict | null;
  judgeProviderId: string | null;
  judgeModel: string | null;
  judgeRepaired: boolean;
  judgeError: string | null;
  facts: CouncilFacts | null;
  factsError: string | null;
  totalTokens: number;
  latencyMs: number;
  runId: number;
  refusal: string | null;
};

const LABELS = ["Model A", "Model B", "Model C", "Model D", "Model E", "Model F"];

export const COUNCIL_DAILY_CAP_MESSAGE = (cap: number) =>
  `The council has already convened ${cap} time${cap === 1 ? "" : "s"} today, which is the daily limit the owner set (COUNCIL_MAX_RUNS_PER_DAY). It opens again at midnight UTC; until then answers come from one model.`;
export const COUNCIL_TOKEN_CAP_MESSAGE = (est: number, cap: number) =>
  `This question is too large for one council run (about ${est.toLocaleString("en-US")} tokens against a limit of ${cap.toLocaleString("en-US")}, COUNCIL_MAX_TOKENS_PER_RUN). Shorten the context or split the question.`;

/** Convene the council (or decide not to). Never throws; a refusal or a failure comes back as an outcome. */
export async function runCouncil(input: CouncilInput): Promise<CouncilResult> {
  const started = Date.now();
  const limits = input.limits ?? councilLimits();
  const room: CouncilRoom = input.room ?? "advisor";
  const question = input.question.trim();
  const base = {
    workspaceId: input.workspaceId ?? null,
    room,
    questionHash: hashQuestion(question),
  };
  const result = (r: Omit<CouncilResult, "latencyMs" | "runId">, runId: number): CouncilResult => ({ ...r, latencyMs: Date.now() - started, runId });
  const panelLog = (panel: PanelistOutcome[]): CouncilPanelLogJson =>
    panel.map(p => ({
      providerId: p.providerId,
      model: p.model,
      ok: p.ok,
      latencyMs: p.latencyMs,
      promptTokens: p.usage?.promptTokens,
      completionTokens: p.usage?.completionTokens,
      totalTokens: p.usage?.totalTokens,
      sourceCount: p.sources.length,
      error: p.error,
    }));
  const empty = { panel: [] as PanelistOutcome[], judge: null, judgeProviderId: null, judgeModel: null, judgeRepaired: false, judgeError: null, facts: null, factsError: null };

  const refuse = async (decision: CouncilDecision, refusal: string, panel: PanelistOutcome[] = []) => {
    const log = await recordCouncilRun({
      ...base, outcome: "refused", forced: decision.forced, decisionReason: `${decision.reason} Refused: ${refusal}`.slice(0, 300),
      panel: panelLog(panel), judgeProviderId: null, judgeModel: null, judge: null, judgeRepaired: false, confidence: null,
      factsProviderId: null, factCount: 0, totalTokens: 0, latencyMs: Date.now() - started,
    });
    return result({ ...empty, panel, outcome: "refused", finalText: refusal, decision, totalTokens: 0, refusal }, log.id);
  };

  // Step 1 — the gate.
  const decision = await decideCouncil({ question, room, force: input.force });

  if (!decision.convene) {
    let finalText = "";
    let tokens = 0;
    if (input.answerWhenSkipped !== false) {
      try {
        const res = await brainComplete({
          messages: [
            { role: "system", content: SINGLE_SYSTEM },
            { role: "user", content: panelUserMessage(question, input.context, null, 400) },
          ],
          maxTokens: limits.panelistMaxTokens,
        });
        finalText = `${COUNCIL_PREAMBLE}\n\n${res.text.trim()}`;
        tokens = estimateTokens(res.text);
      } catch (e) {
        finalText = "No AI model answered. Add or check a key in the AI Connector.";
      }
    }
    const log = await recordCouncilRun({
      ...base, outcome: "single", forced: false, decisionReason: decision.reason, panel: [], judgeProviderId: null, judgeModel: null,
      judge: null, judgeRepaired: false, confidence: null, factsProviderId: null, factCount: 0, totalTokens: tokens, latencyMs: Date.now() - started,
    });
    return result({ ...empty, outcome: "single", finalText, decision, totalTokens: tokens, refusal: null }, log.id);
  }

  // Cost guard — daily runs, then the per-run token estimate.
  if (limits.maxRunsPerDay <= 0 || (await councilRunsToday()) >= limits.maxRunsPerDay) {
    return refuse(decision, COUNCIL_DAILY_CAP_MESSAGE(limits.maxRunsPerDay));
  }

  // Seats: every model named and checked before anything is sent.
  let seats: Array<{ providerId: string; model: string | null }>;
  try {
    seats = await resolvePanel(input.forcedPanel?.length ? input.forcedPanel : undefined);
  } catch (e) {
    return refuse(decision, e instanceof Error ? e.message : CHINA_POLICY_MESSAGE);
  }
  if (seats.length > LABELS.length) return refuse(decision, `A council seats at most ${LABELS.length} models.`);

  const maxWords = Math.max(120, Math.floor(limits.panelistMaxTokens * 0.6));
  const promptEstimate = estimateTokens(PANEL_SYSTEM) + estimateTokens(panelUserMessage(question, input.context, null, maxWords)) + (input.facts ? 1_200 : 0);
  const estimate =
    seats.length * (promptEstimate + limits.panelistMaxTokens) +
    (input.facts ? 1_000 : 0) +
    estimateTokens(JUDGE_SYSTEM) + estimateTokens(question) + seats.length * limits.panelistMaxTokens + limits.judgeMaxTokens;
  if (estimate > limits.maxTokensPerRun) return refuse(decision, COUNCIL_TOKEN_CAP_MESSAGE(estimate, limits.maxTokensPerRun));

  // Step 2 — web facts.
  let facts: CouncilFacts | null = null;
  let factsError: string | null = null;
  let totalTokens = 0;
  if (input.facts) {
    const f = await fetchWebFacts(question, limits);
    facts = f.facts;
    factsError = f.error ?? null;
    totalTokens += f.tokens;
  }

  // Step 3 — the panel, in parallel.
  const messages: ChatMessage[] = [
    { role: "system", content: PANEL_SYSTEM },
    { role: "user", content: panelUserMessage(question, input.context, facts, maxWords) },
  ];
  const panel = await Promise.all(seats.map((seat, i) => callPanelist(seat, LABELS[i], messages, limits)));
  for (const p of panel) if (p.ok) totalTokens += p.usage?.totalTokens ?? estimateTokens((p.answer ?? "") + messages[1].content);
  const answered = panel.filter(p => p.ok);

  const degrade = async (why: string, judgeRun?: JudgeRun) => {
    const finalText = [
      COUNCIL_PREAMBLE,
      `The council could not reach a checked answer: ${why}`,
      "Treat any figure in this conversation as unverified until an advisor confirms it.",
    ].join("\n\n");
    const log = await recordCouncilRun({
      ...base, outcome: "degraded", forced: decision.forced, decisionReason: `${decision.reason} Degraded: ${why}`.slice(0, 300),
      panel: panelLog(panel), judgeProviderId: judgeRun?.providerId ?? null, judgeModel: judgeRun?.model ?? null, judge: null,
      judgeRepaired: judgeRun?.repaired ?? false, confidence: null, factsProviderId: facts?.providerId ?? null,
      factCount: facts?.sources.length ?? 0, totalTokens: totalTokens + (judgeRun?.tokens ?? 0), latencyMs: Date.now() - started,
    });
    return result({
      outcome: "degraded", finalText, decision, panel, judge: null, judgeProviderId: judgeRun?.providerId ?? null,
      judgeModel: judgeRun?.model ?? null, judgeRepaired: judgeRun?.repaired ?? false, judgeError: judgeRun?.error ?? why,
      facts, factsError, totalTokens: totalTokens + (judgeRun?.tokens ?? 0), refusal: null,
    }, log.id);
  };

  if (answered.length < 2) return degrade(`only ${answered.length} of ${panel.length} panelists answered (two are needed).`);
  if (totalTokens > limits.maxTokensPerRun) return degrade(`the panel used ${totalTokens.toLocaleString("en-US")} tokens, over the per-run limit, so the judge was not called.`);

  // Step 4 — the judge.
  const judgeRun = await runJudge(question, panel, facts, limits);
  if (!judgeRun.verdict) return degrade(judgeRun.error ?? "the judge did not return a usable verdict.", judgeRun);
  totalTokens += judgeRun.tokens;

  // Step 5 — the caller's text.
  const finalText = composeFinalText(judgeRun.verdict, { panelSize: answered.length, contextLabels: input.contextLabels, facts });

  // Step 6 — the log.
  const log = await recordCouncilRun({
    ...base, outcome: "council", forced: decision.forced, decisionReason: decision.reason, panel: panelLog(panel),
    judgeProviderId: judgeRun.providerId ?? null, judgeModel: judgeRun.model ?? null, judge: judgeRun.verdict as unknown as CouncilJudgeLogJson,
    judgeRepaired: judgeRun.repaired, confidence: judgeRun.verdict.confidence, factsProviderId: facts?.providerId ?? null,
    factCount: facts?.sources.length ?? 0, totalTokens, latencyMs: Date.now() - started,
  });
  return result({
    outcome: "council", finalText, decision, panel, judge: judgeRun.verdict, judgeProviderId: judgeRun.providerId ?? null,
    judgeModel: judgeRun.model ?? null, judgeRepaired: judgeRun.repaired, judgeError: null, facts, factsError, totalTokens, refusal: null,
  }, log.id);
}

/** What an advisor sees under "Council details". Never sent to a household. */
export type CouncilDetails = {
  runId: number;
  outcome: CouncilOutcome;
  decisionReason: string;
  confidence: JudgeVerdict["confidence"] | null;
  panel: Array<{ label: string; providerId: string; model: string; ok: boolean; latencyMs: number; sources: string[]; error?: string; answer?: string }>;
  judge: JudgeVerdict | null;
  judgeProviderId: string | null;
  judgeModel: string | null;
  judgeRepaired: boolean;
  judgeError: string | null;
  factsProviderId: string | null;
  factSources: string[];
  factsError: string | null;
  totalTokens: number;
  latencyMs: number;
  refusal: string | null;
};

export function councilDetails(r: CouncilResult): CouncilDetails {
  return {
    runId: r.runId,
    outcome: r.outcome,
    decisionReason: r.decision.reason,
    confidence: r.judge?.confidence ?? null,
    panel: r.panel.map(p => ({ label: p.label, providerId: p.providerId, model: p.model, ok: p.ok, latencyMs: p.latencyMs, sources: p.sources, error: p.error, answer: p.answer })),
    judge: r.judge,
    judgeProviderId: r.judgeProviderId,
    judgeModel: r.judgeModel,
    judgeRepaired: r.judgeRepaired,
    judgeError: r.judgeError,
    factsProviderId: r.facts?.providerId ?? null,
    factSources: r.facts?.sources ?? [],
    factsError: r.factsError,
    totalTokens: r.totalTokens,
    latencyMs: r.latencyMs,
    refusal: r.refusal,
  };
}
