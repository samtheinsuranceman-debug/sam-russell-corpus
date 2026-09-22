import { SUBSCRIPTION_TERMS_VERSION } from "@shared/legalVersions";
export { SUBSCRIPTION_TERMS_VERSION };
/** Browser-facing release flags. Server enforcement is authoritative. */
export const PUBLIC_WELLNESS_MODE = import.meta.env.VITE_PUBLIC_WELLNESS_MODE !== "false";
export const CLINICAL_TOOLS_ENABLED = !PUBLIC_WELLNESS_MODE && import.meta.env.VITE_ENABLE_CLINICAL_TOOLS === "true";
export const PAID_SUBSCRIPTIONS_ENABLED = import.meta.env.VITE_ENABLE_PAID_SUBSCRIPTIONS === "true";
/** "preview": reachable for review before launch; the server lists what is outstanding. */
export const RELEASE_POSTURE: "production" | "preview" = import.meta.env.VITE_RELEASE_POSTURE === "preview" ? "preview" : "production";
export const CLINICAL_COVERED_ENTITY_NAME = import.meta.env.VITE_CLINICAL_COVERED_ENTITY_NAME?.trim() || "";
export const CLINICAL_NPP_URL = import.meta.env.VITE_CLINICAL_NPP_URL?.trim() || "";

export type PaidPlan = "insight";

export const PRIVACY_CONTACT_EMAIL = import.meta.env.VITE_PRIVACY_CONTACT_EMAIL?.trim() || "privacy@example.com";
export const LEGAL_BUSINESS_NAME = import.meta.env.VITE_LEGAL_BUSINESS_NAME?.trim() || "Doctor Buddy operator";
export const LEGAL_BUSINESS_ADDRESS = import.meta.env.VITE_LEGAL_BUSINESS_ADDRESS?.trim() || "Business address not configured";
export const HEALTH_DATA_PROCESSORS = (import.meta.env.VITE_HEALTH_DATA_PROCESSORS?.trim() || "")
  .split(";")
  .map((x: string) => x.trim())
  .filter(Boolean);
export const MEMBERSHIP_PRICE_CENTS = Number(import.meta.env.VITE_MEMBERSHIP_PRICE_CENTS || "9900");
export const MEMBERSHIP_PRICE = `$${(MEMBERSHIP_PRICE_CENTS / 100).toFixed(2).replace(/\.00$/, "")}`;

export const CLINICAL_ROUTES = new Set([
  "/dashboard",
  "/life-maps",
  "/life-events",
  "/prs",
  "/digital-twin",
  "/admin",
  "/vital-signs",
  "/doctor",
  "/psychiatrist",
  "/fda-compliance",
  "/physician-wellness",
]);
