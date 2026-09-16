/**
 * Passwordless sign-in by email link.
 *
 * The foundation signs people in through an external OAuth portal. Where no
 * portal exists, this provider issues the same session cookie from a link
 * sent to the person's own inbox: no password to store, no shared passcode
 * that would let one member read another's health data.
 *
 *   POST /api/auth/email/request   { email, returnPath }  → sends the link
 *   GET  /api/auth/email/callback?token=…                 → sets the cookie
 *
 * The link carries an HMAC-signed, single-use token that expires in fifteen
 * minutes. Requests are rate-limited per address and per email. The owner
 * (OWNER_EMAIL) signs in as admin; everyone else as a user. The provider is
 * off unless EMAIL_AUTH_ENABLED=true and Resend is configured, and it only
 * ever redirects to a path on this site.
 */
import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const LINK_MAX_AGE_MS = 15 * 60 * 1000;

export function emailAuthEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.EMAIL_AUTH_ENABLED === "true" && Boolean(env.RESEND_API_KEY) && Boolean(env.MAIL_FROM);
}

function secret(): string {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is required");
  return ENV.cookieSecret;
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

/** A stable, non-reversible account id for an email address. */
export function openIdForEmail(email: string): string {
  return `email:${crypto.createHash("sha256").update(email).digest("hex").slice(0, 40)}`;
}

export function safeReturnPath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && value.length < 512 ? value : "/";
}

export interface LinkPayload { email: string; returnPath: string; issuedAt: number; jti: string }

export function signLink(payload: LinkPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyLink(token: unknown, now = Date.now()): LinkPayload {
  if (typeof token !== "string" || token.length > 2048) throw new Error("Invalid link");
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new Error("Invalid link");
  const expected = crypto.createHmac("sha256", secret()).update(encoded).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("Invalid link signature");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<LinkPayload>;
  const email = normalizeEmail(payload.email);
  if (!email || typeof payload.jti !== "string" || typeof payload.issuedAt !== "number") throw new Error("Malformed link");
  if (now - payload.issuedAt > LINK_MAX_AGE_MS || payload.issuedAt > now + 60_000) throw new Error("Link expired");
  return { email, returnPath: safeReturnPath(payload.returnPath), issuedAt: payload.issuedAt, jti: payload.jti };
}

// Single use: a redeemed link id is remembered until it would have expired anyway.
const redeemed = new Map<string, number>();
function markRedeemed(jti: string, now = Date.now()): boolean {
  for (const [k, at] of Array.from(redeemed.entries())) if (now - at > LINK_MAX_AGE_MS) redeemed.delete(k);
  if (redeemed.has(jti)) return false;
  redeemed.set(jti, now);
  return true;
}

// Per-key sliding window: five requests per fifteen minutes.
const windows = new Map<string, number[]>();
export function allow(key: string, now = Date.now(), limit = 5, windowMs = LINK_MAX_AGE_MS): boolean {
  const hits = (windows.get(key) ?? []).filter(t => now - t < windowMs);
  if (hits.length >= limit) { windows.set(key, hits); return false; }
  hits.push(now);
  windows.set(key, hits);
  if (windows.size > 20_000) for (const [k, v] of Array.from(windows.entries())) if (!v.some(t => now - t < windowMs)) windows.delete(k);
  return true;
}

export function resetEmailAuthState(): void {
  redeemed.clear();
  windows.clear();
}

export type Mailer = (to: string, subject: string, text: string) => Promise<void>;

async function sendWithResend(to: string, subject: string, text: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Mail provider answered ${res.status}`);
}

export function registerEmailAuthRoutes(app: Express, mailer: Mailer = sendWithResend) {
  app.post("/api/auth/email/request", async (req: Request, res: Response) => {
    if (!emailAuthEnabled()) return res.status(503).json({ error: "Email sign-in is not configured" });
    const email = normalizeEmail((req.body as { email?: unknown } | undefined)?.email);
    if (!email) return res.status(400).json({ error: "A valid email address is required" });
    const returnPath = safeReturnPath((req.body as { returnPath?: unknown } | undefined)?.returnPath);
    const now = Date.now();
    if (!allow(`ip:${req.ip ?? "unknown"}`, now) || !allow(`email:${email}`, now)) {
      res.setHeader("Retry-After", "900");
      return res.status(429).json({ error: "Too many sign-in links requested. Please wait fifteen minutes." });
    }
    const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const token = signLink({ email, returnPath, issuedAt: now, jti: crypto.randomBytes(16).toString("base64url") });
    const link = `${base}/api/auth/email/callback?token=${encodeURIComponent(token)}`;
    try {
      await mailer(email, "Your Doctor Buddy sign-in link", [
        "Here is your sign-in link. It works once and expires in fifteen minutes.",
        "",
        link,
        "",
        "If you did not ask for this, ignore this message; nothing happens until the link is opened.",
      ].join("\n"));
    } catch (error) {
      console.error("[email-auth] send failed:", error instanceof Error ? error.message.slice(0, 120) : "unknown");
      return res.status(502).json({ error: "The sign-in email could not be sent. Please try again in a moment." });
    }
    // The same answer whether or not the address is known: nothing to enumerate.
    res.json({ sent: true });
  });

  app.get("/api/auth/email/callback", async (req: Request, res: Response) => {
    if (!emailAuthEnabled()) return res.status(503).json({ error: "Email sign-in is not configured" });
    let payload: LinkPayload;
    try {
      payload = verifyLink(req.query.token);
    } catch {
      return res.status(400).json({ error: "This sign-in link is invalid or has expired. Please request a new one." });
    }
    if (!markRedeemed(payload.jti)) return res.status(400).json({ error: "This sign-in link was already used. Please request a new one." });
    try {
      const openId = openIdForEmail(payload.email);
      const owner = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
      await db.upsertUser({ openId, email: payload.email, name: null, loginMethod: "email", lastSignedIn: new Date(), ...(owner && owner === payload.email ? { role: "admin" as const } : {}) });
      const user = await db.getUserByOpenId(openId);
      if (!user) return res.status(503).json({ error: "Sign-in is temporarily unavailable" });
      const sessionToken = await sdk.createSessionToken(openId, { name: "", expiresInMs: SESSION_MAX_AGE_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: SESSION_MAX_AGE_MS });
      res.redirect(302, payload.returnPath);
    } catch (error) {
      console.error("[email-auth] callback failed:", error instanceof Error ? error.message.slice(0, 120) : "unknown");
      res.status(503).json({ error: "Sign-in is temporarily unavailable" });
    }
  });
}
