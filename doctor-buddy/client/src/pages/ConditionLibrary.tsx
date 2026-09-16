/**
 * Condition Resource Library
 * General educational condition reference with historical diagnostic criteria,
 * commonly discussed care approaches, and PubMed research links. Not individualized advice.
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Brain, Search, BookOpen, Pill, Heart, Users, Shield,
  ChevronRight, ExternalLink, Activity, AlertTriangle,
  Moon, Dumbbell, Leaf, Sparkles, ArrowLeft, Filter
} from "lucide-react";

type Condition = {
  id: string;
  name: string;
  dsmCode: string;
  icdCode: string;
  category: string;
  prevalence: string;
  onsetAge: string;
  severity: "mild" | "moderate" | "severe" | "variable";
  shortDescription: string;
  keyCriteria: string[];
  treatments: { type: string; name: string; evidence: "strong" | "moderate" | "emerging" }[];
  lifestyleInterventions: string[];
  pubmedSearchTerm: string;
  relatedConditions: string[];
  emergencyFlag: boolean;
};

const CONDITIONS: Condition[] = [
  {
    id: "mdd",
    name: "Major Depressive Disorder",
    dsmCode: "DSM-5 296.2x/296.3x",
    icdCode: "F32/F33",
    category: "Depressive Disorders",
    prevalence: "~7% of US adults annually",
    onsetAge: "Mid-20s (can occur at any age)",
    severity: "variable",
    shortDescription: "Persistent depressed mood or loss of interest/pleasure lasting at least 2 weeks, with significant functional impairment.",
    keyCriteria: [
      "Depressed mood most of the day, nearly every day",
      "Markedly diminished interest or pleasure in activities",
      "Significant weight loss/gain or appetite change",
      "Insomnia or hypersomnia nearly every day",
      "Psychomotor agitation or retardation",
      "Fatigue or loss of energy",
      "Feelings of worthlessness or excessive guilt",
      "Diminished ability to think or concentrate",
      "Recurrent thoughts of death or suicidal ideation",
    ],
    treatments: [
      { type: "Medication", name: "SSRIs (sertraline, fluoxetine, escitalopram)", evidence: "strong" },
      { type: "Medication", name: "SNRIs (venlafaxine, duloxetine)", evidence: "strong" },
      { type: "Therapy", name: "Cognitive Behavioral Therapy (CBT)", evidence: "strong" },
      { type: "Therapy", name: "Interpersonal Therapy (IPT)", evidence: "strong" },
      { type: "Neuromodulation", name: "Transcranial Magnetic Stimulation (TMS)", evidence: "moderate" },
      { type: "Neuromodulation", name: "Electroconvulsive Therapy (ECT)", evidence: "strong" },
      { type: "Emerging", name: "Ketamine/Esketamine (Spravato)", evidence: "emerging" },
      { type: "Emerging", name: "Psilocybin-assisted therapy", evidence: "emerging" },
    ],
    lifestyleInterventions: [
      "Regular aerobic exercise (30 min, 3-5x/week) — PMID: 30099000",
      "Mediterranean diet pattern — PMID: 30254236",
      "Sleep hygiene optimization (7-9 hours) — PMID: 28364328",
      "Mindfulness-based cognitive therapy (MBCT) — PMID: 26385067",
      "Social engagement and support groups",
    ],
    pubmedSearchTerm: "major depressive disorder treatment",
    relatedConditions: ["gad", "ptsd", "bipolar"],
    emergencyFlag: true,
  },
  {
    id: "gad",
    name: "Generalized Anxiety Disorder",
    dsmCode: "DSM-5 300.02",
    icdCode: "F41.1",
    category: "Anxiety Disorders",
    prevalence: "~3.1% of US adults annually",
    onsetAge: "Median age 30 (gradual onset)",
    severity: "variable",
    shortDescription: "Excessive anxiety and worry about multiple events or activities, occurring more days than not for at least 6 months.",
    keyCriteria: [
      "Excessive anxiety and worry occurring more days than not for 6+ months",
      "Difficulty controlling the worry",
      "Restlessness or feeling keyed up or on edge",
      "Being easily fatigued",
      "Difficulty concentrating or mind going blank",
      "Irritability",
      "Muscle tension",
      "Sleep disturbance",
    ],
    treatments: [
      { type: "Medication", name: "SSRIs (sertraline, paroxetine)", evidence: "strong" },
      { type: "Medication", name: "SNRIs (venlafaxine, duloxetine)", evidence: "strong" },
      { type: "Medication", name: "Buspirone", evidence: "moderate" },
      { type: "Therapy", name: "Cognitive Behavioral Therapy (CBT)", evidence: "strong" },
      { type: "Therapy", name: "Acceptance and Commitment Therapy (ACT)", evidence: "moderate" },
      { type: "Therapy", name: "Applied Relaxation Training", evidence: "moderate" },
    ],
    lifestyleInterventions: [
      "Progressive muscle relaxation (daily) — PMID: 18752862",
      "Diaphragmatic breathing exercises — PMID: 29167471",
      "Regular physical activity — PMID: 30099000",
      "Caffeine reduction — PMID: 22341956",
      "Mindfulness meditation — PMID: 24395196",
    ],
    pubmedSearchTerm: "generalized anxiety disorder treatment",
    relatedConditions: ["mdd", "panic", "social_anxiety"],
    emergencyFlag: false,
  },
  {
    id: "ptsd",
    name: "Post-Traumatic Stress Disorder",
    dsmCode: "DSM-5 309.81",
    icdCode: "F43.10",
    category: "Trauma & Stressor-Related Disorders",
    prevalence: "~3.6% of US adults annually",
    onsetAge: "Any age (following trauma exposure)",
    severity: "severe",
    shortDescription: "Development of characteristic symptoms following exposure to one or more traumatic events, including intrusion, avoidance, negative cognitions, and hyperarousal.",
    keyCriteria: [
      "Exposure to actual or threatened death, serious injury, or sexual violence",
      "Intrusion symptoms (flashbacks, nightmares, distressing memories)",
      "Persistent avoidance of stimuli associated with the trauma",
      "Negative alterations in cognitions and mood",
      "Marked alterations in arousal and reactivity",
      "Duration of symptoms more than 1 month",
      "Clinically significant distress or functional impairment",
    ],
    treatments: [
      { type: "Therapy", name: "Prolonged Exposure (PE) Therapy", evidence: "strong" },
      { type: "Therapy", name: "Cognitive Processing Therapy (CPT)", evidence: "strong" },
      { type: "Therapy", name: "Eye Movement Desensitization (EMDR)", evidence: "strong" },
      { type: "Medication", name: "Sertraline (Zoloft)", evidence: "strong" },
      { type: "Medication", name: "Paroxetine (Paxil)", evidence: "strong" },
      { type: "Medication", name: "Prazosin (for nightmares)", evidence: "moderate" },
      { type: "Emerging", name: "MDMA-assisted psychotherapy", evidence: "emerging" },
      { type: "Emerging", name: "Stellate ganglion block", evidence: "emerging" },
    ],
    lifestyleInterventions: [
      "Trauma-sensitive yoga — PMID: 25004196",
      "Grounding techniques and safety planning",
      "Regular sleep schedule — PMID: 28364328",
      "Peer support groups (veterans, survivors)",
      "Nature-based therapy and ecotherapy — PMID: 30739869",
    ],
    pubmedSearchTerm: "PTSD evidence based treatment",
    relatedConditions: ["mdd", "gad", "substance_use"],
    emergencyFlag: true,
  },
  {
    id: "bipolar",
    name: "Bipolar I Disorder",
    dsmCode: "DSM-5 296.4x-296.7x",
    icdCode: "F31.x",
    category: "Bipolar & Related Disorders",
    prevalence: "~2.8% of US adults (lifetime)",
    onsetAge: "Late teens to early 20s",
    severity: "severe",
    shortDescription: "Characterized by at least one manic episode, often with depressive episodes. Mania involves elevated mood, increased energy, and impaired judgment.",
    keyCriteria: [
      "At least one manic episode lasting 7+ days (or hospitalization)",
      "Inflated self-esteem or grandiosity",
      "Decreased need for sleep",
      "More talkative than usual or pressured speech",
      "Flight of ideas or racing thoughts",
      "Distractibility",
      "Increase in goal-directed activity or psychomotor agitation",
      "Excessive involvement in risky activities",
    ],
    treatments: [
      { type: "Medication", name: "Lithium (mood stabilizer)", evidence: "strong" },
      { type: "Medication", name: "Valproate/Divalproex", evidence: "strong" },
      { type: "Medication", name: "Lamotrigine (for depressive episodes)", evidence: "strong" },
      { type: "Medication", name: "Atypical antipsychotics (quetiapine, olanzapine)", evidence: "strong" },
      { type: "Therapy", name: "Psychoeducation", evidence: "strong" },
      { type: "Therapy", name: "Interpersonal and Social Rhythm Therapy (IPSRT)", evidence: "moderate" },
      { type: "Therapy", name: "Family-Focused Therapy", evidence: "moderate" },
    ],
    lifestyleInterventions: [
      "Strict sleep-wake schedule — PMID: 28364328",
      "Mood charting and self-monitoring",
      "Avoid alcohol and recreational drugs",
      "Regular routine and social rhythms — PMID: 17519644",
      "Omega-3 fatty acid supplementation — PMID: 22898207",
    ],
    pubmedSearchTerm: "bipolar disorder treatment guidelines",
    relatedConditions: ["mdd", "adhd", "substance_use"],
    emergencyFlag: true,
  },
  {
    id: "panic",
    name: "Panic Disorder",
    dsmCode: "DSM-5 300.01",
    icdCode: "F41.0",
    category: "Anxiety Disorders",
    prevalence: "~2-3% of US adults annually",
    onsetAge: "Late teens to mid-30s",
    severity: "moderate",
    shortDescription: "Recurrent unexpected panic attacks — sudden surges of intense fear reaching a peak within minutes, with physical and cognitive symptoms.",
    keyCriteria: [
      "Recurrent unexpected panic attacks",
      "Palpitations, pounding heart, or accelerated heart rate",
      "Sweating, trembling, or shaking",
      "Sensations of shortness of breath or smothering",
      "Feelings of choking",
      "Chest pain or discomfort",
      "Fear of losing control or 'going crazy'",
      "Fear of dying",
      "Persistent concern about additional attacks for 1+ month",
    ],
    treatments: [
      { type: "Therapy", name: "Cognitive Behavioral Therapy (CBT)", evidence: "strong" },
      { type: "Therapy", name: "Panic Control Treatment (PCT)", evidence: "strong" },
      { type: "Medication", name: "SSRIs (sertraline, fluoxetine)", evidence: "strong" },
      { type: "Medication", name: "SNRIs (venlafaxine)", evidence: "strong" },
      { type: "Medication", name: "Benzodiazepines (short-term only)", evidence: "moderate" },
    ],
    lifestyleInterventions: [
      "Interoceptive exposure exercises",
      "Breathing retraining — PMID: 29167471",
      "Caffeine elimination — PMID: 22341956",
      "Regular cardiovascular exercise — PMID: 30099000",
      "Progressive muscle relaxation — PMID: 18752862",
    ],
    pubmedSearchTerm: "panic disorder treatment",
    relatedConditions: ["gad", "social_anxiety", "agoraphobia"],
    emergencyFlag: false,
  },
  {
    id: "adhd",
    name: "Attention-Deficit/Hyperactivity Disorder",
    dsmCode: "DSM-5 314.0x",
    icdCode: "F90.x",
    category: "Neurodevelopmental Disorders",
    prevalence: "~4.4% of US adults",
    onsetAge: "Childhood (symptoms before age 12)",
    severity: "variable",
    shortDescription: "Persistent pattern of inattention and/or hyperactivity-impulsivity that interferes with functioning or development.",
    keyCriteria: [
      "Inattention: fails to give close attention, difficulty sustaining attention",
      "Often does not follow through on instructions",
      "Difficulty organizing tasks and activities",
      "Avoids tasks requiring sustained mental effort",
      "Often loses things necessary for tasks",
      "Hyperactivity: fidgets, leaves seat, runs/climbs inappropriately",
      "Often talks excessively, blurts out answers",
      "Difficulty waiting turn",
      "Several symptoms present before age 12",
    ],
    treatments: [
      { type: "Medication", name: "Methylphenidate (Ritalin, Concerta)", evidence: "strong" },
      { type: "Medication", name: "Amphetamine salts (Adderall, Vyvanse)", evidence: "strong" },
      { type: "Medication", name: "Atomoxetine (Strattera) — non-stimulant", evidence: "moderate" },
      { type: "Therapy", name: "Cognitive Behavioral Therapy (CBT)", evidence: "moderate" },
      { type: "Therapy", name: "Organizational skills training", evidence: "moderate" },
      { type: "Therapy", name: "ADHD coaching", evidence: "moderate" },
    ],
    lifestyleInterventions: [
      "Regular physical exercise — PMID: 30099000",
      "Structured daily routines and time management",
      "Mindfulness meditation — PMID: 24395196",
      "Adequate sleep (7-9 hours) — PMID: 28364328",
      "Protein-rich breakfast and balanced nutrition",
    ],
    pubmedSearchTerm: "ADHD adult treatment",
    relatedConditions: ["mdd", "gad", "bipolar"],
    emergencyFlag: false,
  },
  {
    id: "ocd",
    name: "Obsessive-Compulsive Disorder",
    dsmCode: "DSM-5 300.3",
    icdCode: "F42.x",
    category: "Obsessive-Compulsive & Related Disorders",
    prevalence: "~1.2% of US adults annually",
    onsetAge: "Late teens to early 20s",
    severity: "moderate",
    shortDescription: "Presence of obsessions (recurrent intrusive thoughts) and/or compulsions (repetitive behaviors) that are time-consuming or cause significant distress.",
    keyCriteria: [
      "Obsessions: recurrent, persistent, intrusive thoughts, urges, or images",
      "Attempts to ignore or suppress obsessions",
      "Compulsions: repetitive behaviors or mental acts",
      "Behaviors aimed at preventing distress or a dreaded event",
      "Obsessions/compulsions are time-consuming (1+ hour/day)",
      "Cause clinically significant distress or impairment",
    ],
    treatments: [
      { type: "Therapy", name: "Exposure and Response Prevention (ERP)", evidence: "strong" },
      { type: "Medication", name: "SSRIs (fluoxetine, fluvoxamine, sertraline)", evidence: "strong" },
      { type: "Medication", name: "Clomipramine", evidence: "strong" },
      { type: "Therapy", name: "Acceptance and Commitment Therapy (ACT)", evidence: "moderate" },
      { type: "Neuromodulation", name: "Deep Brain Stimulation (treatment-resistant)", evidence: "emerging" },
    ],
    lifestyleInterventions: [
      "Mindfulness-based stress reduction — PMID: 24395196",
      "Regular exercise — PMID: 30099000",
      "Adequate sleep and stress management",
      "Support groups (IOCDF resources)",
      "Journaling to track obsessive patterns",
    ],
    pubmedSearchTerm: "OCD treatment evidence based",
    relatedConditions: ["gad", "mdd", "bdd"],
    emergencyFlag: false,
  },
  {
    id: "social_anxiety",
    name: "Social Anxiety Disorder",
    dsmCode: "DSM-5 300.23",
    icdCode: "F40.10",
    category: "Anxiety Disorders",
    prevalence: "~7% of US adults annually",
    onsetAge: "Early to mid-teens",
    severity: "moderate",
    shortDescription: "Marked fear or anxiety about social situations where the individual may be scrutinized, lasting 6+ months.",
    keyCriteria: [
      "Marked fear or anxiety about social situations",
      "Fear of acting in a way that will be negatively evaluated",
      "Social situations almost always provoke fear or anxiety",
      "Social situations are avoided or endured with intense fear",
      "Fear is out of proportion to the actual threat",
      "Duration of 6+ months",
      "Causes clinically significant distress or impairment",
    ],
    treatments: [
      { type: "Therapy", name: "Cognitive Behavioral Therapy (CBT)", evidence: "strong" },
      { type: "Therapy", name: "Exposure therapy (graduated)", evidence: "strong" },
      { type: "Medication", name: "SSRIs (paroxetine, sertraline)", evidence: "strong" },
      { type: "Medication", name: "SNRIs (venlafaxine)", evidence: "strong" },
      { type: "Medication", name: "Beta-blockers (performance-only anxiety)", evidence: "moderate" },
    ],
    lifestyleInterventions: [
      "Gradual social exposure practice",
      "Social skills training groups",
      "Mindfulness and self-compassion exercises — PMID: 24395196",
      "Regular exercise — PMID: 30099000",
      "Cognitive restructuring journaling",
    ],
    pubmedSearchTerm: "social anxiety disorder treatment",
    relatedConditions: ["gad", "mdd", "agoraphobia"],
    emergencyFlag: false,
  },
  {
    id: "substance_use",
    name: "Substance Use Disorder",
    dsmCode: "DSM-5 varies by substance",
    icdCode: "F10-F19",
    category: "Substance-Related & Addictive Disorders",
    prevalence: "~14.5% of US adults (any substance)",
    onsetAge: "Late teens to early 20s",
    severity: "severe",
    shortDescription: "A cluster of cognitive, behavioral, and physiological symptoms indicating continued substance use despite significant substance-related problems.",
    keyCriteria: [
      "Substance taken in larger amounts or over longer period than intended",
      "Persistent desire or unsuccessful efforts to cut down",
      "Great deal of time spent obtaining, using, or recovering",
      "Craving or strong desire to use",
      "Recurrent use resulting in failure to fulfill obligations",
      "Continued use despite social/interpersonal problems",
      "Tolerance (need for increased amounts)",
      "Withdrawal symptoms when stopping",
    ],
    treatments: [
      { type: "Medication", name: "Naltrexone (alcohol, opioids)", evidence: "strong" },
      { type: "Medication", name: "Buprenorphine/Naloxone (opioids)", evidence: "strong" },
      { type: "Medication", name: "Acamprosate (alcohol)", evidence: "strong" },
      { type: "Therapy", name: "Motivational Interviewing (MI)", evidence: "strong" },
      { type: "Therapy", name: "Cognitive Behavioral Therapy (CBT)", evidence: "strong" },
      { type: "Therapy", name: "12-Step Facilitation", evidence: "moderate" },
      { type: "Therapy", name: "Contingency Management", evidence: "strong" },
    ],
    lifestyleInterventions: [
      "Structured daily routine and recovery planning",
      "Regular exercise — PMID: 30099000",
      "Peer support (AA, NA, SMART Recovery)",
      "Mindfulness-based relapse prevention — PMID: 24395196",
      "Nutrition rehabilitation and hydration",
    ],
    pubmedSearchTerm: "substance use disorder treatment",
    relatedConditions: ["mdd", "ptsd", "bipolar"],
    emergencyFlag: true,
  },
  {
    id: "eating",
    name: "Anorexia Nervosa / Bulimia Nervosa",
    dsmCode: "DSM-5 307.1/307.51",
    icdCode: "F50.0x/F50.2",
    category: "Feeding & Eating Disorders",
    prevalence: "~0.6% (AN) / ~1% (BN) of US adults",
    onsetAge: "Adolescence to young adulthood",
    severity: "severe",
    shortDescription: "Persistent disturbance of eating behavior leading to altered food consumption, significantly impairing physical health or psychosocial functioning.",
    keyCriteria: [
      "AN: Restriction of energy intake leading to significantly low body weight",
      "AN: Intense fear of gaining weight or becoming fat",
      "AN: Disturbance in body weight/shape perception",
      "BN: Recurrent episodes of binge eating",
      "BN: Recurrent inappropriate compensatory behaviors (purging, fasting, excessive exercise)",
      "BN: Binge eating and compensatory behaviors occur at least once/week for 3 months",
    ],
    treatments: [
      { type: "Therapy", name: "Family-Based Treatment (FBT/Maudsley) — adolescents", evidence: "strong" },
      { type: "Therapy", name: "CBT-Enhanced (CBT-E)", evidence: "strong" },
      { type: "Therapy", name: "Interpersonal Therapy (IPT)", evidence: "moderate" },
      { type: "Medication", name: "Fluoxetine (BN)", evidence: "strong" },
      { type: "Medication", name: "Olanzapine (AN — weight restoration)", evidence: "moderate" },
      { type: "Medical", name: "Nutritional rehabilitation and medical monitoring", evidence: "strong" },
    ],
    lifestyleInterventions: [
      "Structured meal planning with dietitian",
      "Body image therapy and self-compassion work",
      "Gentle movement (not excessive exercise)",
      "Support groups (NEDA resources)",
      "Mindful eating practices",
    ],
    pubmedSearchTerm: "eating disorders treatment evidence",
    relatedConditions: ["mdd", "ocd", "social_anxiety"],
    emergencyFlag: true,
  },
];

const CATEGORIES = Array.from(new Set(CONDITIONS.map(c => c.category)));

const SEVERITY_CONFIG = {
  mild: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Mild" },
  moderate: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Moderate" },
  severe: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Severe" },
  variable: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Variable" },
};

const EVIDENCE_CONFIG = {
  strong: { color: "bg-green-500/20 text-green-400", label: "Strong Evidence" },
  moderate: { color: "bg-yellow-500/20 text-yellow-400", label: "Moderate Evidence" },
  emerging: { color: "bg-violet-500/20 text-violet-400", label: "Emerging Research" },
};

import { usePageTitle } from "@/lib/usePageTitle";
export default function ConditionLibrary() {
  usePageTitle("Conditions library");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return CONDITIONS.filter(c => {
      const matchSearch = !search || 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase()) ||
        c.dsmCode.toLowerCase().includes(search.toLowerCase()) ||
        c.icdCode.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || c.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory]);

  const expanded = expandedId ? CONDITIONS.find(c => c.id === expandedId) : null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30">
              <BookOpen className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Condition Resource Library</h1>
              <p className="text-sm text-muted-foreground">General educational reference about commonly discussed psychiatric conditions and care options</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-violet-400/30 text-violet-400 bg-violet-400/5 text-xs font-mono">
              {CONDITIONS.length} CONDITIONS
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-mono">
              DSM-5 ALIGNED
            </Badge>
            <Badge variant="outline" className="border-blue-400/30 text-blue-400 bg-blue-400/5 text-xs font-mono">
              PUBMED LINKED
            </Badge>
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-muted-foreground">For education only. Do not use this library to diagnose yourself or another person, choose medication, or decide on treatment. Diagnostic criteria and care options require individualized evaluation by a licensed professional, and medical information changes over time.</div>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conditions, DSM codes, ICD codes..."
              className="pl-10 bg-card border-border/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !selectedCategory ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-muted-foreground hover:text-foreground border border-border/50 hover:border-border"
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-muted-foreground hover:text-foreground border border-border/50 hover:border-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Condition Cards */}
        {!expanded ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map(c => {
              const sev = SEVERITY_CONFIG[c.severity];
              return (
                <Card
                  key={c.id}
                  className="cursor-pointer hover:border-violet-400/30 transition-colors group"
                  onClick={() => setExpandedId(c.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-violet-400 transition-colors">{c.name}</h3>
                          {c.emergencyFlag && <AlertTriangle className="w-4 h-4 text-red-400" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{c.dsmCode}</span>
                          <span className="text-xs text-muted-foreground">|</span>
                          <span className="text-xs font-mono text-muted-foreground">{c.icdCode}</span>
                        </div>
                      </div>
                      <Badge className={`${sev.color} text-xs`}>{sev.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.shortDescription}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.prevalence}</span>
                        <span className="flex items-center gap-1"><Pill className="w-3 h-3" /> {c.treatments.length} care approaches</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Expanded Condition Detail */
          <div>
            <Button variant="ghost" size="sm" onClick={() => setExpandedId(null)} className="mb-4 text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Library
            </Button>

            <Card className="border-violet-400/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">{expanded.name}</CardTitle>
                      {expanded.emergencyFlag && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Crisis Risk</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-mono">{expanded.dsmCode}</span>
                      <span>|</span>
                      <span className="font-mono">{expanded.icdCode}</span>
                      <span>|</span>
                      <span>{expanded.category}</span>
                    </div>
                  </div>
                  <Badge className={`${SEVERITY_CONFIG[expanded.severity].color} text-xs`}>
                    {SEVERITY_CONFIG[expanded.severity].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overview */}
                <div>
                  <p className="text-sm text-foreground leading-relaxed">{expanded.shortDescription}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Prevalence: {expanded.prevalence}</span>
                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Typical onset: {expanded.onsetAge}</span>
                  </div>
                </div>

                {/* DSM-5 Criteria */}
                <div className="p-4 rounded-xl border border-border/50 bg-card/50">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-400" /> DSM-5 Diagnostic Criteria
                  </h4>
                  <ul className="space-y-1.5">
                    {expanded.keyCriteria.map((criterion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-violet-400 mt-0.5 font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Common Clinician-Discussed Care Approaches */}
                <div className="p-4 rounded-xl border border-border/50 bg-card/50">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary" /> Common Clinician-Discussed Care Approaches
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {expanded.treatments.map((t, i) => {
                      const ev = EVIDENCE_CONFIG[t.evidence];
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/50">
                          <div>
                            <p className="text-sm font-medium text-foreground">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.type}</p>
                          </div>
                          <Badge className={`${ev.color} text-[10px]`}>{ev.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lifestyle Interventions */}
                <div className="p-4 rounded-xl border border-border/50 bg-card/50">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-400" /> Lifestyle Interventions
                  </h4>
                  <ul className="space-y-1.5">
                    {expanded.lifestyleInterventions.map((intervention, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Heart className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                        {intervention}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Research & Related */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(expanded.pubmedSearchTerm)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Card className="hover:border-violet-400/30 transition-colors h-full">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/10">
                          <ExternalLink className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Search PubMed</p>
                          <p className="text-xs text-muted-foreground">View peer-reviewed research</p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                  <Link href={`/research?q=${encodeURIComponent(expanded.name)}`} className="flex-1">
                    <Card className="hover:border-primary/30 transition-colors h-full">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">AI Research Assistant</p>
                          <p className="text-xs text-muted-foreground">Ask Dr. Buddy about this condition</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Related Conditions */}
                {expanded.relatedConditions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Related Conditions</h4>
                    <div className="flex gap-2 flex-wrap">
                      {expanded.relatedConditions.map(relId => {
                        const rel = CONDITIONS.find(c => c.id === relId);
                        if (!rel) return null;
                        return (
                          <button
                            key={relId}
                            onClick={() => setExpandedId(relId)}
                            className="px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-violet-400/30 transition-colors"
                          >
                            {rel.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <p className="text-xs text-yellow-400/80 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    This information is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare provider for diagnosis and treatment decisions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No conditions match your search.</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setSelectedCategory(null); }} className="mt-2">
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
