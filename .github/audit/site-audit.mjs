// Outside-in functional audit of the live Russell Capital Systems site.
// Crawls every reachable internal page, clicks visible buttons on the public
// pages, exercises the homepage lead form and the login form, checks external
// links, and writes report.json + screenshots/.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.BASE_URL || "https://web-production-4b215.up.railway.app").replace(/\/$/, "");
const APEX = process.env.APEX_URL || "https://russellcapitalsystems.com/";
const MAX_PAGES = Number(process.env.MAX_PAGES || 90);
const CLICK_PAGES = ["/", "/pricing", "/support", "/calculators", "/ultra-calculator", "/fact-finder", "/for", "/login", "/register", "/forgot-password", "/trial", "/onboarding", "/privacy", "/terms"];
const SKIP_BUTTON = /sign ?out|log ?out|delete|remove|pay now|purchase|checkout|subscribe|cancel account/i;
const OUT = process.env.OUT_DIR || "audit-out";
fs.mkdirSync(path.join(OUT, "screenshots"), { recursive: true });

const origin = new URL(BASE).origin;
const report = { base: BASE, startedAt: new Date().toISOString(), apex: null, sitemap: null, pages: [], buttons: [], forms: [], externalLinks: [], summary: {} };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, userAgent: "Mozilla/5.0 rcs-site-audit", ignoreHTTPSErrors: false });

function attach(page) {
  const logs = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  page.on("console", (m) => { if (m.type() === "error") logs.consoleErrors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => logs.pageErrors.push(String(e).slice(0, 300)));
  page.on("response", (r) => { const u = r.url(); if (r.status() >= 400 && u.startsWith(origin)) logs.failedRequests.push(`${r.status()} ${r.request().method()} ${u.slice(0, 200)}`); });
  page.on("requestfailed", (r) => { const u = r.url(); if (u.startsWith(origin)) logs.failedRequests.push(`FAILED ${r.method()} ${u.slice(0, 200)} ${r.failure()?.errorText || ""}`); });
  page.on("dialog", async (d) => { logs.consoleErrors.push(`dialog:${d.type()}:${d.message().slice(0, 100)}`); await d.dismiss().catch(() => {}); });
  return logs;
}
const snap = (logs) => ({ c: logs.consoleErrors.length, p: logs.pageErrors.length, f: logs.failedRequests.length });
const since = (logs, s) => ({ consoleErrors: logs.consoleErrors.slice(s.c), pageErrors: logs.pageErrors.slice(s.p), failedRequests: logs.failedRequests.slice(s.f) });
const norm = (href) => { try { const u = new URL(href, BASE); if (u.origin !== origin) return null; u.hash = ""; return u.pathname + u.search; } catch { return null; } };
const safeName = (p) => (p.replace(/[^a-z0-9]+/gi, "_").slice(0, 80) || "root");

async function gotoSafe(page, url) {
  try { return await page.goto(url, { waitUntil: "networkidle", timeout: 35000 }); }
  catch { try { return await page.goto(url, { waitUntil: "load", timeout: 35000 }); } catch (e) { return { error: String(e) }; } }
}

// ---- apex redirect ---------------------------------------------------------
{
  const page = await ctx.newPage(); const logs = attach(page);
  const r = await gotoSafe(page, APEX);
  await page.waitForTimeout(4000);
  report.apex = { requested: APEX, status: r?.status?.() ?? null, finalUrl: page.url(), title: await page.title().catch(() => ""), landsOnApp: page.url().startsWith(origin), ...since(logs, { c: 0, p: 0, f: 0 }) };
  await page.screenshot({ path: path.join(OUT, "screenshots", "apex.jpg"), type: "jpeg", quality: 50, fullPage: false }).catch(() => {});
  await page.close();
}

// ---- seeds: sitemap + home ---------------------------------------------------
const queue = ["/"]; const seen = new Set(["/"]);
try {
  const res = await fetch(`${BASE}/sitemap.xml`); const txt = res.ok ? await res.text() : "";
  const locs = [...txt.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => norm(m[1])).filter(Boolean);
  report.sitemap = { status: res.status, count: locs.length };
  for (const l of locs) if (!seen.has(l)) { seen.add(l); queue.push(l); }
} catch (e) { report.sitemap = { error: String(e) }; }
for (const r of ["/robots.txt"]) { try { const res = await fetch(`${BASE}${r}`); report[r] = res.status; } catch {} }

// ---- crawl -------------------------------------------------------------------
const externals = new Set();
while (queue.length && report.pages.length < MAX_PAGES) {
  const p = queue.shift();
  const page = await ctx.newPage(); const logs = attach(page);
  const t0 = Date.now();
  const resp = await gotoSafe(page, BASE + p);
  await page.waitForTimeout(800);
  const finalUrl = page.url();
  const title = await page.title().catch(() => "");
  const text = await page.evaluate(() => document.body?.innerText || "").catch(() => "");
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href"))).catch(() => []);
  const buttonCount = await page.locator("button:visible").count().catch(() => 0);
  for (const h of hrefs) {
    if (!h || h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("javascript:")) continue;
    const n = norm(h);
    if (n === null) { try { const u = new URL(h, BASE); if (/^https?:/.test(u.protocol)) externals.add(u.href); } catch {} continue; }
    if (/logout|sign-out|signout/.test(n)) continue;
    if (!seen.has(n)) { seen.add(n); queue.push(n); }
  }
  const gated = p.startsWith("/portal") && /\/login/.test(finalUrl);
  const notFound = /page not found|cannot get|404/i.test(title) || /^\s*(404|not found)/i.test(text) || /page not found/i.test(text);
  const crashed = /something went wrong|application error|unexpected error|error boundary/i.test(text);
  const entry = { path: p, status: resp?.status?.() ?? (resp?.error ? "NAV_ERROR" : null), navError: resp?.error, finalUrl, title, textChars: text.length, links: hrefs.length, buttons: buttonCount, gatedRedirect: gated, notFound, crashed, ms: Date.now() - t0, ...since(logs, { c: 0, p: 0, f: 0 }) };
  entry.ok = !entry.navError && (entry.status === 200 || (gated && entry.status)) && !notFound && !crashed && entry.pageErrors.length === 0 && entry.textChars > 40;
  report.pages.push(entry);
  await page.screenshot({ path: path.join(OUT, "screenshots", safeName(p) + ".jpg"), type: "jpeg", quality: 45, fullPage: false }).catch(() => {});
  await page.close();
}

// ---- buttons on public pages --------------------------------------------------
for (const p of CLICK_PAGES) {
  const probe = await ctx.newPage(); const l0 = attach(probe);
  const r0 = await gotoSafe(probe, BASE + p);
  if (!r0 || r0.error || (r0.status && r0.status() >= 400)) { await probe.close(); continue; }
  const labels = await probe.locator("button:visible").evaluateAll((bs) => bs.map((b) => (b.innerText || b.getAttribute("aria-label") || "").trim().slice(0, 60))).catch(() => []);
  await probe.close();
  const n = Math.min(labels.length, 40);
  for (let i = 0; i < n; i++) {
    const label = labels[i];
    if (SKIP_BUTTON.test(label)) { report.buttons.push({ page: p, index: i, label, skipped: true }); continue; }
    const page = await ctx.newPage(); const logs = attach(page);
    await gotoSafe(page, BASE + p);
    const s = snap(logs);
    const btn = page.locator("button:visible").nth(i);
    const rec = { page: p, index: i, label, clicked: false };
    try {
      await btn.scrollIntoViewIfNeeded({ timeout: 4000 });
      await btn.click({ timeout: 5000 });
      rec.clicked = true;
      await page.waitForTimeout(1500);
      rec.urlAfter = page.url();
      rec.navigated = page.url() !== BASE + p && page.url() !== BASE + p + "/";
      rec.dialogOpen = (await page.locator("[role=dialog]:visible, [role=alertdialog]:visible").count().catch(() => 0)) > 0;
      rec.bodyChanged = true;
    } catch (e) { rec.error = String(e).split("\n")[0].slice(0, 200); }
    Object.assign(rec, since(logs, s));
    rec.ok = rec.clicked && rec.pageErrors.length === 0 && !rec.error;
    report.buttons.push(rec);
    await page.close();
  }
}

// ---- forms ---------------------------------------------------------------------
async function formTest(name, path_, fn) {
  const page = await ctx.newPage(); const logs = attach(page);
  await gotoSafe(page, BASE + path_);
  const s = snap(logs);
  const rec = { name, path: path_ };
  try { Object.assign(rec, await fn(page)); } catch (e) { rec.error = String(e).split("\n")[0].slice(0, 300); }
  Object.assign(rec, since(logs, s));
  rec.ok = !rec.error && rec.pageErrors.length === 0 && rec.result !== "no-change";
  await page.screenshot({ path: path.join(OUT, "screenshots", "form_" + safeName(name) + ".jpg"), type: "jpeg", quality: 45 }).catch(() => {});
  report.forms.push(rec);
  await page.close();
}

await formTest("homepage lead form", "/", async (page) => {
  const sec = page.locator("#planning-estimator");
  if ((await sec.count()) === 0) return { result: "section-missing" };
  await sec.scrollIntoViewIfNeeded();
  await page.getByLabel("First name").fill("AUDIT");
  await page.getByLabel("Last name").fill("TEST-IGNORE");
  await page.getByLabel("Email").first().fill("site-audit@example.com");
  await page.getByLabel("Phone").fill("0000000000");
  await page.getByLabel("Your W-2 earnings").fill("350000");
  await page.getByLabel("Your estimated annual taxes").fill("90000");
  await page.getByLabel("Goals").fill("Automated site audit submission. Please ignore.");
  await page.getByLabel(/Consent to be contacted/).check();
  const before = await sec.innerText();
  const submit = sec.locator("button", { hasText: /shape of my plan/i }).first();
  await submit.click({ timeout: 5000 });
  await page.waitForTimeout(6000);
  const after = await sec.innerText().catch(() => (await page.locator("body").innerText()));
  return { result: after !== before ? "changed" : "no-change", afterSnippet: after.replace(/\s+/g, " ").slice(0, 400) };
});

await formTest("login with wrong password", "/login", async (page) => {
  const email = page.locator("input[type=email], input[name=email], input[autocomplete=username]").first();
  const pass = page.locator("input[type=password]").first();
  if ((await email.count()) === 0 || (await pass.count()) === 0) return { result: "fields-missing" };
  await email.fill("site-audit@example.com"); await pass.fill("definitely-wrong-password");
  const before = await page.locator("body").innerText();
  await page.locator("button[type=submit], form button").first().click({ timeout: 5000 });
  await page.waitForTimeout(5000);
  const after = await page.locator("body").innerText();
  return { result: after !== before ? "changed" : "no-change", url: page.url(), afterSnippet: after.replace(/\s+/g, " ").slice(0, 300) };
});

await formTest("homepage estimator inputs", "/", async (page) => {
  const inputs = page.locator("input[type=number]:visible, input[inputmode=numeric]:visible, input[inputmode=decimal]:visible");
  const n = await inputs.count();
  if (n === 0) return { result: "no-numeric-inputs" };
  const first = inputs.first();
  await first.scrollIntoViewIfNeeded();
  const before = await page.locator("body").innerText();
  await first.fill("425000");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(1500);
  const after = await page.locator("body").innerText();
  return { result: after !== before ? "changed" : "no-change", numericInputs: n };
});

// ---- external links --------------------------------------------------------------
for (const href of [...externals].slice(0, 60)) {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
    let res = await fetch(href, { method: "HEAD", redirect: "follow", signal: ctl.signal, headers: { "user-agent": "Mozilla/5.0 rcs-site-audit" } }).catch(() => null);
    if (!res || res.status === 405 || res.status === 403) res = await fetch(href, { method: "GET", redirect: "follow", signal: ctl.signal, headers: { "user-agent": "Mozilla/5.0 rcs-site-audit" } }).catch(() => null);
    clearTimeout(t);
    report.externalLinks.push({ href, status: res ? res.status : "ERR", ok: !!res && res.status < 400 });
  } catch (e) { report.externalLinks.push({ href, status: "ERR", error: String(e).slice(0, 100), ok: false }); }
}

await browser.close();

// ---- summary ------------------------------------------------------------------------
const badPages = report.pages.filter((p) => !p.ok);
const badButtons = report.buttons.filter((b) => !b.skipped && !b.ok);
const badForms = report.forms.filter((f) => !f.ok);
const badExternal = report.externalLinks.filter((e) => !e.ok);
report.summary = {
  apexLandsOnApp: report.apex?.landsOnApp, apexFinalUrl: report.apex?.finalUrl,
  pagesCrawled: report.pages.length, pagesOk: report.pages.length - badPages.length, pagesBad: badPages.map((p) => ({ path: p.path, status: p.status, notFound: p.notFound, crashed: p.crashed, pageErrors: p.pageErrors.slice(0, 2), textChars: p.textChars })),
  consoleErrorPages: report.pages.filter((p) => p.consoleErrors.length).map((p) => ({ path: p.path, errors: [...new Set(p.consoleErrors)].slice(0, 3) })),
  failedRequestPages: report.pages.filter((p) => p.failedRequests.length).map((p) => ({ path: p.path, failed: [...new Set(p.failedRequests)].slice(0, 4) })),
  buttonsClicked: report.buttons.filter((b) => b.clicked).length, buttonsBad: badButtons.map((b) => ({ page: b.page, label: b.label, error: b.error, pageErrors: b.pageErrors.slice(0, 2) })),
  forms: report.forms.map((f) => ({ name: f.name, ok: f.ok, result: f.result, error: f.error, snippet: f.afterSnippet })),
  externalChecked: report.externalLinks.length, externalBad: badExternal,
};
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("=== AUDIT SUMMARY ===");
console.log(JSON.stringify(report.summary, null, 2));
console.log("=== PAGES ===");
for (const p of report.pages) console.log(`${p.ok ? "OK " : "BAD"} ${String(p.status).padEnd(4)} ${p.path.padEnd(40)} ${p.gatedRedirect ? "[gated→login] " : ""}${p.title.slice(0, 50)} btn=${p.buttons} c=${p.consoleErrors.length} f=${p.failedRequests.length}`);
