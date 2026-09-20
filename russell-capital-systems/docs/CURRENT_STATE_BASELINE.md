# Current-state baseline

Every number here was produced by running the command shown, in this
repository, during the session that opened this PR. Nothing is estimated.
Anything that could not be proven is marked **UNVERIFIED**.

**This PR changed no DNS, domain, hosting, Railway, Vercel, GitHub Pages,
database, credential or environment-variable setting.** It adds documentation
and one non-deploying CI workflow.

## 1. What was measured

| | |
|---|---|
| Repository | `samtheinsuranceman-debug/sam-russell-corpus` |
| Application path | `russell-capital-systems/` (a subtree, not a separate repository — see ADR 0001) |
| Default branch | `master` |
| Commit measured | **`76ed5f2b4097ada56314a5c4b48f457356e5f435`** |
| Node | v22.22.2 |
| Package manager | **pnpm 10.34.2** — declared in `package.json` as `"packageManager": "pnpm@10.34.2"` |
| Lockfile | **`pnpm-lock.yaml`**, 324,554 bytes. No `package-lock.json`, no `yarn.lock`. |

## 2. Actual scripts

Read from `russell-capital-systems/package.json`:

| Purpose | Script | Command |
|---|---|---|
| Install | — | `pnpm install --frozen-lockfile` |
| Typecheck | `check` | `tsc --noEmit` |
| Build | `build` | `node scripts/build.mjs && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` |
| Test (full) | `test` | `vitest run` |
| Test (CI subset) | `test:ci` | `vitest run` with **26 `--exclude` patterns** |
| Start | `start` | `NODE_ENV=production node dist/index.js` |
| Format | `format` | `prettier --write .` |
| **Lint** | — | **ABSENT.** No `lint` script exists. CI must not invent one. |

## 3. Results of a clean run

All five commands were run from a `--frozen-lockfile` install at the commit above.

| Step | Command | Exit | Result |
|---|---|---:|---|
| Install | `pnpm install --frozen-lockfile` | **0** | Lockfile satisfied; no resolution drift |
| Typecheck | `pnpm run check` | **0** | Zero errors, no output |
| Build | `pnpm run build` | **0** | Client and server emitted |
| Test (full) | `pnpm run test` | **0** | **1326 suites, 0 failed · 4220 tests, 4138 passed, 0 failed, 82 skipped** |
| Test (CI subset) | `pnpm run test:ci` | **0** | **1158 suites, 0 failed · 3762 tests, 3757 passed, 0 failed, 5 skipped** |

**The baseline is green on every axis, including the 26 test files `test:ci`
excludes.** The full suite adds 168 suites and 458 tests over the CI subset and
still reports zero failures; 82 of its tests self-skip when no database or
network credential is present.

Consequence recorded for later migration work: **the acceptance gate should be
`pnpm run test`, not `pnpm run test:ci`.** The stricter gate is available at no
cost, and the excluded files are the database and schema suites.

## 4. Route manifest

Three independent counts, two of which agree:

| Source | Count |
|---|---:|
| `dist/public/routes.json` — emitted by `scripts/build.mjs` | **330** |
| `client/src/App.tsx` — distinct `<Route path=…>` declarations | **330** |
| `audit/route_manifest.json` — `route_count` field | **232** |

`audit/route_manifest.json` is **stale by 98 routes**. The build output and the
source agree, so **`dist/public/routes.json` (330) is the authoritative route
manifest**. `scripts/reconcile-route-manifest.mjs` exists to regenerate the
audit file; running it is deliberately **not** part of this PR.

## 5. Configuration files actually present

In `russell-capital-systems/`:

| File | Present | Purpose |
|---|---|---|
| `drizzle.config.ts` | yes | Database config — `dialect: "mysql"` |
| `drizzle/schema.ts` | yes | 155 `mysqlTable` definitions, `drizzle-orm/mysql-core` |
| `vite.config.ts` | yes | Client build |
| `vitest.config.ts` | yes | Tests: `environment: node`, `include: ["server/**/*.test.ts", "server/**/*.spec.ts"]` |
| `tsconfig.json` | yes | TypeScript |
| `vercel.json` | **no** | — |
| `railway.json` / `railway.toml` / `nixpacks.toml` | **no** | — |
| `Dockerfile` / `Procfile` | **no** | — |

**Deployment is not configured by a file in this directory.** It is driven by a
repository-root workflow plus Railway-side settings outside this repository —
see §6. Railway's own service configuration is **UNVERIFIED** from here; it was
not inspected, and inspecting or changing it is out of scope.

## 6. Workflows at the repository root

`.github/workflows/` contains 12 files: `chain-probe.yml`, `deploy-branch.yml`,
`domain-probe.yml`, `drbuddy-probe.yml`, `intake-probe.yml`, `pages.yml`,
`probe.yml`, `railway-domain-fix.yml`, `railway-domain-query.yml`,
`rcs-security-audit.yml`, `site-audit.yml`, `whisperer-probe.yml`.

Two of them publish, and both fire **only on push to `master`**:

- **`deploy-branch.yml`** — on push to `master` under
  `paths: ["russell-capital-systems/**"]`, runs
  `git subtree split --prefix=russell-capital-systems -b deploy/rcs`,
  force-pushes `deploy/rcs`, then calls the Railway GraphQL API
  (`SERVICE_ID e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28`). `refs/heads/deploy/rcs`
  exists at `b7b02ff238189fc87545eb17186ad1c73f941069`.
- **`pages.yml`** — on push to `master` under `paths: ["docs/**", …]`, publishes
  the repository-root `docs/` directory to GitHub Pages.

**Therefore: merging a pull request that touches `russell-capital-systems/**`
into `master` is a Railway deployment.** This is recorded so it is never
discovered at merge time. Opening a PR deploys nothing; merging one does.

Only `rcs-security-audit.yml` runs on `pull_request`, and it runs an audit and
`tsc` — **no workflow ran the build or the test suite on a pull request before
this PR.**

## 7. Explicitly UNVERIFIED

- **Which GitHub Pages site currently serves the apex domain.** Two
  repositories carry a `CNAME` naming `russellcapitalsystems.com`:
  `russell-capital-domain-redirect` (last pushed 2026-09-05) and this
  repository's root `docs/` (last touched 2026-09-18). GitHub Pages allows one
  site per custom domain. Resolving this was not attempted: DNS-over-HTTPS is
  blocked by the environment's egress proxy (403 on CONNECT), and the GoDaddy
  API returns `[403] Authenticated user is not allowed access`, matching the
  identity-verification hold recorded in `DOMAIN_RUNBOOK.md`.
- **Railway service configuration, environment variables and secrets.** Not
  inspected.
- **Live production behaviour.** No deployed URL was fetched.
- **Database contents or connectivity.** No database was reached; 82 tests
  self-skip for exactly this reason.
