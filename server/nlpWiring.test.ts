// Proves the language layer is actually WIRED, not merely written.
//
// The brain is only worth having if every client-facing channel carries it and
// no extraction channel does. Both halves matter: a missing layer makes the
// system generic, and a layer bolted onto a JSON extractor breaks the parse.
// These tests read the real source files, so deleting an import fails here.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CLIENT_FACING_PREAMBLE, SYSTEM_PREAMBLE } from "@shared/branding";
import { ETHICAL_FLOOR, NLP_CHANNEL_PREAMBLE } from "@shared/nlpBrain";
import { MINDS } from "@shared/compositeMind";
import { ADVISOR_SYSTEM_WIRED, advisorSystemFor, publicTeaserSystemFor } from "./ultraAI";

const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("the client-facing preamble", () => {
  it("keeps the brand identity AND adds the language layer", () => {
    expect(CLIENT_FACING_PREAMBLE).toContain(SYSTEM_PREAMBLE);
    expect(CLIENT_FACING_PREAMBLE).toContain(NLP_CHANNEL_PREAMBLE);
  });

  it("carries every channel and every line of the floor", () => {
    for (const m of MINDS) expect(CLIENT_FACING_PREAMBLE).toContain(m.name);
    for (const line of ETHICAL_FLOOR) expect(CLIENT_FACING_PREAMBLE).toContain(line);
  });

  it("is strictly longer than the identity preamble alone", () => {
    expect(CLIENT_FACING_PREAMBLE.length).toBeGreaterThan(SYSTEM_PREAMBLE.length + 1000);
  });
});

describe("the ultra advisor", () => {
  it("carries the layer even with no question", () => {
    expect(ADVISOR_SYSTEM_WIRED).toContain(NLP_CHANNEL_PREAMBLE);
  });

  it("reads the person's channel from their own question", () => {
    const visual = advisorSystemFor("I can't see how this looks clear — show me the picture and the view.");
    expect(visual).toMatch(/Channel: visual/);
    const kin = advisorSystemFor("It doesn't feel solid, I can't get a handle on the weight of it, the pressure is heavy.");
    expect(kin).toMatch(/Channel: kinesthetic/);
  });

  it("folds the profile into the read, so a known client is not read from one line", () => {
    const withProfile = advisorSystemFor("ok", "I want to protect what I built and avoid another 2008. Don't want to lose it.");
    expect(withProfile).toMatch(/Motivation direction → Away from/);
  });

  it("carries the stop order into the advisor prompt when the person has decided", () => {
    expect(advisorSystemFor("What's the pricing and what are the next steps?")).toMatch(/STOP EXPLAINING|next step/);
  });

  it("never drops the floor, whatever the question", () => {
    for (const q of ["", "hi", "What's the pricing? Send the contract.", "I always lose money"]) {
      for (const line of ETHICAL_FLOOR) expect(advisorSystemFor(q)).toContain(line);
    }
  });
});

describe("the public concierge", () => {
  it("carries the layer and the firm's hard rules together", () => {
    const s = publicTeaserSystemFor("How do I lower my taxes?");
    expect(s).toContain("AI concierge");
    expect(s).toMatch(/NO specific dollar amounts/);
    for (const line of ETHICAL_FLOOR) expect(s).toContain(line);
  });

  it("uses the compact form — the homepage prompt has a budget", () => {
    const s = publicTeaserSystemFor("How do I lower my taxes?");
    expect(s.length).toBeLessThan(advisorSystemFor("How do I lower my taxes?").length);
  });
});

describe("which channels are wired, and which are deliberately not", () => {
  const routers = read("server/routers.ts");

  it("wires every conversational surface at the point the system prompt is built", () => {
    // Anchored on the exact prompt-construction text, not on a loose name
    // search: the surface names also appear inside prompt bodies, where a
    // nearby match would pass this test without proving anything.
    for (const built of [
      "${CLIENT_FACING_PREAMBLE} You are an expert sales coach for institutional financial",
      "${CLIENT_FACING_PREAMBLE} You are the Russell Capital Systems\u2122 Advisor",
      "${CLIENT_FACING_PREAMBLE} You are the Goals Accelerator module.",
      "${CLIENT_FACING_PREAMBLE} You are an expert presentation designer for financial advisors.",
      "${CLIENT_FACING_PREAMBLE}\\n\\nYou are the Live Co-Pilot",
      "${CLIENT_FACING_PREAMBLE}\\n\\nYou are \"Sam Russell\"",
      "${CLIENT_FACING_PREAMBLE} Summarize client activity notes",
      "${CLIENT_FACING_PREAMBLE} Use specific numbers and bracket references.",
    ]) {
      expect(routers.includes(built), `not wired: ${built.slice(0, 70)}`).toBe(true);
    }
  });

  it("leaves no conversational surface on the bare identity preamble", () => {
    // Every remaining SYSTEM_PREAMBLE use must be an extractor or an internal
    // scorer. If a new client-facing prompt is added on the bare preamble,
    // this list stops matching and the test fails.
    const bare = routers.split("\n").filter((l) => l.includes("${SYSTEM_PREAMBLE}"));
    const allowed = /illustration analyst|meeting planner|mortgage statement data extractor|session evaluator|tax return data extractor/;
    for (const line of bare) {
      expect(allowed.test(line), `client-facing prompt left on the bare preamble: ${line.trim().slice(0, 90)}`).toBe(true);
    }
    expect(bare.length).toBe(6);
  });

  it("does NOT wire the structured extractors — the layer would break the parse", () => {
    for (const extractor of ["tax return data extractor", "mortgage statement data extractor", "insurance illustration analyst"]) {
      const idx = routers.indexOf(extractor);
      expect(idx, `${extractor} not found`).toBeGreaterThan(-1);
      const before = routers.slice(Math.max(0, idx - 200), idx);
      expect(before, `${extractor} must use the plain preamble, not the language layer`).not.toContain("CLIENT_FACING_PREAMBLE");
      expect(before).toContain("SYSTEM_PREAMBLE");
    }
  });

  it("wires the librarian to a per-client reading rather than a fixed string", () => {
    const lib = read("server/librarianRouter.ts");
    expect(lib).toContain("librarianSystemFor");
    expect(lib).toContain("compositeWorkingMemory");
    expect(lib).toMatch(/const system = librarianSystemFor\(/);
    expect(lib).toContain("NLP_CHANNEL_LAYER");
  });

  it("wires the partner concierge to the visitor's own question", () => {
    const pc = read("server/partnerConcierge.ts");
    expect(pc).toContain("compactWorkingMemory");
    expect(pc).toMatch(/systemPrompt\(q\)/);
  });

  it("gives every provider in the homepage panel the same reading, so the synthesis agrees rather than averages", () => {
    const ua = read("server/ultraAI.ts");
    expect(ua).toMatch(/const wired = publicTeaserSystemFor\(input\.question\)/);
    expect(ua).not.toMatch(/p\.call\(process\.env\[p\.envKey\]!, PUBLIC_TEASER_SYSTEM,/);
  });
});

describe("the calculators are wired into the talking brain", () => {
  it("hands the advisor the real instrument list, with real paths", async () => {
    const { instrumentBlock } = await import("@shared/compositeMind");
    const { CALCULATORS } = await import("@shared/calculatorCatalog");
    const block = instrumentBlock();
    for (const c of CALCULATORS) {
      expect(block, `${c.name} is not offered to the AI`).toContain(c.path);
    }
  });

  it("forbids the AI inventing a page or an engine", async () => {
    const { instrumentBlock } = await import("@shared/compositeMind");
    expect(instrumentBlock()).toMatch(/never invent a page/i);
    expect(instrumentBlock()).toMatch(/Never claim a figure came from an engine you were not given/i);
  });

  it("puts the instrument list into the advisor's actual system prompt", () => {
    const s = advisorSystemFor("How do I pay off my mortgage faster?");
    expect(s).toContain("/portal/mortgage-killer");
    expect(s).toContain("/portal/zip-engine");
  });
});
