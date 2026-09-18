import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerOwnerLoginRoutes } from "./ownerLogin";
import { registerRoomVideoRoutes } from "./roomVideos";
import { registerStorageProxy } from "./storageProxy";
import { registerMailRoutes } from "./mailer";
import { registerSmsRoutes } from "./sms";
import { registerWhispererRoutes, registerZoomWebhook, startWhispererScheduler } from "../whisperer";
import { registerScheduledRoutes, startFollowupScheduler } from "../followups";
import { registerEventRoutes } from "../automations";
import { startHarvestSchedule } from "../forecastSources";
import { startPulseSchedule } from "../power";
import { startZipSchedule } from "../zipData";
import { startRentalSchedule } from "../rentalData";
import { startCareerSchedule } from "../careerData";
import { startHazardSchedule } from "../rentalEnterprise";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSiteHardening, registerSiteRoutes } from "./siteHardening";
import { registerVitalsRoutes } from "../vitals";
import { registerFounderVoice } from "../founderVoice";
import { registerPartnerApi } from "../partnerApi";
import { startBackupSchedule } from "../backups";
import { pingDatabase } from "../db";
import { registerCrossSite } from "./crossSite";

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
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  // The bare domain is served by GitHub Pages and calls this origin for its
  // API; CORS, CSRF guard and the cookie session bridge live in crossSite.ts.
  registerCrossSite(app);
  // Canonical-host redirects, security headers (HSTS, CSP, frame, sniff,
  // referrer, permissions) and gzip/brotli — see _core/siteHardening.ts.
  await registerSiteHardening(app);
  registerSiteRoutes(app, { dbPing: pingDatabase });
  // Zoom signs its events over the raw body: this route reads the text itself, so it goes before the JSON parser.
  registerZoomWebhook(app);
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerOwnerLoginRoutes(app);
  registerRoomVideoRoutes(app);
  // Unsubscribe link, inbound SMS (STOP/START/HELP), external-cron follow-ups
  registerMailRoutes(app);
  registerSmsRoutes(app);
  // AI Whisperer report downloads (signed links from the advisor's texts, or a signed-in advisor)
  registerWhispererRoutes(app);
  registerScheduledRoutes(app);
  // Verified inbound events (signed) feed the plan runtime
  registerEventRoutes(app);
  // Core Web Vitals beacons from real visitors (LCP, CLS, INP, FCP, TTFB)
  registerVitalsRoutes(app);
  registerFounderVoice(app);
  // Read-only REST for partner front ends (the Drass WordPress plugin and any
  // that follow). Bearer-gated, closed by default, and it strips aggregate
  // crediting rates at the boundary — see server/partnerApi.ts.
  registerPartnerApi(app);
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
    process.env.RCS_LISTEN_PORT = String(port); // the site-health page probes itself here
    console.log(`Server running on http://localhost:${port}/`);
    // Lead follow-up automation ticks every minute (FOLLOWUPS_DISABLED=1 turns it off).
    startFollowupScheduler();
    // AI Whisperer: every 20 s, a live call whose five-minute cycle is due gets its objection reports and its text (WHISPERER_DISABLED=1 turns it off).
    if (startWhispererScheduler()) console.log("[whisperer] cycle scheduler running");
    // Erosion engine: EROSION_HARVEST_DAYS=7 has the AI council re-read every forecaster weekly (off unless set).
    if (startHarvestSchedule()) console.log("[erosion] harvest sweep scheduled every", process.env.EROSION_HARVEST_DAYS, "days");
    // The political pulse (seats, bench, market odds) is keyless and free: weekly by default, POWER_PULSE_DAYS=0 turns it off.
    if (startPulseSchedule()) console.log("[power] pulse scheduled every", process.env.POWER_PULSE_DAYS ?? 7, "days");
    // Zip engine: ZIP_DATA_DAYS=30 re-reads FHFA, Zillow and Freddie Mac monthly (off unless set; the owner can also press "Read the files now").
    if (startZipSchedule()) console.log("[zip] data sweep scheduled every", process.env.ZIP_DATA_DAYS, "days");
    // Rental ledger: RENTAL_DATA_DAYS=30 re-reads HUD FMR/SAFMR, Census ACS, Eviction Lab and the FRED money series (off unless set).
    if (startRentalSchedule()) console.log("[rental] data sweep scheduled every", process.env.RENTAL_DATA_DAYS, "days");
    // Career ledger: CAREER_DATA_DAYS=90 re-reads BLS OEWS and NCES quarterly (off unless set; the owner can also press "Read the files now").
    if (startCareerSchedule()) console.log("[career] data sweep scheduled every", process.env.CAREER_DATA_DAYS, "days");
    if (startHazardSchedule()) console.log("[hazards] FEMA county file scheduled every", process.env.HAZARD_DATA_DAYS, "days");
    // Daily database backup to S3-compatible storage or a local folder (BACKUP_DISABLED=1 turns it off).
    if (startBackupSchedule()) console.log("[backup] daily backup scheduled at", process.env.BACKUP_HOUR_UTC ?? 4, ":00 UTC");
  });
}

startServer().catch(console.error);
