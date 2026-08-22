// ============================================================
// SEO — the single source of truth for page metadata.
// Drives: per-route <title>/<meta description>/<link canonical>
// (client RouteMeta), /sitemap.xml and /robots.txt (server),
// and the noindex list for private surfaces.
// One table; edit here and every consumer stays in sync.
// ============================================================

export const SITE_ORIGIN = "https://www.joinaqal.com";
export const SITE_NAME = "AQAL Intelligence";

export type PageMeta = {
  title: string;        // unique per page, ~50-60 chars, keyword-natural
  description: string;  // unique per page, ~140-160 chars
  short: string;        // unique per page, ALWAYS < 60 chars — what it is + why it matters to you
};

// PUBLIC, indexable pages. Order matters only for sitemap priority
// (first = highest). Keywords are worked in naturally — never stuffed.
export const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "AQAL Intelligence — Measure All 32 Lines of Your Mind",
    description:
      "IQ tests measure ~4 intelligence lines. AQAL measures 32 — spoken answers, scored by a panel of 8 AI labs, mapped into strengths, blind spots, and a plan.",
    short: "32 lines of intelligence, measured. IQ saw only 4.",
  },
  "/assessment": {
    title: "The 32-Line Intelligence Assessment — AQAL",
    description:
      "27 spoken questions. A panel of eight AI models scores all 32 intelligence lines and returns your full cognitive map. Free for the first 10,000 founding members.",
    short: "27 spoken answers. 8 AI labs. Your whole mind, mapped.",
  },
  "/pricing": {
    title: "Pricing & Founding Membership — AQAL Intelligence",
    description:
      "The first 10,000 founding members get the 32-line assessment and membership free for life. After that: $449/month or $4,499/year with a free trial.",
    short: "First 10,000 founders: free for life. In writing.",
  },
  "/sample-report": {
    title: "Sample Intelligence Report — See the Deliverable — AQAL",
    description:
      "A complete example AQAL report: 32 scored intelligence lines, master strength and weakness, prescriptions, and the first-week plan. Fictional member, real format.",
    short: "See a complete report before you claim your spot.",
  },
  "/lines": {
    title: "The 32 Lines of Intelligence, Defined — AQAL",
    description:
      "Every intelligence line we measure — from Logical and Spatial to Interoceptive, Adversarial, and Street Smarts — defined in plain language with the research behind each.",
    short: "All 32 intelligence lines, defined. Which are yours?",
  },
  "/science": {
    title: "The Science Behind the 32 Lines — AQAL Intelligence",
    description:
      "Why intelligence is not one number: the research on g, the independent lines IQ tests can't see, and how a multi-model AI panel scores spoken evidence.",
    short: "Why one number can't hold a mind. The research.",
  },
  "/evidence": {
    title: "The Evidence Library — 10,000+ Sources — AQAL",
    description:
      "The research base behind AQAL's 6,500+ prescriptions: 12,341 source links across therapy, training, and intervention literature, organized by intelligence line.",
    short: "12,341 source links behind our prescriptions.",
  },
  "/method": {
    title: "How the Assessment Works — Voice, Panel, Report — AQAL",
    description:
      "Speak 27 answers. Eight AI models from different labs score them independently. Get your 32-line map, rarity, and prescriptions. The full method, step by step.",
    short: "Speak. Get scored by 8 AIs. Get your map.",
  },
  "/which-archetype": {
    title: "2-Minute Cognitive Archetype Quiz — AQAL",
    description:
      "A free two-minute teaser: answer a handful of questions and see which cognitive archetype you lean toward — then measure the real thing across 32 lines.",
    short: "2-minute quiz: find your cognitive archetype.",
  },
  "/archetypes": {
    title: "The Cognitive Archetypes — AQAL Intelligence",
    description:
      "The recurring 32-line profiles we see — how strengths cluster, what each archetype over-relies on, and where each one predictably crashes.",
    short: "The recurring profiles — and where each crashes.",
  },
  "/about": {
    title: "About AQAL Intelligence — Why We Built This",
    description:
      "The founder's story and the platform's one promise: measure the whole mind honestly — 32 lines, no single number, no claims the data can't defend.",
    short: "Who built this, and the promise behind it.",
  },
  "/membership": {
    title: "What Membership Includes — AQAL Intelligence",
    description:
      "Beyond the assessment: goal clocks, monthly protocols, the Black Box crash forensics, beliefs work, pulse checks, and a village of members who think like you don't.",
    short: "Goal clocks, protocols, the Black Box. What you get.",
  },
  "/help": {
    title: "Help & FAQ — AQAL Intelligence",
    description:
      "Microphone problems, uploads, sign-in, scoring times, founding spots, and privacy — the six most common questions answered, with human support one click away.",
    short: "Six common problems, solved. Humans right behind.",
  },
  "/corrections": {
    title: "The Corrections Ledger — Where We Were Wrong — AQAL",
    description:
      "Every claim we've corrected, every challenge sustained, every audit still open — published in full. A measurement company that hides corrections asks for faith.",
    short: "Every claim we corrected, in public.",
  },
  "/terms": {
    title: "Terms of Service — AQAL Intelligence",
    description:
      "The plain-language terms: founding members free for life in writing, private messages never read, data export and deletion rights, and the Black Box privacy contract.",
    short: "Free-for-life in writing. Your data, your rights.",
  },
  "/privacy": {
    title: "Privacy Policy — AQAL Intelligence",
    description:
      "What we collect, what we never do (no data sales, no message reading, no ad trackers), the 72-hour audio wipe, and your export and deletion rights.",
    short: "No trackers. No data sales. 72-hour audio wipe.",
  },
  "/black-box": {
    title: "The Black Box — Crash Forensics for Your Life — AQAL",
    description:
      "Record your biggest failures once, honestly. The panel extracts your Crash Signature — when X, you do Y, which causes Z — and builds the prevention architecture.",
    short: "Record your crashes. Get your Crash Signature.",
  },
  "/login": {
    title: "Sign In — AQAL Intelligence",
    description: "Sign in to your AQAL member portal — your 32-line profile, goals, protocols, and Black Box.",
    short: "Sign in: profile, goals, protocols, Black Box.",
  },
  "/reset-password": {
    title: "Reset Your Password — AQAL Intelligence",
    description: "Request a secure one-hour reset link for your AQAL account.",
    short: "Locked out? A one-hour secure reset link.",
  },
  "/ecological-interventions": {
    title: "Ecological Interventions — Change the Environment — AQAL",
    description:
      "The intervention class most programs skip: changing your environment instead of your willpower. Research-backed ecological levers mapped to the 32 lines.",
    short: "Change the environment, not your willpower.",
  },
  "/meta-systems": {
    title: "Meta-Systems Thinking — AQAL Intelligence",
    description:
      "How the 32 lines interact as one system — feedback loops, cascade paths, and why fixing the weakest line moves outcomes more than sharpening the strongest.",
    short: "Your 32 lines as one system — loops and all.",
  },
  "/scenario-intelligence": {
    title: "Scenario Intelligence — Decisions Under Pressure — AQAL",
    description:
      "How your intelligence profile behaves in real scenarios — negotiations, crises, opportunities — and where your line pattern predicts pressure failures.",
    short: "How your mind behaves under real pressure.",
  },
  "/research-library": {
    title: "Research Library — AQAL Intelligence",
    description:
      "Browse the intervention research behind the platform: thousands of clustered sources across therapy, training, and behavior-change literature.",
    short: "Thousands of sources, organized by line.",
  },
  "/verification": {
    title: "The Verification Ledger — AQAL Intelligence",
    description:
      "How AQAL's numbers get checked: counting audits, citation verification in progress, and the sustain-or-concede record for every challenged claim.",
    short: "How our numbers get checked, in the open.",
  },
  "/pricing-structure": {
    title: "How Pricing Is Structured — AQAL Intelligence",
    description:
      "The full pricing logic: free-for-life founding cohort, standard membership, premium assessments, and what each tier actually includes.",
    short: "Every tier explained, free cohort to premium.",
  },
  "/blind-side": {
    title: "The Blind-Side Analyzer — AQAL Intelligence",
    description:
      "The lines you can't see are the ones that cost you. Explore how AQAL surfaces the blind spots your strongest lines are hiding.",
    short: "The lines you can't see cost you the most.",
  },
  "/weakness-finder": {
    title: "The Master Weakness Finder — AQAL Intelligence",
    description:
      "One weakness usually gates everything else. How the panel isolates your master weakness across 32 lines — and what the fix pipeline looks like.",
    short: "One weakness gates the rest. We find it.",
  },
  "/synergy-report": {
    title: "Line Synergies & Power Combinations — AQAL",
    description:
      "Rare line pairings compound: see how power combinations of intelligence lines create capabilities neither line has alone.",
    short: "Rare pairings compound. See what yours unlock.",
  },
  "/mensa": {
    title: "Beyond IQ — For High-IQ Minds — AQAL Intelligence",
    description:
      "You already know your IQ. That's ~4 of 32 lines. Measure the other 28 — the ones that decide whether high g actually converts into outcomes.",
    short: "IQ is 4 lines of 32. Measure the other 28.",
  },
  "/protocols": {
    title: "The Protocol Library — 92 Evidence-Backed Interventions — AQAL",
    description:
      "Every protocol mapped to the intelligence lines it builds — EMDR, MBSR, DBT, IFS, and 88 more — each with the peer-reviewed study behind the mapping.",
    short: "92 protocols mapped to the lines they build.",
  },
  "/pairs": {
    title: "Power Combinations — All 496 Intelligence Line Pairings — AQAL",
    description:
      "Every two-line combination mapped: what each line gives the other, what the multiplication unlocks, and what half a pair quietly costs.",
    short: "All 496 pairings: what multiplies, what it costs.",
  },
  "/practices": {
    title: "The 54 Keystone Practices — Evidence-Tiered — AQAL",
    description:
      "Sleep protection, implementation intentions, interoception training, and 51 more daily practices — each with its prescription, research basis, and honest evidence tier.",
    short: "54 daily practices with honest evidence tiers.",
  },
};

// Everything a crawler should stay out of: member surfaces, admin, and
// utility routes. Served in robots.txt AND stamped noindex by RouteMeta.
export const NOINDEX_PATHS: string[] = [
  "/portal", "/admin", "/profile", "/results", "/coaching", "/goals",
  "/beliefs", "/matches", "/messages", "/launch-check", "/runbook",
  "/verify-email", "/payment-success", "/payment-cancel", "/welcome-back",
  "/calibration", "/intelligence-profile", "/nlp-report", "/commitment",
  "/platinum", "/video-assessment", "/influencer", "/leaderboard",
  "/signin", "/ui-preview", "/challenge", "/404",
];

// The 32 homepage line names — each gets its own indexable page at
// /line/<slug>. Kept here (shared) so the server sitemap and the client
// router agree without importing client code.
export const LINE_NAMES: string[] = [
  "Logical", "Mathematical", "Spatial", "Linguistic", "Musical",
  "Bodily-Kinesthetic", "Naturalist", "Interpersonal", "Intrapersonal",
  "Existential", "Moral", "Aesthetic", "Emotional", "Meta-Cognitive",
  "Volitional", "Adversarial", "Interoceptive", "Strategic", "Systemic",
  "Entrepreneurial", "Creative", "Rhetorical", "Leadership", "Mechanical",
  "Pattern-Recognition", "Social-Perceptual", "Financial", "Humor",
  "Parenting", "Seduction", "Community-Founding", "Street Smarts",
];

export function lineSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function lineFromSlug(slug: string): string | undefined {
  return LINE_NAMES.find((n) => lineSlug(n) === slug);
}

// Protocol pages — one per distinct mapped therapy. The display name keeps
// author/parenthetical attributions; the slug drops them ("EMDR", not
// "EMDR (Shapiro)"). Names come from the therapy map so the sitemap can
// never drift from the actual library.
import { THERAPY_LINE_MAP } from "./therapyLineMap";

export function therapyDisplay(name: string): string {
  return name.replace(/\s*™\s*/g, "").trim();
}

export function therapySlug(name: string): string {
  const base = therapyDisplay(name).split(" (")[0];
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const THERAPY_NAMES: string[] = Array.from(new Set(THERAPY_LINE_MAP.map((t) => t.therapy))).sort();

export function therapyFromSlug(slug: string): string | undefined {
  return THERAPY_NAMES.find((n) => therapySlug(n) === slug);
}

// Line-pair pages — one per unordered pair of lines, canonical order =
// LINE_NAMES index order. C(32,2) = 496 pages at /pair/<a>--<b>.
export function pairSlug(a: string, b: string): string {
  const ia = LINE_NAMES.indexOf(a), ib = LINE_NAMES.indexOf(b);
  const [first, second] = ia <= ib ? [a, b] : [b, a];
  return `${lineSlug(first)}--${lineSlug(second)}`;
}

export const PAIR_SLUGS: string[] = (() => {
  const out: string[] = [];
  for (let i = 0; i < LINE_NAMES.length; i++)
    for (let j = i + 1; j < LINE_NAMES.length; j++)
      out.push(pairSlug(LINE_NAMES[i], LINE_NAMES[j]));
  return out;
})();

export function pairFromSlug(slug: string): [string, string] | undefined {
  const parts = slug.split("--");
  if (parts.length !== 2) return undefined;
  const a = lineFromSlug(parts[0]);
  const b = lineFromSlug(parts[1]);
  if (!a || !b || a === b) return undefined;
  return LINE_NAMES.indexOf(a) <= LINE_NAMES.indexOf(b) ? [a, b] : [b, a];
}

// Keystone-practice pages — one per practice in the shared library.
import { KEYSTONE_PRACTICES } from "./keystonePractices";

export const PRACTICE_IDS: string[] = KEYSTONE_PRACTICES.map((p) => p.id);

// ── Wave three: comparisons, goals, weak/gift, and build pages ──────────────
import { KEYSTONE_PRACTICES as KP } from "./keystonePractices";

// Protocol comparisons: every pair of protocols sharing at least one line
// where AT LEAST ONE of them is mapped PRIMARY — "the direct road vs the
// supporting road" is a real, honest choice. Canonical slug order:
// alphabetical by therapy slug.
export const COMPARE_PAIRS: [string, string][] = (() => {
  const byLine: Record<string, { t: string; r: string }[]> = {};
  for (const e of THERAPY_LINE_MAP) (byLine[e.line] ??= []).push({ t: e.therapy, r: e.role });
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const line of Object.keys(byLine)) {
    const es = byLine[line];
    for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
      if (es[i].t === es[j].t) continue;
      if (es[i].r !== "PRIMARY" && es[j].r !== "PRIMARY") continue;
      const [a, b] = therapySlug(es[i].t) < therapySlug(es[j].t) ? [es[i].t, es[j].t] : [es[j].t, es[i].t];
      const key = therapySlug(a) + "||" + therapySlug(b);
      if (!seen.has(key)) { seen.add(key); out.push([a, b]); }
    }
  }
  return out;
})();

export function compareSlug(a: string, b: string): string {
  const [x, y] = therapySlug(a) < therapySlug(b) ? [a, b] : [b, a];
  return `${therapySlug(x)}--vs--${therapySlug(y)}`;
}

export function compareFromSlug(slug: string): [string, string] | undefined {
  const parts = slug.split("--vs--");
  if (parts.length !== 2) return undefined;
  const a = therapyFromSlug(parts[0]), b = therapyFromSlug(parts[1]);
  if (!a || !b || a === b) return undefined;
  return COMPARE_PAIRS.find(([x, y]) => compareSlug(x, y) === compareSlug(a, b)) ? (therapySlug(a) < therapySlug(b) ? [a, b] : [b, a]) : undefined;
}

// Goal pages: keystone goalKeywords carried by at least two practices.
export const GOAL_KEYWORDS: string[] = (() => {
  const counts: Record<string, number> = {};
  for (const p of KP) for (const k of (p.goalKeywords ?? [])) counts[k] = (counts[k] ?? 0) + 1;
  return Object.keys(counts).filter((k) => counts[k] >= 2).sort();
})();

export function goalSlug(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function goalFromSlug(slug: string): string | undefined {
  return GOAL_KEYWORDS.find((k) => goalSlug(k) === slug);
}

// Build pages: one per (line, therapy) mapping entry — 156, engine-line slugs.
export function engineLineSlug(line: string): string {
  return line.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const BUILD_ENTRIES: { line: string; therapy: string }[] =
  THERAPY_LINE_MAP.map((e) => ({ line: e.line, therapy: e.therapy }));

export const ENGINE_LINES: string[] = Array.from(new Set(THERAPY_LINE_MAP.map((e) => e.line))).sort();

export function engineLineFromSlug(slug: string): string | undefined {
  return ENGINE_LINES.find((l) => engineLineSlug(l) === slug);
}

export const SITEMAP_PATHS = [
  ...Object.keys(PAGE_META),
  ...LINE_NAMES.map((n) => `/line/${lineSlug(n)}`),
  ...THERAPY_NAMES.map((n) => `/protocol/${therapySlug(n)}`),
  ...PRACTICE_IDS.map((id) => `/practice/${id}`),
  ...PAIR_SLUGS.map((s) => `/pair/${s}`),
  ...COMPARE_PAIRS.map(([a, b]) => `/compare/${compareSlug(a, b)}`),
  ...GOAL_KEYWORDS.map((k) => `/goal/${goalSlug(k)}`),
  ...LINE_NAMES.map((n) => `/weak/${lineSlug(n)}`),
  ...LINE_NAMES.map((n) => `/gift/${lineSlug(n)}`),
  ...BUILD_ENTRIES.map((e) => `/build/${engineLineSlug(e.line)}/${therapySlug(e.therapy)}`),
];

export function canonicalUrl(path: string): string {
  return SITE_ORIGIN + (path === "/" ? "/" : path.replace(/\/$/, ""));
}
