# Addendum 02 — Merging this PR fires a production deploy

**Date:** 2026-09-20
**Builds on:** `FOUNDATION.md`, `REPOSITORY-INVENTORY.md`, `MIGRATION-PRS.md`, `ADDENDUM-01-open-items.md`
**Scope:** documentation only. No application code, no CI change, no registry touched.
**Status:** ⚠️ **Blocking. Read before merging the foundation PR.**

This addendum confirms and does not contest the preceding documents. Their
conclusions hold: the base is canonical, the base wins by default, no collision is
resolved by import. Verification figures were independently reproduced (§3) and match
exactly.

It raises one hazard none of the preceding documents flags, and it applies to **this
PR itself**.

---

## 1. The hazard

`FOUNDATION.md` §6 states *"No production deployment, DNS change, or
environment-variable change is part of any phase."* That is the stated intent. The
repository's own automation does not honour it.

`.github/workflows/deploy-branch.yml`:

```yaml
on:
  push:
    branches: [master]
    paths: ["russell-capital-systems/**"]
```

and its job body:

```yaml
- run: git subtree split --prefix=russell-capital-systems -b deploy/rcs
- run: git push --force origin deploy/rcs
- name: Trigger Railway deploy
  run: |
    if [ -z "$RAILWAY_TOKEN" ]; then echo "RAILWAY_TOKEN not set; skipping"; exit 0; fi
    curl -fsS https://backboard.railway.com/graphql/v2 ... serviceInstanceDeployV2 ...
```

**Every file in this PR lives under `russell-capital-systems/docs/consolidation/`.**
That path matches `russell-capital-systems/**`. So on merge to `master`, this
documentation-only PR will:

1. re-split the subtree,
2. **force-push `deploy/rcs`**, and
3. call Railway's `serviceInstanceDeployV2` mutation against service
   `e8d1eb7b-…` in environment `fe806289-…`.

Step 3 is a no-op while `RAILWAY_TOKEN` is unset — the workflow's own comment says
Railway's GitHub app "has not been delivering push events for this repo," which is an
observation about current behaviour, not a guarantee. Step 2 happens unconditionally.

**A documentation PR should not be able to reach production. This one can.**

This is not a criticism of the placement — putting the docs beside the app they
describe is the right instinct, and it correctly avoids `pages.yml`, which fires on
`docs/**` at the repository root. The problem is that **both** top-level paths are
wired to a publish step, so there is no "inert" location in this repository by default.

### It applies to every later phase too

Every migration PR in `MIGRATION-PRS.md` touches `russell-capital-systems/**` by
definition. Under the current configuration, **merge and deploy are the same event**
for all of them. The directive treats them as two decisions requiring separate
approval. Today they are one.

---

## 2. Options

| # | Option | Effect | Cost |
|---|---|---|---|
| 1 | Add `paths-ignore: ["russell-capital-systems/docs/**"]` to `deploy-branch.yml` | Documentation stops reaching the deploy path, permanently. Code changes still deploy on merge. | One line. Does not address migration PRs. |
| 2 | **Stage migrations on a long-lived `consolidation` branch** | Merge and deploy become separate decisions. `master` moves once, under explicit approval. | Requires a branch policy decision. |
| 3 | Approval-gate each merge | No config change; every merge is consciously a deploy. | Relies on discipline; one absent-minded merge deploys. |
| 4 | Remove the `master` trigger; make deploy `workflow_dispatch` only | Deployment becomes fully manual and explicit. | Changes existing deployment behaviour — a bigger decision than this programme. |

**Recommendation: 1 + 2.** Option 1 is a one-line change that makes this PR and every
future documentation PR genuinely inert. Option 2 is what the directive is actually
asking for when it separates merging from deploying.

Neither is applied here. Both change CI or branch policy, which the directive places
behind explicit approval, and this addendum's scope is documentation only.

---

## 3. Independent reproduction of §3

Run separately, on a clean shallow clone at `76ed5f2`, pnpm 10.34.2. Figures match
`FOUNDATION.md` §3 exactly:

| Step | Result |
|---|---|
| `pnpm install` | PASS |
| `pnpm check` | PASS — exit 0, zero errors |
| `pnpm build` | PASS — 330 route patterns → `dist/public/routes.json` |
| `pnpm test:ci` | PASS — 194 files, **3,757 passed**, 5 skipped, **0 failed** |
| `pnpm test` | PASS — 216 files, **4,138 passed**, 82 skipped, **0 failed** |

`FOUNDATION.md`'s reading of the `test:ci` exclude list is confirmed: the excluded
suites pass in the full run. Its recommendation to retire the list is sound, and the
consolidation CI workflow already runs the full suite instead. Two independent
sessions reaching identical figures is worth more than either alone.

### One measurement difference, reconciled

`FOUNDATION.md` §1.2 records **5** migrations for the base against **11** for the
donor. Counting `drizzle/migrations/*.sql` directly gives **60** for the base and
**56** for each donor. Both are defensible — the smaller figures look like
`drizzle/meta` journal entries or a subdirectory, the larger like raw migration files.
The conclusion is unaffected either way, but the row should say which artefact it
counts, because "the donor has more migrations" and "the base has more migrations" are
opposite readings of the same tree, and a later phase may act on it.

---

## 4. Secret scanning — supplementary

Pattern scan of `russell-capital-systems` for OpenAI-style keys (`sk-…`), AWS access
key IDs (`AKIA…`) and PEM private-key headers:

| Check | Result |
|---|---|
| Files matching hard secret patterns | **0** |
| `.env` files committed | **0** |

Clean. Two notes:

- `deploy-branch.yml` embeds a Railway **service ID** and **environment ID** in plain
  text. These are identifiers rather than credentials and are not independently
  exploitable, but they name production infrastructure in a public repository. Worth a
  conscious decision, not an emergency.
- One stray build artefact is tracked:
  `node_modules/.vite/vitest/…/results.json`. `.gitignore` covers
  `Patent360/client/node_modules/` but has no general `node_modules/` rule.

**GitHub secret scanning with push protection is the highest-value remaining item and
cannot be enabled from a PR — it is a repository setting.**

---

## 5. What this addendum does not change

- No application code.
- No CI file. The `deploy-branch.yml` hazard is **reported, not patched.**
- No route, registry, manifest or test.
- No conclusion of `FOUNDATION.md` or `ADDENDUM-01`.
