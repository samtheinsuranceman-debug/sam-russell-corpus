import { describe, it, expect } from "vitest";
import { invokeLLM, llmConfigured } from "./llm";
import { transcribeAudio } from "./transcribe";
import { platformStatus } from "./config";

// These tests run with no provider env set, so every capability is on its mock.

describe("platform seam — mock fallbacks let the core loop run offline", () => {
  it("reports mock providers when nothing is configured", () => {
    expect(llmConfigured()).toBe(false);
    const status = platformStatus();
    expect(status.llm).toBe("mock");
    expect(status.stt).toBe("mock");
    expect(status.live.llm).toBe(false);
  });

  it("mock LLM returns JSON matching a requested json_schema (the scoring shape)", async () => {
    const result = await invokeLLM({
      messages: [{ role: "user", content: "score this" }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "assessment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scores: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    axisIndex: { type: "integer" },
                    axisName: { type: "string" },
                    score: { type: "number" },
                    confidence: { type: "number" },
                    reasoning: { type: "string" },
                  },
                  required: ["axisIndex", "axisName", "score", "confidence", "reasoning"],
                },
              },
              powerCombinations: { type: "array", items: { type: "object", properties: {} } },
            },
            required: ["scores", "powerCombinations"],
          },
        },
      },
    });

    const content = result.choices[0].message.content as string;
    const parsed = JSON.parse(content); // must not throw
    expect(Array.isArray(parsed.scores)).toBe(true);
    expect(Array.isArray(parsed.powerCombinations)).toBe(true);
  });

  it("mock LLM honors enums and minItems", async () => {
    const result = await invokeLLM({
      messages: [{ role: "user", content: "x" }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "t",
          schema: {
            type: "object",
            properties: {
              tag: { type: "string", enum: ["Strong", "Moderate"] },
              items: { type: "array", minItems: 2, items: { type: "string" } },
            },
            required: ["tag", "items"],
          },
        },
      },
    });
    const parsed = JSON.parse(result.choices[0].message.content as string);
    expect(parsed.tag).toBe("Strong");
    expect(parsed.items).toHaveLength(2);
  });

  it("mock transcription returns a valid, parseable transcript", async () => {
    const res = await transcribeAudio({ audioUrl: "https://example.com/a.webm" });
    expect("text" in res).toBe(true);
    if ("text" in res) {
      expect(typeof res.text).toBe("string");
      expect(res.language).toBe("en");
    }
  });
});
