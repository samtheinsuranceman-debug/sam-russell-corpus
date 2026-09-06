// ============================================================
// Messaging + automation: SMS transport rules, mail deliverability headers,
// the outbound log, the lead follow-up sequence, and FRED parsing — with the
// database and the network mocked.
// ============================================================
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  smsOptOuts: new Set<string>(),
  emailOptOuts: new Set<string>(),
  log: [] as Array<Record<string, unknown>>,
  followups: [] as Array<{ id: number; leadId: number; step: string; channel: "email" | "sms"; scheduledFor: Date; status: string; reason?: string; sentAt?: Date | null }>,
  leads: new Map<number, Record<string, unknown>>(),
  market: new Map<string, { value: number; asOf: string }>(),
};
vi.mock("./messagingDb", () => ({
  isSmsOptedOut: vi.fn(async (p: string) => state.smsOptOuts.has(p)),
  recordSmsOptOut: vi.fn(async (p: string) => { state.smsOptOuts.add(p); }),
  clearSmsOptOut: vi.fn(async (p: string) => { state.smsOptOuts.delete(p); }),
  isEmailOptedOut: vi.fn(async (e: string) => state.emailOptOuts.has(e)),
  recordEmailOptOut: vi.fn(async (e: string) => { state.emailOptOuts.add(e); }),
  logOutboundMessage: vi.fn(async (entry: Record<string, unknown>) => { state.log.push(entry); return state.log.length; }),
  listMessagesForClient: vi.fn(async () => []),
  listMessagesForLead: vi.fn(async () => []),
  scheduleFollowups: vi.fn(async (leadId: number, plan: Array<{ step: string; channel: "email" | "sms"; scheduledFor: Date }>) => {
    if (state.followups.some((f) => f.leadId === leadId)) return 0;
    for (const p of plan) state.followups.push({ id: state.followups.length + 1, leadId, ...p, status: "pending" });
    return plan.length;
  }),
  dueFollowups: vi.fn(async (now: Date) => state.followups.filter((f) => f.status === "pending" && f.scheduledFor <= now)),
  settleFollowup: vi.fn(async (id: number, status: string, reason?: string) => {
    const f = state.followups.find((x) => x.id === id);
    if (!f || f.status !== "pending") return false;
    f.status = status; f.reason = reason; f.sentAt = status === "sent" ? new Date() : null;
    return true;
  }),
  cancelFollowupsForLead: vi.fn(async (leadId: number, reason: string) => { for (const f of state.followups) if (f.leadId === leadId && f.status === "pending") { f.status = "cancelled"; f.reason = reason; } }),
  listFollowupsForLead: vi.fn(async (leadId: number) => state.followups.filter((f) => f.leadId === leadId)),
  listFollowupsForLeads: vi.fn(async () => []),
  upsertMarketPoint: vi.fn(async (p: { series: string; value: number; asOf: string }) => { state.market.set(p.series, { value: p.value, asOf: p.asOf }); }),
  getMarketPoints: vi.fn(async (series: string[]) => series.flatMap((s) => { const m = state.market.get(s); return m ? [{ series: s, value: m.value, asOf: m.asOf, source: "fred", fetchedAt: new Date() }] : []; })),
}));
vi.mock("./leadsDb", () => ({ getLeadById: vi.fn(async (id: number) => state.leads.get(id) ?? null) }));
vi.mock("./db", () => ({ logClientActivity: vi.fn(async () => null), getDb: vi.fn(async () => null) }));

const smtpSent: Array<Record<string, unknown>> = [];
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: async (m: Record<string, unknown>) => { smtpSent.push(m); return {}; } }) } }));

import { classifyInbound, normalizePhone, sendSms, smsBody, smsMode } from "./_core/sms";
import { _resetTransportForTests, fromAddress, sendMail, senderDomain, unsubscribeHeaders, unsubscribeToken, unsubscribeUrl, verifyUnsubscribeToken } from "./_core/mailer";
import { COMPLIANCE_LINE, deliver, MESSAGE_TEMPLATES, renderTemplate, textToHtml } from "./messaging";
import { FOLLOWUP_SEQUENCE, followupContent, planFollowupsFor, runDueFollowups, scheduleLeadFollowups } from "./followups";
import { _clearFredMemoForTests, _setFetchForTests, fetchFredObservations, getBenchmark, getCpiFromFred } from "./_core/fred";

const fetchCalls: Array<{ url: string; body?: string }> = [];
const realFetch = globalThis.fetch;

beforeEach(() => {
  state.smsOptOuts.clear(); state.emailOptOuts.clear(); state.log.length = 0; state.followups.length = 0; state.leads.clear(); state.market.clear();
  smtpSent.length = 0; fetchCalls.length = 0; _resetTransportForTests(null); _clearFredMemoForTests(); _setFetchForTests(null);
  for (const k of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM", "TWILIO_MESSAGING_SERVICE_SID", "SMS_WEBHOOK_URL", "SMS_WEBHOOK_TOKEN", "RESEND_API_KEY", "SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MAIL_REPLY_TO", "PUBLIC_BASE_URL", "FRED_API_KEY", "FOLLOWUPS_DISABLED"]) delete process.env[k];
  globalThis.fetch = realFetch;
});

function mockFetch(handler: (url: string, init?: RequestInit) => { status?: number; json?: unknown }) {
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    fetchCalls.push({ url: u, body: typeof init?.body === "string" ? init.body : undefined });
    const r = handler(u, init);
    return { ok: (r.status ?? 200) < 300, status: r.status ?? 200, json: async () => r.json ?? {}, text: async () => JSON.stringify(r.json ?? {}) } as Response;
  }) as typeof fetch;
}

describe("SMS transport", () => {
  it("normalises US numbers to E.164 and rejects non-numbers", () => {
    expect(normalizePhone("(512) 555-0100")).toBe("+15125550100");
    expect(normalizePhone("1 512 555 0100")).toBe("+15125550100");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("call me")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
  it("classifies STOP/START/HELP replies", () => {
    expect(classifyInbound("STOP")).toBe("stop");
    expect(classifyInbound(" unsubscribe. ")).toBe("stop");
    expect(classifyInbound("Start")).toBe("start");
    expect(classifyInbound("help")).toBe("help");
    expect(classifyInbound("Can we talk Tuesday?")).toBe("message");
  });
  it("adds the opt-out footer to marketing texts only", () => {
    expect(smsBody("Hi there", "marketing")).toMatch(/Reply STOP to opt out\.$/);
    expect(smsBody("Hi there", "transactional")).toBe("Hi there");
  });
  it("reports no transport when nothing is configured", async () => {
    expect(smsMode()).toBe("none");
    const r = await sendSms({ to: "5125550100", body: "x" });
    expect(r.sent).toBe(false);
    expect(r.reason).toMatch(/No SMS transport/);
  });
  it("sends through Twilio with basic auth and a From number", async () => {
    Object.assign(process.env, { TWILIO_ACCOUNT_SID: "ACtest", TWILIO_AUTH_TOKEN: "tok", TWILIO_FROM: "+15125550000" });
    mockFetch(() => ({ status: 201, json: { sid: "SM1" } }));
    const r = await sendSms({ to: "512-555-0100", body: "Hello" });
    expect(r).toMatchObject({ sent: true, via: "twilio", to: "+15125550100" });
    expect(fetchCalls[0]!.url).toContain("/Accounts/ACtest/Messages.json");
    expect(fetchCalls[0]!.body).toContain("To=%2B15125550100");
    expect(fetchCalls[0]!.body).toContain("From=%2B15125550000");
  });
  it("never texts a number that replied STOP", async () => {
    Object.assign(process.env, { SMS_WEBHOOK_URL: "https://relay.example.test/sms" });
    state.smsOptOuts.add("+15125550100");
    mockFetch(() => ({}));
    const r = await sendSms({ to: "5125550100", body: "Hello" });
    expect(r.sent).toBe(false);
    expect(r.reason).toMatch(/opted out/);
    expect(fetchCalls).toHaveLength(0);
  });
  it("relays through a webhook with a bearer token", async () => {
    Object.assign(process.env, { SMS_WEBHOOK_URL: "https://relay.example.test/sms", SMS_WEBHOOK_TOKEN: "s3cret" });
    mockFetch(() => ({}));
    const r = await sendSms({ to: "5125550100", body: "Hello", category: "marketing" });
    expect(r).toMatchObject({ sent: true, via: "webhook" });
    expect(JSON.parse(fetchCalls[0]!.body!)).toEqual({ to: "+15125550100", body: "Hello\nReply STOP to opt out." });
  });
});

describe("mail deliverability", () => {
  it("signs and verifies unsubscribe tokens; the link carries the address", () => {
    process.env.JWT_SECRET = "abc";
    const t = unsubscribeToken("Doc@Example.test");
    expect(verifyUnsubscribeToken("doc@example.test", t)).toBe(true);
    expect(verifyUnsubscribeToken("doc@example.test", "nope")).toBe(false);
    process.env.PUBLIC_BASE_URL = "https://rcs.example.test/";
    expect(unsubscribeUrl("doc@example.test")).toBe(`https://rcs.example.test/api/mail/unsubscribe?e=doc%40example.test&t=${t}`);
    const h = unsubscribeHeaders("doc@example.test");
    expect(h["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(h["List-Unsubscribe"]).toContain("<https://rcs.example.test/api/mail/unsubscribe?e=doc%40example.test");
    expect(h["List-Unsubscribe"]).toContain("mailto:");
  });
  it("uses MAIL_FROM for the sender domain", () => {
    process.env.MAIL_FROM = "Sam <sam@russellcapitalsystems.com>";
    expect(fromAddress()).toBe("Sam <sam@russellcapitalsystems.com>");
    expect(senderDomain()).toBe("russellcapitalsystems.com");
  });
  it("adds one-click unsubscribe headers and a footer to marketing mail over SMTP, and Reply-To", async () => {
    Object.assign(process.env, { SMTP_HOST: "smtp.example.test", SMTP_USER: "u", SMTP_PASS: "p", MAIL_REPLY_TO: "sam@russellcapitalsystems.com" });
    const r = await sendMail({ to: "doc@example.test", subject: "Hi", text: "Body", html: "<html><body><p>Body</p></body></html>", category: "marketing" });
    expect(r).toEqual({ sent: true, via: "smtp" });
    const m = smtpSent[0]!;
    expect((m.headers as Record<string, string>)["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(m.replyTo).toBe("sam@russellcapitalsystems.com");
    expect(String(m.text)).toContain("Unsubscribe: ");
    expect(String(m.html)).toContain("Unsubscribe</a>");
  });
  it("keeps transactional mail free of unsubscribe headers and never sends marketing to an opted-out address", async () => {
    Object.assign(process.env, { SMTP_HOST: "smtp.example.test", SMTP_USER: "u", SMTP_PASS: "p" });
    await sendMail({ to: "doc@example.test", subject: "Your report", text: "Attached" });
    expect((smtpSent[0]!.headers as Record<string, string>)["List-Unsubscribe"]).toBeUndefined();
    state.emailOptOuts.add("doc@example.test");
    const r = await sendMail({ to: "doc@example.test", subject: "Follow-up", text: "x", category: "marketing" });
    expect(r).toMatchObject({ sent: false, suppressed: true });
    expect(smtpSent).toHaveLength(1);
  });
});

describe("deliver() and templates", () => {
  it("logs every send with its outcome and appends the compliance line to email", async () => {
    Object.assign(process.env, { SMTP_HOST: "smtp.example.test", SMTP_USER: "u", SMTP_PASS: "p" });
    const r = await deliver({ channel: "email", to: "doc@example.test", subject: "Hello", body: "Line one\n\nLine two https://example.test/p", clientId: 3, workspaceId: 9, userId: 1 });
    expect(r.sent).toBe(true);
    expect(state.log[0]).toMatchObject({ channel: "email", status: "sent", via: "smtp", clientId: 3, workspaceId: 9, toAddress: "doc@example.test" });
    expect(String(smtpSent[0]!.text)).toContain(COMPLIANCE_LINE);
    expect(String(smtpSent[0]!.html)).toContain('<a href="https://example.test/p"');
    const f = await deliver({ channel: "sms", to: "5125550100", body: "Hi" });
    expect(f.sent).toBe(false);
    expect(state.log[1]).toMatchObject({ channel: "sms", status: "failed" });
  });
  it("renders every template for both channels without figures and with the portal link", () => {
    for (const t of MESSAGE_TEMPLATES) {
      const e = renderTemplate(t.id, "email", { firstName: "Dana", advisorName: "Sam", baseUrl: "https://rcs.test" })!;
      const s = renderTemplate(t.id, "sms", { firstName: "Dana", advisorName: "Sam", baseUrl: "https://rcs.test" })!;
      expect(e.body).toContain("Dana");
      expect(s.body).toContain("Dana");
      expect(e.body + s.body).not.toMatch(/\$\d/);
      expect(s.body.length).toBeLessThan(320);
    }
    expect(renderTemplate("journey_ready", "sms", {})!.body).toContain("/portal/my-journey");
    expect(renderTemplate("nope", "sms", {})).toBeNull();
    expect(textToHtml("a & b")).toContain("a &amp; b");
  });
});

describe("lead follow-up sequence", () => {
  const lead = { id: 5, firstName: "Dana", email: "dana@example.test", phone: "5125550100", consentedAt: new Date("2026-09-06T12:00:00Z"), status: "new" };
  it("plans texts only with a phone, emails only with an address, nothing without consent", () => {
    const now = new Date("2026-09-06T12:00:00Z");
    const full = planFollowupsFor(lead, now);
    expect(full.map((p) => p.step)).toEqual(FOLLOWUP_SEQUENCE.map((s) => s.step));
    expect(full[0]!.scheduledFor.toISOString()).toBe("2026-09-06T13:00:00.000Z");
    expect(planFollowupsFor({ ...lead, phone: null }, now).every((p) => p.channel === "email")).toBe(true);
    expect(planFollowupsFor({ ...lead, consentedAt: null }, now)).toEqual([]);
  });
  it("writes figure-free content for every step", () => {
    for (const s of FOLLOWUP_SEQUENCE) {
      const c = followupContent(s.step, lead, "https://rcs.test");
      expect(c.body).toContain("Dana");
      expect(c.body).not.toMatch(/\$\d|\d+%/);
      if (s.channel === "email") expect(c.subject.length).toBeGreaterThan(5);
    }
  });
  it("sends due steps, skips once the lead is contacted, and never double-sends", async () => {
    Object.assign(process.env, { SMTP_HOST: "smtp.example.test", SMTP_USER: "u", SMTP_PASS: "p" });
    state.leads.set(5, lead);
    const t0 = new Date("2026-09-06T12:00:00Z");
    expect(await scheduleLeadFollowups(lead, t0)).toBe(5);
    expect(await scheduleLeadFollowups(lead, t0)).toBe(0);
    // an hour later: only the text is due, and there is no SMS transport → failed, not sent
    let s = await runDueFollowups(new Date("2026-09-06T13:30:00Z"));
    expect(s).toEqual({ checked: 1, sent: 0, skipped: 0, failed: 1 });
    // day 1: the email goes out as marketing (unsubscribe headers) and is logged against the lead
    s = await runDueFollowups(new Date("2026-09-07T13:00:00Z"));
    expect(s).toEqual({ checked: 1, sent: 1, skipped: 0, failed: 0 });
    expect(smtpSent).toHaveLength(1);
    expect((smtpSent[0]!.headers as Record<string, string>)["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(state.log.at(-1)).toMatchObject({ leadId: 5, template: "email_day1", status: "sent", category: "marketing" });
    // the advisor marks the lead contacted: the rest is skipped, nothing more is sent
    state.leads.set(5, { ...lead, status: "contacted" });
    s = await runDueFollowups(new Date("2026-09-20T00:00:00Z"));
    expect(s.sent).toBe(0);
    expect(s.skipped).toBe(3);
    expect(smtpSent).toHaveLength(1);
    expect(state.followups.every((f) => f.status !== "pending")).toBe(true);
  });
  it("does nothing when FOLLOWUPS_DISABLED is set", async () => {
    process.env.FOLLOWUPS_DISABLED = "1";
    expect(await scheduleLeadFollowups(lead)).toBe(0);
    expect(await runDueFollowups()).toEqual({ checked: 0, sent: 0, skipped: 0, failed: 0 });
  });
});

describe("FRED benchmarks", () => {
  it("parses observations, drops blanks, and reports live then cached then unavailable", async () => {
    process.env.FRED_API_KEY = "k";
    _setFetchForTests(async (url) => ({ ok: true, status: 200, json: async () => ({ observations: [{ date: "2026-09-04", value: "." }, { date: "2026-09-03", value: "4.12" }, { date: "2026-09-02", value: "4.10" }] }) }));
    expect(await fetchFredObservations("DGS10", 2)).toEqual([{ date: "2026-09-03", value: 4.12 }, { date: "2026-09-02", value: 4.1 }]);
    const live = await getBenchmark("DGS10");
    expect(live).toMatchObject({ series: "DGS10", value: 4.12, asOf: "2026-09-03", source: "live", unit: "%" });
    expect(state.market.get("DGS10")).toEqual({ value: 4.12, asOf: "2026-09-03" });
    // memoised on the second call
    expect((await getBenchmark("DGS10")).source).toBe("cached");
    // feed down, memo cleared → the stored last-good value, never a made-up one
    _clearFredMemoForTests();
    _setFetchForTests(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    expect(await getBenchmark("DGS10")).toMatchObject({ value: 4.12, source: "cached" });
    expect((await getBenchmark("FEDFUNDS")).source).toBe("unavailable");
  });
  it("computes annual and monthly CPI rates from 13 months of index values", async () => {
    process.env.FRED_API_KEY = "k";
    const obs = Array.from({ length: 13 }, (_, i) => ({ date: `2026-${String(9 - (i % 9) || 12).padStart(2, "0")}-01`, value: String(320 - i) }));
    _setFetchForTests(async (url) => ({ ok: true, status: 200, json: async () => ({ observations: url.includes("CPILFESL") ? [] : obs }) }));
    const cpi = await getCpiFromFred();
    expect(cpi).toMatchObject({ index: 320, annualRate: Number((((320 / 308) - 1) * 100).toFixed(2)), monthlyRate: Number((((320 / 319) - 1) * 100).toFixed(2)), coreAnnualRate: null });
  });
  it("returns nothing without a key", async () => {
    expect(await fetchFredObservations("DGS10")).toEqual([]);
    expect(await getCpiFromFred()).toBeNull();
    expect((await getBenchmark("DGS10")).source).toBe("unavailable");
  });
});
