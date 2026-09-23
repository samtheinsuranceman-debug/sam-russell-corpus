export const ENV = {
  // Session tokens carry this id and are only valid when it matches.
  appId: process.env.VITE_APP_ID || "russell-capital-systems",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  // Self-hosted owner sign-in (see _core/ownerLogin.ts). The hash is bcrypt.
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  ownerPasswordHash: process.env.OWNER_PASSWORD_HASH ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  // Optional second factor for owner sign-in (base32; see scripts/owner_totp_secret.mjs).
  ownerTotpSecret: process.env.OWNER_TOTP_SECRET ?? "",
  // Entrance passcode shared with invited visitors: any email plus this
  // passcode signs in as a regular user (see _core/ownerLogin.ts). bcrypt hash
  // only, generated with `pnpm owner:password`; the passcode itself is never stored.
  guestPasscodeHash: process.env.GUEST_PASSCODE_HASH ?? "",
  // The entrance is the front door: an unsigned visitor to "/" is sent to /login
  // first. Set PUBLIC_HOMEPAGE=1 to let the homepage show without signing in.
  publicHomepage: process.env.PUBLIC_HOMEPAGE === "1",
  // Where "new lead" alerts go (falls back to OWNER_EMAIL).
  leadNotifyEmail: process.env.LEAD_NOTIFY_EMAIL ?? "",
  // Optional mobile number (E.164 or 10 digits) that gets a text per new lead.
  leadNotifyPhone: process.env.LEAD_NOTIFY_PHONE ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
