# Consolidation — Foundation

**Base of record:** `russell-capital-systems/` in this repository — the live build serving
`www.russellcapitalsystems.com`.
**Branch:** `claude/consolidation-foundation`
**Date:** 2026-09-20

This directory is the foundation required before any application code is imported. It
contains no application code and changes no behaviour.

## Why this directory sits outside `russell-capital-systems/`

`.github/workflows/deploy-branch.yml` triggers on **push to `master`** with
`paths: ["russell-capital-systems/**"]`. It force-pushes the `deploy/rcs` subtree and then
calls Railway's API to deploy service `e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28` in environment
`fe806289-faed-4850-b030-b47f8dc4c70f` — the `web` service behind
`www.russellcapitalsystems.com`.

**Merging anything under `russell-capital-systems/**` to `master` is a production deploy.**

So this foundation PR touches only `consolidation/` and `.github/workflows/`. Merging it
cannot deploy. Every later migration PR *does* touch the deploy path and therefore needs the
separate explicit approval already required.

## The documents

| # | Document | Answers |
|---|---|---|
| 1 | [01-repository-inventory.md](01-repository-inventory.md) | What exists, what each repo is, what it may donate |
| 2 | [02-capability-matrix.md](02-capability-matrix.md) | The one chosen implementation of each engine, calculator, route, schema and shared module |
| 3 | [03-baseline-verification.md](03-baseline-verification.md) | Proof the live build installs, typechecks, builds and tests green |
| 4 | [04-route-collisions-and-dependencies.md](04-route-collisions-and-dependencies.md) | Collision and dependency report for the candidate 391 |
| 5 | [05-ci-secrets-rollback.md](05-ci-secrets-rollback.md) | CI checks, secret scan results, tagging and rollback |
| 6 | [06-phased-pr-plan.md](06-phased-pr-plan.md) | Per-migration source paths, target paths, tests, rollback |

Raw generated data is in [`data/`](data/).

## Headline findings

1. **The live build is green.** Full suite: 216 files, **4138 tests passing, 0 failing**.
   `tsc --noEmit` clean, `pnpm build` clean. This is a healthy base, and every migration is
   measured against it.

2. **The "391" is a route count, not a page count.** `russell-capital` registers exactly
   **391 route paths the live build does not have**. It is the *maximum candidate surface*
   from that donor, not an approved scope — and the approved scope is far smaller (§4).

3. **The Sacred Seven are already in the base.** `docs/source-manifest.md` records them as
   the eight-file "addition release" (seven Experience components + `GenomeKit.tsx`), already
   imported. All eight are present in `russell-capital-systems` and **absent from
   `russell-capital`**. That donor line item is already closed; `russell-capital` cannot
   donate what it does not have. (§2)

4. **Collisions are few and specific.** Only **6 paths** collide between `russell-capital` and
   the base, **7** for `russell-capital-app`. Two are high-risk (`/` and `/portal`); the rest
   are the base's newer `*Page` wrappers versus the donor's older components. (§4)

5. **The base is the superset where it counts.** shared/ 187 vs 63; server/ 147 vs 49; schema
   155 tables vs 116. The donors are ahead in only 7 tables and a handful of modules. (§2)

6. **"18 gamification routes" could not be reproduced.** By name and by content signal the
   count lands at 15, and the set lives overwhelmingly in **`russell-capital`**, not
   `russell-capital-app` — which holds only 6 of them. This needs your confirmation before
   the phase runs. (§2, §6)

7. **No production secrets found** in the base's tracked files. Two localhost dev credentials
   appear in a handoff transcript. (§5)

8. **No CI runs the build's own tests.** Twelve workflows exist; none installs, typechecks,
   builds or tests `russell-capital-systems`. The gate this consolidation depends on does not
   exist yet, so this PR adds it. (§5)
