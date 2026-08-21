// ============================================================
// LINE PAIRS — the composition engine behind the 496 pair pages.
// Each line carries a hand-written functional ROLE: what it IS in
// a partnership (noun), how it colors a pairing (adjective), what
// it contributes to any combination (gives), and the arena where
// it earns its keep (arena). Pair pages compose these with both
// lines' encyclopedia + deep-dive content, so every page carries
// real, line-specific substance — not just a merged template.
// ============================================================

export type LineRole = {
  noun: string;   // what this line IS in a pairing
  adj: string;    // how it colors the partner
  gives: string;  // the concrete contribution it makes to any combination
  arena: string;  // where this line earns its keep
};

export const LINE_ROLE: Record<string, LineRole> = {
  Logical:               { noun: "Prover",      adj: "Rigorous",    arena: "arguments, systems, and anywhere being wrong is expensive",
    gives: "airtight inference — the partner line's hunches and reads get stress-tested into claims that survive hostile review" },
  Mathematical:          { noun: "Quant",       adj: "Calibrated",  arena: "money, risk, and anything measured in numbers",
    gives: "magnitude sense — gut calls get priced, risks get sized, and 'it feels big' becomes a number you can act on" },
  Spatial:               { noun: "Architect",   adj: "Structural",  arena: "design, navigation, and systems you can hold as one picture",
    gives: "the whole-system picture — problems the partner line processes in sequence get seen all at once, as a navigable shape" },
  Linguistic:            { noun: "Voice",       adj: "Articulate",  arena: "rooms where the best-said idea wins",
    gives: "delivery — whatever the partner line produces finally travels: named precisely, framed memorably, repeated by strangers" },
  Musical:               { noun: "Ear",         adj: "Attuned",     arena: "timing, tone, and everything that lands or doesn't",
    gives: "rhythm and tone — the partner line's output picks up timing and cadence, the difference between correct and compelling" },
  "Bodily-Kinesthetic":  { noun: "Athlete",     adj: "Embodied",    arena: "everything that must be done, not just decided",
    gives: "execution in the flesh — plans get physical presence, stamina, and the calm that only a trained body broadcasts" },
  Naturalist:            { noun: "Ecologist",   adj: "Organic",     arena: "living systems — gardens, markets, cultures, families",
    gives: "systems-as-organisms reading — the partner line stops forcing mechanical fixes onto things that grow, feed, and season" },
  Interpersonal:         { noun: "Diplomat",    adj: "Connected",   arena: "coalitions, negotiations, and rooms full of agendas",
    gives: "the human network — doors open, allies appear, and the partner line's work reaches people instead of dying in a drawer" },
  Intrapersonal:         { noun: "Cartographer", adj: "Self-Aware", arena: "every decision that routes through the self-model",
    gives: "an accurate self-map — the pairing stops being sabotaged by motives and limits the owner never admitted to having" },
  Existential:           { noun: "Anchor",      adj: "Grounded",    arena: "crisis, loss, and the long game of what it's all for",
    gives: "load-bearing meaning — the partnership survives the storms that dissolve purely tactical strength" },
  Moral:                 { noun: "Compass",     adj: "Principled",  arena: "every situation where the right thing costs something",
    gives: "trustworthiness that compounds — the pairing's power gets deployed in ways people can bank on, which is what makes it durable" },
  Aesthetic:             { noun: "Eye",         adj: "Refined",     arena: "everything customer-facing, worn, built, or presented",
    gives: "discernment of form — whatever the pairing makes doesn't just work, it lands; people choose it and can't say why" },
  Emotional:             { noun: "Regulator",   adj: "Composed",    arena: "high-stakes moments where states leak and decide outcomes",
    gives: "state control — the pairing's capability stays online under pressure instead of vanishing exactly when it's needed" },
  "Meta-Cognitive":      { noun: "Auditor",     adj: "Self-Correcting", arena: "the edge of your own competence, where crashes are born",
    gives: "the dashboard — the pairing knows when its own thinking is degrading, which converts talent from a gamble into an instrument" },
  Volitional:            { noun: "Engine",      adj: "Relentless",  arena: "week six, when the mood that started it all is gone",
    gives: "follow-through — the partner line's gifts stop being potential and start being a track record" },
  Adversarial:           { noun: "Sentinel",    adj: "Shrewd",      arena: "negotiations, competition, and everywhere someone plays against you",
    gives: "threat perception — the pairing stops being the mark; moves against it get seen forming, not explained afterward" },
  Interoceptive:         { noun: "Barometer",   adj: "Attuned",     arena: "the early hours of burnout, illness, and bad calls",
    gives: "the body's early-warning feed — fatigue, stress, and gut-signal reach awareness while they're still information, not damage" },
  Strategic:             { noun: "General",     adj: "Far-Sighted", arena: "the long board — position, sequence, and the decade game",
    gives: "multi-move depth — the partner line's strengths get pointed at positions that matter in ten moves, not just today" },
  Systemic:              { noun: "Engineer",    adj: "Loop-Aware",  arena: "feedback loops, delays, and fixes that usually backfire",
    gives: "second-order sight — the pairing's interventions stop moving the bottleneck and start dissolving it" },
  Entrepreneurial:       { noun: "Founder",     adj: "Opportunistic", arena: "gaps in markets, moments before they're obvious",
    gives: "opportunity perception plus risk digestion — the pairing sees the door in the wall and can afford to walk through it" },
  Creative:              { noun: "Originator",  adj: "Generative",  arena: "blank pages, unsolved problems, and unmade things",
    gives: "genuine novelty — the pairing produces what didn't exist, instead of optimizing what did" },
  Rhetorical:            { noun: "Advocate",    adj: "Persuasive",  arena: "funding rooms, juries, movements, and every pitched idea",
    gives: "the moved room — the partner line's substance gets adopted, funded, and repeated instead of merely being correct" },
  Leadership:            { noun: "Standard-Bearer", adj: "Magnetic", arena: "any group that must move together through uncertainty",
    gives: "followership — the pairing's direction becomes other people's direction, voluntarily" },
  Mechanical:            { noun: "Builder",     adj: "Hands-On",    arena: "the physical world of machines, tools, and things that break",
    gives: "mechanical sympathy — the pairing understands the actual machinery under every system it touches" },
  "Pattern-Recognition": { noun: "Scout",       adj: "Quick-Eyed",  arena: "fast rooms — markets, diagnostics, danger",
    gives: "speed of structure — anomalies and trends jump out in milliseconds, feeding the partner line before others have noticed" },
  "Social-Perceptual":   { noun: "Reader",      adj: "Perceptive",  arena: "the silent traffic of faces, tones, and alliances",
    gives: "the live social feed — micro-signals reach the pairing in real time, while they're still actionable" },
  Financial:             { noun: "Steward",     adj: "Solvent",     arena: "the lifetime arithmetic of money behavior",
    gives: "capital discipline — whatever the pairing earns actually compounds instead of leaking away" },
  Humor:                 { noun: "Alchemist",   adj: "Light-Handed", arena: "tension — rooms, conflicts, and dark seasons",
    gives: "conversion of tension — pressure becomes laughter, threat becomes rapport, and the pairing stays welcome everywhere" },
  Parenting:             { noun: "Cultivator",  adj: "Nurturing",   arena: "the two-decade project of growing humans",
    gives: "developmental attunement — the pairing's strengths transmit to the next generation instead of dying with the owner" },
  Seduction:             { noun: "Magnetizer",  adj: "Compelling",  arena: "attraction — being accurately seen and honestly chosen",
    gives: "calibrated allure — the pairing's real value becomes legible to the people who should choose it" },
  "Community-Founding":  { noun: "Weaver",      adj: "Convening",   arena: "the village — networks that hold when things fall apart",
    gives: "the standing network — everything the pairing builds gets a community around it, and its owner is never structurally alone" },
  "Street Smarts":       { noun: "Operator",    adj: "Unfoolable",  arena: "unstructured environments with unwritten rules",
    gives: "situational immunity — the pairing reads rooms, prices offers, and spots the hustle while credentialed innocents walk in blind" },
};
