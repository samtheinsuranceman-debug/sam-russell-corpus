import { beforeEach, describe, expect, it } from "vitest";
import { hiveGroundingMessages } from "./hiveGround";
import { _resetHiveBuffersForTests, recordHiveEvent } from "./hiveMemoryDb";

describe("hiveGroundingMessages", () => {
  beforeEach(() => _resetHiveBuffersForTests());

  it("prepends nothing for a public caller", async () => {
    expect(await hiveGroundingMessages(undefined)).toEqual([]);
    expect(await hiveGroundingMessages({ user: null })).toEqual([]);
  });

  it("prepends nothing when the user has no memory yet", async () => {
    expect(await hiveGroundingMessages({ user: { id: 4242 } })).toEqual([]);
  });

  it("prepends one system message carrying the working memory once events exist", async () => {
    await recordHiveEvent(4243, { kind: "calc_result", routePath: "/portal/mortgage-killer", engine: "mortgageKiller", payload: { interestSaved: 181_000 }, source: "mortgageKiller v4", asOf: "2026-09-22" });
    const msgs = await hiveGroundingMessages({ user: { id: 4243 } }, "/portal/mortgage-killer");
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe("system");
    expect(msgs[0].content).toMatch(/WORKING MEMORY/);
    expect(msgs[0].content).toMatch(/mortgageKiller/);
    expect(msgs[0].content).toMatch(/181,?000|181000/);
    expect(msgs[0].content).toMatch(/cite the engine or page/);
  });
});
