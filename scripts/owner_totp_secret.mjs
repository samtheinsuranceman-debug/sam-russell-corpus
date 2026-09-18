#!/usr/bin/env node
// Generate the authenticator secret for owner sign-in (second factor).
//
//   pnpm owner:totp                 → prints OWNER_TOTP_SECRET and an otpauth:// URI
//   pnpm owner:totp -- you@example.com
//
// 1. Put OWNER_TOTP_SECRET=... in the host's environment panel (never in chat
//    or the repo). 2. Add the otpauth URI to an authenticator app (paste it,
//    or make a QR from it on your own machine). From then on owner sign-in
//    needs email + password + the six-digit code.
import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(buf) {
  let bits = 0, value = 0, out = "";
  for (const b of buf) { value = (value << 8) | b; bits += 8; while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}
const account = process.argv[2] || process.env.OWNER_EMAIL || "owner";
const secret = base32(randomBytes(20));
console.log("\nOWNER_TOTP_SECRET=" + secret);
console.log("\nAuthenticator URI (add to Google Authenticator, 1Password, Authy…):");
console.log(`otpauth://totp/${encodeURIComponent("Russell Capital Systems")}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent("Russell Capital Systems")}&algorithm=SHA1&digits=6&period=30\n`);
