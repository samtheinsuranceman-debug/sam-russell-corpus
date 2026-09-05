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
    short: "IQ graded 4 lines of you. We measure all 32.",
  },
  "/assessment": {
    title: "The 32-Line Intelligence Assessment — AQAL",
    description:
      "Answer 27 spoken questions. Eight AI models score all 32 intelligence lines and return your cognitive map, strengths, blind spots, and next steps.",
    short: "Speak 27 answers. Eight AIs map your entire mind.",
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
      "Explore a complete example AQAL report with 32 scored intelligence lines, a master strength and weakness, prescriptions, and a first-week plan.",
    short: "Hold the map of a whole mind. Yours is next.",
  },
  "/lines": {
    title: "The 32 Lines of Intelligence, Defined — AQAL",
    description:
      "Explore all 32 intelligence lines, from Logical and Spatial to Interoceptive, Adversarial, and Street Smarts, with plain-language definitions and research.",
    short: "School graded 4 intelligences. Meet all 32.",
  },
  "/science": {
    title: "The Science Behind the 32 Lines — AQAL Intelligence",
    description:
      "Why intelligence is not one number: the research on g, the independent lines IQ tests can't see, and how a multi-model AI panel scores spoken evidence.",
    short: "One number can't hold a mind. Here's the proof.",
  },
  "/evidence": {
    title: "The Evidence Library — 10,000+ Sources — AQAL",
    description:
      "The research base behind AQAL's 6,500+ prescriptions: 12,341 source links across therapy, training, and intervention literature, organized by intelligence line.",
    short: "12,341 sources. Zero faith required.",
  },
  "/method": {
    title: "How the Assessment Works — Voice, Panel, Report — AQAL",
    description:
      "Speak 27 answers. Eight AI models from different labs score them independently. Get your 32-line map, rarity, and prescriptions. The full method, step by step.",
    short: "You talk. Eight AI judges score. Your map lands.",
  },
  "/which-archetype": {
    title: "2-Minute Cognitive Archetype Quiz — AQAL",
    description:
      "A free two-minute teaser: answer a handful of questions and see which cognitive archetype you lean toward — then measure the real thing across 32 lines.",
    short: "2 minutes to your cognitive archetype. Start.",
  },
  "/archetypes": {
    title: "The Cognitive Archetypes — AQAL Intelligence",
    description:
      "The recurring 32-line profiles we see — how strengths cluster, what each archetype over-relies on, and where each one predictably crashes.",
    short: "The recurring minds — and where each one crashes.",
  },
  "/about": {
    title: "About AQAL Intelligence — Why We Built This",
    description:
      "The founder's story and the platform's one promise: measure the whole mind honestly — 32 lines, no single number, no claims the data can't defend.",
    short: "Why we built the test school never gave you.",
  },
  "/membership": {
    title: "What Membership Includes — AQAL Intelligence",
    description:
      "Beyond the assessment: goal clocks, monthly protocols, Black Box crash forensics, beliefs work, pulse checks, and a member community built for unusual minds.",
    short: "Goal clocks, crash forensics, and your village.",
  },
  "/help": {
    title: "Help & FAQ — AQAL Intelligence",
    description:
      "Microphone problems, uploads, sign-in, scoring times, founding spots, and privacy — the six most common questions answered, with human support one click away.",
    short: "Stuck? Six instant fixes. Humans one click away.",
  },
  "/corrections": {
    title: "The Corrections Ledger — Where We Were Wrong — AQAL",
    description:
      "Every claim we've corrected, every challenge sustained, every audit still open — published in full. A measurement company that hides corrections asks for faith.",
    short: "We publish every mistake we make. All of them.",
  },
  "/terms": {
    title: "Terms of Service — AQAL Intelligence",
    description:
      "Read AQAL's plain-language terms covering founding access, private messages, data export and deletion, payments, conduct, and the Black Box privacy contract.",
    short: "Free-for-life in writing. Your data, your rules.",
  },
  "/privacy": {
    title: "Privacy Policy — AQAL Intelligence",
    description:
      "What we collect, what we never do (no data sales, no message reading, no ad trackers), the 72-hour audio wipe, and your export and deletion rights.",
    short: "No trackers. No selling you. Audio gone in 72h.",
  },
  "/black-box": {
    title: "The Black Box — Crash Forensics for Your Life — AQAL",
    description:
      "Record a major failure once. The panel extracts your Crash Signature — when X, you do Y, causing Z — and builds practical prevention architecture.",
    short: "Your crashes share a signature. We extract it.",
  },
  "/rankings": {
    title: "Protocol Rankings — All 156 Scored 0–100 — AQAL",
    description:
      "All 156 mapped protocols scored by AQAL's open editorial formula: evidence 40%, durability 20%, breadth 15%, speed 15%, ease 10%. Not customer ratings.",
    short: "156 protocols. One transparent editorial formula.",
  },
  "/hypnosis": {
    title: "Hypnosis Library — 50 Overt Guided Sessions — AQAL",
    description:
      "Fifty overt, voluntary mental-rehearsal and relaxation outlines with every planned suggestion disclosed. Non-medical, no guarantees, reviewed audio pending.",
    short: "50 overt rehearsal outlines. Every theme disclosed.",
  },
  "/archetypes/research": {
    title: "The Science Behind the Archetypes — AQAL",
    description:
      "What archetype profiles really are, the cited research on configurations, isolation, and connection behind all 246 entries — and what we honestly can't claim.",
    short: "246 archetypes. Every one carries its receipts.",
  },
  "/archetypes/blending": {
    title: "Can You Be More Than One Archetype? — AQAL",
    description:
      "One, two, even three archetypes at once: what blending means, what it looks like, how often it happens — and the honest answer about the data we don't have yet.",
    short: "Two archetypes at once? Three? Honest answers.",
  },
  "/archetypes/integrated": {
    title: "The Integrated Archetypes — The Positive Set — AQAL",
    description:
      "The 28 positive archetypes — the Integrated Leader, the Grounded Genius, the Wise Elder — what the research says builds them, and the routes this library maps.",
    short: "28 positive archetypes. The versions worth becoming.",
  },
  "/login": {
    title: "Sign In — AQAL Intelligence",
    description: "Sign in securely to your AQAL member portal to access your 32-line profile, goals, protocols, messages, assessment history, and private Black Box.",
    short: "The control room for your mind. Sign in.",
  },
  "/reset-password": {
    title: "Reset Your Password — AQAL Intelligence",
    description: "Request a secure, single-use password reset link for your AQAL account. The link expires after one hour and does not reveal whether an address is registered.",
    short: "Locked out? One secure link. One hour.",
  },
  "/ecological-interventions": {
    title: "Ecological Interventions — Change the Environment — AQAL",
    description:
      "The intervention class most programs skip: changing your environment instead of your willpower. Research-backed ecological levers mapped to the 32 lines.",
    short: "Stop fighting willpower. Rig your environment.",
  },
  "/meta-systems": {
    title: "Meta-Systems Thinking — AQAL Intelligence",
    description:
      "How the 32 lines interact as one system — feedback loops, cascade paths, and why fixing the weakest line moves outcomes more than sharpening the strongest.",
    short: "32 lines, one machine. Pull the master lever.",
  },
  "/scenario-intelligence": {
    title: "Scenario Intelligence — Decisions Under Pressure — AQAL",
    description:
      "How your intelligence profile behaves in real scenarios — negotiations, crises, opportunities — and where your line pattern predicts pressure failures.",
    short: "Where your mind breaks under pressure — mapped.",
  },
  "/research-library": {
    title: "Research Library — AQAL Intelligence",
    description:
      "Browse the intervention research behind the platform: thousands of clustered sources across therapy, training, and behavior-change literature.",
    short: "Thousands of studies, aimed at your weak line.",
  },
  "/verification": {
    title: "The Verification Ledger — AQAL Intelligence",
    description:
      "How AQAL's numbers get checked: counting audits, citation verification in progress, and the sustain-or-concede record for every challenged claim.",
    short: "Every number we claim, audited in the open.",
  },
  "/pricing-structure": {
    title: "How Pricing Is Structured — AQAL Intelligence",
    description:
      "The full pricing logic: free-for-life founding cohort, standard membership, premium assessments, and what each tier actually includes.",
    short: "What every tier really buys you. No fog.",
  },
  "/blind-side": {
    title: "The Blind-Side Analyzer — AQAL Intelligence",
    description:
      "The lines you can't see are the ones that cost you. Explore how AQAL surfaces the blind spots your strongest lines are hiding.",
    short: "Your strengths are hiding your killers. Look.",
  },
  "/weakness-finder": {
    title: "The Master Weakness Finder — AQAL Intelligence",
    description:
      "One weakness usually gates everything else. How the panel isolates your master weakness across 32 lines — and what the fix pipeline looks like.",
    short: "One weakness gates your whole life. We find it.",
  },
  "/synergy-report": {
    title: "Line Synergies & Power Combinations — AQAL",
    description:
      "Rare line pairings compound: see how power combinations of intelligence lines create capabilities neither line has alone.",
    short: "Your rare pairings compound. See what they unlock.",
  },
  "/mensa": {
    title: "Beyond IQ — For High-IQ Minds — AQAL Intelligence",
    description:
      "You already know your IQ. That's ~4 of 32 lines. Measure the other 28 — the ones that decide whether high g actually converts into outcomes.",
    short: "Your IQ is 4 lines of 32. Measure the rest.",
  },
  "/protocols": {
    title: "Protocol Library — 156 Evidence-Backed Interventions | AQAL",
    description:
      "Every protocol mapped to the intelligence lines it builds — EMDR, MBSR, DBT, ACT, and 152 more — each with the peer-reviewed study behind the mapping.",
    short: "156 proven protocols. One is built for your repair.",
  },
  "/pairs": {
    title: "Power Combinations — 496 Intelligence Line Pairings | AQAL",
    description:
      "Every two-line combination mapped: what each line gives the other, what the multiplication unlocks, and what half a pair quietly costs.",
    short: "496 pairings. One of them is your multiplier.",
  },
  "/myths": {
    title: "The Myth Museum — Therapies That Failed, Sourced — AQAL",
    description:
      "Documented failed, debunked, and overclaimed therapies — each with the claim, the sourced verdict, why people bought it, and what holds up instead.",
    short: "191 therapies that failed — with the receipts.",
  },
  "/why-we-fall": {
    title: "Why We Fall for False Therapies — The Essay — AQAL",
    description:
      "Why America keeps buying therapies that fail their tests: the measured psychology, the cultural amplifiers, and one labeled speculation about the national soul.",
    short: "Why smart Americans keep buying broken cures.",
  },
  "/practices": {
    title: "The 54 Keystone Practices — Evidence-Tiered — AQAL",
    description:
      "Explore 54 daily practices, including sleep protection, implementation intentions, and interoception training, with prescriptions, research, and evidence tiers.",
    short: "54 keystone practices. Small doses, real returns.",
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
import { THERAPY_KIND } from "./therapyKindMap";
import { HYPNOSIS_IDS } from "./hypnosisTopics";

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

// Eleven authored deep pages beneath every protocol. Content is composed from
// the protocol's mapped evidence plus kind-level playbooks, so the sitemap and
// client router share one typed source of truth.
export const PROTOCOL_SUBPAGES = [
  "first-week",
  "evidence",
  "dose",
  "who-its-for",
  "mistakes",
  "results",
  "stack",
  "score",
  "synergy",
  "atrophy",
  "daily-life",
] as const;
export type ProtocolSubpageId = (typeof PROTOCOL_SUBPAGES)[number];

// Deep-page expansion: sub-pages under every major public content family.
export const MYTH_SUBPAGES = ["feels-real", "receipts", "instead", "talk-someone-out"] as const;
export type MythSubpageId = (typeof MYTH_SUBPAGES)[number];
export const PAIR_SUBPAGES = ["collide", "train", "at-work"] as const;
export type PairSubpageId = (typeof PAIR_SUBPAGES)[number];
export const LINE_SUBPAGES = ["at-work", "in-relationships", "history", "raise-it", "self-check", "never-tested"] as const;
export type LineSubpageId = (typeof LINE_SUBPAGES)[number];
export const PRACTICE_SUBPAGES = ["start", "evidence", "mistakes", "pair-with"] as const;
export type PracticeSubpageId = (typeof PRACTICE_SUBPAGES)[number];
export const GOAL_SUBPAGES = ["plan", "mistakes"] as const;
export type GoalSubpageId = (typeof GOAL_SUBPAGES)[number];
export const KIND_SUBPAGES = ["choose", "first-month", "standards"] as const;
export type KindSubpageId = (typeof KIND_SUBPAGES)[number];
export const WING_SUBPAGES = ["spot", "escape"] as const;
export type WingSubpageId = (typeof WING_SUBPAGES)[number];
export const CAPACITY_SUBPAGES = ["signs", "build", "cost"] as const;
export type CapacitySubpageId = (typeof CAPACITY_SUBPAGES)[number];
export const COMPARE_SUBPAGES = ["verdict", "switch"] as const;
export type CompareSubpageId = (typeof COMPARE_SUBPAGES)[number];
export const BUILD_SUBPAGES = ["plan"] as const;
export const ARCH_SUBPAGES = ["verify", "break-out"] as const;
export type ArchSubpageId = (typeof ARCH_SUBPAGES)[number];

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

// The eight engine capacities that have no /line/ display page of their
// own — each gets a /capacity/ landing page instead. Mirrored from the
// engine↔display mapping; the pageShorts test suite fails on drift.
export const CAPACITY_ONLY_LINES: string[] = [
  "Adaptive", "Architectural", "Integrative", "Intuitive",
  "Philosophical", "Reflective", "Resilient", "Tactical",
];

// One ranked page per protocol-kind and intelligence-line combination that
// actually exists in the evidence map. New mappings mint their own page.
export const BEST_COMBOS: { kind: string; line: string }[] = (() => {
  const seen = new Set<string>();
  const out: { kind: string; line: string }[] = [];
  for (const entry of THERAPY_LINE_MAP) {
    const kind = THERAPY_KIND[entry.therapy] ?? "skill";
    const key = `${kind}||${entry.line}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ kind, line: entry.line });
    }
  }
  return out.sort((a, b) => (a.kind + a.line).localeCompare(b.kind + b.line));
})();

export function bestComboFromSlug(kind: string, lineSlugStr: string): { kind: string; line: string } | undefined {
  const line = engineLineFromSlug(lineSlugStr);
  return line ? BEST_COMBOS.find((combo) => combo.kind === kind && combo.line === line) : undefined;
}

// Protocol-kind ids — mirrored from client/src/lib/therapyKinds.ts
// KIND_PROFILES; the pageShorts test suite fails if the two drift.
export const KIND_IDS: string[] = [
  "psychotherapy", "relational", "mindfulness", "somatic", "physical",
  "skill", "psychedelic", "neuromodulation", "lifestyle", "expressive",
  "community",
];

// Myth Museum wing ids — mirrored from client/src/lib/mythWings.ts
// WING_PROFILES; the pageShorts test suite fails if the two drift.
export const WING_IDS: string[] = [
  "heroic-medicine", "miracle-cure", "substitution-harm", "energy-device",
  "purification", "pill-and-powder", "diet-cult", "false-oracle",
  "classroom-ghost", "replication-graveyard", "unlicensed-couch",
  "cosmic-counsel",
];

// Museum verdict slugs — mirrored from mythMuseum.ts MYTH_VERDICT_META.
export const VERDICT_SLUGS: string[] = [
  "debunked", "no-evidence", "harmful", "replication-failed", "overclaimed",
];

export function verdictFromSlug(slug: string): string | undefined {
  const v = VERDICT_SLUGS.find((s) => s === slug);
  return v ? v.replace(/-/g, " ").toUpperCase() : undefined;
}

// Myth Museum exhibit ids — mirrored from client/src/lib/mythMuseum.ts;
// the pageShorts test suite fails if the two drift.
export const MYTH_IDS: string[] = ["phrenology","mesmerism","lobotomy","insulin-coma","orgone","trepanation-revival","facilitated-communication","recovered-memory","conversion-therapy","attachment-holding","cisd","scared-straight","dare-original","boot-camps","primal-scream","dianetics","attack-therapy","past-life-regression","polygraph","graphology","learning-styles","brain-gym","mozart-effect","ten-percent-brain","left-right-brain","subliminal-tapes","speed-reading","sleep-learning","brain-training","growth-mindset-overclaim","power-posing","ego-depletion","mbti-clinical","enneagram-clinical","nlp-claims","homeopathy","bach-flowers","crystal-healing","therapeutic-touch","reiki-distant","magnet-therapy","ear-candling","detox-cleanses","adrenal-fatigue","candida-everything","applied-kinesiology","craniosacral","chiropractic-nonmsk","iridology","reflexology-diagnostic","grounding-claims","binaural-claims","essential-oil-cures","cbd-cure-all","microdosing-overclaim","law-of-attraction","affirmations-backfire","vision-boards","astrology-counseling","numerology","human-design","psychic-mediums","angel-therapy","faith-healing-substitution","intercessory-prayer-rct","vaccines-autism","chelation-autism","mms-bleach","secretin","dolphin-therapy","wellness-mlm","prosperity-gospel-therapy","bloodletting","rotational-chair","radithor","violet-ray","krebiozen","refrigerator-mother","rebirthing","orthomolecular","laetrile","gerson","black-salve","shark-cartilage","essiac","colloidal-silver","ozone-therapy","hbot-autism","stem-cell-tourism","iv-drips","naturopathic-cancer","exorcism-substitution","troubled-teen","breatharianism","sungazing","kambo","bee-venom","rasa-shastra","aristolochia","placenta-encapsulation","vaginal-steaming","jade-eggs","perineum-sunning","urine-therapy","oil-pulling","hulda-clark-zapper","rife-machines","bioresonance","radionics","kirlian-aura","emf-harmonizers","power-balance","copper-bracelets","pemf-consumer","daith-piercing","ionic-footbath","detox-foot-pads","salt-lamps","halotherapy","oxygen-bars","alkaline-water","hydrogen-water","structured-water","solfeggio","chromotherapy","blue-blockers","cryo-chambers","infrared-detox","tdcs-consumer","toning-shoes","kinesio-overclaim","cupping-performance","mouth-taping","polyphasic-sleep","mewing","lymphatic-detox","live-blood-analysis","hair-mineral-analysis","igg-food-tests","mthfr-protocols","dna-diet-tests","microbiome-consumer","telomere-tests","epigenetic-clearing","airborne","prevagen","ginkgo-memory","antioxidant-megadose","multivitamin-prevention","nootropic-stacks","t-boosters","celery-juice","acv-cureall","blood-type-diet","gaps-diet","feingold-cure","gluten-free-everyone","carnivore-cureall","doman-delacato","primitive-reflex","auditory-integration","son-rise","vision-therapy-ld","bates-method","irlen-lenses","dore-program","fast-forword","baby-genius-media","ambidexterity-movement","social-priming","marshmallow-destiny","facial-feedback-pencil","microexpression-detection","forensic-hypnosis","truth-serum","rorschach-overclaim","grit-revolution","ten-thousand-hours","eft-tapping","thought-field-therapy","havening","brainspotting","emotion-code","family-constellations","lgat","holotropic-overclaim","ayahuasca-tourism","equine-breakthrough","indigo-children","biorhythms","full-moon-effect"];

// ── Archetype deep pages: 246 dossiers + verify/break-out subs, plus the
// blend pages — every meaningful pairing (shared high line, or a high/low
// crossover) among the 100 real profiles (kind archetype|integrated).
import { ARCHETYPES } from "./archetypesData";
export const ARCH_IDS: string[] = ARCHETYPES.map((a) => a.id);
export function archById(id: string) {
  return ARCHETYPES.find((a) => a.id === id);
}
// Unique display-shorts for titles/descriptions: word-trim at 24, escalate to
// 30 on collision, fall back to the id — uniqueness is test-enforced.
export const ARCH_ABBR: Record<string, string> = (() => {
  const trim = (n: string, max: number) => (n.length <= max ? n : n.slice(0, max).replace(/\s+\S*$/, "").replace(/[\s,;:(—-]+$/, "").trim());
  const out: Record<string, string> = {};
  const used = new Set<string>();
  for (const a of ARCHETYPES) {
    let c = trim(a.name, 24);
    if (used.has(c)) c = trim(a.name, 30);
    if (used.has(c)) c = a.id;
    used.add(c);
    out[a.id] = c;
  }
  return out;
})();
const BLEND_POOL = ARCHETYPES.filter((a) => a.kind === "archetype" || a.kind === "integrated");
export const ARCH_BLENDS: [string, string][] = (() => {
  const out: [string, string][] = [];
  for (let i = 0; i < BLEND_POOL.length; i++) for (let j = i + 1; j < BLEND_POOL.length; j++) {
    const a = BLEND_POOL[i], b = BLEND_POOL[j];
    const sharedHigh = a.highLines.some((l) => b.highLines.includes(l));
    const cross = a.highLines.some((l) => b.lowLines.includes(l)) || a.lowLines.some((l) => b.highLines.includes(l));
    if (sharedHigh || cross) out.push(a.id < b.id ? [a.id, b.id] : [b.id, a.id]);
  }
  return out.sort((x, y) => (x[0] + x[1]).localeCompare(y[0] + y[1]));
})();
export function archBlendSlug(a: string, b: string): string {
  return a < b ? `${a}--x--${b}` : `${b}--x--${a}`;
}
export function archBlendFromSlug(slug: string): [string, string] | undefined {
  const parts = slug.split("--x--");
  if (parts.length !== 2) return undefined;
  const [a, b] = parts[0] < parts[1] ? [parts[0], parts[1]] : [parts[1], parts[0]];
  return ARCH_BLENDS.find(([x, y]) => x === a && y === b);
}

export const SITEMAP_PATHS = [
  ...Object.keys(PAGE_META),
  ...LINE_NAMES.map((n) => `/line/${lineSlug(n)}`),
  ...THERAPY_NAMES.map((n) => `/protocol/${therapySlug(n)}`),
  ...THERAPY_NAMES.flatMap((n) =>
    PROTOCOL_SUBPAGES.map((subpage) => `/protocol/${therapySlug(n)}/${subpage}`),
  ),
  ...PRACTICE_IDS.map((id) => `/practice/${id}`),
  ...PAIR_SLUGS.map((s) => `/pair/${s}`),
  ...COMPARE_PAIRS.map(([a, b]) => `/compare/${compareSlug(a, b)}`),
  ...COMPARE_PAIRS.flatMap(([a, b]) => COMPARE_SUBPAGES.map((subpage) => `/compare/${compareSlug(a, b)}/${subpage}`)),
  ...GOAL_KEYWORDS.map((k) => `/goal/${goalSlug(k)}`),
  ...LINE_NAMES.map((n) => `/weak/${lineSlug(n)}`),
  ...LINE_NAMES.map((n) => `/gift/${lineSlug(n)}`),
  ...BUILD_ENTRIES.map((e) => `/build/${engineLineSlug(e.line)}/${therapySlug(e.therapy)}`),
  ...BUILD_ENTRIES.map((e) => `/build/${engineLineSlug(e.line)}/${therapySlug(e.therapy)}/plan`),
  ...MYTH_IDS.map((id) => `/myth/${id}`),
  ...CAPACITY_ONLY_LINES.map((l) => `/capacity/${engineLineSlug(l)}`),
  ...KIND_IDS.map((id) => `/kind/${id}`),
  ...WING_IDS.map((id) => `/wing/${id}`),
  ...VERDICT_SLUGS.map((s) => `/verdict/${s}`),
  ...MYTH_IDS.flatMap((id) => MYTH_SUBPAGES.map((subpage) => `/myth/${id}/${subpage}`)),
  ...PAIR_SLUGS.flatMap((pair) => PAIR_SUBPAGES.map((subpage) => `/pair/${pair}/${subpage}`)),
  ...LINE_NAMES.flatMap((name) => LINE_SUBPAGES.map((subpage) => `/line/${lineSlug(name)}/${subpage}`)),
  ...PRACTICE_IDS.flatMap((id) => PRACTICE_SUBPAGES.map((subpage) => `/practice/${id}/${subpage}`)),
  ...GOAL_KEYWORDS.flatMap((keyword) => GOAL_SUBPAGES.map((subpage) => `/goal/${goalSlug(keyword)}/${subpage}`)),
  ...KIND_IDS.flatMap((id) => KIND_SUBPAGES.map((subpage) => `/kind/${id}/${subpage}`)),
  ...WING_IDS.flatMap((id) => WING_SUBPAGES.map((subpage) => `/wing/${id}/${subpage}`)),
  ...CAPACITY_ONLY_LINES.flatMap((line) => CAPACITY_SUBPAGES.map((subpage) => `/capacity/${engineLineSlug(line)}/${subpage}`)),
  ...BEST_COMBOS.map((combo) => `/best/${combo.kind}/${engineLineSlug(combo.line)}`),
  ...HYPNOSIS_IDS.map((id) => `/hypnosis/${id}`),
  ...ARCH_IDS.map((id) => `/archetype/${id}`),
  ...ARCH_IDS.flatMap((id) => ARCH_SUBPAGES.map((s2) => `/archetype/${id}/${s2}`)),
  ...ARCH_BLENDS.map(([a, b]) => `/archetype-blend/${archBlendSlug(a, b)}`),
];

export function canonicalUrl(path: string): string {
  return SITE_ORIGIN + (path === "/" ? "/" : path.replace(/\/$/, ""));
}
