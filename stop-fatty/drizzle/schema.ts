import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["free_trial", "active", "expired", "cancelled"]).default("free_trial").notNull(),
  trialStartedAt: timestamp("trialStartedAt"),
  subscriptionStartedAt: timestamp("subscriptionStartedAt"),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const calibrationProfiles = mysqlTable("calibration_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  visualTrigger: text("visualTrigger"),
  visualScene: text("visualScene"),
  visualFuture: text("visualFuture"),
  auditoryDialog: text("auditoryDialog"),
  auditoryTone: text("auditoryTone"),
  auditoryPermission: text("auditoryPermission"),
  kinestheticFeeling: text("kinestheticFeeling"),
  kinestheticLocation: text("kinestheticLocation"),
  kinestheticIntensity: text("kinestheticIntensity"),
  triggerSequence: text("triggerSequence"),
  impulseControlScore: int("impulseControlScore").default(50),
  lockedStatus: mysqlEnum("lockedStatus", ["none", "failure_locked", "victory_locked"]).default("none").notNull(),
  daysAt75Plus: int("daysAt75Plus").default(0).notNull(),
  lastScoreDate: timestamp("lastScoreDate"),
  selfieUrl: text("selfieUrl"),
  failureAvatarUrl: text("failureAvatarUrl"),
  victoryAvatarUrl: text("victoryAvatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalibrationProfile = typeof calibrationProfiles.$inferSelect;
export type InsertCalibrationProfile = typeof calibrationProfiles.$inferInsert;

export const recordings = mysqlTable("recordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["failure", "victory"]).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  duration: int("duration"),
  howTheyFeel: text("howTheyFeel"),
  whatTheySaid: text("whatTheySaid"),
  futureOutlook: text("futureOutlook"),
  prideDescription: text("prideDescription"),
  reinforcement: text("reinforcement"),
  transcription: text("transcription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Recording = typeof recordings.$inferSelect;
export type InsertRecording = typeof recordings.$inferInsert;

export const temptationEntries = mysqlTable("temptation_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sawFood: text("sawFood").notNull(),
  saidToSelf: text("saidToSelf").notNull(),
  createdFeeling: text("createdFeeling").notNull(),
  outcome: mysqlEnum("outcome", ["resisted", "gave_in"]).notNull(),
  outcomeDescription: text("outcomeDescription"),
  patternInterruptPlayed: boolean("patternInterruptPlayed").default(false).notNull(),
  recordingPlayedId: int("recordingPlayedId"),
  temptationIntensity: int("temptationIntensity"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemptationEntry = typeof temptationEntries.$inferSelect;
export type InsertTemptationEntry = typeof temptationEntries.$inferInsert;
