// ============================================================
// REPORT PDF LOADER — the only way emailAgenda / emailReport read a PDF.
//
// The caller hands us the URL an export returned. We never fetch an arbitrary
// URL (server-side request forgery):
//   • "/files/<key>", or the app's own public host + "/files/<key>", is read
//     straight from the firm's bucket (no HTTP round-trip, no redirect);
//   • any other absolute URL must be https on the storage bucket's host or the
//     app's own public host, pass every check in server/_core/safeFetch.ts, and
//     come back as a PDF within the size and time limits;
//   • with neither host configured, every absolute URL is refused.
// ============================================================
import { TRPCError } from "@trpc/server";
import { FILE_URL_PREFIX, storageGetBytes } from "./storage";
import { UnsafeUrlError, appPublicHosts, safeFetch, storageBucketHosts, type Resolver } from "./_core/safeFetch";

export const REPORT_PDF_MAX_BYTES = 15 * 1024 * 1024;
export const REPORT_PDF_TIMEOUT_MS = 15_000;

type Env = Record<string, string | undefined>;
export type ReportPdfDeps = {
  env?: Env;
  readStored?: (key: string, maxBytes: number) => Promise<{ body: Buffer }>;
  fetchImpl?: typeof fetch;
  resolve?: Resolver;
  /**
   * Ownership rule for first-party "/files/<key>" paths (server/storageOwnership.ts).
   * When given, a key it rejects is refused before anything is read.
   */
  canReadKey?: (key: string) => boolean;
};

function isSafeKey(key: string) {
  return key.length > 0 && key.length <= 512 && !key.startsWith("/") && !key.includes("..") && !key.includes("\\") && !key.includes("\0");
}

function refuse(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

function assertPdf(body: Buffer): Buffer {
  if (body.subarray(0, 5).toString("latin1") !== "%PDF-") refuse("That file is not a PDF.");
  return body;
}

export async function loadReportPdf(pdfUrl: string, deps: ReportPdfDeps = {}): Promise<Buffer> {
  const env = deps.env ?? process.env;
  const readStored = deps.readStored ?? storageGetBytes;
  const ownHosts = appPublicHosts(env);

  const storedKey = (path: string): string | null => {
    if (!path.startsWith(FILE_URL_PREFIX)) return null;
    let key: string;
    try { key = decodeURIComponent(path.slice(FILE_URL_PREFIX.length)); } catch { return refuse("Invalid file path."); }
    if (!isSafeKey(key)) return refuse("Invalid file path.");
    if (deps.canReadKey && !deps.canReadKey(key)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "That file is not one of yours." });
    }
    return key;
  };

  // 1. A first-party file path: read from the bucket directly.
  if (pdfUrl.startsWith("/")) {
    const key = storedKey(pdfUrl.split(/[?#]/)[0]!);
    if (!key) refuse("Only files exported by this site can be emailed.");
    return assertPdf((await readStored(key, REPORT_PDF_MAX_BYTES)).body);
  }

  let parsed: URL;
  try { parsed = new URL(pdfUrl); } catch { return refuse("Not a valid URL."); }
  if (parsed.protocol === "https:" && ownHosts.includes(parsed.hostname.toLowerCase())) {
    const key = storedKey(parsed.pathname);
    if (key) return assertPdf((await readStored(key, REPORT_PDF_MAX_BYTES)).body);
  }

  // 2. An absolute URL: only the bucket's host or the app's own host, with every guard.
  const allowHosts = [...storageBucketHosts(env), ...ownHosts];
  try {
    const res = await safeFetch(pdfUrl, { allowHosts, maxBytes: REPORT_PDF_MAX_BYTES, timeoutMs: REPORT_PDF_TIMEOUT_MS, fetchImpl: deps.fetchImpl, resolve: deps.resolve });
    if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch PDF" });
    return assertPdf(res.body);
  } catch (e) {
    if (e instanceof UnsafeUrlError) refuse(`PDF URL refused: ${e.message}`);
    throw e;
  }
}
