// ============================================================
// JWT KEY SEPARATION
// Session cookies are HS256 JWTs: the signature is HMAC-SHA256(JWT_SECRET,
// "header.payload"). No other feature may compute HMAC-SHA256 under the raw
// JWT_SECRET, or a value it shows a user could double as a session signature.
//
// For each feature that used to key with JWT_SECRET (unsubscribe links,
// Whisperer report links, signed advice, document provenance) these tests feed
// a genuine session signing input through the feature (or through the feature's
// key at full length, with no truncation to hide behind) and check the result
// never verifies as a session. A control shows the harness itself works: the
// raw session key does produce a verifying token. Values issued before the
// change must still verify, and nothing new is issued with the old key.
// The session secret is random per run; nothing here is a real key.
// ============================================================
import { afterAll, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SESSION_SECRET = vi.hoisted(() => {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  const s = `test-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  process.env.JWT_SECRET = s;
  delete process.env.ADVICE_SIGNING_KEY;
  return s;
});

import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { purposeKey } from "./_core/purposeKeys";
import { unsubscribeToken, verifyUnsubscribeToken } from "./_core/mailer";
import { reportLinkToken, verifyReportLinkToken } from "./whisperer";
import { adviceSigningKey, buildSignedAdvice, keyIdFor, verifyAdvice } from "./advice";
import { signProvenance, verifyProvenance } from "./provenance";

afterAll(() => {
  delete process.env.JWT_SECRET;
});

const b64u = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const SIGNING_INPUT = `${b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64u(
  JSON.stringify({ openId: "owner-open-id", appId: ENV.appId, name: "Owner", exp: Math.floor(Date.now() / 1000) + 3600 }),
)}`;
const tokenWith = (signature: Buffer) => `${SIGNING_INPUT}.${b64u(signature)}`;
const fullMac = (key: string, msg: string) => createHmac("sha256", key).update(msg).digest();
const legacyMac = (msg: string) => createHmac("sha256", SESSION_SECRET).update(msg).digest("hex");
const env = { JWT_SECRET: SESSION_SECRET };

describe("harness control", () => {
  it("the test secret is the session key", () => {
    expect(ENV.cookieSecret).toBe(SESSION_SECRET);
  });
  it("an HMAC under the raw session key over a signing input IS a valid session (the risk being guarded)", async () => {
    expect(await sdk.verifySession(tokenWith(fullMac(SESSION_SECRET, SIGNING_INPUT)))).not.toBeNull();
    expect(await sdk.verifySession(await sdk.createSessionToken("someone", { name: "S" }))).not.toBeNull();
  });
});

describe("purpose keys", () => {
  it("are distinct from the session key and from each other", () => {
    const keys = [purposeKey("unsubscribe-link", env), purposeKey("whisperer-report-link", env), purposeKey("advice-signing", env)];
    expect(new Set(keys).size).toBe(3);
    for (const k of keys) expect(k).not.toBe(SESSION_SECRET);
  });
  it("no longer fall back to a constant from the source when JWT_SECRET is unset", () => {
    expect(purposeKey("unsubscribe-link", {})).not.toBe("rcs-unsubscribe");
    expect(unsubscribeToken("a@example.test", {})).not.toBe(createHmac("sha256", "rcs-unsubscribe").update("a@example.test").digest("hex").slice(0, 32));
    expect(verifyReportLinkToken(1, 2, createHmac("sha256", "whisperer").update("1.2").digest("hex").slice(0, 32), {})).toBe(false);
  });
});

describe("unsubscribe links (server/_core/mailer.ts)", () => {
  it("a token for a session signing input does not verify as a session", async () => {
    const t = unsubscribeToken(SIGNING_INPUT, env);
    expect(await sdk.verifySession(tokenWith(Buffer.from(t, "hex")))).toBeNull();
  });
  it("the unsubscribe key cannot sign a session even at full length", async () => {
    expect(await sdk.verifySession(tokenWith(fullMac(purposeKey("unsubscribe-link", env), SIGNING_INPUT)))).toBeNull();
    expect(await sdk.verifySession(tokenWith(fullMac(purposeKey("unsubscribe-link", env), SIGNING_INPUT.toLowerCase())))).toBeNull();
  });
  it("new links are not keyed with JWT_SECRET", () => {
    const e = "lead@example.test";
    expect(unsubscribeToken(e, env)).not.toBe(legacyMac(e).slice(0, 32));
    expect(verifyUnsubscribeToken(e, unsubscribeToken(e, env), env)).toBe(true);
  });
  it("links mailed before the change still unsubscribe (verify only)", () => {
    const e = "old-lead@example.test";
    expect(verifyUnsubscribeToken(e, legacyMac(e).slice(0, 32), env)).toBe(true);
    expect(verifyUnsubscribeToken("other@example.test", legacyMac(e).slice(0, 32), env)).toBe(false);
    expect(verifyUnsubscribeToken(e, "0".repeat(32), env)).toBe(false);
  });
});

describe("Whisperer report links (server/whisperer.ts)", () => {
  it("a report link token does not verify as a session", async () => {
    const t = reportLinkToken(42, Date.now() + 1000, env);
    expect(await sdk.verifySession(tokenWith(Buffer.from(t, "hex")))).toBeNull();
  });
  it("the report-link key cannot sign a session even at full length", async () => {
    expect(await sdk.verifySession(tokenWith(fullMac(purposeKey("whisperer-report-link", env), SIGNING_INPUT)))).toBeNull();
  });
  it("new links are not keyed with JWT_SECRET, and still verify", () => {
    const exp = Date.now() + 14 * 86_400_000;
    const t = reportLinkToken(7, exp, env);
    expect(t).not.toBe(legacyMac(`7.${exp}`).slice(0, 32));
    expect(verifyReportLinkToken(7, exp, t, env)).toBe(true);
    expect(verifyReportLinkToken(8, exp, t, env)).toBe(false);
  });
  it("links texted before the change still open (verify only)", () => {
    const exp = Date.now() + 86_400_000;
    expect(verifyReportLinkToken(7, exp, legacyMac(`7.${exp}`).slice(0, 32), env)).toBe(true);
    expect(verifyReportLinkToken(7, exp + 1, legacyMac(`7.${exp}`).slice(0, 32), env)).toBe(false);
  });
});

describe("signed advice (server/advice.ts)", () => {
  const input = { question: SIGNING_INPUT, answer: SIGNING_INPUT, via: "test", voices: [], dataUsed: [], assumptions: [], rulesApplied: [], at: new Date("2026-09-23T12:00:00Z"), rulesVersion: "t", disclaimers: [] };

  it("uses a derived key, not JWT_SECRET, when ADVICE_SIGNING_KEY is unset", () => {
    expect(adviceSigningKey()).toBe(purposeKey("advice-signing"));
    expect(adviceSigningKey()).not.toBe(SESSION_SECRET);
  });
  it("ignores an ADVICE_SIGNING_KEY that is just a copy of JWT_SECRET", () => {
    expect(adviceSigningKey({ JWT_SECRET: SESSION_SECRET, ADVICE_SIGNING_KEY: SESSION_SECRET } as NodeJS.ProcessEnv)).not.toBe(SESSION_SECRET);
    expect(adviceSigningKey({ JWT_SECRET: SESSION_SECRET, ADVICE_SIGNING_KEY: "dedicated" } as NodeJS.ProcessEnv)).toBe("dedicated");
  });
  it("a signed record carrying a session signing input does not yield a session signature", async () => {
    const signed = buildSignedAdvice(input);
    expect(await sdk.verifySession(tokenWith(Buffer.from(signed.signature, "hex")))).toBeNull();
    expect(await sdk.verifySession(tokenWith(fullMac(adviceSigningKey(), SIGNING_INPUT)))).toBeNull();
    expect(signed.keyId).not.toBe(keyIdFor(SESSION_SECRET));
    expect(verifyAdvice(signed).ok).toBe(true);
  });
  it("records signed with JWT_SECRET before the change still verify; tampering still fails", () => {
    const legacy = buildSignedAdvice(input, SESSION_SECRET);
    expect(verifyAdvice(legacy).ok).toBe(true);
    expect(verifyAdvice({ ...legacy, payload: { ...legacy.payload, answer: "changed" } }).ok).toBe(false);
    expect(verifyAdvice(buildSignedAdvice(input, "some-other-key")).reason).toBe("signed with a different key");
  });
});

describe("document provenance (server/provenance.ts)", () => {
  const fields = { documentId: 9, sha256: "a".repeat(64), uploadedAt: "2026-09-23T12:00:00.000Z", uploadedBy: SIGNING_INPUT };

  it("a provenance signature does not verify as a session", async () => {
    const sig = signProvenance(fields);
    expect(await sdk.verifySession(tokenWith(Buffer.from(sig, "hex")))).toBeNull();
    expect(sig).not.toBe(legacyMac(`${fields.documentId}|${fields.sha256}|${fields.uploadedAt}|${fields.uploadedBy}`));
    expect(verifyProvenance(fields, sig)).toBe(true);
  });
  it("records signed with JWT_SECRET before the change still verify; tampering still fails", () => {
    const legacy = signProvenance(fields, SESSION_SECRET);
    expect(verifyProvenance(fields, legacy)).toBe(true);
    expect(verifyProvenance({ ...fields, uploadedBy: "someone else" }, legacy)).toBe(false);
    expect(verifyProvenance(fields, "00")).toBe(false);
  });
});

// Static guard: only the session code and the purpose-key module may key with JWT_SECRET.
describe("no new raw JWT_SECRET HMAC users", () => {
  const APP = path.resolve(__dirname, "..");
  // Files allowed to mention the session secret, and why.
  const ALLOWED = new Set([
    "server/_core/env.ts", // defines ENV.cookieSecret
    "server/_core/sdk.ts", // signs and verifies sessions
    "server/_core/purposeKeys.ts", // derives per-purpose keys; legacy verify-only access
    "server/_core/mailer.ts", // MailEnv type field only
    "server/advice.ts", // presence check before deriving the advice key
    "server/council.ts", // Council branch: derives per-purpose log keys (review finding R-B3)
  ]);
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules") continue;
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.[cm]?[jt]sx?$/.test(name) && !/\.(test|spec)\./.test(name)) files.push(full);
    }
  };
  walk(path.join(APP, "server"));
  walk(path.join(APP, "shared"));
  // Code only: comments explaining why JWT_SECRET is not used do not count.
  const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("only allow-listed files reference JWT_SECRET or cookieSecret", () => {
    const offenders = files
      .filter((f) => /JWT_SECRET|cookieSecret/.test(code(f)))
      .map((f) => path.relative(APP, f).split(path.sep).join("/"))
      .filter((rel) => !ALLOWED.has(rel));
    expect(offenders).toEqual([]);
  });
  it("no file passes JWT_SECRET or cookieSecret straight to createHmac", () => {
    const offenders = files.filter((f) => /createHmac\([^)]*(JWT_SECRET|cookieSecret)/.test(code(f)) && !f.endsWith(path.join("_core", "purposeKeys.ts")));
    expect(offenders).toEqual([]);
  });
});
