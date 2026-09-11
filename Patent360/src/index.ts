/**
 * Patent360 MCP Hub - main entry point.
 *
 * Native Node HTTP server (no Express, no other HTTP framework). Wires
 * together the MCP server instance, its two read-only tools, and a
 * small set of public/protected HTTP routes.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import {
  loadApiKey,
  verifyApiKey,
  extractBearerToken,
  buildAuthInfo,
  redactToken,
} from "./auth.js";
import { checkRateLimit, getClientIp, RATE_LIMIT_MAX_REQUESTS } from "./middleware/rate-limit.js";
import { applySecurityHeaders } from "./middleware/security-headers.js";
import { registerHealthCheckTool } from "./tools/health-check.js";
import { registerEchoTool } from "./tools/echo.js";

const SERVICE_NAME = "patent360-mcp-hub";
const SERVICE_VERSION = "1.0.0";
const REPO_URL = "https://github.com/samtheinsuranceman-debug/sam-russell-corpus";

const HOST = process.env.MCP_HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || process.env.MCP_PORT || 3000);
const MAX_BODY_BYTES = 1 * 1024 * 1024; // 1 MiB

// Fail fast on startup if the API key is missing or too short.
const API_KEY = loadApiKey();

// The public-facing host used for origin validation and for building the
// landing page's derived MCP URL. Railway injects RAILWAY_PUBLIC_DOMAIN
// for deployed services.
const PUBLIC_HOST =
  process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_HOSTNAME || `localhost:${PORT}`;

function buildMcpServer(): McpServer {
  const server = new McpServer({
    name: SERVICE_NAME,
    version: SERVICE_VERSION,
  });

  registerHealthCheckTool(server);
  registerEchoTool(server);

  return server;
}

const mcpServer = buildMcpServer();
const mcpHandler = createMcpHandler(mcpServer);
const nodeMcpHandler = toNodeHandler(mcpHandler);

function isTrustedHost(hostHeader: string | undefined): boolean {
  if (!hostHeader) {
    return false;
  }
  const host = hostHeader.toLowerCase();
  return (
    host === PUBLIC_HOST.toLowerCase() ||
    host === `localhost:${PORT}` ||
    host === `127.0.0.1:${PORT}` ||
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1")
  );
}

function isTrustedOrigin(originHeader: string | undefined): boolean {
  if (!originHeader) {
    // Same-origin tools/non-browser clients frequently omit Origin; only
    // reject when an Origin is present and untrusted.
    return true;
  }
  try {
    const originHost = new URL(originHeader).host;
    return isTrustedHost(originHost);
  } catch {
    return false;
  }
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function landingPageHtml(): string {
  const scheme = process.env.RAILWAY_PUBLIC_DOMAIN ? "https" : "http";
  const mcpUrl = `${scheme}://${PUBLIC_HOST}/mcp`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Patent360 MCP Hub</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1rem; color: #1a1a1a; }
    code { background: #f2f2f2; padding: 0.15rem 0.4rem; border-radius: 4px; }
    a { color: #0b5fff; }
    .badge { display: inline-block; padding: 0.15rem 0.5rem; background: #e6ffed; color: #036b26; border-radius: 4px; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Patent360 MCP Hub</h1>
  <p><span class="badge">online</span> version ${SERVICE_VERSION}</p>
  <p>This service exposes a Model Context Protocol (MCP) endpoint for Patent360 tooling.</p>
  <p><strong>MCP endpoint:</strong> <code>${mcpUrl}</code></p>
  <p>Authentication: Bearer token via <code>Authorization</code> header (<code>MCP_API_KEY</code>).</p>
  <p>Health check: <a href="/api/health">/api/health</a></p>
  <p>Source: <a href="${REPO_URL}">${REPO_URL}</a></p>
</body>
</html>`;
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let aborted = false;

    req.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        aborted = true;
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!aborted) {
        resolve(Buffer.concat(chunks));
      }
    });

    req.on("error", (err) => {
      if (!aborted) {
        reject(err);
      }
    });
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const isHttps = req.headers["x-forwarded-proto"] === "https";
  applySecurityHeaders(res, isHttps);

  const clientIp = getClientIp(req.headers as Record<string, string | string[] | undefined>, req.socket.remoteAddress);
  const rateLimit = checkRateLimit(clientIp);
  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(rateLimit.remaining, 0)));

  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
    sendJson(res, 429, { error: "rate_limit_exceeded" });
    return;
  }

  if (!isTrustedHost(req.headers.host)) {
    console.warn("request rejected: untrusted host", { host: req.headers.host });
    sendJson(res, 403, { error: "forbidden" });
    return;
  }

  if (!isTrustedOrigin(req.headers.origin)) {
    console.warn("request rejected: untrusted origin", { origin: req.headers.origin });
    sendJson(res, 403, { error: "forbidden" });
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/") {
    const html = landingPageHtml();
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": Buffer.byteLength(html),
    });
    res.end(html);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      service: "Patent360 MCP Hub",
      version: SERVICE_VERSION,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === "/mcp") {
    const authHeader = req.headers.authorization;
    const candidateToken = extractBearerToken(authHeader);

    if (!verifyApiKey(candidateToken, API_KEY)) {
      console.warn("mcp auth rejected", {
        path: url.pathname,
        ip: clientIp,
        token: redactToken(candidateToken),
      });
      res.setHeader("WWW-Authenticate", 'Bearer realm="Patent360"');
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    let body: Buffer;
    try {
      body = await readBody(req);
    } catch {
      sendJson(res, 413, { error: "payload_too_large" });
      return;
    }

    // Re-inject the already-consumed body stream for the MCP handler,
    // and attach auth info under ctx.http.authInfo as required by the
    // tool contract.
    const authInfo = buildAuthInfo();
    (req as IncomingMessage & { authInfo?: unknown }).authInfo = authInfo;
    (req as IncomingMessage & { body?: Buffer }).body = body;

    try {
      await nodeMcpHandler(req, res, { authInfo });
    } catch (err) {
      console.error("mcp handler error", err instanceof Error ? err.message : err);
      if (!res.headersSent) {
        sendJson(res, 500, { error: "internal_error" });
      }
    }
    return;
  }

  sendJson(res, 404, { error: "not_found" });
}

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error("unhandled request error", err instanceof Error ? err.message : err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "internal_error" });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`${SERVICE_NAME} v${SERVICE_VERSION} listening on ${HOST}:${PORT}`);
});

function shutdown(signal: string): void {
  console.log(`received ${signal}, shutting down gracefully`);
  server.close((err) => {
    if (err) {
      console.error("error during shutdown", err.message);
      process.exit(1);
    }
    process.exit(0);
  });

  // Force-exit if connections don't drain in time.
  setTimeout(() => {
    console.warn("graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
