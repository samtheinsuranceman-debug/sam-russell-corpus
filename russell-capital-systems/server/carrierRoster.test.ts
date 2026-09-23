/**
 * Carrier roster: the owner's codes, and a status computed from what the
 * other modules actually hold, never typed.
 */
import { describe, expect, it } from "vitest";
import { CARRIER_ROSTER, carrierByCode, carrierLabel, PENDING_COST_CODES } from "../shared/carrierRoster";
import { COMPLETE_BASELINES } from "../shared/costStructure";

describe("carrier roster", () => {
  it("lists the eight carriers under the owner's codes, once each", () => {
    expect(CARRIER_ROSTER.map(r => r.code)).toEqual(["S", "N", "SY", "LF", "MT", "PC", "AR", "MO"]);
    expect(carrierLabel("SY")).toBe("Mutual Company SY");
    expect(carrierByCode("LF")?.name).toBe("Lafayette Life");
  });

  it("marks S and N cost structures held, straight from the cost machine", () => {
    expect(carrierByCode("S")?.costStructure.status).toBe("held");
    expect(carrierByCode("N")?.costStructure.status).toBe("held");
    expect(COMPLETE_BASELINES.map(b => b.carrierLabel)).toEqual(["Mutual Company N", "Mutual Company S"]);
    expect(PENDING_COST_CODES).toEqual(["PC"]);
    for (const code of ["SY", "LF", "MT", "PC", "AR", "MO"] as const) expect(carrierByCode(code)?.costStructure.status).toBe("pending");
  });

  it("carries loan terms read off illustrations, and only where a rate table was printed", () => {
    expect(carrierByCode("N")?.loanTerms.status).toBe("held");
    expect(carrierByCode("N")?.loanTerms.declaredCharged).toMatch(/3\.90%/);
    expect(carrierByCode("S")?.loanTerms.status).toBe("held");
    expect(carrierByCode("S")?.loanTerms.declaredCredited).toMatch(/TRUE WASH/);
    // Lafayette is whole life: its loan interest is not credited to the cash value.
    expect(carrierByCode("LF")?.loanTerms.kind).toBe("whole_life");
    // Pacific Life's illustration runs no distributions, so no loan table: pending, notes kept.
    expect(carrierByCode("PC")?.loanTerms.status).toBe("pending");
    expect(carrierByCode("PC")?.loanTerms.notes.length).toBeGreaterThan(0);
    for (const code of ["SY", "MT", "AR", "MO"] as const) expect(carrierByCode(code)?.loanTerms.status).toBe("pending");
  });

  it("names no client in any roster row", () => {
    expect(JSON.stringify(CARRIER_ROSTER)).not.toMatch(/Case ID \d|\bfor [A-Z]\. [A-Z][a-z]+/);
  });
});
