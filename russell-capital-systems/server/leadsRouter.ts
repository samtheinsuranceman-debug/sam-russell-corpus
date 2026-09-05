// ============================================================
// PUBLIC LEADS ROUTER — powers the homepage fact-finder / AI concierge
// lead capture and returning-visitor recognition.
//
// PRIVACY / HONESTY CONTRACT:
// - Recognition uses a first-party cookie (rcs_lead_id), not IP. IP is
//   stored only as a data point, behind explicit consent.
// - The illustrative, assumption-based figures are computed and stored in
//   the advisor's lead file ONLY. The visitor-facing response returns just
//   the qualitative teaser (pillars, no dollar amounts).
// - Works gracefully with no DB configured: it still returns the teaser,
//   it just can't persist (saved:false) until `pnpm db:push` has run.
// ============================================================
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";
import { sendLeadAcknowledgement, sendNewLeadAlert } from "./email";
import { computeLeadAnalysis } from "./leadStrategy";
import { getLeadById, getLeadByPublicId, listLeads, updateLeadStatus, upsertLead } from "./leadsDb";
import type { LeadFactFinder } from "@shared/leadTypes";

function assertOwner(user: { openId: string; role: string }): void {
  const isOwner = user.openId === ENV.ownerOpenId || user.role === "admin";
  if (!isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Owner access required." });
}

const COOKIE = "rcs_lead_id";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const CONSENT_VERSION = "2026-09-05";

function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function clientIp(req: { headers: Record<string, unknown>; socket?: { remoteAddress?: string } }): string | null {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0]?.trim() ?? null;
  return req.socket?.remoteAddress ?? null;
}

/** Ensure a first-party lead id, minting + setting the cookie if absent. */
function ensureLeadId(ctx: { req: { headers: Record<string, unknown> }; res: { cookie: (n: string, v: string, o: Record<string, unknown>) => void } }): string {
  const existing = readCookie(ctx.req.headers.cookie as string | undefined, COOKIE);
  if (existing) return existing;
  const id = randomUUID();
  ctx.res.cookie(COOKIE, id, {
    ...getSessionCookieOptions(ctx.req as never),
    httpOnly: true,
    maxAge: ONE_YEAR_MS,
  });
  return id;
}

const factFinderSchema = z.object({
  w2Income: z.number().nonnegative().max(1e9).optional(),
  estimatedTaxes: z.number().nonnegative().max(1e9).optional(),
  spouseIncome: z.number().nonnegative().max(1e9).optional(),
  spouseTaxes: z.number().nonnegative().max(1e9).optional(),
  studentDebt: z.number().nonnegative().max(1e9).optional(),
  studentDebtRate: z.number().nonnegative().max(100).optional(),
  homeEquity: z.number().nonnegative().max(1e9).optional(),
  mortgageBalance: z.number().nonnegative().max(1e9).optional(),
  mortgageRate: z.number().nonnegative().max(100).optional(),
  mortgageInterestOnlyMonthly: z.number().nonnegative().max(1e7).optional(),
  mortgageYearsRemaining: z.number().nonnegative().max(60).optional(),
  taxDeferredSelf: z.number().nonnegative().max(1e9).optional(),
  taxDeferredSpouse: z.number().nonnegative().max(1e9).optional(),
  liquidInvestments: z.number().nonnegative().max(1e9).optional(),
  liquidTaxability: z.enum(["taxable", "nontaxable", "mixed", "unknown"]).optional(),
  goals: z.string().max(4000).optional(),
}) satisfies z.ZodType<LeadFactFinder>;

export const leadsRouter = router({
  // Greet a returning visitor by name (cookie-based). Returns only the first
  // name — never the stored financials.
  recognize: publicProcedure.query(async ({ ctx }) => {
    const id = readCookie(ctx.req.headers.cookie as string | undefined, COOKIE);
    if (!id) return { known: false as const };
    const lead = await getLeadByPublicId(id);
    if (!lead) return { known: false as const };
    return { known: true as const, firstName: lead.firstName ?? null, hasEstimate: Boolean(lead.analysis) };
  }),

  // Capture / update a lead from the homepage estimator. Computes the
  // illustrative analysis for the advisor file and returns ONLY the teaser.
  capture: publicProcedure
    .input(z.object({
      firstName: z.string().max(120).optional(),
      lastName: z.string().max(120).optional(),
      email: z.string().email().max(320).optional(),
      phone: z.string().max(40).optional(),
      bestTimeToContact: z.string().max(200).optional(),
      question: z.string().max(4000).optional(),
      consent: z.boolean(),
      factFinder: factFinderSchema.default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.consent) {
        return { saved: false as const, reason: "consent_required", teaser: null };
      }
      const publicId = ensureLeadId(ctx as never);
      const ip = clientIp(ctx.req as never);
      const analysis = computeLeadAnalysis(input.factFinder);

      const lead = await upsertLead(publicId, {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        bestTimeToContact: input.bestTimeToContact,
        question: input.question,
        consentedAt: new Date(),
        consentVersion: CONSENT_VERSION,
        factFinder: input.factFinder,
        analysis,
      }, ip);

      // Ping the owner about the new lead — best-effort, never blocks capture
      // and never includes the illustrative figures.
      try {
        const who = [input.firstName, input.lastName].filter(Boolean).join(" ") || "Anonymous visitor";
        const contact = [input.email, input.phone].filter(Boolean).join(" · ") || "no contact given";
        await notifyOwner({
          title: "New homepage lead captured",
          content: `${who} (${contact})` + (input.bestTimeToContact ? ` — best time: ${input.bestTimeToContact}` : "") +
            (input.question ? `\nQuestion: ${input.question.slice(0, 300)}` : "") +
            `\nOpen the lead inbox to review the full fact-finder and advisor figures.`,
        });
      } catch { /* notification is best-effort */ }

      // Email the owner too — the managed notification above only exists on the
      // managed host; on a plain host this is how the owner hears about a lead.
      const alertTo = ENV.leadNotifyEmail || ENV.ownerEmail;
      if (alertTo) {
        try {
          const who = [input.firstName, input.lastName].filter(Boolean).join(" ") || "Anonymous visitor";
          const contact = [input.email, input.phone].filter(Boolean).join(" · ") || "no contact given";
          const host = typeof ctx.req.headers.host === "string" ? ctx.req.headers.host : "";
          const proto = ctx.req.headers["x-forwarded-proto"] === "https" || host.endsWith(".com") ? "https" : "http";
          await sendNewLeadAlert({ toEmail: alertTo, who, contact, bestTime: input.bestTimeToContact, question: input.question, inboxUrl: host ? `${proto}://${host}/portal/leads` : undefined });
        } catch { /* alert is best-effort */ }
      }

      // Send the prospect a warm acknowledgement — best-effort, no figures.
      if (input.email) {
        try { await sendLeadAcknowledgement({ toEmail: input.email, firstName: input.firstName }); }
        catch { /* acknowledgement is best-effort */ }
      }

      // The visitor only ever sees the qualitative teaser — never the figures.
      return {
        saved: Boolean(lead) as boolean,
        reason: lead ? ("ok" as const) : ("db_unconfigured" as const),
        teaser: analysis.teaser,
      };
    }),

  // ─── Advisor lead inbox (owner-gated) ────────────────────────────────────
  // These DO return the illustrative advisor figures — for the licensed
  // advisor's internal review only.
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }).default({ limit: 200 }))
    .query(async ({ ctx, input }) => {
      assertOwner(ctx.user);
      return listLeads(input.limit);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      assertOwner(ctx.user);
      const lead = await getLeadById(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      return lead;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "contacted", "qualified", "client"]) }))
    .mutation(async ({ ctx, input }) => {
      assertOwner(ctx.user);
      const lead = await updateLeadStatus(input.id, input.status);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      return lead;
    }),
});
