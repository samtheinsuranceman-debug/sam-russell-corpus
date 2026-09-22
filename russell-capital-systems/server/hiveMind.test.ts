import { beforeEach, describe, expect, it } from "vitest";
import { askHive, hiveContextFor, hiveRoster, _setHiveSourcesForTests, type HiveMember, type HiveMemberSource } from "./hiveMind";
import { _resetHiveBuffersForTests, markRouteVisited, recentHiveEvents, recordHiveEvent, visitedRoutes } from "./hiveMemoryDb";

function member(id: string, reply: string, via: HiveMember["via"] = "env"): HiveMember {
  return { providerId: id, label: id, via, complete: async () => reply };
}
function source(id: string, members: HiveMember[], mcp: { label: string; tools: number }[] = []): HiveMemberSource {
  return { id, members: async () => members, mcpServers: async () => mcp };
}

const USER = 4242;

describe("hive mind", () => {
  beforeEach(() => {
    _resetHiveBuffersForTests();
    _setHiveSourcesForTests(null);
  });

  it("has one address and reports every member behind it, from every source, without duplicates", async () => {
    _setHiveSourcesForTests([
      source("env", [member("claude", "a"), member("grok", "b")]),
      source("vault", [member("claude", "a-vault", "vault"), member("mistral", "c", "vault")], [{ label: "Perplexity", tools: 3 }]),
    ]);
    const r = await hiveRoster();
    expect(r.address).toBe("hive.ask");
    expect(r.members.map(m => m.providerId).sort()).toEqual(["claude", "grok", "mistral"]);
    expect(r.mcpServers).toEqual([{ label: "Perplexity", tools: 3 }]);
    expect(r.verifiers.length).toBeGreaterThan(5);
  });

  it("direct depth asks one member; the answer never depends on the caller naming a vendor", async () => {
    _setHiveSourcesForTests([source("env", [member("claude", "The Mortgage Killer result you pinned is $184,203 [mortgageKiller]."), member("grok", "second")])]);
    await recordHiveEvent(USER, { kind: "calc_result", routePath: "/portal/mortgage-killer", engine: "mortgageKiller", payload: { interestSaved: 184203 }, source: "FRED MORTGAGE30US", asOf: "2026-09-19" });
    const a = await askHive(USER, { question: "How much interest do I save?", routePath: "/portal/mortgage-killer" }, { factFinder: async () => "", lead: async () => null });
    expect(a.answeredBy).toEqual([{ providerId: "claude", model: undefined, role: "primary" }]);
    expect(a.citations[0]).toMatchObject({ ref: "/portal/mortgage-killer", source: "FRED MORTGAGE30US" });
    expect(a.memoryEventsUsed).toBeGreaterThanOrEqual(1);
    expect(a.fallback).toBe(false);
    expect(a.domain).toBeTruthy();
  });

  it("integrated depth fans out to several members and reconciles through the lead", async () => {
    _setHiveSourcesForTests([source("env", [member("claude", "draft one"), member("grok", "draft two"), member("mistral", "draft three"), member("cohere", "unused")])]);
    const seen: string[] = [];
    const a = await askHive(USER, { question: "Compare my options", depth: "integrated" }, {
      factFinder: async () => "",
      lead: async (_system, user) => { seen.push(user); return { text: "reconciled", via: "claude" }; },
    });
    expect(a.text).toBe("reconciled");
    expect(a.answeredBy.map(x => x.role)).toEqual(["primary", "second", "second", "reconciler"]);
    expect(seen[0]).toContain("draft one");
    expect(seen[0]).toContain("draft three");
    expect(seen[0]).not.toContain("unused");
  });

  it("falls back to the lead/gateway when no member answers, and says so", async () => {
    _setHiveSourcesForTests([source("env", [{ providerId: "dead", label: "dead", via: "env", complete: async () => { throw new Error("401"); } }])]);
    const a = await askHive(USER, { question: "anything" }, { factFinder: async () => "", lead: async () => ({ text: "gateway said hi", via: "builtin" }) });
    expect(a.text).toBe("gateway said hi");
    expect(a.fallback).toBe(true);
    const none = await askHive(USER, { question: "anything" }, { factFinder: async () => "", lead: async () => null });
    expect(none.fallback).toBe(true);
    expect(none.text).toContain("no member able to answer");
  });

  it("records the question and the answer into working memory so the next ask sees them", async () => {
    _setHiveSourcesForTests([source("env", [member("claude", "ok")])]);
    await askHive(USER, { question: "What is a MYGA?" }, { factFinder: async () => "", lead: async () => null });
    const events = await recentHiveEvents(USER, 10);
    expect(events.map(e => e.kind)).toEqual(expect.arrayContaining(["question", "note"]));
    const ctx = await hiveContextFor(USER);
    expect(ctx.text).toContain("What is a MYGA?");
  });

  it("site map visits upsert and turn green once, then count up", async () => {
    const first = await markRouteVisited(USER, "/portal/time-machine");
    const second = await markRouteVisited(USER, "/portal/time-machine");
    expect(first.visitCount).toBe(1);
    expect(second.visitCount).toBe(2);
    const all = await visitedRoutes(USER);
    expect(all.map(v => v.routePath)).toEqual(["/portal/time-machine"]);
  });
});
