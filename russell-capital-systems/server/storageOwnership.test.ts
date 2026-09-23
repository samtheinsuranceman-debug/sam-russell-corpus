/**
 * /files/{key} ownership (security review P11-A, C-3): a signed-in caller gets
 * a signed URL only for keys their own workspace (or they) own; the admin gets
 * any key; unknown prefixes are refused; client-portal tokens keep their own,
 * separately scoped path. Session, database and bucket are stubbed.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callerMayReadStorageKey, storageKeyOwner } from "./storageOwnership";

const authenticateRequest = vi.fn();
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: (...a: unknown[]) => authenticateRequest(...a) } }));
const getWorkspaceByOwnerId = vi.fn();
const portalTokenCanAccessStorageKey = vi.fn(async () => false);
vi.mock("./db", () => ({
  getWorkspaceByOwnerId: (...a: unknown[]) => getWorkspaceByOwnerId(...a),
  portalTokenCanAccessStorageKey: (...a: unknown[]) => portalTokenCanAccessStorageKey(...(a as [])),
}));
vi.mock("./storage", () => ({
  FILE_URL_PREFIX: "/files/",
  isStorageConfigured: () => true,
  storageGetSignedUrl: vi.fn(async (key: string) => `https://bucket.example.test/${key}?signed`),
}));

const { registerStorageProxy } = await import("./_core/storageProxy");

type Handler = (req: unknown, res: unknown) => Promise<void>;
let handler: Handler;
registerStorageProxy({ get: (_path: string, h: Handler) => { handler = h; } } as never);

async function fetchKey(key: string, query: Record<string, string> = {}) {
  const out: { status?: number; location?: string } = {};
  const res = {
    status(code: number) { out.status = code; return res; },
    send() { return res; },
    set() { return res; },
    redirect(code: number, url: string) { out.status = code; out.location = url; return res; },
  };
  await handler({ params: { 0: key }, query, headers: {} }, res);
  return out;
}

const guest = { id: 7, role: "user" };
const admin = { id: 1, role: "admin" };

beforeEach(() => {
  authenticateRequest.mockReset();
  getWorkspaceByOwnerId.mockReset();
  portalTokenCanAccessStorageKey.mockReset();
  portalTokenCanAccessStorageKey.mockResolvedValue(false);
  getWorkspaceByOwnerId.mockImplementation(async (userId: number) => (userId === 7 ? { id: 42 } : null));
});

describe("storageKeyOwner", () => {
  it("reads the owner from every prefix the app writes", () => {
    expect(storageKeyOwner("docs/42/5/ab12-will.pdf")).toEqual({ kind: "workspace", id: 42 });
    expect(storageKeyOwner("tax-returns/42/5/x_1a2b3c4d.pdf")).toEqual({ kind: "workspace", id: 42 });
    expect(storageKeyOwner("illustrations/42/x.pdf")).toEqual({ kind: "workspace", id: 42 });
    expect(storageKeyOwner("knowledge/42/x.txt")).toEqual({ kind: "workspace", id: 42 });
    expect(storageKeyOwner("reports/42/5/1-report.html")).toEqual({ kind: "workspace", id: 42 });
    expect(storageKeyOwner("agendas/42/uuid.pdf")).toEqual({ kind: "workspace", id: 42 });
    expect(storageKeyOwner("strategy-exports/42/uuid.pdf")).toEqual({ kind: "workspace", id: 42 });
    expect(storageKeyOwner("slides/7/Deck_abc.pptx")).toEqual({ kind: "user", id: 7 });
    expect(storageKeyOwner("mortgage-statements/7/x.pdf")).toEqual({ kind: "user", id: 7 });
    expect(storageKeyOwner("avatars/7/self-original.jpg")).toEqual({ kind: "user", id: 7 });
    expect(storageKeyOwner("bulk-reports/7/2026-09-23-uuid.pdf")).toEqual({ kind: "user", id: 7 });
    expect(storageKeyOwner("generated/avatars/7/abc.png")).toEqual({ kind: "user", id: 7 });
    expect(storageKeyOwner("generated/owner/1/abc.png")).toEqual({ kind: "user", id: 1 });
  });

  it("names no owner for unknown prefixes, legacy owner-less keys or odd ids", () => {
    for (const key of ["secret/42/x.pdf", "reports/rpt-123.pdf", "agendas/agenda-1.pdf", "strategy-exports/1-abc.pdf", "docs/abc/x.pdf", "docs/042/x.pdf", "docs//x.pdf", "docs/42", "generated/misc/7/x.png", "../docs/42/x", "/docs/42/x"]) {
      expect(storageKeyOwner(key), key).toBeNull();
    }
  });
});

describe("callerMayReadStorageKey", () => {
  const me = { userId: 7, role: "user", workspaceId: 42 };
  it("allows own workspace and own user keys only", () => {
    expect(callerMayReadStorageKey("docs/42/5/x.pdf", me)).toBe(true);
    expect(callerMayReadStorageKey("docs/99/6/x.pdf", me)).toBe(false);
    expect(callerMayReadStorageKey("slides/7/x.pptx", me)).toBe(true);
    expect(callerMayReadStorageKey("slides/8/x.pptx", me)).toBe(false);
    expect(callerMayReadStorageKey("bulk-reports/7-2026-09-23-1.pdf", me)).toBe(true);
    expect(callerMayReadStorageKey("bulk-reports/8-2026-09-23-1.pdf", me)).toBe(false);
  });
  it("denies unknown prefixes to non-admins and everything to a caller with no workspace", () => {
    expect(callerMayReadStorageKey("unknown/42/x", me)).toBe(false);
    expect(callerMayReadStorageKey("docs/42/5/x.pdf", { ...me, workspaceId: null })).toBe(false);
  });
  it("lets the admin read any key", () => {
    expect(callerMayReadStorageKey("docs/99/6/x.pdf", { userId: 1, role: "admin", workspaceId: null })).toBe(true);
    expect(callerMayReadStorageKey("reports/rpt-123.pdf", { userId: 1, role: "admin", workspaceId: null })).toBe(true);
  });
});

describe("GET /files/{key}", () => {
  it("serves a guest's own workspace file", async () => {
    authenticateRequest.mockResolvedValue(guest);
    await expect(fetchKey("tax-returns/42/5/return.pdf")).resolves.toMatchObject({ status: 307 });
  });

  it("refuses another workspace's file to a signed-in guest (404, nothing signed)", async () => {
    authenticateRequest.mockResolvedValue(guest);
    await expect(fetchKey("tax-returns/99/6/return.pdf")).resolves.toEqual({ status: 404 });
    await expect(fetchKey("docs/99/6/will.pdf")).resolves.toEqual({ status: 404 });
  });

  it("refuses unknown prefixes to a guest but not to the admin", async () => {
    authenticateRequest.mockResolvedValue(guest);
    await expect(fetchKey("mystery/42/file.bin")).resolves.toEqual({ status: 404 });
    authenticateRequest.mockResolvedValue(admin);
    await expect(fetchKey("mystery/42/file.bin")).resolves.toMatchObject({ status: 307 });
    await expect(fetchKey("docs/99/6/will.pdf")).resolves.toMatchObject({ status: 307 });
  });

  it("does not create a workspace while checking", async () => {
    authenticateRequest.mockResolvedValue({ id: 555, role: "user" });
    await expect(fetchKey("docs/42/5/x.pdf")).resolves.toEqual({ status: 404 });
    expect(getWorkspaceByOwnerId).toHaveBeenCalledWith(555);
  });

  it("keeps the portal-token path: signed out, a valid token for that key is served", async () => {
    authenticateRequest.mockRejectedValue(new Error("no session"));
    portalTokenCanAccessStorageKey.mockImplementation(async (token: string, key: string) => token === "portal-token-for-tests" && key === "docs/99/6/x.pdf");
    await expect(fetchKey("docs/99/6/x.pdf", { portalToken: "portal-token-for-tests" })).resolves.toMatchObject({ status: 307 });
    await expect(fetchKey("docs/99/6/y.pdf", { portalToken: "portal-token-for-tests" })).resolves.toEqual({ status: 404 });
    await expect(fetchKey("docs/99/6/x.pdf")).resolves.toEqual({ status: 404 });
  });

  it("still serves the fixed public assets without a session", async () => {
    authenticateRequest.mockRejectedValue(new Error("no session"));
    await expect(fetchKey("divorce_calculator_explainer_3a588ea7.mp4")).resolves.toMatchObject({ status: 307 });
  });
});

describe("loadReportPdf (report/agenda e-mail) applies the same rule", () => {
  it("refuses a /files key the caller does not own before reading it", async () => {
    const { loadReportPdf } = await import("./reportPdf");
    const readStored = vi.fn(async () => ({ body: Buffer.from("%PDF-1.4 test") }));
    const canReadKey = (key: string) => callerMayReadStorageKey(key, { userId: 7, role: "user", workspaceId: 42 });
    await expect(loadReportPdf("/files/reports/99/x.pdf", { readStored, canReadKey })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(loadReportPdf("/files/reports/rpt-123.pdf", { readStored, canReadKey })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(readStored).not.toHaveBeenCalled();
    await expect(loadReportPdf("/files/reports/42/x.pdf", { readStored, canReadKey })).resolves.toBeInstanceOf(Buffer);
  });
});
