# 4 — Route Collision & Dependency Report for the Proposed 391 Pages

**Date:** 2026-09-20
**Base:** `sam-russell-corpus/russell-capital-systems` @ `76ed5f2` — 330 route patterns
**Migration source:** `russell-capital` @ `863b3f0` — 620 route patterns
**Appendices:** `APPENDIX_A_391_ROUTES.md` (all 391, enumerated) ·
`APPENDIX_B_DEPENDENCIES.md` (full closure)

---

## 4.1 Where the number 391 comes from

The figure reconciles exactly, and it is worth stating precisely because it defines the scope
of every migration PR that follows:

> **391 = the route paths registered in `russell-capital` that do not exist in the canonical base.**

```
russell-capital route patterns           620
sam-russell-corpus route patterns        330
  paths in both (collision set)          229
  paths in live only  → THE 391          391      620 − 229 = 391  ✓
  paths in base only                     101      330 − 229 = 101
```

If all 391 migrate, the base goes from **330 → 721** route patterns.

---

## 4.2 Collision findings — the headline

| Check | Result |
|---|---|
| **Path collisions among the 391 against the base** | **0** |
| Path collisions among the 41 consolidation hubs (APP) | **0** |
| Path collisions among the 9 engagement pages (LIVE) | **0** |
| Duplicate paths *within* the 391 | 0 — the set is deduplicated |
| Paths in both base and live (**not** part of the 391) | **229** |

**All 391 are additive.** Not one of them overwrites, shadows, or re-points a route the base
already serves. This is the single most important finding in this report: the migration cannot
silently change the behaviour of an existing base route, because there is no overlap.

The **229 overlapping paths are explicitly excluded** from the 391 and from every migration PR.
Per the capability matrix §2.7, all 229 resolve to the base and are not touched. If any one of
them should instead resolve to the live implementation, that is a matrix decision and gets its
own PR with a side-by-side comparison — never a bulk action.

### Route shape
All 391 are under `/portal/*`. None is a top-level or marketing route, so none can affect the
public site's entry points, SEO surface, or unauthenticated paths.

### Resolution
390 of 391 resolve to a concrete page file. **One does not** — a dynamic or
programmatically-registered route that the static extractor could not bind to a component. It is
marked in Appendix A and is deferred out of PR-7 until identified by hand.

---

## 4.3 Dependency closure

The full import graph of all 391 pages was walked against the base — `@/…`, `@shared/…` and
relative specifiers, transitively.

```
files walked in the closure                 543
already present in the canonical base       107
absent from the base → must migrate         436
  ├── page files                            387
  └── non-page dependencies                  49
```

The 49 non-page dependencies are the real integration surface:

| Layer | Count | Notes |
|---|---:|---|
| Components | 31 | Shared UI used by the migrating pages |
| **Shared engines** | **4** | The complete shared-layer gap — see below |
| Contexts | 2 | Client-data / calculator-results providers |
| Lib | 1 | |
| Data / other | 11 | Static catalogues and helpers |

**The four shared engines are the entire engine-layer gap between the two builds:**

- `shared/clientOnboardingEngine.ts`
- `shared/complianceDocGeneratorEngine.ts`
- `shared/familyTreeFinancialEngine.ts`
- `shared/multiCurrencyWealthEngine.ts`

**Zero unresolvable imports.** Every specifier reachable from the 391 resolves either to a file
already in the base or to one of the 436 listed for migration. Nothing dangles, and nothing
requires a dependency the base cannot satisfy.

---

## 4.4 Risk assessment

| Risk | Severity | Finding |
|---|---|---|
| Route shadowing / behaviour change | **None** | 0 collisions across all 391 |
| Engine-layer conflict | **Low** | Only 4 engines to add; no existing engine replaced |
| Schema conflict | **Low** | 7 additive tables; no column or table altered |
| Registry overwrite | **None by design** | Route/engine/calculator registries are additive-only; manifest diff reviewed per PR |
| Test regression | **Controlled** | Base is 194/194 green; every PR must hold that and add its own tests |
| Dialect mismatch (MySQL vs Postgres) | **High if unmanaged** | Base and live are both MySQL. APP is Postgres. **Excluded from every PR in document 6.** |
| Bundle-size growth | **Medium** | +391 lazy routes. Base already code-splits; watch `routes.json` and chunk report per phase |
| The one unresolved route | **Low** | Identified, deferred, not silently migrated |

---

## 4.5 What makes each migration PR reviewable

Because the base emits `dist/public/routes.json` at build time, every migration PR carries an
objective artifact:

```bash
git show master:dist/public/routes.json > /tmp/before.json   # or rebuild master
pnpm build
diff <(jq -S . /tmp/before.json) <(jq -S . dist/public/routes.json)
```

The reviewer's rule is simple and mechanical: **the diff must be additions only.** A removed or
re-pointed pattern fails the PR. That check is wired into CI (document 5) so it cannot be
forgotten.
