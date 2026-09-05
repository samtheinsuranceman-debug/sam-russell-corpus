import { describe, it, expect, afterEach } from "vitest";
import { voiceConsensus } from "./config";

// voiceConsensus() controls whether the multi-AI panel also scores the free,
// voice-only assessment. Default ON; only an explicit "false" turns it off.
describe("voiceConsensus() — multi-AI on the voice assessment", () => {
  const original = process.env.VOICE_CONSENSUS;
  afterEach(() => {
    if (original === undefined) delete process.env.VOICE_CONSENSUS;
    else process.env.VOICE_CONSENSUS = original;
  });

  it("defaults to ON when unset", () => {
    delete process.env.VOICE_CONSENSUS;
    expect(voiceConsensus()).toBe(true);
  });

  it("stays ON for any value except an explicit false", () => {
    process.env.VOICE_CONSENSUS = "true";
    expect(voiceConsensus()).toBe(true);
    process.env.VOICE_CONSENSUS = "yes";
    expect(voiceConsensus()).toBe(true);
  });

  it("turns OFF only on an explicit false (case-insensitive)", () => {
    process.env.VOICE_CONSENSUS = "false";
    expect(voiceConsensus()).toBe(false);
    process.env.VOICE_CONSENSUS = "FALSE";
    expect(voiceConsensus()).toBe(false);
  });
});
