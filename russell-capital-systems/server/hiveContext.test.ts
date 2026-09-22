import { describe, expect, it } from "vitest";
import { buildHiveContext, domainForRoute, pageOpensSince, type StoredHiveEvent } from "@shared/hiveContext";

let n = 0;
function ev(partial: Partial<StoredHiveEvent> & Pick<StoredHiveEvent, "kind">, at = `2026-09-22T19:${String(n).padStart(2, "0")}:00.000Z`): StoredHiveEvent {
  n += 1;
  return { id: n, createdAt: at, ...partial };
}

describe("hiveContext", () => {
  it("pins engine outputs with their ledger and never drops them from the text", () => {
    const ctx = buildHiveContext([
      ev({ kind: "page_visit", routePath: "/portal/mortgage-killer" }),
      ev({ kind: "calc_result", routePath: "/portal/mortgage-killer", engine: "mortgageKiller", payload: { interestSaved: 184203.5, years: 30 }, source: "FRED MORTGAGE30US", asOf: "2026-09-19" }),
    ]);
    expect(ctx.pinned).toHaveLength(1);
    expect(ctx.text).toContain("PINNED mortgageKiller @ Mortgage Killer");
    expect(ctx.text).toContain("interestSaved=184203.50");
    expect(ctx.text).toContain("source: FRED MORTGAGE30US, as of 2026-09-19");
  });

  it("summarises visits most-opened first with open and close counts", () => {
    const ctx = buildHiveContext([
      ev({ kind: "page_visit", routePath: "/portal/time-machine" }),
      ev({ kind: "page_visit", routePath: "/portal/mortgage-killer" }),
      ev({ kind: "page_close", routePath: "/portal/mortgage-killer" }),
      ev({ kind: "page_visit", routePath: "/portal/mortgage-killer" }),
    ], { titles: { "/portal/time-machine": "Time Machine" } });
    expect(ctx.visits[0]).toMatchObject({ routePath: "/portal/mortgage-killer", opens: 2, closes: 1 });
    expect(ctx.visits[1].title).toBe("Time Machine");
    expect(ctx.text).toContain("Mortgage Killer ×2 (closed 1)");
  });

  it("keeps the most recent verification outcome per engine", () => {
    const ctx = buildHiveContext([
      ev({ kind: "verification", engine: "ag49Validator", outcome: "fail" }, "2026-09-22T10:00:00.000Z"),
      ev({ kind: "verification", engine: "ag49Validator", outcome: "pass" }, "2026-09-22T11:00:00.000Z"),
      ev({ kind: "verification", engine: "patentStatus", outcome: "unverified" }, "2026-09-22T11:30:00.000Z"),
    ]);
    expect(ctx.verifications).toEqual(expect.arrayContaining([
      expect.objectContaining({ engine: "ag49Validator", outcome: "pass" }),
      expect.objectContaining({ engine: "patentStatus", outcome: "unverified" }),
    ]));
  });

  it("derives the council domain from the current route, else the most-visited page", () => {
    expect(domainForRoute("/portal/mortgage-killer")).toBe("real-estate");
    expect(domainForRoute("/portal/roth-conversion")).toBe("tax");
    expect(domainForRoute("/portal/unknown-thing")).toBeUndefined();
    const ctx = buildHiveContext([ev({ kind: "page_visit", routePath: "/portal/iul-loan-optimizer" })]);
    expect(ctx.domainHint).toBe("insurance");
  });

  it("honours the limit and reports how many events it used", () => {
    const events = Array.from({ length: 80 }, (_, i) => ev({ kind: "page_visit", routePath: `/portal/p${i}` }));
    const ctx = buildHiveContext(events, { limit: 10 });
    expect(ctx.eventsUsed).toBe(10);
  });

  it("counts page opens since a timestamp for the nudge", () => {
    const events = [
      ev({ kind: "page_visit", routePath: "/portal/a" }, "2026-09-22T18:00:00.000Z"),
      ev({ kind: "page_visit", routePath: "/portal/b" }, "2026-09-22T19:00:00.000Z"),
      ev({ kind: "page_close", routePath: "/portal/b" }, "2026-09-22T19:01:00.000Z"),
    ];
    expect(pageOpensSince(events, "2026-09-22T18:30:00.000Z")).toBe(1);
  });
});
