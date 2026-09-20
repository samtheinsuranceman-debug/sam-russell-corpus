# 2 — Authoritative Capability Matrix

Machine-readable form: `data/capability-matrix.json`.

---

## The selection rule

> **Where the live build has an implementation, that implementation is canonical.**
> A donor implementation replaces it only after a documented side-by-side
> comparison and a regression proof, both landed in the migration PR that proposes
> the swap.

This is not a preference for incumbency. It is the only rule under which "green" means
something: the live build is the thing with 4,138 passing tests and a clean typecheck
against it. A donor artifact has no evidence attached until someone produces it.

Three verdicts, and nothing else:

| Verdict | Meaning |
|---|---|
| **CANONICAL — live** | Live has it. Not replaceable without comparison + regression proof |
| **CANDIDATE** | Live does not have it. Eligible for a migration PR |
| **REJECTED** | Live has a better implementation. Do not port. Reason recorded |

---

## Totals

| Capability class | Live | rc | app | Candidates (not in live) |
|---|---|---|---|---|
| Routes | **330** | 664 | 612 | **438** |
| Shared modules | **174** | 65 | 62 | **7** |
| Engines | **55** | 32 | 32 | **4** |
| Schema tables | **155** | 117 | 116 | **8** |

The shape matters: the live build has **2.7× the shared modules** and **1.7× the
engines** of either donor. The donors' larger *route* counts are duplication, not
capability. Only 7 shared modules and 4 engines in the entire donor pool do not
already exist in live.

**SQL dialect:** live `mysql` · `russell-capital` `mysql` · `russell-capital-app`
**`postgres`**. Any `-app` artifact touching the database is a dialect migration.

---

## Engines — the complete candidate set

Four, out of 32 in each donor. Everything else is already live.

| Engine | Live | rc | app | Verdict | Phase |
|---|---|---|---|---|---|
| `clientOnboardingEngine.ts` | — | ✓ | ✓ | **CANDIDATE** | 4 |
| `complianceDocGeneratorEngine.ts` | — | ✓ | ✓ | **CANDIDATE** — compliance surface, needs legal review | 6 |
| `familyTreeFinancialEngine.ts` | — | ✓ | ✓ | **CANDIDATE** | 4 |
| `multiCurrencyWealthEngine.ts` | — | ✓ | ✓ | **CANDIDATE** | 5 |
| all other 28 | ✓ | ✓ | ✓ | **CANONICAL — live** | — |

Each of the four exists in both donors. Both copies must be diffed before one is
chosen; where they are byte-identical, prefer the `russell-capital` copy because it
shares the live build's MySQL dialect.

## Shared modules — the complete candidate set

Seven. Four are the engines above. The remaining three were authored in this
session and carry no test coverage.

| Module | Origin | Verdict | Reason |
|---|---|---|---|
| `plasticToCash.ts` | Authored this session | **CANDIDATE** | Net-new capability; live has no liquidity-recycling engine. Unproven |
| `mutualCarriers.ts` | Authored this session | **CANDIDATE** | Live has `shared/carriers/` data and `carrierRatings`; overlap must be diffed before import |
| `nlpCalibration.ts` | Authored this session | **REJECTED — with one carve-out** | See below |

---

## The NLP decision

**`shared/nlpCalibration.ts` is rejected.** The live build's NLP layer is
materially better on every axis the two share:

| | live `nlpBrain.ts` | session `nlpCalibration.ts` |
|---|---|---|
| Meta-programs | **51**, each with elicitation question, poles, text markers, and a `speakTo` per pole | 29 axes |
| Enforcement | A test fails if any pole lacks a `speakTo` | None |
| Representational systems | Predicate lexicons **tested to be disjoint** | Prose description |
| Language patterns | **32** across Milton / Meta-model / reframing / pacing | None |
| Emotional arc | 7 phases with a hard sentence cap each | None |
| Composite mind | 12 channels as working memory | None |
| Provenance | Per-block citation to the corpus file each was lifted from | Cites the corpus generally |
| Lines | 917 + 251 + 324 | ~700 |

Porting the session module would be a downgrade and would create a second,
competing voice grammar. **Do not import it.**

### The carve-out

Two constructs in that module are **not** present anywhere in the live build, and
are additive rather than competing. Measured: zero occurrences of `metaState`,
`meta-state`, `hysteresis`, `recalibrat`, `confidenceGate`, or `deepestConfident`
across `shared/` and `server/`.

| Construct | What it is | Proposed disposition |
|---|---|---|
| **Meta-layer ladder (L0–L4)** | Five reflexive layers with a rising evidence gate per layer, a `deepestConfidentLayer()` ceiling so the system works at its earned depth instead of guessing deeper, and a read-deep/speak-shallow rule | **CANDIDATE — propose as a small extension to `nlpBrain.ts`**, not as a replacement module |
| **Two-loop recalibration calculus** | Reading every turn with no throttle; style switching event-driven behind a 90s dwell floor with hysteresis; three immediate overrides (distress, domain change, explicit correction); a separate 30s advisor-nudge loop | **CANDIDATE — same** |

Both are ~120 lines combined. They belong inside the existing brain as a depth and
cadence governor over the 51 meta-programs, which is strictly more useful than
governing 29 lesser ones. This is a Phase 7 item and needs its own PR with tests,
because it changes pacing on every AI surface.

**`clientCalibration` table and migrations 0056/0057 are on hold** pending that
decision — they were designed to persist the 29-axis model. If the ladder lands
inside `nlpBrain.ts`, the persistence shape changes and those migrations should be
rewritten rather than ported. They were never applied to any database.

---

## Schema — the complete candidate set

Eight tables, all MySQL-side, all from `russell-capital`:

| Table | Verdict | Note |
|---|---|---|
| `toolUsage`, `toolFavorites` | **CANDIDATE** | Live may already track this under other names — diff `shared/` analytics first |
| `pagePerformanceMetrics` | **CANDIDATE** | Check against live's audit tooling before adding |
| `engineChains`, `engineChainRuns`, `engineUsageLogs` | **CANDIDATE** | Backs engine chaining. Live has 55 engines and may already chain them — verify before importing |
| `clientReports` | **CANDIDATE** | Live has a report builder — likely duplicate |
| `clientCalibration` | **ON HOLD** | Blocked on the NLP decision above |

No donor table conflicts with a live table name.

**Migration numbering — verified, and it is a trap.** There are two migration
directories:

| Location | Files | Highest |
|---|---|---|
| `drizzle/` — the `out` dir in `drizzle.config.ts` | 5 | **0069** |
| `drizzle/migrations/` — legacy | 60 | **0073** |
| **Total** | **65** | **0073** |

`drizzle-kit generate` writes to `drizzle/` and picks its next number from what it
sees there — **0070** — which already exists in the legacy directory. **The next
safe number is `0074`, and any schema PR must set it explicitly rather than trust
the generator.** The donor's `0056`/`0057` collide in both locations and must be
renumbered, not merely moved.

---

## Routes

438 candidates, 236 collisions. Full enumeration in
`data/route-collisions.json` and `04_ROUTE_COLLISION_REPORT.md`.

Headline dispositions:

| Group | Count | Verdict |
|---|---|---|
| Live routes also present in a donor | **236** | **CANONICAL — live.** Donor version never overwrites without comparison + proof |
| Candidate routes present in **both** donors | **382** | **UNDECIDED** — each needs one implementation chosen |
| Candidate routes in `russell-capital` only | **53** | Eligible |
| Candidate routes in `russell-capital-app` only | **3** | Eligible, but Postgres-lineage — check DB coupling |
| Gamification (of the above) | **9** | Phase 3. From `russell-capital`, not `-app` |
| Sacred Seven | **0** | Already live. Nothing to do |

**The 41 `ToggleHub` consolidation hubs are explicitly not a Phase 1 item.** Live
solved route sprawl differently — via the route manifest, `audit/route_manifest.json`,
and the `pageRegistry.json` scoring — and live has 330 routes, not 620, so the
duplication the hubs were built to absorb largely does not exist here. Importing
them would add a second, competing consolidation scheme. Revisit only after the
route work in Phases 2–5 shows real residual duplication.
