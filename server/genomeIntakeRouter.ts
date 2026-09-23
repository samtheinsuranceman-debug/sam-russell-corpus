// ============================================================
// genomeIntake.* — the first-login cold start's configuration and the
// Wealth Genome intake (consent → mind → money → close). Rules live in
// server/genomeIntake.ts; storage and the delete job in genomeIntakeDb.ts.
//
//   coldStartConfig  auth   eligible?, preview?, still URLs, greeting, booking link
//   status           auth   eligible?, preview?, whether a map exists
//   consent          auth*  record consent (version, text, acknowledgements)
//   decide           auth*  yes / no to a cluster (mind first)
//   answer           auth*  one answer, or a skip; typed text is crisis-screened
//   reflect          auth*  the one-line reflection for a cluster
//   close            auth*  write the map, destroy the raw answers
//   done             auth   "session done": destroy the raw answers, keep nothing
//   myMap            auth   this household's map, and nobody else's
//   withdraw         auth   delete my map and withdraw consent
//   mapFor           admin  another household's map (the owner, for review)
//   legalHold        admin  suspend / resume deletion of one household's raw answers
//   soundPref / setSoundPref  auth  the master mute, saved to the account
//
// auth* = signed in AND eligible: GENOME_INTAKE_LIVE on, or the owner in preview.
// No points, streaks or coins are awarded anywhere in this flow (spec: forbidden).
// ============================================================
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getSiteSetting, setSiteSetting } from "./voiceSettings";
import { genomeStore } from "./genomeIntakeDb";
import {
  bookingUrl,
  closeSession,
  coldStartConfig,
  decideCluster,
  endSession,
  intakeAccess,
  putAnswer,
  readMap,
  recordConsent,
  reflectCluster,
  requireAccess,
  retentionOverrides,
  setLegalHold,
  withdrawConsent,
} from "./genomeIntake";
import { CONSENT_VERSION, MAX_NOTE_CHARS, consentLines } from "@shared/genomeIntake";

/** Per-account sound preference, kept in the self-creating site_settings table (key ≤ 64 chars). */
export const soundPrefKey = (userId: number) => `pref.sound.muted.u${userId}`;

const sessionId = z.number().int().positive();
const cluster = z.enum(["mind", "money"]);
const questionId = z.string().min(1).max(64);
const answerInput = z.union([
  z.object({ questionId, kind: z.literal("choice"), choiceId: z.string().min(1).max(40), note: z.string().max(MAX_NOTE_CHARS).optional() }),
  z.object({ questionId, kind: z.literal("amount"), amount: z.number().finite().min(0).max(1e11), period: z.enum(["year", "month"]) }),
  z.object({ questionId, skip: z.literal(true) }),
]);

export const genomeIntakeRouter = router({
  coldStartConfig: protectedProcedure.query(({ ctx }) => coldStartConfig(ctx.user, getSiteSetting)),

  status: protectedProcedure.query(async ({ ctx }) => {
    const access = intakeAccess(ctx.user);
    let hasMap = false;
    if (access.eligible) {
      try { hasMap = Boolean(await readMap(genomeStore(), ctx.user, ctx.user.id)); } catch { /* no database */ }
    }
    // The consent text is sent from here so the words shown are exactly the words recorded.
    return { ...access, hasMap, consentVersion: CONSENT_VERSION, consentLines: consentLines(retentionOverrides()), bookingUrl: bookingUrl() };
  }),

  consent: protectedProcedure
    .input(z.object({
      consentVersion: z.string().min(1).max(64),
      acks: z.object({ adult18Plus: z.boolean(), notDiagnosis: z.boolean(), destroyKeep: z.boolean() }),
    }))
    .mutation(({ ctx, input }) => recordConsent(genomeStore(), ctx.user, requireAccess(ctx.user), input.consentVersion, input.acks)),

  decide: protectedProcedure
    .input(z.object({ sessionId, cluster, decision: z.enum(["accepted", "declined"]) }))
    .mutation(({ ctx, input }) => {
      requireAccess(ctx.user);
      return decideCluster(genomeStore(), ctx.user, input.sessionId, input.cluster, input.decision);
    }),

  answer: protectedProcedure
    .input(z.object({ sessionId, answer: answerInput }))
    .mutation(({ ctx, input }) => {
      requireAccess(ctx.user);
      return putAnswer(genomeStore(), ctx.user, input.sessionId, input.answer);
    }),

  reflect: protectedProcedure
    .input(z.object({ sessionId, cluster }))
    .mutation(({ ctx, input }) => {
      requireAccess(ctx.user);
      return reflectCluster(genomeStore(), ctx.user, input.sessionId, input.cluster);
    }),

  close: protectedProcedure
    .input(z.object({ sessionId }))
    .mutation(({ ctx, input }) => {
      requireAccess(ctx.user);
      return closeSession(genomeStore(), ctx.user, input.sessionId);
    }),

  // Deleting is always allowed, flag or no flag.
  done: protectedProcedure
    .input(z.object({ sessionId }))
    .mutation(({ ctx, input }) => endSession(genomeStore(), ctx.user, input.sessionId)),

  myMap: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await readMap(genomeStore(), ctx.user, ctx.user.id);
    } catch {
      return null;
    }
  }),

  withdraw: protectedProcedure.mutation(({ ctx }) => withdrawConsent(genomeStore(), ctx.user)),

  // The master mute, saved to the account so it follows the person across devices and floors.
  // (The browser keeps a copy for the first frame and for when the database is away.)
  soundPref: protectedProcedure.query(async ({ ctx }) => {
    try {
      const v = await getSiteSetting(soundPrefKey(ctx.user.id));
      return { muted: v === null ? null : v === "1" };
    } catch {
      return { muted: null };
    }
  }),
  setSoundPref: protectedProcedure
    .input(z.object({ muted: z.boolean() }))
    .mutation(async ({ ctx, input }) => ({ saved: await setSiteSetting(soundPrefKey(ctx.user.id), input.muted ? "1" : "0").catch(() => false) })),

  legalHold: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), hold: z.boolean() }))
    .mutation(({ input }) => setLegalHold(genomeStore(), input.userId, input.hold)),

  mapFor: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(({ ctx, input }) => readMap(genomeStore(), ctx.user, input.userId)),
});
