/**
 * Security utilities: authentication, rate limiting, request validation,
 * host/origin validation, and log sanitization.
 */

import type { Request, Response, NextFunction } from "express";
import type { RateLimitEntry } from "./types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require("crypto");

export const MAX_REQUEST_BODY_BYTES = 1 * 1024 * 1024; // 1 MiB
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100;

const TRUSTED_HOSTS = new Set(
  [
    "localhost",
    "127.0.0.1",
    process.env.PUBLIC_HOSTNAME,
    process.env.RAILWAY_PUBLIC_DOMAIN,
  ].filter((h): h is string => Boolean(h))
);

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Periodically clean up stale rate limit entries so the in-memory
 * store does not grow unbounded.
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "rate_limit_exceeded" });
    return;
  }

  entry.count += 1;
  next();
}

/**
 * Timing-safe comparison of a bearer token against the configured secret.
 * Accepts the raw Authorization header value ("Bearer <token>").
 */
export function validateBearerToken(authHeader: string | undefined): boolean {
  const expected = process.env.MCP_TOKEN;
  if (!expected) {
    return false;
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const provided = authHeader.slice("Bearer ".length).trim();

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (expectedBuf.length !== providedBuf.length) {
    // Still perform a comparison of equal-length buffers to avoid
    // leaking length information via early return timing, though the
    // length check itself is a minor, unavoidable side channel.
    const paddedProvided = Buffer.alloc(expectedBuf.length);
    providedBuf.copy(paddedProvided);
    crypto.timingSafeEqual(expectedBuf, paddedProvided);
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export function validateRequestSize(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const contentLength = req.headers["content-length"];
  if (contentLength && Number(contentLength) > MAX_REQUEST_BODY_BYTES) {
    res.status(413).json({ error: "payload_too_large" });
    return;
  }
  next();
}

/**
 * Validates the Host and Origin headers against an exact-match whitelist.
 * Returns true if the request is from a trusted origin, false otherwise.
 */
export function validateHostOrigin(req: Request): boolean {
  const hostHeader = req.headers.host;
  if (!hostHeader) {
    return false;
  }
  const hostname = hostHeader.split(":")[0]!.toLowerCase();
  if (!TRUSTED_HOSTS.has(hostname)) {
    return false;
  }

  const origin = req.headers.origin;
  if (origin) {
    try {
      const originHostname = new URL(origin).hostname.toLowerCase();
      if (!TRUSTED_HOSTS.has(originHostname)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

const SENSITIVE_KEYS = new Set([
  "authorization",
  "token",
  "mcp_token",
  "password",
  "secret",
  "apikey",
  "api_key",
  "body",
  "text",
]);

/**
 * Removes sensitive fields from an object before logging. Does not
 * mutate the original object.
 */
export function sanitizeLog(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLog(item));
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = "[redacted]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeLog(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
