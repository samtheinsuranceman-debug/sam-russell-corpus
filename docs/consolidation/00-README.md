# Consolidation — Foundation PR

**Branch:** `claude/consolidation-foundation-hvzdvq`
**Base:** `sam-russell-corpus` @ `master`
**Date:** 2026-09-20
**Scope of this PR:** documentation, inventory, and verification evidence only.
**No application code is imported, moved, or modified by this PR.**

---

## Owner decision being implemented

> Use `sam-russell-corpus`, the LIVE build, as the sole canonical consolidation
> base.
>
> Do not move DNS, domains, production traffic, hosting, databases, or
> credentials. Do not merge repositories wholesale. Do not overwrite or replace
> the live engine registry, calculator registry, route manifest, or existing
> tests without a documented comparison and regression proof.
>
> Treat `russell-capital-app` as a donor for its 18 gamification routes and its
> Postgres/Vercel implementation patterns. Treat `russell-capital` as a donor
> for the Sacred Seven, behavioral schema, and individually selected
> page/content modules. Every other repository is a donor, reference, or
> archive candidate — not an automatic merge candidate.

This PR is the foundation gate that decision requires. Nothing migrates until
it is green.

---

## One correction to the premise, stated up front

The decision calls `sam-russell-corpus` "the LIVE build." **It is the canonical
build, but it is not the deployed one.** Both facts matter and they do not
conflict with the decision.

| Question | Evidence |
|---|---|
| What serves `russellcapitalsystems.com`? | Vercel project `russell-capital-app` (`prj_qlwyUEPUh2JzPxIwwSezsj7D5yCH`). `www.russellcapitalsystems.com` is verified on that project; the apex 307-redirects to `www`. It also serves `russellcapitalsolutions.com`. |
| Which repo does that project build from? | `samtheinsuranceman-debug/russell-capital-app`, branch `master` (Vercel deployment metadata `githubRepo` / `githubCommitRef`). |
| Does `sam-russell-corpus` deploy anywhere? | No `vercel.json` anywhere in the repository. It is not connected to a Vercel project. |

So `russell-capital-app` is the **current deployment target**, while
`sam-russell-corpus/russell-capital-systems/` is the **best-attested source of
truth** — it is the only candidate with a chain of custody (see below). The
decision to consolidate into the corpus and defer deployment is coherent, and
it is consistent with the instruction not to move DNS or hosting. Deployment
becomes a separate, explicitly approved step once consolidation is complete.

**Why the corpus is the right canonical base**, independent of the domain
question — it is the only candidate that can prove what it is:

- `PROVENANCE.md` records it as reconstructed checkpoint `bcfe0624`, 1,073
  source files, delivered as a 3-part split archive.
- `PARTS_MANIFEST.json` carries a SHA-256 for every file; reconstruction was
  verified with **0 missing, 0 mismatches**.
- Three deliberate post-verification deviations are documented in
  `PROVENANCE.md` (Slack placeholder neutering in 9 files; the addition of the
  provenance and manifest files themselves; demo client-count scaling in 7
  files).
- `audit/` retains recorded vitest and route-smoke results from that checkpoint.

Neither `russell-capital-app` nor `russell-capital` has any equivalent.

---

## The finding that shapes the entire migration

The corpus and the app are **near-complementary, not subset and superset.**

| Dimension | corpus (`russell-capital-systems`) | `russell-capital-app` (deployed) | `russell-capital` (twin) |
|---|---|---|---|
| Portal pages | 261 | 620 | 630 |
| Top-level pages | 64 | 61 | 59 |
| **Shared engines (`shared/*.ts`)** | **174** | 62 | 64 |
| Routes declared in `App.tsx` | 330 | 652 | 621 |
| DB dialect | **MySQL** (`drizzle-orm/mysql2`) | **PostgreSQL** (`drizzle-orm/postgres-js`) | PostgreSQL |
| **Schema tables** | **155** | 116 | 116 |
| Provenance / integrity manifest | ✅ | ✗ | ✗ |
| Deployed | ✗ | ✅ | ✗ |

Overlap, corpus vs app:

| Set | Only in corpus | In both | Only in app |
|---|---|---|---|
| Portal pages | 60 | 201 | **419** |
| Shared engines | **116** | 58 | 4 |
| Routes | 103 | 227 | 385 |

**Read this carefully, because it sets the size of the job:**

- The corpus is the **engine and schema repository**. It holds 116 shared
  engines the deployed app does not have, and 39 more database tables. The app
  holds only 4 engines the corpus lacks.
- The app is the **page repository**. It holds 419 portal pages the corpus does
  not have.

Choosing the corpus as canonical base is the right call for engines, schema,
and provenance. The cost it accepts is that **419 portal pages and 385 routes
must be migrated inward**, rather than the 60 pages plus 116 engines that the
reverse choice would have required. That is a materially larger migration, and
it is why the phased plan in `06-phased-pr-plan.md` runs to 14 PRs rather than
4. The decision stands; this document records what it costs so the schedule is
honest.

---

## Unresolved input: the "391 pages" figure

The decision asks for a route collision and dependency report for "the proposed
391 pages." No set of 391 pages can be derived from the repositories:

| Candidate set | Count |
|---|---|
| Corpus portal pages | 261 |
| Corpus portal + top-level | 325 |
| Union of all three repos' portal pages | **691** |
| Corpus portal + app-only portal | 680 |

`04-route-collision-and-dependencies.md` therefore reports collisions across
**every** set that can be defined from the repositories, so the answer is
present whichever set 391 refers to. **Please confirm which set it is** — if it
is a curated selection produced by another session, point me at the list and I
will re-cut the report against it exactly.

---

## Documents in this PR

| # | Document | Decision requirement |
|---|---|---|
| 1 | [`01-repository-inventory.md`](01-repository-inventory.md) | Complete repository and capability inventory |
| 2 | [`02-capability-matrix.md`](02-capability-matrix.md) | One chosen implementation per engine, calculator, route, schema, shared module |
| 3 | [`03-base-verification.md`](03-base-verification.md) | Base installs, typechecks, builds, runs its reported tests |
| 4 | [`04-route-collision-and-dependencies.md`](04-route-collision-and-dependencies.md) | Route collision and dependency report |
| 5 | [`05-ci-secrets-rollback.md`](05-ci-secrets-rollback.md) | CI checks, secret scanning, rollback/tag instructions |
| 6 | [`06-phased-pr-plan.md`](06-phased-pr-plan.md) | Phased PR plan with source/target paths, test criteria, rollback |

Machine-readable supporting data is in [`data/`](data/) — page sets, engine
sets, per-repo route→component maps, and the collision table. Every count in
these documents is reproducible from those files.

---

## What this PR explicitly does NOT do

- Does not move DNS, domains, production traffic, hosting, databases, or credentials.
- Does not merge any repository wholesale.
- Does not modify the engine registry, calculator registry, route manifest, or
  any existing test.
- Does not import a single line of application code.
- Does not deploy anything.

## Gate

Migration PRs begin only after this document set is reviewed and the 391-page
question is resolved. Each subsequent PR migrates **one bounded capability**,
per `06-phased-pr-plan.md`.
