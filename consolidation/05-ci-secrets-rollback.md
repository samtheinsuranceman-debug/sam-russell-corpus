# 5 — CI, secret scanning, tagging and rollback

---

## 5.1 The deployment tripwire — read this first

`.github/workflows/deploy-branch.yml`:

```yaml
on:
  push:
    branches: [master]
    paths: ["russell-capital-systems/**"]
```

It runs `git subtree split --prefix=russell-capital-systems -b deploy/rcs`,
**force-pushes** `deploy/rcs`, then calls the Railway GraphQL API to deploy
service `e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28` in environment
`fe806289-faed-4850-b030-b47f8dc4c70f` — the `web` service behind
`www.russellcapitalsystems.com`.

**Consequence:** merging any PR that touches `russell-capital-systems/**` into `master`
deploys to production automatically. There is no manual gate between merge and deploy.

Three rules follow, and they are the spine of this plan:

1. **This foundation PR touches nothing under `russell-capital-systems/**`.** Its files are
   `consolidation/**`, `.github/workflows/rcs-ci.yml` and `.gitleaks.toml`. Merging it cannot
   deploy.
2. **Every migration PR in §6 is a production deployment on merge.** Each therefore needs the
   separate explicit approval already required — and the approval is on the *merge*, not the
   PR.
3. **Tag before every merge** (§5.5), because the rollback path is a revert plus a re-run, and
   a tag is what makes the "before" state nameable.

`deploy-branch.yml` is **not modified** by this PR. Adding a manual approval gate to it is a
reasonable follow-up; it is a change to the live deploy path and so is proposed, not taken.

---

## 5.2 CI added by this PR

`.github/workflows/rcs-ci.yml` — **the build's own gate, which did not exist.** Twelve
workflows were already present; all twelve are probes, deploys, or scheduled audits, and none
installs, typechecks, builds or tests `russell-capital-systems`.

Two jobs:

**`verify`** — on PRs touching the build, on pushes to `master`, and on demand:

| Step | Gate |
|---|---|
| `pnpm install --frozen-lockfile` | lockfile honoured |
| `pnpm rebuild @tailwindcss/oxide esbuild @parcel/watcher` | matches §3 procedure exactly |
| `pnpm check` | zero type errors |
| `pnpm build` | clean build |
| `pnpm test` | full suite — ≥4138 passing, 0 failing |
| Route count invariant | `App.tsx` == `ROUTE_MANIFEST` == `dist/public/routes.json`.routes |
| Audit manifest reconciled | reconciler leaves a clean tree |

It runs `pnpm test`, not `test:ci` — §3.4 verified the excluded files self-skip rather than
fail without a database, so the full suite is free and covers 381 more assertions.

`lfs: false` on checkout: the corpus carries LFS audio the build needs none of.

**`secrets`** — gitleaks over full history on every PR.

---

## 5.3 Secret scan results (2026-09-20)

Manual scan of all tracked files in `russell-capital-systems` for: OpenAI (`sk-`), GitHub
(`ghp_`, `github_pat_`), Slack (`xox*`), AWS (`AKIA`), Google (`AIza`), Resend (`re_`),
Stripe live (`sk_live_`, `rk_live_`), PEM private keys, and credentialed
`mysql://` / `postgres://` URLs.

| Severity | Finding |
|---|---|
| **None** | **No production credential of any kind in tracked files.** |
| Low | `docs/handoff/RCS_Claude_Session_01/transcript.md` quotes a localhost dev DB URL (`mysql://rcs:rcs_local_dev@127.0.0.1:3307/rcs`) and a literal `local-dev-only-secret-…` JWT secret, twice. Localhost-only, throwaway, quoted inside a session transcript. **No action** — transcription authenticity is a repository convention — but allowlisted explicitly rather than silently. |

Two files match on filename only and contain no secrets:
`server/providerCredentials.live.test.ts`, `server/xaiCredential.live.test.ts`.

Historical note from `CLAUDE.md`: `russell-capital-source.zip` was removed from
`Russell-Capital-Solutions-NEW` for carrying retired credentials. **Those credentials remain
in that repository's git history.** Rotating them and purging or archiving that repo is
recommended and is **out of scope here** — it is a different repository.

`.gitleaks.toml` is added with the corpus in mind: default rules kept, a Railway-token rule
added, and prose paths (transcripts, journals, handoffs, PDFs, audit JSON) allowlisted so the
scan stays signal and does not get ignored.

---

## 5.4 Environment variables

The build reads 35 env vars. None is committed; `.gitignore` covers `.env*`. Required to run:
`DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`. Everything else degrades gracefully —
`server/keyProbe.ts` reports which providers are configured at runtime.

**No credential is created, read, rotated or moved by this consolidation.**

---

## 5.5 Tagging and rollback

### Before every migration merge

```bash
git tag -a rcs-pre-<phase> -m "Pre-<phase>: 4138 tests green, 330 routes"
git push origin rcs-pre-<phase>
```

Tag names: `rcs-pre-pr2`, `rcs-pre-pr3`, … The tag is the named "before" state; without it the
rollback below has nothing to point at.

### Rolling back a merged phase

Because merge auto-deploys, rollback is **revert, not reset** — history must stay
forward-only so `deploy/rcs` can be rebuilt from it.

```bash
# 1. Revert the merge commit on master. This re-triggers deploy-branch.yml,
#    which re-splits deploy/rcs from the reverted tree and redeploys.
git revert -m 1 <merge-sha>
git push origin master

# 2. Confirm the deploy took, then verify the invariants are back:
#    pnpm check && pnpm build && pnpm test   → 4138 passing
#    node scripts/reconcile-route-manifest.mjs
```

### If Railway did not pick up the revert

`deploy-branch.yml` skips its Railway step when `RAILWAY_TOKEN` is unset, so the subtree may
be correct while the running service is stale. Then either re-run the workflow
(`workflow_dispatch`), or roll back from the Railway dashboard to the prior deployment of
service `e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28`.

### Emergency stop

To halt all automatic deployment without touching DNS, hosting or credentials: disable the
**Publish deploy/rcs** workflow in the repository's Actions tab. `deploy/rcs` freezes at its
last state and Railway keeps serving it.

### What rollback does *not* cover

Schema migrations. PR-4 adds 7 tables; a code revert does not drop them. They are **additive
only** — no existing table is altered — so a reverted build simply ignores them. **No
migration phase may alter or drop an existing table**, which is what keeps code-revert a
sufficient rollback for the whole plan.
