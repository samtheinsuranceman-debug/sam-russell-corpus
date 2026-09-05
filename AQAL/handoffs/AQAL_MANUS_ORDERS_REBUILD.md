# MANUS ORDERS — FULL REBUILD EDITION (supersedes ALL AUG-18 patch instructions)

**To: Manus. From: Claude (merge side), on Sam's instruction.**

Your previous working copy and its patch history are gone, so every
AUG-18 APPLY_INSTRUCTIONS document (18 through 18R) is now VOID. Do not
look for the a517fae base — it no longer matters. There is exactly one
artifact now: **JOINAQAL-COMPLETE-REBUILD.zip** — the entire platform,
452 files, current to the latest verified build (275+ tests passing).

## The one structural change — read this first

The site now deploys to infrastructure **Sam owns** (a Railway project
under HIS account — or another Node host he designates), not to your
platform. You are the operator; he is the owner. He can grant you access
to the Railway project; he can also revoke it. Do not deploy this
codebase to any infrastructure Sam does not control, and do not place
the domain, DNS, or any credential under an account that isn't his.

## Step 1 — Deploy the bundle

1. Unzip JOINAQAL-COMPLETE-REBUILD.zip. The app root is `aqal-platform/`.
2. Node app: build `pnpm install && pnpm build`, start `pnpm start`,
   port from `PORT`. Provision a MySQL database (Railway MySQL plugin,
   or PlanetScale) with automated backups ON.
3. Set the two boot secrets in the host's environment:
   - `DATABASE_URL` — the MySQL connection string
   - `JWT_SECRET` — long random string
   The app boots with ONLY these; every provider degrades to safe mock.
4. Create the schema: run `pnpm db:push` once (true drizzle-kit push —
   schema diff, no journal replay). Fresh DB, all tables.

## Step 2 — Environment variables (env only — NEVER in code, NEVER in chat)

Sam supplies the values (his accounts, freshly rotated). You set them:

| Variable | Activates |
|---|---|
| `OPENAI_API_KEY` | Core scoring + Whisper STT |
| `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` / `XAI_API_KEY` / `GROQ_API_KEY` / `MISTRAL_API_KEY` / `COHERE_API_KEY` / `OPENROUTER_API_KEY` | The 8-member panel |
| `RESEND_API_KEY` + `EMAIL_FROM` | Verify/reset/support email — REQUIRED for launch |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Payments |
| `CANONICAL_HOST` = `www.joinaqal.com` | Host 301s — REQUIRED before public launch |
| `LLM_DAILY_BUDGET_USD` (e.g. 25) | Daily panel-spend alarm to Sam |
| Optional: S3/R2 vars, Twilio, `FREE_ACCESS_CODE`, `BETA_ACCESS_CODE` | Storage / SMS / promo gates |

## Step 3 — Domain

`www.joinaqal.com` CNAMEs to the Railway service; apex redirects to www.
The registrar/Cloudflare login must be SAM'S account. If any part of the
domain currently sits under your control, transferring it to Sam is your
FIRST deliverable, before any deploy work.

## Step 4 — Post-deploy verification (all must pass)

1. `pnpm check` and `pnpm build` green; site serves on the public URL.
2. `/launch-check` as admin — every row green or explained.
3. Homepage: hover any dial point → encyclopedia popup opens TOP-anchored,
   full height, scrolls; lower half is the "what this line could mean for
   you" content. Tap works on mobile; pinch-zoom works (not disabled).
4. `/line/emotional`, `/protocol/emdr`, `/myth/laetrile`,
   `/capacity/adaptive`, `/kind/psychotherapy`, `/wing/miracle-cure`,
   `/verdict/harmful`, `/pair/logical--strategic`, `/practice/sleep`,
   `/goal/focus`, `/weak/interoceptive`, `/build/adaptive/emdr` — all
   render fully, each with the slim "film briefing" video strip.
5. `/protocols` lists 156 (title says 156); `/myths` lists 191 with the
   wing strip; sitemap.xml lists 9,646 URLs, every one https://www.joinaqal.com.
6. og:description on `/` reads "IQ graded 4 lines of you. We measure all 32."
   View-source after JS: BreadcrumbList JSON-LD (id ld-breadcrumb) on deep pages.
7. robots.txt serves; security headers present (HSTS, nosniff,
   X-Frame-Options); http:// and bare-domain 301 to https://www.
8. Full test assessment end-to-end: 27 questions → Final Three screen →
   scoring (mock mode OK pre-keys). `/black-box`, `/corrections`,
   `/sample-report`, `/help`, `/reset-password` all load.
9. Corrections Ledger top entries dated 2026-08-22 (pending-audit
   disclosures) — present and unmodified.
10. Screenshot `/launch-check` back to Sam.

## Standing rules (unchanged, permanent)

- Secrets live in the deployment environment ONLY. Never in the repo,
  never in zips, never in any chat log.
- Never commit or alter: the Corrections Ledger's history, the honesty
  disclosures, the blank pending-audit DOI fields, privacy guarantees
  (72h audio wipe, no message scanning, no data sales).
- Backups: automated daily DB backups + one restore drill; report the
  drill result to Sam.
- Uptime monitoring on the public URL with alerts to Sam.
- Videos: Sam's uploads go into `client/src/lib/pageVideos.ts` (one line
  per page) — redeploy to publish. Line pages use `lineVideos.ts`.
