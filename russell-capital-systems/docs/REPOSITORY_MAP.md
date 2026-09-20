# Russell Capital — Repository Map

**Status:** Active · **Created:** 20 September 2026 · **Owner:** Sam

Plain-English classification of every Russell Capital repository found in the account,
and whether it may receive product code.

---

## ⚠️ Deviation notice — read first

The governing program document names **`samtheinsuranceman-debug/russell-capital-systems`**
as the canonical repository. **No such GitHub repository exists.**

Evidence, gathered 20 September 2026:

```
$ list_repos(query="russell-capital")      → 12 repositories, none named russell-capital-systems
$ stat -c %F russell-capital-systems       → directory
$ test -e russell-capital-systems/.git     → absent (no nested repository)
$ git ls-files russell-capital-systems/package.json
  russell-capital-systems/package.json     → tracked by the parent repository
$ git remote get-url origin
  https://github.com/samtheinsuranceman-debug/sam-russell-corpus
$ git rev-parse master
  f325575413676a5108ff9128003cd56c0cdcd4b7
```

**The canonical application is a directory — `russell-capital-systems/` — inside the
`sam-russell-corpus` repository.** Every deliverable path in the program document is honoured
exactly (`docs/REPOSITORY_MAP.md`, `docs/adr/0001-…`, and so on, relative to the application
root). The single unavoidable deviation is which GitHub repository hosts the pull request,
because a PR cannot be opened against a repository that does not exist.

The program document also states that `sam-russell-corpus` must never be an application base and
must not receive platform code. **That rule is already violated by the current state, not by this
PR** — the application has lived there since before this program began. Resolving it requires
extracting `russell-capital-systems/` into its own repository, which is a separate, owner-approved
action. See `docs/adr/0001-canonical-application-repository.md`.

---

## The map

| Repository | Category | Operational role | Can receive product code? | Status | Owner decision |
|---|---|---|---|---|---|
| `sam-russell-corpus` → `russell-capital-systems/` | **Application** | **Canonical live application** (directory, not a repository) | **Yes** | Active | Sole canonical product codebase |
| `russell-capital-domain-redirect` | Public entry / redirect | Protected apex marketing/redirect layer | No | **Protected** | No consolidation, no changes, no access requested |
| `russell-capital-app` | Feature donor | UI / navigation / shared-state reference | No, except by explicit decision | Reference | Selective source only |
| `russell-capital` | Historical donor | Legacy feature and engagement reference | No, except by explicit decision | Preserve | Selective source only |
| `sam-russell-corpus` (as a whole) | Corpus / archive | Documents and knowledge corpus | No — **except the application directory above** | Archive + host | See deviation notice |
| `sam-russell-corpus-backup` | Corpus / archive | Backup of the corpus | No | Archive | Never app base |
| `russell-capital-patents` | Corpus / reference | Patent filings and IP | No | Reference | Never app base |
| `russell-capital-reports` | Corpus / reference | Generated reports | No | Archive | Never app base |
| `russell-capital-analyses` | Corpus / reference | Analyses | No | Archive | Never app base |
| `russell-capital-combinations` | Corpus / reference | Strategy combinations | No | Archive | Never app base |
| `russell-capital-skills` | Corpus / reference | Agent skills | No | Reference | Never app base |
| `russell-capital-nlp` | Corpus / reference | NLP material | No | Reference | Never app base |
| `Russell-Capital-Solutions-NEW` | Legacy application | Superseded build | No | Reference | Compare only |
| `Really-Russell-Capital` | Legacy application | Superseded build | No | Reference | Compare only |
| `Russell-Capital-Calibrate-System` | Legacy application | Superseded build | No | Reference | Compare only |
| `sam-russell-catechism-brotherhood` | Corpus | Content | No | Archive | Never app base |
| `russell-biomedical` | Unrelated | Separate domain | No | Out of scope | Not part of this program |
| `patent360` | Unrelated | Separate product | No | Out of scope | Not part of this program |
| `samtheinsuranceman-debug.github.io` | Public entry | GitHub Pages site | No | Out of scope | Not part of this program |

**18 repositories classified.** Every repository visible to this account is listed; none was
omitted as unimportant.

## Rules this map enforces

1. One canonical application codebase. No mirrored implementation elsewhere.
2. `russell-capital-domain-redirect` is untouched — no modification, no merge, no access request.
3. Donor repositories are read-only sources. Capabilities are extracted one at a time through
   `docs/REPOSITORY_INTAKE_POLICY.md` and recorded in `docs/MIGRATION_LEDGER.md`.
4. No repository is deleted, archived, renamed, transferred, forked or overwritten under this
   program. Classification precedes any cleanup.
5. A repository is not obsolete because it is old, small or oddly named.
