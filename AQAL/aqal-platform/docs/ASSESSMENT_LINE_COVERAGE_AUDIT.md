# Assessment Line-Coverage Audit & Rebuilt 25 Questions

_Goal: make the 25 elicitation questions surface **all 32 lines**, stay conversational/fun,
and stop over-sampling the same handful of lines. Analysis computed directly from
`client/src/pages/Assessment.tsx` (question `axes` tags) against the 32 scored lines in
`shared/axisModes.ts` (`ALL_AXES`)._

---

## Part A — The audit

### The core problem: format over-samples 3 lines regardless of intent
Every one of the 25 is an **open-ended autobiographical story** prompt. So no matter what a
question is *tagged* to measure, the format itself forces three lines to fire on almost every
answer:

- **Linguistic** — the whole thing is "tell us a story," so narration/word-range is elicited 25/25.
- **Intrapersonal / Meta-Cognitive** — "what did that tell you about who you are" is asked constantly.
- **Empathic / Interpersonal** — most prompts are people-and-relationship stories.

This is the "we elicit Linguistic over and over" effect. It is structural, not just a tagging quirk.

### Tagged coverage: 22 of 32 lines, badly skewed
| Rank | Line | Times targeted (Q1–25) |
|---|---|---|
| 1 | Meta-Cognitive | 6 |
| 1 | Naturalistic | 6 |
| 3 | Interpersonal | 5 |
| 3 | Empathic | 5 |
| 3 | Kinesthetic | 5 |
| 3 | Resilient | 5 |
| — | Volitional, Strategic, Tactical, Adaptive, Systematic | 4 each |
| — | Philosophical | 3 |
| — | Intrapersonal, Reflective, Spatial, Existential, Intuitive | 2 each |
| — | Linguistic, Logical, Mathematical, Integrative, Musical | 1 each |

### Never elicited — 0 questions target these 10 lines
> **Financial-Self-Management · Humor · Seduction · Parenting · Community-Founding ·
> Adversarial · Interoceptive · Aesthetic · Influence · Architectural**

The entire **developmental / relational cluster** (Financial, Humor, Seduction, Parenting,
Community) — the most *distinctive, least g-loaded* lines in the system — gets **zero** dedicated
elicitation. Plus Adversarial (head-to-head competition), Interoceptive (body-sense), Aesthetic
(eye/ear for form), Influence (persuasion), Architectural (structure-building).

### The tags are also misaligned with the question content
Several questions are tagged to lines their text doesn't elicit, while quietly eliciting lines
they're never credited for:
- **Q4 "The Negotiation"** — clearly Influence / Interpersonal, tagged *Volitional, Kinesthetic, Naturalistic*.
- **Q5 "The Bet"** — clearly Financial, tagged *Logical, Mathematical, Spatial*.
- **Q7 "The Worst Date"** — clearly Empathic/Seduction, tagged *Kinesthetic, Naturalistic*.
- **Q3 "The Flex"** (a hidden skill) — could be *any* line, tagged Intrapersonal/Reflective.

Net effect: the tag table **overstates** coverage of Naturalistic/Kinesthetic and **hides** real
Financial/Seduction/Influence signal that the questions already produce but never score.

---

## Part B — Per-question read + one enhancement each
_"Genuinely elicits" = what the text actually pulls, independent of the tag. "Add" = a small
probe that annexes an uncovered line without killing the fun._

| Q | Title | Genuinely elicits | Enhancement to add an uncovered line |
|---|---|---|---|
| 1 | The Night That Flipped | Adaptive, Resilient, Humor(!) | "What was the exact line or move that flipped the mood?" → **Humor** |
| 2 | The Natural | Linguistic, Influence, Social-read | "What did you *say* to read what they wanted?" → credit **Influence** |
| 3 | The Flex | (unconstrained) | Force a domain: "is it physical, technical, or artistic?" → **Kinesthetic/Mechanical/Aesthetic** |
| 4 | The Negotiation | Influence, Interpersonal | "What did you notice about *them* that gave you the opening?" → **Social-Perceptual/Influence** |
| 5 | The Bet | Financial, Strategic | "What did the numbers say, and where did you override them?" → **Financial + Mathematical** |
| 6 | The Read | Intuitive, Strategic, Systemic | "What sparse signal tipped you off?" → **Intuitive/Naturalistic (systems)** |
| 7 | The Worst Date | Empathic, Humor | "What made it funny in hindsight?" → **Humor**; "what drew you / repelled you?" → **Seduction** |
| 8 | The Masterpiece | Creative, Architectural | "How did you hold the whole structure in your head?" → **Architectural/Spatial** |
| 9 | The Rule You Broke | Meta-Cog, Moral, Adversarial | "Who did it put you against, and how'd you handle them?" → **Adversarial** |
| 10 | The Gamble | Volitional, Adaptive, Financial | "What was actually at stake financially?" → **Financial** |
| 11 | The Robbery | Resilient, Adversarial | "How'd you play the game differently after?" → **Adversarial/Tactical** |
| 12 | The Tense Table | Empathic, Intuitive, Community | "How did you turn a fractious group into a functioning one?" → **Community-Founding** |
| 13 | The Wedding Chaos | Tactical, Adaptive | "Who did you have to charm or manage?" → **Influence/Seduction** |
| 14 | The Reinvention | Adaptive, Volitional, Existential | "What did the *old* you feel in your body when it was time?" → **Interoceptive** |
| 15 | The Moment You Knew | Intrapersonal, Intuitive | "Where did you feel it — head or body?" → **Interoceptive** |
| 16 | The Stranger | Empathic, Social | "What did you *sense* before they said a word?" → **Interoceptive/Intuitive** |
| 17 | Everything on Fire | Tactical, Resilient | "What did you calculate vs. feel your way through?" → **Logical vs Interoceptive** |
| 18 | The Save | Empathic, Parenting | "What did you understand about what they needed to grow?" → **Parenting** |
| 19 | The Inheritance | Integrative, Systematic | "What across totally different worlds did you connect?" → **Integrative** (sharpen) |
| 20 | The First Kiss | Intrapersonal, Seduction | "What was the pull — what were you *doing* that drew them?" → **Seduction** |
| 21 | The Ethical Line | Moral, Adversarial | "Who did you have to face down?" → **Adversarial** |
| 22 | The Betrayal | Resilient, Adversarial | "Did you get even, and how strategically?" → **Adversarial/Strategic** |
| 23 | The World Got Smaller | Reflective, Existential | "Did it make you more curious or more cynical?" → **Philosophical** (good already) |
| 24 | The Threshold | Existential, Parenting | "What shifted in your body the instant it was real?" → **Interoceptive/Parenting** |
| 25 | The Rabbit Hole | Meta-Cog, Curiosity | "What's the beauty in it that others don't see?" → **Aesthetic** |

**Pattern:** the fix is almost always a single added clause that forces a *specific* line —
a body-sense probe (Interoceptive), a "who was your opponent" probe (Adversarial), a "what drew
them" probe (Seduction), a "what were the numbers" probe (Financial), a "what made it land" probe
(Aesthetic/Humor).

---

## Part C — The rebuilt 25 (fun voice kept, all 32 lines covered)
Each keeps the vivid, story-first tone but is **engineered around a distinct primary line**, with
a built-in probe so it can't collapse back into a generic Linguistic/Intrapersonal answer.
Primary line in **bold**; secondaries in ( ).

1. **The Money Move That Everyone Fought You On** — *(Financial-Self-Management)* (Strategic, Adversarial)
   > Best money or career call you made when *everyone* said don't — parents, partner, friends. What did the numbers actually say, where did you override your gut with math or your math with your gut, and when it paid off… did you rub it in or play it cool?

2. **The Room You Turned** — **(Influence)** (Interpersonal, Social-Perceptual)
   > A time you moved a room — talked your way in, out, or around. Walk us through the *exact* words. What did you catch about the other person — a tell, a need, a crack — that handed you the opening?

3. **The Thing You Built From a Blueprint in Your Head** — **(Architectural)** (Systematic, Spatial)
   > Something with a lot of moving parts that exists because you built it — a business, a system, an event, a machine, a plan. How did you hold the *whole structure* in your head at once? What did you set up early that only paid off way later?

4. **Head-to-Head** — **(Adversarial)** (Tactical, Strategic)
   > A time you went up against a real opponent who was *trying to beat you* — a game, a court, a deal, a rival — and out-maneuvered them. What was your read on *them*? What was the move they never saw coming?

5. **When Your Body Knew First** — **(Interoceptive)** (Intuitive, Kinesthetic)
   > A moment your body knew before your brain caught up — a gut drop, hair standing up, a skill running on autopilot, sensing something was *off* before you had proof. How tuned-in are you to what your body is telling you — and when have you ignored it and paid for it?

6. **The Perfect Line at the Worst Moment** — **(Humor)** (Social-Perceptual, Timing)
   > A time you cracked *exactly* the right joke when the room was tense, awkward, or falling apart — and flipped the whole mood. Or the running bit only your people understand. How do you know the split-second something will land?

7. **The Draw** — **(Seduction)** (Empathic, Influence)
   > A time someone was completely drawn to you — and it had nothing to do with looks. Your presence, your attention, the way you made them feel like the only person in the room. What were you *actually doing*? What's your pull when you turn it on?

8. **The 'We' You Made** — **(Community-Founding)** (Interpersonal, Leadership)
   > A group, scene, team, tradition, or crew that exists because *you* pulled people together and kept them coming back. How did you turn strangers into a "we"? What happens to it when you step away?

9. **Growing a Person** — **(Parenting)** (Empathic, Existential)
   > Teaching a kid — yours, a sibling, a mentee — something that *stuck*, where you had to meet them exactly where they were, not where you wished they'd be. What did you understand about how *that specific person* would grow? Have you caught yourself passing down the very thing that was passed to you?

10. **The Thing Whose Beauty Stopped You Cold** — **(Aesthetic)** (Musical, Reflective)
    > Something so well-made it stopped you — a song, a building, a sentence, a play, a perfect meal — and you could say *exactly why it worked* when everyone else just felt it. What's your eye or ear for? What does "good" look like to you that others miss?

11. **The Call Nobody Else Made** — **(Intuitive)** (Pattern-Recognition, Strategic)
    > You saw it coming when nobody else did — a person about to snap, a deal about to break, a shift before it hit. What sparse, early signal tipped you off that everyone else walked right past?

12. **The Numbers Game You Won** — **(Mathematical)** (Logical, Financial)
    > A time you used numbers or cold logic to *win* — spotted the flaw in the argument, ran the odds, found the pattern in the data others missed. Walk us through the actual reasoning, step by step.

13. **The Fix Only You Could Make** — **(Kinesthetic / Mechanical)** (Spatial)
    > You fixed, built, or rigged something *physical* with your hands when everyone else would've called someone — a car, a house, a gadget, a hack. How did you just *know* how it worked? Where does that come from?

14. **Reading the Living World** — **(Naturalistic)** (Interoceptive)
    > You and the natural world — animals, plants, weather, a body of water, a garden, the outdoors — reading a living system others couldn't. What do you notice that people walk right past? When did that reading save the day (or the crop, or the dog)?

15. **The Song That Rewired You** — **(Musical)** (Aesthetic, Emotional)
    > A piece of music that hits you somewhere words can't reach. What is it about the *sound itself* — the rhythm, the build, the space — that gets you? Do you make music, or feel it? Walk us into what happens in your body when it plays.

16. **The Grind Nobody Saw** — **(Volitional)** (Resilient)
    > Something you finished that 99% of people would have quit — pure will, motivation long gone, no one watching. What kept you moving when it stopped being fun and started being just… work?

17. **Everything On Fire at Once** — **(Tactical)** (Adaptive, Resilient)
    > A time multiple crises stacked up simultaneously — not one problem, three or four at once. How did you triage? What did you handle first, what did you let burn on purpose, and what did you calculate vs. just feel your way through?

18. **The Long Game** — **(Strategic)** (Systematic, Volitional)
    > A goal that took *years* and a dozen moving parts. How did you sequence it? What did you quietly set in motion early — a relationship, a skill, a position — that everyone only understood the point of much later?

19. **The Dots Only You Connected** — **(Integrative)** (Systematic, Creative)
    > A time you took an idea from *one* world and used it to crack a problem in a completely different one — art into business, sport into parenting, a hobby into a career. How do the pieces fit together in your head that they don't for other people?

20. **The Reinvention** — **(Adaptive)** (Volitional, Existential)
    > A time you burned the old version of yourself down and built a new one — new city, career, circle, identity. What triggered it? What did your *body* tell you when it was time to go? And be honest — was the old you actually that bad, or did you just outgrow them?

21. **The Line You Held** — **(Moral → Reflective/Integrative)** (Volitional, Adversarial)
    > Someone with power over you told you to do something that felt wrong in your gut — cut a corner, throw someone under the bus, win at someone else's expense. Did you hold the line or go along with it? Who did you have to face down, and what did it cost you?

22. **Know Thyself** — **(Intrapersonal)** (Meta-Cognitive, Reflective)
    > The moment you understood something about yourself that changed how you operate — a pattern you kept repeating, a real motive under a fake one. How did you catch it? And have you actually changed it, or just gotten better at spotting it mid-move?

23. **The Person You Showed Up For** — **(Empathic)** (Interpersonal, Parenting)
    > Someone you love was in deep trouble and *you* were the one who showed up. Not what you said — what you actually *did*. How did you know what they needed before they could ask? Do they even fully know what you did for them?

24. **The Threshold** — **(Existential)** (Interoceptive, Parenting)
    > The moment you first held your child — or first became completely responsible for another life with no handing it back. What did your body feel in that instant? What did you understand about time, risk, and meaning that you simply couldn't have understood five minutes before?

25. **The Crack in the Story** — **(Reflective / Philosophical)** (Existential, Resilient)
    > The moment you first realized something you deeply believed wasn't true — the Santa Claus moment, the magic cracking. Did you figure it out or did someone tell you? And the real question: did it make you more *cynical* or more *curious* — did you close down or open up?

### Coverage check — all 32 lines hit at least once
| Line | Covered by | Line | Covered by |
|---|---|---|---|
| Logical | 12, 17 | Systematic | 3, 18, 19 |
| Mathematical | 1, 12 | Architectural | 3 |
| Spatial | 3, 13 | Adversarial | 4, 21 |
| Linguistic | all (format) | Interoceptive | 5, 14, 15, 20, 24 |
| Volitional | 16, 18, 20, 21 | Aesthetic | 10, 15 |
| Meta-Cognitive | 22 | Influence | 2, 7 |
| Intrapersonal | 22 | Humor | 6 |
| Reflective | 22, 25 | Parenting | 9, 23, 24 |
| Existential | 20, 24, 25 | Seduction | 7 |
| Philosophical | 25 | Community-Founding | 8 |
| Integrative | 19 | Financial-Self-Management | 1, 12 |
| Interpersonal | 2, 7, 8, 23 | Intuitive | 5, 11 |
| Empathic | 7, 23 | Musical | 15 |
| Kinesthetic | 5, 13 | Naturalistic | 6, 11, 14 |
| Strategic | 1, 4, 18 | Adaptive | 17, 20 |
| Tactical | 4, 17 | Resilient | 16, 17, 25 |

**Result: 32 / 32 lines elicited**, with the 10 formerly-blind lines (Financial, Humor,
Seduction, Parenting, Community, Adversarial, Interoceptive, Aesthetic, Influence, Architectural)
each now anchored to a dedicated question — while the story-first, fun tone is preserved.

### Note for the build
When these are wired into `Assessment.tsx`, **re-tag each question's `axes[]` to match its real
targets** (the current tags are misaligned — see Part A). That single fix also makes the
downstream scoring in `server/coaching.ts` and the radar in `Results.tsx` honest about which
lines a given answer actually informed.
