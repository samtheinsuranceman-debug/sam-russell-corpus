/**
 * Baseline security headers applied to every HTTP response.
 */

import type { ServerResponse } from "node:http";

export function applySecurityHeaders(res: ServerResponse, isHttps: boolean): void {
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "0");

  if (isHttps) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains"
    );
  }
}
