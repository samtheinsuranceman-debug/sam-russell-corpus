import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CheckCircle2, RotateCcw } from "lucide-react";

const QUESTIONS = [
  "How satisfied are you with your sleep routine lately?",
  "How manageable does your day-to-day stress feel?",
  "How connected do you feel to people who matter to you?",
  "How much energy do you usually have for the things you value?",
  "How easy is it to focus on what matters when you want to?",
  "How consistent are your meals, movement, and basic routines?",
  "How confident are you in handling difficult emotions without acting impulsively?",
  "How much time are you giving to activities that feel meaningful?",
  "How supported do you feel when life gets difficult?",
  "How well are your current habits aligned with your stated goals?",
  "How comfortable are you asking for help when you need it?",
  "Overall, how much room for improvement do you feel in your current wellbeing routine?",
];

export default function WellnessIntake() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const complete = Object.keys(answers).length === QUESTIONS.length;
  const avg = useMemo(() => complete ? Object.values(answers).reduce((a,b)=>a+b,0) / QUESTIONS.length : 0, [answers, complete]);
  const focus = useMemo(() => QUESTIONS.map((q,i)=>({q, score:answers[i] ?? 6})).sort((a,b)=>a.score-b.score).slice(0,3), [answers]);

  return <div className="min-h-screen bg-background"><NavBar/><main className="container max-w-3xl py-10">
    <div className="mb-7"><div className="flex items-center gap-2 text-cyan-400 text-xs uppercase tracking-wider mb-2"><Brain className="w-4 h-4"/>Wellness reflection</div><h1 className="text-3xl font-bold">12-question personal check-in</h1><p className="text-muted-foreground mt-2">This is a self-reflection tool—not a diagnostic test, psychiatric assessment, clinical risk score, or medical evaluation. Your answers are scored only to help you choose areas you want to work on.</p></div>
    {!complete ? <div className="space-y-4">{QUESTIONS.map((q,i)=><Card key={q}><CardContent className="pt-5"><p className="font-medium mb-3">{i+1}. {q}</p><div className="flex flex-wrap gap-2">{Array.from({length:10},(_,n)=>n+1).map(n=><button key={n} onClick={()=>setAnswers(a=>({...a,[i]:n}))} className={`w-9 h-9 rounded-md border text-sm ${answers[i]===n?'bg-cyan-500 text-black border-cyan-400':'border-border hover:border-cyan-400/50'}`}>{n}</button>)}</div><div className="flex justify-between text-[10px] text-muted-foreground mt-2"><span>1 = not at all</span><span>10 = very much</span></div></CardContent></Card>)}<div className="text-xs text-muted-foreground">{Object.keys(answers).length}/{QUESTIONS.length} answered</div></div> : <Card className="border-cyan-500/25"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-emerald-400"/>Your reflection summary</CardTitle></CardHeader><CardContent className="space-y-5"><p className="text-muted-foreground">Your average self-rating was <strong className="text-foreground">{avg.toFixed(1)}/10</strong>. That number has no diagnostic meaning; it is simply a snapshot of how you rated these areas today.</p><div><p className="font-semibold mb-2">Three areas you rated lowest</p><div className="space-y-2">{focus.map(x=><div key={x.q} className="rounded-lg bg-secondary/30 p-3 text-sm"><strong>{x.score}/10</strong> — {x.q}</div>)}</div></div><p className="text-sm text-muted-foreground">Pick one area—not all three—and use the Adaptive Support Lab to turn it into one small, voluntary next step. If a concern feels medical, severe, persistent, or unsafe, bring it to a licensed professional rather than relying on this score.</p><Button variant="outline" onClick={()=>setAnswers({})}><RotateCcw className="w-4 h-4 mr-2"/>Start over</Button></CardContent></Card>}
  </main></div>;
}
