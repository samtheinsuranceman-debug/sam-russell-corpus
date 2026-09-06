// ============================================================
// Integrations registry, the event bus (ledger → Zapier/Make/n8n/Slack), the
// public site config, and the HubSpot upsert — network mocked.
// ============================================================
import { beforeEach, describe, expect, it, vi } from "vitest";
import { INTEGRATIONS, integrationStatus, isConfigured, publicSiteConfig } from "./integrations";
import { allowedKinds, fanOut, signBody, slackText, toBusEvent, webhookTargets, _setFetchForTests as setBusFetch } from "./eventBus";
import { upsertContact, hubspotConfigured, _setFetchForTests as setHsFetch } from "./_core/hubspot";

const calls: Array<{ url: string; body: string; headers: Record<string, string> }> = [];
function mockFetch(status = 200, json: unknown = {}) {
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: String(init?.body ?? ""), headers: (init?.headers ?? {}) as Record<string, string> });
    return { ok: status < 300, status, json: async () => json } as Response;
  }) as typeof fetch;
  setBusFetch(f); setHsFetch(f);
}
beforeEach(() => { calls.length = 0; setBusFetch(null); setHsFetch(null); });

describe("integrations registry", () => {
  it("knows every platform by env keys and never leaks values", () => {
    expect(INTEGRATIONS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(INTEGRATIONS.map((i) => i.id)).size).toBe(INTEGRATIONS.length);
    const env = { ANTHROPIC_API_KEY: "sk-secret", ZAPIER_HOOK_URL: "https://hooks.zapier.com/x", ELEVENLABS_API_KEY: "k" } as NodeJS.ProcessEnv;
    const st = integrationStatus(env);
    expect(st.find((i) => i.id === "anthropic")!.configured).toBe(true);
    expect(st.find((i) => i.id === "zapier")!.configured).toBe(true);
    const el = st.find((i) => i.id === "elevenlabs")!;
    expect(el.configured).toBe(false);
    expect(el.missing).toEqual(["ELEVENLABS_VOICE_ID"]);
    expect(JSON.stringify(st)).not.toContain("sk-secret");
    expect(isConfigured(INTEGRATIONS.find((i) => i.id === "twilio")!, { TWILIO_ACCOUNT_SID: "a", TWILIO_AUTH_TOKEN: "b" } as NodeJS.ProcessEnv)).toBe(true);
  });
  it("exposes only public ids to the browser", () => {
    const c = publicSiteConfig({ POSTHOG_KEY: "phc_1", GA_MEASUREMENT_ID: "G-1", CALENDLY_URL: "https://calendly.com/sam", ANTHROPIC_API_KEY: "sk" } as NodeJS.ProcessEnv);
    expect(c).toMatchObject({ posthogKey: "phc_1", gaMeasurementId: "G-1", calendlyUrl: "https://calendly.com/sam", sentryLoaderUrl: null, intercomAppId: null });
    expect(JSON.stringify(c)).not.toContain("sk");
  });
});

describe("event bus", () => {
  const env = { ZAPIER_HOOK_URL: "https://hooks.zapier.com/a", MAKE_HOOK_URL: "https://hook.make.com/b", EVENT_WEBHOOK_URLS: "https://x.test/1, https://x.test/2", EVENT_WEBHOOK_SECRET: "s3cret", SLACK_WEBHOOK_URL: "https://hooks.slack.com/z", PUBLIC_BASE_URL: "https://rcs.test" };
  it("lists targets and default kinds, excluding facts unless opted in", () => {
    expect(webhookTargets(env).map((t) => t.name)).toEqual(["zapier", "make", "webhook", "webhook"]);
    expect(allowedKinds(env).has("fact")).toBe(false);
    expect(allowedKinds({ ...env, EVENT_WEBHOOK_INCLUDE_FACTS: "1" }).has("fact")).toBe(true);
    expect(Array.from(allowedKinds({ ...env, EVENT_WEBHOOK_KINDS: "status,decision" }))).toEqual(["status", "decision"]);
  });
  it("delivers a signed JSON event to every receiver and a short message to Slack", async () => {
    mockFetch();
    const r = await fanOut([
      { kind: "status", source: "client", key: "lead.captured", label: "Homepage estimate", summary: "Lead captured", leadId: 5, occurredAt: new Date("2026-09-06T12:00:00Z") },
      { kind: "fact", source: "client", key: "income.w2Income", summary: "W-2 set to 650,000", value: 650000, userId: 1 },
    ], env);
    // status → 4 webhooks + slack; fact → nothing (not opted in)
    expect(r).toEqual({ attempted: 5, delivered: 5 });
    const zap = calls.find((c) => c.url === env.ZAPIER_HOOK_URL)!;
    const body = JSON.parse(zap.body);
    expect(body).toMatchObject({ event: "plan.ledger", kind: "status", key: "lead.captured", subject: { leadId: 5 }, site: "https://rcs.test" });
    expect(zap.headers["x-rcs-signature"]).toBe(signBody(zap.body, "s3cret"));
    const slack = calls.find((c) => c.url === env.SLACK_WEBHOOK_URL)!;
    expect(JSON.parse(slack.body).text).toContain("*status* · Lead captured");
    expect(calls.some((c) => c.body.includes("650000"))).toBe(false);
  });
  it("is silent with nothing configured and survives a dead receiver", async () => {
    expect(await fanOut([{ kind: "status", source: "system", summary: "x" }], {})).toEqual({ attempted: 0, delivered: 0 });
    mockFetch(500);
    expect(await fanOut([{ kind: "decision", source: "advisor", summary: "y" }], { ZAPIER_HOOK_URL: "https://hooks.zapier.com/a" })).toEqual({ attempted: 1, delivered: 0 });
  });
  it("formats the Slack line with the subject and time", () => {
    const t = slackText(toBusEvent({ kind: "decision", source: "advisor", summary: "Start conversions", actorName: "Sam", clientId: 3, occurredAt: new Date("2026-09-06T12:00:00Z") }, {}));
    expect(t).toContain("*decision* · Start conversions");
    expect(t).toContain("client #3 · advisor · Sam");
  });
});

describe("HubSpot upsert", () => {
  it("is off without a token", async () => {
    expect(hubspotConfigured({} as NodeJS.ProcessEnv)).toBe(false);
    expect((await upsertContact({ email: "a@b.test" }, {} as NodeJS.ProcessEnv)).ok).toBe(false);
  });
  it("creates a contact, and updates it when HubSpot reports the email already exists", async () => {
    mockFetch(201, { id: "101" });
    const r = await upsertContact({ email: "Doc@Example.test", firstname: "Dana", phone: "5125550100", lifecyclestage: "lead" }, { HUBSPOT_ACCESS_TOKEN: "pat" } as NodeJS.ProcessEnv);
    expect(r).toEqual({ ok: true, id: "101" });
    expect(JSON.parse(calls[0]!.body).properties).toMatchObject({ email: "doc@example.test", firstname: "Dana", lifecyclestage: "lead" });
    expect(calls[0]!.headers.authorization).toBe("Bearer pat");
    calls.length = 0;
    let n = 0;
    const f = (async (url: string | URL | Request, init?: RequestInit) => {
      n += 1; calls.push({ url: String(url), body: String(init?.body ?? ""), headers: {} });
      if (n === 1) return { ok: false, status: 409, json: async () => ({ message: "Contact already exists. Existing ID: 777" }) } as Response;
      return { ok: true, status: 200, json: async () => ({ id: "777" }) } as Response;
    }) as typeof fetch;
    setHsFetch(f);
    const u = await upsertContact({ email: "doc@example.test", lastname: "Doe" }, { HUBSPOT_ACCESS_TOKEN: "pat" } as NodeJS.ProcessEnv);
    expect(u).toEqual({ ok: true, id: "777" });
    expect(calls[1]!.url).toContain("/contacts/777");
  });
});
