// ============================================================
// ADVISOR NUDGE — on the visitor's THIRD page open from the map (never
// before, once per session) the advisor speaks the operator's words
// (SITE_MAP_NUDGE_TEXT in shared/aiAdvisor.ts). Audio comes from the
// server voice (ultra.speak: the site's HeyGen/ElevenLabs voice) when
// configured, else the browser's; the text always renders.
// "Yes" asks thomas.ask with every page opened this session, in order,
// as context, and shows the reply here with a way to continue.
// Never fires on the map itself; respects a muted setting.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Volume2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSiteMap } from "@/contexts/SiteMapContext";
import { ADVISOR_NAME, SITE_MAP_NUDGE_TEXT } from "@shared/aiAdvisor";
import { nudgeDue } from "@shared/siteMapTree";

const MUTE_KEY = "rcs.nudge.muted.v1";
/** Where the conversation continues after the first reply. The thomas.* router keeps its id whatever the advisor is called. */
const ADVISOR_CHAT_ROUTE = "/portal/thomas-goldman";

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

/** The pages opened this session, in order, as the advisor's opening context. */
export function openedPagesQuestion(openedPaths: string[], titles: Record<string, string>): string {
  const lines = openedPaths.map((p, i) => `${i + 1}. ${titles[p] ?? p} (${p})`);
  return (
    `During this visit I opened these pages from the site map, in this order:\n${lines.join("\n")}\n\n` +
    `I have questions. Tell me what these pages have in common for someone in my position, which one I should start with, and what you need from me to help.`
  );
}

export default function AdvisorNudge() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const map = useSiteMap();
  const nudge = trpc.hive.nudge.useMutation();
  const tree = trpc.siteMap.tree.useQuery(undefined, { staleTime: 10 * 60_000, enabled: isAuthenticated });
  const ask = trpc.thomas.ask.useMutation();
  const [text, setText] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const muted = (() => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } })();

  useEffect(() => {
    if (!isAuthenticated || dismissed || text) return;
    if (map.mode === "map" || location === "/portal/map") return;
    if (!nudgeDue(map.opens, map.nudgeFired)) return;
    map.markNudgeFired();
    setText(SITE_MAP_NUDGE_TEXT);
    // One call: the hive records that the advisor spoke (working memory,
    // once per session server-side too) and returns the server voice saying
    // the operator's words. No audio back (muted, no voice configured, or the
    // server already spoke this session) → the browser voice, unless muted.
    nudge.mutate(
      { routePath: location, sessionStartedAt: map.sessionStartedAt, speak: !muted, text: SITE_MAP_NUDGE_TEXT },
      {
        onSuccess: res => {
          if (muted) return;
          if (res.fire && res.audio) {
            try {
              const el = new Audio(`data:${res.audio.mimeType};base64,${res.audio.audioBase64}`);
              audioRef.current = el;
              void el.play();
              return;
            } catch { /* fall through to the browser voice */ }
          }
          speakInBrowser(SITE_MAP_NUDGE_TEXT);
        },
        onError: () => { if (!muted) speakInBrowser(SITE_MAP_NUDGE_TEXT); },
      },
    );
  }, [isAuthenticated, dismissed, text, map, location, nudge, muted]);

  if (!text || dismissed) return null;

  const stop = () => { try { audioRef.current?.pause(); window.speechSynthesis?.cancel(); } catch { /* ignore */ } };
  const titles: Record<string, string> = {};
  for (const t of tree.data?.tabs ?? []) for (const g of t.groups) for (const l of g.leaves) titles[l.path] = l.title;
  const help = () => {
    stop();
    const pagesOpened = map.openedPaths.length ? map.openedPaths : [location];
    const question = openedPagesQuestion(pagesOpened, titles);
    // The ordered page list rides both as the visible question and as typed context, so the advisor's system prompt carries it.
    ask.mutate({ messages: [{ role: "user", content: question }], depth: "direct", context: { pagesOpened } }, { onSuccess: r => setReply(r.reply) });
  };
  const notNow = () => { stop(); setDismissed(true); };
  const mute = () => { try { localStorage.setItem(MUTE_KEY, "1"); } catch { /* ignore */ } stop(); };
  const continueChat = () => { stop(); setDismissed(true); navigate(`${ADVISOR_CHAT_ROUTE}?from=${encodeURIComponent(location)}`); };

  return (
    <div
      className="fixed left-3 right-3 sm:left-auto sm:right-5 sm:w-[420px] z-[75] rounded-xl border border-amber-300/40 bg-[#0b1a12]/95 text-emerald-50 shadow-xl backdrop-blur p-3 max-h-[70vh] overflow-y-auto"
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

      {reply ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2 text-sm leading-snug whitespace-pre-wrap" data-testid="advisor-nudge-reply">
          {reply}
        </div>
      ) : null}
      {ask.isError ? <p className="mt-2 text-xs text-amber-200/90">{ADVISOR_NAME} could not answer just now: {ask.error.message}</p> : null}

      <div className="mt-2 flex flex-wrap gap-2">
        {reply ? (
          <button type="button" onClick={continueChat} className="inline-flex items-center gap-1 rounded-full bg-amber-300 text-[#07130d] px-3 py-1 text-sm font-semibold hover:bg-amber-200">
            Continue with {ADVISOR_NAME} <ArrowRight size={14} />
          </button>
        ) : (
          <button type="button" onClick={help} disabled={ask.isPending} className="rounded-full bg-amber-300 text-[#07130d] px-3 py-1 text-sm font-semibold hover:bg-amber-200 disabled:opacity-60">
            {ask.isPending ? `${ADVISOR_NAME} is reading the pages you opened…` : "Yes, I have questions"}
          </button>
        )}
        <button type="button" onClick={notNow} className="rounded-full border border-white/20 px-3 py-1 text-sm hover:bg-white/10">Not now</button>
        <button type="button" onClick={mute} className="ml-auto text-xs opacity-60 hover:opacity-100">Mute the voice</button>
      </div>
    </div>
  );
}
