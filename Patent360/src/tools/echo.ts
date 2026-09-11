/**
 * echo MCP tool.
 *
 * Read-only. Echoes back the provided text as a content block. Useful
 * as a minimal end-to-end connectivity check for MCP clients.
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import { READ_SCOPE } from "../auth.js";

const MAX_ECHO_LENGTH = 1000;

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

export const echoInputSchema = {
  text: z.string().max(MAX_ECHO_LENGTH, `text must be ${MAX_ECHO_LENGTH} characters or fewer`),
};

export function registerEchoTool(server: McpServer): void {
  server.registerTool(
    "echo",
    {
      title: "Echo",
      description:
        "Echoes back the provided text. Read-only, requires mcp:read scope.",
      inputSchema: echoInputSchema,
      outputSchema: {},
    },
    async (args: { text: string }, extra: ToolExtra) => {
      assertReadScope(extra);

      if (typeof args.text !== "string") {
        throw new McpError(ErrorCode.InvalidParams, "text is required");
      }

      return {
        content: [
          {
            type: "text" as const,
            text: args.text,
          },
        ],
      };
    }
  );
}
