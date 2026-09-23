import { TRPCError } from "@trpc/server";
import { isPlausibleShareToken } from "../../shared/shareTokens";

// ============================================================
// SHARE TOKENS
// Every public share link (/shared/:token, /shared-slides/:token, /video/:token,
// /client-portal/:token) carries a random hex token from randomBytes(24..48). A
// token that cannot have come from us is answered "not found" at once, without a
// database round trip, so a mistyped or probed link gets a 404 and a clear
// message instead of a 500 or a page stuck on "Loading…".
// ============================================================

export { isPlausibleShareToken };

/** Throws tRPC NOT_FOUND (HTTP 404) when the token cannot be one we issued. */
export function assertShareToken(token: string, what: string): void {
  if (!isPlausibleShareToken(token)) {
    throw new TRPCError({ code: "NOT_FOUND", message: `Invalid or expired ${what} link.` });
  }
}

/** The database is not reachable: say so with 503, never a bare 500 from a null dereference. */
export function noDatabase(): TRPCError {
  return new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Shared links cannot be opened right now. Please try again shortly." });
}
