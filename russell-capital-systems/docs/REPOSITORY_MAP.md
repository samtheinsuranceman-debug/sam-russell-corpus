# Repository map

**Status:** Active · **Date:** 2026-09-20 · **Owner:** Sam / Brotherhood

Every Russell Capital repository, its real operational role, and whether it may
receive product code. Classification is from evidence — authenticated GitHub
repository search plus the working tree — not from repository names.

---

## A finding that must be read first

**`samtheinsuranceman-debug/russell-capital-systems` does not exist as a
standalone GitHub repository.**

An authenticated search (`user:samtheinsuranceman-debug russell`) returned 18
repositories, **including private ones** — `russell-capital-app`,
`russell-capital-patents` and `russell-capital-domain-redirect` are all private
and all appeared. `russell-capital-systems` was not among them.

The canonical application is a **subdirectory** of the corpus repository:

```
git toplevel      /home/user/sam-russell-corpus
git remote        https://github.com/samtheinsuranceman-debug/sam-russell-corpus
path inside repo  russell-capital-systems/
own .git          none — a plain subdirectory, not a submodule
default branch    master @ 76ed5f2b4097ada56314a5c4b48f457356e5f435
```

**The governing document's substance is nevertheless correct.**
`.github/workflows/deploy-branch.yml` at the repository root says so directly:

> "Keeps `deploy/rcs` equal to the russell-capital-systems/ subtree of master.
> **Railway deploys that slim branch** (root "/") instead of snapshotting the
> whole corpus (~800 MB of PDFs and audio) on every build."

So `russell-capital-systems` **is** the live Railway application, exactly as the
document states. It is a subtree, not a separate repository. The deployment
path is:

```
sam-russell-corpus @ master
  └─ russell-capital-systems/        ← the canonical application
       │  (git subtree split on every push to master touching this path)
       ↓
     deploy/rcs branch               ← what Railway builds
       ↓
     Railway service e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28
       ↓
     www.russellcapitalsystems.com
```

**Consequence for the "never app base" rule.** The rule says corpus repositories
must not receive platform code. The platform code is *already* in this one and
has been for the life of the project. This map does not move it, and nothing in
this PR adds application code anywhere. The rule is therefore recorded as
applying to **every corpus repository except the subtree that is already the
live application**, and the ADR records extracting that subtree into its own
repository as the standing recommendation.

---

## The map

### Application

| Repository | Category | Operational role | Product code? | Status | Owner decision |
|---|---|---|---|---|---|
| `sam-russell-corpus` → `russell-capital-systems/` | **Application** | **Canonical live Railway application.** Deployed via the `deploy/rcs` subtree split. 330 routes, 156 MySQL tables, 4,138 passing tests. | **Yes — this subtree only** | Active | Sole canonical product repo |

### Protected public entry layer

| Repository | Category | Operational role | Product code? | Status | Owner decision |
|---|---|---|---|---|---|
| `russell-capital-domain-redirect` | Public entry / redirect | Apex marketing / redirect shim. Private, HTML, last updated 2026-09-05. **Confirmed to exist.** | **No** | **Protected** | No consolidation, no changes, no access request |

Verified by listing metadata only. Contents were not fetched, access was not
requested, and nothing in it was modified.

### Donors

| Repository | Category | Operational role | Product code? | Status | Owner decision |
|---|---|---|---|---|---|
| `russell-capital-app` | Feature donor | UI / navigation / shared-state reference. 612 unique routes, 117 **Postgres** tables, Vercel + `api/` config. **Test baseline is red: 113 failed / 2,030 passed.** | No, except by explicit decision | Reference | Selective source only |
| `russell-capital` | Historical donor | Legacy feature and engagement reference. 621 routes, 688 pages, 14 commits — the only donor with real history. | No, except by explicit decision | **Preserve** | Selective source only |

**Schema warning for any future import:** the canonical app is **MySQL**
(156 `mysqlTable`); `russell-capital-app` is **PostgreSQL** (117 `pgTable`).
The two schemas are not mergeable. Only schema-free capabilities can cross.

### Corpus, research and reference — never an app base

| Repository | Category | Product code? | Notes |
|---|---|---|---|
| `sam-russell-corpus` (root, outside `russell-capital-systems/`) | Corpus / archive | **No** | Documents, transcriptions, audio, PDFs. Also the host of the app subtree — see the finding above. |
| `sam-russell-corpus-backup` | Archive mirror | No | Mirror of the corpus |
| `russell-capital-patents` | IP | No | 15 U.S. patent applications |
| `russell-capital-reports` | Reports | No | Forensic reports, valuations |
| `russell-capital-analyses` | Analysis | No | 52 call analyses, patent audits |
| `russell-capital-nlp` | Research | No | NLP calibration, 200-question bank |
| `russell-capital-combinations` | IP | No | 110 patent combination strategies |
| `russell-capital-skills` | Skills | No | — |
| `success-coach-skill` | Skills | No | Coaching skill |
| `sam-russell-catechism-brotherhood` | Documents | No | — |
| `russell-biomedical` | Separate product | No | RussellBIOmedical.com foundation |
| `kanara-covenant` | Separate product | No | Separate website |
| `Really-Russell-Capital` | Legacy snapshot | No | 1 commit |
| `Russell-Capital-Solutions-NEW` | Legacy snapshot | No | 1 commit |
| `Russell-Capital-Calibrate-System` | Legacy snapshot | No | 1 commit |

### Additional repositories observed in the working tree

Present on disk but outside the `russell` name search. Recorded for
completeness; none is an application consolidation target.

`aqal` · `aqal-platform` · `joinaqal-superior-build` · `patent360` ·
`axiom-atlas` · `four-halls` · `New-New-New` · `The-New-Plan` ·
`samtheinsuranceman-debug.github.io`

---

## Snapshot-repository warning

**19 of the 21 repositories on disk carry exactly one commit.** They are
snapshot dumps, not histories. Git cannot arbitrate which of two divergent
files came later, so every "which version wins" question must be settled on
content and tests. Only `sam-russell-corpus` (143 commits) and
`russell-capital` (14) have real history.

---

## Rules this map enforces

1. One canonical application. `russell-capital-systems/` only.
2. No application code in any corpus, research, patent, report, analysis or
   skills repository.
3. `russell-capital-domain-redirect` is never touched.
4. Donors are read, never made live and never merged wholesale.
5. No repository is deleted, archived, renamed, transferred or forked as part of
   this program.
6. Every import is traceable per `REPOSITORY_INTAKE_POLICY.md` and recorded in
   `MIGRATION_LEDGER.md`.
