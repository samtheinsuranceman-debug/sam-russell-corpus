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
    const segs = p.slice(6).split("/");
    const n = lineFromSlug(segs[0] ?? "");
    if (!n) return undefined;
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        "at-work": `${n} at work: the rooms where it pays.`,
        "in-relationships": `${n} at home: what your people feel.`,
        history: `${n}: the discovery nobody used.`,
        "raise-it": `Raise your ${n} line — the cited route.`,
        "self-check": `${n}: five questions, one honest mirror.`,
        "never-tested": `${n}: the score no test ever took.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${n}: the intelligence no test ever caught.`);
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
    const segs = p.slice(6).split("/");
    const pr = pairFromSlug(segs[0] ?? "");
    if (!pr) return undefined;
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        collide: `${pr[0]} × ${pr[1]}: where they clash.`,
        train: `${pr[0]} × ${pr[1]}: train the duo.`,
        "at-work": `${pr[0]} × ${pr[1]}: on the job.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${pr[0]} × ${pr[1]}: where your power multiplies.`);
  }
  if (p.startsWith("/protocol/")) {
    const segs = p.slice(10).split("/");
    const t = therapyFromSlug(segs[0] ?? "");
    if (!t) return undefined;
    const sn = shortName(t);
    if (segs.length === 2) {
      // The seven deep sub-pages — one magnetic angle each, unique because
      // protocol short-names are unique and every suffix is distinct.
      const SUB_SHORTS: Record<string, string> = {
        "first-week": `${sn}: week one, mapped day by day.`,
        evidence: `${sn}: the receipts, study by study.`,
        dose: `${sn}: the exact dose that works.`,
        "who-its-for": `${sn}: who it fits — who should skip.`,
        mistakes: `${sn}: the mistakes that waste it.`,
        results: `${sn}: what changes, and when.`,
        stack: `${sn}: what to pair it with.`,
        score: `${sn}: scored 0–100, formula shown.`,
        synergy: `${sn}: its best cross-partners.`,
        atrophy: `${sn}: the decay curve, published.`,
        "daily-life": `${sn}: where it lives in your day.`,
      };
      const s = SUB_SHORTS[segs[1] ?? ""];
      return s ? fit(s) : undefined;
    }
    return fit(`${sn}: the proven fix — dose and proof inside.`);
  }
  if (p.startsWith("/compare/")) {
    const segs = p.slice(9).split("/");
    const c = compareFromSlug(segs[0] ?? "");
    if (!c) return undefined;
    if (segs.length === 2) {
      // Sub token FIRST, and both names capped harder (20 chars) so the
      // composed string NEVER needs fit()'s trim — trimming would delete
      // the second name and collide same-prefix pairs.
      const cap20 = (n: string) => {
        const sn = shortName(n);
        return sn.length <= 20 ? sn : sn.slice(0, 20).replace(/\s+\S*$/, "").replace(/[\s,;:—-]+$/, "");
      };
      const SUB: Record<string, string> = {
        verdict: `Verdict: ${cap20(c[0])} vs ${cap20(c[1])}.`,
        switch: `Switch point: ${cap20(c[0])} vs ${cap20(c[1])}.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${shortName(c[0])} vs ${shortName(c[1])}: one of these is yours.`);
  }
  if (p.startsWith("/practice/")) {
    const segs = p.slice(10).split("/");
    const pr = KEYSTONE_PRACTICES.find((k) => k.id === segs[0]);
    if (!pr) return undefined;
    // Same abbreviation rule as myths: keep the suffix, trim the name.
    const pn0 = pr.name.split(" (")[0].trim();
    const pn = pn0.length > 30 ? pn0.slice(0, 30).replace(/\s+\S*$/, "").trim() : pn0;
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        start: `${pn}: the two-week install.`,
        evidence: `${pn}: the tier, told straight.`,
        mistakes: `${pn}: five ways it dies.`,
        "pair-with": `${pn}: what stacks clean.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${pn}: tiny dose, compounding payoff.`);
  }
  if (p.startsWith("/goal/")) {
    const segs = p.slice(6).split("/");
    const g = goalFromSlug(segs[0] ?? "");
    if (!g) return undefined;
    const cap = g.charAt(0).toUpperCase() + g.slice(1);
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        plan: `${cap}: the 30-day schedule.`,
        mistakes: `${cap}: five classic sinkholes.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${cap}: the moves that actually work.`);
  }
  if (p.startsWith("/myth/")) {
    const segs = p.slice(6).split("/");
    const m = mythById(segs[0] ?? "");
    if (!m) return undefined;
    // Long exhibit names get abbreviated so the distinguishing suffix —
    // not the name — is what survives the character budget.
    const mn = m.name.length > 30 ? m.name.split(/[/(]/)[0].trim().slice(0, 30).trim() : m.name;
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        "feels-real": `${mn}: why it fools people.`,
        receipts: `${mn}: the receipts, named.`,
        instead: `${mn}: the honest swap.`,
        "talk-someone-out": `${mn}: the rescue script.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${m.name}: ${m.verdict.toLowerCase()}. See the receipts.`);
  }
  if (p.startsWith("/capacity/")) {
    const segs = p.slice(10).split("/");
    const l = engineLineFromSlug(segs[0] ?? "");
    if (!l || !CAPACITY_ONLY_LINES.includes(l)) return undefined;
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        signs: `${l}: strong vs weak, named.`,
        build: `${l}: the cited way to build it.`,
        cost: `${l}: the invisible tax, itemized.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${l}: the power no test ever found in you.`);
  }
  if (p.startsWith("/kind/")) {
    const segs = p.slice(6).split("/");
    const id = segs[0] ?? "";
    if (!KIND_IDS.includes(id)) return undefined;
    const cap = id.charAt(0).toUpperCase() + id.slice(1);
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        choose: `${cap} protocols: how to pick yours.`,
        "first-month": `${cap} work: month one, mapped.`,
        standards: `${cap} claims: the bar they clear.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${cap} protocols: what they really deliver.`);
  }
  if (p.startsWith("/wing/")) {
    const segs = p.slice(6).split("/");
    const id = segs[0] ?? "";
    if (!WING_IDS.includes(id)) return undefined;
    const cap = id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    if (segs.length === 2) {
      const SUB: Record<string, string> = {
        spot: `${cap}: the red flags, listed.`,
        escape: `${cap}: the way out, mapped.`,
      };
      const sv = SUB[segs[1] ?? ""];
      return sv ? fit(sv) : undefined;
    }
    return fit(`${cap}: how this family fools smart people.`);
  }
  if (p.startsWith("/best/")) {
    const segs = p.slice(6).split("/");
    const l = engineLineFromSlug(segs[1] ?? "");
    if (!l || !KIND_IDS.includes(segs[0] ?? "")) return undefined;
    return fit(`${l} via ${segs[0]}: ranked, cited.`);
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
    if (segs.length === 3) {
      return segs[2] === "plan" ? fit(`Plan: ${shortName(t)} × ${l}, week by week.`) : undefined;
    }
    return fit(`Build ${l} with ${shortName(t)} — evidence inside.`);
  }
  return undefined;
}
