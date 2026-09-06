// ============================================================
// SELF-HOSTED OWNER SIGN-IN
// The portal's normal sign-in is the managed OAuth server (Manus). On a plain
// host (cPanel, VPS) there is no such server, so nobody could reach
// /portal/leads. This adds one narrowly-scoped alternative: the OWNER signs in
// with an email + password whose bcrypt HASH lives only in the host's
// environment. It issues the same signed session cookie the OAuth flow does,
// so every downstream permission check is unchanged.
//
//   OWNER_EMAIL          the owner's sign-in email
//   OWNER_PASSWORD_HASH  bcrypt hash — generate with `pnpm owner:password`
//   OWNER_NAME           display name (optional)
//   OWNER_OPEN_ID        the owner's user id (optional; defaults to "owner")
//   OWNER_TOTP_SECRET    base32 authenticator secret — `pnpm owner:totp`. When
//                        set, sign-in also needs the six-digit code (MFA).
//
// Nothing here is a bypass: with the two variables unset the routes refuse
// every request, and there are no built-in passwords anywhere in the code.
// ============================================================
import bcrypt from "bcryptjs";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { verifyTotp } from "./totp";

export const OWNER_LOGIN_PATH = "/api/auth/owner-login";
export const AUTH_MODE_PATH = "/api/auth/mode";
const DEFAULT_OWNER_OPEN_ID = "owner";

// Sign-in attempts per client IP: 5 per 15 minutes, then a cool-off.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();

export function isOwnerLoginConfigured(env = ENV): boolean {
  return Boolean(env.ownerEmail && env.ownerPasswordHash);
}

export function ownerTotpEnabled(env = ENV): boolean {
  return Boolean(env.ownerTotpSecret);
}

export function authMode(env = ENV) {
  return {
    managedOAuth: Boolean(env.oAuthServerUrl),
    ownerLogin: isOwnerLoginConfigured(env),
    ownerTotp: ownerTotpEnabled(env),
  };
}

/** Rate limiter — returns seconds to wait, or 0 when the attempt may proceed. */
export function checkRateLimit(key: string, now = Date.now()): number {
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return 0;
  }
  if (bucket.count >= MAX_ATTEMPTS) return Math.ceil((bucket.resetAt - now) / 1000);
  bucket.count += 1;
  return 0;
}
export function clearRateLimit(key: string) { attempts.delete(key); }
export function _resetRateLimitsForTests() { attempts.clear(); }

/**
 * Constant-work credential check: the bcrypt comparison always runs, even when
 * the email does not match, so timing does not reveal which half was wrong.
 */
export async function verifyOwnerCredentials(email: string, password: string, env = ENV): Promise<boolean> {
  if (!isOwnerLoginConfigured(env)) return false;
  const emailMatches = email.trim().toLowerCase() === env.ownerEmail.trim().toLowerCase();
  const passwordMatches = await bcrypt.compare(password, env.ownerPasswordHash);
  return emailMatches && passwordMatches;
}

export function ownerOpenId(env = ENV): string {
  return env.ownerOpenId || DEFAULT_OWNER_OPEN_ID;
}

function clientKey(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0]!.trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export function registerOwnerLoginRoutes(app: Express) {
  app.get(AUTH_MODE_PATH, (_req: Request, res: Response) => {
    res.json(authMode());
  });

  app.post(OWNER_LOGIN_PATH, async (req: Request, res: Response) => {
    if (!isOwnerLoginConfigured()) {
      res.status(404).json({ error: "Owner sign-in is not configured on this host." });
      return;
    }
    const key = clientKey(req);
    const wait = checkRateLimit(key);
    if (wait > 0) {
      res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).` });
      return;
    }
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password || password.length > 1024) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const ok = await verifyOwnerCredentials(email, password);
    if (!ok) {
      console.warn("[OwnerLogin] rejected sign-in attempt from", key);
      res.status(401).json({ error: "Incorrect email or password." });
      return;
    }
    // Second factor: the authenticator code, checked only after the password
    // so a wrong password never reveals whether MFA is on.
    if (ownerTotpEnabled()) {
      const code = typeof req.body?.code === "string" ? req.body.code : "";
      if (!verifyTotp(ENV.ownerTotpSecret, code)) {
        console.warn("[OwnerLogin] rejected authenticator code from", key);
        res.status(401).json({ error: code ? "That authenticator code is not valid." : "Enter the six-digit code from your authenticator app.", needsCode: true });
        return;
      }
    }

    try {
      const openId = ownerOpenId();
      const name = ENV.ownerName || "Owner";
      await db.upsertUser({
        openId,
        name,
        email: ENV.ownerEmail,
        loginMethod: "owner-password",
        role: "admin",
        lastSignedIn: new Date(),
      });
      const sessionToken = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      clearRateLimit(key);
      res.json({ ok: true, name });
    } catch (error) {
      console.error("[OwnerLogin] failed to establish session", error);
      res.status(500).json({ error: "Could not establish a session." });
    }
  });
}
