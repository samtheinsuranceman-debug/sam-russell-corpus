export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const LOGIN_UNAVAILABLE_PATH = "/";

/** Passwordless email-link sign-in (server: EMAIL_AUTH_ENABLED + Resend). */
export const EMAIL_AUTH_ENABLED = import.meta.env.VITE_EMAIL_AUTH === "true";

const oauthConfigured = () => Boolean(import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID);

function safePath(returnPath?: string): string {
  if (typeof window === "undefined") return "/";
  return returnPath && returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : (window.location.pathname || "/");
}

/**
 * OAuth begins on the Doctor Buddy server so OAuth state can be signed and
 * tied to a short-lived HttpOnly nonce cookie. The browser never invents its
 * own OAuth state or return URL.
 */
export const oauthLoginUrl = (returnPath?: string) => `/api/oauth/start?returnPath=${encodeURIComponent(safePath(returnPath))}`;

/** Where "Sign in" goes: the email-link page when enabled, else the OAuth start, else home. */
export const getLoginUrl = (returnPath?: string) => {
  if (typeof window === "undefined") return LOGIN_UNAVAILABLE_PATH;
  if (EMAIL_AUTH_ENABLED) return `/login?returnPath=${encodeURIComponent(safePath(returnPath))}`;
  if (!oauthConfigured()) return LOGIN_UNAVAILABLE_PATH;
  return oauthLoginUrl(returnPath);
};

export const isLoginConfigured = () => {
  if (typeof window === "undefined") return false;
  return EMAIL_AUTH_ENABLED || oauthConfigured();
};
