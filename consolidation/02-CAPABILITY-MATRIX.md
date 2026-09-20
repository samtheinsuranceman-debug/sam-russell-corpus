# 2 — Authoritative capability matrix

One chosen implementation per engine, calculator, route, schema and shared
module. All counts are measured against `origin/master` at commit `76ed5f2`.

The governing rule, from the owner's decision: **the live build wins unless a
documented comparison says otherwise.** Every "donor wins" cell below carries
the comparison that justifies it and the regression proof required before it
moves.

## 2.1 Rule of decision

| Situation | Authority | Evidence required to override |
|---|---|---|
| Module exists only in live | **live** | — |
| Module byte-identical in live and donor | **live** | — |
| Module exists in live and differs in a donor | **live** | Side-by-side numeric comparison + a test that fails on the live version and passes on the donor version |
| Module exists only in a donor | **donor** | Imported as new code; no override needed |
| Route exists in live and a donor | **live** | As above |

## 2.2 Engines, calculators and shared modules

184 distinct `shared/*.ts` modules exist across the three code repositories.

| Class | Count | Authority |
|---|---:|---|
| Present in live | 174 | live |
| — byte-identical wherever they appear | 157 | live, settled |
| — **divergent** against at least one donor | 17 | live by default; listed below |
| Absent from live, present in a donor | 10 | donor — import candidates |

### The 17 divergences (lines of code)

| Module | live | russell-capital | russell-capital-app |
|---|---:|---:|---:|
| `indexCreditingData.ts` | **999** | 999 | 685 |
| `mortgageKiller.ts` | 759 | **762** | 696 |
| `taxBracketEngine.ts` | 654 | **669** | **669** |
| `timeMachineEngine.ts` | **505** | 505 | 482 |
| `growthAnnuityEngine.ts` | **480** | 480 | 443 |
| `policyLoanMechanics.ts` | **405** | 325 | — |
| `mutualIulCarriers.ts` | **278** | 244 | — |
| `policyLoanOptimizer.ts` | **277** | 277 | 198 |
| `patentCatalog.ts` | **237** | 207 | — |
| `tabScores.ts` | **205** | 205 | 204 |
| `sp500SeriesAudit.ts` | 188 | **192** | — |
| `divorceFinancialEngine.ts` | 179 | **200** | 151 |
| `patentStatus.ts` | 161 | **198** | — |
| `slideThemes.ts` | 93 | 93 | 93 |
| `branding.ts` | **42** | 40 | 40 |
| `const.ts` | 30 | **36** | 14 |
| `accessControl.ts` | 29 | 104 | **107** |

Live is larger or equal in 11 of 17. Six modules where a donor is larger are the
only engine-level questions this consolidation leaves open:
`mortgageKiller` (+3), `taxBracketEngine` (+15), `sp500SeriesAudit` (+4),
`divorceFinancialEngine` (+21), `patentStatus` (+37), `accessControl` (+78).
Each gets its own migration PR in §6 — never a wholesale copy.

`accessControl.ts` is the sharpest and is scheduled first among them: 29 lines in
live against 104–107 in both donors. A gap that size in an authorisation module
is either delegated logic or missing logic, and which one it is must be
established by reading both before a line is moved. It is a security-relevant
module, so its PR carries the tighter review requirement in §6.

Note `divorceFinancialEngine.ts`: the two donors disagree with each other
(200 vs 151) as well as with live (179). No donor can be taken on size alone.

### The 10 donor-only modules

All ten live in `russell-capital`:

`multiplierDecision.ts` (660) · `policyLabMechanics.ts` (417) ·
`annualLoanStrategy.ts` (392) · `carrierLoanTerms.ts` (224) ·
`familyTreeFinancialEngine.ts` (221) · `loanSustainability.ts` (213) ·
`debtConversion.ts` (181) · `complianceDocGeneratorEngine.ts` (178) ·
`clientOnboardingEngine.ts` (176) · `multiCurrencyWealthEngine.ts` (159)

Full hashes and per-repo line counts: `data/shared_module_matrix.json`.

## 2.3 Routes

| Surface | Routes | Authority |
|---|---:|---|
| **Live** (`russell-capital-systems` @ `76ed5f2`) | **330** | base |
| russell-capital | 660 | donor |
| russell-capital-app | 612 | donor |
| Union of the three | 724 | — |
| Net-new beyond live | 394 | migration surface |

Route counts were taken two ways and agree: a static parse of
`client/src/App.tsx` and the patterns the build emits to
`dist/public/routes.json`. The repository's own `audit/route_manifest.json`
records 232 and is stale by 98 routes; `scripts/reconcile-route-manifest.mjs`
regenerates it. **That reconciliation is not part of this PR** — it rewrites an
audit artifact and deserves its own review.

## 2.4 The gamification surface — already live

The plan treats `russell-capital-app` as the donor for "18 gamification routes."
The measurement does not support that.

- `server/experienceRouter.ts` — XP, quests, streaks, loot, achievements, skill
  tree, daily rewards, rivalry, families, predictions, leaderboard — is **in the
  live build already**, at the same 1130 lines, exporting the same 13
  sub-routers (`experienceRouter`, `petRouter`, `questProgressRouter`,
  `rivalryRouter`, `morningRitualRouter`, `warStoryAIRouter`,
  `revenueAttributionRouter`, `dealScoringRouter` and five more). The two files
  differ in bytes but not in surface.
- **20 gamification-bearing portal routes are already live**: `/portal/arena`,
  `/portal/couples`, `/portal/pet`, `/portal/daily-briefing`,
  `/portal/nerve-center`, `/portal/daily-discovery`, `/portal/war-room`,
  `/portal/morning-ritual`, `/portal/rewards`, `/portal/leaderboard`,
  `/portal/the-brotherhood`, `/portal/toilet`, `/portal/russell-number`,
  `/portal/wrapped`, `/portal/social`, `/portal/the-mirror`,
  `/portal/black-mirror`, `/portal/agency-tutorial`, `/portal/referral-tracking`,
  `/portal/my-world`.
- Of the 385 proposed pages, exactly **2** carry gamification code:
  `/portal/wealth-rituals` (243 lines) and `/portal/usage-analytics` (185).

**Authority: live.** The gamification migration reduces from "18 routes" to two
pages, and is scheduled late rather than first.

## 2.5 Schema — a blocker, not a preference

| Build | Dialect | Tables | Driver |
|---|---|---:|---|
| **live** | **MySQL** | 155 | `drizzle-orm/mysql-core`, `mysql2` |
| russell-capital | MySQL | 155 | `drizzle-orm/mysql-core`, `mysql2` |
| russell-capital-app | **PostgreSQL** | 116 | `drizzle-orm/pg-core`, `postgres` |

Live and `russell-capital` now carry the same 155 tables. Both donors name the
same 7 tables live does not have — `client_reports`, `engine_chains`,
`engine_chain_runs`, `engine_usage_logs`, `page_performance_metrics`,
`tool_favorites`, `tool_usage` — and live has 46 tables `russell-capital-app`
does not.

The instruction to treat `russell-capital-app` as a donor for "Postgres/Vercel
implementation patterns" collides with the base build being MySQL. Its 116
`pgTable` definitions, its migrations and any query built on `pg-core` cannot be
imported into a `mysql-core` tree without a dialect port, which is a platform
decision and not a migration.

**Authority: live (MySQL).** `russell-capital` is the schema donor of record
because it shares the dialect. Postgres/Vercel patterns stay reference material.
**No PR in §6 touches a database, runs a migration, or ports a dialect.**

## 2.6 The Sacred Seven — already live

All seven exist in both `russell-capital` and the live build. All seven differ
in bytes. Six are the same length; one is longer in live.

| Page | donor lines | live lines | Authority |
|---|---:|---:|---|
| TheArrival | 255 | 255 | live |
| TheMirror | 174 | 174 | live |
| TheMap | 158 | 158 | live |
| TheStrategyTable | 199 | **288** | **live (larger)** |
| TheField | 167 | 167 | live |
| TheLegacy | 179 | 179 | live |
| TheBrotherhood | 150 | 150 | live |

**Authority: live.** The donor contribution here is a diff review of six
same-length files, not a migration. Six same-length, different-hash files
usually means cosmetic drift; that has to be confirmed by reading the diffs
before anyone concludes content was lost.
