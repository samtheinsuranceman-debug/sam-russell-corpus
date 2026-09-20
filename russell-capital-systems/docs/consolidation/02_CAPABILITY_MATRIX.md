# 02 — Capability matrix: the authoritative implementation

**Date:** 2026-09-20
**Rule applied:** the authoritative implementation is the one with the test
suite, not the one with the most lines. Where a donor genuinely wins, it is
recorded here and migrated with tests in a later PR — never silently.

---

## 1. How "authoritative" was decided

For every shared module, page component and route, the live build and both
Tier-B donors were compared by SHA-256, by file size, and — where they differ —
by **exported symbol list**. Size alone is not evidence; two of the four
"donor is larger" shared modules turned out to differ by 18 bytes.

Four verdicts are used:

| Verdict | Meaning |
|---|---|
| **LIVE** | Live build wins. Donor adds nothing or is a strict subset. |
| **DONOR** | Donor has capability live does not. Migrate, with tests. |
| **DISJOINT** | Same filename, different API, both legitimate. Needs a decision, not a merge. |
| **DUPLICATE** | Capability exists in both, under different filenames. Do not import. |

---

## 2. Shared modules — the engine layer

Live build: **190 shared modules**, of which **151 are referenced by at least
one test** and **39 are not** (listed in §5).

### 2.1 Modules that differ between live and `russell-capital`

Of 69 shared modules present in both, **53 are byte-identical**. Sixteen differ:

| Module | Live | Donor | Verdict | Reasoning |
|---|---:|---:|---|---|
| `indexCreditingData.ts` | 37,655 | 21,604 | **LIVE** | Live carries the statement-calibrated crediting work. Donor is the pre-calibration version. |
| `mortgageKiller.ts` | 30,988 | 27,102 | **LIVE** | Live has the four flagship defect fixes (task #16). |
| `growthAnnuityEngine.ts` | 19,502 | 17,315 | **LIVE** | Donor is a subset. |
| `timeMachineEngine.ts` | 17,582 | 16,555 | **LIVE** | Donor is a subset. |
| `policyLoanOptimizer.ts` | 10,817 | 7,037 | **LIVE** | Donor is a subset. |
| `divorceFinancialEngine.ts` | 7,574 | 5,888 | **LIVE** | Live is wired to `divorceStateRules` (task #12). |
| `tabScores.ts` | 6,135 | 6,103 | **LIVE** | Trivial delta. |
| `const.ts` | 939 | 275 | **LIVE** | Donor is a stub. |
| `realEstateCapacityEngine.ts` | 37,284 | 37,302 | **LIVE** | 18-byte delta. Not a real difference. |
| `realEstateFindings.ts` | 38,119 | 38,128 | **LIVE** | 9-byte delta. |
| `realEstateStressEngine.ts` | 11,989 | 11,998 | **LIVE** | 9-byte delta. |
| `slideThemes.ts` | 2,693 | 2,695 | **LIVE** | 2-byte delta. |
| `taxBracketEngine.ts` | 23,123 | 23,451 | **REVIEW** | 328-byte delta, not yet symbol-diffed. Migration PR #3 resolves it. |
| `branding.ts` | 2,988 | 3,405 | **REVIEW** | 417-byte delta. Cosmetic surface; low risk either way. |
| `accessControl.ts` | 1,444 | 4,204 | **DISJOINT — SECURITY** | See §3.1. |
| `realEstateCapitalStackEngine.ts` | 11,477 | 21,507 | **DISJOINT / DUPLICATE** | See §3.2. |

### 2.2 Modules only in the donor

`russell-capital` contributes **2** shared modules absent from live;
`russell-capital-app` and `russell-capital` contribute **0** net-new shared
modules beyond those. The engine layer is effectively already consolidated.

---

## 3. The two that need a decision, not a merge

### 3.1 `accessControl.ts` — DISJOINT, security-sensitive

These are two different authentication models wearing the same filename.

| | Live | Donor |
|---|---|---|
| Model | password-based | email-allowlist-based |
| Exports live-only | `ETERNAL_PASSWORDS`, `isValidPassword` | — |
| Exports donor-only | — | `AUTHORIZED_EMAIL`, `PORTAL_ALLOWED_EMAILS`, `SESSION_VERSION`, `isAuthorizedEmail`, `isPortalAllowedEmail` |

**Verdict: do not merge in any automated pass.** Taking the donor changes who
can log in. Taking the union changes who can log in. Both repositories have an
`accessControl.test.ts`, and the two test files encode different expectations,
so a passing suite on either side proves nothing about the other.

This is the single highest-risk file in the consolidation and it is
deliberately excluded from every migration PR in document 06. It gets its own
PR, last, after the owner states which auth model is intended.

### 3.2 `realEstateCapitalStackEngine.ts` — DISJOINT, and a duplicate

| | Live | Donor |
|---|---|---|
| Exports | `CAPITAL_STACK_DISCLOSURE`, `DEAL_MODEL_DISCLOSURE`, `capitalStack`, `describeStack`, `ArchetypeMatch`, `BindingThreshold`, `BlockedMechanism`, `CapitalStack` | `STANDARD_WATERFALL`, `amortizeLayer`, `analyzeCapitalStack`, `debtConstant`, `goingInCapRate`, `irr`, `npv`, `pmt`, `runWaterfall`, `weightedAverageDebtCost` |

No symbol is shared. Live models archetypes, disclosures and blocked
mechanisms; the donor implements classical real-estate finance primitives.

**The trap:** this looks like a clean "donor adds missing math" case. It is
not. **Live already implements `irr`, `npv` and `pmt` in
`shared/realEstateDealModel.ts`.** Importing the donor file wholesale would
create a second IRR in the codebase under a second name — precisely the
double-stacking this consolidation exists to prevent.

**Verdict: harvest selectively, not wholesale.** The genuinely novel symbols
are `runWaterfall`, `STANDARD_WATERFALL`, `debtConstant`, `goingInCapRate`,
`weightedAverageDebtCost` and `amortizeLayer`. Those should land as new
functions inside the existing `realEstateDealModel.ts` / capital-stack modules,
calling the incumbent `irr`/`npv`/`pmt`. The donor's `irr`/`npv`/`pmt` are
discarded.

**Flagged as clever code, per standing instruction:** the donor's
`runWaterfall` + `STANDARD_WATERFALL` pair is a real capability the live build
lacks — equity waterfall distribution with promote tiers. The donor also has
`realEstateCapitalStack.test.ts`, which live does not. **The donor's tests are
worth more than the donor's implementation here** and should be ported first,
against the live API, to see what actually fails.

---

## 4. Page components

| Donor | Donor pages | Filenames shared with live | Byte-identical | Differ | …of which donor is larger | Donor-only |
|---|---:|---:|---:|---:|---:|---:|
| `russell-capital` (in corpus) | 123 | 71 | 6 | **65** | 30 | 52 |
| `russell-capital` (standalone) | 688 | 261 | 9 | **252** | 110 | **427** |
| `russell-capital-app` | 722 | 260 | 6 | **254** | 138 | **462** |

**Reading this honestly:** only 6-9 page files out of ~260 are identical. That
is not two copies of one app; it is two apps that share a naming scheme. A
filename match is therefore *not* evidence that the pages are the same page,
and "donor is larger" is *not* evidence the donor is better — it is frequently
dead JSX, duplicated imports, or an older layout that was later extracted into
a shared component.

**Consequence for the plan: no page is migrated on a size comparison.** Every
page in document 06 is migrated on an explicit capability claim, in a batch
small enough to review by eye.

---

## 5. Routes

| Measure | Count |
|---|---:|
| Routes registered in live `App.tsx` (master) | **330** |
| Routes with a sidebar entry | 172 |
| **Routes with NO menu entry** | **160** |
| Menu links pointing at a non-existent route (404 today) | **2** |
| RCS-family donor routes not present in live | **394** |
| Live routes present in no donor | 94 |

The two dead menu links are `/portal/knowledge-library` and
`/portal/tool-explorer`.

**The 160 unreachable routes are the single highest-value item in this
consolidation, and they require no migration at all.** They are already built,
routed and tested in the live build; they simply have no menu entry. Importing
a donor page that duplicates one of them would be the worst possible outcome —
paying migration cost for a capability that already exists and is merely
hidden. Reachability is therefore PR #1 in document 06, before any import.

---

## 6. Schema and server

| Layer | Live | Donor contribution |
|---|---:|---|
| Drizzle tables (`drizzle/schema.ts`) | **155** | none identified |
| Server modules (non-test) | **110** | none identified |
| Test files | **216** (225 incl. skipped) | donors add `realEstateCapitalStack.test.ts` |

No donor introduces a database table the live build lacks. The schema layer is
already authoritative in the live build and generates **zero** migration PRs.

---

## 7. Shared modules with no test reference (39 of 190)

These are authoritative by default — no competing implementation exists — but
they are unverified. They are listed so that the gap is explicit, not because
any of them blocks the consolidation.

`advisorySummaryData` · `annuityFeeDetectionEngine` · `behavioralBiasEngine` ·
`captiveInsuranceEngine` · `carrierStrengthMonitorEngine` ·
`ceCreditTrackerEngine` · `clientOnboardingEngine` · `clientRetentionEngine` ·
`commissionOptimizerEngine` · `complianceDocGeneratorEngine` ·
`creditingWindows` · `crtWealthReplacementEngine` · `disabilityGapEngine` ·
`estateTaxEngine` · `familyTreeFinancialEngine` · `fiaCollateralEngine` ·
`generationalWealthEngine` · `genomeStrategies` · **`householdWealth.bak.ts`** ·
`ibbotsonModel` · `leadTypes` · `livingBenefitsProbabilityEngine` ·
`multiCarrierIULOptimizer` · `multiCurrencyWealthEngine` · `multiPropertyMyga` ·
`peerBenchmarkingEngine` · `policyReplacementAnalyzer` · `premiumFinancing` ·
`premiumFinancingArbitrage` · `prospectQualificationEngine` · `retirementDNA` ·
`retirementGapEngine` · `reverseHeloc` · `socialSecurityBridgeEngine` ·
`stateTaxMigrationEngine` · `successionValuationEngine` ·
`taxCodeChangeSimulator` · `wealthGenome` · `weaponizeEngines`

Two observations worth acting on separately from this consolidation:

- **`householdWealth.bak.ts` is a `.bak` file committed to `shared/`.** It
  should be deleted or promoted, not left as a second implementation of a
  module that has a live counterpart.
- `ibbotsonModel` is already the subject of open task #18 (owner decision on
  repointing at the audited price-return series). It is untested *and*
  pending a correctness decision.

---

## 8. Summary — where authority sits

| Capability layer | Authoritative | Donor PRs generated |
|---|---|---:|
| Database schema (155 tables) | **LIVE** | 0 |
| Server modules (110) | **LIVE** | 0 |
| Shared engines (190) | **LIVE** on 14 of 16 contested | 2 (review) |
| Real-estate waterfall math | **DONOR** (selective) | 1 |
| Access control | **UNRESOLVED — owner decision** | 1 (last) |
| Pages already built but hidden (160) | **LIVE** | 0 (menu only) |
| Net-new donor pages (394 routes) | **DONOR**, batched | ~8-10 |

The engine layer is done. The schema layer is done. **The consolidation is
almost entirely a pages-and-navigation problem**, plus one security decision
that only the owner can make.
