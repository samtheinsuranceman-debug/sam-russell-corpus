// ============================================================
// Live research — Perplexity fetches fresh citations for THIS profile
// ============================================================
// After the panel scores someone, we ask Perplexity (live web + citations) for
// peer-reviewed sources specific to their top strengths and bottleneck
// weaknesses: how to interpret them, fortify the strengths, patch the weaknesses.
//
// HONESTY GUARDRAIL: Perplexity hallucinates citations (fabricated DOIs, wrong-
// domain papers, predatory venues — see RESEARCH_PIPELINE.md). So everything this
// returns is flagged `verified: false` and MUST be shown in a clearly-separated
// "live, unvetted" panel — never merged into the curated library, never counted
// in "0 fabricated". Empty key → mock returns NOTHING (we never invent a source).

import {
  PERPLEXITY_API_KEY, PERPLEXITY_BASE_URL, PERPLEXITY_MODEL, verificationProvider,
} from "./config";

export type LiveCitation = {
  title: string;
  source: string;   // journal / outlet as reported by Perplexity
  url: string;      // link or DOI, if given
  relevance: string; // one line: how it fortifies a strength / patches a weakness
  topic: string;    // the cluster or line it was fetched for
  verified: false;  // ALWAYS false — these are live, unvetted results
};

export type LiveResearchResult = {
  mocked: boolean;
  citations: LiveCitation[];
  note: string;
};

const SYSTEM = `You are a research librarian. Return ONLY peer-reviewed academic sources
(journal articles, meta-analyses, or academic books) with real, resolvable identifiers.
Respond ONLY as JSON of the form:
{"citations":[{"title":string,"source":string,"url":string,"relevance":string,"topic":string}]}
- "url" must be a DOI (https://doi.org/...) or a stable scholarly link. If you cannot find a
  real identifier, OMIT that citation rather than inventing one.
- "relevance" = one sentence on how it helps interpret, fortify, or remediate the named topic.
- Never fabricate a DOI, author, or journal. Fewer real sources beats more fake ones.`;

export async function fetchLiveCitations(params: {
  strengths: string[];
  weaknesses: string[];
  max?: number;
}): Promise<LiveResearchResult> {
  const max = Math.max(1, Math.min(params.max ?? 8, 12));
  if (verificationProvider() === "mock") {
    // Never invent citations. No provider → no live results.
    return {
      mocked: true,
      citations: [],
      note: "Live research unavailable (no research provider configured).",
    };
  }

  const strengths = params.strengths.slice(0, 5).join(", ") || "general strengths";
  const weaknesses = params.weaknesses.slice(0, 5).join(", ") || "general growth areas";
  const user = `Find up to ${max} peer-reviewed sources relevant to this intelligence profile.
Strengths to interpret and fortify: ${strengths}.
Weaknesses (bottlenecks) to understand and remediate: ${weaknesses}.
Prioritize meta-analyses and trials on trainability/remediation. Return only sources with real DOIs or stable links.`;

  try {
    const res = await fetch(`${PERPLEXITY_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      return { mocked: false, citations: [], note: `Live research error (HTTP ${res.status}).` };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
    };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: { citations?: Array<Partial<LiveCitation>> } = {};
    try {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    } catch {
      parsed = {};
    }
    const citations: LiveCitation[] = (parsed.citations ?? [])
      .filter((c) => c && c.title && c.url)
      .slice(0, max)
      .map((c) => ({
        title: String(c.title).slice(0, 300),
        source: String(c.source ?? "").slice(0, 200),
        url: String(c.url),
        relevance: String(c.relevance ?? "").slice(0, 300),
        topic: String(c.topic ?? "").slice(0, 120),
        verified: false as const,
      }));
    return {
      mocked: false,
      citations,
      note: "Live web results — not yet verified against our library. Confirm before citing.",
    };
  } catch (err) {
    return { mocked: false, citations: [], note: `Live research failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
