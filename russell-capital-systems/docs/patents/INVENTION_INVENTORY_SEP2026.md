# Invention Inventory — what is in the code that is not yet on the patent sheet

Written 7 September 2026 from a full read of `shared/`, `server/`, `client/src/` and `docs/`.
Inventor named in every disclosure: Samuel A. Russell V. Owner: Russell Holdings Management LLC.

**Status rule.** Nothing in this file is filed, pending or granted until counsel files it.
Every item is written as a *candidate*. The word "granted" never appears beside any of them.

**What is already on the sheet** (and therefore left out below): the fifteen homepage claims
in `shared/homeManifesto.json` (Cascading Core, Wealth Genome, Debt-to-War-Chest, Tax
Waterfall, Zero-Cost Roth, Equity Arbitrage, Mortgage Killer, FIA Collateral, Divorce Shield,
Risk Radar, 10,000-Scenario Stress Test, Time Machine Dual-View, Behavioral Safeguard,
Whisper Coach, Russell Number + Practice Platform), the eight titles in
`client/src/pages/portal/PatentShowcase.tsx`, and the six elements of
`docs/patents/EROSION_ENGINE_INVENTION_DISCLOSURE.md`. Where a new item *extends* one of
those, the line "Builds on:" says which.

**One thing to fix on the existing sheet.** `PatentShowcase.tsx` says "filed with the USPTO."
`homeManifesto.json` says "nothing here is granted yet." The erosion disclosure says "not
filed." The corpus index says "no application numbers exist." Pick one true sentence and I
will make every page say it.

How to read each item: the name, where it lives in the code, what it does in plain words
(written for a ten-year-old), and the one thing that makes it different from what exists.

---

## PART ONE — SINGLES

### Family A. The truth machinery (how the site refuses to make things up)

**A1. Verified-or-not as a type**
Where: `shared/mutualIulCarriers.ts` (`Verified<T>`, `v()`, `unverified()`).
Every fact about an insurance company is stored in a little box. The box holds the fact, a yes-or-no "did we read this on the company's own website," the web address, and the date. If we could not read it, the box still exists, but it says "not verified" and why. The page shows the reader which boxes are checked and which are not. Nobody can sneak an unchecked fact onto a page, because the box will not let them.
Different because: most software stores a number. This stores the number *and its proof* in the same place, so a missing proof shows up on the screen.

**A2. The two-tier sourcing protocol with refusal lists**
Where: `docs/engines/*.md`, `shared/ltcEngine.ts` (`STATE_FIGURE_PROTOCOL`), `shared/incomeForLife.ts` (`INCOME_PLAN_RULES.neverPrinted`).
Every number on an engine page comes from one of two doors. Door A: the computer read it from the publisher's own file and wrote down the year and the link. Door B: a person typed it from a named page on a named day. There is no Door C. Each engine also carries a written list of things the page is *not allowed to say* (a payout not on a dated rate sheet, "income makes you live longer," a company name beside the exit provision). The list is code, not a policy memo.
Different because: the rules live in the same file as the arithmetic, so a page cannot drift away from them.

**A3. The verbatim-quote guard**
Where: `server/forecastSources.ts` (`quoteVerified`, `harvestSource`).
When an AI reads a government forecast page and reports a number, it must also hand back the exact sentence it found the number in. The server then checks two things: that the sentence really is on the page, and that the number really is inside that sentence. If either check fails, the number is thrown away before anyone sees it. Several AIs read the same page, and if they agree within one percent, their answers are folded into one row that remembers who agreed.
Different because: the AI is treated like a witness who has to point at the line in the document, not like an oracle.

**A4. The AI never sets the direction**
Where: `server/forecastSources.ts` (`readingFor`, `HARVEST_METRICS`).
The AI is only allowed to bring back a figure. What that figure *means* for a family's future taxes (up, down, or nothing) is decided by a fixed table written by a person. Any figure the table does not know about is dropped. So an AI can never quietly decide that a bigger deficit means lower taxes.
Different because: judgment and reading are split into two jobs, and the machine gets only the reading job.

**A5. Automatic report cards for forecasters**
Where: `server/forecastSources.ts` (`ACTUAL_SERIES`, `scorePanel`).
Every forecaster (the CBO, the Treasury, the think tanks) made predictions years ago. When the real number is finally published by the government, the server looks it up on its own, compares it to the old prediction, and gives the forecaster a score: one divided by one plus the average miss. Nobody types a grade. A source that gets things wrong loses weight in every future calculation.
Different because: the grading is done from the public record, automatically, and a source that never published is simply not graded, never guessed.

**A6. Consistency grading**
Where: `server/forecastSources.ts` (`consistencyFor`).
If a forecaster keeps changing its own number for the same year, the server measures how much it wobbled and lowers its weight. No wobble scores a perfect one. A forecaster that never repeated a prediction gets "no grade" rather than a fake average.
Different because: it punishes flip-flopping with arithmetic, not opinion.

**A7. Three-factor source weight**
Where: `server/forecastSources.ts` (`sourceWeight`).
Each source's say in the answer is evidence × (half plus half its report card) × (half plus half its consistency). A bad report card can cut a source in half but never to zero, so no single grade can erase a real institution. The formula is printed on the page.
Builds on: Erosion disclosure element 2 (forecaster panel).

**A8. Owner approval as the only door**
Where: `server/forecastSources.ts` (`reviewHarvest`), `forecast_harvests` table.
Every figure that survives the quote guard waits in a queue with its sentence, its readers and its meaning. The owner taps approve or reject. Nothing enters the model any other way.
Different because: the human is placed *between* the AI and the model, not after it.

**A9. Read-with-the-AI that stores nothing**
Where: `server/zipData.ts` (`strReadPage`), `shared/strSources.ts`.
The server can open a rental-data website, read the page, and report only the figures whose sentences are on that page, labelled "read on this date from this address." It keeps none of it. Sites that hide their numbers behind a login stay as plain buttons until a key exists.
Different because: the site shows you the number it read today instead of a number it remembered.

**A10. The registry that encodes refusal**
Where: `shared/strSources.ts` (`STR_SOURCES`, `STR_PROTOCOL`, `strApiLine`).
Ten rental-market data companies are listed by *how* they let you in: self-serve key, contract only, your own listings only, download only, or not at all. The advisor's instructions are rebuilt on every question to say which ones this server actually holds a key for, and forbid naming any nightly rate or occupancy not read from one of them on a stated date.
Different because: the AI's permission to speak is derived from the environment, question by question.

**A11. The public concierge that withholds the method**
Where: `server/ultraAI.ts` (`PUBLIC_TEASER_SYSTEM`, `homepagePanel`), `client/src/components/HomeLeadFactFinder.tsx`.
A visitor can ask the homepage anything, and every AI on the council answers. But the public version has a hard rule: no dollar amounts, no percentages, no formulas, no step-by-step sequences. The visitor gets the idea; the owner's private inbox gets the figures.
Different because: the same brain answers two audiences under two rule sets, enforced in the prompt and in the data path.

**A12. The key probe**
Where: `server/keyProbe.ts`, `ultra.keyProbe`.
Every secret key the site holds can be tested with one cheap read-only call to its provider. The result is a word (ok, rejected, missing) and the provider's own reason with anything key-shaped blacked out. Cached ten minutes so nobody can run up a bill by refreshing.
Different because: it proves a key works without ever showing the key.

**A13. Approval-gated partner quotes**
Where: `shared/inheritanceEngine.ts` (`PARTNER_COPY.quote.approved`).
A partner company's savings claim sits in the code with a switch set to "not approved." The server hides it until the owner flips the switch. The site cannot repeat a partner's number by accident.

### Family B. The power layer (politics as a measured input)

**B1. Control-conditioned base rates**
Where: `shared/powerHistory.ts`, `shared/erosion.ts` (`PowerInput`, `expectedShareOver`).
Every year since 1945 is stamped with who held the White House, the Senate and the House. Those three become one number: how much of the levers the left holds (president counts half, each chamber a quarter). When the site asks "how often did taxes go up over the next twenty years," it looks only at past windows where the levers looked like they are expected to look, not at all of history mixed together.
Different because: political control picks *which history to learn from* instead of being a fudge factor added at the end.

**B2. The thin-bucket fallback**
Where: `shared/erosion.ts` (`MIN_WINDOWS`, `fellBack`).
If there are fewer than fifteen past windows that match today's politics, the site says so and uses all of history instead, printing which one it used. It would rather admit a small sample than pretend.

**B3. The pulse**
Where: `server/power.ts` (`powerSweep`, `startPulseSchedule`).
Once a week, with no keys, the server reads the current seat counts in Congress, the share of sitting federal judges by the party that appointed them, the governors, and the prediction-market odds on who wins the next election. Each reading is stored with its date and its source. A feed that fails leaves the last reading in place instead of a made-up one.
Different because: it turns "who is in power" into a dated time series a model can consume.

**B4. Power swing**
Where: `shared/erosion.ts` (`pHigherIfLeft`, `pHigherIfRight`, `powerSwing`).
At every horizon the page shows two answers: the odds taxes rise if the left holds the levers, and if the right does. The gap between them is printed. That gap is how much of the forecast is politics and how much is everything else.

**B5. Inflation-by-control, shown but not used**
Where: `server/power.ts` (`inflationByControl`).
The server computes average inflation under each political configuration since 1947 and prints it as history, with a caveat that the Fed, oil and wars move prices more than Congress. It deliberately does not feed this into the forecast.
Different because: a tempting correlation is displayed and quarantined at the same time.

**B6. Political correlation computed, not asserted**
Where: `shared/forgiveness.ts` (`politicalCorrelation`).
Every expansion and cut of every federal loan-forgiveness program since 1987 is stamped with the politics of its year. The page computes the correlation itself and prints the sample size, and it splits out court rulings because no elected lever controls a judge.

**B7. Program survival as hazard × political tilt × execution**
Where: `shared/forgiveness.ts` (`programSurvival`, `politicalTilt`).
The odds that forgiveness actually arrives are three numbers multiplied: the chance the program survives each year (learned from how often programs have been cut), tilted up or down by the expected political lever share, times the chance the borrower keeps doing the paperwork. The competing, gloomier estimate from the AI council is recorded as the bear case and explicitly not adopted, with the reason.

### Family C. The engines built since the sheet was written

**C1. The Zip Engine's back-cast and client-chosen window**
Where: `shared/zipEngine.ts`, `server/zipData.ts`.
Home prices by zip code only go back to 2000 in dollars, but a government index goes back further. The engine splices them so a family can see their zip since the record began, and labels exactly which years are spliced. Then a slider lets the client choose the start year, and every average and every forward projection is recomputed from the window they chose, with the window printed beside the number.
Different because: the client picks the history, and the page never hides that choice.

**C2. Cohort as a query, not a label**
Where: `shared/zipEngine.ts` (`cohortMembers`, `cohortSummary`).
"Zips like mine" is not a stored category. It is computed fresh from whichever zips had a similar value at the start of the chosen window, and every median it reports carries the count of zips behind it.

**C3. Purchasing power with the binding rule named**
Where: `shared/rentalEnterprise.ts` (`purchasingPower`).
The engine solves the most house a family can buy two ways: what their cash carries (down payment plus closing plus reserve months) and what their income carries under the lender's debt limit with partial rent credit. The smaller wins and the page says which rule bound, with the arithmetic in three plain lines.

**C4. Candidate zips scored with hazard and drawdown penalties**
Where: `shared/rentalEnterprise.ts` (`scoreCandidates`), `server/rentalEnterprise.ts` (FEMA reader).
Each zip's score is rent yield plus appreciation minus a penalty from FEMA's National Risk Index minus a penalty for any past crash worse than twenty percent, and every term comes back as a printable sentence. Zips with no published rent record cannot be scored for income and are excluded unless the caller allows it.

**C5. One house or four, with the resale-permanence argument**
Where: `shared/rentalEnterprise.ts` (`pickPlans`).
The same purchasing power becomes two plans: the one best zip whose typical home fits the budget, and four zips whose typical homes each fit a quarter of it. The note states the thesis: a smaller house sells into a bigger crowd of buyers, so its resale is the more permanent.

**C6. The trust loop, run twice**
Where: `shared/rentalEnterprise.ts` (`trustLoop`, `runEnterprise`).
Each year the tax the rentals save becomes premium into a policy owned by an irrevocable trust. The trustee borrows against the policy and pays the property loans' principal, spread across properties by what each still owes. The engine runs the whole thirty years twice, once without the loop and once with it, and reports the difference as the loop's own contribution.
Different because: the benefit of the structure is isolated by subtraction, not asserted.

**C7. Mutual-only carrier registry and read protocol**
Where: `shared/mutualIulCarriers.ts` (`CARRIER_READ_PROTOCOL`, `INSURED_NOTE`).
A carrier qualifies only if policyholders own it. First-year loan permission is typed as allowed, not allowed, or unknown, and unknown means "read the policy form." The insured-versus-owner note lets an uninsurable client own a policy on a healthy spouse and keep every right.

**C8. The Career Ledger's four costs**
Where: `shared/careerEngine.ts`, `server/careerData.ts`.
For thirty-six kinds of doctor, dentist, vet and lawyer, the engine computes what the training cost with interest piling up in school, what the years of low pay cost compared with a different job, the true pay per hour counting commute and travel, and where a person's income sits against the government's own pay distribution. Every training length links to the accreditor's own document.

**C9. Peer comparison that refuses below five**
Where: `shared/careerEngine.ts` (`peerCompare`).
A specialist's figures are compared with peers' medians, but with fewer than five peers the page says "not enough peers yet" instead of printing a median of three people.

**C10. Before-and-after goal confidence**
Where: `shared/careerEngine.ts` (`VISION_QUESTIONS`, `EXIT_QUESTION`), `client/src/components/ExitRating.tsx`.
The visitor rates how likely they are to reach their goals before the consultation and again when their mouse heads for the close button, at most once per session and only after ninety seconds. The difference is the site's own measure of whether it helped.

**C11. The Inheritance Engine's arrival tax**
Where: `shared/inheritanceEngine.ts` (`inheritanceReport`).
Each thing a family expects to inherit is typed by how the tax code treats it on arrival (tax-free, ordinary income, stepped-up basis, part-gain, trust). Today's tax is scaled by the future-tax multiplier from the erosion engine, capped so it can never exceed the amount, deflated to that year's dollars, and weighted by how likely the inheritance is. If the gain share of an annuity has not been entered, it refuses to size the tax and says so.

**C12. The gentle follow-up**
Where: `shared/inheritanceEngine.ts` (`FOLLOW_UP`).
Three careful questions about a parent's remarriage, split into moves that can be undone and moves that cannot, each with its statute. Offered once, never repeated unless the client raises it.

**C13. Median-split regime analysis with a correlation that refuses**
Where: `shared/iulLinks.ts`.
The policy's credited rate each year is laid beside inflation and the money supply. Years are split at each series' median and the average credit in high years versus low years is shown. The correlation returns nothing below eight paired years, and a caveat printed above every table says this is the record, not a mechanism.

**C14. Tax-equivalent yield tied to the client's bracket**
Where: `shared/iulLinks.ts` (`taxEquivalentYield`), `server/iulLinksRouter.ts`.
A tax-free credit is restated as what a taxable account would have to earn at the client's own marginal rate, read from their fact finder.

**C15. Rider versus standalone without declaring a winner**
Where: `shared/ltcEngine.ts` (`premiumCompare`, `coverageFor`).
For each person in the family the engine shows what each kind of care costs in their state, how many months the policy's chronic-illness rider would buy, and the shortfall. A standalone quote can sit beside it, and the page prints the cost ratio only when both quotes are typed, with a note refusing to call either cheaper.

**C16. Joint survival from the government life table**
Where: `shared/longevityEngine.ts`.
From the Social Security table the engine computes the chance one person is alive at 80, 85, 90, 95 and 100, and for a couple the chance at least one of them is. Expected lifetime payments are the yearly amount times the expected years at least one is alive.

**C17. The engine that refuses taxable money**
Where: `shared/incomeForLife.ts` (`incomePlan`).
Ask it to illustrate lifetime income on a taxable account and it returns a refusal with the reason. The pre-tax account goes through the Roth conversion pass first. The payout comes only from a rate-sheet row the owner typed with a link and a date, and the page prints no figure without one.

**C18. The flow-through policy as four questions**
Where: `shared/incomeForLife.ts` (`FLOW_THROUGH`).
A structure where income is paid into a trust-owned policy and returned within days is shown as the four legal questions that decide whether it works, each with its statute, and the page says it will show a multiplier only after the carrier's illustration and the attorney's letter answer them.
Different because: an untested structure is held in a non-executable state on purpose.

**C19. The tax schedule's fixed order, Roth last and counted as a cost**
Where: `shared/taxSchedule.ts`, `shared/taxStrategies.ts`.
Twenty-nine strategy families are placed in a fixed order: baseline, reducers, deduction engines sized to the room under the target bracket and capped by the excess-business-loss limit and a risk ceiling, charitable bunching every third year, then the Roth conversion last, filled exactly to the top of the bracket after everything above lowered its price, and counted as a cost.
Builds on: sheet claims 4 and 5.

**C20. Verified flags that gate sizing**
Where: `shared/taxStrategies.ts`.
Every parameter carries a source and a verified flag. Two unverified parameters exist in the file and are never used to size a step. The confidence printed beside each step blends the family's authority with the share of its parameters that are verified.

**C21. Versioned tax rules with a recompute delta**
Where: `shared/taxRules.ts`, `server/controls` rules tab.
Each tax year is one named rule set with its revenue procedure. A plan can be re-run under a different year's law and the difference is sealed to the ledger as a "rules" event.

**C22. Replacement scoring by breakeven month**
Where: `shared/replacementScoring.ts`.
Whether to replace an old annuity is scored by the month at which the new contract's gains overtake the cost of leaving the old one, including state guaranty-fund headroom. A score of zero means "do not replace," which is a defensible answer to give.

**C23. Risk tolerance as a time series**
Where: `shared/livingRiskProfile.ts`.
Each risk questionnaire is stored with its date. Drift between snapshots triggers an alert, and the trend is projected forward.

**C24. The questions you have not asked**
Where: `shared/unaskedQuestions.ts`, `server/unaskedRouter.ts`.
Twelve rules read the client's own assessment and produce questions they did not think to ask, each with a dollar scale and its derivation, or a stated zero when a figure is missing. Nothing is shown before the client says yes at each step, every yes and no is a consent event, and the card re-offers only after thirty days or when a stronger question enters the top three.

**C25. The journey and the emergent question**
Where: `shared/journeyEngine.ts`, `shared/journeyCatalog.ts`.
Everything a client ever asked is distilled into three to five core questions, plus the one strongest signal in their facts that none of their questions covered. A ten-to-fifteen-page route through the site is composed in a fixed order, with a list of what the client controls and what they do not. The AI may polish the wording; the result is thrown away if it changes a page, an order or a size.

**C26. The librarian's hard gate**
Where: `server/librarianRouter.ts`, `client/src/components/TapeRecorderAdvisor.tsx`.
No planning answer of any kind, not even partial, until the fifteen-section assessment is complete. Before that, the advisor explains what is missing and hands over the assessment.

### Family D. The guardian ledger (proof, consent and money control)

**D1. Hash-chained diff ledger with time-scrub replay**
Where: `shared/planLedger.ts`, `server/ledgerDb.ts`, `client/src/pages/portal/PlanLedger.tsx`.
Every fact, decision, consent and outcome is a link in a chain where each link's fingerprint includes the one before it. A save that changes nothing writes nothing; a save that changes one field writes one link. A slider replays the plan as it stood on any date, and a break in the chain points at the exact link that was altered.
Builds on: Erosion disclosure element 6 (ledger).

**D2. Scenario sealing**
Where: `server/erosionRouter.ts`, `forgivenessRouter.ts`, `taxScheduleRouter.ts`.
Any projection can be sealed to the chain with every input and the rule version, so the page shown today can be proved tomorrow. Viewing never writes; only the seal button does.

**D3. Signed advice with fact fingerprints**
Where: `server/advice.ts`.
Every answer is recorded with the question, the voices used, the rules, and the facts it consulted as key-plus-fingerprint, never the figure. The whole record is signed; anyone can check it was not altered, and the figures never leave.

**D4. Consent ledger with hierarchical scopes**
Where: `shared/consent.ts`.
Twelve named permissions, four kinds of grantee, every grant time-boxed and revocable, with wildcards so "health:*" covers every health scope. Every scoped read passes one function.

**D5. Scoped agent mandates**
Where: `shared/mandates.ts`.
An AI agent is bounded to named actions, named accounts, a per-action ceiling, a rolling period ceiling and a human-approval line. The verdict distinguishes "outside the mandate" from "inside it but above the line."

**D6. The fiduciary transaction firewall**
Where: `shared/firewall.ts`, `server/firewall.ts`.
Every proposed money movement is judged against the client's own policy, the proposer's mandate, known payees, a new-payee cooling-off period, a conflict-of-interest list that always includes the advisor, and a reserve floor. The verdict is allow, hold or block, with every reason and the approvers required, sealed to the ledger.

**D7. Automations with loop prevention**
Where: `server/automations.ts`.
Rules fire on ledger events, run once per event fingerprint, route money through the firewall under their own mandate, and never fire on events they themselves wrote, so a cycle cannot form.

**D8. Event bus that withholds the figures**
Where: `server/eventBus.ts`.
Outside systems can be told "the plan changed" with a signed message, but financial facts are excluded unless a switch is thrown.

**D9. Provenance vault with estate-consistency checking**
Where: `server/provenance.ts`.
Every uploaded document gets a fingerprint, a version chain and a signature. Estate documents are checked against the plan's own facts: a spouse missing from the will, dependents with no guardian, a stale date. It flags at upload time and never auto-corrects.

### Family E. The interface (how a person moves through it)

**E1. The Sphere**
Where: `shared/sphere.ts`, `client/src/pages/portal/Sphere.tsx`.
Every page is a point with two coordinates: one of twelve domains of a financial life around the equator, and one of four layers inward (facts, erosion, moves, proof) with the ledger at the centre. The map doubles as a gap chart: an empty cell says "this is where the next page belongs." Adding a page means placing a point, never adding a menu.

**E2. The every-page microphone with six answer shapes and a horizon mode**
Where: `client/src/components/VoiceAdvisor.tsx`, `shared/advisorModes.ts`, `server/ultraAI.ts`.
A mic follows the visitor on every page. Speech is turned into text inside the browser, so audio never leaves the machine. The visitor picks the shape of the answer: direct, deeper, integrated, what's-in-it-for-me told through a sports-team analogy, legal with citations, or all of them. A seventh mode asks permission, collects five more facts, and instead of re-answering names the questions the person should be asking in twenty years and answers them now. The whole thing can be emailed as a PDF only after the address is typed twice.
Builds on: sheet claim 14 (Whisper Coach), turned toward the client instead of the advisor.

**E3. The council with honest synthesis**
Where: `server/ultraAI.ts` (`panel`, `leadModel`).
One question goes to every AI that has a key. Failures are reported as failures, unconfigured ones are named as skipped, and a lead model synthesizes only when more than one answered. The page can say truthfully how many advisors contributed.

**E4. The Ultra Calculator's chained windows with AI triage**
Where: `client/src/pages/UltraCalculatorPage.tsx`, `shared/ultraEngine.ts`.
One household profile; an AI first labels each calculator module necessary, optional or not needed with a written reason; then the client defines successive multi-year windows with goals in their own words, and each window inherits the previous one's ending balances, so the whole suite runs as one chained simulation.
Builds on: sheet claim 1 (Cascading Core).

**E5. Cross-tool strategy flow**
Where: `client/src/contexts/StrategyContext.tsx`, `client/src/components/StrategyFlowBanner.tsx`, `RelatedCalculators.tsx`.
When one tool publishes a result relevant to another, the second offers to apply it and offers "use in" links onward, and a related calculator can open inline without re-asking shared data. The calculators become a directed graph.

**E6. The credibility overlay**
Where: `client/src/components/IbbotsonCredibilityOverlay.tsx`.
A "show me the math" button on any projection opens the year-by-year historical data behind the number, the method, and a start-year picker so the client can move the window the projection rests on.

**E7. Site health as an executable audit**
Where: `server/siteHealthRouter.ts`, `client/src/pages/portal/SiteHealth.tsx`.
Sixty checks the server runs against itself: it fetches its own pages, reads its own security headers, checks backup age in hours, and cross-references every navigation point against the built route list. Items only a human can finish are marked "your step" with the exact action.

**E8. The single SEO catalogue**
Where: `shared/seo.ts`, `server/_core/siteHardening.ts`.
One catalogue drives the head tags, the sitemap, the robots rules and the structured data, and the specialty landing pages are generated from the Career Ledger's registry, so the sitemap and the pages can never disagree.

**E9. Specialty landing pages as a working peer ledger**
Where: `client/src/pages/SpecialtyPage.tsx`, `server/careerRouter.ts`.
A public page per specialty that is also a form: cited training, pay by state, tuition, the cost of becoming that specialist, and a live comparison against what other peers entered.

**E10. The entrainment layer**
Where: `client/src/contexts/EntrainmentEngine.tsx`, `client/src/hooks/useSoundOfMoney.ts`.
The whole site breathes at six breaths a minute through brightness and scale, plays day and night tones, and hooks the app's global mutation cache so any successful action anywhere triggers a reward sound without touching the pages.

**E11. The depth gauge**
Where: `client/src/components/DepthSelector.tsx`.
Instead of asking "how many questions," a vertical gauge gets visually heavier as it goes deeper, and the depth chosen sets the count.

**E12. The financial assessment that is forbidden from computing**
Where: `client/src/pages/portal/FinancialAssessment.tsx`, `shared/clientFactFinder.ts`, `shared/assessmentBridge.ts`.
Fifteen sections and about 190 questions that collect and document only, never compute. A bridge maps them onto the shape every calculator already consumes and reports what it could not fill, so a page says "missing" instead of showing a zero as if it were a fact.

### Family F. Engineering worth knowing about (probably not patents)

Long-timer scheduling that survives Node's 25-day overflow (`server/_core/schedule.ts`); a memory gate that lets big sweeps run only when the container has room (`server/_core/memory.ts`); a dependency-free spreadsheet reader for FHFA, BLS and FEMA files (`server/zipData.ts`); FRED dual transport with last-good persistence (`server/_core/fred.ts`); backups with object-aware SQL (`server/backups.ts`); owner sign-in with TOTP and timing-safe compare (`server/_core/ownerLogin.ts`). Good engineering, weak patents.

---

## PART TWO — COMBINATIONS

Each combination is several singles that only make sense together. These are the stronger applications.

**X1. The Truth Stack**
A1 + A2 + A3 + A4 + A5 + A6 + A7 + A8.
A planning system in which every number carries its proof, every AI-read figure must point at its sentence, the AI may never decide what a figure means, forecasters are graded automatically against the public record and against their own consistency, and nothing enters the model without the owner's tap. Together they make an AI that cannot hallucinate a forecast into a family's plan.
Builds on: the erosion disclosure, which it turns into a full evidence pipeline.

**X2. The Political Weather Machine**
B1 + B2 + B3 + B4 + B5 + B6 + B7.
A weekly, keyless reading of who holds power, turned into a lever share that selects which history to learn from, printed as the swing between left-held and right-held futures, and reused as a survival multiplier for government programs. Politics becomes a measured input with its own sample-size honesty.

**X3. The Property Machine**
C1 + C2 + C3 + C4 + C5 + C6 + C7 + A9 + A10 + C13 + C14.
From a zip code's spliced history and the client's chosen window, through purchasing power with the binding rule named, hazard-penalized candidate zips, one house versus four, into a trust-owned policy loop whose contribution is isolated by running the plan twice, backed by a mutual-only carrier registry and a rental-data protocol that refuses unread numbers.
Builds on: sheet claims 6 and 7 (Equity Arbitrage, Mortgage Killer), extended with public-data sourcing and the trust structure.

**X4. The Lifetime Income Chain**
C17 + C16 + C18 + C11 + C12 + C19 + C21.
Pre-tax money goes through the conversion pass first, income is sized to joint survival from the government life table, the flow-through structure is held as questions until answered, what the children inherit is taxed by class in that year's dollars, the follow-up is offered once with consent, and every tax step sits in a fixed order with Roth last. One chain from the first conversion to the last inheritance.
Builds on: sheet claims 4 and 5.

**X5. The Guardian Ledger**
D1 + D2 + D3 + D4 + D5 + D6 + D7 + D8 + D9.
An append-only chain that replays to any date, seals every projection, signs every piece of advice with fact fingerprints, gates every read by consent, bounds every agent by mandate, judges every money movement through a firewall, runs automations that cannot loop, tells the outside world "changed" without the numbers, and checks estate documents against the plan at upload. The client's whole financial life under one tamper-evident authority layer.

**X6. The Listening Site**
E2 + E3 + C24 + C25 + C26 + C10 + A11.
A microphone on every page with six answer shapes and a horizon mode, a council that reports honestly who answered, questions the client never asked offered only with consent, a journey with an emergent question, a librarian that refuses to advise before the assessment, and a before-and-after confidence score at the door. The site that asks permission before it teaches, and measures whether it did.

**X7. Career-to-Home**
C8 + C9 + C10 + E9 + C1 + E4.
A specialist's true cost of training and pay per hour, compared with peers only above a minimum sample, on a public page that is also a form, handing the zip code's sourced appreciation to the chained calculator. One path from "what did becoming a doctor cost" to "what can that doctor afford."

**X8. The Two-Audience Brain**
A11 + E3 + A12 + D8.
The same council answers visitors under a method-withholding rule and clients under a full rule, proves its keys work without showing them, and tells outside systems the plan changed without telling them the figures.

**X9. The Sphere plus the Ledger**
E1 + D1 + E7 + E8.
Every page is a coordinate on one object with the ledger at the centre; the site audits its own links against that object; the sitemap is generated from the same registry. Navigation, proof and search are one structure.

---

## What to do with this file

1. Upload your current patent sheet. I will mark each item above as "already on it," "extends item N," or "new," and cut the ones you do not want.
2. For each one you keep, I write a one-page disclosure in the format of `docs/patents/EROSION_ENGINE_INVENTION_DISCLOSURE.md` (field, background, summary, elements, novelty, drawings list) for counsel.
3. Fix the "filed with the USPTO" sentence on the showcase page to whatever is true.
