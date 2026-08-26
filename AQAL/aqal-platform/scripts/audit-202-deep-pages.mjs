import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const port = 9334;
const chrome = spawn("chromium", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/aqal-202-deep-audit-chrome",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error("Chromium debugging endpoint did not start");
}

async function openPage(path) {
  const response = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${base}${path}`)}`,
    { method: "PUT" },
  );
  const target = await response.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
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
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await send("Runtime.evaluate", {
      expression: "Boolean(document.querySelector('#root')?.innerText.trim().length > 100)",
      returnByValue: true,
    });
    if (ready.result.value) break;
    await sleep(250);
  }

  return {
    eval: async (expression) => {
      const result = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      return result.result.value;
    },
    close: () => ws.close(),
  };
}

const navigationChecks = [
  ["line", "/line/emotional/at-work", "/line/emotional/in-relationships", "Emotional intelligence in your relationships"],
  ["pair", "/pair/logical--strategic/collide", "/pair/logical--strategic/train", "Training Logical and Strategic together"],
  ["practice", "/practice/sleep/start", "/practice/sleep/evidence", "The evidence behind Sleep protection"],
  ["goal", "/goal/focus/plan", "/goal/focus/mistakes", "Focus: the mistakes that sink it"],
  ["myth", "/myth/laetrile/receipts", "/myth/laetrile/instead", "What actually works instead of Laetrile"],
  ["capacity", "/capacity/adaptive/signs", "/capacity/adaptive/build", "Building the Adaptive capacity"],
  ["kind", "/kind/psychotherapy/standards", "/kind/psychotherapy/choose", "Choosing a psychotherapy protocol"],
  ["wing", "/wing/miracle-cure/spot", "/wing/miracle-cure/escape", "Getting out of the miracle-cure hall trap"],
];

const parentNavigationChecks = [
  ["line", "/line/emotional", "/line/emotional/at-work", "Emotional intelligence at work"],
  ["pair", "/pair/logical--strategic", "/pair/logical--strategic/collide", "When Logical and Strategic collide"],
  ["practice", "/practice/sleep", "/practice/sleep/start", "Starting Sleep protection"],
  ["goal", "/goal/focus", "/goal/focus/plan", "Focus: the 30-day plan"],
  ["myth", "/myth/laetrile", "/myth/laetrile/feels-real", "Why Laetrile"],
  ["capacity", "/capacity/adaptive", "/capacity/adaptive/signs", "The signs of strong (and weak) Adaptive"],
  ["kind", "/kind/psychotherapy", "/kind/psychotherapy/choose", "Choosing a psychotherapy protocol"],
  ["wing", "/wing/miracle-cure", "/wing/miracle-cure/spot", "How to spot the miracle-cure hall pattern"],
];

const results = [];
try {
  await waitForDebugger();

  for (const [family, from, to, expectedHeading] of parentNavigationChecks) {
    const page = await openPage(from);
    const result = await page.eval(`(async () => {
      const target = document.querySelector('a[href="${to}"]');
      if (!target) return { ok: false, reason: 'Go deeper link missing', from: location.pathname };
      target.click();
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const heading = document.querySelector('h1')?.textContent?.trim() || '';
        if (location.pathname === '${to}' && heading.includes(${JSON.stringify(expectedHeading)}) && !/Something went wrong/i.test(document.body.innerText)) {
          return { ok: true, path: location.pathname, heading };
        }
      }
      return { ok: false, path: location.pathname, heading: document.querySelector('h1')?.textContent?.trim() || '' };
    })()`);
    results.push({ check: `${family} parent Go deeper navigation`, ...result });
    page.close();
  }

  for (const [family, from, to, expectedHeading] of navigationChecks) {
    const page = await openPage(from);
    const result = await page.eval(`(async () => {
      const target = document.querySelector('a[href="${to}"]');
      if (!target) return { ok: false, reason: 'target link missing', from: location.pathname };
      target.click();
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const heading = document.querySelector('h1')?.textContent?.trim() || '';
        if (location.pathname === '${to}' && heading.includes(${JSON.stringify(expectedHeading)})) {
          return { ok: true, path: location.pathname, heading };
        }
      }
      return { ok: false, path: location.pathname, heading: document.querySelector('h1')?.textContent?.trim() || '' };
    })()`);
    results.push({ check: `${family} sibling navigation`, ...result });
    page.close();
  }

  const best = await openPage("/best/psychotherapy/tactical");
  const assessment = await best.eval(`(async () => {
    const target = document.querySelector('a[href="/assessment"]');
    if (!target) return { ok: false, reason: 'assessment CTA missing' };
    target.click();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (location.pathname === '/assessment' && /Every test|BEFORE YOU BEGIN/i.test(document.body.innerText)) {
        return { ok: true, path: location.pathname, heading: document.querySelector('h1')?.textContent?.trim() || null };
      }
    }
    return { ok: false, path: location.pathname, excerpt: document.body.innerText.slice(0, 180) };
  })()`);
  results.push({ check: "ranked protocol assessment CTA", ...assessment });
  best.close();

  const invalid = await openPage("/line/emotional/not-a-real-section");
  const notFound = await invalid.eval(`(() => {
    const text = document.body.innerText;
    return {
      ok: /404|not found|page.*doesn/i.test(text) && !/Something went wrong/i.test(text),
      heading: document.querySelector('h1')?.textContent?.trim() || null,
      excerpt: text.slice(0, 180),
    };
  })()`);
  results.push({ check: "unsupported deep route renders application 404", ...notFound });
  invalid.close();

  const passed = results.every((result) => result.ok);
  await mkdir("validation", { recursive: true });
  await writeFile(
    "validation/202_deep_page_browser_audit.json",
    JSON.stringify({ passed, base, results }, null, 2),
  );
  console.log(JSON.stringify({ passed, results }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  chrome.kill("SIGTERM");
}
