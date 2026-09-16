/**
 * Meta-programs — the habitual filters by which a person sorts, attends and
 * decides. Catalogued after L. Michael Hall & Bob G. Bodenhamer, Figuring Out
 * People: Design Engineering With Meta-Programs (1997), which identifies 51
 * meta-programs in five groups (mental, emotional, volitional, external
 * response, meta), and Hall's Sourcebook of Magic patterns #51–#53 and The
 * Spirit of NLP chapter 10 (the Sorting Grid). The numbering below is this
 * catalog's; the distinctions are theirs.
 *
 * Two uses:
 *   1. READ — score the poles of the programs that show in language. About
 *      half the 51 leave linguistic fingerprints (toward/away, options/
 *      procedures, internal/external reference, chunk size, match/mismatch,
 *      Satir stance, time tense…). The rest need behaviour or an elicitation
 *      question, so they carry a question and no detector.
 *   2. PACE — phrase the companion's next sentence to match the person's
 *      sorting style (Sourcebook #51), so it lands instead of arguing.
 *
 * What this is not: a validated psychometric instrument. There is no normed
 * population behind a meta-program reading. It structures a conversation; it
 * describes nothing fixed about a person, and readings drift with state and
 * context, which Hall says plainly ("They can change, they do change"). Every
 * reading carries a confidence and the words it was based on. Pure, no I/O.
 */

import { readRepSystem, type RepSystem } from "./repSystems";

export type MetaProgramGroup = "mental" | "emotional" | "volitional" | "response" | "meta";

export interface MetaProgramPole {
  key: string;
  label: string;
  /** How this pole sounds, one line, for the reading panel. */
  sounds: string;
  /** A pacing line the companion can say to someone at this pole. `{name}` optional. */
  pacing: string;
  /** Cue phrases (regex sources, matched case-insensitively at word boundaries). */
  cues?: readonly string[];
}

export interface MetaProgram {
  id: number;
  key: string;
  name: string;
  group: MetaProgramGroup;
  question: string;
  /** What the distinction sorts. */
  about: string;
  poles: readonly MetaProgramPole[];
  /** True when the poles can be read from language with the cues above. */
  readable: boolean;
  source: string;
}

const FOP = "Hall & Bodenhamer, Figuring Out People (1997)";
const SNLP = "Hall, The Spirit of NLP, ch. 10";

export const META_PROGRAMS: readonly MetaProgram[] = [
  // ── Mental / cognitive ──────────────────────────────────────────────────
  { id: 1, key: "chunkSize", name: "Chunk size", group: "mental", readable: true, source: FOP,
    question: "If we were going to work on a project together, would you want to know the big picture first or the details first?",
    about: "Global (gestalt, deductive) versus specific (detail, inductive) processing.",
    poles: [
      { key: "global", label: "Global", sounds: "Big picture, overview, 'basically', 'in general', few details.", pacing: "Overall, the picture is this, and you can fill in the parts whenever you want.", cues: ["basically", "overall", "in general", "generally", "the big picture", "the main thing", "the gist", "essentially", "on the whole", "broadly", "all in all", "the point is", "bottom line"] },
      { key: "specific", label: "Specific", sounds: "Exact times, names, sequences, 'specifically', 'exactly', numbers.", pacing: "Let's take it one exact piece at a time, in order.", cues: ["specifically", "exactly", "precisely", "in detail", "the details", "step by step", "first of all", "secondly", "at \\d+(?::\\d+)?\\s*(?:am|pm|o'clock)", "on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)", "\\d+ (?:minutes|hours|days|weeks|months|years|times|percent|dollars)", "to be exact", "in particular", "the exact"] },
    ] },
  { id: 2, key: "relationship", name: "Relationship sort", group: "mental", readable: true, source: FOP,
    question: "What is the relationship between what you are doing this year and what you did last year?",
    about: "Matching (sameness) versus mismatching (difference, counter-examples).",
    poles: [
      { key: "matching", label: "Matching (sameness)", sounds: "'Same as', 'like before', 'similar', looks for what fits.", pacing: "This is a lot like what you've already handled, and the parts that are the same are the parts you already know.", cues: ["the same", "same as", "just like", "like before", "like last time", "similar", "as usual", "familiar", "in common", "no different", "as always", "still the same", "consistent"] },
      { key: "mismatching", label: "Mismatching (difference)", sounds: "'But', 'except', 'not like', 'actually', spots what doesn't fit.", pacing: "You'll notice the places this doesn't fit, and those are worth saying out loud, because that's where the useful information is.", cues: ["\\bbut\\b", "except", "not like", "different", "differently", "however", "actually,? no", "on the other hand", "the problem with that", "that's not", "unlike", "doesn't fit", "not quite", "yes,? but", "the difference"] },
    ] },
  { id: 3, key: "repSystem", name: "Representational system", group: "mental", readable: true, source: FOP,
    question: "When you think about a good memory, what comes first: a picture, a sound, a feeling, or the words?",
    about: "Visual, auditory, kinesthetic or auditory-digital coding of experience (read by repSystems.ts).",
    poles: [
      { key: "visual", label: "Visual", sounds: "See, look, picture, clear, focus.", pacing: "Let's look at how this appears from where you are." },
      { key: "auditory", label: "Auditory", sounds: "Hear, sound, tell, tone, rings true.", pacing: "Tell me how that sounds when you say it out loud." },
      { key: "kinesthetic", label: "Kinesthetic", sounds: "Feel, hold, heavy, solid, grasp.", pacing: "Let's get a hold of what that feels like." },
      { key: "auditoryDigital", label: "Auditory digital", sounds: "Think, understand, makes sense, logically.", pacing: "Let's think it through so it makes sense." },
    ] },
  { id: 4, key: "informationGathering", name: "Information-gathering style", group: "mental", readable: true, source: FOP,
    question: "When you make sense of something, do you go outside and gather facts, or inside and consult what you already sense?",
    about: "Uptime (sensory-external, present) versus downtime (internal, reflective).",
    poles: [
      { key: "uptime", label: "Uptime", sounds: "Reports what is happening now, external detail, 'I noticed', 'I saw'.", pacing: "Notice what's actually in front of you right now.", cues: ["i noticed", "i saw", "i heard", "right now", "at the moment", "in the room", "in front of me", "i observed", "i watched", "as it happened"] },
      { key: "downtime", label: "Downtime", sounds: "Goes inside, 'I was thinking', 'in my head', 'I imagined', reflective.", pacing: "Take a moment inside and let it come to you.", cues: ["in my head", "i was thinking", "i imagined", "i kept thinking", "in my mind", "i wondered", "i replayed", "i went over it", "daydream", "lost in thought", "i drifted"] },
    ] },
  { id: 5, key: "epistemology", name: "Epistemology sort", group: "mental", readable: true, source: FOP,
    question: "How do you know something is true: because you've seen the evidence, or because it fits what you sense underneath?",
    about: "Sensors (empirical, pragmatic) versus intuitors (visionary, rational).",
    poles: [
      { key: "sensor", label: "Sensor", sounds: "Evidence, facts, 'show me', practical, what happened.", pacing: "Here is what can actually be checked.", cues: ["the facts", "evidence", "proof", "show me", "practical", "realistic", "what actually happened", "concrete", "in practice", "hands-on", "prove"] },
      { key: "intuitor", label: "Intuitor", sounds: "Gut sense, hunches, possibilities, 'I just know', patterns.", pacing: "Trust the sense you already have of where this is going.", cues: ["my gut", "gut feeling", "hunch", "i just know", "instinct", "intuition", "a sense that", "something tells me", "i can tell", "vibe", "the potential", "possibilities"] },
    ] },
  { id: 6, key: "perceptualCategories", name: "Perceptual categories", group: "mental", readable: true, source: FOP,
    question: "Are things mostly clearly one way or the other, or mostly somewhere in between?",
    about: "Black-and-white (extremes) versus continuum (grays, degrees).",
    poles: [
      { key: "blackWhite", label: "Black-and-white", sounds: "All or nothing, either/or, best/worst, 'completely'.", pacing: "Some things are clearly one way, and this is one of them; where it isn't, we can say so.", cues: ["all or nothing", "either .{1,30} or", "black and white", "completely", "totally", "absolutely", "the worst", "the best", "perfect", "ruined", "disaster", "no middle", "100%"] },
      { key: "continuum", label: "Continuum", sounds: "Somewhat, partly, mostly, 'on a scale', degrees.", pacing: "Somewhere between those two is where this actually sits, and that's fine.", cues: ["somewhat", "partly", "mostly", "a bit", "kind of", "sort of", "to some extent", "on a scale", "more or less", "in between", "gray area", "grey area", "degrees", "depends"] },
    ] },
  { id: 7, key: "scenario", name: "Scenario thinking", group: "mental", readable: true, source: FOP,
    question: "When you think about what's coming, do you tend to run the best case or the worst case first?",
    about: "Best-case (optimist) versus worst-case (pessimist) scenario running.",
    poles: [
      { key: "bestCase", label: "Best case", sounds: "Hopefully, it'll work out, the upside, could go well.", pacing: "If this goes the way it could, here is what that looks like.", cues: ["hopefully", "it'll work out", "it will work out", "the upside", "could go well", "best case", "optimistic", "looking forward", "excited about", "the good news", "on the bright side", "silver lining"] },
      { key: "worstCase", label: "Worst case", sounds: "What if it fails, worst case, disaster, 'I just know it'll go wrong'.", pacing: "Let's name the worst version first, since you've already run it, and then see what actually holds.", cues: ["worst case", "what if (?:it|i|they|she|he) (?:fail|can't|don't|doesn't|goes wrong|falls)", "go wrong", "goes wrong", "disaster", "catastroph", "fall apart", "i just know it", "bound to", "inevitably", "doomed", "no matter what i do", "it never works"] },
    ] },
  { id: 8, key: "perceptualDurability", name: "Perceptual durability", group: "mental", readable: false, source: FOP,
    question: "When someone challenges a view you hold, does it bend easily or hold firm?",
    about: "Permeable (open, easily shifted) versus impermeable (fixed) perceptions and beliefs.",
    poles: [
      { key: "permeable", label: "Permeable", sounds: "Open to revision, takes in new information easily.", pacing: "You already let new information in; here is some." },
      { key: "impermeable", label: "Impermeable", sounds: "Holds a view against pressure; needs a lot of evidence.", pacing: "Nothing here asks you to change your mind; only to look at one more piece." },
    ] },
  { id: 9, key: "focus", name: "Focus sort", group: "mental", readable: true, source: FOP,
    question: "When there's a lot going on around you, do you screen most of it out or take most of it in?",
    about: "Screeners (filter stimuli) versus non-screeners (take everything in, easily overloaded).",
    poles: [
      { key: "screener", label: "Screener", sounds: "Tunes things out, single focus, 'I didn't notice'.", pacing: "Set everything else aside; there's just this one thing.", cues: ["tuned out", "tune out", "didn't notice", "focused on", "one thing at a time", "blocked it out", "ignore", "single-minded", "in the zone"] },
      { key: "nonScreener", label: "Non-screener", sounds: "Everything comes in at once, noise, crowds, 'too much going on'.", pacing: "A lot comes in at once for you, so let's make it quieter and smaller before we do anything.", cues: ["too much going on", "everything at once", "so much noise", "overstimulat", "can't tune it out", "distracted by everything", "sensory", "overload", "too loud", "too bright", "all the noise", "can't focus with"] },
    ] },
  { id: 10, key: "philosophicalDirection", name: "Philosophical direction", group: "mental", readable: true, source: FOP,
    question: "When something goes wrong, is the first question 'why did this happen?' or 'how do I fix it?'",
    about: "Why (origins, causes) versus how (solutions, process).",
    poles: [
      { key: "why", label: "Why (origins)", sounds: "'Why did', 'the reason', 'where it comes from', 'because of'.", pacing: "Once you understand why, the rest follows; so let's honor the why for a moment.", cues: ["why did", "why does", "why do i", "why is", "the reason", "where it comes from", "the cause", "root of", "what caused", "how did this start", "understand why", "the origin"] },
      { key: "how", label: "How (solutions)", sounds: "'How do I', 'what can I do', 'next step', 'fix', 'handle'.", pacing: "What matters is what to do next, so let's go straight there.", cues: ["how do i", "how can i", "what can i do", "next step", "fix it", "fix this", "handle it", "what should i do", "the solution", "a way to", "how to", "what works", "get past it"] },
    ] },
  { id: 11, key: "realityStructure", name: "Reality-structure sort", group: "mental", readable: true, source: FOP,
    question: "Do you experience things as fixed and fully knowable, or as processes still in motion?",
    about: "Aristotelian (static, this-is-what-it-is) versus non-Aristotelian (process, map-not-territory).",
    poles: [
      { key: "static", label: "Static", sounds: "'That's just how it is', 'I am', 'it's always been', fixed identities.", pacing: "It has been that way; and things that have a history also have a next chapter.", cues: ["that's just how it is", "that's just who i am", "it is what it is", "always been this way", "i am the kind of person", "i'm just", "people don't change", "that's the way", "set in stone", "it's a fact"] },
      { key: "process", label: "Process", sounds: "'Right now', 'so far', 'at this stage', 'becoming', 'in this context'.", pacing: "It's where things are right now, and 'right now' has a way of moving.", cues: ["right now", "so far", "at this stage", "at the moment", "for now", "in this context", "currently", "these days", "lately", "becoming", "in the process of", "working on", "changing"] },
    ] },
  { id: 12, key: "communicationChannel", name: "Communication-channel preference", group: "mental", readable: false, source: FOP,
    question: "Do you trust the words people say, or the way they say them?",
    about: "Verbal/digital (the words) versus non-verbal/analogue (tone, face, body) versus balanced.",
    poles: [
      { key: "verbal", label: "Verbal", sounds: "Quotes exact words; 'she said'.", pacing: "I'll say this in plain words." },
      { key: "nonVerbal", label: "Non-verbal", sounds: "Reads tone and face; 'the way she looked at me'.", pacing: "You read how it was said, and I'll take that seriously." },
      { key: "balanced", label: "Balanced", sounds: "Weighs both.", pacing: "Words and tone both count here." },
    ] },
  { id: 13, key: "emotionalCoping", name: "Emotional coping / stress response", group: "emotional", readable: true, source: FOP,
    question: "When you're under real pressure, do you go quiet and pull in, push back, or step out and look at it?",
    about: "Passivity (withdraw, go inside), aggression (push against), assertive/dissociated (step back and choose).",
    poles: [
      { key: "passive", label: "Passive (withdraw)", sounds: "Shuts down, goes quiet, 'I just gave up', 'I froze'.", pacing: "Pulling in has kept you safe before; no one is pushing you out of it.", cues: ["i froze", "shut down", "gave up", "went quiet", "hid", "i withdrew", "avoided", "couldn't move", "just took it", "didn't say anything", "kept it in", "went numb"] },
      { key: "aggressive", label: "Aggressive (push)", sounds: "Fights back, 'I lost it', 'I snapped', blames outward.", pacing: "You push back hard when it matters, and that force is usable.", cues: ["i lost it", "i snapped", "i yelled", "i exploded", "i fought", "pushed back", "i attacked", "i blew up", "lashed out", "i confronted", "i screamed", "slammed"] },
      { key: "assertive", label: "Assertive (step back)", sounds: "'I stepped back', 'I took a breath', chooses a response.", pacing: "You already step back before you answer, so let's use that.", cues: ["stepped back", "took a breath", "i paused", "calmly", "i decided to", "i chose to", "i asked for", "i said what i needed", "i set a limit", "i thought before"] },
    ] },
  { id: 14, key: "referenceFrame", name: "Frame of reference (authority sort)", group: "emotional", readable: true, source: FOP,
    question: "How do you know when you've done a good job: you just know inside, or someone tells you?",
    about: "Internal (self-referent) versus external (other-referent) evaluation; also circumstance and data referents.",
    poles: [
      { key: "internal", label: "Internal", sounds: "'I know', 'I decide', 'I feel it's right', 'for myself'.", pacing: "Only you can decide what's right here, and you will.", cues: ["i know what", "i decide", "i decided", "for myself", "my own", "i feel it's right", "i just know", "i don't need", "i'll be the judge", "my call", "i trust myself", "my standards", "on my own terms"] },
      { key: "external", label: "External", sounds: "'They said', 'what do you think?', 'am I doing this right?', 'everyone says'.", pacing: "Other people's views matter to you, so here is what has helped other people in this spot.", cues: ["what do you think", "am i doing this right", "everyone says", "they said", "my (?:doctor|therapist|mom|mother|dad|father|wife|husband|partner|boss|friend) (?:said|says|thinks|told)", "is that okay", "is that normal", "should i", "what would you do", "feedback", "approval", "tell me if", "am i wrong"] },
    ] },
  { id: 15, key: "emotionalState", name: "Emotional state sort", group: "emotional", readable: true, source: FOP,
    question: "When you talk about a hard time, are you back inside it, or looking at it from outside?",
    about: "Associated (inside the feeling, first person, present) versus dissociated (observer, past, third person).",
    poles: [
      { key: "associated", label: "Associated", sounds: "Present tense, 'I feel', 'right now', body words, feeling re-lived.", pacing: "You're right in it, and I'm here with you in it.", cues: ["i feel", "i'm feeling", "right now i", "my chest", "my stomach", "my heart", "i can't breathe", "it's happening", "i'm in it", "i'm shaking", "i'm crying", "so much"] },
      { key: "dissociated", label: "Dissociated", sounds: "Past tense, 'looking back', 'objectively', 'one could say', 'it was'.", pacing: "From where you're standing, looking at it, what do you notice?", cues: ["looking back", "objectively", "one could say", "in hindsight", "it was", "at the time", "i observed", "from a distance", "logically", "in retrospect", "i suppose", "one notices", "analytically"] },
    ] },
  { id: 16, key: "somaticResponse", name: "Somatic response sort", group: "emotional", readable: false, source: FOP,
    question: "When something needs doing, do you move first, think first, or wait?",
    about: "Active (acts fast), reflective (studies first), inactive (waits).",
    poles: [
      { key: "active", label: "Active", sounds: "Acts first, sorts it out later.", pacing: "You'll want to do something with this, so here's a first move." },
      { key: "reflective", label: "Reflective", sounds: "Studies before moving.", pacing: "Take the time to consider it; there's no hurry." },
      { key: "inactive", label: "Inactive", sounds: "Waits and sees.", pacing: "Nothing needs to happen yet; just noticing is enough for now." },
    ] },
  { id: 17, key: "convincer", name: "Convincer / believability sort", group: "emotional", readable: true, source: FOP,
    question: "How do you know something is true for you: it looks right, sounds right, feels right, or makes sense?",
    about: "The channel (looks/sounds/feels/makes sense/experienced it) and the frequency (once, several times, over time, never fully).",
    poles: [
      { key: "looksRight", label: "Looks right", sounds: "'I can see that', 'looks right'.", pacing: "See whether this looks right to you.", cues: ["looks right", "i can see that", "i see it", "looks good", "looks like it", "clearly"] },
      { key: "soundsRight", label: "Sounds right", sounds: "'That sounds right', 'rings true'.", pacing: "Listen to whether this sounds right.", cues: ["sounds right", "rings true", "sounds good", "i hear that", "sounds like"] },
      { key: "feelsRight", label: "Feels right", sounds: "'It feels right', 'my gut says'.", pacing: "Check whether this feels right in your body.", cues: ["feels right", "feels wrong", "feels off", "my gut", "feels good", "feels true", "in my bones"] },
      { key: "makesSense", label: "Makes sense", sounds: "'That makes sense', 'logically'.", pacing: "See whether this makes sense when you think it through.", cues: ["makes sense", "make sense", "logically", "that adds up", "reasonable", "i understand that", "that follows"] },
    ] },
  { id: 18, key: "emotionalDirection", name: "Emotional direction sort", group: "emotional", readable: false, source: FOP,
    question: "When one part of your life goes badly, does it stay there, or spread to everything?",
    about: "Uni-directional (one feeling colours everything) versus multi-directional (feelings stay in their context).",
    poles: [
      { key: "uniDirectional", label: "Uni-directional", sounds: "One bad thing and the whole day is bad.", pacing: "It's spread across everything for you right now; let's find one corner it hasn't reached." },
      { key: "multiDirectional", label: "Multi-directional", sounds: "Keeps feelings in their own compartments.", pacing: "This belongs to its own corner, and you keep it there well." },
    ] },
  { id: 19, key: "emotionalIntensity", name: "Emotional intensity / exuberance", group: "emotional", readable: true, source: FOP,
    question: "When you feel something, is it big and out loud, or quiet and held?",
    about: "Surgency (bold, expressive) versus desurgency (timid, contained).",
    poles: [
      { key: "surgency", label: "Surgency", sounds: "Big words, exclamation, 'amazing', 'unbelievable', 'so'.", pacing: "You feel things at full volume, and that's a lot of life.", cues: ["amazing", "unbelievable", "incredible", "so so", "!!", "insane", "absolutely", "thrilled", "furious", "devastated", "ecstatic", "wild"] },
      { key: "desurgency", label: "Desurgency", sounds: "'A little', 'somewhat', 'fine', 'okay I guess', hedged.", pacing: "You keep things quiet and measured, and that steadiness counts.", cues: ["a little", "somewhat", "i guess", "okay i guess", "fine, i suppose", "it's fine", "not too bad", "a bit", "sort of", "i suppose", "nothing much", "meh"] },
    ] },
  // ── Volitional / conative ──────────────────────────────────────────────
  { id: 20, key: "direction", name: "Direction sort (motivation)", group: "volitional", readable: true, source: FOP,
    question: "What do you want in a relationship / a job / your health? (Listen for what they move toward versus what they avoid.)",
    about: "Toward (goals, gain, possibility) versus away-from (avoid, prevent, escape the problem).",
    poles: [
      { key: "toward", label: "Toward", sounds: "'I want', 'achieve', 'get', 'so that I can', goals, gains.", pacing: "What you're moving toward is worth it, so let's aim straight at it.", cues: ["i want to", "i'd like to", "achieve", "accomplish", "get to", "gain", "so that i can", "so i can", "my goal", "aim", "reach", "build", "grow", "attain", "toward", "look forward", "i'm going to"] },
      { key: "awayFrom", label: "Away from", sounds: "'Avoid', 'stop', 'get rid of', 'don't want', 'so I don't', 'can't stand'.", pacing: "You know exactly what you don't want any more, and that's a clear place to start from.", cues: ["avoid", "stop (?:feeling|being|doing|having)", "get rid of", "don't want", "do not want", "so i don't", "so that i don't", "prevent", "escape", "get away from", "can't stand", "never again", "get out of", "not have to", "i hate", "sick of", "tired of", "away from"] },
    ] },
  { id: 21, key: "conation", name: "Conation adaptation (options/procedures)", group: "volitional", readable: true, source: FOP,
    question: "Why did you choose your current work? (Options answer with criteria and alternatives; procedures tell a story of how it happened.)",
    about: "Options (alternatives, possibilities, bending rules) versus procedures (the right way, steps, completing the sequence).",
    poles: [
      { key: "options", label: "Options", sounds: "'Could', 'alternatives', 'other ways', 'what if we', possibilities, dislikes fixed steps.", pacing: "There's more than one way to do this, and you get to choose which.", cues: ["alternatives", "other ways", "another way", "what if we", "what if i", "options", "possibilities", "could also", "or maybe", "or i could", "i could", "different ways", "choices", "flexible", "bend the rules", "my own way"] },
      { key: "procedures", label: "Procedures", sounds: "'The right way', 'first… then', 'the process', 'the steps', 'how it's done'.", pacing: "There's a right way to do this, step by step, and here's the first step.", cues: ["the right way", "the proper way", "first .{1,40} then", "the process", "the steps", "the procedure", "how it's done", "the rules", "in order", "the correct", "protocol", "the way you're supposed to", "follow", "the routine", "checklist"] },
    ] },
  { id: 22, key: "adaptation", name: "Adaptation sort (judging/perceiving)", group: "volitional", readable: true, source: FOP,
    question: "Do you like things decided and settled, or left open to see how they develop?",
    about: "Judging (control, closure, schedules) versus perceiving (float, adapt, keep options open).",
    poles: [
      { key: "judging", label: "Judging (controlling)", sounds: "'Plan', 'schedule', 'decide', 'settled', 'on time', 'organized'.", pacing: "Let's get this decided and on the calendar.", cues: ["plan", "schedule", "settled", "decided", "on time", "organized", "structure", "deadline", "get it done", "in control", "list", "agenda", "finalize", "commit"] },
      { key: "perceiving", label: "Perceiving (floating)", sounds: "'We'll see', 'go with the flow', 'keep it open', 'play it by ear', 'spontaneous'.", pacing: "No need to lock anything in; let's see how it unfolds.", cues: ["we'll see", "go with the flow", "keep it open", "play it by ear", "spontaneous", "wing it", "see what happens", "figure it out as", "no rush", "whatever happens", "last minute", "flexible", "open-ended"] },
    ] },
  { id: 23, key: "modalOperators", name: "Modal operators", group: "volitional", readable: true, source: FOP,
    question: "Listen to the verbs of operation: must, should, could, want, will, can't.",
    about: "Necessity (must/should), possibility (can/could), desire (want), impossibility (can't), choice (will/choose).",
    poles: [
      { key: "necessity", label: "Necessity", sounds: "Must, should, have to, need to, supposed to.", pacing: "Since you have to, let's make the having-to as light as possible.", cues: ["must", "should", "have to", "has to", "had to", "need to", "ought to", "supposed to", "got to", "gotta"] },
      { key: "possibility", label: "Possibility", sounds: "Can, could, might, may, possible.", pacing: "It's possible, and you can see the openings.", cues: ["i can", "i could", "might", "may be able", "possible", "it's possible", "there's a chance", "maybe i"] },
      { key: "desire", label: "Desire", sounds: "Want, wish, would love, hope.", pacing: "You want it, which is the engine for everything else.", cues: ["i want", "i wish", "would love", "i hope", "i'd like", "i long", "i crave", "i desire"] },
      { key: "impossibility", label: "Impossibility", sounds: "Can't, impossible, no way, unable.", pacing: "It has felt impossible; and 'impossible' has a way of shrinking when we look at what stops it.", cues: ["can't", "cannot", "couldn't", "impossible", "no way", "unable", "not able"] },
      { key: "choice", label: "Choice", sounds: "I will, I choose, I decide, I'm going to.", pacing: "You choose, and you're choosing now.", cues: ["i will", "i choose", "i decide", "i'm going to", "i'm choosing", "i've decided", "i commit"] },
    ] },
  { id: 24, key: "preference", name: "Preference sort (primary interest)", group: "volitional", readable: true, source: FOP,
    question: "Tell me about a favorite day. (Who, where, what, doing what, or the information?)",
    about: "People (who), place (where), things (what), activity (how, doing), information (data, why), time (when).",
    poles: [
      { key: "people", label: "People", sounds: "Names, relationships, who was there.", pacing: "It's about the people for you, so let's start with who.", cues: ["my (?:friend|friends|family|wife|husband|partner|kids|children|son|daughter|mom|mother|dad|father|brother|sister|team|coworker|colleague)", "people", "everyone", "together", "with them", "with him", "with her", "relationship", "who was there"] },
      { key: "place", label: "Place", sounds: "Where it happened, rooms, cities, settings.", pacing: "Where you are matters to you, so let's pick the right place for this.", cues: ["at home", "at work", "in the city", "the beach", "the mountains", "my room", "the office", "outside", "the house", "the kitchen", "the car", "place", "somewhere"] },
      { key: "things", label: "Things", sounds: "Objects, money, possessions, tools.", pacing: "Let's be concrete about the actual things involved.", cues: ["the money", "my car", "my phone", "the house", "stuff", "things", "the bill", "the equipment", "my computer", "possessions", "the gear"] },
      { key: "activity", label: "Activity", sounds: "Doing, verbs of action, 'we went', 'I played'.", pacing: "You'll want to do something with this, so here's the doing part.", cues: ["we went", "i played", "i ran", "i worked out", "i cooked", "we did", "doing", "activity", "i built", "i drove", "i trained", "hiking", "playing", "working on"] },
      { key: "information", label: "Information", sounds: "Data, facts, learning, 'I read that', 'I found out'.", pacing: "Here's the information, laid out so you can weigh it.", cues: ["i read that", "i found out", "the data", "the research", "facts", "information", "i learned", "statistics", "studies show", "the numbers", "i looked it up", "article"] },
    ] },
  { id: 25, key: "goalStriving", name: "Goal sort / adapting to expectations", group: "volitional", readable: true, source: FOP,
    question: "When a goal isn't fully met, is it a failure, a good-enough, or was it probably never going to work anyway?",
    about: "Perfectionism (must be complete and right), optimizing (do the best with what is), skepticism (goals are naive).",
    poles: [
      { key: "perfectionism", label: "Perfectionism", sounds: "'Not good enough', 'should have', 'has to be perfect', 'I failed'.", pacing: "Your standard is high, and we can hold it while still counting what's done.", cues: ["not good enough", "has to be perfect", "should have done", "i failed", "not right", "flawless", "no mistakes", "perfectly", "never enough", "i messed up", "every detail", "exactly right"] },
      { key: "optimizing", label: "Optimizing", sounds: "'Good enough', 'did what I could', 'better than before', progress.", pacing: "You make the most of what's there, so let's make the most of this.", cues: ["good enough", "did what i could", "better than before", "progress", "improving", "getting there", "a step", "close enough", "made the most", "worked with what"] },
      { key: "skepticism", label: "Skepticism", sounds: "'What's the point', 'goals don't work', 'why bother', 'it never works out'.", pacing: "You've seen goals fail, so nothing here asks you to believe in one; only to try one small thing and watch.", cues: ["what's the point", "why bother", "doesn't work", "never works", "pointless", "waste of time", "goals are", "i've tried everything", "nothing works", "won't work"] },
    ] },
  { id: 26, key: "valueBuying", name: "Value buying sort", group: "volitional", readable: true, source: FOP,
    question: "When you decide on something, what matters most: cost, convenience, quality, or time?",
    about: "Cost, convenience, quality or time as the deciding criterion.",
    poles: [
      { key: "cost", label: "Cost", sounds: "'Can't afford', 'how much', 'expensive', 'cheap'.", pacing: "Let's keep the cost in view the whole way.", cues: ["can't afford", "how much", "expensive", "cheap", "the price", "cost", "money", "budget", "worth it", "afford"] },
      { key: "convenience", label: "Convenience", sounds: "'Easy', 'hassle', 'simple', 'close by', 'no effort'.", pacing: "The easiest version of this is the one that will actually happen.", cues: ["easy", "hassle", "simple", "convenient", "close by", "no effort", "quick", "on the way", "effortless", "low-key"] },
      { key: "quality", label: "Quality", sounds: "'The best', 'done right', 'proper', 'well made'.", pacing: "Done right or not at all, so let's do it right.", cues: ["the best", "done right", "proper", "well made", "quality", "top", "thorough", "properly", "excellent", "high standard"] },
      { key: "time", label: "Time", sounds: "'How long', 'fast', 'no time', 'right away'.", pacing: "Time is the scarce thing, so this will be fast.", cues: ["how long", "fast", "no time", "right away", "quickly", "asap", "time-consuming", "takes forever", "immediately", "in a hurry"] },
    ] },
  { id: 27, key: "responsibility", name: "Responsibility sort", group: "volitional", readable: true, source: FOP,
    question: "When something goes wrong between you and someone else, whose fault does it usually feel like?",
    about: "Over-responsible (everything is on me), under-responsible (nothing is), balanced.",
    poles: [
      { key: "over", label: "Over-responsible", sounds: "'My fault', 'I should have', 'it's on me', 'I let them down'.", pacing: "You carry more than your share, so let's set down the part that isn't yours.", cues: ["my fault", "i should have", "it's on me", "i let (?:them|him|her|everyone) down", "i'm responsible for", "i have to fix", "if only i", "i caused", "i blame myself", "all on me"] },
      { key: "under", label: "Under-responsible", sounds: "'Their fault', 'not my problem', 'they made me', 'nothing I can do'.", pacing: "A lot of this wasn't yours; the part that is, is small enough to pick up.", cues: ["their fault", "his fault", "her fault", "not my problem", "they made me", "nothing i can do", "out of my hands", "not up to me", "they should", "it's on them", "wasn't me"] },
      { key: "balanced", label: "Balanced", sounds: "'My part was', 'we both', 'I own that, and'.", pacing: "You already see your part and theirs, which is the whole picture.", cues: ["my part", "we both", "i own that", "both of us", "partly me", "share of", "my share", "some of it was me"] },
    ] },
  { id: 28, key: "peopleConvincer", name: "People convincer sort", group: "volitional", readable: true, source: FOP,
    question: "Do you trust people until they show otherwise, or wait until they've earned it?",
    about: "Trusting (open until proven otherwise) versus distrusting (guarded until proven).",
    poles: [
      { key: "trusting", label: "Trusting", sounds: "'I believed them', 'gave the benefit of the doubt', open.", pacing: "You give people a chance, and that openness is a strength here.", cues: ["i believed", "benefit of the doubt", "i trusted", "i'm sure they meant", "they wouldn't", "i take people at", "good intentions"] },
      { key: "distrusting", label: "Distrusting", sounds: "'What do they want', 'can't trust', 'everyone has an angle', guarded.", pacing: "You keep your guard up for good reason; nothing here asks you to drop it.", cues: ["can't trust", "don't trust", "what do they want", "an angle", "ulterior", "guarded", "burned before", "let my guard", "suspicious", "people lie", "they'll turn"] },
    ] },
  // ── External response / output ─────────────────────────────────────────
  { id: 29, key: "rejuvenation", name: "Rejuvenation of battery", group: "response", readable: true, source: FOP,
    question: "After a hard week, what recharges you: people, or time alone?",
    about: "Extrovert (people restore), introvert (solitude restores), ambivert.",
    poles: [
      { key: "extrovert", label: "Extrovert", sounds: "'Being around people', 'friends', 'going out', 'talk it out'.", pacing: "Other people are where you get your energy back, so let's bring one in.", cues: ["around people", "going out", "with friends", "talk it out", "social", "party", "hang out", "be with people", "call someone", "company"] },
      { key: "introvert", label: "Introvert", sounds: "'Alone', 'quiet', 'by myself', 'recharge', 'peace and quiet'.", pacing: "Time alone is where you come back to yourself, and you're allowed it.", cues: ["alone", "by myself", "quiet", "recharge", "peace and quiet", "on my own", "solitude", "need space", "too many people", "drained by people", "my own company"] },
    ] },
  { id: 30, key: "affiliation", name: "Affiliation & management sort", group: "response", readable: true, source: FOP,
    question: "Do you work best on your own, as part of a team, or running the team?",
    about: "Independent, team player, manager (also dependent).",
    poles: [
      { key: "independent", label: "Independent", sounds: "'On my own', 'my way', 'don't need anyone'.", pacing: "You'll do this your own way, which is the way it'll get done.", cues: ["on my own", "my way", "don't need anyone", "independently", "by myself", "self-reliant", "without help", "handle it myself"] },
      { key: "team", label: "Team player", sounds: "'We', 'together', 'the team', 'my part'.", pacing: "You're part of something, and this is a piece you can carry for the group.", cues: ["together", "the team", "we all", "my part", "as a group", "everyone pitched", "collaborate", "with others", "our"] },
      { key: "manager", label: "Manager", sounds: "'I organized', 'I delegated', 'got everyone to', 'in charge'.", pacing: "You run things, so here's what to run.", cues: ["i organized", "i delegated", "got everyone to", "in charge", "i led", "coordinated", "i ran", "took the lead", "responsible for the team"] },
      { key: "dependent", label: "Dependent", sounds: "'I need someone to', 'can't do it alone', 'tell me what to do'.", pacing: "Having someone alongside makes this doable, so let's pick who.", cues: ["need someone to", "can't do it alone", "tell me what to do", "need help with", "someone to hold", "can't without"] },
    ] },
  { id: 31, key: "satirStance", name: "Communication stance (Satir categories)", group: "response", readable: true, source: FOP,
    question: "Under stress, which way do you lean: blaming, placating, computing, distracting, or leveling?",
    about: "Satir's five stress stances: blamer, placater, computer (super-reasonable), distracter, leveler.",
    poles: [
      { key: "blamer", label: "Blamer", sounds: "'You always', 'it's your fault', 'you never', 'they should have'.", pacing: "You're clear about what others did; let's keep that and add what you need.", cues: ["you always", "you never", "your fault", "they should have", "he should have", "she should have", "if they had", "because of them", "they never", "it's them"] },
      { key: "placater", label: "Placater", sounds: "'Sorry', 'whatever you want', 'it's fine', 'don't worry about me', 'my fault'.", pacing: "You keep the peace; and your side counts just as much here.", cues: ["i'm sorry", "sorry", "whatever you want", "it's fine", "don't worry about me", "i don't mind", "it doesn't matter", "i'll be okay", "no big deal", "i didn't want to bother"] },
      { key: "computer", label: "Computer", sounds: "'One might say', 'logically', 'it seems reasonable', no feeling words.", pacing: "Let's stay reasonable and precise about it.", cues: ["one might", "logically", "it seems reasonable", "rationally", "the data suggests", "objectively", "in theory", "one could argue", "statistically", "it is evident"] },
      { key: "distracter", label: "Distracter", sounds: "Jumps topic, jokes it off, 'anyway', 'whatever, so'.", pacing: "We can come at this sideways, no need to stare straight at it.", cues: ["anyway", "whatever", "haha", "lol", "moving on", "never mind", "forget it", "it's funny", "random but", "speaking of"] },
      { key: "leveler", label: "Leveler", sounds: "'I feel X when Y', 'I need', 'here's what's true for me'.", pacing: "You say it straight, so I will too.", cues: ["i feel .{1,30} when", "i need", "what's true for me", "honestly,? i", "here's where i am", "i'd like you to", "what i want is", "the truth is"] },
    ] },
  { id: 32, key: "generalResponse", name: "General response", group: "response", readable: true, source: FOP,
    question: "When someone tells you what to do, do you go along, push the other way, or step above it?",
    about: "Congruent/incongruent; competitive/cooperative; polarity (opposite) / meta (above) responders.",
    poles: [
      { key: "cooperative", label: "Cooperative", sounds: "'Sure', 'okay, let's', 'that works', goes along.", pacing: "Let's do it together, then.", cues: ["sure", "okay,? let's", "that works", "sounds good", "i'm in", "let's try", "happy to", "fine by me"] },
      { key: "competitive", label: "Competitive", sounds: "'I'll beat', 'better than them', 'win', 'prove'.", pacing: "You want to win this, and you can.", cues: ["beat", "better than them", "win", "prove them wrong", "outdo", "competition", "on top", "first place", "ahead of"] },
      { key: "polarity", label: "Polarity", sounds: "Says the opposite of whatever is offered: 'no', 'that won't work', 'actually the reverse'.", pacing: "You'll probably see it the other way, and you might be right; so tell me where I've got it backwards.", cues: ["that won't work", "no, actually", "the opposite", "the reverse", "i disagree", "that's wrong", "not true", "nope", "don't tell me", "you can't make me"] },
      { key: "meta", label: "Meta", sounds: "Steps above: 'what's really going on here is', 'the pattern is', comments on the process.", pacing: "You've already stepped above it; from up there, what do you see?", cues: ["what's really going on", "the pattern is", "the bigger question", "at a higher level", "the real issue", "the process here", "the dynamic", "meta", "underneath all this"] },
    ] },
  { id: 33, key: "workPreference", name: "Work preference sort", group: "response", readable: true, source: FOP,
    question: "What do you most like to work with: things, systems, people, or information?",
    about: "Things, systems, people or information as the preferred medium of work.",
    poles: [
      { key: "things", label: "Things", sounds: "Hands-on, building, tools, objects.", pacing: "Something concrete to build or fix will suit you.", cues: ["hands-on", "build", "fix", "tools", "machine", "the parts", "tinker", "craft", "repair", "physical"] },
      { key: "systems", label: "Systems", sounds: "Processes, how it all fits, workflows.", pacing: "Let's map how the pieces connect.", cues: ["the system", "process", "workflow", "how it all fits", "structure", "organize", "the framework", "pipeline", "how it works"] },
      { key: "people", label: "People", sounds: "Helping, teaching, relationships.", pacing: "This is people work, which is your kind.", cues: ["helping people", "teaching", "the team", "relationships", "clients", "patients", "students", "customers", "coaching", "supporting"] },
      { key: "information", label: "Information", sounds: "Research, data, learning, ideas.", pacing: "Here's the information to work with.", cues: ["research", "the data", "learning", "ideas", "reading", "analysis", "knowledge", "figures", "study", "theory"] },
    ] },
  { id: 34, key: "comparison", name: "Comparison sort", group: "response", readable: true, source: FOP,
    question: "When you judge how it went, do you count or do you describe?",
    about: "Quantitative (numbers, ranks) versus qualitative (descriptions, qualities).",
    poles: [
      { key: "quantitative", label: "Quantitative", sounds: "Numbers, percentages, 'how many', ranks, scores.", pacing: "Here are the numbers.", cues: ["\\d+%", "\\d+ out of \\d+", "how many", "the number", "score", "rank", "count", "percent", "twice", "three times", "\\d+ (?:days|times|hours|pounds|dollars)"] },
      { key: "qualitative", label: "Qualitative", sounds: "'It felt', 'the quality', descriptive adjectives, 'the kind of'.", pacing: "Here's what it's like.", cues: ["the quality", "the kind of", "it felt", "the way it", "the feel of", "the tone of", "the character", "what it's like", "the nature of", "rich", "warm", "hollow"] },
    ] },
  { id: 35, key: "knowledgeSource", name: "Knowledge sort", group: "response", readable: true, source: FOP,
    question: "How do you learn something new: by watching someone, thinking it through, seeing it demonstrated, doing it, or being told by an authority?",
    about: "Modeling, conceptualizing, demonstrating, experiencing, authorizing.",
    poles: [
      { key: "modeling", label: "Modeling", sounds: "'I watched how they', 'copied', 'like she does'.", pacing: "Watch how someone who does this well does it, and borrow it.", cues: ["i watched how", "copied", "like she does", "like he does", "picked it up from", "imitate", "the way they do it", "learned by watching"] },
      { key: "conceptualizing", label: "Conceptualizing", sounds: "'Once I understood the idea', 'the concept', 'in theory'.", pacing: "Once the idea is clear the doing follows, so here's the idea.", cues: ["the concept", "the idea behind", "in theory", "once i understood", "the principle", "the model", "the theory", "conceptually", "the logic"] },
      { key: "demonstrating", label: "Demonstrating", sounds: "'Show me', 'saw it done', 'a demo'.", pacing: "Let me show you rather than tell you.", cues: ["show me", "saw it done", "demo", "demonstrat", "walk me through", "an example", "let me see it"] },
      { key: "experiencing", label: "Experiencing", sounds: "'I had to do it myself', 'trial and error', 'hands on'.", pacing: "You learn by doing, so let's do a small version now.", cues: ["do it myself", "trial and error", "hands on", "by doing", "i tried it", "practice", "learned the hard way", "experience"] },
      { key: "authorizing", label: "Authorizing", sounds: "'The doctor said', 'according to', 'the experts', 'the book says'.", pacing: "Here is what the people who study this say.", cues: ["the doctor said", "according to", "the experts", "the book says", "research says", "my therapist said", "the guidelines", "officially", "studies show", "the professionals"] },
    ] },
  { id: 36, key: "closure", name: "Completion / closure sort", group: "response", readable: true, source: FOP,
    question: "Do you need things finished and settled, or are you fine leaving them open?",
    about: "Closure (finish, decide, settle) versus non-closure (keep open, unfinished is fine).",
    poles: [
      { key: "closure", label: "Closure", sounds: "'Finish', 'done', 'settled', 'get it over with', 'decide already'.", pacing: "Let's get this to done.", cues: ["finish", "done with it", "settled", "get it over with", "decide already", "closure", "wrap it up", "resolved", "once and for all", "complete", "checked off"] },
      { key: "nonClosure", label: "Non-closure", sounds: "'Leave it open', 'we'll see', 'no rush', 'not decided'.", pacing: "Nothing has to be finished today.", cues: ["leave it open", "we'll see", "no rush", "not decided", "still thinking", "keep it going", "unfinished", "open-ended", "later", "someday", "not yet"] },
    ] },
  { id: 37, key: "socialPresentation", name: "Social presentation", group: "response", readable: false, source: FOP,
    question: "In company, do you manage how you come across, or just come across?",
    about: "Shrewd and artful (managed impression) versus genuine and artless (unmanaged).",
    poles: [
      { key: "artful", label: "Shrewd & artful", sounds: "Manages impressions, chooses words for effect.", pacing: "You'll present this well; here's the substance to present." },
      { key: "artless", label: "Genuine & artless", sounds: "Says it as it is, unpolished.", pacing: "Plain and unpolished is exactly right here." },
    ] },
  { id: 38, key: "dominance", name: "Hierarchical dominance sort", group: "response", readable: true, source: FOP,
    question: "What do you most want from a situation: to be in charge, to belong, or to achieve something?",
    about: "Power (control, influence), affiliation (belonging), achievement (accomplishment).",
    poles: [
      { key: "power", label: "Power", sounds: "'In control', 'in charge', 'influence', 'my way', 'respect'.", pacing: "You want the controls, and this puts them in your hands.", cues: ["in control", "in charge", "influence", "my way", "respect me", "authority", "the say", "call the shots", "power", "dominate", "lead"] },
      { key: "affiliation", label: "Affiliation", sounds: "'Belong', 'included', 'together', 'liked', 'connected'.", pacing: "You want to belong, and you do belong here.", cues: ["belong", "included", "together", "liked", "connected", "part of", "close to", "accepted", "fit in", "left out", "lonely", "welcome"] },
      { key: "achievement", label: "Achievement", sounds: "'Accomplish', 'succeed', 'get it done', 'results', 'progress'.", pacing: "You want results, and here's one you can get today.", cues: ["accomplish", "succeed", "get it done", "results", "progress", "achieve", "goal", "milestone", "productive", "win", "made it"] },
    ] },
  // ── Meta meta-programs ─────────────────────────────────────────────────
  { id: 39, key: "values", name: "Values sort", group: "meta", readable: true, source: FOP,
    question: "What's important to you about this?",
    about: "The criteria a person sorts by: safety, freedom, connection, achievement, health, family, honesty, growth, peace, control.",
    poles: [
      { key: "safety", label: "Safety / security", sounds: "Safe, secure, stable, protected.", pacing: "Keeping things safe comes first for you, and this keeps them safe.", cues: ["safe", "secure", "stable", "protect", "security", "certainty", "stability", "reliable"] },
      { key: "freedom", label: "Freedom / autonomy", sounds: "Free, independent, my choice, no one telling me.", pacing: "This leaves you free to choose, which is the point.", cues: ["freedom", "free to", "independence", "my choice", "no one telling me", "autonomy", "on my terms", "unrestricted"] },
      { key: "connection", label: "Connection / love", sounds: "Close, loved, belong, family, together.", pacing: "It comes back to the people you love, so let's keep them in the picture.", cues: ["love", "close", "family", "belong", "together", "connection", "intimacy", "relationship", "cared for"] },
      { key: "growth", label: "Growth / learning", sounds: "Learn, grow, improve, become.", pacing: "Every part of this is something you get to learn.", cues: ["learn", "grow", "improve", "become", "develop", "better myself", "progress", "evolve", "expand"] },
      { key: "health", label: "Health", sounds: "Healthy, well, energy, sleep, strong.", pacing: "Your health is the ground under everything else, so we start there.", cues: ["healthy", "health", "well-being", "wellbeing", "energy", "sleep", "strong", "fit", "my body"] },
      { key: "honesty", label: "Honesty / integrity", sounds: "Truth, honest, real, integrity, fair.", pacing: "You want it straight and true, and that's how it'll be said.", cues: ["honest", "the truth", "integrity", "real", "genuine", "fair", "authentic", "straight"] },
      { key: "peace", label: "Peace / calm", sounds: "Peace, calm, quiet, rest, ease.", pacing: "Peace is the thing you're after, so let's make this a calmer place to stand.", cues: ["peace", "calm", "quiet", "rest", "ease", "serenity", "still", "tranquil", "relax"] },
      { key: "achievement", label: "Achievement / success", sounds: "Success, accomplish, results, win.", pacing: "You want to achieve something real, and this is a real step.", cues: ["success", "accomplish", "results", "win", "achieve", "recognition", "excel", "career"] },
    ] },
  { id: 40, key: "temperToInstruction", name: "Temper to instruction", group: "meta", readable: true, source: FOP,
    question: "When someone tells you what to do, do you comply, or dig in?",
    about: "Strong-willed (resists instruction) versus compliant (follows it).",
    poles: [
      { key: "strongWilled", label: "Strong-willed", sounds: "'Don't tell me what to do', 'I'll decide', 'nobody makes me'.", pacing: "No one is going to tell you what to do here; you'll decide what's worth taking.", cues: ["don't tell me what to do", "i'll decide", "nobody makes me", "i won't be told", "stubborn", "my own mind", "i refuse", "make me", "i don't take orders"] },
      { key: "compliant", label: "Compliant", sounds: "'Just tell me what to do', 'I'll do whatever', 'if that's what you think'.", pacing: "Here's a clear thing to do, and doing it is enough.", cues: ["just tell me what to do", "i'll do whatever", "if that's what you think", "whatever you say", "i did what they said", "i went along", "i followed", "as instructed"] },
    ] },
  { id: 41, key: "selfEsteem", name: "Self-esteem sort", group: "meta", readable: true, source: FOP,
    question: "Is your worth something you have to earn, or something you have?",
    about: "Conditional (earned by performance) versus unconditional self-esteem; high versus low.",
    poles: [
      { key: "conditional", label: "Conditional", sounds: "'Only worth something if', 'I have to earn', 'when I succeed I'm okay'.", pacing: "You've tied your worth to what you produce; and today's worth can be counted without producing anything.", cues: ["only worth", "have to earn", "when i succeed", "if i can't .{1,30} then i'm", "i'm only", "deserve it when", "prove my worth", "not worth anything unless", "earn my place"] },
      { key: "unconditional", label: "Unconditional", sounds: "'I'm okay regardless', 'my worth isn't about', 'I matter anyway'.", pacing: "You know your worth doesn't depend on this, so this is only about the doing.", cues: ["okay regardless", "my worth isn't", "i matter anyway", "regardless of", "whether or not i", "i'm enough", "still worth", "no matter what happens i"] },
    ] },
  { id: 42, key: "selfConfidence", name: "Self-confidence sort", group: "meta", readable: true, source: FOP,
    question: "Do you trust your ability to handle what comes, or doubt it?",
    about: "High versus low confidence in one's skills, distinct from self-esteem (worth).",
    poles: [
      { key: "high", label: "High", sounds: "'I can handle it', 'I've done harder', 'I'll figure it out'.", pacing: "You'll handle this; you've handled harder.", cues: ["i can handle", "i've done harder", "i'll figure it out", "i've got this", "i'm good at", "i know how", "capable", "i can do this", "no problem"] },
      { key: "low", label: "Low", sounds: "'I can't do this', 'I'm not good at', 'I'll mess it up', 'who am I to'.", pacing: "You don't have to be sure you can; you only have to do the first small piece and see.", cues: ["i can't do this", "not good at", "i'll mess it up", "who am i to", "i'm not capable", "i'll fail", "out of my depth", "not smart enough", "i'm useless at", "i always screw"] },
    ] },
  { id: 43, key: "selfExperience", name: "Self-experience sort", group: "meta", readable: true, source: FOP,
    question: "When you think of yourself, what is 'you' mostly: your mind, your feelings, your will, your body, your role, or your spirit?",
    about: "Where identity is located: mind, emotion, will, body, role/position, spirit.",
    poles: [
      { key: "mind", label: "Mind", sounds: "'I think', 'my thoughts', 'intellectually'.", pacing: "You live in your thinking, so let's think this through.", cues: ["my thoughts", "my mind", "intellectually", "i think therefore", "my ideas", "rational", "my intelligence"] },
      { key: "emotion", label: "Emotion", sounds: "'I feel', 'my heart', 'emotionally'.", pacing: "Your feelings are where you live, so we start there.", cues: ["my feelings", "my heart", "emotionally", "i'm an emotional", "sensitive", "i feel everything"] },
      { key: "will", label: "Will", sounds: "'I decide', 'my choice', 'determined'.", pacing: "You're a person of will, and this is a decision you can make.", cues: ["i decide", "my choice", "determined", "willpower", "i choose", "my will", "disciplined"] },
      { key: "body", label: "Body", sounds: "'My body', 'physically', 'my energy', athletic.", pacing: "You know yourself through your body, so let's start with what it's telling you.", cues: ["my body", "physically", "my energy", "athletic", "my strength", "my health", "in my bones", "i'm physical"] },
      { key: "role", label: "Role / position", sounds: "'As a mother', 'as a doctor', 'my job is', 'in my position'.", pacing: "You carry a role, and the role can carry this too.", cues: ["as a (?:mother|father|mom|dad|doctor|nurse|physician|teacher|husband|wife|parent|leader|professional|provider|boss)", "my job is", "in my position", "my role", "as the one who", "my title"] },
      { key: "spirit", label: "Spirit", sounds: "'My soul', 'God', 'faith', 'my purpose', 'spiritually'.", pacing: "You are anchored in something larger, and that anchor holds here.", cues: ["my soul", "god", "faith", "my purpose", "spiritually", "prayer", "my spirit", "the lord", "calling", "scripture", "church"] },
    ] },
  { id: 44, key: "selfIntegrity", name: "Self-integrity sort", group: "meta", readable: true, source: FOP,
    question: "Do the parts of you pull together, or against each other?",
    about: "Conflicted incongruity (parts at war) versus harmonious integration.",
    poles: [
      { key: "conflicted", label: "Conflicted", sounds: "'Part of me… but part of me', 'torn', 'I want to but I don't', 'at war with myself'.", pacing: "Two parts of you want different things, and both are trying to help; we can let each one speak.", cues: ["part of me", "torn", "i want to but", "at war with myself", "mixed feelings", "two minds", "conflicted", "half of me", "on one hand", "i don't know what i want", "contradict"] },
      { key: "integrated", label: "Integrated", sounds: "'All of me', 'I'm clear', 'lined up', 'whole'.", pacing: "You're lined up on this, so the doing is straightforward.", cues: ["all of me", "i'm clear", "lined up", "whole", "aligned", "at peace with", "i'm settled on", "no doubt", "congruent", "of one mind"] },
    ] },
  { id: 45, key: "timeTenses", name: "Time tenses sort", group: "meta", readable: true, source: FOP,
    question: "Where do you spend most of your attention: what happened, what's happening, or what will happen?",
    about: "Past, present or future orientation.",
    poles: [
      { key: "past", label: "Past", sounds: "'Back then', 'used to', 'when I was', 'what happened'.", pacing: "What happened matters, and it's the ground we stand on to look forward.", cues: ["back then", "used to", "when i was", "what happened", "years ago", "i remember", "last (?:year|month|week|time)", "before", "the old days", "i had", "i did", "i was"] },
      { key: "present", label: "Present", sounds: "'Right now', 'today', 'currently', 'this moment'.", pacing: "Right now is the only place anything can be done, and you're here.", cues: ["right now", "today", "currently", "this moment", "at the moment", "these days", "i am", "i'm", "now"] },
      { key: "future", label: "Future", sounds: "'Will', 'going to', 'someday', 'next year', 'what if'.", pacing: "You're already looking ahead, so let's make what's ahead specific.", cues: ["will", "going to", "someday", "next (?:year|month|week|time)", "what if", "in the future", "eventually", "one day", "plan to", "i'll", "tomorrow", "later"] },
    ] },
  { id: 46, key: "timeExperience", name: "Time experience sort", group: "meta", readable: true, source: FOP,
    question: "Do you lose track of time when absorbed, or always know roughly what time it is?",
    about: "In-time (inside the moment, loses time, random) versus through-time (sees time laid out, punctual, sequential).",
    poles: [
      { key: "inTime", label: "In-time", sounds: "'Lost track of time', 'in the moment', late, absorbed.", pacing: "You're in the moment, so let's stay in this one.", cues: ["lost track of time", "in the moment", "i was late", "absorbed", "before i knew it", "hours went by", "i forgot the time", "caught up in"] },
      { key: "throughTime", label: "Through-time", sounds: "'On schedule', 'planned', 'timeline', 'by then', punctual.", pacing: "Let's lay it out on a timeline.", cues: ["on schedule", "timeline", "by then", "punctual", "on time", "at exactly", "the calendar", "planned out", "in sequence", "the timing"] },
    ] },
  { id: 47, key: "timeAccess", name: "Time access sort", group: "meta", readable: true, source: FOP,
    question: "When you remember, does it come in order, or in whatever order it comes?",
    about: "Sequential (ordered recall) versus random (associative recall).",
    poles: [
      { key: "sequential", label: "Sequential", sounds: "'First… then… after that', ordered narrative.", pacing: "Let's take it in order.", cues: ["first", "then", "after that", "next", "finally", "in order", "step", "sequence", "afterwards", "before that"] },
      { key: "random", label: "Random", sounds: "'Oh, and also', 'that reminds me', jumps around.", pacing: "It comes as it comes, and that's fine; I'll keep track.", cues: ["oh, and", "that reminds me", "also", "by the way", "wait, i forgot", "going back", "and another thing", "random"] },
    ] },
  { id: 48, key: "egoStrength", name: "Ego strength sort", group: "meta", readable: true, source: FOP,
    question: "When life hits hard, do you bend and recover, or come apart?",
    about: "Stable (recovers, stays oriented) versus unstable (overwhelmed, disorganized) under pressure.",
    poles: [
      { key: "stable", label: "Stable", sounds: "'I got through it', 'I bounced back', 'it was hard and I managed'.", pacing: "You've come back from hard things before; this is another one of those.", cues: ["got through it", "bounced back", "i managed", "i coped", "i recovered", "i kept going", "i held it together", "survived", "i'm still here", "weathered"] },
      { key: "unstable", label: "Unstable", sounds: "'Falling apart', 'can't cope', 'losing it', 'breaking down'.", pacing: "It's too much right now; so we make it smaller before anything else.", cues: ["falling apart", "can't cope", "losing it", "breaking down", "coming apart", "can't hold on", "unraveling", "spiraling", "losing control", "can't function"] },
    ] },
  { id: 49, key: "morality", name: "Morality sort", group: "meta", readable: true, source: FOP,
    question: "How much does 'should' weigh on you?",
    about: "Strong superego (heavy conscience, guilt) versus weak superego (light conscience).",
    poles: [
      { key: "strong", label: "Strong conscience", sounds: "'I feel guilty', 'I should have', 'it's wrong of me', 'ashamed'.", pacing: "Your conscience is loud, which means you care; let's let it be fair as well as loud.", cues: ["i feel guilty", "guilt", "ashamed", "it's wrong of me", "i shouldn't have", "i should have", "sinful", "i let myself down", "i feel terrible for", "my fault"] },
      { key: "weak", label: "Light conscience", sounds: "'Whatever', 'no big deal', 'they had it coming', unbothered.", pacing: "You don't carry much guilt, so we can look at consequences plainly.", cues: ["no big deal", "whatever", "had it coming", "don't feel bad", "so what", "not my concern", "i don't care what", "who cares"] },
    ] },
  { id: 50, key: "causation", name: "Causational sort", group: "meta", readable: true, source: FOP,
    question: "Why do you think this happened?",
    about: "How cause is attributed: causeless (it just happens), linear, multi-causal, personal (my fault), external (their fault), magical (fate), correlational.",
    poles: [
      { key: "causeless", label: "Causeless", sounds: "'It just happened', 'no reason', 'random'.", pacing: "It seemed to come from nowhere; and things that come from nowhere can go back there.", cues: ["it just happened", "no reason", "random", "out of nowhere", "for no reason", "just does", "it just is"] },
      { key: "personal", label: "Personal", sounds: "'Because of me', 'I caused', 'my fault'.", pacing: "You point at yourself first; let's check whether all of it points there.", cues: ["because of me", "i caused", "my fault", "i made this happen", "i did this", "my doing", "i brought this on"] },
      { key: "external", label: "External", sounds: "'Because of them', 'the system', 'they did this'.", pacing: "A lot of it came from outside; let's find the small part that's in your hands.", cues: ["because of them", "the system", "they did this", "their doing", "the government", "my parents made", "society", "the economy", "he did this to me"] },
      { key: "magical", label: "Magical / fate", sounds: "'Meant to be', 'karma', 'cursed', 'luck', 'the universe'.", pacing: "It feels like fate; and even fate leaves the next step to you.", cues: ["meant to be", "karma", "cursed", "bad luck", "the universe", "fate", "destiny", "jinxed", "written", "the stars"] },
      { key: "multiCausal", label: "Multi-causal", sounds: "'A lot of things came together', 'partly this, partly that'.", pacing: "You see the several threads, so we can pick one to pull.", cues: ["a lot of things", "partly", "several reasons", "came together", "a combination", "many factors", "a mix of", "on top of", "it all added up"] },
    ] },
  { id: 51, key: "abstraction", name: "Concrete / abstract sort", group: "meta", readable: true, source: "Catalog addition (Korzybski's levels of abstraction, via Hall)",
    question: "When you describe what's wrong, do you tell me what happened, or what it means?",
    about: "Concrete (events, sensory description) versus abstract (meanings, concepts, labels).",
    poles: [
      { key: "concrete", label: "Concrete", sounds: "Who did what, where, when; sensory detail.", pacing: "Tell me exactly what happened, and we'll work from that.", cues: ["he said", "she said", "i said", "at \\d", "in the (?:kitchen|car|office|bedroom|hallway|meeting)", "on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)", "i saw", "i heard", "then i", "she walked", "he looked"] },
      { key: "abstract", label: "Abstract", sounds: "Meaning, identity, 'the relationship', 'trust', 'my life', concepts.", pacing: "Let's take the big idea and find one concrete example of it.", cues: ["the relationship", "trust", "my life", "the meaning", "what it means", "the dynamic", "our communication", "my identity", "the concept", "in general", "everything", "my whole"] },
    ] },
];

export const META_PROGRAM_BY_KEY: Record<string, MetaProgram> = Object.fromEntries(META_PROGRAMS.map(m => [m.key, m]));

// ─── Reading ─────────────────────────────────────────────────────────────────

export interface PoleScore { key: string; label: string; hits: number; share: number; evidence: string[] }

export interface MetaProgramReading {
  id: number;
  key: string;
  name: string;
  group: MetaProgramGroup;
  poles: PoleScore[];
  /** The leading pole, or null when nothing was read. */
  leading: PoleScore | null;
  /** For two-pole programs: −1 (first pole) … +1 (second pole). Null otherwise. */
  slider: number | null;
  /** 0–1: rises with hits and with the margin between the top two poles. */
  confidence: number;
  /** The pacing line for the leading pole. */
  pacing: string | null;
  basis: string;
}

interface CompiledCue { program: string; pole: string; re: RegExp }
let CUES: CompiledCue[] | null = null;
function cues(): CompiledCue[] {
  if (!CUES) {
    CUES = [];
    for (const p of META_PROGRAMS) for (const pole of p.poles) for (const c of pole.cues ?? []) {
      const body = /^[\\(\[]/.test(c) || /\\d/.test(c) ? c : c;
      CUES.push({ program: p.key, pole: pole.key, re: new RegExp(`(?:^|[^a-z0-9'])(${body})(?![a-z0-9])`, "gi") });
    }
  }
  return CUES;
}

function normalize(text: unknown): string {
  return String(text ?? "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

const BASIS = "Meta-programs after Hall & Bodenhamer (Figuring Out People). A conversational structure, not a validated instrument; readings drift with state and context.";

/**
 * Read the meta-programs that show in a window of texts. The representational
 * system (#3) is read by repSystems.ts and merged here.
 */
export function readMetaPrograms(texts: readonly unknown[] | unknown): MetaProgramReading[] {
  const list = Array.isArray(texts) ? texts : [texts];
  const joined = list.map(normalize).filter(Boolean).join(" \n ");
  const hits = new Map<string, { n: number; ev: string[] }>();
  if (joined) {
    for (const c of cues()) {
      c.re.lastIndex = 0;
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = c.re.exec(joined)) !== null && guard++ < 500) {
        if (m[0].length === 0) { c.re.lastIndex++; continue; }
        const k = `${c.program}:${c.pole}`;
        const cur = hits.get(k) ?? { n: 0, ev: [] };
        cur.n += 1;
        if (cur.ev.length < 4 && !cur.ev.includes(m[1])) cur.ev.push(m[1]);
        hits.set(k, cur);
      }
    }
  }
  const rep = readRepSystem(joined);
  const out: MetaProgramReading[] = [];
  for (const p of META_PROGRAMS) {
    const poles: PoleScore[] = p.poles.map(pole => {
      if (p.key === "repSystem") {
        const s = pole.key as RepSystem;
        const n = rep.counts[s] ?? 0;
        return { key: pole.key, label: pole.label, hits: n, share: 0, evidence: rep.hits.filter(h => h.system === s).slice(0, 4).map(h => h.word) };
      }
      const h = hits.get(`${p.key}:${pole.key}`);
      return { key: pole.key, label: pole.label, hits: h?.n ?? 0, share: 0, evidence: h?.ev ?? [] };
    });
    const total = poles.reduce((a, s) => a + s.hits, 0);
    if (total > 0) for (const s of poles) s.share = Math.round((s.hits / total) * 100) / 100;
    const ranked = [...poles].sort((a, b) => b.hits - a.hits);
    const leading = total > 0 ? ranked[0] : null;
    const margin = total > 0 ? (ranked[0].hits - (ranked[1]?.hits ?? 0)) / total : 0;
    const confidence = total > 0 ? Math.round(Math.min(1, 0.1 + 0.5 * Math.min(1, total / 6) + 0.4 * margin) * 100) / 100 : 0;
    let slider: number | null = null;
    if (poles.length === 2 && total > 0) slider = Math.round(((poles[1].hits - poles[0].hits) / total) * 100) / 100;
    const pacing = leading ? p.poles.find(x => x.key === leading.key)?.pacing ?? null : null;
    out.push({ id: p.id, key: p.key, name: p.name, group: p.group, poles, leading, slider, confidence, pacing, basis: BASIS });
  }
  return out;
}

/** Only the programs that showed, strongest first. */
export function salientMetaPrograms(readings: readonly MetaProgramReading[], minConfidence = 0.3, limit = 8): MetaProgramReading[] {
  return readings.filter(r => r.leading && r.confidence >= minConfidence).sort((a, b) => b.confidence - a.confidence).slice(0, limit);
}

/** The pacing lines the companion can draw on, strongest programs first. */
export function pacingLines(readings: readonly MetaProgramReading[], limit = 3): string[] {
  return salientMetaPrograms(readings, 0.3, limit).map(r => r.pacing!).filter(Boolean);
}

/** A block for a server-owned system prompt. */
export function metaProgramsPromptBlock(readings: readonly MetaProgramReading[]): string {
  const s = salientMetaPrograms(readings, 0.3, 6);
  if (!s.length) return "META-PROGRAMS: nothing reliable yet. Ask one open question and listen for toward/away, options/procedures, and who they check with (internal/external).";
  const lines = s.map(r => `- ${r.name}: ${r.leading!.label} (confidence ${r.confidence}; heard: ${r.leading!.evidence.map(e => `"${e}"`).join(", ")}). Pace it: "${r.pacing}"`);
  return [
    "META-PROGRAMS (Hall & Bodenhamer; a conversational structure, not a diagnosis). Match these sorting styles so your words land:",
    ...lines,
    "Pace before you lead: say it their way first, then offer one small shift.",
  ].join("\n");
}

/** Elicitation questions for programs not yet read, for the companion to ask when there is room. */
export function unreadQuestions(readings: readonly MetaProgramReading[], limit = 3): Array<{ key: string; name: string; question: string }> {
  return readings.filter(r => !r.leading).slice(0, limit).map(r => ({ key: r.key, name: r.name, question: META_PROGRAM_BY_KEY[r.key].question }));
}
