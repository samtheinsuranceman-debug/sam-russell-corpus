import { Server, Tool } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { AuthInfo } from "./auth";

/**
 * Per-tool execution timeout. Any tool handler that does not resolve
 * within this window is treated as failed and rejected.
 */
const TOOL_TIMEOUT_MS = 5000;
const REQUIRED_SCOPE = "mcp:read";

class ToolTimeoutError extends Error {
  constructor(toolName: string) {
    super(`Tool "${toolName}" timed out after ${TOOL_TIMEOUT_MS}ms`);
    this.name = "ToolTimeoutError";
  }
}

class UnauthorizedScopeError extends Error {
  constructor() {
    super(`Missing required scope: ${REQUIRED_SCOPE}`);
    this.name = "UnauthorizedScopeError";
  }
}

function withTimeout<T>(toolName: string, work: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ToolTimeoutError(toolName));
    }, TOOL_TIMEOUT_MS);

    work()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function assertScope(auth: AuthInfo | undefined): void {
  if (!auth || !Array.isArray(auth.scopes) || !auth.scopes.includes(REQUIRED_SCOPE)) {
    throw new UnauthorizedScopeError();
  }
}

/**
 * MCP request context passed through by the transport layer. `auth` is
 * attached upstream in src/index.ts after successful Bearer validation.
 */
export interface McpRequestContext {
  auth?: AuthInfo;
  [key: string]: unknown;
}

const healthCheckInputSchema = z.object({}).strict();

const echoInputSchema = z
  .object({
    message: z
      .string({ required_error: "message is required and must be a string" })
      .max(1024, "message must not exceed 1024 characters"),
  })
  .strict();

/**
 * Factory that builds a fully configured, read-only MCP Server instance
 * exposing exactly two tools: health_check and echo. Both tools enforce
 * scope checks and a 5 second execution timeout.
 */
export function createMcpServer(): Server {
  const server = new Server({
    name: "patent360-mcp-hub",
    version: "1.0.0",
  });

  server.tool(
    "health_check",
    "Returns the operational status and current server timestamp. Takes no parameters.",
    { input: healthCheckInputSchema },
    async (_input: z.infer<typeof healthCheckInputSchema>, context: McpRequestContext) => {
      return withTimeout("health_check", async () => {
        assertScope(context?.auth);

        return {
          status: "ok",
          timestamp: new Date().toISOString(),
        };
      });
    }
  );

  server.tool(
    "echo",
    "Echoes back the provided message (max 1024 characters) along with a timestamp.",
    { input: echoInputSchema },
    async (input: z.infer<typeof echoInputSchema>, context: McpRequestContext) => {
      return withTimeout("echo", async () => {
        assertScope(context?.auth);

        const parsed = echoInputSchema.parse(input);

        return {
          echoed: parsed.message,
          timestamp: new Date().toISOString(),
        };
      });
    }
  );

  return server;
}

export type { Tool };
