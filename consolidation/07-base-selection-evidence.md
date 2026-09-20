# 7 — Base selection: the evidence

Added 2026-09-20 in response to the proposal that `russell-capital-app` become the
consolidation base, and that `russell-capital-domain-redirect` is the current live repo.

> **DECIDED 2026-09-20 by the owner, on this evidence:**
> **1.** `russell-capital-systems` remains the base. `navTree.ts` is ported from
> `russell-capital-app` as **PR-2b** (§6).
> **2.** The live-repo reading is accepted as recorded in §7.1 — the apex is a GitHub Pages
> redirect (inferred), the `www` application is `russell-capital-systems` (verified). The
> redirect repository is not a consolidation target and needs no further confirmation.

Both claims were tested rather than assumed. One is correct, one is not, and one of the
supporting arguments for `russell-capital-app` is correct and worth acting on.

---

## 7.1 "Current live repo: `russell-capital-domain-redirect`" — correct for the apex

DNS, 2026-09-20:

| Hostname | Resolves to | Platform |
|---|---|---|
| `russellcapitalsystems.com` (apex) | `185.199.108–111.153` | **GitHub Pages** |
| `www.russellcapitalsystems.com` | `tjkj8nc5.up.railway.app` | **Railway** |

`185.199.108–111.153` is GitHub Pages' published apex range. A repository named
`russell-capital-domain-redirect` serving that apex is entirely consistent with this, and
**"do not merge the platform into it" is right** — a redirect shim is not an application host.

*Caveat, stated plainly:* access to that repository was declined, and outbound requests to
`russellcapitalsystems.com` are blocked by this environment's egress proxy, so the Pages
source was **not** confirmed by direct inspection. The apex is GitHub Pages; which repo
publishes it is inferred, not verified.

**The `www` host is a separate fact and is verified:** Railway service
`e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28`, config `source.repo = samtheinsuranceman-debug/sam-russell-corpus`,
`rootDirectory = russell-capital-systems`, last deploy SUCCESS 2026-09-18.

So "the live repo" has two answers. The **apex redirect** is one repo; the **application** is
`russell-capital-systems`. Both statements can be true at once, and the consolidation base is
a question about the second one.

---

## 7.2 The five arguments for `russell-capital-app`, tested

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Shared calculator-data layer | **Incorrect** | `russell-capital-app/shared/` contains **no** calculator, catalog or registry module. The base has three: `calculatorCatalog.ts`, `journeyCatalog.ts`, `patentCatalog.ts` — the first two with their own test files. |
| 2 | Recursive navigation structure | **Correct, and genuinely better** | `client/src/navTree.ts`, 1058 lines. A true recursive `NavNode` (`children?: NavNode[]`), arbitrary depth, placeholder nodes, `collectPaths`/`flattenNavTree`, and React-free string icon tags resolved by the renderer. The base has a fixed three-level `Section → Subgroup → Item` and cannot nest further. **This is a real advantage.** |
| 3 | Consolidation manifest | **Correct, but the base has more** | The app has `CONSOLIDATION_PLAN.json` — a 300+ page scoring sheet, genuinely useful and already cited in §6/PR-5. The base has `shared/routeManifest.ts` (330 entries, **CI-enforced** by `grok-merge.smoke.test.ts`), `PARTS_MANIFEST.json` (1,073 files, SHA-256 verified) and `audit/route_manifest.json` (232 entries with per-page metrics). |
| 4 | API folder | **Correct, but not a capability** | `api/index.ts` is a Vercel serverless entry shim. It is deployment plumbing for a different host, not application capability. |
| 5 | Vercel configuration | **Correct, but not a capability** | `vercel.json` targets a host this platform does not currently use. |

**Two of five are real.** Claim 2 is a genuine architectural win. Claims 4–5 describe a
deployment target, not a platform.

---

## 7.3 The counter-evidence

### Scale

| | `russell-capital-app` | `russell-capital-systems` |
|---|---:|---:|
| `shared/` modules | 63 | **187** |
| `server/` modules (non-test) | 49 | **147** |
| Schema tables | 116 | **155** |
| tRPC namespaces | — | **150** |
| Test files | 97 | **216** |

The base holds `altCredit/` (a 10,000-run credit-cycle Monte Carlo), `householdGenome`,
`whispererEngine`, `sequencePlanner`, `mechanismDossiers`, `policyMechanics`, `irc7702`,
`zipEngine`, `careerEngine`, `liquidityRoutes`, `mortgageLedger` — **none of which exist in
`russell-capital-app`**.

### Gates, run under identical conditions (no `.env`, no database)

| Gate | `russell-capital-app` | `russell-capital-systems` |
|---|---|---|
| `pnpm install --frozen-lockfile` | ❌ **FAILS** — "the current `overrides` configuration doesn't match the value found in the lockfile" | ✅ exit 0 |
| `tsc --noEmit` | ✅ 0 errors | ✅ 0 errors |
| build | ✅ | ✅ |
| tests | ❌ **24 files failed, 111 tests failed**, 2030 passed | ✅ **0 failed, 4138 passed** |

The 111 failures break down as roughly 35 environmental (29 × `DB unavailable`, 6 ×
`ECONNREFUSED 127.0.0.1:3000`) and the remainder genuine assertion failures — `expected false
to be true`, `expected { valid: false, type: 'invalid' } to deeply equal { valid: true, type:
'eternal' }`, `promise resolved instead of rejecting`.

The distinction that matters is not that one codebase is broken. It is that **the base's suite
is CI-safe by construction** — its database-dependent tests self-skip — while the app's is
not. A consolidation base must be able to prove a regression, and a suite with 111 pre-existing
failures cannot: any new failure disappears into the noise.

A base whose lockfile does not install reproducibly also cannot give a reproducible build.

---

## 7.4 Recommendation

**Keep `russell-capital-systems` as the base, and port the one thing `russell-capital-app`
genuinely has that it lacks.**

The two proposals are not symmetrical in cost:

- **Porting `navTree.ts` into the base:** one file, ~1058 lines, plus a renderer change in
  `AppShell.tsx`. Additive. Testable against the existing 330-route manifest. Roughly one PR.
- **Flipping the base to `russell-capital-app`:** re-verifying 187 shared modules, 147 server
  modules, 150 tRPC namespaces and 155 tables against a codebase that has 63/49/116 and does
  not currently install reproducibly or test clean — and abandoning a 4138-test green
  baseline for one with 111 failures.

The first buys the recursive navigation. The second buys the same thing, plus a Vercel config,
at the cost of the platform's entire verified surface.

### Proposed amendment to §6

Add **PR-2b — recursive navigation**:

| Source | Target |
|---|---|
| `russell-capital-app/client/src/navTree.ts` | `russell-capital-systems/client/src/navTree.ts` |
| renderer changes in `AppShell.tsx` | same path |

Test criteria: standing gates; `collectPaths(MEDICAL_TREE)` must be a subset of
`ROUTE_MANIFEST` (every nav destination resolves); route counts unchanged at 330; nav
snapshot test. Rollback: revert — nav returns to the three-level structure.

If the Vercel/Postgres path is wanted later, `russell-capital-app`'s `DEPLOY_NOTES.md`
documents the MySQL→Postgres port table by table and is the reference for it. That is a
hosting decision, and out of scope here.

---

## 7.5 If the decision is to flip anyway

This document is evidence, not a veto. Should `russell-capital-app` be chosen as the base,
the plan changes as follows and the work is materially larger:

1. Fix its lockfile first — `pnpm install --no-frozen-lockfile`, commit, and re-verify.
2. Triage its 111 failing tests to zero, or the regression contract in §3.5 cannot exist.
3. Re-run §1–§6 of this foundation against the new base. The capability matrix inverts:
   **`russell-capital-systems` becomes the donor for 124 shared modules, 98 server modules,
   39 schema tables and 150 tRPC namespaces** — a far larger migration than the ~28 items
   plus selected pages that the current direction requires.
4. Decide the hosting question, since `russell-capital-app` targets Vercel/Postgres while the
   live `www` host is Railway/MySQL.
