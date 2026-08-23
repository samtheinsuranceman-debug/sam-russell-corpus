// ============================================================
// LINE MEANING — the second page of every intelligence: what the
// line could mean for YOUR life, what consciously using it feels
// like, how it changes the people around you, the cost of never
// measuring it, when science identified it (how old or new the
// research is — with honest anchors, and "our framework" said
// plainly where the construal is ours), and two contrasting
// personas showing how the same line lands differently in
// different lives. Rendered on all 32 /line/ pages AND inside
// the encyclopedia popup. History notes are characterizations of
// the research record, hedged where the mapping is ours.
// ============================================================

export type Persona = { tag: string; text: string };

export type LineMeaning = {
  forYou: string;   // what it could mean for your outcomes
  lived: string;    // consciously using it — the experience of life
  others: string;   // what it changes for the people around you
  cost: string;     // the cost of never measuring it
  history: string;  // when identified / entered psychological modeling
  personas: [Persona, Persona];
};

export const LINE_MEANING: Record<string, LineMeaning> = {
  Logical: {
    forYou: "Almost every big decision you'll ever make — career, money, health, who to trust — is an argument you run in your own head. This line is the quality control on those arguments. Knowing its true level tells you when to trust your own reasoning and when to slow it down and check.",
    lived: "Used consciously, it feels like traction: conversations stop sliding, decisions stop looping, and the difference between what you know and what you're assuming becomes visible in real time. The fog most people call 'overthinking' is often just unexamined logic running unsupervised.",
    others: "The people around a strong logical line get a rare gift: disagreements that go somewhere. Partners stop relitigating the same fight, kids learn that 'because I said so' isn't the house currency, and friends bring you the decisions they can't untangle alone.",
    cost: "Unmeasured, this line fails silently — you don't feel illogical, ever; nobody does. The cost shows up downstream as contracts you shouldn't have signed and arguments you won that you should have lost. You can't audit the auditor without a measurement.",
    history: "The oldest measured line there is: Spearman formalized general reasoning in 1904 and Binet built the first working test in 1905. A century of psychometrics has mapped this line more densely than any other — which makes it strange that most adults still only ever got a school-filtered glimpse of theirs.",
    personas: [
      { tag: "The fast talker", text: "Quick, persuasive, wins every room — and their strong rhetoric has been quietly covering a mid logical line for years. Measurement shows them exactly which wins were reasoning and which were charm, before a big one collapses." },
      { tag: "The quiet checker", text: "Slow in meetings, deadly in writing. Their logical line is elite but invisible in fast rooms — the measurement gives them permission (and evidence) to stop apologizing for the pace that makes them right." },
    ],
  },
  Mathematical: {
    forYou: "Every offer, rate, risk, and 'deal' in your life is a number wearing a costume. This line decides whether you see the number or the costume. Its level predicts how often the fine print beats you — and a measurement tells you whether to negotiate with your own judgment or bring a calculator and a rule.",
    lived: "Consciously used, quantities stop being anxiety and start being handles: you feel the difference between a 2% and a 20% risk in your body, tips and splits and interest become background arithmetic, and 'the numbers' stop being a thing other people understand.",
    others: "A family with one strong quantitative line in it gets cheaper insurance, saner mortgages, and fewer subscription traps — one person who actually runs the numbers protects everyone who doesn't. Measured, you know whether that person should be you.",
    cost: "The unmeasured cost compounds — literally. Decades of slightly-wrong money decisions, mispriced risks, and misread odds don't feel like a weak line; they feel like bad luck. This is the line where ignorance has an interest rate.",
    history: "Quantitative ability was isolated as its own factor by Thurstone's primary-abilities work in 1938 and has anchored testing ever since. What's new is the outcome research: modern financial-literacy studies keep finding that a handful of numeric habits predicts wealth trajectories better than income does.",
    personas: [
      { tag: "The spreadsheet romantic", text: "Loves the plan more than the math. Beautiful budgets, wrong compounding. A measurement separates their genuine planning gift from the quantitative gaps that keep sabotaging it — and tells them exactly which three calculations to never do alone." },
      { tag: "The intuitive estimator", text: "Never shows work, usually lands close. Their number sense is real but uncalibrated — strong on magnitudes, weak on probabilities. Measured, they learn precisely where their gut is a instrument and where it's a liability." },
    ],
  },
  Spatial: {
    forYou: "This line runs everything from parallel parking to reading an MRI, designing a room, and holding a mental map of how your project's parts fit. It's one of the strongest predictors of success in engineering, surgery, and the trades — and one of the least likely to have ever been noticed in you.",
    lived: "Used consciously, the physical world gets quieter: furniture fits the first time, directions stop being stressful, diagrams speak, and you start thinking in structures — seeing the shape of a problem the way others hear its story.",
    others: "You become the one who packs the car, reads the map, sees why the shelf will fail, and explains with a sketch what ten sentences couldn't. Households with a known spatial mind route the right problems to it and stop wasting weekends.",
    cost: "Longitudinal studies of spatially gifted kids found them systematically overlooked — verbal and math tests simply can't see this line. The adult version of that miss is a career standing quietly to the left of the one you'd have been exceptional at.",
    history: "Isolated by Thurstone in 1938 and battle-tested in WWII pilot selection, spatial ability is old science with a modern scandal: talent researchers call it the largest known pool of untapped ability, because schools still don't test it. Yours has likely never been looked at.",
    personas: [
      { tag: "The verbal star", text: "Aced every essay, assumes they 'aren't visual.' Their spatial line was never tested, just never fed. A real measurement sometimes finds a second engine they've been driving past for twenty years." },
      { tag: "The hands thinker", text: "Struggled with lectures, brilliant in the shop. Their spatial line is their g — it just lives in a modality report cards ignore. Measurement reframes a whole school history from 'average student' to 'untested specialist.'" },
    ],
  },
  Linguistic: {
    forYou: "Your vocabulary is your interface to every institution that decides things about you — jobs, courts, banks, doctors. This line sets how much of your actual intelligence survives translation into words. Measured, you learn whether your ideas are being underpriced by their packaging.",
    lived: "Consciously used, language becomes an instrument instead of a habit: the right word arrives on time, difficult emails take ten minutes instead of an hour, and you feel the precise difference between what you said and what you meant shrinking toward zero.",
    others: "The people you love get the benefit of being accurately spoken to — apologies that actually land, boundaries that don't wound, stories at dinner that make the day mean something. One strong linguistic line raises a household's whole emotional resolution.",
    cost: "Unmeasured, a strong linguistic line gets mistaken for general brilliance (dangerous) and a weak one for low intelligence (unjust and equally dangerous). Both errors compound for decades in salaries, relationships, and self-concept.",
    history: "Verbal ability has anchored intelligence testing since Binet's 1905 scale — it's the line your school almost certainly did sample. What's newer is the separation: modern models distinguish verbal fluency, comprehension, and production, and our engine reads all three from how you actually speak.",
    personas: [
      { tag: "The unheard expert", text: "Deep knowledge, plain words, consistently out-shone by louder colleagues with thinner ideas. Measurement documents the gap between their thinking and their throughput — and points the repair at exactly the right skill, not at their intelligence." },
      { tag: "The silver tongue", text: "Words arrive faster than thoughts. They've won rooms and lost years to commitments that were beautifully phrased and badly reasoned. Their measurement pairs the linguistic score with the logical one — and the gap between them is the most useful number they own." },
    ],
  },
  Musical: {
    forYou: "Beyond instruments: this line is rhythm, pitch, and pattern-in-time — it shows up in how you speak, how you time a joke, how you feel a room's tempo. Trained, it's one of the best-documented neuroplasticity levers we have; measured, it's a hidden channel some people should be running their whole cognition through.",
    lived: "Consciously used, ordinary time gets texture: work finds a cadence, exercise syncs to something, language turns melodic, and music itself upgrades from wallpaper to a controllable instrument for changing your own state on demand.",
    others: "Musical lines are contagious in the best way — the parent who sings turns chores into games, the friend who builds the playlist architects the night. Group singing is one of the fastest social-bonding interventions ever measured, and someone has to start it.",
    cost: "Most adults filed this line under 'talent I don't have' after one childhood recital and never looked again. The unmeasured cost isn't a lost career in music — it's a lifelong state-regulation tool, unopened, plus the identity tax of believing you're 'not musical' on zero evidence.",
    history: "Seashore built the first musical-aptitude measures in 1919 — older than most IQ subtests — and Gardner's 1983 Frames of Mind made it a first-class intelligence. The neuroplasticity findings are the new part: training this line measurably reshapes auditory and motor cortex at any age.",
    personas: [
      { tag: "The shower singer", text: "Loves music, 'can't do music,' quit at eleven. Their measurement usually finds mid-level machinery that was never trained, not absent — and adult instrumental instruction is one of the best-cited protocols in our library." },
      { tag: "The rhythm worker", text: "No instrument, but their speech lands on beats and their day runs on tempo. Their musical line is high and undeployed — they've been using a precision tool as background noise." },
    ],
  },
  "Bodily-Kinesthetic": {
    forYou: "This is intelligence expressed through the body — coordination, timing, learning physical skills fast. It decides your margin of safety on a ladder, your recovery from a stumble at seventy, and how quickly any new physical skill (sport, instrument, surgery, trade) becomes yours.",
    lived: "Consciously used, the body stops being a vehicle you ride and becomes a place you live: movement gets economical, new skills come apart into learnable pieces, and physical confidence quietly upgrades every room you walk into.",
    others: "You become the one who teaches the kid to ride the bike, steadies the grandparent on the stairs, and makes the pickup game fun instead of humiliating. Physical competence is one of the most inheritable-by-example traits a family has.",
    cost: "Unmeasured, people write their bodies off wholesale after a clumsy adolescence — and the cost arrives decades later as the fall, the frailty, the 'I'm not athletic' that became a self-fulfilling prescription for sixty sedentary years.",
    history: "Gardner's 1983 Frames of Mind gave bodily-kinesthetic intelligence its name, over a century of motor-learning science underneath it. The new chapter is gerontology: balance and coordination now predict late-life independence so strongly that this 'gym class' line turns out to be a longevity instrument.",
    personas: [
      { tag: "The desk athlete", text: "Was good at this once; the last decade lives in a chair. Their line is dormant, not gone — motor learning is famously durable — and their measurement usually reads 'expensive asset, currently idle.'" },
      { tag: "The never-picked", text: "Last chosen at every recess, body written off at nine years old. Measurement often finds specific machinery (balance, fine motor, timing) that's fine — the schoolyard tested one sport, not a line." },
    ],
  },
  Naturalist: {
    forYou: "The line that reads living systems — weather, plants, animals, seasons, your own garden's logic. In a screen-bound life it predicts something surprisingly practical: how much restoration you can extract from the outdoors, and how well you notice slow change in any living system, including your own body and your own family.",
    lived: "Consciously used, the world outside the window becomes legible: walks turn into reading, seasons become a calendar you feel, and attention itself recovers — the restoration literature keeps finding that people who can read nature get more repair per minute inside it.",
    others: "You become the household's early-warning system for slow drift — the plant dying, the dog aging, the kid wilting — because naturalist attention is drift-detection. Families with one strong naturalist line catch things earlier, in gardens and in people.",
    cost: "Never measured, this line mostly just atrophies indoors, and its owner calls the resulting flatness 'modern life.' The cost is a missing maintenance system: nature exposure is one of the cheapest cited interventions we have, and a weak unmeasured line never claims it.",
    history: "The newest of Gardner's canonical lines — he added it in the mid-1990s, a decade after the original seven. The supporting science arrived after: attention-restoration research and the nature-dose studies of the 2000s-2010s gave the 'nature person' a measurable, prescribable payoff.",
    personas: [
      { tag: "The city creature", text: "Hasn't touched soil in years, assumes the line is zero. Measurement often finds intact machinery starved of input — and their first prescribed 50-minute walk reads like plugging in a dead battery." },
      { tag: "The weekend gardener", text: "Already lives by this line without naming it. Measurement shows them it's load-bearing — the garden isn't a hobby, it's their regulation infrastructure — and that protecting it is protecting everything downstream." },
    ],
  },
  Interpersonal: {
    forYou: "The line that models other minds — what they want, what they fear, what they'll do. It prices every negotiation, hire, date, and friendship you'll ever attempt. Career research keeps finding that past a competence threshold, this line decides trajectories more than the technical ones do.",
    lived: "Consciously used, people stop being weather and become navigable: you feel the meeting turn before it turns, hear the ask inside the complaint, and know which silence is comfort and which is a door closing. Social life runs on inference, and yours gets instrumented.",
    others: "This is the line others feel most directly: being accurately read is one of the rarest experiences people get, and the person who provides it becomes load-bearing in every group they join. Your measurement here is partly a gift to everyone who deals with you.",
    cost: "Unmeasured, interpersonal error is always attributed outward — 'people are difficult' — and the pattern of failed hires, misread partners, and surprise betrayals never gets traced back to the instrument doing the reading. That misattribution can run an entire lifetime.",
    history: "Thorndike named social intelligence in 1920; Gardner canonized the interpersonal line in 1983; and the modern theory-of-mind program (1978 onward) built the lab tests. It's old science with one persistent gap — almost nobody has ever had theirs formally read. That's the gap we close.",
    personas: [
      { tag: "The technical ace", text: "Promoted for code, stalled for 'presence.' Their interpersonal line is the actual ceiling on their career, and it's never once been measured — just punished. The score turns a vague reputation into a trainable target." },
      { tag: "The room reader", text: "Everyone's confidant, nobody's priority. Their line is elite but spent entirely on defense — managing others' feelings, never deploying the same radar for their own goals. Measurement reframes a soft skill as a strategic asset." },
    ],
  },
  Intrapersonal: {
    forYou: "The line that models your own mind — knowing what you actually want, what you'll actually do, and the difference between your stated and revealed preferences. It's the intelligence every other line depends on for honest deployment: misknow yourself and every other strength mis-aims.",
    lived: "Consciously used, your inner life gets a working instrument panel: motives surface before they drive, moods get named before they steer, and the exhausting gap between the life you're in and the life you'd choose gets measured instead of just felt.",
    others: "Self-knowing people are cheaper to love — they say what they need instead of testing for it, apologize for the right thing, and don't outsource their unexamined life to their partner's intuition. Your intrapersonal line quietly sets the labor costs of knowing you.",
    cost: "The unmeasured cost is decades in the wrong direction: careers chosen by inherited definitions, relationships run on unexamined scripts, a retirement that arrives with the question 'whose life was that?' No other line's blind spot is this expensive.",
    history: "Gardner named the intrapersonal line in 1983, but the measurement science is young: self-insight research from the 2000s (notably work showing most people believe they're self-aware while few test as such) made the gap between feeling self-known and being self-known one of psychology's most uncomfortable findings.",
    personas: [
      { tag: "The high achiever", text: "Hits every target, feels nothing at the summit. Their intrapersonal line never chose the targets — a louder culture did. Measurement here is the difference between optimizing a life and authoring one." },
      { tag: "The journaler", text: "Twenty notebooks of reflection, same three patterns for twenty years. Insight without instrumentation loops. A measured line shows them the difference between rumination and self-knowledge — and where their honest blind spot actually sits." },
    ],
  },
  Existential: {
    forYou: "The line that handles the biggest questions — mortality, meaning, what it's all for — without flinching or foreclosing. It predicts how you'll metabolize the events that break most operating systems: diagnosis, loss, success that turns out hollow. It is, bluntly, your crisis architecture.",
    lived: "Consciously used, the big questions stop being 3 a.m. ambushes and become furniture — visited, arranged, lived with. People with a strong existential line report something the literature calls meaning-in-life, and it buffers nearly every hard outcome ever studied against it.",
    others: "You become the one people call from the hospital parking lot. A household with one person who can sit with mortality without panicking gets calmer deaths, realer holidays, and children who ask big questions instead of hiding them.",
    cost: "Unmeasured and unfed, this line's absence is invisible until the exact moment it's everything — the loss, the diagnosis, the midlife flatline. Building crisis architecture during the crisis is the most expensive construction schedule there is.",
    history: "The youngest and most contested line in the canon: Gardner floated existential intelligence in the late 1990s and never fully admitted it. The evidence went around him — meaning-in-life research and meaning-centered clinical trials (2000s-2010s) showed the capacity is real, trainable, and protective. Our framework measures it unapologetically.",
    personas: [
      { tag: "The busy avoider", text: "Schedule full since the funeral. Their existential line is unbuilt and their calendar is the scaffolding hiding it. Measurement names the deferral — usually years before life calls the loan." },
      { tag: "The quiet philosopher", text: "Thinks about death at breakfast, functions beautifully. Their high line looks morbid to others and is actually armor — measurement reframes a personality quirk as the load-bearing strength it is." },
    ],
  },
  Moral: {
    forYou: "The line that reasons about right and wrong under pressure — not what you believe, but how well you think when values collide. It prices the decisions that define reputations: the gray-zone deal, the loyal-versus-honest fork, the moment everyone's watching what you do next.",
    lived: "Consciously used, integrity stops being a vibe and becomes a method: you can articulate why, hold two goods in tension without collapsing into slogans, and make the hard call in a way you can still explain to yourself ten years later.",
    others: "People calibrate their own honesty to the strongest moral reasoner in the room. Families, teams, and friend groups with one measured, deployed moral line get fewer secrets, cleaner conflicts, and kids who can defend a position instead of just holding one.",
    cost: "Unmeasured, moral confidence and moral competence get confused — the loudest values in the room are rarely the best-reasoned. The cost arrives in the one gray-zone decision per decade that ends careers and marriages, decided by an instrument nobody ever checked.",
    history: "Kohlberg began staging moral reasoning in 1958, and the field has run hot ever since — his stages, Gilligan's 1982 critique, Haidt's 2001 intuitionist turn. As a measured intelligence line it remains our framework's construal, built on seventy years of contested but rich science.",
    personas: [
      { tag: "The rule keeper", text: "Never broken a policy, quietly complicit twice. Their moral line follows rules brilliantly and reasons poorly when the rules run out — which is exactly where morality starts. Measurement finds the edge of the map." },
      { tag: "The gray-zone operator", text: "Comfortable in ambiguity, maybe too comfortable. Their line is agile but unaudited — measurement distinguishes genuine moral sophistication from well-rationalized drift, a difference their conscience can no longer feel from inside." },
    ],
  },
  Aesthetic: {
    forYou: "The line that perceives quality — in objects, spaces, work, and moments. It sounds decorative and is actually economic: taste is the engine behind every premium you'll ever charge or pay, every environment that lifts or drains you, every 'this is off' that saves a project.",
    lived: "Consciously used, ordinary life gets a volume knob for beauty: your spaces start working for your nervous system, your output develops a signature, and the difference between good and almost-good — in food, work, rooms, writing — becomes information instead of invisible.",
    others: "The aesthetic line is the household's quality-of-life multiplier: the person who makes the rented apartment feel like a home, the meal feel like an occasion, the photo album worth keeping. Others live measurably better inside a strong aesthetic line's radius.",
    cost: "Unmeasured, weak taste doesn't feel like anything — that's the trap. It bills you as environments that subtly drain, work that never quite commands a premium, and a life that photographs better than it feels. The strong-but-unclaimed version costs differently: a signature never developed.",
    history: "Empirical aesthetics is psychology's oldest experimental program — Fechner was measuring preference in 1876 — reborn through Berlyne in the 1970s and modern neuroaesthetics in the 2000s. As an intelligence line it's our framework's construal of a 150-year literature.",
    personas: [
      { tag: "The function-first builder", text: "Ships fast, everything works, nothing lands. Their aesthetic line is the invisible discount on every deliverable. Measurement turns 'design isn't my thing' into a specific, trainable gap with a known payoff." },
      { tag: "The unconscious curator", text: "Friends borrow their playlists, copy their rooms, steal their phrasing. Their line is high and unmonetized — measurement is often the first time they realize taste is an asset class." },
    ],
  },
  Emotional: {
    forYou: "The line that perceives, uses, understands, and manages feeling — yours and others'. Thirty years of research ties it to relationship stability, leadership, health behavior, and stress resilience. It is the difference between having emotions and having access to them.",
    lived: "Consciously used, feelings become data with handles: you catch the irritation while it's still information, name the dread precisely enough to act on it, and stop outsourcing your inner weather to whoever's nearest. Emotional granularity — the measured skill — changes the texture of every single day.",
    others: "This is the line your loved ones are most directly downstream of. Emotion-coaching parents raise measurably better-regulated kids; partners of high-EI adults report more repair after conflict. Your emotional line is the climate other people live in.",
    cost: "Unmeasured, emotional gaps masquerade as personality — 'I'm just not a feelings person' — while quietly pricing themselves into divorces, estranged kids, and stress that goes somatic. This line's failures are the most expensive and the least attributed.",
    history: "Named by Salovey and Mayer in 1990, detonated into culture by Goleman in 1995, and given a real ability test (the MSCEIT) in 2002 — making emotional intelligence one of the youngest lines with a genuine measurement science. Most adults' EI has still never been formally read.",
    personas: [
      { tag: "The stone face", text: "Calm in every crisis, absent in every celebration. Their line suppresses instead of regulates — the two look identical from outside and cost differently inside. Measurement tells them which one they've been doing all these years." },
      { tag: "The open channel", text: "Feels everything, everyone's feelings, all at once. Their perception scores are elite and their management scores lag — measurement converts 'too sensitive' into 'undertrained,' which is a fixable diagnosis." },
    ],
  },
  "Meta-Cognitive": {
    forYou: "The line that thinks about your thinking — knowing what you know, catching your own errors, choosing the right mental strategy for the job. It's the highest-leverage line in the whole profile because it compounds: it is the engine that improves the other thirty-one.",
    lived: "Consciously used, your mind gets a supervisor: you notice when you're rereading without absorbing, feel when confidence has outrun evidence, and switch strategies instead of grinding. Learning anything gets cheaper for the rest of your life.",
    others: "You become the person who teaches how to think, not what — the parent whose kids learn to check their own work, the colleague whose questions upgrade the room. Metacognition is the most transferable gift one mind can give another.",
    cost: "The unmeasured cost is the plateau: smart people who stopped improving at twenty-five because experience kept accumulating without converting. Without this line's audit, ten years becomes one year repeated ten times — and feels like fate.",
    history: "Flavell coined metacognition in 1979, and it became one of learning science's most productive constructs — the calibration research (including the famous 1999 unskilled-and-unaware studies) showed most people can't see their own accuracy. Formal measurement of it in adults remains vanishingly rare.",
    personas: [
      { tag: "The confident expert", text: "Twenty years in, certain, and calcifying. Their metacognitive line stopped auditing the expertise it built. Measurement reopens the one question experience closed: 'how would I know if I were wrong?'" },
      { tag: "The anxious student", text: "Doubts everything, checks everything, learns slowly from sheer overhead. Their line is hyperactive, not high — measurement separates productive self-monitoring from anxiety wearing its costume." },
    ],
  },
  Volitional: {
    forYou: "The line that converts intention into action — starting, persisting, finishing, especially when nobody's watching and nothing's fun. Every plan you'll ever make is a check written against this line. Its measured level tells you whether to rely on willpower or engineer around it.",
    lived: "Consciously used — which mostly means honestly measured — volition stops being a morality play and becomes logistics: you design commitments to your actual follow-through, use implementation intentions where the line is thin, and stop burning identity on failures that were architecture problems.",
    others: "The people around you live inside your follow-through: the promised trip, the started business, the health kick that held. A measured volitional line lets you make promises at your real capacity — which is the difference between being trusted and being loved-but-discounted.",
    cost: "Unmeasured, every gap between plan and action gets billed to character — laziness, weakness — when it's usually a measurable line at an unmeasured level. The self-blame cycle costs more than the missed goals ever did.",
    history: "William James wrote the chapter on will in 1890; the modern era rebuilt it as self-regulation — Mischel's delay studies (1970s), Baumeister's models (1990s), Gollwitzer's implementation intentions (1999), Duckworth's persistence work (2000s). The construct is old; measuring it in ordinary adults is still almost never done.",
    personas: [
      { tag: "The serial starter", text: "Five businesses, four gyms, three languages — all at chapter one. Their ignition is elite and their persistence machinery is the gap. Measurement splits the line into its parts and points the fix at the right one." },
      { tag: "The grinder", text: "Finishes everything, including things that stopped deserving it years ago. Their volitional line is so strong it needs a steering check — measurement pairs it with the reflective line to ask what all this discipline is for." },
    ],
  },
  Adversarial: {
    forYou: "The line that thinks against an opponent — anticipating moves, spotting manipulation, defending your interests when someone else is optimizing against them. You use it in negotiations, custody disputes, scam calls, and every market you touch. It is the intelligence of not being prey.",
    lived: "Consciously used, the adversarial world gets honest: pitches decompose into incentives, 'limited time offers' read as the pressure tactics they are, and you negotiate like someone keeping score — because someone across the table always is.",
    others: "A family with one strong adversarial line loses less: to fine print, to predatory salesmen, to the contractor who smells softness. You become the one who reads the lease, and everyone you love is quietly richer and safer for it.",
    cost: "This line's weakness is specifically targeted — fraud, dark patterns, and hard-sell industries are optimized search engines for unmeasured adversarial gaps. The cost isn't hypothetical; it has a dollar figure, and for most households it's five digits over a lifetime.",
    history: "Game theory formalized adversarial reasoning in 1944; deception-detection research (from the 1980s) mapped how badly humans do it unaided; fraud-vulnerability studies in the 2000s-2010s found it barely correlates with education. Bundling these as one measured line is our framework's construal.",
    personas: [
      { tag: "The good-faith professional", text: "Brilliant among honest people, food among the other kind. Their adversarial line never developed because their world never required it — until the divorce, the partnership dispute, the one bad actor. Measurement is armor bought before the war." },
      { tag: "The counter-puncher", text: "Sees the angle in everything — including things that were never angled. Their high line runs without a trust throttle, taxing every relationship with vigilance. Measurement pairs it with social-perceptual accuracy: are the threats real?" },
    ],
  },
  Interoceptive: {
    forYou: "The line that reads your body from inside — hunger versus boredom, fatigue versus avoidance, the heartbeat of real fear versus caffeine. It's the sensor layer under your emotions, your health decisions, and your gut instincts. Every 'listen to your body' assumes a line most people have never checked.",
    lived: "Consciously used, the body becomes an honest advisor: you eat when hungry instead of when wounded, catch stress at the shoulder-tension stage instead of the collapse stage, and learn which gut feelings are data and which are last night's pizza.",
    others: "Regulated people regulate people. Your interoceptive accuracy sets how early you catch your own storms — which is exactly how much warning your family gets. Parents who can read their own arousal de-escalate instead of detonate.",
    cost: "Unmeasured interoception fails as misattribution: anxiety read as heart trouble, hunger read as emotion, burnout discovered at the emergency-room stage. The body was sending reports the whole time; nobody had checked whether the reader worked.",
    history: "Sherrington coined interoception in 1906, but the measurement science is startlingly young — heartbeat-detection tasks and the accuracy/awareness distinction were formalized in the 2010s. This is a line where the lab tests are barely a decade old and almost no one alive has taken one.",
    personas: [
      { tag: "The head on a stick", text: "Lives entirely above the neck; the body files reports to no one. Their measurement usually shocks them — and body-scan training, one of the best-cited protocols in our library, reads like installing sensors in a house they've owned for decades." },
      { tag: "The over-feeler", text: "Every flutter is a crisis; high sensitivity, low accuracy. Measurement separates the two — their problem isn't too much signal, it's an uncalibrated gauge — which redirects years of health anxiety toward one trainable skill." },
    ],
  },
  Strategic: {
    forYou: "The line that plays long games — sequencing moves, holding a goal through years of noise, knowing which battles are the war. It decides whether your five-year plans are architecture or astrology, and it's the line careers, fortunes, and family trajectories are actually built with.",
    lived: "Consciously used, time gets deeper: today's choices visibly connect to next year's positions, opportunities read as moves in a sequence instead of lottery tickets, and you develop the strange calm of someone who knows what they're doing next April.",
    others: "A family with one measured strategic line gets compounding instead of drifting: the house bought two years before the school district turned, the career move made before the industry did. Someone has to be playing the long game; measurement tells you who it should be.",
    cost: "Unmeasured, strategic weakness feels like bad luck for thirty years — always working hard, always surprised, always one reorganization behind. The cost is a life assembled from reactions, discovered only in the rearview.",
    history: "Planning became measurable cognition with Miller, Galanter, and Pribram in 1960, and executive-function research built the lab tasks — but real-world strategic capacity, the years-long kind, is measured almost nowhere. Our engine reads it from how you narrate your own past campaigns; the construal is our framework's.",
    personas: [
      { tag: "The brilliant reactor", text: "Unbeatable this quarter, directionless this decade. Their tactical line covers for a strategic gap that only shows at annual resolution. Measurement gives the gap a name before it gives them a midlife." },
      { tag: "The chess player", text: "Everything is sequenced, nothing is spontaneous — including, their spouse notes, affection. A high strategic line without a sampling of present-tense lines optimizes a future that keeps not arriving. The full profile shows the trade." },
    ],
  },
  Systemic: {
    forYou: "The line that sees wholes — feedback loops, second-order effects, why the fix made it worse. It's the difference between treating symptoms and re-architecting causes, in companies, households, health, and your own habit loops. Complex-problem-solving research finds it surprisingly independent of IQ.",
    lived: "Consciously used, the world stops being a series of events and becomes machinery you can read: the argument that recurs every visit reveals its loop, the budget leak shows its structure, and 'why does this keep happening' becomes a diagram with an intervention point.",
    others: "You become the one who fixes the pattern instead of the instance — the family's recurring holiday fight, the team's chronic deadline crunch. Systemic minds don't just solve problems; they retire whole categories of them for everyone downstream.",
    cost: "Unmeasured, systemic blindness runs the most expensive experiment there is: pushing harder on interventions that the system is absorbing. Years of effort against a loop that a measured eye would have re-routed in an afternoon.",
    history: "Systems thinking entered science with Forrester's 1961 industrial dynamics and management with Senge in 1990; Dörner's complex-problem-solving experiments (1980s-90s) proved smart people fail catastrophically in dynamic systems — and that the skill is its own line, weakly tied to g. Almost no one has ever had theirs tested.",
    personas: [
      { tag: "The hard worker", text: "Twice the effort, same results, every year. They're pushing on a loop, not a lever. Their systemic measurement usually locates a decade of effort spent on the one intervention point the system was built to absorb." },
      { tag: "The armchair architect", text: "Sees every loop, redesigns everything, ships nothing. High systemic, thin volitional — the profile's most poignant combination. The map is not the territory, and the full 32-line read shows which lines must carry the map into the world." },
    ],
  },
  Entrepreneurial: {
    forYou: "The line that creates value under uncertainty — spotting the unmet need, acting before certainty arrives, surviving the gap between idea and revenue. You don't need a startup to need it: careers, side incomes, and every reinvention after a layoff run on this machinery.",
    lived: "Consciously used, the economy becomes legible as opportunity: problems read as unpriced demand, your skills decompose into sellable atoms, and risk becomes something you size and stage instead of something you feel and avoid.",
    others: "One entrepreneurial line changes a family tree — not by the exit, but by the demonstration: kids who watch value being created stop believing income is something other people decide. It's the most economically contagious line in the profile.",
    cost: "Unmeasured, this line's absence is invisible in good times and decisive in bad ones — the layoff that becomes a crisis instead of a pivot. Its unmeasured presence costs differently: the employee-priced years of someone built to own.",
    history: "Entrepreneurship research grew serious in the 1980s and found its cognitive signature with effectuation studies in 2001 — expert entrepreneurs reason differently, and the difference is learnable. As a measured intelligence line, it's our framework's construal of that thirty-year literature.",
    personas: [
      { tag: "The secure professional", text: "Fifteen loyal years, one industry, zero optionality. Their entrepreneurial line was never needed — until it suddenly, urgently is. Measured early, it's insurance; measured late, it's triage." },
      { tag: "The idea machine", text: "A notebook full of businesses, a history full of almosts. Ideation is one sub-skill of five; their measurement locates which of the other four (validation, resourcing, selling, persisting) keeps breaking the chain." },
    ],
  },
  Creative: {
    forYou: "The line that generates the genuinely new — divergent options, remote connections, the idea that wasn't in the room until you were. It's tied to adaptability research everywhere it's studied: creative capacity is what a mind does when the map runs out, which every life eventually requires.",
    lived: "Consciously used, stuckness changes meaning: dead ends become prompts, constraints become generators, and the daily texture of problems shifts from 'find the answer' to 'make one.' People with deployed creative lines report the specific pleasure of surprising themselves.",
    others: "Creativity is a permission structure: one person generating freely licenses the whole table. Households and teams around a deployed creative line produce more ideas per person — the line doesn't just make things, it makes makers.",
    cost: "The classic finding: creative capacity plummets between childhood and adulthood — schooled out, not aged out. The unmeasured cost is believing the loss was natural. Most 'not creative' adults are holding an untested line and a fourth-grade memory.",
    history: "Guilford's 1950 APA presidential address launched creativity science; Torrance built the tests in 1966; and the longitudinal follow-ups made the famous claim that divergent-thinking scores predicted adult creative achievement better than IQ. The tests exist — your school almost certainly never gave you one.",
    personas: [
      { tag: "The recovering realist", text: "Traded imagination for competence at twenty-two and calls it growing up. Their measurement usually finds the machinery intact under a decade of practicality — and the library's ideation protocols restart it faster than they expect." },
      { tag: "The scattered fountain", text: "Ideas without end, execution without beginning. Their creative line needs its rate-limiter measured too — the profile pairs it with volitional and strategic lines to show why the fountain never fills a bucket." },
    ],
  },
  Rhetorical: {
    forYou: "The line that moves people with language — framing, persuading, making the true thing also the compelling thing. Every idea you'll ever have is priced by this line at the moment of delivery: the funding, the raise, the second date, the jury. Being right is half a skill.",
    lived: "Consciously used, influence stops being manipulation-or-nothing: you frame honestly and deliberately, feel which argument fits which listener, and stop watching worse ideas win because they were better dressed. Your convictions start surviving contact with rooms.",
    others: "The rhetorical line is how your values travel: the toast that makes the wedding, the case that gets the school to listen, the way your kids learn to ask for what they need. Measured and deployed honestly, it amplifies everyone you advocate for.",
    cost: "Unmeasured, the gap between what you know and what you can land stays invisible — you just watch decisions go wrong that you'd argued correctly. A career of being right too quietly has a price, and it compounds.",
    history: "The oldest curriculum in Western education — Aristotle systematized persuasion 2,300 years ago — reborn as measurable science with the attitude-change program of the 1950s and the elaboration-likelihood model in 1986. Ancient art, mature science, and still: almost nobody has a score.",
    personas: [
      { tag: "The brilliant mumbler", text: "Best analysis in the building, delivered like an apology. Their rhetorical gap taxes every other line they own. Measurement prices the gap — and public-speaking exposure training, cited in our library, is a direct repair." },
      { tag: "The natural closer", text: "Can sell anything, including, occasionally, things they shouldn't. A high rhetorical line without a measured moral line is a loaded instrument — the full profile is the safety, and they're exactly who should want one." },
    ],
  },
  Leadership: {
    forYou: "The line that aligns people toward a goal — direction-setting, trust-building, decision-making with others' stakes in your hands. It prices every team you'll run, meeting you'll chair, and crisis where people look up. Formal authority is optional; this line is what works when you have none.",
    lived: "Consciously used, groups change texture around you: meetings conclude, conflicts surface early and small, and the strange weight of being watched becomes information instead of pressure. Leading stops being a role and becomes a running skill.",
    others: "Everyone downstream of your leadership line lives in its weather — the team that grows or churns, the family that coheres or scatters in a crisis. A measured line means the people who depend on you are depending on something known.",
    cost: "The unmeasured cost is promotion to failure: organizations select leaders by performance in non-leadership roles, then discover the line's absence at maximum blast radius. Measured first, that discovery costs a number on a page instead of a team.",
    history: "Trait studies of leadership date to the 1930s-40s, the transformational model was formalized in 1985, and a century of organizational psychology has mapped what works. The science is mature; the measurement, for anyone outside an executive assessment center, essentially never happens.",
    personas: [
      { tag: "The reluctant captain", text: "Keeps getting handed the team, keeps assuming it's a mistake. Their measured line says otherwise — and the difference between accidental leadership and owned leadership is the difference between draining and compounding." },
      { tag: "The commanding presence", text: "Fills every room, hears from none of them. Charisma scores high; the trust-building sub-line lags. Measurement splits the difference their reports already know and their reviews never say." },
    ],
  },
  Mechanical: {
    forYou: "The line that understands how things work — forces, mechanisms, why it broke, how it fits. It prices your relationship with every physical object you own: the repair you do versus fear, the diagnosis you understand versus buy blind, the fifteen thousand dollars of trades labor a strong line saves per decade.",
    lived: "Consciously used, the built world becomes transparent: the noise in the car narrows to three suspects, flat-pack furniture becomes obvious, and the specific self-respect of I-fixed-that enters your week. Learned helplessness about 'stuff' quietly exits.",
    others: "The mechanical line is the neighborhood's most-borrowed intelligence — the friend called before the plumber, the parent whose kids grow up assuming things can be understood and fixed rather than feared and replaced. Competence this visible teaches by existing.",
    cost: "Unmeasured, a weak line pays the ignorance premium on every repair, forever, and a strong unnoticed one — common in people schooled away from the trades — is a five-figure annual capability, idling. Aptitude research has documented the mismatch for a century.",
    history: "Mechanical aptitude testing is one of psychometrics' oldest working products — WWI placement, then the Bennett test in the 1940s, still used in hiring today. The irony: industry has measured this line in millions of workers, while schools and colleges pretend it doesn't exist.",
    personas: [
      { tag: "The white-collar helpless", text: "Advanced degree, calls a handyman to hang a shelf. Often their line isn't low — it's unfed since childhood by a culture that filed it under 'not for people like us.' Measurement reopens a door school closed." },
      { tag: "The natural wrench", text: "Fixes everything, credentials nothing. Their line is elite and economically invisible on paper. The measured profile does what no resume did: states the capability in a language institutions read." },
    ],
  },
  "Pattern-Recognition": {
    forYou: "The line that sees the signal early — the trend forming, the anomaly that matters, the shape in the noise. It's the raw perceptual edge under expertise in every field: the chess master, the radiologist, the trader, the scout all run on this machinery pointed at different data.",
    lived: "Consciously used, the world starts rhyming: this market smells like 2019, this hire like the last one that worked, this cough like the one that mattered. Experience converts to foresight at a rate this line sets — and calibration training keeps the poetry honest.",
    others: "You become the early-warning system your people rely on — the friend who said sell, the parent who caught it early, the colleague who saw the pivot coming. Pattern minds spend their gift as protection for everyone slower to see.",
    cost: "The unmeasured cost runs both ways: signals missed by a weak line, and — subtler — false patterns confidently seen by a strong uncalibrated one. Apophenia is this line's shadow, and only measurement tells you which side of it you live on.",
    history: "Raven's matrices made abstract pattern detection testable in 1936, and the expertise research — chess studies from 1946 through the famous chunking experiments of 1973 — showed the master's eye is patterns, not calculation. Old, solid science; your own calibration, almost certainly never checked.",
    personas: [
      { tag: "The gut trader", text: "Sees turns before the data confirms — sometimes. Their hit rate has never been formally scored, so wins build myth and losses build nothing. Measurement plus forecasting calibration turns a talent into an instrument." },
      { tag: "The conspiracy-adjacent uncle", text: "The same machinery, uncalibrated: patterns everywhere, including where there are none. A measured line with honest error bars is the intervention — it's very hard to argue with your own printed false-positive rate." },
    ],
  },
  "Social-Perceptual": {
    forYou: "The line that reads the room's raw data — micro-shifts in tone, face, posture, the silence that means no. Upstream of the interpersonal line: this is the sensor; that's the model. Its accuracy prices every read you make of a boss, a date, a witness, a child.",
    lived: "Consciously used, social space gains resolution: you catch the flicker before the mask, hear the meeting turn three sentences early, and know — rather than fear — how you're landing. Social anxiety often shrinks when perception is measured; much of it was guessing.",
    others: "Being seen accurately is rare enough that people organize their lives around whoever provides it. Your perceptual accuracy is felt by everyone you know as the difference between being understood and being processed.",
    cost: "Unmeasured, everyone assumes they read people well — the research says most are barely above chance on strangers and dangerously confident on loved ones. The bill arrives as the hire, the partner, the deal you'd sworn you'd read right.",
    history: "Thorndike proposed social intelligence in 1920, the field built real instruments late — the reading-the-mind-in-the-eyes test in 1997, deception-accuracy meta-analyses in 2006 (humans: ~54%). Young measurement, humbling findings, and near-zero public access to a personal score. Until now.",
    personas: [
      { tag: "The confident misreader", text: "Certain they read everyone; the divorce and two hiring disasters disagree. Measurement replaces confidence with a hit rate — briefly humbling, permanently profitable." },
      { tag: "The anxious antenna", text: "Reads everything, trusts nothing they read. Accuracy scores usually run higher than they believe — the measurement gives them permission to act on data they were treating as noise." },
    ],
  },
  Financial: {
    forYou: "The line that manages money as a system — cash flow, debt, risk, compounding, the long game of net worth. Financial-literacy research finds it predicts wealth trajectories independent of income: it's not what you make, it's what this line does with it.",
    lived: "Consciously used, money loses its emotional static: bills become logistics instead of dread, purchases become priced in hours-of-life, and the strange calm of a funded emergency account changes how you negotiate, work, and sleep.",
    others: "Your financial line is generational infrastructure: the kids who watch budgeting learn it wordlessly, the aging parents get an advocate against the annuity salesman, the household runs on decisions instead of moods. Money silence is inherited; so is money competence.",
    cost: "The unmeasured cost is documented in the literature with rare precision: the same 'Big Three' financial questions, failed by most adults in every country tested, predict the fee-paying, under-saving, scam-vulnerable path. The line fails quietly for decades, then all at once at retirement.",
    history: "The youngest well-measured line in the profile: financial-literacy science effectively began in 2004 with Lusardi and Mitchell's Big Three questions, and exploded after 2008 made the stakes undeniable. Twenty years old, already one of the best-documented — and still untested in most adult lives.",
    personas: [
      { tag: "The high earner, zero keeper", text: "Six figures in, six figures out, net worth a rumor. Earning and managing are different lines; their profile usually shows exactly that split, and targeted financial coaching — cited in our library — repairs the one that lags." },
      { tag: "The anxious hoarder", text: "Saves everything, invests nothing, loses to inflation annually and calls it safety. Their line is strong on defense, unbuilt on offense — a measured profile names the imbalance their fear has been narrating as prudence." },
    ],
  },
  Humor: {
    forYou: "The line that makes and takes a joke — timing, incongruity, reading what this room finds funny. It sounds like garnish and functions as social infrastructure: humor research ties it to stress buffering, status, bonding, and the ability to say true things that couldn't survive delivery any other way.",
    lived: "Consciously used, life gets shock absorbers: the disaster becomes the story at dinner, tension breaks on your timing instead of someone's temper, and hard truths travel in packaging that keeps them hearable. Laughing at it and dealing with it stop being opposites.",
    others: "The household with a working humor line metabolizes stress differently — kids learn resilience as comedy, marriages develop private languages, and the worst year becomes, eventually, the best material. People stay near funny the way they stay near warm.",
    cost: "Unmeasured, a weak line just reads as 'serious' while quietly paying social tax at every table. Style research adds a sharper cost: aggressive and self-defeating humor damage exactly what affiliative humor builds — and without measurement, nobody knows which they're using.",
    history: "Humor became measurable psychology with the Humor Styles Questionnaire in 2003 — distinguishing the styles that protect (affiliative, self-enhancing) from the styles that corrode (aggressive, self-defeating). Twenty years of findings since; approximately no one outside a psych department has ever seen their scores.",
    personas: [
      { tag: "The deadpan dad", text: "Funny at work, formal at home — the line clocks out where it matters most. Measurement often reveals capacity idling in the highest-stakes room; deploying it is the cheapest marriage intervention in the library." },
      { tag: "The roast comic", text: "Always killing, occasionally wounding. Their volume is high and their style mix is the issue — the measured profile separates the humor that bonds their table from the humor that's been quietly clearing it." },
    ],
  },
  Parenting: {
    forYou: "The line that raises humans — attunement, consistency, repair after rupture, calibrating freedom to readiness. If you have or want children, it's the highest-stakes line in your profile: fifty years of developmental research says its level shows up in another person's whole life.",
    lived: "Consciously used, parenting shifts from performance to practice: tantrums become readable signals, discipline becomes teaching instead of weather, and the daily grind gains the strange dignity of measurable craft. You stop asking 'am I a good parent' and start asking 'which sub-skill is next.'",
    others: "No line's downstream effects are this literal: emotion-coaching parents raise better-regulated kids, secure attachment compounds across decades, and your measured gaps — repaired — are gaps your children never inherit. This line is the will you write while alive.",
    cost: "Unmeasured, parenting runs on inheritance and improvisation — you deploy your own parents' patterns at 2 a.m. and discover which ones were damage twenty years later, in your kid's therapy. The cost of never measuring is paying for the audit a generation late.",
    history: "Baumrind mapped parenting styles in 1966, Ainsworth measured attachment sensitivity in the 1970s, and Gottman's emotion-coaching research bridged it to daily practice in the 1990s. The science is mature and its protocols (three of them cited in our library) are among the best-tested interventions psychology owns. Framing it as a measured intelligence line is our framework's construal.",
    personas: [
      { tag: "The provider", text: "Works brutal hours to give the kids everything except the sub-skill the research says matters most: attuned minutes. Their measurement reframes the ledger — and usually redirects ten hours a week to their highest-return investment." },
      { tag: "The anxious optimizer", text: "Read every book, tracks every milestone, white-knuckles every decision. Their knowledge is high; their repair-after-rupture and self-regulation sub-lines carry the actual load. Measurement moves the effort to where the leverage is." },
    ],
  },
  Seduction: {
    forYou: "The line that creates romantic possibility — attraction, presence, escalation, the honest display of value. Whatever your relationship status, it priced how you got here and prices what you could rebuild after loss. It's the line our culture is loudest about and most embarrassed to examine.",
    lived: "Consciously used, romantic life stops being lottery and becomes literacy: you read interest accurately instead of hopefully, express it cleanly instead of ambiguously, and keep desire alive in long partnership — the sub-skill almost everyone needs and no one was taught.",
    others: "In partnership, this line is maintenance infrastructure: desire research is blunt that attraction in long relationships is kept, not found. The partner who still courts changes the entire emotional economy of a marriage — and models something rare for the kids watching.",
    cost: "The unmeasured cost is loneliness with a mechanism: attraction runs on learnable signals, misread or unsent for decades and narrated as 'just not lucky in love.' Post-divorce and post-loss, the unbuilt line becomes acute at the worst possible time.",
    history: "Attraction science is real and recent: evolutionary studies of mate preference (1989, 37 cultures), the speed-dating experiments of the 2000s, and long-term desire research since. Treating it as one measured intelligence line is our framework's construal — offered without the mysticism or the manipulation the topic usually attracts.",
    personas: [
      { tag: "The devoted roommate", text: "Great marriage, dead spark, both pretending not to notice. The line went unmaintained, not extinct. Measurement names the drift early — while the repair still costs attention instead of attorneys." },
      { tag: "The perpetual friend", text: "Wonderful, warm, and never chosen. Usually one sub-skill — expressing interest unambiguously — prices the whole line. A measurement finds the single broken link that a thousand self-help books blamed on their whole personality." },
    ],
  },
  "Community-Founding": {
    forYou: "The line that builds belonging — starting the group, holding the tradition, turning acquaintances into a village. Loneliness research now ranks disconnection with smoking as a mortality risk, which makes this line health infrastructure: someone has to build the community your longevity depends on.",
    lived: "Consciously used, social life stops being calendar luck: the monthly dinner exists because you instituted it, the group chat becomes a group, and you experience the specific meaning of being load-bearing in other people's belonging.",
    others: "This line's whole output is other people's lives: the neighbor with somewhere to go on Thanksgiving, the friend group that survived everyone's thirties, the village your kids think is normal. Founders are rare; every community you've loved had one.",
    cost: "The unmeasured cost arrives at the funerals and diagnoses — the years when belonging can't be built fast and must already exist. Social-capital research documented the decline; the personal version is discovering at sixty that nobody instituted the village, and you were the one wired to.",
    history: "Social capital became rigorous science through the 1990s-2000s (collective efficacy studies, then the famous documentation of America's civic decline), and the loneliness-mortality meta-analyses of the 2010s gave it clinical weight. Measuring founding capacity as an individual line is our framework's construal.",
    personas: [
      { tag: "The always-invited", text: "Rich social life, all of it built by others. Fine — until the founders move, and the calendar goes silent. Measurement shows whether they're wired to build or only to attend, before the difference gets tested by circumstance." },
      { tag: "The burnt-out organizer", text: "Founded everything, delegated nothing, quietly resentful. Their founding line is elite and their sustaining sub-skills — succession, sharing load — are the gap. The measurement separates the gift from the martyrdom." },
    ],
  },
  "Street Smarts": {
    forYou: "The line academia can't see and life can't do without — situational awareness, practical judgment, knowing who's trustworthy and what this situation actually is. Tacit-knowledge research found it nearly uncorrelated with IQ and strongly tied to real-world performance. This is the intelligence of Tuesday at 11 p.m.",
    lived: "Consciously used, the world's unwritten rules become readable: the deal that's off, the block that's wrong, the shortcut that's real, the person to know in every building. Competence in unstructured situations is its own quiet confidence — no credentials, all results.",
    others: "You're the one they call from the sketchy car lot, the new city, the situation that isn't in any manual. Street smarts protects networks: one person who can read the real world keeps a whole family from learning its lessons at retail price.",
    cost: "The unmeasured cost splits by direction: the credentialed-but-unstreetwise pay it in scams, bad neighborhoods misjudged, and predators unspotted; the streetwise-but-uncredentialed pay it in a lifetime of institutions refusing to recognize an intelligence they never learned to test.",
    history: "Sternberg and Wagner's practical-intelligence program (1985 onward) measured tacit knowledge and found the famous dissociation: street smarts and book smarts are different lines, and the world's tests only read one. Forty years later, that finding is still barely reflected anywhere — except here, where it's line 32 of 32.",
    personas: [
      { tag: "The sheltered scholar", text: "Three degrees, zero instincts, statistically overdue for an expensive lesson. Their profile names the exposure — and the library's error-management and situational training builds the line adulthood politely never required of them." },
      { tag: "The self-made operator", text: "No letters after the name, never been fooled twice. Their measured profile is often the first institutional document that prices their actual intelligence — and pairing it with one or two credentialed lines is rocket fuel." },
    ],
  },
};
