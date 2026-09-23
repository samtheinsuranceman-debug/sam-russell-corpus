/**
 * Environment-sourced provider keys.
 *
 * Several provider keys live as hosting environment variables and predate the
 * vault. The registry reads them so the platform uses what it already has
 * rather than making the owner re-type keys the server is holding.
 *
 * These tests pin the two behaviours that matter and are easy to break:
 * a vault key must always beat an environment key, and an environment key must
 * never be reported when the variable is empty or absent.
 */
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { environmentCredentials, environmentProviderIds, testEnvironmentKeys } from "./providerRegistry";
import { getProvider } from "@shared/aiProviders";

const TOUCHED = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "PERPLEXITY_API_KEY",
  "GROQ_API_KEY",
  "MISTRAL_API_KEY",
  "ANTHROPIC_MODEL",
  "OPENAI_BASE_URL",
];

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const name of TOUCHED) {
    saved[name] = process.env[name];
    delete process.env[name];
  }
});

afterEach(() => {
  for (const name of TOUCHED) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

describe("environmentCredentials", () => {
  it("returns nothing when no provider variables are set", () => {
    expect(environmentCredentials()).toEqual([]);
    expect(environmentProviderIds()).toEqual([]);
  });

  it("picks up a key that is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
    const found = environmentCredentials();

    expect(found).toHaveLength(1);
    expect(found[0].providerId).toBe("anthropic");
    expect(found[0].apiKey).toBe("sk-ant-test-key");
  });

  it("defaults to the provider's own default model", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
    const [cred] = environmentCredentials();
    expect(cred.model).toBe(getProvider("anthropic")!.defaultModel);
  });

  it("lets <PROVIDER>_MODEL override the model without a code change", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
    process.env.ANTHROPIC_MODEL = "claude-opus-4-1-20250805";

    const [cred] = environmentCredentials();
    expect(cred.model).toBe("claude-opus-4-1-20250805");
  });

  it("lets <PROVIDER>_BASE_URL override the endpoint", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_BASE_URL = "https://gateway.internal.example.com";

    const [cred] = environmentCredentials();
    expect(cred.baseUrlOverride).toBe("https://gateway.internal.example.com");
  });

  it("leaves baseUrlOverride null when no override is set", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect(environmentCredentials()[0].baseUrlOverride).toBeNull();
  });

  it("ignores an empty or whitespace-only variable", () => {
    // Railway hands back "" for a variable that exists but was never filled in.
    // Treating that as a configured key would put a guaranteed-failing provider
    // at the front of the chain.
    process.env.ANTHROPIC_API_KEY = "";
    process.env.OPENAI_API_KEY = "   ";
    expect(environmentCredentials()).toEqual([]);
  });

  it("trims surrounding whitespace from a pasted key", () => {
    process.env.GROQ_API_KEY = "  gsk-test-key  ";
    expect(environmentCredentials()[0].apiKey).toBe("gsk-test-key");
  });

  it("finds every set provider, each with a distinct priority", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-a";
    process.env.OPENAI_API_KEY = "sk-o";
    process.env.PERPLEXITY_API_KEY = "pplx-p";

    const ids = environmentProviderIds();
    expect(ids).toContain("anthropic");
    expect(ids).toContain("openai");
    expect(ids).toContain("perplexity");

    const priorities = environmentCredentials().map(c => c.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });

  it("ranks every environment key below a vault key", () => {
    // Vault priorities are owner-chosen and default to 100. Environment keys
    // are a floor, not a ceiling — a key typed in deliberately must win.
    process.env.ANTHROPIC_API_KEY = "sk-ant-a";
    process.env.OPENAI_API_KEY = "sk-o";

    const VAULT_DEFAULT_PRIORITY = 100;
    for (const cred of environmentCredentials()) {
      expect(cred.priority).toBeGreaterThan(VAULT_DEFAULT_PRIORITY);
    }
  });

  it("tests every environment key through the injected tester and reports the variable name, never the key", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-secret-value-1234567890";
    process.env.MISTRAL_API_KEY = "mistral-secret-value-1234567890";

    const seen: string[] = [];
    const results = await testEnvironmentKeys(async opts => {
      seen.push(opts.providerId);
      if (opts.providerId === "mistral") return { ok: false, kind: "auth", message: "401 from Mistral: invalid key" };
      return { ok: true, model: opts.model ?? "m", latencyMs: 42, reply: "pong" };
    });

    expect(seen.sort()).toEqual(["anthropic", "mistral"]);
    const anthropic = results.find(r => r.providerId === "anthropic")!;
    expect(anthropic.ok).toBe(true);
    expect(anthropic.envName).toBe("ANTHROPIC_API_KEY");
    expect(anthropic.latencyMs).toBe(42);
    const mistral = results.find(r => r.providerId === "mistral")!;
    expect(mistral.ok).toBe(false);
    expect(mistral.message).toMatch(/invalid key/);
    expect(JSON.stringify(results)).not.toMatch(/secret-value/);
  });

  it("names only providers that actually exist in the catalogue", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-a";
    process.env.OPENAI_API_KEY = "sk-o";
    process.env.PERPLEXITY_API_KEY = "pplx-p";

    for (const id of environmentProviderIds()) {
      expect(getProvider(id), `${id} is not a known provider`).toBeDefined();
    }
  });
});

describe("the owner's own Railway spellings", () => {
  // Railway's dashboard cannot rename a variable, so the registry reads the
  // names the owner typed as well as the conventional ones.
  const ALIASES: Array<[string, string]> = [
    ["arcee", "ACREE_API_KEY"],
    ["inception", "INCEPTIONLABS_API_KEY"],
    ["sarvam", "Savram_API_Key"],
  ];

  it("keys the brain from the alias when only the alias is set", async () => {
    const { environmentKeyNames } = await import("./providerRegistry");
    for (const [providerId, alias] of ALIASES) {
      expect(environmentKeyNames(providerId), providerId).toContain(alias);
      const before = process.env[alias];
      process.env[alias] = "alias-key-value";
      try {
        const cred = environmentCredentials().find(c => c.providerId === providerId);
        expect(cred?.apiKey, `${providerId} via ${alias}`).toBe("alias-key-value");
      } finally {
        if (before === undefined) delete process.env[alias];
        else process.env[alias] = before;
      }
    }
  });

  it("prefers the conventional name when both are set", async () => {
    const before = { ARCEE_API_KEY: process.env.ARCEE_API_KEY, ACREE_API_KEY: process.env.ACREE_API_KEY };
    process.env.ARCEE_API_KEY = "conventional";
    process.env.ACREE_API_KEY = "alias";
    try {
      expect(environmentCredentials().find(c => c.providerId === "arcee")?.apiKey).toBe("conventional");
    } finally {
      for (const [k, v] of Object.entries(before)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    }
  });
});
