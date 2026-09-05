import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, Crown, Sparkles, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useDebounce } from "@/hooks/useDebounce";
import { PrefetchLink } from "@/components/PrefetchLink";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const TIERS = [
  {
    name: "Silver",
    price: "$99",
    period: "/month",
    description: "Essential intelligence tracking",
    features: [
      "Full 32-axis radar chart",
      "Monthly re-assessment",
      "Power Combination analysis",
      "PDF export",
      "Basic evidence submission",
      "Network matching (5 introductions/month)",
    ],
    icon: Star,
    buttonClass: "bg-muted/30 text-foreground hover:bg-muted/50 border border-muted/30",
  },
  {
    name: "Gold",
    price: "$499",
    period: "/month",
    description: "Deep analysis & growth tracking",
    popular: true,
    features: [
      "Everything in Silver",
      "Weekly re-assessment",
      "AI coaching sessions",
      "Growth trajectory analysis",
      "Priority evidence review",
      "Network matching (beta)",
      "Comparative analytics",
    ],
    icon: Sparkles,
    buttonClass: "bg-primary text-background font-semibold glow-gold hover:translate-y-[-1px] active:scale-[0.97]",
  },
  {
    name: "Platinum Diamond",
    price: "$2,999",
    period: "/month",
    description: "The world\u2019s most exclusive intelligence network",
    features: [
      "Everything in Gold",
      "Unlimited assessments",
      "1-on-1 AI strategy sessions",
      "Private intelligence network",
      "Custom research reports",
      "White-glove evidence curation",
      "Exclusive events access",
      "Founding member benefits",
    ],
    icon: Crown,
    buttonClass: "bg-gradient-to-r from-primary to-aqal-purple text-white font-semibold glow-gold hover:translate-y-[-1px] active:scale-[0.97]",
    prismatic: true,
  },
];

export default function Membership() {
  useScrollReveal();
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const debouncedPromo = useDebounce(promoCode, 500);

  const validatePromo = trpc.promo.validate.useQuery(
    { code: promoCode },
    { enabled: false }
  );

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    const result = await validatePromo.refetch();
    if (result.data?.valid) {
      setPromoValid(true);
      setPromoDiscount(result.data.discountPercent || 0);
      toast.success(`Promo code applied! ${result.data.discountPercent}% off — referred by ${result.data.influencerName}`);
    } else {
      setPromoValid(false);
      toast.error("Invalid promo code");
    }
  };

  // Auto-validate promo code after debounce (user stops typing for 500ms)
  useEffect(() => {
    if (debouncedPromo.trim().length >= 3) {
      handleValidatePromo();
    }
  }, [debouncedPromo]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, oklch(0.14 0.02 55) 0%, oklch(0.13 0.02 55) 50%, oklch(0.12 0.02 55) 100%)`,
        }}
      />
      {/* Gradient mesh overlay */}
      <div className="gradient-mesh" />

      <PublicHeader />

      <main className="relative z-10 container section-spacing px-4">
        {/* Hero */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="display-1 text-foreground mb-3">
            Unlock Your Full Potential
          </h1>
          <p className="text-muted-foreground/70 max-w-lg mx-auto leading-relaxed">
            Join the network of the world&rsquo;s rarest minds. Continuous assessment, AI coaching, and exclusive connections.
          </p>
          <p className="section-label mt-4 text-glow-gold">
            FOUNDING MEMBER RATES &mdash; LIMITED TO FIRST 100
          </p>
        </motion.div>

        {/* Promo Code */}
        <motion.div
          className="max-w-md mx-auto mb-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="glass-card rounded-xl p-4 flex gap-3 items-center">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoValid(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleValidatePromo(); }}
              placeholder="PROMO CODE"
              className="flex-1 px-4 py-2.5 rounded-lg bg-muted/10 border border-muted/20 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 font-mono text-sm tracking-wider"
            />
            <Button
              onClick={handleValidatePromo}
              className="bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 px-5"
            >
              Apply
            </Button>
          </div>
          {promoValid === true && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-400 text-xs mt-2 flex items-center gap-1 pl-4"
            >
              <Check className="w-3 h-3" /> {promoDiscount}% discount applied
            </motion.p>
          )}
          {promoValid === false && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs mt-2 pl-4"
            >
              Invalid or expired code
            </motion.p>
          )}
        </motion.div>

        {/* Tier Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            const discountedPrice = promoDiscount > 0
              ? `$${Math.round(parseInt(tier.price.replace(/[^0-9]/g, "")) * (1 - promoDiscount / 100))}`
              : tier.price;

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="relative"
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold z-20"
                    style={{
                      background: "oklch(0.78 0.12 85)",
                      color: "oklch(0.12 0.02 260)",
                      boxShadow: "0 0 15px oklch(0.78 0.12 85 / 0.3)",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                {/* Prismatic border for Platinum */}
                <div className={`h-full rounded-2xl ${tier.prismatic ? "prismatic-border p-[2px]" : ""}`}>
                  <div className={`glass-card rounded-2xl p-6 h-full flex flex-col ${tier.prismatic ? "!rounded-[14px]" : ""}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                    </div>

                    <div className="mb-3">
                      {promoDiscount > 0 && (
                        <span className="text-muted-foreground/40 line-through text-sm mr-2">{tier.price}</span>
                      )}
                      <span
                        className="text-3xl font-bold text-foreground"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {discountedPrice}
                      </span>
                      <span className="text-muted-foreground/50 text-sm">{tier.period}</span>
                    </div>

                    <p className="text-muted-foreground/60 text-sm mb-6">{tier.description}</p>

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {tier.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-accent/70 shrink-0 mt-0.5" />
                          <span className="text-foreground/70">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button className={`w-full py-5 transition-all duration-150 ${tier.buttonClass}`}>
                      Get Started
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Footer */}
        <motion.div
          className="text-center mt-16 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="text-muted-foreground/40 text-sm">Cancel anytime. No long-term contracts.</p>
          <p className="text-muted-foreground/30 text-xs">All plans include the initial 32-line assessment ($499 value).</p>
        </motion.div>
      </main>

      {/* Shared footer */}
      <div className="relative z-10">
        <PublicFooter />
      </div>
    </div>
  );
}
