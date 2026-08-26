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
  GOAL_SUBPAGES, KIND_SUBPAGES, WING_SUBPAGES, CAPACITY_SUBPAGES, COMPARE_SUBPAGES,
  bestComboFromSlug,
} from "@shared/seo";
import { LINE_ENCYCLOPEDIA } from "@/lib/lineEncyclopedia";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { LINE_ROLE } from "@/lib/linePairs";
import { mythById } from "@/lib/mythMuseum";
import { hypnosisById } from "@shared/hypnosisTopics";

export type RouteMetaData = { title: string; description: string };

// The consultant's rule, enforced: titles get lopped at 60 characters in
// search results, so every family supplies fallback phrasings from fullest
// to tersest and the first one that fits wins. The last resort trims at a
// word boundary — reached only if even the tersest variant runs long.
const MAX_TITLE = 60;
function fitTitle(...variants: string[]): string {
  for (const v of variants) if (v.length <= MAX_TITLE) return v;
  const last = variants[variants.length - 1];
  return last.slice(0, MAX_TITLE - 1).replace(/\s+\S*$/, "") + "…";
}

export function routeMetaFor(path: string): RouteMetaData | undefined {
  let meta: RouteMetaData | undefined = PAGE_META[path];
  // /line/:slug/:sub — the six deep pages per line.
  if (!meta && path.startsWith("/line/") && path.slice("/line/".length).includes("/")) {
    const [ls, sub] = path.slice("/line/".length).split("/");
    const name = lineFromSlug(ls ?? "");
    if (name && (LINE_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const T: Record<string, [string[], string]> = {
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
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /line/:slug pages get generated meta from the encyclopedia.
  if (!meta && path.startsWith("/line/") && !path.slice("/line/".length).includes("/")) {
    const name = lineFromSlug(path.slice("/line/".length));
    const enc = name ? LINE_ENCYCLOPEDIA[name] : undefined;
    if (name && enc) {
      meta = {
        title: fitTitle(
          `${name} Intelligence — The Full Breakdown — AQAL`,
          `${name} Intelligence — AQAL`,
        ),
        description: enc.def.slice(0, 158),
      };
    }
  }
  // /pair/:slug/:sub — the three deep pages per pair.
  if (!meta && path.startsWith("/pair/") && path.slice("/pair/".length).includes("/")) {
    const [ps, sub] = path.slice("/pair/".length).split("/");
    const pr = pairFromSlug(ps ?? "");
    if (pr && (PAIR_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const [a, b] = pr;
      const T: Record<string, [string[], string]> = {
        collide: [[`When ${a} and ${b} Collide — AQAL`, `${a} × ${b} — The Collision — AQAL`, `${a} × ${b} — Collision`],
          `The strong-weak configurations of ${a} × ${b}: what the carrying line keeps delivering, what the weak half quietly costs, and why the imbalance hides.`],
        train: [[`Training ${a} and ${b} Together — AQAL`, `${a} × ${b} — Training the Pair — AQAL`, `${a} × ${b} — Training`],
          `The honest toolkit for both halves of ${a} × ${b}: keystone practices, cited protocols for each line, and the sequencing rule that makes pairs move.`],
        "at-work": [[`${a} × ${b} at Work — AQAL`, `${a} × ${b} — At Work`],
          `Where the ${a} × ${b} pairing earns: what each half brings, the rooms where the combination compounds, and how it reads to the people around you.`],
      };
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /pair/:slug pages — meta composed from both lines' data.
  if (!meta && path.startsWith("/pair/") && !path.slice("/pair/".length).includes("/")) {
    const pr = pairFromSlug(path.slice("/pair/".length));
    if (pr) {
      const [a, b] = pr;
      const ra = LINE_ROLE[a], rb = LINE_ROLE[b];
      meta = {
        title: fitTitle(
          `${a} × ${b} Intelligence — The ${ra?.adj ?? ""} ${rb?.noun ?? ""} — AQAL`,
          `${a} × ${b} — The ${ra?.adj ?? ""} ${rb?.noun ?? ""} — AQAL`,
          `${a} × ${b} Intelligence — AQAL`,
          `${a} × ${b} — AQAL`,
        ),
        description: `What the ${a} and ${b} lines give each other, what the combination unlocks, and what half the pair quietly costs.`.slice(0, 158),
      };
    }
  }
  // /practice/:id/:sub — the four deep pages per practice.
  if (!meta && path.startsWith("/practice/") && path.slice("/practice/".length).includes("/")) {
    const [pid, sub] = path.slice("/practice/".length).split("/");
    const pr = KEYSTONE_PRACTICES.find((k) => k.id === pid);
    if (pr && (PRACTICE_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const n0 = pr.name.split(" (")[0].trim();
      const n = n0.length > 32 ? n0.slice(0, 32).replace(/\s+\S*$/, "").trim() : n0;
      const T: Record<string, [string[], string]> = {
        start: [[`Starting ${n} — The First Two Weeks — AQAL`, `Starting ${n} — AQAL`, `${n} — Starting It`],
          `How to install ${n} so it survives: the prescription verbatim, the anchoring move, the two-week floor, and the honest payoff horizon to hold in mind.`],
        evidence: [[`The Evidence Behind ${n} — AQAL`, `${n} — The Evidence — AQAL`, `${n} — The Evidence`],
          `${n}'s research basis, its evidence tier stated plainly, what it's mapped to lift — and what the evidence honestly does not say.`],
        mistakes: [[`The Mistakes That Waste ${n} — AQAL`, `${n} — The Mistakes — AQAL`, `${n} — The Mistakes`],
          `The five failure modes that kill keystone practices, aimed at ${n}: quitting inside the horizon, dose creep, no trigger, wrong metric, substitution.`],
        "pair-with": [[`What to Pair With ${n} — AQAL`, `${n} — Pair It With — AQAL`, `${n} — Pairings`],
          `What stacks cleanly with ${n}: the practices sharing its targets, the one-at-a-time stacking rule, and the goals its evidence serves.`],
      };
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /practice/:id pages — meta from the keystone library.
  if (!meta && path.startsWith("/practice/") && !path.slice("/practice/".length).includes("/")) {
    const pr = KEYSTONE_PRACTICES.find((k) => k.id === path.slice("/practice/".length));
    if (pr) {
      meta = {
        title: fitTitle(
          `${pr.name} — Prescription, Evidence & Horizon — AQAL`,
          `${pr.name} — Prescription & Evidence — AQAL`,
          `${pr.name} — AQAL`,
          pr.name,
        ),
        description: pr.prescription.slice(0, 158),
      };
    }
  }
  // /compare/:a--vs--:b/:sub — verdict and switch pages.
  if (!meta && path.startsWith("/compare/") && path.slice("/compare/".length).includes("/")) {
    const [cs, sub] = path.slice("/compare/".length).split("/");
    const c = compareFromSlug(cs ?? "");
    if (c && (COMPARE_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const [ta, tb] = c.map((n) => therapyDisplay(n).split(" (")[0]);
      // Abbreviated names (acronym when available, else word-capped at 20)
      // so the tersest variant ALWAYS fits 60 — word-trimming would delete
      // the second name and collide same-prefix pairs.
      const abbrev = (n: string) => {
        const d = therapyDisplay(n);
        const paren = d.match(/\(([^)]+)\)/);
        const base = d.split(" (")[0];
        if (base.length > 20 && paren && paren[1].length <= 8 && /^[A-Z0-9-]+$/.test(paren[1])) {
          return base.includes("Couples") ? `${paren[1]} Couples` : paren[1];
        }
        return base.length <= 20 ? base : base.slice(0, 20).replace(/\s+\S*$/, "").replace(/[\s,;:—-]+$/, "");
      };
      const [aa, ab] = [abbrev(c[0]), abbrev(c[1])];
      const T: Record<string, [string[], string]> = {
        verdict: [[`${ta} vs ${tb} — The Verdict — AQAL`, `${aa} vs ${ab} — The Verdict — AQAL`, `Verdict: ${aa} vs ${ab}`],
          `Which of ${ta} and ${tb} is better for whom — computed from both scorecards: component edges, choose-if lists, and honest gain bands for each.`],
        switch: [[`${ta} vs ${tb} — When to Switch — AQAL`, `${aa} vs ${ab} — When to Switch — AQAL`, `Switch: ${aa} vs ${ab}`],
          `Ran one of ${ta} or ${tb} without results? The switch protocol: the real-trial checklist, when switching beats stacking, and how to run a clean handoff.`],
      };
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /compare/:a--vs--:b — protocol comparison pages.
  if (!meta && path.startsWith("/compare/") && !path.slice("/compare/".length).includes("/")) {
    const c = compareFromSlug(path.slice("/compare/".length));
    if (c) {
      const [ta, tb] = c.map((n) => therapyDisplay(n).split(" (")[0]);
      meta = {
        title: fitTitle(
          `${ta} vs ${tb} — Honest Comparison — AQAL`,
          `${ta} vs ${tb} — Compared — AQAL`,
          `${ta} vs ${tb} — AQAL`,
          `${ta} vs ${tb}`,
        ),
        description: `${ta} and ${tb} target the same capacity. Dose, durability, evidence, and how to choose — compared honestly, estimates never guarantees.`.slice(0, 158),
      };
    }
  }
  // /goal/:keyword/:sub — the two deep pages per goal.
  if (!meta && path.startsWith("/goal/") && path.slice("/goal/".length).includes("/")) {
    const [gs, sub] = path.slice("/goal/".length).split("/");
    const g = goalFromSlug(gs ?? "");
    if (g && (GOAL_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const cap = g.charAt(0).toUpperCase() + g.slice(1);
      const T: Record<string, [string[], string]> = {
        plan: [[`${cap} — The 30-Day Plan — AQAL`, `${cap} — 30-Day Plan`],
          `A 30-day schedule for ${g}, built from the evidence-matched keystone practices: baseline first, one habit at a time, measurement at the end.`],
        mistakes: [[`${cap} — The Mistakes That Sink It — AQAL`, `${cap} — The Mistakes — AQAL`, `${cap} — The Mistakes`],
          `The five patterns that sink ${g} goals: no baseline, everything at once, judging inside the horizon, motivation as a plan, and working the wrong layer.`],
      };
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /goal/:keyword — goal-matched practice pages.
  if (!meta && path.startsWith("/goal/") && !path.slice("/goal/".length).includes("/")) {
    const g = goalFromSlug(path.slice("/goal/".length));
    if (g) {
      const cap = g.charAt(0).toUpperCase() + g.slice(1);
      meta = {
        title: fitTitle(
          `${cap} — The Evidence-Tiered Practices — AQAL`,
          `${cap} — The Practices — AQAL`,
          `${cap} — AQAL`,
        ),
        description: `The keystone practices mapped to ${g}: concrete prescriptions, honest evidence tiers, and realistic time horizons — no hacks, no miracles.`.slice(0, 158),
      };
    }
  }
  // /weak/:slug and /gift/:slug — per-line problem/gift pages.
  if (!meta && (path.startsWith("/weak/") || path.startsWith("/gift/"))) {
    const weak = path.startsWith("/weak/");
    const name = lineFromSlug(path.slice(6));
    const enc = name ? LINE_ENCYCLOPEDIA[name] : undefined;
    if (name && enc) {
      meta = weak
        ? { title: fitTitle(
              `The Weak ${name} Line — Signs, Costs & Repair — AQAL`,
              `The Weak ${name} Line — Signs & Repair — AQAL`,
              `The Weak ${name} Line — AQAL`,
            ),
            description: `What a weak ${name} line looks like from inside, what it quietly costs, and the evidence-backed repair plan.`.slice(0, 158) }
        : { title: fitTitle(
              `Signs You're Gifted on the ${name} Line — AQAL`,
              `Gifted on the ${name} Line — AQAL`,
            ),
            description: `The signs of a strong ${name} line, why school never caught it, what it's worth deployed on purpose, and its best pairings.`.slice(0, 158) };
    }
  }
  // /build/:line/:therapy/plan — the week-by-week working plan.
  if (!meta && path.startsWith("/build/") && path.slice("/build/".length).split("/").length === 3) {
    const segs = path.slice("/build/".length).split("/");
    const l = engineLineFromSlug(segs[0] ?? "");
    const t = therapyFromSlug(segs[1] ?? "");
    if (l && t && segs[2] === "plan") {
      const tn = therapyDisplay(t).split(" (")[0];
      meta = {
        title: fitTitle(
          `The ${l} Plan: ${tn}, Week by Week — AQAL`,
          `${tn} × ${l} — The Plan — AQAL`,
          `${tn} × ${l} — The Plan`,
        ),
        description: `The week-by-week plan for building ${l} with ${tn}: the operating schedule, day-by-day first week, checkpoints, and both exits defined in advance.`.slice(0, 158),
      };
    }
  }
  // /build/:line/:therapy — capacity-building entry pages.
  if (!meta && path.startsWith("/build/") && path.slice("/build/".length).split("/").length === 2) {
    const segs = path.slice("/build/".length).split("/");
    const l = engineLineFromSlug(segs[0] ?? "");
    const t = therapyFromSlug(segs[1] ?? "");
    if (l && t) {
      const tn = therapyDisplay(t).split(" (")[0];
      meta = {
        title: fitTitle(
          `${tn} for the ${l} Capacity — AQAL`,
          `${tn} for ${l} — AQAL`,
          // Never collapse to the bare therapy name — that's /protocol/'s
          // territory and titles must stay unique across the two families.
          `${tn} for ${l}`,
        ),
        description: `Building ${l} with ${tn}: the exact capacity developed, the peer-reviewed evidence, the dose, and the alternatives.`.slice(0, 158),
      };
    }
  }
  // /myth/:id/:sub — the four deep pages per exhibit.
  if (!meta && path.startsWith("/myth/") && path.slice("/myth/".length).includes("/")) {
    const [mid, sub] = path.slice("/myth/".length).split("/");
    const m = mythById(mid ?? "");
    if (m && (MYTH_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const T: Record<string, [string[], string]> = {
        "feels-real": [[`Why ${m.name} Feels So Real — AQAL`, `${m.name} — Why It Feels Real`, `${m.name} — Feels Real`],
          `The honest psychology of why ${m.name} convinced smart people: its specific seduction, its wing's family pattern, and the four machines under everything.`],
        receipts: [[`${m.name} — The Receipts — AQAL`, `${m.name} — The Receipts`, `${m.name} — Receipts`],
          `${m.name}'s full evidence record: the claim as sold, the verdict it earned, why, and the named source you can check without trusting us.`],
        instead: [[`What Works Instead of ${m.name} — AQAL`, `${m.name} — What Works Instead`, `${m.name} — Instead`],
          `The legitimate need under ${m.name}, routed honestly: where the evidence points, and the four questions any replacement must pass first.`],
        "talk-someone-out": [[`Talking Someone Out of ${m.name} — AQAL`, `${m.name} — The Rescue Script`, `${m.name} — Rescue`],
          `The five-step sequence for helping someone you love leave ${m.name} — without the backfire: lead with the problem, ask the calibration question, then receipts.`],
      };
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /myth/:id — Myth Museum exhibits.
  if (!meta && path.startsWith("/myth/") && !path.slice("/myth/".length).includes("/")) {
    const m = mythById(path.slice("/myth/".length));
    if (m) {
      const verdict = m.verdict.charAt(0) + m.verdict.slice(1).toLowerCase();
      meta = {
        title: fitTitle(
          `${m.name} — ${verdict} — The Myth Museum — AQAL`,
          `${m.name} — ${verdict} — Myth Museum`,
          `${m.name} — Myth Museum`,
          m.name,
        ),
        description: `${m.claim} The sourced verdict: ${m.verdict.toLowerCase()}. Why it failed, why people bought it, and what holds up instead.`.slice(0, 158),
      };
    }
  }
  // /capacity/:slug/:sub — the three deep pages per hidden capacity.
  if (!meta && path.startsWith("/capacity/") && path.slice("/capacity/".length).includes("/")) {
    const [cs, sub] = path.slice("/capacity/".length).split("/");
    const l = engineLineFromSlug(cs ?? "");
    if (l && CAPACITY_ONLY_LINES.includes(l) && (CAPACITY_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const T: Record<string, [string[], string]> = {
        signs: [[`The Signs of Strong and Weak ${l} — AQAL`, `${l} — The Signs — AQAL`, `${l} — The Signs`],
          `What strong ${l} looks like, what weak looks like, and why no conventional test ever told you which one you are.`],
        build: [[`Building the ${l} Capacity — AQAL`, `${l} — Building It — AQAL`, `${l} — Building It`],
          `The cited protocols mapped to the ${l} capacity, strongest first, with the sequencing rule that turns a list into a season.`],
        cost: [[`What Weak ${l} Quietly Costs — AQAL`, `${l} — The Cost — AQAL`, `${l} — The Cost`],
          `The itemized tax of a weak ${l} capacity, why it stays invisible, and the trained counterfactual the cited library maps.`],
      };
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /capacity/:slug — the eight engine-only capacity pages.
  if (!meta && path.startsWith("/capacity/") && !path.slice("/capacity/".length).includes("/")) {
    const l = engineLineFromSlug(path.slice("/capacity/".length));
    if (l && CAPACITY_ONLY_LINES.includes(l)) {
      meta = {
        title: fitTitle(
          `The ${l} Capacity — Scored, Never Displayed — AQAL`,
          `The ${l} Capacity — AQAL`,
        ),
        description: `The ${l} capacity: what our engine measures, why no standardized test ever has, what strength looks like, what weakness costs, and the cited protocols that build it.`.slice(0, 158),
      };
    }
  }
  // /kind/:id/:sub — the three deep pages per protocol kind.
  if (!meta && path.startsWith("/kind/") && path.slice("/kind/".length).includes("/")) {
    const [kid, sub] = path.slice("/kind/".length).split("/");
    if (KIND_IDS.includes(kid ?? "") && (KIND_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const cap = kid!.charAt(0).toUpperCase() + kid!.slice(1);
      const T: Record<string, [string[], string]> = {
        choose: [[`Choosing a ${cap} Protocol — AQAL`, `${cap} — Choosing One — AQAL`, `${cap} — Choosing One`],
          `How to pick between the ${kid} family's protocols: the three deciding questions — target line, dose fit, honest demands — and the full roster.`],
        "first-month": [[`Your First Month of ${cap} Work — AQAL`, `${cap} — The First Month — AQAL`, `${cap} — First Month`],
          `The ${kid} family's first month: week one day by day, then the honest early curve — what moves, what doesn't yet, and why that's normal.`],
        standards: [[`The Evidence Standards for ${cap} — AQAL`, `${cap} — The Standards — AQAL`, `${cap} — Standards`],
          `How to read claims in the ${kid} family — including ours: the evidential bar, the durability line, and the public Corrections Ledger behind it.`],
      };
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /kind/:id — protocol-kind profile pages.
  if (!meta && path.startsWith("/kind/") && !path.slice("/kind/".length).includes("/")) {
    const id = path.slice("/kind/".length);
    if (KIND_IDS.includes(id)) {
      const cap = id.charAt(0).toUpperCase() + id.slice(1);
      meta = {
        title: fitTitle(
          `${cap} Protocols — Dose, Demands & Durability — AQAL`,
          `${cap} Protocols — AQAL`,
        ),
        description: `The ${id} protocol family: what this kind of intervention is, the literature-typical dose, what it honestly demands, how long gains last, and every library protocol of the kind.`.slice(0, 158),
      };
    }
  }
  // /wing/:id/:sub — the two deep pages per museum wing.
  if (!meta && path.startsWith("/wing/") && path.slice("/wing/".length).includes("/")) {
    const [wid, sub] = path.slice("/wing/".length).split("/");
    if (WING_IDS.includes(wid ?? "") && (WING_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const cap = wid!.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const T: Record<string, [string[], string]> = {
        spot: [[`How to Spot the ${cap} Pattern — AQAL`, `${cap} — Spotting It — AQAL`, `${cap} — Spotting It`],
          `The ${cap.toLowerCase()} family's tells: how it claims to work, the red flags that mark it, the four-question field test, and the documented members.`],
        escape: [[`Getting Out of the ${cap} Trap — AQAL`, `${cap} — The Way Out — AQAL`, `${cap} — The Way Out`],
          `The exit ramp from the ${cap.toLowerCase()} family: naming the grip honestly, the four-step sequence out, and the cultural pull you're swimming against.`],
      };
      const t = T[sub!];
      if (t) meta = { title: fitTitle(...t[0]), description: t[1].slice(0, 158) };
    }
  }
  // /wing/:id — Myth Museum wing pages.
  if (!meta && path.startsWith("/wing/") && !path.slice("/wing/".length).includes("/")) {
    const id = path.slice("/wing/".length);
    if (WING_IDS.includes(id)) {
      const cap = id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      meta = {
        title: fitTitle(
          `${cap} — A Wing of the Myth Museum — AQAL`,
          `${cap} — Myth Museum — AQAL`,
          `${cap} — Myth Museum`,
        ),
        description: `The ${cap.toLowerCase()} family of failed therapies: how the family claims to work, why it feels like it works, the tell-tale signs, and every documented exhibit in the wing.`.slice(0, 158),
      };
    }
  }
  // /verdict/:slug — museum verdict category pages.
  if (!meta && path.startsWith("/verdict/")) {
    const slug = path.slice("/verdict/".length);
    if (VERDICT_SLUGS.includes(slug)) {
      const cap = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      meta = {
        title: fitTitle(
          `Verdict: ${cap} — The Myth Museum — AQAL`,
          `Verdict: ${cap} — Myth Museum`,
          `Verdict: ${cap}`,
        ),
        description: `What the "${cap.toLowerCase()}" verdict means, the evidential standard it applies, and every Myth Museum exhibit that earned it — sourced, exhibit by exhibit.`.slice(0, 158),
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
    const [bk, bl] = path.slice("/best/".length).split("/");
    const combo = bestComboFromSlug(bk ?? "", bl ?? "");
    if (combo) {
      const cap = combo.kind.charAt(0).toUpperCase() + combo.kind.slice(1);
      meta = {
        title: fitTitle(
          `Best ${cap} Protocols for ${combo.line} — AQAL`,
          `${cap} Protocols for ${combo.line} — AQAL`,
          `${cap} for ${combo.line} — Ranked`,
        ),
        description: `The ${combo.kind} protocols with peer-reviewed mappings to the ${combo.line} capacity — ranked by mapped role, with dose, demands, and durability.`.slice(0, 158),
      };
    }
  }
  // /protocol/:slug/:sub — the seven deep sub-pages per protocol.
  if (!meta && path.startsWith("/protocol/") && path.slice("/protocol/".length).includes("/")) {
    const [pslug, sub] = path.slice("/protocol/".length).split("/");
    const tname = therapyFromSlug(pslug ?? "");
    if (tname && (PROTOCOL_SUBPAGES as readonly string[]).includes(sub ?? "")) {
      const tn = therapyDisplay(tname).split(" (")[0];
      const SUB_META: Record<string, { titles: (n: string) => string[]; desc: (n: string) => string }> = {
        "first-week": {
          titles: (n) => [`${n} — Your First Week, Day by Day — AQAL`, `${n} — Your First Week — AQAL`, `${n} — First Week`],
          desc: (n) => `The first seven days of ${n}, mapped day by day: setup, the starting dose, what to expect to feel, and the week-one mistake that sinks most people.`,
        },
        evidence: {
          titles: (n) => [`${n} — The Evidence, Study by Study — AQAL`, `${n} — The Evidence — AQAL`, `${n} — The Evidence`],
          desc: (n) => `Every peer-reviewed study behind ${n} in this library — the capacity each one measured, the finding, the citation — plus what the evidence honestly doesn't show.`,
        },
        dose: {
          titles: (n) => [`${n} — Dose, Schedule & Durability — AQAL`, `${n} — The Dose — AQAL`, `${n} — The Dose`],
          desc: (n) => `The literature-typical dose of ${n}: format, frequency, course length, what it honestly demands, how long gains last, and what to do about missed days.`,
        },
        "who-its-for": {
          titles: (n) => [`${n} — Who It's For (and Who It Isn't) — AQAL`, `${n} — Who It's For — AQAL`, `${n} — Who It's For`],
          desc: (n) => `Who ${n} actually fits: the intelligence-line profile that points here, two personas who end up on this page, and who should route to a professional first.`,
        },
        mistakes: {
          titles: (n) => [`${n} — The Mistakes That Waste It — AQAL`, `${n} — The Mistakes — AQAL`, `${n} — The Mistakes`],
          desc: (n) => `The five predictable ways people waste ${n} — and the honest test that separates a protocol that isn't working from one that isn't finished yet.`,
        },
        results: {
          titles: (n) => [`${n} — What Changes, and When — AQAL`, `${n} — Results Timeline — AQAL`, `${n} — Results`],
          desc: (n) => `The honest results timeline for ${n}: what week one really looks like, where the literature places the real gains, and the spread nobody advertises.`,
        },
        stack: {
          titles: (n) => [`${n} — What to Stack It With — AQAL`, `${n} — The Stack — AQAL`, `${n} — The Stack`],
          desc: (n) => `How to combine ${n} with the other mapped protocols that share its intelligence lines: what carries the load, what supports, and the order that compounds.`,
        },
        score: {
          titles: (n) => [`${n} — The Full Scorecard — AQAL`, `${n} — Scorecard — AQAL`, `${n} — Scorecard`],
          desc: (n) => `${n} scored 0–100 by the open formula: evidence, durability, breadth, speed, ease — plus targeted lines, schedule, likely-gain band, and decay curve.`,
        },
        synergy: {
          titles: (n) => [`${n} — Cross-Mechanism Synergies — AQAL`, `${n} — Synergies — AQAL`, `${n} — Synergies`],
          desc: (n) => `The protocols that compound with ${n}: different mechanism families sharing its target lines, ranked by score — and why cross-mechanism beats more-of-the-same.`,
        },
        atrophy: {
          titles: (n) => [`${n} — The Atrophy Curve — AQAL`, `${n} — Atrophy — AQAL`, `${n} — Atrophy`],
          desc: (n) => `How ${n}'s gains fade without use: the decay curve, the maintenance dose that holds them, and how fast they re-sharpen after a lapse — published, not hidden.`,
        },
        "daily-life": {
          titles: (n) => [`${n} in Your Actual Day — AQAL`, `${n} — Daily Life — AQAL`, `${n} — Daily Life`],
          desc: (n) => `Where ${n}'s capacities operate in an ordinary day: when they fire, what they look like from outside, and the micro-doses that keep them alive for free.`,
        },
      };
      const sm = SUB_META[sub!];
      if (sm) meta = { title: fitTitle(...sm.titles(tn)), description: sm.desc(tn).slice(0, 158) };
    }
  }
  // /protocol/:slug pages get generated meta from the therapy map.
  if (!meta && path.startsWith("/protocol/") && !path.slice("/protocol/".length).includes("/")) {
    const tname = therapyFromSlug(path.slice("/protocol/".length));
    if (tname) {
      const entry = THERAPY_LINE_MAP.find((t) => t.therapy === tname);
      const lines = THERAPY_LINE_MAP.filter((t) => t.therapy === tname).map((t) => t.line).join(", ");
      const tn = therapyDisplay(tname).split(" (")[0];
      meta = {
        title: fitTitle(
          `${tn} — Which Intelligence Lines It Builds — AQAL`,
          `${tn} — The Lines It Builds — AQAL`,
          `${tn} — AQAL`,
          tn,
        ),
        description: (entry ? `${entry.capacity} Mapped to: ${lines}. Dose, durability, and the peer-reviewed evidence.` : "").slice(0, 158),
      };
    }
  }
  return meta;
}
