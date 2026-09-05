import { Router, raw } from "express";
import Stripe from "stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-05-27.dahlia",
});

export function registerStripeWebhook(app: any) {
  const router = Router();

  // CRITICAL: Use raw body for webhook signature verification
  router.post(
    "/api/stripe/webhook",
    raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;
            if (userId) {
              const db = await getDb();
              if (db) {
                await db.update(users).set({
                  stripeCustomerId: session.customer as string,
                  stripeSubscriptionId: session.subscription as string,
                  subscriptionStatus: "active",
                  subscriptionStartedAt: new Date(),
                }).where(eq(users.id, parseInt(userId)));
                console.log(`[Stripe Webhook] User ${userId} subscription activated`);
              }
            }
            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (db) {
              const status = subscription.status;
              let appStatus: "active" | "expired" | "cancelled" = "active";
              if (status === "canceled" || status === "unpaid") appStatus = "cancelled";
              if (status === "past_due") appStatus = "expired";

              await db.update(users).set({
                subscriptionStatus: appStatus,
              }).where(eq(users.stripeCustomerId, subscription.customer as string));
              console.log(`[Stripe Webhook] Subscription updated: ${status}`);
            }
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (db) {
              await db.update(users).set({
                subscriptionStatus: "cancelled",
              }).where(eq(users.stripeCustomerId, subscription.customer as string));
              console.log(`[Stripe Webhook] Subscription cancelled`);
            }
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const db = await getDb();
            if (db && invoice.customer) {
              await db.update(users).set({
                subscriptionStatus: "expired",
              }).where(eq(users.stripeCustomerId, invoice.customer as string));
              console.log(`[Stripe Webhook] Payment failed for invoice: ${invoice.id}`);
            }
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
      }

      res.json({ received: true });
    }
  );

  app.use(router);
}
