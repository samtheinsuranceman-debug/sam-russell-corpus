// ============================================================
// AQAL INTELLIGENCE CLUSTERS
// 15 Strength Clusters + 15 Growth Edge (Weakness) Clusters
// Each maps to combinations of the 22 axes
// ============================================================

export interface ClusterDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  axes: string[]; // which of the 22 axes contribute
  imageKey: string; // maps to pre-generated image
  color: string; // oklch accent color
  emoji: string;
}

// ============================================================
// STRENGTH CLUSTERS — What makes someone rare and powerful
// ============================================================
export const STRENGTH_CLUSTERS: ClusterDefinition[] = [
  {
    id: "visionary-architect",
    name: "The Visionary Architect",
    shortName: "Visionary",
    description: "You see systems others can't perceive. Your mind builds cathedrals of possibility — connecting ideas across domains into coherent futures that feel inevitable once you describe them.",
    axes: ["cognitive-complexity", "systems-thinking", "creative-synthesis"],
    imageKey: "strength-visionary-architect",
    color: "oklch(0.80 0.18 270)",
    emoji: "🏛️"
  },
  {
    id: "empathic-resonator",
    name: "The Empathic Resonator",
    shortName: "Resonator",
    description: "You feel the room before anyone speaks. Your emotional intelligence isn't learned — it's lived. People feel understood in your presence without knowing why.",
    axes: ["emotional-intelligence", "interpersonal-depth", "somatic-awareness"],
    imageKey: "strength-empathic-resonator",
    color: "oklch(0.80 0.15 30)",
    emoji: "💫"
  },
  {
    id: "sovereign-will",
    name: "The Sovereign Will",
    shortName: "Sovereign",
    description: "When you decide, reality reorganizes. Your willpower isn't brute force — it's a quiet certainty that bends timelines. Others follow because your conviction is contagious.",
    axes: ["self-determination", "resilience", "executive-function"],
    imageKey: "strength-sovereign-will",
    color: "oklch(0.85 0.20 85)",
    emoji: "👑"
  },
  {
    id: "pattern-oracle",
    name: "The Pattern Oracle",
    shortName: "Oracle",
    description: "You detect signal in noise that others dismiss as chaos. Patterns reveal themselves to you — in markets, in people, in nature — as if the universe whispers its structure directly to you.",
    axes: ["pattern-recognition", "analytical-depth", "intuitive-synthesis"],
    imageKey: "strength-pattern-oracle",
    color: "oklch(0.75 0.20 200)",
    emoji: "🔮"
  },
  {
    id: "creative-alchemist",
    name: "The Creative Alchemist",
    shortName: "Alchemist",
    description: "You transmute the ordinary into the extraordinary. Where others see raw materials, you see masterpieces waiting to emerge. Your creativity isn't decoration — it's transformation.",
    axes: ["creative-synthesis", "aesthetic-intelligence", "divergent-thinking"],
    imageKey: "strength-creative-alchemist",
    color: "oklch(0.82 0.18 320)",
    emoji: "⚗️"
  },
  {
    id: "relational-weaver",
    name: "The Relational Weaver",
    shortName: "Weaver",
    description: "You build bridges between worlds. Your gift is seeing the invisible threads connecting people and pulling them together into communities that thrive. Networks grow organically around you.",
    axes: ["interpersonal-depth", "social-intelligence", "collaborative-capacity"],
    imageKey: "strength-relational-weaver",
    color: "oklch(0.80 0.15 160)",
    emoji: "🕸️"
  },
  {
    id: "embodied-warrior",
    name: "The Embodied Warrior",
    shortName: "Warrior",
    description: "Your body is your instrument and your temple. Physical intelligence flows through you — kinesthetic genius that makes the difficult look effortless and the impossible look inevitable.",
    axes: ["somatic-awareness", "physical-intelligence", "resilience"],
    imageKey: "strength-embodied-warrior",
    color: "oklch(0.78 0.18 25)",
    emoji: "⚔️"
  },
  {
    id: "truth-speaker",
    name: "The Truth Speaker",
    shortName: "Truth Speaker",
    description: "You say what others are afraid to think. Your courage isn't recklessness — it's the moral clarity to name reality when everyone else is performing comfort. Truth flows through you like water.",
    axes: ["moral-reasoning", "self-determination", "communicative-power"],
    imageKey: "strength-truth-speaker",
    color: "oklch(0.90 0.12 210)",
    emoji: "⚡"
  },
  {
    id: "depth-navigator",
    name: "The Depth Navigator",
    shortName: "Navigator",
    description: "You go where others won't — into the shadow, the unconscious, the unspoken. Your willingness to explore psychological depth gives you access to wisdom that surface-dwellers never find.",
    axes: ["introspective-depth", "psychological-integration", "shadow-work"],
    imageKey: "strength-depth-navigator",
    color: "oklch(0.70 0.15 280)",
    emoji: "🌊"
  },
  {
    id: "adaptive-genius",
    name: "The Adaptive Genius",
    shortName: "Adaptive",
    description: "You thrive in chaos. Where others freeze, you flow. Your nervous system is calibrated for rapid recalibration — turning disruption into opportunity with a speed that looks like prescience.",
    axes: ["adaptability", "stress-resilience", "cognitive-flexibility"],
    imageKey: "strength-adaptive-genius",
    color: "oklch(0.82 0.16 140)",
    emoji: "🌀"
  },
  {
    id: "legacy-builder",
    name: "The Legacy Builder",
    shortName: "Legacy",
    description: "You think in decades while others think in days. Your orientation toward lasting impact means everything you build is designed to outlive you — institutions, families, ideas that compound across generations.",
    axes: ["temporal-intelligence", "strategic-thinking", "generative-capacity"],
    imageKey: "strength-legacy-builder",
    color: "oklch(0.80 0.14 50)",
    emoji: "🌳"
  },
  {
    id: "sacred-witness",
    name: "The Sacred Witness",
    shortName: "Witness",
    description: "Your presence is medicine. You hold space with such depth that others transform simply by being seen by you. Your attention is a gift that heals — not through doing, but through being.",
    axes: ["contemplative-depth", "presence", "emotional-intelligence"],
    imageKey: "strength-sacred-witness",
    color: "oklch(0.85 0.10 60)",
    emoji: "🕊️"
  },
  {
    id: "linguistic-architect",
    name: "The Linguistic Architect",
    shortName: "Wordsmith",
    description: "Language is your superpower. You don't just communicate — you construct reality with words. Your speech patterns reveal a mind that thinks in metaphor, precision, and music simultaneously.",
    axes: ["linguistic-intelligence", "communicative-power", "narrative-capacity"],
    imageKey: "strength-linguistic-architect",
    color: "oklch(0.82 0.14 240)",
    emoji: "✍️"
  },
  {
    id: "integrative-sage",
    name: "The Integrative Sage",
    shortName: "Sage",
    description: "You hold paradox without breaking. Where others see contradictions, you see complementarities. Your mind naturally synthesizes across domains — science and spirit, logic and love, ancient and emerging.",
    axes: ["integrative-capacity", "cognitive-complexity", "wisdom-synthesis"],
    imageKey: "strength-integrative-sage",
    color: "oklch(0.78 0.12 300)",
    emoji: "☯️"
  },
  {
    id: "catalytic-presence",
    name: "The Catalytic Presence",
    shortName: "Catalyst",
    description: "Things happen when you enter a room. You don't just participate in systems — you accelerate them. Your energy is contagious, your enthusiasm is rocket fuel, and your belief in others becomes self-fulfilling prophecy.",
    axes: ["energetic-capacity", "leadership-presence", "motivational-power"],
    imageKey: "strength-catalytic-presence",
    color: "oklch(0.88 0.20 70)",
    emoji: "🔥"
  }
];

// ============================================================
// GROWTH EDGE CLUSTERS — Reframed weaknesses as developmental opportunities
// ============================================================
export const GROWTH_CLUSTERS: ClusterDefinition[] = [
  {
    id: "scattered-brilliance",
    name: "Scattered Brilliance",
    shortName: "Scattered",
    description: "Your mind moves faster than any single container can hold. The challenge isn't capability — it's channeling. Your growth edge is learning to focus your fire without dimming it.",
    axes: ["executive-function", "sustained-attention", "completion-drive"],
    imageKey: "growth-scattered-brilliance",
    color: "oklch(0.70 0.12 200)",
    emoji: "💨"
  },
  {
    id: "armored-heart",
    name: "The Armored Heart",
    shortName: "Armored",
    description: "You built walls that once saved you. Now they keep out what you need most. Your growth edge is learning that vulnerability isn't weakness — it's the doorway to the connection your soul craves.",
    axes: ["emotional-openness", "vulnerability-capacity", "attachment-security"],
    imageKey: "growth-armored-heart",
    color: "oklch(0.65 0.10 240)",
    emoji: "🛡️"
  },
  {
    id: "perfectionist-prison",
    name: "The Perfectionist Prison",
    shortName: "Perfectionist",
    description: "Your standards are so high they've become a cage. Nothing is ever good enough — especially you. Your growth edge is learning that done is sacred, that imperfection is human, that 'good enough' can be liberation.",
    axes: ["self-compassion", "completion-drive", "adaptive-standards"],
    imageKey: "growth-perfectionist-prison",
    color: "oklch(0.68 0.12 280)",
    emoji: "🔒"
  },
  {
    id: "isolation-fortress",
    name: "The Isolation Fortress",
    shortName: "Isolated",
    description: "You've confused independence with isolation. Your self-sufficiency is real — but so is your loneliness. Your growth edge is learning that needing others isn't weakness; it's the design specification of being human.",
    axes: ["interpersonal-depth", "collaborative-capacity", "help-seeking"],
    imageKey: "growth-isolation-fortress",
    color: "oklch(0.60 0.08 220)",
    emoji: "🏔️"
  },
  {
    id: "body-disconnect",
    name: "The Disembodied Mind",
    shortName: "Disembodied",
    description: "You live from the neck up. Your body is a vehicle you forgot how to drive. Your growth edge is remembering that intelligence lives in your muscles, your gut, your breath — not just your thoughts.",
    axes: ["somatic-awareness", "physical-intelligence", "embodied-presence"],
    imageKey: "growth-body-disconnect",
    color: "oklch(0.65 0.10 180)",
    emoji: "🧠"
  },
  {
    id: "conflict-avoidance",
    name: "The Peace Keeper's Burden",
    shortName: "Peace Keeper",
    description: "You'd rather swallow glass than have a difficult conversation. Your harmony-seeking has become self-betrayal. Your growth edge is learning that healthy conflict is intimacy, not war.",
    axes: ["assertiveness", "boundary-setting", "conflict-capacity"],
    imageKey: "growth-conflict-avoidance",
    color: "oklch(0.68 0.08 160)",
    emoji: "🕊️"
  },
  {
    id: "emotional-flooding",
    name: "The Emotional Tsunami",
    shortName: "Flooded",
    description: "You feel everything at maximum volume. Your sensitivity is a gift — but without regulation, it becomes overwhelm. Your growth edge is building the container that can hold your oceanic emotional life.",
    axes: ["emotional-regulation", "stress-resilience", "grounding-capacity"],
    imageKey: "growth-emotional-flooding",
    color: "oklch(0.65 0.14 30)",
    emoji: "🌊"
  },
  {
    id: "analysis-paralysis",
    name: "The Infinite Loop",
    shortName: "Paralyzed",
    description: "You can see every angle — which means you can't choose any. Your analytical power has become a prison of indecision. Your growth edge is learning that imperfect action teaches more than perfect planning.",
    axes: ["decisiveness", "action-bias", "risk-tolerance"],
    imageKey: "growth-analysis-paralysis",
    color: "oklch(0.62 0.10 250)",
    emoji: "♾️"
  },
  {
    id: "shadow-denial",
    name: "The Unlived Shadow",
    shortName: "Shadow",
    description: "There are parts of you that you've exiled. Anger, desire, ambition, grief — locked away where they can't embarrass you. Your growth edge is integrating what you've disowned before it integrates you.",
    axes: ["shadow-work", "psychological-integration", "self-honesty"],
    imageKey: "growth-shadow-denial",
    color: "oklch(0.55 0.12 300)",
    emoji: "🌑"
  },
  {
    id: "purpose-drift",
    name: "The Purposeless Current",
    shortName: "Drifting",
    description: "You're competent at many things but called to nothing. The absence of a north star makes every direction feel equally meaningless. Your growth edge is listening for the whisper beneath the noise.",
    axes: ["purpose-clarity", "values-alignment", "directional-commitment"],
    imageKey: "growth-purpose-drift",
    color: "oklch(0.60 0.06 200)",
    emoji: "🧭"
  },
  {
    id: "authority-wound",
    name: "The Authority Wound",
    shortName: "Authority",
    description: "You either rebel against all structure or collapse before it. Your relationship with power is unresolved. Your growth edge is learning to hold authority — your own and others' — without submission or defiance.",
    axes: ["self-determination", "healthy-authority", "power-relationship"],
    imageKey: "growth-authority-wound",
    color: "oklch(0.63 0.10 20)",
    emoji: "⚖️"
  },
  {
    id: "intimacy-avoidance",
    name: "The Intimacy Horizon",
    shortName: "Distant",
    description: "You can be charming, warm, even magnetic — but no one gets past the lobby. True intimacy terrifies you because it requires being known. Your growth edge is letting someone see you without your performance.",
    axes: ["vulnerability-capacity", "attachment-security", "relational-depth"],
    imageKey: "growth-intimacy-avoidance",
    color: "oklch(0.65 0.12 340)",
    emoji: "🚪"
  },
  {
    id: "burnout-pattern",
    name: "The Burnout Cycle",
    shortName: "Burnout",
    description: "You sprint until you collapse, recover just enough to sprint again. Your relationship with rest is broken. Your growth edge is learning that sustainable power requires rhythm — not just intensity.",
    axes: ["self-care", "pacing-intelligence", "recovery-capacity"],
    imageKey: "growth-burnout-pattern",
    color: "oklch(0.60 0.14 50)",
    emoji: "🔋"
  },
  {
    id: "imposter-complex",
    name: "The Imposter Architecture",
    shortName: "Imposter",
    description: "No amount of evidence convinces you that you belong. Every achievement feels like a fluke, every compliment like a misunderstanding. Your growth edge is internalizing what everyone else already sees.",
    axes: ["self-worth", "achievement-integration", "belonging-capacity"],
    imageKey: "growth-imposter-complex",
    color: "oklch(0.62 0.08 260)",
    emoji: "🎭"
  },
  {
    id: "pleasure-numbing",
    name: "The Numbed Senses",
    shortName: "Numbed",
    description: "You've forgotten how to feel good without a substance, a screen, or a distraction. Joy has become something you chase rather than something you inhabit. Your growth edge is re-learning the art of simple presence.",
    axes: ["pleasure-capacity", "sensory-aliveness", "present-moment"],
    imageKey: "growth-pleasure-numbing",
    color: "oklch(0.58 0.08 180)",
    emoji: "🌫️"
  }
];

// ============================================================
// CLUSTER MATCHING — Maps axis scores to clusters
// ============================================================
export function identifyStrengthClusters(scores: Record<string, number>): ClusterDefinition[] {
  // Score each cluster based on how high the user scores on its constituent axes
  const scored = STRENGTH_CLUSTERS.map(cluster => {
    const axisScores = cluster.axes.map(axis => scores[axis] || 0);
    const avg = axisScores.reduce((a, b) => a + b, 0) / axisScores.length;
    return { cluster, score: avg };
  });
  
  // Return top 3-5 clusters
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).filter(s => s.score > 0.6).map(s => s.cluster);
}

export function identifyGrowthClusters(scores: Record<string, number>): ClusterDefinition[] {
  // Score each cluster based on how LOW the user scores on its constituent axes
  const scored = GROWTH_CLUSTERS.map(cluster => {
    const axisScores = cluster.axes.map(axis => scores[axis] || 0.5);
    const avg = axisScores.reduce((a, b) => a + b, 0) / axisScores.length;
    return { cluster, score: 1 - avg }; // invert: low scores = high match
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).filter(s => s.score > 0.4).map(s => s.cluster);
}
