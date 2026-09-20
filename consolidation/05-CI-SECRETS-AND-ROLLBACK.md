# 5 — CI checks, secret scan, rollback

## 5.1 CI as it stands — the gap this PR closes

`sam-russell-corpus` carries ten workflows. Nine are probes and publishers. Only
one runs on pull requests, and it does not run the tests.

| Workflow | Triggers | Runs build/typecheck/test? |
|---|---|---|
| `rcs-security-audit.yml` | schedule (Mon 06:00 UTC), **pull_request** on `russell-capital-systems/**` | audit + `tsc` only |
| `deploy-branch.yml` | **push to `master`** on `russell-capital-systems/**` | no — publishes the `deploy/rcs` subtree |
| `pages.yml` | **push to `master`** on `docs/**` | no — publishes GitHub Pages |
| `chain-probe`, `intake-probe`, `probe`, `whisperer-probe`, `site-audit`, `railway-domain-fix`, `railway-domain-query` | `workflow_dispatch` | no |

**Before this PR, no workflow ran `pnpm run build` or `pnpm run test` on a pull
request.** A migration PR could have gone green without the suite executing.

### What this PR adds

`.github/workflows/consolidation-verify.yml` — read-only, deploys nothing,
touches no database. On any PR touching `consolidation/**`,
`russell-capital-systems/**`, or the workflow itself:

1. `pnpm install --frozen-lockfile`
2. `pnpm run check`
3. `pnpm run build`
4. Print the route-pattern count from `dist/public/routes.json`
5. `pnpm run test` — **the full suite, not `test:ci`** (see §3.2)
6. Secret scan, in a separate job

Step 4 exists so every migration PR states its own route delta in its check log
rather than inheriting a number from this document.

### Deployment safety — verified, not assumed

`deploy-branch.yml` and `pages.yml` both fire **only on push to `master`**.
Pushing the consolidation branch and opening this PR triggers neither.

There is a consequence worth stating plainly, because it is a foot-gun for every
later PR: **merging anything under `russell-capital-systems/` to `master`
republishes the `deploy/rcs` subtree, which is what Railway deploys.** Merge to
`master` is therefore a deploy action in this repository. The consolidation docs
were placed at `consolidation/` at the repository root, which neither workflow
watches, precisely so that this PR cannot deploy anything even if merged.

## 5.2 Secret scan

`consolidation/tools/secret_scan.py` runs 12 anchored patterns — AWS access
keys, GitHub tokens, OpenAI / Anthropic keys, Stripe live keys, Google API keys,
Slack tokens, PEM private-key blocks, JWTs, credentialed database URLs, SendGrid
keys, Twilio SIDs — over git-tracked files. It matches key *formats*, not the
word "secret", so its output is short enough to read in full.

**Result on `origin/master` @ `76ed5f2`: 1714 files scanned, 14 pattern hits,
zero live credentials.**

| Finding | Count | Assessment |
|---|---:|---|
| `mysql://USER:PASS@HOST/DB` in `LAUNCH.md`, `docs/RECOVERY_PLAN.md`, `scripts/DEPLOY.md`, `scripts/build_database.sh`, `scripts/restore_database.mjs` | 8 | Documentation templates. Literal words `USER` and `PASS`. |
| `mysql://unused:unused@127.0.0.1:1/unused` in `scripts/export_schema_sql.sh` | 1 | Deliberate no-op default so drizzle-kit can parse a URL offline. |
| `xoxb-EXAMPLE…` in `Integrations.tsx` and its audit fixture | 2 | UI placeholder text. |
| `xoxb-1234567890-…` in a handoff transcript | 1 | Dummy in prose. |
| `mysql://rcs:rcs_local_dev@127.0.0.1:3307/rcs` in a handoff transcript | 2 | Local MariaDB on loopback, alongside `JWT_SECRET="local-dev-only-secret…"`. Not a production credential; it reaches nothing outside a developer's machine. |

**No tracked `.env` file exists** in `sam-russell-corpus`, `russell-capital`, or
`russell-capital-app` — only `.env.example`.

Donor repositories were scanned on the same rules:

| Repository | Files | Hits | Assessment |
|---|---:|---:|---|
| russell-capital | 1759 | 1 | `xoxb-1234567890-…` UI placeholder |
| russell-capital-app | 1347 | 3 | Same placeholder, plus `postgres://user:password@host:5432/…` in `.env.example` |

**Nothing found requires rotation.** The two loopback dev credentials in the
handoff transcript are worth deleting on housekeeping grounds, but they are not
a disclosure and that edit is not part of this PR.

### The gate

The CI job prints every hit and **fails only** on rules that have never
legitimately appeared here: AWS keys, GitHub tokens, OpenAI/Anthropic keys,
Stripe live keys, Google API keys, PEM private-key blocks, SendGrid keys. Known
template hits stay visible but do not block. Verified by running the extracted
job script against the current tree: exit 0.

## 5.3 Rollback

### This PR

It adds files under `consolidation/` and one workflow. Nothing under
`russell-capital-systems/` is touched, so there is nothing to roll back in the
application. Closing the PR unmerged is a complete undo.

### Every migration PR

Tag before merging and the rollback is one revert:

```bash
# before merging migration PR N
git tag -a consolidation-pre-N -m "state before migration N"
git push origin consolidation-pre-N

# if PR N has to come out
git revert -m 1 <merge-commit-sha>     # the merge commit, not the branch
git push origin master
```

Rules that make that reliable, and which §6 is built around:

1. **One bounded capability per PR.** A revert must never take unrelated work
   with it.
2. **No squash merges on migration PRs.** `git revert -m 1` needs the merge
   commit.
3. **Tag before each merge**, named `consolidation-pre-N`.
4. **No database migration in the same PR as code.** A code revert cannot undo a
   schema change. §6 contains no database PRs at all.
5. **Recompute route counts before and after.** The CI job prints them; a delta
   that does not match the PR's stated delta is a failed PR.

### If a merge to master deploys something unintended

Reverting on `master` re-runs `deploy-branch.yml`, which republishes the
`deploy/rcs` subtree from the reverted state — the deployment follows the
revert. Confirm the Railway deployment picked up the revert before standing
down. **Rolling back a deployment platform directly is outside the scope of
these instructions and needs the owner's explicit approval.**
