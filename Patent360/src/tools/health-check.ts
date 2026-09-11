/**
 * health_check MCP tool.
 *
 * Read-only. Returns a status content block describing the current
 * health of the Patent360 MCP Hub process.
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import { READ_SCOPE } from "../auth.js";

export const SERVICE_VERSION = "1.0.0";

interface ToolExtra {
  http?: {
    authInfo?: {
      scopes?: string[];
    };
  };
}

function assertReadScope(extra: ToolExtra): void {
  const scopes = extra.http?.authInfo?.scopes ?? [];
  if (!scopes.includes(READ_SCOPE)) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `missing required scope: ${READ_SCOPE}`
    );
  }
}

export function registerHealthCheckTool(server: McpServer): void {
  server.registerTool(
    "health_check",
    {
      title: "Health Check",
      description:
        "Returns the current health status of the Patent360 MCP Hub. Read-only, requires mcp:read scope.",
      inputSchema: {},
      outputSchema: {},
    },
    async (_args: Record<string, never>, extra: ToolExtra) => {
      assertReadScope(extra);

      const payload = {
        status: "ok",
        service: "Patent360 MCP Hub",
        version: SERVICE_VERSION,
        timestamp: new Date().toISOString(),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(payload),
          },
        ],
      };
    }
  );
}

export const healthCheckInputSchema = z.object({}).strict();
