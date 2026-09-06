import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id:            int("id").autoincrement().primaryKey(),
  openId:        varchar("openId", { length: 64 }).notNull().unique(),
  name:          text("name"),
  email:         varchar("email", { length: 320 }),
  loginMethod:   varchar("loginMethod", { length: 64 }),
  role:          mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  firstName:     varchar("firstName", { length: 100 }),
  lastName:      varchar("lastName", { length: 100 }),
  passwordHash:  varchar("passwordHash", { length: 255 }),
  resetToken:    varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn:  timestamp("lastSignedIn").defaultNow().notNull(),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  loginCount:          int("loginCount").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Workspaces ───────────────────────────────────────────────────────────────
export const workspaces = mysqlTable("workspaces", {
  id:        int("id").autoincrement().primaryKey(),
  name:      varchar("name", { length: 200 }).notNull(),
  slug:      varchar("slug", { length: 100 }).notNull().unique(),
  ownerId:      int("ownerId").notNull(),
  logoUrl:      varchar("logoUrl", { length: 2000 }),
  primaryColor: varchar("primaryColor", { length: 20 }),
  accentColor:  varchar("accentColor", { length: 20 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;

// ─── Workspace Memberships ────────────────────────────────────────────────────
export const memberships = mysqlTable("memberships", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId:      int("userId").notNull(),
  role:        mysqlEnum("role", ["SUPER_ADMIN", "ADMIN", "ADVISOR", "ANALYST", "VIEWER"]).default("VIEWER").notNull(),
  status:      mysqlEnum("status", ["ACTIVE", "SUSPENDED", "PENDING"]).default("ACTIVE").notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Membership = typeof memberships.$inferSelect;

// ─── Workspace Invitations ────────────────────────────────────────────────────
export const workspaceInvitations = mysqlTable("workspace_invitations", {
  id:            int("id").autoincrement().primaryKey(),
  workspaceId:   int("workspaceId").notNull(),
  invitedByUserId: int("invitedByUserId"),
  email:         varchar("email", { length: 320 }).notNull(),
  firstName:     varchar("firstName", { length: 100 }),
  lastName:      varchar("lastName", { length: 100 }),
  role:          mysqlEnum("role", ["SUPER_ADMIN", "ADMIN", "ADVISOR", "ANALYST", "VIEWER"]).default("ANALYST").notNull(),
  status:        mysqlEnum("status", ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]).default("PENDING").notNull(),
  tokenHash:     varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt:     timestamp("expiresAt").notNull(),
  acceptedAt:    timestamp("acceptedAt"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});

export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;

// ─── Workspace Subscriptions ──────────────────────────────────────────────────
export const workspaceSubscriptions = mysqlTable("workspace_subscriptions", {
  id:                  int("id").autoincrement().primaryKey(),
  workspaceId:         int("workspaceId").notNull(),
  planSlug:            varchar("planSlug", { length: 50 }).notNull().default("growth"),
  status:              mysqlEnum("status", ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "PAUSED"]).default("TRIALING").notNull(),
  billingInterval:     mysqlEnum("billingInterval", ["MONTHLY", "ANNUAL"]).default("MONTHLY").notNull(),
  seats:               int("seats").default(1).notNull(),
  stripeCustomerId:    varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  currentPeriodStart:  timestamp("currentPeriodStart"),
  currentPeriodEnd:    timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd:   boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkspaceSubscription = typeof workspaceSubscriptions.$inferSelect;

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id:               int("id").autoincrement().primaryKey(),
  workspaceId:      int("workspaceId").notNull(),
  name:             varchar("name", { length: 200 }).notNull(),
  household:        varchar("household", { length: 200 }),
  email:            varchar("email", { length: 320 }),
  phone:            varchar("phone", { length: 30 }),
  age:              int("age"),
  state:            varchar("state", { length: 50 }),
  filingStatus:     mysqlEnum("filingStatus", ["single", "joint", "hoh"]).default("joint"),
  income:           decimal("income", { precision: 15, scale: 2 }),
  iraBalance:       decimal("iraBalance", { precision: 15, scale: 2 }),
  rothBalance:      decimal("rothBalance", { precision: 15, scale: 2 }),
  taxableAssets:    decimal("taxableAssets", { precision: 15, scale: 2 }),
  realEstateEquity: decimal("realEstateEquity", { precision: 15, scale: 2 }),
  lifeInsuranceCv:  decimal("lifeInsuranceCv", { precision: 15, scale: 2 }),
  firstName:        varchar("firstName", { length: 100 }),
  lastName:         varchar("lastName", { length: 100 }),
  riskTolerance:    mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive", "very_aggressive"]),
  annualIncome:     decimal("annualIncome", { precision: 15, scale: 2 }),
  totalNetWorth:    decimal("totalNetWorth", { precision: 15, scale: 2 }),
  retirementAge:    int("retirementAge"),
  spouseName:       varchar("spouseName", { length: 200 }),
  spouseAge:        int("spouseAge"),
  dependents:       int("dependents"),
  spouseIncome:     decimal("spouseIncome", { precision: 15, scale: 2 }),
  monthlyExpenses:  decimal("monthlyExpenses", { precision: 15, scale: 2 }),
  cashSavings:      decimal("cashSavings", { precision: 15, scale: 2 }),
  homeValue:        decimal("homeValue", { precision: 15, scale: 2 }),
  k401Balance:      decimal("k401Balance", { precision: 15, scale: 2 }),
  pensionIncome:    decimal("pensionIncome", { precision: 15, scale: 2 }),
  socialSecurityEstimate: decimal("socialSecurityEstimate", { precision: 15, scale: 2 }),
  lifeInsuranceDb:  decimal("lifeInsuranceDb", { precision: 15, scale: 2 }),
  annualPremium:    decimal("annualPremium", { precision: 15, scale: 2 }),
  annuityValue:     decimal("annuityValue", { precision: 15, scale: 2 }),
  hasLTC:           boolean("hasLTC").default(false),
  mortgageBalance:  decimal("mortgageBalance", { precision: 15, scale: 2 }),
  mortgageRate:     decimal("mortgageRate", { precision: 5, scale: 4 }),
  mortgageYearsLeft: int("mortgageYearsLeft"),
  totalMortgageInterest: decimal("totalMortgageInterest", { precision: 15, scale: 2 }),
  otherDebt:        decimal("otherDebt", { precision: 15, scale: 2 }),
  helocRate:        decimal("helocRate", { precision: 5, scale: 4 }),
  ficoScore:        int("ficoScore"),
  notes:            text("notes"),
  tags:             json("tags").$type<string[]>(),
  opportunityScore: int("opportunityScore"),
  hubspotContactId: varchar("hubspotContactId", { length: 100 }),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Deals / Pipeline ─────────────────────────────────────────────────────────
export const deals = mysqlTable("deals", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  stage:       mysqlEnum("stage", ["LEAD", "QUALIFIED", "STRATEGY", "PROPOSAL", "CLOSED_WON", "CLOSED_LOST"]).default("LEAD").notNull(),
  ownerName:   varchar("ownerName", { length: 200 }),
  value:       decimal("value", { precision: 15, scale: 2 }),
  probability: decimal("probability", { precision: 5, scale: 4 }),
  notes:       text("notes"),
  closedAt:    timestamp("closedAt"),
  hubspotDealId: varchar("hubspotDealId", { length: 100 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ─── Strategies ───────────────────────────────────────────────────────────────
export const strategies = mysqlTable("strategies", {
  id:             int("id").autoincrement().primaryKey(),
  clientId:       int("clientId").notNull(),
  workspaceId:    int("workspaceId").notNull(),
  summary:        text("summary"),
  taxPlan:        text("taxPlan"),
  insurancePlan:  text("insurancePlan"),
  investmentPlan: text("investmentPlan"),
  advisorScript:  text("advisorScript"),
  generatedBy:    mysqlEnum("generatedBy", ["AI", "MANUAL", "HYBRID"]).default("MANUAL").notNull(),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Strategy = typeof strategies.$inferSelect;

// ─── Scenario Snapshots ───────────────────────────────────────────────────────
export const scenarioSnapshots = mysqlTable("scenario_snapshots", {
  id:           int("id").autoincrement().primaryKey(),
  workspaceId:  int("workspaceId").notNull(),
  clientId:     int("clientId"),
  name:         varchar("name", { length: 200 }).notNull(),
  scenarioType: mysqlEnum("scenarioType", ["ROTH", "IUL", "REAL_ESTATE", "COMBINED", "ROTH_CONVERSION_STR", "OIL_GAS_ROTH", "MORTGAGE_KILLER"]).default("COMBINED").notNull(),
  inputJson:    json("inputJson").$type<Record<string, unknown>>(),
  outputJson:   json("outputJson").$type<Record<string, unknown>>(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioSnapshot = typeof scenarioSnapshots.$inferSelect;

// ─── Knowledge Documents ──────────────────────────────────────────────────────
export const knowledgeDocuments = mysqlTable("knowledge_documents", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  title:       varchar("title", { length: 300 }).notNull(),
  docType:     mysqlEnum("docType", ["MESSAGING_LIBRARY", "OBJECTION_GUIDE", "OFFER_POSITIONING", "RENEWAL_POSITIONING", "TONE_RULE", "COMPLIANCE_RULE", "PLAYBOOK_GUIDANCE"]).default("PLAYBOOK_GUIDANCE").notNull(),
  status:      mysqlEnum("status", ["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE").notNull(),
  summary:     text("summary"),
  content:     text("content"),
  tags:        json("tags").$type<string[]>(),
  sourceLabel: varchar("sourceLabel", { length: 100 }),
  versionLabel: varchar("versionLabel", { length: 50 }),
  chunkCount:  int("chunkCount").default(0).notNull(),
  fileUrl:     varchar("fileUrl", { length: 1000 }),
  fileKey:     varchar("fileKey", { length: 500 }),
  fileMime:    varchar("fileMime", { length: 100 }),
  fileSize:    int("fileSize"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;

// ─── AI Memory Notes ──────────────────────────────────────────────────────────
export const aiMemoryNotes = mysqlTable("ai_memory_notes", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  clientId:    int("clientId"),
  content:     text("content").notNull(),
  source:      varchar("source", { length: 100 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type AiMemoryNote = typeof aiMemoryNotes.$inferSelect;

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  actorUserId: int("actorUserId"),
  action:      varchar("action", { length: 200 }).notNull(),
  entityType:  varchar("entityType", { length: 100 }),
  entityId:    varchar("entityId", { length: 100 }),
  metadata:    json("metadata").$type<Record<string, unknown>>(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// ─── Client Activity Log (per-client audit trail) ───────────────────────────
export const clientActivityLog = mysqlTable("client_activity_log", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  action:      varchar("action", { length: 100 }).notNull(),
  actorName:   varchar("actorName", { length: 200 }),
  actorUserId: int("actorUserId"),
  entityType:  varchar("entityType", { length: 50 }),
  entityId:    int("entityId"),
  summary:     text("summary"),
  metadata:    json("metadata").$type<Record<string, unknown>>(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type ClientActivityLogEntry = typeof clientActivityLog.$inferSelect;
export type InsertClientActivityLog = typeof clientActivityLog.$inferInsert;

// ─── Client Tags ─────────────────────────────────────────────────────────────
export const clientTags = mysqlTable("client_tags", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  name:        varchar("name", { length: 100 }).notNull(),
  color:       varchar("color", { length: 20 }).default("#4f8cff").notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type ClientTag = typeof clientTags.$inferSelect;
export type InsertClientTag = typeof clientTags.$inferInsert;

export const clientTagAssignments = mysqlTable("client_tag_assignments", {
  id:       int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  tagId:    int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientTagAssignment = typeof clientTagAssignments.$inferSelect;

// ─── Advisor Goals ───────────────────────────────────────────────────────────
export const advisorGoals = mysqlTable("advisor_goals", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  goalType:    mysqlEnum("goalType", ["AUM_TARGET", "DEALS_CLOSED", "NEW_CLIENTS", "REVENUE"]).notNull(),
  targetValue: decimal("targetValue", { precision: 15, scale: 2 }).notNull(),
  period:      varchar("period", { length: 20 }).notNull(),
  startDate:   timestamp("startDate").notNull(),
  endDate:     timestamp("endDate").notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdvisorGoal = typeof advisorGoals.$inferSelect;
export type InsertAdvisorGoal = typeof advisorGoals.$inferInsert;

// ─── Webhook Endpoints ───────────────────────────────────────────────────────
export const webhookEndpoints = mysqlTable("webhook_endpoints", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  url:         varchar("url", { length: 1000 }).notNull(),
  label:       varchar("label", { length: 200 }),
  events:      json("events").$type<string[]>().notNull(),
  secret:      varchar("secret", { length: 128 }),
  active:      boolean("active").default(true).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  failCount:   int("failCount").default(0).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type InsertWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

// ─── Client Documents (Vault) ────────────────────────────────────────────────
export const clientDocuments = mysqlTable("client_documents", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  name:        varchar("name", { length: 500 }).notNull(),
  fileKey:     varchar("fileKey", { length: 1000 }).notNull(),
  url:         varchar("url", { length: 2000 }).notNull(),
  mimeType:    varchar("mimeType", { length: 200 }),
  sizeBytes:   int("sizeBytes"),
  category:    mysqlEnum("category", ["TAX_RETURN", "ESTATE_PLAN", "INSURANCE_POLICY", "INVESTMENT_STATEMENT", "TRUST_DOCUMENT", "LEGAL_AGREEMENT", "FINANCIAL_PLAN", "OTHER"]).default("OTHER").notNull(),
  uploadedBy:  int("uploadedBy"),
  uploadedByName: varchar("uploadedByName", { length: 200 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = typeof clientDocuments.$inferInsert;

// ─── Report Schedules ────────────────────────────────────────────────────────
export const reportSchedules = mysqlTable("report_schedules", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  frequency:   mysqlEnum("frequency", ["MONTHLY", "QUARTERLY"]).default("MONTHLY").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  active:      boolean("active").default(true).notNull(),
  lastSentAt:  timestamp("lastSentAt"),
  nextSendAt:  timestamp("nextSendAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type InsertReportSchedule = typeof reportSchedules.$inferInsert;

// ─── Slack Integrations ──────────────────────────────────────────────────────
export const slackIntegrations = mysqlTable("slack_integrations", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  teamId:      varchar("teamId", { length: 100 }),
  teamName:    varchar("teamName", { length: 200 }),
  botToken:    varchar("botToken", { length: 500 }),
  channelId:   varchar("channelId", { length: 100 }),
  channelName: varchar("channelName", { length: 200 }),
  webhookUrl:  varchar("webhookUrl", { length: 1000 }),
  active:      boolean("active").default(true).notNull(),
  configJson:  json("configJson").$type<Record<string, unknown>>(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SlackIntegration = typeof slackIntegrations.$inferSelect;
export type InsertSlackIntegration = typeof slackIntegrations.$inferInsert;

// ─── Client Portal Tokens ───────────────────────────────────────────────────
export const clientPortalTokens = mysqlTable("client_portal_tokens", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  token:       varchar("token", { length: 128 }).notNull().unique(),
  label:       varchar("label", { length: 200 }),
  createdByUserId: int("createdByUserId"),
  expiresAt:   timestamp("expiresAt").notNull(),
  lastAccessedAt: timestamp("lastAccessedAt"),
  accessCount: int("accessCount").default(0).notNull(),
  active:      boolean("active").default(true).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type ClientPortalToken = typeof clientPortalTokens.$inferSelect;
export type InsertClientPortalToken = typeof clientPortalTokens.$inferInsert;

// ─── Allocation Targets ─────────────────────────────────────────────────────
export const allocationTargets = mysqlTable("allocation_targets", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  assetClass:  varchar("assetClass", { length: 100 }).notNull(),
  targetPct:   decimal("targetPct", { precision: 5, scale: 2 }).notNull(),
  currentPct:  decimal("currentPct", { precision: 5, scale: 2 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AllocationTarget = typeof allocationTargets.$inferSelect;
export type InsertAllocationTarget = typeof allocationTargets.$inferInsert;

// ─── Rebalance Alerts ───────────────────────────────────────────────────────
export const rebalanceAlerts = mysqlTable("rebalance_alerts", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  assetClass:  varchar("assetClass", { length: 100 }).notNull(),
  targetPct:   decimal("targetPct", { precision: 5, scale: 2 }).notNull(),
  currentPct:  decimal("currentPct", { precision: 5, scale: 2 }).notNull(),
  driftPct:    decimal("driftPct", { precision: 5, scale: 2 }).notNull(),
  threshold:   decimal("threshold", { precision: 5, scale: 2 }).notNull(),
  status:      mysqlEnum("status", ["OPEN", "ACKNOWLEDGED", "RESOLVED"]).default("OPEN").notNull(),
  resolvedAt:  timestamp("resolvedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type RebalanceAlert = typeof rebalanceAlerts.$inferSelect;
export type InsertRebalanceAlert = typeof rebalanceAlerts.$inferInsert;

// ─── Client Notes / Activity Feed ────────────────────────────────────────────
export const clientNotes = mysqlTable("client_notes", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  authorId:    int("authorId").notNull(),
  authorName:  varchar("authorName", { length: 200 }),
  noteType:    mysqlEnum("noteType", ["CALL", "MEETING", "EMAIL", "TASK", "GENERAL"]).default("GENERAL").notNull(),
  content:     text("content").notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

// ─── In-App Notifications ───────────────────────────────────────────────────
export const inAppNotifications = mysqlTable("in_app_notifications", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId:      int("userId"),
  type:        varchar("type", { length: 50 }).notNull(),
  title:       varchar("title", { length: 300 }).notNull(),
  message:     text("message").notNull(),
  link:        varchar("link", { length: 1000 }),
  read:        boolean("read").default(false).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;

// ─── Client Meetings ───────────────────────────────────────────────────────
export const clientMeetings = mysqlTable("client_meetings", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  title:       varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMin: int("durationMin").default(60).notNull(),
  location:    varchar("location", { length: 500 }),
  meetingType: mysqlEnum("meetingType", ["IN_PERSON", "VIDEO", "PHONE", "OTHER"]).default("VIDEO").notNull(),
  status:      mysqlEnum("status", ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).default("SCHEDULED").notNull(),
  notes:       text("notes"),
  createdBy:   int("createdBy"),
  createdByName: varchar("createdByName", { length: 200 }),
  reminderSentAt: timestamp("reminderSentAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientMeeting = typeof clientMeetings.$inferSelect;
export type InsertClientMeeting = typeof clientMeetings.$inferInsert;

// ─── Dashboard Widget Configs ──────────────────────────────────────────────
export const dashboardWidgetConfigs = mysqlTable("dashboard_widget_configs", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  widgetId:    varchar("widgetId", { length: 100 }).notNull(),
  position:    int("position").default(0).notNull(),
  visible:     boolean("visible").default(true).notNull(),
  size:        mysqlEnum("size", ["SMALL", "MEDIUM", "LARGE", "FULL"]).default("MEDIUM").notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DashboardWidgetConfig = typeof dashboardWidgetConfigs.$inferSelect;
export type InsertDashboardWidgetConfig = typeof dashboardWidgetConfigs.$inferInsert;

// ─── Meeting Reminder Preferences ─────────────────────────────────────────
export const meetingReminderPrefs = mysqlTable("meeting_reminder_prefs", {
  id:              int("id").autoincrement().primaryKey(),
  workspaceId:     int("workspaceId").notNull(),
  userId:          int("userId").notNull(),
  meetingType:     mysqlEnum("meetingType", ["IN_PERSON", "VIDEO", "PHONE", "OTHER"]).notNull(),
  enabled:         boolean("enabled").default(true).notNull(),
  leadTimeMinutes: int("leadTimeMinutes").default(1440).notNull(), // default 24 hours
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MeetingReminderPref = typeof meetingReminderPrefs.$inferSelect;
export type InsertMeetingReminderPref = typeof meetingReminderPrefs.$inferInsert;

// ─── Risk Score History ─────────────────────────────────────────────────────
export const riskScoreHistory = mysqlTable("risk_score_history", {
  id:           int("id").autoincrement().primaryKey(),
  clientId:     int("clientId").notNull(),
  workspaceId:  int("workspaceId").notNull(),
  score:        int("score").notNull(),
  level:        mysqlEnum("level", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  factors:      json("factors").$type<{
    aumConcentration: number;
    filingComplexity: number;
    strategyDiversity: number;
    engagementRecency: number;
    portfolioSize: number;
  }>(),
  snapshotDate: timestamp("snapshotDate").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export type RiskScoreHistoryEntry = typeof riskScoreHistory.$inferSelect;
export type InsertRiskScoreHistory = typeof riskScoreHistory.$inferInsert;

// ─── HubSpot Sync Log ──────────────────────────────────────────────────────
export const hubspotSyncLog = mysqlTable("hubspot_sync_log", {
  id:           int("id").autoincrement().primaryKey(),
  workspaceId:  int("workspaceId").notNull(),
  direction:    mysqlEnum("direction", ["PUSH", "PULL"]).notNull(),
  objectType:   mysqlEnum("objectType", ["CONTACT", "DEAL"]).notNull(),
  hubspotId:    varchar("hubspotId", { length: 100 }),
  localId:      int("localId"),
  status:       mysqlEnum("status", ["SUCCESS", "FAILED", "SKIPPED"]).default("SUCCESS").notNull(),
  errorMessage: text("errorMessage"),
  syncedAt:     timestamp("syncedAt").defaultNow().notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export type HubspotSyncLogEntry = typeof hubspotSyncLog.$inferSelect;
export type InsertHubspotSyncLog = typeof hubspotSyncLog.$inferInsert;

// ─── HubSpot Sync Settings ────────────────────────────────────────────────
export const hubspotSyncSettings = mysqlTable("hubspot_sync_settings", {
  id:                int("id").autoincrement().primaryKey(),
  workspaceId:       int("workspaceId").notNull(),
  syncEnabled:       boolean("syncEnabled").default(false).notNull(),
  syncContacts:      boolean("syncContacts").default(true).notNull(),
  syncDeals:         boolean("syncDeals").default(true).notNull(),
  syncDirection:     mysqlEnum("syncDirection", ["BIDIRECTIONAL", "PUSH_ONLY", "PULL_ONLY"]).default("BIDIRECTIONAL").notNull(),
  lastSyncAt:        timestamp("lastSyncAt"),
  lastSyncStatus:    mysqlEnum("lastSyncStatus", ["SUCCESS", "PARTIAL", "FAILED"]).default("SUCCESS"),
  lastSyncContactsPushed:  int("lastSyncContactsPushed").default(0),
  lastSyncContactsPulled:  int("lastSyncContactsPulled").default(0),
  lastSyncDealsPushed:     int("lastSyncDealsPushed").default(0),
  lastSyncDealsPulled:     int("lastSyncDealsPulled").default(0),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
  updatedAt:         timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HubspotSyncSetting = typeof hubspotSyncSettings.$inferSelect;
export type InsertHubspotSyncSetting = typeof hubspotSyncSettings.$inferInsert;

// ─── Compliance Alerts ─────────────────────────────────────────────────────
export const complianceAlerts = mysqlTable("compliance_alerts", {
  id:           int("id").autoincrement().primaryKey(),
  clientId:     int("clientId").notNull(),
  workspaceId:  int("workspaceId").notNull(),
  alertType:    mysqlEnum("alertType", [
    "RMD_DEADLINE", "CONTRIBUTION_LIMIT", "FILING_DEADLINE",
    "REBALANCE_OVERDUE", "REVIEW_OVERDUE", "AGE_MILESTONE",
    "HIGH_CONCENTRATION", "STALE_STRATEGY",
  ]).notNull(),
  severity:     mysqlEnum("severity", ["INFO", "WARNING", "CRITICAL"]).default("WARNING").notNull(),
  title:        varchar("title", { length: 300 }).notNull(),
  message:      text("message").notNull(),
  dueDate:      timestamp("dueDate"),
  dismissed:    boolean("dismissed").default(false).notNull(),
  dismissedBy:  int("dismissedBy"),
  dismissedAt:  timestamp("dismissedAt"),
  resolvedAt:   timestamp("resolvedAt"),
  metadata:     json("metadata").$type<Record<string, unknown>>(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});

export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type InsertComplianceAlert = typeof complianceAlerts.$inferInsert;

// ─── Client Properties (Mortgage/Real Estate) ────────────────────────────────
export const clientProperties = mysqlTable("client_properties", {
  id:                        int("id").autoincrement().primaryKey(),
  clientId:                  int("clientId").notNull(),
  workspaceId:               int("workspaceId").notNull(),
  propertyName:              varchar("propertyName", { length: 300 }).notNull(),
  propertyType:              mysqlEnum("propertyType", ["PRIMARY", "INVESTMENT", "SHORT_TERM_RENTAL", "COMMERCIAL", "LAND"]).default("PRIMARY").notNull(),
  propertyValue:             decimal("propertyValue", { precision: 15, scale: 2 }),
  monthlyMortgagePayment:    decimal("monthlyMortgagePayment", { precision: 12, scale: 2 }),
  monthlyInterestOnlyPayment: decimal("monthlyInterestOnlyPayment", { precision: 12, scale: 2 }),
  totalInterestPayment:      decimal("totalInterestPayment", { precision: 15, scale: 2 }),
  monthlyRentalIncome:       decimal("monthlyRentalIncome", { precision: 12, scale: 2 }),
  annualAppreciation:        decimal("annualAppreciation", { precision: 5, scale: 4 }),
  isPrimary:                 boolean("isPrimary").default(false).notNull(),
  mortgageBalance:           decimal("mortgageBalance", { precision: 15, scale: 2 }),
  interestRate:              decimal("interestRate", { precision: 5, scale: 4 }),
  loanTermYears:             int("loanTermYears"),
  createdAt:                 timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                 timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientProperty = typeof clientProperties.$inferSelect;
export type InsertClientProperty = typeof clientProperties.$inferInsert;

// ─── Client Crypto Holdings ──────────────────────────────────────────────────
export const clientCryptoHoldings = mysqlTable("client_crypto_holdings", {
  id:                    int("id").autoincrement().primaryKey(),
  clientId:              int("clientId").notNull(),
  workspaceId:           int("workspaceId").notNull(),
  coinId:                varchar("coinId", { length: 100 }).notNull(),
  coinName:              varchar("coinName", { length: 200 }).notNull(),
  coinSymbol:            varchar("coinSymbol", { length: 20 }),
  quantity:              decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  avgPurchasePrice:      decimal("avgPurchasePrice", { precision: 15, scale: 2 }).notNull(),
  amountStaked:          decimal("amountStaked", { precision: 20, scale: 8 }),
  stakingPercentage:     decimal("stakingPercentage", { precision: 8, scale: 4 }),
  predictedStakingIncome: decimal("predictedStakingIncome", { precision: 15, scale: 2 }),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientCryptoHolding = typeof clientCryptoHoldings.$inferSelect;
export type InsertClientCryptoHolding = typeof clientCryptoHoldings.$inferInsert;

// ── Saved Strategy Projections ──
export const savedStrategies = mysqlTable("saved_strategies", {
  id:              int("id").primaryKey().autoincrement(),
  workspaceId:     int("workspaceId").notNull(),
  clientId:        int("clientId"),
  clientName:      varchar("clientName", { length: 200 }),
  advisorId:       int("advisorId").notNull(),
  advisorName:     varchar("advisorName", { length: 200 }),
  version:         int("version").default(1).notNull(),
  parentStrategyId: int("parentStrategyId"),
  strategyType:    varchar("strategyType", { length: 50 }).notNull(), // e.g. "year1_non_solar", "year3_non_solar", "year1_solar"
  strategyLabel:   varchar("strategyLabel", { length: 200 }).notNull(),
  carrierId:       varchar("carrierId", { length: 50 }),
  carrierName:     varchar("carrierName", { length: 200 }),
  inputsJson:      json("inputsJson").notNull(),       // full input parameters
  summaryJson:     json("summaryJson").notNull(),       // summary metrics
  iulProjectionJson: json("iulProjectionJson"),         // IUL year-by-year
  strProjectionJson: json("strProjectionJson"),         // STR year-by-year
  notes:           text("notes"),
  isArchived:      boolean("isArchived").default(false).notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedStrategy = typeof savedStrategies.$inferSelect;
export type InsertSavedStrategy = typeof savedStrategies.$inferInsert;

// ── Carrier Rate Overrides ──
export const carrierOverrides = mysqlTable("carrier_overrides", {
  id:           int("id").primaryKey().autoincrement(),
  workspaceId:  int("workspaceId").notNull(),
  carrierId:    varchar("carrierId", { length: 50 }).notNull(),
  carrierName:  varchar("carrierName", { length: 200 }).notNull(),
  loadFee:      decimal("loadFee", { precision: 6, scale: 4 }),       // e.g. 0.0600
  coiRate:      decimal("coiRate", { precision: 6, scale: 4 }),       // e.g. 0.0500
  capRate:      decimal("capRate", { precision: 6, scale: 4 }),       // e.g. 0.1200
  floorRate:    decimal("floorRate", { precision: 6, scale: 4 }),     // e.g. 0.0000
  avgReturn:    decimal("avgReturn", { precision: 6, scale: 4 }),     // e.g. 0.1000
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CarrierOverride = typeof carrierOverrides.$inferSelect;
export type InsertCarrierOverride = typeof carrierOverrides.$inferInsert;

// ── Recommendation History (Audit Trail) ──
export const recommendationHistory = mysqlTable("recommendation_history", {
  id:                   int("id").primaryKey().autoincrement(),
  workspaceId:          int("workspaceId").notNull(),
  clientId:             int("clientId"),
  clientName:           varchar("clientName", { length: 200 }),
  clientAge:            int("clientAge"),
  riskTolerance:        varchar("riskTolerance", { length: 20 }),  // conservative, moderate, aggressive
  annualPremium:        decimal("annualPremium", { precision: 15, scale: 2 }),
  recommendedCarrierId: varchar("recommendedCarrierId", { length: 50 }).notNull(),
  recommendedCarrierName: varchar("recommendedCarrierName", { length: 200 }).notNull(),
  totalScore:           decimal("totalScore", { precision: 6, scale: 2 }).notNull(),
  allScoresJson:        json("allScoresJson").notNull(), // full ranked list with score breakdowns
  advisorId:            int("advisorId"),
  advisorName:          varchar("advisorName", { length: 200 }),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
});

export type RecommendationHistoryEntry = typeof recommendationHistory.$inferSelect;
export type InsertRecommendationHistory = typeof recommendationHistory.$inferInsert;

// ── Shared Projections (Client-Facing Portal) ──
export const sharedProjections = mysqlTable("shared_projections", {
  id:             int("id").primaryKey().autoincrement(),
  workspaceId:    int("workspaceId").notNull(),
  clientId:       int("clientId"),
  clientName:     varchar("clientName", { length: 200 }),
  advisorName:    varchar("advisorName", { length: 200 }),
  token:          varchar("token", { length: 64 }).notNull().unique(),
  projectionData: json("projectionData").notNull(),
  inputData:      json("inputData").notNull(),
  expiresAt:      timestamp("expiresAt").notNull(),
  viewCount:      int("viewCount").default(0).notNull(),
  lastViewedAt:   timestamp("lastViewedAt"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
});
export type SharedProjection = typeof sharedProjections.$inferSelect;
export type InsertSharedProjection = typeof sharedProjections.$inferInsert;

// ── Follow-Up Emails (Automated Sequences) ──
export const followUpEmails = mysqlTable("follow_up_emails", {
  id:                   int("id").primaryKey().autoincrement(),
  sharedProjectionId:   int("sharedProjectionId").notNull(),
  workspaceId:          int("workspaceId").notNull(),
  clientId:             int("clientId"),
  clientName:           varchar("clientName", { length: 200 }),
  clientEmail:          varchar("clientEmail", { length: 320 }).notNull(),
  advisorName:          varchar("advisorName", { length: 200 }),
  emailType:            mysqlEnum("emailType", ["3day", "7day"]).notNull(),
  shareToken:           varchar("shareToken", { length: 64 }).notNull(),
  scheduledAt:          timestamp("scheduledAt").notNull(),
  sentAt:               timestamp("sentAt"),
  status:               mysqlEnum("status", ["pending", "sent", "cancelled", "failed"]).default("pending").notNull(),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
});
export type FollowUpEmail = typeof followUpEmails.$inferSelect;
export type InsertFollowUpEmail = typeof followUpEmails.$inferInsert;

// ── Email Campaigns (Upgrade 6) ──
export const emailCampaigns = mysqlTable("email_campaigns", {
  id:               int("id").primaryKey().autoincrement(),
  workspaceId:      int("workspaceId").notNull(),
  name:             varchar("name", { length: 200 }).notNull(),
  description:      text("description"),
  campaignType:     mysqlEnum("campaignType", ["welcome", "nurture", "reengagement", "educational", "custom"]).default("custom").notNull(),
  status:           mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

export const emailTemplates = mysqlTable("email_templates", {
  id:               int("id").primaryKey().autoincrement(),
  workspaceId:      int("workspaceId").notNull(),
  campaignId:       int("campaignId"),
  name:             varchar("name", { length: 200 }).notNull(),
  subject:          varchar("subject", { length: 500 }).notNull(),
  body:             text("body").notNull(),
  delayDays:        int("delayDays").default(0).notNull(),
  sortOrder:        int("sortOrder").default(0).notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export const campaignEnrollments = mysqlTable("campaign_enrollments", {
  id:               int("id").primaryKey().autoincrement(),
  workspaceId:      int("workspaceId").notNull(),
  campaignId:       int("campaignId").notNull(),
  clientId:         int("clientId").notNull(),
  clientEmail:      varchar("clientEmail", { length: 320 }).notNull(),
  clientName:       varchar("clientName", { length: 200 }),
  status:           mysqlEnum("status", ["active", "completed", "unsubscribed"]).default("active").notNull(),
  currentStep:      int("currentStep").default(0).notNull(),
  enrolledAt:       timestamp("enrolledAt").defaultNow().notNull(),
  lastSentAt:       timestamp("lastSentAt"),
  nextSendAt:       timestamp("nextSendAt"),
});
export type CampaignEnrollment = typeof campaignEnrollments.$inferSelect;

// ── Calculation Audit Logs (Upgrade 7) ──
export const calculationAuditLogs = mysqlTable("calculation_audit_logs", {
  id:               int("id").primaryKey().autoincrement(),
  workspaceId:      int("workspaceId").notNull(),
  userId:           int("userId").notNull(),
  userName:         varchar("userName", { length: 200 }),
  clientId:         int("clientId"),
  clientName:       varchar("clientName", { length: 200 }),
  calculationType:  varchar("calculationType", { length: 100 }).notNull(),
  pagePath:         varchar("pagePath", { length: 500 }),
  inputs:           json("inputs").$type<Record<string, unknown>>(),
  outputs:          json("outputs").$type<Record<string, unknown>>(),
  summary:          text("summary"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type CalculationAuditLog = typeof calculationAuditLogs.$inferSelect;

// ── Carrier Quote Requests ──
export const carrierQuoteRequests = mysqlTable("carrier_quote_requests", {
  id:               int("id").primaryKey().autoincrement(),
  workspaceId:      int("workspaceId").notNull(),
  clientId:         int("clientId"),
  clientName:       varchar("clientName", { length: 200 }),
  clientEmail:      varchar("clientEmail", { length: 320 }),
  advisorId:        int("advisorId").notNull(),
  advisorName:      varchar("advisorName", { length: 200 }),
  advisorEmail:     varchar("advisorEmail", { length: 320 }),
  carrierId:        varchar("carrierId", { length: 50 }).notNull(),
  carrierName:      varchar("carrierName", { length: 200 }).notNull(),
  productName:      varchar("productName", { length: 200 }),
  formData:         json("formData").notNull(),
  status:           mysqlEnum("status", ["draft", "submitted", "pending_review", "approved", "rejected"]).default("draft").notNull(),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CarrierQuoteRequest = typeof carrierQuoteRequests.$inferSelect;
export type InsertCarrierQuoteRequest = typeof carrierQuoteRequests.$inferInsert;

// ── Saved Scenarios ──
export const savedScenarios = mysqlTable("saved_scenarios", {
  id:               int("id").primaryKey().autoincrement(),
  workspaceId:      int("workspaceId").notNull(),
  userId:           int("userId").notNull(),
  clientId:         int("clientId"),
  name:             varchar("name", { length: 200 }).notNull(),
  inputs:           json("inputs").notNull(),
  projectionData:   json("projectionData").notNull(),
  tags:             varchar("tags", { length: 500 }),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SavedScenario = typeof savedScenarios.$inferSelect;
export type InsertSavedScenario = typeof savedScenarios.$inferInsert;

// ── Illustration Uploads ──
export const illustrationUploads = mysqlTable("illustration_uploads", {
  id:               int("id").primaryKey().autoincrement(),
  workspaceId:      int("workspaceId").notNull(),
  userId:           int("userId").notNull(),
  clientId:         int("clientId"),
  fileName:         varchar("fileName", { length: 500 }).notNull(),
  fileUrl:          varchar("fileUrl", { length: 2000 }).notNull(),
  fileKey:          varchar("fileKey", { length: 500 }).notNull(),
  carrier:          varchar("carrier", { length: 200 }),
  productName:      varchar("productName", { length: 300 }),
  insuredName:      varchar("insuredName", { length: 200 }),
  insuredAge:       int("insuredAge"),
  insuredGender:    varchar("insuredGender", { length: 20 }),
  insuredState:     varchar("insuredState", { length: 50 }),
  annualPremium:    decimal("annualPremium", { precision: 15, scale: 2 }),
  deathBenefit:     decimal("deathBenefit", { precision: 15, scale: 2 }),
  illustratedRate:  decimal("illustratedRate", { precision: 6, scale: 4 }),
  extractedData:    json("extractedData").$type<Record<string, unknown>>(),
  yearByYear:       json("yearByYear").$type<Array<Record<string, unknown>>>(),
  status:           mysqlEnum("status", ["uploading", "extracting", "ready", "error"]).default("uploading").notNull(),
  errorMessage:     text("errorMessage"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IllustrationUpload = typeof illustrationUploads.$inferSelect;
export type InsertIllustrationUpload = typeof illustrationUploads.$inferInsert;

// ── Referrals ──
export const referrals = mysqlTable("referrals", {
  id:             int("id").primaryKey().autoincrement(),
  workspaceId:    int("workspaceId").notNull(),
  referrerName:   varchar("referrerName", { length: 200 }).notNull(),
  referredName:   varchar("referredName", { length: 200 }).notNull(),
  referredEmail:  varchar("referredEmail", { length: 320 }),
  referredPhone:  varchar("referredPhone", { length: 30 }),
  source:         mysqlEnum("source", ["Client", "Professional", "Event", "Online", "Other"]).default("Client").notNull(),
  status:         mysqlEnum("status", ["pending", "contacted", "meeting_scheduled", "converted", "lost"]).default("pending").notNull(),
  estimatedValue: decimal("estimatedValue", { precision: 15, scale: 2 }),
  notes:          text("notes"),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ── Referral Links (Upgrade 9) ──
export const referralLinks = mysqlTable("referral_links", {
  id:             int("id").primaryKey().autoincrement(),
  workspaceId:    int("workspaceId").notNull(),
  createdBy:      int("createdBy").notNull(),
  code:           varchar("code", { length: 50 }).notNull(),
  partnerName:    varchar("partnerName", { length: 200 }).notNull(),
  partnerEmail:   varchar("partnerEmail", { length: 320 }),
  partnerType:    mysqlEnum("partnerType", ["client", "cpa", "attorney", "financial_advisor", "other"]).default("client").notNull(),
  commissionPct:  decimal("commissionPct", { precision: 5, scale: 2 }),
  clicks:         int("clicks").default(0).notNull(),
  signups:        int("signups").default(0).notNull(),
  conversions:    int("conversions").default(0).notNull(),
  totalRevenue:   decimal("totalRevenue", { precision: 15, scale: 2 }).default("0"),
  isActive:       boolean("isActive").default(true).notNull(),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ReferralLink = typeof referralLinks.$inferSelect;

// ── Compliance Signatures (re-sign every login) ──
export const complianceSignatures = mysqlTable("compliance_signatures", {
  id:           int("id").primaryKey().autoincrement(),
  userId:       int("userId").notNull(),
  userName:     varchar("userName", { length: 200 }).notNull(),
  userEmail:    varchar("userEmail", { length: 320 }),
  signedName:   varchar("signedName", { length: 200 }).notNull(),
  signedDate:   varchar("signedDate", { length: 20 }).notNull(),
  ipAddress:    varchar("ipAddress", { length: 45 }),
  userAgent:    text("userAgent"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type ComplianceSignature = typeof complianceSignatures.$inferSelect;
export type InsertComplianceSignature = typeof complianceSignatures.$inferInsert;

// ── User Sessions (track login/logout and duration) ──
export const userSessions = mysqlTable("user_sessions", {
  id:           int("id").primaryKey().autoincrement(),
  userId:       int("userId").notNull(),
  userName:     varchar("userName", { length: 200 }).notNull(),
  userEmail:    varchar("userEmail", { length: 320 }),
  loginAt:      timestamp("loginAt").defaultNow().notNull(),
  logoutAt:     timestamp("logoutAt"),
  durationSecs: int("durationSecs"),
  ipAddress:    varchar("ipAddress", { length: 45 }),
  userAgent:    text("userAgent"),
  isActive:     boolean("isActive").default(true).notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// ── Page Activity Logs (track which tabs/pages visited and for how long) ──
export const pageActivityLogs = mysqlTable("page_activity_logs", {
  id:           int("id").primaryKey().autoincrement(),
  sessionId:    int("sessionId").notNull(),
  userId:       int("userId").notNull(),
  userName:     varchar("userName", { length: 200 }).notNull(),
  pagePath:     varchar("pagePath", { length: 500 }).notNull(),
  pageTitle:    varchar("pageTitle", { length: 200 }).notNull(),
  enteredAt:    timestamp("enteredAt").defaultNow().notNull(),
  exitedAt:     timestamp("exitedAt"),
  durationSecs: int("durationSecs"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type PageActivityLog = typeof pageActivityLogs.$inferSelect;
export type InsertPageActivityLog = typeof pageActivityLogs.$inferInsert;

// ─── Household Fact Finder (persistent financial data per client) ──────────
export const householdFactFinders = mysqlTable("household_fact_finders", {
  id:               int("id").primaryKey().autoincrement(),
  clientId:         int("clientId").notNull(),
  workspaceId:      int("workspaceId").notNull(),
  // Primary user financial data
  primaryAge:       int("primaryAge"),
  primaryIncome:    decimal("primaryIncome", { precision: 15, scale: 2 }),
  primaryIra:       decimal("primaryIra", { precision: 15, scale: 2 }),
  primaryRothIra:   decimal("primaryRothIra", { precision: 15, scale: 2 }),
  primaryCash:      decimal("primaryCash", { precision: 15, scale: 2 }),
  primaryHomeValue: decimal("primaryHomeValue", { precision: 15, scale: 2 }),
  primaryHomeEquity:decimal("primaryHomeEquity", { precision: 15, scale: 2 }),
  primaryMortgageBalance: decimal("primaryMortgageBalance", { precision: 15, scale: 2 }),
  primaryMortgageRate: decimal("primaryMortgageRate", { precision: 5, scale: 4 }),
  primaryMortgageYearsLeft: int("primaryMortgageYearsLeft"),
  primaryTotalInterest: decimal("primaryTotalInterest", { precision: 15, scale: 2 }),
  primaryAnnualPremium: decimal("primaryAnnualPremium", { precision: 15, scale: 2 }),
  primaryDeathBenefit: decimal("primaryDeathBenefit", { precision: 15, scale: 2 }),
  // Spouse data
  spouseName:       varchar("spouseName", { length: 200 }),
  spouseAge:        int("spouseAge"),
  spouseIncome:     decimal("spouseIncome", { precision: 15, scale: 2 }),
  spouseIra:        decimal("spouseIra", { precision: 15, scale: 2 }),
  spouseRothIra:    decimal("spouseRothIra", { precision: 15, scale: 2 }),
  spouseCash:       decimal("spouseCash", { precision: 15, scale: 2 }),
  // HELOC
  helocRate:        decimal("helocRate", { precision: 5, scale: 4 }),
  helocMaxLtv:      decimal("helocMaxLtv", { precision: 5, scale: 4 }),
  // Rental
  rentBasement:     boolean("rentBasement").default(false),
  // JSON blob for children and grandchildren
  children:         json("children").$type<HouseholdChild[]>(),
  grandchildren:    json("grandchildren").$type<HouseholdGrandchild[]>(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type HouseholdFactFinder = typeof householdFactFinders.$inferSelect;
export type InsertHouseholdFactFinder = typeof householdFactFinders.$inferInsert;

// JSON types for children and grandchildren
export interface HouseholdChild {
  id: string;
  name: string;
  age: number;
  income: number;
  ira: number;
  rothIra: number;
  cash: number;
  homeValue: number;
  homeEquity: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsLeft: number;
  totalInterest: number;
}

export interface HouseholdGrandchild {
  id: string;
  name: string;
  age: number;
  parentId: string;
  homeValue: number;
  homeEquity: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsLeft: number;
  totalInterest: number;
}


// ─── Hidden Material Access ──────────────────────────────────────────────────
export const hiddenMaterialConfig = mysqlTable("hidden_material_config", {
  id:            int("id").autoincrement().primaryKey(),
  passwordHash:  varchar("passwordHash", { length: 255 }).notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const hiddenMaterialResetCodes = mysqlTable("hidden_material_reset_codes", {
  id:            int("id").autoincrement().primaryKey(),
  code:          varchar("code", { length: 6 }).notNull(),
  expiresAt:     timestamp("expiresAt").notNull(),
  used:          boolean("used").default(false).notNull(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});


// ─── Client Risk Assessment ──────────────────────────────────────────────────
export const clientRiskAssessments = mysqlTable("client_risk_assessments", {
  id:               int("id").primaryKey().autoincrement(),
  clientId:         int("clientId").notNull(),
  workspaceId:      int("workspaceId").notNull(),
  // Risk tolerance questionnaire answers (1-10 scale)
  marketDropReaction:   int("marketDropReaction"),       // 1=panic sell, 10=buy more
  timeHorizon:          int("timeHorizon"),               // 1=<5yrs, 10=30+yrs
  incomeStability:      int("incomeStability"),            // 1=unstable, 10=very stable
  investmentExperience: int("investmentExperience"),       // 1=none, 10=expert
  riskCapacity:         int("riskCapacity"),               // 1=can't afford loss, 10=high capacity
  volatilityComfort:    int("volatilityComfort"),           // 1=hate volatility, 10=embrace it
  guaranteePreference:  int("guaranteePreference"),        // 1=need guarantees, 10=no need
  growthVsIncome:       int("growthVsIncome"),             // 1=income only, 10=growth only
  // Computed scores
  riskScore:            int("riskScore"),                   // 1-100 composite score
  riskCategory:         mysqlEnum("riskCategory", ["conservative", "moderate_conservative", "moderate", "moderate_aggressive", "aggressive"]),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
  updatedAt:            timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientRiskAssessment = typeof clientRiskAssessments.$inferSelect;
export type InsertClientRiskAssessment = typeof clientRiskAssessments.$inferInsert;

// ─── Client Life Goals (5-year intervals to age 100) ─────────────────────────
export const clientLifeGoals = mysqlTable("client_life_goals", {
  id:               int("id").primaryKey().autoincrement(),
  clientId:         int("clientId").notNull(),
  workspaceId:      int("workspaceId").notNull(),
  targetAge:        int("targetAge").notNull(),           // 30, 35, 40, ... 100
  goalCategory:     mysqlEnum("goalCategory", [
    "retirement", "travel", "education", "home_purchase", "debt_free",
    "business", "charity", "health", "family", "luxury", "legacy", "other"
  ]).default("other").notNull(),
  goalTitle:        varchar("goalTitle", { length: 300 }).notNull(),
  goalDescription:  text("goalDescription"),
  estimatedCost:    decimal("estimatedCost", { precision: 15, scale: 2 }),
  priority:         mysqlEnum("priority", ["must_have", "nice_to_have", "dream"]).default("nice_to_have").notNull(),
  achievabilityScore: int("achievabilityScore"),          // 1-100 AI-calculated
  isAchieved:       boolean("isAchieved").default(false).notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientLifeGoal = typeof clientLifeGoals.$inferSelect;
export type InsertClientLifeGoal = typeof clientLifeGoals.$inferInsert;

// ─── Client Gamification Scores ──────────────────────────────────────────────
export const clientScores = mysqlTable("client_scores", {
  id:               int("id").primaryKey().autoincrement(),
  clientId:         int("clientId").notNull(),
  workspaceId:      int("workspaceId").notNull(),
  overallScore:     int("overallScore").default(50).notNull(),   // 1-100
  financialHealthScore: int("financialHealthScore"),
  goalAlignmentScore:   int("goalAlignmentScore"),
  behaviorScore:        int("behaviorScore"),
  diversificationScore: int("diversificationScore"),
  level:            int("level").default(1).notNull(),            // 1-10 level
  levelName:        varchar("levelName", { length: 100 }).default("Starter").notNull(),
  totalPointsEarned: int("totalPointsEarned").default(0).notNull(),
  streakDays:       int("streakDays").default(0).notNull(),
  lastActivityAt:   timestamp("lastActivityAt"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientScore = typeof clientScores.$inferSelect;
export type InsertClientScore = typeof clientScores.$inferInsert;

// ─── Client Badges ───────────────────────────────────────────────────────────
export const clientBadges = mysqlTable("client_badges", {
  id:               int("id").primaryKey().autoincrement(),
  clientId:         int("clientId").notNull(),
  workspaceId:      int("workspaceId").notNull(),
  badgeType:        varchar("badgeType", { length: 100 }).notNull(),
  badgeName:        varchar("badgeName", { length: 200 }).notNull(),
  badgeEmoji:       varchar("badgeEmoji", { length: 20 }).notNull(),
  badgeDescription: text("badgeDescription"),
  earnedAt:         timestamp("earnedAt").defaultNow().notNull(),
  level:            int("level").default(1).notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type ClientBadge = typeof clientBadges.$inferSelect;
export type InsertClientBadge = typeof clientBadges.$inferInsert;

// ─── Client Recommendations ──────────────────────────────────────────────────
export const clientRecommendations = mysqlTable("client_recommendations", {
  id:               int("id").primaryKey().autoincrement(),
  clientId:         int("clientId").notNull(),
  workspaceId:      int("workspaceId").notNull(),
  category:         mysqlEnum("category", [
    "asset_allocation", "spending", "savings", "insurance", "tax_strategy",
    "debt_management", "retirement_timing", "estate_planning", "behavior", "education"
  ]).notNull(),
  title:            varchar("title", { length: 300 }).notNull(),
  description:      text("description").notNull(),
  scoreImpact:      int("scoreImpact").notNull(),          // minimum +5
  difficulty:       mysqlEnum("difficulty", ["easy", "moderate", "challenging"]).default("moderate").notNull(),
  estimatedTimeframe: varchar("estimatedTimeframe", { length: 100 }),
  isAccepted:       boolean("isAccepted").default(false).notNull(),
  isCompleted:      boolean("isCompleted").default(false).notNull(),
  completedAt:      timestamp("completedAt"),
  suggestedTab:     varchar("suggestedTab", { length: 200 }),  // which tab to visit
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientRecommendation = typeof clientRecommendations.$inferSelect;
export type InsertClientRecommendation = typeof clientRecommendations.$inferInsert;

// ─── Client Session Ratings (AI-rated) ───────────────────────────────────────
export const clientSessionRatings = mysqlTable("client_session_ratings", {
  id:               int("id").primaryKey().autoincrement(),
  clientId:         int("clientId").notNull(),
  workspaceId:      int("workspaceId").notNull(),
  sessionId:        int("sessionId"),                      // links to userSessions
  rating:           decimal("rating", { precision: 3, scale: 1 }).notNull(),  // 1.0-10.0
  explanation:      text("explanation"),
  behaviors:        json("behaviors").$type<string[]>(),
  actions:          json("actions").$type<string[]>(),
  learningApproaches: json("learningApproaches").$type<string[]>(),
  scoreEnhancementSteps: json("scoreEnhancementSteps").$type<{step: string; impact: number}[]>(),
  emailSent:        boolean("emailSent").default(false).notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type ClientSessionRating = typeof clientSessionRatings.$inferSelect;
export type InsertClientSessionRating = typeof clientSessionRatings.$inferInsert;

// ─── Encouragement Emails Log ────────────────────────────────────────────────
export const encouragementEmails = mysqlTable("encouragement_emails", {
  id:               int("id").primaryKey().autoincrement(),
  clientId:         int("clientId").notNull(),
  workspaceId:      int("workspaceId").notNull(),
  emailType:        mysqlEnum("emailType", ["weekly_check_in", "goal_reminder", "level_up", "badge_earned", "score_boost", "habit_tip"]).notNull(),
  subject:          varchar("subject", { length: 500 }).notNull(),
  body:             text("body"),
  sentAt:           timestamp("sentAt"),
  status:           mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type EncouragementEmail = typeof encouragementEmails.$inferSelect;
export type InsertEncouragementEmail = typeof encouragementEmails.$inferInsert;

// ─── Tutorial Progress ───────────────────────────────────────────────────────
export const tutorialProgress = mysqlTable("tutorial_progress", {
  id:                    int("id").primaryKey().autoincrement(),
  userId:                int("userId").notNull(),
  role:                  varchar("role", { length: 50 }),
  questionnaireAnswers:  json("questionnaireAnswers"),
  questionnaireCompleted: boolean("questionnaireCompleted").default(false).notNull(),
  completedSections:     json("completedSections").$type<string[]>(),
  completedSubSections:  json("completedSubSections").$type<string[]>(),
  currentStep:           int("currentStep").default(0).notNull(),
  score:                 int("score").default(0).notNull(),
  badges:                json("badges"),
  totalPointsEarned:     int("totalPointsEarned").default(0).notNull(),
  createdAt:             timestamp("createdAt").defaultNow().notNull(),
  updatedAt:             timestamp("updatedAt").defaultNow().notNull(),
});
export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type InsertTutorialProgress = typeof tutorialProgress.$inferInsert;

// ─── Agency Teams ────────────────────────────────────────────────────────────
export const agencyTeams = mysqlTable("agency_teams", {
  id:              int("id").primaryKey().autoincrement(),
  name:            varchar("name", { length: 300 }).notNull(),
  supervisorId:    int("supervisorId").notNull(),
  supervisorName:  varchar("supervisorName", { length: 200 }).notNull(),
  supervisorEmail: varchar("supervisorEmail", { length: 320 }),
  workspaceId:     int("workspaceId").notNull(),
  description:     text("description"),
  isActive:        boolean("isActive").default(true).notNull(),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AgencyTeam = typeof agencyTeams.$inferSelect;
export type InsertAgencyTeam = typeof agencyTeams.$inferInsert;

// ─── Agency Team Members (downline agents) ───────────────────────────────────
export const agencyTeamMembers = mysqlTable("agency_team_members", {
  id:              int("id").primaryKey().autoincrement(),
  teamId:          int("teamId").notNull(),
  userId:          int("userId").notNull(),
  userName:        varchar("userName", { length: 200 }).notNull(),
  userEmail:       varchar("userEmail", { length: 320 }),
  role:            mysqlEnum("role", ["supervisor", "agent"]).default("agent").notNull(),
  status:          mysqlEnum("status", ["active", "pending", "suspended", "removed"]).default("pending").notNull(),
  agreementSigned: boolean("agreementSigned").default(false).notNull(),
  agreementSignedAt: timestamp("agreementSignedAt"),
  joinedAt:        timestamp("joinedAt"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AgencyTeamMember = typeof agencyTeamMembers.$inferSelect;
export type InsertAgencyTeamMember = typeof agencyTeamMembers.$inferInsert;

// ─── Supervisor Monitoring Agreements (legal e-signatures) ───────────────────
export const supervisorMonitoringAgreements = mysqlTable("supervisor_monitoring_agreements", {
  id:                int("id").primaryKey().autoincrement(),
  userId:            int("userId").notNull(),
  userName:          varchar("userName", { length: 200 }).notNull(),
  userEmail:         varchar("userEmail", { length: 320 }),
  teamId:            int("teamId").notNull(),
  teamName:          varchar("teamName", { length: 300 }).notNull(),
  supervisorId:      int("supervisorId").notNull(),
  supervisorName:    varchar("supervisorName", { length: 200 }).notNull(),
  signatureName:     varchar("signatureName", { length: 200 }).notNull(),
  signatureDate:     varchar("signatureDate", { length: 50 }).notNull(),
  agreementVersion:  varchar("agreementVersion", { length: 20 }).default("1.0").notNull(),
  agreementText:     text("agreementText").notNull(),
  ipAddress:         varchar("ipAddress", { length: 45 }),
  userAgent:         text("userAgent"),
  signedAt:          timestamp("signedAt").defaultNow().notNull(),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});
export type SupervisorMonitoringAgreement = typeof supervisorMonitoringAgreements.$inferSelect;
export type InsertSupervisorMonitoringAgreement = typeof supervisorMonitoringAgreements.$inferInsert;

// ─── Legal Documents (master record for all signed agreements) ───────────────
export const legalDocuments = mysqlTable("legal_documents", {
  id:                int("id").primaryKey().autoincrement(),
  documentType:      mysqlEnum("documentType", [
    "supervisor_monitoring_agreement",
    "compliance_disclaimer",
    "terms_of_service",
    "privacy_policy",
    "nda",
    "other"
  ]).notNull(),
  title:             varchar("title", { length: 500 }).notNull(),
  signerUserId:      int("signerUserId").notNull(),
  signerName:        varchar("signerName", { length: 200 }).notNull(),
  signerEmail:       varchar("signerEmail", { length: 320 }),
  relatedTeamId:     int("relatedTeamId"),
  relatedTeamName:   varchar("relatedTeamName", { length: 300 }),
  supervisorId:      int("supervisorId"),
  supervisorName:    varchar("supervisorName", { length: 200 }),
  signatureName:     varchar("signatureName", { length: 200 }).notNull(),
  signatureDate:     varchar("signatureDate", { length: 50 }).notNull(),
  documentContent:   text("documentContent").notNull(),
  ipAddress:         varchar("ipAddress", { length: 45 }),
  userAgent:         text("userAgent"),
  signedAt:          timestamp("signedAt").defaultNow().notNull(),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});
export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = typeof legalDocuments.$inferInsert;

// ─── Leaderboard Profiles & Consent ──────────────────────────────────────────
export const leaderboardProfiles = mysqlTable("leaderboard_profiles", {
  id:                        int("id").autoincrement().primaryKey(),
  userId:                    int("userId").notNull(),
  workspaceId:               int("workspaceId").notNull(),
  handle:                    varchar("handle", { length: 50 }).notNull(),
  useRealName:               boolean("useRealName").default(false).notNull(),
  currentlyOptedIn:          boolean("currentlyOptedIn").default(false).notNull(),
  baselineAnnualCommissions: decimal("baselineAnnualCommissions", { precision: 15, scale: 2 }),
  platformJoinDate:          timestamp("platformJoinDate").defaultNow().notNull(),
  createdAt:                 timestamp("createdAt").defaultNow().notNull(),
  updatedAt:                 timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeaderboardProfile = typeof leaderboardProfiles.$inferSelect;
export type InsertLeaderboardProfile = typeof leaderboardProfiles.$inferInsert;

export const leaderboardConsents = mysqlTable("leaderboard_consents", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  month:       int("month").notNull(),
  year:        int("year").notNull(),
  optedIn:     boolean("optedIn").default(false).notNull(),
  respondedAt: timestamp("respondedAt").defaultNow().notNull(),
});
export type LeaderboardConsent = typeof leaderboardConsents.$inferSelect;
export type InsertLeaderboardConsent = typeof leaderboardConsents.$inferInsert;

// ─── Public Leads (homepage fact-finder / AI concierge prospects) ───────────
// Anonymous or self-identified prospects captured from the PUBLIC homepage —
// distinct from the advisor-side household_fact_finders (which are workspace-
// scoped and auth-gated). Sensitive financial inputs and the illustrative
// analysis live in JSON blobs; identity/consent/recognition are scalar columns.
export const publicLeads = mysqlTable("public_leads", {
  id:               int("id").autoincrement().primaryKey(),
  publicId:         varchar("publicId", { length: 40 }).notNull().unique(), // first-party cookie id
  firstName:        varchar("firstName", { length: 120 }),
  lastName:         varchar("lastName", { length: 120 }),
  email:            varchar("email", { length: 320 }),
  phone:            varchar("phone", { length: 40 }),
  bestTimeToContact: varchar("bestTimeToContact", { length: 200 }),
  consentedAt:      timestamp("consentedAt"),
  consentVersion:   varchar("consentVersion", { length: 40 }),
  lastIp:           varchar("lastIp", { length: 64 }),
  ipHistory:        json("ipHistory").$type<string[]>(),
  question:         text("question"),
  factFinder:       json("factFinder").$type<import("../shared/leadTypes").LeadFactFinder>(),
  analysis:         json("analysis").$type<import("../shared/leadTypes").LeadAnalysis>(),
  status:           mysqlEnum("status", ["new", "contacted", "qualified", "client"]).default("new").notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSeenAt:       timestamp("lastSeenAt").defaultNow().notNull(),
});
export type PublicLead = typeof publicLeads.$inferSelect;
export type InsertPublicLead = typeof publicLeads.$inferInsert;

// ─── Payment Disclosure Records (Legal Payment Folder) ──────────────────────
export const paymentDisclosures = mysqlTable("payment_disclosures", {
  id:                   int("id").autoincrement().primaryKey(),
  userId:               int("userId").notNull(),
  workspaceId:          int("workspaceId"),
  planSlug:             varchar("planSlug", { length: 50 }).notNull(),
  billingInterval:      mysqlEnum("billingInterval", ["MONTHLY", "ANNUAL"]).notNull(),
  priceAtAcceptance:    decimal("priceAtAcceptance", { precision: 10, scale: 2 }).notNull(),
  // Payor identity
  payorFirstName:       varchar("payorFirstName", { length: 100 }).notNull(),
  payorLastName:        varchar("payorLastName", { length: 100 }).notNull(),
  payorBusinessEntity:  varchar("payorBusinessEntity", { length: 200 }),
  payorAddress:         varchar("payorAddress", { length: 300 }).notNull(),
  payorCity:            varchar("payorCity", { length: 100 }).notNull(),
  payorState:           varchar("payorState", { length: 50 }).notNull(),
  payorZip:             varchar("payorZip", { length: 20 }).notNull(),
  payorPhone:           varchar("payorPhone", { length: 30 }).notNull(),
  payorEmail:           varchar("payorEmail", { length: 320 }),
  // Verification & signature
  ipAddress:            varchar("ipAddress", { length: 45 }).notNull(),
  userAgent:            varchar("userAgent", { length: 500 }),
  pinVerifiedAt:        timestamp("pinVerifiedAt"),
  signatureText:        varchar("signatureText", { length: 300 }).notNull(),
  signatureHash:        varchar("signatureHash", { length: 128 }).notNull(),
  disclosureVersion:    varchar("disclosureVersion", { length: 20 }).notNull().default("1.0"),
  governingLaw:         varchar("governingLaw", { length: 50 }).notNull().default("Delaware"),
  agreedAt:             timestamp("agreedAt").notNull(),
  createdAt:            timestamp("createdAt").defaultNow().notNull(),
});
export type PaymentDisclosure = typeof paymentDisclosures.$inferSelect;
export type InsertPaymentDisclosure = typeof paymentDisclosures.$inferInsert;

// ─── SMS Verification Codes ─────────────────────────────────────────────────
export const smsVerificationCodes = mysqlTable("sms_verification_codes", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  phone:       varchar("phone", { length: 30 }).notNull(),
  code:        varchar("code", { length: 10 }).notNull(),
  purpose:     varchar("purpose", { length: 50 }).notNull().default("payment_disclosure"),
  verified:    boolean("verified").default(false).notNull(),
  attempts:    int("attempts").default(0).notNull(),
  expiresAt:   timestamp("expiresAt").notNull(),
  verifiedAt:  timestamp("verifiedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type SmsVerificationCode = typeof smsVerificationCodes.$inferSelect;
export type InsertSmsVerificationCode = typeof smsVerificationCodes.$inferInsert;


// ─── Advisor Accounts (cumulative per-email tracking) ───────────────────────
export const advisorAccounts = mysqlTable("advisor_accounts", {
  id:                  int("id").autoincrement().primaryKey(),
  email:               varchar("email", { length: 320 }).notNull().unique(),
  accessTier:          mysqlEnum("accessTier", ["trial", "unlimited", "subscriber"]).default("trial").notNull(),
  trialSecondsUsed:    int("trialSecondsUsed").default(0).notNull(),
  lastHeartbeatAt:     timestamp("lastHeartbeatAt"),
  stripeCustomerId:    varchar("stripeCustomerId", { length: 100 }),
  subscriptionStatus:  mysqlEnum("subscriptionStatus", ["none", "active", "past_due", "canceled"]).default("none").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  trialAccessCount:    int("trialAccessCount").default(0).notNull(),
  passwordType:        mysqlEnum("passwordType", ["none", "trial", "eternal"]).default("none").notNull(),
  planSlug:            varchar("planSlug", { length: 50 }),
  emailVerified:       boolean("emailVerified").default(false).notNull(),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdvisorAccount = typeof advisorAccounts.$inferSelect;
export type InsertAdvisorAccount = typeof advisorAccounts.$inferInsert;

// ─── Email Verification Codes ─────────────────────────────────────────────
export const emailVerificationCodes = mysqlTable("email_verification_codes", {
  id:         int("id").autoincrement().primaryKey(),
  email:      varchar("email", { length: 320 }).notNull(),
  code:       varchar("code", { length: 6 }).notNull(),
  purpose:    varchar("purpose", { length: 50 }).default("pre_checkout").notNull(),
  verified:   boolean("verified").default(false).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  attempts:   int("attempts").default(0).notNull(),
  expiresAt:  timestamp("expiresAt").notNull(),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;

// ─── Trial Logins ───────────────────────────────────────────────────────────
export const trialLogins = mysqlTable("trial_logins", {
  id:          int("id").autoincrement().primaryKey(),
  email:       varchar("email", { length: 320 }).notNull(),
  ipAddress:   varchar("ipAddress", { length: 100 }).notNull(),
  userAgent:   text("userAgent"),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  accessTier:  mysqlEnum("accessTier", ["trial", "unlimited", "subscriber"]).default("trial").notNull(),
  expiresAt:   timestamp("expiresAt").notNull(),
  loggedOutAt: timestamp("loggedOutAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type TrialLogin = typeof trialLogins.$inferSelect;
export type InsertTrialLogin = typeof trialLogins.$inferInsert;

// ─── Risk Snapshots (Living Risk Profile) ────────────────────────────────────
export const riskSnapshots = mysqlTable("risk_snapshots", {
  id:                int("id").autoincrement().primaryKey(),
  clientId:          int("clientId").notNull(),
  workspaceId:       int("workspaceId").notNull(),
  advisorId:         int("advisorId"),
  overallScore:      int("overallScore").notNull(),
  depthLevel:        int("depthLevel").notNull(),
  questionsAnswered: int("questionsAnswered").notNull(),
  categories:        json("categories").$type<Array<{ key: string; label: string; score: number }>>(),
  marketContext:     json("marketContext").$type<{ sp500YTD: number; vixLevel: number; fedRate: number } | null>(),
  riskCategory:      varchar("riskCategory", { length: 50 }),
  trigger:           varchar("trigger", { length: 50 }).default("initial").notNull(),
  driftScore:        int("driftScore"),
  flaggedForReassessment: boolean("flaggedForReassessment").default(false).notNull(),
  notes:             text("notes"),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});
export type RiskSnapshotRow = typeof riskSnapshots.$inferSelect;
export type InsertRiskSnapshot = typeof riskSnapshots.$inferInsert;

// ─── Batch Schedules (Persistent BulkGeneration Schedules) ───────────────────
export const batchSchedules = mysqlTable("batch_schedules", {
  id:            int("id").autoincrement().primaryKey(),
  workspaceId:   int("workspaceId").notNull(),
  name:          varchar("name", { length: 255 }).notNull(),
  description:   text("description"),
  templateType:  varchar("templateType", { length: 100 }).notNull(),
  frequency:     varchar("frequency", { length: 50 }).default("weekly").notNull(),
  paused:        boolean("paused").default(false).notNull(),
  lastRunAt:     timestamp("lastRunAt"),
  nextRunAt:     timestamp("nextRunAt"),
  runCount:      int("runCount").default(0).notNull(),
  config:        json("config").$type<Record<string, any>>(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BatchScheduleRow = typeof batchSchedules.$inferSelect;
export type InsertBatchSchedule = typeof batchSchedules.$inferInsert;

// ─── Saved Slide Decks (AI-Generated Presentation Library) ───────────────────
export const savedSlideDecks = mysqlTable("saved_slide_decks", {
  id:            int("id").autoincrement().primaryKey(),
  workspaceId:   int("workspaceId").notNull(),
  userId:        int("userId").notNull(),
  title:         varchar("title", { length: 500 }).notNull(),
  toolName:      varchar("toolName", { length: 200 }).notNull(),
  clientName:    varchar("clientName", { length: 200 }),
  audience:      mysqlEnum("audience", ["client", "advisor", "team"]).default("client").notNull(),
  slideCount:    int("slideCount").notNull(),
  slides:        json("slides").$type<Array<{ title: string; subtitle: string; bullets: string[]; speakerNotes: string; layout: string }>>().notNull(),
  pptxUrl:       varchar("pptxUrl", { length: 2000 }),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SavedSlideDeckRow = typeof savedSlideDecks.$inferSelect;
export type InsertSlideDeck = typeof savedSlideDecks.$inferInsert;

// ─── Owner Trusted IPs (dynamic IP trust for auto-login) ────────────────────
export const ownerTrustedIps = mysqlTable("owner_trusted_ips", {
  id:           int("id").autoincrement().primaryKey(),
  ipAddress:    varchar("ipAddress", { length: 45 }).notNull().unique(),
  label:        varchar("label", { length: 200 }),
  loginCount:   int("loginCount").default(1).notNull(),
  lastUsedAt:   timestamp("lastUsedAt").defaultNow().notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type OwnerTrustedIp = typeof ownerTrustedIps.$inferSelect;

// ─── Slide Comments (collaboration on saved decks) ──────────────────────────
export const slideComments = mysqlTable("slide_comments", {
  id:           int("id").autoincrement().primaryKey(),
  deckId:       int("deckId").notNull(),
  slideIndex:   int("slideIndex"),
  userId:       int("userId").notNull(),
  userName:     varchar("userName", { length: 200 }).notNull(),
  userEmail:    varchar("userEmail", { length: 320 }),
  content:      text("content").notNull(),
  resolved:     boolean("resolved").default(false).notNull(),
  parentId:     int("parentId"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SlideComment = typeof slideComments.$inferSelect;
export type InsertSlideComment = typeof slideComments.$inferInsert;

// ─── Slide Shares (sharing decks with team members) ─────────────────────────
export const slideShares = mysqlTable("slide_shares", {
  id:           int("id").autoincrement().primaryKey(),
  deckId:       int("deckId").notNull(),
  sharedByUserId: int("sharedByUserId").notNull(),
  sharedWithEmail: varchar("sharedWithEmail", { length: 320 }).notNull(),
  sharedWithUserId: int("sharedWithUserId"),
  permission:   mysqlEnum("permission", ["view", "comment", "edit"]).default("comment").notNull(),
  shareToken:   varchar("shareToken", { length: 255 }).notNull().unique(),
  accessedAt:   timestamp("accessedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type SlideShare = typeof slideShares.$inferSelect;
export type InsertSlideShare = typeof slideShares.$inferInsert;

// ─── Sidebar Favorites (pinned navigation items per user) ───────────────────
export const sidebarFavorites = mysqlTable("sidebar_favorites", {
  id:         int("id").autoincrement().primaryKey(),
  userId:     int("userId").notNull(),
  path:       varchar("path", { length: 500 }).notNull(),
  label:      varchar("label", { length: 200 }).notNull(),
  sortOrder:  int("sortOrder").default(0).notNull(),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type SidebarFavorite = typeof sidebarFavorites.$inferSelect;
export type InsertSidebarFavorite = typeof sidebarFavorites.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIENCE ENGINE — Gamification, XP, Streaks, Quests, RussellCoin, Families
// ═══════════════════════════════════════════════════════════════════════════════

// ─── User XP Profiles ───────────────────────────────────────────────────────
export const userXpProfiles = mysqlTable("user_xp_profiles", {
  id:              int("id").autoincrement().primaryKey(),
  userId:          int("userId").notNull(),
  totalXp:         int("totalXp").default(0).notNull(),
  level:           int("level").default(1).notNull(),
  levelName:       varchar("levelName", { length: 100 }).default("Rookie").notNull(),
  russellCoin:     int("russellCoin").default(0).notNull(),
  lifetimeRussellCoin: int("lifetimeRussellCoin").default(0).notNull(),
  currentStreak:   int("currentStreak").default(0).notNull(),
  longestStreak:   int("longestStreak").default(0).notNull(),
  lastCheckInDate: varchar("lastCheckInDate", { length: 10 }),  // YYYY-MM-DD
  totalCheckIns:   int("totalCheckIns").default(0).notNull(),
  avatarUrl:       varchar("avatarUrl", { length: 2000 }),
  avatarOriginalUrl: varchar("avatarOriginalUrl", { length: 2000 }),
  spouseAvatarUrl: varchar("spouseAvatarUrl", { length: 2000 }),
  spouseAvatarOriginalUrl: varchar("spouseAvatarOriginalUrl", { length: 2000 }),
  avatarTitle:     varchar("avatarTitle", { length: 200 }).default("Newcomer"),
  avatarBorder:    varchar("avatarBorder", { length: 50 }).default("default"),
  petType:         varchar("petType", { length: 50 }).default("eagle"),
  petLevel:        int("petLevel").default(1).notNull(),
  addictionScore:  int("addictionScore").default(0).notNull(),   // 0-100
  reputationScore: int("reputationScore").default(100).notNull(), // 0-1000
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserXpProfile = typeof userXpProfiles.$inferSelect;
export type InsertUserXpProfile = typeof userXpProfiles.$inferInsert;

// ─── XP Transaction Log ─────────────────────────────────────────────────────
export const xpTransactions = mysqlTable("xp_transactions", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  amount:      int("amount").notNull(),
  source:      varchar("source", { length: 100 }).notNull(),  // "quest_complete", "daily_checkin", "calculator_use", "login", etc.
  sourceId:    varchar("sourceId", { length: 100 }),           // optional reference
  description: varchar("description", { length: 500 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type InsertXpTransaction = typeof xpTransactions.$inferInsert;

// ─── RussellCoin Transaction Log ────────────────────────────────────────────
export const russellCoinTransactions = mysqlTable("russellcoin_transactions", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  amount:      int("amount").notNull(),          // positive = earn, negative = spend
  balance:     int("balance").notNull(),          // running balance after this tx
  txType:      mysqlEnum("txType", ["earn", "spend", "bonus", "refund"]).notNull(),
  source:      varchar("source", { length: 100 }).notNull(),  // "quest", "daily_reward", "loot_purchase", "prediction_win"
  sourceId:    varchar("sourceId", { length: 100 }),
  description: varchar("description", { length: 500 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type RussellCoinTransaction = typeof russellCoinTransactions.$inferSelect;
export type InsertRussellCoinTransaction = typeof russellCoinTransactions.$inferInsert;

// ─── User Quests ────────────────────────────────────────────────────────────
export const userQuests = mysqlTable("user_quests", {
  id:           int("id").autoincrement().primaryKey(),
  userId:       int("userId").notNull(),
  questSlug:    varchar("questSlug", { length: 100 }).notNull(),  // "morning_warrior", "client_whisperer", etc.
  questType:    mysqlEnum("questType", ["daily", "weekly", "epic", "legendary"]).notNull(),
  title:        varchar("title", { length: 300 }).notNull(),
  description:  text("description"),
  xpReward:     int("xpReward").default(50).notNull(),
  coinReward:   int("coinReward").default(10).notNull(),
  progress:     int("progress").default(0).notNull(),
  target:       int("target").default(1).notNull(),
  status:       mysqlEnum("status", ["active", "completed", "expired", "claimed"]).default("active").notNull(),
  expiresAt:    timestamp("expiresAt"),
  completedAt:  timestamp("completedAt"),
  claimedAt:    timestamp("claimedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type UserQuest = typeof userQuests.$inferSelect;
export type InsertUserQuest = typeof userQuests.$inferInsert;

// ─── User Achievements ──────────────────────────────────────────────────────
export const userAchievements = mysqlTable("user_achievements", {
  id:               int("id").autoincrement().primaryKey(),
  userId:           int("userId").notNull(),
  achievementSlug:  varchar("achievementSlug", { length: 100 }).notNull(),
  title:            varchar("title", { length: 300 }).notNull(),
  description:      text("description"),
  emoji:            varchar("emoji", { length: 20 }).default("🏆").notNull(),
  rarity:           mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  xpReward:         int("xpReward").default(100).notNull(),
  coinReward:       int("coinReward").default(50).notNull(),
  unlockedAt:       timestamp("unlockedAt").defaultNow().notNull(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
});
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// ─── User Loot Inventory ────────────────────────────────────────────────────
export const userLoot = mysqlTable("user_loot", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  itemSlug:    varchar("itemSlug", { length: 100 }).notNull(),
  itemName:    varchar("itemName", { length: 300 }).notNull(),
  itemType:    mysqlEnum("itemType", ["cosmetic", "booster", "title", "pet", "theme", "sound", "shield"]).notNull(),
  rarity:      mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  quantity:    int("quantity").default(1).notNull(),
  equipped:    boolean("equipped").default(false).notNull(),
  acquiredVia: mysqlEnum("acquiredVia", ["purchase", "quest", "achievement", "loot_drop", "daily_reward", "gift"]).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type UserLootItem = typeof userLoot.$inferSelect;
export type InsertUserLootItem = typeof userLoot.$inferInsert;

// ─── Daily Reward Claims ────────────────────────────────────────────────────
export const dailyRewardClaims = mysqlTable("daily_reward_claims", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  dayNumber:   int("dayNumber").notNull(),   // 1-7 in the weekly cycle
  weekStart:   varchar("weekStart", { length: 10 }).notNull(),  // YYYY-MM-DD of Monday
  rewardType:  mysqlEnum("rewardType", ["xp", "coin", "loot", "booster"]).notNull(),
  rewardAmount: int("rewardAmount").notNull(),
  claimedAt:   timestamp("claimedAt").defaultNow().notNull(),
});
export type DailyRewardClaim = typeof dailyRewardClaims.$inferSelect;
export type InsertDailyRewardClaim = typeof dailyRewardClaims.$inferInsert;

// ─── Skill Tree Progress ────────────────────────────────────────────────────
export const skillTreeProgress = mysqlTable("skill_tree_progress", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  skillSlug:   varchar("skillSlug", { length: 100 }).notNull(),  // "myga_master", "iul_architect", etc.
  skillName:   varchar("skillName", { length: 200 }).notNull(),
  currentLevel: int("currentLevel").default(0).notNull(),
  maxLevel:    int("maxLevel").default(5).notNull(),
  xpInvested:  int("xpInvested").default(0).notNull(),
  mastered:    boolean("mastered").default(false).notNull(),
  masteredAt:  timestamp("masteredAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SkillTreeNode = typeof skillTreeProgress.$inferSelect;
export type InsertSkillTreeNode = typeof skillTreeProgress.$inferInsert;

// ─── Family Groups (Couples Mode) ──────────────────────────────────────────
export const familyGroups = mysqlTable("family_groups", {
  id:          int("id").autoincrement().primaryKey(),
  name:        varchar("name", { length: 200 }).notNull(),
  inviteCode:  varchar("inviteCode", { length: 20 }).notNull().unique(),
  createdBy:   int("createdBy").notNull(),
  totalXp:     int("totalXp").default(0).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FamilyGroup = typeof familyGroups.$inferSelect;
export type InsertFamilyGroup = typeof familyGroups.$inferInsert;

// ─── Family Members ─────────────────────────────────────────────────────────
export const familyMembers = mysqlTable("family_members", {
  id:          int("id").autoincrement().primaryKey(),
  familyId:    int("familyId").notNull(),
  userId:      int("userId").notNull(),
  role:        mysqlEnum("role", ["leader", "member"]).default("member").notNull(),
  joinedAt:    timestamp("joinedAt").defaultNow().notNull(),
});
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = typeof familyMembers.$inferInsert;

// ─── Prediction Market Bets ─────────────────────────────────────────────────
export const predictionBets = mysqlTable("prediction_bets", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  question:    varchar("question", { length: 500 }).notNull(),
  prediction:  varchar("prediction", { length: 100 }).notNull(),  // "yes" | "no" | custom
  wager:       int("wager").notNull(),                             // RussellCoin wagered
  status:      mysqlEnum("status", ["open", "won", "lost", "cancelled"]).default("open").notNull(),
  resolvedAt:  timestamp("resolvedAt"),
  payout:      int("payout"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type PredictionBet = typeof predictionBets.$inferSelect;
export type InsertPredictionBet = typeof predictionBets.$inferInsert;

// ─── War Stories ────────────────────────────────────────────────────────────
export const warStories = mysqlTable("war_stories", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  title:       varchar("title", { length: 500 }).notNull(),
  content:     text("content").notNull(),
  category:    mysqlEnum("category", ["roth_conversion", "iul_strategy", "tax_savings", "estate_planning", "annuity_win", "general"]).default("general").notNull(),
  dollarImpact: decimal("dollarImpact", { precision: 15, scale: 2 }),
  likes:       int("likes").default(0).notNull(),
  views:       int("views").default(0).notNull(),
  isAnonymous: boolean("isAnonymous").default(true).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type WarStory = typeof warStories.$inferSelect;
export type InsertWarStory = typeof warStories.$inferInsert;


// ─── Will / Legacy Document Drafts ──────────────────────────────────────────
export const willDrafts = mysqlTable("will_drafts", {
  id:              int("id").autoincrement().primaryKey(),
  userId:          int("userId").notNull(),
  clientId:        int("clientId"),                                // optional — can be for advisor's own will or a client's
  workspaceId:     int("workspaceId"),
  title:           varchar("title", { length: 500 }).notNull(),
  status:          mysqlEnum("status", ["draft", "review", "finalized"]).default("draft").notNull(),
  tone:            mysqlEnum("tone", ["formal", "heartfelt", "spiritual", "practical"]).default("heartfelt").notNull(),
  // Structured will sections stored as JSON
  personalLetter:  text("personalLetter"),                         // heartfelt message to loved ones
  assetDistribution: json("assetDistribution").$type<WillAssetDistribution[]>(),
  guardianDesignations: json("guardianDesignations").$type<WillGuardian[]>(),
  specialBequests: json("specialBequests").$type<WillBequest[]>(),
  finalWishes:     text("finalWishes"),                            // funeral, organ donation, messages
  executorName:    varchar("executorName", { length: 200 }),
  executorRelation: varchar("executorRelation", { length: 100 }),
  witnessNames:    json("witnessNames").$type<string[]>(),
  // AI-generated full document
  generatedDocument: text("generatedDocument"),                    // full AI-rendered will text
  familyContext:   json("familyContext").$type<WillFamilyContext>(), // snapshot of family data used
  pdfUrl:          varchar("pdfUrl", { length: 2000 }),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WillDraft = typeof willDrafts.$inferSelect;
export type InsertWillDraft = typeof willDrafts.$inferInsert;

export interface WillAssetDistribution {
  beneficiaryName: string;
  relationship: string;
  assetType: string;       // "real_estate" | "financial" | "personal" | "business" | "insurance" | "retirement"
  assetDescription: string;
  estimatedValue?: number;
  percentage?: number;     // percentage of total estate
  conditions?: string;     // any conditions on the bequest
}

export interface WillGuardian {
  childName: string;
  childAge: number;
  primaryGuardian: string;
  primaryGuardianRelation: string;
  alternateGuardian?: string;
  alternateGuardianRelation?: string;
  specialInstructions?: string;
}

export interface WillBequest {
  recipientName: string;
  relationship: string;
  item: string;            // "grandmother's ring" | "$50,000 to charity" | "family cabin"
  type: "heirloom" | "charitable" | "conditional" | "memorial" | "educational";
  conditions?: string;
  emotionalNote?: string;  // personal message attached to this bequest
}

export interface WillFamilyContext {
  clientName: string;
  spouseName?: string;
  children: Array<{ name: string; age: number }>;
  grandchildren: Array<{ name: string; age: number; parentName: string }>;
  totalEstateValue: number;
  properties: Array<{ name: string; value: number; type: string }>;
  retirementAccounts: { ira: number; roth: number; k401: number };
  lifeInsurance: { deathBenefit: number; cashValue: number };
  state: string;
}

// ─── Slide Usage Tracking (rate-limit + analytics) ──────────────────────────
export const slideUsage = mysqlTable("slide_usage", {
  id:           int("id").autoincrement().primaryKey(),
  userId:       int("userId"),
  email:        varchar("email", { length: 320 }),
  accessTier:   mysqlEnum("accessTier", ["trial", "unlimited", "subscriber", "owner"]).default("trial").notNull(),
  topic:        varchar("topic", { length: 200 }),
  toolName:     varchar("toolName", { length: 200 }),
  slideCount:   int("slideCount").default(0).notNull(),
  audience:     mysqlEnum("audience", ["client", "advisor", "team"]).default("client").notNull(),
  action:       mysqlEnum("action", ["generate", "export_pptx", "save"]).default("generate").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type SlideUsageRow = typeof slideUsage.$inferSelect;
export type InsertSlideUsage = typeof slideUsage.$inferInsert;


// ─── Financial Reels (TikTok-style content feed) ────────────────────────────
export const financialReels = mysqlTable("financial_reels", {
  id:              int("id").autoincrement().primaryKey(),
  category:        varchar("category", { length: 100 }).notNull(),
  title:           varchar("title", { length: 500 }).notNull(),
  hookText:        text("hook_text").notNull(),
  slides:          json("slides").notNull(),
  emotion:         varchar("emotion", { length: 50 }).notNull().default("educational"),
  isMega:          boolean("is_mega").notNull().default(false),
  ctaText:         varchar("cta_text", { length: 200 }).default("Learn More"),
  ctaAction:       varchar("cta_action", { length: 200 }).default(""),
  musicMood:       varchar("music_mood", { length: 100 }).default("neutral"),
  bgGradient:      varchar("bg_gradient", { length: 200 }).default(""),
  iconEmoji:       varchar("icon_emoji", { length: 20 }).default("💰"),
  readTimeSeconds: int("read_time_seconds").default(30),
  sortOrder:       int("sort_order").default(0),
  viewCount:       int("view_count").default(0).notNull(),
  likeCount:       int("like_count").default(0).notNull(),
  saveCount:       int("save_count").default(0).notNull(),
  shareCount:      int("share_count").default(0).notNull(),
  isActive:        boolean("is_active").notNull().default(true),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type FinancialReelRow = typeof financialReels.$inferSelect;
export type InsertFinancialReel = typeof financialReels.$inferInsert;

export const reelInteractions = mysqlTable("reel_interactions", {
  id:        int("id").autoincrement().primaryKey(),
  userId:    int("userId").notNull(),
  reelId:    int("reelId").notNull(),
  action:    mysqlEnum("action", ["view", "like", "save", "share"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReelInteractionRow = typeof reelInteractions.$inferSelect;
export type InsertReelInteraction = typeof reelInteractions.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// MANIFESTO FEATURE TABLES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── User Pets (Secret #37 — The Pet System) ────────────────────────────────
export const userPets = mysqlTable("user_pets", {
  id:            int("id").autoincrement().primaryKey(),
  userId:        int("userId").notNull(),
  speciesId:     varchar("speciesId", { length: 50 }).notNull(),
  name:          varchar("name", { length: 100 }).notNull(),
  level:         int("level").default(1).notNull(),
  xp:            int("xp").default(0).notNull(),
  xpToNext:      int("xpToNext").default(100).notNull(),
  happiness:     int("happiness").default(100).notNull(),
  hunger:        int("hunger").default(100).notNull(),
  strength:      int("strength").default(5).notNull(),
  wisdom:        int("wisdom").default(5).notNull(),
  charisma:      int("charisma").default(5).notNull(),
  luck:          int("luck").default(5).notNull(),
  evolutionStage: mysqlEnum("evolutionStage", ["hatchling", "juvenile", "adolescent", "adult", "elder", "legendary"]).default("hatchling").notNull(),
  totalFeedings: int("totalFeedings").default(0).notNull(),
  totalDeals:    int("totalDeals").default(0).notNull(),
  isActive:      boolean("isActive").default(true).notNull(),
  lastFedAt:     timestamp("lastFedAt"),
  lastInteractedAt: timestamp("lastInteractedAt"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserPet = typeof userPets.$inferSelect;
export type InsertUserPet = typeof userPets.$inferInsert;

// ─── Morning Ritual Tracking (Secret #3 — The Morning Ritual) ───────────────
export const morningRituals = mysqlTable("morning_rituals", {
  id:            int("id").autoincrement().primaryKey(),
  userId:        int("userId").notNull(),
  date:          varchar("date", { length: 10 }).notNull(),
  stepsCompleted: json("stepsCompleted").$type<number[]>(),
  totalSteps:    int("totalSteps").default(7).notNull(),
  isComplete:    boolean("isComplete").default(false).notNull(),
  startedAt:     timestamp("startedAt"),
  completedAt:   timestamp("completedAt"),
  streakDay:     int("streakDay").default(1).notNull(),
  xpEarned:      int("xpEarned").default(0).notNull(),
  coinsEarned:   int("coinsEarned").default(0).notNull(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type MorningRitual = typeof morningRituals.$inferSelect;
export type InsertMorningRitual = typeof morningRituals.$inferInsert;

// ─── Withdrawal Triggers (Secret #8 — The Withdrawal Symptom) ───────────────
export const withdrawalTriggers = mysqlTable("withdrawal_triggers", {
  id:            int("id").autoincrement().primaryKey(),
  userId:        int("userId").notNull(),
  triggerType:   mysqlEnum("triggerType", ["gentle_nudge", "fomo_alert", "pet_sad", "streak_warning", "loot_expiring", "quest_expiring", "rival_passed", "market_move"]).notNull(),
  title:         varchar("title", { length: 300 }).notNull(),
  message:       text("message").notNull(),
  urgency:       mysqlEnum("urgency", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  channel:       mysqlEnum("channel", ["in_app", "email", "push", "sms"]).default("in_app").notNull(),
  sentAt:        timestamp("sentAt"),
  openedAt:      timestamp("openedAt"),
  clickedAt:     timestamp("clickedAt"),
  isRead:        boolean("isRead").default(false).notNull(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});
export type WithdrawalTrigger = typeof withdrawalTriggers.$inferSelect;
export type InsertWithdrawalTrigger = typeof withdrawalTriggers.$inferInsert;

// ─── Revenue Guarantee Calculations ─────────────────────────────────────────
export const revenueGuaranteeCalcs = mysqlTable("revenue_guarantee_calcs", {
  id:                int("id").autoincrement().primaryKey(),
  userId:            int("userId").notNull(),
  currentAUM:        decimal("currentAUM", { precision: 15, scale: 2 }).notNull(),
  currentRevenue:    decimal("currentRevenue", { precision: 15, scale: 2 }).notNull(),
  projectedAUM:      decimal("projectedAUM", { precision: 15, scale: 2 }).notNull(),
  projectedRevenue:  decimal("projectedRevenue", { precision: 15, scale: 2 }).notNull(),
  subscriptionCost:  decimal("subscriptionCost", { precision: 10, scale: 2 }).notNull(),
  roiMultiple:       decimal("roiMultiple", { precision: 8, scale: 2 }).notNull(),
  breakEvenDays:     int("breakEvenDays").notNull(),
  guaranteeTier:     mysqlEnum("guaranteeTier", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  createdAt:         timestamp("createdAt").defaultNow().notNull(),
});
export type RevenueGuaranteeCalc = typeof revenueGuaranteeCalcs.$inferSelect;
export type InsertRevenueGuaranteeCalc = typeof revenueGuaranteeCalcs.$inferInsert;


// ─── Video Proposals (HeyGen Integration) ───────────────────────────────────
export const videoProposals = mysqlTable("video_proposals", {
  id:              int("id").autoincrement().primaryKey(),
  userId:          int("userId").notNull(),
  workspaceId:     int("workspaceId").notNull(),
  clientId:        int("clientId"),
  title:           varchar("title", { length: 500 }).notNull(),
  status:          mysqlEnum("status", ["draft", "generating_script", "script_ready", "generating_video", "processing", "completed", "failed"]).default("draft").notNull(),
  avatarId:        varchar("avatarId", { length: 200 }),
  voiceId:         varchar("voiceId", { length: 200 }),
  heygenVideoId:   varchar("heygenVideoId", { length: 200 }),
  videoUrl:        text("videoUrl"),
  thumbnailUrl:    text("thumbnailUrl"),
  shareToken:      varchar("shareToken", { length: 100 }),
  totalDuration:   int("totalDuration"),
  resolution:      mysqlEnum("resolution", ["1080p", "720p"]).default("1080p").notNull(),
  errorMessage:    text("errorMessage"),
  generatedAt:     timestamp("generatedAt"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
  updatedAt:       timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VideoProposal = typeof videoProposals.$inferSelect;
export type InsertVideoProposal = typeof videoProposals.$inferInsert;

export const videoProposalChapters = mysqlTable("video_proposal_chapters", {
  id:              int("id").autoincrement().primaryKey(),
  proposalId:      int("proposalId").notNull(),
  chapterIndex:    int("chapterIndex").notNull(),
  chapterType:     mysqlEnum("chapterType", ["introduction", "current_situation", "recommended_strategy", "twenty_year_projection", "next_steps", "custom"]).notNull(),
  title:           varchar("title", { length: 300 }).notNull(),
  script:          text("script").notNull(),
  durationEstimate: int("durationEstimate"),
  dataSnapshot:    json("dataSnapshot"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type VideoProposalChapter = typeof videoProposalChapters.$inferSelect;
export type InsertVideoProposalChapter = typeof videoProposalChapters.$inferInsert;

export const videoEngagementEvents = mysqlTable("video_engagement_events", {
  id:              int("id").autoincrement().primaryKey(),
  proposalId:      int("proposalId").notNull(),
  viewerType:      mysqlEnum("viewerType", ["client", "advisor", "anonymous"]).default("anonymous").notNull(),
  viewerId:        int("viewerId"),
  eventType:       mysqlEnum("eventType", ["play", "pause", "seek", "chapter_enter", "chapter_exit", "complete", "replay_section"]).notNull(),
  chapterIndex:    int("chapterIndex"),
  videoTimestamp:  int("videoTimestamp"),
  watchDuration:   int("watchDuration"),
  totalWatchTime:  int("totalWatchTime"),
  percentWatched:  int("percentWatched"),
  ipAddress:       varchar("ipAddress", { length: 45 }),
  userAgent:       text("userAgent"),
  createdAt:       timestamp("createdAt").defaultNow().notNull(),
});
export type VideoEngagementEvent = typeof videoEngagementEvents.$inferSelect;
export type InsertVideoEngagementEvent = typeof videoEngagementEvents.$inferInsert;


// ── ERROR TRACKING ──────────────────────────────────────────────────
export const errorLogs = mysqlTable("error_logs", {
  id:          int("id").primaryKey().autoincrement(),
  userId:      int("userId"),
  source:      varchar("source", { length: 20 }).notNull().default("client"),
  level:       varchar("level", { length: 10 }).notNull().default("error"),
  message:     text("message").notNull(),
  stack:       text("stack"),
  componentStack: text("componentStack"),
  url:         text("url"),
  userAgent:   text("userAgent"),
  metadata:    json("metadata"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

// ── DEAL SCORING ────────────────────────────────────────────────────
export const dealScores = mysqlTable("deal_scores", {
  id:          int("id").primaryKey().autoincrement(),
  dealId:      int("dealId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  score:       int("score").notNull(),
  confidence:  varchar("confidence", { length: 10 }).notNull().default("medium"),
  factors:     json("factors"),
  recommendation: text("recommendation"),
  scoredAt:    timestamp("scoredAt").defaultNow().notNull(),
  scoredBy:    varchar("scoredBy", { length: 10 }).notNull().default("ai"),
});
export type DealScore = typeof dealScores.$inferSelect;
export type InsertDealScore = typeof dealScores.$inferInsert;

// ── REPORT EXPORTS ──────────────────────────────────────────────────
export const reportExports = mysqlTable("report_exports", {
  id:          int("id").primaryKey().autoincrement(),
  userId:      int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  clientId:    int("clientId"),
  reportType:  varchar("reportType", { length: 50 }).notNull(),
  status:      varchar("status", { length: 20 }).notNull().default("pending"),
  fileUrl:     text("fileUrl"),
  fileKey:     text("fileKey"),
  metadata:    json("metadata"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type ReportExport = typeof reportExports.$inferSelect;
export type InsertReportExport = typeof reportExports.$inferInsert;

// ── CLIENT PORTAL SESSIONS ──────────────────────────────────────────
export const clientPortalSessions = mysqlTable("client_portal_sessions", {
  id:          int("id").primaryKey().autoincrement(),
  clientId:    int("clientId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  token:       varchar("token", { length: 128 }).notNull(),
  expiresAt:   timestamp("expiresAt").notNull(),
  lastAccessedAt: timestamp("lastAccessedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type ClientPortalSession = typeof clientPortalSessions.$inferSelect;
export type InsertClientPortalSession = typeof clientPortalSessions.$inferInsert;

// ── CALENDAR EVENTS ─────────────────────────────────────────────────
export const calendarEvents = mysqlTable("calendar_events", {
  id:          int("id").primaryKey().autoincrement(),
  userId:      int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  clientId:    int("clientId"),
  googleEventId: varchar("googleEventId", { length: 255 }),
  title:       varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime:   timestamp("startTime").notNull(),
  endTime:     timestamp("endTime").notNull(),
  location:    text("location"),
  meetingType: varchar("meetingType", { length: 50 }).default("general"),
  status:      varchar("status", { length: 20 }).default("scheduled"),
  metadata:    json("metadata"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// ── PREDICTION MARKET QUESTIONS ─────────────────────────────────────────────
export const predictionQuestions = mysqlTable("prediction_questions", {
  id:          int("id").primaryKey().autoincrement(),
  createdBy:   int("createdBy").notNull(),
  question:    varchar("question", { length: 500 }).notNull(),
  category:    varchar("category", { length: 50 }).default("general").notNull(),
  endDate:     timestamp("endDate").notNull(),
  yesCount:    int("yesCount").default(0).notNull(),
  noCount:     int("noCount").default(0).notNull(),
  totalWager:  int("totalWager").default(0).notNull(),
  status:      mysqlEnum("status", ["open", "resolved_yes", "resolved_no", "cancelled"]).default("open").notNull(),
  resolvedAt:  timestamp("resolvedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type PredictionQuestion = typeof predictionQuestions.$inferSelect;
export type InsertPredictionQuestion = typeof predictionQuestions.$inferInsert;

// ── UNIFIED PLANNING CASES ──────────────────────────────────────────────────
// Reuses existing clients, saved_scenarios, scenario_snapshots, and client_notes.
// This table is the durable workflow envelope that links those records together.
export const planningCases = mysqlTable("planning_cases", {
  id:            int("id").primaryKey().autoincrement(),
  workspaceId:   int("workspaceId").notNull(),
  clientId:      int("clientId"),
  userId:        int("userId").notNull(),
  title:         varchar("title", { length: 300 }).notNull(),
  caseType:      varchar("caseType", { length: 100 }).default("comprehensive").notNull(),
  status:        mysqlEnum("status", ["draft", "active", "review", "completed", "archived"]).default("draft").notNull(),
  currentStage:  varchar("currentStage", { length: 100 }).default("discovery").notNull(),
  assumptions:   json("assumptions").$type<Record<string, unknown>>(),
  results:       json("results").$type<Record<string, unknown>>(),
  workflowState: json("workflowState").$type<Record<string, unknown>>(),
  lastSavedAt:   timestamp("lastSavedAt").defaultNow().notNull(),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlanningCase = typeof planningCases.$inferSelect;
export type InsertPlanningCase = typeof planningCases.$inferInsert;

export const planningCaseNotes = mysqlTable("planning_case_notes", {
  id:             int("id").primaryKey().autoincrement(),
  planningCaseId: int("planningCaseId").notNull(),
  userId:         int("userId").notNull(),
  noteType:       mysqlEnum("noteType", ["advisor", "client", "compliance", "system"]).default("advisor").notNull(),
  content:        text("content").notNull(),
  resolved:       boolean("resolved").default(false).notNull(),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlanningCaseNote = typeof planningCaseNotes.$inferSelect;
export type InsertPlanningCaseNote = typeof planningCaseNotes.$inferInsert;

// ── PAGE AUDIT PERSISTENCE ──────────────────────────────────────────────────
export const pageAuditRuns = mysqlTable("page_audit_runs", {
  id:                 int("id").primaryKey().autoincrement(),
  initiatedBy:        int("initiatedBy").notNull(),
  routeCount:         int("routeCount").default(0).notNull(),
  status:             mysqlEnum("status", ["queued", "running", "completed", "failed"]).default("queued").notNull(),
  methodologyVersion: varchar("methodologyVersion", { length: 50 }).default("1.0").notNull(),
  summary:            json("summary").$type<Record<string, unknown>>(),
  startedAt:          timestamp("startedAt"),
  completedAt:        timestamp("completedAt"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
});
export type PageAuditRun = typeof pageAuditRuns.$inferSelect;
export type InsertPageAuditRun = typeof pageAuditRuns.$inferInsert;

export const pageAuditRecords = mysqlTable("page_audit_records", {
  id:                      int("id").primaryKey().autoincrement(),
  runId:                   int("runId").notNull(),
  path:                    varchar("path", { length: 500 }).notNull(),
  pageTitle:               varchar("pageTitle", { length: 300 }),
  componentName:           varchar("componentName", { length: 200 }),
  renderHealth:            mysqlEnum("renderHealth", ["untested", "pass", "warn", "fail"]).default("untested").notNull(),
  navigationHealth:        mysqlEnum("navigationHealth", ["untested", "reachable", "orphaned", "broken"]).default("untested").notNull(),
  interactionHealth:       mysqlEnum("interactionHealth", ["untested", "working", "partial", "placeholder", "broken"]).default("untested").notNull(),
  placeholderCount:        int("placeholderCount").default(0).notNull(),
  duplicateGroup:          varchar("duplicateGroup", { length: 200 }),
  usefulnessScore:         int("usefulnessScore"),
  recommendation:          mysqlEnum("recommendation", ["keep", "improve", "merge", "secondary", "retire"]),
  mergeTarget:             varchar("mergeTarget", { length: 500 }),
  rationale:               text("rationale"),
  improvementInstructions: text("improvementInstructions"),
  evidence:                json("evidence").$type<Record<string, unknown>>(),
  auditedAt:               timestamp("auditedAt"),
  createdAt:               timestamp("createdAt").defaultNow().notNull(),
  updatedAt:               timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PageAuditRecord = typeof pageAuditRecords.$inferSelect;
export type InsertPageAuditRecord = typeof pageAuditRecords.$inferInsert;

// ── PORTAL PREFERENCES ──────────────────────────────────────────────────────
export const userPortalPreferences = mysqlTable("user_portal_preferences", {
  id:                  int("id").primaryKey().autoincrement(),
  userId:              int("userId").notNull(),
  workspaceId:         int("workspaceId"),
  defaultLandingPath:  varchar("defaultLandingPath", { length: 500 }).default("/portal/dashboard").notNull(),
  openNavGroups:       json("openNavGroups").$type<string[]>(),
  secondaryCategories: json("secondaryCategories").$type<string[]>(),
  compactSidebar:      boolean("compactSidebar").default(false).notNull(),
  reduceMotion:        boolean("reduceMotion").default(false).notNull(),
  lastVisitedPath:     varchar("lastVisitedPath", { length: 500 }),
  createdAt:           timestamp("createdAt").defaultNow().notNull(),
  updatedAt:           timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserPortalPreference = typeof userPortalPreferences.$inferSelect;
export type InsertUserPortalPreference = typeof userPortalPreferences.$inferInsert;

// ─── CLIENT FACT FINDER (Financial Assessment) + FINANCIAL LIBRARIAN JOURNEYS ─
// One row per signed-in user: the comprehensive 15-section assessment as JSON
// (shape: shared/clientFactFinder.ts), its completeness %, and when it was
// first completed. The AI Financial Advisor refuses to answer until complete.
export const clientFactFinders = mysqlTable("client_fact_finders", {
  id:           int("id").autoincrement().primaryKey(),
  userId:       int("userId").notNull().unique(),
  data:         json("data").$type<ClientFactFinderJson>().notNull(),
  completeness: int("completeness").notNull().default(0),
  completedAt:  timestamp("completedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientFactFinderRow = typeof clientFactFinders.$inferSelect;
export type InsertClientFactFinderRow = typeof clientFactFinders.$inferInsert;

// The Financial Librarian's answer to a client's questions: the 3–5 distilled
// core questions, the emergent question, and the 10–15 page journey.
export const clientJourneys = mysqlTable("client_journeys", {
  id:         int("id").autoincrement().primaryKey(),
  userId:     int("userId").notNull(),
  questions:  json("questions").$type<string[]>().notNull(),
  journey:    json("journey").$type<ClientJourneyJson>().notNull(),
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});
export type ClientJourneyRow = typeof clientJourneys.$inferSelect;

// Mirrors of the shared types (schema.ts avoids importing client-shared modules).
export interface ClientFactFinderJson {
  version: 1;
  sections: Record<string, Record<string, string | number | boolean | null>>;
  lists: Record<string, Array<Record<string, string | number | boolean | null>>>;
}
export interface ClientJourneyJson {
  coreQuestions: string[];
  emergentQuestion: string;
  steps: Array<{ id: string; path: string; title: string; why: string; kind: string; guide?: string; visitedAt?: string | null }>;
  controls?: { youControl: string[]; youDont: string[] };
  generatedBy: string;
}

// ─── MESSAGING + AUTOMATION (email/SMS to leads and clients) ─────────────────
// Numbers that replied STOP (or were opted out by the advisor). Checked before
// every text is sent. Source: "reply" (inbound STOP), "advisor", "import".
export const smsOptOuts = mysqlTable("sms_opt_outs", {
  id:        int("id").autoincrement().primaryKey(),
  phone:     varchar("phone", { length: 24 }).notNull().unique(), // E.164
  source:    varchar("source", { length: 40 }).notNull().default("reply"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Addresses that clicked unsubscribe. Marketing mail is never sent to them;
// transactional mail (their own report, their own sign-in) still is.
export const emailOptOuts = mysqlTable("email_opt_outs", {
  id:        int("id").autoincrement().primaryKey(),
  email:     varchar("email", { length: 320 }).notNull().unique(),
  source:    varchar("source", { length: 40 }).notNull().default("link"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// The automated follow-up sequence for a homepage lead: one row per step.
// Rows are created at capture, sent by the scheduler when due, and cancelled
// when the advisor marks the lead contacted/qualified/client.
export const leadFollowups = mysqlTable("lead_followups", {
  id:           int("id").autoincrement().primaryKey(),
  leadId:       int("leadId").notNull(),
  step:         varchar("step", { length: 60 }).notNull(),      // e.g. "email_day1"
  channel:      mysqlEnum("channel", ["email", "sms"]).notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  status:       mysqlEnum("status", ["pending", "sent", "skipped", "failed", "cancelled"]).default("pending").notNull(),
  sentAt:       timestamp("sentAt"),
  reason:       varchar("reason", { length: 300 }),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
});
export type LeadFollowup = typeof leadFollowups.$inferSelect;

// Every email/text the advisor (or the automation) sends to a lead or client,
// with the delivery outcome. This is the audit trail and the "Messages" tab.
export const outboundMessages = mysqlTable("outbound_messages", {
  id:          int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId"),
  clientId:    int("clientId"),
  leadId:      int("leadId"),
  userId:      int("userId"),                                     // sender; null = automation
  channel:     mysqlEnum("channel", ["email", "sms"]).notNull(),
  category:    mysqlEnum("category", ["transactional", "marketing"]).default("transactional").notNull(),
  toAddress:   varchar("toAddress", { length: 320 }).notNull(),
  subject:     varchar("subject", { length: 300 }),
  body:        text("body").notNull(),
  template:    varchar("template", { length: 60 }),
  status:      mysqlEnum("status", ["sent", "failed", "suppressed"]).notNull(),
  via:         varchar("via", { length: 20 }),
  reason:      varchar("reason", { length: 300 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});
export type OutboundMessage = typeof outboundMessages.$inferSelect;

// Last-known market benchmarks (FRED series) so calculators keep real,
// dated reference values across restarts even when the feed is unreachable.
export const marketDataPoints = mysqlTable("market_data_points", {
  id:        int("id").autoincrement().primaryKey(),
  series:    varchar("series", { length: 40 }).notNull().unique(), // e.g. DGS10
  value:     decimal("value", { precision: 14, scale: 4 }).notNull(),
  asOf:      varchar("asOf", { length: 10 }).notNull(),             // YYYY-MM-DD
  source:    varchar("source", { length: 40 }).notNull().default("fred"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

// ─── THE PLAN LEDGER (append-only) ───────────────────────────────────────────
// One chain per subject (c:<clientId>, u:<userId>, l:<leadId>): every fact,
// assumption, decision, message, document, journey step, status and outcome,
// with time, source and a SHA-256 hash chained to the previous event so the
// history is tamper-evident. Rows are never updated or deleted by the app.
export const planEvents = mysqlTable("plan_events", {
  id:          int("id").autoincrement().primaryKey(),
  subject:     varchar("subject", { length: 40 }).notNull(),
  seq:         int("seq").notNull(),
  userId:      int("userId"),
  clientId:    int("clientId"),
  leadId:      int("leadId"),
  workspaceId: int("workspaceId"),
  kind:        mysqlEnum("kind", ["fact", "assumption", "decision", "message", "document", "outcome", "scenario", "journey", "status", "note"]).notNull(),
  source:      varchar("source", { length: 20 }).notNull(),
  key:         varchar("key", { length: 120 }),
  label:       varchar("label", { length: 200 }),
  value:       json("value"),
  prevValue:   json("prevValue"),
  summary:     text("summary").notNull(),
  actorName:   varchar("actorName", { length: 200 }),
  occurredAt:  timestamp("occurredAt").notNull(),
  prevHash:    varchar("prevHash", { length: 64 }).notNull(),
  hash:        varchar("hash", { length: 64 }).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  subjectSeq: uniqueIndex("plan_events_subject_seq").on(t.subject, t.seq),
  byClient:   index("plan_events_client").on(t.clientId),
  byUser:     index("plan_events_user").on(t.userId),
  byLead:     index("plan_events_lead").on(t.leadId),
}));
export type PlanEventRow = typeof planEvents.$inferSelect;
