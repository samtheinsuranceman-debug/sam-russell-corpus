import type { ReactNode } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, isLoginConfigured } from "@/const";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";

export default function ClinicalAccessGate({ children, clinicianOnly = false }: { children: ReactNode; clinicianOnly?: boolean }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (!CLINICAL_TOOLS_ENABLED) return <>{children}</>;
  if (loading) return <div className="min-h-[70vh] grid place-items-center"><div className="text-sm text-muted-foreground">Checking secure access…</div></div>;
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] grid place-items-center px-4 pt-10">
        <Card className="max-w-md w-full border-cyan-400/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-cyan-400"/>Clinical sign-in required</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Persistent clinical records and decision-support tools are available only to authenticated users in the separately configured Clinical Edition. The screening intake can still run locally without saving a clinical record.</p>
            {isLoginConfigured() ? (
              <Button className="w-full" onClick={() => window.location.assign(getLoginUrl(window.location.pathname))}><LogIn className="w-4 h-4 mr-2"/>Sign in securely</Button>
            ) : (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Clinical authentication is not configured on this deployment.</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  if (clinicianOnly && user?.role !== "admin") {
    return (
      <div className="min-h-[70vh] grid place-items-center px-4 pt-10">
        <Card className="max-w-md w-full border-cyan-400/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-cyan-400"/>Clinician access required</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This decision-support surface is restricted to an authorized clinician/operator role. Patient-facing records and support tools remain available through the patient portal.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}
