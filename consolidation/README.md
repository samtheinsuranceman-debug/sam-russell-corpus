# Consolidation foundation — audit only

**This directory contains no application code and changes no application
behaviour.** It is the evidence base required before any capability moves into
the canonical build.

Base of record, by the owner's decision: **`sam-russell-corpus`**, specifically
the `russell-capital-systems/` subtree. Every measurement here was taken against
`origin/master` @ **`76ed5f2`**.

| Document | Answers |
|---|---|
| [01 — Repository inventory](01-REPOSITORY-INVENTORY.md) | What exists, how big, and what each repository is for |
| [02 — Capability matrix](02-CAPABILITY-MATRIX.md) | The one authoritative implementation of each engine, calculator, route, schema and shared module |
| [03 — Build verification](03-BUILD-VERIFICATION.md) | Proof the live base installs, typechecks, builds and passes its tests |
| [04 — Route collision and dependency report](04-ROUTE-COLLISION-AND-DEPENDENCY-REPORT.md) | What the "391 pages" actually are, what they collide with, what they need |
| [05 — CI, secrets, rollback](05-CI-SECRETS-AND-ROLLBACK.md) | The CI gap this PR closes, the secret-scan result, how to undo any merge |
| [06 — Phased migration plan](06-PHASED-MIGRATION-PLAN.md) | One bounded PR at a time, with source paths, target paths, tests and rollback |

## The five findings that change the plan

1. **The live base is fully green.** 4220 tests, 0 failures — including the 26
   test files its own CI script excludes. The acceptance gate for migration
   should be `pnpm run test`, not `pnpm run test:ci`.
2. **The gamification surface is already live.** `experienceRouter.ts` and its
   13 sub-routers are in the base build, and 20 gamification portal routes with
   them. Of the 385 candidate pages, **2** carry gamification code. The
   "18 gamification routes" migration reduces to two pages.
3. **The Sacred Seven are already live**, and `TheStrategyTable` is *larger* in
   live (288 lines) than in the donor (199).
4. **`russell-capital-app` is PostgreSQL; the base build is MySQL.** Its 116
   `pgTable` definitions cannot be imported into a `mysql-core` tree without a
   dialect port. `russell-capital` shares the dialect and is the schema donor of
   record. Postgres/Vercel patterns stay reference material.
5. **The real decision is donor-versus-donor, not donor-versus-live.** 384 of
   the 385 candidate routes exist in *both* donors, 220 of them with divergent
   implementations. `russell-capital-app` is the larger file in 211 of those 220
   and the smaller in none.

And one that changes how these documents should be used: **the numbers move.**
Measured first against an older branch and then against `origin/master`, inside
this one survey, donor-only engines fell from 40 to 10 and live routes rose from
266 to 330. `master` is converging on its own. Every migration PR must recompute
its own delta.

## Reproducing everything here

```bash
# route inventory for any repository
python3 tools/extract_routes.py /path/to/repo

# route -> component -> source file -> hash, for a wouter SPA
python3 tools/resolve_pages.py /path/to/repo

# secret scan over git-tracked files
python3 tools/secret_scan.py /path/to/repo [subdir]

# verification of the live base
cd ../russell-capital-systems
pnpm install --frozen-lockfile && pnpm run check && pnpm run build && pnpm run test
```

`data/` holds the machine-readable output behind every table in these documents.

## What this PR does not do

No merge to `master`. No deployment. No DNS, domain, Railway, Vercel, database,
credential or environment-variable change. No repository deleted, archived or
overwritten. No page import and no feature migration — those wait for review of
this foundation.
