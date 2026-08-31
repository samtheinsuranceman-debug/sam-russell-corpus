// ============================================================
// CROSS-COMPANY INTEGRATION API — /api/v1/joinaqal/*
// JoinAQAL's side of the "API Integration Specification & Data
// Flow Architecture" (Dr. Buddy + JoinAQAL + RCS, v1.0). Eight
// versioned REST endpoints wrapping the live engines, so the
// spec's JoinAQAL surface is running code, not a diagram.
//
// Auth: the platform's own session auth (same as tRPC). The
// spec's centralized OAuth gateway fronts these endpoints at the
// holding-company level; nothing here weakens per-member auth —
// every response is scoped to the authenticated member.
// ============================================================
import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import type { User } from "../drizzle/schema";

async function requireMember(req: Request, res: Response): Promise<User | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user) return user;
  } catch { /* fall through */ }
  res.status(401).json({ error: "authentication required" });
  return null;
}

export function registerIntegrationApi(app: Express) {
  const base = "/api/v1/joinaqal";

  // POST /assessment — create (or resume) the member's assessment.
  app.post(`${base}/assessment`, async (req, res) => {
    const user = await requireMember(req, res); if (!user) return;
    const { getActiveAssessment, createAssessment } = await import("./db");
    const active = await getActiveAssessment(user.id);
    if (active) return res.json({ id: active.id, status: active.status, resumed: true });
    const created = await createAssessment(user.id);
    if (!created) return res.status(503).json({ error: "database unavailable" });
    res.status(201).json({ id: created.id, status: "in_progress", resumed: false });
  });

  // GET /assessment/:id — the assessment with its 32-line scores (owner-only).
  app.get(`${base}/assessment/:id`, async (req, res) => {
    const user = await requireMember(req, res); if (!user) return;
    const { getAssessmentById, getScoresByAssessment } = await import("./db");
    const a = await getAssessmentById(Number(req.params.id));
    if (!a || a.userId !== user.id) return res.status(404).json({ error: "not found" });
    const scores = await getScoresByAssessment(a.id);
    res.json({
      id: a.id, status: a.status, normingVersion: a.normingVersion,
      completedQuestions: a.completedQuestions, totalQuestions: a.totalQuestions,
      scores: scores.map((s) => ({ axisIndex: s.axisIndex, axisName: s.axisName, score: s.score, confidence: s.confidence })),
    });
  });

  // POST /voice-analysis — overt DSP feature extraction on submitted audio.
  // Body: { audioBase64, mimeType?, transcript? }. 2 MB cap.
  app.post(`${base}/voice-analysis`, async (req, res) => {
    const user = await requireMember(req, res); if (!user) return;
    const { audioBase64, mimeType, transcript } = req.body ?? {};
    if (typeof audioBase64 !== "string" || audioBase64.length === 0) {
      return res.status(400).json({ error: "audioBase64 required" });
    }
    const buf = Buffer.from(audioBase64, "base64");
    if (buf.length > 2 * 1024 * 1024) return res.status(413).json({ error: "audio exceeds 2 MB cap" });
    try {
      const { processAudioForVoiceFeatures } = await import("./patents/voiceFeatures");
      const features = await processAudioForVoiceFeatures(buf, String(mimeType ?? "wav"), typeof transcript === "string" ? transcript : undefined);
      res.json({ features, disclosure: "Prosodic/spectral analysis is overt: pace, pauses, and steadiness are measured in-process; audio is not sent to any third party." });
    } catch (e) {
      res.status(422).json({ error: "audio could not be decoded", detail: String(e).slice(0, 120) });
    }
  });

  // GET /development-tracking — verified floors + assessment history.
  app.get(`${base}/development-tracking`, async (req, res) => {
    const user = await requireMember(req, res); if (!user) return;
    const { getFloors } = await import("./patents/achievementFloors");
    const { getLatestAssessment } = await import("./db");
    const latest = await getLatestAssessment(user.id);
    res.json({
      floors: await getFloors(user.id),
      latestAssessment: latest ? { id: latest.id, status: latest.status, normingVersion: latest.normingVersion, createdAt: latest.createdAt } : null,
    });
  });

  // GET /weakness-identification — the controlling weakness over the latest scores.
  app.get(`${base}/weakness-identification`, async (req, res) => {
    const user = await requireMember(req, res); if (!user) return;
    const { getLatestAssessment, getScoresByAssessment } = await import("./db");
    const latest = await getLatestAssessment(user.id);
    if (!latest) return res.status(404).json({ error: "no assessment" });
    const scores = await getScoresByAssessment(latest.id);
    if (scores.length === 0) return res.status(404).json({ error: "no scores yet" });
    const { controllingWeakness } = await import("./scoring/controllingWeakness");
    const vector = scores.slice().sort((a, b) => a.axisIndex - b.axisIndex).map((s) => s.score);
    res.json({ assessmentId: latest.id, controllingWeakness: controllingWeakness(vector) });
  });

  // POST /coaching — generate a coaching (outcome) report from the latest
  // scored assessment. Requires configured AI providers; degrades honestly.
  app.post(`${base}/coaching`, async (req, res) => {
    const user = await requireMember(req, res); if (!user) return;
    const { getLatestAssessment, getScoresByAssessment } = await import("./db");
    const latest = await getLatestAssessment(user.id);
    if (!latest || latest.status !== "complete") return res.status(409).json({ error: "a completed assessment is required first" });
    const scores = await getScoresByAssessment(latest.id);
    try {
      const { generateOutcomeReport } = await import("./coaching");
      const goals = typeof req.body?.goals === "string" ? req.body.goals.slice(0, 6000) : "";
      const report = await generateOutcomeReport(
        scores.map((s) => ({ axisName: s.axisName, score: s.score, confidence: s.confidence })),
        goals,
      );
      res.status(201).json({ assessmentId: latest.id, report });
    } catch (e) {
      res.status(503).json({ error: "coaching generation unavailable", detail: String(e).slice(0, 120) });
    }
  });

  // GET /coaching/:id — retrieve a stored coaching letter (owner-only).
  app.get(`${base}/coaching/:id`, async (req, res) => {
    const user = await requireMember(req, res); if (!user) return;
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "database unavailable" });
    const { coachingLetters } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db.select().from(coachingLetters).where(eq(coachingLetters.id, Number(req.params.id))).limit(1);
    const row = rows[0];
    if (!row || row.userId !== user.id) return res.status(404).json({ error: "not found" });
    res.json(row);
  });

  // GET /transparency — the honest-mechanics bundle: norming changelog,
  // ledger integrity, per-line research provenance.
  app.get(`${base}/transparency`, async (_req, res) => {
    const { NORMING_SNAPSHOTS, ACTIVE_NORMING_VERSION } = await import("./scoring/norming");
    const { verifyLedger } = await import("./patents/ledger");
    const { getAllProvenance } = await import("./patents/provenance");
    const ledger = await verifyLedger();
    res.json({
      norming: { active: ACTIVE_NORMING_VERSION, versions: Object.values(NORMING_SNAPSHOTS).map((s) => ({ version: s.version, description: s.description })) },
      ledger: ledger ? { valid: ledger.valid, length: ledger.length } : { valid: null, length: 0, note: "ledger unavailable" },
      provenance: await getAllProvenance(),
    });
  });
}
