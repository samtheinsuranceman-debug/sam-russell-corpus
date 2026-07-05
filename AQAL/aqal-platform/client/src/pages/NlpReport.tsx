import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const REP_SYSTEM_COLORS: Record<string, string> = {
  visual: "#60a5fa",
  auditory: "#a78bfa",
  kinesthetic: "#f97316",
  olfactory_gustatory: "#22c55e",
};

const REP_SYSTEM_LABELS: Record<string, string> = {
  visual: "Visual",
  auditory: "Auditory",
  kinesthetic: "Kinesthetic",
  olfactory_gustatory: "Olfactory / Gustatory",
};

const META_PROGRAM_LABELS: [string, string, string][] = [
  ["towardAway", "Away From", "Toward"],
  ["internalExternal", "External", "Internal"],
  ["optionsProcedures", "Procedures", "Options"],
  ["bigPictureDetail", "Detail", "Big Picture"],
  ["proactiveReactive", "Reactive", "Proactive"],
  ["matcherMismatcher", "Mismatcher", "Matcher"],
  ["selfOther", "Other", "Self"],
  ["possibilityNecessity", "Necessity", "Possibility"],
];

function RepSystemBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-white/50">{percent}%</span>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MetaProgramSlider({ label, leftPole, rightPole, value }: { label: string; leftPole: string; rightPole: string; value: number }) {
  const percent = Math.round(value * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-white/40 mb-1">
        <span>{leftPole}</span>
        <span>{rightPole}</span>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 transition-all duration-700"
          style={{ left: `calc(${percent}% - 6px)` }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 w-px h-4 bg-white/10" />
      </div>
    </div>
  );
}

export default function NlpReport() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading } = trpc.nlp.profile.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-white/60 mb-4">The NLP Sensory Report is available for Gold and Platinum members.</p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  const isGoldPlus = user.membershipTier === "gold" || user.membershipTier === "platinum";

  if (!isGoldPlus) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-cyan-400 text-sm tracking-[0.2em] uppercase mb-2">Gold Tier Feature</p>
          <h1 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Sensory System Analysis
          </h1>
          <Card className="p-8 bg-white/5 border-white/10">
            <div className="text-5xl mb-4">🧠</div>
            <h2 className="text-xl font-bold text-white mb-2">Gold Membership Required</h2>
            <p className="text-white/60 mb-6">
              Your sensory system analysis reveals how your mind encodes reality — visual, auditory, kinesthetic, or olfactory/gustatory.
              This data powers Peter's coaching letters and your complementary matching.
            </p>
            <Button
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold"
              onClick={() => navigate("/pricing")}
            >
              Upgrade to Gold
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-cyan-400 text-sm tracking-[0.2em] uppercase mb-2">Gold Tier Feature</p>
          <h1 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Sensory System Analysis
          </h1>
          <Card className="p-8 bg-white/5 border-white/10">
            <p className="text-white/60 mb-4">
              Complete your voice assessment first. Your NLP profile is extracted automatically during scoring.
            </p>
            <Button onClick={() => navigate("/assessment")} className="bg-cyan-500 text-white">
              Take Assessment
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const predicates = profile.sensoryPredicates as any;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="max-w-4xl mx-auto pt-24 pb-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-cyan-400 text-sm tracking-[0.2em] uppercase mb-2">Your NLP Profile</p>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Sensory System Analysis
          </h1>
          <p className="text-white/60 max-w-lg mx-auto">
            How your mind encodes reality. Extracted from your voice patterns, word choices, and linguistic structure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Representational System */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-semibold text-white mb-1">Representational System</h2>
            <p className="text-white/40 text-sm mb-6">How you primarily encode and access information</p>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: REP_SYSTEM_COLORS[profile.primaryRepSystem || "visual"] }}
                />
                <span className="text-white font-medium text-lg">
                  Primary: {REP_SYSTEM_LABELS[profile.primaryRepSystem || "visual"]}
                </span>
              </div>
              <p className="text-white/50 text-sm mb-4">
                Sequence: <span className="text-cyan-400 font-mono">{profile.repSystemSequence || "V-K-A"}</span>
              </p>
            </div>

            <RepSystemBar label="Visual" percent={profile.visualPercent} color={REP_SYSTEM_COLORS.visual} />
            <RepSystemBar label="Auditory" percent={profile.auditoryPercent} color={REP_SYSTEM_COLORS.auditory} />
            <RepSystemBar label="Kinesthetic" percent={profile.kinestheticPercent} color={REP_SYSTEM_COLORS.kinesthetic} />
            <RepSystemBar label="Olfactory / Gustatory" percent={profile.olfactoryGustatoryPercent} color={REP_SYSTEM_COLORS.olfactory_gustatory} />
          </Card>

          {/* Meta-Programs */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-semibold text-white mb-1">Meta-Programs</h2>
            <p className="text-white/40 text-sm mb-6">Your unconscious filters for processing experience</p>

            {META_PROGRAM_LABELS.map(([key, left, right]) => (
              <MetaProgramSlider
                key={key}
                label={key}
                leftPole={left}
                rightPole={right}
                value={(profile as any)[key] ?? 0.5}
              />
            ))}
          </Card>

          {/* Sensory Predicates */}
          <Card className="p-6 bg-white/5 border-white/10 md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-1">Sensory Predicates Detected</h2>
            <p className="text-white/40 text-sm mb-6">
              The specific words and phrases that reveal your representational system
            </p>

            {predicates ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(predicates).map(([system, words]: [string, any]) => (
                  <div key={system}>
                    <h3 className="text-sm font-medium mb-2" style={{ color: REP_SYSTEM_COLORS[system] || "#60a5fa" }}>
                      {REP_SYSTEM_LABELS[system] || system}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {(words as string[])?.slice(0, 12).map((word: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10"
                        >
                          {word}
                        </span>
                      ))}
                      {(words as string[])?.length > 12 && (
                        <span className="text-xs text-white/30">+{(words as string[]).length - 12} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No predicates extracted yet. Retake your assessment for richer data.</p>
            )}
          </Card>

          {/* Voice Patterns */}
          <Card className="p-6 bg-white/5 border-white/10 md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-1">Voice Patterns</h2>
            <p className="text-white/40 text-sm mb-6">Paralinguistic markers from your speech</p>

            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-cyan-400">{profile.wordsPerMinute ? Math.round(profile.wordsPerMinute) : "—"}</p>
                <p className="text-white/50 text-sm mt-1">Words/min</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-400">{profile.hesitationFrequency ? (profile.hesitationFrequency * 100).toFixed(0) + "%" : "—"}</p>
                <p className="text-white/50 text-sm mt-1">Hesitation Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-400">{profile.confidenceScore ? (profile.confidenceScore * 100).toFixed(0) + "%" : "—"}</p>
                <p className="text-white/50 text-sm mt-1">Confidence</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-10">
          <Button
            variant="outline"
            onClick={() => navigate("/coaching")}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            Get Coaching Letter →
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/portal")}
            className="border-white/20 text-white/60 hover:bg-white/5"
          >
            ← Back to Profile
          </Button>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
