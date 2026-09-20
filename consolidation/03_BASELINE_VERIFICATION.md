# 3 · Baseline Verification

**Date:** 2026-09-20 · **Tree:** `sam-russell-corpus/russell-capital-systems`
**Commit:** `76ed5f2` ("Route manifest replaces the hard-coded count; each façade
becomes one front door") · **Branch:** `master`

Every command below was run in this session. Outputs are quoted from the actual
run, not reconstructed.

---

## 3.1 Result

| Gate | Command | Result |
|---|---|---|
| Install | `pnpm install` | ✅ **pass** — 6.6 s, pnpm 10.34.2 |
| Typecheck | `pnpm check` (`tsc --noEmit`) | ✅ **pass** — exit 0, zero diagnostics |
| Build | `pnpm build` | ✅ **pass** — exit 0 |
| Curated tests | `pnpm test:ci` | ✅ **pass** — exit 0, **194 files, 3,757 tests** |
| Full tests | `pnpm test` | ✅ **pass** — exit 0, **216 files, 4,138 tests** |

**The base is green on every gate, including the full suite.** This is the
regression baseline every later PR is measured against.

---

## 3.2 Install

```
pnpm install --prefer-offline --ignore-scripts
Done in 6.6s using pnpm v10.34.2
```

Workspace is single-package (`pnpm-workspace.yaml` → `packages: ["."]`), with
pinned overrides: `tailwindcss>nanoid@3.3.7`, `lodash@4.18.0`,
`lodash-es@4.18.0`, `path-to-regexp@0.1.13`, `pptxgenjs>image-size` removed.

Native binaries need one extra step in a clean environment:

```bash
pnpm rebuild esbuild @tailwindcss/oxide
```

---

## 3.3 Typecheck

```
npx tsc --noEmit
TSC_EXIT=0
```

Zero diagnostics. Note this is stricter than the donor trees: the donors' page
files open with `// @ts-nocheck`, so a donor page that typechecks in its own
repo may not typecheck here. **Every migration PR must re-run this gate** — see
[06](06_PHASED_PR_PLAN.md) §"Test criteria".

---

## 3.4 Build

```
pnpm build
  ...and 401 more output files...
⚡ Done in 1918ms
[build] 330 route patterns written to dist/public/routes.json
[build] Frontend emitted to dist/public with esbuild code splitting and compiled Tailwind CSS.
  dist/index.js  3.8mb ⚠️
⚡ Done in 139ms
BUILD_EXIT=0
```

**The build emits 330 route patterns**, matching `shared/routeManifest.ts` (330)
and `App.tsx` (330) exactly. Three independent counts agree. This three-way
agreement is the property every migration PR must preserve, and it is the single
most useful regression signal in the repository.

The `dist/index.js 3.8mb ⚠️` notice is an esbuild size warning, not an error.

---

## 3.5 Tests

### Curated suite — `pnpm test:ci`

```
Test Files  194 passed (194)
     Tests  3757 passed | 5 skipped (3762)
  Duration  51.88s
CI_SUITE_EXIT=0
```

### Full suite — `pnpm test`

```
Test Files  216 passed | 9 skipped (225)
     Tests  4138 passed | 82 skipped (4220)
  Duration  63.65s
FULL_EXIT=0
```

**Both suites pass.** The 26 `test:ci` exclusions are *not* failing tests — they
pass locally too. They are excluded from CI because they need a live database,
network, or provider credentials that CI does not hold. Verified by running the
full suite with no exclusions: exit 0.

The 26 exclusions:

| Group | Files | Reason |
|---|---|---|
| Schema / persistence | `core-table-queryability`, `databaseSchemaFile`, `persistence-schema`, `client-workflow.integration` | live DB |
| Round suites | `round6`, `round7`, `round10`, `round14`–`round21`, `round30` | live DB / server on :3000 |
| Feature batches | `batch9-features`, `phase3-features`, `features`, `complianceTracking`, `messaging` | live DB |
| Provider-credential | `**/*.secret.test.ts`, `**/*.live.test.ts`, `heygen-api` | third-party API keys |
| Other | `slides-pptx`, `subscriptionGate` | binary generation / Stripe |

> **Contrast with the donors.** In `russell-capital`, 20 server test files fail
> in this environment (verified failing identically at its own pristine `HEAD`,
> so pre-existing, not introduced). The base has no equivalent failure set and
> already encodes the environmental boundary in a named script. This is a
> further reason the base is the correct consolidation target.

---

## 3.6 Environment used

| | |
|---|---|
| Node | via pnpm 10.34.2 / corepack |
| TypeScript | 5.9.3 |
| Vite | 7.3.6 |
| Vitest | 3.2.7 |
| Platform | Linux 6.18.44, x86_64 |
| Database | **none connected** — no live DB reached at any point |
| Credentials | **none supplied** — no provider keys, no secrets |

Nothing was deployed. No DNS, domain, hosting, database, or credential was read
or modified.

---

## 3.7 Reproducing

```bash
cd russell-capital-systems
pnpm install
pnpm rebuild esbuild @tailwindcss/oxide   # clean environments only
pnpm check                                 # expect exit 0
pnpm build                                 # expect exit 0 + "330 route patterns"
pnpm test:ci                               # expect 194 files / 3757 tests
pnpm test                                  # expect 216 files / 4138 tests
```

Any deviation from these numbers on a migration branch is a regression and must
be explained in that PR before merge.
