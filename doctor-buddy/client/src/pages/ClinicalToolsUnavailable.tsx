import { Link } from "wouter";
import NavBar from "@/components/NavBar";
import { ShieldCheck } from "lucide-react";
export default function ClinicalToolsUnavailable() {
  return <div className="min-h-screen bg-background"><NavBar/><main className="container max-w-2xl py-20 text-center"><ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4"/><h1 className="text-2xl font-bold mb-3">Clinical module not enabled in the public edition</h1><p className="text-muted-foreground mb-6">This internet-facing build intentionally limits itself to wellness, reflection, education and care-preparation tools. Diagnostic scoring and clinician decision-support modules require a separately configured regulated deployment.</p><Link href="/support-lab" className="text-cyan-400 underline">Open Adaptive Support Lab</Link></main></div>;
}
