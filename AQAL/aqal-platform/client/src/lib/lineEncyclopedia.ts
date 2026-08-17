// ============================================================
// THE LINE ENCYCLOPEDIA — one entry per homepage line.
// Powers the click-to-learn popup on the 32-line dial: definition,
// the researchers behind it, how measurable it is, its relationship
// to g, and whether the visitor has ever been tested for it.
// Researcher names are real research programs; exact correlation
// values are pinned by the ongoing citation audit.
// ============================================================

export type GBand = "independent" | "mostly-independent" | "partially-linked" | "g-cluster";

export type LineInfo = {
  def: string;                       // what it is, plain language
  researchers: { name: string; note: string }[];
  measurement: string;               // how easily it's measured, and with what
  g: GBand;
  gNote: string;                     // the correlation story in one sentence
  everTested: string;                // has the visitor likely ever been measured on this?
};

export const G_BAND_LABEL: Record<GBand, { label: string; color: string }> = {
  "independent":        { label: "Independent of g (r ≈ .00–.15)", color: "#9BC0B2" },
  "mostly-independent": { label: "Mostly independent (r ≈ .15–.35)", color: "#9BC0B2" },
  "partially-linked":   { label: "Partially linked to g (r ≈ .35–.55)", color: "#E0C68C" },
  "g-cluster":          { label: "The g cluster (r ≈ .60–.80)", color: "#E2604A" },
};

export const LINE_ENCYCLOPEDIA: Record<string, LineInfo> = {
  Logical: {
    def: "Formal reasoning — following an argument under load, spotting the contradiction, knowing what follows from what and what doesn't.",
    researchers: [
      { name: "Charles Spearman", note: "discovered g itself (1904) — logical reasoning sits at its center" },
      { name: "John Raven", note: "built the Progressive Matrices, the purest logic test ever normed" },
      { name: "Raymond Cattell", note: "split fluid reasoning (Gf) from learned knowledge (Gc)" },
    ],
    measurement: "The most-measured capacity in psychology — a century of standardized instruments (Raven's, WAIS matrices) with excellent reliability.",
    g: "g-cluster",
    gNote: "This IS the heart of g — the line IQ tests measure best.",
    everTested: "Almost certainly yes — every IQ test, and much of the SAT/ACT, is substantially this line.",
  },
  Mathematical: {
    def: "Quantitative reasoning — fluency with numbers, proportions, probabilities, and symbolic systems in real decisions.",
    researchers: [
      { name: "Stanislas Dehaene", note: "mapped the brain's 'number sense'" },
      { name: "Brian Butterworth", note: "showed numerical ability can dissociate from general intelligence" },
      { name: "David Geary", note: "traced how mathematical cognition develops and fails" },
    ],
    measurement: "Extremely well measured — school math, the SAT-Q, and cognitive batteries all sample it reliably.",
    g: "g-cluster",
    gNote: "Correlates strongly with g, though number sense has its own machinery.",
    everTested: "Yes — every math class and standardized test you ever sat scored a slice of it.",
  },
  Spatial: {
    def: "Holding shapes and systems in the mind's eye — rotating objects mentally, navigating, seeing the whole layout at once.",
    researchers: [
      { name: "Roger Shepard & Jacqueline Metzler", note: "invented the mental-rotation task (1971)" },
      { name: "Nora Newcombe", note: "showed spatial skill is highly trainable" },
      { name: "David Uttal", note: "meta-analyzed 217 training studies — gains persist and transfer" },
    ],
    measurement: "Well measured in labs (mental rotation, paper folding) — but rarely included in school testing, so most people have no score.",
    g: "partially-linked",
    gNote: "A distinct broad ability (Gv) in the CHC model — related to g but separable.",
    everTested: "Probably not since childhood puzzles — schools systematically under-test it, which is why spatially-gifted people often feel mislabeled.",
  },
  Linguistic: {
    def: "Range, precision, and generativity in language — saying exactly what you mean, and building things out of words.",
    researchers: [
      { name: "Louis Thurstone", note: "isolated verbal comprehension and word fluency as primary abilities" },
      { name: "John Carroll", note: "catalogued language abilities in the largest survey of cognition ever done" },
      { name: "Steven Pinker", note: "mapped language as a distinct human instinct" },
    ],
    measurement: "Very well measured — vocabulary and verbal-reasoning tests are psychology's oldest instruments.",
    g: "g-cluster",
    gNote: "Crystallized verbal ability (Gc) — one of g's two anchors.",
    everTested: "Yes — the verbal half of every standardized test you've taken.",
  },
  Musical: {
    def: "Pitch, rhythm, and phrasing — hearing structure in sound, and producing it.",
    researchers: [
      { name: "Carl Seashore", note: "built the first musical-aptitude battery (1919)" },
      { name: "Edwin Gordon", note: "developed audiation theory and its measures" },
      { name: "Robert Zatorre", note: "showed musical training rewires the auditory brain at any age" },
    ],
    measurement: "Measurable with validated discrimination tests — but almost never administered outside conservatory auditions.",
    g: "mostly-independent",
    gNote: "Pitch and rhythm discrimination correlate only weakly with IQ; absolute pitch is essentially unrelated.",
    everTested: "Almost certainly never — unless you auditioned for a music program, no one has ever measured this in you.",
  },
  "Bodily-Kinesthetic": {
    def: "Trained control of the body toward a skilled end — coordination, timing, and physical problem-solving.",
    researchers: [
      { name: "Edwin Fleishman", note: "built the definitive taxonomy of psychomotor abilities" },
      { name: "Howard Gardner", note: "named it an intelligence in its own right (1983)" },
      { name: "Phillip Ackerman", note: "showed motor skill acquisition follows its own laws, apart from IQ" },
    ],
    measurement: "Measured well in sport science and ergonomics labs — never in schools or workplaces.",
    g: "independent",
    gNote: "Psychomotor ability is its own factor in the psychometric canon, near-zero g-loading.",
    everTested: "Only informally — a coach's eye or a tryout. Never as an intelligence.",
  },
  Naturalist: {
    def: "Reading living systems — fine distinctions in plants, animals, weather, land, and how they interconnect.",
    researchers: [
      { name: "Howard Gardner", note: "added it as the eighth intelligence (1995)" },
      { name: "E.O. Wilson", note: "argued the human bond with living systems (biophilia) is innate" },
      { name: "Scott Atran", note: "documented folk-biological expertise across cultures" },
    ],
    measurement: "Hard to test on paper — real measurement requires field distinctions, which is why we score it from how you think aloud.",
    g: "mostly-independent",
    gNote: "Ecological pattern expertise develops with exposure, largely apart from g.",
    everTested: "Never — no standardized test on earth samples it.",
  },
  Interpersonal: {
    def: "Modeling other minds — reading what people want, fear, and intend, and moving a room with that knowledge.",
    researchers: [
      { name: "Edward Thorndike", note: "named social intelligence a century ago (1920)" },
      { name: "Howard Gardner", note: "made it one of his core intelligences" },
      { name: "Ronald Riggio", note: "built modern social-skill inventories" },
    ],
    measurement: "Measurable with situational-judgment and social-inference tests — imperfectly, which is why voice evidence helps.",
    g: "mostly-independent",
    gNote: "Social intelligence measures show low g-loading; a group's collective intelligence tracks members' social sensitivity, not their IQs.",
    everTested: "Almost certainly never formally — the world just quietly promoted or passed on you based on it.",
  },
  Intrapersonal: {
    def: "Accuracy of the self-model — how well your story about yourself matches the person who actually acts.",
    researchers: [
      { name: "Howard Gardner", note: "named the intelligence of self-knowledge" },
      { name: "Jane Loevinger", note: "measured stages of ego development" },
      { name: "Anthony Grant", note: "built the modern self-reflection and insight scales" },
    ],
    measurement: "Genuinely hard to measure — self-report is exactly what a distorted self-model corrupts, so we triangulate from spoken evidence.",
    g: "mostly-independent",
    gNote: "Self-insight correlates weakly with IQ — smart people are not reliably self-aware.",
    everTested: "Never — and most people go a whole life without one honest reading of it.",
  },
  Existential: {
    def: "Working seriously with meaning, mortality, and what any of it is for.",
    researchers: [
      { name: "Viktor Frankl", note: "made meaning-making the center of psychological survival" },
      { name: "Paul Baltes", note: "the Berlin Wisdom Paradigm — measuring wisdom empirically" },
      { name: "Paul Wong", note: "built the modern meaning-in-life measures" },
    ],
    measurement: "Measurable through structured wisdom and meaning protocols — slow, rich, interview-based. Exactly what a voice assessment is for.",
    g: "mostly-independent",
    gNote: "Wisdom-related performance correlates only ~.20 with intelligence — life experience carries more weight.",
    everTested: "Never — no institution in your life has ever asked, let alone measured.",
  },
  Moral: {
    def: "The altitude of the ethical frame you actually live — not the one you claim.",
    researchers: [
      { name: "Lawrence Kohlberg", note: "mapped the stages of moral reasoning" },
      { name: "James Rest", note: "built the Defining Issues Test, its standardized measure" },
      { name: "Carol Gilligan", note: "showed the care dimension the stage models missed" },
    ],
    measurement: "Well-instrumented (the DIT has decades of data) — but only ever administered in research settings.",
    g: "mostly-independent",
    gNote: "Moral development correlates modestly with cognition but develops on its own track.",
    everTested: "Almost certainly never — unless you took part in a university study.",
  },
  Aesthetic: {
    def: "Discernment of form — perceiving what makes a thing land, in any medium.",
    researchers: [
      { name: "Irvin Child", note: "showed aesthetic sensitivity is a measurable, stable individual difference" },
      { name: "Helmut Leder", note: "built the standard model of aesthetic processing" },
      { name: "Anjan Chatterjee", note: "founded modern neuroaesthetics" },
    ],
    measurement: "Measurable with judgment tests; expertise changes scores measurably. Never tested outside art schools.",
    g: "independent",
    gNote: "Tracks the personality trait Openness, not IQ.",
    everTested: "Never — taste has shaped your whole life without once being measured.",
  },
  Emotional: {
    def: "Granularity and regulation of feeling in real time — naming what's happening inside and steering it.",
    researchers: [
      { name: "Peter Salovey & John Mayer", note: "defined ability-model emotional intelligence (1990)" },
      { name: "David Caruso", note: "co-built the MSCEIT, its standard test" },
      { name: "James Gross", note: "mapped how emotion regulation actually works" },
    ],
    measurement: "Well measured by ability tests (MSCEIT) — almost never administered outside corporate workshops that use the wrong (self-report) kind.",
    g: "mostly-independent",
    gNote: "Ability EI correlates ~.30 with IQ and predicts outcomes beyond it.",
    everTested: "Probably only by quiz-magazine versions — the real ability test almost certainly never.",
  },
  "Meta-Cognitive": {
    def: "Knowing what you know and don't — catching your own thinking mid-flight and correcting it.",
    researchers: [
      { name: "John Flavell", note: "coined metacognition (1979)" },
      { name: "Thomas Nelson", note: "built the standard monitoring-and-control framework" },
      { name: "David Dunning", note: "showed the least skilled know it least (Dunning-Kruger)" },
    ],
    measurement: "Measurable through calibration testing — comparing confidence against accuracy. We test it directly.",
    g: "partially-linked",
    gNote: "Contested: calibration accuracy does correlate with ability, but monitoring skill is partly its own capacity — our audit tracks this one closely.",
    everTested: "Never explicitly — though every bad bet you ever made was this line failing silently.",
  },
  Volitional: {
    def: "Sustained will — starting, continuing, and finishing under friction. The line that ships things.",
    researchers: [
      { name: "Walter Mischel", note: "the delay-of-gratification studies" },
      { name: "Roy Baumeister", note: "mapped self-control's limits and strength model" },
      { name: "Angela Duckworth", note: "showed self-discipline out-predicts IQ for achievement" },
    ],
    measurement: "Measured by validated scales and — better — by behavior over time. Our tracker measures it monthly, live.",
    g: "independent",
    gNote: "Correlates near zero with IQ — sometimes negative. Genuinely its own axis.",
    everTested: "Never — the most outcome-deciding line in your life has never once been scored.",
  },
  Adversarial: {
    def: "Performance against an opponent trying to beat you — strategy, deception-reading, and nerve under opposition.",
    researchers: [
      { name: "Richard Byrne & Andrew Whiten", note: "the Machiavellian Intelligence hypothesis" },
      { name: "Colin Camerer", note: "measured strategic thinking in behavioral game theory" },
      { name: "Max Bazerman", note: "showed negotiation skill is measurable and trainable" },
    ],
    measurement: "Measurable through game-theoretic tasks and negotiation performance — confined to business schools and labs.",
    g: "independent",
    gNote: "Game performance and negotiation outcomes are weakly predicted by IQ.",
    everTested: "Never formally — though every rival you've faced has been scoring you informally.",
  },
  Interoceptive: {
    def: "Fidelity of the inward signal — how accurately you read your own body's data: heartbeat, gut, fatigue, hunger, alarm.",
    researchers: [
      { name: "Sarah Garfinkel", note: "built the modern three-level model of interoception" },
      { name: "Hugo Critchley", note: "mapped its brain pathways" },
      { name: "A.D. (Bud) Craig", note: "traced the neuroanatomy of 'how you feel'" },
    ],
    measurement: "Precisely measurable (heartbeat-detection tasks) — and administered almost nowhere outside research labs.",
    g: "independent",
    gNote: "Essentially zero correlation with IQ — the cleanest independent line in the set.",
    everTested: "Categorically never — fewer than one person in ten thousand has ever had this measured.",
  },
  Strategic: {
    def: "Multi-move sequencing toward an end nobody can see yet — playing the long game well.",
    researchers: [
      { name: "Adriaan de Groot", note: "the founding studies of expert strategic thought (chess)" },
      { name: "Gary Klein", note: "how experts actually decide under pressure" },
      { name: "Robert Sternberg", note: "put practical-strategic thinking inside intelligence theory" },
    ],
    measurement: "Measured through scenario performance and planning tasks — rich but rarely standardized. Voice evidence captures it well.",
    g: "partially-linked",
    gNote: "Planning draws on fluid reasoning but expert strategy is domain-built and partly separable.",
    everTested: "Never directly — chess ratings and won campaigns are the closest proxies most people have.",
  },
  Systemic: {
    def: "Seeing wholes, loops, and second-order effects — what happens after what happens.",
    researchers: [
      { name: "Jay Forrester", note: "founded system dynamics at MIT" },
      { name: "John Sterman", note: "documented how badly even experts reason about stocks and flows" },
      { name: "Donella Meadows", note: "mapped where leverage actually lives in systems" },
    ],
    measurement: "Measurable with systems-thinking inventories; deficits are well-documented even among the highly educated.",
    g: "partially-linked",
    gNote: "Related to reasoning but trained systems thinking is its own discipline.",
    everTested: "Almost certainly never — most people first meet this line when their second-order effects arrive.",
  },
  Entrepreneurial: {
    def: "Turning a vision into a shipped, funded, surviving thing — opportunity recognition plus execution under uncertainty.",
    researchers: [
      { name: "Saras Sarasvathy", note: "discovered how expert founders actually reason (effectuation)" },
      { name: "Scott Shane", note: "mapped who finds and exploits opportunities" },
      { name: "David McClelland", note: "measured achievement motivation, its engine" },
    ],
    measurement: "Measured by track record and validated scales of orientation — no school test touches it.",
    g: "mostly-independent",
    gNote: "Founder performance is weakly predicted by IQ; execution and opportunity-reading carry it.",
    everTested: "Never — the market has been your only examiner.",
  },
  Creative: {
    def: "Producing the genuinely new — not the recombined. Fluency, originality, and taste in generation.",
    researchers: [
      { name: "J.P. Guilford", note: "launched divergent-thinking measurement (1950)" },
      { name: "E. Paul Torrance", note: "built the standard creativity tests" },
      { name: "Mihaly Csikszentmihalyi", note: "mapped how creative work actually happens" },
    ],
    measurement: "Measured by divergent-thinking tests with decades of norms — rarely administered after childhood gifted programs.",
    g: "mostly-independent",
    gNote: "Above IQ ~120, creativity and intelligence essentially decorrelate (the threshold effect).",
    everTested: "Possibly once, if you were in a gifted program — otherwise never.",
  },
  Rhetorical: {
    def: "Moving a listener from one position to another — persuasion as a craft of framing, timing, and delivery.",
    researchers: [
      { name: "Robert Cialdini", note: "codified the mechanisms of influence" },
      { name: "Richard Petty & John Cacioppo", note: "mapped the two routes of persuasion" },
      { name: "Aristotle", note: "wrote the field's founding manual — still assigned" },
    ],
    measurement: "Measurable through persuasion outcomes and communication assessment — voice evidence is its natural medium.",
    g: "mostly-independent",
    gNote: "Persuasive skill is weakly predicted by IQ; delivery and audience-reading dominate.",
    everTested: "Never — juries, customers, and dates have graded it your whole life, without a rubric.",
  },
  Leadership: {
    def: "Real commitment and coordinated action from others — not the title, the following.",
    researchers: [
      { name: "Bernard Bass", note: "measured transformational leadership" },
      { name: "Timothy Judge", note: "meta-analyzed what actually predicts leader emergence" },
      { name: "Robert Hogan", note: "showed how leaders derail — and how to see it coming" },
    ],
    measurement: "Heavily measured in organizations (360s, assessment centers) — but almost never before someone already holds power.",
    g: "mostly-independent",
    gNote: "IQ predicts leader emergence weakly; personality and social skill carry most of it.",
    everTested: "Only if an employer ran a 360 on you — and that measured your title's shadow, not the line.",
  },
  Mechanical: {
    def: "Practical mastery of how physical things work — forces, mechanisms, tools, repair.",
    researchers: [
      { name: "George Bennett", note: "built the Mechanical Comprehension Test, used for 80 years" },
      { name: "Edwin Fleishman", note: "taxonomized mechanical and technical abilities" },
      { name: "Mary Hegarty", note: "showed mechanical reasoning runs on mental simulation" },
    ],
    measurement: "Well measured — trade tests and the military's ASVAB sample it routinely. College tracks skip it entirely.",
    g: "partially-linked",
    gNote: "Correlates with spatial and reasoning ability but hands-on mastery is its own accumulation.",
    everTested: "Only if you took a trade or military entrance test — the college-bound were never asked.",
  },
  "Pattern-Recognition": {
    def: "Seeing the shape early, from sparse signal — the trained hunch that arrives before the analysis.",
    researchers: [
      { name: "Arthur Reber", note: "discovered implicit learning (1967)" },
      { name: "Scott Barry Kaufman", note: "showed implicit learning is an ability, separate from IQ" },
      { name: "Gary Klein", note: "recognition-primed decision making in experts" },
    ],
    measurement: "Measurable with implicit-learning tasks — a well-kept laboratory secret, administered almost nowhere.",
    g: "independent",
    gNote: "Implicit learning correlates ~.10 with IQ — a genuine learning ability IQ tests cannot see.",
    everTested: "Never — this line has been running your best calls invisibly for decades.",
  },
  "Social-Perceptual": {
    def: "Reading status, intent, and the unspoken — faces, rooms, and what isn't being said.",
    researchers: [
      { name: "Paul Ekman", note: "mapped facial expression and its reading" },
      { name: "Jeremy Wilmer", note: "showed face recognition is heritable and separate from IQ" },
      { name: "Simon Baron-Cohen", note: "built the standard mind-reading-from-eyes test" },
    ],
    measurement: "Precisely measurable (face and expression tasks) — administered only in research labs.",
    g: "independent",
    gNote: "Face-reading ability dissociates from both IQ and general memory in twin studies.",
    everTested: "Never — despite it deciding half your first impressions and negotiations.",
  },
  Financial: {
    def: "Conative money sense — the actual behaviors that compound or destroy wealth, distinct from knowing arithmetic.",
    researchers: [
      { name: "Annamaria Lusardi", note: "created the global standard financial-literacy measures" },
      { name: "Olivia Mitchell", note: "tied financial knowledge to lifetime wealth outcomes" },
      { name: "Richard Thaler", note: "founded behavioral economics — why smart people do dumb money things" },
    ],
    measurement: "Measurable with three questions most of the world fails — and by your actual balance-sheet behavior, which our tracker reads.",
    g: "mostly-independent",
    gNote: "Financial behavior is driven by domain knowledge and self-regulation more than IQ.",
    everTested: "Almost certainly never — the most expensive untested line in most lives.",
  },
  Humor: {
    def: "State-change capacity — shifting a room, a mood, or a standoff at will.",
    researchers: [
      { name: "Rod Martin", note: "built the humor-styles framework and its measures" },
      { name: "Gil Greengross", note: "measured humor production and its social payoffs" },
      { name: "Geoffrey Miller", note: "placed humor inside fitness-signaling theory" },
    ],
    measurement: "Measurable through production tasks and style inventories — confined to research settings.",
    g: "independent",
    gNote: "Humor style is essentially g-free; only produced-joke quality correlates modestly with IQ.",
    everTested: "Never formally — though every room you've ever entered ran the informal version.",
  },
  Parenting: {
    def: "Developmental altitude expressed in raising a person — treating the child as a mind, not a behavior problem.",
    researchers: [
      { name: "Peter Fonagy", note: "created reflective-functioning theory" },
      { name: "Patrick Luyten", note: "built its standard questionnaire (PRFQ)" },
      { name: "Diana Baumrind", note: "mapped the parenting styles half a century of research confirms" },
    ],
    measurement: "Measurable with validated reflective-functioning instruments — essentially never administered to ordinary parents.",
    g: "mostly-independent",
    gNote: "Parental mentalizing predicts child outcomes independent of parental IQ.",
    everTested: "Never — the highest-stakes role most people ever hold, and nobody ever measured readiness.",
  },
  Seduction: {
    def: "Relational draw severed from appearance — initiating and deepening romantic connection by skill, not luck.",
    researchers: [
      { name: "Glenn Geher & Scott Barry Kaufman", note: "built the Mating Intelligence research program" },
      { name: "Jeffrey Hall", note: "measured flirting styles and their outcomes" },
      { name: "David Buss", note: "mapped human mating strategies across 37 cultures" },
    ],
    measurement: "Emerging instruments exist (mating intelligence, flirting styles) — the evidence base is thinner here, and we say so.",
    g: "mostly-independent",
    gNote: "Romantic competence is weakly related to IQ; attunement and confidence carry it.",
    everTested: "Never — the market ran the only tests, and never showed you your scores.",
  },
  "Community-Founding": {
    def: "Bringing a durable group into being around a shared frame — and keeping it alive.",
    researchers: [
      { name: "David McMillan & David Chavis", note: "defined and measured the sense of community" },
      { name: "Robert Putnam", note: "quantified social capital and its collapse" },
      { name: "Elinor Ostrom", note: "Nobel-winning work on how communities actually govern themselves" },
    ],
    measurement: "Measurable through the SCI-2 and by the communities you've actually built — a track-record line.",
    g: "mostly-independent",
    gNote: "A group's collective intelligence tracks social process, not the founders' IQs.",
    everTested: "Never — civilization depends on this line and has never once tested for it.",
  },
  "Street Smarts": {
    def: "Real-world reads under real stakes — practical intelligence where the textbook ends.",
    researchers: [
      { name: "Robert Sternberg", note: "formalized practical intelligence and its tacit-knowledge tests" },
      { name: "Stephen Ceci", note: "showed expert judgment can be uncorrelated with IQ (the racetrack studies)" },
      { name: "Jean Lave", note: "documented flawless everyday math in people who fail school math" },
    ],
    measurement: "Measurable with tacit-knowledge inventories and scenario tests — never in schools, which is the point.",
    g: "independent",
    gNote: "In-domain practical expertise shows near-zero correlation with IQ in the classic studies.",
    everTested: "Never on paper — the street has been examining you your whole life.",
  },
};
