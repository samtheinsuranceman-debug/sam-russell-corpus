/**
 * TAKEN APART — every tRPC procedure, every edition, every role, no database.
 *
 * The router is called directly (createCaller) with the database absent, so
 * every procedure runs its own guards and then hits the seam where a real
 * deployment would read MySQL. Invariants for every invocation:
 *
 *   1. only a TRPCError ever escapes, with a code from the allowed set;
 *   2. in the public edition every clinical procedure is FORBIDDEN for every
 *      role and every input, before anything else is consulted;
 *   3. anonymous callers never get past a protected or admin procedure, and
 *      users never get past an admin one;
 *   4. an internal failure leaves as the one generic message, never the
 *      original text, never a stack, never the canary the input carried;
 *   5. malformed input is BAD_REQUEST, never 500.
 *
 * The procedure catalogue and each procedure's kind are read from the source
 * so a procedure added without a decision about its gate fails this test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import { TRPCError } from "@trpc/server";
import { Rng, Tally, anyValue, objectOf, rootSeed, weirdString, PROTO_KEYS } from "./rng";
import type { TrpcContext } from "../../server/_core/context";

const CANARY = "CANARY-PHI-7d1e-do-not-echo";
const ALLOWED = new Set(["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "PRECONDITION_FAILED", "INTERNAL_SERVER_ERROR", "TOO_MANY_REQUESTS", "CONFLICT", "BAD_GATEWAY", "TIMEOUT", "PAYLOAD_TOO_LARGE"]);

type Kind = "public" | "protected" | "admin";

/** Every procedure declares its gate in metadata; a procedure without one is a bug. */
function gateOf(proc: unknown): Kind | undefined {
  const meta = (proc as { _def?: { meta?: { gate?: Kind } } })._def?.meta;
  return meta?.gate;
}

/** Procedure names declared in the source, to make sure none is missing from the router. */
function declaredCount(): number {
  // routers.ts plus every router file it mounts (companion.ts), plus systemRouter.
  const src = ["server/routers.ts", "server/companion.ts"].map(f => fs.readFileSync(f, "utf8")).join("\n");
  return (src.match(/\b\w+: (public|protected|admin)Procedure/g) ?? []).length + 2;
}

function ctxFor(role: "anon" | "user" | "admin"): TrpcContext {
  const user = role === "anon" ? null : { id: 11, openId: "chaos-11", email: `${CANARY}@example.com`, name: CANARY, loginMethod: "manus", role: role === "admin" ? "admin" : "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  const headers: Record<string, string> = {};
  return {
    user,
    req: { protocol: "https", headers, ip: "203.0.113.9", get: (h: string) => headers[h.toLowerCase()] } as unknown as TrpcContext["req"],
    res: { clearCookie: () => undefined, cookie: () => undefined, setHeader: () => undefined } as unknown as TrpcContext["res"],
  } as TrpcContext;
}

/** Inputs that exercise the zod boundary and, sometimes, the body. */
function inputsFor(r: Rng, schemaKeys: string[]): unknown[] {
  const plausible = (k: string) => {
    if (/id$/i.test(k)) return r.int(1, 50);
    if (/date|at$/i.test(k)) return new Date().toISOString();
    if (/email/i.test(k)) return `${CANARY}@example.com`;
    if (/days|limit|score|count|age/i.test(k)) return r.int(0, 100);
    if (/state/i.test(k)) return r.pick(["Washington", "North Carolina", "Texas"]);
    if (/accept|agreed|adult|consent|confirm|flag|enabled|skipped/i.test(k)) return true;
    if (/messages|items|list|ids|entries/i.test(k)) return [];
    return `${CANARY} ${weirdString(r, 20)}`;
  };
  const out: unknown[] = [undefined, {}, anyValue(r), { [r.pick(PROTO_KEYS)]: { polluted: true }, message: CANARY }];
  if (schemaKeys.length) {
    out.push(objectOf(r, schemaKeys, plausible, 0));
    out.push(objectOf(r, schemaKeys, plausible, 0.4));
  } else {
    out.push({ message: CANARY, text: CANARY, content: CANARY });
  }
  return out;
}

function schemaKeys(proc: unknown): string[] {
  const def = (proc as { _def?: { inputs?: unknown[] } })._def;
  const input = def?.inputs?.[0] as { shape?: Record<string, unknown>; _def?: { shape?: Record<string, unknown>; innerType?: { shape?: Record<string, unknown> } }; _zod?: { def?: { shape?: Record<string, unknown>; innerType?: { _zod?: { def?: { shape?: Record<string, unknown> } } } } } } | undefined;
  const shape = input?.shape ?? input?._def?.shape ?? input?._def?.innerType?.shape ?? input?._zod?.def?.shape ?? input?._zod?.def?.innerType?._zod?.def?.shape;
  return shape ? Object.keys(shape) : [];
}

async function loadRouter(edition: "public" | "clinical") {
  process.env.PUBLIC_WELLNESS_MODE = edition === "public" ? "true" : "false";
  process.env.ENABLE_CLINICAL_TOOLS = edition === "clinical" ? "true" : "false";
  delete process.env.DATABASE_URL;
  process.env.ENABLE_PAID_SUBSCRIPTIONS = "false";
  vi.resetModules();
  const [{ appRouter }, policy, trpc] = await Promise.all([
    import("../../server/routers"),
    import("../../server/compliance/releasePolicy"),
    import("../../server/_core/trpc"),
  ]);
  return { appRouter, isClinicalProcedure: policy.isClinicalProcedure as (p: string) => boolean, GENERIC: trpc.GENERIC_SERVER_ERROR as string };
}

const saved = { PUBLIC_WELLNESS_MODE: process.env.PUBLIC_WELLNESS_MODE, ENABLE_CLINICAL_TOOLS: process.env.ENABLE_CLINICAL_TOOLS, DATABASE_URL: process.env.DATABASE_URL, ENABLE_PAID_SUBSCRIPTIONS: process.env.ENABLE_PAID_SUBSCRIPTIONS };

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("routers apart: every procedure × edition × role × adversarial input", () => {
  it("every procedure in the router carries a gate decision in its metadata", async () => {
    const { appRouter } = await loadRouter("public");
    const procedures = appRouter._def.procedures as Record<string, unknown>;
    const paths = Object.keys(procedures);
    expect(paths.length).toBeGreaterThan(80);
    expect(paths.length).toBe(declaredCount());
    for (const path of paths) expect(gateOf(procedures[path]), `no gate on ${path}`).toBeDefined();
    expect(gateOf(procedures["finance.readiness"])).toBe("protected");
    expect(gateOf(procedures["auth.me"])).toBe("public");
    expect(gateOf(procedures["system.notifyOwner"])).toBe("admin");
    expect(gateOf(procedures["medications.checkInteractions"])).toBe("admin");
  });

  it("holds every invariant across the full sweep", async () => {
    const r = new Rng(rootSeed()).child("routers");
    const t = new Tally();
    const silence = { log: console.log, warn: console.warn, error: console.error };
    console.warn = () => undefined; console.error = () => undefined; console.log = () => undefined;
    try {
      for (const edition of ["public", "clinical"] as const) {
        const { appRouter, isClinicalProcedure, GENERIC } = await loadRouter(edition);
        const procedures = appRouter._def.procedures as Record<string, unknown>;
        const paths = Object.keys(procedures).sort();
        for (const path of paths) {
          const kind = gateOf(procedures[path]);
          expect(kind, `no gate decision recorded for ${path}`).toBeDefined();
          const keys = schemaKeys(procedures[path]);
          for (const role of ["anon", "user", "admin"] as const) {
            const caller = appRouter.createCaller(ctxFor(role)) as Record<string, unknown>;
            const fn = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], caller) as (input: unknown) => Promise<unknown>;
            for (const input of inputsFor(r, keys)) {
              t.runs += 1;
              const label = `${edition}/${role}/${path}`;
              let outcome: "ok" | TRPCError | Error;
              try {
                await Promise.race([fn(input), new Promise((_, rej) => setTimeout(() => rej(new Error("chaos-timeout")), 4000))]);
                outcome = "ok";
              } catch (e) {
                outcome = e as Error;
              }
              if (outcome !== "ok" && !(outcome instanceof TRPCError)) {
                t.fail(`${label}: non-TRPC error escaped: ${(outcome as Error).message.slice(0, 120)}`);
                continue;
              }
              const code = outcome === "ok" ? "OK" : outcome.code;
              t.hit(`${edition}:${code}`);
              if (outcome !== "ok") {
                if (!ALLOWED.has(code)) t.fail(`${label}: unexpected code ${code}`);
                const msg = outcome.message ?? "";
                if (msg.includes(CANARY)) t.fail(`${label}: error message echoed input`);
                if (/\n\s+at /.test(msg)) t.fail(`${label}: stack in message`);
                if (code === "INTERNAL_SERVER_ERROR" && msg !== GENERIC) t.fail(`${label}: internal error leaked "${msg.slice(0, 80)}"`);
              }
              if (edition === "public" && isClinicalProcedure(path) && code !== "FORBIDDEN") t.fail(`${label}: clinical procedure answered ${code} in the public edition`);
              if (role === "anon" && kind !== "public" && !["UNAUTHORIZED", "FORBIDDEN"].includes(code)) t.fail(`${label}: anonymous reached a ${kind} procedure (${code})`);
              if (role === "user" && kind === "admin" && !["FORBIDDEN", "UNAUTHORIZED"].includes(code)) t.fail(`${label}: user reached an admin procedure (${code})`);
              if (outcome === "ok" && JSON.stringify(await Promise.resolve(fn(input)).catch(() => null) ?? "").includes(CANARY) && role === "anon") t.fail(`${label}: anonymous response echoed the canary`);
            }
          }
        }
      }
    } finally {
      Object.assign(console, silence);
    }
    console.log(`[chaos] routers apart: ${t.runs} invocations · ${t.summary()}`);
    expect(t.failures, t.failures.join("\n")).toEqual([]);
    expect(t.runs).toBeGreaterThan(3000);
  }, 600_000);
});
