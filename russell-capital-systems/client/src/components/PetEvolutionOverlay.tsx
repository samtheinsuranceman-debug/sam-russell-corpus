/**
 * PetEvolutionOverlay — Full-screen celebration when a pet evolves to a new stage.
 * Shows animated transition with particle effects.
 * Listens for pet evolution events via polling.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEntrainment } from "@/contexts/EntrainmentEngine";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAGES = ["hatchling", "juvenile", "adolescent", "adult", "elder", "legendary"] as const;
type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  hatchling: "Hatchling", juvenile: "Juvenile", adolescent: "Adolescent",
  adult: "Adult", elder: "Elder", legendary: "Legendary",
};

const STAGE_EMOJIS: Record<string, Record<Stage, string>> = {
  phoenix: { hatchling: "🥚", juvenile: "🐣", adolescent: "🐦", adult: "🔥", elder: "🔥", legendary: "🌟" },
  dragon:  { hatchling: "🥚", juvenile: "🐲", adolescent: "🐉", adult: "🐉", elder: "🐉", legendary: "🌟" },
  wolf:    { hatchling: "🥚", juvenile: "🐶", adolescent: "🐺", adult: "🐺", elder: "🐺", legendary: "🌟" },
  eagle:   { hatchling: "🥚", juvenile: "🐤", adolescent: "🦅", adult: "🦅", elder: "🦅", legendary: "🌟" },
  lion:    { hatchling: "🥚", juvenile: "🐱", adolescent: "🦁", adult: "🦁", elder: "🦁", legendary: "🌟" },
};

const STAGE_COLORS: Record<Stage, string> = {
  hatchling: "from-gray-400/20 to-gray-500/20",
  juvenile: "from-green-400/20 to-emerald-500/20",
  adolescent: "from-blue-400/20 to-indigo-500/20",
  adult: "from-purple-400/20 to-pink-500/20",
  elder: "from-red-400/20 to-rose-500/20",
  legendary: "from-amber-400/20 to-orange-500/20",
};

export function PetEvolutionOverlay() {
  const { isAuthenticated } = useAuth();
  const { playSoundEffect } = useEntrainment();
  const [visible, setVisible] = useState(false);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("phoenix");
  const [fromStage, setFromStage] = useState<Stage>("hatchling");
  const [toStage, setToStage] = useState<Stage>("juvenile");
  const [animPhase, setAnimPhase] = useState<"old" | "transform" | "new">("old");
  const lastStage = useRef<Stage | null>(null);

  const { data: pet } = trpc.pet.get.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
    retry: false,
  });

  // Detect evolution
  useEffect(() => {
    if (!pet) return;
    const stage = (pet.evolutionStage || "hatchling") as Stage;
    if (lastStage.current !== null && stage !== lastStage.current) {
      const oldIdx = STAGES.indexOf(lastStage.current);
      const newIdx = STAGES.indexOf(stage);
      if (newIdx > oldIdx) {
        // Evolution happened!
        setPetName(pet.name || "Your Pet");
        setSpecies(pet.speciesId || "phoenix");
        setFromStage(lastStage.current);
        setToStage(stage);
        setAnimPhase("old");
        setVisible(true);

        try { playSoundEffect?.("level-up"); } catch {}

        setTimeout(() => setAnimPhase("transform"), 1500);
        setTimeout(() => setAnimPhase("new"), 3000);
      }
    }
    lastStage.current = stage;
  }, [pet, playSoundEffect]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  const emojis = STAGE_EMOJIS[species] || STAGE_EMOJIS.phoenix;
  const oldEmoji = emojis[fromStage] || "🥚";
  const newEmoji = emojis[toStage] || "🌟";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={dismiss} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `sparkle-float ${1.5 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-[#0b1628] border-2 border-amber-500/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-amber-500/20">
        <Button variant="ghost" size="sm" className="absolute top-3 right-3 text-[#4a6585] hover:text-white" onClick={dismiss}>
          <X size={16} />
        </Button>

        <div className="text-center mb-6">
          <Sparkles size={20} className="text-amber-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white">Evolution!</h2>
          <p className="text-sm text-[#7a95b8]">{petName} is evolving...</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${STAGE_COLORS[fromStage]} border border-[#12233e] flex items-center justify-center text-4xl transition-all duration-1000 ${
            animPhase === "old" ? "scale-100 opacity-100" : animPhase === "transform" ? "scale-75 opacity-50 blur-sm" : "scale-50 opacity-0"
          }`}>
            {oldEmoji}
          </div>
          <div className={`transition-all duration-500 ${animPhase === "transform" ? "text-amber-400 scale-125" : "text-[#2a3f5a]"}`}>
            <ArrowRight size={24} />
          </div>
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${STAGE_COLORS[toStage]} border-2 border-amber-500/50 flex items-center justify-center text-4xl transition-all duration-1000 ${
            animPhase === "new" ? "scale-100 opacity-100 animate-bounce" : animPhase === "transform" ? "scale-75 opacity-50 blur-sm" : "scale-50 opacity-0"
          }`}>
            {newEmoji}
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <span className="text-[10px] text-[#4a6585] uppercase tracking-wider">From</span>
            <p className="text-sm font-semibold text-[#7a95b8]">{STAGE_LABELS[fromStage]}</p>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider">To</span>
            <p className="text-sm font-bold text-amber-400">{STAGE_LABELS[toStage]}</p>
          </div>
        </div>

        {animPhase === "new" && (
          <div className="text-center">
            <Button onClick={dismiss} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold px-6">
              Amazing!
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sparkle-float {
          0%, 100% { transform: translateY(0) scale(0.5); opacity: 0; }
          25% { opacity: 1; transform: translateY(-20px) scale(1); }
          75% { opacity: 0.5; transform: translateY(-40px) scale(0.8); }
        }
      `}</style>
    </div>
  );
}
