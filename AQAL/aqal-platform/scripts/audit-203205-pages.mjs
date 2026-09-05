import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const port = 9337;
const chrome = spawn("chromium", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/aqal-203205-audit-chrome",
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
    const handlers = pending.get(message.id);
    pending.delete(message.id);
    message.error ? handlers.reject(new Error(message.error.message)) : handlers.resolve(message.result);
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
      const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    },
    close: () => ws.close(),
  };
}

async function clickAndVerify(from, selector, to, headingPart) {
  const page = await openPage(from);
  const result = await page.eval(`(async () => {
    let target = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      target = document.querySelector(${JSON.stringify(selector)});
      if (target) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!target) return { ok: false, reason: 'target link missing after hydration wait', from: location.pathname, selector: ${JSON.stringify(selector)}, excerpt: document.body.innerText.slice(0, 180) };
    target.click();
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const heading = document.querySelector('h1')?.textContent?.trim() || '';
      const crashed = /Something went wrong/i.test(document.body.innerText);
      if (location.pathname === ${JSON.stringify(to)} && heading.includes(${JSON.stringify(headingPart)}) && !crashed) {
        return { ok: true, path: location.pathname, heading };
      }
    }
    return { ok: false, path: location.pathname, heading: document.querySelector('h1')?.textContent?.trim() || '', excerpt: document.body.innerText.slice(0, 180) };
  })()`);
  page.close();
  return result;
}

const results = [];
try {
  await waitForDebugger();

  const checks = [
    ["therapy parent to score", "/protocol/emdr", 'a[href="/protocol/emdr/score"]', "/protocol/emdr/score", "EMDR: the full scorecard"],
    ["comparison parent to verdict", "/compare/bibliotherapy--vs--emdr", 'a[href="/compare/bibliotherapy--vs--emdr/verdict"]', "/compare/bibliotherapy--vs--emdr/verdict", "Bibliotherapy vs EMDR: the verdict"],
    ["comparison parent to switch", "/compare/bibliotherapy--vs--emdr", 'a[href="/compare/bibliotherapy--vs--emdr/switch"]', "/compare/bibliotherapy--vs--emdr/switch", "when to switch"],
    ["build parent to plan", "/build/adaptive/emdr", 'a[href="/build/adaptive/emdr/plan"]', "/build/adaptive/emdr/plan", "The Adaptive-building plan: EMDR"],
    ["hypnosis hub to first session", "/hypnosis", 'a[href="/hypnosis/emotional-steadiness"]', "/hypnosis/emotional-steadiness", "Emotional Steadiness"],
    ["hypnosis sibling navigation", "/hypnosis/emotional-steadiness", 'a[href="/hypnosis/street-smarts-scan"]', "/hypnosis/street-smarts-scan", "Street-Smarts Scan"],
    ["hypnosis assessment CTA", "/hypnosis/emotional-steadiness", 'a[href="/assessment"]', "/assessment", "Every test you've ever taken"],
  ];

  for (const [name, from, selector, to, heading] of checks) {
    const result = await clickAndVerify(from, selector, to, heading);
    if (name === "hypnosis assessment CTA" && result.path === "/assessment" && /Every test|BEFORE YOU BEGIN/i.test(result.excerpt || "")) result.ok = true;
    results.push({ check: name, ...result });
  }

  const rankings = await openPage("/rankings");
  const rankingResult = await rankings.eval(`(async () => {
    let target = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      target = [...document.querySelectorAll('a[href^="/protocol/"][href$="/score"]')][0];
      if (target) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!target) return { ok: false, reason: 'rankings protocol link missing' };
    const expected = target.getAttribute('href');
    target.click();
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const heading = document.querySelector('h1')?.textContent?.trim() || '';
      if (location.pathname === expected && /full scorecard/i.test(heading) && !/404|Something went wrong/i.test(document.body.innerText)) return { ok: true, path: location.pathname, heading };
    }
    return { ok: false, path: location.pathname, heading: document.querySelector('h1')?.textContent?.trim() || '' };
  })()`);
  results.push({ check: "rankings protocol link", ...rankingResult });
  rankings.close();

  const invalid = await openPage("/hypnosis/not-a-real-session");
  const invalidResult = await invalid.eval(`(() => {
    const text = document.body.innerText;
    return { ok: /404|Lost in the Dimensions/i.test(text) && !/Something went wrong/i.test(text), heading: document.querySelector('h1')?.textContent?.trim() || null };
  })()`);
  results.push({ check: "invalid hypnosis ID renders application 404", ...invalidResult });
  invalid.close();

  const passed = results.every((result) => result.ok);
  await mkdir("validation", { recursive: true });
  await writeFile("validation/203205-browser-audit.json", JSON.stringify({ passed, base, results }, null, 2));
  console.log(JSON.stringify({ passed, results }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  chrome.kill("SIGTERM");
}
