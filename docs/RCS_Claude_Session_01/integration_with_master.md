# Integration with the Master Build
## The three most recent saves, what they contain, and exactly how this session's work attaches to each

**Checked against GitHub `samtheinsuranceman-debug/sam-russell-corpus`, branch `master`, on 2026-09-18 at 16:40.**

---

## 0. The thing you need to know first

**Two Claude sessions have been building in parallel, and both produced a folder called `RCS_Claude_Session_01`.** They are not duplicates and neither supersedes the other.

| | Session A (the other one) | Session B (this one) |
|---|---|---|
| Lives at | `master` → `russell-capital-systems/docs/handoff/RCS_Claude_Session_01/` | `claude/base-consolidation` → `russell-capital-systems/docs/RCS_Claude_Session_01/` |
| Built | Sequencing, cycles, thresholds, provider dossiers, the scorecard machinery | Evidence layer, regime engine, toggles, consolidation of six builds |
| Code shipped | `sequencePlanner`, `sequenceOrderings`, `sequenceArchetypes`, `thresholds`, `cycleEngine`, `cycleScenarios`, `mechanismDossiers`, `erosion`, `powerHistory`, `taxHistory`, `historicalShocks`, `integrationAudit`, `pageRatings`, `aiMemoryBank` | `rentalMarketEngine`, `rentalData`, `rentalRouter`, `historicalMarketRegimeEngine`, `divorceFinancialEngine` wiring, `mortgageKiller` evidence paths, 30 sister-invention engines |
| Research asks | 16 questions (Q01–Q16), provider-heavy | 10 questions (Q-01–Q-10), data-source-heavy |
| Transcript | 3.8 MB | 4 parts, 1,631 turns |

**Neither folder contains the other's code.** Read both. Where the two overlap, §4 below says which one wins and why.

---

## 1. Save one — `dc4cacc`, 18 Sep 16:18
### "Handoff folder for Perplexity: RCS_Claude_Session_01 as plain files"

**What it is.** 28 files, 4.6 MB. Session A's complete handoff: manifest with SHA-256 per file, executive summary, a 19 KB provider verification brief with a JSON return schema, recommendations, architecture, 14 verbatim engine copies, three data files, and four PDFs including a 31-page scorecard.

**What it establishes that matters to this session's work:**

- `data/questions.csv` — 16 research questions, each naming **the exact file where the answer goes**. That "where_the_answer_goes" column is the right pattern and my 10 questions should adopt it.
- `code/thresholds.ts` — 27 KB of gates (seasoning, LTV, DSCR, equity-share covenants), each carrying its standard value, its documented variants, an evidence score, and a source URL. **This is the rules-table pattern executed better than anywhere else in the platform.**
- `code/historicalShocks.ts` — named shock windows (1973 oil, Black Monday 1987, dot-com 2000–02, GFC 2008, COVID 2020) run against a policy's own floor and cap. It deliberately declares 1973 and 1987 **unavailable** because `RAW_INDEX_RETURNS` starts in 1994.

**How my work attaches — three concrete joins:**

**Join 1 — the regime engine extends the shock library backwards by twenty-one years.**
`historicalShocks.ts` cannot show 1973–74 or 1987 because its index series begins in 1994. My `historicalMarketRegimeEngine.ts` runs on CPI (1947→), FHFA home prices (1975→) and prime rate (1955→) — all of which cover both missing windows. It cannot produce an *index credit* for 1973, but it can classify 1973–74 as `stagflation` and 1987 as `contraction`, with the basis sentence and the evidence window. So the shock surface stops saying "unavailable" and starts saying *"1973–74: stagflation — inflation at 11.0% with real asset growth of −4.2%. We hold no index series for these years, so no credited rate is shown."* That is a strictly better answer than silence, and it costs one function call.

```ts
// in historicalShocks.ts, for a window outside RAW_INDEX_RETURNS
import { classifyRegimes } from './historicalMarketRegimeEngine';
const c = classifyRegimes({ cpi: cpiSeries, assetIndex: fhfaSeries, policyRate: primeSeries });
const label = c.years.filter(y => y.year >= w.fromYear && y.year <= w.toYear);
// label[i].regime + label[i].basis → shown instead of "unavailable"
```

**Join 2 — `thresholds.ts` and `divorceStateRules.ts` are the same shape and should share one interface.**
Both carry: a standard value, variants or per-jurisdiction rows, a source, an evidence or version marker, and a set of things they must never be used to claim. Extract:

```ts
// shared/rulesTable.ts — new
export interface RulesTable<T> {
  version: string;            // RULES_VERSION
  asOf: string;
  rows: readonly T[];
  neverPrinted: readonly string[];
  sourceFor(rowId: string): { url: string; evidence: 1|2|3|4|5; asOf: string } | null;
}
```
Then `thresholds`, `divorceStateRules` and the forthcoming deposit-statute table all implement it, and **Rule 7 of the page contract becomes machine-checkable**: a repository scan asserts every statutory constant reaches a `RulesTable`.

**Join 3 — their `integrationAudit.ts` should read my four missing rules.**
`integrationAudit.ts` already reads six of the ten page-contract dimensions from source. It cannot yet see rules 4 (Sourced), 5 (Toggled), 6 (Simulated) and 10 (Measured) — because until this session there was nothing to detect. Now there is: an evidence ledger type, an `EvidencePanel`, a seeded resampler. Adding four detectors makes the whole scorecard automatic, which is what turns it from a report into a gate.

---

## 2. Save two — `ec3d057`, 18 Sep 15:47
### "Merge origin/master"

**What it is.** The merge that brought `bd82825` (integration scorecard) and `8203d3f` (roadmap) onto the mainline together.

**Why it matters here.** This is the commit my BASE branch merged at `9a9f8e6`, and the merge had exactly one conflict: the route count in both smoke tests. Session A's scorecard page took the count to 321; my harvest had taken it to 329. Resolved at **330**, and the full suite went green at 213 files / 4,076 tests — now 214 / 4,095 with the regime engine.

**The integration lesson worth writing down:** the two smoke tests (`managed-port.smoke.test.ts`, `grok-merge.smoke.test.ts`) are the collision point between any two parallel sessions. They hold a hard-coded integer. Every parallel branch will conflict there, every time, and the resolution is always *the sum of both sides' additions, not either side's number.*

**Recommendation to stop paying that tax:** replace the literal with a derived assertion.

```ts
// instead of: expect(currentRoutes.size).toBe(330)
const expected = ROUTE_MANIFEST.length;          // a real list, one line per route
expect(currentRoutes.size).toBe(expected);
expect(new Set(ROUTE_MANIFEST).size).toBe(expected);   // no duplicates
```
A route manifest merges cleanly — two sessions adding different routes produce two non-overlapping line additions, not a conflicting integer. This is a ten-minute change that removes the single most reliable source of merge pain in the repository.

---

## 3. Save three — `8203d3f`, 18 Sep 15:45
### "Roadmap to a 10 out of 10"

**What it is.** `docs/PERPLEXITY_ROADMAP.md`, 198 lines. Ten named blockers, unresolved tasks in build order with dependencies and done-when criteria, and pass/fail criteria on five dimensions.

**Where my measurements agree with it — independently:**

| Its number | My number | Agreement |
|---|---|---|
| Mean page wiring 3.3 / 10 | 688-build audit average 4.3 / 10 | Same diagnosis from two directions: engines strong, wiring absent |
| 101 of 115 pages with no genome route | Bucket D of my reconciliation = 119 pages to embed or retire | The same orphan population, counted differently |
| 112 of 115 with no provenance trace | My evidence-ledger work covers 1 page so far | It was right; I moved the number by one |
| 39 providers named, 6 verified | Unchanged | Still the highest-value research job |

**Where my work supersedes a line in it.** The roadmap lists as blocker #10: *"No account aggregation. Every projection runs from typed inputs."* That remains true and I have not changed it. But blocker-adjacent item — *"the builder cannot read or set Railway variables"* — now has a concrete consequence worth naming: `RENTAL_DATA_DAYS` and `CENSUS_API_KEY` are new variables this session introduced, and without them the entire rental evidence layer sits inert. They belong on the same list as the nine already there. **The list is now eleven variables, not nine.**

**Where my work adds a blocker the roadmap does not have.** The flagship calculator has no cost-of-insurance term at all. A roadmap to 10/10 that does not include "the IUL model charges nothing for insurance" is missing its most consequential line. See §5.

---

## 4. Where the two sessions overlap — and which wins

| Area | Session A | Session B (this) | Resolution |
|---|---|---|---|
| **Historical shocks vs regimes** | Named events, policy floor/cap, 1994→ | Statistical classification, all years, 1947→ | **Both.** A does narrative persuasion; B does distributional honesty. Wire per Join 1 |
| **Rules tables** | `thresholds.ts` — richest implementation | `divorceStateRules.ts` — cleanest interface | **A's data, B's interface.** Extract `RulesTable<T>` per Join 2 |
| **Scorecard** | `integrationAudit.ts` reads 6 dimensions | Specified all 10 with pass criteria | **A's machinery, B's spec.** Add four detectors |
| **Research questions** | 16, provider-heavy, names the target file | 10, data-source-heavy, has acceptance criteria | **Merge to 22 unique.** Adopt A's `where_the_answer_goes`, keep B's acceptance criteria. Overlaps: A-Q02≡B-Q-02, A-Q03≡B-Q-05, A-Q09≡B-Q-01, A-Q14≡B-Q-08, A-Q15≡B-Q-10 |
| **Index return data** | `historicalShocks` reads `RAW_INDEX_RETURNS` (correct) | Found `ibbotsonModel` holds total return (wrong) | **A's source is right.** Point `ibbotsonModel` at it |
| **Transcript** | 3.8 MB single file | 4 parts, ≤229 KB each | **B's split** — A's file is too large for most chat windows |
| **Monte Carlo** | A-Q12 asks what distributions the engines should draw from | B built the regime-conditioned answer | **B answers A-Q12 in part.** Close it for the asset-path half; the mortality half is still open |

---

## 5. The merge order I recommend

`claude/base-consolidation` is 12 commits ahead of `master` and carries no conflicts beyond the route count. Merge in this order:

**Step 1 — merge BASE into master.** One conflict expected (route count → 330). The BASE carries: the rental evidence layer, the regime engine, the divorce wiring, the mortgage evidence paths, 30 sister-invention engines, the Patent360 system, the concepts, and both handoff folders. Gate: `pnpm check` 0, `pnpm test` 214/4,095.

**Step 2 — fix the four flagship defects before anything else ships to production.** In order of consequence:

1. **Add cost of insurance to `mortgageKiller.ts`.** There is none. A search for `coi`, `costOfInsurance`, `insuranceCharge` returns nothing. The IUL accumulates with no mortality or expense charge, which overstates every cash-value figure the flagship produces. Needs a per-product COI table by issue age and band, from the carrier's illustration.
2. **Deduct `loanDragCost`.** Computed at line 297, written to the result row at line 342, subtracted from nothing. The user is shown a cost that reduces no total.
3. **Reconcile the crediting rate.** Default `iulCreditRate = 0.075` at line 645, plus a header comment at line 14 asserting a 7.5% AG 49-A maximum — against the illustrated product's actual 6.35% cap in `pacificHorizonEcv.ts`. Build the per-product cap table; delete the global constant.
4. **Repoint `ibbotsonModel.ts:104-110`** at `indexCreditingData.ts` — the price-return series `historicalShocks.ts` already uses correctly.

**A correction I owe you:** two defects I reported earlier in this session were wrong. I carried line numbers from the 688-page build into claims about the BASE build. There is **no** interest-savings double-count — `netWorth` at line 565 is `homeEquity + netCashValue − cumulativePropertyTax`, and `homeEquity` at line 545 correctly nets both the mortgage and the HELOC. And there is no COI *inversion* at line 237; line 237 is the amortization row builder. The real finding is the absence of COI entirely, which is worse than an inversion. Both withdrawals are recorded in `data/assumptions.json` and on page 3 of `reports/scorecard.pdf`.

**Step 3 — extract the three shared abstractions** that both sessions' work is now asking for: `RulesTable<T>`, `EvidencePanel` + `withEvidence()`, and `ROUTE_MANIFEST`. Each is written once and pays back across the whole catalogue.

**Step 4 — merge the question lists** into one 22-row file and send it to Perplexity as a single work order.

---

## 6. What Perplexity should do with both folders

Read Session A's `provider_verification_brief.md` first — it is the most detailed research specification either session produced, and questions Q01 through Q09 all resolve into it.

Then read this folder's `data/questions.csv` for the five questions Session A does not cover:

- **AG 49-A maximum illustrated rate per product** (my Q-03) — resolves flagship defect 3 above. Session A does not ask this.
- **S&P 500 price return versus total return, 1957→** (my Q-09) — resolves flagship defect 4.
- **Whether any public dataset reports rent by bathroom count** (my Q-06) — confirm or refute an honest null.
- **AHS table identifiers for "year moved in"** (my Q-07) — unlocks tenant tenure.
- **Fifty-state security-deposit statutes** (my Q-04) — Session A does not ask; the owner did.

Everything else in my list overlaps Session A's and should be answered once, in their format, with the target file named.
