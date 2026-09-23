// ============================================================
// WEALTH GENOME INTAKE — storage and the delete job.
//
// Two retention classes (shared/genomeIntake.ts):
//   • "profile" answers (the money facts) are merged into the household's
//     existing fact-finder record (section "genomeIntake") and the change is
//     written to the plan ledger, so a recommendation can be checked later.
//     They never touch the raw-answer table.
//   • "destroy" answers (how a person thinks and feels) are written to
//     genome_raw_answers with an expiry and are deleted in two ways, both real:
//   1. at close (and at "session done"), for that session, immediately;
//   2. by the sweep, for anything past its expiry or older than 24 hours —
//      an abandoned tab, a closed laptop, a server restart mid-session.
// A legal hold (owner-set, per household) suspends both until released. The sweep runs in the
//      process every five minutes (startGenomeRawSweep) and on demand from
//      GET /api/cron/genome-raw-sweep (CRON_SECRET, like every cron route).
//
// The store is an interface so the delete job can be proved in tests with
// the in-memory store and run in production against MySQL. The tables
// create themselves on first use, as whisperer_* do, because this host
// applies schema by hand (scripts/DEPLOY.md); drizzle/schema.ts and
// drizzle/migrations/0083_genome_intake.sql declare the same tables.
// ============================================================
import { and, eq, lte, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { genomeIntakeSessions, genomeMaps, genomeRawAnswers } from "../drizzle/schema";
import { PROFILE_SECTION, RAW_ANSWER_MAX_AGE_MS, answersFromProfile, profileFields, type ClusterDecision, type GenomeMap, type RawAnswer } from "@shared/genomeIntake";
import { emptyFactFinder, type ClientFactFinder } from "@shared/clientFactFinder";

export type IntakeSession = {
  id: number;
  userId: number;
  consentVersion: string;
  consentedAt: Date;
  consentTextSnapshot: string;
  adult18Plus: boolean;
  ackNotDiagnosis: boolean;
  ackDestroyKeep: boolean;
  withdrawnAt: Date | null;
  status: "open" | "closed" | "abandoned";
  mindDecision: ClusterDecision;
  moneyDecision: ClusterDecision;
  preview: boolean;
  legalHold: boolean;
  expiresAt: Date;
  closedAt: Date | null;
};

export type StoredMap = { userId: number; map: GenomeMap; consentVersion: string; updatedAt: Date };

export interface GenomeIntakeStore {
  createSession(s: Omit<IntakeSession, "id" | "status" | "mindDecision" | "moneyDecision" | "closedAt" | "withdrawnAt" | "legalHold">): Promise<IntakeSession>;
  getSession(id: number): Promise<IntakeSession | null>;
  updateSession(id: number, patch: Partial<Pick<IntakeSession, "status" | "mindDecision" | "moneyDecision" | "closedAt">>): Promise<void>;
  /** One row per question per session; answering again replaces it. Carries the session's legal hold. */
  putRaw(row: { sessionId: number; userId: number; answer: RawAnswer; expiresAt: Date; legalHold: boolean }): Promise<void>;
  deleteRaw(sessionId: number, questionId: string): Promise<void>;
  listRaw(sessionId: number): Promise<RawAnswer[]>;
  /** Delete a session's raw answers now. Rows under a legal hold stay; the count is what was deleted. */
  deleteRawForSession(sessionId: number): Promise<number>;
  /** Legal hold for every session and raw answer of one user. While held, nothing of theirs is deleted. */
  setLegalHold(userId: number, hold: boolean): Promise<void>;
  /**
   * The sweep: delete every raw answer past its expiry or older than 24 hours
   * (unless on legal hold), and mark stale open sessions abandoned.
   */
  sweepExpired(now: Date): Promise<{ rawDeleted: number; sessionsAbandoned: number }>;
  countRaw(): Promise<number>;
  upsertMap(userId: number, map: GenomeMap): Promise<void>;
  getMap(userId: number): Promise<StoredMap | null>;
  /** A "profile" answer, merged into the household's fact-finder record. */
  putProfileAnswer(userId: number, answer: RawAnswer, now: Date): Promise<void>;
  listProfileAnswers(userId: number): Promise<Array<{ answer: RawAnswer; recordedAt: Date | null }>>;
  /** Withdrawal: the kept map goes, and every consent record of this user is stamped withdrawn. */
  withdraw(userId: number, now: Date): Promise<{ mapDeleted: boolean; rawDeleted: number }>;
}

// ─── In memory (tests, and a process without a database) ────────────────

export function createMemoryStore(): GenomeIntakeStore {
  let nextId = 1;
  const sessions = new Map<number, IntakeSession>();
  let raw: Array<{ sessionId: number; userId: number; answer: RawAnswer; expiresAt: Date; legalHold: boolean; createdAt: Date }> = [];
  const maps = new Map<number, StoredMap>();
  const profiles = new Map<number, ClientFactFinder>();
  return {
    async putProfileAnswer(userId, answer, now) {
      const ff = profiles.get(userId) ?? emptyFactFinder();
      ff.sections[PROFILE_SECTION] = { ...(ff.sections[PROFILE_SECTION] ?? {}), ...profileFields(answer, now) };
      profiles.set(userId, ff);
    },
    async listProfileAnswers(userId) {
      return answersFromProfile(profiles.get(userId)?.sections[PROFILE_SECTION]);
    },
    async createSession(s) {
      const row: IntakeSession = { ...s, id: nextId++, status: "open", mindDecision: "pending", moneyDecision: "pending", closedAt: null, withdrawnAt: null, legalHold: false };
      sessions.set(row.id, row);
      return { ...row };
    },
    async getSession(id) {
      const s = sessions.get(id);
      return s ? { ...s } : null;
    },
    async updateSession(id, patch) {
      const s = sessions.get(id);
      if (s) sessions.set(id, { ...s, ...patch });
    },
    async putRaw(row) {
      raw = raw.filter((r) => !(r.sessionId === row.sessionId && r.answer.questionId === row.answer.questionId));
      raw.push({ ...row, createdAt: new Date() });
    },
    async deleteRaw(sessionId, questionId) {
      raw = raw.filter((r) => !(r.sessionId === sessionId && r.answer.questionId === questionId && !r.legalHold));
    },
    async listRaw(sessionId) {
      return raw.filter((r) => r.sessionId === sessionId).map((r) => r.answer);
    },
    async deleteRawForSession(sessionId) {
      const before = raw.length;
      raw = raw.filter((r) => r.sessionId !== sessionId || r.legalHold);
      return before - raw.length;
    },
    async setLegalHold(userId, hold) {
      raw = raw.map((r) => (r.userId === userId ? { ...r, legalHold: hold } : r));
      for (const s of Array.from(sessions.values())) if (s.userId === userId) sessions.set(s.id, { ...s, legalHold: hold });
    },
    async sweepExpired(now) {
      const before = raw.length;
      const ceiling = now.getTime() - RAW_ANSWER_MAX_AGE_MS;
      raw = raw.filter((r) => r.legalHold || (r.expiresAt.getTime() > now.getTime() && r.createdAt.getTime() > ceiling));
      let sessionsAbandoned = 0;
      for (const s of Array.from(sessions.values())) {
        if (s.status === "open" && s.expiresAt.getTime() <= now.getTime()) {
          sessions.set(s.id, { ...s, status: "abandoned", closedAt: now });
          sessionsAbandoned++;
        }
      }
      return { rawDeleted: before - raw.length, sessionsAbandoned };
    },
    async countRaw() {
      return raw.length;
    },
    async upsertMap(userId, map) {
      maps.set(userId, { userId, map, consentVersion: map.consentVersion, updatedAt: new Date() });
    },
    async getMap(userId) {
      return maps.get(userId) ?? null;
    },
    async withdraw(userId, now) {
      const mapDeleted = maps.delete(userId);
      const mine = new Set(Array.from(sessions.values()).filter((s) => s.userId === userId).map((s) => s.id));
      const before = raw.length;
      raw = raw.filter((r) => !mine.has(r.sessionId) || r.legalHold);
      for (const id of Array.from(mine)) {
        const s = sessions.get(id)!;
        sessions.set(id, { ...s, withdrawnAt: now, status: s.status === "open" ? "abandoned" : s.status, closedAt: s.closedAt ?? now });
      }
      return { mapDeleted, rawDeleted: before - raw.length };
    },
  };
}

// ─── MySQL ────────────────────────────────────────────────────────────────

const BOOTSTRAP = [
  `CREATE TABLE IF NOT EXISTS \`genome_intake_sessions\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`userId\` int NOT NULL,
    \`consentVersion\` varchar(64) NOT NULL,
    \`consentedAt\` timestamp NOT NULL,
    \`consentTextSnapshot\` text NOT NULL,
    \`adult18Plus\` boolean NOT NULL DEFAULT false,
    \`ackNotDiagnosis\` boolean NOT NULL DEFAULT false,
    \`ackDestroyKeep\` boolean NOT NULL DEFAULT false,
    \`withdrawnAt\` timestamp NULL,
    \`status\` enum('open','closed','abandoned') NOT NULL DEFAULT 'open',
    \`mindDecision\` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
    \`moneyDecision\` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
    \`preview\` boolean NOT NULL DEFAULT false,
    \`legalHold\` boolean NOT NULL DEFAULT false,
    \`expiresAt\` timestamp NOT NULL,
    \`closedAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`genome_intake_sessions_user\` (\`userId\`),
    KEY \`genome_intake_sessions_expiry\` (\`status\`,\`expiresAt\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`genome_raw_answers\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`sessionId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`questionId\` varchar(64) NOT NULL,
    \`answer\` json NOT NULL,
    \`legalHold\` boolean NOT NULL DEFAULT false,
    \`expiresAt\` timestamp NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`genome_raw_answers_session_question\` (\`sessionId\`,\`questionId\`),
    KEY \`genome_raw_answers_expiry\` (\`expiresAt\`),
    KEY \`genome_raw_answers_created\` (\`createdAt\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`genome_maps\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`userId\` int NOT NULL,
    \`map\` json NOT NULL,
    \`consentVersion\` varchar(64) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`genome_maps_user\` (\`userId\`)
  )`,
];

let bootstrapped: Promise<boolean> | null = null;
export function ensureGenomeTables(): Promise<boolean> {
  if (!bootstrapped) {
    bootstrapped = (async () => {
      const db = await getDb();
      if (!db) return false;
      for (const stmt of BOOTSTRAP) await db.execute(sql.raw(stmt));
      return true;
    })().catch((e) => { console.warn("[genome] table bootstrap failed", String(e).slice(0, 200)); bootstrapped = null; return false; });
  }
  return bootstrapped;
}

async function db() {
  if (!(await ensureGenomeTables())) throw new Error("The database is not reachable, so the genome intake cannot store anything right now.");
  const d = await getDb();
  if (!d) throw new Error("The database is not reachable, so the genome intake cannot store anything right now.");
  return d;
}

const toSession = (r: typeof genomeIntakeSessions.$inferSelect): IntakeSession => ({
  id: r.id, userId: r.userId, consentVersion: r.consentVersion, consentedAt: r.consentedAt, status: r.status,
  consentTextSnapshot: r.consentTextSnapshot, adult18Plus: Boolean(r.adult18Plus), ackNotDiagnosis: Boolean(r.ackNotDiagnosis),
  ackDestroyKeep: Boolean(r.ackDestroyKeep), withdrawnAt: r.withdrawnAt ?? null,
  mindDecision: r.mindDecision, moneyDecision: r.moneyDecision, preview: Boolean(r.preview), legalHold: Boolean(r.legalHold), expiresAt: r.expiresAt, closedAt: r.closedAt ?? null,
});

function affected(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result;
  const n = (header as { affectedRows?: number } | undefined)?.affectedRows;
  return typeof n === "number" ? n : 0;
}

export function createMysqlStore(): GenomeIntakeStore {
  return {
    async putProfileAnswer(userId, answer, now) {
      const { getFactFinderForUser, saveFactFinderForUser } = await import("./factFinderDb");
      const { recordAssessmentChange } = await import("./ledger");
      const prev = await getFactFinderForUser(userId);
      const base = prev?.data ?? emptyFactFinder();
      const next: ClientFactFinder = {
        ...base,
        sections: { ...base.sections, [PROFILE_SECTION]: { ...(base.sections[PROFILE_SECTION] ?? {}), ...profileFields(answer, now) } },
      };
      const saved = await saveFactFinderForUser(userId, next);
      if (!saved) throw new Error("The household file could not be saved right now.");
      await recordAssessmentChange({ userId }, prev?.data, next, "client", "Wealth Genome intake");
    },
    async listProfileAnswers(userId) {
      const { getFactFinderForUser } = await import("./factFinderDb");
      const ff = await getFactFinderForUser(userId);
      return answersFromProfile(ff?.data.sections?.[PROFILE_SECTION]);
    },
    async createSession(s) {
      const d = await db();
      const res = await d.insert(genomeIntakeSessions).values({
        userId: s.userId, consentVersion: s.consentVersion, consentedAt: s.consentedAt, preview: s.preview, expiresAt: s.expiresAt,
        consentTextSnapshot: s.consentTextSnapshot, adult18Plus: s.adult18Plus, ackNotDiagnosis: s.ackNotDiagnosis, ackDestroyKeep: s.ackDestroyKeep,
      });
      const header = (Array.isArray(res) ? res[0] : res) as { insertId?: number };
      const id = Number(header?.insertId);
      const row = await this.getSession(id);
      if (!row) throw new Error("consent record was not written");
      return row;
    },
    async getSession(id) {
      const d = await db();
      const rows = await d.select().from(genomeIntakeSessions).where(eq(genomeIntakeSessions.id, id)).limit(1);
      return rows[0] ? toSession(rows[0]) : null;
    },
    async updateSession(id, patch) {
      const d = await db();
      await d.update(genomeIntakeSessions).set(patch).where(eq(genomeIntakeSessions.id, id));
    },
    async putRaw(row) {
      const d = await db();
      await d.insert(genomeRawAnswers)
        .values({ sessionId: row.sessionId, userId: row.userId, questionId: row.answer.questionId, answer: row.answer, expiresAt: row.expiresAt, legalHold: row.legalHold })
        .onDuplicateKeyUpdate({ set: { answer: row.answer, expiresAt: row.expiresAt, legalHold: row.legalHold } });
    },
    async deleteRaw(sessionId, questionId) {
      const d = await db();
      await d.delete(genomeRawAnswers).where(and(eq(genomeRawAnswers.sessionId, sessionId), eq(genomeRawAnswers.questionId, questionId), eq(genomeRawAnswers.legalHold, false)));
    },
    async listRaw(sessionId) {
      const d = await db();
      const rows = await d.select({ answer: genomeRawAnswers.answer }).from(genomeRawAnswers).where(eq(genomeRawAnswers.sessionId, sessionId));
      return rows.map((r) => (typeof r.answer === "string" ? JSON.parse(r.answer) : r.answer) as RawAnswer);
    },
    async deleteRawForSession(sessionId) {
      const d = await db();
      return affected(await d.delete(genomeRawAnswers).where(and(eq(genomeRawAnswers.sessionId, sessionId), eq(genomeRawAnswers.legalHold, false))));
    },
    async setLegalHold(userId, hold) {
      const d = await db();
      await d.update(genomeRawAnswers).set({ legalHold: hold }).where(eq(genomeRawAnswers.userId, userId));
      await d.update(genomeIntakeSessions).set({ legalHold: hold }).where(eq(genomeIntakeSessions.userId, userId));
    },
    async sweepExpired(now) {
      const d = await db();
      const ceiling = new Date(now.getTime() - RAW_ANSWER_MAX_AGE_MS);
      const rawDeleted = affected(await d.delete(genomeRawAnswers).where(and(
        eq(genomeRawAnswers.legalHold, false),
        or(lte(genomeRawAnswers.expiresAt, now), lte(genomeRawAnswers.createdAt, ceiling)),
      )));
      const sessionsAbandoned = affected(
        await d.update(genomeIntakeSessions).set({ status: "abandoned", closedAt: now })
          .where(and(eq(genomeIntakeSessions.status, "open"), lte(genomeIntakeSessions.expiresAt, now))),
      );
      return { rawDeleted, sessionsAbandoned };
    },
    async countRaw() {
      const d = await db();
      const rows = await d.select({ n: sql<number>`count(*)` }).from(genomeRawAnswers);
      return Number(rows[0]?.n ?? 0);
    },
    async upsertMap(userId, map) {
      const d = await db();
      await d.insert(genomeMaps).values({ userId, map, consentVersion: map.consentVersion })
        .onDuplicateKeyUpdate({ set: { map, consentVersion: map.consentVersion } });
    },
    async getMap(userId) {
      const d = await db();
      const rows = await d.select().from(genomeMaps).where(eq(genomeMaps.userId, userId)).limit(1);
      const r = rows[0];
      if (!r) return null;
      const map = (typeof r.map === "string" ? JSON.parse(r.map) : r.map) as GenomeMap;
      return { userId: r.userId, map, consentVersion: r.consentVersion, updatedAt: r.updatedAt };
    },
    async withdraw(userId, now) {
      const d = await db();
      const mapDeleted = affected(await d.delete(genomeMaps).where(eq(genomeMaps.userId, userId))) > 0;
      const rawDeleted = affected(await d.delete(genomeRawAnswers).where(and(eq(genomeRawAnswers.userId, userId), eq(genomeRawAnswers.legalHold, false))));
      await d.update(genomeIntakeSessions).set({ status: "abandoned", closedAt: now })
        .where(and(eq(genomeIntakeSessions.userId, userId), eq(genomeIntakeSessions.status, "open")));
      await d.update(genomeIntakeSessions).set({ withdrawnAt: now }).where(eq(genomeIntakeSessions.userId, userId));
      return { mapDeleted, rawDeleted };
    },
  };
}

// ─── The store in use ─────────────────────────────────────────────────────

let current: GenomeIntakeStore | null = null;
export function genomeStore(): GenomeIntakeStore {
  if (!current) current = createMysqlStore();
  return current;
}
/** Tests swap in the in-memory store. */
export function setGenomeStoreForTests(store: GenomeIntakeStore | null): void {
  current = store;
}

// ─── The sweep ────────────────────────────────────────────────────────────

export async function runGenomeRawSweep(store: GenomeIntakeStore = genomeStore(), now: Date = new Date()) {
  return store.sweepExpired(now);
}

let timer: NodeJS.Timeout | null = null;
/** Every five minutes while the process runs. GENOME_SWEEP_DISABLED=1 turns it off (not recommended). */
export function startGenomeRawSweep(intervalMs = 5 * 60_000): boolean {
  if (timer || process.env.GENOME_SWEEP_DISABLED === "1") return false;
  const tick = async () => {
    try {
      if (!(await getDb())) return;
      const r = await runGenomeRawSweep();
      if (r.rawDeleted || r.sessionsAbandoned) console.info(`[genome] sweep deleted ${r.rawDeleted} raw answer(s), closed ${r.sessionsAbandoned} abandoned session(s)`);
    } catch (e) {
      console.warn("[genome] sweep failed:", String(e).slice(0, 200));
    }
  };
  timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();
  setTimeout(() => void tick(), 15_000).unref?.();
  return true;
}
export function stopGenomeRawSweep(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
