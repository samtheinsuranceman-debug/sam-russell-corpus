import { ChinaPolicyError, assertModelAllowed, isBannedModel } from "@shared/aiProviders";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

/**
 * Every invokeLLM call is answered by the Brain Hub chain (server/providerRegistry.ts).
 * There is no hosted gateway: the platform talks only to the providers the owner
 * has keyed in the vault or the host environment.
 */
/** Flatten a message to the plain text the Brain Hub chain takes. Images and files cannot travel that path. */
export function messageToChatText(m: Message): { role: "system" | "user" | "assistant"; content: string } {
  const parts = ensureArray(m.content).map(normalizeContentPart);
  const unsupported = parts.find(p => p.type !== "text");
  if (unsupported) throw new Error(`invokeLLM: ${unsupported.type} content is not supported by the Brain Hub chain`);
  const content = parts.map(p => (p as TextContent).text).join("\n");
  const role: "system" | "user" | "assistant" = m.role === "system" || m.role === "assistant" ? m.role : "user";
  return { role, content };
}

/** The instruction that stands in for response_format when the chain answers. */
export function jsonInstructionFor(format: ResponseFormat | undefined): string | null {
  if (!format || format.type === "text") return null;
  if (format.type === "json_object") return "Respond with a single valid JSON object and nothing else: no prose, no code fence.";
  return `Respond with a single valid JSON object and nothing else (no prose, no code fence) that conforms to this JSON schema named "${format.json_schema.name}":\n${JSON.stringify(format.json_schema.schema)}`;
}

/**
 * Answer an invokeLLM request through the Brain Hub chain and hand back the
 * chat-completion result shape the existing call sites expect.
 */
async function invokeViaBrainHub(params: InvokeParams): Promise<InvokeResult> {
  if (params.tools && params.tools.length > 0) {
    throw new Error("invokeLLM: tool calls are not supported by the Brain Hub chain");
  }
  const { completeChat } = await import("../providerRegistry");
  const messages = params.messages.map(messageToChatText);
  const format = normalizeResponseFormat({
    responseFormat: params.responseFormat,
    response_format: params.response_format,
    outputSchema: params.outputSchema,
    output_schema: params.output_schema,
  });
  const instruction = jsonInstructionFor(format ?? undefined);
  if (instruction) messages.unshift({ role: "system", content: instruction });
  const res = await completeChat({ messages, maxTokens: params.max_tokens ?? params.maxTokens });
  return {
    id: `brain-${Date.now().toString(36)}`,
    created: Math.floor(Date.now() / 1000),
    model: `${res.providerId}/${res.model}`,
    choices: [{ index: 0, message: { role: "assistant", content: res.text }, finish_reason: "stop" }],
  };
}

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  // Owner's rule: a caller cannot name a China-linked model.
  assertModelAllowed(params.model);
  const result = await invokeViaBrainHub(params);
  if (isBannedModel(result.model)) throw new ChinaPolicyError(result.model, "answering model");
  return result;
}
