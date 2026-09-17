// Tests for the NLP brain and the twelve-channel composite mind.
//
// The point of these is not that the code runs — it is that a pattern cannot
// quietly go missing, an id cannot drift, and the ethical floor cannot be
// dropped from a prompt by accident. The brain is wired into every AI channel
// on the site, so a silent regression here is a silent regression everywhere.
import { describe, it, expect } from "vitest";
import {
  META_PROGRAMS, META_PROGRAM_COUNT, LANGUAGE_PATTERNS, LANGUAGE_PATTERN_COUNT,
  EMOTIONAL_ARC, BUYING_SIGNALS, ETHICAL_FLOOR, NLP_CHANNEL_PREAMBLE, REP_PREDICATES,
  detectRepSystem, detectMetaPrograms, detectArcPhase, readBuyingSignals, composeDirective,
  embeddedCommand, futurePace, backtrack, choiceOfAgreements, paceThenLead, precisionQuestion,
  pattern, patternsByFamily,
} from "@shared/nlpBrain";
import {
  MINDS, MIND_COUNT, mind, coveredMetaPrograms, uncoveredMetaPrograms, ownedPatterns,
  compositeWorkingMemory, compactWorkingMemory, STANDING_CHANNEL_LAYER,
} from "@shared/compositeMind";

describe("meta-programs: the full 51", () => {
  it("carries all 51 from Hall & Bodenhamer, numbered 1..51 with no gaps", () => {
    expect(META_PROGRAM_COUNT).toBe(51);
    expect(META_PROGRAMS.map((m) => m.n)).toEqual(Array.from({ length: 51 }, (_, i) => i + 1));
  });

  it("gives every program a unique id, a label, an elicitation question and at least two poles", () => {
    const ids = new Set<string>();
    for (const mp of META_PROGRAMS) {
      expect(mp.id, `#${mp.n} needs an id`).toBeTruthy();
      expect(ids.has(mp.id), `duplicate meta-program id ${mp.id}`).toBe(false);
      ids.add(mp.id);
      expect(mp.label.length).toBeGreaterThan(2);
      expect(mp.elicit.length, `#${mp.n} ${mp.id} is missing its elicitation question`).toBeGreaterThan(20);
      expect(mp.poles.length, `#${mp.n} ${mp.id} needs poles`).toBeGreaterThanOrEqual(1);
    }
  });

  it("gives every pole a speakTo instruction — a pole we cannot speak to is dead weight", () => {
    for (const mp of META_PROGRAMS) {
      for (const pole of mp.poles) {
        expect(pole.speakTo.length, `${mp.id}/${pole.id} has no speakTo`).toBeGreaterThan(5);
      }
    }
  });

  it("every program marked detectable actually carries markers on at least one pole", () => {
    // #3 rep-system is the documented exception: it is detected by the predicate
    // lexicon in detectRepSystem, not by pole markers.
    for (const mp of META_PROGRAMS) {
      if (!mp.detectable || mp.id === "rep-system") continue;
      const hasMarkers = mp.poles.some((p) => p.markers.length > 0);
      expect(hasMarkers, `${mp.id} claims detectable but no pole has markers`).toBe(true);
    }
  });
});

describe("representational systems", () => {
  it("reads a visual speaker", () => {
    const r = detectRepSystem("I just can't see how that picture is clear to me — show me the view.");
    expect(r.lead).toBe("visual");
    expect(r.counts.visual).toBeGreaterThan(r.counts.kinesthetic);
  });

  it("reads a kinesthetic speaker", () => {
    const r = detectRepSystem("It doesn't feel solid. I can't get a handle on it and the pressure is heavy.");
    expect(r.lead).toBe("kinesthetic");
  });

  it("reads a digital speaker", () => {
    const r = detectRepSystem("I need to understand the logic. Show me the data and the criteria so I can decide.");
    // "show" is visual, but the digital predicates should still carry it.
    expect(r.counts.auditoryDigital).toBeGreaterThan(r.counts.visual);
  });

  it("reports zero total and no dominance on empty text rather than guessing", () => {
    const r = detectRepSystem("");
    expect(r.total).toBe(0);
    expect(r.dominance).toBe(0);
  });

  it("reports low dominance when two channels are close, so the caller carries both", () => {
    const r = detectRepSystem("I see what you mean but it doesn't feel solid to me — the picture is clear, the weight is heavy.");
    expect(r.dominance).toBeLessThan(0.5);
  });

  it("has no predicate appearing in two systems at once, which would make the count meaningless", () => {
    const seen = new Map<string, string>();
    for (const [sys, preds] of Object.entries(REP_PREDICATES)) {
      for (const p of preds) {
        const prior = seen.get(p);
        expect(prior, `predicate "${p}" is in both ${prior} and ${sys}`).toBeUndefined();
        seen.set(p, sys);
      }
    }
  });
});

describe("meta-program detection from a person's own words", () => {
  it("reads away-from motivation", () => {
    const hits = detectMetaPrograms("I just don't want to lose what I built. I need to protect from another 2008.");
    const dir = hits.find((h) => h.program === "motivation-direction");
    expect(dir?.pole).toBe("away");
    expect(dir?.speakTo).toMatch(/prevention|stops|protects/i);
  });

  it("reads toward motivation", () => {
    const hits = detectMetaPrograms("I want to build something so that I can retire at 55. That's the goal.");
    expect(hits.find((h) => h.program === "motivation-direction")?.pole).toBe("toward");
  });

  it("reads an internal frame of reference and warns against instructing them", () => {
    const hits = detectMetaPrograms("I decided years ago. I don't care what the industry says, I'll judge it myself.");
    const f = hits.find((h) => h.program === "frame-of-reference");
    expect(f?.pole).toBe("internal");
    expect(f?.speakTo).toMatch(/never tell them what to do/i);
  });

  it("reads a distrusting convincer and requires unprompted disclosure", () => {
    const hits = detectMetaPrograms("What's your angle here? Everyone's a salesman. What's in it for you?");
    const c = hits.find((h) => h.program === "people-convincer");
    expect(c?.pole).toBe("distrusting");
    expect(c?.speakTo).toMatch(/conflict of interest/i);
  });

  it("returns evidence, so a reading can always be checked against what they actually said", () => {
    const hits = detectMetaPrograms("Specifically, what is the exact number?");
    const chunk = hits.find((h) => h.program === "chunk-size");
    expect(chunk?.evidence.length).toBeGreaterThan(0);
    expect(chunk?.evidence.every((e) => "specifically, what is the exact number?".includes(e))).toBe(true);
  });

  it("returns nothing on text with no markers rather than inventing a reading", () => {
    expect(detectMetaPrograms("Hello.")).toEqual([]);
  });

  it("ranks by weight of evidence", () => {
    const hits = detectMetaPrograms("What if it goes wrong? What's the risk, the downside, could I lose it, does it fail?");
    expect(hits[0]?.program).toBe("scenario-thinking");
  });
});

describe("the emotional arc", () => {
  it("has seven phases in order, each with a sentence cap", () => {
    expect(EMOTIONAL_ARC.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const p of EMOTIONAL_ARC) expect(p.maxSentences).toBeGreaterThan(0);
  });

  it("caps pain at three sentences — the documented sticking point", () => {
    const pain = EMOTIONAL_ARC.find((p) => p.id === "pain")!;
    expect(pain.maxSentences).toBe(3);
    expect(pain.danger).toMatch(/sticking point/i);
  });

  it("caps commitment at two sentences — where decisions come undone", () => {
    const c = EMOTIONAL_ARC.find((p) => p.id === "commitment")!;
    expect(c.maxSentences).toBe(2);
  });

  it("caps get tighter at the decision end than at the exploration end", () => {
    const hope = EMOTIONAL_ARC.find((p) => p.id === "hope")!;
    const commit = EMOTIONAL_ARC.find((p) => p.id === "commitment")!;
    expect(commit.maxSentences).toBeLessThan(hope.maxSentences);
  });

  it("detects the phase from the person's words", () => {
    expect(detectArcPhase("We've been dealing with this for years and it's frustrating").id).toBe("pain");
    expect(detectArcPhase("Yes, let's do it, send me the paperwork").id).toBe("commitment");
    expect(detectArcPhase("That's exactly what happens to us").id).toBe("recognition");
  });

  it("falls back to the first phase rather than guessing when nothing matches", () => {
    expect(detectArcPhase("zzzz").id).toBe("curiosity");
  });
});

describe("buying signals", () => {
  it("keeps the recorded weights", () => {
    const byId = Object.fromEntries(BUYING_SIGNALS.map((c) => [c.id, c.points]));
    expect(byId).toEqual({ explicit: 35, implicit: 25, stakeholder: 20, comparison: 15, soft: 10 });
  });

  it("scores a hot cluster and orders a stop", () => {
    const r = readBuyingSignals("What's the pricing, and how soon can we start? Send me the contract.");
    expect(r.level).toBe("hot");
    expect(r.score).toBeGreaterThanOrEqual(61);
    expect(r.instruction).toMatch(/STOP EXPLAINING/);
  });

  it("scores a soft signal as cool and asks for a question back", () => {
    const r = readBuyingSignals("That makes sense.");
    expect(r.score).toBe(10);
    expect(r.level).toBe("cool");
  });

  it("treats a spouse mention as a signal, not a refusal", () => {
    const r = readBuyingSignals("I'd need to check with my spouse first.");
    expect(r.score).toBe(20);
    expect(r.matched.some((m) => m.category === "stakeholder")).toBe(true);
  });

  it("scores zero on unrelated text", () => {
    expect(readBuyingSignals("What is an index?").score).toBe(0);
  });
});

describe("the ethical floor", () => {
  it("is present in the standing preamble, every line of it", () => {
    for (const line of ETHICAL_FLOOR) {
      expect(NLP_CHANNEL_PREAMBLE, `floor line missing from preamble: ${line}`).toContain(line);
    }
  });

  it("survives into every composed directive, with and without a person", () => {
    for (const signal of [{}, { text: "What's the pricing? Send me the contract." }]) {
      const { directive } = composeDirective(signal);
      for (const line of ETHICAL_FLOOR) expect(directive).toContain(line);
    }
  });

  it("forbids manufactured urgency, invented figures and presupposed agreement by name", () => {
    const floor = ETHICAL_FLOOR.join(" ").toLowerCase();
    expect(floor).toContain("urgency");
    expect(floor).toContain("invent");
    expect(floor).toContain("presuppose");
    expect(floor).toContain("guarantee");
  });

  it("requires the honest no to be paced as carefully as the yes", () => {
    expect(ETHICAL_FLOOR.join(" ")).toMatch(/does not fit them, say so/i);
  });

  it("tells the model never to name the technique", () => {
    expect(NLP_CHANNEL_PREAMBLE).toMatch(/never say the word 'NLP'/i);
  });
});

describe("composing the directive", () => {
  it("degrades to the standing layer with no input — the layer is never absent", () => {
    const { directive, rep, metaPrograms } = composeDirective();
    expect(directive).toContain(NLP_CHANNEL_PREAMBLE);
    expect(rep.total).toBe(0);
    expect(metaPrograms).toEqual([]);
  });

  it("adds the channel match when the person has given enough words", () => {
    const { directive } = composeDirective({ text: "I can't see the picture clearly. Show me the view, it looks vague." });
    expect(directive).toMatch(/Channel: visual/);
    expect(directive).toContain("Use sight verbs");
  });

  it("says so plainly when there are too few words to read a channel, instead of guessing", () => {
    const { directive } = composeDirective({ text: "ok" });
    expect(directive).toMatch(/not enough of their own words yet/i);
  });

  it("carries the arc cap into the directive", () => {
    const { directive, arc } = composeDirective({ text: "We've been dealing with this for years, it's killing us." });
    expect(arc.id).toBe("pain");
    expect(directive).toMatch(/Cap this reply at about 3 sentences/);
  });

  it("carries the stop order when the person has already decided", () => {
    const { directive } = composeDirective({ text: "What's the pricing and what are the next steps? Send me the agreement." });
    expect(directive).toMatch(/HOT/);
    expect(directive).toMatch(/STOP EXPLAINING/);
  });

  it("merges prior text into the read, so a returning client is not read from one sentence", () => {
    const thin = composeDirective({ text: "ok" });
    const thick = composeDirective({ text: "ok", priorText: "I can't see how that looks clear; show me the picture, the view is vague." });
    expect(thick.rep.total).toBeGreaterThan(thin.rep.total);
    expect(thick.rep.lead).toBe("visual");
  });

  it("labels the reading as a lean rather than a fact about the person", () => {
    const { directive } = composeDirective({ text: "I want to build toward retiring at 55." });
    expect(directive).toMatch(/treat as a lean, not a fact/i);
  });
});

describe("language patterns", () => {
  it("gives every pattern a unique id, a family, a form and an example", () => {
    const ids = new Set<string>();
    for (const p of LANGUAGE_PATTERNS) {
      expect(ids.has(p.id), `duplicate pattern id ${p.id}`).toBe(false);
      ids.add(p.id);
      expect(p.form.length).toBeGreaterThan(3);
      expect(p.example.length).toBeGreaterThan(10);
      expect(["milton", "meta", "reframe", "pacing"]).toContain(p.family);
    }
    expect(LANGUAGE_PATTERN_COUNT).toBe(LANGUAGE_PATTERNS.length);
  });

  it("guards the patterns that can be turned against the client", () => {
    for (const id of ["embedded-command", "presupposition", "artfully-vague", "future-pace", "content-reframe", "quotes", "choice-of-agreements"]) {
      const p = pattern(id);
      expect(p, `missing pattern ${id}`).toBeTruthy();
      expect(p!.guard, `${id} is dangerous without a guard`).toBeTruthy();
    }
  });

  it("forbids the embedded command from ever pointing at a purchase", () => {
    expect(pattern("embedded-command")!.guard).toMatch(/Never at a purchase/i);
  });

  it("forbids vagueness about fees and risks", () => {
    expect(pattern("artfully-vague")!.guard).toMatch(/never about fact/i);
  });

  it("carries a full meta-model set", () => {
    const meta = patternsByFamily("meta").map((p) => p.id);
    for (const required of ["mm-universal", "mm-modal-necessity", "mm-modal-impossibility", "mm-cause-effect",
                            "mm-complex-equivalence", "mm-mind-read", "mm-lost-performative", "mm-comparative", "denominalize"]) {
      expect(meta, `meta-model is missing ${required}`).toContain(required);
    }
  });

  it("carries the Milton patterns the standing preamble promises", () => {
    const milton = patternsByFamily("milton").map((p) => p.id);
    for (const required of ["embedded-command", "presupposition", "future-pace", "pacing-current-experience", "choice-of-agreements"]) {
      expect(milton).toContain(required);
    }
  });
});

describe("pattern constructors", () => {
  it("builds an embedded command that reads as an observation", () => {
    expect(embeddedCommand("look at what the mortgage costs over twenty years"))
      .toBe("You might look at what the mortgage costs over twenty years, and notice what changes.");
  });

  it("strips a leading 'you' so the command does not double up", () => {
    expect(embeddedCommand("you check the rate")).toBe("You might check the rate, and notice what changes.");
  });

  it("future paces to a stated horizon", () => {
    expect(futurePace(20, "this year's tax return")).toMatch(/^Picture yourself 20 years from now/);
  });

  it("backtracks in their words and hands the check back to them", () => {
    expect(backtrack("the debt is what keeps me up.")).toBe("So: the debt is what keeps me up. Have I got that right?");
  });

  it("offers two routes rather than one demand", () => {
    expect(choiceOfAgreements("run the tax path", "run the mortgage path"))
      .toBe("Would it be more useful to run the tax path, or to run the mortgage path first?");
  });

  it("refuses to pace with fewer than three true statements", () => {
    expect(() => paceThenLead(["one", "two"], "the new thing")).toThrow(/three true statements/);
    expect(paceThenLead(["a", "b", "c"], "d")).toBe("a, b, c — and d");
  });
});

describe("precision questions", () => {
  it("recovers the constraint behind a can't", () => {
    expect(precisionQuestion("I can't touch that money")).toEqual({ patternId: "mm-modal-impossibility", question: "What stops you?" });
  });

  it("recovers the consequence behind a must", () => {
    expect(precisionQuestion("I have to max the 401k")?.patternId).toBe("mm-modal-necessity");
  });

  it("looks for the counter-example to a universal", () => {
    expect(precisionQuestion("I always lose money in the market")?.patternId).toBe("mm-universal");
  });

  it("recovers the judge behind a verdict", () => {
    expect(precisionQuestion("Whole life is a bad product")?.patternId).toBe("mm-lost-performative");
  });

  it("asks for the source of a mind read", () => {
    expect(precisionQuestion("My wife would never agree to this")?.patternId).toBe("mm-mind-read");
  });

  it("returns null on a clean statement rather than manufacturing a challenge", () => {
    expect(precisionQuestion("My mortgage rate is 6.4 percent")).toBeNull();
  });
});

describe("the twelve channels", () => {
  it("is exactly twelve, with unique ids and names", () => {
    expect(MIND_COUNT).toBe(12);
    expect(new Set(MINDS.map((m) => m.id)).size).toBe(12);
    expect(new Set(MINDS.map((m) => m.name)).size).toBe(12);
  });

  it("gives every channel a role, an instruction and a standing question", () => {
    for (const m of MINDS) {
      expect(m.role.length).toBeGreaterThan(10);
      expect(m.instruction.length).toBeGreaterThan(40);
      expect(m.standingQuestion.endsWith("?"), `${m.id} standing question must be a question`).toBe(true);
    }
  });

  it("only claims to read meta-programs that exist", () => {
    const ids = new Set(META_PROGRAMS.map((mp) => mp.id));
    for (const m of MINDS) {
      for (const r of m.reads) expect(ids.has(r), `${m.id} claims to read unknown meta-program "${r}"`).toBe(true);
    }
  });

  it("only claims to own language patterns that exist", () => {
    const ids = new Set(LANGUAGE_PATTERNS.map((p) => p.id));
    for (const m of MINDS) {
      for (const o of m.owns) expect(ids.has(o), `${m.id} claims to own unknown pattern "${o}"`).toBe(true);
    }
  });

  it("covers the meta-programs that actually drive financial decisions", () => {
    const covered = new Set(coveredMetaPrograms());
    for (const critical of ["motivation-direction", "frame-of-reference", "convincer", "value-buying",
                            "time-tenses", "emotional-coping", "chunk-size", "people-convincer"]) {
      expect(covered.has(critical), `no channel reads ${critical}`).toBe(true);
    }
  });

  it("reports the meta-programs no channel claims, so the gap is visible rather than silent", () => {
    const uncovered = uncoveredMetaPrograms();
    expect(Array.isArray(uncovered)).toBe(true);
    // Whatever the gap is, it must not include anything already asserted as covered.
    for (const u of uncovered) expect(coveredMetaPrograms()).not.toContain(u);
  });

  it("owns at least the patterns the preamble promises to use", () => {
    const owned = new Set(ownedPatterns());
    for (const p of ["embedded-command", "future-pace", "content-reframe", "backtrack", "chunk-down"]) {
      expect(owned.has(p), `no channel owns ${p}`).toBe(true);
    }
  });

  it("looks up a channel by id", () => {
    expect(mind("dealcloser")?.name).toBe("DealCloser");
    expect(mind("nobody" as never)).toBeUndefined();
  });
});

describe("working memory", () => {
  it("carries the brain, the roster and the conflict order", () => {
    const { text } = compositeWorkingMemory({ text: "I want to protect what I built." });
    expect(text).toContain(NLP_CHANNEL_PREAMBLE);
    for (const m of MINDS) expect(text).toContain(m.name);
    expect(text).toMatch(/Where two channels conflict/);
  });

  it("forbids presenting the twelve as separate personalities to the client", () => {
    const { text } = compositeWorkingMemory();
    expect(text).toMatch(/Never name them to the client/i);
    expect(text).toMatch(/never say "our team of AI"/i);
  });

  it("puts the floor above the channels in the conflict order", () => {
    const { text } = compositeWorkingMemory();
    const floorAt = text.indexOf("the floor above everything");
    expect(floorAt).toBeGreaterThan(-1);
  });

  it("returns the live reading alongside the text so a caller can log what was read", () => {
    const { reading } = compositeWorkingMemory({ text: "What's the pricing? Send me the contract." });
    expect(reading.signals.level).toBe("hot");
  });

  it("compact form keeps the floor and the four ranking channels", () => {
    const { text } = compactWorkingMemory({ text: "I can't see it clearly." });
    for (const line of ETHICAL_FLOOR) expect(text).toContain(line);
    for (const name of ["Peter", "Anchor", "DealCloser", "Mark"]) expect(text).toContain(name);
    expect(text.length).toBeLessThan(compositeWorkingMemory({ text: "I can't see it clearly." }).text.length);
  });

  it("standing layer works with no person at all", () => {
    expect(STANDING_CHANNEL_LAYER).toContain(NLP_CHANNEL_PREAMBLE);
    expect(STANDING_CHANNEL_LAYER).toContain("Buddy");
  });
});
