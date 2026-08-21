import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", true); // read x-forwarded-proto/host behind the deployment proxy

  // ── HTTPS + canonical-host redirects (production only) ─────────────────────
  // CANONICAL_HOST (e.g. "joinaqal.com") 301s www/other aliases onto one host
  // so search engines see a single URL per page. HTTP 301s to HTTPS.
  const CANONICAL_HOST = (process.env.CANONICAL_HOST ?? "").trim();
  if (process.env.NODE_ENV !== "development") {
    app.use((req, res, next) => {
      const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
      const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host ?? "";
      const wrongProto = proto === "http";
      const wrongHost = CANONICAL_HOST && host && host !== CANONICAL_HOST && !host.startsWith("localhost");
      if ((wrongProto || wrongHost) && req.method === "GET") {
        return res.redirect(301, `https://${wrongHost ? CANONICAL_HOST : host}${req.originalUrl}`);
      }
      next();
    });
  }

  // ── Security headers on every response ─────────────────────────────────────
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(), payment=()");
    if (process.env.NODE_ENV !== "development" && (req.headers["x-forwarded-proto"] ?? req.protocol) === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    }
    next();
  });

  // Stripe webhook MUST be registered before body parsers
  const { stripeRouter } = await import("../stripe/index");
  app.use("/api/stripe", stripeRouter);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Platform storage routes (S3/R2 signed-redirect + local filesystem).
  const { storageGetSignedUrl, LOCAL_STORAGE_DIR } = await import("../platform/storage");
  app.get("/s3-storage/*", async (req, res) => {
    try {
      const key = (req.params as Record<string, string>)[0];
      res.set("Cache-Control", "no-store");
      res.redirect(307, await storageGetSignedUrl(key));
    } catch {
      res.status(502).send("Storage error");
    }
  });
  app.use("/local-storage", express.static(LOCAL_STORAGE_DIR));

  // Health + platform provider status (which backends are live vs. mock).
  const { platformStatus } = await import("../platform/config");
  app.get("/health", (_req, res) => res.json({ ok: true, platform: platformStatus() }));

  // Scheduled handlers (before tRPC and Vite fallthrough)
  const { driftAlertHandler } = await import("../scheduledDriftAlert");
  app.post("/api/scheduled/drift-alert", driftAlertHandler);
  const { trackerReengagementHandler } = await import("../scheduledTrackerReengagement");
  app.post("/api/scheduled/tracker-reengagement", trackerReengagementHandler);
  const { finishNudgeHandler } = await import("../scheduledFinishNudge");
  app.post("/api/scheduled/finish-nudge", finishNudgeHandler);
  const { messageDigestHandler } = await import("../scheduledMessageDigest");
  app.post("/api/scheduled/message-digest", messageDigestHandler);
  const { reentryHandler } = await import("../scheduledReentry");
  app.post("/api/scheduled/reentry", reentryHandler);
  // Client-side error intake: member-facing breakage becomes visible.
  app.post("/api/client-error", express.json({ limit: "16kb" }), async (req, res) => {
    try {
      const { checkLimit, clientIp } = await import("../rateLimit");
      if (!checkLimit(`cerr:${clientIp(req as never)}`, 10, 60 * 60 * 1000)) { res.json({ ok: true }); return; }
      const { recordEvent } = await import("../db");
      const b = (req.body ?? {}) as { message?: string; stack?: string; url?: string; ua?: string };
      await recordEvent({ type: "client_error", ok: false, meta: {
        message: String(b.message ?? "").slice(0, 300), stack: String(b.stack ?? "").slice(0, 800),
        url: String(b.url ?? "").slice(0, 200), ua: String(b.ua ?? "").slice(0, 160),
      }});
    } catch { /* error intake must never error */ }
    res.json({ ok: true });
  });
  // ── Core Web Vitals intake — first-party, no third-party tracker ───────────
  // The client posts one small beacon per pageview with LCP/CLS/INP. Lands in
  // analytics as "web_vitals" so page speed is monitored from real users.
  app.post("/api/vitals", express.json({ limit: "4kb" }), async (req, res) => {
    try {
      const { checkLimit, clientIp } = await import("../rateLimit");
      if (!checkLimit(`vitals:${clientIp(req as never)}`, 30, 60 * 60 * 1000)) { res.json({ ok: true }); return; }
      const { recordEvent } = await import("../db");
      const b = (req.body ?? {}) as { path?: string; lcp?: number; cls?: number; inp?: number; ttfb?: number };
      const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? Math.round(v * 1000) / 1000 : null);
      await recordEvent({ type: "web_vitals", meta: {
        path: String(b.path ?? "").slice(0, 120),
        lcp: num(b.lcp), cls: num(b.cls), inp: num(b.inp), ttfb: num(b.ttfb),
      }});
    } catch { /* vitals intake must never error */ }
    res.json({ ok: true });
  });

  // ── robots.txt + sitemap.xml, generated from the shared SEO table ──────────
  {
    const { SITE_ORIGIN, SITEMAP_PATHS, NOINDEX_PATHS, canonicalUrl } = await import("@shared/seo");
    app.get("/robots.txt", (_req, res) => {
      const lines = [
        "User-agent: *",
        ...NOINDEX_PATHS.map((p) => `Disallow: ${p}`),
        "Disallow: /api/",
        "Allow: /",
        "",
        `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
      ];
      res.type("text/plain").send(lines.join("\n"));
    });
    app.get("/sitemap.xml", (_req, res) => {
      const urls = SITEMAP_PATHS.map((p, i) =>
        `  <url><loc>${canonicalUrl(p)}</loc><changefreq>weekly</changefreq><priority>${i === 0 ? "1.0" : "0.7"}</priority></url>`
      ).join("\n");
      res.type("application/xml").send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
      );
    });
  }

  const { questionOfDayHandler } = await import("../scheduledQuestionOfDay");
  app.post("/api/scheduled/question-of-day", questionOfDayHandler);
  // Make sure the Heartbeat cron service actually CALLS those routes —
  // idempotent, non-blocking, silently skipped when Heartbeat isn't configured.
  const { ensureScheduledJobs } = await import("../scheduledJobs");
  void ensureScheduledJobs();

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
