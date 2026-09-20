# 04 — Route collisions and dependencies for the 391 pages

**Date:** 2026-09-20
**Live build:** 330 routes (`master`)
**Donor analysed:** `russell-capital` @ `claude/homepage-portrait-day-sign-5o0l9d`

---

## 1. Where the number 391 comes from — confirmed

The owner's figure of 391 is correct, and this is its derivation:

```
RCS-family donor routes (russell-capital ∪ russell-capital-app ∪ standalone)   631
  minus routes already present in the live build                              −237
  ─────────────────────────────────────────────────────────────────────────────
  routes not in live                                                           394
  all of which are /portal/* (zero public routes)                              394
  minus scaffolding routes with no shippable page                               −3
  ─────────────────────────────────────────────────────────────────────────────
  PROPOSED PAGES                                                               391  ✅
```

The three excluded scaffolding routes are `/portal/lab`,
`/portal/nav-placeholder` and `/portal/reveal-demo`. Each resolves to a
development harness rather than a product page, and none should be migrated.

**391 routes resolve to 390 distinct page component files** — one file serves
two routes.

---

## 2. Route collisions — none

By construction, all 391 are routes the live build does not declare, so there
is **no path collision with the live application**. Verified directly:

| Check | Result |
|---|---|
| Proposed routes already declared in live `App.tsx` | **0** |
| Proposed routes colliding with each other | **0** |
| Proposed routes shadowed by a live dynamic/param route | **0** (live has 5 param routes; none matches a proposed path) |

### 2.1 But the donors collide with *themselves*

Both Tier-B donors declare **41 routes twice in the same `App.tsx`**:

```
russell-capital           646 declarations → 605 unique  (41 duplicated)
russell-capital-app       653 declarations → 612 unique  (41 duplicated)
```

Identical pattern in both, including:
`/portal/529-vs-iul`, `/portal/amt-calculator`, `/portal/business-valuation`,
`/portal/buy-sell-funding`, `/portal/captive-iul`, `/portal/cash-balance-plan`,
`/portal/clt-engine`, `/portal/deferred-compensation`, `/portal/estate-flow`,
`/portal/estate-tax`, `/portal/existing-annuities`, `/portal/grat-calculator`
… and 29 more.

Under `wouter`'s `<Switch>` the first match wins and the second declaration is
dead code. **Any migration must de-duplicate at the source**, or the live build
inherits 41 unreachable route declarations. The live build's
`server/navReachability.test.ts` already fails on duplicate menu entries; an
equivalent assertion on `App.tsx` should be added in PR #1.

---

## 3. File collisions — 2, both trivial

Of the 390 donor page files behind the proposed routes:

| Outcome | Count |
|---|---:|
| **No collision** — new file, nothing overwritten | **388** |
| Collision — path already exists in live | **2** |
| …of which byte-identical | 0 |
| …of which differ | **2** |

| Colliding file | Live | Donor | Δ |
|---|---:|---:|---:|
| `client/src/pages/portal/ClientReportGenerator.tsx` | 72,864 | 72,846 | −18 |
| `client/src/pages/portal/ComboRecommender.tsx` | 11,195 | 11,327 | +132 |

Both deltas are negligible. **Verdict: keep the live version of both.** Neither
justifies an overwrite, and `ClientReportGenerator` is one of the 160
already-built-but-unreachable pages (see §5), so the live copy is the one the
menu work will expose.

**The migration is therefore 388 additive files and zero destructive writes.**

---

## 4. Dependencies — the real constraint

Page files do not import engines directly. They import **components**, and that
is where the blocking is.

| Import surface | Distinct specifiers present in live | Distinct MISSING from live |
|---|---:|---:|
| `@shared/*` | 0 | **0** |
| `@/components`, `@/contexts`, `@/hooks`, `@/lib`, `@/data` | 26 | **15** |

**The engine layer blocks nothing.** Not one of the 390 pages imports a
`@shared/` module the live build lacks — consistent with document 02's finding
that the engine layer is already consolidated.

### 4.1 The 15 missing dependencies, by blast radius

| Missing dependency | Pages blocked |
|---|---:|
| `@/components/CalculatorPDFExport` | **131** |
| `@/components/ProjectionChart50yr` | **122** |
| `@/components/CalculatorIntegration` | **116** |
| `@/components/StateTaxSelector` | **104** |
| `@/contexts/UnifiedDataBusContext` | **65** |
| `@/contexts/OrganismContext` | 11 |
| `@/components/ComboPageWrapper` | 8 |
| `@/hooks/useOrganismEyes` | 2 |
| `@/hooks/useOrganismNervousSystem` | 2 |
| `@/hooks/useOrganismSkeleton` | 2 |
| `@/hooks/useOrganismDeepIndex` | 1 |
| `@/hooks/useOrganism` | 1 |
| `@/components/NeuralMeshInterceptor` | 1 |
| `@/data/physicianSpecialtyDefaults` | 1 |
| `@/lib/toolSearchIndex` | 1 |

### 4.2 The split that defines the plan

```
pages importable TODAY with zero missing dependencies ......... 202
pages blocked on at least one missing component ............... 188
                                                               ────
                                                                390
```

**Five components unblock nearly everything.** `CalculatorPDFExport`,
`ProjectionChart50yr`, `CalculatorIntegration`, `StateTaxSelector` and
`UnifiedDataBusContext` together account for the blocking on the overwhelming
majority of the 188. Porting those five is a single, small, reviewable PR that
converts most of the remaining 188 into the "importable today" bucket.

The `Organism*` family (`OrganismContext` + 5 hooks + `NeuralMeshInterceptor`,
19 pages total) is a **separate subsystem**, not a component. It should be
evaluated on its own merits and is deliberately scheduled last.

---

## 5. The 160 pages that need no migration at all

Independent of the 391, the live build already contains **160 routes with no
menu entry** — built, routed, tested and unreachable. Plus **2 menu links that
404** (`/portal/knowledge-library`, `/portal/tool-explorer`).

```
routes registered in live App.tsx ........... 330
routes with a sidebar entry ................. 172
routes with NO sidebar entry ................ 160   ← 48% of the application
dead menu links (no matching route) ..........  2
```

**This must be fixed before any page is imported.** Two reasons:

1. A donor page that duplicates a hidden live page would be migrated as though
   the capability were missing, paying import cost for something that already
   exists and works.
2. Adding 391 pages to a menu that already hides 160 produces a 721-route
   application with 551 unreachable routes.

Reachability is PR #1. Nothing else starts until it lands.

---

## 6. Risk register

| # | Risk | Severity | Evidence | Mitigation |
|---|---|---|---|---|
| R1 | `accessControl.ts` divergence changes who can log in | **HIGH** | Disjoint APIs, both with tests (doc 02 §3.1) | Excluded from every migration PR; owner decision required |
| R2 | Importing hidden-page duplicates | **HIGH** | 160 unreachable live routes | PR #1 fixes reachability first |
| R3 | 41 duplicate route declarations inherited from donor | MEDIUM | Measured in both donors | De-duplicate at source; add an `App.tsx` duplicate assertion |
| R4 | Second IRR/NPV implementation | MEDIUM | Live has `irr`/`npv`/`pmt` in `realEstateDealModel.ts` | Harvest waterfall symbols only (doc 02 §3.2) |
| R5 | Schema tests excluded from CI mask a break | MEDIUM | `test:ci` excludes 22 files / 381 tests | Full `vitest run` as merge gate on every migration PR |
| R6 | `Organism*` subsystem pulled in unexamined | MEDIUM | 19 pages, 7 missing modules | Scheduled last, as its own PR |
| R7 | Bundle growth from +391 pages | LOW | Code-split; 402+ chunks today | Track `dist` size per PR |
| R8 | Overwriting `ClientReportGenerator` / `ComboRecommender` | LOW | 2 files, Δ ≤ 132 bytes | Keep live version of both |

---

## 7. Reproducing this analysis

```bash
# route sets
python3 - <<'EOF'
import re
live=set(re.findall(r'path="([^"]+)"',open('client/src/App.tsx').read()))
don =set(re.findall(r'path="([^"]+)"',open('/home/user/russell-capital/client/src/App.tsx').read()))
print('live',len(live),'donor',len(don),'new',len(don-live))
EOF

# duplicate declarations inside a donor
grep -o 'path="[^"]*"' /home/user/russell-capital/client/src/App.tsx \
  | sort | uniq -d | wc -l      # → 41
```
