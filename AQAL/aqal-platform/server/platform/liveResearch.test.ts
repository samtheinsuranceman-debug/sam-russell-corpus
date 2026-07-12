import { describe, it, expect } from "vitest";
import { fetchLiveCitations } from "./liveResearch";

// Without a PERPLEXITY_API_KEY the provider is "mock" — and the honesty rule is
// that mock returns NOTHING rather than inventing a source.
describe("fetchLiveCitations — never fabricates", () => {
  it("returns zero citations and flags mocked when no provider is configured", async () => {
    const res = await fetchLiveCitations({ strengths: ["Strategic"], weaknesses: ["Volitional"] });
    expect(res.mocked).toBe(true);
    expect(res.citations).toEqual([]);
    expect(res.note.length).toBeGreaterThan(0);
  });

  it("tolerates empty strength/weakness lists", async () => {
    const res = await fetchLiveCitations({ strengths: [], weaknesses: [] });
    expect(res.citations).toEqual([]);
  });
});
