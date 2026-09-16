/**
 * Marketing analytics are OFF by default.
 *
 * Health/wellness product usage can reveal sensitive information merely from a
 * URL or event name. If an operator deliberately enables analytics, this loader
 * allows it only on a tiny set of non-health marketing/legal pages and never
 * forwards query strings or user-entered content.
 */
export function loadOptionalAnalytics() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (import.meta.env.VITE_ENABLE_MARKETING_ANALYTICS !== "true") return;

  const allowedPaths = new Set([
    "/",
    "/terms",
    "/privacy",
    "/health-data-privacy",
    "/medical-disclaimer",
    "/subscription-terms",
  ]);
  if (!allowedPaths.has(window.location.pathname)) return;

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT?.trim();
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID?.trim();
  if (!endpoint || !websiteId) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint.replace(/\/$/, "")}/umami`;
  script.dataset.websiteId = websiteId;
  script.dataset.excludeSearch = "true";
  document.head.appendChild(script);
}
