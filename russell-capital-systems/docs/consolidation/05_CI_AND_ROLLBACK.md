# Consolidation Foundation — CI, Secret Scanning and Rollback

Base: `russell-capital-app`. Live domain repo `russell-capital-domain-redirect` is out of scope and untouched.

## 1. CI status

Neither repository runs typecheck / build / test on a pull request today.
`sam-russell-corpus` has twelve workflows — probes, domain checks, audits — and none of them verifies the application.

`.github/workflows/consolidation-ci.yml` in this PR implements the gate. **It must be ported to
`russell-capital-app` as part of PR 1**, adjusted for that repo's layout (no `russell-capital-systems/`
prefix, `pnpm build` rather than `build:vercel` for verification).

## 2. What the gate enforces

| Step | Command | Gate |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | lockfile current |
| Typecheck | `pnpm check` | 0 errors |
| Tests | `pnpm test` | 0 failures |
| Build | `pnpm build` | exit 0 |
| Route count | parse emitted routes | must not decrease vs base branch |
| Secret scan | regex sweep over the diff | 0 hits |

The route-count gate is the cheap regression catch: a PR that silently drops routes fails before review.

## 3. Secret-scan results

**`sam-russell-corpus/russell-capital-systems` — clean.** Sweep for `sk-*`, `AKIA*`, `ghp_*`, PEM
private keys and Slack tokens over tracked files: zero live credentials. One hit, a labelled
placeholder (`xoxb-EXAMPLE-PLACEHOLDER` in `client/src/pages/portal/Integrations.tsx`).

**`russell-capital-app` — not yet swept.** A full baseline sweep of the new base is part of PR 1,
before any donor code lands in it.

**`russell-capital-domain-redirect` — its README asserts it holds no credentials; the repository is
five files and was read but not modified.**

## 4. Rollback

| Scope | Action |
|---|---|
| A merged migration PR | `git revert -m 1 <merge-sha>` |
| The whole donor tree | `git checkout -b rollback/consolidation pre-consolidation-live-20260920` |
| The base | PR 1 creates the equivalent tag in `russell-capital-app` before any change |

After any rollback, re-run `pnpm check && pnpm test && pnpm build` and compare against
`03_VERIFICATION.md`.

## 5. Explicitly not done

- No merge to main. No deployment.
- No DNS, domain, GoDaddy, Railway, Vercel, database, credential or environment-variable change.
- No repository deleted, archived or overwritten.
- No application code migrated. This PR is documentation plus one CI workflow.
- `russell-capital-domain-redirect` read only; nothing written to it.
