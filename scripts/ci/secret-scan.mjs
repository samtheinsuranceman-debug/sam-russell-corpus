// Secret scan over a list of changed files (one path per line on argv[2], or
// stdin). Reports file, line and pattern NAME only — never the matched value.
//
// Self-test: `node scripts/ci/secret-scan.mjs --self-test` plants a synthetic
// key and asserts the scanner catches it. CI runs this first, because a
// scanner that silently matches nothing reports "clean" forever. An earlier
// inline version of this did exactly that.
import { readFileSync, statSync, writeFileSync, unlinkSync } from 'node:fs';

const PATTERNS = [
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['GitHub PAT', /gh[pousr]_[A-Za-z0-9]{36,}/],
  ['OpenAI key', /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ['Anthropic key', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['Stripe live key', /sk_live_[A-Za-z0-9]{16,}/],
  ['Stripe restricted key', /rk_live_[A-Za-z0-9]{16,}/],
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['Slack token', /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ['Private key block', /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY/],
  ['SendGrid key', /SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
  ['Resend key', /re_[A-Za-z0-9]{20,}/],
  ['Twilio SID', /AC[0-9a-f]{32}/],
  ['JWT', /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./],
  ['DB URL with password', /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^\s:@/]+:[^\s:@/]+@[^\s/]+/],
];

// Documented placeholders. Deliberately narrow: a real key that happens to sit
// on a line containing the word "example" should still be reported.
const PLACEHOLDER = /(?:USER:PASS|user:pass|unused:unused|YOUR_[A-Z_]+|<[a-z_]+>|xxxxx|REPLACE_ME)/;
const SKIP_EXT = /\.(png|jpe?g|gif|pdf|ico|webp|woff2?|ttf|zip|mp4|mp3|docx|xlsx|lock)$/i;
const MAX_BYTES = 3_000_000;

function scanFile(path) {
  let text;
  try {
    if (SKIP_EXT.test(path)) return [];
    if (statSync(path).size > MAX_BYTES) return [];
    text = readFileSync(path, 'utf8');
  } catch {
    return []; // deleted or unreadable — nothing to scan
  }
  const hits = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const [name, re] of PATTERNS) {
      if (re.test(line) && !PLACEHOLDER.test(line)) hits.push({ path, line: i + 1, name });
    }
  }
  return hits;
}

function selfTest() {
  const tmp = `/tmp/secret-scan-selftest-${process.pid}.txt`;
  // Synthetic, non-functional, and deliberately not placeholder-shaped.
  writeFileSync(tmp, 'const k = "AKIA' + 'ABCDEFGHIJKLMNOP' + '";\n');
  const hits = scanFile(tmp);
  unlinkSync(tmp);
  if (hits.length === 0) {
    console.log('::error::Secret-scan SELF-TEST FAILED — the scanner did not detect a planted key. It is a no-op. Do not trust a "clean" result.');
    process.exit(1);
  }
  console.log(`Secret-scan self-test passed (detected: ${hits[0].name}).`);
}

const args = process.argv.slice(2);
if (args[0] === '--self-test') {
  selfTest();
  process.exit(0);
}

selfTest(); // always, before scanning anything real

const listFile = args[0];
let files = [];
if (listFile) {
  try {
    files = readFileSync(listFile, 'utf8').split('\n').filter(Boolean);
  } catch {
    console.log(`::error::Cannot read changed-file list at ${listFile}`);
    process.exit(1);
  }
}
console.log(`files to scan: ${files.length}`);

let findings = 0;
for (const f of files) {
  for (const hit of scanFile(f)) {
    findings += 1;
    console.log(
      `::error file=${hit.path},line=${hit.line}::Possible credential (${hit.name}). ` +
        'Value withheld. Remove it and rotate if real; if it is a placeholder, make that obvious.',
    );
  }
}

console.log(`secret scan findings: ${findings}`);
if (findings > 0) process.exit(1);
console.log('Secret scan clean.');
