# 3 — Build verification of the live base

Everything below was run in this session against **`origin/master` @ `76ed5f2`**,
in `russell-capital-systems/`, on Node v22.22.2 / pnpm 10.34.2. No source file
was modified to make anything pass.

## 3.1 Results

| Step | Command | Exit | Result |
|---|---|---:|---|
| Install | `pnpm install --frozen-lockfile` | **0** | Lockfile satisfied; no resolution drift |
| Typecheck | `pnpm run check` (`tsc --noEmit`) | **0** | Zero errors, zero output |
| Build | `pnpm run build` | **0** | Client + server emitted |
| Tests (CI set) | `pnpm run test:ci` | **0** | **1158 suites, 3762 tests, 0 failed, 5 skipped** |
| Tests (everything) | `pnpm run test` | **0** | **1326 suites, 4220 tests, 0 failed, 82 skipped** |

**The live base is green on every axis, including the tests its own CI script
excludes.**

## 3.2 On the excluded tests

`package.json` defines `test:ci` as `vitest run` with 26 `--exclude` patterns —
`batch9-features`, `client-workflow.integration`, `core-table-queryability`,
`databaseSchemaFile`, `persistence-schema`, `phase3-features`, `round6`, `7`,
`10`, `14`–`21`, `30`, `slides-pptx`, `subscriptionGate`, `heygen-api`,
`messaging`, `complianceTracking`, `features`, and the `*.secret.test.ts` /
`*.live.test.ts` globs.

That exclusion list is worth knowing about, but this run shows it is **not
hiding failures**: the full suite adds 168 suites and 458 tests and still
reports zero failures. The excluded files are the ones that want a database, a
network service or a live credential; 82 of their tests self-skip when the
environment is absent.

Consequence for the migration: **the acceptance gate for every migration PR is
`pnpm run test`, not `pnpm run test:ci`.** The stricter gate is available at no
cost and a consolidation is exactly when the database and schema suites matter.

## 3.3 Build output

The build runs `scripts/build.mjs` (esbuild code-splitting plus compiled
Tailwind) and then bundles the server with esbuild:

- client: `dist/public/` — 331+ output chunks, largest ~669 KB
- server: `dist/index.js` — ~3.0 MB (esbuild warns on size; not an error)
- routes: `dist/public/routes.json` — **330 route patterns**

The 330 patterns the build emits match the 330 found by parsing `App.tsx`
(§2.3). Route counting is therefore reliable and can gate the migration PRs.

## 3.4 Reproducing this

```bash
cd russell-capital-systems
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run test                      # full suite — the acceptance gate
pnpm run test --reporter=json --outputFile=/tmp/test.json   # machine-readable
```

## 3.5 What was not verified, and why

- **`pnpm start` / a running server** — needs `DATABASE_URL`, `OAUTH_SERVER_URL`
  and the other production environment variables. Supplying them was out of
  scope by instruction. Several suites log `[OAuth] ERROR: OAUTH_SERVER_URL is
  not configured` and proceed; that is the expected offline path, not a failure.
- **Database migrations** (`pnpm run db:push`) — would touch a database. Not run.
- **Deployment** (`pnpm start`, Railway, Vercel, GitHub Pages) — not run, by
  instruction.
