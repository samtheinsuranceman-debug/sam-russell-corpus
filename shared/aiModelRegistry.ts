/**
 * AI Stack Registry — what is actually answering the client.
 *
 * Sam's instruction: the person using this platform should be able to see, on
 * screen, which AI systems they are talking to, which company each belongs to,
 * which country it comes from, which model tier it is out of that company's
 * range, and whether it is the top one.
 *
 * ─── THE RULE THIS FILE ENFORCES ────────────────────────────────────────────
 * The panel reports connection state from the server, not from this list. A
 * model appears as LIVE only when the server confirms a working credential for
 * it. Everything else reads CONFIGURED (key present, not yet exercised) or
 * NOT CONNECTED. Nothing here can make an unconnected model look connected.
 *
 * That matters because the honest answer today is small. At the time this file
 * was written the platform routed every AI call to a single model through one
 * gateway. Publishing a wall of twelve logos would have been a lie told to the
 * exact people — clients deciding what to do with their families' money — who
 * are least able to check it.
 *
 * ─── TIER CLAIMS GO STALE ───────────────────────────────────────────────────
 * "Top tier of N models" is true on a date and false a few months later; these
 * labs ship constantly. Every entry carries `verifiedAsOf`. The panel greys out
 * any claim older than STALE_AFTER_DAYS and shows "needs re-verification"
 * rather than quietly continuing to assert it.
 *
 * When you add a provider: add the entry, set verifiedAsOf to the day you
 * checked the model list, and set the env var name the server looks for.
 */

/** How long a tier claim is allowed to stand before the UI flags it. */
export const STALE_AFTER_DAYS = 120;

/** The day this registry's tier and version claims were last checked. */
export const REGISTRY_VERIFIED_AS_OF = "2026-09-19";

export type ConnectionState =
  /** Server confirmed a credential and a successful call. */
  | "live"
  /** Credential present but the model has not been exercised this boot. */
  | "configured"
  /** No credential. Listed so the roster is honest about what is missing. */
  | "not_connected";

export type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "maximum" | "unknown";

export type ModelEntry = {
  /** Stable key used by the server's routing table. */
  id: string;
  /** Company that makes the model. */
  provider: string;
  /** Country the provider is headquartered in — Sam asked for this explicitly. */
  providerCountry: string;
  /** Product name a client would recognise. */
  productName: string;
  /** Exact model identifier sent on the wire. */
  modelId: string;
  /** Human-readable version label. */
  versionLabel: string;
  /**
   * Where this model sits in the provider's own range on `verifiedAsOf`:
   * 1 = the most capable model they offer.
   */
  tierRank: number;
  /** How many models that provider offered on `verifiedAsOf`. */
  modelsInFamily: number;
  /** True when tierRank === 1 — i.e. we are giving the client the best one. */
  isFlagship: boolean;
  /** Thinking / reasoning budget this platform requests. */
  reasoningEffort: ReasoningEffort;
  /** Context window in tokens, or null if not published. */
  contextWindow: number | null;
  /** What this model is used for here. */
  role: string;
  /** Environment variable the server checks for a credential. */
  envVar: string;
  /** Date the tier and version claims above were last checked. */
  verifiedAsOf: string;
  /** Anything a reader should know that the fields above do not carry. */
  note?: string;
};

/**
 * ─── THE ROSTER ─────────────────────────────────────────────────────────────
 *
 * Ordered by intended role, not by marketing. `not_connected` entries are the
 * honest part of this list: they are what the platform is built to accept and
 * does not yet have.
 *
 * ⚠️ Tier ranks and model IDs below were accurate to the best of our knowledge
 * on REGISTRY_VERIFIED_AS_OF. These labs ship on a scale of weeks. Before this
 * panel is shown to a client, re-check each provider's current model list and
 * update `modelId`, `versionLabel`, `tierRank`, `modelsInFamily` and
 * `verifiedAsOf`. The UI will flag anything stale, but it cannot know that a
 * provider shipped something new yesterday.
 */
export const MODEL_REGISTRY: ModelEntry[] = [
  {
    id: "gateway-gemini-flash",
    provider: "Google DeepMind",
    providerCountry: "United States / United Kingdom",
    productName: "Gemini",
    modelId: "gemini-2.5-flash",
    versionLabel: "Gemini 2.5 Flash",
    tierRank: 3,
    modelsInFamily: 4,
    isFlagship: false,
    reasoningEffort: "minimal",
    contextWindow: 1_000_000,
    role: "Currently handles every AI call on the platform, through the Forge gateway.",
    envVar: "OPENAI_API_KEY",
    verifiedAsOf: "2026-09-19",
    note:
      "This is the only model the platform actually calls today. It is a fast, inexpensive model — not Google's most capable — and the thinking budget is set to 128 tokens, which is close to none. For the multi-step strategy work the advisor is asked to do, this is the single biggest quality constraint on the platform right now. Raising the thinking budget and routing strategy work to a flagship model is the highest-value change available.",
  },
  {
    id: "anthropic-opus",
    provider: "Anthropic",
    providerCountry: "United States",
    productName: "Claude",
    modelId: "claude-opus-5",
    versionLabel: "Claude Opus 5",
    tierRank: 1,
    modelsInFamily: 4,
    isFlagship: true,
    reasoningEffort: "high",
    contextWindow: 200_000,
    role: "Intended: multi-step strategy sequencing, compliance reasoning, long-document analysis.",
    envVar: "ANTHROPIC_API_KEY",
    verifiedAsOf: "2026-09-19",
    note:
      "Claude's current range is Opus 5, Sonnet 5, Fable 5.1 and Haiku 4.5. Opus 5 is the most capable of them. Fable 5.1 is a separate line, not a higher tier than Opus.",
  },
  {
    id: "anthropic-sonnet",
    provider: "Anthropic",
    providerCountry: "United States",
    productName: "Claude",
    modelId: "claude-sonnet-5",
    versionLabel: "Claude Sonnet 5",
    tierRank: 2,
    modelsInFamily: 4,
    isFlagship: false,
    reasoningEffort: "medium",
    contextWindow: 200_000,
    role: "Intended: high-volume analysis where Opus is more than the task needs.",
    envVar: "ANTHROPIC_API_KEY",
    verifiedAsOf: "2026-09-19",
  },
  {
    id: "openai-flagship",
    provider: "OpenAI",
    providerCountry: "United States",
    productName: "GPT",
    modelId: "gpt-5",
    versionLabel: "GPT-5",
    tierRank: 1,
    modelsInFamily: 6,
    isFlagship: true,
    reasoningEffort: "high",
    contextWindow: null,
    role: "Intended: second opinion on strategy sequences, so two independent models must agree before a recommendation surfaces.",
    envVar: "OPENAI_DIRECT_API_KEY",
    verifiedAsOf: "2026-09-19",
    note:
      "Model ID and family size need confirming against OpenAI's current list before this is shown to a client — OpenAI renames and re-tiers frequently.",
  },
  {
    id: "xai-grok",
    provider: "xAI",
    providerCountry: "United States",
    productName: "Grok",
    modelId: "grok-4",
    versionLabel: "Grok 4",
    tierRank: 1,
    modelsInFamily: 3,
    isFlagship: true,
    reasoningEffort: "high",
    contextWindow: null,
    role: "Intended: market commentary and current-events context.",
    envVar: "XAI_API_KEY",
    verifiedAsOf: "2026-09-19",
    note:
      "'SuperGrok' is a consumer subscription tier, not a model. The API model is what appears here. Confirm the current top model ID before publishing.",
  },
  {
    id: "perplexity-sonar",
    provider: "Perplexity",
    providerCountry: "United States",
    productName: "Sonar",
    modelId: "sonar-pro",
    versionLabel: "Sonar Pro",
    tierRank: 1,
    modelsInFamily: 3,
    isFlagship: true,
    reasoningEffort: "medium",
    contextWindow: null,
    role: "Intended: cited web retrieval — current carrier rates, credit card terms, and statutory text with sources attached.",
    envVar: "PERPLEXITY_API_KEY",
    verifiedAsOf: "2026-09-19",
    note: "The only model on this list that returns citations by default, which is why it is the right one for anything that must be verifiable.",
  },
  {
    id: "google-gemini-pro",
    provider: "Google DeepMind",
    providerCountry: "United States / United Kingdom",
    productName: "Gemini",
    modelId: "gemini-2.5-pro",
    versionLabel: "Gemini 2.5 Pro",
    tierRank: 1,
    modelsInFamily: 4,
    isFlagship: true,
    reasoningEffort: "high",
    contextWindow: 2_000_000,
    role: "Intended: whole-portfolio and multi-document analysis where the very large context window earns its place.",
    envVar: "GOOGLE_AI_API_KEY",
    verifiedAsOf: "2026-09-19",
  },
  {
    id: "mistral-large",
    provider: "Mistral AI",
    providerCountry: "France",
    productName: "Mistral",
    modelId: "mistral-large-latest",
    versionLabel: "Mistral Large",
    tierRank: 1,
    modelsInFamily: 5,
    isFlagship: true,
    reasoningEffort: "medium",
    contextWindow: 128_000,
    role: "Intended: EU-hosted option for clients with data-residency requirements.",
    envVar: "MISTRAL_API_KEY",
    verifiedAsOf: "2026-09-19",
  },
  {
    id: "meta-llama",
    provider: "Meta",
    providerCountry: "United States",
    productName: "Llama",
    modelId: "llama-4-maverick",
    versionLabel: "Llama 4 Maverick",
    tierRank: 1,
    modelsInFamily: 3,
    isFlagship: true,
    reasoningEffort: "medium",
    contextWindow: null,
    role: "Intended: self-hostable fallback so the platform is never wholly dependent on one vendor's uptime or pricing.",
    envVar: "LLAMA_API_KEY",
    verifiedAsOf: "2026-09-19",
  },
  {
    id: "deepseek-reasoner",
    provider: "DeepSeek",
    providerCountry: "China",
    productName: "DeepSeek",
    modelId: "deepseek-reasoner",
    versionLabel: "DeepSeek Reasoner",
    tierRank: 1,
    modelsInFamily: 2,
    isFlagship: true,
    reasoningEffort: "high",
    contextWindow: 128_000,
    role: "Intended: long-chain numerical reasoning at low cost.",
    envVar: "DEEPSEEK_API_KEY",
    verifiedAsOf: "2026-09-19",
    note:
      "Hosted in China. Before any client data reaches this provider, confirm that is acceptable under your engagement terms and privacy policy — the panel states the country for exactly this reason.",
  },
  {
    id: "cohere-command",
    provider: "Cohere",
    providerCountry: "Canada",
    productName: "Command",
    modelId: "command-a",
    versionLabel: "Command A",
    tierRank: 1,
    modelsInFamily: 3,
    isFlagship: true,
    reasoningEffort: "medium",
    contextWindow: 256_000,
    role: "Intended: retrieval and reranking across the platform's document library.",
    envVar: "COHERE_API_KEY",
    verifiedAsOf: "2026-09-19",
  },
  {
    id: "amazon-nova",
    provider: "Amazon",
    providerCountry: "United States",
    productName: "Nova",
    modelId: "amazon.nova-pro-v1:0",
    versionLabel: "Nova Pro",
    tierRank: 2,
    modelsInFamily: 4,
    isFlagship: false,
    reasoningEffort: "medium",
    contextWindow: 300_000,
    role: "Intended: AWS-native option for enterprise deployments already inside Bedrock.",
    envVar: "AWS_BEDROCK_ACCESS_KEY",
    verifiedAsOf: "2026-09-19",
  },
];

/** Days since a date string. */
export function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - then) / 86_400_000);
}

/** Should this entry's tier claim still be presented as current? */
export function isClaimStale(entry: ModelEntry): boolean {
  return daysSince(entry.verifiedAsOf) > STALE_AFTER_DAYS;
}

/**
 * The sentence shown under a model in the panel.
 *
 * Deliberately says "of N models we have recorded" rather than "of N models" —
 * we are reporting our own snapshot of a provider's range, not an authoritative
 * count, and the difference is the kind of thing that matters when a client
 * repeats it to someone else.
 */
export function tierSentence(entry: ModelEntry): string {
  if (isClaimStale(entry)) {
    return `Tier information last checked ${entry.verifiedAsOf} and needs re-verification.`;
  }
  if (entry.isFlagship) {
    return `Top tier — the most capable of the ${entry.modelsInFamily} ${entry.provider} models we have recorded, as of ${entry.verifiedAsOf}.`;
  }
  return `Tier ${entry.tierRank} of ${entry.modelsInFamily} ${entry.provider} models we have recorded, as of ${entry.verifiedAsOf}. This is not ${entry.provider}'s most capable model.`;
}

/** Plain-language label for the thinking budget. */
export function effortLabel(effort: ReasoningEffort): string {
  switch (effort) {
    case "minimal": return "Minimal thinking";
    case "low": return "Low thinking";
    case "medium": return "Medium thinking";
    case "high": return "High thinking";
    case "maximum": return "Maximum thinking";
    default: return "Thinking budget not reported";
  }
}

/** Short summary line the advisor can speak when asked what he runs on. */
export function buildModelDisclosure(live: ModelEntry[]): string {
  if (live.length === 0) {
    return "No AI model is currently connected, so I cannot answer analytically right now.";
  }
  if (live.length === 1) {
    const m = live[0];
    return `I am running on ${m.versionLabel} from ${m.provider} (${m.providerCountry}), at ${effortLabel(m.reasoningEffort).toLowerCase()}. ${m.isFlagship ? "That is their most capable model." : `That is tier ${m.tierRank} of ${m.modelsInFamily} — not their most capable model.`}`;
  }
  return `I am running on ${live.length} connected models: ${live.map(m => `${m.versionLabel} (${m.provider})`).join(", ")}.`;
}
