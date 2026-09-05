/**
 * SubscriptionGuard — Wraps portal routes to enforce access control.
 *
 * Shows a password gate if no access tier is set.
 * Shows an expiry/subscription prompt if trial is expired.
 * Passes through to children if access is granted.
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAccess } from "@/contexts/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertCircle, ArrowRight, Shield, Clock, CreditCard, Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { isOwnerBypassEmail } from "@shared/accessControl";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { tier, canAccess, loading, trialExpired, sessionExpired, error, enterWithPassword, remainingAccesses, sessionSeconds } = useAccess();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const ownerAutoLoginAttempted = useRef(false);

  // ━━━ OWNER AUTO-LOGIN — if owner email is typed in the gate, auto-login without password ━━━
  useEffect(() => {
    if (ownerAutoLoginAttempted.current) return;
    if (email && isOwnerBypassEmail(email.toLowerCase().trim())) {
      ownerAutoLoginAttempted.current = true;
      setSubmitting(true);
      fetch("/api/auto-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success("Welcome back! Refreshing...");
            try { localStorage.setItem("rc_owner_email", email.toLowerCase().trim()); } catch (_) {}
            try { sessionStorage.setItem("rc_access_tier", "owner"); } catch (_) {}
            window.location.reload();
          } else {
            setLocalError(data.error || "Auto-login failed");
            setSubmitting(false);
          }
        })
        .catch(() => {
          setLocalError("Network error during auto-login");
          setSubmitting(false);
        });
    }
  }, [email]);

  // ━━━ OWNER BYPASS — Sam Russell always passes through, no gates ever ━━━
  // Layer 1: Auth-based check
  const isOwnerByAuth = isAuthenticated && user?.email && isOwnerBypassEmail(user.email);
  // Layer 2: localStorage marker (survives page reloads even if cookie is lost)
  let isOwnerByStorage = false;
  try {
    const storedOwnerEmail = localStorage.getItem("rc_owner_email");
    if (storedOwnerEmail && isOwnerBypassEmail(storedOwnerEmail)) isOwnerByStorage = true;
  } catch (_) {}
  // Layer 3: URL token (survives even if localStorage is blocked)
  const urlParams = new URLSearchParams(window.location.search);
  const ownerToken = urlParams.get("owner_token");
  const isOwnerByToken = ownerToken && isOwnerBypassEmail(ownerToken);
  
  if (isOwnerByAuth || isOwnerByStorage || isOwnerByToken) {
    // Stamp localStorage for future resilience
    try {
      const ownerEmail = user?.email || ownerToken || localStorage.getItem("rc_owner_email") || "";
      if (ownerEmail) localStorage.setItem("rc_owner_email", ownerEmail);
    } catch (_) {}
    // Clean URL token if present
    if (ownerToken) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  // All users get full access — no trial banners or restrictions
  if (canAccess) {
    return <>{children}</>;
  }

  // No access — show password gate
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    // Owner email auto-login — no password needed
    if (email && isOwnerBypassEmail(email.toLowerCase().trim())) {
      ownerAutoLoginAttempted.current = false; // reset so effect fires
      setSubmitting(true);
      try {
        const res = await fetch("/api/auto-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Welcome back! Refreshing...");
          try { localStorage.setItem("rc_owner_email", email.toLowerCase().trim()); } catch (_) {}
          try { sessionStorage.setItem("rc_access_tier", "owner"); } catch (_) {}
          window.location.reload();
        } else {
          setLocalError(data.error || "Auto-login failed");
        }
      } catch {
        setLocalError("Network error during auto-login");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!password) {
      setLocalError("Please enter an access password");
      return;
    }
    setSubmitting(true);
    try {
      await enterWithPassword(password, email || undefined);
      toast.success("Access granted! Welcome to Russell Capital Systems™.");
    } catch (err: any) {
      setLocalError(err.message || "Invalid access password.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMmgydjJIMlYyem0wIDMwaDJ2Mkgydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Advisor Access</h1>
          <p className="text-emerald-400/80 text-sm mt-1">Enter your access password to continue</p>
        </div>

        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Password Gate</CardTitle>
            <CardDescription className="text-slate-400">
              Enter the access password provided by Russell Capital Systems™
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{displayError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="gate-email" className="text-slate-300">Email (optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="gate-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
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
                <Label htmlFor="gate-password" className="text-slate-300">Access Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="gate-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter access password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
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
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2.5 shadow-lg shadow-emerald-500/25"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Enter Portal <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-2 text-slate-500">or</span></div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Sign In with Email & Password
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/pricing")}
                className="w-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                View Subscription Plans
              </Button>
            </div>

            <p className="text-center text-slate-600 text-xs mt-4">
              Need access? Contact sam@russellcapitalsystems.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
