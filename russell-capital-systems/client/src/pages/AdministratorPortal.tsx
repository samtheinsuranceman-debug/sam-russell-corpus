import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function AdministratorPortal() {
  const { user, isAuthenticated, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060f20] p-6 text-white">
      <Card className="w-full max-w-xl border-violet-400/20 bg-slate-950/80">
        <CardHeader><ShieldCheck className="mb-4 h-10 w-10 text-violet-300" /><CardTitle>Administrator Access</CardTitle></CardHeader>
        <CardContent className="space-y-5 text-slate-300">
          <p>Administrator tools use managed sign-in and server-enforced roles. Email PINs and local administrator passwords are retired.</p>
          {loading ? <p>Checking managed session…</p> : !isAuthenticated ? (
            <Button onClick={() => { window.location.href = getLoginUrl("/administrator"); }}><LockKeyhole className="mr-2 h-4 w-4" />Sign in securely</Button>
          ) : !isAdmin ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-950/25 p-4 text-amber-100">Your account does not have the administrator role.</div>
          ) : (
            <Link href="/portal/enterprise-admin"><Button>Open Enterprise Admin <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
