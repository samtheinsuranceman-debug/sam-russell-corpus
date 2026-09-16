import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { CONSUMER_HEALTH_CONSENT_VERSION, TERMS_OF_USE_VERSION, PRIVACY_POLICY_VERSION, HEALTH_DATA_POLICY_VERSION, MEDICAL_DISCLAIMER_VERSION } from "@shared/legalVersions";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { generateStateRights } from "./compliance/stateRights";
import { PUBLIC_WELLNESS_MODE } from "./compliance/releasePolicy";
import { getSubscriptionForUser } from "./billing";
import {
  saveHipaaConsent, getConsentBySession, getConsentByUserId,
  getAllConsents, logActivity, getActivityByUser, getAllActivityLogs,
  getActivityStats, createAssessment, getAssessmentById, updateAssessment,
  getAssessmentsByUser, createDiagnosticReport, getReportById,
  getReportByShareToken, getReportsByUser, updateReport,
  getDigitalTwinByUserId, upsertDigitalTwin,
  createJournalEntry, getJournalEntriesByUser, getJournalEntryById,
  createWellnessPlan, getActiveWellnessPlan, updateWellnessPlan,
  createMedication, getMedicationsByUser, updateMedication, deleteMedication,
  logMedicationTaken, getMedicationLogs,
} from "./db";
import { ACTIVITY_EVENTS, drBuddySessions, doctorPatients, assessments, diagnosticReports, digitalTwins, crisisEvents, users, clientLeads, personalityProfiles, personalityResponses, hipaaConsents, privacyRequests } from "../drizzle/schema";
import type { PersonalityResponse, NeedsGapItem, TransformationStage } from "../drizzle/schema";
import type { DigitalTwinSnapshot, DigitalTwinAlert } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { EMPTY_SNAPSHOT, assessFinancialReadiness, snapshotFromMCS, type ClinicalSnapshot } from "@shared/engines/psychFinancialBridge";
import { adherenceFromLogs, mergeParts, snapshotFromTwinHistory, type TwinSnapshotLike } from "@shared/engines/readinessEvidence";
import type { RiskZone } from "@shared/engines/mentalCreditScore";

// ─── Digital Twin Domain Definitions (from Grok) ─────────────────────────────
const TWIN_DOMAINS = [
  { id: "moodRegulation", name: "Mood Regulation", criticalThreshold: 20, deteriorationThreshold: 15 },
  { id: "anxietyManagement", name: "Anxiety Management", criticalThreshold: 20, deteriorationThreshold: 15 },
  { id: "psychoticSymptoms", name: "Psychotic Symptoms", criticalThreshold: 25, deteriorationThreshold: 10 },
  { id: "cognitiveFunction", name: "Cognitive Function", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "sleepQuality", name: "Sleep Quality", criticalThreshold: 20, deteriorationThreshold: 15 },
  { id: "socialEngagement", name: "Social Engagement", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "traumaResponse", name: "Trauma Response", criticalThreshold: 20, deteriorationThreshold: 15 },
  { id: "substanceUse", name: "Substance Use", criticalThreshold: 25, deteriorationThreshold: 10 },
  { id: "eatingBehavior", name: "Eating Behavior", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "personalityStability", name: "Personality Stability", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "somaticConcerns", name: "Somatic Concerns", criticalThreshold: 25, deteriorationThreshold: 15 },
  { id: "crisisSafety", name: "Crisis & Safety", criticalThreshold: 30, deteriorationThreshold: 10 },
] as const;

function computeCompositeScore(domainScores: Record<string, number>): number {
  const scores = TWIN_DOMAINS.map(d => domainScores[d.id] ?? 50);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  // Crisis safety veto: if below critical threshold, cap composite at 50
  const crisisScore = domainScores["crisisSafety"] ?? 50;
  if (crisisScore < 30) return Math.min(avg, 50);
  return Math.round(avg * 10) / 10;
}

function classifyState(
  composite: number,
  domainScores: Record<string, number>,
  prevComposite?: number
): "stable" | "improving" | "deteriorating" | "critical" {
  const crisisScore = domainScores["crisisSafety"] ?? 50;
  if (crisisScore < 30 || composite < 30) return "critical";
  if (prevComposite !== undefined) {
    if (composite - prevComposite >= 10) return "improving";
    if (prevComposite - composite >= 10) return "deteriorating";
  }
  const anyDomainCritical = TWIN_DOMAINS.some(d => (domainScores[d.id] ?? 50) < d.criticalThreshold);
  if (anyDomainCritical) return "critical";
  return "stable";
}

function generateAlerts(
  newScores: Record<string, number>,
  prevScores: Record<string, number>
): DigitalTwinAlert[] {
  const alerts: DigitalTwinAlert[] = [];
  for (const domain of TWIN_DOMAINS) {
    const newScore = newScores[domain.id] ?? 50;
    const prevScore = prevScores[domain.id] ?? 50;
    const drop = prevScore - newScore;
    if (newScore < domain.criticalThreshold) {
      alerts.push({
        id: `${domain.id}-${Date.now()}`,
        domain: domain.id,
        domainName: domain.name,
        message: `Your ${domain.name} score (${newScore}) has reached a critical level. Please consider reaching out to your care team or accessing crisis resources.`,
        severity: "critical",
        score: newScore,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      });
    } else if (drop >= domain.deteriorationThreshold) {
      alerts.push({
        id: `${domain.id}-${Date.now()}`,
        domain: domain.id,
        domainName: domain.name,
        message: `We've noticed a change in your ${domain.name} (score: ${newScore}). Would you like to connect with your care team or log how you're feeling?`,
        severity: "warning",
        score: newScore,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }
  return alerts;
}

// Map assessment answers to domain scores using DSM-5 question categories
function mapAssessmentToDomainScores(answers: Record<string, number>): Record<string, number> {
  // Question indices are 1-based; map to domains based on DSM-5 clusters
  // Scores are inverted: high symptom severity = low domain score
  const domainQuestions: Record<string, number[]> = {
    moodRegulation: [1, 2, 3, 4, 5, 6, 7, 8],
    anxietyManagement: [9, 10, 11, 12, 13, 14, 15, 16],
    psychoticSymptoms: [17, 18, 19, 20, 21, 22],
    cognitiveFunction: [23, 24, 25, 26, 27, 28],
    sleepQuality: [29, 30, 31, 32, 33],
    socialEngagement: [34, 35, 36, 37, 38, 39],
    traumaResponse: [40, 41, 42, 43, 44, 45, 46],
    substanceUse: [47, 48, 49, 50, 51, 52],
    eatingBehavior: [53, 54, 55, 56, 57],
    personalityStability: [58, 59, 60, 61, 62, 63, 64, 65],
    somaticConcerns: [66, 67, 68, 69, 70, 71],
    crisisSafety: [72, 73, 74, 75, 76, 77, 78, 79, 80],
  };
  const scores: Record<string, number> = {};
  for (const [domain, qNums] of Object.entries(domainQuestions)) {
    const domainAnswers = qNums.map(n => answers[String(n)] ?? 2); // default mid
    // Answers are 1-4 scale; 1=never/none, 4=always/severe
    const avgSeverity = domainAnswers.reduce((a, b) => a + b, 0) / domainAnswers.length;
    // Convert to 0-100 health score (inverted: lower severity = higher health)
    scores[domain] = Math.round(((4 - avgSeverity) / 3) * 100);
  }
  return scores;
}
import type { ProvisionalDiagnosis, SymptomProfile, TreatmentRecommendation, PubmedArticle } from "../drizzle/schema";

async function requireCurrentConsumerConsent(userId: number) {
  if (!PUBLIC_WELLNESS_MODE) return;
  const consent = await getConsentByUserId(userId);
  const currentProcessors = (process.env.HEALTH_DATA_PROCESSORS || "").trim();
  if (!consent || consent.withdrawnAt || consent.consentVersion !== CONSUMER_HEALTH_CONSENT_VERSION || !consent.agreedToTerms || !consent.agreedToHipaa || !consent.adult18Plus || (consent.processorDisclosureSnapshot || "").trim() !== currentProcessors) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Please accept the current Terms and Consumer Health Data Privacy consent before using AI support features.",
    });
  }
}

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ────────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Medically-driven financial planning ──────────────────────────────────
  // The calculators, strategies and fact finder are pure and run in the
  // browser. This is the one server procedure: the authenticated clinical
  // snapshot (digital-twin history, medication adherence, mental credit
  // score) the readiness panel merges with a locally scored intake. It is
  // registered as clinical-only in releasePolicy.ts and FORBIDDEN in the
  // public wellness edition, where the panel reads the person's own
  // check-ins instead.
  finance: router({
    readiness: protectedProcedure
      .input(z.object({
        monthlyExpenses: z.number().finite().nonnegative().max(1e9).optional(),
        liquidAssets: z.number().finite().nonnegative().max(1e12).optional(),
        annualIncome: z.number().finite().nonnegative().max(1e10).optional(),
        totalDebt: z.number().finite().nonnegative().max(1e12).optional(),
        homeEquity: z.number().finite().max(1e12).optional(),
      }).strict().optional())
      .query(async ({ ctx, input }) => {
        const parts: Array<ClinicalSnapshot | null> = [];
        try {
          const [twin, logs] = await Promise.all([getDigitalTwinByUserId(ctx.user.id), getMedicationLogs(ctx.user.id)]);
          const history = Array.isArray(twin?.trajectoryHistory) ? (twin.trajectoryHistory as TwinSnapshotLike[]) : [];
          parts.push(snapshotFromTwinHistory(history, adherenceFromLogs(logs)));
          const { getLatestMCS } = await import("./db");
          const mcs = await getLatestMCS(ctx.user.id);
          const zone = mcs?.riskZone as RiskZone | undefined;
          if (mcs && zone && ["critical", "elevated", "guarded", "resilient", "optimal"].includes(zone)) {
            parts.push(snapshotFromMCS({ score: mcs.score, riskZone: zone, breakdown: { components: [], coverage: 0, cappedBy: null, rawScore: 0 } }));
          }
        } catch (error) {
          // No database, or a read failed: the panel falls back to its
          // population defaults rather than the page failing. Nothing about
          // the person is logged here.
          console.warn("[finance.readiness] clinical sources unavailable:", error instanceof Error ? error.message.slice(0, 120) : "unknown");
        }
        const snapshot = parts.some(Boolean) ? mergeParts(parts) : EMPTY_SNAPSHOT;
        return { snapshot, profile: assessFinancialReadiness(snapshot, input ?? {}) };
      }),
  }),

  // ─── Paid public-edition entitlement ───────────────────────────────────────
  subscription: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await getSubscriptionForUser(ctx.user.id);
      const active = !!subscription && ["active", "trialing"].includes(subscription.status) &&
        (!subscription.currentPeriodEnd || subscription.currentPeriodEnd.getTime() >= Date.now());
      return {
        enabled: process.env.ENABLE_PAID_SUBSCRIPTIONS === "true",
        active,
        planId: subscription?.planId ?? null,
        status: subscription?.status ?? "inactive",
        currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      };
    }),
  }),

  // ─── HIPAA Consent ───────────────────────────────────────────────────────────
  consent: router({
    check: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input, ctx }) => {
        // Check by userId if logged in, else by sessionId
        if (ctx.user) {
          let consent = await getConsentByUserId(ctx.user.id);
          // If the user accepted the current consumer-health-data consent before
          // signing in, bind that same session consent to the authenticated account.
          if (!consent) {
            const sessionConsent = await getConsentBySession(input.sessionId);
            if (sessionConsent) {
              const db = await getDb();
              if (db) {
                await db.update(hipaaConsents)
                  .set({ userId: ctx.user.id })
                  .where(eq(hipaaConsents.id, sessionConsent.id));
                consent = { ...sessionConsent, userId: ctx.user.id };
              }
            }
          }
          const processors = (process.env.HEALTH_DATA_PROCESSORS || "").trim();
          const current = !!consent && !consent.withdrawnAt && consent.consentVersion === CONSUMER_HEALTH_CONSENT_VERSION && consent.agreedToTerms && consent.agreedToHipaa && consent.adult18Plus && (consent.processorDisclosureSnapshot || "").trim() === processors;
          return { hasSigned: current, consent };
        }
        const consent = await getConsentBySession(input.sessionId);
        const processors = (process.env.HEALTH_DATA_PROCESSORS || "").trim();
        const current = !!consent && !consent.withdrawnAt && consent.consentVersion === CONSUMER_HEALTH_CONSENT_VERSION && consent.agreedToTerms && consent.agreedToHipaa && consent.adult18Plus && (consent.processorDisclosureSnapshot || "").trim() === processors;
        return { hasSigned: current, consent };
      }),

    sign: publicProcedure
      .input(z.object({
        sessionId: z.string().min(8).max(128),
        isAdult: z.literal(true),
        agreedToTerms: z.literal(true),
        agreedToHealthData: z.literal(true),
        agreedToWellnessBoundary: z.literal(true),
        agreedToActivityLogging: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Legacy database column `agreedToHipaa` is retained for migration compatibility;
        // in the current consumer consent it stores affirmative health-data consent, not a claim
        // that HIPAA governs this direct-to-consumer deployment.
        const userAgent = ctx.req.headers["user-agent"] || "unknown";
        const processorDisclosureSnapshot = process.env.HEALTH_DATA_PROCESSORS || "";
        const consentSnapshot = JSON.stringify({
          version: CONSUMER_HEALTH_CONSENT_VERSION,
          adult18Plus: true,
          termsVersion: TERMS_OF_USE_VERSION,
          privacyVersion: PRIVACY_POLICY_VERSION,
          healthDataPolicyVersion: HEALTH_DATA_POLICY_VERSION,
          medicalDisclaimerVersion: MEDICAL_DISCLAIMER_VERSION,
          processorDisclosureSnapshot,
          wellnessBoundary: true,
          activityLoggingOptional: input.agreedToActivityLogging,
        });

        await saveHipaaConsent({
          userId: ctx.user?.id ?? null,
          sessionId: input.sessionId,
          ipAddress: null,
          userAgent,
          fullName: null,
          email: null,
          consentVersion: CONSUMER_HEALTH_CONSENT_VERSION,
          consentTextSnapshot: consentSnapshot,
          agreedToTerms: true,
          agreedToHipaa: true,
          agreedToActivityLogging: input.agreedToActivityLogging,
          adult18Plus: true,
          termsVersion: TERMS_OF_USE_VERSION,
          privacyVersion: PRIVACY_POLICY_VERSION,
          healthDataPolicyVersion: HEALTH_DATA_POLICY_VERSION,
          medicalDisclaimerVersion: MEDICAL_DISCLAIMER_VERSION,
          processorDisclosureSnapshot,
          signedAt: new Date(),
        });

        if (input.agreedToActivityLogging) {
          await logActivity({
            userId: ctx.user?.id ?? null,
            sessionId: input.sessionId,
            eventType: ACTIVITY_EVENTS.CONSENT_SIGNED,
            page: "/consent",
            metadata: { consentVersion: CONSUMER_HEALTH_CONSENT_VERSION },
            ipAddress: null,
            userAgent,
          });
        }

        return { success: true, consentVersion: CONSUMER_HEALTH_CONSENT_VERSION };
      }),

    withdraw: protectedProcedure
      .input(z.object({ reason: z.string().max(255).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const [latest] = await db.select().from(hipaaConsents)
          .where(eq(hipaaConsents.userId, ctx.user.id))
          .orderBy(desc(hipaaConsents.signedAt)).limit(1);
        if (!latest || latest.withdrawnAt) return { success: true, alreadyWithdrawn: true };
        await db.update(hipaaConsents).set({
          withdrawnAt: new Date(),
          withdrawalReason: input.reason?.trim() || "Consumer withdrew consent",
        }).where(eq(hipaaConsents.id, latest.id));
        return { success: true, alreadyWithdrawn: false };
      }),

    // Admin only
    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllConsents(500);
    }),
  }),

  // ─── Activity Logging ────────────────────────────────────────────────────────
  activity: router({
    log: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        eventType: z.string(),
        page: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const consent = ctx.user
          ? await getConsentByUserId(ctx.user.id)
          : await getConsentBySession(input.sessionId);
        if (!consent?.agreedToActivityLogging) {
          return { success: true, logged: false };
        }

        const userAgent = ctx.req.headers["user-agent"] || "unknown";
        // Product analytics are intentionally sparse. Do not accept arbitrary
        // client metadata on health/wellness events because it could silently
        // become sensitive health data in the telemetry table.
        const safeMetadata = input.metadata
          ? { keys: Object.keys(input.metadata).slice(0, 20), valueCount: Object.keys(input.metadata).length }
          : undefined;
        await logActivity({
          userId: ctx.user?.id ?? null,
          sessionId: input.sessionId,
          eventType: input.eventType.slice(0, 64),
          page: input.page?.slice(0, 256),
          metadata: safeMetadata,
          ipAddress: null,
          userAgent,
          referrer: null,
        });
        return { success: true, logged: true };
      }),

    myActivity: protectedProcedure.query(async ({ ctx }) => {
      return getActivityByUser(ctx.user.id, 200);
    }),

    // Admin only
    allLogs: protectedProcedure
      .input(z.object({ limit: z.number().default(500), offset: z.number().default(0) }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getAllActivityLogs(input.limit, input.offset);
      }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getActivityStats();
    }),
  }),

  // ─── Assessments ─────────────────────────────────────────────────────────────
  assessment: router({
    start: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const result = await createAssessment({
          userId: ctx.user.id,
          sessionId: input.sessionId,
          status: "in_progress",
          currentQuestionIndex: 0,
          answers: {},
        });
        return { id: (result as any).insertId };
      }),

    saveProgress: protectedProcedure
      .input(z.object({
        id: z.number(),
        currentQuestionIndex: z.number(),
        answers: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input, ctx }) => {
        const assessment = await getAssessmentById(input.id);
        if (!assessment || assessment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Assessment not found or not owned by this account" });
        }
        await updateAssessment(input.id, {
          currentQuestionIndex: input.currentQuestionIndex,
          answers: input.answers,
        });
        return { success: true };
      }),

    complete: protectedProcedure
      .input(z.object({
        id: z.number(),
        answers: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input, ctx }) => {
        const assessment = await getAssessmentById(input.id);
        if (!assessment || assessment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Assessment not found or not owned by this account" });
        }
        await updateAssessment(input.id, {
          status: "completed",
          answers: input.answers,
          completedAt: new Date(),
        });

        // Generate AI diagnostic report
        const diagnosisPrompt = `You are a clinician-facing psychiatric decision-support assistant analyzing an intake assessment for licensed-clinician review.
Based on the following DSM-5 intake responses, generate a differential diagnosis report.

Assessment answers (question_id: answer):
${JSON.stringify(input.answers, null, 2)}

Return a JSON object with:
{
  "provisionalDiagnoses": [array of up to 5 diagnoses, each with: code, name, confidence (0-100), criteriaMatched (array of strings), criteriaTotal (number), dsmLink (URL to DSM-5 criteria), description],
  "symptomProfile": {
    "domains": { "mood": 0-100, "anxiety": 0-100, "psychosis": 0-100, "trauma": 0-100, "ocd": 0-100, "adhd": 0-100, "substanceUse": 0-100, "somatic": 0-100, "sleep": 0-100, "eating": 0-100 },
    "severity": "mild|moderate|severe",
    "duration": "string",
    "onset": "string",
    "functionalImpairment": 0-100
  }
}
Return ONLY valid JSON.`;

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are a clinician-facing psychiatric decision-support assistant. Return only valid JSON and do not present the result as an autonomous diagnosis, prescription, or treatment order." },
            { role: "user", content: diagnosisPrompt },
          ],
          response_format: { type: "json_object" },
        });

        let reportData: { provisionalDiagnoses: ProvisionalDiagnosis[]; symptomProfile: SymptomProfile };
        try {
          const content = (aiResponse as any).choices?.[0]?.message?.content || "{}";
          reportData = JSON.parse(content);
        } catch {
          reportData = {
            provisionalDiagnoses: [],
            symptomProfile: {
              domains: { mood: 0, anxiety: 0, psychosis: 0, trauma: 0, ocd: 0, adhd: 0, substanceUse: 0, somatic: 0, sleep: 0, eating: 0 },
              severity: "mild",
              duration: "unknown",
              onset: "unknown",
              functionalImpairment: 0,
            },
          };
        }

        // ─── Update Digital Twin from assessment answers ───────────────────────
        if (ctx.user.id) {
          try {
            const answersAsNumbers: Record<string, number> = {};
            for (const [k, v] of Object.entries(input.answers)) {
              answersAsNumbers[k] = typeof v === "number" ? v : Number(v) || 2;
            }
            const newDomainScores = mapAssessmentToDomainScores(answersAsNumbers);
            const existingTwin = await getDigitalTwinByUserId(ctx.user.id);
            const prevScores: Record<string, number> = existingTwin
              ? (existingTwin.domainScores as Record<string, number>)
              : {};
            const composite = computeCompositeScore(newDomainScores);
            const prevComposite = existingTwin?.compositeScore ?? undefined;
            const state = classifyState(composite, newDomainScores, prevComposite);
            const newAlerts = generateAlerts(newDomainScores, prevScores);
            const existingAlerts = (existingTwin?.activeAlerts as DigitalTwinAlert[] ?? []).filter(a => !a.acknowledged);
            const allAlerts = [...existingAlerts, ...newAlerts].slice(-20);
            const snapshot: DigitalTwinSnapshot = {
              timestamp: new Date().toISOString(),
              domainScores: newDomainScores,
              compositeScore: composite,
              state,
              source: "assessment",
            };
            const history = [...(existingTwin?.trajectoryHistory as DigitalTwinSnapshot[] ?? []), snapshot].slice(-90);
            await upsertDigitalTwin(ctx.user.id, {
              domainScores: newDomainScores,
              compositeScore: composite,
              currentState: state,
              trajectoryHistory: history,
              activeAlerts: allAlerts,
              lastUpdateSource: "assessment",
              lastAssessmentId: input.id,
              lastUpdated: new Date(),
            });
          } catch (twinErr) {
            console.warn("[DigitalTwin] Failed to update twin:", twinErr);
          }
        }

        // ─── Compute Psychiatric Risk Score (PRS) ─────────────────────────────
        const PRS_DOMAINS = [
          { name: "Mood", weight: 0.20, symptomKey: "mood" },
          { name: "Anxiety", weight: 0.18, symptomKey: "anxiety" },
          { name: "Trauma", weight: 0.15, symptomKey: "trauma" },
          { name: "Psychotic", weight: 0.12, symptomKey: "psychosis" },
          { name: "Personality", weight: 0.12, symptomKey: "mood" }, // proxy via mood domain
          { name: "Substance", weight: 0.10, symptomKey: "substanceUse" },
          { name: "Neurodevelopmental", weight: 0.08, symptomKey: "adhd" },
          { name: "Somatic", weight: 0.05, symptomKey: "somatic" },
        ];
        const symptomDomains = reportData.symptomProfile?.domains ?? {};
        const prsBreakdown: Record<string, number> = {};
        let prsScore = 0;
        for (const d of PRS_DOMAINS) {
          // symptom score is 0-100 severity; PRS domain = 100 - severity (higher = healthier)
          const severity = (symptomDomains as Record<string, number>)[d.symptomKey] ?? 50;
          const domainHealth = Math.max(0, Math.min(100, 100 - severity));
          prsBreakdown[d.name] = domainHealth;
          prsScore += domainHealth * d.weight;
        }
        // Scale to 0-1000
        const finalPrsScore = Math.round(prsScore * 10);

        const reportResult = await createDiagnosticReport({
          assessmentId: input.id,
          userId: ctx.user.id,
          provisionalDiagnoses: reportData.provisionalDiagnoses || [],
          symptomProfile: reportData.symptomProfile,
          shareToken: null,
          sharedWithProvider: false,
          prsScore: finalPrsScore,
          prsBreakdown,
        });

        return { reportId: (reportResult as any).insertId };
      }),

    myAssessments: protectedProcedure.query(async ({ ctx }) => {
      return getAssessmentsByUser(ctx.user.id);
    }),
  }),

  // ─── Diagnostic Reports ───────────────────────────────────────────────────────
  report: router({
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const report = await getReportById(input.id);
        if (!report) return null;
        if (ctx.user.role !== "admin" && report.userId !== ctx.user.id) {
          const { recordAudit } = await import("./compliance/auditLog");
          await recordAudit({ actorId: ctx.user.id, subjectId: report.userId, action: "report.view", resourceType: "diagnostic_report", resourceId: report.id, outcome: "denied" });
          throw new TRPCError({ code: "FORBIDDEN", message: "Report not found or not owned by this account" });
        }
        const { recordAudit } = await import("./compliance/auditLog");
        await recordAudit({ actorId: ctx.user.id, subjectId: report.userId, action: "report.view", resourceType: "diagnostic_report", resourceId: report.id, outcome: "success" });
        return report;
      }),

    getByToken: publicProcedure
      .input(z.object({ token: z.string().min(24).max(128) }))
      .query(async ({ input }) => {
        const report = await getReportByShareToken(input.token);
        if (!report || !report.sharedWithProvider) return null;
        const { recordAudit } = await import("./compliance/auditLog");
        await recordAudit({ actorId: null, subjectId: report.userId, action: "report.shared_link_view", resourceType: "diagnostic_report", resourceId: report.id, outcome: "success", detail: { access: "bearer_share_token" } });
        return report;
      }),

    myReports: protectedProcedure.query(async ({ ctx }) => {
      return getReportsByUser(ctx.user.id);
    }),

    generateTreatment: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Clinician review permission required" });
        }
        const report = await getReportById(input.reportId);
        if (!report) throw new Error("Report not found");

        const diagnoses = Array.isArray(report.provisionalDiagnoses)
          ? (report.provisionalDiagnoses as any[]).map((d: any) => d.condition || d).join(", ")
          : String(report.provisionalDiagnoses || "unspecified psychiatric condition");

        const aiResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a clinician-facing evidence synthesis assistant. Produce a draft for review by an appropriately licensed clinician; never claim to be a psychiatrist and never present the output as an autonomous prescription or treatment order. Include supporting PubMed PMIDs or clinical guideline references where available.",
            },
            {
              role: "user",
              content: `Generate 6-8 clinician-review discussion options for a patient with the following provisional diagnoses: ${diagnoses}. For each recommendation include: category (pharmacotherapy, psychotherapy, lifestyle, or referral), title, description (2-3 sentences), evidenceLevel (A=RCT evidence, B=observational, C=expert consensus), and citations (array of PubMed PMIDs or guideline names).`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "treatment_recommendations",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["pharmacotherapy", "psychotherapy", "lifestyle", "referral"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        evidenceLevel: { type: "string", enum: ["A", "B", "C"] },
                        citations: { type: "array", items: { type: "string" } },
                      },
                      required: ["category", "title", "description", "evidenceLevel", "citations"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        });

        let treatments: TreatmentRecommendation[] = [];
        try {
          const content = (aiResponse as any).choices?.[0]?.message?.content || "{}";
          const parsed = JSON.parse(content);
          treatments = parsed.recommendations || [];
        } catch { treatments = []; }

        await updateReport(input.reportId, { treatmentRecommendations: treatments });
        return { treatments };
      }),

    share: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const report = await getReportById(input.reportId);
        if (!report) throw new Error("Report not found");
        if (ctx.user.role !== "admin" && report.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Report not found or not owned by this account" });
        }
        const shareToken = nanoid(32);
        await updateReport(input.reportId, { sharedWithProvider: true, shareToken });
        const { recordAudit } = await import("./compliance/auditLog");
        await recordAudit({ actorId: ctx.user.id, subjectId: report.userId, action: "report.share_enable", resourceType: "diagnostic_report", resourceId: report.id, outcome: "success" });
        return { shareToken, shareUrl: `/shared/${shareToken}` };
      }),

    revokeShare: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const report = await getReportById(input.reportId);
        if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
        if (ctx.user.role !== "admin" && report.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Report not found or not owned by this account" });
        }
        await updateReport(input.reportId, { sharedWithProvider: false, shareToken: null });
        const { recordAudit } = await import("./compliance/auditLog");
        await recordAudit({ actorId: ctx.user.id, subjectId: report.userId, action: "report.share_revoke", resourceType: "diagnostic_report", resourceId: report.id, outcome: "success" });
        return { success: true };
      }),
  }),

  // ─── PubMed Research ─────────────────────────────────────────────────────────
  research: router({
    search: protectedProcedure
      .input(z.object({ query: z.string().min(2).max(200), maxResults: z.number().int().min(1).max(25).default(10) }))
      .query(async ({ input }) => {
        try {
          const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(input.query)}&retmax=${input.maxResults}&retmode=json&sort=relevance`;
          const searchResp = await fetch(searchUrl);
          const searchData = await searchResp.json() as any;
          const ids: string[] = searchData?.esearchresult?.idlist || [];

          if (ids.length === 0) return { articles: [] };

          const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
          const summaryResp = await fetch(summaryUrl);
          const summaryData = await summaryResp.json() as any;

          const articles: PubmedArticle[] = ids.map(id => {
            const item = summaryData?.result?.[id];
            if (!item) return null;
            return {
              pmid: id,
              title: item.title || "Untitled",
              authors: (item.authors || []).slice(0, 3).map((a: any) => a.name),
              journal: item.fulljournalname || item.source || "",
              year: parseInt(item.pubdate?.split(" ")[0] || "0"),
              abstract: "",
              url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            };
          }).filter(Boolean) as PubmedArticle[];

          return { articles };
        } catch (err) {
          console.error("PubMed search error:", err);
          return { articles: [] };
        }
      }),

    forDiagnosis: adminProcedure
      .input(z.object({ diagnoses: z.array(z.string()), limit: z.number().default(5) }))
      .query(async ({ input }) => {
        const query = input.diagnoses.slice(0, 3).join(" OR ") + " treatment evidence-based";
        try {
          const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${input.limit}&retmode=json&sort=relevance`;
          const searchResp = await fetch(searchUrl);
          const searchData = await searchResp.json() as any;
          const ids: string[] = searchData?.esearchresult?.idlist || [];
          return { ids, query };
        } catch {
          return { ids: [], query };
        }
      }),
  }),

  // ─── Life Maps ───────────────────────────────────────────────────────────────
  lifeMaps: router({
    generate: adminProcedure
      .input(z.object({
        condition: z.string(),
        currentAge: z.number().min(10).max(80),
        currentTreatmentStatus: z.enum(["untreated", "partial", "treated"]),
      }))
      .mutation(async ({ input }) => {
        const prompt = `You are a clinician-facing health-outcomes decision-support assistant. Produce a draft for licensed-clinician review.
Generate a dual life trajectory simulation for a person with ${input.condition} who is currently ${input.currentAge} years old and is ${input.currentTreatmentStatus}.

Return JSON with two parallel timelines:
{
  "condition": "${input.condition}",
  "treated": { "milestones": [...] },
  "untreated": { "milestones": [...] }
}

Each milestones array covers ages from ${input.currentAge} to 80 in 5-year increments.
Each milestone: { age, qualityOfLife (0-100), careerStatus, relationshipStatus, healthStatus, financialStatus, keyEvent, riskLevel ("low"|"moderate"|"high"|"critical"), narrative (2 sentences describing life at this age) }

Make the contrast between treated and untreated vivid and clinically accurate.
Return ONLY valid JSON.`;

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are a clinician-facing psychiatric decision-support assistant. Return only valid JSON and do not present the result as an autonomous diagnosis, prescription, or treatment order." },
            { role: "user", content: prompt },
          ],
        });

        try {
          const content = (aiResponse as any).choices?.[0]?.message?.content || "{}";
          return JSON.parse(content);
        } catch {
          return { condition: input.condition, treated: { milestones: [] }, untreated: { milestones: [] } };
        }
      }),
  }),

  // ─── Life Events Engine ──────────────────────────────────────────────────────
  lifeEvents: router({
    analyze: adminProcedure
      .input(z.object({
        events: z.array(z.object({
          id: z.string(),
          name: z.string(),
          age: z.number(),
          category: z.string(),
        })),
        currentAge: z.number(),
        existingConditions: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `You are a clinician-facing decision-support assistant analyzing a life-event history. Produce a draft for licensed-clinician review.

Life events experienced:
${input.events.map(e => `- Age ${e.age}: ${e.name} (${e.category})`).join("\n")}

Current age: ${input.currentAge}
${input.existingConditions?.length ? `Existing conditions: ${input.existingConditions.join(", ")}` : ""}

Analyze this life event profile and return JSON:
{
  "overallRisk": "low"|"moderate"|"high"|"critical",
  "riskScore": 0-100,
  "growthScore": 0-100,
  "resilienceScore": 0-100,
  "domainRisks": { "depression": 0-100, "anxiety": 0-100, "ptsd": 0-100, "substanceUse": 0-100, "bipolar": 0-100, "ocd": 0-100 },
  "challengeZones": [ { "period": "age range string", "events": ["event names"], "risk": "description", "recommendation": "action" } ],
  "growthOpportunities": [ { "event": "event name", "opportunity": "description", "action": "specific recommendation" } ],
  "keyInsights": [ "insight string" (4 insights) ],
  "futureRisks": [ { "age": number, "event": "predicted life event", "probability": 0-100, "impact": "description" } (5 predictions) ],
  "narrative": "2-paragraph clinical narrative summarizing this person's life event profile and mental health trajectory"
}
Return ONLY valid JSON.`;

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are a clinician-facing psychiatric decision-support assistant. Return only valid JSON and do not present the result as an autonomous diagnosis, prescription, or treatment order." },
            { role: "user", content: prompt },
          ],
        });

        try {
          const content = (aiResponse as any).choices?.[0]?.message?.content || "{}";
          return JSON.parse(content);
        } catch {
          return {
            overallRisk: "moderate",
            riskScore: 50,
            growthScore: 50,
            resilienceScore: 50,
            domainRisks: { depression: 50, anxiety: 50, ptsd: 30, substanceUse: 20, bipolar: 20, ocd: 20 },
            challengeZones: [],
            growthOpportunities: [],
            keyInsights: ["Analysis unavailable. Please try again."],
            futureRisks: [],
            narrative: "Unable to generate analysis at this time.",
          };
        }
      }),
  }),

  // ─── Digital Twin Mental Health Model ────────────────────────────────────────
  digitalTwin: router({
    // Get the current user's digital twin (or create default if none exists)
    getMyTwin: protectedProcedure.query(async ({ ctx }) => {
      let twin = await getDigitalTwinByUserId(ctx.user.id);
      if (!twin) {
        // Initialize with neutral scores
        const defaultScores: Record<string, number> = {};
        for (const d of TWIN_DOMAINS) defaultScores[d.id] = 50;
        await upsertDigitalTwin(ctx.user.id, {
          domainScores: defaultScores,
          compositeScore: 50,
          currentState: "stable",
          trajectoryHistory: [],
          activeAlerts: [],
          lastUpdateSource: "initialization",
        });
        twin = await getDigitalTwinByUserId(ctx.user.id);
      }
      return { twin, domains: TWIN_DOMAINS };
    }),

    // Get trajectory history for charts
    getTwinHistory: protectedProcedure
      .input(z.object({ days: z.number().min(7).max(365).default(30) }))
      .query(async ({ ctx, input }) => {
        const twin = await getDigitalTwinByUserId(ctx.user.id);
        if (!twin) return { history: [], domains: TWIN_DOMAINS };
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - input.days);
        const history = (twin.trajectoryHistory as DigitalTwinSnapshot[] ?? [])
          .filter(s => new Date(s.timestamp) >= cutoff)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return { history, domains: TWIN_DOMAINS };
      }),

    // Acknowledge an alert
    acknowledgeAlert: protectedProcedure
      .input(z.object({ alertId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const twin = await getDigitalTwinByUserId(ctx.user.id);
        if (!twin) throw new Error("Digital twin not found");
        const alerts = (twin.activeAlerts as DigitalTwinAlert[] ?? []).map(a =>
          a.id === input.alertId ? { ...a, acknowledged: true } : a
        );
        await upsertDigitalTwin(ctx.user.id, { activeAlerts: alerts });
        return { success: true };
      }),

    // Manual update from journal/checkin (partial domain update)
    updateFromJournal: protectedProcedure
      .input(z.object({
        moodScore: z.number().min(1).max(10).optional(),
        anxietyScore: z.number().min(1).max(10).optional(),
        sleepHours: z.number().min(0).max(24).optional(),
        socialInteraction: z.number().min(1).max(5).optional(),
        note: z.string().max(2000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const twin = await getDigitalTwinByUserId(ctx.user.id);
        const prevScores: Record<string, number> = twin ? (twin.domainScores as Record<string, number>) : {};
        const newScores = { ...prevScores };

        // Map journal inputs to domain score adjustments
        if (input.moodScore !== undefined) {
          newScores.moodRegulation = Math.round((input.moodScore / 10) * 100);
        }
        if (input.anxietyScore !== undefined) {
          // Anxiety score is inverted (higher anxiety = lower health)
          newScores.anxietyManagement = Math.round(((10 - input.anxietyScore) / 10) * 100);
        }
        if (input.sleepHours !== undefined) {
          // Optimal sleep 7-9 hours
          const sleepScore = input.sleepHours >= 7 && input.sleepHours <= 9 ? 90
            : input.sleepHours >= 6 ? 70
            : input.sleepHours >= 5 ? 50
            : 30;
          newScores.sleepQuality = sleepScore;
        }
        if (input.socialInteraction !== undefined) {
          newScores.socialEngagement = Math.round((input.socialInteraction / 5) * 100);
        }

        const composite = computeCompositeScore(newScores);
        const prevComposite = twin ? (twin.compositeScore ?? 50) : 50;
        const state = classifyState(composite, newScores, prevComposite);
        const newAlerts = generateAlerts(newScores, prevScores);
        const existingAlerts = (twin?.activeAlerts as DigitalTwinAlert[] ?? []).filter(a => !a.acknowledged);
        const allAlerts = [...existingAlerts, ...newAlerts].slice(-20); // keep last 20

        const snapshot: DigitalTwinSnapshot = {
          timestamp: new Date().toISOString(),
          domainScores: newScores,
          compositeScore: composite,
          state,
          source: "journal",
        };
        const history = [...(twin?.trajectoryHistory as DigitalTwinSnapshot[] ?? []), snapshot].slice(-90);

        await upsertDigitalTwin(ctx.user.id, {
          domainScores: newScores,
          compositeScore: composite,
          currentState: state,
          trajectoryHistory: history,
          activeAlerts: allAlerts,
          lastUpdateSource: "journal",
          lastUpdated: new Date(),
        });

        return { twin: await getDigitalTwinByUserId(ctx.user.id), newAlerts };
      }),
  }),

  // ─── Mood Journal ───────────────────────────────────────────────────────────
  journal: router({
    create: protectedProcedure
      .input(z.object({
        content: z.string().min(1).max(5000),
        moodScore: z.number().min(1).max(10).optional(),
        triggers: z.array(z.string()).optional(),
        sleepHours: z.number().min(0).max(24).optional(),
        anxietyRating: z.number().min(1).max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (PUBLIC_WELLNESS_MODE) {
          const entryId = await createJournalEntry({
            userId: ctx.user.id,
            content: input.content,
            moodScore: input.moodScore ?? null,
            emotionTags: [],
            sentimentDimensions: {},
            riskFlagged: false,
            riskIndicatorsFound: [],
            aiInsight: "",
            moodTrend: "Self-recorded",
            triggers: input.triggers ?? null,
            sleepHours: input.sleepHours ?? null,
            anxietyRating: input.anxietyRating ?? null,
          });
          return { entryId, emotionTags: [], sentimentDimensions: {}, moodTrend: "Self-recorded", aiInsight: "", riskFlagged: false };
        }

        // Clinical deployment only: configured risk-analysis workflow.
        const RISK_INDICATORS = [
          "want to die", "end my life", "no point in living", "hurt myself",
          "nobody cares", "can't go on", "plan to end", "goodbye forever",
          "giving up", "worthless",
        ];
        const lowerContent = input.content.toLowerCase();
        const riskFound = RISK_INDICATORS.filter(r => lowerContent.includes(r));
        const riskFlagged = riskFound.length > 0;

        // Use LLM to analyze sentiment and generate insight
        const analysisResult = await invokeLLM({
          messages: [
            { role: "system", content: "You are a clinician-facing journal-analysis assistant. Return only valid JSON and do not claim to be a psychologist or make an autonomous diagnosis." },
            { role: "user", content: `Analyze this journal entry and return JSON with keys: emotionTags (array of 3-5 emotions from: hopeless,anxious,grateful,angry,sad,joyful,frustrated,calm,overwhelmed,excited,lonely,guilty,hopeful,irritable,content,ashamed,nervous,relieved,confused,proud), sentimentDimensions (object with valence,arousal,dominance,clarity,resilience each 0-100), moodTrend (one of: Stable Positive,Stable Negative,Improving,Declining,Volatile,Neutral), aiInsight (2-3 sentence compassionate reflection on the entry).\n\nJournal entry: ${input.content}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "journal_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  emotionTags: { type: "array", items: { type: "string" } },
                  sentimentDimensions: {
                    type: "object",
                    properties: {
                      valence: { type: "number" }, arousal: { type: "number" },
                      dominance: { type: "number" }, clarity: { type: "number" }, resilience: { type: "number" },
                    },
                    required: ["valence", "arousal", "dominance", "clarity", "resilience"],
                    additionalProperties: false,
                  },
                  moodTrend: { type: "string" },
                  aiInsight: { type: "string" },
                },
                required: ["emotionTags", "sentimentDimensions", "moodTrend", "aiInsight"],
                additionalProperties: false,
              },
            },
          },
        });

        let emotionTags: string[] = [];
        let sentimentDimensions: Record<string, number> = {};
        let moodTrend = "Neutral";
        let aiInsight = "";
        try {
          const parsed = JSON.parse((analysisResult as any).choices?.[0]?.message?.content || "{}");
          emotionTags = parsed.emotionTags || [];
          sentimentDimensions = parsed.sentimentDimensions || {};
          moodTrend = parsed.moodTrend || "Neutral";
          aiInsight = parsed.aiInsight || "";
        } catch { /* use defaults */ }

        const entryId = await createJournalEntry({
          userId: ctx.user.id,
          content: input.content,
          moodScore: input.moodScore ?? null,
          emotionTags,
          sentimentDimensions,
          riskFlagged,
          riskIndicatorsFound: riskFound,
          aiInsight,
          moodTrend,
          triggers: input.triggers ?? null,
          sleepHours: input.sleepHours ?? null,
          anxietyRating: input.anxietyRating ?? null,
        });

        // If risk flagged, notify owner
        if (riskFlagged) {
          try {
            const { notifyOwner } = await import("./_core/notification");
            await notifyOwner({
              title: "⚠️ Crisis Risk Indicator Detected in Journal",
              content: `User ${ctx.user.id} journal entry flagged for risk indicators: ${riskFound.join(", ")}`,
            });
          } catch { /* non-blocking */ }
        }

        return { entryId, emotionTags, sentimentDimensions, moodTrend, aiInsight, riskFlagged };
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(30) }))
      .query(async ({ ctx, input }) => {
        return getJournalEntriesByUser(ctx.user.id, input.limit);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const entry = await getJournalEntryById(input.id);
        if (!entry || entry.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        return entry;
      }),
  }),

  // ─── Wellness Plans ──────────────────────────────────────────────────────────
  wellness: router({
    generate: protectedProcedure
      .input(z.object({
        diagnoses: z.array(z.string()).min(1),
        focusAreas: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: "You are a clinician-facing planning assistant. Create a draft 30-day supportive routine for licensed-clinician review. Do not claim to be a psychologist and do not issue medical orders. Return only valid JSON." },
            { role: "user", content: `Create a personalized 30-day wellness plan for someone with: ${input.diagnoses.join(", ")}. Focus areas: ${(input.focusAreas || ["sleep", "exercise", "mindfulness"]).join(", ")}. Return JSON with: title (string), weeklyThemes (array of 4 strings), categories (array of 6 category names), weeks (array of 4 objects, each with: week number, theme, days array of 7 objects each with: day number, actions array of 2-3 objects each with: type, title, description, durationMinutes).` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "wellness_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  weeklyThemes: { type: "array", items: { type: "string" } },
                  categories: { type: "array", items: { type: "string" } },
                  weeks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        week: { type: "number" },
                        theme: { type: "string" },
                        days: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              day: { type: "number" },
                              actions: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    type: { type: "string" },
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    durationMinutes: { type: "number" },
                                  },
                                  required: ["type", "title", "description", "durationMinutes"],
                                  additionalProperties: false,
                                },
                              },
                            },
                            required: ["day", "actions"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["week", "theme", "days"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "weeklyThemes", "categories", "weeks"],
                additionalProperties: false,
              },
            },
          },
        });

        let planData: Record<string, unknown> = {};
        let title = "Personalized 30-Day Wellness Plan";
        let weeklyThemes: string[] = [];
        let categories: string[] = [];
        try {
          const parsed = JSON.parse((result as any).choices?.[0]?.message?.content || "{}");
          planData = parsed;
          title = parsed.title || title;
          weeklyThemes = parsed.weeklyThemes || [];
          categories = parsed.categories || [];
        } catch { /* use defaults */ }

        const planId = await createWellnessPlan({
          userId: ctx.user.id,
          title,
          diagnoses: input.diagnoses,
          planData,
          weeklyThemes,
          categories,
          completedActions: [],
          adherenceScore: 0,
          isActive: true,
        });

        return { planId, title, weeklyThemes, categories, planData };
      }),

    getActive: protectedProcedure.query(async ({ ctx }) => {
      return getActiveWellnessPlan(ctx.user.id);
    }),

    markActionComplete: protectedProcedure
      .input(z.object({ planId: z.number(), actionKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const plan = await getActiveWellnessPlan(ctx.user.id);
        if (!plan || plan.id !== input.planId) throw new Error("Plan not found");
        const completed = [...((plan.completedActions as string[]) || []), input.actionKey];
        const uniqueCompleted = Array.from(new Set(completed));
        // Estimate total actions: 4 weeks × 7 days × 2.5 avg actions = ~70
        const adherenceScore = Math.min(100, Math.round((uniqueCompleted.length / 70) * 100));
        await updateWellnessPlan(input.planId, { completedActions: uniqueCompleted, adherenceScore });
        return { adherenceScore, completedCount: uniqueCompleted.length };
      }),
  }),

  // ─── Medication Tracker ──────────────────────────────────────────────────────
  medications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getMedicationsByUser(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        genericName: z.string().optional(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        prescribedFor: z.string().optional(),
        prescribedBy: z.string().optional(),
        startDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createMedication({ ...input, userId: ctx.user.id, isActive: true });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const owned = (await getMedicationsByUser(ctx.user.id)).some((m) => m.id === input.id);
        if (!owned) throw new TRPCError({ code: "NOT_FOUND" });
        const { id, ...data } = input;
        await updateMedication(id, data);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const owned = (await getMedicationsByUser(ctx.user.id)).some((m) => m.id === input.id);
        if (!owned) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteMedication(input.id);
        return { success: true };
      }),

    logTaken: protectedProcedure
      .input(z.object({
        medicationId: z.number(),
        skipped: z.boolean().default(false),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const owned = (await getMedicationsByUser(ctx.user.id)).some((m) => m.id === input.medicationId);
        if (!owned) throw new TRPCError({ code: "NOT_FOUND" });
        const id = await logMedicationTaken({ ...input, userId: ctx.user.id });
        return { id };
      }),

    getLogs: protectedProcedure.query(async ({ ctx }) => {
      return getMedicationLogs(ctx.user.id);
    }),

    checkInteractions: adminProcedure
      .input(z.object({ medications: z.array(z.string()).min(2) }))
      .mutation(async ({ input }) => {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: "You are a clinician-facing medication-information assistant. Return only valid JSON; this is a draft for licensed pharmacist/prescriber review, not an autonomous interaction determination or medication order." },
            { role: "user", content: `Check for drug interactions between these medications: ${input.medications.join(", ")}. Return JSON with: interactions (array of objects with: drug1, drug2, severity (mild/moderate/severe), description, recommendation), overallRisk (low/moderate/high), summary (2-3 sentences).` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "drug_interactions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  interactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        drug1: { type: "string" }, drug2: { type: "string" },
                        severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                        description: { type: "string" }, recommendation: { type: "string" },
                      },
                      required: ["drug1", "drug2", "severity", "description", "recommendation"],
                      additionalProperties: false,
                    },
                  },
                  overallRisk: { type: "string", enum: ["low", "moderate", "high"] },
                  summary: { type: "string" },
                },
                required: ["interactions", "overallRisk", "summary"],
                additionalProperties: false,
              },
            },
          },
        });
        try {
          return JSON.parse((result as any).choices?.[0]?.message?.content || "{}");
        } catch { return { interactions: [], overallRisk: "low", summary: "Unable to analyze interactions." }; }
      }),
  }),

    advisory: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(4000),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).max(20).optional().default([]),
        supportMode: z.enum(["friend", "therapist", "psychiatrist"]).optional().default("friend"),
        module: z.object({
          id: z.string().max(80),
          name: z.string().max(120),
          goal: z.string().max(1200),
        }).optional(),
        privacy: z.object({
          ephemeral: z.boolean(),
          memoryEnabled: z.boolean(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireCurrentConsumerConsent(ctx.user.id);
        if (process.env.HIPAA_DEPLOYMENT_MODE === "baa" && process.env.HIPAA_BAA_CONFIRMED !== "true") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "AI processing is disabled in HIPAA/BAA mode until the external AI processor agreement is confirmed by the deployment operator.",
          });
        }

        const modeInstructions = {
          friend: `FRIEND ZONE COMMUNICATION STYLE: Be warm, natural, concise, encouraging and plainspoken. Use everyday language and gentle curiosity. Do not claim friendship, human feelings, therapy, diagnosis, or clinical authority. Favor reflection, agency and one practical next step.`,
          therapist: `THERAPIST ZONE COMMUNICATION STYLE: Use structured reflective listening, careful open questions, values clarification, coping-skill education and pattern exploration. This is therapist-style communication only: do not claim to be a therapist, do not provide psychotherapy, diagnose, or issue a treatment plan. Keep the user in control of interpretations.`,
          psychiatrist: `PSYCHIATRIST ZONE COMMUNICATION STYLE: Use precise, clinically literate educational language and help the user organize questions for a licensed clinician. Explain psychiatric concepts and medication classes only at a general educational level. Do not diagnose, prescribe, recommend a personal medication choice, dose, taper, start/stop, or imply you are a psychiatrist.`,
        }[input.supportMode];

        const moduleInstructions = input.module
          ? `
ACTIVE SUPPORT ENGINE: ${input.module.name} (${input.module.id}). Purpose: ${input.module.goal}. Apply this mechanism as a user-directed reflection exercise. Do not convert it into diagnosis or treatment.`
          : "";

        const systemContent = `You are Doctor Buddy, an AI support and health-education tool. You are software, not a human friend, therapist, psychiatrist, physician or other licensed professional. Never say or imply otherwise.

${modeInstructions}${moduleInstructions}

CORE SAFETY BOUNDARIES:
- Do not diagnose the user or another person.
- Do not prescribe, recommend individualized medication changes, provide dosing/taper instructions, or tell a user to start/stop medication.
- Do not claim clinical-grade accuracy or equivalence to professional care.
- Do not make disease-treatment claims for a wellness exercise.
- When a user asks about health conditions or treatments, provide general education and encourage discussion with an appropriately licensed professional for individualized decisions.
- If the user expresses imminent danger, suicidal intent/plan, or immediate risk of serious harm, prioritize immediate human help (988/911 in the U.S. or local emergency services) and simple safety-focused language.
- Respect uncertainty. Separate facts, possibilities, and user interpretations.
- Default to the minimum necessary personal detail and do not ask for identifiers unless the task truly requires them.

Respond to the user's actual request. For reflection modules, produce a useful structured exercise plus one small optional next step. Do not append repetitive legal disclaimers to every paragraph; one brief boundary reminder is enough when medically relevant.`;

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemContent },
          ...input.history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: input.message },
        ];
        const result = await invokeLLM({ messages });
        const response = (result as any)?.choices?.[0]?.message?.content ||
          "I'm unable to process your request at this time. Please try again.";
        return { response };
      }),
  }),

  // ─── Doctor Buddy adaptive support companion ────────────────────────────────
  drBuddy: router({
    // Patient-facing: send a message to Dr. Buddy
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(4000),
        sessionId: z.number().nullable().optional(),
        supportMode: z.enum(["friend", "therapist", "psychiatrist"]).optional().default("friend"),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
          timestamp: z.string(),
        })).max(20).optional().default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireCurrentConsumerConsent(ctx.user.id);
        if (process.env.HIPAA_DEPLOYMENT_MODE === "baa" && process.env.HIPAA_BAA_CONFIRMED !== "true") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "AI processing is disabled in HIPAA/BAA mode until the external AI processor agreement is confirmed by the deployment operator.",
          });
        }
        const { drBuddyChat, emitBrainEvent } = await import("./drBuddy");
        const result = await drBuddyChat(
          ctx.user.id,
          input.sessionId ?? null,
          input.message,
          input.supportMode,
          input.history
        );
        // Emit conversation event to UnifiedDataBus
        if (result.crisisDetected) {
          await emitBrainEvent(ctx.user.id, "dr-buddy", "conversation", "crisis_detected", {
            // Minimum-necessary audit event: do not duplicate raw crisis text in telemetry.
            messageLength: input.message.length,
            supportMode: input.supportMode,
          });
        }
        return result;
      }),

    // Get or create a Dr. Buddy session
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (input.sessionId) {
          const [session] = await db.select().from(drBuddySessions)
            .where(and(eq(drBuddySessions.id, input.sessionId), eq(drBuddySessions.userId, ctx.user.id)))
            .limit(1);
          return session ?? null;
        }
        // Return most recent session
        const [latest] = await db.select().from(drBuddySessions)
          .where(eq(drBuddySessions.userId, ctx.user.id))
          .orderBy(desc(drBuddySessions.updatedAt))
          .limit(1);
        return latest ?? null;
      }),

    // Save session messages
    saveSession: protectedProcedure
      .input(z.object({
        sessionId: z.number().nullable(),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
          timestamp: z.string(),
          crisisFlag: z.boolean().optional(),
        })),
        title: z.string().optional(),
        sessionType: z.enum(["general", "condition_specific", "treatment_planning", "crisis", "medication_review", "progress_review"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const crisisEscalated = input.messages.some((m) => m.crisisFlag);
        if (input.sessionId) {
          await db.update(drBuddySessions)
            .set({ messages: input.messages as any, updatedAt: new Date(), crisisEscalated })
            .where(and(eq(drBuddySessions.id, input.sessionId), eq(drBuddySessions.userId, ctx.user.id)));
          return { sessionId: input.sessionId };
        }
        const [result] = await db.insert(drBuddySessions).values({
          userId: ctx.user.id,
          title: input.title ?? `Session ${new Date().toLocaleDateString()}`,
          messages: input.messages as any,
          sessionType: input.sessionType ?? "general",
          crisisEscalated,
        });
        return { sessionId: (result as any).insertId };
      }),

    // Get patient context summary (for widget header)
    getPatientContext: protectedProcedure
      .query(async ({ ctx }) => {
        const { synthesizePatientContext } = await import("./drBuddy");
        const context = await synthesizePatientContext(ctx.user.id);
        return { context };
      }),

    // Emit a brain event from the frontend
    emitEvent: protectedProcedure
      .input(z.object({
        featureId: z.string(),
        category: z.string(),
        eventType: z.string(),
        payload: z.record(z.string(), z.unknown()),
      }))
      .mutation(async ({ input, ctx }) => {
        const { emitBrainEvent } = await import("./drBuddy");
        await emitBrainEvent(ctx.user.id, input.featureId, input.category, input.eventType, input.payload);
        return { ok: true };
      }),

    // Doctor Portal: get AI Whisperer suggestions for a patient
    getWhispererSuggestions: protectedProcedure
      .input(z.object({ patientUserId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { generateWhispererSuggestions } = await import("./drBuddy");
        const suggestions = await generateWhispererSuggestions(input.patientUserId);
        return { suggestions };
      }),

    // Doctor Portal: get all patients assigned to this doctor
    getDoctorPatients: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) return [];
        return db.select().from(doctorPatients)
          .where(eq(doctorPatients.doctorUserId, ctx.user.id));
      }),
    // Doctor Portal: update clinical notes for a patient
    updateClinicalNotes: protectedProcedure
      .input(z.object({ patientUserId: z.number(), notes: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(doctorPatients)
          .set({ clinicalNotes: input.notes })
          .where(and(eq(doctorPatients.doctorUserId, ctx.user.id), eq(doctorPatients.patientUserId, input.patientUserId)));
        return { success: true };
      }),
    // Doctor Portal: get detailed patient info (assessments, Digital Twin, PRS)
    logCrisisEvent: publicProcedure
      .input(z.object({
        tier: z.enum(["tier1_emergency", "tier2_high_risk", "tier3_elevated"]),
        triggerText: z.string().optional(),
        triggerSource: z.string().optional(),
        matchedKeywords: z.array(z.string()).optional(),
        deescalationUsed: z.boolean().optional(),
        nearestErShown: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(crisisEvents).values({
          userId: ctx.user?.id ?? null,
          tier: input.tier,
          // Do not duplicate raw crisis statements or matched phrases into the
          // event table in the public product. The UI can offer resources without
          // creating an additional sensitive record.
          triggerText: null,
          triggerSource: input.triggerSource?.slice(0, 64),
          matchedKeywords: [],
          deescalationUsed: input.deescalationUsed ?? false,
          nearestErShown: input.nearestErShown ?? false,
        });
        return { logged: true };
      }),

    getPatientDetail: protectedProcedure
      .input(z.object({ patientUserId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Get patient's assessments
        const patientAssessments = await db.select().from(assessments)
          .where(eq(assessments.userId, input.patientUserId))
          .orderBy(desc(assessments.createdAt))
          .limit(10);
        // Get patient's diagnostic reports
        const patientReports = await db.select().from(diagnosticReports)
          .where(eq(diagnosticReports.userId, input.patientUserId))
          .orderBy(desc(diagnosticReports.createdAt))
          .limit(10);
        // Get patient's Digital Twin
        const patientTwin = await db.select().from(digitalTwins)
          .where(eq(digitalTwins.userId, input.patientUserId))
          .limit(1);
        // Get patient's crisis events
        const patientCrisis = await db.select().from(crisisEvents)
          .where(eq(crisisEvents.userId, input.patientUserId))
          .orderBy(desc(crisisEvents.createdAt))
          .limit(20);
        // Get patient's user info
        const patientUser = await db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
          .from(users)
          .where(eq(users.id, input.patientUserId))
          .limit(1);
        return {
          user: patientUser[0] ?? null,
          assessments: patientAssessments,
          reports: patientReports,
          twin: patientTwin[0] ?? null,
          crisisEvents: patientCrisis,
        };
      }),
  }),
  // ─── EduGenius+ ──────────────────────────────────────────────────────────

  clinicianReview: router({
    getReports: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = (await getDb())!;
        const { diagnosticReports, users } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        let query = db.select({
          id: diagnosticReports.id,
          userId: diagnosticReports.userId,
          reviewStatus: diagnosticReports.reviewStatus,
          provisionalDiagnoses: diagnosticReports.provisionalDiagnoses,
          prsScore: diagnosticReports.prsScore,
          createdAt: diagnosticReports.createdAt,
          reviewedAt: diagnosticReports.reviewedAt,
          reviewNotes: diagnosticReports.reviewNotes,
        }).from(diagnosticReports).orderBy(desc(diagnosticReports.createdAt)).limit(50);
        const results = await query;
        return results;
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        reportId: z.number(),
        status: z.enum(["under_review", "approved", "rejected", "requires_revision"]),
        notes: z.string().optional(),
        signature: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = (await getDb())!;
        const { diagnosticReports } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(diagnosticReports).set({
          reviewStatus: input.status,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.notes || null,
          clinicianSignature: input.signature || null,
        }).where(eq(diagnosticReports.id, input.reportId));
        const [report] = await db.select({ userId: diagnosticReports.userId }).from(diagnosticReports).where(eq(diagnosticReports.id, input.reportId)).limit(1);
        const { recordAudit } = await import("./compliance/auditLog");
        await recordAudit({ actorId: ctx.user.id, subjectId: report?.userId ?? null, action: `report.review.${input.status}`, resourceType: "diagnostic_report", resourceId: input.reportId, outcome: "success" });
        return { success: true };
      }),
    getReportReviewStatus: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = (await getDb())!;
        const { diagnosticReports } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [report] = await db.select({
          userId: diagnosticReports.userId,
          reviewStatus: diagnosticReports.reviewStatus,
          reviewedAt: diagnosticReports.reviewedAt,
          reviewNotes: diagnosticReports.reviewNotes,
          clinicianSignature: diagnosticReports.clinicianSignature,
        }).from(diagnosticReports).where(eq(diagnosticReports.id, input.reportId)).limit(1);
        if (report && ctx.user.role !== "admin" && report.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Report not found or not owned by this account" });
        }
        return report || null;
      }),
  }),

  openRouter: router({
    /** Chat with automatic project-based model routing + Mem0 context */
    chat: adminProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        project: z.enum(["root", "dr_buddy", "russell_capital", "church", "weight_loss", "edu_genius", "med_freedom", "genome"]).default("root"),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        max_tokens: z.number().optional(),
        injectMem0Context: z.boolean().default(true),
        persistToMem0: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const { OpenRouterBus } = await import("./openrouter");
        const router = OpenRouterBus.getInstance();
        const result = await router.chatWithFallback({
          messages: input.messages,
          project: input.project as any,
          model: input.model,
          temperature: input.temperature,
          max_tokens: input.max_tokens,
          injectMem0Context: input.injectMem0Context,
          persistToMem0: input.persistToMem0,
        });
        return {
          content: result.choices?.[0]?.message?.content || "",
          model: result.model,
          provider: result.provider,
          usage: result.usage,
        };
      }),

    /** List available models */
    listModels: adminProcedure
      .query(async () => {
        const { OpenRouterBus } = await import("./openrouter");
        const router = OpenRouterBus.getInstance();
        const models = await router.listModels();
        return models.slice(0, 50).map(m => ({
          id: m.id,
          name: m.name,
          pricing: m.pricing,
          contextLength: m.context_length,
        }));
      }),

    /** Get credit balance */
    getCredits: adminProcedure
      .query(async () => {
        const { OpenRouterBus } = await import("./openrouter");
        const router = OpenRouterBus.getInstance();
        return router.getCredits();
      }),

    /** Get session stats */
    getStats: adminProcedure
      .query(async () => {
        const { OpenRouterBus } = await import("./openrouter");
        const router = OpenRouterBus.getInstance();
        return router.getStats();
      }),

    /** Validate API key */
    validate: adminProcedure
      .query(async () => {
        const { OpenRouterBus } = await import("./openrouter");
        const router = OpenRouterBus.getInstance();
        return { valid: await router.validate() };
      }),
  }),

  mcs: router({
    calculate: protectedProcedure
      .input(z.object({
        triggerSource: z.enum(["therapy_start", "therapy_end", "journal", "assessment", "checkin", "manual"]),
        referenceId: z.number().optional(),
        referenceType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { calculateMCS, saveMentalCreditScore, getLatestMCS } = await import("./db");
        const { score, riskZone, breakdown } = await calculateMCS(ctx.user.id);
        const previous = await getLatestMCS(ctx.user.id);
        const delta = previous ? score - previous.score : 0;
        const id = await saveMentalCreditScore({
          userId: ctx.user.id,
          score,
          riskZone,
          breakdown,
          triggerSource: input.triggerSource,
          referenceId: input.referenceId ?? null,
          referenceType: input.referenceType ?? null,
          delta,
        });
        return { id, score, riskZone, breakdown, delta, previousScore: previous?.score ?? null };
      }),
    getScore: protectedProcedure.query(async ({ ctx }) => {
      const { getLatestMCS } = await import("./db");
      return await getLatestMCS(ctx.user.id);
    }),
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(30) }))
      .query(async ({ ctx, input }) => {
        const { getMCSHistory } = await import("./db");
        return await getMCSHistory(ctx.user.id, input.limit);
      }),
    recalculate: protectedProcedure.mutation(async ({ ctx }) => {
      const { calculateMCS } = await import("./db");
      const { score, riskZone, breakdown } = await calculateMCS(ctx.user.id);
      return { score, riskZone, breakdown };
    }),
  }),

  leads: router({
    // Capture email before starting assessment sessions
    capture: protectedProcedure
      .input(z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        agreedToContact: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Clinical lead/intake records are account-bound. Do not expose an
        // unauthenticated email-enumeration surface for sensitive intake data.
        const existing = await db.select().from(clientLeads).where(and(eq(clientLeads.email, input.email), eq(clientLeads.userId, ctx.user.id))).limit(1);
        if (existing.length > 0) {
          // Update and return existing lead
          await db.update(clientLeads).set({ fullName: input.fullName, lastActiveAt: new Date(), userId: ctx.user.id }).where(eq(clientLeads.id, existing[0].id));
          return { leadId: existing[0].id, isReturning: true, currentSession: existing[0].currentSession, sessionsCompleted: existing[0].sessionsCompleted || [] };
        }
        const [result] = await db.insert(clientLeads).values({
          userId: ctx.user.id,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone || null,
          agreedToContact: input.agreedToContact,
          lastActiveAt: new Date(),
        });
        return { leadId: result.insertId, isReturning: false, currentSession: 0, sessionsCompleted: [] };
      }),

    // Update session progress
    updateProgress: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        currentSession: z.number().min(1).max(4),
        completed: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const lead = await db.select().from(clientLeads).where(and(eq(clientLeads.id, input.leadId), eq(clientLeads.userId, ctx.user.id))).limit(1);
        if (!lead.length) throw new TRPCError({ code: "NOT_FOUND" });
        const sessionsCompleted = (lead[0].sessionsCompleted || []) as number[];
        if (input.completed && !sessionsCompleted.includes(input.currentSession)) {
          sessionsCompleted.push(input.currentSession);
        }
        await db.update(clientLeads).set({
          currentSession: input.currentSession,
          sessionsCompleted,
          lastActiveAt: new Date(),
        }).where(eq(clientLeads.id, input.leadId));
        return { success: true, sessionsCompleted };
      }),

    // Get lead by email (for resume)
    getByEmail: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const lead = await db.select().from(clientLeads).where(and(eq(clientLeads.email, input.email), eq(clientLeads.userId, ctx.user.id))).limit(1);
        if (!lead.length) return null;
        return lead[0];
      }),
  }),

  personality: router({
    // Start or resume a personality assessment
    startOrResume: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Check for existing incomplete profile
      const existing = await db.select().from(personalityProfiles).where(eq(personalityProfiles.userId, ctx.user.id)).orderBy(desc(personalityProfiles.createdAt)).limit(1);
      if (existing.length > 0 && !existing[0].completedAt) {
        const responses = await db.select().from(personalityResponses).where(eq(personalityResponses.profileId, existing[0].id)).limit(1);
        return { profileId: existing[0].id, lastQuestionIndex: responses[0]?.lastQuestionIndex || 0, isResume: true };
      }
      // Create new profile
      const [result] = await db.insert(personalityProfiles).values({ userId: ctx.user.id });
      const profileId = result.insertId;
      await db.insert(personalityResponses).values({ userId: ctx.user.id, profileId, responses: [] });
      return { profileId, lastQuestionIndex: 0, isResume: false };
    }),

    // Save progress (batch of responses)
    saveProgress: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        responses: z.array(z.object({
          questionId: z.number(),
          choiceLabel: z.string(),
          score: z.number(),
          dimension: z.string(),
          subdimension: z.string(),
          answeredAt: z.number(),
        })),
        lastQuestionIndex: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(personalityResponses)
          .set({ responses: input.responses, lastQuestionIndex: input.lastQuestionIndex })
          .where(and(eq(personalityResponses.profileId, input.profileId), eq(personalityResponses.userId, ctx.user.id)));
        return { saved: true, lastQuestionIndex: input.lastQuestionIndex };
      }),

    // Complete assessment — score, calibrate, generate narratives
    complete: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        responses: z.array(z.object({
          questionId: z.number(),
          choiceLabel: z.string(),
          score: z.number(),
          dimension: z.string(),
          subdimension: z.string(),
          answeredAt: z.number(),
        })),
        diagnoses: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Score Big Five (sum per dimension, 10 questions each, max 40)
        const dims: Record<string, number[]> = {};
        for (const r of input.responses) {
          if (!dims[r.dimension]) dims[r.dimension] = [];
          dims[r.dimension].push(r.score);
        }
        const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
        const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;

        const openness = sum(dims["openness"] || []);
        const conscientiousness = sum(dims["conscientiousness"] || []);
        const extraversion = sum(dims["extraversion"] || []);
        const agreeableness = sum(dims["agreeableness"] || []);
        const neuroticism = sum(dims["neuroticism"] || []);
        const cognitiveAnalytical = sum(dims["cognitive_style"] || []);
        const cognitiveDetail = sum((dims["cognitive_style"] || []).filter((_, i) => i >= 2));
        const commDirect = sum((dims["communication_style"] || []).filter((_, i) => i === 0 || i === 3));
        const commWritten = (dims["communication_style"] || [])[1] || 0;
        const commEmotional = (dims["communication_style"] || [])[2] || 0;

        // Score structural needs (average of 4 questions per need, scale 1-10)
        const needDims: Record<string, number[]> = {};
        for (const r of input.responses) {
          if (r.dimension === "structural_needs") {
            if (!needDims[r.subdimension]) needDims[r.subdimension] = [];
            needDims[r.subdimension].push(r.score);
          }
        }
        const needMap: Record<string, string> = {
          social_interaction_need: "needSocialInteraction",
          solitude_alone_time_need: "needSolitude",
          novelty_new_experiences_need: "needNovelty",
          routine_predictability_need: "needRoutine",
          sensory_stimulation_need: "needSensoryStimulation",
          emotional_security_need: "needEmotionalSecurity",
          autonomy_independence_need: "needAutonomy",
          connection_belonging_need: "needConnection",
          achievement_mastery_need: "needAchievement",
          creative_expression_need: "needCreativeExpression",
        };
        const needScores: Record<string, number> = {};
        for (const [sub, col] of Object.entries(needMap)) {
          needScores[col] = Math.round(avg(needDims[sub] || []) * 10) / 10;
        }

        // Mental health calibration
        const diagnoses = input.diagnoses || [];
        const calibrated: Record<string, number> = { ...needScores };
        if (diagnoses.some(d => d.toLowerCase().includes("depress"))) {
          calibrated.needSocialInteraction = Math.min(10, (calibrated.needSocialInteraction || 5) + 2);
          calibrated.needAchievement = Math.min(10, (calibrated.needAchievement || 5) + 1.5);
          calibrated.needConnection = Math.min(10, (calibrated.needConnection || 5) + 2);
        }
        if (diagnoses.some(d => d.toLowerCase().includes("anxi"))) {
          calibrated.needEmotionalSecurity = Math.min(10, (calibrated.needEmotionalSecurity || 5) + 2);
          calibrated.needRoutine = Math.min(10, (calibrated.needRoutine || 5) + 1.5);
          calibrated.needSocialInteraction = Math.min(10, (calibrated.needSocialInteraction || 5) + 1);
        }
        if (diagnoses.some(d => d.toLowerCase().includes("ptsd"))) {
          calibrated.needEmotionalSecurity = Math.min(10, (calibrated.needEmotionalSecurity || 5) + 3);
          calibrated.needAutonomy = Math.min(10, (calibrated.needAutonomy || 5) + 2);
        }
        if (diagnoses.some(d => d.toLowerCase().includes("adhd"))) {
          calibrated.needNovelty = Math.min(10, (calibrated.needNovelty || 5) + 2);
          calibrated.needSensoryStimulation = Math.min(10, (calibrated.needSensoryStimulation || 5) + 2);
          calibrated.needAchievement = Math.min(10, (calibrated.needAchievement || 5) + 1.5);
        }
        if (diagnoses.some(d => d.toLowerCase().includes("bipolar"))) {
          calibrated.needRoutine = Math.min(10, (calibrated.needRoutine || 5) + 2);
          calibrated.needAutonomy = Math.min(10, (calibrated.needAutonomy || 5) + 1);
        }

        // Generate clinician-review personality narratives + support-needs/activity profiles via LLM
        const narrativePrompt = `You are a clinician-facing personality and wellness synthesis assistant. Generate a draft personality profile with dual life narratives, a support-needs framework, and activity profiles for human review. Do not claim to be a psychologist or therapist, and do not present this as diagnosis, psychotherapy, or a medical prescription.

PERSONALITY SCORES (0-40 scale):
Openness: ${openness}, Conscientiousness: ${conscientiousness}, Extraversion: ${extraversion}, Agreeableness: ${agreeableness}, Neuroticism: ${neuroticism}
Cognitive Style: Analytical=${cognitiveAnalytical}, Detail=${cognitiveDetail}
Communication: Direct=${commDirect}, Written=${commWritten}, Emotional=${commEmotional}

STRUCTURAL NEEDS (1-10 scale, calibrated for mental health):
Social Interaction: ${calibrated.needSocialInteraction || 5}, Solitude: ${calibrated.needSolitude || 5}, Novelty: ${calibrated.needNovelty || 5}, Routine: ${calibrated.needRoutine || 5}, Sensory Stimulation: ${calibrated.needSensoryStimulation || 5}, Emotional Security: ${calibrated.needEmotionalSecurity || 5}, Autonomy: ${calibrated.needAutonomy || 5}, Connection: ${calibrated.needConnection || 5}, Achievement: ${calibrated.needAchievement || 5}, Creative Expression: ${calibrated.needCreativeExpression || 5}

MENTAL HEALTH: ${diagnoses.length > 0 ? diagnoses.join(", ") : "None reported"}

Generate ALL of the following, tailored precisely to THIS personality profile:

1. DUAL NARRATIVES: "storyTrueSelf" (1-page, second person, who they are without mental health challenges) and "storyCurrentJourney" (1-page, second person, how challenges shape their experience).

2. INTERPRETATION: "interpretationNarrative" (2-paragraph personality summary).

3. NEEDS GAP ANALYSIS: For each of the 10 structural needs, estimate current fulfillment (1-10) and calculate the gap.

4. TRANSFORMATION ROADMAP: 5 stages from current state to flourishing, each with 2-3 goals.

5. SUPPORT-NEEDS FRAMEWORK: Draft daily/weekly options for human review:
  - Physical: exercise type suited to personality, duration in minutes, frequency per week, best time of day, 3-5 specific activities
  - Emotional: daily minutes of emotional connection, weekly hours, connection type (1-on-1 vs group), expression methods, support structures
  - Psychological: clinician-discussion topics and low-risk wellness practices (journaling style, mindfulness type), daily minutes, weekly hours
  - Financial: budgeting style for personality, stress management approach, weekly review minutes, key practices
  - Family Support: weekly hours needed, communication style, boundary type, quality time activities, support needs
  - Daily Schedule: recommended wake/sleep times, time blocks with activity, duration, and category
  - Weekly Schedule: 7 days with focus area and key activities

6. HEALTHY ACTIVITIES: 10-15 specific activities that ENERGIZE this personality type. Each with category, frequency, duration, energy impact (+1 to +10), and a personality-specific explanation of why it matters.

7. DRAINING ACTIVITIES: 10-15 specific activities/events that DEPLETE this personality type. Each with category, frequency they likely encounter it, duration of impact, energy drain (-1 to -10), and why it's particularly draining for their personality.

Be extremely specific and predictive. For example, don't say "exercise" — say "30-minute morning trail walks 4x/week" for a high-openness introvert, or "45-minute group HIIT classes 3x/week" for a high-extraversion achiever. Tailor EVERYTHING to the actual scores.`;

        const llmResponse = await invokeLLM({
          messages: [{ role: "user", content: narrativePrompt }],
          response_format: { type: "json_schema", json_schema: { name: "personality_full", strict: true, schema: {
            type: "object",
            properties: {
              storyTrueSelf: { type: "string" },
              storyCurrentJourney: { type: "string" },
              interpretationNarrative: { type: "string" },
              needsGapAnalysis: { type: "array", items: { type: "object", properties: { need: { type: "string" }, needLabel: { type: "string" }, rawScore: { type: "number" }, calibratedScore: { type: "number" }, currentFulfillment: { type: "number" }, gap: { type: "number" }, priority: { type: "string" }, recommendation: { type: "string" } }, required: ["need", "needLabel", "rawScore", "calibratedScore", "currentFulfillment", "gap", "priority", "recommendation"], additionalProperties: false } },
              transformationRoadmap: { type: "array", items: { type: "object", properties: { stage: { type: "number" }, title: { type: "string" }, timeframe: { type: "string" }, description: { type: "string" }, goals: { type: "array", items: { type: "object", properties: { goal: { type: "string" }, measurable: { type: "string" }, indicator: { type: "string" } }, required: ["goal", "measurable", "indicator"], additionalProperties: false } }, emotionalExperiences: { type: "array", items: { type: "string" } }, progressIndicators: { type: "array", items: { type: "string" } }, potentialSetbacks: { type: "array", items: { type: "string" } }, setbackHandling: { type: "string" }, personalityAdaptation: { type: "string" }, needsAlignment: { type: "string" }, status: { type: "string" } }, required: ["stage", "title", "timeframe", "description", "goals", "emotionalExperiences", "progressIndicators", "potentialSetbacks", "setbackHandling", "personalityAdaptation", "needsAlignment", "status"], additionalProperties: false } },
              needsPrescription: { type: "object", properties: {
                physical: { type: "object", properties: { exerciseType: { type: "string" }, durationMinutes: { type: "number" }, frequencyPerWeek: { type: "number" }, bestTimeOfDay: { type: "string" }, specificActivities: { type: "array", items: { type: "string" } } }, required: ["exerciseType", "durationMinutes", "frequencyPerWeek", "bestTimeOfDay", "specificActivities"], additionalProperties: false },
                emotional: { type: "object", properties: { dailyMinutes: { type: "number" }, weeklyHours: { type: "number" }, connectionType: { type: "string" }, expressionMethods: { type: "array", items: { type: "string" } }, supportStructures: { type: "array", items: { type: "string" } } }, required: ["dailyMinutes", "weeklyHours", "connectionType", "expressionMethods", "supportStructures"], additionalProperties: false },
                psychological: { type: "object", properties: { therapyType: { type: "string" }, dailyPractices: { type: "array", items: { type: "string" } }, dailyMinutes: { type: "number" }, weeklyHours: { type: "number" }, journalingStyle: { type: "string" }, mindfulnessType: { type: "string" } }, required: ["therapyType", "dailyPractices", "dailyMinutes", "weeklyHours", "journalingStyle", "mindfulnessType"], additionalProperties: false },
                financial: { type: "object", properties: { budgetingStyle: { type: "string" }, stressManagement: { type: "string" }, weeklyReviewMinutes: { type: "number" }, keyPractices: { type: "array", items: { type: "string" } } }, required: ["budgetingStyle", "stressManagement", "weeklyReviewMinutes", "keyPractices"], additionalProperties: false },
                familySupport: { type: "object", properties: { weeklyHours: { type: "number" }, communicationStyle: { type: "string" }, boundaryType: { type: "string" }, qualityTimeActivities: { type: "array", items: { type: "string" } }, supportNeeds: { type: "array", items: { type: "string" } } }, required: ["weeklyHours", "communicationStyle", "boundaryType", "qualityTimeActivities", "supportNeeds"], additionalProperties: false },
                dailySchedule: { type: "object", properties: { wakeTime: { type: "string" }, sleepTime: { type: "string" }, blocks: { type: "array", items: { type: "object", properties: { time: { type: "string" }, activity: { type: "string" }, duration: { type: "string" }, category: { type: "string" } }, required: ["time", "activity", "duration", "category"], additionalProperties: false } } }, required: ["wakeTime", "sleepTime", "blocks"], additionalProperties: false },
                weeklySchedule: { type: "array", items: { type: "object", properties: { day: { type: "string" }, focus: { type: "string" }, keyActivities: { type: "array", items: { type: "string" } } }, required: ["day", "focus", "keyActivities"], additionalProperties: false } }
              }, required: ["physical", "emotional", "psychological", "financial", "familySupport", "dailySchedule", "weeklySchedule"], additionalProperties: false },
              healthyActivities: { type: "array", items: { type: "object", properties: { activity: { type: "string" }, category: { type: "string" }, frequency: { type: "string" }, durationMinutes: { type: "number" }, energyImpact: { type: "number" }, whyItMatters: { type: "string" } }, required: ["activity", "category", "frequency", "durationMinutes", "energyImpact", "whyItMatters"], additionalProperties: false } },
              drainingActivities: { type: "array", items: { type: "object", properties: { activity: { type: "string" }, category: { type: "string" }, frequency: { type: "string" }, durationMinutes: { type: "number" }, energyImpact: { type: "number" }, whyItMatters: { type: "string" } }, required: ["activity", "category", "frequency", "durationMinutes", "energyImpact", "whyItMatters"], additionalProperties: false } },
            },
            required: ["storyTrueSelf", "storyCurrentJourney", "interpretationNarrative", "needsGapAnalysis", "transformationRoadmap", "needsPrescription", "healthyActivities", "drainingActivities"],
            additionalProperties: false,
          } } },
        });

        const narratives = JSON.parse(String(llmResponse.choices?.[0]?.message?.content || "{}"));

        // Update profile with all scores, narratives, prescription, and activities
        await db.update(personalityProfiles)
          .set({
            openness, conscientiousness, extraversion, agreeableness, neuroticism,
            cognitiveAnalytical, cognitiveDetail, commDirect, commWritten, commEmotional,
            needSocialInteraction: needScores.needSocialInteraction,
            needSolitude: needScores.needSolitude,
            needNovelty: needScores.needNovelty,
            needRoutine: needScores.needRoutine,
            needSensoryStimulation: needScores.needSensoryStimulation,
            needEmotionalSecurity: needScores.needEmotionalSecurity,
            needAutonomy: needScores.needAutonomy,
            needConnection: needScores.needConnection,
            needAchievement: needScores.needAchievement,
            needCreativeExpression: needScores.needCreativeExpression,
            calibratedNeeds: calibrated,
            needsGapAnalysis: narratives.needsGapAnalysis || [],
            storyTrueSelf: narratives.storyTrueSelf || "",
            storyCurrentJourney: narratives.storyCurrentJourney || "",
            transformationRoadmap: narratives.transformationRoadmap || [],
            interpretationNarrative: narratives.interpretationNarrative || "",
            needsPrescription: narratives.needsPrescription || null,
            healthyActivities: narratives.healthyActivities || [],
            drainingActivities: narratives.drainingActivities || [],
            primaryDiagnoses: diagnoses,
            completedAt: new Date(),
          })
          .where(eq(personalityProfiles.id, input.profileId));

        // Mark responses as complete
        await db.update(personalityResponses)
          .set({ responses: input.responses, isComplete: true, completedAt: new Date(), lastQuestionIndex: 100 })
          .where(and(eq(personalityResponses.profileId, input.profileId), eq(personalityResponses.userId, ctx.user.id)));

        return {
          profileId: input.profileId,
          scores: { openness, conscientiousness, extraversion, agreeableness, neuroticism },
          needs: needScores,
          calibratedNeeds: calibrated,
          storyTrueSelf: narratives.storyTrueSelf,
          storyCurrentJourney: narratives.storyCurrentJourney,
          interpretationNarrative: narratives.interpretationNarrative,
          needsGapAnalysis: narratives.needsGapAnalysis,
          transformationRoadmap: narratives.transformationRoadmap,
          needsPrescription: narratives.needsPrescription,
          healthyActivities: narratives.healthyActivities,
          drainingActivities: narratives.drainingActivities,
        };
      }),

    // Reality calibration — user rates actual behavior, system remodels profile
    realityCalibrate: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        calibrations: z.array(z.object({
          activityId: z.string(),
          label: z.string(),
          category: z.string(),
          isHealthy: z.boolean(),
          currentLevel: z.number().min(1).max(10),
          idealLevel: z.number().min(1).max(10),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get existing profile
        const [profile] = await db.select().from(personalityProfiles).where(and(eq(personalityProfiles.id, input.profileId), eq(personalityProfiles.userId, ctx.user.id)));
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

        // Calculate gaps
        const calibrationItems = input.calibrations.map(c => ({
          ...c,
          gap: c.idealLevel - c.currentLevel,
        }));

        // Calculate behavior alignment score (0-100%)
        const totalGap = calibrationItems.reduce((sum, c) => sum + Math.abs(c.gap), 0);
        const maxPossibleGap = calibrationItems.length * 9; // max gap per item is 9
        const behaviorAlignment = Math.round((1 - totalGap / maxPossibleGap) * 100);

        // Healthy activities they're NOT doing enough of
        const healthyDeficits = calibrationItems.filter(c => c.isHealthy && c.gap > 2);
        // Draining activities they're doing TOO MUCH of
        const drainingExcesses = calibrationItems.filter(c => !c.isHealthy && c.currentLevel > 5);

        // Remodel personality scores based on actual behavior
        // If they're not getting enough social interaction, their effective extraversion is lower
        const socialCalib = calibrationItems.filter(c => c.category === "social");
        const physicalCalib = calibrationItems.filter(c => c.category === "physical");
        const emotionalCalib = calibrationItems.filter(c => c.category === "emotional");
        const creativeCalib = calibrationItems.filter(c => c.category === "creative");

        const avgGap = (items: typeof calibrationItems) => items.length ? items.reduce((s, i) => s + i.gap, 0) / items.length : 0;

        const adjustedOpenness = Math.max(0, Math.min(40, (profile.openness || 20) + avgGap(creativeCalib) * 2));
        const adjustedConscientiousness = Math.max(0, Math.min(40, (profile.conscientiousness || 20) + avgGap(physicalCalib) * 1.5));
        const adjustedExtraversion = Math.max(0, Math.min(40, (profile.extraversion || 20) + avgGap(socialCalib) * 2));
        const adjustedAgreeableness = Math.max(0, Math.min(40, (profile.agreeableness || 20) + avgGap(emotionalCalib) * 1.5));
        const adjustedNeuroticism = Math.max(0, Math.min(40, (profile.neuroticism || 20) - avgGap(emotionalCalib) * 1.5));

        // Adjust needs based on reality
        const adjustedNeeds: Record<string, number> = { ...(profile.calibratedNeeds || {}) };
        for (const c of calibrationItems) {
          if (c.category === "social" && c.isHealthy) adjustedNeeds.needSocialInteraction = Math.min(10, (adjustedNeeds.needSocialInteraction || 5) + c.gap * 0.3);
          if (c.category === "creative" && c.isHealthy) adjustedNeeds.needCreativeExpression = Math.min(10, (adjustedNeeds.needCreativeExpression || 5) + c.gap * 0.3);
          if (c.category === "physical" && c.isHealthy) adjustedNeeds.needSensoryStimulation = Math.min(10, (adjustedNeeds.needSensoryStimulation || 5) + c.gap * 0.2);
        }

        // Generate remodeled narrative via LLM
        const remodelPrompt = `Based on a reality calibration of this person's actual behavior vs. their personality needs, generate insights.

ORIGINAL PERSONALITY: O=${profile.openness}, C=${profile.conscientiousness}, E=${profile.extraversion}, A=${profile.agreeableness}, N=${profile.neuroticism}
ADJUSTED (based on actual behavior): O=${adjustedOpenness.toFixed(1)}, C=${adjustedConscientiousness.toFixed(1)}, E=${adjustedExtraversion.toFixed(1)}, A=${adjustedAgreeableness.toFixed(1)}, N=${adjustedNeuroticism.toFixed(1)}
BEHAVIOR ALIGNMENT: ${behaviorAlignment}%

HEALTHY DEFICITS (things they need but aren't doing enough): ${healthyDeficits.map(h => `${h.label} (current: ${h.currentLevel}/10, ideal: ${h.idealLevel}/10)`).join(", ") || "None"}
DRAINING EXCESSES (things depleting them that they do too much): ${drainingExcesses.map(d => `${d.label} (current: ${d.currentLevel}/10)`).join(", ") || "None"}
DIAGNOSES: ${(profile.primaryDiagnoses || []).join(", ") || "None"}

Return JSON with:
- keyInsights: 3-5 key insights about the gap between who they are and how they're living
- priorityChanges: 3-5 specific changes ranked by impact, each with area, currentBehavior, idealBehavior, impact description, and difficulty (easy/moderate/hard)
- remodeledNarrative: 2-paragraph updated personality interpretation that accounts for their actual behavior patterns`;

        const remodelResponse = await invokeLLM({
          messages: [{ role: "user", content: remodelPrompt }],
          response_format: { type: "json_schema", json_schema: { name: "remodel", strict: true, schema: {
            type: "object",
            properties: {
              keyInsights: { type: "array", items: { type: "string" } },
              priorityChanges: { type: "array", items: { type: "object", properties: {
                area: { type: "string" }, currentBehavior: { type: "string" }, idealBehavior: { type: "string" }, impact: { type: "string" }, difficulty: { type: "string" }
              }, required: ["area", "currentBehavior", "idealBehavior", "impact", "difficulty"], additionalProperties: false } },
              remodeledNarrative: { type: "string" },
            },
            required: ["keyInsights", "priorityChanges", "remodeledNarrative"],
            additionalProperties: false,
          } } },
        });

        const remodelData = JSON.parse(String(remodelResponse.choices?.[0]?.message?.content || "{}"));

        const remodeledProfile = {
          adjustedOpenness,
          adjustedConscientiousness,
          adjustedExtraversion,
          adjustedAgreeableness,
          adjustedNeuroticism,
          adjustedNeeds,
          behaviorAlignment,
          keyInsights: remodelData.keyInsights || [],
          priorityChanges: (remodelData.priorityChanges || []).map((p: any) => ({ ...p, difficulty: p.difficulty as "easy" | "moderate" | "hard" })),
          remodeledNarrative: remodelData.remodeledNarrative || "",
        };

        // Save to DB
        await db.update(personalityProfiles)
          .set({ realityCalibration: calibrationItems, remodeledScores: remodeledProfile })
          .where(eq(personalityProfiles.id, input.profileId));

        return remodeledProfile;
      }),

    // Get completed profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const profiles = await db.select().from(personalityProfiles)
        .where(eq(personalityProfiles.userId, ctx.user.id))
        .orderBy(desc(personalityProfiles.createdAt))
        .limit(1);
      if (!profiles.length) return null;
      return profiles[0];
    }),

    // Get saved responses (for resume)
    getResponses: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const responses = await db.select().from(personalityResponses)
          .where(and(eq(personalityResponses.profileId, input.profileId), eq(personalityResponses.userId, ctx.user.id)))
          .limit(1);
        return responses[0] || null;
      }),
  }),

  compliance: router({
    submitPrivacyRequest: protectedProcedure
      .input(z.object({
        requestType: z.enum(["access", "correction", "deletion", "withdrawal", "appeal", "complaint"]),
        details: z.string().trim().max(4000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [result] = await db.insert(privacyRequests).values({
          userId: ctx.user.id,
          requestType: input.requestType,
          details: input.details || null,
          status: "received",
        });
        return { success: true, requestId: result.insertId, status: "received" as const };
      }),
    myPrivacyRequests: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await db.select().from(privacyRequests)
        .where(eq(privacyRequests.userId, ctx.user.id))
        .orderBy(desc(privacyRequests.submittedAt)).limit(50);
    }),
    getAllPrivacyRequests: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await db.select().from(privacyRequests).orderBy(desc(privacyRequests.submittedAt)).limit(500);
    }),
    resolvePrivacyRequest: protectedProcedure
      .input(z.object({
        requestId: z.number().int().positive(),
        status: z.enum(["in_review", "completed", "denied", "cancelled"]),
        resolutionNotes: z.string().trim().max(4000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(privacyRequests).set({
          status: input.status,
          resolvedAt: ["completed", "denied", "cancelled"].includes(input.status) ? new Date() : null,
          resolutionNotes: input.resolutionNotes || null,
        }).where(eq(privacyRequests.id, input.requestId));
        return { success: true };
      }),
    exportMyData: protectedProcedure.query(async ({ ctx }) => {
      const { exportConsumerData } = await import("./compliance/dataExport");
      return await exportConsumerData(ctx.user.id);
    }),
    deleteMyConsumerHealthDataNow: protectedProcedure.mutation(async ({ ctx }) => {
      const { deleteConsumerHealthDataNow } = await import("./compliance/dataDeletion");
      return await deleteConsumerHealthDataNow(ctx.user.id);
    }),
    requestDeletion: protectedProcedure
      .input(z.object({ reason: z.string().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const { requestDeletion } = await import("./compliance/dataDeletion");
        return await requestDeletion(ctx.user.id, input.reason);
      }),
    getDeletionStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getDeletionRequests } = await import("./compliance/dataDeletion");
      const all = await getDeletionRequests();
      return all.filter((r: any) => r.userId === ctx.user.id);
    }),
    cancelDeletion: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { cancelDeletion } = await import("./compliance/dataDeletion");
        return await cancelDeletion(input.requestId, ctx.user.id, "User cancelled");
      }),
    // Admin-only: approve/execute deletion
    approveDeletion: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { approveDeletion } = await import("./compliance/dataDeletion");
        return await approveDeletion(input.requestId, ctx.user.id);
      }),
    executeDeletion: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { executeDeletion } = await import("./compliance/dataDeletion");
        return await executeDeletion(input.userId, ctx.user.id);
      }),
    getAllDeletionRequests: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDeletionRequests } = await import("./compliance/dataDeletion");
      return await getDeletionRequests();
    }),
    // Breach reporting
    reportBreach: protectedProcedure
      .input(z.object({
        breachType: z.string(),
        description: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        affectedUsers: z.array(z.number()),
        affectedJurisdictions: z.array(z.object({
          jurisdiction: z.string().min(1).max(120),
          residents: z.number().int().nonnegative(),
        })).optional(),
        containmentActions: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { reportBreach } = await import("./compliance/breachNotification");
        return await reportBreach({ ...input, reportedBy: ctx.user.id });
      }),
    getBreachHistory: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getBreachHistory } = await import("./compliance/breachNotification");
      return await getBreachHistory(50);
    }),
    resolveBreachIncident: protectedProcedure
      .input(z.object({ breachId: z.number(), notes: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { resolveBreachIncident } = await import("./compliance/breachNotification");
        return await resolveBreachIncident(input.breachId, input.notes);
      }),
    // Audit logs
    getAuditLogs: protectedProcedure
      .input(z.object({ userId: z.number().optional(), limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getAuditLogs } = await import("./compliance/auditLog");
        return await getAuditLogs({ userId: input.userId, limit: input.limit });
      }),

    // Deterministic consumer privacy-rights summary. Legal rules are never
    // generated by an AI model at runtime.
    getStateRights: protectedProcedure
      .input(z.object({ state: z.string().min(2).max(50) }))
      .query(async ({ input }) => generateStateRights(input.state)),
  }),
});
export type AppRouter = typeof appRouter;
