# 05 — CI, Secret Scanning, and Rollback

**Foundation PR, deliverable 5 of 6.**

---

## 5.1 — THE CONSTRAINT THAT SHAPES EVERYTHING HERE

**`master` is production.**

`.github/workflows/deploy-branch.yml`:

```yaml
on:
  push:
    branches: [master]
    paths: ["russell-capital-systems/**"]
```

…splits `russell-capital-systems/` to `deploy/rcs`, force-pushes it, and calls
Railway's `serviceInstanceDeployV2` mutation against service
`e8d1eb7b…` / environment `fe806289…` — the service serving
`www.russellcapitalsystems.com`.

So a migration PR merged to `master` deploys the live site within minutes, with
no further human step. The directive says: *"No production deployment or DNS
change without a separate explicit approval."*

**Therefore: no migration PR targets `master`.**

### Branch design

```
master                         ← production. Deploys on merge. Owner-approved promotions only.
  └── consolidation/main       ← long-lived integration branch. All migration PRs merge HERE.
        ├── consolidation/phase-1-...
        ├── consolidation/phase-2-...
        └── …
```

- Every migration PR targets **`consolidation/main`**. Merging one deploys nothing.
- `consolidation/main` → `master` is a **separate PR**, opened only when you
  explicitly approve it, and that single merge is the production deployment.
- This PR (foundation) also targets `consolidation/main` and contains no
  application code.

**Recommended, not applied here** (requires repo-admin rights): protect `master`
— require a PR, require the consolidation gate to pass, disallow force-push.
Given eight concurrent sessions on this account, this is the single highest-value
safeguard available.

---

## 5.2 — WHAT CI ALREADY DOES

| Workflow | Trigger | Covers |
|---|---|---|
| `rcs-security-audit.yml` | PRs touching `russell-capital-systems/**`, weekly Mondays 06:00 UTC | `pnpm audit --audit-level=high` + `tsc --noEmit` |
| `deploy-branch.yml` | push to `master` | subtree split → `deploy/rcs` → Railway deploy |
| 10 probe workflows | various | domain, chain, intake, whisperer, Dr Buddy probes; site audit; pages |

**The gap: nothing runs `pnpm build` or `pnpm test` on a pull request.** The
security audit typechecks but never builds and never runs the 225 test files.
A PR that breaks the build or fails 4,138 tests merges green today.

---

## 5.3 — ADDED BY THIS PR: `consolidation-gate.yml`

One workflow. Runs on PRs into `consolidation/main` and `master` that touch the
app. It does not deploy and holds no secrets.

Gates, each asserted against the `03-VERIFICATION.md` baseline:

| Gate | Assertion |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Typecheck | `tsc --noEmit` — zero errors |
| Build | `pnpm build` — exit 0 |
| **Route manifest parity** | routes emitted to `dist/public/routes.json` match `shared/routeManifest.ts`, both directions |
| **Route count floor** | **≥ 330** patterns — a migration may add routes, never silently drop them |
| Tests | `pnpm test` — full suite, not the CI subset |
| **Test floor** | **≥ 216** files and **≥ 4,138** tests passing, **0** failing |
| Secret scan | gitleaks on the PR diff |
| Dependency audit | `pnpm audit --audit-level=high` |

The floors are what make this a *regression* gate rather than a smoke test. A
migration that quietly drops a route or a test file fails.

---

## 5.4 — SECRET SCANNING

Two layers, because the base legitimately holds 35 production environment
variable **names** on Railway and must never hold their **values**.

1. **gitleaks** on every PR diff, in the gate workflow. Fails the PR on a hit.
2. **GitHub push protection / secret scanning** — enable in repository settings
   (Security → Code security). Owner action; cannot be set from a PR.

Standing rules for every migration PR:

- Never commit `.env`, `.env.*`, or any file containing a `DATABASE_URL`,
  `JWT_SECRET`, `*_API_KEY`, `*_TOKEN`, `OWNER_PASSWORD_HASH`, or
  `GUEST_PASSCODE_HASH` value.
- Donor repos carry their own deploy configs. Import **patterns**, never values.
- `RAILWAY_TOKEN` and every Railway variable stay in Railway. This consolidation
  neither reads nor writes them.
- If a secret is ever committed: rotate it at the provider **first**, then purge
  history. Rotation first — history rewriting does not un-leak a live key.

---

## 5.5 — ROLLBACK AND TAGS

### Tag before every migration merge

```bash
git tag -a consolidation-phase-<N>-pre -m "Pre-<capability> migration. Baseline: 330 routes, 216 test files, 4138 tests."
git push origin consolidation-phase-<N>-pre
```

Every migration PR names its pre-tag in its description. A phase with no pre-tag
does not merge.

### Rolling back a migration on `consolidation/main`

```bash
git revert -m 1 <merge-commit-sha>     # revert the merge, keep history
git push origin consolidation/main
```

Then re-run the gate and confirm the baseline is restored:

```bash
pnpm check && pnpm build && pnpm test
```

### Rolling back production

Production is only ever changed by a `consolidation/main` → `master` merge that
you approved. To undo one:

1. **Fastest — Railway:** redeploy the previous successful deployment from the
   Railway dashboard (project `russell-capital-systems`, service `web`,
   environment `production`). This needs no Git change and is the first move in
   an incident.
   Last known-good at the time of writing: `43820e9c-4f90-4a9a-aa0f-dbe048d33ce7`,
   SUCCESS, 2026-09-18 23:26 UTC.
2. **Then Git:** revert the merge on `master`. The push re-triggers
   `deploy-branch.yml` and redeploys the reverted tree.

Do 1 before 2. Restoring service and correcting history are separate jobs.

### Not in scope, ever, without separate approval

DNS · domains · Railway variables · database contents or schema in production ·
credentials · the Vercel project · `deploy/rcs` (written only by automation —
never push to it by hand).

---

## 5.6 — A NOTE ON CONCURRENT SESSIONS

Eight sessions are reported to be working this account. `deploy-branch.yml`
means any of them pushing to `master` deploys the live site. Two safeguards
worth having in place before migration begins:

1. Branch protection on `master` (§5.1).
2. One session owns writes to this repo; the rest read. Merging is a serializing
   operation — parallel merge sessions produce divergent, individually-defensible
   results that then have to be merged again.

Neither is something this PR can apply. Both are owner actions.
