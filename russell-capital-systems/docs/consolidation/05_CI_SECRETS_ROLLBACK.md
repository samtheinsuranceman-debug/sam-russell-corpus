# 5 — CI, Secret Scanning, Rollback and Tags

---

## The gap this closes

The repository has 12 workflows. **Exactly one runs on `pull_request`**
(`rcs-security-audit.yml`), and it does not install, typecheck, build, or test.
Nine of the remaining eleven are `workflow_dispatch` probes; the other two deploy
from `master`.

So before this PR, nothing verified a pull request. Every "green" was an assertion.
Given that the consolidation programme is about to move hundreds of files into this
repository, that gap had to close first.

## What this PR adds — `.github/workflows/rcs-verify.yml`

Runs on `pull_request` touching `russell-capital-systems/**`, and manually.

| Step | Fails the PR? | What it proves |
|---|---|---|
| `pnpm install --frozen-lockfile` | yes | The lockfile is honest — no drifted dependency |
| `pnpm check` | yes | Zero TypeScript errors, the current standard |
| `pnpm build` | yes | Client and server both bundle |
| **Route three-way agreement** | yes | `App.tsx` = `routeManifest.ts` = built `routes.json` |
| `pnpm test:ci` | yes | The 3,757-test gate |
| `pnpm test` | **no — advisory** | Full suite; DB-dependent files self-skip without `DATABASE_URL`, so a skip here is expected and is not a regression |
| `pnpm audit --audit-level=high` | yes | No new high/critical dependency advisory |
| **gitleaks** | yes | No secret in the PR's commits |

### Why it cannot deploy

- `permissions: contents: read` — it cannot write to the repository.
- No secrets are passed to the verify job. It cannot reach Railway, the database,
  or any provider API.
- It has no `push` trigger, so it never runs on `master`.

The deployment boundary is unchanged: **`deploy-branch.yml` and `pages.yml` fire
only on `push` to `master`.** A branch push runs verification and nothing else.

### The route check, specifically

```bash
app=$(grep -o 'path="[^"]*"' client/src/App.tsx | sort -u | wc -l)
manifest=$(sed -n '/ROUTE_MANIFEST/,/^]/p' shared/routeManifest.ts | grep -c '^\s*"')
built=$(node -e "…JSON.parse(…routes.json).routes.length")
```

Validated locally against the real build — all three report **330**. This catches
the two silent failures a test count cannot: a route registered in `App.tsx` but
never declared in the manifest, and a manifest line whose route was deleted. Both
are runtime 404s that no existing test would surface.

---

## Secret scanning

**gitleaks** runs as a separate job with `fetch-depth: 0`, because a PR that adds a
secret and removes it in a later commit has still leaked it — scanning only the
final tree would miss that.

### Existing posture worth preserving

`PROVENANCE.md` records that Slack placeholder patterns in 9 files (UI hints and
test fixtures, never real credentials) were deliberately neutered so push
protection and scanners would not flag them. **Do not re-introduce realistic-looking
placeholder tokens** when porting donor code — donor fixtures may contain the
original patterns. If gitleaks fires on a ported test fixture, neuter the pattern
rather than adding an allowlist entry.

`rcs-security-audit.yml` already runs on PRs and on a schedule. `rcs-verify.yml`
does not duplicate it — the two are complementary.

### Scan results — run against the base, 2026-09-20

`gitleaks v8.21.2`, `detect --source russell-capital-systems --no-git --redact`.

**40 findings. Zero real secrets.** Every one classified by hand:

| Location | Count | Rule | Classification |
|---|---|---|---|
| `PARTS_MANIFEST.json` | **33** | generic-api-key | **False positive** — SHA-256 file hashes from the provenance manifest |
| `client/src/pages/portal/Integrations.tsx:416-417` | 2 | generic-api-key | **False positive** — `whsec_abcdef123456` / `whsec_zapier789012`, obvious placeholder demo rows in a UI mock |
| `dist/public/assets/chunks/Integrations-*.js` | 2 | generic-api-key | **Not tracked** — build output, `dist/` is gitignored. The same two placeholders, minified |
| `server/round32.test.ts:511` | 1 | generic-api-key | **False positive** — `const token = "abc123def456"` in a URL-construction test |
| `shared/aiIntakeScript.ts:460` | 1 | generic-api-key | **False positive** — `INTAKE_STORAGE_KEY = "rcs_intake_v1"`, a localStorage key *name* |
| `docs/handoff/.../transcript.md` | 1 | generic-api-key | **False positive** — the literal string `` `MCP_API_KEY` `` discussed as a variable name, no value |

**Verdict: no credential is committed to this repository.** The base is clean.

Two consequences for CI:

- A bare `gitleaks` run is **red on arrival** on this repository because of the 33
  manifest hashes. It needs `PARTS_MANIFEST.json` excluded, or a `.gitleaksignore`,
  before it can be a blocking gate. The workflow added here scans the PR's commits
  rather than the whole tree, so it does not inherit those 33 — but any future
  full-tree scan must account for them.
- The `Integrations.tsx` placeholders are exactly the class `PROVENANCE.md` records
  as previously neutered for Slack. They are safe, but they will keep tripping
  scanners. Worth neutering in a later hygiene PR — out of scope here.

### A note on the donors

Neither donor has been secret-scanned in this session. **Run gitleaks against any
donor file set before the migration PR is opened**, not after:

```bash
docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect \
  --source /repo --no-git --redact
```

---

## Rollback

### Tags

Tag the verified baseline before the first migration PR merges:

```bash
git -C sam-russell-corpus fetch origin master
git tag -a consolidation-baseline 76ed5f2 \
  -m "Verified baseline before consolidation: tsc 0 errors, build 330 routes, 4138 tests passing"
git push origin consolidation-baseline
```

Then tag after each phase merges to `master`:

```bash
git tag -a consolidation-phase-N <sha> -m "Phase N: <capability> — <test counts>"
git push origin consolidation-phase-N
```

This gives a named point to return to per phase rather than hunting commit SHAs.

### Rolling back a merged phase

Because the deploy path is a subtree split, **rollback is a normal git operation on
`master`** — there is no separate deployment artifact to revert:

```bash
git checkout master && git pull
git revert -m 1 <merge-commit-sha>     # -m 1 keeps master's side
# verify locally BEFORE pushing:
cd russell-capital-systems && pnpm install && pnpm check && pnpm build && pnpm test:ci
git push origin master
```

Pushing that revert to `master` re-triggers `deploy-branch.yml`, which republishes
`deploy/rcs`, and Railway redeploys the reverted state. **Expected recovery: one
Railway deploy cycle.**

Use `git revert`, never `git reset --hard` + force-push. `deploy/rcs` is derived
from `master` by subtree split; rewriting `master` history desynchronises it and
the recovery is materially worse than the original problem.

### If a migration lands a bad migration file

Schema changes are the one thing a `git revert` does **not** undo — reverting the
code leaves the applied migration in the database. Therefore:

- Every schema-touching PR is its own phase, merged alone.
- It must ship a **down migration** or a documented manual reversal, in the PR.
- It requires a **database backup taken immediately before merge**. The repo already
  has `pnpm db:backup` and `pnpm db:restore` — use them, and record the backup
  identifier in the PR.
- Schema PRs need separate explicit approval, same as a deployment.

### Emergency stop

To halt the programme without reverting anything: close the open migration PRs.
Nothing is deployed until a merge to `master`, so unmerged work is inert.

---

## What is deliberately not automated

**No auto-merge, no auto-deploy, no scheduled migration runs.** Every phase is a
human-approved merge. The brief requires separate explicit approval for production
deployment and DNS; nothing in this CI configuration can grant that, by design.
