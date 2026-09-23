/**
 * Secret Vault — encrypted storage for provider API keys.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Keys are entered in the admin UI and stored in the database encrypted with
 * AES-256-GCM. They are never returned to the browser in plaintext, never
 * logged, and never leave the server except in the Authorization header of a
 * call to the provider they belong to.
 *
 * ─── THE ONE ENV VAR YOU STILL NEED ─────────────────────────────────────────
 *
 * RCS_VAULT_KEY holds the master key that encrypts everything else. It cannot
 * live in the database, because anything that can decrypt the database cannot
 * be stored in the database. That is not an implementation shortcut — it is
 * the whole point. If the database is ever dumped, backed up to the wrong
 * place, or read by a third-party tool, the provider keys in it are ciphertext
 * and stay ciphertext.
 *
 * So: one env var, set once, never rotated on your schedule. Every provider
 * key after that is managed in the UI.
 *
 * Its value is any passcode the owner types: a sentence, a phrase, a string
 * of words. There is no format and no minimum. The passcode is stretched to
 * the 32-byte AES key with scrypt (fixed salt, since there is exactly one
 * master key per deployment), so a memorable phrase and a random blob both
 * work. A value that already is a 32-byte key in base64 or hex (the form the
 * generator command used to print) is used as the key directly, so a vault
 * set up under the old rule keeps opening its rows.
 *
 * ─── IF YOU LOSE IT ─────────────────────────────────────────────────────────
 *
 * Every stored key becomes unrecoverable. That is by design. Recovery means
 * re-entering the provider keys in the UI, which takes a couple of minutes —
 * keep the master key somewhere you keep other irreplaceable things, and do
 * not rotate it casually.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce, the size GCM is specified for
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const VERSION = "v1";
/** Domain separation for the passcode stretch. Changing it re-keys every vault. */
const PASSCODE_SALT = "russell-capital-systems/rcs-vault/v1";
/** scrypt work factor: ~50 ms once per process, then cached. */
const SCRYPT_COST = 16384;

/** The 64-hex and 43-chars-plus-pad base64 forms the old generator printed. */
const HEX_KEY = /^[0-9a-fA-F]{64}$/;
const BASE64_KEY = /^[A-Za-z0-9+/]{43}=$/;

/** One derivation per distinct passcode per process. */
let cachedFor: string | null = null;
let cachedKey: Buffer | null = null;

export class VaultUnavailableError extends Error {
  readonly code = "VAULT_UNAVAILABLE";
  constructor(message: string) {
    super(message);
    this.name = "VaultUnavailableError";
  }
}

/**
 * Read the master key.
 *
 * Any non-empty value works. A value in the exact 32-byte base64 or hex form
 * is taken as the key itself (vaults set up before passcodes were accepted);
 * anything else is a passcode and is stretched with scrypt. Throws only when
 * the variable is missing — a vault that silently falls back to a derived
 * default is worse than one that refuses to start, because it looks like it
 * is working.
 */
function masterKey(): Buffer {
  const raw = process.env.RCS_VAULT_KEY?.trim();
  if (!raw) {
    throw new VaultUnavailableError(
      "RCS_VAULT_KEY is not set. Set it to any passcode you choose (a phrase, a sentence, anything) in your deployment environment.",
    );
  }
  if (cachedFor === raw && cachedKey) return cachedKey;

  let key: Buffer;
  if (HEX_KEY.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else if (BASE64_KEY.test(raw) && Buffer.from(raw, "base64").length === KEY_BYTES) {
    key = Buffer.from(raw, "base64");
  } else {
    key = scryptSync(raw, PASSCODE_SALT, KEY_BYTES, { N: SCRYPT_COST, r: 8, p: 1 });
  }

  cachedFor = raw;
  cachedKey = key;
  return key;
}

/** Is the vault usable? Used by the UI to show setup instructions rather than errors. */
export function isVaultConfigured(): boolean {
  try {
    masterKey();
    return true;
  } catch {
    return false;
  }
}

/** The reason the vault is unavailable, for the setup screen. */
export function vaultUnavailableReason(): string | null {
  try {
    masterKey();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Vault unavailable.";
  }
}

/**
 * Encrypt a secret.
 *
 * `binding` is mixed in as additional authenticated data — it does not encrypt
 * anything extra, but it means a ciphertext row cannot be copied from one
 * provider to another inside the database. Moving the Anthropic row onto the
 * OpenAI record produces an authentication failure rather than a working key
 * pointed at the wrong service.
 */
export function encryptSecret(plaintext: string, binding: string): string {
  if (!plaintext) throw new Error("Refusing to encrypt an empty secret.");
  const key = masterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(binding, "utf8"));

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64"), ciphertext.toString("base64"), tag.toString("base64")].join(":");
}

/**
 * Decrypt a secret. Throws if the ciphertext was tampered with, was encrypted
 * under a different master key, or is bound to a different provider.
 */
export function decryptSecret(stored: string, binding: string): string {
  const key = masterKey();
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Stored secret is not in a recognised format.");
  }

  const [, ivB64, ctB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("Stored secret has an invalid nonce or authentication tag.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from(binding, "utf8"));
  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    // GCM's authentication failed. Either the master key changed, the row was
    // edited, or it belongs to a different provider. Never report which.
    throw new Error(
      "Could not decrypt this secret. It was stored under a different RCS_VAULT_KEY, or the record has been altered. Re-enter the key.",
    );
  }
}

/**
 * A display form that confirms which key is stored without revealing it.
 *
 * Shows the provider's recognisable prefix and the last four characters —
 * enough to tell "sk-ant-...9xQ2" from "sk-ant-...4vK8" when checking which
 * key is live, and useless to anyone who reads it over your shoulder.
 */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 8) return "•".repeat(8);

  // Keep a known provider prefix intact — it is not secret and it is the part
  // that tells you what kind of key this is.
  const prefixMatch = plaintext.match(/^(sk-ant-|sk-proj-|sk-or-|sk-|xai-|pplx-|gsk_|AIza|csk-)/);
  const prefix = prefixMatch ? prefixMatch[1] : plaintext.slice(0, 3);
  const suffix = plaintext.slice(-4);
  return `${prefix}${"•".repeat(12)}${suffix}`;
}

/** Constant-time string comparison, for anything compared against a secret. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so the timing does not leak the length.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Sanity check that the configured master key can round-trip. Run at boot so a
 * misconfigured key is discovered on deploy rather than on first use.
 */
export function selfTest(): { ok: boolean; error?: string } {
  try {
    const probe = `vault-self-test-${randomBytes(8).toString("hex")}`;
    const sealed = encryptSecret(probe, "self-test");
    const opened = decryptSecret(sealed, "self-test");
    if (opened !== probe) return { ok: false, error: "Round-trip produced a different value." };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
