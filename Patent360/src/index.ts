/**
 * Patent360 MCP Hub - main entry point.
 *
 * Sets up the Express HTTP server, the MCP server instance with its
 * registered tools, and wires the MCP transport into the /mcp route.
 */

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { registerRoutes } from "./handlers";
import { registerTools, TOOL_TIMEOUT_MS } from "./tools";
import { validateRequestSize, MAX_REQUEST_BODY_BYTES } from "./security";

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;
const SERVICE_NAME = "patent360-mcp-hub";
const SERVICE_VERSION = "2.0.0";

function createServer(): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(validateRequestSize);
  app.use(
    express.json({
      limit: MAX_REQUEST_BODY_BYTES,
    })
  );

  // Basic malformed-JSON handling so bad payloads return a clean 400
  // instead of an unhandled exception.
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && "body" in (err as Record<string, unknown>)) {
      res.status(400).json({ error: "invalid_json" });
      return;
    }
    next(err);
  });

  const mcpServer = new McpServer({
    name: SERVICE_NAME,
    version: SERVICE_VERSION,
  });

  registerTools(mcpServer);

  const mcpHandler = createMcpHandler(mcpServer, {
    timeoutMs: TOOL_TIMEOUT_MS,
  });

  const nodeMcpHandler = toNodeHandler(mcpHandler);

  registerRoutes(app, nodeMcpHandler);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "not_found" });
  });

  return app;
}

function main(): void {
  const app = createServer();

  const server = app.listen(PORT, HOST, () => {
    console.log(
      `${SERVICE_NAME} v${SERVICE_VERSION} listening on ${HOST}:${PORT}`
    );
  });

  const shutdown = (signal: string) => {
    console.log(`received ${signal}, shutting down gracefully`);
    server.close((err) => {
      if (err) {
        console.error("error during shutdown", err.message);
        process.exit(1);
      }
      process.exit(0);
    });

    // Force-exit if graceful shutdown hangs.
    setTimeout(() => {
      console.error("graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
