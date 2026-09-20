# GitHub Governance — recommended settings

**Status:** Recommendation only · **Created:** 20 September 2026

**No branch-protection setting has been changed.** Everything below is a recommendation requiring
separate explicit approval. Applying these settings is a repository-administration action, not a
code change.

## Scope note

These settings apply to `samtheinsuranceman-debug/sam-russell-corpus`, which hosts the canonical
application at `russell-capital-systems/`. Its default branch is **`master`**.

## Recommended protection for `master`

| Setting | Recommended | Why |
|---|---|---|
| Require a pull request before merging | **On** | Nothing reaches the default branch unreviewed |
| Required approvals | **1** | If account permissions allow; a solo account may not |
| Dismiss stale approvals on new commits | **On** | An approval covers the diff it saw |
| Require conversation resolution | **On** | No unanswered review comment merges |
| Require status checks to pass | **On** | Bind to the `verify` job in `.github/workflows/canonical-app-ci.yml` |
| Require branches up to date before merging | **On** | Prevents a green PR merging onto a base it never ran against |
| Block force pushes | **On** | History stays auditable |
| Block deletion | **On** | The default branch cannot be removed |
| Merge method | **Squash** | One commit per bounded PR, matching the one-capability-per-PR rule |
| Allow bypass | **Off** | Including for administrators, so the gate means something |

## Required status check

After the CI workflow has run once, bind the check named **`verify`** as required. GitHub only
offers a check name for selection after it has reported at least once.

## Applying these settings

Settings → Branches → Add branch protection rule → `master`. Tick the rows marked **On** above.

**Do not apply automatically.** A misconfigured protection rule can lock the default branch, and
recovery needs administrator access.

## Review checklist for every PR

- Does it change only the canonical application?
- Does it leave `russell-capital-domain-redirect` untouched?
- Does it avoid DNS, GoDaddy, GitHub Pages, Railway, Vercel, database, secret and environment changes?
- Are all changed files listed in the description?
- Are real command results shown, with exit status?
- Are tests, build and typecheck green — or are failures explicit and blocking?
- Is there a rollback plan?
- Does it do exactly one bounded job?

Any "no" means do not merge; return it for scope correction.
