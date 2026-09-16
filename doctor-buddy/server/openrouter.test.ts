import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock Mem0Bus
vi.mock("./mem0", () => ({
  Mem0Bus: {
    getInstance: () => ({
      search: vi.fn().mockResolvedValue([
        { id: "mem-1", memory: "Samuel is vegetarian", score: 0.95, user_id: "samuel_a_dr_buddy" },
        { id: "mem-2", memory: "MTHFR variant detected", score: 0.88, user_id: "samuel_a_dr_buddy" },
      ]),
      add: vi.fn().mockResolvedValue({ results: [{ id: "new-1", memory: "stored", event: "ADD" }] }),
    }),
  },
  PROJECT_IDS: {
    root: "samuel_a_2026",
    dr_buddy: "samuel_a_dr_buddy",
    russell_capital: "samuel_a_russell_capital",
    church: "samuel_a_church_morphic",
    weight_loss: "samuel_a_weight_loss_genome",
    edu_genius: "samuel_a_edu_genius",
    med_freedom: "samuel_a_med_freedom",
    genome: "samuel_a_genome_scoring",
  },
}));

// Mock _core/llm
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "fallback-123",
    created: Date.now(),
    model: "gemini-2.5-flash",
    choices: [{
      index: 0,
      message: { role: "assistant", content: "Fallback response" },
      finish_reason: "stop",
    }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  }),
}));

import {
  OpenRouterBus,
  MODEL_ROUTES,
  FALLBACK_CHAINS,
  openRouterChat,
  openRouterChatWithFallback,
  openRouterListModels,
  openRouterGetCredits,
  openRouterValidate,
  invokeOpenRouter,
} from "./openrouter";

describe("OpenRouter Module", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-v1-test-key-12345");
    OpenRouterBus.resetInstance();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ─── MODEL ROUTING TABLE ────────────────────────────────────────────────────
  describe("MODEL_ROUTES", () => {
    it("maps all 8 project namespaces to models", () => {
      expect(Object.keys(MODEL_ROUTES)).toHaveLength(8);
      expect(MODEL_ROUTES.dr_buddy).toBe("anthropic/claude-sonnet-4");
      expect(MODEL_ROUTES.russell_capital).toBe("x-ai/grok-3");
      expect(MODEL_ROUTES.church).toBe("meta-llama/llama-4-maverick");
      expect(MODEL_ROUTES.edu_genius).toBe("google/gemini-2.5-flash");
      expect(MODEL_ROUTES.genome).toBe("x-ai/grok-3");
      expect(MODEL_ROUTES.root).toBe("auto");
      expect(MODEL_ROUTES.weight_loss).toBe("anthropic/claude-sonnet-4");
      expect(MODEL_ROUTES.med_freedom).toBe("anthropic/claude-sonnet-4");
    });
  });

  describe("FALLBACK_CHAINS", () => {
    it("provides fallback chains for all primary models", () => {
      expect(FALLBACK_CHAINS["anthropic/claude-sonnet-4"]).toContain("openai/gpt-4o");
      expect(FALLBACK_CHAINS["x-ai/grok-3"]).toContain("x-ai/grok-3-mini");
      expect(FALLBACK_CHAINS["meta-llama/llama-4-maverick"]).toBeDefined();
      expect(FALLBACK_CHAINS["google/gemini-2.5-flash"]).toBeDefined();
      expect(FALLBACK_CHAINS["auto"]).toBeDefined();
    });

    it("each chain has at least 2 fallbacks", () => {
      for (const [, chain] of Object.entries(FALLBACK_CHAINS)) {
        expect(chain.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ─── SINGLETON PATTERN ──────────────────────────────────────────────────────
  describe("OpenRouterBus Singleton", () => {
    it("returns the same instance", () => {
      const a = OpenRouterBus.getInstance();
      const b = OpenRouterBus.getInstance();
      expect(a).toBe(b);
    });

    it("creates new instance after reset", () => {
      const a = OpenRouterBus.getInstance();
      OpenRouterBus.resetInstance();
      const b = OpenRouterBus.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ─── API KEY VALIDATION ─────────────────────────────────────────────────────
  describe("API Key Handling", () => {
    it("throws when OPENROUTER_API_KEY is not set", async () => {
      vi.stubEnv("OPENROUTER_API_KEY", "");
      OpenRouterBus.resetInstance();
      const bus = OpenRouterBus.getInstance();
      await expect(bus.chat({
        messages: [{ role: "user", content: "test" }],
      })).rejects.toThrow("OPENROUTER_API_KEY not configured");
    });

    it("confirms OPENROUTER_API_KEY env is set with correct prefix", () => {
      const key = process.env.OPENROUTER_API_KEY;
      expect(key).toBeDefined();
      expect(key!.startsWith("sk-or-")).toBe(true);
    });
  });

  // ─── CORE CHAT ──────────────────────────────────────────────────────────────
  describe("chat()", () => {
    it("sends request to OpenRouter with correct headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-123",
          model: "anthropic/claude-sonnet-4",
          choices: [{ index: 0, message: { role: "assistant", content: "Hello" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      const result = await bus.chat({
        messages: [{ role: "user", content: "Hello" }],
        project: "dr_buddy",
      });

      expect(result.choices[0].message.content).toBe("Hello");
      expect(result.model).toBe("anthropic/claude-sonnet-4");

      // Verify headers
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(opts.headers["Authorization"]).toBe("Bearer sk-or-v1-test-key-12345");
      expect(opts.headers["HTTP-Referer"]).toBe("https://drbuddy.xyz");
      expect(opts.headers["X-Title"]).toBe("Russell Labs Agentic Stack");
    });

    it("auto-selects model based on project namespace", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-456",
          model: "x-ai/grok-3",
          choices: [{ index: 0, message: { role: "assistant", content: "Analysis" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      await bus.chat({
        messages: [{ role: "user", content: "Analyze market" }],
        project: "russell_capital",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("x-ai/grok-3");
    });

    it("uses explicit model when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-789",
          model: "openai/gpt-4o",
          choices: [{ index: 0, message: { role: "assistant", content: "Custom" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      await bus.chat({
        messages: [{ role: "user", content: "test" }],
        project: "dr_buddy",
        model: "openai/gpt-4o", // Override the default Claude
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("openai/gpt-4o");
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      });

      const bus = OpenRouterBus.getInstance();
      await expect(bus.chat({
        messages: [{ role: "user", content: "test" }],
      })).rejects.toThrow("OpenRouter API error 429");
    });

    it("includes temperature and max_tokens when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-temp",
          model: "auto",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      await bus.chat({
        messages: [{ role: "user", content: "test" }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1000);
    });
  });

  // ─── MEM0 CONTEXT INJECTION ─────────────────────────────────────────────────
  describe("Mem0 Context Injection", () => {
    it("injects Mem0 memories as system message when injectMem0Context=true", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-mem0",
          model: "anthropic/claude-sonnet-4",
          choices: [{ index: 0, message: { role: "assistant", content: "With context" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      await bus.chat({
        messages: [{ role: "user", content: "What are my dietary restrictions?" }],
        project: "dr_buddy",
        injectMem0Context: true,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Should have system message with Mem0 context prepended
      expect(body.messages[0].role).toBe("system");
      expect(body.messages[0].content).toContain("Mem0Bus Persistent Context");
      expect(body.messages[0].content).toContain("Samuel is vegetarian");
      expect(body.messages[0].content).toContain("MTHFR variant detected");
      // Original user message should follow
      expect(body.messages[1].content).toBe("What are my dietary restrictions?");
    });

    it("does not inject Mem0 when injectMem0Context=false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-no-mem0",
          model: "auto",
          choices: [{ index: 0, message: { role: "assistant", content: "No context" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      await bus.chat({
        messages: [{ role: "user", content: "Hello" }],
        injectMem0Context: false,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].content).toBe("Hello");
    });
  });

  // ─── FALLBACK CHAIN ─────────────────────────────────────────────────────────
  describe("chatWithFallback()", () => {
    it("tries fallback models when primary fails", async () => {
      // Primary fails
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503, text: async () => "Service unavailable" });
      // First fallback succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-fallback",
          model: "anthropic/claude-3.5-sonnet",
          choices: [{ index: 0, message: { role: "assistant", content: "Fallback worked" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      const result = await bus.chatWithFallback({
        messages: [{ role: "user", content: "test" }],
        project: "dr_buddy",
        injectMem0Context: false,
      });

      expect(result.choices[0].message.content).toBe("Fallback worked");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("falls back to built-in LLM when all OpenRouter models fail", async () => {
      // All calls fail
      mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => "Server error" });

      const bus = OpenRouterBus.getInstance();
      const result = await bus.chatWithFallback({
        messages: [{ role: "user", content: "test" }],
        project: "root",
        injectMem0Context: false,
      });

      // Should get built-in LLM fallback response
      expect(result.model).toBe("built-in-llm");
      expect(result.provider).toBe("manus-built-in");
      expect(result.choices[0].message.content).toBe("Fallback response");
    });
  });

  // ─── MODEL DISCOVERY ────────────────────────────────────────────────────────
  describe("listModels()", () => {
    it("returns available models", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "openai/gpt-4o", name: "GPT-4o", pricing: { prompt: "0.0025", completion: "0.01" }, context_length: 128000 },
            { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", pricing: { prompt: "0.003", completion: "0.015" }, context_length: 200000 },
          ],
        }),
      });

      const bus = OpenRouterBus.getInstance();
      const models = await bus.listModels();

      expect(models).toHaveLength(2);
      expect(models[0].id).toBe("openai/gpt-4o");
      expect(models[1].id).toBe("anthropic/claude-sonnet-4");
    });
  });

  // ─── CREDITS ────────────────────────────────────────────────────────────────
  describe("getCredits()", () => {
    it("returns credit balance", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { usage: 5.50, limit: 100 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      const credits = await bus.getCredits();

      expect(credits.total).toBe(100);
      expect(credits.used).toBe(5.50);
      expect(credits.remaining).toBe(94.50);
    });

    it("returns Infinity remaining when no limit", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { usage: 2.00, limit: null },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      const credits = await bus.getCredits();

      expect(credits.remaining).toBe(Infinity);
    });
  });

  // ─── CONVENIENCE METHODS ────────────────────────────────────────────────────
  describe("Domain-specific convenience methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "gen-conv",
          model: "test-model",
          choices: [{ index: 0, message: { role: "assistant", content: "Response" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });
    });

    it("drBuddyChat uses low temperature for medical accuracy", async () => {
      const bus = OpenRouterBus.getInstance();
      await bus.drBuddyChat([{ role: "user", content: "medical query" }]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.3);
      expect(body.model).toBe("anthropic/claude-sonnet-4");
    });

    it("russellCapitalChat routes to Grok", async () => {
      const bus = OpenRouterBus.getInstance();
      await bus.russellCapitalChat([{ role: "user", content: "market analysis" }]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("x-ai/grok-3");
      expect(body.temperature).toBe(0.5);
    });

    it("churchChat uses higher temperature for creativity", async () => {
      const bus = OpenRouterBus.getInstance();
      await bus.churchChat([{ role: "user", content: "theological exploration" }]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("meta-llama/llama-4-maverick");
      expect(body.temperature).toBe(0.7);
    });

    it("genomeChat routes to Grok for pattern detection", async () => {
      const bus = OpenRouterBus.getInstance();
      await bus.genomeChat([{ role: "user", content: "genome patterns" }]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("x-ai/grok-3");
    });

    it("eduGeniusChat routes to Gemini Flash for speed", async () => {
      const bus = OpenRouterBus.getInstance();
      await bus.eduGeniusChat([{ role: "user", content: "teach me" }]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("google/gemini-2.5-flash");
    });
  });

  // ─── STATS & MONITORING ─────────────────────────────────────────────────────
  describe("Stats tracking", () => {
    it("tracks call count and tokens", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "gen-stats",
          model: "auto",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      await bus.chat({ messages: [{ role: "user", content: "1" }], injectMem0Context: false });
      await bus.chat({ messages: [{ role: "user", content: "2" }], injectMem0Context: false });

      const stats = bus.getStats();
      expect(stats.callCount).toBe(2);
      expect(stats.totalTokens).toBe(60);
    });

    it("resets stats", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-reset",
          model: "auto",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      await bus.chat({ messages: [{ role: "user", content: "test" }], injectMem0Context: false });
      bus.resetStats();

      const stats = bus.getStats();
      expect(stats.callCount).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });
  });

  // ─── VALIDATE ───────────────────────────────────────────────────────────────
  describe("validate()", () => {
    it("returns true when API key is valid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { usage: 5, limit: 100 } }),
      });

      const bus = OpenRouterBus.getInstance();
      const valid = await bus.validate();
      expect(valid).toBe(true);
    });

    it("returns false when API key is invalid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      const bus = OpenRouterBus.getInstance();
      const valid = await bus.validate();
      expect(valid).toBe(false);
    });
  });

  // ─── BACKWARD-COMPATIBLE EXPORTS ───────────────────────────────────────────
  describe("Backward-compatible exports", () => {
    it("openRouterChat calls through singleton", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-compat",
          model: "auto",
          choices: [{ index: 0, message: { role: "assistant", content: "compat" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });

      const result = await openRouterChat({
        messages: [{ role: "user", content: "test" }],
        injectMem0Context: false,
      });
      expect(result.choices[0].message.content).toBe("compat");
    });

    it("invokeOpenRouter works as drop-in replacement", async () => {
      // All OpenRouter calls fail → falls back to built-in
      mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => "error" });

      const result = await invokeOpenRouter({
        messages: [{ role: "user", content: "test" }],
        project: "root",
        injectMem0Context: false,
      });

      expect(result.model).toBe("built-in-llm");
      expect(result.choices[0].message.content).toBe("Fallback response");
    });
  });

  // ─── PROVIDER PREFERENCES ──────────────────────────────────────────────────
  describe("Provider preferences", () => {
    it("passes provider preferences in request body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-prov",
          model: "auto",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });

      const bus = OpenRouterBus.getInstance();
      await bus.chat({
        messages: [{ role: "user", content: "test" }],
        injectMem0Context: false,
        providerPreferences: {
          allow_fallbacks: true,
          data_collection: "deny",
          order: ["Anthropic", "OpenAI"],
        },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.provider).toEqual({
        allow_fallbacks: true,
        data_collection: "deny",
        order: ["Anthropic", "OpenAI"],
      });
    });
  });
});
