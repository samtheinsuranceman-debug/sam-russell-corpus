import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

// No database in this suite: the history must survive in memory.
vi.mock("./db", () => ({ getDb: async () => null }));

import { arrivalRouter } from "./arrivalRouter";
import { _resetArrivalMemoryForTests, beginArrival, signatureSeedFor } from "./arrivalSkinsDb";
import { SKIN_REGISTRY } from "@shared/arrivalSkins";
import type { TrpcContext } from "./_core/context";

function ctxFor(id: number | null): TrpcContext {
  return {
    user: id === null ? null : ({ id, openId: `o${id}`, email: null, name: null, loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as unknown as TrpcContext["user"]),
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  } as TrpcContext;
}

beforeEach(() => _resetArrivalMemoryForTests());

describe("arrival.begin", () => {
  it("requires a signed-in user", async () => {
    await expect(arrivalRouter.createCaller(ctxFor(null)).begin()).rejects.toThrow();
  });

  it("advances the session and never repeats the last 7, falling back to memory without a database", async () => {
    const caller = arrivalRouter.createCaller(ctxFor(7));
    const ids: string[] = [];
    for (let i = 1; i <= 24; i++) {
      const r = await caller.begin();
      expect(r.sessionNumber).toBe(i);
      expect(r.stored).toBe("memory");
      ids.push(r.skin.id);
    }
    ids.forEach((id, i) => expect(ids.slice(Math.max(0, i - 7), i)).not.toContain(id));
    const n = SKIN_REGISTRY.skins.length;
    expect(new Set(ids.slice(0, n)).size).toBe(n);
  });

  it("keeps users apart and gives each a stable signature seed that is not the raw id", async () => {
    const a = await beginArrival(1);
    const b = await beginArrival(2);
    expect(a.sessionNumber).toBe(1);
    expect(b.sessionNumber).toBe(1);
    expect(a.signatureSeed).toBe(signatureSeedFor(1));
    expect(a.signatureSeed).not.toBe(1);
    expect(a.signatureSeed).not.toBe(b.signatureSeed);
    expect((await beginArrival(1)).signatureSeed).toBe(a.signatureSeed);
    expect(a.houseVoicing).toEqual(["C4", "E4", "G4"]);
  });
});

describe("migration 0084", () => {
  it("is additive: one CREATE TABLE, no ALTER or DROP", () => {
    const sql = readFileSync(new URL("../drizzle/migrations/0084_arrival_skin_history.sql", import.meta.url), "utf8");
    expect(sql).toMatch(/CREATE TABLE `arrival_skin_history`/);
    expect(sql).not.toMatch(/\b(ALTER|DROP|TRUNCATE|DELETE)\b/i);
    expect(sql).toMatch(/UNIQUE\(`userId`\)/);
  });

  it("matches the table in drizzle/schema.ts and the exported schema file", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    const exported = readFileSync(new URL("../database/rcs-schema.sql", import.meta.url), "utf8");
    expect(schema).toContain('mysqlTable("arrival_skin_history"');
    expect(exported).toContain("CREATE TABLE `arrival_skin_history`");
  });
});
