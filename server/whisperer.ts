// ============================================================
// AI WHISPERER — the server.
//
// tRPC router (advisor-only, workspace-scoped), the five-minute cycle
// scheduler, the Zoom webhook (URL validation + signed events → live
// media stream), and the PDF download route with a signed link so the
// advisor's phone can open a report from a text message.
//
// Configuration, all from the environment:
//   TWILIO_* or SMS_WEBHOOK_URL       texts to the advisor (server/_core/sms.ts)
//   ZOOM_ACCOUNT_ID/CLIENT_ID/SECRET  Zoom API (recordings, transcripts)
//   ZOOM_WEBHOOK_SECRET_TOKEN         Zoom events (live media stream)
//   ANTHROPIC_API_KEY or OPENAI_API_KEY   body-language reads from video frames
//   WHISPERER_ADVISOR_PHONE           default number when settings are empty
//   WHISPERER_ADVISOR_NAME            how the advisor appears in transcripts
// ============================================================
import type { Express, Request, Response } from "express";
import express from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { sendSms, smsMode, normalizePhone } from "./_core/sms";
import { createClientNote, getClientById, getClientNotes, getClients, getOrCreateWorkspace, getWorkspaceByOwnerId, ensureMembership } from "./db";
import {
  addWhispererReport, appendCoaching, appendSignals, appendTurns, createWhispererSession, endWhispererSession, findLiveSessionForZoom,
  getWhispererReport, getWhispererSession, getWhispererSettings, listClientReports, listClientWhispererSessions, listSessionReports,
  listWhispererSessions, liveState, markCycle, markReportsTexted, patchSession, upsertWhispererSettings, type LiveState,
} from "./whispererDb";
import { buildObjectionReport } from "./whispererReports";
import { FRAME_INTERVAL_MS, readFrame, toneFromEnergy, visionConfigured } from "./whispererVision";
import { connectRtms, fetchTranscript, listRecordings, recordingsForClient, verifyZoomWebhook, zoomConfigured, zoomValidationResponse, type RtmsConnection } from "./zoom";
import { coach, coachingSms, parseTranscript, summarizeCallForMemory, talkStats, type ClientContext, type Coaching, type DecisionType, type Signal, type Turn } from "@shared/whispererEngine";

const DEFAULT_PHONE = process.env.WHISPERER_ADVISOR_PHONE ?? "+19107471781";
const advisorDisplayName = () => process.env.WHISPERER_ADVISOR_NAME ?? process.env.OWNER_NAME ?? "Sam Russell";

async function workspaceFor(userId: number, name: string | null | undefined) {
  const ws = await getWorkspaceByOwnerId(userId);
  if (ws) { await ensureMembership(userId, ws.id); return ws; }
  const created = await getOrCreateWorkspace(userId, name ?? "My Workspace", `workspace-${userId}-${Date.now()}`);
  if (created) await ensureMembership(userId, created.id);
  return created;
}

// ─── client context ───────────────────────────────────────────────────────

const contextCache = new Map<number, ClientContext>();

export async function buildClientContext(workspaceId: number, clientId: number | null, clientName: string): Promise<ClientContext> {
  const ctx: ClientContext = { clientId: clientId ?? undefined, name: clientName, firstName: clientName.split(" ")[0] };
  if (!clientId) return ctx;
  const c = await getClientById(clientId, workspaceId);
  if (c) {
    const num = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));
    const ira = num(c.iraBalance) ?? 0;
    const roth = num(c.rothBalance) ?? 0;
    const taxable = num(c.taxableAssets) ?? 0;
    const re = num(c.realEstateEquity) ?? 0;
    ctx.name = c.name;
    ctx.firstName = c.firstName ?? c.name.split(" ")[0];
    ctx.money = {
      income: num(c.annualIncome) ?? num(c.income), age: c.age ?? undefined, preTaxRetirement: ira, roth, taxable, homeEquity: re,
      netWorth: num(c.totalNetWorth) ?? ira + roth + taxable + re, liquid: taxable, hasSpouse: Boolean(c.spouseName), spouseName: c.spouseName ?? undefined,
    };
  }
  const prior = await listClientWhispererSessions(workspaceId, clientId);
  ctx.priorCalls = prior.filter((s) => s.memorySummary).slice(0, 5).map((s) => s.memorySummary!);
  ctx.priorObjections = prior.flatMap((s) => (s.memorySummary?.match(/objections raised: ([^;]+)/)?.[1] ?? "").split(",").map((x) => x.trim()).filter((x) => x && x !== "none"));
  const lastType = prior.find((s) => s.decisionType)?.decisionType as DecisionType | undefined;
  if (lastType) ctx.priorDecisionType = lastType;
  try {
    const notes = await getClientNotes(clientId, workspaceId);
    const calls = notes.filter((n) => n.noteType === "CALL" || n.noteType === "MEETING").slice(0, 5).map((n) => `${new Date(n.createdAt).toISOString().slice(0, 10)}: ${n.content.slice(0, 160)}`);
    ctx.priorCalls = [...(ctx.priorCalls ?? []), ...calls].slice(0, 8);
    const personality = notes.find((n) => /personality|decision type|DISC/i.test(n.content));
    if (personality) ctx.personalityNotes = personality.content.slice(0, 400);
  } catch { /* notes are optional */ }
  return ctx;
}

async function contextFor(session: { id: number; workspaceId: number; clientId: number | null; clientName: string }): Promise<ClientContext> {
  const cached = contextCache.get(session.id);
  if (cached) return cached;
  const ctx = await buildClientContext(session.workspaceId, session.clientId, session.clientName);
  contextCache.set(session.id, ctx);
  return ctx;
}

// ─── live coaching ────────────────────────────────────────────────────────

const lastUrgentSms = new Map<number, number>();
const lastFrameRead = new Map<number, number>();
const audioHistory = new Map<string, number[]>();

async function coachSession(sessionId: number): Promise<{ coaching: Coaching; state: LiveState; session: NonNullable<Awaited<ReturnType<typeof getWhispererSession>>> } | null> {
  const session = await getWhispererSession(sessionId);
  if (!session) return null;
  const state = await liveState(sessionId);
  if (!state) return null;
  const ctx = await contextFor(session);
  const now = Date.now() - new Date(session.startedAt).getTime();
  const coaching = coach({ turns: state.turns, signals: state.signals, client: ctx, now });
  return { coaching, state, session };
}

async function textAdvisor(workspaceId: number, body: string): Promise<{ sent: boolean; reason?: string }> {
  const settings = await getWhispererSettings(workspaceId);
  if (settings && !settings.smsEnabled) return { sent: false, reason: "texts switched off in settings" };
  const to = settings?.advisorPhone || DEFAULT_PHONE;
  const r = await sendSms({ to, body });
  return { sent: r.sent, reason: r.reason };
}

/** After every ingest: an urgent cue (stop talking, close now, acknowledge) is texted at most once a minute. */
async function maybeTextUrgent(sessionId: number, workspaceId: number, coaching: Coaching, clientName: string) {
  const top = coaching.cues[0];
  if (!top || top.urgency < 3) return;
  const last = lastUrgentSms.get(sessionId) ?? 0;
  if (Date.now() - last < 60_000) return;
  lastUrgentSms.set(sessionId, Date.now());
  const label = top.kind === "stop-talking" ? "STOP TALKING" : top.kind === "close" ? "CLOSE NOW" : top.kind.toUpperCase();
  const r = await textAdvisor(workspaceId, `WHISPERER · ${clientName}\n${label}: ${top.text}\n${top.why}`);
  await appendCoaching(sessionId, coaching, r.sent);
}

// ─── the five-minute cycle ────────────────────────────────────────────────

const cycleRunning = new Set<number>();

export function reportLinkToken(reportId: number, exp: number): string {
  return createHmac("sha256", process.env.JWT_SECRET ?? "whisperer").update(`${reportId}.${exp}`).digest("hex").slice(0, 32);
}

function reportUrl(reportId: number): string {
  const base = (process.env.PUBLIC_BASE_URL ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "")).replace(/\/$/, "");
  const exp = Date.now() + 14 * 86_400_000;
  return `${base}/api/whisperer/reports/${reportId}.pdf?exp=${exp}&t=${reportLinkToken(reportId, exp)}`;
}

export async function runCycle(sessionId: number, reason: "timer" | "manual" = "timer"): Promise<{ ok: boolean; reports: number; smsSent: boolean; reason?: string }> {
  if (cycleRunning.has(sessionId)) return { ok: false, reports: 0, smsSent: false, reason: "cycle already running" };
  cycleRunning.add(sessionId);
  try {
    const got = await coachSession(sessionId);
    if (!got) return { ok: false, reports: 0, smsSent: false, reason: "no session" };
    const { coaching, state, session } = got;
    const settings = await getWhispererSettings(session.workspaceId);
    const perCycle = settings?.reportsPerCycle ?? 5;
    const cycle = (session.cycles ?? 0) + 1;
    const ctx = await contextFor(session);
    const advisorName = session.advisorName ?? settings?.advisorName ?? advisorDisplayName();
    const built = await Promise.allSettled(coaching.objections.slice(0, perCycle).map((o) => buildObjectionReport({ objection: o, client: ctx, coaching, turns: state.turns, cycle, advisorName })));
    const ids: number[] = [];
    const lines: string[] = [];
    for (let i = 0; i < built.length; i++) {
      const b = built[i];
      const o = coaching.objections[i];
      if (b.status !== "fulfilled") { console.warn("[whisperer] report failed", o?.id, String(b.reason).slice(0, 160)); continue; }
      const id = await addWhispererReport({ sessionId, workspaceId: session.workspaceId, clientId: session.clientId, cycle, objectionId: o.id, title: o.title, likelihood: o.likelihood, pages: b.value.pages, pdf: b.value.pdf });
      if (id) { ids.push(id); lines.push(`• ${o.title} (${Math.round(o.likelihood * 100)}%, ${b.value.pages} pp): ${reportUrl(id)}`); }
    }
    await markCycle(sessionId, cycle);
    const sms = coachingSms(coaching, ctx.firstName ?? ctx.name);
    const r1 = await textAdvisor(session.workspaceId, sms);
    let r2: { sent: boolean; reason?: string } = { sent: false };
    if (lines.length) r2 = await textAdvisor(session.workspaceId, `WHISPERER · ${ctx.firstName ?? ctx.name} · cycle ${cycle} reports (${reason})\n${lines.join("\n")}`);
    if (r2.sent) await markReportsTexted(ids);
    await appendCoaching(sessionId, coaching, r1.sent, cycle);
    return { ok: true, reports: ids.length, smsSent: r1.sent, reason: r1.sent ? undefined : r1.reason };
  } catch (e) {
    console.warn("[whisperer] cycle failed", String(e).slice(0, 200));
    return { ok: false, reports: 0, smsSent: false, reason: String(e).slice(0, 120) };
  } finally {
    cycleRunning.delete(sessionId);
  }
}

let scheduler: NodeJS.Timeout | null = null;

/** Every 20 seconds: any live session whose cycle is due gets its five reports and its text. */
export function startWhispererScheduler(): boolean {
  if (scheduler || process.env.WHISPERER_DISABLED === "1") return false;
  scheduler = setInterval(async () => {
    try {
      const live = await listLiveSessionsAll();
      for (const s of live) {
        const settings = await getWhispererSettings(s.workspaceId);
        const every = (settings?.cycleMinutes ?? 5) * 60_000;
        const last = s.lastCycleAt ? new Date(s.lastCycleAt).getTime() : new Date(s.startedAt).getTime();
        if (Date.now() - last >= every) void runCycle(s.id, "timer");
      }
    } catch (e) {
      console.warn("[whisperer] scheduler tick failed", String(e).slice(0, 120));
    }
  }, 20_000);
  scheduler.unref?.();
  return true;
}

async function listLiveSessionsAll() {
  // One advisor per installation today; the newest live session per workspace is the call in progress.
  const s = await findLiveSessionForZoom(null);
  return s ? [s] : [];
}

// ─── ingest from Zoom or the browser ──────────────────────────────────────

const rtms = new Map<number, RtmsConnection>();

function speakerFor(userName: string, advisorNames: string[]): Turn["speaker"] {
  const n = userName.toLowerCase();
  return advisorNames.some((a) => a && (n.includes(a.toLowerCase()) || a.toLowerCase().includes(n))) ? "advisor" : "client";
}

async function attachRtms(sessionId: number, start: { meeting_uuid: string; rtms_stream_id: string; server_urls: string; meeting_id?: string | number }) {
  const session = await getWhispererSession(sessionId);
  if (!session) return;
  rtms.get(sessionId)?.stop();
  const settings = await getWhispererSettings(session.workspaceId);
  const advisorNames = [session.advisorName ?? "", settings?.advisorName ?? "", advisorDisplayName()].filter(Boolean);
  const startedAt = new Date(session.startedAt).getTime();
  const rel = (ms: number) => Math.max(0, (ms > 1e12 ? ms : Date.now()) - startedAt);
  const conn = connectRtms(start, {
    onTranscript: (line) => {
      const turn: Turn = { at: rel(line.timestampMs), speaker: speakerFor(line.userName, advisorNames), text: line.text, source: "zoom" };
      void appendTurns(sessionId, [turn]).then(async () => {
        const got = await coachSession(sessionId);
        if (got) await maybeTextUrgent(sessionId, session.workspaceId, got.coaching, session.clientName);
      });
    },
    onVideoFrame: (frame) => {
      if (frame.userName && speakerFor(frame.userName, advisorNames) === "advisor") return;
      const last = lastFrameRead.get(sessionId) ?? 0;
      if (Date.now() - last < FRAME_INTERVAL_MS) return;
      lastFrameRead.set(sessionId, Date.now());
      void readFrame(frame.jpegBase64, rel(frame.timestampMs), "zoom-video").then((sig) => { if (sig) void appendSignals(sessionId, sig); });
    },
    onAudioLevel: (lvl) => {
      const key = `${sessionId}:${lvl.userId ?? "x"}`;
      const h = audioHistory.get(key) ?? [];
      h.push(lvl.rms);
      if (h.length > 60) h.shift();
      audioHistory.set(key, h);
      if (h.length % 20 === 0) { const s = toneFromEnergy(h, rel(lvl.timestampMs), "zoom-audio"); if (s) void appendSignals(sessionId, [s]); }
    },
    onState: (st) => { console.log("[whisperer] rtms", sessionId, st); },
    onError: (e) => { console.warn("[whisperer] rtms error", sessionId, e.message); },
  });
  rtms.set(sessionId, conn);
  await patchSession(sessionId, { zoomMeetingUuid: start.meeting_uuid, rtmsStreamId: start.rtms_stream_id, zoomMeetingId: start.meeting_id ? String(start.meeting_id) : session.zoomMeetingId });
}

// ─── express routes ───────────────────────────────────────────────────────

/** Register BEFORE express.json: the Zoom signature is computed over the raw body. */
export function registerZoomWebhook(app: Express): void {
  app.post("/api/zoom/webhook", express.text({ type: "*/*", limit: "1mb" }), async (req: Request, res: Response) => {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    let body: any;
    try { body = JSON.parse(raw); } catch { res.status(400).json({ error: "bad json" }); return; }
    if (body?.event === "endpoint.url_validation") { res.json(zoomValidationResponse(String(body.payload?.plainToken ?? ""))); return; }
    if (!verifyZoomWebhook(req.headers as Record<string, string | string[] | undefined>, raw)) { res.status(401).json({ error: "bad signature" }); return; }
    res.status(200).json({ ok: true });
    const p = body?.payload ?? {};
    try {
      if (body.event === "meeting.rtms_started") {
        const session = await findLiveSessionForZoom(p.meeting_id ?? p.object?.id);
        if (session) await attachRtms(session.id, { meeting_uuid: p.meeting_uuid, rtms_stream_id: p.rtms_stream_id, server_urls: p.server_urls, meeting_id: p.meeting_id ?? p.object?.id });
        else console.log("[whisperer] rtms started with no live session; start one on the Whisperer page first");
      } else if (body.event === "meeting.rtms_stopped") {
        for (const [id, conn] of Array.from(rtms.entries())) { const s = await getWhispererSession(id); if (!s || s.rtmsStreamId === p.rtms_stream_id) { conn.stop(); rtms.delete(id); } }
      }
    } catch (e) {
      console.warn("[whisperer] webhook handling failed", String(e).slice(0, 160));
    }
  });
}

export function registerWhispererRoutes(app: Express): void {
  app.get("/api/whisperer/reports/:id.pdf", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) { res.status(400).send("bad id"); return; }
    const exp = Number(req.query.exp ?? 0);
    const t = String(req.query.t ?? "");
    let workspaceId: number | null = null;
    if (exp && t && exp > Date.now()) {
      const a = Buffer.from(reportLinkToken(id, exp));
      const b = Buffer.from(t);
      if (a.length === b.length && timingSafeEqual(a, b)) workspaceId = -1; // signed link: any workspace
    }
    if (workspaceId === null) {
      try {
        const user = await sdk.authenticateRequest(req);
        const ws = await workspaceFor(user.id, user.name);
        workspaceId = ws?.id ?? null;
      } catch { /* not signed in */ }
    }
    if (workspaceId === null) { res.status(401).send("Sign in, or open the link from the text message."); return; }
    const report = workspaceId === -1 ? await getWhispererReportAny(id) : await getWhispererReport(id, workspaceId);
    if (!report?.pdfBase64) { res.status(404).send("Report not found"); return; }
    const safe = `${report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-cycle${report.cycle}.pdf`;
    res.setHeader("content-type", "application/pdf");
    res.setHeader("content-disposition", `inline; filename="${safe}"`);
    res.setHeader("cache-control", "private, no-store");
    res.send(Buffer.from(report.pdfBase64, "base64"));
  });
}

async function getWhispererReportAny(id: number) {
  // Signed links carry their own proof; look the report up without a workspace filter.
  const { getDb } = await import("./db");
  const { whispererReports } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(whispererReports).where(eq(whispererReports.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── tRPC ─────────────────────────────────────────────────────────────────

const turnSchema = z.object({ at: z.number().min(0), speaker: z.enum(["advisor", "client"]), text: z.string().min(1).max(4000), durationMs: z.number().min(0).optional(), source: z.enum(["zoom", "browser", "manual"]).optional() });
const signalSchema = z.object({ at: z.number().min(0), kind: z.enum(["tone", "body", "energy", "attention"]), value: z.string().max(300), score: z.number().min(-1).max(1), source: z.enum(["zoom-video", "zoom-audio", "browser-video", "browser-audio", "vision-model", "manual"]).optional() });

function publicSession(s: NonNullable<Awaited<ReturnType<typeof getWhispererSession>>>) {
  const { turns, signals, coachingLog, ...rest } = s;
  return { ...rest, turnCount: Array.isArray(turns) ? turns.length : 0, signalCount: Array.isArray(signals) ? signals.length : 0, coachingLog: Array.isArray(coachingLog) ? coachingLog.slice(-40) : [] };
}

export const whispererRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const ws = await workspaceFor(ctx.user.id, ctx.user.name);
    const settings = ws ? await getWhispererSettings(ws.id) : null;
    const live = ws ? (await listWhispererSessions(ws.id, 5)).find((s) => s.status === "live") ?? null : null;
    const zoom = zoomConfigured();
    return {
      sms: { mode: smsMode(), to: settings?.advisorPhone || DEFAULT_PHONE, enabled: settings?.smsEnabled ?? true },
      zoom: { api: zoom.api, webhook: zoom.webhook, webhookPath: "/api/zoom/webhook", rtmsAttached: live ? rtms.has(live.id) : false },
      vision: visionConfigured(),
      settings: settings ? { advisorPhone: settings.advisorPhone, advisorName: settings.advisorName, smsEnabled: settings.smsEnabled, cycleMinutes: settings.cycleMinutes, reportsPerCycle: settings.reportsPerCycle, zoomUserEmail: settings.zoomUserEmail } : { advisorPhone: DEFAULT_PHONE, advisorName: advisorDisplayName(), smsEnabled: true, cycleMinutes: 5, reportsPerCycle: 5, zoomUserEmail: null },
      live: live ? publicSession(live) : null,
      database: Boolean(ws),
      needs: [
        ...(smsMode() === "none" ? ["Texts: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM (or SMS_WEBHOOK_URL) in the host's environment."] : []),
        ...(!zoom.api ? ["Zoom recordings and transcripts: set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET (Server-to-Server OAuth app)."] : []),
        ...(!zoom.webhook ? ["Zoom live stream: set ZOOM_WEBHOOK_SECRET_TOKEN and point the app's event subscription at /api/zoom/webhook with meeting.rtms_started and meeting.rtms_stopped."] : []),
        ...(!visionConfigured() ? ["Body language: set ANTHROPIC_API_KEY or OPENAI_API_KEY."] : []),
      ],
    };
  }),

  saveSettings: protectedProcedure
    .input(z.object({ advisorPhone: z.string().max(30).optional(), advisorName: z.string().max(200).optional(), smsEnabled: z.boolean().optional(), cycleMinutes: z.number().int().min(1).max(30).optional(), reportsPerCycle: z.number().int().min(1).max(5).optional(), zoomUserEmail: z.string().max(320).optional() }))
    .mutation(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      if (!ws) return { saved: false as const, reason: "No workspace / database on this host." };
      const phone = input.advisorPhone !== undefined ? normalizePhone(input.advisorPhone) : undefined;
      if (input.advisorPhone !== undefined && !phone) return { saved: false as const, reason: "That is not a phone number." };
      const row = await upsertWhispererSettings(ws.id, { ...input, advisorPhone: phone ?? undefined });
      return { saved: Boolean(row) as boolean, reason: row ? undefined : "Could not save." };
    }),

  clients: protectedProcedure.query(async ({ ctx }) => {
    const ws = await workspaceFor(ctx.user.id, ctx.user.name);
    if (!ws) return [];
    const list = await getClients(ws.id);
    return list.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone }));
  }),

  start: protectedProcedure
    .input(z.object({ clientId: z.number().int().optional(), clientName: z.string().min(1).max(200), zoomMeetingId: z.string().max(64).optional() }))
    .mutation(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      if (!ws) throw new Error("No workspace / database on this host.");
      const settings = await getWhispererSettings(ws.id);
      for (const s of await listWhispererSessions(ws.id, 5)) if (s.status === "live") await endWhispererSession(s.id, "Ended automatically when a new call started.");
      const session = await createWhispererSession({ workspaceId: ws.id, clientId: input.clientId ?? null, clientName: input.clientName, advisorUserId: ctx.user.id, advisorName: settings?.advisorName ?? ctx.user.name ?? advisorDisplayName(), zoomMeetingId: input.zoomMeetingId ?? null });
      if (!session) throw new Error("Could not create the session.");
      contextCache.delete(session.id);
      const c = await contextFor(session);
      const r = await textAdvisor(ws.id, `WHISPERER armed for ${c.firstName ?? c.name}. Coaching every ${settings?.cycleMinutes ?? 5} min, urgent cues immediately, ${settings?.reportsPerCycle ?? 5} objection reports per cycle. Reply STOP to end texts.`);
      return { session: publicSession(session), context: c, smsSent: r.sent, smsReason: r.reason };
    }),

  ingest: protectedProcedure
    .input(z.object({ sessionId: z.number().int(), turns: z.array(turnSchema).max(200).optional(), signals: z.array(signalSchema).max(50).optional(), frameJpegBase64: z.string().max(2_000_000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      const session = ws ? await getWhispererSession(input.sessionId, ws.id) : null;
      if (!session || session.status !== "live") throw new Error("No live session with that id.");
      if (input.turns?.length) await appendTurns(session.id, input.turns as Turn[]);
      if (input.signals?.length) await appendSignals(session.id, input.signals as Signal[]);
      let frameRead: Signal[] | null = null;
      if (input.frameJpegBase64) {
        const last = lastFrameRead.get(session.id) ?? 0;
        if (Date.now() - last >= FRAME_INTERVAL_MS) {
          lastFrameRead.set(session.id, Date.now());
          frameRead = await readFrame(input.frameJpegBase64, Date.now() - new Date(session.startedAt).getTime(), "browser-video");
          if (frameRead) await appendSignals(session.id, frameRead);
        }
      }
      const got = await coachSession(session.id);
      if (!got) throw new Error("Session vanished.");
      await maybeTextUrgent(session.id, ws!.id, got.coaching, session.clientName);
      return { coaching: got.coaching, frameRead, turnCount: got.state.turns.length, signalCount: got.state.signals.length };
    }),

  coach: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      const session = ws ? await getWhispererSession(input.sessionId, ws.id) : null;
      if (!session) throw new Error("No session with that id.");
      const got = await coachSession(session.id);
      if (!got) throw new Error("Session vanished.");
      const reports = await listSessionReports(session.id, ws!.id);
      const settings = await getWhispererSettings(ws!.id);
      const every = (settings?.cycleMinutes ?? 5) * 60_000;
      const last = session.lastCycleAt ? new Date(session.lastCycleAt).getTime() : new Date(session.startedAt).getTime();
      return { coaching: got.coaching, session: publicSession(session), reports: reports.map((r) => ({ ...r, url: `/api/whisperer/reports/${r.id}.pdf` })), nextCycleInMs: Math.max(0, every - (Date.now() - last)), rtmsAttached: rtms.has(session.id), recentTurns: got.state.turns.slice(-12), recentSignals: got.state.signals.slice(-6) };
    }),

  runCycleNow: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      const session = ws ? await getWhispererSession(input.sessionId, ws.id) : null;
      if (!session || session.status !== "live") throw new Error("No live session with that id.");
      return runCycle(session.id, "manual");
    }),

  end: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      const session = ws ? await getWhispererSession(input.sessionId, ws.id) : null;
      if (!session) throw new Error("No session with that id.");
      const got = await coachSession(session.id);
      const memory = got ? summarizeCallForMemory(got.state.turns, got.coaching) : "Call ended.";
      rtms.get(session.id)?.stop();
      rtms.delete(session.id);
      await endWhispererSession(session.id, memory);
      contextCache.delete(session.id);
      if (session.clientId && got) {
        try {
          const stats = talkStats(got.state.turns);
          await createClientNote({ clientId: session.clientId, workspaceId: ws!.id, authorId: ctx.user.id, authorName: "AI Whisperer", noteType: "CALL", content: `${memory} Airtime advisor ${stats.advisorPct}% / client ${stats.clientPct}%. Cycles: ${session.cycles}. Reports on file: ${(await listSessionReports(session.id, ws!.id)).length}.` });
        } catch { /* notes are optional */ }
      }
      const r = await textAdvisor(ws!.id, `WHISPERER · call with ${session.clientName} ended.\n${memory}`);
      return { ended: true as const, memory, smsSent: r.sent };
    }),

  sessions: protectedProcedure.query(async ({ ctx }) => {
    const ws = await workspaceFor(ctx.user.id, ctx.user.name);
    if (!ws) return [];
    return (await listWhispererSessions(ws.id, 30)).map(publicSession);
  }),

  reports: protectedProcedure
    .input(z.object({ clientId: z.number().int().optional(), sessionId: z.number().int().optional() }))
    .query(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      if (!ws) return [];
      const list = input.sessionId ? await listSessionReports(input.sessionId, ws.id) : input.clientId ? await listClientReports(input.clientId, ws.id) : [];
      return list.map((r) => ({ ...r, url: `/api/whisperer/reports/${r.id}.pdf` }));
    }),

  zoomHistory: protectedProcedure
    .input(z.object({ clientName: z.string().min(1).max(200), days: z.number().int().min(7).max(365).default(180) }))
    .query(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      if (!zoomConfigured().api) return { configured: false as const, recordings: [] };
      const settings = ws ? await getWhispererSettings(ws.id) : null;
      const user = settings?.zoomUserEmail || "me";
      const recs = recordingsForClient(await listRecordings(user, input.days), input.clientName).slice(0, 6);
      const advisorNames = [settings?.advisorName ?? "", advisorDisplayName()].filter(Boolean);
      const out = [];
      for (const r of recs) {
        const vtt = await fetchTranscript(r).catch(() => null);
        const turns = vtt ? parseTranscript(vtt, advisorNames) : [];
        const stats = talkStats(turns, 24 * 3600_000);
        out.push({ uuid: r.uuid, topic: r.topic, startTime: r.start_time, durationMin: r.duration, hasTranscript: Boolean(vtt), turns: turns.length, advisorPct: stats.advisorPct, excerpt: turns.filter((t) => t.speaker === "client").slice(0, 3).map((t) => t.text.slice(0, 140)) });
      }
      return { configured: true as const, recordings: out };
    }),

  importZoomTranscript: protectedProcedure
    .input(z.object({ sessionId: z.number().int(), recordingUuid: z.string().max(200) }))
    .mutation(async ({ ctx, input }) => {
      const ws = await workspaceFor(ctx.user.id, ctx.user.name);
      const session = ws ? await getWhispererSession(input.sessionId, ws.id) : null;
      if (!session) throw new Error("No session with that id.");
      if (!zoomConfigured().api) throw new Error("Zoom API not configured.");
      const settings = await getWhispererSettings(ws!.id);
      const recs = await listRecordings(settings?.zoomUserEmail || "me", 365);
      const rec = recs.find((r) => r.uuid === input.recordingUuid);
      if (!rec) throw new Error("Recording not found.");
      const vtt = await fetchTranscript(rec);
      if (!vtt) throw new Error("That recording has no transcript.");
      const turns = parseTranscript(vtt, [session.advisorName ?? "", settings?.advisorName ?? "", advisorDisplayName()].filter(Boolean));
      await appendTurns(session.id, turns);
      return { imported: turns.length };
    }),

  testText: protectedProcedure.mutation(async ({ ctx }) => {
    const ws = await workspaceFor(ctx.user.id, ctx.user.name);
    if (!ws) return { sent: false, reason: "No workspace." };
    return textAdvisor(ws.id, "WHISPERER test: texts are reaching this phone. Coaching arrives here during live calls.");
  }),
});
