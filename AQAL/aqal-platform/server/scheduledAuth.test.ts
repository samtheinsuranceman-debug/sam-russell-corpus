import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticate: vi.fn() }));
vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: mocks.authenticate },
}));
vi.mock("./platform/config", () => ({
  CRON_SECRET: "bluehost-test-cron-secret",
}));

import { requireScheduledCron } from "./scheduledAuth";

function response() {
  const res: any = {
    code: 200,
    body: null,
    status: vi.fn((code: number) => { res.code = code; return res; }),
    json: vi.fn((body: unknown) => { res.body = body; return res; }),
  };
  return res;
}

describe("scheduled cron authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a non-retryable 403 when authentication is missing", async () => {
    mocks.authenticate.mockRejectedValue(new Error("Missing session cookie"));
    const res = response();
    expect(await requireScheduledCron({} as any, res)).toBeNull();
    expect(res.code).toBe(403);
    expect(res.body).toEqual({ error: "cron-only" });
  });

  it("rejects a valid ordinary member session", async () => {
    mocks.authenticate.mockResolvedValue({ id: 9, isCron: false });
    const res = response();
    expect(await requireScheduledCron({} as any, res)).toBeNull();
    expect(res.code).toBe(403);
  });

  it("accepts a managed cron identity with a task UID", async () => {
    const cron = { id: -1, isCron: true, taskUid: "cron-task-1" };
    mocks.authenticate.mockResolvedValue(cron);
    const res = response();
    expect(await requireScheduledCron({} as any, res)).toEqual(cron);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("accepts a matching external scheduler bearer secret without OAuth", async () => {
    const req = {
      path: "/api/scheduled/daily-reminders",
      headers: { authorization: "Bearer bluehost-test-cron-secret" },
    } as any;
    const res = response();
    const cron = await requireScheduledCron(req, res);
    expect(cron).toMatchObject({
      openId: "cron_bluehost",
      isCron: true,
      taskUid: "external:/api/scheduled/daily-reminders",
    });
    expect(mocks.authenticate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects an invalid external scheduler bearer secret", async () => {
    mocks.authenticate.mockRejectedValue(new Error("Invalid session cookie"));
    const req = { headers: { authorization: "Bearer wrong-secret" } } as any;
    const res = response();
    expect(await requireScheduledCron(req, res)).toBeNull();
    expect(res.code).toBe(403);
  });
});
