# Russell Capital Systems — Patent Portfolio, Consolidated and Prioritized

Inventor: Samuel A. Russell V. Owner: Russell Holdings Management LLC.
Status of every item in this document: candidate. Nothing is filed, pending or granted until counsel files it.

This document replaces the ninety-item list as the working map. It does five things:

1. Folds the ninety patents, the twenty-three homepage technologies, and every mechanism found in the code into **sixteen families**, so that ideas which are the same invention wearing different names are filed once, as one application with dependent claims, instead of as five thin ones.
2. Gives each family a sharper description than the fifth-grade sheet, written for counsel and for you.
3. Records what the outside prior-art screen found for each family, with the closest references by number.
4. Ranks the families into filing tiers by novelty, defensibility and commercial value.
5. Lists the patents that do not exist yet but **will** the moment the platform is wired end to end, with the exact code changes that create them.

Sources used: the ninety-patent document, the AI-team notes, the invention inventory, the erosion disclosure, two full sweeps of `shared/`, `server/` and `client/`, and seven prior-art screens run through Perplexity. Perplexity's screens are preliminary, not freedom-to-operate opinions. Every "no close art found" below means "none found in that screen," not "none exists."

---

## Part 1. The sixteen families

Each family lists: what it is, what folds into it and why, what the prior-art screen found, the tier, and what it is worth.

### Family 1. The Truth Stack — the evidence pipeline that cannot hallucinate

**What it is.** A planning system in which no number can reach a page, an engine, or an AI answer without carrying its own proof. An AI may read a public page and report a figure, but must hand back the exact sentence, and the server discards the figure unless the sentence is on the page and the number is inside the sentence. Several models read the same page and are merged only if they agree within one percent. The AI never decides what a figure means; a human-written direction table does. Forecasters are graded automatically when the government publishes the real outcome, and again for changing their own story, and a bad grade halves a source but never zeroes it. Every surviving figure waits in an owner approval queue. Every fact is stored with its value, a verified flag, its URL and its date, so an unverified fact shows as unverified on screen. Every engine carries a coded list of sentences it must never print. Each key the site holds can be proved live without ever being shown.

**Folds in.** PAT-025 Witness Rule (lead claim), PAT-028 Truth Stack (the system claim), PAT-042 Forecast Referee (dependent: the blending), PAT-026 Report Card Machine (dependent: the grading), PAT-027 Truth Box (dependent: the fact record), PAT-048 Mutual Carrier Sentinel (dependent: the weekly re-verification), PAT-054 Locked Library Card (dependent: the key probe and permission-derived instructions), SI-022 Blockchain-Verified Audit Trail (dropped as a separate item; the hash chain is Family 3 and "blockchain" adds nothing).

**Why these were redundant.** PAT-025, PAT-028 and PAT-042 describe the same pipeline from three camera angles. PAT-026 is one stage of it. PAT-027 and PAT-048 are the data structure and its maintenance. Filed separately they would each be rejected as abstract; filed as one system with the interactions claimed, they are the strongest thing in the portfolio.

**Prior art found.** Closest: US9087048B2 and US9015037B2 (automatic verification of factual statements against source material), US20230370274A1 (provable provenance for AI-model assessments), US20240296295A1 (verifying an LLM quotation appears in a source), the PaperTrail and TROVE papers, and forecast-combination literature (Bates and Granger; MAPE-weighted combination, arXiv 2504.08940). Screen verdict: component-level art exists for fact checking and provenance; **no close art for the ordered pipeline** (quote guard, agreement threshold, figure-only interface, direction table, auto-grading formula with the nonzero floor, self-revision penalty, approval gate, never-print lists). Strongest system-level candidate in the whole screen.

**Tier 1. Value:** this is the answer to the only question a regulator, a carrier, or an acquirer will ask about an AI planning platform: "how do you know it did not make that up." It is also the backbone every other family sits on.

### Family 2. The Political Weather Machine — who holds power as a measured input

**What it is.** Every year since 1945 is stamped with who held the White House, the Senate and the House, reduced to one lever share (president half, each chamber a quarter). When the plan asks how often taxes rose over the next twenty years, it learns only from past windows whose lever share matched the share expected ahead, and prints a notice when fewer than fifteen windows match. Once a week, with no keys, the server reads seat counts, the appointing party of sitting federal judges, the governors, and prediction-market odds for the next election, and stores them as a dated series. Every horizon shows the odds taxes rise under left control, under right control, and the gap between them. Every politically sensitive assumption in a plan carries a half-life tag; when the pulse crosses a threshold, the plan recomputes, seals the delta, and lights up every page in the smoke zone with the reason. Inflation by political control is shown as history and deliberately kept out of the forecast.

**Folds in.** PAT-017 Political Weather Radar (lead: control-conditioned base rates), PAT-022 Political Weather Machine (system claim), PAT-031 Power Pulse (dependent: the weekly keyless reader), PAT-049 Political Repricer (dependent: threshold recompute and sealing), PAT-044 Half-Life Engine (dependent: assumption tags), PAT-036 Tax Shock Map (dependent: page propagation), PAT-029 Program Survival Odds (a second independent claim in the same family: the hazard times tilt times persistence decomposition), SI-006 Real-Time Tax Code Change Simulator (folded: proposed-law simulation is versioned rules plus the shock map, already in code as `taxRules` and `recomputeUnderRules`).

**Prior art found.** Ash et al., *What Drives Partisan Tax Policy* (party control predicts tax changes, concept level); an IMF ordered-logit of tax-rate changes by politics; ifo working paper 198 on partisan revenue-forecast bias; *Forecasting Political Developments with the Help of Financial Markets* (market prices as event probabilities); Rosenberg on PSLF survival; NBER w33462 and Penn Wharton on program costs. Screen verdict: **no close art for the lever-share window-matching rule, the fallback threshold, the dated keyless pulse, the power swing, or the Jeffreys-hazard survival model with regulation doubling and court separation.** Obviousness is the risk, so the claims must recite the window-matching rule, the fallback, the pulse construction and the hazard transformation, not "forecast taxes using politics."

**Tier 1. Value:** nobody else in planning software treats politics as a measured series. It is also the most explainable thing on the site to a physician.

### Family 3. The Guardian Ledger — proof, consent and money control under one authority

**What it is.** Every fact, decision, consent and outcome is a link in a hash chain where each fingerprint includes the one before it; a save that changes nothing writes nothing. Any date can be replayed. Any projection can be sealed with its inputs and rule version. Every piece of advice is signed with the question, the models used, the rules, and the facts as key-plus-fingerprint, never the figure, so it can be verified without exposing the numbers. Twelve hierarchical consent scopes with wildcards gate every read. An AI agent is bounded by a mandate: named actions, named accounts, a per-action ceiling, a rolling ceiling, and a human-approval line. Every proposed money movement passes a fiduciary firewall that judges it against the client's policy, the proposer's mandate, known payees, a new-payee cooling-off, a conflict list that always includes the advisor, and a reserve floor, returning allow, hold or block with every reason. Automations run once per event fingerprint and never fire on events they wrote. Outside systems are told "the plan changed" without the figures. Uploaded estate documents are checked against the plan's own facts at upload and flagged, never auto-corrected. A replay can walk an estate plan backward to the first moment a beneficiary became exposed.

**Folds in.** PAT-018 Guardian Ledger (system claim), PAT-040 Black Box Advice Packet (dependent: fingerprint-only signed advice), PAT-050 Consent Autopilot (dependent: mandates plus automations plus reversal), PAT-052 Estate Paper Detective (dependent: upload-time consistency), PAT-032 Estate Fragility Replay (dependent: backward replay), the ledger half of PAT-053, SI-022 (dropped; see Family 1).

**Prior art found.** US20230370274A1 (provenance) is the closest and covers audit; agent-governance portfolios at Salesforce, Microsoft, IBM and JPMorgan are related but the screen located no publication reciting the twelve-scope hierarchy, rolling ceilings, allow/hold/block verdicts with conflict list and reserve floor, non-self-triggering automations, or fingerprint-only signing. Verdict: **"no close art found" for the integrated control stack,** with the advice that authorization, transaction evaluation, event safety and document consistency be claimed as four separate claim sets under one specification to survive an obviousness rejection.

**Tier 1. Value:** this is what lets an AI touch money at all. Without it, Family 5 and Family 9 are demos.

### Family 4. The Property Machine — from a zip code's history to a trust-owned loop

**What it is.** A zip code's price history is spliced (FHFA index before 2000, Zillow after) with the seam labeled. The client chooses the start year, and every average and every forward projection recomputes from that window with the window printed beside the number. "Zips like mine" is a live query with the count shown. Purchasing power is solved two ways, what cash carries and what income carries under the lender's limit with partial rent credit, and the page names which rule bound. Candidate zips are scored as rent yield plus appreciation minus a FEMA National Risk Index penalty minus a drawdown penalty for past crashes over twenty percent; zips with no published rent record are excluded from income scoring. The same budget becomes one house or four. Each year the rentals' tax savings become premium into a policy owned by an irrevocable trust; the trustee borrows against it and pays the properties' principal pro rata; the thirty-year plan runs twice, with and without the loop, and the difference is reported as the loop's own contribution. Only mutual carriers qualify, with first-year loan permission typed allowed, not allowed, or unknown. Five stress directions test the same home decision.

**Folds in.** PAT-020 Property Machine (system claim), PAT-024 Zip Time Machine (lead: splice, window, cohort), PAT-019 Double-Run Trust Loop (independent claim), PAT-034 House Budget Referee (dependent), PAT-039 Household Resilience Lens (dependent), PAT-009 Mortgage Elimination Through Recycling (moves to Family 5 as the cycle claim; the property side stays here), SI-034 1031 Chain, SI-029 Syndication K-1 Aggregation, SI-009 Opportunity Zone (all three kept only as dependent claims: the strategies are known; the software claim is thin).

**Prior art found.** Zillow US11068911B1 (zip-level rental-rate aggregation) and US8676680B2 (geographic home valuation); PropData, ZipSnapshot and HousingHandbook (zip analytics with FHFA and FEMA inputs); infinite-banking calculators (policy loans against cash value). Verdict: ingredients are conventional; **no located anticipation for the provenance-labeled splice with dependency-wide recomputation, the count-returning cohort query, the named binding rule, the composite hazard score, or the with-and-without trust-loop run.**

**Tier 1 for the splice, referee, hazard score and double run. Tier 3 for the 1031, syndication and OZ dependents.**

### Family 5. The Debt-to-Liquidity Engine — borrowing sequenced into a war chest

**What it is.** Every dollar owed is modeled as borrowing power and sequenced against taxes. Home equity is borrowed at a low rate and moved into a specialized liquidity tool that credits on the highest-watermark account value; the liquidity is drawn to retire the mortgage in five to seven years without an extra dollar; the cycle repeats with the new equity, later two at a time; and a tax-free income stream is secured on a negligible cash value on top of a large account value. Policy loans, premium financing, HELOC draws and collateral assignment of a fixed indexed annuity (split into a collateral sleeve and an income sleeve) are all the same problem: which contract to borrow against, in what order, at what cost, and when to repay. The engine decides the order.

**Folds in.** PAT-002 HELOC-to-IUL Arbitrage (lead), PAT-009 Mortgage Elimination Through Recycling (the multi-cycle claim), the homepage Debt-to-Positive-Liquidity War Chest Transmutation Engine (**not on the ninety-item sheet; add it**), PAT-014 FIA Collateral Assignment (independent claim: the two-sleeve split), SI-004 Premium Financing Arbitrage (dependent), and three engines found in code that are on no sheet: `shared/policyLoanOptimizer.ts` (loan sequencing), `shared/reverseHeloc.ts`, `shared/premiumFinancing.ts`.

**Prior art found.** Infinite-banking and bank-on-yourself materials (whole-life policy loans to accelerate mortgage payoff); premium-financing calculators; no patent located on sequencing policy loans against mortgage payoff. Verdict: "infinite banking" is weak novelty; **the algorithmic sequencing of external debt, policy funding, policy loans and mortgage retirement across repeated cycles is the claimable part, and the FIA two-sleeve model had no close art.**

**Tier 1. Value:** it is the first thing on the home page and the reason a physician calls. See Emergent E-4 (the Collateral Ladder), which is what this family becomes when its four engines are joined.

### Family 6. The Suitcase — the tax schedule with a fixed order and provenance gates

**What it is.** Twenty-nine strategy families are placed in a fixed annual order: baseline items; structure-free reducers sorted by certainty and cost; deduction engines sized to the room under the target bracket and capped by the excess-business-loss limit and a risk ceiling; charitable bunching every third year; the Roth conversion last, filled to the top of the bracket and counted as a cost. Every parameter carries a source and a verified flag; an unverified parameter never sizes a step; the confidence printed beside each step blends the family's authority with its verified share. Tax rules are versioned by year with their revenue procedure; a plan re-runs under another year's law and the difference is sealed. A full Roth conversion inside twelve months is offset by deductions, depreciation and credits from many asset families with the refund timing reported. Retirement withdrawals are sequenced across Roth, traditional, taxable, Social Security, pension, rental, policy loans and annuities.

**Folds in.** PAT-035 Suitcase Packer (lead), PAT-012 One-Hundred-Percent Roth Conversion (independent claim), PAT-005 Tax-Free Retirement Income Waterfall (independent claim, narrowed to the eight-source objective including policy loans and rental), SI-007 Multi-Entity Router, SI-037 Tax-Loss Harvesting with Premium Timing, SI-030 Spousal Income Splitting (dependents), SI-041 Medicare IRMAA, SI-010 State Tax Migration (dependents only; crowded), SI-008 CRT plus Wealth Replacement, SI-042 Estate Freeze plus Wealth Replacement (dropped as separate items; the strategies are textbook and the screen found the software claim weak).

**Prior art found.** RightCapital (Roth modeling, tax-efficient withdrawal sequencing), Income Lab (Roth plus IRMAA plus sequencing), RetireSmartIRA (a tax waterfall with QCDs and IRMAA), Holistiplan, Corvee, TaxPlanIQ; IRS CRT guidance. Verdict: waterfall, Roth modeling and IRMAA are **crowded**; **no close art for the twenty-nine-family fixed order with Roth-last-as-cost, the "unverified inputs never size a step" rule, and the sealed rule-version delta; the joint twelve-month conversion-and-offset optimizer was not found.**

**Tier 1 for the scheduler and the rule-version delta. Tier 2 for the twelve-month conversion. Tier 3 for the waterfall, IRMAA and state migration.**

### Family 7. The Lifetime Income Chain — from the first conversion to the last inheritance

**What it is.** An income-for-life engine that refuses to illustrate on money that still owes tax and points to the conversion pass instead; a payout printed only from a rate-sheet row a person typed with a link and a date; joint survival from the Social Security life table; a flow-through structure held as four legal questions until a carrier illustration and an attorney letter answer them. Each expected inheritance is typed by how the tax code treats it on arrival, scaled by the future-tax multiplier, deflated to that year's dollars, weighted by likelihood of arrival, and refused when an annuity's gain share is missing. Timing is one dated range whose width comes from the benefactor's survival curve and the forecaster panel's confidence, with the reason for the width printed. Long-term-care cost by zip and rider arithmetic per carrier form sit beside a standalone quote without declaring a winner. Annuity replacement is scored by breakeven month with guaranty-fund headroom; a zero means "do not replace."

**Folds in.** PAT-021 Lifetime Income Chain (system claim), PAT-016 Money That Says No (lead: refusal gate and rate-sheet-only printing), PAT-037 Inheritance Arrival Meter and PAT-038 Inheritance Timing Dial (independent claims), PAT-033 Future-Self Negotiator (dependent: the once-offered consented follow-up), SI-025 Annuity Hidden Fees, SI-005 Living Benefits Probability, SI-031 Disability Gap with Bridge, SI-032 Multi-Generational Sequencing, SI-039 Beneficiary Optimization, SI-014 Family Tree (all dependents or dropped: multi-generational, beneficiary and family-tree planning are crowded at eMoney and MoneyGuide).

**Prior art found.** Cannex and Annuity Intelligence (annuity comparison); carrier living-benefit illustrations; eMoney and MoneyGuide (legacy and multi-generational planning). Verdict: **no close art for the arrival meter's tax-typed, probability-weighted, completeness-gated calculation or the survival-curve timing dial; the enforced refusal with owner-typed authorization supports a narrower software claim.** Annuity comparison and multi-generational transfer are crowded.

**Tier 1 for the arrival meter, timing dial and refusal gate. Tier 3 for the rest.**

### Family 8. The Time Machine — history and stochastic paths under the policy's own floor and cap

**What it is.** A policy is back-tested against actual index history for ten, twenty or thirty years and shown beside the AG49 forward illustration. Ten thousand stochastic paths are run with the policy's floor and cap enforced in every path, and the account value is shown growing as a holographic display while ninety-five percent of the liquidity pool stays available any day, including the days banks are closed. The credited rate each year is laid beside inflation and the money supply, years are split at each series' median, and the correlation refuses below eight paired years. Multi-carrier comparison normalizes carrier assumptions; a replacement analyzer scores 1035 exchanges by breakeven.

**Folds in.** PAT-010 Time Machine Dual Illustration (lead), PAT-013 Monte Carlo with Floor and Cap (independent claim, strengthened by Emergent E-6), PAT-051 Regime Splitter (dependent), SI-002 Multi-Carrier Comparison, SI-003 Policy Review and Replacement (dependents), SI-001 Dynamic AG49 Illustration Compliance ("maximize persuasive impact within AG49" is dropped: AG49-A already prescribes the benchmark and the phrasing invites regulatory trouble), SI-021 Quantum-Resistant Stress Testing (dropped: crowded and misnamed; fat-tail testing is a dependent of PAT-013), SI-023 Market Sentiment for Crediting (dropped: open but unsupportable without a source that meets Family 1's rules).

**Prior art found.** **Strong art:** AG49 and AG49-A mandate a capped-and-floored benchmark with a 25-year lookback and require historical disclosure beside the illustration (SOA product-development newsletters, carrier AG49 guides); commercial back-testing at Ensight, Zinnia, iPipeline, WinFlex. Verdict: the dual display is close to what the guideline already requires; **no close art for path-level floor-and-cap enforcement in a full policy cash-flow Monte Carlo, or for the regime split with the correlation refusal.** File this family narrowly.

**Tier 2.**

### Family 9. The Listening Site — the advisor that asks permission and grades itself

**What it is.** A microphone on every page with speech recognized in the browser so audio never leaves the machine; six answer shapes and a horizon mode that collects five more facts and answers the questions the person should ask in twenty years; a PDF only after the address is typed twice. One question goes to every model that has a key; failures and unconfigured models are named; a lead model synthesizes only when more than one answered; the public hears ideas and never numbers while the client hears everything, enforced in the prompt, the data path and the event bus. Twelve rules find the questions the client never asked, shown only after a yes at each step, re-offered only after thirty days. A journey of three to five core questions plus one emergent question, in a fixed order the AI may polish but not change. No planning answer until the fifteen-section assessment is complete. A before-and-after confidence rating at the door, refused below five peers. During a live meeting, thirteen models listen, predict the objection five to ten minutes ahead and pre-build the calculation and printout that answers it.

**Folds in.** PAT-046 Listening Site (system claim), PAT-023 Everywhere Advisor (lead), PAT-045 Two-Audience Brain (independent claim: quorum council with truthful disclosure and audience split), PAT-041 Question Finder (independent claim), PAT-055 Confidence Thermometer (dependent), PAT-003 AI Whisper Coaching (independent claim, narrowed to the objection-prediction pipeline), SI-015 Voice Dashboard, SI-013 Life-Event Detection, SI-012 Churn Prevention, SI-011 Gamified Literacy, SI-027 Digital Twin, SI-026 Regulatory Sandbox (all dropped: the screen marked voice dashboards, life-event detection with playbooks, churn scoring and digital twins as taken or crowded; the sandbox is open but has no code behind it).

**Prior art found.** **US20250225587A1 closely anticipates** the specialized-model digital advisor; US20230074406A1 (LLM-generated assistant responses) and US20230075411A1 (automated personalized planning) are related; Gong, Chorus, Cresta, Uniphore, Zoom AI, Jump and Zocks for meeting intelligence. Verdict: generic multi-model answers and digital advisors are exposed; **potentially stronger:** the future-objection pipeline that produces calculations and printouts, the six-shape and horizon protocol, quorum-gated synthesis with truthful failure disclosure, the consent-gated unasked questions, the assessment gate, and the before-and-after score.

**Tier 2.**

### Family 10. Career-to-Home — the true cost of the white coat, and whether forgiveness arrives

**What it is.** For thirty-six kinds of doctor, dentist, vet and lawyer: what training cost with interest accruing in school, what the low-pay years cost against another job, the true pay per hour net of commute and travel, and the percentile against the government's own pay distribution, every training length linked to the accreditor's document. Peers are compared only when five or more exist. The cost is handed to affordability by zip with the binding reason named, then into the chained calculator, ending in an exit confidence score. Public specialty pages double as the peer data form. Forgiveness arrival is modeled as program survival times political tilt times borrower persistence (Family 2 owns the hazard).

**Folds in.** PAT-030 Career-to-Home (system claim), PAT-043 Career Price Tag (lead), SI-028 Physician Loan Forgiveness Optimization (dependent: the IUL and Roth coordination), PAT-029 (claimed in Family 2, referenced here).

**Prior art found.** BLS OEWS tables (the benchmark); Doximity, Medscape and White Coat Investor calculators (compensation and physician finance); Rosenberg on PSLF. Verdict: **no close art for the integrated ledger with accrued training cost, opportunity cost, commute-adjusted hourly pay, percentile, the five-peer refusal and the page-as-form.** The five-peer rule is a privacy rule, not the inventive core.

**Tier 2.**

### Family 11. The Wealth Genome and the Cooling-Off — classification and behavioral guard

**What it is.** Twenty-plus household factors become one profile that selects strategies. A living risk profile stores every questionnaire with its date, measures drift, projects the trend and triggers a reassessment. When someone is about to sell at a loss on a brain trick, the system reaches out first, shows the evidence, and helps them take a week or a month off before acting.

**Folds in.** PAT-004 Wealth Genome (lead), PAT-008 Behavioral Lock-In Prevention (independent claim), SI-035 Risk Drift Detection (dependent), plus two engines in code on no sheet: `shared/retirementDNA.ts` (archetypes; fold into the genome) and `shared/livingRiskProfile.ts` (drift time series; this is SI-035's reduction to practice, and it is currently orphaned).

**Prior art found.** **US20230075411A1 closely anticipates** profile-driven strategy selection; Andes Wealth Technologies holds a patent on an investor risk-management system (drift is **taken**); Nitrogen and Brooklyn for risk analytics and rebalancing. Verdict: the genome is exposed; **the emotional-sale detection with an evidence-backed cooling-off had no close art** and should be searched against robo-advisor circuit breakers before filing.

**Tier 3 for the genome (defensive dependent). Tier 2 for the cooling-off once it is wired to the drift series (Emergent E-8).**

### Family 12. The Cascading Core — one base every calculator snaps to

**What it is.** Thirty-five calculators share one household profile. Change one number and everything connected changes. The Ultra Calculator lets an AI label each module necessary, optional or not needed with a written reason, then the client defines successive multi-year windows with goals in their own words, each window inheriting the previous one's ending balances. When one tool publishes a result relevant to another, the second offers to apply it and offers "use in" links onward, so the calculators form a directed graph. A credibility overlay on any projection opens the year-by-year data, the method and a start-year picker.

**Folds in.** PAT-001 Cascading Multi-Calculator (lead), the Ultra chained windows (E4), the cross-tool strategy graph (E5), the credibility overlay (E6), PAT-015 Practice Revenue and Territory Platform (independent claim; its engine `shared/weaponizeEngines.ts` is complete and orphaned), SI-036 Physician Buy-In Valuation (dependent; the screen marked it open), SI-018 Commission Optimization Router (dropped: a system that routes clients by advisor commission is a conflict-of-interest exhibit, not a patent), SI-024 Multi-Currency (dropped: crowded and not in code).

**Prior art found.** eMoney, MoneyGuidePro and RightCapital model connected plans; the screen found nothing on the AI-triaged chained windows or the "use in" graph, but the base "connect the calculators" claim is weak on its own.

**Tier 3 as a standalone. Tier 1 as the vehicle for Emergent E-1 and E-2** (every calculator moving together with the political pulse and one inflation source), which is where the real invention appears.

### Family 13. The Money Globe — one registry for navigation, proof and search

**What it is.** Every page is a point with two coordinates, one of twelve domains of a financial life and one of four depth layers, with the ledger at the center. An empty cell is a labeled gap. The site audits its own links against that registry, and the sitemap is generated from it, so navigation, proof and search cannot disagree.

**Folds in.** PAT-047 Money Globe (lead), PAT-053 Globe and Ledger (dependent), E7 site health, E8 SEO catalogue.

**Prior art found.** Faceted navigation is common; the screen marked the twelve-by-four map **open** and the self-fetching site audit **crowded**. Protection depends on the concrete interaction and data structure.

**Tier 3.**

### Family 14. The Ten Ecological Threats — retirement danger beyond the market

**What it is.** Ten threats to a retirement, uncorrelated with average return, each with its own driver and source, reduced to one danger score with explainable sub-scores. The homepage card states the thesis; the screen found no close art.

**Folds in.** PAT-007 Ecological Drivers (sole claim).

**Reduction to practice.** The code has a `riskScoring` router and a risk-assessment page, but no engine that computes ten named threats from sourced series into one score. **Build it before filing.** Family 2's pulse, Family 1's harvest and the inflation ladder are the obvious sources for six of the ten.

**Tier 2 once built.**

### Family 15. The Divorce Shield — fifty states, five scenarios

**What it is.** Protection rules for all fifty states, up to five what-if divorce scenarios, showing how much of the treasure is safe versus exposed once moved into a trust-owned policy.

**Folds in.** PAT-006 Divorce Asset Protection (sole claim), SI-030's divorce half.

**Reduction to practice.** `client/src/pages/portal/DivorceCalculator.tsx` renders and **calls zero procedures**; there is no fifty-state rules table in `shared/`. The screen found no close art, which makes this worth building: a state-rule table in the style of `taxRules.ts`, versioned and sourced, is a week of work.

**Tier 2 once built.**

### Family 16. Found in the code, on no sheet

Engines that exist, run, and were never listed:

- **Crypto halving-cycle accumulation planner** (`shared/cryptoCycleEngine.ts`): simulates the next Bitcoin cycles and an accumulation plan. Crowded space; Tier 4 unless tied to Family 1's sourcing rules.
- **Multi-property MYGA ladder** (`shared/multiPropertyMyga.ts` on `mygaWaterfall.ts`): multi-year guaranteed annuities laddered across properties, with the tax bracket engine consuming the output. Open-ish; Tier 3, a dependent of Family 7.
- **Roth conversion inside a growth annuity** (`shared/growthAnnuityEngine.ts`): the conversion executed within the contract. Related art at Income Lab; Tier 3, a dependent of Family 6.
- **Reverse HELOC** (`shared/reverseHeloc.ts`): folds into Family 5.
- **Policy-loan sequencing optimizer** and **premium financing schedule**: fold into Family 5 (Emergent E-4).
- **Estate tax with sunset and gifting** (`shared/estateTaxEngine.ts`) and **IUL versus Roth comparison** (`shared/advancedAnalytics.ts`): conventional; not patents.
- **Fact-suggestion pipeline** (`server/controlsRouter.ts`): FHIR, tax-feed and pasted-transcript imports land as pending suggestions that only the client may accept, with a consent event per decision. This belongs in Family 3 as a dependent claim and is not on any sheet.
- **Long-timer scheduler, memory gate, dependency-free spreadsheet readers, dual FRED transport**: good engineering, not patents.
- **The entrainment layer, the depth gauge, the reward sound on any successful action**: interface design; a design patent at most.

---

## Part 2. Redundancy map — where every one of the ninety went

| Old item | Family | Treatment |
|---|---|---|
| PAT-001 Cascading | 12 | Lead claim; real value in E-1, E-2 |
| PAT-002 HELOC-to-IUL | 5 | Lead claim |
| PAT-003 AI Whisper | 9 | Independent claim, narrowed to objection prediction |
| PAT-004 Wealth Genome | 11 | Lead, defensive |
| PAT-005 Tax Waterfall | 6 | Independent claim, narrowed to eight sources |
| PAT-006 Divorce Shield | 15 | Sole claim; build first |
| PAT-007 Ecological Drivers | 14 | Sole claim; build first |
| PAT-008 Behavioral Lock-In | 11 | Independent claim; wire to E-8 |
| PAT-009 Mortgage Recycling | 5 | The multi-cycle claim |
| PAT-010 Time Machine | 8 | Lead claim |
| PAT-012 Roth 100% | 6 | Independent claim |
| PAT-013 Monte Carlo floor/cap | 8 | Independent claim; strengthened by E-6 |
| PAT-014 FIA Collateral | 5 | Independent claim |
| PAT-015 Practice Platform | 12 | Independent claim; engine orphaned |
| PAT-016 Money That Says No | 7 | Lead claim |
| PAT-017 Political Radar | 2 | Lead claim |
| PAT-018 Guardian Ledger | 3 | System claim |
| PAT-019 Double-Run Trust Loop | 4 | Independent claim |
| PAT-020 Property Machine | 4 | System claim |
| PAT-021 Lifetime Income Chain | 7 | System claim |
| PAT-022 Political Machine | 2 | System claim (same as 017/031) |
| PAT-023 Everywhere Advisor | 9 | Lead claim |
| PAT-024 Zip Time Machine | 4 | Lead claim |
| PAT-025 Witness Rule | 1 | Lead claim |
| PAT-026 Report Card | 1 | Dependent (grading) |
| PAT-027 Truth Box | 1 | Dependent (fact record) |
| PAT-028 Truth Stack | 1 | System claim (same as 025/042) |
| PAT-029 Program Survival | 2 | Independent claim |
| PAT-030 Career-to-Home | 10 | System claim |
| PAT-031 Power Pulse | 2 | Dependent (reader) |
| PAT-032 Estate Fragility Replay | 3 | Dependent |
| PAT-033 Future-Self Negotiator | 7 | Dependent |
| PAT-034 House Budget Referee | 4 | Dependent |
| PAT-035 Suitcase Packer | 6 | Lead claim |
| PAT-036 Tax Shock Map | 2 | Dependent (propagation) |
| PAT-037 Arrival Meter | 7 | Independent claim |
| PAT-038 Timing Dial | 7 | Independent claim |
| PAT-039 Resilience Lens | 4 | Dependent |
| PAT-040 Black Box Packet | 3 | Dependent (signed advice) |
| PAT-041 Question Finder | 9 | Independent claim |
| PAT-042 Forecast Referee | 1 | Dependent (blending); same as 028 |
| PAT-043 Career Price Tag | 10 | Lead claim |
| PAT-044 Half-Life Engine | 2 | Dependent |
| PAT-045 Two-Audience Brain | 9 | Independent claim |
| PAT-046 Listening Site | 9 | System claim |
| PAT-047 Money Globe | 13 | Lead |
| PAT-048 Carrier Sentinel | 1 | Dependent |
| PAT-049 Political Repricer | 2 | Dependent |
| PAT-050 Consent Autopilot | 3 | Dependent |
| PAT-051 Regime Splitter | 8 | Dependent |
| PAT-052 Estate Paper Detective | 3 | Dependent |
| PAT-053 Globe and Ledger | 13 | Dependent |
| PAT-054 Locked Library Card | 1 | Dependent |
| PAT-055 Confidence Thermometer | 9 | Dependent |
| SI-001 AG49 "persuasive" illustration | 8 | **Drop** (regulatory exposure; AG49-A covers) |
| SI-002 Multi-Carrier Comparison | 8 | Dependent |
| SI-003 Replacement Analyzer | 8 | Dependent |
| SI-004 Premium Financing | 5 | Dependent |
| SI-005 Living Benefits Probability | 7 | Dependent |
| SI-006 Tax Code Change Simulator | 2 | Folded (versioned rules + shock map) |
| SI-007 Multi-Entity Router | 6 | Dependent |
| SI-008 CRT + Wealth Replacement | 6 | **Drop** (textbook strategy) |
| SI-009 Opportunity Zone | 4 | Dependent (thin) |
| SI-010 State Migration | 6 | Dependent (crowded) |
| SI-011 Gamified Literacy | 9 | **Drop** (crowded: EverFi, Zogo) |
| SI-012 Churn Prevention | 9 | **Drop** (crowded; US12229832B2) |
| SI-013 Life-Event Detection | 9 | **Drop** (taken: Brooklyn; US20230350698A1) |
| SI-014 Family Tree | 7 | **Drop** (crowded: MoneyGuide) |
| SI-015 Voice Dashboard | 9 | **Drop** (crowded; US12688535B2) |
| SI-018 Commission Router | 12 | **Drop** (conflict-of-interest optics) |
| SI-021 Quantum Stress Test | 8 | **Drop** (crowded; misnamed) |
| SI-022 Blockchain Audit Trail | 1, 3 | **Drop** (the hash chain is already claimed) |
| SI-023 Sentiment for Crediting | 8 | **Drop** (no sourcing that meets Family 1) |
| SI-024 Multi-Currency | 12 | **Drop** (crowded; not in code) |
| SI-025 Annuity Hidden Fees | 7 | Dependent (crowded: Cannex) |
| SI-026 Regulatory Sandbox | 9 | **Drop** (open, but no code) |
| SI-027 Digital Twin | 9 | **Drop** (crowded) |
| SI-028 Physician Loan Forgiveness | 10 | Dependent |
| SI-029 Syndication K-1 | 4 | Dependent (crowded) |
| SI-030 Spousal Splitting | 6, 15 | Dependent |
| SI-031 Disability Gap Bridge | 7 | Dependent |
| SI-032 Multi-Gen Sequencing | 7 | **Drop** (crowded: eMoney, MoneyGuide) |
| SI-034 1031 Chain | 4 | Dependent |
| SI-035 Risk Drift | 11 | Dependent (Andes patent exists) |
| SI-036 Buy-In Valuation | 12 | Dependent (open) |
| SI-037 Loss Harvest + Premium Timing | 6 | Dependent |
| SI-039 Beneficiary Optimization | 7 | **Drop** (crowded; US12217310B1 adjacent) |
| SI-040 Concentrated Stock + Hedge | 6 | **Drop** (taken: Brooklyn sell-down programs) |
| SI-041 IRMAA | 6 | Dependent (crowded) |
| SI-042 Estate Freeze + Replacement | 6 | **Drop** (textbook strategy) |
| Homepage: War Chest Transmutation | 5 | **Add** (was missing from the ninety) |
| Homepage: Suitcase, Report Card, Truth Stack, Survival Odds, Career-to-Home, Arrival Meter, Timing Dial, Black Box | 6, 1, 1, 2, 10, 7, 7, 3 | Already covered |

**Result:** ninety items become sixteen families. Sixteen items are dropped outright. Recommended filings: **eleven applications** (Families 1 through 10 plus the Debt-to-Liquidity family's Collateral Ladder once wired), each with three to eight dependent claims, and two more (14 and 15) once built. Families 11, 12, 13 and 16 ride as dependent claims inside others or wait.

---

## Part 3. Filing priority

**Tier 1, file first.** Family 1 Truth Stack. Family 2 Political Weather Machine (with Program Survival). Family 3 Guardian Ledger. Family 4 Property Machine (splice, referee, hazard score, double run). Family 5 Debt-to-Liquidity (with the FIA two-sleeve claim). Family 6 Suitcase scheduler with provenance gates and rule-version delta. Family 7 Arrival Meter, Timing Dial and refusal gate.

**Tier 2, file second.** Family 8 Time Machine, narrowly. Family 9 Listening Site, claimed as the objection pipeline, the quorum council, the unasked questions and the confidence score. Family 10 Career-to-Home. Family 6's twelve-month conversion. Family 11's cooling-off once wired. Families 14 and 15 once built.

**Tier 3, dependent claims or hold.** Family 12 Cascading Core as a standalone. Family 13 Money Globe. Family 16's MYGA ladder and annuity-internal Roth. The waterfall, IRMAA, state migration, 1031, syndication, OZ, annuity comparison and buy-in valuation dependents.

**Tier 4, drop.** The sixteen marked Drop in Part 2.

Ordering inside Tier 1, by what an examiner and an acquirer would each value most: 1, 3, 2, 5, 6, 4, 7.

---

## Part 4. What is missing, in three senses

**Missing from the sheet but present in code.** The War Chest Transmutation Engine (homepage Technology 02); the policy-loan optimizer, reverse HELOC and premium-financing engines; the fact-suggestion pipeline with client-only acceptance; the living risk profile; the retirement archetypes; the practice-growth simulator; the crypto cycle planner; the MYGA ladder; the annuity-internal Roth conversion.

**Present on the sheet but missing from code.** Family 15's fifty-state rules (the page is static). Family 14's ten-threat scoring engine. SI-026 sandbox. SI-024 multi-currency. SI-023 sentiment. Anything filed on these before they exist is a paper patent.

**Present in both but not connected.** This is Part 5.

---

## Part 5. The emergent patents — what appears when everything is wired

Each item names the connection that does not exist today, the files that make it, and the patent that comes into existence only because of it. These are ranked by how much they strengthen a Tier 1 family.

**E-1. One Tax Future.** *Wiring:* `shared/taxBracketEngine.ts` (`runDynamicTaxProjection`, imported by seventy-two files) starts consuming `shared/erosion.ts` (`taxTrajectory`, `burdenAt`) instead of its own forward tax model, so every one of the thirty-five calculators moves with the political pulse. *Emergent claim:* a calculator suite in which every projection shares one politically conditioned, forecaster-weighted, ledger-sealed tax path, and a change in the weekly pulse recomputes the whole suite with one sealed delta. *Why stronger:* Family 2 stops being a page and becomes the nervous system of Family 12. Today there are two independent forward tax models in the same repository.

**E-2. Every Projection Breathes with FRED.** *Wiring:* `server/inflation.ts` (`inflationLadder`, per-category, live) replaces the hard-coded three percent in about ten client pages (`IncomeGapAnalyzer`, `TaxAdvantagedGrowth`, `MedicareIRMAA`, `WithdrawalSequencing`, `MarketScenarioStressTest`, `PredictiveAnalytics`) and in `ltcEngine.escalate` and `unaskedQuestions`. Two of those pages discount with `(1 - r)` where the rest compound with `(1 + r)`; that is a bug the wiring fixes. *Emergent claim:* a client-specific inflation basket, sourced and dated, propagated as the single deflator to every projection in a planning suite, with the basket weights themselves sealed. *Why stronger:* the erosion disclosure's inflation ladder becomes a suite-wide fact instead of a page.

**E-3. The Sealed Stochastic Plan.** *Wiring:* `shared/monteCarloEngine.ts` is imported only by React components; nothing on the server runs it, so no probability band can be sealed to the ledger or signed into an advice packet. Move the run to a router (`server/simulationRouter.ts`), seed it deterministically, and seal the seed, the inputs and the percentiles. `forgiveness.simulate` and `StrategyCompare.tsx` (which hand-roll their own Monte Carlo) then call the same engine. *Emergent claim:* a stochastic projection whose seed, inputs, path count and percentile outputs are sealed to a hash chain so any band shown to a client can be re-run and proved later. *Why stronger:* Family 3's proof extends from point estimates to distributions, which is where regulators live.

**E-4. The Collateral Ladder.** *Wiring:* `shared/fiaCollateralEngine.ts` (reachable today only from an unrouted page), `shared/premiumFinancing.ts`, `shared/policyLoanOptimizer.ts`, `shared/reverseHeloc.ts` and `shared/householdWealth.ts` (`simulateHeloc`) all model borrowing against something and share no code. One engine, `shared/collateralLadder.ts`, takes every borrowable contract the household holds (home equity, policy cash value, FIA collateral sleeve, premium-finance line) and returns the order to draw, the cost of each rung, and the repayment schedule, under Family 3's mandates. *Emergent claim:* a method for sequencing draws across heterogeneous collateral (real property, life-insurance cash value, annuity collateral assignment, third-party premium finance) by after-tax cost and liquidity, with the sequence recomputed as rates and crediting change. *Why stronger:* it is the general form of PAT-002, PAT-009 and PAT-014 at once, and the prior-art screen found nothing on cross-collateral sequencing.

**E-5. Hazard-Aware Recycling.** *Wiring:* `shared/mortgageKiller.ts`, `householdWealth.ts` and `reverseHeloc.ts` take home value as a typed number; `shared/zipEngine.ts` has the sourced history, the drawdown record and (through `rentalEnterprise`) the FEMA hazard. Feed the zip report into the three mortgage engines, and delete the three duplicate amortization implementations in favor of `zipEngine.amortisation`. *Emergent claim:* a mortgage-recycling plan whose each cycle's equity is projected from the client's own zip window and discounted by that zip's hazard and drawdown history. *Why stronger:* Family 5's five-to-seven-year promise gets a sourced, zip-specific footing.

**E-6. The Time Machine Monte Carlo.** *Wiring:* `shared/ibbotsonModel.ts`, `shared/indexCreditingData.ts` and `shared/timeMachineEngine.ts` hold three separate historical index datasets and two functions named `calculateCreditedRate` that share no code. Unify on one dated series (Family 1 rules), then have the Monte Carlo sample its paths by block bootstrap from that series with the floor and cap applied per year. *Emergent claim:* a stochastic policy projection whose paths are resampled from the same sourced history the dual illustration displays, so the back-test, the forward illustration and the probability bands cannot disagree about the past. *Why stronger:* Family 8 gets past the AG49 art by claiming coherence across three views, which the guideline does not require.

**E-7. Mortality-Weighted Care and Estate.** *Wiring:* `shared/longevityEngine.ts` (SSA survival table) is imported by `incomeForLife` only. `ltcEngine` computes care duration with no survival input; `lifetimeIncomeEngine` uses a scalar life expectancy of ninety; `estateTaxEngine` and `inheritanceEngine` use a horizon with no curve. Import the survival table into all four. *Emergent claim:* long-term-care gap, annuity payment years and estate arrival all sized from one government survival curve for the same two people, so the plan cannot assume one death date for income and another for care. *Why stronger:* Family 7 becomes internally consistent, and the timing dial's method spreads to three more outputs.

**E-8. Drift-Triggered Cooling-Off.** *Wiring:* `shared/livingRiskProfile.ts` (drift detection, orphaned) into the `riskProfile` router that `RiskToleranceScoring.tsx` already calls, then its drift alert into PAT-008's outreach. *Emergent claim:* a behavioral intervention triggered not by a single trade but by measured drift between dated risk snapshots, with the cooling-off length set by the drift magnitude and the evidence shown drawn from the client's own sealed history. *Why stronger:* Family 11 moves from "detects a bias" (US20230075411A1 territory) to a time-series trigger the Andes patent does not describe.

**E-9. Career-to-Forgiveness.** *Wiring:* `shared/careerEngine.ts` (`repayment`, federal loan rates) and `shared/forgiveness.ts` (`standardPayment`, `monthlyPayment`) model the same federal loan independently, and `careerRouter` and `forgivenessRouter` share nothing. Hand the career ledger's loan balance and repayment path to the survival model. *Emergent claim:* the true cost of a medical career computed with the political survival odds of the forgiveness the plan depends on, so the ledger shows the cost with forgiveness, without it, and the expected value between. *Why stronger:* Family 10 inherits Family 2's strongest claim.

**E-10. The Council Everywhere.** *Wiring:* `server/_core/llm.ts` hard-codes one gateway and throws unless its key is set, while `server/ultraAI.ts` holds eleven working providers; twenty-four portal AI features are dark whenever the owner's own keys are the ones present. One adapter lets `invokeLLM` fall back to the council with the same truthful disclosure. *Emergent claim:* every AI feature in the portal running under the quorum, disclosure and two-audience rules of Family 9, with the same never-print lists. *Why stronger:* Family 9's honesty rules become platform-wide instead of homepage-wide; also, it is the single most valuable wiring change for the product.

**E-11. Advisor Memory Under Consent.** *Wiring:* the `aiMemoryNotes` table exists and is never written or read. Write advisor memories into it only through `shared/consent.ts` scopes, and let `invokePortalAI` read them under the same scopes. *Emergent claim:* an AI advisor whose memory of a client is partitioned by consent scope, revocable per scope, and audited on the ledger. *Why stronger:* nothing in the located agent-governance art scopes memory by consent.

**E-12. The Firewall Moves Money.** *Wiring:* `server/firewall.ts` executes with `rail: "ledger"`, meaning nothing moves; Plaid is declared in `server/integrations.ts` and implemented nowhere. Add one rail. *Emergent claim:* PAT-050's autopilot performing a real transfer under mandate, cooling-off and reserve floor, with reversal. *Why stronger:* Family 3 goes from a control layer to a fiduciary agent; this is the claim an acquirer pays for. It is also the one that needs counsel and a bank before it is switched on.

**E-13. Engines That Raise Their Hand.** *Wiring:* `shared/unaskedQuestions.ts` has twelve fixed rules reading the fact finder. Let every engine (forgiveness, inheritance, LTC, rental, career) publish its own flagged condition into the same queue. *Emergent claim:* the emergent question chosen across every engine's own findings rather than from one rule list, still consent-gated. *Why stronger:* Family 9's question finder becomes a property of the whole platform.

**E-14. One Report Card Path.** *Wiring:* `taxSchedule.harvestSource` and `forgiveness.harvestSource` create pending rows but only `erosion.reviewHarvest` can approve them; `erosion.recordActual`, `addClaim` and `updateSource` exist with no UI. Add the review pair to both routers and the three procedures to the Erosion page. Not a new patent, but Family 1's grading claim is only defensible if a human can actually enter an outcome.

**E-15. Ten Threats, Sourced.** *Wiring:* build Family 14's engine from series the platform already holds: inflation (E-2), tax path (E-1), program survival (Family 2), longevity (E-7), zip drawdown (Family 4), sequence-of-returns (E-6), long-term care (Family 7), plus health, policy change and liquidity from Family 1's harvest. *Emergent claim:* a single retirement danger score whose ten inputs are each sourced, dated and sealed, with the score's own confidence from the share of inputs that are verified.

Order of wiring by payoff: E-10, E-1, E-2, E-4, E-3, E-7, E-14, E-6, E-5, E-8, E-9, E-13, E-15, E-11, E-12.

---

## Part 6. Prior-art references gathered

Patents and applications: US9087048B2, US9015037B2 (fact verification against sources); US20230370274A1 (AI assessment provenance); US20240296295A1 (LLM quotation verification); US20250225587A1 (specialized-model digital advisor); US20230074406A1 / US12148421B2 (LLM assistant responses); US20230075411A1 (automated personalized planning); US12229832B2 (wealth-management workflows); US20230350698A1 (event processing); US12217310B1 (insurance policy lifecycle); US12688535B2 (conversational insurance enrollment); US11068911B1, US8676680B2 (Zillow valuation and rental indices); Andes Wealth Technologies investor risk-management patent (drift).

Papers and guidelines: Ash et al., *What Drives Partisan Tax Policy*; ifo Working Paper 198; IMF ordered-logit tax-change analysis; *Forecasting Political Developments with the Help of Financial Markets*; Rosenberg, *Will PSLF Ever Forgive Any Loans?*; *Mitigating the PSLF Disaster*; NBER w33462; PaperTrail (arXiv 2602.21045); TROVE (arXiv 2503.15289); forecast combination with MAPE (arXiv 2504.08940); AG49 and AG49-A (SOA product-development newsletters, carrier guides); BLS OEWS.

Products: MoneyGuidePro, eMoney, RightCapital, Holistiplan, Income Lab, RetireSmartIRA, Corvee, TaxPlanIQ, FP Alpha, Orion, Nitrogen, Brooklyn Investment Group, Altruist, Andes, Cannex, Annuity Intelligence, Ensight, Zinnia, iPipeline, WinFlex, BackNine, Gong, Chorus, Cresta, Uniphore, Zoom AI, Jump, Zocks, EverFi, Zogo, PropData, ZipSnapshot, HousingHandbook, Roofstock, Mashvisor, AirDNA, Doximity, Medscape, White Coat Investor.

---

## Part 7. Before counsel files anything

1. Fix the one false sentence: `client/src/pages/portal/PatentShowcase.tsx` says "filed with the USPTO." Nothing is. Every other page says pending or not filed.
2. Build Families 14 and 15; they are on the sheet with no code behind them.
3. Wire E-10, E-1 and E-2 first; they are cheap and they turn three Tier 3 items into Tier 1 evidence.
4. Give each Tier 1 family a one-page disclosure in the erosion-disclosure format: field, problem, elements, novelty as understood by the inventor, prior art starting points, reduction-to-practice files and first commit.
5. Run a formal search on the Tier 1 claims through USPTO Patent Center, Google Patents and WIPO by CPC class (G06Q 40/06, G06Q 40/08, G06Q 10/06, G06N) before drafting; the screens here were product-page level.
