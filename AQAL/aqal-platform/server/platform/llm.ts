// ============================================================
// Platform seam — LLM
// ============================================================
// One swappable entry point for chat/completions. Delegates to the configured
// OpenAI-compatible provider (OpenAI, or the legacy Forge gateway) and falls
// back to a deterministic, schema-valid mock when nothing is configured — so
// the assessment → score → profile loop runs with zero credentials.
//
// To add Anthropic (Claude) as a provider: implement an adapter that translates
// InvokeParams → the Messages API and the response → InvokeResult, then select
// it in platform/config.ts. OpenAI is the default because the existing payload
// shape is already OpenAI-compatible.

import { invokeLLM as realInvokeLLM, llmConfigured } from "../_core/llm";
import type { InvokeParams, InvokeResult } from "../_core/llm";
import { mockInvokeLLM } from "./mock";

export type {
  InvokeParams, InvokeResult, Message, Tool, ToolChoice,
  ResponseFormat, OutputSchema, JsonSchema, Role,
} from "../_core/llm";

let warnedMock = false;

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!llmConfigured()) {
    if (!warnedMock) {
      console.warn("[platform/llm] No LLM provider configured — using local mock. Set OPENAI_API_KEY for real scoring.");
      warnedMock = true;
    }
    return mockInvokeLLM(params);
  }
  const result = await realInvokeLLM(params);
  try {
    const { recordUsage, usageFrom } = await import("../costMonitor");
    const u = usageFrom(result);
    void recordUsage({ source: "core", ...u,
      promptChars: JSON.stringify(params.messages ?? "").length,
      completionChars: JSON.stringify(result ?? "").length, context: "core" });
  } catch { /* noop */ }
  return result;
}

export { llmConfigured };
