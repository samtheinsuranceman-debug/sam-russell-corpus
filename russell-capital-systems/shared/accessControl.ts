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

export function isValidPassword(_password: string): { valid: boolean; type: "trial" | "eternal" | "invalid" } {
  return { valid: false, type: "invalid" };
}
