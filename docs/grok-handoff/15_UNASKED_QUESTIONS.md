# 15 — The Questions You Haven't Asked

`shared/unaskedQuestions.ts` · `server/unaskedRouter.ts` · the card at the top
of `/portal/ai-advisor` (`client/src/pages/portal/AIFinancialAdvisor.tsx`) ·
`server/unasked.test.ts`

The librarian — one voice for the whole AI team — reads everything the
client has disclosed and finds the questions that matter more than any
they have asked: the ones they would think of in fifteen years, brought
forward now. Consent first, at every step, and every step on the ledger.

## The flow
1. **Propose.** "I have found N questions you have not asked that matter
   more to your plan than any you have asked so far. May I show you them?"
   The client chooses how many — three to five, five to seven, or five to
   ten (never more than ten) — and says yes or not now. Nothing is shown
   before yes. Either answer is sealed as a `consent` event
   (`unasked.propose`) with the question ids and a hash of the profile.
2. **Reveal.** The questions, each in the client's words with why it
   matters from their own facts, the rough dollar scale from their own
   figures, when they would otherwise meet it, and the page that works it
   through. Then: "May I answer them from everything I know about you? And
   is there anything else you want me to know first?"
3. **Disclose.** Whatever the client adds is appended, dated, to the
   assessment's notes (`documents.notes`) through the normal save path, so
   the profile grows and every engine reads it; sealed as a `fact` event.
4. **Answer.** With permission (sealed as `unasked.answer`), each question
   is answered from the profile and the engines' context (the 20-year CPI
   rate, the odds of higher rates at 30 years) — through the lead model
   where an AI key is configured, deterministically otherwise — and each
   answer is sealed as signed advice with the facts it used.

**Cadence.** `shouldOffer()`: offer on the first visit; again after 30
days; sooner when the profile hash changes or a stronger question enters
the top three. The card is silent otherwise.

## The candidates (`candidateQuestions()`)
Deterministic rules over the assessment, each scaled from the client's own
figures, never invented; where a figure is missing the question names the
field it needs. Ranked by scale, then by how soon it bites. As of this
pass: the real hurdle rate after inflation and tax; the expected tax path
and what deferral really keeps; the cheapest Roth conversion years; the
student debt as an asset; idle home equity; the cash balance plan the
practice never opened; disability and the plan's survival; the estate
exemption while it is $15 million; who can act if the client cannot; the
four ways not to pay the gain on the practice sale; cash drag; and the one
number and date that would make the client's own first goal "done".

## Tested
`server/unasked.test.ts` (4): the candidates a rich profile raises with
their scales and ranking, a thin profile raising only what it can support
and naming what it needs, the count options and the two scripts, and the
cadence gate in each of its cases.

## Not done
The librarian's spoken voice (ElevenLabs) reads the scripts when the key is
set, as it does for the tape recorder; the candidate set grows as engines
are added — each new engine should contribute its question here.
