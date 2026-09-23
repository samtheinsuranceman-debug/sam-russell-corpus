// ============================================================
// Voyage AI embeddings and the Pinecone vector store: the clients only
// (no feature embeds or stores vectors yet). Network mocked; no key is real.
// ============================================================
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHINA_POLICY_MESSAGE } from "@shared/aiProviders";
import { VOYAGE_DEFAULT_MODEL, voyageConfigured, voyageEmbed } from "./voyage";
import { PINECONE_API_VERSION, indexBase, pineconeConfigured, pineconeListIndexes, pineconeQuery, pineconeUpsert } from "./pinecone";

type Call = { url: string; method: string; headers: Record<string, string>; body: string };
let calls: Call[] = [];

function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, method: init.method ?? "GET", headers: (init.headers ?? {}) as Record<string, string>, body: typeof init.body === "string" ? init.body : "" });
    return handler(url, init);
  }));
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const VO = { VOYAGE_API_KEY: "test-voyage-key" } as NodeJS.ProcessEnv;
const PC = { PINECONE_API_KEY: "test-pinecone-key", PINECONE_INDEX_HOST: "rcs-abc123.svc.aped-4627-b74a.pinecone.io" } as NodeJS.ProcessEnv;

beforeEach(() => { calls = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("Voyage AI", () => {
  it("posts the texts to /v1/embeddings on voyage-4 and returns vectors in input order", async () => {
    stubFetch(() => json({ object: "list", data: [{ embedding: [0.3, 0.4], index: 1 }, { embedding: [0.1, 0.2], index: 0 }], model: "voyage-4", usage: { total_tokens: 7 } }));
    const r = await voyageEmbed(["first", "second"], { inputType: "document", env: VO });
    expect(r).toEqual({ vectors: [[0.1, 0.2], [0.3, 0.4]], model: "voyage-4", tokens: 7 });
    expect(calls[0]!.url).toBe("https://api.voyageai.com/v1/embeddings");
    expect(calls[0]!.headers.authorization).toBe("Bearer test-voyage-key");
    expect(JSON.parse(calls[0]!.body)).toEqual({ input: ["first", "second"], model: VOYAGE_DEFAULT_MODEL, input_type: "document" });
  });

  it("refuses a China-linked model id before calling out", async () => {
    stubFetch(() => json({}));
    await expect(voyageEmbed(["x"], { model: "BAAI/bge-m3", env: VO })).rejects.toThrow(CHINA_POLICY_MESSAGE);
    expect(calls).toHaveLength(0);
  });

  it("reports an HTTP failure and says plainly when the key is missing", async () => {
    stubFetch(() => json({ detail: "bad" }, 401));
    await expect(voyageEmbed(["x"], { env: VO })).rejects.toThrow(/Voyage AI embedding failed \(HTTP 401\)/);
    await expect(voyageEmbed(["x"], { env: {} as NodeJS.ProcessEnv })).rejects.toThrow(/Voyage AI is not configured: VOYAGE_API_KEY is not set/);
    expect(voyageConfigured(VO)).toBe(true);
  });
});

describe("Pinecone", () => {
  it("lists indexes on the control plane with Api-Key and the pinned version", async () => {
    stubFetch(() => json({ indexes: [{ name: "rcs", host: "rcs-abc123.svc.pinecone.io" }] }));
    expect(await pineconeListIndexes(PC)).toEqual([{ name: "rcs", host: "rcs-abc123.svc.pinecone.io" }]);
    expect(calls[0]!.url).toBe("https://api.pinecone.io/indexes");
    expect(calls[0]!.headers["api-key"]).toBe("test-pinecone-key");
    expect(calls[0]!.headers["x-pinecone-api-version"]).toBe(PINECONE_API_VERSION);
  });

  it("upserts and queries on the index's own host", async () => {
    stubFetch((url) => (url.endsWith("/vectors/upsert") ? json({ upsertedCount: 1 }) : json({ matches: [{ id: "doc-1", score: 0.91, metadata: { title: "Roth" } }] })));
    expect(await pineconeUpsert([{ id: "doc-1", values: [0.1, 0.2], metadata: { title: "Roth" } }], "notes", PC)).toBe(1);
    expect(calls[0]!.url).toBe("https://rcs-abc123.svc.aped-4627-b74a.pinecone.io/vectors/upsert");
    expect(JSON.parse(calls[0]!.body)).toEqual({ vectors: [{ id: "doc-1", values: [0.1, 0.2], metadata: { title: "Roth" } }], namespace: "notes" });
    const m = await pineconeQuery([0.1, 0.2], { topK: 3, env: PC });
    expect(m[0]).toMatchObject({ id: "doc-1", score: 0.91 });
    expect(JSON.parse(calls[1]!.body)).toEqual({ vector: [0.1, 0.2], topK: 3, includeMetadata: true });
    expect(indexBase({ PINECONE_INDEX_HOST: "https://h.pinecone.io/" } as NodeJS.ProcessEnv)).toBe("https://h.pinecone.io");
  });

  it("reports an HTTP failure and says plainly when the key or the index host is missing", async () => {
    stubFetch(() => json({ error: { message: "unauthorized" } }, 401));
    await expect(pineconeListIndexes(PC)).rejects.toThrow(/Pinecone index list failed \(HTTP 401\)/);
    await expect(pineconeListIndexes({} as NodeJS.ProcessEnv)).rejects.toThrow(/Pinecone is not configured: PINECONE_API_KEY is not set/);
    await expect(pineconeQuery([1], { env: { PINECONE_API_KEY: "k" } as NodeJS.ProcessEnv })).rejects.toThrow(/PINECONE_INDEX_HOST is not set/);
    expect(pineconeConfigured(PC)).toEqual({ key: true, index: true });
  });
});
