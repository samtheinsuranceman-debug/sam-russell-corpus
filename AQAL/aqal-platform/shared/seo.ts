// ============================================================
// SEO — the single source of truth for page metadata.
// Drives: per-route <title>/<meta description>/<link canonical>
// (client RouteMeta), /sitemap.xml and /robots.txt (server),
// and the noindex list for private surfaces.
// One table; edit here and every consumer stays in sync.
// ============================================================

export const SITE_ORIGIN = "https://joinaqal.com";
export const SITE_NAME = "AQAL Intelligence";

export type PageMeta = {
  title: string;        // unique per page, ~50-60 chars, keyword-natural
  description: string;  // unique per page, ~140-160 chars
};

// PUBLIC, indexable pages. Order matters only for sitemap priority
// (first = highest). Keywords are worked in naturally — never stuffed.
export const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "AQAL Intelligence — Measure All 32 Lines of Your Mind",
    description:
      "IQ tests measure ~4 intelligence lines. AQAL measures 32 — spoken answers, scored by a panel of 8 AI labs, mapped into strengths, blind spots, and a plan.",
  },
  "/assessment": {
    title: "The 32-Line Intelligence Assessment — AQAL",
    description:
      "27 spoken questions. A panel of eight AI models scores all 32 intelligence lines and returns your full cognitive map. Free for the first 10,000 founding members.",
  },
  "/pricing": {
    title: "Pricing & Founding Membership — AQAL Intelligence",
    description:
      "The first 10,000 founding members get the 32-line assessment and membership free for life. After that: $449/month or $4,499/year with a free trial.",
  },
  "/sample-report": {
    title: "Sample Intelligence Report — See the Deliverable — AQAL",
    description:
      "A complete example AQAL report: 32 scored intelligence lines, master strength and weakness, prescriptions, and the first-week plan. Fictional member, real format.",
  },
  "/lines": {
    title: "The 32 Lines of Intelligence, Defined — AQAL",
    description:
      "Every intelligence line we measure — from Logical and Spatial to Interoceptive, Adversarial, and Street Smarts — defined in plain language with the research behind each.",
  },
  "/science": {
    title: "The Science Behind the 32 Lines — AQAL Intelligence",
    description:
      "Why intelligence is not one number: the research on g, the independent lines IQ tests can't see, and how a multi-model AI panel scores spoken evidence.",
  },
  "/evidence": {
    title: "The Evidence Library — 10,000+ Sources — AQAL",
    description:
      "The research base behind AQAL's 6,500+ prescriptions: 12,341 source links across therapy, training, and intervention literature, organized by intelligence line.",
  },
  "/method": {
    title: "How the Assessment Works — Voice, Panel, Report — AQAL",
    description:
      "Speak 27 answers. Eight AI models from different labs score them independently. Get your 32-line map, rarity, and prescriptions. The full method, step by step.",
  },
  "/which-archetype": {
    title: "2-Minute Cognitive Archetype Quiz — AQAL",
    description:
      "A free two-minute teaser: answer a handful of questions and see which cognitive archetype you lean toward — then measure the real thing across 32 lines.",
  },
  "/archetypes": {
    title: "The Cognitive Archetypes — AQAL Intelligence",
    description:
      "The recurring 32-line profiles we see — how strengths cluster, what each archetype over-relies on, and where each one predictably crashes.",
  },
  "/about": {
    title: "About AQAL Intelligence — Why We Built This",
    description:
      "The founder's story and the platform's one promise: measure the whole mind honestly — 32 lines, no single number, no claims the data can't defend.",
  },
  "/membership": {
    title: "What Membership Includes — AQAL Intelligence",
    description:
      "Beyond the assessment: goal clocks, monthly protocols, the Black Box crash forensics, beliefs work, pulse checks, and a village of members who think like you don't.",
  },
  "/help": {
    title: "Help & FAQ — AQAL Intelligence",
    description:
      "Microphone problems, uploads, sign-in, scoring times, founding spots, and privacy — the six most common questions answered, with human support one click away.",
  },
  "/corrections": {
    title: "The Corrections Ledger — Where We Were Wrong — AQAL",
    description:
      "Every claim we've corrected, every challenge sustained, every audit still open — published in full. A measurement company that hides corrections asks for faith.",
  },
  "/terms": {
    title: "Terms of Service — AQAL Intelligence",
    description:
      "The plain-language terms: founding members free for life in writing, private messages never read, data export and deletion rights, and the Black Box privacy contract.",
  },
  "/privacy": {
    title: "Privacy Policy — AQAL Intelligence",
    description:
      "What we collect, what we never do (no data sales, no message reading, no ad trackers), the 72-hour audio wipe, and your export and deletion rights.",
  },
  "/black-box": {
    title: "The Black Box — Crash Forensics for Your Life — AQAL",
    description:
      "Record your biggest failures once, honestly. The panel extracts your Crash Signature — when X, you do Y, which causes Z — and builds the prevention architecture.",
  },
  "/login": {
    title: "Sign In — AQAL Intelligence",
    description: "Sign in to your AQAL member portal — your 32-line profile, goals, protocols, and Black Box.",
  },
  "/reset-password": {
    title: "Reset Your Password — AQAL Intelligence",
    description: "Request a secure one-hour reset link for your AQAL account.",
  },
  "/ecological-interventions": {
    title: "Ecological Interventions — Change the Environment — AQAL",
    description:
      "The intervention class most programs skip: changing your environment instead of your willpower. Research-backed ecological levers mapped to the 32 lines.",
  },
  "/meta-systems": {
    title: "Meta-Systems Thinking — AQAL Intelligence",
    description:
      "How the 32 lines interact as one system — feedback loops, cascade paths, and why fixing the weakest line moves outcomes more than sharpening the strongest.",
  },
  "/scenario-intelligence": {
    title: "Scenario Intelligence — Decisions Under Pressure — AQAL",
    description:
      "How your intelligence profile behaves in real scenarios — negotiations, crises, opportunities — and where your line pattern predicts pressure failures.",
  },
  "/research-library": {
    title: "Research Library — AQAL Intelligence",
    description:
      "Browse the intervention research behind the platform: thousands of clustered sources across therapy, training, and behavior-change literature.",
  },
  "/verification": {
    title: "The Verification Ledger — AQAL Intelligence",
    description:
      "How AQAL's numbers get checked: counting audits, citation verification in progress, and the sustain-or-concede record for every challenged claim.",
  },
  "/pricing-structure": {
    title: "How Pricing Is Structured — AQAL Intelligence",
    description:
      "The full pricing logic: free-for-life founding cohort, standard membership, premium assessments, and what each tier actually includes.",
  },
  "/blind-side": {
    title: "The Blind-Side Analyzer — AQAL Intelligence",
    description:
      "The lines you can't see are the ones that cost you. Explore how AQAL surfaces the blind spots your strongest lines are hiding.",
  },
  "/weakness-finder": {
    title: "The Master Weakness Finder — AQAL Intelligence",
    description:
      "One weakness usually gates everything else. How the panel isolates your master weakness across 32 lines — and what the fix pipeline looks like.",
  },
  "/synergy-report": {
    title: "Line Synergies & Power Combinations — AQAL",
    description:
      "Rare line pairings compound: see how power combinations of intelligence lines create capabilities neither line has alone.",
  },
  "/mensa": {
    title: "Beyond IQ — For High-IQ Minds — AQAL Intelligence",
    description:
      "You already know your IQ. That's ~4 of 32 lines. Measure the other 28 — the ones that decide whether high g actually converts into outcomes.",
  },
  "/protocols": {
    title: "The Protocol Library — 92 Evidence-Backed Interventions — AQAL",
    description:
      "Every protocol mapped to the intelligence lines it builds — EMDR, MBSR, DBT, IFS, and 88 more — each with the peer-reviewed study behind the mapping.",
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

export const SITEMAP_PATHS = [
  ...Object.keys(PAGE_META),
  ...LINE_NAMES.map((n) => `/line/${lineSlug(n)}`),
  ...THERAPY_NAMES.map((n) => `/protocol/${therapySlug(n)}`),
];

export function canonicalUrl(path: string): string {
  return SITE_ORIGIN + (path === "/" ? "/" : path.replace(/\/$/, ""));
}
