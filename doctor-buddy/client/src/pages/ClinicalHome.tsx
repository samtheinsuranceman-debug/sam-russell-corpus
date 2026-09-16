import { Link } from "wouter";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity, AlertTriangle, BarChart3, Brain, BrainCircuit, CheckCircle2,
  Dna, FileCheck2, FlaskConical, HeartPulse, Microscope, ShieldCheck,
  Stethoscope, UserCheck, Users, Workflow, Landmark } from "lucide-react";

const CLINICAL_FEATURES = [
  { icon: Brain, title: "Structured psychiatric intake", copy: "DSM-oriented intake workflow with deterministic local scoring support, resumable progress, and a clinician-facing differential draft. Outputs remain provisional until human review." },
  { icon: BarChart3, title: "Psychiatric Risk Score", copy: "Multi-factor risk synthesis with explicit safety vetoes so serious self-harm disclosures cannot be mathematically washed out by healthier background variables." },
  { icon: Dna, title: "12-domain Digital Twin", copy: "Longitudinal domain tracking across mood, anxiety, cognition, sleep, trauma, substance use, social engagement, safety, and other configured domains." },
  { icon: Activity, title: "Mental-health vital signs", copy: "Trend-oriented composite measures designed for longitudinal decision support and anomaly review rather than autonomous diagnosis." },
  { icon: Microscope, title: "Research engine", copy: "Evidence retrieval and diagnosis-linked literature workflows for clinician review, with external-query disclosure and production processor controls." },
  { icon: Workflow, title: "Clinician review loop", copy: "Draft → under review → approved/rejected/revision-required workflow with reviewer identity, notes, signature field, and auditability." },
];

const ENGINES = [
  "Adaptive Assessment Engine",
  "Crisis Detection & Escalation Engine",
  "Psychiatric Risk Scoring Engine",
  "Mental Health Vital Signs Engine",
  "Mental Credit Score Engine",
];

const SAFETY = [
  "Clinical APIs are server-disabled unless the clinical edition is explicitly enabled.",
  "Production clinical mode requires a HIPAA/BAA deployment configuration and verified PHI safeguards.",
  "AI outputs are clinician-facing drafts; they are not autonomous diagnoses, prescriptions, or medical orders.",
  "Access, activity, and PHI-touch events can be recorded separately for audit review.",
  "Crisis logic is supportive decision assistance and never substitutes for emergency evaluation or local emergency services.",
];

export default function ClinicalHome() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-9">
      <NavBar />
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 grid-overlay opacity-50" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-5xl mx-auto text-center">
            <Badge variant="outline" className="mb-5 border-cyan-400/30 text-cyan-300 bg-cyan-400/5">CLINICAL EDITION · HUMAN REVIEW REQUIRED</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.04] mb-5">Build a richer psychiatric picture <span className="gradient-text">without handing authority to the machine.</span></h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-7">Doctor Buddy Clinical combines structured intake, longitudinal modeling, risk synthesis, clinician review, evidence retrieval, crisis-support logic, and the full adaptive-support layer in one deliberately gated professional environment.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/assessment"><Button size="lg"><Brain className="w-4 h-4 mr-2"/>Start Clinical Intake</Button></Link>
              <Link href="/dashboard"><Button size="lg" variant="outline"><Stethoscope className="w-4 h-4 mr-2"/>Open Clinical Dashboard</Button></Link>
              <Link href="/support-lab"><Button size="lg" variant="outline"><BrainCircuit className="w-4 h-4 mr-2"/>Adaptive Support Lab</Button></Link>
              <Link href="/finance"><Button size="lg" variant="outline"><Landmark className="w-4 h-4 mr-2"/>Financial Readiness</Button></Link>
            </div>
            <p className="text-xs text-muted-foreground mt-5">Decision-support software · not autonomous medical practice · licensed clinician judgment remains controlling</p>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="max-w-3xl mb-8">
          <div className="text-cyan-400 text-xs tracking-[0.18em] uppercase mb-2">Build A muscle, Build B skeleton</div>
          <h2 className="text-3xl font-bold mb-3">Clinical depth, inside the hardened product architecture.</h2>
          <p className="text-muted-foreground">The clinical engines from the psychiatric build remain available here, while the newer security, consent, processor, billing, retention, and production-gating architecture stays authoritative underneath.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CLINICAL_FEATURES.map(({icon:Icon,title,copy}) => (
            <Card key={title} className="bg-card/70 border-cyan-400/10">
              <CardHeader><Icon className="w-7 h-7 text-cyan-400 mb-2"/><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{copy}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/50 bg-secondary/10">
        <div className="container py-16 grid lg:grid-cols-2 gap-10">
          <div>
            <Badge variant="outline" className="mb-4 border-violet-400/30 text-violet-300"><FlaskConical className="w-3 h-3 mr-1.5"/>CORE ENGINES RETAINED</Badge>
            <h2 className="text-3xl font-bold mb-4">Five computational engines plus the 50-engine adaptive layer.</h2>
            <div className="space-y-3">
              {ENGINES.map(name => <div key={name} className="flex gap-3 rounded-xl border border-border bg-card/70 p-4"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"/><span className="text-sm">{name}</span></div>)}
            </div>
          </div>
          <div>
            <Badge variant="outline" className="mb-4 border-emerald-400/30 text-emerald-300"><ShieldCheck className="w-3 h-3 mr-1.5"/>CLINICAL SAFETY BOUNDARY</Badge>
            <h2 className="text-3xl font-bold mb-4">The safety architecture is part of the product.</h2>
            <div className="space-y-3">
              {SAFETY.map(item => <div key={item} className="flex gap-3 rounded-xl border border-border bg-card/70 p-4"><UserCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5"/><span className="text-sm text-muted-foreground leading-relaxed">{item}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold text-cyan-300">12</div><div className="text-xs text-muted-foreground mt-1">Digital Twin domains</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold text-violet-300">50</div><div className="text-xs text-muted-foreground mt-1">Adaptive support engines</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold text-emerald-300">14</div><div className="text-xs text-muted-foreground mt-1">Patent portfolio documents retained</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-3xl font-bold text-amber-300">5</div><div className="text-xs text-muted-foreground mt-1">Core computational engines</div></CardContent></Card>
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 max-w-5xl mx-auto flex gap-4">
          <AlertTriangle className="w-7 h-7 text-amber-300 shrink-0" />
          <div>
            <h2 className="font-semibold text-lg mb-2">Clinical deployment requirement</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">This edition is intended only for a separately configured clinical deployment. Software configuration cannot itself create HIPAA compliance, satisfy state licensure requirements, or replace the covered entity's Notice of Privacy Practices, risk analysis, workforce policies, BAAs, access-control program, audit review, incident response, or clinician responsibility.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
