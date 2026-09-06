import { and, asc, count, desc, eq, gte, inArray, like, lte, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertClientNote,
  aiMemoryNotes,
  auditLogs,
  clientNotes,
  clients,
  deals,
  knowledgeDocuments,
  memberships,
  scenarioSnapshots,
  strategies,
  users,
  workspaceInvitations,
  workspaceSubscriptions,
  workspaces,
  clientActivityLog,
  clientTags,
  clientTagAssignments,
  advisorGoals,
  webhookEndpoints,
  clientDocuments,
  reportSchedules,
  slackIntegrations,
  clientPortalTokens,
  allocationTargets,
  rebalanceAlerts,
  inAppNotifications,
  clientMeetings,
  dashboardWidgetConfigs,
  meetingReminderPrefs,
  riskScoreHistory,
  hubspotSyncLog,
  hubspotSyncSettings,
  complianceAlerts,
  clientProperties,
  clientCryptoHoldings,
  savedStrategies,
  carrierOverrides,
  recommendationHistory,
  referrals,
  complianceSignatures,
  userSessions,
  pageActivityLogs,
  householdFactFinders,
  paymentDisclosures,
  smsVerificationCodes,
  riskSnapshots,
  batchSchedules,
  savedSlideDecks,
  sidebarFavorites,
  slideUsage,
  financialReels,
  reelInteractions,
  videoProposals,
  videoProposalChapters,
  videoEngagementEvents,
  errorLogs,
  dealScores,
  reportExports,
  clientPortalSessions,
  calendarEvents,
  planningCases,
  planningCaseNotes,
  userPortalPreferences,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { randomBytes } from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/** True when the database answers `SELECT 1`; used by /healthz and the site-health page. */
export async function pingDatabase(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.execute(sql`select 1`);
  return true;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "firstName", "lastName"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user by email: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${randomBytes(16).toString("hex")}`;
  await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role: "user",
    lastSignedIn: new Date(),
  });
  return getUserByOpenId(openId);
}

export async function updateUserPasswordHash(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, resetToken: null, resetTokenExpiry: null }).where(eq(users.id, userId));
}

export async function setResetToken(userId: number, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.id, userId));
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  if (result.length === 0) return undefined;
  const user = result[0];
  // Check expiry
  if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) return undefined;
  return user;
}

// ─── Workspaces ───────────────────────────────────────────────────────────────
export async function getOrCreateWorkspace(userId: number, name: string, slug: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(workspaces).values({ name, slug, ownerId: userId });
  const created = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).limit(1);
  return created[0];
}

export async function getWorkspaceByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(workspaces).where(eq(workspaces.ownerId, ownerId)).limit(1);
  return result[0] ?? null;
}

export async function getUserMembership(userId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.workspaceId, workspaceId))).limit(1);
  return result[0] ?? null;
}

export async function ensureMembership(userId: number, workspaceId: number, role: "SUPER_ADMIN" | "ADMIN" | "ADVISOR" | "ANALYST" | "VIEWER" = "SUPER_ADMIN") {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserMembership(userId, workspaceId);
  if (!existing) {
    await db.insert(memberships).values({ workspaceId, userId, role, status: "ACTIVE" });
  }
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export async function getClients(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.workspaceId, workspaceId)).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clients)
    .where(and(eq(clients.id, id), eq(clients.workspaceId, workspaceId))).limit(1);
  return result[0] ?? null;
}

export async function createClient(data: typeof clients.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(clients).values(data);
  const created = await db.select().from(clients)
    .where(and(eq(clients.workspaceId, data.workspaceId), eq(clients.name, data.name)))
    .orderBy(desc(clients.createdAt)).limit(1);
  return created[0];
}

export async function updateClient(id: number, workspaceId: number, data: Partial<typeof clients.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(clients).set(data).where(and(eq(clients.id, id), eq(clients.workspaceId, workspaceId)));
}

// ─── Deals ────────────────────────────────────────────────────────────────────
export async function getDeals(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deals).where(eq(deals.workspaceId, workspaceId)).orderBy(desc(deals.createdAt));
}

export async function createDeal(data: typeof deals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(deals).values(data);
  const created = await db.select().from(deals)
    .where(eq(deals.workspaceId, data.workspaceId))
    .orderBy(desc(deals.createdAt)).limit(1);
  return created[0];
}

export async function updateDeal(id: number, workspaceId: number, data: Partial<typeof deals.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(deals).set(data).where(and(eq(deals.id, id), eq(deals.workspaceId, workspaceId)));
}

// ─── Strategies ───────────────────────────────────────────────────────────────
export async function getStrategiesByClient(clientId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(strategies.clientId, clientId)];
  if (workspaceId !== undefined) conditions.push(eq(strategies.workspaceId, workspaceId));
  return db.select().from(strategies).where(and(...conditions)).orderBy(desc(strategies.createdAt));
}

export async function createStrategy(data: typeof strategies.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(strategies).values(data);
  const created = await db.select().from(strategies)
    .where(eq(strategies.clientId, data.clientId))
    .orderBy(desc(strategies.createdAt)).limit(1);
  return created[0];
}

// ─── Scenario Snapshots ───────────────────────────────────────────────────────
export async function getScenarios(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scenarioSnapshots).where(eq(scenarioSnapshots.workspaceId, workspaceId)).orderBy(desc(scenarioSnapshots.createdAt));
}

export async function createScenario(data: typeof scenarioSnapshots.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(scenarioSnapshots).values(data);
  const created = await db.select().from(scenarioSnapshots)
    .where(eq(scenarioSnapshots.workspaceId, data.workspaceId))
    .orderBy(desc(scenarioSnapshots.createdAt)).limit(1);
  return created[0];
}

// ─── Knowledge Documents ──────────────────────────────────────────────────────
export async function getKnowledgeDocs(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.workspaceId, workspaceId)).orderBy(desc(knowledgeDocuments.createdAt));
}

export async function createKnowledgeDoc(data: typeof knowledgeDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(knowledgeDocuments).values(data);
  const created = await db.select().from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.workspaceId, data.workspaceId))
    .orderBy(desc(knowledgeDocuments.createdAt)).limit(1);
  return created[0];
}

// ─── Team / Invitations ───────────────────────────────────────────────────────
export async function getMemberships(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: memberships.id,
    userId: memberships.userId,
    role: memberships.role,
    status: memberships.status,
    createdAt: memberships.createdAt,
    userName: users.name,
    userEmail: users.email,
    userFirstName: users.firstName,
    userLastName: users.lastName,
  })
    .from(memberships)
    .leftJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.workspaceId, workspaceId))
    .orderBy(desc(memberships.createdAt));
}

export async function getInvitations(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workspaceInvitations)
    .where(eq(workspaceInvitations.workspaceId, workspaceId))
    .orderBy(desc(workspaceInvitations.createdAt));
}

export async function createInvitation(data: typeof workspaceInvitations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(workspaceInvitations).values(data);
  const created = await db.select().from(workspaceInvitations)
    .where(eq(workspaceInvitations.tokenHash, data.tokenHash)).limit(1);
  return created[0];
}

export async function getInvitationByToken(tokenHash: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(workspaceInvitations)
    .where(eq(workspaceInvitations.tokenHash, tokenHash)).limit(1);
  return result[0] ?? null;
}

// ─── Billing / Subscriptions ──────────────────────────────────────────────────
export async function getSubscription(workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(workspaceSubscriptions)
    .where(eq(workspaceSubscriptions.workspaceId, workspaceId))
    .orderBy(desc(workspaceSubscriptions.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function upsertSubscription(workspaceId: number, data: Partial<typeof workspaceSubscriptions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getSubscription(workspaceId);
  if (existing) {
    await db.update(workspaceSubscriptions).set(data).where(eq(workspaceSubscriptions.workspaceId, workspaceId));
  } else {
    await db.insert(workspaceSubscriptions).values({ workspaceId, ...data } as typeof workspaceSubscriptions.$inferInsert);
  }
}

// ─── Dashboard aggregates ─────────────────────────────────────────────────────
export async function getDashboardStats(workspaceId: number) {
  const db = await getDb();
  if (!db) return { clientCount: 0, dealCount: 0, totalAum: 0, pipelineValue: 0, goalProgress: 0 };
  const [clientCount] = await db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.workspaceId, workspaceId));
  const [dealCount] = await db.select({ count: sql<number>`count(*)` }).from(deals).where(eq(deals.workspaceId, workspaceId));
  const [aum] = await db.select({ total: sql<number>`coalesce(sum(\`iraBalance\` + \`rothBalance\` + \`taxableAssets\` + \`realEstateEquity\` + coalesce(\`lifeInsuranceCv\`, 0)), 0)` }).from(clients).where(eq(clients.workspaceId, workspaceId));
  const [pipeline] = await db.select({ total: sql<number>`coalesce(sum(value * probability), 0)` }).from(deals).where(eq(deals.workspaceId, workspaceId));
  // Goal progress: % of clients with at least one strategy
  const [withStrategy] = await db.select({ count: sql<number>`count(distinct \`clientId\`)` }).from(strategies).where(eq(strategies.workspaceId, workspaceId));
  const cCount = Number(clientCount?.count ?? 0);
  const goalProgress = cCount > 0 ? Math.round((Number(withStrategy?.count ?? 0) / cCount) * 100) : 0;
  return {
    clientCount: cCount,
    dealCount: Number(dealCount?.count ?? 0),
    totalAum: Number(aum?.total ?? 0),
    pipelineValue: Number(pipeline?.total ?? 0),
    goalProgress,
  };
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export async function writeAuditLog(data: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data).catch(() => {/* non-critical */});
}

// ─── Demo Data Seeder ─────────────────────────────────────────────────────────
/**
 * Idempotent demo seeder: populates a workspace with Sam Russell scenario data.
 * Returns { seeded: true } if data was inserted, { seeded: false } if already present.
 */
export async function seedDemoWorkspace(workspaceId: number, ownerName = "Sam Russell"): Promise<{ seeded: boolean; clientCount: number; dealCount: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Guard: check if demo data already exists
  const existing = await db.select().from(clients).where(eq(clients.workspaceId, workspaceId)).limit(1);
  if (existing.length > 0) return { seeded: false, clientCount: 0, dealCount: 0 };

  // ── Demo clients ────────────────────────────────────────────────────────────
  const demoClients = [
    {
      workspaceId,
      name: "Heather Scenario",
      household: "Scenario Household",
      email: "heather@example.com",
      age: 64,
      state: "TX",
      filingStatus: "joint" as const,
      income: "142000",
      iraBalance: "0",
      rothBalance: "1000000",
      realEstateEquity: "1800000",
      taxableAssets: "250000",
      notes: "Primary demo client — Roth-heavy, real estate rich, near retirement.",
      opportunityScore: 88,
    },
    {
      workspaceId,
      name: "David Mercer",
      household: "Mercer Family",
      email: "david@example.com",
      age: 58,
      state: "CA",
      filingStatus: "joint" as const,
      income: "310000",
      iraBalance: "1200000",
      rothBalance: "0",
      realEstateEquity: "2400000",
      taxableAssets: "500000",
      notes: "High-income, IRA-heavy. Ideal Roth conversion candidate.",
      opportunityScore: 92,
    },
    {
      workspaceId,
      name: "Lauren Hall",
      household: "Hall Household",
      email: "lauren@example.com",
      age: 52,
      state: "FL",
      filingStatus: "single" as const,
      income: "215000",
      iraBalance: "850000",
      rothBalance: "120000",
      realEstateEquity: "950000",
      taxableAssets: "300000",
      notes: "Mid-career, balanced portfolio. IUL candidate.",
      opportunityScore: 76,
    },
    {
      workspaceId,
      name: "Marcus Webb",
      household: "Webb Family",
      email: "marcus@example.com",
      age: 61,
      state: "NY",
      filingStatus: "joint" as const,
      income: "420000",
      iraBalance: "2100000",
      rothBalance: "50000",
      realEstateEquity: "3200000",
      taxableAssets: "800000",
      notes: "Ultra-HNW. Complex estate planning needs.",
      opportunityScore: 97,
    },
    {
      workspaceId,
      name: "Sandra Kim",
      household: "Kim Household",
      email: "sandra@example.com",
      age: 47,
      state: "WA",
      filingStatus: "joint" as const,
      income: "175000",
      iraBalance: "400000",
      rothBalance: "80000",
      realEstateEquity: "600000",
      taxableAssets: "120000",
      notes: "Early planning stage. Good candidate for IUL + real estate strategy.",
      opportunityScore: 65,
    },
  ];

  // Insert clients and capture their IDs
  const insertedClients: Array<{ id: number; name: string }> = [];
  for (const c of demoClients) {
    await db.insert(clients).values(c);
    const created = await db.select().from(clients)
      .where(and(eq(clients.workspaceId, workspaceId), eq(clients.name, c.name)))
      .orderBy(desc(clients.createdAt)).limit(1);
    if (created[0]) insertedClients.push({ id: created[0].id, name: c.name });
  }

  // ── Demo deals (5 deals spread across clients and stages) ───────────────────
  const stages: Array<typeof deals.$inferInsert["stage"]> = [
    "LEAD", "QUALIFIED", "STRATEGY", "PROPOSAL", "CLOSED_WON"
  ];
  const dealData = [
    { clientName: "Heather Scenario", stage: "PROPOSAL" as const, value: "380000", ownerName, notes: "Full Roth + IUL proposal delivered. Awaiting signature." },
    { clientName: "David Mercer", stage: "STRATEGY" as const, value: "620000", ownerName, notes: "Roth ladder modeled. Presenting 10-year conversion plan." },
    { clientName: "Lauren Hall", stage: "QUALIFIED" as const, value: "215000", ownerName, notes: "Discovery complete. IUL quote requested." },
    { clientName: "Marcus Webb", stage: "CLOSED_WON" as const, value: "1450000", ownerName, notes: "Closed. Full estate + Roth + IUL strategy implemented.", closedAt: new Date() },
    { clientName: "Sandra Kim", stage: "LEAD" as const, value: "95000", ownerName, notes: "Referred by David Mercer. Initial call scheduled." },
  ];

  let dealCount = 0;
  for (const d of dealData) {
    const client = insertedClients.find(c => c.name === d.clientName);
    if (!client) continue;
    await db.insert(deals).values({
      workspaceId,
      clientId: client.id,
      stage: d.stage,
      value: d.value,
      ownerName: d.ownerName,
      notes: d.notes,
      closedAt: d.closedAt,
      probability: d.stage === "CLOSED_WON" ? "1.0000" : d.stage === "PROPOSAL" ? "0.7000" : d.stage === "STRATEGY" ? "0.5000" : d.stage === "QUALIFIED" ? "0.3000" : "0.1000",
    });
    dealCount++;
  }

  // ── Demo knowledge docs ──────────────────────────────────────────────────────
  await db.insert(knowledgeDocuments).values([
    {
      workspaceId,
      title: "Roth Conversion Objection Handling Guide",
      docType: "OBJECTION_GUIDE",
      status: "ACTIVE",
      summary: "Scripts and rebuttals for the top 10 Roth conversion objections from HNW clients.",
      content: "1. 'I don't want to pay taxes now' — Reframe: paying taxes at today's known rate vs. unknown future rate...",
      tags: ["roth", "objections", "tax"],
      sourceLabel: "Russell Capital Systems™ Playbook",
      versionLabel: "v2.1",
    },
    {
      workspaceId,
      title: "IUL Product Positioning — 2025",
      docType: "OFFER_POSITIONING",
      status: "ACTIVE",
      summary: "How to position IUL as tax-free retirement income vs. traditional life insurance.",
      content: "Key differentiators: floor protection, tax-free loans, living benefits...",
      tags: ["iul", "positioning", "retirement"],
      sourceLabel: "Russell Capital Systems™ Playbook",
      versionLabel: "v1.4",
    },
    {
      workspaceId,
      title: "Compliance Rules — Client Communication",
      docType: "COMPLIANCE_RULE",
      status: "ACTIVE",
      summary: "Required disclosures and prohibited language for advisor-client communications.",
      content: "Never guarantee returns. Always disclose fees. Use 'may' not 'will' for projections...",
      tags: ["compliance", "communication"],
      sourceLabel: "Internal Compliance",
      versionLabel: "v3.0",
    },
  ]);

  return { seeded: true, clientCount: insertedClients.length, dealCount };
}

// ─── Audit Log Viewer ─────────────────────────────────────────────────────────
export async function getAuditLogs(workspaceId: number, page: number = 1, pageSize: number = 20) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  const offset = (page - 1) * pageSize;
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorUserId: auditLogs.actorUserId,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(eq(auditLogs.workspaceId, workspaceId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset(offset);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(eq(auditLogs.workspaceId, workspaceId));
  return { logs, total: Number(countRow?.count ?? 0) };
}

// ─── Client Notes ─────────────────────────────────────────────────────────────

export async function getClientNotes(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clientNotes)
    .where(
      and(
        eq(clientNotes.clientId, clientId),
        eq(clientNotes.workspaceId, workspaceId)
      )
    )
    .orderBy(desc(clientNotes.createdAt))
    .limit(100);
}

export async function createClientNote(note: InsertClientNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(clientNotes).values(note);
  const insertId = (result as { insertId: number }).insertId;
  const [created] = await db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.id, insertId))
    .limit(1);
  return created;
}

export async function deleteClientNote(noteId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(clientNotes)
    .where(
      and(
        eq(clientNotes.id, noteId),
        eq(clientNotes.workspaceId, workspaceId)
      )
    );
}

// ─── Last Contact Dates ──────────────────────────────────────────────────────
export async function getLastContactDates(workspaceId: number): Promise<Record<number, Date>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db
    .select({
      clientId: clientNotes.clientId,
      lastContact: sql<Date>`MAX(${clientNotes.createdAt})`.as("lastContact"),
    })
    .from(clientNotes)
    .where(eq(clientNotes.workspaceId, workspaceId))
    .groupBy(clientNotes.clientId);
  const map: Record<number, Date> = {};
  for (const r of rows) {
    map[r.clientId] = r.lastContact;
  }
  return map;
}

// ─── Scenario Persistence (per-client) ───────────────────────────────────────
export async function getScenariosByClient(workspaceId: number, clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scenarioSnapshots)
    .where(and(eq(scenarioSnapshots.workspaceId, workspaceId), eq(scenarioSnapshots.clientId, clientId)))
    .orderBy(desc(scenarioSnapshots.createdAt));
}

export async function deleteScenario(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(scenarioSnapshots).where(and(eq(scenarioSnapshots.id, id), eq(scenarioSnapshots.workspaceId, workspaceId)));
  return { ok: true };
}

// ─── Dashboard Analytics ────────────────────────────────────────────────────
export async function getDashboardAnalytics(workspaceId: number) {
  const db = await getDb();
  if (!db) return { aumTimeline: [], strategyTrend: [], dealFunnel: [] };

  // 1. AUM timeline — aggregate client AUM by creation month (last 12 months)
  const monthExpr = sql`DATE_FORMAT(${clients.createdAt}, '%Y-%m')`;
  const aumRows = await db.select({
    month: sql<string>`${monthExpr}`.as("month"),
    totalAum: sql<number>`SUM(COALESCE(${clients.iraBalance},0) + COALESCE(${clients.rothBalance},0) + COALESCE(${clients.taxableAssets},0) + COALESCE(${clients.realEstateEquity},0) + COALESCE(${clients.lifeInsuranceCv},0))`.as("totalAum"),
    clientCount: sql<number>`COUNT(*)`.as("clientCount"),
  }).from(clients).where(eq(clients.workspaceId, workspaceId)).groupBy(monthExpr).orderBy(monthExpr);

  // Build cumulative AUM timeline
  let cumAum = 0;
  let cumClients = 0;
  const aumTimeline = aumRows.map(r => {
    cumAum += Number(r.totalAum ?? 0);
    cumClients += Number(r.clientCount ?? 0);
    return { month: r.month, aum: cumAum, clients: cumClients };
  });

  // 2. Strategy trend — count strategies by creation month
  const stratMonthExpr = sql`DATE_FORMAT(${strategies.createdAt}, '%Y-%m')`;
  const stratRows = await db.select({
    month: sql<string>`${stratMonthExpr}`.as("month"),
    count: sql<number>`COUNT(*)`.as("count"),
  }).from(strategies).where(eq(strategies.workspaceId, workspaceId)).groupBy(stratMonthExpr).orderBy(stratMonthExpr);

  let cumStrategies = 0;
  const strategyTrend = stratRows.map(r => {
    cumStrategies += Number(r.count ?? 0);
    return { month: r.month, total: cumStrategies, added: Number(r.count ?? 0) };
  });

  // 3. Deal pipeline funnel
  const stages = ["LEAD", "QUALIFIED", "STRATEGY", "PROPOSAL", "CLOSED_WON", "CLOSED_LOST"] as const;
  const funnelRows = await db.select({
    stage: deals.stage,
    count: sql<number>`COUNT(*)`.as("count"),
    value: sql<number>`COALESCE(SUM(${deals.value}), 0)`.as("value"),
  }).from(deals).where(eq(deals.workspaceId, workspaceId)).groupBy(deals.stage);

  const funnelMap = new Map(funnelRows.map(r => [r.stage, { count: Number(r.count), value: Number(r.value) }]));
  const dealFunnel = stages.map(s => ({
    stage: s,
    count: funnelMap.get(s)?.count ?? 0,
    value: funnelMap.get(s)?.value ?? 0,
  }));

  return { aumTimeline, strategyTrend, dealFunnel };
}


/* ── Role-based team access helpers ─────────────────────────────────────── */

export async function updateMemberRole(membershipId: number, workspaceId: number, role: "ADMIN" | "ADVISOR" | "ANALYST" | "VIEWER") {
  const db = await getDb();
  if (!db) return null;
  const [updated] = await db.update(memberships)
    .set({ role })
    .where(and(eq(memberships.id, membershipId), eq(memberships.workspaceId, workspaceId)));
  return updated;
}

export async function removeMember(membershipId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const [deleted] = await db.delete(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.workspaceId, workspaceId)));
  return deleted;
}

export async function getMembershipById(membershipId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  return row ?? null;
}

/* ── Client Activity Log (per-client audit trail) ───────────────────────── */
export async function logClientActivity(entry: {
  clientId: number;
  workspaceId: number;
  action: string;
  actorName?: string;
  actorUserId?: number;
  entityType?: string;
  entityId?: number;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clientActivityLog).values(entry);
  return result;
}

export async function getClientActivityLog(clientId: number, workspaceId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientActivityLog)
    .where(and(eq(clientActivityLog.clientId, clientId), eq(clientActivityLog.workspaceId, workspaceId)))
    .orderBy(desc(clientActivityLog.createdAt))
    .limit(limit);
}

/* ── Workspace-wide recent activity ──────────────────────────────────── */
export async function getWorkspaceRecentActivity(workspaceId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: clientActivityLog.id,
    clientId: clientActivityLog.clientId,
    action: clientActivityLog.action,
    actorName: clientActivityLog.actorName,
    summary: clientActivityLog.summary,
    createdAt: clientActivityLog.createdAt,
    clientName: clients.name,
  }).from(clientActivityLog)
    .leftJoin(clients, eq(clientActivityLog.clientId, clients.id))
    .where(eq(clientActivityLog.workspaceId, workspaceId))
    .orderBy(desc(clientActivityLog.createdAt))
    .limit(limit);
}

/* ── Top clients by AUM ─────────────────────────────────────────────── */
export async function getTopClientsByAUM(workspaceId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: clients.id,
    name: clients.name,
    age: clients.age,
    state: clients.state,
    iraBalance: clients.iraBalance,
    rothBalance: clients.rothBalance,
    taxableAssets: clients.taxableAssets,
    realEstateEquity: clients.realEstateEquity,
    lifeInsuranceCv: clients.lifeInsuranceCv,
    opportunityScore: clients.opportunityScore,
    createdAt: clients.createdAt,
  }).from(clients)
    .where(eq(clients.workspaceId, workspaceId))
    .orderBy(desc(sql`COALESCE(${clients.iraBalance},0) + COALESCE(${clients.rothBalance},0) + COALESCE(${clients.taxableAssets},0) + COALESCE(${clients.realEstateEquity},0) + COALESCE(${clients.lifeInsuranceCv},0)`))
    .limit(limit);
}

/* ── Asset allocation breakdown ─────────────────────────────────────── */
export async function getAssetAllocation(workspaceId: number) {
  const db = await getDb();
  if (!db) return { ira: 0, roth: 0, taxable: 0, realEstate: 0, lifeInsurance: 0 };
  const [row] = await db.select({
    ira: sql<number>`COALESCE(SUM(COALESCE(${clients.iraBalance},0)),0)`.as("ira"),
    roth: sql<number>`COALESCE(SUM(COALESCE(${clients.rothBalance},0)),0)`.as("roth"),
    taxable: sql<number>`COALESCE(SUM(COALESCE(${clients.taxableAssets},0)),0)`.as("taxable"),
    realEstate: sql<number>`COALESCE(SUM(COALESCE(${clients.realEstateEquity},0)),0)`.as("realEstate"),
    lifeInsurance: sql<number>`COALESCE(SUM(COALESCE(${clients.lifeInsuranceCv},0)),0)`.as("lifeInsurance"),
  }).from(clients).where(eq(clients.workspaceId, workspaceId));
  return {
    ira: Number(row?.ira ?? 0),
    roth: Number(row?.roth ?? 0),
    taxable: Number(row?.taxable ?? 0),
    realEstate: Number(row?.realEstate ?? 0),
    lifeInsurance: Number(row?.lifeInsurance ?? 0),
  };
}

/* ── Stale Clients (not contacted in N days) ────────────────────────────── */
export async function getStaleClients(workspaceId: number, staleDays = 30) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
  // Get all clients with their last activity date
  const allClients = await db.select({
    id: clients.id,
    name: clients.name,
    email: clients.email,
    phone: clients.phone,
    createdAt: clients.createdAt,
  }).from(clients).where(eq(clients.workspaceId, workspaceId));

  // Get last activity per client from both notes and activity log
  const lastNoteMap: Record<number, Date> = {};
  const noteRows = await db.select({
    clientId: clientNotes.clientId,
    latest: sql<string>`MAX(${clientNotes.createdAt})`.as("latest"),
  }).from(clientNotes)
    .where(eq(clientNotes.workspaceId, workspaceId))
    .groupBy(clientNotes.clientId);
  for (const r of noteRows) {
    lastNoteMap[r.clientId] = new Date(r.latest);
  }

  const lastLogMap: Record<number, Date> = {};
  const logRows = await db.select({
    clientId: clientActivityLog.clientId,
    latest: sql<string>`MAX(${clientActivityLog.createdAt})`.as("latest"),
  }).from(clientActivityLog)
    .where(eq(clientActivityLog.workspaceId, workspaceId))
    .groupBy(clientActivityLog.clientId);
  for (const r of logRows) {
    lastLogMap[r.clientId] = new Date(r.latest);
  }

  return allClients
    .map(c => {
      const noteDate = lastNoteMap[c.id];
      const logDate = lastLogMap[c.id];
      const lastContact = noteDate && logDate
        ? (noteDate > logDate ? noteDate : logDate)
        : noteDate ?? logDate ?? c.createdAt;
      const daysSinceContact = Math.floor((Date.now() - lastContact.getTime()) / (24 * 60 * 60 * 1000));
      return { ...c, lastContact, daysSinceContact };
    })
    .filter(c => c.daysSinceContact >= staleDays)
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact);
}

/* ── CSV Export ──────────────────────────────────────────────────────────── */
export async function exportClientsCsv(workspaceId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "";
  const rows = await db.select().from(clients).where(eq(clients.workspaceId, workspaceId)).orderBy(clients.name);
  const headers = ["Name","Email","Phone","Age","Income","IRA Balance","Roth Balance","Taxable Assets","Real Estate Equity","Life Insurance CV","Filing Status","Notes"];
  const csvRows = rows.map(r => [
    csvEscape(r.name),
    csvEscape(r.email ?? ""),
    csvEscape(r.phone ?? ""),
    r.age?.toString() ?? "",
    r.income?.toString() ?? "",
    r.iraBalance?.toString() ?? "",
    r.rothBalance?.toString() ?? "",
    r.taxableAssets?.toString() ?? "",
    r.realEstateEquity?.toString() ?? "",
    r.lifeInsuranceCv?.toString() ?? "",
    r.filingStatus ?? "",
    csvEscape(r.notes ?? ""),
  ].join(","));
  return [headers.join(","), ...csvRows].join("\n");
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes("\"") || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

// ─── Client Tags ─────────────────────────────────────────────────────────────
export async function createTag(workspaceId: number, name: string, color: string = "#4f8cff") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [existing] = await db.select().from(clientTags).where(and(eq(clientTags.workspaceId, workspaceId), eq(clientTags.name, name))).limit(1);
  if (existing) return existing;
  const [result] = await db.insert(clientTags).values({ workspaceId, name, color }).$returningId();
  return { id: result.id, workspaceId, name, color, createdAt: new Date() };
}

export async function listTags(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientTags).where(eq(clientTags.workspaceId, workspaceId)).orderBy(clientTags.name);
}

export async function deleteTag(tagId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientTagAssignments).where(eq(clientTagAssignments.tagId, tagId));
  await db.delete(clientTags).where(and(eq(clientTags.id, tagId), eq(clientTags.workspaceId, workspaceId)));
}

export async function assignTag(clientId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [existing] = await db.select().from(clientTagAssignments).where(and(eq(clientTagAssignments.clientId, clientId), eq(clientTagAssignments.tagId, tagId))).limit(1);
  if (existing) return existing;
  const [result] = await db.insert(clientTagAssignments).values({ clientId, tagId }).$returningId();
  return { id: result.id, clientId, tagId, createdAt: new Date() };
}

export async function removeTagAssignment(clientId: number, tagId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientTagAssignments).where(and(eq(clientTagAssignments.clientId, clientId), eq(clientTagAssignments.tagId, tagId)));
}

export async function getClientTagIds(clientId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ tagId: clientTagAssignments.tagId }).from(clientTagAssignments).where(eq(clientTagAssignments.clientId, clientId));
  return rows.map(r => r.tagId);
}

export async function getClientsByTag(tagId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ clientId: clientTagAssignments.clientId }).from(clientTagAssignments)
    .innerJoin(clients, eq(clients.id, clientTagAssignments.clientId))
    .where(and(eq(clientTagAssignments.tagId, tagId), eq(clients.workspaceId, workspaceId)));
  return rows.map(r => r.clientId);
}

export async function getBulkClientTags(clientIds: number[]): Promise<Record<number, { tagId: number; tagName: string; tagColor: string }[]>> {
  const db = await getDb();
  if (!db || clientIds.length === 0) return {};
  const rows = await db.select({
    clientId: clientTagAssignments.clientId,
    tagId: clientTagAssignments.tagId,
    tagName: clientTags.name,
    tagColor: clientTags.color,
  }).from(clientTagAssignments)
    .innerJoin(clientTags, eq(clientTags.id, clientTagAssignments.tagId))
    .where(inArray(clientTagAssignments.clientId, clientIds));
  const result: Record<number, { tagId: number; tagName: string; tagColor: string }[]> = {};
  for (const row of rows) {
    if (!result[row.clientId]) result[row.clientId] = [];
    result[row.clientId].push({ tagId: row.tagId, tagName: row.tagName, tagColor: row.tagColor });
  }
  return result;
}

// ─── Advisor Goals ───────────────────────────────────────────────────────────
export async function createGoal(data: { workspaceId: number; goalType: "AUM_TARGET" | "DEALS_CLOSED" | "NEW_CLIENTS" | "REVENUE"; targetValue: string; period: string; startDate: Date; endDate: Date }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(advisorGoals).values(data).$returningId();
  return { id: result.id, ...data, createdAt: new Date(), updatedAt: new Date() };
}

export async function listGoals(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(advisorGoals).where(eq(advisorGoals.workspaceId, workspaceId)).orderBy(desc(advisorGoals.createdAt));
}

export async function updateGoal(goalId: number, workspaceId: number, data: { targetValue?: string; period?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return;
  await db.update(advisorGoals).set(data).where(and(eq(advisorGoals.id, goalId), eq(advisorGoals.workspaceId, workspaceId)));
}

export async function deleteGoal(goalId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(advisorGoals).where(and(eq(advisorGoals.id, goalId), eq(advisorGoals.workspaceId, workspaceId)));
}

export async function getGoalProgress(workspaceId: number): Promise<{ goalId: number; goalType: string; targetValue: number; currentValue: number; period: string; startDate: Date; endDate: Date }[]> {
  const db = await getDb();
  if (!db) return [];
  const goals = await db.select().from(advisorGoals).where(eq(advisorGoals.workspaceId, workspaceId));
  const results: { goalId: number; goalType: string; targetValue: number; currentValue: number; period: string; startDate: Date; endDate: Date }[] = [];

  for (const goal of goals) {
    let currentValue = 0;
    const start = goal.startDate;
    const end = goal.endDate;

    if (goal.goalType === "AUM_TARGET") {
      const [row] = await db.select({ total: sql<string>`COALESCE(SUM(COALESCE(${clients.iraBalance},0) + COALESCE(${clients.rothBalance},0) + COALESCE(${clients.taxableAssets},0) + COALESCE(${clients.realEstateEquity},0) + COALESCE(${clients.lifeInsuranceCv},0)),0)` }).from(clients).where(eq(clients.workspaceId, workspaceId));
      currentValue = parseFloat(row?.total ?? "0");
    } else if (goal.goalType === "DEALS_CLOSED") {
      const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(deals).where(and(eq(deals.workspaceId, workspaceId), eq(deals.stage, "CLOSED_WON"), gte(deals.closedAt, start), lte(deals.closedAt, end)));
      currentValue = row?.count ?? 0;
    } else if (goal.goalType === "NEW_CLIENTS") {
      const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(clients).where(and(eq(clients.workspaceId, workspaceId), gte(clients.createdAt, start), lte(clients.createdAt, end)));
      currentValue = row?.count ?? 0;
    } else if (goal.goalType === "REVENUE") {
      const [row] = await db.select({ total: sql<string>`COALESCE(SUM(${deals.value}),0)` }).from(deals).where(and(eq(deals.workspaceId, workspaceId), eq(deals.stage, "CLOSED_WON"), gte(deals.closedAt, start), lte(deals.closedAt, end)));
      currentValue = parseFloat(row?.total ?? "0");
    }

    results.push({
      goalId: goal.id,
      goalType: goal.goalType,
      targetValue: parseFloat(goal.targetValue),
      currentValue,
      period: goal.period,
      startDate: goal.startDate,
      endDate: goal.endDate,
    });
  }
  return results;
}

// ─── Webhook Endpoints ───────────────────────────────────────────────────────
export async function createWebhook(data: { workspaceId: number; url: string; label?: string; events: string[]; secret?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const secret = data.secret || randomBytes(32).toString("hex");
  const [result] = await db.insert(webhookEndpoints).values({ ...data, secret, active: true }).$returningId();
  return { id: result.id, ...data, secret, active: true, failCount: 0, createdAt: new Date(), updatedAt: new Date() };
}

export async function listWebhooks(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhookEndpoints).where(eq(webhookEndpoints.workspaceId, workspaceId)).orderBy(desc(webhookEndpoints.createdAt));
}

export async function updateWebhook(webhookId: number, workspaceId: number, data: { url?: string; label?: string; events?: string[]; active?: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.update(webhookEndpoints).set(data).where(and(eq(webhookEndpoints.id, webhookId), eq(webhookEndpoints.workspaceId, workspaceId)));
}

export async function deleteWebhook(webhookId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(webhookEndpoints).where(and(eq(webhookEndpoints.id, webhookId), eq(webhookEndpoints.workspaceId, workspaceId)));
}

export async function getActiveWebhooksForEvent(workspaceId: number, eventType: string) {
  const db = await getDb();
  if (!db) return [];
  const hooks = await db.select().from(webhookEndpoints).where(and(eq(webhookEndpoints.workspaceId, workspaceId), eq(webhookEndpoints.active, true)));
  return hooks.filter(h => (h.events as string[]).includes(eventType) || (h.events as string[]).includes("*"));
}

export async function markWebhookFailed(webhookId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(webhookEndpoints).set({ failCount: sql`${webhookEndpoints.failCount} + 1` }).where(eq(webhookEndpoints.id, webhookId));
}

export async function markWebhookTriggered(webhookId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(webhookEndpoints).set({ lastTriggeredAt: new Date(), failCount: 0 }).where(eq(webhookEndpoints.id, webhookId));
}


// ─── Client Document Vault ──────────────────────────────────────────────────

export async function uploadClientDocument(data: {
  clientId: number;
  workspaceId: number;
  name: string;
  fileKey: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
  category?: string;
  uploadedBy?: number;
  uploadedByName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(clientDocuments).values({
    clientId: data.clientId,
    workspaceId: data.workspaceId,
    name: data.name,
    fileKey: data.fileKey,
    url: data.url,
    mimeType: data.mimeType ?? null,
    sizeBytes: data.sizeBytes ?? null,
    category: (data.category as any) ?? "OTHER",
    uploadedBy: data.uploadedBy ?? null,
    uploadedByName: data.uploadedByName ?? null,
  }).$returningId();
  return { id: result.id, ...data };
}

export async function listClientDocuments(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientDocuments)
    .where(and(eq(clientDocuments.clientId, clientId), eq(clientDocuments.workspaceId, workspaceId)))
    .orderBy(desc(clientDocuments.createdAt));
}

export async function deleteClientDocument(docId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(clientDocuments).where(and(eq(clientDocuments.id, docId), eq(clientDocuments.workspaceId, workspaceId)));
  return { deleted: true };
}

export async function getDocumentById(docId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const [doc] = await db.select().from(clientDocuments)
    .where(and(eq(clientDocuments.id, docId), eq(clientDocuments.workspaceId, workspaceId)))
    .limit(1);
  return doc ?? null;
}

// ─── Report Schedules ───────────────────────────────────────────────────────

export async function upsertReportSchedule(data: {
  clientId: number;
  workspaceId: number;
  frequency?: string;
  recipientEmail?: string;
  active: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if schedule already exists for this client
  const [existing] = await db.select().from(reportSchedules)
    .where(and(eq(reportSchedules.clientId, data.clientId), eq(reportSchedules.workspaceId, data.workspaceId)))
    .limit(1);
  if (existing) {
    await db.update(reportSchedules).set({
      frequency: (data.frequency as any) ?? existing.frequency,
      recipientEmail: data.recipientEmail ?? existing.recipientEmail,
      active: data.active,
    }).where(eq(reportSchedules.id, existing.id));
    return { id: existing.id, updated: true };
  }
  // Calculate next send date (1st of next month)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [result] = await db.insert(reportSchedules).values({
    clientId: data.clientId,
    workspaceId: data.workspaceId,
    frequency: (data.frequency as any) ?? "MONTHLY",
    recipientEmail: data.recipientEmail ?? null,
    active: data.active,
    nextSendAt: nextMonth,
  }).$returningId();
  return { id: result.id, updated: false };
}

export async function getReportSchedule(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const [schedule] = await db.select().from(reportSchedules)
    .where(and(eq(reportSchedules.clientId, clientId), eq(reportSchedules.workspaceId, workspaceId)))
    .limit(1);
  return schedule ?? null;
}

export async function getDueReportSchedules() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(reportSchedules)
    .where(and(
      eq(reportSchedules.active, true),
      lte(reportSchedules.nextSendAt, now)
    ));
}

export async function markReportSent(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  await db.update(reportSchedules).set({
    lastSentAt: now,
    nextSendAt: nextMonth,
  }).where(eq(reportSchedules.id, scheduleId));
}

// ─── Slack Integrations ─────────────────────────────────────────────────────

export async function upsertSlackIntegration(data: {
  workspaceId: number;
  teamId?: string;
  teamName?: string;
  botToken?: string;
  channelId?: string;
  channelName?: string;
  webhookUrl?: string;
  active?: boolean;
  configJson?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [existing] = await db.select().from(slackIntegrations)
    .where(eq(slackIntegrations.workspaceId, data.workspaceId))
    .limit(1);
  if (existing) {
    await db.update(slackIntegrations).set({
      teamId: data.teamId ?? existing.teamId,
      teamName: data.teamName ?? existing.teamName,
      botToken: data.botToken ?? existing.botToken,
      channelId: data.channelId ?? existing.channelId,
      channelName: data.channelName ?? existing.channelName,
      webhookUrl: data.webhookUrl ?? existing.webhookUrl,
      active: data.active ?? existing.active,
      configJson: data.configJson ?? existing.configJson,
    }).where(eq(slackIntegrations.id, existing.id));
    return { id: existing.id, updated: true };
  }
  const [result] = await db.insert(slackIntegrations).values({
    workspaceId: data.workspaceId,
    teamId: data.teamId ?? null,
    teamName: data.teamName ?? null,
    botToken: data.botToken ?? null,
    channelId: data.channelId ?? null,
    channelName: data.channelName ?? null,
    webhookUrl: data.webhookUrl ?? null,
    active: data.active ?? true,
    configJson: data.configJson ?? null,
  }).$returningId();
  return { id: result.id, updated: false };
}

export async function getSlackIntegration(workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const [integration] = await db.select().from(slackIntegrations)
    .where(eq(slackIntegrations.workspaceId, workspaceId))
    .limit(1);
  return integration ?? null;
}

export async function deleteSlackIntegration(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(slackIntegrations).where(eq(slackIntegrations.workspaceId, workspaceId));
  return { deleted: true };
}

// ─── Slack Command Helpers ──────────────────────────────────────────────────

export async function searchClientsByName(workspaceId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients)
    .where(and(eq(clients.workspaceId, workspaceId), like(clients.name, `%${query}%`)))
    .limit(5);
}

export async function getPipelineSummary(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    stage: deals.stage,
    count: count(),
    totalValue: sum(deals.value),
  }).from(deals)
    .where(eq(deals.workspaceId, workspaceId))
    .groupBy(deals.stage);
}

export async function getWorkspaceStats(workspaceId: number) {
  const db = await getDb();
  if (!db) return { clientCount: 0, dealCount: 0, strategyCount: 0 };
  const [clientResult] = await db.select({ c: count() }).from(clients).where(eq(clients.workspaceId, workspaceId));
  const [dealResult] = await db.select({ c: count() }).from(deals).where(eq(deals.workspaceId, workspaceId));
  const [stratResult] = await db.select({ c: count() }).from(strategies).where(eq(strategies.workspaceId, workspaceId));
  return {
    clientCount: clientResult?.c ?? 0,
    dealCount: dealResult?.c ?? 0,
    strategyCount: stratResult?.c ?? 0,
  };
}


// ─── Compliance Export ───────────────────────────────────────────────────────
export async function getFilteredActivityLog(params: {
  workspaceId: number;
  startDate?: Date;
  endDate?: Date;
  actionType?: string;
  clientId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  const conditions = [eq(clientActivityLog.workspaceId, params.workspaceId)];
  if (params.startDate) conditions.push(gte(clientActivityLog.createdAt, params.startDate));
  if (params.endDate) conditions.push(lte(clientActivityLog.createdAt, params.endDate));
  if (params.actionType) conditions.push(eq(clientActivityLog.action, params.actionType));
  if (params.clientId) conditions.push(eq(clientActivityLog.clientId, params.clientId));
  const where = and(...conditions);
  const [totalResult] = await db.select({ c: count() }).from(clientActivityLog).where(where);
  const logs = await db.select().from(clientActivityLog).where(where)
    .orderBy(desc(clientActivityLog.createdAt))
    .limit(params.limit ?? 100)
    .offset(params.offset ?? 0);
  return { logs, total: totalResult?.c ?? 0 };
}

export async function getActivityLogForExport(params: {
  workspaceId: number;
  startDate?: Date;
  endDate?: Date;
  actionType?: string;
  clientId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(clientActivityLog.workspaceId, params.workspaceId)];
  if (params.startDate) conditions.push(gte(clientActivityLog.createdAt, params.startDate));
  if (params.endDate) conditions.push(lte(clientActivityLog.createdAt, params.endDate));
  if (params.actionType) conditions.push(eq(clientActivityLog.action, params.actionType));
  if (params.clientId) conditions.push(eq(clientActivityLog.clientId, params.clientId));
  const where = and(...conditions);
  const logs = await db.select({
    id: clientActivityLog.id,
    clientId: clientActivityLog.clientId,
    action: clientActivityLog.action,
    actorName: clientActivityLog.actorName,
    summary: clientActivityLog.summary,
    entityType: clientActivityLog.entityType,
    entityId: clientActivityLog.entityId,
    createdAt: clientActivityLog.createdAt,
  }).from(clientActivityLog).where(where).orderBy(desc(clientActivityLog.createdAt));
  return logs;
}

// ─── Client Portal Tokens ────────────────────────────────────────────────────
export async function createPortalToken(params: {
  clientId: number;
  workspaceId: number;
  createdByUserId: number;
  label?: string;
  expiresInDays?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (params.expiresInDays ?? 30));
  const [result] = await db.insert(clientPortalTokens).values({
    clientId: params.clientId,
    workspaceId: params.workspaceId,
    token,
    label: params.label ?? "Portal Link",
    createdByUserId: params.createdByUserId,
    expiresAt,
  }).$returningId();
  return { id: result.id, token, expiresAt };
}

export async function getPortalTokensByClient(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientPortalTokens)
    .where(and(eq(clientPortalTokens.clientId, clientId), eq(clientPortalTokens.workspaceId, workspaceId), eq(clientPortalTokens.active, true)))
    .orderBy(desc(clientPortalTokens.createdAt));
}

export async function validatePortalToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(clientPortalTokens)
    .where(and(eq(clientPortalTokens.token, token), eq(clientPortalTokens.active, true)));
  if (!row) return null;
  if (new Date() > row.expiresAt) return null;
  const client = await getClientById(row.clientId, row.workspaceId);
  if (!client) return null;
  // Update access stats
  await db.update(clientPortalTokens)
    .set({ lastAccessedAt: new Date(), accessCount: sql`${clientPortalTokens.accessCount} + 1` })
    .where(eq(clientPortalTokens.id, row.id));
  return row;
}

export async function portalTokenCanAccessStorageKey(token: string, key: string) {
  if (!token || token.length > 256 || !key) return false;
  const db = await getDb();
  if (!db) return false;
  const [row] = await db.select({ id: clientDocuments.id })
    .from(clientPortalTokens)
    .innerJoin(clients, and(eq(clients.id, clientPortalTokens.clientId), eq(clients.workspaceId, clientPortalTokens.workspaceId)))
    .innerJoin(clientDocuments, and(eq(clientDocuments.clientId, clientPortalTokens.clientId), eq(clientDocuments.workspaceId, clientPortalTokens.workspaceId), eq(clientDocuments.fileKey, key)))
    .where(and(eq(clientPortalTokens.token, token), eq(clientPortalTokens.active, true), gte(clientPortalTokens.expiresAt, new Date())))
    .limit(1);
  return Boolean(row);
}

export async function revokePortalToken(tokenId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) return;
  const conditions = [eq(clientPortalTokens.id, tokenId)];
  if (workspaceId !== undefined) conditions.push(eq(clientPortalTokens.workspaceId, workspaceId));
  await db.update(clientPortalTokens).set({ active: false }).where(and(...conditions));
}

export async function getClientPortalData(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const [client] = await db.select().from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId)));
  if (!client) return null;
  const docs = await db.select().from(clientDocuments)
    .where(and(eq(clientDocuments.clientId, clientId), eq(clientDocuments.workspaceId, workspaceId)))
    .orderBy(desc(clientDocuments.createdAt))
    .limit(20);
  const strats = await db.select().from(strategies)
    .where(and(eq(strategies.clientId, clientId), eq(strategies.workspaceId, workspaceId)))
    .orderBy(desc(strategies.createdAt))
    .limit(10);
  const notes = await db.select().from(clientNotes)
    .where(and(eq(clientNotes.clientId, clientId), eq(clientNotes.workspaceId, workspaceId)))
    .orderBy(desc(clientNotes.createdAt))
    .limit(20);
  return { client, documents: docs, strategies: strats, notes };
}

// ─── Allocation Targets & Rebalance Alerts ──────────────────────────────────
export async function setAllocationTargets(clientId: number, workspaceId: number, targets: { assetClass: string; targetPct: string; currentPct?: string }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete existing targets for this client
  await db.delete(allocationTargets).where(and(eq(allocationTargets.clientId, clientId), eq(allocationTargets.workspaceId, workspaceId)));
  if (targets.length === 0) return [];
  const values = targets.map(t => ({
    clientId,
    workspaceId,
    assetClass: t.assetClass,
    targetPct: t.targetPct,
    currentPct: t.currentPct ?? null,
  }));
  await db.insert(allocationTargets).values(values);
  return db.select().from(allocationTargets)
    .where(and(eq(allocationTargets.clientId, clientId), eq(allocationTargets.workspaceId, workspaceId)));
}

export async function getAllocationTargets(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(allocationTargets)
    .where(and(eq(allocationTargets.clientId, clientId), eq(allocationTargets.workspaceId, workspaceId)));
}

export async function checkPortfolioDrift(clientId: number, workspaceId: number, threshold: number = 5) {
  const targets = await getAllocationTargets(clientId, workspaceId);
  const drifts: { assetClass: string; targetPct: number; currentPct: number; driftPct: number }[] = [];
  for (const t of targets) {
    const target = parseFloat(String(t.targetPct));
    const current = parseFloat(String(t.currentPct ?? "0"));
    const drift = Math.abs(current - target);
    if (drift >= threshold) {
      drifts.push({ assetClass: t.assetClass, targetPct: target, currentPct: current, driftPct: drift });
    }
  }
  return drifts;
}

export async function createRebalanceAlert(params: {
  clientId: number;
  workspaceId: number;
  assetClass: string;
  targetPct: string;
  currentPct: string;
  driftPct: string;
  threshold: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(rebalanceAlerts).values(params).$returningId();
  return { id: result.id };
}

export async function getRebalanceAlerts(workspaceId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(rebalanceAlerts.workspaceId, workspaceId)];
  if (status) conditions.push(eq(rebalanceAlerts.status, status as any));
  return db.select().from(rebalanceAlerts)
    .where(and(...conditions))
    .orderBy(desc(rebalanceAlerts.createdAt))
    .limit(200);
}

export async function acknowledgeRebalanceAlert(alertId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) return;
  const conditions = [eq(rebalanceAlerts.id, alertId)];
  if (workspaceId !== undefined) conditions.push(eq(rebalanceAlerts.workspaceId, workspaceId));
  await db.update(rebalanceAlerts).set({ status: "ACKNOWLEDGED" }).where(and(...conditions));
}

export async function resolveRebalanceAlert(alertId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) return;
  const conditions = [eq(rebalanceAlerts.id, alertId)];
  if (workspaceId !== undefined) conditions.push(eq(rebalanceAlerts.workspaceId, workspaceId));
  await db.update(rebalanceAlerts).set({ status: "RESOLVED", resolvedAt: new Date() }).where(and(...conditions));
}

export async function getAllClientsWithTargets(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  const targets = await db.select().from(allocationTargets)
    .where(eq(allocationTargets.workspaceId, workspaceId));
  // Group by clientId
  const byClient = new Map<number, typeof targets>();
  for (const t of targets) {
    const arr = byClient.get(t.clientId) ?? [];
    arr.push(t);
    byClient.set(t.clientId, arr);
  }
  return Array.from(byClient.entries()).map(([clientId, tgts]) => ({ clientId, targets: tgts }));
}

export async function updateAllocationCurrentPct(clientId: number, workspaceId: number, updates: { assetClass: string; currentPct: string }[]) {
  const db = await getDb();
  if (!db) return;
  for (const u of updates) {
    await db.update(allocationTargets)
      .set({ currentPct: u.currentPct })
      .where(and(
        eq(allocationTargets.clientId, clientId),
        eq(allocationTargets.workspaceId, workspaceId),
        eq(allocationTargets.assetClass, u.assetClass),
      ));
  }
}


// ─── Bulk Allocation CSV Update ──────────────────────────────────────────────
export async function bulkUpdateAllocations(
  workspaceId: number,
  rows: { clientId: number; assetClass: string; currentPct: string }[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let updated = 0;
  for (const row of rows) {
    const result = await db.update(allocationTargets)
      .set({ currentPct: row.currentPct })
      .where(and(
        eq(allocationTargets.clientId, row.clientId),
        eq(allocationTargets.workspaceId, workspaceId),
        eq(allocationTargets.assetClass, row.assetClass),
      ));
    if ((result as any)[0]?.affectedRows > 0) updated++;
  }
  return { updated, total: rows.length };
}

// ─── Workspace Branding ──────────────────────────────────────────────────────
export async function getWorkspaceBranding(workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    id: workspaces.id,
    name: workspaces.name,
    logoUrl: workspaces.logoUrl,
    primaryColor: workspaces.primaryColor,
    accentColor: workspaces.accentColor,
  }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  return result[0] ?? null;
}

export async function updateWorkspaceBranding(workspaceId: number, branding: {
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(workspaces).set(branding).where(eq(workspaces.id, workspaceId));
}

// ─── In-App Notifications ────────────────────────────────────────────────────

export async function createInAppNotification(params: {
  workspaceId: number;
  userId?: number | null;
  type: string;
  title: string;
  message: string;
  link?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(inAppNotifications).values({
    workspaceId: params.workspaceId,
    userId: params.userId ?? null,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  }).$returningId();
  return { id: result.id };
}

export async function getInAppNotifications(workspaceId: number, userId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(inAppNotifications.workspaceId, workspaceId)];
  // Show notifications targeted to user OR broadcast (userId=null)
  return db.select().from(inAppNotifications)
    .where(and(...conditions))
    .orderBy(desc(inAppNotifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(workspaceId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ cnt: count() }).from(inAppNotifications)
    .where(and(
      eq(inAppNotifications.workspaceId, workspaceId),
      eq(inAppNotifications.read, false),
    ));
  return result[0]?.cnt ?? 0;
}

export async function markNotificationRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(inAppNotifications).set({ read: true }).where(eq(inAppNotifications.id, notificationId));
}

export async function markAllNotificationsRead(workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(inAppNotifications).set({ read: true })
    .where(and(eq(inAppNotifications.workspaceId, workspaceId), eq(inAppNotifications.read, false)));
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── MULTI-WORKSPACE SWITCHING ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export async function getUserWorkspaces(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    membershipId: memberships.id,
    role: memberships.role,
    status: memberships.status,
    workspaceId: workspaces.id,
    workspaceName: workspaces.name,
    workspaceSlug: workspaces.slug,
    logoUrl: workspaces.logoUrl,
  })
    .from(memberships)
    .innerJoin(workspaces, eq(memberships.workspaceId, workspaces.id))
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")));
  return rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── CLIENT MEETINGS ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export async function createMeeting(data: {
  clientId: number; workspaceId: number; title: string; description?: string;
  scheduledAt: Date; durationMin?: number; location?: string;
  meetingType?: "IN_PERSON" | "VIDEO" | "PHONE" | "OTHER";
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string; createdBy?: number; createdByName?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clientMeetings).values({
    clientId: data.clientId,
    workspaceId: data.workspaceId,
    title: data.title,
    description: data.description ?? null,
    scheduledAt: data.scheduledAt,
    durationMin: data.durationMin ?? 60,
    location: data.location ?? null,
    meetingType: data.meetingType ?? "VIDEO",
    status: data.status ?? "SCHEDULED",
    notes: data.notes ?? null,
    createdBy: data.createdBy ?? null,
    createdByName: data.createdByName ?? null,
  });
  return { id: result.insertId };
}

export async function getMeetingsByClient(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientMeetings)
    .where(and(eq(clientMeetings.clientId, clientId), eq(clientMeetings.workspaceId, workspaceId)))
    .orderBy(desc(clientMeetings.scheduledAt));
}

export async function getMeetingsByWorkspace(workspaceId: number, opts?: { upcoming?: boolean; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(clientMeetings.workspaceId, workspaceId)];
  if (opts?.upcoming) {
    conditions.push(gte(clientMeetings.scheduledAt, new Date()));
    conditions.push(eq(clientMeetings.status, "SCHEDULED"));
  }
  return db.select().from(clientMeetings)
    .where(and(...conditions))
    .orderBy(clientMeetings.scheduledAt)
    .limit(opts?.limit ?? 200);
}

export async function updateMeeting(id: number, workspaceId: number, data: Partial<{
  title: string; description: string; scheduledAt: Date; durationMin: number;
  location: string; meetingType: "IN_PERSON" | "VIDEO" | "PHONE" | "OTHER";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"; notes: string;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientMeetings).set(data)
    .where(and(eq(clientMeetings.id, id), eq(clientMeetings.workspaceId, workspaceId)));
}

export async function deleteMeeting(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientMeetings)
    .where(and(eq(clientMeetings.id, id), eq(clientMeetings.workspaceId, workspaceId)));
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD WIDGET CONFIGS ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export async function getWidgetConfig(userId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dashboardWidgetConfigs)
    .where(and(eq(dashboardWidgetConfigs.userId, userId), eq(dashboardWidgetConfigs.workspaceId, workspaceId)))
    .orderBy(dashboardWidgetConfigs.position);
}

export async function saveWidgetConfig(userId: number, workspaceId: number, widgets: { widgetId: string; position: number; visible: boolean; size: "SMALL" | "MEDIUM" | "LARGE" | "FULL" }[]) {
  const db = await getDb();
  if (!db) return;
  // Delete existing config and insert new
  await db.delete(dashboardWidgetConfigs)
    .where(and(eq(dashboardWidgetConfigs.userId, userId), eq(dashboardWidgetConfigs.workspaceId, workspaceId)));
  if (widgets.length > 0) {
    await db.insert(dashboardWidgetConfigs).values(
      widgets.map(w => ({
        userId,
        workspaceId,
        widgetId: w.widgetId,
        position: w.position,
        visible: w.visible,
        size: w.size,
      }))
    );
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── MEETING REMINDERS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get meetings scheduled within a time window that have not yet received reminders.
 * Default: meetings 23–25 hours from now (to allow hourly cron with overlap).
 */
export async function getUpcomingMeetingsForReminder(opts?: { windowStartHours?: number; windowEndHours?: number }) {
  const db = await getDb();
  if (!db) return [];
  const startHours = opts?.windowStartHours ?? 23;
  const endHours = opts?.windowEndHours ?? 25;
  const now = new Date();
  const windowStart = new Date(now.getTime() + startHours * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + endHours * 60 * 60 * 1000);

  return db.select({
    meetingId: clientMeetings.id,
    clientId: clientMeetings.clientId,
    workspaceId: clientMeetings.workspaceId,
    title: clientMeetings.title,
    scheduledAt: clientMeetings.scheduledAt,
    durationMin: clientMeetings.durationMin,
    location: clientMeetings.location,
    meetingType: clientMeetings.meetingType,
    createdBy: clientMeetings.createdBy,
    createdByName: clientMeetings.createdByName,
    clientName: clients.name,
    clientEmail: clients.email,
  })
    .from(clientMeetings)
    .innerJoin(clients, eq(clientMeetings.clientId, clients.id))
    .where(and(
      eq(clientMeetings.status, "SCHEDULED"),
      gte(clientMeetings.scheduledAt, windowStart),
      lte(clientMeetings.scheduledAt, windowEnd),
      sql`${clientMeetings.reminderSentAt} IS NULL`,
    ))
    .orderBy(clientMeetings.scheduledAt);
}

/**
 * Mark a meeting as having its reminder sent.
 */
export async function markMeetingReminderSent(meetingId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientMeetings)
    .set({ reminderSentAt: new Date() })
    .where(eq(clientMeetings.id, meetingId));
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── CLIENT RISK SCORING ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export interface ClientRiskScore {
  clientId: number;
  clientName: string;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: {
    aumConcentration: number;
    filingComplexity: number;
    strategyDiversity: number;
    engagementRecency: number;
    portfolioSize: number;
  };
}

/**
 * Compute risk scores for all clients in a workspace.
 * Score 0–100 where higher = more risk.
 * Factors:
 *   - AUM concentration: high AUM in single asset class = more risk
 *   - Filing complexity: joint/hoh = more complex = slightly higher risk
 *   - Strategy diversity: fewer strategies = higher risk (less planning)
 *   - Engagement recency: longer since last contact = higher risk
 *   - Portfolio size: larger portfolios = higher operational risk
 */
export async function computeClientRiskScores(workspaceId: number): Promise<ClientRiskScore[]> {
  const db = await getDb();
  if (!db) return [];

  const allClients = await db.select().from(clients).where(eq(clients.workspaceId, workspaceId));
  if (allClients.length === 0) return [];

  // Get strategy counts per client
  const stratCounts = await db.select({
    clientId: strategies.clientId,
    count: sql<number>`COUNT(*)`.as("count"),
  }).from(strategies).where(eq(strategies.workspaceId, workspaceId)).groupBy(strategies.clientId);
  const stratMap = new Map(stratCounts.map(s => [s.clientId, Number(s.count)]));

  // Get last contact dates
  const lastContactMap = await getLastContactDates(workspaceId);

  return allClients.map(c => {
    const ira = Number(c.iraBalance ?? 0);
    const roth = Number(c.rothBalance ?? 0);
    const taxable = Number(c.taxableAssets ?? 0);
    const realEstate = Number(c.realEstateEquity ?? 0);
    const insurance = Number(c.lifeInsuranceCv ?? 0);
    const totalAum = ira + roth + taxable + realEstate + insurance;

    // 1. AUM concentration (0–25): how much is in a single bucket
    const buckets = [ira, roth, taxable, realEstate, insurance].filter(b => b > 0);
    const maxBucket = Math.max(...buckets, 0);
    const aumConcentration = totalAum > 0
      ? Math.round((maxBucket / totalAum) * 25)
      : 0;

    // 2. Filing complexity (0–10)
    const filingComplexity = c.filingStatus === "joint" ? 8 : c.filingStatus === "hoh" ? 6 : 3;

    // 3. Strategy diversity (0–25): fewer strategies = more risk
    const stratCount = stratMap.get(c.id) ?? 0;
    const strategyDiversity = stratCount >= 3 ? 5 : stratCount === 2 ? 10 : stratCount === 1 ? 18 : 25;

    // 4. Engagement recency (0–25): days since last contact
    const lastContact = lastContactMap[c.id];
    const daysSince = lastContact
      ? Math.floor((Date.now() - new Date(lastContact).getTime()) / (24 * 60 * 60 * 1000))
      : 90; // default to 90 days if never contacted
    const engagementRecency = Math.min(25, Math.round((daysSince / 90) * 25));

    // 5. Portfolio size (0–15): larger = more operational risk
    const portfolioSize = Math.min(15, Math.round((totalAum / 5_000_000) * 15));

    const score = Math.min(100, aumConcentration + filingComplexity + strategyDiversity + engagementRecency + portfolioSize);
    const level: ClientRiskScore["level"] =
      score >= 75 ? "CRITICAL" :
      score >= 55 ? "HIGH" :
      score >= 35 ? "MEDIUM" : "LOW";

    return {
      clientId: c.id,
      clientName: c.name,
      score,
      level,
      factors: { aumConcentration, filingComplexity, strategyDiversity, engagementRecency, portfolioSize },
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── ADVISOR PERFORMANCE LEADERBOARD (ENHANCED) ───────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export interface AdvisorPerformanceEntry {
  userId: number;
  name: string;
  role: string;
  email: string | null;
  aumManaged: number;
  dealsWon: number;
  closedValue: number;
  pipelineCount: number;
  pipelineValue: number;
  meetingsHeld: number;
  clientCount: number;
  score: number;
  rank: number;
}

/**
 * Get advisor performance metrics for a workspace.
 * Aggregates AUM managed, deals closed, pipeline activity, meetings, and client count per advisor.
 */
export async function getAdvisorPerformanceMetrics(workspaceId: number): Promise<AdvisorPerformanceEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const members = await getMemberships(workspaceId);
  const allDeals = await db.select().from(deals).where(eq(deals.workspaceId, workspaceId));
  const allClients = await db.select().from(clients).where(eq(clients.workspaceId, workspaceId));
  const allMeetings = await db.select().from(clientMeetings).where(eq(clientMeetings.workspaceId, workspaceId));

  // Map deals by owner name
  const entries: AdvisorPerformanceEntry[] = members.map(m => {
    const name = [m.userFirstName, m.userLastName].filter(Boolean).join(" ") || m.userName || m.userEmail || "Advisor";
    const possibleNames = new Set([name, m.userName, m.userEmail].filter(Boolean) as string[]);

    // Deals attributed to this advisor
    const memberDeals = allDeals.filter(d => d.ownerName && possibleNames.has(d.ownerName));
    const closedDeals = memberDeals.filter(d => d.stage === "CLOSED_WON");
    const closedValue = closedDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
    const pipelineDeals = memberDeals.filter(d => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage));
    const pipelineValue = pipelineDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);

    // Meetings created by this advisor
    const memberMeetings = allMeetings.filter(mt => mt.createdBy === m.userId);

    // Clients: count unique clients from deals
    const clientIds = new Set(memberDeals.map(d => d.clientId));

    // AUM managed: sum of AUM for clients in their deals
    const aumManaged = allClients
      .filter(c => clientIds.has(c.id))
      .reduce((s, c) => s + Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0) + Number(c.lifeInsuranceCv ?? 0), 0);

    // Composite score: weighted formula
    const score = Math.round(
      (closedValue / 10000) * 3 +
      closedDeals.length * 15 +
      pipelineDeals.length * 5 +
      memberMeetings.length * 2 +
      (aumManaged / 100000)
    );

    return {
      userId: m.userId,
      name,
      role: m.role,
      email: m.userEmail ?? null,
      aumManaged,
      dealsWon: closedDeals.length,
      closedValue,
      pipelineCount: pipelineDeals.length,
      pipelineValue,
      meetingsHeld: memberMeetings.length,
      clientCount: clientIds.size,
      score,
      rank: 0,
    };
  });

  // Sort by score descending and assign ranks
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries;
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── MEETING REMINDER PREFERENCES ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const MEETING_TYPES = ["IN_PERSON", "VIDEO", "PHONE", "OTHER"] as const;

export async function getReminderPrefs(workspaceId: number, userId: number) {
  const db = await getDb();
  if (!db) return MEETING_TYPES.map(mt => ({ meetingType: mt, enabled: true, leadTimeMinutes: 1440 }));
  const rows = await db.select().from(meetingReminderPrefs)
    .where(and(eq(meetingReminderPrefs.workspaceId, workspaceId), eq(meetingReminderPrefs.userId, userId)));
  // Return a full set — fill in defaults for any missing types
  return MEETING_TYPES.map(mt => {
    const existing = rows.find(r => r.meetingType === mt);
    return {
      meetingType: mt,
      enabled: existing?.enabled ?? true,
      leadTimeMinutes: existing?.leadTimeMinutes ?? 1440,
    };
  });
}

export async function upsertReminderPrefs(
  workspaceId: number,
  userId: number,
  prefs: { meetingType: string; enabled: boolean; leadTimeMinutes: number }[]
) {
  const db = await getDb();
  if (!db) return;
  for (const p of prefs) {
    const existing = await db.select().from(meetingReminderPrefs)
      .where(and(
        eq(meetingReminderPrefs.workspaceId, workspaceId),
        eq(meetingReminderPrefs.userId, userId),
        eq(meetingReminderPrefs.meetingType, p.meetingType as any),
      )).limit(1);
    if (existing.length > 0) {
      await db.update(meetingReminderPrefs)
        .set({ enabled: p.enabled, leadTimeMinutes: p.leadTimeMinutes })
        .where(eq(meetingReminderPrefs.id, existing[0].id));
    } else {
      await db.insert(meetingReminderPrefs).values({
        workspaceId,
        userId,
        meetingType: p.meetingType as any,
        enabled: p.enabled,
        leadTimeMinutes: p.leadTimeMinutes,
      });
    }
  }
}

/**
 * Get all reminder prefs for a workspace (used by cron to respect per-user preferences).
 * Returns a map: userId -> { meetingType -> { enabled, leadTimeMinutes } }
 */
export async function getAllReminderPrefsForWorkspace(workspaceId: number) {
  const db = await getDb();
  if (!db) return new Map<number, Map<string, { enabled: boolean; leadTimeMinutes: number }>>();
  const rows = await db.select().from(meetingReminderPrefs)
    .where(eq(meetingReminderPrefs.workspaceId, workspaceId));
  const map = new Map<number, Map<string, { enabled: boolean; leadTimeMinutes: number }>>();
  for (const r of rows) {
    if (!map.has(r.userId)) map.set(r.userId, new Map());
    map.get(r.userId)!.set(r.meetingType, { enabled: r.enabled, leadTimeMinutes: r.leadTimeMinutes });
  }
  return map;
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── ADVISOR PERFORMANCE LEADERBOARD (WITH DATE FILTERING) ───────────────
// ═══════════════════════════════════════════════════════════════════════════

export type LeaderboardPeriod = "all" | "month" | "quarter" | "year";

function getDateRangeForPeriod(period: LeaderboardPeriod): { start: Date | null; end: Date } {
  const now = new Date();
  const end = now;
  if (period === "all") return { start: null, end };
  if (period === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
  }
  if (period === "quarter") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    return { start: new Date(now.getFullYear(), qMonth, 1), end };
  }
  // year
  return { start: new Date(now.getFullYear(), 0, 1), end };
}

export async function getAdvisorPerformanceMetricsFiltered(
  workspaceId: number,
  period: LeaderboardPeriod = "all"
): Promise<AdvisorPerformanceEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const members = await getMemberships(workspaceId);
  const allDeals = await db.select().from(deals).where(eq(deals.workspaceId, workspaceId));
  const allClients = await db.select().from(clients).where(eq(clients.workspaceId, workspaceId));
  const allMeetings = await db.select().from(clientMeetings).where(eq(clientMeetings.workspaceId, workspaceId));

  const { start } = getDateRangeForPeriod(period);

  // Filter deals and meetings by date range if period is not "all"
  const filteredDeals = start
    ? allDeals.filter(d => d.createdAt && new Date(d.createdAt) >= start)
    : allDeals;
  const filteredMeetings = start
    ? allMeetings.filter(m => m.scheduledAt && new Date(m.scheduledAt) >= start)
    : allMeetings;

  const entries: AdvisorPerformanceEntry[] = members.map(m => {
    const name = [m.userFirstName, m.userLastName].filter(Boolean).join(" ") || m.userName || m.userEmail || "Advisor";
    const possibleNames = new Set([name, m.userName, m.userEmail].filter(Boolean) as string[]);

    const memberDeals = filteredDeals.filter(d => d.ownerName && possibleNames.has(d.ownerName));
    const closedDeals = memberDeals.filter(d => d.stage === "CLOSED_WON");
    const closedValue = closedDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
    const pipelineDeals = memberDeals.filter(d => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage));
    const pipelineValue = pipelineDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);

    const memberMeetings = filteredMeetings.filter(mt => mt.createdBy === m.userId);
    const clientIds = new Set(memberDeals.map(d => d.clientId));

    // AUM is always computed from all clients (not time-filtered)
    const aumManaged = allClients
      .filter(c => clientIds.has(c.id))
      .reduce((s, c) => s + Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0) + Number(c.lifeInsuranceCv ?? 0), 0);

    const score = Math.round(
      (closedValue / 10000) * 3 +
      closedDeals.length * 15 +
      pipelineDeals.length * 5 +
      memberMeetings.length * 2 +
      (aumManaged / 100000)
    );

    return {
      userId: m.userId,
      name,
      role: m.role,
      email: m.userEmail ?? null,
      aumManaged,
      dealsWon: closedDeals.length,
      closedValue,
      pipelineCount: pipelineDeals.length,
      pipelineValue,
      meetingsHeld: memberMeetings.length,
      clientCount: clientIds.size,
      score,
      rank: 0,
    };
  });

  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries;
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── RISK RECOMMENDATIONS ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const RISK_RECOMMENDATIONS: Record<string, { high: string; medium: string }> = {
  aumConcentration: {
    high: "Diversify portfolio across more asset classes to reduce concentration risk. Consider rebalancing IRA, Roth, taxable, real estate, and insurance allocations.",
    medium: "Review asset allocation quarterly. Current concentration in a single bucket is moderate but should be monitored.",
  },
  filingComplexity: {
    high: "Joint filing introduces complex tax optimization scenarios. Schedule a dedicated tax planning session and review IRMAA thresholds.",
    medium: "Filing status adds moderate complexity. Ensure tax strategy accounts for current filing status implications.",
  },
  strategyDiversity: {
    high: "Client has very few active strategies. Generate additional strategy options (Roth ladder, IUL, real estate shelter) to provide comprehensive coverage.",
    medium: "Consider adding one more strategy type to improve coverage. Run the Strategy Lab for alternative approaches.",
  },
  engagementRecency: {
    high: "Client has not been contacted recently. Schedule an immediate check-in meeting or send a portfolio update email to re-engage.",
    medium: "Last contact is becoming stale. Plan a touchpoint within the next two weeks to maintain engagement.",
  },
  portfolioSize: {
    high: "Large portfolio requires more frequent oversight. Consider quarterly review meetings and automated rebalance alerts.",
    medium: "Portfolio size warrants regular monitoring. Ensure allocation targets are set and drift alerts are configured.",
  },
};

export function generateRiskRecommendations(factors: {
  aumConcentration: number;
  filingComplexity: number;
  strategyDiversity: number;
  engagementRecency: number;
  portfolioSize: number;
}): { factor: string; label: string; score: number; maxScore: number; recommendation: string }[] {
  const factorMeta: { key: keyof typeof factors; label: string; maxScore: number }[] = [
    { key: "aumConcentration", label: "AUM Concentration", maxScore: 25 },
    { key: "filingComplexity", label: "Filing Complexity", maxScore: 10 },
    { key: "strategyDiversity", label: "Strategy Diversity", maxScore: 25 },
    { key: "engagementRecency", label: "Engagement Recency", maxScore: 25 },
    { key: "portfolioSize", label: "Portfolio Size", maxScore: 15 },
  ];

  // Sort by score descending to prioritize highest-risk factors
  return factorMeta
    .map(fm => {
      const score = factors[fm.key];
      const threshold = fm.maxScore * 0.6;
      const rec = RISK_RECOMMENDATIONS[fm.key];
      const recommendation = score >= threshold ? rec.high : score >= fm.maxScore * 0.3 ? rec.medium : "";
      return { factor: fm.key, label: fm.label, score, maxScore: fm.maxScore, recommendation };
    })
    .sort((a, b) => b.score - a.score);
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── RISK SCORE HISTORY ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Store a weekly snapshot of risk scores for all clients in a workspace.
 */
export async function storeRiskScoreSnapshots(workspaceId: number) {
  const db = await getDb();
  if (!db) return { stored: 0 };

  const scores = await computeClientRiskScores(workspaceId);
  if (scores.length === 0) return { stored: 0 };

  const snapshotDate = new Date();
  const values = scores.map(s => ({
    clientId: s.clientId,
    workspaceId,
    score: s.score,
    level: s.level,
    factors: s.factors,
    snapshotDate,
  }));

  await db.insert(riskScoreHistory).values(values);
  return { stored: values.length };
}

/**
 * Get risk score history for a specific client (last N weeks).
 */
export async function getRiskScoreHistory(clientId: number, workspaceId: number, weeks: number = 12) {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);

  return db.select({
    id: riskScoreHistory.id,
    score: riskScoreHistory.score,
    level: riskScoreHistory.level,
    factors: riskScoreHistory.factors,
    snapshotDate: riskScoreHistory.snapshotDate,
  })
    .from(riskScoreHistory)
    .where(and(
      eq(riskScoreHistory.clientId, clientId),
      eq(riskScoreHistory.workspaceId, workspaceId),
      gte(riskScoreHistory.snapshotDate, cutoff),
    ))
    .orderBy(riskScoreHistory.snapshotDate)
    .limit(weeks);
}

/**
 * Get risk score history for all clients in a workspace (for sparklines on list page).
 * Returns a map: clientId -> array of { score, snapshotDate }
 */
export async function getRiskScoreHistoryBulk(workspaceId: number, weeks: number = 8) {
  const db = await getDb();
  if (!db) return new Map<number, { score: number; snapshotDate: Date }[]>();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);

  const rows = await db.select({
    clientId: riskScoreHistory.clientId,
    score: riskScoreHistory.score,
    snapshotDate: riskScoreHistory.snapshotDate,
  })
    .from(riskScoreHistory)
    .where(and(
      eq(riskScoreHistory.workspaceId, workspaceId),
      gte(riskScoreHistory.snapshotDate, cutoff),
    ))
    .orderBy(riskScoreHistory.snapshotDate);

  const map = new Map<number, { score: number; snapshotDate: Date }[]>();
  for (const r of rows) {
    if (!map.has(r.clientId)) map.set(r.clientId, []);
    map.get(r.clientId)!.push({ score: r.score, snapshotDate: r.snapshotDate });
  }
  return map;
}

// ─── HubSpot Sync Helpers ──────────────────────────────────────────────────

export async function getHubspotSyncSettings(workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(hubspotSyncSettings).where(eq(hubspotSyncSettings.workspaceId, workspaceId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertHubspotSyncSettings(workspaceId: number, settings: {
  syncEnabled?: boolean;
  syncContacts?: boolean;
  syncDeals?: boolean;
  syncDirection?: "BIDIRECTIONAL" | "PUSH_ONLY" | "PULL_ONLY";
}) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getHubspotSyncSettings(workspaceId);
  if (existing) {
    await db.update(hubspotSyncSettings)
      .set({ ...settings })
      .where(eq(hubspotSyncSettings.id, existing.id));
    return { ...existing, ...settings };
  }
  const [result] = await db.insert(hubspotSyncSettings).values({
    workspaceId,
    syncEnabled: settings.syncEnabled ?? false,
    syncContacts: settings.syncContacts ?? true,
    syncDeals: settings.syncDeals ?? true,
    syncDirection: settings.syncDirection ?? "BIDIRECTIONAL",
  }).$returningId();
  return { id: result.id, workspaceId, ...settings };
}

export async function updateHubspotSyncStatus(workspaceId: number, status: {
  lastSyncAt: Date;
  lastSyncStatus: "SUCCESS" | "PARTIAL" | "FAILED";
  contactsPushed?: number;
  contactsPulled?: number;
  dealsPushed?: number;
  dealsPulled?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(hubspotSyncSettings).set({
    lastSyncAt: status.lastSyncAt,
    lastSyncStatus: status.lastSyncStatus,
    lastSyncContactsPushed: status.contactsPushed ?? 0,
    lastSyncContactsPulled: status.contactsPulled ?? 0,
    lastSyncDealsPushed: status.dealsPushed ?? 0,
    lastSyncDealsPulled: status.dealsPulled ?? 0,
  }).where(eq(hubspotSyncSettings.workspaceId, workspaceId));
}

export async function logHubspotSync(entry: {
  workspaceId: number;
  direction: "PUSH" | "PULL";
  objectType: "CONTACT" | "DEAL";
  hubspotId?: string;
  localId?: number;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(hubspotSyncLog).values(entry);
}

export async function getHubspotSyncHistory(workspaceId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hubspotSyncLog)
    .where(eq(hubspotSyncLog.workspaceId, workspaceId))
    .orderBy(desc(hubspotSyncLog.syncedAt))
    .limit(limit);
}

export async function getClientByHubspotId(workspaceId: number, hubspotContactId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clients)
    .where(and(eq(clients.workspaceId, workspaceId), eq(clients.hubspotContactId, hubspotContactId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getDealByHubspotId(workspaceId: number, hubspotDealId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(deals)
    .where(and(eq(deals.workspaceId, workspaceId), eq(deals.hubspotDealId, hubspotDealId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function linkClientToHubspot(clientId: number, hubspotContactId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set({ hubspotContactId }).where(eq(clients.id, clientId));
}

export async function linkDealToHubspot(dealId: number, hubspotDealId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(deals).set({ hubspotDealId }).where(eq(deals.id, dealId));
}

// ─── Compliance Alerts Helpers ─────────────────────────────────────────────

export async function createComplianceAlert(alert: {
  clientId: number;
  workspaceId: number;
  alertType: "RMD_DEADLINE" | "CONTRIBUTION_LIMIT" | "FILING_DEADLINE" | "REBALANCE_OVERDUE" | "REVIEW_OVERDUE" | "AGE_MILESTONE" | "HIGH_CONCENTRATION" | "STALE_STRATEGY";
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  dueDate?: Date;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(complianceAlerts).values(alert).$returningId();
  return { id: result.id, ...alert };
}

export async function getComplianceAlerts(workspaceId: number, opts?: {
  dismissed?: boolean;
  severity?: string;
  clientId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(complianceAlerts.workspaceId, workspaceId)];
  if (opts?.dismissed !== undefined) {
    conditions.push(eq(complianceAlerts.dismissed, opts.dismissed));
  }
  if (opts?.severity) {
    conditions.push(eq(complianceAlerts.severity, opts.severity as any));
  }
  if (opts?.clientId) {
    conditions.push(eq(complianceAlerts.clientId, opts.clientId));
  }
  return db.select().from(complianceAlerts)
    .where(and(...conditions))
    .orderBy(desc(complianceAlerts.createdAt))
    .limit(opts?.limit ?? 100);
}

export async function getComplianceAlertStats(workspaceId: number) {
  const db = await getDb();
  if (!db) return { total: 0, critical: 0, warning: 0, info: 0, dismissed: 0 };
  const all = await db.select().from(complianceAlerts)
    .where(eq(complianceAlerts.workspaceId, workspaceId));
  return {
    total: all.filter(a => !a.dismissed).length,
    critical: all.filter(a => !a.dismissed && a.severity === "CRITICAL").length,
    warning: all.filter(a => !a.dismissed && a.severity === "WARNING").length,
    info: all.filter(a => !a.dismissed && a.severity === "INFO").length,
    dismissed: all.filter(a => a.dismissed).length,
  };
}

export async function dismissComplianceAlert(alertId: number, userId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) return;
  const conditions = [eq(complianceAlerts.id, alertId)];
  if (workspaceId !== undefined) conditions.push(eq(complianceAlerts.workspaceId, workspaceId));
  await db.update(complianceAlerts).set({
    dismissed: true,
    dismissedBy: userId,
    dismissedAt: new Date(),
  }).where(and(...conditions));
}

export async function resolveComplianceAlert(alertId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) return;
  const conditions = [eq(complianceAlerts.id, alertId)];
  if (workspaceId !== undefined) conditions.push(eq(complianceAlerts.workspaceId, workspaceId));
  await db.update(complianceAlerts).set({
    resolvedAt: new Date(),
    dismissed: true,
  }).where(and(...conditions));
}

export async function getActiveComplianceAlertTypes(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ alertType: complianceAlerts.alertType })
    .from(complianceAlerts)
    .where(and(
      eq(complianceAlerts.clientId, clientId),
      eq(complianceAlerts.workspaceId, workspaceId),
      eq(complianceAlerts.dismissed, false),
    ));
  return rows.map(r => r.alertType);
}

// ─── Compliance Rules Engine ───────────────────────────────────────────────

export interface ComplianceCheckResult {
  clientId: number;
  clientName: string;
  alertType: "RMD_DEADLINE" | "CONTRIBUTION_LIMIT" | "FILING_DEADLINE" | "REBALANCE_OVERDUE" | "REVIEW_OVERDUE" | "AGE_MILESTONE" | "HIGH_CONCENTRATION" | "STALE_STRATEGY";
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  dueDate?: Date;
  metadata?: Record<string, unknown>;
}

export async function runComplianceChecks(workspaceId: number): Promise<ComplianceCheckResult[]> {
  const db = await getDb();
  if (!db) return [];

  const allClients = await db.select().from(clients).where(eq(clients.workspaceId, workspaceId));
  const allStrategies = await db.select().from(strategies).where(eq(strategies.workspaceId, workspaceId));
  const allMeetings = await db.select().from(clientMeetings).where(eq(clientMeetings.workspaceId, workspaceId));
  const allDeals = await db.select().from(deals).where(eq(deals.workspaceId, workspaceId));

  const results: ComplianceCheckResult[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // Get existing active alerts to avoid duplicates
  const existingAlerts = await db.select().from(complianceAlerts)
    .where(and(eq(complianceAlerts.workspaceId, workspaceId), eq(complianceAlerts.dismissed, false)));
  const existingKeys = new Set(existingAlerts.map(a => `${a.clientId}-${a.alertType}`));

  for (const client of allClients) {
    const clientStrategies = allStrategies.filter(s => s.clientId === client.id);
    const clientMeetingsList = allMeetings.filter(m => m.clientId === client.id);
    const clientDeals = allDeals.filter(d => d.clientId === client.id);

    // 1. RMD Deadline: clients age >= 73 with IRA balance
    if (client.age && client.age >= 73 && client.iraBalance && Number(client.iraBalance) > 0) {
      const key = `${client.id}-RMD_DEADLINE`;
      if (!existingKeys.has(key)) {
        const rmdDeadline = new Date(currentYear, 3, 1); // April 1st
        const isUrgent = now >= new Date(currentYear, 2, 1); // March or later
        results.push({
          clientId: client.id,
          clientName: client.name,
          alertType: "RMD_DEADLINE",
          severity: isUrgent ? "CRITICAL" : "WARNING",
          title: `RMD Deadline Approaching — ${client.name}`,
          message: `${client.name} (age ${client.age}) has an IRA balance of $${Number(client.iraBalance).toLocaleString()} and must take their Required Minimum Distribution by April 1, ${currentYear}. Failure to withdraw the correct amount results in a 25% excise tax.`,
          dueDate: rmdDeadline,
          metadata: { iraBalance: Number(client.iraBalance), age: client.age },
        });
      }
    }

    // 2. Contribution Limit: clients under 50 with high income and Roth balance
    if (client.age && client.income) {
      const incomeNum = Number(client.income);
      // 2025 Roth IRA income phase-out: $150K single, $236K joint
      const limit = client.filingStatus === "single" ? 150000 : 236000;
      if (incomeNum > limit * 0.9 && client.rothBalance && Number(client.rothBalance) > 0) {
        const key = `${client.id}-CONTRIBUTION_LIMIT`;
        if (!existingKeys.has(key)) {
          results.push({
            clientId: client.id,
            clientName: client.name,
            alertType: "CONTRIBUTION_LIMIT",
            severity: incomeNum > limit ? "CRITICAL" : "WARNING",
            title: `Roth IRA Contribution Limit Risk — ${client.name}`,
            message: `${client.name}'s income ($${incomeNum.toLocaleString()}) is ${incomeNum > limit ? "above" : "approaching"} the Roth IRA contribution phase-out threshold ($${limit.toLocaleString()} for ${client.filingStatus} filers). Review contribution strategy to avoid excess contribution penalties.`,
            metadata: { income: incomeNum, limit, filingStatus: client.filingStatus },
          });
        }
      }
    }

    // 3. Filing Deadline: all clients with income
    if (client.income && Number(client.income) > 0) {
      const filingDeadline = new Date(currentYear, 3, 15); // April 15
      const daysUntilFiling = Math.ceil((filingDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilFiling > 0 && daysUntilFiling <= 60) {
        const key = `${client.id}-FILING_DEADLINE`;
        if (!existingKeys.has(key)) {
          results.push({
            clientId: client.id,
            clientName: client.name,
            alertType: "FILING_DEADLINE",
            severity: daysUntilFiling <= 14 ? "CRITICAL" : "WARNING",
            title: `Tax Filing Deadline — ${client.name}`,
            message: `${client.name}'s tax filing deadline is ${daysUntilFiling} days away (April 15, ${currentYear}). Ensure all tax documents are prepared and filed on time.`,
            dueDate: filingDeadline,
            metadata: { daysUntilFiling },
          });
        }
      }
    }

    // 4. Review Overdue: no meeting in the last 90 days
    const lastMeeting = clientMeetingsList
      .filter(m => m.status === "COMPLETED")
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
    if (lastMeeting) {
      const daysSinceLastMeeting = Math.ceil((now.getTime() - new Date(lastMeeting.scheduledAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastMeeting > 90) {
        const key = `${client.id}-REVIEW_OVERDUE`;
        if (!existingKeys.has(key)) {
          results.push({
            clientId: client.id,
            clientName: client.name,
            alertType: "REVIEW_OVERDUE",
            severity: daysSinceLastMeeting > 180 ? "CRITICAL" : "WARNING",
            title: `Client Review Overdue — ${client.name}`,
            message: `${client.name} has not had a review meeting in ${daysSinceLastMeeting} days. Regular reviews are recommended at least quarterly for fiduciary compliance.`,
            metadata: { daysSinceLastMeeting, lastMeetingDate: lastMeeting.scheduledAt },
          });
        }
      }
    }

    // 5. Age Milestone: approaching 59.5, 65, 70.5, 73
    if (client.age) {
      const milestones = [
        { age: 59, label: "59½ — Early withdrawal penalty-free age", nextAge: 60 },
        { age: 64, label: "65 — Medicare eligibility", nextAge: 65 },
        { age: 72, label: "73 — RMD start age", nextAge: 73 },
      ];
      for (const m of milestones) {
        if (client.age === m.age) {
          const key = `${client.id}-AGE_MILESTONE`;
          if (!existingKeys.has(key)) {
            results.push({
              clientId: client.id,
              clientName: client.name,
              alertType: "AGE_MILESTONE",
              severity: "INFO",
              title: `Age Milestone Approaching — ${client.name}`,
              message: `${client.name} (age ${client.age}) is approaching ${m.label}. Review their financial plan to prepare for this milestone.`,
              metadata: { currentAge: client.age, milestone: m.label },
            });
            break; // Only one milestone alert per client
          }
        }
      }
    }

    // 6. Stale Strategy: strategy not updated in 12 months
    if (clientStrategies.length > 0) {
      const latestStrategy = clientStrategies.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
      const daysSinceUpdate = Math.ceil((now.getTime() - new Date(latestStrategy.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > 365) {
        const key = `${client.id}-STALE_STRATEGY`;
        if (!existingKeys.has(key)) {
          results.push({
            clientId: client.id,
            clientName: client.name,
            alertType: "STALE_STRATEGY",
            severity: "WARNING",
            title: `Strategy Review Needed — ${client.name}`,
            message: `${client.name}'s financial strategy has not been updated in ${daysSinceUpdate} days. Annual strategy reviews are recommended to ensure alignment with current goals and market conditions.`,
            metadata: { daysSinceUpdate, lastUpdateDate: latestStrategy.updatedAt },
          });
        }
      }
    }

    // 7. High Concentration: single asset class > 60% of total assets
    const totalAssets = [
      Number(client.iraBalance ?? 0),
      Number(client.rothBalance ?? 0),
      Number(client.taxableAssets ?? 0),
      Number(client.realEstateEquity ?? 0),
      Number(client.lifeInsuranceCv ?? 0),
    ].reduce((a, b) => a + b, 0);

    if (totalAssets > 0) {
      const assetBreakdown = [
        { name: "IRA", value: Number(client.iraBalance ?? 0) },
        { name: "Roth IRA", value: Number(client.rothBalance ?? 0) },
        { name: "Taxable Assets", value: Number(client.taxableAssets ?? 0) },
        { name: "Real Estate", value: Number(client.realEstateEquity ?? 0) },
        { name: "Life Insurance CV", value: Number(client.lifeInsuranceCv ?? 0) },
      ];
      for (const asset of assetBreakdown) {
        const pct = (asset.value / totalAssets) * 100;
        if (pct > 60) {
          const key = `${client.id}-HIGH_CONCENTRATION`;
          if (!existingKeys.has(key)) {
            results.push({
              clientId: client.id,
              clientName: client.name,
              alertType: "HIGH_CONCENTRATION",
              severity: pct > 80 ? "CRITICAL" : "WARNING",
              title: `High Asset Concentration — ${client.name}`,
              message: `${client.name} has ${pct.toFixed(1)}% of total assets ($${totalAssets.toLocaleString()}) concentrated in ${asset.name}. Consider diversification to reduce risk.`,
              metadata: { assetClass: asset.name, concentration: pct, totalAssets },
            });
            break; // Only one concentration alert per client
          }
        }
      }
    }
  }

  return results;
}

// ─── Enhanced Client Portal Data (with portfolio + meetings) ───────────────

export async function getClientPortalDataEnhanced(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;

  const [client] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId))).limit(1);
  if (!client) return null;

  const docs = await db.select().from(clientDocuments).where(and(eq(clientDocuments.clientId, clientId), eq(clientDocuments.workspaceId, workspaceId))).orderBy(desc(clientDocuments.createdAt));
  const strats = await db.select().from(strategies).where(and(eq(strategies.clientId, clientId), eq(strategies.workspaceId, workspaceId))).orderBy(desc(strategies.createdAt));
  const notesList = await db.select().from(clientNotes).where(and(eq(clientNotes.clientId, clientId), eq(clientNotes.workspaceId, workspaceId))).orderBy(desc(clientNotes.createdAt)).limit(20);

  // Upcoming meetings
  const now = new Date();
  const upcomingMeetings = await db.select().from(clientMeetings)
    .where(and(
      eq(clientMeetings.clientId, clientId),
      eq(clientMeetings.workspaceId, workspaceId),
      gte(clientMeetings.scheduledAt, now),
      eq(clientMeetings.status, "SCHEDULED"),
    ))
    .orderBy(asc(clientMeetings.scheduledAt))
    .limit(5);

  // Portfolio summary
  const totalAssets = [
    Number(client.iraBalance ?? 0),
    Number(client.rothBalance ?? 0),
    Number(client.taxableAssets ?? 0),
    Number(client.realEstateEquity ?? 0),
    Number(client.lifeInsuranceCv ?? 0),
  ].reduce((a, b) => a + b, 0);

  const portfolio = {
    totalAssets,
    breakdown: [
      { label: "Traditional IRA", value: Number(client.iraBalance ?? 0) },
      { label: "Roth IRA", value: Number(client.rothBalance ?? 0) },
      { label: "Taxable Accounts", value: Number(client.taxableAssets ?? 0) },
      { label: "Real Estate Equity", value: Number(client.realEstateEquity ?? 0) },
      { label: "Life Insurance CV", value: Number(client.lifeInsuranceCv ?? 0) },
    ].filter(b => b.value > 0),
  };

  // Saved Roth/IUL strategies (from savedStrategies table)
  const savedStrats = await db.select().from(savedStrategies)
    .where(and(eq(savedStrategies.clientId, clientId), eq(savedStrategies.workspaceId, workspaceId)))
    .orderBy(desc(savedStrategies.createdAt))
    .limit(10);

  // Workspace branding
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);

  return {
    client,
    documents: docs,
    strategies: strats,
    notes: notesList,
    upcomingMeetings,
    portfolio,
    savedStrategies: savedStrats,
    branding: ws ? { name: ws.name, logoUrl: ws.logoUrl, primaryColor: ws.primaryColor, accentColor: ws.accentColor } : null,
  };
}


// ─── Onboarding helpers ──────────────────────────────────────────────────────
export async function isOnboardingComplete(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ onboardingCompleted: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0]?.onboardingCompleted ?? false;
}

export async function markOnboardingComplete(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ onboardingCompleted: true })
    .where(eq(users.id, userId));
}


// ─── Client Properties (Mortgage/Real Estate) ────────────────────────────────
export async function getClientProperties(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientProperties).where(and(eq(clientProperties.clientId, clientId), eq(clientProperties.workspaceId, workspaceId))).orderBy(clientProperties.createdAt);
}

export async function createClientProperty(data: {
  clientId: number; workspaceId: number; propertyName: string; propertyType?: string;
  propertyValue?: number; monthlyMortgagePayment?: number; monthlyInterestOnlyPayment?: number;
  totalInterestPayment?: number; monthlyRentalIncome?: number; annualAppreciation?: number;
  isPrimary?: boolean; mortgageBalance?: number; interestRate?: number; loanTermYears?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clientProperties).values({
    clientId: data.clientId, workspaceId: data.workspaceId, propertyName: data.propertyName,
    propertyType: (data.propertyType as any) ?? "PRIMARY",
    propertyValue: data.propertyValue?.toString(), monthlyMortgagePayment: data.monthlyMortgagePayment?.toString(),
    monthlyInterestOnlyPayment: data.monthlyInterestOnlyPayment?.toString(),
    totalInterestPayment: data.totalInterestPayment?.toString(),
    monthlyRentalIncome: data.monthlyRentalIncome?.toString(), annualAppreciation: data.annualAppreciation?.toString(),
    isPrimary: data.isPrimary ?? false, mortgageBalance: data.mortgageBalance?.toString(),
    interestRate: data.interestRate?.toString(), loanTermYears: data.loanTermYears,
  }).$returningId();
  return result;
}

export async function updateClientProperty(id: number, workspaceId: number, data: Partial<{
  propertyName: string; propertyType: string; propertyValue: number; monthlyMortgagePayment: number;
  monthlyInterestOnlyPayment: number; totalInterestPayment: number; monthlyRentalIncome: number;
  annualAppreciation: number; isPrimary: boolean; mortgageBalance: number; interestRate: number; loanTermYears: number;
}>) {
  const db = await getDb();
  if (!db) return;
  const updates: any = {};
  if (data.propertyName !== undefined) updates.propertyName = data.propertyName;
  if (data.propertyType !== undefined) updates.propertyType = data.propertyType;
  if (data.propertyValue !== undefined) updates.propertyValue = data.propertyValue.toString();
  if (data.monthlyMortgagePayment !== undefined) updates.monthlyMortgagePayment = data.monthlyMortgagePayment.toString();
  if (data.monthlyInterestOnlyPayment !== undefined) updates.monthlyInterestOnlyPayment = data.monthlyInterestOnlyPayment.toString();
  if (data.totalInterestPayment !== undefined) updates.totalInterestPayment = data.totalInterestPayment.toString();
  if (data.monthlyRentalIncome !== undefined) updates.monthlyRentalIncome = data.monthlyRentalIncome.toString();
  if (data.annualAppreciation !== undefined) updates.annualAppreciation = data.annualAppreciation.toString();
  if (data.isPrimary !== undefined) updates.isPrimary = data.isPrimary;
  if (data.mortgageBalance !== undefined) updates.mortgageBalance = data.mortgageBalance.toString();
  if (data.interestRate !== undefined) updates.interestRate = data.interestRate.toString();
  if (data.loanTermYears !== undefined) updates.loanTermYears = data.loanTermYears;
  await db.update(clientProperties).set(updates).where(and(eq(clientProperties.id, id), eq(clientProperties.workspaceId, workspaceId)));
}

export async function deleteClientProperty(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientProperties).where(and(eq(clientProperties.id, id), eq(clientProperties.workspaceId, workspaceId)));
}

// ─── Client Crypto Holdings ──────────────────────────────────────────────────
export async function getClientCryptoHoldings(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientCryptoHoldings).where(and(eq(clientCryptoHoldings.clientId, clientId), eq(clientCryptoHoldings.workspaceId, workspaceId))).orderBy(clientCryptoHoldings.createdAt);
}

export async function createClientCryptoHolding(data: {
  clientId: number; workspaceId: number; coinId: string; coinName: string; coinSymbol?: string;
  quantity: number; avgPurchasePrice: number; amountStaked?: number; stakingPercentage?: number;
  predictedStakingIncome?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clientCryptoHoldings).values({
    clientId: data.clientId, workspaceId: data.workspaceId,
    coinId: data.coinId, coinName: data.coinName, coinSymbol: data.coinSymbol,
    quantity: data.quantity.toString(), avgPurchasePrice: data.avgPurchasePrice.toString(),
    amountStaked: data.amountStaked?.toString(), stakingPercentage: data.stakingPercentage?.toString(),
    predictedStakingIncome: data.predictedStakingIncome?.toString(),
  }).$returningId();
  return result;
}

export async function updateClientCryptoHolding(id: number, workspaceId: number, data: Partial<{
  coinId: string; coinName: string; coinSymbol: string; quantity: number; avgPurchasePrice: number;
  amountStaked: number; stakingPercentage: number; predictedStakingIncome: number;
}>) {
  const db = await getDb();
  if (!db) return;
  const updates: any = {};
  if (data.coinId !== undefined) updates.coinId = data.coinId;
  if (data.coinName !== undefined) updates.coinName = data.coinName;
  if (data.coinSymbol !== undefined) updates.coinSymbol = data.coinSymbol;
  if (data.quantity !== undefined) updates.quantity = data.quantity.toString();
  if (data.avgPurchasePrice !== undefined) updates.avgPurchasePrice = data.avgPurchasePrice.toString();
  if (data.amountStaked !== undefined) updates.amountStaked = data.amountStaked.toString();
  if (data.stakingPercentage !== undefined) updates.stakingPercentage = data.stakingPercentage.toString();
  if (data.predictedStakingIncome !== undefined) updates.predictedStakingIncome = data.predictedStakingIncome.toString();
  await db.update(clientCryptoHoldings).set(updates).where(and(eq(clientCryptoHoldings.id, id), eq(clientCryptoHoldings.workspaceId, workspaceId)));
}

export async function deleteClientCryptoHolding(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientCryptoHoldings).where(and(eq(clientCryptoHoldings.id, id), eq(clientCryptoHoldings.workspaceId, workspaceId)));
}


// ── Saved Strategies ──
export async function getSavedStrategies(workspaceId: number, clientId?: number, includeArchived = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(savedStrategies.workspaceId, workspaceId)];
  if (clientId) conditions.push(eq(savedStrategies.clientId, clientId));
  if (!includeArchived) conditions.push(eq(savedStrategies.isArchived, false));
  return db.select().from(savedStrategies).where(and(...conditions)).orderBy(desc(savedStrategies.createdAt));
}

export async function toggleArchiveStrategy(id: number, workspaceId: number, isArchived: boolean) {
  const db = await getDb();
  if (!db) return null;
  await db.update(savedStrategies)
    .set({ isArchived })
    .where(and(eq(savedStrategies.id, id), eq(savedStrategies.workspaceId, workspaceId)));
  return { id, isArchived };
}

export async function getSavedStrategyById(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(savedStrategies)
    .where(and(eq(savedStrategies.id, id), eq(savedStrategies.workspaceId, workspaceId)));
  return rows[0] ?? null;
}

export async function createSavedStrategy(data: {
  workspaceId: number;
  clientId?: number;
  clientName?: string;
  advisorId: number;
  advisorName: string;
  strategyType: string;
  strategyLabel: string;
  carrierId?: string;
  carrierName?: string;
  inputsJson: any;
  summaryJson: any;
  iulProjectionJson?: any;
  strProjectionJson?: any;
  notes?: string;
  version?: number;
  parentStrategyId?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(savedStrategies).values(data as any);
  return result.insertId;
}

export async function getStrategyVersions(parentId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get the root strategy and all its children
  const root = await db.select().from(savedStrategies)
    .where(and(eq(savedStrategies.id, parentId), eq(savedStrategies.workspaceId, workspaceId)));
  const children = await db.select().from(savedStrategies)
    .where(and(eq(savedStrategies.parentStrategyId, parentId), eq(savedStrategies.workspaceId, workspaceId)))
    .orderBy(savedStrategies.version);
  return [...root, ...children];
}

export async function getLatestVersion(parentId: number, workspaceId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const children = await db.select().from(savedStrategies)
    .where(and(eq(savedStrategies.parentStrategyId, parentId), eq(savedStrategies.workspaceId, workspaceId)))
    .orderBy(desc(savedStrategies.version));
  if (children.length > 0) return (children[0].version ?? 1) + 1;
  return 2; // Next version after the original
}

export async function deleteSavedStrategy(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(savedStrategies).where(and(eq(savedStrategies.id, id), eq(savedStrategies.workspaceId, workspaceId)));
}

// ── Carrier Rate Overrides ──
export async function getCarrierOverrides(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(carrierOverrides).where(eq(carrierOverrides.workspaceId, workspaceId)).orderBy(carrierOverrides.carrierName);
}

export async function getCarrierOverride(workspaceId: number, carrierId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(carrierOverrides)
    .where(and(eq(carrierOverrides.workspaceId, workspaceId), eq(carrierOverrides.carrierId, carrierId)));
  return rows[0] ?? null;
}

export async function upsertCarrierOverride(data: {
  workspaceId: number; carrierId: string; carrierName: string;
  loadFee?: string | null; coiRate?: string | null; capRate?: string | null;
  floorRate?: string | null; avgReturn?: string | null; notes?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;
  // Check if exists
  const existing = await db.select().from(carrierOverrides)
    .where(and(eq(carrierOverrides.workspaceId, data.workspaceId), eq(carrierOverrides.carrierId, data.carrierId)));
  if (existing.length > 0) {
    await db.update(carrierOverrides)
      .set({
        carrierName: data.carrierName,
        loadFee: data.loadFee ?? undefined,
        coiRate: data.coiRate ?? undefined,
        capRate: data.capRate ?? undefined,
        floorRate: data.floorRate ?? undefined,
        avgReturn: data.avgReturn ?? undefined,
        notes: data.notes ?? undefined,
      })
      .where(and(eq(carrierOverrides.workspaceId, data.workspaceId), eq(carrierOverrides.carrierId, data.carrierId)));
    return existing[0].id;
  } else {
    const [result] = await db.insert(carrierOverrides).values(data as any);
    return result.insertId;
  }
}

export async function deleteCarrierOverride(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(carrierOverrides).where(and(eq(carrierOverrides.id, id), eq(carrierOverrides.workspaceId, workspaceId)));
}

// ── Recommendation History ──
export async function createRecommendationHistory(data: {
  workspaceId: number;
  clientId?: number | null;
  clientName?: string | null;
  clientAge?: number | null;
  riskTolerance?: string | null;
  annualPremium?: number | null;
  recommendedCarrierId: string;
  recommendedCarrierName: string;
  totalScore: number;
  allScoresJson: unknown;
  advisorId?: number | null;
  advisorName?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(recommendationHistory).values({
    workspaceId: data.workspaceId,
    clientId: data.clientId ?? undefined,
    clientName: data.clientName ?? undefined,
    clientAge: data.clientAge ?? undefined,
    riskTolerance: data.riskTolerance ?? undefined,
    annualPremium: data.annualPremium != null ? String(data.annualPremium) : undefined,
    recommendedCarrierId: data.recommendedCarrierId,
    recommendedCarrierName: data.recommendedCarrierName,
    totalScore: String(data.totalScore),
    allScoresJson: data.allScoresJson,
    advisorId: data.advisorId ?? undefined,
    advisorName: data.advisorName ?? undefined,
  }).$returningId();
  return result;
}

export async function getRecommendationHistory(workspaceId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recommendationHistory)
    .where(eq(recommendationHistory.workspaceId, workspaceId))
    .orderBy(desc(recommendationHistory.createdAt))
    .limit(limit);
}

export async function getRecommendationHistoryByClient(workspaceId: number, clientId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recommendationHistory)
    .where(and(
      eq(recommendationHistory.workspaceId, workspaceId),
      eq(recommendationHistory.clientId, clientId),
    ))
    .orderBy(desc(recommendationHistory.createdAt))
    .limit(limit);
}

// ── Referrals ──────────────────────────────────────────────────────────────────
export async function createReferral(data: {
  workspaceId: number;
  referrerName: string;
  referredName: string;
  referredEmail?: string;
  referredPhone?: string;
  source?: "Client" | "Professional" | "Event" | "Online" | "Other";
  status?: "pending" | "contacted" | "meeting_scheduled" | "converted" | "lost";
  estimatedValue?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(referrals).values({
    workspaceId: data.workspaceId,
    referrerName: data.referrerName,
    referredName: data.referredName,
    referredEmail: data.referredEmail,
    referredPhone: data.referredPhone,
    source: data.source ?? "Client",
    status: data.status ?? "pending",
    estimatedValue: data.estimatedValue,
    notes: data.notes,
  }).$returningId();
  return { id: result.id };
}

export async function listReferrals(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(referrals)
    .where(eq(referrals.workspaceId, workspaceId))
    .orderBy(desc(referrals.createdAt));
}

export async function updateReferral(id: number, workspaceId: number, data: Partial<{
  referrerName: string;
  referredName: string;
  referredEmail: string;
  referredPhone: string;
  source: "Client" | "Professional" | "Event" | "Online" | "Other";
  status: "pending" | "contacted" | "meeting_scheduled" | "converted" | "lost";
  estimatedValue: string;
  notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(referrals).set(data).where(and(eq(referrals.id, id), eq(referrals.workspaceId, workspaceId)));
  return { updated: true };
}

export async function deleteReferral(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(referrals).where(and(eq(referrals.id, id), eq(referrals.workspaceId, workspaceId)));
  return { deleted: true };
}

// ── All Documents (Vault overview) ─────────────────────────────────────────────
export async function listAllDocuments(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: clientDocuments.id,
    clientId: clientDocuments.clientId,
    name: clientDocuments.name,
    url: clientDocuments.url,
    mimeType: clientDocuments.mimeType,
    sizeBytes: clientDocuments.sizeBytes,
    category: clientDocuments.category,
    uploadedByName: clientDocuments.uploadedByName,
    createdAt: clientDocuments.createdAt,
    clientName: clients.name,
  }).from(clientDocuments)
    .leftJoin(clients, eq(clientDocuments.clientId, clients.id))
    .where(eq(clientDocuments.workspaceId, workspaceId))
    .orderBy(desc(clientDocuments.createdAt));
}


// ── Compliance Signatures ─────────────────────────────────────────────────────
export async function saveComplianceSignatureDb(data: {
  userId: number; userName: string; userEmail?: string;
  signedName: string; signedDate: string;
  ipAddress?: string; userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(complianceSignatures).values(data);
  const rows = await db.select().from(complianceSignatures)
    .where(eq(complianceSignatures.userId, data.userId))
    .orderBy(desc(complianceSignatures.createdAt)).limit(1);
  return rows[0];
}

export async function getLatestComplianceSignature(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(complianceSignatures)
    .where(eq(complianceSignatures.userId, userId))
    .orderBy(desc(complianceSignatures.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function getComplianceSignaturesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceSignatures)
    .where(eq(complianceSignatures.userId, userId))
    .orderBy(desc(complianceSignatures.createdAt));
}

export async function getAllComplianceSignatures() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceSignatures)
    .orderBy(desc(complianceSignatures.createdAt));
}

// ── User Sessions ─────────────────────────────────────────────────────────────
export async function createUserSession(data: {
  userId: number; userName: string; userEmail?: string;
  ipAddress?: string; userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Close any existing active sessions for this user
  await db.update(userSessions)
    .set({ isActive: false, logoutAt: new Date() })
    .where(and(eq(userSessions.userId, data.userId), eq(userSessions.isActive, true)));
  await db.insert(userSessions).values({ ...data, isActive: true });
  const rows = await db.select().from(userSessions)
    .where(and(eq(userSessions.userId, data.userId), eq(userSessions.isActive, true)))
    .orderBy(desc(userSessions.createdAt)).limit(1);
  return rows[0];
}

export async function endUserSession(sessionId: number) {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);
  if (!rows[0]) return;
  const loginAt = rows[0].loginAt;
  const now = new Date();
  const durationSecs = Math.round((now.getTime() - loginAt.getTime()) / 1000);
  await db.update(userSessions)
    .set({ isActive: false, logoutAt: now, durationSecs })
    .where(eq(userSessions.id, sessionId));
}

export async function endUserSessionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return;
  const activeSessions = await db.select().from(userSessions)
    .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, true)));
  for (const sess of activeSessions) {
    const now = new Date();
    const durationSecs = Math.round((now.getTime() - sess.loginAt.getTime()) / 1000);
    await db.update(userSessions)
      .set({ isActive: false, logoutAt: now, durationSecs })
      .where(eq(userSessions.id, sess.id));
  }
}

export async function getActiveSession(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userSessions)
    .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, true)))
    .orderBy(desc(userSessions.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function getUserSessionHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userSessions)
    .where(eq(userSessions.userId, userId))
    .orderBy(desc(userSessions.loginAt));
}

export async function getAllUserSessions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userSessions)
    .orderBy(desc(userSessions.loginAt));
}

export async function getDistinctSessionUsers() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    userId: userSessions.userId,
    userName: userSessions.userName,
    userEmail: userSessions.userEmail,
  }).from(userSessions)
    .groupBy(userSessions.userId, userSessions.userName, userSessions.userEmail)
    .orderBy(userSessions.userName);
  return rows;
}

// ── Page Activity Logs ────────────────────────────────────────────────────────
export async function logPageVisit(data: {
  sessionId: number; userId: number; userName: string;
  pagePath: string; pageTitle: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Close the previous page visit for this session (set exitedAt + duration)
  const prevPages = await db.select().from(pageActivityLogs)
    .where(and(
      eq(pageActivityLogs.sessionId, data.sessionId),
      eq(pageActivityLogs.userId, data.userId),
    ))
    .orderBy(desc(pageActivityLogs.enteredAt)).limit(1);
  if (prevPages[0] && !prevPages[0].exitedAt) {
    const now = new Date();
    const durationSecs = Math.round((now.getTime() - prevPages[0].enteredAt.getTime()) / 1000);
    await db.update(pageActivityLogs)
      .set({ exitedAt: now, durationSecs })
      .where(eq(pageActivityLogs.id, prevPages[0].id));
  }
  await db.insert(pageActivityLogs).values(data);
}

export async function closePageVisit(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const prevPages = await db.select().from(pageActivityLogs)
    .where(and(
      eq(pageActivityLogs.sessionId, sessionId),
      eq(pageActivityLogs.userId, userId),
    ))
    .orderBy(desc(pageActivityLogs.enteredAt)).limit(1);
  if (prevPages[0] && !prevPages[0].exitedAt) {
    const now = new Date();
    const durationSecs = Math.round((now.getTime() - prevPages[0].enteredAt.getTime()) / 1000);
    await db.update(pageActivityLogs)
      .set({ exitedAt: now, durationSecs })
      .where(eq(pageActivityLogs.id, prevPages[0].id));
  }
}

export async function getPageActivityBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pageActivityLogs)
    .where(eq(pageActivityLogs.sessionId, sessionId))
    .orderBy(asc(pageActivityLogs.enteredAt));
}

export async function getPageActivityByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pageActivityLogs)
    .where(eq(pageActivityLogs.userId, userId))
    .orderBy(desc(pageActivityLogs.enteredAt));
}

export async function getAllPageActivity() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pageActivityLogs)
    .orderBy(desc(pageActivityLogs.enteredAt));
}


// ─── Household Fact Finder ───────────────────────────────────────────────────
export async function getHouseholdFactFinder(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(householdFactFinders)
    .where(and(eq(householdFactFinders.clientId, clientId), eq(householdFactFinders.workspaceId, workspaceId)))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertHouseholdFactFinder(data: typeof householdFactFinders.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getHouseholdFactFinder(data.clientId, data.workspaceId);
  if (existing) {
    await db.update(householdFactFinders)
      .set(data)
      .where(eq(householdFactFinders.id, existing.id));
    return { ...existing, ...data };
  } else {
    await db.insert(householdFactFinders).values(data);
    return getHouseholdFactFinder(data.clientId, data.workspaceId);
  }
}


// ─── Payment Disclosures (Legal Payment Folder) ─────────────────────────────

export async function createPaymentDisclosure(data: typeof paymentDisclosures.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(paymentDisclosures).values(data);
  const [row] = await db.select().from(paymentDisclosures)
    .where(and(
      eq(paymentDisclosures.userId, data.userId),
      eq(paymentDisclosures.signatureHash, data.signatureHash)
    ))
    .orderBy(desc(paymentDisclosures.id))
    .limit(1);
  return row;
}

export async function getPaymentDisclosures(opts: { limit?: number; offset?: number } = {}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const rows = await db.select().from(paymentDisclosures)
    .orderBy(desc(paymentDisclosures.agreedAt))
    .limit(limit)
    .offset(offset);
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(paymentDisclosures);
  return { rows, total: countResult?.count ?? 0 };
}

export async function getPaymentDisclosuresByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(paymentDisclosures)
    .where(eq(paymentDisclosures.userId, userId))
    .orderBy(desc(paymentDisclosures.agreedAt));
}

export async function getPaymentDisclosureById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.select().from(paymentDisclosures)
    .where(eq(paymentDisclosures.id, id))
    .limit(1);
  return row ?? null;
}

// ─── SMS Verification Codes ─────────────────────────────────────────────────

export async function createSmsVerificationCode(data: typeof smsVerificationCodes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(smsVerificationCodes).values(data);
  const [row] = await db.select().from(smsVerificationCodes)
    .where(and(
      eq(smsVerificationCodes.userId, data.userId),
      eq(smsVerificationCodes.code, data.code)
    ))
    .orderBy(desc(smsVerificationCodes.id))
    .limit(1);
  return row;
}

export async function getLatestSmsCode(userId: number, phone: string, purpose: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.select().from(smsVerificationCodes)
    .where(and(
      eq(smsVerificationCodes.userId, userId),
      eq(smsVerificationCodes.phone, phone),
      eq(smsVerificationCodes.purpose, purpose),
      eq(smsVerificationCodes.verified, false)
    ))
    .orderBy(desc(smsVerificationCodes.id))
    .limit(1);
  return row ?? null;
}

export async function markSmsCodeVerified(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(smsVerificationCodes)
    .set({ verified: true, verifiedAt: new Date() })
    .where(eq(smsVerificationCodes.id, id));
}

export async function incrementSmsAttempts(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(smsVerificationCodes)
    .set({ attempts: sql`${smsVerificationCodes.attempts} + 1` })
    .where(eq(smsVerificationCodes.id, id));
}

// ─── Trial Logins ───────────────────────────────────────────────────────────
export async function createTrialLogin(data: { email: string; ipAddress: string; userAgent?: string; sessionToken: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { trialLogins } = await import("../drizzle/schema");
  const result = await db.insert(trialLogins).values(data).$returningId();
  return result[0];
}

export async function getTrialLoginByToken(sessionToken: string) {
  const db = await getDb();
  if (!db) return null;
  const { trialLogins } = await import("../drizzle/schema");
  const rows = await db.select().from(trialLogins).where(eq(trialLogins.sessionToken, sessionToken)).limit(1);
  return rows[0] ?? null;
}

export async function getAllTrialLogins() {
  const db = await getDb();
  if (!db) return [];
  const { trialLogins } = await import("../drizzle/schema");
  return db.select().from(trialLogins).orderBy(desc(trialLogins.createdAt)).limit(200);
}

export async function logoutTrialLogin(sessionToken: string) {
  const db = await getDb();
  if (!db) return;
  const { trialLogins } = await import("../drizzle/schema");
  await db.update(trialLogins).set({ loggedOutAt: new Date() }).where(eq(trialLogins.sessionToken, sessionToken));
}

export async function hasEmailUsedTrial(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { trialLogins } = await import("../drizzle/schema");
  const rows = await db.select({ id: trialLogins.id }).from(trialLogins).where(eq(trialLogins.email, email.toLowerCase())).limit(1);
  return rows.length > 0;
}


// ─── Subscription Gate Helpers ────────────────────────────────────────────────

/** Sam Russell's emails — permanently exempt from ALL access restrictions */

/** Increment login count for a registered user */
export async function incrementLoginCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ loginCount: sql`${users.loginCount} + 1` }).where(eq(users.id, userId));
}

/** Check if a registered user has an active subscription (via their workspace) */
export async function hasActiveSubscriptionByUserId(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Find user's workspace
  const ws = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.ownerId, userId)).limit(1);
  if (ws.length === 0) {
    // Check membership
    const mem = await db.select({ workspaceId: memberships.workspaceId }).from(memberships).where(eq(memberships.userId, userId)).limit(1);
    if (mem.length === 0) return false;
    const sub = await db.select().from(workspaceSubscriptions)
      .where(and(
        eq(workspaceSubscriptions.workspaceId, mem[0].workspaceId),
        inArray(workspaceSubscriptions.status, ["ACTIVE", "TRIALING"])
      )).limit(1);
    return sub.length > 0;
  }
  const sub = await db.select().from(workspaceSubscriptions)
    .where(and(
      eq(workspaceSubscriptions.workspaceId, ws[0].id),
      inArray(workspaceSubscriptions.status, ["ACTIVE", "TRIALING"])
    )).limit(1);
  return sub.length > 0;
}

/** Check if an email is Sam Russell (exempt from ALL access restrictions — forever) */
export { isOwnerBypassEmail as isOwnerEmail } from "@shared/accessControl";

// ─── Admin Helpers ───────────────────────────────────────────────────────────

export { isOwnerBypassEmail as isAdminEmail } from "@shared/accessControl";

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    loginMethod: users.loginMethod,
    loginCount: users.loginCount,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
    onboardingCompleted: users.onboardingCompleted,
  }).from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function deleteUserById(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(users).where(eq(users.id, userId));
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalClients: 0, totalDeals: 0, totalTrialLogins: 0, totalScenarios: 0 };
  const { trialLogins } = await import("../drizzle/schema");
  const [userCount] = await db.select({ count: count() }).from(users);
  const [clientCount] = await db.select({ count: count() }).from(clients);
  const [dealCount] = await db.select({ count: count() }).from(deals);
  const [trialCount] = await db.select({ count: count() }).from(trialLogins);
  const [scenarioCount] = await db.select({ count: count() }).from(scenarioSnapshots);
  return {
    totalUsers: userCount?.count ?? 0,
    totalClients: clientCount?.count ?? 0,
    totalDeals: dealCount?.count ?? 0,
    totalTrialLogins: trialCount?.count ?? 0,
    totalScenarios: scenarioCount?.count ?? 0,
  };
}

export async function getPageActivitySummary() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    pagePath: pageActivityLogs.pagePath,
    totalVisits: count(),
  }).from(pageActivityLogs)
    .groupBy(pageActivityLogs.pagePath)
    .orderBy(desc(count()));
  return rows;
}


// ─── Advisor Account Helpers (Trial Timer & Access Tier) ────────────────────

export async function getOrCreateAdvisorAccount(email: string, accessTier: "trial" | "unlimited" = "trial") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { advisorAccounts } = await import("../drizzle/schema");
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await db.select().from(advisorAccounts).where(eq(advisorAccounts.email, normalizedEmail)).limit(1);
  if (existing.length > 0) {
    // If upgrading from trial to unlimited, update the tier
    if (accessTier === "unlimited" && existing[0].accessTier === "trial") {
      await db.update(advisorAccounts).set({ accessTier: "unlimited" }).where(eq(advisorAccounts.id, existing[0].id));
      return { ...existing[0], accessTier: "unlimited" as const };
    }
    return existing[0];
  }
  const result = await db.insert(advisorAccounts).values({ email: normalizedEmail, accessTier }).$returningId();
  return { id: result[0].id, email: normalizedEmail, accessTier, trialSecondsUsed: 0, trialAccessCount: 0, passwordType: "none" as const, planSlug: null, subscriptionStatus: "none" as const, stripeCustomerId: null, stripeSubscriptionId: null, lastHeartbeatAt: null, createdAt: new Date(), updatedAt: new Date() };
}

export async function getAdvisorAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const { advisorAccounts } = await import("../drizzle/schema");
  const rows = await db.select().from(advisorAccounts).where(eq(advisorAccounts.email, email.toLowerCase().trim())).limit(1);
  return rows[0] ?? null;
}

/** Heartbeat: add elapsed seconds to the cumulative trial timer */
export async function advisorHeartbeat(email: string, elapsedSeconds: number): Promise<{ trialSecondsUsed: number; accessTier: string; subscriptionStatus: string }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { advisorAccounts } = await import("../drizzle/schema");
  const normalizedEmail = email.toLowerCase().trim();
  // Atomic increment
  await db.update(advisorAccounts)
    .set({
      trialSecondsUsed: sql`${advisorAccounts.trialSecondsUsed} + ${elapsedSeconds}`,
      lastHeartbeatAt: new Date(),
    })
    .where(eq(advisorAccounts.email, normalizedEmail));
  // Return updated values
  const rows = await db.select({
    trialSecondsUsed: advisorAccounts.trialSecondsUsed,
    accessTier: advisorAccounts.accessTier,
    subscriptionStatus: advisorAccounts.subscriptionStatus,
  }).from(advisorAccounts).where(eq(advisorAccounts.email, normalizedEmail)).limit(1);
  return rows[0] ?? { trialSecondsUsed: 0, accessTier: "trial", subscriptionStatus: "none" };
}

/** Update Stripe subscription info on an advisor account */
export async function updateAdvisorSubscription(email: string, data: { stripeCustomerId?: string; stripeSubscriptionId?: string; subscriptionStatus?: "none" | "active" | "past_due" | "canceled"; accessTier?: "trial" | "unlimited" | "subscriber" }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { advisorAccounts } = await import("../drizzle/schema");
  await db.update(advisorAccounts).set(data).where(eq(advisorAccounts.email, email.toLowerCase().trim()));
}

const TRIAL_LIMIT_SECONDS = 5 * 60 * 60; // 5 hours = 18000 seconds

/** Check if a trial user's time has expired */
export function isTrialExpired(trialSecondsUsed: number): boolean {
  return trialSecondsUsed >= TRIAL_LIMIT_SECONDS;
}

export { TRIAL_LIMIT_SECONDS };

export async function incrementTrialAccessCount(email: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { advisorAccounts } = await import("../drizzle/schema");
  await db.update(advisorAccounts)
    .set({ trialAccessCount: sql`${advisorAccounts.trialAccessCount} + 1` })
    .where(eq(advisorAccounts.email, email.toLowerCase().trim()));
}

export function isOwnerRecoveryEmail(email: string): boolean {
  return email.toLowerCase().trim() === "sam@russellcapitalsystems.com";
}

export const MAX_TRIAL_ACCESSES = 5;

// ─── Risk Snapshots (Living Risk Profile) ────────────────────────────────────

export async function saveRiskSnapshot(data: {
  clientId: number;
  workspaceId: number;
  advisorId?: number;
  overallScore: number;
  depthLevel: number;
  questionsAnswered: number;
  categories: Array<{ key: string; label: string; score: number }>;
  marketContext?: { sp500YTD: number; vixLevel: number; fedRate: number } | null;
  riskCategory?: string;
  trigger?: string;
  driftScore?: number;
  flaggedForReassessment?: boolean;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(riskSnapshots).values({
    clientId: data.clientId,
    workspaceId: data.workspaceId,
    advisorId: data.advisorId ?? null,
    overallScore: data.overallScore,
    depthLevel: data.depthLevel,
    questionsAnswered: data.questionsAnswered,
    categories: data.categories,
    marketContext: data.marketContext ?? null,
    riskCategory: data.riskCategory ?? null,
    trigger: data.trigger ?? "initial",
    driftScore: data.driftScore ?? null,
    flaggedForReassessment: data.flaggedForReassessment ?? false,
    notes: data.notes ?? null,
  }).$returningId();
  return result;
}

export async function getRiskSnapshotHistory(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(riskSnapshots)
    .where(and(eq(riskSnapshots.clientId, clientId), eq(riskSnapshots.workspaceId, workspaceId)))
    .orderBy(desc(riskSnapshots.createdAt));
}

export async function getLatestRiskSnapshot(clientId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(riskSnapshots)
    .where(and(eq(riskSnapshots.clientId, clientId), eq(riskSnapshots.workspaceId, workspaceId)))
    .orderBy(desc(riskSnapshots.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Batch Schedules ─────────────────────────────────────────────────────────
export async function listBatchSchedules(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batchSchedules).where(eq(batchSchedules.workspaceId, workspaceId)).orderBy(desc(batchSchedules.createdAt));
}

export async function createBatchSchedule(data: typeof batchSchedules.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(batchSchedules).values(data).$returningId();
  return result;
}

export async function updateBatchSchedule(id: number, workspaceId: number, data: Partial<{ name: string; description: string | null; frequency: string; paused: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(batchSchedules).set({ ...data, updatedAt: new Date() }).where(and(eq(batchSchedules.id, id), eq(batchSchedules.workspaceId, workspaceId)));
}

export async function deleteBatchSchedule(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(batchSchedules).where(and(eq(batchSchedules.id, id), eq(batchSchedules.workspaceId, workspaceId)));
}

// ─── Saved Slide Decks ───────────────────────────────────────────────────────────────────────
export async function listSlideDecks(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedSlideDecks).where(eq(savedSlideDecks.workspaceId, workspaceId)).orderBy(desc(savedSlideDecks.createdAt));
}

export async function getSlideDeckById(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(savedSlideDecks).where(and(eq(savedSlideDecks.id, id), eq(savedSlideDecks.workspaceId, workspaceId))).limit(1);
  return rows[0] ?? null;
}

export async function createSlideDeck(data: typeof savedSlideDecks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(savedSlideDecks).values(data).$returningId();
  return result;
}

export async function updateSlideDeck(id: number, workspaceId: number, data: Partial<{ title: string; slides: any; audience: string; pptxUrl: string | null }>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(savedSlideDecks).set({ ...data, updatedAt: new Date() } as any).where(and(eq(savedSlideDecks.id, id), eq(savedSlideDecks.workspaceId, workspaceId)));
}

export async function deleteSlideDeck(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(savedSlideDecks).where(and(eq(savedSlideDecks.id, id), eq(savedSlideDecks.workspaceId, workspaceId)));
}

// ─── Owner Trusted IPs ──────────────────────────────────────────────────────
export async function addOwnerTrustedIp(ip: string, label?: string) {
  const db = await getDb();
  if (!db) return;
  const { ownerTrustedIps } = await import("../drizzle/schema");
  const existing = await db.select().from(ownerTrustedIps).where(eq(ownerTrustedIps.ipAddress, ip)).limit(1);
  if (existing.length > 0) {
    await db.update(ownerTrustedIps).set({ loginCount: sql`loginCount + 1`, lastUsedAt: new Date() }).where(eq(ownerTrustedIps.ipAddress, ip));
  } else {
    await db.insert(ownerTrustedIps).values({ ipAddress: ip, label: label || "auto", loginCount: 1 });
  }
}

export async function isOwnerTrustedIp(ip: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { ownerTrustedIps } = await import("../drizzle/schema");
  const rows = await db.select({ id: ownerTrustedIps.id }).from(ownerTrustedIps).where(eq(ownerTrustedIps.ipAddress, ip)).limit(1);
  return rows.length > 0;
}

export async function bumpOwnerTrustedIp(ip: string) {
  const db = await getDb();
  if (!db) return;
  const { ownerTrustedIps } = await import("../drizzle/schema");
  await db.update(ownerTrustedIps).set({ loginCount: sql`loginCount + 1`, lastUsedAt: new Date() }).where(eq(ownerTrustedIps.ipAddress, ip));
}

export async function getOwnerTrustedIps() {
  const db = await getDb();
  if (!db) return [];
  const { ownerTrustedIps } = await import("../drizzle/schema");
  return db.select().from(ownerTrustedIps).orderBy(desc(ownerTrustedIps.lastUsedAt));
}

export async function removeOwnerTrustedIp(id: number) {
  const db = await getDb();
  if (!db) return;
  const { ownerTrustedIps } = await import("../drizzle/schema");
  await db.delete(ownerTrustedIps).where(eq(ownerTrustedIps.id, id));
}

// ─── Slide Comments ─────────────────────────────────────────────────────────
export async function addSlideComment(data: { deckId: number; slideIndex?: number; userId: number; userName: string; userEmail?: string; content: string; parentId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { slideComments } = await import("../drizzle/schema");
  const [row] = await db.insert(slideComments).values(data).$returningId();
  return row;
}

export async function getSlideComments(deckId: number) {
  const db = await getDb();
  if (!db) return [];
  const { slideComments } = await import("../drizzle/schema");
  return db.select().from(slideComments).where(eq(slideComments.deckId, deckId)).orderBy(slideComments.createdAt);
}

export async function resolveSlideComment(id: number) {
  const db = await getDb();
  if (!db) return;
  const { slideComments } = await import("../drizzle/schema");
  await db.update(slideComments).set({ resolved: true }).where(eq(slideComments.id, id));
}

export async function deleteSlideComment(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const { slideComments } = await import("../drizzle/schema");
  await db.delete(slideComments).where(and(eq(slideComments.id, id), eq(slideComments.userId, userId)));
}

// ─── Slide Shares ───────────────────────────────────────────────────────────
export async function createSlideShare(data: { deckId: number; sharedByUserId: number; sharedWithEmail: string; permission?: "view" | "comment" | "edit" }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { slideShares } = await import("../drizzle/schema");
  const shareToken = randomBytes(24).toString("hex");
  const [row] = await db.insert(slideShares).values({ ...data, shareToken, permission: data.permission || "comment" }).$returningId();
  return { id: row.id, shareToken };
}

export async function getSlideShares(deckId: number) {
  const db = await getDb();
  if (!db) return [];
  const { slideShares } = await import("../drizzle/schema");
  return db.select().from(slideShares).where(eq(slideShares.deckId, deckId)).orderBy(desc(slideShares.createdAt));
}

export async function getSlideShareByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const { slideShares } = await import("../drizzle/schema");
  const rows = await db.select().from(slideShares).where(eq(slideShares.shareToken, token)).limit(1);
  if (rows.length === 0) return null;
  await db.update(slideShares).set({ accessedAt: new Date() }).where(eq(slideShares.id, rows[0].id));
  return rows[0];
}

export async function deleteSlideShare(id: number) {
  const db = await getDb();
  if (!db) return;
  const { slideShares } = await import("../drizzle/schema");
  await db.delete(slideShares).where(eq(slideShares.id, id));
}

// ─── Owner Analytics Helpers ────────────────────────────────────────────────
export async function getOwnerAnalyticsSummary() {
  const db = await getDb();
  if (!db) return null;
  const { users, clients, trialLogins, userSessions, savedSlideDecks, advisorAccounts } = await import("../drizzle/schema");
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [uCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [cCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
  const [tCount] = await db.select({ count: sql<number>`count(*)` }).from(trialLogins);
  const [sCount] = await db.select({ count: sql<number>`count(*)` }).from(userSessions);
  const [deckCount] = await db.select({ count: sql<number>`count(*)` }).from(savedSlideDecks);
  const [activeNow] = await db.select({ count: sql<number>`count(*)` }).from(userSessions).where(eq(userSessions.isActive, true));
  const [last24h] = await db.select({ count: sql<number>`count(*)` }).from(trialLogins).where(sql`createdAt >= ${dayAgo}`);
  const [last7d] = await db.select({ count: sql<number>`count(*)` }).from(trialLogins).where(sql`createdAt >= ${weekAgo}`);
  const [advisorCount] = await db.select({ count: sql<number>`count(*)` }).from(advisorAccounts);
  const [subscriberCount] = await db.select({ count: sql<number>`count(*)` }).from(advisorAccounts).where(eq(advisorAccounts.subscriptionStatus, "active"));

  return {
    totalUsers: Number(uCount.count),
    totalClients: Number(cCount.count),
    totalLogins: Number(tCount.count),
    totalSessions: Number(sCount.count),
    totalDecks: Number(deckCount.count),
    activeSessions: Number(activeNow.count),
    loginsLast24h: Number(last24h.count),
    loginsLast7d: Number(last7d.count),
    totalAdvisors: Number(advisorCount.count),
    activeSubscribers: Number(subscriberCount.count),
  };
}

export async function getTopPages(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.execute(sql`
    SELECT pagePath, pageTitle, COUNT(*) as visits, SUM(COALESCE(durationSecs, 0)) as totalSeconds, COUNT(DISTINCT userId) as uniqueUsers
    FROM page_activity_logs
    GROUP BY pagePath, pageTitle
    ORDER BY visits DESC
    LIMIT ${limit}
  `).then(([rows]) => (rows as unknown) as any[]);
}

export async function getRecentLogins(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const { trialLogins } = await import("../drizzle/schema");
  return db.select().from(trialLogins).orderBy(desc(trialLogins.createdAt)).limit(limit);
}

export async function getConversionFunnel() {
  const db = await getDb();
  if (!db) return { visitors: 0, trialUsers: 0, subscribers: 0, conversionRate: 0 };
  const { advisorAccounts } = await import("../drizzle/schema");
  const all = await db.select().from(advisorAccounts);
  const trialUsers = all.length;
  const subscribers = all.filter(a => a.subscriptionStatus === "active").length;
  return {
    visitors: trialUsers,
    trialUsers,
    subscribers,
    conversionRate: trialUsers > 0 ? Math.round((subscribers / trialUsers) * 100) : 0,
  };
}

// ─── Sidebar Favorites ──────────────────────────────────────────────────────
export async function getSidebarFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sidebarFavorites)
    .where(eq(sidebarFavorites.userId, userId))
    .orderBy(asc(sidebarFavorites.sortOrder), asc(sidebarFavorites.createdAt));
}

export async function addSidebarFavorite(userId: number, path: string, label: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Get max sortOrder for this user
  const existing = await db.select().from(sidebarFavorites)
    .where(and(eq(sidebarFavorites.userId, userId), eq(sidebarFavorites.path, path))).limit(1);
  if (existing.length > 0) return existing[0]; // Already favorited
  const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(${sidebarFavorites.sortOrder}), 0)` })
    .from(sidebarFavorites).where(eq(sidebarFavorites.userId, userId));
  const nextOrder = (maxOrder[0]?.max ?? 0) + 1;
  await db.insert(sidebarFavorites).values({ userId, path, label, sortOrder: nextOrder });
  const created = await db.select().from(sidebarFavorites)
    .where(and(eq(sidebarFavorites.userId, userId), eq(sidebarFavorites.path, path))).limit(1);
  return created[0];
}

export async function removeSidebarFavorite(userId: number, path: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(sidebarFavorites)
    .where(and(eq(sidebarFavorites.userId, userId), eq(sidebarFavorites.path, path)));
}


// ─── Slide Usage Tracking ───────────────────────────────────────────────────
export async function logSlideUsage(data: {
  userId?: number | null;
  email?: string | null;
  accessTier: "trial" | "unlimited" | "subscriber" | "owner";
  topic?: string | null;
  toolName?: string | null;
  slideCount: number;
  audience: "client" | "advisor" | "team";
  action: "generate" | "export_pptx" | "save";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(slideUsage).values({
    userId: data.userId ?? null,
    email: data.email ?? null,
    accessTier: data.accessTier,
    topic: data.topic ?? null,
    toolName: data.toolName ?? null,
    slideCount: data.slideCount,
    audience: data.audience,
    action: data.action,
  });
}

/** Count how many slide generations a user has done today (UTC day) */
export async function getTrialSlideCountToday(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const rows = await db.select({ cnt: sql<number>`COUNT(*)` })
    .from(slideUsage)
    .where(and(
      eq(slideUsage.userId, userId),
      eq(slideUsage.action, "generate"),
      gte(slideUsage.createdAt, todayStart),
    ));
  return Number(rows[0]?.cnt ?? 0);
}

/** Get slide usage analytics: topic popularity, daily counts, tier breakdown */
export async function getSlideUsageAnalytics() {
  const db = await getDb();
  if (!db) return { byTopic: [], byDay: [], byTier: [], total: 0 };

  // By topic
  const byTopic = await db.select({
    topic: slideUsage.topic,
    count: sql<number>`COUNT(*)`,
  }).from(slideUsage).where(eq(slideUsage.action, "generate")).groupBy(slideUsage.topic).orderBy(desc(sql`COUNT(*)`)).limit(20);

  // By day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const byDay = await db.select({
    day: sql<string>`DATE(createdAt)`,
    count: sql<number>`COUNT(*)`,
  }).from(slideUsage).where(and(eq(slideUsage.action, "generate"), gte(slideUsage.createdAt, thirtyDaysAgo))).groupBy(sql`DATE(createdAt)`).orderBy(sql`DATE(createdAt)`);

  // By tier
  const byTier = await db.select({
    tier: slideUsage.accessTier,
    count: sql<number>`COUNT(*)`,
  }).from(slideUsage).where(eq(slideUsage.action, "generate")).groupBy(slideUsage.accessTier);

  // Total
  const totalRows = await db.select({ cnt: sql<number>`COUNT(*)` }).from(slideUsage).where(eq(slideUsage.action, "generate"));

  return {
    byTopic: byTopic.map(r => ({ topic: r.topic || "Custom Prompt", count: Number(r.count) })),
    byDay: byDay.map(r => ({ day: String(r.day), count: Number(r.count) })),
    byTier: byTier.map(r => ({ tier: r.tier, count: Number(r.count) })),
    total: Number(totalRows[0]?.cnt ?? 0),
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// FINANCIAL REELS — Query Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Get paginated reel feed, excluding already-viewed reels for the user */
export async function getReelFeed(userId: number | null, cursor?: number, limit = 15) {
  const db = await getDb();
  if (!db) return { items: [], hasMore: false, nextCursor: undefined };

  const conditions = [eq(financialReels.isActive, true)];
  if (cursor) conditions.push(gte(financialReels.id, cursor));

  // Get viewed reel IDs for this user to exclude them
  let viewedIds: number[] = [];
  if (userId) {
    const viewed = await db.select({ reelId: reelInteractions.reelId })
      .from(reelInteractions)
      .where(and(eq(reelInteractions.userId, userId), eq(reelInteractions.action, "view")));
    viewedIds = viewed.map(v => v.reelId);
  }

  let query = db.select().from(financialReels)
    .where(and(...conditions))
    .orderBy(asc(financialReels.sortOrder), asc(financialReels.id))
    .limit(limit + 1);

  const rows = await query;
  
  // Filter out viewed reels (in-memory since SQL NOT IN with large lists is slow)
  const viewedSet = new Set(viewedIds);
  const filtered = rows.filter(r => !viewedSet.has(r.id));
  
  // If we filtered too many, just return what we have
  const items = filtered.slice(0, limit);
  const hasMore = filtered.length > limit || rows.length > limit;
  const nextCursor = items.length > 0 ? items[items.length - 1].id + 1 : undefined;

  return { items, hasMore, nextCursor };
}

/** Record a reel interaction (view, like, save, share) */
export async function recordReelInteraction(userId: number, reelId: number, action: "view" | "like" | "save" | "share") {
  const db = await getDb();
  if (!db) return;

  // For views, check if already viewed to avoid duplicates
  if (action === "view") {
    const existing = await db.select({ id: reelInteractions.id })
      .from(reelInteractions)
      .where(and(
        eq(reelInteractions.userId, userId),
        eq(reelInteractions.reelId, reelId),
        eq(reelInteractions.action, "view")
      ))
      .limit(1);
    if (existing.length > 0) return;
  }

  await db.insert(reelInteractions).values({ userId, reelId, action });

  // Update counters on the reel
  const counterField = action === "view" ? financialReels.viewCount
    : action === "like" ? financialReels.likeCount
    : action === "save" ? financialReels.saveCount
    : financialReels.shareCount;

  await db.update(financialReels)
    .set({ [counterField.name]: sql`${counterField} + 1` })
    .where(eq(financialReels.id, reelId));
}

/** Toggle like on a reel — returns new liked state */
export async function toggleReelLike(userId: number, reelId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const existing = await db.select({ id: reelInteractions.id })
    .from(reelInteractions)
    .where(and(
      eq(reelInteractions.userId, userId),
      eq(reelInteractions.reelId, reelId),
      eq(reelInteractions.action, "like")
    ))
    .limit(1);

  if (existing.length > 0) {
    // Unlike
    await db.delete(reelInteractions).where(eq(reelInteractions.id, existing[0].id));
    await db.update(financialReels)
      .set({ likeCount: sql`GREATEST(${financialReels.likeCount} - 1, 0)` })
      .where(eq(financialReels.id, reelId));
    return false;
  } else {
    // Like
    await db.insert(reelInteractions).values({ userId, reelId, action: "like" });
    await db.update(financialReels)
      .set({ likeCount: sql`${financialReels.likeCount} + 1` })
      .where(eq(financialReels.id, reelId));
    return true;
  }
}

/** Toggle save on a reel — returns new saved state */
export async function toggleReelSave(userId: number, reelId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const existing = await db.select({ id: reelInteractions.id })
    .from(reelInteractions)
    .where(and(
      eq(reelInteractions.userId, userId),
      eq(reelInteractions.reelId, reelId),
      eq(reelInteractions.action, "save")
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(reelInteractions).where(eq(reelInteractions.id, existing[0].id));
    await db.update(financialReels)
      .set({ saveCount: sql`GREATEST(${financialReels.saveCount} - 1, 0)` })
      .where(eq(financialReels.id, reelId));
    return false;
  } else {
    await db.insert(reelInteractions).values({ userId, reelId, action: "save" });
    await db.update(financialReels)
      .set({ saveCount: sql`${financialReels.saveCount} + 1` })
      .where(eq(financialReels.id, reelId));
    return true;
  }
}

/** Get user's saved reels */
export async function getUserSavedReels(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const saved = await db.select({ reelId: reelInteractions.reelId })
    .from(reelInteractions)
    .where(and(eq(reelInteractions.userId, userId), eq(reelInteractions.action, "save")));

  if (saved.length === 0) return [];

  const ids = saved.map(s => s.reelId);
  return db.select().from(financialReels).where(inArray(financialReels.id, ids));
}

/** Get user's liked reel IDs */
export async function getUserLikedReelIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const liked = await db.select({ reelId: reelInteractions.reelId })
    .from(reelInteractions)
    .where(and(eq(reelInteractions.userId, userId), eq(reelInteractions.action, "like")));

  return liked.map(l => l.reelId);
}

/** Get user's saved reel IDs */
export async function getUserSavedReelIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const saved = await db.select({ reelId: reelInteractions.reelId })
    .from(reelInteractions)
    .where(and(eq(reelInteractions.userId, userId), eq(reelInteractions.action, "save")));

  return saved.map(s => s.reelId);
}


// ─── Video Proposals (HeyGen) ────────────────────────────────────────────────
export async function createVideoProposal(data: typeof videoProposals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(videoProposals).values(data);
  const created = await db.select().from(videoProposals)
    .where(and(eq(videoProposals.userId, data.userId), eq(videoProposals.workspaceId, data.workspaceId)))
    .orderBy(desc(videoProposals.createdAt)).limit(1);
  return created[0];
}

export async function getVideoProposals(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoProposals)
    .where(eq(videoProposals.workspaceId, workspaceId))
    .orderBy(desc(videoProposals.createdAt));
}

export async function getVideoProposalById(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(videoProposals)
    .where(and(eq(videoProposals.id, id), eq(videoProposals.workspaceId, workspaceId)))
    .limit(1);
  return result[0] ?? null;
}

export async function getVideoProposalByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(videoProposals)
    .where(eq(videoProposals.shareToken, shareToken))
    .limit(1);
  return result[0] ?? null;
}

export async function updateVideoProposal(id: number, data: Partial<typeof videoProposals.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(videoProposals).set(data).where(eq(videoProposals.id, id));
}

export async function createVideoProposalChapters(chapters: (typeof videoProposalChapters.$inferInsert)[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (chapters.length === 0) return;
  await db.insert(videoProposalChapters).values(chapters);
}

export async function getVideoProposalChapters(proposalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoProposalChapters)
    .where(eq(videoProposalChapters.proposalId, proposalId))
    .orderBy(asc(videoProposalChapters.chapterIndex));
}

export async function updateVideoProposalChapter(id: number, data: Partial<typeof videoProposalChapters.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(videoProposalChapters).set(data).where(eq(videoProposalChapters.id, id));
}

export async function deleteVideoProposalChapters(proposalId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(videoProposalChapters).where(eq(videoProposalChapters.proposalId, proposalId));
}

export async function recordVideoEngagement(data: typeof videoEngagementEvents.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(videoEngagementEvents).values(data);
}

export async function getVideoEngagementStats(proposalId: number) {
  const db = await getDb();
  if (!db) return { totalViews: 0, uniqueViewers: 0, avgWatchPercent: 0, completionRate: 0, chapterHeatmap: [] as { chapterIndex: number; views: number; replays: number }[] };
  
  const events = await db.select().from(videoEngagementEvents)
    .where(eq(videoEngagementEvents.proposalId, proposalId));
  
  const playEvents = events.filter(e => e.eventType === "play");
  const completeEvents = events.filter(e => e.eventType === "complete");
  const uniqueViewerIds = new Set(events.filter(e => e.viewerId).map(e => e.viewerId));
  
  const avgWatchPercent = events.filter(e => e.percentWatched != null).length > 0
    ? events.filter(e => e.percentWatched != null).reduce((sum, e) => sum + (e.percentWatched || 0), 0) / events.filter(e => e.percentWatched != null).length
    : 0;
  
  // Chapter heatmap
  const chapterEnters = events.filter(e => e.eventType === "chapter_enter");
  const chapterReplays = events.filter(e => e.eventType === "replay_section");
  const chapterMap = new Map<number, { views: number; replays: number }>();
  chapterEnters.forEach(e => {
    const idx = e.chapterIndex ?? 0;
    const existing = chapterMap.get(idx) || { views: 0, replays: 0 };
    existing.views++;
    chapterMap.set(idx, existing);
  });
  chapterReplays.forEach(e => {
    const idx = e.chapterIndex ?? 0;
    const existing = chapterMap.get(idx) || { views: 0, replays: 0 };
    existing.replays++;
    chapterMap.set(idx, existing);
  });
  
  return {
    totalViews: playEvents.length,
    uniqueViewers: uniqueViewerIds.size,
    avgWatchPercent: Math.round(avgWatchPercent),
    completionRate: playEvents.length > 0 ? Math.round((completeEvents.length / playEvents.length) * 100) : 0,
    chapterHeatmap: Array.from(chapterMap.entries()).map(([chapterIndex, stats]) => ({ chapterIndex, ...stats })).sort((a, b) => a.chapterIndex - b.chapterIndex),
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

export async function logError(data: {
  userId?: number | null;
  source: string;
  level: string;
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  url?: string | null;
  userAgent?: string | null;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) { console.error("[ErrorLog] DB unavailable:", data.message); return; }
  await db.insert(errorLogs).values({
    userId: data.userId ?? null,
    source: data.source,
    level: data.level,
    message: data.message,
    stack: data.stack ?? null,
    componentStack: data.componentStack ?? null,
    url: data.url ?? null,
    userAgent: data.userAgent ?? null,
    metadata: data.metadata ?? null,
  });
}

export async function getErrorLogs(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(errorLogs).orderBy(desc(errorLogs.createdAt)).limit(limit).offset(offset);
}

export async function getErrorLogStats() {
  const db = await getDb();
  if (!db) return { total: 0, last24h: 0, last7d: 0 };
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const [allErrors, recentErrors, weekErrors] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(errorLogs),
    db.select({ count: sql<number>`count(*)` }).from(errorLogs).where(gte(errorLogs.createdAt, dayAgo)),
    db.select({ count: sql<number>`count(*)` }).from(errorLogs).where(gte(errorLogs.createdAt, weekAgo)),
  ]);
  return {
    total: allErrors[0]?.count ?? 0,
    last24h: recentErrors[0]?.count ?? 0,
    last7d: weekErrors[0]?.count ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEAL SCORING (persist to DB)
// ═══════════════════════════════════════════════════════════════════════════════
export async function saveDealScore(data: {
  dealId: number;
  workspaceId: number;
  score: number;
  confidence: string;
  factors?: any;
  recommendation?: string;
  scoredBy?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(dealScores).values({
    dealId: data.dealId,
    workspaceId: data.workspaceId,
    score: data.score,
    confidence: data.confidence,
    factors: data.factors ?? null,
    recommendation: data.recommendation ?? null,
    scoredBy: data.scoredBy ?? "ai",
  }).$returningId();
  return result;
}

export async function getDealScoreHistory(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealScores).where(eq(dealScores.dealId, dealId)).orderBy(desc(dealScores.scoredAt));
}

export async function getWorkspaceDealScores(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealScores).where(eq(dealScores.workspaceId, workspaceId)).orderBy(desc(dealScores.scoredAt)).limit(100);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
export async function createReportExport(data: {
  userId: number;
  workspaceId: number;
  clientId?: number | null;
  reportType: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(reportExports).values({
    userId: data.userId,
    workspaceId: data.workspaceId,
    clientId: data.clientId ?? null,
    reportType: data.reportType,
    status: "pending",
    metadata: data.metadata ?? null,
  }).$returningId();
  return result;
}

export async function updateReportExport(id: number, data: { status: string; fileUrl?: string; fileKey?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(reportExports).set({
    status: data.status,
    fileUrl: data.fileUrl,
    fileKey: data.fileKey,
    completedAt: data.status === "completed" ? new Date() : undefined,
  }).where(eq(reportExports.id, id));
}

export async function getReportExportsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reportExports).where(eq(reportExports.userId, userId)).orderBy(desc(reportExports.createdAt)).limit(50);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT PORTAL SESSIONS (enhanced with DB persistence)
// ═══════════════════════════════════════════════════════════════════════════════
export async function createClientPortalSessionDb(data: {
  clientId: number;
  workspaceId: number;
  token: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(clientPortalSessions).values(data).$returningId();
  return result;
}

export async function validateClientPortalSessionDb(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [session] = await db.select().from(clientPortalSessions)
    .where(and(eq(clientPortalSessions.token, token), gte(clientPortalSessions.expiresAt, new Date())));
  if (session) {
    await db.update(clientPortalSessions).set({ lastAccessedAt: new Date() }).where(eq(clientPortalSessions.id, session.id));
  }
  return session ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR EVENTS
// ═══════════════════════════════════════════════════════════════════════════════
export async function createCalendarEventDb(data: {
  userId: number;
  workspaceId: number;
  clientId?: number | null;
  googleEventId?: string | null;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  meetingType?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(calendarEvents).values({
    userId: data.userId,
    workspaceId: data.workspaceId,
    clientId: data.clientId ?? null,
    googleEventId: data.googleEventId ?? null,
    title: data.title,
    description: data.description ?? null,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location ?? null,
    meetingType: data.meetingType ?? "general",
    status: "scheduled",
    metadata: data.metadata ?? null,
  }).$returningId();
  return result;
}

export async function getCalendarEventsByUser(userId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(calendarEvents.userId, userId)];
  if (from) conditions.push(gte(calendarEvents.startTime, from));
  if (to) conditions.push(lte(calendarEvents.endTime, to));
  return db.select().from(calendarEvents).where(and(...conditions)).orderBy(asc(calendarEvents.startTime));
}

export async function getCalendarEventsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(eq(calendarEvents.clientId, clientId)).orderBy(desc(calendarEvents.startTime));
}

export async function updateCalendarEventDb(id: number, data: Partial<{
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  meetingType: string;
  status: string;
  googleEventId: string;
  metadata: any;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(calendarEvents).set({ ...data, updatedAt: new Date() }).where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEventDb(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

export async function getCalendarEventByGoogleId(googleEventId: string) {
  const db = await getDb();
  if (!db) return null;
  const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.googleEventId, googleEventId));
  return event ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALIAS FUNCTIONS — match the names used in routers.ts dynamic imports
// ═══════════════════════════════════════════════════════════════════════════════

export async function saveCalendarEvent(data: {
  workspaceId: number;
  userId: number;
  googleEventId?: string | null;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  attendees?: any;
  status?: string;
  meetingLink?: string | null;
  clientId?: number;
}) {
  return createCalendarEventDb({
    userId: data.userId,
    workspaceId: data.workspaceId,
    googleEventId: data.googleEventId ?? null,
    title: data.title,
    description: data.description ?? null,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    location: data.location ?? null,
    clientId: data.clientId ?? null,
    metadata: data.attendees ? { attendees: data.attendees, status: data.status, meetingLink: data.meetingLink } : null,
  });
}

export async function getCalendarEvents(workspaceId: number, userId: number, clientId?: number) {
  if (clientId) {
    return getCalendarEventsByClient(clientId);
  }
  return getCalendarEventsByUser(userId);
}

export async function updateCalendarEvent(id: number, data: Partial<{
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status?: string;
}>) {
  return updateCalendarEventDb(id, data as any);
}

export async function deleteCalendarEvent(id: number) {
  return deleteCalendarEventDb(id);
}

export async function saveReportExport(data: {
  workspaceId: number;
  userId: number;
  clientId: number;
  title: string;
  sections: string[];
  format: string;
  status: string;
}) {
  return createReportExport({
    userId: data.userId,
    workspaceId: data.workspaceId,
    clientId: data.clientId,
    reportType: data.format || "pdf",
    metadata: { title: data.title, sections: data.sections, status: data.status },
  });
}

export async function getReportExports(workspaceId: number, clientId?: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(reportExports.workspaceId, workspaceId)];
  if (clientId) conditions.push(eq(reportExports.clientId, clientId));
  return db.select().from(reportExports)
    .where(and(...conditions))
    .orderBy(desc(reportExports.createdAt))
    .limit(limit || 50);
}

export async function updateReportExportUrl(id: number, url: string) {
  return updateReportExport(id, { status: "completed", fileUrl: url });
}

// ─── Unified Planning Cases ─────────────────────────────────────────────────
export async function listPlanningCases(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planningCases)
    .where(eq(planningCases.workspaceId, workspaceId))
    .orderBy(desc(planningCases.updatedAt));
}

export async function getPlanningCaseById(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(planningCases)
    .where(and(eq(planningCases.id, id), eq(planningCases.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createPlanningCase(data: typeof planningCases.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(planningCases).values(data);
  const rows = await db.select().from(planningCases)
    .where(and(eq(planningCases.workspaceId, data.workspaceId), eq(planningCases.userId, data.userId)))
    .orderBy(desc(planningCases.id))
    .limit(1);
  return rows[0];
}

export async function updatePlanningCase(id: number, workspaceId: number, data: Partial<typeof planningCases.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(planningCases)
    .set({ ...data, lastSavedAt: new Date() })
    .where(and(eq(planningCases.id, id), eq(planningCases.workspaceId, workspaceId)));
  return getPlanningCaseById(id, workspaceId);
}

export async function listPlanningCaseNotes(planningCaseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planningCaseNotes)
    .where(eq(planningCaseNotes.planningCaseId, planningCaseId))
    .orderBy(desc(planningCaseNotes.createdAt));
}

export async function createPlanningCaseNote(data: typeof planningCaseNotes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(planningCaseNotes).values(data);
  const rows = await db.select().from(planningCaseNotes)
    .where(and(eq(planningCaseNotes.planningCaseId, data.planningCaseId), eq(planningCaseNotes.userId, data.userId)))
    .orderBy(desc(planningCaseNotes.id))
    .limit(1);
  return rows[0];
}

export async function resolvePlanningCaseNote(id: number, planningCaseId: number, resolved: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(planningCaseNotes)
    .set({ resolved })
    .where(and(eq(planningCaseNotes.id, id), eq(planningCaseNotes.planningCaseId, planningCaseId)));
}

export async function getUserPortalPreferences(userId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userPortalPreferences)
    .where(and(eq(userPortalPreferences.userId, userId), eq(userPortalPreferences.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertUserPortalPreferences(userId: number, workspaceId: number, data: Partial<typeof userPortalPreferences.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getUserPortalPreferences(userId, workspaceId);
  if (existing) {
    await db.update(userPortalPreferences)
      .set(data)
      .where(eq(userPortalPreferences.id, existing.id));
  } else {
    await db.insert(userPortalPreferences).values({ userId, workspaceId, ...data });
  }
  return getUserPortalPreferences(userId, workspaceId);
}
