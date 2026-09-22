/**
 * useLongVoiceSession — recording built for people who talk for a long time.
 *
 * Sam's requirement: two hours minimum, and if someone wants an hour to
 * explain their situation they get an hour. The things that actually change a
 * recommendation — the second marriage, the disabled child, the business
 * partner they no longer trust — surface forty minutes in, not in the first
 * ninety seconds.
 *
 * ─── WHY SEGMENTS, NOT CHUNKS ───────────────────────────────────────────────
 * The obvious approach — one MediaRecorder with a timeslice — does not work
 * at this duration. Timeslice chunks are fragments of one stream: only the
 * first carries the container header, so no chunk after it can be decoded on
 * its own. You are forced to hold all of them until the end, which means a
 * two-hour recording is a few hundred megabytes of tab memory that Whisper
 * will then reject for exceeding its file-size cap, and a crash loses
 * everything.
 *
 * So the recorder is cycled instead. Every SEGMENT_MS it is stopped and a new
 * one started, producing a sequence of complete, independently decodable
 * files. Each one transcribes on its own and uploads as soon as it closes, so
 * by the time the speaker finishes, most of the transcript already exists.
 *
 * The cycle costs a few milliseconds of audio at each boundary. Against losing
 * the whole session to a crash, that is the right trade.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { VOICE_SESSION_MAX_MS, VOICE_WARN_BEFORE_MS } from "@shared/aiAdvisor";

/**
 * Length of each independently decodable segment. Five minutes of Opus at the
 * browser's default bitrate is roughly 2MB — comfortably inside the 15MB
 * server cap, with room for a high-bitrate device.
 */
export const SEGMENT_MS = 5 * 60 * 1000;

export type VoiceStatus = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";

export type Segment = {
  index: number;
  blob: Blob;
  /** Filled once the server returns this segment's text. */
  text?: string;
  state: "pending" | "transcribing" | "done" | "failed";
  error?: string;
};

export type VoiceSession = {
  status: VoiceStatus;
  /** Milliseconds of audio captured, excluding paused time. */
  elapsedMs: number;
  /** True once within VOICE_WARN_BEFORE_MS of the ceiling. */
  nearingLimit: boolean;
  segments: Segment[];
  /** Transcript assembled so far, in order. */
  transcript: string;
  /** Segments still awaiting text. */
  pendingCount: number;
  error: string | null;
  /** Live input level 0–1, for the meter. */
  level: number;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  /** Stops, waits for outstanding transcription, returns the full transcript. */
  finish: () => Promise<string>;
  reset: () => void;
};

export function useLongVoiceSession(opts?: { maxMs?: number; language?: string }): VoiceSession {
  const maxMs = opts?.maxMs ?? VOICE_SESSION_MAX_MS;

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const segmentIndexRef = useRef(0);
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);
  const mimeRef = useRef<string>("audio/webm");
  /** Tail of the last completed transcript, for cross-segment continuity. */
  const contextRef = useRef<string>("");
  const inFlightRef = useRef(0);

  const pickMimeType = (): string | undefined => {
    if (typeof MediaRecorder === "undefined") return undefined;
    return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find(t =>
      MediaRecorder.isTypeSupported?.(t),
    );
  };

  /** Send one finished segment for transcription. */
  const transcribeSegment = useCallback(
    async (index: number, blob: Blob) => {
      inFlightRef.current += 1;
      setSegments(prev => prev.map(s => (s.index === index ? { ...s, state: "transcribing" } : s)));
      try {
        const res = await fetch("/api/voice/transcribe", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": blob.type || mimeRef.current,
            // Whisper keeps names and terminology consistent across a boundary
            // when it knows how the previous segment ended.
            ...(contextRef.current ? { "X-Prior-Context": contextRef.current.slice(-400) } : {}),
            ...(opts?.language ? { "X-Language": opts.language } : {}),
          },
          body: blob,
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(detail.error || "Transcription failed");
        }
        const { text } = await res.json();
        contextRef.current = (text || "").slice(-400);
        setSegments(prev => prev.map(s => (s.index === index ? { ...s, text: text ?? "", state: "done" } : s)));
      } catch (e: any) {
        // A failed segment does not end the session. The audio is retained so
        // the speaker can retry, and the rest of the transcript still lands.
        setSegments(prev =>
          prev.map(s => (s.index === index ? { ...s, state: "failed", error: e?.message ?? "Failed" } : s)),
        );
      } finally {
        inFlightRef.current -= 1;
      }
    },
    [opts?.language],
  );

  const teardownMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevel(0);
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    if (cycleRef.current) clearTimeout(cycleRef.current);
    cycleRef.current = null;
  }, []);

  /** Start one recorder against the live stream. Recursively re-arms itself. */
  const startSegmentRecorder = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = pickMimeType();
    if (mimeType) mimeRef.current = mimeType;
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    const index = segmentIndexRef.current;
    const parts: Blob[] = [];

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) parts.push(e.data);
    };

    recorder.onstop = () => {
      if (parts.length > 0) {
        const blob = new Blob(parts, { type: parts[0].type || mimeRef.current });
        setSegments(prev => [...prev, { index, blob, state: "pending" }]);
        void transcribeSegment(index, blob);
      }
      // Re-arm for the next segment unless the session is ending or paused.
      if (!stoppingRef.current && streamRef.current) {
        segmentIndexRef.current += 1;
        startSegmentRecorder();
      }
    };

    recorder.onerror = () => {
      setError("The microphone dropped out. Audio recorded so far is kept — press resume to continue.");
      setStatus("paused");
    };

    recorder.start();

    // Close this segment on schedule; onstop opens the next one.
    cycleRef.current = setTimeout(() => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, SEGMENT_MS);
  }, [transcribeSegment]);

  const runClock = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const total = accumulatedRef.current + (Date.now() - startedAtRef.current);
      setElapsedMs(total);
      if (total >= maxMs) {
        // Ceiling reached — close the current segment cleanly and stop.
        stoppingRef.current = true;
        if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
        releaseStream();
        teardownMeter();
        clearTimers();
        setStatus("stopped");
      }
    }, 250);
  }, [maxMs, releaseStream, teardownMeter, clearTimers]);

  const start = useCallback(async () => {
    setError(null);
    setStatus("requesting");
    stoppingRef.current = false;
    segmentIndexRef.current = 0;
    contextRef.current = "";
    setSegments([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // Input level meter — decorative, so failures here are swallowed.
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        const sample = () => {
          analyser.getByteTimeDomainData(buffer);
          let peak = 0;
          for (let i = 0; i < buffer.length; i++) peak = Math.max(peak, Math.abs(buffer[i] - 128) / 128);
          setLevel(peak);
          rafRef.current = requestAnimationFrame(sample);
        };
        sample();
      } catch { /* meter unavailable */ }

      startedAtRef.current = Date.now();
      accumulatedRef.current = 0;
      setElapsedMs(0);
      setStatus("recording");
      startSegmentRecorder();
      runClock();
    } catch (e: any) {
      releaseStream();
      setStatus("error");
      setError(
        e?.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser settings, then try again."
          : e?.name === "NotFoundError"
            ? "No microphone was found. Connect one and try again."
            : "Could not start recording. Check your microphone and try again.",
      );
    }
  }, [releaseStream, runClock, startSegmentRecorder]);

  const pause = useCallback(() => {
    if (recorderRef.current?.state !== "recording") return;
    // Close the current segment rather than using recorder.pause(), so the
    // audio up to this point is already transcribing while the speaker
    // gathers their thoughts.
    stoppingRef.current = true;
    recorderRef.current.stop();
    accumulatedRef.current += Date.now() - startedAtRef.current;
    clearTimers();
    setStatus("paused");
  }, [clearTimers]);

  const resume = useCallback(() => {
    if (!streamRef.current) return;
    stoppingRef.current = false;
    segmentIndexRef.current += 1;
    startedAtRef.current = Date.now();
    setStatus("recording");
    startSegmentRecorder();
    runClock();
  }, [runClock, startSegmentRecorder]);

  /** Stop, wait for every outstanding segment, hand back the transcript. */
  const finish = useCallback(async (): Promise<string> => {
    stoppingRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      await new Promise<void>(resolve => {
        const recorder = recorderRef.current!;
        const previous = recorder.onstop;
        recorder.onstop = ev => {
          (previous as any)?.call(recorder, ev);
          resolve();
        };
        recorder.stop();
      });
      if (status === "recording") accumulatedRef.current += Date.now() - startedAtRef.current;
    }
    releaseStream();
    teardownMeter();
    clearTimers();
    setElapsedMs(accumulatedRef.current);
    setStatus("stopped");

    // Wait for in-flight transcriptions, with a ceiling so a hung request
    // cannot strand the speaker on a spinner.
    const deadline = Date.now() + 120_000;
    while (inFlightRef.current > 0 && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 300));
    }

    return await new Promise<string>(resolve => {
      setSegments(current => {
        resolve(
          current
            .slice()
            .sort((a, b) => a.index - b.index)
            .map(s => s.text ?? "")
            .filter(Boolean)
            .join(" ")
            .trim(),
        );
        return current;
      });
    });
  }, [clearTimers, releaseStream, status, teardownMeter]);

  const reset = useCallback(() => {
    setSegments([]);
    accumulatedRef.current = 0;
    segmentIndexRef.current = 0;
    contextRef.current = "";
    setElapsedMs(0);
    setError(null);
    setStatus("idle");
  }, []);

  // A tab that unmounts mid-recording must not leave the microphone hot.
  useEffect(() => {
    return () => {
      stoppingRef.current = true;
      try { recorderRef.current?.stop(); } catch { /* already stopped */ }
      releaseStream();
      teardownMeter();
      clearTimers();
    };
  }, [releaseStream, teardownMeter, clearTimers]);

  const transcript = segments
    .slice()
    .sort((a, b) => a.index - b.index)
    .map(s => s.text ?? "")
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    status,
    elapsedMs,
    nearingLimit: elapsedMs > 0 && maxMs - elapsedMs <= VOICE_WARN_BEFORE_MS,
    segments,
    transcript,
    pendingCount: segments.filter(s => s.state === "pending" || s.state === "transcribing").length,
    error,
    level,
    start,
    pause,
    resume,
    finish,
    reset,
  };
}

/** "1:23:45" for long sessions, "4:05" for short ones. */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
