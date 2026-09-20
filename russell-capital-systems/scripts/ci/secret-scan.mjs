#!/usr/bin/env node
// Secret scan over a diff (or the whole app tree). Patterns are anchored to
// real credential formats, not the word "secret", so the output is short enough
// to read in full. Never prints a full match.
//
//   node scripts/ci/secret-scan.mjs <file>...
//
import { readFileSync, statSync } from "node:fs";

const PATTERNS = [
  ["aws_access_key_id", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, true],
  ["github_token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, true],
  ["openai_key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g, true],
  ["anthropic_key", /\bsk-ant-[A-Za-z0-9_-]{24,}\b/g, true],
  ["stripe_live_key", /\b[rs]k_live_[A-Za-z0-9]{20,}\b/g, true],
  ["google_api_key", /\bAIza[0-9A-Za-z_-]{35}\b/g, true],
  ["private_key_block", /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g, true],
  ["sendgrid_key", /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g, true],
  ["slack_token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, false],
  ["jwt", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, false],
  ["db_url_with_password", /\b(?:mysql|postgres(?:ql)?|mongodb(?:\+srv)?):\/\/[^\s:@/"']+:[^\s:@/"']+@/g, false],
  ["twilio_sid", /\bAC[0-9a-f]{32}\b/gi, false],
];
// A hit whose line looks like a template or an example is reported, not failed.
const PLACEHOLDER = /(your[-_]?|example|placeholder|xxx|<[a-z]|dummy|sample|test[-_]?key|changeme|redacted|USER:PASS|user:password|unused)/i;
const BINARY = /\.(png|jpe?g|webp|gif|ico|pdf|zip|gz|mp4|mp3|woff2?|ttf|otf|bin|lock)$/i;

const files = process.argv.slice(2);
if (!files.length) { console.log("no files to scan"); process.exit(0); }

let hits = 0, hard = 0, scanned = 0;
for (const f of files) {
  if (BINARY.test(f)) continue;
  let text;
  try {
    if (statSync(f).size > 4_000_000) continue;
    text = readFileSync(f, "utf8");
  } catch { continue; }          // deleted in the diff, or unreadable
  scanned++;
  const lines = text.split("\n");
  for (const [name, re, isHard] of PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const lineNo = text.slice(0, m.index).split("\n").length;
      const line = lines[lineNo - 1] ?? "";
      const placeholder = PLACEHOLDER.test(line);
      const preview = `${m[0].slice(0, 10)}…(${m[0].length} chars)`;
      hits++;
      if (isHard && !placeholder) { hard++; console.error(`  [FAIL] ${name}  ${f}:${lineNo}  ${preview}`); }
      else console.log(`  [${placeholder ? "placeholder" : "review"}] ${name}  ${f}:${lineNo}  ${preview}`);
    }
  }
}

console.log(`\nscanned ${scanned} file(s); ${hits} pattern hit(s); ${hard} credential-shaped`);
if (hard) { console.error("Secret scan FAILED: credential-shaped material in the diff."); process.exit(1); }
console.log("Secret scan OK.");
