import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Shield, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { isOwnerBypassEmail } from "@shared/accessControl";

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const returnTo = new URLSearchParams(search).get("returnTo") || "/portal/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome back! Redirecting to your dashboard...");
      setTimeout(() => { window.location.href = returnTo; }, 500);
    },
    onError: (err) => {
      if (err.message === "SUBSCRIPTION_REQUIRED") {
        setSubscriptionRequired(true);
        setError("");
      } else {
        setSubscriptionRequired(false);
        setError(err.message || "Invalid email or password");
      }
    },
  });

  const [autoLogging, setAutoLogging] = useState(false);
  // Owner bypass emails — from shared/accessControl

  const handleAutoLogin = async (ownerEmail: string) => {
    setAutoLogging(true);
    setError("");
    try {
      const res = await fetch("/api/auto-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ownerEmail }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Auto-login failed"); return; }
      // Stamp localStorage owner marker for resilient gate bypass
      try { localStorage.setItem("rc_owner_email", ownerEmail); } catch (_) {}
      try { sessionStorage.setItem("rc_access_tier", "owner"); } catch (_) {}
      toast.success("Welcome back! Redirecting...");
      // Add owner_token to URL as nuclear fallback in case cookie is lost
      const sep = returnTo.includes("?") ? "&" : "?";
      const targetUrl = `${returnTo}${sep}owner_token=${encodeURIComponent(ownerEmail)}`;
      setTimeout(() => { window.location.href = targetUrl; }, 500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAutoLogging(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Owner auto-login — no password needed, unlimited access
    if (isOwnerBypassEmail(email.toLowerCase().trim())) {
      handleAutoLogin(email.toLowerCase().trim());
      return;
    }
    if (!email || !password) { setError("Please fill in all fields"); return; }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMmgydjJIMlYyem0wIDMwaDJ2Mkgydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 mb-4">
            <span className="text-2xl font-bold text-white">RC</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Russell Capital Solutions™</h1>
          <p className="text-emerald-400/80 text-sm mt-1 italic">Turn Capital Into Income&trade;</p>
        </div>

        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access your advisor portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {subscriptionRequired && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Subscription Required</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Your free access has been used. To continue using the Russell Capital Solutions™ advisor portal, please subscribe to one of our plans.
                  </p>
                  <Button
                    type="button"
                    onClick={() => navigate("/pricing")}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    View Subscription Plans
                  </Button>
                </div>
              )}

              {error && !subscriptionRequired && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    autoComplete="email"
                  />
                </div>
              </div>

              {isOwnerBypassEmail(email.toLowerCase().trim()) ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Owner account detected — no password required</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending || autoLogging}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2.5 shadow-lg shadow-emerald-500/25 transition-all duration-200"
              >
                {(loginMutation.isPending || autoLogging) ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : isOwnerBypassEmail(email.toLowerCase().trim()) ? (
                  <div className="flex items-center gap-2">
                    Enter Portal <ArrowRight className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Create one
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-xs mt-6">
          &copy; {new Date().getFullYear()} Russell Capital Solutions™ &bull; www.RussellCap.com
        </p>
      </div>
    </div>
  );
}
