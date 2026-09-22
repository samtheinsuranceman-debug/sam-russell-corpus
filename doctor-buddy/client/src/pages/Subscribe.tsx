import { useState } from "react";
import { Link, useLocation } from "wouter";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MEMBERSHIP_PRICE, PAID_SUBSCRIPTIONS_ENABLED, SUBSCRIPTION_TERMS_VERSION } from "@/lib/releasePolicy";
import { CheckCircle2, CreditCard, ShieldCheck, LogIn } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, isLoginConfigured } from "@/const";
import { toast } from "sonner";

const INCLUDED = ["50-engine Adaptive Support Lab", "Wellness check-ins", "Journal & progress tools", "AI education and reflection", "Research & care-preparation tools"];

export default function Subscribe() {
  const [location] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [adult, setAdult] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const proceed = async () => {
    if (!PAID_SUBSCRIPTIONS_ENABLED || !adult || !accepted || !isAuthenticated) return;
    setBusy(true);
    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ adult18Plus: true, recurringBillingAccepted: true, termsVersion: SUBSCRIPTION_TERMS_VERSION }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout could not be started");
      window.location.assign(data.url);
    } catch (error: any) {
      toast.error(error?.message || "Checkout could not be started");
      setBusy(false);
    }
  };

  return <div className="min-h-screen bg-background"><NavBar/><main className="container max-w-2xl py-12">
    <div className="text-center mb-8"><CreditCard className="w-10 h-10 text-cyan-400 mx-auto mb-3"/><h1 className="text-3xl font-bold">Review your subscription</h1><p className="text-muted-foreground mt-2">The recurring price and cancellation terms are shown before checkout.</p></div>
    <Card className="border-cyan-500/25"><CardHeader><CardTitle className="flex items-center justify-between gap-4"><span>Doctor Buddy Membership</span><span>{MEMBERSHIP_PRICE}<span className="text-sm font-normal text-muted-foreground"> / month</span></span></CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-2">{INCLUDED.map(x => <div key={x} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-400"/>{x}</div>)}</div>
      <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm space-y-2">
        <p><strong>Recurring charge:</strong> {MEMBERSHIP_PRICE} USD every month until cancelled.</p>
        <p><strong>First charge:</strong> at checkout. Doctor Buddy does not advertise a free trial unless one is explicitly shown on this page and in hosted checkout.</p>
        <p><strong>Cancellation:</strong> cancel online from Account &amp; Privacy before the next renewal to prevent future charges. Access normally continues through the paid period.</p>
        <p><strong>Refunds:</strong> charges are non-refundable after billing except where required by law or where the checkout screen expressly promises otherwise.</p>
        <p><strong>Medical boundary:</strong> membership purchases software access—not medical care, psychotherapy, psychiatry, diagnosis, prescribing, monitoring, or emergency services.</p>
      </div>
      <label className="flex items-start gap-3 text-sm cursor-pointer"><input className="mt-1 accent-cyan-400" type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)}/><span>I confirm I am at least 18 years old.</span></label>
      <label className="flex items-start gap-3 text-sm cursor-pointer"><input className="mt-1 accent-cyan-400" type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}/><span>I expressly authorize an automatically renewing monthly charge of {MEMBERSHIP_PRICE} until I cancel, and I agree to the <Link href="/subscription-terms" className="text-cyan-400 underline">Subscription Terms</Link>, <Link href="/terms" className="text-cyan-400 underline">Terms of Use</Link>, and <Link href="/privacy" className="text-cyan-400 underline">Privacy Policy</Link>.</span></label>
      {!PAID_SUBSCRIPTIONS_ENABLED && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><ShieldCheck className="w-4 h-4 inline mr-2"/>Checkout is intentionally disabled until the production operator configures Stripe, webhooks, subscription entitlement enforcement, and the Customer Portal.</div>}
      {!loading && !isAuthenticated && <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-100">A signed-in account is required so the subscription is attached to the correct person.</div>}
      {!isAuthenticated && isLoginConfigured() ? <Button className="w-full" size="lg" onClick={()=>window.location.assign(getLoginUrl(location))}><LogIn className="w-4 h-4 mr-2"/>Sign in before checkout</Button> : <Button className="w-full" size="lg" disabled={!adult || !accepted || !PAID_SUBSCRIPTIONS_ENABLED || !isAuthenticated || busy} onClick={proceed}>{busy ? "Opening secure checkout…" : "Continue to secure checkout"}</Button>}
    </CardContent></Card>
  </main></div>;
}
