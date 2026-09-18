// ============================================================
// TOTP (RFC 6238) — the second factor for owner sign-in. Pure node:crypto,
// no dependency. The secret lives only in the host environment
// (OWNER_TOTP_SECRET, base32); `pnpm owner:totp` generates one and prints
// the otpauth:// URI for an authenticator app.
// ============================================================
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i]!; bits += 8;
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    value = (value << 5) | ALPHABET.indexOf(clean[i]!); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export function hotp(secret: Buffer, counter: number, digits = 6): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", secret).update(msg).digest();
  const offset = h[h.length - 1]! & 0xf;
  const code = ((h[offset]! & 0x7f) << 24) | (h[offset + 1]! << 16) | (h[offset + 2]! << 8) | h[offset + 3]!;
  return String(code % 10 ** digits).padStart(digits, "0");
}

export function totp(secretBase32: string, at = Date.now(), step = 30, digits = 6): string {
  return hotp(base32Decode(secretBase32), Math.floor(at / 1000 / step), digits);
}

/** Accepts the current code and one step either side (clock drift). Constant-time compare. */
export function verifyTotp(secretBase32: string, code: string, at = Date.now(), window = 1): boolean {
  const c = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(c) || !secretBase32) return false;
  const secret = base32Decode(secretBase32);
  if (secret.length < 10) return false;
  const counter = Math.floor(at / 1000 / 30);
  for (let w = -window; w <= window; w++) {
    const expect = hotp(secret, counter + w);
    if (timingSafeEqual(Buffer.from(expect), Buffer.from(c))) return true;
  }
  return false;
}

export function newSecret(bytes = 20): string { return base32Encode(randomBytes(bytes)); }

export function otpauthUri(secretBase32: string, account: string, issuer = "Russell Capital Systems"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
