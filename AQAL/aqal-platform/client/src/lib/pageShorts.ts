// ============================================================
// PAGE SHORTS — the one-line description system. Every page on
// the site gets a UNIQUE description under 69 characters: what
// it is + what it means to you. Static pages carry theirs in
// shared/seo PAGE_META; every dynamic family composes its own
// here. RouteMeta serves them as og:/twitter: descriptions, and
// scripts/verify-shorts asserts ALL pages stay unique and <69.
// STANDING RULE: any new page family added to the site must add
// its branch here — that keeps the guarantee automatic.
// ============================================================
import {
  PAGE_META, lineFromSlug, pairFromSlug, therapyFromSlug, therapyDisplay,
  compareFromSlug, goalFromSlug, engineLineFromSlug,
} from "@shared/seo";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";

const MAX = 68; // "always less than 69 characters"

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
  if (base.length > 26 && paren && paren[1].length <= 8 && /^[A-Z0-9-]+$/.test(paren[1])) {
    return base.includes("Couples") ? `${paren[1]} Couples` : paren[1];
  }
  return base.length > 30 ? base.split(/[:—]/)[0].trim().slice(0, 30).trim() : base;
}

export function shortFor(path: string): string | undefined {
  const p = path === "" ? "/" : path;
  const staticMeta = PAGE_META[p];
  if (staticMeta) return fit(staticMeta.short);

  if (p.startsWith("/line/")) {
    const n = lineFromSlug(p.slice(6));
    return n ? fit(`${n} intelligence: the signs, the science, what it's worth to you.`) : undefined;
  }
  if (p.startsWith("/weak/")) {
    const n = lineFromSlug(p.slice(6));
    return n ? fit(`A weak ${n} line: the signs, the costs, the repair plan.`) : undefined;
  }
  if (p.startsWith("/gift/")) {
    const n = lineFromSlug(p.slice(6));
    return n ? fit(`Gifted at ${n}? The signs school missed — and the payoff.`) : undefined;
  }
  if (p.startsWith("/pair/")) {
    const pr = pairFromSlug(p.slice(6));
    return pr ? fit(`${pr[0]} × ${pr[1]}: what multiplies — and what half a pair costs.`) : undefined;
  }
  if (p.startsWith("/protocol/")) {
    const t = therapyFromSlug(p.slice(10));
    return t ? fit(`${shortName(t)}: the lines it builds, the dose, the evidence.`) : undefined;
  }
  if (p.startsWith("/compare/")) {
    const c = compareFromSlug(p.slice(9));
    return c ? fit(`${shortName(c[0])} vs ${shortName(c[1])}: same target — which fits you?`) : undefined;
  }
  if (p.startsWith("/practice/")) {
    const pr = KEYSTONE_PRACTICES.find((k) => k.id === p.slice(10));
    return pr ? fit(`${pr.name}: the exact prescription, evidence tier, horizon.`) : undefined;
  }
  if (p.startsWith("/goal/")) {
    const g = goalFromSlug(p.slice(6));
    return g ? fit(`${g.charAt(0).toUpperCase() + g.slice(1)}: the practices with real evidence and real doses.`) : undefined;
  }
  if (p.startsWith("/build/")) {
    const segs = p.slice(7).split("/");
    const l = engineLineFromSlug(segs[0] ?? "");
    const t = therapyFromSlug(segs[1] ?? "");
    return l && t ? fit(`Build ${l} with ${shortName(t)}: dose + cited evidence.`) : undefined;
  }
  return undefined;
}
