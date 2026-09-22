// ============================================================
// ADVISOR NUDGE — after the visitor's second page open in a session,
// Samuel Goldman speaks: he noticed which page they opened and offers to
// finalise their confidence, one variable of the decision tree at a time.
// Audio comes from the server voice (HeyGen/ElevenLabs) when configured,
// else the browser's speech; text always renders. Fires once per session,
// never on the map itself, and respects reduced-motion/muted settings.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Volume2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSiteMap } from "@/contexts/SiteMapContext";
import { ADVISOR_CANONICAL_ROUTE, ADVISOR_NAME } from "@shared/aiAdvisor";
import { NUDGE_AFTER_PAGE_OPENS } from "@shared/hiveMind";

const MUTE_KEY = "rcs.nudge.muted.v1";

function speakInBrowser(text: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.98;
    synth.speak(u);
  } catch { /* no voice available */ }
}

export default function AdvisorNudge() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const map = useSiteMap();
  const nudge = trpc.hive.nudge.useMutation();
  const [text, setText] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const askedFor = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const muted = (() => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } })();

  useEffect(() => {
    if (!isAuthenticated || dismissed || text) return;
    if (map.mode === "map" || location === "/portal/map") return;
    if (map.opens < NUDGE_AFTER_PAGE_OPENS) return;
    if (askedFor.current === location) return;
    askedFor.current = location;
    nudge.mutate(
      { routePath: location, sessionStartedAt: map.sessionStartedAt, speak: !muted },
      {
        onSuccess: (res) => {
          if (!res.fire || !res.text) return;
          setText(res.text);
          if (muted) return;
          if (res.audio) {
            try {
              const el = new Audio(`data:${res.audio.mimeType};base64,${res.audio.audioBase64}`);
              audioRef.current = el;
              void el.play();
              return;
            } catch { /* fall through to browser voice */ }
          }
          speakInBrowser(res.text);
        },
      },
    );
  }, [isAuthenticated, dismissed, text, map.mode, map.opens, map.sessionStartedAt, location, nudge, muted]);

  if (!text || dismissed) return null;

  const stop = () => { try { audioRef.current?.pause(); window.speechSynthesis?.cancel(); } catch { /* ignore */ } };
  const help = () => { stop(); setDismissed(true); navigate(`${ADVISOR_CANONICAL_ROUTE}?from=${encodeURIComponent(location)}`); };
  const notNow = () => { stop(); setDismissed(true); };
  const mute = () => { try { localStorage.setItem(MUTE_KEY, "1"); } catch { /* ignore */ } stop(); };

  return (
    <div
      className="fixed left-3 right-3 sm:left-auto sm:right-5 sm:w-[380px] z-[75] rounded-xl border border-amber-300/40 bg-[#0b1a12]/95 text-emerald-50 shadow-xl backdrop-blur p-3"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.6rem)" }}
      role="status"
      aria-live="polite"
      data-testid="advisor-nudge"
    >
      <div className="flex items-start gap-2">
        <Volume2 size={16} className="mt-0.5 text-amber-300 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-wider text-amber-300/90">{ADVISOR_NAME}</p>
          <p className="text-sm leading-snug">{text}</p>
        </div>
        <button type="button" onClick={notNow} className="ml-auto rounded p-1 hover:bg-white/10" aria-label="Dismiss"><X size={16} /></button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={help} className="rounded-full bg-amber-300 text-[#07130d] px-3 py-1 text-sm font-semibold hover:bg-amber-200">Yes, help me</button>
        <button type="button" onClick={notNow} className="rounded-full border border-white/20 px-3 py-1 text-sm hover:bg-white/10">Not now</button>
        <button type="button" onClick={mute} className="ml-auto text-xs opacity-60 hover:opacity-100">Mute the voice</button>
      </div>
    </div>
  );
}
