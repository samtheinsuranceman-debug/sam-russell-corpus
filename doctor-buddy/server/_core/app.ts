import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerEmailAuthRoutes } from "./emailAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { CLINICAL_TOOLS_ENABLED, PUBLIC_WELLNESS_MODE, RELEASE_POSTURE, releaseBlockers } from "../compliance/releasePolicy";
import { registerBillingRoutes, registerBillingWebhook } from "../billing";

/**
 * The whole HTTP application, without a port and without the process-level
 * concerns (release validation, retention scheduler, port discovery). The
 * entry point mounts it on a port; the assembled chaos harness mounts it on
 * an ephemeral one and fires ten thousand requests at it in-process.
 */
export async function buildApp() {
  const app = express();
  const server = createServer(app);
  // Security baseline for an internet-facing health/wellness application.
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests");
    }
    const sensitivePagePrefixes = [
      "/assessment", "/report", "/shared", "/research", "/dashboard", "/life-maps", "/life-events",
      "/ai-advisory", "/prs", "/digital-twin", "/admin", "/settings", "/progress", "/crisis", "/vital-signs",
      "/journal", "/wellness-plan", "/medications", "/doctor", "/patient", "/psychiatrist", "/physician-wellness", "/support-lab",
      "/finance",
    ];
    const sensitivePage = sensitivePagePrefixes.some(prefix => req.path === prefix || req.path.startsWith(`${prefix}/`));
    if (req.path.startsWith("/api/") || sensitivePage) {
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.setHeader("Pragma", "no-cache");
    }
    if (sensitivePage) res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    next();
  });


  // Reject cross-site state-changing browser requests. SameSite cookies already
  // reduce CSRF exposure; this explicit origin check is a second boundary.
  app.use((req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (process.env.NODE_ENV !== "production") return next();
    if (!origin) {
      const fetchSite = req.headers["sec-fetch-site"];
      if (fetchSite && !["same-origin", "same-site", "none"].includes(String(fetchSite))) {
        return res.status(403).json({ error: "Cross-site request blocked" });
      }
      return next();
    }
    try {
      const expected = new URL(process.env.PUBLIC_BASE_URL || "").origin;
      if (origin !== expected) return res.status(403).json({ error: "Cross-origin request blocked" });
    } catch {
      return res.status(500).json({ error: "Server origin is not configured" });
    }
    next();
  });

  // Stripe webhook verification requires the exact raw request bytes and must
  // therefore be registered before the ordinary JSON parser.
  registerBillingWebhook(app);

  // Keep request bodies small by default. Health reflections do not need 50 MB.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // Lightweight per-process abuse protection. Hosting/WAF rate limits should sit in front of this too.
  const buckets = new Map<string, { count: number; resetAt: number }>();
  app.use("/api", (req, res, next) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    if (buckets.size > 10_000) {
      for (const [bucketKey, value] of Array.from(buckets)) if (value.resetAt <= now) buckets.delete(bucketKey);
    }
    if (bucket.count > 180) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ error: "Too many requests. Please try again shortly." });
    }
    next();
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send([
      "User-agent: *",
      "Allow: /$",
      "Allow: /terms$",
      "Allow: /privacy$",
      "Allow: /health-data-privacy$",
      "Allow: /medical-disclaimer$",
      "Allow: /subscription-terms$",
      "Disallow: /api/",
      "Disallow: /settings",
      "Disallow: /assessment",
      "Disallow: /research",
      "Disallow: /ai-advisory",
      "Disallow: /progress",
      "Disallow: /journal",
      "Disallow: /wellness-plan",
      "Disallow: /medications",
      "Disallow: /patient",
      "Disallow: /support-lab",
      "Disallow: /finance",
      "Disallow: /doctor",
      "Disallow: /psychiatrist",
      "Disallow: /admin",
      "",
    ].join("\n"));
  });

  // Public security reporting channel. This is intentionally minimal and
  // contains no runtime secrets or internal infrastructure detail.
  app.get("/.well-known/security.txt", (_req, res) => {
    const email = process.env.SECURITY_CONTACT_EMAIL || process.env.PRIVACY_CONTACT_EMAIL || "";
    const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    res.type("text/plain").send([
      `Contact: mailto:${email}`,
      `Expires: ${expires}`,
      `Policy: ${(process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "")}/privacy`,
      "Preferred-Languages: en",
      "Canonical: " + (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "") + "/.well-known/security.txt",
    ].join("\n") + "\n");
  });

  // Simple deployment health check. It deliberately does not depend on the
  // database or external AI providers, so an orchestrator can distinguish
  // "the web process is alive" from downstream service availability.
  app.get("/healthz", (_req, res) => {
    const blockers = releaseBlockers();
    res.status(200).json({
      ok: true,
      service: "doctor-buddy",
      environment: process.env.NODE_ENV ?? "development",
      edition: CLINICAL_TOOLS_ENABLED ? "clinical" : PUBLIC_WELLNESS_MODE ? "public-wellness" : "none",
      posture: RELEASE_POSTURE,
      productionBlockers: blockers.length,
      timestamp: new Date().toISOString(),
    });
  });

  if (!PUBLIC_WELLNESS_MODE) registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerEmailAuthRoutes(app);
  registerBillingRoutes(app);
  // The API answers GET, POST and OPTIONS. Anything else is refused before the
  // router sees it, as JSON, with the methods it does accept.
  app.use("/api", (req, res, next) => {
    if (["GET", "POST", "OPTIONS", "HEAD"].includes(req.method)) return next();
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Anything under /api that nothing above answered is a JSON 404, never the
  // SPA shell with a 200.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Last resort. Body-parser rejects (malformed JSON, oversized bodies), static
  // file misses and anything thrown by a route land here and leave as a small
  // JSON answer with a status and no stack, whatever NODE_ENV says.
  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const e = (err ?? {}) as { status?: number; statusCode?: number; type?: string; message?: string };
    const status = Number(e.status ?? e.statusCode) || 500;
    const error =
      status === 413 ? "Request too large"
      : status === 415 ? "Unsupported media type"
      : status >= 400 && status < 500 ? "Malformed request"
      : "Server error";
    if (status >= 500) console.error("[http]", req.method, req.path, String(e.message ?? err).slice(0, 200));
    if (res.headersSent) return;
    res.status(status).json({ error });
  });

  return { app, server };
}
