// ============================================================
// Platform seam — public surface
// ============================================================
// Import external capabilities from here, not from _core/*. Each is backed by a
// configurable provider with a safe fallback (see config.ts). Swapping a
// provider is a change inside this folder; callers never change.

export { invokeLLM, llmConfigured } from "./llm";
export type { InvokeParams, InvokeResult, Message } from "./llm";

export { transcribeAudio } from "./transcribe";
export type { TranscribeOptions, TranscriptionResponse, TranscriptionError } from "./transcribe";

export { storagePut, storageGetSignedUrl, LOCAL_STORAGE_DIR } from "./storage";

export { platformStatus } from "./config";
