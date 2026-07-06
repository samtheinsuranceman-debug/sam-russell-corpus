import Stripe from "stripe";
import { Router, raw } from "express";
import { PRODUCTS, type ProductKey } from "./products";

// Construct Stripe only when a key is configured, so the app boots in
// local/dev/CI without payment credentials (Stripe throws on an empty key).
// Payment routes return a clear error when Stripe is not configured.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const stripeRouter = Router();

// Webhook endpoint — MUST use raw body for signature verification
stripeRouter.post("/webhook", raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!stripe) {
    return res.status(503).send("Stripe is not configured on this server.");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id || session.client_reference_id;
      const productKey = session.metadata?.product_key as ProductKey;
      
      console.log(`[Stripe] Checkout completed for user ${userId}, product: ${productKey}`);

      // Revenue share tracking: if a promo code was used, record the referral payment
      const promoCodeUsed = session.metadata?.promo_code;
      if (userId && session.amount_total && promoCodeUsed) {
        try {
          const { trackReferralPaymentByCode } = await import("../db");
          await trackReferralPaymentByCode({
            promoCode: promoCodeUsed,
            userId: userId,
            amountCents: session.amount_total,
            stripePaymentIntentId: session.payment_intent as string || null,
          });
        } catch (e) {
          console.error("[Stripe] Failed to track referral payment:", e);
        }
      }
      
      // Store stripe_customer_id on user if available
      if (userId && session.customer) {
        // Update user's stripe_customer_id in database
        const { getDb } = await import("../db");
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) await db.update(users).set({ 
          stripeCustomerId: session.customer as string 
        }).where(eq(users.openId, userId));
      }
      
      // Grant Silver membership access on assessment purchase (one-time payment)
      if (session.mode === "payment" && userId && productKey === "assessment") {
        const { getDb } = await import("../db");
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) await db.update(users).set({
          membershipTier: "silver", // Silver membership granted on assessment purchase
        }).where(eq(users.openId, userId));
        console.log(`[Stripe] User ${userId} granted Silver membership access (assessment purchase)`);
      }

      // Handle subscription creation
      if (session.mode === "subscription" && userId && session.subscription) {
        const { getDb } = await import("../db");
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        
        const tier = productKey === "platinum" ? "platinum" 
          : productKey === "gold" ? "gold" 
          : "silver";
        
        if (db) await db.update(users).set({
          stripeSubscriptionId: session.subscription as string,
          membershipTier: tier,
        }).where(eq(users.openId, userId));

        // Funnel instrumentation: record the conversion (numeric user id).
        const { recordEvent, getUserByOpenId } = await import("../db");
        const u = await getUserByOpenId(userId);
        if (u) await recordEvent({ type: "subscription_created", userId: u.id, meta: { tier } });

        console.log(`[Stripe] User ${userId} subscribed to ${tier}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { getDb, recordEvent } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();

      // Resolve the user before downgrading so we can record the churn event.
      let canceledUserId: number | null = null;
      if (db) {
        const found = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscription.id)).limit(1);
        canceledUserId = found[0]?.id ?? null;
        await db.update(users).set({
          stripeSubscriptionId: null,
          membershipTier: "free",
        }).where(eq(users.stripeSubscriptionId, subscription.id));
      }
      if (canceledUserId) await recordEvent({ type: "subscription_canceled", userId: canceledUserId });

      console.log(`[Stripe] Subscription ${subscription.id} cancelled`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe] Payment failed for invoice ${invoice.id}`);
      break;
    }
  }

  res.json({ received: true });
});

// Create checkout session helper (called from tRPC)
export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
  userName: string;
  productKey: ProductKey;
  promoCode?: string;
  origin: string;
}) {
  if (!stripe) throw new Error("Payments are not configured on this server.");
  const product = PRODUCTS[params.productKey];
  if (!product) throw new Error(`Invalid product: ${params.productKey}`);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: params.userId,
    customer_email: params.userEmail,
    metadata: {
      user_id: params.userId,
      customer_email: params.userEmail,
      customer_name: params.userName,
      product_key: params.productKey,
      promo_code: params.promoCode || "",
    },
    allow_promotion_codes: true,
    success_url: `${params.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/payment-cancel`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price,
          ...(product.mode === "subscription" ? { recurring: { interval: product.interval } } : {}),
        },
        quantity: 1,
      },
    ],
    mode: product.mode,
  };

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { url: session.url };
}
