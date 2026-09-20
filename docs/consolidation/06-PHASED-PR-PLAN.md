# 6 — Phased PR Plan

**Compiled:** 2026-09-20

One bounded capability per pull request. Each entry below gives source paths,
target paths, test criteria and a rollback. **Every PR targets
`consolidation/main`, not `master`** — merging to `master` deploys to
production (document 05 §5.5).

**Universal entry criteria.** No PR opens until the one before it is green.
**Universal exit criteria**, in addition to whatever the PR names:

```
pnpm install --frozen-lockfile   exit 0
pnpm check                       exit 0, 0 errors
pnpm build                       exit 0, ≥330 route patterns
pnpm test:ci                     exit 0, ≥194 files, ≥3757 tests
gitleaks                         no findings
```

**Universal rollback:** `git revert -m 1 <merge-sha>` on
`consolidation/main`, then re-run the baseline in document 03 §3.8 and
confirm all seven numbers match.

**Universal rule for donor code:** strip `@ts-nocheck` from anything imported
and fix what it reveals. The donor repositories use it widely; a file carrying
it typechecks trivially while hiding real errors.

---

## Phase 0 — Foundation *(this PR)*

**Branch:** `claude/consolidation-foundation` → `master`

Documentation, one additive test, one CI workflow. **No application code.**

| Adds | |
|---|---|
| `docs/consolidation/01-INVENTORY.md` … `06-PHASED-PR-PLAN.md` | The six required documents |
| `docs/consolidation/*.json`, `*.txt` | Machine-readable collision and dependency artifacts |
| `server/navigation-route-integrity.test.ts` | New guard. 5 tests, passing |
| `.github/workflows/consolidation-ci.yml` | Build, secret scanning, registry integrity, regression floor |

Modifies no existing test, registry, engine or page.

**Exit:** universal criteria, plus the new guard passing (verified: 5/5) and
the registry suites passing together (verified: 5 files, 52 tests).

**Rollback:** revert. Nothing in the application depends on it.

---

## Phase 1 — Correct what is already broken

### PR-1 · Two dead navigation links

**Problem.** `/portal/tool-explorer` and `/portal/knowledge-library` are in
the sidebar, are not routed, and are not in the manifest. They 404. The live
equivalents are `/portal/explore` and `/portal/knowledge`.

**Two options — pick one, do not do both:**

- **(a) Point the navigation at the real routes.** Smallest change. Requires
  editing `navigation-organization.test.ts`, which asserts the broken paths —
  permitted under the mandate because this document plus document 03 §3.7.1
  is the required comparison and the regression proof.
- **(b) Add `/portal/tool-explorer` and `/portal/knowledge-library` as routes**
  aliasing the existing pages. No test changes, but two more routes for the
  same two destinations.

**Recommendation: (a).** Fewer routes, fewer aliases, and the assertion was
wrong rather than the code.

| | |
|---|---|
| **Source** | — |
| **Target** | `client/src/components/AppShell.tsx`, `server/navigation-organization.test.ts`, `server/navigation-route-integrity.test.ts` (remove both `KNOWN_BROKEN` entries) |
| **Tests** | Universal. Both exemptions removed and the guard still green. Manual: click both menu items, confirm they land. |
| **Rollback** | Revert. Returns to two broken links — no worse than today. |

### PR-2 · Rehabilitate the existing session branch

`claude/russell-capital-consolidation-xdzwc1` carries three commits of
application code written before this mandate: Plastic to Cash, the Carrier
Desk, and a navigation restructure. It typechecks clean but is **4 tests red**
(document 03 §3.7).

**Split it into three PRs, smallest first:**

| | Content | Risk |
|---|---|---|
| **PR-2a** | `shared/plasticToCash.ts` + `client/src/pages/portal/PlasticToCash.tsx` + route, manifest and catalogue rows | Low — new files, one route |
| **PR-2b** | `shared/mutualCarrierIntel.ts` + `MutualCarriers.tsx` + registrations, **plus** the `shared/mutualIulCarriers.ts` Nationwide ownership correction (SEC-sourced) | Low — one additive field correction |
| **PR-2c** | The `AppShell.tsx` restructure | **This is the one that is red.** Must not rename `"New Client Welcome List"` or `"Secondary Information"` without updating their assertions and documenting why; must keep `SECONDARY_CATALOG` paths out of the primary sidebar; must add hand ratings to `shared/pageRatings.ts` for any new `featured: true` catalogue row. |

**Do not merge 2c until its four failures are fixed in the code, not the
assertions** — the invariants are real.

---

## Phase 2 — The four unblocking components

**This is the highest-leverage PR in the programme.** 147 of the 391 donor
pages are blocked on five components, and four of them unblock effectively all
of it. Nothing in Phase 4 is worth starting first.

### PR-3 · Port `ProjectionChart50yr` and `CalculatorIntegration`

| | |
|---|---|
| **Source** | `russell-capital/client/src/components/ProjectionChart50yr.tsx` (unblocks 122 pages), `.../CalculatorIntegration.tsx` (unblocks 113) |
| **Target** | `russell-capital-systems/client/src/components/` |
| **Tests** | Universal, plus a new `server/consolidation-components.test.ts` that imports each module and asserts it renders with representative props. Confirm `recharts` is already a dependency (it is). |
| **Rollback** | Revert. Nothing imports them yet — Phase 4 has not started. |

**Watch for:** these are the two most widely-imported components in the donor,
so they are the most likely to drag transitive dependencies. Resolve each
against the target's existing components rather than importing a second copy
of something already present.

### PR-4 · Port `CalculatorPDFExport` and `ComboPageWrapper`

Unblocks 27 and 8 pages. `pdfkit` is already a target dependency. Same shape
as PR-3.

**`NeuralMeshInterceptor` is not ported.** It blocks one page, and in the
donor it mounts once in `AppShell` and auto-wires every route into a data bus,
AI brain and client context — a platform-wide behaviour change to unblock a
single page. Adapt that page or defer it.

---

## Phase 3 — The three donor-only engines

### PR-5 · `familyTreeFinancialEngine`, `complianceDocGeneratorEngine`, `multiCurrencyWealthEngine`

| | |
|---|---|
| **Source** | `russell-capital/shared/{familyTreeFinancialEngine,complianceDocGeneratorEngine,multiCurrencyWealthEngine}.ts` (221 / 178 / 159 LOC) |
| **Target** | `russell-capital-systems/shared/` |
| **Tests** | Universal, plus one `*.test.ts` per engine asserting known inputs → known outputs. **These arrive with no test coverage — the donor has no equivalent of the target's 225-file suite.** |
| **Rollback** | Revert. No page imports them yet. |

**Not in this PR:** `clientOnboardingEngine.ts`. The target already has
`assessmentBridge.ts`, `clientFactFinder.ts` and `journeyEngine.ts` covering
adjacent ground. Importing it without resolving the overlap creates a second
onboarding path. Needs its own comparison first.

**Never:** `shared/accessControl.ts`. The donor's is larger (104 vs 29 LOC)
and that is not an argument. It is authorisation code, and the donor carries
four parallel privileged-access environment variables.

---

## Phase 4 — Pages, by capability area

Only after Phases 2 and 3 are green. **One capability area per PR**, roughly
15–30 routes each, ordered lowest-risk first. Full list in
`donor-routes-clean.txt` and `donor-routes-blocked.txt`.

| PR | Area | Approx. routes | Notes |
|---|---|---|---|
| PR-6 | Advanced estate and trusts | ~30 | Cleanest dependencies. Proves the pattern. |
| PR-7 | Alternatives and private markets | ~25 | |
| PR-8 | Advanced markets (PPLI, split-dollar, exec benefits) | ~20 | |
| PR-9 | Tax — advanced and international | ~25 | |
| PR-10 | Retirement, Medicare, survivor | ~15 | |
| PR-11 | Family office and multi-generational | ~12 | |
| PR-12 | Practice operations | ~30 | **Highest risk in Phase 4** — webhooks, HubSpot, Slack, email campaigns all touch integrations and credentials. Split further if it does not stay bounded. |
| PR-13 | Remainder | balance | |

**Per-PR requirements, every time:**

1. Route in `App.tsx` **and** path in `shared/routeManifest.ts` — the smoke
   tests fail on either alone, by design.
2. A `shared/calculatorCatalog.ts` row if it is a calculator; a
   `shared/pageRatings.ts` hand rating if `featured: true`.
3. A navigation entry, or a documented reason it is deliberately not in the
   menu.
4. **Check every `trpc.*` call against the target router.** A donor page
   calling a procedure the target does not expose fails at runtime, not at
   import — this is the most likely source of surprise in Phase 4.
5. `@ts-nocheck` stripped and the resulting errors fixed.
6. A module-load smoke test at minimum.

**Rollback per PR:** revert; the routes disappear and nothing else references
them.

---

## Phase 5 — Contested routes

### PR-14 onward · The ~20 donor-favouring collisions

**One route per PR.** Each needs both implementations read and the difference
stated in the PR body. Size is a screening signal, never the decision.

Order by gap (document 04 §4.3):

| Route | Donor | Target | Note |
|---|---|---|---|
| `/portal/carrier-ratings` | 1,713 | 94 | Resolve the `/carrier-rates` duplicate in the same PR — one path survives, the other is dropped, not aliased |
| `/portal/legal-payment-folder` | 1,198 | 29 | |
| `/portal/ai-meeting-notes` | 1,046 | 31 | |
| `/portal/billing` | 987 | 25 | **Touches Stripe. Sensitive. Not a swap — evaluate on its own, last or never.** |
| `/portal/ai-brain-hub` | 495 | 178 | |
| `/portal/myga-waterfall` | 299 | 126 | Resolve alongside `/portal/myga-fixed-rate` or the result is two MYGA pages |
| remainder | | | Gaps under ~30 LOC: target wins on incumbency, no review needed |

---

## Phase 6 — Approved donations from the second donor

### PR-N · The 18 gamification routes

**Source:** `russell-capital-app`. **Check each against the collision report
first** — several of those names already exist in the target's routes.

Carries the donor's known defects (document 01 §1.2). Import nothing from
`calendarService.ts` or `engine_montecarlo.ts`.

### PR-N+1 · Sacred Seven

**Source:** `russell-capital`. Note the target **already has** `/portal/the-arrival`,
`/the-mirror`, `/the-field`, `/the-map`, `/the-strategy-table`, `/the-legacy`
and `/the-brotherhood` routed. This is therefore a **collision review**, not
an import — Phase 5 rules apply.

---

## Deferred — needs separate approval, not in any PR above

| Item | Why deferred |
|---|---|
| **Behavioral schema** (15 tables, `Calibrate-System`) | A database change. Genuinely novel — breathing telemetry, hesitation-as-signal, versioned genome, chaptered vision boards — and worth doing. Needs its own migration plan and a rollback tested against a copy. |
| **Postgres migration** | `russell-capital-app` is on Postgres; the target is on MySQL. Reference pattern only. No migration proposed. |
| **Breaking the Manus vendor lock** | `_core/llm.ts`, `imageGeneration.ts`, `voiceTranscription.ts`, `dataApi.ts` all route through one vendor with a hardcoded model. Worth fixing; unrelated to consolidation. |
| **Real data sources** (IRS, SSA, Treasury/FRED, Plaid, Morningstar) | Every tax bracket, Social Security figure and carrier rate in the target is a hardcoded constant. Separate programme. |
| **Deleting the stale `CNAME`** | In `russell-capital-domain-redirect`. One-line deletion, but DNS-adjacent and therefore excluded. |
| **`deploy-branch.yml` gating** | Deployment change. Document 05 §5.5. |
| **Rotating the three burned keys** | Credential handling, excluded by mandate. `scripts/DEPLOY.md` line 45. |

---

## Sequencing at a glance

```
Phase 0  Foundation ....................... this PR
Phase 1  PR-1  dead nav links
         PR-2a Plastic to Cash
         PR-2b Carrier Desk + Nationwide correction
         PR-2c AppShell restructure ....... RED until fixed
Phase 2  PR-3  ProjectionChart50yr + CalculatorIntegration   ← unblocks 147
         PR-4  CalculatorPDFExport + ComboPageWrapper
Phase 3  PR-5  three donor-only engines
Phase 4  PR-6..PR-13  391 pages by capability area
Phase 5  PR-14+  ~20 contested routes, one per PR
Phase 6  gamification routes, Sacred Seven review
```

No phase starts until the one before it is green. No promotion from
`consolidation/main` to `master`, and therefore no production deployment,
without separate explicit approval.
