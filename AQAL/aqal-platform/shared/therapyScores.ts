// ============================================================
// THERAPY SCORES — the 0–100 composite ranking engine.
// OUR FORMULA, stated openly (and printed on every scorecard):
//   40% evidence strength  (mapped role quality + kind's evidence base)
//   20% durability          (how long gains hold, kind-typical)
//   15% breadth             (how many intelligence lines it lifts)
//   15% speed               (time to first measurable effect)
//   10% ease of use         (inverse of burden — DELIBERATELY down-
//                            weighted to 10%: hard protocols that work
//                            outrank easy ones that don't)
// Every component is computed from the mapped data (roles, lines,
// kind profiles) — nothing hand-tuned per therapy. Gain language is
// expressed as literature-typical effect-size bands translated into
// percentile shifts (a d of 0.5 moves the average completer from the
// 50th to ≈69th percentile of non-participants; d of 0.8 to ≈79th) —
// labeled estimates, never personal guarantees.
// ============================================================
import { THERAPY_LINE_MAP } from "./therapyLineMap";
import { THERAPY_KIND } from "./therapyKindMap";
import { THERAPY_NAMES } from "./seo";

export type ScoreComponents = {
  evidence: number; durability: number; breadth: number; speed: number; ease: number;
};
export type TherapyScore = {
  therapy: string;
  total: number;            // 0–100, one decimal
  rank: number;             // 1 = best
  components: ScoreComponents;
  primaryLines: string[];   // targeted weaknesses (PRIMARY mappings)
  secondaryLines: string[]; // other lines it also lifts
  gainBand: string;         // percentile-shift language, labeled estimate
  knownSince: string;       // era of the protocol / its family
  schedule: KindSchedule;
  atrophy: AtrophyProfile;
};

export type KindSchedule = {
  minutes: string;   // per session
  perWeek: string;   // sessions per week
  course: string;    // course length
  window: string;    // what a 30–60 day window honestly buys
};

export type AtrophyProfile = {
  curve: string;       // what happens when you stop
  maintenance: string; // the dose that holds the gain
  resharpen: string;   // how fast it comes back on restart
};

// ── Kind-level tables (literature-typical characterizations) ────────────────
const KIND_EVIDENCE: Record<string, number> = {
  psychotherapy: 12, relational: 10, physical: 10, mindfulness: 8, lifestyle: 6,
  expressive: 6, skill: 5, somatic: 5, community: 5, neuromodulation: 5, psychedelic: 0,
};
const KIND_DURABILITY: Record<string, number> = {
  skill: 85, psychotherapy: 85, community: 85, relational: 80, expressive: 75,
  psychedelic: 70, lifestyle: 60, mindfulness: 55, somatic: 55, physical: 50, neuromodulation: 45,
};
const KIND_SPEED: Record<string, number> = {
  neuromodulation: 80, physical: 70, lifestyle: 70, somatic: 65, expressive: 65,
  mindfulness: 60, psychedelic: 60, psychotherapy: 55, skill: 55, relational: 50, community: 45,
};
const KIND_EASE: Record<string, number> = {
  lifestyle: 85, expressive: 80, mindfulness: 70, somatic: 70, physical: 60,
  skill: 60, community: 55, psychotherapy: 45, relational: 35, neuromodulation: 30, psychedelic: 25,
};

export const KIND_SCHEDULES: Record<string, KindSchedule> = {
  psychotherapy: { minutes: "50", perWeek: "1 session + daily homework (15–30 min)", course: "8–20 weeks",
    window: "A 30–60 day window covers the assessment phase and the first skills block — early markers, not the full effect." },
  relational: { minutes: "60–90", perWeek: "1 joint session + between-session exercises", course: "8–25 weeks",
    window: "In 30–60 days most couples have the cycle mapped and the first new moves installed — the pattern rebuild takes the full course." },
  mindfulness: { minutes: "10–45", perWeek: "daily (7×)", course: "8-week program, then maintenance",
    window: "A 30–60 day window is most of the standardized course — exactly where the outcome literature measures its effects." },
  somatic: { minutes: "10–30", perWeek: "2–5", course: "6–12 weeks",
    window: "30–60 days sits squarely in this kind's effect window: baseline shift typically shows inside it." },
  physical: { minutes: "20–60", perWeek: "3–5", course: "6–12 weeks to measurable cognitive effects",
    window: "30–60 days reaches the front edge of the measured cognitive window; mood effects arrive much earlier." },
  skill: { minutes: "20–45", perWeek: "3–5 practice blocks", course: "4–12 weeks to meaningful gains",
    window: "30–60 days of edge-practice is the literature's window for meaningful movement in most trained skills." },
  psychedelic: { minutes: "session-based (hours)", perWeek: "1–2 medicine sessions inside a multi-week protocol", course: "~8 weeks incl. preparation & integration",
    window: "A 30–60 day window covers a full trial-style protocol — screening and integration included, clinical settings only." },
  neuromodulation: { minutes: "20–40", perWeek: "5 (daily weekday sessions)", course: "4–6 weeks",
    window: "30–60 days covers a complete clinical course — this kind is built to fit exactly that window." },
  lifestyle: { minutes: "minutes (behavior-embedded)", perWeek: "daily (7×)", course: "2–8 weeks to measurable change",
    window: "30–60 days is more than enough to stabilize one variable and read the downstream effects." },
  expressive: { minutes: "15–20", perWeek: "3–4", course: "1–4 weeks per round, repeatable",
    window: "30–60 days allows two full rounds with reflection between — beyond what most of the trials themselves ran." },
  community: { minutes: "60–120", perWeek: "1–2 gatherings", course: "ongoing; belonging effects at 2–3 months",
    window: "30–60 days gets you past the awkward stage into early belonging — the compounding starts after." },
};

export const KIND_ATROPHY: Record<string, AtrophyProfile> = {
  psychotherapy: {
    curve: "Skill-based therapy is the durability champion: follow-up studies show gains holding — often growing — after termination, because the machinery keeps running in daily life.",
    maintenance: "Occasional booster sessions (quarterly-ish) extend gains further; the real maintenance is continuing to use the skills on live problems.",
    resharpen: "Fast — a single booster typically reactivates dormant skills; full relapse usually signals new material, not lost skill." },
  relational: {
    curve: "The rebuilt pattern is self-maintaining while both parties keep running it; under sustained stress the old cycle can reassert over months.",
    maintenance: "A monthly 'state of the union' conversation (most methods prescribe one) plus returning to the exercises at the first relapse.",
    resharpen: "Quick — couples who return for 1–3 booster sessions typically recover the pattern much faster than the original course." },
  mindfulness: {
    curve: "Practice-dependent: attention-regulation gains track continued practice and fade over months without it — like fitness for the attention system.",
    maintenance: "~10+ minutes daily holds the effect essentially indefinitely; even 3–4 days weekly retains most of it.",
    resharpen: "Days to weeks — trained practitioners re-stabilize far faster than beginners establish; the first thousand reps never fully vanish." },
  somatic: {
    curve: "The regulation skill persists; the TONE it built (calmer baseline, faster recovery) fades over months without practice.",
    maintenance: "2–3 short sessions weekly holds the baseline; deploying the technique during real stressors counts as practice.",
    resharpen: "Fast — the interoceptive channel stays trained; a week or two of resumed practice typically restores the tone." },
  physical: {
    curve: "The bluntest curve in the library: detraining effects are measurable within 2–4 weeks of stopping, and most fitness-linked cognitive gains track current condition.",
    maintenance: "A maintenance dose far below the building dose — roughly 1–2 quality sessions weekly — holds most of the ground.",
    resharpen: "Faster than first-time building ('muscle memory' is real at both the muscular and habit level): weeks, not months." },
  skill: {
    curve: "Among the slowest decay in the library: trained skills behave like riding a bicycle — components rust, the architecture stays.",
    maintenance: "Occasional deliberate sessions (even monthly) keep components sharp; real-world use of the skill counts fully.",
    resharpen: "The signature: re-sharpening is dramatically faster than original acquisition — days of focused practice restore months of it." },
  psychedelic: {
    curve: "Trial follow-ups show effects persisting 6–12 months per protocol; without integration work, the insight fades faster than the memory of it.",
    maintenance: "Not re-dosing — integration: keeping the behavioral changes the sessions opened. Boosters are a clinical, protocol-level decision.",
    resharpen: "Not applicable in the home-practice sense — repeat courses are screened clinical decisions, not maintenance doses." },
  neuromodulation: {
    curve: "Response typically decays over months without maintenance in a meaningful share of responders; durability varies widely by person and protocol.",
    maintenance: "Scheduled maintenance sessions (clinic-prescribed cadence) — plus whatever therapy/behavior change the course enabled, which carries durability of its own.",
    resharpen: "Re-treatment of prior responders typically works again — response history is the best predictor in the literature." },
  lifestyle: {
    curve: "Benefits track the behavior almost one-to-one — but a stabilized pattern runs nearly free on environment design, so decay usually starts with disruption (travel, chaos), not fatigue.",
    maintenance: "Keep the environment doing the work: the anchors, defaults, and physical setup ARE the maintenance dose.",
    resharpen: "The reinstall skill is the durable part: people who've stabilized a variable once typically re-stabilize it in days after a disruption." },
  expressive: {
    curve: "Processed material stays processed — the charge reduction on written-through events holds well; the expressive SKILL dulls only slowly.",
    maintenance: "None required for past rounds; new stressors call for new sessions, as-needed.",
    resharpen: "Immediate — the protocol re-deploys at full strength whenever life supplies new material." },
  community: {
    curve: "Belonging decays with absence — months of missed gatherings quietly demote membership back toward acquaintance; the network effects fade last.",
    maintenance: "Showing up remains the entire price: one gathering weekly-ish holds full membership.",
    resharpen: "Faster than joining cold — returning members are re-absorbed in weeks; the awkward stage doesn't fully repeat." },
};

// Era of the protocol family, with specific overrides where the origin is
// well-established public record.
const KIND_ERA: Record<string, string> = {
  psychotherapy: "The protocol-therapy wave of the 1960s–1980s; manualized and trial-tested since.",
  relational: "The evidence-based couples methods emerged through the 1980s–1990s.",
  mindfulness: "Formalized clinically in 1979 (MBSR); the underlying practices are millennia old.",
  somatic: "Nervous-system regulation protocols matured through the 1990s–2000s; interoception research boomed in the 2010s.",
  physical: "Exercise is ancient; the modern exercise-cognition literature solidified from the 1990s onward.",
  skill: "The deliberate-practice research program dates to the early 1990s; the craft tradition is as old as crafts.",
  psychedelic: "First research wave 1950s–60s; the modern clinical-trial era restarted in 2006.",
  neuromodulation: "TMS demonstrated in 1985; first major regulatory clearance era from 2008.",
  lifestyle: "Sleep, light, and behavior-design literatures matured from the 1980s through the 2000s.",
  expressive: "The expressive-writing paradigm dates to 1986 (Pennebaker); expressive arts therapies are older.",
  community: "Mutual-aid formats date to the 1930s; the belonging-and-health literature spans a century.",
};
const ERA_OVERRIDES: Record<string, string> = {
  "EMDR": "Introduced 1987–1989 (Shapiro); trial-tested across three decades since.",
  "MBSR (Mindfulness-Based Stress Reduction)": "Founded 1979 (Kabat-Zinn, UMass) — the anchor protocol of clinical mindfulness.",
  "MBCT (Mindfulness-Based Cognitive Therapy)": "Developed late 1990s–2000 for depression-relapse prevention.",
  "DBT (Linehan)": "Published 1993 (Linehan) — the first therapy shown effective for its original population in RCTs.",
  "Prolonged Exposure Therapy": "Developed 1980s–1990s (Foa), from an exposure tradition dating to the 1950s.",
  "Cognitive Processing Therapy (CPT)": "Introduced 1988 (Resick) for trauma processing.",
  "Gottman Method Couples Therapy": "Built on observational marriage research begun 1972; method formalized in the 1990s.",
  "Internal Family Systems (IFS)": "Developed 1980s–1990s (Schwartz).",
  "Transcranial Magnetic Stimulation (TMS)": "Demonstrated 1985; FDA-cleared for depression 2008.",
  "Psilocybin-Assisted Therapy": "First wave 1950s–60s; modern controlled-trial era from 2006 (Johns Hopkins).",
  "Ketamine-Assisted Therapy": "Rapid-antidepressant findings from 2000; clinical protocols through the 2010s.",
  "Implementation Intentions (Gollwitzer)": "Introduced 1999 (Gollwitzer); 94-study meta-analysis by 2006.",
  "Cold Exposure (Wim Hof)": "Cold-water immersion is old; the modern protocolized wave and its trials date to the 2010s.",
};

function gainBandFor(kind: string, hasPrimary: boolean): string {
  const strongKinds = ["psychotherapy", "physical", "mindfulness", "skill", "relational"];
  if (hasPrimary && strongKinds.includes(kind)) {
    return "Literature-typical band for this kind and role: moderate-to-large effects (d ≈ 0.5–0.8) — the average completer lands around the 69th–79th percentile of non-participants on the targeted measures. Labeled estimate; individual spread is real.";
  }
  if (hasPrimary) {
    return "Literature-typical band: small-to-moderate through moderate effects (d ≈ 0.3–0.6) — the average completer lands around the 62nd–73rd percentile of non-participants on targeted measures, with wider person-to-person variance in this kind. Labeled estimate.";
  }
  return "Mapped as a supporting (secondary/adjunct) effect: small-to-moderate (d ≈ 0.2–0.5) — roughly the 58th–69th percentile shift, best captured when stacked with a primary protocol. Labeled estimate.";
}

const W = { evidence: 0.40, durability: 0.20, breadth: 0.15, speed: 0.15, ease: 0.10 };

export const THERAPY_SCORES: TherapyScore[] = (() => {
  const out: Omit<TherapyScore, "rank">[] = [];
  for (const t of THERAPY_NAMES) {
    const entries = THERAPY_LINE_MAP.filter((e) => e.therapy === t);
    if (entries.length === 0) continue;
    const kind = THERAPY_KIND[t] ?? "skill";
    const primaries = entries.filter((e) => e.role === "PRIMARY").map((e) => e.line);
    const secondaries = entries.filter((e) => e.role !== "PRIMARY").map((e) => e.line);
    const bestRole = primaries.length ? 80 : entries.some((e) => e.role === "SECONDARY") ? 60 : 45;
    const evidence = Math.min(100, bestRole + (KIND_EVIDENCE[kind] ?? 5) + Math.min(Math.max(primaries.length - 1, 0), 2) * 3);
    const breadth = entries.length >= 4 ? 88 : entries.length === 3 ? 78 : entries.length === 2 ? 65 : 50;
    const c: ScoreComponents = {
      evidence,
      durability: KIND_DURABILITY[kind] ?? 60,
      breadth,
      speed: KIND_SPEED[kind] ?? 55,
      ease: KIND_EASE[kind] ?? 55,
    };
    const total = Math.round(
      (c.evidence * W.evidence + c.durability * W.durability + c.breadth * W.breadth +
       c.speed * W.speed + c.ease * W.ease) * 10,
    ) / 10;
    out.push({
      therapy: t, total, components: c,
      primaryLines: primaries, secondaryLines: secondaries,
      gainBand: gainBandFor(kind, primaries.length > 0),
      knownSince: ERA_OVERRIDES[t] ?? KIND_ERA[kind] ?? "",
      schedule: KIND_SCHEDULES[kind] ?? KIND_SCHEDULES.skill,
      atrophy: KIND_ATROPHY[kind] ?? KIND_ATROPHY.skill,
    });
  }
  out.sort((a, b) => b.total - a.total || a.therapy.localeCompare(b.therapy));
  return out.map((s, i) => ({ ...s, rank: i + 1 }));
})();

export function scoreFor(therapy: string): TherapyScore | undefined {
  return THERAPY_SCORES.find((s) => s.therapy === therapy);
}
