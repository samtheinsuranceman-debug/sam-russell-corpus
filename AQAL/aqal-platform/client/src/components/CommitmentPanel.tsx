import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Mic, Square, Check, Download, ShieldCheck, Target, AlertTriangle,
  RotateCcw, Loader2, Bell, Mail, MessageSquare, PenLine,
} from "lucide-react";
import {
  COMMITMENT_QUESTIONS, buildCommitmentMarkdown, answersByKey, answeredCount,
  toBullets, detectTimezone, type CommitmentAnswer, type CommitmentReminderChannel,
} from "@shared/commitment";

// ============================================================
// CommitmentPanel — the Personal Commitment Agreement flow
// Spoken (mic-narrated) answers only. Renders declared outcomes + the assessment
// snapshot (doing vs not-doing), then the questions, e-sign, download, reminders.
// Used by the /commitment page and the Portal "Commitment" tab.
// ============================================================

const supportsSpeech =
  typeof window !== "undefined" &&
  ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
const supportsRecorder =
  typeof window !== "undefined" &&
  typeof window.MediaRecorder !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia;

// -------------------- one question's mic recorder --------------------
function MicAnswer({
  value, onChange, disabled,
}: { value: string; onChange: (t: string) => void; disabled?: boolean }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const heardRef = useRef<string>("");
  const transcribe = trpc.commitment.transcribe.useMutation();

  const stopEverything = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      try { recorderRef.current.stop(); } catch { /* noop */ }
    }
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => () => stopEverything(), [stopEverything]);

  const start = useCallback(async () => {
    if (!supportsRecorder) {
      toast.error("Microphone recording isn't supported in this browser. Try Chrome, Edge, or Safari 14.5+.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      heardRef.current = "";
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const heard = heardRef.current.trim();
        if (heard.length > 0) {
          // Browser transcription won — append to anything already captured.
          onChange((value ? value.trim() + " " : "") + heard);
          return;
        }
        // No Web Speech API result → fall back to server STT on the audio.
        const actualMime = recorderRef.current?.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualMime });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const b64 = await blobToBase64(blob);
          const res = await transcribe.mutateAsync({ audioBase64: b64, mimeType: actualMime });
          if (res.error) { toast.error("Couldn't transcribe that. Please try again."); return; }
          if (res.mocked) {
            toast.error("Live transcription needs Chrome or Edge (or a configured STT provider). Please narrate in Chrome.");
            return;
          }
          if (res.text) onChange((value ? value.trim() + " " : "") + res.text.trim());
          else toast.error("We didn't catch any words — try speaking a little longer.");
        } catch {
          toast.error("Transcription failed. Please try again.");
        } finally {
          setTranscribing(false);
        }
      };
      rec.start(250);

      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const r = new SR();
          r.continuous = true;
          r.interimResults = true;
          r.lang = "en-US";
          r.onresult = (event: any) => {
            let finalChunk = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) finalChunk += event.results[i][0].transcript + " ";
            }
            if (finalChunk) heardRef.current += finalChunk;
          };
          r.onerror = () => { /* stay silent; server STT is the fallback */ };
          r.start();
          recognitionRef.current = r;
        } catch { recognitionRef.current = null; }
      }
      setRecording(true);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") toast.error("Microphone permission denied. Allow mic access in your browser.");
      else toast.error("Couldn't start the microphone. Check your browser permissions.");
    }
  }, [onChange, value, transcribe]);

  const stop = useCallback(() => {
    stopEverything();
    setRecording(false);
  }, [stopEverything]);

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {!recording ? (
          <Button
            type="button" size="sm" disabled={disabled || transcribing}
            onClick={start}
            className="gap-2 bg-primary text-primary-foreground"
          >
            {transcribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
            {transcribing ? "Transcribing…" : value ? "Add more (speak)" : "Speak your answer"}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={stop} className="gap-2 bg-red-600 text-white hover:bg-red-700">
            <Square className="w-3.5 h-3.5" /> Stop &amp; save
          </Button>
        )}
        {value && !recording && (
          <Button
            type="button" size="sm" variant="ghost"
            onClick={() => onChange("")}
            disabled={disabled}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Redo
          </Button>
        )}
        {recording && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LISTENING
          </span>
        )}
      </div>
      {value ? (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-primary/70 mb-2">Your words, captured</p>
          <ul className="space-y-1.5">
            {toBullets(value).map((b, i) => (
              <li key={i} className="text-[13px] text-foreground/90 leading-relaxed flex gap-2">
                <span className="text-primary/50 select-none">—</span><span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Speak it — don't type it. Your own voice is what makes this stick.
          {!supportsSpeech && " (For instant transcription, use Chrome or Edge.)"}
        </p>
      )}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const s = String(reader.result || "");
      resolve(s.includes(",") ? s.split(",")[1] : s);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// -------------------- reminder opt-in --------------------
function ReminderOptIn({ initialChannel, initialPhone }: { initialChannel: CommitmentReminderChannel; initialPhone: string }) {
  const [channel, setChannel] = useState<CommitmentReminderChannel>(initialChannel);
  const [phone, setPhone] = useState(initialPhone);
  const [consent, setConsent] = useState(initialChannel !== "none");
  const set = trpc.commitment.setReminders.useMutation();

  const save = () => {
    if (channel === "text" && !consent) {
      toast.error("Please tick the box to agree to the daily Y/N text.");
      return;
    }
    set.mutate(
      { channel, phone: phone || undefined, timezone: detectTimezone(), consent },
      {
        onSuccess: (r: any) => {
          if (r?.error) { toast.error(r.error); return; }
          toast.success(channel === "none" ? "Daily check-ins turned off." : `Daily check-ins on — by ${channel}, ~8 PM your time. Reply Y or N.`);
        },
        onError: () => toast.error("Couldn't save that. Try again."),
      },
    );
  };

  const opt = (val: CommitmentReminderChannel, Icon: any, label: string, sub: string) => (
    <button
      type="button" onClick={() => setChannel(val)}
      className={`flex-1 text-left rounded-lg border p-3 transition-all ${channel === val ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
    >
      <Icon className={`w-4 h-4 mb-1.5 ${channel === val ? "text-primary" : "text-muted-foreground"}`} />
      <div className="text-[13px] font-medium text-foreground">{label}</div>
      <div className="text-[10.5px] text-muted-foreground">{sub}</div>
    </button>
  );

  return (
    <Card className="p-5 bg-secondary border-border">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Daily accountability — first 30 days</h3>
      </div>
      <p className="text-[12px] text-muted-foreground mb-4">
        Some people want a nudge; some don't — your call, and it's off unless you turn it on.
        One message at the end of your day, around <b className="text-foreground">8&nbsp;PM your local time</b>, asking one thing:
        did you complete today's tracking? You reply <b className="text-foreground">Y</b> or <b className="text-foreground">N</b>.
        That's it — <b className="text-foreground">never</b> anything else, never a sales pitch. Turn it off any time (reply STOP).
      </p>
      <div className="flex gap-2 mb-3">
        {opt("none", Bell, "No thanks", "I've got this on my own")}
        {opt("email", Mail, "Email me", "One Y/N, ~8 PM")}
        {opt("text", MessageSquare, "Text me", "One Y/N, ~8 PM")}
      </div>
      {channel === "text" && (
        <div className="mb-3 space-y-3">
          <div>
            <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">Your mobile number</label>
            <input
              type="tel" inputMode="tel" placeholder="+1 555 123 4567"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary outline-none"
            />
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-primary" />
            <span className="text-[12px] text-foreground/90">
              I agree to receive one daily text (a Y/N check-in) for 30 days at the number above. Message &amp; data rates may apply. Reply STOP to cancel.
            </span>
          </label>
        </div>
      )}
      <Button onClick={save} disabled={set.isPending} size="sm" className="gap-2 bg-primary text-primary-foreground">
        {set.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Save preference
      </Button>
    </Card>
  );
}

// -------------------- main panel --------------------
export default function CommitmentPanel() {
  const profile = trpc.profile.get.useQuery(undefined);
  const commitmentQ = trpc.commitment.get.useQuery(undefined);
  const utils = trpc.useUtils();
  const save = trpc.commitment.save.useMutation();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Seed local state from the server once.
  useEffect(() => {
    if (seeded || commitmentQ.isLoading) return;
    const c = commitmentQ.data as any;
    if (c) {
      setAnswers(answersByKey((c.answers as CommitmentAnswer[]) ?? []));
      if (c.signedName) setSignedName(c.signedName);
    }
    setSeeded(true);
  }, [commitmentQ.data, commitmentQ.isLoading, seeded]);

  const goals = (profile.data as any)?.goals || (commitmentQ.data as any)?.goals || "";
  const scores: any[] = (profile.data as any)?.scores || [];
  const isSigned = (commitmentQ.data as any)?.status === "signed";

  // Doing vs not-doing snapshot: strengths you already lean on vs the lines you
  // aren't yet expressing (your growth edges).
  const { strengths, edges } = useMemo(() => {
    if (!scores.length) return { strengths: [] as any[], edges: [] as any[] };
    const sorted = [...scores].sort((a, b) => (b.score || 0) - (a.score || 0));
    return { strengths: sorted.slice(0, 5), edges: sorted.slice(-5).reverse() };
  }, [scores]);

  const answersList: CommitmentAnswer[] = COMMITMENT_QUESTIONS
    .map((q) => ({ key: q.key, transcript: answers[q.key] || "" }))
    .filter((a) => a.transcript.trim().length > 0);
  const done = answeredCount(answersList);
  const ready = done >= COMMITMENT_QUESTIONS.length;

  const persist = (sign: boolean) => {
    save.mutate(
      { goals: goals || undefined, answers: answersList, sign, signedName: sign ? signedName : undefined },
      {
        onSuccess: (r: any) => {
          if (r?.error) { toast.error(r.error); return; }
          utils.commitment.get.invalidate();
          toast.success(sign ? "Signed. This is yours to return to." : "Progress saved.");
        },
        onError: () => toast.error("Couldn't save. Please try again."),
      },
    );
  };

  const download = () => {
    const c = commitmentQ.data as any;
    const md = buildCommitmentMarkdown({
      name: (profile.data as any)?.user?.name,
      goals,
      answers: answersList,
      signedName: c?.signedName || signedName,
      signedAtISO: c?.signedAt ? new Date(c.signedAt).toISOString() : new Date().toISOString(),
      reminderChannel: c?.reminderChannel,
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "My_Commitment_Agreement.md";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const setAns = (key: string, t: string) => setAnswers((prev) => ({ ...prev, [key]: t }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] tracking-[0.3em] text-primary mb-1">PERSONAL COMMITMENT AGREEMENT</p>
        <h2 className="font-display text-3xl font-semibold mb-2">Your dedication engine</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          This isn't a legal document. It's you, in your own spoken words, deciding — on the record — to
          follow through. When you falter, you come back here and read what you said. That's the whole point:
          you engineer your own commitment so no one has to nag you into it.
        </p>
      </div>

      {/* Declared outcomes */}
      {goals ? (
        <Card className="p-5 bg-secondary border-border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">The outcomes you declared</h3>
          </div>
          <p className="text-[14px] text-foreground/90 leading-relaxed whitespace-pre-line">{goals}</p>
        </Card>
      ) : null}

      {/* Doing vs not-doing */}
      {scores.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 bg-secondary border-border">
            <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">What you already lean on</h3>
            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[13px] text-foreground">{s.axisName}</span>
                  <span className="font-mono text-[11px] text-primary">{Math.round((s.score || 0) * 100)}th</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5 bg-secondary border-border">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D19A72]" />
              <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">What you're not yet doing — your edges</h3>
            </div>
            <div className="space-y-2">
              {edges.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[13px] text-foreground">{s.axisName}</span>
                  <span className="font-mono text-[11px] text-[#D19A72]">{Math.round((s.score || 0) * 100)}th</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              The gap isn't knowing — it's doing. This agreement is how you close it.
            </p>
          </Card>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(done / COMMITMENT_QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">{done} / {COMMITMENT_QUESTIONS.length} answered aloud</span>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {COMMITMENT_QUESTIONS.map((q, i) => (
          <Card key={q.key} className="p-5 bg-secondary border-border">
            <div className="flex items-start gap-3 mb-3">
              <span className="font-display text-2xl text-primary/40 leading-none">{i + 1}</span>
              <div className="flex-1">
                <p className="text-[15px] text-foreground leading-relaxed">{q.prompt}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {q.wantReasons > 0 ? <span className="text-primary font-medium">Speak {q.wantReasons} reasons. </span> : null}
                  {q.helper}
                </p>
              </div>
            </div>
            <MicAnswer value={answers[q.key] || ""} onChange={(t) => setAns(q.key, t)} disabled={save.isPending} />
          </Card>
        ))}
      </div>

      {/* Save progress */}
      {!isSigned && (
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => persist(false)} disabled={save.isPending || answersList.length === 0} className="gap-2">
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save progress
          </Button>
          <span className="text-[11px] text-muted-foreground">Come back and finish any time — your words are saved.</span>
        </div>
      )}

      {/* E-sign */}
      <Card className="p-6 bg-gradient-to-br from-secondary to-background border-border">
        <div className="flex items-center gap-2 mb-2">
          <PenLine className="w-4 h-4 text-primary" />
          <h3 className="font-display text-xl font-semibold">Sign your commitment</h3>
        </div>
        {isSigned ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">
                Signed by {(commitmentQ.data as any)?.signedName} · {(commitmentQ.data as any)?.signedAt ? new Date((commitmentQ.data as any).signedAt).toLocaleDateString() : ""}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">This is yours. Download it, keep it close, and read it back the day you waver.</p>
            <Button onClick={download} className="gap-2 bg-primary text-primary-foreground">
              <Download className="w-4 h-4" /> Download my agreement
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Answer all {COMMITMENT_QUESTIONS.length} questions aloud, then sign. Your typed name here is your signature — the reasons above are the part that had to be spoken.
            </p>
            <input
              type="text" placeholder="Type your full name to sign"
              value={signedName} onChange={(e) => setSignedName(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary outline-none"
            />
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-[13px] text-foreground/90">I'm making this commitment to myself, freely and deliberately. These are my own words and my own decision.</span>
            </label>
            {!ready && (
              <p className="text-[12px] text-[#D19A72] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Answer all {COMMITMENT_QUESTIONS.length} questions aloud to unlock signing ({done}/{COMMITMENT_QUESTIONS.length} done).
              </p>
            )}
            <Button
              onClick={() => persist(true)}
              disabled={save.isPending || !ready || !agreed || signedName.trim().length < 2}
              className="gap-2 bg-primary text-primary-foreground"
            >
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />} Sign &amp; lock it in
            </Button>
          </div>
        )}
      </Card>

      {/* Reminders (after signing) */}
      {isSigned && (
        <ReminderOptIn
          initialChannel={((commitmentQ.data as any)?.reminderChannel as CommitmentReminderChannel) || "none"}
          initialPhone={(commitmentQ.data as any)?.reminderPhone || ""}
        />
      )}
    </div>
  );
}
