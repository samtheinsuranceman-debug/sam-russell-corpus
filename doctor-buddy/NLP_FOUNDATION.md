# The NLP foundation — Doctor Buddy 2.2

Everything under `shared/nlp/` is pure (no I/O), runs in the browser and on the server, and is tested in `test/nlp.test.ts`, `test/signals.test.ts` and `test/genomeBridge.test.ts`. Nothing in it diagnoses, assesses or treats; in the public wellness edition it is a reflection and education layer, and every prompt block says so to the model.

## Sources, and where their text lives

| Source | Used for | Text |
|---|---|---|
| Hall & Belnap, *The Sourcebook of Magic* (1999) | the 77 patterns, `patterns.ts` | `books/text/Sourcebook_of_Magic_Hall_Belnap.ocr.txt` in the corpus (OCR of the owner's scanned PDF, 173 sheets, two pages per sheet) |
| Bandler & Grinder, *The Structure of Magic* I and II | the Meta-Model, `metaModel.ts`; representational systems, `repSystems.ts` | `books/text/Structure_of_Magic_I.txt`, `…_II.txt` |
| Hall, *The Spirit of NLP* | meta-programs (ch. 10, the Sorting Grid), languaging | `books/text/Spirit_of_NLP_Hall.txt` |
| Hall & Bodenhamer, *Figuring Out People* | the 51 meta-programs, `metaPrograms.ts` | catalogued from the Spirit of NLP grid and the Sourcebook's #51–#53 |
| Dilts, *Sleight of Mouth* | the 14 verbal reframes, `patterns.ts` (`SLEIGHT_OF_MOUTH`) | `books/text/Sleight_of_Mouth_Dilts.ocr.txt` |

The Sourcebook PDF in `books/` is image-only; it was read with PyMuPDF + RapidOCR in this session and the text saved beside it, so the next session does not need to OCR it again. Two patterns share a title in the book (#40 and #74); the later one has slug `…-74`.

## Modules

- `repSystems.ts` — sensory-predicate lexicon (visual, auditory, kinesthetic, auditory-digital, olfactory/gustatory), `readRepSystem`, `readRepSystemOverTurns` (recency-weighted), `translate` / `restate` (idiom swaps between systems), `languagingGuide`, `mirrorOpener`, `repSystemPromptBlock`.
- `metaModel.ts` — 16 distinctions (the classic twelve plus Hall's identification, either/or, absolute adverbs) with detectors and recovery questions; `metaModel(text)`, `loadBearing`, `metaModelPromptBlock`. Denominalization table for 60+ frozen nouns.
- `metaPrograms.ts` — 51 meta-programs in five groups, each with poles, an elicitation question, a pacing line per pole, and language cues where the pole shows in speech; `readMetaPrograms`, `salientMetaPrograms`, `metaProgramsPromptBlock`. Readings carry a confidence and the words they rest on; the basis string says it is a conversational structure, not a validated instrument.
- `patterns.ts` — the 77 patterns with concept, condensed steps, cues, `needsGuide`, `publicSafe`, caution and an invitation in the companion's voice; `suggestPatterns` ranks them against text, Meta-Model findings and meta-program poles. #65 (allergy) and #68 (eating) are never suggested. In the public edition only `publicSafe && !needsGuide` patterns are offerable; the rest are named as things to explore with a licensed professional.
- `companion.ts` — the whisperer for the person. Reads language, state (valence, arousal, rumination loops, away-from spirals) and consented body/tone signals, and decides whether, when and how to speak: never over a sentence (1.5 s pause, or a 90 s monologue with a loop), permission before a steering question, a pattern interrupt only for a loop and always followed by an outcome question, a cooldown of 60 s, a 3-minute hold after a no, and safety above everything (any C-SSRS level ends the NLP work and switches to plain safety language and 988/911).
- `signals.ts` — `toneFromEnergy` (microphone RMS → tone/energy signal, browser only) and `parseVisionReply` / `signalsFromVision` (camera frame description → body/attention signals).
- `genomeBridge.ts` — meta-program readings → Wealth Genome durability signals (`shared/engines/wealthGenomeDurability.ts`, ported from the corpus branch), marked `inferred`, the engine's weakest evidence kind.

## Where it is wired

- **AI chat** (`server/drBuddy.ts`, `languagingContext`): every reply's system prompt carries the person's representational system, the Meta-Model shape of the message with one recovery question, the meta-programs that show, and at most one offerable pattern. The model is told to speak in the person's system, reflect first, ask one question at most, and never name a technique. The chat response includes a small `languaging` summary.
- **Companion** (`/companion`, `client/src/pages/Companion.tsx`, `server/companion.ts`): speech recognition and speech synthesis in the browser, the engine running locally every 750 ms, and a server turn (`companion.turn`) that re-runs the engine with the recorded consents and may rephrase the line (bounded, shape-checked, never for safety lines). `companion.readFrame` reads one small JPEG every 20 s with video consent through the configured AI processor (vision-capable model; `BUILT_IN_FORGE_MODEL`).
- **Consent** (`hipaa_consents.agreedToAudioAnalysis`, `agreedToVideoAnalysis`, migration `0013`): two optional, separate checkboxes in the consumer-health notice (consent version 4.1, so every earlier acknowledgement is re-presented), a `consent.setRecording` procedure to change them later, and a section in the Consumer Health Data Privacy Policy. Audio is analysed in the browser only; a camera frame is sent and not stored; only short text descriptions are kept for the session.
- **Finance**: the durability card (`DurabilityCard.tsx`) on the Companion page and the finance hub, from the salient meta-program readings kept on the device (never the transcript).

## Boundaries the code enforces

- Public edition wording never uses "diagnose", "assess", "patient" or "clinical" toward the person; the phrasing pass rejects a model line that does.
- The companion's decision is made in code and tested; the model only rephrases inside the decision.
- Signals are only accepted with the matching consent on record, server-side, on every turn.
- The Wealth Genome reading is never a reason to withhold any option (the engine's own rule, repeated on the card).
