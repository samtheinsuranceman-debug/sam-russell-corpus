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
import { invokeLLM, llmConfigured } from "./llm";

// A citation as Perplexity first returns it, before the panel cross-examines it.
type RawCitation = { title: string; source: string; url: string; relevance: string; topic: string };

// Deterministic truth: pull a DOI out of a link and check whether it resolves.
// A fabricated DOI 404s here and dies before it can reach the report.
function extractDoi(url: string): string | null {
  const m = url.match(/10\.\d{4,9}\/[^\s"'<>)\]]+/);
  return m ? m[0].replace(/[).,;]+$/, "") : null;
}
async function doiResolves(doi: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://doi.org/${doi}`, { method: "HEAD", redirect: "follow" });
    if (res.status === 404 || res.status === 410) return false; // definitively not real
    if (res.ok) return true;
    return null; // inconclusive (rate-limited, blocked) — don't count either way
  } catch {
    return null;
  }
}

// The other AIs second-guess Perplexity: an adversarial reviewer judges each
// candidate for being a real, domain-appropriate, relevant peer-reviewed source.
// Batched into ONE call (cheap). Returns keep[] aligned to the input, or null if
// no reviewer model is configured.
async function aiReview(cands: RawCitation[]): Promise<Array<{ keep: boolean; reason: string }> | null> {
  if (!llmConfigured() || cands.length === 0) return null;
  const list = cands
    .map((c, i) => `[${i}] "${c.title}" — ${c.source || "unknown venue"} — topic: ${c.topic || "n/a"} — ${c.url}`)
    .join("\n");
  const prompt = `A web search returned these citations. Be a SKEPTICAL reviewer. For each, decide whether it is a
real, peer-reviewed academic source whose venue and subject are appropriate to its stated topic. REJECT anything
that looks fabricated, comes from a predatory or non-academic venue, has a journal that doesn't match the topic
domain, or is irrelevant. When unsure, reject. Respond ONLY as JSON:
{"verdicts":[{"i":number,"keep":boolean,"reason":string}]}

${list}`;
  try {
    const res = await invokeLLM({
      messages: [
        { role: "system", content: "You are a rigorous, skeptical citation reviewer. Default to rejection when uncertain. Respond only with valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" as any },
    });
    const content = (res.choices?.[0]?.message?.content as string) ?? "{}";
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    const verdicts: Array<{ i: number; keep: boolean; reason: string }> = parsed.verdicts ?? [];
    return cands.map((_, i) => {
      const v = verdicts.find((x) => x.i === i);
      // No verdict for a candidate → treat as rejected (skeptical default).
      return { keep: !!v?.keep, reason: String(v?.reason ?? "no verdict returned").slice(0, 200) };
    });
  } catch {
    return null;
  }
}

// Cross-examine raw candidates: drop fabricated DOIs (deterministic) and anything
// an AI reviewer rejects. Survivors are tagged doi-verified or ai-reviewed.
async function vetCitations(cands: RawCitation[]): Promise<{ kept: LiveCitation[]; rejected: number }> {
  if (cands.length === 0) return { kept: [], rejected: 0 };
  const [reviews, doiChecks] = await Promise.all([
    aiReview(cands),
    Promise.all(cands.map((c) => { const d = extractDoi(c.url); return d ? doiResolves(d) : Promise.resolve(null as boolean | null); })),
  ]);

  const kept: LiveCitation[] = [];
  let rejected = 0;
  cands.forEach((c, i) => {
    const doiOk = doiChecks[i];            // true | false | null
    const review = reviews ? reviews[i] : null; // null = no reviewer available
    if (doiOk === false) { rejected++; return; }       // fabricated DOI — hard reject
    if (review && !review.keep) { rejected++; return; } // an AI reviewer threw it out
    // Decide the surviving tier. Require at least one positive signal.
    if (doiOk === true && (review ? review.keep : true)) {
      kept.push({ ...c, status: "doi-verified", vetNote: `DOI resolves${review ? " · passed AI review" : ""}` });
    } else if (review?.keep) {
      kept.push({ ...c, status: "ai-reviewed", vetNote: `Passed AI review (${review.reason})` });
    } else {
      // No AI reviewer AND no resolving DOI → we can't stand behind it. Drop it.
      rejected++;
    }
  });
  return { kept, rejected };
}

// A citation's verification status AFTER the panel cross-examines it.
//   doi-verified — an AI reviewer kept it AND its DOI actually resolves (strongest).
//   ai-reviewed  — an AI reviewer kept it, but there's no resolvable DOI to confirm.
// Anything an AI reviewer rejected, or whose DOI 404s, is dropped before display.
// NOTE: even "doi-verified" is a middle tier — lighter than the hand-verified library.
export type CitationStatus = "doi-verified" | "ai-reviewed";

export type LiveCitation = {
  title: string;
  source: string;   // journal / outlet as reported by Perplexity
  url: string;      // link or DOI, if given
  relevance: string; // one line: how it fortifies a strength / patches a weakness
  topic: string;    // the cluster or line it was fetched for
  status: CitationStatus;
  vetNote: string;  // why it survived (which checks passed)
};

export type LiveResearchResult = {
  mocked: boolean;
  citations: LiveCitation[]; // only the ones that passed cross-examination
  rejected: number;          // how many the panel threw out
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
      rejected: 0,
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
      return { mocked: false, citations: [], rejected: 0, note: `Live research error (HTTP ${res.status}).` };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
    };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: { citations?: Array<Partial<RawCitation>> } = {};
    try {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    } catch {
      parsed = {};
    }
    const raw: RawCitation[] = (parsed.citations ?? [])
      .filter((c) => c && c.title && c.url)
      .slice(0, max)
      .map((c) => ({
        title: String(c.title).slice(0, 300),
        source: String(c.source ?? "").slice(0, 200),
        url: String(c.url),
        relevance: String(c.relevance ?? "").slice(0, 300),
        topic: String(c.topic ?? "").slice(0, 120),
      }));

    // Cross-examination: the panel + a DOI-resolution check vet every candidate
    // before it can reach the report. Only survivors are returned.
    const { kept, rejected } = await vetCitations(raw);
    return {
      mocked: false,
      citations: kept,
      rejected,
      note: rejected > 0
        ? `Cross-checked by AI review + DOI resolution — ${rejected} rejected. Still lighter than our hand-verified library; confirm before citing.`
        : "Cross-checked by AI review + DOI resolution. Still lighter than our hand-verified library; confirm before citing.",
    };
  } catch (err) {
    return { mocked: false, citations: [], rejected: 0, note: `Live research failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
