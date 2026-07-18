# HANDOFF TO MANUS — Build & Verify Checklist

This is the running list of things Claude designed but **could not finish or verify**
from its environment (no live API keys, no browser, no deploy). Manus: please build
the "PENDING BUILD" items and run the "VERIFY LIVE" checks after deploy. Preserve the
**honesty constraints** at the bottom — they are the product's core moat.

Last updated by Claude: this build.

---

## ✅ ALREADY BUILT & TESTED (context — do not rebuild)
- Multi-AI consensus scoring (up to 8 models), agreement→confidence, tier-scaled panel.
- Free tier (email + `Welcome1` passcode) on BOTH the home page (`#claim`) and `/login`,
  with the `FREE_ASSESSMENT_CAP` counter (default 10,000). Founders granted full experience.
- Effective Performance Potential, named bottleneck mechanism, cohort rarity.
- Citation cross-examination (Perplexity + adversarial review + DOI resolution).
- Research Library sections 0–21 (interoception, exercise, sleep, breathwork, nature,
  thermal, psychedelics, nonverbal decoding, couples/parenting, knowing-doing gap).
- Outcome coach: threats, keystone move, enablers, **The Vision** + confidence-tiered
  projections + **The Gap** (knowing-doing), keystone-practice prescriptions.
- Downloadable **30-day behavioral tracker** (from the report's "The Gap" block).
- Verification Ledger, testimonials capture (at report peak), Stripe pricing tiers.
- **Private consumer portal** (`/portal`): Overview, Your Profile, Commitment, Network,
  Research Library, Tools, Settings. Now surfaces the person's **declared outcomes**
  (goals) and a **doing vs not-doing** snapshot (strengths vs growth edges).
- **Personal Commitment Agreement** (`/commitment` + Portal "Commitment" tab):
  - 8 hard questions answered **by voice only** (mic → browser SpeechRecognition;
    server-STT fallback for non-Chrome via `commitment.transcribe`). Never typed.
  - Spoken answers listed back **bullet by bullet** as a revisitable reference.
  - E-sign (typed name = signature; reasons must be spoken) → downloadable
    `My_Commitment_Agreement.md`.
  - **Append-only / supersede model:** a signed letter is NEVER edited or deleted.
    A person can *Renew* it (re-stamp the date) or *Write a new letter* that
    supersedes it — the old one moves, untouched, into a read-only **archive**
    (`commitment.history`). `supersededAt` marks non-current letters; reminders +
    declared-outcomes always follow the newest signed letter. `version` counts up.
  - Daily accountability opt-in (off by default, explicit consent for texts):
    one **Y/N** message at **~8 PM the person's local time** (browser IANA timezone
    captured on opt-in; falls back to Eastern). Email + SMS seams, both mock-safe.
  - Data model: `commitments` table (schema.ts). Server: `commitment.*` and
    `reminders.sendDaily` routers. SMS seam: `server/platform/sms.ts` (Twilio).
  - Unit-tested: `server/scoring/commitment.test.ts` (12 tests, incl. timezone targeting).

---

## 🔨 PENDING BUILD — the tracker loop's back half (the subscription engine)
Highest priority. This turns the one-time assessment into a monthly, sticky product.

1. **Journal upload endpoint + portal UI.**
   - Add a "Upload your 30-day journal" control in the portal (reuse the evidence-upload
     pattern in `server/routers.ts` → `evidence.upload` and `client/src/pages/Portal.tsx`).
   - Accept the filled `AQAL_30-Day_Tracker.md` (or pasted text).

2. **Self-reported re-assessment.**
   - New server function (mirror `server/coaching.ts`): take the journal text + current
     scores, produce updated scores + a short "what moved" summary.
   - **CRITICAL HONESTY:** tag the update `self-reported / unverified` — NOT a verified
     re-measurement. Do not let it raise a line into a "measured percentile" tier. Store a
     new snapshot; keep history (this is the longitudinal data moat).

3. **New Vision off the updated profile.**
   - Re-run `generateOutcomeReport` on the updated scores so the user sees their movement
     and a fresh confidence-tiered projection ("here's your trajectory now").

4. **Monthly email cadence (2 reminders/month).**
   - Use `server/platform/email.ts` (Resend seam). Mid-cycle nudge ("keep dictating") +
     end-of-cycle prompt ("upload your journal"). Needs a scheduler/cron on the host.
   - Cadence decision (Claude's rec): **daily dictation, monthly upload/re-measurement.**

5. **Second testimonial trigger.**
   - Fire the testimonial capture again AFTER a positive re-measurement ("your scores moved
     — tell your story"). This is the gold, evidence-based testimonial. Keep consent-gated.

6. **Daily reminder cron (host) — wire `reminders.sendDaily`.**
   - The endpoint is built and time-aware: it only messages a person when it's ~8 PM in
     THEIR timezone. So the host scheduler must call it **hourly** (e.g. `0 * * * *`),
     not once a day. Auth it with the `CRON_SECRET` env var: `POST reminders.sendDaily
     { "secret": "<CRON_SECRET>" }`. (Admins can also trigger it from a session.)
   - Add **once-per-day idempotency** per user (the endpoint does not yet dedupe if the
     cron double-fires within the 8 PM hour). Simplest: record a `last_sent_date` per
     commitment and skip if already sent today.

7. **Inbound Y/N reply handling (Twilio webhook).**
   - Outbound daily texts/emails are built. The inbound **Y/N reply** capture is NOT —
     it needs a public webhook (Twilio → your server) that logs the completion against
     the user's tracker for that day, and honors **STOP** to set `reminderChannel="none"`.
   - Store each Y/N as a daily completion so the 30-day tracker + re-assessment can use it.

8. **DB migration.** Run `pnpm db:push` (or generate+migrate) so the new `commitments`
   table and the `goals` passthrough exist in the live DB before this ships.

---

## 🔍 VERIFY LIVE (needs real keys / a browser — Claude could not run these)
- [ ] **Coach "vision" narrative** with a real LLM key — run an assessment with a marriage
      or parenting goal; confirm the AI-written vision is moving and names the Rogge method.
      (Deterministic projections + The Gap are guaranteed; the LLM prose is not yet seen.)
- [ ] **AI Panel Health** (`/admin` → Business Health) — confirm each funded provider is
      green; Claude especially (Anthropic isn't natively OpenAI-shaped — may need a base_url
      or model fix, or route via OpenRouter).
- [ ] **Perplexity live research** — click "Pull live citations" on a report; confirm real
      papers come back and the DOI-verified / AI-reviewed badges behave.
- [ ] **Browser transcription** (Grok-only path) — do one voice assessment in Chrome; confirm
      the spoken transcript reaches the report.
- [ ] **Founder photo** on `/about` — confirm `https://<site>/founder-sam-russell.jpg` loads.
- [ ] **Home hero + `#claim` section on MOBILE** — eyeball the new outcome-led hero and the
      email/passcode claim card for wrapping/spacing.
- [ ] **30-day tracker download** — click it on the report; confirm the .md downloads and
      lists the user's prescribed practices.
- [ ] **Commitment voice flow in Chrome** — open `/commitment`, sign in, speak an answer to
      each question; confirm the browser transcript fills the bullets, signing unlocks only
      when all 8 are answered, and `My_Commitment_Agreement.md` downloads with the words.
- [ ] **Commitment on non-Chrome (Safari/Firefox)** — confirm the server-STT fallback
      (`commitment.transcribe`) works when `OPENAI_API_KEY` is set (else it honestly tells
      the user to use Chrome — never fabricates words).
- [ ] **Daily text at 8 PM local** — set `TWILIO_*`, opt a test user into texts with a real
      timezone, and confirm the hourly cron only fires that user at their local 8 PM.
- [ ] **E-sign legal review** — the agreement is explicitly "not a legal document," but have
      counsel confirm the SMS consent language (A2P 10DLC / TCPA) before mass texting.
- [ ] **Supersede + archive (needs a DB)** — sign a letter, then "Write a new letter" and sign
      it; confirm the first becomes read-only in the archive (never edited), the newest is the
      current one, and reminders follow the newest. `signCommitment` supersedes prior signed
      rows and carries reminder prefs forward — verify against the live MySQL (couldn't here).

---

## 📚 LIBRARY EXPANSION (done this build) + VAULT/DRIP GATING (proposed)
- **Done:** Research Library now spans **82 sections in the practices index**
  (~550 verified sources in `PRACTICE_EVIDENCE`, plus the 32-line Volumes I/II).
  Two expansion waves: first 20 (fasting, light/circadian, VO₂max, gut–brain,
  nutrition, music, bilingualism, expressive writing, gratitude, awe, purpose,
  volunteering, reading, deliberate practice, cognitive reserve, the honest
  frontier, micro-saving, order, grooming, digital minimalism); then 40 more
  (grip strength, protein, creatine, HIIT, glucose/post-meal walks, fiber,
  ultra-processed, vitamin D, hearing, oral health, air quality, vision, blue
  space, pets, caffeine, alcohol, dance, tai chi, walking/steps, sit-less,
  singing, sexual health, flow, massage, mindfulness, loving-kindness,
  self-compassion, reappraisal, forgiveness, optimism, savoring, nature dose,
  goal-setting, habits, index investing, autonomy, time affluence, sleep
  regularity, laughter, learning-by-teaching). Every source is a real, named
  study with a Scholar link + honest evidence tier + caveat callout (null RCTs,
  failed replications, observational limits stated). Keep expanding toward ~1,000.
- **Wave 3 (done):** +59 more sections (now **141 sections, ~702 sources**): evidence-based
  therapies (EMDR, hypnosis, CBT, behavioral activation, ACT, exposure, DBT, MI,
  psychodynamic/IPT, group therapy, Gestalt/empty-chair, EFT); mind & self-regulation
  techniques (**NLP flagged NOT empirically supported** — 3 honest clusters — plus
  self-affirmation, self-talk, visualization, WOOP, placebo, biofeedback, relaxation);
  youth/family/development (teen work + the >20 hr harm threshold, chores incl. the
  Harvard-grant misattribution, paper-routes honest gap, early earnings, continuing ed,
  apprenticeship, youth mentoring, extracurriculars, dialogic reading, parenting-for-
  development, child independent mobility, free/risky play, youth team sports, golf);
  social & community (marriage, religious attendance, rec sports, couples' self-expansion
  activities, double dates, clubs/bingo, kindness, mentoring, befriending, book clubs,
  intergenerational, social prescribing); environment & everyday (houseplants, gardening,
  **the pet rock reframed honestly as "talking it out" / self-distanced self-talk**,
  cooking, handwriting, action video games, **brain-training's honest debunk**, chess,
  napping, weighted blankets). Grouped under new super-headers.
- **Wave 4 (done):** +78 practice clusters (sections 199–275), assembled from 8 verified
  research agents: physiology & dating (freediving, backwards walking, vestibular spinning,
  speed/online dating, approaching strangers, matchmaking, arranged marriage, adult instrument,
  affectionate writing); hunting/pets/recreation; movement & adventure (bouldering, surf/equine
  therapy, running therapy, rucking, jump rope, stair climbing, Pilates, stretching, slacklining);
  cognitive & skill (interleaving, adult 2nd language, crosswords, morning pages, touch-typing,
  sleep-tracking, time-blocking, qigong, laughter yoga, awe walks); body & sensory hacks + **two
  honest debunks (speed reading, grounding/earthing)**; social & behavioral (family dinners,
  commensality, silent retreats, pilgrimage, gratitude visit, complimenting/liking-gap, ensemble
  belonging, digital sabbath, Three Good Things); order/digital/manifestation (**vision-board
  backfire finding**, digital decluttering, future-self continuity, cursive myth); creative &
  expressive arts (art-making, poetry therapy, improv, Toastmasters, pottery, knitting, Men's
  Sheds, solo singing, birdwatching). Plus an **"AI as coach, companion & mirror"** group
  (191–198: AI therapist/companion/coach, self-disclosure to AI, AI personalization, sign
  language, car detailing, engagement).
- **Wave 5 — "The cost of failure" group (done):** +50 harm clusters (sections 141–190) — the
  mirror of the practice library, documenting what breaks when things go wrong (divorce,
  bereavement, chronic illness, PTSD, addiction, ACEs, poverty, discrimination, and more).
  NEW render path: a `PracticeHarm` type (severity/onset/reversibility) and a deterministic
  **Cost Score** (`costScore()` = 70·damage + 30·imminence) that mirrors the Leverage Score,
  with a red "AT STAKE" badge and a `degrades[]` line. No leverage score on harms — they are
  not practices to run.
- **Recovery, amends & self-facing practice (done):** +10 clusters (276–285) — 12-step/AA,
  making amends & seeking forgiveness, mirror meditation, mirror self-talk, self-forgiveness,
  structured forgiveness intervention (REACH/Enright), sponsorship/peer recovery, confession/
  disclosure, ritual apology, amends letters. Mirror self-talk and mirror meditation are the
  thinnest (no direct RCT) and are tagged Emerging with explicit caveats.
- **Weakness lines — what collapses a goal (done):** +50 threat-rated clusters (286–335) — the
  inverse of the strengths map. Each names which of the 32 lines, when weak, research shows
  drives a failure mode, with a **1–10 THREAT rating**, degree (primary/major/moderate), and
  onset/trainability. NEW render path: a `WeaknessProfile` type (threat/weakLines/degree/onset/
  reversibility), a **THREAT n/10** badge (`threatColor()`), and a "Weak line(s) →" row. This is
  the third gauge alongside Leverage (practices) and Cost (harms). The overhyped constructs
  (grit, growth-mindset, Dunning-Kruger, Gottman's "94%", ego-depletion) are reported at their
  real deflated size — that honesty IS the group's value.
- **Cost-of-failure wave 2 (done):** +30 harm clusters (336–365) — medical (TBI/CTE, stroke,
  diabetes, COPD, CKD, sleep apnea, hip fracture, hearing/vision loss, periodontal), addiction
  (opioid/alcohol/nicotine/cannabis/stimulant/benzo/Rx-opioid + contested food/gaming/porn
  constructs flagged at deflated size), and financial/legal (bankruptcy, foreclosure,
  unemployment scarring, workplace injury, litigation, criminal record, medical debt, wage
  garnishment, founder failure, old-age poverty).
- **Weakness-lines wave 2 (done):** +30 threat-rated clusters (366–395) — cognitive/skill
  (dyscalculia, spatial-attention, low literacy, working memory, processing speed, dyslexia,
  ADHD, prospective memory, visuospatial, navigation), mating/family/social (courtship, harsh
  parenting, humor, community, insecure attachment, agreeableness, demand-withdraw,
  assertiveness, social-anxiety avoidance, co-parenting), and emotional/volitional (anger,
  sensation-seeking, frustration tolerance, experiential avoidance, external locus, fear of
  failure, boredom proneness, low openness, perfectionism, intolerance of uncertainty).
- **Brainwave-entrainment group (done):** +6 clusters (396–401) — a "Sound, light & rhythm"
  group covering **binaural beats** (incl. Hemi-Sync and the CIA "Gateway Process" tapes),
  **isochronic tones & monaural beats** (the no-headphones/speaker route), **audio-visual
  entrainment** (light-and-sound machines), **40 Hz gamma sensory stimulation (GENUS)**,
  **rhythmic auditory stimulation** (gait), and **vibroacoustic therapy**. 32 verified DOIs.
  HONESTY: each is rated at its TRUE level — binaural beats **Mixed** (leverage 40; small
  transient effect, contested mechanism); the CIA Gateway memo is characterized as a 1983
  speculative essay with zero data (declassified ≠ validated), NOT as proof; AVE carries a
  photosensitive-epilepsy contraindication; GENUS is Emerging/Alzheimer's-specific (pivotal
  HOPE trial unread — do NOT claim a result); only **rhythmic auditory stimulation** earns
  **Strong** (leverage 70) and only for Parkinson's/stroke **gait**, explicitly not for
  mood/cognition/"consciousness."
- **CURRENT LIBRARY SIZE (deterministic count from the data):** **443 clusters across 402
  section slots (0–401), 1,203 verified sources.** Three lenses: **222 practice clusters**
  (Leverage Score), **80 cost-of-failure clusters** (Cost Score), **80 weakness-line clusters**
  (Threat 1–10). Keep expanding toward ~1,000.
- **NEW — Keyword search + browse-by-topic (done):** the practices tab search now matches
  each cluster's title, subtitle, description, callout, feeds/degrades, section name, AND
  every source citation, with **synonym expansion** (typing "anxiety" also finds
  anxious/worry/panic/phobia; "weight" finds obesity/BMI; "money" finds
  financial/saving/invest, etc.) so one keyword surfaces the whole related literature.
  Below the search is a **"Browse by topic" cloud** — 7 themed rows, ~45 tap-to-search
  keyword chips (depression, anxiety, sleep, money, addiction, relationships, …) so users
  can find papers by clicking, not typing. All client-side (`KEYWORD_SYNONYMS`,
  `KEYWORD_TOPICS`, `expandQuery` in ResearchLibrary.tsx) — no backend needed.
- **NEW — Live leaderboards (done):** the practices tab has a leaderboard overlay that ranks
  the whole library by each gauge — **Top 50 by Leverage**, **weak lines by Threat**, and
  **cost-of-failure by Cost Score**. Toggle chips above the card list; clicking any row drops
  the overlay, clears filters, and scrolls to the full card. Computed deterministically from
  the same cited research each card carries (`leverageBoard`/`threatBoard`/`costBoard` memos).
- **NEW — Code-split (done):** the ~6,100-line `PRACTICE_EVIDENCE` corpus moved out of
  `ResearchLibrary.tsx` into `researchLibraryData.ts` (type imported back type-only, no runtime
  cycle) with a vite `manualChunks` rule → a `research-data` chunk. The page's UI chunk dropped
  from **~1,040 KB to 191 KB** (43 KB gzip); the stable 859 KB data chunk caches independently
  and loads in parallel with its lazy route. `chunkSizeWarningLimit` raised to 900 so the
  intentional data chunk doesn't noise the build log.
- **NEW — Leverage Score gauge** (`leverageScore()` in ResearchLibrary.tsx): a
  deterministic 0–100 rating = 70·benefit + 30·ease, where benefit =
  (magnitude/5)·evidenceWeight·durabilityWeight and ease = effortWeight·latencyWeight.
  Each rated cluster shows the score + chips (Impact 1–5, First-results
  days/weeks/months, Holds transient/sustained/lasting, Effort low/mod/high) and a
  `feeds[]` interconnection line. Most wave 2–5 clusters are now rated (leverage on
  practices, Cost Score on harms); Manus can extend the `impact`/`feeds`/`harm`/`degrades`
  fields to any remaining older clusters (fields are optional, so partial coverage is safe).
- **Proposed feature — the "vault + monthly drip" membership engine** (Claude's
  recommendation below; NOT built yet — needs a product decision + entitlements):
  1. Members do NOT get unrestricted library access. Instead: a one-time **timed
     preview** (e.g. 30–60 min, on-screen countdown) to prove the depth is real,
     then the full vault locks.
  2. Each month, drip **5–10 personalized** research clusters/practices matched to
     the member's goals + weakest lines (reuse `keystonePractices` goal-matching).
  3. This is the recurring reason-to-pay: novelty + personalization + scarcity.
  - Build notes: gate `PRACTICE_EVIDENCE` behind an entitlement check; add a
    `library_entitlements` table (userId, previewUsedAt, monthlyUnlockedClusterIds,
    cycleStart); a monthly job (same cron as reminders) that selects the next N
    clusters per member; keep Claim→Evidence citations on the report ALWAYS visible
    (never gate the specific source behind a report claim — that would break the
    verification moat; only gate open-ended browsing).
  - **Honesty caution (important):** do not hide the *public* Verification Ledger or
    the per-claim citations — those are the trust engine. Gate only free-form
    browsing of the full vault, never the evidence behind a claim the site makes.

## 🖱️ MECHANICS REVIEW
- See `MECHANICS_REVIEW.md` (in this folder) for the full front-to-back route +
  button audit: what Claude verified (routes, build, tests) and the live
  click-through checklist for Manus (auth/DB/keys required).

## 🔒 HONESTY CONSTRAINTS (never violate — this is the moat)
- Never present a projection/vision as a guarantee — always "hypothetical, confidence-tiered,
  conditional on follow-through."
- Never inflate a self-reported update to a verified/measured tier.
- Never add a citation that isn't real (DOI must resolve, or use a Google Scholar search link).
- Respect each practice's evidence tier (Strong/Moderate/Emerging); never present Emerging as proven.
- Never action-prescribe the psychedelic entry.
- Keep "0 fabricated sources" literally true.
- **A signed commitment is immutable and non-replaceable.** Once `status="signed"`, never
  let the words be edited or erased. The only moves are *Renew* (re-stamp date) or *Write a
  new letter* that supersedes it — the old letter is kept forever in the archive, untouched.
  The UI + `signCommitment`/`saveCommitmentDraft` enforce this; never add a silent edit path.
- The daily text is ONLY a Y/N check-in at ~8 PM local. Never repurpose that channel for
  marketing. Honor STOP. Keep the consent copy.
