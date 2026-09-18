// ============================================================
// FINANCIAL ASSESSMENT (client fact finder) — tRPC router.
// Each signed-in user owns exactly one assessment. Nothing here computes or
// shows results; it collects, stores, and reports completeness.
// ============================================================
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { deleteFactFinderForUser, getFactFinderForUser, saveFactFinderForUser } from "./factFinderDb";
import { emptyFactFinder, factFinderCompleteness, factFinderSummary, type ClientFactFinder } from "@shared/clientFactFinder";
import { computeWealthGenome } from "@shared/wealthGenome";
import { assessmentResetEvent, recordAssessmentChange, recordEvent } from "./ledger";

const value = z.union([z.string().max(4000), z.number().finite(), z.boolean(), z.null()]);
const sectionData = z.record(z.string().max(64), value);
export const factFinderSchema = z.object({
  version: z.literal(1),
  sections: z.record(z.string().max(64), sectionData),
  lists: z.record(z.string().max(64), z.array(sectionData).max(50)),
});

export const factFinderRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const stored = await getFactFinderForUser(ctx.user.id);
    const data = stored?.data ?? emptyFactFinder();
    return {
      data,
      completeness: factFinderCompleteness(data),
      completedAt: stored?.completedAt ?? null,
      updatedAt: stored?.updatedAt ?? null,
      persisted: Boolean(stored),
    };
  }),

  save: protectedProcedure
    .input(z.object({ data: factFinderSchema }))
    .mutation(async ({ ctx, input }) => {
      const data = input.data as ClientFactFinder;
      // The ledger records every changed field: read the previous state first.
      const previous = await getFactFinderForUser(ctx.user.id);
      const saved = await saveFactFinderForUser(ctx.user.id, data);
      if (!saved) return { saved: false as const, completeness: factFinderCompleteness(data), completedAt: null };
      await recordAssessmentChange({ userId: ctx.user.id }, previous?.data, data, "client", ctx.user.name ?? null);
      if (saved.completedAt && !previous?.completedAt) {
        await recordEvent({ kind: "status", source: "system", key: "assessment.completed", label: "Financial Assessment", summary: "Financial Assessment completed — the AI Financial Advisor is unlocked", userId: ctx.user.id });
      }
      return { saved: true as const, completeness: saved.completeness, completedAt: saved.completedAt };
    }),

  summary: protectedProcedure.query(async ({ ctx }) => {
    const stored = await getFactFinderForUser(ctx.user.id);
    const c = factFinderCompleteness(stored?.data);
    return { text: factFinderSummary(stored?.data), complete: c.complete, percent: c.percent };
  }),

  /** The eight-dimension Wealth Genome, computed from this user's assessment. */
  genome: protectedProcedure.query(async ({ ctx }) => {
    const stored = await getFactFinderForUser(ctx.user.id);
    return computeWealthGenome(stored?.data ?? null);
  }),

  reset: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteFactFinderForUser(ctx.user.id);
    await recordEvent(assessmentResetEvent({ userId: ctx.user.id }, ctx.user.name ?? null));
    return { ok: true as const };
  }),
});
