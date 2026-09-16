/**
 * After `vite build`, record what the browser bundle was built to say, so the
 * server can refuse to start in production when its runtime edition disagrees
 * with the edition baked into the bundle it is about to serve.
 */
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("dist/public/build-info.json");
const info = {
  builtAt: new Date().toISOString(),
  publicWellnessMode: process.env.VITE_PUBLIC_WELLNESS_MODE !== "false",
  clinicalToolsEnabled: process.env.VITE_PUBLIC_WELLNESS_MODE === "false" && process.env.VITE_ENABLE_CLINICAL_TOOLS === "true",
  paidSubscriptionsEnabled: process.env.VITE_ENABLE_PAID_SUBSCRIPTIONS === "true",
  releasePosture: process.env.VITE_RELEASE_POSTURE === "preview" ? "preview" : "production",
  privacyContactEmail: process.env.VITE_PRIVACY_CONTACT_EMAIL ?? "",
  legalBusinessName: process.env.VITE_LEGAL_BUSINESS_NAME ?? "",
  healthDataProcessors: process.env.VITE_HEALTH_DATA_PROCESSORS ?? "",
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(info, null, 2));
console.log(`[build-info] ${out}: ${info.releasePosture} ${info.publicWellnessMode ? "public wellness" : info.clinicalToolsEnabled ? "clinical" : "no edition"} edition`);
