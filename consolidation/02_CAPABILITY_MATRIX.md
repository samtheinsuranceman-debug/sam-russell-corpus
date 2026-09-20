# 2 — Authoritative Capability Matrix

**Date:** 2026-09-20
**Rule:** exactly one implementation of each engine, calculator, route, schema and shared
module is authoritative. This document names it. Nothing is overwritten on the strength of
this document alone — each change ships in its own PR with the regression proof named in
document 6.

Legend — **BASE** = `sam-russell-corpus/russell-capital-systems` · **LIVE** = `russell-capital`
· **APP** = `russell-capital-app`

---

## 2.1 How authority was decided

A capability is authoritative in the base unless the donor is **measurably** better on one of:
test coverage, dependency health, schema completeness, or uniqueness (the base simply lacks it).
Where both sides have an implementation and neither is measurably better, **the base wins by
default** — because a tie is not a reason to take migration risk.

Every row below was produced by file-level comparison, not by reading names.

---

## 2.2 Shared modules — 191 distinct

| Set | Count | Authority | Action |
|---|---:|---|---|
| Present in BASE only | 128 | **BASE** | none — already canonical |
| Present in BASE and LIVE (same filename) | 59 | **BASE** | none; LIVE copies retired in place |
| Present in LIVE only | **4** | **LIVE** | **migrate** — PR-3 |

The four LIVE-only shared modules, and the only shared-layer gap in the base:

| Module | Why it exists only in LIVE |
|---|---|
| `shared/clientOnboardingEngine.ts` | Onboarding flow the base never had |
| `shared/complianceDocGeneratorEngine.ts` | Compliance document generation |
| `shared/familyTreeFinancialEngine.ts` | Multi-generational family tree modelling |
| `shared/multiCurrencyWealthEngine.ts` | Multi-currency wealth |

**Behavioral / NLP / genome schema — authority is BASE, not LIVE.**
`behavioralBiasEngine`, `nlpBrain`, `wealthGenome`, `wealthGenomeFactors`,
`wealthGenomeDurability`, `householdGenome`, `genomeStrategies`, `genomeStrategyFit` all exist
in the base, **and the base additionally has `illustrationCalibration.ts`, which LIVE lacks.**

> **Correction to the stated plan.** The decision brief lists `russell-capital` as the donor for
> the behavioral schema. Measured, the base already holds every module in that set plus one
> more. No migration is required, and migrating LIVE's copies over the base's would be a
> regression. Recorded here for your review rather than silently followed.

---

## 2.3 The Sacred Seven — authority is BASE

| Page | BASE | LIVE | APP |
|---|---|---|---|
| `TheArrival` | **yes** | no | yes |
| `TheField` | **yes** | no | yes |
| `TheMirror` | **yes** | no | yes |
| `TheLegacy` | **yes** | no | yes |
| `TheBrotherhood` | **yes** | no | yes |
| `TheMap` | **yes** | no | yes |
| `TheStrategyTable` | **yes** | no | yes |
| `portal/_genome/GenomeKit.tsx` | **yes** | no | no |
| `server/fieldRouter.ts` | **yes** | no | no |

> **Second correction to the stated plan.** The brief lists `russell-capital` as the donor for
> the Sacred Seven. **`russell-capital` does not contain it.** All seven pages, the GenomeKit,
> and the server router are native to the base. (They appear in the live build's *working tree*
> only because a previous, unmerged branch imported them from this very corpus; at the live
> build's own head commit `863b3f0` they are absent.)
>
> **Net effect: this removes an entire planned migration PR.** The Sacred Seven is already home.

---

## 2.4 Server modules — 150 distinct

| Set | Count | Authority | Action |
|---|---:|---|---|
| BASE only | 101 | **BASE** | none |
| BASE and LIVE | 46 | **BASE** | none |
| LIVE only | **3** | **LIVE** | **migrate** — PR-3, alongside the 4 shared engines |

The base carries 29 tRPC routers LIVE does not, including `fieldRouter`, `whisperer`,
`ultraAI`, `factFinderRouter`, `librarianRouter`, `intakeRouter`, `leadsRouter`,
`planningCasesRouter`, `policyLabRouter`, `realEstateCapitalRouter`, `siteHealthRouter`,
`taxScheduleRouter`, `zipRouter`.

**`sisterInventionsRouter` — authority BASE.** Base 813 lines / 39 procedures; LIVE 551 lines /
30 procedures. Verified: the base is a strict superset — no LIVE procedure is absent from it.

---

## 2.5 Database schema — 162 distinct tables

| Set | Count | Authority | Action |
|---|---:|---|---|
| BASE only | 46 | **BASE** | none |
| BASE and LIVE | 109 | **BASE** | none |
| LIVE only | **7** | **LIVE** | **migrate additively** — PR-4, with a generated migration |

The seven LIVE-only tables, all telemetry/registry rather than domain data:

`clientReports` · `engineChainRuns` · `engineChains` · `engineUsageLogs` ·
`pagePerformanceMetrics` · `toolFavorites` · `toolUsage`

**Dialect check:** BASE and LIVE are both Drizzle **MySQL**. APP is the Postgres/Vercel variant.
Taking Postgres patterns from APP is a *platform* decision, not a schema decision, and is
deliberately excluded from every PR in document 6. Flagged because mixing the two silently
would be the single most damaging error available in this consolidation.

---

## 2.6 Engine & calculator registries — authority BASE, with a hard rule

The base emits a **route manifest at build time** — `dist/public/routes.json`, 330 patterns,
written by `scripts/build.mjs`. LIVE has no equivalent.

| Registry | Authority | Rule |
|---|---|---|
| Route manifest (`routes.json`) | **BASE** | Regenerated by the build. Never hand-edited. Its diff is the review artifact for every page-migration PR. |
| Engine registry | **BASE** | Additive only. No PR may remove or re-point an existing entry. |
| Calculator registry | **BASE** | Additive only. Same rule. |
| Test suite (`test:ci`, 194 files) | **BASE** | No PR may delete or skip an existing test. Additions only. |

Per the stated constraint, none of these four is replaced by any PR in this plan. Each is
**extended**, and each extension ships with the before/after manifest diff.

---

## 2.7 Pages — the migration surface

| Set | Count | Authority | Action |
|---|---:|---|---|
| Route paths in BASE | 330 | **BASE** | none |
| Route paths in BASE **and** LIVE | 229 | **BASE** | none — base implementation stands |
| Route paths in LIVE, **absent from BASE** | **391** | **LIVE** | **migrate in phases** — document 4 |
| 41 consolidation hubs (APP) | 41 | **APP** | migrate — PR-5 |
| Engagement/gamification pages (LIVE) | 9 | **LIVE** | migrate — PR-6 |

The 229 overlapping paths are the only place a genuine "which implementation wins" judgement
arises. **All 229 resolve to BASE** under §2.1. Any individual page you want re-decided is a
one-line change here and its own PR — the matrix is the place to argue it, not the code.

---

## 2.8 Two open questions for your decision

**1. The "18 gamification routes."** The brief assigns 18 gamification routes to `russell-capital-app`
as donor. Measured, I can account for **9**, and they are in **`russell-capital`, not the app** —
all 9 are collision-free (§4). They are:

`/portal/elite-showdown` · `/portal/entrainment-engine` · `/portal/pavlovian-engagement` ·
`/portal/holographic-mirage` · `/portal/moat-fortress` · `/portal/predictive-arena` ·
`/portal/strategy-comparison` · `/portal/wealth-odyssey` · `/portal/wealth-warrior`

Every other gamification-flavoured page found in APP (`Leaderboard`, `CompetePage`, `EarnPage`,
`CompetitiveAnalysis`, …) **already exists in the base**. I have not guessed at the remaining 9
of your 18. Please either confirm this 9-route set as the scope of PR-6, or name the missing 9
and I will re-run the collision and dependency checks against them.

**2. Postgres/Vercel patterns from APP.** Adopting these changes the base's database dialect and
hosting model. It is excluded from every PR below and needs its own decision, separate from
this consolidation.
