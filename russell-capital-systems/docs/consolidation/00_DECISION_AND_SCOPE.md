# Consolidation — Decision and Scope

**Status:** Foundation PR. No application code in this change.
**Branch:** `claude/consolidation-foundation`
**Date:** 2026-09-20

---

## The decision

`samtheinsuranceman-debug/sam-russell-corpus`, subfolder `russell-capital-systems/`,
branch `master`, is the **sole canonical consolidation base**. Every other
repository is a donor, a reference, or an archive candidate. Nothing is an
automatic merge candidate.

## Standing constraints

These hold for the whole programme, not just this PR:

- **No DNS, domain, production traffic, hosting, database, or credential changes.**
- **No wholesale repository merges.**
- **No overwriting** the engine registry, calculator registry, route manifest, or
  existing tests without a documented comparison and regression proof.
- **No production deployment without separate explicit approval.**

## Why a branch push is safe

Verified against the workflow definitions in this repo:

| Workflow | Trigger | Reaches production? |
|---|---|---|
| `deploy-branch.yml` | `push` to **`master`** only, paths `russell-capital-systems/**` | Yes — publishes the `deploy/rcs` subtree Railway deploys |
| `pages.yml` | `push` to **`master`** only, paths `docs/**` | Yes — publishes GitHub Pages |
| `rcs-security-audit.yml` | `pull_request`, `schedule`, manual | No |
| The other 9 probes | `workflow_dispatch` only | No |

**The deployment boundary is a merge to `master`, not a push to a branch.** Work on
`claude/consolidation-foundation` cannot reach Railway or Pages. That property is
load-bearing for this whole plan and must not be changed without saying so.

One consequence to keep in mind: because `pages.yml` watches `docs/**` at the
**repo root**, and this documentation lives at
`russell-capital-systems/docs/consolidation/`, these files do not touch the Pages
publish path. They also fall under the `deploy-branch.yml` path filter
(`russell-capital-systems/**`), so on eventual merge to `master` they will trigger
one subtree re-publish. That publish carries documentation only — no runtime
change — but it is a real Railway redeploy and should be expected.

---

## Corrections to the brief

Four assumptions in the consolidation brief do not match what is in the code. They
are recorded here rather than silently worked around, because two of them would
have sent the first migration PRs at the wrong repository.

### 1. The Sacred Seven is already live. `russell-capital` does not have it.

The brief assigns `russell-capital` as donor for the Sacred Seven. Measured:

| Page | live | russell-capital | russell-capital-app |
|---|---|---|---|
| TheArrival, TheBrotherhood, TheField, TheLegacy, TheMap, TheMirror, TheStrategyTable | **all 7 present** | **none present** | all 7 present |

The live build also carries `server/fieldRouter.ts` behind them and seven
`audit/page_inputs/*.json` entries describing them. **There is nothing to import.**
If the intent was to bring across a *different or improved* Sacred Seven, the only
candidate source is `russell-capital-app`, and that needs a file-level diff against
live before anyone calls it an improvement.

### 2. `russell-capital-app` has no gamification pages. `russell-capital` does.

The brief assigns `-app` as donor for "18 gamification routes." Measured across
the 17 gamification pages this programme has previously identified:

- **In `russell-capital-app`: 0.** Its only adjacent page is `Leaderboard.tsx`.
- **In `russell-capital`: 17.**
- **Already in live: 8** — Arena, BlackMirror, Endgame, InfiniteScroll, PetSystem,
  RewardsVault, SocialNarcotic, ToiletDashboard.
- **Actually missing from live: 9** — EliteShowdown, EntrainmentEngine,
  GamifiedPavlovianEngagement, HolographicMirage, MoatFortress,
  PredictiveInsightArena, StrategyComparisonArena, WealthOdyssey,
  WealthWarriorChallenges.

So the gamification donor is **`russell-capital`, not `russell-capital-app`**, and
the scope is **9 pages, not 18**. If the intended 18 is a different set, name it and
this report will be regenerated against it.

### 3. The Postgres/Vercel read on `-app` is correct — and that makes it a fork, not a parts bin.

Confirmed: `-app` is `drizzle-orm/pg-core` with `vercel.json` and `api/index.ts`.
Live is `drizzle-orm/mysql-core` on Railway. `russell-capital` is also MySQL.

This is worth stating precisely because it changes what "donor" means for that
repo. `-app` is an **architectural fork on a different SQL dialect and a different
host**, so:

- **UI-only code** can port with ordinary review.
- **Anything touching the database** — schema, queries, migrations, Drizzle types —
  is a dialect migration, not a copy. `pgTable` → `mysqlTable` is the least of it;
  `serial`, `jsonb`, array columns, `ON CONFLICT`, and returning-clauses all differ.
- **Vercel patterns do not transfer as-is.** `api/index.ts` is a Vercel serverless
  entry. Live runs a long-lived Express process on Railway. Treat `-app` as a
  *reference* for how something was solved, not as source to lift.

### 4. "391 pages" does not match any measured figure.

Measured route counts from each `App.tsx`:

| | routes |
|---|---|
| live | **330** (and `shared/routeManifest.ts` is exactly in sync — 330 entries) |
| russell-capital | 664 |
| russell-capital-app | 612 |

The candidate pool — donor routes **not** already in live — is **438**, not 391.
Nearest measured neighbours are 385 (`-app` minus live) and 382 (present in both
donors). Rather than guess which was meant, this plan proceeds on the measured 438
and the full list is enumerated in `data/route-collisions.json`. If 391 came from a
specific prior document, point at it and the delta will be reconciled line by line.

---

## Five parallel foundation PRs already exist

Measured on the repository, 2026-09-20. Several sessions each received this brief
and each independently built a foundation PR:

| PR | Branch | Target |
|---|---|---|
| #146 | `claude/consolidation-foundation` | `master` — most accumulated work; two Copilot PRs (#150, #152) already target its branch |
| #147 | `consolidation/foundation` | `master` |
| #148 | `claude/consolidation-foundation-hvzdvq` | `master` |
| #149 | `claude/russell-capital-consolidation-6dwkg2` | `consolidation/main` |
| #153 | `claude/foundation-consolidation-audit` | `master` |

**This one makes six.** It was opened under explicit instruction to produce a
single self-contained foundation PR, and it is self-contained precisely so it can
stand alone or be discarded wholesale without untangling it from the others.

**Recommendation: pick exactly one and close the rest before Phase 1 begins.**
Otherwise the first migration gets built five or six times. Where these documents
and the others agree — the Sacred Seven already being on the base, zero
gamification pages in `russell-capital-app`, the base winning by default — they
were reached independently, which is worth something as corroboration.

Nothing in this PR modifies any other PR's branch.

## Two hygiene findings

**No pull-request verification gate exists.** Of 12 workflows, only
`rcs-security-audit.yml` runs on `pull_request`. Nothing runs install, typecheck,
build, or tests against a PR. This PR adds that gate — see
`05_CI_SECRETS_ROLLBACK.md`. Until it lands, every migration PR's green-ness is a
claim rather than a check.

**A build artifact is tracked in git:**
`node_modules/.vite/vitest/da39a3ee.../results.json` at the corpus root. Harmless
but it means `node_modules/` is not fully ignored at the root. Flagged, not fixed —
fixing it is a separate change and out of this PR's scope.

---

## A disclosure about prior work in this session

Before this decision was made, this session audited `samtheinsuranceman-debug/russell-capital`
and concluded *it* was the live build. **That conclusion was wrong.** The evidence
used — the domain string appearing in server source — is present in that repo
because it shares lineage with the live build, not because it serves the domain.
`sam-russell-corpus` was mis-triaged as a personal-corpus archive from its name and
never opened. The live build was identified correctly only once `LAUNCH.md` and the
Railway configuration in this repo were read.

Five commits were pushed to `samtheinsuranceman-debug/russell-capital` on branch
`claude/russell-capital-consolidation-pe793n` under that mistaken belief. **None
reached `master` in any repository and none touched production.** Their content now
enters this programme as ordinary donor material with no special standing:

| Artifact | What it is | Standing here |
|---|---|---|
| 41 hub pages + `ToggleHub` | Lifted from `russell-capital-app`, nests 226 duplicate tools as tabs | Donor candidate. Live already solved route sprawl differently — see `02_CAPABILITY_MATRIX.md` |
| `shared/plasticToCash.ts` + page | New, authored in this session | Donor candidate. **Unproven against live.** No test coverage |
| `shared/mutualCarriers.ts` + page | New, authored in this session | Donor candidate. **Unproven against live.** No test coverage |
| `shared/nlpCalibration.ts` + calibration layer | New, authored in this session; modifies `SYSTEM_PREAMBLE` | Donor candidate. **Touches every AI call site — highest-risk item in the pool.** Must not be ported without its own PR and regression proof |
| `client_calibration` table, migrations 0056/0057 | New, MySQL | Donor candidate. Migrations were **never applied** — no database was reachable |

Authoring something does not make it canonical. Each of these goes through the same
comparison gate as any other donor artifact.

---

## What this PR contains

Documentation, data, and CI only.

| File | Deliverable |
|---|---|
| `00_DECISION_AND_SCOPE.md` | This document |
| `01_REPOSITORY_INVENTORY.md` | (1) Repository and capability inventory |
| `02_CAPABILITY_MATRIX.md` | (2) Authoritative chosen implementation per capability |
| `03_VERIFICATION_EVIDENCE.md` | (3) Live build installs, typechecks, builds, tests |
| `04_ROUTE_COLLISION_REPORT.md` | (4) Route collision and dependency report |
| `05_CI_SECRETS_ROLLBACK.md` | (5) CI, secret scanning, rollback and tags |
| `06_PHASED_PR_PLAN.md` | (6) Phased plan, per-migration |
| `data/capability-matrix.json` | Machine-readable matrix |
| `data/route-collisions.json` | Machine-readable route data, all 438 + 236 |
| `.github/workflows/rcs-verify.yml` | The PR gate — install, typecheck, build, three-way route check, tests, dependency audit, gitleaks |

**No file under `client/`, `server/`, `shared/`, or `drizzle/` is touched.**
