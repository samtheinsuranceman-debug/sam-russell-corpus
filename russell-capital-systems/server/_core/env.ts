export const ENV = {
  // The managed host supplies VITE_APP_ID; a self-hosted install has none, but
  // sessions are only valid when the app id is non-empty, so default it.
  appId: process.env.VITE_APP_ID || "russell-capital-systems",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  // Self-hosted owner sign-in (see _core/ownerLogin.ts). The hash is bcrypt.
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  ownerPasswordHash: process.env.OWNER_PASSWORD_HASH ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  // Where "new lead" alerts go (falls back to OWNER_EMAIL).
  leadNotifyEmail: process.env.LEAD_NOTIFY_EMAIL ?? "",
  // Optional mobile number (E.164 or 10 digits) that gets a text per new lead.
  leadNotifyPhone: process.env.LEAD_NOTIFY_PHONE ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
