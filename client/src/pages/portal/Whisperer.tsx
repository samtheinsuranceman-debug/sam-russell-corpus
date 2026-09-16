// ============================================================
// THE AI WHISPERER — /portal/whisperer
//
// The advisor's live-call coach. Start a call against a client, connect
// the ears (Zoom's live stream when the webhook is configured, otherwise
// this browser's microphone) and the eyes (a shared Zoom window, one
// frame every twenty seconds to the vision model), and the coach shows,
// and texts, when to stop talking, when to ask, five questions to choose
// from, the five objections coming in the next five minutes, and every
// five minutes five twenty-page reports filed under the client's name.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import type { Coaching, Signal, Speaker, Turn } from "@shared/whispererEngine";

type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null; onerror: ((ev: unknown) => void) | null;
  start: () => void; stop: () => void;
};
function getRecognizer(): SpeechRecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const fmtMs = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0")}`;

export default function Whisperer() {
  const utils = trpc.useUtils();
  const status = trpc.whisperer.status.useQuery(undefined, { refetchInterval: 15_000 });
  const clients = trpc.whisperer.clients.useQuery();
  const sessions = trpc.whisperer.sessions.useQuery();
  const saveSettings = trpc.whisperer.saveSettings.useMutation({ onSuccess: () => utils.whisperer.status.invalidate() });
  const testText = trpc.whisperer.testText.useMutation();
  const start = trpc.whisperer.start.useMutation({ onSuccess: () => { utils.whisperer.status.invalidate(); utils.whisperer.sessions.invalidate(); } });
  const end = trpc.whisperer.end.useMutation({ onSuccess: () => { utils.whisperer.status.invalidate(); utils.whisperer.sessions.invalidate(); } });
  const ingest = trpc.whisperer.ingest.useMutation();
  const runCycle = trpc.whisperer.runCycleNow.useMutation();

  const live = status.data?.live ?? null;
  const liveId = live?.id ?? null;
  const coachQ = trpc.whisperer.coach.useQuery({ sessionId: liveId ?? 0 }, { enabled: Boolean(liveId), refetchInterval: 5_000 });
  const coaching: Coaching | undefined = coachQ.data?.coaching;

  // ── settings form ──
  const [phone, setPhone] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [cycleMinutes, setCycleMinutes] = useState(5);
  const [reportsPerCycle, setReportsPerCycle] = useState(5);
  const [zoomEmail, setZoomEmail] = useState("");
  useEffect(() => {
    const s = status.data?.settings;
    if (!s) return;
    setPhone(s.advisorPhone ?? ""); setAdvisorName(s.advisorName ?? ""); setSmsEnabled(s.smsEnabled); setCycleMinutes(s.cycleMinutes); setReportsPerCycle(s.reportsPerCycle); setZoomEmail(s.zoomUserEmail ?? "");
  }, [status.data?.settings]);

  // ── start form ──
  const [clientId, setClientId] = useState<number | "">("");
  const [clientName, setClientName] = useState("");
  const [zoomMeetingId, setZoomMeetingId] = useState("");
  const zoomHistory = trpc.whisperer.zoomHistory.useQuery({ clientName: clientName || "x" }, { enabled: Boolean(clientName) && Boolean(status.data?.zoom.api) });

  // ── the ears: browser microphone ──
  const [listening, setListening] = useState(false);
  const [speaker, setSpeaker] = useState<Speaker>("client");
  const speakerRef = useRef<Speaker>("client");
  speakerRef.current = speaker;
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const startedAtRef = useRef<number>(0);
  useEffect(() => { if (live) startedAtRef.current = new Date(live.startedAt).getTime(); }, [live]);
  const [interim, setInterim] = useState("");
  const [note, setNote] = useState("");
  const [lastError, setLastError] = useState("");

  const send = useCallback(async (turns?: Turn[], signals?: Signal[], frameJpegBase64?: string) => {
    if (!liveId) return;
    try { await ingest.mutateAsync({ sessionId: liveId, turns, signals, frameJpegBase64 }); utils.whisperer.coach.invalidate({ sessionId: liveId }); }
    catch (e) { setLastError((e as Error).message); }
  }, [ingest, liveId, utils.whisperer.coach]);

  const stopMic = useCallback(() => { recRef.current?.stop(); recRef.current = null; setListening(false); }, []);
  const startMic = useCallback(() => {
    const rec = getRecognizer();
    if (!rec) { setLastError("This browser has no speech recognition. Use Chrome, or connect Zoom."); return; }
    recRef.current = rec;
    rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (ev) => {
      let partial = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const text = r[0].transcript.trim();
        if (r.isFinal && text) { void send([{ at: Math.max(0, Date.now() - startedAtRef.current), speaker: speakerRef.current, text, source: "browser" }]); }
        else partial += text;
      }
      setInterim(partial);
    };
    rec.onerror = () => { /* keep going */ };
    rec.onend = () => { if (recRef.current === rec) { try { rec.start(); } catch { setListening(false); } } };
    try { rec.start(); setListening(true); } catch { setLastError("Microphone could not start."); }
  }, [send]);
  useEffect(() => () => { recRef.current?.stop(); }, []);

  // ── the eyes: a shared window, one frame every twenty seconds ──
  const [watching, setWatching] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameTimer = useRef<number | null>(null);
  const stopEyes = useCallback(() => { if (frameTimer.current) window.clearInterval(frameTimer.current); frameTimer.current = null; streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; setWatching(false); }, []);
  const startEyes = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      const video = document.createElement("video");
      video.srcObject = stream; video.muted = true; await video.play();
      videoRef.current = video;
      setWatching(true);
      const grab = () => {
        const v = videoRef.current; if (!v || !v.videoWidth) return;
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 640 / v.videoWidth);
        canvas.width = Math.round(v.videoWidth * scale); canvas.height = Math.round(v.videoHeight * scale);
        canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        void send(undefined, undefined, data);
      };
      window.setTimeout(grab, 1500);
      frameTimer.current = window.setInterval(grab, 20_000);
      stream.getVideoTracks()[0].onended = stopEyes;
    } catch { setLastError("Screen share was not granted."); }
  }, [send, stopEyes]);
  useEffect(() => () => stopEyes(), [stopEyes]);

  const [asked, setAsked] = useState<Record<string, boolean>>({});
  const elapsed = live ? Date.now() - new Date(live.startedAt).getTime() : 0;
  const needs = status.data?.needs ?? [];
  const topCue = coaching?.cues[0];
  const cueTone = topCue?.kind === "stop-talking" ? "bg-red-500/20 border-red-400/60 text-red-100" : topCue?.kind === "close" ? "bg-emerald-500/25 border-emerald-300/70 text-emerald-50" : topCue?.kind === "acknowledge" || topCue?.kind === "slow-down" ? "bg-amber-500/20 border-amber-300/60 text-amber-50" : "bg-sky-500/15 border-sky-300/40 text-sky-50";
  const cueLabel = (k?: string) => k === "stop-talking" ? "Stop talking" : k === "ask-now" ? "Ask now" : k === "close" ? "Close now" : k === "acknowledge" ? "Acknowledge" : k === "slow-down" ? "Slow down" : k === "clarify" ? "Clarify" : k === "re-engage" ? "Re-engage" : "Keep going";
  const clientOptions = useMemo(() => clients.data ?? [], [clients.data]);

  return (
    <AppShell title="AI Whisperer" subtitle="Your live-call coach: when to stop talking, what to ask, what is coming, and the reports to handle it.">
      <div className="mx-auto max-w-6xl px-4 py-8 text-white" data-testid="whisperer-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">Advisor · Russell Capital Systems</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">The AI Whisperer</h1>
            <p className="mt-2 max-w-2xl leading-7 text-amber-100/70">It listens to the call, reads the room, remembers the last call, and texts you the coaching. Every five minutes it predicts the next five objections and files five full reports under the client's name.</p>
          </div>
          <Link href="/portal/advisor" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">Advisor dashboard</Link>
        </div>

        {/* readiness */}
        <section className="mt-6 grid gap-3 sm:grid-cols-4" aria-label="Readiness">
          {[
            ["Texts", status.data ? (status.data.sms.mode === "none" ? "not configured" : `${status.data.sms.mode} → ${status.data.sms.to}`) : "…", status.data?.sms.mode !== "none"],
            ["Zoom recordings", status.data ? (status.data.zoom.api ? "connected" : "not configured") : "…", status.data?.zoom.api],
            ["Zoom live stream", status.data ? (status.data.zoom.webhook ? (status.data.zoom.rtmsAttached ? "streaming" : "armed") : "not configured") : "…", status.data?.zoom.webhook],
            ["Body language", status.data ? (status.data.vision ? "vision model on" : "no vision key") : "…", status.data?.vision],
          ].map(([l, v, ok]) => (
            <div key={String(l)} className={`rounded-xl border p-3 ${ok ? "border-emerald-300/30 bg-emerald-500/10" : "border-amber-300/30 bg-amber-500/10"}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">{l}</p><p className="mt-1 text-sm font-semibold">{String(v)}</p>
            </div>
          ))}
        </section>
        {needs.length > 0 && (
          <details className="mt-3 rounded-xl border border-amber-300/25 bg-amber-500/5 p-3 text-sm text-amber-100/80">
            <summary className="cursor-pointer font-semibold">What the host still needs for the full system ({needs.length})</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">{needs.map((n) => <li key={n}>{n}</li>)}</ul>
            <p className="mt-2 text-xs text-amber-200/60">Until then: the browser microphone is the ears, a shared Zoom window is the eyes, and coaching shows on this page even when texts cannot be sent.</p>
          </details>
        )}

        {!live ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            {/* start a call */}
            <section className="rounded-3xl border border-amber-300/25 bg-[#120f03]/85 p-5" aria-label="Start a call">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Start a call</p>
              <h2 className="mt-1 text-2xl font-semibold">Who is on the line?</h2>
              <label className="mt-4 block text-sm text-amber-100/70">Client on file
                <select value={clientId} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setClientId(v); const c = clientOptions.find((x) => x.id === v); if (c) setClientName(c.name); }} className="mt-1 w-full rounded-xl border border-amber-300/25 bg-black/30 px-3 py-2.5 text-white" data-testid="whisperer-client">
                  <option value="">— not on file yet —</option>
                  {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-sm text-amber-100/70">Name as you say it
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Dr. Elena Park" className="mt-1 w-full rounded-xl border border-amber-300/25 bg-black/30 px-3 py-2.5 text-white placeholder:text-white/30" data-testid="whisperer-name" />
              </label>
              <label className="mt-3 block text-sm text-amber-100/70">Zoom meeting ID (optional; the live stream attaches by it)
                <input value={zoomMeetingId} onChange={(e) => setZoomMeetingId(e.target.value.replace(/\s/g, ""))} placeholder="123 4567 8901" className="mt-1 w-full rounded-xl border border-amber-300/25 bg-black/30 px-3 py-2.5 text-white placeholder:text-white/30" />
              </label>
              <button type="button" disabled={!clientName.trim() || start.isPending} onClick={() => start.mutate({ clientId: clientId === "" ? undefined : clientId, clientName: clientName.trim(), zoomMeetingId: zoomMeetingId || undefined })} className="mt-5 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400 disabled:opacity-50" data-testid="whisperer-start">
                {start.isPending ? "Arming…" : "Arm the Whisperer"}
              </button>
              {start.data && <p className="mt-2 text-sm text-amber-100/70">{start.data.smsSent ? `Armed. A text went to ${status.data?.sms.to}.` : `Armed. Text not sent: ${start.data.smsReason ?? "no transport"}.`}</p>}
              {start.error && <p className="mt-2 text-sm text-red-300">{start.error.message}</p>}
              {zoomHistory.data?.configured && zoomHistory.data.recordings.length > 0 && (
                <div className="mt-5 rounded-xl border border-white/10 p-3 text-sm">
                  <p className="font-semibold">Previous Zoom calls with {clientName}</p>
                  <ul className="mt-2 space-y-2 text-amber-100/70">
                    {zoomHistory.data.recordings.map((r) => <li key={r.uuid}>{new Date(r.startTime).toLocaleDateString()} · {r.topic} · {r.durationMin} min · {r.hasTranscript ? `${r.turns} turns, you ${r.advisorPct}%` : "no transcript"}{r.excerpt[0] ? ` · “${r.excerpt[0]}”` : ""}</li>)}
                  </ul>
                </div>
              )}
            </section>

            {/* settings */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Settings">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Where the coaching goes</p>
              <h2 className="mt-1 text-2xl font-semibold">Your phone, your cadence</h2>
              <label className="mt-4 block text-sm text-white/70">Text the coaching to
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 910 747 1781" className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-white" data-testid="whisperer-phone" />
              </label>
              <label className="mt-3 block text-sm text-white/70">Your name as it appears on Zoom
                <input value={advisorName} onChange={(e) => setAdvisorName(e.target.value)} placeholder="Sam Russell" className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-white" />
              </label>
              <label className="mt-3 block text-sm text-white/70">Zoom account email (for past recordings)
                <input value={zoomEmail} onChange={(e) => setZoomEmail(e.target.value)} placeholder="you@yourfirm.com" className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-white" />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/70">
                <label>Objection cycle (minutes)<input type="number" min={1} max={30} value={cycleMinutes} onChange={(e) => setCycleMinutes(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white" /></label>
                <label>Reports per cycle<input type="number" min={1} max={5} value={reportsPerCycle} onChange={(e) => setReportsPerCycle(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white" /></label>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} className="accent-amber-400" /> Text me during calls</label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => saveSettings.mutate({ advisorPhone: phone, advisorName, smsEnabled, cycleMinutes, reportsPerCycle, zoomUserEmail: zoomEmail })} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">{saveSettings.isPending ? "Saving…" : "Save"}</button>
                <button type="button" onClick={() => testText.mutate()} className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10">Send a test text</button>
              </div>
              {saveSettings.data && <p className="mt-2 text-sm text-white/60">{saveSettings.data.saved ? "Saved." : saveSettings.data.reason}</p>}
              {testText.data && <p className="mt-2 text-sm text-white/60">{testText.data.sent ? "Test text sent." : `Not sent: ${testText.data.reason}`}</p>}
              <div className="mt-5 rounded-xl border border-white/10 p-3 text-xs leading-5 text-white/55">
                <p className="font-semibold text-white/75">Zoom setup, once</p>
                <p>Marketplace → Develop → Build App → Server-to-Server OAuth. Add scopes for cloud recordings, meetings, users and RTMS. Under Event Subscriptions set the URL to <code className="text-amber-200">{window.location.origin}{status.data?.zoom.webhookPath ?? "/api/zoom/webhook"}</code> and subscribe to meeting.rtms_started and meeting.rtms_stopped. Put the four keys in the host's environment. In each meeting, turn on Realtime Media Streams; the coach attaches to the call armed here.</p>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]" data-testid="whisperer-live">
            {/* the coach */}
            <section className="rounded-3xl border border-amber-300/30 bg-[#120f03]/85 p-5" aria-label="Live coaching">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Live · {live.clientName}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{fmtMs(elapsed)} · {coaching?.phase ?? "listening"}</h2>
                </div>
                <div className="flex gap-2 text-sm">
                  <button type="button" onClick={() => runCycle.mutate({ sessionId: live.id })} className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10">{runCycle.isPending ? "Building…" : "Run the 5 reports now"}</button>
                  <button type="button" onClick={() => { stopMic(); stopEyes(); end.mutate({ sessionId: live.id }); }} className="rounded-lg bg-red-500/80 px-3 py-1.5 font-semibold hover:bg-red-400">End call</button>
                </div>
              </div>
              {coachQ.data && <p className="mt-1 text-xs text-white/50">Next objection cycle in {fmtMs(coachQ.data.nextCycleInMs)} · {coachQ.data.rtmsAttached ? "Zoom stream attached" : "Zoom stream not attached"} · {live.turnCount} turns · {live.signalCount} signals</p>}

              <div className={`mt-5 rounded-2xl border p-5 ${cueTone}`} role="status" aria-live="polite" data-testid="whisperer-cue">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-80">{cueLabel(topCue?.kind)}</p>
                <p className="mt-1 text-2xl font-semibold leading-snug">{topCue?.text ?? "Listening. Say something, or press the microphone."}</p>
                {topCue && <p className="mt-2 text-sm opacity-80">{topCue.why}</p>}
                {coaching && coaching.cues.slice(1).map((c) => <p key={c.text} className="mt-2 text-sm opacity-70">• {cueLabel(c.kind)}: {c.text}</p>)}
              </div>

              {coaching && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Airtime, last 3 min</p>
                    <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/10"><div className="bg-amber-400" style={{ width: `${coaching.talk.advisorPct}%` }} /><div className="bg-sky-400" style={{ width: `${coaching.talk.clientPct}%` }} /></div>
                    <p className="mt-1 text-sm">You {coaching.talk.advisorPct}% · them {coaching.talk.clientPct}% · monologue {coaching.talk.lastAdvisorMonologueSec}s</p>
                  </div>
                  <div className="rounded-xl border border-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Reads as</p>
                    <p className="mt-1 text-lg font-semibold capitalize">{coaching.decision.type} <span className="text-sm font-normal text-white/60">{Math.round(coaching.decision.confidence * 100)}%</span></p>
                    <p className="text-xs text-white/50">{coaching.decision.evidence[0] ?? "No evidence yet"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Mood</p>
                    <p className="mt-1 text-lg font-semibold">{coaching.mood.label} <span className="text-sm font-normal text-white/60">{coaching.mood.trend}</span></p>
                    <p className="text-xs text-white/50">{coaching.mood.latestSignals[coaching.mood.latestSignals.length - 1] ?? "no body-language signal yet"}</p>
                  </div>
                </div>
              )}

              {coaching && (
                <>
                  <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Five questions to choose from</h3>
                  <ol className="mt-2 space-y-2" data-testid="whisperer-questions">
                    {coaching.questions.map((q, i) => (
                      <li key={q.id} className={`rounded-xl border p-3 ${asked[q.id] ? "border-white/5 opacity-50" : "border-white/10"}`}>
                        <button type="button" onClick={() => { setAsked((a) => ({ ...a, [q.id]: true })); void send([{ at: Math.max(0, Date.now() - startedAtRef.current), speaker: "advisor", text: q.text, source: "manual" }]); }} className="text-left">
                          <p className="text-base font-semibold">{i + 1}. {q.text}</p>
                          <p className="text-xs text-white/50">{q.purpose} · tap when asked</p>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Coming in the next five minutes</h3>
                  <ol className="mt-2 space-y-2" data-testid="whisperer-objections">
                    {coaching.objections.map((o) => (
                      <li key={o.id} className="rounded-xl border border-white/10 p-3">
                        <details>
                          <summary className="cursor-pointer"><span className="font-semibold">{o.title}</span> <span className="text-sm text-white/60">{Math.round(o.likelihood * 100)}%</span><span className="ml-2 inline-block h-1.5 w-24 overflow-hidden rounded-full bg-white/10 align-middle"><span className="block h-full bg-amber-400" style={{ width: `${Math.round(o.likelihood * 100)}%` }} /></span></summary>
                          <p className="mt-2 text-sm text-white/75">{o.handle}</p>
                          <p className="mt-2 text-sm italic text-amber-100/85">“{o.talkTrack}”</p>
                          <p className="mt-2 text-xs text-white/50">Signals: {o.signals.join(" ")}</p>
                          <p className="mt-1 text-xs text-white/50">Strategies: {o.strategies.join(" · ")}</p>
                          <p className="mt-1 flex flex-wrap gap-1">{o.calculators.map((c) => <Link key={c.path} href={c.path} className="rounded-full bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20">{c.label}</Link>)}</p>
                        </details>
                      </li>
                    ))}
                  </ol>
                  {coaching.buyingSignals.length > 0 && <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-500/15 p-3 text-sm">Buying signal: “{coaching.buyingSignals[coaching.buyingSignals.length - 1]}”</p>}
                </>
              )}
            </section>

            {/* ears, eyes, reports */}
            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Ears and eyes">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Ears and eyes</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={listening ? stopMic : startMic} className={`rounded-xl px-4 py-2 text-sm font-semibold ${listening ? "bg-red-500/80" : "bg-sky-500"}`} data-testid="whisperer-mic">{listening ? "Stop the microphone" : "Listen with this microphone"}</button>
                  <div className="flex overflow-hidden rounded-xl border border-white/15 text-sm">
                    <button type="button" onClick={() => setSpeaker("advisor")} className={`px-3 py-2 ${speaker === "advisor" ? "bg-amber-500 text-black" : ""}`}>I'm talking</button>
                    <button type="button" onClick={() => setSpeaker("client")} className={`px-3 py-2 ${speaker === "client" ? "bg-sky-500" : ""}`}>They're talking</button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/50">{coachQ.data?.rtmsAttached ? "Zoom is streaming the transcript; the microphone is a backup." : "Without the Zoom stream, this microphone hears the call on speaker. Flip the switch to who is speaking."}</p>
                {interim && <p className="mt-2 text-sm text-white/60">…{interim}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={watching ? stopEyes : () => void startEyes()} className={`rounded-xl px-4 py-2 text-sm font-semibold ${watching ? "bg-red-500/80" : "bg-emerald-500"}`}>{watching ? "Stop watching" : "Watch the Zoom window"}</button>
                  <span className="text-xs text-white/50">One frame every 20 s to the vision model: posture, expression, attention.</span>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; void send([{ at: Math.max(0, Date.now() - startedAtRef.current), speaker, text: note.trim(), source: "manual" }]); setNote(""); }} className="mt-3 flex gap-2">
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Type what ${speaker === "advisor" ? "you" : "they"} just said`} className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30" data-testid="whisperer-note" />
                  <button type="submit" className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Add</button>
                </form>
                {lastError && <p className="mt-2 text-xs text-red-300">{lastError}</p>}
                {coachQ.data && coachQ.data.recentTurns.length > 0 && (
                  <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-xs text-white/70">
                    {coachQ.data.recentTurns.map((t, i) => <li key={`${t.at}-${i}`}><span className="text-white/40">{fmtMs(t.at)}</span> <span className={t.speaker === "advisor" ? "text-amber-200" : "text-sky-200"}>{t.speaker === "advisor" ? "You" : live.clientName.split(" ")[0]}:</span> {t.text}</li>)}
                  </ul>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Reports">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Objection reports on file</p>
                <p className="mt-1 text-xs text-white/50">Five per cycle, twenty pages each, titled by the objection, saved under {live.clientName}. The client cannot see or edit them.</p>
                <ul className="mt-3 space-y-2 text-sm" data-testid="whisperer-reports">
                  {(coachQ.data?.reports ?? []).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 p-2">
                      <div><p className="font-semibold">{r.title}</p><p className="text-xs text-white/50">cycle {r.cycle} · {r.likelihood}% · {r.pages} pages · {new Date(r.createdAt).toLocaleTimeString()}{r.smsSentAt ? " · texted" : ""}</p></div>
                      <a href={r.url} target="_blank" rel="noreferrer" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">Open PDF</a>
                    </li>
                  ))}
                  {!(coachQ.data?.reports ?? []).length && <li className="text-xs text-white/50">None yet. The first five arrive at the first cycle, or press “Run the 5 reports now”.</li>}
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* history */}
        <section className="mt-10" aria-label="Past calls">
          <h2 className="text-lg font-semibold text-amber-100/85">Past calls</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {(sessions.data ?? []).filter((s) => s.status === "ended").slice(0, 10).map((s) => (
              <li key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                <p className="font-semibold">{s.clientName} <span className="text-xs font-normal text-white/50">{new Date(s.startedAt).toLocaleString()}</span></p>
                <p className="mt-1 text-xs text-white/60">{s.memorySummary ?? "—"}</p>
                <p className="mt-1 text-xs text-white/40">{s.cycles} cycles · {s.turnCount} turns · reads {s.decisionType ?? "—"}</p>
                <SessionReports sessionId={s.id} />
              </li>
            ))}
            {!(sessions.data ?? []).some((s) => s.status === "ended") && <li className="text-xs text-white/50">No calls on record yet.</li>}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function SessionReports({ sessionId }: { sessionId: number }) {
  const reports = trpc.whisperer.reports.useQuery({ sessionId });
  if (!reports.data?.length) return null;
  return <p className="mt-2 flex flex-wrap gap-1">{reports.data.map((r) => <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20">{r.title} · c{r.cycle}</a>)}</p>;
}
