/**
 * MCP tool definitions for the Patent360 MCP Hub.
 *
 * All tools are read-only and require the "mcp:read" capability.
 * Every tool handler is wrapped with a timeout guard and sanitized
 * error handling.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { sanitizeLog } from "./security";
import type { EchoOutput, HealthCheckOutput } from "./types";

export const TOOL_TIMEOUT_MS = 30_000;
export const REQUIRED_CAPABILITY = "mcp:read";
const SERVICE_VERSION = "2.0.0";

/**
 * Wraps a tool handler with a hard execution timeout so a single slow
 * tool call cannot hang the server indefinitely.
 */
async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = TOOL_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("tool_execution_timeout")), timeoutMs);
    }),
  ]);
}

function toolTextResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload),
      },
    ],
  };
}

function toolErrorResult(message: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: message }),
      },
    ],
  };
}

const healthCheckInputSchema = z.object({}).strict().optional();
const healthCheckOutputSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string(),
});

const echoInputSchema = z.object({
  text: z.string().max(1000, "text must be 1000 characters or fewer"),
});
const echoOutputSchema = z.object({
  echoed: z.string(),
  length: z.number(),
});

/**
 * Registers all Patent360 MCP tools on the provided server instance.
 * Each tool declares its required capability in its annotations so
 * callers can enforce access control consistently.
 */
export function registerTools(server: McpServer): void {
  server.registerTool(
    "health_check",
    {
      title: "Health Check",
      description:
        "Returns the current operational status of the Patent360 MCP Hub.",
      inputSchema: healthCheckInputSchema.shape ?? {},
      outputSchema: healthCheckOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        capability: REQUIRED_CAPABILITY,
      },
    },
    async () => {
      try {
        return await withTimeout(async () => {
          const output: HealthCheckOutput = {
            status: "ok",
            timestamp: new Date().toISOString(),
            version: SERVICE_VERSION,
          };
          return toolTextResult(output);
        });
      } catch (err) {
        console.error(
          "health_check tool error",
          sanitizeLog({ message: (err as Error).message })
        );
        return toolErrorResult("internal_error");
      }
    }
  );

  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Repeats back the provided text (max 1000 characters).",
      inputSchema: echoInputSchema.shape,
      outputSchema: echoOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        capability: REQUIRED_CAPABILITY,
      },
    },
    async (input: unknown) => {
      try {
        return await withTimeout(async () => {
          const parsed = echoInputSchema.parse(input);
          const output: EchoOutput = {
            echoed: parsed.text,
            length: parsed.text.length,
          };
          return toolTextResult(output);
        });
      } catch (err) {
        console.error(
          "echo tool error",
          sanitizeLog({ message: (err as Error).message })
        );
        if (err instanceof z.ZodError) {
          return toolErrorResult("invalid_input");
        }
        return toolErrorResult("internal_error");
      }
    }
  );
}
