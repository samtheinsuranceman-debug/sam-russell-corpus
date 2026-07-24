import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { sendEmail, resultEmailHtml, dailyCheckinEmailHtml } from "./platform/email";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  addToWaitlist, getWaitlistCount,
  createAssessment, getAssessmentById, getLatestAssessment, updateAssessmentStatus,
  incrementCompletedQuestions, saveResponse, getResponsesByAssessment,
  saveScores, getScoresByAssessment, savePowerCombinations, getPowerCombinationsByAssessment,
  saveCompanion,
  validatePromoCode, incrementPromoCodeUsage, createPromoCode, getAllPromoCodes,
  saveEvidence, getEvidenceByAssessment,
  getAllUsers, getAllAssessments, getAdminStats,
  getAllEvidence, updateEvidenceStatus,
  updateUserRole, updateUserTier, togglePromoCode,
  getInfluencerStatsByCode,
  addToLeaderboard, getLeaderboard, toggleLeaderboardVisibility, getUserLeaderboardEntry,
  createChallengeInvite, getChallengeByToken, acceptChallenge, getChallengesBySender,
  getUserComparison,
  saveNlpProfile, getNlpProfile,
  saveCoachingLetter, getCoachingLetters, markLetterRead,
  getNetworkCandidates,
} from "./db";
import { storagePut, storageGetSignedUrl } from "./platform/storage";
import { runPanel, panelSize, panelDevelopers } from "./platform/panel";
import { consensusScores } from "./scoring/consensus";
import { verifyClaim } from "./platform/verify";
import { fetchLiveCitations } from "./platform/liveResearch";
import { generateOutcomeReport } from "./coaching";
import { invokeLLM } from "./platform/llm";
import type { InvokeParams } from "./platform/llm";
import { generateSocialCardSVG } from "./socialCard";
import { transcribeAudio } from "./platform/transcribe";
import {
  buildIndex, searchCorpus, getCorpusStats, isCorpusReady,
  logEvaluation, getEvaluationReport,
  corpusSearchInput, evaluationLogInput,
  type CorpusChunk,
} from "./corpus";
import { z } from "zod";
import { rankMatches, type MatchMode, type Profile } from "@shared/matchEngine";
import { runVideoAnalysis } from "./videoAnalysis";
import { createVideoAssessment, getVideoAssessment, getUserVideoAssessments, updateVideoAssessmentStatus } from "./db";
import { ALL_AXES, RARITY_AXES, axisFeedsRarity, axisMode, MODE_META } from "@shared/axisModes";
import { cohortAdjustedScore, generationForBirthYear, type Generation } from "@shared/cohort";
import { scoreToRarity as normingScoreToRarity, ACTIVE_NORMING_VERSION } from "./scoring/norming";
import { platformStatus, BETA_ACCESS_CODE, BETA_MAX_REDEMPTIONS, FREE_ACCESS_CODE, FREE_ASSESSMENT_CAP, voiceConsensus, freePanelMax, sttProvider } from "./platform/config";
import {
  recordEvent, getAnalyticsEventsSince, getSubscriptionEvents,
  addMarketingSpend, getMarketingSpendSince,
  countBetaRedemptions, grantBetaAccess, getUserById, upsertUser,
  saveTestimonial, getApprovedTestimonials,
  countFreeUsers, getUserByOpenId,
  getCommitmentByUser, getCurrentSignedCommitment, getCommitmentHistory,
  saveCommitmentDraft, signCommitment, startNewCommitment,
  updateCommitmentReminder, getActiveReminderCommitments,
} from "./db";
import { sendSms, dailyCheckinSms } from "./platform/sms";
import { CRON_SECRET } from "./platform/config";
import { COMMITMENT_QUESTIONS, commitmentReady, answersByKey, shouldSendCheckinNow, DAILY_CHECKIN_HOUR, type CommitmentAnswer } from "@shared/commitment";
import { extractGoalsText } from "@shared/goalsQuestions";
import { createTrackerCycle, getTrackerCyclesByUser, setTrackerReminderOptIn, getTrackerReminderOptIn } from "./db";
import { analyzeJournal } from "./trackerAnalysis";
import { buildTrackerMarkdown } from "@shared/behavioralTracker";
import { buildProjections } from "@shared/keystonePractices";
import {
  funnelMetrics, pipelineHealth, cac, retention, goNoGo, FUNNEL_STAGES,
} from "./analytics/metrics";

// The 32-line model is defined once, in shared/axisModes.ts. Never hard-code a count here.
const AXIS_LABELS = ALL_AXES;

// ============================================================
// RARITY CALCULATION ENGINE
// Based on Spiral Dynamics population distribution research
// ============================================================

/**
 * Maps a 0.0-1.0 axis score to a rarity value (1 in X people).
 *
 * Delegates to the ACTIVE versioned norming snapshot (server/scoring/norming.ts)
 * so the curve is defined once and every historical assessment stays
 * reproducible. v1 is the theoretical Spiral-Dynamics population curve:
 *   Blue ~40% → 1-3 · Orange ~30% → 3-10 · Green ~10% → 10-100 ·
 *   Yellow ~1% → 100-1,000 · Turquoise ~0.1% → 1,000-10,000 · Coral → 10,000-100,000.
 */
export function scoreToRarity(score: number, normingVersion: string = ACTIVE_NORMING_VERSION): number {
  return normingScoreToRarity(score, normingVersion);
}

/**
 * Calculate composite rarity from the rarity-eligible lines only.
 *
 * The rarity number is computed ONLY from RARITY_AXES (the 28 lines that feed
 * rarity). Stance lines (feedsRarity: false) are developmental capacities graded
 * by stage — they appear in the profile but NEVER inflate the 1-in-X number.
 * A score carrying a stance axisName is dropped here; scores without an axisName
 * are kept (the mode is unknown, so we can't exclude them).
 *
 * Uses GEOMETRIC MEAN of individual axis rarities (not product,
 * which would be too extreme, and not arithmetic mean, which would
 * be too forgiving).
 *
 * The geometric mean naturally rewards consistent high performance
 * across axes while not being as extreme as multiplication.
 *
 * Weighted by confidence: low-confidence scores contribute less.
 *
 * Final result is capped at 1,000,000 (the "out of a million" framing).
 */
export function calculateCompositeRarity(
  scores: Array<{ score: number; confidence: number; axisIndex?: number; axisName?: string }>
): number {
  if (!scores || scores.length === 0) return 1;

  // Only rarity-eligible lines feed the composite; stance lines never do.
  const rarityScores = scores.filter(s => !s.axisName || axisFeedsRarity(s.axisName));
  if (rarityScores.length === 0) return 1;

  // Calculate per-axis rarity, weighted by confidence
  const axisRarities = rarityScores.map(s => {
    const rawRarity = scoreToRarity(s.score);
    // Weight by confidence: low confidence pulls rarity toward 1 (common)
    // Apply 0.7 LLM overconfidence discount — LLMs are notoriously overconfident
    // on subjective assessments, so we deflate their confidence by 30%
    const rawConfidence = Math.max(0.1, Math.min(1, s.confidence || 0.5));
    const confidence = rawConfidence * 0.7;
    // Blend between rarity=1 (no info) and actual rarity based on confidence
    return 1 + (rawRarity - 1) * confidence;
  });

  // Geometric mean of all axis rarities
  const logSum = axisRarities.reduce((sum, r) => sum + Math.log(Math.max(1, r)), 0);
  const geometricMean = Math.exp(logSum / axisRarities.length);

  // Round to integer and cap at 1,000,000
  const finalRarity = Math.max(1, Math.min(1_000_000, Math.round(geometricMean)));

  return finalRarity;
}

/**
 * Cohort rarity — the same composite, scored against the user's OWN generation.
 * Developmental lines are age-adjusted (see @shared/cohort) so time-to-compound
 * doesn't decide rank; age-normed CHC lines are left untouched. Returns null
 * when no birth year is on file.
 */
export function computeCohortRarity(
  scoresList: Array<{ axisName: string; score: number; confidence?: number | null }>,
  birthYear: number | null | undefined,
): { cohortRarity: number; generation: Generation } | null {
  if (!birthYear) return null;
  const age = Math.max(10, new Date().getFullYear() - birthYear);
  const adjusted = scoresList
    .filter((s) => axisFeedsRarity(s.axisName))
    .map((s) => ({
      score: cohortAdjustedScore(s.score, s.axisName, age),
      confidence: s.confidence ?? 0.5,
      axisName: s.axisName,
    }));
  if (adjusted.length === 0) return null;
  return {
    cohortRarity: calculateCompositeRarity(adjusted),
    generation: generationForBirthYear(birthYear),
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  waitlist: router({
    join: publicProcedure
      .input(z.object({ email: z.string().email(), tier: z.string().optional() }))
      .mutation(async ({ input }) => {
        const result = await addToWaitlist(input.email, input.tier);
        if (!result) return { success: false, message: "Failed to join waitlist" };
        return { success: true, message: "You're on the list!" };
      }),
    count: publicProcedure.query(async () => {
      return { count: await getWaitlistCount() };
    }),
  }),

  // ============================================================
  // ASSESSMENT PROCEDURES
  // ============================================================
  assessment: router({
    // Start a new assessment
    start: protectedProcedure
      .input(z.object({
        promoCode: z.string().optional(),
        birthYear: z.number().int().min(1920).max(2100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate promo code if provided
        if (input.promoCode) {
          const promo = await validatePromoCode(input.promoCode);
          if (!promo) return { success: false, error: "Invalid or expired promo code" };
        }
        const result = await createAssessment(ctx.user.id, input.promoCode, input.birthYear ?? null);
        if (!result) return { success: false, error: "Failed to create assessment" };
        // Increment promo code usage
        if (input.promoCode) await incrementPromoCodeUsage(input.promoCode);
        await recordEvent({ type: "assessment_start", userId: ctx.user.id });
        return { success: true, assessmentId: result.id };
      }),

    // Get current assessment status
    current: protectedProcedure.query(async ({ ctx }) => {
      const assessment = await getLatestAssessment(ctx.user.id);
      if (!assessment) return null;
      const scoresList = await getScoresByAssessment(assessment.id);
      const combos = await getPowerCombinationsByAssessment(assessment.id);
      const cohort = computeCohortRarity(scoresList as any, (assessment as any).birthYear);
      return {
        ...assessment,
        scores: scoresList,
        powerCombinations: combos,
        cohortRarity: cohort?.cohortRarity ?? null,
        generation: cohort?.generation ?? null,
      };
    }),

    // Get assessment by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const assessment = await getAssessmentById(input.id);
        if (!assessment) return null;
        const scoresList = await getScoresByAssessment(assessment.id);
        const combos = await getPowerCombinationsByAssessment(assessment.id);
        const responsesList = await getResponsesByAssessment(assessment.id);
        return { ...assessment, scores: scoresList, powerCombinations: combos, responses: responsesList };
      }),

    // Upload audio response
    uploadResponse: protectedProcedure
      .input(z.object({
        assessmentId: z.number(),
        questionIndex: z.number().min(0).max(23),
        audioBase64: z.string(),
        durationMs: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 audio
        const audioBuffer = Buffer.from(input.audioBase64, "base64");

        // Upload to S3
        const fileKey = `assessments/${ctx.user.id}/${input.assessmentId}/q${input.questionIndex}.webm`;
        const { key, url } = await storagePut(fileKey, audioBuffer, "audio/webm");

        // Save response record
        const response = await saveResponse({
          assessmentId: input.assessmentId,
          questionIndex: input.questionIndex,
          audioUrl: url,
          audioKey: key,
          durationMs: input.durationMs,
        });

        // Increment completed questions
        await incrementCompletedQuestions(input.assessmentId);

        return { success: true, responseId: response?.id, audioUrl: url };
      }),

    // Submit a text response (for text-mode assessment)
    submitTextResponse: protectedProcedure
      .input(z.object({
        assessmentId: z.number(),
        questionIndex: z.number().min(0).max(23),
        text: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await saveResponse({
          assessmentId: input.assessmentId,
          questionIndex: input.questionIndex,
          transcript: input.text,
        });
        await incrementCompletedQuestions(input.assessmentId);
        return { success: true, responseId: response?.id };
      }),

    // Companion mode: persist the informant's read (separate channel, never scored as the member).
    saveCompanion: protectedProcedure
      .input(z.object({
        assessmentId: z.number(),
        relation: z.string().max(48),
        vector: z.array(z.number()).min(1).max(64),
        answered: z.number().min(0).max(64),
      }))
      .mutation(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment || assessment.userId !== ctx.user.id) {
          return { success: false };
        }
        await saveCompanion(input.assessmentId, {
          relation: input.relation,
          vector: input.vector.map((v) => (Number.isFinite(v) ? v : 0)),
          answered: input.answered,
        });
        return { success: true };
      }),

    // Trigger AI analysis for the full assessment
    analyze: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) return { success: false, error: "Assessment not found" };

        // Mark as processing
        await updateAssessmentStatus(input.assessmentId, "processing");

        try {
          // Get all responses
          const responsesList = await getResponsesByAssessment(input.assessmentId);

          // Transcribe any responses that don't have transcripts yet
          for (const resp of responsesList) {
            if (!resp.transcript && resp.audioUrl) {
              const sttStart = Date.now();
              try {
                const transcription = await transcribeAudio({ audioUrl: resp.audioUrl }) as any;
                await recordEvent({ type: "score_stt", userId: assessment.userId, numericValue: Date.now() - sttStart, ok: !!transcription?.text });
                if (transcription?.text) {
                  resp.transcript = transcription.text;
                }
              } catch (e) {
                await recordEvent({ type: "score_stt", userId: assessment.userId, numericValue: Date.now() - sttStart, ok: false });
                console.error(`Failed to transcribe response ${resp.id}:`, e);
              }
            }
          }

          // ============================================================
          // BULLSHIT DETECTION — Response quality checks
          // ============================================================
          const transcripts = responsesList.filter(r => r.transcript).map(r => r.transcript as string);
          const totalWordCount = transcripts.reduce((sum, t) => sum + t.split(/\s+/).filter(w => w.length > 0).length, 0);
          const totalResponses = transcripts.length;
          const avgWordsPerResponse = totalResponses > 0 ? totalWordCount / totalResponses : 0;

          // Determine score ceiling based on response quality
          // These caps prevent low-effort answers from producing high scores
          // Logic flows from WORST to BEST effort, all using avg words per response
          let scoreCeiling = 1.0; // No cap by default
          let qualityFlag = "normal";

          if (totalResponses === 0 || totalWordCount < 10) {
            // Said virtually nothing — cap at Red level
            scoreCeiling = 0.20;
            qualityFlag = "no_effort";
          } else if (avgWordsPerResponse < 5) {
            // One-word or tiny answers — cap at Blue level
            scoreCeiling = 0.30;
            qualityFlag = "minimal_effort";
          } else if (avgWordsPerResponse < 15) {
            // Brief answers — cap at Orange level
            scoreCeiling = 0.45;
            qualityFlag = "low_effort";
          } else if (avgWordsPerResponse < 30) {
            // Short but present answers — cap at low Green level
            scoreCeiling = 0.55;
            qualityFlag = "brief_responses";
          } else if (avgWordsPerResponse < 60) {
            // Moderate responses — cap at mid-Green level
            scoreCeiling = 0.65;
            qualityFlag = "moderate_responses";
          } else if (avgWordsPerResponse < 100) {
            // Substantial responses — cap at Green/Yellow boundary
            scoreCeiling = 0.72;
            qualityFlag = "substantial_responses";
          }
          // avgWordsPerResponse >= 100 → no cap, allow full range (Yellow/Turquoise/Coral possible)

          // Build the analysis prompt
          const transcriptsText = responsesList
            .filter(r => r.transcript)
            .map(r => `Question ${r.questionIndex + 1}: ${r.transcript}`)
            .join("\n\n");

          // ============================================================
          // LLM SCORING — Calibrated to Spiral Dynamics developmental stages
          // ============================================================
          const analysisPrompt = `You are a developmental psychology expert trained in Spiral Dynamics, Ken Wilber's AQAL framework, and psychometric assessment. Your job is to honestly assess the developmental altitude demonstrated in these voice responses.

CRITICAL CALIBRATION RULES:
- Score 0.0-0.3 = Blue/conventional thinking (rule-following, black-and-white, authority-based). This is where ~40% of the global population operates.
- Score 0.3-0.5 = Orange/rational-achievement thinking (strategic, merit-based, goal-oriented). This is where ~30% of the global population operates. Most successful professionals are here.
- Score 0.5-0.7 = Green/pluralistic thinking (multiple perspectives, sensitivity to context, deconstructive awareness). Only ~10% of the population operates here consistently.
- Score 0.7-0.85 = Yellow/integrative thinking (systems thinking, paradox tolerance, flexible adaptation across contexts, meta-awareness of one's own cognition). Only ~1% of the population operates here.
- Score 0.85-0.95 = Turquoise/holistic thinking (universal perspective, seamless integration of all prior stages, communal wholeness, healing fragmentation, perceiving the world as alive and evolving). Only ~0.1% of the population operates here.
- Score 0.95-1.0 = Coral/Third-Tier thinking (radical dis-identification from ego, individualistic consciousness asserting itself at a cosmic level, direct awareness of awareness itself, holding multiple identity frames simultaneously, operating from beyond-mind knowing). This is the emerging edge — fewer than 0.01% of the population. Requires evidence of transpersonal insight combined with grounded, embodied action. NOT mere spiritual talk or philosophical abstraction — must show lived integration of paradox at the identity level.

IMPORTANT: Most people — even smart, successful people — demonstrate Orange-level thinking (0.3-0.5). A score of 0.6+ should require CLEAR EVIDENCE of perspective-taking beyond personal achievement. A score of 0.8+ should require EXTRAORDINARY demonstration of integrative, systems-level awareness. A score of 0.95+ (Coral) should be almost never given — it requires unmistakable evidence of transpersonal development: dis-identification from the separate self, cosmocentric compassion, effortless holding of paradox at the identity level, and grounded embodiment (not just lofty talk).

Do NOT inflate scores to be nice. Be rigorous and honest. Short, vague, or cliché answers should score LOW (0.2-0.4). Only genuinely sophisticated, multi-perspectival, self-aware responses deserve high scores.

For each of the ${ALL_AXES.length} lines below, provide:
- A score from 0.0 to 1.0 (calibrated to the developmental stages above)
- A confidence level (0.0-1.0) — lower if the response doesn't clearly address this line
- Brief reasoning explaining what developmental stage the response demonstrates for this line

Note: the four stance lines (${RARITY_AXES.length < ALL_AXES.length ? ALL_AXES.filter(a => !axisFeedsRarity(a)).join(", ") : ""}) are developmental stances, not rarity traits — score them honestly, but they are reported as a Spiral-Dynamics stage band and never contribute to the rarity number.

Lines: ${ALL_AXES.join(", ")}

Responses:
${transcriptsText}

Also identify 1-3 "Power Combinations" — intersections of axes where the person demonstrates unusual integration. Only identify these if there is genuine evidence of cross-domain integration in the responses. If responses are generic or brief, return an empty array for powerCombinations.

Respond in JSON format.`;

          const llmStart = Date.now();
          const invokeParams: InvokeParams = {
            messages: [
              { role: "system" as const, content: "You are a rigorous developmental psychologist. You score conservatively and honestly. You never inflate scores. Most people score in the 0.3-0.5 range. Only extraordinary responses get above 0.7. Always respond with valid JSON." },
              { role: "user" as const, content: analysisPrompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "assessment_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    scores: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          axisIndex: { type: "integer" },
                          axisName: { type: "string" },
                          score: { type: "number" },
                          confidence: { type: "number" },
                          reasoning: { type: "string" },
                        },
                        required: ["axisIndex", "axisName", "score", "confidence", "reasoning"],
                        additionalProperties: false,
                      },
                    },
                    powerCombinations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          description: { type: "string" },
                          axes: { type: "array", items: { type: "integer" } },
                          rarityMultiplier: { type: "number" },
                        },
                        required: ["name", "description", "axes", "rarityMultiplier"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["scores", "powerCombinations"],
                  additionalProperties: false,
                },
              },
            },
          };

          // Multi-AI scoring. How many models score depends on the tier:
          //   • PAID  → the FULL panel (every configured model), consensus.
          //   • FREE  → a capped consensus of FREE_PANEL_MAX strong models (default
          //             3) so the free result is genuinely good, not a weak single
          //             pass — unless VOICE_CONSENSUS=false, which forces 1 model.
          //   • 0 configured → deterministic mock (simulated, honestly labeled).
          // Either way the free report keeps ALL the deterministic insight (rarity,
          // effective potential, bottleneck diagnosis, clusters) — this only sets
          // how many AIs cross-check the 32 line scores.
          let analysis: any = null;
          const configuredModels = panelSize(); // enabledPanel(): GPT + any funded members
          const isFree = ctx.user.membershipTier === "free";
          const modelsToUse = isFree
            ? (voiceConsensus() ? Math.min(freePanelMax(), configuredModels) : 1)
            : configuredModels;
          const usePanel = configuredModels >= 1 && modelsToUse >= 1;
          if (usePanel) {
            const panelResults = await runPanel(invokeParams, isFree ? modelsToUse : 0);
            const parsed = panelResults
              .map((r) => {
                try { return JSON.parse((r.result.choices?.[0]?.message?.content as string) ?? ""); }
                catch { return null; }
              })
              .filter((p) => p && Array.isArray(p.scores));
            // 1 model → solo scores; 2+ → trimmed-mean consensus (both via consensusScores).
            if (parsed.length >= 1) {
              analysis = {
                scores: consensusScores(parsed.map((p: any) => p.scores)),
                powerCombinations: parsed[0].powerCombinations ?? [],
              };
              await recordEvent({
                type: parsed.length >= 2 ? "score_consensus" : "score_llm",
                userId: assessment.userId,
                numericValue: parsed.length,
                ok: true,
              });
            }
          }

          if (!analysis) {
            const result = await invokeLLM(invokeParams);
            const content = result.choices?.[0]?.message?.content as string | undefined;
            await recordEvent({ type: "score_llm", userId: assessment.userId, numericValue: Date.now() - llmStart, ok: !!content });
            if (!content) throw new Error("No analysis result from LLM");
            analysis = JSON.parse(content);
          }

          // ============================================================
          // APPLY SCORE CEILING — Enforce bullshit detection caps
          // ============================================================
          const cappedScores = analysis.scores.map((s: any) => ({
            ...s,
            score: Math.min(s.score, scoreCeiling),
            // Add quality flag to reasoning if capped
            reasoning: s.score > scoreCeiling
              ? `[Capped from ${s.score.toFixed(2)} due to ${qualityFlag}] ${s.reasoning}`
              : s.reasoning,
          }));

          // ============================================================
          // CALCULATE COMPOSITE RARITY — Mathematical formula based on
          // Spiral Dynamics population distribution
          // ============================================================
          const compositeRarity = calculateCompositeRarity(cappedScores);

          // Save scores (capped)
          await saveScores(input.assessmentId, cappedScores);

          // Save power combinations (only if responses warranted them)
          const validCombos = scoreCeiling < 0.5
            ? [] // Low-effort responses don't get power combinations
            : analysis.powerCombinations || [];
          await savePowerCombinations(input.assessmentId, validCombos);

          // ============================================================
          // NLP PROFILE — Sensory predicate detection (runs in background)
          // ============================================================
          const nlpPromise = (async () => {
            try {
              const nlpResult = await invokeLLM({
                messages: [
                  { role: "system", content: `You are an NLP (Neuro-Linguistic Programming) master practitioner trained by Richard Bandler and John Grinder. Analyze the following transcripts for:
1. Sensory predicates (visual, auditory, kinesthetic, olfactory/gustatory words)
2. Representational system percentages
3. Meta-programs (toward/away, internal/external, options/procedures, big picture/detail, proactive/reactive, matcher/mismatcher, self/other, possibility/necessity)
4. Voice patterns (estimated words per minute, hesitation frequency, confidence)

Return ONLY valid JSON.` },
                  { role: "user", content: `Analyze these voice assessment transcripts for NLP patterns:\n\n${transcriptsText}` },
                ],
                response_format: {
                  type: "json_schema",
                  json_schema: {
                    name: "nlp_analysis",
                    strict: true,
                    schema: {
                      type: "object",
                      properties: {
                        sensoryPredicates: {
                          type: "object",
                          properties: {
                            visual: { type: "array", items: { type: "string" } },
                            auditory: { type: "array", items: { type: "string" } },
                            kinesthetic: { type: "array", items: { type: "string" } },
                            olfactoryGustatory: { type: "array", items: { type: "string" } },
                          },
                          required: ["visual", "auditory", "kinesthetic", "olfactoryGustatory"],
                          additionalProperties: false,
                        },
                        repSystem: {
                          type: "object",
                          properties: {
                            visualPercent: { type: "integer" },
                            auditoryPercent: { type: "integer" },
                            kinestheticPercent: { type: "integer" },
                            olfactoryGustatoryPercent: { type: "integer" },
                            primary: { type: "string" },
                            sequence: { type: "string" },
                          },
                          required: ["visualPercent", "auditoryPercent", "kinestheticPercent", "olfactoryGustatoryPercent", "primary", "sequence"],
                          additionalProperties: false,
                        },
                        metaPrograms: {
                          type: "object",
                          properties: {
                            towardAway: { type: "number" },
                            internalExternal: { type: "number" },
                            optionsProcedures: { type: "number" },
                            bigPictureDetail: { type: "number" },
                            proactiveReactive: { type: "number" },
                            matcherMismatcher: { type: "number" },
                            selfOther: { type: "number" },
                            possibilityNecessity: { type: "number" },
                          },
                          required: ["towardAway", "internalExternal", "optionsProcedures", "bigPictureDetail", "proactiveReactive", "matcherMismatcher", "selfOther", "possibilityNecessity"],
                          additionalProperties: false,
                        },
                        voicePatterns: {
                          type: "object",
                          properties: {
                            wordsPerMinute: { type: "number" },
                            hesitationFrequency: { type: "number" },
                            confidenceScore: { type: "number" },
                          },
                          required: ["wordsPerMinute", "hesitationFrequency", "confidenceScore"],
                          additionalProperties: false,
                        },
                      },
                      required: ["sensoryPredicates", "repSystem", "metaPrograms", "voicePatterns"],
                      additionalProperties: false,
                    },
                  },
                },
              });

              const nlpContent = nlpResult.choices?.[0]?.message?.content as string | undefined;
              if (!nlpContent) return;
              const nlp = JSON.parse(nlpContent);

              const primaryMap: Record<string, "visual" | "auditory" | "kinesthetic" | "olfactory_gustatory"> = {
                visual: "visual", auditory: "auditory", kinesthetic: "kinesthetic",
                olfactoryGustatory: "olfactory_gustatory", olfactory_gustatory: "olfactory_gustatory",
              };

              await saveNlpProfile({
                userId: ctx.user.id,
                assessmentId: input.assessmentId,
                visualPercent: nlp.repSystem.visualPercent,
                auditoryPercent: nlp.repSystem.auditoryPercent,
                kinestheticPercent: nlp.repSystem.kinestheticPercent,
                olfactoryGustatoryPercent: nlp.repSystem.olfactoryGustatoryPercent,
                primaryRepSystem: primaryMap[nlp.repSystem.primary] || "visual",
                repSystemSequence: nlp.repSystem.sequence,
                towardAway: nlp.metaPrograms.towardAway,
                internalExternal: nlp.metaPrograms.internalExternal,
                optionsProcedures: nlp.metaPrograms.optionsProcedures,
                bigPictureDetail: nlp.metaPrograms.bigPictureDetail,
                proactiveReactive: nlp.metaPrograms.proactiveReactive,
                matcherMismatcher: nlp.metaPrograms.matcherMismatcher,
                selfOther: nlp.metaPrograms.selfOther,
                possibilityNecessity: nlp.metaPrograms.possibilityNecessity,
                wordsPerMinute: nlp.voicePatterns.wordsPerMinute,
                hesitationFrequency: nlp.voicePatterns.hesitationFrequency,
                confidenceScore: nlp.voicePatterns.confidenceScore,
                sensoryPredicates: nlp.sensoryPredicates,
              });
            } catch (e) {
              console.error("NLP profile extraction failed (non-blocking):", e);
            }
          })();

          // Await NLP extraction — it's critical for Gold tier features
          await nlpPromise;

          // Update assessment status with calculated rarity
          await updateAssessmentStatus(input.assessmentId, "complete", compositeRarity, ACTIVE_NORMING_VERSION);
          await recordEvent({ type: "assessment_complete", userId: assessment.userId, numericValue: compositeRarity });

          // Email the low-confidence (voice-only) result to the user (best-effort).
          try {
            const u = await getUserById(assessment.userId);
            if (u?.email) {
              const cohort = computeCohortRarity(cappedScores as any, (assessment as any).birthYear);
              const avgConf = cappedScores.length
                ? cappedScores.reduce((a: number, s: any) => a + (s.confidence ?? 0.5), 0) / cappedScores.length
                : 0;
              const tier = avgConf >= 0.62 ? "Moderate" : avgConf >= 0.38 ? "Low–Moderate" : "Low";
              await sendEmail(
                u.email,
                "Your AQAL voice-based result",
                resultEmailHtml({
                  rarity: compositeRarity,
                  cohortRarity: cohort?.cohortRarity ?? null,
                  generation: cohort?.generation ?? null,
                  confidenceTier: tier,
                }),
              );
            }
          } catch (e) {
            console.warn("[email] result send skipped:", e);
          }

          return { success: true, compositeRarity };
        } catch (error) {
          console.error("Assessment analysis failed:", error);
          await updateAssessmentStatus(input.assessmentId, "failed");
          return { success: false, error: "Analysis failed" };
        }
      }),
  }),

  // ============================================================
  // PROMO CODE PROCEDURES
  // ============================================================
  promo: router({
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const promo = await validatePromoCode(input.code);
        if (!promo) return { valid: false };
        return { valid: true, discountPercent: promo.discountPercent, influencerName: promo.influencerName };
      }),

    // Self-serve influencer onboarding: request a promo code
    requestCode: protectedProcedure
      .input(z.object({
        desiredCode: z.string().min(3).max(32).regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Gate: must have completed assessment first
        const latestAssessment = await getLatestAssessment(ctx.user.id);
        if (!latestAssessment || latestAssessment.status !== "complete") {
          return { success: false, error: "Complete your free assessment first to become an influencer" };
        }
        
        // Check if user already has a code
        const { getDb } = await import("./db");
        const { promoCodes } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return { success: false, error: "Database unavailable" };
        
        const existing = await db.select().from(promoCodes).where(eq(promoCodes.influencerEmail, ctx.user.email || ""));
        if (existing.length > 0) return { success: false, error: "You already have a promo code" };
        
        // Check if code is taken
        const taken = await db.select().from(promoCodes).where(eq(promoCodes.code, input.desiredCode.toUpperCase()));
        if (taken.length > 0) return { success: false, error: "This code is already taken" };
        
        // Create the promo code with default 10% discount, 15% commission
        const result = await createPromoCode({
          code: input.desiredCode.toUpperCase(),
          influencerName: ctx.user.name || "Influencer",
          influencerEmail: ctx.user.email || undefined,
          discountPercent: 10,
          commissionPercent: 15,
        });
        if (!result) return { success: false, error: "Failed to create code" };
        return { success: true, code: input.desiredCode.toUpperCase() };
      }),

    // Admin: create promo code
    create: adminProcedure
      .input(z.object({
        code: z.string().min(3).max(32),
        influencerName: z.string(),
        influencerEmail: z.string().email().optional(),
        discountPercent: z.number().min(0).max(100).optional(),
        commissionPercent: z.number().min(0).max(100).optional(),
        maxUses: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createPromoCode(input);
        if (!result) return { success: false };
        return { success: true, id: result.id };
      }),

    // Admin: list all promo codes
    list: adminProcedure.query(async () => {
      return getAllPromoCodes();
    }),
  }),

  // ============================================================
  // EVIDENCE PROCEDURES
  // ============================================================
  evidence: router({
    upload: protectedProcedure
      .input(z.object({
        assessmentId: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        description: z.string().optional(),
        axisTargets: z.array(z.number()).optional(),
        category: z.string().optional(),
        institution: z.string().optional(),
        evidenceDate: z.string().optional(),
        significance: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        const fileKey = `evidence/${ctx.user.id}/${input.assessmentId}/${input.fileName}`;
        const { key, url } = await storagePut(fileKey, fileBuffer, input.fileType);

        const result = await saveEvidence({
          assessmentId: input.assessmentId,
          userId: ctx.user.id,
          fileUrl: url,
          fileKey: key,
          fileName: input.fileName,
          fileType: input.fileType,
          description: input.description,
          axisTargets: input.axisTargets,
          category: input.category,
          institution: input.institution,
          evidenceDate: input.evidenceDate,
          significance: input.significance,
        });

        // High-confidence tier: verify the claim against the public record via
        // Perplexity (best-effort; mock returns "unverified", never a false confirm).
        const claim = [input.institution, input.description, input.significance]
          .filter(Boolean).join(" — ");
        const verification = claim
          ? await verifyClaim(claim).catch(() => null)
          : null;
        if (verification) {
          await recordEvent({ type: "evidence_verified", userId: ctx.user.id, ok: verification.verified });
        }

        return { success: true, evidenceId: result?.id, verification };
      }),

    list: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return getEvidenceByAssessment(input.assessmentId);
      }),
  }),

  // ============================================================
  // ADMIN PROCEDURES
  // ============================================================
  admin: router({
    stats: adminProcedure.query(async () => {
      return getAdminStats();
    }),
    // Scoring trust: which norming snapshot is active + the platform provider status.
    scoringHealth: adminProcedure.query(async () => {
      return {
        normingVersion: ACTIVE_NORMING_VERSION,
        providers: platformStatus(),
      };
    }),
    // Live panel health: ping every configured AI provider and report which ones
    // actually respond. Use this before launch to confirm a real N-model consensus
    // (a key with a wrong base_url/model silently drops from the panel otherwise).
    panelHealth: adminProcedure.mutation(async () => {
      const { panelHealth } = await import("./platform/panel");
      const members = await panelHealth();
      return {
        configured: members.length,
        live: members.filter((m) => m.ok).length,
        members,
      };
    }),
    // Test-retest reliability: score the same transcript N times, report per-axis
    // variance. Real variance requires a live LLM provider; on the mock it returns
    // an empty/stable result. Runs are capped to keep the call bounded.
    scoringReliability: adminProcedure
      .input(z.object({
        transcript: z.string().min(1),
        runs: z.number().int().min(2).max(10).default(5),
      }))
      .mutation(async ({ input }) => {
        const { runTestRetest, makeLlmScorer } = await import("./scoring/reliability");
        const result = await runTestRetest(makeLlmScorer(input.transcript), input.runs);
        return { normingVersion: ACTIVE_NORMING_VERSION, ...result };
      }),
    // Stage 6: the three numbers that decide the business + pipeline health.
    funnel: adminProcedure
      .input(z.object({ days: z.number().int().min(1).max(365).default(30) }).optional())
      .query(async ({ input }) => {
        const days = input?.days ?? 30;
        const now = Date.now();
        const sinceMs = now - days * 24 * 60 * 60 * 1000;
        const events = await getAnalyticsEventsSince(sinceMs);
        const funnel = funnelMetrics(events);
        const subs = await getSubscriptionEvents();
        const ret = retention({ created: subs.created, canceled: subs.canceled, now });
        const spendCents = await getMarketingSpendSince(sinceMs);
        const cacCents = cac(spendCents, funnel.counts.subscription_created);
        return {
          days,
          funnel,
          pipeline: {
            llm: pipelineHealth(events, "score_llm"),
            stt: pipelineHealth(events, "score_stt"),
          },
          retention: ret,
          spendCents,
          cacCents,
          goNoGo: goNoGo({ completeToPaid: funnel.conversion.completeToPaid, cacCents, month2ChurnRate: ret.churnRate }),
          stages: FUNNEL_STAGES,
        };
      }),
    addMarketingSpend: adminProcedure
      .input(z.object({
        periodStart: z.number(),
        amountCents: z.number().int().min(0),
        channel: z.string().max(64).optional(),
        note: z.string().max(255).optional(),
      }))
      .mutation(async ({ input }) => {
        await addMarketingSpend(input);
        return { ok: true };
      }),
    users: adminProcedure.query(async () => {
      return getAllUsers();
    }),
    assessments: adminProcedure.query(async () => {
      return getAllAssessments();
    }),
    evidence: adminProcedure.query(async () => {
      return getAllEvidence();
    }),
    reviewEvidence: adminProcedure
      .input(z.object({
        evidenceId: z.number(),
        status: z.enum(["pending", "reviewed", "accepted", "rejected"]),
      }))
      .mutation(async ({ input }) => {
        return updateEvidenceStatus(input.evidenceId, input.status);
      }),
    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input }) => {
        return updateUserRole(input.userId, input.role);
      }),
    updateUserTier: adminProcedure
      .input(z.object({
        userId: z.number(),
        tier: z.enum(["free", "silver", "gold", "platinum"]),
      }))
      .mutation(async ({ input }) => {
        return updateUserTier(input.userId, input.tier);
      }),
    togglePromo: adminProcedure
      .input(z.object({
        promoId: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        return togglePromoCode(input.promoId, input.isActive);
      }),
  }),

  // ============================================================
  // PAYMENT PROCEDURES
  // ============================================================
  payment: router({
    createCheckout: protectedProcedure
      .input(z.object({
        productKey: z.enum(["assessment", "assessmentRegular", "silver", "gold", "platinum"]),
        promoCode: z.string().optional(),
        origin: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await recordEvent({ type: "checkout_start", userId: ctx.user.id, meta: { productKey: input.productKey } });
        const { createCheckoutSession } = await import("./stripe/index");
        const result = await createCheckoutSession({
          userId: ctx.user.openId,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "",
          productKey: input.productKey,
          promoCode: input.promoCode,
          origin: input.origin,
        });
        return result;
      }),
  }),

  // ============================================================
  // PLATFORM — public provider liveness (is a real AI connected?)
  // ============================================================
  // Lets the client be HONEST: when the LLM/STT run on the built-in mock, the
  // analysis is a simulated sample, not a live AI read. Exposes only booleans.
  // ============================================================
  // TESTIMONIALS — captured in-app at the peak moment, with consent
  // ============================================================
  testimonials: router({
    submit: protectedProcedure
      .input(z.object({
        rating: z.number().int().min(1).max(5),
        quote: z.string().max(1000).optional(),
        displayName: z.string().max(120).optional(),
        consentToDisplay: z.boolean().default(false),
        moment: z.string().max(40).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveTestimonial({
          userId: ctx.user.id,
          rating: input.rating,
          quote: input.quote ?? null,
          displayName: input.displayName ?? null,
          consentToDisplay: input.consentToDisplay,
          moment: input.moment ?? null,
        });
        await recordEvent({ type: "testimonial", userId: ctx.user.id, numericValue: input.rating });
        return { success: true };
      }),
    // Public: only approved + consented testimonials, for display on the site.
    approved: publicProcedure.query(async () => {
      return getApprovedTestimonials(12);
    }),
  }),

  platform: router({
    status: publicProcedure.query(() => {
      const s = platformStatus();
      return {
        liveLLM: s.live.llm,
        liveSTT: s.live.stt,
        liveStorage: s.live.storage,
        panelSize: panelSize(),
        panel: panelDevelopers(),
      };
    }),
  }),

  // ============================================================
  // FREE ACCESS — universal passcode, unlimited, email-based signup
  // ============================================================
  // Anyone can sign up free with their email + the shared passcode (no card, no
  // cap). We create a free account keyed to that email and log them in. Their
  // low-confidence result is emailed to that address when the assessment completes.
  freeAccess: router({
    // Public: whether the free gate is enabled + how many giveaway spots remain,
    // so the UI can show "N of 1,000 free spots left" and close the door at 0.
    info: publicProcedure.query(async () => {
      const cap = FREE_ASSESSMENT_CAP;
      let remaining: number | null = null;
      let used = 0;
      if (cap > 0) {
        const count = await countFreeUsers();
        if (count !== null) { used = count; remaining = Math.max(0, cap - count); }
      }
      return {
        enabled: FREE_ACCESS_CODE.length > 0,
        cap,                      // 0 = unlimited
        used,
        remaining,                // null = uncapped or DB down
        full: cap > 0 && remaining === 0,
      };
    }),

    claim: publicProcedure
      .input(z.object({
        email: z.string().email().max(320),
        passcode: z.string().min(1).max(120),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!FREE_ACCESS_CODE || input.passcode !== FREE_ACCESS_CODE) {
          return { success: false, error: "That access code isn't valid." };
        }
        const email = input.email.trim().toLowerCase();
        const openId = `free:${email}`;
        const name = email.split("@")[0];

        // Giveaway cap: block only NEW signups once the spots run out. Anyone who
        // already claimed can always sign back in (they don't consume a new spot).
        if (FREE_ASSESSMENT_CAP > 0) {
          const existing = await getUserByOpenId(openId);
          if (!existing) {
            const count = await countFreeUsers();
            if (count !== null && count >= FREE_ASSESSMENT_CAP) {
              return { success: false, full: true, error: "All free spots have been claimed. Paid access is available." };
            }
          }
        }

        try {
          await upsertUser({ openId, email, name, loginMethod: "free-passcode", lastSignedIn: new Date() });
          // Founding members (first FREE_ASSESSMENT_CAP) get the FULL experience free —
          // both the voice assessment AND the fully-underwritten (multi-AI panel +
          // coaching) result. Grant the unlock so the analyze/coaching gates open.
          const u = await getUserByOpenId(openId);
          if (u) await grantBetaAccess(u.id, "silver");
        } catch (e) {
          // DB unavailable (e.g. local/dev) — still issue the session so the
          // core loop works; persistence resumes when the DB is connected.
          console.warn("[freeAccess] upsert skipped:", e);
        }
        const token = await sdk.createSessionToken(openId, { name });
        ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
        await recordEvent({ type: "free_access_claimed" });
        return { success: true };
      }),
  }),

  // ============================================================
  // ANALYTICS (Stage 6) — funnel instrumentation
  // ============================================================
  // ============================================================
  // BETA ACCESS — free for the first N users via a passcode
  // ============================================================
  beta: router({
    status: publicProcedure.query(async () => {
      const enabled = BETA_ACCESS_CODE.length > 0;
      const redeemed = enabled ? await countBetaRedemptions() : 0;
      return {
        enabled,
        cap: BETA_MAX_REDEMPTIONS,
        redeemed,
        remaining: Math.max(0, BETA_MAX_REDEMPTIONS - redeemed),
      };
    }),
    redeem: protectedProcedure
      .input(z.object({ code: z.string().min(1).max(120) }))
      .mutation(async ({ ctx, input }) => {
        if (!BETA_ACCESS_CODE) return { success: false, error: "Beta access isn't enabled right now." };
        if (input.code.trim() !== BETA_ACCESS_CODE) return { success: false, error: "That access code isn't valid." };
        const already = (await getUserById(ctx.user.id))?.betaAccess;
        if (!already) {
          const redeemed = await countBetaRedemptions();
          if (redeemed >= BETA_MAX_REDEMPTIONS) {
            return { success: false, error: `Beta is full — all ${BETA_MAX_REDEMPTIONS} free spots are taken.` };
          }
        }
        await grantBetaAccess(ctx.user.id, "silver");
        await recordEvent({ type: "beta_redeemed", userId: ctx.user.id });
        return { success: true, tier: "silver" as const };
      }),
  }),

  analytics: router({
    // Public client-side funnel pings (landing views, etc.). Best-effort.
    track: publicProcedure
      .input(z.object({
        type: z.enum(["landing_view", "assessment_start", "checkout_start"]),
        sessionId: z.string().max(64).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await recordEvent({ type: input.type, userId: ctx.user?.id ?? null, sessionId: input.sessionId ?? null });
        return { ok: true };
      }),
  }),

  // ============================================================
  // PROFILE PROCEDURES
  // ============================================================
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const assessment = await getLatestAssessment(ctx.user.id);
      if (!assessment || assessment.status !== "complete") return null;
      const scoresList = await getScoresByAssessment(assessment.id);
      const combos = await getPowerCombinationsByAssessment(assessment.id);
      const cohort = computeCohortRarity(scoresList as any, (assessment as any).birthYear);
      // The person's declared outcomes — their spoken answers to the goals
      // questions (order positions 12 & 13). Surfaced so the portal and the
      // commitment agreement can show "the outcomes you declared."
      const responsesList = await getResponsesByAssessment(assessment.id);
      const goals = extractGoalsText(responsesList as any);
      return {
        assessment,
        scores: scoresList,
        powerCombinations: combos,
        cohortRarity: cohort?.cohortRarity ?? null,
        generation: cohort?.generation ?? null,
        goals,
        user: { name: ctx.user.name, email: ctx.user.email },
      };
    }),

    comparison: protectedProcedure.query(async ({ ctx }) => {
      return getUserComparison(ctx.user.id);
    }),

    socialCard: protectedProcedure.query(async ({ ctx }) => {
      const assessment = await getLatestAssessment(ctx.user.id);
      if (!assessment || assessment.status !== "complete") return { svg: null };
      const scoresList = await getScoresByAssessment(assessment.id);
      const combos = await getPowerCombinationsByAssessment(assessment.id);

      // Shareable card shows the full profile — all 32 lines, from the single source of truth.
      const scores = ALL_AXES.map((label) => {
        const s = scoresList.find((sc: any) => sc.axisName === label);
        // Convert 0.0-1.0 DB scores to 0-100 scale for SVG rendering
        return s ? Math.round(s.score * 100) : 0;
      });

      // Get top 3 axes by score
      const indexed = scores.map((s, i) => ({ score: s, label: ALL_AXES[i] }));
      indexed.sort((a, b) => b.score - a.score);
      const topAxes = indexed.slice(0, 3).map(x => x.label);

      const svg = generateSocialCardSVG({
        userName: ctx.user.name || "Anonymous",
        rarity: assessment.compositeRarity || 1000,
        scores,
        topAxes,
      });

      return { svg };
    }),
  }),

  // ============================================================
  // INFLUENCER DASHBOARD PROCEDURES
  // ============================================================
  influencer: router({
    // Get stats for an influencer by their promo code
    stats: protectedProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return getInfluencerStatsByCode(input.code);
      }),

    // Get all promo codes owned by the current user (by email match)
    myCodes: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { promoCodes } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db || !ctx.user.email) return [];
      return db.select().from(promoCodes).where(eq(promoCodes.influencerEmail, ctx.user.email));
    }),
  }),

  // ============================================================
  // LEADERBOARD PROCEDURES
  // ============================================================
  leaderboard: router({
    // Get public leaderboard
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ input }) => {
        return getLeaderboard(input?.limit || 50);
      }),

    // Opt-in to leaderboard
    join: protectedProcedure
      .input(z.object({ displayName: z.string().min(1).max(128) }))
      .mutation(async ({ ctx, input }) => {
        const assessment = await getLatestAssessment(ctx.user.id);
        if (!assessment || assessment.status !== "complete" || !assessment.compositeRarity) {
          return { success: false, error: "No completed assessment found" };
        }
        const combos = await getPowerCombinationsByAssessment(assessment.id);
        const topCombo = combos[0]?.name || null;
        const result = await addToLeaderboard({
          userId: ctx.user.id,
          assessmentId: assessment.id,
          displayName: input.displayName,
          compositeRarity: assessment.compositeRarity,
          topPowerCombo: topCombo || undefined,
        });
        return { success: true, id: result?.id };
      }),

    // Toggle visibility
    toggleVisibility: protectedProcedure
      .input(z.object({ isPublic: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        return toggleLeaderboardVisibility(ctx.user.id, input.isPublic);
      }),

    // Get my entry
    myEntry: protectedProcedure.query(async ({ ctx }) => {
      return getUserLeaderboardEntry(ctx.user.id);
    }),
  }),

  // ============================================================
  // CHALLENGE A FRIEND PROCEDURES
  // ============================================================
  challenge: router({
    // Send a challenge invite
    send: protectedProcedure
      .input(z.object({ recipientEmail: z.string().email().optional() }))
      .mutation(async ({ ctx }) => {
        const assessment = await getLatestAssessment(ctx.user.id);
        if (!assessment || !assessment.compositeRarity) {
          return { success: false, error: "Complete an assessment first" };
        }
        const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
        const result = await createChallengeInvite({
          senderId: ctx.user.id,
          senderName: ctx.user.name || "Anonymous",
          senderRarity: assessment.compositeRarity,
          token,
        });
        return { success: true, token: result?.token };
      }),

    // Get challenge details by token (public — for the recipient)
    get: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        return getChallengeByToken(input.token);
      }),

    // Accept a challenge
    accept: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return acceptChallenge(input.token, ctx.user.id, ctx.user.name || "Anonymous");
      }),

    // Get my sent challenges
        mySent: protectedProcedure.query(async ({ ctx }) => {
      return getChallengesBySender(ctx.user.id);
    }),
  }),

  // ============================================================
  // NLP PROFILE — Sensory system analysis (Gold+)
  // ============================================================
  nlp: router({
    profile: protectedProcedure
      .input(z.object({ assessmentId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const profile = await getNlpProfile(ctx.user.id, input?.assessmentId);
        return profile;
      }),
  }),

  // ============================================================
  // COACHING LETTERS — Peter's NLP-mirrored letters (Gold+)
  // ============================================================
  // Live research — Perplexity fetches fresh citations for the user's profile.
  // Distinct from the curated library: results come back flagged unverified and
  // are shown in a clearly-separated panel. No key = no results (never fabricated).
  research: router({
    liveCitations: protectedProcedure
      .input(z.object({
        strengths: z.array(z.string()).max(8).default([]),
        weaknesses: z.array(z.string()).max(8).default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await fetchLiveCitations({
          strengths: input.strengths,
          weaknesses: input.weaknesses,
        });
        await recordEvent({ type: "live_research", userId: ctx.user.id, numericValue: result.citations.length, ok: !result.mocked });
        return result;
      }),
  }),

  coaching: router({
    letters: protectedProcedure.query(async ({ ctx }) => {
      return getCoachingLetters(ctx.user.id);
    }),

    // Outcome Engineering — goal-aligned diagnosis + research-backed prescriptions.
    // High-confidence (paid/beta) feature. `goals` is the user's stated-goals text
    // (from the goals questions) so the report is aligned to THEIR outcomes.
    outcomeReport: protectedProcedure
      .input(z.object({ goals: z.string().max(6000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.membershipTier === "free") {
          return { locked: true as const };
        }
        const assessment = await getLatestAssessment(ctx.user.id);
        if (!assessment || assessment.status !== "complete") {
          return { error: "Complete an assessment first to generate your outcome plan." };
        }
        const scores = await getScoresByAssessment(assessment.id);
        // Pull the person's stated goals from their answers to the goals questions
        // (order positions 12 & 13 — see QUESTION_ORDER) so the report aligns to
        // THEIR outcomes. Client may override via input.goals.
        let goals = input.goals ?? "";
        if (!goals) {
          const responsesList = await getResponsesByAssessment(assessment.id);
          goals = extractGoalsText(responsesList as any);
        }
        const report = await generateOutcomeReport(scores as any, goals);
        await recordEvent({ type: "outcome_report", userId: ctx.user.id });
        return { report };
      }),

    generate: protectedProcedure
      .input(z.object({ topic: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        // Only Gold+ can generate coaching letters
        if (ctx.user.membershipTier !== "gold" && ctx.user.membershipTier !== "platinum") {
          return { error: "Coaching letters require Gold or Platinum membership" };
        }

        // Get user's NLP profile
        const nlpProfile = await getNlpProfile(ctx.user.id);
        if (!nlpProfile) {
          return { error: "Complete an assessment first to generate your NLP profile" };
        }

        // Get user's latest scores for context
        const assessment = await getLatestAssessment(ctx.user.id);
        const scores = assessment ? await getScoresByAssessment(assessment.id) : [];

        const topAxes = scores.sort((a, b) => b.score - a.score).slice(0, 5);
        const bottomAxes = scores.sort((a, b) => a.score - b.score).slice(0, 3);

        // Build the coaching letter using the user's representational system
        const repSystemInstructions: Record<string, string> = {
          visual: "Use visual language: 'picture this', 'see clearly', 'bright future', 'illuminate', 'envision'. Paint vivid mental images. Use spatial metaphors.",
          auditory: "Use auditory language: 'sounds like', 'resonates', 'harmonize', 'tune into', 'listen closely'. Reference rhythm, tone, and dialogue.",
          kinesthetic: "Use kinesthetic language: 'feel the weight', 'grasp', 'solid ground', 'touch base', 'get a handle on'. Reference physical sensations and movement.",
          olfactory_gustatory: "Use olfactory/gustatory language: 'savor', 'taste of success', 'something smells off', 'digest this'. Reference taste and smell metaphors.",
        };

        const repInstructions = repSystemInstructions[nlpProfile.primaryRepSystem || "visual"];

        const letterResult = await invokeLLM({
          messages: [
            { role: "system", content: `You are Peter — a master NLP practitioner, executive coach, and developmental psychologist. You write personalized coaching letters that mirror the reader's representational system and meta-programs.

CRITICAL RULES:
- ${repInstructions}
- Match their meta-programs: ${nlpProfile.towardAway && nlpProfile.towardAway > 0.6 ? "They are toward-motivated — focus on goals, gains, possibilities" : "They are away-from-motivated — focus on avoiding problems, risks, what to move away from"}
- ${nlpProfile.bigPictureDetail && nlpProfile.bigPictureDetail > 0.6 ? "They prefer big picture — start with the vision, then details" : "They prefer detail — start with specifics, build to the whole"}
- ${nlpProfile.internalExternal && nlpProfile.internalExternal > 0.6 ? "They have internal locus — reference their own judgment, inner knowing" : "They have external locus — reference evidence, others' validation, data"}
- Write in a warm but intellectually rigorous tone
- Keep it under 500 words
- End with one specific action item calibrated to their growth edges
- Sign as "Peter"` },
            { role: "user", content: `Write a coaching letter for someone with these strengths: ${topAxes.map(a => a.axisName).join(", ")}. Their growth edges are: ${bottomAxes.map(a => a.axisName).join(", ")}. Their primary rep system is ${nlpProfile.primaryRepSystem} (sequence: ${nlpProfile.repSystemSequence}).${input.topic ? ` Focus on this topic: ${input.topic}` : " Focus on integrating their top strength with their primary growth edge."}` },
          ],
        });

        const letterBody = letterResult.choices?.[0]?.message?.content as string || "";
        if (!letterBody) return { error: "Failed to generate letter" };

        const subject = input.topic
          ? `On ${input.topic} — A Letter for You`
          : `Integrating Your ${topAxes[0]?.axisName || "Strengths"} — A Letter for You`;

        const letterId = await saveCoachingLetter({
          userId: ctx.user.id,
          tier: ctx.user.membershipTier as "gold" | "platinum",
          subject,
          body: letterBody,
          repSystemUsed: nlpProfile.primaryRepSystem || undefined,
          sensoryPredicatesUsed: nlpProfile.sensoryPredicates,
          metaProgramsAddressed: {
            towardAway: nlpProfile.towardAway,
            internalExternal: nlpProfile.internalExternal,
            bigPictureDetail: nlpProfile.bigPictureDetail,
          },
          sentAt: Date.now(),
        });

        return { success: true, letterId, subject, body: letterBody };
      }),

    markRead: protectedProcedure
      .input(z.object({ letterId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Ownership check: only mark your own letters as read
        const letters = await getCoachingLetters(ctx.user.id, 100);
        const owns = letters.some(l => l.id === input.letterId);
        if (!owns) return { success: false, error: "Not your letter" };
        await markLetterRead(input.letterId);
        return { success: true };
      }),
  }),
  // ============================================================
  // TRACKER — the 30/60/90-day behavioral-journal loop (recurring touchpoint)
  // ============================================================
  tracker: router({
    // The downloadable journal template for this cycle, generated from the
    // person's own prescribed practices + stated goals.
    doc: protectedProcedure
      .input(z.object({ days: z.number().int().min(1).max(90).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const assessment = await getLatestAssessment(ctx.user.id);
        let goals = "";
        let projections: any[] = [];
        if (assessment) {
          const responsesList = await getResponsesByAssessment(assessment.id);
          goals = extractGoalsText(responsesList as any);
          projections = buildProjections(goals);
        }
        return { markdown: buildTrackerMarkdown({ projections, days: input?.days ?? 30, goals }) };
      }),

    // Upload a completed cycle journal → SELF-REPORTED re-estimate + fresh Vision.
    submitJournal: protectedProcedure
      .input(z.object({ journalText: z.string().min(1).max(60000), days: z.number().int().min(1).max(90).default(30) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.membershipTier === "free") return { locked: true as const };
        const assessment = await getLatestAssessment(ctx.user.id);
        if (!assessment || assessment.status !== "complete") {
          return { error: "Complete an assessment first, then run a tracker cycle." };
        }
        const scores = await getScoresByAssessment(assessment.id);
        const responsesList = await getResponsesByAssessment(assessment.id);
        const goals = extractGoalsText(responsesList as any);
        const analysis = await analyzeJournal({ journalText: input.journalText, goals, scores: scores as any, days: input.days });
        const cycle = await createTrackerCycle({
          userId: ctx.user.id,
          assessmentId: assessment.id,
          days: input.days,
          journalText: input.journalText,
          summary: analysis.summary,
          adjustments: analysis.adjustments as any,
          freshVision: analysis.freshVision,
          adherenceNote: analysis.adherenceNote,
        });
        await recordEvent({ type: "tracker_cycle", userId: ctx.user.id });
        return { cycle, analysis };
      }),

    // Cycle history for the portal.
    cycles: protectedProcedure.query(async ({ ctx }) => {
      return getTrackerCyclesByUser(ctx.user.id);
    }),

    // Re-engagement email opt-in. `optIn` is null when they've never chosen — the
    // client uses that to re-offer the Y/N on every login (people change their mind).
    reminderPref: protectedProcedure.query(async ({ ctx }) => {
      return { optIn: await getTrackerReminderOptIn(ctx.user.id) };
    }),
    setReminderPref: protectedProcedure
      .input(z.object({ optIn: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await setTrackerReminderOptIn(ctx.user.id, input.optIn);
        await recordEvent({ type: "tracker_reminder_pref", userId: ctx.user.id, numericValue: input.optIn ? 1 : 0 });
        return { optIn: input.optIn };
      }),
  }),
  // ============================================================
  // COMMITMENT — the Personal Commitment Agreement (spoken, self-authored)
  // ============================================================
  commitment: router({
    // The question set, so the client renders prompts from one source of truth.
    questions: publicProcedure.query(() => COMMITMENT_QUESTIONS),

    // The user's current working commitment (latest draft or current signed), or null.
    get: protectedProcedure.query(async ({ ctx }) => {
      const c = await getCommitmentByUser(ctx.user.id);
      if (!c) return null;
      return {
        ...c,
        answers: (c.answers as CommitmentAnswer[] | null) ?? [],
      };
    }),

    // The immutable archive — every signed letter, newest first. Superseded ones
    // are read-only history; the newest signed is the current, active letter.
    history: protectedProcedure.query(async ({ ctx }) => {
      const rows = await getCommitmentHistory(ctx.user.id);
      return rows.map((c: any) => ({
        id: c.id,
        version: c.version,
        goals: c.goals,
        answers: (c.answers as CommitmentAnswer[] | null) ?? [],
        signedName: c.signedName,
        signedAt: c.signedAt,
        supersededAt: c.supersededAt,
      }));
    }),

    // Begin a NEW letter that will supersede the current one. Only allowed when the
    // latest is already signed — a signed letter is never edited, only replaced.
    startNew: protectedProcedure.mutation(async ({ ctx }) => {
      const latest = await getCommitmentByUser(ctx.user.id);
      if (latest && latest.status === "draft") {
        // A draft is already open — nothing to start.
        return { success: true as const, draftId: latest.id, already: true };
      }
      const assessment = await getLatestAssessment(ctx.user.id);
      const draftId = await startNewCommitment(ctx.user.id, assessment?.id ?? null);
      return { success: true as const, draftId };
    }),

    // Save spoken answers (and optionally sign). Answers are the person's
    // transcribed speech — we store verbatim, never rewrite them. A signed letter
    // is immutable: draft saves never touch it; signing supersedes the prior one.
    save: protectedProcedure
      .input(z.object({
        goals: z.string().max(6000).optional(),
        answers: z.array(z.object({
          key: z.string().max(40),
          transcript: z.string().max(8000),
        })).max(50),
        sign: z.boolean().optional(),
        signedName: z.string().max(160).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only allow known question keys through.
        const validKeys = new Set(COMMITMENT_QUESTIONS.map((q) => q.key));
        const answers = input.answers.filter((a) => validKeys.has(a.key));
        const assessment = await getLatestAssessment(ctx.user.id);

        if (input.sign) {
          if (!commitmentReady(answers)) {
            return { error: "Answer every question out loud before signing." as const };
          }
          if (!input.signedName || input.signedName.trim().length < 2) {
            return { error: "Add your name to sign." as const };
          }
          await signCommitment({
            userId: ctx.user.id,
            assessmentId: assessment?.id ?? null,
            goals: input.goals ?? null,
            answers,
            signedName: input.signedName.trim(),
          });
          await recordEvent({ type: "commitment_signed", userId: ctx.user.id });
          return { success: true as const, signed: true };
        }

        await saveCommitmentDraft({
          userId: ctx.user.id,
          assessmentId: assessment?.id ?? null,
          goals: input.goals ?? null,
          answers,
        });
        return { success: true as const, signed: false };
      }),

    // Server-side transcription fallback for browsers without the Web Speech API.
    // Primary path is the browser's live SpeechRecognition (free, instant); this
    // stores the recorded audio and runs the STT seam. Returns mocked=true when no
    // STT vendor is configured, so the client can tell the user honestly.
    transcribe: protectedProcedure
      .input(z.object({
        audioBase64: z.string().max(20_000_000),
        mimeType: z.string().max(64).default("audio/webm"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buf = Buffer.from(input.audioBase64, "base64");
        const ext = input.mimeType.includes("mp4") ? "mp4" : input.mimeType.includes("aac") ? "aac" : "webm";
        const { url } = await storagePut(`commitments/${ctx.user.id}/${Date.now()}.${ext}`, buf, input.mimeType);
        const result = await transcribeAudio({ audioUrl: url, language: "en" }) as any;
        if (result?.error) return { text: "", mocked: false, error: String(result.error) };
        // The mock seam returns a canned transcript — flag it so the UI never
        // passes fake words off as the user's own.
        const mocked = sttProvider() === "mock";
        return { text: (result?.text as string) || "", mocked };
      }),

    // Opt in/out of daily accountability check-ins (first 30 days).
    // Explicit, revocable consent. The daily message is ONLY a Y/N at ~8 PM the
    // person's local time — we capture their browser timezone to hit that hour.
    setReminders: protectedProcedure
      .input(z.object({
        channel: z.enum(["none", "email", "text"]),
        phone: z.string().max(32).optional(),
        timezone: z.string().max(64).optional(), // IANA zone from the browser
        consent: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.channel === "text") {
          if (!(input.phone && input.phone.trim().length >= 7)) {
            return { error: "Add a mobile number to receive texts." as const };
          }
          if (!input.consent) {
            return { error: "Please confirm you agree to receive the daily Y/N text." as const };
          }
        }
        const current = await getCurrentSignedCommitment(ctx.user.id);
        if (!current) return { error: "Sign your commitment first." as const };
        const enabling = input.channel !== "none";
        await updateCommitmentReminder(ctx.user.id, {
          reminderChannel: input.channel,
          reminderPhone: input.channel === "text" ? (input.phone ?? null) : null,
          reminderTimezone: enabling ? (input.timezone ?? current.reminderTimezone ?? null) : current.reminderTimezone,
          reminderConsentAt: enabling ? (current.reminderConsentAt ?? new Date()) : null,
          reminderStartAt: enabling ? (current.reminderStartAt ?? new Date()) : null,
        });
        return { success: true as const, channel: input.channel };
      }),
  }),

  // ============================================================
  // REMINDERS — daily accountability send (host cron calls sendDaily)
  // ============================================================
  reminders: router({
    // Send today's Y/N check-in to everyone with an active channel who is still
    // inside their 30-day window. Auth: CRON_SECRET (host scheduler) or an admin.
    // Idempotency (once-per-day) and the inbound Y/N reply webhook are the host's
    // job — see HANDOFF_TO_MANUS.md.
    sendDaily: publicProcedure
      .input(z.object({
        secret: z.string().optional(),
        // Override the 8 PM target (mainly for testing); ignoreTime sends to all
        // in-window targets regardless of local hour (manual admin blast).
        targetHour: z.number().int().min(0).max(23).optional(),
        ignoreTime: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.user?.role === "admin";
        const secretOk = CRON_SECRET.length > 0 && input.secret === CRON_SECRET;
        if (!isAdmin && !secretOk) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Cron secret or admin required." });
        }
        const targets = await getActiveReminderCommitments();
        const now = new Date();
        const nowMs = now.getTime();
        const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
        const targetHour = input.targetHour ?? DAILY_CHECKIN_HOUR;
        let sent = 0, skipped = 0, failed = 0;
        for (const t of targets) {
          // Respect the 30-day window when a start date is set.
          const start = t.reminderStartAt ? new Date(t.reminderStartAt).getTime() : nowMs;
          const day = Math.floor((nowMs - start) / (24 * 60 * 60 * 1000)) + 1;
          if (nowMs - start > WINDOW_MS) { skipped++; continue; }
          // Only fire when it's ~8 PM in the person's own timezone.
          if (!input.ignoreTime && !shouldSendCheckinNow(t.reminderTimezone, now, targetHour)) { skipped++; continue; }
          if (t.reminderChannel === "text" && t.reminderPhone) {
            const r = await sendSms(t.reminderPhone, dailyCheckinSms());
            r.ok ? sent++ : failed++;
          } else if (t.reminderChannel === "email" && t.email) {
            const r = await sendEmail(t.email, "Your AQAL daily check-in — reply Y or N", dailyCheckinEmailHtml({ dayNumber: day }));
            r.ok ? sent++ : failed++;
          } else {
            skipped++;
          }
        }
        await recordEvent({ type: "reminders_daily", numericValue: sent });
        return { sent, skipped, failed, total: targets.length };
      }),
  }),

  // ============================================================
  // CORPUS SEARCH & EVALUATION (Buddy Composability)
  // ============================================================
  corpus: router({
    search: adminProcedure
      .input(corpusSearchInput)
      .query(async ({ input }) => {
        if (!isCorpusReady()) {
          return { results: [], ready: false, message: "Corpus not loaded. Call corpus.loadIndex first." };
        }
        const results = searchCorpus(input.query, input.topK);
        return { results, ready: true, message: null };
      }),
    stats: adminProcedure
      .query(async () => {
        return getCorpusStats();
      }),
    loadIndex: adminProcedure
      .input(z.object({ chunks: z.array(z.object({
        id: z.string(),
        source: z.string(),
        text: z.string(),
        lineStart: z.number(),
        lineEnd: z.number(),
      })) }))
      .mutation(async ({ input }) => {
        buildIndex(input.chunks as CorpusChunk[]);
        const stats = getCorpusStats();
        return { success: true, ...stats };
      }),
  }),
  evaluation: router({
    log: adminProcedure
      .input(evaluationLogInput)
      .mutation(async ({ input }) => {
        const overall = (
          input.metrics.signalDetection +
          input.metrics.calibrationAccuracy +
          input.metrics.frontierAwareness +
          input.metrics.relationshipDepth +
          input.metrics.integrationScore
        ) / 5;
        logEvaluation({
          sessionId: input.sessionId,
          timestamp: Date.now(),
          metrics: input.metrics,
          notes: input.notes,
          overallScore: Math.round(overall * 10) / 10,
        });
        return { success: true, overallScore: Math.round(overall * 10) / 10 };
      }),
    report: adminProcedure
      .query(async () => {
        return getEvaluationReport();
      }),
  }),

  // ============================================================
  // VIDEO ASSESSMENT — Platinum-tier multimodal analysis
  // ============================================================
  video: router({
    // Upload video to S3 and get a storage URL
    upload: protectedProcedure
      .input(z.object({
        videoBase64: z.string(), // base64-encoded video data
        mimeType: z.string().default("video/webm"),
        filename: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.membershipTier !== "platinum" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Video assessment requires Platinum tier" });
        }
        const buffer = Buffer.from(input.videoBase64, "base64");
        const filename = input.filename || `video-${ctx.user.id}-${Date.now()}.webm`;
        const { key, url } = await storagePut(`video-assessments/${filename}`, buffer, input.mimeType);
        return { key, url };
      }),

    // Start analysis on an uploaded video
    startAnalysis: protectedProcedure
      .input(z.object({
        videoUrl: z.string(),
        videoKey: z.string().optional(),
        durationMs: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check platinum tier
        if (ctx.user.membershipTier !== "platinum" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Video assessment requires Platinum tier" });
        }

        // Create the video assessment record
        const id = await createVideoAssessment({
          userId: ctx.user.id,
          videoUrl: input.videoUrl,
          durationMs: input.durationMs,
        });

        if (!id) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create video assessment" });
        }

        // Get a signed URL for the video for LLM access
        const videoKey = input.videoKey || input.videoUrl.replace("/manus-storage/", "");
        let signedVideoUrl: string;
        try {
          signedVideoUrl = await storageGetSignedUrl(videoKey);
        } catch {
          signedVideoUrl = input.videoUrl; // fallback
        }

        // Transcribe audio from the video
        let audioTranscript: string | undefined;
        try {
          const transcription = await transcribeAudio({ audioUrl: signedVideoUrl, language: "en" });
          if ("text" in transcription) {
            audioTranscript = transcription.text;
          }
        } catch (err: any) {
          console.warn(`[VideoAnalysis] Transcription failed for assessment ${id}:`, err.message);
        }

        // Run analysis (fire and forget — results stored in DB, polled by client)
        runVideoAnalysis({
          videoAssessmentId: id,
          videoUrl: signedVideoUrl,
          audioTranscript,
        }).catch((err) => {
          console.error(`[VideoAnalysis] Failed for assessment ${id}:`, err.message);
        });

        return { id, status: "processing" };
      }),

    // Get a specific video assessment result
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const result = await getVideoAssessment(input.id);
        if (!result) throw new TRPCError({ code: "NOT_FOUND" });
        if (result.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return result;
      }),

    // List user's video assessments
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserVideoAssessments(ctx.user.id);
      }),
  }),

  // ============================================================
  // NETWORK MATCHING — Complementarity + Resonance engine
  // ============================================================
  network: router({
    matches: protectedProcedure
      .input(z.object({
        mode: z.enum(["complementary", "resonance"]).default("complementary"),
        limit: z.number().min(1).max(50).default(10),
      }))
      .query(async ({ ctx, input }) => {
        // Get current user's latest assessment + scores
        const myAssessment = await getLatestAssessment(ctx.user.id);
        const myScores = await getScoresByAssessment(myAssessment?.id ?? 0);
        if (!myScores.length) {
          return { matches: [], total: 0, mode: input.mode };
        }

        // Build "me" profile (birth year enables generational affinity)
        const meProfile: Profile = {
          id: String(ctx.user.id),
          name: ctx.user.name || "You",
          scores: Object.fromEntries(myScores.map(s => [s.axisName, s.score])),
          birthYear: (myAssessment as any)?.birthYear ?? null,
        };

        // Get all other users' profiles
        const candidates = await getNetworkCandidates(ctx.user.id);
        if (!candidates.length) {
          return { matches: [], total: 0, mode: input.mode };
        }

        // Run the matching engine
        const ranked = rankMatches(meProfile, candidates, {
          mode: input.mode as MatchMode,
          minScore: 20,
          limit: input.limit,
        });

        return {
          matches: ranked.map(r => {
            const by = (r.candidate as any).birthYear as number | null | undefined;
            const cohort = by
              ? computeCohortRarity(
                  Object.entries((r.candidate as any).scores as Record<string, number>)
                    .map(([axisName, score]) => ({ axisName, score, confidence: 0.5 })),
                  by,
                )
              : null;
            return {
              candidateId: r.candidate.id,
              candidateName: r.candidate.name,
              generation: cohort?.generation ?? null,
              cohortRarity: cohort?.cohortRarity ?? null,
              generationalNote: (r as any).generationalNote ?? null,
              sameGeneration: (r as any).sameGeneration ?? false,
              generationGap: (r as any).generationGap ?? null,
              clusterScore: (r as any).clusterScore ?? r.score,
              score: r.score,
              basis: r.basis,
              mode: r.mode,
              ...(r.mode === "complementary" ? {
                coversYourEdges: (r as any).coversYourEdges,
                theyNeedFromYou: (r as any).theyNeedFromYou,
              } : {
                sharedPeaks: (r as any).sharedPeaks,
              }),
            };
          }),
          total: candidates.length,
          mode: input.mode,
        };
      }),
  }),
});
export type AppRouter = typeof appRouter;
