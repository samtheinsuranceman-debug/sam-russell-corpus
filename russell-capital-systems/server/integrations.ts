// ============================================================
// INTEGRATIONS REGISTRY — every outside platform the site can use, what it
// is for, which environment variables switch it on, and whether it is on
// right now. Values are never exposed; only "configured" booleans.
//
// Two ways a platform is "strung in":
//   runtime  — the server calls it (AI, mail, SMS, data, CRM, billing)
//   client   — a script is loaded in the browser (analytics, chat widget)
//   outbound — it receives the plan ledger's events by webhook (Zapier,
//              Make, n8n, Slack, or any URL) — see eventBus.ts
// ============================================================
export type IntegrationCategory = "ai" | "voice" | "messaging" | "data" | "crm" | "billing" | "automation" | "analytics" | "hosting" | "documents";
export type IntegrationMode = "runtime" | "client" | "outbound";

export type Integration = {
  id: string;
  name: string;
  category: IntegrationCategory;
  mode: IntegrationMode;
  purpose: string;
  /** all of these must be set for the integration to count as configured */
  envKeys: string[];
  /** optional keys that refine behaviour */
  optionalKeys?: string[];
  docs?: string;
  /** what the platform does with it, in one line */
  wiredTo: string;
};

export const INTEGRATIONS: Integration[] = [
  // ── AI team (server/ultraAI.ts) ──
  { id: "anthropic", name: "Claude (Anthropic)", category: "ai", mode: "runtime", purpose: "Lead model: synthesises the team, polishes journeys", envKeys: ["ANTHROPIC_API_KEY"], wiredTo: "ultraAI lead model, Financial Librarian" },
  { id: "openai", name: "ChatGPT (OpenAI)", category: "ai", mode: "runtime", purpose: "Second opinion on every advisor answer", envKeys: ["OPENAI_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "xai", name: "Grok (xAI)", category: "ai", mode: "runtime", purpose: "Second opinion", envKeys: ["XAI_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "gemini", name: "Gemini (Google)", category: "ai", mode: "runtime", purpose: "Second opinion", envKeys: ["GEMINI_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "perplexity", name: "Perplexity", category: "ai", mode: "runtime", purpose: "Web-grounded research voice", envKeys: ["PERPLEXITY_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "openrouter", name: "OpenRouter", category: "ai", mode: "runtime", purpose: "Gateway to models without their own key", envKeys: ["OPENROUTER_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "mistral", name: "Mistral", category: "ai", mode: "runtime", purpose: "Additional voice", envKeys: ["MISTRAL_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "groq", name: "Groq", category: "ai", mode: "runtime", purpose: "Fast additional voice", envKeys: ["GROQ_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "cohere", name: "Cohere", category: "ai", mode: "runtime", purpose: "Additional voice", envKeys: ["COHERE_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "deepseek", name: "DeepSeek", category: "ai", mode: "runtime", purpose: "Additional voice", envKeys: ["DEEPSEEK_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "together", name: "Together AI", category: "ai", mode: "runtime", purpose: "Additional voice", envKeys: ["TOGETHER_API_KEY"], wiredTo: "ultraAI fan-out" },
  { id: "manus", name: "Manus / built-in gateway", category: "ai", mode: "runtime", purpose: "Managed-host model, notifications, heartbeat cron", envKeys: ["BUILT_IN_FORGE_API_KEY", "BUILT_IN_FORGE_API_URL"], wiredTo: "portalAI, notifyOwner, heartbeat" },
  // ── Voice / video ──
  { id: "elevenlabs", name: "ElevenLabs", category: "voice", mode: "runtime", purpose: "The tape recorder's cloned voice", envKeys: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"], wiredTo: "ultra.speak, journey guides read aloud" },
  { id: "heygen", name: "HeyGen", category: "voice", mode: "runtime", purpose: "Video proposals", envKeys: ["HEYGEN_API_KEY"], wiredTo: "videoProposal router" },
  // ── Messaging ──
  { id: "resend", name: "Resend", category: "messaging", mode: "runtime", purpose: "Transactional + marketing email", envKeys: ["RESEND_API_KEY"], optionalKeys: ["MAIL_FROM", "MAIL_REPLY_TO"], wiredTo: "sendMail, follow-ups, reports, lead alerts" },
  { id: "smtp", name: "SMTP (Google Workspace / any mailbox)", category: "messaging", mode: "runtime", purpose: "Email without a verified domain", envKeys: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"], optionalKeys: ["SMTP_PORT", "SMTP_FROM"], wiredTo: "sendMail fallback" },
  { id: "twilio", name: "Twilio SMS", category: "messaging", mode: "runtime", purpose: "Texts to leads and clients, STOP handling", envKeys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], optionalKeys: ["TWILIO_FROM", "TWILIO_MESSAGING_SERVICE_SID"], wiredTo: "sendSms, follow-ups, lead alerts" },
  { id: "sms-webhook", name: "SMS relay (Inkbox / Speko / any)", category: "messaging", mode: "runtime", purpose: "Texts through any relay that accepts {to, body}", envKeys: ["SMS_WEBHOOK_URL"], optionalKeys: ["SMS_WEBHOOK_TOKEN"], wiredTo: "sendSms" },
  { id: "slack", name: "Slack", category: "messaging", mode: "outbound", purpose: "Lead alerts, decisions and status changes into a channel", envKeys: ["SLACK_WEBHOOK_URL"], docs: "https://api.slack.com/messaging/webhooks", wiredTo: "eventBus: status, decision, outcome, note events" },
  { id: "calendly", name: "Calendly", category: "messaging", mode: "client", purpose: "Booking link in follow-ups and templates", envKeys: ["CALENDLY_URL"], wiredTo: "follow-up emails, message templates, public site config" },
  // ── Data ──
  { id: "fred", name: "FRED (St. Louis Fed)", category: "data", mode: "runtime", purpose: "Treasury curve, CPI, mortgage and Fed funds rates", envKeys: ["FRED_API_KEY"], wiredTo: "dataFeeds.benchmarks, Market Data page" },
  { id: "plaid", name: "Plaid", category: "data", mode: "runtime", purpose: "Account aggregation into the Financial Assessment", envKeys: ["PLAID_CLIENT_ID", "PLAID_SECRET"], optionalKeys: ["PLAID_ENV"], wiredTo: "assessment import (next build)" },
  // ── CRM ──
  { id: "hubspot", name: "HubSpot", category: "crm", mode: "runtime", purpose: "Every lead and client becomes a contact; status stays in step", envKeys: ["HUBSPOT_ACCESS_TOKEN"], docs: "https://developers.hubspot.com/docs/api/private-apps", wiredTo: "leads.capture → contact upsert; clients carry hubspotContactId" },
  // ── Billing ──
  { id: "stripe", name: "Stripe", category: "billing", mode: "runtime", purpose: "Client billing and subscriptions", envKeys: ["STRIPE_SECRET_KEY"], optionalKeys: ["STRIPE_WEBHOOK_SECRET"], wiredTo: "billing router" },
  // ── Automation (receive the ledger's events) ──
  { id: "zapier", name: "Zapier", category: "automation", mode: "outbound", purpose: "Every ledger event to 9,000 apps", envKeys: ["ZAPIER_HOOK_URL"], docs: "https://zapier.com/apps/webhook/integrations", wiredTo: "eventBus (Catch Hook)" },
  { id: "make", name: "Make", category: "automation", mode: "outbound", purpose: "Every ledger event into Make scenarios", envKeys: ["MAKE_HOOK_URL"], wiredTo: "eventBus (custom webhook)" },
  { id: "n8n", name: "n8n", category: "automation", mode: "outbound", purpose: "Every ledger event into self-hosted workflows", envKeys: ["N8N_HOOK_URL"], wiredTo: "eventBus (webhook node)" },
  { id: "webhooks", name: "Any webhook URL(s)", category: "automation", mode: "outbound", purpose: "Comma-separated list of extra receivers", envKeys: ["EVENT_WEBHOOK_URLS"], optionalKeys: ["EVENT_WEBHOOK_SECRET", "EVENT_WEBHOOK_KINDS", "EVENT_WEBHOOK_INCLUDE_FACTS"], wiredTo: "eventBus" },
  // ── Analytics / observability (browser + server) ──
  { id: "posthog", name: "PostHog", category: "analytics", mode: "client", purpose: "Which of the 216 pages clients use and where they drop", envKeys: ["POSTHOG_KEY"], optionalKeys: ["POSTHOG_HOST"], wiredTo: "AnalyticsLoader in the portal shell" },
  { id: "ga4", name: "Google Analytics 4", category: "analytics", mode: "client", purpose: "Traffic on the public site", envKeys: ["GA_MEASUREMENT_ID"], wiredTo: "AnalyticsLoader" },
  { id: "sentry", name: "Sentry", category: "analytics", mode: "client", purpose: "Errors in the browser bundle", envKeys: ["SENTRY_LOADER_URL"], docs: "https://docs.sentry.io/platforms/javascript/install/loader/", wiredTo: "AnalyticsLoader (loader script)" },
  { id: "intercom", name: "Intercom", category: "analytics", mode: "client", purpose: "Client support chat in the portal", envKeys: ["INTERCOM_APP_ID"], wiredTo: "AnalyticsLoader (messenger)" },
  // ── Hosting / infra ──
  { id: "cloudflare", name: "Cloudflare", category: "hosting", mode: "runtime", purpose: "DNS and edge", envKeys: ["CLOUDFLARE_API_TOKEN"], wiredTo: "domainRedirect helpers" },
  { id: "github", name: "GitHub", category: "hosting", mode: "runtime", purpose: "Source, Pages homepage, deploys", envKeys: ["GITHUB_TOKEN"], wiredTo: "release tooling" },
  { id: "railway", name: "Railway", category: "hosting", mode: "runtime", purpose: "The full app and its MySQL", envKeys: ["RAILWAY_PUBLIC_DOMAIN"], wiredTo: "PUBLIC_BASE_URL on the host" },
];

export function isConfigured(i: Integration, env: NodeJS.ProcessEnv = process.env): boolean {
  return i.envKeys.every((k) => Boolean(env[k]));
}

export type IntegrationStatus = Integration & { configured: boolean; missing: string[] };

export function integrationStatus(env: NodeJS.ProcessEnv = process.env): IntegrationStatus[] {
  return INTEGRATIONS.map((i) => ({ ...i, configured: isConfigured(i, env), missing: i.envKeys.filter((k) => !env[k]) }));
}

/** What the browser is allowed to know: public ids only, never secrets. */
export function publicSiteConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    posthogKey: env.POSTHOG_KEY || null,
    posthogHost: env.POSTHOG_HOST || "https://us.i.posthog.com",
    gaMeasurementId: env.GA_MEASUREMENT_ID || null,
    sentryLoaderUrl: env.SENTRY_LOADER_URL || null,
    intercomAppId: env.INTERCOM_APP_ID || null,
    calendlyUrl: env.CALENDLY_URL || null,
    baseUrl: env.PUBLIC_BASE_URL || null,
  };
}
