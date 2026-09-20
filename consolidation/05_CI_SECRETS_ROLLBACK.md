# 5 · CI Checks, Secret Scanning, Rollback

**Date:** 2026-09-20

---

## 1 · CI added by this PR

One workflow: **`.github/workflows/rcs-consolidation-gate.yml`**.

It runs on `pull_request` only — **never on `push`** — so it can never be the
mechanism that ships anything. It uses no credentials, reaches no database, and
performs no deployment.

| Gate | Enforces | Baseline |
|---|---|---|
| 1 · Typecheck | `pnpm check` clean | exit 0 |
| 2 · Build | `pnpm build` clean | exit 0 |
| 3 · **Route manifest agreement** | `App.tsx` == `routeManifest.ts` == emitted `routes.json` | 330 = 330 = 330 |
| 4 · **No duplicate routes** | no path registered twice | 0 duplicates |
| 5 · Tests | `pnpm test:ci` | 194 files / 3,757 tests |
| 6 · **Test count floor** | test files ≥ 225 | 225 |
| 7 · **Registry floors** | engines ≥ 55, calculator catalogue ≥ 116 | 55 / 116 |
| S1 · Secret scan | credential patterns in the PR diff | clean |
| S2 · No tracked `.env` | `.env` never committed | clean |

Gates 3, 4, 6 and 7 are the machine half of the brief's rule that registries,
manifests and tests are not overwritten without documented comparison and
regression proof. A PR that shrinks a registry or drops a test **fails**, and the
PR body must then carry the comparison that justifies it.

Gate 4 exists because `russell-capital-app` accumulated **41 duplicate routes**,
each shadowing a component into dead code. The base has zero.

### Existing workflows — unchanged

Twelve workflows already exist at `.github/workflows/`. **None is modified.**

`chain-probe` · `deploy-branch` · `domain-probe` · `drbuddy-probe` ·
`intake-probe` · `pages` · `probe` · `railway-domain-fix` ·
`railway-domain-query` · `rcs-security-audit` · `site-audit` · `whisperer-probe`

`rcs-security-audit.yml` already runs `pnpm audit --audit-level=high` plus a
typecheck on every PR touching `russell-capital-systems/**`, and weekly on
Mondays 06:00 UTC. The new gate complements it and does not duplicate it.

---

## 2 · Secret scan results — baseline

Scanned **2,004 tracked files** under `russell-capital-systems/` (excluding
`dist/` and `node_modules/`) for: Anthropic/OpenAI keys, AWS access key IDs,
GitHub PATs, Slack tokens, and PEM private-key headers.

| Check | Result |
|---|---|
| High-confidence credential patterns in tracked source | **1 file — a placeholder, not a secret** |
| Tracked `.env` files, anywhere in the repo | **0** |
| Tracked `.pem` / `.key` files | **0** |

The single hit:

```
client/src/pages/portal/Integrations.tsx:261
    value="xoxb-EXAMPLE-PLACEHOLDER"
```

A UI placeholder in a Slack-integration form. Not a credential. It also appears
in two audit JSON files that embed that page's source
(`audit/full_page_audit_corpus.json`, `audit/page_inputs/043_portal-integrations.json`).

**Conclusion: no credentials are committed to the base.** `.gitignore` correctly
excludes `.env` and its variants.

Twelve files carry credential-ish *names* — all legitimate:
`scripts/owner_totp_secret.mjs` (generates a TOTP secret, stores none),
`server/{groq,mistral,openrouter,resend}.secret.test.ts` and
`providerCredentials.live.test.ts` (tests excluded from CI precisely *because*
they need real keys), and `SecretSecrets.tsx` / `SecretDetail.tsx` (a product
feature — "100 Physician Tax Strategies").

### Re-running locally

```bash
git ls-files russell-capital-systems \
  | grep -vE '^russell-capital-systems/(dist|node_modules)/' > /tmp/tracked.txt
xargs -a /tmp/tracked.txt grep -lIE \
  '(sk-ant-[A-Za-z0-9-]{24,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{12,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)'
```

---

## 3 · ⚠️ Deployment coupling — the binding operational constraint

**`.github/workflows/deploy-branch.yml` fires on push to `master` with paths
matching `russell-capital-systems/**`.** It republishes the `deploy/rcs` split
branch, which **Railway deploys**.

```yaml
on:
  push:
    branches: [master]
    paths: ["russell-capital-systems/**"]
```

**Any PR merged to `master` that touches the app subtree ships to production
automatically.** No further approval is requested by the pipeline.

This collides directly with the brief's requirement that there be *"no
production deployment … without a separate explicit approval."*

### How this PR avoids it

This foundation package is placed at repo root — `consolidation/` and
`.github/workflows/` — and touches **nothing** under `russell-capital-systems/`.
Merging it therefore **cannot** trigger a deploy.

### How later PRs must handle it — a decision is required

PR-05 onward *do* touch `russell-capital-systems/`. One of these must be chosen
**before PR-05 merges**:

| Option | Mechanism | Trade-off |
|---|---|---|
| **A · Integration branch** (recommended) | Create `consolidation/integration` from `master`. Every migration PR targets it. One reviewed `master` merge at the end, with explicit approval. | Production untouched throughout. One larger final merge. |
| **B · Gate the deploy workflow** | Add `if: contains(github.event.head_commit.message, '[deploy]')` to `deploy-branch.yml`'s `split` job. | Modifies existing CI, which the brief restricts. Affects all future pushes, not just this work. |
| **C · Pause the workflow** | Disable `deploy-branch.yml` for the duration. | Simple and reversible, but leaves production unable to ship a hotfix. |

**Recommendation: Option A.** It requires no change to existing CI, keeps
production entirely untouched during migration, and concentrates the deployment
decision into a single explicitly-approved merge at the end.

**This needs your decision before PR-05.** It is the one item in this package
that blocks progress.

---

## 4 · Rollback and tagging

### The repository currently has **zero tags**

```
$ git tag | wc -l
0
```

There is no named restore point. Creating one is the first rollback action and
is part of this PR's merge checklist.

### Baseline tag — create at merge of this PR

```bash
git checkout master && git pull
git tag -a rcs-baseline-2026-09-20 76ed5f2 \
  -m "Verified green baseline before consolidation.
330 routes / 309 pages / 55 engines / 116 calculators / 225 test files.
pnpm check, build, test:ci, test all exit 0."
git push origin rcs-baseline-2026-09-20
```

`76ed5f2` is the commit verified in [03](03_BASELINE_VERIFICATION.md).

### Tag before each migration PR

```bash
git tag -a rcs-pre-PR05 -m "Before PR-05 (9 gamification routes)" && git push origin rcs-pre-PR05
```

### Rollback procedures

**Un-merged PR** — close it. Nothing to undo.

**Merged PR, not yet deployed** (Option A, or a root-only change):

```bash
git revert -m 1 <merge-sha>     # -m 1 keeps the first parent (master)
git push origin master
```

**Merged and deployed** — revert, then confirm the deploy branch follows:

```bash
git revert -m 1 <merge-sha>
git push origin master
# deploy-branch.yml re-runs and republishes deploy/rcs from the reverted master
gh run watch                     # confirm the split job completes
# then confirm Railway picked up the new deploy/rcs head
```

**Full restore to baseline** (last resort, needs explicit approval — it discards
every consolidation commit):

```bash
git checkout master
git reset --hard rcs-baseline-2026-09-20
git push --force-with-lease origin master
```

`--force-with-lease`, never `--force`: it refuses if anyone else has pushed.

### Verifying a rollback worked

```bash
cd russell-capital-systems
pnpm install && pnpm check && pnpm build && pnpm test:ci
grep -c '<Route path=' client/src/App.tsx          # expect 330 at baseline
```

A rollback is complete only when these match
[03_BASELINE_VERIFICATION.md](03_BASELINE_VERIFICATION.md) §3.1.

---

## 5 · Merge checklist for this PR

- [ ] Gate workflow passes on this PR
- [ ] Confirm no file under `russell-capital-systems/` is modified:
      `git diff --name-only master... | grep russell-capital-systems/` → empty
- [ ] Merge
- [ ] Create and push `rcs-baseline-2026-09-20`
- [ ] **Decide Option A / B / C for deployment coupling (§3)** — blocks PR-05
- [ ] Confirm `deploy-branch.yml` did **not** run for this merge
