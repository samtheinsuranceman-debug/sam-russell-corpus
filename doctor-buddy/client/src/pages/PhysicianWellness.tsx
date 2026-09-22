/**
 * Physician Wellness Program
 *
 * Burnout assessment built on the Maslach Burnout Inventory, adapted for
 * physicians: emotional exhaustion, depersonalization, and personal
 * accomplishment scored separately, then combined.
 *
 * Clinical scope only. Financial wellness is a separate product and is
 * deliberately not part of Doctor Buddy.
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";
import { trpc } from "@/lib/trpc";
import {
  Heart, Brain, Shield, Activity, Users,
  TrendingUp, Clock, Award, BookOpen, Stethoscope,
  BarChart3, ArrowRight, CheckCircle2, Star, Zap,
  Target, Flame, Coffee, Moon, Sun, ChevronRight,
  ExternalLink, Phone, Calendar, FileText, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

// ─── Burnout Assessment Questions ────────────────────────────────────────────
const BURNOUT_QUESTIONS = [
  { id: 1, text: "I feel emotionally drained from my work.", domain: "Emotional Exhaustion" },
  { id: 2, text: "I feel used up at the end of the workday.", domain: "Emotional Exhaustion" },
  { id: 3, text: "I feel fatigued when I get up in the morning and have to face another day on the job.", domain: "Emotional Exhaustion" },
  { id: 4, text: "I feel I treat some patients as if they were impersonal objects.", domain: "Depersonalization" },
  { id: 5, text: "Working with people all day is really a strain for me.", domain: "Depersonalization" },
  { id: 6, text: "I feel burned out from my work.", domain: "Depersonalization" },
  { id: 7, text: "I feel I'm positively influencing other people's lives through my work.", domain: "Personal Accomplishment" },
  { id: 8, text: "I feel very energetic.", domain: "Personal Accomplishment" },
  { id: 9, text: "I can easily create a relaxed atmosphere with my patients.", domain: "Personal Accomplishment" },
  { id: 10, text: "I deal very effectively with the problems of my patients.", domain: "Personal Accomplishment" },
];

const BURNOUT_OPTIONS = [
  { label: "Never", value: 0 },
  { label: "Rarely", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
  { label: "Very Often", value: 4 },
  { label: "Always", value: 5 },
];

// ─── Wellness Modules ────────────────────────────────────────────────────────
const WELLNESS_MODULES = [
  {
    id: "burnout",
    title: "Burnout Prevention",
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-950/30",
    borderColor: "border-orange-800/30",
    description: "Evidence-based burnout assessment using the Maslach Burnout Inventory adapted for physicians. Track emotional exhaustion, depersonalization, and personal accomplishment.",
    features: ["MBI-based assessment", "Longitudinal tracking", "Peer benchmarking", "Personalized interventions"],
  },
  {
    id: "resilience",
    title: "Resilience Training",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-950/30",
    borderColor: "border-blue-800/30",
    description: "Cognitive behavioral techniques, mindfulness practices, and stress management strategies specifically designed for the unique pressures of medical practice.",
    features: ["CBT modules", "Mindfulness exercises", "Stress inoculation", "Peer support groups"],
  },
  {
    id: "worklife",
    title: "Work-Life Integration",
    icon: Moon,
    color: "text-purple-400",
    bgColor: "bg-purple-950/30",
    borderColor: "border-purple-800/30",
    description: "Tools for managing clinical schedules, setting boundaries, and protecting personal time. Includes sleep optimization and recovery protocols.",
    features: ["Schedule optimization", "Boundary setting", "Sleep tracking", "Recovery protocols"],
  },
  {
    id: "peer",
    title: "Peer Support Network",
    icon: Users,
    color: "text-cyan-400",
    bgColor: "bg-cyan-950/30",
    borderColor: "border-cyan-800/30",
    description: "Anonymous peer support groups, mentorship matching, and Schwartz Center Rounds facilitation for processing difficult clinical experiences.",
    features: ["Anonymous forums", "Mentorship matching", "Schwartz Rounds", "Crisis peer support"],
  },
  {
    id: "career",
    title: "Career Vitality",
    icon: TrendingUp,
    color: "text-yellow-400",
    bgColor: "bg-yellow-950/30",
    borderColor: "border-yellow-800/30",
    description: "Rediscover meaning in medicine through purpose alignment, leadership development, and career transition support when needed.",
    features: ["Purpose alignment", "Leadership coaching", "CME integration", "Career transitions"],
  },
];

// ─── Program Tiers ───────────────────────────────────────────────────────────
const PROGRAM_TIERS = [
  {
    name: "Individual",
    price: "$49",
    period: "/month",
    description: "For physicians seeking personal wellness support",
    features: [
      "Burnout assessment & tracking",
      "Resilience training modules",
      "Dr. Buddy AI wellness advisor",
      "Sleep & recovery tools",
      "Monthly wellness report",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Practice",
    price: "$299",
    period: "/month",
    description: "For medical practices (up to 10 physicians)",
    features: [
      "Everything in Individual",
      "Practice-wide burnout dashboard",
      "Peer support group facilitation",
      "Practice-wide resilience curriculum",
      "Quarterly wellness reviews",
      "CME credit tracking",
      "Anonymous reporting system",
    ],
    cta: "Contact Sales",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For hospital systems & large groups",
    features: [
      "Everything in Practice",
      "Unlimited physicians",
      "Custom EHR integration",
      "Schwartz Rounds facilitation",
      "Executive coaching",
      "Custom burnout benchmarking cohorts",
      "Dedicated success manager",
      "Custom reporting & analytics",
    ],
    cta: "Schedule Demo",
    popular: false,
  },
];

export default function PhysicianWellness() {
  const { isAuthenticated, user } = useAuth();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [burnoutStep, setBurnoutStep] = useState(0);
  const [burnoutAnswers, setBurnoutAnswers] = useState<Record<number, number>>({});
  const [showBurnoutResult, setShowBurnoutResult] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);

  const handleBurnoutAnswer = (questionId: number, value: number) => {
    const newAnswers = { ...burnoutAnswers, [questionId]: value };
    setBurnoutAnswers(newAnswers);
    if (burnoutStep < BURNOUT_QUESTIONS.length - 1) {
      setTimeout(() => setBurnoutStep(burnoutStep + 1), 300);
    } else {
      setShowBurnoutResult(true);
    }
  };

  const getBurnoutScore = () => {
    const ee = [1, 2, 3].reduce((sum, id) => sum + (burnoutAnswers[id] ?? 0), 0);
    const dp = [4, 5, 6].reduce((sum, id) => sum + (burnoutAnswers[id] ?? 0), 0);
    const pa = [7, 8, 9, 10].reduce((sum, id) => sum + (burnoutAnswers[id] ?? 0), 0);
    const eeMax = 15, dpMax = 15, paMax = 20;
    const eePercent = Math.round((ee / eeMax) * 100);
    const dpPercent = Math.round((dp / dpMax) * 100);
    const paPercent = Math.round(((paMax - pa) / paMax) * 100); // Inverted — low PA = high burnout
    const overall = Math.round((eePercent + dpPercent + paPercent) / 3);
    return { ee: eePercent, dp: dpPercent, pa: paPercent, overall };
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: "High Risk", color: "text-red-400", bg: "bg-red-950/30" };
    if (score >= 40) return { label: "Moderate Risk", color: "text-yellow-400", bg: "bg-yellow-950/30" };
    return { label: "Low Risk", color: "text-green-400", bg: "bg-green-950/30" };
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-gray-950 to-emerald-950/30" />
        <div className="relative container py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-3 py-1 rounded-full bg-violet-600/20 border border-violet-700/30 text-violet-300">
                Maslach Burnout Inventory · adapted for physicians
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Physician Wellness
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">
                Program
              </span>
            </h1>
            <p className="text-lg text-gray-400 mt-4 max-w-2xl">
              Physicians die by suicide at roughly twice the rate of the general workforce, and burnout is the
              strongest modifiable driver. This program measures it on a validated instrument, tracks it
              longitudinally, and routes the clinician to real support — not a score in isolation.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-500 text-white"
                onClick={() => setShowAssessment(true)}
              >
                <Stethoscope className="h-5 w-5 mr-2" />
                Take Burnout Assessment
              </Button>
              <a href="/crisis">
                <Button size="lg" variant="outline" className="border-rose-700 text-rose-300 hover:bg-rose-950/30">
                  <Heart className="h-5 w-5 mr-2" />
                  Crisis Resources
                </Button>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { stat: "63%", label: "of physicians report burnout symptoms", icon: Flame },
              { stat: "1 in 15", label: "physicians report suicidal ideation in the past year", icon: Shield },
              { stat: "300-400", label: "physician suicides per year in US", icon: Heart },
              { stat: "2x", label: "burnout rate vs. general workforce", icon: TrendingUp },
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 border-gray-800">
                <CardContent className="p-4 text-center">
                  <item.icon className="h-5 w-5 text-violet-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{item.stat}</div>
                  <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Burnout Assessment Modal */}
      {showAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Physician Burnout Assessment</h2>
                <p className="text-xs text-gray-500 mt-0.5">Based on the Maslach Burnout Inventory (MBI)</p>
              </div>
              <button onClick={() => { setShowAssessment(false); setBurnoutStep(0); setBurnoutAnswers({}); setShowBurnoutResult(false); }} className="text-gray-500 hover:text-white p-2">
                ✕
              </button>
            </div>

            <div className="px-6 py-6">
              {!showBurnoutResult ? (
                <div className="space-y-6">
                  {/* Progress */}
                  <div className="flex gap-1">
                    {BURNOUT_QUESTIONS.map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= burnoutStep ? "bg-violet-500" : "bg-gray-800"}`} />
                    ))}
                  </div>

                  <div className="text-center space-y-4">
                    <span className="text-xs text-gray-500">Question {burnoutStep + 1} of {BURNOUT_QUESTIONS.length}</span>
                    <p className="text-sm font-medium text-white leading-relaxed">
                      {BURNOUT_QUESTIONS[burnoutStep].text}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                      {BURNOUT_QUESTIONS[burnoutStep].domain}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {BURNOUT_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={burnoutAnswers[BURNOUT_QUESTIONS[burnoutStep].id] === opt.value ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handleBurnoutAnswer(BURNOUT_QUESTIONS[burnoutStep].id, opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-center text-white">Your Burnout Profile</h3>

                  {(() => {
                    const scores = getBurnoutScore();
                    const risk = getRiskLevel(scores.overall);
                    return (
                      <>
                        <div className={`text-center p-4 rounded-xl ${risk.bg}`}>
                          <div className={`text-3xl font-bold ${risk.color}`}>{scores.overall}%</div>
                          <p className={`text-sm font-semibold ${risk.color}`}>{risk.label}</p>
                          <p className="text-xs text-gray-500 mt-1">Overall Burnout Risk Score</p>
                        </div>

                        <div className="space-y-3">
                          {[
                            { label: "Emotional Exhaustion", score: scores.ee, desc: "Feeling emotionally drained by work" },
                            { label: "Depersonalization", score: scores.dp, desc: "Treating patients impersonally" },
                            { label: "Reduced Accomplishment", score: scores.pa, desc: "Feeling ineffective at work" },
                          ].map((domain) => {
                            const domainRisk = getRiskLevel(domain.score);
                            return (
                              <div key={domain.label} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">{domain.label}</span>
                                  <span className={`text-xs font-semibold ${domainRisk.color}`}>{domain.score}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full">
                                  <div
                                    className={`h-full rounded-full ${domain.score >= 70 ? "bg-red-500" : domain.score >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                                    style={{ width: `${domain.score}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-600">{domain.desc}</p>
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-white">Recommended Next Steps</h4>
                          {scores.overall >= 70 ? (
                            <div className="space-y-2">
                              <p className="text-xs text-red-300 bg-red-950/30 p-3 rounded-lg">
                                Your burnout risk is high. We strongly recommend speaking with a mental health professional.
                                The Physician Support Line (1-888-409-0141) offers free, confidential support.
                              </p>
                              <a href="tel:18884090141">
                                <Button className="w-full bg-red-600 hover:bg-red-500 text-white">
                                  <Phone className="h-4 w-4 mr-2" /> Call Physician Support Line
                                </Button>
                              </a>
                            </div>
                          ) : scores.overall >= 40 ? (
                            <p className="text-xs text-yellow-300 bg-yellow-950/30 p-3 rounded-lg">
                              Moderate burnout risk detected. Consider enrolling in the resilience training
                              module and scheduling a peer support session.
                            </p>
                          ) : (
                            <p className="text-xs text-green-300 bg-green-950/30 p-3 rounded-lg">
                              Your burnout risk is currently low. Continue maintaining healthy boundaries
                              and consider our preventive wellness modules to stay resilient.
                            </p>
                          )}
                        </div>

                        <Button
                          className="w-full bg-violet-600 hover:bg-violet-500"
                          onClick={() => { setShowAssessment(false); toast.success("Assessment saved. Check your wellness dashboard for personalized recommendations."); }}
                        >
                          Save & View Recommendations
                        </Button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wellness Modules */}
      <div className="container py-8">
        <h2 className="text-2xl font-bold mb-6">Wellness Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WELLNESS_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card
                key={mod.id}
                className={`${mod.bgColor} ${mod.borderColor} border hover:border-gray-600 transition-all cursor-pointer ${
                  activeModule === mod.id ? "ring-2 ring-violet-500/50" : ""
                }`}
                onClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-white/5`}>
                      <Icon className={`h-5 w-5 ${mod.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">{mod.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{mod.description}</p>

                  {activeModule === mod.id && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      {mod.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pricing */}
      <div className="container py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Program Tiers</h2>
          <p className="text-sm text-gray-500 mt-2">Choose the plan that fits your practice</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PROGRAM_TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`bg-gray-900/60 border-gray-800 ${tier.popular ? "ring-2 ring-violet-500 relative" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 rounded-full text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-white">{tier.price}</span>
                    <span className="text-sm text-gray-500">{tier.period}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{tier.description}</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-800">
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
                <Button
                  className={`w-full ${tier.popular ? "bg-violet-600 hover:bg-violet-500" : "bg-gray-800 hover:bg-gray-700"} text-white`}
                  onClick={() => toast.info("Enrollment opening soon. Join the waitlist!")}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* What the program measures */}
      <div className="container py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">What the Score Actually Measures</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-orange-950/20 border-orange-800/30">
            <CardContent className="p-6 text-center">
              <Flame className="h-8 w-8 text-orange-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">Emotional Exhaustion</h3>
              <p className="text-xs text-gray-400 mt-2">
                Depletion of emotional resources by the work itself. The earliest and most responsive of the
                three subscales, and the one that moves first when workload changes.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-violet-950/20 border-violet-800/30">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-violet-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">Depersonalization</h3>
              <p className="text-xs text-gray-400 mt-2">
                Detached, impersonal responses toward patients. Clinically the most concerning subscale,
                because it degrades care quality before the clinician notices it.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-cyan-950/20 border-cyan-800/30">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">Personal Accomplishment</h3>
              <p className="text-xs text-gray-400 mt-2">
                Sense of competence and achievement at work. Scored inversely — a low score raises burnout
                risk — which is why it is reported separately rather than folded away.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="container pb-12">
        <Card className="bg-gray-900/40 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 text-center">
              The Physician Wellness Program is not a substitute for professional mental health treatment.
              If you are experiencing a mental health crisis, call 988 (Suicide & Crisis Lifeline) or the
              Physician Support Line at 1-888-409-0141. Results are a screening aid for the clinician, not a
              diagnosis, and are never a basis for an employment or credentialing decision.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
