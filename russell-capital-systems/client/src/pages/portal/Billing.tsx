import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CircleDollarSign, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function Billing() {
  return (
    <AppShell title="Billing & Subscription" subtitle="Payment integration status">
      <div className="mx-auto max-w-3xl p-6">
        <Card className="border-amber-400/25 bg-slate-950/60">
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10"><ShieldAlert className="text-amber-300" /></div>
            <CardTitle>Billing is not active</CardTitle>
            <CardDescription>No payment provider is connected to this project. This page intentionally does not display sample subscriptions, invoices, cards, usage, team activity, prices, discounts, or checkout controls as real records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 text-sm text-slate-300"><CircleDollarSign className="mb-2 h-5 w-5 text-emerald-300" />Billing functionality can be enabled only after the owner explicitly activates and configures a supported payment integration.</div>
            <Link href="/portal/integrations"><Button variant="outline">Review integrations <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
