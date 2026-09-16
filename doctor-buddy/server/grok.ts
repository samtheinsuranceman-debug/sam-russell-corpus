import { invokeLLM, type Message, type Role } from "./_core/llm";

export interface InvokeOptions {
  messages: Array<{ role: Role; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
}

export async function invokeGrok(options: InvokeOptions): Promise<any> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY environment variable is not set");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: options.model || "grok-3-mini-fast",
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        response_format: options.response_format
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function invokeGrokWithFallback(options: InvokeOptions): Promise<any> {
  try {
    return await invokeGrok(options);
  } catch (error) {
    console.error("Grok API failed, falling back to built-in LLM:", error);
    return await invokeLLM(options);
  }
}
