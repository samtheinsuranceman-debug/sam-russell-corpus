import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";

const SECRET = "email-auth-test-secret-0123456789abcdef";

async function boot(mailer: (to: string, subject: string, text: string) => Promise<void>) {
  const { registerEmailAuthRoutes, resetEmailAuthState } = await import("./_core/emailAuth");
  resetEmailAuthState();
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  registerEmailAuthRoutes(app, mailer);
  const server: Server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  const port = (server.address() as { port: number }).port;
  return { base: `http://127.0.0.1:${port}`, close: () => new Promise<void>(r => server.close(() => r())) };
}

describe("email sign-in", () => {
  let close: () => Promise<void> = async () => undefined;
  const sent: string[] = [];

  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", SECRET);
    vi.stubEnv("EMAIL_AUTH_ENABLED", "true");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("MAIL_FROM", "Doctor Buddy <hello@example.com>");
    vi.stubEnv("PUBLIC_BASE_URL", "https://doctorbuddy.example.com");
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    sent.length = 0;
  });
  afterEach(async () => { await close(); vi.unstubAllEnvs(); });

  it("signs, verifies, expires and refuses tampered links", async () => {
    const m = await import("./_core/emailAuth");
    const token = m.signLink({ email: "Sam@Example.com", returnPath: "/finance", issuedAt: Date.now(), jti: "abc" });
    const back = m.verifyLink(token);
    expect(back.email).toBe("sam@example.com");
    expect(back.returnPath).toBe("/finance");
    expect(() => m.verifyLink(`${token}x`)).toThrow(/signature|Invalid/);
    expect(() => m.verifyLink(token, Date.now() + 16 * 60 * 1000)).toThrow(/expired/);
    expect(m.verifyLink(m.signLink({ email: "a@b.co", returnPath: "//evil.example", issuedAt: Date.now(), jti: "z" })).returnPath).toBe("/");
    expect(m.openIdForEmail("a@b.co")).toBe(m.openIdForEmail("A@B.CO".toLowerCase()));
    expect(m.openIdForEmail("a@b.co")).not.toContain("@");
  });

  it("sends a single-use link, refuses replays, and rate-limits an address", async () => {
    const mailer = async (_to: string, _subject: string, text: string) => { sent.push(text); };
    const { base, close: c } = await boot(mailer);
    close = c;
    const post = (body: unknown, ip = "203.0.113.5") => fetch(`${base}/api/auth/email/request`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(body) });

    expect((await post({ email: "not-an-email" })).status).toBe(400);
    const ok = await post({ email: "sam@example.com", returnPath: "/finance" });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ sent: true });
    const link = sent[0].match(/https:\S+/)![0];
    expect(link.startsWith("https://doctorbuddy.example.com/api/auth/email/callback?token=")).toBe(true);
    expect(sent[0]).not.toMatch(/password/i);

    // No database on this host: the callback cannot create the account, so it
    // answers 503, never a cookie for nobody. The link is still consumed.
    const token = new URL(link).searchParams.get("token")!;
    const first = await fetch(`${base}/api/auth/email/callback?token=${encodeURIComponent(token)}`, { redirect: "manual" });
    expect(first.status).toBe(503);
    expect(first.headers.get("set-cookie")).toBeNull();
    const replay = await fetch(`${base}/api/auth/email/callback?token=${encodeURIComponent(token)}`, { redirect: "manual" });
    expect(replay.status).toBe(400);
    expect((await fetch(`${base}/api/auth/email/callback?token=garbage`)).status).toBe(400);

    // Five links per fifteen minutes per address, then 429 with Retry-After.
    for (let i = 0; i < 4; i++) expect((await post({ email: "sam@example.com" })).status).toBe(200);
    const limited = await post({ email: "sam@example.com" });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("900");
    // A different address from a different IP is unaffected.
    expect((await post({ email: "other@example.com" }, "203.0.113.6")).status).toBe(200);
  });

  it("is off, with a clear 503, unless enabled and a mailer is configured", async () => {
    vi.stubEnv("EMAIL_AUTH_ENABLED", "false");
    vi.resetModules();
    const { base, close: c } = await boot(async () => undefined);
    close = c;
    expect((await fetch(`${base}/api/auth/email/request`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status).toBe(503);
    expect((await fetch(`${base}/api/auth/email/callback?token=x`)).status).toBe(503);
  });

  it("answers 502 when the mail provider fails, without leaking why", async () => {
    const { base, close: c } = await boot(async () => { throw new Error("Resend 401 invalid key sk_live_secret"); });
    close = c;
    const res = await fetch(`${base}/api/auth/email/request`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "sam@example.com" }) });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toMatch(/sk_live|401|Resend/);
  });
});
