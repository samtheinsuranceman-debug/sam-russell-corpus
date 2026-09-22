import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashPassphrase, maskSecret, openSecret, passphraseMeetsPolicy, sealSecret, vaultKeyConfigured, verifyPassphrase } from "./ownerVaultCrypto";
import { _resetOwnerVaultForTests, clearSlot, listSlotsMasked, loadSlotsDecrypted, setSlotEnabled, upsertSlot } from "./ownerVaultDb";
import { _setHiveSourcesForTests, hiveMembers, hiveRoster } from "./hiveMind";
import { vaultMemberSource } from "./vaultMemberSource";
import { checkUnlock, _resetOwnerVaultSessionsForTests } from "./ownerVaultRouter";

const KEY = "a".repeat(64);

describe("ownerVaultCrypto", () => {
  it("refuses to seal without OWNER_VAULT_KEY (fail closed)", () => {
    expect(vaultKeyConfigured({})).toBe(false);
    expect(() => sealSecret("sk-1", {})).toThrow(/OWNER_VAULT_KEY/);
  });
  it("round-trips a secret and refuses a different key", () => {
    const sealed = sealSecret("sk-live-abcdef123456", { OWNER_VAULT_KEY: KEY });
    expect(sealed).not.toContain("sk-live");
    expect(openSecret(sealed, { OWNER_VAULT_KEY: KEY })).toBe("sk-live-abcdef123456");
    expect(() => openSecret(sealed, { OWNER_VAULT_KEY: "b".repeat(64) })).toThrow();
  });
  it("masks to a recognisable stub", () => {
    expect(maskSecret("sk-live-abcdef123456")).toBe("sk-…3456 (20 chars)");
    expect(maskSecret("short")).toBe("•••••");
  });
  it("passphrase policy: 33 characters or 16 words", () => {
    expect(passphraseMeetsPolicy("a".repeat(33))).toBe(true);
    expect(passphraseMeetsPolicy("a".repeat(32))).toBe(false);
    expect(passphraseMeetsPolicy(Array(16).fill("w").join(" "))).toBe(true);
    expect(passphraseMeetsPolicy(Array(15).fill("w").join(" "))).toBe(false);
  });
  it("scrypt hash verifies and rejects", () => {
    const stored = hashPassphrase("correct horse battery staple times four for thirty three");
    expect(verifyPassphrase("correct horse battery staple times four for thirty three", stored)).toBe(true);
    expect(verifyPassphrase("wrong", stored)).toBe(false);
    expect(verifyPassphrase("anything", undefined)).toBe(false);
    expect(verifyPassphrase("anything", "bcrypt$x$y")).toBe(false);
  });
});

describe("ownerVaultDb (in-memory, no DATABASE_URL)", () => {
  const original = process.env.OWNER_VAULT_KEY;
  beforeEach(() => { process.env.OWNER_VAULT_KEY = KEY; _resetOwnerVaultForTests(); });
  afterEach(() => { if (original === undefined) delete process.env.OWNER_VAULT_KEY; else process.env.OWNER_VAULT_KEY = original; });

  it("stores sealed, lists masked, decrypts server-side only", async () => {
    await upsertSlot({ kind: "api", slot: 1, providerId: "claude", label: "Anthropic main", secret: "sk-ant-1234567890" }, 7);
    await upsertSlot({ kind: "mcp", slot: 3, providerId: "fred-mcp", label: "FRED", secret: "https://mcp.example/fred" }, 7);
    const masked = await listSlotsMasked();
    expect(masked.map((m) => `${m.kind}:${m.slot}`)).toEqual(["api:1", "mcp:3"]);
    expect(JSON.stringify(masked)).not.toContain("sk-ant-1234567890");
    const plain = await loadSlotsDecrypted();
    expect(plain.find((p) => p.kind === "api")?.secret).toBe("sk-ant-1234567890");
  });
  it("rejects out-of-range slots and empty secrets", async () => {
    await expect(upsertSlot({ kind: "api", slot: 41, providerId: "claude", label: "", secret: "x" }, 1)).rejects.toThrow(/1\.\.40/);
    await expect(upsertSlot({ kind: "api", slot: 1, providerId: "claude", label: "", secret: "   " }, 1)).rejects.toThrow(/empty/);
  });
  it("park and clear", async () => {
    await upsertSlot({ kind: "api", slot: 2, providerId: "groq", label: "Groq", secret: "gsk-1" }, 1);
    await setSlotEnabled("api", 2, false);
    expect((await listSlotsMasked())[0].enabled).toBe(false);
    expect((await loadSlotsDecrypted())[0].enabled).toBe(false);
    expect(await clearSlot("api", 2)).toBe(true);
    expect(await listSlotsMasked()).toEqual([]);
  });
  it("returns nothing decrypted when the key is missing, instead of throwing", async () => {
    await upsertSlot({ kind: "api", slot: 1, providerId: "claude", label: "", secret: "sk-1" }, 1);
    delete process.env.OWNER_VAULT_KEY;
    expect(await loadSlotsDecrypted()).toEqual([]);
    expect((await listSlotsMasked())[0].masked).toMatch(/different key|sealed/);
  });
});

describe("vault → hive", () => {
  const original = process.env.OWNER_VAULT_KEY;
  beforeEach(() => { process.env.OWNER_VAULT_KEY = KEY; _resetOwnerVaultForTests(); _resetOwnerVaultSessionsForTests(); });
  afterEach(() => { _setHiveSourcesForTests(null); if (original === undefined) delete process.env.OWNER_VAULT_KEY; else process.env.OWNER_VAULT_KEY = original; });

  it("a key stored in the panel is a hive member on the next roster read, and the roster never shows it", async () => {
    await upsertSlot({ kind: "api", slot: 5, providerId: "claude", label: "Anthropic (vault)", secret: "sk-ant-vault-9999" }, 1);
    await upsertSlot({ kind: "mcp", slot: 1, providerId: "fred", label: "FRED MCP", secret: "https://mcp.example/fred" }, 1);
    _setHiveSourcesForTests([vaultMemberSource({ load: (await import("./ownerVaultDb")).loadSlotsDecrypted, resolveCaller: () => async (k, _s, u) => `${k.slice(-4)}:${u}` })]);
    const members = await hiveMembers();
    expect(members.map((m) => [m.providerId, m.via])).toEqual([["claude", "vault"]]);
    expect(await members[0].complete("s", "hello")).toBe("9999:hello");
    const roster = await hiveRoster();
    expect(JSON.stringify(roster)).not.toContain("9999");
    expect(roster.mcpServers).toEqual([{ label: "FRED MCP", tools: 0 }]);
  });

  it("unlock uses the scrypt passphrase when configured", async () => {
    const stored = hashPassphrase("sixteen words are enough for the owner panel to open safely every single time ok");
    expect(await checkUnlock({ passphrase: "sixteen words are enough for the owner panel to open safely every single time ok" }, { OWNER_PANEL_PASSPHRASE_HASH: stored })).toBe(true);
    expect(await checkUnlock({ passphrase: "nope" }, { OWNER_PANEL_PASSPHRASE_HASH: stored })).toBe(false);
  });
});
