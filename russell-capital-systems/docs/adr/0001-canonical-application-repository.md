# ADR 0001 — Canonical application repository

**Status:** Accepted · **Date:** 2026-09-20 · **Deciders:** Sam / Brotherhood

---

## Decision

**`russell-capital-systems` is the canonical live application.** It is the only
location that receives approved product improvements.

It exists as the `russell-capital-systems/` subtree of
`samtheinsuranceman-debug/sam-russell-corpus`, not as a standalone repository —
see *Context* below. The decision is about the application, and it stands
regardless of which repository currently hosts it.

## Context

The owner's governing document names
`samtheinsuranceman-debug/russell-capital-systems` as the canonical repository.
An authenticated GitHub search returned 18 matching repositories including
private ones, and **no repository of that name exists**. The application is a
subdirectory of the corpus repository.

**The document's substance is correct even though its repository reference is
not.** `.github/workflows/deploy-branch.yml` states that Railway deploys a
`deploy/rcs` branch produced by `git subtree split --prefix=russell-capital-systems`,
pushed on every master commit touching that path, to Railway service
`e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28`. The subtree really is the live app.

Evidence for choosing it over the alternatives:

| | `russell-capital-systems` | `russell-capital-app` | `russell-capital` |
|---|---|---|---|
| Live deployment path | **Yes — `deploy/rcs` → Railway** | none found | none found |
| Tests | **4,138 pass / 0 fail** | 113 **fail** / 2,030 pass | not run |
| Typecheck | **0 errors** | 0 errors | not run |
| Production build | **exit 0, 330 routes** | exit 0 | not run |
| Route manifest | **`shared/routeManifest.ts`, 330** | none | none |
| Schema | 156 MySQL tables | 117 Postgres tables | — |
| Commit history | 143 commits | **1 commit** | 14 commits |

## Rationale

1. **It is what serves traffic.** The deploy workflow is explicit.
2. **It is the only green one.** A canonical repository whose suite is red
   cannot gate anything.
3. **It has the authoritative route manifest**, which every future navigation
   and route change is validated against.
4. **It has real history.** A one-commit snapshot cannot be bisected or blamed.

## Consequences

- Donor repositories receive **no** parallel application work. No mirrored
  implementations.
- All approved improvements start here, on a named non-default branch, one
  pull request at a time.
- `russell-capital-app` and `russell-capital` are read-only sources. Selective
  extraction only, each import recorded in `MIGRATION_LEDGER.md`.
- Any capability depending on Postgres cannot cross from `russell-capital-app`
  without an explicit, separately approved re-modelling decision. The schemas
  are different databases.
- The existing green baseline — 4,138 tests, 330 routes — is preserved by CI on
  every pull request.

## Explicit exclusions

These are never consolidation targets and never receive application code:

- `russell-capital-domain-redirect` — **protected**; not modified, not merged
  into, no access requested.
- `sam-russell-corpus` outside the `russell-capital-systems/` subtree.
- `sam-russell-corpus-backup`, `russell-capital-patents`,
  `russell-capital-reports`, `russell-capital-analyses`, `russell-capital-nlp`,
  `russell-capital-combinations`, `russell-capital-skills`,
  `success-coach-skill`, `sam-russell-catechism-brotherhood`.
- `russell-biomedical`, `kanara-covenant` — separate products.
- All legacy one-commit snapshots.

## Standing recommendation — extract the subtree

The application should become its own repository named
`samtheinsuranceman-debug/russell-capital-systems`, which would make the
governing document literally true and stop application code living inside a
document corpus.

`deploy-branch.yml` already performs exactly this split on every master push, so
the extraction is mechanically low-risk. **It is not done here.** Creating,
forking or transferring a repository is outside this program's permissions and
needs its own approval. Until then the subtree is canonical in place.

## Reversal condition

Canonical status moves only under a separately approved migration plan
demonstrating **all** of:

1. A green production build on the candidate.
2. **Test parity or better** — no net loss of passing tests, no red baseline.
3. Preview-environment validation against real routes.
4. A data and infrastructure plan, including any cross-dialect schema work.
5. A written rollback procedure.
6. Named owner approval.

Configuration files present in a donor repository — a `vercel.json`, an `api/`
folder — are **not** grounds for reversal. Presence of config is not evidence
of deployment.
