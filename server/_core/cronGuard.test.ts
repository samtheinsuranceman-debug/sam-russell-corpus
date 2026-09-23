import { afterEach, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import type { AddressInfo } from "net";
import type { Server } from "http";
import { cronGuard } from "./cronGuard";

/** A real Express app with the guard mounted exactly as index.ts mounts it. */
function makeApp() {
  const app = express();
  app.use("/api/cron", cronGuard);
  app.get("/api/cron/macro-refresh", (_req, res) => res.json({ ok: true, ran: "macro-refresh" }));
  app.get("/api/cron/stale-digest", (_req, res) => res.json({ ok: true, ran: "stale-digest" }));
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  return app;
}

describe("cronGuard", () => {
  let server: Server;
  let base: string;
  const original = process.env.CRON_SECRET;

  beforeEach(async () => {
    const app = makeApp();
    await new Promise<void>(resolve => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it("returns 503 on /api/cron/macro-refresh when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const r = await fetch(`${base}/api/cron/macro-refresh`);
    expect(r.status).toBe(503);
    const body = (await r.json()) as { error: string };
    expect(body.error).toMatch(/CRON_SECRET is not configured/);
  });

  it("returns 503 when CRON_SECRET is an empty string", async () => {
    process.env.CRON_SECRET = "";
    const r = await fetch(`${base}/api/cron/macro-refresh?secret=`);
    expect(r.status).toBe(503);
  });

  it("returns 503 for every /api/cron/* path, even with a secret supplied", async () => {
    delete process.env.CRON_SECRET;
    const r = await fetch(`${base}/api/cron/stale-digest?secret=anything`);
    expect(r.status).toBe(503);
  });

  it("returns 403 when the secret is set and the query value is wrong", async () => {
    process.env.CRON_SECRET = "s3cret";
    const r = await fetch(`${base}/api/cron/macro-refresh?secret=nope`);
    expect(r.status).toBe(403);
  });

  it("returns 403 when the secret is set and none is supplied", async () => {
    process.env.CRON_SECRET = "s3cret";
    const r = await fetch(`${base}/api/cron/macro-refresh`);
    expect(r.status).toBe(403);
  });

  it("runs the job when the query secret matches", async () => {
    process.env.CRON_SECRET = "s3cret";
    const r = await fetch(`${base}/api/cron/macro-refresh?secret=s3cret`);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, ran: "macro-refresh" });
  });

  it("accepts the secret in the x-cron-secret header", async () => {
    process.env.CRON_SECRET = "s3cret";
    const r = await fetch(`${base}/api/cron/macro-refresh`, { headers: { "x-cron-secret": "s3cret" } });
    expect(r.status).toBe(200);
  });

  it("does not touch routes outside /api/cron", async () => {
    delete process.env.CRON_SECRET;
    const r = await fetch(`${base}/api/health`);
    expect(r.status).toBe(200);
  });
});
