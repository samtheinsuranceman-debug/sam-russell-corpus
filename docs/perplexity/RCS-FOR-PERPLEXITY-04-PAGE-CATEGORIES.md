# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 04 — WHAT EACH TYPE OF PAGE MUST HAVE

Nine categories. For each: what is **necessary**, what to **add**, what to **connect**, what to **delete**, and what to **measure**. These are the category-specific requirements that sit on top of the ten universal rules in file 03.

---

### A. CALCULATORS
*Mortgage acceleration, IUL, annuities, tax, PSLF, divorce, long-term care, disability, estate.*

**Necessary**
- The math lives in a pure function in `shared/` — no arithmetic inside a React component.
- A zod input schema on the tRPC router validates every field at the boundary.
- An evidence ledger accompanies every result.
- The standard toggles, off by default.
- A 10,000-path simulation on anything projecting five years or more.
- Every legal, tax or product constant reads from a rules table.
- PDF export that prints the ledger on the final page — so a printed illustration is as defensible as the screen.

**Add**
- A "how this figure is made" link beside every output, opening the provenance page that already exists at `/portal/how-a-figure-is-made`.
- Scenario comparison — at minimum four presets run side by side.
- A worst-decade stress line on every chart, drawn from the actual worst rolling period in the record rather than an invented downside.
- A solve-for-input inversion: "what would have to be true for this to work?"

**Connect**
- Reads the fact finder for every input it shares with the household profile.
- Publishes its result to the strategy context so downstream pages consume it.
- Appears in the household genome so the profile routes users here.
- Callable by name from the AI council as a tool.

**Delete**
- Any product rate, statute, bracket or index return hard-coded in a `.tsx`.
- Any chart fed a literal array instead of computed data — the 688 audit found this pattern repeatedly and it is how a chart silently stops reflecting the inputs.
- Any `useMemo` with an empty dependency array feeding a chart: the data freezes while the inputs change.

**Measure**
Runs, exports, share of runs with at least one toggle enabled, share of runs where a data fallback fired (this is the direct measure of data coverage), and completion rate.

---

### B. SIMULATORS AND ENGINES
*LifeForge, Time Machine, Wealth Genome, Sequence Planner, Monte Carlo.*

**Necessary**
- Sourced historical series — FRED, FHFA, Shiller, HUD — with the coverage window displayed, not assumed.
- Seeded resampling so a result reproduces exactly.
- Percentile fans, never a single line.
- The full assumption sheet printed with the result.

**Add**
- The Shiller series from 1871 for long-horizon equity and CAPE work.
- ZIP-level paths as an option on every simulator, not just the mortgage engine.
- Inversion mode — solve for the input that produces a target outcome.
- A regime-awareness note: say which historical periods the resampled blocks came from.

**Connect**
- Every simulator consumes the same household state and the same evidence tables. One `evidence/` namespace, never per-page copies of a series.
- Simulator outputs feed the vision board and the legacy thread, so the cinematic layer shows real numbers.

**Delete**
- Any fixed 5%, 7% or 8% growth default that is not explicitly labelled a fallback.
- Total-return index tables used anywhere crediting is calculated. Index crediting uses price return. This distinction is currently wrong in `ibbotsonModel.ts` and it materially overstates results.

**Measure**
Paths generated, seed values, the p10–p90 spread, and **drift between simulators given identical household inputs** — which should be zero. Any drift is a bug, and measuring it is how you find it.

---

### C. HUBS AND WORKSPACES
*RECIN, Rental Enterprise, Mechanisms, Alt Credit, The Field.*

**Necessary**
- Tabs that embed child pages at their own URLs — the owner's explicit requirement: embed inside hubs while keeping the URL.
- One shared state across all tabs in the hub.
- A summary strip that updates live as any tab changes.

**Add**
- The 36-year ZIP evidence panel at the hub level, so every tab inherits the setting rather than each asking separately.
- A "what changed since your last visit" line.
- Cross-tab conflict detection: if two tabs assume different things about the same household, say so.

**Connect**
- The hub is the memory group for its children. Brain retrieval goes hub-first, then page.
- The genome routes to the hub; the hub routes to the right tab.

**Delete**
- Standalone routes that duplicate a hub tab. Keep the URL alive as a redirect into the tab — the owner was explicit that URLs must survive.

**Measure**
Tab depth per visit, cross-tab navigation rate, exit points.

---

### D. KNOWLEDGE, EDUCATION AND RULES PAGES
*Statutes, real-estate lending law sequencing, product mechanics, glossary.*

**Necessary**
- Every claim carries a citation link and an as-of date.
- A `RULES_VERSION` on every rules table.
- **The rules table the engines read is the same object the page renders.** One source of truth, displayed and consumed. Not a prose copy that drifts from the table.

**Add**
- A "used by" list on each rule — which calculators consume it. This makes the blast radius of a legal change visible before you make it.
- A diff view when a rule changes, so an advisor can see what moved.
- A staleness flag on any citation older than 90 days.

**Connect**
- Indexed for council retrieval, so the AI can cite the rule directly.
- Each calculator's evidence ledger links back to the specific rule row it used.

**Delete**
- Prose that restates a rule the table already holds — it will drift, and then the page and the engine disagree.
- Any claim with no citation.

**Measure**
Citation count, count of citations older than 90 days, and how often each rule is read by an engine.

---

### E. CLIENT PORTAL, FACT FINDER AND ONBOARDING
*The 200+ NLP calibration questions, Wealth Genome inputs, document upload.*

**Necessary**
- One household state object — the single source for every client input on the platform.
- Every question tagged with the engines it feeds, so its value is visible.
- Progress that rewards completion — the reinforcement loop the owner designed.

**Add**
- **ZIP, county FIPS, state, filing status, and a property list with bedroom and bathroom counts as first-class fields.** These gate the entire evidence layer: without a ZIP, no calculator can use 36 years of local history. This is the highest-leverage single addition on the list.
- Extend document extraction beyond mortgage statements to tax returns and policy statements — the extractor pattern already exists.
- Gap-aware questioning: the brain sees what is answered and asks only what is missing.

**Connect**
- Answering any question pre-fills every calculator that consumes it, immediately.
- The genome reads the answered set and routes the household to the pages that fit.

**Delete**
- Duplicated question sets across pages. One question, one home, many consumers.

**Measure**
Completion percentage, questions answered per session, drop-off point by question, and **fields consumed per engine** — a question no engine reads is a question to retire.

---

### F. AI BRAIN, COUNCIL AND MEMORY
*Composite mind, multi-model council, whisperer, memory bank.*

**Necessary**
- Every engine callable as a named tool with its zod schema.
- Every answer cites the page and the specific ledger row behind each number.
- One memory-bank group per hub.

**Add**
- "Run this for me" from chat: the calculator opens pre-filled with the result already computed.
- An audit trail recording which engine produced which number in a conversation.
- Explicit refusal to state a figure with no ledger row — the brain should say "I don't have a source for that" rather than generate one.

**Connect**
- OpenRouter for the multi-model council (requires the owner's authorisation).
- Perplexity for public-fact retrieval only — never for proprietary calculation.

**Delete**
- Any prompt text that hard-codes a number the engines compute. The model must read the engine, not remember a figure.

**Measure**
Tool-call success rate, citation rate, unanswered-question rate, and disagreement rate between council models.

---

### G. HOMEPAGE, MARKETING AND AUDIENCE PAGES
*`/for/:slug`, the concept designs, landing pages.*

**Necessary**
- One design system chosen as default — Patent360 or Concept 23, the owner's call.
- The brand guard passing (no purple; emerald and gold).
- Core Web Vitals green.
- Every call-to-action lands on a pre-filled calculator, not a lead form.

**Add**
- At least one live number on the homepage drawn from the evidence layer — this month's prime rate, or a named ZIP's 36-year appreciation rate — with its as-of date. It proves the site is alive rather than a brochure.
- Make the five concept designs selectable themes rather than static images.

**Connect**
- Audience page → its hub → its calculators, as one path.

**Delete**
- Any page marketing a feature that does not exist in the catalogue. Nothing erodes trust faster.

**Measure**
LCP, CLS and INP; and call-to-action → calculator completion rate.

---

### H. ADMIN, DATA AND STATUS PAGES
*Zip engine, rental status, site health, integration scorecard.*

**Necessary**
- Per series: coverage window, as-of date, last sweep time, row count.
- A "read the files now" button for a manual refresh.
- A staleness flag on anything older than 90 days.

**Add**
- The rental ledger and the ZIP ledger on one status page.
- A provider freshness sweep that re-checks every dated provider field and flags what has aged out.
- **A rolled-up fallback report:** every calculator's fallback reasons in one place, so the owner can see at a glance which sources are missing and what that is costing.

**Connect**
- Every engine's fallback reasons roll up here.

**Delete**
- Nothing. But keep it behind admin authentication.

**Measure**
Sweep success rate, rows loaded, latency, and series with zero coverage.

---

### I. CINEMATIC AND MEDIA PAGES
*Breathing UI, 90 BPM pulse, vision boards, voice, video, legacy thread.*

**Necessary**
- **The values shown are the household's real numbers from the engines, not decoration.** A vision board displaying an invented figure is worse than no vision board.
- Reduced-motion preference respected.

**Add**
- The legacy thread reads the multi-generational transfer engine's actual output.
- Vision-board imagery keyed to the genome profile.

**Connect**
- HeyGen and ElevenLabs keys (owner action); the motion kit is already in the BASE.

**Delete**
- Any media element not driven by data.

**Measure**
Session length, return visit rate.

---

### The rule that spans all nine categories

**If a page shows a number, that number is traceable. If a page collects a fact, no other page asks for it again. If a page produces a result, some other page consumes it.**

Everything else in this file is the specific application of those three sentences.

**Next file: 05 — ONE ORGANISM.**
