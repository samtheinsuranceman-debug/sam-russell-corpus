import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Check, Shield, Loader2, Zap, Users, Brain, FileText, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { playClick } from "@/lib/audio";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

// ============================================================
// SIMPLIFIED PRICING — Single $299 founding-member offer (regular $1,500 after first 100)
// Per Mark's schematic: one price, one decision, no paralysis
// ============================================================

const includedFeatures = [
  { icon: Brain, text: "Full 32-axis voice intelligence assessment" },
  { icon: Zap, text: "Five-AI consensus scoring system" },
  { icon: FileText, text: "Complete rarity underwriting report" },
  { icon: Users, text: "Silver membership network access (5 introductions/month)" },
  { icon: RefreshCw, text: "Free retake within 30 days if you disagree" },
  { icon: Shield, text: "Complementary match previews + connection requests" },
];



export default function Pricing() {
  useScrollReveal();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const checkoutMutation = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Could not create checkout session. Please try again.");
      }
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    },
  });

  const [showHipaaModal, setShowHipaaModal] = useState(false);
  const [hipaaConsent, setHipaaConsent] = useState(false);

  const handleCheckout = () => {
    playClick();
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    setHipaaConsent(false);
    setShowHipaaModal(true);
  };

  const confirmCheckout = () => {
    if (!hipaaConsent) return;
    setShowHipaaModal(false);
    setIsLoading(true);
    checkoutMutation.mutate({
      productKey: "assessment",
      origin: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, oklch(0.15 0.02 55) 0%, oklch(0.13 0.02 55) 40%, oklch(0.12 0.02 55) 100%)`,
        }}
      />
      <div className="gradient-mesh" />

      <PublicHeader />

      <div className="relative z-10 section-spacing-lg px-4">
        <div className="container max-w-4xl">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="section-label mb-4">
              Founding Member Rate — Limited to First 100
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl text-foreground mb-5"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em", fontWeight: 600 }}
            >
              One Assessment. One Price.
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Know your shape. Find your complements. No subscriptions. No upsells during assessment.
            </p>
          </motion.div>

          {/* Main pricing card */}
          <motion.div
            className="relative max-w-2xl mx-auto mb-20"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Animated glow pulse */}
            <motion.div
              className="absolute -inset-3 rounded-3xl pointer-events-none"
              style={{ background: "linear-gradient(135deg, oklch(0.68 0.08 165 / 0.08), oklch(0.78 0.12 85 / 0.06), oklch(0.78 0.12 85 / 0.08))" }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute -inset-2 rounded-3xl bg-primary/[0.06] blur-[20px] pointer-events-none" />

            <div className="relative glass-card rounded-2xl p-10 sm:p-12 border border-primary/20" style={{ boxShadow: "0 0 40px oklch(0.68 0.08 165 / 0.08), inset 0 1px 0 oklch(0.78 0.12 85 / 0.1)" }}>
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[0.65rem] font-bold px-5 py-1.5 rounded-full tracking-wider uppercase">
                Founding Member
              </div>

              {/* Price */}
              <div className="text-center mb-10 mt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-muted-foreground/40 text-xl line-through">$1,500</span>
                  <motion.span
                    className="text-6xl sm:text-7xl font-bold"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}
                    animate={{ textShadow: ["0 0 20px oklch(0.78 0.12 85 / 0.3)", "0 0 40px oklch(0.78 0.12 85 / 0.5)", "0 0 20px oklch(0.78 0.12 85 / 0.3)"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    $299
                  </motion.span>
                </div>
                <p className="text-muted-foreground/60 text-sm mt-2">Founding member rate (first 100). Regular price $1,500.</p>
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {includedFeatures.map((f) => (
                  <div key={f.text} className="flex items-start gap-3">
                    <f.icon className="w-4 h-4 mt-0.5 shrink-0 text-accent/80" />
                    <span className="text-sm text-foreground/80 leading-snug">{f.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full py-7 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 text-background glow-gold hover:translate-y-[-2px] active:scale-[0.97] transition-all duration-150"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Begin Your Assessment — $299"
                )}
              </Button>

              {/* Guarantee */}
              <p className="text-center text-xs text-muted-foreground/40 mt-4">
                30-day retake guarantee. If you disagree with your results, retake free.
              </p>
            </div>
          </motion.div>



          {/* Trust bar */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 text-xs text-muted-foreground/40 uppercase tracking-wider mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <span>Bank-Grade Encryption</span>
            <span className="text-muted-foreground/20">•</span>
            <span>Encrypted &amp; Confidential</span>
            <span className="text-muted-foreground/20">•</span>
            <span>7 Patents Pending</span>
            <span className="text-muted-foreground/20">•</span>
            <span>30-Day Retake Guarantee</span>
          </motion.div>

          {/* Authority section — Influence: social proof + authority */}
          <motion.div
            className="mt-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="text-center text-xs uppercase tracking-[0.2em] text-accent/50 mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Built on Peer-Reviewed Research
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Gardner", field: "Multiple Intelligences" },
                { name: "Sternberg", field: "Triarchic Theory" },
                { name: "Goleman", field: "Emotional Intelligence" },
                { name: "Wilber", field: "Integral Theory" },
              ].map((researcher) => (
                <div
                  key={researcher.name}
                  className="glass-card rounded-xl p-4 text-center border border-white/[0.03]"
                >
                  <p className="text-sm font-semibold text-foreground">{researcher.name}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{researcher.field}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground/40 text-xs mt-6">
              32 intelligence lines derived from 4 foundational frameworks, scored by 5 AI systems from different developers.
            </p>
          </motion.div>

          {/* FAQ — Reduce uncertainty (Cialdini: remove objections) */}
          <motion.div
            className="mt-20 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="text-center text-xs uppercase tracking-[0.2em] text-accent/50 mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Common Questions
            </p>
            <div className="space-y-4">
              {[
                { q: "How long does the assessment take?", a: "The first 12 questions are free and take 30–60 minutes. After payment, you unlock 12 more questions that complete your full cognitive profile. You can pause and resume anytime — your progress is saved." },
                { q: "What if I disagree with my results?", a: "You get one free retake within 30 days. No questions asked. If you still disagree, we'll refund you." },
                { q: "Is my voice data stored?", a: "No. Your voice is processed in real-time by our AI systems and immediately discarded. Only the numerical scores and text transcriptions are retained." },
                { q: "How is this different from an IQ test?", a: "IQ measures one dimension. AQAL maps 32 independent intelligence axes — from spatial reasoning to empathic intelligence to meta-cognition. Your rarity is the statistical uniqueness of your entire 32-dimensional shape." },
                { q: "What's included in network access?", a: "Your Silver membership includes 5 complementary match introductions per month — people whose cognitive shape complements yours for collaboration, partnership, or mentorship. Upgrade to Gold or Platinum Diamond for unlimited matching." },
                { q: "Can I see a sample report before paying?", a: "Yes — take the free 12-question assessment first. You'll see your preliminary rarity score. The full 24-question profile, complete report, rarity underwriting, and Silver network access unlock after payment." },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group glass-card rounded-xl p-5 border border-white/[0.04] cursor-pointer"
                >
                  <summary className="flex items-center justify-between text-sm font-medium text-foreground list-none">
                    {faq.q}
                    <span className="text-muted-foreground/40 group-open:rotate-45 transition-transform duration-200 text-lg">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground/70 leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </motion.div>


        </div>
      </div>

      {/* Data Privacy & Consent Modal */}
      <Dialog open={showHipaaModal} onOpenChange={setShowHipaaModal}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl" style={{ fontFamily: "Cormorant Garamond, serif" }}>
              Data Privacy & Consent
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 space-y-3">
              <p>
                Here's exactly what we collect and why: your voice recordings and the
                transcripts we derive from them, used only to generate your intelligence
                profile. Nothing else.
              </p>
              <p>
                Your recordings are encrypted at rest and in transit, analyzed by AI
                systems to score your profile, and never sold or shared with third parties.
              </p>
              <p className="text-xs text-muted-foreground/60">
                You can request deletion of your data — recordings, transcripts, and scores —
                at any time, and we remove it. We are not a healthcare provider, and this
                assessment is not a medical or clinical service.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 mt-4 p-4 rounded-[var(--radius-container)] bg-secondary/50 border border-border">
            <Checkbox
              id="hipaa-consent"
              checked={hipaaConsent}
              onCheckedChange={(checked) => setHipaaConsent(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="hipaa-consent" className="text-sm text-foreground cursor-pointer leading-relaxed">
              I understand and consent to the collection and AI analysis of my voice data
              for the purpose of generating my cognitive intelligence profile.
            </label>
          </div>
          <DialogFooter className="mt-6 gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowHipaaModal(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckout}
              disabled={!hipaaConsent}
              className="bg-primary text-primary-foreground hover:bg-accent disabled:opacity-40"
            >
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PublicFooter />
    </div>
  );
}
