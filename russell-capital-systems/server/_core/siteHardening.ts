// ============================================================
// SITE HARDENING — the hosting, security and technical-SEO layer every
// response passes through:
//   • one canonical origin: http → https and apex ↔ www 301s (CANONICAL_HOST)
//   • security headers: HSTS, CSP, frame, sniff, referrer, permissions
//   • robots.txt, sitemap.xml and /healthz served from the catalogue
//   • cache policy per asset class, gzip/brotli via `compression`
//   • HTML rendered per route with its own title, description, canonical,
//     social tags and structured data — and a real 404 status for paths the
//     app does not know, so crawlers never see "soft 404s"
// Everything here is pure where it can be, so the tests can prove it.
// ============================================================
import type { Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { businessIdentityFrom, seoFor, sitemapPages, structuredData, SITE_NAME, type BusinessIdentity } from "../../shared/seo";

type Env = Record<string, string | undefined>;

// ── Origin and canonical host ──────────────────────────────────────────────

export type RequestFacts = { host: string; proto: "http" | "https"; url: string; path: string };

export function requestFacts(req: Request): RequestFacts {
  const fwdHost = req.headers["x-forwarded-host"];
  const fwdProto = req.headers["x-forwarded-proto"];
  const host = (typeof fwdHost === "string" && fwdHost.split(",")[0]!.trim()) || req.headers.host || "localhost";
  const proto = (typeof fwdProto === "string" && fwdProto.split(",")[0]!.trim() === "https") || req.secure ? "https" : "http";
  // originalUrl, not req.path: inside app.use("*") Express strips the mount and req.path is "/".
  const url = req.originalUrl || req.url || "/";
  return { host, proto, url, path: url.split(/[?#]/)[0] || "/" };
}

/** The host every public URL should carry, when the owner has set one. */
export function canonicalHost(env: Env = process.env): string | null {
  const h = env.CANONICAL_HOST?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return h || null;
}

/** The origin used in canonical links, the sitemap and structured data. */
export function siteOrigin(facts: RequestFacts, env: Env = process.env): string {
  const base = env.PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (base && /^https?:\/\//.test(base)) return base;
  const ch = canonicalHost(env);
  if (ch) return `https://${ch}`;
  return `${facts.proto}://${facts.host}`;
}

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

/**
 * Where a request must be redirected to reach the canonical origin, or null
 * when it is already there. Rules:
 *  • never for API, health or local development hosts
 *  • http → https for any host that is (or is the www/apex sibling of) the canonical host
 *  • apex ↔ www: the sibling of CANONICAL_HOST 301s to it
 *  • other hosts (the platform's own *.railway.app domain, previews) are left
 *    alone unless CANONICAL_REDIRECT_ALL_HOSTS=1 — a canonical <link> still
 *    points crawlers at the right origin.
 */
export function canonicalRedirectTarget(facts: RequestFacts, env: Env = process.env): string | null {
  if (facts.path.startsWith("/api/") || facts.path === "/healthz") return null;
  const host = facts.host.toLowerCase();
  if (LOCAL_HOSTS.test(host)) return null;
  const canon = canonicalHost(env);
  if (!canon) return null;
  const bare = (h: string) => h.replace(/^www\./, "");
  const sibling = bare(host) === bare(canon);
  const forceAll = env.CANONICAL_REDIRECT_ALL_HOSTS === "1";
  if (host === canon && facts.proto === "https") return null;
  if (!sibling && !forceAll) return null;
  return `https://${canon}${facts.url}`;
}

// ── Security headers ───────────────────────────────────────────────────────

function origin(u?: string): string | null {
  if (!u) return null;
  try { return new URL(u).origin; } catch { return null; }
}

/** The Content-Security-Policy for production HTML. Built from the same environment the client reads its analytics ids from, so nothing the host switched on gets blocked. */
export function cspFor(env: Env = process.env): string {
  const scripts = new Set<string>([
    "'self'",
    "https://www.googletagmanager.com", "https://www.google-analytics.com",
    "https://maps.googleapis.com", "https://maps.gstatic.com",
    "https://widget.intercom.io", "https://js.intercomcdn.com",
    "https://js.sentry-cdn.com", "https://browser.sentry-cdn.com",
  ]);
  for (const o of [origin(env.POSTHOG_HOST || "https://us.i.posthog.com"), origin(env.SENTRY_LOADER_URL), origin(env.VITE_ANALYTICS_ENDPOINT), origin(env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev")]) if (o) scripts.add(o);
  for (const extra of (env.CSP_EXTRA_SRC ?? "").split(/[\s,]+/).filter(Boolean)) scripts.add(extra);
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    `script-src ${Array.from(scripts).join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export type CspMode = "enforce" | "report-only" | "off";
export function cspMode(env: Env = process.env): CspMode {
  const m = (env.CSP_MODE ?? "").toLowerCase();
  if (m === "off" || m === "0" || m === "false") return "off";
  if (m === "report-only" || m === "report") return "report-only";
  return "enforce";
}

/** Every security header a response carries. HSTS only over TLS (a browser ignores it otherwise, and a plain-http dev server must not pin it). */
export function securityHeaders(facts: RequestFacts, env: Env = process.env): Record<string, string> {
  const production = env.NODE_ENV === "production";
  const h: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "X-DNS-Prefetch-Control": "on",
  };
  if (facts.proto === "https" && production) h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  if (production && !facts.path.startsWith("/api/")) {
    const mode = cspMode(env);
    if (mode === "enforce") h["Content-Security-Policy"] = cspFor(env);
    else if (mode === "report-only") h["Content-Security-Policy-Report-Only"] = cspFor(env);
  }
  return h;
}

// ── Cache policy ───────────────────────────────────────────────────────────

/** Hashed bundles live forever; images a day; the entry files and HTML always revalidate. */
export function cacheControlFor(p: string): string {
  if (/^\/assets\/(chunks|media)\//.test(p)) return "public, max-age=31536000, immutable";
  if (/\.(webp|avif|png|jpe?g|gif|svg|ico|woff2?|ttf|mp3|mp4)$/i.test(p)) return "public, max-age=86400, stale-while-revalidate=604800";
  if (/^\/assets\//.test(p)) return "public, max-age=0, must-revalidate";
  if (p === "/sitemap.xml" || p === "/robots.txt") return "public, max-age=3600";
  return "no-cache";
}

// ── robots.txt and sitemap.xml ────────────────────────────────────────────

export function robotsTxt(originUrl: string): string {
  const disallow = ["/portal/", "/api/", "/administrator", "/executive", "/onboarding", "/trial", "/invite", "/reset-password", "/shared/", "/shared-slides/", "/video/", "/client-portal/", "/login", "/register", "/forgot-password"];
  return ["User-agent: *", "Allow: /", ...disallow.map((d) => `Disallow: ${d}`), "", `Sitemap: ${originUrl}/sitemap.xml`, ""].join("\n");
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function sitemapXml(originUrl: string, lastmod: string): string {
  const rows = sitemapPages().map((pg) => `  <url><loc>${xml(originUrl + pg.path)}</loc><lastmod>${lastmod}</lastmod><changefreq>${pg.changefreq}</changefreq><priority>${pg.priority.toFixed(1)}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

// ── Route knowledge (real 404s) ───────────────────────────────────────────

/** Turns wouter patterns (`/portal/tax-combos/:id`, `/docs/*`) into matchers. */
export function compileRoutes(patterns: string[]): RegExp[] {
  return patterns.map((p) => new RegExp("^" + p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/:[A-Za-z0-9_]+\??/g, "[^/]+") + "/?$"));
}

export function isKnownRoute(p: string, routes: RegExp[]): boolean {
  if (!routes.length) return true; // no manifest: never claim a page is missing
  const clean = p.split(/[?#]/)[0] || "/";
  return routes.some((r) => r.test(clean));
}

// ── HTML rendering ─────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type RenderInput = { template: string; path: string; origin: string; env?: Env; known?: boolean };

/** Injects the page's head tags into the built index.html. Idempotent on the marker so a re-render never doubles up. */
export function renderHtml({ template, path: p, origin: o, env = process.env, known = true }: RenderInput): { html: string; status: number } {
  const seo = seoFor(p);
  const biz: BusinessIdentity = businessIdentityFrom(env);
  const notFound = !known;
  const title = notFound ? `Page not found | ${SITE_NAME}` : seo.title;
  const robots = notFound ? "noindex,nofollow" : seo.robots;
  const canonical = `${o}${seo.path === "/" ? "/" : seo.path}`;
  const image = `${o}${seo.image}`;
  const tags: string[] = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta name="theme-color" content="#03090a" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ];
  if (env.GOOGLE_SITE_VERIFICATION) tags.push(`<meta name="google-site-verification" content="${esc(env.GOOGLE_SITE_VERIFICATION)}" />`);
  if (env.BING_SITE_VERIFICATION) tags.push(`<meta name="msvalidate.01" content="${esc(env.BING_SITE_VERIFICATION)}" />`);
  if (seo.path === "/") tags.push(`<link rel="preload" as="image" href="/rcs-neon-a.webp" fetchpriority="high" />`);
  if (!notFound && robots === "index,follow") {
    tags.push(`<script type="application/ld+json">${JSON.stringify(structuredData(o, seo, biz)).replace(/</g, "\\u003c")}</script>`);
  }
  const block = `<!--seo-->\n    ${tags.join("\n    ")}\n    <!--/seo-->`;
  let html = template;
  if (/<!--seo-->[\s\S]*?<!--\/seo-->/.test(html)) html = html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, block);
  else if (/<title>[\s\S]*?<\/title>/.test(html)) html = html.replace(/<title>[\s\S]*?<\/title>/, block);
  else html = html.replace("</head>", `${block}\n  </head>`);
  return { html, status: notFound ? 404 : 200 };
}

// ── Express wiring ─────────────────────────────────────────────────────────

export const SERVER_STARTED_AT = new Date();

/** Redirects, headers and compression. Mount first. */
export async function registerSiteHardening(app: Express) {
  let compress: ((req: Request, res: Response, next: NextFunction) => void) | null = null;
  try {
    const mod = await import("compression");
    compress = (mod.default ?? mod)({ threshold: 1024 });
  } catch (e) {
    console.warn("[site] compression unavailable:", (e as Error).message);
  }
  app.use((req, res, next) => {
    const facts = requestFacts(req);
    const target = canonicalRedirectTarget(facts);
    if (target) { res.redirect(301, target); return; }
    for (const [k, v] of Object.entries(securityHeaders(facts))) res.setHeader(k, v);
    if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
    next();
  });
  if (compress) app.use(compress);
}

/** robots.txt, sitemap.xml and the uptime probe. Mount before the SPA fallback. */
export function registerSiteRoutes(app: Express, opts: { dbPing?: () => Promise<boolean> } = {}) {
  app.get("/robots.txt", (req, res) => {
    res.setHeader("Cache-Control", cacheControlFor("/robots.txt"));
    res.type("text/plain").send(robotsTxt(siteOrigin(requestFacts(req))));
  });
  app.get("/sitemap.xml", (req, res) => {
    res.setHeader("Cache-Control", cacheControlFor("/sitemap.xml"));
    res.type("application/xml").send(sitemapXml(siteOrigin(requestFacts(req)), SERVER_STARTED_AT.toISOString().slice(0, 10)));
  });
  app.get("/healthz", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    let db: "ok" | "off" | "error" = "off";
    if (opts.dbPing) {
      try { db = (await Promise.race([opts.dbPing(), new Promise<boolean>((r) => setTimeout(() => r(false), 3000))])) ? "ok" : "error"; } catch { db = "error"; }
    }
    const ok = db !== "error";
    res.status(ok ? 200 : 503).json({ ok, db, uptimeSeconds: Math.round(process.uptime()), startedAt: SERVER_STARTED_AT.toISOString(), version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.APP_VERSION ?? null });
  });
}

/** Loads the route patterns the build wrote (dist/public/routes.json); empty when absent. */
export function loadRoutePatterns(distPath: string): RegExp[] {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(distPath, "routes.json"), "utf8")) as { routes?: string[] } | string[];
    const list = Array.isArray(raw) ? raw : raw.routes ?? [];
    return compileRoutes(list.filter((r) => typeof r === "string"));
  } catch {
    return [];
  }
}
