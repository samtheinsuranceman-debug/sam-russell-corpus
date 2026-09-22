import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PUBLIC_WELLNESS_MODE } from "@/lib/releasePolicy";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen, Brain, Sparkles, AlertTriangle, TrendingUp,
  TrendingDown, Minus, ChevronDown, ChevronUp, Heart, Activity,
  Moon, Coffee, Pill, Wine, Dumbbell, Users, Briefcase, CloudRain,
  Zap, X
} from "lucide-react";

const MOOD_TREND_CONFIG: Record<string, { color: string; icon: typeof TrendingUp; label: string }> = {
  "Stable Positive": { color: "text-green-400 bg-green-400/10 border-green-400/30", icon: TrendingUp, label: "Stable Positive" },
  "Stable Negative": { color: "text-red-400 bg-red-400/10 border-red-400/30", icon: TrendingDown, label: "Stable Negative" },
  "Improving": { color: "text-primary bg-primary/10 border-primary/30", icon: TrendingUp, label: "Improving" },
  "Declining": { color: "text-orange-400 bg-orange-400/10 border-orange-400/30", icon: TrendingDown, label: "Declining" },
  "Volatile": { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: Activity, label: "Volatile" },
  "Neutral": { color: "text-muted-foreground bg-secondary/30 border-border", icon: Minus, label: "Neutral" },
};

const SENTIMENT_COLORS = ["text-red-400", "text-orange-400", "text-yellow-400", "text-green-400", "text-primary"];

const TRIGGER_OPTIONS = [
  { id: "poor_sleep", label: "Poor Sleep", icon: Moon, color: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10" },
  { id: "caffeine", label: "Caffeine", icon: Coffee, color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  { id: "medication", label: "Medication", icon: Pill, color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
  { id: "alcohol", label: "Alcohol", icon: Wine, color: "text-purple-400 border-purple-400/30 bg-purple-400/10" },
  { id: "exercise", label: "Exercise", icon: Dumbbell, color: "text-green-400 border-green-400/30 bg-green-400/10" },
  { id: "social", label: "Social Event", icon: Users, color: "text-pink-400 border-pink-400/30 bg-pink-400/10" },
  { id: "work_stress", label: "Work Stress", icon: Briefcase, color: "text-orange-400 border-orange-400/30 bg-orange-400/10" },
  { id: "weather", label: "Weather", icon: CloudRain, color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" },
  { id: "conflict", label: "Conflict", icon: Zap, color: "text-red-400 border-red-400/30 bg-red-400/10" },
];

function SentimentBar({ label, value }: { label: string; value: number }) {
  const colorIdx = Math.floor((value / 100) * 4);
  const color = SENTIMENT_COLORS[Math.min(colorIdx, 4)];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 shrink-0 capitalize">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-current ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-mono w-8 text-right ${color}`}>{value}</span>
    </div>
  );
}

function MoodChart({ entries }: { entries: Array<{ moodScore: number | null; createdAt: string | number }> }) {
  const chartData = useMemo(() => {
    const sorted = [...entries]
      .filter(e => e.moodScore != null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-30);
    return sorted;
  }, [entries]);

  if (chartData.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
        Need at least 2 entries with mood scores to show the chart.
      </div>
    );
  }

  const maxScore = 10;
  const width = 100;
  const height = 40;
  const padding = 2;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const points = chartData.map((d, i) => ({
    x: padding + (i / (chartData.length - 1)) * usableW,
    y: padding + usableH - ((d.moodScore! / maxScore) * usableH),
    score: d.moodScore!,
    date: new Date(d.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = pathD + ` L ${points[points.length - 1].x} ${padding + usableH} L ${points[0].x} ${padding + usableH} Z`;

  const avg = chartData.reduce((s, d) => s + (d.moodScore || 0), 0) / chartData.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">Mood Trend (Last 30 entries)</span>
        <span className="text-xs font-mono text-primary">Avg: {avg.toFixed(1)}/10</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[2, 4, 6, 8].map(v => {
          const y = padding + usableH - ((v / maxScore) * usableH);
          return <line key={v} x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.2" />;
        })}
        {/* Area fill */}
        <path d={areaD} fill="url(#moodGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="hsl(160, 84%, 39%)" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="0.8" fill={p.score >= 7 ? "hsl(160, 84%, 39%)" : p.score >= 4 ? "hsl(45, 93%, 47%)" : "hsl(0, 84%, 60%)"} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">{points[0]?.date}</span>
        <span className="text-[10px] text-muted-foreground">{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

import { usePageTitle } from "@/lib/usePageTitle";
export default function MoodJournal() {
  usePageTitle("Journal");
  const { isAuthenticated, loading } = useAuth();
  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [anxietyRating, setAnxietyRating] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastResult, setLastResult] = useState<{
    emotionTags: string[];
    sentimentDimensions: Record<string, number>;
    moodTrend: string;
    aiInsight: string;
    riskFlagged: boolean;
  } | null>(null);

  const { data: entries, refetch } = trpc.journal.list.useQuery(
    { limit: 30 },
    { enabled: isAuthenticated }
  );

  const createEntry = trpc.journal.create.useMutation({
    onSuccess: (data) => {
      setLastResult(data);
      setContent("");
      setMoodScore(null);
      setSelectedTriggers([]);
      setSleepHours(null);
      setAnxietyRating(null);
      refetch();
      if (data.riskFlagged) {
        toast.warning("Crisis support resources are available at /crisis. You are not alone.", {
          duration: 8000,
          action: { label: "View Resources", onClick: () => window.location.href = "/crisis" },
        });
      } else {
        toast.success(PUBLIC_WELLNESS_MODE ? "Journal entry saved." : "Journal entry saved and analyzed.");
      }
    },
    onError: () => toast.error("Failed to save entry. Please try again."),
  });

  const toggleTrigger = (id: string) => {
    setSelectedTriggers(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-24 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-24 max-w-md text-center">
          <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Your journal is tied to your account. Sign in to start writing.</p>
          <a href={getLoginUrl("/journal")}><Button className="bg-primary text-primary-foreground">Sign In</Button></a>
        </div>
      </div>
    );
  }

  const trendConfig = lastResult ? (MOOD_TREND_CONFIG[lastResult.moodTrend] || MOOD_TREND_CONFIG["Neutral"]) : null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">{PUBLIC_WELLNESS_MODE ? "Private Reflection Journal" : "AI-Powered Mental Health Journal"}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Mood Journal</h1>
          <p className="text-muted-foreground text-sm">
            {PUBLIC_WELLNESS_MODE
              ? "Write freely and optionally record your own mood, sleep, and context. In the public wellness edition, journal entries are not automatically scored for psychiatric risk or diagnosis."
              : "Write freely — AI analyzes each entry for sentiment, emotion tags, and risk indicators in real time. Track triggers, sleep, and anxiety to identify patterns over time."}
          </p>
        </div>

        {/* Mood Chart */}
        {entries && entries.length >= 2 && (
          <Card className="border-border bg-card mb-6">
            <CardContent className="pt-4 pb-3">
              <MoodChart entries={entries.map(e => ({ moodScore: e.moodScore, createdAt: e.createdAt instanceof Date ? e.createdAt.getTime() : e.createdAt }))} />
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Entry Form */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  New Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mood Score */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Overall Mood (1-10)</p>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => setMoodScore(n)}
                        className={`w-8 h-8 rounded-md text-xs font-bold border transition-all ${
                          moodScore === n
                            ? n <= 3 ? "bg-red-500/20 border-red-500/50 text-red-400"
                              : n <= 6 ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                              : "bg-primary/20 border-primary/50 text-primary"
                            : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trigger Logging */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Triggers, Sleep & Anxiety
                    {(selectedTriggers.length > 0 || sleepHours !== null || anxietyRating !== null) && (
                      <Badge variant="outline" className="text-[10px] ml-1 border-primary/30 text-primary">
                        {[selectedTriggers.length > 0 && `${selectedTriggers.length} triggers`, sleepHours !== null && `${sleepHours}h sleep`, anxietyRating !== null && `anxiety ${anxietyRating}`].filter(Boolean).join(", ")}
                      </Badge>
                    )}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 p-3 rounded-lg border border-border bg-secondary/10">
                      {/* Triggers */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 font-medium">What influenced your mood today?</p>
                        <div className="flex flex-wrap gap-1.5">
                          {TRIGGER_OPTIONS.map(t => {
                            const Icon = t.icon;
                            const active = selectedTriggers.includes(t.id);
                            return (
                              <button
                                key={t.id}
                                onClick={() => toggleTrigger(t.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-all ${
                                  active ? t.color + " font-medium" : "border-border text-muted-foreground hover:border-primary/30"
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                                {t.label}
                                {active && <X className="w-2.5 h-2.5 ml-0.5 opacity-60" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sleep Hours */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
                          <Moon className="w-3 h-3" /> Hours of Sleep
                        </p>
                        <div className="flex gap-1">
                          {[3, 4, 5, 6, 7, 8, 9, 10].map(h => (
                            <button
                              key={h}
                              onClick={() => setSleepHours(sleepHours === h ? null : h)}
                              className={`w-8 h-7 rounded text-xs font-medium border transition-all ${
                                sleepHours === h
                                  ? h <= 5 ? "bg-red-500/20 border-red-500/50 text-red-400"
                                    : h <= 7 ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                                    : "bg-primary/20 border-primary/50 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/30"
                              }`}
                            >
                              {h}h
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Anxiety Rating */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Anxiety Level (1-10)
                        </p>
                        <div className="flex gap-1">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                            <button
                              key={n}
                              onClick={() => setAnxietyRating(anxietyRating === n ? null : n)}
                              className={`w-7 h-7 rounded text-xs font-medium border transition-all ${
                                anxietyRating === n
                                  ? n >= 8 ? "bg-red-500/20 border-red-500/50 text-red-400"
                                    : n >= 5 ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                                    : "bg-primary/20 border-primary/50 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/30"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={PUBLIC_WELLNESS_MODE ? "Write as much or as little as you like. This journal records what you enter without assigning a diagnosis or psychiatric risk score." : "How are you feeling today? Write as much or as little as you like. Your thoughts are private and will be analyzed by AI to provide insights..."}
                  className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground resize-none h-48 text-sm leading-relaxed"
                  maxLength={5000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{content.length}/5000</span>
                  <Button
                    onClick={() => createEntry.mutate({
                      content,
                      moodScore: moodScore ?? undefined,
                      triggers: selectedTriggers.length > 0 ? selectedTriggers : undefined,
                      sleepHours: sleepHours ?? undefined,
                      anxietyRating: anxietyRating ?? undefined,
                    })}
                    disabled={content.length < 10 || createEntry.isPending}
                    className="bg-primary text-primary-foreground"
                  >
                    {createEntry.isPending ? (
                      <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-pulse" /> Saving...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> {PUBLIC_WELLNESS_MODE ? "Save Entry" : "Save & Analyze"}</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Result */}
            {!PUBLIC_WELLNESS_MODE && lastResult && trendConfig && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Analysis
                    <Badge className={`text-[10px] ml-auto ${trendConfig.color}`}>
                      <trendConfig.icon className="w-3 h-3 mr-1" />
                      {trendConfig.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lastResult.riskFlagged && (
                    <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-300">Crisis Support Available</p>
                        <p className="text-xs text-red-400/80 mt-0.5">
                          Your entry contains language that may indicate distress. Please reach out — you are not alone.
                          <a href="/crisis" className="underline ml-1">View Crisis Resources</a>
                        </p>
                      </div>
                    </div>
                  )}
                  {lastResult.aiInsight && (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1">
                        <Heart className="w-3 h-3 text-primary" /> AI Reflection
                      </p>
                      <p className="text-sm text-foreground leading-relaxed italic">"{lastResult.aiInsight}"</p>
                    </div>
                  )}
                  {lastResult.emotionTags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Detected Emotions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lastResult.emotionTags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 capitalize">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.keys(lastResult.sentimentDimensions).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Sentiment Dimensions</p>
                      <div className="space-y-2">
                        {Object.entries(lastResult.sentimentDimensions).map(([key, val]) => (
                          <SentimentBar key={key} label={key} value={Math.round(val)} />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Entry History */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Recent Entries
            </h2>
            {!entries || entries.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="pt-6 text-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No entries yet. Write your first entry to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {entries.map(entry => {
                  const trend = MOOD_TREND_CONFIG[entry.moodTrend || "Neutral"] || MOOD_TREND_CONFIG["Neutral"];
                  const TrendIcon = trend.icon;
                  const triggers = (entry as Record<string, unknown>).triggers as string[] | null;
                  return (
                    <Card key={entry.id} className="border-border bg-card hover:border-primary/30 transition-colors">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                          <div className="flex items-center gap-1">
                            {entry.riskFlagged && <AlertTriangle className="w-3 h-3 text-red-400" />}
                            {entry.moodScore && (
                              <span className={`text-xs font-bold ${entry.moodScore >= 7 ? "text-primary" : entry.moodScore >= 4 ? "text-yellow-400" : "text-red-400"}`}>
                                {entry.moodScore}/10
                              </span>
                            )}
                            <TrendIcon className={`w-3 h-3 ${trend.color.split(" ")[0]}`} />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{entry.content}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(entry.emotionTags as string[] | null)?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] border-border text-muted-foreground capitalize">{tag}</Badge>
                          ))}
                          {triggers && triggers.length > 0 && (
                            <Badge variant="outline" className="text-[10px] border-orange-400/30 text-orange-400">
                              {triggers.length} trigger{triggers.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
