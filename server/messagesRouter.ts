// ============================================================
// MESSAGES ROUTER — the advisor sends email or text to a client from the
// website, picks a template or writes freehand, and sees the delivery log.
// Every send goes through deliver(): opt-outs honoured, outcome recorded,
// activity logged. Figures never travel by message.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getClientById, getWorkspaceByOwnerId } from "./db";
import { deliver, MESSAGE_TEMPLATES, messagingStatus, renderTemplate } from "./messaging";
import { listMessagesForClient } from "./messagingDb";
import { normalizePhone } from "./_core/sms";

const bodySchema = z.string().min(1).max(4000);

export const messagesRouter = router({
  status: protectedProcedure.query(() => messagingStatus()),

  templates: protectedProcedure.query(() => MESSAGE_TEMPLATES.map((t) => ({ id: t.id, label: t.label, subject: t.subject }))),

  /** Fill a template for a client so the advisor can edit before sending. */
  preview: protectedProcedure
    .input(z.object({ clientId: z.number().int().positive(), channel: z.enum(["email", "sms"]), template: z.string().max(60) }))
    .query(async ({ ctx, input }) => {
      const ws = await getWorkspaceByOwnerId(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "NOT_FOUND" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      const firstName = client.firstName || client.name.split(" ")[0] || "";
      const rendered = renderTemplate(input.template, input.channel, { firstName, advisorName: ctx.user.name ?? undefined });
      if (!rendered) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown template" });
      return rendered;
    }),

  send: protectedProcedure
    .input(z.object({
      clientId: z.number().int().positive(),
      channel: z.enum(["email", "sms"]),
      subject: z.string().max(300).optional(),
      body: bodySchema,
      template: z.string().max(60).optional(),
      category: z.enum(["transactional", "marketing"]).default("transactional"),
    }))
    .mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceByOwnerId(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "NOT_FOUND" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      const to = input.channel === "email" ? client.email : normalizePhone(client.phone);
      if (!to) throw new TRPCError({ code: "BAD_REQUEST", message: input.channel === "email" ? "This client has no email address on file." : "This client has no valid mobile number on file." });
      const r = await deliver({
        channel: input.channel, to, subject: input.subject, body: input.body, category: input.category, template: input.template,
        clientId: client.id, workspaceId: ws.id, userId: ctx.user.id, actorName: ctx.user.name ?? "Advisor",
      });
      return { sent: r.sent, via: r.via ?? null, reason: r.reason ?? null, suppressed: Boolean(r.suppressed), logId: r.logId };
    }),

  list: protectedProcedure
    .input(z.object({ clientId: z.number().int().positive(), limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const ws = await getWorkspaceByOwnerId(ctx.user.id);
      if (!ws) return [];
      return listMessagesForClient(input.clientId, ws.id, input.limit);
    }),
});
