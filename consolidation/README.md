# Consolidation — Foundation Documents

**Canonical consolidation base:** `sam-russell-corpus/russell-capital-systems/`
**Date:** 2026-09-20
**Status:** foundation audit. **No application code is migrated by this PR.**

---

## Read in this order

| # | Document | What it settles |
|---|---|---|
| 1 | [`01_REPOSITORY_INVENTORY.md`](01_REPOSITORY_INVENTORY.md) | All **132** repositories, measured. Donor / reference / archive classification. |
| 2 | [`02_CAPABILITY_MATRIX.md`](02_CAPABILITY_MATRIX.md) | The **one authoritative implementation** of each engine, calculator, route, schema and shared module. Two corrections to the stated plan. |
| 3 | [`03_BUILD_VERIFICATION.md`](03_BUILD_VERIFICATION.md) | Proof the base installs, typechecks, builds and tests. |
| 4 | [`04_ROUTE_COLLISION_AND_DEPENDENCY_REPORT.md`](04_ROUTE_COLLISION_AND_DEPENDENCY_REPORT.md) | The **391** pages: where the number comes from, collisions, full dependency closure. |
| 5 | [`05_CI_AND_SECRET_SCAN.md`](05_CI_AND_SECRET_SCAN.md) | CI gates, secret-scan results, rollback and tagging. |
| 6 | [`06_PHASED_MIGRATION_PLAN.md`](06_PHASED_MIGRATION_PLAN.md) | PR-by-PR plan with source paths, target paths, test criteria, rollback. |
| A | [`APPENDIX_A_391_ROUTES.md`](APPENDIX_A_391_ROUTES.md) | All 391 route paths, enumerated, with source files. |
| B | [`APPENDIX_B_DEPENDENCIES.md`](APPENDIX_B_DEPENDENCIES.md) | The 49 non-page dependencies. |

---

## The four findings that matter

**1. The base verifies green, end to end.**
0 typecheck errors · build succeeds · **216 test files, 4,138 tests, zero failures.** For
contrast, the same suite on `russell-capital` @ `863b3f0` gives 20 failing files and 95 failing
tests. The base decision is well supported on the merits, not only on size.

**2. All 391 pages are collision-free.**
391 = exactly the route paths in `russell-capital` absent from the base (620 − 229 = 391).
**Zero** collide with the base's 330 patterns. The migration cannot silently change an existing
route's behaviour. A separate 229 paths exist in both builds; those are excluded from migration
and stay on the base implementation.

**3. The integration surface is small.**
The 391 pages pull a 543-file import closure, of which only **49 are non-page dependencies** —
31 components, **4 shared engines**, 2 contexts, 1 lib, 11 data/other. Zero unresolvable
imports. Those 4 engines are the entire engine-layer gap between the two builds.

**4. Two corrections to the stated plan — please review.**
- The **Sacred Seven** (`TheArrival`, `TheField`, `TheMirror`, `TheLegacy`, `TheBrotherhood`,
  `TheMap`, `TheStrategyTable`, plus `GenomeKit` and `fieldRouter`) is **native to the base and
  absent from `russell-capital`.** It was assigned to `russell-capital` as donor. No migration
  needed — this removes a whole planned PR.
- The **behavioral / genome schema** is already complete in the base *and ahead of it* — the base
  additionally has `illustrationCalibration.ts`, which the live build lacks. Migrating the live
  copies over the base's would be a regression.

---

## Open questions blocking PR-3

Recorded in capability matrix §2.8; they are the content of PR-2.

1. **The "18 gamification routes."** 9 are evidenced, and they are in `russell-capital`, not
   `russell-capital-app`. Confirm the 9, or name the other 9.
2. **Postgres/Vercel patterns from `russell-capital-app`.** Adopting them changes the base's
   database dialect and hosting model. Excluded from every PR until decided.

---

## Constraints honoured by this PR

No deployment · no DNS, domain, GoDaddy, Railway or Vercel change · no database connected,
created or migrated · no credential or environment variable touched · no repository deleted,
archived or overwritten · no wholesale repository merge · no merge to `master` · **no
application code imported.**

The engine registry, calculator registry, route manifest and existing test suite are
**additive-only**, and CI enforces it: `route-manifest-guard` fails any PR that removes or
re-points a route pattern.
