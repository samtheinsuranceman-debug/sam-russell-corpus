import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { createMcpHandler, toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpServer, McpRequestContext } from "./mcp";
import { validateBearerToken, checkApiKey, checkRateLimit, AuthInfo } from "./auth";
import { sanitizeLog, generateRequestId } from "./utils";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthInfo;
    }
  }
}

const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || "localhost,127.0.0.1")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const MCP_REALM = 'Bearer realm="Patent360 MCP Hub"';
const SERVER_VERSION = "1.0.0";
const START_TIME = Date.now();

const app = express();

app.disable("x-powered-by");

/**
 * Structured, sanitized request logging. Never logs raw bodies, auth
 * headers, or API keys.
 */
function logStructured(level: "info" | "warn" | "error", event: string, meta: Record<string, unknown> = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...meta,
  };
  // eslint-disable-next-line no-console
  console.log(sanitizeLog(entry));
}

/**
 * Exact host/origin validation. In non-production environments, localhost
 * traffic is always permitted to ease local development.
 */
function hostValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const hostname = req.hostname;

  const isLocalDev = NODE_ENV !== "production" && (hostname === "localhost" || hostname === "127.0.0.1");
  const isAllowed = ALLOWED_HOSTS.includes(hostname);

  if (isLocalDev || isAllowed) {
    next();
    return;
  }

  logStructured("warn", "host_rejected", { hostname, path: req.path });
  res.status(403).json({ error: "Forbidden host" });
}

/**
 * 60 requests / 60 seconds per IP, in-memory only.
 */
function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  if (!checkRateLimit(ip)) {
    logStructured("warn", "rate_limit_exceeded", { path: req.path });
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  next();
}

app.use(hostValidationMiddleware);

/**
 * Strict origin/CORS handling for MCP endpoints: no cross-origin requests
 * are permitted. We simply never emit permissive CORS headers, which
 * causes browsers to block cross-origin access by default.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Patent360 MCP Hub</title>
  </head>
  <body>
    <h1>Patent360 MCP Hub</h1>
    <p>Node.js/TypeScript MCP Server v2.0.0 for secure, Railway-native AI integration.</p>
    <p><a href="/api/health">/api/health</a></p>
  </body>
</html>`);
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    uptime: (Date.now() - START_TIME) / 1000,
    version: SERVER_VERSION,
    timestamp: new Date().toISOString(),
  });
});

const mcpServer = createMcpServer();
const mcpHandler = createMcpHandler(mcpServer);

app.post(
  "/mcp",
  rateLimitMiddleware,
  express.json({ limit: "1mb" }),
  async (req: Request, res: Response) => {
    try {
      const authHeader = req.header("authorization");
      const parsed = validateBearerToken(authHeader);

      if (!parsed) {
        logStructured("warn", "mcp_auth_missing_or_malformed", { path: req.path });
        res.setHeader("WWW-Authenticate", MCP_REALM);
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!checkApiKey(parsed.token)) {
        logStructured("warn", "mcp_auth_invalid_token", { path: req.path });
        res.setHeader("WWW-Authenticate", MCP_REALM);
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      req.auth = { scopes: ["mcp:read"] };

      const context: McpRequestContext = { auth: req.auth };
      const nodeHandler = toNodeHandler(mcpHandler, { context });

      await nodeHandler(req, res);
    } catch (err) {
      const requestId = generateRequestId();
      logStructured("error", "mcp_handler_error", {
        requestId,
        errorType: err instanceof Error ? err.name : "UnknownError",
      });

      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal server error",
          request_id: requestId,
        });
      }
    }
  }
);

// Body size guard for any other body-parsing route added in the future.
app.use(express.json({ limit: "1mb" }));

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler: never leak stack traces.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = generateRequestId();
  logStructured("error", "unhandled_exception", {
    requestId,
    endpoint: req.path,
    errorType: err.name,
  });

  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal server error",
      request_id: requestId,
    });
  }
});

const httpServer = createServer(app);

httpServer.listen(PORT, "0.0.0.0", () => {
  logStructured("info", "server_started", { port: PORT, env: NODE_ENV });
  // eslint-disable-next-line no-console
  console.log(`Patent360 MCP Hub listening on 0.0.0.0:${PORT}`);
});

process.on("uncaughtException", (err) => {
  logStructured("error", "uncaught_exception", { errorType: err.name });
});

process.on("unhandledRejection", (reason) => {
  logStructured("error", "unhandled_rejection", {
    errorType: reason instanceof Error ? reason.name : "UnknownRejection",
  });
});

export { app, httpServer };
