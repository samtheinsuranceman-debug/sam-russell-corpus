/**
 * aiStackRouter — reports which AI models are actually reachable.
 *
 * The client never decides this. The panel renders exactly what this endpoint
 * returns, so a model cannot be made to look connected by editing a constant
 * in the front end. If the credential is not on the server, the panel says so.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  MODEL_REGISTRY,
  REGISTRY_VERIFIED_AS_OF,
  buildModelDisclosure,
  type ConnectionState,
  type ModelEntry,
} from "@shared/aiModelRegistry";
import { ADVISOR_NAME, ADVISOR_ROLE, ADVISOR_DISCLOSURE } from "@shared/aiAdvisor";

/**
 * Cache of models proven to work this boot. Populated when a call succeeds,
 * so "live" means "we have actually used it", not "a key is set".
 */
const provenLive = new Set<string>();

export function markModelLive(modelId: string) {
  provenLive.add(modelId);
}

/**
 * Providers with a key in the vault. Refreshed per request — this is a cheap
 * in-memory lookup behind a 60-second cache in the registry.
 */
async function vaultConfiguredProviders(): Promise<Set<string>> {
  try {
    const { liveProviderIds } = await import("./providerRegistry");
    return new Set(await liveProviderIds());
  } catch {
    return new Set();
  }
}

function hasEnvCredential(entry: ModelEntry): boolean {
  const value = process.env[entry.envVar];
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Map a registry entry to the provider id used by the vault, so a key added
 * in the AI Connector lights up the corresponding row in the panel.
 */
function vaultProviderIdFor(entry: ModelEntry): string | null {
  const byProvider: Record<string, string> = {
    Anthropic: "anthropic",
    OpenAI: "openai",
    "Google DeepMind": "google",
    xAI: "xai",
    Perplexity: "perplexity",
    "Mistral AI": "mistral",
    DeepSeek: "deepseek",
    Cohere: "cohere",
  };
  return byProvider[entry.provider] ?? null;
}

function connectionState(entry: ModelEntry, vaultConfigured: Set<string>): ConnectionState {
  if (provenLive.has(entry.id)) return "live";

  const vaultId = vaultProviderIdFor(entry);
  // A key in the vault means the provider is wired and in the routing chain.
  // It reads "configured" rather than "live" until a call has actually gone
  // through it, because a stored key is not proof of a working one.
  if (vaultId && vaultConfigured.has(vaultId)) return "configured";

  if (hasEnvCredential(entry)) return "configured";
  return "not_connected";
}

export const aiStackRouter = router({
  /**
   * The full roster with live connection state. Public, because the whole
   * point is that a client can see it without an account.
   */
  status: publicProcedure
    .input(z.object({ includeDisconnected: z.boolean().default(true) }).optional())
    .query(async ({ input }) => {
      const includeDisconnected = input?.includeDisconnected ?? true;
      const vaultConfigured = await vaultConfiguredProviders();

      const models = MODEL_REGISTRY.map(entry => ({
        ...entry,
        connection: connectionState(entry, vaultConfigured),
      })).filter(m => includeDisconnected || m.connection !== "not_connected");

      const live = models.filter(m => m.connection === "live");
      const configured = models.filter(m => m.connection === "configured");
      const missing = models.filter(m => m.connection === "not_connected");

      return {
        advisor: {
          name: ADVISOR_NAME,
          role: ADVISOR_ROLE,
          disclosure: ADVISOR_DISCLOSURE,
        },
        registryVerifiedAsOf: REGISTRY_VERIFIED_AS_OF,
        counts: {
          live: live.length,
          configured: configured.length,
          notConnected: missing.length,
          total: models.length,
        },
        /**
         * The one-line truth. Rendered at the top of the panel so nobody has
         * to count rows to work out how many models are really answering.
         */
        headline:
          live.length === 0 && configured.length === 0
            ? "No AI model is currently reachable."
            : live.length === 0
              ? `${configured.length} model${configured.length === 1 ? "" : "s"} configured, none exercised yet this session.`
              : `${live.length} of ${models.length} model${models.length === 1 ? "" : "s"} answering.`,
        disclosure: buildModelDisclosure(live),
        models,
      };
    }),
});
