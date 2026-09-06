#!/usr/bin/env node
// ============================================================
// pnpm mail:check — is the sending domain set up so mail lands in the inbox?
// Looks up the real DNS records for SPF, DKIM and DMARC on the domain of
// MAIL_FROM / SMTP_FROM / SMTP_USER (or a domain passed as the first arg)
// and prints exactly what is missing. Nothing is sent; nothing is invented.
//   node scripts/check_mail_dns.mjs [domain] [--dkim-selector resend]
// ============================================================
import dns from "node:dns/promises";

const args = process.argv.slice(2);
const selectorFlag = args.indexOf("--dkim-selector");
const selectorArg = selectorFlag >= 0 ? args[selectorFlag + 1] : undefined;
const positional = args.filter((a, i) => !a.startsWith("--") && i !== selectorFlag + 1);

function fromEnv() {
  const from = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || "";
  const m = from.match(/<([^>]+)>/);
  const addr = (m ? m[1] : from).trim();
  return addr.includes("@") ? addr.split("@")[1] : "";
}

const domain = (positional[0] || fromEnv() || "russellcapitalsystems.com").toLowerCase();
const selectors = selectorArg ? [selectorArg] : [process.env.MAIL_DKIM_SELECTOR, "resend", "google", "default", "selector1", "selector2", "k1", "mail"].filter(Boolean);

async function txt(name) {
  try { return (await dns.resolveTxt(name)).map((parts) => parts.join("")); }
  catch (e) { return e && (e.code === "ENOTFOUND" || e.code === "ENODATA") ? [] : null; }
}
async function mx(name) {
  try { return await dns.resolveMx(name); } catch { return []; }
}

const results = [];
const ok = (label, detail) => results.push({ ok: true, label, detail });
const bad = (label, detail, fix) => results.push({ ok: false, label, detail, fix });

console.log(`\nChecking mail DNS for ${domain}\n`);

const mxRows = await mx(domain);
if (mxRows.length) ok("MX", mxRows.map((r) => r.exchange).join(", ")); else bad("MX", "no MX record", "Add MX records for your mailbox provider so replies and bounces reach you.");

const root = await txt(domain);
if (root === null) bad("SPF", "DNS lookup failed", "Check the domain's nameservers.");
else {
  const spf = root.filter((r) => r.toLowerCase().startsWith("v=spf1"));
  if (spf.length === 0) bad("SPF", "no v=spf1 record", `Add TXT @ "v=spf1 include:<your-mail-provider> ~all" (Resend: include:amazonses.com; Google Workspace: include:_spf.google.com; cPanel mail: include the host's SPF).`);
  else if (spf.length > 1) bad("SPF", `${spf.length} SPF records (only one is allowed)`, "Merge them into a single v=spf1 record.");
  else {
    const rec = spf[0];
    const mode = process.env.RESEND_API_KEY ? "resend" : process.env.SMTP_HOST ? "smtp" : "none";
    if (mode === "resend" && !/amazonses\.com/i.test(rec)) bad("SPF", rec, "Resend sends through Amazon SES: add include:amazonses.com to the SPF record.");
    else if (/\+all/.test(rec)) bad("SPF", rec, "+all lets anyone send as you; use ~all or -all.");
    else ok("SPF", rec);
  }
}

let dkimFound = null;
for (const s of selectors) {
  const rows = await txt(`${s}._domainkey.${domain}`);
  if (rows && rows.some((r) => /v=DKIM1|k=rsa|p=/i.test(r))) { dkimFound = s; break; }
}
if (dkimFound) ok("DKIM", `selector "${dkimFound}" publishes a key`);
else bad("DKIM", `no key found for selectors: ${selectors.join(", ")}`, "Publish the DKIM TXT record your mail provider gives you (Resend: Domains → Add domain → copy the resend._domainkey record). If your selector has another name, re-run with --dkim-selector <name>.");

const dmarc = await txt(`_dmarc.${domain}`);
if (dmarc === null) bad("DMARC", "DNS lookup failed", "Check the domain's nameservers.");
else {
  const rec = dmarc.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
  if (!rec) bad("DMARC", "no _dmarc record", `Add TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@${domain}" now; move to p=quarantine once reports show only your own mail.`);
  else {
    const p = (rec.match(/p=([a-z]+)/i) || [])[1] || "";
    if (!p) bad("DMARC", rec, "The record needs a policy: p=none, p=quarantine or p=reject.");
    else if (p === "none") ok("DMARC", `${rec} (p=none passes the bulk-sender rule; tighten to quarantine later)`);
    else ok("DMARC", rec);
  }
}

for (const r of results) {
  console.log(`${r.ok ? "✔" : "✘"} ${r.label.padEnd(6)} ${r.detail}`);
  if (!r.ok && r.fix) console.log(`         → ${r.fix}`);
}
const failures = results.filter((r) => !r.ok).length;
console.log(failures === 0
  ? `\nAll checks pass. Keep the spam-complaint rate under 0.1% and mail from ${domain} will stay in the inbox.\n`
  : `\n${failures} item(s) to fix. Mail from ${domain} is likely to be filtered until SPF, DKIM and DMARC all pass.\n`);
process.exit(failures === 0 ? 0 : 1);
