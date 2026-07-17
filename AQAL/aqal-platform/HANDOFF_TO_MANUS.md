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

---

## 🔒 HONESTY CONSTRAINTS (never violate — this is the moat)
- Never present a projection/vision as a guarantee — always "hypothetical, confidence-tiered,
  conditional on follow-through."
- Never inflate a self-reported update to a verified/measured tier.
- Never add a citation that isn't real (DOI must resolve, or use a Google Scholar search link).
- Respect each practice's evidence tier (Strong/Moderate/Emerging); never present Emerging as proven.
- Never action-prescribe the psychedelic entry.
- Keep "0 fabricated sources" literally true.
