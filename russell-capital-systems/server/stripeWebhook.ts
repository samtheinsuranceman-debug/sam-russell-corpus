import type { Request, Response } from "express";
import Stripe from "stripe";
import { getStripe } from "./stripeClient";
import { getDb, updateAdvisorSubscription, getAdvisorAccountByEmail } from "./db";
import { workspaceSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — skipping verification");
    res.json({ received: true });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Stripe Webhook] Signature verification failed:", msg);
    res.status(400).json({ error: `Webhook signature verification failed: ${msg}` });
    return;
  }

  // ⚠️ Test events must return verified: true
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    res.json({ verified: true });
    return;
  }

  console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspace_id
          ? parseInt(session.metadata.workspace_id, 10)
          : null;
        const planSlug = session.metadata?.plan_slug ?? "beginner";
        const interval = (session.metadata?.interval ?? "MONTHLY") as "MONTHLY" | "ANNUAL";
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;
        const customerId = typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;

        if (workspaceId) {
          const db = await getDb();
          if (db) {
            const seats = planSlug === "enterprise" ? 25 : planSlug === "professional" ? 10 : 3;
            await db
              .insert(workspaceSubscriptions)
              .values({
                workspaceId,
                planSlug,
                billingInterval: interval,
                status: "ACTIVE",
                seats,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
              })
              .onDuplicateKeyUpdate({
                set: {
                  planSlug,
                  billingInterval: interval,
                  status: "ACTIVE",
                  seats,
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                },
              });
            console.log(`[Stripe Webhook] Subscription activated for workspace ${workspaceId} → ${planSlug}`);
          }
        }

        // ─── Advisor trial subscription activation ───
        const advisorEmail = session.metadata?.advisor_email;
        if (advisorEmail && subscriptionId) {
          await updateAdvisorSubscription(advisorEmail, {
            stripeCustomerId: customerId ?? undefined,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
            accessTier: "subscriber",
          });
          console.log(`[Stripe Webhook] Advisor subscription activated for ${advisorEmail}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const db = await getDb();
        if (db) {
          await db
            .update(workspaceSubscriptions)
            .set({ status: "CANCELED" })
            .where(eq(workspaceSubscriptions.stripeSubscriptionId, subscriptionId));
          console.log(`[Stripe Webhook] Subscription cancelled: ${subscriptionId}`);
        }

        // ─── Advisor subscription cancellation ───
        const canceledCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (canceledCustomerId) {
          const { advisorAccounts } = await import("../drizzle/schema");
          const dbConn = await getDb();
          if (dbConn) {
            const rows = await dbConn.select({ email: advisorAccounts.email }).from(advisorAccounts).where(eq(advisorAccounts.stripeCustomerId, canceledCustomerId)).limit(1);
            if (rows.length > 0) {
              await updateAdvisorSubscription(rows[0].email, { subscriptionStatus: "canceled", accessTier: "trial" });
              console.log(`[Stripe Webhook] Advisor subscription canceled for ${rows[0].email}`);
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : (invoice.subscription as Stripe.Subscription | null)?.id ?? null;
        if (subscriptionId) {
          const db = await getDb();
          if (db) {
            await db
              .update(workspaceSubscriptions)
              .set({ status: "PAST_DUE" })
              .where(eq(workspaceSubscriptions.stripeSubscriptionId, subscriptionId));
            console.log(`[Stripe Webhook] Payment failed for subscription: ${subscriptionId}`);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
    res.status(500).json({ error: "Internal webhook processing error" });
    return;
  }

  res.json({ received: true });
}
