// ============================================================
// THERAPY MEANING — the "what could this mean for YOU" second
// half of every protocol page, mirroring lineMeaning.ts. Content
// is authored per KIND (the honest level — these are
// characterizations of what each intervention family does for a
// life, not per-protocol claims), and the page interpolates the
// protocol's own mapped capacity around it. Same four moves as
// the line pages: for you / the people around you / the cost of
// never doing it / two contrasting personas.
// ============================================================

export type TherapyPersona = { tag: string; text: string };

export type TherapyMeaning = {
  forYou: string;    // what committing to this kind could mean
  ripple: string;    // what it changes for the people around you
  cost: string;      // the cost of leaving the underlying gap alone
  personas: [TherapyPersona, TherapyPersona];
};

export const THERAPY_MEANING: Record<string, TherapyMeaning> = {
  psychotherapy: {
    forYou: "A completed course of a real clinical protocol is one of the few purchases that changes the buyer: the follow-up literature keeps finding that skill-based therapy keeps paying after it ends, because what you took home wasn't relief — it was machinery. The version of you on the far side runs different software in the exact situations that used to run you.",
    ripple: "The people around you meet the difference before you name it: the fight that de-escalates at the second sentence, the withdrawal that becomes a stated need, the apology that lands on the actual wound. One person in real therapy quietly renegotiates a whole household's patterns — usually for the better, occasionally to the shock of systems built around the old you.",
    cost: "Untreated patterns don't wait; they compound. The panic that narrows a career lane by lane, the trauma that prices every relationship, the rumination that converts free time into sentence-serving — clinical gaps left alone for a decade tend to cost more than a decade of the therapy would have. This is the arithmetic nobody runs until afterward.",
    personas: [
      { tag: "The functional sufferer", text: "Performs beautifully, suffers privately, assumes that's the deal. A structured course is usually their first evidence that the baseline they've normalized was a symptom — and that competence and ease were never actually rivals." },
      { tag: "The therapy skeptic", text: "Tried 'talking about feelings' once; nothing happened. Protocol therapy isn't that — it's drills, homework, and measured targets. The skeptic's temperament, pointed at a real protocol, often makes them its best responder." },
    ],
  },
  relational: {
    forYou: "Relational work is the highest-leverage purchase in the library because the asset it repairs — your primary relationship or your parenting — is the single strongest predictor of life satisfaction in the longitudinal record. You're not buying sessions; you're re-pricing the thing decades of happiness research says matters most.",
    ripple: "This is the only protocol family whose entire output IS the ripple: the partner who stops bracing, the child whose nervous system settles because the house did, the pattern that doesn't get inherited. Couples and parenting interventions are generational infrastructure disguised as appointments.",
    cost: "Relationship decay is quiet and compounding — contempt researchers can watch a divorce forming years out, and attachment patterns transmit with brutal fidelity. The cost of never doing the work is rarely a dramatic ending; it's twenty flat years, or a kid running your unexamined pattern in 2050.",
    personas: [
      { tag: "The waiting-for-crisis couple", text: "Fine, mostly, roughly. They'd rate the marriage a six and call that normal. Couples protocols average their best outcomes exactly here — before contempt calcifies — which is precisely when nobody goes." },
      { tag: "The single-handed repairer", text: "One partner doing all the emotional labor of two. Relational work redistributes the load with a referee present — often the first conversation in years where both people were on the same side of the table." },
    ],
  },
  mindfulness: {
    forYou: "Attention is the currency every other line spends, and this family trains the mint. Eight weeks of formal practice shows up in the trials as less reactivity, better emotion regulation, and a measurable gap between stimulus and response — which is where every choice you're proud of actually lives.",
    ripple: "A regulated nervous system is contagious in a household: you become harder to provoke and easier to be near, arguments lose an accelerant, and the people you love get the version of you that responds instead of the one that reacts. Your practice is invisible; its weather is not.",
    cost: "An untrained attention system pays a daily tax that never itemizes: the rumination hours, the reactive emails, the presence your family notices missing. Compounded over decades, the cost of never training attention is measured in relationships and years experienced at half resolution.",
    personas: [
      { tag: "The too-busy executive", text: "No time to sit still — which is the diagnosis. Their calendar is the case for the protocol: attention training gives back more hours in recovered focus than the practice costs, which is why the trials keep finding it in exactly this population." },
      { tag: "The failed meditator", text: "Tried an app, mind wouldn't quiet, concluded they can't. Noticing the wandering IS the rep — they were doing it right and scoring it wrong. A structured course with a teacher fixes the misunderstanding in week one." },
    ],
  },
  somatic: {
    forYou: "This family reaches the mind through the body — breath pace, muscle tone, nervous-system state — which means it works even when insight doesn't. For people whose stress lives below the neck (most people), somatic protocols are the direct route: change the physiology and the psychology follows it down.",
    ripple: "Your baseline state is the room's baseline state more than anyone admits. The parent who can down-regulate in ninety seconds de-escalates dinners; the partner whose shoulders drop first ends standoffs. Somatic skill is de-escalation infrastructure for everyone within ten feet of you.",
    cost: "Chronic dysregulation doesn't stay psychological — it files claims as sleep, blood pressure, digestion, and pain. The cost of never learning state control is paid to clinics later instead of practices now, and the exchange rate is terrible.",
    personas: [
      { tag: "The talk-therapy graduate", text: "Understands their patterns completely and still panics on schedule. Insight reached its limit; their body never got the memo. Somatic work is the missing half — regulation, not explanation." },
      { tag: "The white-knuckler", text: "Manages stress by gripping harder, and it works until it doesn't. Learning down-regulation on purpose is the first alternative to force they've ever been offered — and the trials say it holds." },
    ],
  },
  physical: {
    forYou: "The most replicated finding in all of behavioral science: the body's condition sets the operating range of the mind. This family isn't fitness — it's cognitive and emotional infrastructure with the deepest evidence base in the library, dose-responsive and available at every starting point.",
    ripple: "Training visibly changes what a household believes is normal: kids who watch a parent train inherit the default, partners get the improved mood before the improved mileage, and aging parents get an adult child strong enough to help. The body you build is other people's safety net too.",
    cost: "Detraining research is blunt: capacity you don't maintain leaves on a schedule, and the departure compounds into the falls, the fatigue, the shrinking radius of what feels possible. The cost of never training is a smaller life arriving earlier — the least metaphorical cost in the entire library.",
    personas: [
      { tag: "The former athlete", text: "Still identifies with a body from fifteen years ago; the gap between self-image and capacity widens annually. The protocol is a reintroduction — and their old motor learning makes the comeback faster than they fear." },
      { tag: "The never-started", text: "Gym-averse, sport-scarred, convinced it's not for them. The evidence says the largest gains in the whole literature belong to exactly this starting point: from nothing to something is where the curve is steepest." },
    ],
  },
  skill: {
    forYou: "Deliberate skill training is the quiet aristocracy of the library: unglamorous, cheap, and owner of the most durable gains on record. A capacity built through structured reps — negotiation, memory, reasoning, self-talk — behaves like a bicycle: it decays slowly and re-sharpens fast, for the rest of your life.",
    ripple: "Trained capability leaks: the negotiation skill that raises the household income, the communication drill that shows up at the dinner table, the learning method your kids absorb by osmosis. Skills are the most teachable form of intelligence — building one usually builds it in two people.",
    cost: "The cost of never training is the plateau dressed as personality: 'I'm bad at names, numbers, conflict, speaking.' Each of those is a trainable skill with a literature, and every year it's treated as identity instead is a year of compound interest foregone.",
    personas: [
      { tag: "The natural-talent believer", text: "Thinks skills are things other people were born with. The deliberate-practice literature is the counter-argument: structured reps at the edge of ability, with feedback, is the whole recipe — talent just picks the starting line." },
      { tag: "The plateaued veteran", text: "Twenty years of experience, ten of them identical. Experience without deliberate structure stops converting. The protocol re-adds the edge, the feedback, and the discomfort — the three things comfort quietly removed." },
    ],
  },
  psychedelic: {
    forYou: "The clinical trials report something rare in psychiatry: durable change from one to three supervised sessions — but the medicine is the smaller half of the protocol. The screening, preparation, and integration around it are where the durability comes from, which is why this family exists only in clinical, legal settings and our pages say so on every mention.",
    ripple: "Trial participants' families describe the change in relational terms — more present, less armored, grief that finally moves. When it works, the people around the patient get someone back. The variance is real too, which is exactly what screening and integration exist to manage.",
    cost: "For the treatment-resistant conditions these trials target, the cost of no new option is already being paid — in years. The honest framing isn't that this family is guaranteed; it's that its per-dose durability numbers justify the strictly-clinical path for people whom the standard paths have failed.",
    personas: [
      { tag: "The treatment-resistant veteran", text: "Three medication trials, two therapy courses, still in it. This family's studies were built on exactly this history — and enrollment in a real trial or clinical program is the library's only recommended door." },
      { tag: "The curious optimizer", text: "No clinical indication, high openness, reads retreat brochures. Our pages are direct: the evidence lives in screened clinical protocols, not tourism — the same molecule without the structure is a different (and uncited) proposition." },
    ],
  },
  neuromodulation: {
    forYou: "This family changes brain-state from the hardware side — measured signals, targeted stimulation, structured courses. For the cleared indications it's a genuine alternative when chemistry and talking haven't delivered: a way to train or drive regulation directly, with course completion as the strongest predictor in its literature.",
    ripple: "The household effect of a lifted treatment-resistant depression or a settled nervous system needs no elaboration: the person comes back. Partners in the TMS trials describe it plainly — someone who'd gone dim, re-lit over six weeks of appointments.",
    cost: "The cost calculus here is specific: these protocols exist mostly for people already paying the full price of a condition that hasn't yielded. For them, the cost of not knowing this family exists is measured in additional years of the condition setting the terms.",
    personas: [
      { tag: "The medication-weary", text: "Four prescriptions deep, side-effects trading places with symptoms. The cleared neuromodulation protocols are the other door — different mechanism, different side-effect profile, real trial base — and most patients hear about them years late." },
      { tag: "The biohacker", text: "Wants the consumer headset version. Our pages split it honestly: clinical, supervised, completed courses carry the evidence; the DIY market carries the marketing." },
    ],
  },
  lifestyle: {
    forYou: "Daily biological inputs — light, food pattern, sleep architecture — are the standing infrastructure every other protocol builds on. This family's effects arrive without willpower theatrics: change the input, and four to twelve weeks later the chemistry has quietly voted. It's the least dramatic family and the most foundational.",
    ripple: "Lifestyle inputs are household-level by nature: the kitchen that changed feeds everyone, the light routine resets the family's mornings, the protected sleep turns two people civil. You can't upgrade your own biology in a shared home without accidentally upgrading someone else's.",
    cost: "These inputs are running either way — the only choice is whether they're set deliberately or by default, and the defaults (screen light, ultra-processed convenience, sleep as remainder) are documented against you. The cost of never choosing is choosing the documented worse arm, indefinitely.",
    personas: [
      { tag: "The supplement maximalist", text: "Thirty pills, four hours of sleep. This family's evidence hierarchy is the correction: the boring inputs with decades of data outrank the exciting ones with none, and sleep outranks nearly everything sold in a bottle." },
      { tag: "The all-or-nothing resetter", text: "Overhauls everything each January, holds nothing by March. Standing inputs reward the opposite shape: one permanent change, then another. The protocol pages dose it that way on purpose." },
    ],
  },
  expressive: {
    forYou: "Making things — music, art, movement, performance — reaches regulation and meaning through channels talk can't access, and the adherence data holds the family's quiet superpower: these protocols are enjoyable, so people actually complete them. The best intervention is the one you'll still be doing in a year.",
    ripple: "Expressive practice is inherently shared: the household gains music, the group gains its drummer, the improv class gains the colleague who suddenly listens. This family builds connection as a side effect at rates the solo protocols can't match — the group formats add a bonding channel all their own.",
    cost: "The cost of a life without expressive outlet is chronically underbilled: stress with no channel, grief with no form, an identity flattened to job titles. 'I'm not creative' is usually the receipt for a channel closed in childhood and never reopened — the family exists to reopen it.",
    personas: [
      { tag: "The retired artist", text: "Played, drew, or danced until adulthood said stop. The machinery is dormant, not gone — and its return often reads less like starting a hobby than like recovering a confiscated room of the self." },
      { tag: "The strictly-practical adult", text: "Sees art as decoration and this family as fluff. The trials disagree: group singing moves bonding markers, expressive writing moves health markers. The fluff has effect sizes." },
    ],
  },
  community: {
    forYou: "The loneliness meta-analyses put disconnection in the same mortality band as smoking — which reclassifies this protocol family from social nicety to health infrastructure. Structured belonging is the intervention: the group that expects you changes your default week, and your default week is your life.",
    ripple: "Community protocols are the only family whose mechanism IS other people: joining creates the thing joined for everyone else too. The village you help constitute is somebody else's mortality-risk reduction — the rare intervention where the dose you take medicates the room.",
    cost: "Belonging can't be built fast when it's suddenly needed — the diagnosis, the divorce, the funeral test whatever already exists. The cost of never investing here arrives at the exact moments the literature says social support does its heaviest lifting, and by then it can't be bought at any price.",
    personas: [
      { tag: "The self-sufficient adult", text: "Fine alone, proud of it, statistically mispriced. The mortality data doesn't care about the pride — and structured entry (a team, a choir, a volunteer shift) gets past the awkwardness that free-form socializing can't." },
      { tag: "The transplanted professional", text: "New city, full calendar, empty weekend. Community protocols are literally designed for this gap: standing structures that convert repetition into belonging on a known schedule — walking in three times is the whole trick." },
    ],
  },
};
