import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CalendarCheck, ClipboardList, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const workflows = [
  { href: "/portal/meetings", title: "Meetings", description: "Open the persisted meeting workspace and select the client meeting you want to review.", icon: CalendarCheck },
  { href: "/portal/meeting-agenda", title: "Meeting Agenda", description: "Prepare and document an agenda before a client conversation.", icon: ClipboardList },
  { href: "/portal/compliance-audit", title: "Compliance Audit", description: "Review saved calculation and workflow evidence in the compliance workspace.", icon: ShieldCheck },
];

export default function AIMeetingNotes() {
  return (
    <AppShell title="AI Meeting Notes" subtitle="Route-preserving access to verified meeting workflows">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Card className="border-violet-400/20 bg-slate-950/60">
          <CardHeader><CardTitle>Meeting analysis requires a saved meeting</CardTitle><CardDescription>This page no longer displays generated tasks, decisions, risks, charts, or placeholder actions. Choose a working workflow below.</CardDescription></CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {workflows.map(({ href, title, description, icon: Icon }) => (
            <Card key={href} className="border-slate-700/60 bg-slate-950/50">
              <CardHeader><Icon className="h-6 w-6 text-violet-300" /><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
              <CardContent><p className="mb-5 text-sm text-slate-400">{description}</p><Link href={href}><Button variant="outline">Open {title} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
