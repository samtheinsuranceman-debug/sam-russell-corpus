# 02 — Authoritative Capability Matrix

**Foundation PR, deliverable 2 of 6.**

One chosen implementation per capability. This file is the tie-breaker for every
later migration PR: if a migration would replace something listed here as
**BASE**, it does not proceed without a documented comparison and regression
proof attached to that PR.

Machine-readable companion: `route-collisions.json`.

---

## 2.0 — THE DEFAULT RULE

**The base wins every collision unless a migration PR proves otherwise.**

This follows directly from the directive: the base is canonical, and the live
engine registry, calculator registry, route manifest and existing tests are not
to be overwritten without a documented comparison and regression proof.

A donor implementation may only replace a base implementation when its PR
carries all four of:

1. a side-by-side diff of both implementations,
2. a statement of what the donor does that the base does not,
3. the base's tests for that capability, passing against the donor code,
4. a rollback tag.

Absent any of those, the base implementation stands.

---

## 2.1 — INFRASTRUCTURE AND SHARED FOUNDATIONS

| Capability | Chosen | Location | Rationale |
|---|---|---|---|
| **Route manifest** | **BASE** | `shared/routeManifest.ts` (380 lines) | Named in the directive as not-to-overwrite. Emits 330 patterns at build time to `dist/public/routes.json`. Donors have no equivalent — they hardcode `<Route>` elements only. |
| **Page registry** | **BASE** | `docs/audit/pageRegistry.json` (309 entries) | Carries `route · title · hub · hubPath · value · surface · capabilities · trustworthy · integrityFlags`. No donor equivalent. This is already the capability matrix primitive for pages. |
| **Engine registry** | **BASE** | `shared/*Engine.ts` (54 modules) | Named in the directive. Donors have no comparable shared-engine layer. |
| **Shared module layer** | **BASE** | `shared/*.ts` (174 modules) | Superset of both donors. |
| **Wealth Genome / behavioral schema** | **BASE** | `shared/wealthGenome*.ts`, `householdGenome.ts`, `genomeStrateg*.ts` (6 modules) | **Exists only in the base.** Directive assigned this to `russell-capital`; that repo does not contain it. |
| **Sacred Seven** | **BASE** | `client/src/pages/portal/The*.tsx` (7/7) | Already present. Directive assigned this to `russell-capital`; no import needed. |
| **Build pipeline** | **BASE** | `scripts/build.mjs` + esbuild code splitting | Emits the route manifest as build output. Donors use stock Vite. |
| **Test suite** | **BASE** | 225 files, 4,138 passing | Named in the directive. See `03-VERIFICATION.md`. |
| **Owner auth (password + TOTP)** | **BASE** | `scripts/owner_password_hash.mjs`, `owner_totp_secret.mjs` | No donor equivalent. |
| **Backup / restore / schema export** | **BASE** | `db:backup`, `db:restore`, `db:schema` | No donor equivalent. |
| **Provenance + parts manifest** | **BASE** | `PROVENANCE.md`, `PARTS_MANIFEST.json` | Carries `source_sha256` + `reconstruction_verified`. |
| **Resonance breathing (6/min)** | **BASE** | `client/src/index.css`, `contexts/EntrainmentEngine.tsx` | Base cites the medical basis. Supersedes `russell-capital-app` (drifted to 8/min); matches `russell-capital`. |
| **Audit corpus** | **BASE** | `audit/` (26 artifacts) | Prior page audits, vitest runs, route smoke, colour-token inventory. |

---

## 2.2 — CAPABILITIES WHERE A DONOR IS CHOSEN

Only three. Each becomes its own migration PR.

| Capability | Chosen | Source | Scope | Risk |
|---|---|---|---|---|
| **Gamification pages** | **DONOR** `russell-capital-app` | `client/src/pages/portal/` | **9 page components + routes.** Base already has 8/17. | Low — additive, no base file replaced |
| **Postgres / Vercel deployment patterns** | **DONOR** `russell-capital-app` | `vercel.json`, `api/index.ts`, `server/db.ts` patterns | **Pattern reference only.** No credentials, no DB change, no deploy. | Medium — read-only study in Phase 4; nothing applied without separate approval |
| **`CONSOLIDATION_PLAN.json`** | **DONOR** `russell-capital-app` | repo root, 687 rows | Data file. Client story + discovery questions per page. Reference input to page selection. | None — data only, no code |

---

## 2.3 — ROUTE COLLISIONS: 236

This is the finding that most affects the plan.

| Measure | Count |
|---|---|
| Base routes | **330** |
| `russell-capital-app` routes | 631 |
| `russell-capital` routes | 622 |
| **Routes in BOTH base and app — same path, two implementations** | **236** |
| Routes in app but not base — importable | **395** |
| Routes in `russell-capital` not in base or app — importable | **1** |
| Full union if everything merged | 726 |

**The "391 pages" figure in the directive is within rounding of the 395
importable app routes.** But importable is not the same as safe: **236 routes
already exist in the base under the same path with a different implementation.**
A bulk import of the app donor would silently overwrite 236 base implementations,
including pages covered by the base's 225 test files.

**Ruling: all 236 collisions resolve to BASE by default.** None of them is a
migration candidate in this consolidation. Any individual collision may be
revisited later as its own PR under the four-point rule in §2.0.

Per-route detail, with the donor's file path and line count for each of the 236,
is in `route-collisions.json`.

---

## 2.4 — HOW TO USE THIS MATRIX IN A MIGRATION PR

Before opening any migration PR, answer these in its description:

1. Which row of this matrix does the change touch?
2. Does it replace anything marked **BASE**? If yes, attach all four items from §2.0.
3. Does it touch any of the 236 collision routes? If yes, name them and justify each.
4. Which of the base's 225 test files cover the affected capability, and do they
   still pass?
5. What is the rollback tag?

A migration PR that cannot answer 1–5 is not ready.
