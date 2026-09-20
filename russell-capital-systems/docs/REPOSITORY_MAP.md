# Repository map

Surveyed 2026-09-20 against the live account listing. The account holds **more
than 100 repositories**; this map covers every Russell Capital repository, every
repository containing application code, and every repository relevant to public
hosting. The remainder is one category, named in §3.

The column that matters is **"May receive product code?"** The answer is *yes*
for exactly one path.

## 1. Application and hosting

| Repository / path | Category | Operational role | May receive product code? | Status |
|---|---|---|---|---|
| **`sam-russell-corpus` → `russell-capital-systems/`** | **Application** | **Canonical live application.** Split to `deploy/rcs` by `deploy-branch.yml`, deployed by Railway, served at `www.russellcapitalsystems.com` | **Yes — the only one** | **Active** |
| `sam-russell-corpus` → repository root | Corpus/archive | Documents, transcripts, research, PDFs. Also `docs/`, published to GitHub Pages by `pages.yml` | No | Archive |
| `russell-capital-domain-redirect` | Public entry | Apex marketing/redirect shim. 5 files, 28 KB: `CNAME`, `index.html`, `404.html`, `.nojekyll`, `README.md` | **No — protected, out of scope** | Protected |
| `samtheinsuranceman-debug.github.io` | Public entry | GitHub user Pages site | No | Reference — not inspected |

`sam-russell-corpus` appears twice on purpose. It is a corpus repository that
also hosts the canonical application subtree; ADR 0001 records why, and the
distinction is by path, not by repository.

## 2. Donors and references

| Repository | Category | Operational role | May receive product code? | Status |
|---|---|---|---|---|
| `russell-capital-app` | Feature donor | UI/navigation/shared-state reference. 612 routes, PostgreSQL schema, `vercel.json`, `api/index.ts`, 687-entry `CONSOLIDATION_PLAN.json` | No — selective source only | Reference |
| `russell-capital` | Historical donor | Legacy feature and engagement reference. 660 routes, MySQL schema (same dialect as the canonical app) | No — selective source only | Preserve |
| `Really-Russell-Capital` | Historical | 7 files, no TypeScript | No | Archive |
| `Russell-Capital-Solutions-NEW` | Historical | 59 files, no TypeScript | No | Archive |
| `Russell-Capital-Calibrate-System` | Reference | Calibration instrument. 13 routes | No | Reference |
| `russell-biomedical` | Reference | 14 files, no TypeScript | No | Archive |
| `sam-russell-corpus-backup` | Backup | Corpus backup | No | Archive |

## 3. Corpus, research and IP — never an application base

| Repository | Contents |
|---|---|
| `russell-capital-patents` | 53 PDFs, 24 documents. Patent record |
| `russell-capital-reports` | 29 documents |
| `russell-capital-analyses` | 8 documents, 24 JSON |
| `russell-capital-skills` | 14 documents |
| `russell-capital-combinations` | 9 documents |
| `russell-capital-nlp` | 9 documents |

None contains TypeScript. **No platform code goes into any of them.**

## 4. Separate product lines

Not Russell Capital application surfaces. Measured: the AQAL lineage declares 96
routes of which only 8 overlap the canonical app.

| Repository | Note |
|---|---|
| `AQAL`, `aqal-platform`, `joinaqal-superior-build` | AQAL platform. Newest copy is also vendored at `sam-russell-corpus/AQAL/aqal-platform` |
| `Patent360` | Patent360. Also vendored at `sam-russell-corpus/Patent360` |
| `four-halls`, `axiom-atlas`, `SS`, `S-and-S`, `Steph`, `private-life`, `book-journals`, `brotherhood-*`, `*-Identity`, and the remaining ~80 Brotherhood repositories | Personal, theological and Brotherhood corpora. Out of scope for this program; not application repositories |

## 5. Rules this map encodes

1. **One canonical application path.** `sam-russell-corpus/russell-capital-systems/`.
2. **The redirect repository is untouchable** during this program — no code, no
   consolidation, no changes.
3. **Donors give up capabilities one pull request at a time**, never wholesale,
   under `docs/REPOSITORY_INTAKE_POLICY.md`.
4. **Corpus repositories never receive platform code**, including the root of
   `sam-russell-corpus` itself.
5. **Nothing here is deleted, archived, renamed or transferred.** "Archive" in
   this map is a description of contents, not an instruction to act.
