/**
 * Secret Vault — encryption and key handling.
 *
 * These test the properties that make storing API keys in the database
 * acceptable at all: ciphertext is authenticated, it is bound to its provider,
 * and a wrong master key fails loudly rather than producing garbage.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "crypto";

const GOOD_KEY = randomBytes(32).toString("base64");
const OTHER_KEY = randomBytes(32).toString("base64");

let original: string | undefined;

beforeAll(() => {
  original = process.env.RCS_VAULT_KEY;
  process.env.RCS_VAULT_KEY = GOOD_KEY;
});

afterAll(() => {
  if (original === undefined) delete process.env.RCS_VAULT_KEY;
  else process.env.RCS_VAULT_KEY = original;
});

async function vault() {
  // Re-imported per test group so env changes are picked up — masterKey() reads
  // process.env on every call rather than caching at module load.
  return import("./_core/secretVault");
}

describe("Secret vault — round trip", () => {
  it("encrypts and decrypts a key", async () => {
    const { encryptSecret, decryptSecret } = await vault();
    const secret = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789";
    const sealed = encryptSecret(secret, "anthropic");
    expect(sealed).not.toContain(secret);
    expect(decryptSecret(sealed, "anthropic")).toBe(secret);
  });

  it("produces different ciphertext each time for the same input", async () => {
    const { encryptSecret } = await vault();
    const a = encryptSecret("same-secret-value", "openai");
    const b = encryptSecret("same-secret-value", "openai");
    // A fresh nonce per encryption — identical ciphertexts would leak that two
    // providers share a key.
    expect(a).not.toBe(b);
  });

  it("refuses to encrypt an empty secret", async () => {
    const { encryptSecret } = await vault();
    expect(() => encryptSecret("", "openai")).toThrow();
  });

  it("passes its own self-test", async () => {
    const { selfTest } = await vault();
    expect(selfTest().ok).toBe(true);
  });
});

describe("Secret vault — tamper resistance", () => {
  it("rejects ciphertext bound to a different provider", async () => {
    const { encryptSecret, decryptSecret } = await vault();
    const sealed = encryptSecret("sk-ant-secret-value-here", "anthropic");
    // Moving the Anthropic row onto the OpenAI record must not yield a usable
    // key pointed at the wrong service.
    expect(() => decryptSecret(sealed, "openai")).toThrow(/could not decrypt/i);
  });

  it("rejects modified ciphertext", async () => {
    const { encryptSecret, decryptSecret } = await vault();
    const sealed = encryptSecret("sk-ant-secret-value-here", "anthropic");
    const parts = sealed.split(":");
    const bytes = Buffer.from(parts[2], "base64");
    bytes[0] ^= 0xff;
    parts[2] = bytes.toString("base64");
    expect(() => decryptSecret(parts.join(":"), "anthropic")).toThrow(/could not decrypt/i);
  });

  it("rejects a stripped authentication tag", async () => {
    const { encryptSecret, decryptSecret } = await vault();
    const sealed = encryptSecret("sk-ant-secret-value-here", "anthropic");
    const parts = sealed.split(":");
    parts[3] = Buffer.alloc(16).toString("base64");
    expect(() => decryptSecret(parts.join(":"), "anthropic")).toThrow();
  });

  it("rejects an unrecognised format", async () => {
    const { decryptSecret } = await vault();
    expect(() => decryptSecret("not-a-sealed-secret", "anthropic")).toThrow(/recognised format/i);
    expect(() => decryptSecret("v9:a:b:c", "anthropic")).toThrow(/recognised format/i);
  });

  it("cannot decrypt under a different master key", async () => {
    const { encryptSecret } = await vault();
    const sealed = encryptSecret("sk-ant-secret-value-here", "anthropic");

    process.env.RCS_VAULT_KEY = OTHER_KEY;
    try {
      const { decryptSecret } = await vault();
      expect(() => decryptSecret(sealed, "anthropic")).toThrow(/different RCS_VAULT_KEY/i);
    } finally {
      process.env.RCS_VAULT_KEY = GOOD_KEY;
    }
  });
});

describe("Secret vault — master key validation", () => {
  it("refuses to operate with no master key rather than using a default", async () => {
    delete process.env.RCS_VAULT_KEY;
    try {
      const { encryptSecret, isVaultConfigured, vaultUnavailableReason } = await vault();
      expect(isVaultConfigured()).toBe(false);
      expect(vaultUnavailableReason()).toMatch(/RCS_VAULT_KEY is not set/);
      // A vault that silently falls back to a derived or default key is worse
      // than one that refuses to start, because it looks like it works.
      expect(() => encryptSecret("x", "y")).toThrow(/RCS_VAULT_KEY/);
    } finally {
      process.env.RCS_VAULT_KEY = GOOD_KEY;
    }
  });

  it("accepts any passcode the owner types, with no format or length rule", async () => {
    // The owner's rule: no required word count, no required shape. A phrase
    // with spaces and punctuation, a short word, a long sentence — all work.
    for (const passcode of ["my dog ate the mortgage in 2019!", "x", "The quick brown fox jumps over the lazy dog, forty times over, and never once complains about it."]) {
      process.env.RCS_VAULT_KEY = passcode;
      try {
        const { isVaultConfigured, selfTest, encryptSecret, decryptSecret } = await vault();
        expect(isVaultConfigured(), passcode).toBe(true);
        expect(selfTest().ok, passcode).toBe(true);
        const sealed = encryptSecret("sk-ant-secret-value-here", "anthropic");
        expect(decryptSecret(sealed, "anthropic")).toBe("sk-ant-secret-value-here");
      } finally {
        process.env.RCS_VAULT_KEY = GOOD_KEY;
      }
    }
  });

  it("derives a different key from a different passcode, and the same key from the same one", async () => {
    process.env.RCS_VAULT_KEY = "first passcode";
    let sealed: string;
    try {
      const { encryptSecret } = await vault();
      sealed = encryptSecret("sk-ant-secret-value-here", "anthropic");
    } finally {
      process.env.RCS_VAULT_KEY = GOOD_KEY;
    }
    process.env.RCS_VAULT_KEY = "second passcode";
    try {
      const { decryptSecret } = await vault();
      expect(() => decryptSecret(sealed, "anthropic")).toThrow(/different RCS_VAULT_KEY/i);
    } finally {
      process.env.RCS_VAULT_KEY = GOOD_KEY;
    }
    process.env.RCS_VAULT_KEY = "first passcode";
    try {
      const { decryptSecret } = await vault();
      expect(decryptSecret(sealed, "anthropic")).toBe("sk-ant-secret-value-here");
    } finally {
      process.env.RCS_VAULT_KEY = GOOD_KEY;
    }
  });

  it("uses a 32-byte base64 value as the key itself, so an older vault still opens", async () => {
    // Under the old rule the generator printed exactly this form. Rows sealed
    // under it must keep opening: the value is the key, not a passcode.
    const { createCipheriv } = await import("crypto");
    const keyBytes = Buffer.from(GOOD_KEY, "base64");
    expect(keyBytes.length).toBe(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", keyBytes, iv);
    cipher.setAAD(Buffer.from("anthropic", "utf8"));
    const ct = Buffer.concat([cipher.update("sk-ant-old-row", "utf8"), cipher.final()]);
    const sealed = ["v1", iv.toString("base64"), ct.toString("base64"), cipher.getAuthTag().toString("base64")].join(":");
    const { decryptSecret } = await vault();
    expect(decryptSecret(sealed, "anthropic")).toBe("sk-ant-old-row");
  });

  it("accepts a hex master key as well as base64", async () => {
    process.env.RCS_VAULT_KEY = randomBytes(32).toString("hex");
    try {
      const { selfTest } = await vault();
      expect(selfTest().ok).toBe(true);
    } finally {
      process.env.RCS_VAULT_KEY = GOOD_KEY;
    }
  });
});

describe("Secret vault — masking", () => {
  it("keeps the provider prefix and last four characters, hides the rest", async () => {
    const { maskSecret } = await vault();
    const masked = maskSecret("sk-ant-api03-abcdefghijklmnop9xQ2");
    expect(masked.startsWith("sk-ant-")).toBe(true);
    expect(masked.endsWith("9xQ2")).toBe(true);
    // Enough to tell two keys apart; useless to read over a shoulder.
    expect(masked).not.toContain("api03-abcdefghijklmnop");
  });

  it("distinguishes two keys from the same provider", async () => {
    const { maskSecret } = await vault();
    expect(maskSecret("sk-ant-aaaaaaaaaaaaaaaa9xQ2")).not.toBe(maskSecret("sk-ant-aaaaaaaaaaaaaaaa4vK8"));
  });

  it("reveals nothing about a very short value", async () => {
    const { maskSecret } = await vault();
    expect(maskSecret("short")).toBe("••••••••");
  });
});

describe("Provider key shape checks", () => {
  it("accepts well-formed keys", async () => {
    const { looksLikeValidKey } = await import("../shared/aiProviders");
    expect(looksLikeValidKey("anthropic", "sk-ant-api03-" + "a".repeat(30)).ok).toBe(true);
    expect(looksLikeValidKey("openai", "sk-proj-" + "a".repeat(30)).ok).toBe(true);
    expect(looksLikeValidKey("perplexity", "pplx-" + "a".repeat(30)).ok).toBe(true);
  });

  it("catches a truncated paste and a stray line break", async () => {
    const { looksLikeValidKey } = await import("../shared/aiProviders");
    expect(looksLikeValidKey("anthropic", "sk-ant").ok).toBe(false);
    expect(looksLikeValidKey("anthropic", "sk-ant-abc def").ok).toBe(false);
  });

  it("warns but still allows an unexpected format, since providers change theirs", async () => {
    const { looksLikeValidKey } = await import("../shared/aiProviders");
    const result = looksLikeValidKey("anthropic", "some-new-format-key-2026-abcdefgh");
    expect(result.ok).toBe(true);
    expect(result.warning).toMatch(/does not match the usual/i);
  });
});

describe("Provider catalog", () => {
  it("gives every provider a usable definition", async () => {
    const { PROVIDERS } = await import("../shared/aiProviders");
    for (const p of PROVIDERS) {
      expect(p.id, "id must be set").toBeTruthy();
      expect(p.defaultModel, `${p.id} needs a default model`).toBeTruthy();
      expect(p.suggestedModels.length, `${p.id} needs suggested models`).toBeGreaterThan(0);
      expect(["openai-compatible", "anthropic", "google-generative"]).toContain(p.wireFormat);

      // A provider either ships a working https default, or has no sensible
      // default and must say so in its caution — Azure needs your own resource
      // URL, Ollama needs your own host. A provider with neither would look
      // connectable and silently fail at call time.
      const hasHttpsDefault = p.baseUrl.startsWith("https://");
      const needsOverride = p.baseUrl === "" || p.baseUrl.startsWith("http://");
      if (p.id !== "forge") {
        expect(hasHttpsDefault || needsOverride, `${p.id} base URL`).toBe(true);
        if (needsOverride) {
          expect(p.caution, `${p.id} has no https default, so it must tell the operator to set a Base URL override`)
            .toMatch(/base url|override|your own/i);
        }
      }
    }
  });

  it("uses unique provider ids, since they are GCM bindings", async () => {
    const { PROVIDERS } = await import("../shared/aiProviders");
    const ids = PROVIDERS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("states the country for every provider, including the ones that need it", async () => {
    const { PROVIDERS, getProvider } = await import("../shared/aiProviders");
    for (const p of PROVIDERS) expect(p.country).toBeTruthy();
    // Owner's rule: no Chinese AI system, no Chinese host. The catalogue
    // carries none, and the former entries are refused by the ban.
    const { isBannedProvider } = await import("../shared/aiProviders");
    for (const p of PROVIDERS) expect(p.country).not.toMatch(/china/i);
    for (const gone of ["moonshot", "qwen", "zhipu", "minimax", "qianfan"]) {
      expect(getProvider(gone)).toBeUndefined();
      expect(isBannedProvider(gone)).toBe(true);
    }
    expect(getProvider("novita")).toBeUndefined();
  });
});

describe("Custom providers — any API not in the catalogue", () => {
  it("builds a working definition from an owner-supplied endpoint", async () => {
    const { buildCustomProvider } = await import("../shared/aiProviders");
    const def = buildCustomProvider({
      slug: "custom-mystery-ai",
      name: "Mystery AI",
      baseUrl: "https://api.example.com/",
      chatPath: "v1/chat/completions",
      wireFormat: "openai-compatible",
      defaultModel: "mystery-large",
    });
    // Trailing slash stripped, leading slash added — a pasted URL should work
    // whichever way the operator happens to copy it.
    expect(def.baseUrl).toBe("https://api.example.com");
    expect(def.chatPath).toBe("/v1/chat/completions");
    expect(def.id).toBe("custom-mystery-ai");
  });

  it("falls back to the OpenAI shape for an unrecognised wire format", async () => {
    const { buildCustomProvider } = await import("../shared/aiProviders");
    const def = buildCustomProvider({
      slug: "custom-x", name: "X", baseUrl: "https://a.com", chatPath: "/c",
      wireFormat: "something-invented", defaultModel: "m",
    });
    // Most services speak this shape, so it is the safe default.
    expect(def.wireFormat).toBe("openai-compatible");
  });

  it("applies no key-shape check, since we cannot know what the service issues", async () => {
    const { buildCustomProvider } = await import("../shared/aiProviders");
    const def = buildCustomProvider({
      slug: "custom-x", name: "X", baseUrl: "https://a.com", chatPath: "/c",
      wireFormat: "openai-compatible", defaultModel: "m",
    });
    // A false rejection here would block a working key for no reason.
    expect(def.keyPattern.test("literally-anything-at-all")).toBe(true);
  });

  it("distinguishes a custom id from a catalogue id", async () => {
    const { isCustomProviderId } = await import("../shared/aiProviders");
    expect(isCustomProviderId("custom-mystery-ai")).toBe(true);
    expect(isCustomProviderId("anthropic")).toBe(false);
  });

  it("blocks private address space on a custom endpoint too", async () => {
    const { validateCustomEndpoint } = await import("../shared/aiProviders");
    // Same reasoning as the MCP guard — the server fetches whatever it is given.
    for (const host of ["http://10.0.0.5", "http://169.254.169.254", "http://localhost:8080", "http://192.168.1.1"]) {
      expect(validateCustomEndpoint(host, "/v1/chat/completions").ok, `${host} must be blocked`).toBe(false);
    }
    expect(validateCustomEndpoint("https://api.example.com", "/v1/chat/completions").ok).toBe(true);
  });

  it("requires a completion path and a parseable base URL", async () => {
    const { validateCustomEndpoint } = await import("../shared/aiProviders");
    expect(validateCustomEndpoint("https://api.example.com", "").ok).toBe(false);
    expect(validateCustomEndpoint("not-a-url", "/v1/chat").ok).toBe(false);
    expect(validateCustomEndpoint("ftp://example.com", "/v1/chat").ok).toBe(false);
  });

  it("warns that plain HTTP sends the key in the clear", async () => {
    const { validateCustomEndpoint } = await import("../shared/aiProviders");
    const r = validateCustomEndpoint("http://api.example.com", "/v1/chat/completions");
    expect(r.ok).toBe(true);
    expect(r.reason).toMatch(/unencrypted|https/i);
  });
});
