# Site audit — 16 Sep 2026 (outside-in, GitHub Actions runner, Playwright/Chromium)

Workflow: `.github/workflows/site-audit.yml` → script `.github/audit/site-audit.mjs`. Artifact `site-audit` holds report.json + screenshots.

## Run 1 (before fixes) — findings
| # | Finding | Fix |
|---|---|---|
| 1 | 18 cards on `/calculators` linked to `/portal/<slug>` routes that do not exist → HTTP 404 | Remapped every card to the route that implements it (`MassiveCalculatorsPage.tsx`) |
| 2 | `/api/founder-message.mp3` → 404 (homepage audio player) | Rendered the message in the owner's cloned voice, committed `client/public/founder-message.mp3`, served first; live synthesis only as fallback; player hides on error |
| 3 | Login form test could not submit | Sign-in is gated behind 5 acknowledgement checkboxes; audit now ticks them (by design, not a bug) |

## Run 2 (after fixes, deployment 3fcb3fea, commit a4055ad)
- Apex `https://russellcapitalsystems.com/` → 200 (GitHub Pages) → lands on the app. Verified.
- Pages crawled 76, OK 76, bad 0. Console errors 0. Uncaught page errors 0. Same-origin 4xx/5xx 0.
- Buttons clicked 46; the only 2 "failures" are the intentionally disabled sign-in button.
- Homepage lead form: submits, page renders the coordinated-strategy output (one test lead "AUDIT TEST-IGNORE" created).
- Login with wrong password: error shown, no crash.
- `/api/founder-message.mp3`: serves MP3 bytes (ElevenLabs C2PA-tagged).
- Security headers on app responses: CSP, HSTS (preload), X-Frame-Options SAMEORIGIN, nosniff, Referrer-Policy, Permissions-Policy.

## Not covered (panel review: GPT-5, Grok 4.3, Perplexity)
- Authenticated portal flows (need an access passcode for the runner; store as repo secret `AUDIT_PASSCODE`).
- Calculator numerical correctness; back-end side effects (lead email/CRM); payments.
- Mobile viewports, Firefox/WebKit, accessibility (axe), performance budgets, API-failure resilience.
- `www.russellcapitalsystems.com`: blocked by GoDaddy identity hold (see DOMAIN_RUNBOOK.md).
- Canonical/og:url on app pages point at `https://www.…` (PUBLIC_BASE_URL); correct once www is live.

## Honest status line
The public, anonymous site is live at https://russellcapitalsystems.com and functionally clean on every crawled page and control.
"All buttons and features work" cannot be claimed for the portal until an authenticated audit runs.
