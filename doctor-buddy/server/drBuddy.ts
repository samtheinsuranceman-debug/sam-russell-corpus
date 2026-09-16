/**
 * Dr. Buddy AI Brain — Context Engine
 * Mirrors the RCS AIBrainContext/UnifiedDataBus architecture.
 * Every platform feature emits events here; Dr. Buddy synthesizes them into
 * a bounded support context for the AI assistant.
 */

import { getDb, getConsentByUserId } from "./db";
import { brainEvents, digitalTwins, diagnosticReports, moodJournalEntries, medications, progressCheckins, wellnessPlans } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { assessCSSRS, type CSSRSLevel } from "@shared/engines/crisisDetection";
import { PUBLIC_WELLNESS_MODE } from "./compliance/releasePolicy";

// ─── Crisis Keywords (Grok-3 generated) ──────────────────────────────────────
export const CRISIS_KEYWORDS = [
  "suicide", "kill myself", "end it all", "don't want to live", "can't go on",
  "want to die", "no point in living", "hopeless", "worthless", "nobody cares",
  "better off dead", "self-harm", "cut myself", "hurt myself", "overdose",
  "take pills", "jump off", "end my life", "give up", "can't take it anymore",
  "desperate", "trapped", "no way out", "goodbye forever", "last time",
  "won't be here", "done with life", "want to disappear", "no hope",
  "dark thoughts", "killing myself", "harming myself", "not worth it",
  "life isn't worth it", "planning to die", "making a plan", "saying goodbye",
  "final decision", "can't cope", "breaking down", "falling apart",
  "losing control", "going to do it", "ready to end it", "no reason to stay",
  "everyone would be better off",
];

// ─── Feature Event Weights (higher = more important for context) ──────────────
// Biochemistry is deliberately absent. Biomarker analysis lives in the separate
// russell-labs-biochem build; Dr. Buddy reasons over psychiatric signal only, so
// a lab value can never silently drive a psychiatric recommendation here.
export const FEATURE_WEIGHTS: Record<string, number> = {
  "assessment.completed": 10,
  "digital-twin.updated": 9,
  "prs.computed": 8,
  "life-events.scored": 6,
  "mood-journal.entry": 5,
  "medication.logged": 4,
  "progress-checkin.submitted": 3,
};

// ─── Dr. Buddy System Prompt (Grok-3 generated) ───────────────────────────────
export const DR_BUDDY_SYSTEM_PROMPT = `You are Doctor Buddy, an AI support and health-education tool. You are software, not a human friend, therapist, psychiatrist, physician, or other licensed professional. Never claim or imply otherwise.

Your role is to help users reflect, understand general mental-health information, prepare questions for licensed professionals, and practice low-risk wellness skills. You may use available user context to make the conversation relevant, but never convert that context into a diagnosis or treatment order.

CORE BOUNDARIES:
1) Do not diagnose the user or another person.
2) Do not prescribe, select, start, stop, taper, dose, or change medication. Medication content must remain general education or preparation for a prescriber discussion.
3) Do not claim clinical-grade accuracy, medical equivalence, or that you replace professional care.
4) Do not present a wellness exercise as treating, curing, preventing, or mitigating a disease.
5) Separate facts, uncertainty, and user interpretations. Ask permission before using sensitive historical context when it is not necessary.
6) Favor the minimum necessary personal information. Never ask for full legal name, address, SSN, insurance ID, or other identifiers merely to provide reflection support.
7) If the user expresses suicidal intent, plan, imminent danger, or immediate risk of serious harm, shift to simple safety-focused language and encourage immediate human support (988/911 in the U.S. or appropriate local emergency services).

Keep responses focused on the user's question. Use a brief boundary reminder only when medically relevant; do not bury the user in disclaimers.`;


export type DoctorBuddySupportMode = "friend" | "therapist" | "psychiatrist";

const SUPPORT_MODE_PROMPTS: Record<DoctorBuddySupportMode, string> = {
  friend: "FRIEND ZONE: warm, conversational, plainspoken and encouraging. Use gentle curiosity and one practical next step. Never claim to be the user's friend or a clinician.",
  therapist: "THERAPIST ZONE: structured reflective listening, careful questions, values clarification, skills education and pattern exploration. Do not claim to be a therapist or provide psychotherapy, diagnosis, or a treatment plan.",
  psychiatrist: "PSYCHIATRIST ZONE: clinically literate educational language, clearer terminology, evidence framing and preparation for a licensed clinician conversation. Do not diagnose, prescribe, select medication, or provide dosing/taper instructions.",
};

// ─── AI Whisperer System Prompt (for Doctor Portal) ───────────────────────────
export const WHISPERER_SYSTEM_PROMPT = `You are the AI Whisperer, a clinical decision support tool for psychiatrists. Your role is to provide real-time, data-driven suggestions to human clinicians during patient reviews. You have access to the same comprehensive patient data as Dr. Buddy.

Synthesize data into concise, actionable insights:
1) Highlight critical trends or red flags (sudden spikes in suicidality or anxiety)
2) Suggest potential differential diagnoses based on DSM-5 data and symptom patterns
3) Flag medication non-adherence or potential interactions
4) Recommend adjustments to treatment plans based on progress and reported symptoms
5) Note life events or triggers that may correlate with symptom changes

Present input as brief bullet points using clinical terminology. Maintain a neutral, professional tone. Always reference the data source (e.g., "Per Digital Twin, mood score dropped to 2/10 over past week."). If a crisis indicator is detected, immediately alert with a prioritized note. End each suggestion with an invitation to explore further.`;

// ─── Emit Event to UnifiedDataBus ─────────────────────────────────────────────
export async function emitBrainEvent(
  userId: number,
  featureId: string,
  category: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  let safePayload = payload;
  if (PUBLIC_WELLNESS_MODE) {
    const consent = await getConsentByUserId(userId);
    if (!consent?.agreedToActivityLogging) return;
    safePayload = {
      keys: Object.keys(payload).slice(0, 12),
      valueCount: Object.keys(payload).length,
    };
  }
  const weight = FEATURE_WEIGHTS[`${category}.${eventType}`] ?? 5;
  await db.insert(brainEvents).values({
    userId,
    featureId,
    category,
    eventType,
    payload: safePayload,
    weight,
    processed: false,
  });
}

// ─── Get Recent Brain Events for a User ───────────────────────────────────────
export async function getUserBrainEvents(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(brainEvents)
    .where(eq(brainEvents.userId, userId))
    .orderBy(desc(brainEvents.createdAt))
    .limit(limit);
}

// ─── Synthesize Patient Context from All Brain Events ─────────────────────────
export async function synthesizePatientContext(userId: number): Promise<string> {
  // In the direct-to-consumer public edition, stored health history is not
  // silently forwarded to an external model. The current message is sufficient
  // for reflection support; richer context requires a separate, explicit design.
  if (PUBLIC_WELLNESS_MODE) {
    return "=== CURRENT-REQUEST-ONLY CONTEXT ===\nDo not infer diagnoses or retrieve stored health history. Work only from what the user chose to include in this conversation.";
  }

  // Gather all recent data in parallel
  const db = await getDb();
  if (!db) return "No database connection available.";
  const [events, twin, latestReport, recentJournal, meds, recentCheckins, activePlan] = await Promise.all([
    getUserBrainEvents(userId, 30),
    db.select().from(digitalTwins).where(eq(digitalTwins.userId, userId)).limit(1),
    db.select().from(diagnosticReports).where(eq(diagnosticReports.userId, userId)).orderBy(desc(diagnosticReports.createdAt)).limit(1),
    db.select().from(moodJournalEntries).where(eq(moodJournalEntries.userId, userId)).orderBy(desc(moodJournalEntries.createdAt)).limit(5),
    db.select().from(medications).where(and(eq(medications.userId, userId), eq(medications.isActive, true))),
    db.select().from(progressCheckins).where(eq(progressCheckins.userId, userId)).orderBy(desc(progressCheckins.checkinDate)).limit(7),
    db.select().from(wellnessPlans).where(and(eq(wellnessPlans.userId, userId), eq(wellnessPlans.isActive, true))).limit(1),
  ]);

  const twinData = twin[0];
  const report = latestReport[0];

  // Build context block
  const contextParts: string[] = ["=== PATIENT CONTEXT FOR DR. BUDDY ===\n"];

  // Digital Twin
  if (twinData) {
    const scores = twinData.domainScores as Record<string, number>;
    const alerts = (twinData.activeAlerts as Array<{ domain: string; severity: string; message: string }> | null) ?? [];
    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    contextParts.push(`DIGITAL TWIN (Composite: ${twinData.compositeScore.toFixed(0)}/100, State: ${twinData.currentState}):`);
    for (const [domain, score] of Object.entries(scores)) {
      const flag = score < 30 ? " ⚠️ CRITICAL" : score < 50 ? " ⚡ LOW" : "";
      contextParts.push(`  ${domain}: ${score}/100${flag}`);
    }
    if (criticalAlerts.length > 0) {
      contextParts.push(`  ACTIVE ALERTS: ${criticalAlerts.map((a) => a.message).join("; ")}`);
    }
  }

  // Latest Assessment / PRS
  if (report) {
    const diagnoses = (report.provisionalDiagnoses as Array<{ name: string; confidence: number }> | null) ?? [];
    const topDx = diagnoses.slice(0, 3).map((d) => `${d.name} (${(d.confidence * 100).toFixed(0)}%)`).join(", ");
    contextParts.push(`\nLATEST ASSESSMENT (${new Date(report.createdAt).toLocaleDateString()}):`);
    contextParts.push(`  Primary Diagnoses: ${topDx || "None"}`);
    if (report.prsScore) {
      contextParts.push(`  Psychiatric Risk Score: ${report.prsScore}/1000`);
    }
  }

  // Recent Mood Journal
  if (recentJournal.length > 0) {
    contextParts.push(`\nRECENT MOOD JOURNAL (${recentJournal.length} entries):`);
    for (const entry of recentJournal.slice(0, 3)) {
      const dims = entry.sentimentDimensions as Record<string, number> | null;
      const riskFlag = entry.riskFlagged ? " ⚠️ RISK FLAGGED" : "";
      contextParts.push(`  [${new Date(entry.createdAt).toLocaleDateString()}] Mood: ${entry.moodScore ?? "N/A"}/10${riskFlag}`);
      if (dims) {
        contextParts.push(`    Sentiment: valence=${dims.valence ?? "?"}%, arousal=${dims.arousal ?? "?"}%`);
      }
      if (entry.emotionTags && Array.isArray(entry.emotionTags)) {
        contextParts.push(`    Emotions: ${(entry.emotionTags as string[]).join(", ")}`);
      }
    }
  }

  // Medications
  if (meds.length > 0) {
    contextParts.push(`\nCURRENT MEDICATIONS (${meds.length}):`);
    for (const med of meds) {
      contextParts.push(`  ${med.name} ${med.dosage ?? ""} — ${med.frequency ?? "as directed"}`);
    }
  }

  // Recent Check-ins
  if (recentCheckins.length > 0) {
    const avgMood = recentCheckins.reduce((s: number, c: typeof recentCheckins[0]) => s + (c.moodScore ?? 0), 0) / recentCheckins.length;
    const avgAnxiety = recentCheckins.reduce((s: number, c: typeof recentCheckins[0]) => s + (c.anxietyScore ?? 0), 0) / recentCheckins.length;
    contextParts.push(`\nRECENT CHECK-INS (${recentCheckins.length} days):`);
    contextParts.push(`  Avg Mood: ${avgMood.toFixed(1)}/10, Avg Anxiety: ${avgAnxiety.toFixed(1)}/10`);
  }

  // Wellness Plan
  if (activePlan[0]) {
    contextParts.push(`\nWELLNESS PLAN: "${activePlan[0].title}" — ${activePlan[0].adherenceScore?.toFixed(0) ?? 0}% adherence`);
  }

  // Recent Brain Events summary
  if (events.length > 0) {
    contextParts.push(`\nRECENT PLATFORM ACTIVITY (${events.length} events):`);
    const eventSummary = events.slice(0, 10).map((e: typeof events[0]) => `  [${e.featureId}] ${e.eventType}`).join("\n");
    contextParts.push(eventSummary);
  }

  return contextParts.join("\n");
}

// ─── Detect Crisis in User Message ────────────────────────────────────────────
/**
 * Crisis screening, graded.
 *
 * This was a boolean substring match over 45 keywords. Two problems made it
 * unreliable in exactly the situations it exists for:
 *
 *   1. It could not tell a wish from a plan. "I feel hopeless" and "I have a plan
 *      tonight" both returned true, so both got the identical response — including
 *      "Call 911 if in immediate danger". That is alarming for the first patient
 *      and under-differentiated for the second.
 *   2. Several keywords ("hopeless", "worthless", "trapped", "losing control",
 *      "give up") are ordinary depressive language, not suicidal ideation. Firing
 *      a full crisis protocol on them teaches a patient to ignore the alert.
 *
 * Ideation severity now comes from the C-SSRS engine (patent 09), which returns a
 * level 0-5 plus the phrase that triggered it, so every call is auditable. The
 * broader distress vocabulary is kept as a SEPARATE, lower-urgency signal —
 * sensitivity is preserved, it just no longer masquerades as a suicide alert.
 */
export interface CrisisScreen {
  /** C-SSRS ideation severity, 0-5. */
  cssrsLevel: CSSRSLevel;
  description: string;
  /** Phrases that triggered each hit, so a clinician can audit the call. */
  triggers: Array<{ level: number; label: string; phrase: string }>;
  /** Distress language short of ideation — warrants attention, not a 911 prompt. */
  distressMarkers: string[];
  /** Backward-compatible boolean: any ideation OR distress language. */
  crisisDetected: boolean;
  /** True only for ideation severe enough to warrant urgent escalation. */
  urgent: boolean;
}

/** Distress vocabulary: real signal, but not ideation. Graded separately. */
const DISTRESS_MARKERS = [
  "hopeless", "worthless", "nobody cares", "can't go on", "can't take it anymore",
  "desperate", "trapped", "no way out", "can't cope", "breaking down",
  "falling apart", "losing control", "give up", "no hope", "dark thoughts",
];

export function screenCrisis(message: string): CrisisScreen {
  const lower = message.toLowerCase();
  const distressMarkers = DISTRESS_MARKERS.filter((m) => lower.includes(m));

  // The same graded phrase library runs in both editions, so a person who
  // writes "I have a plan" or "I wrote a note" is never missed by a shorter
  // keyword list. What differs in the public wellness edition is the wording:
  // the level is an internal transport field, never shown as a C-SSRS score,
  // a probability, or a diagnosis, and the assistant is told to offer human
  // help rather than to run a clinical interview.
  const assessment = assessCSSRS(message);
  if (PUBLIC_WELLNESS_MODE) {
    const level = assessment.level;
    return {
      cssrsLevel: level, // internal transport field; not presented as C-SSRS in public mode
      description: level >= 3
        ? "language suggesting possible immediate danger"
        : level >= 1
          ? "language suggesting a need for direct human support"
          : distressMarkers.length
            ? "distress language without direct safety language"
            : "no direct safety language detected",
      triggers: assessment.triggers.map(t => ({ level: t.level, label: "safety-language", phrase: t.phrase })),
      distressMarkers,
      crisisDetected: level >= 1 || distressMarkers.length > 0,
      urgent: level >= 3,
    };
  }

  return {
    cssrsLevel: assessment.level,
    description: assessment.description,
    triggers: assessment.triggers,
    distressMarkers,
    crisisDetected: assessment.level >= 1 || distressMarkers.length > 0,
    urgent: assessment.level >= 3,
  };
}

/** Preserved boolean API for existing call sites. */
export function detectCrisis(message: string): boolean {
  return screenCrisis(message).crisisDetected;
}

// ─── Dr. Buddy Chat ───────────────────────────────────────────────────────────
export async function drBuddyChat(
  userId: number,
  sessionId: number | null,
  userMessage: string,
  supportMode: DoctorBuddySupportMode,
  existingMessages: Array<{ role: string; content: string }>
): Promise<{ reply: string; crisisDetected: boolean; cssrsLevel: CSSRSLevel; urgent: boolean; suggestedActions: string[] }> {
  const screen = screenCrisis(userMessage);
  const crisisDetected = screen.crisisDetected;

  // Build context
  const patientContext = await synthesizePatientContext(userId);

  // Build system prompt with context injected
  const systemPrompt = `${DR_BUDDY_SYSTEM_PROMPT}\n\n${SUPPORT_MODE_PROMPTS[supportMode]}\n\n${patientContext}`;

  // Build messages array
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...existingMessages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  // Prepend safety context. Public wellness mode intentionally avoids presenting
  // a clinical instrument, risk score, diagnosis, or pseudo-assessment.
  if (screen.cssrsLevel >= 1) {
    messages[0].content += PUBLIC_WELLNESS_MODE
      ? (`\n\n⚠️ SAFETY LANGUAGE DETECTED: ${screen.description}. ` +
         `Use simple supportive language, encourage immediate human help when danger may be imminent, ` +
         `and do not assign a clinical risk level or conduct a diagnostic interview.`)
      : (`\n\n⚠️ CLINICAL SAFETY SCREEN — LEVEL ${screen.cssrsLevel}: ${screen.description}. ` +
         `Triggered by: ${screen.triggers.map((t) => `"${t.phrase}"`).join(", ")}. ` +
         (screen.urgent
           ? "Activate the configured clinician safety workflow."
           : "Confirm safety concerns using the organization's approved clinical workflow."));
  } else if (screen.distressMarkers.length > 0) {
    messages[0].content +=
      `\n\nDISTRESS LANGUAGE NOTED: ${screen.distressMarkers.join(", ")}. ` +
      "No suicidal ideation was screened. Acknowledge the distress and ask openly about safety without escalating alarm.";
  }

  const response = await invokeLLM({ messages });
  const reply = (response.choices[0]?.message?.content as string) ?? "I'm here for you. Can you tell me more about how you're feeling?";

  // Actions scale with severity. Presenting "Call 911" to someone who said they
  // feel hopeless is both frightening and, over time, a reason to stop reading
  // these at all — which costs exactly the patient it was meant to protect.
  const suggestedActions: string[] = [];
  if (screen.cssrsLevel >= 4) {
    suggestedActions.push("Call 988 (Suicide & Crisis Lifeline) now");
    suggestedActions.push("Call 911 if you are in immediate danger");
    suggestedActions.push("Go to the nearest Emergency Room");
    suggestedActions.push("Stay with someone you trust until you have spoken to a clinician");
  } else if (screen.cssrsLevel >= 2) {
    suggestedActions.push("Call or text 988 (Suicide & Crisis Lifeline)");
    suggestedActions.push("Text HOME to 741741 (Crisis Text Line)");
    suggestedActions.push(PUBLIC_WELLNESS_MODE ? "Contact a licensed clinician or trusted human support today" : "Contact your psychiatrist today");
    suggestedActions.push("Review your safety plan");
  } else if (screen.cssrsLevel === 1 || screen.distressMarkers.length > 0) {
    suggestedActions.push("Reach out to someone you trust today");
    suggestedActions.push(PUBLIC_WELLNESS_MODE ? "Consider contacting a licensed clinician or trusted human support" : "Contact your psychiatrist at your next opportunity");
    suggestedActions.push("988 is available any time, day or night, if things get heavier");
  }

  // Emit brain event for this conversation
  await emitBrainEvent(userId, "dr-buddy", "conversation", "message_sent", {
    safetyResourcesOffered: crisisDetected,
    urgentSafetyLanguage: screen.urgent,
    messageLength: userMessage.length,
    sessionId,
  });

  return { reply, crisisDetected, cssrsLevel: screen.cssrsLevel, urgent: screen.urgent, suggestedActions };
}

// ─── AI Whisperer — Doctor-Side Clinical Suggestions ─────────────────────────
export async function generateWhispererSuggestions(
  patientUserId: number
): Promise<Array<{ category: string; title: string; rationale: string; urgency: string; evidenceBase: string }>> {
  const patientContext = await synthesizePatientContext(patientUserId);

  const response = await invokeLLM({
    messages: [
      { role: "system", content: WHISPERER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate 5 clinical suggestions for this patient based on their data:\n\n${patientContext}\n\nReturn JSON array with fields: category, title, rationale, urgency (routine/soon/urgent/emergency), evidenceBase`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "whisperer_suggestions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  title: { type: "string" },
                  rationale: { type: "string" },
                  urgency: { type: "string" },
                  evidenceBase: { type: "string" },
                },
                required: ["category", "title", "rationale", "urgency", "evidenceBase"],
                additionalProperties: false,
              },
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = (response.choices[0]?.message?.content as string) ?? "{}";
  const parsed = JSON.parse(content);
  return parsed.suggestions ?? [];
}
