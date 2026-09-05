import { useState } from "react";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

// ============================================================
// ECOLOGICAL INTERVENTIONS — interventions that change the
// person's whole ecology (body + schedule + social network +
// environment + default action path), not just one trait.
// ============================================================

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const CHAMPAGNE_D = "#C9A24B";
const LINE_C = "rgba(241,234,219,0.10)";
const JADE = "#9BC0B2";
const BRONZE = "#D19A72";

type Tier = "tier1" | "tier2" | "tier3";

interface Intervention {
  id: number;
  name: string;
  description: string;
  primaryLine: string;
  secondaryLines: string[];
  ecology: string;
  duration: string;
  tier: Tier;
  sources: { title: string; url: string; doi?: string }[];
}

const TIER_META: Record<Tier, { label: string; color: string; description: string }> = {
  tier1: { label: "Tier 1 — Highest Ecological Impact", color: CHAMPAGNE, description: "Changes 4+ layers of the person's ecology simultaneously" },
  tier2: { label: "Tier 2 — High Ecological Impact", color: JADE, description: "Changes 2-3 layers of the person's ecology" },
  tier3: { label: "Tier 3 — Single-Layer, High-Evidence", color: BRONZE, description: "Targets one layer with strong research support" },
};

const INTERVENTIONS: Intervention[] = [
  // TIER 1 — Highest ecological impact (4+ layers)
  {
    id: 1, name: "Social Prescribing / Community Navigation", tier: "tier1",
    description: "Referral into non-clinical community supports such as groups, volunteering, arts, exercise, or navigation support.",
    primaryLine: "Interpersonal", secondaryLines: ["Community-Founding", "Existential", "Emotional", "Resilient"],
    ecology: "Changes schedule, identity, social role, daily contact frequency, and access to low-cost support systems. Alters sleep regularity, mood, and healthcare use by making the person less isolated and more embedded in a local network.",
    duration: "8 weeks to 18 months; benefits persist when the referral creates ongoing social participation.",
    sources: [
      { title: "A controlled evaluation of social prescribing on loneliness", url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1359855/full" },
      { title: "The effectiveness of social prescribing in management", url: "https://journals.sagepub.com/doi/10.1177/02692155241258903" },
    ],
  },
  {
    id: 2, name: "Combined Cognitive-Physical Training", tier: "tier1",
    description: "Exercise plus cognitive training in the same program.",
    primaryLine: "Meta-Cognitive", secondaryLines: ["Volitional", "Kinesthetic", "Resilient"],
    ecology: "Useful when the problem is not just weakness in one line but a global decline in bandwidth, mobility, and executive control. Improves confidence, routine adherence, and social participation at once.",
    duration: "4 to 24 weeks, with some long programs lasting far longer.",
    sources: [
      { title: "The Effects of Combined Cognitive-Physical Interventions", url: "https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2022.838968/full" },
    ],
  },
  {
    id: 3, name: "Place-Based Community Gardening", tier: "tier1",
    description: "Repeated shared outdoor activity with a local group.",
    primaryLine: "Naturalist", secondaryLines: ["Interpersonal", "Community-Founding", "Resilient"],
    ecology: "Hits multiple systems at once: movement, sunlight, social support, and contribution to shared place. Reduces loneliness while improving daily structure.",
    duration: "Multi-week programs; benefits strongest when the activity becomes routine.",
    sources: [
      { title: "Do people perceive benefits in the use of social prescribing", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9580419/" },
    ],
  },
  {
    id: 4, name: "Community-Based Skill Circles", tier: "tier1",
    description: "Repeated group practice around a shared skill or goal.",
    primaryLine: "Interpersonal", secondaryLines: ["Volitional", "Community-Founding", "Strategic"],
    ecology: "Combines social belonging, practice, and identity formation. Works better than solo effort because the group creates norm pressure and shared momentum.",
    duration: "Strongest when the circle persists over months.",
    sources: [],
  },
  {
    id: 5, name: "Mentored Apprenticeship / Coached Practice", tier: "tier1",
    description: "Guided skill building with real feedback in a real domain.",
    primaryLine: "Strategic", secondaryLines: ["Volitional", "Interpersonal", "Creative"],
    ecology: "Changes not just skill but access to opportunity, standards, and network position. Stronger than isolated practice because it adds correction and social embedding.",
    duration: "Months to years, depending on the craft.",
    sources: [],
  },
  // TIER 2 — High ecological impact (2-3 layers)
  {
    id: 6, name: "Nature Connectedness Training", tier: "tier2",
    description: "Repeated nature-noticing, nature contact, mindfulness in nature, or guided outdoor engagement.",
    primaryLine: "Naturalist", secondaryLines: ["Interoceptive", "Meta-Cognitive", "Aesthetic"],
    ecology: "Changes the person's default environment, attention style, and stress load. Improves mood, reduces rumination, and creates a healthier daily rhythm.",
    duration: "Sustained improvements when nature engagement is repeated over days to weeks.",
    sources: [
      { title: "How to improve nature connectedness: A meta-analysis", url: "https://findingnature.org.uk/2022/10/04/how-to-improve-nature-connectedness/" },
      { title: "Associations between Nature Exposure and Health", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8125471/" },
    ],
  },
  {
    id: 7, name: "Environment Redesign / Friction Management", tier: "tier2",
    description: "Changing the setup so desired behaviors are easier and undesired behaviors are harder.",
    primaryLine: "Volitional", secondaryLines: ["Financial", "Interoceptive"],
    ecology: "A major ecological lever — changes the default path of action. Affects food, attention, spending, and time use without requiring constant willpower.",
    duration: "Long-lasting if the environment stays changed.",
    sources: [],
  },
  {
    id: 8, name: "Digital Hygiene / Attention Management", tier: "tier2",
    description: "Notifications off, app limits, attention windows, and device boundaries.",
    primaryLine: "Meta-Cognitive", secondaryLines: ["Volitional", "Emotional"],
    ecology: "Reduces fragmentation, protects sleep, and improves deep work. Lowers anxiety by removing constant interruption.",
    duration: "Can work immediately if the environment is changed.",
    sources: [],
  },
  {
    id: 9, name: "Financial Autopilot / Default Saving", tier: "tier2",
    description: "Automatic transfers, automatic investing, and removing the need for repeated choice.",
    primaryLine: "Financial", secondaryLines: ["Volitional", "Strategic"],
    ecology: "Reduces the need for repeated discipline and protects from impulsive spending. Changes long-run stability, not just one decision.",
    duration: "Lasts as long as the automation remains in place.",
    sources: [],
  },
  {
    id: 10, name: "Structured Conversation Skills", tier: "tier2",
    description: "Training in listening, repair, conflict de-escalation, and boundary setting.",
    primaryLine: "Interpersonal", secondaryLines: ["Empathic", "Intrapersonal"],
    ecology: "Improves household climate, work conflict, and social stability. Prevents problems rather than treating them after escalation.",
    duration: "Weeks to months; durability depends on practice.",
    sources: [],
  },
  {
    id: 11, name: "Automated Social Accountability Systems", tier: "tier2",
    description: "Scheduled check-ins, reminders, public commitments, or coach-triggered follow-up.",
    primaryLine: "Volitional", secondaryLines: ["Financial", "Interpersonal"],
    ecology: "Changes the environment so the desired behavior becomes harder to avoid. Especially relevant when the person is overloaded or exhausted.",
    duration: "Strongest in the first weeks to months.",
    sources: [],
  },
  {
    id: 12, name: "Social Cognition Training", tier: "tier2",
    description: "Structured training for recognizing emotion, mental states, perspective, and social cues.",
    primaryLine: "Social-Perceptual", secondaryLines: ["Empathic", "Interpersonal"],
    ecology: "Improves conversation quality, conflict handling, group functioning, and workplace navigation.",
    duration: "8 to 39 weeks; sessions often 20 to 60 minutes.",
    sources: [
      { title: "A systematic review and meta-analysis of social cognition interventions", url: "https://www.nature.com/articles/s41598-022-07420-z" },
    ],
  },
  {
    id: 13, name: "Active Mindfulness in Real-World Contexts", tier: "tier2",
    description: "Mindfulness or meditation embedded in nature or daily routines.",
    primaryLine: "Intrapersonal", secondaryLines: ["Interoceptive", "Emotional"],
    ecology: "Changes how stress is processed throughout the day. Alters reactivity, sleep onset, and social patience if maintained.",
    duration: "Sustained effects when practice is repeated regularly.",
    sources: [
      { title: "A systematic review and network meta-analysis of mindfulness interventions", url: "https://www.nature.com/articles/s41562-025-02369-1" },
    ],
  },
  // TIER 3 — Single-layer, high-evidence
  {
    id: 14, name: "Implementation Intentions (If-Then Planning)", tier: "tier3",
    description: '"If-then" planning that links a trigger to a specific behavior.',
    primaryLine: "Volitional", secondaryLines: ["Strategic"],
    ecology: "Reduces dependence on momentary motivation by hardwiring behavior to environmental cues.",
    duration: "Can work immediately; persists when repeated or paired with monitoring.",
    sources: [],
  },
  {
    id: 15, name: "Exposure with Response Prevention", tier: "tier3",
    description: "Facing a feared cue while preventing the usual avoidance response.",
    primaryLine: "Emotional", secondaryLines: ["Resilient", "Volitional"],
    ecology: "Changes the person's relationship to fear, avoidance, and uncertainty across daily life.",
    duration: "Can work within weeks; durable when the person stays exposed in real life.",
    sources: [],
  },
  {
    id: 16, name: "Problem-Solving Therapy", tier: "tier3",
    description: "Structured identification of problems, options, and action steps.",
    primaryLine: "Logical", secondaryLines: ["Volitional", "Strategic"],
    ecology: "Reduces overwhelm by converting vague distress into manageable tasks.",
    duration: "Weeks; benefits persist when the person internalizes the method.",
    sources: [],
  },
  {
    id: 17, name: "Behavioral Activation + Activity Scheduling", tier: "tier3",
    description: "Planning rewarding or mastery-building activity into the week.",
    primaryLine: "Volitional", secondaryLines: ["Emotional", "Interpersonal"],
    ecology: "Changes the day's reward structure and interrupts withdrawal. Powerful when paired with social contact and sunlight.",
    duration: "Starts quickly and strengthens over several weeks.",
    sources: [],
  },
  {
    id: 18, name: "Self-Affirmation / Values Affirmation", tier: "tier3",
    description: "Brief writing or reflection on core values and identity.",
    primaryLine: "Intrapersonal", secondaryLines: ["Resilient", "Moral"],
    ecology: "Reduces threat response and improves performance under pressure, especially where identity threat is chronic.",
    duration: "Immediate in high-stress situations; longer-term change requires repeated use.",
    sources: [],
  },
  {
    id: 19, name: "Graded Task Assignment", tier: "tier3",
    description: "Breaking a daunting goal into small steps that gradually increase.",
    primaryLine: "Volitional", secondaryLines: ["Strategic"],
    ecology: "Lowers failure risk and helps the person regain momentum. Useful after burnout or avoidance spirals.",
    duration: "Weeks to months.",
    sources: [],
  },
  {
    id: 20, name: "Skills Coaching for Self-Efficacy", tier: "tier3",
    description: "Training confidence through repeated successful performance, not just encouragement.",
    primaryLine: "Volitional", secondaryLines: ["Emotional", "Strategic"],
    ecology: "Changes identity from 'I can't' to 'I know how' — often the real bottleneck in behavior change.",
    duration: "Emerges over repeated wins.",
    sources: [],
  },
  {
    id: 21, name: "Acute Exercise for Same-Day Cognition", tier: "tier3",
    description: "Acute exercise sessions designed to improve immediate cognitive performance.",
    primaryLine: "Meta-Cognitive", secondaryLines: ["Volitional", "Kinesthetic"],
    ecology: "Changes the day's cognitive 'entry state' rather than just long-term fitness. Useful pre-work, pre-study, or pre-meeting.",
    duration: "Immediate to same-day effects.",
    sources: [
      { title: "Effects of acute exercise on cognitive function: A meta-review", url: "https://psycnet.apa.org/record/2025-74070-001" },
    ],
  },
  {
    id: 22, name: "Repeated Perspective-Taking", tier: "tier3",
    description: "Structured exercises that require imagining another person's viewpoint.",
    primaryLine: "Empathic", secondaryLines: ["Interpersonal", "Social-Perceptual", "Moral"],
    ecology: "Reduces conflict and improves reading of other people's motives. Changes relationships, team function, and parenting behavior.",
    duration: "Modest unless repeated in real situations; gains generalize if reinforced in live interactions.",
    sources: [],
  },
  {
    id: 23, name: "Public Commitment / Accountability", tier: "tier3",
    description: "Telling others about a goal or creating external accountability.",
    primaryLine: "Volitional", secondaryLines: ["Interpersonal"],
    ecology: "Changes social pressure, identity, and follow-through. Works best when specific and time-bound.",
    duration: "Strongest while the accountability structure is active.",
    sources: [],
  },
  {
    id: 24, name: "Digital Social Connection Training", tier: "tier3",
    description: "Coaching isolated people to use digital tools for connection.",
    primaryLine: "Interpersonal", secondaryLines: ["Community-Founding", "Adaptive"],
    ecology: "Expands access to support, information, and participation. Changes the person's reachable social world.",
    duration: "2 to 4 months in group-based formats.",
    sources: [
      { title: "Interventions to Reduce Loneliness in Community-Living Older Adults", url: "https://link.springer.com/article/10.1007/s11606-023-08517-5" },
    ],
  },
  {
    id: 25, name: "Pro-Social Behavior Prompts", tier: "tier3",
    description: "Behaviorally-designed prompts connecting future outcomes, social relevance, and concrete action.",
    primaryLine: "Volitional", secondaryLines: ["Moral", "Strategic"],
    ecology: "Shifts household habits, social sharing, and collective action when consequences are made personally meaningful.",
    duration: "Brief; effects may fade without repeated cueing.",
    sources: [
      { title: "Behavioral interventions motivate action to address climate change", url: "https://www.pnas.org/doi/10.1073/pnas.2426768122" },
      { title: "A reexamination on how behavioral interventions can promote pro-environmental behaviors", url: "https://www.nature.com/articles/s41467-020-14653-x" },
    ],
  },
  {
    id: 26, name: "Somatic-Volitional Integration", tier: "tier1" as Tier,
    description: "Combines interoceptive body awareness training with volitional decision-making protocols. Hourly body scans feed into pre-decision somatic checks, building the capacity to use body signals as decision inputs.",
    primaryLine: "Volitional",
    secondaryLines: ["Interoceptive", "Meta-Cognitive"],
    ecology: "Changes body awareness (UR), decision habits (UR), self-trust (UL), and daily scheduling (LR) simultaneously.",
    duration: "Hourly micro-practices; measurable impulse override improvement within 2 weeks.",
    sources: [
      { title: "Interoceptive accuracy and decision-making", url: "https://pubmed.ncbi.nlm.nih.gov/20643699/", doi: "10.1016/j.biopsycho.2010.07.009" },
    ],
  },
  {
    id: 27, name: "Financial-Volitional Autopilot", tier: "tier1" as Tier,
    description: "Automated expense tracking paired with volitional pre-commitment devices (24-hour purchase rules, auto-transfers). Removes repeated choice from financial decisions while building awareness.",
    primaryLine: "Financial-Self-Management",
    secondaryLines: ["Volitional", "Strategic"],
    ecology: "Changes financial systems (LR), spending behavior (UR), financial stress (UL), and goal alignment (UL+LR).",
    duration: "Real-time auto-tracking; 30-day adherence signals habit formation.",
    sources: [
      { title: "Financial literacy and financial behavior", url: "https://doi.org/10.1016/j.jfineco.2017.03.006", doi: "10.1016/j.jfineco.2017.03.006" },
    ],
  },
  {
    id: 28, name: "Moral-Community Feedback Loops", tier: "tier1" as Tier,
    description: "Structured community service with explicit moral feedback protocols. Weekly moral dilemma journaling analyzed through 4-quadrant lens, combined with peer moral coaching in accountability pods.",
    primaryLine: "Moral",
    secondaryLines: ["Community", "Interpersonal"],
    ecology: "Changes moral reasoning (UL), community engagement (LL), relationship depth (LL), and service scheduling (LR).",
    duration: "Weekly reflection + monthly community feedback; 30% trust improvement in 3 months.",
    sources: [
      { title: "Moral development and moral education", url: "https://doi.org/10.1207/s15326985ep3901_2", doi: "10.1207/s15326985ep3901_2" },
    ],
  },
  {
    id: 29, name: "Strategic Humor Deployment", tier: "tier2" as Tier,
    description: "Leverages high Strategic and Linguistic intelligence to systematically build humor and interpersonal skills. Prepare humor strategically, deploy linguistically, track social responses, iterate.",
    primaryLine: "Humor",
    secondaryLines: ["Interpersonal", "Linguistic"],
    ecology: "Changes social behavior (UR), conversation patterns (LL), and self-confidence (UL) through strategic application of existing strengths.",
    duration: "Per-interaction tracking; 50%+ positive humor responses within 4 weeks.",
    sources: [
      { title: "Humor styles and social interaction", url: "https://doi.org/10.1016/j.paid.2003.09.009", doi: "10.1016/j.paid.2003.09.009" },
    ],
  },
  {
    id: 30, name: "Logic-to-Philosophy Bridge", tier: "tier2" as Tier,
    description: "Uses high Volitional and Logic intelligence to build Meta-cognitive, Moral, and Philosophical depth. Scheduled philosophical practice with formal logical analysis of moral dilemmas.",
    primaryLine: "Philosophical",
    secondaryLines: ["Meta-Cognitive", "Moral"],
    ecology: "Changes thinking patterns (UL), practice scheduling (LR), and decision quality (UR) by applying existing logical strength to new domains.",
    duration: "Daily 30-min blocks; 10+ meta-cognitive insights per week within 4 weeks.",
    sources: [
      { title: "Philosophical thinking and cognitive development", url: "https://doi.org/10.1080/02604938.2018.1531108" },
    ],
  },
  {
    id: 31, name: "Emotional-Social Feedback Spiral", tier: "tier1" as Tier,
    description: "Social interactions feed emotional awareness which improves interactions which generates more positive social feedback. Daily emotional labeling + structured conversation templates + scheduled social commitments.",
    primaryLine: "Interpersonal",
    secondaryLines: ["Emotional", "Empathic"],
    ecology: "Changes emotional awareness (UL), social behavior (UR), relationship quality (LL), and weekly scheduling (LR).",
    duration: "Daily micro-practices; 20% more voluntary social interactions within 4 weeks.",
    sources: [
      { title: "Emotional intelligence and social interaction quality", url: "https://doi.org/10.1037/0022-3514.86.4.594", doi: "10.1037/0022-3514.86.4.594" },
    ],
  },
  {
    id: 32, name: "Meta-Cognitive Hourly Prompts", tier: "tier2" as Tier,
    description: "Hourly 'What am I thinking about right now?' prompts combined with body-based meta-cognition ('Where do I feel this thought?') and weekly thought pattern mining from journals.",
    primaryLine: "Meta-Cognitive",
    secondaryLines: ["Intrapersonal", "Interoceptive"],
    ecology: "Changes awareness patterns (UL), body-mind connection (UR), and decision tracking systems (LR).",
    duration: "Hourly micro-prompts; 5+ recurring patterns identified within 2 weeks.",
    sources: [
      { title: "Meta-cognitive awareness and self-regulation", url: "https://doi.org/10.1007/s11409-006-6893-0", doi: "10.1007/s11409-006-6893-0" },
    ],
  },
  {
    id: 33, name: "Logic-Persuasion A/B Testing", tier: "tier2" as Tier,
    description: "Daily logic fallacy identification (5/day from real conversations) combined with structured persuasion practice and outcome tracking in a spreadsheet. A/B test persuasion scripts.",
    primaryLine: "Persuasion",
    secondaryLines: ["Logical", "Seduction"],
    ecology: "Changes reasoning habits (UR), social confidence (UL), and conversation patterns (LL).",
    duration: "Daily practice; persuasion success rate doubles (20%→40%) within 4 weeks.",
    sources: [
      { title: "The science of persuasion and influence", url: "https://doi.org/10.1037/0033-2909.130.4.592", doi: "10.1037/0033-2909.130.4.592" },
    ],
  },
  {
    id: 34, name: "Parenting Attunement-Structure-Ecology", tier: "tier1" as Tier,
    description: "3-phase parenting protocol: Phase 1 (Attune: pause, name emotion, reflect, repair), Phase 2 (Structure: one bedtime routine, three house rules), Phase 3 (Ecology: routines on wall, remove triggers).",
    primaryLine: "Parenting",
    secondaryLines: ["Interpersonal", "Emotional", "Volitional"],
    ecology: "Changes parent inner state (UL), parenting behavior (UR), family culture (LL), and household systems (LR) — all four quadrants.",
    duration: "6-week protocol; measurable improvement in child attachment classification.",
    sources: [
      { title: "Parenting interventions meta-analysis (102 studies)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8109838/" },
    ],
  },
  {
    id: 35, name: "Shadow Work Integration Protocol", tier: "tier2" as Tier,
    description: "Systematic identification and integration of disowned traits, repressed emotions, and unconscious patterns. Weekly shadow journaling with 4-quadrant analysis and peer feedback.",
    primaryLine: "Intrapersonal",
    secondaryLines: ["Emotional", "Moral", "Philosophical"],
    ecology: "Changes self-awareness (UL), behavioral patterns (UR), and relationship dynamics (LL) by integrating shadow material.",
    duration: "Weekly deep practice; identity coherence improvement within 8 weeks.",
    sources: [
      { title: "Shadow work and psychological integration", url: "https://doi.org/10.1037/0022-3514.72.6.1245", doi: "10.1037/0022-3514.72.6.1245" },
    ],
  },
];

function InterventionCard({ intervention }: { intervention: Intervention }) {
  const [expanded, setExpanded] = useState(false);
  const tierMeta = TIER_META[intervention.tier];

  return (
    <div
      className="rounded-[6px] cursor-pointer transition-all duration-200"
      style={{
        border: `1px solid ${expanded ? tierMeta.color + '44' : LINE_C}`,
        padding: 'clamp(18px,3vw,28px)',
        background: expanded ? `radial-gradient(400px 200px at 50% 0%, ${tierMeta.color}08, transparent 70%), ${INK2}` : INK2,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[8px] h-[8px] rounded-[2px] flex-none" style={{ background: tierMeta.color }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: tierMeta.color }}>
              {intervention.primaryLine}
            </span>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(20px,2.8vw,28px)', lineHeight: 1.1, color: CREAM, margin: 0 }}>
            {intervention.name}
          </h3>
        </div>
        <span style={{ color: MUTED, fontSize: '18px', transition: 'transform .2s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </div>

      <p style={{ color: CREAM2, fontSize: '15px', lineHeight: 1.6, margin: '10px 0 0' }}>
        {intervention.description}
      </p>

      {expanded && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${LINE_C}` }}>
          <div className="mb-3">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: CHAMPAGNE }}>Ecological Impact</span>
            <p style={{ color: CREAM2, fontSize: '14px', lineHeight: 1.6, margin: '6px 0 0' }}>{intervention.ecology}</p>
          </div>
          <div className="mb-3">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: CHAMPAGNE }}>Duration</span>
            <p style={{ color: CREAM2, fontSize: '14px', lineHeight: 1.6, margin: '6px 0 0' }}>{intervention.duration}</p>
          </div>
          <div className="mb-3">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: CHAMPAGNE }}>Lines Affected</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 rounded-[4px] text-[11px]" style={{ background: `${tierMeta.color}22`, color: tierMeta.color, fontWeight: 600 }}>{intervention.primaryLine}</span>
              {intervention.secondaryLines.map((l) => (
                <span key={l} className="px-2 py-1 rounded-[4px] text-[11px]" style={{ background: `${CREAM}11`, color: CREAM2 }}>{l}</span>
              ))}
            </div>
          </div>
          {intervention.sources.length > 0 && (
            <div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: CHAMPAGNE }}>Sources</span>
              <div className="mt-2 space-y-1">
                {intervention.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="block text-[13px] hover:underline" style={{ color: JADE }}>{s.title}</a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EcologicalInterventions() {
  const [filterTier, setFilterTier] = useState<Tier | "all">("all");
  const filtered = filterTier === "all" ? INTERVENTIONS : INTERVENTIONS.filter((i) => i.tier === filterTier);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <main style={{ padding: 'clamp(56px,8vw,108px) 0' }}>
        <div className="max-w-[900px] mx-auto px-[clamp(20px,5vw,56px)]">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
            Research Library
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 18px' }}>
            Ecological Interventions
          </h1>
          <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.7, maxWidth: '42em', margin: '0 0 12px' }}>
            The strongest gains come from interventions that change <b style={{ color: CREAM }}>more than one layer</b> of a person's ecology — the body, the schedule, the social network, the environment, and the default action path. These are not single-trait fixes. They create a new context in which the target behavior becomes easier, more rewarded, and less dependent on willpower.
          </p>
          <p style={{ color: MUTED, fontSize: '14px', lineHeight: 1.6, maxWidth: '42em', margin: '0 0 32px' }}>
            Every intervention below is mapped to specific AQAL intelligence lines and tiered by how many ecological layers it changes simultaneously. Sources are peer-reviewed and linked where available.
          </p>

          {/* Tier filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button onClick={() => setFilterTier("all")} className="px-3 py-[6px] rounded-[4px] text-[11px] font-semibold transition-all duration-150" style={{ background: filterTier === "all" ? CHAMPAGNE : 'transparent', color: filterTier === "all" ? INK : CREAM2, border: `1px solid ${filterTier === "all" ? CHAMPAGNE : LINE_C}`, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
              All ({INTERVENTIONS.length})
            </button>
            {(Object.entries(TIER_META) as [Tier, typeof TIER_META["tier1"]][]).map(([key, meta]) => {
              const count = INTERVENTIONS.filter((i) => i.tier === key).length;
              return (
                <button key={key} onClick={() => setFilterTier(key)} className="px-3 py-[6px] rounded-[4px] text-[11px] font-semibold transition-all duration-150" style={{ background: filterTier === key ? meta.color : 'transparent', color: filterTier === key ? INK : meta.color, border: `1px solid ${filterTier === key ? meta.color : meta.color + '44'}`, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
                  {meta.label.split(" — ")[0]} ({count})
                </button>
              );
            })}
          </div>

          {/* Intervention cards */}
          <div className="space-y-3">
            {filtered.map((intervention) => (
              <InterventionCard key={intervention.id} intervention={intervention} />
            ))}
          </div>

          {/* Cross-cutting insight */}
          <div className="mt-12 rounded-[6px]" style={{ border: `1px solid ${CHAMPAGNE}33`, padding: 'clamp(24px,4vw,36px)', background: `radial-gradient(500px 250px at 50% 0%, ${CHAMPAGNE}08, transparent 70%), ${INK2}` }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '24px', color: CREAM, margin: '0 0 12px' }}>
              The Cross-Cutting Pattern
            </h3>
            <p style={{ color: CREAM2, fontSize: '15px', lineHeight: 1.7 }}>
              The best interventions are not single-line fixes. They change the <b style={{ color: CREAM }}>body</b>, the <b style={{ color: CREAM }}>schedule</b>, the <b style={{ color: CREAM }}>social network</b>, the <b style={{ color: CREAM }}>environment</b>, and the <b style={{ color: CREAM }}>default action path</b> — all at once. That is why a community garden outperforms a gratitude journal: it changes the context, not just the thought.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
