import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Brain, CheckCircle, ChevronRight, Activity,
  Moon, Users, Zap, Heart, AlertTriangle, Smile, Frown, Meh
} from "lucide-react";

const MOOD_OPTIONS = [
  { value: 1, label: "Very Low", icon: Frown, color: "text-red-400 border-red-400/30 bg-red-400/5" },
  { value: 2, label: "Low", icon: Frown, color: "text-orange-400 border-orange-400/30 bg-orange-400/5" },
  { value: 3, label: "Neutral", icon: Meh, color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5" },
  { value: 4, label: "Good", icon: Smile, color: "text-green-400 border-green-400/30 bg-green-400/5" },
  { value: 5, label: "Excellent", icon: Smile, color: "text-primary border-primary/30 bg-primary/5" },
];

const SYMPTOM_DOMAINS = [
  { id: "anxiety", label: "Anxiety Level", icon: Zap, description: "How anxious or on-edge do you feel?" },
  { id: "sleep", label: "Sleep Quality", icon: Moon, description: "How well did you sleep last night?" },
  { id: "energy", label: "Energy / Motivation", icon: Activity, description: "How is your energy and drive today?" },
  { id: "social", label: "Social Connection", icon: Users, description: "How connected do you feel to others?" },
  { id: "physical", label: "Physical Wellbeing", icon: Heart, description: "How is your physical health today?" },
  { id: "crisis", label: "Safety & Stability", icon: AlertTriangle, description: "Do you feel safe and stable right now?" },
];

const SCALE_LABELS: Record<string, string[]> = {
  anxiety: ["None", "Mild", "Moderate", "High", "Severe"],
  sleep: ["Terrible", "Poor", "Fair", "Good", "Excellent"],
  energy: ["Depleted", "Low", "Moderate", "Good", "High"],
  social: ["Isolated", "Withdrawn", "Neutral", "Connected", "Very Connected"],
  physical: ["Very Poor", "Poor", "Fair", "Good", "Excellent"],
  crisis: ["Unsafe", "Unstable", "Uncertain", "Stable", "Very Stable"],
};

export default function ProgressCheckIn() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateTwin = trpc.digitalTwin.updateFromJournal.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Check-in recorded! Your Digital Twin has been updated.");
    },
    onError: () => toast.error("Failed to save check-in. Please try again."),
  });

  const handleSymptomChange = (domainId: string, value: number) => {
    setSymptoms(prev => ({ ...prev, [domainId]: value }));
  };

  const allAnswered = mood !== null && SYMPTOM_DOMAINS.every(d => symptoms[d.id] !== undefined);

  const handleSubmit = () => {
    if (!allAnswered || mood === null) return;
    // Map check-in values to the updateFromJournal schema
    // mood 1-5 → moodScore 1-10 (scale up)
    // anxiety domain: 1=none → 10, 5=severe → 1 (invert)
    // sleep domain: 1=terrible → 1h, 5=excellent → 9h
    // social domain: 1-5 maps directly
    updateTwin.mutate({
      moodScore: mood * 2,
      anxietyScore: (6 - (symptoms["anxiety"] ?? 3)) * 2,
      sleepHours: [3, 5, 6.5, 7.5, 9][symptoms["sleep"] - 1] ?? 7,
      socialInteraction: symptoms["social"] ?? 3,
      note: [
        `Daily Check-In — Mood: ${MOOD_OPTIONS.find(m => m.value === mood)?.label}`,
        ...SYMPTOM_DOMAINS.map(d => `${d.label}: ${SCALE_LABELS[d.id][(symptoms[d.id] ?? 3) - 1]}`),
        notes ? `Notes: ${notes}` : "",
      ].filter(Boolean).join(". "),
    });
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
          <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Progress check-ins are saved to your Digital Twin and require an account.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-primary text-primary-foreground">Sign In to Continue</Button>
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-24 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Check-In Complete</h2>
          <p className="text-muted-foreground mb-8">Your Digital Twin has been updated with today's data. Keep checking in daily for the most accurate mental health trajectory.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/digital-twin")} className="bg-primary text-primary-foreground">
              View Digital Twin <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="outline" onClick={() => { setSubmitted(false); setMood(null); setSymptoms({}); setNotes(""); }}>
              New Check-In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Daily Mental Health Check-In</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">How Are You Today?</h1>
          <p className="text-muted-foreground text-sm">
            Your responses update your Digital Twin in real time, enabling more accurate trajectory tracking and proactive alerts.
          </p>
        </div>

        {/* Mood Selector */}
        <Card className="border-border bg-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Overall Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setMood(value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                    mood === value
                      ? color + " ring-1 ring-current"
                      : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:bg-secondary/40"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Symptom Domains */}
        <div className="space-y-4 mb-6">
          {SYMPTOM_DOMAINS.map(({ id, label, icon: Icon, description }) => (
            <Card key={id} className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  {label}
                  <span className="text-xs text-muted-foreground font-normal ml-1">— {description}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {SCALE_LABELS[id].map((scaleLabel, i) => {
                    const val = i + 1;
                    const isSelected = symptoms[id] === val;
                    // Color scale: 1=red, 2=orange, 3=yellow, 4=green, 5=primary
                    const colors = [
                      "text-red-400 border-red-400/30 bg-red-400/5",
                      "text-orange-400 border-orange-400/30 bg-orange-400/5",
                      "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
                      "text-green-400 border-green-400/30 bg-green-400/5",
                      "text-primary border-primary/30 bg-primary/5",
                    ];
                    return (
                      <button
                        key={val}
                        onClick={() => handleSymptomChange(id, val)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all ${
                          isSelected
                            ? colors[i] + " ring-1 ring-current"
                            : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span className="text-sm font-bold">{val}</span>
                        <span className="leading-tight text-center">{scaleLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Optional Notes */}
        <Card className="border-border bg-card mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Additional Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything specific you'd like to note about today — events, triggers, wins, concerns..."
              className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground resize-none h-24"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{notes.length}/500</p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {allAnswered ? (
              <span className="text-primary flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> All fields complete
              </span>
            ) : (
              <span>{SYMPTOM_DOMAINS.filter(d => symptoms[d.id] === undefined).length + (mood === null ? 1 : 0)} fields remaining</span>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || updateTwin.isPending}
            className="bg-primary text-primary-foreground glow-green-sm"
          >
            {updateTwin.isPending ? (
              <span className="animate-pulse">Updating Twin...</span>
            ) : (
              <>Submit Check-In <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
