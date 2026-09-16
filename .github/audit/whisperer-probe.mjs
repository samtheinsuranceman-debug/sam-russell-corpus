// Exercises the live AI Whisperer surface from outside: the page serves the app, the Zoom
// webhook answers the URL-validation challenge, unsigned report links are refused, and the
// advisor procedures refuse anonymous callers.
const BASE = (process.env.BASE_URL || "https://web-production-4b215.up.railway.app").replace(/\/$/, "");
const UA = { "user-agent": "rcs-whisperer-probe" };
const page = async (path) => { const r = await fetch(`${BASE}${path}`, { headers: UA }); const html = await r.text(); return { status: r.status, isApp: /<div id="root"|<script[^>]+type="module"/.test(html) }; };
const out = {};
out.page = await page("/portal/whisperer");
const v = await fetch(`${BASE}/api/zoom/webhook`, { method: "POST", headers: { "content-type": "application/json", ...UA }, body: JSON.stringify({ event: "endpoint.url_validation", payload: { plainToken: "probe" } }) });
const vb = await v.json().catch(() => null);
out.webhookValidation = { status: v.status, plainToken: vb?.plainToken, hasEncrypted: typeof vb?.encryptedToken === "string" && vb.encryptedToken.length === 64 };
const s = await fetch(`${BASE}/api/zoom/webhook`, { method: "POST", headers: { "content-type": "application/json", ...UA }, body: JSON.stringify({ event: "meeting.rtms_started", payload: {} }) });
out.webhookUnsigned = { status: s.status };
const r = await fetch(`${BASE}/api/whisperer/reports/1.pdf`, { headers: UA });
out.reportUnsigned = { status: r.status };
const t = await fetch(`${BASE}/api/trpc/whisperer.status?input=${encodeURIComponent(JSON.stringify({ json: null }))}`, { headers: UA });
out.statusAnonymous = { status: t.status };
console.log(JSON.stringify(out, null, 2));
const ok = out.page.status === 200 && out.page.isApp && out.webhookValidation.status === 200 && out.webhookValidation.plainToken === "probe" && out.webhookValidation.hasEncrypted && out.webhookUnsigned.status === 401 && out.reportUnsigned.status === 401 && out.statusAnonymous.status === 401;
console.log(ok ? "WHISPERER_PROBE_OK" : "WHISPERER_PROBE_FAILED");
process.exit(ok ? 0 : 1);
