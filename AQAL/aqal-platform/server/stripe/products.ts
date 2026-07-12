// AQAL Intelligence Platform — Stripe Product Configuration
// Assessment: $299 founding (first 100), $1,500 regular
// Memberships: Coaching $39/mo, Growth & Network $149/mo, Private Network $499/mo

export const PRODUCTS = {
  assessment: {
    name: "AQAL Intelligence Assessment — Founding Member",
    description: "Complete 32-axis voice intelligence assessment with Five-AI consensus scoring, rarity underwriting report, and network access. Founding member rate (first 100).",
    price: 29900, // $299.00 in cents (founding member rate, regular price $1,500)
    mode: "payment" as const,
  },
  assessmentRegular: {
    name: "AQAL Intelligence Assessment",
    description: "Complete 32-axis voice intelligence assessment with Five-AI consensus scoring, rarity underwriting report, and network access.",
    price: 150000, // $1,500.00 in cents (regular price after first 100 founding members)
    mode: "payment" as const,
  },
  silver: {
    name: "AQAL Coaching Membership",
    description: "Your ongoing outcome coach: monthly re-assessment, live tracking of the weakness cluster most threatening your goals, updated outcome-engineering plan, research-backed prescriptions, PDF export, and 5 complementary network matches per month.",
    price: 3900, // $39.00/month in cents — the accessible coaching unlock
    mode: "subscription" as const,
    interval: "month" as const,
  },
  gold: {
    name: "AQAL Growth & Network",
    description: "Everything in Coaching, plus weekly re-assessment, deeper outcome-engineering sessions, growth-trajectory analytics, priority evidence verification, and unlimited network matching.",
    price: 14900, // $149.00/month in cents
    mode: "subscription" as const,
    interval: "month" as const,
  },
  platinum: {
    name: "AQAL Private Network",
    description: "The top tier: everything in Growth, plus a private intelligence network, 1-on-1 AI strategy sessions, custom research reports, white-glove evidence curation, and founding-member benefits.",
    price: 49900, // $499.00/month in cents
    mode: "subscription" as const,
    interval: "month" as const,
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
