/**
 * The China ban, proved in both directions and enforced on every path.
 *
 * Owner's standing rule: no Chinese AI system, nothing connected to the
 * Chinese government, nothing related to China at all, and Taiwan-based labs
 * treated as suspect. DeepSeek was banned by name on 2026-09-06; the rule was
 * widened twice after that. A pattern that is only declared is a comment, so
 * this file checks three things:
 *
 *   1. BANNED_PROVIDER_PATTERN catches every banned id, name and host it is
 *      meant to, and none of the US/EU names the platform runs on.
 *   2. Every runtime path refuses a banned model id with the firm's sentence —
 *      the adapters, the registry, custom endpoints, invokeLLM, the OpenRouter
 *      bus — including a banned id sent through an aggregator that hosts
 *      Chinese open-weight models.
 *   3. No source file in shared/, server/ or client/src/ wires one in: a banned
 *      model id or provider base URL on a model/provider/endpoint line, or a
 *      banned `vendor/model` id anywhere.
 *   4. Manus (Butterfly Effect) is gone for good: no file in client/ (public
 *      assets included), server/, shared/, scripts/ or the build and package
 *      configuration names it, its Forge gateway, its `__manus__` runtime
 *      folder or its Butterfly Effect hosts, and the gateway variables are not
 *      read anywhere.
 *
 * No test here touches the network.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { extname, resolve } from "path";
import {
  BANNED_PROVIDER_PATTERN,
  CHINA_POLICY_MESSAGE,
  ChinaPolicyError,
  PROVIDERS,
  assertModelAllowed,
  assertProviderAllowed,
  buildCustomProvider,
  getProvider,
  isBannedModel,
  isBannedProvider,
  providerPolicyViolation,
  tryBuildCustomProvider,
  validateCustomEndpoint,
} from "@shared/aiProviders";
import { MODEL_REGISTRY } from "@shared/aiModelRegistry";

// ─── 1. The pattern ──────────────────────────────────────────────────────────

/** Provider ids, names, hosts and model ids that must be refused. */
const MUST_MATCH = [
  // DeepSeek and its derivatives
  "deepseek", "deepseek-chat", "deepseek/deepseek-r1", "DeepSeek-V3", "https://api.deepseek.com", "perplexity/r1-1776", "sonar-reasoning-pro",
  // Moonshot / Kimi
  "moonshot", "moonshotai/kimi-k2", "kimi-k2-0905", "Kimi", "https://api.moonshot.ai/v1",
  // Zhipu / GLM / Z.ai
  "zhipu", "glm-4.5", "GLM-4-Plus", "z-ai/glm-4.6", "THUDM/chatglm3-6b", "chatglm", "zai-org/GLM-4.5", "codegeex4", "cogvlm2",
  "https://open.bigmodel.cn/api/paas/v4", "https://api.z.ai/api/paas/v4", "Z.ai",
  // Alibaba / Qwen
  "qwen", "qwen-max", "qwen/qwen3-235b-a22b", "Qwen/QwQ-32B", "qwq-32b", "qvq-72b-preview", "alibaba", "Alibaba Cloud", "dashscope",
  "tongyi-qianwen", "aliyun", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", "inclusionAI/Ling-lite",
  // MiniMax
  "minimax", "minimax/minimax-m1", "MiniMax-Text-01", "abab6.5s-chat", "https://api.minimax.chat/v1",
  // Baichuan
  "baichuan", "Baichuan4", "baichuan-inc/Baichuan2-13B-Chat",
  // 01.AI / Yi
  "01.ai", "01-ai/yi-large", "yi-large", "yi-lightning", "yi-34b-chat", "yi-1.5-34b", "https://api.01.ai/v1", "https://api.lingyiwanwu.com/v1",
  // Baidu / ERNIE
  "ernie-4.0-8k", "ERNIE-Bot", "baidu", "baidu/ernie-4.5-vl-424b-a47b", "wenxin", "qianfan", "https://qianfan.baidubce.com/v2",
  // Tencent / Hunyuan
  "hunyuan", "hunyuan-turbo", "tencent", "tencent/hunyuan-a13b-instruct", "https://api.hunyuan.cloud.tencent.com/v1",
  // ByteDance / Doubao / Volcengine
  "doubao-1.5-pro-32k", "bytedance", "bytedance/ui-tars-1.5-7b", "ByteDance-Seed/Seed-OSS-36B", "volcengine", "https://ark.cn-beijing.volces.com/api/v3",
  // StepFun
  "stepfun", "stepfun/step-3", "step-1-8k", "step-2-16k", "step-1v-8k", "step-1o-turbo-vision", "step-2-mini", "step3", "https://api.stepfun.com/v1",
  // Shanghai AI Lab
  "internlm", "internlm/internlm3-8b-instruct", "OpenGVLab/InternVL3-78B", "Shanghai AI Lab", "shanghai-ai-lab",
  // SenseTime
  "sensetime", "SenseNova-V6-Pro", "sensechat-5",
  // iFlytek Spark
  "iflytek", "spark-max", "spark-lite", "spark-4.0-ultra", "iflytek/spark-pro", "https://spark-api-open.xf-yun.com/v1",
  // Inspur Yuan
  "inspur", "IEITYuan/Yuan2-M32-hf", "yuan2.0-102b", "Yuan-2.0",
  // Other PRC labs and hosts
  "siliconflow", "https://api.siliconflow.cn/v1", "meituan/longcat-2.0", "xiaomi/mimo-v2.5", "kwaipilot/kat-coder-pro", "openbmb/MiniCPM-V-4",
  "Skywork/Skywork-R1V3", "rednote-hilab/dots.llm1.inst", "dots-studio/dots-3-note-preview", "BAAI/bge-m3", "bge-m3", "huawei/pangu-pro",
  // Arcee models distilled from DeepSeek-V3 or built on Qwen
  "arcee-ai/virtuoso-large", "virtuoso-medium", "arcee-blitz",
  // Manus / Butterfly Effect (China-origin agent platform) and its hosted pieces
  "manus", "Manus", "Manus AI", "https://forge.manus.im", "forge.manus.im/v1/chat/completions", "vite-plugin-manus-runtime",
  "/__manus__/debug-collector.js", "https://forge.butterfly-effect.dev", "3000-abc.us2.manus.computer", "manus-built-in",
  // Chinese image and video models on the media hosts (Replicate, fal)
  "wan-video/wan-2.2", "wan-video/wan-2.2-t2v-fast", "wavespeedai/wan-2.1-t2v-480p", "fal-ai/wan/v2.2-a14b/text-to-video", "fal-ai/wan-i2v",
  "fal-ai/wan-25-preview/text-to-video", "Wan2.1-T2V-14B", "wanx-v1", "qwen/qwen-image", "fal-ai/qwen-image", "tencent/hunyuan-image-3",
  "fal-ai/hunyuan-video", "kwaivgi/kling-v2.1", "fal-ai/kling-video/v2.1/master/text-to-video", "kling2.1", "fal-ai/kolors",
  "bytedance/seedream-4", "fal-ai/bytedance/seedream/v4/text-to-image", "seedance-1-pro", "seededit-3.0", "seedvr2", "fal-ai/dreamina",
  "fal-ai/omnihuman", "fal-ai/bagel", "sdxl-lightning-4step", "fal-ai/hyper-sdxl", "fal-ai/pulid", "minimax/hailuo-02", "fal-ai/hailuo",
  "hidream-ai/hidream-l1", "fal-ai/vidu/q1/text-to-video", "fal-ai/pixverse/v5", "fal-ai/skyreels-i2v", "fal-ai/step1x-edit", "fal-ai/magi",
  "fal-ai/omnigen-v2", "fal-ai/lumina-image/v2", "janus-pro-7b", "fal-ai/janus", "fal-ai/infinitalk", "multitalk", "tencentarc/photomaker",
  "ip-adapter-faceid", "tencentarc/gfpgan", "nightmareai/real-esrgan", "instantx/instantid",
  // Taiwan (suspect)
  "taide/TAIDE-LX-7B", "MediaTek-Research/Breeze-7B-Instruct", "yentinglin/Taiwan-LLM-13B", "foxbrain",
  // Hosts
  "https://api.example.cn", "https://example.cn:443", "https://llm.example.com.cn/v1", "https://ai.example.hk", "https://ai.example.tw/v1",
  "https://bedrock-runtime.cn-north-1.amazonaws.com.cn", "cn-beijing",
  // face-consistency tools (added 23 Sep 2026)
  "bytedance/infiniteyou", "fal-ai/infinite-you", "ali-vilab/ace-plus", "fal-ai/ace++", "fal-ai/uno", "fal-ai/dreamo",
  "tencent/instant-character", "fal-ai/instant-character", "fal-ai/ecomid", "story-diffusion", "consistent-id", "fofr/consistent-character",
  "supir", "insightface/inswapper_128", "antelopev2", "buffalo_l",
];

/** Routers that choose the model after the request leaves: refused as model ids. */
const ROUTER_IDS = ["auto", "auto-tool", "auto-reasoning", "openrouter/auto", "openrouter/free", "openrouter/fusion", "openrouter/pareto-code", "sakana/fugu-ultra"];

/** US/EU/allied names, hosts and model ids the platform runs on: must pass. */
const MUST_NOT_MATCH = [
  "anthropic", "Anthropic", "claude-opus-5", "anthropic/claude-sonnet-4", "https://api.anthropic.com",
  "openai", "OpenAI", "gpt-5", "o3", "openai/gpt-oss-120b", "https://api.openai.com",
  "google", "Google DeepMind (Gemini)", "gemini-2.5-pro", "google/gemini-2.5-flash", "gemma3", "https://generativelanguage.googleapis.com",
  "xai", "xAI (Grok)", "grok-4", "x-ai/grok-3", "https://api.x.ai",
  "perplexity", "Perplexity", "sonar-pro", "sonar", "https://api.perplexity.ai",
  "mistral", "Mistral AI", "mistral-large-latest", "magistral-medium-latest", "mistral-nemo-instruct-2407", "mistralai/Mistral-Small-24B-Instruct",
  "cohere", "Cohere", "command-a-03-2025", "command-r-plus", "https://api.cohere.ai/compatibility",
  "meta-llama", "Meta (Llama API)", "Llama-4-Maverick-17B-128E-Instruct-FP8", "meta-llama/Llama-3.3-70B-Instruct", "meta/muse-spark-1.2", "Meta: Muse Spark 1.2",
  "groq", "Groq", "llama-3.3-70b-versatile", "https://api.groq.com/openai",
  "together", "Together AI", "https://api.together.xyz",
  "fireworks", "Fireworks AI", "accounts/fireworks/models/llama4-maverick-instruct-basic", "https://api.fireworks.ai/inference",
  "venice", "Venice AI", "llama-3.3-70b", "https://api.venice.ai/api",
  "featherless", "Featherless AI", "https://api.featherless.ai",
  "cerebras", "Cerebras", "https://api.cerebras.ai",
  "sambanova", "SambaNova", "deepinfra", "DeepInfra", "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B", "hermes-3-llama-3.1-70b-fp8",
  "openrouter", "OpenRouter", "https://openrouter.ai/api", "vercel-gateway", "amazon.nova-pro-v1:0", "writer", "palmyra-x5", "reka-core",
  "ai21", "jamba-large", "upstage", "solar-pro2", "HCX-007", "plamo-3.0-prime", "sarvam-105b", "Krutrim-spectre-v2", "trinity-large-thinking",
  "inception", "mercury-2", "aleph-alpha", "pharia-1-llm-7b-control", "swiss-ai/apertus-v1.5-70b", "thinkingmachines/inkling", "poolside/laguna-s-2.1",
  // image models the generator runs on (Black Forest Labs, Stability, OpenAI) and IBM's watsonx line-up
  "black-forest-labs/flux-schnell", "black-forest-labs/flux-1.1-pro", "black-forest-labs/flux-kontext-pro", "fal-ai/flux/schnell",
  "fal-ai/flux-pro/v1.1", "fal-ai/flux-pro/kontext", "stability-ai/stable-diffusion-3.5-large", "gpt-image-1", "core", "ultra",
  "ideogram-ai/ideogram-v3-turbo", "recraft-ai/recraft-v3", "google/imagen-4", "luma/photon",
  "ibm/granite-4-h-small", "ibm/granite-3-3-8b-instruct", "meta-llama/llama-3-3-70b-instruct", "mistralai/mistral-medium-2505",
  "https://us-south.ml.cloud.ibm.com", "https://iam.cloud.ibm.com/identity/token", "https://api.replicate.com/v1", "https://fal.run",
  // ordinary words that share letters with a media-model term
  "want", "wants to retire", "swan", "wander", "Wanda", "Klingon", "seed", "seed money", "bagel", "magic", "Lumina", "Janus",
  "power adapter", "instantly", "pulley",
  // ordinary words that share letters with a banned term
  "step-1", "step-3", "step-by-step", "Apache Spark", "sparkline", "structuredNotes", "Bernie", "yuan", "Chinese yuan", "algorithm", "glamour",
  "kimono", "manuscript", "Manuscripts", "forge", "Forge Anchor", "https://www.cnn.com", "https://example.com/cn/", "https://example.co", "https://api.example.com/v1",
  "unobtrusive", "unordered", "insight", "insights", "Instant quote", "instant", "our story", "consistent", "consistently", "ace", "space", "Grace", "superior", "dream",
];

describe("the pattern", () => {
  it.each(MUST_MATCH)("refuses %s", value => {
    expect(isBannedProvider(value)).toBe(true);
    expect(isBannedModel(value)).toBe(true);
  });

  it.each(ROUTER_IDS)("refuses the router pseudo-model %s", value => {
    expect(isBannedModel(value)).toBe(true);
  });

  it.each(MUST_NOT_MATCH)("lets %s through", value => {
    expect(isBannedProvider(value)).toBe(false);
    expect(isBannedModel(value)).toBe(false);
  });

  it("is case-insensitive and null-safe", () => {
    expect(BANNED_PROVIDER_PATTERN.flags).toContain("i");
    expect(isBannedProvider("DEEPSEEK")).toBe(true);
    expect(isBannedProvider(undefined)).toBe(false);
    expect(isBannedProvider(null)).toBe(false);
    expect(isBannedModel("")).toBe(false);
  });

  it("carries the firm's sentence verbatim", () => {
    expect(CHINA_POLICY_MESSAGE).toBe("Blocked by firm policy: no China-linked AI models");
    expect(() => assertModelAllowed("qwen/qwen3-32b")).toThrowError(CHINA_POLICY_MESSAGE);
    expect(() => assertModelAllowed("gpt-5")).not.toThrow();
  });
});

// ─── 2. Enforcement ──────────────────────────────────────────────────────────

describe("the catalogue", () => {
  it("registers no China-linked provider, default model or suggested model", () => {
    for (const p of PROVIDERS) {
      expect(providerPolicyViolation(p), p.id).toBeNull();
      expect(p.country, p.id).not.toMatch(/china|taiwan|hong kong|macau/i);
    }
  });

  it("keeps every aggregator that hosts Chinese open-weight models on non-Chinese defaults", () => {
    for (const id of ["openrouter", "together", "fireworks", "venice", "featherless", "groq", "deepinfra", "huggingface", "wandb", "vultr", "parasail", "edenai", "vercel-gateway", "arcee"]) {
      const p = getProvider(id);
      expect(p, id).toBeDefined();
      expect(isBannedModel(p!.defaultModel), `${id} default ${p!.defaultModel}`).toBe(false);
      for (const m of p!.suggestedModels) expect(isBannedModel(m), `${id} suggests ${m}`).toBe(false);
    }
  });

  it("refuses to register a China-linked provider definition", () => {
    const clean = getProvider("together")!;
    expect(() => assertProviderAllowed(clean)).not.toThrow();
    expect(() => assertProviderAllowed({ ...clean, id: "qwen-direct" })).toThrow(ChinaPolicyError);
    expect(() => assertProviderAllowed({ ...clean, baseUrl: "https://dashscope.aliyuncs.com" })).toThrow(CHINA_POLICY_MESSAGE);
    expect(() => assertProviderAllowed({ ...clean, suggestedModels: [clean.defaultModel, "Qwen/Qwen3-235B-A22B"] })).toThrow(CHINA_POLICY_MESSAGE);
  });

  it("lists no China-linked model on the AI stack panel", () => {
    for (const m of MODEL_REGISTRY) {
      for (const v of [m.id, m.provider, m.productName, m.modelId, m.versionLabel]) expect(isBannedModel(v), `${m.id}: ${v}`).toBe(false);
      expect(m.providerCountry, m.id).not.toMatch(/china|taiwan/i);
    }
  });
});

describe("custom endpoints", () => {
  const row = { slug: "custom-x", name: "X", baseUrl: "https://api.example.com", chatPath: "/v1/chat/completions", wireFormat: "openai-compatible", defaultModel: "x-large" };

  it("refuses a China-linked base URL, name or model with the firm's sentence", () => {
    expect(validateCustomEndpoint("https://api.moonshot.ai", "/v1/chat/completions")).toEqual({ ok: false, reason: `${CHINA_POLICY_MESSAGE}.` });
    expect(() => buildCustomProvider({ ...row, baseUrl: "https://api.siliconflow.cn" })).toThrow(CHINA_POLICY_MESSAGE);
    expect(() => buildCustomProvider({ ...row, name: "Zhipu proxy" })).toThrow(CHINA_POLICY_MESSAGE);
    expect(() => buildCustomProvider({ ...row, defaultModel: "deepseek-chat" })).toThrow(CHINA_POLICY_MESSAGE);
    expect(buildCustomProvider(row).id).toBe("custom-x");
  });

  it("skips a stored China-linked row instead of serving it", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(tryBuildCustomProvider({ ...row, defaultModel: "kimi-k2" })).toBeNull();
    expect(tryBuildCustomProvider(row)).not.toBeNull();
    spy.mockRestore();
  });
});

describe("runtime: every call path refuses a banned model id", () => {
  afterEach(() => vi.unstubAllGlobals());

  const messages = [{ role: "user" as const, content: "hi" }];

  it.each([
    ["openrouter", "qwen/qwen3-235b-a22b"],
    ["openrouter", "deepseek/deepseek-chat-v3"],
    ["openrouter", "openrouter/auto"],
    ["together", "Qwen/Qwen2.5-72B-Instruct-Turbo"],
    ["fireworks", "accounts/fireworks/models/deepseek-v3"],
    ["venice", "qwen3-235b"],
    ["featherless", "moonshotai/Kimi-K2-Instruct"],
    ["groq", "moonshotai/kimi-k2-instruct"],
    ["deepinfra", "zai-org/GLM-4.5"],
    ["huggingface", "MiniMaxAI/MiniMax-M1-80k"],
    ["arcee", "auto"],
  ])("callProvider refuses %s → %s before any request is sent", async (providerId, model) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { callProvider } = await import("./aiProviderAdapters");
    await expect(callProvider({ provider: getProvider(providerId)!, apiKey: "k".repeat(40), model, messages })).rejects.toThrow(CHINA_POLICY_MESSAGE);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("callProvider refuses a China-linked base URL override", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { callProvider } = await import("./aiProviderAdapters");
    await expect(
      callProvider({ provider: getProvider("litellm")!, apiKey: "k", model: "gpt-5", messages, baseUrlOverride: "https://proxy.example.cn" }),
    ).rejects.toThrow(CHINA_POLICY_MESSAGE);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("callProvider discards an answer from a China-linked model an aggregator swapped in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ model: "qwen/qwen3-32b", choices: [{ message: { content: "hi" } }] }), { status: 200 })),
    );
    const { callProvider } = await import("./aiProviderAdapters");
    await expect(
      callProvider({ provider: getProvider("openrouter")!, apiKey: "sk-or-" + "k".repeat(30), model: "anthropic/claude-opus-5", messages }),
    ).rejects.toThrow(CHINA_POLICY_MESSAGE);
  });

  it("testProviderKey reports the refusal instead of calling out", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { testProviderKey } = await import("./aiProviderAdapters");
    const r = await testProviderKey({ providerId: "together", apiKey: "k".repeat(40), model: "deepseek-ai/DeepSeek-V3" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain(CHINA_POLICY_MESSAGE);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("the registry will not load a vault or environment credential on a banned model or host", async () => {
    const { credentialPolicyViolation, environmentCredentials } = await import("./providerRegistry");
    expect(credentialPolicyViolation({ model: "qwen/qwen3-32b", baseUrlOverride: null })).not.toBeNull();
    expect(credentialPolicyViolation({ model: "gpt-5", baseUrlOverride: "https://api.example.cn" })).not.toBeNull();
    expect(credentialPolicyViolation({ model: "gpt-5", baseUrlOverride: null })).toBeNull();

    const saved = { ...process.env };
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      process.env.RCS_BRAIN_TOGETHER_API_KEY = "k".repeat(40);
      process.env.RCS_BRAIN_TOGETHER_MODEL = "Qwen/Qwen3-235B-A22B";
      process.env.RCS_BRAIN_GROQ_API_KEY = "gsk_" + "k".repeat(30);
      delete process.env.RCS_BRAIN_GROQ_MODEL;
      delete process.env.GROQ_MODEL;
      const ids = environmentCredentials().map(c => c.providerId);
      expect(ids).not.toContain("together");
      expect(ids).toContain("groq");
    } finally {
      process.env = saved;
      spy.mockRestore();
    }
  });

  it("invokeLLM refuses a banned model on either path", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await expect(invokeLLM({ model: "glm-4.5", messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(CHINA_POLICY_MESSAGE);
  });

  it("the OpenRouter bus refuses a banned primary or fallback model and never routes to auto", async () => {
    const { invokeOpenRouter, MODEL_ROUTES, FALLBACK_CHAINS, OpenRouterBus } = await import("./integrations/openrouter");
    for (const m of [...Object.values(MODEL_ROUTES), ...Object.keys(FALLBACK_CHAINS).filter(k => k !== "default"), ...Object.values(FALLBACK_CHAINS).flat()]) {
      expect(isBannedModel(m), m).toBe(false);
    }
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(invokeOpenRouter({ model: "moonshotai/kimi-k2", messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(CHINA_POLICY_MESSAGE);
    await expect(
      OpenRouterBus.getInstance().chat({ model: "anthropic/claude-sonnet-4", models: ["qwen/qwen3-32b"], messages: [{ role: "user", content: "hi" }] }),
    ).rejects.toThrow(CHINA_POLICY_MESSAGE);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ─── 3. Nothing wires one in ─────────────────────────────────────────────────

const root = resolve(__dirname, "..");
const ROOTS = ["shared", "server", "client/src"];
const EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"]);
/** The ban's own definition necessarily names what it bans. */
const EXEMPT = new Set(["shared/aiProviders.ts"]);

/** A line that configures a model, provider or endpoint. */
const WIRING_LINE =
  /\b(?:models?|defaultModel|suggestedModels|modelId|modelOverride|[A-Z_]*MODEL[A-Z_]*|baseU[Rr][Ll]|base_url|apiBase|api_base|endpoint|chatPath|providerId|provider|MODEL_ROUTES|FALLBACK_CHAINS|envKey|openAiCompatible|callProvider|invokeLLM|completeChat)\b/;
/** A line where the literal is a model id (router pseudo-models count). */
const MODEL_LINE = /\b(?:models?|defaultModel|suggestedModels|modelId|modelOverride|[A-Z_]*MODEL[A-Z_]*|MODEL_ROUTES|FALLBACK_CHAINS)\b/;
/** An OpenRouter / Hugging Face style `vendor/model` id. */
const VENDOR_MODEL = /^[A-Za-z0-9_.~-]+\/[A-Za-z0-9_.:-]+$/;
const LITERAL = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`$\\\n]*)`/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = resolve(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTS.has(extname(name)) && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(name)) out.push(full);
  }
  return out;
}

function stripComment(line: string): string {
  const t = line.trimStart();
  if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return "";
  return line;
}

function wiringOffences(): string[] {
  const found: string[] = [];
  for (const r of ROOTS) {
    for (const file of walk(resolve(root, r))) {
      const rel = file.slice(root.length + 1);
      if (EXEMPT.has(rel)) continue;
      const lines = readFileSync(file, "utf-8").split("\n");
      lines.forEach((raw, i) => {
        const line = stripComment(raw);
        if (!line) return;
        const wiring = WIRING_LINE.test(line);
        const modelLine = MODEL_LINE.test(line);
        for (const m of line.matchAll(LITERAL)) {
          const lit = (m[1] ?? m[2] ?? m[3] ?? "").trim();
          if (!lit || lit.length > 300) continue;
          const vendorModel = VENDOR_MODEL.test(lit) && !lit.startsWith(".") && !lit.startsWith("@");
          const banned =
            (wiring && isBannedProvider(lit)) ||
            (modelLine && lit.length < 120 && isBannedModel(lit)) ||
            (vendorModel && isBannedProvider(lit));
          if (banned) found.push(`${rel}:${i + 1}: "${lit}"`);
        }
      });
    }
  }
  return found;
}

describe("no source file wires in a China-linked model or provider", () => {
  it("walks shared/, server/ and client/src/ and finds none", () => {
    expect(wiringOffences()).toEqual([]);
  });

  it("would catch one if it were added (the walker is not vacuous)", () => {
    const probe = [
      `  defaultModel: "qwen-max",`,
      `  baseUrl: "https://api.deepseek.com",`,
      `  const models = ["anthropic/claude-sonnet-4", "moonshotai/kimi-k2"];`,
      `  root: "auto", // MODEL_ROUTES`,
    ];
    const hits = probe.filter(line => {
      const lits = [...line.matchAll(LITERAL)].map(m => (m[1] ?? m[2] ?? m[3] ?? "").trim());
      return lits.some(
        lit =>
          (WIRING_LINE.test(line) && isBannedProvider(lit)) ||
          (MODEL_LINE.test(line) && isBannedModel(lit)) ||
          (VENDOR_MODEL.test(lit) && isBannedProvider(lit)),
      );
    });
    expect(hits).toHaveLength(probe.length);
  });
});

// ─── Consolidated from the other suites (the ban is proved here, once) ─────

describe("consolidated catalogue and endpoint checks", () => {
  it("no provider in the catalogue is China-linked by id, name, base URL, model or country", () => {
    for (const p of PROVIDERS) {
      for (const v of [p.id, p.name, p.baseUrl, ...p.suggestedModels]) expect(isBannedProvider(v), `${p.id}: ${v}`).toBe(false);
      expect(p.country, p.id).not.toMatch(/china|hong kong|macau/i);
    }
    for (const gone of ["deepseek", "moonshot", "qwen", "zhipu", "minimax", "qianfan"]) {
      expect(getProvider(gone), gone).toBeUndefined();
      expect(isBannedProvider(gone), gone).toBe(true);
    }
  });

  it("custom endpoints on a banned lab or a .cn host are refused; an allied one is accepted", () => {
    for (const [base, path] of [
      ["https://api.deepseek.com", "/chat/completions"],
      ["https://api.moonshot.ai", "/v1/chat/completions"],
      ["https://dashscope-intl.aliyuncs.com", "/compatible-mode/v1/chat/completions"],
      ["https://api.example.cn", "/v1/chat/completions"],
      ["https://example.cn:443", "/v1/chat/completions"],
    ]) expect(validateCustomEndpoint(base, path).ok, base).toBe(false);
    expect(validateCustomEndpoint("https://api.crusoe.ai", "/v1/chat/completions").ok).toBe(true);
  });

  it("the ultraAI panel carries no banned key, host or provider id", () => {
    const src = readFileSync(resolve(root, "server/ultraAI.ts"), "utf-8");
    for (const lit of src.match(/"[^"\n]{2,200}"/g) ?? []) expect(isBannedProvider(lit.slice(1, -1)), lit).toBe(false);
    expect(src).not.toMatch(/DEEPSEEK_API_KEY|api\.deepseek\.com/);
  });
});

// ─── 4. Manus stays out ──────────────────────────────────────────────────────

/** The Manus names: the product, its gateway host, its runtime folder and its parent company's hosts. */
const MANUS_PATTERN = /\bmanus(?![a-z])|__manus__|forge\.manus|butterfly-effect/i;
/** The variables the Manus gateway, OAuth and runtime were configured through. */
const MANUS_ENV_PATTERN = /BUILT_IN_FORGE_API_(?:URL|KEY)|RCS_ALLOW_FORGE_GATEWAY|OAUTH_SERVER_URL|VITE_OAUTH_PORTAL_URL|VITE_FRONTEND_FORGE_API_(?:URL|KEY)/;
const MANUS_ROOTS = ["client", "server", "shared", "scripts"];
const MANUS_ROOT_FILES = [
  "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "vite.config.ts", "vitest.config.ts", "tsconfig.json",
  "drizzle.config.ts", "components.json", ".gitignore", ".npmrc",
];
const MANUS_TEXT_EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".html", ".css", ".py", ".sh", ".yaml", ".yml", ".webmanifest", ".txt", ".svg"]);
/** This file and the ban's own definition necessarily name what they ban. */
const MANUS_EXEMPT = new Set(["server/chinaAiBan.test.ts", "shared/aiProviders.ts"]);

function walkAll(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const full = resolve(dir, name);
    if (statSync(full).isDirectory()) walkAll(full, out);
    else out.push(full);
  }
  return out;
}

function manusOffences(): string[] {
  const found: string[] = [];
  const files: string[] = [];
  for (const r of MANUS_ROOTS) files.push(...walkAll(resolve(root, r)));
  for (const f of MANUS_ROOT_FILES) {
    try { if (statSync(resolve(root, f)).isFile()) files.push(resolve(root, f)); } catch { /* not present */ }
  }
  for (const file of files) {
    const rel = file.slice(root.length + 1);
    if (MANUS_EXEMPT.has(rel)) continue;
    if (MANUS_PATTERN.test(rel)) { found.push(`${rel}: path`); continue; }
    const ext = extname(rel).toLowerCase();
    if (!MANUS_TEXT_EXTS.has(ext) && !MANUS_ROOT_FILES.includes(rel)) continue;
    readFileSync(file, "utf-8").split("\n").forEach((line, i) => {
      if (MANUS_PATTERN.test(line) || MANUS_ENV_PATTERN.test(line)) found.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  return found;
}

describe("Manus (Butterfly Effect) is removed and cannot come back", () => {
  it("is refused by the ban pattern by name, gateway host, runtime folder and parent-company host", () => {
    for (const v of ["manus", "forge.manus.im", "__manus__", "vite-plugin-manus-runtime", "forge.butterfly-effect.dev"]) {
      expect(isBannedProvider(v), v).toBe(true);
    }
    expect(isBannedProvider("manuscript")).toBe(false);
  });

  it("no file in client/, server/, shared/, scripts/ or the package and build config names it or reads its variables", () => {
    expect(manusOffences()).toEqual([]);
  });

  it("the runtime folder, the vite runtime plugin and the gateway modules are gone", () => {
    const gone = [
      "client/public/__manus__", "client/src/components/ManusDialog.tsx", "server/_core/types/manusTypes.ts",
      "server/_core/oauth.ts", "server/_core/heartbeat.ts", "server/_core/dataApi.ts", "server/_core/map.ts",
      "server/_core/imageGeneration.ts", "server/_core/voiceTranscription.ts",
    ];
    for (const g of gone) expect(() => statSync(resolve(root, g)), g).toThrow();
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as Record<string, Record<string, string> | undefined>;
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies };
    expect(Object.keys(deps).filter(d => MANUS_PATTERN.test(d))).toEqual([]);
  });

  it("would catch a reintroduction (the walker is not vacuous)", () => {
    const probe = [
      `import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";`,
      `<script src="/__manus__/debug-collector.js"></script>`,
      `const url = "https://forge.manus.im/v1/chat/completions";`,
      `const key = process.env.BUILT_IN_FORGE_API_KEY;`,
      `const MAPS = "https://forge.butterfly-effect.dev/v1/maps/proxy";`,
    ];
    expect(probe.filter(l => MANUS_PATTERN.test(l) || MANUS_ENV_PATTERN.test(l))).toHaveLength(probe.length);
    expect(MANUS_PATTERN.test("A manuscript of the plan")).toBe(false);
  });
});
