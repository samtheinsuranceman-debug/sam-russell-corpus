# Russell Capital Systems — The New Patents, Explained Like You're in 5th Grade

**Prepared for:** Samuel Russell, Russell Holdings Management, LLC
**Date:** September 7, 2026
**Purpose:** Same framework as the April 28, 2026 document (57 patents). These are the inventions that were found *inside the running code* on September 7, 2026 and are not among the 57. Each one is written the same way: The Simple Version, How It Works, Working Components, Why It's Patentable.

**Prepared by the Integrated AI Team:** Claude (code sweep and drafting) + OpenAI GPT-5.6 Terra (claim classification and combination drafting) + Perplexity (prior-art scout, September 7, 2026).

**Status line, same as always:** Nothing here is filed, pending or granted until counsel files it. Every item is a candidate. Where Perplexity found something close, it is written under "Prior Art Scout" so counsel can draw the claim around it.

---

# Part III: The New Core Patents (PAT-016 to PAT-037)

These are ground-level inventions: each one works on its own, and most of them were built into the platform between May and September 2026.

## PAT-016: Proof-Carrying Number System

**The Simple Version:** Imagine every number in your homework had to come with a sticky note that says where you got it, on what day, and whether you actually saw it with your own eyes. If you didn't see it, the sticky note has to say "I did not see this." This invention makes every fact the platform stores about an insurance company carry that sticky note, and the sticky note follows the number onto the screen. Nobody can peel it off.

**How It Works:** Instead of storing a number, the system stores a little box: the value, a yes-or-no "verified" flag, the web address it was read from, the date, and a note. Two builder functions exist: one for facts read from the company's own page, and one for everything else, which stamps the box "unverified" and records why (for example, "the product page returned 404"). Every engine page reads the box, not the bare number, so an unverified fact is drawn on the client's screen with its reason instead of being quietly dropped or quietly trusted. On top of the boxes sits a two-door rule: a figure enters the platform either because the server read it from the publisher's own file (with the year and link stored), or because a person typed it from a named page on a named day. There is no third door. Each engine also carries a written list of things its page is forbidden to print, and that list is code, not a policy memo.

**Working Components:** (1) The Verified Box type with value, flag, source, date and note, (2) the Read-From-Source builder and the Unverified builder, (3) the Two-Door sourcing protocol (read-and-cited or typed-from-a-named-page), (4) the per-engine Never-Printed list enforced in code, (5) the Partner-Quote gate that ships a partner's number switched off until the owner turns it on, (6) the Verified-Share confidence that lowers a strategy's confidence by the fraction of its parameters that are unverified.

**Why It's Patentable:** Provenance systems exist for AI answers, but financial planning software stores numbers, not proofs, and it silently omits what it cannot verify. This invention makes verification a *type* that the whole platform must pass through, so a page cannot show a figure without also showing whether it was seen. The synergistic effect is that the client's screen becomes an honest map of what the firm knows and does not know, and the never-printed lists make the ethical rules testable by a machine. **Prior Art Scout:** provenance-preserving AI systems (US20230370274A1) and claim-to-evidence mappers exist; the per-carrier typed record with on-screen unverified rendering and code-level never-printed lists is the application-specific part to claim.

## PAT-017: The Witness Rule (Verbatim-Quote Guard for AI-Read Figures)

**The Simple Version:** When a friend tells you "the book says the answer is 42," you'd want them to show you the page and point at the sentence. This invention makes every AI do exactly that. When an AI reads a government forecast and reports a number, it has to hand back the exact sentence it found the number in. The computer then checks that the sentence really is on that page and that the number really is inside that sentence. If either check fails, the number goes in the trash before any human sees it.

**How It Works:** Every configured AI model reads the same fetched page. For each figure it returns a metric name, a year, a value, and the verbatim sentence. The server normalizes curly quotes and whitespace, then requires the sentence to appear literally in the page text and the number to appear inside that sentence in one of several rendered forms (with or without commas, with a percent sign, as a decimal). Figures that pass from several models for the same metric and year within one percent are folded into one row that remembers every model that agreed. The AI is never allowed to say what a figure *means*: a fixed, hand-written table maps each metric to its direction (up, flat, down) and, where allowed, a burden multiplier, and any metric not in the table is discarded. Finally, every surviving figure waits in a queue where the owner taps approve or reject; nothing enters the forecasting panel any other way.

**Working Components:** (1) The Multi-Model Reader that sends the same page to every configured AI, (2) the Quote Verifier that checks sentence containment and number-in-sentence, (3) the Agreement Merger that folds matching figures within one percent into one row with provenance, (4) the Direction Table that sets meaning by hand and discards unknown metrics, (5) the Owner Approval Queue as the only door into the panel, (6) the Harvest Log that records characters read, claims returned, claims verified and claims queued.

**Why It's Patentable:** Citation verification for language models exists as a research topic, but no financial forecasting pipeline requires sentence-level containment *and* number-in-sentence *and* multi-model agreement *and* human approval, with the model barred from assigning meaning. The emergent capability is an AI that cannot hallucinate a forecast into a family's plan: the four gates together make an invented figure structurally impossible rather than merely unlikely. **Prior Art Scout:** US20240296295A1 verifies that an LLM quotation appears in a source document; TROVE (arXiv 2503.15289) combines source-sentence matching with human review. The direction-separation table and the owner-only door are the parts those do not have.

## PAT-018: Automatic Forecaster Report Cards

**The Simple Version:** Imagine every weather forecaster in town got a report card every year, graded automatically by comparing what they predicted to what actually happened, and the forecasters with bad grades got listened to less. This invention does that for the government offices and think tanks that predict taxes, deficits and debt. Nobody types the grades. The computer looks up the real numbers when the year closes and does the math.

**How It Works:** Each forecast metric is mapped to the public data series that records its actual outcome (on FRED, fiscal-year basis, with a sign flip for deficits and a last-quarter rule for quarterly series). When a year closes, every old projection for that year is paired with the published number and the source's track record becomes one divided by one plus its average percentage miss. A second grade, consistency, measures how much a source wobbled when it re-published the same year's number; one divided by one plus four times the average spread. A source that never repeated a projection gets "no grade," never a fake average. The source's total weight is evidence × (½ + ½ track record) × (½ + ½ consistency), so a bad grade can halve a source but never erase it. When the panel is blended with the historical base rate, it moves the number only in proportion to how much of the panel's weight actually spoke to that horizon, and confidence is damped by how complete the panel was.

**Working Components:** (1) The Outcome Series Map from metric to FRED series, (2) the Closed-Year Matcher that pairs old claims to published actuals, (3) the Track Record Grader (1 ÷ (1 + MAPE)), (4) the Consistency Grader from repeated projections, (5) the Three-Factor Weight formula printed on the page, (6) the Coverage-Weighted Blender that shifts the base rate only by the share of the panel that published.

**Why It's Patentable:** Forecast-combination research uses error measures, but no planning platform grades named public forecasters automatically against the public record, penalizes self-contradiction, and limits how far a thin panel may move a historical base rate. The synergistic effect is a forecast that gets more honest by itself every January without anyone touching it. **Prior Art Scout:** meta-learning forecast combination (arXiv 2504.08940) evaluates forecasts with MAPE; the multiplicative weight, the consistency grade, and coverage-proportional blending are the specific combination to claim.

## PAT-019: Political Control-Conditioned Base Rates

**The Simple Version:** If you want to guess whether it will rain tomorrow, you should look at past days that looked like today, not every day in history. This invention does that for taxes. It stamps every year since 1945 with who held the White House, the Senate and the House, turns that into one number for how much of the levers one side held, and then asks "in the past windows that looked like the next twenty years politically, how often did taxes go up?" It also shows two answers side by side, one if the left holds the levers and one if the right does, and the gap between them.

**How It Works:** The president counts half, each chamber a quarter, giving a lever share between zero and one for every year. The expected share over a horizon is today's share blended toward the prediction-market share for the next term and the long-run average after that. Historical windows are bucketed as left-held, divided or right-held, and the probability that the top rate is higher after N years is computed from the matching bucket. If a bucket has fewer than fifteen windows, the system falls back to all of history and prints a flag saying so. Every horizon also reports the probability under each side and their difference, called the power swing. Average inflation under each configuration since 1947 is computed and displayed with a caveat, and deliberately not fed into the model.

**Working Components:** (1) The Control Table stamping each year with the three lever holders, verified against senate.gov, history.house.gov and whitehouse.gov, (2) the Lever Share (½, ¼, ¼), (3) the Expected Share blend from today's reading to market odds to the long-run mean, (4) the Conditional Window Statistics by bucket, (5) the Thin-Bucket Fallback with printed flag, (6) the Power Swing output and the display-only Inflation-by-Control table.

**Why It's Patentable:** Tax software treats politics as a headline, not an input. This invention uses political control to *select which history to learn from*, rather than to add a fudge factor, and it exposes its own sample-size weakness on the page. The emergent capability is a tax forecast that can say exactly how much of itself is politics. **Prior Art Scout:** conditional forecasting on party control exists in political science; no product or patent was found that uses a lever share to select historical windows inside a tax-probability model.

## PAT-020: The Keyless Political Pulse

**The Simple Version:** Every week, without asking anyone for a password, the system reads four public places to find out who is in charge right now: the list of everyone in Congress, the list of every federal judge and which president appointed them, the list of governors, and the betting markets on who wins next. It writes each reading down with the date, like a nurse taking a pulse.

**How It Works:** A weekly scheduled sweep reads the congress-legislators JSON for seat counts, the Federal Judicial Center's judges file (parsed with a hand-written CSV reader that walks each judge's sequence of appointments) for the share of sitting Article III judges by appointing party at each court level, Wikidata for governors, and Polymarket and Kalshi for the market-implied odds of each side controlling each lever, with Republican-framed questions flipped. Every reading is stored as a dated snapshot beside the market's own question text. Each feed fails alone: a feed that does not answer leaves its lever at the last stored reading rather than an imputed value. Thirty seconds after boot the sweep checks whether every lever already has a reading dated today and runs only if not, so a restart never hammers the sources.

**Working Components:** (1) The Congress Reader, (2) the Judiciary Reader with the appointment-sequence walker, (3) the Governors Reader, (4) the Prediction-Market Reader with slug search and question-framing flip, (5) the Dated Snapshot store, (6) the Freshness Short-Circuit and per-feed failure isolation.

**Why It's Patentable:** No planning platform maintains a machine-readable time series of who holds power, including the judiciary and market odds, and feeds it into client projections. The synergistic effect with PAT-019 is that the tax forecast updates itself as elections approach. **Prior Art Scout:** each source is public and prediction-market probabilities are used in policy forecasting; the specific weekly keyless pipeline into base-rate selection is the part to claim.

## PAT-021: Program Survival Odds (Hazard × Political Tilt × Persistence)

**The Simple Version:** Will the government program that forgives a doctor's student loans still exist in ten years? This invention answers with three numbers multiplied together: the chance the program survives each year (learned from how often such programs have been cut before), a nudge up or down depending on who is expected to hold power, and the chance the borrower keeps doing the paperwork. It even writes down the gloomier answer another AI gave and says why it was not used.

**How It Works:** Every expansion and contraction of every federal forgiveness program since 1987 is stamped with the politics of its year, so the political correlation is computed from the record, with court rulings separated out because no elected lever controls a judge, and the sample size printed. The yearly survival hazard is a Jeffreys estimate, one half divided by the years the program has existed plus one, doubled for programs that exist only by regulation. That hazard is tilted by 1.5 minus the expected lever share from PAT-019. Borrower execution persistence multiplies in per year. The result is the month forgiveness arrives, the amount, the tax on it, the odds and the confidence. The AI council's competing figure is recorded as the bear case with the reason it was not adopted.

**Working Components:** (1) The Dated Program Record with lever stamps, (2) the Political Correlation calculator with courts separated, (3) the Jeffreys Hazard, (4) the Political Tilt multiplier, (5) the Execution Persistence factor, (6) the Bear-Case Record.

**Why It's Patentable:** Existing loan tools assume the program exists. This invention prices the program's own survival from its history and the political weather, and it keeps the dissenting estimate on the record. **Prior Art Scout:** policy-cost and borrower-effect models exist (Penn Wharton, NBER w33462); the hazard-times-tilt-times-persistence decomposition with a court-separated record is specific.

## PAT-022: Zip Back-Cast with a Client-Chosen Window

**The Simple Version:** Home prices by zip code in dollars only go back to the year 2000, but a government index goes back much further. This invention glues them together so a family can see their own zip since the record began, and it labels exactly which years are glued. Then it hands the client a slider: pick the year the history starts, and every average and every forward projection is recomputed from the years you picked, with your choice printed next to the number.

**How It Works:** Zillow dollar levels are spliced to the FHFA index for years before 2000 using level(y) = level(2000) × HPI(y) ÷ HPI(2000), and the engine returns the year through which the back-cast reaches so the page can label derived years. Missing years stay blank and are skipped, never interpolated. The client's start year re-averages appreciation, rent growth and drawdown, and the forward projection runs at the rate of that window. "Zips like mine" is not a stored category; the cohort is computed at query time as the zips whose value at the start of the chosen window met a threshold, and every median reports how many zips sit behind it. The sourced appreciation rate is handed onward to the Ultra Calculator with the zip and window attached.

**Working Components:** (1) The Splice function with labelled back-cast, (2) the Start-Year Slider that re-averages every statistic, (3) the Window-Rate Projector, (4) the Query-Time Cohort with sample size, (5) the Blank-Not-Interpolated rule, (6) the Hand-Off to downstream calculators carrying the window.

**Why It's Patentable:** Housing tools show a fixed average. This invention lets the client choose the history and never hides that choice, and computes peer groups fresh with their sample size. The emergent capability is a projection the client can argue with, because the window is theirs. **Prior Art Scout:** series splicing and cohort analytics are familiar; the consistent use of one client-selected window for both re-averaging and projection, with labelled spliced years, is the specific claim.

## PAT-023: Purchasing Power with the Binding Rule Named, and Zip Scoring with Hazard Penalties

**The Simple Version:** How much house can a family really buy? Two things limit it: the cash they have and the income they earn. This invention solves both, picks the smaller, and tells you *which one* stopped you, in three plain sentences. Then it scores every zip code the family could buy in, and every point in the score comes with a sentence explaining it, including a penalty for flood, fire and storm risk from the government's own map.

**How It Works:** Purchasing power is solved twice by bisection: the price the cash carries (down payment plus closing costs plus N months of reserves) and the price the income carries under a lender's debt-to-income cap with a partial credit for expected rent. The smaller wins and the output names the binding rule with the arithmetic. Candidate zips are scored as gross rent yield plus appreciation over the chosen window, minus a penalty from FEMA's National Risk Index county rating, minus a penalty for any historical drawdown worse than twenty percent, with every term returned as a printable reason. Zips with no published rent record cannot be scored for income and are excluded unless the caller explicitly allows appreciation-only scoring. From one purchasing-power figure the engine builds two plans, one best zip near the budget and four zips near a quarter of it, and states the thesis that a smaller house sells into a wider pool of buyers.

**Working Components:** (1) The Cash-Bound Solver, (2) the Income-Bound Solver with rent credit, (3) the Binding-Rule Namer with three plain lines, (4) the FEMA Hazard Reader for county risk, (5) the Zip Scorer with every term as a sentence, (6) the One-or-Four Plan Builder with the resale-permanence note.

**Why It's Patentable:** Mortgage calculators give one number. This invention gives the reason, scores locations with public hazard data, and produces two structurally different plans from the same budget. **Prior Art Scout:** affordability calculators and hazard maps exist separately; the named binding constraint and sentence-per-term scoring with FEMA penalties is the combination to claim.

## PAT-024: The Trust Loop Run Twice

**The Simple Version:** The rental houses save tax every year. That saved tax buys a life insurance policy owned by a trust. The trustee borrows against the policy and pays down the houses' loans. Does the loop actually help? This invention runs the whole thirty years twice, once without the loop and once with it, and reports the difference as the loop's own contribution. No claims, just subtraction.

**How It Works:** Each year the enterprise's tax-free cash becomes premium into trust-owned policies; a new policy opens whenever the year's premium exceeds a threshold. The trustee borrows up to a cap of cash value on every eligible policy and the proceeds are split across properties in proportion to remaining loan balance. Crediting is the backtester's index history repeated after its last year, never a promised return. The carrier list is restricted to mutual companies (policyholder-owned), each fact wrapped in the Proof-Carrying Number System, and first-year loan permission is typed allowed, not allowed or unknown, where unknown means "read the policy form." An insured-versus-owner note lets an uninsurable client own the policy on a healthy spouse and keep every right.

**Working Components:** (1) The Premium Router from tax saved to policies, (2) the Policy Opener by threshold, (3) the Pro-Rata Loan Splitter by remaining balance, (4) the Double Run with contribution by subtraction, (5) the Mutual-Only Carrier Registry with typed loan permission, (6) the Insured-Owner Note.

**Why It's Patentable:** Premium financing and policy loans are known; no engine isolates the structure's benefit by counterfactual subtraction inside a multi-property plan, nor restricts carriers by ownership form with typed unknowns. **Prior Art Scout:** premium financing literature (NAEPC Journal issue 13) covers borrowing against cash value; the with-versus-without run and pro-rata principal routing are the novel workflow.

## PAT-025: The Career Ledger

**The Simple Version:** What did it really cost to become a surgeon? This invention adds up four things: the training bill with interest piling up while you were in school, the years of low pay compared with a different job, your true pay per hour once you count the commute and the travel days, and where your income sits against the government's own pay chart for your job. Every training length links to the accreditor's own document, so nothing is taken on faith.

**How It Works:** A registry of thirty-six training paths for doctors, dentists, veterinarians and lawyers carries each program length with its accreditor's URL, joined to statutory federal loan rates and origination fees by academic year. Training cost capitalizes in-school interest annually; opportunity cost compounds the forgone alternative salary plus loan accretion and reports years to recover at the attending premium; true hourly divides net pay by hours committed, counting commute and travel days at eight hours; percentile places the person against BLS's published 10/25/50/75/90 distribution with clamping at the ends. A peer comparison against other specialists' entered figures refuses to compute below five peers. The public landing page per specialty is also the form that collects those figures.

**Working Components:** (1) The Training Path Registry with accreditor URLs, (2) the Federal Loan Rate table by academic year, (3) the Four-Cost calculator, (4) the BLS Percentile placer, (5) the Peer Comparison with the five-peer refusal, (6) the Landing-Page-as-Form.

**Why It's Patentable:** Salary sites show medians. This invention computes the cost of *becoming*, ties every input to a public document, and refuses small-sample comparisons. **Prior Art Scout:** GPT-5.6 flagged overlap with SI-028's physician focus; the four-cost ledger with accreditor citations and the minimum-sample refusal are the delta.

## PAT-026: The Inheritance Arrival Tax Engine

**The Simple Version:** When you inherit something, the tax depends on what kind of thing it is: a Roth is tax-free, an IRA is taxed like a paycheck, a house gets a fresh start, an annuity is part gain. This invention types each expected inheritance by its kind, guesses how much bigger the tax will be in the year it arrives (using the tax forecast), shrinks the money to that year's dollars, and multiplies by how likely it is to arrive. If it does not know the gain share of an annuity, it refuses to guess and says so.

**How It Works:** Each item carries a taxability class with its Internal Revenue Code section and timing. Today's tax is scaled by the erosion trajectory's interpolated burden multiplier, capped so it can never exceed the taxable amount, deflated by the CPI ladder at the nearest horizon, then weighted by (likelihood − 1) ÷ 4. The benefactor's estate is checked against the indexed federal filing threshold and the page says plainly whether Form 706 is implicated. A gentle three-question follow-up about a parent's remarriage is offered once, split into reversible "test the waters" moves and irreversible "reclaim" moves, each with its statute, and never repeated unless the client raises it.

**Working Components:** (1) The Asset-Class Table with code sections, (2) the Burden Multiplier from PAT-018/019 capped at the amount, (3) the CPI Ladder deflator, (4) the Likelihood weight, (5) the Refusal-to-Size flag for missing gain share, (6) the Consent-Gated Follow-Up offered once.

**Why It's Patentable:** Estate tools compute today's tax. This invention computes the tax in the year of arrival under the forecast, refuses to invent missing inputs, and encodes the tone of a delicate conversation as data. **Prior Art Scout:** beneficiary and estate calculators exist (GPT-5.6 mapped this to SI-041's family); the forecast-scaled, capped, likelihood-weighted arrival tax with the refusal flag is the delta.

## PAT-027: The Income-for-Life Engine That Refuses

**The Simple Version:** Ask this engine to plan lifetime income on money that is still taxable and it says no, and tells you why: the money goes through the Roth conversion first. It will only print a payout that a person typed from a real carrier rate sheet with the link and the date. And it sizes the income to how long you and your spouse are likely to live, using the government's own life table, including the chance that at least one of you is still here at ninety-five.

**How It Works:** The plan function returns a refusal object with the reason when the account kind is taxable. Otherwise the pre-tax balance is converted at the typed conversion tax, the rate sheet's bonus and payout apply, and expected years come from the Social Security period life table: survival is the product of one-year survivals and a couple's "either alive" is one minus the product of their deaths. Expected lifetime payments are the annual amount times expected years with at least one alive. A "never printed" list in code forbids a payout not on a dated sheet, a bonus not on that sheet, the company name beside the exit provision, and any claim that income raises longevity. The flow-through structure, where income is paid into a trust-owned policy and returned within days, is held as four statutory questions (§72(e), §7702A, the trust's holding period, §676) until the carrier's illustration and the attorney's letter answer them; the page shows the questions, not a multiplier.

**Working Components:** (1) The Refusal Object for taxable money, (2) the Owner-Typed Rate Sheet registry with URL and date, (3) the SSA Life Table survival functions, (4) the Joint Either-Alive probability, (5) the Never-Printed list, (6) the Flow-Through Question Holder.

**Why It's Patentable:** Annuity calculators print a payout for any money. This invention refuses the wrong money, refuses unsourced rates, and holds an untested structure in a non-executable state on purpose. **Prior Art Scout:** joint-survivor math and rate sheets are standard; the enforced refusal, owner-typed authorization and code-level never-printed controls are the narrower software claim.

## PAT-028: The Tax Schedule Composition Loop

**The Simple Version:** Imagine packing a suitcase in a fixed order so everything fits: big things first, then medium, then the one thing that costs you money goes in last after everything else made room for it. This invention places twenty-nine tax strategies in a fixed order every year, sizes the deductions to the room left under your target bracket, caps them by the law's own limits and your appetite for risk, and puts the Roth conversion in last, filled exactly to the top of the bracket and counted as a cost, not a saving.

**How It Works:** Five stages run in order: baseline, structure-free reducers by certainty and cost, deduction engines sized to bracket headroom and capped by the excess-business-loss limit and a risk ceiling (0, 10 or 20 percent of income), charitable bunching every third year, then the Roth conversion last, then once-only structures in the year their prerequisites are met. Every parameter carries a source and a verified flag; unverified parameters are never used to size a step, and the confidence beside each step blends the family's authority with the share of its parameters that are verified. Each tax year is one named rule set with its revenue procedure; a plan can be re-run under a different year's law and the difference is sealed to the ledger as a "rules" event.

**Working Components:** (1) The Five-Stage Order, (2) the Headroom Sizer with the §461(l) cap and risk ceiling, (3) the Roth-Last-as-Cost rule, (4) the Per-Parameter Verified flags that gate sizing, (5) the Versioned Rule Sets, (6) the Recompute Delta sealed as a ledger event.

**Why It's Patentable:** Tax tools optimize each strategy alone. The fixed composition order with Roth last and counted as a cost, plus verified-flag gating and versioned recomputation, is a different objective function. **Prior Art Scout:** RetireSmartIRA models Roth conversions and bracket position interactively; the ordering rule, the verified gates and the sealed delta are the delta.

## PAT-029: The Guardian Ledger

**The Simple Version:** Every fact, decision, permission and dollar movement in a client's plan is a link in a chain, and each link's fingerprint includes the link before it, so nobody can change the past without breaking the chain. A slider replays the plan as it stood on any day. Every AI agent has a written allowance; every money movement passes a bouncer that says allow, hold or block with reasons; and automations can never set themselves off.

**How It Works:** Each event's hash is SHA-256 over the previous hash plus the canonical event. Saves write one event per changed field and nothing when nothing changed. Replay reconstructs the assessment at any moment. Advice records carry the facts consulted as key-plus-hash only and are HMAC-signed. Consent is twelve named scopes across four grantee types, time-boxed, revocable, with wildcards. Agent mandates bound named actions, accounts, per-action and rolling ceilings and a human-approval line. The transaction firewall judges every proposed movement against the client's policy, the proposer's mandate, known payees, a new-payee cooling-off period, a conflict-of-interest list that always includes the advisor, and a reserve floor. Automations run once per event fingerprint, route money through the firewall under their own mandate, and never fire on events they wrote. Outside systems hear "the plan changed" with a signature but not the figures unless a switch is set.

**Working Components:** (1) The Hash-Chained Diff Ledger with replay, (2) the Signed Advice Record with fact fingerprints, (3) the Consent Ledger with wildcard scopes, (4) the Agent Mandate evaluator, (5) the Fiduciary Transaction Firewall, (6) the Loop-Proof Automation runtime and fact-withholding Event Bus.

**Why It's Patentable:** Blockchain audit trails (SI-022) record what happened. This invention governs what *may* happen: consent, mandates and the firewall sit in front of every action, and the chain proves it afterward without exposing the figures. **Prior Art Scout:** agent-governance ledgers and US20230075411A1 are close on audit; the financial firewall with cooling-off, self-conflict inclusion, reserve floor and the never-self-trigger rule is the combination to claim.

## PAT-030: The Provenance Vault with Estate Consistency Check

**The Simple Version:** When you upload your will, the system does not just file it. It fingerprints it, links it to the version before, signs it, and then reads it against your own plan: is your spouse missing from the will? Do the kids have a named guardian? Is the date ten years old? It flags, and never fixes anything by itself.

**How It Works:** Every file gets a content SHA-256, a version lineage via the document it supersedes, and an HMAC provenance signature over id, hash, time and uploader. For estate documents, declared parties, beneficiaries, trustees, executor and guardian are compared against the plan's own facts with a first-name-tolerant matcher, raising typed issues (conflict, warning, info) at upload time rather than at probate.

**Working Components:** (1) The Content Fingerprint, (2) the Version Lineage, (3) the Provenance Signature, (4) the Estate Party Extractor, (5) the Plan Consistency Matcher, (6) the Flag-Never-Correct rule.

**Why It's Patentable:** Document vaults store; this one reads estate papers against the living plan and surfaces conflicts while they can still be fixed. **Prior Art Scout:** GPT-5.6 mapped this near SI-041 beneficiary optimization; the upload-time consistency check with signed lineage is the delta.

## PAT-031: The Sphere

**The Simple Version:** Most websites are a list of menus. This one is a globe. Every page is a dot with two coordinates: which of twelve parts of your money life it belongs to (around the equator) and how deep it goes (facts on the outside, then what is eroding them, then what to do, then proof at the centre). If a spot on the globe is empty, the map says "this is where the next page belongs."

**How It Works:** Every page is registered as a point with a meridian and a latitude. A projection maps each point to unit-circle coordinates with facts at the rim and proof near the centre where the Plan Ledger sits. A twelve-by-four matrix under the globe shows how many pages occupy each cell and labels empty cells as gaps. A test asserts every placed point is a real route, and the site-health audit cross-references every point against the built route list. Adding a page means placing a point, never adding a menu.

**Working Components:** (1) The Point Registry, (2) the Polar Projection, (3) the Gap Matrix, (4) the Route Assertion test, (5) the Site-Health cross-reference, (6) the Ledger-at-Centre rule.

**Why It's Patentable:** Faceted navigation exists; a two-coordinate map of a financial life whose empty cells are rendered as product gaps, verified against the route table, is a different way to organize a planning product. **Prior Art Scout:** coordinate navigation and gap visualization are individually common; novelty rests on the claimed interaction and the twelve-by-four semantic space.

## PAT-032: The Every-Page Advisor with Six Shapes and a Horizon Mode

**The Simple Version:** A microphone follows you onto every page. You talk; your words are turned into text inside your own browser so your voice never leaves your computer. Then you pick the *shape* of the answer: short, deeper, how it fits your whole plan, what's in it for you told like a football team, the law with citations, or all of them. There is a seventh choice that asks permission, learns five more facts, and instead of answering today's question tells you the questions you should be asking twenty years from now, and answers them.

**How It Works:** Speech is transcribed locally; only the question text, the saved profile summary and the current route leave the browser. A council of every AI with a key answers; failures are reported as failures, skipped models are named, and a lead model synthesizes only when more than one answered, so the page can say truthfully how many advisors contributed. Six mode definitions carry their own instruction and word budget; the horizon mode refuses to re-answer the original question. The same council answers public visitors under a prompt that forbids dollar figures, percentages and formulas, with figures routed only to the owner's inbox. The whole answering process can be emailed as a PDF only after the address is typed twice and consent is given.

**Working Components:** (1) The Browser-Local Transcriber, (2) the Six Answer Shapes, (3) the Permissioned Horizon Mode, (4) the Honest Council Synthesis, (5) the Two-Audience Prompt with owner-only figures, (6) the Double-Typed-Address PDF gate.

**Why It's Patentable:** Digital advisors answer; this one lets the client choose the shape, refuses to speak numbers to strangers, discloses which models actually spoke, and keeps audio on the client's machine. **Prior Art Scout:** US20250225587A1 and US20230074406A1 describe multi-model digital advisors; the fixed shapes, permissioned horizon mode, honest model disclosure and audience split are the integrated workflow to claim.

## PAT-033: The Read-and-Store-Nothing Source Registry

**The Simple Version:** Ten companies publish rental market numbers, but each lets you in a different way: some sell a key, some require a contract, some only show your own listings, some let you download a file, some do not let anyone in. This invention keeps that list, tells the AI on every question which doors this server actually has keys for, and forbids the AI from quoting a nightly rate or occupancy it did not read from one of them on a stated date. When the server does read a page, it reports only the figures whose sentences are on that page and keeps none of it.

**How It Works:** Each source is typed by access shape with its environment key and a verified date and URL. The advisor's instructions are rebuilt per question from which keys the host holds. A read-page procedure fetches the site, returns only figures whose sentence is on the page, labels them "read on date from url," and stores nothing. A key probe tests every secret with one read-only call and returns a status word and the provider's reason with anything key-shaped blacked out, cached ten minutes.

**Working Components:** (1) The Access-Shape Registry, (2) the Per-Question Prompt Rebuilder, (3) the Read-Page procedure that stores nothing, (4) the Sentence-on-Page filter, (5) the Key Probe with reason redaction, (6) the Verified-Date on every source.

**Why It's Patentable:** Data integrations cache; this one refuses to remember, tells the AI its own permissions question by question, and proves keys work without revealing them. **Prior Art Scout:** GPT-5.6 rated A9, A10 and A12 as new; no close product was found.

## PAT-034: The Questions You Haven't Asked, the Journey, and the Librarian's Gate

**The Simple Version:** The system reads your own answers and finds the questions you never thought to ask, each with a dollar size and how it got that size. It shows nothing until you say yes at every step. It boils everything you ever asked into three to five big questions, plus one you missed, and lays out a ten-to-fifteen-page path through the site. And it will not give planning advice, not even a little, until your whole assessment is done.

**How It Works:** Twelve deterministic rules over the assessment produce candidate questions in the client's words with a stated dollar scale or a stated zero when a figure is missing, ranked by scale then urgency; offers recur only after thirty days, or sooner when the profile hash changes or a stronger question enters the top three; every propose, reveal and answer is a consent event on the ledger. The journey engine tags every question the client asked, groups them into templates, and finds the strongest assessment signal whose tag is not covered by anything asked. The AI may polish wording only; the result is discarded if it changes a page, an order or a size. The librarian refuses any planning answer before the fifteen-section assessment is complete and hands over the assessment instead.

**Working Components:** (1) The Twelve Rules with dollar-scale derivation, (2) the Consent Cadence by profile hash, (3) the Journey Distiller, (4) the Emergent Question finder, (5) the Polish-Only AI validator, (6) the Hard Gate.

**Why It's Patentable:** Advice engines answer what was asked. This one names what was not asked, sizes it, asks permission at every step, and refuses to advise before it knows enough. **Prior Art Scout:** life-event detection (SI-013) is the nearest sibling per GPT-5.6; the consent cadence, emergent question and hard gate are the delta.

## PAT-035: Before-and-After Goal Confidence

**The Simple Version:** When you arrive, the site asks how likely you are to reach your goals, one to ten. When your mouse heads for the close button, it asks once more, at most once per visit and only after ninety seconds. The difference is the site's own honest score of whether it helped you today.

**How It Works:** The vision instrument on specialty pages records likelihood-now; the exit component fires on cursor leaving the top of the viewport after ninety seconds, once per session, and records likelihood-after with the exact page it was given on. The delta is stored as the platform's satisfaction metric.

**Working Components:** (1) The Vision Instrument, (2) the Exit-Intent Trigger with dwell and once-per-session rules, (3) the Page Attribution, (4) the Delta store, (5) the Peer aggregation by specialty, (6) the Refusal below five peers.

**Why It's Patentable:** Exit surveys ask satisfaction; this measures a change in the client's own belief about their future, page-attributed. **Prior Art Scout:** mapped near churn prediction (SI-012); the before/after belief delta is the specific claim.

## PAT-036: Political Drift Repricing (proposed by GPT-5.6 Terra)

**The Simple Version:** Some numbers in a plan depend on politics: future tax rates, whether a forgiveness program survives, which year's tax rules apply. This invention watches the weekly political pulse and, when the levers shift, re-prices every one of those numbers, seals the change to the ledger with the reason, and shows the client what moved and why.

**How It Works:** Built from PAT-019, PAT-020, PAT-021 and the versioned rule sets of PAT-028: each politically sensitive assumption is tagged; when a new pulse snapshot changes the expected lever share beyond a threshold, the affected engines recompute and the delta is sealed as a "rules" or "scenario" event.

**Working Components:** (1) The Sensitivity Tags, (2) the Pulse Change detector, (3) the Recompute Fan-Out, (4) the Sealed Delta, (5) the Client-Facing "what moved" panel, (6) the Threshold governor.

**Why It's Patentable:** Plans are static between meetings; this one moves with the political weather and proves each move.

## PAT-037: Inheritance Timing Confidence Meter (proposed by GPT-5.6 Terra)

**The Simple Version:** An inheritance is uncertain in three ways: when, how much after tax, and whether at all. This invention turns those into one dated confidence range by combining the life table, the tax class, the forecast and the forecasters' own report cards.

**How It Works:** Built from PAT-026, PAT-027's survival functions and PAT-018's graded panel: the benefactor's survival curve sets the timing distribution, the arrival tax engine sets the after-tax amount at each year, and the panel's confidence sets the width of the band.

**Working Components:** (1) The Survival-Based Timing distribution, (2) the Arrival-Tax-by-Year series, (3) the Panel Confidence band, (4) the Likelihood weight, (5) the Dated Range output, (6) the Refusal when gain share is missing.

**Why It's Patentable:** Estate software gives a point estimate; this gives a range with a stated reason for its width.

---

# Part IV: The New Sister Patents (SI-043 to SI-060)

Each one extends the core patents into a specialized area. The parent line names the parts.

## SI-043: The Truth Stack
**Parent:** PAT-016 + PAT-017 + PAT-018
**The Simple Version:** Put the sticky notes, the witness rule and the report cards together and you get an AI forecasting system that cannot make things up: every number carries proof, every AI-read figure points at its sentence, the AI never decides what a number means, forecasters are graded automatically, and a human taps approve before anything enters.
**How It Works:** Numbers flow from public pages through the quote guard into the approval queue, into the weighted panel, into the proof-carrying boxes on every page.
**Working Components:** (1) Proof-Carrying Boxes, (2) Quote Guard, (3) Direction Table, (4) Report Cards, (5) Owner Queue, (6) Never-Printed lists.
**Why It's Patentable:** The emergent capability is structural honesty: hallucination is not reduced, it is made impossible by construction.

## SI-044: The Political Weather Machine
**Parent:** PAT-019 + PAT-020 + PAT-021 + PAT-036
**The Simple Version:** A weekly reading of who holds power, turned into which history to learn from, printed as the swing between left-held and right-held futures, reused to price program survival, and re-pricing the plan when the levers move.
**How It Works:** Pulse snapshots feed the expected lever share, which selects windows, tilts hazards and triggers repricing.
**Working Components:** (1) Pulse, (2) Lever Share, (3) Conditional Windows, (4) Power Swing, (5) Survival Tilt, (6) Repricing seal.
**Why It's Patentable:** Politics becomes a measured, dated input with its own sample-size honesty.

## SI-045: The Property Machine
**Parent:** PAT-022 + PAT-023 + PAT-024 + PAT-033 + PAT-009 + PAT-002
**The Simple Version:** From a zip code's glued-together history and the client's chosen window, through how much house they can buy and why, hazard-penalized zip scores, one house versus four, into a trust-owned policy loop whose benefit is proven by subtraction, backed by mutual-only carriers and a rental-data protocol that refuses unread numbers.
**How It Works:** Each stage hands its sourced figure to the next with the window and date attached.
**Working Components:** (1) Zip Back-Cast, (2) Purchasing Power, (3) Zip Scorer, (4) Plan Builder, (5) Trust Loop, (6) Source Registry.
**Why It's Patentable:** Extends PAT-009's recycling thesis with public-data sourcing and counterfactual proof at every step.

## SI-046: The Lifetime Income Chain
**Parent:** PAT-027 + PAT-026 + PAT-028 + PAT-005
**The Simple Version:** Pre-tax money goes through the conversion pass first, income is sized to joint survival, the flow-through is held as questions, what the children inherit is taxed by class in that year's dollars, and every tax step sits in a fixed order with Roth last.
**How It Works:** One chain from the first conversion to the last inheritance, each link refusing what it cannot source.
**Working Components:** (1) Conversion Pass, (2) Refusal Engine, (3) Joint Survival, (4) Flow-Through Questions, (5) Arrival Tax, (6) Composition Order.
**Why It's Patentable:** Extends PAT-005's waterfall across a whole life and into the next generation.

## SI-047: The Listening Site
**Parent:** PAT-032 + PAT-034 + PAT-035
**The Simple Version:** A microphone on every page, questions you never asked offered only with consent, a journey with the one question you missed, a librarian that refuses to advise before it knows enough, and a before-and-after score at the door.
**How It Works:** Consent events, journey steps and confidence deltas all land on the ledger.
**Working Components:** (1) Every-Page Mic, (2) Honest Council, (3) Unasked Questions, (4) Journey, (5) Hard Gate, (6) Exit Delta.
**Why It's Patentable:** The site asks permission before it teaches and measures whether it did.

## SI-048: Career-to-Home
**Parent:** PAT-025 + PAT-022 + PAT-023 + PAT-001
**The Simple Version:** What becoming a doctor cost, compared with peers only above a minimum sample, handed to what that doctor can afford in their zip, handed to the chained calculator.
**Working Components:** (1) Career Ledger, (2) Peer Refusal, (3) Zip Window, (4) Purchasing Power, (5) Chained Windows, (6) Exit Delta.
**Why It's Patentable:** One sourced path from training cost to home purchase inside the cascading engine.

## SI-049: The Two-Audience Brain
**Parent:** PAT-032 + PAT-033 + PAT-029
**The Simple Version:** The same council answers strangers without numbers and clients with the full picture, proves its keys work without showing them, and tells outside systems the plan changed without the figures.
**Working Components:** (1) Public Prompt, (2) Client Prompt, (3) Honest Disclosure, (4) Key Probe, (5) Fact-Withholding Bus, (6) Owner Inbox.
**Why It's Patentable:** Confidentiality enforced in the prompt, the data path and the event bus at once.

## SI-050: Sphere plus Ledger
**Parent:** PAT-031 + PAT-029 + site health
**The Simple Version:** Every page is a coordinate on one globe with the ledger at its centre; the site audits its own links against that globe; the sitemap is generated from the same registry.
**Working Components:** (1) Point Registry, (2) Ledger Centre, (3) Self-Audit, (4) Single SEO Catalogue, (5) Route Assertion, (6) Gap Matrix.
**Why It's Patentable:** Navigation, proof and search are one structure that checks itself.

## SI-051: Assumption Half-Life Engine (GPT-5.6 Terra)
**Parent:** PAT-018 + PAT-020 + PAT-021 + PAT-028
**The Simple Version:** Every politically sensitive assumption in a plan gets its own "half-life," a constantly updated guess of how long it stays true, from the forecasters' report cards, the political pulse and the program-survival hazard, with each change sealed and explained.
**Working Components:** (1) Assumption Registry, (2) Report Cards, (3) Pulse, (4) Hazard, (5) Half-Life calculator, (6) Sealed Delta.
**Why It's Patentable:** Reliability-and-survival life per assumption is a new object in planning software.

## SI-052: Verified Economic Regime Split (GPT-5.6 Terra)
**Parent:** PAT-017 + PAT-019 + PAT-028 + the IUL links engine
**The Simple Version:** The policy's credited rate laid beside inflation and the money supply, split into high and low years, but only changing when a verified figure or a versioned rule changes, with the caveat printed above every table and the correlation refusing below eight years.
**Working Components:** (1) Credited History, (2) CPI/M2 Median Split, (3) Quote Guard, (4) Rule Versions, (5) Caveat, (6) Correlation Refusal.
**Why It's Patentable:** Audit-ready regime analysis that cannot drift.

## SI-053: Consent-Bounded Plan Autopilot (GPT-5.6 Terra)
**Parent:** PAT-029 + PAT-028
**The Simple Version:** The plan can maintain itself within narrow, written permission, and self-triggered, conflicted or out-of-scope automation is structurally impossible.
**Working Components:** (1) Consent Scopes, (2) Mandates, (3) Firewall, (4) Loop-Proof Automations, (5) Rule Versions, (6) Reversal Window.
**Why It's Patentable:** Autonomy with a fence built from the ledger itself.

## SI-054: Estate Fragility Replay (GPT-5.6 Terra)
**Parent:** PAT-029 + PAT-030 + PAT-026 + PAT-027
**The Simple Version:** Scrub an estate plan back in time and see exactly when a survival change, an inheritance change, a trust question or a document conflict created a risk for a beneficiary.
**Working Components:** (1) Time-Scrub, (2) Provenance Vault, (3) Arrival Tax, (4) Joint Survival, (5) Flow-Through Questions, (6) Fragility timeline.
**Why It's Patentable:** Turns the ledger into a forensic tool for estates.

## SI-055: Household Resilience Zip Lens (GPT-5.6 Terra)
**Parent:** PAT-022 + PAT-023 + PAT-027 + PAT-035
**The Simple Version:** Does a home decision stay affordable through purchasing-power erosion, local catastrophe and drawdown risk, joint longevity, and a possible career exit?
**Working Components:** (1) Zip Window, (2) Purchasing Power, (3) Hazard Penalties, (4) Joint Survival, (5) Exit Delta, (6) Erosion ladder.
**Why It's Patentable:** Five risks on one decision, each sourced.

## SI-056: Forecast Accountability Router (GPT-5.6 Terra)
**Parent:** PAT-017 + PAT-018 + PAT-032
**The Simple Version:** A disputed forecast is routed through verified inputs, graded forecasters, show-the-math, and a council synthesis instead of one opaque prediction.
**Working Components:** (1) Quote Guard, (2) Report Cards, (3) Credibility Overlay, (4) Honest Council, (5) Coverage Blend, (6) Dispute record.
**Why It's Patentable:** Disagreement becomes a documented path, not a hidden average.

## SI-057: Tax-Law Shock Containment Map (GPT-5.6 Terra)
**Parent:** PAT-021 + PAT-028 + PAT-029 + PAT-031
**The Simple Version:** When a program or tax law is threatened, the globe lights up exactly the pages affected, and the ordered tax consequences replay across rule versions.
**Working Components:** (1) Survival Hazard, (2) Composition Order, (3) Rule Versions, (4) Sphere cells, (5) Ledger replay, (6) Affected-page list.
**Why It's Patentable:** Extends SI-006's simulator with location and replay.

## SI-058: Mutual Carrier Real-Return Sentinel (GPT-5.6 Terra)
**Parent:** PAT-024 + PAT-017 + PAT-018 + the IUL links engine
**The Simple Version:** Continuously separates verified mutual-carrier crediting from marketing rates, and weights projections by the forecasters' accountability.
**Working Components:** (1) Mutual Registry, (2) Proof Boxes, (3) Quote Guard, (4) Regime Split, (5) Report Cards, (6) Sentinel alerts.
**Why It's Patentable:** Carrier claims graded like forecasters.

## SI-059: Dated Advice Challenge Packet (GPT-5.6 Terra)
**Parent:** PAT-029 + PAT-016 + PAT-017 + credibility overlay
**The Simple Version:** One replayable packet showing the exact facts, source quotations, calculations, signer and later changes behind any recommendation, ready for a regulator or a client's lawyer.
**Working Components:** (1) Signed Advice, (2) Fact Hashes, (3) Proof Boxes, (4) Quotations, (5) Show-the-Math, (6) Replay.
**Why It's Patentable:** Extends SI-022's audit trail with challengeable substance, not just timestamps.

## SI-060: Permissioned Future-Self Negotiator (GPT-5.6 Terra)
**Parent:** PAT-032 + PAT-034 + PAT-035 + PAT-029
**The Simple Version:** The client authorizes a bounded long-horizon conversation that surfaces deferred questions and tests whether their stated exit intentions still hold, without overreaching consent.
**Working Components:** (1) Horizon Mode, (2) Consent Scopes, (3) Unasked Questions, (4) Journey, (5) Exit Delta, (6) Sealed transcript.
**Why It's Patentable:** A twenty-year conversation with a fence around it.

---

## Portfolio Summary

| Category | Count | Key Innovation |
|---|---|---|
| Original Core (PAT-001 to PAT-015) | 15 | Foundational engines |
| Original Sisters (SI-001 to SI-042) | 42 | Specialized extensions |
| New Core (PAT-016 to PAT-037) | 22 | Truth machinery, political weather, sourced property and income engines, the guardian ledger, the listening interface |
| New Sisters (SI-043 to SI-060) | 18 | Combinations whose parts only make sense together |
| **Total Portfolio** | **97** | |

Every new item uses the same KSR v. Teleflex framing as the first 57: the combination produces an emergent capability a person of ordinary skill would not predict. Where Perplexity found close art, it is named so counsel can draw the claim around it. GPT-5.6 Terra's classification of the sixty underlying mechanisms (which overlap the 57, which extend one, which are new) is preserved in the repository beside this document.

**Status:** Draft. Not filed. Not pending. Not granted. Inventor: Samuel A. Russell V.
