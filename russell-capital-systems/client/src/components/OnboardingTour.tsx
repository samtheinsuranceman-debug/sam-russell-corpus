/**
 * OnboardingTour — Step-by-step guided tour for new users.
 * Walks through: Daily Briefing → Nerve Center → Arena → Add Client → Strategy Lab
 * Uses localStorage to track completion so it only shows once.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { X, ArrowRight, ArrowLeft, Sparkles, Sun, Brain, Swords, Users, FlaskConical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Russell Capital Systems",
    description: "Your AI-powered financial advisory command center. Let's take a quick tour of the key areas.",
    icon: Sparkles,
    color: "text-amber-400",
    bgColor: "from-amber-500/20 to-orange-500/20",
    path: "/portal/daily-briefing",
  },
  {
    id: "briefing",
    title: "Daily Briefing",
    description: "Start every day here. See your morning ritual progress, active quests, pet status, and revenue snapshot — all in one place. Hit 'Start My Day' to kick things off.",
    icon: Sun,
    color: "text-amber-400",
    bgColor: "from-amber-500/20 to-yellow-500/20",
    path: "/portal/daily-briefing",
  },
  {
    id: "nerve-center",
    title: "Nerve Center",
    description: "Your personal command hub. Track XP, level up, manage your skill tree, claim daily rewards, and monitor your Russell Number score.",
    icon: Brain,
    color: "text-cyan-400",
    bgColor: "from-cyan-500/20 to-blue-500/20",
    path: "/portal/nerve-center",
  },
  {
    id: "arena",
    title: "Quest Arena",
    description: "Complete daily and weekly quests to earn XP and RussellCoin. Open loot crates, compete on leaderboards, and unlock achievements.",
    icon: Swords,
    color: "text-purple-400",
    bgColor: "from-purple-500/20 to-pink-500/20",
    path: "/portal/arena",
  },
  {
    id: "clients",
    title: "Client Management",
    description: "Add and manage your clients here. Track their financial profiles, run strategies, and build your book of business.",
    icon: Users,
    color: "text-green-400",
    bgColor: "from-green-500/20 to-emerald-500/20",
    path: "/portal/clients",
  },
  {
    id: "strategy",
    title: "Strategy Lab",
    description: "Run AI-powered financial strategies — Roth conversions, IUL projections, income gap analysis, and more. This is where the magic happens.",
    icon: FlaskConical,
    color: "text-blue-400",
    bgColor: "from-blue-500/20 to-indigo-500/20",
    path: "/portal/strategy-lab",
  },
];

const TOUR_KEY = "rc_onboarding_complete";

export function OnboardingTour() {
  const { isAuthenticated, user } = useAuth();
  const [location, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || location !== "/portal/dashboard") {
      setVisible(false);
      return;
    }
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Delay showing tour to let the page load
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, location]);

  const handleNext = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      navigate(TOUR_STEPS[nextStep].path);
    } else {
      // Tour complete
      localStorage.setItem(TOUR_KEY, "true");
      setVisible(false);
    }
  }, [step, navigate]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      navigate(TOUR_STEPS[prevStep].path);
    }
  }, [step, navigate]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />

      {/* Tour card */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-[#0b1628] border border-[#12233e] rounded-2xl shadow-2xl shadow-black/50 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Gradient header */}
          <div className={`bg-gradient-to-r ${current.bgColor} p-6 relative`}>
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl bg-[#0b1628]/50 flex items-center justify-center ${current.color}`}>
                <Icon size={24} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
                onClick={handleSkip}
              >
                <X size={16} />
              </Button>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-4">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-8 bg-white" :
                    i < step ? "w-4 bg-white/50" :
                    "w-4 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
            <p className="text-sm text-[#7a95b8] leading-relaxed">{current.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-6 pb-6">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#1a3050] text-[#7a95b8] hover:text-white"
                  onClick={handlePrev}
                >
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-[#4a6585] hover:text-white text-xs"
                onClick={handleSkip}
              >
                Skip tour
              </Button>
            </div>
            <Button
              size="sm"
              className={`bg-gradient-to-r ${current.bgColor} text-white font-semibold px-4`}
              onClick={handleNext}
            >
              {isLast ? (
                <span className="flex items-center gap-1"><CheckCircle2 size={14} /> Finish Tour</span>
              ) : (
                <span className="flex items-center gap-1">Next <ArrowRight size={14} /></span>
              )}
            </Button>
          </div>

          {/* Step counter */}
          <div className="text-center pb-4">
            <span className="text-[10px] text-[#2a3f5a]">
              Step {step + 1} of {TOUR_STEPS.length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
