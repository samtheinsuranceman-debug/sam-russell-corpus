import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, MailCheck, ShieldCheck } from "lucide-react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EMAIL_AUTH_ENABLED, isLoginConfigured, oauthLoginUrl } from "@/const";

/**
 * Sign in by email link. The link works once and expires in fifteen minutes.
 * No password is stored anywhere; the account id is derived from the address.
 */
export default function Login() {
  const [location] = useLocation();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const returnPath = new URLSearchParams(location.split("?")[1] ?? "").get("returnPath") || "/patient";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/auth/email/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim(), returnPath }) });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setState("error"); setMessage(body.error || "The link could not be sent."); return; }
      setState("sent");
    } catch {
      setState("error");
      setMessage("The link could not be sent. Check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-md py-12">
        <Card className="border-cyan-400/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LogIn className="w-5 h-5 text-cyan-400" />Sign in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isLoginConfigured() && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Sign-in is not configured on this deployment. The calculators, the fact finder, the check-in and the support resources work without an account.</div>
            )}
            {EMAIL_AUTH_ENABLED && state !== "sent" && (
              <form onSubmit={submit} className="space-y-3">
                <p className="text-sm text-muted-foreground">Enter your email and we will send you a link that signs you in. It works once and expires in fifteen minutes. No password is created or stored.</p>
                <Input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email address" />
                <Button type="submit" className="w-full" disabled={state === "sending" || !email.trim()}>{state === "sending" ? "Sending…" : "Email me a sign-in link"}</Button>
                {state === "error" && <p className="text-sm text-rose-300" role="alert">{message}</p>}
              </form>
            )}
            {state === "sent" && (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-emerald-200"><MailCheck className="w-4 h-4" /> Check your inbox</p>
                <p className="mt-1 text-muted-foreground">If that address can receive mail, a sign-in link is on its way. Open it on this device to continue to {returnPath}.</p>
              </div>
            )}
            {!EMAIL_AUTH_ENABLED && isLoginConfigured() && (
              <a href={oauthLoginUrl(returnPath)}><Button className="w-full">Continue to sign in</Button></a>
            )}
            <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" /> Your session cookie is HttpOnly and expires after thirty days. Signing in does not consent to anything; sensitive features ask separately. <Link href="/privacy" className="text-cyan-400 underline">Privacy</Link></p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
