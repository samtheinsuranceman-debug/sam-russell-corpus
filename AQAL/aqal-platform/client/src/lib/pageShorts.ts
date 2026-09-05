// ============================================================
// PAGE SHORTS — the one-line description system. Every page on
// the site gets a UNIQUE description under 60 characters: what
// it is + what it means to you. Static pages carry theirs in
// shared/seo PAGE_META; every dynamic family composes its own
// here. RouteMeta serves them as og:/twitter: descriptions, and
// scripts/verify-shorts asserts ALL pages stay unique and <60.
// STANDING RULE: any new page family added to the site must add
// its branch here — that keeps the guarantee automatic.
// ============================================================
import {
  PAGE_META, lineFromSlug, pairFromSlug, therapyFromSlug, therapyDisplay,
  compareFromSlug, goalFromSlug, engineLineFromSlug,
  CAPACITY_ONLY_LINES, KIND_IDS, WING_IDS, VERDICT_SLUGS,
} from "@shared/seo";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { mythById } from "@/lib/mythMuseum";
import { hypnosisById } from "@shared/hypnosisTopics";
import { archById, ARCH_ABBR, archBlendFromSlug, ARCH_BLENDS } from "@shared/seo";

const MAX = 59; // "under sixty characters" — always

// Compress to the cap at a word boundary — no mid-word chops, no ellipsis.
// The closing period is part of the budget: output is ALWAYS ≤ MAX.
function fit(s: string): string {
  if (s.length <= MAX) return s;
  const cut = s.slice(0, MAX); // room for the closing period
  const at = cut.lastIndexOf(" ");
  const trimmed = (at > 30 ? cut.slice(0, at) : cut).replace(/[\s,;:—-]+$/, "");
  return trimmed.slice(0, MAX - 1) + ".";
}

// Long protocol names get abbreviated before composing, so the meaning —
// not the name — is what survives the character budget.
function shortName(therapy: string): string {
  const d = therapyDisplay(therapy);
  const paren = d.match(/\(([^)]+)\)/);
  const base = d.split(" (")[0];
  // Prefer a short parenthetical acronym when the base name is long —
  // disambiguated when two protocols share one (EFT vs EFT Couples).
  if (base.length > 20 && paren && paren[1].length <= 8 && /^[A-Z0-9-]+$/.test(paren[1])) {
    return base.includes("Couples") ? `${paren[1]} Couples` : paren[1];
  }
  return base.length > 24 ? base.split(/[:—]/)[0].trim().slice(0, 24).trim() : base;
}

export function shortFor(path: string): string | undefined {
  const p = path === "" ? "/" : path;
  const staticMeta = PAGE_META[p];
  if (staticMeta) return fit(staticMeta.short);

  if (p.startsWith("/line/")) {
    const segments = p.slice(6).split("/");
    const name = lineFromSlug(segments[0] ?? "");
    if (!name) return undefined;
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        "at-work": `${name} at work: the rooms where it pays.`,
        "in-relationships": `${name} at home: what your people feel.`,
        history: `${name}: the discovery nobody used.`,
        "raise-it": `Raise your ${name} line — the cited route.`,
        "self-check": `${name}: five questions, one honest mirror.`,
        "never-tested": `${name}: the score no test ever took.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${name}: the intelligence no test ever caught.`);
  }
  if (p.startsWith("/weak/")) {
    const n = lineFromSlug(p.slice(6));
    return n ? fit(`Weak ${n} is quietly taxing everything you do.`) : undefined;
  }
  if (p.startsWith("/gift/")) {
    const n = lineFromSlug(p.slice(6));
    return n ? fit(`Gifted at ${n} — and nobody ever told you.`) : undefined;
  }
  if (p.startsWith("/pair/")) {
    const segments = p.slice(6).split("/");
    const pair = pairFromSlug(segments[0] ?? "");
    if (!pair) return undefined;
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        collide: `${pair[0]} × ${pair[1]}: where they clash.`,
        train: `${pair[0]} × ${pair[1]}: train the duo.`,
        "at-work": `${pair[0]} × ${pair[1]}: on the job.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${pair[0]} × ${pair[1]}: where your power multiplies.`);
  }
  if (p.startsWith("/protocol/")) {
    const segments = p.slice(10).split("/");
    const therapy = therapyFromSlug(segments[0] ?? "");
    if (!therapy) return undefined;
    const name = shortName(therapy);
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        "first-week": `${name}: week one, mapped day by day.`,
        evidence: `${name}: the receipts, study by study.`,
        dose: `${name}: the exact dose that works.`,
        "who-its-for": `${name}: who it fits — who should skip.`,
        mistakes: `${name}: the mistakes that waste it.`,
        results: `${name}: what changes, and when.`,
        stack: `${name}: what to pair it with.`,
        score: `${name}: the open AQAL scorecard.`,
        synergy: `${name}: complements and alternatives.`,
        atrophy: `${name}: durability and upkeep.`,
        "daily-life": `${name}: the work in a normal week.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${name}: the proven fix — dose and proof inside.`);
  }
  if (p.startsWith("/compare/")) {
    const segments = p.slice(9).split("/");
    const c = compareFromSlug(segments[0] ?? "");
    if (!c) return undefined;
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        verdict: `${shortName(c[0])} vs ${shortName(c[1])}: the modeled verdict.`,
        switch: `${shortName(c[0])} vs ${shortName(c[1])}: review the switch.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${shortName(c[0])} vs ${shortName(c[1])}: one of these is yours.`);
  }
  if (p.startsWith("/practice/")) {
    const segments = p.slice(10).split("/");
    const practice = KEYSTONE_PRACTICES.find((entry) => entry.id === segments[0]);
    if (!practice) return undefined;
    const fullName = practice.name.split(" (")[0].trim();
    const name = fullName.length > 30 ? fullName.slice(0, 30).replace(/\s+\S*$/, "").trim() : fullName;
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        start: `${name}: the two-week install.`,
        evidence: `${name}: the tier, told straight.`,
        mistakes: `${name}: five ways it dies.`,
        "pair-with": `${name}: what stacks clean.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${name}: tiny dose, compounding payoff.`);
  }
  if (p.startsWith("/goal/")) {
    const segments = p.slice(6).split("/");
    const goal = goalFromSlug(segments[0] ?? "");
    if (!goal) return undefined;
    const cap = goal.charAt(0).toUpperCase() + goal.slice(1);
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        plan: `${cap}: the 30-day schedule.`,
        mistakes: `${cap}: five classic sinkholes.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${cap}: the moves that actually work.`);
  }
  if (p.startsWith("/myth/")) {
    const segments = p.slice(6).split("/");
    const myth = mythById(segments[0] ?? "");
    if (!myth) return undefined;
    const name = myth.name.length > 30 ? myth.name.split(/[/(]/)[0].trim().slice(0, 30).trim() : myth.name;
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        "feels-real": `${name}: why it fools people.`,
        receipts: `${name}: the receipts, named.`,
        instead: `${name}: the honest swap.`,
        "talk-someone-out": `${name}: the rescue script.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${myth.name}: ${myth.verdict.toLowerCase()}. See the receipts.`);
  }
  if (p.startsWith("/capacity/")) {
    const segments = p.slice(10).split("/");
    const line = engineLineFromSlug(segments[0] ?? "");
    if (!line || !CAPACITY_ONLY_LINES.includes(line)) return undefined;
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        signs: `${line}: strong vs weak, named.`,
        build: `${line}: the cited way to build it.`,
        cost: `${line}: the invisible tax, itemized.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${line}: the power no test ever found in you.`);
  }
  if (p.startsWith("/kind/")) {
    const segments = p.slice(6).split("/");
    const id = segments[0] ?? "";
    if (!KIND_IDS.includes(id)) return undefined;
    const cap = id.charAt(0).toUpperCase() + id.slice(1);
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        choose: `${cap} protocols: how to pick yours.`,
        "first-month": `${cap} work: month one, mapped.`,
        standards: `${cap} claims: the bar they clear.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${cap} protocols: what they really deliver.`);
  }
  if (p.startsWith("/wing/")) {
    const segments = p.slice(6).split("/");
    const id = segments[0] ?? "";
    if (!WING_IDS.includes(id)) return undefined;
    const cap = id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    if (segments.length === 2) {
      const subpageShorts: Record<string, string> = {
        spot: `${cap}: the red flags, listed.`,
        escape: `${cap}: the way out, mapped.`,
      };
      const copy = subpageShorts[segments[1] ?? ""];
      return copy ? fit(copy) : undefined;
    }
    return fit(`${cap}: how this family fools smart people.`);
  }
  if (p.startsWith("/best/")) {
    const segments = p.slice(6).split("/");
    const line = engineLineFromSlug(segments[1] ?? "");
    if (!line || !KIND_IDS.includes(segments[0] ?? "")) return undefined;
    return fit(`${line} via ${segments[0]}: ranked, cited.`);
  }
  if (p.startsWith("/archetype/")) {
    const segs = p.slice(11).split("/");
    const a = archById(segs[0] ?? "");
    if (!a) return undefined;
    const n = ARCH_ABBR[a.id] ?? a.name;
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        verify: `${n}: the three-part self-test.`,
        "break-out": `${n}: the cited way out.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${n}: the full dossier, cited.`);
  }
  if (p.startsWith("/archetype-blend/")) {
    const pr = archBlendFromSlug(p.slice(17));
    if (!pr) return undefined;
    // Numbered so every blend short is unique BY CONSTRUCTION even where
    // abbreviated pool names collide; capped so fit() never trims.
    const idx = ARCH_BLENDS.findIndex(([a, b]) => a === pr[0] && b === pr[1]) + 1;
    const c18 = (id: string) => {
      const n = ARCH_ABBR[id] ?? id;
      return n.length <= 18 ? n : n.slice(0, 18).replace(/\s+\S*$/, "").replace(/[\s,;:(—-]+$/, "");
    };
    return fit(`Mix ${idx}: ${c18(pr[0])} × ${c18(pr[1])}.`);
  }
  if (p.startsWith("/hypnosis/")) {
    const t = hypnosisById(p.slice(10));
    return t ? fit(`${t.title}: press play, then practice.`) : undefined;
  }
  if (p.startsWith("/verdict/")) {
    const slug = p.slice(9);
    if (!VERDICT_SLUGS.includes(slug)) return undefined;
    const cap = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return fit(`${cap}: the standard — and every offender.`);
  }
  if (p.startsWith("/build/")) {
    const segs = p.slice(7).split("/");
    const l = engineLineFromSlug(segs[0] ?? "");
    const t = therapyFromSlug(segs[1] ?? "");
    if (!l || !t) return undefined;
    return segs[2] === "plan"
      ? fit(`${l} × ${shortName(t)}: the week-by-week plan.`)
      : fit(`Build ${l} with ${shortName(t)} — evidence inside.`);
  }
  if (p.startsWith("/hypnosis/")) {
    const topic = hypnosisById(p.slice(10));
    return topic ? fit(`${topic.title}: every suggestion disclosed.`) : undefined;
  }
  return undefined;
}
