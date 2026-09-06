// ============================================================
// THE FINANCIAL LIBRARIAN — the AI advisory team as ONE voice.
//
// Gate: it will not answer a planning question until the signed-in user's
// Financial Assessment is complete. Once it is, the client may ask as many
// questions as they like; the librarian answers each one, and on request
// distils everything asked into 3–5 core questions, names the emergent
// question they have not asked, and composes a 10–15 page journey through
// the site (calculators included) that answers them in a logical sequence.
//
// The deterministic journey engine (shared/journeyEngine.ts) always produces
// the journey; the AI team only polishes wording and is validated against the
// catalog. No figures are ever invented: every number the librarian cites
// comes from the client's own assessment.
// ============================================================
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { ADVISOR_SYSTEM, configuredProviders, leadModel } from "./ultraAI";
import { getFactFinderForUser, getLatestJourneyForUser, markJourneyStepVisited, saveJourneyForUser } from "./factFinderDb";
import { factFinderCompleteness, factFinderSummary, type ClientFactFinder } from "@shared/clientFactFinder";
import { JOURNEY_CATALOG } from "@shared/journeyCatalog";
import { buildJourney, factFinderSignals, fmtMoney, validateJourney, type Journey } from "@shared/journeyEngine";

const LIBRARIAN_RULES =
  " You are the Financial Librarian of Russell Capital Systems: one calm, warm voice that speaks for a team of AI models. " +
  "You are talking to a client (or their advisor) inside a private portal, and you have their complete Financial Assessment, " +
  "so you may refer to their own figures. Everything you say is education and projection under stated assumptions — never a " +
  "guarantee, never a product solicitation, never individualized tax or legal advice; the licensed Russell Capital Systems " +
  "advisor and the tax professional team review every strategy for suitability and IRS compliance before anything is implemented. " +
  "Do not invent facts that are not in the assessment. Speak plainly, as if reading aloud, in under 200 words. " +
  "When a page on the site answers part of the question, name it (the catalog is provided) so the client can click through.";

function catalogText(): string {
  return JOURNEY_CATALOG.map((p) => `- ${p.title} (${p.path}): ${p.purpose}`).join("\n");
}

async function loadAssessment(userId: number) {
  const stored = await getFactFinderForUser(userId);
  const completeness = factFinderCompleteness(stored?.data);
  const missingSections = Array.from(new Set(completeness.missing.map((m) => m.section))).slice(0, 6);
  return { stored, completeness, missingSections };
}

function gateMessage(percent: number, missingSections: string[]): string {
  const where = missingSections.length ? ` The sections still open are ${missingSections.join(", ")}.` : "";
  return `Before I can advise you I need the full picture — that is what makes the advice worth having. Your Financial Assessment is ${percent}% complete.${where} Finish it and ask me again; I'll be here.`;
}

/** Deterministic answer when no AI provider is configured: restate the relevant facts, point to the pages. */
function offlineAnswer(question: string, data: ClientFactFinder, journeyHint: Journey): string {
  const s = (id: string) => data.sections?.[id] ?? {};
  const inc = s("income"), tax = s("taxes"), re = s("realEstate"), debt = s("debts"), inv = s("investments"), goals = s("goals");
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  const income = n(inc.w2Income) + n(inc.bonusIncome) + n(inc.contractorIncome) + n(inc.practiceDistributions) + n(inc.spouseIncome);
  const facts: string[] = [];
  if (income) facts.push(`household income of about ${fmtMoney(income)}`);
  if (n(tax.federalTaxPaid)) facts.push(`federal tax of ${fmtMoney(n(tax.federalTaxPaid))} last year`);
  if (n(re.primaryMortgageBalance)) facts.push(`a mortgage balance of ${fmtMoney(n(re.primaryMortgageBalance))}`);
  if (n(re.homeEquity)) facts.push(`${fmtMoney(n(re.homeEquity))} of home equity`);
  if (n(debt.studentLoanBalance)) facts.push(`student loans of ${fmtMoney(n(debt.studentLoanBalance))}`);
  const investable = n(inv.taxableBrokerage) + n(inv.employerPlanBalance) + n(inv.traditionalIra) + n(inv.rothIra) + n(inv.roth401k);
  if (investable) facts.push(`about ${fmtMoney(investable)} in investment and retirement accounts`);
  const top = typeof goals.topGoals === "string" ? goals.topGoals.split(/\n|;/)[0]?.trim() : "";
  const pages = journeyHint.steps.slice(0, 3).map((st) => `${st.title} (${st.path})`).join(", ");
  return (
    `The AI advisory team is not switched on for this installation yet, so here is what I can say from your assessment alone. ` +
    `You asked: "${question}". Your file shows ${facts.length ? facts.join(", ") : "the details you entered"}` +
    `${top ? `, and your first stated goal is "${top}"` : ""}. ` +
    `The pages that answer this best, in order, are ${pages}. ` +
    `Everything here is education, not advice; your Russell Capital Systems advisor and the tax professional team confirm suitability before anything is implemented.`
  );
}

export const librarianRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const { stored, completeness, missingSections } = await loadAssessment(ctx.user.id);
    const team = configuredProviders();
    return {
      complete: completeness.complete,
      percent: completeness.percent,
      missingCount: completeness.missing.length,
      missingSections,
      completedAt: stored?.completedAt ?? null,
      configured: team.length > 0,
      contributorCount: team.length,
      contributors: team.map((p) => p.label),
      voiceConfigured: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID),
    };
  }),

  /** Answer one question. Unlimited questions are welcome once the assessment is complete. */
  ask: protectedProcedure
    .input(z.object({
      question: z.string().min(1).max(2000),
      history: z.array(z.object({ role: z.enum(["user", "librarian"]), text: z.string().max(2000) })).max(12).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { stored, completeness, missingSections } = await loadAssessment(ctx.user.id);
      if (!stored || !completeness.complete) {
        return { gated: true as const, percent: completeness.percent, missingSections, spoken: gateMessage(completeness.percent, missingSections), answer: null, contributors: [] as string[], contributorCount: 0 };
      }
      const data = stored.data;
      const team = configuredProviders();
      const hint = buildJourney([...input.history.filter((h) => h.role === "user").map((h) => h.text), input.question], data);
      if (team.length === 0) {
        const answer = offlineAnswer(input.question, data, hint);
        return { gated: false as const, answer, spoken: answer, contributors: [] as string[], contributorCount: 0, percent: 100, missingSections: [] as string[] };
      }
      const system = ADVISOR_SYSTEM + LIBRARIAN_RULES;
      const history = input.history.slice(-6).map((h) => `${h.role === "user" ? "Client" : "Librarian"}: ${h.text}`).join("\n");
      const userMsg =
        `CLIENT FACT FINDER (complete):\n${factFinderSummary(data)}\n\n` +
        `SITE PAGES YOU MAY POINT TO:\n${catalogText()}\n\n` +
        (history ? `RECENT CONVERSATION:\n${history}\n\n` : "") +
        `The client asks: "${input.question}"\n\nAnswer per your rules, for speech, under 200 words.`;
      const results = await Promise.all(team.map(async (p) => {
        try { return { label: p.label, ok: true as const, text: await p.call(process.env[p.envKey]!, system, userMsg) }; }
        catch (e) { return { label: p.label, ok: false as const, text: String(e).slice(0, 80) }; }
      }));
      const ok = results.filter((r) => r.ok);
      let answer: string | null = null;
      if (ok.length > 1) {
        const lead = await leadModel(system, `${ok.length} advisors answered the same client question. Synthesize ONE answer in the librarian's voice, under 200 words, keeping only claims supported by the fact finder.\n\nQuestion: "${input.question}"\n\n${ok.map((r) => `--- ${r.label} ---\n${r.text}`).join("\n\n")}`);
        answer = lead?.text ?? null;
      }
      answer = answer ?? ok[0]?.text ?? offlineAnswer(input.question, data, hint);
      return { gated: false as const, answer, spoken: answer, contributors: ok.map((r) => r.label), contributorCount: ok.length, percent: 100, missingSections: [] as string[] };
    }),

  /** Distil everything asked into 3–5 core questions + the emergent question, and compose the journey. */
  journey: protectedProcedure
    .input(z.object({ questions: z.array(z.string().min(1).max(2000)).min(1).max(40) }))
    .mutation(async ({ ctx, input }) => {
      const { stored, completeness, missingSections } = await loadAssessment(ctx.user.id);
      if (!stored || !completeness.complete) {
        return { gated: true as const, percent: completeness.percent, missingSections, spoken: gateMessage(completeness.percent, missingSections), journey: null };
      }
      const data = stored.data;
      let journey = buildJourney(input.questions, data);
      const signals = factFinderSignals(data);

      // Let the AI team polish the wording of the questions and the "why" of
      // each step — never the pages themselves.
      const team = configuredProviders();
      if (team.length > 0) {
        try {
          const polished = await leadModel(
            ADVISOR_SYSTEM + LIBRARIAN_RULES + " Reply with JSON only.",
            `The client asked these questions:\n${input.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\n` +
            `Their assessment signals: ${signals.slice(0, 8).map((s) => `${s.tag} (${s.reason})`).join("; ")}\n\n` +
            `The journey engine proposes:\n${JSON.stringify({ coreQuestions: journey.coreQuestions, emergentQuestion: journey.emergentQuestion, steps: journey.steps.map((s) => ({ id: s.id, title: s.title, why: s.why })) }, null, 1)}\n\n` +
            `Rewrite ONLY the wording: make each core question sound like this client (keep 3–5 of them, same order, same meaning), ` +
            `make the emergent question land (one or two sentences, referencing their actual facts), and make each step's "why" one warm sentence that connects it to the previous step. ` +
            `Keep every step id exactly as given, same order. Return JSON: {"coreQuestions":[...],"emergentQuestion":"...","steps":[{"id":"...","why":"..."}]}`,
          );
          const raw = polished?.text?.match(/\{[\s\S]*\}/)?.[0];
          if (raw) {
            const p = JSON.parse(raw) as { coreQuestions?: string[]; emergentQuestion?: string; steps?: Array<{ id: string; why: string }> };
            const candidate: Journey = {
              coreQuestions: Array.isArray(p.coreQuestions) && p.coreQuestions.length ? p.coreQuestions.map(String).slice(0, 5) : journey.coreQuestions,
              emergentQuestion: typeof p.emergentQuestion === "string" && p.emergentQuestion.length > 20 ? p.emergentQuestion : journey.emergentQuestion,
              steps: journey.steps.map((s) => ({ ...s, why: p.steps?.find((x) => x.id === s.id)?.why?.slice(0, 400) || s.why })),
              controls: journey.controls,
              generatedBy: `journey-engine + ${polished?.via ?? "ai"}`,
            };
            if (validateJourney(candidate).ok) journey = candidate;
          }
        } catch { /* keep the deterministic journey */ }
      }

      const check = validateJourney(journey);
      if (!check.ok) throw new Error(`journey failed validation: ${check.problems.join("; ")}`);
      const id = await saveJourneyForUser(ctx.user.id, input.questions, {
        coreQuestions: journey.coreQuestions,
        emergentQuestion: journey.emergentQuestion,
        steps: journey.steps.map((s) => ({ id: s.id, path: s.path, title: s.title, why: s.why, guide: s.guide, kind: s.kind })),
        controls: journey.controls,
        generatedBy: journey.generatedBy,
      });
      const spoken =
        `I've read everything you asked and everything in your assessment. It comes down to ${journey.coreQuestions.length} questions. ` +
        journey.coreQuestions.map((q, i) => `${i + 1}: ${q}`).join(" ") +
        ` And one you haven't asked yet: ${journey.emergentQuestion} ` +
        `I've laid out ${journey.steps.length} pages in order — start with ${journey.steps[0]!.title} and each one builds on the last. ` +
        `Along the way you control ${journey.controls.youControl.length} variables; the rest the plan is built to survive.`;
      return { gated: false as const, journey, journeyId: id, spoken };
    }),

  latestJourney: protectedProcedure.query(async ({ ctx }) => getLatestJourneyForUser(ctx.user.id)),

  /** The client opened a journey page: record it so progress carries across devices. */
  markVisited: protectedProcedure
    .input(z.object({ journeyId: z.number().int().positive(), stepId: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const journey = await markJourneyStepVisited(ctx.user.id, input.journeyId, input.stepId);
      return { ok: Boolean(journey), visited: journey ? journey.steps.filter((s) => s.visitedAt).length : 0, total: journey?.steps.length ?? 0 };
    }),
});
