import { describe, expect, it } from "vitest";
import { readRepSystem, readRepSystemOverTurns, restate, translate, mirrorOpener, repSystemPromptBlock, guideFor, PREDICATES, REP_SYSTEMS } from "@shared/nlp/repSystems";
import { metaModel, loadBearing, metaModelSummary, META_MODEL_CATALOG, metaModelPromptBlock, DENOMINALIZE } from "@shared/nlp/metaModel";
import { META_PROGRAMS, readMetaPrograms, salientMetaPrograms, pacingLines, metaProgramsPromptBlock, unreadQuestions } from "@shared/nlp/metaPrograms";
import { PATTERNS, PATTERN_BY_ID, PATTERN_BY_SLUG, CHAPTER_TITLE, SLEIGHT_OF_MOUTH, splitBelief, sleightOfMouthLines, suggestPatterns, patternsPromptBlock } from "@shared/nlp/patterns";
import { companion, companionPromptBlock, detectRumination, readTiming, PAUSE_MS, MONOLOGUE_MS, COOLDOWN_MS, DECLINE_HOLD_MS, type CompanionTurn } from "@shared/nlp/companion";

describe("representational systems", () => {
  it("reads visual, auditory and kinesthetic predicates and reports proportions", () => {
    const v = readRepSystem("I can see what you mean; the picture is clear and I'm looking at it from a new perspective.");
    expect(v.primary).toBe("visual");
    expect(v.percent.visual).toBeGreaterThan(50);
    const a = readRepSystem("It sounds like you're telling me something rings true, loud and clear.");
    expect(a.primary).toBe("auditory");
    const k = readRepSystem("I feel stuck, heavy, like I can't get a grip on it and it's crushing me.");
    expect(k.primary).toBe("kinesthetic");
    expect(k.hits.map(h => h.word)).toContain("get a grip");
  });
  it("claims each span once and weighs idioms double", () => {
    const r = readRepSystem("sounds like sounds");
    expect(r.total).toBe(2);
    expect(r.counts.auditory).toBe(3);
  });
  it("returns an empty reading for empty or non-string input", () => {
    for (const x of ["", null, undefined, 42, {}]) {
      const r = readRepSystem(x as unknown);
      expect(r.primary).toBeNull();
      expect(r.confidence).toBe(0);
    }
  });
  it("weights recent turns more", () => {
    const r = readRepSystemOverTurns(["I see it clearly, a bright vivid picture, in focus", "I feel it in my gut, heavy and tight, can't get a grip"], 1);
    expect(r.primary).toBe("kinesthetic");
  });
  it("translates meanings and restates idioms in another system", () => {
    expect(translate("understand", "kinesthetic")).toBe("grasp what you mean");
    expect(translate("nope", "visual")).toBeNull();
    expect(restate("I see what you mean", "auditory")).toBe("I hear what you're saying");
    expect(restate("nothing to swap here", "visual")).toBe("nothing to swap here");
  });
  it("gives an opener, a guide and a prompt block", () => {
    const r = readRepSystem("It looks bright and clear from here");
    expect(mirrorOpener(r, 0)).toBe("It looks like");
    expect(mirrorOpener(r, 1)).not.toBe(mirrorOpener(r, 0));
    expect(guideFor(readRepSystem("")).system).toBe("auditoryDigital");
    expect(repSystemPromptBlock(r)).toContain("Visual");
    expect(repSystemPromptBlock(readRepSystem(""))).toContain("not enough sensory language");
  });
  it("keeps the lexicon free of duplicates across systems", () => {
    const all = REP_SYSTEMS.flatMap(s => PREDICATES[s].map(p => [p, s] as const));
    const seen = new Map<string, string>();
    for (const [p, s] of all) {
      expect(seen.has(p), `${p} in both ${seen.get(p)} and ${s}`).toBe(false);
      seen.set(p, s);
    }
  });
});

describe("meta-model", () => {
  it("detects the classic distinctions with recovery questions", () => {
    const f = metaModel("Everyone thinks I'm a failure. My depression makes me useless and I have to keep it together, but nothing ever works.");
    const patterns = f.map(x => x.pattern);
    expect(patterns).toContain("universalQuantifier");
    expect(patterns).toContain("identification");
    expect(patterns).toContain("causeEffect");
    expect(patterns).toContain("modalOperatorNecessity");
    const lb = loadBearing(f)!;
    expect(lb.pattern).toBe("identification");
    expect(lb.challenge).toMatch(/label for a whole person/);
    expect(metaModelSummary(f).heaviest).toBe("identification");
  });
  it("denominalizes and fills the noun into the question", () => {
    const f = metaModel("My depression won't lift and the relationship is over.");
    const nom = f.filter(x => x.pattern === "nominalization");
    expect(nom.length).toBe(2);
    expect(nom[0].challenge).toContain(DENOMINALIZE.depression);
  });
  it("does not flag a comparative that carries its comparison, nor a deletion with its object", () => {
    expect(metaModel("It is better than last week.").some(x => x.pattern === "comparativeDeletion")).toBe(false);
    expect(metaModel("I'm afraid of the dark.").some(x => x.pattern === "simpleDeletion")).toBe(false);
    expect(metaModel("I'm afraid.").some(x => x.pattern === "simpleDeletion")).toBe(true);
  });
  it("finds mind reading, complex equivalence, lost performatives, either/or and presuppositions", () => {
    const f = metaModel("She thinks I'm weak, which means I don't matter. It's selfish to rest. Either I do it perfectly or there's no point. Why am I always the one?");
    const p = f.map(x => x.pattern);
    for (const want of ["mindReading", "complexEquivalence", "lostPerformative", "eitherOr", "presupposition"]) expect(p, want).toContain(want);
  });
  it("survives garbage and returns nothing for well-formed sentences", () => {
    expect(metaModel(null)).toEqual([]);
    expect(metaModel({ a: 1 })).toEqual([]);
    expect(metaModel("On Tuesday at 9 I walked to the shop and bought bread.")).toEqual([]);
    expect(metaModelPromptBlock([])).toContain("well formed");
  });
  it("has a catalog entry for every pattern the detector can emit", () => {
    const keys = new Set(META_MODEL_CATALOG.map(d => d.pattern));
    for (const f of metaModel("I can't. I must. Always. They say. It means. It makes me. I'm worthless. Better. Totally. It's wrong. He thinks. Why am I so slow. Either or. My anxiety. She hurt me. I'm upset.")) expect(keys.has(f.pattern)).toBe(true);
  });
});

describe("meta-programs", () => {
  it("catalogs 51 programs with unique ids and keys, and a question each", () => {
    expect(META_PROGRAMS.length).toBe(51);
    expect(new Set(META_PROGRAMS.map(m => m.id)).size).toBe(51);
    expect(new Set(META_PROGRAMS.map(m => m.key)).size).toBe(51);
    for (const m of META_PROGRAMS) {
      expect(m.question.length).toBeGreaterThan(10);
      expect(m.poles.length).toBeGreaterThanOrEqual(2);
      for (const p of m.poles) expect(p.pacing.length).toBeGreaterThan(5);
      if (m.readable) expect(m.key === "repSystem" || m.poles.some(p => (p.cues ?? []).length > 0)).toBe(true);
    }
  });
  it("reads toward/away, options/procedures and internal/external from language", () => {
    const r = readMetaPrograms(["I want to get to a place where I can build something. My goal is to reach it.", "I could do it lots of ways, there are other ways, options everywhere.", "I know what I want, I decide for myself, my call."]);
    const by = Object.fromEntries(r.map(x => [x.key, x]));
    expect(by.direction.leading?.key).toBe("toward");
    expect(by.direction.slider).toBeLessThan(0);
    expect(by.conation.leading?.key).toBe("options");
    expect(by.referenceFrame.leading?.key).toBe("internal");
    const away = readMetaPrograms("I just want to avoid it, get rid of it, stop feeling like this, I can't stand it.");
    expect(away.find(x => x.key === "direction")!.leading?.key).toBe("awayFrom");
  });
  it("carries the representational system reading as program #3", () => {
    const r = readMetaPrograms("I feel it in my gut, heavy and tight.");
    expect(r.find(x => x.key === "repSystem")!.leading?.key).toBe("kinesthetic");
  });
  it("returns nothing salient for empty input and lists unread questions", () => {
    const r = readMetaPrograms([]);
    expect(salientMetaPrograms(r)).toEqual([]);
    expect(pacingLines(r)).toEqual([]);
    expect(unreadQuestions(r, 2).length).toBe(2);
    expect(metaProgramsPromptBlock(r)).toContain("nothing reliable");
  });
  it("tolerates garbage input", () => {
    expect(() => readMetaPrograms([null, 3, {}, undefined] as unknown[])).not.toThrow();
    expect(() => readMetaPrograms(undefined)).not.toThrow();
  });
});

describe("Sourcebook patterns", () => {
  it("has all 77 patterns, numbered 1..77, with unique slugs, chapters, steps and pages", () => {
    expect(PATTERNS.length).toBe(77);
    expect(PATTERNS.map(p => p.id)).toEqual(Array.from({ length: 77 }, (_, i) => i + 1));
    expect(new Set(PATTERNS.map(p => p.slug)).size).toBe(77);
    for (const p of PATTERNS) {
      expect(CHAPTER_TITLE[p.chapter]).toBeTruthy();
      expect(p.steps.length).toBeGreaterThan(0);
      expect(p.page).toBeGreaterThan(30);
      expect(p.concept.length).toBeGreaterThan(20);
    }
    expect(PATTERN_BY_ID[1].name).toBe("Well-Formed Outcomes");
    expect(PATTERN_BY_ID[77].name).toMatch(/Spinning Icons/);
    expect(PATTERN_BY_SLUG["well-formed-outcomes"].id).toBe(1);
  });
  it("withholds the medical patterns and marks guided ones", () => {
    expect(PATTERN_BY_ID[65].publicSafe).toBe(false);
    expect(PATTERN_BY_ID[68].publicSafe).toBe(false);
    expect(PATTERN_BY_ID[33].needsGuide).toBe(true);
    expect(suggestPatterns({ text: "my allergy to cats", edition: "clinical" }).some(p => p.id === 65)).toBe(false);
  });
  it("suggests patterns from language, meta-model findings and meta-programs", () => {
    const text = "I can't say no to my mother, everyone walks all over me and I just go along with it";
    const s = suggestPatterns({ text, metaModel: metaModel(text), metaPrograms: readMetaPrograms(text) });
    expect(s[0].id).toBe(70);
    expect(s.some(p => p.id === 72)).toBe(true);
    const ident = suggestPatterns({ text: "I am a failure", metaModel: metaModel("I am a failure") });
    expect(ident[0].id).toBe(20);
    const grief = suggestPatterns({ text: "since my father passed away", edition: "public" });
    expect(grief[0].id).toBe(66);
    expect(grief[0].offerable).toBe(false); // guided, so named only in the public edition
    expect(suggestPatterns({ text: "since my father passed away", edition: "clinical" })[0].offerable).toBe(true);
  });
  it("replaces the opener and builds a prompt block", () => {
    const s = suggestPatterns({ text: "I keep doing it, can't stop", opener: "It feels like" });
    expect(s[0].invitation.startsWith("It feels like")).toBe(true);
    expect(patternsPromptBlock(s)).toContain("Sourcebook");
    expect(patternsPromptBlock([])).toContain("no reflection exercise");
  });
  it("splits beliefs and generates Sleight of Mouth lines", () => {
    expect(SLEIGHT_OF_MOUTH.length).toBe(14);
    expect(splitBelief("He was late which means I don't matter to him.")).toEqual({ x: "He was late", y: "I don't matter to him" });
    expect(splitBelief("just a sentence")).toBeNull();
    const f = metaModel("He was late which means I don't matter to him.").find(x => x.pattern === "complexEquivalence")!;
    const lines = sleightOfMouthLines(f, "He was late which means I don't matter to him.");
    expect(lines.length).toBe(14);
    expect(lines.find(l => l.key === "counterExample")!.line).toContain("He was late");
    expect(sleightOfMouthLines(metaModel("I always fail")[0], "I always fail")).toEqual([]);
  });
});

describe("companion", () => {
  const person = (at: number, text: string, durationMs?: number): CompanionTurn => ({ at, speaker: "person", text, durationMs });
  const buddy = (at: number, text: string): CompanionTurn => ({ at, speaker: "companion", text });

  it("detects rumination from repeated phrases", () => {
    expect(detectRumination(["I keep thinking about it. I keep thinking about it. I keep thinking about it."]).ruminating).toBe(true);
    expect(detectRumination(["A calm day at the beach with the kids."]).ruminating).toBe(false);
  });
  it("never talks over the person and waits for a pause", () => {
    const t = readTiming([person(0, "I was saying that", 2000)], 2500);
    expect(t.canSpeak).toBe(false);
    expect(readTiming([person(0, "I was saying that.", 2000)], 2000 + PAUSE_MS + 10).canSpeak).toBe(true);
    const out = companion({ turns: [person(0, "I was in the middle of telling you about my", 3000)], now: 3200 });
    expect(out.intervention.kind).toBe("listen");
    expect(out.intervention.say).toBeNull();
  });
  it("cools down after an intervention", () => {
    const t = readTiming([person(0, "Something happened today.", 2000)], 10_000, 10_000 - COOLDOWN_MS + 5_000);
    expect(t.canSpeak).toBe(false);
    expect(t.reason).toMatch(/cooling/);
  });
  it("asks permission when there is a load-bearing distortion, then asks the question after a yes", () => {
    const turns = [person(0, "Everyone thinks I am a failure and I can't see a way out of this, nothing I do ever works.", 6000)];
    const first = companion({ turns, now: 6000 + PAUSE_MS + 200, edition: "public" });
    expect(first.intervention.kind).toBe("ask-permission");
    expect(first.intervention.permission).toBe("asked");
    expect(first.intervention.say).toMatch(/May I ask/);
    const yes = [...turns, buddy(8000, first.intervention.say!), person(9000, "Yeah, sure.", 800)];
    const second = companion({ turns: yes, now: 12_000, permission: "asked", permissionAt: 8000, lastInterventionAt: 8000 });
    expect(second.intervention.kind).toBe("question");
    expect(second.intervention.permission).toBe("granted");
    expect(second.intervention.say).toMatch(/label for a whole person/);
  });
  it("honours a no for a while", () => {
    const turns = [person(0, "Everyone thinks I am a failure and I can't see a way out.", 5000), buddy(7000, "May I ask you something?"), person(8000, "No, not now, let me finish.", 1500)];
    const out = companion({ turns, now: 11_000, permission: "asked", permissionAt: 7000 });
    expect(out.intervention.kind).toBe("listen");
    expect(out.intervention.permission).toBe("declined");
    const later = [...turns, person(20_000, "And everyone always says I'm useless and nothing works.", 4000)];
    const held = companion({ turns: later, now: 30_000, permission: "declined", permissionAt: 11_000 });
    expect(held.intervention.kind).toBe("listen");
    const released = companion({ turns: later, now: 11_000 + DECLINE_HOLD_MS + 1000, permission: "declined", permissionAt: 11_000 });
    expect(released.intervention.kind).not.toBe("listen");
  });
  it("uses a pattern interrupt for a loop in a long monologue, followed by an outcome question", () => {
    const loop = "I keep thinking about what he said. I keep thinking about what he said. I keep thinking about what he said and I can't stop.";
    const turns = [person(0, loop, MONOLOGUE_MS + 1000)];
    const out = companion({ turns, now: MONOLOGUE_MS + 500 });
    expect(out.intervention.kind).toBe("pattern-interrupt");
    expect(out.intervention.pattern?.id).toBe(8);
    expect(out.intervention.say).toMatch(/what colour/);
    expect(out.intervention.say).toMatch(/first small thing/);
  });
  it("puts safety above everything, at any timing", () => {
    const out = companion({ turns: [person(0, "I have a plan to end it tonight.", 2000)], now: 500 });
    expect(out.intervention.kind).toBe("safety");
    expect(out.reading.state.safety.level).toBeGreaterThanOrEqual(4);
    expect(out.intervention.say).toMatch(/988/);
    const mild = companion({ turns: [person(0, "Sometimes I wish I were dead.", 2000)], now: 500 });
    expect(mild.intervention.kind).toBe("safety");
    expect(mild.intervention.say).not.toMatch(/911/);
  });
  it("never speaks twice on the same silence", () => {
    const turns = [person(0, "It just feels heavy and I can't get a grip on the day.", 3000), buddy(8000, "It feels like you're carrying the day.")];
    const out = companion({ turns, now: 20_000 });
    expect(out.intervention.kind).toBe("listen");
    expect(out.intervention.why).toMatch(/waiting for them/);
    const safety = companion({ turns: [...turns, person(21_000, "I have a plan to end it tonight.", 2000)], now: 22_000 });
    expect(safety.intervention.kind).toBe("safety");
  });
  it("reflects in the person's own system after a longer pause", () => {
    const out = companion({ turns: [person(0, "It just feels heavy and I can't get a grip on the day.", 3000)], now: 3000 + 4000 });
    expect(["reflect", "ask-permission"]).toContain(out.intervention.kind);
    expect(out.intervention.say).toMatch(/^It feels like|^What's coming through|^You're carrying|^I can feel/);
  });
  it("offers a public-safe pattern after permission when nothing load-bearing is present", () => {
    const turns = [person(0, "I can't decide whether to take the job, I go back and forth every day.", 5000), buddy(7000, "May I ask you something?"), person(8000, "Sure, go ahead.", 800)];
    const out = companion({ turns, now: 10_000, permission: "asked", permissionAt: 7000 });
    expect(["question", "offer-pattern"]).toContain(out.intervention.kind);
    expect(out.intervention.say).toBeTruthy();
  });
  it("reads consented signals into state and the prompt", () => {
    const out = companion({ turns: [person(0, "I'm fine, it's fine, whatever.", 2000)], signals: [{ at: 1000, kind: "body", value: "arms crossed, looking away", score: -0.6 }], now: 8000, consent: { video: true } });
    expect(out.reading.state.signals[0]).toBe("arms crossed, looking away");
    const prompt = companionPromptBlock(out, "public");
    expect(prompt).toContain("arms crossed");
    expect(prompt).toContain("COMPANION MODE (public wellness edition)");
    expect(prompt).not.toMatch(/diagnos(e|is) the/);
  });
  it("survives garbage input", () => {
    expect(() => companion({ turns: [{ at: NaN, speaker: "person", text: 5 as unknown as string }], now: NaN })).not.toThrow();
    expect(companion({ turns: [], now: 0 }).intervention.kind).toBe("listen");
  });
});
