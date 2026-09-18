/**
 * Cross-site front door.
 *
 * The bare domain https://russellcapitalsystems.com is served by GitHub Pages
 * (valid certificate, no DNS dependency on the registrar), and that static
 * build calls this Railway origin for every API request. Two things have to
 * hold for that to work as if it were same-origin:
 *
 *  1. CORS with credentials for the allowed front-door origins, and a CSRF
 *     guard so a cross-site cookie can never be ridden by another site.
 *  2. A session bridge for browsers that refuse third-party cookies (Safari,
 *     and any browser with third-party cookies off): every cookie the server
 *     sets on a cross-site response is ALSO handed back in an
 *     `X-Set-Session` header, which the front end keeps in localStorage and
 *     returns on every request as `X-Session` (or `_session` on an
 *     EventSource URL, which cannot carry headers). The bridge merges those
 *     values into the request's Cookie header before any other middleware
 *     runs, so nothing else in the server knows or cares.
 *
 * Same-origin requests (the Railway domain itself, or www once its
 * certificate exists) are untouched: no CORS headers, cookies stay
 * SameSite=Lax, and no bridge header is emitted.
 */
import type { CookieOptions, Express, NextFunction, Request, Response } from "express";

const DEFAULT_ORIGINS = ["https://russellcapitalsystems.com", "https://www.russellcapitalsystems.com"];

export function allowedOrigins(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const extra = (env.CORS_ORIGINS || "").split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...extra]);
}

function ownOrigin(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() || req.protocol || "https";
  return `${proto}://${req.get("host") ?? ""}`.toLowerCase();
}

/** True when the request comes from an allowed front door on another origin. */
export function isCrossSiteRequest(req: Request, allowed: Set<string> = allowedOrigins()): boolean {
  const origin = (req.headers.origin as string | undefined)?.toLowerCase().replace(/\/$/, "");
  if (!origin) return false;
  if (origin === ownOrigin(req)) return false;
  return allowed.has(origin);
}

/** Parse "a=1; b=2" (values URL-encoded) into pairs; tolerant of junk. */
export function parseSessionHeader(raw: unknown): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const text = Array.isArray(raw) ? raw.join(";") : String(raw ?? "");
  if (!text || text.length > 8192) return out;
  for (const part of text.split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    const name = part.slice(0, i).trim();
    if (!/^[A-Za-z0-9_.-]{1,64}$/.test(name)) continue;
    let value = part.slice(i + 1).trim();
    try { value = decodeURIComponent(value); } catch { /* keep raw */ }
    if (value.length > 4096 || /[\r\n;]/.test(value)) continue;
    out.push([name, value]);
  }
  return out;
}

/**
 * Register the CORS, CSRF and session-bridge middleware. Call this before
 * body parsers and before anything that reads cookies.
 */
export function registerCrossSite(app: Express, env: NodeJS.ProcessEnv = process.env) {
  const allowed = allowedOrigins(env);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = (req.headers.origin as string | undefined)?.toLowerCase().replace(/\/$/, "");
    const own = ownOrigin(req);
    const crossSite = !!origin && origin !== own && allowed.has(origin);

    // CSRF guard: a request that names a foreign origin we do not trust may
    // not change anything. Webhooks and server-to-server calls carry no
    // Origin header and are unaffected.
    if (origin && origin !== own && !allowed.has(origin) && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return res.status(403).json({ error: "Cross-site request refused" });
    }

    if (crossSite) {
      res.setHeader("Access-Control-Allow-Origin", origin!);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "content-type, authorization, x-session, x-requested-with, x-trpc-source, trpc-accept");
      res.setHeader("Access-Control-Expose-Headers", "x-set-session, x-clear-session");
      res.setHeader("Access-Control-Max-Age", "600");
      const vary = res.getHeader("Vary");
      res.setHeader("Vary", vary ? `${vary}, Origin` : "Origin");
      if (req.method === "OPTIONS") return res.status(204).end();
    }

    // Inbound bridge: X-Session header, or _session on an EventSource URL.
    const bridged = parseSessionHeader(req.headers["x-session"] ?? (typeof req.query._session === "string" ? req.query._session : ""));
    if (bridged.length) {
      const existing = req.headers.cookie ? `${req.headers.cookie}; ` : "";
      req.headers.cookie = existing + bridged.map(([k, v]) => `${k}=${v}`).join("; ");
      if (typeof req.query._session === "string") delete (req.query as Record<string, unknown>)._session;
    }

    // Outbound bridge: on a cross-site response, every cookie becomes
    // SameSite=None; Secure AND is mirrored into X-Set-Session / X-Clear-Session.
    if (crossSite) {
      const setCookie = res.cookie.bind(res) as (name: string, value: string, options?: CookieOptions) => Response;
      const clearCookie = res.clearCookie.bind(res) as (name: string, options?: CookieOptions) => Response;
      const appendHeader = (header: string, entry: string) => {
        const cur = res.getHeader(header);
        res.setHeader(header, cur ? `${cur}; ${entry}` : entry);
      };
      res.cookie = ((name: string, value: string, options: CookieOptions = {}) => {
        const out = setCookie(name, value, { ...options, sameSite: "none", secure: true });
        appendHeader("X-Set-Session", `${name}=${encodeURIComponent(String(value))}`);
        return out;
      }) as Response["cookie"];
      res.clearCookie = ((name: string, options: CookieOptions = {}) => {
        const out = clearCookie(name, { ...options, sameSite: "none", secure: true });
        appendHeader("X-Clear-Session", name);
        return out;
      }) as Response["clearCookie"];
    }
    return next();
  });
}
