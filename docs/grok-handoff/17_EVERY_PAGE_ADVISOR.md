# 17 — The every-page advisor: one blue microphone, six ways to answer

`client/src/components/VoiceAdvisor.tsx` · `shared/advisorModes.ts` ·
`server/ultraAI.ts` (`ultra.ask`, `ultra.emailAnswer`, `ultra.providers`) ·
`server/answerPdf.ts` · `server/advisorModes.test.ts`

A blue microphone button is fixed to the bottom-right of **every** page —
public and portal — and stays in reach no matter how far the visitor
scrolls (above the phone's sticky call-to-action bar on small screens).
Speech is transcribed in the browser; only the text of the question and the
saved profile go to the advisor, with the current page path.

## The six modes (`shared/advisorModes.ts`)
1. **Direct answer** — the surface answer, nothing else (≤140 words).
2. **Deeper understanding** — mechanism, moving parts, the numbers that drive it, trade-offs, when it stops being true.
3. **Integrated** — how it fits inside the larger picture: income, taxes, debt, protection, investing, retirement income, estate, legacy; what it touches, what it depends on, the order the pieces move.
4. **What's in it for you** — its place in the whole system, told through a well-known system with many moving pieces (the NFL by default: quarterback, offensive line, coaches, front office, fans, stadium, merchandise, television, the little league that teaches teamwork over ego); what the person gains and what the plan loses without it.
5. **Legal, with citations** — statutes, regulations, rulings, publications and cases with citations and reference sources; cites only what it is confident exists and says when it is not; closes with "education, not legal advice".
6. **All of the above** — the five answers, each under its own heading, as succinctly as possible, and the offer of a PDF.

Each mode is one lead-model call with the shared `ADVISOR_SYSTEM` prompt plus the mode's instruction and word budget; "All" runs the five in parallel. Choosing a chip after an answer re-asks the same question in the new mode.

## The PDF by email (`ultra.emailAnswer`)
After any answer the person can ask for the whole answering process by email. The card asks permission, has them type the address twice, and requires the consent box. The server refuses a mismatch, refuses when mail is not configured (`RESEND_API_KEY` or `SMTP_*`), otherwise builds the PDF (`server/answerPdf.ts`: question, page, date, the five sections, the disclaimer) and sends it as an attachment through the normal transactional mail path. When the asker is signed in the consent is sealed on the ledger (`advisor.emailAnswer`).

## Without keys
No AI key: every mode answers with the configuration notice. No mail: the send button is disabled with the reason. Voice out needs `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` as before.

## Tested
`server/advisorModes.test.ts`: the six modes and their prompt guarantees (NFL frame, citation honesty, headings for "all"); the PDF renders the question and every section into a real PDF.
