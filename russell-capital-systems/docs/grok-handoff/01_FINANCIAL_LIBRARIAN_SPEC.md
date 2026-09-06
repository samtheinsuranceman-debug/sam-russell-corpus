# Financial Librarian — build specification (handoff for Grok)

**Status:** built and merged. This document describes what exists so the next
builder can extend it without re-deriving it. Source of truth is the code; paths
below are relative to `russell-capital-systems/`.

## What it is

One AI Financial Advisor, presented as a **tape recorder**, that speaks for the
whole AI API team (Claude, ChatGPT, Grok, Gemini, Perplexity, OpenRouter,
Mistral, Groq, Manus — whichever have keys in the host environment). It answers
spoken or typed questions from a client or their advisor, **but only after the
client has completed the full Financial Assessment**. Before that it explains
what is missing and hands them the assessment.

It is a *librarian*, not an oracle: once the assessment is complete the client
may ask unlimited questions; the librarian answers each, and on request boils
everything asked down to **3–5 core questions**, names the **emergent
question** they have not asked (the pattern underneath their questions and
their facts), and lays out a **10–15 page journey** through the site — real
URLs, calculators included — in a logical, building sequence.

## The pieces

| Piece | File | Notes |
|---|---|---|
| Assessment schema (15 sections, ~190 fields) | `shared/clientFactFinder.ts` | `FACT_FINDER_SECTIONS`, `factFinderCompleteness()`, `factFinderSummary()`. Required fields gate the advisor. `showIf` hides fields that don't apply. |
| Assessment storage | `drizzle/schema.ts` → `client_fact_finders` (one row per user, JSON + completeness + completedAt) | Also `client_journeys` (each generated journey). Both in `database/rcs-schema.sql`. |
| Assessment API | `server/factFinderRouter.ts` (`factFinder.get/save/summary/reset`), `server/factFinderDb.ts` | Zod-validated; graceful when no DB. |
| Assessment page | `client/src/pages/portal/FinancialAssessment.tsx` → `/portal/financial-assessment` | Section rail, autosave (900 ms), completeness, printable **Financial Analysis Document**. |
| Page catalog | `shared/journeyCatalog.ts` | 45 real portal pages with `kind`, `tags`, `builds` (ordering weight). Add pages here to make them eligible for journeys. |
| Journey engine | `shared/journeyEngine.ts` | Deterministic: `detectTags`, `factFinderSignals`, `distillQuestions`, `emergentQuestion`, `buildJourney`, `validateJourney`. |
| Librarian API | `server/librarianRouter.ts` (`librarian.status/ask/journey/latestJourney`) | Gate → fan-out to providers → synthesis by the lead model; AI may only polish wording of a journey, never its pages. Offline fallback answers from the assessment alone. |
| Tape recorder | `client/src/components/TapeRecorderAdvisor.tsx` | REC (Web Speech), PLAY, STOP, TYPE, JOURNEY; ElevenLabs voice via `ultra.speak` when configured, else browser speech. |
| Advisor page | `client/src/pages/portal/AIFinancialAdvisor.tsx` → `/portal/ai-advisor` | Deck + "what it knows" + the journey (core questions, emergent question, ordered steps with visited state). |
| Navigation | `client/src/components/AppShell.tsx` → group **New Client Welcome List** | Assessment → AI Financial Advisor → Wealth Genome → The Arrival … The Brotherhood. |

## Rules the librarian obeys (do not loosen)

1. **Gate.** No planning answer of any kind until `factFinderCompleteness().complete` is true. Not even partial.
2. **No invented facts.** Every figure comes from the client's own assessment. The offline answer and the tests assert this.
3. **Education, not advice.** Projections under stated assumptions, no guarantees, no product solicitation; the licensed advisor and the tax professional team review suitability and IRS compliance before anything is implemented. The compliance line is on the deck.
4. **Pages are real.** Every journey step must exist in `JOURNEY_CATALOG` (validated) and every catalog path must be a route in `App.tsx`.
5. **Sizes.** 3–5 core questions, one emergent question, 10–15 steps, first step is orientation, last step is a review page, steps are sorted by `builds` so each page builds on the previous one.

## How a journey is composed (engine)

1. `detectTags(question)` — keyword topics per question (tax, mortgage, equity, debt, student-loans, retirement, income, investments, volatility, iul, insurance, estate, divorce, asset-protection, practice, liquidity, real-estate, oil-gas, strategy, time).
2. `factFinderSignals(assessment)` — weighted topics from the facts (effective tax rate, mortgage size/years, equity, student loans, tax-deferred balances, risk answers, cash months, disability gap, practice ownership, no will, protection priorities, retirement horizon, stated worries).
3. `distillQuestions(questions, signals)` — group by primary topic → 3–5 core questions using per-topic templates; if the client asked fewer topics, the strongest signals supply the rest ("from your assessment: …").
4. `emergentQuestion(distilled, signals)` — strongest signal **not covered** by what they asked, rendered with a per-topic template that quotes the reason (e.g. "you would sell in a 30% drop").
5. `buildJourney` — score every catalog page (question tags ×3, emergent ×3, signal weights), always open with The Mirror + Wealth Genome, take the two best pages per core question, two for the emergent question, guarantee a calculator, a comparison, a volatility/variables page, protection/legacy pages when signals say so, fill to 10, close with Russell Number, then order by `builds`. Each step's `why` names the previous page it builds on and which question it serves.
6. When AI providers are configured, `librarian.journey` asks the lead model to **reword** the questions, the emergent question, and each step's `why` in the client's own terms; the result is validated and discarded if it changes ids, order, or sizes.

## Extending it

- **Add a page to journeys:** append to `JOURNEY_CATALOG` (id, path that exists in `App.tsx`, title, purpose, kind, tags, builds). The tests check uniqueness and `/portal/` paths.
- **Add a topic:** add a keyword regex in `TOPIC_KEYWORDS`, a template in `CORE_TEMPLATES`, aliases in `TAG_ALIASES`, optionally an `EMERGENT_TEMPLATES` entry and a signal in `factFinderSignals`.
- **Add an assessment field:** append to the section in `FACT_FINDER_SECTIONS`; mark `required` only if the advisor genuinely cannot advise without it (required fields gate the advisor). The UI, storage, summary, document, and completeness all follow automatically.
- **Voice:** set `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` on the host; the deck then speaks in the cloned voice. Without them it uses the browser's voice.

## Tests

`server/journeyEngine.test.ts` (engine + assessment), `server/librarian.test.ts`
(gate, offline answer, fan-out, journey persistence, invalid AI polish
rejected). Run: `npx vitest run server/journeyEngine.test.ts server/librarian.test.ts`.
