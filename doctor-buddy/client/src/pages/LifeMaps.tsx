import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowLeft, TrendingUp, TrendingDown, Brain, Heart, Briefcase, DollarSign, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { trpc } from "@/lib/trpc";

const CONDITIONS = [
  {
    name: "Major Depressive Disorder",
    dsm_code: "F32.x",
    color: "#22c55e",
    description: "Persistent depressed mood or loss of interest, affecting daily functioning.",
    trajectory: [
      { age: 25, treated: 72, untreated: 38 },
      { age: 30, treated: 75, untreated: 34 },
      { age: 35, treated: 78, untreated: 31 },
      { age: 40, treated: 80, untreated: 28 },
      { age: 45, treated: 82, untreated: 25 },
      { age: 50, treated: 81, untreated: 23 },
      { age: 55, treated: 80, untreated: 22 },
      { age: 60, treated: 79, untreated: 21 },
      { age: 65, treated: 76, untreated: 19 },
    ],
    domains: {
      treated: {
        career: "Stable employment, promotions, meaningful work",
        relationships: "Healthy partnerships, strong social network",
        health: "Active lifestyle, preventive care engagement",
        finances: "Consistent savings, financial planning",
      },
      untreated: {
        career: "Frequent job loss, underemployment, disability",
        relationships: "Isolation, divorce, estrangement from family",
        health: "Chronic pain, cardiovascular risk, early mortality",
        finances: "Medical debt, bankruptcy, inability to work",
      },
    },
  },
  {
    name: "Generalized Anxiety Disorder",
    dsm_code: "F41.1",
    color: "#3b82f6",
    description: "Excessive, uncontrollable worry about multiple life domains.",
    trajectory: [
      { age: 25, treated: 70, untreated: 42 },
      { age: 30, treated: 74, untreated: 39 },
      { age: 35, treated: 77, untreated: 36 },
      { age: 40, treated: 79, untreated: 33 },
      { age: 45, treated: 80, untreated: 30 },
      { age: 50, treated: 79, untreated: 28 },
      { age: 55, treated: 78, untreated: 26 },
      { age: 60, treated: 77, untreated: 24 },
      { age: 65, treated: 75, untreated: 22 },
    ],
    domains: {
      treated: {
        career: "Productive, focused work with manageable stress",
        relationships: "Secure attachments, open communication",
        health: "Regular exercise, healthy sleep patterns",
        finances: "Rational financial decisions, retirement planning",
      },
      untreated: {
        career: "Avoidance of advancement, chronic absenteeism",
        relationships: "Reassurance-seeking, relationship strain",
        health: "Somatic complaints, GI disorders, insomnia",
        finances: "Avoidance of financial planning, impulsive spending",
      },
    },
  },
  {
    name: "PTSD",
    dsm_code: "F43.10",
    color: "#f59e0b",
    description: "Trauma-related intrusions, avoidance, negative cognitions, and hyperarousal.",
    trajectory: [
      { age: 25, treated: 65, untreated: 30 },
      { age: 30, treated: 70, untreated: 28 },
      { age: 35, treated: 75, untreated: 26 },
      { age: 40, treated: 78, untreated: 24 },
      { age: 45, treated: 80, untreated: 22 },
      { age: 50, treated: 79, untreated: 20 },
      { age: 55, treated: 78, untreated: 18 },
      { age: 60, treated: 76, untreated: 17 },
      { age: 65, treated: 74, untreated: 15 },
    ],
    domains: {
      treated: {
        career: "Reintegration into workforce, purpose-driven roles",
        relationships: "Rebuilt trust, trauma-informed partnerships",
        health: "Reduced hypervigilance, improved sleep quality",
        finances: "Stable income, reduced crisis spending",
      },
      untreated: {
        career: "Inability to maintain employment, PTSD disability",
        relationships: "Domestic conflict, social withdrawal, re-traumatization",
        health: "Substance abuse, chronic pain, suicidality",
        finances: "Homelessness risk, dependency on public assistance",
      },
    },
  },
  {
    name: "Bipolar I Disorder",
    dsm_code: "F31.1x",
    color: "#a855f7",
    description: "Manic episodes lasting ≥7 days, often with depressive episodes.",
    trajectory: [
      { age: 25, treated: 68, untreated: 35 },
      { age: 30, treated: 72, untreated: 30 },
      { age: 35, treated: 75, untreated: 27 },
      { age: 40, treated: 76, untreated: 24 },
      { age: 45, treated: 77, untreated: 21 },
      { age: 50, treated: 76, untreated: 19 },
      { age: 55, treated: 75, untreated: 17 },
      { age: 60, treated: 73, untreated: 15 },
      { age: 65, treated: 71, untreated: 13 },
    ],
    domains: {
      treated: {
        career: "Consistent employment with mood-aware scheduling",
        relationships: "Stable partnerships with psychoeducation support",
        health: "Mood monitoring, medication adherence, wellness routines",
        finances: "Financial safeguards, avoiding manic spending",
      },
      untreated: {
        career: "Repeated firings during manic episodes, long depressions",
        relationships: "Divorce, custody loss, burned bridges",
        health: "Rapid cycling, psychosis, hospitalization",
        finances: "Bankruptcy from manic spending, legal debt",
      },
    },
  },
  {
    name: "ADHD",
    dsm_code: "F90.x",
    color: "#ec4899",
    description: "Persistent inattention and/or hyperactivity-impulsivity interfering with functioning.",
    trajectory: [
      { age: 25, treated: 74, untreated: 45 },
      { age: 30, treated: 78, untreated: 41 },
      { age: 35, treated: 81, untreated: 38 },
      { age: 40, treated: 83, untreated: 35 },
      { age: 45, treated: 84, untreated: 32 },
      { age: 50, treated: 83, untreated: 30 },
      { age: 55, treated: 82, untreated: 28 },
      { age: 60, treated: 80, untreated: 26 },
      { age: 65, treated: 78, untreated: 24 },
    ],
    domains: {
      treated: {
        career: "High-achieving in stimulating roles, entrepreneurship",
        relationships: "Improved communication, reduced impulsive conflict",
        health: "Exercise routines, structured sleep, nutrition",
        finances: "Automated savings, financial accountability systems",
      },
      untreated: {
        career: "Chronic underachievement, job-hopping, underemployment",
        relationships: "Impulsive decisions, emotional dysregulation, divorce",
        health: "Substance use, obesity, sleep disorders",
        finances: "Impulsive spending, debt accumulation, financial chaos",
      },
    },
  },
];

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  career: Briefcase,
  relationships: Heart,
  health: Activity,
  finances: DollarSign,
};

export default function LifeMaps() {
  const [selected, setSelected] = useState(0);
  const condition = CONDITIONS[selected];

  // AI-generated personalized life map
  const [aiCondition, setAiCondition] = useState("Major Depressive Disorder");
  const [aiAge, setAiAge] = useState("30");
  const [aiTreatment, setAiTreatment] = useState<"untreated" | "partial" | "treated">("untreated");
  const [aiResult, setAiResult] = useState<any>(null);

  const generateMutation = trpc.lifeMaps.generate.useMutation({
    onSuccess: (data) => setAiResult(data),
  });

  const chartData = condition.trajectory.map(p => ({
    age: `Age ${p.age}`,
    "Treated": p.treated,
    "Untreated": p.untreated,
  }));

  const latestTreated = condition.trajectory[condition.trajectory.length - 1].treated;
  const latestUntreated = condition.trajectory[condition.trajectory.length - 1].untreated;
  const gap = latestTreated - latestUntreated;

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
              <Activity className="w-5 h-5 text-cyan-400" />
              <h1 className="font-bold text-lg">Life Maps</h1>
            </div>
          </div>
          <Badge variant="outline" className="border-cyan-400/30 text-cyan-400 bg-cyan-400/5 text-xs font-mono">
            DUAL-PATH SIMULATION
          </Badge>
        </div>
      </div>

      <div className="container py-8">
        {/* Intro */}
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Life, Two Paths</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Life Maps models two parallel trajectories for each psychiatric condition — one treated, one untreated — 
            across career, relationships, health, and finances from age 25 to 65. Select a condition to see the divergence.
          </p>
        </div>

        {/* Condition Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CONDITIONS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setSelected(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                selected === i
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span className="font-mono text-xs mr-2 opacity-60">{c.dsm_code}</span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Main Chart */}
        <Card className="bg-card border-border/50 mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{condition.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{condition.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-destructive font-mono">-{gap} pts</div>
                <div className="text-xs text-muted-foreground">Quality of Life Gap at Age 65</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 240)" />
                <XAxis dataKey="age" tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 12 }} label={{ value: "Quality of Life Score", angle: -90, position: "insideLeft", fill: "oklch(0.55 0.02 240)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.11 0.015 240)", border: "1px solid oklch(0.2 0.02 240)", borderRadius: "8px" }}
                  labelStyle={{ color: "oklch(0.95 0.01 240)" }}
                />
                <Legend />
                <ReferenceLine y={50} stroke="oklch(0.3 0.02 240)" strokeDasharray="5 5" label={{ value: "Baseline", fill: "oklch(0.45 0.02 240)", fontSize: 10 }} />
                <Line type="monotone" dataKey="Treated" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e", r: 5 }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="Untreated" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", r: 5 }} activeDot={{ r: 7 }} strokeDasharray="6 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Domain Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Object.entries(condition.domains.treated).map(([domain, treatedText]) => {
            const Icon = DOMAIN_ICONS[domain] || Activity;
            const untreatedText = condition.domains.untreated[domain as keyof typeof condition.domains.untreated];
            return (
              <Card key={domain} className="bg-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold capitalize">{domain}</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-primary mb-1">With Treatment</div>
                        <p className="text-xs text-muted-foreground">{treatedText}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-destructive mb-1">Without Treatment</div>
                        <p className="text-xs text-muted-foreground">{untreatedText}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Personalized Life Map Generator */}
        <Card className="bg-primary/5 border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Personalized Life Map Generator
              <Badge variant="outline" className="border-primary/30 text-primary text-xs ml-auto">POWERED BY AI</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Generate a custom dual-path trajectory for any condition, age, and treatment status using our clinical AI model.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Condition</label>
                <Select value={aiCondition} onValueChange={setAiCondition}>
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Major Depressive Disorder", "Generalized Anxiety Disorder", "PTSD", "Bipolar I Disorder", "Schizophrenia", "OCD", "Borderline Personality Disorder", "ADHD", "Panic Disorder", "Social Anxiety Disorder"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Current Age</label>
                <Select value={aiAge} onValueChange={setAiAge}>
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[18,20,25,30,35,40,45,50,55,60].map(a => (
                      <SelectItem key={a} value={String(a)}>Age {a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Treatment Status</label>
                <Select value={aiTreatment} onValueChange={(v) => setAiTreatment(v as any)}>
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="untreated">Untreated</SelectItem>
                    <SelectItem value="partial">Partially Treated</SelectItem>
                    <SelectItem value="treated">Fully Treated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => generateMutation.mutate({ condition: aiCondition, currentAge: parseInt(aiAge), currentTreatmentStatus: aiTreatment })}
              disabled={generateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating AI Life Map...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate My Life Map</>
              )}
            </Button>

            {/* AI Result */}
            {aiResult && aiResult.treated?.milestones?.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="border-t border-border/30 pt-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    AI-Generated Trajectory: {aiResult.condition}
                  </h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={aiResult.treated.milestones.map((m: any, i: number) => ({
                        age: `Age ${m.age}`,
                        "Treated": m.qualityOfLife,
                        "Untreated": aiResult.untreated?.milestones?.[i]?.qualityOfLife ?? 0,
                      }))}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 240)" />
                      <XAxis dataKey="age" tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "oklch(0.11 0.015 240)", border: "1px solid oklch(0.2 0.02 240)", borderRadius: "8px" }} />
                      <Legend />
                      <ReferenceLine y={50} stroke="oklch(0.3 0.02 240)" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="Treated" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e", r: 4 }} />
                      <Line type="monotone" dataKey="Untreated" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", r: 4 }} strokeDasharray="6 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Milestone narratives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiResult.treated.milestones.slice(0, 4).map((m: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary">Age {m.age} — Treated</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary ml-auto">{m.riskLevel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.narrative}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <Brain className="w-10 h-10 text-primary flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold mb-1">Complete Your Assessment for a Personalized Map</h3>
              <p className="text-muted-foreground text-sm">The 100-question DSM-5 intake generates a Life Map tailored to your specific symptom profile.</p>
            </div>
            <Link href="/assessment">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0">
                <Brain className="w-4 h-4 mr-2" />Start Assessment
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          Life Maps are statistical projections based on published epidemiological research. Individual outcomes vary. Not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
}
