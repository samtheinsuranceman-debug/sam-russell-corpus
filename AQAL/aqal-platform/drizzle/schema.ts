import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float, bigint, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
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
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  membershipTier: mysqlEnum("membership_tier", ["free", "silver", "gold", "platinum"]).default("free").notNull(),
  // Granted free access via a beta passcode (also used to count the first-N cap).
  betaAccess: boolean("beta_access").default(false).notNull(),
  // Tracker re-engagement email opt-in. null = never chosen (so we re-offer it on
  // login); true/false = their explicit, revocable choice. Only opted-in users get
  // the ~twice-a-month "start your next cycle" nudge.
  trackerReminderOptIn: boolean("tracker_reminder_opt_in"),
  // When we last sent that nudge — throttles the cadence.
  trackerReminderLastSentAt: timestamp("tracker_reminder_last_sent_at"),
  // Fully-underwritten assessment gate: when the 7-day free trial began (set on
  // first evidence upload) and when it was paid-for/unlocked (permanent).
  underwrittenTrialStartedAt: timestamp("underwritten_trial_started_at"),
  underwrittenUnlockedAt: timestamp("underwritten_unlocked_at"),
  // When we sent the one-time "you started but didn't finish" nudge (throttle).
  finishNudgeSentAt: timestamp("finish_nudge_sent_at"),
  // Founding-access password (member-chosen at claim): "salt:scryptHex".
  // Set on first claim; returning sign-ins must match. Null for OAuth users.
  passwordHash: varchar("password_hash", { length: 200 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Waitlist signups
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  tier: varchar("tier", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WaitlistEntry = typeof waitlist.$inferSelect;
export type InsertWaitlistEntry = typeof waitlist.$inferInsert;

// ============================================================
// ASSESSMENTS — One per user attempt
// ============================================================
// Testimonials — captured IN-APP at the peak moment (after the report/plan),
// with explicit consent to display. Nothing is shown publicly until approved.
export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5
  quote: text("quote"),
  displayName: varchar("displayName", { length: 120 }),
  consentToDisplay: boolean("consentToDisplay").default(false).notNull(),
  moment: varchar("moment", { length: 40 }), // where it was captured, e.g. "results" | "outcome_plan"
  status: mysqlEnum("status", ["pending", "approved", "hidden"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["in_progress", "processing", "complete", "failed"]).default("in_progress").notNull(),
  totalQuestions: int("totalQuestions").default(24).notNull(),
  completedQuestions: int("completedQuestions").default(0).notNull(),
  compositeRarity: int("compositeRarity"), // e.g. 47000 means "1 in 47,000"
  // Norming snapshot the composite was computed under — makes the score reproducible.
  normingVersion: varchar("normingVersion", { length: 48 }),
  // Birth year (optional) — enables cohort rarity: ranking within the user's own generation.
  birthYear: int("birthYear"),
  // Companion mode (optional): a high-acquaintance informant's read, kept SEPARATE from the
  // member's own scored answers so the self–other gap can be shown. { relation, vector, answered }.
  companion: json("companion"),
  promoCode: varchar("promoCode", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// ============================================================
// RESPONSES — One per question per assessment
// ============================================================
export const responses = mysqlTable("responses", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  questionIndex: int("questionIndex").notNull(), // 0-23
  audioUrl: text("audioUrl"), // S3 storage URL
  audioKey: varchar("audioKey", { length: 256 }),
  transcript: text("transcript"),
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Response = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;

// ============================================================
// SCORES — up to 32 line scores per assessment (one row per line)
// ============================================================
export const scores = mysqlTable("scores", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  axisIndex: int("axisIndex").notNull(), // 0 .. ALL_AXES.length - 1 (0–31); rows are keyed by axisIndex + axisName
  axisName: varchar("axisName", { length: 64 }).notNull(),
  score: float("score").notNull(), // 0.0 to 1.0
  confidence: float("confidence"), // AI confidence level
  reasoning: text("reasoning"), // AI reasoning for this score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Score = typeof scores.$inferSelect;
export type InsertScore = typeof scores.$inferInsert;

// ============================================================
// POWER COMBINATIONS — Detected multi-axis strengths
// ============================================================
export const powerCombinations = mysqlTable("power_combinations", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  name: varchar("name", { length: 128 }).notNull(), // e.g. "Strategic Visionary"
  description: text("description"),
  axes: text("axes"), // JSON array of axis indices
  rarityMultiplier: float("rarityMultiplier"), // How much rarer this combo makes them
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PowerCombination = typeof powerCombinations.$inferSelect;
export type InsertPowerCombination = typeof powerCombinations.$inferInsert;

// ============================================================
// PROMO CODES — Influencer referral system
// ============================================================
export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  influencerName: varchar("influencerName", { length: 128 }).notNull(),
  influencerEmail: varchar("influencerEmail", { length: 320 }),
  discountPercent: int("discountPercent").default(0).notNull(), // 0-100
  commissionPercent: int("commissionPercent").default(10).notNull(), // Revenue share %
  usageCount: int("usageCount").default(0).notNull(),
  maxUses: int("maxUses"), // null = unlimited
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = disabled
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

// ============================================================
// EVIDENCE — Uploaded artifacts to boost scores
// ============================================================
export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  userId: int("userId").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 256 }).notNull(),
  fileName: varchar("fileName", { length: 256 }),
  fileType: varchar("fileType", { length: 64 }), // pdf, image, video, etc.
  category: varchar("category", { length: 64 }), // cognitive, creative, interpersonal, etc.
  description: text("description"),
  axisTargets: text("axisTargets"), // JSON array of axis indices this evidence supports
  institution: varchar("institution", { length: 256 }), // e.g. MIT, Google, etc.
  evidenceDate: varchar("evidence_date", { length: 32 }), // YYYY-MM-DD or YYYY
  significance: text("significance"), // brief note on why this matters
  status: mysqlEnum("evidenceStatus", ["pending", "reviewed", "accepted", "rejected"]).default("pending").notNull(),
  reviewerNotes: text("reviewer_notes"), // feedback from reviewer
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

// ============================================================
// NLP PROFILES — Silent NLP metadata extracted during scoring
// ============================================================
export const nlpProfiles = mysqlTable("nlp_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: int("assessmentId").notNull(),

  // Representational System
  visualPercent: int("visualPercent").default(0).notNull(),
  auditoryPercent: int("auditoryPercent").default(0).notNull(),
  kinestheticPercent: int("kinestheticPercent").default(0).notNull(),
  olfactoryGustatoryPercent: int("olfactoryGustatoryPercent").default(0).notNull(),
  primaryRepSystem: mysqlEnum("primaryRepSystem", ["visual", "auditory", "kinesthetic", "olfactory_gustatory"]),
  repSystemSequence: varchar("repSystemSequence", { length: 20 }), // e.g. "V-K-A"

  // Meta-Programs (0.0 = left pole, 1.0 = right pole)
  towardAway: float("towardAway"), // 0=away, 1=toward
  internalExternal: float("internalExternal"), // 0=external, 1=internal
  optionsProcedures: float("optionsProcedures"), // 0=procedures, 1=options
  bigPictureDetail: float("bigPictureDetail"), // 0=detail, 1=big picture
  proactiveReactive: float("proactiveReactive"), // 0=reactive, 1=proactive
  matcherMismatcher: float("matcherMismatcher"), // 0=mismatcher, 1=matcher
  selfOther: float("selfOther"), // 0=other, 1=self
  possibilityNecessity: float("possibilityNecessity"), // 0=necessity, 1=possibility

  // Voice Patterns
  wordsPerMinute: float("wordsPerMinute"),
  avgPauseDurationMs: int("avgPauseDurationMs"),
  hesitationFrequency: float("hesitationFrequency"),
  confidenceScore: float("confidenceScore"),

  // Sensory Predicates (raw extracted JSON)
  sensoryPredicates: json("sensoryPredicates"), // {"visual": [...], "auditory": [...], ...}

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NlpProfile = typeof nlpProfiles.$inferSelect;
export type InsertNlpProfile = typeof nlpProfiles.$inferInsert;

// ============================================================
// COACHING LETTERS — Peter's NLP-mirrored weekly letters (Gold+)
// ============================================================
export const coachingLetters = mysqlTable("coaching_letters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tier: mysqlEnum("letterTier", ["silver", "gold", "platinum"]).notNull(),

  // Content
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull(),

  // NLP calibration used
  repSystemUsed: varchar("repSystemUsed", { length: 20 }),
  sensoryPredicatesUsed: json("sensoryPredicatesUsed"),
  metaProgramsAddressed: json("metaProgramsAddressed"),

  sentAt: bigint("sentAt", { mode: "number" }),
  readAt: bigint("readAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachingLetter = typeof coachingLetters.$inferSelect;
export type InsertCoachingLetter = typeof coachingLetters.$inferInsert;

// ============================================================
// REFERRAL PAYMENTS — Revenue share tracking per influencer
// ============================================================
export const referralPayments = mysqlTable("referral_payments", {
  id: int("id").autoincrement().primaryKey(),
  promoCodeId: int("promoCodeId").notNull(),
  userId: int("userId").notNull(), // The user who paid
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amountCents: int("amountCents").notNull(), // Total payment amount
  commissionCents: int("commissionCents").notNull(), // Influencer's share
  commissionPercent: int("commissionPercent").notNull(),
  status: mysqlEnum("referralStatus", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  paidAt: bigint("paidAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralPayment = typeof referralPayments.$inferSelect;
export type InsertReferralPayment = typeof referralPayments.$inferInsert;

// ============================================================
// LEADERBOARD — Opt-in public rarity rankings
// ============================================================
export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: int("assessmentId").notNull(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  compositeRarity: int("compositeRarity").notNull(), // Higher = rarer
  topPowerCombo: varchar("topPowerCombo", { length: 128 }),
  isPublic: int("isPublic").default(1).notNull(), // 1 = visible, 0 = hidden
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntry = typeof leaderboardEntries.$inferInsert;

// ============================================================
// CHALLENGE INVITES — "Challenge a Friend" viral mechanic
// ============================================================
export const challengeInvites = mysqlTable("challenge_invites", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 128 }).notNull(),
  senderRarity: int("senderRarity").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientId: int("recipientId"),
  recipientName: varchar("recipientName", { length: 128 }),
  recipientRarity: int("recipientRarity"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: mysqlEnum("challengeStatus", ["pending", "accepted", "completed", "expired"]).default("pending").notNull(),
  acceptedAt: bigint("acceptedAt", { mode: "number" }),
  completedAt: bigint("completedAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChallengeInvite = typeof challengeInvites.$inferSelect;
export type InsertChallengeInvite = typeof challengeInvites.$inferInsert;

// ============================================================
// VIDEO ASSESSMENTS — Platinum-tier multimodal analysis
// ============================================================
export const videoAssessments = mysqlTable("video_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: int("assessmentId"),

  // Source media
  videoUrl: text("videoUrl"), // S3 storage key
  audioUrl: text("audioUrl"), // extracted audio track
  durationMs: int("durationMs"),

  // Processing status
  status: mysqlEnum("videoStatus", ["pending", "processing", "complete", "failed"]).default("pending").notNull(),
  processingStartedAt: bigint("processingStartedAt", { mode: "number" }),
  completedAt: bigint("completedAt", { mode: "number" }),
  errorMessage: text("errorMessage"),

  // Body Language Analysis
  bodyLanguage: json("bodyLanguage"), // { openness, confidence, engagement, dominance, nervousness, congruence }
  gesturePatterns: json("gesturePatterns"), // [{ type, frequency, context }]
  postureShifts: json("postureShifts"), // [{ timestamp, from, to, trigger }]
  microExpressions: json("microExpressions"), // [{ timestamp, emotion, duration, intensity }]

  // Eye-Accessing Cue Mapping (NLP)
  eyePatterns: json("eyePatterns"), // { visualConstruct, visualRecall, auditoryConstruct, auditoryRecall, kinesthetic, internalDialogue }
  dominantAccessPattern: varchar("dominantAccessPattern", { length: 32 }), // "visual_recall", "auditory_construct", etc.
  eyeMovementSequences: json("eyeMovementSequences"), // [{ question, sequence: ["VR", "K", "AD"], interpretation }]
  leadSystem: varchar("leadSystem", { length: 20 }), // first eye movement before speaking

  // Behavioral Fusion (combined video + audio)
  congruenceScore: float("congruenceScore"), // 0-1: how well verbal matches nonverbal
  authenticityMarkers: json("authenticityMarkers"), // [{ marker, confidence, evidence }]
  stressIndicators: json("stressIndicators"), // [{ type, timestamp, intensity }]
  rapportSignals: json("rapportSignals"), // [{ type, frequency, context }]

  // Composite behavioral profile
  behavioralProfile: json("behavioralProfile"), // Full 200+ marker profile
  axisAdjustments: json("axisAdjustments"), // [{ axisIndex, adjustment, reason }]

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoAssessment = typeof videoAssessments.$inferSelect;
export type InsertVideoAssessment = typeof videoAssessments.$inferInsert;

// ============================================================
// COMMITMENTS — the Personal Commitment Agreement (self-engineered dedication)
// ============================================================
// One per user. `answers` holds their spoken (mic-narrated, never typed) responses
// to the commitment questions, verbatim. Signing is a personal act, not a legal
// one. Reminder prefs opt them into a daily Y/N check-in for the first 30 days.
// Append-only: a signed letter is NEVER edited or deleted. A person can write a
// NEW letter that supersedes the prior one (supersededAt is stamped on the old),
// but every signed letter stays in their archive, immutable. `version` counts up.
export const commitments = mysqlTable("commitments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: int("assessmentId"), // the assessment this commitment is anchored to
  version: int("version").default(1).notNull(), // 1, 2, 3… per user
  // Their declared outcomes at the time of signing (snapshot, so the letter is stable).
  goals: text("goals"),
  // [{ key, transcript }] — spoken answers, verbatim.
  answers: json("answers"),
  // E-signature: their typed name is acceptable as a signature; the reasons are spoken.
  signedName: varchar("signedName", { length: 160 }),
  signedAt: timestamp("signedAt"),
  // Stamped when a newer signed letter replaces this one. null = current/active.
  supersededAt: timestamp("supersededAt"),
  status: mysqlEnum("commitmentStatus", ["draft", "signed"]).default("draft").notNull(),
  // Daily accountability opt-in for the first 30 days.
  reminderChannel: mysqlEnum("reminderChannel", ["none", "email", "text"]).default("none").notNull(),
  reminderPhone: varchar("reminderPhone", { length: 32 }),
  // IANA timezone captured from the browser (e.g. "America/New_York") so the daily
  // check-in lands at ~8 PM THEIR local time, not a fixed hour for everyone.
  reminderTimezone: varchar("reminderTimezone", { length: 64 }),
  // Explicit consent to receive the daily text/email (opt-in, revocable).
  reminderConsentAt: timestamp("reminderConsentAt"),
  reminderStartAt: timestamp("reminderStartAt"), // when the 30-day window began
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitment = typeof commitments.$inferInsert;

// ============================================================
// TRACKER CYCLES — the 30/60/90-day behavioral-journal loop
// ============================================================
// Each row is one completed cycle: the person dictated a daily journal, uploaded
// it, and we produced a SELF-REPORTED (not independently verified) re-estimate of
// their profile plus a fresh, honestly-hypothetical Vision. This is the recurring
// touchpoint that justifies a subscription — they come back every ~30 days.
export const trackerCycles = mysqlTable("trackerCycles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: int("assessmentId"), // the assessment this cycle updates
  cycleNumber: int("cycleNumber").default(1).notNull(), // 1, 2, 3… per user
  days: int("days").default(30).notNull(),               // cycle length (30/60/90)
  // The uploaded, self-reported journal text (dictated then pasted). Verbatim.
  journalText: text("journalText").notNull(),
  // Model output for this cycle (all SELF-REPORTED / directional):
  summary: text("summary"),               // what changed, in plain language
  adjustments: json("adjustments"),       // [{ line, direction, note }] directional profile deltas
  freshVision: text("freshVision"),       // updated, hypothetical future-pace off this cycle
  adherenceNote: text("adherenceNote"),   // honest read on consistency from the journal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrackerCycle = typeof trackerCycles.$inferSelect;
export type InsertTrackerCycle = typeof trackerCycles.$inferInsert;

// ============================================================
// ANALYTICS EVENTS — funnel + scoring-pipeline instrumentation (Stage 6)
// ============================================================
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 48 }).notNull(), // funnel stage or pipeline event
  userId: int("userId"),                            // nullable (anonymous landing)
  sessionId: varchar("sessionId", { length: 64 }),  // anonymous funnel correlation
  numericValue: float("numericValue"),              // e.g. latency ms for pipeline events
  ok: boolean("ok"),                                // success flag for pipeline events
  meta: json("meta"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// MARKETING SPEND — manual entry so CAC = spend / new subscribers is computable.
export const marketingSpend = mysqlTable("marketing_spend", {
  id: int("id").autoincrement().primaryKey(),
  periodStart: timestamp("periodStart").notNull(),
  amountCents: int("amountCents").notNull(),
  channel: varchar("channel", { length: 64 }),
  note: varchar("note", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketingSpend = typeof marketingSpend.$inferSelect;
export type InsertMarketingSpend = typeof marketingSpend.$inferInsert;

// ============================================================
// MATCHES — pre-computed complementarity, top-N per member
// ============================================================
// One row per (userId → matchedUserId) direction. Refreshed lazily (24h TTL)
// when the member opens their matches page; a batch recompute can also run.
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  matchedUserId: int("matchedUserId").notNull(),
  score: float("score").notNull(), // 0..1 complementarity
  // Top complementary axes for the card: [{axis, direction, delta}]
  topAxes: json("topAxes"),
  computedAt: timestamp("computedAt").defaultNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

// CONNECTION REQUESTS — "Request Connection"; mutual accept reveals email.
export const connectionRequests = mysqlTable("connection_requests", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
});

export type ConnectionRequest = typeof connectionRequests.$inferSelect;
export type InsertConnectionRequest = typeof connectionRequests.$inferInsert;

// ============================================================
// DIRECT MESSAGES — member-to-member, connections only
// ============================================================
// Phase-2 messaging (schematic §3): 1-to-1 text + ephemeral attachments between
// mutually-accepted connections. Text persists; attachment FILES are purged from
// storage 72h after upload (attachmentExpired flips true, name kept for the
// "[Attachment expired]" placeholder). No staff access; no third-party sharing.
export const directMessages = mysqlTable("direct_messages", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId").notNull(),
  content: text("content"), // nullable when attachment-only
  attachmentKey: varchar("attachmentKey", { length: 512 }),
  attachmentName: varchar("attachmentName", { length: 255 }),
  attachmentType: varchar("attachmentType", { length: 100 }), // MIME
  attachmentSize: int("attachmentSize"), // bytes
  attachmentExpiresAt: timestamp("attachmentExpiresAt"), // upload + 72h
  attachmentExpired: boolean("attachmentExpired").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;
