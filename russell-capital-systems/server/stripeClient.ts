import Stripe from "stripe";
import { getPlanBySlug, StripePlan } from "./stripeProducts";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
  }
  return _stripe;
}

/**
 * Ensure a Stripe Customer exists for the given user, creating one if needed.
 * Returns the Stripe customer ID.
 */
export async function ensureStripeCustomer(opts: {
  existingCustomerId?: string | null;
  email: string;
  name?: string | null;
  userId: number;
}): Promise<string> {
  const stripe = getStripe();
  if (opts.existingCustomerId) return opts.existingCustomerId;

  const customer = await stripe.customers.create({
    email: opts.email,
    name: opts.name ?? undefined,
    metadata: { userId: String(opts.userId) },
  });
  return customer.id;
}

/**
 * Get or create a Stripe Price for a plan/interval combination.
 * In test mode we create prices on-the-fly if no static price ID is configured.
 */
async function ensureStripePrice(
  plan: StripePlan,
  interval: "MONTHLY" | "ANNUAL"
): Promise<string> {
  const stripe = getStripe();
  const staticId =
    interval === "MONTHLY" ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;
  if (staticId) return staticId;

  // Dynamic price creation (test mode / dev)
  const amountCents =
    interval === "MONTHLY" ? plan.monthlyPriceCents : plan.annualPriceCents;
  const stripeInterval = interval === "MONTHLY" ? "month" : "year";

  // Look for an existing product with our slug
  const products = await stripe.products.search({
    query: `metadata['planSlug']:'${plan.slug}'`,
  });
  let productId: string;
  if (products.data.length > 0) {
    productId = products.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: `Russell Capital Systems™ — ${plan.name}`,
      metadata: { planSlug: plan.slug },
    });
    productId = product.id;
  }

  // Look for an existing price
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    recurring: { interval: stripeInterval },
  });
  if (prices.data.length > 0) return prices.data[0].id;

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amountCents,
    currency: "usd",
    recurring: { interval: stripeInterval },
    metadata: { planSlug: plan.slug, interval },
  });
  return price.id;
}

/**
 * Create a Stripe Checkout Session for a subscription upgrade.
 */
export async function createCheckoutSession(opts: {
  planSlug: string;
  interval: "MONTHLY" | "ANNUAL";
  customerId: string;
  userEmail: string;
  userId: number;
  workspaceId: number;
  origin: string;
  agreementAcceptedAt?: string;
}): Promise<string> {
  const stripe = getStripe();
  const plan = getPlanBySlug(opts.planSlug);
  if (!plan) throw new Error(`Unknown plan: ${opts.planSlug}`);

  const priceId = await ensureStripePrice(plan, opts.interval);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: opts.customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_types: ["card", "link"],
    allow_promotion_codes: true,
    client_reference_id: String(opts.userId),
    metadata: {
      user_id: String(opts.userId),
      workspace_id: String(opts.workspaceId),
      plan_slug: opts.planSlug,
      interval: opts.interval,
      customer_email: opts.userEmail,
      agreement_accepted_at: opts.agreementAcceptedAt ?? new Date().toISOString(),
    },
    success_url: `${opts.origin}/portal/billing?success=1&plan=${opts.planSlug}`,
    cancel_url: `${opts.origin}/portal/billing?cancelled=1`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/**
 * Create a Stripe Billing Portal Session so a customer can manage their subscription.
 */
export async function createPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
  return session.url;
}
