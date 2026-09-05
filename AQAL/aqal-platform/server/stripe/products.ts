// AQAL Intelligence Platform — Stripe Product Configuration
// Audio assessment $500 (one-time) · Fully underwritten $1,500 (one-time; the
// 7-day free trial is enforced in-app, then this charge unlocks & keeps the
// certified report) · Membership $449/mo or $4,499/yr (15-day Stripe free trial).
//
// Founding members (first 10,000) pay nothing — that path never hits Stripe.

export const PRODUCTS = {
  audio: {
    name: "AQAL Audio Assessment",
    description:
      "Complete 32-line voice intelligence assessment with independent multi-AI consensus scoring, your rarity + developmental-stage report, and a free retake within 30 days.",
    price: 50000, // $500.00 one-time
    mode: "payment" as const,
  },
  underwritten: {
    name: "AQAL Fully Underwritten Assessment",
    description:
      "Unlock & keep your certified underwritten report: the full independent-AI panel underwrites every one of your 32 lines against your uploaded evidence (tax returns, essays, employer reviews), with evidence verification and the deepest confidence tier.",
    price: 150000, // $1,500.00 one-time (after the 7-day free trial)
    mode: "payment" as const,
  },
  membership: {
    name: "AQAL Membership",
    description:
      "Your ongoing coach and the curated network: monthly re-assessment across all 32 lines, live tracking of the weakness most threatening your goals, an updated outcome-engineering plan, research-backed prescriptions from the cited library, and complementary matching with members whose minds complete yours.",
    price: 44900, // $449.00/month
    mode: "subscription" as const,
    interval: "month" as const,
    trialDays: 15, // 15-day free trial
  },
  membershipAnnual: {
    name: "AQAL Membership — Annual",
    description:
      "Everything in AQAL Membership, billed annually: $4,499/year (saves $889 vs. monthly).",
    price: 449900, // $4,499.00/year
    mode: "subscription" as const,
    interval: "year" as const,
    trialDays: 15, // same trial window as monthly
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
