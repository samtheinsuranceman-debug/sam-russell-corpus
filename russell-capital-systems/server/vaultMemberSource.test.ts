import { afterEach, describe, expect, it } from "vitest";
import { _setHiveSourcesForTests, hiveMembers, hiveRoster } from "./hiveMind";
import { vaultMemberSource, vaultProblems, type VaultSlot } from "./vaultMemberSource";

const slots: VaultSlot[] = [
  { slot: 1, kind: "api", providerId: "anthropic", label: "Anthropic (vault)", secret: "k-1" },
  { slot: 2, kind: "api", providerId: "groq", label: "Groq", secret: "k-2", enabled: false },
  { slot: 3, kind: "api", providerId: "unknown-vendor", label: "Nobody", secret: "k-3" },
  { slot: 1, kind: "mcp", providerId: "fred-mcp", label: "FRED MCP", secret: "https://mcp.example/fred" },
];

const callers: Record<string, (k: string, s: string, u: string) => Promise<string>> = {
  anthropic: async (k, _s, u) => `anthropic(${k}): ${u}`,
  groq: async () => "groq",
};

describe("vaultMemberSource", () => {
  afterEach(() => _setHiveSourcesForTests(null));

  it("turns enabled api slots with a known caller into hive members, and nothing else", async () => {
    const src = vaultMemberSource({ load: async () => slots, resolveCaller: id => callers[id] });
    const members = await src.members();
    expect(members.map(m => m.providerId)).toEqual(["anthropic"]); // groq disabled, unknown-vendor skipped
    expect(members[0].via).toBe("vault");
    expect(await members[0].complete("sys", "hello")).toBe("anthropic(k-1): hello");
  });

  it("never exposes the secret through the roster", async () => {
    _setHiveSourcesForTests([vaultMemberSource({ load: async () => slots, resolveCaller: id => callers[id] })]);
    const roster = await hiveRoster();
    expect(JSON.stringify(roster)).not.toContain("k-1");
    expect(roster.members).toEqual([{ providerId: "anthropic", via: "vault" }]);
    expect(roster.mcpServers).toEqual([{ label: "FRED MCP", tools: 0 }]);
  });

  it("registers alongside the env source and de-duplicates by provider id", async () => {
    const env = { id: "env", members: async () => [{ providerId: "anthropic", label: "env", via: "env" as const, complete: async () => "env" }] };
    _setHiveSourcesForTests([vaultMemberSource({ load: async () => slots, resolveCaller: id => callers[id] }), env]);
    const members = await hiveMembers();
    expect(members).toHaveLength(1);
    expect(members[0].via).toBe("vault"); // registered first, so the vault key wins over the env key
  });

  it("reports slot problems instead of throwing", () => {
    const bad: VaultSlot[] = [
      { slot: 41, kind: "api", providerId: "x", label: "x", secret: "s" },
      { slot: 1, kind: "mcp", providerId: "m", label: "m", secret: "" },
      { slot: 1, kind: "mcp", providerId: "m2", label: "m2", secret: "u" },
    ];
    expect(vaultProblems(bad)).toEqual([
      "api slot 41 is outside 1..40",
      "mcp:1 (m) has an empty secret",
      "mcp:1 is defined twice",
    ]);
    expect(vaultProblems(slots)).toEqual([]);
  });
});
