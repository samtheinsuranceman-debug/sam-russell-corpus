import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, AlertCircle, KeyRound, ShieldCheck } from "lucide-react";
import { BRAND_NAME } from "@shared/branding";

export default function ExecutiveEntrance() {
  const [, navigate] = useLocation();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/executive/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid passcode");
        return;
      }
      // Store session info
      localStorage.setItem("rc_trial_active", "true");
      localStorage.setItem("rc_trial_expires", data.expiresAt);
      localStorage.setItem("rc_trial_email", "executive");
      // Navigate to portal
      navigate("/portal");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f1d35] to-[#0a1628] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-4">
            <KeyRound className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{BRAND_NAME}</h1>
          <p className="text-emerald-400 text-sm font-medium italic">Turn Capital Into Income&trade;</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Executive Entrance</span>
          </div>
        </div>

        {/* Passcode Card */}
        <Card className="bg-[#111c32]/80 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <p className="text-slate-400 text-sm text-center">
              Enter the executive passcode to access the advisor portal
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="passcode" className="text-slate-300">Passcode</Label>
                <Input
                  id="passcode"
                  type="password"
                  placeholder="Enter executive passcode"
                  value={passcode}
                  onChange={(e) => { setPasscode(e.target.value); setError(""); }}
                  required
                  autoFocus
                  className="bg-[#0a1628] border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 text-center text-lg tracking-wider h-12"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm rounded-lg p-3 bg-red-500/10 text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !passcode}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 text-base h-12"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Enter Portal <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-700/50 text-center">
              <a href="/" className="text-slate-500 hover:text-slate-400 text-xs transition-colors">
                &larr; Back to Homepage
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
