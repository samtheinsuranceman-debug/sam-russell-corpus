/**
 * AI Provider Definitions — the forty brains Thomas Goldman can be wired to.
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
 *   • DeepSeek is not part of this platform (owner's rule, 2026-09-06). It is
 *     not listed here, not suggested as a model on any other provider, and
 *     the registry refuses a custom endpoint that points at it.
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
export const MAX_BRAINS = 40;
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
    suggestedModels: ["sonar-pro", "sonar", "sonar-reasoning-pro"],
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

  // ─── Internal: the gateway the platform shipped with ────────────────────
  {
    id: "forge",
    name: "Built-in Gateway",
    country: "Managed",
    wireFormat: "openai-compatible",
    baseUrl: "",
    chatPath: "/v1/chat/completions",
    defaultModel: "gemini-2.5-flash",
    suggestedModels: ["gemini-2.5-flash"],
    keyPattern: /.+/,
    keyHint: "Configured by the hosting environment",
    consoleUrl: "",
    role: "The gateway the platform shipped with. Kept as a last-resort fallback so the advisor still answers if every other provider is down.",
    caution: "Routes to a fast, non-flagship model with a minimal reasoning budget. Adequate as a fallback; not what should be answering a strategy question.",
  },
];

/** The forty brains the owner can wire — everything except the internal gateway. */
export const BRAIN_PROVIDERS: ProviderDefinition[] = PROVIDERS.filter(p => p.id !== "forge");

/**
 * Owner's standing rule: DeepSeek is not part of this platform. Any endpoint
 * or model that names it is refused at the registry.
 */
/**
 * Owner's standing rule (2026-09-06, widened 2026-09-22): no Chinese AI system
 * on this platform, and nothing that resolves to a Chinese host. Any provider,
 * model name, base URL or chat path that names one is refused at the registry,
 * including custom endpoints. Open-weight Chinese models served by other hosts
 * are not suggested either.
 */
export const BANNED_PROVIDER_PATTERN =
  /deepseek|moonshot|\bkimi|qwen|dashscope|aliyun|alibaba|zhipu|bigmodel|z\.ai|\bglm|minimax|baidu|qianfan|ernie|01\.ai|baichuan|stepfun|siliconflow|sensetime|iflytek|tencent|hunyuan|bytedance|doubao|volcengine|\.cn(?:[\/:]|$)/i;

export function isBannedProvider(value: string): boolean {
  return BANNED_PROVIDER_PATTERN.test(value ?? "");
}

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

  return {
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
    return { ok: false, reason: "That provider is excluded from this platform by the owner's standing rule." };
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
