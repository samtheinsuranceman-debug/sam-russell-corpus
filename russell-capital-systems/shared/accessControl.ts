/**
 * Legacy access-control compatibility exports.
 *
 * Password, backdoor, and email-bypass authentication has been retired. These
 * exports remain only so older imported modules compile while all authorization
 * is enforced by the managed OAuth session and server-side role checks.
 */
export const TRIAL_PASSWORD = "";
export const ETERNAL_PASSWORDS: readonly string[] = [];
export const MAX_TRIAL_ACCESSES = 0;
export const MAX_TRIAL_SECONDS = 0;
export const OWNER_RECOVERY_EMAIL = "";
export const OWNER_BYPASS_EMAILS: readonly string[] = [];

export function isOwnerBypassEmail(_email: string): boolean {
  return false;
}

export const SUBSCRIPTION_TIERS = {
  beginner: { name: "Beginner", monthlyPrice: 1200, annualPrice: 960, features: ["Core calculators", "Client reports", "Email support"] },
  professional: { name: "Professional", monthlyPrice: 4500, annualPrice: 3600, features: ["Everything in Beginner", "Monte Carlo simulations", "Cross-tool integration", "Priority support"] },
  enterprise: { name: "Enterprise", monthlyPrice: 15000, annualPrice: 12000, features: ["Everything in Professional", "Custom branding", "API access", "Dedicated account manager", "White-label reports"] },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Where the subscription prices above come from. They are the firm's own list
 * prices, not a market figure, so each is declared as a choice rather than
 * cited. Prices are US dollars a month; annualPrice is the monthly rate when
 * billed annually, 20% below the monthly price, and matches the annual totals
 * in server/stripeProducts.ts.
 */
export const ACCESS_CONTROL_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "Assumption: Beginner tier price = $1,200 a month, or $960 a month billed annually, chosen by the firm because it is the entry price it set for the core calculators and client reports; no external source" },
  { label: "Assumption: Professional tier price = $4,500 a month, or $3,600 a month billed annually, chosen by the firm because it is the price it set for the tier that adds simulations and cross-tool integration; no external source" },
  { label: "Assumption: Enterprise tier price = $15,000 a month, or $12,000 a month billed annually, chosen by the firm because it is the price it set for branding, API access and a dedicated account manager; no external source" },
  { label: "Assumption: annual billing discount = 20% off the monthly price, chosen by the firm because it rewards a year's commitment at the same rate on every tier; no external source" },
];

export function isValidPassword(_password: string): { valid: boolean; type: "trial" | "eternal" | "invalid" } {
  return { valid: false, type: "invalid" };
}
