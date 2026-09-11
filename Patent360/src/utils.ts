import crypto from "crypto";

/**
 * Keys whose values should always be redacted when logging.
 */
const REDACTED_KEY_PATTERN = /key|secret|token|password|auth/i;
const REDACTED_VALUE = "[REDACTED]";

/**
 * Recursively walks an arbitrary object/value and redacts any property
 * whose key name matches a sensitive pattern (key, secret, token, password, auth).
 * Returns a JSON string safe for logging.
 */
export function sanitizeLog(obj: unknown): string {
  try {
    const seen = new WeakSet<object>();

    const redact = (value: unknown): unknown => {
      if (value === null || value === undefined) {
        return value;
      }

      if (Array.isArray(value)) {
        return value.map((item) => redact(item));
      }

      if (typeof value === "object") {
        if (seen.has(value as object)) {
          return "[CIRCULAR]";
        }
        seen.add(value as object);

        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
          if (REDACTED_KEY_PATTERN.test(key)) {
            result[key] = REDACTED_VALUE;
          } else {
            result[key] = redact(val);
          }
        }
        return result;
      }

      return value;
    };

    return JSON.stringify(redact(obj));
  } catch {
    return '"[UNSERIALIZABLE_LOG_OBJECT]"';
  }
}

/**
 * Generates a RFC 4122 version 4 UUID.
 */
export function generateRequestId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback UUID v4 generator for older Node runtimes.
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join("-");
}

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  tag: string;
}

export interface CryptoHelper {
  encrypt(plaintext: string, key: string): EncryptedPayload;
  decrypt(iv: string, ciphertext: string, tag: string, key: string): string | null;
}

/**
 * Creates an AES-256-GCM helper for FUTURE use only.
 *
 * This helper is intentionally not wired into any current request path.
 * It exists in anticipation of Railway provider secret integration, at
 * which point secrets may need to be encrypted at rest or in transit
 * within this service. Until that integration lands, this helper is
 * unused dead code kept under test-free, opt-in access.
 *
 * Keys must be 256-bit (32 byte) values, provided as either a 32-character
 * raw string or 64-character hex string.
 */
export function createCryptoHelper(): CryptoHelper {
  const ALGORITHM = "aes-256-gcm";
  const IV_LENGTH = 12; // 96-bit IV recommended for GCM

  const normalizeKey = (key: string): Buffer => {
    // Accept 64-char hex (32 bytes) or exactly 32 raw bytes as utf8.
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
      return Buffer.from(key, "hex");
    }
    const buf = Buffer.from(key, "utf8");
    if (buf.length !== 32) {
      throw new Error("createCryptoHelper requires a 256-bit (32 byte) key");
    }
    return buf;
  };

  return {
    encrypt(plaintext: string, key: string): EncryptedPayload {
      const keyBuf = normalizeKey(key);
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, keyBuf, iv);
      const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
      ]);
      const tag = cipher.getAuthTag();

      return {
        iv: iv.toString("hex"),
        ciphertext: ciphertext.toString("hex"),
        tag: tag.toString("hex"),
      };
    },

    decrypt(iv: string, ciphertext: string, tag: string, key: string): string | null {
      try {
        const keyBuf = normalizeKey(key);
        const decipher = crypto.createDecipheriv(
          ALGORITHM,
          keyBuf,
          Buffer.from(iv, "hex")
        );
        decipher.setAuthTag(Buffer.from(tag, "hex"));
        const plaintext = Buffer.concat([
          decipher.update(Buffer.from(ciphertext, "hex")),
          decipher.final(),
        ]);
        return plaintext.toString("utf8");
      } catch {
        return null;
      }
    },
  };
}
