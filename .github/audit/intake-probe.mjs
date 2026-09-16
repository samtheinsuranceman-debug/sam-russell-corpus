// Exercises the live role-login and AI-intake surface from outside: the three
// dashboard routes and the login page serve the app shell, the intake script
// lists every question, the recap re-explains a full answer set, and the
// three horizon questions come back with evidence, strategies and links.
const BASE = (process.env.BASE_URL || "https://web-production-4b215.up.railway.app").replace(/\/$/, "");
const UA = { "user-agent": "rcs-intake-probe" };
const q = async (proc, input) => {
  const url = `${BASE}/api/trpc/${proc}?input=${encodeURIComponent(JSON.stringify({ json: input ?? null }))}`;
  const r = await fetch(url, { headers: UA });
  const body = await r.json().catch(() => null);
  return { status: r.status, data: body?.result?.data?.json ?? body?.result?.data, error: body?.error?.json?.message ?? body?.error?.message };
};
const m = async (proc, input) => {
  const r = await fetch(`${BASE}/api/trpc/${proc}`, { method: "POST", headers: { "content-type": "application/json", ...UA }, body: JSON.stringify({ json: input }) });
  const body = await r.json().catch(() => null);
  return { status: r.status, data: body?.result?.data?.json ?? body?.result?.data, error: body?.error?.json?.message ?? body?.error?.message };
};
const page = async (path) => {
  const r = await fetch(`${BASE}${path}`, { headers: UA, redirect: "manual" });
  const html = await r.text().catch(() => "");
  return { status: r.status, location: r.headers.get("location"), isApp: /<div id="root"|<script[^>]+type="module"/.test(html), bytes: html.length };
};

const answers = {
  "cash.moneyMarket": 50000, "cash.cds": 25000, "cash.checking": 20000, "cash.savings": 105000, "cash.rate": 4,
  "stocks.has": true, "stocks.value": 400000, "stocks.manager": "A financial advisor", "stocks.advisorName": "Mark", "stocks.advisorYears": 9,
  "bonds.has": true, "bonds.value": 100000, "bonds.rate": 5, "funds.has": false,
  "annuity.has": true, "annuity.company": "Athene", "annuity.yearBought": 2016, "annuity.value": 250000, "annuity.guaranteed": true, "annuity.monthlyIncome": 1800,
  "home.owns": true, "home.value": 900000, "home.mortgage": 400000, "home.zip": "28429",
  "rentals.has": true, "rentals.count": 3, "rentals.mortgageTotal": 600000, "rentals.interestOnly": 3200, "rentals.equity": 350000, "rentals.rent": 4500,
  "retire.employer": 800000, "retire.ira": 150000, "retire.roth": 60000, "retire.spouseHas": true, "retire.spouseValue": 300000,
  "unusual.crypto": 40000, "unusual.metals": 15000, "unusual.hard": 90000, "unusual.detail": "two classic Mustangs and a gun collection",
};
const extras = { priorities: "Kill the mortgage, then protect the kids", wishes: { account: "no fees", future: "paid-off rentals", outcomes: "kids inherit an engine" } };

const out = {};
out.pages = {};
for (const p of ["/login", "/login?role=physician", "/portal/physician", "/portal/client", "/portal/advisor"]) out.pages[p] = await page(p);
const script = await q("intake.script");
out.script = { status: script.status, error: script.error, steps: script.data?.steps?.length, first: script.data?.steps?.[0]?.say, permissionAsk: Boolean(script.data?.permissionAsk) };
const recap = await q("intake.recap", { answers });
out.recap = { status: recap.status, error: recap.error, sentences: recap.data?.sentences?.length, netWorth: recap.data?.totals?.netWorth, last: recap.data?.sentences?.at(-1) };
const t0 = Date.now();
const tq = await m("intake.threeQuestions", { answers, extras });
out.threeQuestions = { status: tq.status, error: tq.error, via: tq.data?.via, wallMs: Date.now() - t0, questions: tq.data?.questions?.map((x) => ({ horizon: x.horizon, title: x.title, spokenWords: x.spoken?.split(/\s+/).length, evidence: x.evidence?.length, strategies: x.strategies?.length, calculators: x.calculators?.map((c) => c.path) })) };
const sp = await m("ultra.speak", { text: "Doctor, thank you for sitting down with me." });
out.speak = { status: sp.status, ok: sp.data?.ok, reason: sp.data?.reason, audioBytes: sp.data?.audioBase64 ? Math.round(sp.data.audioBase64.length * 0.75) : 0, mimeType: sp.data?.mimeType, via: sp.data?.via, voiceId: sp.data?.voiceId, fallback: sp.data?.fallback };
const save = await m("intake.save", { answers, extras });
out.saveUnauthenticated = { status: save.status, error: save.error };
console.log(JSON.stringify(out, null, 2));
const pagesOk = Object.values(out.pages).every((p) => p.status === 200 && p.isApp);
const ok = pagesOk && out.script.status === 200 && out.script.steps >= 40 && out.recap.status === 200 && out.threeQuestions.status === 200 && out.threeQuestions.questions?.length === 3 && out.saveUnauthenticated.status === 401 && out.speak.ok === true && out.speak.audioBytes > 10000;
console.log(ok ? "INTAKE_PROBE_OK" : "INTAKE_PROBE_FAILED");
process.exit(ok ? 0 : 1);
