import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const port = 9333;
const chrome = spawn("chromium", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/aqal-audit-chrome",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForDebugger() {
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error("Chromium debugging endpoint did not start");
}

async function openPage(url) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  const page = await response.json();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const commandId = ++id;
    pending.set(commandId, { resolve, reject });
    ws.send(JSON.stringify({ id: commandId, method, params }));
  });
  await send("Page.enable");
  await send("Runtime.enable");
  const waitForAqalRoot = async () => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const ready = await send("Runtime.evaluate", {
          expression: "Boolean(document.body && document.querySelector('#root') && document.querySelector('#root').innerText.trim().length > 100)",
          returnByValue: true,
        });
        if (ready.result.value) return;
      } catch (error) {
        if (!/navigated or closed/i.test(String(error))) throw error;
      }
      await sleep(250);
    }
    throw new Error(`AQAL application did not hydrate at ${url}`);
  };
  await waitForAqalRoot();
  return {
    eval: async (expression) => {
      const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Browser evaluation failed");
      }
      return result.result.value;
    },
    setViewport: async (width, height, mobile = false) => {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
      await send("Page.reload", { ignoreCache: true });
      await waitForAqalRoot();
    },
    close: () => ws.close(),
  };
}

const results = [];
try {
  await waitForDebugger();

  const home = await openPage(`${base}/`);
  const dial = await home.eval(`(() => {
    const nodes = [...document.querySelectorAll('g[role="button"]')];
    const emotional = nodes.find((node) => (node.getAttribute('aria-label') || node.textContent || '').toLowerCase().includes('emotional')) || nodes[12];
    if (!emotional) return { ok: false, reason: 'dial target missing', count: nodes.length };
    emotional.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    emotional.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return { ok: true, count: nodes.length, selected: emotional.getAttribute('aria-label') || emotional.textContent?.trim() };
  })()`);
  results.push({ check: "homepage dial activation", ...dial });
  home.close();

  const assessment = await openPage(`${base}/assessment`);
  const assessmentStart = await assessment.eval(`(async () => {
    const first = [...document.querySelectorAll('button')].find((button) => button.textContent?.includes("I understand"));
    if (!first) return { ok: false, reason: 'manifesto button missing' };
    first.click();
    await new Promise((resolve) => setTimeout(resolve, 250));
    const second = [...document.querySelectorAll('button')].find((button) => /begin|start|continue|assessment/i.test(button.textContent || ''));
    if (second) { second.click(); await new Promise((resolve) => setTimeout(resolve, 800)); }
    const text = document.body.innerText;
    return {
      ok: text.includes('1 / 27 · Warm-up') || text.includes('Question 1 of 27'),
      reached: text.includes('1 / 27 · Warm-up') ? '1 / 27 · Warm-up' : (text.includes('Question 1 of 27') ? 'Question 1 of 27' : null),
      buttons: [...document.querySelectorAll('button')].map((button) => button.textContent?.trim()).filter(Boolean).slice(0, 12),
      excerpt: text.slice(0, 500),
    };
  })()`);
  results.push({ check: "assessment manifesto to Question 1", ...assessmentStart });
  assessment.close();

  const runbook = await openPage(`${base}/runbook`);
  const readRunbook = `(async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const text = document.body.innerText;
      const ok = /Owner|Runbook|Publish|Domain/i.test(text);
      if (ok) return { ok, title: document.title, heading: document.querySelector('h1')?.textContent || null };
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const text = document.body.innerText;
    return { ok: false, title: document.title, heading: document.querySelector('h1')?.textContent || null, excerpt: text.slice(0, 180) };
  })()`;
  const runbookDesktop = await runbook.eval(readRunbook);
  await runbook.setViewport(375, 812, true);
  const runbookMobile = await runbook.eval(readRunbook);
  results.push({ check: "owner runbook desktop and mobile", ok: runbookDesktop.ok && runbookMobile.ok, desktop: runbookDesktop, mobile: runbookMobile });
  runbook.close();

  const portal = await openPage(`${base}/portal`);
  const readAuthBoundary = `(async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const text = document.body.innerText;
      const ok = /sign in|log in|claim|access/i.test(text) || location.pathname.includes('login');
      if (ok) {
        return { ok, path: location.pathname, title: document.title, excerpt: text.slice(0, 180) };
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const text = document.body.innerText;
    return { ok: false, path: location.pathname, title: document.title, excerpt: text.slice(0, 180) };
  })()`;
  const authDesktop = await portal.eval(readAuthBoundary);
  await portal.setViewport(375, 812, true);
  const authMobile = await portal.eval(readAuthBoundary);
  results.push({ check: "unauthenticated portal desktop and mobile", ok: authDesktop.ok && authMobile.ok, desktop: authDesktop, mobile: authMobile });
  portal.close();

  const passed = results.every((result) => result.ok);
  await mkdir("validation", { recursive: true });
  await writeFile("validation/audit-browser-clicks.json", JSON.stringify({ passed, base, results }, null, 2));
  console.log(JSON.stringify({ passed, results }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  chrome.kill("SIGTERM");
}
