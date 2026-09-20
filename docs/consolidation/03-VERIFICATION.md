# 03 — Base Verification

**Foundation PR, deliverable 3 of 6.**
**Subject:** `sam-russell-corpus/russell-capital-systems` @ `76ed5f2`
**Run:** 2026-09-20, clean checkout, no credentials present.

**Result: green on all four gates.**

---

## 3.1 — RESULTS

| Gate | Command | Result |
|---|---|---|
| Install | `pnpm install` | **PASS** — 6.5s. Build scripts for `@parcel/watcher`, `@tailwindcss/oxide`, `esbuild` are ignored by default and were approved via `pnpm rebuild`. |
| Typecheck | `pnpm check` (`tsc --noEmit`) | **PASS** — exit 0, zero errors. |
| Build | `pnpm build` | **PASS** — exit 0. Client emitted to `dist/public` with esbuild code splitting + compiled Tailwind; server bundle `dist/index.js` (3.8 MB). **330 route patterns written to `dist/public/routes.json`.** |
| Tests (CI subset) | `pnpm test:ci` | **PASS** — 194 files, **3,757 passed**, 5 skipped, 44.5s. |
| Tests (full) | `pnpm test` | **PASS** — 216 files passed / 9 skipped (225 total), **4,138 passed**, 82 skipped, 54.8s. |

The base installs, typechecks, builds and passes its own tests without
credentials. It is sound as a consolidation base.

---

## 3.2 — FINDING: THE CI EXCLUSION LIST IS STALE

`package.json` defines `test:ci` as `vitest run` with **27 explicit
`--exclude` entries**:

```
batch9-features · client-workflow.integration · core-table-queryability
databaseSchemaFile · persistence-schema · phase3-features · round10 · round19
round20 · round21 · round30 · slides-pptx · subscriptionGate · heygen-api
messaging · complianceTracking · features · round6 · round7 · round14 · round15
round16 · round17 · round18 · **/*.secret.test.ts · **/*.live.test.ts
```

**Those files now pass.** The full run is green, and the only non-passing
entries anywhere are *skips*, not failures:

- `*.secret.test.ts` and `*.live.test.ts` — correctly skipped; they require live
  API credentials that are deliberately absent.
- `heygen-api`, `client-workflow.integration` — skipped for the same reason.

So the exclusion list is carrying ~21 files that no longer need excluding. The
effect is that **CI is testing 194 files while 216 actually pass** — a 22-file
blind spot where a regression would not be caught.

**Recommendation (not applied in this PR):** narrow `test:ci` to only the
credential-gated patterns:

```
--exclude "server/**/*.secret.test.ts" --exclude "server/**/*.live.test.ts"
--exclude "server/heygen-api.test.ts"
--exclude "server/client-workflow.integration.test.ts"
```

This is a change to the base's own test configuration, which the directive puts
behind a documented comparison. The comparison is above; the change belongs in
its own small PR, not this one. Proposed as **Phase 0b** in
`06-PHASED-PR-PLAN.md`.

---

## 3.3 — ENVIRONMENT NOTES

Expected and non-blocking during the test run:

```
[OAuth] ERROR: OAUTH_SERVER_URL is not configured!
```

The server boots without third-party keys and integrations fail only at call
time. This guarded pattern is correct and must be preserved by every migration.

No credentials were present, read, or written during verification. No database
was contacted. No deployment was triggered.

---

## 3.4 — REGRESSION BASELINE

Every migration PR is measured against these numbers. Any drop is a regression
and blocks the PR.

| Metric | Baseline @ `76ed5f2` |
|---|---|
| `tsc --noEmit` errors | **0** |
| `pnpm build` exit | **0** |
| Route patterns emitted | **330** |
| Test files passing (full) | **216** |
| Tests passing (full) | **4,138** |
| Tests failing (full) | **0** |
| Test files passing (CI subset) | **194** |
| Tests passing (CI subset) | **3,757** |

Reproduce with:

```bash
cd russell-capital-systems
pnpm install && pnpm rebuild esbuild @tailwindcss/oxide @parcel/watcher
pnpm check && pnpm build && pnpm test
```
