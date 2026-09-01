import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./staticServe";
import { canonicalRedirectLocation } from "./canonical";

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
  // www.joinaqal.com is the sole production canonical host. Redirect only the
  // known bare domain; managed deployment origins must remain directly healthy
  // for platform routing, validation, and rollback access.
  const CANONICAL_HOST = (process.env.CANONICAL_HOST ?? "www.joinaqal.com")
    .trim()
    .toLowerCase();
  if (process.env.NODE_ENV !== "development") {
    app.use((req, res, next) => {
      const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
      const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host ?? "";
      const location = canonicalRedirectLocation({
        method: req.method,
        proto,
        host,
        originalUrl: req.originalUrl,
        canonicalHost: CANONICAL_HOST,
      });
      if (location) return res.redirect(301, location);
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
    // Production only: the Vite dev server needs inline/eval scripts for HMR.
    // Fonts are self-hosted (bundled @fontsource files), so no font origin is
    // whitelisted. 'unsafe-inline' styles are required by React inline style
    // attributes; frame-src is limited to the video players toEmbed can
    // produce: YouTube, Vimeo, and HeyGen.
    if (process.env.NODE_ENV !== "development") {
      res.setHeader("Content-Security-Policy", [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "img-src 'self' data: blob:",
        "media-src 'self' blob: https:",
        "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://app.heygen.com https://share.heygen.com",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ].join("; "));
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
  const { twilioInboundHandler } = await import("../twilioInbound");
  app.post("/api/webhooks/twilio/inbound", twilioInboundHandler);
  // Cross-company integration surface (/api/v1/joinaqal/*) per the
  // API Integration Specification v1.0 — see server/integrationApi.ts.
  const { registerIntegrationApi } = await import("../integrationApi");
  registerIntegrationApi(app);

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

  // Public norming changelog — regulatory-transparency embodiment: every
  // norming snapshot ever used, with its description, so any historical score
  // can be traced to the exact population model it was computed under.
  app.get("/api/norms/changelog", async (_req, res) => {
    const { NORMING_SNAPSHOTS, ACTIVE_NORMING_VERSION } = await import("../scoring/norming");
    res.set("Cache-Control", "public, max-age=3600");
    res.json({
      active: ACTIVE_NORMING_VERSION,
      versions: Object.values(NORMING_SNAPSHOTS).map((s) => ({
        version: s.version,
        description: s.description,
      })),
    });
  });

  // Public ledger integrity check — anyone can confirm the append-only audit
  // chain verifies end to end. Returns chain length + validity, never payloads.
  app.get("/api/ledger/verify", async (_req, res) => {
    const { verifyLedger } = await import("../patents/ledger");
    const result = await verifyLedger();
    res.set("Cache-Control", "no-store");
    if (!result) return res.status(503).json({ ok: false, reason: "ledger unavailable" });
    res.json({ ok: result.valid, length: result.length, firstInvalidId: result.badId });
  });

  // Marketing-email opt-out. GET is confirmation-only so link scanners cannot
  // silently change state; RFC 8058 mail clients POST to the same signed URL.
  app.get("/api/unsubscribe", async (req, res) => {
    const { readUnsubscribeToken } = await import("../platform/email");
    const token = typeof req.query.t === "string" ? req.query.t : "";
    const valid = Boolean(readUnsubscribeToken(token));
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    res.status(valid ? 200 : 400).type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AQAL Email Preferences</title></head><body style="margin:0;background:#141009;color:#F1EADB;font-family:Georgia,serif"><main style="max-width:560px;margin:10vh auto;padding:32px"><p style="font-family:monospace;letter-spacing:.2em;color:#E0C68C">AQAL · EMAIL PREFERENCES</p>${valid ? `<h1>Stop marketing and reminder emails?</h1><p>This stops optional reminders and promotional messages. Verification, password reset, receipts, security notices, and results you explicitly request can still arrive.</p><form method="post" action="/api/unsubscribe"><input type="hidden" name="t" value="${token.replace(/[&<>"']/g, "")}"><button type="submit" style="padding:12px 18px;background:#E0C68C;color:#141009;border:0;border-radius:4px;font-weight:700">Unsubscribe</button></form>` : `<h1>This link is invalid or expired.</h1><p>Sign in to AQAL to update your email preferences.</p>`}</main></body></html>`);
  });
  app.post("/api/unsubscribe", async (req, res) => {
    const { readUnsubscribeToken } = await import("../platform/email");
    const token = typeof req.query.t === "string"
      ? req.query.t
      : typeof req.body?.t === "string"
        ? req.body.t
        : "";
    const email = readUnsubscribeToken(token);
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    if (!email) return res.status(400).type("text").send("Invalid unsubscribe token");
    try {
      const { getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.status(503).type("text").send("Email preferences are temporarily unavailable");
      await db.update(users).set({ emailOptOutAt: new Date() }).where(eq(users.email, email));
      return res.status(200).type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed · AQAL</title></head><body style="margin:0;background:#141009;color:#F1EADB;font-family:Georgia,serif"><main style="max-width:560px;margin:10vh auto;padding:32px"><p style="font-family:monospace;letter-spacing:.2em;color:#E0C68C">AQAL · EMAIL PREFERENCES</p><h1>You are unsubscribed.</h1><p>Optional marketing and reminder emails are off. Account, security, receipt, and explicitly requested result messages can still arrive.</p><p><a href="/login" style="color:#E0C68C">Sign in to manage preferences</a></p></main></body></html>`);
    } catch (error) {
      console.error("[unsubscribe] preference update failed", error);
      return res.status(500).type("text").send("Email preferences could not be updated");
    }
  });

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
  const { dailyRemindersHandler } = await import("../scheduledDailyReminders");
  app.post("/api/scheduled/daily-reminders", dailyRemindersHandler);
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

  // ── Patent-engine boot activation (best-effort, never blocks startup) ──────
  // 1. Seed the research-provenance table: all 32 lines mapped to their real
  //    research traditions (idempotent upsert; DOIs stay null — never invented).
  // 2. Commit the active norming version to the audit ledger, but only when it
  //    differs from the last recorded norm_version entry (no duplicate spam).
  void (async () => {
    try {
      const { seedProvenance } = await import("../patents/provenanceSeed");
      const seeded = await seedProvenance();
      if (seeded > 0) console.log(`[patents] research provenance seeded: ${seeded} lines`);

      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return;
      const { auditLedger } = await import("../../drizzle/schema");
      const { desc, eq } = await import("drizzle-orm");
      const { ACTIVE_NORMING_VERSION, NORMING_SNAPSHOTS } = await import("../scoring/norming");
      const last = await db.select({ payload: auditLedger.payload })
        .from(auditLedger).where(eq(auditLedger.kind, "norm_version"))
        .orderBy(desc(auditLedger.id)).limit(1);
      const lastVersion = (last[0]?.payload as { version?: string } | undefined)?.version;
      if (lastVersion !== ACTIVE_NORMING_VERSION) {
        const { appendLedgerEntry } = await import("../patents/ledger");
        await appendLedgerEntry("norm_version", {
          version: ACTIVE_NORMING_VERSION,
          description: NORMING_SNAPSHOTS[ACTIVE_NORMING_VERSION]?.description ?? "",
        });
        console.log(`[patents] norm_version ledger entry appended: ${ACTIVE_NORMING_VERSION}`);
      }
    } catch (e) {
      console.warn("[patents] boot activation skipped:", String(e).slice(0, 150));
    }
  })();

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
    // Non-literal specifier: keeps ./vite (and the vite devDependency it
    // statically imports) completely OUT of the production bundle. This
    // branch only runs under tsx in development, where the file resolves.
    const devViteModule = "./vite" as string;
    const { setupVite } = await import(devViteModule);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  // Production ingress targets exactly process.env.PORT. Falling back to a
  // different port would leave a healthy process unreachable from the web.
  // Keep free-port discovery as a local development convenience only.
  const port = process.env.NODE_ENV === "development"
    ? await findAvailablePort(preferredPort)
    : preferredPort;
  const bindHost = (process.env.BIND_HOST || "0.0.0.0").trim();

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, bindHost, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
