export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Sign-in is the site's own /login page: the owner's password (with the
// optional authenticator code) or the entrance passcode for invited visitors.
// There is no external identity provider.
export const startLogin = (returnPath = window.location.pathname) => {
  window.location.href = getLoginUrl(returnPath);
};

export const getLoginUrl = (returnPath?: string) => {
  const path = returnPath && returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/portal/dashboard";
  return `/login?returnTo=${encodeURIComponent(path)}`;
};
