# 6. Phased PR Plan

One bounded capability per PR, after this foundation PR is green.

**Standing constraints, every phase:** no DNS, domain, traffic, hosting, database,
or credential changes. No wholesale repository merges. No registry, schema, or test
replaced without a documented comparison and regression proof. Production
deployment requires separate explicit approval.

**Exit criteria, every PR:** `verify`, `route-manifest`, and `secret-scan` green;
test count strictly non-decreasing; `pre-` and `post-` tags pushed.

---

## Phase A — Harden the base (no donor code)

Do this before importing anything.

| PR | Change | Test criteria | Rollback |
|---|---|---|---|
| **A1** | Narrow the `test:ci` exclusion list. §3.5 proved the excluded suites skip rather than fail. | `pnpm test:ci` count rises toward 4138; 0 failures | Revert; one file |
| **A2** | Turn Gitleaks from `continue-on-error` to blocking, after triaging history | `secret-scan` green | Revert workflow |
| **A3** | Owner enables branch protection (§5.6) | Checks required on `master` | Settings toggle |

**Gate: A green before Phase B begins.**

---

## Phase B — Pages (394 routes, batched)

The bulk of the work. 382 of 394 are contested between donors, so this is mostly
*choosing*, not copying.

**B0 — the contested diff.** Before any page moves: byte-level diff of all 382
contested pages across both donors; classify identical / cosmetic / divergent.
Output is a table committed to `docs/consolidation/data/`. **No app code changes.**
This sizes B2–B4, which cannot be estimated before it runs.

| PR | Source → target | Size | Test criteria |
|---|---|---:|---|
| **B1** | 12 uncontested pages<br>`rc:client/src/pages/**` (9), `rc-app:client/src/pages/**` (3) → `russell-capital-systems/client/src/pages/**` | 12 | Each route in `App.tsx` **and** `routeManifest.ts`; `route-manifest` green; page renders in build output |
| **B2** | Contested, byte-identical between donors | from B0 | As B1 |
| **B3** | Contested, cosmetic differences only | from B0 | As B1 + diff attached to PR |
| **B4** | Contested, genuinely divergent | from B0 | As B1 + per-page comparison and rationale |
| **B5** | Pages depending on Phase C/D artifacts | from B0 | **Blocked** until C and D merge |

**Batch ceiling: 25 pages per PR.** Above that nobody reviews it.

Before B1, resolve `/portal/nav-placeholder` and `/portal/reveal-demo` (§4.4) —
confirm as real destinations or drop them.

---

## Phase C — The four missing engines

| PR | Source → target | Test criteria | Rollback |
|---|---|---|---|
| **C1** | `clientOnboardingEngine.ts` → `shared/` | Donor tests ported and passing; no existing test changes | Delete file, revert |
| **C2** | `familyTreeFinancialEngine.ts` → `shared/` | As C1 | As C1 |
| **C3** | `multiCurrencyWealthEngine.ts` → `shared/` | As C1 + currency rounding cases | As C1 |
| **C4** | `complianceDocGeneratorEngine.ts` → `shared/` | As C1 + **explicit compliance-output review** | As C1 |

Both donors carry identical copies; take whichever has tests, and say which in the
PR. These are **additive** — the 54-engine canonical registry is appended to, never
replaced.

C4 touches generated compliance documents. It gets its own review beyond CI.

---

## Phase D — Analytics/telemetry suite (rc-app's real contribution)

19 procedures (§2.5) plus the 7 tables they need (§4.5). One capability, sequenced
schema-first.

| PR | Change | Test criteria | Rollback |
|---|---|---|---|
| **D1** | 7 tables → `drizzle/schema.ts` + migration: `pagePerformanceMetrics`, `toolUsage`, `toolFavorites`, `engineUsageLogs`, `engineChains`, `engineChainRuns`, `clientReports` | Migration applies to an empty DB and is reversible; **additive only, no existing table altered** | Down-migration; tables unused until D2 |
| **D2** | Usage + performance + error procedures | Tests ported; existing 284 procedures untouched | Revert router change |
| **D3** | Content ranking: `popular`, `recent`, `trending` | As D2 | As D2 |
| **D4** | `getUserSignatures`, `requestResetCode`, `verifyPassword` | As D2; `requestResetCode`/`verifyPassword` reviewed against canonical auth (§2.6) | As D2 |

**⚠️ Porting cost:** these are written against **PostgreSQL** in rc-app; the
canonical base is **MySQL**. Each needs translation (`.returning()` →
`$returningId()`, `serial` → `autoincrement`, identifier quoting). Budget for
rewriting, not copying.

**Excluded:** `verifyLoginPin`, `resendLoginPin` — added by this session, not donor
capability (§1.6c).

---

## Phase E — Postgres/Vercel patterns: recommend REJECT

The brief names rc-app as donor for "Postgres/Vercel implementation patterns."

**Recommendation: do not do this.** Reasons:

1. It is not a capability import. It changes the database engine and hosting model
   of a **green, live build**.
2. The direction of quality runs the other way. MySQL canonical: 4138 passing, 0
   failing. Postgres donor: 2096 passing, 102 failing.
3. It collides with the standing constraint against moving databases and hosting.
4. No stated benefit. Nothing in the inventory shows a capability that *requires*
   Postgres or Vercel.

If it is nonetheless wanted, it is its own project with its own approval — a
dual-write migration with a rollback window, never a PR in this sequence.

**What is worth taking:** narrow, portable patterns — the Vercel function-size
discipline, the `api/index.ts` adapter shape — evaluated individually, not the
engine swap.

---

## Sequencing

```
Foundation PR (this)
   └─> A. harden base
          └─> B0. contested diff
                 ├─> C. 4 engines ──┐
                 ├─> D1. 7 tables ──┤
                 │      └─> D2–D4   │
                 └─> B1..B4 ────────┴─> B5 (dependent pages)

E. Postgres/Vercel — recommended REJECT; separate approval if pursued
```

C and D1 run in parallel with B1–B4. B5 waits on both.

## Estimated PR count

| Phase | PRs |
|---|---:|
| A | 3 |
| B | 1 (B0) + ~16–20 batches |
| C | 4 |
| D | 4 |
| **Total** | **~28–32** |

B's batch count firms up after B0.

## What would make me stop and ask

- B0 shows the 382 contested pages differ substantially → the page strategy needs
  rethinking before any import
- Any donor page requires a canonical schema **change** rather than an addition
- Test count would drop for any reason
- Anything implying a deployment, DNS, database, or credential change
