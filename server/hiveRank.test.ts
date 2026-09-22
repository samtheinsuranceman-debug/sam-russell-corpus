import { describe, expect, it } from "vitest";
import { rankMembersForDomain, type HiveMember } from "./hiveMind";

const m = (id: string, domains?: string[]): HiveMember => ({ providerId: id, label: id, via: "vault", domains, complete: async () => id });

describe("rankMembersForDomain", () => {
  it("puts members marked strong in the domain first, generalists second, other-domain members last, stable within tiers", () => {
    const members = [m("a", ["tax"]), m("b"), m("c", ["estate"]), m("d", ["estate", "insurance"]), m("e", [])];
    expect(rankMembersForDomain(members, "estate").map((x) => x.providerId)).toEqual(["c", "d", "b", "e", "a"]);
    expect(rankMembersForDomain(members, "tax").map((x) => x.providerId)).toEqual(["a", "b", "e", "c", "d"]);
  });
  it("with no domain marks at all the roster order is unchanged", () => {
    const members = [m("x"), m("y"), m("z")];
    expect(rankMembersForDomain(members, "anything").map((x) => x.providerId)).toEqual(["x", "y", "z"]);
  });
  it("does not mutate the input", () => {
    const members = [m("a", ["tax"]), m("b", ["estate"])];
    rankMembersForDomain(members, "estate");
    expect(members.map((x) => x.providerId)).toEqual(["a", "b"]);
  });
});
