import { useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  X,
  BookOpen,
  Sparkles,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WizardStep {
  /** Step ID */
  id: string;
  /** Step title */
  title: string;
  /** Plain-English description of what this step does */
  description: string;
  /** Tooltip/help text shown on hover */
  helpText?: string;
  /** The form/input content for this step */
  content: ReactNode;
  /** Validation function — return true if step is complete */
  isValid?: () => boolean;
  /** Plain-English summary of the step's current values */
  getSummary?: () => string;
}

interface GuidedWizardProps {
  /** Wizard title */
  title: string;
  /** Wizard subtitle/description */
  subtitle?: string;
  /** Steps to display */
  steps: WizardStep[];
  /** Called when the wizard is completed (final step "Run" clicked) */
  onComplete: () => void;
  /** Whether the calculation is running */
  isRunning?: boolean;
  /** Result content to show after completion */
  resultContent?: ReactNode;
  /** Plain-English summary of the final result */
  resultSummary?: string;
  /** Whether to show the wizard in compact mode (inline) */
  compact?: boolean;
  /** Additional class names */
  className?: string;
  /** Label for the final action button */
  completeLabel?: string;
}

/**
 * GuidedWizard — Reusable step-by-step wizard framework for complex tools.
 *
 * Features:
 * - Numbered step indicators with completion status
 * - Plain-English descriptions and tooltips at every step
 * - Step validation before advancing
 * - Summary view of all inputs before running
 * - Result display with plain-English interpretation
 * - Compact mode for embedding in existing pages
 */
export function GuidedWizard({
  title,
  subtitle,
  steps,
  onComplete,
  isRunning = false,
  resultContent,
  resultSummary,
  compact = false,
  className = "",
  completeLabel = "Run Analysis",
}: GuidedWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];
  const canAdvance = currentStepData?.isValid ? currentStepData.isValid() : true;

  const handleNext = () => {
    if (isLastStep) {
      setCompleted(true);
      onComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    if (completed) {
      setCompleted(false);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleStepClick = (index: number) => {
    if (index <= currentStep || completed) {
      setCurrentStep(index);
      if (completed) setCompleted(false);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      {!compact && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              Guided Mode
            </Badge>
          </div>
          {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const isActive = i === currentStep && !completed;
          const isDone = i < currentStep || completed;
          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                  : isDone
                    ? "bg-zinc-800/50 border border-zinc-700/30 text-zinc-300 hover:border-zinc-600/50 cursor-pointer"
                    : "bg-zinc-900/50 border border-zinc-800/30 text-zinc-500"
              }`}
              disabled={!isDone && !isActive}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? "bg-emerald-500 text-white" : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{step.title}</span>
              {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-600 ml-1" />}
            </button>
          );
        })}
        {/* Results indicator */}
        {completed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-400 text-xs font-medium shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            Results
          </div>
        )}
      </div>

      {/* Step content */}
      {!completed && currentStepData && (
        <Card className="bg-zinc-900/60 border-zinc-700/40">
          <CardContent className="p-4 space-y-3">
            {/* Step header with help */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  Step {currentStep + 1}: {currentStepData.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">{currentStepData.description}</p>
              </div>
              {currentStepData.helpText && (
                <button
                  onClick={() =>
                    setShowHelp(showHelp === currentStepData.id ? null : currentStepData.id)
                  }
                  className="p-1 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Help tooltip */}
            {showHelp === currentStepData.id && currentStepData.helpText && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-300 leading-relaxed">{currentStepData.helpText}</p>
                <button onClick={() => setShowHelp(null)} className="shrink-0">
                  <X className="w-3 h-3 text-zinc-500 hover:text-zinc-300" />
                </button>
              </div>
            )}

            {/* Step form content */}
            <div>{currentStepData.content}</div>

            {/* Step summary (if previous steps have summaries) */}
            {currentStep > 0 && (
              <div className="pt-2 border-t border-zinc-700/30">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Previous selections</p>
                <div className="flex flex-wrap gap-1.5">
                  {steps.slice(0, currentStep).map((s) => {
                    const summary = s.getSummary?.();
                    if (!summary) return null;
                    return (
                      <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/50 border border-zinc-700/30 text-zinc-400">
                        {s.title}: {summary}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="text-xs h-8"
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> Back
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canAdvance || isRunning}
                className={`text-xs h-8 ${
                  isLastStep
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : ""
                }`}
              >
                {isRunning ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span> Running...
                  </>
                ) : isLastStep ? (
                  <>
                    {completeLabel} <Sparkles className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results view */}
      {completed && (
        <div className="space-y-3">
          {/* Plain-English summary */}
          {resultSummary && (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                      What This Means
                    </h4>
                    <p className="text-sm text-zinc-200 leading-relaxed">{resultSummary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result content */}
          {resultContent}

          {/* Back to edit */}
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={handleBack} className="text-xs h-8">
              <ChevronLeft className="w-3 h-3 mr-1" /> Edit Inputs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Guided Mode Toggle ───────────────────────────────────────────────────────

interface GuidedModeToggleProps {
  isGuided: boolean;
  onToggle: (guided: boolean) => void;
  className?: string;
}

/**
 * GuidedModeToggle — Button to switch between guided wizard and expert mode.
 */
export function GuidedModeToggle({ isGuided, onToggle, className = "" }: GuidedModeToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => onToggle(false)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          !isGuided
            ? "bg-zinc-700/50 text-white border border-zinc-600/50"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Expert Mode
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
          isGuided
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <BookOpen className="w-3 h-3" />
        Guided Mode
      </button>
    </div>
  );
}
