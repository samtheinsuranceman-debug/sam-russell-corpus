/**
 * DepthSelector — Cinematic Assessment Depth Chooser
 *
 * Visual metaphor: a vertical "depth gauge" where each level descends deeper,
 * with increasing visual intensity. The user picks how deep they want to go.
 *
 * depth × 20 = total questions
 */
import { useState, useCallback } from "react";
import { Zap, Target, Brain, Gauge, Crown, ChevronRight, Sparkles } from "lucide-react";

interface DepthSelectorProps {
  onSelect: (depth: number) => void;
  title?: string;
  description?: string;
}

const DEPTH_LEVELS = [
  {
    level: 1,
    questions: 20,
    label: "Quick Start",
    tagline: "The essentials — fast and focused",
    description: "Core questions that cover the fundamentals. Perfect for initial screenings or time-sensitive meetings.",
    icon: Zap,
    gradient: "from-emerald-500 to-emerald-600",
    glowColor: "shadow-emerald-500/30",
    ringColor: "ring-emerald-500/40",
    textColor: "text-emerald-400",
    bgAccent: "bg-emerald-500/5",
    barWidth: "20%",
    timeEstimate: "~5 min",
  },
  {
    level: 2,
    questions: 40,
    label: "Standard",
    tagline: "Solid coverage across all domains",
    description: "Balanced depth that touches every major category. The industry standard — but we go further.",
    icon: Target,
    gradient: "from-blue-500 to-blue-600",
    glowColor: "shadow-blue-500/30",
    ringColor: "ring-blue-500/40",
    textColor: "text-blue-400",
    bgAccent: "bg-blue-500/5",
    barWidth: "40%",
    timeEstimate: "~12 min",
  },
  {
    level: 3,
    questions: 60,
    label: "Comprehensive",
    tagline: "Where most competitors stop — we're just warming up",
    description: "Thorough analysis with scenario-based questions. Uncovers blind spots that surface-level assessments miss.",
    icon: Brain,
    gradient: "from-violet-500 to-purple-600",
    glowColor: "shadow-violet-500/30",
    ringColor: "ring-violet-500/40",
    textColor: "text-violet-400",
    bgAccent: "bg-violet-500/5",
    barWidth: "60%",
    timeEstimate: "~20 min",
  },
  {
    level: 4,
    questions: 80,
    label: "Advanced",
    tagline: "Deep behavioral and situational analysis",
    description: "Nuanced questions that probe edge cases, emotional triggers, and complex financial scenarios most advisors never ask.",
    icon: Gauge,
    gradient: "from-orange-500 to-amber-600",
    glowColor: "shadow-orange-500/30",
    ringColor: "ring-orange-500/40",
    textColor: "text-orange-400",
    bgAccent: "bg-orange-500/5",
    barWidth: "80%",
    timeEstimate: "~30 min",
  },
  {
    level: 5,
    questions: 100,
    label: "Elite",
    tagline: "10× deeper than any competitor — the full picture",
    description: "The complete assessment. Every dimension explored. Produces a client profile so detailed it becomes your competitive moat.",
    icon: Crown,
    gradient: "from-amber-400 to-yellow-500",
    glowColor: "shadow-amber-400/40",
    ringColor: "ring-amber-400/40",
    textColor: "text-amber-400",
    bgAccent: "bg-amber-400/5",
    barWidth: "100%",
    timeEstimate: "~45 min",
  },
];

export default function DepthSelector({
  onSelect,
  title = "Choose Your Assessment Depth",
  description = "How deep do you want to go? Each level multiplies by 20 questions.",
}: DepthSelectorProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const handleSelect = useCallback(
    (level: number) => {
      setSelectedLevel(level);
      setTimeout(() => onSelect(level), 400);
    },
    [onSelect]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Sparkles className="w-3 h-3" />
          Depth × 20 = Total Questions
        </div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">{description}</p>
      </div>

      {/* Depth gauge visualization */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-[29px] top-8 bottom-8 w-px bg-gradient-to-b from-emerald-500/40 via-violet-500/40 to-amber-400/40" />

        <div className="space-y-3">
          {DEPTH_LEVELS.map((d) => {
            const Icon = d.icon;
            const isHovered = hoveredLevel === d.level;
            const isSelected = selectedLevel === d.level;
            const isActive = isHovered || isSelected;

            return (
              <button
                key={d.level}
                type="button"
                className={`
                  relative w-full text-left rounded-xl border-2 transition-all duration-300 ease-out
                  ${isSelected
                    ? `border-transparent ring-2 ${d.ringColor} bg-gradient-to-r ${d.gradient} shadow-lg ${d.glowColor}`
                    : isActive
                      ? `border-slate-600 ${d.bgAccent} shadow-md ${d.glowColor}`
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                  }
                  ${isSelected ? "scale-[1.02]" : isActive ? "scale-[1.01]" : ""}
                `}
                onMouseEnter={() => setHoveredLevel(d.level)}
                onMouseLeave={() => setHoveredLevel(null)}
                onClick={() => handleSelect(d.level)}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Depth indicator dot */}
                  <div
                    className={`
                      relative z-10 flex-shrink-0 w-[42px] h-[42px] rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isSelected
                        ? "bg-white/20 shadow-inner"
                        : isActive
                          ? `bg-gradient-to-br ${d.gradient} shadow-md ${d.glowColor}`
                          : "bg-slate-800 border border-slate-700"
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-white" : isActive ? "text-white" : d.textColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold text-base ${isSelected ? "text-white" : ""}`}>
                        Level {d.level} — {d.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : `${d.bgAccent} ${d.textColor}`}`}>
                        {d.timeEstimate}
                      </span>
                    </div>
                    <p className={`text-sm italic ${isSelected ? "text-white/80" : d.textColor}`}>
                      {d.tagline}
                    </p>
                    {isActive && (
                      <p className={`text-xs mt-1.5 leading-relaxed ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                        {d.description}
                      </p>
                    )}

                    {/* Depth bar */}
                    {isActive && (
                      <div className="mt-2.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${d.gradient} transition-all duration-700 ease-out`}
                          style={{ width: d.barWidth }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Question count + arrow */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-2xl font-bold tabular-nums ${isSelected ? "text-white" : ""}`}>
                        {d.questions}
                      </div>
                      <div className={`text-[10px] uppercase tracking-wider ${isSelected ? "text-white/60" : "text-muted-foreground"}`}>
                        questions
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive ? `${isSelected ? "text-white" : d.textColor} translate-x-0.5` : "text-slate-600"
                      }`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom hint */}
      <p className="text-center text-xs text-muted-foreground">
        Higher depth levels include all questions from lower levels, plus additional specialized questions.
      </p>
    </div>
  );
}

export { DEPTH_LEVELS };
