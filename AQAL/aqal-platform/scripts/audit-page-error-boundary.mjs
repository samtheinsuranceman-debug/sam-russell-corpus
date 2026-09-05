import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:4177";
const port = 9336;
const chrome = spawn("chromium", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/aqal-page-error-audit-chrome",
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

async function connect() {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about%3Ablank`, { method: "PUT" });
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
  return { ws, send };
}

const results = [];
try {
  await waitForDebugger();
  const { ws, send } = await connect();
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Network.setBlockedURLs", { urls: ["*ResearchLibrary-*.js"] });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  try {
    await send("Page.navigate", { url: `${base}/research-library` });
  } catch (error) {
    if (!/navigated or closed/i.test(String(error))) throw error;
  }

  let boundary;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(250);
    try {
      const evaluated = await send("Runtime.evaluate", {
        expression: `(() => {
          const text = document.body.innerText;
          return {
            ready: /Something went wrong on Research Library/.test(text),
            hasRetry: /Try Again/.test(text),
            hasHome: /Go Home/.test(text),
            path: location.pathname,
            excerpt: text.slice(0, 260),
          };
        })()`,
        returnByValue: true,
      });
      boundary = evaluated.result.value;
      if (boundary.ready) break;
    } catch (error) {
      if (!/navigated or closed/i.test(String(error))) throw error;
    }
  }
  results.push({
    check: "forced Research Library lazy-chunk failure is isolated",
    ok: Boolean(boundary?.ready && boundary?.hasRetry && boundary?.hasHome && boundary?.path === "/research-library"),
    ...boundary,
  });

  let homeLinkPresent = false;
  try {
    const clicked = await send("Runtime.evaluate", {
      expression: `(() => {
        const home = document.querySelector('a[href="/"]');
        if (!home) return false;
        home.click();
        return true;
      })()`,
      returnByValue: true,
    });
    homeLinkPresent = Boolean(clicked.result.value);
  } catch (error) {
    if (!/navigated or closed/i.test(String(error))) throw error;
    homeLinkPresent = true;
  }

  let recovery = { ok: false, path: "", heading: "" };
  if (homeLinkPresent) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await sleep(100);
      try {
        const evaluated = await send("Runtime.evaluate", {
          expression: `(() => {
            const heading = document.querySelector('h1')?.textContent?.trim() || '';
            return { ok: location.pathname === '/' && heading.includes('Highest desired outcomes'), path: location.pathname, heading };
          })()`,
          returnByValue: true,
        });
        recovery = evaluated.result.value;
        if (recovery.ok) break;
      } catch (error) {
        if (!/navigated or closed/i.test(String(error))) throw error;
      }
    }
  }
  results.push({ check: "Go Home recovers outside the failed page", ...recovery });

  ws.close();
  const passed = results.every((result) => result.ok);
  await mkdir("validation", { recursive: true });
  await writeFile(
    "validation/500-page-error-boundary-browser.json",
    JSON.stringify({ passed, base, blocked: "*ResearchLibrary-*.js", results }, null, 2),
  );
  console.log(JSON.stringify({ passed, results }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  chrome.kill("SIGTERM");
}
