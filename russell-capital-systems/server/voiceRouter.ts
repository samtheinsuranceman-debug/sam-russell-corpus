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
import { activeVoice, setActiveVoice, voiceSource, type VoiceProvider } from "./voiceSettings";
import { listHeygenVoices, synthesizeWith } from "./speech";
import { isOwnerSession } from "./ownerGuard";

const SAMPLE_LINE = "Doctor, thank you for sitting down with me. I am going to ask about every asset you have, the way a seasoned advisor would across the table, and then I will explain it all back to you.";

type XiVoice = {
  voice_id: string; name: string; category?: string; description?: string | null;
  labels?: Record<string, string>; preview_url?: string | null; sharing?: { status?: string } | null;
  fine_tuning?: { state?: Record<string, string> } | null;
};

function ownerOnly(user: { role?: string | null; email?: string | null; openId?: string | null }) {
  if (user.role === "admin" || isOwnerSession(user)) return;
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

export const voiceRouter = router({
  current: protectedProcedure.query(async ({ ctx }) => {
    ownerOnly(ctx.user);
    const v = await activeVoice();
    return {
      provider: v?.provider ?? null, voiceId: v?.voiceId ?? null, name: v?.name ?? null, source: await voiceSource(),
      keys: { elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY), heygen: Boolean(process.env.HEYGEN_API_KEY) },
      env: { provider: process.env.VOICE_PROVIDER ?? null, heygenVoiceName: process.env.HEYGEN_VOICE_NAME ?? null, heygenVoiceId: process.env.HEYGEN_VOICE_ID ?? null, elevenVoiceId: process.env.ELEVENLABS_VOICE_ID ?? null },
    };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    ownerOnly(ctx.user);
    const active = await activeVoice();
    const out: Array<{ provider: VoiceProvider; voiceId: string; name: string; category: string; description: string; labels: Record<string, string>; previewUrl: string | null; own: boolean; active: boolean }> = [];
    const errors: string[] = [];
    if (process.env.HEYGEN_API_KEY) {
      try {
        for (const v of await listHeygenVoices("private")) {
          out.push({ provider: "heygen", voiceId: v.voice_id, name: v.name, category: "heygen clone", description: [v.language, v.gender].filter(Boolean).join(" · "), labels: { language: v.language ?? "", gender: v.gender ?? "" }, previewUrl: v.preview_audio_url ?? null, own: true, active: active?.provider === "heygen" && active.voiceId === v.voice_id });
        }
      } catch (e) { errors.push(`HeyGen: ${String((e as Error).message ?? e).slice(0, 120)}`); }
    }
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const res = await fetch("https://api.elevenlabs.io/v1/voices?show_legacy=true", { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY }, signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { voices?: XiVoice[] };
        for (const v of data.voices ?? []) {
          out.push({ provider: "elevenlabs", voiceId: v.voice_id, name: v.name, category: v.category ?? "premade", description: v.description ?? "", labels: v.labels ?? {}, previewUrl: v.preview_url ?? null, own: OWN_CATEGORIES.has(v.category ?? ""), active: active?.provider === "elevenlabs" && active.voiceId === v.voice_id });
        }
      } catch (e) { errors.push(`ElevenLabs: ${String((e as Error).message ?? e).slice(0, 120)}`); }
    }
    if (!out.length && !errors.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Neither HEYGEN_API_KEY nor ELEVENLABS_API_KEY is set on this host." });
    return { voices: out.sort((a, b) => Number(b.own) - Number(a.own) || (a.provider === "heygen" ? -1 : 1) - (b.provider === "heygen" ? -1 : 1) || a.name.localeCompare(b.name)), errors };
  }),

  preview: protectedProcedure
    .input(z.object({ provider: z.enum(["elevenlabs", "heygen"]).default("elevenlabs"), voiceId: z.string().min(4).max(64), text: z.string().max(600).optional() }))
    .mutation(async ({ ctx, input }) => {
      ownerOnly(ctx.user);
      try {
        const r = await synthesizeWith({ provider: input.provider, voiceId: input.voiceId }, input.text?.trim() || SAMPLE_LINE);
        return { audioBase64: r.audio.toString("base64"), mimeType: r.mimeType, bytes: r.audio.length, via: r.via };
      } catch (e) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: String((e as Error).message ?? e).slice(0, 200) });
      }
    }),

  use: protectedProcedure
    .input(z.object({ provider: z.enum(["elevenlabs", "heygen"]).default("elevenlabs"), voiceId: z.string().min(4).max(64).nullable() }))
    .mutation(async ({ ctx, input }) => {
      ownerOnly(ctx.user);
      const ok = await setActiveVoice(input.voiceId ? { provider: input.provider, voiceId: input.voiceId } : null);
      const v = await activeVoice();
      if (!ok) return { saved: false as const, reason: "No database on this host; set VOICE_PROVIDER / HEYGEN_VOICE_NAME or ELEVENLABS_VOICE_ID in the environment instead.", provider: v?.provider ?? null, voiceId: v?.voiceId ?? null };
      return { saved: true as const, provider: v?.provider ?? null, voiceId: v?.voiceId ?? null, source: await voiceSource() };
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
      if (input.useNow) await setActiveVoice({ provider: "elevenlabs", voiceId: body.voice_id });
      return { voiceId: body.voice_id, active: input.useNow };
    }),
});
