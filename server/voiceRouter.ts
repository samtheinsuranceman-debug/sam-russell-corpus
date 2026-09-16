// ============================================================
// VOICE STUDIO — the owner picks, previews and clones the site's voice.
//
// Owner-only (the owner sign-in, or the account whose email is
// OWNER_EMAIL). Talks to ElevenLabs with the host's ELEVENLABS_API_KEY:
//   list     every voice the workspace can use, the owner's own first
//   preview  the advisor's opening line in any voice, as audio
//   use      make a voice the site's voice, at once, no redeploy
//   clone    an instant clone from one to five recordings, then use it
// ============================================================
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { activeVoiceId, setActiveVoiceId, voiceSource } from "./voiceSettings";

const SAMPLE_LINE = "Doctor, thank you for sitting down with me. I am going to ask about every asset you have, the way a seasoned advisor would across the table, and then I will explain it all back to you.";

type XiVoice = {
  voice_id: string; name: string; category?: string; description?: string | null;
  labels?: Record<string, string>; preview_url?: string | null; sharing?: { status?: string } | null;
  fine_tuning?: { state?: Record<string, string> } | null;
};

function ownerOnly(user: { role?: string | null; email?: string | null }) {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (user.role === "admin" || (owner && user.email?.toLowerCase() === owner)) return;
  throw new TRPCError({ code: "FORBIDDEN", message: "The Voice Studio is for the site owner." });
}

function apiKey(): string {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "ELEVENLABS_API_KEY is not set on this host." });
  return k;
}

export const OWN_CATEGORIES = new Set(["cloned", "professional", "generated"]);

/** The owner's own voices first (clones, professional clones, designed), then the stock ones. */
export function orderVoices<T extends { category?: string; name: string }>(voices: T[]): T[] {
  return [...voices].sort((a, b) => {
    const ao = OWN_CATEGORIES.has(a.category ?? "") ? 0 : 1;
    const bo = OWN_CATEGORIES.has(b.category ?? "") ? 0 : 1;
    return ao - bo || a.name.localeCompare(b.name);
  });
}

async function tts(voiceId: string, text: string): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: { "content-type": "application/json", "xi-api-key": apiKey(), accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: `ElevenLabs refused the preview (HTTP ${res.status}). Some voices need fine-tuning before they can speak.` });
  return Buffer.from(await res.arrayBuffer());
}

export const voiceRouter = router({
  current: protectedProcedure.query(async ({ ctx }) => {
    ownerOnly(ctx.user);
    return { voiceId: await activeVoiceId(), source: await voiceSource(), apiKey: Boolean(process.env.ELEVENLABS_API_KEY), envVoiceId: process.env.ELEVENLABS_VOICE_ID ?? null };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    ownerOnly(ctx.user);
    const res = await fetch("https://api.elevenlabs.io/v1/voices?show_legacy=true", { headers: { "xi-api-key": apiKey() }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: `ElevenLabs voice list failed (HTTP ${res.status}).` });
    const data = (await res.json()) as { voices?: XiVoice[] };
    const active = await activeVoiceId();
    return orderVoices((data.voices ?? []).map((v) => ({
      voiceId: v.voice_id, name: v.name, category: v.category ?? "premade", description: v.description ?? "",
      labels: v.labels ?? {}, previewUrl: v.preview_url ?? null, own: OWN_CATEGORIES.has(v.category ?? ""), active: v.voice_id === active,
    })));
  }),

  preview: protectedProcedure
    .input(z.object({ voiceId: z.string().min(4).max(64), text: z.string().max(600).optional() }))
    .mutation(async ({ ctx, input }) => {
      ownerOnly(ctx.user);
      const audio = await tts(input.voiceId, input.text?.trim() || SAMPLE_LINE);
      return { audioBase64: audio.toString("base64"), mimeType: "audio/mpeg", bytes: audio.length };
    }),

  use: protectedProcedure
    .input(z.object({ voiceId: z.string().min(4).max(64).nullable() }))
    .mutation(async ({ ctx, input }) => {
      ownerOnly(ctx.user);
      const ok = await setActiveVoiceId(input.voiceId);
      if (!ok) return { saved: false as const, reason: "No database on this host; set ELEVENLABS_VOICE_ID in the environment instead.", voiceId: await activeVoiceId() };
      return { saved: true as const, voiceId: await activeVoiceId(), source: await voiceSource() };
    }),

  clone: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(80),
      description: z.string().max(500).optional(),
      files: z.array(z.object({ name: z.string().max(200), mimeType: z.string().max(100), base64: z.string().max(14_000_000) })).min(1).max(5),
      useNow: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      ownerOnly(ctx.user);
      const form = new FormData();
      form.set("name", input.name);
      if (input.description) form.set("description", input.description);
      form.set("labels", JSON.stringify({ source: "Russell Capital Systems Voice Studio" }));
      for (const f of input.files) form.append("files", new Blob([Buffer.from(f.base64, "base64")], { type: f.mimeType || "audio/mpeg" }), f.name || "sample.mp3");
      const res = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: { "xi-api-key": apiKey() }, body: form, signal: AbortSignal.timeout(120_000) });
      const body = (await res.json().catch(() => ({}))) as { voice_id?: string; detail?: { message?: string } | string };
      if (!res.ok || !body.voice_id) {
        const msg = typeof body.detail === "string" ? body.detail : body.detail?.message;
        throw new TRPCError({ code: "BAD_GATEWAY", message: `ElevenLabs could not clone the voice (HTTP ${res.status})${msg ? `: ${msg}` : ""}.` });
      }
      if (input.useNow) await setActiveVoiceId(body.voice_id);
      return { voiceId: body.voice_id, active: input.useNow };
    }),
});
