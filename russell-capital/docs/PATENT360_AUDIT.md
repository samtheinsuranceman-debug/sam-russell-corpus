# Patent360 — Page Audit and Upgrade Plan

Scanned 18 Sep 2026 against `sam-russell-corpus@master`. 23 client pages, a FastAPI
service with 18 routes, an MCP connector, and two real upstream integrations.

## First, a correction

Patent360 is not stupid. It has two things most competitors in this space do not:

- **Live OED roster verification** (`roster.py`) — checks whether someone is *currently*
  entitled to practise before the USPTO. Absence from the roster is itself the answer, so
  suspended and excluded practitioners fail the check. That is a real credential gate.
- **Real Patent Center integration** (`uspto.py`) — application status, transactions,
  continuity, documents.

What it lacks is not quality. It is **depth per page**. Twenty-three pages averaging 160
lines means most are a table and a heading. The skeleton is sound; the muscle is missing.

---

## Scores

Scored on: does a firm *need* this page, or merely tolerate it? A 10 means a partner
notices within a day if it goes down.

| Page | Now | Why | Ceiling |
|---|---|---|---|
| `PriorArt.tsx` | 4 | Search UI with no corpus behind it. Prior art is the single highest-value thing a patent firm does. | **10** |
| `OfficeActionDetail.tsx` | 5 | Displays an OA. Does not tell you what to *do* about it. | **10** |
| `Drafting.tsx` | 5 | Largest page, but drafting without claim-scope analysis is a text editor. | **9** |
| `Target.tsx` / `Targets.tsx` | 4 | Target tracking with no competitive intelligence attached. | **9** |
| `Filings.tsx` | 6 | Real Patent Center data. Needs deadline computation and fee forecasting. | **9** |
| `Deadlines.tsx` | 3 | 77 lines. Deadlines are malpractice exposure — this is the page that must never be wrong. | **10** |
| `Clients.tsx` | 6 | Solid CRM shape. | 8 |
| `ClientReport.tsx` | 5 | Report with no portfolio valuation or risk scoring. | 9 |
| `Variants.tsx` | 4 | Claim variants with no §101/§103 scoring. | 9 |
| `Boardroom.tsx` | 3 | 81 lines. This is where the council belongs. | **10** |
| `Dashboard.tsx` | 4 | 90 lines of tiles. | 8 |
| `Datasets.tsx` | 2 | 55 lines. Should be the data provenance page. | 7 |
| `Options.tsx` | 6 | Substantial. | 7 |
| `Intake.tsx` | 5 | Should feed the council directly. | 8 |
| `Matters.tsx` / `Reports.tsx` / `Team.tsx` / `How.tsx` | 3–4 | Thin. | 7 |
| `Login.tsx` | 8 | Genuinely good — OED-gated. | 9 |
| `Placeholder.tsx` | — | Delete. | — |

**Current weighted average: 4.4 / 10.**

---

## The one feature that makes this indispensable

**Examiner analytics.** Every patent attorney wants to know, before they respond:

- What is this examiner's allowance rate?
- How many office actions do they typically issue before allowance?
- Does an interview change their behaviour, and by how much?
- What is the art unit's average, and is this examiner above or below it?

Juristat and PatentBots charge firms thousands a month for exactly this. **The underlying
data is public** — it is derivable from USPTO PEDS and the Office Action Text Retrieval
dataset, both free and bulk-downloadable.

Patent360 already talks to Patent Center. Adding examiner analytics is the difference
between a docketing tool and a tool a partner opens before every response. **This is the
build that makes the site unlosable.**

---

## APIs to add, ranked by what they unlock

| API | Cost | Unlocks | Priority |
|---|---|---|---|
| **PatentsView** (`api.patentsview.org`) | Free, USPTO-funded | Full-text search, citations, assignees, inventors, CPC. Turns `PriorArt.tsx` from 4 to 10. | **1** |
| **USPTO PEDS bulk** | Free | Examiner allowance rates, OA counts, art-unit baselines. The killer feature. | **1** |
| **USPTO Office Action Text Retrieval** | Free | Rejection-type frequency by examiner — which §102/§103/§101 arguments actually work on *this* examiner. | **2** |
| **EPO OPS** | Free tier, registration | Worldwide families, INPADOC legal status. Essential for any client filing abroad. | **2** |
| **PTAB API** | Free | Appeal and IPR outcomes. Tells you whether appealing this examiner is worth it. | **3** |
| **USPTO Assignment API** | Free | Ownership chain, security interests. Due-diligence gold. | **3** |
| **Maintenance fee data** | Free | Expiry and lapse tracking across a portfolio. | **4** |
| **Federal Register** | Free | Rule changes, fee schedule updates. | **4** |

Every one of these is free and public. **No paid API is required** to take this platform
past the commercial tools, because the commercial tools are reselling this same public
data with a UI on top.

---

## The council on Patent360

`shared/council/aiCouncil.ts` is built and tested (51 passing). The Examiner member
already declares `Patent360/app/uspto.py` and `roster.py` as its sources.

`Boardroom.tsx` is the page it belongs on — currently 81 lines, and it is the natural
home for a twelve-member panel answering a question about a live matter, with the
Registrar and the Auditor standing on every question.

What the council adds here that a chatbot does not:

- **Sourced findings only.** `UnsourcedFindingError` refuses any claim without a citation.
  For a firm, an assistant that cannot invent a case cite is the whole product.
- **Disagreement surfaced, not averaged.** When the Examiner says the claim is allowable
  over the art and the Registrar says the §101 posture is weak, that split is the
  analysis. Averaging it produces confident mush.
- **Veto.** Compliance and data-integrity objections remove a claim from the answer rather
  than appending a caveat under it.

---

## Health evidence on a patent platform

`shared/health/evidenceRetrieval.ts` retrieves and grades published literature with PMIDs,
study design, sample size, effect and stated limitations, and surfaces contradictions.

It **does not** make medical recommendations, and `assertNotAdvice()` enforces that on the
way out rather than as a review step. The reasoning is in the file header: an LLM
synthesising abstracts into "ask your doctor about drug X" will sometimes be wrong about
an interaction, and the disclaimer relocates blame without preventing harm.

The retrieval half is the more valuable half anyway. A biotech or medical-device client
whose patent turns on a therapeutic claim needs the actual trials — graded, with the
contradicting ones flagged — not a machine's opinion. That is also what a §112 enablement
argument is built from.

---

## Sequence

1. **PatentsView + PEDS ingestion.** Everything else depends on the corpus.
2. **Examiner analytics on `OfficeActionDetail`.** The feature that sells the platform.
3. **`PriorArt` rebuilt on PatentsView** with citation-graph search.
4. **`Deadlines` hardened.** Computed from Patent Center dates, never hand-entered. This
   page carries malpractice exposure and is currently 77 lines.
5. **Council on `Boardroom`.**
6. **Delete `Placeholder.tsx`.**

---

## Honest status

Built and tested this session: the council (12 members, routing, veto, bounded learning,
voice), the NLP language layer, the health evidence engine. **51 tests passing.**

Not built: the API ingestion above, and the page rebuilds. Those are real work and this
document is the plan for them, not a claim that they are done.
