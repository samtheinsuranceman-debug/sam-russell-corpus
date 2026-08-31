import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, AlertCircle, ArrowLeft, CheckCircle2, Send } from "lucide-react";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
    onError: (err) => setError(err.message || "Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address"); return; }
    forgotMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 mb-4">
            <span className="text-2xl font-bold text-white">RC</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Russell Capital Systems™</h1>
          <p className="text-emerald-400/80 text-sm mt-1 italic">Turn Capital Into Income&trade;</p>
        </div>

        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">
              {sent ? "Check Your Email" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {sent
                ? "We've sent a password reset link to your email"
                : "Enter your email and we'll send you a reset link"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-emerald-300 text-sm font-medium">Reset link sent!</p>
                    <p className="text-emerald-400/70 text-xs mt-1">
                      Check your inbox at <span className="font-medium text-emerald-300">{email}</span>. The link expires in 1 hour.
                    </p>
                  </div>
                </div>
                <p className="text-slate-500 text-xs text-center">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button onClick={() => { setSent(false); setError(""); }} className="text-emerald-400 hover:text-emerald-300">
                    try again
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
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

                <Button
                  type="submit"
                  disabled={forgotMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2.5 shadow-lg shadow-emerald-500/25"
                >
                  {forgotMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" /> Send Reset Link
                    </div>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-xs mt-6">
          &copy; {new Date().getFullYear()} Russell Capital Systems™ &bull; www.RussellCapitalSystems.com
        </p>
      </div>
    </div>
  );
}
