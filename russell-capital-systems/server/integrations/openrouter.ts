/**
 * OpenRouter Universal Model Router — X30 Standing Order
 * 
 * STANDING ORDER: All future LLM calls SHOULD route through OpenRouterBus
 * when optimal model selection, cost optimization, or fallback routing is needed.
 * 
 * Architecture: OpenAI-compatible API with 400+ models, auto-fallbacks,
 * provider routing, and cost optimization. Mem0Bus context auto-injected.
 * 
 * Model routing strategy:
 *   - DrBuddy (medical reasoning) → anthropic/claude-sonnet-4 (highest accuracy)
 *   - Russell Capital (quant/analysis) → x-ai/grok-3 (fast reasoning)
 *   - Church (theological/uncensored) → meta-llama/llama-4-maverick (open, uncensored)
 *   - EduGenius (education) → google/gemini-2.5-flash (fast, cheap)
 *   - Default → anthropic/claude-sonnet-4. Never "auto": OpenRouter's router
 *     can land on a China-linked model, which the owner's rule forbids.
 *
 * Every model id sent — routed, caller-supplied, or in a fallback list — and
 * every model that answers is checked against the firm's China ban
 * (shared/aiProviders.ts); a banned id is refused before the request leaves.
 * 
 * Python parity: This mirrors openrouter_bus.py in the Python stack.
 * Both use the same API key and routing strategy.
 */

import { invokeLLM, type Message, type Role } from "../_core/llm";
import { Mem0Bus, type ProjectNamespace } from "./mem0";
import { ChinaPolicyError, assertModelAllowed, isBannedModel, isBannedProvider } from "@shared/aiProviders";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// ─── MODEL ROUTING TABLE (per-project optimal model selection) ───────────────
export const MODEL_ROUTES: Record<ProjectNamespace, string> = {
  root: "anthropic/claude-sonnet-4",
  dr_buddy: "anthropic/claude-sonnet-4",
  russell_capital: "x-ai/grok-3",
  church: "meta-llama/llama-4-maverick",
  weight_loss: "anthropic/claude-sonnet-4",
  edu_genius: "google/gemini-2.5-flash",
  med_freedom: "anthropic/claude-sonnet-4",
  genome: "x-ai/grok-3",
} as const;

// ─── FALLBACK CHAIN (if primary model fails, try these in order) ─────────────
export const FALLBACK_CHAINS: Record<string, string[]> = {
  "anthropic/claude-sonnet-4": ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "google/gemini-2.5-flash"],
  "x-ai/grok-3": ["x-ai/grok-3-mini", "openai/gpt-4o", "google/gemini-2.5-flash"],
  "meta-llama/llama-4-maverick": ["meta-llama/llama-3.3-70b-instruct", "openai/gpt-4o"],
  "google/gemini-2.5-flash": ["openai/gpt-4o-mini", "anthropic/claude-3.5-haiku"],
  default: ["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "google/gemini-2.5-flash"],
};

// ─── INTERFACES ──────────────────────────────────────────────────────────────
export interface OpenRouterMessage {
  role: Role;
  content: string;
}

export interface OpenRouterOptions {
  messages: OpenRouterMessage[];
  model?: string;
  project?: ProjectNamespace;
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
  /** If true, auto-inject Mem0 context before the call */
  injectMem0Context?: boolean;
  /** If true, store the result back in Mem0 after completion */
  persistToMem0?: boolean;
  /** Provider preferences for routing */
  providerPreferences?: {
    allow_fallbacks?: boolean;
    require_parameters?: boolean;
    data_collection?: "allow" | "deny";
    order?: string[];
    ignore?: string[];
  };
  /** Model fallback list */
  models?: string[];
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** OpenRouter-specific: which provider actually served the request */
  provider?: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture?: {
    modality: string;
    tokenizer: string;
  };
}

// ─── OPENROUTER BUS CLASS (SINGLE CENTRALIZED GATEWAY) ──────────────────────
/**
 * OpenRouterBus — Universal model router with Mem0 context injection.
 * 
 * Standing Order: Route through this when you need:
 *   - Optimal model selection per project domain
 *   - Auto-fallbacks across providers
 *   - Cost optimization
 *   - Mem0 context injection (persistent memory → LLM context)
 * 
 * For simple internal calls, invokeLLM() is still valid.
 * OpenRouterBus is for when you need the BEST model for the job.
 */
export class OpenRouterBus {
  private static instance: OpenRouterBus | null = null;
  private baseUrl: string;
  private callCount: number = 0;
  private totalTokens: number = 0;

  private constructor() {
    this.baseUrl = OPENROUTER_BASE_URL;
  }

  /** Singleton — one router per process */
  static getInstance(): OpenRouterBus {
    if (!OpenRouterBus.instance) {
      OpenRouterBus.instance = new OpenRouterBus();
    }
    return OpenRouterBus.instance;
  }

  /** Reset singleton (for testing only) */
  static resetInstance(): void {
    OpenRouterBus.instance = null;
  }

  private getApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY not configured");
    return key;
  }

  // ─── CORE CHAT COMPLETION ──────────────────────────────────────────────────

  /**
   * Send a chat completion request to OpenRouter.
   * Auto-selects model based on project namespace if not specified.
   * Optionally injects Mem0 context and persists results.
   */
  async chat(options: OpenRouterOptions): Promise<OpenRouterResponse> {
    const {
      messages,
      model,
      project = "root",
      temperature,
      max_tokens,
      response_format,
      injectMem0Context = false,
      persistToMem0 = false,
      providerPreferences,
      models,
    } = options;

    // 1. Resolve model from routing table if not specified
    const resolvedModel = model || MODEL_ROUTES[project] || MODEL_ROUTES.root;

    // Owner's rule: no China-linked model, named or as a fallback, and no
    // China-linked upstream host in the routing preferences.
    assertModelAllowed(resolvedModel);
    for (const m of models ?? []) assertModelAllowed(m, "fallback model");
    for (const p of providerPreferences?.order ?? []) {
      if (isBannedProvider(p)) throw new ChinaPolicyError(p, "provider order");
    }

    // 2. Optionally inject Mem0 context
    let enrichedMessages = [...messages];
    if (injectMem0Context) {
      try {
        const mem0 = Mem0Bus.getInstance();
        const userContent = messages
          .filter(m => m.role === "user")
          .map(m => m.content)
          .join(" ");

        if (userContent) {
          const memories = await mem0.search(userContent, project, 8);
          if (memories.length > 0) {
            const context = memories.map(m => m.memory).join("\n");
            enrichedMessages = [
              {
                role: "system" as Role,
                content: `[Mem0Bus Persistent Context — ${project}]\n${context}\n[End Mem0 Context]`,
              },
              ...enrichedMessages,
            ];
            console.log(`🔄 [OpenRouterBus] Injected ${memories.length} Mem0 memories for ${project}`);
          }
        }
      } catch (error) {
        // Mem0 injection is best-effort — don't block the LLM call
        console.warn("[OpenRouterBus] Mem0 context injection failed:", error);
      }
    }

    // 3. Build request body
    const body: Record<string, unknown> = {
      model: resolvedModel,
      messages: enrichedMessages,
    };

    if (temperature !== undefined) body.temperature = temperature;
    if (max_tokens !== undefined) body.max_tokens = max_tokens;
    if (response_format) body.response_format = response_format;
    if (providerPreferences) body.provider = providerPreferences;
    if (models && models.length > 0) body.models = models;

    // 4. Execute with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for complex models

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.getApiKey()}`,
          "HTTP-Referer": "https://russellcapitalsystems.com",
          "X-Title": "Russell Capital Solutions",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const result = await response.json() as OpenRouterResponse;
      if (isBannedModel(result.model)) throw new ChinaPolicyError(result.model, "answering model");

      // Track usage
      this.callCount++;
      if (result.usage) {
        this.totalTokens += result.usage.total_tokens;
      }

      console.log(`✅ [OpenRouterBus] ${resolvedModel} → ${result.model || "completed"} (${result.usage?.total_tokens || "?"} tokens)`);

      // 5. Optionally persist result to Mem0
      if (persistToMem0 && result.choices?.[0]?.message?.content) {
        try {
          const mem0 = Mem0Bus.getInstance();
          await mem0.add(
            [
              { role: "user", content: messages[messages.length - 1]?.content || "" },
              { role: "assistant", content: result.choices[0].message.content },
            ],
            project,
            { source: "openrouter", model: result.model }
          );
        } catch (error) {
          console.warn("[OpenRouterBus] Mem0 persist failed:", error);
        }
      }

      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ─── CHAT WITH FALLBACK ────────────────────────────────────────────────────

  /**
   * Chat with automatic fallback chain.
   * If the primary model fails, tries each fallback in order.
   * If all OpenRouter models fail, falls back to built-in LLM.
   */
  async chatWithFallback(options: OpenRouterOptions): Promise<OpenRouterResponse> {
    const project = options.project || "root";
    const primaryModel = options.model || MODEL_ROUTES[project] || MODEL_ROUTES.root;
    // A banned id is refused outright, not quietly swapped for a fallback.
    assertModelAllowed(primaryModel);
    const fallbacks = FALLBACK_CHAINS[primaryModel] || FALLBACK_CHAINS.default;

    // Try primary model
    try {
      return await this.chat({ ...options, model: primaryModel });
    } catch (primaryError) {
      console.warn(`[OpenRouterBus] Primary model ${primaryModel} failed:`, primaryError);
    }

    // Try fallback chain
    for (const fallbackModel of fallbacks) {
      try {
        console.log(`🔄 [OpenRouterBus] Trying fallback: ${fallbackModel}`);
        return await this.chat({ ...options, model: fallbackModel });
      } catch (fallbackError) {
        console.warn(`[OpenRouterBus] Fallback ${fallbackModel} failed:`, fallbackError);
      }
    }

    // Ultimate fallback: the Brain Hub chain
    console.warn("[OpenRouterBus] All OpenRouter models failed, falling back to the Brain Hub chain");
    const builtInResult = await invokeLLM({
      messages: options.messages as Message[],
      max_tokens: options.max_tokens,
      response_format: options.response_format,
    });

    // Wrap in OpenRouter response format
    const fallbackContent = builtInResult.choices?.[0]?.message?.content;
    const contentStr = typeof fallbackContent === "string"
      ? fallbackContent
      : Array.isArray(fallbackContent)
        ? fallbackContent.map((c: any) => c.text || "").join("")
        : "";

    return {
      id: `fallback-${Date.now()}`,
      model: builtInResult.model,
      choices: [{
        index: 0,
        message: { role: "assistant", content: contentStr },
        finish_reason: builtInResult.choices?.[0]?.finish_reason || "stop",
      }],
      usage: builtInResult.usage,
      provider: "brain-hub",
    };
  }

  // ─── MODEL DISCOVERY ───────────────────────────────────────────────────────

  /**
   * List available models from OpenRouter.
   */
  async listModels(): Promise<OpenRouterModel[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { "Authorization": `Bearer ${this.getApiKey()}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenRouter models API error: ${response.status}`);
      }

      const data = await response.json() as { data: OpenRouterModel[] };
      // The catalogue carries China-linked models; none is offered here.
      return (data.data || []).filter(
        m => !isBannedModel(m.id) && !isBannedProvider(m.name) && !isBannedProvider(m.architecture?.tokenizer),
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get current credit balance / usage limits.
   */
  async getCredits(): Promise<{ total: number; used: number; remaining: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: { "Authorization": `Bearer ${this.getApiKey()}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenRouter auth API error: ${response.status}`);
      }

      const data = await response.json() as { data: { usage: number; limit: number | null } };
      const used = data.data?.usage || 0;
      const limit = data.data?.limit || 0;
      return {
        total: limit,
        used,
        remaining: limit > 0 ? limit - used : Infinity,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ─── CONVENIENCE METHODS (domain-specific routing) ─────────────────────────

  /**
   * DrBuddy medical reasoning — routes to Claude with Mem0 context.
   */
  async drBuddyChat(
    messages: OpenRouterMessage[],
    options?: Partial<OpenRouterOptions>
  ): Promise<OpenRouterResponse> {
    return this.chatWithFallback({
      messages,
      project: "dr_buddy",
      injectMem0Context: true,
      persistToMem0: true,
      temperature: 0.3, // Low temp for medical accuracy
      ...options,
    });
  }

  /**
   * Russell Capital analysis — routes to Grok with Mem0 context.
   */
  async russellCapitalChat(
    messages: OpenRouterMessage[],
    options?: Partial<OpenRouterOptions>
  ): Promise<OpenRouterResponse> {
    return this.chatWithFallback({
      messages,
      project: "russell_capital",
      injectMem0Context: true,
      persistToMem0: true,
      temperature: 0.5,
      ...options,
    });
  }

  /**
   * Church theological/consciousness — routes to uncensored models.
   */
  async churchChat(
    messages: OpenRouterMessage[],
    options?: Partial<OpenRouterOptions>
  ): Promise<OpenRouterResponse> {
    return this.chatWithFallback({
      messages,
      project: "church",
      injectMem0Context: true,
      persistToMem0: true,
      temperature: 0.7, // Higher creativity for theological exploration
      ...options,
    });
  }

  /**
   * Genome scoring — routes to Grok for pattern detection.
   */
  async genomeChat(
    messages: OpenRouterMessage[],
    options?: Partial<OpenRouterOptions>
  ): Promise<OpenRouterResponse> {
    return this.chatWithFallback({
      messages,
      project: "genome",
      injectMem0Context: true,
      persistToMem0: true,
      temperature: 0.4,
      ...options,
    });
  }

  /**
   * EduGenius — routes to Gemini Flash for speed + cost.
   */
  async eduGeniusChat(
    messages: OpenRouterMessage[],
    options?: Partial<OpenRouterOptions>
  ): Promise<OpenRouterResponse> {
    return this.chatWithFallback({
      messages,
      project: "edu_genius",
      injectMem0Context: true,
      persistToMem0: false, // EduGenius has its own persistence
      temperature: 0.6,
      ...options,
    });
  }

  // ─── STATS & MONITORING ────────────────────────────────────────────────────

  /**
   * Get session stats for monitoring.
   */
  getStats(): { callCount: number; totalTokens: number } {
    return { callCount: this.callCount, totalTokens: this.totalTokens };
  }

  /**
   * Reset session stats.
   */
  resetStats(): void {
    this.callCount = 0;
    this.totalTokens = 0;
  }

  /**
   * Validate the OpenRouter API key.
   */
  async validate(): Promise<boolean> {
    try {
      const credits = await this.getCredits();
      return credits.remaining > 0 || credits.remaining === Infinity;
    } catch {
      return false;
    }
  }
}

// ─── BACKWARD-COMPATIBLE EXPORTS (convenience functions) ─────────────────────
const bus = () => OpenRouterBus.getInstance();

export const openRouterChat = (options: OpenRouterOptions) => bus().chat(options);
export const openRouterChatWithFallback = (options: OpenRouterOptions) => bus().chatWithFallback(options);
export const openRouterListModels = () => bus().listModels();
export const openRouterGetCredits = () => bus().getCredits();
export const openRouterValidate = () => bus().validate();

/**
 * invokeOpenRouter — Drop-in replacement for invokeGrok/invokeLLM.
 * Uses project-aware routing with automatic fallbacks.
 */
export async function invokeOpenRouter(options: {
  messages: Array<{ role: Role; content: string }>;
  model?: string;
  project?: ProjectNamespace;
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
  injectMem0Context?: boolean;
  persistToMem0?: boolean;
}): Promise<any> {
  return bus().chatWithFallback(options);
}

/**
 * invokeOpenRouterWithFallback — Same as invokeOpenRouter but explicit name.
 * Falls back through OpenRouter models → built-in LLM.
 */
export const invokeOpenRouterWithFallback = invokeOpenRouter;
