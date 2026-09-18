#!/usr/bin/env node
// End-to-end proof that the homepage lead pipeline works on a running server:
// submits a test lead through the real tRPC API, confirms the visitor is
// recognised on the next visit (cookie), and — when DATABASE_URL is set —
// confirms the row landed in public_leads with the advisor-only analysis.
//
//   node scripts/smoke_lead_capture.mjs http://localhost:3000
//   DATABASE_URL=mysql://... node scripts/smoke_lead_capture.mjs https://russellcapitalsystems.com
//
// Uses an obviously fake test identity; delete it from /portal/leads afterwards.
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const fail = (msg) => { console.error("✘ " + msg); process.exit(1); };

const input = {
  firstName: "Smoke", lastName: "Test", email: "smoke.test@example.com", phone: "555-0100",
  bestTimeToContact: "Weekday mornings", question: "Smoke test — please ignore", consent: true,
  factFinder: {
    w2Income: 650000, estimatedTaxes: 210000, spouseIncome: 0, spouseTaxes: 0,
    studentDebt: 180000, studentDebtRate: 6.8,
    homeEquity: 400000, mortgageBalance: 900000, mortgageRate: 6.5, mortgageInterestOnlyMonthly: 4875, mortgageYearsRemaining: 25,
    taxDeferredSelf: 700000, taxDeferredSpouse: 0, liquidInvestments: 190000, liquidTaxability: "mixed",
    goals: "Smoke test",
  },
};

const res = await fetch(`${base}/api/trpc/leads.capture`, {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ json: input }),
});
const body = await res.json().catch(() => null);
if (res.status !== 200) fail(`leads.capture returned HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
const data = body?.result?.data?.json ?? body?.result?.data;
if (!data?.saved) fail(`lead not saved: ${JSON.stringify(data).slice(0, 300)}`);
const teaserText = JSON.stringify(data.teaser ?? "");
if (/\$\s?\d|\d+(\.\d+)?%/.test(teaserText)) fail("teaser leaked a figure to the visitor: " + teaserText.slice(0, 200));
console.log("✔ leads.capture saved the lead; teaser is qualitative (no figures)");

const cookie = (res.headers.get("set-cookie") || "").split(";")[0];
if (!cookie.startsWith("rcs_lead_id=")) fail("no rcs_lead_id cookie was set");
const rec = await fetch(`${base}/api/trpc/leads.recognize`, { headers: { cookie } });
const recBody = await rec.json().catch(() => null);
const recData = recBody?.result?.data?.json ?? recBody?.result?.data;
if (!recData?.known || recData.firstName !== "Smoke") fail("returning visitor not recognised: " + JSON.stringify(recData));
console.log("✔ returning visitor recognised by cookie (firstName = Smoke, hasEstimate = " + recData.hasEstimate + ")");

if (process.env.DATABASE_URL) {
  const { default: mysql } = await import("mysql2/promise");
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.query(
    "SELECT publicId, firstName, email, status, lastIp, consentedAt, JSON_LENGTH(factFinder) AS factFinderFields, analysis IS NOT NULL AS hasAnalysis FROM public_leads WHERE email = ? ORDER BY id DESC LIMIT 1",
    [input.email],
  );
  await conn.end();
  const row = rows[0];
  if (!row) fail("no public_leads row for " + input.email);
  if (!row.hasAnalysis || !row.consentedAt || row.factFinderFields < 10) fail("row incomplete: " + JSON.stringify(row));
  console.log("✔ public_leads row present:", { publicId: row.publicId, status: row.status, lastIp: row.lastIp, factFinderFields: row.factFinderFields, hasAnalysis: !!row.hasAnalysis });
} else {
  console.log("  (set DATABASE_URL to also verify the public_leads row)");
}
// Optional: sign in as the owner and confirm the lead shows up in the advisor inbox.
if (process.env.SMOKE_OWNER_EMAIL && process.env.SMOKE_OWNER_PASSWORD) {
  const login = await fetch(`${base}/api/auth/owner-login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: process.env.SMOKE_OWNER_EMAIL, password: process.env.SMOKE_OWNER_PASSWORD }),
  });
  if (login.status !== 200) fail(`owner sign-in failed: HTTP ${login.status} ${await login.text()}`);
  const session = (login.headers.get("set-cookie") || "").split(";")[0];
  const q = encodeURIComponent(JSON.stringify({ json: { search: input.email } }));
  const inbox = await fetch(`${base}/api/trpc/leads.list?input=${q}`, { headers: { cookie: session } });
  const inboxBody = await inbox.json().catch(() => null);
  const inboxData = inboxBody?.result?.data?.json ?? inboxBody?.result?.data;
  const items = Array.isArray(inboxData) ? inboxData : inboxData?.items ?? inboxData?.leads ?? [];
  if (inbox.status !== 200 || !items.some((l) => l.email === input.email)) fail(`lead not visible in the owner inbox: HTTP ${inbox.status} ${JSON.stringify(inboxData).slice(0, 200)}`);
  console.log("✔ owner signed in and sees the lead in /portal/leads");
}
console.log("✔ lead pipeline OK");
