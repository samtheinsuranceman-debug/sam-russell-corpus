/**
 * Global Keyboard Shortcuts — Power-user navigation.
 * 
 * G+D → Dashboard/Daily Briefing
 * G+C → Clients
 * G+N → Nerve Center
 * G+S → Strategy Lab
 * G+M → Morning Ritual
 * N+C → New Client (opens add client dialog)
 * N+D → New Deal
 * Escape → Close any open panel
 */
import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const GO_SHORTCUTS: Record<string, { path: string; label: string }> = {
  d: { path: "/portal/daily-briefing", label: "Daily Briefing" },
  c: { path: "/portal/clients", label: "Clients" },
  n: { path: "/portal/nerve-center", label: "Nerve Center" },
  s: { path: "/portal/strategy-lab", label: "Strategy Lab" },
  m: { path: "/portal/morning-ritual", label: "Morning Ritual" },
  w: { path: "/portal/war-stories", label: "War Stories" },
  l: { path: "/portal/leaderboard", label: "Leaderboard" },
};

export function useKeyboardShortcuts() {
  const [, navigate] = useLocation();
  const pendingPrefix = useRef<string | null>(null);
  const prefixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger in input/textarea/contenteditable
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if ((e.target as HTMLElement).isContentEditable) return;

    const key = e.key.toLowerCase();

    // Handle prefix sequences (g+X, n+X)
    if (pendingPrefix.current) {
      const prefix = pendingPrefix.current;
      pendingPrefix.current = null;
      if (prefixTimer.current) clearTimeout(prefixTimer.current);

      if (prefix === "g" && GO_SHORTCUTS[key]) {
        e.preventDefault();
        const target = GO_SHORTCUTS[key];
        navigate(target.path);
        toast.info(`Navigated to ${target.label}`, { duration: 1500 });
        return;
      }

      if (prefix === "n") {
        if (key === "c") {
          e.preventDefault();
          navigate("/portal/clients?action=add");
          toast.info("New Client", { duration: 1500 });
          return;
        }
        if (key === "d") {
          e.preventDefault();
          navigate("/portal/deals?action=add");
          toast.info("New Deal", { duration: 1500 });
          return;
        }
      }
    }

    // Set prefix
    if (key === "g" || key === "n") {
      pendingPrefix.current = key;
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
      prefixTimer.current = setTimeout(() => {
        pendingPrefix.current = null;
      }, 800); // 800ms window for second key
      return;
    }

    // ? → Show shortcuts help
    if (key === "?" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toast.info(
        "Keyboard Shortcuts: G+D (Briefing), G+C (Clients), G+A (Arena), G+N (Nerve Center), G+S (Strategy), N+C (New Client), N+D (New Deal), ? (Help)",
        { duration: 5000 }
      );
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
