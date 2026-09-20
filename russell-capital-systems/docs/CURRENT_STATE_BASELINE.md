# Current-State Baseline

**Recorded:** 20 September 2026 · **Method:** commands actually run in this repository.
Anything not proven by a command is marked `UNVERIFIED`.

---

## Identity

| Fact | Value |
|---|---|
| Hosting repository | `samtheinsuranceman-debug/sam-russell-corpus` |
| Application path | `russell-capital-systems/` (a directory, not a repository — see `REPOSITORY_MAP.md`) |
| Default branch | `master` |
| Default-branch SHA | `f325575413676a5108ff9128003cd56c0cdcd4b7` |
| Package name | `russell-capital-unified@1.0.0` |

## Toolchain

| Fact | Value |
|---|---|
| Node | `v22.22.2` |
| Package manager | `pnpm 10.34.2` |
| Lockfile | `pnpm-lock.yaml` (present) |
| Workspace file | `pnpm-workspace.yaml` (present) |

## Commands, as they actually exist in `package.json`

| Purpose | Script | Command |
|---|---|---|
| Install | — | `pnpm install --frozen-lockfile` |
| Typecheck | `check` | `tsc --noEmit` |
| Test (full) | `test` | `vitest run` |
| Test (CI subset) | `test:ci` | `vitest run` with 25 `--exclude` patterns |
| Build | `build` | `node scripts/build.mjs && esbuild server/_core/index.ts …` |
| Format | `format` | `prettier --write .` |
| DB push | `db:push` | `drizzle-kit generate && drizzle-kit migrate` |
| **Lint** | — | **ABSENT. No `lint` script exists.** A lint gate cannot be added to CI without first choosing and configuring a linter. |

## Clean-run results

All four run on `f325575`, in order, on a clean install:

| Command | Exit | Result |
|---|---|---|
| `pnpm install --frozen-lockfile` | **0** | Lockfile satisfied |
| `pnpm check` | **0** | **0 TypeScript errors** |
| `pnpm build` | **0** | **321 route patterns** → `dist/public/routes.json`; `dist/index.js` 3.2 MB |
| `pnpm test` | **0** | **3439 passed · 0 failed · 80 skipped** · 202 files (193 passed, 9 skipped) |
| `pnpm test:ci` | **0** | **3058 passed · 0 failed · 3 skipped** · 171 files |

`test:ci` excludes 25 files that `test` includes. **Both pass**, so the exclusions are not masking
failures. Why each is excluded is `UNVERIFIED` — the exclusions predate this document.

## Route manifest

| Fact | Value |
|---|---|
| Source of truth | `client/src/App.tsx` — `<Route path="…">` declarations |
| Count | **321** |
| Emitted artifact | `dist/public/routes.json` (`{ generatedAt, routes[] }`) produced by `scripts/build.mjs` |
| Emitter agreement | Build reports 321; static parse of `App.tsx` reports 321 — **they agree** |
| **Duplicate paths** | **None.** `sort \| uniq -d` over all declared paths returns empty |

## Deployment configuration present in the repository

**None found.** A search of the application root and one level below for `railway*`, `vercel*`,
`Procfile`, `Dockerfile`, `nixpacks*` and `*.toml` returned nothing.

The program document states this application is "the current live Railway application." **That
cannot be confirmed from the repository contents** and is recorded here as `UNVERIFIED`. Railway
was not queried — doing so is outside the permitted scope. The deployment may be configured
entirely in the Railway dashboard, which would be consistent with the absence of files.

## Database configuration present

| File | Purpose |
|---|---|
| `drizzle.config.ts` | Drizzle Kit configuration |
| `drizzle/*.sql` | Generated migrations (2 files) |
| `server/db.ts` | Connection, guarded on `process.env.DATABASE_URL` |

The full suite passes **without** `DATABASE_URL` set, because DB-dependent tests skip when the
variable is absent.

## Secret scan

Sweep over all tracked files for `sk-…`, `AKIA…`, `ghp_…`, PEM private-key headers and Slack
tokens, excluding labelled examples and placeholders: **zero hits.**

## Statement of non-change

**This pull request changes no DNS record, CNAME, A record, domain forwarding, GoDaddy setting,
Railway configuration, Vercel configuration, GitHub Pages setting, custom domain, alias, public URL
routing, database configuration, migration, driver, production data, credential, secret, access
token or environment-variable value. It adds documentation and one non-deploying CI workflow.**
