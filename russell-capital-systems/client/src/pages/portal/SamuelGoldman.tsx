// ============================================================
// SAMUEL GOLDMAN — the front door to the hive. Text or the blue record
// button; Direct / Deeper / Integrated depth; the answer shows who in the
// hive contributed and which pinned figures it cited. The page proves it
// is talking to the hive (one address, N members) rather than one vendor.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Mic, Send, Square } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { ADVISOR_NAME } from "@shared/advisorIdentity";

type Depth = "direct" | "deeper" | "integrated";

export default function SamuelGoldman() {
  const [location] = useLocation();
  const from = (() => { try { return new URL(window.location.href).searchParams.get("from") ?? undefined; } catch { return undefined; } })();
  const address = trpc.hive.address.useQuery(undefined, { staleTime: 5 * 60_000 });
  const memory = trpc.hive.memory.useQuery({ routePath: from ?? location, limit: 20 }, { staleTime: 30_000 });
  const ask = trpc.hive.ask.useMutation();
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState<Depth>("deeper");
  const [turns, setTurns] = useState<{ role: "you" | "advisor"; text: string; meta?: string }[]>([]);
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (from && turns.length === 0) {
      setQuestion(`I was just looking at ${from}. Can you walk me through what matters there and what I should decide?`);
    }
  }, [from, turns.length]);

  const submit = async () => {
    const q = question.trim();
    if (!q || ask.isPending) return;
    setTurns(t => [...t, { role: "you", text: q }]);
    setQuestion("");
    try {
      const res = await ask.mutateAsync({ question: q, routePath: from ?? location, depth });
      const who = res.answeredBy.map(a => a.role === "reconciler" ? `reconciled by member ${res.answeredBy.length}` : "member").length;
      setTurns(t => [...t, { role: "advisor", text: res.text, meta: `${res.domain} · ${who} hive member${who === 1 ? "" : "s"} · ${res.citations.length} citation${res.citations.length === 1 ? "" : "s"} · memory ${res.memoryEventsUsed}${res.fallback ? " · gateway fallback" : ""}` }]);
    } catch (e) {
      setTurns(t => [...t, { role: "advisor", text: `The hive could not answer: ${String(e).slice(0, 160)}` }]);
    }
  };

  const toggleListening = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const w = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US"; rec.interimResults = true; rec.continuous = true;
    rec.onresult = (ev: any) => {
      let text = "";
      for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
      setQuestion(text);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  };

  return (
    <AppShell title={ADVISOR_NAME} subtitle="One address. The whole hive behind it.">
      <div className="mx-auto max-w-3xl px-2 pb-24">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs opacity-80" data-testid="hive-address">
          <span className="font-mono">address: {address.data?.address ?? "…"}</span>
          <span>· {address.data?.members ?? 0} members</span>
          <span>· {address.data?.mcpServers ?? 0} MCP servers</span>
          <span>· {address.data?.verifiers ?? 0} verifiers</span>
        </div>

        {memory.data?.context.visits.length ? (
          <p className="mb-3 text-xs opacity-70">Working memory: {memory.data.context.visits.slice(0, 5).map(v => `${v.title} ×${v.opens}`).join(" · ")}{memory.data.context.pinned.length ? ` · ${memory.data.context.pinned.length} pinned figure${memory.data.context.pinned.length === 1 ? "" : "s"}` : ""}</p>
        ) : null}

        <div className="space-y-3">
          {turns.map((t, i) => (
            <div key={i} className={`rounded-lg px-3 py-2 ${t.role === "you" ? "bg-white/5" : "bg-emerald-950/40 border border-emerald-400/20"}`}>
              <p className="text-[11px] font-mono uppercase tracking-wider opacity-60">{t.role === "you" ? "You" : ADVISOR_NAME}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{t.text}</p>
              {t.meta ? <p className="mt-1 text-[11px] opacity-60">{t.meta}</p> : null}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="inline-flex self-start rounded-full border border-white/15 overflow-hidden text-xs" role="group" aria-label="Depth">
            {(["direct", "deeper", "integrated"] as Depth[]).map(d => (
              <button key={d} type="button" onClick={() => setDepth(d)} aria-pressed={depth === d} className={`px-3 py-1 capitalize ${depth === d ? "bg-amber-300 text-[#07130d] font-semibold" : "hover:bg-white/10"}`}>{d}</button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea id="samuel-goldman-question" value={question} onChange={e => setQuestion(e.target.value)} rows={3} placeholder={`Ask ${ADVISOR_NAME} anything about your plan…`}
              className="flex-1 rounded-lg border border-white/15 bg-black/30 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(); }} />
            <button type="button" onClick={toggleListening} aria-pressed={listening} aria-label={listening ? "Stop recording" : "Record your question"}
              className={`rounded-full p-3 ${listening ? "bg-red-500 text-white" : "bg-blue-600 text-white hover:bg-blue-500"}`}>
              {listening ? <Square size={18} /> : <Mic size={18} />}
            </button>
            <button type="button" onClick={() => void submit()} disabled={ask.isPending || !question.trim()} aria-label="Send" className="rounded-full bg-amber-300 p-3 text-[#07130d] disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
