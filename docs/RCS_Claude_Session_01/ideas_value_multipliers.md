# Twenty-Five Value Multipliers
## Changes that raise what the platform is worth — with the reasoning for each

The previous document covered *utility*: making what exists trustworthy. This one covers *value*: what makes the platform worth more to the households who use it, the advisors who sell with it, and whoever eventually values the business.

Each entry states what it is, **why it multiplies value** — the reasoning, not just the claim — what it costs to build, and what makes it complete. Ordered by return on effort within each tier.

---

# TIER ONE — The highest return available
*Four changes that each compound across everything else.*

## 1. Account aggregation

**What.** Connect real bank, brokerage, retirement and mortgage accounts through Plaid, MX or Yodlee, with explicit per-account consent.

**Why it multiplies.** Every projection on the platform currently starts from typed inputs. That has three consequences that compound: a household types its balances once and never updates them, so the plan is stale within a quarter; the advisor cannot see what actually happened between meetings, so every review restarts from memory; and the platform has no reason to be opened again after the first session.

Connected accounts invert all three. The plan updates itself. The advisor opens a review already knowing the client took a 401(k) loan in August. And the platform becomes a place the household returns to, which is the difference between a tool and a relationship.

This is also the largest single functional gap against JP Morgan and Edward Jones. A prospect comparing this platform to an incumbent will notice it in the first five minutes.

**Cost.** Vendor selection, consent and custody design, then a few weeks of integration. It is a product and compliance decision before it is an engineering one — which is why it has not happened, and why deciding it is the owner's job, not a builder's.

**Complete when.** A household connects an account and a projection updates without anyone typing a number.

---

## 2. The single-entry walk

**What.** A household is entered once. Every calculator in the catalogue inherits it. Each result publishes to the next page, which names where its inputs came from.

**Why it multiplies.** This is the difference between 115 calculators and one system. Right now a user who wants to examine three strategies enters their situation three times — and if they enter it slightly differently, the three answers are not comparable, which quietly destroys the whole point of having three strategies.

The compounding effect is that every additional calculator *increases* the platform's value rather than adding to the user's burden. Today, page 116 is one more form to fill. After this change, page 116 is one more answer the household gets for free. That flips the economics of the entire catalogue — the 688-page problem stops being a liability and becomes an asset.

**Cost.** Two to three weeks. The context provider exists; the work is threading it and adding ZIP, county, state and the property list to the fact finder.

**Complete when.** A household entered once can be walked through the full genome route with no value typed twice.

---

## 3. Provenance on every figure

**What.** Any number, one click, reaches its engine, its inputs, the ledger row behind each sourced value, and the rule row behind each statutory one.

**Why it multiplies.** Three distinct returns from one feature.

*For the advisor:* the question "where does that come from?" is the moment a sale is won or lost. An advisor who can answer it instantly, from the screen, in front of the client, is operating at a level most competitors cannot match — because most competitors' numbers come from a spreadsheet whose author left.

*For compliance:* a platform where every figure traces to a dated source is a platform that can survive a file review. One where figures cannot be traced is a liability that grows with every illustration delivered.

*For the product:* it is the most credible differentiator available, and it cannot be copied quickly. A competitor can copy a calculator in a week; the evidence layer underneath took this session alone to build for one page, and doing it across a catalogue is a year of discipline.

**Cost.** The `FigureTrace` structure and the provenance page already exist; 112 of 115 pages need their traces written. Mechanical, parallelisable.

**Complete when.** Every headline figure on every featured page resolves to its trace.

---

## 4. Fix the four flagship defects

**What.** Add cost of insurance. Deduct the loan drag. Reconcile the crediting rate to the product's actual AG 49-A cap. Repoint the index table at price return.

**Why it multiplies.** This is value *protection*, and it belongs in tier one because it gates everything else. Every improvement above amplifies whatever the engine produces — so amplifying a flagship that models an insurance policy charging nothing for insurance makes the problem larger, not smaller. A sophisticated prospect who checks the math and finds no COI term will not raise it; they will simply stop returning calls, and you will never learn why.

The asymmetry is the argument: fixing them costs days. Being caught by one costs the relationship, and potentially more.

**Cost.** Days, once the carrier illustration is in hand.

**Complete when.** The flagship matches the carrier's own illustration within 2% at years 10, 20 and 30.

---

# TIER TWO — Deepen what already exists

## 5. Wire the regime engine into every simulator

**What.** Replace unconditioned block bootstrapping with `regimeConditionedPaths` wherever a projection runs five years or more.

**Why it multiplies.** An unconditioned bootstrap treats 1979 and 2013 as equally likely neighbours for next year. They are not, and the error is not symmetric: it understates the *runs* of bad years, which are exactly what ruins a plan. A household does not fail because of one bad year; it fails because three bad years arrived consecutively while they were drawing income.

The second return is narrative. `regimeTrace` lets a chart say *which history this path walked* — "this 10th-percentile path spent years 4 through 9 in a stagflation regime resembling 1977 to 1982." That is a sentence a client remembers, and it converts a statistical artifact into something they can reason about.

**Cost.** The engine is written and tested. Wiring is a per-simulator change of a few lines.

**Complete when.** Every simulator reports which regimes its percentile paths traversed.

---

## 6. Extend the shock library back to 1973

**What.** Session A's `historicalShocks.ts` declares the 1973–74 oil shock and Black Monday 1987 unavailable, because its index series begins in 1994. My regime engine runs on CPI from 1947 and home prices from 1975 and can classify both.

**Why it multiplies.** "Unavailable" on the two shocks older clients actually lived through is the worst possible answer — it is precisely the audience with the most assets and the longest memory. Replacing it with *"1973–74: stagflation — inflation at 11.0% with real asset growth of −4.2%. We hold no index series for these years, so no credited rate is shown"* converts a gap into a demonstration of rigour.

**Cost.** One function call and a rendering branch.

**Complete when.** No shock window renders as a bare "unavailable".

---

## 7. Adverse-scenario replay with the full path set

**What.** Replay a shock not just through equity drawdown but through rent, vacancy, cap rate and refinance availability — the variables that actually decide whether a leveraged property survives.

**Why it multiplies.** A real-estate household's 2008 was not primarily an equity event; it was a refinancing event. Lines were frozen, appraisals collapsed, and coverage tests failed. Modelling only the equity drawdown understates the correlation that does the damage — everything went wrong at once, which is the whole point of a shock.

This is Session A's question Q13, and it is the difference between a stress test a sophisticated investor respects and one they dismiss.

**Cost.** Research (the historical paths) plus a planner change.

**Complete when.** A replay shows the refinance window closing, not just the value falling.

---

## 8. "What would have to be true" inversion

**What.** Every calculator can be run backwards: name the outcome, get the required input.

**Why it multiplies.** Households do not think in inputs; they think in outcomes. "What return do I need to retire at 62?" is the actual question, and answering it directly is worth more than making them guess at rates until the output looks acceptable.

It also produces the platform's most persuasive moment — when the required assumption is *implausible*. "To reach this goal with your current savings rate, you would need 11.2% annually for 24 years. The best 24-year run in the record is 9.8%." That sentence changes behaviour in a way no projection does, and it is honest.

**Cost.** A generic bisection solver over any engine's single input. The IRR solver in `realEstateCapitalStackEngine` is the pattern.

**Complete when.** Every calculator with a single dominant input can be solved backwards.

---

## 9. Monte Carlo that ends in a decision

**What.** After the fan, a stated recommendation: what to change, by how much, and what it moves.

**Why it multiplies.** A percentile fan is an answer to a question most users did not ask. They asked "am I going to be okay?" and received a distribution. The gap between the two is where the platform currently loses people — the output is technically excellent and practically unusable.

Closing it — *"at a 15% allocation, 22% of paths fall short. At 19%, 9% do. The additional cost is $340 a month"* — turns the simulation into the thing it was always for.

**Cost.** A recommendation layer over existing output; a few days.

**Complete when.** Every simulation ends in a sentence naming an action.

---

## 10. Household-level rollup

**What.** One dashboard: every strategy the household has run, every result, what each depends on, and where they conflict.

**Why it multiplies.** A household running six strategies currently holds six separate results with no view of the whole — and crucially, no detection of conflict. Two strategies may both assume the same equity is available. Nothing currently notices. That is the single most dangerous failure mode in a multi-strategy plan, and it is invisible today.

**Cost.** The strategy context already collects results; this is a view plus a conflict detector.

**Complete when.** Two strategies claiming the same collateral raise a warning.

---

# TIER THREE — Reach and distribution

## 11. Every call-to-action lands on a pre-filled calculator

**What.** Marketing pages send visitors into a working calculator with plausible defaults for their segment, not to a lead form.

**Why it multiplies.** A lead form asks for something before giving anything, and converts accordingly. A pre-filled calculator gives the visitor a number about their own situation in ten seconds — and *then* asks for an email to save it. The platform's actual advantage is the engines; hiding them behind a form wastes the only differentiator that matters.

**Cost.** Routing and segment defaults. Days.

**Complete when.** No CTA on the site lands on a bare form.

---

## 12. Saved scenarios with a shareable link

**What.** A household saves a scenario and gets a link that renders it read-only, with the assumption snapshot attached.

**Why it multiplies.** Financial decisions are made by more than one person. Today the second decision-maker — the spouse, the adult child, the accountant — has no way to see what was modelled except a screenshot. A link that renders the real thing, with its sources, puts the platform in front of people it would otherwise never reach, at the exact moment they are deciding.

That is distribution the platform is not currently getting, and it costs one route.

**Complete when.** A saved scenario renders for someone who has never logged in, at the version it was saved.

---

## 13. Compliance-grade PDF as the standard export

**What.** The export carries the full evidence ledger, the assumption snapshot, the guaranteed column beside the illustrated one, the as-of date, the expiry and the result ID.

**Why it multiplies.** This document is what survives the meeting. It gets forwarded to the accountant, filed by the client, and read again in three years. A PDF that answers its own questions — where each number came from, what was assumed, what is guaranteed versus illustrated — does the advisor's follow-up work unattended.

It is also the artifact a compliance reviewer will ask for, which makes it the difference between a platform an agency can approve and one it cannot.

**Cost.** The PDF export exists; this is content, not plumbing.

**Complete when.** The export answers every question an advisor currently answers by email.

---

## 14. The scorecard as a public trust signal

**What.** Publish the integration scorecard — how many figures are sourced, how many pages carry provenance, what share of runs fall back.

**Why it multiplies.** Every financial platform claims rigour. Almost none publishes a measurement of its own that it could fail. Doing so is a costly signal in the economic sense: it is credible precisely because a weaker competitor cannot imitate it without first doing the work.

It also creates internal pressure in the right direction — a public number gets fixed.

**Cost.** A public route over existing data.

**Complete when.** The number is public and updates itself.

---

## 15. Partner API as a product

**What.** The read-only REST surface that already exists, documented, keyed and sold.

**Why it multiplies.** The engines are the asset. Other advisors, agencies and fintechs would pay for evidence-backed calculations without rebuilding them. This converts a fixed development cost already paid into recurring revenue, and each integration makes the platform harder to displace.

The infrastructure exists — `server/partnerApi.ts` is bearer-gated and already strips aggregate crediting rates at the boundary. What is missing is documentation, key management and a price.

**Complete when.** A third party integrates without a phone call.

---

# TIER FOUR — The brain

## 16. Every engine as a named council tool

**What.** The AI can run any calculator by name, with its schema, and cite the ledger row behind each number it reports.

**Why it multiplies.** The brain currently reasons *about* the platform. It should reason *with* it. "What happens if I put 18% in instead of 15%?" should run the engine and answer with a real number and its provenance — not describe what the calculator would do.

That converts the chat surface from a documentation lookup into the fastest path through the whole catalogue, which is the only realistic answer to 115 pages and 688 URLs. The owner's original complaint was getting lost in his own site; a brain that can run any of it on request is the navigation layer.

**Cost.** Registration plus a citation contract. The memory bank already maps engines to groups.

**Complete when.** The council answers a numeric question by running the engine and citing the row.

---

## 17. The brain refuses rather than generates

**What.** An explicit contract: no figure without a ledger row. "I don't have a source for that" is the correct answer.

**Why it multiplies.** This is the highest-risk surface on the platform. A model that produces a plausible rate when it lacks one is generating a liability at conversational speed, and the output is indistinguishable from a sourced figure to the person reading it.

The refusal also builds trust asymmetrically: a system that declines to answer is believed when it does answer. That is worth more than coverage.

**Complete when.** The brain's citation rate on factual numeric answers is measured and above 95%.

---

## 18. "Run this for me" hands off to the page

**What.** A chat request opens the relevant calculator, pre-filled, with the result already computed.

**Why it multiplies.** Conversation is the best interface for deciding *what* to look at and the worst for examining a 30-year schedule. Handing off at the right moment gives both — the brain does navigation and framing; the page does depth. Neither is asked to do the other's job.

**Complete when.** A chat answer offers a link that opens the page in the state the answer described.

---

## 19. Document ingestion beyond mortgage statements

**What.** Extend the extractor to tax returns, policy statements and brokerage statements.

**Why it multiplies.** Onboarding friction is where households abandon. The mortgage-statement extractor already proves the pattern works; each additional document type removes another block of typing and increases the share of the profile that arrives accurate rather than remembered. A 1040 alone supplies income, filing status, bracket, dependants and several deductions — twenty fields from one upload.

**Complete when.** A household can populate most of the fact finder from three uploads.

---

## 20. Gap-aware questioning

**What.** The brain sees what is answered and asks only for what is missing — and only when a calculation actually needs it.

**Why it multiplies.** A 200-question calibration is an asset if it is answered and a wall if it is presented. Asking the four questions that unlock the calculator in front of the user, at the moment it is needed, converts the same question bank from an obstacle into a series of small, obviously-worthwhile exchanges.

**Complete when.** No user is shown a question whose answer no engine will consume.

---

# TIER FIVE — Position and defensibility

## 21. Honest comparison against the alternative

**What.** Beside each strategy, model the obvious alternative — pay down the mortgage directly, buy term and invest the difference, use a taxable brokerage — with the same rigour and the same sources.

**Why it multiplies.** The comparison is happening anyway, in the client's head or their accountant's. Doing it first, fairly, and sometimes concluding the alternative wins, is what distinguishes an advisor from a salesperson.

The counterintuitive part: a platform that sometimes recommends *against* its own product is believed when it recommends for it. That credibility is the asset, and it is unavailable to anyone who only models their own side.

**Complete when.** Every strategy page shows the alternative modelled to the same standard.

---

## 22. Freshness sweep with visible staleness

**What.** A scheduled job re-checks every dated claim and flags anything past 90 days, visibly.

**Why it multiplies.** Verified data decays. A rate verified in March and displayed unchanged in December is arguably worse than an unverified one, because it carries a source that implies currency it does not have. A visible staleness badge is honest and creates a maintenance loop that keeps the evidence layer alive rather than letting it rot after the initial research push.

**Complete when.** Every dated field shows its age and flags past threshold.

---

## 23. File the provisional patent

**What.** File one provisional covering the strongest of the 57 drafted claims.

**Why it multiplies.** Three returns from one filing. The platform gains truthful "patent pending" language on every surface — a test currently enforces the honest version, and one `APPLICATIONS` record flips it. It establishes a priority date on work that is already public-facing. And in any acquisition or partnership conversation, a filed application is an asset on a page while a drafted claim is a paragraph.

**Cost.** A day of counsel's time and the filing fee. The cheapest defensibility available.

**Complete when.** One record exists in `shared/patentStatus.ts` and the language flips.

---

## 24. Advisor white-label

**What.** An advisor runs the platform under their own name, with their own disclosures, on their own subdomain.

**Why it multiplies.** It converts every advisor from a user into a distribution channel, and it raises switching costs sharply — an advisor who has put their brand on a tool does not casually move. The engines, evidence layer and compliance artifacts are identical; only branding and disclosure text vary.

**Complete when.** A second advisor's clients see their advisor's brand throughout.

---

## 25. The cinematic layer on real numbers

**What.** The vision board, legacy thread and breathing interface driven entirely by engine output — the household's own modelled outcomes, not illustrative art.

**Why it multiplies.** The emotional layer is what makes a plan stick, and the owner built it deliberately. But emotional presentation of *invented* numbers is the one thing that would undermine everything the evidence layer is for — it would mean the most memorable surface on the platform is the least sourced.

Driven by real output, it becomes the payoff for all the rigour underneath: the family sees their actual modelled legacy, at their actual percentile, sourced. That is the moment the platform earns the multi-generational framing the owner designed it around, rather than merely asserting it.

**Complete when.** Every value on a cinematic surface traces to an engine and a ledger row.

---

# The honest summary

**If four of these happen, do the tier-one four.** Account aggregation, the single-entry walk, provenance everywhere, and the flagship fixes. Everything else amplifies whatever those produce.

**The pattern across all twenty-five:** the platform's engines are genuinely strong and unusually rigorous. Nearly every item here is about *connecting* that strength to someone — the household that has to type it in again, the advisor who cannot trace it, the spouse who never sees it, the brain that cannot run it, the compliance reviewer who cannot verify it. The engineering is largely done. The value is in the wiring.
