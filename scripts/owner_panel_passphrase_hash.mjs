#!/usr/bin/env node
// Generate OWNER_PANEL_PASSPHRASE_HASH for the owner panel (33+ characters or 16+ words).
//
//   node scripts/owner_panel_passphrase_hash.mjs            (prompts, input hidden)
//   node scripts/owner_panel_passphrase_hash.mjs -- '…'     (argument form; avoid in shared shells)
//
// Also prints a fresh OWNER_VAULT_KEY (32 random bytes, hex) if you do not have one yet.
// Put both in the host's environment panel. The passphrase itself is never stored anywhere.
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

async function prompt() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
  }
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write("Owner panel passphrase (input hidden): ");
    const orig = rl._writeToOutput;
    rl._writeToOutput = () => {};
    rl.question("", (answer) => { rl._writeToOutput = orig; process.stdout.write("\n"); rl.close(); resolve(answer); });
  });
}

const p = process.argv[2] ?? (await prompt());
const words = p.trim().split(/\s+/).filter(Boolean).length;
if (!(p.length >= 33 || words >= 16)) {
  console.error(`Rejected: ${p.length} characters and ${words} words; need at least 33 characters or 16 words.`);
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(p.normalize("NFKC"), salt, 64, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
console.log(`OWNER_PANEL_PASSPHRASE_HASH=scrypt$${salt.toString("base64")}$${hash.toString("base64")}`);
console.log(`OWNER_VAULT_KEY=${randomBytes(32).toString("hex")}   # only if you do not already have one; changing it orphans stored keys`);
