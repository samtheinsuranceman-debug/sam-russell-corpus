# Addendum 01 — Closing four open items in FOUNDATION.md

**Date:** 2026-09-20
**Builds on:** `FOUNDATION.md`, `REPOSITORY-INVENTORY.md`, `MIGRATION-PRS.md` (commits `0ad79f3`, `5da9050`)
**Scope:** documentation only. No application code, no CI change, no registry touched.

`FOUNDATION.md` was written in a session where `russell-capital-app` could not be
attached, and left several items explicitly open. This session has that repo
attached and cloned, plus the base's own `docs/audit/` corpus. This addendum
closes four of those items and raises one new hazard that neither session could
have seen alone.

It **confirms, and does not contest,** FOUNDATION.md's conclusions: the base is
canonical, the base wins by default, and no collision is resolved by import.

---

## 1. RESOLVED — "Gamification (18 routes): UNRESOLVED — cannot assess"

> FOUNDATION.md §2: *"`russell-capital-app` not attached."*
> §1.1: *"Its 18 routes are **not** inventoried below and must not be assumed."*

`russell-capital-app` is attached and cloned this session (`ef74f3f`). Measured
directly against all three trees:

### 1.1 `russell-capital-app` contains **zero** gamification pages

The directive assigns it as the gamification donor. It is not one. All 17
identifiable gamification pages live in **`russell-capital`**.

### 1.2 Eight of the seventeen are already on the base

| Page | Base | `russell-capital-app` | `russell-capital` |
|---|:--:|:--:|:--:|
| Arena | ✅ | — | ✅ |
| BlackMirror | ✅ | — | ✅ |
| Endgame | ✅ | — | ✅ |
| InfiniteScroll | ✅ | — | ✅ |
| PetSystem | ✅ | — | ✅ |
| RewardsVault | ✅ | — | ✅ |
| SocialNarcotic | ✅ | — | ✅ |
| ToiletDashboard | ✅ | — | ✅ |
| EliteShowdown | — | — | ✅ |
| EntrainmentEngine | — | — | ✅ |
| GamifiedPavlovianEngagement | — | — | ✅ |
| HolographicMirage | — | — | ✅ |
| MoatFortress | — | — | ✅ |
| PredictiveInsightArena | — | — | ✅ |
| StrategyComparisonArena | — | — | ✅ |
| WealthOdyssey | — | — | ✅ |
| WealthWarriorChallenges | — | — | ✅ |

**Net: 9 pages to migrate, not 18, and from `russell-capital`.**

The directive says 18; 17 are identifiable by name. If an 18th is intended, name
it and it will be added.

### 1.3 A verdict that should be surfaced before migrating them

`sam-russell-corpus/russell-capital/CONSOLIDATION_PLAN.json` — a 687-row scored
audit — marks exactly these 17 pages `Verdict: CUT`, tier
`CUT — Gamification/Novelty`. That set matches, name for name, the 17 above.

The base's absence of nine of them is therefore **the result of that plan being
executed**, not drift. Importing them is an owner override of a recorded verdict.
That is entirely legitimate — it is your product — but it should be a deliberate
choice, not an accident of a migration list.

**Recommendation:** import the 9 gated as **L3 / Lab**, out of primary navigation.
All nine grade under 3.5 (§3). Placing them in primary nav would be a second,
separate decision.

### 1.4 What `russell-capital-app` is genuinely good for

Its real value is the other half of its assigned role: the **MySQL → PostgreSQL
port** (`drizzle-orm/postgres-js`, Aiven PG 17), `api/index.ts`, `vercel.json`,
and `DEPLOY_NOTES.md` with verified smoke tests.

**As reference, not as import.** The base deploys on **Railway** via the
`deploy/rcs` subtree. Importing `vercel.json` or a serverless entry point would
introduce a second, conflicting deploy path into a repo the directive says not to
re-host.

---

## 2. RESOLVED — the unexplained "391 vs 399" gap

> FOUNDATION.md §4.1: *"The gap is 8 and is not yet explained... The 399 list in
> this directory is the authoritative one until someone reconciles it against
> wherever 391 came from."*

**391 comes from the base's own audit**, at
`russell-capital-systems/docs/audit/MASTER_BUILD_AND_STRATEGY.md:48`:

> *"229 routes shared · **392 only in the 688 build** · 91 only in the trunk. Of the
> **391 routed** 688-only pages, 77 carry a blocking defect. Of the 314 clean ones,
> exactly one scores ≥ 7 (`ClientReportGenerator`, 7.7); five score 3.5–5; 308
> score under 3.5."*

So:

- **392** = donor-only routes at trunk SHA `af613fc0`
- **391** = of those, the ones that are *routed* (one is registered but unreachable)
- **399** = FOUNDATION.md's count at `76ed5f2`, by a different parser
- **393** = this session's count at `76ed5f2`, parsing `<Route path="…">` from `App.tsx`

The spread is branch movement plus parser differences on parameterised and
non-portal routes. **391 / 392 / 393 / 399 are the same set.** Nothing is missing
and nothing needs reconciling beyond noting the measurement basis.

**Recommendation:** keep `donor_only.txt` (399) as the operational list — it is
the superset and the safest. Cite the basis when quoting a number.

---

## 3. NEW — the 399 candidates are already graded, and 389 of them fail

FOUNDATION.md §4 lists the 399 without value grades. The base ships those grades:
`docs/audit/PLAN_RECONCILIATION.csv` (687 rows) reconciles
`CONSOLIDATION_PLAN.json`'s scores against measured values per page.

Joining it to the donor-only route set (390 of 393 matched; 3 ungraded):

| Measured value | Pages |
|---|---:|
| 9–10 | **0** |
| 7–8.9 | **1** |
| 5–6.9 | 0 |
| 3.5–4.9 | 5 |
| **under 3.5** | **384** |
| *(ungraded)* | 3 |
| **`defective = true`** | **77** |

| Disposition | Pages |
|---|---:|
| UPGRADE or fold into library | 320 |
| FIX FIRST | 64 |
| EMBED | 6 |

**Exactly one candidate clears a 7:** `ClientReportGenerator`
(`/portal/client-report-gen`, **7.7**). The next best scores **4.0**.

This reproduces `MASTER_BUILD_AND_STRATEGY.md` independently and to the page,
from a separate join. Its conclusion holds: *"the warehouse is nearly empty of
parts worth taking."*

Full table with per-page component, score, defect flag, disposition and flags:
**`import_candidates_graded.csv`** (this directory).

### 3.1 Why this matters for sequencing

It collapses the migration surface from 399 to roughly **10**:

| Tier | Pages | Action |
|---|---:|---|
| Import now | **1** | `ClientReportGenerator` (7.7) |
| Import gated as L3/Lab | **9** | the gamification pages (§1.2) |
| Fix first, then reconsider | 77 | `defective = true` |
| Leave in the warehouse | ~306 | under 3.5, no blocking defect |
| Grade before deciding | 3 | ungraded |

### 3.2 The defect classes that travel with an unrepaired import

From `MASTER_BUILD_AND_STRATEGY.md` §3, across all 688 donor pages:

| Pages | Defect |
|---:|---|
| 629 | `@ts-nocheck` |
| 120 | invented constants labelled *Simplified* / *Assumed* standing in for real IRS or product limits |
| 68 | chart fed a literal array — decorative, not computed |
| **64** | **reads a variable that is never declared** — silently falls back to a fixed number and ignores user input |
| **48** | **chart `useMemo` with empty deps** — the graph never moves when inputs change |

The last two are **silent wrong-answer** classes: the page renders, looks right,
and ignores the user. The base scans **0** undeclared-variable pages — that defect
class belongs to the donor's template generator alone. Importing unrepaired donor
pages reintroduces a class the base has fully eliminated.

This is the concrete mechanism behind FOUNDATION.md's rule that no collision is
resolved by import.

---

## 4. NEW — `audit/route_manifest.json` is stale by 98 routes

`russell-capital-systems/audit/route_manifest.json` reports `route_count: 232`.
The live count is **330** — confirmed three ways at `76ed5f2`:

- `shared/routeManifest.ts` — 330 entries
- `dist/public/routes.json` — 330 patterns, emitted by `pnpm build` this session
- FOUNDATION.md §4 — 330

Every one of the 232 appears in the 330; **98 are missing from the audit copy**.
`shared/routeManifest.ts` is correct and authoritative; the audit JSON is a stale
snapshot.

`scripts/reconcile-route-manifest.mjs` already exists to regenerate it.

**Recommendation:** refresh it as its own tiny PR before anything reads it. The
diff should be purely additive — 98 added, 0 removed. Anything removed means a
route was lost and the PR should stop.

---

## 5. NEW HAZARD — four parallel implementations of the same two engines

Neither session could have seen this alone. `russell-capital` currently carries
**at least five open `claude/russell-capital-consolidation-*` branches**, several
of which independently built the same owner request under different filenames:

| Donor branch | Plastic-to-Cash module | Mutual-carrier module |
|---|---|---|
| `…-55copu` | `shared/plasticToCashEngine.ts` | `shared/mutualCarriers.ts` |
| `…-a5bkso` | `shared/plasticToCash.ts` | `shared/mutualCarriers.ts` |
| `…-ejld7g` | `shared/plasticToCashEngine.ts` | — |
| `…-afwmka` | — | `shared/mutualIulCarriers.ts` |
| *(per FOUNDATION.md §2.1)* | `plasticToLiquidEngine.ts` | `creditCardSequencingEngine.ts` |

**Consequences for the plan as written:**

1. FOUNDATION.md §2.1 lists `plasticToLiquidEngine.ts` and
   `creditCardSequencingEngine.ts` as donor-only additive candidates. They are one
   of **at least four** competing implementations — not the only one.
2. "Migrate the plastic-to-cash engine from the donor" is **ambiguous**. It does
   not name a single artifact.
3. A `shared/`-level sweep across donor branches would import several of them at
   once, under different names, all live.

**Recommendation:** before any of these migrate, pick **one** implementation by
explicit decision, record it in the capability matrix by **branch + path + SHA**,
and close the others. This is a naming-and-ownership decision, not a code one —
but it must happen before PR-2 of either plan, or the base inherits four engines
where it needs one.

### 5.1 The domain caveat, confirmed independently

FOUNDATION.md §2.1 flags that these engines relate to *"a strategy whose stated
mechanics were found to be materially wrong (see `IUL-MECHANICS-REVIEW.md`)."*

Confirmed independently this session. The core correction is that the mechanism is
a **participating (indexed) policy loan**, not a withdrawal:

- A **withdrawal / partial surrender permanently reduces the account value**, and
  the reduced balance is what receives future credits. Money taken out stops earning.
- A **participating loan** is lent by the carrier from its own general account
  against the policy; the cash value **never leaves the index strategy** and keeps
  receiving credits in full. That is the real engine, and it is standard.

Two further items any implementation must carry:

- **Arbitrage is bidirectional.** A 0% credit year against a 5–6% loan charge is
  **negative** arbitrage and net values fall. The floor protects against *market*
  loss, not *loan cost*. No implementation may present an expected case without a
  stress case.
- **The credit-card premise is unverified.** No public source confirms any carrier
  accepts recurring credit-card premium at scale as a *purchase* rather than a
  *cash advance*; the public record indicates most decline cards for ongoing
  premium. Any implementation must gate that claim behind an explicit verification
  flag and exclude unverified data from client-facing exports.

**Whichever implementation is chosen must be checked against these three points
before it migrates**, regardless of which branch it came from.

---

## 6. Suggested amendments to the existing docs

Small, surgical — offered rather than applied, since these are another author's
documents:

| Doc | Line / section | Amendment |
|---|---|---|
| `FOUNDATION.md` | §2, "Gamification (18 routes) — UNRESOLVED" | → **RESOLVED**: 9 pages, donor is `russell-capital`, 8 already on base. See Addendum §1. |
| `FOUNDATION.md` | §1.1, `russell-capital-app` row | → attached this session; contains **0** gamification routes; value is the Postgres port, as reference only. |
| `FOUNDATION.md` | §4.1, "the gap is 8 and is not yet explained" | → **RESOLVED**: 391 originates at `docs/audit/MASTER_BUILD_AND_STRATEGY.md:48`. See Addendum §2. |
| `FOUNDATION.md` | §4, the 399 table | → add the grades: 1 page ≥ 7, 77 defective, 384 under 3.5. See Addendum §3. |
| `MIGRATION-PRS.md` | phase ordering | → insert a one-file PR refreshing `audit/route_manifest.json` (§4), and a decision step resolving the four parallel engines (§5) before any of them migrate. |

## 7. One CI suggestion

FOUNDATION.md §5.1 step 6 scans for high-entropy keys by regex — and that scan
already earned its place by finding the plaintext access codes in the donor's
`shared/identityVerification.ts:110`.

Regex sets miss provider formats as they change. **Suggestion:** add `gitleaks`
alongside it (not instead of it) — maintained rule packs, and on pull requests
fetch full history so a secret added mid-branch is caught even when a later commit
removes it. Roughly fifteen lines. Not added here, since `consolidation-ci.yml` is
another author's file and the directive requires a documented comparison before
changing existing CI. This is that comparison; the change is yours to take or leave.
