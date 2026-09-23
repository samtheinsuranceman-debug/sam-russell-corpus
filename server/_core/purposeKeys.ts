// ============================================================
// PURPOSE KEYS — one key per job, never the session key itself.
//
// Session cookies are HS256 JWTs signed with JWT_SECRET (server/_core/sdk.ts),
// and an HS256 signature is exactly HMAC-SHA256(JWT_SECRET, "header.payload").
// Any other feature that computes HMAC-SHA256 with the raw JWT_SECRET over
// input a user can influence, and shows the result to anyone, is one format
// check away from issuing session signatures. So only sdk.ts may use
// JWT_SECRET raw; every other HMAC key is derived here for a single purpose:
//
//   key = HMAC-SHA256(JWT_SECRET, "rcs-<purpose>-v1")
//
// A derived key cannot sign a session (it is not JWT_SECRET) and does not
// reveal JWT_SECRET. If JWT_SECRET is unset the base is a per-process random
// key, so signed links stop verifying across restarts instead of falling back
// to a constant anyone could read in the source.
// ============================================================
import { createHash, createHmac, randomBytes } from "node:crypto";

export type KeyPurpose = "unsubscribe-link" | "whisperer-report-link" | "advice-signing";

export type BaseEnv = { readonly [name: string]: string | undefined; JWT_SECRET?: string };

let processBase: Buffer | null = null;

/** Derived key for one purpose, as hex (so callers that store or compare string keys keep working). */
export function purposeKey(purpose: KeyPurpose, env: BaseEnv = process.env as BaseEnv): string {
  const base: string | Buffer = env.JWT_SECRET || (processBase ??= randomBytes(32));
  return createHmac("sha256", base).update(`rcs-${purpose}-v1`).digest("hex");
}

/**
 * The raw session secret, returned ONLY so a feature can still VERIFY values it
 * issued before key separation (outstanding links, stored signatures). Never
 * sign, hash or issue anything new with it. Null when JWT_SECRET is unset, so
 * the old public fallback constants are never accepted.
 */
export function legacySessionKeyForVerifyOnly(env: BaseEnv = process.env as BaseEnv): string | null {
  return env.JWT_SECRET ? env.JWT_SECRET : null;
}

/** True when a configured "dedicated" key is really the session secret (then it must not be used raw). */
export function isSessionSecret(candidate: string | undefined, env: BaseEnv = process.env as BaseEnv): boolean {
  if (!candidate || !env.JWT_SECRET) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(env.JWT_SECRET).digest();
  return a.equals(b);
}
