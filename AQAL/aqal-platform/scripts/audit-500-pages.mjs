import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const mode = process.env.AUDIT_MODE || "all";
const port = 9340;
const chrome = spawn("chromium", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/aqal-500-audit-chrome",
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

async function openPage(path, viewport = { width: 1280, height: 900 }) {
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
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width <= 500,
  });
  try {
    await send("Page.navigate", { url: `${base}${path}` });
  } catch (error) {
    if (!/navigated or closed/i.test(String(error))) throw error;
  }
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const ready = await send("Runtime.evaluate", {
      expression: "Boolean(document.querySelector('#root')?.innerText.trim().length > 100)",
      returnByValue: true,
    });
    if (ready.result.value) break;
    await sleep(200);
  }

  return {
    eval: async (expression) => {
      const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    },
    close: async () => {
      ws.close();
      try {
        await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
      } catch {}
    },
  };
}

async function clickAndVerify({ name, from, targetExpression, expectedPath, headingPattern }) {
  const page = await openPage(from);
  const result = await page.eval(`(async () => {
    let target = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      target = (${targetExpression});
      if (target) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!target) return { ok: false, reason: 'target missing after hydration wait', path: location.pathname, excerpt: document.body.innerText.slice(0, 220) };
    const beforeHeading = document.querySelector('h1')?.textContent?.trim() || '';
    target.click();
    for (let attempt = 0; attempt < 50; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const heading = document.querySelector('h1')?.textContent?.trim() || '';
      const crashed = /Something went wrong/i.test(document.body.innerText);
      if (location.pathname === ${JSON.stringify(expectedPath)} && ${headingPattern}.test(heading) && heading !== beforeHeading && !crashed) {
        return { ok: true, path: location.pathname, heading };
      }
    }
    return { ok: false, path: location.pathname, heading: document.querySelector('h1')?.textContent?.trim() || '', excerpt: document.body.innerText.slice(0, 220) };
  })()`);
  await page.close();
  return { check: name, ...result };
}

const results = [];
try {
  await waitForDebugger();

  if (mode !== "tail") {
  results.push(await clickAndVerify({
    name: "homepage selected-line button opens full Volitional page",
    from: "/",
    targetExpression: "[...document.querySelectorAll('button')].find((el) => /What is this line\\?/i.test(el.textContent || ''))",
    expectedPath: "/line/volitional",
    headingPattern: "/Volitional/i",
  }));

  results.push(await clickAndVerify({
    name: "homepage Logical information icon is keyboard-clickable",
    from: "/",
    targetExpression: "document.querySelector('button[aria-label=\"About Logical — full page\"]')",
    expectedPath: "/line/logical",
    headingPattern: "/Logical/i",
  }));

  results.push(await clickAndVerify({
    name: "line dossier opens self-check",
    from: "/line/emotional",
    targetExpression: "document.querySelector('a[href=\"/line/emotional/self-check\"]')",
    expectedPath: "/line/emotional/self-check",
    headingPattern: "/Emotional.*self-check|self-check.*Emotional/i",
  }));

  results.push(await clickAndVerify({
    name: "line dossier opens weak-line page",
    from: "/line/emotional",
    targetExpression: "document.querySelector('a[href=\"/weak/emotional\"]')",
    expectedPath: "/weak/emotional",
    headingPattern: "/Emotional/i",
  }));

  results.push(await clickAndVerify({
    name: "line dossier opens first canonical trio pair",
    from: "/line/emotional",
    targetExpression: `[...document.querySelectorAll('a[href^="/pair/"]')].find((el) => /Interoceptive/i.test(el.textContent || ''))`,
    expectedPath: "/pair/emotional--interoceptive",
    headingPattern: "/Composed Barometer/i",
  }));

  results.push(await clickAndVerify({
    name: "line dossier opens Master Weakness Finder",
    from: "/line/emotional",
    targetExpression: `document.querySelector('a[href="/weakness-finder"]')`,
    expectedPath: "/weakness-finder",
    headingPattern: "/Your strengths show you where to aim/i",
  }));
  }

  if (mode !== "interactive") {
  const mobile = await openPage("/line/volitional", { width: 390, height: 844 });
  const mobileResult = await mobile.eval(`(() => {
    const text = document.body.innerText;
    const widthOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return {
      ok: /power trio/i.test(text) && /weakness cluster/i.test(text) && /not diagnoses or guarantees/i.test(text) && !/Something went wrong/i.test(text) && widthOverflow <= 1,
      widthOverflow,
      heading: document.querySelector('h1')?.textContent?.trim() || '',
    };
  })()`);
  results.push({ check: "mobile Volitional dossier renders without page-wide overflow", ...mobileResult });
  await mobile.close();

  const invalid = await openPage("/line/not-a-real-line");
  const invalidResult = await invalid.eval(`(() => {
    const text = document.body.innerText;
    return { ok: /404|Lost in the Dimensions/i.test(text) && !/Something went wrong/i.test(text), heading: document.querySelector('h1')?.textContent?.trim() || null };
  })()`);
  results.push({ check: "invalid line slug renders application 404", ...invalidResult });
  await invalid.close();
  }

  const passed = results.every((result) => result.ok);
  await mkdir("validation", { recursive: true });
  const suffix = mode === "all" ? "" : `-${mode}`;
  await writeFile(`validation/500-browser-audit${suffix}.json`, JSON.stringify({ passed, base, mode, results }, null, 2));
  console.log(JSON.stringify({ passed, results }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  chrome.kill("SIGTERM");
}
