// ============================================================
// ROUTE META BUILDER — the pure function behind RouteMeta.
// Given a path, returns the page's <title> + meta description.
// Extracted from the component so the SEO hard rules are
// build-enforced by routeMetaFor.test.ts across all 9,646
// sitemap URLs: every title ≤ 60 characters (search results
// truncate at ~60), every description ≤ 160.
// ============================================================
import {
  PAGE_META, lineFromSlug, therapyFromSlug, therapyDisplay, pairFromSlug,
  compareFromSlug, goalFromSlug, engineLineFromSlug, CAPACITY_ONLY_LINES,
  KIND_IDS, WING_IDS, VERDICT_SLUGS, PROTOCOL_SUBPAGES,
  MYTH_SUBPAGES, PAIR_SUBPAGES, LINE_SUBPAGES, PRACTICE_SUBPAGES,
  GOAL_SUBPAGES, KIND_SUBPAGES, WING_SUBPAGES, CAPACITY_SUBPAGES,
  COMPARE_SUBPAGES,
  bestComboFromSlug,
} from "@shared/seo";
import { LINE_ENCYCLOPEDIA } from "@/lib/lineEncyclopedia";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { LINE_ROLE } from "@/lib/linePairs";
import { mythById } from "@/lib/mythMuseum";
import { hypnosisById } from "@shared/hypnosisTopics";
import { archById, ARCH_ABBR, ARCH_SUBPAGES, archBlendFromSlug, ARCH_BLENDS } from "@shared/seo";

export type RouteMetaData = { title: string; description: string };

const MAX_TITLE = 60;
function fitTitle(...variants: string[]): string {
  for (const variant of variants) if (variant.length <= MAX_TITLE) return variant;
  const last = variants[variants.length - 1];
  return last.slice(0, MAX_TITLE - 1).replace(/\s+\S*$/, "") + "…";
}

export function routeMetaFor(path: string): RouteMetaData | undefined {
  let meta: RouteMetaData | undefined = PAGE_META[path];

  if (!meta && path.startsWith("/line/") && path.slice("/line/".length).includes("/")) {
    const [lineSlug, subpage] = path.slice("/line/".length).split("/");
    const name = lineFromSlug(lineSlug ?? "");
    if (name && (LINE_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const table: Record<string, [string[], string]> = {
        "at-work": [[`${name} Intelligence at Work — AQAL`, `${name} at Work — AQAL`],
          `Where the ${name} line earns: its native arena, what it contributes, how a strong one reads to colleagues, and what the weak version costs a career.`],
        "in-relationships": [[`${name} Intelligence in Relationships — AQAL`, `${name} in Relationships — AQAL`, `${name} at Home — AQAL`],
          `How the ${name} line shapes love, conflict, and parenting: what the people around you experience, two personas you may recognize, and the couple move.`],
        history: [[`The History of ${name} Intelligence — AQAL`, `${name} — The History — AQAL`],
          `When the ${name} line entered the research record, the scientists who fought for it, how it's measured — and why the testing industry ignored it anyway.`],
        "raise-it": [[`How to Raise Your ${name} Line — AQAL`, `Raising ${name} — AQAL`],
          `The honest toolkit for training the ${name} line: the keystone practice, the cited protocols mapped to it, and what raising it actually buys you.`],
        "self-check": [[`The Honest ${name} Self-Check — AQAL`, `${name} Self-Check — AQAL`],
          `Not a measurement — a structured mirror: the lived experience of a strong ${name} line, five honest questions, and what self-report can't tell you.`],
        "never-tested": [[`Why Your ${name} Line Was Never Tested — AQAL`, `${name} — Never Tested — AQAL`, `${name}: Never Tested`],
          `Out of 1,000 adults, how many were ever scored on the ${name} line — the estimate, why the tests skipped it, and what never measuring it has cost.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/line/") && !path.slice("/line/".length).includes("/")) {
    const name = lineFromSlug(path.slice("/line/".length));
    const encyclopedia = name ? LINE_ENCYCLOPEDIA[name] : undefined;
    if (name && encyclopedia) {
      meta = {
        title: fitTitle(`${name} Intelligence — The Full Breakdown — AQAL`, `${name} Intelligence — AQAL`),
        description: encyclopedia.def.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/pair/") && path.slice("/pair/".length).includes("/")) {
    const [pairSlug, subpage] = path.slice("/pair/".length).split("/");
    const pair = pairFromSlug(pairSlug ?? "");
    if (pair && (PAIR_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const [a, b] = pair;
      const table: Record<string, [string[], string]> = {
        collide: [[`When ${a} and ${b} Collide — AQAL`, `${a} × ${b} — The Collision — AQAL`, `${a} × ${b} — Collision`],
          `The strong-weak configurations of ${a} × ${b}: what the carrying line keeps delivering, what the weak half quietly costs, and why the imbalance hides.`],
        train: [[`Training ${a} and ${b} Together — AQAL`, `${a} × ${b} — Training the Pair — AQAL`, `${a} × ${b} — Training`],
          `The honest toolkit for both halves of ${a} × ${b}: keystone practices, cited protocols for each line, and the sequencing rule that makes pairs move.`],
        "at-work": [[`${a} × ${b} at Work — AQAL`, `${a} × ${b} — At Work`],
          `Where the ${a} × ${b} pairing earns: what each half brings, the rooms where the combination compounds, and how it reads to the people around you.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/pair/") && !path.slice("/pair/".length).includes("/")) {
    const pair = pairFromSlug(path.slice("/pair/".length));
    if (pair) {
      const [a, b] = pair;
      const roleA = LINE_ROLE[a], roleB = LINE_ROLE[b];
      meta = {
        title: fitTitle(
          `${a} × ${b} Intelligence — The ${roleA?.adj ?? ""} ${roleB?.noun ?? ""} — AQAL`,
          `${a} × ${b} — The ${roleA?.adj ?? ""} ${roleB?.noun ?? ""} — AQAL`,
          `${a} × ${b} Intelligence — AQAL`, `${a} × ${b} — AQAL`,
        ),
        description: `What the ${a} and ${b} lines give each other, what the combination unlocks, and what half the pair quietly costs.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/practice/") && path.slice("/practice/".length).includes("/")) {
    const [practiceId, subpage] = path.slice("/practice/".length).split("/");
    const practice = KEYSTONE_PRACTICES.find((entry) => entry.id === practiceId);
    if (practice && (PRACTICE_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const fullName = practice.name.split(" (")[0].trim();
      const name = fullName.length > 32 ? fullName.slice(0, 32).replace(/\s+\S*$/, "").trim() : fullName;
      const table: Record<string, [string[], string]> = {
        start: [[`Starting ${name} — The First Two Weeks — AQAL`, `Starting ${name} — AQAL`, `${name} — Starting It`],
          `How to install ${name} so it survives: the prescription verbatim, the anchoring move, the two-week floor, and the honest payoff horizon to hold in mind.`],
        evidence: [[`The Evidence Behind ${name} — AQAL`, `${name} — The Evidence — AQAL`, `${name} — The Evidence`],
          `${name}'s research basis, its evidence tier stated plainly, what it's mapped to lift — and what the evidence honestly does not say.`],
        mistakes: [[`The Mistakes That Waste ${name} — AQAL`, `${name} — The Mistakes — AQAL`, `${name} — The Mistakes`],
          `The five failure modes that kill keystone practices, aimed at ${name}: quitting inside the horizon, dose creep, no trigger, wrong metric, substitution.`],
        "pair-with": [[`What to Pair With ${name} — AQAL`, `${name} — Pair It With — AQAL`, `${name} — Pairings`],
          `What stacks cleanly with ${name}: the practices sharing its targets, the one-at-a-time stacking rule, and the goals its evidence serves.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/practice/") && !path.slice("/practice/".length).includes("/")) {
    const practice = KEYSTONE_PRACTICES.find((entry) => entry.id === path.slice("/practice/".length));
    if (practice) {
      meta = {
        title: fitTitle(`${practice.name} — Prescription, Evidence & Horizon — AQAL`, `${practice.name} — Prescription & Evidence — AQAL`, `${practice.name} — AQAL`, practice.name),
        description: practice.prescription.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/compare/") && path.slice("/compare/".length).includes("/")) {
    const [compareSlug, subpage] = path.slice("/compare/".length).split("/");
    const comparison = compareFromSlug(compareSlug ?? "");
    if (comparison && (COMPARE_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const [fullA, fullB] = comparison.map((name) => therapyDisplay(name).split(" (")[0]);
      const abbreviate = (name: string) => {
        const display = therapyDisplay(name);
        const parenthetical = display.match(/\(([^)]+)\)/);
        const base = display.split(" (")[0];
        if (base.length > 20 && parenthetical && parenthetical[1].length <= 8 && /^[A-Z0-9-]+$/.test(parenthetical[1])) {
          return base.includes("Couples") ? `${parenthetical[1]} Couples` : parenthetical[1];
        }
        return base.length <= 20 ? base : base.slice(0, 20).replace(/\s+\S*$/, "").replace(/[\s,;:—-]+$/, "");
      };
      const [shortA, shortB] = comparison.map(abbreviate);
      const table: Record<string, [string[], string]> = {
        verdict: [[`${fullA} vs ${fullB} — The Verdict — AQAL`, `${shortA} vs ${shortB} — Verdict — AQAL`, `Verdict: ${shortA} vs ${shortB}`],
          `AQAL's transparent editorial scorecard comparison of ${fullA} and ${fullB}: component tradeoffs, fit questions, and estimate bands — not clinical advice.`],
        switch: [[`${fullA} vs ${fullB} — When to Switch — AQAL`, `${shortA} vs ${shortB} — Switch — AQAL`, `Switch: ${shortA} vs ${shortB}`],
          `How to document a complete trial, review non-response, and discuss switching or stacking ${fullA} and ${fullB} without treating an editorial model as personal advice.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }

  if (!meta && path.startsWith("/compare/") && !path.slice("/compare/".length).includes("/")) {
    const comparison = compareFromSlug(path.slice("/compare/".length));
    if (comparison) {
      const [a, b] = comparison.map((name) => therapyDisplay(name).split(" (")[0]);
      meta = {
        title: fitTitle(`${a} vs ${b} — Honest Comparison — AQAL`, `${a} vs ${b} — Compared — AQAL`, `${a} vs ${b} — AQAL`, `${a} vs ${b}`),
        description: `${a} and ${b} target the same capacity. Dose, durability, evidence, and how to choose — compared honestly, estimates never guarantees.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/goal/") && path.slice("/goal/".length).includes("/")) {
    const [goalSlug, subpage] = path.slice("/goal/".length).split("/");
    const goal = goalFromSlug(goalSlug ?? "");
    if (goal && (GOAL_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const cap = goal.charAt(0).toUpperCase() + goal.slice(1);
      const table: Record<string, [string[], string]> = {
        plan: [[`${cap} — The 30-Day Plan — AQAL`, `${cap} — 30-Day Plan`],
          `A 30-day schedule for ${goal}, built from the evidence-matched keystone practices: baseline first, one habit at a time, measurement at the end.`],
        mistakes: [[`${cap} — The Mistakes That Sink It — AQAL`, `${cap} — The Mistakes — AQAL`, `${cap} — The Mistakes`],
          `The five patterns that sink ${goal} goals: no baseline, everything at once, judging inside the horizon, motivation as a plan, and working the wrong layer.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/goal/") && !path.slice("/goal/".length).includes("/")) {
    const goal = goalFromSlug(path.slice("/goal/".length));
    if (goal) {
      const cap = goal.charAt(0).toUpperCase() + goal.slice(1);
      meta = {
        title: fitTitle(`${cap} — The Evidence-Tiered Practices — AQAL`, `${cap} — The Practices — AQAL`, `${cap} — AQAL`),
        description: `The keystone practices mapped to ${goal}: concrete prescriptions, honest evidence tiers, and realistic time horizons — no hacks, no miracles.`.slice(0, 158),
      };
    }
  }

  if (!meta && (path.startsWith("/weak/") || path.startsWith("/gift/"))) {
    const weak = path.startsWith("/weak/");
    const name = lineFromSlug(path.slice(6));
    const encyclopedia = name ? LINE_ENCYCLOPEDIA[name] : undefined;
    if (name && encyclopedia) {
      meta = weak
        ? {
            title: fitTitle(`The Weak ${name} Line — Signs, Costs & Repair — AQAL`, `The Weak ${name} Line — Signs & Repair — AQAL`, `The Weak ${name} Line — AQAL`),
            description: `What a weak ${name} line looks like from inside, what it quietly costs, and the evidence-backed repair plan.`.slice(0, 158),
          }
        : {
            title: fitTitle(`Signs You're Gifted on the ${name} Line — AQAL`, `Gifted on the ${name} Line — AQAL`),
            description: `The signs of a strong ${name} line, why school never caught it, what it's worth deployed on purpose, and its best pairings.`.slice(0, 158),
          };
    }
  }

  if (!meta && path.startsWith("/build/") && path.slice("/build/".length).split("/").length === 3) {
    const segments = path.slice("/build/".length).split("/");
    const line = engineLineFromSlug(segments[0] ?? "");
    const therapy = therapyFromSlug(segments[1] ?? "");
    if (line && therapy && segments[2] === "plan") {
      const name = therapyDisplay(therapy).split(" (")[0];
      meta = {
        title: fitTitle(`${name} × ${line} — Week-by-Week Plan — AQAL`, `${name} × ${line} — The Plan — AQAL`, `${name} × ${line} — Plan`),
        description: `An educational week-by-week planning view for ${name} and ${line}: mapped schedule, first-week steps, checkpoints, maintenance, and exit criteria.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/build/") && path.slice("/build/".length).split("/").length === 2) {
    const segments = path.slice("/build/".length).split("/");
    const line = engineLineFromSlug(segments[0] ?? "");
    const therapy = therapyFromSlug(segments[1] ?? "");
    if (line && therapy) {
      const name = therapyDisplay(therapy).split(" (")[0];
      meta = {
        title: fitTitle(`${name} for the ${line} Capacity — AQAL`, `${name} for ${line} — AQAL`, `${name} for ${line}`),
        description: `Building ${line} with ${name}: the exact capacity developed, the peer-reviewed evidence, the dose, and the alternatives.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/hypnosis/")) {
    const topic = hypnosisById(path.slice("/hypnosis/".length));
    if (topic) {
      meta = {
        title: fitTitle(`${topic.title} — Overt Guided Rehearsal — AQAL`, `${topic.title} — Guided Rehearsal — AQAL`, `${topic.title} — Rehearsal`),
        description: `A ${topic.length} overt mental-rehearsal outline for ${topic.target.toLowerCase()}, with every planned suggestion disclosed. Non-medical; reviewed audio pending.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/myth/") && path.slice("/myth/".length).includes("/")) {
    const [mythId, subpage] = path.slice("/myth/".length).split("/");
    const myth = mythById(mythId ?? "");
    if (myth && (MYTH_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const table: Record<string, [string[], string]> = {
        "feels-real": [[`Why ${myth.name} Feels So Real — AQAL`, `${myth.name} — Why It Feels Real`, `${myth.name} — Feels Real`],
          `The honest psychology of why ${myth.name} convinced smart people: its specific seduction, its wing's family pattern, and the four machines under everything.`],
        receipts: [[`${myth.name} — The Receipts — AQAL`, `${myth.name} — The Receipts`, `${myth.name} — Receipts`],
          `${myth.name}'s full evidence record: the claim as sold, the verdict it earned, why, and the named source you can check without trusting us.`],
        instead: [[`What Works Instead of ${myth.name} — AQAL`, `${myth.name} — What Works Instead`, `${myth.name} — Instead`],
          `The legitimate need under ${myth.name}, routed honestly: where the evidence points, and the four questions any replacement must pass first.`],
        "talk-someone-out": [[`Talking Someone Out of ${myth.name} — AQAL`, `${myth.name} — The Rescue Script`, `${myth.name} — Rescue`],
          `The five-step sequence for helping someone you love leave ${myth.name} — without the backfire: lead with the problem, ask the calibration question, then receipts.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/myth/") && !path.slice("/myth/".length).includes("/")) {
    const myth = mythById(path.slice("/myth/".length));
    if (myth) {
      const verdict = myth.verdict.charAt(0) + myth.verdict.slice(1).toLowerCase();
      meta = {
        title: fitTitle(`${myth.name} — ${verdict} — The Myth Museum — AQAL`, `${myth.name} — ${verdict} — Myth Museum`, `${myth.name} — Myth Museum`, myth.name),
        description: `${myth.claim} The sourced verdict: ${myth.verdict.toLowerCase()}. Why it failed, why people bought it, and what holds up instead.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/capacity/") && path.slice("/capacity/".length).includes("/")) {
    const [capacitySlug, subpage] = path.slice("/capacity/".length).split("/");
    const line = engineLineFromSlug(capacitySlug ?? "");
    if (line && CAPACITY_ONLY_LINES.includes(line) && (CAPACITY_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const table: Record<string, [string[], string]> = {
        signs: [[`The Signs of Strong and Weak ${line} — AQAL`, `${line} — The Signs — AQAL`, `${line} — The Signs`],
          `What strong ${line} looks like, what weak looks like, and why no conventional test ever told you which one you are.`],
        build: [[`Building the ${line} Capacity — AQAL`, `${line} — Building It — AQAL`, `${line} — Building It`],
          `The cited protocols mapped to the ${line} capacity, strongest first, with the sequencing rule that turns a list into a season.`],
        cost: [[`What Weak ${line} Quietly Costs — AQAL`, `${line} — The Cost — AQAL`, `${line} — The Cost`],
          `The itemized tax of a weak ${line} capacity, why it stays invisible, and the trained counterfactual the cited library maps.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/capacity/") && !path.slice("/capacity/".length).includes("/")) {
    const line = engineLineFromSlug(path.slice("/capacity/".length));
    if (line && CAPACITY_ONLY_LINES.includes(line)) {
      meta = {
        title: fitTitle(`The ${line} Capacity — Scored, Never Displayed — AQAL`, `The ${line} Capacity — AQAL`),
        description: `The ${line} capacity: what our engine measures, why no standardized test ever has, what strength looks like, what weakness costs, and the cited protocols that build it.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/kind/") && path.slice("/kind/".length).includes("/")) {
    const [kindId, subpage] = path.slice("/kind/".length).split("/");
    if (KIND_IDS.includes(kindId ?? "") && (KIND_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const cap = kindId!.charAt(0).toUpperCase() + kindId!.slice(1);
      const table: Record<string, [string[], string]> = {
        choose: [[`Choosing a ${cap} Protocol — AQAL`, `${cap} — Choosing One — AQAL`, `${cap} — Choosing One`],
          `How to pick between the ${kindId} family's protocols: the three deciding questions — target line, dose fit, honest demands — and the full roster.`],
        "first-month": [[`Your First Month of ${cap} Work — AQAL`, `${cap} — The First Month — AQAL`, `${cap} — First Month`],
          `The ${kindId} family's first month: week one day by day, then the honest early curve — what moves, what doesn't yet, and why that's normal.`],
        standards: [[`The Evidence Standards for ${cap} — AQAL`, `${cap} — The Standards — AQAL`, `${cap} — Standards`],
          `How to read claims in the ${kindId} family — including ours: the evidential bar, the durability line, and the public Corrections Ledger behind it.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/kind/") && !path.slice("/kind/".length).includes("/")) {
    const kindId = path.slice("/kind/".length);
    if (KIND_IDS.includes(kindId)) {
      const cap = kindId.charAt(0).toUpperCase() + kindId.slice(1);
      meta = {
        title: fitTitle(`${cap} Protocols — Dose, Demands & Durability — AQAL`, `${cap} Protocols — AQAL`),
        description: `The ${kindId} protocol family: what this kind of intervention is, the literature-typical dose, what it honestly demands, how long gains last, and every library protocol of the kind.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/wing/") && path.slice("/wing/".length).includes("/")) {
    const [wingId, subpage] = path.slice("/wing/".length).split("/");
    if (WING_IDS.includes(wingId ?? "") && (WING_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const cap = wingId!.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      const table: Record<string, [string[], string]> = {
        spot: [[`How to Spot the ${cap} Pattern — AQAL`, `${cap} — Spotting It — AQAL`, `${cap} — Spotting It`],
          `The ${cap.toLowerCase()} family's tells: how it claims to work, the red flags that mark it, the four-question field test, and the documented members.`],
        escape: [[`Getting Out of the ${cap} Trap — AQAL`, `${cap} — The Way Out — AQAL`, `${cap} — The Way Out`],
          `The exit ramp from the ${cap.toLowerCase()} family: naming the grip honestly, the four-step sequence out, and the cultural pull you're swimming against.`],
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry[0]), description: entry[1].slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/wing/") && !path.slice("/wing/".length).includes("/")) {
    const wingId = path.slice("/wing/".length);
    if (WING_IDS.includes(wingId)) {
      const cap = wingId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      meta = {
        title: fitTitle(`${cap} — A Wing of the Myth Museum — AQAL`, `${cap} — Myth Museum — AQAL`, `${cap} — Myth Museum`),
        description: `The ${cap.toLowerCase()} family of failed therapies: how the family claims to work, why it feels like it works, the tell-tale signs, and every documented exhibit in the wing.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/verdict/")) {
    const slug = path.slice("/verdict/".length);
    if (VERDICT_SLUGS.includes(slug)) {
      const cap = slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      meta = {
        title: fitTitle(`Verdict: ${cap} — The Myth Museum — AQAL`, `Verdict: ${cap} — Myth Museum`, `Verdict: ${cap}`),
        description: `What the "${cap.toLowerCase()}" verdict means, the evidential standard it applies, and every Myth Museum exhibit that earned it — sourced, exhibit by exhibit.`.slice(0, 158),
      };
    }
  }
  // /archetype/:id and /archetype/:id/:sub — the dossier family.
  if (!meta && path.startsWith("/archetype/")) {
    const segs = path.slice("/archetype/".length).split("/");
    const a = archById(segs[0] ?? "");
    if (a) {
      const n = ARCH_ABBR[a.id] ?? a.name;
      if (segs.length === 1) {
        meta = {
          title: fitTitle(
            `${a.name} — The Archetype Dossier — AQAL`,
            `${n} — Archetype Dossier — AQAL`,
            `${n} — The Dossier`,
          ),
          description: `${a.pattern}`.slice(0, 158),
        };
      } else if ((ARCH_SUBPAGES as readonly string[]).includes(segs[1] ?? "")) {
        const T: Record<string, [string[], string]> = {
          verify: [[`Are You ${a.name}? The Self-Test — AQAL`, `Are You ${n}? — AQAL`, `Are You ${n}?`],
            `The disciplined three-part check for the ${n} archetype — configuration test, trajectory test, witness test — and the honest limits of self-recognition.`],
          "break-out": [[`Breaking Out of ${a.name} — AQAL`, `${n} — Breaking Out — AQAL`, `${n} — Breaking Out`],
            `The cited route out of the ${n} configuration: the development case, keystone practices and protocols for each starved line, and the measured gains.`],
        };
        const t = T[segs[1]!];
        if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
      }
    }
  }
  // /archetype-blend/:slug — blend anatomy pages.
  if (!meta && path.startsWith("/archetype-blend/")) {
    const pr = archBlendFromSlug(path.slice("/archetype-blend/".length));
    if (pr) {
      const [na, nb] = [ARCH_ABBR[pr[0]] ?? pr[0], ARCH_ABBR[pr[1]] ?? pr[1]];
      const idx = ARCH_BLENDS.findIndex(([a, b]) => a === pr[0] && b === pr[1]) + 1;
      const c18 = (x: string) => x.length <= 18 ? x : x.slice(0, 18).replace(/\s+\S*$/, "").replace(/[\s,;:(—-]+$/, "");
      meta = {
        title: fitTitle(
          `${na} × ${nb} — The Blend — AQAL`,
          `Blend ${idx}: ${c18(na)} × ${c18(nb)}`,
        ),
        description: `Can you be both ${na} and ${nb}? The computed anatomy of the blend: where it amplifies, where it argues with itself, and the honest frequency answer.`.slice(0, 158),
      };
    }
  }
  // /hypnosis/:id — guided session pages.
  if (!meta && path.startsWith("/hypnosis/")) {
    const t = hypnosisById(path.slice("/hypnosis/".length));
    if (t) {
      meta = {
        title: fitTitle(
          `${t.title} — Guided Self-Hypnosis — AQAL`,
          `${t.title} — Guided Session — AQAL`,
          `${t.title} — Guided Session`,
        ),
        description: `A ${t.length} guided self-hypnosis session for ${t.target.toLowerCase()}. ${t.purpose}`.slice(0, 158),
      };
    }
  }
  // /best/:kind/:line — best-protocols combo pages.
  if (!meta && path.startsWith("/best/")) {
    const [kind, lineSlug] = path.slice("/best/".length).split("/");
    const combo = bestComboFromSlug(kind ?? "", lineSlug ?? "");
    if (combo) {
      const cap = combo.kind.charAt(0).toUpperCase() + combo.kind.slice(1);
      meta = {
        title: fitTitle(`Best ${cap} Protocols for ${combo.line} — AQAL`, `${cap} Protocols for ${combo.line} — AQAL`, `${cap} for ${combo.line} — Ranked`),
        description: `The ${combo.kind} protocols with peer-reviewed mappings to the ${combo.line} capacity — ranked by mapped role, with dose, demands, and durability.`.slice(0, 158),
      };
    }
  }

  if (!meta && path.startsWith("/protocol/") && path.slice("/protocol/".length).includes("/")) {
    const [protocolSlug, subpage] = path.slice("/protocol/".length).split("/");
    const therapy = therapyFromSlug(protocolSlug ?? "");
    if (therapy && (PROTOCOL_SUBPAGES as readonly string[]).includes(subpage ?? "")) {
      const name = therapyDisplay(therapy).split(" (")[0];
      const table: Record<string, { titles: (value: string) => string[]; description: (value: string) => string }> = {
        "first-week": { titles: (value) => [`${value} — Your First Week, Day by Day — AQAL`, `${value} — Your First Week — AQAL`, `${value} — First Week`], description: (value) => `The first seven days of ${value}, mapped day by day: setup, the starting dose, what to expect to feel, and the week-one mistake that sinks most people.` },
        evidence: { titles: (value) => [`${value} — The Evidence, Study by Study — AQAL`, `${value} — The Evidence — AQAL`, `${value} — The Evidence`], description: (value) => `Every peer-reviewed study behind ${value} in this library — the capacity each one measured, the finding, the citation — plus what the evidence honestly doesn't show.` },
        dose: { titles: (value) => [`${value} — Dose, Schedule & Durability — AQAL`, `${value} — The Dose — AQAL`, `${value} — The Dose`], description: (value) => `The literature-typical dose of ${value}: format, frequency, course length, what it honestly demands, how long gains last, and what to do about missed days.` },
        "who-its-for": { titles: (value) => [`${value} — Who It's For (and Who It Isn't) — AQAL`, `${value} — Who It's For — AQAL`, `${value} — Who It's For`], description: (value) => `Who ${value} actually fits: the intelligence-line profile that points here, two personas who end up on this page, and who should route to a professional first.` },
        mistakes: { titles: (value) => [`${value} — The Mistakes That Waste It — AQAL`, `${value} — The Mistakes — AQAL`, `${value} — The Mistakes`], description: (value) => `The five predictable ways people waste ${value} — and the honest test that separates a protocol that isn't working from one that isn't finished yet.` },
        results: { titles: (value) => [`${value} — What Changes, and When — AQAL`, `${value} — Results Timeline — AQAL`, `${value} — Results`], description: (value) => `The honest results timeline for ${value}: what week one really looks like, where the literature places the real gains, and the spread nobody advertises.` },
        stack: { titles: (value) => [`${value} — What to Stack It With — AQAL`, `${value} — The Stack — AQAL`, `${value} — The Stack`], description: (value) => `How to combine ${value} with the other mapped protocols that share its intelligence lines: what carries the load, what supports, and the order that compounds.` },
        score: { titles: (value) => [`${value} — AQAL Scorecard — AQAL`, `${value} — Scorecard — AQAL`, `${value} — Score`], description: (value) => `AQAL's transparent editorial scorecard for ${value}: evidence component, durability, breadth, speed, ease, mapped lines, schedule, and estimate band.` },
        synergy: { titles: (value) => [`${value} — Synergies and Alternatives — AQAL`, `${value} — Synergy Map — AQAL`, `${value} — Synergy`], description: (value) => `The mapped protocols that may complement ${value} through different mechanism families, plus educational alternatives when fit, burden, or response argues for review.` },
        atrophy: { titles: (value) => [`${value} — Durability and Maintenance — AQAL`, `${value} — Maintenance — AQAL`, `${value} — Atrophy`], description: (value) => `AQAL's kind-level durability model for ${value}: how gains may fade, the represented maintenance pattern, and what re-sharpening may involve.` },
        "daily-life": { titles: (value) => [`${value} — What It Looks Like in Daily Life — AQAL`, `${value} — In Daily Life — AQAL`, `${value} — Daily Life`], description: (value) => `A practical, non-diagnostic translation of ${value}: what the work may look like in a normal week, how to notice practice, and what progress is not.` },
      };
      const entry = table[subpage!];
      if (entry) meta = { title: fitTitle(...entry.titles(name)), description: entry.description(name).slice(0, 158) };
    }
  }
  if (!meta && path.startsWith("/protocol/") && !path.slice("/protocol/".length).includes("/")) {
    const therapy = therapyFromSlug(path.slice("/protocol/".length));
    if (therapy) {
      const entry = THERAPY_LINE_MAP.find((mapped) => mapped.therapy === therapy);
      const lines = THERAPY_LINE_MAP.filter((mapped) => mapped.therapy === therapy).map((mapped) => mapped.line).join(", ");
      const name = therapyDisplay(therapy).split(" (")[0];
      meta = {
        title: fitTitle(`${name} — Which Intelligence Lines It Builds — AQAL`, `${name} — The Lines It Builds — AQAL`, `${name} — AQAL`, name),
        description: (entry ? `${entry.capacity} Mapped to: ${lines}. Dose, durability, and the peer-reviewed evidence.` : "").slice(0, 158),
      };
    }
  }
  return meta;
}
