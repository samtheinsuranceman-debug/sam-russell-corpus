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

---

## 🔒 HONESTY CONSTRAINTS (never violate — this is the moat)
- Never present a projection/vision as a guarantee — always "hypothetical, confidence-tiered,
  conditional on follow-through."
- Never inflate a self-reported update to a verified/measured tier.
- Never add a citation that isn't real (DOI must resolve, or use a Google Scholar search link).
- Respect each practice's evidence tier (Strong/Moderate/Emerging); never present Emerging as proven.
- Never action-prescribe the psychedelic entry.
- Keep "0 fabricated sources" literally true.
- **A signed commitment is immutable.** Once `status="signed"`, never let the words be
  edited or erased — only *renewed* (re-stamp the date) or fully re-recorded from scratch.
  The UI enforces this; keep the server honest too (don't add a silent edit path).
- The daily text is ONLY a Y/N check-in at ~8 PM local. Never repurpose that channel for
  marketing. Honor STOP. Keep the consent copy.
