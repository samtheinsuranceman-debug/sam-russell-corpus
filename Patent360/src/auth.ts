import crypto from "crypto";

export interface AuthInfo {
  scopes: string[];
}

const BEARER_PATTERN = /^Bearer\s+(\S+)$/;

/**
 * Parses an Authorization header value in the form "Bearer <token>".
 * Returns null if the header is missing, malformed, or empty.
 */
export function validateBearerToken(header: string | undefined | null): { token: string } | null {
  if (!header || typeof header !== "string") {
    return null;
  }

  const match = BEARER_PATTERN.exec(header.trim());
  if (!match || !match[1]) {
    return null;
  }

  return { token: match[1] };
}

/**
 * Compares the supplied token against MCP_API_KEY using a constant-time
 * comparison to avoid leaking timing information about the secret.
 */
export function checkApiKey(token: string): boolean {
  const expected = process.env.MCP_API_KEY;

  if (!expected || !token) {
    return false;
  }

  const expectedBuf = Buffer.from(expected, "utf8");
  const tokenBuf = Buffer.from(token, "utf8");

  // timingSafeEqual requires equal-length buffers; pad to avoid short-circuit
  // leaking length information via early exception.
  if (expectedBuf.length !== tokenBuf.length) {
    // Still perform a comparison against a same-length buffer to keep timing
    // consistent, then return false.
    crypto.timingSafeEqual(expectedBuf, Buffer.alloc(expectedBuf.length));
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, tokenBuf);
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

/**
 * In-memory IP -> request timestamps map used for rate limiting.
 * NOTE: this state is process-local and is NOT shared across replicas or
 * preserved across restarts. Suitable for single-replica deployments only.
 */
export const rateLimitStore = new Map<string, number[]>();

/**
 * Returns true if the given IP is still within the allowed rate limit
 * (60 requests / 60 seconds), false if the limit has been exceeded.
 * Automatically prunes timestamps older than the rate limit window.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(ip) ?? [];
  const recent = existing.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ip, recent);
    return false;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return true;
}
