# 3 — Verification Evidence

Proof that the canonical base installs, typechecks, builds, and passes its tests
**before** any donor code is proposed. This is the baseline every migration PR is
measured against.

---

## Environment

| | |
|---|---|
| Commit under test | `76ed5f2b4097ada56314a5c4b48f457356e5f435` (2026-09-18 23:20:17 +0000) |
| Branch | `master` |
| Working directory | `russell-capital-systems/` |
| Node | v22.22.2 |
| pnpm | 10.34.2 |
| Database | **none reachable** — see caveat below |
| Date run | 2026-09-20 |

---

## Results

| Gate | Command | Result |
|---|---|---|
| Install | `pnpm install` | **exit 0** |
| Typecheck | `pnpm check` (`tsc --noEmit`) | **exit 0 — zero errors, zero warnings** |
| Build | `pnpm build` | **exit 0** |
| CI tests | `pnpm test:ci` | **194 files passed · 3,757 passed · 5 skipped · 0 failed** |
| Full tests | `pnpm test` | **216 files passed · 9 skipped · 4,138 passed · 82 skipped · 0 failed** |

### Build detail

```
[build] 330 route patterns written to dist/public/routes.json
[build] Frontend emitted to dist/public with esbuild code splitting and compiled Tailwind CSS.
  dist/index.js  3.8mb
Done in 2371ms (client) + 102ms (server bundle)
404 output files
```

The build emits its own route count. **330 — matching `shared/routeManifest.ts`
and `App.tsx` exactly.** That three-way agreement is the single best health signal
in the repository and every migration PR must preserve it.

### Typecheck detail

Zero errors across 372 server files, 325 pages, and 174 shared modules. Worth
stating plainly because it is unusual at this scale and it means TypeScript is a
real gate here, not decoration. **A migration PR that introduces even one `tsc`
error is not mergeable.**

---

## About the excluded test suites

`test:ci` excludes 26 patterns. This is not tests being hidden — it is the
environment-dependent set being deselected so CI can run without a database or
live credentials:

```
batch9-features · client-workflow.integration · core-table-queryability
databaseSchemaFile · persistence-schema · phase3-features
round6 · round7 · round10 · round14 · round15 · round16 · round17 · round18
round19 · round20 · round21 · round30
slides-pptx · subscriptionGate · heygen-api · messaging · complianceTracking
features · **/*.secret.test.ts · **/*.live.test.ts
```

**The full run confirms these do not fail — they skip.** `pnpm test` reports
9 skipped *files* and 82 skipped *tests*, with **zero failures**. Without a
database the suites self-skip rather than erroring, which is the correct design.

**Caveat, stated plainly:** no database was reachable from this environment, so the
82 database-dependent assertions were not executed. This baseline proves the build
is sound in a DB-less environment. It does **not** prove schema correctness against
a live MySQL instance. Any migration PR that touches `drizzle/` must be verified
against a real database before merge, and that verification is a separate,
explicitly-approved step.

---

## Reproducing this

```bash
cd russell-capital-systems
pnpm install
pnpm check      # expect exit 0
pnpm build      # expect exit 0, "330 route patterns"
pnpm test:ci    # expect 194 files, 0 failed
pnpm test       # expect 216 files, 0 failed
```

From the repository root the app subfolder is the working directory for all four —
running them from the corpus root will not work.

---

## The baseline contract

Every migration PR must show, in its description, this table filled in from its own
branch:

| Gate | Baseline | This PR |
|---|---|---|
| `pnpm check` | exit 0 | |
| `pnpm build` | exit 0, 330 routes | must equal 330 + routes added by this PR |
| `pnpm test:ci` | 3,757 passed / 0 failed | ≥ 3,757 passed, 0 failed |
| `pnpm test` | 4,138 passed / 0 failed | ≥ 4,138 passed, 0 failed |
| Route three-way agreement | `App.tsx` = `routeManifest.ts` = `routes.json` | must still hold |

A migration that reduces any passing count, or breaks the three-way route
agreement, is rejected regardless of what it adds.
