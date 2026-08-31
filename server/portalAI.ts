import { invokeLLM, type InvokeParams } from "./_core/llm";

export type PortalAIOptions = {
  operation: string;
  timeoutMs?: number;
};

export type PortalAIResult = {
  content: string;
  model: string;
};

const DEFAULT_TIMEOUT_MS = 45_000;

export async function invokePortalAI(
  params: InvokeParams,
  options: PortalAIOptions,
): Promise<PortalAIResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("PORTAL_AI_TIMEOUT")), timeoutMs);
    });
    const response = await Promise.race([invokeLLM(params), timeout]);
    const raw = response.choices[0]?.message?.content;
    const content = typeof raw === "string"
      ? raw.trim()
      : Array.isArray(raw)
        ? raw.filter(part => part.type === "text").map(part => part.text).join("\n").trim()
        : "";

    if (!content) throw new Error("PORTAL_AI_EMPTY_RESPONSE");
    return { content, model: response.model };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    console.error(`[PortalAI] ${options.operation} failed`, {
      reason: reason.startsWith("LLM invoke failed") ? "upstream_request_failed" : reason,
    });
    if (reason === "PORTAL_AI_TIMEOUT") {
      throw new Error("The AI service timed out. Your saved data was not changed; please retry.");
    }
    throw new Error("The AI service is temporarily unavailable. Your saved data was not changed; please retry.");
  } finally {
    if (timer) clearTimeout(timer);
  }
}
