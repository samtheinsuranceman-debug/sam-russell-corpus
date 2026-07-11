import { describe, it, expect } from "vitest";
import { rankMatches, generationalAdjustment, type Profile } from "@shared/matchEngine";

// A "me" profile and two candidates with IDENTICAL scores — so the base
// (cluster) match score is the same and the ONLY difference is birth year.
// This isolates the generational-affinity effect.
const me: Profile = {
  id: "me",
  birthYear: 1998, // Gen Z
  scores: {
    Logical: 0.9, Mathematical: 0.85, Spatial: 0.4, Linguistic: 0.6, Volitional: 0.5,
    "Meta-Cognitive": 0.7, Intrapersonal: 0.3, Reflective: 0.35, Existential: 0.8,
    Philosophical: 0.75, Integrative: 0.5, Empathic: 0.4, Strategic: 0.6, Humor: 0.7,
  },
};

const peerScores = {
  Logical: 0.5, Mathematical: 0.45, Spatial: 0.9, Linguistic: 0.4, Volitional: 0.85,
  "Meta-Cognitive": 0.4, Intrapersonal: 0.9, Reflective: 0.88, Existential: 0.3,
  Philosophical: 0.35, Integrative: 0.8, Empathic: 0.9, Strategic: 0.5, Humor: 0.4,
};

describe("generational affinity in matching", () => {
  it("no adjustment when a birth year is missing", () => {
    const adj = generationalAdjustment(
      { id: "a", scores: {} },
      { id: "b", scores: {}, birthYear: 1990 },
      "complementary",
    );
    expect(adj.delta).toBe(0);
    expect(adj.note).toBeNull();
  });

  it("complementary mode REWARDS a generational gap", () => {
    const younger = generationalAdjustment(me, { id: "y", scores: {}, birthYear: 1999 }, "complementary"); // same gen
    const older = generationalAdjustment(me, { id: "o", scores: {}, birthYear: 1955 }, "complementary"); // Boomer, big gap
    expect(older.delta).toBeGreaterThan(younger.delta);
    expect(younger.sameGeneration).toBe(true);
    expect(older.sameGeneration).toBe(false);
  });

  it("resonance mode REWARDS the same generation", () => {
    const peer = generationalAdjustment(me, { id: "y", scores: {}, birthYear: 1999 }, "resonance"); // same gen
    const elder = generationalAdjustment(me, { id: "o", scores: {}, birthYear: 1955 }, "resonance"); // big gap
    expect(peer.delta).toBeGreaterThan(elder.delta);
  });

  it("flips ranking: same identical profile, only birth year differs", () => {
    const sameGen: Profile = { id: "peer", scores: peerScores, birthYear: 1999 };   // Gen Z
    const crossGen: Profile = { id: "elder", scores: peerScores, birthYear: 1955 }; // Boomer

    const comp = rankMatches(me, [sameGen, crossGen], { mode: "complementary" });
    // Cross-generational should rank first in complementary mode.
    expect(comp[0].candidate.id).toBe("elder");

    const res = rankMatches(me, [sameGen, crossGen], { mode: "resonance" });
    // Same-generation should rank first in resonance mode.
    expect(res[0].candidate.id).toBe("peer");

    // Cluster score is preserved separately from the adjusted score.
    expect((comp[0] as any).clusterScore).toBeGreaterThan(0);
    expect(comp[0].score).toBeGreaterThanOrEqual((comp[0] as any).clusterScore);
  });

  it("stays within 0..100 and attaches a note", () => {
    const r = rankMatches(me, [{ id: "x", scores: peerScores, birthYear: 1955 }], { mode: "complementary" });
    expect(r[0].score).toBeGreaterThanOrEqual(0);
    expect(r[0].score).toBeLessThanOrEqual(100);
    expect((r[0] as any).generationalNote).toContain("Cross-generational");
  });
});
