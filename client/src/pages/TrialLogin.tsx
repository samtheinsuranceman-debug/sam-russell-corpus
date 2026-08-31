import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Zap, ArrowRight, AlertCircle, Clock, CreditCard } from "lucide-react";
import { BRAND_NAME } from "@shared/branding";

export default function TrialLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTrialExpired(false);
    setLoading(true);
    try {
      const res = await fetch("/api/trial/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "trial_expired") {
          setTrialExpired(true);
          // Store email so subscribe can use it
          localStorage.setItem("rc_trial_email", email);
          return;
        }
        setError(data.error || "Login failed");
        return;
      }
      // Store session info in localStorage
      localStorage.setItem("rc_trial_active", "true");
      localStorage.setItem("rc_trial_expires", data.expiresAt);
      localStorage.setItem("rc_trial_email", email);
      localStorage.setItem("rc_access_tier", data.accessTier || "trial");
      if (data.trialSecondsRemaining != null) {
        localStorage.setItem("rc_trial_seconds_remaining", String(data.trialSecondsRemaining));
      }
      // Navigate to portal
      navigate("/portal");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      // First login to establish session cookie for the subscribe endpoint
      const loginRes = await fetch("/api/trial/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      // Even if trial expired, the cookie might still be set from a previous session
      // Try the subscribe endpoint
      const res = await fetch("/api/trial/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
      } else {
        setError("Unable to create checkout session. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Check URL params for subscription status
  const urlParams = new URLSearchParams(window.location.search);
  const subscriptionCanceled = urlParams.get("subscription") === "canceled";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f1d35] to-[#0a1628] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Benefits */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 font-bold text-lg">RC</span>
              </div>
              <h1 className="text-3xl font-bold text-white">{BRAND_NAME}</h1>
            </div>
            <p className="text-emerald-400 text-lg font-medium italic mb-2">Turn Capital Into Income&trade;</p>
            <h2 className="text-2xl font-semibold text-white mb-3">
              Advisor Portal Access
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Access the full power of Russell Capital Systems™' Enterprise suite — every calculator, 
              every tool, every strategy engine.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", title: "3-Hour Free Trial", desc: "Explore all 50+ tools, strategy engines, and calculators during your trial period" },
              { icon: Zap, color: "text-cyan-400", bg: "bg-cyan-500/10", title: "Full Enterprise Access", desc: "Every tool unlocked — no feature restrictions during your trial" },
              { icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "No Credit Card Required", desc: "Just your email and the access password. Instant access." },
              { icon: CreditCard, color: "text-purple-400", bg: "bg-purple-500/10", title: "$99/mo After Trial", desc: "Continue with a monthly subscription after your 3-hour trial" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Form or Trial Expired Paywall */}
        {trialExpired ? (
          <Card className="bg-[#111c32]/80 border-amber-600/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <CardTitle className="text-white text-xl">Trial Period Expired</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Your 3-hour free trial has been fully used. Subscribe to continue accessing the Advisor Portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-600/30 rounded-lg p-4">
                <h4 className="text-amber-400 font-semibold mb-1">Russell Capital Systems™ — Advisor Portal</h4>
                <p className="text-white text-2xl font-bold">$99<span className="text-slate-400 text-base font-normal">/month</span></p>
                <p className="text-slate-400 text-sm mt-1">Full access to all tools, calculators, and strategy engines</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm rounded-lg p-3 bg-red-500/10 text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 text-base"
              >
                {subscribing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redirecting to checkout...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Subscribe Now — $99/mo
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setTrialExpired(false)}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#111c32]/80 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl">Enter the Advisor Portal</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your email and the access password to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="advisor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#0a1628] border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Access Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter access password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#0a1628] border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500">Contact your Russell Capital Systems™ representative for the access password</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm rounded-lg p-3 bg-red-500/10 text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {subscriptionCanceled && (
                  <div className="flex items-center gap-2 text-sm rounded-lg p-3 bg-amber-500/10 text-amber-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Subscription checkout was canceled. You can try again or continue with your trial.
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 text-base"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Enter Portal <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <p className="text-slate-500 text-xs">
                    Your email and IP address will be logged for security purposes.
                    <br />
                    By logging in, you agree to our Terms of Service.
                  </p>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-700/50">
                <p className="text-slate-400 text-sm text-center">
                  Already a subscriber?{" "}
                  <a href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                    Sign in here
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
