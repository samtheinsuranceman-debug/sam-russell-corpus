// ============================================================
// Self-hosted sign-in (server/_core/ownerLogin.ts): owner and entrance passcode.
// No real credentials appear here: the test mints random passwords and hashes.
// ============================================================
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import express from "express";
import type { Server } from "node:http";
import { LOGIN_DISCLAIMER_IDS, LOGIN_DISCLAIMERS, missingAcknowledgements } from "../shared/loginDisclaimers";

const TEST_EMAIL = "owner@example.test";
const TEST_PASSWORD = randomBytes(18).toString("base64url");
const GUEST_PASSCODE = randomBytes(12).toString("base64url");
let TEST_HASH = "";
let GUEST_HASH = "";
const ACK = [...LOGIN_DISCLAIMER_IDS];

const envState = {
  appId: "russell-capital-systems",
  cookieSecret: "test-secret-".padEnd(48, "x"),
  databaseUrl: "",
  oAuthServerUrl: "",
  ownerOpenId: "",
  ownerEmail: "",
  ownerPasswordHash: "",
  ownerName: "",
  ownerTotpSecret: "",
  guestPasscodeHash: "",
  isProduction: false,
  forgeApiUrl: "",
  forgeApiKey: "",
};
vi.mock("./_core/env", () => ({ ENV: envState }));

const upserts: Array<Record<string, unknown>> = [];
const signatures: Array<Record<string, unknown>> = [];
vi.mock("./db", () => ({
  upsertUser: vi.fn(async (u: Record<string, unknown>) => { upserts.push(u); }),
  getUserByOpenId: vi.fn(async (openId: string) => ({ id: 7, openId, name: "Tester" })),
  saveComplianceSignatureDb: vi.fn(async (s: Record<string, unknown>) => { signatures.push(s); return { id: 1 }; }),
}));

const mod = await import("./_core/ownerLogin");
const { sdk } = await import("./_core/sdk");

beforeAll(async () => {
  TEST_HASH = await bcrypt.hash(TEST_PASSWORD, 4);
  GUEST_HASH = await bcrypt.hash(GUEST_PASSCODE, 4);
});
beforeEach(() => {
  envState.ownerEmail = TEST_EMAIL;
  envState.ownerPasswordHash = TEST_HASH;
  envState.guestPasscodeHash = GUEST_HASH;
  envState.oAuthServerUrl = "";
  envState.ownerOpenId = "";
  upserts.length = 0;
  signatures.length = 0;
  mod._resetRateLimitsForTests();
});

describe("entrance disclaimers", () => {
  it("has at least five, each with an id, a title and a sentence", () => {
    expect(LOGIN_DISCLAIMERS.length).toBeGreaterThanOrEqual(5);
    for (const d of LOGIN_DISCLAIMERS) {
      expect(d.id).toMatch(/^[a-z-]+$/);
      expect(d.title.length).toBeGreaterThan(3);
      expect(d.text.length).toBeGreaterThan(40);
    }
    expect(new Set(LOGIN_DISCLAIMER_IDS).size).toBe(LOGIN_DISCLAIMER_IDS.length);
  });
  it("names exactly the ids that were not ticked", () => {
    expect(missingAcknowledgements(ACK)).toEqual([]);
    expect(missingAcknowledgements(ACK.slice(1))).toEqual([ACK[0]]);
    expect(missingAcknowledgements(undefined)).toEqual(ACK);
    expect(missingAcknowledgements("education-only")).toEqual(ACK);
  });
});

describe("authMode", () => {
  it("reports each sign-in only when its variables are set", () => {
    expect(mod.authMode()).toEqual({ managedOAuth: false, ownerLogin: true, ownerTotp: false, guestLogin: true });
    envState.ownerPasswordHash = "";
    envState.guestPasscodeHash = "";
    expect(mod.authMode()).toEqual({ managedOAuth: false, ownerLogin: false, ownerTotp: false, guestLogin: false });
    envState.oAuthServerUrl = "https://oauth.example.test";
    expect(mod.authMode()).toEqual({ managedOAuth: true, ownerLogin: false, ownerTotp: false, guestLogin: false });
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

describe("verifyGuestPasscode", () => {
  it("accepts any well-formed email with the passcode", async () => {
    expect(await mod.verifyGuestPasscode("dr.smith@hospital.org", GUEST_PASSCODE)).toBe(true);
    expect(await mod.verifyGuestPasscode("Another.Person@Example.COM", GUEST_PASSCODE)).toBe(true);
  });
  it("rejects a wrong passcode, a malformed email, and an unset hash", async () => {
    expect(await mod.verifyGuestPasscode("dr.smith@hospital.org", GUEST_PASSCODE + "x")).toBe(false);
    expect(await mod.verifyGuestPasscode("not-an-email", GUEST_PASSCODE)).toBe(false);
    envState.guestPasscodeHash = "";
    expect(await mod.verifyGuestPasscode("dr.smith@hospital.org", GUEST_PASSCODE)).toBe(false);
  });
  it("derives a stable, prefixed, column-sized user id from the email", () => {
    const a = mod.guestOpenId("Dr.Smith@Hospital.org");
    expect(a).toBe(mod.guestOpenId("  dr.smith@hospital.org "));
    expect(a).toMatch(/^guest:[0-9a-f]{40}$/);
    expect(a.length).toBeLessThanOrEqual(64);
    expect(a).not.toBe(mod.guestOpenId("dr.jones@hospital.org"));
    expect(a).not.toBe("owner");
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

  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  const owner = (body: unknown, ip: string) => post(mod.OWNER_LOGIN_PATH, body, { "x-forwarded-for": ip });
  const guest = (body: unknown, ip: string) => post(mod.GUEST_LOGIN_PATH, body, { "x-forwarded-for": ip, "user-agent": "vitest" });

  it("GET /api/auth/mode tells the login page what to show", async () => {
    const res = await fetch(`${base}${mod.AUTH_MODE_PATH}`);
    expect(await res.json()).toEqual({ managedOAuth: false, ownerLogin: true, ownerTotp: false, guestLogin: true });
  });

  it("signs the owner in with a session cookie the SDK verifies, as admin", async () => {
    const res = await owner({ email: TEST_EMAIL, password: TEST_PASSWORD, acknowledgements: ACK }, "10.0.0.1");
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/^app_session_id=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    const token = setCookie.split(";")[0].split("=")[1];
    const session = await sdk.verifySession(token);
    expect(session?.openId).toBe("owner");
    expect(upserts[0]).toMatchObject({ openId: "owner", email: TEST_EMAIL, role: "admin", loginMethod: "owner-password" });
    expect(signatures[0]).toMatchObject({ userId: 7, userEmail: TEST_EMAIL, ipAddress: "10.0.0.1" });
  });

  it("uses OWNER_OPEN_ID when it is set", async () => {
    envState.ownerOpenId = "sam-openid";
    const res = await owner({ email: TEST_EMAIL, password: TEST_PASSWORD, acknowledgements: ACK }, "10.0.0.2");
    expect(res.status).toBe(200);
    expect(upserts[0]).toMatchObject({ openId: "sam-openid" });
  });

  it("refuses the owner without every acknowledgement, before checking the password", async () => {
    const res = await owner({ email: TEST_EMAIL, password: TEST_PASSWORD, acknowledgements: ACK.slice(0, 2) }, "10.0.0.6");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.missing).toEqual(ACK.slice(2));
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(upserts).toHaveLength(0);
  });

  it("rejects bad credentials with 401 and no cookie", async () => {
    const res = await owner({ email: TEST_EMAIL, password: "nope", acknowledgements: ACK }, "10.0.0.3");
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(upserts).toHaveLength(0);
  });

  it("returns 404 when owner sign-in is not configured", async () => {
    envState.ownerPasswordHash = "";
    const res = await owner({ email: TEST_EMAIL, password: TEST_PASSWORD, acknowledgements: ACK }, "10.0.0.4");
    expect(res.status).toBe(404);
  });

  it("rate-limits repeated failures from one client", async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) {
      last = (await owner({ email: TEST_EMAIL, password: "wrong", acknowledgements: ACK }, "10.0.0.5")).status;
    }
    expect(last).toBe(429);
  });

  it("signs any email in with the entrance passcode, as a regular user, and records the acknowledgement", async () => {
    const res = await guest({ email: "Dr.Smith@Hospital.org", password: GUEST_PASSCODE, acknowledgements: ACK }, "10.0.1.1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, name: "Dr.Smith" });
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/^app_session_id=/);
    const session = await sdk.verifySession(setCookie.split(";")[0].split("=")[1]);
    expect(session?.openId).toBe(mod.guestOpenId("dr.smith@hospital.org"));
    expect(upserts[0]).toMatchObject({ openId: session?.openId, email: "dr.smith@hospital.org", role: "user", loginMethod: "guest-passcode" });
    expect(signatures[0]).toMatchObject({ userId: 7, userEmail: "dr.smith@hospital.org", ipAddress: "10.0.1.1", userAgent: "vitest" });
    expect(signatures[0]!.signedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("refuses the passcode entrance without every acknowledgement", async () => {
    const res = await guest({ email: "dr.smith@hospital.org", password: GUEST_PASSCODE, acknowledgements: [] }, "10.0.1.2");
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toEqual(ACK);
    expect(upserts).toHaveLength(0);
  });

  it("rejects a wrong passcode with 401, a bad email with 400, and never grants admin", async () => {
    expect((await guest({ email: "dr.smith@hospital.org", password: "wrong", acknowledgements: ACK }, "10.0.1.3")).status).toBe(401);
    expect((await guest({ email: "nope", password: GUEST_PASSCODE, acknowledgements: ACK }, "10.0.1.4")).status).toBe(400);
    const res = await guest({ email: TEST_EMAIL, password: GUEST_PASSCODE, acknowledgements: ACK }, "10.0.1.5");
    expect(res.status).toBe(200);
    expect(upserts[0]).toMatchObject({ role: "user" });
    expect(upserts[0]!.openId).not.toBe("owner");
  });

  it("returns 404 when the passcode entrance is not configured", async () => {
    envState.guestPasscodeHash = "";
    const res = await guest({ email: "dr.smith@hospital.org", password: GUEST_PASSCODE, acknowledgements: ACK }, "10.0.1.6");
    expect(res.status).toBe(404);
  });

  it("still signs in when the acknowledgement record cannot be written", async () => {
    const db = await import("./db");
    (db.saveComplianceSignatureDb as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("db away"));
    const res = await guest({ email: "dr.smith@hospital.org", password: GUEST_PASSCODE, acknowledgements: ACK }, "10.0.1.7");
    expect(res.status).toBe(200);
  });
});
