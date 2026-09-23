/**
 * Regression guard (security review P11-A, H-3): no signed-in procedure may take
 * `workspaceId` from the request. The workspace is always derived from the
 * session (getWorkspaceForUser); a client-supplied one let any passcode holder
 * read or write another workspace's records.
 *
 * The router is inspected at runtime: every procedure built on
 * protectedProcedure (it carries protectedProcedure's session middleware, so
 * procedures derived from it count too) has its input schemas unwrapped and
 * their keys checked, nested objects included.
 */
import { describe, expect, it } from "vitest";
import { protectedProcedure } from "./_core/trpc";

/**
 * Legitimate exceptions, each with its reason. Keep this list short: an entry
 * here must verify the id against the caller before using it.
 */
const ALLOWED: ReadonlyArray<{ path: string; reason: string }> = [
  {
    path: "workspaceSwitcher.switchTo",
    reason: "Selecting a workspace is the point of the call; it checks getUserMembership(ctx.user.id, workspaceId) and refuses non-members.",
  },
];

type AnySchema = { _zod?: { def: any }; _def?: any } | undefined;

/** Every object key reachable in a zod (v4) schema, as dotted paths. */
export function schemaKeys(schema: AnySchema, prefix = "", depth = 0): string[] {
  if (!schema || depth > 12) return [];
  const def = schema._zod?.def ?? schema._def;
  if (!def) return [];
  switch (def.type) {
    case "object": {
      const out: string[] = [];
      for (const [k, v] of Object.entries(def.shape as Record<string, AnySchema>)) {
        const path = prefix ? `${prefix}.${k}` : k;
        out.push(path, ...schemaKeys(v, path, depth + 1));
      }
      return out;
    }
    case "optional": case "nullable": case "default": case "prefault": case "readonly": case "catch": case "nonoptional": case "success":
      return schemaKeys(def.innerType, prefix, depth + 1);
    case "pipe":
      return [...schemaKeys(def.in, prefix, depth + 1), ...schemaKeys(def.out, prefix, depth + 1)];
    case "intersection":
      return [...schemaKeys(def.left, prefix, depth + 1), ...schemaKeys(def.right, prefix, depth + 1)];
    case "union":
      return (def.options as AnySchema[]).flatMap(o => schemaKeys(o, prefix, depth + 1));
    case "array":
      return schemaKeys(def.element, `${prefix}[]`, depth + 1);
    case "record":
      return schemaKeys(def.valueType, `${prefix}{}`, depth + 1);
    case "lazy":
      return depth > 6 ? [] : schemaKeys(def.getter(), prefix, depth + 1);
    default:
      return [];
  }
}

const acceptsWorkspaceId = (keys: string[]) => keys.some(k => k === "workspaceId" || k.endsWith(".workspaceId"));

describe("no protected procedure takes workspaceId from the request", () => {
  it("the key walker sees top-level, nested and wrapped keys", async () => {
    const { z } = await import("zod");
    expect(acceptsWorkspaceId(schemaKeys(z.object({ workspaceId: z.number() }) as never))).toBe(true);
    expect(acceptsWorkspaceId(schemaKeys(z.object({ a: z.object({ workspaceId: z.number() }).optional() }).optional() as never))).toBe(true);
    expect(acceptsWorkspaceId(schemaKeys(z.object({ clientId: z.number() }).transform(x => x) as never))).toBe(false);
    expect(acceptsWorkspaceId(schemaKeys(z.object({ clientId: z.number() }) as never))).toBe(false);
  });

  it("every protectedProcedure input is free of workspaceId (allow-list aside)", async () => {
    const { appRouter } = await import("./routers");
    const sessionMiddleware = (protectedProcedure as unknown as { _def: { middlewares: unknown[] } })._def.middlewares[0];
    expect(typeof sessionMiddleware).toBe("function");
    const procedures = (appRouter as unknown as { _def: { procedures: Record<string, { _def: { middlewares: unknown[]; inputs?: AnySchema[] } }> } })._def.procedures;

    let protectedCount = 0;
    const offenders: string[] = [];
    for (const [path, proc] of Object.entries(procedures)) {
      if (!proc._def.middlewares.includes(sessionMiddleware)) continue;
      protectedCount++;
      const keys = (proc._def.inputs ?? []).flatMap(s => schemaKeys(s));
      if (acceptsWorkspaceId(keys)) offenders.push(path);
    }
    // Sanity: the walk really covered the signed-in surface.
    expect(protectedCount).toBeGreaterThan(500);

    const allowed = new Set(ALLOWED.map(a => a.path));
    expect(offenders.filter(p => !allowed.has(p)), "Derive the workspace from the session (getWorkspaceForUser(ctx.user.id)) instead of accepting workspaceId in the input.").toEqual([]);
    // An allow-list entry that no longer needs it must be removed.
    expect(ALLOWED.map(a => a.path).filter(p => !offenders.includes(p))).toEqual([]);
  });
});
