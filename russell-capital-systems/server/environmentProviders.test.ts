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
import { environmentCredentials, environmentProviderIds } from "./providerRegistry";
import { getProvider } from "@shared/aiProviders";

const TOUCHED = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "PERPLEXITY_API_KEY",
  "GROQ_API_KEY",
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

  it("names only providers that actually exist in the catalogue", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-a";
    process.env.OPENAI_API_KEY = "sk-o";
    process.env.PERPLEXITY_API_KEY = "pplx-p";

    for (const id of environmentProviderIds()) {
      expect(getProvider(id), `${id} is not a known provider`).toBeDefined();
    }
  });
});
