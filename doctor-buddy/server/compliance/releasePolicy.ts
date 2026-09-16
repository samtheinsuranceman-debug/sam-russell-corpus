import { TRPCError } from "@trpc/server";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

/**
 * Doctor Buddy ships in a consumer wellness posture by default.
 * Regulated/clinician tooling must be deliberately enabled by the operator.
 */
export const PUBLIC_WELLNESS_MODE = process.env.PUBLIC_WELLNESS_MODE !== "false";
export const CLINICAL_TOOLS_ENABLED = process.env.ENABLE_CLINICAL_TOOLS === "true";

/**
 * RELEASE_POSTURE=preview lets the public wellness edition run on the
 * internet for review before the operator has completed the attestations the
 * production validator requires. It is deliberately narrow: paid subscriptions
 * and clinical tools stay off, the browser shows a preview banner, the
 * blockers are listed at /healthz, and every other check still runs. It is
 * never a way to launch: the validator still throws in preview when the
 * edition itself is misconfigured or a placeholder disclosure is present.
 */
export const RELEASE_POSTURE: "production" | "preview" = process.env.RELEASE_POSTURE === "preview" ? "preview" : "production";

/** What the browser bundle was built to say (written by scripts/write-build-info.mjs). */
export interface BuildInfo {
  builtAt?: string;
  publicWellnessMode?: boolean;
  clinicalToolsEnabled?: boolean;
  paidSubscriptionsEnabled?: boolean;
  releasePosture?: "production" | "preview";
  privacyContactEmail?: string;
  legalBusinessName?: string;
  healthDataProcessors?: string;
}

export function readBuildInfo(): BuildInfo | null {
  try {
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    // An explicit client directory is the only place looked at; otherwise the
    // bundle beside the server (dist/index.js serves dist/public).
    const file = process.env.CLIENT_DIST_DIR
      ? path.resolve(process.env.CLIENT_DIST_DIR, "build-info.json")
      : path.resolve(process.cwd(), "dist/public/build-info.json");
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")) as BuildInfo;
  } catch {
    /* unreadable: treated as absent */
  }
  return null;
}

/** Errors that stay fatal even in preview: the wrong edition, or a lie in a disclosure. */
const PREVIEW_FATAL = /edition|placeholder|must contain the real|must be a real monitored|must match exactly|Clinical tools cannot|must describe the same|must match the server\/browser|cannot be enabled|preview/i;

/** The blockers found at the last validation, for /healthz in preview. */
let lastBlockers: string[] = [];
export function releaseBlockers(): string[] {
  return [...lastBlockers];
}

/** tRPC namespaces that can create or expose diagnostic / clinical decision support output. */
export const CLINICAL_TRPC_PREFIXES = [
  "assessment.",
  "report.",
  "lifeMaps.",
  "lifeEvents.",
  "digitalTwin.",
  "clinicianReview.",
  "wellness.",
  "mcs.",
  "leads.",
  "openRouter.",
  "personality.",
] as const;

/** Individual procedures inside mixed namespaces that remain clinical-only. */
export const CLINICAL_TRPC_PROCEDURES = new Set([
  "drBuddy.getWhispererSuggestions",
  "drBuddy.getDoctorPatients",
  "drBuddy.updateClinicalNotes",
  "drBuddy.getPatientDetail",
  "medications.checkInteractions",
  "drBuddy.getSession",
  "drBuddy.saveSession",
  "research.forDiagnosis",
  // The one finance procedure that reads clinical records. The calculators and
  // the fact finder are pure and never call the server.
  "finance.readiness",
]);

export function isClinicalProcedure(path: string): boolean {
  return CLINICAL_TRPC_PROCEDURES.has(path) || CLINICAL_TRPC_PREFIXES.some(prefix => path.startsWith(prefix));
}

export function enforcePublicReleasePath(path: string) {
  if (!CLINICAL_TOOLS_ENABLED && isClinicalProcedure(path)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This clinical feature is disabled. It requires an explicitly enabled, separately configured clinician deployment.",
    });
  }
}

function must(name: string, value: string | undefined, errors: string[]) {
  if (!value?.trim()) errors.push(`${name} is required`);
}

/**
 * Fail closed for paid or clinician production deployments.
 * This cannot make an organization legally compliant by itself; it prevents
 * the easiest accidental misconfiguration from reaching the public internet.
 */
export function validateProductionReleaseConfiguration() {
  if (process.env.NODE_ENV !== "production") return;

  const errors: string[] = [];
  must("PUBLIC_BASE_URL", process.env.PUBLIC_BASE_URL, errors);
  must("PUBLIC_WELLNESS_MODE", process.env.PUBLIC_WELLNESS_MODE, errors);
  must("VITE_PUBLIC_WELLNESS_MODE", process.env.VITE_PUBLIC_WELLNESS_MODE, errors);
  must("ENABLE_CLINICAL_TOOLS", process.env.ENABLE_CLINICAL_TOOLS, errors);
  must("VITE_ENABLE_CLINICAL_TOOLS", process.env.VITE_ENABLE_CLINICAL_TOOLS, errors);
  must("HIPAA_DEPLOYMENT_MODE", process.env.HIPAA_DEPLOYMENT_MODE, errors);
  must("PRIVACY_CONTACT_EMAIL", process.env.PRIVACY_CONTACT_EMAIL, errors);
  must("VITE_PRIVACY_CONTACT_EMAIL", process.env.VITE_PRIVACY_CONTACT_EMAIL, errors);
  must("LEGAL_BUSINESS_NAME", process.env.LEGAL_BUSINESS_NAME, errors);
  must("VITE_LEGAL_BUSINESS_NAME", process.env.VITE_LEGAL_BUSINESS_NAME, errors);
  must("LEGAL_BUSINESS_ADDRESS", process.env.LEGAL_BUSINESS_ADDRESS, errors);
  must("VITE_LEGAL_BUSINESS_ADDRESS", process.env.VITE_LEGAL_BUSINESS_ADDRESS, errors);
  must("HEALTH_DATA_PROCESSORS", process.env.HEALTH_DATA_PROCESSORS, errors);
  must("VITE_HEALTH_DATA_PROCESSORS", process.env.VITE_HEALTH_DATA_PROCESSORS, errors);
  must("DATABASE_URL", process.env.DATABASE_URL, errors);
  must("JWT_SECRET", process.env.JWT_SECRET, errors);
  must("BUILT_IN_FORGE_API_URL", process.env.BUILT_IN_FORGE_API_URL, errors);
  must("BUILT_IN_FORGE_API_KEY", process.env.BUILT_IN_FORGE_API_KEY, errors);
  must("AI_PROCESSOR_NAME", process.env.AI_PROCESSOR_NAME, errors);
  must("AUTH_PROCESSOR_NAME", process.env.AUTH_PROCESSOR_NAME, errors);
  must("SECURITY_CONTACT_EMAIL", process.env.SECURITY_CONTACT_EMAIL || process.env.PRIVACY_CONTACT_EMAIL, errors);

  if (process.env.PUBLIC_BASE_URL && !process.env.PUBLIC_BASE_URL.startsWith("https://")) {
    errors.push("PUBLIC_BASE_URL must use https:// in production");
  }
  if (process.env.BUILT_IN_FORGE_API_URL && !process.env.BUILT_IN_FORGE_API_URL.startsWith("https://")) {
    errors.push("BUILT_IN_FORGE_API_URL must use https:// in production");
  }
  for (const name of ["PRIVACY_CONTACT_EMAIL", "VITE_PRIVACY_CONTACT_EMAIL"] as const) {
    const value = process.env[name] || "";
    if (value.endsWith("@example.com") || value.includes("replace") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(`${name} must be a real monitored email address`);
    }
  }
  for (const name of ["LEGAL_BUSINESS_NAME", "VITE_LEGAL_BUSINESS_NAME", "LEGAL_BUSINESS_ADDRESS", "VITE_LEGAL_BUSINESS_ADDRESS", "HEALTH_DATA_PROCESSORS", "VITE_HEALTH_DATA_PROCESSORS"] as const) {
    const value = (process.env[name] || "").toLowerCase();
    if (value.includes("replace") || value.includes("not configured") || value.includes("example")) errors.push(`${name} must contain the real production disclosure`);
  }

  const matchedDisclosures: Array<[string, string, string | undefined, string | undefined]> = [
    ["privacy contact", "PRIVACY_CONTACT_EMAIL/VITE_PRIVACY_CONTACT_EMAIL", process.env.PRIVACY_CONTACT_EMAIL, process.env.VITE_PRIVACY_CONTACT_EMAIL],
    ["legal business name", "LEGAL_BUSINESS_NAME/VITE_LEGAL_BUSINESS_NAME", process.env.LEGAL_BUSINESS_NAME, process.env.VITE_LEGAL_BUSINESS_NAME],
    ["legal business address", "LEGAL_BUSINESS_ADDRESS/VITE_LEGAL_BUSINESS_ADDRESS", process.env.LEGAL_BUSINESS_ADDRESS, process.env.VITE_LEGAL_BUSINESS_ADDRESS],
    ["health-data processor disclosure", "HEALTH_DATA_PROCESSORS/VITE_HEALTH_DATA_PROCESSORS", process.env.HEALTH_DATA_PROCESSORS, process.env.VITE_HEALTH_DATA_PROCESSORS],
  ];
  for (const [, names, serverValue, browserValue] of matchedDisclosures) {
    if (serverValue?.trim() && browserValue?.trim() && serverValue.trim() !== browserValue.trim()) {
      errors.push(`${names} must match exactly so public disclosures cannot drift from server configuration`);
    }
  }
  if ((process.env.JWT_SECRET || "").length < 32 || (process.env.JWT_SECRET || "").includes("replace-with")) {
    errors.push("JWT_SECRET must be a production secret of at least 32 characters");
  }
  const securityEmail = process.env.SECURITY_CONTACT_EMAIL || process.env.PRIVACY_CONTACT_EMAIL || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(securityEmail) || securityEmail.endsWith("@example.com")) {
    errors.push("SECURITY_CONTACT_EMAIL (or PRIVACY_CONTACT_EMAIL fallback) must be a real monitored address");
  }
  const retentionExpectations = {
    PUBLIC_USAGE_LOG_RETENTION_DAYS: 90,
    PUBLIC_SAFETY_EVENT_RETENTION_DAYS: 90,
    PUBLIC_BACKUP_MAX_RETENTION_DAYS: 35,
    PUBLIC_PRIVACY_REQUEST_DETAIL_RETENTION_DAYS: 90,
  } as const;
  for (const [name, expected] of Object.entries(retentionExpectations)) {
    const value = Number(process.env[name] || expected);
    if (PUBLIC_WELLNESS_MODE && value !== expected) errors.push(`${name} must remain ${expected} in the minimum-risk public release so the published retention schedule stays accurate`);
  }
  if (PUBLIC_WELLNESS_MODE && process.env.VITE_ENABLE_MARKETING_ANALYTICS === "true") {
    errors.push("VITE_ENABLE_MARKETING_ANALYTICS must remain false for the minimum-risk public health/wellness release");
  }
  const processorDisclosure = (process.env.HEALTH_DATA_PROCESSORS || "").toLowerCase();
  const aiProcessorName = (process.env.AI_PROCESSOR_NAME || "").trim().toLowerCase();
  const authProcessorName = (process.env.AUTH_PROCESSOR_NAME || "").trim().toLowerCase();
  if (aiProcessorName && !processorDisclosure.includes(aiProcessorName)) {
    errors.push("HEALTH_DATA_PROCESSORS must include the configured AI_PROCESSOR_NAME so the public processor disclosure matches actual AI routing");
  }
  if (authProcessorName && !processorDisclosure.includes(authProcessorName)) {
    errors.push("HEALTH_DATA_PROCESSORS must include the configured AUTH_PROCESSOR_NAME so the public processor disclosure matches actual authentication routing");
  }

  const browserPublicWellness = process.env.VITE_PUBLIC_WELLNESS_MODE !== "false";
  const browserClinicalEnabled = !browserPublicWellness && process.env.VITE_ENABLE_CLINICAL_TOOLS === "true";
  if (browserPublicWellness !== PUBLIC_WELLNESS_MODE) errors.push("PUBLIC_WELLNESS_MODE and VITE_PUBLIC_WELLNESS_MODE must describe the same production edition");
  if (browserClinicalEnabled !== CLINICAL_TOOLS_ENABLED) errors.push("ENABLE_CLINICAL_TOOLS and VITE_ENABLE_CLINICAL_TOOLS must match the server/browser production edition");
  if (PUBLIC_WELLNESS_MODE && CLINICAL_TOOLS_ENABLED) errors.push("Clinical tools cannot be enabled inside the public wellness edition");
  if (!PUBLIC_WELLNESS_MODE && !CLINICAL_TOOLS_ENABLED) errors.push("Production must select either the public wellness edition or an explicitly configured clinical edition");
  if (PUBLIC_WELLNESS_MODE && process.env.HIPAA_DEPLOYMENT_MODE !== "consumer") errors.push("The public wellness edition requires HIPAA_DEPLOYMENT_MODE=consumer so it is not misrepresented as a covered-entity deployment");

  if (process.env.PRIVACY_SECURITY_REVIEW_CONFIRMED !== "true") errors.push("PRIVACY_SECURITY_REVIEW_CONFIRMED=true is required after production security/privacy review");
  if (process.env.CONSUMER_DATA_ENCRYPTION_CONFIRMED !== "true") errors.push("CONSUMER_DATA_ENCRYPTION_CONFIRMED=true is required after verifying encryption at rest and in transit");
  if (process.env.AI_PROCESSOR_PRIVACY_REVIEW_CONFIRMED !== "true") errors.push("AI_PROCESSOR_PRIVACY_REVIEW_CONFIRMED=true is required after reviewing every AI/data processor used in production");
  if (process.env.PROCESSOR_CONTRACTS_CONFIRMED !== "true") errors.push("PROCESSOR_CONTRACTS_CONFIRMED=true is required after confirming required service-provider/privacy contracts and data-processing terms for production processors");
  if (process.env.EXTERNAL_RESEARCH_QUERY_REVIEW_CONFIRMED !== "true") errors.push("EXTERNAL_RESEARCH_QUERY_REVIEW_CONFIRMED=true is required after reviewing the NCBI/PubMed research-query disclosure and data flow");
  if (process.env.INCIDENT_RESPONSE_PLAN_CONFIRMED !== "true") errors.push("INCIDENT_RESPONSE_PLAN_CONFIRMED=true is required after adopting an incident/breach response process");
  if (process.env.DATA_RETENTION_POLICY_CONFIRMED !== "true") errors.push("DATA_RETENTION_POLICY_CONFIRMED=true is required after defining active-data and backup retention/deletion periods");
  if (process.env.CONSUMER_HEALTH_DATA_DELETION_WORKFLOW_CONFIRMED !== "true") errors.push("CONSUMER_HEALTH_DATA_DELETION_WORKFLOW_CONFIRMED=true is required after verifying deletion requests propagate to required archives/backups/processors");

  const serverPaid = process.env.ENABLE_PAID_SUBSCRIPTIONS === "true";
  const browserPaid = process.env.VITE_ENABLE_PAID_SUBSCRIPTIONS === "true";
  if (serverPaid !== browserPaid) errors.push("ENABLE_PAID_SUBSCRIPTIONS and VITE_ENABLE_PAID_SUBSCRIPTIONS must match");
  if (serverPaid) {
    if (!PUBLIC_WELLNESS_MODE) errors.push("The consumer subscription flow is only supported in PUBLIC_WELLNESS_MODE");
    must("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY, errors);
    must("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET, errors);
    must("STRIPE_PRICE_ID_INSIGHT", process.env.STRIPE_PRICE_ID_INSIGHT, errors);
    must("MEMBERSHIP_PRICE_CENTS", process.env.MEMBERSHIP_PRICE_CENTS, errors);
    must("VITE_MEMBERSHIP_PRICE_CENTS", process.env.VITE_MEMBERSHIP_PRICE_CENTS, errors);
    must("OAUTH_SERVER_URL", process.env.OAUTH_SERVER_URL, errors);
    must("OAUTH_PORTAL_URL or VITE_OAUTH_PORTAL_URL", process.env.OAUTH_PORTAL_URL || process.env.VITE_OAUTH_PORTAL_URL, errors);
    must("VITE_APP_ID", process.env.VITE_APP_ID, errors);
    const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
    if (!processorDisclosure.includes("stripe")) errors.push("HEALTH_DATA_PROCESSORS must include Stripe when paid subscriptions are enabled");
    if (!(stripeSecret.startsWith("sk_live_") || stripeSecret.startsWith("rk_live_"))) errors.push("STRIPE_SECRET_KEY must be a live-mode Stripe secret/restricted key for paid production");
    if (!(process.env.STRIPE_WEBHOOK_SECRET || "").startsWith("whsec_")) errors.push("STRIPE_WEBHOOK_SECRET must be a Stripe webhook signing secret");
    if (!(process.env.STRIPE_PRICE_ID_INSIGHT || "").startsWith("price_")) errors.push("STRIPE_PRICE_ID_INSIGHT must be a Stripe Price ID");
    if (process.env.SALES_TAX_REVIEW_CONFIRMED !== "true") errors.push("SALES_TAX_REVIEW_CONFIRMED=true is required after reviewing the tax treatment of the paid software subscription in the jurisdictions where it is sold");
    if (process.env.SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED !== "true") errors.push("SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED=true is required after checkout/webhook/portal access has been tested");
    const serverPrice = Number(process.env.MEMBERSHIP_PRICE_CENTS);
    const clientPrice = Number(process.env.VITE_MEMBERSHIP_PRICE_CENTS);
    if (!Number.isInteger(serverPrice) || serverPrice <= 0 || serverPrice !== clientPrice) errors.push("MEMBERSHIP_PRICE_CENTS and VITE_MEMBERSHIP_PRICE_CENTS must be the same positive integer");
  }

  if (CLINICAL_TOOLS_ENABLED) {
    if (process.env.HIPAA_DEPLOYMENT_MODE !== "baa") errors.push("ENABLE_CLINICAL_TOOLS requires HIPAA_DEPLOYMENT_MODE=baa");
    if (process.env.HIPAA_BAA_CONFIRMED !== "true") errors.push("ENABLE_CLINICAL_TOOLS requires HIPAA_BAA_CONFIRMED=true");
    if (process.env.PHI_STORAGE_ENCRYPTION_CONFIRMED !== "true") errors.push("ENABLE_CLINICAL_TOOLS requires PHI_STORAGE_ENCRYPTION_CONFIRMED=true");
    must("CLINICAL_COVERED_ENTITY_NAME", process.env.CLINICAL_COVERED_ENTITY_NAME, errors);
    must("VITE_CLINICAL_COVERED_ENTITY_NAME", process.env.VITE_CLINICAL_COVERED_ENTITY_NAME, errors);
    must("CLINICAL_NPP_URL", process.env.CLINICAL_NPP_URL, errors);
    must("VITE_CLINICAL_NPP_URL", process.env.VITE_CLINICAL_NPP_URL, errors);
    if (process.env.CLINICAL_COVERED_ENTITY_NAME?.trim() !== process.env.VITE_CLINICAL_COVERED_ENTITY_NAME?.trim()) {
      errors.push("CLINICAL_COVERED_ENTITY_NAME and VITE_CLINICAL_COVERED_ENTITY_NAME must match");
    }
    if (process.env.CLINICAL_NPP_URL?.trim() !== process.env.VITE_CLINICAL_NPP_URL?.trim()) {
      errors.push("CLINICAL_NPP_URL and VITE_CLINICAL_NPP_URL must match");
    }
    if (process.env.CLINICAL_NPP_URL && !process.env.CLINICAL_NPP_URL.startsWith("https://")) {
      errors.push("CLINICAL_NPP_URL must use https:// in production");
    }
    if (process.env.HIPAA_SECURITY_RISK_ANALYSIS_CONFIRMED !== "true") errors.push("Clinical production requires HIPAA_SECURITY_RISK_ANALYSIS_CONFIRMED=true after an organization-specific security risk analysis");
    if (process.env.HIPAA_ACCESS_CONTROL_REVIEW_CONFIRMED !== "true") errors.push("Clinical production requires HIPAA_ACCESS_CONTROL_REVIEW_CONFIRMED=true after role/access review");
    if (process.env.HIPAA_AUDIT_CONTROLS_CONFIRMED !== "true") errors.push("Clinical production requires HIPAA_AUDIT_CONTROLS_CONFIRMED=true after audit logging/review procedures are verified");
    if (process.env.HIPAA_WORKFORCE_TRAINING_CONFIRMED !== "true") errors.push("Clinical production requires HIPAA_WORKFORCE_TRAINING_CONFIRMED=true after required workforce training is in place");
    if (process.env.HIPAA_MINIMUM_NECESSARY_REVIEW_CONFIRMED !== "true") errors.push("Clinical production requires HIPAA_MINIMUM_NECESSARY_REVIEW_CONFIRMED=true after minimum-necessary access/data flows are reviewed");
    if (process.env.CLINICAL_HUMAN_REVIEW_REQUIRED !== "true") errors.push("Clinical production requires CLINICAL_HUMAN_REVIEW_REQUIRED=true; AI clinical outputs must remain drafts for human review");
    must("DATABASE_URL", process.env.DATABASE_URL, errors);
  }

  // The browser bundle must have been built for the edition the server runs.
  const built = readBuildInfo();
  if (!built) {
    errors.push("dist/public/build-info.json is missing: the browser bundle was not built by this repository's build script, so its edition cannot be verified");
  } else {
    if (built.publicWellnessMode !== PUBLIC_WELLNESS_MODE) errors.push("The browser bundle was built for a different edition than the server is running (VITE_PUBLIC_WELLNESS_MODE at build time vs PUBLIC_WELLNESS_MODE now)");
    if (built.clinicalToolsEnabled !== CLINICAL_TOOLS_ENABLED) errors.push("The browser bundle was built with a different clinical-tools setting than the server is running");
    if (built.paidSubscriptionsEnabled !== serverPaid) errors.push("The browser bundle was built with a different paid-subscriptions setting than the server is running");
    if ((built.releasePosture ?? "production") !== RELEASE_POSTURE) errors.push("The browser bundle was built for a different release posture (VITE_RELEASE_POSTURE) than the server is running (RELEASE_POSTURE)");
    if (built.privacyContactEmail && process.env.PRIVACY_CONTACT_EMAIL && built.privacyContactEmail.trim() !== process.env.PRIVACY_CONTACT_EMAIL.trim()) errors.push("The browser bundle carries a different privacy contact than the server (rebuild with the current VITE_PRIVACY_CONTACT_EMAIL)");
    if (built.healthDataProcessors && process.env.HEALTH_DATA_PROCESSORS && built.healthDataProcessors.trim() !== process.env.HEALTH_DATA_PROCESSORS.trim()) errors.push("The browser bundle carries a different processor disclosure than the server (rebuild with the current VITE_HEALTH_DATA_PROCESSORS)");
  }

  if (RELEASE_POSTURE === "preview") {
    if (!PUBLIC_WELLNESS_MODE || CLINICAL_TOOLS_ENABLED) errors.push("preview posture is only available for the public wellness edition");
    if (serverPaid || browserPaid) errors.push("preview posture cannot run paid subscriptions");
    const fatal = errors.filter(e => PREVIEW_FATAL.test(e));
    lastBlockers = errors.filter(e => !fatal.includes(e));
    if (fatal.length) throw new Error(`Doctor Buddy preview blocked:\n- ${fatal.join("\n- ")}`);
    if (lastBlockers.length) {
      console.warn(`[release] PREVIEW posture: ${lastBlockers.length} production blocker${lastBlockers.length === 1 ? "" : "s"} outstanding. This deployment is not launched.`);
      for (const b of lastBlockers) console.warn(`[release]   - ${b}`);
    }
    return;
  }

  lastBlockers = errors;
  if (errors.length) throw new Error(`Doctor Buddy production release blocked:\n- ${errors.join("\n- ")}`);
}
