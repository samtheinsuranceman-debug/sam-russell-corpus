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
