import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  float,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Core Users ───────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Consumer Health Data Consent (legacy table name retained for migration) ─
export const hipaaConsents = mysqlTable("hipaa_consents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  fullName: varchar("fullName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  consentVersion: varchar("consentVersion", { length: 16 }).default("1.0").notNull(),
  consentTextSnapshot: text("consentTextSnapshot"),
  agreedToTerms: boolean("agreedToTerms").default(false).notNull(),
  agreedToHipaa: boolean("agreedToHipaa").default(false).notNull(),
  agreedToActivityLogging: boolean("agreedToActivityLogging").default(false).notNull(),
  adult18Plus: boolean("adult18Plus").default(false).notNull(),
  termsVersion: varchar("termsVersion", { length: 64 }),
  privacyVersion: varchar("privacyVersion", { length: 64 }),
  healthDataPolicyVersion: varchar("healthDataPolicyVersion", { length: 64 }),
  medicalDisclaimerVersion: varchar("medicalDisclaimerVersion", { length: 64 }),
  processorDisclosureSnapshot: text("processorDisclosureSnapshot"),
  withdrawnAt: timestamp("withdrawnAt"),
  withdrawalReason: varchar("withdrawalReason", { length: 255 }),
  signedAt: timestamp("signedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HipaaConsent = typeof hipaaConsents.$inferSelect;
export type InsertHipaaConsent = typeof hipaaConsents.$inferInsert;

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const activityLogs = mysqlTable("activity_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  page: varchar("page", { length: 512 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  referrer: varchar("referrer", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ─── Psychiatric Assessments ──────────────────────────────────────────────────
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  currentQuestionIndex: int("currentQuestionIndex").default(0).notNull(),
  answers: json("answers").$type<Record<string, unknown>>(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// ─── Diagnostic Reports ───────────────────────────────────────────────────────
export const diagnosticReports = mysqlTable("diagnostic_reports", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => assessments.id),
  userId: int("userId").references(() => users.id),
  provisionalDiagnoses: json("provisionalDiagnoses").$type<ProvisionalDiagnosis[]>().notNull(),
  symptomProfile: json("symptomProfile").$type<SymptomProfile>().notNull(),
  treatmentRecommendations: json("treatmentRecommendations").$type<TreatmentRecommendation[]>(),
  pubmedArticles: json("pubmedArticles").$type<PubmedArticle[]>(),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  sharedWithProvider: boolean("sharedWithProvider").default(false),
  prsScore: int("prsScore"),
  prsBreakdown: json("prsBreakdown").$type<Record<string, number>>(),

  // Clinician review loop. An AI-generated differential is a draft until a
  // licensed clinician signs it; these columns are what makes that reviewable
  // after the fact rather than a claim.
  reviewStatus: mysqlEnum("reviewStatus", [
    "pending",
    "under_review",
    "approved",
    "rejected",
    "requires_revision",
  ]).default("pending").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  clinicianSignature: varchar("clinicianSignature", { length: 255 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiagnosticReport = typeof diagnosticReports.$inferSelect;
export type InsertDiagnosticReport = typeof diagnosticReports.$inferInsert;

// ─── Weekly Progress Check-ins ────────────────────────────────────────────────
export const progressCheckins = mysqlTable("progress_checkins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  scores: json("scores").$type<Record<string, number>>().notNull(),
  overallScore: float("overallScore").notNull(),
  moodScore: float("moodScore"),
  anxietyScore: float("anxietyScore"),
  sleepScore: float("sleepScore"),
  energyScore: float("energyScore"),
  socialScore: float("socialScore"),
  notes: text("notes"),
  aiInsight: text("aiInsight"),
  checkinDate: timestamp("checkinDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProgressCheckin = typeof progressCheckins.$inferSelect;
export type InsertProgressCheckin = typeof progressCheckins.$inferInsert;

// ─── Symptom Journal Entries ──────────────────────────────────────────────────
export const journalEntries = mysqlTable("journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  content: text("content").notNull(),
  promptId: varchar("promptId", { length: 32 }),
  promptText: text("promptText"),
  moodTags: json("moodTags").$type<string[]>(),
  triggers: json("triggers").$type<string[]>(),
  moodRating: int("moodRating"),
  anxietyRating: int("anxietyRating"),
  sleepHours: float("sleepHours"),
  isPrivate: boolean("isPrivate").default(true).notNull(),
  aiReflection: text("aiReflection"),
  entryDate: timestamp("entryDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

// ─── Crisis Events ────────────────────────────────────────────────────────────
export const crisisEvents = mysqlTable("crisis_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  sessionId: varchar("sessionId", { length: 64 }),
  tier: mysqlEnum("tier", ["tier1_emergency", "tier2_high_risk", "tier3_elevated"]),
  triggerText: text("triggerText"),
  triggerSource: varchar("triggerSource", { length: 64 }),
  matchedKeywords: json("matchedKeywords").$type<string[]>(),
  resourcesShown: json("resourcesShown").$type<string[]>(),
  deescalationUsed: boolean("deescalationUsed").default(false),
  nearestErShown: boolean("nearestErShown").default(false),
  ipAddress: varchar("ipAddress", { length: 64 }),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrisisEvent = typeof crisisEvents.$inferSelect;
export type InsertCrisisEvent = typeof crisisEvents.$inferInsert;

// ─── AI Advisory Sessions ─────────────────────────────────────────────────────
export const advisorySessions = mysqlTable("advisory_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  title: varchar("title", { length: 255 }),
  messages: json("messages").$type<AdvisoryMessage[]>().notNull(),
  conditionContext: varchar("conditionContext", { length: 128 }),
  sessionType: mysqlEnum("sessionType", ["general", "condition_specific", "treatment_planning", "crisis"]).default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdvisorySession = typeof advisorySessions.$inferSelect;
export type InsertAdvisorySession = typeof advisorySessions.$inferInsert;

// ─── Shared JSON Types ────────────────────────────────────────────────────────
export interface ProvisionalDiagnosis {
  code: string;
  name: string;
  confidence: number;
  criteriaMatched: string[];
  criteriaTotal: number;
  dsmLink: string;
  description: string;
}

export interface SymptomProfile {
  domains: {
    mood: number;
    anxiety: number;
    psychosis: number;
    trauma: number;
    ocd: number;
    adhd: number;
    substanceUse: number;
    somatic: number;
    sleep: number;
    eating: number;
  };
  severity: "mild" | "moderate" | "severe";
  duration: string;
  onset: string;
  functionalImpairment: number;
}

export interface TreatmentRecommendation {
  category: "pharmacotherapy" | "psychotherapy" | "lifestyle" | "referral";
  title: string;
  description: string;
  evidenceLevel: "A" | "B" | "C";
  citations: string[];
  pubmedIds?: string[];
}

export interface PubmedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  url: string;
}

export interface FluStateData {
  state: string;
  stateCode: string;
  activityLevel: number;
  activityLabel: string;
  iliPercent: number;
}

export interface AdvisoryMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: string[];
}

// ─── Activity Event Types ─────────────────────────────────────────────────────
export const ACTIVITY_EVENTS = {
  PAGE_VIEW: "page_view",
  ASSESSMENT_START: "assessment_start",
  ASSESSMENT_PROGRESS: "assessment_progress",
  ASSESSMENT_COMPLETE: "assessment_complete",
  REPORT_VIEW: "report_view",
  REPORT_SHARE: "report_share",
  RESEARCH_SEARCH: "research_search",
  FLU_MAP_VIEW: "flu_map_view",
  COVID_TRACKER_VIEW: "covid_tracker_view",
  CARDIAC_DASHBOARD_VIEW: "cardiac_dashboard_view",
  CRISIS_DETECTED: "crisis_detected",
  JOURNAL_ENTRY: "journal_entry",
  CHECKIN_COMPLETED: "checkin_completed",
  LOGIN: "login",
  LOGOUT: "logout",
  CONSENT_SIGNED: "consent_signed",
} as const;

export type ActivityEventType = typeof ACTIVITY_EVENTS[keyof typeof ACTIVITY_EVENTS];

// ─── Digital Twin Mental Health Model ────────────────────────────────────────
export const digitalTwins = mysqlTable("digital_twins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Current domain scores (0-100 per domain, JSON object keyed by domain ID)
  domainScores: json("domainScores").$type<Record<string, number>>().notNull(),
  // Composite score (0-100)
  compositeScore: float("compositeScore").default(50).notNull(),
  // Overall state classification
  currentState: mysqlEnum("currentState", ["stable", "improving", "deteriorating", "critical"]).default("stable").notNull(),
  // Trajectory history: array of {timestamp, domainScores, compositeScore, state}
  trajectoryHistory: json("trajectoryHistory").$type<DigitalTwinSnapshot[]>().notNull(),
  // Alert thresholds override per domain (optional, uses defaults if null)
  alertThresholds: json("alertThresholds").$type<Record<string, number>>(),
  // Active alerts: array of {domain, message, severity, triggeredAt}
  activeAlerts: json("activeAlerts").$type<DigitalTwinAlert[]>(),
  // Which data sources contributed to last update
  lastUpdateSource: varchar("lastUpdateSource", { length: 64 }),
  // ID of the assessment that last triggered an update
  lastAssessmentId: int("lastAssessmentId"),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DigitalTwin = typeof digitalTwins.$inferSelect;
export type InsertDigitalTwin = typeof digitalTwins.$inferInsert;

export interface DigitalTwinSnapshot {
  timestamp: string; // ISO string
  domainScores: Record<string, number>;
  compositeScore: number;
  state: "stable" | "improving" | "deteriorating" | "critical";
  source: string; // e.g. "assessment", "journal", "checkin"
}

export interface DigitalTwinAlert {
  id: string; // uuid
  domain: string;
  domainName: string;
  message: string;
  severity: "info" | "warning" | "critical";
  score: number;
  triggeredAt: string; // ISO string
  acknowledged: boolean;
}

// Add Digital Twin event to activity log constants
export const DIGITAL_TWIN_EVENTS = {
  TWIN_CREATED: "twin_created",
  TWIN_UPDATED: "twin_updated",
  TWIN_ALERT_TRIGGERED: "twin_alert_triggered",
  TWIN_ALERT_ACKNOWLEDGED: "twin_alert_acknowledged",
} as const;

// ─── Mood Journal Entries ─────────────────────────────────────────────────────
export const moodJournalEntries = mysqlTable("mood_journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  content: text("content").notNull(),
  moodScore: int("moodScore"), // 1-10
  emotionTags: json("emotionTags").$type<string[]>(),
  // Grok-generated sentiment dimensions: valence, arousal, dominance, clarity, resilience (0-100)
  sentimentDimensions: json("sentimentDimensions").$type<Record<string, number>>(),
  riskFlagged: boolean("riskFlagged").default(false).notNull(),
  riskIndicatorsFound: json("riskIndicatorsFound").$type<string[]>(),
  aiInsight: text("aiInsight"), // AI-generated reflection/insight
  moodTrend: varchar("moodTrend", { length: 32 }), // Stable Positive, Improving, etc.
  triggers: json("triggers").$type<string[]>(), // substances, events, stressors
  sleepHours: float("sleepHours"),
  anxietyRating: int("anxietyRating"), // 1-10
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MoodJournalEntry = typeof moodJournalEntries.$inferSelect;
export type InsertMoodJournalEntry = typeof moodJournalEntries.$inferInsert;


// ─── Public subscription / recurring-billing records ─────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  provider: varchar("provider", { length: 32 }).default("stripe").notNull(),
  customerId: varchar("customerId", { length: 255 }),
  subscriptionId: varchar("subscriptionId", { length: 255 }).unique(),
  planId: varchar("planId", { length: 64 }).default("insight").notNull(),
  status: varchar("status", { length: 40 }).default("inactive").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const billingConsents = mysqlTable("billing_consents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  planId: varchar("planId", { length: 64 }).notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 8 }).default("usd").notNull(),
  cadence: varchar("cadence", { length: 24 }).default("month").notNull(),
  termsVersion: varchar("termsVersion", { length: 64 }).notNull(),
  adult18Plus: boolean("adult18Plus").notNull(),
  recurringBillingAccepted: boolean("recurringBillingAccepted").notNull(),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BillingConsent = typeof billingConsents.$inferSelect;
export type InsertBillingConsent = typeof billingConsents.$inferInsert;

export const billingEvents = mysqlTable("billing_events", {
  id: int("id").autoincrement().primaryKey(),
  providerEventId: varchar("providerEventId", { length: 255 }).notNull().unique(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
});
export type BillingEvent = typeof billingEvents.$inferSelect;

export const privacyRequests = mysqlTable("privacy_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  requestType: mysqlEnum("requestType", ["access", "correction", "deletion", "withdrawal", "appeal", "complaint"]).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["received", "in_review", "completed", "denied", "cancelled"]).default("received").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolutionNotes: text("resolutionNotes"),
});
export type PrivacyRequest = typeof privacyRequests.$inferSelect;
export type InsertPrivacyRequest = typeof privacyRequests.$inferInsert;

// ─── Privacy / regulated-deployment compliance records ───────────────────────

/**
 * Right-to-delete requests.
 *
 * Deliberately a three-step workflow — request, approve, execute — rather than
 * an immediate purge. Erasing a patient's clinical record is irreversible and
 * may collide with retention obligations, so it gets a reviewer and a paper
 * trail. The `executedAt` / `recordsAffected` columns are what makes a
 * completed deletion provable afterwards, when the data itself is gone.
 */
export const deletionRequests = mysqlTable("deletion_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled", "executed"])
    .default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  executedAt: timestamp("executedAt"),
  /** Row counts per table, retained after the rows themselves are gone. */
  recordsAffected: json("recordsAffected").$type<Record<string, number>>(),
  resolutionNotes: text("resolutionNotes"),
});
export type DeletionRequest = typeof deletionRequests.$inferSelect;
export type InsertDeletionRequest = typeof deletionRequests.$inferInsert;

/** Breach incidents. The 60-day clock in the Breach Notification Rule starts at discovery. */
export const breachIncidents = mysqlTable("breach_incidents", {
  id: int("id").autoincrement().primaryKey(),
  breachType: varchar("breachType", { length: 80 }).notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  affectedUsers: json("affectedUsers").$type<number[]>().notNull(),
  affectedCount: int("affectedCount").notNull(),
  /** Optional counts by state/DC/territory (or other jurisdiction label) for media-notice analysis. */
  affectedJurisdictions: json("affectedJurisdictions").$type<Array<{ jurisdiction: string; residents: number }>>(),
  containmentActions: text("containmentActions").notNull(),
  reportedBy: int("reportedBy").notNull().references(() => users.id),
  discoveredAt: timestamp("discoveredAt").defaultNow().notNull(),
  /** Discovery + 60 days. Computed on insert so it cannot drift. */
  notificationDeadline: timestamp("notificationDeadline").notNull(),
  /**
   * True only when known jurisdiction data shows the configured federal media threshold is met.
   * A 500+ total count by itself is not enough to determine the FTC media-notice duty.
   */
  requiresMediaNotice: boolean("requiresMediaNotice").default(false).notNull(),
  status: mysqlEnum("status", ["open", "contained", "resolved"]).default("open").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolutionNotes: text("resolutionNotes"),
});
export type BreachIncident = typeof breachIncidents.$inferSelect;
export type InsertBreachIncident = typeof breachIncidents.$inferInsert;

/**
 * PHI access audit trail.
 *
 * Distinct from activityLogs, which records product usage. This records who
 * looked at whose clinical record, which is the thing an audit actually asks
 * for and which usage analytics cannot answer.
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** The account that performed the action. */
  actorId: int("actorId").references(() => users.id),
  /** The patient whose record was touched. */
  subjectId: int("subjectId").references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  resourceType: varchar("resourceType", { length: 60 }),
  resourceId: int("resourceId"),
  outcome: mysqlEnum("outcome", ["success", "denied", "error"]).default("success").notNull(),
  detail: json("detail").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Lead capture ─────────────────────────────────────────────────────────────
// Pre-assessment contact capture, so a visitor can resume a multi-session
// intake from a different device.
export const clientLeads = mysqlTable("client_leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 40 }),
  agreedToContact: boolean("agreedToContact").default(false).notNull(),
  currentSession: int("currentSession").default(0).notNull(),
  sessionsCompleted: json("sessionsCompleted").$type<number[]>().default([]),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ClientLead = typeof clientLeads.$inferSelect;
export type InsertClientLead = typeof clientLeads.$inferInsert;

// ─── Personality & needs profiling ────────────────────────────────────────────
// Behavioural profiling: ten need dimensions plus the Big Five, a calibration
// pass that reconciles self-report against observed behaviour, and the narrative
// outputs built on top.
export interface PersonalityResponse {
  questionId: number;
  choiceLabel: string;
  /** Raw item score, 1-10. */
  score: number;
  /** Top-level dimension, e.g. "openness" or "structural_needs". */
  dimension: string;
  /** Sub-dimension within structural needs, e.g. "social_interaction_need". */
  subdimension: string;
  /** Epoch ms. */
  answeredAt: number;
}

/** One activity where current engagement diverges from what the profile implies. */
export interface NeedsGapItem {
  activityId: string;
  label: string;
  category: string;
  isHealthy: boolean;
  currentLevel: number;
  idealLevel: number;
  gap: number;
}

/** The trait and need profile after reconciling self-report against behaviour. */
export interface RemodeledProfile {
  adjustedOpenness: number;
  adjustedConscientiousness: number;
  adjustedExtraversion: number;
  adjustedAgreeableness: number;
  adjustedNeuroticism: number;
  adjustedNeeds: Record<string, number>;
  /** How closely stated traits match reported behaviour, 0-100. */
  behaviorAlignment: number;
  keyInsights: unknown;
  priorityChanges: unknown;
  remodeledNarrative: unknown;
}

export interface TransformationStage {
  stage: number;
  title: string;
  description: string;
  practices: string[];
  timeframeWeeks: number;
}

export const personalityProfiles = mysqlTable("personality_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),

  // Ten need dimensions, each 0-100.
  needSocialInteraction: int("needSocialInteraction"),
  needSolitude: int("needSolitude"),
  needNovelty: int("needNovelty"),
  needRoutine: int("needRoutine"),
  needSensoryStimulation: int("needSensoryStimulation"),
  needEmotionalSecurity: int("needEmotionalSecurity"),
  needAutonomy: int("needAutonomy"),
  needConnection: int("needConnection"),
  needAchievement: int("needAchievement"),
  needCreativeExpression: int("needCreativeExpression"),

  // Big Five, 0-100.
  openness: int("openness"),
  conscientiousness: int("conscientiousness"),
  extraversion: int("extraversion"),
  agreeableness: int("agreeableness"),
  neuroticism: int("neuroticism"),

  // Cognitive and communication style, derived from the same instrument.
  cognitiveAnalytical: int("cognitiveAnalytical"),
  cognitiveDetail: int("cognitiveDetail"),
  commDirect: int("commDirect"),
  commWritten: int("commWritten"),
  commEmotional: int("commEmotional"),

  /** Needs after reality calibration against reported behaviour. */
  calibratedNeeds: json("calibratedNeeds").$type<Record<string, number>>(),
  /** Where self-report and behaviour diverge, and what that divergence means. */
  needsGapAnalysis: json("needsGapAnalysis").$type<NeedsGapItem[]>(),
  /** The per-activity calibration items produced by the reality pass. */
  realityCalibration: json("realityCalibration").$type<NeedsGapItem[]>(),
  /** The trait/need profile after that pass adjusted it. */
  remodeledScores: json("remodeledScores").$type<RemodeledProfile>(),
  /** Raw dimension scores and need scores, as computed at completion. */
  scores: json("scores").$type<Record<string, number>>(),
  needs: json("needs").$type<Record<string, number>>(),

  storyTrueSelf: text("storyTrueSelf"),
  storyCurrentJourney: text("storyCurrentJourney"),
  transformationRoadmap: json("transformationRoadmap").$type<TransformationStage[]>(),
  interpretationNarrative: text("interpretationNarrative"),
  needsPrescription: text("needsPrescription"),
  healthyActivities: json("healthyActivities").$type<string[]>(),
  drainingActivities: json("drainingActivities").$type<string[]>(),
  primaryDiagnoses: json("primaryDiagnoses").$type<string[]>(),

  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PersonalityProfile = typeof personalityProfiles.$inferSelect;
export type InsertPersonalityProfile = typeof personalityProfiles.$inferInsert;

export const personalityResponses = mysqlTable("personality_responses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  profileId: int("profileId").references(() => personalityProfiles.id),
  responses: json("responses").$type<PersonalityResponse[]>().notNull(),
  lastQuestionIndex: int("lastQuestionIndex").default(0).notNull(),
  isComplete: boolean("isComplete").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PersonalityResponseRow = typeof personalityResponses.$inferSelect;
export type InsertPersonalityResponse = typeof personalityResponses.$inferInsert;

// ─── Mental Credit Score ──────────────────────────────────────────────────────
// A longitudinal composite of the signals the patient actually generates:
// check-ins, journal, adherence, the digital twin, and crisis history. Stored
// per computation so the trajectory is inspectable, not just the latest value.
export const mentalCreditScores = mysqlTable("mental_credit_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** 0-1000, higher is better, matching the PRS band scale. */
  score: int("score").notNull(),
  riskZone: mysqlEnum("riskZone", ["critical", "elevated", "guarded", "resilient", "optimal"]).notNull(),
  /** Per-component contributions and whether each was actually observed. */
  breakdown: json("breakdown").$type<MCSBreakdown>().notNull(),
  triggerSource: varchar("triggerSource", { length: 32 }).notNull(),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 32 }),
  /** Change from the previous score, so movement is queryable directly. */
  delta: int("delta").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MentalCreditScore = typeof mentalCreditScores.$inferSelect;
export type InsertMentalCreditScore = typeof mentalCreditScores.$inferInsert;

export interface MCSComponent {
  key: string;
  label: string;
  /** 0-100 sub-score, or null when there was no data to compute it from. */
  value: number | null;
  weight: number;
  observed: boolean;
  detail: string;
}

export interface MCSBreakdown {
  components: MCSComponent[];
  /** Share of total weight that was actually observed, 0-1. */
  coverage: number;
  /** Set when a crisis event capped the score, with the reason. */
  cappedBy: string | null;
  /** Uncapped score, retained so the cap is auditable. */
  rawScore: number;
}

// ─── Wellness Plans ───────────────────────────────────────────────────────────
export const wellnessPlans = mysqlTable("wellness_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  diagnoses: json("diagnoses").$type<string[]>(),
  // Full 30-day plan: array of { week, theme, days: [{day, actions: [{type, title, description, duration}]}] }
  planData: json("planData").$type<Record<string, unknown>>(),
  weeklyThemes: json("weeklyThemes").$type<string[]>(),
  categories: json("categories").$type<string[]>(),
  completedActions: json("completedActions").$type<string[]>(), // array of "week-day-actionIndex" keys
  adherenceScore: float("adherenceScore").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WellnessPlan = typeof wellnessPlans.$inferSelect;
export type InsertWellnessPlan = typeof wellnessPlans.$inferInsert;

// ─── Medication Tracker ───────────────────────────────────────────────────────
export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  genericName: varchar("genericName", { length: 255 }),
  dosage: varchar("dosage", { length: 128 }),
  frequency: varchar("frequency", { length: 128 }), // e.g. "twice daily", "as needed"
  prescribedFor: varchar("prescribedFor", { length: 255 }),
  prescribedBy: varchar("prescribedBy", { length: 255 }),
  startDate: varchar("startDate", { length: 32 }),
  endDate: varchar("endDate", { length: 32 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

export const medicationLogs = mysqlTable("medication_logs", {
  id: int("id").autoincrement().primaryKey(),
  medicationId: int("medicationId").references(() => medications.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(),
  takenAt: timestamp("takenAt").defaultNow().notNull(),
  skipped: boolean("skipped").default(false).notNull(),
  notes: text("notes"),
});
export type MedicationLog = typeof medicationLogs.$inferSelect;

// ─── Dr. Buddy AI Brain — UnifiedDataBus Events ───────────────────────────────
// Every feature on the platform emits events here, mirroring the RCS AIBrainContext pattern.
// Doctor Buddy may read recent entries to provide user-requested continuity in explicitly enabled deployments.
export const brainEvents = mysqlTable("brain_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Feature that emitted this event (e.g. "assessment", "digital-twin", "prs", "biomarker")
  featureId: varchar("featureId", { length: 64 }).notNull(),
  // Category grouping (e.g. "assessment", "twin", "journal", "medication")
  category: varchar("category", { length: 64 }).notNull(),
  // Event type within the feature (e.g. "completed", "updated", "alert_triggered")
  eventType: varchar("eventType", { length: 64 }).notNull(),
  // Arbitrary payload from the feature
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  // Importance weight for context synthesis (1-10)
  weight: int("weight").default(5).notNull(),
  // Whether Dr. Buddy has processed this event
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BrainEvent = typeof brainEvents.$inferSelect;
export type InsertBrainEvent = typeof brainEvents.$inferInsert;

// ─── Dr. Buddy Sessions (renamed from AI Advisory) ────────────────────────────
export const drBuddySessions = mysqlTable("dr_buddy_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  title: varchar("title", { length: 255 }),
  messages: json("messages").$type<DrBuddyMessage[]>().notNull(),
  // Snapshot of patient context at session start
  contextSnapshot: json("contextSnapshot").$type<Record<string, unknown>>(),
  sessionType: mysqlEnum("sessionType", [
    "general",
    "condition_specific",
    "treatment_planning",
    "crisis",
    "medication_review",
    "progress_review",
  ]).default("general"),
  // Crisis escalation flag
  crisisEscalated: boolean("crisisEscalated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrBuddySession = typeof drBuddySessions.$inferSelect;
export type InsertDrBuddySession = typeof drBuddySessions.$inferInsert;

export interface DrBuddyMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  citations?: string[];
  crisisFlag?: boolean;
  suggestedActions?: string[];
}

// ─── Doctor Portal — Patient Assignments ──────────────────────────────────────
// Allows psychiatrists/doctors to be assigned patients and view their full data.
export const doctorPatients = mysqlTable("doctor_patients", {
  id: int("id").autoincrement().primaryKey(),
  doctorUserId: int("doctorUserId").notNull().references(() => users.id),
  patientUserId: int("patientUserId").notNull().references(() => users.id),
  // Doctor's notes on this patient
  clinicalNotes: text("clinicalNotes"),
  // AI Whisperer suggestions generated for this patient
  whispererSuggestions: json("whispererSuggestions").$type<WhispererSuggestion[]>(),
  // Whether patient has consented to doctor access
  patientConsentGiven: boolean("patientConsentGiven").default(false).notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DoctorPatient = typeof doctorPatients.$inferSelect;
export type InsertDoctorPatient = typeof doctorPatients.$inferInsert;

export interface WhispererSuggestion {
  id: string;
  category: "medication" | "therapy" | "lifestyle" | "referral" | "crisis" | "monitoring";
  title: string;
  rationale: string;
  urgency: "routine" | "soon" | "urgent" | "emergency";
  evidenceBase: string;
  generatedAt: string;
  dismissed: boolean;
}
