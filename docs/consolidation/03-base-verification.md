# 3 — Base Verification

Requirement: *"Verification that the live build installs, typechecks, builds,
and runs its reported tests."*

**Target:** `sam-russell-corpus/russell-capital-systems/` @ `76ed5f2`
**Executed:** 2026-09-20, Linux 6.18.44, Node via pnpm 10.4.1
**Result: all four gates pass.**

| Gate | Command | Exit | Result |
|---|---|---|---|
| Install | `pnpm install --prefer-offline` | **0** | ✅ |
| Native rebuild | `pnpm rebuild esbuild @tailwindcss/oxide` | 0 | ✅ required; both have build scripts ignored by default |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | **0** | ✅ **0 errors** |
| Build | `pnpm build` | **0** | ✅ |
| Tests | `pnpm test:ci` | **0** | ✅ **194 files, 3,757 passed, 5 skipped, 0 failed** |

## Test detail

```
Test Files  194 passed (194)
     Tests  3757 passed | 5 skipped (3762)
  Duration  64.28s
```

No failures. This is the regression baseline every migration PR must hold.
**Any PR that reduces passing tests below 3,757 or adds a failure is blocked.**

Non-fatal noise observed and expected (not failures):
`[OAuth] ERROR: OAUTH_SERVER_URL is not configured` — guarded integration,
absent by design in a keyless environment.

## Build output

| Artifact | Size |
|---|---|
| `dist/index.js` (server bundle, esbuild) | 3.96 MB |
| `dist/public/` (client, Vite) | 48 MB |

## Available scripts

`dev, build, start, check, format, test, test:ci, db:push, live:build, release,
db:build, db:schema, owner:password, owner:totp, db:backup, db:restore,
security:audit, mail:check, followups:run`

Notable, and not present in either donor repo: `security:audit`, `db:backup`,
`db:restore`, `release`, `live:build`, `owner:totp`. These are operational
capabilities unique to the base and are a further argument for its selection.

## Runtime

Not exercised. `pnpm start` requires `DATABASE_URL`, and the decision prohibits
touching databases and credentials. **Install, typecheck, build, and tests are
verified; runtime against a live database is deliberately not.** Recommend a
throwaway MySQL instance in Phase 0 to close this gap without touching
production — see `06-phased-pr-plan.md`, PR-0.

## Reproduce

```bash
cd sam-russell-corpus/russell-capital-systems
pnpm install --prefer-offline
pnpm rebuild esbuild @tailwindcss/oxide   # load-bearing
npx tsc --noEmit -p tsconfig.json
pnpm build
pnpm test:ci
```
