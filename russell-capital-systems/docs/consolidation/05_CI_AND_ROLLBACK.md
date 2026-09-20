# Consolidation Foundation — CI, Secret Scanning and Rollback

## 1. Gap found

The repository has twelve workflows (`chain-probe`, `deploy-branch`, `domain-probe`, `pages`,
`rcs-security-audit`, `site-audit`, and others) but **none of them typechecks, builds, or tests the
live application on a pull request.** Consolidation PRs would merge unverified.

This foundation adds `.github/workflows/consolidation-ci.yml`, which runs on any PR touching
`russell-capital-systems/**`.

## 2. What the workflow enforces

| Step | Command | Gate |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | lockfile must be current |
| Typecheck | `pnpm check` | 0 errors |
| Tests | `pnpm test:ci` | 0 failures |
| Build | `pnpm build` | exit 0 |
| Route count | parse `dist/public/routes.json` | must not *decrease* vs base |
| Secret scan | `gitleaks`-style regex sweep over the diff | 0 hits |

The route-count gate is the cheap regression catch: a consolidation PR that accidentally drops
routes fails before review.

## 3. Secret scanning

Baseline sweep over tracked files found **no live credentials**. The single pattern hit is a labelled
placeholder (`xoxb-EXAMPLE-PLACEHOLDER` in `client/src/pages/portal/Integrations.tsx`).

Donor code has **not** been scanned yet. **Every donor file is scanned before it is committed**, as
part of the migration PR that carries it — not afterwards.

## 4. Rollback

A tag marks the verified pre-consolidation state:

```
pre-consolidation-live-20260920
```

### To roll back a merged migration PR

```bash
git revert -m 1 <merge-commit-sha>     # preferred: preserves history
```

### To return the whole tree to the verified baseline

```bash
git checkout -b rollback/consolidation pre-consolidation-live-20260920
```

### After any rollback, re-run the baseline

```
pnpm check && pnpm test:ci && pnpm build
```
and confirm against `03_VERIFICATION.md`:
typecheck 0 errors · 313 routes · 2877 CI tests passing.

## 5. What this foundation explicitly does not do

- No DNS, domain, hosting, database or credential change.
- No production deployment.
- No repository merged wholesale.
- No registry (route manifest, sidebar, secondary catalogue, Drizzle schema) replaced.
- No application code migrated. This PR is documentation plus one CI workflow.
