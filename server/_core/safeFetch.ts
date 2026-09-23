// ============================================================
// SAFE OUTBOUND FETCH — for any URL a user (or a stored user setting) supplies.
//
// A server that fetches whatever URL it is handed can be pointed at its own
// network: the cloud metadata service (169.254.169.254), localhost admin
// ports, the database. That is server-side request forgery. Every fetch of a
// user-supplied URL goes through here:
//
//   • https only, no credentials in the URL, default port only;
//   • no IP literal, no localhost / .local / .internal / metadata name;
//   • an optional host allow-list (exact host, or ".suffix" for a domain);
//   • every address the name resolves to must be public (no loopback,
//     private, CGNAT, link-local, multicast, reserved or IPv4-mapped private);
//   • redirect: "error", a hard timeout, and a byte cap on the body.
// ============================================================
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

type Env = Record<string, string | undefined>;
export type Resolver = (host: string) => Promise<string[]>;

const defaultResolver: Resolver = async (host) => (await lookup(host, { all: true, verbatim: true })).map((a) => a.address);

const BLOCKED_NAMES = new Set(["localhost", "metadata", "metadata.google.internal", "instance-data", "instance-data.ec2.internal"]);
const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".localdomain", ".home.arpa", ".lan", ".intranet", ".corp"];

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((n, p) => (n << 8) + Number(p), 0) >>> 0;
}

function inV4(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split("/");
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base!) & mask);
}

const PRIVATE_V4 = [
  "0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12",
  "192.0.0.0/24", "192.0.2.0/24", "192.168.0.0/16", "198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24",
  "224.0.0.0/4", "240.0.0.0/4",
];

/** True for any address that is not publicly routable (v4 or v6), including the cloud metadata address. */
export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return PRIVATE_V4.some((c) => inV4(ip, c));
  if (v === 6) {
    const a = ip.toLowerCase().replace(/^\[|\]$/g, "");
    if (a === "::" || a === "::1") return true;
    const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]!);
    if (/^::ffff:/.test(a)) return true; // hex-form mapped addresses: refuse rather than decode
    const first = parseInt(a.split(":")[0] || "0", 16);
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    if (a.startsWith("64:ff9b:") || a.startsWith("2001:db8:") || a.startsWith("100::")) return true;
    return false;
  }
  return true; // not an address at all: refuse
}

function hostMatches(host: string, allow: string): boolean {
  const a = allow.toLowerCase().replace(/\.$/, "");
  return a.startsWith(".") ? host.endsWith(a) && host.length > a.length : host === a;
}

export type UrlCheckOptions = {
  /** Exact hosts, or ".example.com" for a domain and its subdomains. Omit to allow any public host. */
  allowHosts?: string[];
  resolve?: Resolver;
};

/**
 * The checks that need no network: https, no credentials, default port, no IP
 * literal, no local or internal name, and the host allow-list. Use it to reject
 * a URL when it is saved; assertSafeUrl repeats it and adds DNS at fetch time.
 */
export function checkUrlShape(raw: string, opts: Pick<UrlCheckOptions, "allowHosts"> = {}): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Not a valid absolute URL.");
  }
  if (url.protocol !== "https:") throw new UnsafeUrlError("Only https URLs are allowed.");
  if (url.username || url.password) throw new UnsafeUrlError("URLs with credentials are not allowed.");
  if (url.port && url.port !== "443") throw new UnsafeUrlError("Only the default https port is allowed.");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) throw new UnsafeUrlError("The URL has no host.");
  if (isIP(host.replace(/^\[|\]$/g, "")) || /^[\d.]+$/.test(host) || /^0x/i.test(host)) throw new UnsafeUrlError("IP-address URLs are not allowed; use a hostname.");
  if (BLOCKED_NAMES.has(host) || BLOCKED_SUFFIXES.some((s) => host.endsWith(s)) || !host.includes(".")) {
    throw new UnsafeUrlError("Local and internal hostnames are not allowed.");
  }
  if (opts.allowHosts) {
    if (opts.allowHosts.length === 0) throw new UnsafeUrlError("No permitted host is configured for this request.");
    if (!opts.allowHosts.some((a) => hostMatches(host, a))) throw new UnsafeUrlError(`Host ${host} is not permitted for this request.`);
  }
  return url;
}

/** Parse and vet a user-supplied URL. Throws UnsafeUrlError with the reason; resolves to the URL when it is safe to fetch. */
export async function assertSafeUrl(raw: string, opts: UrlCheckOptions = {}): Promise<URL> {
  const url = checkUrlShape(raw, opts);
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  let addresses: string[];
  try {
    addresses = await (opts.resolve ?? defaultResolver)(host);
  } catch {
    throw new UnsafeUrlError(`Host ${host} does not resolve.`);
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) throw new UnsafeUrlError(`Host ${host} resolves to a private or reserved address.`);
  return url;
}

export type SafeFetchOptions = UrlCheckOptions & {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  /** Hard cap on the response body. Default 10 MB. */
  maxBytes?: number;
  /** Hard timeout for the whole request, body included. Default 15 s. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type SafeFetchResult = { ok: boolean; status: number; contentType: string; body: Buffer };

/** Fetch a user-supplied URL with every guard above. Throws UnsafeUrlError for a refused URL or an over-size body. */
export async function safeFetch(raw: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const url = await assertSafeUrl(raw, opts);
  const maxBytes = opts.maxBytes ?? 10 * 1024 * 1024;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);
  try {
    const res = await (opts.fetchImpl ?? fetch)(url.toString(), {
      method: opts.method ?? "GET",
      headers: opts.headers,
      body: opts.body,
      redirect: "error",
      signal: controller.signal,
    });
    const declared = Number(res.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > maxBytes) throw new UnsafeUrlError(`Response is larger than ${maxBytes} bytes.`);
    const chunks: Buffer[] = [];
    let total = 0;
    if (res.body) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel().catch(() => undefined);
          throw new UnsafeUrlError(`Response is larger than ${maxBytes} bytes.`);
        }
        chunks.push(Buffer.from(value));
      }
    }
    return { ok: res.ok, status: res.status, contentType: res.headers.get("content-type") ?? "", body: Buffer.concat(chunks) };
  } catch (e) {
    if (e instanceof UnsafeUrlError) throw e;
    if (controller.signal.aborted) throw new UnsafeUrlError("The request timed out.");
    throw new UnsafeUrlError(`The request failed: ${String((e as Error)?.message ?? e).slice(0, 120)}`);
  } finally {
    clearTimeout(timer);
  }
}

/** The app's own public host(s), from PUBLIC_BASE_URL and RAILWAY_PUBLIC_DOMAIN. */
export function appPublicHosts(env: Env = process.env): string[] {
  const out = new Set<string>();
  const base = env.PUBLIC_BASE_URL?.trim();
  if (base) {
    try { out.add(new URL(base).hostname.toLowerCase()); } catch { /* ignore a malformed value */ }
  }
  const rail = env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (rail) out.add(rail.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""));
  return Array.from(out).filter(Boolean);
}

/** The hosts the file-storage bucket's signed URLs live on (server/storage.ts). */
export function storageBucketHosts(env: Env = process.env): string[] {
  const bucket = env.STORAGE_S3_BUCKET?.trim();
  if (!bucket) return [];
  const endpoint = env.S3_ENDPOINT?.trim();
  if (endpoint) {
    try {
      const h = new URL(endpoint).hostname.toLowerCase();
      return [h, `${bucket}.${h}`];
    } catch {
      return [];
    }
  }
  const region = env.S3_REGION || env.AWS_REGION || "us-east-1";
  return [`${bucket}.s3.amazonaws.com`, `${bucket}.s3.${region}.amazonaws.com`];
}
