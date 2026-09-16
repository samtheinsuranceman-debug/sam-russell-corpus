import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const required = [
  "client/src/pages/legal/Terms.tsx",
  "client/src/pages/legal/Privacy.tsx",
  "client/src/pages/legal/HealthDataPrivacy.tsx",
  "client/src/pages/legal/MedicalDisclaimer.tsx",
  "client/src/pages/legal/SubscriptionTerms.tsx",
  "client/src/pages/legal/FinancialDisclaimer.tsx",
  "client/src/pages/Subscribe.tsx",
  "client/src/pages/AccountSettings.tsx",
  "client/src/components/ConsumerHealthConsentModal.tsx",
  "client/src/components/PaidAccessGate.tsx",
  "server/compliance/releasePolicy.ts",
  "server/compliance/retention.ts",
  "server/compliance/dataExport.ts",
  "server/compliance/dataDeletion.ts",
  "server/billing.ts",
  "drizzle/0010_public_subscription_controls.sql",
  "drizzle/0011_breach_jurisdiction_context.sql",
  "drizzle/0012_privacy_rights_and_consent_evidence.sql",
  "shared/legalVersions.ts",
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing required release file: ${rel}`);
}

const forbiddenPositiveClaims = [
  "HIPAA Compliant",
  "HIPAA BAA Included",
  "clinical-grade AI psychiatrist",
  "medical-grade AI psychiatrist",
  "board-certified psychiatrist providing",
  "licensed clinical psychologist providing",
  "FDA approved Doctor Buddy",
  "FDA-approved Doctor Buddy",
  // Financial claims the education-only posture cannot make.
  "guaranteed return",
  "guaranteed returns",
  "guaranteed income for life",
  "risk-free income",
  "cannot lose money",
  "can't lose money",
  "personalized investment advice",
  "individualized financial advice",
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if ([".git", "node_modules", "dist"].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const claimScanRoots = [path.join(root, "client", "src"), path.join(root, "server")];
for (const file of claimScanRoots.flatMap(walk)) {
  if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const phrase of forbiddenPositiveClaims) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) {
      failures.push(`Forbidden positive regulatory/professional claim "${phrase}" in ${path.relative(root, file)}`);
    }
  }
}

const legalVersions = fs.readFileSync(path.join(root, "shared/legalVersions.ts"), "utf8");
if (!legalVersions.includes('CONSUMER_HEALTH_CONSENT_VERSION = "4.0"')) failures.push("Final consumer-health consent version is not locked to 4.0");
for (const key of ["TERMS_OF_USE_VERSION", "PRIVACY_POLICY_VERSION", "HEALTH_DATA_POLICY_VERSION", "MEDICAL_DISCLAIMER_VERSION", "SUBSCRIPTION_TERMS_VERSION", "FINANCIAL_DISCLAIMER_VERSION"]) {
  if (!legalVersions.includes(key)) failures.push(`Missing shared legal version: ${key}`);
}

const policy = fs.readFileSync(path.join(root, "server/compliance/releasePolicy.ts"), "utf8");
for (const requiredText of [
  "Clinical tools cannot be enabled inside the public wellness edition",
  "SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED",
  "AI_PROCESSOR_PRIVACY_REVIEW_CONFIRMED",
  "PROCESSOR_CONTRACTS_CONFIRMED",
  "EXTERNAL_RESEARCH_QUERY_REVIEW_CONFIRMED",
  "CONSUMER_HEALTH_DATA_DELETION_WORKFLOW_CONFIRMED",
  "PUBLIC_USAGE_LOG_RETENTION_DAYS",
  "PUBLIC_SAFETY_EVENT_RETENTION_DAYS",
  "PUBLIC_BACKUP_MAX_RETENTION_DAYS",
  "PUBLIC_PRIVACY_REQUEST_DETAIL_RETENTION_DAYS",
  "SECURITY_CONTACT_EMAIL",
  "VITE_ENABLE_MARKETING_ANALYTICS must remain false",
]) {
  if (!policy.includes(requiredText)) failures.push(`Release policy missing safeguard: ${requiredText}`);
}

const llm = fs.readFileSync(path.join(root, "server/_core/llm.ts"), "utf8");
if (!llm.includes("BUILT_IN_FORGE_API_URL is required in production")) failures.push("LLM transport must fail closed when the production AI endpoint is not explicit");
const routers = fs.readFileSync(path.join(root, "server/routers.ts"), "utf8");
if (!/research:\s*router\(\{[\s\S]*?search:\s*protectedProcedure/.test(routers)) failures.push("Public research search must require authenticated consent/entitlement");
if (!policy.includes('"research.forDiagnosis"')) failures.push("Diagnosis-derived research helper must remain clinical-only in the public release");
for (const requiredText of ["processorDisclosureSnapshot", "submitPrivacyRequest", "myPrivacyRequests", "adult18Plus: true"]) {
  if (!routers.includes(requiredText)) failures.push(`Consent/privacy workflow missing safeguard: ${requiredText}`);
}

const trpc = fs.readFileSync(path.join(root, "server/_core/trpc.ts"), "utf8");
if (!trpc.includes("processorDisclosureSnapshot") || !trpc.includes("HEALTH_DATA_CONSENT_REQUIRED")) failures.push("Server consent middleware must invalidate consent when the processor disclosure changes");

const billing = fs.readFileSync(path.join(root, "server/billing.ts"), "utf8");
for (const requiredText of ["verifyStripeSignature", "verifyConfiguredStripePrice", "recurringBillingAccepted", "create-portal"]) {
  if (!billing.includes(requiredText)) failures.push(`Billing implementation missing safeguard: ${requiredText}`);
}

// The HTTP shell lives in app.ts (mounted by index.ts), so both are read.
const serverIndex = ["server/_core/index.ts", "server/_core/app.ts"].map(rel => fs.readFileSync(path.join(root, rel), "utf8")).join("\n");
for (const requiredText of ["/.well-known/security.txt", "startPublicRetentionScheduler", "Strict-Transport-Security", "Content-Security-Policy", "X-Robots-Tag", "/robots.txt", "Cache-Control", "no-store"]) {
  if (!serverIndex.includes(requiredText)) failures.push(`Internet-facing server baseline missing: ${requiredText}`);
}


const privacyPage = fs.readFileSync(path.join(root, "client/src/pages/legal/Privacy.tsx"), "utf8");
for (const requiredText of ["90 days", "35 days", "correction", "appeal"]) {
  if (!privacyPage.toLowerCase().includes(requiredText.toLowerCase())) failures.push(`Privacy policy missing current public disclosure: ${requiredText}`);
}
const healthPrivacyPage = fs.readFileSync(path.join(root, "client/src/pages/legal/HealthDataPrivacy.tsx"), "utf8");
for (const requiredText of ["processor", "fresh consent", "delete", "appeal"]) {
  if (!healthPrivacyPage.toLowerCase().includes(requiredText.toLowerCase())) failures.push(`Health-data privacy policy missing current disclosure: ${requiredText}`);
}

const schema = fs.readFileSync(path.join(root, "drizzle/schema.ts"), "utf8");
for (const requiredText of ["privacyRequests", "termsVersion", "healthDataPolicyVersion", "processorDisclosureSnapshot"]) {
  if (!schema.includes(requiredText)) failures.push(`Database consent/privacy evidence missing: ${requiredText}`);
}

if (failures.length) {
  console.error("PUBLIC RELEASE AUDIT FAILED");
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log("PUBLIC RELEASE AUDIT PASSED");
console.log(`Checked ${required.length} required release files, consent evidence, retention, billing, internet security, and forbidden positive medical/regulatory claims.`);
