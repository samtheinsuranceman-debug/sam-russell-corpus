import Stripe from "stripe";
import { PRODUCTS } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-05-27.dahlia",
});

export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName: string;
  origin: string;
}) {
  const { userId, userEmail, userName, origin } = params;

  // Create or find a price for the subscription
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: userEmail,
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
    },
    line_items: [
      {
        price_data: {
          currency: PRODUCTS.MONTHLY_SUBSCRIPTION.currency,
          product_data: {
            name: PRODUCTS.MONTHLY_SUBSCRIPTION.name,
            description: PRODUCTS.MONTHLY_SUBSCRIPTION.description,
          },
          unit_amount: PRODUCTS.MONTHLY_SUBSCRIPTION.priceAmount,
          recurring: {
            interval: PRODUCTS.MONTHLY_SUBSCRIPTION.interval,
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: PRODUCTS.MONTHLY_SUBSCRIPTION.trialDays,
    },
    success_url: `${origin}/dashboard?payment=success`,
    cancel_url: `${origin}/subscription?payment=cancelled`,
  });

  return { url: session.url };
}
