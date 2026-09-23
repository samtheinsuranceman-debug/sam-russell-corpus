/**
 * Brain Hub — the forty brains and forty MCP presets the AI advisor is wired to.
 *
 * These tests guard the catalogue's shape and the owner's standing rules. They
 * never touch the network.
 */
import { describe, expect, it } from "vitest";
import {
  BRAIN_PROVIDERS,
  MAX_BRAINS,
  MAX_MCP_SERVERS,
  PROVIDERS,
  getProvider,
  isBannedProvider,
  looksLikeValidKey,
  validateCustomEndpoint,
} from "@shared/aiProviders";
import { MCP_PRESETS, mcpPresetsByCategory } from "@shared/mcpPresets";
import { environmentCredentials, environmentKeyNames } from "./providerRegistry";

describe("the fifty-five brains", () => {
  it("offers exactly MAX_BRAINS providers to the owner, and no internal gateway", () => {
    expect(MAX_BRAINS).toBe(55);
    expect(BRAIN_PROVIDERS).toHaveLength(MAX_BRAINS);
    expect(PROVIDERS).toHaveLength(MAX_BRAINS);
    expect(getProvider("forge")).toBeUndefined();
  });

  it("carries the fifteen platforms added on 23 Sep 2026, each with a conventional Railway name", () => {
    const added = [
      "inception", "venice", "featherless", "parasail", "arcee", "wandb", "vultr", "edenai",
      "sarvam", "krutrim", "naver-clova", "plamo", "aleph-alpha", "publicai", "databricks",
    ];
    for (const id of added) {
      expect(getProvider(id), id).toBeDefined();
      // The uniform name plus at least one conventional name, so the Railway
      // panel can use either.
      expect(environmentKeyNames(id).length, id).toBeGreaterThanOrEqual(2);
    }
    // Only Databricks needs an account-scoped base URL.
    expect(added.filter(id => getProvider(id)?.requiresBaseUrl)).toEqual(["databricks"]);
  });

  it("every provider id is unique, stable-looking, and every entry is complete", () => {
    const ids = PROVIDERS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PROVIDERS) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
      expect(p.name.length).toBeGreaterThan(1);
      expect(["openai-compatible", "anthropic", "google-generative"]).toContain(p.wireFormat);
      expect(p.chatPath.startsWith("/")).toBe(true);
      expect(p.defaultModel.length).toBeGreaterThan(0);
      expect(p.suggestedModels).toContain(p.defaultModel);
      expect(p.role.length).toBeGreaterThan(10);
      if (p.baseUrl) expect(() => new URL(p.baseUrl)).not.toThrow();
      // A provider with no default base must say it needs one.
      if (!p.baseUrl) expect(p.requiresBaseUrl).toBe(true);
    }
  });

  it("every non-US provider carries a data-handling caution", () => {
    for (const p of BRAIN_PROVIDERS) {
      const us = /United States|Managed|Your infrastructure/.test(p.country);
      if (!us) expect(p.caution, `${p.id} (${p.country}) needs a caution`).toBeTruthy();
    }
  });

  it("key shape checks are permissive: a wrong-looking key warns, only garbage is refused", () => {
    expect(looksLikeValidKey("anthropic", "sk-ant-abcdefghijklmnopqrstuvwxyz").ok).toBe(true);
    expect(looksLikeValidKey("anthropic", "not-an-anthropic-key-but-long-enough").warning).toMatch(/does not match/);
    expect(looksLikeValidKey("anthropic", "short").ok).toBe(false);
    expect(looksLikeValidKey("anthropic", "has a space in it").ok).toBe(false);
    expect(looksLikeValidKey("nope", "whatever").ok).toBe(false);
  });

  it("refuses private-network custom endpoints", () => {
    expect(validateCustomEndpoint("http://localhost:11434", "/v1/chat/completions").ok).toBe(false);
    expect(validateCustomEndpoint("http://10.0.0.5", "/v1/chat/completions").ok).toBe(false);
    expect(validateCustomEndpoint("https://api.example.com", "/v1/chat/completions").ok).toBe(true);
  });
});

describe("the Railway pathway", () => {
  it("every brain has a uniform RCS_BRAIN_<ID>_API_KEY name, first in precedence", () => {
    for (const p of BRAIN_PROVIDERS) {
      const names = environmentKeyNames(p.id);
      expect(names[0]).toBe(`RCS_BRAIN_${p.id.toUpperCase().replace(/-/g, "_")}_API_KEY`);
    }
  });

  it("reads a key from the environment and skips providers that need a base URL without one", () => {
    const saved = { ...process.env };
    try {
      process.env.RCS_BRAIN_SAMBANOVA_API_KEY = "test-sambanova-key-1234567890";
      process.env.RCS_BRAIN_AZURE_OPENAI_API_KEY = "x".repeat(40);
      delete process.env.RCS_BRAIN_AZURE_OPENAI_BASE_URL;
      delete process.env.AZURE_OPENAI_BASE_URL;
      const ids = environmentCredentials().map(c => c.providerId);
      expect(ids).toContain("sambanova");
      expect(ids).not.toContain("azure-openai");
      process.env.RCS_BRAIN_AZURE_OPENAI_BASE_URL = "https://example.openai.azure.com/openai/deployments/gpt-5";
      expect(environmentCredentials().map(c => c.providerId)).toContain("azure-openai");
    } finally {
      for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
      Object.assign(process.env, saved);
    }
  });
});

describe("the forty MCP presets", () => {
  it("offers exactly forty presets with unique slugs", () => {
    expect(MCP_PRESETS).toHaveLength(MAX_MCP_SERVERS);
    expect(new Set(MCP_PRESETS.map(p => p.slug)).size).toBe(MCP_PRESETS.length);
  });

  it("every preset is complete and any published URL is https", () => {
    for (const p of MCP_PRESETS) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.label.length).toBeGreaterThan(1);
      expect(p.role.length).toBeGreaterThan(10);
      expect(p.docsUrl.startsWith("https://")).toBe(true);
      if (p.url) expect(p.url.startsWith("https://")).toBe(true);
      if (p.auth === "header") expect(p.headerName).toBeTruthy();
    }
  });

  it("groups by category with nothing lost", () => {
    const groups = mcpPresetsByCategory();
    const total = Object.values(groups).reduce((n, g) => n + g.length, 0);
    expect(total).toBe(MCP_PRESETS.length);
    expect(groups.search.length).toBeGreaterThan(3);
  });
});
