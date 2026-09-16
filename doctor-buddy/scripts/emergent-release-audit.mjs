import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const failures = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const publicAudit = spawnSync(process.execPath, [path.join(root, "scripts/public-release-audit.mjs")], { cwd: root, encoding: "utf8" });
if (publicAudit.status !== 0) failures.push(`Public release audit failed:\n${publicAudit.stdout}\n${publicAudit.stderr}`);

for (const rel of [
  "client/src/pages/ClinicalHome.tsx",
  "client/src/components/ClinicalDeploymentBanner.tsx",
  "client/src/pages/SupportLab.tsx",
  "client/src/lib/supportInventions.ts",
  "ADAPTIVE_SUPPORT_INVENTION_PORTFOLIO.md",
  // Medically-driven financial planning (merged from the Claude build).
  "shared/finance/calc/index.ts",
  "shared/engines/psychFinancialBridge.ts",
  "shared/engines/readinessEvidence.ts",
  "client/src/pages/finance/FinanceHub.tsx",
  "client/src/pages/finance/FactFinder.tsx",
  "client/src/pages/legal/FinancialDisclaimer.tsx",
  "PANEL_REVIEW.md",
]) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing emergent feature: ${rel}`);
}

const app = read("client/src/App.tsx");
if (!app.includes("CLINICAL_TOOLS_ENABLED ? withBoundary(ClinicalHome) : withBoundary(Home)")) failures.push("Root route must switch deliberately between public and clinical editions");
if (!app.includes("!CLINICAL_TOOLS_ENABLED && <ConsumerHealthConsentModal />")) failures.push("Consumer-health consent modal must not masquerade as a HIPAA clinical notice");

const routers = read("server/routers.ts");
for (const pattern of [
  /assessment:\s*router\(\{[\s\S]*?start:\s*protectedProcedure/,
  /saveProgress:\s*protectedProcedure/,
  /complete:\s*protectedProcedure/,
  /report:\s*router\(\{[\s\S]*?get:\s*protectedProcedure/,
  /getByToken:\s*publicProcedure[\s\S]*?sharedWithProvider/,
  /revokeShare:\s*protectedProcedure/,
]) {
  if (!pattern.test(routers)) failures.push(`Clinical privacy boundary missing: ${pattern}`);
}


// High-risk clinical operations must never drift back to anonymous access.
for (const [label, pattern] of [
  ["diagnosis-linked research", /forDiagnosis:\s*adminProcedure/],
  ["life-map generation", /lifeMaps:\s*router\(\{[\s\S]*?generate:\s*adminProcedure/],
  ["life-event analysis", /lifeEvents:\s*router\(\{[\s\S]*?analyze:\s*adminProcedure/],
  ["lead capture", /leads:\s*router\(\{[\s\S]*?capture:\s*protectedProcedure/],
  ["medication interaction analysis", /checkInteractions:\s*adminProcedure/],
  ["clinician report review", /clinicianReview:\s*router\(\{[\s\S]*?getReports:\s*protectedProcedure/],
]) {
  if (!pattern.test(routers)) failures.push(`Clinical authentication boundary missing: ${label}`);
}

const openRouterBlock = routers.match(/openRouter:\s*router\(\{[\s\S]*?\n  \}\),\n\n  mcs:/)?.[0] || "";
if (!openRouterBlock || /protectedProcedure|publicProcedure/.test(openRouterBlock) || !/adminProcedure/.test(openRouterBlock)) {
  failures.push("Raw OpenRouter/model-console procedures must remain clinician/operator admin-only");
}

const clinicalPdf = read("client/src/lib/clinicalPdfExport.ts");
if (/shareToken|share token/i.test(clinicalPdf)) failures.push("Clinical PDF must not embed bearer share tokens");

const policy = read("server/compliance/releasePolicy.ts");
for (const required of [
  "HIPAA_BAA_CONFIRMED",
  "PHI_STORAGE_ENCRYPTION_CONFIRMED",
  "HIPAA_SECURITY_RISK_ANALYSIS_CONFIRMED",
  "HIPAA_ACCESS_CONTROL_REVIEW_CONFIRMED",
  "HIPAA_AUDIT_CONTROLS_CONFIRMED",
  "HIPAA_WORKFORCE_TRAINING_CONFIRMED",
  "HIPAA_MINIMUM_NECESSARY_REVIEW_CONFIRMED",
  "CLINICAL_HUMAN_REVIEW_REQUIRED",
  "CLINICAL_COVERED_ENTITY_NAME",
  "CLINICAL_NPP_URL",
]) {
  if (!policy.includes(required)) failures.push(`Clinical production gate missing: ${required}`);
}


for (const requiredMixedClinicalProcedure of [
  "research.forDiagnosis",
  "medications.checkInteractions",
  "drBuddy.getWhispererSuggestions",
  "drBuddy.getDoctorPatients",
  "drBuddy.updateClinicalNotes",
  "drBuddy.getPatientDetail",
  "drBuddy.getSession",
  "drBuddy.saveSession",
  "finance.readiness",
]) {
  if (!policy.includes(requiredMixedClinicalProcedure)) failures.push(`Clinical release gate missing mixed-namespace procedure: ${requiredMixedClinicalProcedure}`);
}

// Finance routes take the edition's ordinary gate and the disclaimer is linked.
for (const route of ["/finance", "/finance/fact-finder", "/finance/calc/:id", "/finance/strategy/:slug"]) {
  const line = app.split("\n").find(l => l.includes(`<Route path="${route}"`)) || "";
  const m = line.match(/CLINICAL_TOOLS_ENABLED \? clinicalProtected\((\w+)\) : paid\((\w+)\)/);
  if (!m || m[1] !== m[2]) failures.push(`Finance route must take the edition gate (clinicalProtected / paid): ${route}`);
}
if (!app.includes('<Route path="/financial-disclaimer"')) failures.push("Financial disclaimer route missing");
const readinessPanel = read("client/src/components/finance/ReadinessPanel.tsx");
if (!readinessPanel.includes('href="/financial-disclaimer"')) failures.push("Readiness panel must link the financial disclaimer");
const evidenceHook = read("client/src/lib/clinicalEvidence.ts");
if (!/enabled:\s*CLINICAL_TOOLS_ENABLED && isAuthenticated/.test(evidenceHook)) failures.push("finance.readiness must only be queried in the clinical edition when signed in");
if (!/publicSafeProfile\(/.test(evidenceHook)) failures.push("Public-edition finance profile must pass through publicSafeProfile");

const stateRights = read("server/compliance/stateRights.ts");
if (stateRights.includes("invokeLLM")) failures.push("Legal/privacy rights must not be generated by an LLM at runtime");

const drBuddy = read("server/drBuddy.ts");
for (const forbidden of ["board-certified psychiatrist providing", "licensed clinical psychologist providing", "clinical-grade AI psychiatrist"]) {
  if (drBuddy.toLowerCase().includes(forbidden)) failures.push(`Professional impersonation language survived: ${forbidden}`);
}

if (failures.length) {
  console.error("EMERGENT RELEASE AUDIT FAILED");
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log("EMERGENT RELEASE AUDIT PASSED");
console.log("Public-paid safeguards retained; clinical edition gating, authenticated persistence, report ownership, controlled sharing, adaptive support, and deterministic legal-rights logic verified.");
