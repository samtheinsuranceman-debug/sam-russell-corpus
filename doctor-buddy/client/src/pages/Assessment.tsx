import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Brain, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { CrisisDetectionBanner, type CrisisTier } from "@/components/CrisisDetectionBanner";
import { DSM5_QUESTIONS, getSkippedIds } from "@shared/intake/questions";
import { scoreIntake, assessSafety, SUFFICIENCY_THRESHOLD } from "@shared/intake/scoring";
import {
  loadDraft,
  saveDraft,
  clearDraft,
  saveLocalResult,
  localResultId,
} from "@/lib/intakeStorage";
import { useAuth } from "@/_core/hooks/useAuth";

const DOMAIN_COLORS: Record<string, string> = {
  Depression: "text-blue-400", Anxiety: "text-yellow-400", PTSD: "text-red-400",
  Bipolar: "text-purple-400", OCD: "text-orange-400", Psychosis: "text-pink-400",
  "Substance Use": "text-amber-400", ADHD: "text-cyan-400", Personality: "text-violet-400",
  Somatic: "text-teal-400", Sleep: "text-indigo-400", Eating: "text-rose-400", General: "text-primary",
};

export default function Assessment() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumed, setResumed] = useState(false);

  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const createAssessment = trpc.assessment.start.useMutation();
  const saveProgress = trpc.assessment.saveProgress.useMutation();
  const completeAssessment = trpc.assessment.complete.useMutation();

  // Compute which questions are visible given current answers
  const skippedIds = getSkippedIds(answers);
  const visibleQuestions = DSM5_QUESTIONS.filter(q => !skippedIds.has(q.id));

  const currentQ = visibleQuestions[currentIndex] ?? DSM5_QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / visibleQuestions.length) * 100;
  const currentAnswer = answers[currentQ.id.toString()];

  // Server persistence is an enhancement, never a precondition. If the backend
  // is absent the intake still runs end to end on local storage and the local
  // scorer, which is what makes it usable before login.
  const handleStart = async () => {
    if (!isAuthenticated) return;
    try {
      const result = await createAssessment.mutateAsync({ sessionId });
      setAssessmentId(result.id);
    } catch {
      // Intentionally quiet. The visitor loses nothing they can perceive, and a
      // red toast on a working form only teaches them to distrust it.
      console.info("[intake] running locally; server persistence unavailable");
    }
  };

  // Resume an interrupted intake before touching the network.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft.answers).length > 0) {
      setAnswers(draft.answers);
      setCurrentIndex(draft.currentIndex);
      setResumed(true);
    }
    handleStart();
  }, [isAuthenticated]);

  const [crisisTier, setCrisisTier] = useState<CrisisTier>(null);
  // Highest urgency the patient has already acknowledged. The modal re-raises
  // only when the disclosure gets worse, so acknowledging once does not mean
  // being re-interrupted on every remaining question.
  const [ackUrgency, setAckUrgency] = useState<"none" | "same_day" | "immediate">("none");

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [currentQ.id.toString()]: answer };
    setAnswers(newAnswers);

    // Safety routing comes from the shared scorer, so the page and the report
    // cannot disagree about whether an answer was a crisis signal.
    const safety = assessSafety(newAnswers);
    const RANK = { none: 0, same_day: 1, immediate: 2 } as const;
    if (safety.flagged && RANK[safety.urgency] > RANK[ackUrgency]) {
      setCrisisTier(safety.urgency === "immediate" ? "tier1_emergency" : "tier2_high_risk");
    }

    // Local first — this is the write that always succeeds.
    saveDraft(newAnswers, currentIndex);
    if (assessmentId && isAuthenticated) {
      saveProgress.mutate({ id: assessmentId, currentQuestionIndex: currentIndex, answers: newAnswers });
    }

    // Recompute visible questions with the new answer to get accurate next index
    const newSkipped = getSkippedIds(newAnswers);
    const newVisible = DSM5_QUESTIONS.filter(q => !newSkipped.has(q.id));
    if (currentIndex < newVisible.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Score locally first. This is deterministic, needs no network, and is the
    // result the visitor is guaranteed to get.
    const local = scoreIntake(answers);
    const id = localResultId();
    saveLocalResult({ id, result: local, answers, completedAt: Date.now() });

    // Then try to enrich with the server's AI report. Failure is not an error
    // the visitor needs to see — they already have a scored result.
    if (assessmentId && isAuthenticated) {
      try {
        toast.info("Scoring complete. Generating the expanded AI report…");
        const result = await completeAssessment.mutateAsync({ id: assessmentId, answers });
        clearDraft();
        navigate(`/report/${result.reportId}`);
        return;
      } catch (err) {
        console.info("[intake] AI report unavailable, showing local result", err);
      }
    }

    clearDraft();
    toast.success("Assessment scored.");
    navigate(`/report/${id}`);
  };

  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;
  // Can submit when 75% of visible (non-skipped) questions are answered
  const canSubmit = answeredCount >= Math.floor(visibleQuestions.length * 0.75);
  const skippedCount = DSM5_QUESTIONS.length - visibleQuestions.length;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      {/* Crisis Detection Banner — triggered by suicidal ideation questions */}
      {crisisTier && (
        <div className="container py-2">
          <CrisisDetectionBanner
            tier={crisisTier}
            context="dsm5_intake"
            onDismiss={() => {
              setAckUrgency(crisisTier === "tier1_emergency" ? "immediate" : "same_day");
              setCrisisTier(null);
            }}
          />
        </div>
      )}
      <div className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">DSM-5 Psychiatric Assessment</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Mental Health Intake Form</h1>
          <p className="text-muted-foreground text-sm">100 DSM-5-aligned screening questions with adaptive branching. Your progress is saved locally in this browser first.</p>
          {!isAuthenticated && (
            <p className="text-xs text-cyan-300/80 mt-2">
              You can complete the screening locally without signing in. Sign in before submission if you want a persistent clinician-review report stored in the clinical system.
            </p>
          )}
        </div>

        {resumed && (
          <Card className="border-primary/30 bg-primary/5 mb-6">
            <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                Picked up where you left off — {answeredCount} answer{answeredCount === 1 ? "" : "s"} restored
                from this browser.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  clearDraft();
                  setAnswers({});
                  setCurrentIndex(0);
                  setResumed(false);
                }}
              >
                Start over
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentIndex + 1} of {visibleQuestions.length}{skippedCount > 0 ? ` (${skippedCount} skipped)` : ""}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{Math.ceil((DSM5_QUESTIONS.length - currentIndex) * 0.3)} min remaining</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex gap-2 mt-2 flex-wrap">
            {["Depression","Anxiety","PTSD","Bipolar","OCD","Psychosis","Substance Use","ADHD","Personality","General"].map(domain => {
              const domainQs = DSM5_QUESTIONS.filter(q => q.domain === domain);
              const answered = domainQs.filter(q => answers[q.id.toString()]).length;
              return (
                <Badge key={domain} variant="outline" className={`text-xs ${answered === domainQs.length ? "border-primary/50 text-primary" : "border-border text-muted-foreground"}`}>
                  {domain} {answered}/{domainQs.length}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        <Card className="border-border bg-card mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`text-xs ${DOMAIN_COLORS[currentQ.domain] || "text-primary"} border-current/30`}>
                {currentQ.domain}
              </Badge>
              <span className="text-xs text-muted-foreground">Q{currentQ.id}</span>
            </div>
            <CardTitle className="text-lg font-medium text-foreground leading-relaxed">
              {currentQ.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {currentQ.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    currentAnswer === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/30 text-foreground hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  {currentAnswer === option && <CheckCircle className="w-4 h-4 inline mr-2 text-primary" />}
                  {option}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0} className="border-border">
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          <div className="flex items-center gap-2">
            {canSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground glow-green-sm"
              >
                {isSubmitting ? (
                  <><span className="animate-pulse">Generating Report...</span></>
                ) : (
                  <>Submit & Get Report <CheckCircle className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            )}
            {!isLastQuestion && (
              <Button
                onClick={() => setCurrentIndex(i => Math.min(visibleQuestions.length - 1, i + 1))}
                className="bg-secondary text-foreground border border-border hover:border-primary/50"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress summary bar */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{answeredCount} of {visibleQuestions.length} answered{skippedCount > 0 ? ` · ${skippedCount} auto-skipped` : ""}</span>
          {!canSubmit && (
            <div className="flex items-center gap-1 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {Math.floor(visibleQuestions.length * 0.75) - answeredCount} more answers needed to unlock submission
            </div>
          )}
          {canSubmit && !isSubmitting && (
            <div className="flex items-center gap-1 text-primary">
              <CheckCircle className="w-3.5 h-3.5" />
              Ready to submit — click "Submit & Get Report" above
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
