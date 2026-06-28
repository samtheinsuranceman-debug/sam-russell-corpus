import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getCalibrationProfile,
  upsertCalibrationProfile,
  updateImpulseScore,
  computeLockInStatus,
  computeRaffleEligibility,
  createRecording,
  getRecordings,
  getRandomFailureRecording,
  createTemptationEntry,
  getTemptationEntries,
  getTemptationStats,
} from "./db";
import { storagePut, storageGetSignedUrl } from "./storage";
import { nanoid } from "nanoid";
import { createCheckoutSession } from "./stripe/checkout";
import { generateImage } from "./_core/imageGeneration";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== CALIBRATION =====
  calibration: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getCalibrationProfile(ctx.user.id);
    }),
    save: protectedProcedure.input(z.object({
      visualTrigger: z.string().optional(),
      visualScene: z.string().optional(),
      visualFuture: z.string().optional(),
      auditoryDialog: z.string().optional(),
      auditoryTone: z.string().optional(),
      auditoryPermission: z.string().optional(),
      kinestheticFeeling: z.string().optional(),
      kinestheticLocation: z.string().optional(),
      kinestheticIntensity: z.string().optional(),
      triggerSequence: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await upsertCalibrationProfile({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),
    uploadSelfie: protectedProcedure.input(z.object({
      imageBase64: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const fileKey = `selfies/${ctx.user.id}/${nanoid()}.jpg`;
      const { key: storedKey, url } = await storagePut(fileKey, buffer, "image/jpeg");
      // Save selfie URL to profile
      await upsertCalibrationProfile({
        userId: ctx.user.id,
        selfieUrl: url,
      });
      // Generate failure and victory avatars
      try {
        const signedUrl = await storageGetSignedUrl(storedKey);
        const [failureResult, victoryResult] = await Promise.all([
          generateImage({
            prompt: "Transform this person's face to look unhealthy, tired, and aged: add grey desaturated skin tone, dark bags under eyes, slightly bloated puffy face, dull lifeless eyes, cracked dry lips, visible aging lines. The background should be dark and gloomy. Keep the person recognizable but show the effects of poor health choices. Photorealistic style.",
            originalImages: [{ url: signedUrl, mimeType: "image/jpeg" }],
          }),
          generateImage({
            prompt: "Transform this person's face to look radiantly healthy, confident, and royal: add a golden glowing skin tone, bright sparkling eyes, slightly slimmer defined jawline, a beautiful golden crown on their head, golden sparkle dust particles floating around them, warm golden light aura. The background should be bright and luxurious. Keep the person recognizable but show them at their absolute best. Photorealistic style.",
            originalImages: [{ url: signedUrl, mimeType: "image/jpeg" }],
          }),
        ]);
        // Save generated avatars
        await upsertCalibrationProfile({
          userId: ctx.user.id,
          failureAvatarUrl: failureResult.url || null,
          victoryAvatarUrl: victoryResult.url || null,
        });
        return { success: true, selfieUrl: url, failureAvatarUrl: failureResult.url, victoryAvatarUrl: victoryResult.url };
      } catch (err) {
        console.error("[Avatar] Generation failed:", err);
        // Still save the selfie even if avatar generation fails
        return { success: true, selfieUrl: url, failureAvatarUrl: null, victoryAvatarUrl: null };
      }
    }),
    getAvatar: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getCalibrationProfile(ctx.user.id);
      return {
        selfieUrl: profile?.selfieUrl || null,
        failureAvatarUrl: profile?.failureAvatarUrl || null,
        victoryAvatarUrl: profile?.victoryAvatarUrl || null,
        lockedStatus: profile?.lockedStatus || "none",
        score: profile?.impulseControlScore ?? 50,
      };
    }),
  }),

  // ===== IMPULSE SCORE =====
  impulseScore: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getCalibrationProfile(ctx.user.id);
      const score = profile?.impulseControlScore ?? 50;
      const lockedStatus = profile?.lockedStatus ?? "none";
      const lockIn = computeLockInStatus(score, lockedStatus);
      return { score, ...lockIn };
    }),
    raffle: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getCalibrationProfile(ctx.user.id);
      const score = profile?.impulseControlScore ?? 50;
      const daysAt75 = profile?.daysAt75Plus ?? 0;
      const raffle = computeRaffleEligibility({
        subscriptionStartedAt: ctx.user.subscriptionStartedAt,
        subscriptionStatus: ctx.user.subscriptionStatus || "free_trial",
      }, score, daysAt75);
      return raffle;
    }),
  }),

  // ===== RECORDINGS =====
  recordings: router({
    list: protectedProcedure.input(z.object({
      type: z.enum(["failure", "victory"]).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return getRecordings(ctx.user.id, input?.type);
    }),
    upload: protectedProcedure.input(z.object({
      type: z.enum(["failure", "victory"]),
      audioBase64: z.string(),
      duration: z.number().optional(),
      howTheyFeel: z.string().optional(),
      whatTheySaid: z.string().optional(),
      futureOutlook: z.string().optional(),
      prideDescription: z.string().optional(),
      reinforcement: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.audioBase64, "base64");
      const fileKey = `recordings/${ctx.user.id}/${nanoid()}.webm`;
      const { url } = await storagePut(fileKey, buffer, "audio/webm");
      await createRecording({
        userId: ctx.user.id,
        type: input.type,
        fileKey,
        fileUrl: url,
        duration: input.duration,
        howTheyFeel: input.howTheyFeel,
        whatTheySaid: input.whatTheySaid,
        futureOutlook: input.futureOutlook,
        prideDescription: input.prideDescription,
        reinforcement: input.reinforcement,
      });
      // Update impulse score — positive only (victories gain points, failures don't deduct)
      if (input.type === "victory") {
        await updateImpulseScore(ctx.user.id, 5);
      }
      return { success: true, url };
    }),
    getPatternInterrupt: protectedProcedure.query(async ({ ctx }) => {
      return getRandomFailureRecording(ctx.user.id);
    }),
  }),

  // ===== SUBSCRIPTION =====
  subscription: router({
    createCheckout: protectedProcedure.input(z.object({
      origin: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const result = await createCheckoutSession({
        userId: ctx.user.id,
        userEmail: ctx.user.email || "",
        userName: ctx.user.name || "",
        origin: input.origin,
      });
      return result;
    }),
    status: protectedProcedure.query(async ({ ctx }) => {
      return {
        status: ctx.user.subscriptionStatus || "free_trial",
        trialStartedAt: ctx.user.trialStartedAt,
        subscriptionStartedAt: ctx.user.subscriptionStartedAt,
      };
    }),
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      const subId = ctx.user.stripeSubscriptionId;
      if (subId) {
        await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
      }
      const db = await (await import("./db")).getDb();
      if (db) {
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(users).set({ subscriptionStatus: "cancelled" }).where(eq(users.id, ctx.user.id));
      }
      return { success: true };
    }),
  }),

  // ===== ACCOUNT =====
  account: router({
    delete: protectedProcedure.mutation(async ({ ctx }) => {
      // Cancel stripe subscription if exists
      const subId = ctx.user.stripeSubscriptionId;
      if (subId) {
        try {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
          await stripe.subscriptions.cancel(subId);
        } catch (e) { /* subscription may already be cancelled */ }
      }
      // Delete all user data
      const db = await (await import("./db")).getDb();
      if (db) {
        const { users, calibrationProfiles, recordings, temptationEntries } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(temptationEntries).where(eq(temptationEntries.userId, ctx.user.id));
        await db.delete(recordings).where(eq(recordings.userId, ctx.user.id));
        await db.delete(calibrationProfiles).where(eq(calibrationProfiles.userId, ctx.user.id));
        await db.delete(users).where(eq(users.id, ctx.user.id));
      }
      // Clear session
      const { COOKIE_NAME } = await import("@shared/const");
      const { getSessionCookieOptions } = await import("./_core/cookies");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // ===== TEMPTATION JOURNAL =====
  temptation: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getTemptationEntries(ctx.user.id);
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getTemptationStats(ctx.user.id);
    }),
    log: protectedProcedure.input(z.object({
      sawFood: z.string(),
      saidToSelf: z.string(),
      createdFeeling: z.string(),
      outcome: z.enum(["resisted", "gave_in"]),
      outcomeDescription: z.string().optional(),
      temptationIntensity: z.number().min(1).max(10).optional(),
      patternInterruptPlayed: z.boolean().optional(),
      recordingPlayedId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      await createTemptationEntry({
        userId: ctx.user.id,
        ...input,
        patternInterruptPlayed: input.patternInterruptPlayed ?? false,
      });
      // Update impulse score — positive only (resistance gains points, giving in doesn't deduct)
      if (input.outcome === "resisted") {
        await updateImpulseScore(ctx.user.id, 3);
      }
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
