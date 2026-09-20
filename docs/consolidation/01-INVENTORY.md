# 1 — Repository and Capability Inventory

**Compiled:** 2026-09-20
**Canonical base:** `sam-russell-corpus` → `russell-capital-systems/`
**Status of every other repository:** donor, reference, or archive candidate. None is an automatic merge candidate.

---

## 1.1 The canonical base

`sam-russell-corpus/russell-capital-systems/` is the live application. It is
served two ways from one repository:

| Host | Mechanism | Source |
|---|---|---|
| `russellcapitalsystems.com` (apex) | GitHub Pages | `docs/`, published by `.github/workflows/pages.yml` on push to `master` |
| `www.russellcapitalsystems.com` | Railway, project `RCS`, service `web` | `deploy/rcs` branch, kept in sync by `.github/workflows/deploy-branch.yml` |

**Operational fact that governs this entire plan:** `deploy-branch.yml` fires
on `push` to `master` filtered to `paths: ["russell-capital-systems/**"]`. It
splits the subtree to `deploy/rcs` and POSTs Railway service
`e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28`.

> **Merging any capability PR into `master` deploys it to production
> automatically.** There is no manual gate between merge and deploy. Section 5
> of the CI document proposes the change that fixes this; until it is in
> place, capability PRs must target a long-lived consolidation branch rather
> than `master`.

### Measured size (master, 2026-09-20)

| | Count |
|---|---|
| Portal page components | 260 |
| Top-level page components | 64 |
| Portal routes registered | 306 |
| Total routes in manifest | 331 |
| Shared modules (`shared/*.ts`) | 174 |
| Server files | 336 |
| Test files | 225 (216 pass, 9 skipped) |
| Individual tests | 4,220 (4,138 pass, 82 skipped) |
| Calculators in registry | 117 |
| Database tables | 115 |

---

## 1.2 Donor repositories

### `russell-capital-app` — donor for gamification and platform patterns

Private, TypeScript, ~6.1 MB, default branch `master`, HEAD `ef74f3f`
(2026-09-05). React 19 + Vite 7 + tRPC v11, **ported to PostgreSQL**
(`postgres.js`, Aiven PG 17), deployed on **Vercel** via `vercel.json`
(single serverless function `api/index.ts`, `maxDuration: 60`).

| | Count |
|---|---|
| Portal pages | 619 |
| Portal routes | 593 |
| Shared engines | 62 |
| tRPC procedures | 443, in a 9,740-line `routers.ts` |
| DB tables | 117 |
| Test files | 98 |

**Approved donations:**
1. **18 gamification routes** — the only place they exist:
   `/portal/arena`, `/pet`, `/rewards`, `/social`, `/wealth-reels`,
   `/entrainment-engine`, `/pavlovian-engagement`, `/wealth-warrior`,
   `/wealth-odyssey`, `/black-mirror`, `/moat-fortress`, `/endgame`,
   `/elite-showdown`, `/predictive-arena`, `/holographic-mirage`,
   `/infinite-scroll`, `/toilet`, `/strategy-comparison`.
   *(Note: several of these names already exist in the live build's routes —
   see the collision report before importing any of them.)*
2. **Postgres and Vercel implementation patterns** — as reference for a future
   migration. **No database migration is in scope and none is proposed here.**

**Known defects in this donor, carried forward as warnings:**
- `// @ts-nocheck` is pervasive across portal pages, contexts and
  `toolSearchIndex.ts` — typechecking is effectively disabled for most of it.
  Anything imported must be typechecked on arrival, not assumed.
- `calendarService.ts` interpolates user-controlled JSON into `execAsync`
  (command-injection surface). **Do not import.**
- `client/src/hooks/engine_montecarlo.ts` has a correlated-normals bug: every
  independent is drawn from `mean[0]`/`covariance[0][0]`, then `mean[i]` is
  added on top of `L·z`, so means are double-counted and per-asset vols
  ignored. **Do not import; the live build's `monteCarloEngine.ts` is correct.**
- Committed dead weight: `App.tsx.orig` (130 KB),
  `App.tsx.BACKUP-BEFORE-SURGERY` (139 KB), `householdWealth.bak.ts`,
  `CONSOLIDATION_PLAN.json` (1 MB).
- Auth env surface includes `ETERNAL_PASSWORD`, `ETERNAL_PASSWORD_2`,
  `DASHBOARD_PASSWORDS`, `ADMIN_DASHBOARD_PASSWORD` — several parallel
  privileged-access paths. **Do not import auth.**

### `russell-capital` — donor for pages, Sacred Seven, behavioral schema

Private, single commit `863b3f0` (Aug 12 2026), **not deployed anywhere**.
MySQL. No deployment config of any kind — no `vercel.json`, `netlify.toml`,
`Dockerfile`, `Procfile`, `.replit`, or CI workflow.

| | Count |
|---|---|
| Portal pages | 628 |
| Portal routes | 601 |
| Shared engines | 62 |
| Server files | 129 |

**Approved donations:** the Sacred Seven, the behavioral schema, and
individually selected page and content modules. Selection is governed by
document 04 (collision and dependency report), not by bulk copy.

**Measured against the live build:** 391 routes exist here and not in live;
**210 route paths exist in both**. Of those 210, the live implementation is
already larger in 172 cases.

> **Correction to an earlier claim made in this workstream.** This repository
> was initially reported as serving `russellcapitalsystems.com`. It does not.
> The deployment trace in §1.1 is the correct one. The error is recorded here
> rather than silently removed.

### `Russell-Capital-Calibrate-System` — donor for the behavioral schema

Public, 501 KB, `main`, last push 2026-06-28. React 19 + Vite + Express +
Drizzle/MySQL. 13 pages; the substance is `drizzle/schema.ts` (363 lines,
15 tables), which has **no counterpart in the live build**:

- `voice_breathing_metadata` — `breathingPattern`, `avgInhaleMs`,
  `avgExhaleMs`, `avgHoldMs`, `coherenceScore`, `baselineHeartRate`,
  `voiceToneProfile`, `excitementBaseline`, `confusionBaseline`.
- `behavioral_events` — event-sourced, with an `eventCategory` enum including
  `hesitation`, `breathing` and `emotional_shift`. Paired with
  `session_responses.responseTimeMs`, this makes **hesitation itself a scored
  signal**.
- `vision_board_chapters` / `vision_board_assets` — chaptered narrative with
  `triggerMoment` and `emotionalTone` per chapter.
- `wealth_genome_versions` — genome profiles are **versioned**, so drift over
  time is first-class.
- Soft deletes throughout plus a dedicated `audit_log` table.

**This is a schema donation and therefore a database change.** It is
explicitly out of scope for the foundation PR and for every capability PR
until a separate migration plan is approved.

---

## 1.3 Reference and archive repositories

None of these contain application code to merge.

| Repository | Classification | Contents |
|---|---|---|
| `russell-capital-patents` | **Reference** | 15 core patents (PAT-001–015) with claims, 35 sister inventions (SI-001–035). Maps SI-028…035 to specific engine files and portal routes. All **drafts, not filed**. |
| `russell-capital-analyses` | **Reference — highest data value** | ~3.5 MB machine-readable JSON. 16 scored sales calls on a stable four-model schema; 29-factor Wealth Genome scores with verbatim evidence; `META_REPORT.json`; `TIME_ALLOCATION_ANALYSIS.json`. Wireable to a dashboard with no transformation. |
| `russell-capital-nlp` | **Reference** | 380 calibration questions in three banks (200 / 100 Dewey-grade / 80 meta-state); OPEN↔CONTRACT protocol; 19-part NLP body of knowledge. **The compiled profile JSON does not exist** — it blocks any personalisation feature built on it. |
| `russell-capital-combinations` | **Reference** | 110 mega-combination concepts + 6 six-function combination patents, each with an ordered component pipeline. |
| `russell-capital-skills` | **Reference** | 4 Claude Agent Skills. Contains the close-probability formula and 6 archetypes with measured win rates (71% → 0%). |
| `russell-capital-reports` | **Archive — restricted** | Finished narrative reports. **Contains highly personal material — medical, legal and relationship detail. Must never surface in the application.** Marked confidential by its own README. |
| `Russell-Capital-Solutions-NEW` | **Archive** | Document corpus + a 6.9 MB zip that is a 2026-05-31 snapshot of `russell-capital-app`. Superseded. |
| `Really-Russell-Capital` | **Archive** | 7 files, 581 lines of markdown. A subset of another repo's corpus. |
| `sam-russell-corpus-backup` | **Archive** | May–June 2026 snapshot, pre-application. Provenance only. |
| `sam-russell-catechism-brotherhood` | **Archive** | Already merged into `sam-russell-corpus/catechism/`. |
| `russell-biomedical` | **Archive** | Charter and templates only. Its README states no records have been collected. |
| `russell-capital-domain-redirect` | **Archive — action required** | Holds a `CNAME` for `russellcapitalsystems.com` that **conflicts with the live one**. GitHub Pages permits one. See §1.4. |
| `russell-capital-reports`, `-skills`, `-nlp`, `-combinations`, `-analyses` | — | All five carry the same five boilerplate files (`100_DEWEY_GRADE_QUESTIONS.md`, `META_STATE_QUESTIONS.md`, two `.docx`, `buddy-failure-letter`). Not repo-specific content. |

---

## 1.4 Standing risks found during inventory

Recorded here because they are real, and none of them is fixed by this PR.

1. **Two repositories hold a `CNAME` for the same domain.**
   `sam-russell-corpus/docs/CNAME` (live) and
   `russell-capital-domain-redirect/CNAME` (stale, last pushed 2026-09-05).
   GitHub Pages permits one; the stale file can silently reclaim or conflict.
   **Fix is a one-line deletion in the archive repo — it is a DNS-adjacent
   change and therefore excluded from this PR.**

2. **The registrar is on an identity-verification hold.** Per
   `DOMAIN_RUNBOOK.md` (17 Sep 2026), GoDaddy web edits are blocked and the
   API returns 403. Railway needs two records per custom domain (CNAME plus
   `_railway-verify.www` TXT); only the CNAME was ever created, which is why
   `www` was broken for a week. **Unresolved.**

3. **Three API keys are documented as burned.** `scripts/DEPLOY.md` line 45:
   *"Rotate the 3 burned keys (OpenAI, Mistral, HeyGen) before using them."*
   Not verified as rotated. **Out of scope — credential handling is excluded.**

4. **`deploy-branch.yml` deploys to production on merge to `master`.** See §1.1.

5. **The entire intelligence layer is single-vendor.** `server/_core/llm.ts`,
   `imageGeneration.ts`, `voiceTranscription.ts` and `dataApi.ts` all route
   through Manus Forge, with a hardcoded fallback to
   `https://forge.manus.im/v1/chat/completions` and a hardcoded model
   (`gemini-2.5-flash`). If `BUILT_IN_FORGE_*` is absent, AI, images, voice
   and live data feeds fail or silently fall back to static values — and
   `dataFeedService.ts` will still render a freshness badge. **Noted, not
   changed. It is a candidate capability PR of its own.**
