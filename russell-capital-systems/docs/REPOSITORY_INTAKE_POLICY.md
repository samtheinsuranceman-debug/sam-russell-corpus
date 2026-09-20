# Repository Intake Policy

**Status:** Active · **Created:** 20 September 2026

Every import of code from any other repository into the canonical application must document all
twelve items below **before** review. An import missing any item is not ready to merge.

## Required record

| # | Item | Why |
|---|---|---|
| 1 | Source repository | Provenance |
| 2 | Source commit SHA | The exact state imported; "latest" is not a version |
| 3 | Source file paths | What was read, not just what was written |
| 4 | Target paths in the canonical application | Where it lands |
| 5 | Capability being imported | One bounded capability per pull request |
| 6 | Dependencies and runtime assumptions | New packages, env vars, services |
| 7 | Route impact | Routes added, changed, shadowed or removed |
| 8 | Data and database impact | Schema, migrations, drivers. Default is **none** |
| 9 | Test evidence | Commands run, exit status, counts before and after |
| 10 | Security and secret-scan result | Scan of the imported files, not the repo generally |
| 11 | Rollback plan | Exact commands |
| 12 | Named owner approval | Recorded before merge |

## Rules

1. **One capability per pull request.** No bundled imports.
2. **Compare before copying.** If the canonical application already implements the capability,
   the comparison and the choice are documented; only one implementation survives.
3. **The canonical route manifest is authoritative.** Any navigation or route target that does not
   resolve against it fails the import.
4. **Do not import a failing baseline.** Donor tests that fail in the donor are not imported as
   failing; they are fixed, replaced or excluded with a reason.
5. **No infrastructure by inference.** A `vercel.json`, `railway.toml` or `Dockerfile` in a donor
   is not a decision to adopt that platform.
6. **Never silently remove a route or page.** Removal requires a disposition record and a
   rollback path.
7. **No secrets, ever** — no credentials, tokens, keys or environment values in imported code.
8. **Every import is recorded** in `docs/MIGRATION_LEDGER.md` at the time the PR opens.

## Prohibited without separate explicit approval

Merging a PR · pushing to the default branch · deploying · changing DNS, CNAME, A records, domain
forwarding, GoDaddy, Railway, Vercel, GitHub Pages or any public URL routing · changing database
configuration, running a production migration, changing a driver, or copying production data ·
changing credentials, secrets, tokens or environment values · deleting, archiving, renaming,
transferring, forking or overwriting a repository · touching `russell-capital-domain-redirect`.
