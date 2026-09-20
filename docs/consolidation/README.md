# Consolidation

`sam-russell-corpus/russell-capital-systems` is the sole canonical base.
Every other repository is a donor, reference, or archive candidate.

Read in order:

| Doc | Contents |
|---|---|
| [01-INVENTORY.md](01-INVENTORY.md) | Every repository, what it holds, what it may donate, and the standing risks |
| [02-CAPABILITY-MATRIX.md](02-CAPABILITY-MATRIX.md) | The one chosen implementation of each engine, calculator, route, schema and shared module |
| [03-VERIFICATION.md](03-VERIFICATION.md) | Install, typecheck, build, tests, audit and secret scan — commands run, exit codes transcribed. The regression baseline. |
| [04-COLLISION-AND-DEPENDENCY.md](04-COLLISION-AND-DEPENDENCY.md) | The 391 donor pages: 210 collisions, 244 clean, 147 blocked on five components |
| [05-CI-SECRETS-ROLLBACK.md](05-CI-SECRETS-ROLLBACK.md) | What CI covers, what this PR adds, tagging and rollback, and the deployment gate |
| [06-PHASED-PR-PLAN.md](06-PHASED-PR-PLAN.md) | One bounded capability per PR, with source, target, tests and rollback |

Generated artifacts: `route-collision-report.json`,
`collision-size-comparison.json`, `donor-routes-clean.txt`,
`donor-routes-blocked.txt`, `route-collisions.txt`.

## Two things to know before touching anything

1. **Merging to `master` deploys to production.** `deploy-branch.yml` fires on
   push to `master` under `russell-capital-systems/**` and POSTs Railway.
   There is no manual gate. Capability PRs target `consolidation/main`.
2. **The baseline is 195 test files / 3,762 tests** (after this PR), a clean
   typecheck, and a build emitting 330 route patterns. A PR that lowers any of
   those does not merge.
