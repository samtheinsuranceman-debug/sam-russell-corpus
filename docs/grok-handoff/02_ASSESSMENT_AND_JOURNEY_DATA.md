# Assessment + journey data — shapes, tables, endpoints, examples (handoff for Grok)

Everything the Financial Librarian stores and exchanges, so another builder can
read, seed, or extend it. Paths relative to `russell-capital-systems/`.

## 1. The Financial Assessment (client fact finder)

**Shape** (`shared/clientFactFinder.ts` → `ClientFactFinder`):

```json
{
  "version": 1,
  "sections": {
    "household":   { "firstName": "…", "lastName": "…", "dateOfBirth": "1981-04-02", "maritalStatus": "Married", "stateOfResidence": "Texas", "dependents": 2, "occupation": "Surgeon", "phone": "…", "email": "…" },
    "income":      { "employmentType": "W-2 employee", "w2Income": 650000, "spouseIncome": 0, "incomeTrajectory": "Rising modestly" },
    "taxes":       { "filingStatus": "Married filing jointly", "adjustedGrossIncome": 640000, "federalTaxPaid": 205000, "priorReturnsAvailable": true, "taxPain": "…" },
    "realEstate":  { "ownsPrimaryHome": true, "primaryHomeValue": 1400000, "primaryMortgageBalance": 900000, "primaryMortgageRate": 6.5, "primaryMortgageYearsRemaining": 26, "homeEquity": 500000 },
    "debts":       { "studentLoanBalance": 180000 },
    "investments": { "taxableBrokerage": 150000, "employerPlanBalance": 700000, "rothIra": 40000, "concentratedPosition": false, "riskTolerance": "Moderate", "worstYearReaction": "Hold and wait" },
    "cash":        { "checking": 20000, "savings": 15000, "emergencyFundMonths": 2 },
    "cashFlow":    { "monthlyTakeHome": 30000, "monthlyFixedExpenses": 18000, "monthlyDiscretionary": 6000, "monthlySavings": 6000, "retirementLifestyle": "…" },
    "insurance":   { "termLifeDeathBenefit": 2000000, "disabilityMonthlyBenefit": 0, "malpracticeLimits": "1M/3M" },
    "practice":    { "ownsPractice": false },
    "estate":      { "hasWill": false, "hasRevocableTrust": false, "heirs": "…", "legacyGoals": "…" },
    "protection":  { "divorceProtectionPriority": "5 — Essential", "creditorProtectionPriority": "4", "taxFreeIncomePriority": "5 — Essential" },
    "retirement":  { "targetRetirementAge": 58, "desiredRetirementIncomeMonthly": 25000, "retirementConcern": "…" },
    "goals":       { "topGoals": "…", "biggestConcern": "…", "timelineToAct": "Immediately" },
    "documents":   { "taxReturns": "Will provide" }
  },
  "lists": { "properties": [ { "type": "Rental", "value": 450000, "mortgageBalance": 300000, "rate": 6.1, "netRentMonthly": 900 } ] }
}
```

- Section ids, field keys, types, options, `required`, and `showIf` all live in `FACT_FINDER_SECTIONS`; the UI is generated from it.
- `factFinderCompleteness(ff)` → `{ percent, answered, required, complete, missing[{section, sectionId, field, key}], sectionPercent }`. **52 required, currently-visible answers** make it complete (more if conditional sections open, e.g. owning a home or a practice).
- `factFinderSummary(ff)` → the plain-text document the librarian is given (and the printable Financial Analysis Document).

**Table** `client_fact_finders` (`drizzle/schema.ts`, `database/rcs-schema.sql`):
`id, userId (unique), data JSON, completeness INT, completedAt, createdAt, updatedAt`.

**Endpoints** (tRPC, signed-in user only; superjson envelope `{ "json": … }`):
- `factFinder.get` → `{ data, completeness, completedAt, updatedAt, persisted }`
- `factFinder.save` `{ data }` → `{ saved, completeness, completedAt }` (zod-validated; strings ≤ 4000 chars; lists ≤ 50 rows)
- `factFinder.summary` → `{ text, complete, percent }`
- `factFinder.reset`

## 2. The librarian

**Endpoints**
- `librarian.status` → `{ complete, percent, missingCount, missingSections[], completedAt, configured, contributorCount, contributors[], voiceConfigured }`
- `librarian.ask` `{ question, history?: [{role:"user"|"librarian", text}] }` →
  gated: `{ gated: true, percent, missingSections, spoken }` · answered: `{ gated: false, answer, spoken, contributors[], contributorCount }`
- `librarian.journey` `{ questions: string[] (1–40) }` → gated as above, or `{ gated: false, journey, journeyId, spoken }`
- `librarian.latestJourney` → the last stored journey for the user, or null
- `ultra.speak` `{ text }` → `{ ok: true, audioBase64, mimeType }` when ElevenLabs is configured

**Journey shape** (`shared/journeyEngine.ts` → `Journey`; stored in `client_journeys.journey`):

```json
{
  "coreQuestions": [
    "How do I pay less tax on the income I already earn — this year and every year after?",
    "What is the fastest sensible way to be free of my mortgage, and what is that interest worth to me?",
    "How do I keep growing while controlling volatility and the variables I can actually control?"
  ],
  "emergentQuestion": "Underneath your questions is a volatility question you haven't asked: with you would sell in a 30% drop, how do you keep the plan from depending on markets you can't control?",
  "steps": [
    { "id": "mirror",          "path": "/portal/the-mirror",          "title": "The Mirror",          "kind": "orientation", "why": "Start here. Your personal dashboard — where you stand today, in one view." },
    { "id": "wealth-genome",   "path": "/portal/wealth-genome",       "title": "Wealth Genome Analysis", "kind": "orientation", "why": "Builds on “The Mirror”. …" },
    { "id": "tax-waterfall",   "path": "/portal/tax-waterfall",       "title": "Tax Waterfall",       "kind": "education",   "why": "Builds on “Wealth Genome Analysis”. … It serves question 1." },
    { "id": "mortgage-killer", "path": "/portal/mortgage-killer",     "title": "Mortgage Killer",     "kind": "calculator",  "why": "… It serves question 2." },
    { "id": "market-stress-test", "path": "/portal/market-stress-test", "title": "Market Stress Test", "kind": "calculator", "why": "… It serves question 3 and the emergent question." },
    { "id": "russell-number",  "path": "/portal/russell-number",      "title": "Russell Number",      "kind": "review",      "why": "Close the loop. …" }
  ],
  "generatedBy": "journey-engine"
}
```
(10–15 steps in practice; the example is abbreviated.) `generatedBy` becomes
`journey-engine + claude` when the AI team polished the wording.

**Table** `client_journeys`: `id, userId, questions JSON, journey JSON, createdAt`.

## 3. The page catalog (`shared/journeyCatalog.ts`)

45 pages. Each: `{ id, path, title, purpose, kind, tags[], builds }`.
`kind` ∈ orientation · education · calculator · comparison · protection · legacy · review.
`builds` 0–9 orders a journey (0 = orientation, 8–9 = review/closing).
Tags in use: start, tax, roth, tax-free, mortgage, payoff, interest, equity, heloc,
war-chest, liquidity, debt, student-loans, retirement, income, gap, withdrawal,
social-security, investments, volatility, risk, stress, floor, iul, insurance,
disability, malpractice, gaps, estate, trust, legacy, heirs, beneficiaries, divorce,
asset-protection, creditor, practice, business, succession, real-estate, oil-gas,
strategy, combination, comparison, decision, variables, control, time, review …

## 4. Seeding for tests or demos

`server/journeyEngine.test.ts` exports `completeFactFinder(overrides)` which fills
every required, visible field with a placeholder and applies overrides — use it
to build a complete assessment in tests. For a running server, sign in as the
owner, POST `factFinder.save` with a complete document, then call `librarian.status`
to confirm `complete: true`.

## 5. Notes on the database drivers

MySQL 8 returns JSON columns parsed; MariaDB returns them as text. All readers go
through `server/_core/jsonColumn.ts` so both behave the same. Keep using it for any
new JSON column.
