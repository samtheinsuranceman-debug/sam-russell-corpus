import { HeartHandshake, MessagesSquare, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORT_MODE_COPY, type SupportMode, useSupportMode } from "@/contexts/SupportModeContext";

const MODES: Array<{ id: SupportMode; icon: typeof HeartHandshake }> = [
  { id: "friend", icon: HeartHandshake },
  { id: "therapist", icon: MessagesSquare },
  { id: "psychiatrist", icon: Stethoscope },
];

export function SupportModeSelector({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { mode, setMode } = useSupportMode();

  return (
    <div className={cn("rounded-xl border border-border/60 bg-card/70 p-1", className)}>
      <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Choose Doctor Buddy communication style">
        {MODES.map(({ id, icon: Icon }) => {
          const active = mode === id;
          const copy = SUPPORT_MODE_COPY[id];
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(id)}
              className={cn(
                "rounded-lg transition-all text-left",
                compact ? "px-2 py-1.5" : "px-3 py-2.5",
                active
                  ? "bg-violet-500/15 border border-violet-400/40 text-foreground shadow-sm"
                  : "border border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              title={copy.boundary}
            >
              <div className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")}>
                <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", active ? "text-violet-400" : "text-muted-foreground")} />
                <span className={cn("font-semibold", compact ? "text-[11px]" : "text-xs")}>{copy.label}</span>
              </div>
              {!compact && <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{copy.description}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
