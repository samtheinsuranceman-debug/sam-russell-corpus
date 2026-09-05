// ============================================================
// Mail transport selection + the two lead emails (acknowledgement, owner alert).
// No network: the SMTP transport is replaced with a stub.
// ============================================================
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { _resetResendForTests, _resetTransportForTests, fromAddress, mailMode, sendMail, smtpOptions } from "./_core/mailer";
import { sendLeadAcknowledgement, sendNewLeadAlert } from "./email";

const saved: Record<string, string | undefined> = {};
const KEYS = ["RESEND_API_KEY", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_SECURE"];
beforeEach(() => { for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; } _resetTransportForTests(null); _resetResendForTests(null); });
afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

const sentViaSmtp: Array<Record<string, unknown>> = [];
function stubSmtp() {
  process.env.SMTP_HOST = "smtp.example.test";
  process.env.SMTP_USER = "sam@example.test";
  process.env.SMTP_PASS = "app-password";
  _resetTransportForTests({ sendMail: async (m: Record<string, unknown>) => { sentViaSmtp.push(m); return { messageId: "x" }; } } as never);
  sentViaSmtp.length = 0;
}

describe("mail transport selection", () => {
  it("prefers Resend, then SMTP, else none", () => {
    expect(mailMode({})).toBe("none");
    expect(mailMode({ SMTP_HOST: "h", SMTP_USER: "u", SMTP_PASS: "p" })).toBe("smtp");
    expect(mailMode({ RESEND_API_KEY: "re_x", SMTP_HOST: "h", SMTP_USER: "u", SMTP_PASS: "p" })).toBe("resend");
    expect(mailMode({ SMTP_HOST: "h" })).toBe("none"); // incomplete SMTP config is not a transport
  });

  it("derives SMTP options with sensible port/TLS defaults", () => {
    expect(smtpOptions({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "u", SMTP_PASS: "p" })).toMatchObject({ host: "smtp.gmail.com", port: 587, secure: false });
    expect(smtpOptions({ SMTP_HOST: "h", SMTP_PORT: "465", SMTP_USER: "u", SMTP_PASS: "p" })).toMatchObject({ port: 465, secure: true });
    expect(smtpOptions({ SMTP_HOST: "h", SMTP_PORT: "2525", SMTP_SECURE: "true", SMTP_USER: "u", SMTP_PASS: "p" })).toMatchObject({ port: 2525, secure: true });
  });

  it("uses the SMTP account as the From address unless SMTP_FROM is given", () => {
    expect(fromAddress({ SMTP_HOST: "h", SMTP_USER: "sam@example.test", SMTP_PASS: "p" })).toBe("sam@example.test");
    expect(fromAddress({ SMTP_HOST: "h", SMTP_USER: "sam@example.test", SMTP_PASS: "p", SMTP_FROM: "RCS <sam@example.test>" })).toBe("RCS <sam@example.test>");
    expect(fromAddress({ RESEND_API_KEY: "re_x" })).toContain("hello@russellcapitalsystems.com");
  });

  it("reports not-sent (never throws) when nothing is configured", async () => {
    const r = await sendMail({ to: "a@b.test", subject: "s", text: "t" });
    expect(r.sent).toBe(false);
    expect(r.reason).toMatch(/RESEND_API_KEY or SMTP_/);
  });

  it("delivers through SMTP when configured", async () => {
    stubSmtp();
    const r = await sendMail({ to: "a@b.test", subject: "Hello", text: "body" });
    expect(r).toEqual({ sent: true, via: "smtp" });
    expect(sentViaSmtp[0]).toMatchObject({ from: "sam@example.test", to: "a@b.test", subject: "Hello", text: "body" });
  });
});

describe("lead emails", () => {
  it("acknowledgement goes out over SMTP and carries the compliance wording", async () => {
    stubSmtp();
    const r = await sendLeadAcknowledgement({ toEmail: "doc@example.test", firstName: "Dana" });
    expect(r.sent).toBe(true);
    const m = sentViaSmtp[0] as { text: string; html: string };
    expect(m.text).toContain("Hi Dana");
    expect(m.text).toMatch(/suitability and compliance with applicable IRS statutes/);
    expect(m.html).not.toMatch(/<script/i);
  });

  it("owner alert names the lead and contact but never figures", async () => {
    stubSmtp();
    const r = await sendNewLeadAlert({ toEmail: "owner@example.test", who: "Dana Doe", contact: "doc@example.test · 555-0100", bestTime: "Mornings", question: "Can you help with my <b>mortgage</b>?", inboxUrl: "https://example.test/portal/leads" });
    expect(r.sent).toBe(true);
    const m = sentViaSmtp[0] as { subject: string; text: string; html: string };
    expect(m.subject).toBe("New homepage lead: Dana Doe");
    expect(m.text).toContain("doc@example.test · 555-0100");
    expect(m.text).toContain("https://example.test/portal/leads");
    expect(m.html).toContain("&lt;b&gt;mortgage&lt;/b&gt;"); // escaped, not rendered
    expect(m.text).not.toMatch(/\$\s?\d|\d+(\.\d+)?%/);
  });

  it("is a silent no-op with no transport (capture never fails because of mail)", async () => {
    const r = await sendNewLeadAlert({ toEmail: "owner@example.test", who: "X", contact: "none" });
    expect(r.sent).toBe(false);
  });
});
