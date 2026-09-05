/**
 * Stop Fatty - Stripe Product Configuration
 * 
 * Products and prices are created dynamically on first use.
 * This file defines the product catalog.
 */

export const PRODUCTS = {
  MONTHLY_SUBSCRIPTION: {
    name: "Stop Fatty Premium",
    description: "Full access to NLP pattern interrupt technology, audio recordings, impulse score tracking, and daily engagement system.",
    priceAmount: 999, // $9.99 in cents
    currency: "usd",
    interval: "month" as const,
    trialDays: 7,
  },
} as const;
