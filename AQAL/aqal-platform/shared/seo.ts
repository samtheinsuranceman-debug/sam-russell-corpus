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
      "27 spoken questions. Eight AI models score all 32 intelligence lines and return your full cognitive map. Free for the first 10,000 founding members.",
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
      "An example AQAL report: 32 scored intelligence lines, master strength and weakness, prescriptions, and the first-week plan. Fictional member, real format.",
    short: "Hold the map of a whole mind. Yours is next.",
  },
  "/lines": {
    title: "The 32 Lines of Intelligence, Defined — AQAL",
    description:
      "Every intelligence line we measure — from Logical and Spatial to Interoceptive, Adversarial, and Street Smarts — defined with the research behind each.",
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
      "Beyond the assessment: goal clocks, protocols, the Black Box crash forensics, beliefs work, pulse checks, and a village of members who think like you don't.",
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
      "Plain-language terms: founding members free for life in writing, private messages never read, data export and deletion rights, and the Black Box contract.",
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
      "Record your biggest failures once, honestly. The panel extracts your Crash Signature — when X, you do Y, which causes Z — and builds your prevention plan.",
    short: "Your crashes share a signature. We extract it.",
  },
  "/login": {
    title: "Sign In — AQAL Intelligence",
    description: "Sign in to your AQAL member portal — your 32-line profile, goal clocks, protocols, and Black Box. Founding members use the password chosen at claim.",
    short: "The control room for your mind. Sign in.",
  },
  "/reset-password": {
    title: "Reset Your Password — AQAL Intelligence",
    description: "Locked out? Request a secure reset link for your AQAL account — it lands in your verified email and stays valid for one hour. Check spam, then support.",
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
    title: "Protocol Library — 156 Evidence-Backed Interventions — AQAL",
    description:
      "Every protocol mapped to the intelligence lines it builds — EMDR, MBSR, DBT, ACT, and 152 more — each with the peer-reviewed study behind the mapping.",
    short: "156 proven protocols. One is built for your repair.",
  },
  "/pairs": {
    title: "Power Combinations — 496 Intelligence Line Pairings — AQAL",
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
      "Sleep protection, implementation intentions, interoception training, and 51 more daily practices — each with its prescription and honest evidence tier.",
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

// Seven deep sub-pages under every protocol — /protocol/:slug/:sub —
// each composed from the same authored data as the parent page
// (therapyLineMap evidence, kind profiles, kind-level meaning), so
// 156 × 7 = 1,092 pages that stay honest by construction.
export const PROTOCOL_SUBPAGES = [
  "first-week", "evidence", "dose", "who-its-for", "mistakes", "results", "stack",
] as const;
export type ProtocolSubpageId = (typeof PROTOCOL_SUBPAGES)[number];

// ── The deep-page expansion (Aug 2026): sub-pages under every major
// family, each composed from the same authored data as its parent and
// carrying its own unique <60-char short + ≤60-char title (test-enforced).
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

// "Best <kind> protocols for the <line> capacity" — one page per (kind, line)
// combination that actually exists in the evidence map. Computed, so a new
// mapping automatically mints its page.
import { THERAPY_KIND } from "./therapyKindMap";
export const BEST_COMBOS: { kind: string; line: string }[] = (() => {
  const seen = new Set<string>();
  const out: { kind: string; line: string }[] = [];
  for (const e of THERAPY_LINE_MAP) {
    const kind = THERAPY_KIND[e.therapy] ?? "skill";
    const key = `${kind}||${e.line}`;
    if (!seen.has(key)) { seen.add(key); out.push({ kind, line: e.line }); }
  }
  return out.sort((a, b) => (a.kind + a.line).localeCompare(b.kind + b.line));
})();
export function bestComboFromSlug(kind: string, lineSlugStr: string): { kind: string; line: string } | undefined {
  const line = engineLineFromSlug(lineSlugStr);
  if (!line) return undefined;
  return BEST_COMBOS.find((c) => c.kind === kind && c.line === line);
}

export const SITEMAP_PATHS = [
  ...Object.keys(PAGE_META),
  ...LINE_NAMES.map((n) => `/line/${lineSlug(n)}`),
  ...THERAPY_NAMES.map((n) => `/protocol/${therapySlug(n)}`),
  ...THERAPY_NAMES.flatMap((n) => PROTOCOL_SUBPAGES.map((s) => `/protocol/${therapySlug(n)}/${s}`)),
  ...PRACTICE_IDS.map((id) => `/practice/${id}`),
  ...PAIR_SLUGS.map((s) => `/pair/${s}`),
  ...COMPARE_PAIRS.map(([a, b]) => `/compare/${compareSlug(a, b)}`),
  ...GOAL_KEYWORDS.map((k) => `/goal/${goalSlug(k)}`),
  ...LINE_NAMES.map((n) => `/weak/${lineSlug(n)}`),
  ...LINE_NAMES.map((n) => `/gift/${lineSlug(n)}`),
  ...BUILD_ENTRIES.map((e) => `/build/${engineLineSlug(e.line)}/${therapySlug(e.therapy)}`),
  ...MYTH_IDS.map((id) => `/myth/${id}`),
  ...CAPACITY_ONLY_LINES.map((l) => `/capacity/${engineLineSlug(l)}`),
  ...KIND_IDS.map((id) => `/kind/${id}`),
  ...WING_IDS.map((id) => `/wing/${id}`),
  ...VERDICT_SLUGS.map((s) => `/verdict/${s}`),
  ...MYTH_IDS.flatMap((id) => MYTH_SUBPAGES.map((s) => `/myth/${id}/${s}`)),
  ...PAIR_SLUGS.flatMap((p) => PAIR_SUBPAGES.map((s) => `/pair/${p}/${s}`)),
  ...LINE_NAMES.flatMap((n) => LINE_SUBPAGES.map((s) => `/line/${lineSlug(n)}/${s}`)),
  ...PRACTICE_IDS.flatMap((id) => PRACTICE_SUBPAGES.map((s) => `/practice/${id}/${s}`)),
  ...GOAL_KEYWORDS.flatMap((k) => GOAL_SUBPAGES.map((s) => `/goal/${goalSlug(k)}/${s}`)),
  ...KIND_IDS.flatMap((id) => KIND_SUBPAGES.map((s) => `/kind/${id}/${s}`)),
  ...WING_IDS.flatMap((id) => WING_SUBPAGES.map((s) => `/wing/${id}/${s}`)),
  ...CAPACITY_ONLY_LINES.flatMap((l) => CAPACITY_SUBPAGES.map((s) => `/capacity/${engineLineSlug(l)}/${s}`)),
  ...BEST_COMBOS.map((c) => `/best/${c.kind}/${engineLineSlug(c.line)}`),
];

export function canonicalUrl(path: string): string {
  return SITE_ORIGIN + (path === "/" ? "/" : path.replace(/\/$/, ""));
}
