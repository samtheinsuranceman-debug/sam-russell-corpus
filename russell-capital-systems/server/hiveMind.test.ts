import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { askHive, hiveContextFor, hiveRoster, type HiveDeps } from "./hiveMind";
import { _resetHiveBuffersForTests, markRouteVisited, recentHiveEvents, recordHiveEvent, visitedRoutes } from "./hiveMemoryDb";
import { ADVISOR_NAME } from "@shared/aiAdvisor";

const USER = 4242;

type Complete = NonNullable<HiveDeps["complete"]>;
type Reply = Awaited<ReturnType<Complete>>;

/**
 * A stand-in for brainComplete: answers by the preferred provider when it is
 * in `live`, otherwise by the first live one (that is what the real chain does).
 * With nothing live it throws, as the real chain does. Records every call.
 */
function fakeBrain(live: Record<string, string>, opts: { reconcile?: string } = {}) {
  const calls: Array<{ preferProvider?: string; user: string; system: string }> = [];
  const complete: Complete = async (params) => {
    const system = params.messages.find(m => m.role === "system")?.content ?? "";
    const user = params.messages.filter(m => m.role === "user").map(m => m.content).join("\n");
    calls.push({ preferProvider: params.preferProvider, user, system });
    if (/Independent drafts/.test(user) && opts.reconcile) return { text: opts.reconcile, providerId: "reconciler", model: "r", attempted: [] } as Reply;
    const ids = Object.keys(live);
    const pick = params.preferProvider && live[params.preferProvider] !== undefined ? params.preferProvider : ids[0];
    if (pick) return { text: live[pick], providerId: pick, model: `${pick}-model`, attempted: [] } as Reply;
    throw new Error("no provider available");
  };
  return { complete, calls };
}

const members = (ids: string[], via: "env" | "vault" = "env") => async () => ids.map(providerId => ({ providerId, via }));
const quiet: HiveDeps = { factFinder: async () => "", mcpServers: async () => [] };

describe("hive mind", () => {
  beforeEach(() => {
    _resetHiveBuffersForTests();
  });

  it("every model call goes through brainComplete: the orchestrator imports no provider transport of its own", () => {
    const src = readFileSync(join(__dirname, "hiveMind.ts"), "utf8");
    expect(src).toMatch(/from "\.\/providerRegistry"/);
    for (const forbidden of ["configuredProviders", "leadModel", "invokeLLM", "fetch(", "registerHiveMemberSource", "envMemberSource"]) {
      expect(src, `hiveMind.ts must not use ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("the advisor's name is defined exactly once in shared/", () => {
    const sharedDir = join(__dirname, "..", "shared");
    const files = (readdirSync(sharedDir, { recursive: true }) as string[]).filter(f => /\.tsx?$/.test(f) && !/\.test\./.test(f));
    const definers = files.filter(f => /export const ADVISOR_NAME\b/.test(readFileSync(join(sharedDir, f), "utf8")));
    expect(definers).toEqual(["aiAdvisor.ts"]);
    expect(ADVISOR_NAME).toBe("Samuel Goldman");
  });

  it("has one address and reports every live member behind it, plus the MCP servers and verifiers", async () => {
    const r = await hiveRoster({
      members: async () => [{ providerId: "anthropic", via: "vault" }, { providerId: "openai", via: "env" }],
      mcpServers: async () => [{ label: "Perplexity", tools: 3 }],
    });
    expect(r.address).toBe("hive.ask");
    expect(r.informAddress).toBe("hive.inform");
    expect(r.members).toEqual([{ providerId: "anthropic", via: "vault" }, { providerId: "openai", via: "env" }]);
    expect(r.mcpServers).toEqual([{ label: "Perplexity", tools: 3 }]);
    expect(r.verifiers.length).toBeGreaterThan(5);
  });

  it("direct depth makes one brainComplete call, preferring the first live member; the caller never names a vendor", async () => {
    const brain = fakeBrain({ anthropic: "The Mortgage Killer result you pinned is $184,203 [mortgageKiller].", openai: "second" });
    await recordHiveEvent(USER, { kind: "calc_result", routePath: "/portal/mortgage-killer", engine: "mortgageKiller", payload: { interestSaved: 184203 }, source: "FRED MORTGAGE30US", asOf: "2026-09-19" });
    const a = await askHive(USER, { question: "How much interest do I save?", routePath: "/portal/mortgage-killer" }, { ...quiet, complete: brain.complete, members: members(["anthropic", "openai"]) });
    expect(brain.calls).toHaveLength(1);
    expect(brain.calls[0].preferProvider).toBe("anthropic");
    expect(brain.calls[0].system).toContain(ADVISOR_NAME);
    expect(brain.calls[0].system).toContain("WORKING MEMORY");
    expect(a.answeredBy).toEqual([{ providerId: "anthropic", model: "anthropic-model", role: "primary" }]);
    expect(a.citations[0]).toMatchObject({ ref: "/portal/mortgage-killer", source: "FRED MORTGAGE30US" });
    expect(a.memoryEventsUsed).toBeGreaterThanOrEqual(1);
    expect(a.fallback).toBe(false);
    expect(a.domain).toBeTruthy();
  });

  it("integrated depth asks three members through brainComplete and reconciles through it too", async () => {
    const brain = fakeBrain({ anthropic: "draft one", openai: "draft two", mistral: "draft three", cohere: "unused" }, { reconcile: "reconciled" });
    const a = await askHive(USER, { question: "Compare my options", depth: "integrated" }, { ...quiet, complete: brain.complete, members: members(["anthropic", "openai", "mistral", "cohere"]) });
    expect(a.text).toBe("reconciled");
    expect(brain.calls.map(c => c.preferProvider)).toEqual(["anthropic", "openai", "mistral", undefined]);
    expect(a.answeredBy.map(x => x.role)).toEqual(["primary", "second", "second", "reconciler"]);
    const reconcileCall = brain.calls[3];
    expect(reconcileCall.user).toContain("draft one");
    expect(reconcileCall.user).toContain("draft three");
    expect(reconcileCall.user).not.toContain("unused");
  });

  it("de-duplicates drafts when the chain answers two preferences with the same brain", async () => {
    // Only anthropic is live; asking for openai falls through the chain to anthropic again.
    const brain = fakeBrain({ anthropic: "same brain" }, { reconcile: "never needed" });
    const a = await askHive(USER, { question: "Go deeper", depth: "deeper" }, { ...quiet, complete: brain.complete, members: members(["anthropic", "openai"]) });
    expect(a.answeredBy).toEqual([{ providerId: "anthropic", model: "anthropic-model", role: "primary" }]);
    expect(a.text).toBe("same brain");
  });

  it("says so when nothing answered (there is no hosted gateway to fall back on)", async () => {
    const dark = fakeBrain({});
    const none = await askHive(USER, { question: "anything" }, { ...quiet, complete: dark.complete, members: members([]) });
    expect(none.fallback).toBe(true);
    expect(none.answeredBy).toEqual([]);
    expect(none.text).toContain("no member able to answer");
  });

  it("records the question and the answer into working memory so the next ask sees them", async () => {
    const brain = fakeBrain({ anthropic: "ok" });
    await askHive(USER, { question: "What is a MYGA?" }, { ...quiet, complete: brain.complete, members: members(["anthropic"]) });
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
