import { describe, it, expect } from "vitest";
import {
  STATE_DIVORCE_RULES,
  ruleForState,
  presumptiveShare,
  isCommunityProperty,
  divisionSentence,
  allStateCodes,
  RULES_VERSION,
} from "../shared/divorceStateRules";

const FIFTY_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
  "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

describe("divorce state rules — coverage", () => {
  it("covers all fifty states and DC, with no duplicates", () => {
    const codes = allStateCodes();
    expect(codes).toHaveLength(51);
    expect(new Set(codes).size).toBe(51);
    for (const s of FIFTY_STATES) expect(codes).toContain(s);
    expect(codes).toContain("DC");
  });

  it("names exactly the nine community-property states", () => {
    const community = STATE_DIVORCE_RULES.filter((r) => r.regime === "community").map((r) => r.code).sort();
    expect(community).toEqual(["AZ", "CA", "ID", "LA", "NM", "NV", "TX", "WA", "WI"]);
  });

  it("every rule has a code, a name and a regime", () => {
    for (const r of STATE_DIVORCE_RULES) {
      expect(r.code).toMatch(/^[A-Z]{2}$/);
      expect(r.name.length).toBeGreaterThan(3);
      expect(["community", "equitable", "elective"]).toContain(r.regime);
    }
  });
});

describe("divorce state rules — the refusal contract", () => {
  it("supplies a ratio ONLY for community-property states", () => {
    for (const r of STATE_DIVORCE_RULES) {
      const share = presumptiveShare(r.code);
      if (r.regime === "community") {
        expect(share).toBe(0.5);
      } else {
        // This is the assertion the whole file exists for. An equitable
        // -distribution state has no statutory ratio, so the model must be
        // handed null and forced to say so rather than invent one.
        expect(share).toBeNull();
      }
    }
  });

  it("returns null rather than guessing for an unknown state", () => {
    expect(ruleForState("ZZ")).toBeNull();
    expect(presumptiveShare("ZZ")).toBeNull();
    expect(isCommunityProperty("ZZ")).toBe(false);
    expect(divisionSentence("ZZ")).toContain("No split is assumed");
  });

  it("is case- and whitespace-insensitive on lookup", () => {
    expect(ruleForState(" tx ")?.code).toBe("TX");
    expect(ruleForState("ca")?.regime).toBe("community");
  });

  it("never prints a ratio in an equitable state's sentence", () => {
    for (const r of STATE_DIVORCE_RULES.filter((x) => x.regime !== "community")) {
      const s = divisionSentence(r.code);
      expect(s).not.toMatch(/\b\d{2}\/\d{2}\b/);
    }
  });

  it("states the 50/50 doctrine for every community state", () => {
    for (const r of STATE_DIVORCE_RULES.filter((x) => x.regime === "community")) {
      expect(divisionSentence(r.code)).toContain("50/50");
    }
  });

  it("carries a never-printed list", () => {
    expect(RULES_VERSION.neverPrinted.length).toBeGreaterThan(0);
    expect(RULES_VERSION.version).toMatch(/^\d{4}\.\d{2}\.\d+$/);
  });
});
