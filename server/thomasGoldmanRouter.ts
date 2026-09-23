/**
 * thomasGoldmanRouter — the AI advisor's conversation endpoint.
 *
 * Three things make this different from the platform's other AI calls:
 *
 *  1. It carries the advisor's own system prompt, which asks for several
 *     distinct strategy sequences with the authority each rests on — not one
 *     answer with a disclaimer stapled to it.
 *
 *  2. It has a working memory. A two-hour voice session produces far more
 *     transcript than fits in a context window, so older turns are summarised
 *     forward rather than dropped. Losing what someone said in minute nine
 *     because they were still talking in minute ninety is the failure mode
 *     that makes long sessions worthless.
 *
 *  3. Depth is explicit. "Direct" is one clear recommendation; "Integrated"
 *     works the problem across every domain at once.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { brainComplete } from "./providerRegistry";
import { buildAdvisorSystemPrompt, ADVISOR_NAME, VOICE_SESSION_MAX_MS } from "@shared/aiAdvisor";
import { MODEL_REGISTRY, buildModelDisclosure } from "@shared/aiModelRegistry";
import { executeToolCall, parseToolCall, toolCatalogue } from "./mcpRegistry";
import {
  buildCarrierSummary,
  carrierDataStats,
  loadRealCarriers,
  lookupCarrier,
  parseCarrierLookup,
  stripCarrierLookup,
} from "./carrierKnowledge";
import { buildMacroBrief, executeMacroLookup, parseMacroLookup, stripMacroLookup } from "./macroContext";
import { councilDetails, goldmanNeedsCouncil, runCouncil, type CouncilDetails } from "./council";
import { councilAccess } from "./councilRouter";

/** Added to an answer with household money figures that the council could not check. */
export const UNCHECKED_CAVEAT =
  "_These figures have not been cross-checked by our review panel. Treat them as unverified until your advisor confirms them. Hypothetical illustration, not tax, legal or investment advice._";

/** Macro scenario lookups allowed per turn. */
const MAX_MACRO_LOOKUPS = 2;

/** How many verbatim turns to keep before folding older ones into a summary. */
const VERBATIM_TURNS = 20;

/** Ceiling on a single message, generous enough for a long dictated passage. */
const MAX_MESSAGE_CHARS = 32_000;

/**
 * How many tool calls the advisor may chain in one turn.
 *
 * Each hop is a live request to a third-party system and another full model
 * call. A model that keeps reaching for tools should stop and answer with what
 * it has rather than loop.
 */
const MAX_TOOL_HOPS = 3;

/** Carrier lookups allowed per turn. Two is enough to compare a pair. */
const MAX_CARRIER_LOOKUPS = 2;

export type Depth = "direct" | "deeper" | "integrated";

const DEPTH_INSTRUCTION: Record<Depth, string> = {
  direct:
    "DEPTH: DIRECT. Give the single sequence you would actually recommend, in order, with the numbers. Name the authority it rests on. Two or three sentences on what would change your mind. Do not enumerate alternatives unless the client is close to a decision that would be hard to unwind.",
  deeper:
    "DEPTH: DEEPER. Give three to five distinct sequences that reach the goal by different routes. For each: the ordered steps, capital required and when, the mechanism, the cost, what breaks it, and the authority it rests on. Say which you would take and why, then what would have to be true for you to prefer another.",
  integrated:
    "DEPTH: INTEGRATED. Work the whole picture at once — tax, insurance, real estate, debt, entity structure, estate, and the family dynamics that decide whether it survives a generation. Build five to fifteen sequences where the situation supports it, and show explicitly where one domain's move constrains or unlocks another. Call out the ordering and timing effects, because that is usually where the money is. Name the authority for every step, and flag anything a knowledgeable reader would think is aggressive — then explain why it is not, or concede that it is contested.",
};

/**
 * Fold older turns into a compact summary so a long session keeps its early
 * disclosures. Runs against the model itself, because a naive truncation
 * throws away exactly the facts that took an hour to surface.
 */
async function summarizeEarlierTurns(
  turns: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  if (turns.length === 0) return "";
  const transcript = turns
    .map(t => `${t.role === "user" ? "CLIENT" : "ADVISOR"}: ${t.content}`)
    .join("\n\n")
    .slice(0, 60_000);

  const res = await brainComplete({
    messages: [
      {
        role: "system",
        content:
          "Compress this advisory conversation into dense structured notes for the advisor's working memory. Keep every hard fact: names, ages, dollar amounts, account types, carriers, rates, dates, entities, property addresses, family relationships, stated goals, stated fears, and anything the client asked to be kept in mind. Keep the client's own wording for anything emotionally loaded. Drop pleasantries and the advisor's own explanations. Never invent a detail that is not present. Output as terse labelled bullets.",
      },
      { role: "user", content: transcript },
    ],
    maxTokens: 4000,
  });

  return res.text;
}

/**
 * The LLM type allows structured content parts as well as a plain string.
 * Everything downstream of here wants text, so flatten once, in one place.
 */
function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(part => (typeof part === "string" ? part : part && (part as any).type === "text" ? (part as any).text : ""))
      .filter(Boolean)
      .join("");
  }
  return "";
}

export const thomasGoldmanRouter = router({
  /** Advisor identity and limits, for the client to render without guessing. */
  profile: publicProcedure.query(() => ({
    name: ADVISOR_NAME,
    voiceSessionMaxMs: VOICE_SESSION_MAX_MS,
  })),

  /**
   * One turn of conversation.
   *
   * `priorSummary` is returned alongside the reply. The client holds it and
   * passes it back, so the session survives page navigation without needing
   * server-side session storage.
   */
  ask: protectedProcedure
    .input(
      z.object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(MAX_MESSAGE_CHARS),
            }),
          )
          .min(1),
        depth: z.enum(["direct", "deeper", "integrated"]).default("deeper"),
        /** Rolling summary of turns already folded out of the transcript. */
        priorSummary: z.string().max(40_000).optional(),
        clientId: z.number().optional(),
        clientFirstName: z.string().max(80).optional(),
        /** Typed context from the surface that asked: the pages the visitor opened this session, in order (site-map nudge). */
        context: z
          .object({ pagesOpened: z.array(z.string().max(200)).max(60).optional() })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { messages, depth, clientId } = input;
      const pagesOpened = input.context?.pagesOpened?.filter(Boolean) ?? [];
      const visitContext = pagesOpened.length
        ? `\n--- THIS VISIT ---\nThe visitor opened these pages from the site map, in this order:\n${pagesOpened.map((p, i) => `${i + 1}. ${p}`).join("\n")}\nTreat what those pages are about as what they came for; do not ask them to repeat it.`
        : "";

      // ── Working memory ──────────────────────────────────────────────────
      // Keep the most recent turns verbatim; fold anything older into the
      // rolling summary rather than discarding it.
      let summary = input.priorSummary ?? "";
      let recent: typeof messages = messages;
      if (messages.length > VERBATIM_TURNS) {
        const toFold = messages.slice(0, messages.length - VERBATIM_TURNS);
        recent = messages.slice(-VERBATIM_TURNS);
        try {
          const folded = await summarizeEarlierTurns(toFold);
          summary = summary ? `${summary}\n\n${folded}` : folded;
        } catch (e) {
          // If summarisation fails, keep the older turns rather than losing
          // them — a longer prompt is far better than amnesia.
          console.error("[Thomas] summarisation failed, retaining full transcript:", e);
          recent = messages;
        }
      }

      // ── Client context from the CRM ─────────────────────────────────────
      let clientContext = "";
      let workspaceId: number | null = null;
      if (clientId) {
        try {
          const { getClientById } = await import("./db");
          const { getWorkspaceForUser } = await import("./routers");
          const ws = await getWorkspaceForUser(ctx.user.id);
          workspaceId = ws?.id ?? null;
          const client = ws ? await getClientById(clientId, ws.id) : null;
          if (client) {
            const n = (v: unknown) => Number(v ?? 0);
            clientContext = [
              "\n--- CLIENT RECORD (from the platform, treat as fact) ---",
              `Name: ${client.name}`,
              client.age ? `Age: ${client.age}` : null,
              `Income: $${n(client.income).toLocaleString()}`,
              `Traditional IRA: $${n(client.iraBalance).toLocaleString()}`,
              `Roth: $${n(client.rothBalance).toLocaleString()}`,
              `Taxable: $${n(client.taxableAssets).toLocaleString()}`,
              `Real estate equity: $${n(client.realEstateEquity).toLocaleString()}`,
              `Life insurance cash value: $${n(client.lifeInsuranceCv).toLocaleString()}`,
            ]
              .filter(Boolean)
              .join("\n");
          }
        } catch (e) {
          console.error("[Thomas] client context lookup failed:", e);
        }
      }

      // ── Model disclosure, so he can answer "what are you?" truthfully ───
      const live = MODEL_REGISTRY.filter(m => {
        const v = process.env[m.envVar];
        return typeof v === "string" && v.trim().length > 0;
      });
      const disclosure = buildModelDisclosure(live);

      // Connected MCP tools, if any. Only servers marked for automatic use
      // appear here — the advisor cannot call what it has not been told about.
      let tools = { text: "", count: 0, servers: 0 };
      try {
        tools = await toolCatalogue();
      } catch (e) {
        console.error("[Thomas] tool catalogue failed:", e);
      }

      // Real carrier terms the owner has entered. Empty until the first rate
      // sheet goes in, at which point these lead the prompt and the sample
      // products get demoted to "demonstration only".
      const realCarriers = await loadRealCarriers();

      // The platform's own macro models — Treasury liquidation odds, Taiwan,
      // oil settlement, sovereign debt — dated and sourced. Without this he
      // would answer "what if China dumps Treasuries" from training data.
      let macroBrief = "";
      try {
        const { currentObservations } = await import("./macroRouter");
        const cur = await currentObservations();
        macroBrief = buildMacroBrief(cur.observations).text;
      } catch (e) {
        console.error("[Thomas] macro brief failed:", e);
      }

      const system = [
        buildAdvisorSystemPrompt({
          clientFirstName: input.clientFirstName,
          modelDisclosure: disclosure,
        }),
        DEPTH_INSTRUCTION[depth as Depth],
        // The platform's own carrier tables. Without this the advisor answers
        // rate questions from training data, which is the single most
        // dangerous thing this system can do.
        buildCarrierSummary(realCarriers),
        macroBrief,
        tools.text,
        summary
          ? `\n--- WORKING MEMORY (earlier in this conversation) ---\n${summary}\n--- END WORKING MEMORY ---\nTreat everything above as things the client already told you. Do not ask them again.`
          : "",
        clientContext,
        visitContext,
      ]
        .filter(Boolean)
        .join("\n\n");

      let reply: string;
      let answeredBy: { providerId: string; model: string } | null = null;
      try {
        const res = await brainComplete({
          messages: [{ role: "system", content: system }, ...recent],
          maxTokens: depth === "integrated" ? 16_000 : 8_000,
        });
        reply = res.text;
        answeredBy = { providerId: res.providerId, model: res.model };
      } catch (e) {
        console.error("[Thomas] brainComplete failed:", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${ADVISOR_NAME} could not reach the model. Your conversation is safe — try again in a moment.`,
        });
      }

      if (!reply.trim()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${ADVISOR_NAME} returned an empty response. Please try again.`,
        });
      }

      // ── Carrier lookup round trip ───────────────────────────────────────
      //
      // Local data, so this is a cheap in-process call rather than a network
      // hop. Two lookups is enough to compare a pair of products; more than
      // that and he should be answering.
      const carriersConsulted: string[] = [];
      let carrierHops = 0;
      let carrierMessages = [...recent];

      while (carrierHops < MAX_CARRIER_LOOKUPS) {
        const query = parseCarrierLookup(reply);
        if (!query) break;
        carrierHops += 1;

        const detail = lookupCarrier(query);
        if (detail.found) carriersConsulted.push(query);

        carrierMessages = [
          ...carrierMessages,
          { role: "assistant" as const, content: reply },
          { role: "user" as const, content: detail.text },
        ];

        try {
          const followUp = await brainComplete({
            messages: [{ role: "system", content: system }, ...carrierMessages],
            maxTokens: depth === "integrated" ? 16_000 : 8_000,
          });
          reply = followUp.text;
        } catch (e) {
          console.error("[Thomas] follow-up after carrier lookup failed:", e);
          reply = detail.text;
          break;
        }
      }

      // Never let an unanswered directive reach the client as prose.
      if (parseCarrierLookup(reply)) reply = stripCarrierLookup(reply);
      recent = carrierMessages;

      // ── Macro scenario round trip ───────────────────────────────────────
      //
      // In-process engine calls (no network): a liquidation scenario at a
      // stated fraction, or a sovereign debt row. Two per turn.
      const macroConsulted: string[] = [];
      let macroHops = 0;
      let macroMessages = [...recent];
      while (macroHops < MAX_MACRO_LOOKUPS) {
        const q = parseMacroLookup(reply);
        if (!q) break;
        macroHops += 1;
        const result = executeMacroLookup(q);
        macroConsulted.push(q.kind === "liquidation" ? `liquidation ${q.holder} ${Math.round(q.fraction * 100)}%/${q.months}m` : `debt ${q.iso3}`);
        macroMessages = [
          ...macroMessages,
          { role: "assistant" as const, content: reply },
          { role: "user" as const, content: result },
        ];
        try {
          const followUp = await brainComplete({
            messages: [{ role: "system", content: system }, ...macroMessages],
            maxTokens: depth === "integrated" ? 16_000 : 8_000,
          });
          reply = followUp.text;
        } catch (e) {
          console.error("[Thomas] follow-up after macro lookup failed:", e);
          reply = result;
          break;
        }
      }
      if (parseMacroLookup(reply)) reply = stripMacroLookup(reply);
      recent = macroMessages;

      // ── Tool round trip ─────────────────────────────────────────────────
      //
      // If the advisor asked for a tool, run it and give it one more turn with
      // the result. Capped at MAX_TOOL_HOPS: a model that keeps reaching for
      // tools should stop and answer rather than loop, and each hop is a live
      // request to a third-party system.
      const toolsUsed: Array<{ tool: string; ok: boolean }> = [];
      let hops = 0;
      let workingMessages = [...recent];

      while (hops < MAX_TOOL_HOPS) {
        const call = parseToolCall(reply);
        if (!call) break;
        hops += 1;

        const outcome = await executeToolCall(call);
        toolsUsed.push({ tool: `${call.serverSlug}.${call.toolName}`, ok: outcome.ok });

        workingMessages = [
          ...workingMessages,
          { role: "assistant" as const, content: reply },
          { role: "user" as const, content: outcome.output },
        ];

        try {
          const followUp = await brainComplete({
            messages: [{ role: "system", content: system }, ...workingMessages],
            maxTokens: depth === "integrated" ? 16_000 : 8_000,
          });
          reply = followUp.text;
        } catch (e) {
          console.error("[Thomas] follow-up after tool call failed:", e);
          reply = `I called ${call.serverSlug}.${call.toolName} and got a result, but could not complete the analysis on top of it. Here is the raw result:\n\n${outcome.output}`;
          break;
        }
      }

      if (hops >= MAX_TOOL_HOPS && parseToolCall(reply)) {
        // Strip a trailing unanswered directive rather than showing it to the
        // client as if it were prose.
        reply = reply.replace(/TOOL_CALL:\s*\{[\s\S]*\}/, "").trim() ||
          "I reached the limit on tool calls for one turn. Ask me to continue and I will pick up from what I have.";
      }

      // ── The Council ─────────────────────────────────────────────────────
      //
      // An answer with numbers about a household's taxes, loans or policy
      // values is expensive to get wrong, so it is routed through the council
      // (three pinned models and a non-voting judge) and the household sees
      // only the text written from the judge's verdict. Advisors and the owner
      // also get the workings, for the "Council details" expander. If the
      // council cannot convene (cap reached, too few models), his own answer
      // stands and only staff are told why.
      let council: CouncilDetails | null = null;
      if (goldmanNeedsCouncil(reply)) {
        const question = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
        const recentTranscript = messages
          .slice(-6)
          .map(t => `${t.role === "user" ? "CLIENT" : "ADVISOR"}: ${t.content}`)
          .join("\n\n");
        const contextLabels = [
          clientContext ? "the client record on the platform" : "",
          summary ? "this conversation's working memory (as statements, not facts)" : "",
          "the recent turns of this conversation (as statements, not facts)",
        ].filter(Boolean);
        try {
          // The per-household cap needs the asker's workspace even without a client record.
          if (workspaceId === null) {
            const { getWorkspaceByOwnerId } = await import("./db");
            workspaceId = (await getWorkspaceByOwnerId(ctx.user.id))?.id ?? null;
          }
          const run = await runCouncil({
            question,
            // Only the structured client record goes in as fact; what was said is fenced as statements.
            context: clientContext || undefined,
            conversation: [summary ? `WORKING MEMORY:\n${summary.slice(0, 8_000)}` : "", `RECENT CONVERSATION:\n${recentTranscript}`].filter(Boolean).join("\n\n"),
            contextLabels,
            room: "goldman",
            force: true,
            facts: true,
            workspaceId,
          });
          if (run.outcome === "council") {
            reply = run.finalText;
          } else {
            // The figures above were not cross-checked; the household is told so.
            reply = `${reply}\n\n${UNCHECKED_CAVEAT}`;
          }
          const access = await councilAccess(ctx.user);
          council = access.level === "household" ? null : councilDetails(run);
        } catch (e) {
          console.error("[Thomas] council run failed; his own answer stands with a caveat:", e);
          reply = `${reply}\n\n${UNCHECKED_CAVEAT}`;
        }
      }

      return {
        reply,
        /** Advisors and the owner only; always null for a household. */
        council,
        answeredBy,
        toolsUsed,
        toolsAvailable: tools.count,
        carriersConsulted,
        macroConsulted,
        carrierData: { ...carrierDataStats(), realCarriers: realCarriers.length },
        /** Pass this back on the next turn to preserve the session. */
        summary,
        depth,
        foldedTurns: messages.length - recent.length,
      };
    }),

  /**
   * Adversarial review — a second, genuinely different model attacks the first
   * one's recommendation.
   *
   * ─── WHY THIS BEATS POLLING TWENTY MODELS ─────────────────────────────────
   *
   * Asking many models the same question produces correlated answers: they are
   * trained on overlapping data with similar methods, so they tend to be wrong
   * in the same direction. Twenty agreeing is not twenty confirmations, it is
   * one confirmation echoed.
   *
   * Two models pointed AT EACH OTHER is different. The reviewer is not asked
   * "what do you think?" — it is told to find the flaw, and given the specific
   * failure modes that matter here. Structured disagreement surfaces problems
   * that agreement never will.
   *
   * The reviewer is explicitly excluded from being the same provider that
   * wrote the answer. A model reviewing its own work is not a review.
   */
  challenge: protectedProcedure
    .input(
      z.object({
        /** The recommendation to attack. */
        recommendation: z.string().min(1).max(60_000),
        /** What the client asked, for context. */
        question: z.string().max(10_000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { completeChat, NoProviderAvailableError } = await import("./providerRegistry");

      const reviewerPrompt = `You are reviewing another AI advisor's financial recommendation before it reaches a client. Your job is to find what is wrong with it. You are not here to be agreeable, and you are not here to rewrite it — you are here to find the flaw.

Work through these in order and report only what you actually find. If a category is clean, say so in a few words and move on; do not manufacture a concern to look thorough.

1. FABRICATED NUMBERS. Any cap rate, participation rate, credited rate, carrier
   term, historical return or tax figure stated without a source. This is the
   most dangerous category — a confident wrong number gets repeated to a client
   and planned around. Flag every unsourced figure.

2. TAX AND LEGAL ERRORS. Any assertion about tax treatment that is wrong,
   oversimplified, or stated with more confidence than the law supports. Check
   any cited code section actually says what it is claimed to say.

3. ECONOMIC SUBSTANCE. Do the individually valid steps combine into something
   whose only purpose is tax? IRC §7701(o) carries a strict-liability penalty,
   and sequencing legal steps toward a result none was intended to produce is
   exactly what it addresses.

4. WHAT BREAKS IT. What has to be true for this to work that the
   recommendation does not mention? A rate that must hold, a policy that must
   not lapse, a market that must not fall, liquidity that must be there. Name
   the unstated assumptions.

5. WHAT WAS LEFT OUT. Costs, fees, surrender charges, taxes on exit, the
   do-nothing alternative, the simpler option that gets 80% of the benefit.

6. SUITABILITY. Is this appropriate for the client as described, or is it a
   sophisticated answer to a question they did not ask?

Finish with a one-line verdict, exactly one of:
  SOUND — I could not break it.
  SOUND WITH CAVEATS — it holds, but these gaps must be closed first: ...
  DO NOT SEND — this has a defect that would harm the client: ...

Be specific. "Consider tax implications" is useless. "The §1031 step assumes
the 45-day window starts at closing; it starts at transfer of the relinquished
property, which makes this schedule impossible" is a review.`;

      const target = [
        input.question ? `THE CLIENT ASKED:\n${input.question}\n` : "",
        `THE RECOMMENDATION TO REVIEW:\n${input.recommendation}`,
      ].filter(Boolean).join("\n");

      // Who wrote it, so the reviewer is not the same provider.
      let authorProvider: string | undefined;
      try {
        const { liveProviderIds } = await import("./providerRegistry");
        authorProvider = (await liveProviderIds())[0];
      } catch { /* fall through */ }

      try {
        const review = await completeChat({
          messages: [
            { role: "system", content: reviewerPrompt },
            { role: "user", content: target },
          ],
          maxTokens: 8_000,
          // A model reviewing its own output is not a review.
          exclude: authorProvider ? [authorProvider] : [],
        });

        const text = review.text;
        const verdict = /DO NOT SEND/i.test(text)
          ? ("do_not_send" as const)
          : /SOUND WITH CAVEATS/i.test(text)
            ? ("caveats" as const)
            : /\bSOUND\b/i.test(text)
              ? ("sound" as const)
              : ("unclear" as const);

        return {
          review: text,
          verdict,
          reviewerProvider: review.providerId,
          reviewerModel: review.model,
          /**
           * True when only one provider is configured, so the "second" opinion
           * came from the same place as the first. Surfaced rather than hidden
           * — a review by the same model is worth much less, and the person
           * reading it should know that.
           */
          sameProviderAsAuthor: Boolean(authorProvider && review.providerId === authorProvider),
        };
      } catch (e) {
        if (e instanceof NoProviderAvailableError) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Adversarial review needs a second AI provider. Add one in the AI Connector — a model reviewing its own work is not a review.",
          });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The review could not be completed." });
      }
    }),

  /**
   * Turn a long voice transcript into the structured facts the advisor needs.
   * Separate from `ask` because a two-hour monologue should be digested once,
   * not re-parsed on every subsequent turn.
   */
  digestTranscript: protectedProcedure
    .input(z.object({ transcript: z.string().min(1).max(500_000) }))
    .mutation(async ({ input }) => {
      const res = await brainComplete({
        messages: [
          {
            role: "system",
            content:
              "You are extracting facts from a client's spoken account of their financial life. Produce labelled sections: PEOPLE (names, ages, relationships, health), INCOME, ASSETS (with account types and balances), DEBTS (with rates and terms), INSURANCE (carriers, face amounts, cash values), BUSINESS, PROPERTY, TAX POSITION, STATED GOALS, STATED FEARS, CONSTRAINTS, and OPEN QUESTIONS — the things they referred to but did not quantify. Record only what was actually said. Where a figure was approximate, mark it approximate. Where something was implied but not stated, put it under OPEN QUESTIONS rather than asserting it. Never invent a number.",
          },
          { role: "user", content: input.transcript.slice(0, 400_000) },
        ],
        maxTokens: 8000,
      });
      return { digest: res.text };
    }),
});
