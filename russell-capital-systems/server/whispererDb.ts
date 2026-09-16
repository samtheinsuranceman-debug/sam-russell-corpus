// ============================================================
// AI WHISPERER — storage.
//
// Three tables (settings, sessions, reports). The tables create themselves
// on first use with CREATE TABLE IF NOT EXISTS, because this host applies
// the schema by hand (scripts/DEPLOY.md), and a coaching feature that
// waits for a migration is a coaching feature that is off. The same
// tables are declared in drizzle/schema.ts so the exported schema file
// carries them too.
//
// Live calls are kept in memory as well as in the row, so a coaching poll
// never waits on a JSON column round trip; the row is the record.
// ============================================================
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { whispererReports, whispererSessions, whispererSettings, type WhispererReportRow, type WhispererSessionRow, type WhispererSettingsRow } from "../drizzle/schema";
import type { Coaching, Signal, Turn } from "@shared/whispererEngine";

const BOOTSTRAP = [
  `CREATE TABLE IF NOT EXISTS \`whisperer_settings\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`workspaceId\` int NOT NULL,
    \`advisorPhone\` varchar(30),
    \`advisorName\` varchar(200),
    \`smsEnabled\` boolean NOT NULL DEFAULT true,
    \`cycleMinutes\` int NOT NULL DEFAULT 5,
    \`reportsPerCycle\` int NOT NULL DEFAULT 5,
    \`zoomUserEmail\` varchar(320),
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`whisperer_settings_workspace\` (\`workspaceId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`whisperer_sessions\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`workspaceId\` int NOT NULL,
    \`clientId\` int,
    \`clientName\` varchar(200) NOT NULL,
    \`advisorUserId\` int,
    \`advisorName\` varchar(200),
    \`status\` enum('live','ended') NOT NULL DEFAULT 'live',
    \`startedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`endedAt\` timestamp NULL,
    \`zoomMeetingId\` varchar(64),
    \`zoomMeetingUuid\` varchar(128),
    \`rtmsStreamId\` varchar(128),
    \`turns\` json,
    \`signals\` json,
    \`coachingLog\` json,
    \`lastCycleAt\` timestamp NULL,
    \`cycles\` int NOT NULL DEFAULT 0,
    \`decisionType\` varchar(20),
    \`memorySummary\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`whisperer_sessions_workspace\` (\`workspaceId\`),
    KEY \`whisperer_sessions_client\` (\`clientId\`),
    KEY \`whisperer_sessions_zoom\` (\`zoomMeetingId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`whisperer_reports\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`sessionId\` int NOT NULL,
    \`workspaceId\` int NOT NULL,
    \`clientId\` int,
    \`cycle\` int NOT NULL,
    \`objectionId\` varchar(60) NOT NULL,
    \`title\` varchar(300) NOT NULL,
    \`likelihood\` int NOT NULL DEFAULT 0,
    \`pages\` int NOT NULL DEFAULT 0,
    \`sizeBytes\` int NOT NULL DEFAULT 0,
    \`pdfBase64\` longtext,
    \`smsSentAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`whisperer_reports_session\` (\`sessionId\`),
    KEY \`whisperer_reports_client\` (\`clientId\`)
  )`,
];

let bootstrapped: Promise<boolean> | null = null;

/** Create the tables once per process. Returns false when there is no database. */
export function ensureWhispererTables(): Promise<boolean> {
  if (!bootstrapped) {
    bootstrapped = (async () => {
      const db = await getDb();
      if (!db) return false;
      for (const stmt of BOOTSTRAP) await db.execute(sql.raw(stmt));
      return true;
    })().catch((e) => { console.warn("[whisperer] table bootstrap failed", String(e).slice(0, 200)); bootstrapped = null; return false; });
  }
  return bootstrapped;
}

export type LiveState = { turns: Turn[]; signals: Signal[]; coachingLog: Array<{ at: number; summary: string; cue: string; smsSent?: boolean; cycle?: number }> };

/** In-memory mirror of live sessions; the row is written on every change. */
const live = new Map<number, LiveState>();

function stateFromRow(row: WhispererSessionRow): LiveState {
  return {
    turns: Array.isArray(row.turns) ? (row.turns as Turn[]) : [],
    signals: Array.isArray(row.signals) ? (row.signals as Signal[]) : [],
    coachingLog: Array.isArray(row.coachingLog) ? (row.coachingLog as LiveState["coachingLog"]) : [],
  };
}

// ─── settings ─────────────────────────────────────────────────────────────

export async function getWhispererSettings(workspaceId: number): Promise<WhispererSettingsRow | null> {
  if (!(await ensureWhispererTables())) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(whispererSettings).where(eq(whispererSettings.workspaceId, workspaceId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertWhispererSettings(workspaceId: number, patch: Partial<Pick<WhispererSettingsRow, "advisorPhone" | "advisorName" | "smsEnabled" | "cycleMinutes" | "reportsPerCycle" | "zoomUserEmail">>): Promise<WhispererSettingsRow | null> {
  if (!(await ensureWhispererTables())) return null;
  const db = await getDb();
  if (!db) return null;
  const existing = await getWhispererSettings(workspaceId);
  if (existing) await db.update(whispererSettings).set(patch).where(eq(whispererSettings.id, existing.id));
  else await db.insert(whispererSettings).values({ workspaceId, ...patch });
  return getWhispererSettings(workspaceId);
}

// ─── sessions ─────────────────────────────────────────────────────────────

export async function createWhispererSession(input: { workspaceId: number; clientId: number | null; clientName: string; advisorUserId: number; advisorName: string | null; zoomMeetingId?: string | null }): Promise<WhispererSessionRow | null> {
  if (!(await ensureWhispererTables())) return null;
  const db = await getDb();
  if (!db) return null;
  const [res] = await db.insert(whispererSessions).values({
    workspaceId: input.workspaceId, clientId: input.clientId, clientName: input.clientName, advisorUserId: input.advisorUserId, advisorName: input.advisorName,
    zoomMeetingId: input.zoomMeetingId ?? null, turns: [], signals: [], coachingLog: [], status: "live",
  }).$returningId();
  const row = await getWhispererSession(res.id);
  if (row) live.set(row.id, { turns: [], signals: [], coachingLog: [] });
  return row;
}

export async function getWhispererSession(id: number, workspaceId?: number): Promise<WhispererSessionRow | null> {
  if (!(await ensureWhispererTables())) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(whispererSessions)
    .where(workspaceId ? and(eq(whispererSessions.id, id), eq(whispererSessions.workspaceId, workspaceId)) : eq(whispererSessions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listWhispererSessions(workspaceId: number, limit = 30): Promise<WhispererSessionRow[]> {
  if (!(await ensureWhispererTables())) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whispererSessions).where(eq(whispererSessions.workspaceId, workspaceId)).orderBy(desc(whispererSessions.startedAt)).limit(limit);
}

export async function listClientWhispererSessions(workspaceId: number, clientId: number): Promise<WhispererSessionRow[]> {
  if (!(await ensureWhispererTables())) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whispererSessions).where(and(eq(whispererSessions.workspaceId, workspaceId), eq(whispererSessions.clientId, clientId))).orderBy(desc(whispererSessions.startedAt)).limit(20);
}

/** The live session a Zoom meeting belongs to: by meeting id first, then the newest live session anywhere (one advisor, one call at a time). */
export async function findLiveSessionForZoom(meetingId: string | null | undefined): Promise<WhispererSessionRow | null> {
  if (!(await ensureWhispererTables())) return null;
  const db = await getDb();
  if (!db) return null;
  if (meetingId) {
    const byId = await db.select().from(whispererSessions).where(and(eq(whispererSessions.status, "live"), eq(whispererSessions.zoomMeetingId, String(meetingId)))).orderBy(desc(whispererSessions.startedAt)).limit(1);
    if (byId[0]) return byId[0];
  }
  const newest = await db.select().from(whispererSessions).where(eq(whispererSessions.status, "live")).orderBy(desc(whispererSessions.startedAt)).limit(1);
  return newest[0] ?? null;
}

export async function liveState(id: number): Promise<LiveState | null> {
  const cached = live.get(id);
  if (cached) return cached;
  const row = await getWhispererSession(id);
  if (!row) return null;
  const state = stateFromRow(row);
  if (row.status === "live") live.set(id, state);
  return state;
}

async function persistState(id: number, state: LiveState, extra: Partial<WhispererSessionRow> = {}) {
  const db = await getDb();
  if (!db) return;
  await db.update(whispererSessions).set({ turns: state.turns, signals: state.signals, coachingLog: state.coachingLog.slice(-200), ...extra }).where(eq(whispererSessions.id, id));
}

export async function appendTurns(id: number, turns: Turn[]): Promise<LiveState | null> {
  const state = await liveState(id);
  if (!state) return null;
  state.turns.push(...turns);
  state.turns.sort((a, b) => a.at - b.at);
  if (state.turns.length > 4000) state.turns = state.turns.slice(-4000);
  await persistState(id, state);
  return state;
}

export async function appendSignals(id: number, signals: Signal[]): Promise<LiveState | null> {
  const state = await liveState(id);
  if (!state) return null;
  state.signals.push(...signals);
  if (state.signals.length > 2000) state.signals = state.signals.slice(-2000);
  await persistState(id, state);
  return state;
}

export async function appendCoaching(id: number, coaching: Coaching, smsSent: boolean, cycle?: number): Promise<void> {
  const state = await liveState(id);
  if (!state) return;
  state.coachingLog.push({ at: coaching.at, summary: coaching.summary, cue: coaching.cues[0]?.text ?? "", smsSent, cycle });
  await persistState(id, state, { decisionType: coaching.decision.type });
}

export async function patchSession(id: number, patch: Partial<WhispererSessionRow>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(whispererSessions).set(patch).where(eq(whispererSessions.id, id));
}

export async function markCycle(id: number, cycle: number): Promise<void> {
  await patchSession(id, { lastCycleAt: new Date(), cycles: cycle });
}

export async function endWhispererSession(id: number, memorySummary: string): Promise<void> {
  const state = live.get(id);
  if (state) { await persistState(id, state, { status: "ended", endedAt: new Date(), memorySummary }); live.delete(id); }
  else await patchSession(id, { status: "ended", endedAt: new Date(), memorySummary });
}

// ─── reports ──────────────────────────────────────────────────────────────

export async function addWhispererReport(input: { sessionId: number; workspaceId: number; clientId: number | null; cycle: number; objectionId: string; title: string; likelihood: number; pages: number; pdf: Buffer }): Promise<number | null> {
  if (!(await ensureWhispererTables())) return null;
  const db = await getDb();
  if (!db) return null;
  const [res] = await db.insert(whispererReports).values({
    sessionId: input.sessionId, workspaceId: input.workspaceId, clientId: input.clientId, cycle: input.cycle, objectionId: input.objectionId, title: input.title,
    likelihood: Math.round(input.likelihood * 100), pages: input.pages, sizeBytes: input.pdf.length, pdfBase64: input.pdf.toString("base64"),
  }).$returningId();
  return res.id;
}

export type ReportMeta = Omit<WhispererReportRow, "pdfBase64">;

const metaColumns = {
  id: whispererReports.id, sessionId: whispererReports.sessionId, workspaceId: whispererReports.workspaceId, clientId: whispererReports.clientId, cycle: whispererReports.cycle,
  objectionId: whispererReports.objectionId, title: whispererReports.title, likelihood: whispererReports.likelihood, pages: whispererReports.pages, sizeBytes: whispererReports.sizeBytes,
  smsSentAt: whispererReports.smsSentAt, createdAt: whispererReports.createdAt,
};

export async function listSessionReports(sessionId: number, workspaceId: number): Promise<ReportMeta[]> {
  if (!(await ensureWhispererTables())) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select(metaColumns).from(whispererReports).where(and(eq(whispererReports.sessionId, sessionId), eq(whispererReports.workspaceId, workspaceId))).orderBy(desc(whispererReports.createdAt));
}

export async function listClientReports(clientId: number, workspaceId: number, limit = 100): Promise<ReportMeta[]> {
  if (!(await ensureWhispererTables())) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select(metaColumns).from(whispererReports).where(and(eq(whispererReports.clientId, clientId), eq(whispererReports.workspaceId, workspaceId))).orderBy(desc(whispererReports.createdAt)).limit(limit);
}

export async function getWhispererReport(id: number, workspaceId: number): Promise<WhispererReportRow | null> {
  if (!(await ensureWhispererTables())) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(whispererReports).where(and(eq(whispererReports.id, id), eq(whispererReports.workspaceId, workspaceId))).limit(1);
  return rows[0] ?? null;
}

export async function markReportsTexted(ids: number[]): Promise<void> {
  const db = await getDb();
  if (!db || !ids.length) return;
  for (const id of ids) await db.update(whispererReports).set({ smsSentAt: new Date() }).where(eq(whispererReports.id, id));
}
