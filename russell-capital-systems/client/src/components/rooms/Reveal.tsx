/**
 * The reveal layer — Grok's three-line stack on every calculator.
 *
 *   <QuestionWhy />       one muted sentence 12px under a question label
 *   <OutputWhy />         the two-sentence macro 16px under the climax number, with the line
 *   <EngineWhyFooter />   the persistent "Why this isn't on the other screen →" on every engine
 *
 * The copy comes from shared/revealCopy.ts; the needle comes from the room
 * unless a page passes one. Never place these inside a PDF without the
 * softer Ivory form.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import type { Needle } from "@shared/themes";
import { FOOTER_LABEL, revealFor } from "@shared/revealCopy";
import { useRoom } from "./RoomTheme";
import { IntegralLine } from "./IntegralLine";

function useReveal(needle?: Needle) {
  const room = useRoom();
  const [location] = useLocation();
  return revealFor(needle ?? room.needle, location.split("?")[0]);
}

export function QuestionWhy({ needle, children, className = "" }: { needle?: Needle; children?: string; className?: string }) {
  const copy = useReveal(needle);
  return (
    <p className={`rc-reveal-micro ${className}`}>
      {children ?? copy.micro}
    </p>
  );
}

export function OutputWhy({ needle, runKey, children, className = "" }: { needle?: Needle; runKey?: number | string; children?: string; className?: string }) {
  const copy = useReveal(needle);
  return (
    <div className={`rc-reveal-macro ${className}`}>
      <IntegralLine runKey={runKey} height={44} />
      <p>{children ?? copy.macro}</p>
    </div>
  );
}

export function EngineWhyFooter({ needle }: { needle?: Needle }) {
  const copy = useReveal(needle);
  const [open, setOpen] = useState(false);
  return (
    <aside className="rc-engine-footer" aria-label="Why this engine is different">
      <button type="button" className="rc-engine-footer-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {FOOTER_LABEL}
      </button>
      {open && (
        <div className="rc-engine-footer-body">
          <p>{copy.macro}</p>
          <p className="rc-reveal-micro">{copy.micro}</p>
        </div>
      )}
    </aside>
  );
}
