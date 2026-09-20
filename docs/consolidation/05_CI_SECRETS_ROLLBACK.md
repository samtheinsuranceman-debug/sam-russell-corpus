# 5. CI, Secret Scanning, and Rollback

---

## 5.1 The gap this closes

The corpus has 12 workflows. **None of them runs typecheck, tests, or the build on a
pull request.** The one workflow that mentions build commands
(`rcs-security-audit.yml`) is a weekly dependency audit.

So today, a PR that breaks the build, deletes a route, or commits a password merges
without a single automated objection. That is unacceptable for a consolidation that
will touch 394 pages, and it is the first thing this PR fixes.

## 5.2 `consolidation-ci.yml` — three jobs

Added at `.github/workflows/consolidation-ci.yml`. Runs on PRs touching
`russell-capital-systems/**`, on push to `master`, and on demand. **It does not
deploy, touch DNS, or connect to a database.**

### Job 1 — `verify`: typecheck · build · test

```
pnpm install --frozen-lockfile
pnpm run check      # tsc --noEmit
pnpm run build
pnpm test           # the FULL suite
```

Deliberately `pnpm test`, not `pnpm test:ci`. §3.5 established that the ~25 suites
`test:ci` excludes **self-skip without a database rather than failing** — the full
suite is 216 passed / 9 skipped / **0 failed**. Excluding them buys nothing and
hides 381 assertions. Narrowing the exclusion list in `package.json` is a Phase A
cleanup.

`--frozen-lockfile` means a PR that edits `package.json` without the lockfile fails
here instead of drifting.

### Job 2 — `route-manifest`: zero drift

Compares `<Route>` registrations in `App.tsx` against `shared/routeManifest.ts` and
fails on any difference **in either direction**, printing the exact paths.

This is the single most important gate for Phase B. Importing 394 pages means 394
chances to register a route without manifesting it; this makes each one a named
build failure rather than silent drift.

**Verified working, both directions:**

```
$ node <manifest check>
Route manifest OK — 330 routes, zero drift.
exit=0

# negative test: inject an unmanifested route
$ node <manifest check>
MISSING from manifest:
  /portal/__ci_negative_test__
exit=1
```

A gate that cannot fail is decoration. This one fails correctly and names the path.

### Job 3 — `secret-scan`

Three layers:

1. **Gitleaks** over full history (`continue-on-error` initially, so a historical
   finding reports without blocking every PR until triaged — tighten in Phase A).
2. **High-signal patterns** — OpenAI, AWS, Resend, GitHub PAT, private keys.
   Excludes `audit/` and `docs/`, which legitimately hold placeholder examples.
3. **`shared/` credential check** — fails on any `PASSWORD|SECRET|API_KEY|TOKEN`
   constant in `russell-capital-systems/shared/*.ts`.

Layer 3 exists because of a specific, observed failure. In donor `russell-capital`,
`shared/accessControl.ts` held three working dashboard passwords — and `shared/` is
imported by the client bundle. One component importing that constant ships working
credentials to every visitor. The canonical base is clean today (§3.7); this keeps
it that way through 394 page imports.

## 5.3 Current secret posture

| Pattern | Files in canonical |
|---|---|
| `sk-…`, `AKIA…`, `re_…`, `ghp_…`, private keys | **0** |
| `xox[baprs]-` | 4 — all placeholders (`xoxb-EXAMPLE-PLACEHOLDER`) |

✅ No live credential in the canonical base. The four Slack matches sit in `audit/`,
`docs/handoff/`, and `Integrations.tsx` as illustrative examples and are excluded by
path.

⚠️ **Out of scope but flagged:** roughly 100 `brother-*`, `*-Identity`, and
`brotherhood-*` repositories, **many of them public**, hold personal and
theological material. That is a privacy question, not a consolidation one, and
wants its own review.

## 5.4 Tagging

Tag before every migration PR merges. Tags are free and are the difference between
a 30-second rollback and an archaeology session.

```bash
# Before merging any migration PR
git tag -a consolidation/pre-<phase>-<capability> -m "Before: <what>"
git push origin consolidation/pre-<phase>-<capability>

# After it merges green
git tag -a consolidation/post-<phase>-<capability> -m "After: <what>, CI green"
git push origin consolidation/post-<phase>-<capability>
```

Baseline tag for this foundation PR:

```bash
git tag -a consolidation/baseline-2026-09-20 76ed5f2 \
  -m "Canonical base before consolidation: 330 routes, 4138 tests passing, 0 failing"
git push origin consolidation/baseline-2026-09-20
```

## 5.5 Rollback

**Nothing in this PR requires rollback** — it adds documentation and CI only, and
changes no application code. The procedures below are for the migration PRs.

### A merged PR turns out bad

```bash
git revert -m 1 <merge-commit-sha>      # revert the merge, keep history
git push origin master
```
Then confirm: `pnpm run check && pnpm run build && pnpm test`.

### Several PRs in, and it is unclear which broke it

```bash
git bisect start master consolidation/baseline-2026-09-20
git bisect run bash -c 'cd russell-capital-systems && pnpm install --frozen-lockfile && pnpm run check && pnpm test'
```
Bisect is only this cheap because the baseline is **0 failing tests**. Preserve that.

### Return to a known-good tag

```bash
git checkout -b recover/<date> consolidation/post-<last-good>
```
Branch, never force-push `master`.

### Rollback is not deployment

Reverting a merge changes the repository only. Anything already deployed stays
deployed until a deliberate, separately-approved release. No deployment or DNS
change is authorised by this plan.

## 5.6 Branch protection — recommended, requires owner action

CI only helps if it is required. In **Settings → Branches → `master`**:

- Require status checks: `verify`, `route-manifest`, `secret-scan`
- Require branches to be up to date before merging
- Require a pull request before merging

I cannot set these; they need repository-owner action.
