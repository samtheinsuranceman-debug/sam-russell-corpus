# ADR 0002 — Extraction of the application to a standalone repository

**Status:** Prepared, blocked on one owner action · **Date:** 2026-09-22 · **Deciders:** Sam / Brotherhood

**Supersedes nothing.** Extends [ADR 0001](0001-canonical-application-repository.md),
whose decision — *the `russell-capital-systems/` subtree is the canonical live
application* — is unchanged and remains correct.

---

## Decision

The owner approved all three options offered on 2026-09-22 (A, B and C together).
They are not mutually exclusive, because only one of them is a claim about
*which application is canonical*:

| | What it actually is | Status |
|---|---|---|
| **A** | Give the app its own repository | **Prepared and verified. Blocked on repo creation.** |
| **B** | Corpus canonical, scoped to the subtree | **Already true and already documented** — ADR 0001 |
| **C** | `russell-capital-app` as an evidence-based candidate | **Already recorded** — that repo's own PR #3 |

B is the operative decision and nothing here changes it. A is a change of
*address*, not of canon. C stays on the record as the documented runner-up so
the comparison is not lost.

## The extraction is verified

`git subtree split --prefix=russell-capital-systems` was run against both
`master` and the PR-2b branch. Both results are pushed and reviewable:

| Branch | Commit | Contents |
|---|---|---|
| `extract/rcs-main` | `2e46323` | `master` (`76ed5f2`) as a repository root |
| `extract/rcs-pr2b` | `2a483b9` | the PR-2b navTree branch, likewise |

2,004 files, with `package.json`, `client/`, `server/`, `shared/` and `drizzle/`
at the top level. Verified from a clean checkout of `extract/rcs-main`:

| Step | Result |
|---|---|
| `pnpm install --frozen-lockfile` | **PASS** — 11.2s |
| `pnpm run check` (`tsc --noEmit`) | **PASS** — zero errors |
| `pnpm run build` | **PASS** — 330 route patterns emitted |
| `pnpm run test:ci` | **3,756 pass, 5 skipped, 1 fail** |

### The single failure is the finding, not a defect

`server/livePageParity.test.ts` resolves `REPO = path.resolve(APP, "..")` — one
level **above** the application — and asserts `docs/mirror/index.html` exists
there. In the corpus that path is `sam-russell-corpus/docs/mirror/index.html`,
a tracked 7.5 MB file. In a standalone repository there is no directory above
the application, so the assertion cannot hold.

**The application is coupled to its parent repository, and this test is where
that coupling is load-bearing.** It is not incidental. Two hosts serve the same
homepage and this test is what stops them drifting:

| Host | Source | Path |
|---|---|---|
| `russellcapitalsystems.com` (apex) | corpus-root `docs/` | `pages.yml` → GitHub Pages |
| `www.russellcapitalsystems.com` | `russell-capital-systems/` subtree | `deploy-branch.yml` → `deploy/rcs` → Railway |

Both render `shared/homeManifesto.json`. The static mirror at the apex is a
deliberate second rendering, not a stale leftover.

**Therefore A cannot be completed by moving files alone.** Whoever executes it
must first decide where `docs/mirror/` and `pages.yml` live, and rework the
parity test's root resolution to match. Extracting without that trades one
working test for two silently diverging homepages.

## Blocked on one action

Repository creation is not available to the automation acting here:

```
POST https://api.github.com/user/repos
→ 403 Resource not accessible by integration
```

To finish A the owner creates an **empty private** repository named
`russell-capital-systems` (no README, no .gitignore, no licence — an
initialised repo makes the first push a conflict). The prepared branches are
then pushed into it unchanged.

Until that exists, ADR 0001 stands unmodified and the live deployment path is
untouched.

## Corrections to the recorded baseline

Two figures in `CURRENT_STATE_BASELINE.md` are now behind the work:

1. **Route and test counts.** The baseline records `master` at 330 routes and
   4,138 tests. Open PR #177 (`integrate/live-build`, `8a17807`) carries
   **437 routes** and reports 4,480 tests. `master` remains the live build;
   the baseline is accurate *for master* and should say so explicitly.

2. **Test totals depend on the runner.** `test:ci` excludes 26 files needing a
   live database and a listening server. The 4,138 figure is `pnpm test`; the
   3,762 measured here is `test:ci`. Neither is wrong — they are different
   suites, and quoting one as the other has caused confusion more than once.

## Unrelated finding, recorded not acted on

`samtheinsuranceman-debug/sam-russell-corpus` is a **public** repository. It
tracks 2,008 application files and 276 files matching
`brotherhood|prayer|church_girl|confession|journal|medical|biomedical`.

The application subtree itself scanned clean — no plaintext access codes, no
API-key-shaped strings, no committed `.env` files. The exposure is the
personal and devotional material, not credentials.

**No repository visibility was changed.** That is a repository-level action the
governing document reserves to the owner, and it is his call alone. It is
recorded here because it is a further argument for A: a standalone application
repository would let the corpus's visibility be decided on its own merits
rather than being pinned by the code it happens to contain.

## Consequences

- Nothing about the live deployment changes. `deploy/rcs` → Railway is untouched.
- `extract/rcs-main` and `extract/rcs-pr2b` are pushed but referenced by nothing;
  they are inert until a target repository exists.
- If A is abandoned, delete those two branches. No other cleanup is required.
- If A proceeds, `docs/mirror/` ownership and `livePageParity.test.ts` must be
  resolved in the same change, not deferred.
