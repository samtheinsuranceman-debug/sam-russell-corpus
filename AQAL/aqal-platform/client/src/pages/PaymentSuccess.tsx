import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function PaymentSuccess() {
  useEffect(() => {
    toast.success("Payment confirmed! Welcome, Founding Member.");
  }, []);
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, oklch(0.15 0.02 55) 0%, oklch(0.13 0.02 55) 40%, oklch(0.12 0.02 55) 100%)`,
        }}
      />

      <div className="relative z-10 px-4 w-full max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card p-10 rounded-2xl"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.78 0.12 85 / 0.15)", border: "2px solid oklch(0.78 0.12 85 / 0.4)" }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: "oklch(0.78 0.12 85)" }} />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl text-foreground mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            Welcome, Founding Member
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-muted-foreground mb-8 leading-relaxed"
          >
            Your payment has been confirmed. You're now part of an exclusive group discovering what makes them cognitively rare.
          </motion.p>

          {/* Next steps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-3 mb-8"
          >
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: "oklch(0.78 0.12 85)" }} />
              <span className="text-sm text-foreground/80">Evidence-based verification is unlocked</span>
            </div>
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: "oklch(0.78 0.12 85)" }} />
              <span className="text-sm text-foreground/80">Your full 32-line profile is verified to high confidence</span>
            </div>
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: "oklch(0.78 0.12 85)" }} />
              <span className="text-sm text-foreground/80">Your rarity score reveals in real-time</span>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Link href="/evidence">
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold py-6 text-base hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
              >
                Upload Evidence to Verify Your Scores
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-xs text-muted-foreground/40 mt-4"
          >
            A confirmation email has been sent to your inbox.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
