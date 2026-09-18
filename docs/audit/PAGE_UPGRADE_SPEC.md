# The 9/10 Specification — What Every Page Must Become

Companion to `PAGE_AUDIT_688.md` (what each page scores) and
`MASTER_BUILD_AND_STRATEGY.md` (which build, what's broken). This document
answers the other half: **what do we actually add to move a page from 2 to 10.**

---

## 0. Baseline decisions, settled before the audit

**"Apex" is not a build.** It appears in `todo.md`, `LAUNCH.md`,
`docs/RECOVERY_PLAN.md` and the DNS handoff docs, and in every case it means the
**apex domain** — bare `russellcapitalsystems.com` as opposed to `www`. There is
no Apex codebase.

**Every build in the corpus, enumerated:**

| Build | Pages | What it is |
|---|---:|---|
| `russell-capital` | **688** | The breadth archive. Not deployed. |
| `sam-russell-corpus/russell-capital-systems` | 310 | **Live.** 2× the server logic, 148 DB tables. |
| `AQAL/aqal-platform` | 94 | Different product |
| `doctor-buddy` | 47 | Different product |
| `stop-fatty` | 9 | Different product |
| `Patent360/client` | 0 pages | Different product |

**The target build is `sam-russell-corpus/russell-capital-systems`.** Everything
below is specified *against that trunk*. The 688 build supplies material; the
trunk supplies the spine.

> **Re-baselined 2026-09-18 14:52Z at trunk `af613fc0`** (after the
> `claude/infinite-banking` merge; `master` and the branch are the same SHA). The
> trunk moved three commits while this document was being written, and the move
> changed §2 and §4 materially. **Read `MASTER_BUILD_AND_STRATEGY.md` §2b first.**
> Short form: the trunk already runs the FRED + FHFA + Zillow spine this document
> asks for (`server/_core/fred.ts`, `server/zipData.ts` → `zip_series`,
> `market_data_points`); what it lacks is the *wiring* from that spine into the
> flagship engines, plus Shiller and SSA. Sections below are annotated where the
> re-baseline changed them; the page contract (§1) and the factor-page pattern
> (§3) stand unchanged.

### The UI you couldn't remember: it's Patent360

You said one of the builds had "a user interface with different colors and
textures." **It's Patent360**, and it is not close — it's the only build in the
corpus with a hand-authored design system rather than shadcn defaults, and the
only one that leaves Inter.

Verified in `Patent360/client/src/styles/` (101 KB of hand-written CSS):

| File | What's in it |
|---|---|
| `tokens.css` | Ink ramp `#030a16 → #1b3d6b`, accent `#0ea5e9`, seal `#f0c040`. **Fraunces** display / **DM Sans** UI / **IBM Plex Mono**, self-hosted. A `[data-accent='green']` block re-casts the *entire* ink ramp, not just the accent. |
| `skins.css` | **Seven complete light "rooms"** switched by `data-skin="1".."7"` on `<html>` — Vellum & Navy (`#F4F0E6` paper / `#12284C` ink), Drafting Paper, Bond & Emerald, Court Grey (oxblood `#932433`)… each with stated contrast targets (7:1 body, 4.5:1 muted, 3:1 hairlines). |
| `variants.css` | **Thirteen stackable texture classes**: `.tx-scan` `.tx-halftone` `.tx-matrix` `.tx-grid` `.tx-leak` `.tx-chroma` `.tx-glitch` `.tx-stamp` `.tx-imprint` `.tx-noise` `.tx-vig` `.tx-wash` `.tx-glow` — real `mix-blend-mode` work, not opacity tricks. |
| `backdrop.css` | Four-layer fixed backdrop: sky wash, procedural skyline, patent-drawing imprint, SVG `feTurbulence` grain at `opacity:0.03`; two blooms breathing on 19s/23s offset cycles; 44s Ken Burns drift. |

**Harvest list, in priority order:**

1. `Patent360/client/src/styles/*` — the whole directory. This is your design
   system. It pairs naturally with the breath-locked bloom and C-major ambience
   already in the trunk; the 19s/23s offset blooms are the same idea, done well.
2. `Patent360/client/src/components/Backdrop.tsx` — Mulberry32-seeded procedural
   SVG skyline, deterministic across renders and screenshots.
3. `Patent360/client/src/components/{Plate,Shell,ui}.tsx` — plate/scrim system,
   a nav shell that scopes a skin to the interior, and a token-driven kit with
   zero Radix dependency.
4. **`AQAL/aqal-platform/server/platform/liveResearch.ts`** — the sleeper. It
   fetches from Perplexity, extracts DOIs, **validates each one with a real
   `HEAD https://doi.org/{doi}`**, runs an adversarial LLM reviewer pass, and
   flags everything `verified: false` until it survives. That is a ready-made
   anti-hallucination citation gate — exactly the component §2 of this document
   needs, already written.
5. `AQAL` motion kit — `GlobalAtmosphere.tsx` (canvas starfield with parallax),
   `CursorGlow.tsx`, `useScrollReveal.ts`, `useParallax.ts`, `PrefetchLink.tsx`
   (hover-prefetch, which is improvement #13 in the strategy doc), `RouteMeta.tsx`.
6. `Patent360/app/uspto.py` — not the USPTO client itself, the **house style**:
   every failure mode returns a typed reason rather than a plausible guess. Adopt
   this pattern for every adapter in §2.
7. `doctor-buddy/server/openrouter.ts` + `mem0.ts` — model router with fallback
   chains (it already names `russell_capital`) and a Mem0 gateway with a
   `samuel_a_russell_capital` namespace.

`stop-fatty` has nothing worth taking. `Patent360/app/mcp.py` is a correct MCP
Streamable-HTTP server — port it verbatim if you ever expose the calculators as
agent tools.

**Do this harvest before the page audit work**, because the design system changes
what a factor page looks like and the citation gate changes how the evidence
spine is built.

---

## 1. The 10/10 Page Contract

Today a typical page is: inputs → one formula → one number → a chart. That is a
**4 at best**, and most of them are a 2 because the formula carries invented
constants.

A 10 has nine layers. A page missing any of layers 1–5 cannot exceed 7.

| # | Layer | What it means |
|---:|---|---|
| 1 | **Deterministic engine** | Math lives in `shared/<name>Engine.ts`, pure, no React, with a vitest golden-number suite. The page renders; it does not calculate. |
| 2 | **Evidence spine** | Every assumption resolves to a named series with a source, a series ID, and an as-of date. No number appears that cannot be traced. |
| 3 | **A distribution, not a point** | The answer is a range with probabilities, produced by resampling real history — not one guess compounded forward. |
| 4 | **Assumption ledger** | Every constant visible, editable, sourced, dated. The advisor can override any of them and see the answer move. |
| 5 | **Method disclosure** | Plain-language "how this number was made", naming the data, the window, and the method. |
| 6 | **Factor pages** | Each material assumption gets its own URL that defends it with the full series. This is the embedding layer. |
| 7 | **A decision, not a number** | What to do, what would change the answer, what to watch, and what would make this the wrong strategy. |
| 8 | **Client-ready export** | Branded PDF carrying sources, as-of dates, the assumption ledger and the required disclosures. |
| 9 | **Registry entry** | Listed in `pageRegistry.json` with intent tags and a `trustworthy` flag so the AI brain can cite and deep-link it. |

### Layer 3 is the one that changes everything

You said it exactly: *"It's not simple math. We're using predictive modeling
based on historical trends and patterns."*

Right now `HOME_APPRECIATION_RATE = 0.05` is hardcoded in
`shared/mortgageKiller.ts:163` and compounds for thirty years. That is one guess,
stated as fact.

The replacement is **block-bootstrap resampling over the real series**. For a
30-year horizon against Case-Shiller (Jan 1987 → Jun 2026, verified), you have
473 monthly observations — 114 overlapping 30-year windows, plus FHFA quarterly
back to 1975 for a deeper draw. You resample contiguous blocks (preserving
autocorrelation and mean reversion, which independent draws destroy), run 10,000
paths, and report:

> *"Across 10,000 paths drawn from 39 years of actual U.S. home-price history,
> this strategy retires the mortgage between year 14 and year 23. Median: year 17.
> In the worst decile — paths that include a 2007-style drawdown in the first
> eight years — it does not beat a conventional payoff at all."*

That last sentence is worth more than every optimistic projection on the site.
**It is also the sentence that survives a compliance review.**

---

## 2. The Evidence Spine — the actual APIs

These are real, free or cheap, and carry the depth you're describing. I verified
the two load-bearing ones directly.

### Already on the trunk at `af613fc0` — do not rebuild

| Source | Where | Status |
|---|---|---|
| **FRED** — `MORTGAGE30US`, `CPIAUCSL`, `CPILFESL`, `DGS3MO/2/5/10/30`, `FEDFUNDS` | `server/_core/fred.ts` | ✅ Built. Dual transport (key or public CSV). As-of + source on every value. Last-good persisted to `market_data_points`. |
| **FHFA HPI** zip5 XLSX, **Zillow** ZHVI + ZORI, **PMMS from 1971-01-01** | `server/zipData.ts` → `zip_series` | ✅ Built, scheduled on boot (`_core/index.ts:17`), upsert, HPI back-cast pre-2000. Pure engine in `shared/zipEngine.ts`; page at `/portal/zip-engine`, catalogued. |
| Page registry the brain reads | `shared/calculatorCatalog.ts` (114 entries, test-verified) → `compositeMind.instrumentBlock()` | ✅ Built. **211 of 320 routes still uncatalogued.** |
| Knowledge registry | `shared/aiMemoryBank.ts` — 28 groups, 86 modules, `unwiredGroups()` = 0 | ✅ Built and wired. |

**Consumers of that spine today:** `erosionRouter`, `inflation`, `forecastSources`,
`outsideForces`, `power`, `rentalEnterprise`, `dataFeedService` and 8 more.
**Not consumers:** `mortgageKiller.ts`, `timeMachineEngine.ts`, `ibbotsonModel.ts`,
`cycleEngine.ts` — zero live-data references in any of them. **That is the gap.**

### Tier 1 — build these first (free, deep, load-bearing)

*(Annotated after re-baseline: rows marked ✅ exist on the trunk; the remaining
work on them is wiring, not building.)*

| Source | Access | Series that matter | Depth |
|---|---|---|---|
| **FRED** (St. Louis Fed) | Free API key, `api.stlouisfed.org` | `MORTGAGE30US` 30-yr mortgage ✅*verified 1971-04-02 → 2026-09-10, weekly, now 6.76%*; `CSUSHPINSA` Case-Shiller ✅*verified Jan 1987 → Jun 2026, monthly, 63.73 → 336.66*; `CPIAUCSL` CPI-U (1947); `DGS10`/`DGS30`/`DGS1` Treasuries (1962, daily); `DPRIME` prime rate (1955); `UNRATE` (1948); `MSPUS` median sale price (1963); `RRVRUSQ156N` rental vacancy (1956); `DRSFRMACBS` mortgage delinquency (1991) | **55 yrs** rates, **39 yrs** home prices, **78 yrs** CPI |
| **Shiller / Yale** | Free CSV, `shillerdata.com` | S&P 500 monthly **price and dividends separately**, CAPE, real rates | **154 yrs** (1871) |
| **FHFA HPI** | Free CSV, `fhfa.gov` | House price index quarterly, by **state and metro** | **50 yrs** (1975) |
| **Zillow Research** | Free CSV | ZHVI home values by **ZIP** (2000), ZORI rents (2015) | 25 yrs, ZIP-level |
| **SSA Actuarial** | Free, `ssa.gov/oact` | Period life tables, AWI, benefit formulas | Annual, authoritative |
| **Census / ACS** | Free API key | Income, home value, rent by county/tract | 5-yr rolling |
| **Treasury FiscalData** | Free, no key | Daily yield curve, I-bond rates | Daily |
| **HUD** | Free API | Fair Market Rents by ZIP, income limits | Annual |

**The Shiller dataset alone fixes a live bug.** `shared/ibbotsonModel.ts` uses
S&P **total-return** data to model IUL index crediting, but indexed policies
credit **price** return only. That roughly 2% dividend yield turns genuine 0%-floor
years (2011, 2015) into credited years, biasing every IUL projection upward.
Shiller gives price and dividends as separate columns — the fix is a data swap,
not a rewrite.

### Tier 2 — paid, worth it for specific hubs

| Source | Cost | For |
|---|---|---|
| **Rentcast** | ~$50/mo | Property-level rent estimates and comps — Real Estate hub |
| **ATTOM** | $$$ | Deed/AVM/tax-assessor records |
| **Polygon.io** | ~$30/mo | Daily index history for backtests |
| **AM Best / S&P** | $$$$ | Carrier financial strength — currently hardcoded in `carrierRatings.ts` |

### Tier 3 — no API exists; maintain as versioned, cited constants

IRS limits have no API. Build `shared/taxConstants/{year}.ts`, each value
carrying the **Revenue Procedure number** and effective date:

```ts
export const LIMITS_2026 = {
  section415c:  { value: 72_000, cite: "Rev. Proc. 2025-32", effective: "2026-01-01" },
  electiveDeferral: { value: 24_500, cite: "Rev. Proc. 2025-32", effective: "2026-01-01" },
  // 120 pages currently carry invented values marked "Simplified" in place of these
} as const;
```

This single module retires the *fabricated-constant* flag on 120 pages.

### The disclosure that makes this an asset

Every calculator gets a footer block, generated from the engine's own manifest —
not hand-written, so it can never drift:

> **How this number was made.** Mortgage rates: Freddie Mac PMMS via FRED
> (`MORTGAGE30US`), 2,897 weekly observations since April 1971. Home appreciation:
> S&P Cotality Case-Shiller National Index (`CSUSHPINSA`), 473 monthly observations
> since January 1987, resampled in 10,000 block-bootstrap paths. Index crediting:
> S&P 500 **price** return, Shiller monthly series since 1871, capped and floored
> per the carrier's filed parameters. Tax limits: Rev. Proc. 2025-32. Mortality:
> SSA 2021 Period Life Table. Data as of 2026-09-18. **This is a projection, not a
> prediction, and not a recommendation.**

That paragraph is the difference between a toy and an instrument. It is also the
single highest-leverage piece of copy on the site, and it appears on all 612 pages.

---

## 3. The Factor-Page Pattern — your embedding question, answered

You asked: *"If they're on the mortgage killer page and the mortgage killer page
is only two pages, then each of the embedded URLs should be designed to back up
all of the different factors."*

**That is exactly the right architecture, and most of those pages already exist —
they're just orphaned and thin.**

The pattern: a hub's engine declares its factors. Each factor gets one page whose
only job is to defend that assumption with the full data. The hub links to it
inline, at the assumption, where the advisor is looking.

**A factor page is not a calculator.** It answers five questions:

1. **What is this number and why does the outcome depend on it?**
2. **What does the full history say?** — the entire series, charted, with recessions marked
3. **What is the range, not the average?** — best/median/worst 30-year windows
4. **When has it broken?** — the regimes where the historical average misleads
5. **What should you assume, and how much does being wrong cost?** — a sensitivity table back into the hub

---

## 4. Worked example — the Mortgage Killer hub

> Factor-page paths below are grouping labels; the BASE destination for each hub is given in `PLAN_RECONCILIATION.md` (hub remap onto `calculatorCatalog.ts` categories).

The engine depends on **eleven factors**. Today it hardcodes most of them.

| # | Factor | Currently | Source | Factor page | Status |
|---:|---|---|---|---|---|
| 1 | Mortgage rate | user input | `MORTGAGE30US`, 55 yrs — **already in `market_data_points` + `zip_series` (pmms, 1971→)** | `/portal/rate-environment` | **wire** — spine exists, engine ignores it |
| 2 | **Home appreciation** | **`0.05` hardcoded, `:163`, used `:324` `:487` `:488`** | **FHFA zip5 + Zillow ZHVI — already in `zip_series`, served at `/portal/zip-engine`** | `/portal/home-appreciation` (or extend `/portal/zip-engine`) | **wire — the single highest-leverage change on the site.** The data is 200 lines away from the constant that ignores it. |
| 3 | HELOC rate | fixed 8.5% | `DPRIME` + margin, 70 yrs | `/portal/reverse-heloc` | **exists, 6.4** |
| 4 | Index crediting | flat 7.5% | Shiller **price** return, 154 yrs | `/portal/iul-historical` | **exists, 8.0** |
| 5 | Policy charges | age-banded, **COI falls after 85** | Carrier filings + SSA life tables | `/portal/illustration-compare` | **exists, 8.0** |
| 6 | Policy loans | **interest computed then discarded** | Carrier participating-loan terms | `/portal/policy-loans` | **exists, 7.5** |
| 7 | §7702 / MEC | **no 7-pay test anywhere** | IRC §7702, §7702A | `/portal/mec-corridor` | **build — compliance-critical** |
| 8 | Inflation | absent | `CPIAUCSL`, 78 yrs | `/portal/inflation` | **exists, 5.9** |
| 9 | Sequence risk | fixed-seed Monte Carlo | NBER cycles + Shiller | `/portal/market-stress-test` | **exists, 7.9** |
| 10 | Income stability | absent | `UNRATE` 78 yrs, `DRSFRMACBS` 35 yrs | `/portal/income-gap` | **exists, 8.0** |
| 11 | Carrier strength | hardcoded ratings | AM Best / NAIC | `/portal/carrier-rates` | **exists, 5.8** |

**Nine of eleven already exist — and all nine are on the trunk.** Two must be
built. Re-baseline correction on the first: `/portal/home-appreciation` is no
longer "no page anywhere defending it" — `/portal/zip-engine` defends
appreciation with FHFA + Zillow at zip level, back to the 1970s where the record
allows. **The hole is that `mortgageKiller.ts` does not read it.** The 5% constant
still compounds for thirty years and drives HELOC capacity while the real series
sits in `zip_series`. The factor page can be `/portal/zip-engine` itself, linked
from the assumption. The remaining genuine build is `/portal/mec-corridor`.

### What `/portal/home-appreciation` must contain to be a 10

- **Case-Shiller national, all 473 months since Jan 1987**, charted, recessions shaded
- **FHFA by state since 1975** — North Carolina's 50-year path is not the national one
- **Zillow ZHVI at the client's actual ZIP** since 2000
- The **distribution of 30-year outcomes**: best window, median, worst. The 2006-entry cohort waited ~10 years just to return to nominal par
- **Real vs nominal** — Case-Shiller deflated by CPI. Long-run *real* appreciation is far closer to 1% than to 5%, and this is the fact that most changes the Mortgage Killer's answer
- **Sensitivity back into the hub**: at 3% / 4% / 5% / 6%, the strategy retires the mortgage in year X / Y / Z, and below R% it loses to a conventional payoff
- **Method + sources + as-of date**

That last bullet is the whole game. An advisor who can say *"here is 39 years of
data, here is the worst case, here is where this strategy stops working"* closes
business that no optimistic projection closes.

### Hub structure

```
/portal/mortgage-killer                    ← hub, in nav
├─ Overview            the calculator, with each assumption linked to its factor page
├─ Assumptions         the ledger — 11 factors, every one sourced, dated, editable
├─ Distribution        10,000 block-bootstrap paths; median, p10, p90
├─ Factors  ▸          11 tabs, each an embedded factor page that keeps its own URL
├─ Compare             vs conventional payoff, vs invest-the-difference, vs recast
└─ Deliverable         branded PDF with the full evidence trail
```

Every factor page keeps its URL. None of them gets a top-nav entry.

---

## 5. Worked example — the Real Estate Mogul hub

**Nine factors. This hub has the weakest supporting cast on the site** — the
rent/cash-flow factor pages all score ≤1.9.

| Factor | Source | Factor page | Status |
|---|---|---|---|
| Rent growth | Zillow ZORI + `CUUR0000SEHA` CPI-Rent (1947) | `/portal/rent-growth` | **build** |
| Vacancy | `RRVRUSQ156N`, 70 yrs, by region | `/portal/vacancy-risk` | **build** |
| Appreciation | FHFA by metro, 50 yrs | `/portal/home-appreciation` | shared with Mortgage Killer |
| Cap rate / exit | FRED CRE series + comps | `/portal/cap-rate-history` | **build** |
| Financing (DSCR) | `MORTGAGE30US` + `shared/realEstateCapacityEngine.ts` ✅tested | `/portal/dscr-capacity` | **promote existing engine** |
| Depreciation & recapture | IRC §168, §1250, §469 | `/portal/depreciation-recapture` | **exists, needs §469 gate** |
| Property tax & insurance | Census ACS + state DOI | `/portal/carrying-costs` | **build** |
| Turnover & capex | BLS + industry reserve studies | `/portal/reserve-planning` | **build** |
| Tenant credit / eviction | Census + court data | `/portal/tenant-risk` | **build** |

Plus the fixes already logged: `:332` headline uses gross value while the chart
below uses equity; the oil-and-gas model returns full principal *on top of* ten
years of 15% distributions with no decline curve; depreciation runs on appreciated
value rather than basis with no §469 passive-loss gate.

**The hub is missing IRR, NPV, equity multiple and any disposition model.** For a
"mogul" tool aimed at high-income clients, that is the gap that matters most —
undiscounted "ROI" shown as a percentage is not an investment metric.

---

## 6. The other named hubs, in brief

**IUL Time Machine** (`/portal/time-machine-calculator`, 5.1) — seven factors.
`timeMachineEngine.ts:182` applies **zero policy charges**, so these are gross
index accumulations presented as illustration values. Before anything else:
borrow the charge stack from `mortgageKiller.ts`, replace the single hardcoded
1994 start year with a rolling-window distribution over every available window,
and lead with the worst and median rather than the best. **And get the AG 49
language reviewed** — three modules assert a universal 7.5% maximum illustrated
rate, which is not what AG 49-A/B says.

**Ecological Retirement Drivers** (`/portal/ecological-drivers`, 4.5) — the most
*conceptually* interesting page on the site and among the weakest built: 1,701
lines, 27 charts, 40 tables, and **zero inputs and zero engines.** It is a
beautiful static poster. Eight factors: longevity (SSA tables), healthcare
inflation (`CPIMEDSL`, 78 yrs), regional cost of living (BLS regional CPI),
sequence risk (Shiller), Social Security claiming (SSA formulas), IRMAA
brackets (CMS), LTC incidence (HHS/ASPE), and family/caregiving structure.
Give it inputs and an engine and it becomes a 9 — it already has the presentation.

---

## 7. The 443 low-value pages — what they actually become

Not deletions. Four destinations:

**A. Factor pages (~90).** The highest-value conversion. A thin
`InflationAdjustedReturnCalculator` (1.8) is worthless as a standalone calculator
— there are a thousand of them online. As **the page that defends the inflation
assumption inside six other tools**, backed by 78 years of CPI, it's a 9. *Same
URL, same topic, completely different job.*

**B. Reference library entries (~200).** Definitional and explanatory pages —
trusts, entity types, product mechanics. They don't need to calculate. They need
to be **correct, cited, dated, and retrievable by the AI brain**. A `TrustsPage`
(2.5) that explains ILIT vs SLAT vs GRAT with current exemption figures and Rev.
Proc. citations is a legitimate 8 as a reference entry. Target length 800–1,500
words with sources — not a chart.

**C. Merge into a canonical sibling (~120).** Seven confirmed duplicate families
plus roughly 113 near-duplicates: eleven variations on Roth conversion, nine on
disability income. Keep the best, 301 the rest, fold any unique content in.

**D. Genuinely retire (~33).** Pages with no topic, no content, and no sibling.

### What makes a formerly-worthless page precious

The pattern is always the same: **stop competing on calculation, start owning the
evidence.** Nobody needs another credit-card payoff calculator. Everybody needs
the page that says *"here is what 35 years of delinquency data says about how
often this plan actually survives contact with a job loss."* You have the data
access to write those pages. Almost nobody else in this category does, because
they're buying calculators from a vendor.

---

## 8. How much content changes

You asked whether 80% needs rewriting. Measured against the contract:

| Layer | Pages needing work | Share |
|---|---:|---:|
| Deterministic engine (L1) | 610 of 688 | 89% |
| Evidence spine (L2) | 688 | 100% |
| Distribution not point (L3) | ~660 | 96% |
| Assumption ledger (L4) | 688 | 100% |
| Method disclosure (L5) | 688 | 100% |
| Factor linkage (L6) | 612 routed | 100% |
| Decision layer (L7) | ~640 | 93% |
| Export (L8) | ~500 | 73% |
| Registry (L9) | 612 | 100% |

**Body copy: roughly 40% rewritten, 60% kept.** The domain explanations are
mostly sound — what's missing is the evidence layer around them.

**Structure and code: closer to 85% touched.** But most of that is mechanical and
scriptable: the disclosure block, the assumption ledger, the registry entry and
the tax-constants swap are all generated from one manifest per engine, not
hand-written 688 times.

**The honest sequence:** build the evidence spine once (FRED + Shiller + FHFA +
Zillow adapters, ~2 weeks), and it upgrades every page that touches it. Build it
page by page and you'll be at this for a year.

---

## 9. Order of work

| # | Step | Why first |
|---:|---|---|
| 0 | Fix the four flagship engine defects; AG 49 language to an actuary | These are what you demo |
| 0b | Harvest Patent360 `styles/` + `Backdrop`/`Plate`/`Shell`/`ui`, and AQAL's `liveResearch.ts` citation gate | Changes what a factor page looks like and how evidence is verified — cheaper before the rebuild than after |
| 1 | ~~Build FRED/FHFA/Zillow adapters~~ → **Wire `mortgageKiller.ts` to `zip_series` + `market_data_points`.** Replace `HOME_APPRECIATION_RATE` with a `zipReport`-fed series; replace the fixed HELOC rate with `DPRIME`-derived; replace the flat 7.5% with the carrier's filed AG 49-A rate (`pacificHorizonEcv` pattern). Same for `timeMachineEngine`, `ibbotsonModel`. | The spine is already running (SPEC §2 "Already on the trunk"). This is the highest-leverage change on the site and it is a wiring job. |
| 1b | Add the two genuinely missing adapters: **Shiller** (S&P price + dividends separately, 1871) and **SSA period life tables**. Shiller fixes `ibbotsonModel`'s total-return bug; SSA fixes the COI inversion with an authoritative mortality curve. | Only real adapter builds left in Tier 1 |
| 2 | `shared/taxConstants/{year}.ts` with Rev. Proc. citations | Retires *fabricated-constant* (11 pages on the trunk, 120 on the 688 build) |
| 3 | Block-bootstrap resampler in `shared/`, fed from `zip_series` | Turns points into distributions platform-wide |
| 4 | Catalogue the 211 uncatalogued trunk routes (start with `/portal/time-machine-calculator`), then `/portal/mec-corridor` | Registry gap on the brain's side; the one factor page with no home |
| 5 | Mortgage Killer hub, all 11 factors wired | Proves the pattern end to end |
| 6 | Generated disclosure block + assumption ledger components | One build, 612 pages |
| 7 | Remaining 20 hubs, one per sprint | Repeatable from here |

Steps 1–5 are roughly a month and convert the flagship from a liability into the
most defensible tool in the category.

---

## 10. What this is worth

The earlier projection put mean effectiveness at 1.20 → 7.4. The evidence spine
is what moves the *value* half of that, and it does something the findability
half cannot:

**It makes the platform's claims checkable.** Right now an advisor who verifies
one AMT figure against their own spreadsheet finds a page that ignores their
input. After this, an advisor who checks the home-appreciation assumption finds
39 years of Case-Shiller, the worst 30-year window, and a sensitivity table. The
first advisor stops trusting the site. The second one starts selling with it.

That is the entire difference, and it is not a design problem or a marketing
problem. It's a data problem, and it's solvable in about a month.
