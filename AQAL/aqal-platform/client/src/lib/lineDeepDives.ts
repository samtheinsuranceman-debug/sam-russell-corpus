// ============================================================
// LINE DEEP DIVES — the long-form content behind /line/:slug.
// One entry per homepage line: the hook, the expanded portrait,
// what changes if you integrate it, what it costs you weak, and
// the landmark studies. Written to be read; the encyclopedia
// (lineEncyclopedia.ts) supplies the quick facts, this supplies
// the story. Citations are real landmark works; DOI-level
// verification runs through the open citation audit (/corrections).
// ============================================================

export type DeepDive = {
  hook: string;        // the opener — why this page matters to YOU
  expanded: string;    // what the line really is, with everyday signs
  integration: string; // what changes when you measure + consciously use it
  risk: string;        // the honest threat narrative when it's weak and unseen
  studies: { cite: string; finding: string }[];
};

export const LINE_DEEP: Record<string, DeepDive> = {
  Logical: {
    hook: "The one line school measured obsessively — and the one most likely to be masquerading as your entire identity.",
    expanded: "Logical intelligence is formal inference under load: holding an argument's structure while the content gets emotional, spotting the contradiction nobody else noticed, knowing what actually follows from what. In daily life it shows up as the ability to debug — a plan, a contract, an excuse — and as the discomfort you feel when two things you believe can't both be true. It is the most studied capacity in the history of psychology, and the core of what IQ tests reward.",
    integration: "Measured honestly against your other 31 lines, this line stops being your whole self-image and becomes a tool with a known range. Strong scorers learn where NOT to lead with it — negotiations, grief, persuasion — and stop losing winnable rooms by being merely right. Moderate scorers learn to externalize logic (checklists, written arguments, decision trees) instead of trusting live reasoning under pressure, which is what strong scorers quietly do anyway.",
    risk: "Weak and unexamined, this line doesn't feel weak — it feels like certainty. You don't notice invalid inferences; you notice that you're sure. That's how bad contracts get signed, how confident business plans hide a broken causal chain, and how the same argument keeps losing while feeling airtight. The danger isn't ignorance; it's the absence of the alarm that should fire when your own reasoning breaks.",
    studies: [
      { cite: "Raven, J. C. (1938). Progressive Matrices. London: H.K. Lewis.", finding: "The purest nonverbal reasoning instrument ever normed — still the reference standard for fluid inference a century on." },
      { cite: "Kyllonen, P. C., & Christal, R. E. (1990). Reasoning ability is (little more than) working-memory capacity?! Intelligence, 14(4), 389–433.", finding: "Reasoning ability tracks working-memory capacity almost one-to-one — logic under load is a hardware question, not just a training question." },
      { cite: "Deary, I. J., Strand, S., Smith, P., & Fernandes, C. (2007). Intelligence and educational achievement. Intelligence, 35(1), 13–21.", finding: "Reasoning measured at age 11 predicted national exam results at 16 at r ≈ .81 — the strongest single predictor education has." },
    ],
  },
  Mathematical: {
    hook: "Every expensive mistake you'll ever make has a number in it somewhere — and most people have never checked whether they can actually see numbers clearly.",
    expanded: "Mathematical intelligence is quantitative fluency in the wild: proportions, probabilities, compounding, base rates — not the symbol-pushing of school, but the felt sense of magnitude that tells you a deal, a dose, or a forecast is off by 10× before you can prove it. The brain carries dedicated machinery for this ('number sense'), and it varies between people far more than politeness admits.",
    integration: "Knowing your real quantitative floor changes your decision architecture. Strong scorers should be the one holding the model in any partnership. Weaker scorers who KNOW it stop making solo money decisions above a set size, double-check anything with a percentage in it, and translate numbers into concrete pictures — and end up out-deciding confident innumerates who never checked. The score buys you the single most protective habit in finance: knowing when to slow down.",
    risk: "Unmeasured weakness here is the most reliably expensive blind spot on the dial. It doesn't announce itself — it just quietly signs the loan with the wrong compounding, trusts the vivid anecdote over the base rate, sizes the bet by feel. People discover this line's weakness in retrospect, in dollars, usually more than once, because nothing in daily life ever tests it explicitly and tells them.",
    studies: [
      { cite: "Dehaene, S. (1997). The Number Sense. Oxford University Press.", finding: "Mapped the brain's dedicated numerical machinery — quantity perception is a biological faculty, not just schooling." },
      { cite: "Ritchie, S. J., & Bates, T. C. (2013). Enduring links from childhood mathematics and reading achievement to adult socioeconomic status. Psychological Science, 24(7), 1301–1308.", finding: "Childhood math skill predicted adult income and SES decades later, over and above IQ and family background." },
      { cite: "Peters, E., et al. (2006). Numeracy and decision making. Psychological Science, 17(5), 407–413.", finding: "Higher numeracy produced measurably better real-world decisions — less framing susceptibility, better risk reads — independent of general intelligence." },
    ],
  },
  Spatial: {
    hook: "The most under-tested major talent in the school system — and the one that predicts engineering and invention better than grades do.",
    expanded: "Spatial intelligence is the mind's eye at work: rotating an object you can't touch, holding a floor plan or a machine or an org chart as one navigable image, feeling where things are without looking. Schools test it almost never after childhood, which means spatially brilliant people routinely reach 40 believing they're 'not academic' while carrying the exact aptitude that builds bridges, reads MRIs, and designs everything you own.",
    integration: "A real score here reroutes careers. Strong spatial scorers who learn it late describe the same thing: years of forcing verbal-sequential methods onto problems their mind wanted to solve as pictures. Integrated, this line turns into diagramming before deciding, sketching systems instead of describing them, and choosing work where the mind's eye is the tool. It is also among the most trainable lines — hundreds of studies show durable, transferable gains.",
    risk: "Weak and unknown, spatial intelligence fails quietly at the moments you assemble, navigate, pack, build, or visualize a plan's moving parts — and loudly the day you choose a career that needs it. The bigger risk runs the other way: a STRONG spatial line that was never measured is a door you walked past for decades because report cards had no row for it.",
    studies: [
      { cite: "Shepard, R. N., & Metzler, J. (1971). Mental rotation of three-dimensional objects. Science, 171(3972), 701–703.", finding: "The founding demonstration that the mind literally rotates images — response time tracks rotation angle degree by degree." },
      { cite: "Wai, J., Lubinski, D., & Benbow, C. P. (2009). Spatial ability for STEM domains. Journal of Educational Psychology, 101(4), 817–835.", finding: "Across 400,000 people over 50 years, spatial ability predicted STEM achievement beyond math and verbal scores — the 'sleeping giant' of talent identification." },
      { cite: "Uttal, D. H., et al. (2013). The malleability of spatial skills: A meta-analysis of training studies. Psychological Bulletin, 139(2), 352–402.", finding: "217 studies: spatial skill is robustly trainable, and the gains persist and transfer to new tasks." },
    ],
  },
  Linguistic: {
    hook: "Every idea you'll ever have is worth exactly what your words can get for it.",
    expanded: "Linguistic intelligence is range, precision, and generativity in language — the distance between what you mean and what you can actually say. It shows up as the exact word arriving on time, as writing that people finish, as the ability to compress a complicated situation into a sentence that sticks. It is one of the oldest measured capacities in psychology and half of every standardized test you ever sat.",
    integration: "Measured against your other lines, this one answers a career-defining question: are words your best export, or the bottleneck in front of better goods? Strong scorers should be writing more than they are — in most rooms the person who frames the problem owns the solution. Scorers whose thinking outruns their language learn the compensations that actually work: writing before meetings, borrowing frames, rehearsing the three sentences that matter.",
    risk: "A weak linguistic line taxes every other strength you have. Brilliant analysis explained badly loses to mediocre analysis explained well — in funding rooms, courtrooms, and marriages alike. And because listeners unconsciously grade competence by fluency, the cost compounds silently: you're not in the rooms where you'd have learned what you were losing.",
    studies: [
      { cite: "Thurstone, L. L. (1938). Primary Mental Abilities. University of Chicago Press.", finding: "Isolated verbal comprehension and word fluency as distinct primary abilities — language skill is its own factor, not generic smarts." },
      { cite: "Pinker, S. (1994). The Language Instinct. William Morrow.", finding: "Language is a dedicated biological instinct with its own machinery — and machinery differs between people." },
      { cite: "Hart, B., & Risley, T. R. (1995). Meaningful Differences in the Everyday Experience of Young American Children. Brookes.", finding: "Vocabulary exposure gaps of tens of millions of words by age four — linguistic range is built, and buildable, across a lifetime." },
    ],
  },
  Musical: {
    hook: "You've been told you're 'not musical' by people who never measured anything.",
    expanded: "Musical intelligence is structure heard in sound: pitch discrimination, rhythmic entrainment, phrasing, the ability to hold a melody's architecture and feel where it must resolve. It is one of the most cleanly measurable capacities in psychology — validated discrimination tests have existed since 1919 — and one of the least-ever-measured in real people. Nearly everyone carrying the belief 'I can't sing / I have no rhythm' is carrying a guess.",
    integration: "A real score usually surprises. Most self-declared 'unmusical' adults test normal and are simply untrained — a distinction that changes everything, because the ear trains at any age. Integrated, this line pays outside music: rhythm work sharpens timing and speech cadence (half of charisma is prosody), and shared music-making is among the fastest social-bonding tools known.",
    risk: "The direct risk is small; the meta-risk is the template. 'I'm just not musical' is usually the FIRST untested story a person accepts about their own mind — and every untested story after it gets easier to accept. This page's odds meter says almost nobody has ever been measured here. A belief about your capabilities that no measurement ever touched isn't self-knowledge; it's rumor.",
    studies: [
      { cite: "Seashore, C. E. (1919). The Psychology of Musical Talent. Silver, Burdett & Co.", finding: "The first standardized musical aptitude battery — musical capacities measured as separable, normally distributed abilities." },
      { cite: "Schellenberg, E. G. (2004). Music lessons enhance IQ. Psychological Science, 15(8), 511–514.", finding: "Randomized assignment to music lessons produced small but real cognitive gains — the ear trains, and training transfers." },
      { cite: "Herholz, S. C., & Zatorre, R. J. (2012). Musical training as a framework for brain plasticity. Neuron, 76(3), 486–502.", finding: "Musical training rewires auditory and motor systems at any age — 'unmusical' is a starting point, not a verdict." },
    ],
  },
  "Bodily-Kinesthetic": {
    hook: "Your body is running its own intelligence — and it's been taking exams your whole life that nobody graded.",
    expanded: "Bodily-kinesthetic intelligence is trained control of the body toward a skilled end: coordination, timing, the rate at which physical skills take. It's why two people at the same gym for a year end up in different sports. Sport science measures it precisely; schools and workplaces never do — PE graded your fitness, not your skill-acquisition rate, which is the actual talent.",
    integration: "Knowing your motor-learning rate changes how you train everything physical — how much repetition you actually need, whether you learn by feel or by cue, where your ceiling likely sits. And this line leaks into everything: physical presence is read as confidence in every room you enter, movement is the most reliable state-change tool you own, and the body's skill confidence transfers to general self-trust in ways people feel but never name.",
    risk: "Weak and ignored, this line costs quietly and medically: the injury from movement patterns nobody ever coached, the aging trajectory of a body that was never trained because 'I'm not athletic' went untested, the daily anxiety that a simple movement practice would have discharged. The line is near-zero correlated with IQ — being smart tells you nothing about it, which is exactly why smart people neglect it.",
    studies: [
      { cite: "Fleishman, E. A. (1954). Dimensional analysis of psychomotor abilities. Journal of Experimental Psychology, 48(6), 437–454.", finding: "Psychomotor ability decomposed into stable, measurable dimensions — largely independent of cognitive test scores." },
      { cite: "Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. Psychological Review, 100(3), 363–406.", finding: "Physical expertise follows deliberate-practice laws of its own — structured hours, not talent stories, separate performers." },
      { cite: "Hillman, C. H., Erickson, K. I., & Kramer, A. F. (2008). Be smart, exercise your heart: exercise effects on brain and cognition. Nature Reviews Neuroscience, 9(1), 58–65.", finding: "Physical training measurably upgrades cognition across the lifespan — the body line feeds every other line." },
    ],
  },
  Naturalist: {
    hook: "The oldest intelligence humans have — pattern-reading in living systems — and the modern world stopped grading it entirely.",
    expanded: "Naturalist intelligence reads living systems: fine distinctions between organisms, growth patterns, seasons, ecosystems — the capacity that kept your ancestors alive and now shows up as the gardener who 'just knows,' the farmer reading weather, the person who notices the office is an ecosystem too. It generalizes: people strong here often read markets, organizations, and families as living systems with health, cycles, and niches.",
    integration: "Integrated, this line becomes a transferable analytical style: what feeds this system, what's parasitic on it, what season is it in? That framing routinely out-diagnoses mechanical thinking on organic problems — cultures, markets, careers. And the line's home turf pays directly: time in living systems measurably restores attention, and people strong here draw disproportionate cognitive benefit from it.",
    risk: "Weak and unknown, you treat living systems as machines — push the lever, expect the output — and are perpetually surprised when gardens, teams, children, and markets don't comply. Strong and unknown, you've possibly spent your career in a cubicle wondering why the thing everyone calls success feels like deficiency. This line almost never appears on any test anyone takes.",
    studies: [
      { cite: "Gardner, H. (1999). Intelligence Reframed. Basic Books.", finding: "Formally added naturalist intelligence to the multiple-intelligences framework — distinct profile, distinct developmental path." },
      { cite: "Berman, M. G., Jonides, J., & Kaplan, S. (2008). The cognitive benefits of interacting with nature. Psychological Science, 19(12), 1207–1212.", finding: "A walk in nature measurably restored attention and working memory where an urban walk did not." },
      { cite: "Atran, S., & Medin, D. (2008). The Native Mind and the Cultural Construction of Nature. MIT Press.", finding: "Folk-biological reasoning is a distinct, culturally-honed cognitive system — expertise in living kinds follows its own rules." },
    ],
  },
  Interpersonal: {
    hook: "The line that decides your salary negotiations, your hiring, your marriage, and your funeral attendance — mostly uninvited by IQ.",
    expanded: "Interpersonal intelligence models other minds: what they want, what they fear, what they'll do next, and how to move with — or around — it. It's the room-reader, the coalition-builder, the person conflict de-escalates near. Work sometimes gestures at measuring it (360 reviews); almost nothing measures it cleanly, and its correlation with IQ is modest enough that brilliant people are regularly terrible at it without ever being told.",
    integration: "Measured, this line sets your strategy for every collective endeavor. Strong scorers should run point on anything requiring alignment — and learn their signature risk, manipulation drift. Weaker scorers who know it stop winging high-stakes interactions: they prepare scripts, recruit socially-fluent allies, choose environments where output speaks. Group-intelligence research is blunt: teams succeed on social sensitivity more than on member IQ.",
    risk: "Weak and unseen, this line generates a specific tragedy: being right, alone. Deals lost to worse products with better handshakes, promotions lost to worse work with better lunches, a family that obeys but doesn't confide. The cruelest part is the feedback loop — the signals that would teach you are exactly the signals you can't read.",
    studies: [
      { cite: "Woolley, A. W., et al. (2010). Evidence for a collective intelligence factor in the performance of human groups. Science, 330(6004), 686–688.", finding: "Group performance tracked members' social sensitivity, not average IQ — the social line outweighed g when work went collective." },
      { cite: "Rosenthal, R., et al. (1979). Sensitivity to Nonverbal Communication: The PONS Test. Johns Hopkins University Press.", finding: "Nonverbal decoding measured as a stable individual skill — wide human range, only loosely related to academic ability." },
      { cite: "Mayer, J. D., Salovey, P., & Caruso, D. R. (2008). Emotional intelligence: new ability or eclectic traits? American Psychologist, 63(6), 503–517.", finding: "Ability-based social-emotional intelligence is measurable and distinct from personality and IQ." },
    ],
  },
  Intrapersonal: {
    hook: "Every plan you make is drawn on a map of yourself. When did anyone check the map?",
    expanded: "Intrapersonal intelligence is the accuracy of your self-model: knowing your real motives (not your stated ones), your actual limits, your patterns, the gap between how you think you come across and how you do. Psychology can measure this — as the distance between self-report and behavior — and the distances it finds are enormous. This is the line every OTHER line's development depends on, because you can't fix what your map doesn't show.",
    integration: "Integrated, this line is a multiplier on everything: goals get set from real preferences instead of borrowed ones, commitments get sized to actual capacity, feedback stops feeling like attack because your self-image was already accurate. People strong here waste years less — on wrong careers, wrong partners, wrong cities — because the instrument doing the choosing was calibrated.",
    risk: "A weak self-model is the most expensive possession you can own, because every decision routes through it. It buys the classic decade-losses: the career chosen for an imagined self, the recurring relationship crash nobody 'saw coming' (fourth time), the confidence at the exact moments competence was absent. Worse, self-model error is self-hiding — the blind spot includes the blind spot.",
    studies: [
      { cite: "Kruger, J., & Dunning, D. (1999). Unskilled and unaware of it. Journal of Personality and Social Psychology, 77(6), 1121–1134.", finding: "The weakest performers were the most miscalibrated about themselves — self-model accuracy is a skill the unskilled lack twice." },
      { cite: "Zell, E., & Krizan, Z. (2014). Do people have insight into their abilities? A metasynthesis. Perspectives on Psychological Science, 9(2), 111–125.", finding: "Across hundreds of studies, self-views correlated with actual ability at only r ≈ .29 — most people's self-map is mostly wrong." },
      { cite: "Wilson, T. D. (2002). Strangers to Ourselves. Harvard University Press.", finding: "The adaptive unconscious runs much of behavior outside self-awareness — accurate self-knowledge requires external instruments, not just introspection." },
    ],
  },
  Existential: {
    hook: "There is a line that only gets tested on the worst day of your life — and by then the score is already in.",
    expanded: "Existential intelligence is the capacity to work seriously with the largest questions — mortality, meaning, what a life is for — without flinching into distraction or collapsing into despair. It looks abstract until it isn't: the diagnosis, the loss, the success that arrives empty. People strong on this line have load-bearing answers built before the load came. It is essentially uncorrelated with IQ; brilliant people collapse here constantly.",
    integration: "Built deliberately, this line functions as pre-positioned infrastructure. Purpose measurably predicts longevity and buffers depression; a worked-out relationship with mortality converts into daily prioritization (the deathbed test kills most fake obligations on contact); meaning built before crisis is the difference between grief and destruction. It also quietly powers persistence — a strong 'why' carries any 'how.'",
    risk: "Weak and deferred, this line presents two bills. The slow one: decades of default living — goals inherited, calendar full, life unchosen — discovered at 65 as regret. The fast one: the crisis arrives (it always arrives) and finds no philosophy in stock, and what would have been a hard season becomes a collapse. Meaning is the cheapest thing to build early and the most expensive to need suddenly.",
    studies: [
      { cite: "Frankl, V. E. (1946/1959). Man's Search for Meaning. Beacon Press.", finding: "Meaning functioned as survival infrastructure under the most extreme conditions ever documented." },
      { cite: "Hill, P. L., & Turiano, N. A. (2014). Purpose in life as a predictor of mortality across adulthood. Psychological Science, 25(7), 1482–1486.", finding: "Purpose predicted lower mortality across 14 years, at every age, controlling for other wellbeing markers." },
      { cite: "Steger, M. F., et al. (2006). The Meaning in Life Questionnaire. Journal of Counseling Psychology, 53(1), 80–93.", finding: "Meaning is measurable as presence and search — distinct dimensions with distinct wellbeing signatures." },
    ],
  },
  Moral: {
    hook: "Not what you believe — what your ethics can carry when carrying it costs you something.",
    expanded: "Moral intelligence is the altitude of the ethical frame you actually live, not the one you'd report. It develops in measurable stages — from rule-following, to reputation management, to principles held even against self-interest — and most adults stop developing it early, not because they're bad but because nothing in adult life demands the next stage. It shows up in what you do when the right thing is expensive and nobody's watching.",
    integration: "Worked consciously, this line compounds into the rarest business asset: being known as someone whose word survives incentives. Trust moves faster than contracts and cheaper than lawyers. It also simplifies cognition itself — people with settled principles spend no bandwidth re-litigating each temptation — and it's the line your children are silently recording at maximum fidelity.",
    risk: "A weak moral line rarely fails dramatically; it erodes. Small compromises set precedents, precedents become character, and character eventually meets a spotlight — an audit, a divorce deposition, a journalist. The pattern in every public collapse is the same: the person didn't decide to be corrupt; they just never built the stage of ethics that could refuse the third small thing.",
    studies: [
      { cite: "Kohlberg, L. (1969). Stage and sequence: the cognitive-developmental approach to socialization. In Handbook of Socialization Theory and Research. Rand McNally.", finding: "Moral reasoning develops through ordered, measurable stages — altitude, not opinion." },
      { cite: "Rest, J. R. (1979). Development in Judging Moral Issues. University of Minnesota Press.", finding: "The Defining Issues Test made moral-stage measurement standardized and repeatable at scale." },
      { cite: "Graham, J., Haidt, J., & Nosek, B. A. (2009). Liberals and conservatives rely on different sets of moral foundations. Journal of Personality and Social Psychology, 96(5), 1029–1046.", finding: "Moral cognition decomposes into measurable foundations — people's ethical machinery genuinely differs, mappably." },
    ],
  },
  Aesthetic: {
    hook: "Somebody on every winning team can see why a thing lands. Nobody ever tested whether it's you.",
    expanded: "Aesthetic intelligence is discernment of form — the trained eye that knows why one version works and the other doesn't, across rooms, products, documents, outfits, interfaces. It is not taste-as-preference; it's taste-as-perception, and it develops through deliberate exposure like any expertise. Research can measure it; nothing in ordinary life ever does, so most people have no idea where they sit.",
    integration: "In a market where everything works, form is the tiebreaker — people buy, join, and believe the option that FEELS right, then rationalize. Integrated, this line converts directly: the deck that gets funded, the product that gets chosen, the presence that gets remembered. Strong scorers should be the final eye on everything customer-facing; weaker scorers who know it learn the most profitable delegation in business: hire the eye, and obey it.",
    risk: "Weak and unknown, this line doesn't feel like anything — that's the trap. Your work is competent and invisible; buyers pick competitors 'for no reason'; your environments subtly drain the people in them, you included. You can't A/B test your way out of a deficit you can't perceive, and nobody will tell you, because aesthetic criticism feels personal. (Evidence base honestly marked: thinner than the cognitive lines — see the audit note below.)",
    studies: [
      { cite: "Leder, H., Belke, B., Oeberst, A., & Augustin, D. (2004). A model of aesthetic appreciation and aesthetic judgments. British Journal of Psychology, 95(4), 489–508.", finding: "Aesthetic response decomposes into trainable processing stages — expertise changes what the eye literally finds." },
      { cite: "Chatterjee, A. (2014). The Aesthetic Brain. Oxford University Press.", finding: "Aesthetic judgment runs on distinct neural circuitry linking perception, meaning, and reward — a faculty, not a whim." },
      { cite: "Reber, R., Schwarz, N., & Winkielman, P. (2004). Processing fluency and aesthetic pleasure. Personality and Social Psychology Review, 8(4), 364–382.", finding: "What 'feels right' tracks processing fluency — form quietly steers judgment even when content is equal." },
    ],
  },
  Emotional: {
    hook: "The difference between people who have feelings and people whose feelings have them is measurable — and trainable.",
    expanded: "Emotional intelligence here means two specific skills: granularity — naming your states precisely enough to work with them ('resentful-because-unacknowledged,' not 'bad') — and regulation — changing state on purpose instead of being weather. Corporate 'EQ' quizzes gesture at this; the ability-based science measures it properly, and it moves through deliberate practice at any age.",
    integration: "Granularity alone is a superpower disguised as vocabulary: people who name states precisely recover faster, decide better under stress, and stop bleeding decision quality in the hours after difficult interactions. Regulation compounds it — the negotiator who can down-shift arousal on command, the parent who doesn't transmit their day to their kids, the investor who can feel fear without obeying it.",
    risk: "Weak, this line taxes everything at the worst moments: the email sent angry, the deal blown by leaked frustration, the marriage eroded by states that arrived unnamed and left damage. Unregulated emotion doesn't just feel bad — it makes your other 31 lines temporarily unavailable exactly when stakes peak. Most people discover this line's weakness through consequences, one relationship at a time.",
    studies: [
      { cite: "Salovey, P., & Mayer, J. D. (1990). Emotional intelligence. Imagination, Cognition and Personality, 9(3), 185–211.", finding: "Founded the ability model: perceiving, using, understanding, and regulating emotion as measurable skills." },
      { cite: "Kashdan, T. B., Barrett, L. F., & McKnight, P. E. (2015). Unpacking emotion differentiation. Current Directions in Psychological Science, 24(1), 10–16.", finding: "High emotional granularity predicts better regulation, less aggression, less self-medication — precision of naming is functional, not decorative." },
      { cite: "Gross, J. J. (1998). The emerging field of emotion regulation. Review of General Psychology, 2(3), 271–299.", finding: "Regulation strategies differ measurably in cost and effectiveness — state-change is a learnable technology." },
    ],
  },
  "Meta-Cognitive": {
    hook: "Smart people don't crash because they stop thinking. They crash because nothing told them their thinking had degraded.",
    expanded: "Meta-cognitive intelligence is thinking about your thinking while it happens: knowing when you're too tired, too angry, too invested, or too rushed to trust your own output — and knowing what your current confidence is actually worth. It's the mental dashboard. Psychology measures it as calibration: the match between how sure you are and how right you are. Most people have never seen their calibration curve.",
    integration: "This line is the platform's favorite lever because it's cheap to train and pays everywhere. Integrated, it looks like: deciding WHEN to decide (not just what), postponing irreversible calls past sleep, flagging your own hot states before others act on them, and holding confidence as a number with error bars. Every other line performs better with a working dashboard over it.",
    risk: "Weak meta-cognition is the signature failure mode of successful people — the crash that happens at maximum momentum, when everything was 'under control.' No alarm fired because this line IS the alarm. The Black Box exists because of this line: nearly every catastrophic story we collect contains the sentence 'I was sure,' uttered by a mind whose surety-meter was broken and unmonitored.",
    studies: [
      { cite: "Flavell, J. H. (1979). Metacognition and cognitive monitoring. American Psychologist, 34(10), 906–911.", finding: "Founded the field: monitoring and control of one's own cognition is a distinct, developable capacity." },
      { cite: "Fleming, S. M., & Dolan, R. J. (2012). The neural basis of metacognitive ability. Philosophical Transactions of the Royal Society B, 367(1594), 1338–1349.", finding: "Metacognitive accuracy varies between people independent of task skill and has its own neural substrate." },
      { cite: "Dunlosky, J., et al. (2013). Improving students' learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4–58.", finding: "Knowing which of your own learning strategies actually work is itself a measurable skill — and most people's self-assessments are wrong." },
    ],
  },
  Volitional: {
    hook: "Talent decides what you could do. This line decides what actually gets done.",
    expanded: "Volitional intelligence is follow-through: sustained, directed effort after the mood that started it has died. It's measured as grit and trait self-control, and the findings are humbling — childhood self-control predicts adult income, health, and stability decades out, rivaling IQ and class. It shows up as the person still executing in week six, when motivation is a memory.",
    integration: "The integration secret research keeps confirming: high performers don't white-knuckle — they architect. Strong scorers learn to point their engine at fewer, better targets (grit aimed at the wrong hill is a tragedy with excellent attendance). Weaker scorers who KNOW it stop moralizing and start engineering: commitment devices, environment design, stakes, accountability — systems that make quitting harder than continuing. Both strategies work; only measurement tells you which one is yours.",
    risk: "Weak and unadmitted, this line is the graveyard of potential: the course at lesson three, the business at month two, the novel at chapter one — a decade of brilliant starts compiling into a résumé of almosts. The lie that protects it ('I just haven't found my passion') postpones the fix indefinitely, because the fix begins with an honest number.",
    studies: [
      { cite: "Moffitt, T. E., et al. (2011). A gradient of childhood self-control predicts health, wealth, and public safety. PNAS, 108(7), 2693–2698.", finding: "In 1,000 people tracked from birth, childhood self-control predicted adult outcomes across every domain — independent of IQ and social class." },
      { cite: "Duckworth, A. L., et al. (2007). Grit: perseverance and passion for long-term goals. Journal of Personality and Social Psychology, 92(6), 1087–1101.", finding: "Sustained passion-plus-persistence predicted achievement beyond talent measures at West Point, spelling bees, and beyond." },
      { cite: "de Ridder, D. T. D., et al. (2012). Taking stock of self-control: a meta-analysis. Personality and Social Psychology Review, 16(1), 76–99.", finding: "Trait self-control's real mechanism is habit and situation design — the disciplined structure their lives so willpower is rarely needed." },
    ],
  },
  Adversarial: {
    hook: "Every game you're in, someone is playing against you. This is the line that notices.",
    expanded: "Adversarial intelligence sees the move against you: the negotiation anchor, the manipulation dressed as friendship, the contract clause with your name on it, the competitor's feint. Schools never touch it — it's the difference between intelligence and shrewdness, and the reason certified-brilliant people get systematically fleeced. Its correlation with IQ is low enough to be a punchline among con artists, who prefer smart marks.",
    integration: "Integrated, this line doesn't make you paranoid — it makes you calibrated. You learn your baseline (trusting? suspicious? accurate?), when your read of an opponent is data versus projection, and which negotiations you should never enter alone. Strong scorers make natural deal-makers, litigators, and security minds. Weaker scorers who know it adopt the one rule that neutralizes most predation: never decide alone under pressure applied by the counterparty.",
    risk: "Weak and unknown, you are the market's favorite customer. The pattern is invisible from inside: partnerships where you did the work, deals that needed signing TODAY, advisors whose advice always routed money past them. Each episode feels like bad luck. The tuition for learning this line by experience is unbounded — some people pay with everything, late in life, to someone they loved.",
    studies: [
      { cite: "Cialdini, R. B. (1984). Influence: The Psychology of Persuasion. William Morrow.", finding: "Catalogued the compliance mechanics used on you daily — and showed recognizing them is a learnable defense." },
      { cite: "Ekman, P., & O'Sullivan, M. (1991). Who can catch a liar? American Psychologist, 46(9), 913–920.", finding: "Deception detection is a real, measurable skill with enormous individual differences — and confidence in it is uncorrelated with accuracy." },
      { cite: "Camerer, C. F. (2003). Behavioral Game Theory. Princeton University Press.", finding: "Strategic reasoning depth varies systematically between people and predicts who wins mixed-motive games." },
    ],
  },
  Interoceptive: {
    hook: "Your body knows you're burning out, deciding badly, and getting sick — days before your mind does. Can you hear it?",
    expanded: "Interoceptive intelligence reads the body's internal signals: the tight chest that means this deal is wrong, the fatigue that means stop before the mistake, the gut-read that turns out to be pattern recognition wearing a costume. Labs measure it with heartbeat-detection tasks; individual differences are large, stable, and — outside a lab — almost nobody on earth has ever been tested.",
    integration: "Integrated, this line is an early-warning network. Interoceptive accuracy tracks with better intuitive decisions (traders with better heartbeat perception literally out-earn), earlier illness detection, emotional granularity (feelings are read FROM the body), and burnout prevention — you feel the slide at 20% depletion instead of discovering it at 90%. Training exists and works: attention to the body is a skill, not a gift.",
    risk: "Weak, this line fails silently until it fails medically. The heart attack that 'came from nowhere' after months of ignored signals; the breakdown that coworkers saw coming and the owner didn't; decisions degraded by hunger, fatigue, and stress that never reached awareness. A mind that can't hear its own body is flying instruments-out and calling it toughness.",
    studies: [
      { cite: "Garfinkel, S. N., et al. (2015). Knowing your own heart: distinguishing interoceptive accuracy from interoceptive awareness. Biological Psychology, 104, 65–74.", finding: "Interoception decomposes into measurable dimensions — accuracy, sensibility, and metacognitive awareness — with wide individual differences." },
      { cite: "Kandasamy, N., et al. (2016). Interoceptive ability predicts survival on a London trading floor. Scientific Reports, 6, 32986.", finding: "Traders' heartbeat-detection accuracy predicted profitability and career longevity — gut feel, measured, is market-relevant signal." },
      { cite: "Craig, A. D. (2009). How do you feel — now? The anterior insula and human awareness. Nature Reviews Neuroscience, 10(1), 59–70.", finding: "Mapped the neural pathway that turns body states into felt awareness — the hardware behind 'gut feeling.'" },
    ],
  },
  Strategic: {
    hook: "Operators play the move in front of them. Owners play the board. Which one your mind does by default is measurable.",
    expanded: "Strategic intelligence is multi-move sequencing toward an end nobody can see yet: positioning before the opportunity, resource allocation across time, the felt difference between what wins today and what wins the decade. Chess research founded its science; forecasting research modernized it — and showed that long-horizon judgment is a distinct, improvable skill with enormous person-to-person spread.",
    integration: "Measured, this line assigns roles honestly: strong scorers belong where positioning is the job — and must guard their signature failure, the perfect plan unexecuted. Tactical minds who know it stop feeling inferior and start partnering deliberately: pair a board-player with a street-fighter and you get a company; two of either and you get a hobby or a brawl. The score also tells you how far out YOUR planning horizon actually extends, versus how far you claim.",
    risk: "Weak and unknown, life happens TO you: reacting brilliantly inside a position that was lost three moves ago, winning every battle in a war nobody pointed at anything, reaching 50 with maximum effort and no compounding. The costliest version is the successful one — a tactically gifted person whose wins keep disguising the absence of any board at all.",
    studies: [
      { cite: "de Groot, A. D. (1965). Thought and Choice in Chess. Mouton.", finding: "Founded the science of expert strategic thought — masters see structures and futures where novices see pieces." },
      { cite: "Tetlock, P. E., & Gardner, D. (2015). Superforecasting: The Art and Science of Prediction. Crown.", finding: "Long-horizon judgment is a measurable, trainable skill — the best forecasters beat experts through method, not credentials." },
      { cite: "Klein, G. (1998). Sources of Power: How People Make Decisions. MIT Press.", finding: "Expert decision-makers run mental simulations forward — a distinct cognitive move that separates strategists from reactors." },
    ],
  },
  Systemic: {
    hook: "Your hardest problems aren't hard. They're loops — and you keep cutting them in the one place that makes them tighter.",
    expanded: "Systemic intelligence sees feedback loops, delays, and second-order effects: why the fix made it worse, why the bottleneck moved instead of vanishing, why every 'obvious' intervention in a complex system backfires on schedule. MIT's system-dynamics lab spent decades documenting the brutal news: most people — including executives — fail even simple stock-and-flow problems, and don't know they fail.",
    integration: "Integrated, this line changes your unit of analysis from events to structures. You stop asking 'who screwed up' and start asking 'what structure made that the natural move.' That single shift out-diagnoses armies of event-thinkers on org problems, market dynamics, family patterns, and your own recurring personal loops — which are, of course, systems too, which is why the same crash keeps happening with different casts.",
    risk: "Weak and unaware, you play whack-a-mole professionally and personally: solving the same problem annually in new clothes, pushing growth levers that trigger the collapse lever, mistaking delay for success right up until the correction lands. Systems punish linear minds with compound interest, and they never explain why.",
    studies: [
      { cite: "Booth Sweeney, L., & Sterman, J. D. (2000). Bathtub dynamics: initial results of a systems thinking inventory. System Dynamics Review, 16(4), 249–286.", finding: "Highly educated adults systematically failed elementary stock-and-flow reasoning — systemic thinking is genuinely rare, even at MIT." },
      { cite: "Meadows, D. H. (2008). Thinking in Systems: A Primer. Chelsea Green.", finding: "Codified leverage points: where to intervene in a system — and why intuition reliably picks the weakest ones." },
      { cite: "Dörner, D. (1996). The Logic of Failure. Metropolitan Books.", finding: "In simulated complex systems, capable people produced catastrophes through the same measurable reasoning errors — and improved with training." },
    ],
  },
  Entrepreneurial: {
    hook: "Some people see the gap in the market the way you see a door in a wall. That difference is measurable — and it isn't IQ.",
    expanded: "Entrepreneurial intelligence is opportunity perception plus risk digestion: noticing the unmet need everyone walks past, moving with acceptable-loss logic instead of perfect-information logic, and metabolizing uncertainty as fuel rather than poison. The research on expert founders shows a distinct reasoning style — effectuation — that can be identified, taught, and measured.",
    integration: "Measured, this line answers the most expensive question in working life honestly: found, join early, or partner? Strong scorers stop apologizing for the pattern-itch and start systematizing it (one page per opportunity: who pays, why now, what's the acceptable loss). Weaker scorers who know it stop lighting savings on fire to prove a point and start supplying what founders lack — which is most things.",
    risk: "Two mirror risks. Strong and unintegrated: serial almost-startups, opportunity addiction, a decade of openings chased and none compounded. Weak and unadmitted: the mortgage bet on a venture your own dial said not to drive — the single most destructive financial event we see in Black Box records. Both are prevented by the same honest number.",
    studies: [
      { cite: "Sarasvathy, S. D. (2001). Causation and effectuation: toward a theoretical shift to entrepreneurial contingency. Academy of Management Review, 26(2), 243–263.", finding: "Expert entrepreneurs share a distinct, identifiable reasoning logic — a cognitive style, not a personality myth." },
      { cite: "Shane, S., & Venkataraman, S. (2000). The promise of entrepreneurship as a field of research. Academy of Management Review, 25(1), 217–226.", finding: "Opportunity recognition established as the core entrepreneurial capacity — and it varies systematically between people." },
      { cite: "Åstebro, T., et al. (2014). Seeking the roots of entrepreneurship. Journal of Economic Perspectives, 28(3), 49–70.", finding: "Entrepreneurial entry and persistence track measurable individual differences in risk attitude and overconfidence — self-knowledge here is worth actual money." },
    ],
  },
  Creative: {
    hook: "The last human monopoly. Machines optimize; this line originates.",
    expanded: "Creative intelligence is generativity: producing things that are both new and useful — ideas, products, sentences, solutions that didn't exist until you did them. Sixty years of research says it's measurable (fluency, flexibility, originality), only loosely coupled to IQ above a modest threshold, and — critically — that self-assessments of it are nearly worthless. The uncreative claim it constantly; the creative often doubt it.",
    integration: "Measured, this line gets a job description. True generatives learn to protect the two conditions research keeps finding — incubation time and psychological safety — and to pair with finishers (origination and completion are different lines; most 'blocked artists' are unpartnered, not untalented). Taste-strong/output-modest scorers discover curation, editing, and direction — the creative economy's best-paid seats.",
    risk: "Weak and unadmitted, you compete on efficiency in an age automating it — the most exposed position in the modern economy. Strong and unintegrated is sadder: the notebook of ideas executed by braver strangers years later. Original perception without deployment doesn't just waste the gift; it curdles into the specific bitterness of watching your unlived ideas succeed for other people.",
    studies: [
      { cite: "Torrance, E. P. (1966). The Torrance Tests of Creative Thinking. Personnel Press.", finding: "Standardized creativity measurement — and its longitudinal follow-ups predicted real creative achievement decades later." },
      { cite: "Kim, K. H. (2005). Can only intelligent people be creative? A meta-analysis. Journal of Secondary Gifted Education, 16(2–3), 57–66.", finding: "Creativity–IQ correlation is modest: above an ordinary threshold, creative capacity is its own dimension." },
      { cite: "Beaty, R. E., et al. (2018). Robust prediction of individual creative ability from brain functional connectivity. PNAS, 115(5), 1087–1092.", finding: "Creative ability predicted from whole-brain network signatures — original thinking has identifiable machinery." },
    ],
  },
  Rhetorical: {
    hook: "The best idea in the room loses to the best-delivered idea in the room, ten times out of ten. Which side of that trade are you on?",
    expanded: "Rhetorical intelligence moves people: framing, timing, story, the compression of a complex case into the sentence a decision-maker repeats to their boss. Persuasion science (two continuous millennia of it, Aristotle to randomized trials) is unambiguous that this is structured, learnable skill — and that its possession is only loosely related to the quality of one's ideas, which is exactly the problem.",
    integration: "Measured, this line either becomes your export engine or gets deliberately compensated. Strong scorers should be the one in front of the funder, jury, or crowd — and must watch the ethics line, because skill here without the Moral line is a weapon. Weaker scorers who know it write instead of improvise, borrow frames, rehearse the three sentences that matter, and recruit voices — and stop donating their best ideas to whoever restates them louder.",
    risk: "Weak and unknown, your ideas travel at a permanent discount. The pattern: your point ignored at minute five, restated by someone else at minute forty to applause. Compounded over a career, the rhetorical gap explains more unfair-feeling outcomes — promotions, funding, credit — than talent gaps do. The world doesn't buy ideas; it buys deliveries.",
    studies: [
      { cite: "Petty, R. E., & Cacioppo, J. T. (1986). The Elaboration Likelihood Model of persuasion. Advances in Experimental Social Psychology, 19, 123–205.", finding: "Persuasion runs on two mappable routes — and matching message to route is a learnable, testable skill." },
      { cite: "O'Keefe, D. J. (2016). Persuasion: Theory and Research (3rd ed.). SAGE.", finding: "Decades of experimental persuasion effects catalogued — message design has reliable, teachable mechanics." },
      { cite: "Green, M. C., & Brock, T. C. (2000). The role of transportation in the persuasiveness of public narratives. Journal of Personality and Social Psychology, 79(5), 701–721.", finding: "Story measurably outperforms argument: narrative transportation lowers resistance in ways facts cannot." },
    ],
  },
  Leadership: {
    hook: "Authority is granted. Followership is earned by something people can feel — and that something is measurable.",
    expanded: "Leadership intelligence is the capacity to make people WANT to move in a direction: vision people can see, trust people can bank, decisions made cleanly under uncertainty, and the emotional broadcast that sets a room's weather. Meta-analytic science finds it only moderately related to IQ — the brilliant-but-unfollowed boss is a research finding, not just your last job.",
    integration: "Measured, this line decomposes into trainable parts: which muscle is weak — vision, trust-building, decision speed, or state broadcast? That specificity converts 'be a better leader' from a platitude into a program. Strong scorers learn their shadow (charisma without the Moral line builds cults, not companies). Weaker scorers who know it lead differently — through competence, systems, and one-on-one depth — or partner with a front-person and own the engine room proudly.",
    risk: "Weak and unadmitted while holding authority is organizational poison: teams that comply without committing, your best people leaving managers-not-companies, meetings where the real conversation waits until you exit. The market eventually routes around unfollowed authority — but slowly, expensively, and usually after your best years went into a room that was never actually with you.",
    studies: [
      { cite: "Judge, T. A., Colbert, A. E., & Ilies, R. (2004). Intelligence and leadership: a quantitative review. Journal of Applied Psychology, 89(3), 542–552.", finding: "IQ–leadership correlation is far weaker than assumed (ρ ≈ .21) — leading is substantially its own capacity." },
      { cite: "Bass, B. M. (1985). Leadership and Performance Beyond Expectations. Free Press.", finding: "Transformational leadership defined and measured — the specific behaviors that turn compliance into commitment." },
      { cite: "Edmondson, A. (1999). Psychological safety and learning behavior in work teams. Administrative Science Quarterly, 44(2), 350–383.", finding: "The leader-built climate of psychological safety predicts team learning and performance — leadership operates through the room it creates." },
    ],
  },
  Mechanical: {
    hook: "Some minds hear machines think. The economy pays them fortunes and the schools never once checked if you're one of them.",
    expanded: "Mechanical intelligence is intuition for how physical things work: forces, tolerances, linkages, why it rattles, where it will break. The military has measured it for eighty years because lives depend on it; schools dropped shop class and measure it never. It's substantially independent of grades — the C student who fixes anything is a psychometric archetype, not an anomaly.",
    integration: "Measured strong, this line is one of the best-paying under-credentialed talents in the economy — skilled trades, field engineering, robotics, prototyping — and a lifetime discount on everything you own. Integrated at any level, its thinking style transfers: 'mechanical sympathy' (knowing how the system underneath actually works) improves how you run software teams, processes, and even your own body.",
    risk: "Weak and unknown: a lifetime retail tax paid to everyone who understands your possessions better than you do, plus the occasional dangerous improvisation. Strong and unknown is the real theft — decades in a cubicle wondering why nothing feels like traction, while the aptitude that would have felt like play was never once put on any test you took.",
    studies: [
      { cite: "Bennett, G. K. (1940). Bennett Mechanical Comprehension Test. The Psychological Corporation.", finding: "Mechanical aptitude standardized as its own measurable ability — still in worldwide industrial use 85 years later." },
      { cite: "Hegarty, M. (2004). Mechanical reasoning by mental simulation. Trends in Cognitive Sciences, 8(6), 280–285.", finding: "Mechanical minds literally simulate machines internally — a distinct cognitive process observable in the lab." },
      { cite: "Ree, M. J., & Carretta, T. R. (1994). The correlation of general cognitive ability and psychomotor/technical aptitudes. Military Psychology, 6(1).", finding: "Decades of ASVAB data: technical-mechanical aptitude carries predictive validity of its own beyond g." },
    ],
  },
  "Pattern-Recognition": {
    hook: "Before you reason, you see. This line is how fast the world's structure jumps out at you — and it feeds everything else.",
    expanded: "Pattern-recognition intelligence is fast structure-detection: the anomaly in the spreadsheet, the trend before the chart, the familiar shape inside the unfamiliar problem. It's the raw feed most other lines consume — chess masters' 'intuition' is measured chunk-recognition, radiologists' 'glance' is perceptual learning — and it improves with structured exposure in ways cognitive science has mapped precisely.",
    integration: "Measured, this line tells you which rooms you'll be fast in and which you'll be lost in — because pattern skill is domain-fed: it runs on your library of seen cases. Integration means feeding it deliberately (cases, reps, post-mortems) in the ONE domain you've chosen to be fast in, and — critically — learning when your pattern-matcher is out of distribution and must hand the wheel to slow reasoning.",
    risk: "The weak version is slowness where speed pays — markets, diagnostics, danger. The subtle version is worse: a strong matcher trained on the wrong library, confidently recognizing patterns that no longer apply — the veteran fighting the last war, the investor seeing 2008 in every dip. An unexamined pattern engine doesn't just miss; it MISFIRES, with conviction.",
    studies: [
      { cite: "Gobet, F., & Simon, H. A. (1996). Templates in chess memory: a mechanism for recalling several boards. Cognitive Psychology, 31(1), 1–40.", finding: "Expert 'intuition' decomposed into measurable chunk-recognition — tens of thousands of stored patterns, retrievable in milliseconds." },
      { cite: "Kellman, P. J., & Garrigan, P. (2009). Perceptual learning and human expertise. Physics of Life Reviews, 6(2), 53–84.", finding: "Structure-detection is trainable: perceptual learning modules produced expert-grade pattern pickup in compressed time." },
      { cite: "Kahneman, D., & Klein, G. (2009). Conditions for intuitive expertise: a failure to disagree. American Psychologist, 64(6), 515–526.", finding: "Pattern intuition is trustworthy exactly when the environment is regular and feedback was real — and dangerous everywhere else." },
    ],
  },
  "Social-Perceptual": {
    hook: "The room is broadcasting constantly — micro-expressions, tone shifts, alliances forming. Some people receive all of it. What's your antenna rated?",
    expanded: "Social-perceptual intelligence is real-time signal reading: the flicker of contempt at the deal table, the voice under the words on a phone call, who just aligned with whom in a meeting's silent traffic. Labs measure it to the millisecond (eyes-tests, micro-expression batteries); daily life measures it only in consequences. It's related to, but distinct from, interpersonal skill — this is the RECEIVER; that's the transmitter.",
    integration: "Integrated, this line is negotiation-grade equipment: you catch the wince the counterparty suppressed, the exact moment the client checked out, the hidden no inside the polite yes — while they're still fixable. Strong scorers learn to trust the read and act early. Weaker scorers who know it compensate structurally: explicit check-ins, written confirmations, a socially-perceptive ally in every big room.",
    risk: "Weak and unknown, you operate socially blind and call it people 'being unpredictable': the firing you never saw coming, the partner's exit that 'came from nowhere,' the client lost months before the letter arrived. Every one of those broadcasts warnings for weeks. The cost isn't the missed signal — it's that everything feels ambush when nothing was.",
    studies: [
      { cite: "Baron-Cohen, S., et al. (2001). The 'Reading the Mind in the Eyes' Test, revised version. Journal of Child Psychology and Psychiatry, 42(2), 241–251.", finding: "Mental-state reading from minimal cues is a stable, measurable individual capacity with wide range in typical adults." },
      { cite: "Ekman, P., & Friesen, W. V. (1978). Facial Action Coding System. Consulting Psychologists Press.", finding: "The face's signal system fully mapped — micro-expressions are real, brief, and readable by trained perceivers." },
      { cite: "Todorov, A., et al. (2005). Inferences of competence from faces predict election outcomes. Science, 308(5728), 1623–1626.", finding: "Split-second social perception drives consequential judgments — the channel operates whether or not you consciously read it." },
    ],
  },
  Financial: {
    hook: "Your income is a fact about your job. Your net worth is a fact about this line.",
    expanded: "Financial intelligence is money behavior, not money knowledge: the automatic allocation before spending, the felt horror of high-interest debt, compounding believed in the gut, lifestyle inflation resisted on autopilot. Global measurement (three questions, most of the world fails) shows financial literacy is scarce, consequential, and almost entirely untrained — and that income barely protects you: high earners broke at 60 are a cliché because this line, not salary, writes the ending.",
    integration: "Measured, this line gets engineered rather than moralized: automation replacing discipline, rules replacing decisions ('never finance a depreciating asset'), the handful of behaviors — allocation rate, debt posture, insurance floor — that determine outcomes regardless of income level. Research is encouraging here: financial behavior responds to targeted instruction at decision points better than almost any line responds to anything.",
    risk: "Weak and unfaced, the ending is arithmetic: whatever you earn, outflow finds it. The compounding works in reverse — every year of drift costs the retirement multiple of that year's waste. And the line's weakness protects itself socially: money behavior is the last taboo, so nobody who sees your trajectory will ever tell you. The first honest feedback most people get is the retirement math at 55, which is 30 years late.",
    studies: [
      { cite: "Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy. Journal of Economic Literature, 52(1), 5–44.", finding: "Three questions predict wealth trajectories worldwide — and majorities fail them in nearly every country measured." },
      { cite: "Kaiser, T., & Menkhoff, L. (2017). Does financial education impact financial literacy and financial behavior? World Bank Economic Review, 31(3), 611–630.", finding: "Meta-analysis: financial education genuinely moves behavior — strongest when tied to imminent, specific decisions." },
      { cite: "Thaler, R. H., & Benartzi, S. (2004). Save More Tomorrow. Journal of Political Economy, 112(S1), S164–S187.", finding: "Behavioral design (automatic escalation) quadrupled savings rates where willpower and education had failed — engineering beats moralizing." },
    ],
  },
  Humor: {
    hook: "The fastest social software humans run: one good line can disarm a room that an hour of argument couldn't.",
    expanded: "Humor intelligence is timing plus reframing under live conditions: reading a room's tension and converting it, finding the absurd angle that shrinks a monster problem to workable size, the self-deprecating beat that makes power approachable. Psychology measures it (styles, production tasks) and finds real spread — and finds humor production correlates with mating success, leadership ratings, and resilience, which is a lot of freight for a line nobody trains.",
    integration: "Integrated, humor becomes deployable rather than accidental: de-escalation in conflict, cohesion in teams (shared laughter is measurably bonding), stress inoculation for yourself (reframing IS emotional regulation wearing a red nose), and memorability in every pitch. Knowing your style matters too — affiliative and self-enhancing humor build; aggressive and self-defeating styles quietly bill you.",
    risk: "The weak version costs invisibly: rooms slightly colder, messages slightly less repeated, stress unconverted. The misfiring version costs visibly — humor at others' expense reads as threat, and self-defeating humor teaches rooms to discount you. Like every unexamined line, it runs anyway; the only question is whether it's working for you or against you.",
    studies: [
      { cite: "Martin, R. A., et al. (2003). Individual differences in uses of humor: the Humor Styles Questionnaire. Journal of Research in Personality, 37(1), 48–75.", finding: "Humor decomposes into four measured styles with opposite life outcomes — how you're funny matters as much as whether." },
      { cite: "Greengross, G., & Miller, G. (2011). Humor ability reveals intelligence, predicts mating success. Intelligence, 39(4), 188–192.", finding: "Humor production is measurable, varies widely, and predicts real interpersonal outcomes." },
      { cite: "Kurtz, L. E., & Algoe, S. B. (2015). Putting laughter in context: shared laughter as behavioral indicator of relationship well-being. Personal Relationships, 22(4), 573–590.", finding: "Shared laughter is a quantifiable bonding mechanism — couples and teams that laugh together measurably hold together." },
    ],
  },
  Parenting: {
    hook: "The highest-stakes job most humans ever hold, performed with zero measurement, using software inherited from people who also never checked theirs.",
    expanded: "Parenting intelligence is developmental attunement: matching the response to the child in front of you (not the child you were), holding warmth and structure simultaneously, repairing after rupture, transmitting security instead of your unfinished business. Sixty years of attachment and parenting-styles research make it one of the best-mapped capacities in psychology — and one of the least-ever-assessed in actual parents.",
    integration: "Integrated, the payoff is generational: authoritative parenting (high warmth, high structure) predicts child outcomes across every domain measured, secure attachment transmits — and, crucially, the research's most hopeful finding is that REPAIR outpredicts perfection. Parents who measure and adjust break inherited patterns in one generation. That is the single highest-leverage act on this entire platform.",
    risk: "Weak and unexamined, the default is replication: you run the parenting you received, including the parts that hurt you, and call it normal because it is — to you. The costs surface in decades: the adult child who calls out of duty, the therapy bills with your chapter in them, the pattern arriving intact in grandchildren. No line's weakness compounds longer or quieter.",
    studies: [
      { cite: "Baumrind, D. (1966). Effects of authoritative parental control on child behavior. Child Development, 37(4), 887–907.", finding: "Parenting styles defined and measured — the warmth×structure matrix that six decades of outcomes research confirmed." },
      { cite: "Ainsworth, M. D. S., et al. (1978). Patterns of Attachment. Erlbaum.", finding: "Attachment security measured, classified, and shown to transmit through caregiver behavior — measurable, and changeable." },
      { cite: "Tronick, E., & Gold, C. M. (2020). The Power of Discord. Little, Brown Spark.", finding: "Rupture-and-repair, not constant attunement, builds resilience — the actionable finding that frees real parents from perfection." },
    ],
  },
  Seduction: {
    hook: "The line everyone runs, nobody trains, and polite society pretends is magic. It's calibration, and it's learnable.",
    expanded: "Seduction intelligence is attraction dynamics handled skillfully and honestly: reading interest accurately (both ways), building tension without pressure, being legible as an option rather than a lottery ticket. Relationship science measures its components — perceptual accuracy in dating contexts, attachment-driven pursuit patterns, the traits attraction actually tracks — and finds spread wide enough to explain most of what people call 'luck.'",
    integration: "Integrated, this line mostly removes error: misread interest (both false positives and the lonelier false negatives), self-presentation that hides your actual signal, pursuit patterns your attachment system chose for you at age two. The honest version compounds into the largest life outcome there is — who you end up with — which research keeps ranking above career in life-satisfaction weight. (Evidence base marked thin on the platform; the audit note below applies.)",
    risk: "Weak and unexamined: years of unchosen solitude attributed to fate, or — the expensive mirror — partnerships selected BY the unexamined pattern rather than by you. The person you marry is the single largest financial, emotional, and health decision of your life, made by this line, measured never. That asymmetry should bother you more than it does.",
    studies: [
      { cite: "Buss, D. M. (1989). Sex differences in human mate preferences: evolutionary hypotheses tested in 37 cultures. Behavioral and Brain Sciences, 12(1), 1–14.", finding: "Attraction tracks measurable, cross-culturally stable criteria — the game has rules, whether or not you've read them." },
      { cite: "Finkel, E. J., & Eastwick, P. W. (2008). Speed-dating as a methodological innovation. The Psychologist, 21(5), 402–403.", finding: "Live attraction became lab-measurable — stated preferences and actual choices diverge, and the divergence is systematic." },
      { cite: "Joel, S., et al. (2017). Is romantic desire predictable? Machine learning applied to initial romantic attraction. Psychological Science, 28(10), 1478–1489.", finding: "Attraction resists prediction from traits alone — it lives in calibration and interaction, i.e., in skill, not just stats." },
    ],
  },
  "Community-Founding": {
    hook: "The strongest longevity intervention science has ever measured isn't a drug or a diet. It's this line.",
    expanded: "Community-founding intelligence builds the village: initiating gatherings that recur, weaving unconnected people into networks that hold, being the reason a group EXISTS rather than its member. It is organizational, emotional, and logistical at once — and civilization-critical: every congregation, club, and movement traces to somebody running this line hot. Modern life measures it never and needs it desperately.",
    integration: "The health data alone justifies the page: social connection predicts mortality more strongly than smoking cessation in meta-analysis. Integrated, this line means you're never structurally alone — the founder sits at the center of the network they wove — and neither are yours: conveners' families inherit villages. It also converts professionally; every network you found makes you its hub, and hubs get first look at everything.",
    risk: "Weak and unbuilt, the risk arrives on schedule at 45–65: the post-career, post-kids social cliff where survey majorities report functional friendlessness — with health consequences meta-analytically equivalent to heavy smoking. You cannot buy your way out at 70; villages compound like money, and the deposits had to start decades earlier. This line is the retirement account nobody audits.",
    studies: [
      { cite: "Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social relationships and mortality risk: a meta-analytic review. PLoS Medicine, 7(7), e1000316.", finding: "148 studies: strong social relationships predicted 50% higher survival — an effect exceeding many medical interventions." },
      { cite: "Putnam, R. D. (2000). Bowling Alone: The Collapse and Revival of American Community. Simon & Schuster.", finding: "Documented the measurable collapse of community structures — and the compounding costs to those who never rebuild them." },
      { cite: "Ostrom, E. (1990). Governing the Commons. Cambridge University Press.", finding: "Nobel-winning field evidence that durable communities follow learnable design principles — founding is a skill with a syllabus." },
    ],
  },
  "Street Smarts": {
    hook: "The exam has no schedule, no syllabus, and no retakes. It's the street, and it's been grading you since you could walk.",
    expanded: "Street smarts is practical-situational intelligence: threat reading, awareness of who's in the room and why, the unwritten rules of every environment, knowing which questions not to ask and which deals not to be near. Psychology validated it as 'practical intelligence' and 'tacit knowledge' — measurably distinct from IQ, learned from consequence rather than curriculum, and the reason academically ordinary people run circles around credentialed innocents in unstructured environments.",
    integration: "Integrated, this line is quiet insurance: situational awareness that prices rooms, people, and offers correctly in seconds; the tacit-knowledge habit (every environment has rules nobody will state — find them FIRST); the calibrated trust dial that neither hands wallets to strangers nor mistakes armor for wisdom. Strong scorers should also notice what they're qualified for: any arena where the map is unwritten.",
    risk: "Weak and unknown, you are the tourist in every sense: the mark identified in six seconds, the professional blindsided by office politics that everyone else navigated, the credentialed mind that keeps being 'unlucky' in unstructured situations. The street teaches this line to everyone eventually — the only variable is tuition, and for the unmeasured, tuition runs from wallets to worse.",
    studies: [
      { cite: "Sternberg, R. J., et al. (2000). Practical Intelligence in Everyday Life. Cambridge University Press.", finding: "Practical intelligence measured as distinct from academic g — and predictive of real-world performance where g goes quiet." },
      { cite: "Wagner, R. K., & Sternberg, R. J. (1985). Practical intelligence in real-world pursuits: the role of tacit knowledge. Journal of Personality and Social Psychology, 49(2), 436–458.", finding: "Tacit knowledge — the unwritten rules — quantified, and shown to separate performers within professions beyond test scores." },
      { cite: "Endsley, M. R. (1995). Toward a theory of situation awareness in dynamic systems. Human Factors, 37(1), 32–64.", finding: "Situational awareness formalized and measured — the perceive-comprehend-project loop street-smart minds run automatically." },
    ],
  },
};
