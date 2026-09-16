/**
 * Privacy/security compliance machinery.
 *
 * These cover the pure, decidable parts — the notification clock, the media
 * threshold, the purge ordering, and the federal fallback. The database-bound
 * workflow functions are exercised for their guard conditions, which are the
 * parts that must not be got wrong: a deletion is irreversible, and a review
 * that the requester can perform on themselves is not a review.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  notificationDeadlineFor,
  requiresMediaNotice,
  NOTIFICATION_WINDOW_DAYS,
  MEDIA_NOTICE_THRESHOLD,
} from "./breachNotification";
import fs from "fs";

afterEach(() => vi.restoreAllMocks());

describe("breach notification clock", () => {
  it("runs 60 days from discovery, not from resolution", () => {
    const discovered = new Date("2026-03-01T00:00:00Z");
    const deadline = notificationDeadlineFor(discovered);
    const days = (deadline.getTime() - discovered.getTime()) / 86_400_000;
    expect(days).toBe(NOTIFICATION_WINDOW_DAYS);
    expect(NOTIFICATION_WINDOW_DAYS).toBe(60);
  });

  it("crosses month and year boundaries correctly", () => {
    expect(notificationDeadlineFor(new Date("2026-12-15T00:00:00Z")).toISOString().slice(0, 10))
      .toBe("2027-02-13");
  });
});

describe("media notice threshold", () => {
  it("triggers at 500 affected residents in one jurisdiction", () => {
    expect(requiresMediaNotice(MEDIA_NOTICE_THRESHOLD)).toBe(true);
    expect(requiresMediaNotice(MEDIA_NOTICE_THRESHOLD - 1)).toBe(false);
    expect(MEDIA_NOTICE_THRESHOLD).toBe(500);
  });

  it("does not infer a jurisdictional media duty from zero residents", () => {
    expect(requiresMediaNotice(0)).toBe(false);
  });
});

describe("purge ordering", () => {
  const SRC = fs.readFileSync("server/compliance/dataDeletion.ts", "utf-8");

  it("deletes children before parents", () => {
    const order = SRC.slice(SRC.indexOf("const PURGE_ORDER"), SRC.indexOf("] as const"));
    const idx = (t: string) => order.indexOf(`"${t}"`);
    // A foreign key points child -> parent, so the child must go first.
    expect(idx("medicationLogs")).toBeLessThan(idx("medications"));
    expect(idx("personalityResponses")).toBeLessThan(idx("personalityProfiles"));
    expect(idx("diagnosticReports")).toBeLessThan(idx("assessments"));
  });

  it("never purges the records that prove the deletion happened", () => {
    const order = SRC.slice(SRC.indexOf("const PURGE_ORDER"), SRC.indexOf("] as const"));
    // The request and the audit trail outlive the data they describe.
    expect(order).not.toContain('"deletionRequests"');
    expect(order).not.toContain('"auditLogs"');
  });

  it("audits before it destroys", () => {
    // A purge that fails partway must still be attributable.
    const executing = SRC.indexOf('"deletion.executing"');
    const purgeLoop = SRC.indexOf("for (const name of PURGE_ORDER)");
    expect(executing).toBeGreaterThan(-1);
    expect(executing).toBeLessThan(purgeLoop);
  });

  it("requires an approved request before executing", () => {
    expect(SRC).toContain('eq(deletionRequests.status, "approved")');
    expect(SRC).toContain("No approved deletion request for this user");
  });

  it("forbids self-approval", () => {
    expect(SRC).toContain("cannot be approved by its requester");
  });
});

describe("audit log", () => {
  const SRC = fs.readFileSync("server/compliance/auditLog.ts", "utf-8");

  it("resolves rather than rejecting when there is no database", async () => {
    // Behavioural, not textual: an audit write that throws would abort the
    // clinical action it was recording.
    vi.doMock("../db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    vi.resetModules();
    const { recordAudit } = await import("./auditLog");
    await expect(recordAudit({ action: "test.action" })).resolves.toBeUndefined();
  });

  it("swallows a database error instead of propagating it", async () => {
    vi.doMock("../db", () => ({
      getDb: vi.fn().mockResolvedValue({
        insert: () => { throw new Error("connection lost"); },
      }),
    }));
    vi.resetModules();
    const { recordAudit } = await import("./auditLog");
    await expect(recordAudit({ action: "test.action" })).resolves.toBeUndefined();
  });

  it("returns an empty list rather than throwing when reading with no database", async () => {
    vi.doMock("../db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    vi.resetModules();
    const { getAuditLogs } = await import("./auditLog");
    await expect(getAuditLogs()).resolves.toEqual([]);
  });

  it("records both the actor and the subject", () => {
    // "Who looked at whose record" is the question an audit asks; one id
    // cannot answer it.
    expect(SRC).toContain("actorId");
    expect(SRC).toContain("subjectId");
  });
});

describe("state rights", () => {
  it("never asks a language model to state legal rights", async () => {
    const invokeLLM = vi.fn().mockResolvedValue({ choices: [{ message: { content: "{}" } }] });
    vi.doMock("../_core/llm", () => ({ invokeLLM }));
    vi.resetModules();
    const { generateStateRights } = await import("./stateRights");

    const result = await generateStateRights("North Carolina");
    expect(invokeLLM).not.toHaveBeenCalled();
    expect(result.generated).toBe(false);
    expect(result.state).toBe("North Carolina");
    expect(result.rights.length).toBeGreaterThan(0);
    expect(result.healthDataSpecific.some(h => h.includes("HIPAA"))).toBe(true);
  });

  it("always labels itself as informational, not legal advice", async () => {
    vi.doMock("../_core/llm", () => ({
      invokeLLM: vi.fn().mockRejectedValue(new Error("no api key")),
    }));
    vi.resetModules();
    const { generateStateRights } = await import("./stateRights");

    const result = await generateStateRights("Texas");
    expect(result.disclaimer).toMatch(/not legal advice/i);
  });

  it("adds Washington's My Health My Data rights on top of the universal floor", async () => {
    vi.resetModules();
    const { generateStateRights } = await import("./stateRights");

    const base = await generateStateRights("Texas");
    const wa = await generateStateRights("Washington");
    expect(wa.laws.some(l => l.name.includes("My Health My Data"))).toBe(true);
    // Universal rights do not disappear because a state adds its own.
    for (const right of base.rights) expect(wa.rights).toContain(right);
    expect(wa.rights.length).toBeGreaterThan(base.rights.length);
  });
});
