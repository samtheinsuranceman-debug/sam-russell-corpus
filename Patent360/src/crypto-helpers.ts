/**
 * Forward-compatibility stub for future symmetric encryption needs.
 *
 * Nothing in the current Patent360 MCP Hub encrypts data at rest or in
 * transit beyond TLS termination handled by Railway's edge. This module
 * exists so future features (e.g. encrypting cached tool output) can
 * adopt AES-256-GCM without introducing a new dependency or API shape
 * later. It is intentionally unused today.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

export interface EncryptedPayload {
  iv: string; // base64
  authTag: string; // base64
  ciphertext: string; // base64
}

/**
 * Encrypts a UTF-8 string using AES-256-GCM.
 *
 * NOTE: This function is not yet wired into any request path. It is
 * provided as a stable building block for future work.
 */
export function encrypt(plaintext: string, key: Buffer): EncryptedPayload {
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(`AES-256-GCM key must be ${KEY_LENGTH_BYTES} bytes`);
  }

  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

/**
 * Decrypts a payload produced by encrypt(). Not currently used.
 */
export function decrypt(payload: EncryptedPayload, key: Buffer): string {
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(`AES-256-GCM key must be ${KEY_LENGTH_BYTES} bytes`);
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

/**
 * Generates a fresh AES-256 key. Not currently used in production paths.
 */
export function generateKey(): Buffer {
  return randomBytes(KEY_LENGTH_BYTES);
}
