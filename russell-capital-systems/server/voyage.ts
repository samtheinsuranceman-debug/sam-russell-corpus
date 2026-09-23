// ============================================================
// VOYAGE AI — text embeddings (VOYAGE_API_KEY).
//
// POST https://api.voyageai.com/v1/embeddings with a bearer key. The
// default is voyage-4 (1,024 dimensions, shared embedding space with the
// rest of the Voyage 4 family); VOYAGE_MODEL overrides it and passes the
// China-policy check first.
//
// The site has no semantic search of its own yet (the Financial Librarian
// reads the client's assessment and a fixed page catalogue, and memory
// goes to Mem0's hosted API), so nothing calls this today. It is here,
// with server/pinecone.ts, for the first feature that needs vectors.
// ============================================================
import { assertModelAllowed } from "@shared/aiProviders";

const VOYAGE = "https://api.voyageai.com/v1";
export const VOYAGE_DEFAULT_MODEL = "voyage-4";

export type VoyageInputType = "query" | "document";
export type EmbedResult = { vectors: number[][]; model: string; tokens: number | null };

export function voyageConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.VOYAGE_API_KEY?.trim());
}

/** Embed up to 128 texts in one call (Voyage's per-request limit). */
export async function voyageEmbed(
  texts: string[],
  opts: { inputType?: VoyageInputType; model?: string; dimensions?: 256 | 512 | 1024 | 2048; env?: NodeJS.ProcessEnv } = {},
): Promise<EmbedResult> {
  const env = opts.env ?? process.env;
  const key = env.VOYAGE_API_KEY?.trim();
  if (!key) throw new Error("Voyage AI is not configured: VOYAGE_API_KEY is not set");
  if (!texts.length) return { vectors: [], model: opts.model ?? VOYAGE_DEFAULT_MODEL, tokens: 0 };
  if (texts.length > 128) throw new Error("Voyage AI embeds at most 128 texts per request");
  const model = opts.model?.trim() || env.VOYAGE_MODEL?.trim() || VOYAGE_DEFAULT_MODEL;
  assertModelAllowed(model, "Voyage embedding model");
  const res = await fetch(`${VOYAGE}/embeddings`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ input: texts, model, ...(opts.inputType ? { input_type: opts.inputType } : {}), ...(opts.dimensions ? { output_dimension: opts.dimensions } : {}) }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Voyage AI embedding failed (HTTP ${res.status})`);
  const body = (await res.json()) as { data?: Array<{ embedding?: number[]; index?: number }>; model?: string; usage?: { total_tokens?: number } };
  const rows = [...(body.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return { vectors: rows.map((r) => r.embedding ?? []), model: body.model ?? model, tokens: body.usage?.total_tokens ?? null };
}
