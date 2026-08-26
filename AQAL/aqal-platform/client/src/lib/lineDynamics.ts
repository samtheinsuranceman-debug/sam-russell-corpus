// ============================================================
// LINE DYNAMICS — the interaction layer of the 32 lines, per
// line: the self-regulation angle (what this line means for
// self-awareness and self-control), the power TRIO (its two
// best partners and the emergent property the three forge —
// our framework's construal, built on each line's research
// profile), the weakness CLUSTER (the co-weaknesses that
// compound it), and the CONTROLLING-weakness dynamic (how it
// warps the whole cluster when it's the dominant weak line).
// Partner names are validated against LINE_NAMES by test.
// ============================================================

export type LineDynamics = {
  selfReg: string;                                  // self-awareness & self-modulation
  trio: { partners: [string, string]; emergent: string };
  weakCluster: { partners: string[]; failure: string };
  controlling: string;                              // as the dominant weakness
};

export const LINE_DYNAMICS: Record<string, LineDynamics> = {
  Logical: {
    selfReg: "Inward, this line is your error-checker: the ability to audit your own reasoning mid-flight, catch the motivated conclusion before you act on it, and hold a belief loosely enough to test it. Weak self-applied logic doesn't feel like confusion — it feels like certainty.",
    trio: { partners: ["Rhetorical", "Strategic"], emergent: "The advocate-general: airtight reasoning, delivered so it lands, aimed where it matters. Three lines that separately make a critic, a talker, and a planner — together they make the person whose argument moves the room AND survives review." },
    weakCluster: { partners: ["Meta-Cognitive", "Pattern-Recognition", "Financial"], failure: "Weak logic plus weak self-monitoring plus weak pattern-sight is the conspiracy-and-bad-bets cluster: conclusions arrive by feeling, nothing audits them, and money keeps voting on them." },
    controlling: "As the dominant weakness it poisons the cluster's inputs: every other line's output passes through broken quality control, so good instincts get reasoned into bad decisions — and the stronger the other lines, the more convincing the bad decisions sound." },
  Mathematical: {
    selfReg: "Inward, this is magnitude sense about yourself — honestly sizing your time, your odds, your spending, your risks. People weak here aren't bad at math class; they're bad at 'how big is this, really?' — and their calendar and card statement show it.",
    trio: { partners: ["Financial", "Pattern-Recognition"], emergent: "The quant investor's stack: patterns spotted, priced, and sized. Together they forge calibrated risk-taking — the rare capacity to know not just WHAT to bet on but exactly how much." },
    weakCluster: { partners: ["Financial", "Volitional", "Meta-Cognitive"], failure: "The debt-spiral cluster: magnitudes unfelt, money unmanaged, impulses unchecked, and no self-audit to catch the slide until the statement does." },
    controlling: "As the controlling weakness it silently deletes scale from every decision the other lines make — strategy without sizing, creativity without budgets, plans whose numbers were never real." },
  Spatial: {
    selfReg: "Inward, spatial sense is how you hold your own life as one picture — seeing where you are on the map of a project, a career, a city. Weak spatial self-placement feels like permanent 'where was I?'",
    trio: { partners: ["Mechanical", "Creative"], emergent: "The builder-inventor: sees the whole structure, knows how the parts join, and imagines the version that doesn't exist yet. Together: the capacity to design real things that work." },
    weakCluster: { partners: ["Mechanical", "Strategic", "Systemic"], failure: "The lost-in-the-machine cluster: no picture of the system, no feel for its parts, no plan through it — every complex environment becomes a corridor maze." },
    controlling: "Dominant-weak, it denies the other lines a shared map: strategy plans blind, systems thinking loses the diagram, and execution keeps colliding with structure it never saw." },
  Linguistic: {
    selfReg: "Inward, language is the resolution of your self-talk: you can only regulate feelings as precisely as you can name them. A weak linguistic line makes the inner life a blur of 'fine' and 'bad' — and blurs are unmanageable.",
    trio: { partners: ["Rhetorical", "Interpersonal"], emergent: "The voice: precise words, persuasive delivery, aimed at what this listener actually needs. Together they forge influence that feels like understanding — because it is." },
    weakCluster: { partners: ["Emotional", "Intrapersonal", "Rhetorical"], failure: "The unheard cluster: feelings without names, needs without sentences, positions without advocacy — a person the world consistently misreads because the interface is down." },
    controlling: "As the controlling weakness it starves every other line of expression: brilliant reasoning nobody hears, empathy that can't say the right thing, leadership with no words at the moment that needed them." },
  Musical: {
    selfReg: "Inward, this line is rhythm-sense for your own states — hearing when your day, your energy, your household is out of tempo, and re-tuning it. People strong here self-soothe with structure and sound; people weak here don't notice the noise until it's a breakdown.",
    trio: { partners: ["Aesthetic", "Emotional"], emergent: "The mood-architect: hears emotional tone, shapes it, and knows what beauty does to a room. Together: the capacity to change how a space full of people feels in ninety seconds." },
    weakCluster: { partners: ["Interoceptive", "Aesthetic", "Emotional"], failure: "The tone-deaf-to-self cluster: no feel for internal rhythm, no read on atmosphere, emotional weather arriving unannounced — life experienced as static." },
    controlling: "Dominant-weak, it flattens the cluster's timing: conversations land off-beat, efforts surge and crash arrhythmically, and the other lines never find a sustainable cadence to run at." },
  "Bodily-Kinesthetic": {
    selfReg: "Inward, this is command of your own instrument — posture, breath, tension, motion — the physical half of self-control. Regulating a state you can't physically settle is theory; this line makes it practice.",
    trio: { partners: ["Interoceptive", "Volitional"], emergent: "The trained body: reads its own signals, obeys deliberate command, and shows up on the days it doesn't want to. Together they forge physical discipline — the substrate every other discipline borrows." },
    weakCluster: { partners: ["Interoceptive", "Volitional", "Emotional"], failure: "The stress-somatization cluster: tension unfelt until it's symptomatic, no physical outlet, willpower with no body to carry it — burnout's favorite address." },
    controlling: "As the controlling weakness it keeps the whole cluster theoretical: insights never become actions, states never get moved through the body, and the mind negotiates endlessly with an instrument it can't play." },
  Naturalist: {
    selfReg: "Inward, the naturalist eye is honest observation of your own patterns as they actually occur — field notes on yourself, without the story. Weak here, people theorize about themselves instead of watching themselves.",
    trio: { partners: ["Pattern-Recognition", "Systemic"], emergent: "The field scientist: patient observation, pattern extraction, and systems context. Together: the capacity to understand how any living system — a market, a family, a forest — actually behaves versus how it claims to." },
    weakCluster: { partners: ["Pattern-Recognition", "Interoceptive", "Meta-Cognitive"], failure: "The unobserved-life cluster: no data collected on self or world, so the same seasons produce the same surprises, year after year." },
    controlling: "Dominant-weak, it cuts the cluster off from evidence: every other line runs on assumption instead of observation, and reality keeps filing corrections nobody reads." },
  Interpersonal: {
    selfReg: "Inward, this line governs how you manage yourself IN relation — noticing your effect on people in real time and adjusting without abandoning yourself. Weak here, self-control tends to mean silence or steamroll, nothing between.",
    trio: { partners: ["Emotional", "Leadership"], emergent: "The people-mover: reads individuals, regulates the emotional field, and points the group somewhere. Together they forge the capacity to take a room of strangers and leave a team." },
    weakCluster: { partners: ["Social-Perceptual", "Emotional", "Rhetorical"], failure: "The isolation cluster: rooms misread, feelings mishandled, words that land wrong — relationships as recurring accidents, and eventually as things avoided." },
    controlling: "As the controlling weakness it turns every other strength solitary: nothing brilliant gets collaborated on, help never gets recruited, and the network effects that multiply careers simply never start." },
  Intrapersonal: {
    selfReg: "This IS the self-regulation line's headquarters: access to your own motives, wounds, and wants, honestly. Every self-control strategy depends on the accuracy of this line's reporting — you cannot steer a self you can't see.",
    trio: { partners: ["Meta-Cognitive", "Existential"], emergent: "The examined life, operational: knows what it feels, watches how it thinks, and knows what it's for. Together: self-possession — decisions that come from the whole person instead of the loudest part." },
    weakCluster: { partners: ["Emotional", "Meta-Cognitive", "Moral"], failure: "The stranger-to-self cluster: motives opaque, feelings unowned, thinking unwatched, values undefined — a life run by whichever impulse showed up first." },
    controlling: "Dominant-weak, it corrupts the cluster at the root: every other line executes brilliantly on goals that were never actually yours, and the success, when it comes, fits like someone else's coat." },
  Existential: {
    selfReg: "Inward, this line is meaning-maintenance: keeping today's effort connected to what it's for. Its self-regulation power is stamina — people don't burn out from work; they burn out from work that lost its why.",
    trio: { partners: ["Moral", "Strategic"], emergent: "The mission-carrier: knows what matters, knows what's right, and can plan the decade. Together they forge purpose with a route — conviction that survives contact with logistics." },
    weakCluster: { partners: ["Volitional", "Intrapersonal", "Moral"], failure: "The drift cluster: no why, no want, no compass, no push — the outwardly-fine life that feels like a waiting room." },
    controlling: "As the controlling weakness it drains the cluster's fuel: every other line still works, but nothing feels worth pointing them at — the engine idles in a running car going nowhere." },
  Moral: {
    selfReg: "Inward, the moral line is self-governance under temptation — behaving like yourself when no one is watching and the incentive says otherwise. It's the line that makes all your other self-promises enforceable.",
    trio: { partners: ["Leadership", "Community-Founding"], emergent: "The trusted founder: principled, followed, and building something bigger than himself. Together they forge legitimate authority — the kind people volunteer for." },
    weakCluster: { partners: ["Adversarial", "Financial", "Street Smarts"], failure: "The corner-cutting cluster: sharp moves, loose ethics, short-term wins — a reputation spending itself faster than any skill can earn it back." },
    controlling: "Dominant-weak, it converts the cluster's strengths into liabilities: persuasion becomes manipulation, strategy becomes scheming, and every game gets won in ways that end the league." },
  Aesthetic: {
    selfReg: "Inward, taste is quality-control on your own output and environment — the felt sense of 'not right yet' that drives revision. Weak here, people ship the first draft of everything, including their surroundings and themselves.",
    trio: { partners: ["Creative", "Seduction"], emergent: "The magnetic maker: generates the new, refines it until it's beautiful, and presents it with pull. Together: work — and a presence — people can't look away from." },
    weakCluster: { partners: ["Creative", "Social-Perceptual", "Humor"], failure: "The tone-deaf-output cluster: things made without taste, delivered without read, landing without grace — effort that repels the audience it wanted." },
    controlling: "As the controlling weakness it caps the cluster's ceiling: everything the other lines produce stalls at 'functional,' and functional is invisible in every market that matters." },
  Emotional: {
    selfReg: "This is the regulation line itself, inward-facing: feeling a state fully without being commandeered by it, and shifting it on purpose. Every plan you've ever abandoned at 11pm was abandoned here.",
    trio: { partners: ["Interoceptive", "Intrapersonal"], emergent: "The self-command stack: body signals read early, feelings named accurately, states steered deliberately. Together they forge composure that isn't suppression — the real thing." },
    weakCluster: { partners: ["Volitional", "Interoceptive", "Interpersonal"], failure: "The hijack cluster: states arrive unannounced, run unchecked, wreck follow-through and relationships in the same afternoon — then hand back the controls and apologize." },
    controlling: "As the dominant weakness it takes the whole cluster hostage on a schedule: everything works until the state spikes, and then no other line is allowed to function until the weather passes." },
  "Meta-Cognitive": {
    selfReg: "Inward, this is thinking about your thinking — catching the bias mid-thought, noticing the strategy isn't working WHILE it isn't working. It's the difference between having thoughts and supervising them.",
    trio: { partners: ["Logical", "Intrapersonal"], emergent: "The self-correcting mind: watches its own reasoning, audits it honestly, and knows whose interests the conclusion serves. Together: judgment that improves with use instead of hardening." },
    weakCluster: { partners: ["Logical", "Adversarial", "Financial"], failure: "The mark's cluster: unexamined thinking, unaudited conclusions, undefended flanks — the exact profile every con, cult, and bubble is optimized to find." },
    controlling: "Dominant-weak, it removes the cluster's referee: every other line plays full-speed with no one watching the replays, so errors don't just happen — they compound, unnoticed, for decades." },
  Volitional: {
    selfReg: "Inward, volition is the government of intention: the capacity to issue yourself an order and have it carried out — on the cold morning, at the boring middle, past the plateau. It is self-control's executive branch.",
    trio: { partners: ["Strategic", "Entrepreneurial"], emergent: "The closer: sees the plan, starts the venture, and — the rare part — finishes. Together they forge execution: the thing that separates the idea people from the built-things people." },
    weakCluster: { partners: ["Emotional", "Bodily-Kinesthetic", "Meta-Cognitive"], failure: "The abandoned-projects cluster: moods veto plans, the body votes couch, and nobody's watching the pattern — a graveyard of Day Fours." },
    controlling: "THE classic controlling weakness: with volition dominant-weak, it does not matter how brilliant the other thirty-one lines are — nothing ships, nothing compounds, and the world never finds out. Genius, unexecuted, scores zero." },
  Adversarial: {
    selfReg: "Inward, the adversarial line is self-defense of attention and interests — noticing when you're being played, pressured, or drained, including by your own habits. Its self-regulation gift is boundaries that hold under charm.",
    trio: { partners: ["Strategic", "Street Smarts"], emergent: "The hard-target: reads the game, reads the street, plans three moves out. Together: the capacity to operate in hostile environments and come home whole." },
    weakCluster: { partners: ["Street Smarts", "Social-Perceptual", "Financial"], failure: "The exploitable cluster: traps unseen, rooms misread, money undefended — the profile predators can smell through a phone line." },
    controlling: "As the controlling weakness it leaves every other line ungarrisoned: the empathy gets used against you, the money gets harvested, the career gets outmaneuvered — strength after strength, lost to people who fight." },
  Interoceptive: {
    selfReg: "This is self-awareness at the hardware level: reading hunger, fatigue, stress, and arousal early enough to act on them. Every regulation skill downstream depends on this line's signal quality — you can't manage a state you detected an hour late.",
    trio: { partners: ["Emotional", "Bodily-Kinesthetic"], emergent: "The regulated athlete-of-life: body signals in, feelings named, physical adjustment out. Together they forge stress-resilience you can watch on a heart-rate monitor." },
    weakCluster: { partners: ["Emotional", "Bodily-Kinesthetic", "Naturalist"], failure: "The crash-without-warning cluster: no gauges, no early signal, no observation habit — health and mood discovered only at the breakdown, every time." },
    controlling: "Dominant-weak, it blinds the cluster's instruments: decisions get made by states nobody detected, and the other lines keep executing confidently on a body that already left the meeting." },
  Strategic: {
    selfReg: "Inward, strategy is self-direction across time: converting what you want into sequenced moves, and resisting the tactical snack that eats the strategic meal. Weak here, self-discipline has no itinerary to be disciplined about.",
    trio: { partners: ["Pattern-Recognition", "Volitional"], emergent: "The campaign-runner: sees the board, plans the seasons, executes the Tuesdays. Together they forge the long game actually played — not just diagrammed." },
    weakCluster: { partners: ["Systemic", "Financial", "Meta-Cognitive"], failure: "The busy-but-losing cluster: effort without sequence, systems unread, resources unpositioned — years of motion that never becomes progress." },
    controlling: "As the controlling weakness it condemns the cluster to tactics: every other line wins its little battles brilliantly while the war goes unplanned, unfought, and slowly lost." },
  Systemic: {
    selfReg: "Inward, systems-sight applied to self: seeing your habits, environment, and relationships as one feedback machine — and redesigning the machine instead of blaming the operator. It's why environment design beats willpower.",
    trio: { partners: ["Strategic", "Mechanical"], emergent: "The architect of leverage: sees the system, plans the intervention, knows where the load-bearing bolt is. Together: change achieved by moving one piece instead of pushing on everything." },
    weakCluster: { partners: ["Strategic", "Naturalist", "Pattern-Recognition"], failure: "The whack-a-mole cluster: symptoms chased, causes unseen, the same problem re-solved quarterly in new costumes." },
    controlling: "Dominant-weak, it curses the cluster to fight effects forever: every other line's effort pours into symptoms while the unseen loop that generates them runs untouched." },
  Entrepreneurial: {
    selfReg: "Inward, this line is self-permission under uncertainty: acting before conditions are safe, tolerating the ambiguity your comfort-seeking circuitry hates. Its self-regulation gift is functioning without guarantees.",
    trio: { partners: ["Financial", "Rhetorical"], emergent: "The founder's stack: sees the opportunity, prices it, and sells it before it exists. Together they forge venture — value conjured from nothing but a read and a pitch." },
    weakCluster: { partners: ["Volitional", "Adversarial", "Financial"], failure: "The employee-forever cluster (when the dream says otherwise): risk unbearable, competition avoided, capital untouched — opportunity after opportunity watched from shore." },
    controlling: "As the controlling weakness it locks the cluster in permission-seeking: every other strength waits for a green light that no one is ever going to give." },
  Creative: {
    selfReg: "Inward, creativity is self-renewal: generating options when stuck, reframing the story you tell about your own situation. People strong here are hard to trap, because they can always imagine another door.",
    trio: { partners: ["Volitional", "Aesthetic"], emergent: "The shipping artist: generates, refines, and — critically — finishes. Together they forge a body of work instead of a drawer of beginnings." },
    weakCluster: { partners: ["Strategic", "Entrepreneurial", "Humor"], failure: "The rut cluster: no new options generated, no ventures imagined, no lightness to loosen the grip — a life re-running last year on schedule." },
    controlling: "Dominant-weak, it starves the cluster of alternatives: every other line optimizes the existing path brilliantly, and nobody ever asks whether there's a better path two feet to the left." },
  Rhetorical: {
    selfReg: "Inward, rhetoric is the story you sell yourself: the framing that turns a setback into data or into doom. Self-persuasion is the most-used persuasion in any life — this line decides if you're any good at it.",
    trio: { partners: ["Logical", "Emotional"], emergent: "The complete persuader: sound arguments, felt delivery, real reading of what this audience needs. Together: influence that works on smart people — because it respects them." },
    weakCluster: { partners: ["Linguistic", "Interpersonal", "Leadership"], failure: "The uninfluential cluster — and here's the brutal arithmetic: with persuasion weak, you cannot recruit, cannot fundraise, cannot build a team. Every gift you have works alone, forever." },
    controlling: "As the controlling weakness it caps the size of everything: whatever the other lines can build solo is the maximum, because nothing that requires convincing a second human ever happens." },
  Leadership: {
    selfReg: "Inward, leadership is self-command in front of witnesses: being the least anxious person in the room ON PURPOSE, because your state is contagious and you know it. It's regulation with an audience.",
    trio: { partners: ["Interpersonal", "Moral"], emergent: "The leader people keep: reads individuals, holds the standard, carries the room. Together they forge followership that survives hard seasons — loyalty, not compliance." },
    weakCluster: { partners: ["Rhetorical", "Emotional", "Interpersonal"], failure: "The reluctant-authority cluster: rooms that need direction don't get it, teams form around whoever spoke first, and the best thinking in the building stays advisory forever." },
    controlling: "Dominant-weak, it decapitates group efforts the other lines could have led: projects stall at committee, crises find no owner, and your strengths report to whoever was willing to stand up." },
  Mechanical: {
    selfReg: "Inward, the mechanical line is respect for how things actually work — including your own routines and tools. Its self-regulation gift is maintenance: the unglamorous servicing of systems before they fail.",
    trio: { partners: ["Spatial", "Systemic"], emergent: "The master builder: holds the picture, knows the parts, sees the system. Together: the capacity to make physical reality do what you designed." },
    weakCluster: { partners: ["Spatial", "Financial", "Naturalist"], failure: "The everything-breaks cluster: tools misused, systems unmaintained, costs of neglect compounding quietly — a life taxed by preventable failures." },
    controlling: "As the controlling weakness it makes the cluster dependent: every physical problem becomes a purchase or a wait, and the other lines' plans keep snagging on hardware nobody can fix." },
  "Pattern-Recognition": {
    selfReg: "Inward, this is recognizing your OWN reruns: the relationship pattern, the quitting pattern, the every-November pattern. Self-control without pattern-sight is fighting each episode as if it were new.",
    trio: { partners: ["Financial", "Strategic"], emergent: "The cycle-rider: spots the pattern early, prices it, positions for it. Together they forge foresight you can retire on." },
    weakCluster: { partners: ["Naturalist", "Meta-Cognitive", "Street Smarts"], failure: "The groundhog-day cluster: nothing observed, nothing connected, nothing learned — the same ambush working every year at the same corner." },
    controlling: "Dominant-weak, it condemns the cluster to first-time reactions forever: every other line responds to each event fresh, at full cost, because nobody recognized the sequel." },
  "Social-Perceptual": {
    selfReg: "Inward, this line is reading your own reception: noticing in real time how you're landing, and adjusting without collapsing into people-pleasing. It's the difference between self-awareness and self-consciousness.",
    trio: { partners: ["Street Smarts", "Seduction"], emergent: "The room-owner: reads the field, reads the players, and draws them in. Together: social gravity — presence that reorganizes a room without a word." },
    weakCluster: { partners: ["Interpersonal", "Humor", "Adversarial"], failure: "The oblivious cluster: cues missed, jokes mistimed, predators unnoticed — social reality happening to you instead of with you." },
    controlling: "As the controlling weakness it blindfolds the cluster in public: every other line performs into a room it cannot see, and the feedback everyone else is reading never arrives." },
  Financial: {
    selfReg: "Inward, the financial line is impulse-control with a currency: the felt difference between wanting and affording, spending and deploying. It's self-regulation you can audit in a bank statement.",
    trio: { partners: ["Mathematical", "Entrepreneurial"], emergent: "The wealth engine: sizes the numbers, spots the venture, manages the fuel. Together they forge capital that compounds instead of income that evaporates." },
    weakCluster: { partners: ["Mathematical", "Volitional", "Adversarial"], failure: "The always-broke cluster: magnitudes unfelt, impulses unchecked, sharks undetected — any income level, same empty account." },
    controlling: "As the dominant weakness it bleeds every other line's winnings: careers earn, talents produce, and the money still disappears — because the line that keeps score was never trained. This is how five-million-dollar skills end up with nothing to show." },
  Humor: {
    selfReg: "Inward, humor is pressure-release and perspective: the trained ability to find the absurd angle on your own catastrophe and get your executive function back. It's emotional regulation's fastest tool.",
    trio: { partners: ["Social-Perceptual", "Rhetorical"], emergent: "The disarmer: reads the room, times the line, lands the point wrapped in the laugh. Together: persuasion that gets under armor — and status that never had to be claimed." },
    weakCluster: { partners: ["Emotional", "Social-Perceptual", "Seduction"], failure: "The heavy-presence cluster: everything lands as pressure, tension has no release valve, and rooms quietly exhale when you leave." },
    controlling: "Dominant-weak, it removes the cluster's shock absorbers: every stress arrives at full weight, every conflict escalates, and the other lines grind without the lubricant that makes people WANT to work with you." },
  Parenting: {
    selfReg: "Inward, the parenting line is regulation under provocation by someone you love: staying the adult when a small person — or any person — is pressing the exact button they know is yours. It's the black belt of self-control.",
    trio: { partners: ["Emotional", "Moral"], emergent: "The generational anchor: regulated, principled, attuned. Together they forge secure attachment — the single inheritance that outperforms money in every longitudinal study." },
    weakCluster: { partners: ["Emotional", "Volitional", "Intrapersonal"], failure: "The cycle-repeater cluster: triggered by your own child's stage, inconsistent under fatigue, unexamined about why — your parents' worst moments, re-performed in your voice." },
    controlling: "As the controlling weakness it exports the cluster's dysfunction forward a generation: every other strength you have gets remembered less than the moments this line failed." },
  Seduction: {
    selfReg: "Inward, this line is self-presentation with honesty: knowing your effect, choosing it deliberately, and staying yourself while doing it. Weak here isn't unattractive — it's unaware of the signal being sent.",
    trio: { partners: ["Social-Perceptual", "Aesthetic"], emergent: "The presence: reads desire, curates the signal, delivers the moment. Together: magnetism that feels like fate to the person on the other end." },
    weakCluster: { partners: ["Social-Perceptual", "Humor", "Interpersonal"], failure: "The invisible cluster: no read, no play, no pull — years of 'we're just friends' and interviews that never call back, for reasons nobody will say out loud." },
    controlling: "Dominant-weak, it mutes the cluster's broadcast: competence without attraction, offers without appeal — the world keeps choosing louder signals over better substance." },
  "Community-Founding": {
    selfReg: "Inward, this line is stewardship of your own belonging: noticing when you're isolating, investing in your people BEFORE the bad season, showing up when the streak is broken. It's self-care that looks like other people.",
    trio: { partners: ["Leadership", "Interpersonal"], emergent: "The village-builder: gathers, leads, and binds. Together they forge institutions — things with members, that outlive their founder's attention." },
    weakCluster: { partners: ["Interpersonal", "Existential", "Parenting"], failure: "The alone-at-the-top cluster: success without witnesses, holidays without tables, crises without cavalry — the loneliness that compounding money cannot buy out of." },
    controlling: "As the controlling weakness it strands every other line on an island: no network to multiply the wins, no bench for the hard years, and a life's work with no one to hand it to." },
  "Street Smarts": {
    selfReg: "Inward, street smarts is self-protection as habit: reading your own exposure — where you're soft, who knows it, what you're signaling — and tightening it without paranoia. It's the self-awareness that survives contact.",
    trio: { partners: ["Adversarial", "Social-Perceptual"], emergent: "The operator: reads the street, reads the players, defends the flanks. Together: the capacity to win in unstructured environments where the rules are whatever's happening." },
    weakCluster: { partners: ["Adversarial", "Financial", "Meta-Cognitive"], failure: "The sheltered cluster: dangers theoretical until they're personal, deals taken at face value, tuition paid to every hustler in range." },
    controlling: "As the dominant weakness it makes the cluster's success dangerous: the more the other lines win, the bigger the target — and the softer the defenses carrying it." },
};

export function dynamicsFor(line: string): LineDynamics | undefined {
  return LINE_DYNAMICS[line];
}
