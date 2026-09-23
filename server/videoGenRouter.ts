// ============================================================
// VIDEO GENERATION ROUTER — the owner's session only (every job is billed).
//
// A thin door onto server/videoGen.ts (Runway, Luma): which are keyed,
// start a job, read a job. No page of its own; the owner's tools call it.
// ============================================================
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { isOwnerSession } from "./ownerGuard";
import { ChinaPolicyError } from "@shared/aiProviders";
import { createVideo, LUMA_MODELS, RUNWAY_IMAGE_MODELS, RUNWAY_TEXT_MODELS, videoGenConfigured, videoJob } from "./videoGen";

const ownerOnly = protectedProcedure.use(async ({ ctx, next }) => {
  if (isOwnerSession(ctx.user)) return next();
  throw new TRPCError({ code: "FORBIDDEN", message: "Video generation is for the site owner." });
});

const provider = z.enum(["runway", "luma"]);

export const videoGenRouter = router({
  status: ownerOnly.query(() => ({
    configured: videoGenConfigured(),
    models: { runway: { text: [...RUNWAY_TEXT_MODELS], image: [...RUNWAY_IMAGE_MODELS] }, luma: [...LUMA_MODELS] },
  })),

  create: ownerOnly
    .input(z.object({
      provider,
      prompt: z.string().min(3).max(2000),
      imageUrl: z.string().url().max(2000).optional(),
      model: z.string().max(64).optional(),
      aspect: z.enum(["landscape", "portrait"]).default("landscape"),
      durationSec: z.number().int().min(2).max(10).optional(),
    }))
    .mutation(async ({ input }) => {
      if (!videoGenConfigured()[input.provider]) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `${input.provider === "runway" ? "Runway" : "Luma"} is not configured on this host.` });
      try {
        const { provider: p, ...req } = input;
        return await createVideo(p, req);
      } catch (e) {
        const code = e instanceof ChinaPolicyError || /not offered here/.test(String((e as Error).message)) ? "BAD_REQUEST" : "BAD_GATEWAY";
        throw new TRPCError({ code, message: String((e as Error).message ?? e).slice(0, 240) });
      }
    }),

  job: ownerOnly
    .input(z.object({ provider, id: z.string().min(4).max(100) }))
    .query(async ({ input }) => {
      try {
        return await videoJob(input.provider, input.id);
      } catch (e) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: String((e as Error).message ?? e).slice(0, 240) });
      }
    }),
});
