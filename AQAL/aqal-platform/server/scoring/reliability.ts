// ============================================================
// Scoring — test-retest reliability harness
// ============================================================
// Scores the SAME transcript N times and measures how stable each axis score
// is across runs. High variance on an axis means the LLM is guessing there and
// its score should be trusted less (or the prompt/temperature tuned). This is
// how we move from "an LLM rated you once" toward a defensible measurement.
//
// The harness takes a generic async `scorer`, so it is unit-testable without a
// live provider; `makeLlmScorer()` wires it to the real scoring call.

import { invokeLLM } from "../platform/llm";
import { withUnderwritingGuide } from "../platform/underwritingGuide";
import { ALL_AXES } from "@shared/axisModes";

export type AxisScore = { axisName: string; score: number; confidence: number };
export type Scorer = () => Promise<AxisScore[]>;

export type AxisStats = {
  n: number;
  mean: number;
  sd: number;
  cv: number; // coefficient of variation = sd / mean (unitless; NaN-safe → 0)
  min: number;
  max: number;
};

export function stats(values: number[]): AxisStats {
  const n = values.length;
  if (n === 0) return { n: 0, mean: 0, sd: 0, cv: 0, min: 0, max: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const cv = mean !== 0 ? sd / Math.abs(mean) : 0;
  return { n, mean, sd, cv, min: Math.min(...values), max: Math.max(...values) };
}

export type TestRetestResult = {
  runs: number;
  perAxis: Record<string, { score: AxisStats; confidence: AxisStats }>;
  summary: {
    axes: number;
    meanScoreSd: number; // average per-axis SD of the 0..1 score
    maxScoreSd: number;
    meanScoreCv: number;
    // Axes whose score SD exceeds `unstableSdThreshold` — the ones to distrust/tune.
    unstableAxes: string[];
    unstableSdThreshold: number;
  };
};

// Run `scorer` `runs` times and aggregate per-axis stability.
export async function runTestRetest(
  scorer: Scorer,
  runs: number,
  opts: { unstableSdThreshold?: number } = {},
): Promise<TestRetestResult> {
  const unstableSdThreshold = opts.unstableSdThreshold ?? 0.1;
  const byAxisScore: Record<string, number[]> = {};
  const byAxisConf: Record<string, number[]> = {};

  for (let i = 0; i < runs; i++) {
    const result = await scorer();
    for (const a of result) {
      (byAxisScore[a.axisName] ??= []).push(a.score);
      (byAxisConf[a.axisName] ??= []).push(a.confidence);
    }
  }

  const perAxis: TestRetestResult["perAxis"] = {};
  const scoreSds: number[] = [];
  const scoreCvs: number[] = [];
  const unstableAxes: string[] = [];

  for (const axis of Object.keys(byAxisScore)) {
    const score = stats(byAxisScore[axis]);
    const confidence = stats(byAxisConf[axis] ?? []);
    perAxis[axis] = { score, confidence };
    scoreSds.push(score.sd);
    scoreCvs.push(score.cv);
    if (score.sd > unstableSdThreshold) unstableAxes.push(axis);
  }

  const axes = scoreSds.length;
  const meanScoreSd = axes ? scoreSds.reduce((a, b) => a + b, 0) / axes : 0;
  const meanScoreCv = axes ? scoreCvs.reduce((a, b) => a + b, 0) / axes : 0;

  return {
    runs,
    perAxis,
    summary: {
      axes,
      meanScoreSd,
      maxScoreSd: axes ? Math.max(...scoreSds) : 0,
      meanScoreCv,
      unstableAxes,
      unstableSdThreshold,
    },
  };
}

// Build a scorer that calls the real (or mock) LLM once and returns axis scores.
// Kept minimal and self-contained so the harness can run standalone.
export function makeLlmScorer(transcript: string, model?: string): Scorer {
  return async () => {
    const result = await invokeLLM({
      model,
      messages: [
        { role: "system", content: withUnderwritingGuide("You are a rigorous developmental psychologist. Score conservatively. Always return valid JSON.") },
        {
          role: "user",
          content:
            `Score each of these ${ALL_AXES.length} intelligence lines from 0.0-1.0 with a confidence 0.0-1.0, ` +
            `based only on the transcript.\n\nLines: ${ALL_AXES.join(", ")}\n\nTranscript:\n${transcript}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reliability_scores",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scores: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    axisName: { type: "string" },
                    score: { type: "number" },
                    confidence: { type: "number" },
                  },
                  required: ["axisName", "score", "confidence"],
                },
              },
            },
            required: ["scores"],
          },
        },
      },
    });
    const content = result.choices?.[0]?.message?.content as string | undefined;
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed.scores) ? parsed.scores : [];
    } catch {
      return [];
    }
  };
}
