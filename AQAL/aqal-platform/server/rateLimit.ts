// ============================================================
// RATE LIMITING — protecting the founding-spot pool
// ============================================================
// Since founding access is email + any member-chosen password, nothing else
// stops a script from burning the 10,000 founding spots with garbage signups.
// In-memory sliding-window limiter (per instance) + disposable-email blocklist.

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

/** True when the caller is within limit; false = throttled. */
export function checkLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now > w.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  w.count++;
  if (windows.size > 50_000) windows.clear(); // memory backstop
  return w.count <= max;
}

// The high-volume disposable domains. Not exhaustive — a speed bump, not a wall.
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "yopmail.com",
  "tempmail.com", "temp-mail.org", "trashmail.com", "sharklasers.com",
  "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com",
  "throwawaymail.com", "mintemail.com", "spamgourmet.com", "mytemp.email",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1] ?? "";
  return DISPOSABLE.has(domain);
}

/** Client IP from the request, proxy-aware. */
export function clientIp(req: { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string } }): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}
