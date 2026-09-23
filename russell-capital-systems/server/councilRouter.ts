/**
 * council.* — the Council behind advisor and owner surfaces only.
 *
 * Households never call the council and never see its workings: they see the
 * text Goldman (or another room) writes from the judge's JSON. Advisors and
 * the owner can ask the council directly and read the audit list.
 *
 * Who counts as staff (everyone else is a household):
 *   • the owner — OWNER_OPEN_ID, users.role "admin", or the owner e-mail
 *     (ownerGuard.ts);
 *   • an advisor — an e-mail listed in COUNCIL_ADVISOR_EMAILS (comma
 *     separated), which only the owner can set on the host.
 *
 * Workspace memberships do NOT grant advisor status: every signed-in user is
 * SUPER_ADMIN of an automatic workspace and can invite others as ADVISOR, so a
 * membership is something households can grant each other. Memberships only
 * narrow what an advisor already on the list can see.
 *
 * Staff may force the council on any question by choosing a forcing room in
 * council.ask; that is deliberate (they carry the cost guard like everyone).
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { memberships, workspaces } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { isOwnerEmailAddress, normalizeEmail } from "./ownerGuard";
import { COUNCIL_ROOMS, councilDetails, listCouncilRuns, runCouncil } from "./council";

export type CouncilAccess = { level: "owner" } | { level: "advisor"; workspaceIds: number[] } | { level: "household" };

type AccessUser = { id: number; openId: string; role: string; email?: string | null };

function advisorEmails(): string[] {
  return (process.env.COUNCIL_ADVISOR_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

/** An advisor's scope: workspaces they own, plus ACTIVE ADVISOR/ADMIN/SUPER_ADMIN memberships. Scope only, never a grant. */
async function advisorWorkspaceIds(userId: number): Promise<number[]> {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return [];
    const owned = await db.select({ workspaceId: workspaces.id }).from(workspaces).where(eq(workspaces.ownerId, userId));
    const member = await db
      .select({ workspaceId: memberships.workspaceId })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.status, "ACTIVE"),
          inArray(memberships.role, ["SUPER_ADMIN", "ADVISOR", "ADMIN"]),
        ),
      );
    return Array.from(new Set([...owned, ...member].map(r => r.workspaceId)));
  } catch (e) {
    console.warn("[council] membership lookup failed:", String(e).slice(0, 120));
    return [];
  }
}

/** Owner, advisor or household. Deny by default: anything unproven is a household. */
export async function councilAccess(user: AccessUser | null | undefined): Promise<CouncilAccess> {
  if (!user) return { level: "household" };
  const ownerOpenId = process.env.OWNER_OPEN_ID?.trim();
  if ((ownerOpenId && user.openId === ownerOpenId) || user.role === "admin" || isOwnerEmailAddress(user.email ?? "")) {
    return { level: "owner" };
  }
  const listed = user.email ? advisorEmails().includes(normalizeEmail(user.email)) : false;
  if (!listed) return { level: "household" };
  return { level: "advisor", workspaceIds: await advisorWorkspaceIds(user.id) };
}

const FORBIDDEN = "The council is for advisors and the owner. Your advisor's answer already reflects it where it applies.";

async function requireStaff(user: AccessUser): Promise<Exclude<CouncilAccess, { level: "household" }>> {
  const access = await councilAccess(user);
  if (access.level === "household") throw new TRPCError({ code: "FORBIDDEN", message: FORBIDDEN });
  return access;
}

export const councilRouter = router({
  /** Ask the council directly. Advisor/owner only. */
  ask: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1).max(8_000),
        context: z.string().max(40_000).optional(),
        contextLabels: z.array(z.string().max(120)).max(12).optional(),
        room: z.enum(COUNCIL_ROOMS).default("advisor"),
        /** Honoured only for the forcing rooms (tax packet, worst-case packet, Einstein, Goldman). */
        force: z.boolean().default(false),
        facts: z.boolean().default(false),
        /** Workspace the question is about; must be one the advisor works in. Stored as the only household link. */
        workspaceId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await requireStaff(ctx.user);
      if (access.level === "advisor" && input.workspaceId !== undefined && !access.workspaceIds.includes(input.workspaceId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "That workspace is not one you advise." });
      }
      const workspaceId = input.workspaceId ?? (access.level === "advisor" ? access.workspaceIds[0] ?? null : null);
      const run = await runCouncil({
        question: input.question,
        context: input.context,
        contextLabels: input.contextLabels,
        room: input.room,
        force: input.force,
        facts: input.facts,
        workspaceId,
      });
      return { finalText: run.finalText, outcome: run.outcome, details: councilDetails(run) };
    }),

  /** The audit list. The owner sees every run; an advisor sees the workspaces they advise. */
  runs: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const access = await requireStaff(ctx.user);
      const runs = await listCouncilRuns({
        limit: input?.limit ?? 50,
        workspaceIds: access.level === "advisor" ? access.workspaceIds : undefined,
      });
      return { scope: access.level, runs };
    }),
});
