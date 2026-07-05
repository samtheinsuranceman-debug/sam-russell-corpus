import { motion } from "framer-motion";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { Crown, Star, Sparkles, Lock, Check, Minus } from "lucide-react";

// ============================================================
// PRICING STRUCTURE — Full tier breakdown with usage limits & rarity gating
// ============================================================

const TIERS = [
  {
    name: "Silver",
    price: "$99",
    period: "/month",
    icon: Star,
    color: "oklch(0.7 0.03 250)",
    rarityReq: "None — any assessed member qualifies",
    rarityMin: 0,
    description: "Essential intelligence tracking for all assessed members.",
    features: {
      "32-axis radar chart": true,
      "Re-assessment frequency": "1x / month",
      "Power Combination analysis": true,
      "PDF report export": true,
      "Evidence submission": "3 uploads / month",
      "Network matching": "5 introductions / month",
      "AI coaching sessions": false,
      "Growth trajectory analysis": false,
      "Comparative analytics": false,
      "NLP coaching letters": false,
      "Custom research reports": false,
      "Private events": false,
      "1-on-1 strategy sessions": false,
      "Video assessment": false,
    },
  },
  {
    name: "Gold",
    price: "$499",
    period: "/month",
    icon: Sparkles,
    color: "oklch(0.78 0.12 85)",
    rarityReq: "1 in 1,000+ (Yellow stage / top 0.1%)",
    rarityMin: 1000,
    description: "Deep analysis & growth tracking for high-performers.",
    features: {
      "32-axis radar chart": true,
      "Re-assessment frequency": "1x / week",
      "Power Combination analysis": true,
      "PDF report export": true,
      "Evidence submission": "Unlimited",
      "Network matching": "Unlimited",
      "AI coaching sessions": "4 / month",
      "Growth trajectory analysis": true,
      "Comparative analytics": true,
      "NLP coaching letters": true,
      "Custom research reports": false,
      "Private events": false,
      "1-on-1 strategy sessions": false,
      "Video assessment": false,
    },
  },
  {
    name: "Platinum Diamond",
    price: "$2,999",
    period: "/month",
    icon: Crown,
    color: "oklch(0.85 0.15 320)",
    rarityReq: "1 in 5,000+ (Turquoise stage / top 0.02%)",
    rarityMin: 5000,
    description: "The world's most exclusive intelligence network.",
    features: {
      "32-axis radar chart": true,
      "Re-assessment frequency": "Unlimited",
      "Power Combination analysis": true,
      "PDF report export": true,
      "Evidence submission": "White-glove curation",
      "Network matching": "Unlimited + concierge",
      "AI coaching sessions": "Unlimited",
      "Growth trajectory analysis": true,
      "Comparative analytics": true,
      "NLP coaching letters": true,
      "Custom research reports": "2 / month",
      "Private events": true,
      "1-on-1 strategy sessions": "Weekly",
      "Video assessment": true,
    },
  },
];

const FEATURE_KEYS = [
  "32-axis radar chart",
  "Re-assessment frequency",
  "Power Combination analysis",
  "PDF report export",
  "Evidence submission",
  "Network matching",
  "AI coaching sessions",
  "Growth trajectory analysis",
  "Comparative analytics",
  "NLP coaching letters",
  "Custom research reports",
  "Private events",
  "1-on-1 strategy sessions",
  "Video assessment",
];

const RARITY_STAGES = [
  { stage: "Red", range: "0.00 – 0.20", rarity: "1 – 2", pop: "~20%", eligible: "Assessment only", color: "oklch(0.55 0.2 25)" },
  { stage: "Blue", range: "0.20 – 0.30", rarity: "2 – 3", pop: "~40%", eligible: "Silver", color: "oklch(0.5 0.15 250)" },
  { stage: "Orange", range: "0.30 – 0.50", rarity: "3 – 10", pop: "~30%", eligible: "Silver", color: "oklch(0.7 0.18 60)" },
  { stage: "Green", range: "0.50 – 0.70", rarity: "10 – 100", pop: "~10%", eligible: "Silver", color: "oklch(0.6 0.2 145)" },
  { stage: "Yellow", range: "0.70 – 0.85", rarity: "100 – 1,000", pop: "~1%", eligible: "Silver, Gold", color: "oklch(0.8 0.18 95)" },
  { stage: "Turquoise", range: "0.85 – 0.95", rarity: "1,000 – 10,000", pop: "~0.1%", eligible: "Silver, Gold, Platinum Diamond", color: "oklch(0.7 0.12 190)" },
  { stage: "Coral", range: "0.95 – 1.00", rarity: "10,000 – 100,000", pop: "~0.01%", eligible: "Silver, Gold, Platinum Diamond", color: "oklch(0.75 0.18 15)" },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-green-400 mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-sm text-foreground/80">{value}</span>;
}

export default function PricingStructure() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.p
            className="text-xs tracking-[0.3em] uppercase text-muted-foreground/60 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            Pricing Architecture
          </motion.p>
          <motion.h1
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Membership Tiers & Usage Limits
          </motion.h1>
          <motion.p
            className="text-muted-foreground/70 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Access is gated by rarity score. Higher developmental altitude unlocks higher tiers.
          </motion.p>
        </div>
      </section>

      {/* Assessment Pricing */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            Assessment Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: "oklch(0.78 0.12 85)" }}>$299</span>
                <span className="text-muted-foreground/50 text-sm line-through">$1,500</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Founding Member</h3>
              <p className="text-muted-foreground/60 text-sm mb-4">First 100 members only. Lifetime rate lock.</p>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Complete 32-axis voice assessment</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Five-AI consensus scoring</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Rarity underwriting report</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Silver network access included</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 30-day free retake guarantee</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-foreground/80">$1,500</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Regular</h3>
              <p className="text-muted-foreground/60 text-sm mb-4">After founding cohort fills. Standard pricing.</p>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Complete 32-axis voice assessment</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Five-AI consensus scoring</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Rarity underwriting report</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Silver network access included</li>
                <li className="flex items-center gap-2"><Minus className="w-4 h-4 text-muted-foreground/40" /> No retake guarantee</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            Membership Tiers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.name}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5" style={{ color: tier.color }} />
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold" style={{ color: tier.color }}>{tier.price}</span>
                    <span className="text-muted-foreground/50 text-sm">{tier.period}</span>
                  </div>
                  <p className="text-muted-foreground/60 text-sm mb-4">{tier.description}</p>
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/[0.04]">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground/60">{tier.rarityReq}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            Feature Comparison
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 text-muted-foreground/60 font-medium">Feature</th>
                  {TIERS.map(t => (
                    <th key={t.name} className="p-4 text-center font-medium" style={{ color: t.color }}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_KEYS.map((feature, i) => (
                  <tr key={feature} className={i % 2 === 0 ? "bg-white/[0.01]" : ""}>
                    <td className="p-4 text-foreground/70">{feature}</td>
                    {TIERS.map(t => (
                      <td key={t.name} className="p-4 text-center">
                        <FeatureCell value={t.features[feature as keyof typeof t.features]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Rarity Score Gating */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            Rarity Score Gating (Spiral Dynamics)
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 text-muted-foreground/60 font-medium">Stage</th>
                  <th className="text-left p-4 text-muted-foreground/60 font-medium">Score Range</th>
                  <th className="text-left p-4 text-muted-foreground/60 font-medium">Rarity (1 in X)</th>
                  <th className="text-left p-4 text-muted-foreground/60 font-medium">Population %</th>
                  <th className="text-left p-4 text-muted-foreground/60 font-medium">Eligible Tiers</th>
                </tr>
              </thead>
              <tbody>
                {RARITY_STAGES.map((s, i) => (
                  <tr key={s.stage} className={i % 2 === 0 ? "bg-white/[0.01]" : ""}>
                    <td className="p-4 font-medium" style={{ color: s.color }}>{s.stage}</td>
                    <td className="p-4 text-foreground/70 font-mono text-xs">{s.range}</td>
                    <td className="p-4 text-foreground/70">{s.rarity}</td>
                    <td className="p-4 text-foreground/70">{s.pop}</td>
                    <td className="p-4 text-foreground/70">{s.eligible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Access Rules */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            Access Rules
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <div className="flex gap-3">
              <span className="text-primary font-mono text-sm mt-0.5">01</span>
              <p className="text-foreground/70 text-sm">All assessed members may subscribe to <strong className="text-foreground">Silver</strong> regardless of rarity score.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-mono text-sm mt-0.5">02</span>
              <p className="text-foreground/70 text-sm"><strong className="text-foreground">Gold</strong> requires a composite rarity of 1 in 1,000+ (Yellow stage or above). Members below this threshold see Gold as locked.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-mono text-sm mt-0.5">03</span>
              <p className="text-foreground/70 text-sm"><strong className="text-foreground">Platinum Diamond</strong> requires a composite rarity of 1 in 5,000+ (Turquoise stage or above). Reserved for minds in the top 0.02%.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-mono text-sm mt-0.5">04</span>
              <p className="text-foreground/70 text-sm">Rarity scores are re-evaluated on each assessment. If a member's score drops below threshold, they retain access for <strong className="text-foreground">90 days</strong> (grace period) before downgrade.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-mono text-sm mt-0.5">05</span>
              <p className="text-foreground/70 text-sm"><strong className="text-foreground">Founding members</strong> (first 100) receive lifetime rate lock regardless of future price increases.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Notes */}
      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            Revenue Model
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3">
            <p className="text-foreground/70 text-sm"><strong className="text-foreground">Primary revenue driver:</strong> Silver tier ($99/mo) — highest volume, lowest barrier</p>
            <p className="text-foreground/70 text-sm"><strong className="text-foreground">Secondary revenue:</strong> Gold tier ($499/mo) — professionals who qualify and want depth</p>
            <p className="text-foreground/70 text-sm"><strong className="text-foreground">Aspirational tier:</strong> Platinum Diamond ($2,999/mo) — exclusive, low volume, high-touch</p>
            <p className="text-foreground/70 text-sm"><strong className="text-foreground">One-time revenue:</strong> Assessment fees ($299 founding / $1,500 regular)</p>
            <p className="text-muted-foreground/50 text-xs mt-4 italic">Do not rely on Platinum Diamond for revenue sustainability — it exists for exclusivity and brand positioning.</p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
