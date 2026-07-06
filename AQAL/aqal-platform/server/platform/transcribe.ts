// ============================================================
// Platform seam — speech-to-text
// ============================================================
// One swappable entry point for transcription. Delegates to the configured
// Whisper-compatible provider (OpenAI Whisper, or the legacy Forge gateway) and
// falls back to a mock transcript when nothing is configured, so an assessment
// can still be recorded → "transcribed" → scored end to end.
//
// To use Deepgram instead: implement an adapter that posts the audio to
// Deepgram's /v1/listen and maps its response to TranscriptionResponse, then
// select it in platform/config.ts.

import { transcribeAudio as realTranscribe } from "../_core/voiceTranscription";
import type {
  TranscribeOptions, TranscriptionResponse, TranscriptionError,
} from "../_core/voiceTranscription";
import { sttProvider } from "./config";
import { mockTranscription } from "./mock";

export type { TranscribeOptions, TranscriptionResponse, TranscriptionError };

let warnedMock = false;

export async function transcribeAudio(
  options: TranscribeOptions,
): Promise<TranscriptionResponse | TranscriptionError> {
  if (sttProvider() === "mock") {
    if (!warnedMock) {
      console.warn("[platform/transcribe] No STT provider configured — using mock transcript. Set OPENAI_API_KEY for real transcription.");
      warnedMock = true;
    }
    return mockTranscription();
  }
  return realTranscribe(options);
}
