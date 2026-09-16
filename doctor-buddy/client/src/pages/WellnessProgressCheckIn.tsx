import { useMemo, useState } from "react";
import { Link } from "wouter";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowLeft, CheckCircle2, Shield } from "lucide-react";

const AREAS = [
  ["mood", "Overall mood"],
  ["energy", "Energy for everyday tasks"],
  ["sleep", "How rested you feel"],
  ["connection", "Sense of connection"],
  ["focus", "Ability to focus"],
] as const;

export default function WellnessProgressCheckIn() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const complete = AREAS.every(([id]) => scores[id]);
  const average = useMemo(() => {
    const values = Object.values(scores);
    return values.length ? values.reduce((a,b)=>a+b,0) / values.length : 0;
  }, [scores]);

  const save = () => {
    if (!complete) return;
    const key = "doctorbuddy-wellness-checkins-v1";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), scores, average });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 90)));
    setSaved(true);
  };

  return <div className="min-h-screen bg-background"><NavBar/><main className="container py-8 max-w-2xl">
    <Link href="/patient"><Button variant="ghost" size="sm" className="mb-4"><ArrowLeft className="w-4 h-4 mr-1"/>My Space</Button></Link>
    <div className="mb-6"><div className="flex items-center gap-2 text-cyan-400 text-xs uppercase tracking-wider mb-2"><Activity className="w-4 h-4"/>Personal wellness check-in</div><h1 className="text-3xl font-bold">How does today feel?</h1><p className="text-muted-foreground mt-2">Rate a few everyday areas for your own reflection. These ratings stay in this browser, have no diagnostic meaning, and do not create a psychiatric risk score or clinical trajectory.</p></div>
    {saved ? <Card className="border-emerald-500/25"><CardContent className="pt-6 text-center"><CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3"/><h2 className="font-bold text-xl">Check-in saved locally</h2><p className="text-muted-foreground mt-2">Your average self-rating was {average.toFixed(1)}/5. That number is only a personal snapshot, not a medical score.</p><div className="flex gap-2 justify-center mt-5"><Button onClick={()=>{setScores({});setSaved(false)}}>New check-in</Button><Link href="/support-lab"><Button variant="outline">Use Support Lab</Button></Link></div></CardContent></Card> : <Card><CardHeader><CardTitle className="text-base">Choose 1–5 for each area</CardTitle></CardHeader><CardContent className="space-y-5">
      {AREAS.map(([id,label])=><div key={id}><p className="font-medium mb-2">{label}</p><div className="flex gap-2">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setScores(v=>({...v,[id]:n}))} className={`w-11 h-10 rounded-md border ${scores[id]===n?'bg-cyan-500 text-black border-cyan-400':'border-border hover:border-cyan-400/50'}`}>{n}</button>)}</div></div>)}
      <Button onClick={save} disabled={!complete} className="w-full">Save to this browser</Button>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground flex gap-2"><Shield className="w-4 h-4 text-amber-300 shrink-0"/><span>If you feel unsafe or may hurt yourself or someone else, do not rely on a score or this app. In the U.S., call or text 988, or call 911 for immediate danger.</span></div>
    </CardContent></Card>}
  </main></div>;
}
