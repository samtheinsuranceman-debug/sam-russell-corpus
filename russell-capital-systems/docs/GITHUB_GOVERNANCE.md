# GitHub governance

Recommended settings for `samtheinsuranceman-debug/sam-russell-corpus`.

**Nothing in this document has been applied.** Branch protection was not
changed, and changing it needs its own approval. These are recommendations with
the reasoning attached, so the decision is yours to make with the facts in hand.

## 1. The fact that shapes everything

**Merging to `master` deploys to production.**

`deploy-branch.yml` fires on push to `master` under
`paths: ["russell-capital-systems/**"]`, splits that subtree to `deploy/rcs`,
force-pushes it, and calls the Railway API. `pages.yml` fires on push to
`master` under `paths: ["docs/**"]` and publishes GitHub Pages.

So the default branch is not a staging area. **Every merge is a release.** The
protections below exist because of that, not as bureaucracy.

## 2. Recommended branch protection for `master`

Settings → Branches → Add rule → branch name pattern `master`:

| Setting | Recommended | Why |
|---|---|---|
| Require a pull request before merging | **On** | Merging is deploying |
| Require approvals | **1**, if permissions allow | A release should have a second pair of eyes |
| Dismiss stale approvals on new commits | **On** | An approval should describe the code being merged |
| Require conversation resolution | **On** | Unanswered review questions are unresolved risk |
| Require status checks to pass | **On** — select `verify` and `secrets` from *Consolidation verify* | Before this PR no workflow ran build or tests on a PR at all |
| Require branches to be up to date | **On** | Prevents merging against a stale base |
| Block force pushes | **On** | `master` is the deploy source |
| Block deletion | **On** | Same |
| Allow squash merging | **Off for migration PRs** | `git revert -m 1 <merge-sha>` needs a merge commit. Squash removes the rollback path the intake policy depends on |
| Allow merge commits | **On** | The rollback path |

Enforce for administrators only if you are ready to live with it — it removes
the emergency override.

`deploy/rcs` is machine-written and force-pushed by `deploy-branch.yml` every
deploy. **Do not protect it**; protection would break the pipeline. Never
hand-edit it.

## 3. Recommended follow-up — decouple docs from deploys

`deploy-branch.yml` matches `russell-capital-systems/**`, which includes
`russell-capital-systems/docs/`. **Merging a documentation-only PR — including
this one — therefore triggers a Railway deploy.**

The fix is one line in `deploy-branch.yml`:

```yaml
on:
  push:
    branches: [master]
    paths: ["russell-capital-systems/**"]
    paths-ignore: ["russell-capital-systems/docs/**"]
```

**This PR does not make that change.** It edits the deploy pipeline, which is
out of scope here and deserves its own review. Until it lands, treat every merge
touching this subtree — docs included — as a deployment.

## 4. CI, as added by this PR

`.github/workflows/consolidation-verify.yml`. Read-only. It deploys nothing,
requires no production credential, and prints no secret value.

On every pull request and on push to `master`:

| Step | Command | On failure |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | Fail |
| Typecheck | `pnpm run check` | Fail |
| Build | `pnpm run build` | Fail |
| Route integrity | Compares `dist/public/routes.json` with `client/src/App.tsx`, checks for duplicates | Fail |
| Tests | `pnpm run test` — the **full** suite | Fail |
| Secret scan | Anchored credential patterns over the diff | Fail on credential-shaped material |

Two deliberate choices:

**The full suite, not `test:ci`.** `test:ci` excludes 26 files. The baseline
shows the full suite passing — 4220 tests, zero failures — so the stricter gate
costs nothing and covers the database and schema suites that matter most during
consolidation.

**Missing commands fail loudly.** There is no `lint` script in this repository,
so CI does not run one and does not pretend to. If a required script disappears,
the step fails with a named error rather than passing silently.

## 5. Issues and ownership

Not automated by this PR; recommended:

- One label per repository role: `app`, `donor`, `corpus`, `hosting`.
- One tracking issue per ledger row in `docs/MIGRATION_LEDGER.md`, linked both ways.
- A PR template asking the twelve fields from `docs/REPOSITORY_INTAKE_POLICY.md`.

## 6. Never automated

No agent changes branch protection, repository visibility or settings; deletes,
archives, renames, transfers or forks a repository; alters DNS, domains,
GoDaddy, Railway, Vercel, GitHub Pages or any custom domain; touches credentials
or environment variables; or modifies `russell-capital-domain-redirect`.

Each needs separate, explicit, per-action approval.
