/**
 * HTTP route handlers for the Patent360 MCP Hub.
 *
 * Public routes: GET /, GET /api/health
 * Protected route: POST /mcp (bearer token required)
 */

import type { Express, Request, Response, NextFunction } from "express";
import {
  rateLimitMiddleware,
  validateBearerToken,
  validateHostOrigin,
  sanitizeLog,
} from "./security";

const SERVICE_VERSION = "2.0.0";
const START_TIME = Date.now();

export type NodeMcpHandler = (req: Request, res: Response) => Promise<void> | void;

function requireBearerAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!validateBearerToken(authHeader)) {
    console.warn(
      "mcp auth rejected",
      sanitizeLog({ path: req.path, ip: req.ip })
    );
    res.setHeader("WWW-Authenticate", 'Bearer realm="Patent360"');
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  next();
}

function requireTrustedHostOrigin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!validateHostOrigin(req)) {
    console.warn(
      "request rejected: untrusted host/origin",
      sanitizeLog({ host: req.headers.host, origin: req.headers.origin })
    );
    res.status(403).json({ error: "forbidden" });
    return;
  }
  next();
}

/**
 * Registers all HTTP routes on the given Express app.
 *
 * @param app Express application instance
 * @param mcpHandler Node-compatible handler produced by toNodeHandler()
 *   wrapping the MCP transport handler.
 */
export function registerRoutes(app: Express, mcpHandler: NodeMcpHandler): void {
  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      service: "Patent360 MCP Hub",
      version: SERVICE_VERSION,
      status: "ok",
      docs: "/api/health",
      mcpEndpoint: "/mcp",
    });
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: SERVICE_VERSION,
    });
  });

  app.post(
    "/mcp",
    rateLimitMiddleware,
    requireTrustedHostOrigin,
    requireBearerAuth,
    async (req: Request, res: Response) => {
      try {
        await mcpHandler(req, res);
      } catch (err) {
        console.error(
          "mcp handler error",
          sanitizeLog({ message: (err as Error).message })
        );
        if (!res.headersSent) {
          res.status(500).json({ error: "internal_error" });
        }
      }
    }
  );
}
