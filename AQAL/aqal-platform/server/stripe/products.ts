// AQAL Intelligence Platform — Stripe Product Configuration
// Assessment: $299 founding (first 100), $1,500 regular
// Memberships: Silver $99/mo, Gold $499/mo, Platinum Diamond $2,999/mo

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
    name: "AQAL Silver Membership",
    description: "Essential intelligence tracking: full 32-axis radar chart, monthly re-assessment, power combination analysis, PDF export, basic evidence submission, and 5 network matches per month.",
    price: 9900, // $99.00/month in cents
    mode: "subscription" as const,
    interval: "month" as const,
  },
  gold: {
    name: "AQAL Gold Membership",
    description: "Deep analysis & growth tracking: everything in Silver plus weekly re-assessment, AI coaching sessions, growth trajectory analysis, priority evidence review, unlimited network matching, and comparative analytics.",
    price: 49900, // $499.00/month in cents
    mode: "subscription" as const,
    interval: "month" as const,
  },
  platinum: {
    name: "AQAL Platinum Diamond Membership",
    description: "The world's most exclusive intelligence network: everything in Gold plus unlimited assessments, 1-on-1 AI strategy sessions, private intelligence network, custom research reports, white-glove evidence curation, exclusive events access, and founding member benefits.",
    price: 299900, // $2,999.00/month in cents
    mode: "subscription" as const,
    interval: "month" as const,
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
