import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe, ArrowLeft, AlertTriangle, TrendingUp, Shield,
  Heart, Baby, Briefcase, Zap, Star, HeartCrack, Users
} from "lucide-react";

type LifeEvent = {
  id: string;
  category: string;
  name: string;
  icon: React.ElementType;
  description: string;
  impact_valence: "positive" | "negative" | "mixed";
  stress_score: number;
  dsm_triggers: Record<string, number>;
  growth_opportunity: string;
  challenge_zone: string;
  resilience_factors: string[];
};

const LIFE_EVENTS: LifeEvent[] = [
  {
    id: "parent_death",
    category: "Loss",
    name: "Death of a Parent",
    icon: HeartCrack,
    description: "One of life's most profound losses, reshaping identity and mortality awareness.",
    impact_valence: "negative",
    stress_score: 88,
    dsm_triggers: { depression: 0.45, anxiety: 0.38, ptsd: 0.22, bipolar: 0.18, substance_use: 0.25 },
    growth_opportunity: "Deepens empathy, clarifies life priorities, and can catalyze meaningful legacy work.",
    challenge_zone: "High risk of complicated grief, prolonged depression, and relationship withdrawal.",
    resilience_factors: ["Strong social support network", "Prior grief processing experience", "Spiritual or philosophical framework"],
  },
  {
    id: "child_birth",
    category: "Family",
    name: "Birth of a Child",
    icon: Baby,
    description: "A transformative life transition that reshapes identity, relationships, and daily structure.",
    impact_valence: "positive",
    stress_score: 65,
    dsm_triggers: { depression: 0.15, anxiety: 0.28, bipolar: 0.12, ptsd: 0.05, substance_use: 0.08 },
    growth_opportunity: "Deepens capacity for unconditional love, purpose, and long-term thinking.",
    challenge_zone: "Postpartum depression, sleep deprivation, relationship strain, identity loss.",
    resilience_factors: ["Partner support", "Parental leave access", "Community and family network"],
  },
  {
    id: "divorce",
    category: "Relationships",
    name: "Divorce or Separation",
    icon: HeartCrack,
    description: "Dissolution of a primary partnership with cascading effects on identity and stability.",
    impact_valence: "negative",
    stress_score: 82,
    dsm_triggers: { depression: 0.42, anxiety: 0.35, ptsd: 0.18, bipolar: 0.22, substance_use: 0.30 },
    growth_opportunity: "Opportunity for authentic self-rediscovery, boundary-setting, and personal reinvention.",
    challenge_zone: "Financial instability, custody conflict, social isolation, identity disruption.",
    resilience_factors: ["Therapeutic support", "Financial independence", "Strong peer network"],
  },
  {
    id: "job_loss",
    category: "Career",
    name: "Job Loss / Layoff",
    icon: Briefcase,
    description: "Sudden loss of employment and professional identity with financial and social consequences.",
    impact_valence: "negative",
    stress_score: 75,
    dsm_triggers: { depression: 0.40, anxiety: 0.45, bipolar: 0.15, substance_use: 0.28, ptsd: 0.10 },
    growth_opportunity: "Catalyzes career pivots, entrepreneurship, and alignment with deeper values.",
    challenge_zone: "Financial crisis, identity collapse, social shame, family stress.",
    resilience_factors: ["Emergency savings (3-6 months)", "Transferable skills", "Professional network"],
  },
  {
    id: "promotion",
    category: "Career",
    name: "Major Career Promotion",
    icon: TrendingUp,
    description: "Significant advancement in professional status, responsibility, and compensation.",
    impact_valence: "positive",
    stress_score: 42,
    dsm_triggers: { anxiety: 0.25, depression: 0.08, bipolar: 0.15, substance_use: 0.10, ptsd: 0.02 },
    growth_opportunity: "Builds confidence, financial security, and leadership capacity.",
    challenge_zone: "Imposter syndrome, work-life imbalance, relationship envy, performance anxiety.",
    resilience_factors: ["Mentorship relationships", "Clear work boundaries", "Mindfulness practice"],
  },
  {
    id: "cancer_diagnosis",
    category: "Health",
    name: "Cancer Diagnosis",
    icon: AlertTriangle,
    description: "Life-altering medical diagnosis confronting mortality and physical vulnerability.",
    impact_valence: "negative",
    stress_score: 95,
    dsm_triggers: { depression: 0.55, anxiety: 0.60, ptsd: 0.40, bipolar: 0.20, substance_use: 0.22 },
    growth_opportunity: "Post-traumatic growth, radical life reprioritization, deepened relationships.",
    challenge_zone: "Existential terror, treatment trauma, financial devastation, relationship burden.",
    resilience_factors: ["Medical support team", "Family involvement", "Psychological oncology support"],
  },
  {
    id: "sobriety_milestone",
    category: "Achievement",
    name: "Sobriety Milestone (1 Year+)",
    icon: Star,
    description: "Sustained recovery from substance use disorder, representing profound neurological and behavioral change.",
    impact_valence: "positive",
    stress_score: 35,
    dsm_triggers: { depression: 0.20, anxiety: 0.18, bipolar: 0.12, ptsd: 0.15, substance_use: 0.10 },
    growth_opportunity: "Rebuilds self-efficacy, restores relationships, and creates platform for full life engagement.",
    challenge_zone: "PAWS (post-acute withdrawal), relationship renegotiation, identity reconstruction.",
    resilience_factors: ["12-step or peer support", "Ongoing therapy", "Sober social network"],
  },
  {
    id: "military_deployment",
    category: "Trauma",
    name: "Military Combat Deployment",
    icon: Shield,
    description: "Exposure to combat, moral injury, and prolonged separation from family and civilian life.",
    impact_valence: "mixed",
    stress_score: 90,
    dsm_triggers: { ptsd: 0.70, depression: 0.45, anxiety: 0.40, substance_use: 0.35, bipolar: 0.15 },
    growth_opportunity: "Forges resilience, brotherhood/sisterhood bonds, and extraordinary leadership capacity.",
    challenge_zone: "Combat PTSD, moral injury, reintegration failure, suicide risk.",
    resilience_factors: ["Unit cohesion", "Post-deployment mental health support", "Family reintegration programs"],
  },
  {
    id: "empty_nest",
    category: "Family",
    name: "Empty Nest (Last Child Leaves Home)",
    icon: Users,
    description: "Transition as the last child leaves home, requiring identity and relationship renegotiation.",
    impact_valence: "mixed",
    stress_score: 52,
    dsm_triggers: { depression: 0.30, anxiety: 0.25, bipolar: 0.10, substance_use: 0.15, ptsd: 0.03 },
    growth_opportunity: "Rediscovery of personal identity, couple reconnection, and new life chapter.",
    challenge_zone: "Empty nest syndrome, marital disconnection, loss of purpose and daily structure.",
    resilience_factors: ["Strong marital relationship", "Personal interests and hobbies", "Social engagement"],
  },
  {
    id: "new_relationship",
    category: "Relationships",
    name: "New Romantic Relationship",
    icon: Heart,
    description: "Formation of a significant new romantic bond with neurochemical and identity implications.",
    impact_valence: "positive",
    stress_score: 38,
    dsm_triggers: { anxiety: 0.20, depression: 0.05, bipolar: 0.18, ptsd: 0.12, substance_use: 0.08 },
    growth_opportunity: "Attachment healing, emotional growth, and expanded sense of possibility.",
    challenge_zone: "Attachment anxiety, vulnerability, past trauma activation, boundary challenges.",
    resilience_factors: ["Secure attachment history", "Self-awareness", "Healthy communication skills"],
  },
  {
    id: "financial_ruin",
    category: "Career",
    name: "Financial Ruin / Bankruptcy",
    icon: Zap,
    description: "Catastrophic financial loss with cascading effects on housing, relationships, and identity.",
    impact_valence: "negative",
    stress_score: 85,
    dsm_triggers: { depression: 0.50, anxiety: 0.55, bipolar: 0.20, substance_use: 0.35, ptsd: 0.18 },
    growth_opportunity: "Forces complete value realignment, builds financial wisdom, and tests relationship depth.",
    challenge_zone: "Shame spiral, housing instability, relationship breakdown, suicidal ideation.",
    resilience_factors: ["Financial counseling", "Social support", "Therapeutic intervention"],
  },
  {
    id: "chronic_illness",
    category: "Health",
    name: "Chronic Illness Diagnosis",
    icon: AlertTriangle,
    description: "Diagnosis of a long-term medical condition requiring lifestyle adaptation and ongoing management.",
    impact_valence: "negative",
    stress_score: 72,
    dsm_triggers: { depression: 0.45, anxiety: 0.40, ptsd: 0.20, bipolar: 0.15, substance_use: 0.18 },
    growth_opportunity: "Develops acceptance, body awareness, and community with others facing similar challenges.",
    challenge_zone: "Grief over lost health identity, treatment burden, relationship strain, financial impact.",
    resilience_factors: ["Patient community support", "Integrative care team", "Adaptive coping strategies"],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Loss: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  Family: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Career: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Relationships: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  Health: "text-red-400 bg-red-400/10 border-red-400/20",
  Achievement: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  Trauma: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

const DSM_LABELS: Record<string, string> = {
  depression: "Major Depression",
  anxiety: "Anxiety Disorder",
  ptsd: "PTSD",
  bipolar: "Bipolar Disorder",
  substance_use: "Substance Use",
};

const DSM_COLORS: Record<string, string> = {
  depression: "bg-blue-500",
  anxiety: "bg-amber-500",
  ptsd: "bg-orange-500",
  bipolar: "bg-purple-500",
  substance_use: "bg-rose-500",
};

export default function LifeEvents() {
  const [selected, setSelected] = useState<LifeEvent | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(LIFE_EVENTS.map(e => e.category)))];
  const filtered = categoryFilter === "All" ? LIFE_EVENTS : LIFE_EVENTS.filter(e => e.category === categoryFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <h1 className="font-bold text-lg">Life Events Engine</h1>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-400/30 text-amber-400 bg-amber-400/5 text-xs font-mono">
            MILESTONE MIND-MAP
          </Badge>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl font-bold mb-2">Life Events & Mental Health Impact</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every major life event carries a psychiatric risk profile. Select any event to see its DSM-5 trigger probabilities, 
            challenge zones, growth opportunities, and resilience factors — modeled from published epidemiological research.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Grid */}
          <div className="lg:col-span-1 space-y-3">
            {filtered.map(event => {
              const Icon = event.icon;
              const catColor = CATEGORY_COLORS[event.category] || "text-muted-foreground bg-muted border-border";
              return (
                <button
                  key={event.id}
                  onClick={() => setSelected(event)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected?.id === event.id
                      ? "bg-primary/10 border-primary/40"
                      : "bg-card border-border/50 hover:border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${catColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{event.name}</span>
                        <span className={`text-xs font-mono font-bold flex-shrink-0 ${
                          event.stress_score >= 80 ? "text-destructive" :
                          event.stress_score >= 60 ? "text-amber-400" : "text-emerald-400"
                        }`}>{event.stress_score}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{event.category}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-6">
                {/* Event Header */}
                <Card className="bg-card border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${CATEGORY_COLORS[selected.category] || ""}`}>
                        <selected.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{selected.name}</h3>
                          <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[selected.category] || ""}`}>
                            {selected.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{selected.description}</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold font-mono ${
                          selected.stress_score >= 80 ? "text-destructive" :
                          selected.stress_score >= 60 ? "text-amber-400" : "text-emerald-400"
                        }`}>{selected.stress_score}</div>
                        <div className="text-xs text-muted-foreground">Stress Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* DSM Trigger Probabilities */}
                <Card className="bg-card border-border/50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      DSM-5 Trigger Probabilities
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(selected.dsm_triggers)
                        .sort(([, a], [, b]) => b - a)
                        .map(([key, val]) => (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground">{DSM_LABELS[key] || key}</span>
                              <span className="text-sm font-mono font-medium">{Math.round(val * 100)}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${DSM_COLORS[key] || "bg-primary"}`}
                                style={{ width: `${val * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Probabilities represent population-level risk elevation based on published epidemiological research. Individual risk varies.
                    </p>
                  </CardContent>
                </Card>

                {/* Growth & Challenge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm text-primary">Growth Opportunity</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.growth_opportunity}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <h4 className="font-semibold text-sm text-destructive">Challenge Zone</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.challenge_zone}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Resilience Factors */}
                <Card className="bg-card border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <h4 className="font-semibold text-sm">Resilience Factors</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.resilience_factors.map((f, i) => (
                        <Badge key={i} variant="outline" className="border-cyan-400/20 text-cyan-400 bg-cyan-400/5 text-xs">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-20">
                <div>
                  <Globe className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold text-muted-foreground mb-2">Select a Life Event</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Choose any life milestone from the list to see its psychiatric impact profile, trigger probabilities, and resilience strategies.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          Life Events data is based on published epidemiological research. Not a substitute for professional mental health assessment.
        </p>
      </div>
    </div>
  );
}
