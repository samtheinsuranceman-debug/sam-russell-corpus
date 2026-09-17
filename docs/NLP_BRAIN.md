# The NLP Brain — how Russell Capital Systems talks

## What it is

`shared/nlpBrain.ts` is the grammar of the system's voice. It is not a feature,
a mode, or a page. Every AI surface on the site speaks through it, and the
client never sees it and never needs to. They only notice that the machine
happens to explain things the way they think.

`shared/compositeMind.ts` holds twelve channels, each owning a slice of the
brain. The client hears one calm voice; behind it, twelve readings of the same
person. They are **working memory, not personalities** — rebuilt from the brain
on every turn, never named to the client, never presented as "our team of AI".

## Provenance

Nothing in the brain is typed from memory. Each block names the file in this
corpus it was lifted from:

| Content | Source |
|---|---|
| The 51 meta-programs, with the authors' own elicitation questions (pp. 216–219) | `nlp-knowledge/meta_programs/NLP_META_PROGRAMS_REFERENCE.md` |
| Languaging and re-languaging patterns (#47–#50), meta-programs and cognitive distortions (#51–#54) | `nlp-knowledge/sourcebook_of_magic/SOURCEBOOK_OF_MAGIC_COMPLETE_REFERENCE.md` |
| The ten application domains and the technique→domain map | `coaching_system/references/nlp_domains.md` |
| The seven-phase arc and the failure mode at each phase | `coaching_system/references/emotional_arc.md` |
| Signal categories, weights, thresholds and clusters | `coaching_system/references/buying_signals.md` |
| The six internal coaching roles | `coaching_system/SKILL.md` |
| The named brothers | `brotherhood/MASTER_REGISTRY.md` and the per-agent identity folders |

## What it holds

- **51 meta-programs**, each with its elicitation question, its poles, the text
  markers that reveal which pole is running, and — critically — a `speakTo`
  instruction per pole. A pole the system cannot speak to is dead weight, and a
  test enforces that none exists.
- **Representational systems** — visual, auditory, kinesthetic, auditory
  digital — with predicate lexicons that are tested to be disjoint, because an
  overlapping predicate makes the count meaningless.
- **32 language patterns** across four families: Milton (embedded commands,
  presupposition, choice of agreements, artfully vague, pacing current
  experience, conversational postulates, tag questions, quotes, future pacing),
  Meta model (the full recovery set plus denominalising), reframing (context,
  content, chunk up, chunk down) and pacing (predicate matching, value-word
  echo, backtracking).
- **The seven-phase emotional arc** with a hard sentence cap per phase. Pain is
  capped at three sentences; commitment at two. This single rule is the most
  valuable thing in the file — the firm's own call review found that talking
  past a decision is where decisions come undone.
- **Buying-signal weights and thresholds**, used not to close harder but to
  know when to stop talking.

## The ethical floor

Above every pattern, carried into every composed directive, and tested:

> These patterns exist to make a **true** thing easier to hear, never to make a
> false thing easier to believe.

- Never manufacture urgency, scarcity, or a deadline that does not exist in the
  arithmetic or the law.
- Never presuppose a purchase, a signature, or an agreement the person has not
  given.
- Never invent a figure, a percentage, a citation, a testimonial, or a client
  story to make a pattern land.
- Never use vagueness to obscure a fee, a risk, a limitation, or a conflict of
  interest — be vague about meaning, never about fact.
- If the honest answer is that this does not fit them, say so, and pace and
  match **that** answer just as carefully.
- Everything said is education and projection under stated assumptions, never a
  guarantee, and a licensed professional confirms every specific.

The individually dangerous patterns carry their own guards. The embedded
command may only ever point at an action that serves the client — look,
consider, check, compare — never at a purchase, a signature or a deadline.

## How a reading is made

`composeDirective({ text, priorText })` reads the person from their own words:

1. **Channel** from predicate counts. With fewer than two predicates it says
   so and carries two channels rather than guessing.
2. **Meta-program leans** from markers, returned with the evidence, so any
   reading can be checked against what they actually said. Labelled as a lean,
   not a fact.
3. **Arc phase** from indicators, which sets the length cap on the reply.
4. **Decision signals** scored, which can override everything else with a stop
   order.

With no text it degrades to the standing layer. **The layer is never absent.**

## Where it is wired

Wired — every surface a human reads:

- The Ultra Calculator advisor (`advisorSystemFor`), per question and profile
- The homepage concierge — every provider in the panel gets the *same* reading,
  so the synthesis is twelve channels agreeing rather than averaging
- The Financial Librarian, per question plus recent turns plus the assessment
- The partner concierge, per visitor question
- The Live Co-Pilot, the sales coach, the Goals Accelerator, the slide builders
  and the client-activity summariser, via `CLIENT_FACING_PREAMBLE`

Deliberately **not** wired — the structured extractors:

- Tax return reader, mortgage statement reader, illustration analyst, session
  evaluator, meeting planner

Those prompts must return JSON. Instructions about pacing, predicates and
embedded commands cost tokens there and measurably degrade the parse.
`SYSTEM_PREAMBLE` alone is correct for them, and `server/nlpWiring.test.ts`
enforces both halves against the real source files — it fails if a
conversational surface loses the layer, and it fails if an extractor gains one.

## The twelve channels

| Channel | Role | Standing question |
|---|---|---|
| Buddy | Warmth; the refusal to let anyone feel stupid | Is this person about to feel stupid, and can I prevent it without patronising them? |
| Peter | Sourced vs supposed | Which part of what I am about to say is sourced, and which is my inference? |
| Matthew | Continuity and kept promises | What did we already promise this person, and has it been kept? |
| Luke | The clinical population's ear | Am I speaking to their intelligence or around it? |
| John | The long view and who it lands on | Who is standing at the other end of this decision? |
| Mark | Compression | What can come out of this without losing anything true? |
| DealCloser | Decision state; when to stop | Have they already decided, and am I about to talk them out of it? |
| Chessmaster | Sequence and order of operations | What has to happen first for the rest to still be available? |
| Anchor | State and the arc | Where in the arc are they, and is my reply the right length for that phase? |
| HabitBuilder | The one thing that happens this week | What is the smallest real thing that could move before Friday? |
| Edison | Combination and cancellation | Which two pieces here change each other? |
| BeliefReframer | Limiting frames | Is the obstacle here a fact or a frame? |

Conflict order: the floor above everything; then Peter (do not assert what is
not sourced); then Anchor (do not flood them); then DealCloser (do not talk
past a decision); then the rest.

## The calculators are in the brain

`instrumentBlock()` hands every channel the verified calculator registry, so
the AI can point at a page by its exact path and name the engine behind a
figure — and cannot invent either, because it is only ever given paths the
router actually serves.

## The voice

`shared/voiceIdentity.ts` names the intended voice: **Samuel Andrew Russell V**,
cloned via HeyGen, spoken through ElevenLabs.

`ultra.voiceStatus` asks the provider for the name attached to the configured
id and compares it. A mismatch is reported in plain language rather than
hidden — previously the site spoke with whatever id was in the environment and
nothing anywhere said whose voice it was. The tape-recorder deck shows the
speaker's name while playing, and says explicitly when it has fallen back to
the device's own speech, because passing a synthetic stand-in off as a named
person is the one thing it must never do.

Advisory settings (stability 0.62, similarity 0.85, style 0.15, speaker boost)
are separated from the manifesto settings, which are looser because a speech is
not an answer.

**Owner action required.** `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are
set in Railway → `russell-capital-systems` → service `web` → Variables. They are
not in this repository and must never be. Until they are set, the site uses the
browser's own speech and says so.

## Tests

- `server/nlpBrain.test.ts` — 72 tests. All 51 meta-programs present and
  numbered without gaps; every pole has a `speakTo`; predicates are disjoint;
  the floor survives into every composed directive; the dangerous patterns
  carry guards; the arc caps are what the call review says they are.
- `server/nlpWiring.test.ts` — 19 tests. Every conversational surface carries
  the layer, no extractor does, and the instrument list contains every real
  path and forbids inventing one.
