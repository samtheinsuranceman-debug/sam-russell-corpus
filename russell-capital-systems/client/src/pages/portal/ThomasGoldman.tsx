/**
 * Thomas Goldman — the AI advisor.
 *
 * Layout follows Sam's brief: the conversation takes roughly half the screen
 * and the AI Stack column sits beside it at about an eighth, so the client can
 * always see what is answering them. On a phone the two stack, conversation
 * first, with the stack reachable from a badge in the header.
 *
 * The "go deeper" offer is amber and lit rather than green. It is the highest-
 * value action on the page and it was previously losing the fight for
 * attention against every other green element in the interface.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import AIStackPanel, { AIStackBadge } from "@/components/AIStackPanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Streamdown } from "@/components/StreamdownLite";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useLongVoiceSession, formatDuration } from "@/hooks/useLongVoiceSession";
import {
  ADVISOR_DEEPEN_OFFER,
  ADVISOR_DISCLOSURE,
  ADVISOR_INITIALS,
  ADVISOR_NAME,
  ADVISOR_ROLE,
  VOICE_SESSION_MAX_MS,
} from "@shared/aiAdvisor";
import { IUL_DATA_IS_SAMPLE } from "@shared/iulCarriers";
import { INDEX_RETURNS_ARE_VERIFIED } from "@shared/indexCreditingData";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Gavel,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Loader2,
  Mic,
  Pause,
  Play,
  Send,
  Sparkles,
  Square,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Turn = {
  role: "user" | "assistant";
  content: string;
  /** Carrier records this turn consulted, shown as a grounding badge. */
  carriers?: string[];
};

type Review = {
  turnIndex: number;
  text: string;
  verdict: "sound" | "caveats" | "do_not_send" | "unclear";
  reviewerProvider: string;
  reviewerModel: string;
  sameProviderAsAuthor: boolean;
};
type Depth = "direct" | "deeper" | "integrated";

const DEPTHS: Array<{ id: Depth; label: string; blurb: string; icon: typeof Target }> = [
  { id: "direct", label: "Direct", blurb: "One recommendation, in order, with the numbers.", icon: Target },
  { id: "deeper", label: "Deeper", blurb: "Three to five routes to the same goal, compared.", icon: Layers },
  { id: "integrated", label: "Integrated", blurb: "Every domain at once — where one move unlocks another.", icon: Sparkles },
];

export default function ThomasGoldman() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [depth, setDepth] = useState<Depth>("deeper");
  const [summary, setSummary] = useState<string>("");
  const [showStackMobile, setShowStackMobile] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = trpc.thomas.ask.useMutation({
    onSuccess: res => {
      setTurns(prev => [...prev, { role: "assistant", content: res.reply, carriers: res.carriersConsulted }]);
      setSummary(res.summary);
      if (res.foldedTurns > 0) {
        // Say so rather than silently changing what he remembers.
        toast.info(`${ADVISOR_NAME} condensed ${res.foldedTurns} earlier messages into his working memory.`);
      }
    },
    onError: err => {
      toast.error(err.message);
      // Give the message back so nothing typed is lost.
      setTurns(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "user") {
          setInput(last.content);
          return prev.slice(0, -1);
        }
        return prev;
      });
    },
  });

  const digest = trpc.thomas.digestTranscript.useMutation();

  const challenge = trpc.thomas.challenge.useMutation({
    onSuccess: (res, vars) => {
      const turnIndex = (vars as any).__turnIndex ?? turns.length - 1;
      setReviews(prev => [
        ...prev.filter(r => r.turnIndex !== turnIndex),
        {
          turnIndex,
          text: res.review,
          verdict: res.verdict,
          reviewerProvider: res.reviewerProvider,
          reviewerModel: res.reviewerModel,
          sameProviderAsAuthor: res.sameProviderAsAuthor,
        },
      ]);
      setReviewing(null);
      if (res.sameProviderAsAuthor) {
        toast.warning("Reviewed by the same provider that wrote it. Add a second AI in the AI Connector for a real second opinion.");
      }
    },
    onError: e => {
      toast.error(e.message);
      setReviewing(null);
    },
  });

  const runChallenge = (turnIndex: number) => {
    setReviewing(turnIndex);
    // The preceding user turn is the question this answer was given to.
    const question = turns[turnIndex - 1]?.role === "user" ? turns[turnIndex - 1].content : undefined;
    challenge.mutate({
      recommendation: turns[turnIndex].content,
      question,
      __turnIndex: turnIndex,
    } as any);
  };

  const voice = useLongVoiceSession();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, ask.isPending]);

  const send = (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || ask.isPending) return;
    const next: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(next);
    setInput("");
    ask.mutate({ messages: next, depth, priorSummary: summary || undefined });
  };

  const [finishing, setFinishing] = useState(false);

  const finishVoice = async () => {
    setFinishing(true);
    try {
      // Segments transcribe as they close, so this usually returns almost
      // immediately — it only waits on whatever is still in flight.
      const text = await voice.finish();
      if (!text.trim()) {
        toast.error("The recording came back empty. Check your microphone level and try again.");
        return;
      }

      const failed = voice.segments.filter(s => s.state === "failed").length;
      if (failed > 0) {
        toast.warning(
          `${failed} of ${voice.segments.length} segments did not transcribe. Sending what came through — say anything that got missed.`,
        );
      } else {
        toast.success(`Captured ${formatDuration(voice.elapsedMs)}.`);
      }

      // Digest a long monologue into structured facts once, rather than
      // re-parsing the whole transcript on every later turn.
      let structured = "";
      try {
        structured = (await digest.mutateAsync({ transcript: text })).digest;
      } catch {
        // Not fatal — the raw transcript is still worth sending.
      }

      send(
        structured
          ? `Here is my situation, in my own words:\n\n${text}\n\n--- Structured summary ---\n${structured}`
          : `Here is my situation, in my own words:\n\n${text}`,
      );
      voice.reset();
    } catch (e) {
      toast.error("Something went wrong finishing the recording. Your transcript so far is still on screen.");
      console.error(e);
    } finally {
      setFinishing(false);
    }
  };

  const minutesLeft = Math.max(0, Math.round((VOICE_SESSION_MAX_MS - voice.elapsedMs) / 60000));
  const isRecording = voice.status === "recording" || voice.status === "paused";
  const empty = turns.length === 0;

  const activeDepth = useMemo(() => DEPTHS.find(d => d.id === depth)!, [depth]);

  return (
    <AppShell title={ADVISOR_NAME} subtitle={ADVISOR_ROLE}>
      {/*
        Conversation gets the bulk of the width; the AI Stack column takes
        roughly an eighth on a wide screen. Below lg they stack.
      */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-9rem)]">
        {/* ── Conversation ───────────────────────────────────────────── */}
        <section className="flex-1 min-w-0 flex flex-col rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70 overflow-hidden">
          {/* Header */}
          <header className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[#1e3a5f]/50 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shrink-0">
              <span className="text-[13px] font-bold text-[#0a0f1a]">{ADVISOR_INITIALS}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-semibold text-white leading-tight truncate">{ADVISOR_NAME}</h1>
              <p className="text-[11px] text-slate-500 truncate">{ADVISOR_ROLE}</p>
            </div>
            <AIStackBadge onClick={() => setShowStackMobile(true)} className="lg:hidden" />
          </header>

          {/*
            Sample-data warning. This stays pinned under the header rather than
            appearing next to an answer, because the moment it matters is the
            moment somebody turns the screen around to show a client — and by
            then nobody is scrolling back up to find a caveat.
          */}
          {(IUL_DATA_IS_SAMPLE || !INDEX_RETURNS_ARE_VERIFIED) && (
            <div className="flex items-start gap-2 px-4 sm:px-5 py-2.5 border-b border-red-500/25 bg-red-500/[0.07] shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-red-200/90 leading-relaxed">
                {IUL_DATA_IS_SAMPLE && (
                  <>
                    <strong>The carrier figures in this platform are sample data, not real carriers.</strong>{" "}
                    The products are placeholders named after rating tiers — no Nationwide, no Allianz, no
                    Pacific Life. Nothing here goes in front of a client until real rate sheets replace it.{" "}
                  </>
                )}
                {!INDEX_RETURNS_ARE_VERIFIED && (
                  <>
                    The index return history behind every backtest is also unreconciled, so backtested
                    averages are illustrative arithmetic rather than what a strategy would have credited.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Depth selector */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-[#1e3a5f]/40 shrink-0">
            <div className="flex gap-1.5" role="radiogroup" aria-label="Answer depth">
              {DEPTHS.map(d => {
                const Icon = d.icon;
                const active = d.id === depth;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setDepth(d.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-all border",
                      active
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                        : "bg-transparent border-[#1e3a5f]/50 text-slate-500 hover:text-slate-300 hover:border-[#1e3a5f]",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">{activeDepth.blurb}</p>
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {empty && !ask.isPending && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center mb-4">
                  <span className="text-lg font-bold text-[#0a0f1a]">{ADVISOR_INITIALS}</span>
                </div>
                <h2 className="text-lg font-semibold text-white">Tell me about your situation.</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                  Type it, or press record and talk for as long as you need — up to two hours. The more you
                  give me, the more sequences I can build.
                </p>
              </div>
            )}

            {turns.map((t, i) => (
              <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    t.role === "user"
                      ? "max-w-[85%] bg-amber-500/10 border border-amber-500/25 text-slate-100"
                      : "max-w-[92%] bg-[#111827]/70 border border-[#1e3a5f]/50 text-slate-200",
                  )}
                >
                  {t.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-strong:text-white prose-a:text-amber-400">
                      <Streamdown>{t.content}</Streamdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{t.content}</p>
                  )}

                  {/* Grounding badge — which carrier records this answer used */}
                  {t.role === "assistant" && t.carriers && t.carriers.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
                      <Database className="w-3 h-3 shrink-0" />
                      <span>Grounded on platform data: {t.carriers.join(", ")}</span>
                    </div>
                  )}

                  {/* Challenge */}
                  {t.role === "assistant" && (
                    <ReviewBlock
                      review={reviews.find(r => r.turnIndex === i)}
                      pending={reviewing === i}
                      onRun={() => runChallenge(i)}
                    />
                  )}
                </div>
              </div>
            ))}

            {ask.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-[#111827]/70 border border-[#1e3a5f]/50 flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  {depth === "integrated" ? "Working every domain — this takes a moment…" : "Thinking…"}
                </div>
              </div>
            )}

            {/* The go-deeper offer, in amber so it outranks everything else. */}
            {!empty && !ask.isPending && turns[turns.length - 1]?.role === "assistant" && depth !== "integrated" && (
              <button
                type="button"
                onClick={() => {
                  setDepth("integrated");
                  send("Go deeper. Ask me what you still need to know, then tell me the three to five questions I should be asking about the next fifteen to twenty years.");
                }}
                className="group w-full text-left rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.12] to-amber-500/[0.04] px-4 py-3.5 transition-all hover:border-amber-400/60 hover:from-amber-500/20 hover:shadow-[0_0_24px_-6px_rgba(245,158,11,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[13px] font-semibold text-amber-300">{ADVISOR_DEEPEN_OFFER.headline}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400/70 ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[12.5px] text-amber-100/70 leading-relaxed">{ADVISOR_DEEPEN_OFFER.body}</p>
              </button>
            )}

            <div ref={endRef} />
          </div>

          {/* Voice session bar */}
          {isRecording && (
            <div className="px-4 sm:px-5 py-3 border-t border-amber-500/25 bg-amber-500/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  {voice.status === "recording" && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  )}
                  <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", voice.status === "recording" ? "bg-red-500" : "bg-amber-500")} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white tabular-nums">{formatDuration(voice.elapsedMs)}</span>
                    <span className="text-[11px] text-slate-500">
                      {voice.status === "paused" ? "Paused" : `${minutesLeft} min remaining`}
                    </span>
                  </div>
                  {/* Input level */}
                  <div className="mt-1.5 h-1 rounded-full bg-[#1e3a5f]/60 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-[width] duration-75"
                      style={{ width: `${Math.min(100, voice.level * 160)}%` }}
                    />
                  </div>
                </div>

                {voice.status === "recording" ? (
                  <Button size="sm" variant="ghost" onClick={voice.pause} className="text-slate-400 hover:text-white shrink-0">
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={voice.resume} className="text-amber-400 hover:text-amber-300 shrink-0">
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={finishVoice}
                  disabled={finishing || digest.isPending}
                  className="bg-amber-600 hover:bg-amber-500 text-[#0a0f1a] font-semibold shrink-0"
                >
                  {finishing || digest.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Square className="w-3.5 h-3.5 mr-1.5" /> Finish</>
                  )}
                </Button>
              </div>

              {voice.pendingCount > 0 && (
                <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  Transcribing as you talk — {voice.pendingCount} segment{voice.pendingCount === 1 ? "" : "s"} in progress.
                </p>
              )}
              {voice.nearingLimit && (
                <p className="mt-2 text-[11px] text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  Approaching the two-hour limit. Finish when you are ready — nothing is lost.
                </p>
              )}
              {voice.error && (
                <p className="mt-2 text-[11px] text-red-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {voice.error}
                </p>
              )}
            </div>
          )}

          {/* Composer */}
          <div className="px-4 sm:px-5 py-3 border-t border-[#1e3a5f]/50 shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Ask ${ADVISOR_NAME} anything — or press record and talk it through.`}
                rows={2}
                className="flex-1 resize-none bg-[#111827]/70 border-[#1e3a5f] text-white placeholder:text-slate-600 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 min-h-[52px] max-h-40"
              />
              {!isRecording && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={voice.start}
                  disabled={voice.status === "requesting"}
                  title="Record — up to two hours"
                  className="shrink-0 h-[52px] w-12 border-[#1e3a5f] bg-transparent hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-400"
                >
                  {voice.status === "requesting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || ask.isPending}
                className="shrink-0 h-[52px] w-12 bg-gradient-to-br from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0a0f1a] disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10.5px] text-slate-600 mt-2 leading-relaxed">{ADVISOR_DISCLOSURE}</p>
          </div>
        </section>

        {/* ── AI Stack column ────────────────────────────────────────── */}
        <AIStackPanel className="hidden lg:flex w-[280px] xl:w-[320px] shrink-0" />
      </div>

      {/* Mobile stack sheet */}
      {showStackMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowStackMobile(false)}
            aria-label="Close AI stack"
          />
          <div className="relative w-full max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowStackMobile(false)}
              className="self-end mr-4 mb-2 rounded-full bg-[#0a0f1a] border border-[#1e3a5f] p-2 text-slate-400"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <AIStackPanel className="rounded-b-none max-h-[80vh]" />
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ─── Adversarial review ──────────────────────────────────────────────────────

const VERDICT_META = {
  sound: { label: "Sound", icon: ShieldCheck, cls: "text-emerald-400", box: "border-emerald-500/30 bg-emerald-500/[0.06]" },
  caveats: { label: "Sound with caveats", icon: AlertCircle, cls: "text-amber-400", box: "border-amber-500/30 bg-amber-500/[0.06]" },
  do_not_send: { label: "Do not send", icon: ShieldAlert, cls: "text-red-400", box: "border-red-500/40 bg-red-500/[0.08]" },
  unclear: { label: "Review complete", icon: Gavel, cls: "text-slate-400", box: "border-[#1e3a5f]/60 bg-[#0a0f1a]/70" },
} as const;

/**
 * The challenge control and its result.
 *
 * Deliberately not automatic. A review costs a second model call and takes
 * time; running one on every casual turn would make the advisor slow and
 * expensive for questions that do not need it. It belongs on the answers
 * somebody is about to act on.
 */
function ReviewBlock({
  review,
  pending,
  onRun,
}: {
  review?: Review;
  pending: boolean;
  onRun: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (pending) {
    return (
      <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        A second model is attacking this recommendation…
      </div>
    );
  }

  if (!review) {
    return (
      <button
        type="button"
        onClick={onRun}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#1e3a5f]/70 bg-transparent px-2.5 py-1.5 text-[12px] text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
      >
        <Gavel className="w-3.5 h-3.5" />
        Challenge this
      </button>
    );
  }

  const meta = VERDICT_META[review.verdict];
  const Icon = meta.icon;

  return (
    <div className={cn("mt-3 rounded-xl border", meta.box)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <Icon className={cn("w-4 h-4 shrink-0", meta.cls)} />
        <span className={cn("text-[12.5px] font-semibold", meta.cls)}>{meta.label}</span>
        <span className="text-[11px] text-slate-600 truncate">
          reviewed by {review.reviewerProvider}
          {review.sameProviderAsAuthor && " — same provider, so this is a weak review"}
        </span>
        <ArrowRight className={cn("w-3.5 h-3.5 text-slate-600 ml-auto shrink-0 transition-transform", expanded && "rotate-90")} />
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[#1e3a5f]/25">
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-strong:text-white">
            <Streamdown>{review.text}</Streamdown>
          </div>
          {review.sameProviderAsAuthor && (
            <p className="mt-2.5 text-[11px] text-amber-400/90 leading-relaxed">
              Only one AI provider is connected, so the same model reviewed its own work. That is worth much
              less than a genuine second opinion — add another provider in the AI Connector.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
