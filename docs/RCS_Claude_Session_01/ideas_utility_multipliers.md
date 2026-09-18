# Twenty-Five Utility Multipliers
## Making the platform predictable, objective, consistent, legally safer, and better to use

These are the changes that multiply the *utility* of what already exists — not new features, but the properties that decide whether a sophisticated user trusts the output enough to act on it. A calculator nobody trusts has a utility of zero regardless of how good its math is.

Each entry: **what it is · why it multiplies · how to build it · the check that proves it.**

Grouped into five families. The families are ordered by leverage.

---

# FAMILY ONE — PREDICTABILITY
*The same question must produce the same answer, today and in eighteen months, on any machine.*

## 1. Content-addressed result IDs

**What.** Every calculation returns a stable ID derived from a hash of `{engine version, inputs, rules-table versions, evidence as-of dates, seed}`. The same inputs always produce the same ID; any change to any of those produces a different one.

**Why it multiplies.** An advisor shows a client a projection on Tuesday. On Friday the client's spouse asks a question. Today the advisor re-runs it and gets a slightly different number — because a data sweep landed, or a default moved — and has no way to know that happened. With a result ID, the advisor pastes the ID and gets byte-identical output, or an explicit *"this result was computed against rules v3 and evidence as of 2026-08-31; the current versions differ — show the original, or recompute?"* That single capability is the difference between a tool an advisor will put in front of a client and one they will not.

**How.** `shared/resultId.ts` — a pure hash over a canonical serialisation. Every engine's result type gains `resultId: string`. Store the input envelope alongside it so a result can be replayed.

**Check.** Running the same input twice produces the same ID; changing any rules-table version changes it.

---

## 2. Frozen assumption snapshots on every saved illustration

**What.** When an illustration is saved, exported or emailed, it pins the exact versions of every rules table, every evidence series and every engine constant it consumed.

**Why it multiplies.** Tax law changes annually and product caps change quarterly. An illustration delivered in March 2026 and re-opened in March 2027 must still show what the client was actually shown — otherwise the document is not a record of anything. This is also the difference between a defensible file and an indefensible one if anyone ever asks what the client was told.

**How.** Extend the PDF export and the saved-scenario record with an `assumptionSnapshot` block: `{rulesVersions: {...}, evidenceAsOf: {...}, engineVersion, resultId}`. Render it on the illustration's last page.

**Check.** Re-opening a saved illustration after a rules change shows the original figures and a banner naming what has since changed.

---

## 3. One seeded random source, never `Math.random()`

**What.** All stochastic behaviour routes through a seeded generator. `Math.random()` is banned by lint.

**Why it multiplies.** A 10,000-path fan that shifts between two viewings of the same scenario destroys confidence faster than a wrong number does — a wrong number can be explained; an unstable number cannot. The platform already does this correctly in `rentalMarketEngine` and `historicalMarketRegimeEngine`. Making it universal and enforced closes the gap.

**How.** `shared/rng.ts` exporting `mulberry32`; an ESLint rule banning `Math.random` outside it; a default seed derived from the result ID so the seed is itself reproducible.

**Check.** Repository scan finds zero `Math.random()` calls outside `shared/rng.ts`.

---

## 4. A cross-engine reconciliation test

**What.** One fixture household run through every engine that touches overlapping quantities, asserting they agree.

**Why it multiplies.** The Mortgage Killer, the Time Machine, the IUL illustration and the LifeForge simulator all model a policy's cash value. Nothing currently asserts they agree. When two pages disagree about the same family, both lose credibility — and the user cannot tell which one to believe, so they believe neither.

**How.** `server/crossEngineConsistency.test.ts`: one household, every engine, assert pairwise agreement within a stated tolerance on every shared quantity. Where a difference is legitimate, the test records *why*, so the difference is documented rather than discovered.

**Check.** The test exists and passes. Drift between simulators becomes a build failure rather than a support ticket.

---

## 5. Golden-master tests on published illustrations

**What.** A handful of complete illustrations — real shapes, not toy inputs — with their full output committed as fixtures. Any change that moves a number fails until the fixture is deliberately updated.

**Why it multiplies.** Unit tests catch broken functions. They do not catch a refactor that quietly shifts a 30-year projection by 4%. A golden master catches exactly that, and it forces every numeric change to be intentional and reviewed. With four flagship defects currently in the engine, the fixtures should be written *after* the P0 fixes — otherwise you freeze the bug.

**Check.** Changing a constant fails the golden master with a readable diff of which year moved and by how much.

---

# FAMILY TWO — OBJECTIVITY
*Every number either has a source or says it does not. Nothing in between.*

## 6. The refusal contract

**What.** Engines return `{ ok: true, value } | { ok: false, reason, missing }` rather than silently substituting a default.

**Why it multiplies.** The most dangerous output this platform can produce is a plausible number with no basis, because it looks exactly as authoritative as a sourced one. `rentalMarketEngine` already does this — it returns `null` with a reason where no series exists. Generalising the pattern converts the platform's single most valuable property from a local habit into an architectural guarantee.

**How.** `shared/result.ts` with the discriminated union; engines adopt it at their boundaries; the UI renders a refusal as a stated gap, never as a blank or a zero.

**Check.** No engine returns a number it cannot source without the caller receiving an explicit refusal.

---

## 7. Evidence as a first-class type, not a convention

**What.** `Evidence = {source, asOf, window, method}` and `Figure<T> = {value, evidence, reason?}` used everywhere a number crosses a module boundary.

**Why it multiplies.** The type system then enforces what documentation currently requests. You cannot forget to attach provenance, because the code will not compile. This is the single highest-leverage change for Rule 4 of the page contract, because it converts 112 pages of manual work into a compiler error.

**How.** Already defined in `shared/rentalMarketEngine.ts`. Promote to `shared/evidence.ts` and adopt across engine return types.

**Check.** A scorecard detector counts `Figure<T>` usage per page; Rule 4 becomes machine-checked.

---

## 8. Evidence-strength scores on every sourced claim

**What.** A 1–5 score per source: 5 = primary document from the issuing body; 3 = reputable secondary; 1 = inference. Displayed, not hidden.

**Why it multiplies.** "Sourced" is binary and therefore misleading — a lender's own rate sheet and a comparison blog are not the same evidence, and presenting them identically flattens a real distinction. Session A's `thresholds.ts` already scores evidence this way. Making it universal lets the UI sort by confidence, and lets the freshness sweep prioritise upgrading the weakest claims first.

**Check.** Every source row in `data/sources.csv` carries a score; the UI renders it; a report lists all claims below 4.

---

## 9. Effective-date-aware rules tables

**What.** Rules tables keyed by date, so an illustration dated March 2024 applies March 2024 law.

**Why it multiplies.** Without it, re-opening an old illustration silently applies today's brackets to yesterday's plan — which is wrong twice over: it misrepresents what the client was told, and it produces a number that was never true at any point in time. With it, the platform can also answer "what would this have looked like under the old rules?", which is a genuinely useful advisory question.

**How.** `RulesTable<T>` gains `rowsAsOf(date)`. Tables carry effective and sunset dates per row.

**Check.** Setting an as-of date to 2024 produces 2024 brackets and a banner naming the date.

---

## 10. A sourcing coverage report, rolled up

**What.** One admin page: per calculator, what share of displayed figures are sourced, what share fell back, which series are missing, and which sources are stale beyond 90 days.

**Why it multiplies.** It converts "are we sourced?" from an opinion into a number the owner can watch move weekly. It also tells you exactly where the next research hour should go — the fallback that fires most often across the most-used calculator.

**Check.** The page exists, and the fallback rate is recorded per calculator run.

---

# FAMILY THREE — CONSISTENCY
*The same concept looks, reads and behaves the same everywhere.*

## 11. One formatter for every number

**What.** A single module owning money, percentage, date, duration and large-number formatting, with explicit precision rules per context.

**Why it multiplies.** Today `$1,234,567`, `$1.23M` and `$1,234,567.00` can appear on the same screen. Each is defensible; together they read as three different products bolted together. Precision inconsistency is also a subtle credibility leak — showing a 30-year projection to the cent implies a precision the model does not have.

**How.** `shared/format.ts`; a lint rule against inline `toLocaleString` and `toFixed` in components.

**Check.** Repository scan finds zero ad-hoc numeric formatting in `client/src`.

---

## 12. A route manifest instead of a hard-coded count

**What.** Replace `expect(currentRoutes.size).toBe(330)` with an assertion against a real list of routes.

**Why it multiplies.** That integer is the single most reliable merge conflict in the repository — it collided between the two parallel sessions on the very first merge, and it will collide on every future one. A manifest merges cleanly, because two branches adding different routes produce two non-overlapping line additions instead of one conflicting number. It also catches duplicate routes, which the count cannot.

**How.** `shared/routeManifest.ts`; both smoke tests assert against it.

**Check.** Two branches adding different routes merge without conflict.

---

## 13. One rules-table interface

**What.** `RulesTable<T>` implemented by `thresholds.ts`, `divorceStateRules.ts` and every table that follows.

**Why it multiplies.** Two excellent rules tables currently exist with different shapes, which means every consumer writes bespoke access code and no scan can verify Rule 7 across both. One interface makes "every statutory constant reaches a rules table" a mechanical check rather than a code review.

**Check.** A repository scan asserts no statutory or product constant lives outside a `RulesTable`.

---

## 14. Shared chart primitives with fixed semantics

**What.** One percentile-fan component, one stress-line component, one evidence-ledger component — with fixed colour and shape meaning across the platform. p10 always the same colour; the worst-decade line always the same dash.

**Why it multiplies.** A user learns the visual language once and reads every chart on the site fluently. Where each page invents its own, every chart costs a fresh act of interpretation, and the cumulative friction is why people stop exploring after two pages.

**Check.** Chart components are imported, not re-implemented; a visual-regression test covers each primitive.

---

## 15. One vocabulary, enforced

**What.** A glossary defining each term once — "cash value", "net cash value", "surrender value", "death benefit", "illustrated rate", "credited rate" — and a lint rule flagging synonyms in UI copy.

**Why it multiplies.** These terms have precise, non-interchangeable meanings, and using them loosely is both a comprehension problem and a compliance problem. A user who sees "cash value" on one page and "account value" on another cannot tell whether they are the same quantity — and frequently they are not.

**Check.** The glossary exists, is linked from every page, and the lint rule passes.

---

# FAMILY FOUR — LANGUAGE THAT REDUCES LEGAL EXPOSURE
*Same information, wording that does not overstate. This is not legal advice; it is the wording discipline a compliance reviewer will ask for.*

## 16. A banned-phrase lint with approved replacements

**What.** A CI-enforced list of words that must not appear in user-facing copy, each with its approved alternative.

| Avoid | Use instead | Why |
|---|---|---|
| guaranteed (of non-guaranteed values) | contractual minimum / guaranteed element | Only contractual guarantees are guaranteed |
| will grow / will be worth | projected to / illustrated at | A projection is not a promise |
| risk-free · safe · no downside | principal-protected against index loss, subject to charges and carrier claims-paying ability | Charges and credit risk remain |
| tax-free | income-tax-free if the policy is not a MEC and is not surrendered or lapsed | The conditions are the substance |
| returns | credited interest / illustrated crediting | A policy credits; it does not return |
| you should / we recommend | one option is / advisors commonly consider | Recommendation language triggers suitability duties |
| beat the market | historical index crediting compared to | Comparative performance claims invite scrutiny |
| bank on yourself · infinite banking | policy-loan financing strategy | Trademarked and marketing-loaded terms |

**Why it multiplies.** Wording is the cheapest risk reduction available — it costs a find-and-replace and a lint rule, and it removes the class of claim most likely to be challenged. It also improves accuracy, because each replacement is more precise than what it replaces.

**Check.** `server/complianceLexicon.test.ts` scans `client/src` and fails the build on a banned phrase.

---

## 17. Every projection carries its hypothetical disclosure in the component

**What.** The projection component itself renders the disclosure — it is not a separate element a page can forget.

**Why it multiplies.** A disclosure that lives in the shared component cannot be omitted by a new page, cannot drift between pages, and updates everywhere at once when counsel revises it. Standard language: *"This is a hypothetical illustration, not a prediction or a guarantee. Actual results will differ. Values shown are not guaranteed unless explicitly labelled as contractual guarantees."*

**Check.** No chart of a future value renders without the disclosure in the same component tree.

---

## 18. Separate the guaranteed column from the illustrated column, visually

**What.** Contractual guarantees and illustrated values shown side by side, with a permanent visual distinction — never a single blended line.

**Why it multiplies.** This is the single most common criticism of indexed-product illustrations, and showing both columns pre-empts it entirely. It also happens to be the more honest presentation, and the one a sophisticated buyer respects: showing the guaranteed floor alongside the illustrated case signals that you are not hiding it.

**Check.** Every policy projection renders both, and the guaranteed column is never omitted.

---

## 19. A suitability capture on every recommendation

**What.** When a page recommends a course of action, it records the household facts that make it suitable — and refuses to recommend where a disqualifying fact is present or unknown.

**Why it multiplies.** Suitability is the standard any recommendation will be judged against. A system that captures the basis contemporaneously produces a defensible file automatically; one that does not requires reconstruction later, from memory. The refusal half matters as much: a recommendation the system declines to make because a fact is missing is a prompt to gather the fact.

**Check.** Every recommendation carries a suitability record; recommendations are withheld where a required fact is absent.

---

## 20. Illustration watermark, expiry and version stamp

**What.** Every exported PDF carries: the as-of date, an expiry (90 days is a reasonable default), the assumption snapshot, the result ID, and a "sample — not a contract" watermark until an advisor explicitly finalises it.

**Why it multiplies.** Illustrations circulate. Without an expiry, a projection built on 2024 rates gets forwarded in 2027 and presented as current. The watermark also prevents a draft from being mistaken for a delivered document, which is a common and avoidable problem.

**Check.** Exports carry all five elements; an expired illustration renders a banner when reopened.

---

# FAMILY FIVE — THE USER'S EXPERIENCE
*The fastest way to make a strong engine useless is to bury it.*

## 21. One number first, depth on demand

**What.** Every calculator opens on a single headline figure with one sentence of plain-language meaning. Charts, tables and schedules sit behind progressive disclosure.

**Why it multiplies.** The current pattern — a dense grid of inputs, then a wall of tables — asks the user to do work before they get anything. Leading with the answer and revealing the machinery on request serves both audiences: the client who wants to know if this is worth their time, and the advisor who wants the amortization schedule. One layout, two readers.

**Check.** Time-to-first-number is measured and budgeted (target: under 10 seconds from landing, with pre-filled fields).

---

## 22. Inherited fields are visibly inherited

**What.** A field pre-filled from the household shows a marker and, on hover or tap, *"from your fact finder, answered 12 March"* — with a one-click override.

**Why it multiplies.** Auto-population is invisible when it works, which means the user never learns the site remembers them and keeps bracing to re-type everything. Making inheritance visible is what converts a technical capability into a felt experience — and it also surfaces stale values, which are otherwise silently wrong.

**Check.** Every inherited field carries the marker and its provenance.

---

## 23. Comparison as the default view

**What.** Results render as "flat assumption versus your ZIP's actual history" side by side, rather than requiring the user to toggle and remember what the previous number was.

**Why it multiplies.** The evidence layer's persuasive power is entirely in the *contrast*. A user who sees only the sourced number learns nothing about why sourcing matters; a user who sees both at once understands immediately that the standard assumption was optimistic — or conservative — for their specific place. It turns a technical feature into an argument.

**Check.** Comparison renders without the user discovering a toggle.

---

## 24. A scenario stack with undo

**What.** Every change to an input pushes a named scenario. The user can step back, compare any two, and name the ones worth keeping.

**Why it multiplies.** Financial exploration is inherently comparative — "what if I put in 20% instead of 15%" is the actual work. Today that means changing a field and losing the prior answer, so users either write numbers on paper or stop exploring. A scenario stack turns a calculator into a thinking tool, and it costs one array and a diff view.

**Check.** A user can produce three scenarios and compare them without re-entering the household.

---

## 25. Two modes: advisor and client

**What.** Advisor mode is keyboard-first, dense, shows every intermediate value and every ledger row. Client mode is large-type, one-number-at-a-time, mobile-first, with the machinery hidden but one tap away.

**Why it multiplies.** The platform currently serves both audiences with one layout, which means it is too dense for a client sitting at a kitchen table and too slow for an advisor running six illustrations before lunch. The engines are identical; only the presentation differs. This is the highest-return UI change available, because it doubles the addressable use without touching a single calculation.

**Check.** An advisor can complete an illustration without a mouse; a client can read the result on a phone without pinch-zooming.

---

# Where to start

If only five of these are done, do these five — they are the ones the rest depend on:

1. **#7 — evidence as a type.** Turns Rule 4 from 112 pages of manual work into a compiler error.
2. **#6 — the refusal contract.** Makes "never invent a number" architectural rather than cultural.
3. **#16 — the banned-phrase lint.** Cheapest risk reduction on the list; one afternoon.
4. **#12 — the route manifest.** Removes the merge conflict that will otherwise recur on every parallel branch.
5. **#21 + #23 — one number first, comparison by default.** Makes the evidence layer legible to the person it is meant to persuade.

The remaining twenty are each worth doing, and none of them is large. The pattern throughout is the same: take something the codebase already does well in one place, and make it structural.
