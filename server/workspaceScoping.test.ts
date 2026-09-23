/**
 * Workspace scoping (security review P11-A, C-2 / H-3 / H-4): a signed-in user
 * can reach only records in their own workspace, whatever ids they send.
 *
 * Every helper in server/db.ts runs against an in-memory database
 * (testFixtures/fakeMysqlDb.ts) that evaluates the real WHERE clauses, so a
 * missing workspace condition shows up as a touched row. Two workspaces:
 * 42 (the caller, user 7) and 99 (someone else, user 8). All names and
 * addresses are invented for the test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeMysqlDb } from "./testFixtures/fakeMysqlDb";

const fake = createFakeMysqlDb();
vi.mock("drizzle-orm/mysql2", () => ({ drizzle: () => fake.db }));
vi.stubEnv("DATABASE_URL", "mysql://fake-host-for-tests/none");

const invokeLLM = vi.fn();
vi.mock("./_core/llm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./_core/llm")>()),
  invokeLLM: (...a: unknown[]) => invokeLLM(...a),
}));
vi.mock("./hiveGround", () => ({ hiveGroundingMessages: vi.fn(async () => []) }));
const sendSessionRatingEmail = vi.fn(async () => ({ sent: true }));
vi.mock("./email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./email")>()),
  sendSessionRatingEmail: (...a: unknown[]) => sendSessionRatingEmail(...(a as [])),
}));
const googleDelete = vi.fn(async () => ({}));
const googleUpdate = vi.fn(async () => ({}));
vi.mock("./calendarService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./calendarService")>()),
  deleteCalendarEvent: (...a: unknown[]) => googleDelete(...(a as [])),
  updateCalendarEvent: (...a: unknown[]) => googleUpdate(...(a as [])),
}));

const { appRouter } = await import("./routers");
const { assertDeckInWorkspace } = await import("./workspaceScope");
const { slideShareIsLive } = await import("./db");
const { ownerOpenId } = await import("./_core/ownerLogin");

const OWN_WS = 42;
const OTHER_WS = 99;
const guest = { id: 7, openId: "guest-open-id-for-tests", name: "Test Advisor", email: "advisor@example.test", role: "user" };
const host = { id: 7, openId: ownerOpenId(), name: "Test Host", email: "host@example.test", role: "admin" };
const caller = (user: object = guest) => appRouter.createCaller({ user: user as never, req: {} as never, res: {} as never });

const DAY = 86_400_000;
const deckSlides = JSON.stringify([{ title: "t", subtitle: "s", bullets: [], speakerNotes: "", layout: "title" }]);

function seed() {
  fake.reset({
    workspaces: [
      { id: OWN_WS, ownerId: 7, name: "Own", slug: "own" },
      { id: OTHER_WS, ownerId: 8, name: "Other", slug: "other" },
    ],
    memberships: [
      { id: 1, userId: 7, workspaceId: OWN_WS, role: "SUPER_ADMIN", status: "ACTIVE" },
      { id: 2, userId: 8, workspaceId: OTHER_WS, role: "SUPER_ADMIN", status: "ACTIVE" },
    ],
    clients: [
      { id: 5, workspaceId: OWN_WS, name: "Own Client", email: "own-client@example.test" },
      { id: 6, workspaceId: OTHER_WS, name: "Other Client", email: "other-client@example.test" },
    ],
    saved_slide_decks: [
      { id: 11, workspaceId: OWN_WS, userId: 7, title: "Own deck", slides: deckSlides },
      { id: 12, workspaceId: OTHER_WS, userId: 8, title: "Other deck", slides: deckSlides },
    ],
    slide_shares: [
      { id: 21, deckId: 12, sharedByUserId: 8, sharedWithEmail: "x@example.test", permission: "view", shareToken: "other-token", expiresAt: null },
      { id: 22, deckId: 11, sharedByUserId: 7, sharedWithEmail: "y@example.test", permission: "view", shareToken: "expired-token", expiresAt: new Date(Date.now() - DAY) },
      { id: 23, deckId: 11, sharedByUserId: 7, sharedWithEmail: "z@example.test", permission: "comment", shareToken: "live-token", expiresAt: new Date(Date.now() + DAY) },
    ],
    slide_comments: [
      { id: 31, deckId: 12, userId: 8, userName: "Other", content: "note", resolved: false },
    ],
    client_life_goals: [
      { id: 41, clientId: 5, workspaceId: OWN_WS, goalTitle: "Own goal", priority: "must_have" },
      { id: 42, clientId: 6, workspaceId: OTHER_WS, goalTitle: "Other goal", priority: "must_have" },
    ],
    client_session_ratings: [],
    withdrawal_triggers: [
      { id: 61, userId: 7, isRead: false },
      { id: 62, userId: 8, isRead: false },
    ],
    household_fact_finders: [
      { id: 71, clientId: 6, workspaceId: OTHER_WS, spouseName: "Other Spouse" },
    ],
    client_properties: [],
    calendar_events: [
      { id: 51, userId: 7, workspaceId: OWN_WS, googleEventId: "own-google-id", title: "Own meeting" },
      { id: 52, userId: 8, workspaceId: OTHER_WS, googleEventId: "other-google-id", title: "Other meeting" },
    ],
  });
}

beforeEach(() => {
  seed();
  invokeLLM.mockReset();
  sendSessionRatingEmail.mockClear();
  googleDelete.mockClear();
  googleUpdate.mockClear();
});

const inserts = (table: string) => fake.ops.filter(o => o.kind === "insert" && o.table === table);
const writesTo = (table: string) => fake.ops.filter(o => o.kind !== "insert" && o.table === table);

describe("assertDeckInWorkspace", () => {
  it("returns the caller's own deck", async () => {
    await expect(assertDeckInWorkspace(11, OWN_WS)).resolves.toMatchObject({ id: 11, workspaceId: OWN_WS });
  });

  it("answers NOT_FOUND for a deck in another workspace, exactly as for a missing one", async () => {
    await expect(assertDeckInWorkspace(12, OWN_WS)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(assertDeckInWorkspace(9999, OWN_WS)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("slide decks (C-2)", () => {
  it("share, getShares, addComment and getComments refuse another workspace's deck", async () => {
    await expect(caller().slides.share({ deckId: 12, email: "someone@example.test", permission: "view" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller().slides.getShares({ deckId: 12 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller().slides.addComment({ deckId: 12, content: "hi" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller().slides.getComments({ deckId: 12 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(inserts("slide_shares")).toEqual([]);
    expect(inserts("slide_comments")).toEqual([]);
  });

  it("resolveComment and removeShare go through the deck's workspace", async () => {
    await expect(caller().slides.resolveComment({ id: 31 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller().slides.removeShare({ id: 21 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(fake.tables.slide_comments!.find(c => c.id === 31)!.resolved).toBe(false);
    expect(fake.tables.slide_shares!.map(s => s.id)).toContain(21);
    await expect(caller().slides.removeShare({ id: 23 })).resolves.toEqual({ success: true });
    expect(fake.tables.slide_shares!.map(s => s.id)).not.toContain(23);
  });

  it("shares the caller's own deck, with an optional expiry that must be in the future", async () => {
    const expiresAt = new Date(Date.now() + 7 * DAY);
    const res = await caller().slides.share({ deckId: 11, email: "reader@example.test", permission: "view", expiresAt });
    expect(res.shareToken).toMatch(/^[0-9a-f]{48}$/);
    expect(inserts("slide_shares")[0]!.values).toMatchObject({ deckId: 11, expiresAt });
    await expect(caller().slides.share({ deckId: 11, email: "reader@example.test", permission: "view", expiresAt: new Date(Date.now() - 1000) }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("the public readers refuse an expired share and honour a live one", async () => {
    const anon = appRouter.createCaller({ user: null, req: {} as never, res: {} as never });
    await expect(anon.slides.getByShareToken({ token: "expired-token" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(anon.slides.getSharedDeck({ token: "expired-token" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(anon.slides.getByShareToken({ token: "live-token" })).resolves.toMatchObject({ deck: { id: 11 }, permission: "comment" });
    await expect(anon.slides.getSharedDeck({ token: "live-token" })).resolves.toMatchObject({ deck: { id: 11 } });
  });

  it("slideShareIsLive: no expiry lives, a past expiry does not", () => {
    const now = new Date("2026-09-23T12:00:00Z");
    expect(slideShareIsLive({ expiresAt: null }, now)).toBe(true);
    expect(slideShareIsLive({ expiresAt: new Date("2026-09-23T12:00:01Z") }, now)).toBe(true);
    expect(slideShareIsLive({ expiresAt: new Date("2026-09-23T12:00:00Z") }, now)).toBe(false);
    expect(slideShareIsLive({ expiresAt: "not a date" }, now)).toBe(false);
  });
});

describe("sessionRatings.aiRate (H-3)", () => {
  const llmReply = { choices: [{ message: { content: JSON.stringify({ rating: 8, explanation: "Engaged.", behaviors: ["asked"], actions: ["review"], scoreImpact: 0.3, learningApproach: "visual" }) } }] };

  it("never rates, stores or e-mails another workspace's client", async () => {
    invokeLLM.mockResolvedValue(llmReply);
    await expect(caller().sessionRatings.aiRate({ clientId: 6, sessionNotes: "notes" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(invokeLLM).not.toHaveBeenCalled();
    expect(sendSessionRatingEmail).not.toHaveBeenCalled();
    expect(inserts("client_session_ratings")).toEqual([]);
  });

  it("ignores a client-supplied workspaceId and uses the session's", async () => {
    invokeLLM.mockResolvedValue(llmReply);
    await caller().sessionRatings.aiRate({ clientId: 5, sessionNotes: "notes", workspaceId: OTHER_WS } as never);
    expect(inserts("client_session_ratings")[0]!.values).toMatchObject({ clientId: 5, workspaceId: OWN_WS });
    expect(sendSessionRatingEmail).toHaveBeenCalledTimes(1);
    expect(sendSessionRatingEmail.mock.calls[0]![0]).toMatchObject({ toEmail: "own-client@example.test" });
  });
});

describe("lifeGoals.update / delete (H-3)", () => {
  it("cannot touch another workspace's goal by id", async () => {
    await expect(caller().lifeGoals.update({ id: 42, goalTitle: "changed" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller().lifeGoals.delete({ id: 42 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(fake.tables.client_life_goals!.find(g => g.id === 42)).toMatchObject({ goalTitle: "Other goal" });
    expect(writesTo("client_life_goals")).toEqual([]);
  });

  it("updates the caller's own goal, with the workspace in the WHERE", async () => {
    await caller().lifeGoals.update({ id: 41, goalTitle: "changed" });
    expect(fake.tables.client_life_goals!.find(g => g.id === 41)).toMatchObject({ goalTitle: "changed" });
    const where = writesTo("client_life_goals")[0]!.where!;
    expect(where).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "client_life_goals", column: "id", value: 41 }),
      expect.objectContaining({ table: "client_life_goals", column: "workspaceId", value: OWN_WS }),
    ]));
  });

  it("save refuses another workspace's client", async () => {
    await expect(caller().lifeGoals.save({ clientId: 6, targetAge: 70, goalCategory: "travel", goalTitle: "Trip" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(inserts("client_life_goals")).toEqual([]);
  });
});

describe("calendarSync.deleteEvent / updateEvent (H-4)", () => {
  it("refuses another workspace's event and never calls Google", async () => {
    await expect(caller(host).calendarSync.deleteEvent({ eventId: 52 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller(host).calendarSync.updateEvent({ eventId: 52, title: "x" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(googleDelete).not.toHaveBeenCalled();
    expect(googleUpdate).not.toHaveBeenCalled();
    expect(fake.tables.calendar_events!.map(e => e.id)).toContain(52);
  });

  it("uses the stored googleEventId, never one from the request, and only for the host", async () => {
    await caller(host).calendarSync.deleteEvent({ eventId: 51, googleEventId: "other-google-id" } as never);
    expect(googleDelete).toHaveBeenCalledTimes(1);
    expect(googleDelete.mock.calls[0]![0]).toBe("own-google-id");
    expect(fake.tables.calendar_events!.map(e => e.id)).toEqual([52]);
  });

  it("a guest edits only the local copy of their own event", async () => {
    await caller(guest).calendarSync.updateEvent({ eventId: 51, title: "Renamed" });
    expect(googleUpdate).not.toHaveBeenCalled();
    expect(fake.tables.calendar_events!.find(e => e.id === 51)).toMatchObject({ title: "Renamed" });
    expect(fake.tables.calendar_events!.find(e => e.id === 52)).toMatchObject({ title: "Other meeting" });
  });
});

describe("gamification.initScore (H-3)", () => {
  it("refuses another workspace's client and writes nothing", async () => {
    await expect(caller().gamification.initScore({ clientId: 6 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(inserts("client_scores")).toEqual([]);
  });
});

describe("slides.batchGenerate (review B-1)", () => {
  it("refuses another workspace's client before any model is called", async () => {
    await expect(caller().slides.batchGenerate({ clientIds: [6], topic: "Plan" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller().slides.batchGenerate({ clientIds: [5, 6], topic: "Plan" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(invokeLLM).not.toHaveBeenCalled();
    expect(inserts("saved_slide_decks")).toEqual([]);
  });
});

describe("withdrawal.markRead / markClicked (review S-1)", () => {
  it("only touch the caller's own trigger", async () => {
    await caller().withdrawal.markRead({ triggerId: 62 });
    await caller().withdrawal.markClicked({ triggerId: 62 });
    expect(fake.tables.withdrawal_triggers!.find(t => t.id === 62)).toEqual({ id: 62, userId: 8, isRead: false });
    await caller().withdrawal.markRead({ triggerId: 61 });
    expect(fake.tables.withdrawal_triggers!.find(t => t.id === 61)).toMatchObject({ isRead: true });
  });
});

describe("willWriter (H-4)", () => {
  it("never returns another workspace's client or household", async () => {
    await expect(caller().willWriter.getFamilyContext({ clientId: 6 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller().willWriter.generate({ clientId: 6, tone: "formal" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(invokeLLM).not.toHaveBeenCalled();
    await expect(caller().willWriter.getFamilyContext({ clientId: 5 })).resolves.toMatchObject({ clientName: "Own Client" });
  });
});
