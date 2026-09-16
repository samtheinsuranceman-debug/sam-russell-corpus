import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { enforcePublicReleasePath, PUBLIC_WELLNESS_MODE } from "../compliance/releasePolicy";
import { hasActivePaidSubscription } from "../billing";
import { getConsentByUserId } from "../db";
import { CONSUMER_HEALTH_CONSENT_VERSION } from "@shared/legalVersions";

export const GENERIC_SERVER_ERROR = "Something went wrong on our side. Nothing you entered here was stored. Please try again.";

/** The gate a procedure sits behind. Read by the release audit and the chaos harness. */
export type ProcedureGate = "public" | "protected" | "admin";
export interface ProcedureMeta { gate: ProcedureGate }

const t = initTRPC.context<TrpcContext>().meta<ProcedureMeta>().create({
  transformer: superjson,
  // What leaves the server: a code, a safe message, and no stack, in every
  // environment. Internal errors never carry their original message, which
  // could name a table, a host, or something the person typed.
  errorFormatter({ shape, error }) {
    const internal = error.code === "INTERNAL_SERVER_ERROR";
    const { stack: _stack, path, ...data } = shape.data as typeof shape.data & { stack?: string };
    return {
      ...shape,
      message: internal ? GENERIC_SERVER_ERROR : shape.message,
      data: { ...data, path },
    };
  },
});

export const router = t.router;

/**
 * Non-tRPC errors (a missing database, a network failure, a bug) become one
 * INTERNAL_SERVER_ERROR with a generic message. The cause is logged here,
 * truncated, without the input, so the person's data never reaches a log.
 */
const sanitizeErrors = t.middleware(async opts => {
  // next() resolves to a result; a thrown error arrives as result.error, already
  // wrapped as INTERNAL_SERVER_ERROR with the original message. Replace it.
  const result = await opts.next();
  if (!result.ok && result.error.code === "INTERNAL_SERVER_ERROR" && result.error.message !== GENERIC_SERVER_ERROR) {
    const original = result.error.cause instanceof Error ? result.error.cause.message : result.error.message;
    console.error(`[trpc] ${opts.path} failed:`, String(original).slice(0, 160));
    return { ...result, error: new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: GENERIC_SERVER_ERROR, cause: result.error.cause ?? result.error }) };
  }
  return result;
});

const enforceReleasePolicy = t.middleware(async opts => {
  enforcePublicReleasePath(opts.path);
  return opts.next();
});

export const publicProcedure = t.procedure.meta({ gate: "public" }).use(sanitizeErrors).use(enforceReleasePolicy);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const publicSensitiveAccessExemptPrefixes = ["subscription.", "compliance.", "consent.", "activity."] as const;

const requireCurrentConsumerHealthConsent = t.middleware(async opts => {
  if (!PUBLIC_WELLNESS_MODE) return opts.next();
  const user = opts.ctx.user;
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  const exempt = publicSensitiveAccessExemptPrefixes.some(prefix => opts.path.startsWith(prefix));
  if (exempt) return opts.next();
  const consent = await getConsentByUserId(user.id);
  const currentProcessors = (process.env.HEALTH_DATA_PROCESSORS || "").trim();
  if (!consent || consent.withdrawnAt || consent.consentVersion !== CONSUMER_HEALTH_CONSENT_VERSION || !consent.agreedToTerms || !consent.agreedToHipaa || !consent.adult18Plus || (consent.processorDisclosureSnapshot || "").trim() !== currentProcessors) {
    throw new TRPCError({ code: "FORBIDDEN", message: "HEALTH_DATA_CONSENT_REQUIRED" });
  }
  return opts.next();
});

const requirePaidAccess = t.middleware(async opts => {
  const user = opts.ctx.user;
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  const paidEdition = PUBLIC_WELLNESS_MODE && process.env.ENABLE_PAID_SUBSCRIPTIONS === "true";
  const exempt = publicSensitiveAccessExemptPrefixes.some(prefix => opts.path.startsWith(prefix));
  if (paidEdition && user.role !== "admin" && !exempt) {
    const active = await hasActivePaidSubscription(user.id);
    if (!active) {
      throw new TRPCError({ code: "FORBIDDEN", message: "SUBSCRIPTION_REQUIRED" });
    }
  }
  return opts.next();
});

export const protectedProcedure = t.procedure.meta({ gate: "protected" }).use(sanitizeErrors).use(enforceReleasePolicy).use(requireUser).use(requireCurrentConsumerHealthConsent).use(requirePaidAccess);

export const adminProcedure = t.procedure.meta({ gate: "admin" }).use(sanitizeErrors).use(enforceReleasePolicy).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
