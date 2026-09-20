# ADR 0001 — Canonical application repository

**Status:** Accepted with a recorded discrepancy · **Date:** 20 September 2026 · **Owner:** Sam

## Context

Application code has existed in several places: `russell-capital-app`, `russell-capital`,
three superseded builds, and the `russell-capital-systems/` directory inside `sam-russell-corpus`.
Parallel work across more than one of these produces divergent implementations of the same
capability and makes it impossible to say what is live.

## Decision

**The codebase at `russell-capital-systems/` is the sole canonical live application.** It is the
only codebase that receives approved product improvements.

## Discrepancy on the record

The program document designates `samtheinsuranceman-debug/russell-capital-systems` — a standalone
GitHub repository. **That repository does not exist.** The codebase is a directory inside
`sam-russell-corpus`; evidence is in `docs/REPOSITORY_MAP.md`.

This ADR therefore designates **the codebase**, not the repository name, and records that its
current host contradicts the program rule that `sam-russell-corpus` must never hold platform code.
That contradiction predates this ADR and is not created by it.

## Rationale

- It has a verified green baseline: **0 typecheck errors, 3439 tests passing, production build
  succeeding, 321 routes emitted, no duplicate routes.** Commands and outputs are in
  `docs/CURRENT_STATE_BASELINE.md`.
- `russell-capital-app` has a failing baseline — 113 failures across 25 files — and cannot serve
  as a canonical base until stabilised.
- The remaining candidates are superseded builds or corpus repositories.

## Consequences

- Donor repositories receive no parallel application work.
- Every approved improvement starts here and arrives through a single scoped pull request.
- Capability imports follow `docs/REPOSITORY_INTAKE_POLICY.md` and are recorded in
  `docs/MIGRATION_LEDGER.md`.
- Superseded builds are preserved, not deleted, until their capabilities are absorbed or formally
  dispositioned.

## Explicit exclusions

Not canonical and not consolidation targets: `russell-capital-domain-redirect` (protected),
`russell-capital-app`, `russell-capital`, all corpus, patent, research, report, analysis and
skills repositories, and the three superseded builds.

## Reversal condition

Canonical status changes **only** through a separately approved migration plan demonstrating:

1. A green build on the proposed base.
2. Test parity — no regression against the baseline recorded here.
3. Preview-environment validation.
4. A data and infrastructure plan, including any database work.
5. A documented rollback path.

Configuration files present in a donor repository are **not** grounds for reversal.

## Open item requiring owner action

Extracting `russell-capital-systems/` into its own GitHub repository would make the program
document true as written and remove application code from the corpus repository. It requires
repository creation and a subtree extraction, both of which need separate explicit approval.
**Not performed under this PR.**
