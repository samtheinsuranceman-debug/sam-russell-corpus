// ============================================================
// WEALTH GENOME INTAKE — the rules, server side.
//
//   • Gate: GENOME_INTAKE_LIVE is off by default. Off, only the owner
//     (admin role) may run the flow, as a preview; consumers never see the
//     cold start or the intake. Counsel reviews before it goes live.
//   • Consent first: no answer is accepted without a current consent
//     record — timestamp, consent text version, the text itself, and each
//     acknowledgement (after Doctor Buddy's consent evidence) — the spec's
//     buddy_lock. A consent that is stale or withdrawn stops the flow.
//   • Crisis first of all: any typed text is screened before it is stored
//     (shared/crisisScreen.ts). A disclosure stops the intake, deletes the
//     session's raw answers and returns the 988 lifeline to the screen.
//   • Permission every cluster: an answer is accepted only for a cluster
//     the person said yes to. A "no" marks that limb unknown; nothing more.
//   • Own household only: every session and map is read by its owner's
//     id. Another household's session answers NOT_FOUND; another
//     household's map is admin-only (AT10).
//   • Retention by kind: "destroy" answers (how a person thinks and feels)
//     go to the raw table; "profile" answers (the money facts) go to the
//     household's fact-finder record, never to the raw table.
//   • Close writes the map (tendencies and bands only) and deletes the raw
//     answers in the same call. "Session done" deletes them and keeps no
//     map. The sweep catches everything else (genomeIntakeDb.ts).
// ============================================================
import { TRPCError } from "@trpc/server";
import {
  CONSENT_VERSION,
  RAW_ANSWER_TTL_MS,
  consentSnapshot,
  effectiveRetention,
  parseRetentionOverrides,
  type ConsentAcks,
  type RetentionOverrides,
  buildGenomeMap,
  clusterOfQuestion,
  mindReflection,
  moneyReflection,
  parseGenomeMap,
  readAxes,
  readMoney,
  validateRawAnswer,
  type ClusterId,
  type GenomeMap,
  type RawAnswer,
} from "@shared/genomeIntake";
import { STILL_IDS, type StillId } from "@shared/firstLoginColdStart";
import { screenForCrisis } from "@shared/crisisScreen";
import type { GenomeIntakeStore, IntakeSession } from "./genomeIntakeDb";

export type Viewer = { id: number; role: string };
export type Access = { live: boolean; eligible: boolean; preview: boolean };

/** GENOME_INTAKE_LIVE=1 (or true) opens the flow to every signed-in consumer. Anything else: owner preview only. */
export function genomeIntakeLive(env: NodeJS.ProcessEnv = process.env): boolean {
  const v = (env.GENOME_INTAKE_LIVE ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function intakeAccess(viewer: Viewer | null, env: NodeJS.ProcessEnv = process.env): Access {
  const live = genomeIntakeLive(env);
  if (!viewer) return { live, eligible: false, preview: false };
  if (live) return { live, eligible: true, preview: false };
  const owner = viewer.role === "admin";
  return { live, eligible: owner, preview: owner };
}

export function requireAccess(viewer: Viewer, env: NodeJS.ProcessEnv = process.env): Access {
  const a = intakeAccess(viewer, env);
  if (!a.eligible) throw new TRPCError({ code: "FORBIDDEN", message: "The Wealth Genome room is not open yet." });
  return a;
}

/** AT10: a consumer reads their own household and nobody else's. Only the owner may look across households. */
export function assertOwnHousehold(viewer: Viewer, targetUserId: number): void {
  if (viewer.id === targetUserId) return;
  if (viewer.role === "admin") return;
  throw new TRPCError({ code: "FORBIDDEN", message: "You can only see your own household." });
}

// ─── Cold-start configuration ─────────────────────────────────────────────

export const STILL_ENV: Readonly<Record<StillId, string>> = {
  STILL_MOUNTAIN: "FIRST_LOGIN_STILL_MOUNTAIN_URL",
  STILL_DINNER: "FIRST_LOGIN_STILL_DINNER_URL",
  STILL_WEDDING: "FIRST_LOGIN_STILL_WEDDING_URL",
  STILL_BEACH: "FIRST_LOGIN_STILL_BEACH_URL",
};
export const PLATE_ART_ENV = "FIRST_LOGIN_PLATE_ART_URL";
export const GREETING_ENV = "FIRST_LOGIN_GREETING";
/** Owner settings (site_settings) that override the environment, same names in lower dotted form. */
export const settingKey = (envName: string) => `firstLogin.${envName.replace(/^FIRST_LOGIN_/, "").toLowerCase()}`;

/** A still must come from the firm's own storage (/files/…) or an https URL. Anything else is ignored. */
export function acceptAssetUrl(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  if (s.startsWith("/files/") && !s.includes("..")) return s;
  if (/^https:\/\/[^\s"'<>]+$/.test(s)) return s;
  return null;
}

export type ColdStartConfig = {
  eligible: boolean;
  preview: boolean;
  stills: Partial<Record<StillId, string>>;
  plateArtUrl: string | null;
  greeting: string | null;
  bookingUrl: string;
};

export function bookingUrl(env: NodeJS.ProcessEnv = process.env): string {
  return acceptAssetUrl(env.CALENDLY_URL) ?? acceptAssetUrl(env.PARTNER_BOOKING_URL) ?? "/support";
}

export async function coldStartConfig(
  viewer: Viewer | null,
  readSetting: (key: string) => Promise<string | null>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ColdStartConfig> {
  const access = intakeAccess(viewer, env);
  const base: ColdStartConfig = { eligible: access.eligible, preview: access.preview, stills: {}, plateArtUrl: null, greeting: null, bookingUrl: bookingUrl(env) };
  if (!access.eligible) return base;
  const pick = async (envName: string) => {
    let fromSetting: string | null = null;
    try { fromSetting = await readSetting(settingKey(envName)); } catch { /* no database: the environment decides */ }
    return fromSetting ?? env[envName] ?? null;
  };
  for (const id of STILL_IDS) {
    const url = acceptAssetUrl(await pick(STILL_ENV[id]));
    if (url) base.stills[id] = url;
  }
  base.plateArtUrl = acceptAssetUrl(await pick(PLATE_ART_ENV));
  const greeting = (await pick(GREETING_ENV))?.trim();
  base.greeting = greeting ? greeting.slice(0, 160) : null;
  return base;
}

// ─── The flow ─────────────────────────────────────────────────────────────

async function ownedSession(store: GenomeIntakeStore, viewer: Viewer, sessionId: number): Promise<IntakeSession> {
  const s = await store.getSession(sessionId);
  // Another household's session is indistinguishable from a missing one.
  if (!s || s.userId !== viewer.id) throw new TRPCError({ code: "NOT_FOUND", message: "No such session." });
  return s;
}

async function openSession(store: GenomeIntakeStore, viewer: Viewer, sessionId: number, now: Date): Promise<IntakeSession> {
  const s = await ownedSession(store, viewer, sessionId);
  if (s.status !== "open") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This session has ended and its raw answers are gone. Start again whenever you like." });
  if (!consentIsCurrent(s)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The consent for this session is no longer current. Please read and agree again." });
  }
  if (s.expiresAt.getTime() <= now.getTime()) {
    await store.deleteRawForSession(s.id);
    await store.updateSession(s.id, { status: "abandoned", closedAt: now });
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This session timed out and its raw answers were deleted. Start again whenever you like." });
  }
  return s;
}

/** Counsel's retention moves (GENOME_RETENTION_OVERRIDES="money.taxes=destroy,…"), read on every call. */
export function retentionOverrides(env: NodeJS.ProcessEnv = process.env): RetentionOverrides {
  return parseRetentionOverrides(env.GENOME_RETENTION_OVERRIDES);
}

/** Current = this version, this exact text, every acknowledgement given, not withdrawn (Doctor Buddy's rule). */
export function consentIsCurrent(s: Pick<IntakeSession, "consentVersion" | "consentTextSnapshot" | "adult18Plus" | "ackNotDiagnosis" | "ackDestroyKeep" | "withdrawnAt">): boolean {
  return s.consentVersion === CONSENT_VERSION && s.consentTextSnapshot === consentSnapshot(retentionOverrides())
    && s.adult18Plus && s.ackNotDiagnosis && s.ackDestroyKeep && !s.withdrawnAt;
}

export async function recordConsent(store: GenomeIntakeStore, viewer: Viewer, access: Access, consentVersion: string, acks: ConsentAcks, now = new Date()) {
  if (consentVersion !== CONSENT_VERSION) {
    throw new TRPCError({ code: "CONFLICT", message: "The consent text has changed. Please read the current version." });
  }
  if (!acks.adult18Plus || !acks.notDiagnosis || !acks.destroyKeep) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Each acknowledgement is needed before we begin." });
  }
  const s = await store.createSession({
    userId: viewer.id,
    consentVersion: CONSENT_VERSION,
    consentedAt: now,
    consentTextSnapshot: consentSnapshot(retentionOverrides()),
    adult18Plus: true,
    ackNotDiagnosis: true,
    ackDestroyKeep: true,
    preview: access.preview,
    expiresAt: new Date(now.getTime() + RAW_ANSWER_TTL_MS),
  });
  return { sessionId: s.id, consentVersion: s.consentVersion, consentedAt: s.consentedAt.toISOString(), expiresAt: s.expiresAt.toISOString() };
}

export async function decideCluster(store: GenomeIntakeStore, viewer: Viewer, sessionId: number, cluster: ClusterId, decision: "accepted" | "declined", now = new Date()) {
  const s = await openSession(store, viewer, sessionId, now);
  // Interleave: mind first, then money.
  if (cluster === "money" && s.mindDecision === "pending") {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The mind cluster comes first." });
  }
  await store.updateSession(s.id, cluster === "mind" ? { mindDecision: decision } : { moneyDecision: decision });
  // A no after a yes: whatever was said in that cluster goes now.
  if (decision === "declined") {
    for (const a of await store.listRaw(s.id)) if (clusterOfQuestion(a.questionId) === cluster) await store.deleteRaw(s.id, a.questionId);
  }
  return { cluster, decision };
}

export async function putAnswer(store: GenomeIntakeStore, viewer: Viewer, sessionId: number, answer: RawAnswer | { questionId: string; skip: true }, now = new Date()) {
  const s = await openSession(store, viewer, sessionId, now);
  const cluster = clusterOfQuestion(answer.questionId);
  if (!cluster) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown question." });
  const decision = cluster === "mind" ? s.mindDecision : s.moneyDecision;
  if (decision !== "accepted") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Permission for this cluster was not given." });
  if ("skip" in answer) {
    // Skip means skip: nothing new is taken, and an earlier raw answer to it this session is removed.
    // (A fact already in the household file stays there; skipping is not an instruction to erase it.)
    await store.deleteRaw(s.id, answer.questionId);
    return { stored: false, skipped: true };
  }
  // Screen what they typed before anything is kept. A disclosure ends the session and deletes it all.
  if (answer.kind === "choice" && answer.note && screenForCrisis(answer.note).stop) {
    await store.deleteRawForSession(s.id);
    await store.updateSession(s.id, { status: "abandoned", closedAt: now });
    return { stored: false, crisis: true as const };
  }
  const problem = validateRawAnswer(answer);
  if (problem) throw new TRPCError({ code: "BAD_REQUEST", message: problem });
  if (effectiveRetention(answer.questionId, retentionOverrides()) === "profile") {
    // The financial profile: kept in the household file, never in the raw table. Typed notes are never kept.
    const fact: RawAnswer = answer.kind === "choice" ? { questionId: answer.questionId, kind: "choice", choiceId: answer.choiceId } : answer;
    await store.deleteRaw(s.id, answer.questionId);
    await store.putProfileAnswer(viewer.id, fact, now);
    return { stored: true, retention: "profile" as const };
  }
  const clean = answer.kind === "choice" && answer.note !== undefined && !answer.note.trim() ? { ...answer, note: undefined } : answer;
  await store.putRaw({ sessionId: s.id, userId: viewer.id, answer: clean, expiresAt: s.expiresAt, legalHold: s.legalHold });
  return { stored: true, retention: "destroy" as const };
}

/** Everything answered in this session: raw rows, plus household-file facts recorded since consent. */
async function sessionAnswers(store: GenomeIntakeStore, s: IntakeSession): Promise<RawAnswer[]> {
  const raw = await store.listRaw(s.id);
  const kept = (await store.listProfileAnswers(s.userId))
    .filter((p) => p.recordedAt && p.recordedAt.getTime() >= s.consentedAt.getTime())
    .map((p) => p.answer)
    .filter((a) => !raw.some((r) => r.questionId === a.questionId));
  return [...raw, ...kept];
}

export async function reflectCluster(store: GenomeIntakeStore, viewer: Viewer, sessionId: number, cluster: ClusterId, now = new Date()) {
  const s = await openSession(store, viewer, sessionId, now);
  const decision = cluster === "mind" ? s.mindDecision : s.moneyDecision;
  const raw = decision === "accepted" ? (await sessionAnswers(store, s)).filter((a) => clusterOfQuestion(a.questionId) === cluster) : [];
  const line = cluster === "mind" ? mindReflection(readAxes(raw)) : moneyReflection(readMoney(raw));
  return { cluster, line };
}

/** L: write the map, then destroy the raw answers. Returns the map and how many raw rows were deleted. */
export async function closeSession(store: GenomeIntakeStore, viewer: Viewer, sessionId: number, now = new Date()) {
  const s = await openSession(store, viewer, sessionId, now);
  const answers = await sessionAnswers(store, s);
  const map = buildGenomeMap(answers, { mind: s.mindDecision, money: s.moneyDecision }, s.consentVersion, now);
  await store.upsertMap(viewer.id, map);
  const rawDeleted = await store.deleteRawForSession(s.id);
  await store.updateSession(s.id, { status: "closed", closedAt: now });
  return { map, rawDeleted, reflections: reflectionsFor(map) };
}

/** Control 70 — "session done": stop now, destroy the raw answers, keep no map. */
export async function endSession(store: GenomeIntakeStore, viewer: Viewer, sessionId: number, now = new Date()) {
  const s = await ownedSession(store, viewer, sessionId);
  const rawDeleted = await store.deleteRawForSession(s.id);
  if (s.status === "open") await store.updateSession(s.id, { status: "abandoned", closedAt: now });
  return { rawDeleted };
}

/** Owner only (the router enforces it): suspend or resume deletion for one household. */
export async function setLegalHold(store: GenomeIntakeStore, userId: number, hold: boolean) {
  await store.setLegalHold(userId, hold);
  return { userId, legalHold: hold };
}

/** Withdraw consent: the map is deleted and every consent record is stamped withdrawn. */
export async function withdrawConsent(store: GenomeIntakeStore, viewer: Viewer, now = new Date()) {
  return store.withdraw(viewer.id, now);
}

export function reflectionsFor(map: GenomeMap) {
  return {
    mind: map.limbs.mind === "mapped" ? mindReflection(map.axes) : null,
    money: map.limbs.money === "mapped" ? moneyReflection(map.money) : null,
  };
}

export async function readMap(store: GenomeIntakeStore, viewer: Viewer, targetUserId: number) {
  assertOwnHousehold(viewer, targetUserId);
  const stored = await store.getMap(targetUserId);
  const map = stored ? parseGenomeMap(stored.map) : null;
  if (!stored || !map) return null;
  return { map, updatedAt: stored.updatedAt.toISOString(), reflections: reflectionsFor(map) };
}
