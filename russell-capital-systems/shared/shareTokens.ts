/**
 * Every public share link (/shared/:token, /shared-slides/:token, /video/:token,
 * /client-portal/:token) carries a random hex token from randomBytes(24..48).
 * This is the shape check both sides use: the server answers NOT_FOUND at once
 * for anything else, and the page shows its "not found" state without waiting.
 * Lenient on purpose: URL-safe characters, 16–256 long.
 */
export const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{16,256}$/;

export function isPlausibleShareToken(token: string): boolean {
  return SHARE_TOKEN_RE.test(token);
}
