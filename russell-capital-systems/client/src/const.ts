import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = (returnPath = window.location.pathname) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Self-hosted install (no managed OAuth portal): the /login page offers the
  // owner sign-in instead of bouncing to a non-existent portal URL.
  if (!oauthPortalUrl || !appId) {
    window.location.href = getLoginUrl(returnPath);
    return;
  }

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const safeReturnPath = returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/portal/dashboard";
  const state = encodeOAuthState({ redirectUri, nonce, returnPath: safeReturnPath });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  window.location.href = url.toString();
};

// Temporary route-compatible helper retained for imported pages. The /login
// page will be converted to managed OAuth during the authorization pass.
export const getLoginUrl = (returnPath?: string) => {
  const path = returnPath || "/portal/dashboard";
  return `/login?returnTo=${encodeURIComponent(path)}`;
};
