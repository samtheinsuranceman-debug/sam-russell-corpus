/**
 * Shared TypeScript types for the Patent360 MCP Hub.
 */

export interface McpToolRequest {
  toolName: string;
  input: unknown;
  requestId?: string;
}

export interface McpToolResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export interface AuthContext {
  authenticated: boolean;
  capabilities: string[];
}

export interface HealthCheckOutput {
  status: string;
  timestamp: string;
  version: string;
}

export interface EchoInput {
  text: string;
}

export interface EchoOutput {
  echoed: string;
  length: number;
}
