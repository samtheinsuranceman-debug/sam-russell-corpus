// ============================================================
// HIVE ROUTER — mounted as `hive` in server/routers.ts.
//   hive.address   public   the one address + member counts (proof it is the hive)
//   hive.roster    auth     members, MCP servers, verifiers
//   hive.ask       auth     the question path (Samuel Goldman, VoiceAdvisor, pages)
//   hive.inform    auth     the write path: pages, engines, verifiers feed memory
//   hive.memory    auth     the grounded context the members read (for the audit panel)
//   hive.nudge     auth     "I noticed you opened …" text + optional spoken audio
// ============================================================
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { askHive, hiveContextFor, hiveRoster } from "./hiveMind";
import { recordHiveEvent, recentHiveEvents } from "./hiveMemoryDb";
import { HIVE_MIND_ADDRESS, HIVE_MIND_INFORM_ADDRESS, NUDGE_AFTER_PAGE_OPENS } from "@shared/hiveMind";
import { nudgeScript, ADVISOR_NAME } from "@shared/aiAdvisor";
import { pageOpensSince } from "@shared/hiveContext";
import { calculator } from "@shared/calculatorCatalog";
import { synthesize } from "./speech";
import { recordEvent } from "./ledger";

const memoryKind = z.enum(["page_visit", "page_close", "calc_result", "forecast_toggle", "verification", "decision", "question", "nudge", "note"]);

const informSchema = z.object({
  kind: memoryKind,
  routePath: z.string().max(200).optional(),
  engine: z.string().max(120).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  source: z.string().max(200).optional(),
  asOf: z.string().max(40).optional(),
  outcome: z.enum(["pass", "fail", "unverified"]).optional(),
});

export const hiveRouter = router({
  address: publicProcedure.query(async () => {
    const roster = await hiveRoster();
    return {
      address: HIVE_MIND_ADDRESS,
      informAddress: HIVE_MIND_INFORM_ADDRESS,
      advisor: ADVISOR_NAME,
      members: roster.members.length,
      mcpServers: roster.mcpServers.length,
      verifiers: roster.verifiers.length,
    };
  }),

  roster: protectedProcedure.query(() => hiveRoster()),

  ask: protectedProcedure
    .input(z.object({
      question: z.string().min(1).max(4_000),
      routePath: z.string().max(200).optional(),
      depth: z.enum(["direct", "deeper", "integrated"]).default("direct"),
      clientId: z.number().int().positive().optional(),
    }))
    .mutation(({ ctx, input }) => askHive(ctx.user.id, input)),

  inform: protectedProcedure
    .input(informSchema)
    .mutation(async ({ ctx, input }) => {
      const stored = await recordHiveEvent(ctx.user.id, input);
      // Calculator results and decisions also go to the plan ledger so the
      // existing automations and webhooks see them.
      if (input.kind === "calc_result" || input.kind === "decision") {
        await recordEvent({
          kind: input.kind === "calc_result" ? "outcome" : "decision",
          source: "client",
          key: `hive.${input.kind}.${input.engine ?? input.routePath ?? "unknown"}`,
          label: input.engine ?? input.routePath ?? null,
          value: input.payload ?? null,
          summary: input.kind === "calc_result"
            ? `Calculator result published to the hive: ${input.engine ?? input.routePath ?? ""}`
            : `Decision recorded in the hive: ${input.routePath ?? ""}`,
          userId: ctx.user.id,
          actorName: ctx.user.name ?? null,
        });
      }
      return { ok: true, id: stored.id };
    }),

  memory: protectedProcedure
    .input(z.object({ routePath: z.string().max(200).optional(), limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const context = await hiveContextFor(ctx.user.id, input.routePath);
      const events = await recentHiveEvents(ctx.user.id, input.limit);
      return { context, events };
    }),

  nudge: protectedProcedure
    .input(z.object({
      routePath: z.string().max(200),
      sessionStartedAt: z.string().max(40),
      speak: z.boolean().default(true),
      /**
       * The exact words to speak and record. The site map passes the
       * operator's script (SITE_MAP_NUDGE_TEXT) after its own third-open
       * gate has fired, so the server trusts that gate and only guards
       * against speaking twice in one session. Without `text`, the server
       * applies the open-count gate and composes a page-specific line.
       */
      text: z.string().min(1).max(1_200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const events = await recentHiveEvents(ctx.user.id, 100);
      const opens = pageOpensSince(events, input.sessionStartedAt);
      const alreadyNudged = events.some(e => e.kind === "nudge" && e.createdAt >= input.sessionStartedAt);
      if (alreadyNudged || (!input.text && opens < NUDGE_AFTER_PAGE_OPENS)) {
        return { fire: false as const, opens, text: null, audio: null };
      }
      const entry = calculator(input.routePath);
      const title = entry?.name ?? input.routePath.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? "this page";
      const text = input.text ?? nudgeScript(title, entry?.blurb);
      let audio: { audioBase64: string; mimeType: string; via: string } | null = null;
      if (input.speak) {
        try {
          const s = await synthesize(text.slice(0, 1_200));
          if (s) audio = { audioBase64: s.audio.toString("base64"), mimeType: s.mimeType, via: s.via };
        } catch { /* browser speech is the fallback; the text still renders */ }
      }
      await recordHiveEvent(ctx.user.id, { kind: "nudge", routePath: input.routePath, payload: { title, spoken: Boolean(audio) } });
      return { fire: true as const, opens, text, audio };
    }),
});
