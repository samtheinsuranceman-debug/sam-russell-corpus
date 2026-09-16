import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Heart, Moon, Dumbbell, Apple, Users, Brain, ListChecks } from "lucide-react";

const FOCUS = [
  { id: "sleep", label: "Sleep routine", icon: Moon, actions: ["Keep a consistent wind-down window", "Reduce bright screens before your chosen bedtime", "Write tomorrow's first task before bed"] },
  { id: "movement", label: "Movement", icon: Dumbbell, actions: ["Take a 10-minute comfortable walk", "Add a short stretch or mobility break", "Choose one enjoyable form of movement"] },
  { id: "nutrition", label: "Everyday nutrition", icon: Apple, actions: ["Plan one balanced meal ahead", "Keep water visible and easy to reach", "Notice which meals leave you feeling steady"] },
  { id: "mindfulness", label: "Attention reset", icon: Brain, actions: ["Take 60 seconds to notice five things around you", "Write one sentence about what matters today", "Try three slow, comfortable breaths without forcing a pace"] },
  { id: "connection", label: "Social connection", icon: Users, actions: ["Send one genuine check-in to someone you trust", "Protect ten minutes for an undistracted conversation", "Name one person you can contact when you want support"] },
  { id: "organization", label: "Daily organization", icon: ListChecks, actions: ["Pick one priority for today", "Break one task into a five-minute starting step", "Close one small open loop before adding another"] },
] as const;

const STORAGE_KEY = "doctorbuddy_public_wellness_plan_v1";

type StoredPlan = { selected: string[]; completed: Record<string, boolean> };

function loadPlan(): StoredPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { selected: [], completed: {} };
  } catch {
    return { selected: [], completed: {} };
  }
}

export default function GeneralWellnessPlan() {
  const initial = useMemo(loadPlan, []);
  const [selected, setSelected] = useState<string[]>(initial.selected);
  const [completed, setCompleted] = useState<Record<string, boolean>>(initial.completed);

  const save = (nextSelected = selected, nextCompleted = completed) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ selected: nextSelected, completed: nextCompleted }));
  };

  const toggleFocus = (id: string) => {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
    setSelected(next);
    save(next, completed);
  };

  const toggleAction = (key: string) => {
    const next = { ...completed, [key]: !completed[key] };
    setCompleted(next);
    save(selected, next);
  };

  const active = FOCUS.filter(f => selected.includes(f.id));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-5xl py-8">
        <div className="mb-7">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-2"><Heart className="w-5 h-5 text-primary" /> General Wellness Routine</div>
          <h1 className="text-3xl font-bold text-foreground">Build a routine around what matters to you</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">Choose everyday wellness areas and Doctor Buddy will turn them into small, non-medical actions. This does not diagnose a condition, create a treatment plan, or replace individualized advice from a licensed professional.</p>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Choose your focus areas</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FOCUS.map(({ id, label, icon: Icon }) => {
              const on = selected.includes(id);
              return <button key={id} onClick={() => toggleFocus(id)} className={`text-left rounded-xl border p-4 transition-all ${on ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><span className="font-medium">{label}</span>{on && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}</div>
              </button>;
            })}
          </CardContent>
        </Card>

        {active.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Select one or more areas above. The routine stays on this device until you choose otherwise.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {active.map(({ id, label, icon: Icon, actions }) => (
              <Card key={id}>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{label}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {actions.map((action, index) => {
                    const key = `${id}:${index}`;
                    const done = !!completed[key];
                    return <button key={key} onClick={() => toggleAction(key)} className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 text-left">
                      {done ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
                      <span className={done ? "line-through text-muted-foreground" : "text-foreground"}>{action}</span>
                    </button>;
                  })}
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={() => { setCompleted({}); save(selected, {}); }}>Reset checkmarks</Button>
          </div>
        )}
      </main>
    </div>
  );
}
