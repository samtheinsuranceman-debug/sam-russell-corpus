const debugPort = process.env.CHROME_DEBUG_PORT || "9223";
const pageUrl = process.env.CONCEPT16_URL || "http://127.0.0.1:4317/";

const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target?.webSocketDebuggerUrl) throw new Error("No debuggable Chromium page was found");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  if (!message.id) return;
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(message.error.message));
  else waiter.resolve(message.result);
});

function command(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await command("Page.enable");
await command("Runtime.enable");

async function auditViewport(name, width, height) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await command("Page.navigate", { url: pageUrl });
  await new Promise((resolve) => setTimeout(resolve, 3500));

  if (width < 600) {
    await command("Runtime.evaluate", {
      expression: `(() => {
        const button = [...document.querySelectorAll('button')].find((candidate) => (candidate.getAttribute('aria-label') || '').includes('navigation menu'));
        button?.click();
      })()`,
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const expression = `(() => {
    const menuButton = [...document.querySelectorAll('button')].find((button) => (button.getAttribute('aria-label') || '').includes('navigation menu'));
    const anchors = [...document.querySelectorAll('a[href^="#"]')];
    const missingAnchors = anchors.map((anchor) => anchor.getAttribute('href')).filter((href) => href && !document.querySelector(href));
    const mobileItems = ['For Physicians', 'Practice Owners', 'Strategies', 'Resources'];
    return {
      name: ${JSON.stringify(name)},
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
      heroRendered: document.body.innerText.includes('The Physician Wealth Command Center'),
      lowerContentRendered: document.body.innerText.includes('Every planning area remains within reach') && document.body.innerText.includes('Book a Free Consultation'),
      commandTabs: document.querySelectorAll('[role="tab"]').length,
      labeledCalculatorFields: ['Annual income', 'Filing status', 'State'].filter((label) => document.querySelector('[aria-label="' + label + '"]')).length,
      missingAnchors,
      mobileMenuButton: Boolean(menuButton),
      mobileMenuExpanded: ${width} < 600 ? menuButton?.getAttribute('aria-expanded') === 'true' : true,
      mobileMenuItemsVisible: ${width} < 600 ? mobileItems.every((label) => [...document.querySelectorAll('a')].some((anchor) => anchor.textContent?.trim() === label && anchor.getClientRects().length > 0)) : true,
    };
  })()`;

  const response = await command("Runtime.evaluate", { expression, returnByValue: true });
  const result = response.result.value;
  const passed = result.noHorizontalOverflow && result.heroRendered && result.lowerContentRendered && result.commandTabs === 4 && result.labeledCalculatorFields === 3 && result.missingAnchors.length === 0 && result.mobileMenuButton && result.mobileMenuExpanded && result.mobileMenuItemsVisible;
  if (!passed) throw new Error(`${name} Concept 16 browser audit failed: ${JSON.stringify(result)}`);
  return result;
}

const results = [
  await auditViewport("desktop", 1440, 1000),
  await auditViewport("phone", 390, 844),
];

console.log(JSON.stringify({ ok: true, results }, null, 2));
socket.close();
