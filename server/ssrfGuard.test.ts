/**
 * Server-side request forgery guards: every server fetch of a user-supplied URL
 * (emailAgenda / emailReport PDFs, workspace webhooks, the Slack test message,
 * owner harvest overrides) goes through server/_core/safeFetch.ts. No test here
 * touches the network: DNS and fetch are injected.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  UnsafeUrlError,
  appPublicHosts,
  assertSafeUrl,
  checkUrlShape,
  isPrivateAddress,
  safeFetch,
  storageBucketHosts,
} from "./_core/safeFetch";
import { REPORT_PDF_MAX_BYTES, loadReportPdf } from "./reportPdf";

const PUBLIC_IP = async () => ["93.184.216.34"];
const PDF = Buffer.from("%PDF-1.7\n%test\n");

function okResponse(body: Buffer | string, headers: Record<string, string> = {}) {
  return new Response(typeof body === "string" ? body : new Uint8Array(body), { status: 200, headers: { "content-type": "application/pdf", ...headers } });
}

describe("URL shape: refused before any network", () => {
  const refused: Array<[string, RegExp]> = [
    ["http://files.example.com/a.pdf", /Only https/],
    ["ftp://files.example.com/a.pdf", /Only https/],
    ["file:///etc/passwd", /Only https/],
    ["https://user:pass@files.example.com/a.pdf", /credentials/],
    ["https://files.example.com:8443/a.pdf", /default https port/],
    ["https://127.0.0.1/a.pdf", /IP-address/],
    ["https://10.0.0.5/a.pdf", /IP-address/],
    ["https://169.254.169.254/latest/meta-data/", /IP-address/],
    ["https://[::1]/a.pdf", /IP-address/],
    ["https://[fd00::1]/a.pdf", /IP-address/],
    ["https://2130706433/a.pdf", /IP-address/],
    ["https://0x7f000001/a.pdf", /IP-address/],
    ["https://localhost/a.pdf", /Local and internal/],
    ["https://api.localhost/a.pdf", /Local and internal/],
    ["https://metadata.google.internal/computeMetadata/v1/", /Local and internal/],
    ["https://printer.local/a.pdf", /Local and internal/],
    ["https://intranet/a.pdf", /Local and internal/],
    ["not a url", /valid absolute URL/],
  ];
  for (const [url, reason] of refused) {
    it(`refuses ${url}`, () => {
      expect(() => checkUrlShape(url)).toThrow(reason);
    });
  }

  it("enforces a host allow-list, exact or by domain suffix, and refuses everything when the list is empty", () => {
    expect(() => checkUrlShape("https://evil.example.org/a.pdf", { allowHosts: ["files.example.com"] })).toThrow(/not permitted/);
    expect(checkUrlShape("https://files.example.com/a.pdf", { allowHosts: ["files.example.com"] }).hostname).toBe("files.example.com");
    expect(checkUrlShape("https://eu.files.example.com/a.pdf", { allowHosts: [".example.com"] }).hostname).toBe("eu.files.example.com");
    expect(() => checkUrlShape("https://example.com.evil.org/a.pdf", { allowHosts: [".example.com"] })).toThrow(/not permitted/);
    expect(() => checkUrlShape("https://files.example.com/a.pdf", { allowHosts: [] })).toThrow(/No permitted host/);
  });
});

describe("DNS: a public-looking name that resolves inward is refused", () => {
  it("classifies private, loopback, link-local, metadata, CGNAT, multicast and mapped addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fd12::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:169.254.169.254", "ff02::1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ["93.184.216.34", "8.8.8.8", "2606:4700:4700::1111", "172.32.0.1"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });

  for (const ip of ["169.254.169.254", "127.0.0.1", "10.0.0.8", "fe80::1"]) {
    it(`refuses a name that resolves to ${ip}`, async () => {
      await expect(assertSafeUrl("https://rebind.example.com/a.pdf", { resolve: async () => ["93.184.216.34", ip] })).rejects.toThrow(/private or reserved/);
    });
  }

  it("refuses a name that does not resolve", async () => {
    await expect(assertSafeUrl("https://nx.example.com/a.pdf", { resolve: async () => { throw new Error("ENOTFOUND"); } })).rejects.toThrow(/does not resolve/);
  });
});

describe("safeFetch: redirect, size and time limits", () => {
  it("never follows a redirect", async () => {
    const fetchImpl = vi.fn(async (_u: string | URL | Request, init?: RequestInit) => {
      expect(init?.redirect).toBe("error");
      return okResponse(PDF);
    });
    await safeFetch("https://files.example.com/a.pdf", { resolve: PUBLIC_IP, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("surfaces a redirect the runtime refused as a refusal", async () => {
    const fetchImpl = (async () => { throw new TypeError("fetch failed: unexpected redirect"); }) as unknown as typeof fetch;
    await expect(safeFetch("https://files.example.com/a.pdf", { resolve: PUBLIC_IP, fetchImpl })).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("refuses a declared body over the cap without reading it", async () => {
    const fetchImpl = (async () => okResponse(PDF, { "content-length": String(10_000_000) })) as unknown as typeof fetch;
    await expect(safeFetch("https://files.example.com/a.pdf", { resolve: PUBLIC_IP, fetchImpl, maxBytes: 1024 })).rejects.toThrow(/larger than 1024 bytes/);
  });

  it("refuses a streamed body that grows past the cap", async () => {
    const fetchImpl = (async () => okResponse(Buffer.alloc(4096, 1))) as unknown as typeof fetch;
    await expect(safeFetch("https://files.example.com/a.pdf", { resolve: PUBLIC_IP, fetchImpl, maxBytes: 1024 })).rejects.toThrow(/larger than 1024 bytes/);
  });

  it("aborts at the time limit", async () => {
    const fetchImpl = ((_u: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))))) as unknown as typeof fetch;
    await expect(safeFetch("https://files.example.com/a.pdf", { resolve: PUBLIC_IP, fetchImpl, timeoutMs: 20 })).rejects.toThrow(/timed out/);
  });

  it("never calls fetch for a refused URL", async () => {
    const fetchImpl = vi.fn();
    await expect(safeFetch("https://169.254.169.254/latest/meta-data/", { fetchImpl: fetchImpl as unknown as typeof fetch })).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("emailAgenda / emailReport PDF loader", () => {
  const env = { PUBLIC_BASE_URL: "https://www.russellcapitalsystems.com", STORAGE_S3_BUCKET: "rcs-files", S3_ENDPOINT: "https://acct.r2.cloudflarestorage.com" };
  const readStored = vi.fn(async (key: string) => ({ body: key === "reports/a.pdf" ? PDF : Buffer.from("not a pdf") }));

  it("derives the permitted hosts from PUBLIC_BASE_URL and the storage bucket", () => {
    expect(appPublicHosts(env)).toEqual(["www.russellcapitalsystems.com"]);
    expect(storageBucketHosts(env)).toEqual(["acct.r2.cloudflarestorage.com", "rcs-files.acct.r2.cloudflarestorage.com"]);
    expect(storageBucketHosts({ STORAGE_S3_BUCKET: "b", S3_REGION: "us-east-2" })).toEqual(["b.s3.amazonaws.com", "b.s3.us-east-2.amazonaws.com"]);
    expect(storageBucketHosts({})).toEqual([]);
  });

  it("reads a first-party /files/ path, relative or on the app's own host, straight from storage", async () => {
    expect(await loadReportPdf("/files/reports/a.pdf", { env, readStored })).toEqual(PDF);
    expect(await loadReportPdf("https://www.russellcapitalsystems.com/files/reports/a.pdf", { env, readStored })).toEqual(PDF);
  });

  it("refuses a traversal or foreign path", async () => {
    await expect(loadReportPdf("/files/../secrets", { env, readStored })).rejects.toBeInstanceOf(TRPCError);
    await expect(loadReportPdf("/api/admin/export", { env, readStored })).rejects.toThrow(/Only files exported by this site/);
  });

  it("refuses a stored file that is not a PDF", async () => {
    await expect(loadReportPdf("/files/other.bin", { env, readStored })).rejects.toThrow(/not a PDF/);
  });

  it("fetches a signed URL on the bucket host with every guard, and accepts a PDF", async () => {
    const fetchImpl = vi.fn(async (_u: string | URL | Request, init?: RequestInit) => {
      expect(init?.redirect).toBe("error");
      return okResponse(PDF);
    });
    const out = await loadReportPdf("https://rcs-files.acct.r2.cloudflarestorage.com/files/r.pdf?X-Amz-Signature=abc", { env, fetchImpl: fetchImpl as unknown as typeof fetch, resolve: PUBLIC_IP });
    expect(out).toEqual(PDF);
  });

  const refusedUrls: Array<[string, RegExp]> = [
    ["http://rcs-files.acct.r2.cloudflarestorage.com/files/r.pdf", /Only https/],
    ["https://169.254.169.254/latest/meta-data/iam/security-credentials/", /IP-address/],
    ["https://localhost/files/r.pdf", /Local and internal/],
    ["https://attacker.example.org/r.pdf", /not permitted/],
    ["https://metadata.google.internal/computeMetadata/v1/", /Local and internal/],
  ];
  for (const [url, reason] of refusedUrls) {
    it(`refuses ${url}`, async () => {
      const fetchImpl = vi.fn();
      await expect(loadReportPdf(url, { env, fetchImpl: fetchImpl as unknown as typeof fetch, resolve: PUBLIC_IP })).rejects.toThrow(reason);
      expect(fetchImpl).not.toHaveBeenCalled();
    });
  }

  it("refuses a bucket host that resolves to a private address", async () => {
    await expect(loadReportPdf("https://rcs-files.acct.r2.cloudflarestorage.com/r.pdf", { env, resolve: async () => ["10.0.0.4"] })).rejects.toThrow(/private or reserved/);
  });

  it("refuses every absolute URL when no permitted host can be determined", async () => {
    const fetchImpl = vi.fn();
    await expect(loadReportPdf("https://files.example.com/r.pdf", { env: {}, fetchImpl: fetchImpl as unknown as typeof fetch, resolve: PUBLIC_IP })).rejects.toThrow(/No permitted host/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses an over-size PDF", async () => {
    const fetchImpl = (async () => okResponse(PDF, { "content-length": String(REPORT_PDF_MAX_BYTES + 1) })) as unknown as typeof fetch;
    await expect(loadReportPdf("https://rcs-files.acct.r2.cloudflarestorage.com/r.pdf", { env, fetchImpl, resolve: PUBLIC_IP })).rejects.toThrow(/larger than/);
  });
});

describe("every user-supplied server fetch goes through the guard", () => {
  const read = (f: string) => readFileSync(join(__dirname, f), "utf8");

  it("emailAgenda and emailReport never fetch the URL they are given", () => {
    const src = read("routers.ts");
    expect(src).not.toMatch(/fetch\(input\.pdfUrl\)/);
    expect(src.match(/loadReportPdf\(input\.pdfUrl[,)]/g)?.length).toBe(2);
    // ...and only a stored file the caller's workspace owns (C-3, server/storageOwnership.ts).
    expect(src.match(/loadReportPdf\(input\.pdfUrl, \{\s*canReadKey: \(key\) => callerMayReadStorageKey\(key,/g)?.length).toBe(2);
  });

  it("workspace webhooks and the Slack test message use safeFetch; saved URLs are shape-checked", () => {
    expect(read("webhookDispatch.ts")).toMatch(/safeFetch\(hook\.url/);
    expect(read("webhookDispatch.ts")).not.toMatch(/\bfetch\(hook\.url/);
    const src = read("routers.ts");
    expect(src).toMatch(/safeFetch\(integration\.webhookUrl, \{\s*allowHosts: SLACK_WEBHOOK_HOSTS/);
    expect(src.match(/assertWebhookUrlShape\(/g)!.length).toBeGreaterThanOrEqual(4);
  });

  it("an owner harvest override must stay on the source's host", () => {
    expect(read("forecastSources.ts")).toMatch(/assertSafeUrl\(opts\.url, \{ allowHosts: \[new URL\(source\.url\)\.hostname\] \}\)/);
  });
});
