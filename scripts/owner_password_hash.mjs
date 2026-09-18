#!/usr/bin/env node
// Generate the bcrypt hash for OWNER_PASSWORD_HASH. Run it on your own machine:
//
//   pnpm owner:password            (prompts, input hidden)
//   pnpm owner:password -- 'p@ss'  (argument form; avoid in shared shells)
//
// Put the printed hash in the host's environment panel as OWNER_PASSWORD_HASH,
// together with OWNER_EMAIL. The password itself is never stored anywhere.
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";

const COST = 12;

async function prompt() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
  }
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write("Owner password (input hidden): ");
    const orig = rl._writeToOutput;
    rl._writeToOutput = () => {};
    rl.question("", (answer) => { rl._writeToOutput = orig; process.stdout.write("\n"); rl.close(); resolve(answer); });
  });
}

const password = process.argv[2] ?? (await prompt());
if (!password || password.length < 12 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
  console.error("Use at least 12 characters with a letter and a number.");
  process.exit(1);
}
const hash = await bcrypt.hash(password, COST);
console.log("\nOWNER_PASSWORD_HASH=" + hash);
console.log("\nAdd that line (and OWNER_EMAIL=you@example.com) to the host's environment variables.");
