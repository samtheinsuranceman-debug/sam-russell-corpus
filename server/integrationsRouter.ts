// ============================================================
// INTEGRATIONS ROUTER — what is switched on (booleans only, never values),
// the public site config the browser may load, and a test event so the
// owner can prove Zapier / Make / n8n / Slack are receiving the ledger.
// ============================================================
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { integrationStatus, publicSiteConfig } from "./integrations";
import { allowedKinds, fanOut, webhookTargets } from "./eventBus";
import { hubspotConfigured } from "./_core/hubspot";
import { messagingStatus } from "./messaging";
import { fredConfigured } from "./_core/fred";
import { configuredProviders } from "./ultraAI";

export const integrationsRouter = router({
  /** Public ids only (analytics keys, booking link). Safe for any visitor. */
  public: publicProcedure.query(() => publicSiteConfig()),

  status: protectedProcedure.query(() => {
    const list = integrationStatus();
    const bus = { targets: webhookTargets().map((t) => t.name), kinds: Array.from(allowedKinds()), slack: Boolean(process.env.SLACK_WEBHOOK_URL) };
    return {
      integrations: list,
      configuredCount: list.filter((i) => i.configured).length,
      total: list.length,
      live: { aiProviders: configuredProviders().map((p) => p.label), messaging: messagingStatus(), fred: fredConfigured(), hubspot: hubspotConfigured(), bus },
    };
  }),

  /** Owner only: push one test event through the bus and report deliveries. */
  testEvent: protectedProcedure
    .input(z.object({ note: z.string().max(200).optional() }).default({}))
    .mutation(async ({ ctx, input }) => {
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      if (!isOwner) throw new TRPCError({ code: "FORBIDDEN" });
      const r = await fanOut([{ kind: "note", source: "system", key: "integrations.test", label: "Test event", summary: input.note?.trim() || "Test event from the Russell Capital Systems Connections page", actorName: ctx.user.name ?? null, userId: ctx.user.id }]);
      return { ...r, targets: webhookTargets().map((t) => t.name), slack: Boolean(process.env.SLACK_WEBHOOK_URL) };
    }),
});
