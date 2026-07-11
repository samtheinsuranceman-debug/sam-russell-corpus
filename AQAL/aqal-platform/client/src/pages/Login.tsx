import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Shield, Fingerprint, Brain, Sparkles } from "lucide-react";

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
    window.location.href = getLoginUrl();
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
            32 dimensions. 5 AI minds. Your rarity score.
          </p>
        </div>

        {/* Sign-in card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card rounded-2xl border border-white/[0.06] p-8"
        >
          <Button
            onClick={handleSignIn}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/80/90 text-white border-0 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]"
          >
            <Fingerprint className="w-5 h-5 mr-2" />
            Sign In with Manus
          </Button>

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
              By signing in, you agree to our terms of service and privacy policy.
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
          <TrustBadge icon={<Brain className="w-4 h-4" />} label="5 AI Systems" />
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
