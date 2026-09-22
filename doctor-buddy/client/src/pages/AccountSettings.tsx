import { useState } from "react";
import { Link } from "wouter";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PAID_SUBSCRIPTIONS_ENABLED, PRIVACY_CONTACT_EMAIL } from "@/lib/releasePolicy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Download, Trash2, LogOut, CreditCard, ExternalLink, AlertTriangle, UserRound, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { CONSUMER_HEALTH_CONSENT_VERSION } from "@shared/legalVersions";
import { usePageTitle } from "@/lib/usePageTitle";

export default function AccountSettings() {
  usePageTitle("Settings");
  const { user, isAuthenticated } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const utils = trpc.useUtils();

  const exportQuery = trpc.compliance.exportMyData.useQuery(undefined, { enabled: false });
  const withdrawConsent = trpc.consent.withdraw.useMutation({
    onSuccess: () => {
      localStorage.removeItem(`db_health_data_consent_v${CONSUMER_HEALTH_CONSENT_VERSION}`);
      toast.success("Health-data consent withdrawn. Sensitive features will require new consent before use.");
    },
    onError: err => toast.error(err.message),
  });
  const deleteHealth = trpc.compliance.deleteMyConsumerHealthDataNow.useMutation({
    onSuccess: result => {
      localStorage.removeItem(`db_health_data_consent_v${CONSUMER_HEALTH_CONSENT_VERSION}`);
      setDeleteConfirm(false);
      toast.success(result.success ? "Consumer health data deleted." : "Deletion completed with items requiring review.");
      utils.invalidate();
    },
    onError: err => toast.error(err.message),
  });
  const subscription = trpc.subscription.me.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => window.location.assign("/") });
  const [billingBusy, setBillingBusy] = useState(false);
  const [privacyRequestType, setPrivacyRequestType] = useState<"correction" | "appeal" | "complaint">("correction");
  const [privacyRequestDetails, setPrivacyRequestDetails] = useState("");
  const privacyRequests = trpc.compliance.myPrivacyRequests.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const submitPrivacyRequest = trpc.compliance.submitPrivacyRequest.useMutation({
    onSuccess: () => {
      setPrivacyRequestDetails("");
      privacyRequests.refetch();
      toast.success("Privacy request received. You can track its status here.");
    },
    onError: err => toast.error(err.message),
  });


  const openBillingPortal = async () => {
    setBillingBusy(true);
    try {
      const response = await fetch("/api/billing/create-portal", { method: "POST", credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Billing portal could not be opened");
      window.location.assign(data.url);
    } catch (error: any) {
      toast.error(error?.message || "Billing portal could not be opened");
      setBillingBusy(false);
    }
  };

  const downloadExport = async () => {
    const result = await exportQuery.refetch();
    if (!result.data) return toast.error("Could not prepare export.");
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doctor-buddy-data-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <div className="min-h-screen bg-background"><NavBar/><main className="container max-w-3xl py-10">
    <div className="mb-7"><h1 className="text-3xl font-bold">Account & privacy</h1><p className="text-muted-foreground mt-2">Control saved information, privacy rights, billing, and account access.</p></div>

    <div className="space-y-5">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="w-5 h-5 text-cyan-400"/>Account</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div><strong>{user?.name || "Member"}</strong></div><div className="text-muted-foreground">{user?.email || "No email shown"}</div><Badge variant="outline">{isAuthenticated ? "Signed in" : "Not signed in"}</Badge></CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400"/>Privacy posture</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        {[
          ["Consumer health data", "Used only to provide requested features, security, and permitted operational purposes."],
          ["Targeted advertising", "Health-related activity, support prompts, journal content, and medication information are not used for targeted advertising."],
          ["HIPAA positioning", "HIPAA does not automatically apply to a direct-to-consumer app. Separate covered-entity deployments require their own HIPAA agreements and safeguards."],
          ["Communication zones", "Friend, Therapist, and Psychiatrist Zones are communication styles only—not licensed professional services."],
        ].map(([title, desc])=><div key={title} className="rounded-lg border border-border p-3"><div className="font-medium">{title}</div><div className="text-xs text-muted-foreground mt-1">{desc}</div></div>)}
        <div className="flex flex-wrap gap-3 pt-1 text-xs"><Link href="/privacy" className="text-cyan-400 underline">Privacy Policy</Link><Link href="/health-data-privacy" className="text-cyan-400 underline">Consumer Health Data Privacy</Link><Link href="/medical-disclaimer" className="text-cyan-400 underline">Medical Disclaimer</Link></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Your data</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"><div><div className="font-medium text-sm">Export my information</div><div className="text-xs text-muted-foreground">Download a machine-readable JSON copy of data associated with your account.</div></div><Button variant="outline" onClick={downloadExport} disabled={!isAuthenticated || exportQuery.isFetching}><Download className="w-4 h-4 mr-2"/>{exportQuery.isFetching?"Preparing…":"Export"}</Button></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"><div><div className="font-medium text-sm">Withdraw health-data consent</div><div className="text-xs text-muted-foreground">Stops future use of sensitive features until you affirmatively consent again. This does not itself delete information already saved.</div></div><Button variant="outline" onClick={()=>withdrawConsent.mutate({})} disabled={!isAuthenticated || withdrawConsent.isPending}>{withdrawConsent.isPending?"Withdrawing…":"Withdraw consent"}</Button></div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"><div className="flex gap-3"><AlertTriangle className="w-5 h-5 text-destructive shrink-0"/><div className="flex-1"><div className="font-medium text-sm">Delete consumer health data</div><div className="text-xs text-muted-foreground mt-1">Removes saved wellness/support information from active product tables while retaining only the minimum account and deletion receipt needed to operate securely and prove the request occurred.</div>{!deleteConfirm?<Button variant="outline" size="sm" className="mt-3 border-destructive/40 text-destructive" onClick={()=>setDeleteConfirm(true)} disabled={!isAuthenticated}><Trash2 className="w-4 h-4 mr-2"/>Delete health data</Button>:<div className="mt-3 flex flex-wrap gap-2"><Button variant="destructive" size="sm" onClick={()=>deleteHealth.mutate()} disabled={deleteHealth.isPending}>{deleteHealth.isPending?"Deleting…":"Yes, delete my health data"}</Button><Button variant="outline" size="sm" onClick={()=>setDeleteConfirm(false)}>Cancel</Button></div>}</div></div></div>
        <p className="text-xs text-muted-foreground">Privacy contact: {PRIVACY_CONTACT_EMAIL}</p>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareText className="w-5 h-5 text-cyan-400"/>Privacy requests & appeals</CardTitle></CardHeader><CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Export, deletion, and consent withdrawal are available above. Use this form for a correction request, privacy complaint, or appeal of a privacy decision. You can also contact {PRIVACY_CONTACT_EMAIL}.</p>
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <select value={privacyRequestType} onChange={e=>setPrivacyRequestType(e.target.value as typeof privacyRequestType)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="correction">Correction request</option>
            <option value="appeal">Appeal a decision</option>
            <option value="complaint">Privacy complaint</option>
          </select>
          <textarea value={privacyRequestDetails} onChange={e=>setPrivacyRequestDetails(e.target.value)} maxLength={4000} placeholder="Describe the information to correct, the decision you want reviewed, or your privacy concern." className="min-h-24 rounded-md border border-input bg-background p-3 text-sm" />
        </div>
        <Button variant="outline" disabled={!isAuthenticated || !privacyRequestDetails.trim() || submitPrivacyRequest.isPending} onClick={()=>submitPrivacyRequest.mutate({ requestType: privacyRequestType, details: privacyRequestDetails.trim() })}>{submitPrivacyRequest.isPending?"Submitting…":"Submit privacy request"}</Button>
        {!!privacyRequests.data?.length && <div className="space-y-2 pt-2"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent requests</div>{privacyRequests.data.slice(0,5).map((r:any)=><div key={r.id} className="rounded-lg border border-border p-3 text-xs"><div className="flex justify-between gap-3"><strong className="capitalize">{String(r.requestType).replaceAll("_"," ")}</strong><Badge variant="outline">{String(r.status).replaceAll("_"," ")}</Badge></div><div className="text-muted-foreground mt-1">Submitted {new Date(r.submittedAt).toLocaleDateString()}</div>{r.resolutionNotes && <div className="mt-2">{r.resolutionNotes}</div>}</div>)}</div>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-violet-400"/>Subscription</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground mb-3">Paid memberships can be managed and cancelled online without calling or negotiating with support.</p>{PAID_SUBSCRIPTIONS_ENABLED && subscription.data?.status !== "inactive"?<div className="space-y-3"><div className="text-xs rounded-lg border border-border p-3"><div><strong>Status:</strong> {subscription.data?.status || "unknown"}</div>{subscription.data?.currentPeriodEnd && <div><strong>Current period ends:</strong> {new Date(subscription.data.currentPeriodEnd).toLocaleDateString()}</div>}{subscription.data?.cancelAtPeriodEnd && <div className="text-amber-300 mt-1">Cancellation is scheduled at the end of the current paid period.</div>}</div><Button onClick={openBillingPortal} disabled={billingBusy}>{billingBusy?"Opening…":"Manage or cancel subscription"} <ExternalLink className="w-4 h-4 ml-2"/></Button></div>:<div className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">No active billing relationship is shown for this account.</div>}<div className="mt-3"><Link href="/subscription-terms" className="text-cyan-400 text-xs underline">Subscription Terms</Link></div></CardContent></Card>

      <Card><CardHeader><CardTitle>Session</CardTitle></CardHeader><CardContent><Button variant="outline" onClick={()=>logoutMutation.mutate()} disabled={logoutMutation.isPending}><LogOut className="w-4 h-4 mr-2"/>Sign out</Button></CardContent></Card>
    </div>
  </main></div>;
}
