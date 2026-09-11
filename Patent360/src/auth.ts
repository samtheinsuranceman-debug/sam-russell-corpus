/**
 * Authentication helpers for the Patent360 MCP Hub.
 *
 * The service authenticates callers of POST /mcp using a single shared
 * API key supplied via the MCP_API_KEY environment variable. Comparison
 * is performed on the SHA-256 digest of the candidate key using
 * crypto.timingSafeEqual so that verification time does not leak
 * information about how many leading bytes matched.
 */

import { createHash, timingSafeEqual } from "node:crypto";

export const MIN_API_KEY_LENGTH = 32;

export interface AuthInfo {
  authenticated: boolean;
  scopes: string[];
}

export const READ_SCOPE = "mcp:read";

/**
 * Loads and validates the MCP_API_KEY environment variable.
 * Throws at startup if the key is missing or too short, so misconfigured
 * deployments fail fast instead of silently accepting weak secrets.
 */
export function loadApiKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.MCP_API_KEY;

  if (!key || key.trim().length === 0) {
    throw new Error(
      "MCP_API_KEY environment variable is required and must not be empty"
    );
  }

  if (key.length < MIN_API_KEY_LENGTH) {
    throw new Error(
      `MCP_API_KEY must be at least ${MIN_API_KEY_LENGTH} characters long`
    );
  }

  return key;
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Timing-safe comparison of a candidate key against the configured
 * MCP_API_KEY. Both values are hashed with SHA-256 first so the buffers
 * compared are always fixed-length, and comparison uses
 * crypto.timingSafeEqual to avoid short-circuit timing leaks.
 */
export function verifyApiKey(candidate: string | undefined | null, expected: string): boolean {
  if (!candidate) {
    return false;
  }

  const candidateDigest = sha256(candidate);
  const expectedDigest = sha256(expected);

  try {
    return timingSafeEqual(candidateDigest, expectedDigest);
  } catch {
    return false;
  }
}

/**
 * Extracts a bearer token from an Authorization header value.
 */
export function extractBearerToken(authorizationHeader: string | undefined | null): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token.trim();
}

/**
 * Builds the AuthInfo object attached to the request context after a
 * successful authentication. Only one scope is granted today
 * (mcp:read) since every registered tool is read-only.
 */
export function buildAuthInfo(): AuthInfo {
  return {
    authenticated: true,
    scopes: [READ_SCOPE],
  };
}

/**
 * Redacts a possibly-sensitive token for safe inclusion in log output.
 * Never logs the raw token value.
 */
export function redactToken(token: string | undefined | null): string {
  if (!token) {
    return "<none>";
  }
  return `<redacted:${token.length}chars>`;
}
