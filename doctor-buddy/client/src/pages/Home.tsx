import { Link } from "wouter";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MEMBERSHIP_PRICE } from "@/lib/releasePolicy";
import {
  Brain, BrainCircuit, Heart, ShieldCheck, LockKeyhole, MessageCircleMore,
  Sparkles, BookOpen, CheckCircle2, ArrowRight, UserRound, Stethoscope,
  Pill, FileText, RefreshCw, EyeOff, Landmark } from "lucide-react";

const MODES = [
  { icon: MessageCircleMore, title: "Friend Zone", copy: "Warm, plainspoken, encouraging conversation with gentle questions and one practical next step." },
  { icon: Heart, title: "Therapist Zone", copy: "Structured reflective listening, values clarification, pattern exploration, and low-risk coping-skill education." },
  { icon: Stethoscope, title: "Psychiatrist Zone", copy: "Clinically literate educational language that helps you organize questions for a licensed professional—without diagnosis or prescribing." },
];

const FEATURES = [
  { icon: BrainCircuit, title: "50 adaptive support engines", copy: "Decision, identity, regulation, relationship, meaning, privacy, and reflection tools that adapt to what you choose to work on." },
  { icon: Brain, title: "Wellness check-in", copy: "A non-diagnostic self-reflection flow that highlights the areas you personally rated as needing attention." },
  { icon: Sparkles, title: "AI support & education", copy: "General education, structured reflection, care-preparation, and question generation with server-enforced medical boundaries." },
  { icon: BookOpen, title: "Research-aware learning", copy: "Explore general mental-health and wellness information, then bring individualized medical questions to the licensed professional responsible for your care." },
  { icon: Pill, title: "Medication organizer", copy: "Keep your own list and reminders organized. Doctor Buddy does not choose medications, doses, tapers, or start/stop instructions." },
  { icon: Landmark, title: "Money planning that respects how you feel", copy: "Fifty-six educational financial calculators and six strategy explainers sit behind guardrails set by your own wellness check-ins: a cooling-off period, a cash cushion, a borrowing limit, and a pause you can set for yourself. Education only, never individualized advice." },
  { icon: FileText, title: "User-controlled history", copy: "Save the pieces that help you, keep support sessions ephemeral where offered, and delete consumer health data from your account." },
];

const PRIVACY = [
  { icon: EyeOff, title: "No health-data advertising", copy: "Health-related prompts, journal content, support conversations, and medication information are not used for targeted ads." },
  { icon: LockKeyhole, title: "Minimum necessary collection", copy: "Sensitive features ask for consent first, and the app avoids collecting identity fields simply to record that consent." },
  { icon: RefreshCw, title: "Delete and export controls", copy: "Account tools are designed to let users export their information and delete consumer health data without turning privacy into a support ticket maze." },
];

const PLANS = [
  { id: "insight", name: "Doctor Buddy Membership", price: MEMBERSHIP_PRICE, copy: "Full public wellness edition", features: ["50-engine Adaptive Support Lab", "Wellness check-ins", "Private reflection journal", "AI reflection & education", "Research & care-preparation tools"] },
];

export default function Home() {
  return <div className="min-h-screen bg-background text-foreground">
    <NavBar />

    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0 grid-overlay opacity-50" />
      <div className="container relative py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-5 border-cyan-400/30 text-cyan-300 bg-cyan-400/5">WELLNESS • REFLECTION • EDUCATION • CARE PREPARATION</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5">A smarter support system that <span className="gradient-text">knows where its authority ends.</span></h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-7">Doctor Buddy helps adults think more clearly, build useful routines, prepare better questions, and work through decisions with 50 adaptive support engines and three communication styles. It is not a doctor, therapist, psychiatrist, medical practice, or emergency service.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/support-lab"><Button size="lg"><BrainCircuit className="w-4 h-4 mr-2"/>Explore Adaptive Support</Button></Link>
            <Link href="/assessment"><Button size="lg" variant="outline"><Brain className="w-4 h-4 mr-2"/>Take the Wellness Check-In</Button></Link>
            <Link href="/finance"><Button size="lg" variant="outline"><Landmark className="w-4 h-4 mr-2"/>Explore Financial Readiness</Button></Link>
          </div>
          <p className="text-xs text-muted-foreground mt-5">Adults 18+ • No diagnosis • No prescribing • No individualized medication changes</p>
        </div>
      </div>
    </section>

    <section className="container py-16">
      <div className="max-w-3xl mb-8"><div className="text-cyan-400 text-xs tracking-[0.18em] uppercase mb-2">Choose how it talks with you</div><h2 className="text-3xl font-bold mb-3">Three zones. One safety boundary.</h2><p className="text-muted-foreground">The zones change communication style—not professional identity. Doctor Buddy remains software in every mode.</p></div>
      <div className="grid md:grid-cols-3 gap-5">{MODES.map(({icon:Icon,title,copy})=><Card key={title} className="bg-card/70"><CardHeader><Icon className="w-8 h-8 text-cyan-400 mb-2"/><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground leading-relaxed">{copy}</p><p className="text-[11px] text-amber-300/80 mt-4">Communication style only — not licensed care.</p></CardContent></Card>)}</div>
    </section>

    <section className="border-y border-border/50 bg-secondary/10">
      <div className="container py-16">
        <div className="max-w-3xl mb-8"><div className="text-violet-400 text-xs tracking-[0.18em] uppercase mb-2">Built for actual use</div><h2 className="text-3xl font-bold mb-3">Useful without pretending to practice medicine.</h2><p className="text-muted-foreground">The public edition stays in the general-wellness, education, organization, and reflection lane. Clinical decision-support modules are server-disabled unless the operator intentionally deploys a separate regulated configuration.</p></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{FEATURES.map(({icon:Icon,title,copy})=><Card key={title}><CardContent className="pt-6"><Icon className="w-7 h-7 text-violet-400 mb-3"/><h3 className="font-semibold mb-2">{title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{copy}</p></CardContent></Card>)}</div>
      </div>
    </section>

    <section className="container py-16">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
        <div><Badge variant="outline" className="border-emerald-400/30 text-emerald-300 mb-4"><ShieldCheck className="w-3 h-3 mr-1.5"/>PRIVACY BY DEFAULT</Badge><h2 className="text-3xl font-bold mb-3">Sensitive information should not become ad inventory.</h2><p className="text-muted-foreground leading-relaxed mb-5">Doctor Buddy is designed around explicit health-data consent, minimal collection, no targeted advertising with health data, and clear user controls.</p><Link href="/health-data-privacy" className="text-cyan-400 text-sm inline-flex items-center gap-1">Read the separate Consumer Health Data Privacy Policy <ArrowRight className="w-3 h-3"/></Link></div>
        <div className="space-y-4">{PRIVACY.map(({icon:Icon,title,copy})=><div key={title} className="rounded-xl border border-border bg-card p-5 flex gap-4"><Icon className="w-6 h-6 text-emerald-400 shrink-0"/><div><h3 className="font-semibold mb-1">{title}</h3><p className="text-sm text-muted-foreground">{copy}</p></div></div>)}</div>
      </div>
    </section>

    <section className="border-y border-border/50 bg-secondary/10" id="pricing">
      <div className="container py-16">
        <div className="max-w-3xl mx-auto text-center mb-9"><div className="text-cyan-400 text-xs tracking-[0.18em] uppercase mb-2">Paid wellness access</div><h2 className="text-3xl font-bold mb-3">Simple monthly membership</h2><p className="text-muted-foreground">Every checkout must show the recurring price and cancellation terms before you pay. A subscription buys product access—not medical care.</p></div>
        <div className="max-w-md mx-auto">{PLANS.map(plan=><Card key={plan.id} className="border-cyan-400/50 shadow-lg shadow-cyan-500/5"><CardHeader><div><CardTitle>{plan.name}</CardTitle><p className="text-sm text-muted-foreground mt-1">{plan.copy}</p></div><div className="mt-4"><span className="text-4xl font-bold">{plan.price}</span><span className="text-muted-foreground"> / month</span></div></CardHeader><CardContent><div className="space-y-2 mb-6">{plan.features.map(f=><div key={f} className="text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>{f}</div>)}</div><Link href="/subscribe"><Button className="w-full">Review recurring terms</Button></Link></CardContent></Card>)}</div>
      </div>
    </section>

    <section className="container py-12">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 max-w-4xl mx-auto">
        <div className="flex gap-4"><UserRound className="w-7 h-7 text-amber-300 shrink-0"/><div><h2 className="font-semibold text-lg mb-2">Medical and crisis boundary</h2><p className="text-sm text-muted-foreground leading-relaxed">Doctor Buddy can help organize thoughts and questions, but it cannot examine you, verify a diagnosis, prescribe treatment, monitor you continuously, or guarantee crisis detection. If you are in immediate danger in the United States, call 911. For suicide or crisis support, call or text 988. Outside the U.S., use local emergency services.</p><Link href="/medical-disclaimer" className="text-cyan-400 text-sm mt-3 inline-block">Read the full Wellness & Medical Disclaimer</Link></div></div>
      </div>
    </section>

    <footer className="border-t border-border/50">
      <div className="container py-8 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
        <div><div className="font-semibold">Doctor Buddy</div><div className="text-xs text-muted-foreground mt-1">Wellness support software for adults 18+</div></div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/health-data-privacy" className="text-cyan-400 font-medium">Consumer Health Data Privacy</Link><Link href="/medical-disclaimer">Medical Disclaimer</Link><Link href="/financial-disclaimer">Financial Disclaimer</Link><Link href="/subscription-terms">Subscription Terms</Link><Link href="/crisis">Crisis Resources</Link>
        </div>
      </div>
    </footer>
  </div>;
}
