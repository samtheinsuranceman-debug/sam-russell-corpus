// ============================================================
// WORKSPACE SCOPE — the checks that tie a record id to the caller's workspace.
//
// protectedProcedure only proves "has a session". Anyone holding the entrance
// passcode has one, so every procedure that takes a record id must also prove
// the record is in the caller's own workspace before reading or changing it
// (security review P11-A, C-2 / H-3 / H-4). The workspace always comes from the
// session, never from the request.
// ============================================================
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { savedSlideDecks } from "../drizzle/schema";
import { getDb } from "./db";

function notFound(message: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

/**
 * The deck, if it belongs to `workspaceId`; otherwise NOT_FOUND. A deck in
 * another workspace answers exactly like a deck that does not exist.
 */
export async function assertDeckInWorkspace(deckId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [deck] = await db.select({ id: savedSlideDecks.id, workspaceId: savedSlideDecks.workspaceId })
    .from(savedSlideDecks)
    .where(and(eq(savedSlideDecks.id, deckId), eq(savedSlideDecks.workspaceId, workspaceId)))
    .limit(1);
  if (!deck || deck.workspaceId !== workspaceId) notFound("Deck not found in your workspace");
  return deck;
}

/**
 * The owner's own session: the host sign-in (role admin with the owner's open
 * id). Used to keep the host-connected Google Calendar to the host.
 */
export function isHostSession(user: { role?: string | null; openId?: string | null } | null | undefined, ownerOpenId: string): boolean {
  return Boolean(user && user.role === "admin" && ownerOpenId && user.openId === ownerOpenId);
}
