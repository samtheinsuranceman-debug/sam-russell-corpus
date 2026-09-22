# Current-state baseline

**Date:** 2026-09-20 · **Recorded from real command runs only.**

Nothing here is estimated. Every number came from executing the command shown
and reading its exit code directly — not from piping through `tail` and reading
the pager's status, which is how a failure was nearly missed earlier in this
program. Anything that could not be proven from this working tree is marked
**UNVERIFIED**.

---

## 1. Identity and branch

| Item | Value |
|---|---|
| Application path | `russell-capital-systems/` |
| Hosting repository | `samtheinsuranceman-debug/sam-russell-corpus` |
| Standalone `russell-capital-systems` repo | **Does not exist** — see `REPOSITORY_MAP.md` |
| Default branch | `master` |
| **Default-branch commit SHA** | **`76ed5f2b4097ada56314a5c4b48f457356e5f435`** |
| Own `.git` | None — plain subdirectory, not a submodule |

---

## 2. Package manager and lockfile

| Item | Value |
|---|---|
| Package manager | **pnpm** |
| `packageManager` field | `pnpm@10.34.2` |
| Lockfile | `pnpm-lock.yaml` (committed, 324 KB) |
| Workspace file | `pnpm-workspace.yaml` (committed) |
| Node | v22.22.2 |
| pnpm | 10.34.2 |
| `package-lock.json` | Absent |

**`npm install` fails on this tree — exit 1.** npm's arborist cannot walk the
committed pnpm store: `TypeError: Cannot read properties of null (reading
'matches')` at `Link.matches`. This is a package-manager mismatch, not a broken
repository. Use pnpm.

---

## 3. Commands — as they actually exist in `package.json`

| Purpose | Command | Exists |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | ✅ |
| Typecheck | `npm run check` → `tsc --noEmit` | ✅ |
| Build (production) | `npm run build` → `node scripts/build.mjs && esbuild server/_core/index.ts …` | ✅ |
| Test (full) | `npm run test` → `vitest run` | ✅ |
| Test (CI subset) | `npm run test:ci` → `vitest run` with 26 `--exclude` flags | ✅ |
| Format | `npm run format` → `prettier --write .` | ✅ |
| **Lint** | — | **ABSENT — no lint script exists** |

There is no linter. CI therefore cannot run one, and does not pretend to.

---

## 4. Verified results — clean run, 2026-09-20

| Check | Command | Exit | Result |
|---|---|:--:|---|
| Install | `pnpm install --frozen-lockfile` | **0** | Done in 1s |
| Typecheck | `npx tsc --noEmit` | **0** | **0 errors** (zero output lines) |
| Build | `npm run build` | **0** | **330 route patterns** written to `dist/public/routes.json` |
| Test (full) | `npx vitest run` | **0** | **216 files passed · 9 skipped (225)**<br>**4,138 passed · 82 skipped (4,220)** · **0 failed** |
| Test (CI) | `npm run test:ci` | **0** | **194 files passed**<br>**3,757 passed · 5 skipped (3,762)** · **0 failed** |

**The green baseline this program must preserve: 4,138 passing, 0 failing,
82 skipped, 330 routes.**

### CI/full-suite gap

`test:ci` carries 26 `--exclude` flags, so it runs **22 fewer files and 381
fewer tests** than the full suite. Some exclusions are legitimate
(`*.secret.test.ts`, `*.live.test.ts` need credentials CI will not hold).
Others are not in that category: `databaseSchemaFile`, `persistence-schema`,
`core-table-queryability`, `subscriptionGate` — schema and access-control
suites. **Both suites pass today**; the exposure is that a future change could
break a schema test and still show green in CI. The CI workflow added by this
PR therefore gates on the **full** suite.

---

## 5. Route manifest

| Item | Value |
|---|---|
| Location | **`shared/routeManifest.ts`** |
| Export | `ROUTE_MANIFEST: readonly string[]`, plus `ROUTE_COUNT` |
| **Count** | **330** |
| Unique | 330 — **no duplicates** |
| `App.tsx` route declarations | 330, **330 unique, 0 duplicates** |
| Manifest set == `App.tsx` set | **True** |

The manifest is authoritative and currently in exact agreement with the router.
**Duplicate-route findings: none, pre-existing or introduced.**

---

## 6. Deployment configuration present in this subtree

| File | Present |
|---|---|
| `railway.json` / `railway.toml` | **Absent** |
| `nixpacks.toml` | **Absent** |
| `Procfile` | **Absent** |
| `Dockerfile` / `docker-compose.yml` | **Absent** |
| `vercel.json` | **Absent** |
| `netlify.toml` / `render.yaml` / `fly.toml` / `app.json` | **Absent** |
| `.github/workflows/` inside the subtree | **Absent** |

**No deployment configuration exists inside `russell-capital-systems/`.**
Deployment is driven from the hosting repository's root workflows (§7).

---

## 7. How this application actually reaches production

From `.github/workflows/deploy-branch.yml` at the **repository root**, quoted:

> "Keeps `deploy/rcs` equal to the russell-capital-systems/ subtree of master.
> Railway deploys that slim branch (root "/") instead of snapshotting the whole
> corpus (~800 MB of PDFs and audio) on every build."

```
sam-russell-corpus @ master
  └─ russell-capital-systems/
       │  git subtree split --prefix=russell-capital-systems
       ↓
     deploy/rcs  (force-pushed on master commits touching that path)
       ↓
     Railway service e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28
```

Root workflows present: `deploy-branch.yml`, `pages.yml`, `chain-probe.yml`,
`domain-probe.yml`, `drbuddy-probe.yml`, `intake-probe.yml`, `probe.yml`,
`railway-domain-fix.yml`, `railway-domain-query.yml`, `rcs-security-audit.yml`,
`site-audit.yml`, `whisperer-probe.yml`.

**Trigger safety, verified before anything was pushed:**

- `deploy-branch.yml` — `push: branches: [master]`. A feature branch does **not**
  trigger it.
- `pages.yml` — `push: branches: [master]`, `paths: ["docs/**", …]`, where
  `docs/**` is the **repository root** `docs/`. The documents in this PR are at
  `russell-capital-systems/docs/`, a different path, and do **not** trigger it.
- `railway-domain-fix.yml`, `railway-domain-query.yml` — `workflow_dispatch`
  only, and both require a Railway token supplied by hand. Neither can fire
  from a pull request.
- `rcs-security-audit.yml` — `pull_request: paths: ["russell-capital-systems/**"]`.
  **This PR will trigger it.** It is a non-deploying audit (`pnpm audit` +
  typecheck).

**UNVERIFIED:** that `www.russellcapitalsystems.com` currently resolves to that
Railway service, and that the apex is served by a GitHub Pages shim from
`russell-capital-domain-redirect`. Both are stated in the governing document
and are consistent with the workflows, but confirming them requires inspecting
live DNS and provider dashboards — out of scope, and deliberately not done.

---

## 8. Database configuration present

| File | Present | Detail |
|---|---|---|
| `drizzle.config.ts` | ✅ | |
| `drizzle/schema.ts` | ✅ | **156 `mysqlTable` declarations — MySQL** |
| `server/db.ts` | ✅ | |
| `.env` | **Absent**, and git-ignored | |

Connection strings appear only as documentation placeholders
(`mysql://USER:PASS@HOST:3306`). Credentials are read from the environment.

**Note for future intake:** `russell-capital-app` is **PostgreSQL** (117
`pgTable`). The two schemas are different databases and are not mergeable.

---

## 9. Secret scan

Scanned git-tracked files with 14 credential patterns — AWS key, GitHub PAT,
OpenAI, Anthropic, Stripe live and restricted, Google API, Slack token, PEM /
OpenSSH private-key block, JWT, database URL with inline password, SendGrid,
Twilio SID, Resend.

| Measure | Result |
|---|---|
| Tracked files scanned | 2,039 |
| Raw pattern hits | 10 |
| Placeholders / examples | 10 — all `USER:PASS@HOST` or `unused:unused@127.0.0.1` |
| **Confirmed credentials** | **0** |
| Credentials anywhere in 143 commits of history | **0** |
| `.env` tracked | No — `.gitignore` covers `.env` and its variants |

---

## 10. Statement of non-change

**This pull request changes no DNS, CNAME, A record, domain forwarding, GoDaddy
configuration, GitHub Pages configuration, Railway configuration, Railway custom
domain, Vercel alias, public URL routing, hosting provider, database
configuration, database driver, production data, migration, credential, secret,
access token or environment variable.**

It adds documentation under `russell-capital-systems/docs/` and one
non-deploying CI workflow. It modifies no application source file, no route, no
schema and no existing workflow. `russell-capital-domain-redirect` was not
modified, not merged into, and no access to it was requested; its existence was
confirmed from repository listing metadata only.
