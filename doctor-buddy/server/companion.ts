/**
 * The companion's server side: the turn engine with an optional language-model
 * phrasing pass, and the camera frame read. Every procedure is protected
 * (signed in, current consent, entitlement); the frame read additionally
 * requires the person's recorded video-analysis consent, and the audio
 * signals the browser computes are only accepted with audio consent.
 *
 * The decision to speak, and its kind, are made in shared/nlp/companion.ts.
 * The model here only rephrases a line the engine already chose, inside the
 * engine's constraints, and its output is bounded and checked before it is
 * used. If the model is unavailable the deterministic line is spoken.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { getConsentByUserId } from "./db";
import { companion, companionPromptBlock, type CompanionOutput } from "@shared/nlp/companion";
import { FRAME_INTERVAL_MS, MAX_FRAME_BASE64, parseVisionReply, signalsFromVision } from "@shared/nlp/signals";
import { DR_BUDDY_SYSTEM_PROMPT } from "./drBuddy";
import { PUBLIC_WELLNESS_MODE } from "./compliance/releasePolicy";

const VISION_SYSTEM =
  "You describe, for a person's own awareness, how they appear on their camera during a reflective conversation with a wellness companion. " +
  "Describe in under 25 words their posture, facial expression, gaze and how present they seem; then judge openness. " +
  "Do not infer emotions you cannot see, and never speculate about health, diagnosis or intoxication. " +
  "Reply with JSON only: {\"summary\": string, \"score\": number between -1 (closed, withdrawn, turned away) and 1 (open, present, engaged), \"attention\": number 0..1}. " +
  "If no face is visible, reply {\"summary\":\"no face visible\",\"score\":0,\"attention\":0}.";

const turnSchema = z.object({
  at: z.number().finite().min(0).max(24 * 3600_000),
  speaker: z.enum(["person", "companion"]),
  text: z.string().max(4000),
  durationMs: z.number().finite().min(0).max(3600_000).optional(),
});

const signalSchema = z.object({
  at: z.number().finite().min(0).max(24 * 3600_000),
  kind: z.enum(["body", "tone", "energy", "attention"]),
  value: z.string().max(200),
  score: z.number().finite().min(-1).max(1),
  source: z.enum(["browser-video", "browser-audio", "vision-model", "manual"]).optional(),
});

const lastFrameAt = new Map<number, number>();

async function recordingConsent(userId: number): Promise<{ audio: boolean; video: boolean }> {
  const c = await getConsentByUserId(userId);
  if (!c || c.withdrawnAt) return { audio: false, video: false };
  return { audio: Boolean(c.agreedToAudioAnalysis), video: Boolean(c.agreedToVideoAnalysis) };
}

/** Ask the model to say the engine's line more naturally, inside the engine's limits. */
async function phrase(out: CompanionOutput, edition: "public" | "clinical"): Promise<string | null> {
  const say = out.intervention.say;
  if (!say || !ENV.forgeApiKey) return null;
  // Safety lines are spoken exactly as written.
  if (out.intervention.kind === "safety") return null;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `${DR_BUDDY_SYSTEM_PROMPT}\n\n${companionPromptBlock(out, edition)}\n\nReply with the spoken line only, no quotes, no preamble, at most ${Math.max(60, say.length + 40)} characters, in the same representational system.` },
        { role: "user", content: `The person's last words: "${out.reading.last.slice(0, 600)}"` },
      ],
    });
    const text = String(response.choices?.[0]?.message?.content ?? "").trim().replace(/^["“]|["”]$/g, "");
    if (!text || text.length > say.length + 120 || text.length < 8) return null;
    // A rephrasing must keep the shape: a question stays a question, a permission request stays one.
    if ((out.intervention.kind === "ask-permission" || out.intervention.kind === "question" || out.intervention.kind === "offer-pattern") && !/\?/.test(text)) return null;
    if (/\b(diagnos|disorder|prescri|clinical|patient)\b/i.test(text) && edition === "public") return null;
    return text;
  } catch (error) {
    console.warn("[companion] phrasing unavailable:", error instanceof Error ? error.message.slice(0, 100) : "unknown");
    return null;
  }
}

export const companionRouter = router({
  /** The person's current recording consent, so the page can enable the mic and camera. */
  consent: protectedProcedure.query(async ({ ctx }) => recordingConsent(ctx.user.id)),

  /** One engine turn. Pure engine plus an optional phrasing pass. */
  turn: protectedProcedure
    .input(z.object({
      turns: z.array(turnSchema).max(400),
      signals: z.array(signalSchema).max(200).optional().default([]),
      now: z.number().finite().min(0).max(24 * 3600_000),
      lastInterventionAt: z.number().finite().min(0).optional(),
      permission: z.enum(["unknown", "asked", "granted", "declined"]).optional(),
      permissionAt: z.number().finite().min(0).optional(),
      offered: z.array(z.number().int().min(1).max(77)).max(77).optional(),
      phrase: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const consent = await recordingConsent(ctx.user.id);
      // Signals the browser computed from the microphone or camera are only
      // read when the matching consent is on record; the rest are dropped.
      const signals = input.signals.filter(s =>
        (s.source === "browser-audio" && consent.audio) ||
        ((s.source === "browser-video" || s.source === "vision-model") && consent.video) ||
        s.source === "manual" || s.source === undefined && false);
      const edition = PUBLIC_WELLNESS_MODE ? "public" : "clinical";
      const out = companion({ ...input, signals, edition, consent });
      const spoken = input.phrase ? await phrase(out, edition) : null;
      return {
        reading: {
          rep: { primary: out.reading.rep.primary, secondary: out.reading.rep.secondary, percent: out.reading.rep.percent, confidence: out.reading.rep.confidence, recent: out.reading.rep.hits.slice(-8).map(h => h.word) },
          guide: { system: out.reading.guide.system, openers: out.reading.guide.openers, exampleQuestion: out.reading.guide.exampleQuestion },
          metaModel: out.reading.metaModel.map(f => ({ pattern: f.pattern, name: f.name, category: f.category, match: f.match, severity: f.severity, challenge: f.challenge })),
          metaPrograms: out.reading.salientMetaPrograms.map(r => ({ key: r.key, name: r.name, leading: r.leading?.label ?? null, confidence: r.confidence, evidence: r.leading?.evidence ?? [], pacing: r.pacing })),
          patterns: out.reading.patterns.map(p => ({ id: p.id, name: p.name, chapter: p.chapter, score: p.score, because: p.because, offerable: p.offerable, invitation: p.invitation, concept: p.concept, steps: p.steps, needsGuide: p.needsGuide, caution: p.caution ?? null })),
          state: out.reading.state,
        },
        timing: out.timing,
        intervention: { ...out.intervention, spoken: spoken ?? out.intervention.say },
        consent,
      };
    }),

  /** Read one camera frame, with video consent, at most once per FRAME_INTERVAL_MS. */
  readFrame: protectedProcedure
    .input(z.object({ jpegBase64: z.string().min(100).max(MAX_FRAME_BASE64), at: z.number().finite().min(0) }))
    .mutation(async ({ input, ctx }) => {
      const consent = await recordingConsent(ctx.user.id);
      if (!consent.video) throw new TRPCError({ code: "FORBIDDEN", message: "Camera analysis needs your recorded consent first. You can turn it on in the companion's consent settings." });
      const last = lastFrameAt.get(ctx.user.id) ?? 0;
      const nowMs = Date.now();
      if (nowMs - last < FRAME_INTERVAL_MS) return { signals: null, throttled: true as const, nextInMs: FRAME_INTERVAL_MS - (nowMs - last) };
      lastFrameAt.set(ctx.user.id, nowMs);
      if (!/^[A-Za-z0-9+/=\r\n]+$/.test(input.jpegBase64)) throw new TRPCError({ code: "BAD_REQUEST", message: "The frame must be base64 JPEG data." });
      if (!ENV.forgeApiKey) return { signals: null, throttled: false as const, nextInMs: FRAME_INTERVAL_MS };
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: VISION_SYSTEM },
            { role: "user", content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${input.jpegBase64}`, detail: "low" } },
              { type: "text", text: "Read this frame." },
            ] },
          ],
        });
        const text = String(response.choices?.[0]?.message?.content ?? "");
        const signals = signalsFromVision(parseVisionReply(text), input.at);
        return { signals, throttled: false as const, nextInMs: FRAME_INTERVAL_MS };
      } catch (error) {
        console.warn("[companion] frame read failed:", error instanceof Error ? error.message.slice(0, 100) : "unknown");
        return { signals: null, throttled: false as const, nextInMs: FRAME_INTERVAL_MS };
      }
    }),
});

/** Test seam. */
export function resetCompanionState() { lastFrameAt.clear(); }
