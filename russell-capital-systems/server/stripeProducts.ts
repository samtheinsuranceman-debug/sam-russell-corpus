/**
 * Stripe product/price definitions for Russell Capital Systems™ billing plans.
 * Prices are in cents (USD).
 * Annual pricing = monthly × 12 × 0.80 (20% discount for paying full year upfront). No refunds.
 */

export interface StripePlan {
  slug: "beginner" | "professional" | "enterprise";
  name: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
}

export const STRIPE_PLANS: StripePlan[] = [
  {
    slug: "beginner",
    name: "Beginner",
    monthlyPriceCents: 120000,    // $1,200/mo
    annualPriceCents: 1152000,    // $11,520/yr (20% off $14,400 = save $2,880)
  },
  {
    slug: "professional",
    name: "Professional",
    monthlyPriceCents: 450000,    // $4,500/mo
    annualPriceCents: 4320000,    // $43,200/yr (20% off $54,000 = save $10,800)
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    monthlyPriceCents: 1500000,   // $15,000/mo
    annualPriceCents: 14400000,   // $144,000/yr (20% off $180,000 = save $36,000)
  },
];

export function getAnnualSavings(plan: StripePlan): number {
  const fullAnnual = plan.monthlyPriceCents * 12;
  return Math.round((fullAnnual - plan.annualPriceCents) / 100);
}

export function getPlanBySlug(slug: string): StripePlan | undefined {
  return STRIPE_PLANS.find((p) => p.slug === slug);
}
