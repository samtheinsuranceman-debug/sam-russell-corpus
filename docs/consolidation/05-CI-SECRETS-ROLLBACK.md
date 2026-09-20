# 5 — CI, Secret Scanning, and Rollback

**Compiled:** 2026-09-20

---

## 5.1 What CI already does

`.github/workflows/rcs-security-audit.yml` runs on **every pull request
touching `russell-capital-systems/**`**, plus weekly on Mondays at 06:00 UTC:

| Step | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Known vulnerabilities | `pnpm audit --audit-level=high` |
| Typecheck | `pnpm check` |
| Unit tests | `pnpm test:ci` |

That is a real gate and it is better than the repository's other eleven
workflows suggest — the rest are `workflow_dispatch` probes, the Pages
publisher, and the Railway deploy splitter.

## 5.2 What it does not do, and what this PR adds

`.github/workflows/consolidation-ci.yml` (new, in this PR) adds three things,
on the same `pull_request` trigger. It does not deploy, and it touches no DNS,
database or credential.

### 1. Build

`pnpm check` is a typecheck, not a build. The Vite/esbuild pipeline, the
Tailwind compile and the route-manifest emit can all fail on a tree that
typechecks cleanly. A migration that adds hundreds of lazy-loaded page chunks
is precisely the change that finds that out.

The job also asserts `dist/public/routes.json` exists and carries **at least
330 route patterns** — the measured baseline. Migrations only add routes, so a
drop means something was dropped.

### 2. Secret scanning

There was none. Given that this programme copies code out of donor
repositories, and that `scripts/DEPLOY.md` documents three burned keys, that
is the gap most likely to cause real damage.

The `secrets` job runs **gitleaks over full history** (`fetch-depth: 0`),
because a key removed in a later commit is still a leaked key and still needs
rotating.

> **Environment note:** no `gitleaks` or `trufflehog` binary was available
> where this PR was prepared, so the scan in document 03 §3.6 was a pattern
> scan over tracked files (OpenAI, Stripe live, GitHub, AWS, Slack, Google,
> PEM headers). It found one placeholder and nothing else. The gitleaks job
> here has therefore **not been executed** — it will run for the first time on
> this PR. If it fails, it is finding something the pattern scan could not,
> and that is the job working.

### 3. Registry and navigation integrity

A dedicated job runs the five suites that protect the registries every
migration touches:

```
server/navigation-route-integrity.test.ts   (new, this PR)
server/navigation-organization.test.ts
server/calculatorCatalog.test.ts
server/grok-merge.smoke.test.ts
server/integrationAudit.test.ts
```

Verified passing together on `master`: **5 files, 52 tests**.

### 4. Regression floor

A green run with two hundred fewer tests is not a green run. The `verify` job
asserts `test:ci` reports **≥ 194 files and ≥ 3,757 tests**, the measured
baseline. A suite that silently stops being collected fails the build.

---

## 5.3 The new navigation guard

`server/navigation-route-integrity.test.ts` closes a direction nothing checked.

The suite already proves **routes → navigation**: every static portal route is
reachable from the sidebar or the secondary catalogue. Nothing proved
**navigation → routes**, so a sidebar entry pointing at a route that does not
exist was invisible.

Two survived that way — `/portal/tool-explorer` and
`/portal/knowledge-library`. Neither is in `App.tsx`, neither is in
`shared/routeManifest.ts`, and there is no redirect mechanism. They 404. And
`navigation-organization.test.ts` **asserts they must be in the menu**, so the
suite was enforcing two broken links.

The new test lists both as **explicit, asserted exemptions** — the same
`NOT_IN_NAVIGATION` pattern the existing test uses, for the same stated
reason: an exemption list is a liability if it is allowed to grow quietly. A
third broken link cannot be added without failing CI, and an exemption that
gets fixed must be removed or the test fails on *that*.

Fixing the two is PR-1 in document 06. **No existing test was modified.**

---

## 5.4 Rollback and tagging

### Tag before anything moves

```bash
git checkout master
git pull --ff-only
git tag -a consolidation-baseline-2026-09-20 -m "Verified green baseline before consolidation.
pnpm install/check/build: pass. test:ci 194 files / 3757 tests. test 216 files / 4138 tests.
See docs/consolidation/03-VERIFICATION.md"
git push origin consolidation-baseline-2026-09-20
```

Tag each phase as it lands: `consolidation-phase-2`, `-phase-3`, and so on.
Every phase then has a named point to return to, rather than a commit hash
somebody has to go and find.

### Rolling back one merged capability PR

Preferred — it is additive and leaves the history readable:

```bash
git checkout master && git pull --ff-only
git revert -m 1 <merge-commit-sha>      # -m 1: keep master's side
git push origin master
```

**This triggers a production deploy** (see §5.5). That is usually what you
want during a rollback, but it must be a deliberate choice, not a surprise.

### Rolling back everything

```bash
git checkout -b rollback/to-baseline consolidation-baseline-2026-09-20
# open a PR from this branch; do not force-push master
```

**Never force-push `master`.** `deploy/rcs` is generated from it by subtree
split, and Railway deploys that branch — a rewritten history desynchronises
the two in a way that is awkward to diagnose under pressure.

### Verifying a rollback actually worked

Re-run the baseline from document 03 §3.8 and compare all seven numbers.
A rollback is complete when they match, not when the revert commit lands.

---

## 5.5 The deployment gate — the most important operational item here

`.github/workflows/deploy-branch.yml`:

```yaml
on:
  push:
    branches: [master]
    paths: ["russell-capital-systems/**"]
```

It splits the subtree to `deploy/rcs` and POSTs Railway service
`e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28`.

> **Merging any capability PR into `master` deploys it to production. There is
> no manual gate between merge and deploy.**

That is incompatible with "no production deployment without separate explicit
approval", so until it is addressed:

**Capability PRs target a long-lived branch, not `master`.**

```bash
git checkout master
git checkout -b consolidation/main
git push -u origin consolidation/main
```

Every PR in document 06 targets `consolidation/main`. Nothing reaches `master`
— and therefore nothing reaches production — until you explicitly approve a
promotion PR from `consolidation/main` to `master`.

**Two ways to make the gate permanent**, either of which is a small change,
neither of which is made here because both touch deployment:

1. Add `if: github.event.head_commit.message != ''` style guarding — weak.
2. **Preferred:** change `deploy-branch.yml` to `workflow_dispatch` only, so
   deployment becomes a deliberate button-press. The subtree split can stay
   automatic; only the Railway POST needs gating.

I have not changed it. It is your call and it is a deployment change.

---

## 5.6 Branch protection worth setting (manual, in repository settings)

Not settable from a PR. Recommended before Phase 2:

- Require `Consolidation CI / verify`, `/ secrets` and `/ registries` to pass.
- Require `RCS security audit / audit` to pass.
- Require one approving review.
- Disallow force-push to `master` and to `consolidation/main`.
- Require branches to be up to date before merge, so the regression floor is
  measured against current `master`.
