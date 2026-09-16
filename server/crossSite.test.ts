import { describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { allowedOrigins, isCrossSiteRequest, parseSessionHeader, registerCrossSite } from "./_core/crossSite";

async function boot() {
  const app = express();
  app.set("trust proxy", true);
  registerCrossSite(app);
  app.use(express.json());
  app.get("/api/whoami", (req, res) => res.json({ cookie: req.headers.cookie ?? null }));
  app.post("/api/login", (req, res) => {
    res.cookie("rc_session", "tok123", { httpOnly: true, sameSite: "lax", path: "/" });
    res.cookie("rc_trial_expires", "2027-01-01", { sameSite: "lax", path: "/" });
    res.json({ ok: true });
  });
  app.post("/api/logout", (_req, res) => { res.clearCookie("rc_session", { path: "/" }); res.json({ ok: true }); });
  const server: Server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  const port = (server.address() as { port: number }).port;
  return { base: `http://127.0.0.1:${port}`, close: () => new Promise<void>(r => server.close(() => r())) };
}

const FRONT = "https://russellcapitalsystems.com";

describe("cross-site front door", () => {
  it("knows its origins and parses the bridge header defensively", () => {
    expect(allowedOrigins({}).has(FRONT)).toBe(true);
    expect(allowedOrigins({ CORS_ORIGINS: "https://a.example/, https://b.example" }).has("https://a.example")).toBe(true);
    // A value that would decode to a ';' could corrupt the Cookie header, so it is dropped on purpose.
    expect(parseSessionHeader("a=1; b=%3Dx%3B; bad; =nope; c=ok")).toEqual([["a", "1"], ["c", "ok"]]);
    expect(parseSessionHeader("rc_session=eyJhbGciOi.abc%3D.def")).toEqual([["rc_session", "eyJhbGciOi.abc=.def"]]);
    expect(parseSessionHeader("x".repeat(9000))).toEqual([]);
    expect(parseSessionHeader(null)).toEqual([]);
    const fake = { headers: { origin: FRONT, host: "api.example", "x-forwarded-proto": "https" }, protocol: "https", get: (h: string) => (h.toLowerCase() === "host" ? "api.example" : undefined) } as unknown as Parameters<typeof isCrossSiteRequest>[0];
    expect(isCrossSiteRequest(fake)).toBe(true);
  });

  it("answers preflight, mirrors cookies into the bridge header, and reads them back", async () => {
    const { base, close } = await boot();
    try {
      const pre = await fetch(`${base}/api/login`, { method: "OPTIONS", headers: { origin: FRONT, "access-control-request-method": "POST", "x-forwarded-proto": "https", host: "api.example" } });
      expect(pre.status).toBe(204);
      expect(pre.headers.get("access-control-allow-origin")).toBe(FRONT);
      expect(pre.headers.get("access-control-allow-credentials")).toBe("true");
      expect(pre.headers.get("access-control-allow-headers")).toMatch(/x-session/);

      const login = await fetch(`${base}/api/login`, { method: "POST", headers: { origin: FRONT, "x-forwarded-proto": "https", host: "api.example", "content-type": "application/json" }, body: "{}" });
      expect(login.status).toBe(200);
      const setCookie = login.headers.get("set-cookie") ?? "";
      expect(setCookie).toMatch(/SameSite=None/);
      expect(setCookie).toMatch(/Secure/);
      const bridge = login.headers.get("x-set-session") ?? "";
      expect(bridge).toContain("rc_session=tok123");
      expect(bridge).toContain("rc_trial_expires=2027-01-01");
      expect(login.headers.get("access-control-expose-headers")).toMatch(/x-set-session/);

      const who = await fetch(`${base}/api/whoami`, { headers: { origin: FRONT, "x-forwarded-proto": "https", host: "api.example", "x-session": bridge } });
      expect((await who.json()).cookie).toContain("rc_session=tok123");

      const viaQuery = await fetch(`${base}/api/whoami?_session=${encodeURIComponent("rc_session=tok123")}`);
      expect((await viaQuery.json()).cookie).toBe("rc_session=tok123");

      const out = await fetch(`${base}/api/logout`, { method: "POST", headers: { origin: FRONT, "x-forwarded-proto": "https", host: "api.example" } });
      expect(out.headers.get("x-clear-session")).toBe("rc_session");
    } finally { await close(); }
  });

  it("stays inert for same-origin requests and refuses foreign state changes", async () => {
    const { base, close } = await boot();
    try {
      const same = await fetch(`${base}/api/login`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      expect(same.headers.get("access-control-allow-origin")).toBeNull();
      expect(same.headers.get("x-set-session")).toBeNull();
      expect(same.headers.get("set-cookie") ?? "").toMatch(/SameSite=Lax/);

      const evil = await fetch(`${base}/api/login`, { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}" });
      expect(evil.status).toBe(403);
      const evilGet = await fetch(`${base}/api/whoami`, { headers: { origin: "https://evil.example" } });
      expect(evilGet.status).toBe(200);
      expect(evilGet.headers.get("access-control-allow-origin")).toBeNull();
    } finally { await close(); }
  });
});
