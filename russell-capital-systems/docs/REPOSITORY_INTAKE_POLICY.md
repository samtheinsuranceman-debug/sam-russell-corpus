# Repository intake policy

Every capability entering `russell-capital-systems/` from a donor repository
does so through one pull request that answers all twelve questions below. A PR
missing any answer is not ready for review.

Canonical path and donors: `docs/REPOSITORY_MAP.md`. Why: `docs/adr/0001`.

## The twelve required fields

| # | Field | What it must contain |
|---:|---|---|
| 1 | **Source repository** | Full `owner/name` |
| 2 | **Source commit SHA** | Full 40 characters, from the donor, at the moment of extraction. Not a branch name |
| 3 | **Source file paths** | Every file read, repository-relative |
| 4 | **Target paths** | Every path written in `russell-capital-systems/`, and whether each is new or modified |
| 5 | **Capability** | One sentence: what a user can now do that they could not before |
| 6 | **Dependencies and runtime assumptions** | Internal modules the code needs that the canonical app lacks; new npm packages (**prefer zero**); environment variables, network calls, browser APIs. Any new package needs its own justification |
| 7 | **Route impact** | Routes added, changed, removed. The before and after count from `dist/public/routes.json`. **The delta must equal the stated number** |
| 8 | **Data and database impact** | Tables, columns, migrations, queries. **If the answer is anything but "none", the PR is out of scope** — schema work is a separate track under separate approval |
| 9 | **Test evidence** | Full-suite counts before and after, from `pnpm run test`. New focused tests for the capability. **Zero new failures** |
| 10 | **Security scan** | Secret-scan result over the diff, with findings shown or "clean" stated |
| 11 | **Rollback plan** | The exact command, and what returns to what |
| 12 | **Named owner approval** | Who approved, recorded before merge, not after |

## Standing rules

**Recompute, never inherit.** Route counts, test counts and module lists from a
previous document are a snapshot. Every PR measures its own numbers at the
moment it opens. During one survey this session, donor-only engine counts moved
from 40 to 10 and canonical routes from 266 to 330 — the trees are live.

**The canonical version wins by default.** Where a module exists in both the
canonical app and a donor, the canonical one stands. Replacing it requires a
side-by-side comparison *and* a test that fails on the canonical version and
passes on the donor's. Line count is evidence, not an argument.

**One bounded capability per PR.** A revert must never take unrelated work with
it. No squash merges on migration PRs — `git revert -m 1` needs the merge commit.

**Additive before subtractive.** A route or navigation entry is never silently
removed. Where a target does not exist yet, prefer a disabled or placeholder
state over a dead link, and record the disposition.

**No new failures, ever.** `pnpm run test` — the full suite, not `test:ci`. A
pre-existing failure is named, evidenced against the base commit, and pinned as
a baseline; it is never used to excuse a new one.

**Merging deploys.** Any merge touching `russell-capital-systems/**` republishes
`deploy/rcs` and triggers Railway. Treat every merge as a release.

## Out of scope for any intake PR

Each needs its own separate, explicit approval:

- Database work of any kind — migrations, schema edits, dialect conversion
- Deployment: Railway, Vercel, GitHub Pages, the `deploy/rcs` subtree
- DNS, domains, GoDaddy, CNAMEs, aliases, custom-domain settings
- Credentials, secrets, tokens, environment variables
- `russell-capital-domain-redirect` — no changes, no access requests
- Deleting, archiving, renaming, transferring or forking any repository
- Wholesale repository merges
