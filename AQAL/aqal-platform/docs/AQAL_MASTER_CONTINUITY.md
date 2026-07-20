# AQAL INTELLIGENCE PLATFORM — MASTER CONTINUITY DOCUMENT
_Single source of truth. Read this first. Last updated at 3,307 clusters / 6,874 sources._

This document exists because the research and the design decisions were previously buried in source
code with no human-readable map. It captures **100% of what the platform is, what has been decided,
what is built, what is not, and what a human/other-AI must still assemble.** If you read only one
file, read this one, then `INSTRUCTIONS_TO_ASSEMBLE.md`, then `RESEARCH_LIBRARY_CATALOG.md`.

---

## 1. WHAT THIS IS (the reframe — current positioning)

This is **not** "how rare and valuable is your brain." That framing is dead. The platform's promise is
**directionality, predictability of outcome, protection, efficiency, and engineering.**

The homepage headline (live in `client/src/pages/Home.tsx`) now reads:

> **"How predictable, protected, and consistent is your mind at getting you what you want?"**
> _You've probably never measured it — almost no one has. We do. Then we re-engineer the mind to close
> the gap between where you stand today and the outcomes you're chasing._
> **Measure the mind. Map the system. Engineer the outcome.**

Supporting language decided over the week (use this vocabulary everywhere):
- "How **systemized, productive, predictable, valuable, protected, and engineered** is the aggregate of
  your mind toward all of your outcomes, goals, dreams, and desires?"
- "**Engineering outcomes. Re-engineering the mind.**" — surgical procedures on the aggregate mind
  structure that produce the greatest magnitude of desired outcomes with the **least energy, time,
  effort, and failure rate.**
- The differentiator is operating at a **meta-cognitive level** on the very systems that serve you or
  get in your way: **engineer the strengths, dismantle the weaknesses — after they've been identified.**
  No other platform does this.

## 2. THE MEASUREMENT MODEL

**32 intelligence lines** (the axes): Financial, Humor, Seductive, Parental, Community, Logical,
Mathematical, Spatial, Pattern-Recognition, Linguistic, Musical, Bodily, Naturalist, Aesthetic,
Interpersonal, Intrapersonal, Emotional, Social-Perceptual, Moral, Existential, Meta-Cognitive,
Volitional, Adversarial, Interoceptive, Strategic, Systemic, Entrepreneurial, Creative, Rhetorical,
Leadership, Mechanical, Street-Smarts.

**Three research lenses** (each cluster in the library carries exactly one):
| Lens | Field in data | Gauge | Meaning |
|---|---|---|---|
| **Practice** | `impact` | magnitude 1–5, latency, durability, effort | what *strengthens* a line (scaffolding) |
| **Weakness** | `weakness` | threat 1–10, weakLines[], degree, onset, reversibility | what *collapses* a goal (the patch targets) |
| **Cost** | `harm` | severity 1–5, onset, reversibility | what's *at stake* if a weakness goes unaddressed |

**Rarity — two numbers, both shown** (`client/src/pages/Results.tsx`):
1. **Cohort / generational rarity** — "1 in X **among {generation}**" — ranked within the person's own
   generation/age cohort. This is the headline number ("Rare for your age is the only rare that counts").
2. **Population rarity** — "1 in Y across the whole population."
   Copy: _"A model-based estimate, not a measured percentile. Ranked within your generation, then the
   population — developmental lines are age-adjusted; IQ-style lines are already age-normed."_

### ✅ RESOLVED — Generational rarity is now a one-line toggle (default ON)
You chose "keep but make it a toggle." Implemented: a single feature flag
**`client/src/config/features.ts → SHOW_GENERATIONAL_RARITY`** (currently `true`) gates it everywhere:
- `Home.tsx` — renders/hides the `GenerationSection`.
- `Results.tsx` — shows the two-number reveal (cohort + population) vs. population-only.
- `IntelligenceProfile.tsx` — shows/suppresses the cohort `generationalNote` on matches.

To turn generational rarity OFF site-wide, set the flag to `false` — no other change, no data change.
Typecheck + `vite build` verified clean with the flag in place. (If you later want the middle path,
you can also keep cohort scoring but relabel it away from the word "rarity" toward the
predictability/engineering framing — that's a copy edit inside `GenerationSection` + `RarityCountUp`.)

## 3. WHAT IS BUILT (in the codebase, in this zip)

- **Voice-first 24-question assessment** (`Assessment.tsx`) — resequenced for rapport → momentum →
  over-disclosure; per-question richness feedback; live radar reveal flywheel.
- **Results & Intelligence Profile** — 32-line radar, strengths, growth edges, two-number rarity.
- **Private consumer portal** (`Portal.tsx`) — original assessment + declared outcomes + doing-vs-not.
- **E-signed commitment letter** (`CommitmentPanel`, `shared/commitment.ts`, DB table + routers) —
  5 audio-only (never typed) self-generated reasons; accountability framing.
- **Research Library** (`ResearchLibrary.tsx` + `researchLibraryData.ts`) — 3,307 clusters, 6,874
  sources, three lenses, keyword search (KEYWORD_SYNONYMS/TOPICS/expandQuery), live leaderboards
  (Top-50 by leverage, weakness by threat, cost by cost-score), code-split data bundle.
- **Homepage** with the reframed copy + Generational Measurement & Matching section.
- **Supporting pages**: Pricing/PricingStructure, Science, Evidence, About, Privacy, Terms, Leaderboard,
  Challenge, SynergyReport (pair collision + prescriptions), MensaLanding, Login/Portal/Admin.

## 4. FEATURE STATUS (built vs. remaining)

1. ✅ **Goals / outcomes questions — BUILT & wired.** Two voice questions are live in the assessment
   (`Assessment.tsx` QUESTIONS_SOURCE ids 33 "Your Top Five" + 34 "How You'll Know", sequenced at
   display positions 12–13). Q33 now asks for the **top 5 goals across 5/10/20/30/40-year horizons plus
   the value behind each**; Q34 is the NLP evidence procedure (_"how do you know you've arrived — what do
   you see, hear, feel, who are you next to, walk me through an ordinary Tuesday"_). The spoken answers
   are transcribed and flow to the coach. **Hardened this session:** the server previously matched these
   answers by a bare positional literal (`questionIndex === 12 || 13`); that is now centralized in
   `shared/goalsQuestions.ts` (`extractGoalsText` / `GOALS_QUESTION_INDICES`), with a dev-time guard in
   `Assessment.tsx` that errors if the display order ever drifts out of sync.
2. ✅ **AI coaching on results — BUILT.** `server/coaching.ts` → `generateOutcomeReport(scores, goals)`
   produces an Outcome-Engineering report: it names the **controlling weakness** (the single line whose
   failure most predictably derails the stated goals), gives each threat a **directional derailment %**
   (framed as how predictably it creates friction against *the goals the person named*), an **uplift %**
   if addressed, a research-grounded prescribed **move**, and the matching **Research Library topic**;
   plus keystone strengths, a keystone move, an honest confidence-tiered Vision, and the knowing–doing
   Gap. LLM-driven with a strict JSON schema and a deterministic mock fallback when no model is
   configured. Rendered on `Results.tsx` (keystone move, per-threat derailment bars, the Gap). Honesty:
   every number is directional, never a guarantee. **Sharpened this session:** the controlling weakness
   is now explicitly named in both the mock and the LLM prompt.
3. ✅ **30 / 60 / 90-day audio behavioral tracker — BUILT (core loop).** In the Portal → Tools tab
   (`BehavioralTrackerCard`): pick a 30/60/90-day cycle, **download the journal template** (generated
   from the person's own prescribed practices + stated goals via `tracker.doc`), dictate daily into any
   AI, then **paste the finished journal and upload** it (`tracker.submitJournal`). The server
   (`server/trackerAnalysis.ts` → `analyzeJournal`) returns a **self-reported, directional** re-estimate:
   a summary, per-line adjustments (↑/→/↓), an adherence read, and a **refreshed hypothetical Vision** —
   stored per cycle in the new `trackerCycles` table (migration `drizzle/0014_shallow_nextwave.sql`),
   with cycle history shown in the portal. LLM path + deterministic mock; every number tagged
   self-reported/unverified. _Still pending:_ (a) the recurring **re-engagement email cadence** (~2×/mo)
   to pull people back each cycle — wire into `server/reminders`/cron; (b) **voice STT** so the journal
   can be spoken end-to-end in-app rather than pasted (see INSTRUCTIONS §4.3).
4. **Generational-band data source** — the cohort percentiles are currently model-based estimates; a real
   age/generation normative table would replace the estimate. (See INSTRUCTIONS doc.)
5. **Meta-level "engineering strengths / dismantling weaknesses" explainer pages** — the research
   principles (strengths scaffolding, weakness patching, weakest-link/O-Ring, keystone effects) exist as
   clusters (sections "0" framework) but deserve dedicated marketing pages in the reframed voice.

## 5. THE RESEARCH LIBRARY — SCALE, HONESTY, MOAT

- **3,307 clusters / 6,874 sources.** Lens split: Practice 1,227 · Weakness 1,145 · Cost 874 · framework 61.
  Evidence tags: Strong 930 · Moderate 1,545 · Mixed 456 · Emerging 376.
- **Weakness lines are equalized with the practice/strength lines** — the deliberate "same measure, same
  weight" goal. Weakness-shielding is treated as co-equal with strength-maximizing (weakest-link logic).
- **Honesty is the moat.** Every source WebSearch-verified; **zero fabricated citations.** Pseudoscience
  and failed replications are *included at their true (magnitude-1) rating with a blunt callout* — e.g.
  Wansink plate/bowl retractions, ego-depletion/willpower nulls, echo-chamber & filter-bubble
  overstatement, dot-probe reliability problems, stereotype-threat fragility, Reiki/craniosacral/
  kinesiotape/EFT near-placebo, "medical error = 3rd cause of death" dispute, 10,000-steps myth,
  ME/CFS PACE controversy. This is a feature, not a gap — it is what makes the library trustworthy.
- **Moat / anti-copy**: the corpus currently ships in the client bundle. Before launch, move it behind an
  **authenticated, rate-limited, paginated API** so members can search but not bulk-export. Real moat =
  curation + scoring + freshness, not DRM. (Full note in `HANDOFF_TO_MANUS.md`.)
- **Catalog**: `docs/RESEARCH_LIBRARY_CATALOG.md` (readable) and `docs/research_library_catalog.csv`
  (one row per cluster: id, section, lens, title, evidence, score, source-count, subtitle).

## 6. FILE MAP (where everything lives)

```
aqal-platform/
├─ docs/                              ← NEW documentation layer (read these)
│   ├─ AQAL_MASTER_CONTINUITY.md      ← this file
│   ├─ INSTRUCTIONS_TO_ASSEMBLE.md    ← build/deploy + manual-assembly checklist
│   ├─ RESEARCH_LIBRARY_CATALOG.md    ← readable catalog of all 3,307 clusters
│   └─ research_library_catalog.csv   ← same, spreadsheet form
├─ HANDOFF_TO_MANUS.md                ← deploy handoff (incl. moat/anti-copy)
├─ LAUNCH_KIT.md, RESEARCH_PIPELINE.md, MECHANICS_REVIEW.md, todo.md
├─ client/src/pages/
│   ├─ Home.tsx                       ← reframed hero + GenerationSection
│   ├─ Assessment.tsx                 ← 24-question voice assessment
│   ├─ Results.tsx / IntelligenceProfile.tsx / Profile.tsx  ← rarity (two-number) + radar
│   ├─ Portal.tsx                     ← private portal + commitment
│   ├─ ResearchLibrary.tsx            ← library UI, search, leaderboards, section maps
│   └─ researchLibraryData.ts         ← 3,307 clusters (source of truth for the library)
├─ shared/commitment.ts               ← commitment-letter questions + markdown builder
└─ server/…                           ← tRPC routers, DB, reminders (see INSTRUCTIONS)
```

## 7. GIT / WHERE THE WORK LIVES
- Branch: **`claude/claude-md-docs-0qgcvw`** (all work committed + pushed here).
- The library grew this run from 2,491 → 3,307 clusters across ~24 verified rounds, each typechecked,
  `vite build`-clean, committed, and pushed.
- `AQAL/aqal-platform.zip` is the source snapshot (rebuilt to include this `docs/` layer).
