# Launch audit, 7 September 2026

What was checked, what passed, what is still open. Reviewed by Perplexity as an outside release auditor; its blockers and gaps are folded in below.

## Code

| Check | Result |
|---|---|
| Type check (`pnpm check`) | passes |
| Full test suite with a local MySQL (`pnpm vitest run`) | 2,421 tests pass after two test-only fixes: the FRED "no key" test now covers the keyless CSV transport, and the first router import in the Round 71 file gets a 30-second budget for cold runs |
| Route-count guards | 257 routes, unchanged |
| Static homepage parity (`docs/index.html` vs the React homepage) | passes; both read `shared/homeManifesto.json` |
| Homepage rules (no purple, no visitor figures list, fifteen claims, slogan on two pictures, lead card last) | pass |

Without a local database the suite reports DB-dependent failures; that is expected and documented in `docs/OWNER_CHECKLIST.md`.

## Deploy

| Item | State |
|---|---|
| Railway service `web`, root `russell-capital-systems`, watch `/russell-capital-systems/**`, one replica in sfo | configured |
| Last automatic deployment before this audit | PR #97, 14:48 UTC |
| PRs #98 to #106 (patent document, homepage copy, homepage typography) | merged to master, **did not deploy on their own** |
| Action taken | a fresh build was forced by re-attaching the repository source; it succeeded at 19:02 UTC on the PR #106 commit, so production now carries every merged change |
| Autodeploy reliability | **unresolved**. Next merge is the test: if it does not build on its own, reinstall the Railway GitHub App for the repository (link in the owner checklist) |

## Environment variables on Railway (names only)

Present: ANTHROPIC_API_KEY, ANTHROPIC_WORKSPACE_ID, OPENAI_API_KEY, PERPLEXITY_API_KEY, HEYGEN_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, RESEND_API_KEY, DATABASE_URL, JWT_SECRET, OWNER_EMAIL, OWNER_NAME, SCHEDULER_TOKEN, PUBLIC_BASE_URL, CALENDLY_URL, LEAD_NOTIFY_EMAIL, MAIL_FROM, MAIL_REPLY_TO, CAREER_DATA_DAYS, HAZARD_DATA_DAYS, ZIP_DATA_DAYS, VITE_APP_ID, NODE_ENV, MYSQL_DATABASE.

Absent, with consequence:

- FRED_API_KEY: the keyless CSV transport is used; fine, lower rate limits.
- OWNER_PASSWORD_HASH and OWNER_TOTP_SECRET: the owner password login and TOTP are not active in production; owner access runs through managed auth only. Set both if the password door is wanted (checklist section 2).
- BACKUP_DIR: backups have nowhere to write. Set it to a Railway volume path before relying on backups.
- GA_MEASUREMENT_ID: no analytics.
- BUSINESS_PHONE, BUSINESS_STREET, BUSINESS_CITY, BUSINESS_STATE, BUSINESS_POSTAL_CODE, BUSINESS_HOURS: footer NAP and schema fall back to blanks.

## Live checks

- Key probe at `/api/trpc/ultra.keyProbe`: all five providers were green at 14:28 UTC. It reports only ok / rejected / missing and a redacted reason; no key material. Perplexity's reviewer asked that it be owner-only; it is deliberately public so the owner can check from a phone without logging in. Owner's call.
- Direct HTTP checks of production from this environment were not possible in this session (outbound blocked). Verify after the next deploy from a browser: `/healthz`, the homepage claims, and the key probe.

## Perplexity's blockers and gaps (verbatim list, condensed)

1. Production is stale until the intended commit is verified live.
2. Deployment automation unresolved; keep a manual release procedure with rollback (Railway "redeploy" of the last good snapshot).
3. Patent-status wording: "patent-pending" on the site versus "not filed" in the internal disclosure. One sentence, everywhere, before launch.
4. Owner login and MFA unproven in production (see the absent variables above).
5. Backups unproven: no BACKUP_DIR, no restore test.
6. Public key-probe endpoint: protect or accept deliberately.
7. Verify deployed commit, schema creation on an empty database, and startup on an existing one.
8. End-to-end flows to test on production: owner login, lead submission and its email, Calendly hand-off, an AI advisor answer, one scheduled sweep.
9. Monitoring and alerting: none configured beyond Railway's own.
10. Single replica: in-process timers restart with the container; sweeps are idempotent by design, missed runs catch up on the next tick.

## First three things to verify after the next deploy

1. The deployed commit hash matches master, `/` and `/healthz` answer, and the homepage shows the fifteen claims in the owner's wording with the serif filament titles.
2. Owner login path works (managed auth), and an unauthenticated visitor cannot reach owner-only procedures.
3. Submit one lead from the homepage card; confirm it lands in the database and the notification email arrives.

## Product items still open, by the owner's own orders

- Interior portal theming: waiting on the designer's interior instructions and the new city images.
- Outside-forces engines (inflation panel, home-ownership odds, credit availability, money supply, car sales, travel): not started.
- Registries the owner fills: attorneys, income rate sheets, LTC filings.
- One filing-status sentence for the patents.
- Homepage claims 09, 12, 14 and 15 still carry the earlier copy; the owner is dictating replacements one at a time.
