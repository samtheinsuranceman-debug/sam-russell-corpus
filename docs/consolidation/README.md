# Consolidation — Foundation

**Canonical base:** `sam-russell-corpus` → `russell-capital-systems/`
**Status:** foundation only. **No application code changed in this PR.**

Read in order:

| # | Document | Answers |
|---|---|---|
| [01](01_INVENTORY.md) | Repository and Capability Inventory | What exists, where, and how much of it |
| [02](02_CAPABILITY_MATRIX.md) | Authoritative Capability Matrix | Which single implementation wins, per capability |
| [03](03_BUILD_VERIFICATION.md) | Live Build Verification | Does the base install, typecheck, build, and pass tests |
| [04](04_ROUTE_COLLISION_REPORT.md) | Route Collision and Dependency Report | What the 391 pages actually are, and what they need |
| [05](05_CI_SECRETS_ROLLBACK.md) | CI, Secret Scanning, Rollback | How mistakes get caught and undone |
| [06](06_PHASED_PR_PLAN.md) | Phased PR Plan | The order of work after this merges |

Raw data in [`data/`](data/) — route lists, reproducible with `comm`.

---

## The base is healthy

| | canonical | rc-app | rc |
|---|---|---|---|
| Tests passing | **4138** | 2096 | 2117 |
| Tests failing | **0** | 102 | 93 |
| Engines | **54** | 31 | 31 |
| DB tables | **155** | 116 | 116 |
| Route manifest | **0 drift** | none | none |
| Credentials in source | **none** | none | 3 |

`sam-russell-corpus` is the right base by a wide margin.

## Four findings that change the plan

**1. The Sacred Seven is already canonical.** The brief assigns it to
`russell-capital` as donor. `grep -ril "sacred seven"` → **0 files** there, 10 in
canonical. All seven pages are present. Nothing to import; do not overwrite. →
[§1.6a](01_INVENTORY.md#16-findings-that-contradict-the-brief)

**2. The "18 gamification routes" are not in rc-app.** Canonical already serves
`/portal/arena`, `/portal/leaderboard`, `/portal/rewards` and carries **13**
gamification tables to rc-app's 12. rc-app's real exclusive contribution is a
**19-procedure analytics/telemetry suite** — worth taking, wrongly labelled. →
[§2.5](02_CAPABILITY_MATRIX.md#25-analytics--telemetry--rc-apps-real-contribution)

**3. "391 pages" is the `russell-capital` delta — and 382 of them are contested.**
Both donors offer nearly the same pages. The union of genuinely new paths is
**394**, and merging everything yields **724 routes**, not 391. The work is
*deciding*, not copying. → [§4.2](04_ROUTE_COLLISION_REPORT.md#42-the-arithmetic-that-matters)

**4. Nothing ran typecheck, tests, or build on a PR.** Twelve workflows existed;
none gated code. Fixed here. → [§5.1](05_CI_SECRETS_ROLLBACK.md#51-the-gap-this-closes)

## What this PR adds

- Six analysis documents plus raw route data
- `.github/workflows/consolidation-ci.yml` — typecheck · build · full test suite;
  route-manifest drift gate (negative-tested); three-layer secret scan
- Tagging and rollback procedure

## What it does not touch

No application code. No DNS, domain, traffic, hosting, database, or credential. No
repository merged. No registry, schema, or test replaced. No deployment.

## Owner action required

1. **Approve or amend the matrix in [02](02_CAPABILITY_MATRIX.md)** — particularly
   the three rejected premises above.
2. **Enable branch protection** requiring `verify`, `route-manifest`, `secret-scan`
   on `master` ([§5.6](05_CI_SECRETS_ROLLBACK.md#56-branch-protection--recommended-requires-owner-action)).
3. **Decide Phase E** — the Postgres/Vercel migration.
   [Recommended: reject](06_PHASED_PR_PLAN.md#phase-e--postgresvercel-patterns-recommend-reject).

## Out of scope, flagged

~100 `brother-*`, `*-Identity`, and `brotherhood-*` repositories, **many public**,
hold personal and theological material. A privacy review, not a consolidation
question — but it should happen.
