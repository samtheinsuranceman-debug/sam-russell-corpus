# GitHub governance

**Status:** Recommendation · **Date:** 2026-09-20

Branch-protection settings for the default branch, written down so they can be
applied deliberately.

> **Nothing here has been applied.** Changing branch protection is a
> repository-administration action and needs its own approval. This document
> records what to set; a human sets it.

---

## Scope note

These settings apply to `samtheinsuranceman-debug/sam-russell-corpus`, default
branch `master` — the repository that hosts the canonical application as the
`russell-capital-systems/` subtree. See `REPOSITORY_MAP.md` for why the
canonical application is a subtree rather than its own repository.

**This protects the deployment path.** `deploy-branch.yml` force-pushes
`deploy/rcs` on every master commit touching `russell-capital-systems/`, and
Railway builds that branch. An unreviewed commit to master is therefore an
unreviewed production deploy. Branch protection is the control that closes
that gap.

---

## Recommended settings — `master`

| Setting | Value | Why |
|---|---|---|
| Require a pull request before merging | **On** | Master pushes deploy to production via `deploy/rcs` |
| Required approvals | **1** | If permissions allow on this plan |
| Dismiss stale approvals on new commits | **On** | An approval of an old diff is not an approval of the new one |
| Require conversation resolution | **On** | No unanswered review thread merges |
| Require status checks to pass | **On** | See required checks below |
| Require branches up to date before merging | **On** | Prevents a semantic conflict merging green |
| Require linear history | **On** | Matches the squash-merge workflow below |
| Allow force pushes | **Off** | A force-push to master force-pushes production |
| Allow deletions | **Off** | — |
| Restrict who can push | Owner only | — |
| Include administrators | **On** | A rule the owner can bypass is a rule that gets bypassed |

### Required status checks

From `.github/workflows/rcs-ci.yml`, added by this PR:

- `RCS CI / verify`

`rcs-security-audit.yml` already runs on pull requests touching
`russell-capital-systems/**`. Add it as a required check once it has a stable
green history — not before, or the first flake blocks every merge.

### Merge strategy

**Squash merge.** Allow merge commits: off. Allow rebase: off.

Rationale: feature branches here carry many small commits, and master is the
deployment trigger. One commit per merged PR makes `deploy/rcs` history
readable and a revert a single operation — which is what every rollback
procedure in the migration ledger assumes.

---

## How to apply

Settings → Branches → Add branch protection rule → `master`, then tick the
table above. Or:

```bash
gh api -X PUT repos/samtheinsuranceman-debug/sam-russell-corpus/branches/master/protection \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F required_pull_request_reviews.dismiss_stale_reviews=true \
  -F required_conversation_resolution=true \
  -F required_linear_history=true \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F enforce_admins=true \
  -F 'required_status_checks.contexts[]=RCS CI / verify' \
  -F required_status_checks.strict=true \
  -F restrictions=null
```

Verify with `gh api repos/.../branches/master/protection`.

---

## Issue hygiene

Open issues at the time of writing: `sam-russell-corpus` 23, `russell-capital`
8, `russell-capital-app` 9.

Recommended labels, applied by hand:

| Label | Meaning |
|---|---|
| `canonical-app` | Touches `russell-capital-systems/` |
| `donor-extraction` | Tracks a `MIGRATION_LEDGER.md` row |
| `governance` | Policy, CI, branch protection |
| `corpus` | Documents only, no application code |
| `blocked-owner-decision` | Needs a named human decision |
| `infra-do-not-touch` | Hosting, DNS, domains, database |

---

## Outstanding cleanup requiring owner authorization

Recorded, not acted on.

**Duplicate foundation pull requests — 7 open on this repository:**
[#146](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/146),
[#147](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/147),
[#148](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/148),
[#149](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/149),
[#153](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/153),
[#154](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/154),
[#155](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/155).
All created within 20 minutes on 2026-09-20 by parallel agent sessions, all
attempting the same foundation audit. Plus
[#150](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/150)
and [#152](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/152),
Copilot PRs fixing CI on one of them.

**One foundation PR on a superseded base:**
[russell-capital-app#5](https://github.com/samtheinsuranceman-debug/russell-capital-app/pull/5)
— opened when `russell-capital-app` was briefly the designated base. Now
superseded by ADR 0001.

**PR-2b:** [#161](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/161)
— open, green, awaiting disposition. See `MIGRATION_LEDGER.md`.

None has been closed. Closing a pull request is not in this program's
permissions; it needs the owner's word.

**Root cause, worth fixing before it recurs:** several agent sessions were
given the same instruction concurrently against one repository with no branch
protection and no single ledger. The protection rules above plus
`MIGRATION_LEDGER.md` are the structural fix — one PR at a time becomes
enforceable rather than merely agreed.
