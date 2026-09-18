# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 03 — THE 10/10 PAGE CONTRACT

### The principle

A 10 out of 10 is not a prettier page. It is a page that **cannot show a number without its source, cannot be reached without the brain knowing it exists, and cannot be left without feeding the next page.**

Two independent measurements found the same gap. The platform's own integration scorecard puts mean page wiring at **3.3 / 10**. The 688-page audit put the utility-weighted average at **4.3 / 10**. Both say the engines are strong and the connections between them are missing.

So the contract below scores *connection*, not appearance. Ten rules. One point each. A page's score is the number of rules it passes. A 10 passes all ten.

---

### The ten rules

#### Rule 1 — REGISTERED
**The page exists in the catalogue.**

The route appears in `shared/calculatorCatalog.ts` (or `SECONDARY_CATALOG` for supporting pages) with: its category, a one-line statement of purpose, its inputs, its outputs, and the memory group it belongs to.

*Passes when:* the catalogue entry exists and `calculatorCatalog.test.ts` verifies the path resolves to a real route.
*Why it matters:* a page absent from the catalogue is invisible to the brain, to navigation, and to the scorecard. It might as well not exist.

#### Rule 2 — BRAINED
**The AI can find and cite this page.**

The page's engine is registered as a module in `shared/aiMemoryBank.ts`, belongs to a memory group, and is reachable by the composite mind so the AI can name it, describe it, and run it.

*Passes when:* `unwiredGroups()` returns 0 and the page's module appears in the instrument block fed to the model's prompt.
*Why it matters:* the owner's core requirement is that everything connects to the AI brain. A page the brain cannot cite is a page the brain will never recommend.

#### Rule 3 — FED
**The household never types the same fact twice.**

Every input the household has already answered anywhere on the site is pre-filled from the shared client state. The page asks only for what is genuinely new.

*Passes when:* every field with a counterpart in the fact finder reads its default from `ClientDataContext`, and a site-wide audit finds no field asked on two pages without pre-fill.
*Why it matters:* re-asking is the single most common reason a user abandons a financial tool. It also signals to the user that the site is a collection of disconnected forms rather than one system that knows them.

#### Rule 4 — SOURCED
**No figure appears without its provenance.**

Every number carries an evidence record: `{source, asOf, window, method}`. Where no public series exists, the value is `null` with the reason shown — never an estimate presented as a measurement.

*Passes when:* every displayed figure traces to an evidence record, and the page renders a ledger or per-figure provenance link.
*Why it matters:* this is what separates this platform from a spreadsheet with nice fonts. It is also the compliance floor: an advisor who shows a client a number must be able to say where it came from.

#### Rule 5 — TOGGLED
**Real history is available, and it is the user's choice.**

The page offers the standard evidence toggles, every one **off by default**. Off means the engine's own documented assumption, clearly labelled as an assumption. On means a path built from the actual record. The toggle set: ZIP-level appreciation, pessimistic (10th-percentile) path, real dollars (inflation-adjusted), property tax from the local record, rate from a published benchmark.

*Passes when:* the shared `EvidencePanel` is present, defaults are off, and switching any toggle on changes the result and adds a ledger row.
*Why it matters:* this is the owner's explicit standing order — 36-year history, taxes and inflation optional on every calculator. Off-by-default matters too: it means turning a toggle on is a deliberate, explainable act, and the old behaviour is never silently changed.

#### Rule 6 — SIMULATED
**Long projections show their uncertainty.**

Any projection running five years or longer offers a 10,000-path block-bootstrap simulation, reporting the 10th, 50th and 90th percentile paths plus the worst rolling decade in the record.

*Passes when:* the page calls the shared `blockBootstrapPaths` implementation with a fixed seed (so results reproduce), and renders a percentile fan rather than a single line.
*Why it matters:* a single-line projection of a 30-year outcome is a lie of precision. The percentile fan is honest, and the worst-decade line is what actually protects a family.

#### Rule 7 — RULED
**Law and product terms live in tables, not in components.**

Every legal, tax or product constant — a statute, a bracket, a contribution limit, a product cap — reads from a rules table carrying a `RULES_VERSION` and a `neverPrinted` list. No such constant is hard-coded in a `.tsx` file.

*Passes when:* a repository scan finds zero statutory or product constants inside components, and every rules table exports its version.
*Why it matters:* tax law changes annually and product caps change quarterly. A constant buried in a component is a silent error waiting for the next legislative session. The divorce rules table now in the codebase is the reference implementation.

#### Rule 8 — LINKED
**No page is an island.**

At least two surfaces link into the page (a hub tab, a related-pages rail, or a genome strategy route), and the page publishes its result so at least one other page consumes it.

*Passes when:* the inbound-link count is ≥ 2 and the page calls `publishResult`, with a named consumer.
*Why it matters:* 104 of 115 pages currently have fewer than two inbound links. That is the arithmetic of getting lost in your own website.

#### Rule 9 — TESTED
**The math is guarded.**

The engine has a pure-function test. The page has a route and navigation test. Any regulated claim — an AG 49-A rate, "patent pending" language, NAIC-governed wording — has a compliance test that fails the build if the claim drifts.

*Passes when:* all three test classes exist and pass.
*Why it matters:* 4,076 tests are why this platform can be changed quickly without fear. Every untested engine is a place where that stops being true.

#### Rule 10 — MEASURED
**The page reports on itself.**

Views, completions, time-to-first-number, and abandonment are tracked per page, and the numbers appear on the integration scorecard.

*Passes when:* the page emits its events and appears in the scorecard with live figures.
*Why it matters:* without this, "which pages matter" is an opinion. With it, the next quarter's work sorts itself.

---

### How the score is computed

```
page_score = number of rules passed (0–10)
site_score = mean page_score across the catalogue
```

Six of these ten rules are already read from the code by `server/integrationAudit.ts`. Adding checks for Rules 4, 5, 6 and 10 makes the entire score automatic — no human judgement, no argument.

**Enforcement, staged:**
1. **Now:** the scorecard reports. Nothing fails the build.
2. **When site mean reaches 6:** any *new* page must ship at 8 or higher.
3. **When site mean reaches 8:** any page that regresses below 8 fails the build.

Staging matters. Turning the gate on today would fail 104 of 115 pages and stop all work.

---

### What the score means in practice

| Score | What it describes | Example |
|---|---|---|
| **0–3** | An orphan. Real math, no connections. The user must find it by accident and type everything. | Most of the 76 pages currently below 5 |
| **4–5** | Works in isolation. Catalogued, maybe tested, but flat assumptions and no provenance. | The Mortgage Killer *before* this session's work |
| **6–7** | Connected but not sourced. Pre-fills, links out, but still shows numbers it cannot defend. | Several hub pages today |
| **8–9** | Defensible. Sourced, toggled, simulated, linked, tested. Missing measurement or one connection. | The Mortgage Killer *now* — pending the four math fixes |
| **10** | Full organism member. Every figure traceable, every input inherited, every result consumed downstream, self-measuring. | None yet |

---

### The honest read on "4.3 to 10"

Going from 4.3 to 10 across 115 pages is roughly **six rules × 115 pages** of wiring work. That sounds enormous, and it would be if each page were done by hand.

It is not enormous, because **eight of the ten rules are satisfied by shared infrastructure, not per-page code**:

- Rule 3 (FED) is one context provider consumed everywhere.
- Rule 4 (SOURCED) and Rule 5 (TOGGLED) are one `EvidencePanel` component plus one `withEvidence()` server helper.
- Rule 6 (SIMULATED) is one already-written resampling function.
- Rule 7 (RULED) is a set of rules tables written once per legal domain.
- Rule 8 (LINKED) is largely generated from the catalogue and the genome.
- Rule 10 (MEASURED) is one analytics hook.

Build the shared pieces once, apply them, and most of the catalogue moves from 3 to 8 in a matter of weeks rather than a page at a time over a year. **That is the whole strategy: build the spine, then attach the pages to it.**

**Next file: 04 — PER-CATEGORY PAGE REQUIREMENTS.**
