// ============================================================
// HIVE GROUNDING for the ad-hoc LLM procedures.
//
// WHY. About twenty-five procedures build their own prompt and call the
// gateway directly; only the hive path injected the visitor's working memory.
// This helper prepends one system message carrying that memory (pinned engine
// outputs with their ledger, recent pages, verification outcomes) so every
// answer on the site is grounded the same way, without changing what each
// prompt asks. Step (b) of proposal P3, moving prompts to askHive, is separate.
//
// Public procedures (no user) get nothing prepended; a failure to read memory
// never blocks the original call.
// ============================================================
import { hiveContextFor } from "./hiveMind";

export type GroundingMessage = { role: "system"; content: string };

export async function hiveGroundingMessages(ctx: { user?: { id: number } | null } | undefined, routePath?: string): Promise<GroundingMessage[]> {
  const userId = ctx?.user?.id;
  if (!userId) return [];
  try {
    const c = await hiveContextFor(userId, routePath);
    if (!c.text.trim() || c.eventsUsed === 0) return [];
    return [{ role: "system", content: `${c.text}\n\nUse the WORKING MEMORY above as fact; cite the engine or page for any figure you take from it, and never restate a figure it does not contain as if it were known.` }];
  } catch {
    return [];
  }
}
