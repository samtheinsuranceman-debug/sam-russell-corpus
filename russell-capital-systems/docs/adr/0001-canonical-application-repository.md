# ADR 0001 — The canonical application repository

- **Status:** Accepted
- **Date:** 2026-09-20
- **Decision owner:** Sam Russell
- **Supersedes:** every prior, informal statement about which repository is "the build"

## Context

The estate contains several trees that look like the Russell Capital
application. Earlier consolidation attempts named a different winner each time,
and work was started in more than one of them.

A survey this session measured all of them. One fact settled the question and
one fact complicated it.

**Settling it:** only one tree is actually deployed. `deploy-branch.yml` splits
`russell-capital-systems/` into the `deploy/rcs` branch on every push to
`master` and asks Railway to deploy it. That tree also installs, typechecks,
builds, and passes 4220 tests with zero failures
(`docs/CURRENT_STATE_BASELINE.md`).

**Complicating it:** `russell-capital-systems` **is not a GitHub repository.**
It is a directory inside `samtheinsuranceman-debug/sam-russell-corpus`. A
listing of the account returns no repository by that name. Governing documents
that named `russell-capital-systems` as a repository, and separately classified
`sam-russell-corpus` as an archive that may never hold application code, were
describing the same repository twice and contradicting themselves.

## Decision

**The canonical live application is the `russell-capital-systems/` subtree of
`samtheinsuranceman-debug/sam-russell-corpus`.**

It is the only tree that receives approved product improvements.

`sam-russell-corpus` is therefore **two things at once**, and this ADR records
that explicitly so no future instruction has to guess:

1. the corpus of documents, transcripts and research at its root — not a place
   for application code; and
2. the host of the canonical application subtree at `russell-capital-systems/`
   — which *is* the place for application code.

`docs/REPOSITORY_MAP.md` states this per directory rather than per repository.

## Consequences

- No parallel application work in `russell-capital-app` or `russell-capital`.
  They are donors: a capability leaves them one pull request at a time, under
  `docs/REPOSITORY_INTAKE_POLICY.md`, recorded in `docs/MIGRATION_LEDGER.md`.
- `russell-capital-domain-redirect` is the public entry layer and is out of
  scope. No application code, no consolidation, no changes.
- Corpus, research, patent, report, analysis and skills repositories never
  receive platform code.
- **Merging to `master` deploys.** Any merge touching
  `russell-capital-systems/**` republishes `deploy/rcs` and triggers Railway.
  Every merge is therefore a release decision, not just a code decision.
- The application's own docs live at `russell-capital-systems/docs/`, **not** at
  the repository root `docs/`, which `pages.yml` publishes to GitHub Pages.

## Alternative considered and rejected for now

**Extract `russell-capital-systems/` into its own repository.** This would make
the name true and separate the app from 800 MB of corpus material.

Rejected for this PR because it requires creating a repository, re-pointing
Railway's deployment source, and migrating the `deploy/rcs` mechanism — an
infrastructure change, not a documentation change. It remains a reasonable
future project under its own approval, plan and rollback.

## Reversal condition

Canonical status moves only when a separate, approved migration plan
demonstrates **all** of:

1. a green build of the proposed new canonical tree;
2. test parity — no fewer passing tests, no new failures, measured, not asserted;
3. preview validation on a non-production URL;
4. a data and infrastructure plan covering the database dialect, migrations,
   environment variables and the deployment source;
5. a written rollback path returning to this tree; and
6. explicit owner approval naming this ADR.

Absent all six, this decision stands.
