import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { beginAuth, requireAgreement } from "@/lib/agreement";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Fingerprint, Brain, Sparkles, Mail } from "lucide-react";

// ============================================================
// DEDICATED LOGIN PAGE
// Premium branded sign-in experience — not just a redirect.
// Applies Influence (Cialdini): social proof, authority, scarcity.
// Applies Refactoring UI: visual hierarchy, whitespace, contrast.
// ============================================================

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // If already authenticated, redirect to profile/results
  useEffect(() => {
    if (!loading && user) {
      navigate("/portal");
    }
  }, [user, loading, navigate]);

  const handleSignIn = () => {
    beginAuth();
  };

  // Free access — email (username) + the member's own password (set at first claim).
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const freeInfo = trpc.freeAccess.info.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const claim = trpc.freeAccess.claim.useMutation({
    onSuccess: async (res) => {
      if (!res.success) {
        toast.error(res.error || "That access code isn't valid.");
        return;
      }
      toast.success("You're in — welcome. Let's begin.");
      await utils.auth.me.invalidate();
      navigate("/assessment");
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const submitFreeAccess = () => {
    const e = email.trim();
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!passcode.trim()) {
      toast.error("Enter your password.");
      return;
    }
    // Gate on the user agreement first, then claim.
    requireAgreement(() => claim.mutate({ email: e, passcode: passcode.trim() }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/80/10 border border-primary/20 mb-6"
          >
            <Brain className="w-8 h-8 text-accent" />
          </motion.div>
          <h1
            className="text-3xl font-bold text-foreground mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Welcome to AQAL
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The world's first voice-based intelligence assessment.
            <br />
            32 lines. A panel of AIs. Engineered, not just measured.
          </p>
        </div>

        {/* Sign-in card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card rounded-2xl border border-white/[0.06] p-8"
        >
          {/* Free access — email + your password */}
          {freeInfo.data?.enabled !== false && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.15em] text-accent/70 mb-2 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Free access — no card
              </p>
              {typeof freeInfo.data?.remaining === "number" && (freeInfo.data.cap ?? 0) > 0 && (
                <p className="text-center mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[0.7rem] px-2.5 py-1 rounded-full border border-primary/25 bg-primary/[0.06]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary font-semibold">{freeInfo.data.remaining.toLocaleString()}</span>
                    <span className="text-muted-foreground/60">of {freeInfo.data.cap.toLocaleString()} free spots left</span>
                  </span>
                </p>
              )}
              <div className="space-y-2.5">
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    className="w-full bg-background/60 border border-border/60 rounded-xl pl-9 pr-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(ev) => setPasscode(ev.target.value)}
                  onKeyDown={(ev) => { if (ev.key === "Enter") submitFreeAccess(); }}
                  placeholder="Your password"
                  className="w-full bg-background/60 border border-border/60 rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {freeInfo.data?.full ? (
                  <>
                    <div className="w-full h-11 flex items-center justify-center text-sm rounded-xl border border-border/60 text-muted-foreground/70">
                      All free spots claimed
                    </div>
                    <Button
                      onClick={() => navigate("/pricing")}
                      className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 text-white border-0 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.97] transition-all duration-150"
                    >
                      See pricing
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={submitFreeAccess}
                    disabled={claim.isPending}
                    className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 text-white border-0 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.97] transition-all duration-150"
                  >
                    {claim.isPending ? "Unlocking…" : "Get Free Access"}
                  </Button>
                )}
                <p className="text-[0.65rem] text-muted-foreground/45 text-center leading-relaxed">
                  Your email is your username. We&rsquo;ll email your results there.
                </p>
              </div>
            </div>
          )}

          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/30">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <Button
            onClick={handleSignIn}
            variant="outline"
            className="w-full h-11 text-sm font-medium border-white/[0.12] text-muted-foreground hover:text-foreground rounded-xl active:scale-[0.97] transition-all duration-150"
          >
            <Fingerprint className="w-4 h-4 mr-2" />
            Sign In
          </Button>

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
              You must accept the User Agreement before signing in.
              Your data is encrypted end-to-end.
            </p>
          </div>
        </motion.div>

        {/* Trust indicators — Cialdini: Authority + Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <TrustBadge icon={<Shield className="w-4 h-4" />} label="Private & Encrypted" />
          <TrustBadge icon={<Sparkles className="w-4 h-4" />} label="7 Patents Pending · Proprietary methodology" />
          <TrustBadge icon={<Brain className="w-4 h-4" />} label="Multi-AI Panel" />
        </motion.div>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <a
            href="/"
            className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            &larr; Back to Home
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="text-accent/60">{icon}</div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">
        {label}
      </span>
    </div>
  );
}
