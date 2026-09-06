// ============================================================
// THE QUESTIONS YOU HAVEN'T ASKED — tRPC. Consent at every step, sealed on
// the ledger; the profile grows from what the client adds; the answers come
// from the profile and the engines through the council where configured.
// ============================================================
import { createHash } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { recordEvent } from "./ledger";
import { listEvents } from "./ledgerDb";
import { ledgerSubject } from "@shared/planLedger";
import { factsUsed, recordAdvice } from "./advice";
import { getFactFinderForUser, saveFactFinderForUser } from "./factFinderDb";
import { factFinderSummary, type ClientFactFinder } from "@shared/clientFactFinder";
import { ADVISOR_SYSTEM, configuredProviders, leadModel } from "./ultraAI";
import { COUNT_OPTIONS, candidateQuestions, pickQuestions, proposeScript, revealScript, shouldOffer, type CountOption, type UnaskedQuestion } from "@shared/unaskedQuestions";
import { inflationLadder } from "./inflation";
import { weightedClaims } from "./forecastSources";
import { taxTrajectory } from "@shared/erosion";

const hashProfile = (ff: ClientFactFinder | null | undefined) => createHash("sha256").update(JSON.stringify(ff?.sections ?? {})).digest("hex").slice(0, 16);

async function context(userId: number) {
  const stored = await getFactFinderForUser(userId);
  const [ladder, wc] = await Promise.all([inflationLadder().catch(() => []), weightedClaims().catch(() => null)]);
  const inflation = ladder.find((c) => c.id === "all")?.rates[20] ?? 0.03;
  const traj = wc ? taxTrajectory({ startYear: new Date().getFullYear(), claims: wc.claims, totalPanelWeight: wc.totalPanelWeight, allPanelWeight: wc.allPanelWeight }) : [];
  const pHigher30 = traj.find((p) => p.horizonYears === 30)?.pHigher ?? 0.8;
  const candidates = candidateQuestions(stored?.data, { inflation, pHigherTaxes30: pHigher30 });
  return { stored, candidates, profileHash: hashProfile(stored?.data), inflation, pHigher30 };
}

async function lastOffer(userId: number): Promise<{ at: Date; questionIds: string[]; profileHash: string } | null> {
  const events = await listEvents(ledgerSubject({ userId }), { kinds: ["consent"], limit: 50 }).catch(() => []);
  const e = events.find((x) => x.key === "unasked.propose");
  if (!e) return null;
  const v = (e.value ?? {}) as { questionIds?: string[]; profileHash?: string };
  return { at: new Date(e.occurredAt), questionIds: v.questionIds ?? [], profileHash: v.profileHash ?? "" };
}

export const unaskedRouter = router({
  /** Should the librarian offer now, and what would it say? Shows no questions. */
  status: protectedProcedure.query(async ({ ctx }) => {
    const { stored, candidates, profileHash } = await context(ctx.user.id);
    const last = await lastOffer(ctx.user.id);
    const gate = shouldOffer(last, new Date(), profileHash, candidates);
    return { assessmentPresent: Boolean(stored), available: candidates.length, offer: gate.offer && candidates.length >= 3, reason: gate.reason, counts: Object.entries(COUNT_OPTIONS).map(([id, c]) => ({ id, label: c.label, min: c.min, max: Math.min(c.max, candidates.length) })), script: candidates.length >= 3 ? proposeScript(Math.min(candidates.length, 10), 3) : null, lastOfferedAt: last?.at ?? null };
  }),

  /** Step 1: the client answers the permission question. Sealed either way. */
  propose: protectedProcedure.input(z.object({ count: z.enum(["3-5", "5-7", "5-10"]), permission: z.boolean() })).mutation(async ({ ctx, input }) => {
    const { candidates, profileHash } = await context(ctx.user.id);
    const picked = pickQuestions(candidates, input.count as CountOption);
    await recordEvent({ kind: "consent", source: "client", key: "unasked.propose", label: input.permission ? "Client agreed to see the unasked questions" : "Client declined the unasked questions", value: { permission: input.permission, count: input.count, questionIds: picked.map((q) => q.id), profileHash }, summary: input.permission ? `Agreed to see ${picked.length} questions they had not asked` : "Declined to see the unasked questions for now", actorName: ctx.user.name ?? null, userId: ctx.user.id });
    if (!input.permission) return { shown: false as const, spoken: "Of course. I will keep them for you and ask again another time." };
    return { shown: true as const, questions: picked, spoken: revealScript(picked) };
  }),

  /** Step 3: anything the client adds goes into the profile (the assessment's notes), sealed as a fact. */
  disclose: protectedProcedure.input(z.object({ text: z.string().min(1).max(4000) })).mutation(async ({ ctx, input }) => {
    const stored = await getFactFinderForUser(ctx.user.id);
    if (!stored) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Start the Financial Assessment first so there is a profile to add to" });
    const data = stored.data;
    const docs = { ...(data.sections?.documents ?? {}) };
    const stamp = new Date().toISOString().slice(0, 10);
    docs.notes = `${docs.notes ? `${docs.notes}\n\n` : ""}[${stamp}, added while answering the unasked questions] ${input.text.trim()}`;
    const next: ClientFactFinder = { ...data, sections: { ...data.sections, documents: docs } };
    await saveFactFinderForUser(ctx.user.id, next);
    await recordEvent({ kind: "fact", source: "client", key: "assessment.documents.notes", label: "Client added to their profile", value: { text: input.text.trim().slice(0, 2000) }, summary: `Added ${input.text.trim().length} characters to the profile while answering the unasked questions`, actorName: ctx.user.name ?? null, userId: ctx.user.id });
    return { ok: true, spoken: "Thank you. That is in your profile now, and every answer on this site will use it." };
  }),

  /** Step 4: the client permits the answers; each is answered from the profile and the engines, sealed as advice. */
  answer: protectedProcedure.input(z.object({ questionIds: z.array(z.string().max(60)).min(1).max(10), permission: z.boolean() })).mutation(async ({ ctx, input }) => {
    const { stored, candidates, inflation, pHigher30 } = await context(ctx.user.id);
    const qs = input.questionIds.map((id) => candidates.find((c) => c.id === id)).filter((q): q is UnaskedQuestion => Boolean(q));
    await recordEvent({ kind: "consent", source: "client", key: "unasked.answer", label: input.permission ? "Client permitted the answers" : "Client declined the answers", value: { permission: input.permission, questionIds: qs.map((q) => q.id) }, summary: input.permission ? `Permitted answers to ${qs.length} unasked questions` : "Declined the answers for now", actorName: ctx.user.name ?? null, userId: ctx.user.id });
    if (!input.permission) return { answered: false as const, spoken: "Understood. They are on your page whenever you want them answered.", answers: [] as Array<{ id: string; answer: string; via: string }> };
    const team = configuredProviders();
    const summary = stored ? factFinderSummary(stored.data) : "No assessment on file.";
    const answers: Array<{ id: string; answer: string; via: string }> = [];
    for (const q of qs) {
      const deterministic = `${q.why} ${q.scale > 0 ? `Scale for you: about ${q.scale.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} — ${q.scaleNote}.` : q.scaleNote} The page that works it through for your numbers is ${q.path}.${q.needs?.length ? ` It would sharpen with: ${q.needs.join(", ")}.` : ""}`;
      let answer = deterministic, via = "offline";
      if (team.length) {
        try {
          const lead = await leadModel(ADVISOR_SYSTEM + " You are the Financial Librarian: one calm voice for the whole AI team. Answer from the client's own facts only; never invent a figure; under 160 words; end by naming the page.", `CLIENT PROFILE:\n${summary}\n\nContext from the engines: inflation ${(inflation * 100).toFixed(1)}% a year (20-year CPI), odds federal rates are higher in 30 years ${Math.round(pHigher30 * 100)}%.\n\nThe question the client has not asked: "${q.question}"\nWhy it matters (platform): ${q.why}\nScale (platform): ${q.scaleNote}\nPage: ${q.path}\n\nAnswer it for this client.`);
          if (lead?.text) { answer = lead.text.slice(0, 1600); via = lead.via; }
        } catch { /* deterministic stands */ }
      }
      answers.push({ id: q.id, answer, via });
      void recordAdvice({ userId: ctx.user.id }, { question: q.question, answer, via, voices: via === "offline" ? [] : [via], dataUsed: stored ? factsUsed(stored.data) : [], assumptions: ["Answers are projections under the client's stated facts; engine figures carry their own as-of dates."], rulesApplied: ["unasked-questions", "ADVISOR_SYSTEM"] }, { actorName: "Financial Librarian" }).catch(() => undefined);
    }
    return { answered: true as const, answers, spoken: `Here is what I can tell you. ${answers.map((a, i) => `${i + 1}. ${a.answer}`).join(" ")}` };
  }),
});
