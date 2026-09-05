import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

function LetterCard({ letter, onRead }: { letter: any; onRead: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={`p-6 cursor-pointer transition-all duration-300 ${
        letter.readAt ? "bg-white/5 border-white/10" : "bg-white/8 border-cyan-500/30 shadow-lg shadow-cyan-500/5"
      }`}
      onClick={() => {
        setExpanded(!expanded);
        if (!letter.readAt) onRead(letter.id);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!letter.readAt && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            )}
            <h3 className="text-lg font-semibold text-white truncate">{letter.subject}</h3>
          </div>
          <p className="text-sm text-white/50">
            {letter.sentAt ? new Date(letter.sentAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
            {letter.repSystemUsed && (
              <span className="ml-2 text-cyan-400/60">• {letter.repSystemUsed} calibrated</span>
            )}
          </p>
        </div>
        <span className="text-white/30 text-sm shrink-0">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-white/80 leading-relaxed">
            {letter.body}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Coaching() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("");

  const { data: letters, isLoading: lettersLoading, refetch } = trpc.coaching.letters.useQuery(
    undefined,
    { enabled: !!user }
  );

  const generateMutation = trpc.coaching.generate.useMutation({
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("New coaching letter generated");
        setTopic("");
        refetch();
      }
    },
    onError: () => toast.error("Failed to generate letter"),
  });

  const markReadMutation = trpc.coaching.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Skeleton className="w-96 h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-white/60 mb-4">Coaching letters are available for Gold and Platinum members.</p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  const isGoldPlus = user.membershipTier === "gold" || user.membershipTier === "platinum";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="max-w-3xl mx-auto pt-24 pb-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-cyan-400 text-sm tracking-[0.2em] uppercase mb-2">Gold Tier Feature</p>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Coaching Letters from Peter
          </h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Personalized coaching written in your representational system. Every letter mirrors how your mind naturally processes information.
          </p>
        </div>

        {!isGoldPlus ? (
          /* Locked state for non-Gold users */
          <Card className="p-8 bg-white/5 border-white/10 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-white mb-2">Gold Membership Required</h2>
            <p className="text-white/60 mb-6">
              Coaching letters are calibrated to your NLP profile — your representational system, meta-programs, and sensory predicates.
              Upgrade to Gold to unlock personalized coaching from Peter.
            </p>
            <Button
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold"
              onClick={() => navigate("/pricing")}
            >
              Upgrade to Gold
            </Button>
          </Card>
        ) : (
          <>
            {/* Generate new letter */}
            <Card className="p-6 bg-white/5 border-cyan-500/20 mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Request a New Letter</h2>
              <p className="text-white/50 text-sm mb-4">
                Optionally provide a topic or challenge you're working through. Peter will write in your {" "}
                <span className="text-cyan-400">representational system</span> and calibrate to your meta-programs.
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., 'leadership presence' or 'creative blocks' (optional)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                <Button
                  onClick={() => generateMutation.mutate({ topic: topic || undefined })}
                  disabled={generateMutation.isPending}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shrink-0"
                >
                  {generateMutation.isPending ? "Writing..." : "Generate"}
                </Button>
              </div>
            </Card>

            {/* Letters list */}
            {lettersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : !letters || letters.length === 0 ? (
              <Card className="p-8 bg-white/5 border-white/10 text-center">
                <p className="text-white/50 text-lg mb-2">No letters yet</p>
                <p className="text-white/30 text-sm">Generate your first coaching letter above. Peter will calibrate to your NLP profile.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-white/40 text-sm">{letters.length} letter{letters.length !== 1 ? "s" : ""}</p>
                {letters.map((letter: any) => (
                  <LetterCard
                    key={letter.id}
                    letter={letter}
                    onRead={(id) => markReadMutation.mutate({ letterId: id })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Back nav */}
        <div className="text-center mt-12">
          <button onClick={() => navigate("/portal")} className="text-white/40 hover:text-white/70 text-sm transition-colors">
            ← Back to Profile
          </button>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
