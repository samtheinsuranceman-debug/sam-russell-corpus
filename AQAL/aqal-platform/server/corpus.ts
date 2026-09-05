/**
 * Corpus Search Module — TypeScript port of the Python vector search.
 * Uses TF-IDF + cosine similarity for semantic retrieval over Buddy's corpus.
 * 
 * Architecture: The corpus index is built at startup from a JSON manifest
 * and held in memory. Queries are vectorized against the same vocabulary
 * and ranked by cosine similarity.
 * 
 * This is intentionally lightweight — no external dependencies beyond
 * what's already in the project. The Python version uses scikit-learn's
 * TruncatedSVD for dimensionality reduction; this version uses raw TF-IDF
 * vectors with cosine similarity, which is sufficient for the corpus size.
 */

import { z } from "zod";

// ============================================================
// TYPES
// ============================================================

export interface CorpusChunk {
  id: string;
  source: string;
  text: string;
  lineStart: number;
  lineEnd: number;
}

export interface SearchResult {
  id: string;
  source: string;
  text: string;
  score: number;
  lineStart: number;
  lineEnd: number;
}

export interface CorpusIndex {
  chunks: CorpusChunk[];
  vocabulary: Map<string, number>;
  idf: Float64Array;
  tfidfMatrix: Float64Array[]; // sparse-ish: one row per chunk
  ready: boolean;
}

// ============================================================
// TEXT PROCESSING
// ============================================================

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "just", "because", "but", "and", "or", "if", "while", "that", "this",
  "it", "its", "i", "me", "my", "we", "our", "you", "your", "he", "him",
  "his", "she", "her", "they", "them", "their", "what", "which", "who",
  "whom", "these", "those", "am", "about", "up", "down",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// ============================================================
// INDEX BUILDING
// ============================================================

let corpusIndex: CorpusIndex | null = null;

/**
 * Build the corpus index from an array of chunks.
 * Called once at startup or on first query.
 */
export function buildIndex(chunks: CorpusChunk[]): CorpusIndex {
  // Build vocabulary
  const docFreq = new Map<string, number>();
  const tokenizedDocs: string[][] = [];

  for (const chunk of chunks) {
    const tokens = tokenize(chunk.text);
    tokenizedDocs.push(tokens);
    const seen = new Set<string>();
    for (const token of tokens) {
      if (!seen.has(token)) {
        seen.add(token);
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }
  }

  // Filter vocabulary: keep terms appearing in at least minDf docs and at most 80% of docs
  // For small corpora (< 20 docs), allow terms appearing in just 1 doc
  const minDf = chunks.length < 20 ? 1 : 2;
  const maxDf = chunks.length * 0.8;
  const vocabulary = new Map<string, number>();
  let vocabIdx = 0;
  docFreq.forEach((df, term) => {
    if (df >= minDf && df <= maxDf) {
      vocabulary.set(term, vocabIdx++);
    }
  });

  const vocabSize = vocabulary.size;
  const N = chunks.length;

  // Compute IDF
  const idf = new Float64Array(vocabSize);
  vocabulary.forEach((idx, term) => {
    const df = docFreq.get(term) || 1;
    idf[idx] = Math.log((N + 1) / (df + 1)) + 1; // smooth IDF
  });

  // Build TF-IDF matrix (one vector per chunk)
  const tfidfMatrix: Float64Array[] = [];
  for (const tokens of tokenizedDocs) {
    const vec = new Float64Array(vocabSize);
    const termCounts = new Map<string, number>();
    for (const t of tokens) {
      termCounts.set(t, (termCounts.get(t) || 0) + 1);
    }
    let maxTf = 1;
    termCounts.forEach(count => { if (count > maxTf) maxTf = count; });
    termCounts.forEach((count, term) => {
      const idx = vocabulary.get(term);
      if (idx !== undefined) {
        // Augmented TF to prevent bias toward long documents
        const tf = 0.5 + 0.5 * (count / maxTf);
        vec[idx] = tf * idf[idx];
      }
    });
    // L2 normalize
    let norm = 0;
    for (let i = 0; i < vocabSize; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm);
    if (norm > 0) for (let i = 0; i < vocabSize; i++) vec[i] /= norm;
    tfidfMatrix.push(vec);
  }

  const index: CorpusIndex = { chunks, vocabulary, idf, tfidfMatrix, ready: true };
  corpusIndex = index;
  return index;
}

/**
 * Search the corpus for chunks most similar to the query.
 */
export function searchCorpus(query: string, topK: number = 5): SearchResult[] {
  if (!corpusIndex || !corpusIndex.ready) {
    return [];
  }

  const { chunks, vocabulary, idf, tfidfMatrix } = corpusIndex;
  const vocabSize = vocabulary.size;

  // Vectorize query
  const tokens = tokenize(query);
  const qVec = new Float64Array(vocabSize);
  const termCounts = new Map<string, number>();
  for (const t of tokens) {
    termCounts.set(t, (termCounts.get(t) || 0) + 1);
  }
  let maxTf2 = 1;
  termCounts.forEach(count => { if (count > maxTf2) maxTf2 = count; });
  termCounts.forEach((count, term) => {
    const idx = vocabulary.get(term);
    if (idx !== undefined) {
      const tf = 0.5 + 0.5 * (count / maxTf2);
      qVec[idx] = tf * idf[idx];
    }
  });
  // L2 normalize
  let qNorm = 0;
  for (let i = 0; i < vocabSize; i++) qNorm += qVec[i] * qVec[i];
  qNorm = Math.sqrt(qNorm);
  if (qNorm > 0) for (let i = 0; i < vocabSize; i++) qVec[i] /= qNorm;

  // Compute cosine similarity with all chunks
  const scores: Array<{ idx: number; score: number }> = [];
  for (let d = 0; d < tfidfMatrix.length; d++) {
    let dot = 0;
    const dVec = tfidfMatrix[d];
    for (let i = 0; i < vocabSize; i++) dot += qVec[i] * dVec[i];
    if (dot > 0.01) { // threshold to reduce noise
      scores.push({ idx: d, score: dot });
    }
  }

  // Sort by score descending, take topK
  scores.sort((a, b) => b.score - a.score);
  const topResults = scores.slice(0, topK);

  return topResults.map(({ idx, score }) => ({
    id: chunks[idx].id,
    source: chunks[idx].source,
    text: chunks[idx].text.slice(0, 500), // truncate for response size
    score: Math.round(score * 1000) / 1000,
    lineStart: chunks[idx].lineStart,
    lineEnd: chunks[idx].lineEnd,
  }));
}

/**
 * Get corpus stats
 */
export function getCorpusStats(): { totalChunks: number; vocabularySize: number; ready: boolean } {
  if (!corpusIndex) return { totalChunks: 0, vocabularySize: 0, ready: false };
  return {
    totalChunks: corpusIndex.chunks.length,
    vocabularySize: corpusIndex.vocabulary.size,
    ready: corpusIndex.ready,
  };
}

/**
 * Check if corpus is loaded
 */
export function isCorpusReady(): boolean {
  return corpusIndex?.ready ?? false;
}

// ============================================================
// EVALUATION CADENCE
// ============================================================

export interface EvaluationEntry {
  sessionId: string;
  timestamp: number;
  metrics: {
    signalDetection: number;
    calibrationAccuracy: number;
    frontierAwareness: number;
    relationshipDepth: number;
    integrationScore: number;
  };
  notes: string;
  overallScore: number;
}

const evaluationLog: EvaluationEntry[] = [];

export function logEvaluation(entry: EvaluationEntry): void {
  evaluationLog.push(entry);
}

export function getEvaluationReport(): {
  entries: EvaluationEntry[];
  trend: { metric: string; direction: "improving" | "declining" | "stable" }[];
  driftAlerts: string[];
} {
  const entries = [...evaluationLog].sort((a, b) => b.timestamp - a.timestamp);

  // Calculate trends (need at least 3 entries)
  const trend: { metric: string; direction: "improving" | "declining" | "stable" }[] = [];
  const driftAlerts: string[] = [];

  if (entries.length >= 3) {
    const recent3 = entries.slice(0, 3);
    const metricNames = ["signalDetection", "calibrationAccuracy", "frontierAwareness", "relationshipDepth", "integrationScore"] as const;

    for (const metric of metricNames) {
      const values = recent3.map(e => e.metrics[metric]);
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      const oldest = values[values.length - 1];

      if (avg > oldest + 0.5) {
        trend.push({ metric, direction: "improving" });
      } else if (avg < oldest - 0.5) {
        trend.push({ metric, direction: "declining" });
        driftAlerts.push(`⚠️ ${metric} declining over last 3 sessions (avg ${avg.toFixed(1)} vs baseline ${oldest.toFixed(1)})`);
      } else {
        trend.push({ metric, direction: "stable" });
      }
    }
  }

  return { entries, trend, driftAlerts };
}

// Zod schemas for tRPC input validation
export const corpusSearchInput = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().min(1).max(20).optional().default(5),
});

export const evaluationLogInput = z.object({
  sessionId: z.string(),
  metrics: z.object({
    signalDetection: z.number().min(1).max(10),
    calibrationAccuracy: z.number().min(1).max(10),
    frontierAwareness: z.number().min(1).max(10),
    relationshipDepth: z.number().min(1).max(10),
    integrationScore: z.number().min(1).max(10),
  }),
  notes: z.string().optional().default(""),
});
