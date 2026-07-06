// ============================================================
// Platform seam — authentication (documentation)
// ============================================================
// Auth currently runs on the existing OAuth implementation in _core/oauth.ts,
// which populates the tRPC `ctx.user`. That contract is the seam: any provider
// swap must keep `ctx.user` shaped the same so no downstream caller changes.
//
// To swap in Clerk (recommended) or Auth.js / WorkOS:
//   1. Add the provider SDK and its keys (e.g. CLERK_SECRET_KEY) to env.
//   2. In _core/context.ts, verify the incoming session with the provider and
//      map its user to the existing ctx.user shape ({ id, name, email, role, ... }).
//   3. Replace the /api/oauth/* routes with the provider's sign-in/callback.
//   4. authProvider() in platform/config.ts already reports "clerk" when
//      CLERK_SECRET_KEY is present — wire the branch here when implementing.
//
// This file intentionally contains no live swap: doing it untested would break
// login. It documents the single integration point so the swap is mechanical.

export {}; // module marker
