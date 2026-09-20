# 5 — CI, Secret Scanning, and Rollback

Requirement: *"CI checks, secret scanning, and rollback/tag instructions."*

## 5.1 CI as it stands

The repo has **12 workflows**, but only one gates the application.

| Workflow | Triggers | Gates the app? |
|---|---|---|
| `rcs-security-audit.yml` | Mon 06:00 UTC · PRs touching `russell-capital-systems/**` · manual | ✅ **the only one** |
| `site-audit.yml`, `probe.yml`, `domain-probe.yml`, `chain-probe.yml`, `intake-probe.yml`, `whisperer-probe.yml`, `drbuddy-probe.yml` | probes / schedules | ✗ external monitoring |
| `deploy-branch.yml`, `pages.yml` | deploy | ✗ **not to be triggered during consolidation** |
| `railway-domain-fix.yml`, `railway-domain-query.yml` | manual | ✗ **hosting — out of scope by decision** |

`rcs-security-audit.yml` runs `pnpm audit --audit-level=high` plus a typecheck.
Good, and correctly path-filtered — but **it does not run the test suite or the
build.** The 3,757-test baseline is currently protected by nothing automated.

> ⚠️ `deploy-branch.yml`, `pages.yml`, and the two `railway-*` workflows can
> change hosting. The decision forbids that without separate approval. **No
> consolidation PR may modify these files or dispatch these workflows.**

## 5.2 Required CI gate — proposed, not yet added

Adding a test/build gate is itself an application-affecting change, so it is
proposed here and lands in **PR-0**, not in this documentation PR.

`.github/workflows/rcs-consolidation-gate.yml` — on every PR touching
`russell-capital-systems/**`:

| Step | Command | Pass condition |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| Native rebuild | `pnpm rebuild esbuild @tailwindcss/oxide` | exit 0 (load-bearing) |
| Typecheck | `npx tsc --noEmit` | **0 errors** |
| Build | `pnpm build` | exit 0 |
| **Tests** | `pnpm test:ci` | **≥ 3,757 passing, 0 failing** |
| Route reconcile | `node scripts/reconcile-route-manifest.mjs` | no new orphans |
| Secret scan | `gitleaks detect --no-git` | 0 findings |

The test-count floor is the mechanism that enforces the decision's
"no regression without proof" rule.

## 5.3 Secret scanning

**Current state — clean:**

- No `.env` files are tracked (`git ls-files` finds none outside examples).
- `.gitignore` covers `.env`, `.env.local`, `.env.development.local`,
  `.env.test.local`, `.env.production.local`.
- `PROVENANCE.md` records that Slack placeholder patterns in 9 files were
  neutered so push protection and scanners do not flag them — UI hints and test
  fixtures, never real credentials.

**Standing risk:** the repository is **public**. Every migration PR must be
scanned before push, not after.

**Per-PR requirement:**

```bash
gitleaks detect --source . --no-git --redact
git diff --stat origin/master...HEAD   # review every added file
```

Donor repos carry live-credential history — `russell-capital-app/DEPLOY_NOTES.md`
documents an Aiven `DATABASE_URL` held in a gitignored `.env`. **Never copy a
donor's `.env`, and never copy a connection string into a doc or comment.**
The decision's prohibition on moving credentials is absolute.

GitHub-side, recommend enabling on this repo: secret scanning, push protection,
and Dependabot alerts.

## 5.4 Rollback

**Current state: `git tag` returns nothing — the repository has zero tags.**
There is no named point to roll back to. This is the single largest operational
gap and PR-0 closes it.

### Baseline tag — create before any migration PR

```bash
git -C sam-russell-corpus fetch origin master
git -C sam-russell-corpus tag -a consolidation-baseline-2026-09-20 origin/master \
  -m "Verified pre-consolidation baseline. russell-capital-systems @ checkpoint bcfe0624.
      install/typecheck/build clean; 194 test files, 3757 passed, 5 skipped, 0 failed."
git -C sam-russell-corpus push origin consolidation-baseline-2026-09-20
```

### Per-PR tag

Tag `master` immediately **before** each migration PR merges:

```bash
git tag -a pre-PR-<n>-<slug> master -m "Before PR-<n>: <capability>. Tests: <count> passing."
git push origin pre-PR-<n>-<slug>
```

### Rollback procedure

`master` is never force-pushed. Rollback is always a forward revert:

```bash
# Single PR
git revert -m 1 <merge-commit-sha>

# Back to a known-good tag
git checkout -b rollback/to-<tag> <tag>
# open a PR from that branch

# Verify before merging the rollback
pnpm install --frozen-lockfile && pnpm rebuild esbuild @tailwindcss/oxide
npx tsc --noEmit && pnpm build && pnpm test:ci   # must return to ≥3,757 passing
```

### Rollback triggers

Roll back immediately, without debate, if a merged PR causes any of:

- test count below 3,757, or any failing test
- non-zero `tsc` errors or a failing build
- a secret-scan finding
- an unresolved route collision from `04-route-collision-and-dependencies.md`
- any change to DNS, domains, hosting, databases, or credentials

## 5.5 Branch protection — recommended for PR-0

On `master`: require the consolidation gate to pass, require one review, forbid
force-push and deletion, require branches current before merge.
