# RCS Backup — 18 September 2026

Everything from the engine-build session, landed on `master` so it survives the
container. Added alongside the Wealth Genome work already on this branch; nothing
existing was overwritten except one file noted below, and that was a strict superset.

---

## The zip drive

**`rcs-engine-kit-2026-09-18.zip`** (156 KB, root — same convention as
`patent360-master.zip` and `rcs-deploy-2026-09-06.zip`)

33 files, 10,082 lines. Self-contained: engines, tests, the legal memo, the Time
Machine showcase page, and a README explaining each. This is the folder to hand to
any other chat.

---

## Patent archive — `patents/2026-09-18/` and `patent360-build-2026-09-18.zip`

Added in commit two. None of it was on `master`; it existed only in a session
scratchpad. The `Patent360/` app at the repo root is the running application — this
is the research and the document build behind it.

- `master-patent-document/` — the PDF and HTML, **plus `build.py`, `adjust.py` and
  the three data modules that generate them**. The generators are the point; a PDF
  alone cannot be extended.
- `source-scans/` — the ten raw scans that resolved the count discrepancy (97 / 90 /
  88 / 78 / 76 / 57 / 20 / 6, each from a different artifact).
- `uploaded-extracts/` — text from PDFs that were attachments rather than repo files.
- `scale-readiness.html` — the scale-blocker readiness page.
- `patent360-build-2026-09-18.zip` (root, 15 MB) — the 342-file PATENT360-BUILD tree.

**Carried forward:** these are claim counts, not granted patents. Six were drafted.
About half the model-proposed candidates failed prior art, verification against real
source, or a §101 attack; Alice scores were revised from a 7.4 mean to 5.4 after an
adversarial pass. Mark "patent pending" only where an application exists — 35 U.S.C.
§292 penalizes false marking per offense.

---

## New engines — `russell-capital/shared/`

Master had no `shared/`, `server/`, or `docs/` under `russell-capital/` at all.
All of this is new to the branch.

| File | What it does |
|---|---|
| `factFinder.ts` | One client record (assets, income, expenses, liabilities) that hydrates every calculator. Provenance is a first-class field — documented / stated / estimated — and the weakest propagates, so a plan built on a guess reports itself as a guess. Capital is only "deployable" after a six-month essential reserve. |
| `nextBestAction.ts` | **The green button.** Twelve deterministic scoring lenses that disagree by construction; weighted vote ranks the strategies, and `lensScores` comes back so you can see which lens objected. `transferRisk()` itemizes what moving money costs — the floor, the death benefit, the tax treatment, the liquidity — instead of netting it into a spread. `sequence()` puts strategies on a calendar with prerequisite seasoning and repeating cycles (a new policy every two years, each on its own surrender clock). |
| `scenarioEngine.ts` | Inflation, rate and tax-policy overlays. Legislative scenarios named by government **structure, not party**, and deliberately symmetric — includes a rate-cutting case. 36-year ZIP-level series for appreciation, rent, insurance and mortgage rates are sourced contracts that throw if unsourced or shorter than the window presented. `describeSeries()` reports the worst rolling decade beside the CAGR. |
| `smallBusinessLending/industryRisk.ts` | 25 trades with NAICS, seasonality, collection lag, margin, collateral, seed multiple. Structure is encoded; **loss experience is not** — rates must carry a source and an as-of date or scoring throws, and rates over 18 months old throw as stale. `loadSbaChargeOffRates()` converts the SBA FOIA extract, dollar-weighted. |
| `smallBusinessLending/loanPricing.ts` | `trueApr()` solves the IRR of the real payment stream — a 1.22 factor over six months of daily remittance is not 44%, it's in the seventies. `buildDisclosure()` refuses to assemble incomplete. **Throws `ConsumerDwellingSecuredError` on anything secured by a principal dwelling, with no override flag.** |
| `smallBusinessLending/prospecting.ts` | Nine distress signals, all public record, each citing its lawful source. Intent and credit concern scored **separately** — desperation is both the strongest buying signal and the strongest default signal. Email and SMS have separate code paths because they have separate legal regimes; SMS throws without a matching, unrevoked consent record. |

Also carried over from earlier in the session (new to `master`):
`realEstateMogul.ts` (PMI + ladder-down strategy), `helocLenders.ts`,
`policyLoanMechanics.ts` (loan-only), `sequenceStress.ts`,
`timeMachineCompliance.ts`, `divorceStateRules.ts`, `patentCatalog.ts`,
`patentStatus.ts`.

## Tests — `russell-capital/server/`

Nine test files. 101 of these are new this session and all pass:

```
smallBusinessLending.test.ts    43 passing
nextBestAction.test.ts          38 passing
scenarioEngine.test.ts          20 passing
realEstateMogul.test.ts         37 passing
```

Full suite in the `russell-capital` repo: **2,351 passing, 95 failing.** The 95 are
pre-existing and environmental — missing `RESEND_API_KEY` and `HEYGEN_API_KEY`, no
server on port 3000, no database. Verified by running the suite with this work
stashed: identical 95. **Zero regressions.**

## Legal — `russell-capital/docs/SMALL_BUSINESS_LENDING_LEGAL.md`

Read this before originating anything. Short version:

- **High-APR commercial advances to businesses** — lawful, disclosure-heavy (CA SB 1235,
  NY CFDL, UT, VA), built.
- **Lending against a delinquent homeowner's residence at triple-digit rates** — not
  built. Fails on four independent grounds: consumer credit under Reg Z regardless of
  stated purpose; HOEPA high-cost mortgage with assignee liability; exceeds criminal
  usury in most states; and foreclosure-rescue statutes target that exact fact pattern.
  **Tax lien certificates** are documented as the lawful instrument that achieves the
  same objective — first position ahead of the mortgage, statutory 8–36%, county as
  counterparty.
- **Paying tax preparers for clients whose revenue fell** — not built. IRC §7216 makes
  disclosure *or use* of return information criminal for the preparer, and the
  commission supplies motive rather than curing it. The lawful Rev. Proc. 2013-14
  consent route is documented instead.
- **SMS campaigns** — $500/message, trebled to $1,500, uncapped, no B2B exemption for
  mobile. Consent capture on the landing page is the whole fix.

---

## Live repo — `russell-capital-systems/`

| Path | Change |
|---|---|
| `shared/timeMachine30.ts` | **New.** The 30-year look-back driven by the client's real current age — a 70-year-old sees the policy issued to the 40-year-old he was. Throws rather than clamping when an age can't carry the window. |
| `server/timeMachine30.test.ts` | **New.** 39 passing. |
| `shared/pacificHorizonEcv.ts` | **Modified — the only overwrite in this commit.** Strict superset: adds `HORIZON_ILLUSTRATION_FACTS` (38 lines) with the AG 49-A max illustrated rate of 6.35%, the 120-month surrender duration, and an honest `stillMissing` list. Nothing removed. |
| `scripts/_showcase_data.ts` | **New.** Renders engine output to JSON so the showcase page's figures come from the engine rather than being transcribed beside it. |
| `showcase/time-machine.html` | **New.** Open it in a browser — no server, no build, no internet. S&P 1996–2025, five Pacific Horizon accounts and the real COI curve are inline. Reshuffle button, borrowable value on every year, liquidity windows ranked by credit still earned *after* the loan, year picker, multiplier toggle, print-to-PDF stylesheet. |

---

## Where the source of truth lives

| Repo / branch | Holds |
|---|---|
| `sam-russell-corpus` → `master` | **This archive.** Everything, backed up. |
| `sam-russell-corpus` → `claude/patent-registry-embed` | Time Machine relabel, committed `1ea41e0`. |
| `russell-capital` → `claude/rcs-aqal-founding-cap-6ttkaz` | The engines, committed `4646a24`. 11 commits ahead of that repo's `main`. |

Note `russell-capital`'s `main` is still the single Aug 12 backup commit `863b3f0`.
The working branch is where everything is.

---

## Not done yet

1. **SBA data not loaded.** `loadSbaChargeOffRates()` is written and tested, but
   `data.sba.gov` is blocked by the build container's egress proxy. Run it outside the
   sandbox. Until then `rankIndustries()` returns only the trades you've sourced — by
   design, rather than inventing rates.
2. **Mortgage statement parser.** Real Estate Mogul takes a `Property[]`; turning 30 PDF
   statements into that array isn't written.
3. **EPFR Design B and C factors.** All three Pacific Life illustrations ran Design A
   (zero performance factors), so the 2.16x for Design C is a break-even computed by
   bisection and labeled as such everywhere. Real B and C illustrations replace it.
4. **Engines not deployed.** They live in `russell-capital`; the live site deploys from
   `russell-capital-systems`. Porting is the next real commit.
5. **No UI for the green button.** `greenButton()` returns the ranking, the plan and the
   lens scores. The chart component that renders them isn't built.
6. **Pre-existing `server/zoom.ts` errors** in `russell-capital-systems` — missing `ws`
   types and two implicit `any`. Untouched by this work; will bite on a clean install.
