# 3 — Baseline verification

The live build was installed, typechecked, built and tested from a clean clone on
2026-09-20. **Every gate passes.** These numbers are the regression baseline: any migration
PR that moves them requires justification.

Environment: Node on Linux, `pnpm@10.34.2` via `packageManager`, no `.env` present, no
database reachable.

---

## 3.1 Install

```
$ pnpm install --frozen-lockfile
Done in 7.4s using pnpm v10.34.2
```

Clean against the committed lockfile. Four packages have postinstall scripts blocked by
pnpm's default policy (`@parcel/watcher`, `@tailwindcss/oxide`, `esbuild` ×2); they are
approved explicitly with `pnpm rebuild` before build. **The CI workflow added in §5 does the
same**, so CI matches this procedure exactly.

## 3.2 Typecheck

```
$ pnpm check          # tsc --noEmit
EXIT=0
```

**Zero errors.** `tsconfig.json` is `strict: true`.

## 3.3 Build

```
$ pnpm build          # node scripts/build.mjs && esbuild server/_core/index.ts …
[build] 330 route patterns written to dist/public/routes.json
[build] Frontend emitted to dist/public with esbuild code splitting and compiled Tailwind CSS.
  dist/index.js  3.8mb
⚡ Done in 183ms
EXIT=0
```

Clean. Note the build **emits `dist/public/routes.json` with 330 route patterns** — the same
330 in `shared/routeManifest.ts` and the same 330 registered in `App.tsx`. All three agree.

## 3.4 Tests

Two suites exist. Both are green.

| Suite | Files | Tests | Result |
|---|---:|---:|---|
| `pnpm test:ci` — the CI-reported suite (27 files excluded) | 194 passed | **3757 passed**, 5 skipped | **EXIT=0** |
| `pnpm test` — the full suite | 216 passed, 9 skipped | **4138 passed**, 82 skipped | **EXIT=0** |

**The full suite is green too.** The 27 files `test:ci` excludes are not broken — they
self-skip when `DATABASE_URL` and the integration environment are absent. Running the full
suite is therefore safe in CI and gives 381 more passing assertions, so the workflow in §5
runs `pnpm test`, not `test:ci`.

`server/auth.logout.test.ts` logs `[OAuth] ERROR: OAUTH_SERVER_URL is not configured` to
stderr and still passes — expected without credentials, not a failure.

---

## 3.5 The regression contract

Every migration PR in §6 must show:

| Gate | Required |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm check` | exit 0, **zero** errors |
| `pnpm build` | exit 0 |
| `pnpm test` | **≥ 4138 passing, 0 failing** |
| Route manifest | `server/grok-merge.smoke.test.ts` — `diffRoutes()` reports no missing/unexpected/duplicate path, and `currentRoutes.size === ROUTE_COUNT` |
| Route count | `dist/public/routes.json`.routes.length == `ROUTE_MANIFEST` length == `<Route>` count (all 330 today) |

A PR that adds pages **must** raise all three route counts together and add the matching
manifest lines. A PR that lowers the passing-test count is rejected regardless of anything
else it achieves.
