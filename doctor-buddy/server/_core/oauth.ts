import { COOKIE_NAME } from "@shared/const";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_COOKIE = "doctorbuddy_oauth_state";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function safeReturnPath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/";
}

function stateSecret() {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is required");
  return ENV.cookieSecret;
}

function signState(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", stateSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyState(state: string) {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) throw new Error("Invalid OAuth state");
  const expected = crypto.createHmac("sha256", stateSecret()).update(encoded).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("Invalid OAuth state signature");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!payload?.nonce || !payload?.redirectUri || !payload?.issuedAt) throw new Error("Malformed OAuth state");
  if (Date.now() - Number(payload.issuedAt) > OAUTH_STATE_MAX_AGE_MS) throw new Error("OAuth state expired");
  return payload as { nonce: string; redirectUri: string; returnPath: string; issuedAt: number };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", (req: Request, res: Response) => {
    try {
      const portal = ENV.oAuthPortalUrl;
      if (!portal || !ENV.appId) return res.status(503).json({ error: "Sign-in is not configured" });
      const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") || `${req.protocol}://${req.get("host")}`;
      const redirectUri = `${base}/api/oauth/callback`;
      const nonce = crypto.randomBytes(24).toString("base64url");
      const returnPath = safeReturnPath(getQueryParam(req, "returnPath"));
      const state = signState({ nonce, redirectUri, returnPath, issuedAt: Date.now() });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(OAUTH_STATE_COOKIE, nonce, { ...cookieOptions, maxAge: OAUTH_STATE_MAX_AGE_MS });

      const url = new URL("/app-auth", portal);
      url.searchParams.set("appId", ENV.appId);
      url.searchParams.set("redirectUri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("type", "signIn");
      res.redirect(302, url.toString());
    } catch (error) {
      console.error("[OAuth] Start failed", error);
      res.status(500).json({ error: "Sign-in could not be started" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) return res.status(400).json({ error: "code and state are required" });

    try {
      const parsed = verifyState(state);
      const rawCookies = req.headers.cookie || "";
      const nonceMatch = rawCookies.split(";").map(v => v.trim()).find(v => v.startsWith(`${OAUTH_STATE_COOKIE}=`));
      const nonceCookie = nonceMatch ? decodeURIComponent(nonceMatch.slice(OAUTH_STATE_COOKIE.length + 1)) : undefined;
      if (!nonceCookie || nonceCookie !== parsed.nonce) return res.status(400).json({ error: "OAuth state did not match this browser session" });

      const expectedBase = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
      if (expectedBase && parsed.redirectUri !== `${expectedBase}/api/oauth/callback`) throw new Error("OAuth redirect URI mismatch");

      const tokenResponse = await sdk.exchangeCodeForToken(code, state, parsed.redirectUri);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) return res.status(400).json({ error: "openId missing from user info" });

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: SESSION_MAX_AGE_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
      res.redirect(302, safeReturnPath(parsed.returnPath));
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(400).json({ error: "Sign-in failed or expired. Please start again." });
    }
  });
}
