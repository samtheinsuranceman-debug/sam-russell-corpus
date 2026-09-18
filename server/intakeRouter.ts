// ============================================================
// AI INTAKE — tRPC router for the spoken fact finder.
//
// `script`        the question list (public; the browser drives the conversation)
// `recap`         the plain-sentence re-explanation of the answers (public)
// `threeQuestions` the three horizon questions, deterministic first and then
//                 polished by the lead model when one is configured (public)
// `save`          merge the answers into the signed-in user's Financial
//                 Assessment (protected)
// ============================================================
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getFactFinderForUser, saveFactFinderForUser } from "./factFinderDb";
import { recordAssessmentChange, recordEvent } from "./ledger";
import { ADVISOR_SYSTEM, leadModel } from "./ultraAI";
import {
  INTAKE_STEPS, PERMISSION_ASK, applyIntakeToFactFinder, buildRecap, buildThreeQuestions, intakeTotals,
  type Answers, type HorizonQuestion,
} from "@shared/aiIntakeScript";

const answerValue = z.union([z.string().max(2000), z.number().finite(), z.boolean(), z.null()]);
const answersSchema = z.record(z.string().max(64), answerValue);
const extrasSchema = z.object({
  priorities: z.string().max(4000).optional(),
  wishes: z.object({
    account: z.string().max(2000).optional(),
    future: z.string().max(2000).optional(),
    outcomes: z.string().max(2000).optional(),
  }).optional(),
});

function questionsPrompt(qs: HorizonQuestion[], a: Answers, extras: z.infer<typeof extrasSchema>): string {
  const t = intakeTotals(a);
  return (
    `A client just finished a spoken fact finder. Net worth about $${Math.round(t.netWorth).toLocaleString()}, ` +
    `liquid $${Math.round(t.liquid).toLocaleString()}, home equity $${Math.round(t.homeEquity).toLocaleString()}, ` +
    `retirement accounts $${Math.round(t.retirement).toLocaleString()}.\n` +
    (extras.priorities ? `Their stated priorities: ${extras.priorities}\n` : "") +
    (extras.wishes ? `Their three wishes: accounts: ${extras.wishes.account ?? "-"}; future: ${extras.wishes.future ?? "-"}; outcomes: ${extras.wishes.outcomes ?? "-"}\n` : "") +
    `\nBelow are three questions, built from their own numbers, that they would otherwise ask themselves in five, ten and fifteen years. ` +
    `Rewrite each as ONE spoken paragraph (90 to 140 words) addressed to the client, warm and direct, keeping every figure and every named strategy, ` +
    `ending with the question itself in quotation marks. Return exactly three paragraphs separated by a blank line, nothing else.\n\n` +
    qs.map((q) => `--- ${q.horizon} years: ${q.title}\nQuestion: ${q.question}\nEvidence: ${q.evidence.join(" ")}\nStrategies: ${q.strategies.join(", ")}`).join("\n\n")
  );
}

export const intakeRouter = router({
  script: publicProcedure.query(() => ({
    steps: INTAKE_STEPS.map((s) => ({ id: s.id, phase: s.phase, say: s.say, kind: s.kind, options: s.options ?? null })),
    permissionAsk: PERMISSION_ASK,
  })),

  recap: publicProcedure
    .input(z.object({ answers: answersSchema }))
    .query(({ input }) => ({ sentences: buildRecap(input.answers as Answers), totals: intakeTotals(input.answers as Answers) })),

  threeQuestions: publicProcedure
    .input(z.object({ answers: answersSchema, extras: extrasSchema.default({}) }))
    .mutation(async ({ input }) => {
      const answers = input.answers as Answers;
      const questions = buildThreeQuestions(answers, input.extras);
      let spoken: string[] | null = null;
      let via = "rule-engine";
      try {
        const lead = await leadModel(ADVISOR_SYSTEM, questionsPrompt(questions, answers, input.extras));
        if (lead?.text) {
          const paras = lead.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
          if (paras.length >= 3) { spoken = paras.slice(0, 3); via = lead.via; }
        }
      } catch {
        // The deterministic questions stand on their own.
      }
      return {
        questions: questions.map((q, i) => ({ ...q, spoken: spoken?.[i] ?? q.question })),
        via,
        totals: intakeTotals(answers),
      };
    }),

  save: protectedProcedure
    .input(z.object({ answers: answersSchema, extras: extrasSchema.default({}) }))
    .mutation(async ({ ctx, input }) => {
      const previous = await getFactFinderForUser(ctx.user.id);
      const next = applyIntakeToFactFinder(previous?.data, input.answers as Answers, input.extras);
      const saved = await saveFactFinderForUser(ctx.user.id, next);
      if (!saved) return { saved: false as const, reason: "No database on this host; the answers stay in this browser." };
      await recordAssessmentChange({ userId: ctx.user.id }, previous?.data, next, "client", ctx.user.name ?? null);
      await recordEvent({ kind: "status", source: "client", key: "intake.spoken", label: "AI intake", summary: "Spoken fact finder completed and merged into the Financial Assessment", userId: ctx.user.id }).catch(() => undefined);
      return { saved: true as const, completeness: saved.completeness, completedAt: saved.completedAt };
    }),
});
