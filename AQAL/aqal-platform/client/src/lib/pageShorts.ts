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
    const n = lineFromSlug(p.slice(6));
    return n ? fit(`${n}: the intelligence no test ever caught.`) : undefined;
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
    const pr = pairFromSlug(p.slice(6));
    return pr ? fit(`${pr[0]} × ${pr[1]}: where your power multiplies.`) : undefined;
  }
  if (p.startsWith("/protocol/")) {
    const t = therapyFromSlug(p.slice(10));
    return t ? fit(`${shortName(t)}: the proven fix — dose and proof inside.`) : undefined;
  }
  if (p.startsWith("/compare/")) {
    const c = compareFromSlug(p.slice(9));
    return c ? fit(`${shortName(c[0])} vs ${shortName(c[1])}: one of these is yours.`) : undefined;
  }
  if (p.startsWith("/practice/")) {
    const pr = KEYSTONE_PRACTICES.find((k) => k.id === p.slice(10));
    return pr ? fit(`${pr.name}: tiny dose, compounding payoff.`) : undefined;
  }
  if (p.startsWith("/goal/")) {
    const g = goalFromSlug(p.slice(6));
    return g ? fit(`${g.charAt(0).toUpperCase() + g.slice(1)}: the moves that actually work.`) : undefined;
  }
  if (p.startsWith("/myth/")) {
    const m = mythById(p.slice(6));
    return m ? fit(`${m.name}: ${m.verdict.toLowerCase()}. See the receipts.`) : undefined;
  }
  if (p.startsWith("/capacity/")) {
    const l = engineLineFromSlug(p.slice(10));
    return l && CAPACITY_ONLY_LINES.includes(l)
      ? fit(`${l}: the power no test ever found in you.`) : undefined;
  }
  if (p.startsWith("/kind/")) {
    const id = p.slice(6);
    return KIND_IDS.includes(id)
      ? fit(`${id.charAt(0).toUpperCase() + id.slice(1)} protocols: what they really deliver.`) : undefined;
  }
  if (p.startsWith("/wing/")) {
    const id = p.slice(6);
    if (!WING_IDS.includes(id)) return undefined;
    const cap = id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return fit(`${cap}: how this family fools smart people.`);
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
    return l && t ? fit(`Build ${l} with ${shortName(t)} — evidence inside.`) : undefined;
  }
  return undefined;
}
