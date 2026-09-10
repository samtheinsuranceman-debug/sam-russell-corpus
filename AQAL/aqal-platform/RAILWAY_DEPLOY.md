# joinaqal.com on Railway

AQAL now deploys from GitHub to Railway, the same way Russell Capital Systems does.
Every merge to `master` that touches `AQAL/aqal-platform/**` rebuilds and deploys
within a few minutes. Manus is no longer in the path.

## What exists

| Piece | Value |
|---|---|
| Railway project | `aqal` (`3c822166-97d9-4c68-8a00-656843289067`) |
| Environment | `production` (`dd665a22-6f03-452c-9471-0a42a85f82a8`) |
| Web service | `web` (`c5ca6956-00c6-447e-a0ce-2524cd08921b`), source GitHub `samtheinsuranceman-debug/sam-russell-corpus`, branch `master`, root directory `/AQAL/aqal-platform` |
| Database | `MySQL` (`b3980e17-a7d2-464f-94cd-dc235d9b3704`), image `mysql:8.4`, volume `aqal-mysql-data` at `/var/lib/mysql`, database `aqal` |
| Railway address | https://web-production-120e0.up.railway.app |
| Build | `pnpm build` (Vite client + esbuild server) |
| Pre-deploy | `pnpm exec drizzle-kit push --force` (applies the schema to the database before each deploy) |
| Start | `pnpm start` |
| Health check | `/health`, 300 s |
| Watch paths | `/AQAL/aqal-platform/**` (a Russell Capital Systems commit does not redeploy AQAL) |

Variables already set on `web`: `DATABASE_URL` (reference to the MySQL service over the
private network), `JWT_SECRET` (generated for this host), `FREE_ASSESSMENT_CAP=1000`,
`STT_PROVIDER=auto`, `VITE_APP_ID=aqal-platform`, `PORT=3000`.

## What the owner pastes into Railway → aqal → web → Variables

Nothing goes through chat. Each key lights up its provider the moment it is present
(`.env.example` is the full list). In the order the launch runbook gives:

1. `OPENAI_API_KEY` — scoring and the transcription fallback. Required for real results.
2. `GROQ_API_KEY` — cheap Whisper transcription; `STT_PROVIDER=auto` prefers it.
3. `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
   `S3_PUBLIC_BASE_URL` — where the voice answers are stored (R2 or S3).
4. `RESEND_API_KEY`, `EMAIL_FROM` — the welcome and results emails.
5. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — only when charging cohort 2.
6. The rest of the panel: `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`,
   `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `PERPLEXITY_API_KEY`.
7. `FREE_ACCESS_CODE` — the founding passcode, if it should differ from the default.
8. `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID` — only if the Manus
   sign-in portal is kept; the free founding claim needs no OAuth.

Until a key is present its provider runs as an honest mock, exactly as on Manus.

## Moving the domain

In Railway → aqal → web → Settings → Networking → Custom Domain, add `joinaqal.com` and
`www.joinaqal.com`. Railway shows the CNAME target for each. At the registrar (wherever
joinaqal.com's DNS is managed today), point `www` and the root at those targets. The
certificate issues itself once DNS resolves. Until then the site is live at the Railway
address above.

## Data

The Manus database is not copied here. The free-founding counter starts at 523 claimed by
the `FOUNDING_CLAIMED_OFFSET` in code, so the public number is right from the first minute.
If the member rows on Manus matter, export them there and import into the Railway MySQL;
the schema is identical.

## Scheduled emails

On Manus the retention emails registered themselves with the Heartbeat cron. On Railway,
add a cron-schedule service (or an external scheduler) that POSTs the three endpoints in
`LAUNCH_RUNBOOK.md` §5b with the scheduler token. Without it, the finish-nudge and
re-engagement emails do not send; the welcome and results emails do.
