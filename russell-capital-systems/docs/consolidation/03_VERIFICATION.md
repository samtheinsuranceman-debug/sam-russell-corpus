# 03 — Verification: install, typecheck, build, test

**Date:** 2026-09-20
**Tree verified:** `claude/consolidation-foundation-audit` @ `76ed5f2` (= `master`)
**Toolchain:** Node v22.22.2 · pnpm 10.34.2 · npm 10.9.7 · Linux 6.18.44

Every command below was run on the exact tree this PR targets. Exit codes were
captured directly, not inferred from output — an earlier pass in this session
piped a command through `tail` and read `tail`'s exit code instead of the real
one, which is how the `npm install` failure in §1 was nearly missed.

---

## 1. Install — **npm fails, pnpm succeeds**

```
$ npm install --no-audit --no-fund
npm error Cannot read properties of null (reading 'matches')
REAL_INSTALL_EXIT=1                                    ❌
```

```
$ pnpm install --frozen-lockfile
Done in 1.6s using pnpm v10.34.2
PNPM_INSTALL_EXIT=0                                    ✅
```

### Root cause

This repository is a **pnpm** project and `npm install` is the wrong tool:

- `pnpm-lock.yaml` (324 KB) and `pnpm-workspace.yaml` are committed.
- `package.json` declares `"packageManager": "pnpm@10.34.2"`.
- `node_modules/.pnpm/` is present — a pnpm symlink store.
- The `security:audit` script already calls `pnpm audit`.

npm's arborist walks the pnpm symlink store and dereferences a null link:

```
TypeError: Cannot read properties of null (reading 'matches')
    at Link.matches (@npmcli/arborist/lib/node.js:1137:41)
    at Link.canDedupe (…/node.js:1091:15)
    at PlaceDep.pruneDedupable (…/place-dep.js:426:14)
```

**This is not a broken repository.** The lockfile is committed and the install
is reproducible with the correct package manager. It is a documentation and CI
gap: nothing in the repo tells a new contributor — or a CI runner — that `npm
install` will fail. Document 05 proposes the fix (an `engines`/`preinstall`
guard and a README line). **No dependency or lockfile is changed by this PR.**

---

## 2. Typecheck — clean

```
$ npx tsc --noEmit
TSC_EXIT=0                                             ✅
```

Zero errors, zero output.

---

## 3. Build — clean

```
$ npm run build
[build] 330 route patterns written to dist/public/routes.json
[build] Frontend emitted to dist/public with esbuild code splitting and compiled Tailwind CSS.
  dist/index.js  3.8mb ⚠️
BUILD_EXIT=0                                           ✅
```

- 330 route patterns emitted, matching the 330 declared in `App.tsx`.
- 402+ code-split chunks emitted.
- The `3.8mb` warning is esbuild's default bundle-size notice on the **server**
  bundle (`--platform=node --packages=external`), where size is not a delivery
  concern. Not a failure, not a regression, and not addressed by this PR.

Largest client chunks, for reference when judging later page imports:

| Chunk | Size |
|---|---:|
| `chunk-UE3ET6AY.js` | 328.9 kb |
| `InfiniteBanking` | 163.1 kb |
| `MYGAFixedRate` | 159.1 kb |
| `MortgageKiller` | 131.5 kb |
| `RothConversionSTR` | 122.0 kb |

---

## 4. Tests — clean, but CI runs a reduced set

### 4.1 Full suite

```
$ npx vitest run
 Test Files  216 passed | 9 skipped (225)
 Tests       4138 passed | 82 skipped (4220)
TEST_FULL_EXIT=0                                       ✅
```

### 4.2 The suite CI actually runs

```
$ npm run test:ci
 Test Files  194 passed (194)
 Tests       3757 passed | 5 skipped (3762)
TEST_CI_EXIT=0                                         ✅
```

### 4.3 The gap — **22 test files and 381 tests are excluded from CI**

`package.json`'s `test:ci` script carries **26 `--exclude` flags**:

```
server/batch9-features.test.ts          server/round10.test.ts
server/client-workflow.integration.test.ts  server/round14.test.ts
server/core-table-queryability.test.ts  server/round15.test.ts
server/databaseSchemaFile.test.ts       server/round16.test.ts
server/persistence-schema.test.ts       server/round17.test.ts
server/phase3-features.test.ts          server/round18.test.ts
server/slides-pptx.test.ts              server/round19.test.ts
server/subscriptionGate.test.ts         server/round20.test.ts
server/heygen-api.test.ts               server/round21.test.ts
server/messaging.test.ts                server/round30.test.ts
server/complianceTracking.test.ts       server/round6.test.ts
server/features.test.ts                 server/round7.test.ts
server/**/*.secret.test.ts              server/**/*.live.test.ts
```

Some exclusions are legitimate: `*.secret.test.ts` and `*.live.test.ts` gate on
credentials that CI does not hold, and they self-skip anyway. But
`databaseSchemaFile`, `persistence-schema`, `core-table-queryability` and
`subscriptionGate` are **schema and access-control tests** — exactly the
category a consolidation is most likely to break.

**Both suites pass today, so nothing is currently hiding behind the
exclusions.** The risk is forward-looking: a migration PR could break a schema
test and go green in CI. Document 06 therefore runs the **full** suite as a
merge gate on every migration PR, and document 05 proposes narrowing the
exclusion list as a separate, non-blocking change.

---

## 5. Results table

| Check | Command | Exit | Result |
|---|---|:--:|---|
| Install (npm) | `npm install` | **1** | ❌ wrong package manager — see §1 |
| Install (pnpm) | `pnpm install --frozen-lockfile` | 0 | ✅ 1.6s |
| Typecheck | `npx tsc --noEmit` | 0 | ✅ 0 errors |
| Build | `npm run build` | 0 | ✅ 330 routes, 402+ chunks |
| Test (full) | `npx vitest run` | 0 | ✅ 4,138 passed / 82 skipped |
| Test (CI) | `npm run test:ci` | 0 | ✅ 3,757 passed / 5 skipped |

**The consolidation base is sound.** It installs reproducibly with pnpm,
typechecks clean, builds clean, and passes its entire test suite. The one
failure found is a package-manager mismatch with a committed lockfile — a
documentation defect, not a code defect.

---

## 6. A note on branch state

`master` is **30 commits behind** `claude/engine-harvest-catalog-backlink`,
which carries this session's statement-calibration work, the navigation
rebuild, and the credit-sourcing module. On that branch the same commands give
**331 routes** and **4,462 tests**.

This PR is deliberately cut from `master` so that its diff is documentation
only. The 30-commit branch is a separate review, and the numbers in this
document are `master`'s, so they match what CI will report on this PR.
