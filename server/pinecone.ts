// ============================================================
// PINECONE — vector store (PINECONE_API_KEY, PINECONE_INDEX_HOST).
//
// Two planes, both with the key in an Api-Key header and the API version
// pinned in X-Pinecone-Api-Version:
//   control  https://api.pinecone.io — GET /indexes (the key check)
//   data     the index's own host, which Pinecone shows on the index page
//            (e.g. my-index-abc123.svc.us-east1-aws.pinecone.io):
//            POST /vectors/upsert, POST /query
//
// No feature stores vectors yet (see server/voyage.ts); this is the
// client and its status, ready for the first one that does.
// ============================================================

const CONTROL = "https://api.pinecone.io";
export const PINECONE_API_VERSION = "2026-07";

export type PineconeVector = { id: string; values: number[]; metadata?: Record<string, string | number | boolean | string[]> };
export type PineconeMatch = { id: string; score: number; metadata?: Record<string, unknown> };

export function pineconeConfigured(env: NodeJS.ProcessEnv = process.env): { key: boolean; index: boolean } {
  return { key: Boolean(env.PINECONE_API_KEY?.trim()), index: Boolean(env.PINECONE_INDEX_HOST?.trim()) };
}

function headers(env: NodeJS.ProcessEnv): Record<string, string> {
  const key = env.PINECONE_API_KEY?.trim();
  if (!key) throw new Error("Pinecone is not configured: PINECONE_API_KEY is not set");
  return { "api-key": key, "x-pinecone-api-version": PINECONE_API_VERSION, "content-type": "application/json" };
}

/** The index's data-plane base URL, from PINECONE_INDEX_HOST with or without its scheme. */
export function indexBase(env: NodeJS.ProcessEnv = process.env): string {
  const host = env.PINECONE_INDEX_HOST?.trim().replace(/\/+$/, "");
  if (!host) throw new Error("Pinecone index is not configured: PINECONE_INDEX_HOST is not set");
  return /^https:\/\//.test(host) ? host : `https://${host.replace(/^https?:\/\//, "")}`;
}

/** The project's indexes by name; a cheap call that proves the key works. */
export async function pineconeListIndexes(env: NodeJS.ProcessEnv = process.env): Promise<Array<{ name: string; host: string }>> {
  const res = await fetch(`${CONTROL}/indexes`, { headers: headers(env), signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Pinecone index list failed (HTTP ${res.status})`);
  const body = (await res.json()) as { indexes?: Array<{ name: string; host: string }> };
  return body.indexes ?? [];
}

export async function pineconeUpsert(vectors: PineconeVector[], namespace = "", env: NodeJS.ProcessEnv = process.env): Promise<number> {
  const res = await fetch(`${indexBase(env)}/vectors/upsert`, {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify({ vectors, ...(namespace ? { namespace } : {}) }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Pinecone upsert failed (HTTP ${res.status})`);
  const body = (await res.json()) as { upsertedCount?: number };
  return body.upsertedCount ?? vectors.length;
}

export async function pineconeQuery(
  vector: number[],
  opts: { topK?: number; namespace?: string; filter?: Record<string, unknown>; env?: NodeJS.ProcessEnv } = {},
): Promise<PineconeMatch[]> {
  const env = opts.env ?? process.env;
  const res = await fetch(`${indexBase(env)}/query`, {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify({ vector, topK: opts.topK ?? 5, includeMetadata: true, ...(opts.namespace ? { namespace: opts.namespace } : {}), ...(opts.filter ? { filter: opts.filter } : {}) }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Pinecone query failed (HTTP ${res.status})`);
  const body = (await res.json()) as { matches?: PineconeMatch[] };
  return body.matches ?? [];
}
