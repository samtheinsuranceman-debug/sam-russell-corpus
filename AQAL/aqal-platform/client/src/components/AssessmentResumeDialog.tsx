import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STORAGE_KEY = "aqal_assessment_progress";

interface SavedProgress {
  question: number;
  scores: number[];
}

interface AssessmentResumeDialogProps {
  onResume: () => void;
  onStartFresh: () => void;
}

export default function AssessmentResumeDialog({
  onResume,
  onStartFresh,
}: AssessmentResumeDialogProps) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<SavedProgress | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedProgress = JSON.parse(stored);
        if (parsed.question > 0) {
          setProgress(parsed);
          setOpen(true);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleResume = () => {
    setOpen(false);
    onResume();
  };

  const handleStartFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOpen(false);
    onStartFresh();
  };

  if (!progress) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="glass-card border-white/10 backdrop-blur-xl max-w-md">
        {/* Gradient accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-px rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.7 0.2 240), oklch(0.82 0.16 195), transparent)",
          }}
        />

        <AlertDialogHeader>
          <AlertDialogTitle
            className="text-lg"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.03em",
            }}
          >
            Resume Assessment?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/70 leading-relaxed">
            You have a saved assessment in progress at{" "}
            <span className="text-accent font-medium">
              question {progress.question + 1}
            </span>{" "}
            of 24. Would you like to continue where you left off, or start a new
            assessment?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-3">
          <AlertDialogCancel
            onClick={handleStartFresh}
            className="border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleResume}
            className="bg-primary text-white hover:bg-primary/90 glow-gold"
          >
            Resume
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
