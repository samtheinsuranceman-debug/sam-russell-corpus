# Build status and what to build next (handoff for Grok)

Read `01_FINANCIAL_LIBRARIAN_SPEC.md` and `02_ASSESSMENT_AND_JOURNEY_DATA.md`
first. This file is the running ledger: what is done, what was verified, and the
next work in priority order. Do not undo the rules in the spec.

## Done and merged to `master`

- Public homepage rebuilt around the six crisp images; published as a single
  file (`docs/index.html`, GitHub Pages workflow) and mirrored in the React app;
  parity test keeps the two in step.
- Lead pipeline: homepage estimator → `public_leads` (IP, consent, fact finder,
  advisor-only analysis) → owner alert email → prospect acknowledgement →
  owner lead inbox with CSV export. Live smoke test: `scripts/smoke_lead_capture.mjs`.
- Owner sign-in for self-hosted installs (bcrypt hash in env; rate-limited), so
  `/portal/*` works on cPanel/VPS without the managed OAuth server.
- Database: 117-table schema as `database/rcs-schema.sql`; `pnpm db:build`
  applies and verifies it. Deploy bundle installs and runs from a clean unzip
  with plain npm. Mail via Resend or plain SMTP.
- **Financial Assessment** (15 sections, ~190 questions) with autosave,
  completeness, and the printable Financial Analysis Document.
- **Financial Librarian / tape recorder** with the assessment gate, unlimited
  Q&A, and the journey composer (3–5 core questions, emergent question,
  10–15 real pages in building order).
- Navigation group **New Client Welcome List**: Financial Assessment → AI
  Financial Advisor → Wealth Genome Analysis → The Arrival … The Brotherhood.
- One-command release: `pnpm release` (typecheck → docs/index.html → schema SQL
  → public-surface tests → build + bundle guard → deploy zip → code book).

## Verified how

- Full vitest suite against a real MariaDB: all passing (see the latest PR).
- Browser (headless Chromium) against the production build: sign in → compliance
  signature → assessment complete → advisor answers → JOURNEY renders the core
  questions, emergent question and ordered steps.

## About the "Grok checkpoint" zip

`GrokRussell_Capital_Systems_Checkpoint_bcfe0624.zip` was compared file-by-file
with the repository: it contains **no page that is not already in the repo**
(it is an older snapshot). The seven journey pages it refers to (The Arrival …
The Brotherhood, with `_genome/GenomeKit.tsx`) and the Fact Finder / Wealth
Genome pages were already merged; they are now grouped under New Client Welcome
List, with the Wealth Genome page given a portal route (`/portal/wealth-genome`).
One caveat for the owner: those pages are visually from the purple "genome"
design and the public homepage is emerald/neon; the portal shell is purple, so
inside the portal they match. `WealthGenomePage` still shows placeholder scores
(it is not yet driven by the assessment) — see next steps.

## Next steps, in order

1. **Drive the Wealth Genome from the assessment.** Replace the placeholder
   dimension scores in `client/src/pages/WealthGenomePage.tsx` with scores
   computed from `factFinderSignals()` / the assessment (income stability, tax
   efficiency, insurance coverage, retirement readiness, estate planning, debt
   management, diversification, risk mitigation). Keep it explanatory, no
   guarantees.
2. **Journey progress on the pages themselves.** When a client opens a journey
   step, show a small "Step N of M — next: …" bar (read `librarian.latestJourney`)
   so the journey carries them page to page. Mark steps visited server-side
   (add `visitedAt` per step to `client_journeys.journey`).
3. **Calculators pre-filled from the assessment.** Mortgage Killer, Income Gap,
   Roth Strategies, Market Stress Test: read the relevant assessment fields on
   load so the client does not retype. Keep the assessment the single source.
4. **Advisor view of a client's assessment and journey.** In the client
   directory, show the client's completeness, the Financial Analysis Document,
   and their latest journey; let the advisor ask the librarian *about* a client
   (same gate, client's data).
5. **Voice.** With `ELEVENLABS_API_KEY`/`ELEVENLABS_VOICE_ID` set the deck speaks
   in the cloned voice. Consider streaming for long answers.
6. **More catalog coverage.** Any planning page not yet in
   `shared/journeyCatalog.ts` cannot be recommended; add it with honest tags.
7. **Owner tasks (not code):** GitHub Pages → Source: GitHub Actions; set
   `OWNER_EMAIL`/`OWNER_PASSWORD_HASH`, `DATABASE_URL`, mail (`SMTP_*` or
   `RESEND_API_KEY`), AI keys; rotate the published credentials (see PR #10).

## Working agreements for Grok on this repo

- Build on a branch and open a PR to `master`; never force-push or delete files
  you did not create. (PR #3 destroyed content and had to be restored.)
- No secrets in code, tests, docs or commit messages. No fabricated numbers,
  results, or patent statuses ("patent-pending / in process" only).
- Run `pnpm check` and `pnpm release` before pushing; the tests encode the rules.
