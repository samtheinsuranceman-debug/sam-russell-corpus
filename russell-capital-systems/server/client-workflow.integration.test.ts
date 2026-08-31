import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { clients, workspaces } from "../drizzle/schema";
import { getDb } from "./db";

describe("client workflow persistence", () => {
  it("creates, reads, and updates a client inside a rolled-back transaction", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const sentinel = `rollback-${Date.now()}`;

    await expect(db!.transaction(async tx => {
      await tx.insert(workspaces).values({ name: "Persistence Verification", slug: sentinel, ownerId: 999_999_999 });
      const workspaceRows = await tx.select().from(workspaces).where(eq(workspaces.slug, sentinel)).limit(1);
      const workspace = workspaceRows[0];
      expect(workspace).toBeTruthy();

      await tx.insert(clients).values({ workspaceId: workspace.id, name: "Rollback Verification Record", email: `${sentinel}@example.invalid` });
      const clientRows = await tx.select().from(clients)
        .where(and(eq(clients.workspaceId, workspace.id), eq(clients.email, `${sentinel}@example.invalid`)))
        .limit(1);
      const client = clientRows[0];
      expect(client?.name).toBe("Rollback Verification Record");

      await tx.update(clients).set({ notes: "Verified update; transaction will roll back." }).where(eq(clients.id, client.id));
      const updatedRows = await tx.select().from(clients).where(eq(clients.id, client.id)).limit(1);
      expect(updatedRows[0]?.notes).toContain("Verified update");

      tx.rollback();
    })).rejects.toBeTruthy();

    const persisted = await db!.select().from(workspaces).where(eq(workspaces.slug, sentinel));
    expect(persisted).toHaveLength(0);
  }, 30_000);
});
