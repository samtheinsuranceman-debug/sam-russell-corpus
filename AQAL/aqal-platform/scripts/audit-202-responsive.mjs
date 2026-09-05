import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const port = 9335;
const defaultRoutes = [
  "/",
  "/research-library",
  "/line/emotional",
  "/line/volitional",
  "/line/financial",
  "/line/emotional/at-work",
  "/pair/logical--strategic/collide",
  "/practice/sleep/start",
  "/goal/focus/plan",
  "/myth/laetrile/receipts",
  "/capacity/adaptive/signs",
  "/kind/psychotherapy/standards",
  "/wing/miracle-cure/spot",
  "/best/psychotherapy/tactical",
  "/rankings",
  "/hypnosis",
  "/hypnosis/emotional-steadiness",
  "/protocol/emdr/score",
  "/protocol/emdr/daily-life",
  "/compare/bibliotherapy--vs--emdr/switch",
  "/build/adaptive/emdr/plan",
  "/assessment",
  "/corrections",
];
const routes = process.env.RESPONSIVE_ROUTES
  ? process.env.RESPONSIVE_ROUTES.split(",").map((route) => route.trim()).filter(Boolean)
  : defaultRoutes;
const outputFile = process.env.RESPONSIVE_OUTPUT || "validation/500-responsive-audit.json";

const chrome = spawn("chromium", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--window-size=390,844",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/aqal-202-responsive-audit-chrome",
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

async function inspect(path) {
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
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.reload", { ignoreCache: true });

  // The research corpus is intentionally a large lazy chunk; allow slow
  // preview/CDN fetches to hydrate before evaluating the rendered page.
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      const ready = await send("Runtime.evaluate", {
        expression: "Boolean(document.querySelector('#root')?.innerText.trim().length > 100)",
        returnByValue: true,
      });
      if (ready.result.value) break;
    } catch (error) {
      if (!/navigated or closed/i.test(String(error))) throw error;
    }
    await sleep(250);
  }

  const evaluated = await send("Runtime.evaluate", {
    expression: `(() => {
      const root = document.querySelector('#root');
      const text = root?.innerText || '';
      const viewport = document.documentElement.clientWidth;
      const scrollWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth || 0,
        root?.scrollWidth || 0,
      );
      const crashed = /Something went wrong|Application error|Uncaught Error/i.test(text);
      return {
        ok: text.trim().length > 100 && !crashed && scrollWidth <= viewport + 2,
        path: location.pathname,
        title: document.title,
        heading: document.querySelector('h1')?.textContent?.trim() || null,
        textLength: text.length,
        viewport,
        scrollWidth,
        horizontalOverflow: Math.max(0, scrollWidth - viewport),
        crashed,
      };
    })()`,
    returnByValue: true,
  });
  ws.close();
  return evaluated.result.value;
}

const results = [];
try {
  await waitForDebugger();
  for (const route of routes) {
    results.push({ route, ...(await inspect(route)) });
  }
  const passed = results.every((result) => result.ok);
  await mkdir("validation", { recursive: true });
  await writeFile(
    outputFile,
    JSON.stringify({ passed, viewport: [390, 844], base, results }, null, 2),
  );
  console.log(JSON.stringify({ passed, results }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  chrome.kill("SIGTERM");
}
