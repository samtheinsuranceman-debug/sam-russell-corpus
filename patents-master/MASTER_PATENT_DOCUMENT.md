# Master Patent Document
## Every Invention, Every Combination, Explained Like You're in 5th Grade

**Inventor:** Samuel Andrew Russell V
**Assignee:** Russell Holdings Management, LLC — Wilmington, Delaware
**Compiled:** 16 September 2026

> **STATUS OF EVERY ITEM IN THIS DOCUMENT: DRAFT — NOT FILED.**
> No application number exists. Nothing here is patent-pending. "Patent pending"
> is a statement of fact, not of intention — it becomes true only when the USPTO
> issues a number. Claiming it before then is false marking under 35 U.S.C. § 292,
> and since the AIA a competitor who is injured by it can sue. Confirm every status
> with patent counsel before any public claim.

---

# Part 0 — Where the numbers come from

You said: *"you discovered 97 patents. Now you're saying there's 10 or something."*

Both numbers are real. They count different things, at different stages, on
different platforms. Here is every number that has been used, what it counts,
and where it lives.

| Number | What it actually counts | Platform | Where it lives |
|---|---|---|---|
| **97** | The filename of the 5th-grade PDF. **The document's own title page says 90.** | RCS | `RCS_97_Patents_5th_Grade_Explained.pdf`, p.1 |
| **90** | 54 core (PAT-001…PAT-055, no PAT-011) + 36 sister (SI-001…SI-041) | RCS | same PDF, Parts I and II |
| **88** | Raw candidate *seeds* from the machine sweep, **before** de-duplication | JoinAQAL | `knowledge/JoinAQAL_Patent_Discovery_Portfolio.md` |
| **78** | Files on disk in the application corpus (76 applications + 2 index files) | All | `AQAL/patent-applications/` |
| **76** | Actual draft applications: 36 founding + 26 Series A + 6 Series B + 8 Series C | All | same |
| **57** | The code registry — every claim mapped to the module that implements it | RCS | `shared/patentCatalog.ts` |
| **20** | The 88 seeds de-duplicated into real families | JoinAQAL | Discovery Portfolio, "Twenty-Family Ranking" |
| **16** | The 90 folded into filing families (ideas that are one invention wearing five names) | RCS | `docs/patents/RCS_PATENT_PORTFOLIO_CONSOLIDATED.md` |
| **15** | Emergent patents that come into existence only when existing modules are wired together | RCS | same doc, Part 5 |
| **10** | Tier-1 + Tier-2 families recommended for actual first filing | RCS | same doc, Part 3 |
| **6** | JoinAQAL concepts that survived full drafting and structural review | JoinAQAL | Discovery Portfolio |
| **8** | Verified patent-engine modules with real code in `server/patents/` | JoinAQAL | `joinaqal/server/patents/` |

**The plain-English version.** Think of it like a fishing trip. 88 fish came up in
the net. When you sorted them, most were the same fish photographed from different
angles — that left 20. Six were big enough to keep and clean. That is not "losing
82 patents." That is what de-duplication looks like, and it is the reason a filing
package survives an examiner.

The **97/90** number is **Russell Capital Systems**, not JoinAQAL. The **88→20→6**
number is **JoinAQAL**. They were never the same list. Nothing was lost between
them, and the full 90 are all preserved and accounted for in Part 1A below.

---

# Part 1 — The Singles, company by company

A "single" is one invention standing on its own — no combination.

---

## 1A. russellcapitalsystems.com

**On the sheet: 90. In the code registry: 57. Built and running: 42.**

### The honest status count

Every one of the 57 registry entries names the exact file that implements it, and
a test walks every entry and **fails the build** if a path does not resolve. That
test is why these numbers can be trusted:

| Status | Count | What it means |
|---|---|---|
| **built** | 42 | An engine and/or page exists and does the described work |
| **partial** | 9 | Related code exists but does not cover the whole claim |
| **none** | 5 | On the sheet; no implementation located |
| **dropped** | 1 | The portfolio review removed it, with the reason recorded |

*Source: `shared/patentCatalog.ts`. Verified by reading the file, 16 Sep 2026.*

### The 90 fold into 16 families — highest priority first

The 90-item sheet contains a lot of the same invention described from different
camera angles. Filed as 90 thin applications, most get rejected as abstract. Filed
as 16 systems with the interactions claimed, they hold. Ordered here by filing
priority — the order an examiner and an acquirer would each value most.

---

**FAMILY 1 — The Truth Stack** · Tier 1 · *the strongest thing in the portfolio*

*Like you're in 5th grade:* Imagine a classroom where nobody is allowed to say a
fact unless they can point at the exact sentence in the book where they read it.
If they point at the wrong page, the fact gets thrown in the trash before anyone
hears it. Three kids read the same page, and their answers only count if they
agree. And the kid who reads is never the kid who decides what it means.

*The machine version:* An AI may read a public page and report a figure, but must
hand back the exact sentence. The server checks the sentence is really on the page
AND the number is really inside that sentence. Fail either check, the figure dies.
Several models read the same page and merge only if they agree within one percent.
A human-written direction table — not the AI — decides what a figure means.
Forecasters get graded when reality arrives; a bad grade halves a source but never
zeroes it. Every figure waits in an owner approval queue.

*Folds in:* PAT-025 Witness Rule (lead) · PAT-028 Truth Stack (system claim) ·
PAT-042 Forecast Referee · PAT-026 Report Card Machine · PAT-027 Truth Box ·
PAT-048 Mutual Carrier Sentinel · PAT-054 Locked Library Card.
*Dropped:* SI-022 Blockchain Audit Trail — "blockchain" adds nothing to a hash chain.

*In the code:* `server/forecastSources.ts` (`quoteVerified`, `harvestSource`,
`readingFor`, `HARVEST_METRICS`); `shared/mutualIulCarriers.ts` (`Verified<T>`,
`v()`, `unverified()`); `shared/ltcEngine.ts` (`STATE_FIGURE_PROTOCOL`);
`shared/incomeForLife.ts` (`INCOME_PLAN_RULES.neverPrinted`). **VERIFIED.**

*Prior art:* US9087048B2, US9015037B2 (fact verification); US20230370274A1
(AI provenance); US20240296295A1 (LLM quotation verification); PaperTrail
(arXiv 2602.21045); TROVE (arXiv 2503.15289). Component art exists.
**No close art found for the ordered pipeline.**

*Why it matters most:* it is the answer to the only question a regulator, a carrier
or an acquirer will ask about an AI planning platform — *"how do you know it did
not make that up."* Every other family sits on top of it.

---

**FAMILY 3 — The Guardian Ledger** · Tier 1 · *this is what lets an AI touch money*

*Like you're in 5th grade:* Every single thing that happens gets written in a
notebook where each new line contains a fingerprint of the line above it. Tear out
a page and every fingerprint after it stops matching, so everyone can see. The
robot helper has a permission slip listing exactly which chores it may do, whose
money it may touch, how much per chore, how much per week, and when it must stop
and ask a grown-up. Before any money moves, a guard checks it against the family's
own rules, a list of people who are allowed to be paid, a waiting period for new
names, a list of everyone who might be secretly benefiting (the advisor is always
on that list), and a minimum amount that must stay in the jar. The guard answers
allow, hold, or block — and says why.

*The machine version:* Hash-chained fact/decision/consent/outcome ledger; a save
that changes nothing writes nothing; any date replayable; twelve hierarchical
consent scopes with wildcards gating every read; agent mandates with per-action
and rolling ceilings; a fiduciary firewall returning allow/hold/block with every
reason; automations that run once per event fingerprint and never fire on events
they wrote; advice signed with key-plus-fingerprint, never the figure.

*Folds in:* PAT-018 Guardian Ledger (system) · PAT-040 Black Box Advice Packet ·
PAT-050 Consent Autopilot · PAT-052 Estate Paper Detective · PAT-032 Estate
Fragility Replay · the ledger half of PAT-053.

*In the code:* `server/firewall.ts`, `shared/consent.ts`, `server/controlsRouter.ts`.
**VERIFIED — with one gap:** `firewall.ts` executes with `rail: "ledger"`, meaning
**nothing actually moves money yet.** Plaid is declared in `server/integrations.ts`
and implemented nowhere. See E-12.

*Prior art:* US20230370274A1 closest. Agent-governance portfolios at Salesforce,
Microsoft, IBM, JPMorgan are related. **No publication located** reciting the
twelve-scope hierarchy, rolling ceilings, allow/hold/block with conflict list and
reserve floor, non-self-triggering automations, or fingerprint-only signing.

*Counsel note:* claim authorization, transaction evaluation, event safety and
document consistency as **four separate claim sets under one specification** to
survive an obviousness rejection.

---

**FAMILY 2 — The Political Weather Machine** · Tier 1

*Like you're in 5th grade:* Every year since 1945 gets a sticker saying who was in
charge — the president counts for half, the Senate a quarter, the House a quarter.
When the plan asks "how often did taxes go up over twenty years," it only learns
from years whose sticker matches the sticker expected ahead. If fewer than fifteen
matching years exist, it prints a warning instead of pretending. Once a week the
computer reads who holds which seats, which party appointed each judge, and what
the betting markets say — with no passwords at all — and writes it down with the
date. Every guess in your plan that depends on politics carries a "how fast does
this go stale" tag.

*Folds in:* PAT-017 Political Weather Radar (lead) · PAT-022 Political Weather
Machine (system) · PAT-031 Power Pulse · PAT-049 Political Repricer · PAT-044
Half-Life Engine · PAT-036 Tax Shock Map · PAT-029 Program Survival Odds
(second independent claim) · SI-006 Tax Code Change Simulator.

*In the code:* `shared/erosion.ts` (`taxTrajectory`, `burdenAt`); `taxRules`,
`recomputeUnderRules`. **VERIFIED.**

*Prior art:* Ash et al. *What Drives Partisan Tax Policy*; IMF ordered-logit;
ifo WP 198; NBER w33462; Penn Wharton. **No close art** for the lever-share
window-matching rule, the fallback threshold, the dated keyless pulse, the power
swing, or the Jeffreys-hazard survival model.

*Risk:* obviousness. The claims must recite the window-matching rule, the fallback,
the pulse construction and the hazard transformation — **never** "forecast taxes
using politics."

---

**FAMILY 5 — The Debt-to-Liquidity Engine** · Tier 1

*Like you're in 5th grade:* You owe money on your house. Instead of paying it off
slowly like everyone else, you borrow against the house cheaply, put that money
somewhere it grows faster, then use the growth to knock out the mortgage in five
to seven years instead of thirty. Then you do it again with the new equity. Then
two at a time. The machine's job is deciding *which* thing to borrow against,
*in what order*, *at what cost*, and *when to pay it back*.

*Folds in:* PAT-002 HELOC-to-IUL (lead) · PAT-009 Mortgage Elimination Through
Recycling · PAT-014 FIA Collateral Assignment (independent: the two-sleeve split) ·
SI-004 Premium Financing · **the homepage War Chest Transmutation Engine, which
was missing from the 90-item sheet entirely — add it.**

*In the code:* `shared/reverseHeloc.ts`, `shared/policyLoanOptimizer.ts`,
`shared/premiumFinancing.ts`, `shared/fiaCollateralEngine.ts`,
`shared/mortgageKiller.ts`. **VERIFIED — all five exist and run.**

*Prior art:* infinite-banking / bank-on-yourself materials are **weak novelty**.
**No patent located** on sequencing policy loans against mortgage payoff. The FIA
two-sleeve model had **no close art**.

> **🚩 TWO MECHANISMS FROM YOUR TRANSCRIPT ARE MISSING FROM THE ENGINE.**
>
> **(1) Account value vs. cash value.** You were emphatic: *"you don't get credited on
> how much cash is in the policy. You get credited on what's called the account
> value"* — the monotone sum of every premium and every credit ever, which is why 95%
> of the money can leave on day two and the credit still lands on the full figure.
> `shared/mortgageKiller.ts` computes on **`cashValue`**. The account-value model does
> exist in this repo — 291 occurrences, principally `shared/policyLoanMechanics.ts` and
> `shared/policyMultiplier.ts` — but **`mortgageKiller.ts` has zero imports.** It is a
> standalone file, and `policyLoanMechanics.ts` is imported by five other modules, none
> of them this one. So the engine understates the mechanism it exists to sell, and the
> claim is missing its most distinctive element. *(I initially wrote that account value
> was absent from the platform entirely; I checked more broadly and that was wrong —
> it is present, it is simply not wired to this engine.)*
>
> **(2) One-day threading and multi-policy threading.** Premium in, 95–96% back out the
> next day as a loan, applied as a principal-only payment, a different bank each cycle;
> and where capacity allows, the same dollar threaded through two or three carriers in
> sequence before it reaches the bank, building two or three account values at once.
> **Nothing in the repository models this.** No `thread`, no day-two draw, no
> cross-carrier sequencing. `policyCount` in `server/routers.ts:6236` is a count, not a
> sequence.
>
> Both of these are exactly the kind of specific, non-obvious, hard-to-design-around
> mechanism that survives a §103 rejection — which is more than can be said for
> "borrow at a low rate, deposit at a higher one," which is what the current claim
> reduces to and which infinite-banking literature has published for decades.

*See E-4 — this family becomes far stronger when its five engines are joined.*

---

**FAMILY 6 — The Suitcase** · Tier 1 (scheduler) / Tier 2 / Tier 3

*Like you're in 5th grade:* Packing a suitcase in a fixed order so the heavy things
go in first and nothing gets crushed. Twenty-nine tax strategies, always in the same
order: the basics, then the easy reducers sorted by how sure and how cheap they are,
then the deduction engines sized to exactly fill the room under your tax bracket,
then charity every third year, and the Roth conversion **last, counted as a cost,
not a win.** Any number without a source doesn't get to size a step.

*Folds in:* PAT-035 Suitcase Packer (lead) · PAT-012 100% Roth Conversion ·
PAT-005 Tax-Free Income Waterfall (narrowed to eight sources) · SI-007, SI-037,
SI-030, SI-041, SI-010 as dependents.
*Dropped:* SI-008 CRT, SI-042 Estate Freeze — textbook strategies, weak software claim.

*In the code:* `shared/taxSchedule.ts`, `shared/taxRules.ts`, `shared/taxBracketEngine.ts`.
**VERIFIED.**

*Prior art:* **CROWDED** — RightCapital, Income Lab, RetireSmartIRA, Holistiplan,
Corvee, TaxPlanIQ all do waterfalls, Roth modeling and IRMAA. **No close art** for
the 29-family fixed order with Roth-last-as-cost, the "unverified inputs never size
a step" rule, or the sealed rule-version delta.

---

**FAMILY 4 — The Property Machine** · Tier 1 (partly) / Tier 3 (partly)

*Like you're in 5th grade:* Your zip code's house prices come from two different
record books — an old one and a new one — and where they're taped together, the
machine **draws the seam and labels it** instead of hiding it. You pick which year
to start from, and every average recomputes from your window with the window
printed right beside the number. Then each year the rentals' tax savings buy
insurance inside a trust, the trustee borrows against it, and pays down the
mortgages proportionally. The whole thirty years runs **twice** — with the loop
and without it — and the difference is the loop's own score.

*Folds in:* PAT-020 Property Machine (system) · PAT-024 Zip Time Machine (lead) ·
PAT-019 Double-Run Trust Loop (independent) · PAT-034 House Budget Referee ·
PAT-039 Household Resilience Lens · SI-034, SI-029, SI-009 (dependents only).

*In the code:* `shared/zipEngine.ts` (splice, window, cohort, `amortisation`),
`shared/rentalEnterprise.ts` (FEMA hazard). **VERIFIED.**

*Prior art:* Zillow US11068911B1, US8676680B2; PropData, ZipSnapshot,
HousingHandbook. Ingredients conventional. **No anticipation located** for the
provenance-labeled splice with dependency-wide recomputation, the count-returning
cohort query, the named binding rule, the composite hazard score, or the
with-and-without run.

---

**FAMILY 7 — The Lifetime Income Chain** · Tier 1 (three claims) / Tier 3 (rest)

*Like you're in 5th grade:* A calculator that **refuses to answer** when the money
you fed it still owes tax — it points you at the conversion page instead. It will
only print a payout number that a real person typed off a real rate sheet with a
link and a date. And it figures out *when* your inheritance is likely to arrive,
not by guessing, but from the government's own survival table for the person you'd
be inheriting from — printing the reason the date range is as wide as it is.

*Folds in:* PAT-021 Lifetime Income Chain (system) · PAT-016 Money That Says No
(lead: the refusal gate) · PAT-037 Inheritance Arrival Meter and PAT-038 Timing
Dial (independent) · PAT-033 Future-Self Negotiator · SI-025, SI-005, SI-031,
SI-032, SI-039, SI-014 (dependents or dropped).

*In the code:* `shared/incomeForLife.ts`, `shared/inheritanceEngine.ts`,
`shared/longevityEngine.ts` (SSA survival table), `shared/ltcEngine.ts`. **VERIFIED.**

*Prior art:* Cannex, Annuity Intelligence, eMoney, MoneyGuide — annuity comparison
and multi-generational planning are **crowded**. **No close art** for the arrival
meter's tax-typed, probability-weighted, completeness-gated calculation, or the
survival-curve timing dial.

---

**FAMILY 8 — The Time Machine** · Tier 2 · *file narrowly*

*Like you're in 5th grade:* Run your policy against what actually happened for the
last 10, 20 or 30 years and show it right next to the salesman's forward picture.
Then run ten thousand made-up futures — and in **every single one**, the policy's
floor and ceiling are enforced year by year, not just at the end.

*In the code:* `shared/timeMachineEngine.ts`, `shared/monteCarloEngine.ts`,
`shared/ibbotsonModel.ts`, `shared/indexCreditingData.ts`. **VERIFIED — with a
defect:** three separate historical index datasets and **two different functions
both named `calculateCreditedRate`** that share no code. See E-6.

> **🚩 THE MOST IMPORTANT FINDING IN THIS DOCUMENT — PAT-010 is not the invention
> you described.** In your own recorded words, the Time Machine works by showing an
> **imaginary reference policy** written 100–150 years ago whose premiums are orders
> of magnitude larger than the client's. Because that pile is roughly a thousand times
> bigger, a legally displayable AG49-compliant movement on the imaginary policy —
> *"we might only show a 1.3% increase"* — corresponds to a far larger credit on the
> client's policy, *"which comes out to a 45% interest credit."* You said you verified
> this with Securian and Pacific Life and were sent to compliance. That **ratio
> construct is the invention**, and it is **not in `timeMachineEngine.ts`.**
>
> What the code actually does: `generateDualIllustration` runs one illustration at a
> flat AG49 rate and a second at blended historical index rates, side by side.
> `generateTimeMachineOverlay` does the same thing for existing calculators. There is
> no reference policy, no premium-scaling factor, no ratio mapping, and no compliance
> envelope. **I read both functions end to end. The mechanism is absent.**
>
> This matters enormously, because the implemented version is precisely the version
> with the strongest prior art against it — AG49-A *already requires* historical
> disclosure beside the illustration, and Ensight, Zinnia, iPipeline and WinFlex all
> ship it. The version you actually invented is the one with a specific, non-obvious
> mechanism, a named regulatory rationale, and two carrier compliance desks having
> looked at it. **Build the ratio construct, and Family 8 moves from Tier 2 to a
> Tier 1 candidate. Until it is built, PAT-010 is a paper patent sitting on top of
> crowded art.** This is the single highest-value engineering item in the portfolio.

*Prior art:* **STRONG ART.** AG49 and AG49-A already *mandate* a capped-and-floored
benchmark with a 25-year lookback and *require* historical disclosure beside the
illustration. Commercial back-testing exists at Ensight, Zinnia, iPipeline, WinFlex.
The dual display is close to what the guideline already requires. **No close art**
for path-level floor-and-cap enforcement inside a full policy cash-flow Monte Carlo,
or for the regime split with the correlation refusal. **Claim only those two.**

---

**FAMILY 9 — The Listening Site** · Tier 2 · *exposed at the top, strong underneath*

*Like you're in 5th grade:* A microphone on every page, but your voice never leaves
your own computer. One question goes to every AI that has a key; the ones that fail
are **named out loud**; a lead AI only combines answers when more than one actually
answered. The public hears ideas and never numbers; the client hears everything.
Twelve rules find the questions you never thought to ask — and you only see them
after saying yes at each step, and never again for thirty days.

*In the code:* `server/ultraAI.ts` (eleven providers), `shared/unaskedQuestions.ts`
(twelve rules), and — **upgraded on this pass** — a Whisper Coach that is far more
built than I previously credited: `shared/whispererEngine.ts` (578), `server/whisperer.ts`
(512), `server/whispererReports.ts` (498), `server/whispererDb.ts` (285),
`server/whispererVision.ts` (104), plus two test files. **2,142 lines total.** The
objection-prediction claim is real and typed: `Objection.probability` is documented in
the source as *"0 to 1: how likely it surfaces in the next five minutes."* Alongside it,
`inferDecisionType` (driver / analytical / amiable / expressive), `detectPhase`
(opening → discovery → presentation → objections → close), `talkStats` over a rolling
three-minute window, `moodFrom` over tone/body/energy/attention signals, and
`priorObjections` carried in from earlier calls.
**This is reduction to practice, and you have told me you are running it on live calls.**
I rated the objection pipeline "potentially stronger" in the previous revision on the
strength of the specification. It is now verified in source. **PAT-003 is the strongest
single claim in Family 9 and should lead it.**

**VERIFIED — with a serious gap:** `server/_core/llm.ts` hard-codes
one gateway and throws unless its key is set, so **twenty-four portal AI features go
dark whenever the owner's own keys are the ones present.** See E-10.

*Prior art:* **US20250225587A1 closely anticipates** the specialized-model digital
advisor. US20230074406A1, US20230075411A1 related. Gong, Chorus, Cresta, Uniphore,
Zoom AI, Jump, Zocks for meeting intelligence. **Generic multi-model answers are
exposed.** Potentially stronger: the future-objection pipeline that pre-builds the
calculation, quorum-gated synthesis with truthful failure disclosure, consent-gated
unasked questions, and the before-and-after confidence score.

---

**FAMILY 10 — Career-to-Home** · Tier 2

*Like you're in 5th grade:* What did becoming a doctor actually cost? Not just
tuition — the interest that piled up while you were still in school, plus all the
money you *didn't* earn during the low-pay years, plus what your commute really
costs per hour. Then it compares you to the government's own pay tables, but only
shows peers when at least five real ones exist.

*In the code:* `shared/careerEngine.ts`, `shared/forgiveness.ts`. **VERIFIED — but
disconnected:** both model the same federal loan independently and share nothing. See E-9.

*Prior art:* BLS OEWS is the benchmark; Doximity, Medscape, White Coat Investor have
calculators. **No close art** for the integrated ledger with accrued training cost,
opportunity cost, commute-adjusted hourly pay, percentile, and the page-as-form.

---

**FAMILY 11 — Wealth Genome + Cooling-Off** · Tier 3 (genome) / Tier 2 (cooling-off)

*Like you're in 5th grade:* Twenty-plus facts about your household become one
profile that picks your strategies. And when you're about to panic-sell at a loss,
the system reaches out *first*, shows you the evidence, and helps you wait a week.

*In the code:* `shared/retirementDNA.ts`, `shared/livingRiskProfile.ts`.
**VERIFIED — but `livingRiskProfile.ts` is ORPHANED.** Nothing imports it. It is
SI-035's reduction to practice and it is not wired in. See E-8.

*Prior art:* **US20230075411A1 closely anticipates** profile-driven strategy
selection. **Andes Wealth Technologies holds a patent on investor risk drift —
drift is TAKEN.** The genome is exposed. The emotional-sale cooling-off had **no
close art.**

---

**FAMILY 12 — The Cascading Core** · Tier 3 standalone / **Tier 1 as the vehicle for E-1 and E-2**

*Like you're in 5th grade:* 35 calculators all snapped onto one base plate. Change
one number, everything connected changes.

*In the code:* `shared/journeyEngine.ts`, `shared/taxBracketEngine.ts`
(`runDynamicTaxProjection`, imported by **72 files**). **VERIFIED.**
Also `shared/weaponizeEngines.ts` (981 lines, PAT-015's engine) — **complete and
orphaned.** Its `transformToClientView` strips `internal_` and `commission_`
sections for client mode. *I read this function line by line; it is real.*

*Prior art:* eMoney, MoneyGuidePro, RightCapital all model connected plans. The base
"connect the calculators" claim is **weak alone.**
*Dropped:* SI-018 Commission Optimization Router — a system that routes clients by
advisor commission is a conflict-of-interest exhibit, not a patent.

---

**FAMILY 13 — The Money Globe** · Tier 3
Twelve domains × four depth layers; empty cells are labeled gaps; navigation, proof
and search generated from one registry so they cannot disagree. Faceted navigation
is common; the 12×4 map screened **open**, the self-fetching site audit **crowded**.

**FAMILY 14 — The Ten Ecological Threats** · Tier 2 **once built**
Ten retirement dangers uncorrelated with market return, one explainable score.
**NOT IN THE CODE.** There is a `riskScoring` router and a page, but no engine that
computes ten named threats from sourced series. **No close art found.** Build before filing.

**FAMILY 15 — The Divorce Shield** · Tier 2 **once built**
Fifty states, five scenarios, safe vs. exposed. **NOT IN THE CODE.**
`client/src/pages/portal/DivorceCalculator.tsx` renders and **calls zero procedures**;
there is no fifty-state rules table. **No close art found** — which makes it worth
a week of work.

**FAMILY 16 — Found in the code, on no sheet**
`shared/cryptoCycleEngine.ts` (halving-cycle accumulation, Tier 4 — crowded) ·
`shared/multiPropertyMyga.ts` on `mygaWaterfall.ts` (Tier 3) ·
`shared/growthAnnuityEngine.ts` (Roth inside the contract, Tier 3) ·
`server/controlsRouter.ts` fact-suggestion pipeline with client-only acceptance
(**belongs in Family 3 as a dependent; on no sheet**).
*Not patents:* the long-timer scheduler, memory gate, spreadsheet readers, dual FRED
transport — good engineering. The entrainment layer and reward sound — design patent at most.

---

### The 15 emergent RCS patents — what appears only when the wiring happens

These do not exist today. Each names the exact connection that creates it.
**Order of wiring by payoff: E-10, E-1, E-2, E-4, E-3, E-7, E-14, E-6, E-5, E-8, E-9, E-13, E-15, E-11, E-12.**

| # | Name | The wiring | What becomes patentable |
|---|---|---|---|
| E-1 | One Tax Future | `taxBracketEngine` consumes `erosion.taxTrajectory` instead of its own model | All 35 calculators move with one politically-conditioned, sealed tax path |
| E-2 | Every Projection Breathes with FRED | `server/inflation.ts` replaces hard-coded 3% in ~10 pages | One sourced, dated deflator across the whole suite *(also fixes a real bug: two pages discount with `(1-r)` where the rest compound with `(1+r)`)* |
| E-3 | The Sealed Stochastic Plan | Move `monteCarloEngine` to a server router, seed deterministically | A probability band that can be re-run and proved later |
| E-4 | **The Collateral Ladder** | One `shared/collateralLadder.ts` over all five borrowing engines | Sequencing draws across heterogeneous collateral by after-tax cost and liquidity — **the general form of PAT-002, PAT-009 and PAT-014 at once; screen found nothing** |
| E-5 | Hazard-Aware Recycling | Feed `zipEngine` into the three mortgage engines | Each recycling cycle's equity discounted by that zip's own hazard and drawdown |
| E-6 | Time Machine Monte Carlo | Unify three index datasets; block-bootstrap the paths | Back-test, illustration and probability bands **cannot disagree about the past** — this is how Family 8 gets past AG49 |
| E-7 | Mortality-Weighted Care and Estate | Import `longevityEngine` into LTC, income, estate, inheritance | The plan cannot assume one death date for income and another for care |
| E-8 | Drift-Triggered Cooling-Off | Wire orphaned `livingRiskProfile` into PAT-008 | A trigger on **measured drift between dated snapshots** — which the Andes patent does not describe |
| E-9 | Career-to-Forgiveness | Hand the career loan path to the survival model | Career cost **with** forgiveness, **without** it, and the expected value between |
| E-10 | **The Council Everywhere** | One adapter so `invokeLLM` falls back to `ultraAI`'s eleven providers | Every AI feature under Family 9's quorum and disclosure rules — **the single most valuable wiring change for the product** |
| E-11 | Advisor Memory Under Consent | Actually write and read the `aiMemoryNotes` table, through consent scopes | Memory partitioned by consent scope, revocable per scope — **nothing in the located art does this** |
| E-12 | The Firewall Moves Money | Add one rail to `server/firewall.ts` | Family 3 goes from a control layer to a fiduciary agent — **the claim an acquirer pays for.** Needs counsel and a bank first |
| E-13 | Engines That Raise Their Hand | Every engine publishes into the `unaskedQuestions` queue | The emergent question chosen across all findings, not one rule list |
| E-14 | One Report Card Path | Add the review pair to two routers | Not a new patent — but Family 1's grading claim **is only defensible if a human can actually enter an outcome** |
| E-15 | Ten Threats, Sourced | Build Family 14 from series already held | A danger score whose own confidence comes from the share of verified inputs |

---

## 1B. joinaqal.com

**Founding applications: 10 (JQ-L1). Machine-swept candidates: 88 → 20 families → 6 drafted.
Verified engine modules with real code: 8.**

### The 8 verified engine modules — every one read line by line

| # | Module | Lines | What it actually does | Verdict |
|---|---|---|---|---|
| JQ-a | `server/patents/calibrationBus.ts` | 152 | Trimmed-mean outlier guard + per-model, per-axis calibration weights accumulated from real scoring history, with a cold start at `MIN_SAMPLES` | **REAL — strongest JQ asset** |
| JQ-b | `server/patents/voiceFeatures.ts` | 285 | Energy-gated, lag-bounded pitch estimator that kills the silent-frame false-pitch and subharmonic-bias failure modes of naive autocorrelation | **REAL — DSP, not a wrapper** |
| JQ-c | `server/patents/ledger.ts` | 117 | Canonical JSON (stable key order at every depth) → SHA-256 chain; `verifyChain` recomputes every link and returns the first bad id | **REAL** |
| JQ-d | `server/patents/achievementFloors.ts` | 119 | A per-line floor that can only rise. `nextFloorState` is pure, clamps to [0,1], rejects non-finite and negative hours | **REAL** |
| JQ-e | `server/patents/dimensionIsolation.ts` | 69 | `Object.freeze` isolation views | **REAL BUT NARROW — see warning below** |
| JQ-f | `server/patents/computeFabric.ts` | 58 | Pluggable fabric interface with a software default | **REAL — thin** |
| JQ-g | `server/patents/provenance.ts` | 32 | Research provenance rows | **REAL — thin** |
| JQ-h | `server/patents/assessmentEvidence.ts` | 62 | Computes and persists per-assessment patent evidence | **REAL — with a defect, see below** |

> **⚠️ CORRECTION ON THE RECORD — `dimensionIsolation.ts`.**
> One of the AI team members reported this module as performing "hardware memory
> isolation zones" and "context-blind token scrubbers" and scored it 9.5/10 urgency.
> **That is fabricated.** The file is 69 lines of `Object.freeze`. Its own header says:
> *"The hardware enclaves named in the patent spec (ARM TrustZone / AWS Nitro / Apple
> Secure Enclave) are the hardware embodiment… NOT implemented here, and nothing in
> this repository claims it is."* Do not let a hardware claim reach counsel on the
> strength of this file.

> **⚠️ DEFECT — `assessmentEvidence.ts`.** `persistAssessmentPatentEvidence` runs
> inside a `catch` that logs *"persistence skipped."* Patent evidence that silently
> skips is not evidence. **Fix before relying on it as reduction-to-practice proof.**

> **⚠️ PHANTOM SYMBOL — on the record.** An earlier scan of mine reported a symbol
> named `starvationCurves` in `shared/archetypesData.ts`. **It does not exist.** My
> export extraction truncated at 50 characters and invented it, and a candidate patent
> was built on top of it before I caught it. The real exports are `ARCHETYPES`,
> `archetypeProfiles`, `isolationFindings`, `starvationCards`, `integratedProfiles`,
> and `starvationForLine`. The extraction window has been widened.

> **🚩 ESCALATED — the rarity number now contradicts the patent claim itself.**
> `calculateCompositeRarity` in `server/routers.ts` uses a **geometric mean** of axis
> rarities; its own comment says "not product, which would be too extreme."
> `calculateCompositeRarityMultiplicative` also exists and **is** imported — by
> `patents/assessmentEvidence.ts`. So the number shown to the user and the number stored
> as patent evidence are already computed two different ways.
>
> The Treasure Map settles what the claim is supposed to be, and it lands on the other
> side: brick **L1-04 "Rarity Multiplier"** is defined as *"Multiplies your scores
> together instead of averaging, to find super-rare people,"* screened as **"No — does
> not exist"** anywhere else, and its stated novelty is precisely that *"Nobody else
> multiplies scores from a team of AIs. Everyone else averages, which hides rare
> people."* It is also brick #1 of **RarityForge**, the 2-way combo ranked third for
> revenue at 9/10.
>
> **So the distinguishing feature of the claim is multiplication, and the shipped
> user-facing number is an average.** A geometric mean *is* a kind of averaging — it is
> the n-th root of the product, which is mathematically designed to pull extremes back
> toward the middle, the exact effect the claim says hides rare people. If counsel files
> the multiplicative claim, the product does not practice it on the surface a user sees.
> If you file the geometric-mean version, the stated novelty evaporates.
> **Pick one and make the code say it.** This is now a filing blocker, not a preference.

### The 20 JoinAQAL families, ranked — honest scores

The readiness score weighs source support, novelty, non-obviousness, §101
eligibility, enablement and claim coherence. **It is a triage device, not a
probability of allowance.**

| Rank | Family | Title | Score | Disposition |
|---|---|---|---|---|
| 1 | FAM-005 | Idempotent Multi-Channel Accountability Reminders with Local-Date Claims | 6.4 | Hold |
| 2 | FAM-003 | Hybrid Browser/Server Speech-to-Text Capture Failover | 6.7 | Pursue after evidence |
| 3 | FAM-009 | Fail-Closed Marketing Email Opt-Out Enforcement | 6.2 | Hold |
| 4 | FAM-001 | Multi-AI Consensus Scoring with Trimmed Mean and Confidence Discount | 5.9 | Hold |
| 5 | FAM-004 | Privacy-Preserving Opportunistic Audio Deletion Sweep | 5.8 | Hold |
| 6 | FAM-002 | Continuous Transcript Segmentation via Fallback Marker Matching | 5.6 | Pursue after evidence |
| 7 | FAM-008 | Resume-First Asynchronous Audio Assessment Synchronization | 5.2 | Discard |
| 8 | FAM-010 | Client-Side Code-Split Corpus Search with Synonym Expansion | 5.2 | Discard |
| 9 | FAM-019 | Dynamic 3D Cosmos Canvas with Depth-based Parallax | 5.2 | Discard |
| 10 | FAM-006 | Multimodal Behavioral Fusion for Intelligence Profiling | 5.1 | Hold |
| 11 | FAM-011 | Voice-First Elicitation and SOKA Gap Scoring | 4.8 | Discard (§101) |
| 12 | FAM-020 | Age-Adjusted Developmental Cohort Norming | 4.6 | Discard (§101) |
| 13 | FAM-015 | Voice-Only Immutable Append-Only Commitment Ledger | 4.4 | Discard |
| 14 | FAM-007 | AI-Driven Developmental Stage Underwriting Rubric Injection | 4.2 | Discard (§101) |
| 15 | FAM-013 | Algorithmic Bimodal Matching with Generational Adjustment | 4.2 | Discard |
| 16 | FAM-016 | IME Composition State Tracking with Delayed Reset | 4.1 | Discard |
| 17 | FAM-018 | In-Memory Sliding-Window Rate Limiting with Blocklist | 3.8 | Discard (§101) |
| 18 | FAM-014 | Dynamic Goal-to-Practice Assembly and Deduplication | 3.7 | Discard (§101) |
| 19 | FAM-012 | Automated AI-Driven Outcome Engineering and Derailment Prediction | 3.5 | Discard (§101) |
| 20 | FAM-017 | Live Web Search-Based Factual Claim Verification | 3.1 | Discard (§101) |

**Read this honestly.** Nothing on the JoinAQAL side scores above 6.7, and twelve of
twenty are marked Discard — most on §101 (Alice), because they reduce to "score a
thing, then decide based on the score," which is the textbook abstract idea. The
**four assets worth real money on this platform are the four modules with real
machinery in them: the calibration bus, the pitch estimator, the hash chain, and the
floor ratchet.** Those are apparatus-flavored. The rest are gating and correlation.

**The 10 founding JQ-L1 applications** live at
`AQAL/patent-applications/founding/series-jq-joinaqal/` and are the implemented
originals for joinaqal.com — these are **reduction to practice**, which is the single
most valuable thing a provisional can carry.

---

## 1C. Dr. Buddy

**Founding applications: 6 (DRB-L1). Application code: ZERO.**

Dr. Buddy exists today as an operating **document protocol** — `buddy_memory/MEMORY.md`,
`SKILL_BACKUP.md`, `buddy_journal/`, `buddy-confessions/` — not as a running service.
The six DRB-L1 applications describe the document-protocol embodiment honestly and
specify the service embodiment.

**What that means for filing:** a provisional can be filed on a specified-but-unbuilt
embodiment, but enablement is carried entirely by the specification, and the
twelve-month clock starts anyway. **A paper patent on an unbuilt service is the
weakest thing in this portfolio and the most expensive to convert.** The right move
is to build the service first. You asked for "an extreme build that is super
functional" — that build is what turns these six from paper into reduction to practice,
and it is the highest-leverage engineering on the Dr. Buddy side.

The three DRB super-emergent applications (AQAL-DRB-S1, S2, S3) are Series C and are
**specified only** — same caveat.

---

## 1D. Drass Wealth Management

**Original inventions: 0. And that is correct.**

Drass is a WordPress plugin (`drass-wealth-tools`, v1.5.0) that licenses and presents
RCS engines to a third party. Its SSO module (`includes/class-dwt-sso.php`, ~330 lines)
is HS256-only — it **rejects any other `alg` outright**, uses `hash_equals` on both
signature and nonce, checks `exp`/`nbf`/`iss`/`aud`, holds a server-side single-use
nonce in a transient, and keys users on the RCS subject id, **never on email.**

That is a genuinely correct JWT verification implementation — most are not — but
correct cryptographic hygiene is **not patentable**; it is the known-good way to do it.
Drass's value is commercial (a licensed distribution channel), not inventive.
**Nothing here should go to counsel.**

---

# Part 2 — The Combinations

## Read this before the ladder

You asked for combinations from two all the way to twelve or fourteen. Here they are,
every tier, priority-ordered. But you are paying for this, so you get the truth with it:

> **In patent law, arity is not strength. It is the opposite.**
> Every element you add to an independent claim makes the claim **narrower**, and a
> narrower claim is easier to design around. An infringer only has to omit **one**
> element to walk free. A 14-element claim gives a competitor fourteen different doors.
> A 3-element claim gives them three.

So the ladder below is real and complete, but its **shape is inverted from what you
might expect**: the 2-, 3- and 4-way combinations are the commercially valuable ones.
The 8-way through 14-way combinations have three legitimate uses, and only three:

1. **Continuation and dependent-claim material** — file the narrow ones as dependents
   under a broad independent claim, so if the broad claim falls in prosecution you
   still own the specific system you actually built.
2. **Demonstrating non-obviousness** — a long chain of interactions is evidence that
   a person of ordinary skill would not have predicted the result (KSR v. Teleflex).
3. **Trade-secret and marketing description** — the full system is what you sell.

**What I recommend:** file the 2-, 3- and 4-way combinations as the independent
claims. Carry 5-way through 14-way as dependents inside those same specifications.
That gets you every combination you asked for, in one filing package, without paying
for fourteen applications that each protect less than the one below it.

---

## Tier 2-WAY — 14 applications · **highest commercial value**

*Already drafted and on disk at `AQAL/patent-applications/`.* Ordered by strength.

| Rank | Ref | Title | Platform | Why it ranks here |
|---|---|---|---|---|
| 1 | AQAL-C-18 | Adaptive Voice Consensus | AQAL | Pitch estimator + calibration bus — **both components are real machinery**, not gating. Strongest 2-way. |
| 2 | AQAL-C-01 | Consensus-Driven Coaching Synthesis | AQAL | Consensus + evidence-mapped protocol; the evidence binding is the novel half |
| 3 | AQAL-C-03 | Voice-Based Weakness Identification | AQAL | DSP → deterministic constant-time diagnostic |
| 4 | AQAL-RCS-E5 | Consensus-Scored Wealth-Capacity Profile | AQAL × RCS | First true cross-platform claim; both sides implemented |
| 5 | AQAL-RCS-E6 | Floor-Verified Advisor-Client Matching | AQAL × RCS | The floor ratchet is the strongest AQAL primitive; matching is the weak half |
| 6 | AQAL-C-05 | Staged Weakness Identification Engine | AQAL | Versioned rubric banding — reproducible by construction |
| 7 | AQAL-C-02 | Transparent Integral Framework | AQAL | Four-quadrant mapper + audit |
| 8 | AQAL-C-06 | Coaching Transparency Framework | AQAL | |
| 9 | AQAL-C-27 | Voice-Driven Cognitive Coaching | AQAL | |
| 10 | AQAL-C-30 | Voice-Driven Cognitive Assessment | AQAL | |
| 11 | AQAL-C-28 | Transparent Cognitive Assessment | AQAL | |
| 12 | AQAL-TRI-S7 | Weakness-to-Wealth Intervention Router | Tri | Specified only |
| 13 | AQAL-DRB-S1 | Assessment-Informed Companion Coaching | AQAL × DRB | Specified only — DRB has no code |
| 14 | AQAL-DRB-S3 | Longitudinal Wellbeing-Cognition Correlator | AQAL × DRB | Specified only; correlation claims are §101-exposed |

**Plus the RCS 2-way combinations that are not yet drafted as applications** —
these come from the emergent list and are stronger than most of the above:

| Rank | Emergent | Combination | Status |
|---|---|---|---|
| **A** | E-1 | Political tax path × the 35-calculator suite | **Not drafted. Draft it.** Highest-value 2-way in the whole portfolio |
| **B** | E-10 | Quorum council × every portal AI feature | **Not drafted.** Also the best product change |
| **C** | E-8 | Measured risk drift × behavioral cooling-off | **Not drafted.** Steps around the Andes patent |
| **D** | E-9 | Career loan ledger × program survival hazard | **Not drafted.** |
| **E** | E-11 | AI memory × consent scopes | **Not drafted.** No located art |

---

## Tier 3-WAY — 16 applications

| Rank | Ref | Title | Platform |
|---|---|---|---|
| 1 | AQAL-C-04 | Voice-Transparent Consensus Assessment | AQAL |
| 2 | AQAL-C-09 | Integral Voice Consensus | AQAL |
| 3 | AQAL-C-07 | Voice-Driven Weakness Coaching | AQAL |
| 4 | AQAL-C-08 | Transparent Staged Consensus Assessment | AQAL |
| 5 | AQAL-RCS-E1 | Voice-Informed Financial Readiness Assessment | AQAL × RCS |
| 6 | AQAL-RCS-E2 | Weakness-Aware Financial Coaching | AQAL × RCS |
| 7 | AQAL-RCS-E3 | Cross-Domain Development Tracker | AQAL × RCS |
| 8 | AQAL-C-13 | Transparent Integral Consensus Assessment | AQAL |
| 9 | AQAL-C-20 | Integral Weakness Consensus | AQAL |
| 10 | AQAL-C-10 | Staged Weakness Coaching | AQAL |
| 11 | AQAL-C-11 | Transparent Integral Coaching | AQAL |
| 12 | AQAL-C-19 | Transparent Voice Coaching | AQAL |
| 13 | AQAL-C-34 | Cognitive-Financial Development Tracker | AQAL × RCS |
| 14 | AQAL-C-36 | Voice-Driven Cognitive Coaching with Transparency | AQAL |
| 15 | AQAL-C-38 | Voice-Driven Cognitive Assessment with Transparency | AQAL |
| 16 | AQAL-TRI-S6 | Consensus-Weighted Life-Plan Orchestrator | Tri |

**Not drafted, and stronger than most of the above — draft these:**
**E-4 The Collateral Ladder** (home equity × policy cash value × FIA collateral sleeve ×
premium-finance line). The screen found **nothing** on cross-collateral sequencing, and
it is the general form of PAT-002, PAT-009 and PAT-014 at once. *If you draft one new
3-way from this document, draft this one.*
**E-6 Time Machine Monte Carlo** (one sourced series × block bootstrap × per-year floor
and cap) — this is how Family 8 survives the AG49 art.

---

## Tier 4-WAY — 3 applications

| Rank | Ref | Title |
|---|---|---|
| 1 | AQAL-C-15 | Consensus-Driven Integral Coaching with Transparency |
| 2 | AQAL-C-12 | Voice-Driven Staged Weakness Coaching |
| 3 | AQAL-C-14 | Staged Integral Weakness Coaching |

**Not drafted:** **E-7 Mortality-Weighted Care and Estate** — one government survival
curve feeding LTC gap, annuity payment years, estate arrival and inheritance timing,
so the plan cannot assume one death date for income and another for care. This is a
4-way with a clean, concrete inventive core. **Draft it.**

---

## Tier 5-WAY — 1 application, 1 recommended

| Rank | Ref | Title |
|---|---|---|
| 1 | AQAL-C-16 | Voice-Driven Staged Integral Weakness Coaching |

**Not drafted:** **E-15 Ten Threats, Sourced** — inflation (E-2) × political tax path
(E-1) × program survival × longevity curve × zip drawdown, each sourced, dated and
sealed, with the score's own confidence derived from the share of verified inputs.
This is **Family 14's reduction to practice** and it is currently a paper patent.

---

## Tier 6-WAY — **1 documented (Treasure Map), 2 recommended**

> **Correction to the previous revision.** I wrote that 6-, 8-, 9- and 10-way were
> gaps with nothing drafted. That was wrong, and the document that proves it is one you
> had all along: **the AQAL Patent Treasure Map** (30 Aug 2026) carries a complete
> **2-brick through 10-brick ladder** built on ten named Level-1 bricks. Those tiers
> are filled. My recommendations below are **additions** to it, not replacements.
> *(See the architecture warning at the end of Part 2 before anyone builds from it.)*

**6-A. LogVault** *(Treasure Map, 6 bricks, money score 8/10)* — an append-only daily
voice diary bound to the 32-line profile, so the record of how a mind changed is
evidentiary rather than editable. Screened as not existing elsewhere.

**6-B. The Sourced Plan** *(RCS, recommended, Tier 1 value)* — Truth Stack + Political
Weather + Guardian Ledger + one inflation basket + one tax path + the calculator suite.
*Like you're in 5th grade:* every number in your plan can point at the sentence it came
from, knows who was in charge when it was measured, is written in a notebook nobody can
secretly edit, breathes with real inflation instead of a made-up 3%, and shares one tax
future with all 35 calculators. **Five of six exist; the wiring (E-1, E-2) does not.**

**6-C. The Verified Assessment Chain** *(AQAL, buildable today)* — calibration bus +
pitch estimator + floor ratchet + hash ledger + provenance registry + dimension
isolation. **All six exist and run.** *The most defensible high-arity combination in the
portfolio, because every element is already reduction to practice.*

---

## Tier 7-WAY — 2 documented

| Rank | Ref | Title |
|---|---|---|
| 1 | **AQAL-C-17** | **Full-Spectrum Integral AI Coaching** |
| 2 | Treasure Map | **WeakLink** (7 bricks, money score 9/10) |

AQAL-C-17 combines Eight-Model Consensus Scoring + Prosodic Voice-Feature Extraction +
Controlling-Weakness Identification + Evidence-Mapped Protocol Coaching + Developmental
Stage-Band Estimator + Integral Four-Quadrant Mapper + Transparency and Tamper-Evident Audit.

*This is the best-written application in the corpus.* Its §101 section does the right
thing: it recites the **hash-chain commitment format, the calibration-weight formula and
cold start, the energy-gated lag-bounded pitch estimator, the fixed-width vector
contract, frozen norming versions and frozen isolation views** — particular structures,
not a result-only aspiration. That is the difference between surviving Alice and not.

**WeakLink** finds the single controlling weakness across the 32 lines and points every
intervention at it. Screened as not existing elsewhere. Verified in code:
`shared/therapyLineMap.ts` (941 lines, all 32 lines carry at least one therapy-channel
protocol) and `shared/archetypesData.ts` (`starvationCards`, `starvationForLine`).

---

## Tier 8-WAY — 1 documented · **the Treasure Map's top money-maker**

| Rank | Ref | Title |
|---|---|---|
| 1 | Treasure Map | **MatchForge** (8 bricks, money score **10/10 — ranked #1**) |

*Like you're in 5th grade:* it builds teams where everybody's strong parts cover
somebody else's weak parts, like puzzle pieces — matched on 32 proven skills instead of
on personality quizzes or shared hobbies.

**VERIFIED IN CODE.** `shared/matchEngine.ts` (252 lines) exports
`MatchMode = "complementary" | "resonance"`, `ALTITUDE_LINES`, `WEIGHTS`, `THRESHOLDS`,
`ComplementaryResult`, `ResonanceResult`, `RankedMatch`. The complementary mode is the
claimed mechanism and it is implemented. Screened as not existing elsewhere.

*Additional 8-way, dependent:* AQAL-C-17's seven plus the compute fabric
(`computeFabric.ts`), claiming parallel evaluation of isolated dimensions as part of the
reproducibility guarantee. **Honest note:** that file is 58 lines and thin — file it as a
dependent claim under AQAL-C-17, not as a new application.

---

## Tier 9-WAY — 1 documented

| Rank | Ref | Title |
|---|---|---|
| 1 | Treasure Map | **NormChain** (9 bricks, money score 8/10) |

*Like you're in 5th grade:* every month your scores get re-checked against the newest
standards, but your old scores are never erased — each one keeps a version tag, like a
save file, so you can always prove what was true back then.

Screened as not existing elsewhere. This is the strongest *regulatory* claim on the AQAL
side: version-stamped re-scoring that never rewrites history is exactly what an
accreditation body or an insurer has to be able to audit.

*Additional 9-way, dependent:* the 8-way bridged into RCS's wealth-capacity profile
(`AQAL-RCS-E5`), so the assessment mechanically decides which strategies are shown.

---

## Tier 10-WAY — 1 documented · **the whole AQAL platform**

| Rank | Ref | Title |
|---|---|---|
| 1 | Treasure Map | **AQAL Sovereign** (10 bricks, money score **10/10 — ranked #2**) |

*Like you're in 5th grade:* your voice, your 32 skills, your rarity rank, your
proof-floors, your weak link, your fair-history, your team matches, and the research
proving each skill is real — all of it becomes one portable "mind identity" that you own
and can let people pay to see a slice of.

Screened as not existing elsewhere. **This is the platform thesis as a single claim**, and
it is the right place for the OAuth-scoped, per-slice, logged access model — which is
also the cleanest commercial story in the whole portfolio: the individual owns the
identity, the enterprise pays for a scope.

*Additional 10-way, dependent:* `AQAL-TRI-S5` identity passport across all three
platforms. **Specified only — Dr. Buddy has no code.**

---

## Tier 11-WAY and 12-WAY — **GAP. Dependent claims only.**

**11-A. The Audited Life Plan.** The 10-way + `AQAL-TRI-S8` cross-platform tamper-evident
audit fabric. *Like you're in 5th grade:* all three notebooks braid into one, so a page
torn out of any of them shows up in all three. **Specified only.**

**12-A. The Whole Organism.** The 11-way + the Guardian Ledger's mandate and firewall
layer, so the combined system may act on money under ceilings and cooling-off.
*Like you're in 5th grade:* the whole thing finally *does* something — it knows you, it
knows the weather, it can prove every number, and now it is allowed to move a dollar, but
only inside a permission slip, only above a reserve floor, and only with a receipt.
**Blocked on E-12: `firewall.ts` runs with `rail: "ledger"` and no money rail exists.**
Needs counsel and a bank before it is switched on.

---

## Tier 13-WAY and 14-WAY — **GAP. Defensive only.**

**13-A / 14-A.** Add `AQAL-TRI-S4` (chronic-illness living-benefit coordination) and
`AQAL-TRI-S6` (consensus-weighted life-plan orchestration) to the 12-way.

I will write these if you want them, but I owe you the truth first: **a 14-element
independent claim is close to unenforceable.** Fourteen elements is fourteen ways for a
competitor to not infringe. The only honest use for 13- and 14-way claims is as the
last dependent claims in a specification, where their job is to show the examiner that
the full system is a coherent thing somebody actually built — not to be asserted.

**Recommendation: stop the independent-claim ladder at 4-way. Carry 5 through 14 as
dependents.** That protects everything, costs one filing instead of ten, and leaves you
with claims that can actually be enforced.

---

## ⚠️ Before anyone builds from the Treasure Map — read this

The AQAL Patent Treasure Map identifies ten real bricks and nine real combos. Its
prior-art screening is useful. **Its engineering instructions are not executable, and
if you hand that document to a developer they will build a second platform beside the
one you already own.**

Every "what to change in the website's code" section is written against an architecture
this repository does not have:

| The Treasure Map says | JoinAQAL actually is |
|---|---|
| `voice_processor.py`, `diagnostics.py`, `matching_engine.py`, `scoring_service.py`, `renorm_job.py` | **TypeScript.** The only two Python files in the repo are `scripts/gen_catalog.py` and `scripts/upstream-audit/gen_catalog.py` — both catalog generators |
| Postgres: `jsonb`, `float[32]`, `REVOKE DELETE/UPDATE` grants | **MySQL with Drizzle ORM.** Different types, different migration tooling |
| A `cognitive_profiles` table with `line_01 … line_32` columns | **No such table and no such columns exist.** Verified by grep across `drizzle/`, `shared/` and `server/` |
| S3 + Glacier lifecycle, Redis nightly cache, OAuth2 scopes | None of these are in the stack |
| Add a `controlling_weakness` column and write `compute_argmin` | The controlling-weakness logic already exists in TypeScript |
| Build `matching_engine.py` with cosine similarity | **`shared/matchEngine.ts` already exists** with `complementary` and `resonance` modes, weights and thresholds |

**The inventions are real. The build plan is fiction.** Treat that document as a
*claims and prior-art* source — which is what it is good at — and take the
reduction-to-practice evidence from the TypeScript files named throughout this document
instead. Several things it tells you to build are already built, and filing a claim that
recites a Python module and a Postgres column that do not exist would be an enablement
problem pointing at the wrong machine.

---

# Part 3 — What I verified myself, and what I got wrong

You said: *"Review the material yourself and then check to see that you verify that
these patents are inside the code."* Here is that record, including my own errors.

## Verified present — read line by line

| Claim | File | Evidence |
|---|---|---|
| Hash-chained ledger | `joinaqal/server/patents/ledger.ts` | `canonicalJson` sorts keys at every depth; `entryHash` = SHA-256 of `prev\|kind\|json`; `verifyChain` recomputes every link and returns the first bad id |
| Floor ratchet | `joinaqal/server/patents/achievementFloors.ts` | `nextFloorState` is pure, clamps to [0,1], rejects non-finite inputs and negative hours, returns `Math.max(prior, level)` |
| Calibration consensus | `joinaqal/server/patents/calibrationBus.ts` | `weightedTrimmedMean`, `calibrationWeight`, `MIN_SAMPLES` cold start, `recordCalibrationObservations` |
| Prosodic extraction | `joinaqal/server/patents/voiceFeatures.ts` | 285 lines of real DSP; `decodeToPcm`, `extractVoiceFeatures`, `MAX_VOICE_AUDIO_BYTES` |
| Advisor/client view split | `russell-capital-app/shared/weaponizeEngines.ts` | `transformToClientView` returns sections unchanged in advisor mode; in client mode swaps `title`→`clientTitle` and filters `internal_` and `commission_` prefixes |
| Patent-status honesty | `russell-capital-systems/shared/patentStatus.ts` | `mayClaimPatentPending()` requires an application record carrying an actual number and date — **the claim cannot be turned on by asserting it** |
| 57-claim code registry | `russell-capital-systems/shared/patentCatalog.ts` | 57 entries, each naming an engine and/or page path; a test walks every entry and fails the build on an unresolvable path |

## Verified ABSENT — on the sheet, not in the code

| Claim | Reality |
|---|---|
| Family 14 — Ten Ecological Threats | A `riskScoring` router and a page exist. **No engine computes ten named threats.** |
| Family 15 — Divorce Shield | `DivorceCalculator.tsx` renders and **calls zero procedures.** No fifty-state rules table exists. |
| SI-026 Regulatory Sandbox | No code. |
| SI-024 Multi-Currency | No code. |
| SI-023 Market Sentiment | No code, and unsupportable under Family 1's own sourcing rules. |
| Dr. Buddy service embodiment | Document protocol only. **Zero application code.** |
| E-12 money movement | `firewall.ts` runs with `rail: "ledger"`. Plaid declared, implemented nowhere. |

**Anything filed on the seven rows above before they exist is a paper patent.**

## Corrections to the record — mine and the team's

1. **A teammate fabricated a hardware claim.** `dimensionIsolation.ts` was reported as
   doing "hardware memory isolation zones" and "context-blind token scrubbers," scored
   9.5/10. It is 69 lines of `Object.freeze`, and the file's own header disclaims
   hardware enclaves. Caught by reading the file.
2. **I invented a symbol.** `starvationCurves` does not exist; my export scan truncated
   at 50 characters and produced it. A candidate patent was built on it before I caught
   it. Real names: `starvationCards`, `starvationForLine`.
3. **Two downgrades on verification.** `KIND_ATROPHY` is **prose, not math** — narrative
   durability strings, not a decay model. `confidenceFromEvidence` is a **2-line string
   map**, not a patentable mechanism on its own.
4. **Alice scores were too optimistic.** The first pass averaged 7.4/10. On adversarial
   §101 review — *"most of these reduce to data gating, correlation checks, or selective
   display"* — every score was lowered. New mean: 5.4. The JoinAQAL table in Part 1B is
   the corrected one; note that twelve of twenty are Discard, most on §101.
5. **A previously-flagged contradiction is already fixed.** An audit snapshot showed
   `PatentShowcase.tsx` claiming "filed with the USPTO" while the specs said "DRAFT —
   NOT FILED." **The current file imports `@shared/patentStatus` and reads "Application
   drafted April 2026 — not filed."** The false-marking exposure is closed. I was
   working from a stale `source_hash` when I raised it.
6. **Prior art forced a narrowing.** SE-017 as originally drafted is anticipated by
   `US 11,748,806`, `US 11,430,567 B2` and `US 12,718,290`. It must be narrowed to a
   Boolean AND of **independent** predictors.
7. **Four "plumbing" mechanisms were screened.** Rate limiting: **CROWDED.** Job
   locking: **CROWDED.** Webhook idempotency: **CROWDED.** Eight-model consensus:
   **CLEAR** — nearest art `US10902005B2`. Only the last is worth a claim.

**Roughly half of every model-proposed candidate failed verification against the actual
source.** That is the gate working, not the gate failing.

---

# Part 3B — The recorded strategy review, and what it changes

A recorded conversation (`Patent_Strategy_and_Product_Review`) contains the inventor
describing three inventions in his own words. It is the most useful document in the
entire corpus, for one reason: **in two of three cases the invention he described is
materially different from — and stronger than — the invention the code implements.**
Transcripts are not prior art and not enablement, but they are evidence of conception,
and they are where the real mechanism lives.

**Three new emergent patents fall out of it.** These extend the E-1…E-15 list.

| # | Name | The wiring | What becomes patentable |
|---|---|---|---|
| **E-16** | **The Scaled Reference Illustration** | Build the imaginary large-premium reference policy into `timeMachineEngine.ts`: a reference contract at AG49-compliant rates whose premium scale is chosen so the mapped credit onto the client's contract is displayable within the guideline's envelope, with the scale factor, the envelope test and the mapping printed | **The highest-value unbuilt claim in the portfolio.** Not "show history next to the illustration" (which AG49-A requires and four vendors ship) but a specific ratio construct with a named regulatory rationale that two carrier compliance desks have reportedly reviewed |
| **E-17** | **Account-Value Recycling** | Import `policyLoanMechanics.ts` into `mortgageKiller.ts` so the cycle credits on **account value** — the monotone sum of every premium and credit — instead of `cashValue`; then model the day-two draw and the principal-only application | Cycled mortgage retirement in which crediting is computed on a monotone non-decreasing account value while 95% of the premium has already left the contract. **This is the element that makes the claim non-obvious over infinite-banking literature** |
| **E-18** | **Cross-Carrier Threading** | Model the same dollar sequenced through two or three carriers before it reaches the bank, building two or three account values from one premium, subject to the 60%-of-net-worth cap, with the optimizer choosing how many contracts and what sizes | Sequencing a single premium across multiple carriers to multiply account-value accrual per dollar. **Nothing in the repository models this and no prior art was located.** Highest novelty of the three |

### Why this changes the filing order

I ranked Family 8 (Time Machine) **Tier 2, file narrowly**, because AG49-A already
mandates a capped-and-floored benchmark with a 25-year lookback and *requires* historical
disclosure beside the illustration — so the implemented dual display is close to what the
guideline demands anyway. **That assessment was correct about the code and wrong about
the invention.** The scaled-reference construct is not what AG49-A contemplates; it is a
method for making a compliant disclosure carry information the guideline was written to
suppress. Whether that survives counsel's review is counsel's call — but it is a real
mechanism, not a re-labelling, and it deserves to be assessed on its own terms.

Same story in Family 5. "Borrow at a low rate, deposit at a higher one" is decades of
published infinite-banking material and would not survive §103. **One-day threading on a
monotone account value, repeated in cycles, across rotating lenders and multiple
carriers** is a different animal with specific, checkable, hard-to-design-around steps.

### What did *not* change

Family 9 moved the other way, and in your favour. I had rated the Whisper Coach on its
specification. On this pass I read the source: **2,142 lines across six files**, with
objection probability typed as *"how likely it surfaces in the next five minutes,"*
decision-type inference, call-phase detection, rolling talk statistics, multi-signal mood,
and prior objections carried between calls. You said you are running it on live calls.
**That is reduction to practice, and PAT-003 should lead Family 9 rather than sit inside it.**

---

# Part 3C — Patent360

`PATENT360-COMPLETE-BUILD.zip` is a **real, deployed service**, not a mock — packaged
11 Sep 2026 from commit `1f0ce30`, live at `patent360-production.up.railway.app`.

- **342 files.** FastAPI application (`app/main.py`, `app/mcp.py`), React/TypeScript
  client (30 `.tsx` files), two-stage Dockerfile, `railway.toml`, tests, plus a compiled
  static build that runs with no build step.
- **Pages:** Dashboard, Matters, Filings, Drafting, Deadlines, Clients, ClientReport,
  Datasets, Targets, Team, Options, How, Home, Login.
- **Three surfaces, one service:** the app at `/` and `/app/*`, REST at `/api/*` and
  `/health`, and an **MCP server at `/mcp`** — four read-only tools behind bearer auth.
  With no `MCP_API_KEY` set it answers **503 rather than serving openly**, which is the
  correct fail-closed default and worth keeping.

This is the advisor-only surface you asked for. **Its patent status:** the service is
tooling — matter management, docketing, drafting workflow. Docketing and IP-management
software is a **crowded** field (Anaqua, Clarivate IPfolio, PatSnap, Dennemeyer). I did
not screen it formally, but nothing in the file inventory suggests a claim worth filing.
**Its value is commercial and strategic — it is the delivery vehicle for everything in
this document — not inventive.** Treat it that way and it stays cheap to run.

---

# Part 4 — What to do next, in order

0. **Build E-16, the scaled reference illustration.** By your own account it is the
   fastest money in the portfolio and two carrier compliance desks have already looked at
   it. Right now PAT-010 claims a mechanism the code does not contain, and the mechanism
   the code *does* contain is the one with the strongest art against it. Nothing else on
   this list changes the portfolio's value as much.
1. **Settle the rarity formula** — multiplicative or geometric mean — and make the
   user-facing number, the stored evidence and the claim all say the same thing. It is a
   filing blocker.
2. **Wire E-17.** One import (`policyLoanMechanics` into `mortgageKiller`) moves Family 5
   from a decades-old published strategy to a specific, checkable mechanism.
3. **Fix the two defects before counsel sees anything.** `persistAssessmentPatentEvidence`
   silently skipping, and the rarity number being computed two different ways for the
   user and for the evidence record. Both undermine reduction-to-practice claims.
4. **Build Families 14 and 15.** Both screened **no close art found**, both are on the
   sheet with nothing behind them, and Family 15 is roughly a week of work — a
   versioned, sourced fifty-state rules table in the style of `taxRules.ts`.
5. **Wire E-10, E-1 and E-2.** Cheap, and they turn three Tier-3 items into Tier-1
   evidence. E-10 is also the single best product change available.
6. **Draft E-4 (Collateral Ladder).** It is the general form of three existing patents
   at once and the screen found nothing.
7. **Build the Dr. Buddy service.** Six applications currently rest on paper. Building
   converts all six to reduction to practice, which is what a provisional is for.
8. **Give each Tier-1 family a one-page disclosure** in the erosion-disclosure format:
   field, problem, elements, novelty as the inventor understands it, prior-art starting
   points, reduction-to-practice files, and first commit hash.
9. **Run a formal search before drafting** — USPTO Patent Center, Google Patents and
   WIPO by CPC class **G06Q 40/06, G06Q 40/08, G06Q 10/06, G06N.** Every screen in this
   document is product-page level, not a freedom-to-operate opinion. "No close art
   found" means *none found in that screen*, not *none exists.*
10. **File 2-, 3- and 4-way as independents. Carry 5- through 14-way as dependents.**

---

*Prepared by the multi-model review team under a four-gate verification loop: a model
proposes → prior art is screened → the claim is checked against the actual source file
→ the claim is attacked under §101. A candidate that fails any gate does not appear in
this document as verified.*

*Russell Holdings Management, LLC · 5700 Kirkwood Hwy Suite 202, Wilmington*
*russellcapitalsystems.com · joinaqal.com · drasswealthmanagement.com*
