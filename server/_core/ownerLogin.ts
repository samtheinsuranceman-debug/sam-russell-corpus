// ============================================================
// SELF-HOSTED SIGN-IN: OWNER AND ENTRANCE PASSCODE
// The portal's managed sign-in is the OAuth server (Manus). On a plain host
// there is no such server, so this file provides two alternatives that issue
// the same signed session cookie the OAuth flow does, so every downstream
// permission check is unchanged.
//
//   Owner sign-in (role admin):
//   OWNER_EMAIL          the owner's sign-in email
//   OWNER_PASSWORD_HASH  bcrypt hash — generate with `pnpm owner:password`
//   OWNER_NAME           display name (optional)
//   OWNER_OPEN_ID        the owner's user id (optional; defaults to "owner")
//   OWNER_TOTP_SECRET    base32 authenticator secret — `pnpm owner:totp`. When
//                        set, sign-in also needs the six-digit code (MFA).
//
//   Entrance passcode (role user):
//   GUEST_PASSCODE_HASH  bcrypt hash of the passcode the owner hands to invited
//                        visitors. Any email plus that passcode signs in as a
//                        regular user whose id is derived from the email.
//
// Every sign-in must carry every id in shared/loginDisclaimers.ts; the server
// refuses the request otherwise and records the acknowledgement as a
// compliance signature when the database is reachable.
//
// Nothing here is a bypass: with the variables unset the routes refuse every
// request, and there are no built-in passwords anywhere in the code.
// ============================================================
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { missingAcknowledgements } from "@shared/loginDisclaimers";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { verifyTotp } from "./totp";

export const OWNER_LOGIN_PATH = "/api/auth/owner-login";
export const GUEST_LOGIN_PATH = "/api/auth/guest-login";
export const AUTH_MODE_PATH = "/api/auth/mode";
const DEFAULT_OWNER_OPEN_ID = "owner";
const GUEST_OPEN_ID_PREFIX = "guest:";

// Sign-in attempts per client IP: 5 per 15 minutes, then a cool-off.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();

export function isOwnerLoginConfigured(env = ENV): boolean {
  return Boolean(env.ownerEmail && env.ownerPasswordHash);
}

export function isGuestLoginConfigured(env = ENV): boolean {
  return Boolean(env.guestPasscodeHash);
}

export function ownerTotpEnabled(env = ENV): boolean {
  return Boolean(env.ownerTotpSecret);
}

export function authMode(env = ENV) {
  return {
    managedOAuth: Boolean(env.oAuthServerUrl),
    ownerLogin: isOwnerLoginConfigured(env),
    ownerTotp: ownerTotpEnabled(env),
    guestLogin: isGuestLoginConfigured(env),
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

/** The entrance passcode: any well-formed email, one shared passcode. */
export async function verifyGuestPasscode(email: string, passcode: string, env = ENV): Promise<boolean> {
  if (!isGuestLoginConfigured(env)) return false;
  const emailOk = isPlausibleEmail(email);
  const passcodeOk = await bcrypt.compare(passcode, env.guestPasscodeHash);
  return emailOk && passcodeOk;
}

export function isPlausibleEmail(email: string): boolean {
  const e = email.trim();
  return e.length >= 6 && e.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

export function ownerOpenId(env = ENV): string {
  return env.ownerOpenId || DEFAULT_OWNER_OPEN_ID;
}

/** Stable, non-reversible user id for a visitor email (fits the 64-char openId column). */
export function guestOpenId(email: string): string {
  const digest = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return GUEST_OPEN_ID_PREFIX + digest.slice(0, 40);
}

function clientKey(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0]!.trim();
  return req.socket?.remoteAddress ?? "unknown";
}

/** 400 unless every entrance disclaimer id is in the body. */
function acknowledgementsOk(req: Request, res: Response): boolean {
  const missing = missingAcknowledgements(req.body?.acknowledgements);
  if (missing.length === 0) return true;
  res.status(400).json({ error: "Every acknowledgement must be checked before signing in.", missing });
  return false;
}

/** Best-effort audit row; the sign-in succeeds even when the database is away. */
async function recordAcknowledgement(req: Request, openId: string, fallbackName: string, email: string) {
  try {
    const user = await db.getUserByOpenId(openId);
    if (!user?.id) return;
    await db.saveComplianceSignatureDb({
      userId: user.id,
      userName: user.name ?? fallbackName,
      userEmail: email,
      signedName: fallbackName,
      signedDate: new Date().toISOString().slice(0, 10),
      ipAddress: clientKey(req).slice(0, 45),
      userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].slice(0, 2000) : undefined,
    });
  } catch (error) {
    console.warn("[Login] acknowledgement not recorded:", (error as Error)?.message ?? error);
  }
}

async function issueSession(req: Request, res: Response, openId: string, name: string) {
  const sessionToken = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
  res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
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
    if (!acknowledgementsOk(req, res)) return;

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
      await recordAcknowledgement(req, openId, name, ENV.ownerEmail);
      await issueSession(req, res, openId, name);
      clearRateLimit(key);
      res.json({ ok: true, name });
    } catch (error) {
      console.error("[OwnerLogin] failed to establish session", error);
      res.status(500).json({ error: "Could not establish a session." });
    }
  });

  app.post(GUEST_LOGIN_PATH, async (req: Request, res: Response) => {
    if (!isGuestLoginConfigured()) {
      res.status(404).json({ error: "The entrance passcode is not configured on this host." });
      return;
    }
    const key = clientKey(req);
    const wait = checkRateLimit(key);
    if (wait > 0) {
      res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).` });
      return;
    }
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const passcode = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !passcode || passcode.length > 1024) {
      res.status(400).json({ error: "Email and passcode are required." });
      return;
    }
    if (!isPlausibleEmail(email)) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }
    if (!acknowledgementsOk(req, res)) return;

    const ok = await verifyGuestPasscode(email, passcode);
    if (!ok) {
      console.warn("[GuestLogin] rejected passcode from", key);
      res.status(401).json({ error: "That passcode is not correct." });
      return;
    }

    try {
      const openId = guestOpenId(email);
      const name = email.split("@")[0]!.slice(0, 80) || "Guest";
      await db.upsertUser({
        openId,
        name,
        email: email.toLowerCase(),
        loginMethod: "guest-passcode",
        role: "user",
        lastSignedIn: new Date(),
      });
      await recordAcknowledgement(req, openId, name, email.toLowerCase());
      await issueSession(req, res, openId, name);
      clearRateLimit(key);
      res.json({ ok: true, name });
    } catch (error) {
      console.error("[GuestLogin] failed to establish session", error);
      res.status(500).json({ error: "Could not establish a session." });
    }
  });
}
