import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Camera, CameraOff, Ear, EarOff, Mic, MicOff, Volume2, VolumeX, ShieldCheck, Sparkles } from "lucide-react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/lib/usePageTitle";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";
import { companion, PAUSE_MS, type CompanionOutput, type CompanionSignal, type CompanionTurn, type Permission } from "@shared/nlp/companion";
import { REP_SYSTEM_LABEL, REP_SYSTEMS } from "@shared/nlp/repSystems";
import { toneFromEnergy, FRAME_INTERVAL_MS } from "@shared/nlp/signals";
import { CHAPTER_TITLE } from "@shared/nlp/patterns";
import DurabilityCard, { saveMetaProgramReadings } from "@/components/finance/DurabilityCard";

/**
 * The Companion: a reflection companion that listens, speaks in the person's
 * own sensory language, and asks before it steers. The decision to speak is
 * made by the shared engine (shared/nlp/companion.ts) running in this
 * browser; the server re-runs the same engine, applies the recording
 * consents, and may phrase the line more naturally. Nothing here diagnoses,
 * assesses or treats; the clinical edition frames it as decision support.
 */

type SpeechRecognitionLike = {
  continuous: boolean; interimResults: boolean; lang: string;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: ((e: { error?: string }) => void) | null;
};

function speechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function sessionId(): string {
  try { return localStorage.getItem("db_session_id") ?? ""; } catch { return ""; }
}

const EDITION = CLINICAL_TOOLS_ENABLED ? "clinical" : "public";

export default function Companion() {
  usePageTitle("Companion");
  const [turns, setTurns] = useState<CompanionTurn[]>([]);
  const [signals, setSignals] = useState<CompanionSignal[]>([]);
  const [listening, setListening] = useState(false);
  const [voice, setVoice] = useState(true);
  const [camera, setCamera] = useState(false);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("Press Listen, or type below, and say what is on your mind.");
  const [permission, setPermission] = useState<Permission>("unknown");
  const [permissionAt, setPermissionAt] = useState<number | undefined>();
  const [lastInterventionAt, setLastInterventionAt] = useState<number | undefined>();
  const [offered, setOffered] = useState<number[]>([]);
  const [lastDecision, setLastDecision] = useState<string>("");
  const [openPattern, setOpenPattern] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  const startedAt = useRef<number>(Date.now());
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const speakingRef = useRef(false);
  const audioRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; stream: MediaStream; history: number[] } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const utteranceStart = useRef<number | null>(null);
  const busy = useRef(false);

  const consentQuery = trpc.companion.consent.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const setRecording = trpc.consent.setRecording.useMutation({ onSuccess: () => consentQuery.refetch() });
  const turnMutation = trpc.companion.turn.useMutation();
  const frameMutation = trpc.companion.readFrame.useMutation();
  const consent = consentQuery.data ?? { audio: false, video: false };

  const elapsed = useCallback(() => Date.now() - startedAt.current, []);

  // The engine runs locally every 750ms for the reading panel and the decision.
  useEffect(() => {
    const id = window.setInterval(() => setNow(elapsed()), 750);
    return () => window.clearInterval(id);
  }, [elapsed]);

  const output: CompanionOutput = useMemo(
    () => companion({ turns, signals, now, edition: EDITION, consent, lastInterventionAt, permission, permissionAt, offered }),
    [turns, signals, now, consent, lastInterventionAt, permission, permissionAt, offered],
  );

  // Keep only the salient sorting readings (never the transcript) so the finance hub can show the same durability card.
  useEffect(() => { if (output.reading.salientMetaPrograms.length) saveMetaProgramReadings(output.reading.metaPrograms); }, [output.reading.salientMetaPrograms.length, output.reading.metaPrograms]);

  const addPersonTurn = useCallback((text: string, durationMs?: number) => {
    const t = text.trim();
    if (!t) return;
    setTurns(prev => [...prev, { at: elapsed() - (durationMs ?? 0), speaker: "person", text: t, durationMs }]);
  }, [elapsed]);

  const speak = useCallback((text: string) => {
    if (!voice || typeof speechSynthesis === "undefined") return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1;
      speakingRef.current = true;
      try { recRef.current?.stop(); } catch { /* not running */ }
      u.onend = () => { speakingRef.current = false; if (listening) { try { recRef.current?.start(); } catch { /* restarts on its own */ } } };
      speechSynthesis.speak(u);
    } catch { speakingRef.current = false; }
  }, [voice, listening]);

  // Act on a decision once: ask the server to phrase it (and apply consents), then speak it.
  useEffect(() => {
    const iv = output.intervention;
    if (!iv.say || iv.kind === "listen") return;
    const key = `${iv.kind}:${iv.say}:${turns.length}`;
    if (key === lastDecision || busy.current) return;
    busy.current = true;
    setLastDecision(key);
    const at = elapsed();
    (async () => {
      let spoken = iv.say!;
      try {
        const r = await turnMutation.mutateAsync({ turns, signals, now: at, lastInterventionAt, permission, permissionAt, offered, phrase: true });
        spoken = r.intervention.spoken ?? spoken;
      } catch { /* the deterministic line is spoken */ }
      window.setTimeout(() => {
        setTurns(prev => [...prev, { at: elapsed(), speaker: "companion", text: spoken }]);
        setStatus(spoken);
        speak(spoken);
        if (iv.kind !== "reflect") setLastInterventionAt(elapsed());
        if (iv.permission !== permission) { setPermission(iv.permission); setPermissionAt(elapsed()); }
        if (iv.kind === "ask-permission") { setPermission("asked"); setPermissionAt(elapsed()); }
        if (iv.pattern) setOffered(prev => prev.includes(iv.pattern!.id) ? prev : [...prev, iv.pattern!.id]);
        busy.current = false;
      }, Math.max(0, iv.afterMs));
    })();
  }, [output, turns, signals, lastDecision, elapsed, speak, turnMutation, lastInterventionAt, permission, permissionAt, offered]);

  // Speech recognition.
  const startListening = useCallback(() => {
    const Ctor = speechRecognitionCtor();
    if (!Ctor) { setStatus("This browser has no speech recognition. Type below instead; everything else works the same."); return; }
    const rec = new Ctor();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (utteranceStart.current === null) utteranceStart.current = elapsed();
        if (res.isFinal) {
          const text = res[0]?.transcript ?? "";
          const dur = utteranceStart.current !== null ? elapsed() - utteranceStart.current : undefined;
          utteranceStart.current = null;
          if (!speakingRef.current) addPersonTurn(text, dur);
        }
      }
    };
    rec.onend = () => { if (listening && !speakingRef.current) { try { rec.start(); } catch { /* browser throttles */ } } };
    rec.onerror = e => { if (e.error === "not-allowed") { setListening(false); setStatus("Microphone access was refused. You can still type."); } };
    recRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  }, [addPersonTurn, elapsed, listening]);

  useEffect(() => {
    if (listening) startListening();
    else { try { recRef.current?.stop(); } catch { /* not running */ } recRef.current = null; }
    return () => { try { recRef.current?.stop(); } catch { /* not running */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  // Voice energy (browser only, with audio consent): an RMS reading every 500ms, a tone signal every 10s.
  useEffect(() => {
    if (!listening || !consent.audio) { audioRef.current?.stream.getTracks().forEach(t => t.stop()); audioRef.current?.ctx.close().catch(() => undefined); audioRef.current = null; return; }
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioRef.current = { ctx, analyser, stream, history: [] };
      } catch { setStatus("Microphone energy is unavailable; the companion still reads your words."); }
    })();
    const sample = window.setInterval(() => {
      const a = audioRef.current; if (!a) return;
      const buf = new Float32Array(a.analyser.fftSize); a.analyser.getFloatTimeDomainData(buf);
      let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      a.history.push(Math.sqrt(sum / buf.length)); if (a.history.length > 120) a.history.shift();
    }, 500);
    const emit = window.setInterval(() => {
      const a = audioRef.current; if (!a) return;
      const s = toneFromEnergy(a.history, elapsed(), "browser-audio");
      if (s) setSignals(prev => [...prev.slice(-100), s]);
    }, 10_000);
    return () => { cancelled = true; window.clearInterval(sample); window.clearInterval(emit); audioRef.current?.stream.getTracks().forEach(t => t.stop()); audioRef.current?.ctx.close().catch(() => undefined); audioRef.current = null; };
  }, [listening, consent.audio, elapsed]);

  // Camera (with video consent): one small JPEG frame every FRAME_INTERVAL_MS to the server.
  useEffect(() => {
    if (!camera || !consent.video) { videoStreamRef.current?.getTracks().forEach(t => t.stop()); videoStreamRef.current = null; return; }
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        videoStreamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => undefined); }
      } catch { setCamera(false); setStatus("Camera access was refused; the companion continues without it."); }
    })();
    const id = window.setInterval(async () => {
      const v = videoRef.current; if (!v || !videoStreamRef.current || v.videoWidth === 0) return;
      const c = document.createElement("canvas"); c.width = 320; c.height = Math.round((320 * v.videoHeight) / v.videoWidth) || 240;
      c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
      const jpegBase64 = c.toDataURL("image/jpeg", 0.6).split(",")[1] ?? "";
      try {
        const r = await frameMutation.mutateAsync({ jpegBase64, at: elapsed() });
        if (r.signals) setSignals(prev => [...prev.slice(-100), ...r.signals!]);
      } catch { /* consent may have been withdrawn; the next tick re-checks */ }
    }, FRAME_INTERVAL_MS);
    return () => { cancelled = true; window.clearInterval(id); videoStreamRef.current?.getTracks().forEach(t => t.stop()); videoStreamRef.current = null; };
  }, [camera, consent.video, elapsed, frameMutation]);

  const submitTyped = (e: React.FormEvent) => { e.preventDefault(); addPersonTurn(typed); setTyped(""); };
  const answer = (yes: boolean) => { addPersonTurn(yes ? "Yes, go ahead." : "Not now, let me finish.", 600); };

  const r = output.reading;
  const stateChips = [
    r.state.valence <= -0.2 ? "heavy" : r.state.valence >= 0.2 ? "lighter" : "even",
    r.state.arousal >= 0.5 ? "high energy" : r.state.arousal >= 0.25 ? "moderate energy" : "low energy",
    r.state.loop.ruminating ? "a loop is running" : null,
    r.state.awayFromSpiral ? "moving away from things" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-cyan-400" /> Companion</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            {EDITION === "public"
              ? "A reflection companion. It listens, answers in the kind of language you use (what you see, hear, or feel), and asks before it asks you anything that might steer you. It is software for reflection and education, not a clinician, and it does not assess or diagnose. If you are in danger, call 911; in the U.S., 988 reaches a person any time."
              : "Session decision support. The companion reads language and state in real time and proposes questions; the clinician decides."}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-cyan-400/20">
            <CardHeader>
              <CardTitle className="text-base flex flex-wrap items-center gap-2">
                <Button size="sm" variant={listening ? "default" : "outline"} onClick={() => setListening(v => !v)} aria-pressed={listening}>
                  {listening ? <><MicOff className="w-4 h-4 mr-1" /> Stop listening</> : <><Mic className="w-4 h-4 mr-1" /> Listen</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setVoice(v => !v)} aria-pressed={voice}>
                  {voice ? <><Volume2 className="w-4 h-4 mr-1" /> Voice on</> : <><VolumeX className="w-4 h-4 mr-1" /> Voice off</>}
                </Button>
                <Button size="sm" variant={camera ? "default" : "outline"} disabled={!consent.video} title={consent.video ? "" : "Turn on camera analysis in the consent settings first"} onClick={() => setCamera(v => !v)} aria-pressed={camera}>
                  {camera ? <><CameraOff className="w-4 h-4 mr-1" /> Camera off</> : <><Camera className="w-4 h-4 mr-1" /> Camera</>}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm min-h-[3rem]" aria-live="polite">
                <span className="text-cyan-300">{status}</span>
                {permission === "asked" && (
                  <span className="ml-3 inline-flex gap-2">
                    <Button size="sm" onClick={() => answer(true)}>Yes, go ahead</Button>
                    <Button size="sm" variant="outline" onClick={() => answer(false)}>Not now</Button>
                  </span>
                )}
              </div>
              <div className="max-h-[45vh] overflow-y-auto space-y-2 pr-1">
                {turns.length === 0 && <p className="text-xs text-muted-foreground">Nothing yet. Speak or type; the companion waits for a pause before it says anything.</p>}
                {turns.map((t, i) => (
                  <div key={i} className={`text-sm rounded-lg px-3 py-2 ${t.speaker === "person" ? "bg-white/[0.04]" : "bg-cyan-500/10 border border-cyan-500/20"}`}>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-2">{t.speaker === "person" ? "You" : "Companion"}</span>{t.text}
                  </div>
                ))}
              </div>
              <form onSubmit={submitTyped} className="flex gap-2">
                <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="Or type what's on your mind…" aria-label="Type what's on your mind" className="flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm" />
                <Button type="submit" size="sm" disabled={!typed.trim()}>Send</Button>
              </form>
              <p className="text-[11px] text-muted-foreground">Timing: {output.timing.reason}. Decision: {output.intervention.kind} ({output.intervention.why}).</p>
              <video ref={videoRef} muted playsInline className={camera && consent.video ? "w-40 rounded-md border border-white/10" : "hidden"} aria-label="Your camera preview" />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-white/10">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Ear className="w-4 h-4 text-cyan-400" /> How you're saying it</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  {REP_SYSTEMS.filter(s => r.rep.percent[s] > 0).map(s => (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-40 shrink-0 text-muted-foreground">{REP_SYSTEM_LABEL[s]}</span>
                      <div className="flex-1 h-2 rounded bg-white/10"><div className="h-2 rounded bg-cyan-400/70" style={{ width: `${r.rep.percent[s]}%` }} /></div>
                      <span className="w-10 text-right">{r.rep.percent[s]}%</span>
                    </div>
                  ))}
                  {!r.rep.primary && <p className="text-xs text-muted-foreground">No sensory words yet. The companion will match the words you use: see, hear, or feel.</p>}
                </div>
                <div className="flex flex-wrap gap-1">{stateChips.map(c => <span key={c} className="text-[11px] rounded-full border border-white/15 px-2 py-0.5">{c}</span>)}</div>
                {r.state.signals.length > 0 && <p className="text-xs text-muted-foreground">From your voice or camera: {r.state.signals.join("; ")}.</p>}
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardHeader><CardTitle className="text-sm">The shape of what you said</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {r.metaModel.length === 0 && <p className="text-xs text-muted-foreground">Nothing to ask about; your sentences carry what they mean.</p>}
                {r.metaModel.slice(0, 4).map((f, i) => (
                  <div key={i} className="rounded-md bg-white/[0.03] px-3 py-2">
                    <p className="text-xs text-muted-foreground">{f.name} — "{f.match}"</p>
                    <p className="text-sm">{f.challenge}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardHeader><CardTitle className="text-sm">How you're sorting</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-xs">
                {r.salientMetaPrograms.length === 0 && <p className="text-muted-foreground">Not enough said yet to tell.</p>}
                {r.salientMetaPrograms.slice(0, 6).map(m => (
                  <p key={m.key}><span className="text-muted-foreground">{m.name}:</span> {m.leading?.label} <span className="text-muted-foreground">({m.leading?.evidence.map(e => `"${e}"`).join(", ")})</span></p>
                ))}
                <p className="text-[11px] text-muted-foreground pt-1">A way of structuring the conversation, not a measurement of you. It shifts as you do.</p>
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardHeader><CardTitle className="text-sm">Something you could try</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {r.patterns.length === 0 && <p className="text-xs text-muted-foreground">Nothing fits yet.</p>}
                {r.patterns.slice(0, 3).map(p => (
                  <div key={p.id} className="rounded-md bg-white/[0.03] px-3 py-2">
                    <button className="text-left w-full" onClick={() => setOpenPattern(openPattern === p.id ? null : p.id)}>
                      <p className="font-medium">#{p.id} {p.name} <span className="text-[10px] text-muted-foreground">· {CHAPTER_TITLE[p.chapter]}</span></p>
                      <p className="text-xs text-muted-foreground">{p.concept}</p>
                    </button>
                    {openPattern === p.id && (
                      <div className="mt-2 text-xs space-y-1">
                        {p.offerable ? <ol className="list-decimal pl-4 space-y-0.5">{p.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                          : <p className="text-amber-200">{p.caution ?? "This one is done with a guide."} {EDITION === "public" && "Worth exploring with a licensed professional."}</p>}
                        <p className="text-muted-foreground">Because: {p.because.join(", ")}.</p>
                      </div>
                    )}
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">From The Sourcebook of Magic (Hall & Belnap). Reflection exercises, {EDITION === "public" ? "not treatment" : "for the clinician's judgment"}.</p>
              </CardContent>
            </Card>

            <DurabilityCard readings={r.metaPrograms} source="how you've been sorting in this conversation" />

            <Card className="border-white/10">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-400" /> Voice and camera</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-cyan-400" checked={consent.audio} disabled={setRecording.isPending || !sessionId()} onChange={e => setRecording.mutate({ sessionId: sessionId(), audio: e.target.checked })} />
                  <span>Analyse my voice in my browser (tone and energy). No audio is stored or uploaded.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-cyan-400" checked={consent.video} disabled={setRecording.isPending || !sessionId()} onChange={e => { setRecording.mutate({ sessionId: sessionId(), video: e.target.checked }); if (!e.target.checked) setCamera(false); }} />
                  <span>Analyse my camera (one small frame about every 20 seconds, sent to the configured AI processor and not stored).</span>
                </label>
                {setRecording.error && <p className="text-rose-300">{setRecording.error.message}</p>}
                <p className="text-muted-foreground">Both are optional and separate from everything else. Details: <Link href="/health-data-privacy" className="text-cyan-300 underline">Consumer Health Data Privacy</Link>.</p>
                {!listening && consent.audio && <p className="text-muted-foreground flex items-center gap-1"><EarOff className="w-3 h-3" /> Voice analysis runs only while listening.</p>}
                <p className="text-muted-foreground">Pause before the companion speaks: {PAUSE_MS / 1000}s.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
