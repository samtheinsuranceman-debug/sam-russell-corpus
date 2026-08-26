// ============================================================
// PROTOCOL SUB-PAGES — the content backbone behind the seven
// deep pages under every protocol (/protocol/:slug/:sub).
// Authored at the KIND level (11 kinds), interpolated with each
// therapy's own mapped data (lines, capacities, citations, dose
// overrides) — the same honesty pattern as TherapyDetail: kind-
// level guidance is labeled as kind-level, literature-typical
// characterizations are labeled as typical, never guarantees.
// ============================================================

export type PlaybookStep = { day: string; text: string };
export type PlaybookMistake = { name: string; text: string };
export type PlaybookStage = { stage: string; text: string };

export type KindPlaybook = {
  // Day-by-day arc for the first seven days.
  firstWeek: PlaybookStep[];
  // The failure modes that actually sink this kind of protocol.
  mistakes: PlaybookMistake[];
  // The honest results timeline, literature-typical.
  results: PlaybookStage[];
  // Who should talk to a professional before starting.
  caution: string;
};

export const KIND_PLAYBOOKS: Record<string, KindPlaybook> = {
  psychotherapy: {
    firstWeek: [
      { day: "Day 1–2", text: "Find the right practitioner, not just a practitioner. Search your insurer's directory or Psychology Today's filters for someone who names THIS protocol in their training — a clinician who 'does some CBT' is not a clinician trained in the protocol you picked. Shortlist three." },
      { day: "Day 3–4", text: "Book consultations. Most clinicians offer a free 15-minute call; use it to ask exactly two questions: 'How many full courses of this protocol have you delivered?' and 'What does a typical course look like with you?' You're listening for structure — session counts, homework, measured targets — not vibes." },
      { day: "Day 5", text: "Pick one and schedule the intake. Then do the single highest-leverage thing a new therapy client can do: write one page on what you want to be different in 90 days, in behavior terms ('I stop rerunning conversations at 2am'), not feeling terms ('I want less anxiety'). Bring it." },
      { day: "Day 6–7", text: "Set the container: a standing weekly slot you never negotiate with, and a place in your week where the homework will live — protocol therapies are homework machines wearing a conversation costume. The clients who assign the homework a calendar slot before session one are disproportionately the clients who finish." },
    ],
    mistakes: [
      { name: "Shopping for comfort", text: "Choosing the therapist who feels easiest to talk to over the one trained in the protocol. Rapport matters — the alliance is a real predictor — but rapport WITH a real protocol is the combination the outcome trials describe. Comfort alone is a friendship with a copay." },
      { name: "Skipping the homework", text: "The sessions are the classroom; the change happens in the reps between them. The between-session practice is not an add-on — in skill-based therapies it is the mechanism. Skipping it and attending faithfully is doing 20% of the protocol and expecting 100% of the trial results." },
      { name: "Quitting at the hard session", text: "Somewhere in the first third, a session will make things feel temporarily worse — that's usually the protocol reaching the actual material. The drop-out curve spikes exactly there. Knowing the spike is coming is most of the defense against it." },
      { name: "Never naming the target", text: "Drifting week to week on whatever came up. Protocol therapy works on defined targets with measured movement. If three sessions pass without a target you could write on an index card, raise it — a trained clinician will welcome the question." },
      { name: "Ending at 'better'", text: "Leaving the moment relief arrives, before the skill is consolidated. Relief is the anesthesia wearing in, not the surgery being done. The follow-up literature's durability numbers belong to completers." },
    ],
    results: [
      { stage: "Week 1–2", text: "Expect assessment, history, and target-setting — not transformation. The honest early signal is smaller: the problem gets NAMES. Patterns you've lived inside for years get boundaries drawn around them, which is quietly the first loss of their power." },
      { stage: "Week 3–6", text: "The skills phase. You'll have techniques that feel mechanical and unnatural — that's what new machinery feels like. Typical honest markers: you catch the pattern DURING an episode rather than after it, even if you can't stop it yet." },
      { stage: "Week 7–12", text: "Where the outcome literature's effect sizes live. The skills stop feeling like scripts and start firing on their own. Symptom measures, if your clinician tracks them (ask), typically show their steepest movement in this stretch." },
      { stage: "After the course", text: "Skill-based protocols show the strongest staying power in follow-up studies — gains holding and sometimes growing after termination, because the machinery keeps running. A planned booster session months out extends this further. If nothing has moved by mid-course, that's data too: raise it, adjust the protocol, or change practitioners — non-response to one method is not non-response to all of them." },
    ],
    caution: "If you're in crisis, having thoughts of harming yourself, or managing a psychiatric condition that's currently unstable, start with a licensed professional TODAY — a crisis line, your physician, or an emergency room — not a self-directed plan built from a website. This page maps a protocol; it does not triage.",
  },
  relational: {
    firstWeek: [
      { day: "Day 1–2", text: "Have the recruiting conversation — it's the real first session. Frame it as an experiment with an end date, not a verdict on the relationship: 'Eight sessions, then we decide if it's useful.' The partner who'd refuse a life sentence will often accept a pilot." },
      { day: "Day 3–4", text: "Find a practitioner certified in THIS method — the major couples protocols publish practitioner directories, and certification is the difference between the method the trials tested and a referee with a couch. Shortlist together; both parties get veto power over the pick." },
      { day: "Day 5–6", text: "Book the intake while motivation is warm — the gap between 'we should' and the first appointment is where most couples work dies. Take the earliest joint slot, even if it's inconvenient. Inconvenient and scheduled beats ideal and hypothetical." },
      { day: "Day 7", text: "Separately, each write one page: the pattern you two fall into, YOUR half of it, and what you want to be different in 90 days. Not the other person's charges — your half. Walking in with your own contribution already named is the single fastest start a couples protocol can get." },
    ],
    mistakes: [
      { name: "Arriving as prosecution", text: "Using sessions to win the case rather than change the pattern. The method works on the cycle between you, and the cycle has no defendant. Couples who make the PATTERN the enemy progress; couples who make each other the enemy generate transcripts." },
      { name: "Waiting until the eleventh hour", text: "The average couple arrives years after the trouble started, often with one foot out the door. The methods still work late — but every follow-up study favors earlier. If you're reading this page and hesitating, the hesitation is the last stage of 'too early,' which is the best time there is." },
      { name: "Outsourcing the work to the room", text: "The 60 minutes with the facilitator is where the new pattern gets built; the week between is where it gets installed or doesn't. Couples who run the between-session exercises get the trial results; couples who only attend get an expensive weekly ceasefire." },
      { name: "One party doing therapy AT the other", text: "Dragging a partner who hasn't consented to the project. The methods need two participants, not a participant and a hostage. If your partner won't come, several protocols have individual-entry versions — start there rather than coercing." },
      { name: "Quitting at the first regression", text: "Mid-course, the old fight WILL happen again and feel like proof nothing works. It's the opposite: the pattern under pressure is the material. The couples who bring the relapse into the room, instead of taking it as the verdict, are the ones the durability studies describe." },
    ],
    results: [
      { stage: "Session 1–3", text: "Assessment and the naming of the cycle. The honest early win: the fight you've had a hundred times gets a map — who moves first, what each move triggers, where it always lands. Seeing the machine from outside is itself destabilizing to the machine." },
      { stage: "Session 4–8", text: "New moves, awkwardly. Expect interruptions of the old pattern that feel scripted and strange — the de-escalation that works but doesn't feel like 'us' yet. Typical marker: fights still start, but they end differently." },
      { stage: "Session 9–15", text: "Where the major methods' outcome data concentrates. The new pattern starts running without the facilitator in the room. Many couples report the odd experience of reaching for the old move and finding they've lost the taste for it." },
      { stage: "After the course", text: "Follow-up studies on the leading couples methods show gains holding years out for a majority of completers — the pattern, once rebuilt and rehearsed, is self-maintaining. The honest caveat: 'majority' is not 'all,' and couples where one party disengaged mid-course fall disproportionately in the remainder." },
    ],
    caution: "If there is violence, fear, or coercive control in the relationship, joint sessions are the wrong first door — the field itself says so. Talk privately to a licensed professional or a domestic-violence hotline first; safety planning precedes couples work, always.",
  },
  mindfulness: {
    firstWeek: [
      { day: "Day 1", text: "Pick the anchor time — the practice bolted to an existing fixture (after the coffee brews, before the shower) survives; the practice scheduled for 'when I have a moment' dies by Thursday. Ten minutes. Set the location too: same chair, same corner. Ritual is load-bearing." },
      { day: "Day 2–3", text: "Choose ONE guided source — a single teacher or program — and stay monogamous with it for the whole course. App-hopping is the mindfulness version of channel surfing: constant novelty, no depth. The 8-week structured programs exist because sequence matters." },
      { day: "Day 4–5", text: "Meet the actual practice: attention wanders, you notice, you return it. That noticing-and-returning IS the rep — not a failure of the rep. Most quitters quit because nobody told them the wandering is the gym. Count returns as wins and week one reframes itself." },
      { day: "Day 6–7", text: "Add the streak ledger — paper, app, whatever you'll actually see. The dose in this kind is the STREAK, not the sitting; consistency at ten minutes beats heroics at forty-five. End the week by booking the daily slot into your calendar for the next seven days, because week two is where the novelty stops paying the bill and the structure has to." },
    ],
    mistakes: [
      { name: "Judging sessions by how they felt", text: "Rating practice by calm achieved is measuring the wrong end. Choppy, distracted sittings where you returned attention forty times are HIGH-rep sessions. The trials that produced this field's evidence base didn't select for blissful practitioners — they selected for consistent ones." },
      { name: "Waiting to feel like it", text: "Motivation follows the practice; it doesn't precede it. The design answer is to remove the decision entirely — same time, same seat, streak on the wall. Deciding daily whether to practice is a coin you'll eventually flip wrong." },
      { name: "Dose stacking after a good week", text: "Jumping from 10 minutes to 45 because week one went well — then missing three days because 45 wouldn't fit, then quitting because the streak broke. Raise the dose slowly and only after the current dose has survived a bad week." },
      { name: "Using it as an avoidance tool", text: "Deploying practice to not-feel things is backwards — the training is in feeling states without being run by them. If sitting consistently surfaces heavy material, that's a known and documented effect: the move is a teacher or clinician, not more solo volume." },
      { name: "Stopping at week eight", text: "The course installs the skill; the daily minutes keep it live. Practice-dependence is this kind's honest fine print — gains track continued practice. Budget for the maintenance dose before you start, or you're renting the benefit, not buying it." },
    ],
    results: [
      { stage: "Week 1", text: "Mostly friction and discovery: attention wanders constantly and now you know it. That knowing is the first measurable change — meta-awareness onset — though it feels like getting worse. It isn't; the noise was always there. You just installed the meter." },
      { stage: "Week 2–4", text: "The gap appears — the half-second between a trigger and your reaction where a choice now lives. Typical honest markers: catching irritation mid-rise, noticing an urge without obeying it once or twice. Small, real, and the mechanism the whole field is built on." },
      { stage: "Week 5–8", text: "Where the 8-week program literature anchors its outcomes: attention regulation, reactivity, and stress measures typically show their movement here. The practice stops being a task and starts being a place. Sleep and rumination effects, when they come, tend to arrive in this window." },
      { stage: "Beyond", text: "Practice-dependent, honestly: keep ~10+ daily minutes and the effect stays live indefinitely; stop, and it fades over months like fitness does. Long-horizon practitioners describe compounding rather than plateau — but that description belongs to people who never stopped." },
    ],
    caution: "If you carry unprocessed trauma or a dissociative condition, intensive silent practice can surface material fast — a documented effect, not a rumor. That's not a reason to skip the practice; it's a reason to start light and consider a trauma-informed teacher or clinician alongside it.",
  },
  somatic: {
    firstWeek: [
      { day: "Day 1–2", text: "Learn the baseline before you train it: twice a day, sixty seconds, just notice — breath pace, jaw, shoulders, gut. No fixing. You're calibrating the instrument you're about to train, and most people discover they've been flying without gauges for years." },
      { day: "Day 3–4", text: "Start the actual protocol at the light end of its dose — one short session, not the advanced version. Body-based work punishes ambition on day three more reliably than any kind in the library. The nervous system trains like a muscle: progressive load, not shock." },
      { day: "Day 5–6", text: "Attach the practice to a state you actually want to change — do the session before the meeting that spikes you, after the commute that wrecks you. This kind shows its value fastest when it's aimed at a real recurring state rather than practiced in a vacuum." },
      { day: "Day 7", text: "Take the week-one reading: same sixty-second scan as day one, and notice what's different — usually not calm yet, but resolution: you can feel gradations where there used to be just 'fine' and 'not fine.' Log it. That's your before picture, and in eight weeks you'll want it." },
    ],
    mistakes: [
      { name: "Forcing through the discomfort", text: "Body-based work asks you to stay present with sensations most people spend their lives avoiding — but staying present is not the same as overriding. If a practice floods you, the protocol answer is to titrate down, not push through. Intensity is not the active ingredient; regulation is." },
      { name: "Practicing only when calm", text: "Running the protocol exclusively in easy conditions builds a skill that evaporates under load. Once the basics are stable, deliberately deploy it adjacent to real stressors — that transfer is the entire point." },
      { name: "Treating it as a one-time fix", text: "The regulation skill persists, but the TONE it builds fades over months without practice, like fitness. Planning for maintenance from day one beats rediscovering the need for it from the bottom of a relapse." },
      { name: "Ignoring the signal you're training", text: "Doing the exercises mechanically while thinking about email. The interoceptive channel is the product; attention on the body sensation during the rep is what trains it. Reps without attention are stretching, not training." },
      { name: "Skipping the medical check", text: "Cold exposure, breath protocols, and intensity work have real contraindications — cardiac conditions, pregnancy, seizure history. Two minutes with your physician converts an unknown risk into a managed one." },
    ],
    results: [
      { stage: "Week 1", text: "Resolution before regulation: you start FEELING states you used to only act from. This can be disconcerting — the meter shows readings you never knew were there. It's the necessary first stage; you can't regulate a signal you can't detect." },
      { stage: "Week 2–4", text: "First real-time interventions: catching the spike as it starts and taking its edge off — sometimes. Typical honest markers: recovery after stress gets faster before reactions get smaller. Down-regulation speed is usually the first number to move." },
      { stage: "Week 5–8", text: "Baseline shift territory: with 2–5 short sessions weekly, courses of 6–12 weeks are where the literature places the tone change — resting state a notch calmer, triggers a notch further away, sleep often collecting the dividend." },
      { stage: "Beyond", text: "The skill is durable; the conditioning is perishable. Keep a light maintenance dose and the baseline holds. The honest comparison is fitness: nobody asks whether they can stop training forever and keep the result, and the nervous system runs the same accounting." },
    ],
    caution: "Breathwork, cold, and intensity protocols carry genuine physical contraindications — cardiovascular conditions, pregnancy, epilepsy, and some psychiatric medications change the math. Clear it with your physician first; if a session produces chest pain, fainting, or panic that doesn't settle, stop and get checked before continuing.",
  },
  physical: {
    firstWeek: [
      { day: "Day 1", text: "Schedule the sessions before you optimize anything — three slots in the calendar, treated like meetings with someone you respect. Program quality explains a fraction of outcomes; attendance explains most of them. The perfect program you skip loses to the mediocre one you keep." },
      { day: "Day 2–3", text: "First session: deliberately underwhelming. Work at 'could hold a conversation' effort, stop while you still want more. The goal of week one is not adaptation — it's making session two feel inviting instead of like a debt. Soreness that cancels day three is a programming error, not a badge." },
      { day: "Day 4–5", text: "Solve logistics like they're the workout, because they are: bag packed the night before, route that passes the gym, shoes by the door. Every removed decision is a removed exit. The research on habit formation is embarrassingly consistent: friction, not willpower, decides." },
      { day: "Day 6–7", text: "Second and third sessions, same restraint. End the week by logging what you did — numbers, not feelings. That log becomes the progress meter that carries you through the weeks where the mirror shows nothing, which is most of the early weeks. The mirror lags; the log doesn't." },
    ],
    mistakes: [
      { name: "Sprinting into a wall", text: "Week-one heroics followed by week-two soreness, week-three resentment, week-four absence. The detraining literature is blunt: benefits track ongoing training. The sustainable dose you'll still be taking in June beats the impressive dose you abandon in February." },
      { name: "Program hopping", text: "Switching plans every two weeks chases novelty past the adaptation window. Nearly any sane program works if run for 8–12 weeks; almost none works run for two. Boring consistency is the entire secret, which is why nobody can sell it." },
      { name: "Ignoring the cognitive dividend", text: "Judging the protocol only by the body when the trials this library cites measured the MIND — mood, executive function, processing speed. If you're here for a cognitive line, track that: note focus and mood on training vs. rest days, and let the real dividend keep you paying in." },
      { name: "All intensity, no recovery", text: "Sleep and rest days are where adaptation actually happens; training is just the stimulus. Cutting sleep to fit training in is selling the product to buy advertising." },
      { name: "Waiting for motivation", text: "The training days you least want are the ones maintaining the habit's spine. Motivation is weather; the calendar is climate. Build for climate." },
    ],
    results: [
      { stage: "Week 1–2", text: "Mood moves first — the acute post-session lift is the most reliable early effect in the literature, arriving before any fitness change. Honest marker: you feel better the HOURS after training, while the training itself still feels like a tax." },
      { stage: "Week 3–6", text: "The tax rate drops: sessions stop feeling like emergencies, recovery quickens, sleep often deepens. On the cognitive side, this is where trial participants typically start showing measurable executive-function and processing changes — subtle from inside, real on the instruments." },
      { stage: "Week 6–12", text: "The window where the cited cognitive-effect literature concentrates: measurable effects on the mapped lines with 3–5 weekly sessions. The habit crosses into identity somewhere here — 'I'm doing a program' becomes 'I train' — which is the durability mechanism nothing else provides." },
      { stage: "Beyond", text: "Use-it-or-lose-it, stated plainly: detraining effects are measurable within weeks of stopping. The habit IS the intervention. The good news is symmetrical — the benefits re-arrive nearly as fast on restart, and a maintenance dose far below the building dose holds most of the ground." },
    ],
    caution: "If you're over 40 and sedentary, managing a cardiac, metabolic, or joint condition, or on medications that affect heart rate or blood pressure, get a physician's clearance before starting. This is standard, quick, and converts the protocol from a gamble into a plan.",
  },
  skill: {
    firstWeek: [
      { day: "Day 1", text: "Define the skill in performance terms — not 'get better at X' but 'do Y measurably.' Deliberate practice needs a target the reps can hit or miss; vague targets produce vague practice, which produces the plateau everyone blames on talent." },
      { day: "Day 2–3", text: "Build the feedback loop before building volume: how will each rep tell you it was right or wrong? Recording, checking against a model, a partner, a score. Practice without feedback is repetition, and repetition grooves errors as happily as excellence." },
      { day: "Day 4–5", text: "First real practice blocks: 20–30 minutes at the EDGE — the level where you fail maybe a third of the time. Comfortable practice is a rehearsal of what you already own. The edge is mildly and permanently uncomfortable; that discomfort is the sensation of the protocol working." },
      { day: "Day 6–7", text: "Log every block: what you drilled, what broke, what you'll isolate next. Then schedule next week's 3–5 blocks. Skill gains compound off consistency of edge-time, and the log is what stops 'practice' from quietly sliding back into comfortable repetition." },
    ],
    mistakes: [
      { name: "Practicing the whole instead of the broken part", text: "Running full performances instead of isolating the failing component. Deliberate practice is surgical: find the weakest sub-skill, drill it alone, reintegrate. Whole-runs feel productive and improve almost nothing past the beginner stage." },
      { name: "Staying comfortable", text: "Drilling at the level you already own because succeeding feels like progress. If your error rate is near zero, you're performing, not practicing. The edge — a third-ish failure rate — is where the adaptation lives." },
      { name: "Volume without feedback", text: "Hours logged with no mechanism telling each rep right from wrong. Feedback delayed is learning diluted; feedback absent is grooving your mistakes with dedication." },
      { name: "Marathon sessions", text: "One heroic four-hour Saturday loses to five focused 30-minute blocks — attention quality collapses long before time runs out, and the spaced literature is unambiguous about distribution beating massing." },
      { name: "Quitting inside the plateau", text: "Plateaus are consolidation, not the ceiling. The trained-skill literature's durability — decay slowly, re-sharpen fast — belongs to people who practiced THROUGH the flat stretches. The plateau is where your competitors quit; that's what makes it valuable." },
    ],
    results: [
      { stage: "Week 1", text: "Conscious incompetence, on purpose: the feedback loop makes your errors visible in high resolution, which feels like getting worse. It's the meter installing. Honest marker: you can now SAY what you do wrong, specifically." },
      { stage: "Week 2–4", text: "The drilled components sharpen individually while the integrated skill still stumbles — normal sequencing. Typical marker: isolated sub-skills hit reliably in practice but wobble under performance conditions. Keep drilling; integration lags isolation by weeks." },
      { stage: "Week 4–12", text: "Where the literature places meaningful gains in most trained skills at 3–5 weekly blocks: components consolidate, the skill starts running below conscious attention, and performance conditions stop taxing it. The log you kept since day one is now visibly a staircase." },
      { stage: "Beyond", text: "Among the most durable gains in the library — trained skills behave like riding a bicycle: slow decay, fast re-sharpening. Expertise, as opposed to competence, runs on years of the same loop at progressively higher edges. The loop doesn't change; the edge does." },
    ],
    caution: "The main risk here is opportunity cost, not injury — but if the skill involves physical load (voice, instrument, athletic technique), pain is feedback too: persistent pain means form review or professional coaching, not more volume through it.",
  },
  psychedelic: {
    firstWeek: [
      { day: "Day 1–2", text: "Get the legal and medical picture FIRST. Psychedelic-assisted protocols are legal only in specific jurisdictions, trials, and licensed clinical settings — and the trial results that made this field's reputation came from exactly those settings: screened participants, trained facilitators, integration support. The setting is not packaging; it's the protocol." },
      { day: "Day 3–4", text: "Screen yourself honestly before anyone else does: personal or family history of psychosis or bipolar disorder, cardiac conditions, and several medication classes (notably some antidepressants) are established exclusion criteria in the research. These aren't bureaucracy — they're the trial safety data speaking." },
      { day: "Day 5–6", text: "Research legitimate access: registered clinical trials (clinicaltrials.gov), licensed programs where your jurisdiction has them, or clinician referral. The unregulated route discards the screening, the facilitation, and the integration — which is to say, the parts the evidence is actually about." },
      { day: "Day 7", text: "Start the preparation work that every legitimate protocol includes anyway: intention writing, a stable life container (this is work you schedule calm weeks around, not into a crisis), and lining up the integration support you'll want afterward — because in the research, the sessions AFTER the session are where the change gets banked." },
    ],
    mistakes: [
      { name: "Confusing the substance with the protocol", text: "The trial outcomes belong to substance PLUS screening PLUS trained facilitation PLUS integration. Stripping three of the four and expecting the published effect is the central error of the entire hype cycle around this field." },
      { name: "Skipping the screening", text: "The exclusion criteria exist because the safety data put them there. Psychosis-spectrum vulnerability and certain cardiac and medication profiles turn a studied risk profile into an unstudied one — with the emphasis on unstudied." },
      { name: "Treating integration as optional", text: "In the research protocols, the integration sessions are where insight becomes behavior change. Skipping them tends to produce a big experience with a short half-life — memorable, and gone." },
      { name: "Using it as a rescue during crisis", text: "Legitimate protocols schedule around stability, not desperation. An unstable stretch is when screening matters most and when the field's own practitioners counsel waiting." },
      { name: "Ignoring the honest limits of the evidence", text: "The literature is promising and young: modest trial sizes, blinding challenges, and durability questions are all live. This library maps it because the capacity evidence is real; treating it as settled science oversells what the researchers themselves claim." },
    ],
    results: [
      { stage: "Preparation phase", text: "Weeks, honestly, before anything else: screening, access, preparation sessions. In the research protocols this phase does real work — intention and alliance with the facilitator predict session quality. Rushing it is skipping active ingredients." },
      { stage: "Session + first days", text: "The acute experience, then an 'afterglow' window the literature documents: days to weeks of increased psychological flexibility and openness. This window is materials, not results — what you build with it is the outcome." },
      { stage: "Integration weeks", text: "Where trial participants did the converting: structured sessions turning the experience into changed patterns. The honest marker is behavioral — a conversation had, an avoidance dropped — not how profound the session felt." },
      { stage: "Months out", text: "The durability data is genuinely encouraging in several trials — sustained changes at 6–12 month follow-ups — and genuinely incomplete. Booster protocols and long-horizon studies are active research questions, which is the accurate way to hold your own expectations too." },
    ],
    caution: "This kind is clinician-gated by design: personal or family psychosis-spectrum history, bipolar disorder, cardiac conditions, and several common medications are established exclusions, and legality varies by jurisdiction. If this protocol is on your list, your first step is a physician or a registered trial — not a purchase.",
  },
  neuromodulation: {
    firstWeek: [
      { day: "Day 1–2", text: "Understand what you're actually considering: clinician-administered brain stimulation with regulatory clearance for specific conditions, delivered in courses at licensed clinics. This is a medical procedure with an evidence base — which means the path in runs through a physician, and that's the feature, not the obstacle." },
      { day: "Day 3–4", text: "Get the referral conversation booked — psychiatrist or physician. Bring your actual goal ('this capacity, this line') and treatment history; clearance for these protocols is condition-specific, and a clinician can tell you whether your case matches the cleared indications or belongs in a research setting." },
      { day: "Day 5–6", text: "If you're proceeding, vet clinics like you'd vet a surgeon: device cleared for the indication, protocol matching the evidence (session counts in the studied ranges), outcome measurement built in. Ask what they measure and when — a clinic that doesn't measure is a clinic guessing." },
      { day: "Day 7", text: "Map the logistics honestly: standard courses run daily or near-daily sessions across weeks. That's a calendar commitment most people underestimate. Arrange the work-life container now — mid-course dropout for schedule reasons is the most preventable failure this kind has." },
    ],
    mistakes: [
      { name: "Buying consumer gadgets expecting clinical results", text: "The evidence this library cites comes from clinical-grade, clinician-administered protocols. Consumer stimulation devices are a different product category with a far thinner evidence base — the name similarity is marketing, not science." },
      { name: "Judging at session five", text: "Response in the studied protocols typically emerges across the course, not the first week. Early 'nothing is happening' is the expected reading, which is exactly why the courses are dosed in weeks." },
      { name: "Skipping sessions mid-course", text: "The dose is cumulative and the schedules in the trials were dense on purpose. Treating sessions as skippable turns a studied protocol into an improvised one." },
      { name: "Expecting a standalone cure", text: "In much of the literature these protocols are adjuncts — they move the substrate while therapy, behavior change, or medication does the rebuilding. The best results in the data ride combination, not monotherapy." },
      { name: "Not tracking outcomes", text: "Without a baseline measure and scheduled re-measures, you cannot tell response from hope. Insist on measurement; the good clinics already do." },
    ],
    results: [
      { stage: "Consultation phase", text: "Days to weeks: referral, evaluation, insurance navigation. Honest work, zero glamour. What you're buying in this phase is the match between your case and the cleared evidence — the highest-leverage decision in the whole protocol." },
      { stage: "Early course", text: "Sessions are quick and mostly uneventful; side effects in the cleared protocols are typically mild and local. Expect little subjective change yet — the trials show response building across the course, not announcing itself in week one." },
      { stage: "Mid-to-late course", text: "Where responders typically separate: measured changes (the scales your clinic tracks) usually move before felt changes. Honest marker: the people around you notice before you do — an effect the literature documents with some regularity." },
      { stage: "After the course", text: "Durability varies by protocol and person; maintenance sessions are an established option in several of them. Response is genuinely not universal — the honest framing is a course with a real response rate, not a guarantee, and non-response is information that redirects, not a verdict on you." },
    ],
    caution: "Clinician-gated by definition: implanted devices, seizure history, and certain neurological conditions are hard contraindications, and the evidence base is condition-specific. The first step is a psychiatrist or physician referral — anything sold to you without one is a different product than the one the evidence describes.",
  },
  lifestyle: {
    firstWeek: [
      { day: "Day 1", text: "Pick the ONE variable this protocol targets and put a number on today's baseline — bedtime, minutes outside, meals, screens-off hour. Lifestyle protocols die of vagueness; a variable you can write down is a variable you can move." },
      { day: "Day 2–3", text: "Change the environment before the behavior: the phone charger out of the bedroom, the alarm across the room, the default set to the new pattern. Willpower is a battery; environment is solar. Every trial-tested lifestyle intervention smuggles environment design in somewhere." },
      { day: "Day 4–5", text: "Run the new pattern at the easiest viable dose and defend the CONSISTENCY, not the size. A bedtime moved 20 minutes that holds all week beats a two-hour overhaul that survives twice. The body's rhythms adapt to signals that repeat." },
      { day: "Day 6–7", text: "First data check: compare the numbers to day one, and note the collateral readings — energy, mood, focus. Lifestyle protocols pay in adjacent currencies, and noticing the payments early is what funds week two. Then set next week's dose: same, or one small notch further." },
    ],
    mistakes: [
      { name: "Overhauling everything at once", text: "Changing sleep, diet, light, and screens in the same week produces one glorious Monday and an unrecoverable Thursday. One variable, stabilized, then the next — boring, and the only version with a survival rate." },
      { name: "Weekend amnesty", text: "Running the protocol Monday–Friday and 'off' on weekends resets the adaptation each week — circadian protocols especially. The body doesn't know it's Saturday; consistency across all seven days at a gentler dose beats strictness across five." },
      { name: "Measuring nothing", text: "Without the baseline number and a weekly reading, the protocol becomes a mood. The entire difference between a lifestyle change and a lifestyle intention is the log." },
      { name: "Perfectionist collapse", text: "One broken night or skipped day read as failure, followed by abandonment. The trials' adherence data has missed days all through it; the protocol's power is in the trend line, not the streak. Miss once, resume immediately, and the trend barely notices." },
      { name: "Ignoring the interaction effects", text: "Caffeine timing sabotaging the sleep protocol; late screens sabotaging the light protocol. Lifestyle variables are a system — when the target variable won't move, the blocker is usually a neighbor variable, not a lack of discipline." },
    ],
    results: [
      { stage: "Day 1–7", text: "Adjustment friction, honestly: the new pattern feels arbitrary and the payoff invisible. Some protocols (sleep regularity especially) can feel WORSE for a few days as the system recalibrates. Expected, documented, temporary." },
      { stage: "Week 2–3", text: "First collateral payments: energy and mood typically move before the headline outcome does. Honest marker: the 3pm crash softens, the morning grog shortens. Small currencies, but they're the leading indicators the protocol is compounding." },
      { stage: "Week 4–8", text: "Where the lifestyle-intervention literature typically places measurable outcome change — the target variable stabilized and the downstream effects (cognition, mood, regulation) showing on instruments. The pattern has stopped costing willpower and started running on rails." },
      { stage: "Beyond", text: "The honest physics: benefits track the behavior. But unlike effortful protocols, a stabilized lifestyle pattern maintains itself nearly free — the environment does the work. The risk isn't decay; it's disruption (travel, life chaos), and the skill worth keeping is the fast reinstall, not the unbroken streak." },
    ],
    caution: "Sleep, diet, and light protocols are safe for most people — but if you have a sleep disorder, an eating-disorder history, diabetes, or are on medications with meal or sleep timing interactions, loop in your physician first; the protocol may need tailoring rather than avoiding.",
  },
  expressive: {
    firstWeek: [
      { day: "Day 1", text: "Lower the bar to the floor: the protocol is expression, not quality. Twenty minutes, privacy, and the explicit rule that no one — including future you — is owed a readable page or a good performance. The trials that built this field's evidence used exactly this framing." },
      { day: "Day 2–3", text: "First sessions: go where the charge is. Expressive protocols work on material that has weight — the writing paradigm's classic instruction is the deepest thoughts and feelings about what's actually pressing. Staying on the surface is doing the format without the protocol." },
      { day: "Day 4–5", text: "Expect the dip and schedule around it: the research documents that sessions on heavy material can leave you briefly LOWER — with the benefit arriving in the days after. Don't do day-four material ten minutes before a board meeting. Evening sessions with decompression after are the amateur-friendly slot." },
      { day: "Day 6–7", text: "Close the week with a structured session: reread or review what came out (you don't have to like it), and write three sentences on what you notice from the outside. The stepping-out move — experience to expression to observation — is where this kind quietly builds its mapped capacities." },
    ],
    mistakes: [
      { name: "Performing instead of expressing", text: "Writing for an imaginary reader, playing for an imaginary audience. The evidence base is built on private, unpolished expression; the moment quality enters the room, the protocol leaves it." },
      { name: "Staying safe", text: "Twenty minutes on the weather. The mechanism runs on emotionally significant material — approach it at whatever gradient you can tolerate, but approach it. Charge is the active ingredient." },
      { name: "Quitting at the dip", text: "Feeling worse immediately after a heavy session is the documented short-term effect, and it's precisely where people conclude 'this makes me worse' and stop. The measured benefits in the trials sit on the far side of that dip, days later." },
      { name: "Flooding", text: "The opposite error: diving into the heaviest material at maximum intensity daily. The research protocols are dosed — sessions bounded in time, days between them. If a session leaves you unable to close the notebook and re-enter your day, shorten the sessions or lighten the material." },
      { name: "Never stepping back", text: "Expression without any reflection loop becomes rumination with props. The observation step — what do I notice from outside this — is what converts venting into processing." },
    ],
    results: [
      { stage: "Session 1–3", text: "Often a paradox: relief AND turbulence. The material moves, which is the point and also the discomfort. Honest marker: things you didn't know you thought end up on the page — the surprise is evidence the protocol is reaching below the rehearsed layer." },
      { stage: "Week 2–4", text: "The narrative starts organizing: the same events come out with more structure, cause, and perspective each pass — the coherence shift the writing-paradigm literature ties to its outcomes. Sleep and intrusive-thought effects, when they arrive, tend to show here." },
      { stage: "Week 4–8", text: "The capacity gains the map cites: emotional granularity (more precise names for states), self-distancing, and regulation under recall. The material that had charge still has meaning, but the charge drops — measurably, in the studies; noticeably, from inside." },
      { stage: "Beyond", text: "Skill-like durability: the expressive move stays available and re-deploys at need — new stressor, new sessions. Many long-term practitioners shift to maintenance mode: occasional sessions at life's pressure points rather than a daily obligation. The honest limit: for clinical-grade trauma, this kind supports but does not replace clinical care." },
    ],
    caution: "If the material you'd be working with is acute trauma, or sessions reliably leave you flooded rather than lighter, do this alongside a licensed clinician rather than instead of one — the expressive protocols were tested as structured doses, not as solo exposure therapy.",
  },
  community: {
    firstWeek: [
      { day: "Day 1–2", text: "Pick the specific group, not the concept: an actual meeting, class, league, or circle with a day and time attached. Community protocols fail at the noun stage — 'more connection' is a mood; 'Thursday 7pm' is a protocol. Find two candidates so the first has a backup." },
      { day: "Day 3–4", text: "Do the pre-commitment moves: tell one person you're going, put it in the calendar, handle the logistics (location, cost, what to bring) tonight rather than the hour before. The no-show mechanism is always the same — friction plus anonymity — and both are solvable in advance." },
      { day: "Day 5–6", text: "Attend the first session with the bar set at presence, not performance: show up, learn names, stay to the end. The research on belonging effects runs on repeated exposure, not first-night chemistry. You are allowed to feel awkward; awkward is the tuition." },
      { day: "Day 7", text: "Lock the return before the memory fades: confirm next week's attendance, and if the group has any small role open — bring something, help set up — take it. Micro-roles convert attendance into membership, and membership is where this kind's documented effects actually live." },
    ],
    mistakes: [
      { name: "Auditioning forever", text: "Sampling a different group every week in search of the perfect fit. The belonging effects need repeated exposure to the SAME people; perpetual first nights deliver the awkwardness of community with none of the returns. Give a reasonable group six sessions before judging." },
      { name: "Attending without engaging", text: "Physical presence with social absence — arriving late, leaving early, phone as shield. The documented benefits track relational depth, not proximity to other humans. One real conversation per session is a better metric than attendance itself." },
      { name: "Quitting at the awkward stage", text: "The early sessions of any group feel like standing in someone else's living room; that's universal, not diagnostic. The people who report the strong belonging effects are past the stage you'd be quitting in." },
      { name: "Taking without giving", text: "Consuming the group as a service. The reciprocity literature is clear that giving support moves the needle as much as receiving it — the fastest route to belonging is usefulness." },
      { name: "Letting one miss become an exit", text: "Missing a week, feeling sheepish, avoiding the next to dodge the sheepishness, and vanishing. Groups forget your absence far faster than you fear; the move is simply returning, no explanation owed." },
    ],
    results: [
      { stage: "Session 1–2", text: "Mostly cost, honestly: unfamiliar faces, effortful small talk, the strong pull of the couch you left. The single honest marker worth tracking: you went. Attendance under low motivation is the protocol working on the exact machinery it targets." },
      { stage: "Week 3–6", text: "Names become people; the room starts expecting you. Typical markers: someone notices when you're absent, the pre-session dread drops below the post-session lift. That crossover — dreading it less than it pays — is the protocol's first compounding point." },
      { stage: "Month 2–3", text: "Where the belonging literature's effects concentrate: identified role, real conversations, the group functioning as an actual support structure. Mood and stress-buffering effects in the research track exactly this depth, not the calendar time." },
      { stage: "Beyond", text: "Community compounds unlike anything else in the library — the same investment keeps paying without re-dosing, and the network effects (introductions, opportunities, resilience in bad seasons) arrive on no schedule anyone can promise. The honest maintenance cost: showing up remains the price, forever. It just stops feeling like one." },
    ],
    caution: "If social situations trigger clinical-grade anxiety or panic rather than ordinary awkwardness, pair this protocol with professional support instead of white-knuckling it — graded exposure with a clinician makes the same door walkable.",
  },
};

// Guard used by tests: every kind in the library must carry a playbook.
export function playbookFor(kindId: string): KindPlaybook {
  return KIND_PLAYBOOKS[kindId] ?? KIND_PLAYBOOKS.skill;
}

// ── Daily-life embedding, per kind: where the capacity this kind builds
// actually gets USED (and therefore exercised) in an ordinary day.
export type DailyProfile = { when: string; looksLike: string; microUse: string };
export const KIND_DAILY: Record<string, DailyProfile> = {
  psychotherapy: {
    when: "The skills fire at the exact moments that used to run you: the criticism that lands wrong, the 2am rumination loop, the decision you keep deferring.",
    looksLike: "From outside it looks like nothing — a person who pauses two seconds longer before responding, reschedules the spiral, has the hard conversation on purpose.",
    microUse: "Every trigger survived using the technique is a live rep — daily life IS the practice field after the course ends, which is why the gains compound instead of fading." },
  relational: {
    when: "At the friction points every couple owns: the logistics negotiation, the tone that starts the old fight, the repair attempt after.",
    looksLike: "Fights that still start but end differently; the de-escalation move that feels scripted for a month and then just becomes how you two talk.",
    microUse: "One deliberate repair attempt per week keeps the new pattern load-bearing; the weekly check-in most methods prescribe is the formal rep." },
  mindfulness: {
    when: "In the transitions — commute, queue, the walk between meetings — and at every spike of irritation, craving, or dread.",
    looksLike: "The half-second gap between trigger and reaction, used. Catching the phone-reach, the snap, the doomscroll AS it starts.",
    microUse: "Three conscious breaths before opening email counts. The formal sit installs the skill; these micro-deployments keep it warm all day." },
  somatic: {
    when: "Before the performance moments (the meeting, the call, the confrontation) and after the stressors — anywhere your state needs steering.",
    looksLike: "A person who down-regulates in ninety seconds instead of ninety minutes; who notices the jaw, the shoulders, the shallow breath early.",
    microUse: "One sixty-second body scan at a red light or between tasks — the interoceptive channel trains on every deliberate read." },
  physical: {
    when: "The training slots are scheduled, but the dividend pays all day: the 3pm hour that used to crash, the stairs, the stress that burns off instead of accumulating.",
    looksLike: "Energy that lasts the whole workday, sleep that arrives on time, a mood floor that sits noticeably higher.",
    microUse: "Walking meetings, stairs over elevators, carrying the groceries — incidental movement keeps the adaptation ticking between sessions." },
  skill: {
    when: "Every real-world use of the trained skill is a rep: the presentation, the negotiation, the analysis, the instrument.",
    looksLike: "Performance conditions stop taxing the skill — it runs below conscious attention while attention goes to the situation.",
    microUse: "Five-minute micro-drills on the weakest component keep the edge; real deployment with a one-line self-review afterward counts double." },
  psychedelic: {
    when: "The sessions are rare and clinical; daily life is where the integration happens — the conversation finally had, the avoidance finally dropped.",
    looksLike: "Not visions — behavior: the flexibility window used to install new patterns while it's open.",
    microUse: "The integration journal and the weekly commitments from integration sessions are the daily interface; the substance is not." },
  neuromodulation: {
    when: "The course is clinical and scheduled; the daily-life job is capitalizing on the shifted substrate — the therapy homework, the behavior change, the re-engagement.",
    looksLike: "Doing the things depression or the target condition had shelved — because the course made them possible, not because it did them for you.",
    microUse: "Whatever behavioral activation the clinic pairs with the course IS the daily practice; the machine moves the floor, you build on it." },
  lifestyle: {
    when: "It IS daily life — the bedtime, the light, the meals, the screens. The protocol dissolves into the day it reorganizes.",
    looksLike: "Nothing dramatic: a person whose environment quietly makes the right thing the default thing.",
    microUse: "Every kept anchor (charger outside the bedroom, walk after lunch) is the rep; the environment does the counting." },
  expressive: {
    when: "At the pressure points — after the hard day, before the hard conversation, when the same thought has circled three times.",
    looksLike: "A notebook session instead of a rumination night; charged events that get processed within days instead of carried for years.",
    microUse: "Even ten minutes of honest writing at the week's worst moment keeps the expressive channel open and the backlog empty." },
  community: {
    when: "The scheduled gathering, plus the connective tissue between: the check-in text, the favor done, the name remembered.",
    looksLike: "A person with somewhere to be and people who notice absence — the infrastructure invisible until the bad season hits.",
    microUse: "One real conversation per gathering and one reach-out between them — belonging is maintained in minutes a week, not hours." },
};
