export type CanonicalRedirectInput = {
  method: string;
  proto: string;
  host: string;
  originalUrl: string;
  canonicalHost?: string;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
export const BARE_PRODUCTION_HOST = "joinaqal.com";

/**
 * Return a redirect URL only when HTTPS is required or the known bare domain
 * must be canonicalized. Managed deployment origins and preview hosts remain
 * directly reachable so the hosting edge can validate and health-check them.
 */
export function canonicalRedirectLocation({
  method,
  proto,
  host,
  originalUrl,
  canonicalHost = "www.joinaqal.com",
}: CanonicalRedirectInput): string | null {
  if (method !== "GET") return null;

  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname || LOCAL_HOSTS.has(hostname)) return null;

  const isBareProductionHost = hostname === BARE_PRODUCTION_HOST;
  const needsHttps = proto.toLowerCase() === "http";
  if (!isBareProductionHost && !needsHttps) return null;

  const targetHost = isBareProductionHost ? canonicalHost : host;
  return `https://${targetHost}${originalUrl}`;
}
