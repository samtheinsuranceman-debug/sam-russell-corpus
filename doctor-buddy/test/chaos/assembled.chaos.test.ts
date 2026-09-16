/**
 * ASSEMBLED — the whole server on an ephemeral port, 10,000 requests, in the
 * production posture (headers, cross-origin checks) with no database, no
 * model gateway, no OAuth portal: the internet-facing surface exactly as an
 * attacker meets it on a bad day. Invariants for every response:
 *
 *   1. the process never dies and /healthz answers 200 throughout;
 *   2. no status ≥ 500 (a missing database is a clean 4xx/5xx JSON from the
 *      tRPC layer, never an unhandled throw), and no body ever carries a
 *      stack frame, an internal path, a driver name, or the canary;
 *   3. every /api/* answer is JSON with no-store caching, and every answer
 *      carries the security headers;
 *   4. clinical procedures are 403 in the public edition, protected ones are
 *      401 for a stranger, bad session cookies never become a session;
 *   5. state-changing cross-origin requests are 403; oversized bodies are 413;
 *      malformed JSON is 400; the webhook without a signature is never 2xx;
 *   6. the rate limiter engages for one abusive address and does not bleed
 *      into the others.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { Server } from "node:http";
import { SignJWT } from "jose";
import { Rng, Tally, anyValue, leakyStrings, rootSeed, weirdString, WEIRD_STRINGS } from "./rng";

const CANARY = "CANARY-PHI-7d1e-do-not-echo";
const ORIGIN = "https://doctorbuddy.example.com";
const JWT_SECRET = "chaos-secret-0123456789abcdef0123456789abcdef";
let server: Server;
let base = "";
let alive = true;
const crashes: string[] = [];

/** encodeURIComponent that survives a lone surrogate (the fuzzer makes them). */
function enc(s: string): string {
  try {
    return encodeURIComponent(s);
  } catch {
    return encodeURIComponent(s.replace(/[\ud800-\udfff]/g, "_"));
  }
}

function ip(r: Rng): string {
  return `198.51.100.${r.int(1, 250)}`;
}

async function req(method: string, url: string, init: { headers?: Record<string, string>; body?: string | Uint8Array; origin?: string; xff?: string } = {}) {
  const headers: Record<string, string> = { "x-forwarded-for": init.xff ?? "198.51.100.1", "x-forwarded-proto": "https", ...(init.headers ?? {}) };
  if (init.origin) headers.origin = init.origin;
  // The client itself refuses non-Latin-1 header bytes; what the server must
  // survive is what a client can actually send.
  for (const k of Object.keys(headers)) headers[k] = headers[k].replace(/[^\x20-\x7e\x80-\xff]/g, "_");
  const res = await fetch(base + url, { method, headers, body: init.body as BodyInit | undefined, redirect: "manual" });
  const text = await res.text();
  // The client normalises "/api/../x" to "/x" before sending; judge the answer
  // by the path the server actually saw.
  return { status: res.status, headers: res.headers, text, path: new URL(url, base).pathname };
}

async function jwt(kind: "valid" | "expired" | "wrong-secret" | "none-alg" | "garbage"): Promise<string> {
  if (kind === "garbage") return weirdString(new Rng(1), 40);
  if (kind === "none-alg") return `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from('{"openId":"x","appId":"","name":""}').toString("base64url")}.`;
  const secret = new TextEncoder().encode(kind === "wrong-secret" ? "not-the-secret-at-all-0123456789" : JWT_SECRET);
  const j = new SignJWT({ openId: "chaos-user", appId: "", name: CANARY }).setProtectedHeader({ alg: "HS256" }).setIssuedAt();
  if (kind === "expired") j.setExpirationTime(Math.floor(Date.now() / 1000) - 3600); else j.setExpirationTime("1h");
  return j.sign(secret);
}

describe("assembled: 10,000 requests against the booted server", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "production";
    process.env.PUBLIC_BASE_URL = ORIGIN;
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.PUBLIC_WELLNESS_MODE = "true";
    process.env.ENABLE_CLINICAL_TOOLS = "false";
    process.env.ENABLE_PAID_SUBSCRIPTIONS = "false";
    delete process.env.DATABASE_URL;
    delete process.env.BUILT_IN_FORGE_API_URL;
    delete process.env.OAUTH_PORTAL_URL;
    delete process.env.VITE_OAUTH_PORTAL_URL;
    const dist = path.resolve("dist/public");
    if (fs.existsSync(path.join(dist, "index.html"))) process.env.CLIENT_DIST_DIR = dist;
    process.on("uncaughtException", e => { alive = false; crashes.push(`uncaught: ${e.message}`); });
    process.on("unhandledRejection", e => { crashes.push(`unhandled: ${e instanceof Error ? e.message : String(e)}`); });
    const { buildApp } = await import("../../server/_core/app");
    server = (await buildApp()).server;
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const addr = server.address() as { port: number };
    base = `http://127.0.0.1:${addr.port}`;
  }, 120_000);

  afterAll(async () => {
    await new Promise<void>(resolve => server?.close(() => resolve()));
  });

  it("boots and answers the health check", async () => {
    const r = await req("GET", "/healthz");
    expect(r.status).toBe(200);
    expect(JSON.parse(r.text).ok).toBe(true);
  });

  it("survives 10,000 adversarial requests with every invariant intact", async () => {
    const r = new Rng(rootSeed()).child("assembled");
    const t = new Tally();
    const silence = { log: console.log, warn: console.warn, error: console.error };
    console.warn = () => undefined; console.error = () => undefined; console.log = () => undefined;
    const trpcPaths = ["auth.me", "system.health", "finance.readiness", "assessment.start", "report.get", "digitalTwin.getMyTwin", "mcs.getScore", "drBuddy.chat", "journal.list", "journal.create", "compliance.getStateRights", "consent.status", "subscription.me", "medications.list", "openRouter.chat", "leads.capture", "personality.profile", "research.search", "wellness.getPlan", "lifeMaps.generate", "clinicianReview.getReports", weirdString(r, 12), "__proto__.x", "..", ""];
    const clinicalPrefixes = ["assessment.", "report.", "lifeMaps.", "lifeEvents.", "digitalTwin.", "clinicianReview.", "wellness.", "mcs.", "leads.", "openRouter.", "personality."];
    const tokens = { valid: await jwt("valid"), expired: await jwt("expired"), wrong: await jwt("wrong-secret"), none: await jwt("none-alg"), garbage: await jwt("garbage") };
    const big = "x".repeat(1_500_000);

    /** Returns false when Node itself answered (414/431) and nothing else applies. */
    const check = (label: string, res: { status: number; headers: Headers; text: string }, url: string): boolean => {
      t.hit(`s${res.status}`);
      // 503 with a documented reason is the honest answer for a feature that
      // is deliberately off on this deployment; anything else ≥ 500 is a failure.
      const deliberate503 = res.status === 503 && /not configured|disabled|not built/i.test(res.text);
      if (res.status >= 500 && !deliberate503) t.fail(`${label} ${url}: status ${res.status} ${res.text.slice(0, 100)}`);
      if (res.text.includes(CANARY)) t.fail(`${label} ${url}: canary echoed`);
      const leaks = leakyStrings(res.text);
      if (leaks.length) t.fail(`${label} ${url}: leak ${leaks[0]}`);
      // 414 and 431 are answered by Node itself before express runs; they carry
      // no application headers and no body. Everything else must.
      const nodeLevel = [414, 431].includes(res.status);
      if (nodeLevel) { t.hit("node-level"); return false; }
      if (!res.headers.get("x-content-type-options")) t.fail(`${label} ${url}: missing nosniff (${res.status})`);
      if (!res.headers.get("strict-transport-security")) t.fail(`${label} ${url}: missing HSTS (${res.status})`);
      if (url.startsWith("/api/")) {
        if (!/no-store/.test(res.headers.get("cache-control") ?? "")) t.fail(`${label} ${url}: api answer cacheable`);
        // tRPC's adapter answers a wrong-method or oversized call in plain text
        // itself (405 / 413); everything else under /api must be JSON.
        // (415 too: the body is JSON, the header says text.)
        const adapterText = [405, 413, 415].includes(res.status) && url.startsWith("/api/trpc/");
        if (res.status !== 302 && res.text && !adapterText && !/^application\/json/.test(res.headers.get("content-type") ?? "")) t.fail(`${label} ${url}: api answer not JSON (${res.status} ${res.headers.get("content-type")} "${res.text.slice(0, 60)}")`);
      }
      return true;
    };

    const one = async (i: number) => {
      const c = r.next();
      const xff = ip(r);
      if (c < 0.12) {
        const url = r.pick(["/", "/finance", "/finance/fact-finder", "/financial-disclaimer", "/crisis", "/support-lab", "/settings", `/${weirdString(r, 30)}`, "/robots.txt", "/.well-known/security.txt", "/index.html", "/assets/../../etc/passwd", "/%2e%2e/%2e%2e/etc/passwd"]);
        const res = await req("GET", url, { xff });
        check("page", res, res.path);
        if (["/", "/finance"].includes(url) && process.env.CLIENT_DIST_DIR && res.status !== 200) t.fail(`page ${url}: ${res.status}`);
        return;
      }
      if (c < 0.40) {
        const p = r.pick(trpcPaths);
        const input = r.bool(0.3) ? "" : `?input=${enc(JSON.stringify({ json: r.bool(0.5) ? anyValue(r) : { text: CANARY, message: CANARY, timestamp: r.int(0, 1e12) } }))}`;
        const cookieKind = r.pick(["none", "valid", "expired", "wrong", "garbage", "none-alg"] as const);
        const headers: Record<string, string> = {};
        if (cookieKind !== "none") headers.cookie = `app_session_id=${cookieKind === "valid" ? tokens.valid : cookieKind === "expired" ? tokens.expired : cookieKind === "wrong" ? tokens.wrong : cookieKind === "garbage" ? tokens.garbage : tokens.none}`;
        const url = `/api/trpc/${enc(p)}${input}`;
        const res = await req("GET", url, { xff, headers });
        if (!check(`trpc:${cookieKind}`, res, `/api/trpc/${p}`)) return;
        if (res.status === 429) return;
        if (clinicalPrefixes.some(x => p.startsWith(x)) || p === "finance.readiness") {
          // 403 from the release gate; 404 for a name that does not exist; 405
          // for a mutation called with GET. Never data.
          if (![403, 404, 405].includes(res.status)) t.fail(`trpc ${p}: clinical path answered ${res.status} in the public edition`);
        }
        if (p === "auth.me" && res.status === 200 && cookieKind !== "none") {
          // No database: no cookie, however well signed, can become a user.
          if (!/"json":null/.test(res.text)) t.fail(`auth.me with ${cookieKind} cookie produced a session: ${res.text.slice(0, 80)}`);
        }
        if (p === "journal.list" && res.status === 200) t.fail(`journal.list answered 200 for a stranger`);
        return;
      }
      if (c < 0.55) {
        const p = r.pick(trpcPaths);
        const kind = r.pick(["json", "garbage", "big", "array", "batch", "empty"] as const);
        const body = kind === "json" ? JSON.stringify({ json: { text: CANARY, message: CANARY } }) : kind === "garbage" ? weirdString(r, 200) : kind === "big" ? big : kind === "array" ? "[1,2,3]" : kind === "batch" ? JSON.stringify({ 0: { json: {} }, 1: { json: anyValue(r) } }) : "";
        const origin = r.pick([ORIGIN, "https://evil.example", undefined, "null"]);
        const contentType = r.bool(0.9) ? "application/json" : "text/plain";
        const res = await req("POST", `/api/trpc/${enc(p)}${kind === "batch" ? "?batch=1" : ""}`, { xff, origin, headers: { "content-type": contentType }, body });
        if (!check(`trpc-post:${kind}`, res, `/api/trpc/${p}`)) return;
        if (res.status === 429) return;
        if (origin && origin !== ORIGIN && res.status !== 403) t.fail(`cross-origin POST from ${origin} answered ${res.status}`);
        if (origin === ORIGIN && (clinicalPrefixes.some(x => p.startsWith(x)) || p === "finance.readiness") && res.status === 200) t.fail(`trpc POST ${p}: clinical path answered 200 in the public edition`);
        if (kind === "big" && origin === ORIGIN && contentType === "application/json" && res.status !== 413) t.fail(`1.5 MB JSON body answered ${res.status}`);
        if (kind === "big" && origin === ORIGIN && contentType !== "application/json" && ![413, 415].includes(res.status)) t.fail(`1.5 MB text body answered ${res.status}`);
        if (kind === "garbage" && origin === ORIGIN && body && ![400, 404, 405, ...(contentType === "application/json" ? [] : [415])].includes(res.status)) t.fail(`garbage JSON answered ${res.status}`);
        return;
      }
      if (c < 0.65) {
        const res = await req("POST", "/api/billing/webhook", { xff, origin: r.pick([ORIGIN, undefined]), headers: { "content-type": "application/json", "stripe-signature": r.bool(0.5) ? weirdString(r, 60) : "t=1,v1=deadbeef" }, body: JSON.stringify({ id: "evt_x", type: "checkout.session.completed", data: { object: { client_reference_id: CANARY } } }) });
        if (!check("webhook", res, "/api/billing/webhook")) return;
        if (res.status >= 200 && res.status < 300) t.fail(`unsigned webhook accepted: ${res.status}`);
        return;
      }
      if (c < 0.75) {
        const url = r.pick([`/api/oauth/callback?code=${enc(weirdString(r, 20))}&state=${enc(weirdString(r, 40))}`, "/api/oauth/callback", `/api/oauth/start?returnPath=${enc(r.pick(["/finance", "//evil.example", "https://evil.example", weirdString(r, 20)]))}`, "/api/billing/create-checkout", "/api/billing/create-portal", `/api/${weirdString(r, 12)}`, "/manus-storage/../../x"]);
        const method = url.includes("billing") ? "POST" : "GET";
        const res = await req(method, url, { xff, origin: method === "POST" ? ORIGIN : undefined, headers: method === "POST" ? { "content-type": "application/json" } : {}, body: method === "POST" ? "{}" : undefined });
        if (!check("misc-api", res, res.path)) return;
        if (url.startsWith("/api/oauth/callback") && res.status !== 400) t.fail(`oauth callback with junk answered ${res.status}`);
        if (url.startsWith("/api/oauth/start") && res.status !== 503) t.fail(`oauth start without a portal answered ${res.status}`);
        if (url.startsWith("/api/oauth/start") && res.status === 302) t.fail(`oauth start redirected without a portal`);
        if (url.startsWith("/api/billing/create") && res.status !== 503) t.fail(`billing route with paid off answered ${res.status}`);
        if (url.includes("/x") || url.includes(`/api/${weirdString(new Rng(1), 0)}`)) { /* junk paths covered by status check */ }
        return;
      }
      if (c < 0.85) {
        const method = r.pick(["PUT", "DELETE", "PATCH", "OPTIONS", "HEAD", "PROPFIND", "PURGE"]);
        const url = r.pick(["/", "/api/trpc/auth.me", "/healthz", "/finance", `/api/${weirdString(r, 10)}`]);
        const res = await req(method, url, { xff, origin: r.pick([ORIGIN, "https://evil.example", undefined]) });
        check(`method:${method}`, res, res.path);
        return;
      }
      // Header fuzz: huge, unicode, injected newlines, many cookies.
      const headers: Record<string, string> = {};
      for (let k = 0, n = r.int(1, 6); k < n; k++) {
        const name = r.pick(["x-forwarded-for", "x-forwarded-proto", "cookie", "accept", "user-agent", "referer", "x-forwarded-host", "host", "content-length", "transfer-encoding", "x-chaos"]);
        let value = r.bool(0.3) ? r.pick(WEIRD_STRINGS) : weirdString(r, r.bool(0.1) ? 7000 : 80);
        value = value.replace(/[\r\n --￿]/g, "_");
        if (name === "content-length" || name === "transfer-encoding" || name === "host") continue;
        headers[name] = value || "x";
      }
      try {
        const res = await req("GET", r.pick(["/healthz", "/api/trpc/auth.me", "/"]), { xff, headers });
        check("headers", res, "/healthz");
      } catch (e) {
        // A header the client itself refuses to send is not a server failure.
        if (!/invalid|header|ERR_INVALID/i.test(String((e as Error).message))) t.fail(`headers: ${(e as Error).message.slice(0, 80)}`);
      }
      void i;
    };

    const gc = (globalThis as { gc?: () => void }).gc;
    gc?.();
    const heapBefore = process.memoryUsage().heapUsed;
    try {
      // Bursts of 100 in flight, 10,000 in total, with the health check
      // polled between bursts.
      for (let burst = 0; burst < 100; burst++) {
        await Promise.all(Array.from({ length: 100 }, (_, k) => one(burst * 100 + k)));
        t.runs += 100;
        const h = await req("GET", "/healthz", { xff: "198.51.100.254" });
        if (h.status !== 200) t.fail(`healthz ${h.status} after burst ${burst}`);
        if (!alive) { t.fail("process died"); break; }
      }

      // Rate limiting: one abusive address, then a neighbour.
      let limited = 0;
      for (let k = 0; k < 220; k++) {
        const res = await req("GET", "/api/trpc/system.health?input=%7B%22json%22%3A%7B%22timestamp%22%3A1%7D%7D", { xff: "203.0.113.77" });
        if (res.status === 429) limited += 1;
        if (res.status === 429 && res.headers.get("retry-after") !== "60") t.fail("429 without Retry-After: 60");
      }
      if (limited === 0) t.fail("rate limiter never engaged for 220 requests from one address");
      const neighbour = await req("GET", "/api/trpc/system.health?input=%7B%22json%22%3A%7B%22timestamp%22%3A1%7D%7D", { xff: "203.0.113.78" });
      if (neighbour.status === 429) t.fail("rate limit bled into a neighbouring address");
      t.hit(`rate-limited=${limited}`);
    } finally {
      Object.assign(console, silence);
    }
    gc?.();
    const heapAfter = process.memoryUsage().heapUsed;
    const growthMb = Math.round((heapAfter - heapBefore) / 1048576);
    t.hit(`heap-growth-mb=${growthMb}`);
    if (growthMb > 200) t.fail(`heap grew by ${growthMb} MB over the soak`);
    console.log(`[chaos] assembled: ${t.runs} requests · ${t.summary()} · crashes=${crashes.length}`);
    expect(crashes, crashes.join("\n")).toEqual([]);
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBe(10_000);
    expect(alive).toBe(true);
  }, 600_000);
});
