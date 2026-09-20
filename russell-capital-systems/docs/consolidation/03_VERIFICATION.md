# Consolidation Foundation — Verification

**Date:** 20 September 2026 · both repositories, same machine, same toolchain

| Check | **Base** `russell-capital-app` | **Donor** `russell-capital-systems` |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` — **exit 0** | **exit 0** |
| Typecheck | `pnpm check` — **exit 0, 0 errors** | **exit 0, 0 errors** |
| Build | `pnpm build` — **exit 0**, `dist/index.js` 1.6 MB | **exit 0**, 313 routes, 3.2 MB |
| Tests | `pnpm test` — **exit 1 · 113 failed · 2030 passed · 25 files failing (98)** | **exit 0 · 3258 passed · 194 files** |

## The base's failing suite — cause

| Cause | Count |
|---|---|
| `Error: DB unavailable` (needs `DATABASE_URL`) | 59 |
| `ENOENT` missing file | 14 |
| `TypeError: fetch failed` (network) | 6 |
| Assertion and other | ~34 |

**The failures are predominantly environmental, not rotten code.** The base installs, typechecks
cleanly and builds.

The donor is Postgres-gated in the same way (`server/db.ts` guards on `process.env.DATABASE_URL`)
yet still passes 3258 tests with no database, because its tests skip or mock when the DB is absent.
The base's do not.

### Consequence for the plan

A regression baseline has to be reproducible. Until the base's suite is green without external
services, every migration PR would be measured against a red suite. **That is why suite
stabilisation is PR 1** — see `06_PHASED_PR_PLAN.md`. It is a bounded, mechanical job: make the
DB-dependent tests skip cleanly the way the donor's already do.

### Target baseline, to be established by PR 1

```
typecheck : 0 errors
build     : exit 0
tests     : 0 failures (skips permitted where a service is absent)
```
