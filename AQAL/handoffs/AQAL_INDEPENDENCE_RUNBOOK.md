# AQAL INDEPENDENCE RUNBOOK — deploy without Manus, in about an hour

**For: Sam. Purpose: get www.joinaqal.com running on infrastructure YOU own,
with no dependence on Manus or anyone's three-day update.**

You already hold everything you need. The zip named `AQAL-FULL-INDEPENDENCE.zip`
is the COMPLETE site — all 9,646 pages, the assessment engine, the database
schema, everything. The API keys are yours. The only thing living on Manus's
side is the database contents (test data, unless real members signed up), and
Step 8 covers that.

One fact that makes this easy: **the platform boots with zero API keys.** Every
external provider (AI panel, email, storage) falls back to a safe built-in mock
until its key is set. So the site can be LIVE today with two secrets, and you
add keys one at a time as you have them.

---

## Step 1 — Create the hosting account (10 min)

Go to **https://railway.app** → sign up with YOUR email → add YOUR card.
(Alternative: https://render.com — the steps are nearly identical.)

Expect roughly $20–40/month. That's the honest cost of an application +
database, and it buys the thing Bluehost couldn't: this exact stack, running.

## Step 2 — Create the project + database (5 min)

In Railway: **New Project** → **Empty Project**. Then inside it:
**+ New** → **Database** → **MySQL**. Railway creates it and gives you a
connection string. Copy the value called `DATABASE_URL` (it looks like
`mysql://user:pass@host:port/railway`). Automated daily backups are included —
that's your "never lose the data" requirement, handled.

## Step 3 — Upload the code (10 min)

Easiest path (no GitHub needed):
1. Install the Railway CLI on your computer: in Terminal,
   `npm install -g @railway/cli` then `railway login`.
2. Unzip `AQAL-FULL-INDEPENDENCE.zip`, open Terminal in the unzipped
   `aqal-platform` folder.
3. Run `railway link` (pick your project), then `railway up`.
   It uploads and builds. Build command is `pnpm install && pnpm build`;
   start command is `pnpm start`. Railway usually detects both.

(If you prefer GitHub: create a private repo, upload the folder, and in
Railway choose **Deploy from GitHub repo** instead of the CLI. Same result.)

## Step 4 — Set the two REQUIRED secrets (5 min)

In the Railway service → **Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the MySQL string from Step 2 |
| `JWT_SECRET` | any long random string — 40+ characters you invent |

The site will boot and serve all public pages with just these. Scoring runs in
mock mode until AI keys arrive.

## Step 5 — Create the database tables (2 min)

In Railway → your service → **Settings** → one-off command (or locally with
`DATABASE_URL` set): run `pnpm db:push`. This creates every table from the
schema in the code. Fresh, empty, correct.

## Step 6 — Point YOUR domain at it (10 min + DNS wait)

In Railway → **Settings** → **Domains** → **Custom Domain** → enter
`www.joinaqal.com`. Railway shows you a CNAME target.

Then in the account where joinaqal.com's DNS lives (it's on **Cloudflare** —
if that account isn't yours, this is the ONE thing to chase when Manus
returns; see Step 8): create/replace the `www` CNAME to Railway's target, and
set the root `joinaqal.com` to redirect to `www` (Cloudflare: a redirect rule,
or a CNAME with the same target). Also add these variables in Railway:

| Variable | Value |
|---|---|
| `CANONICAL_HOST` | `www.joinaqal.com` |

Until DNS is yours, the site still works on Railway's free
`something.up.railway.app` URL — live today either way.

## Step 7 — Add YOUR API keys as you have them (any time)

Each key activates its feature the moment it's set. All are YOUR accounts:

| Variable | What it turns on | Where to get it |
|---|---|---|
| `OPENAI_API_KEY` | Core scoring + voice transcription | platform.openai.com (ROTATE the burned one first) |
| `ANTHROPIC_API_KEY` | Panel member: Claude | console.anthropic.com |
| `GOOGLE_API_KEY` | Panel member: Gemini | aistudio.google.com |
| `XAI_API_KEY` | Panel member: Grok | console.x.ai |
| `GROQ_API_KEY` | Panel member: Llama (+ fast STT) | console.groq.com |
| `MISTRAL_API_KEY` | Panel member: Mistral | console.mistral.ai (ROTATE the burned one first) |
| `COHERE_API_KEY` | Panel member: Cohere | dashboard.cohere.com |
| `OPENROUTER_API_KEY` | Panel member: AI21 route | openrouter.ai |
| `RESEND_API_KEY` + `EMAIL_FROM` | Real emails (verify, reset, support) | resend.com |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Payments | dashboard.stripe.com |
| `LLM_DAILY_BUDGET_USD` | Daily AI spend alarm (e.g. `25`) | just a number |

Optional extras the code supports: S3/R2 storage (`S3_BUCKET` etc.), Twilio
SMS, Clerk auth, `FREE_ACCESS_CODE` / `BETA_ACCESS_CODE` promo gates.
NEVER paste key values into any chat — only into Railway's Variables screen.

## Step 8 — When Manus comes back (later, not urgent)

1. **Domain first:** if the Cloudflare/registrar login for joinaqal.com isn't
   yours, have it transferred to YOUR email immediately. The domain is the
   only asset in this whole stack that can't be rebuilt.
2. **Data:** ask for a database export (a `mysqldump` file) of the old
   deployment. If it was all test data, discard it. If real founding members
   signed up, send me the file and I'll merge it into the new database.
3. From then on, Manus (or anyone) can keep helping — by deploying onto YOUR
   Railway project, with access you can revoke.

## Verify it worked (5 min)

- Homepage loads; hover a dial point → the encyclopedia popup opens top-anchored.
- `/protocols`, `/myths`, `/line/logical`, `/protocol/emdr` all load.
- `/sitemap.xml` lists 9,646 URLs; `/robots.txt` serves.
- Take the 2-minute quiz end-to-end.
- THEN do Google Search Console + submit the sitemap — on a site that's up
  because you own it.

*Generated from the codebase — every variable name above was extracted from the
actual code, not from memory.*
