/**
 * The Sourcebook of Magic — L. Michael Hall & Barbara P. Belnap (Crown House,
 * 1999): 77 NLP patterns in eight chapters, catalogued here with each
 * pattern's purpose, its steps as the book gives them (condensed), the
 * language and state cues that suggest it, and whether it can be run alone
 * or needs someone to guide it. Page numbers are the book's.
 *
 * Also here: Robert Dilts' fourteen Sleight of Mouth patterns (Sleight of
 * Mouth, 1999), which are verbal reframes of a belief of the form "X means Y"
 * or "X causes Y". They are the natural follow-through when the Meta-Model
 * finds a complex equivalence or a cause–effect.
 *
 * How the companion uses this: `suggestPatterns()` ranks the catalog against
 * what the person just said (Meta-Model findings, meta-program readings,
 * state cues). In the public wellness edition only patterns marked
 * `publicSafe` and not `needsGuide` are offered, as reflection exercises the
 * person can try; the rest are named as things worth exploring with a
 * licensed professional. Nothing here diagnoses or treats. Pure, no I/O.
 */

import type { MetaModelFinding, MetaModelPattern } from "./metaModel";
import type { MetaProgramReading } from "./metaPrograms";

export type PatternChapter = "basic" | "parts" | "identity" | "states" | "languaging" | "thinking" | "meanings" | "strategies";

export const CHAPTER_TITLE: Record<PatternChapter, string> = {
  basic: "Basic NLP patterns",
  parts: "Patterns for incongruity: parts",
  identity: "Patterns for identity and self",
  states: "Patterns for emotional states and neuro-linguistic states",
  languaging: "Patterns for languaging and re-languaging",
  thinking: "Patterns for thinking patterns, meta-programs and cognitive distortions",
  meanings: "Patterns for meanings and semantics",
  strategies: "Patterns for strategies",
};

export interface NlpPattern {
  id: number;
  slug: string;
  name: string;
  chapter: PatternChapter;
  page: number;
  /** What it is for, in one or two sentences. */
  concept: string;
  /** The steps, condensed from the book. */
  steps: readonly string[];
  /** Regex sources over the person's words that suggest this pattern. */
  cues: readonly string[];
  /** Meta-Model findings that suggest it. */
  metaModelCues?: readonly MetaModelPattern[];
  /** Meta-program poles (program:pole) that suggest it. */
  metaProgramCues?: readonly string[];
  /** True when the book has a coach run it on the person; false when it can be self-run. */
  needsGuide: boolean;
  /** True when it can be offered in the public wellness edition as a reflection exercise. */
  publicSafe: boolean;
  caution?: string;
  /** How to invite it, in the companion's voice; `{opener}` is replaced with a rep-system opener. */
  invitation: string;
}

const P = (p: Omit<NlpPattern, "slug">): NlpPattern => ({ ...p, slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") });

export const PATTERNS: readonly NlpPattern[] = [
  // ── Chapter 1: Basic ───────────────────────────────────────────────────
  P({ id: 1, name: "Well-Formed Outcomes", chapter: "basic", page: 36, needsGuide: false, publicSafe: true,
    concept: "The meta-pattern: turn a wish or a complaint into a goal formed well enough that the mind can move toward it.",
    steps: ["State it in the positive: what you want, not what you don't.", "State what you can do, within your own control.", "Contextualize: where, when, with whom; and where you don't want it.", "State it in sensory words: what someone would see, hear and feel.", "Chunk it into bite-size steps.", "Load it with the resources you'll need.", "Check ecology: does every part of you agree?", "Specify the evidence: how you'll know you have it."],
    cues: ["i want", "i wish", "my goal", "i need to change", "i don't want", "get better", "i'd like things to", "if only", "what i want is"],
    metaProgramCues: ["direction:awayFrom", "direction:toward"],
    invitation: "{opener} you know what you don't want. May I ask what you'd want instead, and how you'd know you had it?" }),
  P({ id: 2, name: "Pacing or Matching Another's Model of the World", chapter: "basic", page: 39, needsGuide: false, publicSafe: true,
    concept: "Reflect a person's words, values and sensory language back to them so they feel understood before anything else happens.",
    steps: ["Listen for the predicates (see/hear/feel) and value words the person uses.", "Reflect them back in the same system: 'it looks like…', 'it sounds like…', 'it feels like…'.", "Match tempo and, in person, posture and breathing.", "Only after pacing, lead."],
    cues: [], invitation: "{opener} that's where you are right now." }),
  P({ id: 3, name: "Calibration to Someone's State", chapter: "basic", page: 40, needsGuide: false, publicSafe: true,
    concept: "Use sensory awareness to read a person's state from voice, face, posture and breathing, and to notice when it changes.",
    steps: ["Set your own state to open attention.", "Notice breathing, skin tone, voice tempo and pitch, posture, muscle tone.", "Note what is present at a known state so you can recognize it again.", "Check the calibration by asking; never assume."],
    cues: [], invitation: "{opener} something shifted just now, in your voice. What happened?" }),
  P({ id: 4, name: "Checking the Ecology of a Pattern", chapter: "basic", page: 41, needsGuide: false, publicSafe: true,
    concept: "Before any change, ask whether the whole system (self, relationships, life) can live with it; objections found now are cheaper than later.",
    steps: ["Name the change you're considering.", "Ask: does any part of me object?", "Ask: what would this cost, and whom?", "Ask: what does the current behaviour do for me that I'd lose?", "Adjust the change until every objection is answered."],
    cues: ["part of me", "but then", "what if it", "i'm not sure i should", "something's holding me back", "mixed feelings"],
    metaProgramCues: ["selfIntegrity:conflicted"],
    invitation: "{opener} a part of you isn't sure. Can we ask that part what it's worried you'd lose?" }),
  P({ id: 5, name: "Flexibility of Responses", chapter: "basic", page: 44, needsGuide: false, publicSafe: true,
    concept: "The element with the most choices controls the system; if what you're doing isn't working, do anything else.",
    steps: ["Notice the response you keep giving.", "List three other responses you could give.", "Try the one least like your usual.", "Notice what happens and keep what works."],
    cues: ["i keep doing", "every time i", "same thing again", "i always react", "i tried the same", "nothing changes"],
    metaModelCues: ["universalQuantifier"],
    invitation: "{opener} the same move keeps getting the same result. What's one thing you could do instead, even a strange one?" }),
  P({ id: 6, name: "State Elicitation", chapter: "basic", page: 46, needsGuide: false, publicSafe: true,
    concept: "Bring a chosen state (calm, confident, curious) fully to life by remembering a time you had it and stepping back inside.",
    steps: ["Name the state you want.", "Remember a specific time you had it.", "Step into that memory: see what you saw, hear what you heard, feel what you felt.", "Amplify: brighter, closer, louder, warmer, until the state is present now."],
    cues: ["i used to feel", "i remember when i was", "i wish i felt", "i need to feel calm", "i can't get myself to feel"],
    invitation: "{opener} you've felt steadier before. Would you go back to one time you did, and tell me what it was like inside?" }),
  P({ id: 7, name: "State Induction", chapter: "basic", page: 48, needsGuide: true, publicSafe: true,
    concept: "Invite a state in someone else through your own state, your language, tempo and the memories you ask for.",
    steps: ["Go into the state yourself first.", "Ask for a memory of the state, in sensory detail.", "Match your voice and pace to the state.", "Watch for the physiology of the state and amplify what appears."],
    cues: [], invitation: "{opener} let's slow this down together for a moment." }),
  P({ id: 8, name: "State Interrupt", chapter: "basic", page: 50, needsGuide: false, publicSafe: true,
    concept: "Break a running unresourceful state by doing something abrupt and unrelated so the loop cannot complete; then redirect.",
    steps: ["Notice the loop as it runs.", "Interrupt with something out of pattern: a different-channel question, a movement, a change of posture or breath.", "In the gap, ask an outcome question: what do you want instead?", "Do not let the old state finish its sentence."],
    cues: ["over and over", "i keep thinking", "can't stop thinking", "round and round", "spiral", "stuck in my head", "on a loop", "again and again"],
    invitation: "Can I stop you for one second? Before you go on: what colour is the nearest wall to you right now?" }),
  P({ id: 9, name: "Anchoring", chapter: "basic", page: 51, needsGuide: false, publicSafe: true,
    concept: "Link a state to a touch, word or gesture at its peak so the state can be fired on purpose later.",
    steps: ["Elicit the state fully (see #6).", "At its peak, apply a unique trigger: a specific touch, word, image.", "Release before the state fades.", "Break state, then test: fire the trigger and notice the state return.", "Repeat to strengthen."],
    cues: ["i need it on demand", "when i'm about to", "before the meeting", "how do i get back to", "in the moment i lose it"],
    invitation: "{opener} you'd like that steadiness available when you need it. Would you like to set it up so you can call it back?" }),
  P({ id: 10, name: "Accessing Positive Intention", chapter: "basic", page: 54, needsGuide: false, publicSafe: true,
    concept: "Every behaviour, however unwanted, is trying to do something good for the person; find the intention and you can keep it while changing the behaviour.",
    steps: ["Name the behaviour you don't like in yourself.", "Ask: what does this do for me? What is it trying to get me?", "Keep asking 'and what does that get me?' until the answer is a positive state (safety, peace, love).", "Honour the intention.", "Ask for three other ways to get the same intention."],
    cues: ["i hate that i", "why do i keep", "i don't know why i", "i can't stop", "i'm so stupid for", "i keep sabotaging", "part of me does it anyway"],
    metaModelCues: ["identification"],
    invitation: "{opener} you're angry at yourself for doing it. May I ask a strange question: what is that behaviour trying to do for you?" }),
  // ── Chapter 2: Parts ───────────────────────────────────────────────────
  P({ id: 11, name: "Collapsing Anchors", chapter: "parts", page: 58, needsGuide: true, publicSafe: true,
    concept: "Anchor a resourceful state and an unresourceful one, fire both together, and let the stronger resource neutralize the other.",
    steps: ["Anchor the unwanted state (briefly).", "Break state.", "Anchor a strong resource state, stacking several if needed.", "Fire both anchors at once and hold until the physiology settles.", "Release the negative first, then the positive; test."],
    cues: ["every time i see", "that place makes me", "i freeze when", "one look and i'm back"],
    invitation: "{opener} that reaction fires before you can think. This is something to do with a guide who can hold both sides with you." }),
  P({ id: 12, name: "Parts Negotiation", chapter: "parts", page: 59, needsGuide: false, publicSafe: true,
    concept: "When two parts of a person want different things, have each state its positive intention and agree not to interrupt the other.",
    steps: ["Identify the two parts and what each wants.", "Ask each for its positive intention.", "Check that each part accepts the other's intention as worthwhile.", "Negotiate: what would each need to stop interfering?", "Get agreement and a signal for renegotiation."],
    cues: ["part of me wants", "torn between", "half of me", "i want to but i also", "two minds", "i can't decide because"],
    metaProgramCues: ["selfIntegrity:conflicted"],
    invitation: "{opener} two parts of you want different things, and both are trying to help. Would you let each one say what it's after?" }),
  P({ id: 13, name: "Six-Step Reframing", chapter: "parts", page: 61, needsGuide: false, publicSafe: true,
    concept: "For an unwanted behaviour: contact the part that runs it, honour its intention, generate new choices with the creative part, and get agreement to use them.",
    steps: ["Identify the behaviour you want to change.", "Establish communication with the part responsible (a yes/no signal).", "Separate the positive intention from the behaviour.", "Ask the creative part for three new ways to satisfy the intention.", "Ask the part to accept the new choices.", "Ecology check: does any other part object?"],
    cues: ["i keep doing", "can't stop", "bad habit", "i do it without thinking", "i always end up", "before i know it i've"],
    invitation: "{opener} the habit runs on its own. May I ask what it does for you, and then whether you'd want three other ways to get that?" }),
  P({ id: 14, name: "Aligning Perceptual Positions", chapter: "parts", page: 63, needsGuide: false, publicSafe: true,
    concept: "See a situation from first position (self), second (the other), and third (an observer), then bring what each learned back to self.",
    steps: ["First position: be yourself in the scene; notice what you see, hear, feel.", "Second position: step into the other person; see yourself through their eyes.", "Third position: step out and watch both from a neutral distance.", "Ask what each position knows that the others don't.", "Return to first position with those learnings."],
    cues: ["he doesn't get it", "she never sees my side", "they think i'm", "i can't understand why he", "from my point of view"],
    metaModelCues: ["mindReading"],
    invitation: "{opener} you've been inside your side of it. Would you try standing in their shoes for one minute, and then watch both of you from the doorway?" }),
  P({ id: 15, name: "Agreement Frame", chapter: "parts", page: 66, needsGuide: false, publicSafe: true,
    concept: "In a disagreement, chunk up until both sides find an outcome they share, then negotiate down from there.",
    steps: ["Ask each side what it wants.", "Ask what having that would do for them; keep chunking up.", "Find the level where both agree.", "Come back down: how could both intentions be met?"],
    cues: ["we argue", "we can't agree", "same fight", "he wants .{1,30} i want", "we're stuck on"],
    invitation: "{opener} you both want something. What would each of you get if you got it? Somewhere up there you agree." }),
  P({ id: 16, name: "Aligned Self", chapter: "parts", page: 68, needsGuide: true, publicSafe: true,
    concept: "Align the logical levels (environment, behaviour, capability, belief, identity, spirit) around one outcome so the whole person points the same way.",
    steps: ["Name the outcome.", "Walk the levels: where and when; what you do; what you're capable of; what you believe; who you are; what you're part of.", "At the top, take the sense of mission back down through each level.", "Notice how each level changes."],
    cues: ["i don't know who i am", "my values", "what's my purpose", "i'm not living the way i", "doesn't line up"],
    invitation: "{opener} the pieces of you don't line up around this yet. This is a longer walk, best with someone guiding it." }),
  P({ id: 17, name: "Resolving Internal Conflict", chapter: "parts", page: 71, needsGuide: false, publicSafe: true,
    concept: "Put each conflicting part in a hand, find their shared higher intention, and integrate them.",
    steps: ["Identify the two parts and their positive intentions.", "Represent one in each hand.", "Chunk up each until they share a purpose.", "Let the hands come together at the pace that feels right.", "Bring the integrated part inside."],
    cues: ["conflicted", "i'm fighting myself", "at war with myself", "one side of me"],
    metaProgramCues: ["selfIntegrity:conflicted"],
    invitation: "{opener} you're at war with yourself. Would you try holding one side in each hand and asking each what it's really for?" }),
  P({ id: 18, name: "Advanced Visual Squash", chapter: "parts", page: 72, needsGuide: true, publicSafe: true,
    concept: "A fuller version of #17 with submodality and third-position work before integration.",
    steps: ["Identify the parts and see each as an image in a hand.", "Elicit each part's intention up to the shared level.", "Have each part notice the other's resources.", "Integrate, then future-pace."],
    cues: [], invitation: "{opener} this is one to do with a guide." }),
  // ── Chapter 3: Identity ────────────────────────────────────────────────
  P({ id: 19, name: "Belief Change", chapter: "identity", page: 76, needsGuide: false, publicSafe: true,
    concept: "Move a limiting belief into the submodality structure of doubt, and an empowering belief into the structure of conviction.",
    steps: ["Name the limiting belief and the belief you'd rather have.", "Find a belief you once held and now doubt; notice how it's coded (location, size, brightness, distance).", "Find something you are certain of; notice its coding.", "Move the limiting belief into the doubt coding.", "Move the new belief into the certainty coding.", "Test and future-pace."],
    cues: ["i believe i'm", "i've always believed", "i'm the kind of person who", "people like me don't", "i'm just not", "i'll never be"],
    metaModelCues: ["identification", "universalQuantifier"],
    metaProgramCues: ["realityStructure:static"],
    invitation: "{opener} that's a belief, not a fact, and beliefs have a structure. Would you like to look at how you're holding this one?" }),
  P({ id: 20, name: "Dis-identification", chapter: "identity", page: 78, needsGuide: false, publicSafe: true,
    concept: "Separate who you are from what you do, feel, think or have: 'I have a body, I am not my body.' Behaviour can change; an identity has nowhere to go.",
    steps: ["Say the label you've given yourself.", "Rephrase: 'I have (thoughts/feelings/a behaviour of)…, and I am more than that.'", "Ask: who is the one noticing the thought?", "Step back to that observer and describe the label from there."],
    cues: ["i am a failure", "i'm a loser", "i'm worthless", "i'm a burden", "i'm broken", "that's just who i am", "i'm useless", "i'm a bad"],
    metaModelCues: ["identification"],
    invitation: "{opener} you've summed yourself up in one word. May I ask: is that who you are, or something you did, or something you feel right now?" }),
  P({ id: 21, name: "Re-imprinting", chapter: "identity", page: 81, needsGuide: true, publicSafe: false,
    concept: "Revisit an early imprint experience on the time-line with adult resources, give the resources to everyone in the scene, and re-run it.",
    steps: ["Identify the belief and its earliest imprint.", "Step out to third position and view the scene.", "Find the positive intention of each person in it.", "Bring the needed resources to each person, then to your younger self.", "Re-experience from first position with the resources.", "Return to the present."],
    cues: ["ever since i was a kid", "when i was little", "my mother always", "my father used to", "growing up"],
    caution: "Touches formative and possibly traumatic memory; for a licensed professional, not a self-help exercise.",
    invitation: "{opener} this goes back a long way. That's worth exploring with a licensed professional who can hold it with you." }),
  P({ id: 22, name: "Time-Line", chapter: "identity", page: 86, needsGuide: true, publicSafe: true,
    concept: "Elicit how a person codes past, present and future in space, and use the line to gain perspective, learn, and future-pace.",
    steps: ["Ask where the past is and where the future is; notice the direction.", "Float above the line to view events dissociated.", "Go back before an event, take its learnings, and let the emotion go.", "Return to now and look forward."],
    cues: ["my past", "the future", "back then", "years from now", "my whole life"],
    invitation: "{opener} you carry your whole history in this. Where is the past for you, if you had to point?" }),
  P({ id: 23, name: "Change Personal History", chapter: "identity", page: 89, needsGuide: true, publicSafe: true,
    concept: "Go back to the memories that trained a limitation and add the resources that were missing, so the history is remembered with the resource in it.",
    steps: ["Anchor the unresourceful feeling and trace it back to earlier times.", "Break state and identify the resource that would have changed each.", "Anchor the resource.", "Revisit each memory with the resource anchor held.", "Test in the present and future-pace."],
    cues: ["ever since", "it started when", "the first time it happened", "i've been like this since", "it goes back to"],
    metaModelCues: ["presupposition"],
    invitation: "{opener} you know exactly when it started. What did you need then that you didn't have?" }),
  P({ id: 24, name: "The Swish Pattern", chapter: "identity", page: 93, needsGuide: false, publicSafe: true,
    concept: "Take the cue image that starts an unwanted response and swish it out, replacing it with an image of the self you'd rather be, fast, until the cue points to the new self.",
    steps: ["Identify the cue: what do you see just before the behaviour?", "Create a picture of yourself as the person for whom this is not an issue.", "Put the cue big and bright, the self-image small and dark in a corner.", "Swish: the self-image explodes big and bright as the cue shrinks and dims; say 'swish'.", "Blank the screen; repeat five times fast.", "Test: try to get the cue back."],
    cues: ["every time i see", "as soon as i", "the moment i", "when i walk in", "i see the (?:phone|fridge|bottle|screen) and"],
    invitation: "{opener} it starts with what you see. Would you like a fast one for that: take the picture that starts it and swap in who you'd rather be?" }),
  P({ id: 25, name: "Circle of Excellence", chapter: "identity", page: 95, needsGuide: false, publicSafe: true,
    concept: "Build a spatial anchor: an imagined circle on the floor filled with the resource states you need, to step into before a challenge.",
    steps: ["Imagine a circle on the floor.", "Recall a time you had the resource; step into the circle as the state peaks; step out as it fades.", "Stack more resources the same way.", "Think of the coming challenge; step in and notice the resources present.", "Future-pace."],
    cues: ["i have to (?:present|speak|talk to|face|confront|go in)", "the interview", "the meeting", "before i see them", "i get nervous before"],
    invitation: "{opener} something's coming that you'd like to walk into steadier. Would you like to build a place to step into, right before it?" }),
  P({ id: 26, name: "Decision Destroyer", chapter: "identity", page: 97, needsGuide: false, publicSafe: true,
    concept: "Go back before a limiting decision on the time-line, insert a resourceful experience, and let it change the decision and what followed.",
    steps: ["Identify the limiting decision and when you made it.", "Find or build a resourceful experience.", "On the time-line, go back before the decision and have the resource fully.", "Come forward through the decision point with the resource.", "Notice how the decision and later events look now."],
    cues: ["i decided back then", "i should never have", "i made up my mind that", "since that day i", "i swore i'd never"],
    invitation: "{opener} you made a decision a long time ago that still runs. What did you have too little of when you made it?" }),
  P({ id: 27, name: "Core Transformation", chapter: "identity", page: 98, needsGuide: true, publicSafe: true,
    concept: "Follow a behaviour's intention up the chain of outcomes until it reaches a core state (being, peace, love, oneness), then bring that state back down through every level.",
    steps: ["Choose a behaviour or feeling to work with.", "Ask the part: what do you want? and, having that, what do you want? repeatedly.", "Reach the core state.", "Reverse: with the core state, how does each outcome change? How does the original behaviour change?", "Grow up the part and future-pace."],
    cues: ["deep down", "underneath it all", "what i really want is", "at the bottom of it"],
    invitation: "{opener} underneath the want is another want. This is a long, gentle walk best done with a guide." }),
  P({ id: 28, name: "The Meta-Transformation", chapter: "identity", page: 101, needsGuide: true, publicSafe: true,
    concept: "Core transformation applied to meta-states: state-about-state layers (shame about fear, anger about sadness) unwound to their core.",
    steps: ["Identify the primary state and the states layered on it.", "Chunk up each layer to its intention.", "Reach the core state and bring it back down through the layers."],
    cues: ["ashamed of how i feel", "angry that i'm sad", "afraid of my anger", "guilty for feeling", "frustrated with myself for"],
    invitation: "{opener} you have a feeling about a feeling. Which one came first?" }),
  P({ id: 29, name: "Making Peace with Your Parents", chapter: "identity", page: 103, needsGuide: true, publicSafe: true,
    concept: "Use perceptual positions and positive intention to update the internal representation of one's parents.",
    steps: ["Picture each parent.", "Step into their position and find their intention.", "From third position, notice what each needed.", "Forgive what can be forgiven, keep what protects, and return to self."],
    cues: ["my parents never", "my mother always", "my father always", "my mother never", "my father never", "peace with my (?:mother|father|mom|dad|parents)", "forgive my (?:mother|father|mom|dad|parents)"],
    invitation: "{opener} your parents are still in the room in some way. This one is worth doing with someone alongside." }),
  P({ id: 30, name: "Loving Yourself", chapter: "identity", page: 106, needsGuide: false, publicSafe: true,
    concept: "Take the state of loving someone else and turn it, with its full submodalities, toward yourself.",
    steps: ["Think of someone you love without reservation; notice how you see and feel them.", "Notice the qualities of that inner picture and feeling.", "Put yourself in that picture with the same qualities.", "Let the feeling apply to you."],
    cues: ["i don't like myself", "i can't stand myself", "i hate myself", "i'm not worth", "i don't deserve"],
    metaModelCues: ["identification"],
    invitation: "{opener} you'd never talk to someone you love the way you talk to yourself. Think of someone you love; what is it like to look at them?" }),
  P({ id: 31, name: "Self-Sufficiency", chapter: "identity", page: 107, needsGuide: false, publicSafe: true,
    concept: "Build the sense that you can give yourself the acknowledgement you look for from others.",
    steps: ["Notice what you wait for others to give you (approval, praise).", "Give it to yourself, in their voice if that helps.", "Notice how much of it you can supply.", "Keep what others give as a bonus, not a requirement."],
    cues: ["i need them to", "if only she would", "nobody appreciates", "no one notices", "i need his approval", "waiting for them to"],
    metaProgramCues: ["referenceFrame:external", "affiliation:dependent"],
    invitation: "{opener} you're waiting for someone else to hand it to you. What would it be like to say it to yourself, in their voice?" }),
  P({ id: 32, name: "Receiving Wisdom from Your Inner Sage", chapter: "identity", page: 108, needsGuide: false, publicSafe: true,
    concept: "Consult an imagined wise, older self for advice on the present problem.",
    steps: ["Imagine yourself years from now, wise and at peace.", "Step into that self and look back at today's problem.", "Let the sage speak; listen.", "Return and take the advice."],
    cues: ["what should i do", "i don't know what to do", "i wish someone would tell me", "i have no idea"],
    invitation: "{opener} you're looking for advice. If the wisest version of you, years from now, were watching this, what would they say?" }),
  // ── Chapter 4: States ──────────────────────────────────────────────────
  P({ id: 33, name: "Visual/Kinesthetic Dissociation (Phobia Cure)", chapter: "states", page: 112, needsGuide: true, publicSafe: false,
    concept: "Watch a traumatic or phobic memory from a doubly dissociated position (watching yourself watch a screen), run it fast backwards, and recode it.",
    steps: ["Establish a strong resource anchor.", "Imagine sitting in a cinema; see a still of yourself before the event on the screen.", "Float up to the projection booth and watch yourself watching.", "Run the film in black and white to the end; freeze.", "Step into the last frame and run it backwards in colour in two seconds.", "Repeat; test."],
    cues: ["terrified of", "panic when", "phobia", "flashback", "i freeze", "trauma", "can't go near"],
    caution: "For phobic and traumatic memory; a licensed professional's tool, not a self-help exercise.",
    invitation: "{opener} that fear fires the moment the memory does. That's worth bringing to a licensed professional; there are fast, gentle ways of working with it." }),
  P({ id: 34, name: "Accessing and Managing Resourceful States", chapter: "states", page: 119, needsGuide: false, publicSafe: true,
    concept: "Know your resource states by name, know how to get into each, and keep a way to reach them.",
    steps: ["List the states that serve you (calm, curious, determined).", "For each, find the memory, posture, breath and words that bring it.", "Practise entering each at will.", "Decide which state a coming situation needs and enter it first."],
    cues: ["i need to be", "i wish i could just be calm", "how do i get into", "i lose my composure"],
    invitation: "{opener} which state would this situation need from you: calm, curious, or determined?" }),
  P({ id: 35, name: "State of Consciousness Awareness", chapter: "states", page: 120, needsGuide: false, publicSafe: true,
    concept: "Notice the state you are in, name it, and notice what it does to how you see things.",
    steps: ["Pause and ask: what state am I in right now?", "Name it.", "Ask: what does this state let me see, and what does it hide?", "Choose whether to keep it."],
    cues: ["i don't know how i feel", "i'm all over the place", "i can't tell what's going on with me"],
    invitation: "{opener} let's name the state you're in right now, in one word. What is it?" }),
  P({ id: 36, name: "'As If' Frame", chapter: "states", page: 123, needsGuide: false, publicSafe: true,
    concept: "Step past a block by acting as if it were already solved: 'if you did know, what would it be?'",
    steps: ["Name the block.", "Ask: if this were already solved, what would be different?", "Act as if for a few minutes; notice what becomes available.", "Take what you found back."],
    cues: ["i can't imagine", "impossible", "i don't know", "there's no way", "if only it were"],
    metaModelCues: ["modalOperatorImpossibility"],
    invitation: "{opener} you say you can't imagine it. Humour me: if you could, just as if, what would be the first thing you'd notice?" }),
  P({ id: 37, name: "Chaining States", chapter: "states", page: 124, needsGuide: true, publicSafe: true,
    concept: "Build a chain of anchored states from a stuck state through intermediate ones to a resourceful one, so the stuck state leads out automatically.",
    steps: ["Identify the stuck state and the desired end state.", "Choose two or three intermediate states that bridge them.", "Anchor each; fire them in sequence, overlapping.", "Repeat until the stuck state triggers the chain."],
    cues: ["stuck", "paralyzed", "frozen", "can't get going"],
    invitation: "{opener} from stuck to moving is too far in one jump. What's the state halfway between?" }),
  P({ id: 38, name: "Submodality Overlapping", chapter: "states", page: 126, needsGuide: false, publicSafe: true,
    concept: "Reach a state through the person's strongest system and overlap into the weaker ones.",
    steps: ["Start with the sense the person finds easiest.", "Build the experience there in detail.", "Add the next sense, then the next, overlapping."],
    cues: [], invitation: "{opener} start with what you can picture, and let the rest follow." }),
  P({ id: 39, name: "Threshold Pattern (Compulsion Blowout)", chapter: "states", page: 127, needsGuide: true, publicSafe: false,
    concept: "Drive the submodalities of a compulsion past the point of tolerance until the response breaks.",
    steps: ["Identify the compulsion's driver submodality.", "Increase it repeatedly and quickly past threshold.", "Test."],
    cues: ["craving", "compulsion", "i can't resist", "urge"],
    caution: "Intense; a practitioner's tool, and not for substance-related compulsions without clinical support.",
    invitation: "{opener} the pull is strong. That's something for a professional to work with you on." }),
  P({ id: 40, name: "Transforming 'Mistakes' into 'Learnings'", chapter: "states", page: 128, needsGuide: false, publicSafe: true,
    concept: "Recode a mistake as feedback: what did it teach, and what will you do differently?",
    steps: ["Name the mistake.", "Ask: what did this teach me?", "Ask: what will I do differently next time?", "Keep the learning, let the label go."],
    cues: ["i messed up", "i failed", "i blew it", "i screwed up", "stupid mistake", "i ruined"],
    metaProgramCues: ["goalStriving:perfectionism"],
    invitation: "{opener} you're calling it a failure. If it were feedback instead, what would it be telling you?" }),
  P({ id: 41, name: "Becoming Intentionally Compelled: Godiva Chocolate", chapter: "states", page: 129, needsGuide: false, publicSafe: true,
    concept: "Borrow the submodalities of something you find irresistible and give them to a task you want to be drawn to.",
    steps: ["Picture something you feel compelled toward; notice its qualities.", "Picture the task you want to feel drawn to.", "Open a hole in the compelling picture, see the task through it, and let the qualities transfer.", "Repeat; test."],
    cues: ["i can't get motivated", "i keep putting it off", "procrastinat", "i have no drive", "i just don't want to"],
    invitation: "{opener} the motivation isn't there for it. What is there something you can never resist? We can borrow that." }),
  P({ id: 42, name: "Decision-Making", chapter: "states", page: 131, needsGuide: false, publicSafe: true,
    concept: "Make a decision by laying out options, checking each against criteria and ecology, and future-pacing the choice.",
    steps: ["List the options.", "Name your criteria and rank them.", "Test each option against the criteria; picture living with it.", "Choose; check ecology; set the first step."],
    cues: ["can't decide", "should i", "i don't know whether to", "which one", "on the fence", "go back and forth"],
    invitation: "{opener} you're going back and forth. What would have to be true for the decision to be easy?" }),
  P({ id: 43, name: "Pleasure", chapter: "states", page: 133, needsGuide: false, publicSafe: true,
    concept: "Amplify the capacity for pleasure in ordinary experience by attending to and enlarging its sensory qualities.",
    steps: ["Notice a small pleasant experience.", "Attend to its sensory detail.", "Amplify the qualities that intensify it.", "Anchor it."],
    cues: ["nothing feels good", "i don't enjoy anything", "no pleasure", "numb", "flat"],
    invitation: "{opener} nothing lands as pleasant lately. What's one small thing today that was even slightly okay?" }),
  P({ id: 44, name: "Reducing Enjoyment", chapter: "states", page: 135, needsGuide: false, publicSafe: true,
    concept: "Shrink the submodalities of an unwanted pleasure so it loses its pull.",
    steps: ["Picture the unwanted pleasure.", "Make it smaller, dimmer, further, black and white.", "Add the consequences to the picture.", "Test."],
    cues: ["i enjoy it too much", "i know i shouldn't but i love", "guilty pleasure"],
    invitation: "{opener} it pulls because of how you picture it. Want to try shrinking the picture?" }),
  P({ id: 45, name: "Breaking Up Limiting Synesthesias", chapter: "states", page: 137, needsGuide: true, publicSafe: true,
    concept: "Separate an automatic see-feel or hear-feel link so a sight or sound no longer instantly produces the feeling.",
    steps: ["Identify the trigger and the feeling.", "Separate: see it without feeling, or feel without the image.", "Insert a step between them.", "Test."],
    cues: ["as soon as i hear", "one look and i", "his voice makes me", "the sound of"],
    invitation: "{opener} the sight and the feeling are welded together. Can we put a gap between them?" }),
  P({ id: 46, name: "Filing Away Memories as Part of One's Learning History", chapter: "states", page: 139, needsGuide: false, publicSafe: true,
    concept: "Take a memory that keeps intruding, extract its learning, and file it as history.",
    steps: ["Bring up the memory; note where it sits.", "Ask what it taught you.", "Thank it; move it into the past on your time-line, smaller and further.", "Keep the learning in the present."],
    cues: ["i can't let it go", "it keeps coming back", "i can't stop replaying", "it haunts me"],
    invitation: "{opener} that memory keeps coming back. What did it teach you that it's still trying to make sure you know?" }),
  // ── Chapter 5: Languaging ──────────────────────────────────────────────
  P({ id: 47, name: "Meta-Modeling", chapter: "languaging", page: 144, needsGuide: false, publicSafe: true,
    concept: "Use the Meta-Model questions to recover what a sentence deleted, generalized or distorted, reconnecting the map to the experience.",
    steps: ["Listen for the fingerprints: always/never, can't, should, makes me, means, they, better.", "Ask the recovery question for the one that carries the most weight.", "Let the answer stand; ask the next.", "Notice the experience become specific."],
    cues: [],
    metaModelCues: ["universalQuantifier", "modalOperatorNecessity", "modalOperatorImpossibility", "causeEffect", "complexEquivalence", "mindReading", "lostPerformative", "comparativeDeletion", "lackOfReferentialIndex", "unspecifiedVerb", "simpleDeletion", "presupposition", "eitherOr", "pseudoWord"],
    invitation: "{opener} may I ask one question about how you said that?" }),
  P({ id: 48, name: "The Pattern of Meta-Model III", chapter: "languaging", page: 149, needsGuide: false, publicSafe: true,
    concept: "Hall's extensions: identification, either/or, pseudo-words, over/under-defined terms, delusional verbal splits, multiordinality.",
    steps: ["Listen for 'I am' labels, either/or, absolute words.", "Ask: is that who you are or what you did? What lies between? Compared to what?"],
    cues: [], metaModelCues: ["identification", "eitherOr", "pseudoWord"],
    invitation: "{opener} that word does a lot of work. Can we look at it for a second?" }),
  P({ id: 49, name: "Denominalizing", chapter: "languaging", page: 150, needsGuide: false, publicSafe: true,
    concept: "Turn a frozen noun (depression, relationship, decision) back into the verb it came from, so it can move again.",
    steps: ["Spot the nominalization: a process word used as a thing.", "Ask: how are you [verb]-ing? Who is doing what to whom?", "Describe the process in verbs.", "Notice the choices that appear."],
    cues: [], metaModelCues: ["nominalization"],
    invitation: "{opener} you said it like a thing that sits on you. If it were something you're doing, moment to moment, what is the doing?" }),
  P({ id: 50, name: "Problem Defining / Formulating", chapter: "languaging", page: 152, needsGuide: false, publicSafe: true,
    concept: "State a problem so precisely (who, what, when, where, how, and what instead) that it becomes solvable.",
    steps: ["Say the problem.", "Who is involved? What exactly happens? When and where? How does it run?", "What is the desired state instead?", "What is the smallest first difference?"],
    cues: ["everything is wrong", "my whole life", "it's all a mess", "i don't even know where to start", "it's everything"],
    metaProgramCues: ["chunkSize:global", "abstraction:abstract"],
    invitation: "{opener} it's everything at once. If you had to pick one piece of it that happened this week, which piece?" }),
  // ── Chapter 6: Thinking patterns ───────────────────────────────────────
  P({ id: 51, name: "Identifying and Pacing a Person's Meta-Programs", chapter: "thinking", page: 158, needsGuide: false, publicSafe: true,
    concept: "Read how a person sorts (toward/away, options/procedures, internal/external, global/specific) and speak in that style.",
    steps: ["Listen for the sorting style.", "Match it in your words.", "Only then introduce something new."],
    cues: [], invitation: "{opener} I'll say this the way you'd say it." }),
  P({ id: 52, name: "Recognizing and Challenging Limiting Meta-Programs", chapter: "thinking", page: 159, needsGuide: false, publicSafe: true,
    concept: "Notice when a sorting style has become a trap (always away-from, always worst-case, always external) and try its opposite on purpose.",
    steps: ["Name the style you default to.", "Ask what it costs you here.", "Try the opposite style for this one situation.", "Notice what you see that you couldn't before."],
    cues: [], metaProgramCues: ["scenario:worstCase", "direction:awayFrom", "referenceFrame:external", "goalStriving:skepticism", "perceptualCategories:blackWhite", "responsibility:over"],
    invitation: "{opener} you tend to sort this one way. Would you try the other way, just for this?" }),
  P({ id: 53, name: "Meta-Programs Change", chapter: "thinking", page: 171, needsGuide: true, publicSafe: true,
    concept: "Change a meta-program by finding where its opposite already runs in your life and transferring that coding.",
    steps: ["Identify the program and a context where its opposite runs.", "Notice the coding of each.", "Transfer the coding.", "Ecology and test."],
    cues: [], invitation: "{opener} somewhere else in your life you already sort the other way. Where?" }),
  P({ id: 54, name: "Identifying and Disputing Cognitive Distortions", chapter: "thinking", page: 174, needsGuide: false, publicSafe: true,
    concept: "Name the distortion (all-or-nothing, over-generalizing, mind reading, catastrophizing, personalizing, should-ing, labelling, emotional reasoning) and dispute it with evidence.",
    steps: ["Write the thought.", "Name the distortion it's running.", "Ask: what is the evidence for and against?", "Write the fairer version."],
    cues: ["worst case", "i just know", "it's going to be a disaster", "it's my fault", "i should"],
    metaModelCues: ["universalQuantifier", "mindReading", "eitherOr", "identification", "modalOperatorNecessity"],
    metaProgramCues: ["scenario:worstCase", "perceptualCategories:blackWhite", "responsibility:over"],
    invitation: "{opener} that thought has a shape to it. If we tested it against what actually happened, what's the evidence on each side?" }),
  // ── Chapter 7: Meanings ────────────────────────────────────────────────
  P({ id: 55, name: "Content Reframing", chapter: "meanings", page: 180, needsGuide: false, publicSafe: true,
    concept: "Give the same behaviour a different meaning: what else could this mean? What is positive about it?",
    steps: ["Take the statement 'X means Y'.", "Ask: what else could X mean?", "Find a meaning that opens choice.", "Offer it and check the response."],
    cues: ["it means i'm", "which means", "that just proves", "it shows that i"],
    metaModelCues: ["complexEquivalence"],
    invitation: "{opener} you've decided what it means. What else could it mean, even one other thing?" }),
  P({ id: 56, name: "Context Reframing", chapter: "meanings", page: 183, needsGuide: false, publicSafe: true,
    concept: "Keep the behaviour, change the context: where would this be useful?",
    steps: ["Name the behaviour you judge.", "Ask: where would this be exactly the right response?", "Notice it is a resource in that context.", "Ask where it belongs and where it doesn't."],
    cues: ["i'm too sensitive", "i'm too much", "i care too much", "i'm too stubborn", "i'm too intense"],
    metaModelCues: ["lostPerformative", "comparativeDeletion"],
    invitation: "{opener} 'too much' for where? Where would that exact quality be the best thing about you?" }),
  P({ id: 57, name: "Submodalities Reframing", chapter: "meanings", page: 183, needsGuide: false, publicSafe: true,
    concept: "Change the meaning of an experience by changing how it is coded (size, distance, brightness, sound, location).",
    steps: ["Bring up the experience; notice its coding.", "Change one quality at a time; notice the meaning shift.", "Keep the coding that serves."],
    cues: ["i can't get it out of my head", "it looms", "it's huge", "it's right in my face"],
    invitation: "{opener} it's big and close. What happens if you push it further away and make it smaller, just to see?" }),
  P({ id: 58, name: "Six-Step Reframing as a Meta-States Pattern", chapter: "meanings", page: 187, needsGuide: false, publicSafe: true,
    concept: "Six-step reframing seen as applying higher states (appreciation, creativity, ecology) to a behaviour.",
    steps: ["Apply appreciation to the part.", "Apply creativity to the intention.", "Apply ecology to the choices."],
    cues: [], invitation: "{opener} can we appreciate the part first, before we ask it to change?" }),
  P({ id: 59, name: "Pulling Apart Belief Synesthesia", chapter: "meanings", page: 188, needsGuide: true, publicSafe: true,
    concept: "Separate the external behaviour from the internal meaning that was fused to it.",
    steps: ["Identify the fused see-feel or hear-feel meaning.", "Separate the outside from the inside.", "Re-link with choice."],
    cues: [], metaModelCues: ["complexEquivalence"],
    invitation: "{opener} the thing that happened and the thing it means got glued together. Can we unglue them?" }),
  P({ id: 60, name: "Establishing Your Value Hierarchy", chapter: "meanings", page: 189, needsGuide: false, publicSafe: true,
    concept: "Elicit and rank what matters most, so decisions can be made against it.",
    steps: ["List what's important to you about this area.", "Compare pairs: if you could have only one?", "Rank them.", "Check the ranking against a real decision."],
    cues: ["what matters", "my priorities", "what's important", "i don't know what i value", "everything matters"],
    invitation: "{opener} what's most important to you about this, and then what's next after that?" }),
  P({ id: 61, name: "Kinesthetic Hierarchy of Criteria", chapter: "meanings", page: 192, needsGuide: true, publicSafe: true,
    concept: "Walk the values hierarchy in space, feeling each, to find the criterion that overrides a stuck behaviour.",
    steps: ["Lay the criteria out on the floor.", "Step on each and feel it.", "Find the higher criterion that outranks the block.", "Apply it."],
    cues: [], invitation: "{opener} there's something you value more than the thing that's stopping you. What is it?" }),
  P({ id: 62, name: "Thought Virus Inoculation", chapter: "meanings", page: 193, needsGuide: false, publicSafe: true,
    concept: "Identify a limiting belief caught from others (a 'thought virus'), examine its source and cost, and build immunity.",
    steps: ["Name the belief and where you caught it.", "Ask: does it serve me, or its source?", "Find counter-examples.", "Decide what you believe instead."],
    cues: ["everyone says", "you have to be", "that's what i was taught", "they always told me", "society says", "people like us"],
    metaModelCues: ["lostPerformative", "lackOfReferentialIndex"],
    invitation: "{opener} that sounds like something you caught from someone. Whose voice is it, and does it serve you or them?" }),
  // ── Chapter 8: Strategies ──────────────────────────────────────────────
  P({ id: 63, name: "New Behavior Generator", chapter: "strategies", page: 199, needsGuide: false, publicSafe: true,
    concept: "Watch yourself perform a new behaviour on an inner screen, edit until it looks right, step in and feel it, then future-pace.",
    steps: ["Name the new behaviour.", "See someone (or yourself) doing it well, as a film.", "Edit until it fits you.", "Step into the film and feel it.", "Future-pace: when and where next?"],
    cues: ["i want to be able to", "i wish i could", "i'd like to learn to", "how do people"],
    metaProgramCues: ["direction:toward"],
    invitation: "{opener} you'd like to be able to do it. Would you watch yourself doing it, on a screen, and edit until it looks right?" }),
  P({ id: 64, name: "Forgiveness", chapter: "strategies", page: 202, needsGuide: false, publicSafe: true,
    concept: "Release resentment by separating the person from the act, understanding the intention, and choosing to set the debt down for your own sake.",
    steps: ["Name what was done and by whom.", "Separate the person from the behaviour.", "From their position, find the intention or the limitation.", "Decide what you need to feel complete.", "Release the debt; future-pace how you'll respond next time."],
    cues: ["can't forgive", "resent", "i'll never forgive", "what he did to me", "i still hate", "grudge", "bitter"],
    invitation: "{opener} you're still carrying what they did. Forgiving isn't excusing; it's setting the weight down. What would you need in order to set it down?" }),
  P({ id: 65, name: "Allergy Cure", chapter: "strategies", page: 206, needsGuide: true, publicSafe: false,
    concept: "An NLP re-conditioning of an allergic response using a dissociated counter-example.",
    steps: ["Elicit the response and a counter-example.", "Dissociate; associate the counter-example; test."],
    cues: [],
    caution: "Concerns a physical medical condition; not offered here. Allergies belong with a physician.",
    invitation: "" }),
  P({ id: 66, name: "Grief Resolution", chapter: "strategies", page: 208, needsGuide: true, publicSafe: true,
    concept: "Recode the memory of a lost person from 'absence' to 'presence of what they gave', keeping the connection while releasing the emptiness.",
    steps: ["Notice how the loss is represented (an empty space, a fading image).", "Find a memory of someone no longer present who still feels present; notice its coding.", "Recode the lost person with that coding.", "Keep the values and gifts they gave; future-pace."],
    cues: ["died", "passed away", "lost my", "since she's been gone", "since he died", "the funeral", "grief", "grieving"],
    caution: "Grief is not a malfunction. This is offered gently, and only when the person asks for something to do with it.",
    invitation: "{opener} they're gone and the space is still there. When you think of someone else who's gone but still feels with you, what's different about how you hold them?" }),
  P({ id: 67, name: "Pre-Grieving", chapter: "strategies", page: 211, needsGuide: true, publicSafe: true,
    concept: "Prepare for an anticipated loss by taking in what the person or thing gives now, so nothing is left unsaid.",
    steps: ["Acknowledge the coming loss.", "Name what they give you now.", "Say what needs saying; do what needs doing.", "Represent the future with their gifts present."],
    cues: ["dying", "won't be here much longer", "terminal", "hospice", "before she goes", "we're losing him"],
    invitation: "{opener} you know what's coming. What would you want to have said, or done, before it does?" }),
  P({ id: 68, name: "Healthy Eating", chapter: "strategies", page: 212, needsGuide: false, publicSafe: false,
    concept: "Apply the swish and compulsion tools to eating choices.",
    steps: ["Identify the cue.", "Swish to the self who eats well.", "Test."],
    cues: [],
    caution: "Not offered in the public edition: eating, weight and diet are matters for a clinician or dietitian.",
    invitation: "" }),
  P({ id: 69, name: "Resolving Co-dependence", chapter: "strategies", page: 213, needsGuide: true, publicSafe: true,
    concept: "Separate one's own identity and worth from another person's state, using dis-identification and boundaries.",
    steps: ["Notice where your state depends on theirs.", "Dis-identify: their state is theirs.", "Find what you get from the caretaking and other ways to get it.", "Set a boundary and future-pace."],
    cues: ["i can't leave", "i need him", "without her i", "i can't live without", "if he's okay i'm okay", "i have to fix him", "i have to save"],
    metaProgramCues: ["affiliation:dependent", "responsibility:over"],
    invitation: "{opener} your okay depends on their okay. What happens to you when they're fine? And when they're not?" }),
  P({ id: 70, name: "Assertive Speaking", chapter: "strategies", page: 215, needsGuide: false, publicSafe: true,
    concept: "Say what you see, feel, need and want, in first person, without attacking or collapsing.",
    steps: ["Describe what happened, in sensory terms.", "Say how you feel about it.", "Say what you need.", "Ask for what you want, specifically.", "Rehearse; future-pace."],
    cues: ["can't say no", "i never speak up", "i just go along", "i didn't say anything", "i couldn't tell him", "i keep it in"],
    metaProgramCues: ["satirStance:placater", "emotionalCoping:passive"],
    invitation: "{opener} you kept it in. If you said it straight, in four lines (what happened, how you feel, what you need, what you want), what would line one be?" }),
  P({ id: 71, name: "Responding to Criticism", chapter: "strategies", page: 217, needsGuide: false, publicSafe: true,
    concept: "Hear criticism dissociated, check what specifically is meant, sort what is useful from what is not, and respond from choice.",
    steps: ["Step back; see the criticism on a screen, not inside you.", "Ask: what specifically do they mean?", "Check it against your own evidence.", "Keep the useful part; let the rest go.", "Respond."],
    cues: ["criticized", "they said i'm", "she told me i was", "he called me", "feedback", "attacked me", "they judged"],
    invitation: "{opener} that landed hard. If you put their words out on a screen in front of you, which part is actually about you, and which part is about them?" }),
  P({ id: 72, name: "Establishing Boundaries", chapter: "strategies", page: 220, needsGuide: false, publicSafe: true,
    concept: "Know where you end and others begin: what you will and won't accept, and how you'll say so.",
    steps: ["Notice where you feel used, crowded or drained.", "Name the limit.", "Say it in one clear sentence.", "Decide what you'll do if it's crossed.", "Rehearse."],
    cues: ["walk all over me", "take advantage", "i can't say no", "no respect for my", "they expect me to", "i have no time for myself", "everyone needs something from me"],
    metaProgramCues: ["responsibility:over", "satirStance:placater"],
    invitation: "{opener} everyone gets a piece of you. Where is the line, if you drew one, in one sentence?" }),
  P({ id: 73, name: "Magical Parents", chapter: "strategies", page: 222, needsGuide: true, publicSafe: true,
    concept: "Give your younger self the parents they needed, in imagination, so the inner child grows up with those resources.",
    steps: ["Identify what was missing.", "Imagine ideal parents who provide it.", "Re-experience childhood with them.", "Grow up through the years with the resources."],
    cues: ["my mother never", "my father wasn't", "i never had", "nobody looked after me", "i raised myself"],
    invitation: "{opener} you didn't get what you needed then. That's worth exploring with someone who can sit with you through it." }),
  P({ id: 74, name: "Transforming Mistakes into Learnings", chapter: "strategies", page: 223, needsGuide: false, publicSafe: true,
    concept: "A fuller version of #40: run the mistake as a film, stop before it, and insert the learning and a new choice.",
    steps: ["See the mistake as a film.", "Stop before the choice point.", "Insert the learning; choose differently; run it forward.", "Future-pace."],
    cues: ["if i could do it again", "i keep replaying", "i should have", "why did i"],
    invitation: "{opener} you keep replaying it. If you could stop the film right before, what would you know now that you didn't then?" }),
  P({ id: 75, name: "Thinking/Evaluating Wisely and Thoroughly", chapter: "strategies", page: 225, needsGuide: false, publicSafe: true,
    concept: "A strategy for good judgment: gather, weigh, check assumptions, consider consequences, decide.",
    steps: ["What do I know? What do I assume?", "What are the options and consequences?", "What would a wise person I respect do?", "Decide and review."],
    cues: ["i don't know what to think", "i can't think straight", "my head's a mess", "i can't figure it out"],
    invitation: "{opener} let's separate what you know from what you're assuming. What do you know for certain?" }),
  P({ id: 76, name: "A Creativity Strategy (The Walt Disney Pattern)", chapter: "strategies", page: 227, needsGuide: false, publicSafe: true,
    concept: "Cycle a plan through three positions: the dreamer (what if), the realist (how), and the critic (what could go wrong), each in its own space.",
    steps: ["Dreamer: dream it without limits.", "Realist: plan how it would actually be done.", "Critic: find what's missing or risky.", "Back to dreamer with the critique; repeat until all three are satisfied."],
    cues: ["my idea", "my dream", "a project", "i want to start", "a plan", "i've been thinking about starting"],
    invitation: "{opener} you've got an idea. Before the critic gets a vote, would you dream it out loud, with no limits, for one minute?" }),
  P({ id: 77, name: "Spinning Icons (Integration Pattern)", chapter: "strategies", page: 229, needsGuide: true, publicSafe: true,
    concept: "Integrate a set of learnings or resources by representing each as an icon, spinning them together, and drawing the whole into the body.",
    steps: ["Represent each learning as a symbol.", "Arrange and spin them.", "Let them merge into one; take it in.", "Future-pace."],
    cues: [], invitation: "{opener} you've learned several things here. Let's gather them into one." }),
];

// Two patterns share a title in the book (#40 and #74); the later one gets a numbered slug.
(() => { const seen = new Set<string>(); for (const p of PATTERNS as NlpPattern[]) { if (seen.has(p.slug)) p.slug = `${p.slug}-${p.id}`; seen.add(p.slug); } })();

export const PATTERN_BY_ID: Record<number, NlpPattern> = Object.fromEntries(PATTERNS.map(p => [p.id, p]));
export const PATTERN_BY_SLUG: Record<string, NlpPattern> = Object.fromEntries(PATTERNS.map(p => [p.slug, p]));

// ─── Sleight of Mouth (Dilts) ───────────────────────────────────────────────

export interface SleightOfMouth {
  key: string;
  name: string;
  /** What the reframe does to a belief "X means/causes Y". */
  move: string;
  /** Template; {x} and {y} are the belief's halves when known. */
  template: string;
}

export const SLEIGHT_OF_MOUTH: readonly SleightOfMouth[] = [
  { key: "intention", name: "Intention", move: "Address the positive purpose behind the belief.", template: "The reason you hold on to '{x} means {y}' is probably to protect something. What is it protecting?" },
  { key: "redefining", name: "Redefining", move: "Swap one of the words for one with a different implication.", template: "What if '{x}' were 'a signal to check in' rather than proof of '{y}'?" },
  { key: "consequence", name: "Consequence", move: "Point to what believing this leads to.", template: "If you keep believing '{x} means {y}', where does that take you a year from now?" },
  { key: "chunkDown", name: "Chunk down", move: "Look at a specific piece and see if the belief still holds.", template: "Which part of '{x}', exactly, means '{y}'? All of it, or one moment of it?" },
  { key: "chunkUp", name: "Chunk up", move: "Generalize to a larger class and see if the belief holds.", template: "Does everything in the category '{x}' belongs to always mean '{y}'?" },
  { key: "analogy", name: "Analogy", move: "Find a relationship that is like it and challenges it.", template: "That's like saying a cloudy day means the sun is gone. Is it gone, or covered?" },
  { key: "changeFrameSize", name: "Change frame size", move: "Widen or narrow the time or number of people considered.", template: "Over your whole life, not just this month, how often has '{x}' actually meant '{y}'?" },
  { key: "anotherOutcome", name: "Another outcome", move: "Shift to a different outcome than the one the belief implies.", template: "The question may not be whether '{x}' means '{y}', but what you want to do next." },
  { key: "modelOfTheWorld", name: "Model of the world", move: "Show that the belief is one map among several.", template: "Someone who loves you might look at '{x}' and see something quite different. What might they see?" },
  { key: "realityStrategy", name: "Reality strategy", move: "Ask how the person knows the belief is true.", template: "How do you know '{x}' means '{y}'? What do you see or hear that tells you?" },
  { key: "counterExample", name: "Counter-example", move: "Find one case where X happened and Y did not.", template: "Has there been a time when '{x}' happened and '{y}' didn't follow?" },
  { key: "hierarchyOfCriteria", name: "Hierarchy of criteria", move: "Bring in a value more important than the one the belief serves.", template: "Which matters more to you: being right about '{y}', or {value}?" },
  { key: "applyToSelf", name: "Apply to self", move: "Turn the belief's own logic on the belief.", template: "If one hard moment means '{y}', does one good moment mean the opposite?" },
  { key: "metaFrame", name: "Meta frame", move: "Form a belief about the belief.", template: "You may believe '{x} means {y}' only because you've had no one to help you look at it differently. Until now." },
];

/** Split "X means Y" / "X makes me Y" into its halves when the sentence allows. */
export function splitBelief(sentence: unknown): { x: string; y: string } | null {
  const s = String(sentence ?? "").replace(/\s+/g, " ").trim();
  const m = s.match(/^(.{3,120}?)\s+(?:which means|that means|means that|means|makes me|made me|is proof that|proves that|shows that|so i must be)\s+(.{2,120})$/i);
  if (!m) return null;
  return { x: m[1].replace(/^(?:and|but|so)\s+/i, "").trim(), y: m[2].replace(/[.!?]+$/, "").trim() };
}

export function sleightOfMouthLines(finding: MetaModelFinding, sentence: unknown, value = "peace with yourself"): Array<{ key: string; name: string; line: string }> {
  if (finding.pattern !== "complexEquivalence" && finding.pattern !== "causeEffect") return [];
  const parts = splitBelief(sentence) ?? { x: "that", y: "what you concluded" };
  return SLEIGHT_OF_MOUTH.map(s => ({ key: s.key, name: s.name, line: s.template.replace(/\{x\}/g, parts.x).replace(/\{y\}/g, parts.y).replace(/\{value\}/g, value) }));
}

// ─── Suggestion ──────────────────────────────────────────────────────────────

export interface PatternSuggestion {
  id: number;
  name: string;
  chapter: PatternChapter;
  score: number;
  /** Why it was suggested, in the words that triggered it. */
  because: string[];
  /** Whether it may be offered as an exercise in this edition, or only named. */
  offerable: boolean;
  invitation: string;
  concept: string;
  steps: readonly string[];
  needsGuide: boolean;
  caution?: string;
}

export interface SuggestInput {
  text: unknown;
  metaModel?: readonly MetaModelFinding[];
  metaPrograms?: readonly MetaProgramReading[];
  edition?: "public" | "clinical";
  /** Replaces `{opener}` in invitations, e.g. "It sounds like". */
  opener?: string;
  limit?: number;
}

const cueCache = new Map<number, RegExp[]>();
function cuesFor(p: NlpPattern): RegExp[] {
  let c = cueCache.get(p.id);
  if (!c) {
    c = p.cues.map(src => new RegExp(`(?:^|[^a-z0-9'])(${src})(?![a-z0-9])`, "i"));
    cueCache.set(p.id, c);
  }
  return c;
}

/** Rank the catalog against what the person said. */
export function suggestPatterns(input: SuggestInput): PatternSuggestion[] {
  const text = String(input.text ?? "").toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ");
  const edition = input.edition ?? "public";
  const findings = input.metaModel ?? [];
  const salient = (input.metaPrograms ?? []).filter(r => r.leading && r.confidence >= 0.3);
  const poleKeys = new Set(salient.map(r => `${r.key}:${r.leading!.key}`));
  const out: PatternSuggestion[] = [];
  for (const p of PATTERNS) {
    if (!p.invitation) continue; // withheld patterns (allergy, eating) are never suggested
    let score = 0;
    const because: string[] = [];
    for (const re of cuesFor(p)) {
      const m = text.match(re);
      if (m) { score += 3; because.push(`"${m[1]}"`); }
    }
    for (const mm of p.metaModelCues ?? []) {
      const hit = findings.filter(f => f.pattern === mm);
      if (hit.length) { score += Math.min(3, hit.length) * (hit[0].severity >= 3 ? 1.5 : 1) * (p.id === 47 || p.id === 48 ? 0.6 : 1); because.push(`${hit[0].name.toLowerCase()} ("${hit[0].match}")`); }
    }
    for (const mp of p.metaProgramCues ?? []) {
      if (poleKeys.has(mp)) { score += 1.5; const r = salient.find(x => `${x.key}:${x.leading!.key}` === mp)!; because.push(`${r.name.toLowerCase()}: ${r.leading!.label.toLowerCase()}`); }
    }
    if (score <= 0) continue;
    const offerable = edition === "clinical" ? true : p.publicSafe && !p.needsGuide;
    const invitation = p.invitation.replace(/\{opener\}/g, input.opener ?? "It sounds like");
    out.push({ id: p.id, name: p.name, chapter: p.chapter, score: Math.round(score * 10) / 10, because: Array.from(new Set(because)).slice(0, 4), offerable, invitation, concept: p.concept, steps: p.steps, needsGuide: p.needsGuide, caution: p.caution });
  }
  out.sort((a, b) => b.score - a.score || a.id - b.id);
  return out.slice(0, input.limit ?? 5);
}

/** A block for a server-owned system prompt. */
export function patternsPromptBlock(suggestions: readonly PatternSuggestion[], edition: "public" | "clinical" = "public"): string {
  const s = suggestions.filter(x => x.offerable).slice(0, 2);
  if (!s.length) return "PATTERNS: no reflection exercise fits this turn. Reflect and ask one question at most.";
  const lines = s.map(x => `- #${x.id} ${x.name} (because ${x.because.join(", ")}): ${x.concept} Invite it like: "${x.invitation}" Steps if they accept: ${x.steps.map((st, i) => `${i + 1}) ${st}`).join(" ")}`);
  return [
    `PATTERNS (Hall & Belnap, The Sourcebook of Magic; ${edition === "public" ? "offer only as reflection exercises the person can try, never as treatment" : "decision support for a licensed clinician"}):`,
    ...lines,
    "Offer at most one, only after reflecting, and only if the person has room for it. If they decline, drop it without comment.",
  ].join("\n");
}
