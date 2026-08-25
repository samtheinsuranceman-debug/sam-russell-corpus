// ============================================================
// ROUTE META BUILDER — the pure function behind RouteMeta.
// Given a path, returns the page's <title> + meta description.
// Extracted from the component so the SEO hard rules are
// build-enforced by routeMetaFor.test.ts across all 2,466
// sitemap URLs: every title ≤ 60 characters (search results
// truncate at ~60), every description ≤ 160.
// ============================================================
import {
  PAGE_META, lineFromSlug, therapyFromSlug, therapyDisplay, pairFromSlug,
  compareFromSlug, goalFromSlug, engineLineFromSlug, CAPACITY_ONLY_LINES,
  KIND_IDS, WING_IDS, VERDICT_SLUGS,
} from "@shared/seo";
import { LINE_ENCYCLOPEDIA } from "@/lib/lineEncyclopedia";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { LINE_ROLE } from "@/lib/linePairs";
import { mythById } from "@/lib/mythMuseum";

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
  // /line/:slug pages get generated meta from the encyclopedia.
  if (!meta && path.startsWith("/line/")) {
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
  // /pair/:slug pages — meta composed from both lines' data.
  if (!meta && path.startsWith("/pair/")) {
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
  // /practice/:id pages — meta from the keystone library.
  if (!meta && path.startsWith("/practice/")) {
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
  // /compare/:a--vs--:b — protocol comparison pages.
  if (!meta && path.startsWith("/compare/")) {
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
  // /goal/:keyword — goal-matched practice pages.
  if (!meta && path.startsWith("/goal/")) {
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
  // /build/:line/:therapy — capacity-building entry pages.
  if (!meta && path.startsWith("/build/")) {
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
  // /myth/:id — Myth Museum exhibits.
  if (!meta && path.startsWith("/myth/")) {
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
  // /capacity/:slug — the eight engine-only capacity pages.
  if (!meta && path.startsWith("/capacity/")) {
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
  // /kind/:id — protocol-kind profile pages.
  if (!meta && path.startsWith("/kind/")) {
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
  // /wing/:id — Myth Museum wing pages.
  if (!meta && path.startsWith("/wing/")) {
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
  // /protocol/:slug pages get generated meta from the therapy map.
  if (!meta && path.startsWith("/protocol/")) {
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
