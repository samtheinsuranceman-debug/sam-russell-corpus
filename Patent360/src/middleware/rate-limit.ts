/**
 * Simple in-memory sliding-window rate limiter, keyed by client IP.
 *
 * Limits: 60 requests per rolling 60-second window per IP. This is
 * intentionally in-memory and per-process; it is sufficient for a
 * single-instance Railway deployment and resets on restart.
 */

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 60;

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

// Periodically evict stale entries so the map does not grow unbounded.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      store.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);
cleanupTimer.unref();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Records a request from the given client IP and reports whether it is
 * within the allowed rate.
 */
export function checkRateLimit(clientIp: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(clientIp);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    store.set(clientIp, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil(
      (entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000
    );
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Extracts a best-effort client IP from a Node HTTP request, preferring
 * a single trusted X-Forwarded-For entry (Railway's edge proxy) and
 * falling back to the raw socket address.
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>, remoteAddress: string | undefined): string {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]!.trim();
  }
  return remoteAddress ?? "unknown";
}
