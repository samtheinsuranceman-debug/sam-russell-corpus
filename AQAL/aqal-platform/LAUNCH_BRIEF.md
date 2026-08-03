# AQAL Intelligence Platform — Launch Brief

_Status snapshot for go-live. Written to answer: where do we stand, what's the value,
what's the pricing, which AIs do I fund, and what's still blocking launch._

---

## 1. Where the 27 questions stand

The live assessment is **27 questions** (it was 24 — it grew to 27 when the three
explicit goals questions were added at your request: **The Blueprint**, **The Seven
Perfect Things**, **The Goal Pre-Mortem**).

**Sequencing is deliberate and conversational** — it is a designed arc, not id order by
accident:

1. **Playful, expansive openers** (low-threat, high-imagination): Theme Park → Superpower
   Trial → Jet → Road Trip → App That Prints Money → Parallel Dinner → Island → Casino
   Night → System Redesign → Zoo of Impossible Animals.
2. **Scale & money** (raises the stakes once they're warm): Half-Million Build → One
   Hundred Million.
3. **Goals, stated plainly** (mid-assessment, once rapport is built): Blueprint → Seven
   Perfect Things.
4. **Relational / negotiation / seduction** (elicited indirectly): Dream Concert → Mentor
   Windfall → Two People You Love → Negotiation → Charm Offensive.
5. **Pre-mortem** (the reality check): Goal Pre-Mortem.
6. **Identity & legacy closers** (emotional high notes to end on): Peak-You Year →
   Underdog Bet → Signature Move → Founder's Grip → Unsaid Thing → Standing Ovation →
   The Torch You Pass.

This opens warm, builds trust before it asks anything heavy, puts the goals in the middle
where momentum is highest, and closes on legacy — the most one-sitting-completable order
we could design. **A manifesto gate now precedes Q1** priming people to answer long and
deep (short answers → near-zero measurement).

**Verdict:** the question set and its order are launch-ready. No blocker here.

---

## 2. The AIs you need to fund (and the honest cost)

Everything is already wired — each provider activates the moment its key is present
(`.env.example` is the full checklist). Fund in this priority order:

### Tier A — REQUIRED to go live (nothing works without this one)
| Provider | Env var | Powers | Why critical |
|---|---|---|---|
| **OpenAI** | `OPENAI_API_KEY` | Free-tier scoring **+ Whisper voice transcription** | The whole voice loop. Without it the app runs on a mock. **Fund this first.** |

### Tier B — the consensus panel (each key = one more independent AI; free tier uses the top 3)
| Provider | Env var | Notes |
|---|---|---|
| **Anthropic (Claude)** | `ANTHROPIC_API_KEY` | Route via OpenRouter if you want the OpenAI dialect |
| **Google (Gemini)** | `GOOGLE_API_KEY` | OpenAI-compatible endpoint is default |
| **xAI (Grok)** | `XAI_API_KEY` | api.x.ai is OpenAI-compatible |
| **Groq (Llama)** | `GROQ_API_KEY` | Cheap + fast; **also a much cheaper Whisper** (see cost note) |
| **Mistral** | `MISTRAL_API_KEY` | EU lab — uncorrelated error strengthens consensus |
| **OpenRouter** | `OPENROUTER_API_KEY` | **One key lights up BOTH Cohere (Canada) + AI21/Jamba (Israel)** — most efficient way to add two more distinct developers |

### Tier C — optional at launch
| Provider | Env var | Powers |
|---|---|---|
| **Perplexity** | `PERPLEXITY_API_KEY` | Live evidence verification (paid/high-confidence tier). Fine to skip day one. |

### Infra keys also required
`DATABASE_URL` (MySQL) · `S3_*` or Cloudflare R2 (stores the voice audio) · `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (only when you charge) · `JWT_SECRET` + OAuth vars (login) · `RESEND_API_KEY` (emails results).

### ⚠️ Cost reality-check — read before you fund
Your ~8–10¢/assessment is right **for the LLM scoring** (3-model free-consensus ≈ 10–15¢).
**But it omits transcription.** A 27-question assessment where people talk 5–10 min each is
**135–270 minutes of audio**. OpenAI Whisper is $0.006/min → **$0.80–$1.60 per assessment
in transcription alone.**

- 2,000 assessments on OpenAI Whisper ≈ **$260 scoring + ~$1,600–3,200 transcription ≈ $2k–3.5k.**
- **Fix (recommended): route transcription through Groq Whisper** (a fraction of the cost)
  or use the browser's built-in speech recognition (≈ free) for answers. That drops the
  real per-assessment cost back toward your 8–10¢ estimate. This is a one-line provider
  swap — I can wire STT to Groq so long-form voice doesn't blow the budget.

**Bottom line to fund for a 2,000-person X launch tomorrow:** load **~$300 on OpenAI**
(scoring + a safety margin) **and ~$50–100 on Groq** (cheap Whisper + Llama). That alone
runs the free tier for thousands. Add Anthropic/Google/xAI/OpenRouter credit
(~$50–100 each) to enrich the consensus. **~$500–600 total** covers a very large launch
day with margin.

---

## 3. Pricing structure — FINALIZED (your numbers)

**Products (standard / post-promo):**
- **Audio assessment: $500** (one-time, voice-only).
- **Fully underwritten assessment: $1,500** (one-time, full-panel evidence tier).
- **Membership: $79/month, 15-day free trial** (single tier — the ongoing coach + network).
- **Personal coaching calls / 1-on-1 strategy: a SEPARATE fee, NEVER discounted** (stated on the page).

**Founding giveaway ladder — 24 months (not lifetime).** Implemented + tested
(`shared/giveawayLadder.ts`, `GIVEAWAY_DURATION_MONTHS = 24`):

| Cohort | Signups | Promo (24 months) |
|---|---|---|
| 1 | 1 – 10,000 | **Free** |
| 2 | 10,001 – 20,000 | 75% off |
| 3 | 20,001 – 30,000 | 50% off |
| 4 | 30,001 – 40,000 | 25% off |
| 5 | 40,001+ | standard |

### ⚠️ Advertising rule (implemented)
**Only the first-10,000-FREE tranche is advertised publicly.** The 75% / 50% / 25%
tranches exist in the backend ladder for enforcement but are **NOT shown on the pricing
page** — per your instruction. The page instead itemizes what the founding 10,000 are
having **waived** ($500 assessment + 24×$79 = $1,896 membership → **$2,396 total waived**)
and states **why**: we are building the network aggressively, and the founding members are
its foundation.

The free-cap infra (`FREE_ASSESSMENT_CAP=10000`) drives the "N of 10,000 free spots left"
scarcity counter.

### Economics
At ~$1–2/member/year in compute (once STT is on Groq, §2), 24 months free costs you a few
dollars per founding member — trivial against the network density it buys. The $79/mo
recurring (after promo, and for non-founding members now) is the revenue engine; coaching
calls are the separate, full-margin, never-discounted upsell.

---

## 4. Marketplace value (why this is worth building)

- **Category of one.** Every existing test scores essentially **one line** (SAT = linguistic,
  a math exam = mathematical) or a handful. This measures **all 32 lines** by voice, scored
  by a **panel of independent AIs** against a real developmental-stage manual. Nobody is
  "MRI-ing the whole mind" this way.
- **It's engineering, not a horoscope.** The output isn't a label — it's a map plus
  **prescriptions from a 7,000-item, cited-research database** and a live tracker of the one
  weakness most threatening the user's stated goals. The value is *better outcomes in less
  time*, which we can defend with citations.
- **Honesty is the moat.** The `/archetypes` evidence page now carries **247 profiles / 533
  real, verifiable sources**, graded Strong→Contested, and a CI test blocks fake citations.
  In a market full of pop-psych "types," a platform that publishes its own evidence *and its
  own limitations* is differentiated and defensible.
- **The network is the compounding asset.** The science says high-line people wither in
  isolation and thrive among same-line peers. The matching network turns a one-time
  assessment into a lifetime membership with a reason to stay.

---

## 5. Launch-blocking checklist (what's actually left)

**Ready now:** 27-question assessment + deliberate sequence · manifesto gate · voice capture ·
32-line + stage-development scoring wired to the private underwriting manual + your uploaded
AQAL framework (hidden from members, fed to every panel AI) · results/rarity · archetypes
evidence page · giveaway ladder · free-cap + scarcity counter.

**You must supply (human tasks):**
- [ ] **Fund + paste API keys** — OpenAI first, then Groq, then the panel (see §2).
- [ ] **Point STT at Groq** (recommended) so long voice answers don't cost $1+/each — I can do this now.
- [ ] `DATABASE_URL` (MySQL) provisioned + `db:push` run.
- [ ] Storage bucket (S3/R2) for the audio.
- [ ] `STRIPE_*` keys (only needed when you start charging cohort 2+; free launch doesn't need them).
- [ ] Auth/OAuth config + `JWT_SECRET`.
- [ ] `RESEND_API_KEY` if you want results emailed.
- [ ] Decide: wire the giveaway ladder into the pricing page display + Stripe amounts (code is ready; say go).

**My recommended next build (low-risk, high-leverage) while you fund keys:**
1. Swap STT to Groq Whisper (kills the transcription cost surprise).
2. Wire `giveawayLadder` into the pricing page so the live discount + "spots left" show.
3. Results → Archetypes on-ramp (route a member from their two lowest lines to the matching
   starvation cards + prescriptions) — turns the assessment into the funnel.

---

_Generated during launch prep. All figures are honest estimates; the transcription cost note
is the one item that changes your unit economics — please read §2._
