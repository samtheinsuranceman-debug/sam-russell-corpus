import type { Express, Request, Response } from "express";
import express from "express";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { billingConsents, billingEvents, subscriptions } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { SUBSCRIPTION_TERMS_VERSION } from "@shared/legalVersions";

const STRIPE_API = "https://api.stripe.com/v1";
const TERMS_VERSION = SUBSCRIPTION_TERMS_VERSION;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function configuredPriceCents() {
  const cents = Number(process.env.MEMBERSHIP_PRICE_CENTS || "9900");
  if (!Number.isInteger(cents) || cents <= 0) throw new Error("MEMBERSHIP_PRICE_CENTS must be a positive integer");
  return cents;
}

async function stripeRequest(path: string, body?: URLSearchParams, method: "GET" | "POST" = "POST") {
  const secret = requireEnv("STRIPE_SECRET_KEY");
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body?.toString(),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `Stripe request failed (${response.status})`);
  return data;
}

async function verifyConfiguredStripePrice() {
  const priceId = requireEnv("STRIPE_PRICE_ID_INSIGHT");
  const price = await stripeRequest(`/prices/${encodeURIComponent(priceId)}`, undefined, "GET");
  const expected = configuredPriceCents();
  if (price.currency !== "usd" || price.unit_amount !== expected || price.recurring?.interval !== "month") {
    throw new Error("Configured Stripe price does not match the advertised USD monthly membership price");
  }
  if (price.active !== true) throw new Error("Configured Stripe price is not active");
  return priceId;
}

function activeStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function getSubscriptionForUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return row ?? null;
}

export async function hasActivePaidSubscription(userId: number) {
  if (process.env.ENABLE_PAID_SUBSCRIPTIONS !== "true") return true;
  const row = await getSubscriptionForUser(userId);
  if (!row || !activeStatus(row.status)) return false;
  if (row.currentPeriodEnd && row.currentPeriodEnd.getTime() < Date.now()) return false;
  return true;
}

async function upsertSubscription(userId: number, patch: {
  customerId?: string | null;
  subscriptionId?: string | null;
  status?: string | null;
  planId?: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getSubscriptionForUser(userId);
  const values = {
    userId,
    provider: "stripe",
    customerId: patch.customerId ?? null,
    subscriptionId: patch.subscriptionId ?? null,
    status: patch.status ?? "inactive",
    planId: patch.planId ?? "insight",
    currentPeriodEnd: patch.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: patch.cancelAtPeriodEnd ?? false,
  };
  if (!existing) {
    await db.insert(subscriptions).values(values);
  } else {
    await db.update(subscriptions).set({ ...values, updatedAt: new Date() }).where(eq(subscriptions.userId, userId));
  }
}

async function findUserIdForSubscription(customerId?: string | null, subscriptionId?: string | null) {
  const db = await getDb();
  if (!db) return null;
  if (subscriptionId) {
    const [row] = await db.select().from(subscriptions).where(eq(subscriptions.subscriptionId, subscriptionId)).limit(1);
    if (row) return row.userId;
  }
  if (customerId) {
    const [row] = await db.select().from(subscriptions).where(eq(subscriptions.customerId, customerId)).limit(1);
    if (row) return row.userId;
  }
  return null;
}

function verifyStripeSignature(raw: Buffer, header: string, secret: string) {
  const parts = header.split(",").map(x => x.trim());
  const timestamp = parts.find(x => x.startsWith("t="))?.slice(2);
  const signatures = parts.filter(x => x.startsWith("v1=")).map(x => x.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${raw.toString("utf8")}`).digest("hex");
  return signatures.some(sig => {
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(sig, "hex");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch { return false; }
  });
}

async function eventAlreadyProcessed(eventId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select().from(billingEvents).where(eq(billingEvents.providerEventId, eventId)).limit(1);
  return !!row;
}

async function markEventProcessed(eventId: string, eventType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(billingEvents).values({ providerEventId: eventId, eventType });
}

async function processStripeEvent(event: any) {
  const object = event?.data?.object ?? {};
  if (event.type === "checkout.session.completed") {
    const userId = Number(object.client_reference_id || object.metadata?.userId);
    if (Number.isInteger(userId) && userId > 0) {
      let status = "active";
      let currentPeriodEnd: Date | null = null;
      let cancelAtPeriodEnd = false;
      if (object.subscription) {
        const sub = await stripeRequest(`/subscriptions/${encodeURIComponent(object.subscription)}`, undefined, "GET");
        status = String(sub.status || "inactive");
        currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
        cancelAtPeriodEnd = !!sub.cancel_at_period_end;
      }
      await upsertSubscription(userId, {
        customerId: object.customer || null,
        subscriptionId: object.subscription || null,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      });
    }
    return;
  }

  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const explicitUserId = Number(object.metadata?.userId);
    const userId = Number.isInteger(explicitUserId) && explicitUserId > 0
      ? explicitUserId
      : await findUserIdForSubscription(object.customer, object.id);
    if (!userId) return;
    await upsertSubscription(userId, {
      customerId: object.customer || null,
      subscriptionId: object.id || null,
      status: event.type === "customer.subscription.deleted" ? "canceled" : String(object.status || "inactive"),
      currentPeriodEnd: object.current_period_end ? new Date(object.current_period_end * 1000) : null,
      cancelAtPeriodEnd: !!object.cancel_at_period_end,
    });
  }
}

export function registerBillingWebhook(app: Express) {
  app.post("/api/billing/webhook", express.raw({ type: "application/json", limit: "512kb" }), async (req: Request, res: Response) => {
    try {
      if (process.env.ENABLE_PAID_SUBSCRIPTIONS !== "true") return res.status(404).end();
      const secret = requireEnv("STRIPE_WEBHOOK_SECRET");
      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string" || !Buffer.isBuffer(req.body) || !verifyStripeSignature(req.body, signature, secret)) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
      const event = JSON.parse(req.body.toString("utf8"));
      if (!event?.id || !event?.type) return res.status(400).json({ error: "Malformed event" });
      if (await eventAlreadyProcessed(event.id)) return res.status(200).json({ received: true, duplicate: true });
      await processStripeEvent(event);
      await markEventProcessed(event.id, event.type);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[Billing] webhook error", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}

export function registerBillingRoutes(app: Express) {
  app.post("/api/billing/create-checkout", async (req: Request, res: Response) => {
    if (process.env.ENABLE_PAID_SUBSCRIPTIONS !== "true") return res.status(503).json({ error: "Paid subscriptions are disabled" });
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: "Sign in is required" });
    }
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const existing = await getSubscriptionForUser(user.id);
      if (existing && !["inactive", "canceled", "incomplete_expired"].includes(existing.status)) {
        return res.status(409).json({ error: "An existing membership is already attached to this account. Manage it from Account & Privacy instead of creating a duplicate subscription." });
      }
      const { adult18Plus, recurringBillingAccepted, termsVersion } = req.body || {};
      if (adult18Plus !== true || recurringBillingAccepted !== true || termsVersion !== TERMS_VERSION) {
        return res.status(400).json({ error: "Current adult and recurring-billing consent is required" });
      }
      const priceId = await verifyConfiguredStripePrice();
      const amountCents = configuredPriceCents();
      await db.insert(billingConsents).values({
        userId: user.id,
        planId: "insight",
        amountCents,
        currency: "usd",
        cadence: "month",
        termsVersion: TERMS_VERSION,
        adult18Plus: true,
        recurringBillingAccepted: true,
        userAgent: req.headers["user-agent"] || null,
      });

      const base = requireEnv("PUBLIC_BASE_URL").replace(/\/$/, "");
      const body = new URLSearchParams({
        mode: "subscription",
        success_url: `${base}/settings?billing=success`,
        cancel_url: `${base}/subscribe?billing=cancelled`,
        client_reference_id: String(user.id),
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "subscription_data[metadata][userId]": String(user.id),
        "metadata[userId]": String(user.id),
        allow_promotion_codes: "true",
      });
      if (existing?.customerId) body.set("customer", existing.customerId);
      else if (user.email) body.set("customer_email", user.email);
      const session = await stripeRequest("/checkout/sessions", body);
      if (!session.url) throw new Error("Stripe did not return a checkout URL");
      res.json({ url: session.url });
    } catch (error) {
      console.error("[Billing] checkout error", error);
      res.status(500).json({ error: "Checkout could not be started" });
    }
  });

  app.post("/api/billing/create-portal", async (req: Request, res: Response) => {
    if (process.env.ENABLE_PAID_SUBSCRIPTIONS !== "true") return res.status(503).json({ error: "Paid subscriptions are disabled" });
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: "Sign in is required" });
    }
    try {
      const row = await getSubscriptionForUser(user.id);
      if (!row?.customerId) return res.status(404).json({ error: "No billing customer is associated with this account" });
      const base = requireEnv("PUBLIC_BASE_URL").replace(/\/$/, "");
      const body = new URLSearchParams({ customer: row.customerId, return_url: `${base}/settings` });
      const portal = await stripeRequest("/billing_portal/sessions", body);
      if (!portal.url) throw new Error("Stripe did not return a portal URL");
      res.json({ url: portal.url });
    } catch (error) {
      console.error("[Billing] portal error", error);
      res.status(500).json({ error: "Billing portal could not be started" });
    }
  });
}

export const BILLING_TERMS_VERSION = TERMS_VERSION;
