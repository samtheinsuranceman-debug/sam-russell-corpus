// ============================================================
// Platform seam — local mocks
// ============================================================
// Deterministic, schema-valid fallbacks used when no real provider is
// configured. They let the whole assessment → score → profile loop run in
// local/dev/CI without any external credentials or network calls.

import type { InvokeParams, InvokeResult } from "../_core/llm";
import type { TranscriptionResponse } from "../_core/voiceTranscription";

type JsonSchemaNode = Record<string, any>;

// Build a minimal, valid instance for an arbitrary JSON Schema node.
// Objects fill every declared property (safe for `strict`/additionalProperties:false);
// arrays honor minItems (default 0); scalars use deterministic placeholders.
function instanceFromSchema(node: JsonSchemaNode | undefined): unknown {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node.enum) && node.enum.length > 0) return node.enum[0];

  const type = Array.isArray(node.type) ? node.type[0] : node.type;
  switch (type) {
    case "object": {
      const out: Record<string, unknown> = {};
      const props = node.properties ?? {};
      for (const key of Object.keys(props)) out[key] = instanceFromSchema(props[key]);
      return out;
    }
    case "array": {
      const min = typeof node.minItems === "number" ? node.minItems : 0;
      const items = node.items;
      return Array.from({ length: min }, () => instanceFromSchema(items));
    }
    case "string":
      return "";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "null":
      return null;
    default:
      // Unknown/oneOf/anyOf — safest valid-ish default.
      return node.properties ? instanceFromSchema({ ...node, type: "object" }) : null;
  }
}

function mockContentFor(params: InvokeParams): string {
  const rf = params.responseFormat || params.response_format;
  const schema =
    (rf && rf.type === "json_schema" && rf.json_schema?.schema) ||
    params.outputSchema?.schema ||
    params.output_schema?.schema;

  if (schema) {
    return JSON.stringify(instanceFromSchema(schema));
  }
  if (rf && rf.type === "json_object") {
    return "{}";
  }
  return "[mock] No LLM provider configured. Set OPENAI_API_KEY to enable real scoring.";
}

export function mockInvokeLLM(params: InvokeParams): InvokeResult {
  const content = mockContentFor(params);
  return {
    id: "mock-" + hashParams(params),
    created: 0,
    model: "mock",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

export function mockTranscription(): TranscriptionResponse {
  return {
    task: "transcribe",
    language: "en",
    duration: 0,
    text: "[mock transcript] Speech-to-text is not configured. Set OPENAI_API_KEY to enable real transcription.",
    segments: [],
  };
}

// Stable id without Date.now()/Math.random() (both unavailable in some contexts).
function hashParams(params: InvokeParams): string {
  let h = 0;
  const s = JSON.stringify(params.messages).slice(0, 500);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}
