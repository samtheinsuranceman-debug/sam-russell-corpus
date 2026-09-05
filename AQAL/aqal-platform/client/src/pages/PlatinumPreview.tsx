import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const PLATINUM_FEATURES = [
  {
    icon: "🎥",
    title: "Video Assessment",
    description: "Body-language reflection from a video conversation — micro-expressions, posture shifts, and gestural patterns, offered as an exploratory lens (not a validated clinical measure) alongside your 32 lines.",
    status: "Live — Platinum",
  },
  {
    icon: "👁️",
    title: "Eye-Accessing Cue Mapping",
    description: "An exploratory NLP eye-pattern lens on internal processing strategies — visual construct vs. recall, auditory dialogue, kinesthetic access. For self-reflection, not proven science.",
    status: "Live — Platinum",
  },
  {
    icon: "🧬",
    title: "Full Behavioral Profile",
    description: "Combined video + audio multimodal analysis. The most comprehensive intelligence profile available anywhere — 200+ behavioral markers.",
    status: "Live — Platinum",
  },
  {
    icon: "🤝",
    title: "Concierge Matching",
    description: "Personal introduction service. We hand-select complementary matches from our Coral-tier network and facilitate warm introductions.",
    status: "Coming Q3 2026",
  },
];

export default function PlatinumPreview() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-amber-400 text-sm tracking-[0.2em] uppercase mb-2">Coming Soon</p>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Platinum Tier
          </h1>
          <p className="text-white/60 max-w-lg mx-auto">
            The deepest level of self-knowledge available. Video-based multimodal analysis, eye-accessing cue mapping, and concierge matching.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {PLATINUM_FEATURES.map((feature) => (
            <Card key={feature.title} className="p-6 bg-white/5 border-white/10 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {feature.status}
                </span>
              </div>
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Waitlist CTA */}
        <Card className="p-8 bg-gradient-to-br from-amber-500/5 to-purple-500/5 border-amber-500/20 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Be First in Line</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Platinum tier launches Q3 2026. Current Gold and Turquoise members get priority access and founding-member pricing.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold"
              onClick={() => navigate("/video-assessment")}
            >
              Start Video Assessment
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white/60"
              onClick={() => navigate("/portal")}
            >
              Back to Profile
            </Button>
          </div>
        </Card>
      </div>
      </div>
      <PublicFooter />
    </div>
  );
}
