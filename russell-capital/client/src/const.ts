export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL — now points to custom login page instead of external OAuth.
// Pass an optional returnPath so the user lands on the right page after login.
export const getLoginUrl = (returnPath?: string) => {
  const path = returnPath || "/portal/dashboard";
  return `/login?returnTo=${encodeURIComponent(path)}`;
};
