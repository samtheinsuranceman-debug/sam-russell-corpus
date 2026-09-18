# 25 experience upgrades
## Interface and workflow changes worth a large multiple, with the reasoning for each

The engines are strong; the mean page-wiring score is 3.3 of 10; 104 of 115 pages have fewer than two inbound links. That combination has a specific symptom: **a household finds one good page and never learns the other 114 exist.** Most of what follows is about that, not about decoration.

Each item states the change, who it serves, why it is worth what it is worth, and how you would know it worked.

---

## A. The first five minutes — where most of the value is currently lost

### 1. One question at a time, not a form
**Change:** replace the multi-field fact finder with a single-question-per-screen flow that starts with the one question that most changes the answer, and stops as soon as it can say something useful.
**Why:** a 30-field form has a completion rate in the teens; a conversational flow that produces a figure after four questions has a completion rate several times higher. Every downstream engine is gated behind this one step, so its completion rate is a ceiling on the entire product.
**Know it worked:** completion rate, and the share of sessions that reach a populated page.

### 2. Show a real figure before asking for anything
**Change:** open with a computed number from public data — the appreciation in their zip, the current top marginal rate with its sample size, the break-even renovation uplift in their market. Ask for personal detail only after the site has proven it knows something.
**Why:** the current order asks the user to invest first and rewards them second. Reversing it is the highest-leverage change on this list and costs no new engine — `zipEngine`, `taxHistory` and `outsideForces` already hold the material.

### 3. A visible progress ladder with the payoff named at each rung
**Change:** "3 of 7 answered — one more unlocks your break-even uplift."
**Why:** people abandon when they cannot see the end or the reward. Naming the specific unlock converts an abstract form into a sequence of trades.

### 4. Remember everything, ask nothing twice
**Change:** item 5 of the utility list (`one Situation`) has a direct UX consequence: no field is ever requested twice across 115 pages.
**Why:** being asked your income for the fourth time is the clearest possible signal that the pages are not one product. Fixing it changes the perceived system from a folder of calculators into a planner.

### 5. An honest empty state on every page
**Change:** when a page cannot compute, say which input is missing, why it matters, and offer the one control that supplies it.
**Why:** blank charts read as broken. A named gap reads as a system that knows what it needs — and it is the single cheapest trust signal available.

---

## B. Making the figures legible

### 6. Every number clickable to its trace
**Change:** every rendered figure is a link to its `FigureTrace` — inputs, sourced steps, rules, arithmetic, assumptions.
**Why:** this is the site's real differentiator and it is currently live on three pages of 115. A household that can click any number and see how it was made will not go back to a competitor that shows a chart and nothing behind it.

### 7. Assumption panel pinned beside every projection
**Change:** rate, horizon, appreciation, uplift, as-of dates — always visible, always editable in place, with the chart updating live.
**Why:** it turns a static illustration into an instrument. It is also the compliance answer to "what were the assumptions", which makes it a rare case of the safe choice being the better experience.

### 8. Show sample size next to every probability, always
**Change:** never render a base rate without its `n`. The regime engine already refuses to state a power swing when either bucket is thin — surface that refusal rather than hiding it.
**Why:** "38.5% across 52 windows" is a fact; "38.5%" is a claim. The first is more persuasive precisely because it is bounded.

### 9. Two numbers, never merged, everywhere in the UI
**Change:** value and frequency; confidence and likelihood; share and likelihood — always rendered as two bars, never averaged into one score.
**Why:** it is the site's intellectual signature and it is already in the data model. A policy loan that is a 7 for value and a 2 for frequency tells a household something no single star rating can.

### 10. Refusals rendered as first-class content
**Change:** show what is *not* available and why, with the clause. The planner already produces this; most pages discard it.
**Why:** "you cannot open a line behind an equity share because of the no-further-encumbrance covenant" is more valuable than most positive recommendations, and no competitor says it.

### 11. A break-even line on every projection
**Change:** the value at which the strategy stops paying, drawn on the same chart as the projection.
**Why:** converts "here is a forecast" into "here is your decision rule". Users remember the threshold, not the curve.

### 12. Freshness badges, with age in days
**Change:** every sourced figure shows its as-of; over 90 days shows a flag.
**Why:** the alternative is a user discovering staleness themselves, which costs more trust than the flag ever could.

---

## C. Navigation — the 104-page problem

### 13. "What to read next" on every page, chosen by the household's own state
**Change:** three links, ranked by the genome and the gaps in their `Situation`, not a static related-links list.
**Why:** this is the direct fix for 104 pages having fewer than two inbound links. Static cross-links help; state-aware ones convert a library into a path.

### 14. Sort every list by frequency, not by impressiveness
**Change:** the mechanisms index already does this — velocity banking leads because most households can use it, not because it is the most impressive. Apply the rule site-wide.
**Why:** leading with the rarest, most dramatic strategy is what every competitor does and it mis-serves the median visitor.

### 15. A single "where am I" map keyed to the household's plan
**Change:** the sphere exists; make it render the household's own position, completed steps and next step, rather than the site's topology.
**Why:** a map of the product is less useful than a map of the user's progress through it.

### 16. Search that answers, not just finds
**Change:** a query returns the computed answer with its source plus the page, rather than a list of page titles.
**Why:** the engines can answer; search currently only routes. This is a small change with a large perceived-intelligence effect.

### 17. Deep links that carry state
**Change:** every page URL encodes the assumption set and the situation id, so an advisor can send a link that opens exactly what they saw.
**Why:** removes the single most common advisor workflow failure — "it looked different on my screen".

---

## D. The advisor

### 18. A one-page brief generated from the plan, not assembled by hand
**Change:** one click from a saved plan to a client-ready PDF with every figure traced and every disclosure attached by page class.
**Why:** this is the advisor's actual deliverable. Owning it makes the site the system of record rather than a step before Word.

### 19. "What to ask next" surfaced on every page
**Change:** `unaskedQuestions.ts` exists; render it wherever the `Situation` has a gap that the current page would use.
**Why:** turns the product into something that makes the advisor look prepared, which is what drives adoption among advisors.

### 20. A decision log that records disagreement
**Change:** store what the planner ranked first, what the household chose, and why they differ.
**Why:** it is the most useful artefact in a later dispute, it improves the engine over time, and no competitor keeps it.

### 21. Book-level view
**Change:** run the planner across every client; rank by the gap between current position and best legal plan.
**Why:** converts a per-client tool into a prospecting engine — the difference between an advisor using the site once a week and every morning.

### 22. Side-by-side plan comparison with the delta called out
**Change:** two plans, aligned by stage, with the changed inputs and the dollar difference highlighted.
**Why:** "what changed" is the second question every client asks and currently requires reading two documents.

---

## E. Trust and tone

### 23. Lead with the number that disappoints
**Change:** where the honest answer is unwelcome — the cycle break year, "sell eleven of thirty to clear 72%", a mean wiring score of 3.3 — show it first and without softening.
**Why:** it is the strongest available differentiator against every competitor in the category, and it is already the house style in the engines. Bringing it to the surface costs nothing and is the reason a sceptical client stays.

### 24. Plain-language first sentence on every page, term of art defined on first use
**Change:** grade-9 opening sentence; every piece of jargon carries an inline definition the first time it appears.
**Why:** the audience includes physicians and business owners who are expert in their own field and not in this one. Precision and accessibility are not in tension if the definition is one line away.

### 25. Accessibility and phone parity as a build gate, not a polish pass
**Change:** keyboard focus visible, contrast checked in both themes, screen-reader labels on every figure and chart, and a screenshot harness across the 52 rated pages at phone width — failing the build on regression.
**Why:** a meaningful share of the audience is over 55; a meaningful share of sessions are on a phone. This is not a courtesy, it is the addressable market. Making it a build gate is the only way it survives contact with a deadline.

---

## Where to start

Three items, in this order, and the rest becomes easier:

1. **#2 — show a figure before asking for anything.** Highest conversion effect, no new engine.
2. **#4 / utility #5 — one `Situation`, never ask twice.** Removes the ceiling on every other page.
3. **#6 — every number clickable to its trace.** Turns the site's actual advantage into something a visitor can see in one click.

Items 1–5 and 13 together address the measured problem — one good page found, 114 never seen. Items 6–12 address the second problem, which is that the site's best quality, its refusal to overstate, is currently invisible to anyone who does not read the code.
