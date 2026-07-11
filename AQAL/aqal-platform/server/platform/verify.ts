// ============================================================
// Evidence verification — Perplexity (live web search + citations)
// ============================================================
// High-confidence tier only. Given a factual claim a user makes about their
// evidence ("I hold this patent / founded this company / published this paper"),
// check it against the public record and return a verdict with citations.
// Empty PERPLEXITY_API_KEY → mock (returns "unverified", never a false confirm).

import {
  PERPLEXITY_API_KEY, PERPLEXITY_BASE_URL, PERPLEXITY_MODEL, verificationProvider,
} from "./config";

export type VerifyResult = {
  verified: boolean;
  confidence: number; // 0..1
  summary: string;
  citations: string[];
  mocked: boolean;
};

const SYSTEM = `You verify factual claims against the public web. Respond ONLY as JSON:
{"verified": boolean, "confidence": number (0..1), "summary": string, "citations": string[]}.
Set verified=true only when independent public sources corroborate the claim. If you cannot
corroborate it, verified=false and confidence low. Never guess.`;

export async function verifyClaim(claim: string): Promise<VerifyResult> {
  if (verificationProvider() === "mock") {
    // Honest default: we did NOT verify. Never fabricate a confirmation.
    return {
      verified: false,
      confidence: 0,
      summary: "Verification unavailable (no live research provider configured).",
      citations: [],
      mocked: true,
    };
  }
  try {
    const res = await fetch(`${PERPLEXITY_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Verify this claim: ${claim}` },
        ],
      }),
    });
    if (!res.ok) {
      return { verified: false, confidence: 0, summary: `Verification error (HTTP ${res.status}).`, citations: [], mocked: false };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
    };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<VerifyResult> = {};
    try {
      // Perplexity may wrap JSON in prose — extract the object.
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    } catch {
      parsed = {};
    }
    return {
      verified: !!parsed.verified,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0))),
      summary: String(parsed.summary ?? "").slice(0, 600),
      citations: (parsed.citations ?? data.citations ?? []).slice(0, 10),
      mocked: false,
    };
  } catch (err) {
    return { verified: false, confidence: 0, summary: `Verification failed: ${err instanceof Error ? err.message : String(err)}`, citations: [], mocked: false };
  }
}
