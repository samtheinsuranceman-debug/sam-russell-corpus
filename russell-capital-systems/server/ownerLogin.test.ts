// ============================================================
// Self-hosted owner sign-in (server/_core/ownerLogin.ts).
// No real credentials appear here: the test mints a random password and hash.
// ============================================================
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import express from "express";
import type { Server } from "node:http";

const TEST_EMAIL = "owner@example.test";
const TEST_PASSWORD = randomBytes(18).toString("base64url");
let TEST_HASH = "";

const envState = {
  appId: "russell-capital-systems",
  cookieSecret: "test-secret-".padEnd(48, "x"),
  databaseUrl: "",
  oAuthServerUrl: "",
  ownerOpenId: "",
  ownerEmail: "",
  ownerPasswordHash: "",
  ownerName: "",
  isProduction: false,
  forgeApiUrl: "",
  forgeApiKey: "",
};
vi.mock("./_core/env", () => ({ ENV: envState }));

const upserts: unknown[] = [];
vi.mock("./db", () => ({
  upsertUser: vi.fn(async (u: unknown) => { upserts.push(u); }),
  getUserByOpenId: vi.fn(async () => undefined),
}));

const mod = await import("./_core/ownerLogin");
const { sdk } = await import("./_core/sdk");

beforeAll(async () => { TEST_HASH = await bcrypt.hash(TEST_PASSWORD, 4); });
beforeEach(() => {
  envState.ownerEmail = TEST_EMAIL;
  envState.ownerPasswordHash = TEST_HASH;
  envState.oAuthServerUrl = "";
  envState.ownerOpenId = "";
  upserts.length = 0;
  mod._resetRateLimitsForTests();
});

describe("authMode", () => {
  it("reports owner sign-in only when both variables are set", () => {
    expect(mod.authMode()).toEqual({ managedOAuth: false, ownerLogin: true, ownerTotp: false });
    envState.ownerPasswordHash = "";
    expect(mod.authMode()).toEqual({ managedOAuth: false, ownerLogin: false, ownerTotp: false });
    envState.oAuthServerUrl = "https://oauth.example.test";
    expect(mod.authMode()).toEqual({ managedOAuth: true, ownerLogin: false, ownerTotp: false });
  });
});

describe("verifyOwnerCredentials", () => {
  it("accepts the configured owner (email case-insensitive)", async () => {
    expect(await mod.verifyOwnerCredentials(TEST_EMAIL.toUpperCase(), TEST_PASSWORD)).toBe(true);
  });
  it("rejects a wrong password, a wrong email, and an empty password", async () => {
    expect(await mod.verifyOwnerCredentials(TEST_EMAIL, TEST_PASSWORD + "x")).toBe(false);
    expect(await mod.verifyOwnerCredentials("someone@else.test", TEST_PASSWORD)).toBe(false);
    expect(await mod.verifyOwnerCredentials(TEST_EMAIL, "")).toBe(false);
  });
  it("refuses everything when not configured — there is no built-in password", async () => {
    envState.ownerPasswordHash = "";
    expect(await mod.verifyOwnerCredentials(TEST_EMAIL, TEST_PASSWORD)).toBe(false);
    envState.ownerPasswordHash = TEST_HASH;
    envState.ownerEmail = "";
    expect(await mod.verifyOwnerCredentials("", TEST_PASSWORD)).toBe(false);
  });
});

describe("rate limiter", () => {
  it("allows five attempts per window, then makes the client wait", () => {
    for (let i = 0; i < 5; i++) expect(mod.checkRateLimit("1.2.3.4", 1000)).toBe(0);
    expect(mod.checkRateLimit("1.2.3.4", 1000)).toBeGreaterThan(0);
    expect(mod.checkRateLimit("5.6.7.8", 1000)).toBe(0); // other clients unaffected
    expect(mod.checkRateLimit("1.2.3.4", 1000 + 16 * 60 * 1000)).toBe(0); // window expired
  });
});

describe("HTTP routes", () => {
  let server: Server;
  let base = "";
  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    mod.registerOwnerLoginRoutes(app);
    await new Promise<void>((r) => { server = app.listen(0, "127.0.0.1", () => r()); });
    const addr = server.address();
    base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  const post = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}${mod.OWNER_LOGIN_PATH}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

  it("GET /api/auth/mode tells the login page what to show", async () => {
    const res = await fetch(`${base}${mod.AUTH_MODE_PATH}`);
    expect(await res.json()).toEqual({ managedOAuth: false, ownerLogin: true, ownerTotp: false });
  });

  it("signs the owner in with a session cookie the SDK verifies, as admin", async () => {
    const res = await post({ email: TEST_EMAIL, password: TEST_PASSWORD }, { "x-forwarded-for": "10.0.0.1" });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/^app_session_id=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    const token = setCookie.split(";")[0].split("=")[1];
    const session = await sdk.verifySession(token);
    expect(session?.openId).toBe("owner");
    expect(upserts[0]).toMatchObject({ openId: "owner", email: TEST_EMAIL, role: "admin", loginMethod: "owner-password" });
  });

  it("uses OWNER_OPEN_ID when it is set", async () => {
    envState.ownerOpenId = "sam-openid";
    const res = await post({ email: TEST_EMAIL, password: TEST_PASSWORD }, { "x-forwarded-for": "10.0.0.2" });
    expect(res.status).toBe(200);
    expect(upserts[0]).toMatchObject({ openId: "sam-openid" });
  });

  it("rejects bad credentials with 401 and no cookie", async () => {
    const res = await post({ email: TEST_EMAIL, password: "nope" }, { "x-forwarded-for": "10.0.0.3" });
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(upserts).toHaveLength(0);
  });

  it("returns 404 when owner sign-in is not configured", async () => {
    envState.ownerPasswordHash = "";
    const res = await post({ email: TEST_EMAIL, password: TEST_PASSWORD }, { "x-forwarded-for": "10.0.0.4" });
    expect(res.status).toBe(404);
  });

  it("rate-limits repeated failures from one client", async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) {
      last = (await post({ email: TEST_EMAIL, password: "wrong" }, { "x-forwarded-for": "10.0.0.5" })).status;
    }
    expect(last).toBe(429);
  });
});
