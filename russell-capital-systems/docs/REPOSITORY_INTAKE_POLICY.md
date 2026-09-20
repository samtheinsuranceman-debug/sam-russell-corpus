# Repository intake policy

**Status:** Active · **Date:** 2026-09-20

Every import into `russell-capital-systems` — from any donor, of any size —
must satisfy this policy before merge. No exceptions for "small" changes: the
policy exists because a two-line import with an unrecorded source is exactly
what makes an estate un-auditable.

---

## Required record

Each import opens one pull request carrying all fourteen fields. A missing
field blocks merge.

| # | Field | Requirement |
|---|---|---|
| 1 | **Source repository** | Full `owner/name`. |
| 2 | **Source commit SHA** | Full 40-character SHA, not a branch name. A branch moves; a SHA does not. |
| 3 | **Source file paths** | Every file read, exactly as it appears in the donor. |
| 4 | **Target paths** | Every path written in `russell-capital-systems`. |
| 5 | **Capability** | What this gives the product, in one sentence a non-engineer can check. |
| 6 | **Dependencies & runtime assumptions** | New packages, aliases, contexts, browser APIs, env vars read. **A new dependency needs its own justification.** |
| 7 | **Route impact** | Routes added, changed or removed, and the resulting `ROUTE_MANIFEST` count. Zero is a valid answer and must be stated. |
| 8 | **Data / database impact** | Tables, columns, migrations, drivers. **Cross-dialect work (MySQL ↔ Postgres) is out of scope without separate approval.** |
| 9 | **Test evidence** | Baseline before, result after, exact commands, exit codes. |
| 10 | **Security / secret scan** | Result over the diff. Zero credentials, or the finding. |
| 11 | **Rollback plan** | The exact command, and what it restores. |
| 12 | **Owner approval** | Named human approval before merge. |
| 13 | **Ledger entry** | A row in `MIGRATION_LEDGER.md` in the same PR. |
| 14 | **Blockers** | Anything unresolved, or an explicit "none". |

---

## Rules

**Compare before importing.** Read the donor file and the incumbent side by
side. Record what differs. A donor file that is larger is not thereby better —
it is frequently dead code or an older layout since extracted.

**Do not import a capability that already exists.** Check first. The canonical
app has 330 routes and 190 shared modules; duplicate implementations under
different names are the specific failure this program exists to prevent.

**Never import a failing test.** If a donor test fails here, either fix it in
the same PR or leave it behind and say so. A red test never lands "to be fixed
later".

**Never import a dead link.** Any navigation target must resolve to a route in
`shared/routeManifest.ts`. A target whose page does not exist is recorded as a
placeholder, never as a link.

**Preserve the baseline.** Full-suite pass count may rise by the tests added.
It may not fall. Skipped counts may not rise.

**One bounded job per pull request.** If a PR needs the word "and" to describe
it, it is two PRs.

**Config presence is not an infrastructure decision.** A `vercel.json` or
`railway.json` in a donor proves a file exists, not that anything deploys from
it. Never change hosting because a config file was found.

---

## Out of scope for any intake PR

Deployment · DNS · CNAME · A records · domain forwarding · GoDaddy · GitHub
Pages · Railway · Vercel aliases · public URL routing · database configuration ·
production migrations · driver changes · production data · credentials ·
secrets · access tokens · environment variables · repository deletion,
archival, rename, transfer, fork, overwrite or mirroring ·
`russell-capital-domain-redirect` in any form.

Each needs separate, explicit, written approval.

---

## Route and page removal

A route may not be removed without **all** of:

1. A disposition record — what it was, why it goes, what replaces it.
2. A redirect or alias where a URL may be in use.
3. A rollback path.

Silent removal of a working route is prohibited. "It looked unused" is not a
disposition.

---

## Checklist to paste into every intake PR

```
- [ ]  1. Source repository
- [ ]  2. Source commit SHA (full 40 chars)
- [ ]  3. Source file paths
- [ ]  4. Target paths
- [ ]  5. Capability, one sentence
- [ ]  6. Dependencies and runtime assumptions
- [ ]  7. Route impact + resulting manifest count
- [ ]  8. Data/database impact (or "none")
- [ ]  9. Baseline vs post-change tests, with exit codes
- [ ] 10. Secret-scan result
- [ ] 11. Rollback command
- [ ] 12. Named owner approval
- [ ] 13. MIGRATION_LEDGER.md row added
- [ ] 14. Blockers (or "none")
```
