// ============================================================
// THE PLAN LEDGER — tRPC. A signed-in client reads their own chain; an
// advisor reads a client's or a lead's chain in their workspace. Anyone can
// replay the assessment as it stood at a moment, diff two moments, add a
// decision or note, and verify the chain has not been altered.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { getClientById, getWorkspaceByOwnerId } from "./db";
import { countEvents, listEvents, verifyChain } from "./ledgerDb";
import { recordEvent } from "./ledger";
import { LEDGER_KINDS, ledgerSubject, replayFacts, diffFactFinder, type LedgerKind } from "@shared/planLedger";
import { factFinderCompleteness } from "@shared/clientFactFinder";

const scope = z.object({ clientId: z.number().int().positive().optional(), leadId: z.number().int().positive().optional() });

/** Resolve which chain the caller may read: their own, or a client/lead they own. */
async function resolveSubject(ctx: { user: { id: number; openId: string; role: string } }, input: { clientId?: number; leadId?: number }): Promise<{ subject: string; ids: { userId?: number; clientId?: number; leadId?: number; workspaceId?: number } }> {
  if (input.clientId) {
    const ws = await getWorkspaceByOwnerId(ctx.user.id);
    if (!ws) throw new TRPCError({ code: "NOT_FOUND" });
    const client = await getClientById(input.clientId, ws.id);
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    return { subject: ledgerSubject({ clientId: client.id }), ids: { clientId: client.id, workspaceId: ws.id } };
  }
  if (input.leadId) {
    const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
    if (!isOwner) throw new TRPCError({ code: "FORBIDDEN" });
    return { subject: ledgerSubject({ leadId: input.leadId }), ids: { leadId: input.leadId } };
  }
  return { subject: ledgerSubject({ userId: ctx.user.id }), ids: { userId: ctx.user.id } };
}

export const ledgerRouter = router({
  /** Newest first. `beforeSeq` pages backwards. */
  timeline: protectedProcedure
    .input(scope.extend({ kinds: z.array(z.enum(LEDGER_KINDS)).optional(), limit: z.number().int().min(1).max(500).default(100), beforeSeq: z.number().int().positive().optional() }).default({ limit: 100 }))
    .query(async ({ ctx, input }) => {
      const { subject } = await resolveSubject(ctx, input);
      const [events, total] = await Promise.all([listEvents(subject, { kinds: input.kinds as LedgerKind[] | undefined, limit: input.limit, beforeSeq: input.beforeSeq }), countEvents(subject)]);
      return { subject, total, events };
    }),

  /** The assessment as it stood at `asOf` (default now), rebuilt from fact events alone. */
  replay: protectedProcedure
    .input(scope.extend({ asOf: z.string().datetime().optional() }).default({}))
    .query(async ({ ctx, input }) => {
      const { subject } = await resolveSubject(ctx, input);
      const facts = await listEvents(subject, { kinds: ["fact", "status"], ascending: true, limit: 2000 });
      const asOf = input.asOf ? new Date(input.asOf) : undefined;
      const data = replayFacts(facts, asOf);
      const applied = asOf ? facts.filter((e) => e.occurredAt.getTime() <= asOf.getTime()).length : facts.length;
      return { asOf: (asOf ?? new Date()).toISOString(), data, completeness: factFinderCompleteness(data), applied, firstEventAt: facts[0]?.occurredAt ?? null, lastEventAt: facts.at(-1)?.occurredAt ?? null };
    }),

  /** What changed between two moments, as fact events. */
  diff: protectedProcedure
    .input(scope.extend({ from: z.string().datetime(), to: z.string().datetime().optional() }))
    .query(async ({ ctx, input }) => {
      const { subject } = await resolveSubject(ctx, input);
      const facts = await listEvents(subject, { kinds: ["fact", "status"], ascending: true, limit: 2000 });
      const before = replayFacts(facts, new Date(input.from));
      const after = replayFacts(facts, input.to ? new Date(input.to) : undefined);
      return { from: input.from, to: input.to ?? new Date().toISOString(), changes: diffFactFinder(before, after, "system") };
    }),

  /** An advisor's decision or a note, in the client's own words or the advisor's. */
  append: protectedProcedure
    .input(scope.extend({ kind: z.enum(["decision", "note", "assumption", "outcome"]), summary: z.string().min(1).max(2000), key: z.string().max(120).optional(), value: z.union([z.string().max(4000), z.number(), z.boolean(), z.null()]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { ids } = await resolveSubject(ctx, input);
      const source = input.clientId || input.leadId ? "advisor" : "client";
      const n = await recordEvent({ kind: input.kind, source, key: input.key ?? null, label: null, value: input.value ?? null, summary: input.summary, actorName: ctx.user.name ?? null, ...ids });
      return { recorded: n > 0 };
    }),

  verify: protectedProcedure.input(scope.default({})).query(async ({ ctx, input }) => {
    const { subject } = await resolveSubject(ctx, input);
    return { subject, ...(await verifyChain(subject)) };
  }),
});
