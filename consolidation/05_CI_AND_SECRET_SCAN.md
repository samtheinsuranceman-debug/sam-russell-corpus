# 5 — CI Checks, Secret Scan, Rollback

**Date:** 2026-09-20
**Workflow added by this PR:** `.github/workflows/consolidation-ci.yml`

---

## 5.1 CI checks

Three jobs. The workflow declares `permissions: contents: read` — it **cannot write to the
repository**, cannot deploy, cannot reach a database, and touches no hosting or DNS.

### Job 1 — `verify`
Reproduces, on every PR, the four commands proven green in document 3:

| Step | Command | Gate |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | lockfile drift fails the build |
| Typecheck | `pnpm check` | must stay at **0 errors** |
| Build | `pnpm build` | must succeed and emit `routes.json` |
| Test | `pnpm test:ci` | must stay at **194/194 files, 0 failed** |

The route manifest is uploaded as a build artifact on every run, pass or fail, so any PR's
route surface can be inspected without re-running anything.

### Job 2 — `route-manifest-guard`
The guard that makes phased migration safe. It builds the **base branch** and the **PR head**,
then diffs the two route manifests and **fails if any pattern was removed or re-pointed.**
Additions pass; it prints them so the reviewer sees exactly which routes the PR introduces.

This is the mechanical enforcement of the stated constraint that the route manifest must not be
overwritten. It cannot be forgotten, argued around, or skipped.

### Job 3 — `secret-scan`
`gitleaks` across full history, plus an explicit check that no `.env`, `.pem`, `.p12`, `.pfx`,
`id_rsa`, or `credentials.json` is tracked. `.env.example` is allowed.

### Baselines CI must hold

| Metric | Required |
|---|---|
| Typecheck errors | 0 |
| `test:ci` files passing | 194 / 194 |
| `test:ci` tests passing | ≥ 3,757 |
| Route patterns removed | 0 |
| Secrets found | 0 |

A PR that lowers any of these fails.

---

## 5.2 Secret scan — results for this repository

Scan run in this session across **5,298 tracked text files** (binaries excluded), against 16
credential patterns: AWS keys, GitHub tokens, Slack tokens, Stripe live/restricted keys, OpenAI
and Anthropic keys, Google API keys, SendGrid, Resend, private-key blocks, JWTs, Postgres /
MySQL / Mongo connection strings with embedded passwords, and Twilio SIDs.

### Result: **no live credentials found.**

30 raw pattern matches were returned. **All 30 were inspected and all 30 are false positives:**

| Pattern | Matches | What they actually are |
|---|---:|---|
| MySQL URL with password | 17 | Documentation templates — `mysql://USER:PASS@HOST:3306/DBNAME` in `LAUNCH.md`, `RECOVERY_PLAN.md`, runbooks; and one regex *source* inside a shell script |
| "Resend key" (`re_…`) | 10 | Ordinary identifiers beginning `re_` — e.g. the database index name `re_requests_token_unique`, and prose like `re_graduates_with_debt` |
| "OpenAI key" (`sk-…`) | 3 | Prose beginning `sk-` — e.g. `sk-determinations-medical-device-premarket-review` in a compliance page, and a CSV catalogue entry |

### Files tracked that relate to configuration

| File | Assessment |
|---|---|
| `AQAL/aqal-platform/.env.example` | Correct practice — template only, no values |
| `doctor-buddy/.env.example` | Correct practice — template only, no values |

**No real `.env`, key, certificate, or credential file is tracked anywhere in the repository.**
`russell-capital-systems/.gitignore` correctly excludes `.env`, `.env.local`,
`.env.development.local`, `.env.test.local`, `.env.production.local`.

### Reproducing
```bash
gitleaks detect --source . --no-git -v
git ls-files | grep -iE '(^|/)\.env($|\.)|\.pem$|id_rsa' | grep -v '\.env\.example$'
```

---

## 5.3 Rollback

### Tag before any migration begins
```bash
git tag -a pre-consolidation-2026-09-20 76ed5f2 \
  -m "Canonical base before any consolidation migration. Verified: 0 tsc errors, 194/194 test files, 330 routes."
git push origin pre-consolidation-2026-09-20
```

> **Not created by this PR.** This PR adds no code, so there is nothing yet to roll back from.
> The tag should be pushed immediately before PR-3 (the first PR that touches application code)
> and is listed as that PR's first prerequisite in document 6.

### Rolling back one migration PR
Each migration PR is a single squashed commit on `master`, so:
```bash
git revert -m 1 <merge-commit-sha>
pnpm install --frozen-lockfile && pnpm check && pnpm build && pnpm test:ci
```
Every PR in document 6 is scoped so that reverting it cannot break the PR before it —
dependencies always land before dependants.

### Rolling back the whole consolidation
```bash
git checkout -b recovery pre-consolidation-2026-09-20
```
The tag is immutable and the corpus is preserved. No donor repository is modified, archived, or
deleted at any point, so every source of truth remains independently recoverable.

### Deployment rollback
**Not applicable.** Nothing in this plan deploys. Production continues to be served by whatever
is serving it today, unchanged, until a separate and explicit deployment approval is given.
