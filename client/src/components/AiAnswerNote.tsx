/**
 * AiAnswerNote — the one line every AI answer carries.
 *
 * The text lives in shared/aiCompliance.ts (AI_ANSWER_NOTE) so every surface
 * says the same thing. Mount it directly under any block of model output.
 * It is a disclosure, so nothing (no demo mode, no user setting) hides it.
 */
import React from "react";
import { Sparkles } from "lucide-react";
import { AI_ANSWER_NOTE } from "@shared/aiCompliance";

export default function AiAnswerNote({ className }: { className?: string }) {
  return (
    <p
      data-testid="ai-answer-note"
      className={className ?? "mt-2 flex items-start gap-1.5 text-[10px] leading-snug text-slate-500"}
    >
      <Sparkles className="mt-px h-3 w-3 shrink-0 opacity-70" aria-hidden />
      <span>{AI_ANSWER_NOTE}</span>
    </p>
  );
}
