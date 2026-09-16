/**
 * TAKEN APART — the production release validator, 2,000 environment permutations.
 *
 * The validator is the last gate before a misconfigured deployment reaches the
 * internet. The invariants: a complete, honest public-edition environment
 * passes; any single defect from the catalogue fails it; any random mix with at
 * least one defect fails it; and random noise in keys the validator does not
 * read never fails it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Rng, rootSeed, weirdString } from "./rng";

const distDir = fs.mkdtempSync(path.join(os.tmpdir(), "drbuddy-build-"));

/** The bundle the server would serve, built from the same env. */
function writeBuildInfo(env: Record<string, string | undefined>, override: Record<string, unknown> = {}) {
  const info = {
    publicWellnessMode: env.VITE_PUBLIC_WELLNESS_MODE !== "false",
    clinicalToolsEnabled: env.VITE_PUBLIC_WELLNESS_MODE === "false" && env.VITE_ENABLE_CLINICAL_TOOLS === "true",
    paidSubscriptionsEnabled: env.VITE_ENABLE_PAID_SUBSCRIPTIONS === "true",
    releasePosture: env.VITE_RELEASE_POSTURE === "preview" ? "preview" : "production",
    privacyContactEmail: env.VITE_PRIVACY_CONTACT_EMAIL ?? "",
    healthDataProcessors: env.VITE_HEALTH_DATA_PROCESSORS ?? "",
    ...override,
  };
  fs.writeFileSync(path.join(distDir, "build-info.json"), JSON.stringify(info));
}

const VALID: Record<string, string> = {
  NODE_ENV: "production",
  PUBLIC_BASE_URL: "https://doctorbuddy.example.com",
  PUBLIC_WELLNESS_MODE: "true",
  VITE_PUBLIC_WELLNESS_MODE: "true",
  ENABLE_CLINICAL_TOOLS: "false",
  VITE_ENABLE_CLINICAL_TOOLS: "false",
  HIPAA_DEPLOYMENT_MODE: "consumer",
  PRIVACY_CONTACT_EMAIL: "privacy@doctorbuddy.example.com",
  VITE_PRIVACY_CONTACT_EMAIL: "privacy@doctorbuddy.example.com",
  SECURITY_CONTACT_EMAIL: "security@doctorbuddy.example.com",
  LEGAL_BUSINESS_NAME: "Russell Capital Systems LLC",
  VITE_LEGAL_BUSINESS_NAME: "Russell Capital Systems LLC",
  LEGAL_BUSINESS_ADDRESS: "1 Main St, Castle Hayne, NC 28429",
  VITE_LEGAL_BUSINESS_ADDRESS: "1 Main St, Castle Hayne, NC 28429",
  HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC;Manus AI Ltd.",
  VITE_HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC;Manus AI Ltd.",
  DATABASE_URL: "mysql://u:p@db.internal:3306/drbuddy",
  JWT_SECRET: "0123456789abcdef0123456789abcdef0123456789",
  BUILT_IN_FORGE_API_URL: "https://forge.example.com/v1",
  BUILT_IN_FORGE_API_KEY: "forge-key-xyz",
  AI_PROCESSOR_NAME: "Anthropic PBC",
  AUTH_PROCESSOR_NAME: "Manus AI Ltd.",
  PUBLIC_USAGE_LOG_RETENTION_DAYS: "90",
  PUBLIC_SAFETY_EVENT_RETENTION_DAYS: "90",
  PUBLIC_BACKUP_MAX_RETENTION_DAYS: "35",
  PUBLIC_PRIVACY_REQUEST_DETAIL_RETENTION_DAYS: "90",
  VITE_ENABLE_MARKETING_ANALYTICS: "false",
  PRIVACY_SECURITY_REVIEW_CONFIRMED: "true",
  CONSUMER_DATA_ENCRYPTION_CONFIRMED: "true",
  AI_PROCESSOR_PRIVACY_REVIEW_CONFIRMED: "true",
  PROCESSOR_CONTRACTS_CONFIRMED: "true",
  EXTERNAL_RESEARCH_QUERY_REVIEW_CONFIRMED: "true",
  INCIDENT_RESPONSE_PLAN_CONFIRMED: "true",
  DATA_RETENTION_POLICY_CONFIRMED: "true",
  CONSUMER_HEALTH_DATA_DELETION_WORKFLOW_CONFIRMED: "true",
  ENABLE_PAID_SUBSCRIPTIONS: "false",
  VITE_ENABLE_PAID_SUBSCRIPTIONS: "false",
};

/** Each defect is one thing an operator could get wrong. Every one must fail. */
const DEFECTS: Array<[string, Record<string, string | undefined>]> = [
  ["missing base url", { PUBLIC_BASE_URL: undefined }],
  ["http base url", { PUBLIC_BASE_URL: "http://doctorbuddy.example.com" }],
  ["placeholder privacy email", { PRIVACY_CONTACT_EMAIL: "privacy@example.com", VITE_PRIVACY_CONTACT_EMAIL: "privacy@example.com" }],
  ["privacy email says replace", { PRIVACY_CONTACT_EMAIL: "replace-me@corp.com", VITE_PRIVACY_CONTACT_EMAIL: "replace-me@corp.com" }],
  ["privacy email drift", { VITE_PRIVACY_CONTACT_EMAIL: "other@doctorbuddy.example.com" }],
  ["legal name placeholder", { LEGAL_BUSINESS_NAME: "replace-with-real-legal-operator-name", VITE_LEGAL_BUSINESS_NAME: "replace-with-real-legal-operator-name" }],
  ["legal name drift", { VITE_LEGAL_BUSINESS_NAME: "Some Other Name" }],
  ["address placeholder", { LEGAL_BUSINESS_ADDRESS: "not configured", VITE_LEGAL_BUSINESS_ADDRESS: "not configured" }],
  ["processor list placeholder", { HEALTH_DATA_PROCESSORS: "replace-with-real-processor-names", VITE_HEALTH_DATA_PROCESSORS: "replace-with-real-processor-names" }],
  ["processor list omits AI processor", { HEALTH_DATA_PROCESSORS: "Railway Corp.;Manus AI Ltd.", VITE_HEALTH_DATA_PROCESSORS: "Railway Corp.;Manus AI Ltd." }],
  ["processor list omits auth processor", { HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC", VITE_HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC" }],
  ["processor list drift", { VITE_HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC" }],
  ["missing database", { DATABASE_URL: undefined }],
  ["short jwt secret", { JWT_SECRET: "short" }],
  ["placeholder jwt secret", { JWT_SECRET: "replace-with-at-least-32-random-bytes-please" }],
  ["http forge url", { BUILT_IN_FORGE_API_URL: "http://forge.example.com" }],
  ["missing forge key", { BUILT_IN_FORGE_API_KEY: undefined }],
  ["missing ai processor name", { AI_PROCESSOR_NAME: undefined }],
  ["retention drift", { PUBLIC_USAGE_LOG_RETENTION_DAYS: "365" }],
  ["backup retention drift", { PUBLIC_BACKUP_MAX_RETENTION_DAYS: "90" }],
  ["marketing analytics on", { VITE_ENABLE_MARKETING_ANALYTICS: "true" }],
  ["security contact placeholder", { SECURITY_CONTACT_EMAIL: "security@example.com" }],
  ...["PRIVACY_SECURITY_REVIEW_CONFIRMED", "CONSUMER_DATA_ENCRYPTION_CONFIRMED", "AI_PROCESSOR_PRIVACY_REVIEW_CONFIRMED", "PROCESSOR_CONTRACTS_CONFIRMED", "EXTERNAL_RESEARCH_QUERY_REVIEW_CONFIRMED", "INCIDENT_RESPONSE_PLAN_CONFIRMED", "DATA_RETENTION_POLICY_CONFIRMED", "CONSUMER_HEALTH_DATA_DELETION_WORKFLOW_CONFIRMED"].flatMap(k => [
    [`${k} false`, { [k]: "false" }] as [string, Record<string, string | undefined>],
    [`${k} missing`, { [k]: undefined }] as [string, Record<string, string | undefined>],
    [`${k} yes`, { [k]: "yes" }] as [string, Record<string, string | undefined>],
  ]),
  ["edition drift: browser clinical", { VITE_PUBLIC_WELLNESS_MODE: "false", VITE_ENABLE_CLINICAL_TOOLS: "true" }],
  ["edition drift: server clinical without prerequisites", { PUBLIC_WELLNESS_MODE: "false", ENABLE_CLINICAL_TOOLS: "true" }],
  ["both editions", { ENABLE_CLINICAL_TOOLS: "true", VITE_ENABLE_CLINICAL_TOOLS: "true" }],
  ["no edition", { PUBLIC_WELLNESS_MODE: "false", VITE_PUBLIC_WELLNESS_MODE: "false" }],
  ["consumer edition claims BAA", { HIPAA_DEPLOYMENT_MODE: "baa" }],
  ["paid on server only", { ENABLE_PAID_SUBSCRIPTIONS: "true" }],
  ["paid without stripe", { ENABLE_PAID_SUBSCRIPTIONS: "true", VITE_ENABLE_PAID_SUBSCRIPTIONS: "true" }],
  ["paid with test-mode stripe", { ENABLE_PAID_SUBSCRIPTIONS: "true", VITE_ENABLE_PAID_SUBSCRIPTIONS: "true", STRIPE_SECRET_KEY: "sk_test_123", STRIPE_WEBHOOK_SECRET: "whsec_x", STRIPE_PRICE_ID_INSIGHT: "price_x", MEMBERSHIP_PRICE_CENTS: "9900", VITE_MEMBERSHIP_PRICE_CENTS: "9900", OAUTH_SERVER_URL: "https://o.example.com", OAUTH_PORTAL_URL: "https://p.example.com", VITE_APP_ID: "app", SALES_TAX_REVIEW_CONFIRMED: "true", SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED: "true", HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC;Manus AI Ltd.;Stripe, Inc.", VITE_HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC;Manus AI Ltd.;Stripe, Inc." }],
  ["paid with price drift", { ENABLE_PAID_SUBSCRIPTIONS: "true", VITE_ENABLE_PAID_SUBSCRIPTIONS: "true", STRIPE_SECRET_KEY: "sk_live_123", STRIPE_WEBHOOK_SECRET: "whsec_x", STRIPE_PRICE_ID_INSIGHT: "price_x", MEMBERSHIP_PRICE_CENTS: "9900", VITE_MEMBERSHIP_PRICE_CENTS: "4900", OAUTH_SERVER_URL: "https://o.example.com", OAUTH_PORTAL_URL: "https://p.example.com", VITE_APP_ID: "app", SALES_TAX_REVIEW_CONFIRMED: "true", SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED: "true", HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC;Manus AI Ltd.;Stripe, Inc.", VITE_HEALTH_DATA_PROCESSORS: "Railway Corp.;Anthropic PBC;Manus AI Ltd.;Stripe, Inc." }],
];

/** Keys the validator never reads. Noise here must never matter. */
/** Defects in the built bundle rather than the environment. */
const BUILD_DEFECTS: Array<[string, Record<string, unknown>]> = [
  ["bundle built for the clinical edition", { publicWellnessMode: false, clinicalToolsEnabled: true }],
  ["bundle built with paid on", { paidSubscriptionsEnabled: true }],
  ["bundle built as preview", { releasePosture: "preview" }],
  ["bundle carries another privacy contact", { privacyContactEmail: "old@doctorbuddy.example.com" }],
  ["bundle carries another processor list", { healthDataProcessors: "Someone Else Inc." }],
];

const IRRELEVANT_KEYS = ["PORT", "OWNER_OPEN_ID", "OPENROUTER_API_KEY", "GROK_API_KEY", "MEM0_API_KEY", "CHAOS_SEED", "VITE_ANALYTICS_ENDPOINT", "SOME_RANDOM_THING", "AWS_REGION", "npm_config_foo"];

const READ_KEYS = new Set([...Object.keys(VALID), "RELEASE_POSTURE", "VITE_RELEASE_POSTURE", "CLIENT_DIST_DIR", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID_INSIGHT", "MEMBERSHIP_PRICE_CENTS", "VITE_MEMBERSHIP_PRICE_CENTS", "OAUTH_SERVER_URL", "OAUTH_PORTAL_URL", "VITE_OAUTH_PORTAL_URL", "VITE_APP_ID", "SALES_TAX_REVIEW_CONFIRMED", "SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED", "HIPAA_BAA_CONFIRMED", "PHI_STORAGE_ENCRYPTION_CONFIRMED", "CLINICAL_COVERED_ENTITY_NAME", "VITE_CLINICAL_COVERED_ENTITY_NAME", "CLINICAL_NPP_URL", "VITE_CLINICAL_NPP_URL", "HIPAA_SECURITY_RISK_ANALYSIS_CONFIRMED", "HIPAA_ACCESS_CONTROL_REVIEW_CONFIRMED", "HIPAA_AUDIT_CONTROLS_CONFIRMED", "HIPAA_WORKFORCE_TRAINING_CONFIRMED", "HIPAA_MINIMUM_NECESSARY_REVIEW_CONFIRMED", "CLINICAL_HUMAN_REVIEW_REQUIRED"]);

let saved: Record<string, string | undefined> = {};

function applyEnv(env: Record<string, string | undefined>, buildOverride: Record<string, unknown> = {}) {
  for (const k of READ_KEYS) delete process.env[k];
  for (const k of IRRELEVANT_KEYS) delete process.env[k];
  process.env.CLIENT_DIST_DIR = distDir;
  writeBuildInfo(env, buildOverride);
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

async function validate(): Promise<string | null> {
  // The module reads the edition at import time, so load it fresh each run.
  vi.resetModules();
  const mod = await import("../../server/compliance/releasePolicy");
  try {
    mod.validateProductionReleaseConfiguration();
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

describe("validator apart: 2,000 environment permutations", () => {
  beforeEach(() => {
    saved = {};
    for (const k of [...READ_KEYS, ...IRRELEVANT_KEYS]) saved[k] = process.env[k];
  });
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("passes a complete honest public-edition environment and skips outside production", async () => {
    applyEnv(VALID);
    expect(await validate()).toBeNull();
    applyEnv({ ...VALID, NODE_ENV: "staging", PUBLIC_BASE_URL: undefined });
    expect(await validate()).toBeNull();
  });

  it("fails when the bundle disagrees with the server, and when the bundle stamp is missing", async () => {
    for (const [label, override] of BUILD_DEFECTS) {
      applyEnv(VALID, override);
      const msg = await validate();
      expect(msg, `build defect not caught: ${label}`).not.toBeNull();
    }
    applyEnv(VALID);
    fs.rmSync(path.join(distDir, "build-info.json"));
    expect(await validate()).toMatch(/build-info\.json is missing/);
  });

  it("preview posture: runs with outstanding attestations listed, still refuses a lie or the wrong edition", async () => {
    const preview = { ...VALID, RELEASE_POSTURE: "preview", VITE_RELEASE_POSTURE: "preview", PRIVACY_SECURITY_REVIEW_CONFIRMED: "false", INCIDENT_RESPONSE_PLAN_CONFIRMED: undefined };
    applyEnv(preview);
    expect(await validate()).toBeNull();
    vi.resetModules();
    const mod = await import("../../server/compliance/releasePolicy");
    mod.validateProductionReleaseConfiguration();
    expect(mod.releaseBlockers().length).toBeGreaterThanOrEqual(2);
    // A placeholder disclosure is a lie to the public: fatal even in preview.
    applyEnv({ ...preview, LEGAL_BUSINESS_NAME: "replace-with-real-legal-operator-name", VITE_LEGAL_BUSINESS_NAME: "replace-with-real-legal-operator-name" });
    expect(await validate()).toMatch(/preview blocked/);
    // Preview never carries paid subscriptions or the clinical edition.
    applyEnv({ ...preview, ENABLE_PAID_SUBSCRIPTIONS: "true", VITE_ENABLE_PAID_SUBSCRIPTIONS: "true" });
    expect(await validate()).toMatch(/preview blocked/);
    applyEnv({ ...preview, PUBLIC_WELLNESS_MODE: "false", VITE_PUBLIC_WELLNESS_MODE: "false", ENABLE_CLINICAL_TOOLS: "true", VITE_ENABLE_CLINICAL_TOOLS: "true" });
    expect(await validate()).toMatch(/preview blocked/);
  });

  it(`fails on every one of the ${DEFECTS.length} catalogued defects, naming it`, async () => {
    for (const [label, defect] of DEFECTS) {
      applyEnv({ ...VALID, ...defect });
      const msg = await validate();
      expect(msg, `defect not caught: ${label}`).not.toBeNull();
      expect(msg).toMatch(/production release blocked/);
    }
  });

  it("fails on any random mix of defects and passes any amount of irrelevant noise (2,000 runs)", async () => {
    const r = new Rng(rootSeed()).child("validator");
    let withDefect = 0;
    let noiseOnly = 0;
    for (let i = 0; i < 2000; i++) {
      const env: Record<string, string | undefined> = { ...VALID };
      const nDefects = r.bool(0.5) ? 0 : r.int(1, 4);
      const chosen = r.shuffle(DEFECTS).slice(0, nDefects);
      for (const [, d] of chosen) Object.assign(env, d);
      for (let k = 0, n = r.int(0, 5); k < n; k++) env[r.pick(IRRELEVANT_KEYS)] = weirdString(r, 40);
      applyEnv(env);
      const msg = await validate();
      if (nDefects > 0) {
        withDefect += 1;
        expect(msg, `seed=${rootSeed()} run=${i} defects=${chosen.map(c => c[0]).join(" | ")}`).not.toBeNull();
      } else {
        noiseOnly += 1;
        expect(msg, `seed=${rootSeed()} run=${i} noise-only env failed: ${msg}`).toBeNull();
      }
    }
    expect(withDefect + noiseOnly).toBe(2000);
    expect(withDefect).toBeGreaterThan(800);
    expect(noiseOnly).toBeGreaterThan(800);
  }, 300_000);
});
