import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { CreditCard, LockKeyhole, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, isLoginConfigured } from "@/const";
import { PAID_SUBSCRIPTIONS_ENABLED } from "@/lib/releasePolicy";
import { trpc } from "@/lib/trpc";

export default function PaidAccessGate({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const status = trpc.subscription.me.useQuery(undefined, {
    enabled: PAID_SUBSCRIPTIONS_ENABLED && isAuthenticated,
    retry: false,
  });

  if (!PAID_SUBSCRIPTIONS_ENABLED) return <>{children}</>;
  if (loading || (isAuthenticated && status.isLoading)) {
    return <div className="min-h-[70vh] grid place-items-center"><div className="text-sm text-muted-foreground">Checking access…</div></div>;
  }
  if (!isAuthenticated) {
    return <div className="min-h-[70vh] grid place-items-center px-4"><Card className="max-w-md w-full"><CardHeader><CardTitle className="flex items-center gap-2"><LogIn className="w-5 h-5 text-cyan-400"/>Sign in to continue</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Paid features are tied to your account so billing access and privacy controls stay with the correct person.</p>{isLoginConfigured()?<Button className="w-full" onClick={()=>window.location.assign(getLoginUrl(location))}>Sign in</Button>:<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Sign-in is not configured on this deployment.</div>}</CardContent></Card></div>;
  }
  if (!status.data?.active) {
    return <div className="min-h-[70vh] grid place-items-center px-4"><Card className="max-w-md w-full"><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="w-5 h-5 text-violet-400"/>Membership required</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Your account does not currently have an active Doctor Buddy Membership. Privacy, billing, export, and deletion controls remain available without a subscription.</p><Link href="/subscribe"><Button className="w-full"><CreditCard className="w-4 h-4 mr-2"/>Review membership</Button></Link><Link href="/settings" className="block text-center text-xs text-cyan-400 underline">Account & billing settings</Link></CardContent></Card></div>;
  }
  return <>{children}</>;
}
