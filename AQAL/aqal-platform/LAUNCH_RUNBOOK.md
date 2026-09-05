# AQAL — Go-Live Runbook

The executable, in-order steps to take the platform live. Pairs with
`LAUNCH_BRIEF.md` (which holds the pricing/AI decisions and rationale). Do these
top to bottom; each step says what "done" looks like.

---

## 0. Accounts you need (create first)
- **OpenAI** (scoring + STT fallback) — required
- **Groq** (cheap Whisper STT + a panel model) — required for the cost math
- **Stripe** (payments)
- A **MySQL** database (PlanetScale / RDS / Railway / etc.)
- **Object storage**: Cloudflare R2 or AWS S3 (stores the voice audio)
- **Resend** (emails results) — optional at launch
- Optional panel: Anthropic, Google AI, xAI, Mistral, OpenRouter, Perplexity

---

## 1. Set environment variables (in this order)
Copy `.env.example` → `.env` and fill these. **Required to boot & run the free tier:**

```
NODE_ENV=production
PORT=3000
JWT_SECRET=<random 32+ chars>
DATABASE_URL=mysql://user:pass@host:3306/aqal

# LLM scoring (required)
OPENAI_API_KEY=sk-...

# Cheap transcription (strongly recommended — see cost note)
GROQ_API_KEY=gsk-...
STT_PROVIDER=auto            # prefers Groq Whisper when GROQ_API_KEY is set

# Storage for the audio (required for real assessments)
S3_BUCKET=...
S3_ENDPOINT=https://<acct>.r2.cloudflarestorage.com   # R2; omit for AWS
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...

# Payments (required to charge; free launch can defer)
STRIPE_SECRET_KEY=sk_live_...        # use sk_test_... to rehearse first
STRIPE_WEBHOOK_SECRET=whsec_...

# Free giveaway (already defaults to first 10,000)
FREE_ACCESS_CODE=<the passcode you hand out>   # default "Welcome1"
FREE_ASSESSMENT_CAP=10000
```

**Add the rest of the AI panel** (each key lights up one more independent scorer;
free tier uses the top 3):
```
ANTHROPIC_API_KEY=...      GOOGLE_API_KEY=...      XAI_API_KEY=...
MISTRAL_API_KEY=...        OPENROUTER_API_KEY=...  # lights up Cohere + AI21
PERPLEXITY_API_KEY=...     # evidence verification (optional day one)
```

**Done when:** `enabledPanel()` sees your models — the server logs the provider on boot.

---

## 2. Fund the AI APIs
For a ~2,000-assessment launch day with the full panel (details in `LAUNCH_BRIEF.md §2`):

| Provider | Load | Note |
|---|---|---|
| OpenAI | **$300** | scoring + STT fallback — fund first |
| Groq | **$50** | cheap Whisper + Llama |
| Anthropic | $100 · Google $75 · xAI $75 · Mistral $50 · OpenRouter $75 | panel |
| Perplexity | $50 (optional) | verification |

**Bare-minimum to be live & good:** OpenAI $300 + Groq $50. Watch the OpenAI meter;
a viral day (5–10k) is ~3–5× that.

> ⚠️ **Cost note:** long voice answers make *transcription* the real cost driver.
> `STT_PROVIDER=auto` + `GROQ_API_KEY` keeps it at pennies. Don't skip Groq.

---

## 3. Database
```
pnpm install
pnpm db:push        # applies all migrations incl. 0016 (underwritten-gate) + 0017 (finish-nudge)
```
**Done when:** `db:push` completes with no pending migrations.

---

## 4. Build & start
```
pnpm build          # vite (client) + esbuild (server) → dist/
pnpm start          # NODE_ENV=production node dist/index.js
```
**Done when:** the server boots on `PORT` and `/` renders the landing page.
_(Verified: the bundle boots and serves the landing + tRPC API in mock mode with
only PORT + JWT_SECRET set — every provider degrades to a safe mock until keyed.)_

### Auth note — free launch needs no OAuth
The **free founding claim** issues its own session from the email + passcode, so
it works with **no OAuth configured**. The header **"Sign In"** and the paid
Stripe flows use OAuth (`OAUTH_SERVER_URL` / `VITE_OAUTH_PORTAL_URL`). For a
free-first launch you can defer OAuth; wire it before you start charging cohort 2.

---

## 5. Stripe
Products are defined **in code** (`server/stripe/products.ts`) with inline
`price_data`, so there are **no Stripe price IDs to create** — you only need the
keys from step 1. Then:
1. In the Stripe dashboard, add a webhook endpoint → `https://<your-domain>/api/stripe/webhook`
   (confirm the exact path in `server/_core` routing), events: `checkout.session.completed`,
   `customer.subscription.deleted`.
2. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. **Rehearse with `sk_test_...`** and card `4242 4242 4242 4242` before going live.

**Done when:** a test membership checkout completes and the webhook flips the user
to an active membership; a test `underwritten` payment sets the unlock.

---

## 5b. Scheduled jobs (email lifecycle)
**In the Manus/Forge environment this is now AUTOMATIC:** on boot the server
registers all three jobs with the Heartbeat cron service (idempotent — existing
registrations and dashboard edits are left untouched; see `server/scheduledJobs.ts`).
Confirm with the `[scheduledJobs] registered …` boot log lines or the Heartbeat
dashboard.

**On any other host** (no `BUILT_IN_FORGE_API_*` creds), point your own scheduler
at these cron-authenticated endpoints. Without a scheduler the retention emails
never send.

| Endpoint (POST) | Cadence | What it does |
|---|---|---|
| `/api/scheduled/finish-nudge` | hourly (or a few ×/day) | one-time "you started but didn't finish" email, 24–96h after signup |
| `/api/scheduled/tracker-reengagement` | ~twice a month | invites opted-in members to start their next tracker cycle |
| `/api/scheduled/drift-alert` | per its design | existing drift alert |

(The founding **welcome email** and the **results email** fire inline — no cron
needed. All email requires `RESEND_API_KEY`; unconfigured, they log as mock.)

**Done when:** hitting `/api/scheduled/finish-nudge` as the cron identity returns
`{ ok: true, candidates, sent, failed }`.

## 5c. Social share image (do before you post to X)
The share/OG meta tags point at `/og-cover.png` (1200×630). A branded **source**
is committed at `client/public/og-cover.svg` — export it to PNG and drop it beside
the SVG:
```
# any one of these:
rsvg-convert -w 1200 -h 630 client/public/og-cover.svg -o client/public/og-cover.png
# or open the SVG in any browser/design tool and export a 1200×630 PNG
```
Then validate the preview at cards-dev.twitter.com/validator (or just paste your
URL into a draft X post). Without the PNG, shared links render a bare card.

## 6. Smoke test (≈10 minutes, do before announcing)

> **📱 Mobile is non-negotiable:** an X launch is mostly phones, and mobile voice
> APIs (MediaRecorder / SpeechRecognition) behave differently on iOS Safari vs
> Android Chrome. Before posting, do ONE full question on a real iPhone and ONE
> on a real Android: record → see the "~N words heard" receipt → confirm the
> answer shows as captured. This is the one thing that can't be verified from
> the dev environment.
- [ ] Landing `/` loads; hero renders (A/B variant assigned).
- [ ] Sign in works (OAuth/JWT).
- [ ] `/assessment` → manifesto gate shows → mic captures → a short answer transcribes
      (confirms STT/Groq is live, not the mock).
- [ ] Finish a quick assessment → `/results` shows the radar, rarity, and the
      **10-lowest-lines on-ramp** (voice-hard lines tagged amber).
- [ ] `/archetypes` loads with the evidence grade + jump-nav.
- [ ] `/pricing` shows "Founding 10,000 — Free for life", the $500/$1,500/$79 cards,
      "Scientifically Proven Method" in the trust bar.
- [ ] Free founding claim → routes into the assessment (no charge).
- [ ] `/evidence` shows the underwritten trial banner; an upload starts the 7-day clock.
- [ ] (Stripe test mode) membership 15-day trial + underwritten $1,500 unlock both work.

---

## 7. Launch-day watch
- **OpenAI + Groq balances** — top up before they hit zero (assessments fail closed to a mock, which is honestly labeled but not what you want live).
- **`score_llm` / `score_consensus` / `score_stt` events** — confirm real scoring, not mock.
- **`checkout_start` by `meta.variant`** — the hero A/B signal (needs a few days for signal).
- **Free-cap counter** — when it nears 10,000, decide whether to open cohort 2.

---

## Fastest path to live today
1. Fund **OpenAI $300 + Groq $50**.
2. Set the **required** env vars (step 1), `pnpm db:push`, `pnpm build && pnpm start`.
3. Add **Stripe** keys + webhook (rehearse in test mode).
4. Run the **smoke test** (step 6).
5. Announce. Watch the meters (step 7).
