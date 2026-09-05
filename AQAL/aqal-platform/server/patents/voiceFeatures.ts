// ============================================================
// DSP VOICE-TONE / PROSODIC FEATURE EXTRACTOR — L1-01 embodiment.
// Patent family shared component 4 (lifts AQAL-001, 003, 004).
//
// OWNER-APPROVAL STATUS: this module arrived in an owner-supplied build whose
// header asserts the standing no-voice-tone-analysis decision was reversed in
// writing on 2026-08-30. GATING: it stays UNWIRED — no member audio flows
// through it — until (a) the owner confirms the reversal in the primary build
// channel and (b) the product discloses the analysis overtly wherever it is
// used. This module
// is the in-process, software DSP embodiment. It extracts prosodic and
// spectral features from raw audio WITHOUT sending audio to any third party.
//
// HONEST SCOPE:
// - Pure-software DSP. Decoding webm/m4a/mp3 to PCM requires ffmpeg
//   (fluent-ffmpeg + ffmpeg-static). WAV PCM can be decoded natively.
// - No hardware DSP is claimed here; the patent's DSP co-processor is a
//   hardware embodiment of this same feature set.
// ============================================================

export type VoiceFeatures = {
  pitchMeanHz: number;
  pitchRangeHz: number;
  speakingRateWPM: number;
  pauseCount: number;
  avgPauseDurationMs: number;
  hesitationFrequency: number; // fillers per minute
  jitter: number;              // cycle-to-cycle pitch variation (0..1)
  shimmer: number;             // cycle-to-cycle amplitude variation (dB)
  spectralCentroidMean: number;// Hz
  rmsEnergyMean: number;       // 0..1
  confidenceIndex: number;     // derived 0..1
  arousalIndex: number;        // derived 0..1
};

// ---- Decode any supported audio container to 16 kHz mono Float32 PCM. ----
export async function decodeToPcm(buffer: Buffer, mimeOrExt: string): Promise<{ pcm: Float32Array; sampleRate: number }> {
  // WAV: parse natively. Others: shell out to ffmpeg if available.
  if (/wav/i.test(mimeOrExt)) {
    return decodeWav(buffer);
  }
  const { execFile } = await import("child_process");
  const { promisify } = await import("util");
  const run = promisify(execFile);
  const os = await import("os");
  const path = await import("path");
  const fs = await import("fs");
  const tmpIn = path.join(os.tmpdir(), `aqal_in_${Date.now()}`);
  const tmpOut = path.join(os.tmpdir(), `aqal_out_${Date.now()}.wav`);
  fs.writeFileSync(tmpIn, buffer);
  try {
    await run("ffmpeg", ["-y", "-i", tmpIn, "-ac", "1", "-ar", "16000", "-f", "wav", tmpOut]);
    const wav = fs.readFileSync(tmpOut);
    return decodeWav(wav);
  } finally {
    try { fs.unlinkSync(tmpIn); } catch {}
    try { fs.unlinkSync(tmpOut); } catch {}
  }
}

function decodeWav(buf: Buffer): { pcm: Float32Array; sampleRate: number } {
  // Minimal PCM WAV parser (16-bit). Assumes canonical 44-byte header.
  const sampleRate = buf.readUInt32LE(24);
  const dataOffset = 44;
  const n = Math.floor((buf.length - dataOffset) / 2);
  const pcm = new Float32Array(n);
  for (let i = 0; i < n; i++) pcm[i] = buf.readInt16LE(dataOffset + i * 2) / 32768;
  return { pcm, sampleRate };
}

// ---- Core feature extraction over PCM frames. ----
export async function extractVoiceFeatures(pcm: Float32Array, sampleRate: number, transcript?: string): Promise<VoiceFeatures> {
  const frameSize = Math.floor(sampleRate * 0.02); // 20 ms frames (energy/spectral)
  const hop = Math.floor(sampleRate * 0.01);       // 10 ms hop
  const frames: Float32Array[] = [];
  for (let start = 0; start + frameSize <= pcm.length; start += hop) {
    frames.push(pcm.subarray(start, start + frameSize));
  }
  const rms = frames.map(rmsOf);
  // Pitch needs LONGER frames than energy analysis: a 50 Hz fundamental has a
  // 20 ms period, so the YIN lag search requires ~50 ms of context to leave a
  // meaningful comparison window at the largest lag.
  const pitchFrameSize = Math.floor(sampleRate * 0.05);
  const pitches: number[] = [];
  for (let start = 0; start + pitchFrameSize <= pcm.length; start += hop) {
    pitches.push(yinPitch(pcm.subarray(start, start + pitchFrameSize), sampleRate));
  }
  const voiced = pitches.filter((p) => p > 0);

  // Energy / RMS
  const rmsEnergyMean = rms.reduce((a, b) => a + b, 0) / Math.max(1, rms.length);

  // Pitch stats (voiced frames only)
  const pitchMeanHz = voiced.length ? voiced.reduce((a, b) => a + b, 0) / voiced.length : 0;
  const pitchRangeHz = voiced.length ? Math.max(...voiced) - Math.min(...voiced) : 0;

  // Jitter & shimmer (cycle-to-cycle on voiced frames)
  const jitter = voiced.length > 1 ? meanAbsDiff(voiced) / (pitchMeanHz || 1) : 0;
  const shimmer = rms.length > 1 ? meanAbsDiff(rms) / (rmsEnergyMean || 1) : 0;

  // Spectral centroid (mean over frames)
  const spectralCentroidMean = frames.reduce((a, f) => a + spectralCentroid(f, sampleRate), 0) / Math.max(1, frames.length);

  // Voice-activity detection -> pauses
  const voicedMask = rms.map((e) => e > 0.01);
  const { pauseCount, avgPauseDurationMs, voicedMs } = pausesFromMask(voicedMask, hop, sampleRate);

  // Speaking rate from transcript word count over voiced time
  const words = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const speakingRateWPM = voicedMs > 0 ? (words / (voicedMs / 60000)) : 0;

  // Hesitation: filler words per minute + long intra-utterance pauses
  const fillers = transcript ? (transcript.match(/\b(um|uh|er|ah|like|you know)\b/gi) || []).length : 0;
  const totalMs = (pcm.length / sampleRate) * 1000;
  const hesitationFrequency = totalMs > 0 ? fillers / (totalMs / 60000) : 0;

  // Derived indices
  const pauseRatio = totalMs > 0 ? (pauseCount * avgPauseDurationMs) / totalMs : 0;
  const confidenceIndex = clamp01(0.4 * (1 - clamp01(jitter)) + 0.3 * (1 - clamp01(shimmer)) + 0.3 * (1 - clamp01(pauseRatio)));
  const arousalIndex = clamp01(rmsEnergyMean * 1.5 + pitchRangeHz / 300);

  return {
    pitchMeanHz, pitchRangeHz, speakingRateWPM, pauseCount, avgPauseDurationMs,
    hesitationFrequency, jitter, shimmer, spectralCentroidMean, rmsEnergyMean,
    confidenceIndex, arousalIndex,
  };
}

// ---- One-call pipeline: buffer -> features, ready to persist. ----
export async function processAudioForVoiceFeatures(
  audioBuffer: Buffer,
  mimeOrExt: string,
  transcript?: string,
): Promise<VoiceFeatures> {
  const { pcm, sampleRate } = await decodeToPcm(audioBuffer, mimeOrExt);
  return extractVoiceFeatures(pcm, sampleRate, transcript);
}

// ============================ helpers ============================
function rmsOf(frame: Float32Array): number {
  let s = 0;
  for (let i = 0; i < frame.length; i++) s += frame[i] * frame[i];
  return Math.sqrt(s / frame.length);
}
function meanAbsDiff(arr: number[] | Float32Array): number {
  let s = 0;
  for (let i = 1; i < arr.length; i++) s += Math.abs(arr[i] - arr[i - 1]);
  return s / Math.max(1, arr.length - 1);
}
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

// YIN-inspired autocorrelation pitch estimate. Returns Hz, or 0 if unvoiced.
function yinPitch(frame: Float32Array, sampleRate: number): number {
  const minF = 50, maxF = 500;
  // Energy gate first: silent frames are unvoiced, full stop. (Without this,
  // an all-zero frame has zero difference at every lag and "detects" a pitch.)
  let energy = 0;
  for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
  if (energy / frame.length < 1e-4) return 0;

  const minTau = Math.floor(sampleRate / maxF);
  // Never let the lag search eat the whole frame: cap at half the frame so
  // the fixed comparison window keeps at least half the samples.
  const maxTau = Math.min(Math.floor(sampleRate / minF), Math.floor(frame.length / 2));
  if (maxTau <= minTau) return 0;

  // Difference function over a FIXED window so values are comparable across
  // lags (a shrinking window systematically favors the largest lag — the
  // subharmonic bug this replaces).
  const window = frame.length - maxTau;
  const diff = new Float64Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const d = frame[i] - frame[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Cumulative-mean-normalized difference (the actual YIN estimator), then
  // take the FIRST lag under threshold — not the global minimum, which lands
  // on period multiples (octave/subharmonic errors).
  const cmnd = new Float64Array(maxTau + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += diff[tau];
    cmnd[tau] = running > 0 ? (diff[tau] * tau) / running : 1;
  }
  const THRESHOLD = 0.15;
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (cmnd[t] < THRESHOLD) {
      while (t + 1 <= maxTau && cmnd[t + 1] < cmnd[t]) t++; // descend to the local minimum
      tau = t;
      break;
    }
  }
  if (tau === -1) return 0; // no clear periodicity → unvoiced
  return sampleRate / tau;
}

// Naive spectral centroid via DFT magnitude (frame is small: 20 ms).
function spectralCentroid(frame: Float32Array, sampleRate: number): number {
  const N = frame.length;
  let num = 0, den = 0;
  for (let k = 0; k < N / 2; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const ang = (2 * Math.PI * k * n) / N;
      re += frame[n] * Math.cos(ang);
      im -= frame[n] * Math.sin(ang);
    }
    const mag = Math.sqrt(re * re + im * im);
    const freq = (k * sampleRate) / N;
    num += freq * mag;
    den += mag;
  }
  return den > 0 ? num / den : 0;
}

function pausesFromMask(voiced: boolean[], hop: number, sampleRate: number): { pauseCount: number; avgPauseDurationMs: number; voicedMs: number } {
  const frameMs = (hop / sampleRate) * 1000;
  let pauseCount = 0, pauseTotal = 0, run = 0, voicedFrames = 0;
  for (const v of voiced) {
    if (v) {
      if (run * frameMs > 250) { pauseCount++; pauseTotal += run * frameMs; }
      run = 0; voicedFrames++;
    } else run++;
  }
  if (run * frameMs > 250) { pauseCount++; pauseTotal += run * frameMs; }
  return {
    pauseCount,
    avgPauseDurationMs: pauseCount ? pauseTotal / pauseCount : 0,
    voicedMs: voicedFrames * frameMs,
  };
}

// ---- Persist extracted features and mirror the headline metrics onto the NLP profile. ----
export async function saveVoiceFeatures(
  userId: number,
  features: VoiceFeatures,
  opts?: { assessmentId?: number; responseId?: number },
): Promise<number | null> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return null;
  const { voiceFeatures } = await import("../../drizzle/schema");
  try {
    const res = await db.insert(voiceFeatures).values({
      userId,
      assessmentId: opts?.assessmentId ?? null,
      responseId: opts?.responseId ?? null,
      pitchMeanHz: features.pitchMeanHz,
      pitchRangeHz: features.pitchRangeHz,
      speakingRateWPM: features.speakingRateWPM,
      pauseCount: features.pauseCount,
      avgPauseDurationMs: features.avgPauseDurationMs,
      hesitationFrequency: features.hesitationFrequency,
      jitter: features.jitter,
      shimmer: features.shimmer,
      spectralCentroidMean: features.spectralCentroidMean,
      rmsEnergyMean: features.rmsEnergyMean,
      confidenceIndex: features.confidenceIndex,
      arousalIndex: features.arousalIndex,
    });
    // Commit to the tamper-evident ledger so the voice record is provable.
    const { appendLedgerEntry } = await import("./ledger");
    await appendLedgerEntry("score", { kind: "voice_features", userId, confidenceIndex: features.confidenceIndex, arousalIndex: features.arousalIndex });
    return (res as unknown as [{ insertId?: number }])[0]?.insertId ?? null;
  } catch (error) {
    console.warn("[voiceFeatures] save failed:", String(error).slice(0, 200));
    return null;
  }
}
