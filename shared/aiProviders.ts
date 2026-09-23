/**
 * AI Provider Definitions — the fifty-five brains the AI advisor (named in shared/aiAdvisor.ts) can be wired to.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * What each provider needs in order to be called: its endpoint, its wire
 * format, how it wants to be authenticated, and what a valid key looks like.
 *
 * A provider is a row in this table plus a key entered in the Brain Hub (or a
 * matching environment variable on Railway). Adding one that speaks an
 * existing wire format is a table entry and nothing else.
 *
 * ─── OWNER'S STANDING RULES ─────────────────────────────────────────────────
 *
 *   • No China-linked AI (owner's rule: DeepSeek 2026-09-06, every Chinese
 *     lab and host 2026-09-22, anything related to China 2026-09-23, Taiwan
 *     suspect). None is listed here or suggested as a model on any other
 *     provider; the catalogue is checked against BANNED_PROVIDER_PATTERN when
 *     this module loads; and every call path refuses a China-linked model id,
 *     provider or base URL at runtime with CHINA_POLICY_MESSAGE.
 *   • Providers hosted outside the United States carry a `caution` so the
 *     data-handling question is asked before client data flows.
 *
 * ─── WIRE FORMATS ───────────────────────────────────────────────────────────
 *
 * Most providers speak the OpenAI chat-completions shape, natively or through
 * a compatibility endpoint. Anthropic and Google have their own shapes and
 * get their own adapters (server/aiProviderAdapters.ts).
 */

export type WireFormat = "openai-compatible" | "anthropic" | "google-generative";

/** The Brain Hub holds at most this many provider keys and this many MCP servers. */
export const MAX_BRAINS = 55;
export const MAX_MCP_SERVERS = 40;

export type ProviderDefinition = {
  /** Stable id. Used as the database key and as GCM binding — never change it. */
  id: string;
  /** Company name as a client would recognise it. */
  name: string;
  /** Headquarters, shown in the Brain Hub. */
  country: string;
  wireFormat: WireFormat;
  /** Default API base, overridable per-install for proxies or self-hosting. */
  baseUrl: string;
  /** Path appended to the base for a chat completion. */
  chatPath: string;
  /** Default model, overridable in the admin UI. */
  defaultModel: string;
  /** Models worth offering in the picker. Not exhaustive. */
  suggestedModels: string[];
  /**
   * Shape a valid key takes. Used for a client-side sanity check before the
   * key is sent — catches a pasted password or a truncated copy, nothing more.
   */
  keyPattern: RegExp;
  /** Shown under the input so it is obvious what is being asked for. */
  keyHint: string;
  /** Where to get a key. */
  consoleUrl: string;
  /** What this provider is best used for on this platform. */
  role: string;
  /** Anything that should be known before sending client data to it. */
  caution?: string;
  /** Needs a Base URL override before it can be called (account-scoped endpoints). */
  requiresBaseUrl?: boolean;
};

const ALNUM = /^[A-Za-z0-9_-]{20,}$/;

export const PROVIDERS: ProviderDefinition[] = [
  // ─── Tier 1: frontier labs ──────────────────────────────────────────────
  {
    id: "anthropic",
    name: "Anthropic",
    country: "United States",
    wireFormat: "anthropic",
    baseUrl: "https://api.anthropic.com",
    chatPath: "/v1/messages",
    defaultModel: "claude-opus-5",
    suggestedModels: ["claude-opus-5", "claude-fable-5-1", "claude-sonnet-5", "claude-haiku-4-5-20251001"],
    keyPattern: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
    keyHint: "Starts with sk-ant-",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    role: "Lead brain. Multi-step strategy sequencing, compliance reasoning, long-document analysis.",
  },
  {
    id: "openai",
    name: "OpenAI",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.openai.com",
    chatPath: "/v1/chat/completions",
    defaultModel: "gpt-5",
    suggestedModels: ["gpt-5", "gpt-5-mini", "gpt-4.1", "o3"],
    keyPattern: /^sk-(proj-)?[A-Za-z0-9_-]{20,}$/,
    keyHint: "Starts with sk- or sk-proj-",
    consoleUrl: "https://platform.openai.com/api-keys",
    role: "Second opinion on strategy sequences — two independent models must agree before a recommendation surfaces.",
  },
  {
    id: "google",
    name: "Google DeepMind (Gemini)",
    country: "United States / United Kingdom",
    wireFormat: "google-generative",
    baseUrl: "https://generativelanguage.googleapis.com",
    chatPath: "/v1beta/models",
    defaultModel: "gemini-2.5-pro",
    suggestedModels: ["gemini-2.5-pro", "gemini-2.5-flash"],
    keyPattern: /^AIza[A-Za-z0-9_-]{30,}$/,
    keyHint: "Starts with AIza",
    consoleUrl: "https://aistudio.google.com/apikey",
    role: "Whole-portfolio and multi-document analysis where the very large context window earns its place.",
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.x.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "grok-4",
    suggestedModels: ["grok-4", "grok-3", "grok-3-mini"],
    keyPattern: /^xai-[A-Za-z0-9]{20,}$/,
    keyHint: "Starts with xai-",
    consoleUrl: "https://console.x.ai",
    role: "Market commentary, current-events context, and the Brotherhood voice.",
    caution: "SuperGrok is a consumer subscription and does not include API access — the API is billed separately at console.x.ai.",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.perplexity.ai",
    chatPath: "/chat/completions",
    defaultModel: "sonar-pro",
    // sonar-reasoning-pro is left out: Perplexity built its reasoning line on DeepSeek-R1.
    suggestedModels: ["sonar-pro", "sonar"],
    keyPattern: /^pplx-[A-Za-z0-9]{20,}$/,
    keyHint: "Starts with pplx-",
    consoleUrl: "https://www.perplexity.ai/settings/api",
    role: "Cited web retrieval — carrier rates, credit-card terms and statutory text with sources attached.",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    country: "France",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.mistral.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "mistral-large-latest",
    suggestedModels: ["mistral-large-latest", "mistral-medium-latest", "magistral-medium-latest"],
    keyPattern: /^[A-Za-z0-9]{24,}$/,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://console.mistral.ai/api-keys",
    role: "EU-hosted option for clients with data-residency requirements.",
    caution: "Hosted in the EU. Fine for most engagements; note it in the privacy policy.",
  },
  {
    id: "cohere",
    name: "Cohere",
    country: "Canada",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.cohere.ai/compatibility",
    chatPath: "/v1/chat/completions",
    defaultModel: "command-a-03-2025",
    suggestedModels: ["command-a-03-2025", "command-r-plus"],
    keyPattern: /^[A-Za-z0-9]{20,}$/,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://dashboard.cohere.com/api-keys",
    role: "Retrieval and reranking across the platform's document library.",
    caution: "Hosted in Canada. Fine for most engagements; note it in the privacy policy.",
  },
  {
    id: "meta-llama",
    name: "Meta (Llama API)",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.llama.com/compat",
    chatPath: "/v1/chat/completions",
    defaultModel: "Llama-4-Maverick-17B-128E-Instruct-FP8",
    suggestedModels: ["Llama-4-Maverick-17B-128E-Instruct-FP8", "Llama-4-Scout-17B-16E-Instruct-FP8"],
    keyPattern: /^LLM\|[A-Za-z0-9|_-]{20,}$|^[A-Za-z0-9_-]{20,}$/,
    keyHint: "Issued at llama.developer.meta.com",
    consoleUrl: "https://llama.developer.meta.com",
    role: "First-party Llama hosting; open-weight strength without running the hardware.",
  },
  {
    id: "ai21",
    name: "AI21 Labs (Jamba)",
    country: "Israel",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.ai21.com/studio",
    chatPath: "/v1/chat/completions",
    defaultModel: "jamba-large",
    suggestedModels: ["jamba-large", "jamba-mini"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://studio.ai21.com/account/api-key",
    role: "Very long documents — policy illustrations, trust instruments — at a modest price.",
    caution: "Hosted outside the United States. Confirm data handling before client data reaches it.",
  },
  {
    id: "writer",
    name: "Writer (Palmyra)",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.writer.com",
    chatPath: "/v1/chat/completions",
    defaultModel: "palmyra-x5",
    suggestedModels: ["palmyra-x5", "palmyra-fin"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://app.writer.com/aistudio",
    role: "Palmyra-Fin is trained on financial filings — a strong voice for client-facing narrative.",
  },
  {
    id: "reka",
    name: "Reka",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.reka.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "reka-core",
    suggestedModels: ["reka-core", "reka-flash"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://platform.reka.ai",
    role: "Multimodal reading of scanned statements and illustration PDFs.",
  },

  // ─── Tier 2: gateways and multi-model routers ───────────────────────────
  {
    id: "openrouter",
    name: "OpenRouter",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://openrouter.ai/api",
    chatPath: "/v1/chat/completions",
    defaultModel: "anthropic/claude-opus-5",
    suggestedModels: ["anthropic/claude-opus-5", "openai/gpt-5", "google/gemini-2.5-pro", "meta-llama/llama-4-maverick"],
    keyPattern: /^sk-or-[A-Za-z0-9_-]{20,}$/,
    keyHint: "Starts with sk-or-",
    consoleUrl: "https://openrouter.ai/keys",
    role: "One key, many models. The fastest way to reach several providers without an account with each.",
    caution: "Requests are relayed through OpenRouter's infrastructure rather than going direct to the model provider.",
  },
  {
    id: "vercel-gateway",
    name: "Vercel AI Gateway",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://ai-gateway.vercel.sh",
    chatPath: "/v1/chat/completions",
    defaultModel: "anthropic/claude-opus-5",
    suggestedModels: ["anthropic/claude-opus-5", "openai/gpt-5", "xai/grok-4"],
    keyPattern: /^vck_[A-Za-z0-9_-]{20,}$|^[A-Za-z0-9_-]{20,}$/,
    keyHint: "Starts with vck_",
    consoleUrl: "https://vercel.com/dashboard/ai-gateway",
    role: "Gateway with per-model spend caps and automatic failover across providers.",
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/chat/completions",
    defaultModel: "gpt-5",
    suggestedModels: ["gpt-5", "gpt-4.1", "o3"],
    keyPattern: /^[A-Za-z0-9]{32,}$/,
    keyHint: "A 32+ character key from your Azure resource",
    consoleUrl: "https://portal.azure.com",
    role: "Enterprise deployments that need contractual data-handling terms and a known region.",
    caution: "Requires a Base URL override pointing at your own Azure resource and deployment, e.g. https://<resource>.openai.azure.com/openai/deployments/<deployment>.",
    requiresBaseUrl: true,
  },
  {
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/openai/v1/chat/completions",
    defaultModel: "anthropic.claude-opus-5",
    suggestedModels: ["anthropic.claude-opus-5", "amazon.nova-pro-v1:0", "meta.llama4-maverick-17b-instruct-v1:0"],
    keyPattern: /^[A-Za-z0-9+/=_-]{20,}$/,
    keyHint: "A Bedrock API key from the AWS console",
    consoleUrl: "https://console.aws.amazon.com/bedrock",
    role: "Same frontier models inside an AWS account, with AWS's data-handling terms.",
    caution: "Requires a Base URL override for your region, e.g. https://bedrock-runtime.us-east-1.amazonaws.com. Model access must be enabled per model in the Bedrock console.",
    requiresBaseUrl: true,
  },
  {
    id: "google-vertex",
    name: "Google Vertex AI",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/chat/completions",
    defaultModel: "google/gemini-2.5-pro",
    suggestedModels: ["google/gemini-2.5-pro", "google/gemini-2.5-flash"],
    keyPattern: /^ya29\.[A-Za-z0-9_-]{20,}$|^[A-Za-z0-9._-]{20,}$/,
    keyHint: "An OAuth access token (short-lived) or a Vertex API key",
    consoleUrl: "https://console.cloud.google.com/vertex-ai",
    role: "Gemini under a Google Cloud project with enterprise controls and audit logging.",
    caution: "Requires a Base URL override: https://<region>-aiplatform.googleapis.com/v1/projects/<project>/locations/<region>/endpoints/openapi.",
    requiresBaseUrl: true,
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/ai/v1/chat/completions",
    defaultModel: "@cf/meta/llama-4-scout-17b-16e-instruct",
    suggestedModels: ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"],
    keyPattern: ALNUM,
    keyHint: "A Cloudflare API token with Workers AI permission",
    consoleUrl: "https://dash.cloudflare.com/profile/api-tokens",
    role: "Edge-hosted open models close to the user; pennies per million tokens.",
    caution: "Requires a Base URL override: https://api.cloudflare.com/client/v4/accounts/<account-id>.",
    requiresBaseUrl: true,
  },
  {
    id: "litellm",
    name: "LiteLLM proxy (self-hosted)",
    country: "Your infrastructure",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/v1/chat/completions",
    defaultModel: "gpt-5",
    suggestedModels: ["gpt-5", "claude-opus-5"],
    keyPattern: /.+/,
    keyHint: "Whatever virtual key the proxy issued",
    consoleUrl: "https://docs.litellm.ai",
    role: "A proxy you run that fronts every other provider with one budget and one log.",
    caution: "Requires a Base URL override pointing at your proxy, reachable from where the app runs.",
    requiresBaseUrl: true,
  },

  // ─── Tier 3: fast and open-weight inference ─────────────────────────────
  {
    id: "groq",
    name: "Groq",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.groq.com/openai",
    chatPath: "/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    suggestedModels: ["llama-3.3-70b-versatile", "meta-llama/llama-4-maverick-17b-128e-instruct"],
    keyPattern: /^gsk_[A-Za-z0-9]{20,}$/,
    keyHint: "Starts with gsk_",
    consoleUrl: "https://console.groq.com/keys",
    role: "Very fast inference for interactive work where latency matters more than depth.",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.cerebras.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "llama-3.3-70b",
    suggestedModels: ["llama-3.3-70b", "openai/gpt-oss-120b"],
    keyPattern: /^csk-[A-Za-z0-9]{20,}$/,
    keyHint: "Starts with csk-",
    consoleUrl: "https://cloud.cerebras.ai",
    role: "The fastest inference on this list by a wide margin. Good for interactive work; limited model choice.",
  },
  {
    id: "sambanova",
    name: "SambaNova",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.sambanova.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
    suggestedModels: ["Meta-Llama-3.3-70B-Instruct", "Llama-4-Maverick-17B-128E-Instruct"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://cloud.sambanova.ai",
    role: "Fast open-weight inference on custom silicon; a second fast lane beside Groq and Cerebras.",
  },
  {
    id: "together",
    name: "Together AI",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.together.xyz",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    suggestedModels: ["meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", "openai/gpt-oss-120b"],
    keyPattern: /^[A-Za-z0-9]{40,}$/,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://api.together.xyz/settings/api-keys",
    role: "Open-weight models and a self-hostable fallback so the platform is never wholly dependent on one vendor.",
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.fireworks.ai/inference",
    chatPath: "/v1/chat/completions",
    defaultModel: "accounts/fireworks/models/llama4-maverick-instruct-basic",
    suggestedModels: ["accounts/fireworks/models/llama4-maverick-instruct-basic", "accounts/fireworks/models/gpt-oss-120b"],
    keyPattern: /^[A-Za-z0-9_-]{20,}$/,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://fireworks.ai/account/api-keys",
    role: "Fast open-weight inference for high-volume batch work where per-token cost matters.",
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.deepinfra.com",
    chatPath: "/v1/openai/chat/completions",
    defaultModel: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    suggestedModels: ["meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", "openai/gpt-oss-120b"],
    keyPattern: /^[A-Za-z0-9]{20,}$/,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://deepinfra.com/dash/api_keys",
    role: "Low-cost open-weight hosting, priced per token with no minimum.",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://integrate.api.nvidia.com",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta/llama-3.3-70b-instruct",
    suggestedModels: ["meta/llama-3.3-70b-instruct", "nvidia/llama-3.3-nemotron-super-49b-v1"],
    keyPattern: /^nvapi-[A-Za-z0-9_-]{20,}$/,
    keyHint: "Starts with nvapi-",
    consoleUrl: "https://build.nvidia.com",
    role: "NVIDIA-hosted open models, and the same API shape you would self-host NIM behind later.",
  },
  {
    id: "baseten",
    name: "Baseten",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://inference.baseten.co",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-4-Maverick-17B-128E-Instruct",
    suggestedModels: ["meta-llama/Llama-4-Maverick-17B-128E-Instruct", "openai/gpt-oss-120b"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://app.baseten.co/settings/api_keys",
    role: "Dedicated deployments of open models when a fixed, predictable throughput is wanted.",
  },
  {
    id: "lambda",
    name: "Lambda Inference",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.lambda.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "llama-4-maverick-17b-128e-instruct-fp8",
    suggestedModels: ["llama-4-maverick-17b-128e-instruct-fp8", "llama3.3-70b-instruct-fp8"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://cloud.lambda.ai/api-keys",
    role: "Straightforward per-token pricing on open models from a US GPU cloud.",
  },
  {
    id: "nscale",
    name: "Nscale",
    country: "United Kingdom",
    wireFormat: "openai-compatible",
    baseUrl: "https://inference-api.nscale.com",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    suggestedModels: ["meta-llama/Llama-3.3-70B-Instruct", "openai/gpt-oss-120b"],
    keyPattern: /^[A-Za-z0-9._-]{20,}$/,
    keyHint: "Service token from the Nscale console",
    consoleUrl: "https://console.nscale.com",
    role: "UK-owned open-weight capacity on its own Nordic and UK data centres; UK/EU data residency.",
    caution: "Hosted in the United Kingdom and Norway under UK GDPR. Confirm data handling before client data reaches it.",
  },
  {
    id: "crusoe",
    name: "Crusoe Managed Inference",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.crusoe.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    suggestedModels: ["meta-llama/Llama-3.3-70B-Instruct", "openai/gpt-oss-120b"],
    keyPattern: /^[A-Za-z0-9._-]{20,}$/,
    keyHint: "API key from the Crusoe Cloud console",
    consoleUrl: "https://console.crusoecloud.com",
    role: "US-hosted inference on Crusoe's own data centres; background batch work.",
  },
  {
    id: "kluster",
    name: "kluster.ai",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.kluster.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    suggestedModels: ["meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", "openai/gpt-oss-120b"],
    keyPattern: /^[A-Za-z0-9._-]{20,}$/,
    keyHint: "API key from platform.kluster.ai",
    consoleUrl: "https://platform.kluster.ai/apikeys",
    role: "Cheap open-weight capacity with batch pricing for transcript digests and summaries.",
  },
  {
    id: "digitalocean",
    name: "DigitalOcean Gradient",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://inference.do-ai.run",
    chatPath: "/v1/chat/completions",
    defaultModel: "llama3.3-70b-instruct",
    suggestedModels: ["llama3.3-70b-instruct", "openai-gpt-oss-120b"],
    keyPattern: /^[A-Za-z0-9._-]{20,}$/,
    keyHint: "Model access key from the DigitalOcean control panel",
    consoleUrl: "https://cloud.digitalocean.com/gen-ai",
    role: "Serverless inference from a US public company (NYSE: DOCN).",
  },
  {
    id: "ovhcloud",
    name: "OVHcloud AI Endpoints",
    country: "France",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/v1/chat/completions",
    defaultModel: "Meta-Llama-3_3-70B-Instruct",
    suggestedModels: ["Meta-Llama-3_3-70B-Instruct", "Mistral-Small-3_2-24B-Instruct-2506"],
    keyPattern: /^[A-Za-z0-9._-]{20,}$/,
    keyHint: "AI Endpoints access token from the OVHcloud control panel",
    consoleUrl: "https://www.ovh.com/manager/",
    role: "French sovereign cloud (OVH Groupe, Euronext Paris); EU data residency.",
    caution: "Set the Base URL to your region's AI Endpoints host as shown in the OVHcloud console before use.",
    requiresBaseUrl: true,
  },
  {
    id: "ionos",
    name: "IONOS AI Model Hub",
    country: "Germany",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    suggestedModels: ["meta-llama/Llama-3.3-70B-Instruct", "mistralai/Mistral-Small-24B-Instruct"],
    keyPattern: /^[A-Za-z0-9._-]{20,}$/,
    keyHint: "Token from the IONOS Cloud console",
    consoleUrl: "https://cloud.ionos.com",
    role: "German-hosted models (IONOS SE, Frankfurt-listed); GDPR data residency.",
    caution: "Set the Base URL to the AI Model Hub endpoint for your region as shown in the IONOS docs before use.",
    requiresBaseUrl: true,
  },
  {
    id: "hyperbolic",
    name: "Hyperbolic",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.hyperbolic.xyz",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    suggestedModels: ["meta-llama/Llama-3.3-70B-Instruct", "openai/gpt-oss-120b"],
    keyPattern: /^eyJ[A-Za-z0-9._-]{20,}$|^[A-Za-z0-9_-]{20,}$/,
    keyHint: "A JWT-style token starting with eyJ",
    consoleUrl: "https://app.hyperbolic.xyz/settings",
    role: "Marketplace GPU capacity; another independent lane for open models.",
  },
  {
    id: "nebius",
    name: "Nebius AI Studio",
    country: "Netherlands",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.studio.nebius.com",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    suggestedModels: ["meta-llama/Llama-3.3-70B-Instruct", "openai/gpt-oss-120b"],
    keyPattern: /^eyJ[A-Za-z0-9._-]{20,}$|^[A-Za-z0-9_-]{20,}$/,
    keyHint: "A JWT-style token starting with eyJ",
    consoleUrl: "https://studio.nebius.com/settings/api-keys",
    role: "EU-hosted open models for data-residency engagements.",
    caution: "Hosted in the EU. Confirm data handling before client data reaches it.",
  },
  {
    id: "scaleway",
    name: "Scaleway Generative APIs",
    country: "France",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.scaleway.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "llama-3.3-70b-instruct",
    suggestedModels: ["llama-3.3-70b-instruct", "mistral-small-3.2-24b-instruct-2506"],
    keyPattern: /^[A-Za-z0-9-]{20,}$/,
    keyHint: "A Scaleway secret key (UUID form)",
    consoleUrl: "https://console.scaleway.com/iam/api-keys",
    role: "French-hosted open models; a second EU lane beside Mistral.",
    caution: "Hosted in the EU. Confirm data handling before client data reaches it.",
  },
  {
    id: "friendli",
    name: "FriendliAI",
    country: "United States / South Korea",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.friendli.ai/serverless",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama-3.3-70b-instruct",
    suggestedModels: ["meta-llama-3.3-70b-instruct"],
    keyPattern: /^flp_[A-Za-z0-9_-]{20,}$|^[A-Za-z0-9_-]{20,}$/,
    keyHint: "Starts with flp_",
    consoleUrl: "https://suite.friendli.ai",
    role: "Serverless open-model endpoints with low cold-start latency.",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    country: "United States / France",
    wireFormat: "openai-compatible",
    baseUrl: "https://router.huggingface.co",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    suggestedModels: ["meta-llama/Llama-3.3-70B-Instruct", "openai/gpt-oss-120b"],
    keyPattern: /^hf_[A-Za-z0-9]{20,}$/,
    keyHint: "Starts with hf_",
    consoleUrl: "https://huggingface.co/settings/tokens",
    role: "Routes to whichever inference provider currently serves a given open model.",
  },
  {
    id: "ollama",
    name: "Ollama (self-hosted)",
    country: "Your infrastructure",
    wireFormat: "openai-compatible",
    baseUrl: "http://localhost:11434",
    chatPath: "/v1/chat/completions",
    defaultModel: "llama3.3",
    suggestedModels: ["llama3.3", "gpt-oss", "gemma3"],
    keyPattern: /.*/,
    keyHint: "Usually blank — enter 'ollama' if a value is required",
    consoleUrl: "https://ollama.com",
    role: "Runs models on hardware you control. The only option where client data never leaves your own network.",
    caution: "Set a Base URL override pointing at your Ollama host. localhost will not work from a deployed server.",
    requiresBaseUrl: true,
  },

  // ─── Tier 4: Asia-Pacific labs (data-handling caution on each) ──────────
  {
    id: "upstage",
    name: "Upstage (Solar)",
    country: "South Korea",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.upstage.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "solar-pro2",
    suggestedModels: ["solar-pro2", "solar-mini"],
    keyPattern: /^up_[A-Za-z0-9]{20,}$|^[A-Za-z0-9_-]{20,}$/,
    keyHint: "Starts with up_",
    consoleUrl: "https://console.upstage.ai/api-keys",
    role: "Document-parsing strength; useful on scanned illustrations and statements.",
    caution: "Hosted in South Korea. Confirm data handling before client data reaches it.",
  },

  // ─── Tier 5: fifteen more platforms (owner's order, 23 Sep 2026) ──────────
  // Each endpoint, key page and model id below was read from the platform's
  // own documentation on 23 Sep 2026. Every one speaks the OpenAI shape.
  // Where a platform's catalogue also carries models from Chinese labs, the
  // suggested ids stay on Llama, Mistral, OpenAI-open or the platform's own
  // model, and the registry refuses the banned names regardless.
  {
    id: "inception",
    name: "Inception Labs (Mercury)",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.inceptionlabs.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "mercury-2",
    suggestedModels: ["mercury-2"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://platform.inceptionlabs.ai",
    role: "Diffusion language models that answer in a fraction of the usual time; the brain for the calculators' plain-English summaries.",
  },
  {
    id: "venice",
    name: "Venice AI",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.venice.ai/api",
    chatPath: "/v1/chat/completions",
    defaultModel: "llama-3.3-70b",
    suggestedModels: ["llama-3.3-70b", "llama-3.2-3b"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://venice.ai/settings/api",
    role: "Zero-retention inference on open models: nothing about a client's question is stored on their side.",
    caution: "The catalogue also lists models from Chinese labs. Keep the model on the Llama ids suggested here.",
  },
  {
    id: "featherless",
    name: "Featherless AI",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.featherless.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    suggestedModels: ["meta-llama/Llama-3.3-70B-Instruct"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://featherless.ai/account/api-keys",
    role: "Any open model on Hugging Face, served on demand; the way to try a specialist model without hosting it.",
    caution: "The catalogue also lists models from Chinese labs. Keep the model on the Llama id suggested here.",
  },
  {
    id: "parasail",
    name: "Parasail",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.parasail.io",
    chatPath: "/v1/chat/completions",
    defaultModel: "parasail-llama-33-70b-fp8",
    suggestedModels: ["parasail-llama-33-70b-fp8"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://www.saas.parasail.io/keys",
    role: "Low-cost serverless open models with a batch API for overnight report runs.",
    caution: "The catalogue also lists models from Chinese labs. Keep the model on the Llama id suggested here.",
  },
  {
    id: "arcee",
    name: "Arcee AI (Trinity)",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.arcee.ai/api",
    chatPath: "/v1/chat/completions",
    defaultModel: "trinity-large-thinking",
    suggestedModels: ["trinity-large-thinking"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://chat.arcee.ai",
    role: "Trinity, Arcee's own US-trained open-weight family; a strong reasoning brain at a low per-token price.",
    caution: "Conductor's \"auto\" router is not used: it routes to Arcee models distilled from DeepSeek-V3 or built on Qwen. Keep the model on Trinity.",
  },
  {
    id: "wandb",
    name: "Weights & Biases Inference",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.inference.wandb.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "openai/gpt-oss-120b",
    suggestedModels: ["openai/gpt-oss-120b", "meta-llama/Llama-3.3-70B-Instruct", "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B"],
    keyPattern: ALNUM,
    keyHint: "Your W&B API key (Settings → API keys)",
    consoleUrl: "https://wandb.ai/settings",
    role: "CoreWeave-backed serverless inference with every call traced; the brain to use when a run has to be auditable.",
    caution: "The catalogue also lists models from Chinese labs. Keep the model on the ids suggested here.",
  },
  {
    id: "vultr",
    name: "Vultr Serverless Inference",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.vultrinference.com",
    chatPath: "/v1/chat/completions",
    defaultModel: "llama-3.3-70b-instruct-fp8",
    suggestedModels: ["llama-3.3-70b-instruct-fp8", "mistral-nemo-instruct-2407", "hermes-3-llama-3.1-70b-fp8"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://my.vultr.com/inference/",
    role: "Open models on Vultr's own cloud; a plain, cheap second opinion for the hive.",
    caution: "The catalogue also lists models from Chinese labs. Keep the model on the ids suggested here.",
  },
  {
    id: "edenai",
    name: "Eden AI",
    country: "France",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.edenai.run",
    chatPath: "/v3/chat/completions",
    defaultModel: "mistral/mistral-large",
    suggestedModels: ["mistral/mistral-large", "openai/gpt-4", "anthropic/claude-sonnet-4-5"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://app.edenai.run",
    role: "Paris-based aggregator: one key reaches three hundred models with automatic fallbacks.",
    caution: "Hosted in the EU (France). Fine for most engagements; note it in the privacy policy.",
  },
  {
    id: "sarvam",
    name: "Sarvam AI",
    country: "India",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.sarvam.ai",
    chatPath: "/v1/chat/completions",
    defaultModel: "sarvam-105b",
    suggestedModels: ["sarvam-105b"],
    keyPattern: ALNUM,
    keyHint: "Your API subscription key from the dashboard",
    consoleUrl: "https://dashboard.sarvam.ai",
    role: "India's sovereign model; the strongest option on Indian languages for clients with family abroad.",
    caution: "Hosted in India. Confirm data handling before client data reaches it.",
  },
  {
    id: "krutrim",
    name: "Krutrim (Ola)",
    country: "India",
    wireFormat: "openai-compatible",
    baseUrl: "https://cloud.olakrutrim.com",
    chatPath: "/v1/chat/completions",
    defaultModel: "Meta-Llama-3-8B-Instruct",
    suggestedModels: ["Meta-Llama-3-8B-Instruct", "Krutrim-spectre-v2"],
    keyPattern: ALNUM,
    keyHint: "A model API key from Key Management",
    consoleUrl: "https://cloud.olakrutrim.com",
    role: "Ola's Indian AI cloud; open models and its own Krutrim family at Indian prices.",
    caution: "Hosted in India. Confirm data handling before client data reaches it.",
  },
  {
    id: "naver-clova",
    name: "NAVER CLOVA Studio (HyperCLOVA X)",
    country: "South Korea",
    wireFormat: "openai-compatible",
    baseUrl: "https://clovastudio.stream.ntruss.com/v1/openai",
    chatPath: "/chat/completions",
    defaultModel: "HCX-007",
    suggestedModels: ["HCX-007", "HCX-005", "HCX-DASH-002"],
    keyPattern: ALNUM,
    keyHint: "A CLOVA Studio API key (test or service app)",
    consoleUrl: "https://clovastudio.naver.com",
    role: "NAVER's HyperCLOVA X: a Korean-first frontier model with a reasoning mode.",
    caution: "Hosted in South Korea. Confirm data handling before client data reaches it.",
  },
  {
    id: "plamo",
    name: "PLaMo (Preferred Networks)",
    country: "Japan",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.platform.preferredai.jp",
    chatPath: "/v1/chat/completions",
    defaultModel: "plamo-3.0-prime",
    suggestedModels: ["plamo-3.0-prime"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://plamo.preferredai.jp",
    role: "Preferred Networks' Japanese model, trained from scratch in Japan; the Japanese-language brain.",
    caution: "Hosted in Japan. Confirm data handling before client data reaches it.",
  },
  {
    id: "aleph-alpha",
    name: "Aleph Alpha (PhariaAI)",
    country: "Germany",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.aleph-alpha.com",
    chatPath: "/chat/completions",
    defaultModel: "llama-3.1-8b-instruct",
    suggestedModels: ["llama-3.1-8b-instruct", "pharia-1-llm-7b-control"],
    keyPattern: ALNUM,
    keyHint: "An API token from your Aleph Alpha profile",
    consoleUrl: "https://app.aleph-alpha.com/profile",
    role: "Germany's sovereign AI company; the EU-compliance brain for clients who ask where the model runs.",
    caution: "Hosted in Germany and enterprise-first: a public API token may need an account Aleph Alpha has approved. Note the EU hosting in the privacy policy.",
  },
  {
    id: "publicai",
    name: "Public AI (Apertus)",
    country: "Switzerland",
    wireFormat: "openai-compatible",
    baseUrl: "https://api.publicai.co",
    chatPath: "/v1/chat/completions",
    defaultModel: "swiss-ai/apertus-v1.5-70b",
    suggestedModels: ["swiss-ai/apertus-v1.5-70b", "swiss-ai/apertus-v1.5-8b"],
    keyPattern: ALNUM,
    keyHint: "A long alphanumeric string",
    consoleUrl: "https://platform.publicai.co",
    role: "Apertus, Switzerland's fully open national model (data, weights and training all published), served by the Public AI utility.",
    caution: "A non-profit utility whose partners serve from Switzerland and the EU. Note it in the privacy policy.",
  },
  {
    id: "databricks",
    name: "Databricks Foundation Model APIs",
    country: "United States",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/chat/completions",
    defaultModel: "databricks-meta-llama-3-3-70b-instruct",
    suggestedModels: ["databricks-meta-llama-3-3-70b-instruct", "databricks-claude-sonnet-4"],
    keyPattern: /^dapi[A-Za-z0-9]{20,}$|^[A-Za-z0-9_-]{20,}$/,
    keyHint: "A personal access token, usually starting with dapi",
    consoleUrl: "https://accounts.cloud.databricks.com",
    role: "Foundation models served inside your own Databricks workspace; for a firm that already keeps its data there.",
    caution: "Set the Base URL override to https://<your-workspace>/serving-endpoints before this brain can be called.",
    requiresBaseUrl: true,
  },
];

/** The brains the owner can wire. There is no internal gateway entry. */
export const BRAIN_PROVIDERS: ProviderDefinition[] = PROVIDERS;

/**
 * ─── OWNER'S STANDING RULE: NO CHINA-LINKED AI ──────────────────────────────
 *
 * 2026-09-06: DeepSeek out. 2026-09-22: widened to every Chinese AI system and
 * every Chinese host. 2026-09-23: widened again to anything connected to the
 * Chinese government or related to China at all, with Taiwan-based labs
 * treated as suspect. 2026-09-23 also: Manus (Butterfly Effect) and its
 * hosted gateway, OAuth, storage and runtime removed and banned by name.
 * The rule covers provider ids, provider names, base
 * URLs, chat paths and model ids — including OpenRouter-style `vendor/model`
 * ids, Hugging Face org prefixes, and open-weight Chinese models served by an
 * American host (Groq, Together, Fireworks, Venice, Featherless and every
 * other aggregator carry them).
 *
 * Each term is written so it does not catch an ordinary word or a legitimate
 * US/EU name: `\b` guards the short ones ("glm", "kimi", "ernie"), "step-"
 * only matches StepFun's numbered model shapes (a chain's "step-1" is not a
 * model), "spark" only in iFlytek's model shapes, "yuan" only as Inspur's
 * numbered model (the currency is fine), and a TLD only at the end of a host.
 * The guard test (server/chinaAiBan.test.ts) proves both directions.
 */
const BANNED_TERMS: readonly string[] = [
  // DeepSeek (and its derivatives: Perplexity's R1-1776 and the sonar-reasoning line built on R1)
  String.raw`deepseek`, String.raw`\br1-1776`, String.raw`sonar-reasoning`,
  // Moonshot AI / Kimi
  String.raw`moonshot`, String.raw`\bkimi`,
  // Zhipu / Z.ai / GLM / ChatGLM / Tsinghua (THUDM)
  String.raw`zhipu`, String.raw`\bglm`, String.raw`chatglm`, String.raw`codegeex`, String.raw`\bcog(?:vlm|view|agent|video)`,
  String.raw`\bthudm`, String.raw`\bzai-org`, String.raw`\bz[.-]ai\b`, String.raw`bigmodel`,
  // Alibaba / Qwen / Tongyi / DashScope / Ant Group
  String.raw`qwen`, String.raw`\bqwq(?:-|\b)`, String.raw`\bqvq-`, String.raw`alibaba`, String.raw`dashscope`, String.raw`tongyi`,
  String.raw`aliyun`, String.raw`\bbailian`, String.raw`inclusionai`,
  // MiniMax
  String.raw`minimax`, String.raw`\babab[\d.]`,
  // Baichuan
  String.raw`baichuan`,
  // 01.AI / Yi
  String.raw`\b01[.-]ai\b`, String.raw`lingyiwanwu`, String.raw`\byi-(?:\d|large|lightning|medium|spark|vision|coder|chat)`,
  // Baidu / ERNIE / Wenxin / Qianfan
  String.raw`\bernie`, String.raw`baidu`, String.raw`wenxin`, String.raw`qianfan`,
  // Tencent / Hunyuan
  String.raw`hunyuan`, String.raw`tencent`,
  // ByteDance / Doubao / Volcengine Ark / Seed
  String.raw`doubao`, String.raw`bytedance`, String.raw`volcengine`, String.raw`volces`, String.raw`\bark\.cn`, String.raw`\bseed-oss`, String.raw`\bui-tars`,
  // StepFun
  String.raw`stepfun`, String.raw`\bstep-?[123](?:\.\d+)?(?:[vo]\b|-(?:\d+k|mini|flash|turbo|vision|v|o))`, String.raw`\bstep3\b`, String.raw`\bstep-(?:r1|audio)`,
  // Shanghai AI Lab / InternLM
  String.raw`\bintern(?:lm|vl)`, String.raw`shanghai[\s_-]*ai[\s_-]*lab`,
  // SenseTime / SenseNova
  String.raw`sensetime`, String.raw`sensenova`, String.raw`sensechat`,
  // iFlytek / Spark (Xinghuo) — only the model and API shapes, never the bare word
  String.raw`iflytek`, String.raw`xfyun`, String.raw`xf-yun`, String.raw`xinghuo`,
  // "spark" only as a whole id or after a vendor slash or quote, so Meta's "Muse Spark 1.2" is not caught
  String.raw`(?:^|[\/"'])spark[-_]?(?:lite|pro|max|ultra|desk|api|v?\d)`,
  // Inspur / Yuan — the model, not the currency
  String.raw`inspur`, String.raw`ieityuan`, String.raw`\byuan-?\d`,
  // Other PRC labs, clouds and model hosts
  String.raw`siliconflow`, String.raw`meituan`, String.raw`longcat`, String.raw`xiaomi`, String.raw`kwaipilot`, String.raw`kuaishou`,
  String.raw`openbmb`, String.raw`minicpm`, String.raw`skywork`, String.raw`kunlun`, String.raw`\brednote`, String.raw`xiaohongshu`,
  String.raw`dots-studio`, String.raw`\bdots[.-]?(?:llm|ocr|vlm|\d)`, String.raw`huawei`, String.raw`\bpangu`, String.raw`\bbaai\b`, String.raw`\bbge-(?:m3|large|base|small|reranker)`,
  // Arcee's small models distilled from DeepSeek-V3 or built on Qwen (Trinity and AFM are its own, US-trained)
  String.raw`\bvirtuoso-(?:small|medium|large|lite)`, String.raw`\barcee-blitz`, String.raw`\bmaestro-reasoning`,
  // Manus (Butterfly Effect): China-origin agent platform, its Forge gateway, runtime and debug collector.
  // "manus" only as a whole word, so "manuscript" is not caught.
  String.raw`\bmanus(?![a-z])`, String.raw`__manus__`, String.raw`forge\.manus`, String.raw`butterfly-effect`,
  // Taiwan-based labs (suspect under the rule)
  String.raw`\btaide\b`, String.raw`mediatek`, String.raw`taiwan-llm`, String.raw`foxbrain`,
  // Hosts: any PRC, Hong Kong, Macau or Taiwan TLD, and PRC cloud regions (AWS China, Alibaba, Volcengine)
  // (a host inside a URL, so a dotted key such as "fx.cap.CN" is not taken for one)
  String.raw`\/\/[^\/\s?#]*\.(?:cn|hk|mo|tw)(?=[\/:?#]|$)`,
  String.raw`\bcn-(?:north|northwest|east|south|beijing|shanghai|hangzhou|shenzhen|guangzhou|chengdu|qingdao|zhangjiakou)`,
];

export const BANNED_PROVIDER_PATTERN = new RegExp(BANNED_TERMS.join("|"), "i");

/** The one sentence every refusal carries, server and browser alike. */
export const CHINA_POLICY_MESSAGE = "Blocked by firm policy: no China-linked AI models";

/** True when a provider id, name, base URL, chat path or model id is China-linked. */
export function isBannedProvider(value: string | null | undefined): boolean {
  return BANNED_PROVIDER_PATTERN.test(value ?? "");
}

/**
 * Router pseudo-models ("auto", Arcee's "auto-tool", every "openrouter/…"
 * router such as auto, free, fusion and pareto-code, and Sakana's Fugu
 * orchestrator) pick the model after the request leaves us, and every one of
 * them can land on a Chinese model. A model id has to name the model.
 */
export const ROUTER_MODEL_PATTERN = /^(?:[a-z0-9._-]+\/)?auto(?:-[a-z0-9-]+)?$|^~?openrouter\/|^sakana\/fugu/i;

/** True when a model id may not be sent to any provider on this platform. */
export function isBannedModel(model: string | null | undefined): boolean {
  const m = (model ?? "").trim();
  return isBannedProvider(m) || ROUTER_MODEL_PATTERN.test(m);
}

export class ChinaPolicyError extends Error {
  readonly value: string;
  constructor(value: string, where?: string) {
    super(`${CHINA_POLICY_MESSAGE}${where ? ` (${where}: "${value}")` : ` ("${value}")`}.`);
    this.name = "ChinaPolicyError";
    this.value = value;
  }
}

/** Throw when a model id is China-linked or a router that could pick one. */
export function assertModelAllowed(model: string | null | undefined, where = "model"): void {
  if (model && isBannedModel(model)) throw new ChinaPolicyError(model, where);
}

/** Throw when a base URL, host, provider id or name is China-linked. */
export function assertEndpointAllowed(value: string | null | undefined, where = "endpoint"): void {
  if (value && isBannedProvider(value)) throw new ChinaPolicyError(value, where);
}

/** The first China-linked field on a provider definition, or null when it is clean. */
export function providerPolicyViolation(p: Pick<ProviderDefinition, "id" | "name" | "baseUrl" | "chatPath" | "defaultModel" | "suggestedModels">): string | null {
  for (const [field, value] of [["id", p.id], ["name", p.name], ["baseUrl", p.baseUrl], ["chatPath", p.chatPath]] as const) {
    if (isBannedProvider(value)) return `${field}: "${value}"`;
  }
  for (const m of [p.defaultModel, ...p.suggestedModels]) {
    if (isBannedModel(m)) return `model: "${m}"`;
  }
  return null;
}

/** The registry's gate: a China-linked provider is never registered. */
export function assertProviderAllowed(p: ProviderDefinition): void {
  const violation = providerPolicyViolation(p);
  if (violation) throw new ChinaPolicyError(violation.replace(/^[a-zA-Z]+: "|"$/g, ""), `provider ${p.id} ${violation.split(":")[0]}`);
}

// The catalogue is checked when this module loads, so a China-linked entry
// added to PROVIDERS stops the server (and the test suite) before it can serve.
for (const p of PROVIDERS) assertProviderAllowed(p);

export function getProvider(id: string): ProviderDefinition | undefined {
  return PROVIDERS.find(p => p.id === id);
}

/** Prefix that marks a provider the owner defined rather than one we ship. */
export const CUSTOM_PREFIX = "custom-";

export function isCustomProviderId(id: string): boolean {
  return id.startsWith(CUSTOM_PREFIX);
}

/**
 * Build a provider definition from an owner-supplied endpoint.
 *
 * The catalogue above covers the platforms worth pre-configuring, but it will
 * always be behind. Most services expose an OpenAI-compatible endpoint, so a
 * base URL, a key and a model name are enough to reach them through the
 * adapters already written.
 */
export function buildCustomProvider(row: {
  slug: string;
  name: string;
  baseUrl: string;
  chatPath: string;
  wireFormat: string;
  defaultModel: string;
  note?: string | null;
}): ProviderDefinition {
  const wireFormat: WireFormat =
    row.wireFormat === "anthropic" || row.wireFormat === "google-generative"
      ? row.wireFormat
      : "openai-compatible";

  const definition: ProviderDefinition = {
    id: row.slug,
    name: row.name,
    country: "Not specified",
    wireFormat,
    baseUrl: row.baseUrl.replace(/\/$/, ""),
    chatPath: row.chatPath.startsWith("/") ? row.chatPath : `/${row.chatPath}`,
    defaultModel: row.defaultModel,
    suggestedModels: [row.defaultModel],
    keyPattern: /.+/,
    keyHint: "Whatever this service issues",
    consoleUrl: "",
    role: row.note || "Custom endpoint added by the owner.",
  };
  // Refuse to register a China-linked endpoint, whatever route it came in by.
  assertProviderAllowed(definition);
  return definition;
}

/** buildCustomProvider for stored rows: a row saved before the rule widened is skipped, not served. */
export function tryBuildCustomProvider(row: Parameters<typeof buildCustomProvider>[0]): ProviderDefinition | null {
  try {
    return buildCustomProvider(row);
  } catch (e) {
    if (e instanceof ChinaPolicyError) {
      console.error(`[Providers] Custom provider ${row.slug} refused. ${e.message}`);
      return null;
    }
    throw e;
  }
}

/** Sanity-check a custom endpoint before spending a request on it. */
export function validateCustomEndpoint(baseUrl: string, chatPath: string): { ok: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return { ok: false, reason: "The base URL is not a valid URL. It should look like https://api.example.com" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: "The base URL must be http or https." };
  }

  if (isBannedProvider(baseUrl) || isBannedProvider(chatPath)) {
    return { ok: false, reason: `${CHINA_POLICY_MESSAGE}.` };
  }

  const host = parsed.hostname.toLowerCase();
  const isPrivate =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === "[::1]" ||
    host.startsWith("[fd") ||
    host.startsWith("[fe80");

  // This server fetches whatever URL it is handed, so a private address is a
  // way to reach things that are not meant to be publicly reachable.
  if (isPrivate) {
    return {
      ok: false,
      reason:
        "That address is on a private network. The platform would be fetching it on your behalf, which is a route to internal services. Use a publicly routable hostname.",
    };
  }

  if (!chatPath.trim()) {
    return { ok: false, reason: "A completion path is required, e.g. /v1/chat/completions" };
  }

  if (parsed.protocol === "http:") {
    return { ok: true, reason: "This is plain HTTP, so the API key travels unencrypted. Use https unless you control the whole path." };
  }

  return { ok: true };
}

/**
 * Shape check before a key leaves the browser. Deliberately permissive —
 * providers change their key formats, and a false rejection is worse than
 * letting a wrong key through to the test call, which is what actually proves
 * whether it works.
 */
export function looksLikeValidKey(providerId: string, key: string): { ok: boolean; warning?: string } {
  const provider = getProvider(providerId);
  if (!provider) return { ok: false, warning: "Unknown provider." };
  const trimmed = key.trim();
  if (trimmed.length < 8) return { ok: false, warning: "That is too short to be an API key." };
  if (/\s/.test(trimmed)) return { ok: false, warning: "That contains a space — check for a truncated copy or stray line break." };
  if (!provider.keyPattern.test(trimmed)) {
    return {
      ok: true,
      warning: `This does not match the usual ${provider.name} format (${provider.keyHint}). It will still be saved and tested — providers do change their formats.`,
    };
  }
  return { ok: true };
}
