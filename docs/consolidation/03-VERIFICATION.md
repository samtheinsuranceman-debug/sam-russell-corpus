# 3 — Verification of the Live Build

**Run:** 2026-09-20
**Commit verified:** `76ed5f2` (`master`)
**Environment:** Linux, Node v22.22.2, pnpm 10.34.2 (repo pins `pnpm@10.34.2`)
**Working directory:** `russell-capital-systems/`

Every command below was run. Exit codes and output are transcribed, not
summarised from expectation. This is the regression baseline every capability
PR is measured against.

---

## 3.1 Install

```
$ pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Packages: +766
Done in 6.3s using pnpm v10.34.2
EXIT=0
```

**Result: PASS.** 766 packages, lockfile honoured, no resolution drift.

One warning, recorded because it could matter later:

```
Ignored build scripts: @parcel/watcher@2.5.1, @tailwindcss/oxide@4.1.14,
esbuild@0.25.10, esbuild@0.28.2.
```

pnpm blocked post-install scripts for four packages. The build below still
succeeds, so this is not currently breaking anything — but if a future build
fails with a missing native binary, this is the first place to look.

**Note on layout:** `pnpm-workspace.yaml` declares `packages: ["."]`, and the
workspace root resolves to `sam-russell-corpus/`, so `node_modules` is
installed at the repository root as well as in the app directory. Both are
correctly git-ignored (verified with `git check-ignore`).

---

## 3.2 Typecheck

```
$ pnpm check          # tsc --noEmit
EXIT=0
errors: 0
```

**Result: PASS. Zero TypeScript errors.**

This is worth stating plainly because the donor repositories do not share it:
`russell-capital-app` uses `// @ts-nocheck` pervasively across portal pages,
contexts and `toolSearchIndex.ts`. Anything imported from a donor must
typecheck on arrival — the donor passing its own checks proves nothing.

---

## 3.3 Build

```
$ pnpm build          # node scripts/build.mjs && esbuild server/_core/index.ts ...
EXIT=0

[build] 330 route patterns written to dist/public/routes.json
[build] Frontend emitted to dist/public with esbuild code splitting and compiled Tailwind CSS.
  dist/index.js  3.8mb
  ...401 more output files
Done in 1897ms (frontend) + 126ms (server)
```

**Result: PASS.** Frontend and server both emit. 330 route patterns written,
consistent with a 331-entry manifest (the manifest includes `/404`, which is
not a routable pattern).

`dist/index.js` at 3.8 MB carries esbuild's size warning. Not a failure, and
not a regression — recorded so that a future increase has something to be
compared against.

---

## 3.4 Tests

### The CI suite

```
$ pnpm test:ci
EXIT=0
Test Files  194 passed (194)
     Tests  3757 passed | 5 skipped (3762)
  Duration  51.54s
```

**Result: PASS.**

### The full suite

`test:ci` excludes 25 test files by name. The exclusion list is worth reading
in full because "CI is green" and "the tests pass" are not the same claim.
Excluded: `batch9-features`, `client-workflow.integration`,
`core-table-queryability`, `databaseSchemaFile`, `persistence-schema`,
`phase3-features`, `round10`, `round19`, `round20`, `round21`, `round30`,
`slides-pptx`, `subscriptionGate`, `heygen-api`, `messaging`,
`complianceTracking`, `features`, `round6`, `round7`, `round14`, `round15`,
`round16`, `round17`, `round18`, plus the `*.secret.test.ts` and
`*.live.test.ts` globs.

The workflow's own comment gives the reason: *"The hermetic suites only: the
database-backed and live-provider suites need a MariaDB and real keys and are
run locally before merge."*

So the full suite was run:

```
$ pnpm test
EXIT=0
Test Files  216 passed | 9 skipped (225)
     Tests  4138 passed | 82 skipped (4220)
  Duration  64.13s
```

**Result: PASS.** The excluded suites self-skip cleanly when their
dependencies are absent rather than failing. **The exclusions are not hiding
failures in this environment.** They would still need a MariaDB and live keys
to be genuinely exercised, which this environment does not have — so "4,138
passing" is an honest number for a hermetic run, not proof that the
database-backed paths work.

---

## 3.5 Dependency audit

```
$ pnpm audit --audit-level=high
EXIT=0
4 vulnerabilities found
Severity: 2 moderate | 2 high (2 ignored)
```

**Result: PASS, with a caveat.** The run exits 0 because the two high-severity
advisories are suppressed via `pnpm.auditConfig.ignoreGhsas`. `package.json`
documents why: they are the `image-size` advisories, reachable only through
`pptxgenjs`, with no patched release available. Patched versions elsewhere are
pinned through `pnpm.overrides`.

That is a defensible suppression, but it means **`pnpm audit` exiting 0 does
not mean zero high-severity advisories.** Any capability PR that adds a
dependency should be read against this, not against the exit code.

---

## 3.6 Secret scan

No `gitleaks` or `trufflehog` binary is available in this environment, so a
pattern scan was run across all tracked files in the app subtree, covering
OpenAI (`sk-`), Stripe live (`sk_live_`), GitHub (`ghp_`), AWS (`AKIA`),
Slack (`xox[baprs]-`), Google (`AIza`), and PEM private-key headers.

**One hit, and it is a placeholder:**

```
client/src/pages/portal/Integrations.tsx:261:  value="xoxb-EXAMPLE-PLACEHOLDER"
```

**Result: PASS — no live credentials in tracked files.**

Tracked `.env` files: `AQAL/aqal-platform/.env.example` and
`doctor-buddy/.env.example`. Both are `.example` templates, neither in the app
subtree.

**Open item, not resolved here:** `scripts/DEPLOY.md` line 45 states *"Rotate
the 3 burned keys (OpenAI, Mistral, HeyGen) before using them."* Those keys
are not in the repository — the note refers to keys held elsewhere. Whether
they have been rotated is unknown and unverifiable from here. Credential
handling is excluded from this workstream; this is flagged for the owner.

Document 05 proposes adding real secret scanning to CI.

---

## 3.7 Regression already caused by the earlier branch

**Disclosure.** Before this foundation PR was scoped, work in this session
pushed three application-code commits to
`claude/russell-capital-consolidation-xdzwc1`: a Plastic-to-Cash page and
engine, a Carrier Desk page and intel module, and a navigation restructure.

Under the current mandate that branch is **not** the foundation. It is a
candidate capability PR, and it is **currently red**:

```
$ git checkout claude/russell-capital-consolidation-xdzwc1
$ pnpm check     → EXIT=0, 0 errors
$ pnpm test:ci   → EXIT=1
Test Files  3 failed | 191 passed (194)
     Tests  4 failed | 3753 passed | 5 skipped (3762)
```

Against a master baseline of **194/194 files and 3,757 tests passing**, that
is a **4-test regression**, entirely from the navigation change. The four:

| Test | Assertion that broke |
|---|---|
| `navigation-organization.test.ts` → "clearly exposes the Secondary Information library" | `AppShell.tsx` must contain `label: "Secondary Information"`. The section was folded into "Reference & Admin". |
| `navigation-organization.test.ts` → "keeps the generated secondary catalog routable and disjoint from the primary sidebar" | `/portal/explore` belongs to `SECONDARY_CATALOG` and must **not** appear in the primary sidebar. It was added to it. |
| `grok-merge.smoke.test.ts` → "makes every Grok route discoverable in the active left navigation" | `AppShell.tsx` must contain `label: "New Client Welcome List"`. The section was renamed "Start Here". |
| `integrationAudit.test.ts` → "rate every featured page" | Two new catalogue entries were marked `featured: true` without hand ratings in `shared/pageRatings.ts`. |

**These are real invariants, not brittle tests.** The secondary catalogue is
deliberately disjoint from the primary sidebar; featured pages are required to
carry hand ratings. The fix belongs in the code, not the assertions.

### 3.7.1 A defect the same investigation exposed

While diffing all 174 navigation paths against the router, two entries were
found that point at routes which **do not exist**:

- `/portal/tool-explorer`
- `/portal/knowledge-library`

Neither appears in `App.tsx` as a `<Route>`, neither is in
`shared/routeManifest.ts`, and there is no redirect or alias mechanism. They
404.

**And `navigation-organization.test.ts` requires them to be in the menu:**

```ts
expect(navSet.has("/portal/tool-explorer")).toBe(true);
expect(navSet.has("/portal/knowledge-library")).toBe(true);
```

So the suite is currently enforcing the presence of two broken links. The
existing tests cannot catch this because the manifest smoke test compares
routes ↔ manifest, and this navigation test compares routes → navigation —
**nothing compares navigation → routes.**

Under the mandate, changing that test requires documented comparison and
regression proof, which is what this section is. The recommended fix is in
document 06 as a small, bounded PR of its own: either add the two routes or
correct the navigation and the assertion together — and add the missing
navigation → route check to CI so the class of defect cannot recur.

---

## 3.8 Baseline summary

Everything below is the contract for "green". A capability PR that changes any
of these numbers adversely does not merge.

| Check | Command | Result on `master` |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | **PASS** — 766 packages, exit 0 |
| Typecheck | `pnpm check` | **PASS** — 0 errors |
| Build | `pnpm build` | **PASS** — 330 route patterns, exit 0 |
| CI tests | `pnpm test:ci` | **PASS** — 194 files, 3,757 tests |
| Full tests | `pnpm test` | **PASS** — 216 files, 4,138 tests, 82 skipped |
| Audit | `pnpm audit --audit-level=high` | **PASS** — exit 0, 2 advisories suppressed by documented policy |
| Secret scan | pattern scan, tracked files | **PASS** — one placeholder only |

### Re-verified with this PR's own additions applied

This PR adds one test file and one workflow. Re-run on the foundation branch:

| Check | Result | vs `master` |
|---|---|---|
| `pnpm check` | **PASS** — 0 errors | unchanged |
| `pnpm build` | **PASS** — 330 route patterns | unchanged |
| `pnpm test:ci` | **PASS** — **195 files, 3,762 tests** | +1 file, +5 tests |

**The regression floor in `consolidation-ci.yml` is set to 195 / 3,762** — the
post-merge numbers, so future PRs are held to the higher bar rather than
`master`'s.

### A CI assertion that was wrong until it was run

The first draft of the build job asserted the route count with
`JSON.parse(...).length` on `dist/public/routes.json`. That file is an object
(`{ generatedAt, routes: [...] }`), not an array, so the expression yielded
`undefined` and the comparison would have failed every run.

Corrected to `.routes.length` and re-checked against the real build artifact:
**330 patterns, assertion passes.** The regression-floor parsing was likewise
run against the actual `test:ci` output rather than assumed — it parses
`files=195 tests=3762` correctly.

Recorded because a CI gate that has never been executed is a guess, and this
one was wrong on the first attempt.
