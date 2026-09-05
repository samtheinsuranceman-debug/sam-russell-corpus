/**
 * SubscriptionGuard — Wraps portal routes to enforce access control.
 *
 * UPDATED: ALL users must enter one of 3 approved passwords.
 * No auto-bypass for any email. No trial access.
 * Approved passwords: 18aLiHeap*, Welcome@7, Mike1248(?)
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAccess } from "@/contexts/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertCircle, ArrowRight, Shield, Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { canAccess, loading, error, enterWithPassword } = useAccess();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

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

  // Access granted — user passed the password gate
  if (canAccess) {
    return <>{children}</>;
  }

  // No access — show password gate (NO EXCEPTIONS, NO AUTO-BYPASS)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!email) {
      setLocalError("Email is required to access the advisor dashboard");
      return;
    }
    if (!password) {
      setLocalError("Please enter an access password");
      return;
    }
    setSubmitting(true);
    try {
      await enterWithPassword(password, email);
      toast.success("Welcome back, Sam! Full access granted.");
    } catch (err: any) {
      setLocalError(err.message || "Invalid email or password.");
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
            <CardTitle className="text-xl text-white">Password Required</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your authorized email and access password
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
                <Label htmlFor="gate-email" className="text-slate-300">Email <span className="text-red-400">*</span></Label>
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
