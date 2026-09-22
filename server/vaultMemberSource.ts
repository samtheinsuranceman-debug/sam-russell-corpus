// ============================================================
// VAULT MEMBER SOURCE — the owner panel's 40 API-key slots and 40 MCP-URL
// slots, presented to the hive as one member source.
//
// WHY THIS SHAPE. The hive never asks "which vendor"; it asks a source for
// its members. The owner panel (password-protected, operator-only) stores up
// to 40 provider keys and 40 MCP server URLs. This adapter turns whatever is
// stored into HiveMember objects, so adding a key in the panel adds a brain
// to every page on the site with no code change. Secrets never leave the
// server: `complete()` closes over the key; the roster only ever exposes ids.
//
// WHAT IT DOES NOT DO. It does not read the vault table itself (that table is
// the builder's Brain Hub port, Phase 1). `load` is injected so this file is
// testable now and binds to the real table with one line later.
// ============================================================
import type { HiveMember, HiveMemberSource } from "./hiveMind";

export const VAULT_API_SLOTS = 40;
export const VAULT_MCP_SLOTS = 40;

export interface VaultSlot {
  /** 1..40 within its kind. */
  slot: number;
  kind: "api" | "mcp";
  /** Provider id for api slots (anthropic, openrouter, mistral, groq, gemini, …); label for mcp. */
  providerId: string;
  label: string;
  /** API key (api) or server URL (mcp). Never logged, never returned to a client. */
  secret: string;
  /** Optional model override for api slots. */
  model?: string;
  /** Operator can park a slot without deleting it. */
  enabled?: boolean;
  /** Council domains this member is strong in; the hive asks these members first for that domain. */
  domains?: string[];
}

export type ProviderCaller = (apiKey: string, system: string, user: string) => Promise<string>;

export interface VaultMemberSourceOptions {
  /** Reads the slots (from the vault table, an env JSON, or a test fixture). */
  load: () => Promise<VaultSlot[]>;
  /** Maps a provider id to the trunk's caller for it (ultraAI PROVIDERS[].call). Unknown ids are skipped, never guessed. */
  resolveCaller: (providerId: string) => ProviderCaller | undefined;
  /** Counts the tools an MCP server exposes; optional, defaults to 0 (unknown). */
  probeMcp?: (url: string) => Promise<number>;
}

/** Validates slot numbering and the 40 + 40 ceiling; returns the problems, never throws. */
export function vaultProblems(slots: VaultSlot[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of slots) {
    const cap = s.kind === "api" ? VAULT_API_SLOTS : VAULT_MCP_SLOTS;
    if (!Number.isInteger(s.slot) || s.slot < 1 || s.slot > cap) out.push(`${s.kind} slot ${s.slot} is outside 1..${cap}`);
    const key = `${s.kind}:${s.slot}`;
    if (seen.has(key)) out.push(`${key} is defined twice`);
    seen.add(key);
    if (!s.secret) out.push(`${key} (${s.label}) has an empty secret`);
  }
  return out;
}

export function vaultMemberSource(opts: VaultMemberSourceOptions): HiveMemberSource {
  return {
    id: "vault",
    async members(): Promise<HiveMember[]> {
      const slots = (await opts.load()).filter(s => s.kind === "api" && s.enabled !== false && s.secret);
      const members: HiveMember[] = [];
      for (const s of slots) {
        const call = opts.resolveCaller(s.providerId);
        if (!call) continue; // an id the trunk cannot call is not a member; the roster stays honest
        const key = s.secret;
        members.push({
          providerId: s.providerId,
          label: s.label || s.providerId,
          via: "vault",
          model: s.model,
          domains: s.domains,
          complete: (system, user) => call(key, system, user),
        });
      }
      return members;
    },
    async mcpServers() {
      const slots = (await opts.load()).filter(s => s.kind === "mcp" && s.enabled !== false && s.secret);
      return Promise.all(slots.map(async s => ({
        label: s.label || s.providerId,
        tools: opts.probeMcp ? await opts.probeMcp(s.secret).catch(() => 0) : 0,
      })));
    },
  };
}
