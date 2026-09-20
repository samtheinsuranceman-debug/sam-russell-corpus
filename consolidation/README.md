# Consolidation — Foundation

**Branch:** `claude/russell-capital-consolidation-kbwl81`
**Base:** `master` @ `76ed5f2`
**Date:** 2026-09-20

This directory is the foundation package required before any application code is
imported. **It contains no application code.** It adds documentation, generated
analysis data, and one CI workflow. Nothing under `russell-capital-systems/` is
modified by this PR.

## Canonical base

`sam-russell-corpus/russell-capital-systems` is the sole consolidation base.
Everything else is a donor, reference, or archive candidate.

## Why these files live at the repo root, not under `russell-capital-systems/`

`.github/workflows/deploy-branch.yml` fires on **push to `master` with paths
matching `russell-capital-systems/**`**, and republishes the `deploy/rcs` branch
that Railway deploys. Any merge that touches that subtree ships to production.

This package is therefore placed at `consolidation/` at the repo root so that
merging it **cannot trigger a deployment**. See
[05_CI_SECRETS_ROLLBACK.md](05_CI_SECRETS_ROLLBACK.md) §3 — this is the single
most important operational constraint on the whole migration, and it governs
how every later PR must be targeted.

## Contents

| # | Document | What it settles |
|---|---|---|
| 1 | [01_REPOSITORY_INVENTORY.md](01_REPOSITORY_INVENTORY.md) | Every repo, its role, and its capabilities |
| 2 | [02_CAPABILITY_MATRIX.md](02_CAPABILITY_MATRIX.md) | The one chosen implementation of each engine, calculator, route, schema, shared module |
| 3 | [03_BASELINE_VERIFICATION.md](03_BASELINE_VERIFICATION.md) | Proof the base installs, typechecks, builds, and tests green |
| 4 | [04_ROUTE_COLLISION_REPORT.md](04_ROUTE_COLLISION_REPORT.md) | The 391 routes, their collisions, and dependencies |
| 5 | [05_CI_SECRETS_ROLLBACK.md](05_CI_SECRETS_ROLLBACK.md) | CI checks, secret scan results, rollback and tagging |
| 6 | [06_PHASED_PR_PLAN.md](06_PHASED_PR_PLAN.md) | Per-migration source path, target path, tests, rollback |
| 7 | [07_BASE_REPO_HEAD_TO_HEAD.md](07_BASE_REPO_HEAD_TO_HEAD.md) | **Open decision** — which repo is the single app repo, both candidates gate-tested |

Generated data (machine-readable, regenerable):

- `data/raw_routes.json` — every route + component, per tree
- `data/route_collision_report.json` — full collision and dependency analysis

## Three findings that change the brief

The brief made three assumptions that the evidence contradicts. Each is
documented with its verification command.

1. **The 18 gamification routes are in `russell-capital`, not
   `russell-capital-app`.** `russell-capital-app` contains **0 of 18** — that
   build deleted them. Nine of the eighteen are **already in the canonical
   base**. Only **nine** actually need migrating.
   → [02_CAPABILITY_MATRIX.md](02_CAPABILITY_MATRIX.md) §3

2. **The Sacred Seven are already in the canonical base**, in a *more* developed
   form than either donor, and are **absent from `russell-capital`** at
   `origin/main`. Nothing to migrate; a comparison is included instead.
   → [02_CAPABILITY_MATRIX.md](02_CAPABILITY_MATRIX.md) §4

3. **391 is exactly right, and it means something specific:** it is the count of
   routes in donor `russell-capital` that do **not** exist in the canonical base
   (`|R − C| = 391`). It is not a page count, and it is not the migration
   backlog — 229 of those routes collide with canonical routes that already
   work.
   → [04_ROUTE_COLLISION_REPORT.md](04_ROUTE_COLLISION_REPORT.md) §1

## Regenerating the analysis

```bash
python3 consolidation/data/regenerate.py          # rewrites both JSON files
```

Requires all three trees checked out locally; paths are at the top of the script.
